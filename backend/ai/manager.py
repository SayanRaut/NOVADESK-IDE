import asyncio
import hashlib
from typing import Optional, List, Dict, Any, AsyncGenerator

from .core.provider import ProviderInterface
from .core.exceptions import ModelLoadError
from .core.logger import logger
from .providers.ollama import OllamaProvider

class ModelManager:
    """
    Manages the lifecycle of models, strictly enforcing the 1-model-in-VRAM limit.
    Optimized for 6GB VRAM GPUs (e.g., RTX 3050).
    Includes Response Caching.
    """
    
    def __init__(self, provider: ProviderInterface = None):
        self._provider = provider or OllamaProvider()
        self._current_model: Optional[str] = None
        self._lock = asyncio.Lock()
        
        # Simple Response Cache
        self._cache: Dict[str, str] = {}
        self._max_cache_size = 100

    def _hash_request(self, messages: List[Dict[str, Any]], model_id: str) -> str:
        content = f"{model_id}-" + "-".join([f"{m['role']}:{m['content']}" for m in messages])
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    async def _ensure_model_loaded(self, model_id: str):
        """
        Ensures the requested model is the ONLY one loaded.
        """
        if self._current_model == model_id:
            return 
            
        logger.info(f"Switching model: {self._current_model} -> {model_id}")
        
        if self._current_model:
            success = await self._provider.unload_model(self._current_model)
            if not success:
                logger.warning(f"Failed to cleanly unload {self._current_model}. Proceeding anyway.")
                
        self._current_model = model_id
        logger.info(f"Model manager state updated to: {model_id}")

    async def generate(self, messages: List[Dict[str, Any]], model_id: str, **kwargs) -> str:
        """
        Thread-safe generation request with caching.
        """
        req_hash = self._hash_request(messages, model_id)
        if req_hash in self._cache:
            logger.info("Cache hit for generation request.")
            return self._cache[req_hash]

        async with self._lock:
            await self._ensure_model_loaded(model_id)
            try:
                response = await self._provider.generate(messages, model_id, **kwargs)
                
                # Cache management
                if len(self._cache) >= self._max_cache_size:
                    self._cache.pop(next(iter(self._cache)))
                self._cache[req_hash] = response
                
                return response
            except Exception as e:
                logger.error(f"Generate failed for {model_id}: {str(e)}")
                raise

    async def stream(self, messages: List[Dict[str, Any]], model_id: str, **kwargs) -> AsyncGenerator[str, None]:
        """
        Thread-safe streaming request.
        """
        async with self._lock:
            await self._ensure_model_loaded(model_id)
            try:
                async for chunk in self._provider.stream(messages, model_id, **kwargs):
                    yield chunk
            except Exception as e:
                logger.error(f"Stream failed for {model_id}: {str(e)}")
                raise

    async def force_unload_all(self):
        """Forcefully unload whatever model is currently loaded."""
        async with self._lock:
            if self._current_model:
                await self._provider.unload_model(self._current_model)
                self._current_model = None

    def get_current_model(self) -> Optional[str]:
        return self._current_model

# Singleton instance
model_manager = ModelManager()
