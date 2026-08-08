from typing import Any
from ai.core.logger import logger
from ai.core.exceptions import AgentExecutionError
from ai.intent import IntentResult
from ai.registry import model_registry
from ai.manager import model_manager

from .agents.specialized import (
    PlannerAgent, CodingAgent, ReviewAgent, 
    DebugAgent, SearchAgent, VisionAgent
)

class SupervisorAgent:
    """
    Coordinates sub-agents based on the classified intent.
    In V2, we strictly use the single unified model and differentiate behavior via Agent Prompts.
    """
    
    async def execute_task(self, intent_result: IntentResult, task: str, context: dict) -> Any:
        logger.info(f"Supervisor dispatching intent: {intent_result.intent}")
        
        # Get the unified model (qwen3-vl:8B)
        target_model = model_registry.get_unified_model()
        model_id = target_model.id
        
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
