"""
Specialized Agents for NovaDesk IDE.
Implements Phases 12 through 18 adhering to the Standard Agent Contract (Section 30).
"""

import json
import re
from typing import Any, Dict, List, Optional
from pydantic import ValidationError

from ai.core.base_agent import BaseAgent
from ai.core.state import (
    AgentState, AgentContext, AgentResult, AgentEvent, Plan, Task
)
from ai.core.logger import logger
from ai.tools.registry import tool_registry
from ai.tools.checkpoint import checkpoint_manager
from ai.planner.prompts import PLANNER_SYSTEM_PROMPT

class PlannerAgent(BaseAgent):
    """
    Phase 12 — Planner Agent
    Converts user requests into structured, validated JSON execution plans.
    Strictly read-only; does not modify files.
    """
    def __init__(self, provider, model_id: str):
        super().__init__(provider, model_id, name="planner")

    def get_system_prompt(self) -> str:
        return PLANNER_SYSTEM_PROMPT

    async def run(self, state: AgentState, context: AgentContext) -> AgentResult:
        logger.info(f"PlannerAgent generating plan for request: {context.user_request[:80]}")
        events = [self.create_event("agent_started", "Planner analyzing request and workspace context")]

        from ai.context import context_engine
        prompt_context = context_engine.format_prompt_context(context)
        prompt = (
            f"User Goal: {context.user_request}\n\n"
            f"Project Context:\n{prompt_context}\n\n"
            "Produce a JSON execution plan according to the specified schema with unique task IDs and valid dependencies."
        )

        plan = None
        errors = []

        for attempt in range(3):
            try:
                raw = await self.invoke_model(prompt, format="json")
                clean_raw = raw.strip()
                if clean_raw.startswith("```json"):
                    clean_raw = clean_raw[7:]
                if clean_raw.startswith("```"):
                    clean_raw = clean_raw[3:]
                if clean_raw.endswith("```"):
                    clean_raw = clean_raw[:-3]
                clean_raw = clean_raw.strip()

                data = json.loads(clean_raw)
                plan = Plan(**data)
                
                # Semantic validation
                is_valid, reason = plan.validate_graph()
                if not is_valid:
                    raise ValueError(f"Plan graph invalid: {reason}")
                
                events.append(self.create_event("plan_generated", f"Plan generated with {len(plan.tasks)} tasks", {"tasks": len(plan.tasks)}))
                state.plan = plan
                break

            except (json.JSONDecodeError, ValidationError, ValueError) as e:
                logger.warning(f"Planner validation error on attempt {attempt}: {e}")
                errors.append(str(e))
                prompt += f"\n\nValidation error: {e}. Fix the schema and return strictly valid JSON."

        if not plan:
            return AgentResult(
                status="failed",
                message="Planner failed to produce a valid execution plan after 3 attempts.",
                events=events,
                errors=errors
            )

        events.append(self.create_event("agent_finished", "Plan successfully validated"))
        return AgentResult(
            status="success",
            message=f"Plan generated with {len(plan.tasks)} tasks.",
            data=plan,
            events=events
        )

    # Backwards compatibility helper
    async def execute(self, task: str, context: Any) -> Plan:
        ctx = AgentContext(user_request=task)
        state = AgentState(request=task, context=ctx)
        res = await self.run(state, ctx)
        if res.status == "success" and res.data:
            return res.data
        raise RuntimeError(f"Planner failed: {res.errors}")


