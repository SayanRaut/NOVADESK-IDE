from typing import Dict, Any, Callable, Awaitable
from ai.planner.state import PlanState
from ai.core.logger import logger

# Import the actual specialized agents to handle tasks
from ai.agents.specialized import CodingAgent, DebugAgent, ReviewAgent
from ai.manager import model_manager
from ai.registry import model_registry

class Dispatcher:
    def __init__(self, state: PlanState, context: dict = None, websocket=None):
        self.state = state
        self.context = context or {}
        self.websocket = websocket
        
        target_model = model_registry.get_unified_model().id
        
        # Map schema agents to specialized agents
        self.agent_handlers: Dict[str, Any] = {
            "coder": CodingAgent(model_manager, target_model),
            "debugger": DebugAgent(model_manager, target_model),
            "reviewer": ReviewAgent(model_manager, target_model),
            "tester": CodingAgent(model_manager, target_model),  # Fallback to Coder for testing
        }

    async def run(self) -> dict[str, str]:
        results: dict[str, str] = {}

        while not self.state.is_complete() and not self.state.has_failed():
            runnable = self.state.next_runnable()
            if not runnable:
                logger.warning("Dispatcher stuck: Broken dependency graph.")
                break

            for task in runnable:
                self.state.mark(task.id, "running")
                
                # Stream progress if websocket is provided
                if self.websocket:
                    await self.websocket.send_json({
                        "type": "progress", 
                        "status": f"Running Task {task.id}: {task.agent.title()} is working..."
                    })
                    
                try:
                    agent = self.agent_handlers.get(task.agent, self.agent_handlers["coder"])
                    # Provide context including previous results
                    task_context = f"{self.context}\n\nPrevious Task Results:\n{results}"
                    
                    # Execute the task
                    result = await agent.execute(task.description, task_context)
                    
                    results[task.id] = result
                    self.state.mark(task.id, "done")
                    
                    if self.websocket:
                        # Output the agent's work directly into the chat stream!
                        await self.websocket.send_json({"type": "response.delta", "delta": f"\n\n### ✅ Task {task.id} Complete\n{result}\n"})
                        
                except Exception as e:
                    self.state.mark(task.id, "failed")
                    results[task.id] = f"ERROR: {e}"
                    logger.error(f"Task {task.id} failed: {e}")
                    
                    if self.websocket:
                         await self.websocket.send_json({"type": "response.delta", "delta": f"\n\n### ❌ Task {task.id} Failed\n{e}\n"})

        return results
