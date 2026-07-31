from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User

class UserService:
    @staticmethod
    async def update_preferences(db: AsyncSession, user_id: int, theme: str, model: str):
        user = await db.get(User, user_id)
        if user:
            user.selected_theme = theme
            prefs = dict(user.preferences or {})
            prefs["model"] = model
            user.preferences = prefs
            await db.commit()
            await db.refresh(user)
        return user

    @staticmethod
    async def update_shortcuts(db: AsyncSession, user_id: int, shortcuts: dict):
        user = await db.get(User, user_id)
        if user:
            user.keyboard_shortcuts = shortcuts
            await db.commit()
            await db.refresh(user)
        return user
