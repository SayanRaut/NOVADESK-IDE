from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from database.database import get_db
from database.models import User
from auth.dependencies import get_current_user
from .service import AnalyticsService

router = APIRouter(tags=["Analytics"])

class LogUsageRequest(BaseModel):
    action: str
    model_used: Optional[str] = None
    latency_ms: Optional[int] = None
    credits_used: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    provider: Optional[str] = None
    conversation_id: Optional[int] = None
    error: Optional[str] = None

@router.post("/log")
async def log_usage(req: LogUsageRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # This endpoint is primarily for internal tracking but could be called directly by the desktop client if needed
    log = await AnalyticsService.log_usage(
        db,
        user_id=current_user.id,
        action=req.action,
        model_used=req.model_used,
        latency_ms=req.latency_ms,
        credits_used=req.credits_used,
        input_tokens=req.input_tokens,
        output_tokens=req.output_tokens,
        provider=req.provider,
        conversation_id=req.conversation_id,
        error=req.error
    )
    return {"status": "success", "log_id": log.id}
