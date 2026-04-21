from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "NaweMusic Master Seed"
    
    # Database Configuration
    # Falls back to local SQLite if DATABASE_URL is not set in .env
    DATABASE_URL: str = "sqlite:///./aura_local.db" 
    
    # Security & Auth
    # Use a strong secret key in production for JWT generation
    SECRET_KEY: str = "your-super-secret-key-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for verification links
    
    # Email Service (Resend)
    RESEND_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "nawemusic@auraworks.co.za" # Update once domain is verified
    
    # Site URLs
    # Needed to construct the verification links sent in emails
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()