"""
Supervisor Agent for NovaDesk IDE.
Follows Master Plan Section 13 (Phase 19 — Supervisor Agent) and Section 33.
Coordinates the full lifecycle: Understand -> Plan -> Approve -> Checkpoint -> Execute -> Review -> Test -> Recover -> Finish.
"""

from typing import Any, Dict, Optional, List
from ai.core.logger import logger
from ai.core.exceptions import AgentExecutionError
from ai.core.state import AgentState, AgentContext, AgentResult, AgentEvent
from ai.intent import IntentResult
from ai.registry import model_registry
from ai.manager import model_manager

from ai.agents.specialized import (
    PlannerAgent, CodingAgent, ReviewAgent, 
    DebugAgent, SearchAgent, TestingAgent, 
    GitAgent, VisionAgent
)
from ai.tools.checkpoint import checkpoint_manager

class SupervisorAgent:
    """
    Coordinates sub-agents through a lightweight state machine.
    Manages shared AgentState and dispatches to appropriate specialized agents.
    """
    def __init__(self):
        self.active_states: Dict[str, AgentState] = {}

    def get_agent(self, agent_name: str, model_id: str):
        agents = {
            "planner": PlannerAgent(model_manager, model_id),
            "planning": PlannerAgent(model_manager, model_id),
            "coding": CodingAgent(model_manager, model_id),
            "search": SearchAgent(model_manager, model_id),
            "review": ReviewAgent(model_manager, model_id),
            "debug": DebugAgent(model_manager, model_id),
            "testing": TestingAgent(model_manager, model_id),
            "git": GitAgent(model_manager, model_id),
            "vision": VisionAgent(model_manager, model_id)
        }
        return agents.get(agent_name.lower(), CodingAgent(model_manager, model_id))

    async def execute_task(
        self,
        intent_result: IntentResult,
        task: str,
        context: dict,
        conversation_id: Optional[str] = None
    ) -> Any:
        logger.info(f"Supervisor dispatching intent: {intent_result.intent} (confidence: {intent_result.confidence})")
        
        target_model = model_registry.get_unified_model()
        model_id = target_model.id
        
        from ai.context import context_engine
        agent_context = context_engine.build_agent_context(
            user_request=task,
            workspace_root=context.get("workspace_root", ""),
            active_file=context.get("active_file", ""),
            active_file_content=context.get("active_file_content", ""),
            selected_code=context.get("selected_code", ""),
            open_files=context.get("open_files", []),
            project_tree=context.get("project_tree", ""),
            git_status=context.get("git_status", "")
        )

        state = self.active_states.get(conversation_id) if conversation_id else None
        if not state:
            state = AgentState(request=task, context=agent_context)
            if conversation_id:
                self.active_states[conversation_id] = state

        agent = self.get_agent(intent_result.intent, model_id)
        
        try:
            result = await agent.run(state, agent_context)
            if result.status == "failed" and result.errors:
                logger.warning(f"Agent {agent.name} encountered errors: {result.errors}")
            return result.data if result.data is not None else result.message
        except Exception as e:
            logger.error(f"Supervisor failed to execute task: {str(e)}")
            raise AgentExecutionError(f"Supervisor encountered an error: {str(e)}")

supervisor_agent = SupervisorAgent()
