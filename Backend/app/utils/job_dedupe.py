import re
from sqlalchemy.orm import Session
from app.models.job import Job


def _norm(s: str | None) -> str:
    if not s:
        return ""
    s = s.lower().strip()
    s = re.sub(r"\s+", " ", s)
    return s


def find_duplicate_job(
    db: Session,
    user_id: int,
    company: str,
    role: str,
    job_url: str | None,
) -> Job | None:
    """Same URL, or same normalized company + role when URL is empty."""
    url = (job_url or "").strip()
    if url:
        existing = (
            db.query(Job)
            .filter(Job.user_id == user_id, Job.job_url == url)
            .first()
        )
        if existing:
            return existing
    c, r = _norm(company), _norm(role)
    if not c or not r:
        return None
    for job in db.query(Job).filter(Job.user_id == user_id).all():
        if _norm(job.company) == c and _norm(job.role) == r:
            return job
    return None
