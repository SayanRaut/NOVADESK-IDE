"""
AI Project Planner Endpoint & Key Validation for NovaDesk IDE.
Handles autonomous planning DAG generation, key verification, and plan blueprint formatting.
"""

import os
import json
import re
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ai.providers.gemini import GeminiProvider
from ai.manager import model_manager
from ai.registry import model_registry
from ai.core.state import Plan, Task
from ai.core.logger import logger

router = APIRouter(prefix="/ai", tags=["AI Planner"])

class ValidateKeyRequest(BaseModel):
    api_key: str

class PlanProjectRequest(BaseModel):
    prompt: str
    template: Optional[str] = "react"
    api_key: Optional[str] = None
    project_name: Optional[str] = None

def generate_heuristic_plan(prompt: str, template: str, project_name: str) -> Dict[str, Any]:
    """Generates an intelligent structured plan tailored to prompt & template if LLM is offline or no key."""
    clean_name = project_name or "NovaDesk Project"
    clean_title = clean_name.replace("-", " ").title()

    if template == "nextjs" or template == "next":
        stack = ["Next.js 15 (App Router)", "React 19", "TypeScript", "Tailwind CSS", "Lucide React"]
        tasks = [
            {
                "id": "t1",
                "title": "Project Scaffolding & Configuration",
                "description": "Initialize Next.js 15 App Router structure with TypeScript, Tailwind CSS configuration, and root layout.",
                "agent": "architect",
                "depends_on": [],
                "target_files": ["package.json", "tsconfig.json", "tailwind.config.js", "app/layout.tsx"],
                "estimated_complexity": "Low"
            },
            {
                "id": "t2",
                "title": "Core Design System & UI Components",
                "description": "Build modern responsive components with dark mode support, glassmorphism headers, and interactive controls.",
                "agent": "coder",
                "depends_on": ["t1"],
                "target_files": ["app/globals.css", "components/Header.tsx", "components/Navigation.tsx"],
                "estimated_complexity": "Medium"
            },
            {
                "id": "t3",
                "title": "Main Application View & Features",
                "description": f"Implement core application logic tailored to '{prompt}', including interactive state, responsive hero and data grids.",
                "agent": "coder",
                "depends_on": ["t2"],
                "target_files": ["app/page.tsx", "components/Dashboard.tsx", "components/FeatureGrid.tsx"],
                "estimated_complexity": "High"
            },
            {
                "id": "t4",
                "title": "Server-Side API Route Handlers",
                "description": "Develop REST/JSON API route handlers with input validation and real-time response capabilities.",
                "agent": "coder",
                "depends_on": ["t1"],
                "target_files": ["app/api/data/route.ts", "app/api/health/route.ts"],
                "estimated_complexity": "Medium"
            },
            {
                "id": "t5",
                "title": "Quality Assurance & Static Validation",
                "description": "Perform type checking, linting, accessibility evaluation, and edge-case regression tests.",
                "agent": "review",
                "depends_on": ["t3", "t4"],
                "target_files": ["README.md", "tests/smoke.test.ts"],
                "estimated_complexity": "Low"
            }
        ]
    elif template == "python":
        stack = ["Python 3.11+", "FastAPI", "Uvicorn", "Pydantic v2", "Pytest"]
        tasks = [
            {
                "id": "t1",
                "title": "API Service Structure & Dependencies",
                "description": "Set up FastAPI application entry point, CORS middleware, and environment configurations.",
                "agent": "architect",
                "depends_on": [],
                "target_files": ["main.py", "requirements.txt", ".env.example"],
                "estimated_complexity": "Low"
            },
            {
                "id": "t2",
                "title": "Data Schemas & Domain Models",
                "description": f"Define Pydantic v2 schemas and business entities reflecting requirements for '{prompt}'.",
                "agent": "coder",
                "depends_on": ["t1"],
                "target_files": ["schemas.py", "models.py"],
                "estimated_complexity": "Medium"
            },
            {
                "id": "t3",
                "title": "CRUD & Business Logic Endpoints",
                "description": "Implement core REST API routers, query parameters, error handlers, and business logic.",
                "agent": "coder",
                "depends_on": ["t2"],
                "target_files": ["routes/api.py", "services/engine.py"],
                "estimated_complexity": "High"
            },
            {
                "id": "t4",
                "title": "Automated Unit & Integration Tests",
                "description": "Write pytest test cases checking endpoint status codes, edge payloads, and schema validation.",
                "agent": "testing",
                "depends_on": ["t3"],
                "target_files": ["tests/test_api.py", "pytest.ini"],
                "estimated_complexity": "Medium"
            }
        ]
    else:
        # React Vite default
        stack = ["React 18", "Vite 5", "Tailwind CSS", "Lucide React", "ESLint"]
        tasks = [
            {
                "id": "t1",
                "title": "Vite & React Architecture Setup",
                "description": "Initialize modern Vite React build pipeline with Tailwind CSS and Inter typography.",
                "agent": "architect",
                "depends_on": [],
                "target_files": ["package.json", "vite.config.js", "index.html", "src/index.css"],
                "estimated_complexity": "Low"
            },
            {
                "id": "t2",
                "title": "Navigation & Core Layout Structure",
                "description": "Build sticky glassmorphism header, responsive sidebar navigation, and footer components.",
                "agent": "coder",
                "depends_on": ["t1"],
                "target_files": ["src/components/Header.jsx", "src/components/Sidebar.jsx"],
                "estimated_complexity": "Medium"
            },
            {
                "id": "t3",
                "title": "Interactive Domain Features & State",
                "description": f"Develop main user view satisfying: '{prompt}'. Create dynamic state hooks and interactive controls.",
                "agent": "coder",
                "depends_on": ["t2"],
                "target_files": ["src/App.jsx", "src/components/Dashboard.jsx", "src/components/ItemList.jsx"],
                "estimated_complexity": "High"
            },
            {
                "id": "t4",
                "title": "Analytics Visualization & Real-Time Stats",
                "description": "Incorporate responsive metric cards, activity feeds, and data charts.",
                "agent": "coder",
                "depends_on": ["t2"],
                "target_files": ["src/components/AnalyticsChart.jsx"],
                "estimated_complexity": "Medium"
            },
            {
                "id": "t5",
                "title": "Design Polish & Code Review",
                "description": "Review color contrast, animations, responsive breakpoints, and build stability.",
                "agent": "review",
                "depends_on": ["t3", "t4"],
                "target_files": ["README.md"],
                "estimated_complexity": "Low"
            }
        ]

    return {
        "goal": f"Build {clean_title} ({template.upper()})",
        "summary": f"End-to-end full-stack implementation plan for '{clean_title}'. Structured across {len(tasks)} distinct tasks decomposing architecture, components, API integration, and validation.",
        "architecture": {
            "stack": stack,
            "patterns": ["Component-Driven UI", "Modular Service Pattern", "Type-Safe State"],
            "key_features": [
                f"Interactive {clean_title} dashboard",
                "Real-time state and responsive layout",
                "Optimized build configuration and asset pipeline"
            ]
        },
        "tasks": tasks
    }

