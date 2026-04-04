from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.utils.auth import get_current_user
from app.utils.security import security_gateway, scrub_database_input
from app.services.match_score import calculate_match
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.services.job_parser import parse_job_text
from app.services.gmail_sync import get_gmail_jobs

router = APIRouter(prefix="/jobs", tags=["jobs"])

class ParseTextRequest(BaseModel):
    text: str

class JobRequest(BaseModel):
    company: str
    role: str
    job_description: Optional[str] = None
    job_url: Optional[str] = None
    salary_range: Optional[str] = None
    location: Optional[str] = None
    platform: Optional[str] = None
    notes: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None

class UpdateStatusRequest(BaseModel):
    status: str  # wishlist/applied/screening/interview/offer/rejected

@router.post("/parse-text")
def parse_text(
    request: ParseTextRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        parsed_data = parse_job_text(request.text)
        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def add_job(
    request: JobRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Scrub PII from job data before it touches the DB
    cleaned_data = scrub_database_input(request.model_dump())
    
    # Calculate match score if job description provided
    match_score = None
    matched_skills = None
    missing_skills = None

    if request.job_description and current_user.skills:
        match = calculate_match(current_user.skills, request.job_description)
        match_score = match["match_score"]
        matched_skills = match["matched_skills"]
        missing_skills = match["missing_skills"]

    # Create new job
    new_job = Job(
        user_id=current_user.id,
        company=cleaned_data.get('company'),
        role=cleaned_data.get('role'),
        job_description=cleaned_data.get('job_description'),
        job_url=cleaned_data.get('job_url'),
        salary_range=cleaned_data.get('salary_range'),
        location=cleaned_data.get('location'),
        platform=cleaned_data.get('platform'),
        notes=cleaned_data.get('notes'),
        contact_name=cleaned_data.get('contact_name'),
        contact_email=cleaned_data.get('contact_email'),
        match_score=match_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        status="wishlist"
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@router.get("/")
def get_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    jobs = db.query(Job).filter(Job.user_id == current_user.id).all()
    return jobs


@router.get("/{job_id}")
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return job

@router.put("/{job_id}/status")
def update_status(
    job_id: int,
    request: UpdateStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    job.status = request.status

    if request.status == "applied":
        job.applied_date = datetime.utcnow()

    db.commit()
    db.refresh(job)
    return job

@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}

@router.get("/sync-gmail")
def sync_gmail(
    current_user: User = Depends(get_current_user)
):
    try:
        gmail_jobs = get_gmail_jobs()
        if isinstance(gmail_jobs, dict) and "error" in gmail_jobs:
            return gmail_jobs
        return {"jobs_found": gmail_jobs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))