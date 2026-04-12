from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user
from app.utils.logging import get_logger
from pydantic import BaseModel, EmailStr

logger = get_logger("auth")
router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SettingsUpdate(BaseModel):
    gemini_api_key: str

@router.post("/register")
def register(request: UserRegister, db: Session = Depends(get_db)):
    logger.info(f"Registering new user: {request.email}")
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        logger.warning(f"Registration failed: User {request.email} already exists")
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_access_token({"user_id": new_user.id})
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name
        }
    }

@router.post("/login")
def login(request: UserLogin, db: Session = Depends(get_db)):
    logger.info(f"Login attempt: {request.email}")
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        logger.warning(f"Login failed: Invalid credentials for {request.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"user_id": user.id})
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "user": user # sqlalchemy object serializes fine with fastapi
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/settings")
def update_settings(request: SettingsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Updating settings for user: {current_user.email}")
    current_user.gemini_api_key = request.gemini_api_key
    db.commit()
    db.refresh(current_user)
    return {"ok": True}
