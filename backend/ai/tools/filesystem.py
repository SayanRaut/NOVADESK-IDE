import os
from .base import BaseTool

class FilesystemTool(BaseTool):
    @property
    def name(self) -> str:
        return "filesystem_tool"
        
    @property
    def description(self) -> str:
        return "Reads, writes, and lists files."

    def validate(self, action: str, path: str, content: str = "") -> bool:
        if action not in ["read", "write", "list"]:
            return False
        if not path:
            return False
        return True

    async def execute(self, action: str, path: str, content: str = "") -> str:
        abs_path = os.path.abspath(path)
        
        if action == "read":
            if not os.path.exists(abs_path):
                return f"File {path} does not exist."
            with open(abs_path, 'r', encoding='utf-8') as f:
                return f.read()
                
        elif action == "write":
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
            with open(abs_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return f"Successfully wrote to {path}"
            
        elif action == "list":
            if not os.path.isdir(abs_path):
                return f"{path} is not a directory."
            return "\n".join(os.listdir(abs_path))
