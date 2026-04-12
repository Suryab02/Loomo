from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    """
    Project-wide configuration validated by Pydantic.
    """
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore" # Ignore extra env vars
    )

    # Database
    DATABASE_URL: str
    DATABASE_SSL: bool = False

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200 # 30 days (defaulting to something long for local dev)

    # AI (LiteLLM / Gemini)
    GEMINI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gemini/gemini-1.5-flash"
    LLM_MAX_TOKENS: int = 2048

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Gmail (Optional)
    GMAIL_USER: Optional[str] = None
    GMAIL_APP_PASSWORD: Optional[str] = None
    GMAIL_LABEL: str = "Loomo"

# Global settings instance
settings = Settings()
