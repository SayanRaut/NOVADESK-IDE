import asyncio
from sqlalchemy import text
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import engine

async def add_indexes():
    print("Adding indexes to conversations and messages tables...")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_conversations_project_id ON conversations (project_id);"))
            print("Successfully added index to conversations.project_id")
        except Exception as e:
            print(f"Error adding index to conversations: {e}")

        try:
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_messages_conversation_id ON messages (conversation_id);"))
            print("Successfully added index to messages.conversation_id")
        except Exception as e:
            print(f"Error adding index to messages: {e}")

if __name__ == "__main__":
    asyncio.run(add_indexes())
