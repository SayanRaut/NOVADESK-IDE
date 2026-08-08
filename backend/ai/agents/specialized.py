from abc import ABC, abstractmethod
from typing import Any
from ai.core.provider import ProviderInterface
from ai.core.logger import logger
from ai.tools.registry import tool_registry

class BaseAgent(ABC):
    """
    Base class for specialized agents.
    In V2, all agents use the same underlying model but with strictly defined Personas.
    """
    def __init__(self, provider: ProviderInterface, model_id: str):
        self.provider = provider
        self.model_id = model_id
        self.tools = tool_registry

    @abstractmethod
    def get_system_prompt(self) -> str:
        pass

    @abstractmethod
    async def execute(self, task: str, context: dict) -> Any:
        pass
        
    async def invoke_model(self, prompt: str) -> str:
        messages = [
            {"role": "system", "content": self.get_system_prompt()},
            {"role": "user", "content": prompt}
        ]
        return await self.provider.generate(messages, self.model_id)

class PlannerAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return (
            "You are an Elite Software Architect. Your job is to analyze the user's request "
            "and output a comprehensive, step-by-step architectural plan. Focus on system design, "
            "data flow, and best practices. Do not write raw implementation code."
        )
        
    async def execute(self, task: str, context: dict) -> str:
        logger.info(f"PlannerAgent executing task on model {self.model_id}")
        prompt = f"Plan the following task:\n{task}\nContext:\n{context}"
        return await self.invoke_model(prompt)

class CodingAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return (
            "You are a Strict Senior Developer. Your job is to write highly optimized, clean, "
            "and production-ready code. Output only the necessary code and brief explanations. "
            "Ensure all edge cases are handled."
        )

    async def execute(self, task: str, context: dict) -> str:
        logger.info(f"CodingAgent executing task on model {self.model_id}")
        prompt = f"Write code for:\n{task}\nContext:\n{context}"
        return await self.invoke_model(prompt)

class ReviewAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return (
            "You are a strict QA and Security Reviewer. Analyze the provided code for security "
            "vulnerabilities, performance bottlenecks, and adherence to best practices. Be concise."
        )

    async def execute(self, task: str, context: dict) -> str:
        logger.info(f"ReviewAgent executing task on model {self.model_id}")
        prompt = f"Review the following code:\n{task}\nContext:\n{context}"
        return await self.invoke_model(prompt)

class DebugAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return (
            "You are a specialized Debugging Expert. Analyze the error message or stack trace, "
            "identify the root cause of the bug, and provide a clear, actionable fix."
        )

    async def execute(self, task: str, context: dict) -> str:
        logger.info(f"DebugAgent executing task on model {self.model_id}")
        prompt = f"Debug the following error:\n{task}\nContext:\n{context}"
        return await self.invoke_model(prompt)

class SearchAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return (
            "You are a Codebase Navigation Assistant. Given a query and context, identify "
            "which files, classes, or functions are most relevant to the user's request."
        )

    async def execute(self, task: str, context: dict) -> str:
        logger.info(f"SearchAgent executing task on model {self.model_id}")
        prompt = f"Search workspace for:\n{task}\nContext:\n{context}"
        return await self.invoke_model(prompt)

class VisionAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return (
            "You are a Vision-Language Expert. Analyze the provided image/UI screenshot and "
            "describe it accurately or provide the requested structural code."
        )

    async def execute(self, task: str, context: dict) -> str:
        logger.info(f"VisionAgent executing task on model {self.model_id}")
        prompt = f"Analyze the provided vision context for:\n{task}\nContext:\n{context}"
        return await self.invoke_model(prompt)
