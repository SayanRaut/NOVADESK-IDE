"""
Search Tools for NovaDesk IDE.
Follows Master Plan Section 8 (Phase 14) and Rule 5 (Exact search before semantic search).
"""

import os
import re
from typing import Any, Dict, List, Optional
from ai.tools.base import BaseTool
from ai.core.state import RiskLevel, ToolCategory

class SearchTool(BaseTool):
    @property
    def name(self) -> str:
        return "search_tool"

    @property
    def description(self) -> str:
        return "Searches files, text, symbols, and dependencies in the workspace."

    @property
    def category(self) -> ToolCategory:
        return ToolCategory.READ

    @property
    def risk_level(self) -> RiskLevel:
        return RiskLevel.LOW

    def validate(self, query: str, search_type: str = "text", workspace_root: str = ".", **kwargs) -> bool:
        if not query:
            return False
        if search_type not in ["file", "text", "symbol", "dependency", "read"]:
            return False
        return True

    async def execute(self, query: str, search_type: str = "text", workspace_root: str = ".", max_results: int = 20, **kwargs) -> Dict[str, Any]:
        root = os.path.abspath(workspace_root)
        if not os.path.exists(root):
            return {"status": "error", "message": f"Workspace root '{workspace_root}' not found."}

        ignored_dirs = {".git", "node_modules", "dist", "dist-electron", "__pycache__", ".venv", ".novadesk"}
        results = []

        if search_type == "file":
            # Find files by name, path, extension
            query_lower = query.lower()
            for dirpath, dirnames, filenames in os.walk(root):
                dirnames[:] = [d for d in dirnames if d not in ignored_dirs]
                for f in filenames:
                    rel_path = os.path.relpath(os.path.join(dirpath, f), root)
                    if query_lower in f.lower() or query_lower in rel_path.lower():
                        results.append({
                            "type": "file",
                            "name": f,
                            "path": rel_path
                        })
                        if len(results) >= max_results:
                            break
                if len(results) >= max_results:
                    break

        elif search_type == "text":
            # Text search across files
            regex = re.compile(re.escape(query), re.IGNORECASE)
            for dirpath, dirnames, filenames in os.walk(root):
                dirnames[:] = [d for d in dirnames if d not in ignored_dirs]
                for f in filenames:
                    # Only search code / text files
                    if f.endswith(('.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.md', '.css', '.html', '.sql', '.toml', '.env')):
                        file_path = os.path.join(dirpath, f)
                        rel_path = os.path.relpath(file_path, root)
                        try:
                            with open(file_path, "r", encoding="utf-8", errors="ignore") as file_obj:
                                for line_num, line in enumerate(file_obj, 1):
                                    if regex.search(line):
                                        results.append({
                                            "file": rel_path,
                                            "line": line_num,
                                            "content": line.strip()[:200]
                                        })
                                        if len(results) >= max_results:
                                            break
                        except Exception:
                            continue
                if len(results) >= max_results:
                    break

        elif search_type == "symbol":
            # Symbol search: functions, classes, interfaces, components
            symbol_patterns = [
                rf"\b(class|def|function|interface|type|const|let|var)\s+({re.escape(query)}\w*)\b",
                rf"\bexport\s+(default\s+)?(function|class|const)\s+({re.escape(query)}\w*)\b"
            ]
            compiled = [re.compile(p, re.IGNORECASE) for p in symbol_patterns]
            for dirpath, dirnames, filenames in os.walk(root):
                dirnames[:] = [d for d in dirnames if d not in ignored_dirs]
                for f in filenames:
                    if f.endswith(('.ts', '.tsx', '.js', '.jsx', '.py')):
                        file_path = os.path.join(dirpath, f)
                        rel_path = os.path.relpath(file_path, root)
                        try:
                            with open(file_path, "r", encoding="utf-8", errors="ignore") as file_obj:
                                for line_num, line in enumerate(file_obj, 1):
                                    for pattern in compiled:
                                        if pattern.search(line):
                                            results.append({
                                                "file": rel_path,
                                                "line": line_num,
                                                "symbol": line.strip()[:150]
                                            })
                                            break
                                    if len(results) >= max_results:
                                        break
                        except Exception:
                            continue
                if len(results) >= max_results:
                    break

        elif search_type == "dependency":
            # Search imports / dependencies
            dep_pattern = re.compile(rf"(import|from|require)\s*['\"(].*{re.escape(query)}.*['\")]", re.IGNORECASE)
            for dirpath, dirnames, filenames in os.walk(root):
                dirnames[:] = [d for d in dirnames if d not in ignored_dirs]
                for f in filenames:
                    if f.endswith(('.ts', '.tsx', '.js', '.jsx', '.py', '.json')):
                        file_path = os.path.join(dirpath, f)
                        rel_path = os.path.relpath(file_path, root)
                        try:
                            with open(file_path, "r", encoding="utf-8", errors="ignore") as file_obj:
                                for line_num, line in enumerate(file_obj, 1):
                                    if dep_pattern.search(line):
                                        results.append({
                                            "file": rel_path,
                                            "line": line_num,
                                            "import": line.strip()[:150]
                                        })
                                        if len(results) >= max_results:
                                            break
                        except Exception:
                            continue
                if len(results) >= max_results:
                    break

        return {
            "search_type": search_type,
            "query": query,
            "total_found": len(results),
            "results": results
        }