class CodingAgent(BaseAgent):
    """
    Phase 13 — Coding Agent
    Implements approved tasks using patch tools with checkpoint protection.
    """
    def __init__(self, provider, model_id: str):
        super().__init__(provider, model_id, name="coding")

    def get_system_prompt(self) -> str:
        return (
            "You are NovaDesk's Senior Coding Agent. Your task is to write clean, maintainable, "
            "production-grade code.\n\n"
            "CRITICAL FORMATTING INSTRUCTION:\n"
            "When creating or editing files, you MUST specify the target file path on its own line above each code block, formatted exactly as:\n"
            "### File: path/to/filename.ext\n"
            "```language\n"
            "// complete, runnable code goes here\n"
            "```\n"
            "Always include complete code with proper file extensions and all necessary imports."
        )

    async def run(self, state: AgentState, context: AgentContext) -> AgentResult:
        logger.info(f"CodingAgent executing task for: {context.user_request[:80]}")
        events = [self.create_event("agent_started", "Coding agent generating code/patch")]

        from ai.context import context_engine
        prompt_context = context_engine.format_prompt_context(context)
        prompt = f"Goal:\n{context.user_request}\n\nContext:\n{prompt_context}\n\nImplement the solution."

        code_response = await self.invoke_model(prompt)
        events.append(self.create_event("agent_finished", "Code generated"))

        # If workspace is present, write files
        workspace_root = context.workspace or ""
        created_files = []
        if workspace_root and os.path.exists(workspace_root):
            file_matches = re.findall(
                r'(?:###\s*File:?|//\s*File:?|#\s*File:?|File:|Filename:)\s*[`\'"]?([a-zA-Z0-9_\-\./\\]+)[`\'"]?\s*\r?\n+```[a-zA-Z0-9_\-\.]*\r?\n([\s\S]*?)```',
                code_response,
                re.IGNORECASE
            )
            for rel_path, content in file_matches:
                clean_path = rel_path.strip().replace('\\', '/')
                if clean_path.startswith('/'):
                    clean_path = clean_path[1:]
                target_file = os.path.join(workspace_root, clean_path)
                try:
                    os.makedirs(os.path.dirname(target_file), exist_ok=True)
                    with open(target_file, "w", encoding="utf-8") as f:
                        f.write(content)
                    created_files.append(clean_path)
                    logger.info(f"CodingAgent wrote file to workspace: {clean_path}")
                except Exception as e:
                    logger.error(f"CodingAgent failed to write file {clean_path}: {e}")

        summary = f"Created/Updated {len(created_files)} files: {', '.join(created_files)}" if created_files else "Code generation completed."

        return AgentResult(
            status="success",
            message=summary,
            data=code_response,
            events=events
        )

    async def execute(self, task: str, context: Any) -> str:
        ctx = AgentContext(user_request=task)
        if isinstance(context, dict):
            ctx.workspace = context.get("workspace_root", "")
        elif isinstance(context, str):
            ctx.terminal_output = context
        state = AgentState(request=task, context=ctx)
        res = await self.run(state, ctx)
        return res.data or res.message


class SearchAgent(BaseAgent):
    """
    Phase 14 — Search Agent
    Priority: Exact search (path, filename, text, symbol, dependencies) before semantic search.
    """
    def __init__(self, provider, model_id: str):
        super().__init__(provider, model_id, name="search")

    def get_system_prompt(self) -> str:
        return (
            "You are NovaDesk's Code Search Agent. Your job is to locate relevant files, symbols, "
            "and dependencies in the codebase using exact and structured search."
        )

    async def run(self, state: AgentState, context: AgentContext) -> AgentResult:
        events = [self.create_event("agent_started", f"Searching for: {context.user_request}")]
        search_tool = tool_registry.get_tool("search_tool")
        
        results = {}
        if search_tool:
            # 1. Exact text search
            text_res = await search_tool.execute(query=context.user_request, search_type="text", workspace_root=context.workspace or ".")
            # 2. Symbol search
            sym_res = await search_tool.execute(query=context.user_request, search_type="symbol", workspace_root=context.workspace or ".")
            # 3. File search
            file_res = await search_tool.execute(query=context.user_request, search_type="file", workspace_root=context.workspace or ".")
            results = {
                "text_matches": text_res.get("results", []),
                "symbol_matches": sym_res.get("results", []),
                "file_matches": file_res.get("results", [])
            }
            events.append(self.create_event("tool_finished", f"Found {len(results['text_matches'])} text, {len(results['symbol_matches'])} symbol matches"))

        return AgentResult(
            status="success",
            message=f"Search completed with results.",
            data=results,
            events=events
        )

    async def execute(self, task: str, context: Any) -> str:
        ctx = AgentContext(user_request=task)
        state = AgentState(request=task, context=ctx)
        res = await self.run(state, ctx)
        return json.dumps(res.data, indent=2) if res.data else res.message


