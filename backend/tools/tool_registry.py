class ToolRegistry:
    """
    Central registry for all tools. 
    Agents request tools through here.
    """
    def __init__(self):
        self._tools = {}
        
    def register_tool(self, name: str, tool_instance):
        self._tools[name] = tool_instance
        
    def get_tool(self, name: str):
        if name not in self._tools:
            raise ValueError(f"Tool {name} not found in registry.")
        return self._tools[name]
        
    def list_tools(self):
        return list(self._tools.keys())

# Singleton instance
tool_registry = ToolRegistry()
