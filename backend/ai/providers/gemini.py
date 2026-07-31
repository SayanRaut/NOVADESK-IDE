import google.generativeai as genai
from typing import Any, AsyncGenerator
from .base import AIProvider
from config.settings import settings
import json
import os

class GeminiProvider(AIProvider):
    def __init__(self, api_key: str = None):
        key = api_key or os.environ.get("GEMINI_API_KEY")
        if not key:
            raise ValueError("Gemini API key is missing.")
        genai.configure(api_key=key)
        
    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            system_instruction=system_prompt if system_prompt else None
        )
        response = model.generate_content(prompt)
        return response.text

    async def generate_stream(self, prompt: str, system_prompt: str = "") -> AsyncGenerator[str, None]:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            system_instruction=system_prompt if system_prompt else None
        )
        response = model.generate_content(prompt, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text

    async def generate_structured(self, prompt: str, schema: Any, system_prompt: str = "") -> Any:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            system_instruction=system_prompt if system_prompt else None,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            ),
        )
        # Note: If passing a pydantic schema, we should format the prompt to request it,
        # or use Gemini's built-in structured output if using google-genai SDK.
        # For simplicity, we just ask for JSON matching the schema.
        prompt_with_schema = f"{prompt}\n\nPlease output valid JSON matching this schema:\n{schema.schema_json()}"
        response = model.generate_content(prompt_with_schema)
        try:
            return schema.parse_raw(response.text)
        except Exception as e:
            raise ValueError(f"Failed to parse structured output: {e}\nRaw output: {response.text}")
