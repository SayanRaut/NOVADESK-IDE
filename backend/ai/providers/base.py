from abc import ABC, abstractmethod
from typing import List, Dict, Any, AsyncGenerator

class AIProvider(ABC):
    @abstractmethod
    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        pass
        
    @abstractmethod
    async def generate_stream(self, prompt: str, system_prompt: str = "") -> AsyncGenerator[str, None]:
        pass
        
    @abstractmethod
    async def generate_structured(self, prompt: str, schema: Any, system_prompt: str = "") -> Any:
        pass
