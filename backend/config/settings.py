from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App
    APP_NAME: str = "NovaDesk API"
    DEBUG: bool = True
    API_ORIGIN: str = "http://127.0.0.1:8000"
    DESKTOP_CALLBACK_SCHEME: str = "novadesk"
    CORS_ORIGINS: str = "http://localhost:5173"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./nova_desk.db"
    

    # Security
    SECRET_KEY: str = "change-this-before-deployment"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://127.0.0.1:8000/api/auth/google/callback"
    
    # AI Providers
    OLLAMA_HOST: str = "http://localhost:11434"
    DEFAULT_MODEL: str = "deepseek-r1:5b"
    TEMPERATURE: float = 0.2
    MAX_TOKENS: int = 32768
    TOP_P: float = 0.95



    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
