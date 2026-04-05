from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String)

    # Extracted from resume by Gemini AI
    current_role = Column(String)
    years_experience = Column(String)
    current_company = Column(String)
    skills = Column(String)  # comma separated

    # Job hunt preferences
    target_role = Column(String)
    target_location = Column(String)
    work_type = Column(String)  # remote/hybrid/onsite
    expected_ctc = Column(String)
    notice_period = Column(String)
    platforms = Column(String)  # comma separated
    gemini_api_key = Column(String, nullable=True) # User's own AI key for parsing

    # Meta
    onboarding_complete = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
