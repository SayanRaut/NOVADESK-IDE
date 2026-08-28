"""
Shared Agent State, Context, and Event Models for NovaDesk IDE.
Follows Master Plan Sections 4, 14, 15, and 30.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field as PydanticField

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class ToolCategory(str, Enum):
    READ = "READ"
    WRITE = "WRITE"
    EXECUTE = "EXECUTE"
    GIT = "GIT"

AgentName = Literal[
    "planner", "coding", "search", "review", 
    "debug", "testing", "git", "vision", "chat"
]

TaskStatus = Literal["pending", "running", "done", "failed", "skipped"]

class Task(BaseModel):
    id: str
    title: str
    description: str = ""
    agent: AgentName
    dependencies: List[str] = PydanticField(default_factory=list)
    status: TaskStatus = "pending"
    result: Optional[str] = None
    error: Optional[str] = None

class Plan(BaseModel):
    goal: str
    summary: str = ""
    tasks: List[Task] = PydanticField(default_factory=list)

    def get_task(self, task_id: str) -> Optional[Task]:
        for t in self.tasks:
            if t.id == task_id:
                return t
        return None

    def validate_graph(self) -> tuple[bool, str]:
        """Validates unique IDs and absence of circular dependencies."""
        ids = set()
        for t in self.tasks:
            if t.id in ids:
                return False, f"Duplicate task ID: {t.id}"
            ids.add(t.id)

        for t in self.tasks:
            for dep in t.dependencies:
                if dep not in ids:
                    return False, f"Task {t.id} has non-existent dependency: {dep}"
                if dep == t.id:
                    return False, f"Task {t.id} cannot depend on itself"

        # Check for cycles using DFS
        visited = set()
        recursion_stack = set()

        def has_cycle(curr_id: str) -> bool:
            visited.add(curr_id)
            recursion_stack.add(curr_id)
            task = self.get_task(curr_id)
            if task:
                for dep in task.dependencies:
                    if dep not in visited:
                        if has_cycle(dep):
                            return True
                    elif dep in recursion_stack:
                        return True
            recursion_stack.remove(curr_id)
            return False

        for t in self.tasks:
            if t.id not in visited:
                if has_cycle(t.id):
                    return False, "Circular dependency detected in plan tasks"

        return True, "Valid"

@dataclass
class AgentEvent:
    type: str  # agent_started, task_started, tool_started, checkpoint_created, test_started, etc.
    agent: str
    message: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    data: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "agent": self.agent,
            "message": self.message,
            "timestamp": self.timestamp,
            "data": self.data
        }

@dataclass
class AgentContext:
    user_request: str = ""
    workspace: str = ""
    relevant_files: List[str] = field(default_factory=list)
    symbols: List[Dict[str, Any]] = field(default_factory=list)
    diagnostics: List[Dict[str, Any]] = field(default_factory=list)
    git_state: str = ""
    terminal_output: str = ""
    previous_results: Dict[str, Any] = field(default_factory=dict)
    permissions: Dict[str, bool] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class AgentResult:
    status: Literal["success", "failed", "needs_approval", "in_progress"] = "success"
    message: str = ""
    data: Any = None
    events: List[AgentEvent] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)

@dataclass
class AgentState:
    request: str = ""
    plan: Optional[Plan] = None
    current_task: Optional[str] = None
    completed_tasks: List[str] = field(default_factory=list)
    context: AgentContext = field(default_factory=AgentContext)
    tool_results: Dict[str, Any] = field(default_factory=dict)
    changes: List[Dict[str, Any]] = field(default_factory=list)
    diagnostics: List[Dict[str, Any]] = field(default_factory=list)
    test_results: List[Dict[str, Any]] = field(default_factory=list)
    review_results: List[Dict[str, Any]] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    checkpoint_id: Optional[str] = None
    status: str = "idle"
    retry_count: int = 0
    max_retries: int = 3
