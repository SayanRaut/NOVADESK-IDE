import pytest
from unittest.mock import AsyncMock, patch

from backend.ai.manager import ModelManager
from backend.ai.core.provider import ProviderInterface

class MockProvider(ProviderInterface):
    async def generate(self, messages, model_id, **kwargs):
        return "mocked response"
        
    async def stream(self, messages, model_id, **kwargs):
        yield "mocked stream"
        
    async def health_check(self):
        return True
        
    async def unload_model(self, model_id):
        return True

@pytest.mark.asyncio
async def test_model_switching():
    provider = MockProvider()
    provider.unload_model = AsyncMock(return_value=True)
    manager = ModelManager(provider=provider)
    
    messages = [{"role": "user", "content": "hello"}]
    
    # 1. Load first model
    await manager.generate(messages, "qwen2.5-coder:7b")
    assert manager.get_current_model() == "qwen2.5-coder:7b"
    assert provider.unload_model.call_count == 0
    
    # 2. Switch to second model
    await manager.generate(messages, "deepseek-r1:8b")
    assert manager.get_current_model() == "deepseek-r1:8b"
    assert provider.unload_model.call_count == 1
    provider.unload_model.assert_called_with("qwen2.5-coder:7b")

@pytest.mark.asyncio
async def test_response_caching():
    provider = MockProvider()
    provider.generate = AsyncMock(return_value="fresh response")
    manager = ModelManager(provider=provider)
    
    messages = [{"role": "user", "content": "cache test"}]
    
    # First call - should call provider
    resp1 = await manager.generate(messages, "qwen2.5-coder:7b")
    assert resp1 == "fresh response"
    assert provider.generate.call_count == 1
    
    # Second call - should hit cache
    resp2 = await manager.generate(messages, "qwen2.5-coder:7b")
    assert resp2 == "fresh response"
    assert provider.generate.call_count == 1