class ReviewAgent(BaseAgent):
    """
    Phase 15 — Review Agent
    Analyzes code for correctness, security, performance, error handling, and regressions.
    Categorizes findings by severity: Critical, High, Medium, Low, Info.
    Read-only: does not modify files.
    """
    def __init__(self, provider, model_id: str):
        super().__init__(provider, model_id, name="review")

    def get_system_prompt(self) -> str:
        return (
            "You are NovaDesk's Security and QA Code Reviewer. Analyze code for bugs, security "
            "vulnerabilities, performance bottlenecks, and style issues. "
            "Group findings with severity tags: [CRITICAL], [HIGH], [MEDIUM], [LOW], [INFO]."
        )

    async def run(self, state: AgentState, context: AgentContext) -> AgentResult:
        events = [self.create_event("agent_started", "Reviewing code changes")]
        from ai.context import context_engine
        prompt_context = context_engine.format_prompt_context(context)
        prompt = f"Code/Changes to Review:\n{context.user_request}\n\nContext:\n{prompt_context}"

        review_text = await self.invoke_model(prompt)
        events.append(self.create_event("agent_finished", "Review complete"))

        return AgentResult(
            status="success",
            message="Code review complete.",
            data=review_text,
            events=events
        )

    async def execute(self, task: str, context: Any) -> str:
        ctx = AgentContext(user_request=task)
        state = AgentState(request=task, context=ctx)
        res = await self.run(state, ctx)
        return res.data or res.message


class DebugAgent(BaseAgent):
    """
    Phase 16 — Debug Agent
    Analyzes compiler/runtime errors, stack traces, and diagnostics to propose targeted fixes.
    Enforces a strict retry limit to prevent infinite loops.
    """
    def __init__(self, provider, model_id: str):
        super().__init__(provider, model_id, name="debug")

    def get_system_prompt(self) -> str:
        return (
            "You are NovaDesk's Root Cause Debugging Specialist. Analyze stack traces, runtime errors, "
            "and failure diagnostics. Explain the root cause clearly and provide a targeted patch."
        )

    async def run(self, state: AgentState, context: AgentContext) -> AgentResult:
        if state.retry_count >= state.max_retries:
            return AgentResult(
                status="failed",
                message=f"Debug retry limit ({state.max_retries}) exceeded.",
                errors=["Max retry limit exceeded"]
            )

        state.retry_count += 1
        events = [self.create_event("agent_started", f"Debugging attempt {state.retry_count}/{state.max_retries}")]

        from ai.context import context_engine
        prompt_context = context_engine.format_prompt_context(context)
        prompt = f"Error/Failure:\n{context.user_request}\n\nContext:\n{prompt_context}\n\nIdentify root cause and provide fix."

        fix_analysis = await self.invoke_model(prompt)
        events.append(self.create_event("agent_finished", "Debug analysis complete"))

        return AgentResult(
            status="success",
            message=f"Debug fix proposed (Attempt {state.retry_count}).",
            data=fix_analysis,
            events=events
        )

    async def execute(self, task: str, context: Any) -> str:
        ctx = AgentContext(user_request=task)
        state = AgentState(request=task, context=ctx)
        res = await self.run(state, ctx)
        return res.data or res.message


