from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Job details
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    job_url = Column(String)
    job_description = Column(Text)
    salary_range = Column(String)
    location = Column(String)
    platform = Column(String)  # linkedin/wellfound/instahyre

    # Status — wishlist → applied → screening → interview → offer → rejected
    status = Column(String, default="wishlist")

    # AI generated
    match_score = Column(Integer)  # 0-100
    matched_skills = Column(String)  # comma separated
    missing_skills = Column(String)  # comma separated

    # Tracking
    applied_date = Column(DateTime(timezone=True))
    follow_up_date = Column(DateTime(timezone=True))
    follow_up_snooze_until = Column(DateTime(timezone=True), nullable=True)
    follow_up_contacted = Column(Boolean, default=False)
    notes = Column(Text)
    contact_name = Column(String)
    contact_email = Column(String)

    # Meta
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
