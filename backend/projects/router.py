from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.database import get_db
from database.models import User, Workspace
from auth.dependencies import get_current_user
from .service import ProjectService
from pydantic import BaseModel

router = APIRouter(tags=["Projects"])

class CreateProjectRequest(BaseModel):
    name: str
    path: str

class UpdateProjectRequest(BaseModel):
    name: str = None
    git_branch: str = None
    project_settings: dict = None

@router.get("/workspace/{workspace_id}")
async def list_projects(workspace_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Verify ownership
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == current_user.id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    projects = await ProjectService.get_workspace_projects(db, workspace_id)
    return projects

@router.post("/workspace/{workspace_id}")
async def create_project(workspace_id: int, req: CreateProjectRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == current_user.id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    project = await ProjectService.create_project(db, workspace_id, req.name, req.path)
    return project

@router.put("/{project_id}")
async def update_project(project_id: int, req: UpdateProjectRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Simple check if project exists
    project = await ProjectService.update_project(db, project_id, req.dict(exclude_unset=True))
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project
