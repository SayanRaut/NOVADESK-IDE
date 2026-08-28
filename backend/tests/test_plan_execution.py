import sys
sys.path.insert(0, 'backend')
from ai.core.state import Plan, Task
from ai.planner.state import PlanState

def test_plan_execution():
    plan = Plan(
        goal="Test Plan Execution",
        tasks=[
            Task(id="1", description="Init repo", agent="coding", dependencies=[]),
            Task(id="2", description="Add tests", agent="testing", dependencies=["1"]),
            Task(id="3", description="Review changes", agent="review", depends_on=["2"])
        ]
    )

    state = PlanState(plan)
    runnable = state.next_runnable()
    assert len(runnable) == 1
    assert runnable[0].id == "1"
    assert runnable[0].depends_on == []
    print("Initial runnable task: Task 1")

    state.mark("1", "done")
    runnable2 = state.next_runnable()
    assert len(runnable2) == 1
    assert runnable2[0].id == "2"
    print("Next runnable task: Task 2")

    state.mark("2", "done")
    runnable3 = state.next_runnable()
    assert len(runnable3) == 1
    assert runnable3[0].id == "3"
    print("Next runnable task: Task 3")

    state.mark("3", "done")
    assert state.is_complete()
    print("Plan execution complete and verified!")

if __name__ == "__main__":
    test_plan_execution()
