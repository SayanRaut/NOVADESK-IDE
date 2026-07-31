from typing import AsyncGenerator
import json

class ChatAssistant:
    def __init__(self, provider):
        self.provider = provider
        
    async def chat_stream(self, message: str, context: dict) -> AsyncGenerator[dict, None]:
        # Build a robust system prompt based on context
        system_prompt = "You are NovaDesk AI, a helpful coding assistant.\n\n"
        
        if context:
            if context.get("active_file"):
                system_prompt += f"Active file: {context['active_file']}\n"
            if context.get("active_file_content"):
                system_prompt += f"Content of active file:\n```\n{context['active_file_content']}\n```\n"
            if context.get("open_files"):
                system_prompt += f"Open files: {', '.join(context['open_files'])}\n"
        
        # Start thinking UI event
        yield {"type": "agent.thinking", "agent": "ChatAssistant"}
        
        # Generate stream from provider
        try:
            stream = self.provider.generate_stream(message, system_prompt=system_prompt)
            async for chunk in stream:
                yield {"type": "response.delta", "delta": chunk}
                
            yield {"type": "response.completed"}
        except Exception as e:
            yield {"type": "error", "message": str(e)}
