from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from database.database import get_db
from database.models import User

router = APIRouter(tags=["AI"])


class ChatContext(BaseModel):
    active_file: str = ""
    active_file_content: str = Field(default="", max_length=30_000)
    selected_code: str = Field(default="", max_length=12_000)
    open_files: list[str] = Field(default_factory=list, max_length=20)
    project_tree: str = Field(default="", max_length=12_000)
    git_status: str = Field(default="", max_length=2_000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=40_000)
    model_id: str = "gemini_flash_fast"
    mode: Literal["chat", "planner", "coding", "auto"] = "chat"
    context: ChatContext = Field(default_factory=ChatContext)


@router.get("/models")
async def get_models() -> dict[str, list[dict[str, object]]]:
    """The desktop app renders this catalog; it never hardcodes provider details."""
    models = [
        {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro"},
        {"id": "deepseek-r1:1.5b", "name": "Ollama DeepSeek R1 1.5B"},
        {"id": "deepseek-r1:7b", "name": "Ollama DeepSeek R1 7B"}
    ]
    return {"models": models}


@router.get("/credits")
async def get_credits(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    # Credits are unused in the Ollama refactoring
    return {
        "used": 0,
        "remaining": 100,
        "daily_limit": 100,
        "reset_time": "2099-12-31T23:59:59"
    }


@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Non-streaming alternative for diagnostics and integrations."""
    return {"agent": "ChatAssistant", "response": "Use WebSocket for chat."}

class PlanRequest(BaseModel):
    request: str
    context: dict = Field(default_factory=dict)

@router.post("/plan")
async def plan(
    request: PlanRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    from ai.planner import Planner
    from ai.providers.gemini import GeminiProvider
    from ai.providers.ollama import OllamaProvider
    
    prefs = current_user.preferences or {}
    model_id = prefs.get("model", "deepseek-r1:1.5b")
    if "gemini" in model_id.lower():
        provider = GeminiProvider()
    else:
        provider = OllamaProvider(model_name=model_id)
        
    planner = Planner(provider)
    result = await planner.create_plan(request.request, request.context)
    return result.dict()

class ExecuteRequest(BaseModel):
    task: dict
    context: dict = Field(default_factory=dict)

@router.post("/execute")
async def execute(
    request: ExecuteRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    from ai.executor import Executor
    from ai.providers.gemini import GeminiProvider
    from ai.providers.ollama import OllamaProvider
    
    prefs = current_user.preferences or {}
    model_id = prefs.get("model", "deepseek-r1:1.5b")
    if "gemini" in model_id.lower():
        provider = GeminiProvider()
    else:
        provider = OllamaProvider(model_name=model_id)
        
    executor = Executor(provider)
    result = await executor.execute_task(request.task, request.context)
    return result.dict()
