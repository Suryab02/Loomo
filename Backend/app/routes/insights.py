from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.constants import VALID_JOB_STATUSES
from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.utils.auth import get_current_user
from app.utils.security import security_gateway
from app.utils.rate_limit import require_llm_budget
from app.services.llm_gateway import chat_completion
import json

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    jobs = db.query(Job).filter(Job.user_id == current_user.id).all()
    total = len(jobs)
    counts = {
        "wishlist": 0,
        "applied": 0,
        "screening": 0,
        "interview": 0,
        "offer": 0,
        "rejected": 0,
    }

    for job in jobs:
        if job.status in counts:
            counts[job.status] += 1

    response_rate = (
        round(
            (counts["screening"] + counts["interview"] + counts["offer"])
            / counts["applied"]
            * 100,
        )
        if counts["applied"] > 0
        else 0
    )

    wishlist_to_applied_rate = (
        round(counts["applied"] / counts["wishlist"] * 100) if counts["wishlist"] > 0 else 0
    )

    return {
        "total": total,
        **counts,
        "response_rate": response_rate,
        "wishlist_to_applied_rate": wishlist_to_applied_rate,
    }


@router.get("/platforms")
def get_platforms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    jobs = db.query(Job).filter(Job.user_id == current_user.id).all()
    out = {}
    for job in jobs:
        label = (job.platform or "").strip() or "Other"
        out[label] = out.get(label, 0) + 1
    return out


@router.get("/keywords")
def get_keyword_gaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    jobs = db.query(Job).filter(Job.user_id == current_user.id).all()
    skill_counts = {}
    for job in jobs:
        if job.missing_skills:
            for skill in job.missing_skills.split(","):
                skill = skill.strip()
                if skill:
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1

    top_gaps = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    return {"keyword_gaps": [{"skill": s, "count": c} for s, c in top_gaps]}


class ChatQuery(BaseModel):
    query: str = Field(..., max_length=4000)


def _add_application_impl(db: Session, current_user: User, company: str, role: str, status: str = "wishlist", location: str = ""):
    st = status.lower().strip()
    if st not in VALID_JOB_STATUSES:
        return {"error": f"Invalid status. Use one of: {sorted(VALID_JOB_STATUSES)}"}
    job = Job(
        user_id=current_user.id,
        company=company,
        role=role,
        status=st,
        location=location or "",
    )
    if st == "applied":
        job.applied_date = datetime.now(timezone.utc)
    db.add(job)
    db.commit()
    db.refresh(job)
    return {"success": True, "message": f"Added {role} at {company}"}


@router.post("/chat")
def chat_with_agent(
    request: ChatQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_llm_budget),
):
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_application_stats",
                "description": "Returns the user's job application statistics (total, applied, interviews, etc).",
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_skill_gaps",
                "description": "Returns the top skill gaps based on the user's job applications.",
            },
        },
        {
            "type": "function",
            "function": {
                "name": "add_application",
                "description": "Adds a new job application to the database.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "company": {"type": "string"},
                        "role": {"type": "string"},
                        "status": {
                            "type": "string",
                            "description": "wishlist, applied, screening, interview, offer, rejected",
                        },
                        "location": {"type": "string"},
                    },
                    "required": ["company", "role"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "update_application_status",
                "description": "Updates the status of an existing job application.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "company": {"type": "string"},
                        "status": {
                            "type": "string",
                            "description": "wishlist, applied, screening, interview, offer, rejected",
                        },
                    },
                    "required": ["company", "status"],
                },
            },
        },
    ]

    available_tools = {
        "get_application_stats": lambda: get_stats(db, current_user),
        "get_skill_gaps": lambda: get_keyword_gaps(db, current_user),
        "add_application": lambda company, role, status="wishlist", location="": _add_application_impl(
            db, current_user, company, role, status, location
        ),
    }

    def handle_status_update(company, status):
        st = status.lower().strip()
        if st not in VALID_JOB_STATUSES:
            return {"error": "Invalid status"}
        job = (
            db.query(Job)
            .filter(Job.user_id == current_user.id, Job.company.ilike(f"%{company}%"))
            .first()
        )
        if not job:
            return {"error": "Job not found"}
        job.status = st
        if st == "applied" and job.applied_date is None:
            job.applied_date = datetime.now(timezone.utc)
        db.commit()
        return {"success": True, "message": f"Updated {company} to {status}"}

    available_tools["update_application_status"] = handle_status_update

    sanitized_query = security_gateway(request.query)

    messages = [
        {
            "role": "system",
            "content": (
                "You are the Loomo Career Analyst. Your world is strictly limited to job application data, "
                "resume matching, and career coaching. \n\n"
                "STRICT RULES:\n"
                "1. ONLY discuss career-related topics, your user's job applications, or resume metadata.\n"
                "2. If a user asks about anything else (world news, weather, coding unrelated to their job hunt, etc.), "
                "politely refuse by saying: 'I am your Career Co-pilot, focused only on your professional journey. Let\\'s get back to your job hunt!'.\n"
                "3. Use tools to manage job data or explain stats. Keep responses concise (1-2 sentences)."
            ),
        },
        {"role": "user", "content": sanitized_query},
    ]

    for _ in range(5):
        response = chat_completion(messages, tools=tools)
        message = response.choices[0].message

        messages.append(message.model_dump(exclude_none=True))

        if not message.tool_calls:
            return {"reply": message.content or "Execution complete."}

        for tool_call in message.tool_calls:
            func_name = tool_call.function.name
            func_args = json.loads(tool_call.function.arguments)

            try:
                tool_result = available_tools[func_name](**func_args)
            except Exception as e:
                tool_result = {"error": str(e)}

            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": func_name,
                    "content": json.dumps(tool_result),
                }
            )

    return {"reply": "I processed your request but reached my limit. Check your dashboard!"}


