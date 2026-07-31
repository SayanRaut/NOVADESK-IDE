from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.models import Conversation, Message

class ConversationService:
    @staticmethod
    async def get_project_conversations(db: AsyncSession, project_id: int):
        result = await db.execute(select(Conversation).where(Conversation.project_id == project_id))
        return result.scalars().all()

    @staticmethod
    async def create_conversation(db: AsyncSession, project_id: int, title: str, current_agent: str = "chat"):
        convo = Conversation(
            project_id=project_id,
            title=title,
            current_agent=current_agent
        )
        db.add(convo)
        await db.commit()
        await db.refresh(convo)
        return convo

    @staticmethod
    async def get_messages(db: AsyncSession, conversation_id: int):
        result = await db.execute(
            select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
        )
        return result.scalars().all()

    @staticmethod
    async def add_message(db: AsyncSession, conversation_id: int, role: str, content: str):
        msg = Message(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)
        return msg

    @staticmethod
    async def update_conversation(db: AsyncSession, conversation_id: int, updates: dict):
        convo = await db.get(Conversation, conversation_id)
        if not convo:
            return None
            
        if "title" in updates:
            convo.title = updates["title"]
        if "summary" in updates:
            convo.summary = updates["summary"]

        if "current_agent" in updates:
            convo.current_agent = updates["current_agent"]
            
        await db.commit()
        await db.refresh(convo)
        return convo

    @staticmethod
    async def delete_conversation(db: AsyncSession, conversation_id: int):
        convo = await db.get(Conversation, conversation_id)
        if not convo:
            return False
        await db.delete(convo)
        await db.commit()
        return True