def format_plan_markdown(plan_dict: Dict[str, Any], project_name: str, prompt: str) -> str:
    """Renders a beautiful, presentation-grade markdown document for the plan."""
    goal = plan_dict.get("goal", project_name)
    summary = plan_dict.get("summary", "")
    arch = plan_dict.get("architecture", {})
    stack = arch.get("stack", [])
    features = arch.get("key_features", [])
    tasks = plan_dict.get("tasks", [])

    lines = []
    lines.append(f"# 🚀 Project Blueprint: {project_name.title()}\n")
    lines.append(f"**Goal**: {goal}\n")
    lines.append(f"> **Prompt**: *\"{prompt}\"*\n")
    
    if summary:
        lines.append(f"## 📋 Executive Summary\n{summary}\n")

    if stack:
        lines.append("## 🛠️ Technology Stack & Architecture")
        lines.append(" | ".join([f"`{s}`" for s in stack]))
        lines.append("")

    if features:
        lines.append("### Key Planned Features")
        for f in features:
            lines.append(f"- ✅ {f}")
        lines.append("")

    lines.append("## 🗺️ Execution Graph (DAG Tasks)\n")
    lines.append("| ID | Task Title | Agent Specialist | Depends On | Complexity | Target Files |")
    lines.append("|---|---|---|---|---|---|")

    for t in tasks:
        t_id = t.get("id", "")
        title = t.get("title", "")
        agent = t.get("agent", "coder").title()
        deps = ", ".join(t.get("depends_on", [])) or "None (Root)"
        complexity = t.get("estimated_complexity", "Medium")
        files = ", ".join([f"`{f}`" for f in t.get("target_files", [])]) or "N/A"
        lines.append(f"| **{t_id}** | {title} | `{agent}` | {deps} | {complexity} | {files} |")

    lines.append("\n## 📝 Step-by-Step Task Breakdown\n")
    for t in tasks:
        t_id = t.get("id", "")
        title = t.get("title", "")
        agent = t.get("agent", "coder").title()
        desc = t.get("description", "")
        deps = t.get("depends_on", [])
        files = t.get("target_files", [])

        lines.append(f"### `{t_id}`: {title}")
        lines.append(f"- **Assigned Specialist**: 🤖 **{agent} Agent**")
        if deps:
            lines.append(f"- **Prerequisites**: {', '.join([f'`{d}`' for d in deps])}")
        else:
            lines.append(f"- **Prerequisites**: None (Can start immediately)")
        lines.append(f"- **Description**: {desc}")
        if files:
            lines.append(f"- **Target Artifacts**: {', '.join([f'`{f}`' for f in files])}")
        lines.append("")

    lines.append("---\n*Generated by NovaDesk AI Project Planner Agent &bull; Powered by Google Gemini*")
    return "\n".join(lines)

