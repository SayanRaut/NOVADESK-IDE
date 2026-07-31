from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Analytics

class AnalyticsService:
    @staticmethod
    async def log_usage(
        db: AsyncSession, 
        user_id: int, 
        action: str, 
        model_used: str = None, 
        latency_ms: int = None, 
        credits_used: int = 0,
        input_tokens: int = 0,
        output_tokens: int = 0,
        provider: str = None,
        conversation_id: int = None,
        error: str = None
    ):
        log_entry = Analytics(
            user_id=user_id,
            action=action,
            model_used=model_used,
            latency_ms=latency_ms,
            credits_used=credits_used,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            provider=provider,
            conversation_id=conversation_id,
            error=error
        )
        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)
        return log_entry
