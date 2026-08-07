import os
from pydantic import BaseSettings, Field

class AIConfig(BaseSettings):
    """Configuration for AI Engine."""
    OLLAMA_HOST: str = Field(default=os.getenv("OLLAMA_HOST", "http://localhost:11434"))
    DEFAULT_TIMEOUT: int = Field(default=120)
    MAX_RETRIES: int = Field(default=3)
    
    # Memory constraints
    MAX_VRAM_GB: float = Field(default=6.0)
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

ai_config = AIConfig()
