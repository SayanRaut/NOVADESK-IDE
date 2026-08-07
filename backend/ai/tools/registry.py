from typing import Dict
from .base import BaseTool
from .filesystem import FilesystemTool

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self._register_default_tools()
        
    def _register_default_tools(self):
        self.register(FilesystemTool())
        # In a complete implementation, Terminal, Git, Search, Diff tools would be added here
        
    def register(self, tool: BaseTool):
        self._tools[tool.name] = tool
        
    def get_tool(self, name: str) -> BaseTool:
        if name not in self._tools:
            raise ValueError(f"Tool {name} not found in registry.")
        return self._tools[name]
        
    def get_all_tools(self) -> list[dict]:
        return [{"name": tool.name, "description": tool.description} for tool in self._tools.values()]

tool_registry = ToolRegistry()
