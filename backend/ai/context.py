"""
Context Engine and Context Budgeting for NovaDesk IDE.
Follows Master Plan Section 19 (10-layer Context Engine) and Section 20 (Context Budget).
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from ai.core.logger import logger
from ai.core.state import AgentContext

@dataclass
class ContextEngine:
    """
    Manages 10-layer context compression and budgeting.
    Prioritizes: Current file > Symbols > Imported/Related files > Diagnostics > Git > Terminal.
    """
    max_context_tokens: int = 12000
    
    # Layer budgets (approximate character limits: 1 token ~= 4 characters)
    BUDGETS = {
        "active_file": 24000,    # ~6000 tokens
        "selected_code": 8000,   # ~2000 tokens
        "symbols": 4000,         # ~1000 tokens
        "diagnostics": 4000,     # ~1000 tokens
        "git_state": 2000,       # ~500 tokens
        "terminal": 3000,        # ~750 tokens
        "project_metadata": 3000 # ~750 tokens
    }

    def build_agent_context(
        self,
        user_request: str,
        workspace_root: str = "",
        active_file: str = "",
        active_file_content: str = "",
        selected_code: str = "",
        open_files: Optional[List[str]] = None,
        project_tree: str = "",
        git_status: str = "",
        diagnostics: Optional[List[Dict[str, Any]]] = None,
        terminal_output: str = "",
        symbols: Optional[List[Dict[str, Any]]] = None,
        previous_results: Optional[Dict[str, Any]] = None
    ) -> AgentContext:
        """
        Constructs a structured AgentContext adhering to Rule 1 and Section 14.
        """
        return AgentContext(
            user_request=user_request,
            workspace=workspace_root,
            relevant_files=open_files or [],
            symbols=symbols or [],
            diagnostics=diagnostics or [],
            git_state=git_status,
            terminal_output=terminal_output,
            previous_results=previous_results or {},
            metadata={
                "active_file": active_file,
                "active_file_content": active_file_content[:self.BUDGETS["active_file"]],
                "selected_code": selected_code[:self.BUDGETS["selected_code"]],
                "project_tree": project_tree[:self.BUDGETS["project_metadata"]]
            }
        )

    def format_prompt_context(self, context: AgentContext) -> str:
        """
        Assembles ranked context into a clean prompt string within budget.
        """
        sections = []
        
        # Priority 1: Current file & selected code
        active_file = context.metadata.get("active_file", "")
        active_content = context.metadata.get("active_file_content", "")
        selected_code = context.metadata.get("selected_code", "")
        
        if active_file:
            sections.append(f"### [Current File: {active_file}]\n```{active_file.split('.')[-1] if '.' in active_file else 'text'}\n{active_content}\n```")
        if selected_code:
            sections.append(f"### [Selected Code in {active_file}]\n```\n{selected_code}\n```")

        # Priority 2: Referenced symbols
        if context.symbols:
            sym_text = "\n".join([f"- {s.get('symbol') or s.get('name')} ({s.get('file')}:{s.get('line')})" for s in context.symbols[:10]])
            sections.append(f"### [Referenced Symbols]\n{sym_text}")

        # Priority 3: Diagnostics & Errors
        if context.diagnostics:
            diag_text = "\n".join([f"- [{d.get('severity', 'Error')}] {d.get('file')}:{d.get('line')} - {d.get('message')}" for d in context.diagnostics[:10]])
            sections.append(f"### [Diagnostics / Errors]\n{diag_text}")

        # Priority 4: Git status
        if context.git_state:
            sections.append(f"### [Git State]\n{context.git_state[:self.BUDGETS['git_state']]}")

        # Priority 5: Terminal output
        if context.terminal_output:
            sections.append(f"### [Recent Terminal Output]\n{context.terminal_output[:self.BUDGETS['terminal']]}")

        # Priority 6: Open files & project tree
        if context.relevant_files:
            sections.append(f"### [Open Files]\n{', '.join(context.relevant_files[:15])}")
        
        project_tree = context.metadata.get("project_tree", "")
        if project_tree:
            sections.append(f"### [Project Structure]\n{project_tree[:self.BUDGETS['project_metadata']]}")

        # Priority 7: Previous task results (if in multi-task plan execution)
        if context.previous_results:
            results_text = "\n".join([f"Task {k}: {v[:300]}..." for k, v in context.previous_results.items()])
            sections.append(f"### [Previous Plan Task Results]\n{results_text}")

        return "\n\n".join(sections)

context_engine = ContextEngine()
