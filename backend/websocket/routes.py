from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from .manager import manager
from auth.services.jwt_service import verify_token
from database.database import AsyncSessionLocal
from conversation.service import ConversationService
from database.models import Conversation

from ai.intent import intent_classifier
from ai.registry import model_registry
from ai.manager import model_manager
from ai.supervisor import supervisor_agent
from ai.core.logger import logger
from ai.planner.state import PlanState
from ai.planner.dispatcher import Dispatcher
import os
import uuid
import json

router = APIRouter()

# Global state for active plans in memory
# Key: conversation_id, Value: dict containing plan and context
active_plans = {}

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
                    continue

                if not message:
                    await websocket.send_json({"type": "error", "code": "invalid_request", "message": "Message required."})
                    continue

                if message.strip() == "/approve_plan":
                    if conversation_id not in active_plans:
                        await websocket.send_json({"type": "error", "message": "No active plan found to approve."})
                        continue
                        
                    plan_data = active_plans[conversation_id]
                    plan = plan_data["plan"]
                    plan_context = plan_data["context"]
                    
                    await websocket.send_json({"type": "progress", "status": "Executing Approved Plan..."})
                    plan_state = PlanState(plan)
                    dispatcher = Dispatcher(state=plan_state, context=plan_context, websocket=websocket)
                    
                    try:
                        results = await dispatcher.run()
                        await websocket.send_json({"type": "response.completed"})
                    except Exception as e:
                        await websocket.send_json({"type": "error", "message": f"Execution failed: {e}"})
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
                
                full_response = []
                if intent_result.intent == "planning":
                    await websocket.send_json({"type": "progress", "status": "Architecting Plan (JSON Mode)..."})
                    try:
                        # PlannerAgent returns a Pydantic Plan object
                        plan = await supervisor_agent.execute_task(intent_result, message, context, conversation_id)
                        
                        # Generate Markdown
                        md_chunks = [
                            f"# 🎯 Goal: {plan.goal}\n\n",
                            "Here is your step-by-step architectural plan:\n\n"
                        ]
                        for task in plan.tasks:
                            deps = f" *(Depends on: {', '.join(task.dependencies)})*" if task.dependencies else ""
                            desc = task.title or task.description
                            md_chunks.append(f"- [ ] **Task {task.id}** ({task.agent.title()}): {desc}{deps}\n")
                            
                        markdown_content = "".join(md_chunks)
                        
                        # Save the markdown plan to the workspace root
                        workspace_root = context.get("workspace_root") if isinstance(context, dict) else ""
                        plan_filename = "Plan.md"
                        
                        if workspace_root:
                            plan_path = os.path.join(workspace_root, plan_filename)
                        else:
                            # Fallback if no workspace is opened
                            plan_path = plan_filename
                            
                        try:
                            # Try to write locally if backend is running on the same machine
                            with open(plan_path, "w", encoding="utf-8") as f:
                                f.write(markdown_content)
                        except Exception as e:
                            logger.warning(f"Failed to write plan to local disk (likely cloud hosted): {e}")
                            
                        # Store in memory for /approve_plan
                        active_plans[conversation_id] = {
                            "plan": plan,
                            "context": context
                        }
                        
                        # Send the artifact event instead of just streaming the markdown
                        # The UI will automatically render the Proceed/Feedback buttons!
                        await websocket.send_json({
                            "type": "agent.artifact",
                            "path": plan_filename,
                            "content": markdown_content,
                            "requestFeedback": True
                        })
                        
                        # We also send it as response text so it stays in chat history
                        full_response.append(f"I have created the plan in `{plan_filename}`. Please review it.")
                        await websocket.send_json({"type": "response.delta", "delta": full_response[-1]})
                        
                    except Exception as e:
                        error_msg = f"Planner failed: {str(e)}"
                        logger.error(error_msg)
                        await websocket.send_json({"type": "response.delta", "delta": error_msg})
                        full_response.append(error_msg)
                else:
                    context_str = str(context)
                    prompt = f"Task: {message}\nContext: {context_str}"
                    messages = [{"role": "user", "content": prompt}]
                    # Stream the response using ModelManager to ensure strict VRAM limit
                    async for chunk in model_manager.stream(messages, target_model.id):
                        await websocket.send_json({"type": "response.delta", "delta": chunk})
                        full_response.append(chunk)
                    
                await websocket.send_json({"type": "response.completed"})
                
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
