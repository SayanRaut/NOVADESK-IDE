from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.models import Project, Workspace

class ProjectService:
    @staticmethod
    async def get_workspace_projects(db: AsyncSession, workspace_id: int):
        result = await db.execute(select(Project).where(Project.workspace_id == workspace_id))
        return result.scalars().all()

    @staticmethod
    async def create_project(db: AsyncSession, workspace_id: int, name: str, path: str):
        project = Project(
            workspace_id=workspace_id, 
            name=name, 
            path=path,
            embeddings_namespace=f"ws_{workspace_id}_proj_{name.lower().replace(' ', '_')}"
        )
        db.add(project)
        await db.commit()
        await db.refresh(project)
        return project

    @staticmethod
    async def update_project(db: AsyncSession, project_id: int, updates: dict):
        project = await db.get(Project, project_id)
        if not project:
            return None
            
        if "name" in updates:
            project.name = updates["name"]
        if "git_branch" in updates:
            project.git_branch = updates["git_branch"]
        if "project_settings" in updates:
            project.project_settings = updates["project_settings"]
            
        await db.commit()
        await db.refresh(project)
        return project
