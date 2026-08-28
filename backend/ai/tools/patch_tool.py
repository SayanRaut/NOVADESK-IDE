"""
Patch and File Modification Tools for NovaDesk IDE.
Follows Master Plan Section 7, 16, 18.
Enforces safe diff/patch application with automatic checkpoint snapshots.
"""

import os
from typing import Any, Dict, List, Optional
from ai.tools.base import BaseTool
from ai.tools.checkpoint import checkpoint_manager
from ai.core.state import RiskLevel, ToolCategory

class ApplyPatchTool(BaseTool):
    @property
    def name(self) -> str:
        return "apply_patch"

    @property
    def description(self) -> str:
        return "Applies targeted changes to a file or creates/deletes files with automatic checkpoint safety."

    @property
    def category(self) -> ToolCategory:
        return ToolCategory.WRITE

    @property
    def risk_level(self) -> RiskLevel:
        return RiskLevel.MEDIUM

    def validate(self, path: str, content: str = "", action: str = "write", **kwargs) -> bool:
        if not path:
            return False
        if action not in ["write", "create", "delete", "replace_lines"]:
            return False
        return True

    async def execute(self, path: str, content: str = "", action: str = "write", task_id: str = "task", **kwargs) -> Dict[str, Any]:
        abs_path = os.path.abspath(path)
        
        # 1. Snapshot file for checkpoint before modifying
        cp = checkpoint_manager.create_checkpoint(task_id=task_id, file_paths=[abs_path], patch_info=f"{action} on {path}")
        
        try:
            if action in ["write", "create"]:
                os.makedirs(os.path.dirname(abs_path), exist_ok=True)
                with open(abs_path, "w", encoding="utf-8") as f:
                    f.write(content)
                return {
                    "status": "applied",
                    "path": path,
                    "action": action,
                    "checkpoint_id": cp.id,
                    "message": f"Successfully wrote to {path}"
                }
            elif action == "delete":
                if os.path.exists(abs_path):
                    os.remove(abs_path)
                    return {
                        "status": "applied",
                        "path": path,
                        "action": action,
                        "checkpoint_id": cp.id,
                        "message": f"Successfully deleted {path}"
                    }
                else:
                    return {
                        "status": "skipped",
                        "path": path,
                        "action": action,
                        "checkpoint_id": cp.id,
                        "message": f"File {path} does not exist."
                    }
            elif action == "replace_lines":
                target = kwargs.get("target_content", "")
                replacement = kwargs.get("replacement_content", "")
                if not os.path.exists(abs_path):
                    raise FileNotFoundError(f"File {path} not found.")
                with open(abs_path, "r", encoding="utf-8") as f:
                    original = f.read()
                if target not in original:
                    raise ValueError(f"Target content not found in {path}")
                updated = original.replace(target, replacement, 1)
                with open(abs_path, "w", encoding="utf-8") as f:
                    f.write(updated)
                return {
                    "status": "applied",
                    "path": path,
                    "action": action,
                    "checkpoint_id": cp.id,
                    "message": f"Successfully applied line replacement in {path}"
                }
            else:
                raise ValueError(f"Unknown patch action: {action}")
        except Exception as e:
            # On failure, auto rollback checkpoint
            checkpoint_manager.rollback(cp.id)
            raise e
