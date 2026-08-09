from planner import PlannerAgent
from state import PlanState
from dispatcher import Dispatcher
from memory import Memory


def main():
    memory = Memory()
    memory.project_summary = "IDE project: Python backend, React frontend, local Ollama model."

    planner = PlannerAgent()
    plan = planner.create_plan(
        goal="Add a dark mode toggle to the settings panel",
        project_context=memory.context_block(),
    )

    print("=== PLAN ===")
    print(plan.model_dump_json(indent=2))

    state = PlanState(plan)
    dispatcher = Dispatcher(state, context={"memory": memory})
    results = dispatcher.run()

    print("\n=== TASK STATUS ===")
    print(state.summary())

    print("\n=== RESULTS ===")
    for task_id, result in results.items():
        print(f"  {task_id}: {result}")

    if state.has_failed():
        print("\nPlan finished with failures — inspect the results above.")


if __name__ == "__main__":
    main()
