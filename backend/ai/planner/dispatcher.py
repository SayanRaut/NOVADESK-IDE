"""
Dispatcher for executing structured plans in NovaDesk IDE.
Coordinates task execution across specialized agents with checkpoints and event streaming.
"""

from typing import Dict, Any, Optional
from ai.planner.state import PlanState
from ai.core.logger import logger
from ai.agents.specialized import (
    CodingAgent, DebugAgent, ReviewAgent, 
    SearchAgent, TestingAgent, GitAgent
)
from ai.manager import model_manager
from ai.registry import model_registry
from ai.tools.checkpoint import checkpoint_manager

class Dispatcher:
    def __init__(self, state: PlanState, context: dict = None, websocket=None):
        self.state = state
        self.context = context or {}
        self.websocket = websocket
        
        target_model = model_registry.get_unified_model().id
        
        # Map all standard agent names
        self.agent_handlers: Dict[str, Any] = {
            "coder": CodingAgent(model_manager, target_model),
            "coding": CodingAgent(model_manager, target_model),
            "search": SearchAgent(model_manager, target_model),
            "debugger": DebugAgent(model_manager, target_model),
            "debug": DebugAgent(model_manager, target_model),
            "reviewer": ReviewAgent(model_manager, target_model),
            "review": ReviewAgent(model_manager, target_model),
            "tester": TestingAgent(model_manager, target_model),
            "testing": TestingAgent(model_manager, target_model),
            "git": GitAgent(model_manager, target_model)
        }

    async def run(self) -> dict[str, str]:
        results: dict[str, str] = {}

        while not self.state.is_complete() and not self.state.has_failed():
            runnable = self.state.next_runnable()
            if not runnable:
                logger.warning("Dispatcher: No more runnable tasks or circular dependency.")
                break

            for task in runnable:
                self.state.mark(task.id, "running")
                
                if self.websocket:
                    await self.websocket.send_json({
                        "type": "progress", 
                        "status": f"Running Task {task.id}: {task.agent.title()} is working..."
                    })
                    
                try:
                    agent = self.agent_handlers.get(task.agent.lower(), self.agent_handlers["coder"])
                    task_context = f"{self.context}\n\nPrevious Task Results:\n{results}"
                    
                    # Execute the task
                    result = await agent.execute(task.description, task_context)
                    
                    results[task.id] = result
                    self.state.mark(task.id, "done")
                    
                    if self.websocket:
                        await self.websocket.send_json({
                            "type": "response.delta", 
                            "delta": f"\n\n### ✅ Task {task.id} Complete ({task.agent.title()})\n{result}\n"
                        })
                        
                except Exception as e:
                    self.state.mark(task.id, "failed")
                    results[task.id] = f"ERROR: {e}"
                    logger.error(f"Task {task.id} failed: {e}")
                    
                    if self.websocket:
                        await self.websocket.send_json({
                            "type": "response.delta", 
                            "delta": f"\n\n### ❌ Task {task.id} Failed\n{e}\n"
                        })

        return results
