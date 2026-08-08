import httpx
import json
from typing import List, Dict, Any, AsyncGenerator

from ai.core.provider import ProviderInterface
from ai.core.config import ai_config
from ai.core.logger import logger
from ai.core.exceptions import ProviderError

class OllamaProvider(ProviderInterface):
    """
    Ollama Provider Implementation.
    Interfaces directly with the local Ollama API.
    """
    
    def __init__(self):
        self.base_url = ai_config.OLLAMA_HOST

    async def _handle_response_error(self, response: httpx.Response):
        if response.status_code >= 400:
            try:
                await response.aread()
                error_text = response.text
            except Exception:
                error_text = "Unknown error (could not read response body)"
            logger.error(f"Ollama HTTP Error {response.status_code}: {error_text}")
            raise ProviderError(f"Ollama error: {error_text}")

    async def generate(self, messages: List[Dict[str, Any]], model_id: str, **kwargs) -> str:
        """Generate a complete text response."""
        payload = {
            "model": model_id,
            "messages": messages,
            "stream": False,
            "keep_alive": -1,  # V2: Keep unified model in VRAM indefinitely
            "options": kwargs.get("options", {})
        }
        
        try:
            async with httpx.AsyncClient(timeout=ai_config.DEFAULT_TIMEOUT) as client:
                response = await client.post(f"{self.base_url}/api/chat", json=payload)
                await self._handle_response_error(response)
                
                data = response.json()
                return data.get("message", {}).get("content", "")
        except httpx.TimeoutException:
            logger.error(f"Ollama timeout during generate for {model_id}")
            raise ProviderError("Ollama request timed out.")
        except Exception as e:
            logger.error(f"Ollama connection error: {str(e)}")
            raise ProviderError(f"Ollama connection error: {str(e)}")

    async def stream(self, messages: List[Dict[str, Any]], model_id: str, **kwargs) -> AsyncGenerator[str, None]:
        """Stream a text response."""
        payload = {
            "model": model_id,
            "messages": messages,
            "stream": True,
            "keep_alive": -1,  # V2: Keep unified model in VRAM indefinitely
            "options": kwargs.get("options", {})
        }
        
        try:
            async with httpx.AsyncClient(timeout=ai_config.DEFAULT_TIMEOUT) as client:
                async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                    await self._handle_response_error(response)
                        
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                chunk = data.get("message", {}).get("content", "")
                                if chunk:
                                    yield chunk
                            except json.JSONDecodeError:
                                continue
        except httpx.TimeoutException:
            logger.error(f"Ollama streaming timeout for {model_id}")
            raise ProviderError("Ollama streaming timed out.")
        except Exception as e:
            logger.error(f"Ollama streaming error: {str(e)}")
            raise ProviderError(f"Ollama streaming error: {str(e)}")

    async def health_check(self) -> bool:
        """Check if Ollama is running."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(self.base_url)
                return response.status_code == 200
        except Exception:
            return False

    async def unload_model(self, model_id: str) -> bool:
        """
        Forces Ollama to unload the model from VRAM by setting keep_alive to 0.
        """
        payload = {
            "model": model_id,
            "keep_alive": 0
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # We can just hit /api/generate with an empty prompt and keep_alive=0
                response = await client.post(f"{self.base_url}/api/generate", json=payload)
                await self._handle_response_error(response)
                logger.info(f"Successfully unloaded model: {model_id}")
                return True
        except Exception as e:
            logger.error(f"Failed to unload model {model_id}: {str(e)}")
            return False