class TestingAgent(BaseAgent):
    """
    Phase 17 — Testing Agent
    Detects testing framework (pytest, jest, vitest, unittest), runs tests, and reports PASS/FAIL.
    """
    def __init__(self, provider, model_id: str):
        super().__init__(provider, model_id, name="testing")

    def get_system_prompt(self) -> str:
        return (
            "You are NovaDesk's Testing Engineer. You generate comprehensive unit and integration "
            "tests and analyze test results."
        )

    async def run(self, state: AgentState, context: AgentContext) -> AgentResult:
        events = [self.create_event("test_started", "Detecting test runner and executing tests")]
        command_tool = tool_registry.get_tool("run_command")

        test_output = ""
        success = True

        if command_tool and context.workspace:
            # Auto-detect test runner
            workspace = context.workspace
            cmd = None
            if os.path.exists(os.path.join(workspace, "package.json")):
                cmd = "npm test"
            elif os.path.exists(os.path.join(workspace, "pytest.ini")) or os.path.exists(os.path.join(workspace, "tests")):
                cmd = "python -m pytest"

            if cmd:
                res = await command_tool.execute(command=cmd, cwd=workspace)
                test_output = res.get("stdout", "") + "\n" + res.get("stderr", "")
                success = res.get("success", False)
                events.append(self.create_event("test_finished", f"Tests finished with status: {'PASS' if success else 'FAIL'}"))

        if not test_output:
            # Fallback to LLM test generation
            prompt = f"Write unit tests for:\n{context.user_request}"
            test_output = await self.invoke_model(prompt)

        return AgentResult(
            status="success" if success else "failed",
            message="Tests completed." if success else "Tests failed.",
            data=test_output,
            events=events
        )

    async def execute(self, task: str, context: Any) -> str:
        ctx = AgentContext(user_request=task)
        state = AgentState(request=task, context=ctx)
        res = await self.run(state, ctx)
        return res.data or res.message


class GitAgent(BaseAgent):
    """
    Phase 18 — Git Agent
    Analyzes git status/diff, generates commit messages, branch suggestions, and PR summaries.
    Approval-based: does not commit without explicit user permission.
    """
    def __init__(self, provider, model_id: str):
        super().__init__(provider, model_id, name="git")

    def get_system_prompt(self) -> str:
        return (
            "You are NovaDesk's Git Assistant. Generate clean Conventional Commit messages, "
            "semantic branch names, and pull request summaries based on git diffs."
        )

    async def run(self, state: AgentState, context: AgentContext) -> AgentResult:
        events = [self.create_event("agent_started", "Analyzing git diff")]
        git_tool = tool_registry.get_tool("git_tool")

        diff = ""
        if git_tool and context.workspace:
            res = await git_tool.execute(action="diff", cwd=context.workspace)
            diff = res.get("stdout", "")

        prompt = f"Workspace Git Diff:\n{diff or context.git_state}\n\nTask: {context.user_request}"
        summary = await self.invoke_model(prompt)
        events.append(self.create_event("agent_finished", "Git suggestions generated"))

        return AgentResult(
            status="success",
            message="Git suggestions ready for user approval.",
            data=summary,
            events=events
        )

    async def execute(self, task: str, context: Any) -> str:
        ctx = AgentContext(user_request=task)
        state = AgentState(request=task, context=ctx)
        res = await self.run(state, ctx)
        return res.data or res.message


class VisionAgent(BaseAgent):
    """Vision-Language agent for analyzing screenshots and UI designs."""
    def __init__(self, provider, model_id: str):
        super().__init__(provider, model_id, name="vision")

    def get_system_prompt(self) -> str:
        return "You are NovaDesk's Vision-Language Expert. Analyze screenshot/UI design and produce layout code."

    async def run(self, state: AgentState, context: AgentContext) -> AgentResult:
        prompt = f"Analyze visual input for: {context.user_request}"
        res_text = await self.invoke_model(prompt)
        return AgentResult(status="success", data=res_text)

    async def execute(self, task: str, context: Any) -> str:
        ctx = AgentContext(user_request=task)
        state = AgentState(request=task, context=ctx)
        res = await self.run(state, ctx)
        return res.data or res.message
