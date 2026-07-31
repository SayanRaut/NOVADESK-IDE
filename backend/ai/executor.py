from pydantic import BaseModel
from typing import List, Optional

class FileDiff(BaseModel):
    file_path: str
    original_content: Optional[str]
    new_content: str
    action: str  # "create", "modify", "delete"

class ExecutionResult(BaseModel):
    success: bool
    diffs: List[FileDiff]
    commands_to_run: List[str]
    explanation: str

class Executor:
    def __init__(self, provider):
        self.provider = provider
        
    async def execute_task(self, task: dict, context: dict) -> ExecutionResult:
        system_prompt = (
            "You are an expert AI coding executor. "
            "Given a specific task and the current codebase context, "
            "generate the exact file modifications needed to accomplish the task."
        )
        
        prompt = f"Context:\n{context}\n\nTask to Execute: {task}"
        
        return await self.provider.generate_structured(prompt, schema=ExecutionResult, system_prompt=system_prompt)
