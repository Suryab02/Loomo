from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.utils.auth import get_current_user
from pydantic import BaseModel
import os
import json
from app.services.llm_gateway import chat_completion

router = APIRouter(prefix="/insights", tags=["insights"])

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    jobs = db.query(Job).filter(Job.user_id == current_user.id).all()
    total = len(jobs)
    counts = {"applied": 0, "screening": 0, "interview": 0, "offer": 0, "rejected": 0}

    for job in jobs:
        if job.status in counts:
            counts[job.status] += 1

    response_rate = round((counts["screening"] + counts["interview"] + counts["offer"]) / counts["applied"] * 100) if counts["applied"] > 0 else 0

    return {
        "total": total,
        **counts,
        "response_rate": response_rate
    }


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
    # Tool definitions in standard OpenAI/LiteLLM format
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_application_stats",
                "description": "Returns the user's job application statistics (total, applied, interviews, etc)."
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_skill_gaps",
                "description": "Returns the top skill gaps based on the user's job applications."
            }
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
                        "status": {"type": "string", "description": "wishlist, applied, screening, interview, offer, rejected"},
                        "location": {"type": "string"}
                    },
                    "required": ["company", "role"]
                }
            }
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
                        "status": {"type": "string", "description": "wishlist, applied, screening, interview, offer, rejected"}
                    },
                    "required": ["company", "status"]
                }
            }
        }
    ]

    available_tools = {
        "get_application_stats": lambda: get_stats(db, current_user),
        "get_skill_gaps": lambda: get_keyword_gaps(db, current_user),
        "add_application": lambda company, role, status="wishlist", location="": (
            db.add(Job(user_id=current_user.id, company=company, role=role, status=status.lower(), location=location)),
            db.commit(),
            {"success": True, "message": f"Added {role} at {company}"}
        )[2],
        "update_application_status": lambda company, status: (
            db.query(Job).filter(Job.user_id == current_user.id, Job.company.ilike(f"%{company}%")).first().update_status(status.lower(), db)
            if db.query(Job).filter(Job.user_id == current_user.id, Job.company.ilike(f"%{company}%")).first()
            else {"error": "Job not found"}
        )
    }

    # Helper for the status update since the lambda got messy
    def handle_status_update(company, status):
        valid_statuses = ["wishlist", "applied", "screening", "interview", "offer", "rejected"]
        if status.lower() not in valid_statuses:
            return {"error": "Invalid status"}
        job = db.query(Job).filter(Job.user_id == current_user.id, Job.company.ilike(f"%{company}%")).first()
        if not job: return {"error": "Job not found"}
        job.status = status.lower()
        db.commit()
        return {"success": True, "message": f"Updated {company} to {status}"}

    available_tools["update_application_status"] = handle_status_update

    messages = [
        {"role": "system", "content": "You are the Loomo Career Analyst. Use tools to manage job data or explain stats. Keep responses concise (1-2 sentences)."},
        {"role": "user", "content": request.query}
    ]

    # Handle agent logic (max 5 steps to avoid loops)
    for _ in range(5):
        response = chat_completion(messages, tools=tools)
        message = response.choices[0].message
        
        # We need to append the model's message (which could contain tool calls)
        # Convert to dict for safety
        messages.append(message.model_dump(exclude_none=True))
        
        if not message.tool_calls:
            return {"reply": message.content or "Execution complete."}
        
        for tool_call in message.tool_calls:
            func_name = tool_call.function.name
            func_args = json.loads(tool_call.function.arguments)
            
            # Execute the local tool
            try:
                tool_result = available_tools[func_name](**func_args)
            except Exception as e:
                tool_result = {"error": str(e)}
            
            # Add tool output to history
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": func_name,
                "content": json.dumps(tool_result)
            })
    
    return {"reply": "I processed your request but reached my limit. Check your dashboard!"}