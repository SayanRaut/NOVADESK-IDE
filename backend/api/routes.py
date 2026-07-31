from fastapi import APIRouter
from auth.router import router as auth_router
from workspace.router import router as workspace_router
from projects.router import router as projects_router
from conversation.router import router as conversation_router
from api.ai import router as ai_router
from users.router import router as users_router

from analytics.router import router as analytics_router
from chat.router import router as chat_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth")
router.include_router(workspace_router, prefix="/workspaces")
router.include_router(projects_router, prefix="/projects")
router.include_router(conversation_router, prefix="/conversations")
router.include_router(ai_router, prefix="/ai")
router.include_router(users_router, prefix="/users")

router.include_router(analytics_router, prefix="/usage")
router.include_router(chat_router, prefix="/chat")

@router.get("/")
async def root():
    return {"status": "online", "service": "NovaDesk IDE Backend API"}

@router.get("/health")
async def health_check():
    return {"status": "healthy"}
