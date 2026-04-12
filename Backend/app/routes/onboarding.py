from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_user
from app.services.resume_parser import parse_resume
from pypdf import PdfReader
import io
from pydantic import BaseModel
from app.utils.logging import get_logger

logger = get_logger("onboarding")

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

class PreferencesRequest(BaseModel):
    target_role: str
    work_type: str       # remote/hybrid/onsite
    target_location: str
    expected_ctc: str
    notice_period: str
    platforms: str       # "linkedin, wellfound, instahyre"

@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Uploading and parsing resume for user {current_user.id}")
    contents = await file.read()
    pdf = PdfReader(io.BytesIO(contents))
    text = ""
    for page in pdf.pages:
      text = text + page.extract_text()

    geminiText = parse_resume(text)
    current_user.current_role = geminiText["current_role"]
    current_user.current_company = geminiText["current_company"]
    current_user.years_experience = geminiText["years_experience"]
    current_user.skills = geminiText["skills"]

    db.commit()
    db.refresh(current_user)


    return geminiText


@router.post("/preferences")
def save_preferences(
    request: PreferencesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.target_role = request.target_role
    current_user.work_type = request.work_type
    current_user.target_location = request.target_location
    current_user.expected_ctc = request.expected_ctc
    current_user.notice_period = request.notice_period
    current_user.platforms = request.platforms
    current_user.onboarding_complete = True

    db.commit()
    db.refresh(current_user)

    logger.info(f"Onboarding preferences saved for user {current_user.id}")
    return {"message": "Onboarding complete!"}