"""
Dispatcher for executing structured plans in NovaDesk IDE.
Coordinates task execution across specialized agents with checkpoints and event streaming.
"""

import os
import re
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

def save_generated_files(text: str, workspace_root: str, task_desc: str = "") -> list[dict]:
    """
    Extracts code blocks and target filenames from text and writes them to workspace_root.
    Returns list of dicts with {"path": rel_path, "lines": count, "content": code_content}
    """
    saved_files = []

    # 1. Matches: ### File: path/to/file.ext or // File: path/to/file.ext
    pattern1 = re.compile(
        r'(?:###\s*File:?|//\s*File:?|#\s*File:?|File:|Filename:)\s*[`\'"]?([a-zA-Z0-9_\-\./\\]+)[`\'"]?\s*\r?\n+```[a-zA-Z0-9_\-\.]*\r?\n([\s\S]*?)```',
        re.IGNORECASE
    )
    matches = pattern1.findall(text)
    for file_path_str, code_content in matches:
        clean_path = file_path_str.strip().replace('\\', '/')
        if clean_path.startswith('/'):
            clean_path = clean_path[1:]
        
        if workspace_root and os.path.exists(workspace_root):
            full_path = os.path.join(workspace_root, clean_path)
            try:
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(code_content)
                logger.info(f"Dispatcher successfully created/updated: {clean_path}")
            except Exception as e:
                logger.error(f"Dispatcher failed to write file {clean_path}: {e}")

        saved_files.append({
            "path": clean_path, 
            "lines": len(code_content.splitlines()),
            "content": code_content
        })

    # 2. If no header matched, check if task description specified a filename and code block exists
    if not saved_files:
        file_match = re.search(r'([a-zA-Z0-9_\-\./\\]+\.(?:ts|tsx|js|jsx|py|html|css|json|md|rs|go|java|c|cpp|sql|sh))', task_desc, re.IGNORECASE)
        code_blocks = re.findall(r'```(?:[a-zA-Z0-9_\-\.]*)\r?\n([\s\S]*?)```', text)
        if file_match and code_blocks:
            clean_path = file_match.group(1).strip().replace('\\', '/')
            if clean_path.startswith('/'):
                clean_path = clean_path[1:]
            code_content = code_blocks[0]
            
            if workspace_root and os.path.exists(workspace_root):
                full_path = os.path.join(workspace_root, clean_path)
                try:
                    os.makedirs(os.path.dirname(full_path), exist_ok=True)
                    with open(full_path, "w", encoding="utf-8") as f:
                        f.write(code_content)
                    logger.info(f"Dispatcher created file from task match: {clean_path}")
                except Exception as e:
                    logger.error(f"Dispatcher failed to write inferred file {clean_path}: {e}")

            saved_files.append({
                "path": clean_path, 
                "lines": len(code_content.splitlines()),
                "content": code_content
            })

    return saved_files


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
        workspace_root = self.context.get("workspace_root") if isinstance(self.context, dict) else ""

        while not self.state.is_complete() and not self.state.has_failed():
            runnable = self.state.next_runnable()
            if not runnable:
                logger.warning("Dispatcher: No more runnable tasks or circular dependency.")
                break

            for task in runnable:
                self.state.mark(task.id, "running")
                task_desc = getattr(task, "title", getattr(task, "description", ""))
                
                if self.websocket:
                    await self.websocket.send_json({
                        "type": "progress", 
                        "status": f"Running Task {task.id}: {task.agent.title()} is working..."
                    })
                    
                try:
                    agent = self.agent_handlers.get(task.agent.lower(), self.agent_handlers["coder"])
                    task_context = f"{self.context}\n\nPrevious Task Results:\n{results}"
                    
                    # Execute the task
                    result = await agent.execute(task_desc, task_context)
                    
                    # Save generated files to the workspace
                    saved = save_generated_files(result, workspace_root, task_desc)
                    if saved:
                        saved_summary = ", ".join([f"`{f['path']}` ({f['lines']} lines)" for f in saved])
                        file_notice = f"\n\n📂 **Generated & Saved Files:** {saved_summary}"
                        # Notify frontend over websocket to write locally & refresh file explorer
                        if self.websocket:
                            for f in saved:
                                await self.websocket.send_json({
                                    "type": "agent.artifact",
                                    "path": f["path"],
                                    "content": f.get("content", ""),
                                    "requestFeedback": False
                                })
                    else:
                        file_notice = ""
                    
                    results[task.id] = result
                    self.state.mark(task.id, "done")
                    
                    if self.websocket:
                        await self.websocket.send_json({
                            "type": "response.delta", 
                            "delta": f"\n\n### ✅ Task {task.id} Complete ({task.agent.title()}){file_notice}\n{result}\n"
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
