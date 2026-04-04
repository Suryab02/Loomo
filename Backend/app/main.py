import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import auth
from app.routes import onboarding
from app.routes import jobs
from app.routes import insights

# Create all DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Loomo API",
    description="AI powered job application tracker",
    version="1.0.0"
)

# Comma-separated origins, e.g. CORS_ORIGINS=https://app.example.com,http://localhost:5173
# Use * only for local dev if needed.
_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").strip()
_cors_list = [o.strip() for o in _origins.split(",") if o.strip()] if _origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_list or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(jobs.router)
app.include_router(insights.router)

@app.get("/")
def root():
    return {"message": "Loomo API is running 🚀"}

@app.get("/health")
def health():
    return {"status": "ok"}
