import os
import json
import asyncio
from typing import List, Dict, Any, AsyncGenerator, Optional
import httpx
import google.generativeai as genai

from ai.core.provider import ProviderInterface
from ai.core.logger import logger
from ai.core.exceptions import ProviderError
from config.settings import settings

class GeminiProvider(ProviderInterface):
    """
    Google Gemini AI Provider for NovaDesk.
    Replaces local Ollama models with fast, high-capability cloud Gemini models:
    - gemini-2.5-flash (Primary unified model for fast planning & coding)
    - gemini-2.5-pro (Deep reasoning & fullstack architecture)
    - gemini-2.0-flash (High throughput & multimodal)
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (
            api_key 
            or os.environ.get("GEMINI_API_KEY") 
            or getattr(settings, "GEMINI_API_KEY", "") 
            or ""
        )
        self.has_key = bool(self.api_key and self.api_key.strip())
        if self.has_key:
            try:
                genai.configure(api_key=self.api_key.strip())
                logger.info("Google Gemini Provider configured with API key.")
            except Exception as e:
                logger.warning(f"Error configuring Google Gemini API: {e}")
        else:
            logger.warning("Gemini API key not found. Set GEMINI_API_KEY in .env or system environment.")

    def set_api_key(self, api_key: str):
        """Dynamically configure Gemini API key."""
        if api_key and api_key.strip():
            self.api_key = api_key.strip()
            self.has_key = True
            try:
                genai.configure(api_key=self.api_key)
                logger.info("Google Gemini Provider updated with dynamic API key.")
            except Exception as e:
                logger.warning(f"Error updating Gemini API key: {e}")

    @classmethod
    async def validate_api_key(cls, api_key: str) -> tuple[bool, str]:
        """Validates if a user-supplied API key is operational against Google Gemini."""
        if not api_key or not api_key.strip():
            return False, "API key is required."
        clean_key = api_key.strip()
        try:
            genai.configure(api_key=clean_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            resp = await model.generate_content_async("ping", generation_config=genai.GenerationConfig(max_output_tokens=5))
            if resp and hasattr(resp, "text"):
                return True, "API key successfully verified with Google Gemini!"
            return False, "No response received from Gemini API."
        except Exception as e:
            err_msg = str(e)
            if "API_KEY_INVALID" in err_msg or "API key not valid" in err_msg or "400" in err_msg:
                return False, "API key is invalid. Please verify the key from Google AI Studio."
            elif "PERMISSION_DENIED" in err_msg or "403" in err_msg:
                return False, "Permission denied for this API key. Ensure Gemini API is enabled."
            return False, f"Verification failed: {err_msg[:120]}"

    def _clean_model_name(self, model_id: str) -> str:
        name = model_id.replace("models/", "").strip()
        # Ensure standard model names
        if name in ("qwen3.5:4b", "default", "novadesk"):
            return "gemini-2.5-flash"
        return name

    def _prepare_contents_and_system(self, messages: List[Dict[str, Any]]) -> tuple[list[dict], Optional[str]]:
        system_instructions = []
        gemini_contents = []

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if role == "system":
                system_instructions.append(content)
            elif role in ("user", "human"):
                gemini_contents.append({
                    "role": "user",
                    "parts": [{"text": str(content)}]
                })
            elif role in ("assistant", "model", "bot"):
                gemini_contents.append({
                    "role": "model",
                    "parts": [{"text": str(content)}]
                })

        # Gemini requires at least one user turn
        if not gemini_contents:
            gemini_contents.append({"role": "user", "parts": [{"text": "Hello"}]})

        system_text = "\n\n".join(system_instructions) if system_instructions else None
        return gemini_contents, system_text

    async def generate(self, messages: List[Dict[str, Any]], model_id: str, **kwargs) -> str:
        """Generate a complete text or structured JSON response using Google Gemini."""
        clean_model = self._clean_model_name(model_id)
        gemini_contents, system_prompt = self._prepare_contents_and_system(messages)
        is_json = kwargs.get("format") == "json" or kwargs.get("response_mime_type") == "application/json"

        # User-supplied API key takes precedence
        call_key = kwargs.get("api_key") or self.api_key
        has_active_key = bool(call_key and call_key.strip())

        if not has_active_key:
            logger.warning(f"GEMINI_API_KEY missing. Providing structured fallback response for {clean_model}.")
            if is_json:
                return json.dumps({
                    "goal": "Build fullstack web application",
                    "tasks": [
                        {"id": "task-1", "title": "Scaffold Next.js 15 App", "agent": "coding", "dependencies": [], "description": "Generate Next.js 15 project structure"},
                        {"id": "task-2", "title": "Implement UI Components", "agent": "coding", "dependencies": ["task-1"], "description": "Create responsive pages with Tailwind CSS"}
                    ]
                })
            return f"[Gemini 2.5 Flash Mock] Ready to build. Please provide your Google Gemini API Key to activate live code synthesis."

        try:
            genai.configure(api_key=call_key.strip())
            generation_config = genai.GenerationConfig(
                temperature=kwargs.get("temperature", 0.2),
                max_output_tokens=kwargs.get("max_tokens", 8192),
                response_mime_type="application/json" if is_json else "text/plain"
            )

            model = genai.GenerativeModel(
                model_name=clean_model,
                system_instruction=system_prompt if system_prompt else None,
                generation_config=generation_config
            )

            # Use async generation
            response = await model.generate_content_async(gemini_contents)
            return response.text or ""
        except Exception as e:
            logger.error(f"Gemini generate failed ({clean_model}): {str(e)}")
            # Fallback to gemini-2.0-flash if 2.5 is not accessible
            if "2.5" in clean_model:
                try:
                    logger.info("Falling back to gemini-2.0-flash...")
                    fallback_model = genai.GenerativeModel(
                        model_name="gemini-2.0-flash",
                        system_instruction=system_prompt if system_prompt else None
                    )
                    resp = await fallback_model.generate_content_async(gemini_contents)
                    return resp.text or ""
                except Exception as fallback_err:
                    logger.error(f"Fallback generation failed: {fallback_err}")
            raise ProviderError(f"Gemini API error: {str(e)}")

    async def stream(self, messages: List[Dict[str, Any]], model_id: str, **kwargs) -> AsyncGenerator[str, None]:
        """Stream real-time text chunks using Google Gemini."""
        clean_model = self._clean_model_name(model_id)
        gemini_contents, system_prompt = self._prepare_contents_and_system(messages)

        # User-supplied API key takes precedence
        call_key = kwargs.get("api_key") or self.api_key
        has_active_key = bool(call_key and call_key.strip())

        if not has_active_key:
            demo_msg = (
                f"### Gemini 2.5 Flash Online\n\n"
                f"Your request has been received. Please supply your Google Gemini API Key in the prompt or settings "
                f"to stream real-time code synthesis."
            )
            for word in demo_msg.split(" "):
                yield word + " "
                await asyncio.sleep(0.02)
            return

        try:
            genai.configure(api_key=call_key.strip())
            generation_config = genai.GenerationConfig(
                temperature=kwargs.get("temperature", 0.2),
                max_output_tokens=kwargs.get("max_tokens", 8192)
            )

            model = genai.GenerativeModel(
                model_name=clean_model,
                system_instruction=system_prompt if system_prompt else None,
                generation_config=generation_config
            )

            response = await model.generate_content_async(gemini_contents, stream=True)
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Gemini streaming failed ({clean_model}): {str(e)}")
            if "2.5" in clean_model:
                try:
                    logger.info("Retrying stream with gemini-2.0-flash...")
                    fallback_model = genai.GenerativeModel(
                        model_name="gemini-2.0-flash",
                        system_instruction=system_prompt if system_prompt else None
                    )
                    fallback_resp = await fallback_model.generate_content_async(gemini_contents, stream=True)
                    async for chunk in fallback_resp:
                        if chunk.text:
                            yield chunk.text
                    return
                except Exception:
                    pass
            yield f"\n\n[Gemini Streaming Notice: {str(e)}]"

    async def health_check(self) -> bool:
        """Returns True if Gemini API key is present."""
        return self.has_key

    async def unload_model(self, model_id: str) -> bool:
        """Cloud API requires no local VRAM cleanup."""
        return True
