from typing import List, Dict
import json

class MemorySystem:
    """
    Manages Conversation Memory and Workspace Memory.
    Future Vector Memory Support will be integrated here (e.g., Chroma).
    """
    
    def __init__(self):
        self._conversations: Dict[str, List[Dict[str, str]]] = {}
        self._workspace_memory: Dict[str, str] = {}
        
    def add_conversation_message(self, session_id: str, role: str, content: str):
        if session_id not in self._conversations:
            self._conversations[session_id] = []
        self._conversations[session_id].append({"role": role, "content": content})
        
    def get_conversation_history(self, session_id: str, limit: int = 10) -> List[Dict[str, str]]:
        return self._conversations.get(session_id, [])[-limit:]
        
    def store_workspace_summary(self, workspace_id: str, summary: str):
        """Stores a high-level summary of the workspace."""
        self._workspace_memory[workspace_id] = summary
        
    def get_workspace_summary(self, workspace_id: str) -> str:
        return self._workspace_memory.get(workspace_id, "No summary available.")

memory_system = MemorySystem()
