"""
Standard Base Agent contract for NovaDesk IDE.
Follows Master Plan Section 30.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from ai.core.state import AgentState, AgentContext, AgentResult, AgentEvent
from ai.core.provider import ProviderInterface
from ai.core.logger import logger

class BaseAgent(ABC):
    """
    Standard agent interface.
    Every agent consumes AgentState and AgentContext and returns an AgentResult.
    """
    def __init__(self, provider: ProviderInterface, model_id: str, name: str):
        self.provider = provider
        self.model_id = model_id
        self.name = name

    @abstractmethod
    def get_system_prompt(self) -> str:
        """Returns the specific persona/prompt for this agent."""
        pass

    @abstractmethod
    async def run(self, state: AgentState, context: AgentContext) -> AgentResult:
        """Executes the agent logic given the current state and shared context."""
        pass

    async def invoke_model(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> str:
        """Helper to invoke the centralized LLM provider."""
        sys_prompt = system_prompt or self.get_system_prompt()
        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": prompt}
        ]
        return await self.provider.generate(messages, self.model_id, **kwargs)

    def create_event(self, event_type: str, message: str, data: Optional[Dict[str, Any]] = None) -> AgentEvent:
        """Creates a standardized agent event."""
        return AgentEvent(
            type=event_type,
            agent=self.name,
            message=message,
            data=data or {}
        )
