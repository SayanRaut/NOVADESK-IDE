import os


class Config:
    # Point this at your cloudflared tunnel URL in production;
    # falls back to localhost for local testing.
    OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
    MODEL = os.getenv("PLANNER_MODEL", "qwen3.5:9b")
    TEMPERATURE = 0.2          # low temp — you want consistent, parseable plans, not creativity
    MAX_RETRIES = 3            # how many times to ask the model to fix malformed JSON
    TIMEOUT = 60                # seconds
