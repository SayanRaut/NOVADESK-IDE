from typing import Any
from ai.core.logger import logger
from ai.core.exceptions import AgentExecutionError
from ai.intent import IntentResult
from ai.router import model_router
from ai.manager import model_manager

from .agents.specialized import (
    PlannerAgent, CodingAgent, ReviewAgent, 
    DebugAgent, SearchAgent, VisionAgent
)

class SupervisorAgent:
    """
    Coordinates sub-agents based on the classified intent.
    Maintains shared state and ensures only the correct agent/model is invoked.
    """
    
    async def execute_task(self, intent_result: IntentResult, task: str, context: dict) -> Any:
        logger.info(f"Supervisor dispatching intent: {intent_result.intent}")
        
        # Route to correct model metadata
        target_model = model_router.route(intent_result)
        model_id = target_model.id
        
        # We pass the singleton model_manager (which implements the ProviderInterface conceptually)
        # Wait, the manager has generate/stream, but to implement the interface strictly we can adapt it or pass it.
        # Since ModelManager has `generate` and `stream`, we can pass it directly if we ensure duck typing, 
        # but to be strict, ModelManager wraps the provider.
        
        # Dispatch to the appropriate sub-agent
        if intent_result.intent == "planning":
            agent = PlannerAgent(model_manager, model_id)
        elif intent_result.intent == "vision":
            agent = VisionAgent(model_manager, model_id)
        elif intent_result.intent == "review":
            agent = ReviewAgent(model_manager, model_id)
        elif intent_result.intent == "debug":
            agent = DebugAgent(model_manager, model_id)
        elif intent_result.intent == "search":
            agent = SearchAgent(model_manager, model_id)
        else:
            # Defaults to Coding Agent (e.g. coding, git, testing, documentation, chat)
            agent = CodingAgent(model_manager, model_id)
            
        try:
            return await agent.execute(task, context)
        except Exception as e:
            logger.error(f"Supervisor failed to execute task: {str(e)}")
            raise AgentExecutionError(f"Supervisor encountered an error: {str(e)}")

supervisor_agent = SupervisorAgent()
