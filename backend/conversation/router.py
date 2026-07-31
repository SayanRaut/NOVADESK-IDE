from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.database import get_db
from database.models import User, Project, Workspace
from auth.dependencies import get_current_user
from .service import ConversationService
from pydantic import BaseModel

router = APIRouter(tags=["Conversations"])

class CreateConversationRequest(BaseModel):
    title: str
    selected_model: str
    current_agent: str = "chat"

class UpdateConversationRequest(BaseModel):
    title: str = None
    summary: str = None
    selected_model: str = None
    current_agent: str = None

@router.get("/project/{project_id}")
async def list_conversations(project_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Verify ownership
    result = await db.execute(
        select(Project)
        .join(Workspace)
        .where(Project.id == project_id, Workspace.user_id == current_user.id)
    )
    proj = result.scalar_one_or_none()
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    convos = await ConversationService.get_project_conversations(db, project_id)
    return convos

@router.post("/project/{project_id}")
async def create_conversation(project_id: int, req: CreateConversationRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project)
        .join(Workspace)
        .where(Project.id == project_id, Workspace.user_id == current_user.id)
    )
    proj = result.scalar_one_or_none()
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    convo = await ConversationService.create_conversation(db, project_id, req.title, req.selected_model, req.current_agent)
    return convo

@router.get("/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Add ownership verification in prod
    messages = await ConversationService.get_messages(db, conversation_id)
    return messages

@router.put("/{conversation_id}")
async def update_conversation(conversation_id: int, req: UpdateConversationRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    convo = await ConversationService.update_conversation(db, conversation_id, req.dict(exclude_unset=True))
    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return convo

@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    success = await ConversationService.delete_conversation(db, conversation_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return {"status": "success"}
