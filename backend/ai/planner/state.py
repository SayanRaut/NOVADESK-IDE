from ai.core.state import Plan, Task

class PlanState:
    def __init__(self, plan: Plan):
        self.plan = plan
        self.tasks: dict[str, Task] = {t.id: t for t in plan.tasks}

    def next_runnable(self) -> list[Task]:
        """Pending tasks whose dependencies are all done."""
        runnable = []
        for task in self.tasks.values():
            if task.status != "pending":
                continue
            deps = getattr(task, "dependencies", getattr(task, "depends_on", []))
            if all(self.tasks[dep].status == "done" for dep in deps if dep in self.tasks):
                runnable.append(task)
        return runnable

    def mark(self, task_id: str, status: str):
        if task_id in self.tasks:
            self.tasks[task_id].status = status  # type: ignore[assignment]

    def is_complete(self) -> bool:
        return all(t.status == "done" for t in self.tasks.values())

    def has_failed(self) -> bool:
        return any(t.status == "failed" for t in self.tasks.values())

    def summary(self) -> str:
        return "\n".join(
            f"  {t.id} [{t.status}] -> {t.agent}: {getattr(t, 'title', getattr(t, 'description', ''))}"
            for t in self.tasks.values()
        )
