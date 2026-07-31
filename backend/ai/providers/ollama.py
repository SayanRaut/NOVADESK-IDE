import json
import httpx
from typing import Any, AsyncGenerator
from .base import AIProvider
from config.settings import settings

class OllamaProvider(AIProvider):
    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.DEFAULT_MODEL
        self.host = settings.OLLAMA_HOST

    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": settings.TEMPERATURE,
                "num_ctx": settings.MAX_TOKENS,
                "top_p": settings.TOP_P
            }
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(f"{self.host}/api/chat", json=payload)
            if response.status_code >= 400:
                error_msg = response.text
                try:
                    error_msg = response.json().get("error", error_msg)
                except:
                    pass
                raise ValueError(f"Ollama error ({response.status_code}): {error_msg}")
            data = response.json()
            return data.get("message", {}).get("content", "")

    async def generate_stream(self, prompt: str, system_prompt: str = "") -> AsyncGenerator[str, None]:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": settings.TEMPERATURE,
                "num_ctx": settings.MAX_TOKENS,
                "top_p": settings.TOP_P
            }
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", f"{self.host}/api/chat", json=payload) as response:
                if response.status_code >= 400:
                    await response.aread()
                    error_msg = response.text
                    try:
                        error_msg = response.json().get("error", error_msg)
                    except:
                        pass
                    raise ValueError(f"Ollama error ({response.status_code}): {error_msg}")
                    
                async for line in response.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            chunk = data.get("message", {}).get("content", "")
                            if chunk:
                                yield chunk
                        except json.JSONDecodeError:
                            pass

    async def generate_structured(self, prompt: str, schema: Any, system_prompt: str = "") -> Any:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
            
        prompt_with_schema = f"{prompt}\n\nPlease output valid JSON matching this schema:\n{schema.schema_json()}"
        messages.append({"role": "user", "content": prompt_with_schema})
        
        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.1,
                "num_ctx": settings.MAX_TOKENS,
            }
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(f"{self.host}/api/chat", json=payload)
            if response.status_code >= 400:
                error_msg = response.text
                try:
                    error_msg = response.json().get("error", error_msg)
                except:
                    pass
                raise ValueError(f"Ollama error ({response.status_code}): {error_msg}")
            data = response.json()
            content = data.get("message", {}).get("content", "")
            try:
                return schema.parse_raw(content)
            except Exception as e:
                raise ValueError(f"Failed to parse structured output from Ollama: {e}\nRaw output: {content}")
