import json
import logging
from typing import Any, AsyncGenerator
import httpx

from config.settings import settings
from ai_engine.exceptions import AIEngineError, ProviderRequestError

logger = logging.getLogger(__name__)

class OllamaService:
    """
    Service to interact with a self-hosted Ollama server.
    """
    
    @staticmethod
    async def list_models() -> list[dict[str, object]]:
        """
        Dynamically fetch the list of available models from Ollama.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{settings.OLLAMA_HOST}/api/tags")
                response.raise_for_status()
                data = response.json()
                
                models = []
                for model_data in data.get("models", []):
                    model_id = model_data.get("name")
                    models.append({
                        "id": model_id,
                        "display_name": f"Ollama - {model_id}",
                        "provider": "ollama",
                        "model_name": model_id,
                        "temperature": settings.TEMPERATURE,
                        "credit_cost": 0,
                        "thinking_level": "balanced",
                        "description": f"Local Ollama Model: {model_id}"
                    })
                return models
        except Exception as e:
            logger.error(f"Failed to fetch Ollama models: {e}")
            return []

    @staticmethod
    async def get_model_config(model_id: str) -> dict[str, Any]:
        models = await OllamaService.list_models()
        for model in models:
            if model["id"] == model_id:
                return model
        # Fallback to default if not found
        return {
            "id": settings.DEFAULT_MODEL,
            "display_name": f"Ollama - {settings.DEFAULT_MODEL}",
            "provider": "ollama",
            "model_name": settings.DEFAULT_MODEL,
            "temperature": settings.TEMPERATURE,
            "credit_cost": 0,
            "thinking_level": "balanced",
            "description": f"Fallback Model: {settings.DEFAULT_MODEL}"
        }

    async def generate(self, messages: list[dict[str, Any]], model_id: str, temperature: float = settings.TEMPERATURE) -> str:
        """
        Generate a complete response from Ollama.
        """
        try:
            # Ollama /api/chat endpoint accepts messages in OpenAI format somewhat
            payload = {
                "model": model_id,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_ctx": settings.MAX_TOKENS,
                    "top_p": settings.TOP_P
                }
            }
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(f"{settings.OLLAMA_HOST}/api/chat", json=payload)
                if response.status_code >= 400:
                    error_text = response.text
                    logger.error(f"Ollama HTTP Error: {response.status_code} - {error_text}")
                    raise ProviderRequestError(f"Ollama error: {error_text}")
                data = response.json()
                return data.get("message", {}).get("content", "")
        except httpx.TimeoutException as e:
            logger.error(f"Ollama Timeout: {e}")
            raise ProviderRequestError("Ollama request timed out.")
        except ProviderRequestError:
            raise
        except Exception as e:
            logger.error(f"Ollama Error: {e}")
            raise ProviderRequestError(f"Ollama connection error: {str(e)}")

    async def stream(self, messages: list[dict[str, Any]], model_id: str, temperature: float = settings.TEMPERATURE) -> AsyncGenerator[str, None]:
        """
        Stream a response from Ollama.
        """
        payload = {
            "model": model_id,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "num_ctx": settings.MAX_TOKENS,
                "top_p": settings.TOP_P
            }
        }
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", f"{settings.OLLAMA_HOST}/api/chat", json=payload) as response:
                    if response.status_code >= 400:
                        await response.aread()
                        error_text = response.text
                        logger.error(f"Ollama Streaming HTTP Error: {response.status_code} - {error_text}")
                        raise ProviderRequestError(f"Ollama error: {error_text}")
                        
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                chunk = data.get("message", {}).get("content", "")
                                if chunk:
                                    yield chunk
                            except json.JSONDecodeError:
                                pass
        except httpx.TimeoutException as e:
            logger.error(f"Ollama Streaming Timeout: {e}")
            raise ProviderRequestError("Ollama streaming timed out.")
        except ProviderRequestError:
            raise
        except Exception as e:
            logger.error(f"Ollama Streaming Error: {e}")
            raise ProviderRequestError(f"Ollama streaming connection error: {str(e)}")

    def count_tokens(self, text: str) -> int:
        # Simple approximation for token counting if needed
        return len(text.split()) // 2 + len(text) // 6

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(settings.OLLAMA_HOST)
                return response.status_code == 200
        except Exception:
            return False
