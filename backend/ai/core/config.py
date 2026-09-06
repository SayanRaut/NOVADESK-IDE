import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class AIConfig(BaseSettings):
    """Configuration for AI Engine."""
    GEMINI_API_KEY: str = Field(default=os.getenv("GEMINI_API_KEY", ""))
    DEFAULT_MODEL: str = Field(default="gemini-2.5-flash")
    OLLAMA_HOST: str = Field(default=os.getenv("OLLAMA_HOST", "http://localhost:11434"))
    DEFAULT_TIMEOUT: int = Field(default=120)
    MAX_RETRIES: int = Field(default=3)
    
    # Cloud model: zero VRAM constraints
    MAX_VRAM_GB: float = Field(default=6.0)
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8', extra='ignore')

ai_config = AIConfig()
