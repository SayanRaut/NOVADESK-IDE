from abc import ABC, abstractmethod
from typing import List, Dict, Any, AsyncGenerator

class ProviderInterface(ABC):
    """
    Base interface for all AI providers.
    Ensures all models are accessed through a unified interface.
    """
    
    @abstractmethod
    async def generate(self, messages: List[Dict[str, Any]], model_id: str, **kwargs) -> str:
        """Generate a complete text response."""
        pass
        
    @abstractmethod
    async def stream(self, messages: List[Dict[str, Any]], model_id: str, **kwargs) -> AsyncGenerator[str, None]:
        """Stream a text response."""
        pass
        
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the provider is healthy and available."""
        pass
        
    @abstractmethod
    async def unload_model(self, model_id: str) -> bool:
        """Force unload a model from VRAM."""
        pass
