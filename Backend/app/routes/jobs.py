from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_, desc, asc, nulls_last
from sqlalchemy.orm import Session
from sqlalchemy.sql import func as sqla_func

from app.constants import VALID_JOB_STATUSES
from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.utils.auth import get_current_user
from app.utils.security import scrub_database_input
from app.utils.rate_limit import require_llm_budget
from app.utils.job_dedupe import find_duplicate_job
from app.services.match_score import calculate_match
from app.services.job_parser import parse_job_text
from app.services.gmail_sync import get_gmail_jobs

router = APIRouter(prefix="/jobs", tags=["jobs"])

MAX_PARSE_INPUT = 50_000
MAX_URL_BYTES = 2_000_000


class ParseTextRequest(BaseModel):
    text: str = Field(..., max_length=MAX_PARSE_INPUT)


class ParseUrlRequest(BaseModel):
    url: str = Field(..., max_length=2048)


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


class JobPatchRequest(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    job_description: Optional[str] = None
    job_url: Optional[str] = None
    salary_range: Optional[str] = None
    location: Optional[str] = None
    platform: Optional[str] = None
    notes: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    status: Optional[str] = None
    applied_date: Optional[datetime] = None
    follow_up_date: Optional[datetime] = None
    recalculate_match: bool = False


class UpdateStatusRequest(BaseModel):
    status: str


class SnoozeRequest(BaseModel):
    days: int = Field(default=7, ge=1, le=90)


def _validate_status(status: str) -> str:
    s = status.lower().strip()
    if s not in VALID_JOB_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {sorted(VALID_JOB_STATUSES)}")
    return s


@router.post("/parse-text")
def parse_text(
    request: ParseTextRequest,
    _: User = Depends(require_llm_budget),
):
    try:
        parsed_data = parse_job_text(request.text)
        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse-url")
async def parse_job_url(
    request: ParseUrlRequest,
    _: User = Depends(require_llm_budget),
):
    raw = request.url.strip()
    if not raw.startswith(("http://", "https://")):
        raw = "https://" + raw
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            r = await client.get(
                raw,
                headers={"User-Agent": "LoomoJobParser/1.0 (+local)"},
            )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch URL: {e}")

    if r.status_code >= 400:
        raise HTTPException(status_code=400, detail="Could not fetch page")
    if len(r.content) > MAX_URL_BYTES:
        raise HTTPException(status_code=400, detail="Page too large to parse")

    soup = BeautifulSoup(r.text, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    text = text[:MAX_PARSE_INPUT]
    if len(text) < 80:
        raise HTTPException(
            status_code=400,
            detail="Not enough text extracted from this page. Try pasting the job description instead.",
        )
    try:
        return parse_job_text(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
def add_job(
    request: JobRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cleaned_data = scrub_database_input(request.model_dump())

    dup = find_duplicate_job(
        db,
        current_user.id,
        cleaned_data.get("company") or "",
        cleaned_data.get("role") or "",
        cleaned_data.get("job_url"),
    )
    if dup:
        raise HTTPException(
            status_code=409,
            detail="A similar application already exists (same URL or same company and role).",
        )

    match_score = None
    matched_skills = None
    missing_skills = None

    if request.job_description and current_user.skills:
        match = calculate_match(current_user.skills, request.job_description)
        match_score = match["match_score"]
        matched_skills = match["matched_skills"]
        missing_skills = match["missing_skills"]

    new_job = Job(
        user_id=current_user.id,
        company=cleaned_data.get("company"),
        role=cleaned_data.get("role"),
        job_description=cleaned_data.get("job_description"),
        job_url=cleaned_data.get("job_url"),
        salary_range=cleaned_data.get("salary_range"),
        location=cleaned_data.get("location"),
        platform=cleaned_data.get("platform"),
        notes=cleaned_data.get("notes"),
        contact_name=cleaned_data.get("contact_name"),
        contact_email=cleaned_data.get("contact_email"),
        match_score=match_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        status="wishlist",
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


@router.get("/")
def list_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    q: Optional[str] = Query(None, description="Search company or role"),
    status: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    sort: str = Query("created_at", pattern="^(created_at|applied_date|match_score|company)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=500),
):
    query = db.query(Job).filter(Job.user_id == current_user.id)

    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(Job.company.ilike(term), Job.role.ilike(term))
        )
    if status:
        st = _validate_status(status)
        query = query.filter(Job.status == st)
    if platform:
        query = query.filter(Job.platform.ilike(f"%{platform.strip()}%"))
    pivot = sqla_func.coalesce(Job.applied_date, Job.created_at)
    if date_from:
        query = query.filter(pivot >= date_from)
    if date_to:
        query = query.filter(pivot <= date_to)

    total = query.count()

    col = getattr(Job, sort, Job.created_at)
    if sort == "match_score":
        order_expr = asc(col) if order == "asc" else desc(col)
        query = query.order_by(nulls_last(order_expr))
    else:
        order_expr = asc(col) if order == "asc" else desc(col)
        query = query.order_by(nulls_last(order_expr))

    offset = (page - 1) * per_page
    items = query.offset(offset).limit(per_page).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/sync-gmail")
def sync_gmail(
    current_user: User = Depends(get_current_user),
):
    try:
        gmail_jobs = get_gmail_jobs()
        if isinstance(gmail_jobs, dict) and "error" in gmail_jobs:
            return gmail_jobs
        return {"jobs_found": gmail_jobs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}")
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return job


@router.patch("/{job_id}")
def patch_job(
    job_id: int,
    request: JobPatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    data = request.model_dump(exclude_unset=True, exclude={"recalculate_match"})
    recalc = request.recalculate_match

    next_company = data.get("company", job.company)
    next_role = data.get("role", job.role)
    next_url = data.get("job_url", job.job_url)
    if any(k in data for k in ("company", "role", "job_url")):
        dup = find_duplicate_job(db, current_user.id, next_company or "", next_role or "", next_url)
        if dup and dup.id != job.id:
            raise HTTPException(
                status_code=409,
                detail="Another application already matches this URL or company and role.",
            )

    if "status" in data and data["status"] is not None:
        data["status"] = _validate_status(data["status"])

    cleaned = scrub_database_input({k: v for k, v in data.items() if v is not None})
    for key, value in cleaned.items():
        setattr(job, key, value)

    if job.status == "applied" and job.applied_date is None:
        job.applied_date = datetime.now(timezone.utc)

    desc_for_match = job.job_description
    if recalc and desc_for_match and current_user.skills:
        match = calculate_match(current_user.skills, desc_for_match)
        job.match_score = match["match_score"]
        job.matched_skills = match["matched_skills"]
        job.missing_skills = match["missing_skills"]
    elif "job_description" in cleaned and cleaned["job_description"] and current_user.skills:
        match = calculate_match(current_user.skills, job.job_description or "")
        job.match_score = match["match_score"]
        job.matched_skills = match["matched_skills"]
        job.missing_skills = match["missing_skills"]

    db.commit()
    db.refresh(job)
    return job


@router.put("/{job_id}/status")
def update_status(
    job_id: int,
    request: UpdateStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    job.status = _validate_status(request.status)

    if request.status.lower() == "applied":
        job.applied_date = datetime.now(timezone.utc)

    db.commit()
    db.refresh(job)
    return job


@router.post("/{job_id}/reminder-snooze")
def snooze_reminder(
    job_id: int,
    body: SnoozeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.follow_up_snooze_until = datetime.now(timezone.utc) + timedelta(days=body.days)
    db.commit()
    db.refresh(job)
    return job


@router.post("/{job_id}/reminder-contacted")
def mark_reminder_contacted(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.follow_up_contacted = True
    job.follow_up_snooze_until = None
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}
