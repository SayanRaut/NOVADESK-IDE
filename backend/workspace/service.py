from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.models import Workspace

class WorkspaceService:
    @staticmethod
    async def get_user_workspaces(db: AsyncSession, user_id: int):
        result = await db.execute(select(Workspace).where(Workspace.user_id == user_id))
        return result.scalars().all()

    @staticmethod
    async def create_workspace(db: AsyncSession, user_id: int, name: str, path: str = ""):
        workspace = Workspace(user_id=user_id, name=name, path=path)
        db.add(workspace)
        await db.commit()
        await db.refresh(workspace)
        return workspace

    @staticmethod
    async def update_state(db: AsyncSession, user_id: int, workspace_id: int, state_update: dict):
        result = await db.execute(select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == user_id))
        workspace = result.scalar_one_or_none()
        if not workspace:
            return None
        
        if "recent_files" in state_update:
            workspace.recent_files = state_update["recent_files"]
        if "recent_chats" in state_update:
            workspace.recent_chats = state_update["recent_chats"]
        if "opened_tabs" in state_update:
            workspace.opened_tabs = state_update["opened_tabs"]
        if "window_layout" in state_update:
            workspace.window_layout = state_update["window_layout"]
        if "terminal_state" in state_update:
            workspace.terminal_state = state_update["terminal_state"]
        if "explorer_state" in state_update:
            workspace.explorer_state = state_update["explorer_state"]

        await db.commit()
        await db.refresh(workspace)
        return workspace
