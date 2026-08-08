from dataclasses import dataclass
from typing import Dict, List, Optional
from .core.exceptions import ModelNotFoundError

@dataclass
class ModelCapabilities:
    vision_support: bool = True
    reasoning_support: bool = True
    streaming_support: bool = True
    context_length: int = 32768

@dataclass
class ModelMetadata:
    id: str
    name: str
    provider: str
    capabilities: ModelCapabilities

class ModelRegistry:
    """
    Central registry for all AI models.
    In V2, we strictly use a single Unified Model to prevent VRAM swapping on low-end hardware.
    """
    
    def __init__(self):
        self._models: Dict[str, ModelMetadata] = {}
        self._initialize_default_models()

    def _initialize_default_models(self):
        # The Single Unified Model (qwen3.5:9b)
        self.register_model(
            ModelMetadata(
                id="qwen3.5:9b",
                name="Qwen3.5 (9B)",
                provider="ollama",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=32768
                )
            )
        )

    def register_model(self, metadata: ModelMetadata):
        """Register a new model."""
        self._models[metadata.id] = metadata

    def get_unified_model(self) -> ModelMetadata:
        """Returns the single unified model for the V2 Architecture."""
        return self._models["qwen3.5:9b"]
        
    def get_model(self, model_id: str) -> ModelMetadata:
        """Get model metadata by ID."""
        if model_id not in self._models:
            raise ModelNotFoundError(f"Model not found: {model_id}")
        return self._models[model_id]

    def get_all_models(self) -> List[ModelMetadata]:
        """List all registered models."""
        return list(self._models.values())

# Singleton instance
model_registry = ModelRegistry()
