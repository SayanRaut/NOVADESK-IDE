from state import PlanState

# Stub handlers — swap each of these for a real call into your coder/debugger/
# tester/reviewer agent (likely another Ollama call with a different system prompt,
# or a call to the same model with different tools attached).
AGENT_HANDLERS = {
    "coder": lambda task, ctx: f"[coder] would implement: {task.description}",
    "debugger": lambda task, ctx: f"[debugger] would investigate: {task.description}",
    "tester": lambda task, ctx: f"[tester] would test: {task.description}",
    "reviewer": lambda task, ctx: f"[reviewer] would review: {task.description}",
}


class Dispatcher:
    def __init__(self, state: PlanState, context: dict | None = None):
        self.state = state
        self.context = context or {}

    def run(self) -> dict[str, str]:
        results: dict[str, str] = {}

        while not self.state.is_complete() and not self.state.has_failed():
            runnable = self.state.next_runnable()
            if not runnable:
                break  # no runnable tasks left but plan isn't done -> broken dependency graph

            for task in runnable:
                self.state.mark(task.id, "running")
                try:
                    handler = AGENT_HANDLERS[task.agent]
                    results[task.id] = handler(task, self.context)
                    self.state.mark(task.id, "done")
                except Exception as e:
                    self.state.mark(task.id, "failed")
                    results[task.id] = f"ERROR: {e}"

        return results
