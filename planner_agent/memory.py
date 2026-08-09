class Memory:
    def __init__(self):
        self.project_summary = ""
        self.history: list[dict] = []

    def add(self, role: str, content: str):
        self.history.append({"role": role, "content": content})

    def context_block(self, recent_turns: int = 6) -> str:
        """Compact context to feed the planner. Keep this short — every token here
        eats into the context budget you have left for the actual task."""
        recent = self.history[-recent_turns:]
        convo = "\n".join(f"{h['role']}: {h['content']}" for h in recent)
        return f"{self.project_summary}\n\nRecent:\n{convo}".strip()
