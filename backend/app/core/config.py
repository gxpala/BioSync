import os
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mabicons Attendance"
    COMPANY_NAME: str = "Mabicons Technosoft Pvt Ltd"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mabicons_super_secret_jwt_key_2026_production_grade_change_in_prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days token

    # Database: Default to SQLite for easy out-of-box local run, PostgreSQL supported via env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./mabicons_attendance.db")

    # CORS origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
    ]

    class Config:
        case_sensitive = True

settings = Settings()
