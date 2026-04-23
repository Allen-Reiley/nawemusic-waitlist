from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "NaweMusic Master Seed"
    
    # Database Configuration
    DATABASE_URL: str = "sqlite:///./aura_local.db" 
    
    # Security & Auth
    SECRET_KEY: str = "your-super-secret-key-change-me"
    # This must match what you have in your Render Env Vars and Frontend .env
    ADMIN_SECRET_KEY: str = "placeholder-key-for-local-dev" 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 
    
    # Email Service (Resend)
    RESEND_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "nawemusic@auraworks.co.za"
    
    # Site URLs
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()