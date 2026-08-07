from abc import ABC, abstractmethod
from typing import Any
from ai.core.provider import ProviderInterface
from ai.core.logger import logger
from ai.tools.registry import tool_registry

class BaseAgent(ABC):
    """
    Base class for specialized agents.
    """
    def __init__(self, provider: ProviderInterface, model_id: str):
        self.provider = provider
        self.model_id = model_id
        self.tools = tool_registry

    @abstractmethod
    async def execute(self, task: str, context: dict) -> Any:
        pass
        
    async def invoke_model(self, prompt: str) -> str:
        messages = [{"role": "user", "content": prompt}]
        return await self.provider.generate(messages, self.model_id)

class PlannerAgent(BaseAgent):
    """Uses DeepSeek-R1 to plan architecture and milestones."""
    async def execute(self, task: str, context: dict) -> str:
        logger.info(f"PlannerAgent executing task on model {self.model_id}")
        prompt = f"Plan the following task:\n{task}\nContext:\n{context}"
        return await self.invoke_model(prompt)

class CodingAgent(BaseAgent):
    """Uses Qwen2.5-Coder for code generation and patching."""
    async def execute(self, task: str, context: dict) -> str:
        logger.info(f"CodingAgent executing task on model {self.model_id}")
        prompt = f"Write code for:\n{task}\nContext:\n{context}"
        return await self.invoke_model(prompt)

class ReviewAgent(BaseAgent):
    """Uses Qwen2.5-Coder to review for bugs and best practices."""
    async def execute(self, task: str, context: dict) -> str:
        logger.info(f"ReviewAgent executing task on model {self.model_id}")
        prompt = f"Review the following code:\n{task}\nContext:\n{context}"
        return await self.invoke_model(prompt)

class DebugAgent(BaseAgent):
    """Uses Qwen2.5-Coder to analyze stack traces and suggest fixes."""
    async def execute(self, task: str, context: dict) -> str:
        logger.info(f"DebugAgent executing task on model {self.model_id}")
        prompt = f"Debug the following error:\n{task}\nContext:\n{context}"
        return await self.invoke_model(prompt)

class SearchAgent(BaseAgent):
    """Uses Qwen2.5-Coder to search workspace and references."""
    async def execute(self, task: str, context: dict) -> str:
        logger.info(f"SearchAgent executing task on model {self.model_id}")
        prompt = f"Search workspace for:\n{task}\nContext:\n{context}"
        return await self.invoke_model(prompt)

class VisionAgent(BaseAgent):
    """Uses Qwen2.5-VL to analyze screenshots, UI, etc."""
    async def execute(self, task: str, context: dict) -> str:
        logger.info(f"VisionAgent executing task on model {self.model_id}")
        prompt = f"Analyze the provided vision context for:\n{task}\nContext:\n{context}"
        return await self.invoke_model(prompt)
