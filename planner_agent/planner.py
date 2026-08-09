import json
import requests
from pydantic import ValidationError

from schema import Plan
from prompts import PLANNER_SYSTEM_PROMPT
from config import Config


class PlannerAgent:
    def __init__(self, config: Config = Config):
        self.config = config

    def _call_ollama(self, messages: list[dict]) -> str:
        resp = requests.post(
            f"{self.config.OLLAMA_URL}/api/chat",
            json={
                "model": self.config.MODEL,
                "messages": messages,
                "stream": False,
                "format": "json",  # forces Ollama to emit valid JSON
                "options": {"temperature": self.config.TEMPERATURE},
            },
            timeout=self.config.TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"]

    def create_plan(self, goal: str, project_context: str = "") -> Plan:
        messages = [
            {"role": "system", "content": PLANNER_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Project context:\n{project_context}\n\nGoal: {goal}",
            },
        ]

        last_error = None
        for attempt in range(self.config.MAX_RETRIES):
            raw = self._call_ollama(messages)
            try:
                data = json.loads(raw)
                return Plan(**data)
            except (json.JSONDecodeError, ValidationError) as e:
                last_error = e
                # Feed the bad output + error back so the model can self-correct
                messages.append({"role": "assistant", "content": raw})
                messages.append(
                    {
                        "role": "user",
                        "content": f"That was invalid ({e}). Return corrected JSON only, "
                        f"matching the schema exactly. No commentary.",
                    }
                )

        raise RuntimeError(
            f"Planner failed to produce a valid plan after {self.config.MAX_RETRIES} attempts: {last_error}"
        )
