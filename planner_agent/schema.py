from typing import List, Literal
from pydantic import BaseModel, Field

AgentName = Literal["coder", "debugger", "tester", "reviewer"]
TaskStatus = Literal["pending", "running", "done", "failed"]


class Task(BaseModel):
    id: str
    description: str
    agent: AgentName
    depends_on: List[str] = Field(default_factory=list)
    status: TaskStatus = "pending"


class Plan(BaseModel):
    goal: str
    tasks: List[Task]

    def get(self, task_id: str) -> Task:
        for t in self.tasks:
            if t.id == task_id:
                return t
        raise KeyError(f"No task with id {task_id}")
