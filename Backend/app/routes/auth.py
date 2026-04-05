from typing import Optional

import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.utils.auth import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=72)
    full_name: str = Field(..., min_length=2, max_length=120)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=1, max_length=72)


class SettingsRequest(BaseModel):
    gemini_api_key: Optional[str] = Field(default=None, max_length=255)


def _clean_email(email: str) -> str:
    cleaned = email.strip().lower()
    if not EMAIL_PATTERN.match(cleaned):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    return cleaned


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "current_role": user.current_role,
        "current_company": user.current_company,
        "skills": user.skills,
        "target_role": user.target_role,
        "target_location": user.target_location,
        "work_type": user.work_type,
        "expected_ctc": user.expected_ctc,
        "notice_period": user.notice_period,
        "platforms": user.platforms,
        "onboarding_complete": user.onboarding_complete,
        "gemini_api_key": user.gemini_api_key,
    }


@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    email = _clean_email(request.email)
    full_name = request.full_name.strip()

    user = db.query(User).filter(User.email == email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=email,
        password_hash=hash_password(request.password),
        full_name=full_name,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"user_id": new_user.id, "email": new_user.email})
    return {"access_token": token, "token_type": "bearer", "user": _serialize_user(new_user)}


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    email = _clean_email(request.email)
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"user_id": user.id, "email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": _serialize_user(user)}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return _serialize_user(current_user)


@router.put("/settings")
def update_settings(
    request: SettingsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cleaned_key = (request.gemini_api_key or "").strip()
    current_user.gemini_api_key = cleaned_key or None
    db.commit()
    return {"ok": True}
