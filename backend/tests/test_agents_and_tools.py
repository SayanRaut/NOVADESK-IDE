"""
Unit tests for NovaDesk IDE Agent State, Checkpoints, Tools, and Context Engine.
Follows Master Plan Section 31 (Testing Strategy).
"""

import os
import tempfile
from ai.core.state import Plan, Task, AgentState, AgentContext
from ai.tools.checkpoint import CheckpointManager
from ai.tools.registry import ToolRegistry, tool_registry
from ai.tools.patch_tool import ApplyPatchTool
from ai.context import context_engine

def test_plan_graph_validation():
    # Valid plan
    valid_plan = Plan(
        goal="Build authentication",
        summary="Implement OAuth",
        tasks=[
            Task(id="task-1", title="Inspect auth", agent="search", dependencies=[]),
            Task(id="task-2", title="Implement OAuth", agent="coding", dependencies=["task-1"]),
            Task(id="task-3", title="Review security", agent="review", dependencies=["task-2"]),
        ]
    )
    is_valid, msg = valid_plan.validate_graph()
    assert is_valid is True

    # Duplicate task IDs
    dup_plan = Plan(
        goal="Test",
        tasks=[
            Task(id="task-1", title="A", agent="search"),
            Task(id="task-1", title="B", agent="coding"),
        ]
    )
    is_valid, msg = dup_plan.validate_graph()
    assert is_valid is False
    assert "Duplicate" in msg

    # Circular dependency
    cycle_plan = Plan(
        goal="Test cycle",
        tasks=[
            Task(id="task-1", title="A", agent="search", dependencies=["task-2"]),
            Task(id="task-2", title="B", agent="coding", dependencies=["task-1"]),
        ]
    )
    is_valid, msg = cycle_plan.validate_graph()
    assert is_valid is False
    assert "Circular" in msg

def test_checkpoint_and_rollback():
    cm = CheckpointManager()
    with tempfile.TemporaryDirectory() as tmpdir:
        test_file = os.path.join(tmpdir, "sample.txt")
        with open(test_file, "w", encoding="utf-8") as f:
            f.write("Original Version 1")

        # 1. Snapshot checkpoint
        cp = cm.create_checkpoint(task_id="task-100", file_paths=[test_file])
        assert cp.id in cm._checkpoints

        # 2. Modify file
        with open(test_file, "w", encoding="utf-8") as f:
            f.write("Modified Version 2")

        # 3. Rollback
        success, msg = cm.rollback(cp.id)
        assert success is True
        with open(test_file, "r", encoding="utf-8") as f:
            restored = f.read()
        assert restored == "Original Version 1"

def test_tool_registry_categories():
    tools = tool_registry.list_tools()
    assert len(tools) >= 5
    tool_names = [t["name"] for t in tools]
    assert "filesystem_tool" in tool_names
    assert "apply_patch" in tool_names
    assert "search_tool" in tool_names
    assert "run_command" in tool_names
    assert "git_tool" in tool_names

def test_context_engine_budgeting():
    ctx = context_engine.build_agent_context(
        user_request="Refactor login component",
        active_file="src/Login.tsx",
        active_file_content="export const Login = () => <div>Login</div>;",
        git_status="M src/Login.tsx"
    )
    assert ctx.metadata["active_file"] == "src/Login.tsx"
    prompt_str = context_engine.format_prompt_context(ctx)
    assert "src/Login.tsx" in prompt_str
    assert "export const Login" in prompt_str
    assert "Git State" in prompt_str

if __name__ == "__main__":
    test_plan_graph_validation()
    test_checkpoint_and_rollback()
    test_tool_registry_categories()
    test_context_engine_budgeting()
    print("All backend unit tests passed successfully!")
