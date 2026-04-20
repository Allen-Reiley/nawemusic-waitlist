from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NaweMusic Master Seed"
    # Local SQLite for offline development
    DATABASE_URL: str = "sqlite:///./aura_local.db" 

settings = Settings()
