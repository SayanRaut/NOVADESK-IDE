import secrets
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.models import RefreshToken

logger = logging.getLogger(__name__)

def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)

class SessionService:
    @staticmethod
    async def create_refresh_token(db: AsyncSession, user_id: int, days_valid: int = 30) -> str:
        token_str = generate_refresh_token()
        expires_at = (datetime.now(timezone.utc) + timedelta(days=days_valid)).replace(tzinfo=None)
        
        db_token = RefreshToken(
            user_id=user_id,
            token=token_str,
            expires_at=expires_at
        )
        db.add(db_token)
        await db.commit()
        await db.refresh(db_token)
        
        return token_str

    @staticmethod
    async def validate_refresh_token(db: AsyncSession, token_str: str) -> RefreshToken:
        result = await db.execute(select(RefreshToken).where(RefreshToken.token == token_str))
        token_obj = result.scalar_one_or_none()
        
        if not token_obj:
            logger.warning("Invalid refresh token attempted.")
            return None
            
        if token_obj.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            logger.warning("Expired refresh token attempted.")
            await db.delete(token_obj)
            await db.commit()
            return None
            
        return token_obj

    @staticmethod
    async def revoke_refresh_token(db: AsyncSession, token_str: str) -> bool:
        result = await db.execute(select(RefreshToken).where(RefreshToken.token == token_str))
        token_obj = result.scalar_one_or_none()
        
        if token_obj:
            await db.delete(token_obj)
            await db.commit()
            return True
        return False

    @staticmethod
    async def revoke_all_user_tokens(db: AsyncSession, user_id: int):
        result = await db.execute(select(RefreshToken).where(RefreshToken.user_id == user_id))
        tokens = result.scalars().all()
        for t in tokens:
            await db.delete(t)
        await db.commit()
