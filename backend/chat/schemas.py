from pydantic import BaseModel
from typing import Optional


class SendMessageRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str
    model_id: str = "gemini_flash_fast"
    context: Optional[dict] = None


class ModelInfo(BaseModel):
    id: str
    display_name: str
    provider: str
    credit_cost: int
    description: str
    thinking_level: str


class ConversationSummary(BaseModel):
    id: int
    title: str
    selected_model: str
    current_agent: str
    summary: Optional[str] = None

    class Config:
        from_attributes = True


class RenameConversationRequest(BaseModel):
    title: str
