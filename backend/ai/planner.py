from pydantic import BaseModel
from typing import List, Optional

class PlannerTask(BaseModel):
    title: str
    description: str
    files: List[str]
    priority: str
    estimated_time: str
    dependencies: List[str]
    risk: str
    user_approval_required: bool

class Plan(BaseModel):
    goal: str
    tasks: List[PlannerTask]

class Planner:
    def __init__(self, provider):
        self.provider = provider
        
    async def create_plan(self, request: str, context: dict) -> Plan:
        system_prompt = (
            "You are an expert AI software architect. "
            "Analyze the user's request and the provided context. "
            "Break the work down into a clear, structured execution plan."
        )
        
        prompt = f"Context:\n{context}\n\nUser Request: {request}"
        
        return await self.provider.generate_structured(prompt, schema=Plan, system_prompt=system_prompt)
