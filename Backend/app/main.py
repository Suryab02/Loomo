from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import auth
from app.routes import onboarding
from app.routes import jobs
from app.routes import insights
from app.utils.logging import get_logger

logger = get_logger("main")

# Create all DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Loomo API",
    description="AI powered job application tracker",
    version="1.0.0"
)

# CORS Setup via Settings
_origins = settings.CORS_ORIGINS
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
    logger.info("Root endpoint hit")
    return {"message": "Loomo API is running 🚀"}

@app.get("/health")
def health():
    return {"status": "ok"}
