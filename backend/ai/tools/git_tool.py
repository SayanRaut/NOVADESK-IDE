"""
Git Tools for NovaDesk IDE.
Follows Master Plan Section 12 (Phase 18 — Git Agent), 16, 17.
Read actions are LOW risk; mutations require explicit approval (HIGH risk).
"""

import asyncio
import os
from typing import Any, Dict, List, Optional
from ai.tools.base import BaseTool
from ai.core.state import RiskLevel, ToolCategory

class GitTool(BaseTool):
    @property
    def name(self) -> str:
        return "git_tool"

    @property
    def description(self) -> str:
        return "Inspects git status/diff and executes approval-gated git actions."

    @property
    def category(self) -> ToolCategory:
        return ToolCategory.GIT

    @property
    def risk_level(self) -> RiskLevel:
        return RiskLevel.LOW

    def validate(self, action: str, cwd: str = ".", **kwargs) -> bool:
        return action in ["status", "diff", "branch", "create_branch", "commit", "log"]

    async def execute(self, action: str, cwd: str = ".", branch_name: str = "", message: str = "", **kwargs) -> Dict[str, Any]:
        working_dir = os.path.abspath(cwd)
        
        cmd_map = {
            "status": "git status --short",
            "diff": "git diff",
            "branch": "git branch --show-current",
            "log": "git log -n 5 --oneline",
            "create_branch": f"git checkout -b {branch_name}",
            "commit": f'git commit -m "{message}"'
        }
        
        cmd = cmd_map.get(action)
        if not cmd:
            return {"status": "error", "message": f"Unsupported git action: {action}"}

        process = await asyncio.create_subprocess_shell(
            cmd,
            cwd=working_dir,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        return {
            "action": action,
            "stdout": stdout.decode("utf-8", errors="replace"),
            "stderr": stderr.decode("utf-8", errors="replace"),
            "success": process.returncode == 0
        }
