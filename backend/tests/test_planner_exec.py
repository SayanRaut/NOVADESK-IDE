import sys
sys.path.insert(0, 'backend')
import asyncio
from ai.intent import IntentResult
from ai.supervisor import supervisor_agent
from ai.core.state import Plan, Task

async def run_test():
    intent = IntentResult(intent='planning', confidence=0.95)
    # Test with string context
    res1 = await supervisor_agent.execute_task(intent, "Test task 1", "string context")
    print("Test with string context completed without 'get' error!")
    
    # Test with dict context
    res2 = await supervisor_agent.execute_task(intent, "Test task 2", {"workspace_root": "."})
    print("Test with dict context completed successfully!")

if __name__ == "__main__":
    # Test Plan model normalization
    sample_plan = Plan(
        goal="Test plan",
        tasks=[
            Task(id="1", description="Implement counter", agent="coder", depends_on=[]),
            Task(id="2", description="Test counter", agent="tester", depends_on=["1"])
        ]
    )
    assert sample_plan.tasks[0].agent == "coding"
    assert sample_plan.tasks[0].title == "Implement counter"
    assert sample_plan.tasks[1].agent == "testing"
    assert sample_plan.tasks[1].dependencies == ["1"]
    print("Plan model alias and normalization verified!")
