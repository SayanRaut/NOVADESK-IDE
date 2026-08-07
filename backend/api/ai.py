from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Any

from auth.dependencies import get_current_user
from database.models import User
from ..ai.supervisor import supervisor_agent
from ..ai.intent import intent_classifier

router = APIRouter(tags=["AI"])

class ChatContext(BaseModel):
    active_file: str = ""
    active_file_content: str = Field(default="", max_length=30_000)
    selected_code: str = Field(default="", max_length=12_000)
    open_files: list[str] = Field(default_factory=list, max_length=20)
    project_tree: str = Field(default="", max_length=12_000)
    git_status: str = Field(default="", max_length=2_000)

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=40_000)
    context: ChatContext = Field(default_factory=ChatContext)
    has_images: bool = False

@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Unified AI endpoint. 
    The frontend does not select the model. The backend decides based on intent.
    """
    try:
        # 1. Classify intent
        intent_result = intent_classifier.classify(request.message, has_images=request.has_images)
        
        # 2. Execute via Supervisor
        response_text = await supervisor_agent.execute_task(
            intent_result=intent_result,
            task=request.message,
            context=request.context.dict()
        )
        
        return {
            "intent": intent_result.intent,
            "confidence": intent_result.confidence,
            "response": response_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
