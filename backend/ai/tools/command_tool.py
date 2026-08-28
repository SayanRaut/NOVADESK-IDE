"""
Execution Tools for NovaDesk IDE.
Follows Master Plan Section 11 (Testing Agent), 16, 17.
Enforces timeouts, safe execution, and output capture.
"""

import asyncio
import os
from typing import Any, Dict, List, Optional
from ai.tools.base import BaseTool
from ai.core.state import RiskLevel, ToolCategory

class CommandTool(BaseTool):
    @property
    def name(self) -> str:
        return "run_command"

    @property
    def description(self) -> str:
        return "Executes shell commands or test runners in the workspace with timeout control."

    @property
    def category(self) -> ToolCategory:
        return ToolCategory.EXECUTE

    @property
    def risk_level(self) -> RiskLevel:
        return RiskLevel.HIGH

    @property
    def timeout_seconds(self) -> float:
        return 60.0

    def validate(self, command: str, cwd: str = ".", **kwargs) -> bool:
        if not command or not command.strip():
            return False
        # Block dangerous destructive system commands
        dangerous = ["rm -rf /", "mkfs", "dd if=", ":(){ :|:& };:"]
        for d in dangerous:
            if d in command:
                return False
        return True

    async def execute(self, command: str, cwd: str = ".", **kwargs) -> Dict[str, Any]:
        working_dir = os.path.abspath(cwd)
        process = await asyncio.create_subprocess_shell(
            command,
            cwd=working_dir,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=self.timeout_seconds)
            return {
                "command": command,
                "exit_code": process.returncode,
                "stdout": stdout.decode("utf-8", errors="replace")[:10000],
                "stderr": stderr.decode("utf-8", errors="replace")[:5000],
                "success": process.returncode == 0
            }
        except asyncio.TimeoutError:
            process.kill()
            return {
                "command": command,
                "exit_code": -1,
                "stdout": "",
                "stderr": f"Command timed out after {self.timeout_seconds} seconds.",
                "success": False
            }
