from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from .manager import manager
from database.database import AsyncSessionLocal
from auth.services.jwt_service import verify_token
from database.models import Conversation
from conversation.service import ConversationService
from ai.chat import ChatAssistant
from ai.providers.gemini import GeminiProvider
from ai.providers.ollama import OllamaProvider

router = APIRouter()
@router.websocket("/chat")
async def websocket_chat(websocket: WebSocket, token: str = None):
    payload = verify_token(token) if token else None
    if not payload or not payload.get("sub"):
        await websocket.close(code=4401, reason="Authentication required")
        return
    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        await websocket.close(code=4401, reason="Invalid authentication token")
        return

    await manager.connect(websocket)
    try:
        while True:
            try:
                data = await websocket.receive_json()
                message = str(data.get("message", "")).strip()
                model_id = str(data.get("model_id", "deepseek-r1:5b"))
                mode = str(data.get("mode", "chat"))
                context = data.get("context", {})
                conversation_id = data.get("conversation_id")

                if not message:
                    await websocket.send_json({"type": "error", "code": "invalid_request", "message": "A message is required."})
                    continue
                if not isinstance(context, dict):
                    context = {}

                # Persist user message if conversation_id provided
                if conversation_id:
                    async with AsyncSessionLocal() as db:
                        convo = await db.get(Conversation, conversation_id)
                        is_new_chat = (convo and convo.title == "New Chat")
                        await ConversationService.add_message(db, conversation_id, "user", message)
                    
                    if is_new_chat:
                        async def generate_title():
                            import asyncio
                            await asyncio.sleep(1)
                            new_title = "New Chat Session"
                            async with AsyncSessionLocal() as title_db:
                                await ConversationService.update_conversation(title_db, conversation_id, {"title": new_title})
                            await websocket.send_json({"type": "conversation.renamed", "conversation_id": conversation_id, "title": new_title})
                        import asyncio
                        asyncio.create_task(generate_title())

                if "gemini" in model_id.lower():
                    provider = GeminiProvider()
                else:
                    provider = OllamaProvider(model_name=model_id)
                assistant = ChatAssistant(provider=provider)
                
                full_response = []
                async for event in assistant.chat_stream(message, context):
                    await websocket.send_json(event)
                    if event.get("type") == "response.delta":
                        full_response.append(event.get("delta", ""))
                
                if conversation_id and full_response:
                    async with AsyncSessionLocal() as db:
                        await ConversationService.add_message(
                            db, conversation_id, "model", "".join(full_response)
                        )

            except WebSocketDisconnect:
                manager.disconnect(websocket)
                return
            except Exception as exc:
                try:
                    await websocket.send_json({"type": "error", "message": str(exc)})
                except Exception:
                    pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
