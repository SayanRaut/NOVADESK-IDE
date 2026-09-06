from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from .core.exceptions import ModelNotFoundError

@dataclass
class ModelCapabilities:
    vision_support: bool = True
    reasoning_support: bool = True
    streaming_support: bool = True
    context_length: int = 1048576

@dataclass
class ModelMetadata:
    id: str
    name: str
    provider: str
    capabilities: ModelCapabilities

class ModelRegistry:
    """
    Central registry for Google Gemini AI models.
    NovaDesk now uses Google Gemini models for real-time full-stack coding,
    reasoning, and Next.js project generation with zero local VRAM overhead.
    """
    
    def __init__(self):
        self._models: Dict[str, ModelMetadata] = {}
        self._initialize_default_models()

    def _initialize_default_models(self):
        # 1. Gemini 2.0 Flash (Primary Unified High-Speed Multimodal & Coding Model)
        self.register_model(
            ModelMetadata(
                id="gemini-2.0-flash",
                name="Gemini 2.0 Flash (Recommended)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        # 2. Gemini 1.5 Flash (Production Standard High Quota)
        self.register_model(
            ModelMetadata(
                id="gemini-1.5-flash",
                name="Gemini 1.5 Flash (Stable Standard)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        # 3. Gemini 1.5 Pro (Flagship 2M Context Window Reasoning)
        self.register_model(
            ModelMetadata(
                id="gemini-1.5-pro",
                name="Gemini 1.5 Pro (Deep Architecture & Reasoning)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=2097152
                )
            )
        )

        # 4. Gemini 2.0 Flash Lite (Ultra Low Latency)
        self.register_model(
            ModelMetadata(
                id="gemini-2.0-flash-lite",
                name="Gemini 2.0 Flash Lite (Lightweight)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        # 5. Gemini 2.0 Pro Experimental
        self.register_model(
            ModelMetadata(
                id="gemini-2.0-pro-exp-02-05",
                name="Gemini 2.0 Pro (Experimental Reasoning)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=2097152
                )
            )
        )

        # 6. Gemini 1.5 Flash-8B
        self.register_model(
            ModelMetadata(
                id="gemini-1.5-flash-8b",
                name="Gemini 1.5 Flash-8B (High Throughput)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        # 7. Gemini 2.5 Flash (Preview)
        self.register_model(
            ModelMetadata(
                id="gemini-2.5-flash",
                name="Gemini 2.5 Flash (Preview)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        # 8. Gemini 2.5 Pro (Preview)
        self.register_model(
            ModelMetadata(
                id="gemini-2.5-pro",
                name="Gemini 2.5 Pro (Preview)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

    def register_model(self, metadata: ModelMetadata):
        """Register a new model."""
        self._models[metadata.id] = metadata

    def get_unified_model(self) -> ModelMetadata:
        """Returns the primary unified model: Gemini 2.0 Flash."""
        return self._models["gemini-2.0-flash"]

    def list_all_models(self) -> List[Dict[str, Any]]:
        """List all registered models formatted for API serialization."""
        return [
            {
                "id": m.id,
                "name": m.name,
                "provider": m.provider,
                "context_length": m.capabilities.context_length,
                "streaming_support": m.capabilities.streaming_support,
                "reasoning_support": m.capabilities.reasoning_support,
            }
            for m in self._models.values()
        ]
        
    def get_model(self, model_id: str) -> ModelMetadata:
        """Get model metadata by ID, aliasing legacy or variant names."""
        clean_id = model_id.replace("models/", "").strip()
        if clean_id in ("qwen3.5:4b", "default", "novadesk"):
            clean_id = "gemini-2.5-flash"

        if clean_id not in self._models:
            # Fallback to default unified model
            return self.get_unified_model()
        return self._models[clean_id]

    def get_all_models(self) -> List[ModelMetadata]:
        """List all registered Gemini models."""
        return list(self._models.values())

# Singleton instance
model_registry = ModelRegistry()
