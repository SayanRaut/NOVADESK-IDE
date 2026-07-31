from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Dict, Any

from database.database import get_db
from database.models import User
from auth.dependencies import get_current_user
from .service import UserService

router = APIRouter(tags=["Users"])

class UpdatePreferencesRequest(BaseModel):
    theme: str
    model: str

class UpdateShortcutsRequest(BaseModel):
    shortcuts: Dict[str, Any]

@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "avatar": current_user.avatar,
        "plan": current_user.plan,
        "preferences": {
            "theme": current_user.selected_theme,
            "model": current_user.preferences.get("model", "default") if current_user.preferences else "default"
        },
        "keyboard_shortcuts": current_user.keyboard_shortcuts
    }

@router.put("/me/preferences")
async def update_my_preferences(req: UpdatePreferencesRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user = await UserService.update_preferences(db, current_user.id, req.theme, req.model)
    return {"status": "success", "theme": user.selected_theme, "model": user.selected_ai_model}

@router.put("/me/shortcuts")
async def update_my_shortcuts(req: UpdateShortcutsRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user = await UserService.update_shortcuts(db, current_user.id, req.shortcuts)
    return {"status": "success", "keyboard_shortcuts": user.keyboard_shortcuts}
