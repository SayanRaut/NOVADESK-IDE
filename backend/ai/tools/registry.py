"""
Central Tool Registry for NovaDesk IDE.
Follows Master Plan Section 16 & 17.
"""

from typing import Dict, List, Optional, Any
from ai.tools.base import BaseTool
from ai.tools.filesystem import FilesystemTool
from ai.tools.patch_tool import ApplyPatchTool
from ai.tools.search_tool import SearchTool
from ai.tools.command_tool import CommandTool
from ai.tools.git_tool import GitTool
from ai.core.state import RiskLevel, ToolCategory

class ToolRegistry:
    """
    Central registry for all tools grouped by category and risk level.
    """
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        # READ (LOW)
        self.register_tool(FilesystemTool())
        self.register_tool(SearchTool())
        
        # WRITE (MEDIUM)
        self.register_tool(ApplyPatchTool())
        
        # EXECUTE (HIGH)
        self.register_tool(CommandTool())
        
        # GIT (LOW/HIGH)
        self.register_tool(GitTool())

    def register_tool(self, tool: BaseTool):
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": t.name,
                "description": t.description,
                "category": t.category.value,
                "risk_level": t.risk_level.value,
                "timeout_seconds": t.timeout_seconds
            }
            for t in self._tools.values()
        ]

    def get_tools_by_category(self, category: ToolCategory) -> List[BaseTool]:
        return [t for t in self._tools.values() if t.category == category]

    def get_tools_by_risk(self, risk: RiskLevel) -> List[BaseTool]:
        return [t for t in self._tools.values() if t.risk_level == risk]

# Singleton instance
tool_registry = ToolRegistry()
