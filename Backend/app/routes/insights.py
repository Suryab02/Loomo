from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.utils.auth import get_current_user
from pydantic import BaseModel
import google.generativeai as genai
import os
import json

router = APIRouter(prefix="/insights", tags=["insights"])

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    jobs = db.query(Job).filter(Job.user_id == current_user.id).all()
    total = len(jobs)
    applied = 0
    screening = 0
    interview = 0
    offer = 0
    rejected = 0

    for job in jobs:
        if job.status == "applied":
            applied += 1
        elif job.status == "screening":
            screening += 1
        elif job.status == "interview":
            interview += 1
        elif job.status == "offer":
            offer += 1
        elif job.status == "rejected":
            rejected += 1

    response_rate = round((screening + interview + offer) / applied * 100) if applied > 0 else 0

    return {
        "total": total,
        "applied": applied,
        "screening": screening,
        "interview": interview,
        "offer": offer,
        "rejected": rejected,
        "response_rate": response_rate
    }


@router.get("/platforms")
def get_platform_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    jobs = db.query(Job).filter(Job.user_id == current_user.id).all()
    
    platform_counts = {}
    for job in jobs:
        if job.platform:
            platform_counts[job.platform] = platform_counts.get(job.platform, 0) + 1

    return platform_counts


@router.get("/keywords")
def get_keyword_gaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    query: str

@router.post("/chat")
def chat_with_agent(
    request: ChatQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # AGENT TOOL 1
    def get_application_stats() -> dict:
        """Returns the user's job application statistics including total jobs, applied jobs, interviews, offers, and rejections."""
        return get_stats(db, current_user)

    # AGENT TOOL 2
    def get_skill_gaps() -> dict:
        """Returns the top skills the user is missing based on rejected or poorly matched jobs."""
        return get_keyword_gaps(db, current_user)

    # AGENT TOOL 3
    def add_application(company: str, role: str, status: str = "wishlist", location: str = "") -> dict:
        """Adds a new job application tracking record to the user's database."""
        new_job = Job(
            user_id=current_user.id,
            company=company,
            role=role,
            status=status.lower(),
            location=location
        )
        db.add(new_job)
        db.commit()
        db.refresh(new_job)
        return {"success": True, "message": f"Added {role} at {company} (Status: {status})"}

    # AGENT TOOL 4
    def update_application_status(company: str, status: str) -> dict:
        """Updates the status of an existing job application. Status MUST be one of: wishlist, applied, screening, interview, offer, rejected."""
        valid_statuses = ["wishlist", "applied", "screening", "interview", "offer", "rejected"]
        if status.lower() not in valid_statuses:
            return {"error": "Invalid status. Must be wishlist, applied, screening, interview, offer, or rejected."}
            
        job = db.query(Job).filter(Job.user_id == current_user.id, Job.company.ilike(f"%{company}%")).first()
        if not job:
            return {"error": f"Could not find an application for company matching '{company}'."}
            
        old_status = job.status
        job.status = status.lower()
        db.commit()
        return {"success": True, "message": f"Updated {company} from {old_status} to {status}!"}

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        tools=[get_application_stats, get_skill_gaps, add_application, update_application_status],
        system_instruction="You are the DeskHunt AI Career Analyst. You have tools to read data OR write/modify database data. When the user asks you to add a job or update a status, use your database tools to execute the action immediately, then confirm to the user what you did. Keep all your conversational answers to 1-2 punchy and helpful sentences max."
    )
    
    # We enable automatic function calling so the AI executes the Python functions above!
    chat = model.start_chat(enable_automatic_function_calling=True)
    response = chat.send_message(request.query)
    
    return {"reply": response.text}