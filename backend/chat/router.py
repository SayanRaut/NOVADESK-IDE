import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database.database import get_db
from database.models import User, Conversation, Project, Workspace
from auth.dependencies import get_current_user

from conversation.service import ConversationService
from .schemas import RenameConversationRequest, ModelInfo

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Chat"])





@router.get("/conversations")
async def list_all_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists all conversations belonging to the current user across all workspaces."""
    # Get all workspaces for user
    ws_result = await db.execute(
        select(Workspace.id).where(Workspace.user_id == current_user.id)
    )
    workspace_ids = [row[0] for row in ws_result.fetchall()]
    if not workspace_ids:
        return []

    # Get all projects in those workspaces
    proj_result = await db.execute(
        select(Project.id).where(Project.workspace_id.in_(workspace_ids))
    )
    project_ids = [row[0] for row in proj_result.fetchall()]
    if not project_ids:
        return []

    # Get all conversations in those projects
    convo_result = await db.execute(
        select(Conversation)
        .where(Conversation.project_id.in_(project_ids))
        .order_by(Conversation.created_at.desc())
    )
    return convo_result.scalars().all()


@router.patch("/conversations/{conversation_id}/rename")
async def rename_conversation(
    conversation_id: int,
    req: RenameConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Renames a conversation by ID."""
    convo = await ConversationService.update_conversation(db, conversation_id, {"title": req.title})
    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return convo


@router.delete("/conversations/{conversation_id}")
async def delete_conversation_chat(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deletes a conversation by ID."""
    success = await ConversationService.delete_conversation(db, conversation_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return {"status": "deleted"}


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Gets all messages in a conversation."""
    messages = await ConversationService.get_messages(db, conversation_id)
    return messages


@router.post("/conversations")
async def create_conversation_chat(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new standalone conversation for the user (no project required)."""
    # Find or create a default workspace
    ws_result = await db.execute(
        select(Workspace).where(Workspace.user_id == current_user.id).limit(1)
    )
    workspace = ws_result.scalar_one_or_none()
    if not workspace:
        workspace = Workspace(user_id=current_user.id, name="Default", path="")
        db.add(workspace)
        await db.commit()
        await db.refresh(workspace)

    # Find or create a default project in that workspace
    proj_result = await db.execute(
        select(Project).where(Project.workspace_id == workspace.id).limit(1)
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        project = Project(
            workspace_id=workspace.id,
            name="AI Conversations",
            path="",
            embeddings_namespace=f"user_{current_user.id}_default",
        )
        db.add(project)
        await db.commit()
        await db.refresh(project)

    title = req.get("title", "New Chat")
    convo = await ConversationService.create_conversation(db, project.id, title)
    return convo