@router.post("/validate-key")
async def validate_api_key(req: ValidateKeyRequest):
    """Verifies that a user-supplied Gemini API key works with Google Gemini."""
    if not req.api_key or not req.api_key.strip():
        return {"valid": False, "message": "API key cannot be empty."}
    
    valid, message = await GeminiProvider.validate_api_key(req.api_key.strip())
    return {
        "valid": valid,
        "message": message
    }

@router.post("/plan")
async def plan_project(req: PlanProjectRequest):
    """
    Autonomous Project Planner Agent.
    Analyzes prompt and template, decomposes into DAG tasks with specialist agent assignments,
    and returns verified JSON plan + presentation markdown.
    """
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Project prompt is required.")

    project_name = req.project_name or req.prompt.split(" ")[0].lower() + "-app"
    project_name = re.sub(r'[^a-zA-Z0-9_\-]', '', project_name.replace(" ", "-")).lower()
    if not project_name:
        project_name = "novadesk-project"

    plan_data = None
    target_model = model_registry.get_unified_model()

    # User-supplied API key takes precedence
    active_key = req.api_key or os.environ.get("GEMINI_API_KEY", "")

    if active_key and active_key.strip():
        system_instruction = (
            "You are NovaDesk's Principal AI Software Architect and Project Planner. "
            "Your job is to analyze the user's project request and break it down into an ordered, "
            "dependency-valid directed acyclic graph (DAG) of tasks.\n\n"
            "Each task must be assigned to an appropriate specialist agent:\n"
            "- 'architect' (Scaffolding, layout, tech config)\n"
            "- 'coder' (Component implementation, business logic, endpoints)\n"
            "- 'testing' (Unit tests, integration tests)\n"
            "- 'review' (Security, styling, edge case review)\n\n"
            "CRITICAL: Return ONLY a valid JSON object without markdown code fences or conversational text. "
            "Match this exact schema:\n"
            "{\n"
            '  "goal": "<One-line project goal>",\n'
            '  "summary": "<2-3 sentence executive architectural overview>",\n'
            '  "architecture": {\n'
            '    "stack": ["Technology 1", "Technology 2"],\n'
            '    "patterns": ["Design pattern 1"],\n'
            '    "key_features": ["Feature 1", "Feature 2"]\n'
            "  },\n"
            '  "tasks": [\n'
            "    {\n"
            '      "id": "t1",\n'
            '      "title": "<Short task title>",\n'
            '      "description": "<Detailed concrete instructions>",\n'
            '      "agent": "architect",\n'
            '      "depends_on": [],\n'
            '      "target_files": ["package.json", "index.html"],\n'
            '      "estimated_complexity": "Low"\n'
            "    }\n"
            "  ]\n"
            "}\n"
            "Rules:\n"
            "- Task IDs must be unique strings (t1, t2, t3, etc.).\n"
            "- 'depends_on' must only reference valid previous task IDs. Never create cycles.\n"
            "- Ensure the task set fully covers the project from setup to completion.\n"
        )

        user_content = (
            f"Project Name: {project_name}\n"
            f"Target Template/Stack: {req.template}\n"
            f"User Prompt: {req.prompt}\n\n"
            f"Generate the comprehensive project execution plan."
        )

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_content}
        ]

        try:
            raw_response = await model_manager.generate(
                messages,
                target_model.id,
                api_key=active_key.strip(),
                format="json",
                temperature=0.2
            )
            
            clean_raw = raw_response.strip()
            if clean_raw.startswith("```json"):
                clean_raw = clean_raw[7:]
            if clean_raw.startswith("```"):
                clean_raw = clean_raw[3:]
            if clean_raw.endswith("```"):
                clean_raw = clean_raw[:-3]
            clean_raw = clean_raw.strip()

            parsed = json.loads(clean_raw)
            if "tasks" in parsed and isinstance(parsed["tasks"], list) and len(parsed["tasks"]) > 0:
                # Validate graph semantics
                p_obj = Plan(
                    goal=parsed.get("goal", project_name),
                    summary=parsed.get("summary", ""),
                    tasks=[Task(**t) for t in parsed["tasks"]]
                )
                valid, reason = p_obj.validate_graph()
                if valid:
                    plan_data = parsed
                    logger.info(f"AI Planner successfully generated plan with {len(p_obj.tasks)} tasks.")
                else:
                    logger.warning(f"AI Planner graph invalid ({reason}), repairing fallback.")
        except Exception as e:
            logger.warning(f"AI Planner model execution fallback: {e}")

    # Fallback to intelligent template plan if model generation failed or no key
    if not plan_data:
        plan_data = generate_heuristic_plan(req.prompt, req.template or "react", project_name)

    # Format presentation markdown
    presentation_markdown = format_plan_markdown(plan_data, project_name, req.prompt)

    return {
        "ok": True,
        "project_name": project_name,
        "template": req.template,
        "plan": plan_data,
        "markdown": presentation_markdown,
        "tasks": plan_data.get("tasks", []),
        "architecture": plan_data.get("architecture", {})
    }
