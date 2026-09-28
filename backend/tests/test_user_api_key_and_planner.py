import sys
import os
sys.path.insert(0, 'backend')
import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from ai.providers.gemini import GeminiProvider
from ai.core.state import Plan, Task

@pytest.mark.asyncio
async def test_validate_api_key_empty():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/ai/validate-key", json={"api_key": ""})
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is False
        assert "empty" in data["message"].lower()

@pytest.mark.asyncio
async def test_validate_api_key_invalid_format():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/ai/validate-key", json={"api_key": "AIzaSyFakeKeyInvalidTesting123456789"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is False

@pytest.mark.asyncio
async def test_plan_endpoint_generation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "prompt": "Create an AI dashboard for financial analytics with real-time charts and export features",
            "template": "react",
            "project_name": "finance-ai-dashboard"
        }
        resp = await ac.post("/api/ai/plan", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert "plan" in data
        assert "markdown" in data
        assert "tasks" in data
        assert len(data["tasks"]) >= 3
        assert "Execution Graph" in data["markdown"]
        
        # Verify plan tasks structure
        tasks = data["tasks"]
        task_ids = [t["id"] for t in tasks]
        assert len(task_ids) == len(set(task_ids)), "Task IDs must be unique"
        for t in tasks:
            assert "title" in t
            assert "agent" in t
            assert "depends_on" in t

@pytest.mark.asyncio
async def test_gemini_provider_key_override():
    provider = GeminiProvider()
    assert hasattr(provider, "set_api_key")
    assert hasattr(provider, "validate_api_key")

@pytest.mark.asyncio
async def test_list_models_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/ai/models")
        assert resp.status_code == 200
        data = resp.json()
        assert "models" in data
        assert len(data["models"]) >= 6
        model_ids = [m["id"] for m in data["models"]]
        assert "gemini-3.6-flash" in model_ids
        assert "gemini-flash-latest" in model_ids
        assert "gemini-2.0-flash" in model_ids
        assert data["default"] == "gemini-3.6-flash"

@pytest.mark.asyncio
async def test_monitor_verify_step_and_all():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Verify single step
        step_payload = {
            "project_name": "default-project",
            "step_id": "t1",
            "title": "Scaffolding Verification",
            "target_files": ["README.md"]
        }
        resp = await ac.post("/api/ai/monitor/verify-step", json=step_payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert "step" in data
        assert data["step"]["step_id"] == "t1"
        assert len(data["step"]["criteria"]) > 0

        # 2. Verify all tasks
        all_payload = {
            "project_name": "default-project",
            "tasks": [
                {
                    "id": "t1",
                    "title": "Initial Scaffolding",
                    "target_files": ["README.md"],
                    "agent": "architect"
                },
                {
                    "id": "t2",
                    "title": "Missing Component",
                    "target_files": ["src/MissingFile.jsx"],
                    "agent": "coder"
                }
            ]
        }
        resp2 = await ac.post("/api/ai/monitor/verify-all", json=all_payload)
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert data2["ok"] is True
        assert len(data2["step_results"]) == 2
        assert "summary" in data2
        assert data2["summary"]["total_steps"] == 2

