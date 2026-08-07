from dataclasses import dataclass, field
import tiktoken
from ..core.logger import logger

@dataclass
class ContextEngine:
    """
    Manages and compresses context from Workspace, open tabs, terminal, etc.
    """
    max_context_tokens: int = 16000
    
    def compress_context(self, active_file: str, open_files: list, git_status: str, recent_terminal: str) -> str:
        """Compresses context automatically."""
        # A rudimentary token estimator
        # To truly estimate tokens, we should use a real tokenizer. Using tiktoken approximation.
        try:
            encoding = tiktoken.get_encoding("cl100k_base")
        except Exception:
            encoding = None
            
        context = []
        if active_file:
            context.append(f"Active File:\n{active_file}\n")
        
        if git_status:
            context.append(f"Git Status:\n{git_status}\n")
            
        if recent_terminal:
            context.append(f"Recent Terminal Output:\n{recent_terminal}\n")
            
        if open_files:
            context.append(f"Open Files Summary:\n{', '.join(open_files)}\n")
            
        full_context = "\n---\n".join(context)
        
        if encoding:
            tokens = encoding.encode(full_context)
            if len(tokens) > self.max_context_tokens:
                logger.warning(f"Context exceeds {self.max_context_tokens} tokens. Truncating.")
                # Truncate to max tokens
                truncated = tokens[:self.max_context_tokens]
                full_context = encoding.decode(truncated)
                full_context += "\n...[Context Truncated]"
                
        return full_context

context_engine = ContextEngine()
