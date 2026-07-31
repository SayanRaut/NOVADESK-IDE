from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database.database import get_db
from database.models import User
from auth.dependencies import get_current_user
from .service import WorkspaceService
from pydantic import BaseModel

router = APIRouter(tags=["Workspace"])

class CreateWorkspaceRequest(BaseModel):
    name: str
    path: str = ""

class UpdateWorkspaceStateRequest(BaseModel):
    recent_files: list = None
    recent_chats: list = None
    opened_tabs: list = None
    window_layout: dict = None
    terminal_state: dict = None
    explorer_state: dict = None

@router.get("/")
async def list_workspaces(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    workspaces = await WorkspaceService.get_user_workspaces(db, current_user.id)
    return workspaces

@router.post("/")
async def create_workspace(req: CreateWorkspaceRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    workspace = await WorkspaceService.create_workspace(db, current_user.id, req.name, req.path)
    return workspace

@router.put("/{workspace_id}/state")
async def update_workspace_state(workspace_id: int, req: UpdateWorkspaceStateRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    workspace = await WorkspaceService.update_state(db, current_user.id, workspace_id, req.dict(exclude_unset=True))
    if not workspace:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Workspace not found")
    return {"status": "success"}
