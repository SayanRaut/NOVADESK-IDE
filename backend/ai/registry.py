from dataclasses import dataclass
from typing import Dict, List, Optional
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
        # 1. Gemini 2.5 Flash (Default Unified Fast Agent & Coding Model)
        self.register_model(
            ModelMetadata(
                id="gemini-2.5-flash",
                name="Gemini 2.5 Flash",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        # 2. Gemini 2.5 Pro (Deep Architectural Reasoning & Complex Code)
        self.register_model(
            ModelMetadata(
                id="gemini-2.5-pro",
                name="Gemini 2.5 Pro",
                provider="gemini",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=1048576
                )
            )
        )

        # 3. Gemini 2.0 Flash (High Throughput)
        self.register_model(
            ModelMetadata(
                id="gemini-2.0-flash",
                name="Gemini 2.0 Flash",
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
        """Returns the primary unified model: Gemini 2.5 Flash."""
        return self._models["gemini-2.5-flash"]
        
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