@router.get("/reminders")
def get_followup_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    stale_jobs = (
        db.query(Job)
        .filter(
            Job.user_id == current_user.id,
            Job.status == "applied",
            Job.applied_date.isnot(None),
            Job.applied_date <= seven_days_ago,
            or_(Job.follow_up_contacted.is_(False), Job.follow_up_contacted.is_(None)),
            or_(Job.follow_up_snooze_until.is_(None), Job.follow_up_snooze_until <= now),
        )
        .all()
    )

    return stale_jobs


@router.post("/cover-letter/{job_id}")
def generate_cover_letter(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_llm_budget),
):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        return {"error": "Job not found"}

    skills = current_user.skills or "Experienced Professional"
    target = current_user.target_role or job.role

    messages = [
        {
            "role": "system",
            "content": "You are a world-class career coach and professional writer. Your goal is to write a highly persuasive, personalized cover letter that highlights why a candidate is the perfect fit for a specific role.",
        },
        {
            "role": "user",
            "content": f"""
            Draft a personalized cover letter for the following job using the candidate's skills.

            ROLE: {job.role}
            COMPANY: {job.company}
            JOB DESCRIPTION: {job.job_description}

            CANDIDATE'S SKILLS: {skills}
            CANDIDATE'S TARGET ROLE: {target}

            REQUIREMENTS:
            - Professional yet enthusiastic tone.
            - Focus on how the CANDIDATE'S SKILLS specifically solve the needs in the JOB DESCRIPTION.
            - Keep it under 300 words.
            - Use [Your Name] as a placeholder for the signature.
            - Do NOT include placeholders like [Date] or [Company Address] — start directly with the salutation.
        """,
        },
    ]

    try:
        response = chat_completion(messages)
        return {"cover_letter": response.choices[0].message.content}
    except Exception as e:
        return {"error": f"Failed to generate cover letter: {str(e)}"}


@router.post("/follow-up-email/{job_id}")
def generate_followup_email(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_llm_budget),
):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        return {"error": "Job not found"}

    name = current_user.full_name or "Professional Candidate"

    messages = [
        {
            "role": "system",
            "content": "You are a professional career advisor assisting a candidate with a follow-up email after a job application.",
        },
        {
            "role": "user",
            "content": f"""
            Draft a polite and professional follow-up email for the following job.
            It's been over a week since the application was submitted.

            ROLE: {job.role}
            COMPANY: {job.company}

            CANDIDATE: {name}

            REQUIREMENTS:
            - Concise and respectful.
            - Reiterate interest in the position.
            - Under 150 words.
            - Use [Your Name] as a placeholder for the signature.
        """,
        },
    ]

    try:
        response = chat_completion(messages)
        return {"follow_up_email": response.choices[0].message.content}
    except Exception as e:
        return {"error": f"Failed to generate follow-up: {str(e)}"}
