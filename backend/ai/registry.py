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
        # 1. Gemini 3.6 Flash (Primary Unified High-Speed Multimodal & Coding Model)
        self.register_model(
            ModelMetadata(
                id="gemini-3.6-flash",
                name="Gemini 3.6 Flash (Recommended)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        # 2. Gemini Flash Latest
        self.register_model(
            ModelMetadata(
                id="gemini-flash-latest",
                name="Gemini Flash (Latest)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        # 3. Gemini 3.7 Flash (Next-Gen Hybrid Reasoning)
        self.register_model(
            ModelMetadata(
                id="gemini-3.7-flash",
                name="Gemini 3.7 Flash (Hybrid Reasoning)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        # 4. Gemini 3.8 Flash (High Throughput)
        self.register_model(
            ModelMetadata(
                id="gemini-3.8-flash",
                name="Gemini 3.8 Flash (High Throughput)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        # 5. Gemini 3.5 Flash (Production Standard)
        self.register_model(
            ModelMetadata(
                id="gemini-3.5-flash",
                name="Gemini 3.5 Flash (Production Standard)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        # 6. Gemini Pro Latest (Flagship Reasoning)
        self.register_model(
            ModelMetadata(
                id="gemini-pro-latest",
                name="Gemini Pro (Latest Flagship)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=2097152
                )
            )
        )

        # 7. Gemini 3.1 Pro Preview (Deep Architecture & Reasoning)
        self.register_model(
            ModelMetadata(
                id="gemini-3.1-pro-preview",
                name="Gemini 3.1 Pro Preview (Deep Reasoning)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=2097152
                )
            )
        )

        # 8. Gemini 3.1 Flash Lite (Ultra Fast)
        self.register_model(
            ModelMetadata(
                id="gemini-3.1-flash-lite",
                name="Gemini 3.1 Flash Lite (Ultra Fast)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        # 9. Gemini 2.5 Pro (Preview)
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

        # Legacy aliases for backwards compatibility
        self.register_model(
            ModelMetadata(
                id="gemini-2.0-flash",
                name="Gemini 2.0 Flash (Legacy)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        self.register_model(
            ModelMetadata(
                id="gemini-1.5-flash",
                name="Gemini 1.5 Flash (Legacy)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        self.register_model(
            ModelMetadata(
                id="gemini-1.5-pro",
                name="Gemini 1.5 Pro (Legacy)",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=2097152
                )
            )
        )

    def register_model(self, metadata: ModelMetadata):
        """Register a new model."""
        self._models[metadata.id] = metadata

    def get_unified_model(self) -> ModelMetadata:
        """Returns the primary unified model: Gemini 3.6 Flash."""
        return self._models["gemini-3.6-flash"]

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
        if clean_id in (
            "qwen3.5:4b", "default", "novadesk",
            "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash",
            "gemini-1.5-pro", "gemini-2.0-flash-lite", "gemini-1.5-flash-8b",
            "gemini-2.0-pro-exp-02-05"
        ):
            clean_id = "gemini-3.6-flash"

        if clean_id not in self._models:
            # Fallback to default unified model
            return self.get_unified_model()
        return self._models[clean_id]

    def get_all_models(self) -> List[ModelMetadata]:
        """List all registered Gemini models."""
        return list(self._models.values())

# Singleton instance
model_registry = ModelRegistry()
