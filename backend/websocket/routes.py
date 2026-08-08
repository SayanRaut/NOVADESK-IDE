from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from .manager import manager
from auth.services.jwt_service import verify_token
from database.database import AsyncSessionLocal
from conversation.service import ConversationService
from database.models import Conversation

from ai.intent import intent_classifier
from ai.registry import model_registry
from ai.manager import model_manager
from ai.core.logger import logger

router = APIRouter()

@router.websocket("/chat")
async def websocket_chat(websocket: WebSocket, token: str = None):
    payload = verify_token(token) if token else None
    if not payload or not payload.get("sub"):
        await websocket.close(code=4401, reason="Authentication required")
        return
    
    await manager.connect(websocket)
    try:
        while True:
            try:
                data = await websocket.receive_json()
                message = str(data.get("message", "")).strip()
                has_images = bool(data.get("has_images", False))
                context = data.get("context", {})
                conversation_id = data.get("conversation_id")
                
                if data.get("type") == "cancel":
                    # Handle cancellation if running
                    logger.info("Cancellation requested via WebSocket.")
                    # Future implementation could interrupt the async stream generator
                    continue

                if not message:
                    await websocket.send_json({"type": "error", "code": "invalid_request", "message": "Message required."})
                    continue

                if conversation_id:
                    async with AsyncSessionLocal() as db:
                        convo = await db.get(Conversation, conversation_id)
                        is_new_chat = (convo and convo.title == "New Chat")
                        await ConversationService.add_message(db, conversation_id, "user", message)

                # Send Progress Event: Thinking & Routing
                await websocket.send_json({"type": "progress", "status": "Classifying Intent..."})
                intent_result = intent_classifier.classify(message, has_images=has_images)
                
                target_model = model_registry.get_unified_model()
                
                await websocket.send_json({"type": "progress", "status": f"Loading {target_model.name} into VRAM..."})
                
                # Context formatting
                context_str = str(context) # Should ideally use context_engine
                prompt = f"Task: {message}\nContext: {context_str}"
                messages = [{"role": "user", "content": prompt}]
                
                full_response = []
                # Stream the response using ModelManager to ensure strict VRAM limit
                async for chunk in model_manager.stream(messages, target_model.id):
                    await websocket.send_json({"type": "response.delta", "delta": chunk})
                    full_response.append(chunk)
                    
                await websocket.send_json({"type": "response.done"})
                
                if conversation_id and full_response:
                    async with AsyncSessionLocal() as db:
                        await ConversationService.add_message(
                            db, conversation_id, "model", "".join(full_response)
                        )

            except WebSocketDisconnect:
                manager.disconnect(websocket)
                return
            except Exception as exc:
                logger.error(f"WebSocket Error: {str(exc)}")
                try:
                    await websocket.send_json({"type": "error", "message": str(exc)})
                except Exception:
                    pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
