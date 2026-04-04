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

# Allow React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
