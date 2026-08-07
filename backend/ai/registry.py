from dataclasses import dataclass
from typing import Dict, List, Optional
from .core.exceptions import ModelNotFoundError

@dataclass
class ModelCapabilities:
    vision_support: bool = False
    reasoning_support: bool = False
    streaming_support: bool = True
    context_length: int = 8192

@dataclass
class ModelMetadata:
    id: str
    name: str
    provider: str
    capabilities: ModelCapabilities

class ModelRegistry:
    """
    Central registry for all AI models.
    Never hardcode model names outside of this registry.
    """
    
    def __init__(self):
        self._models: Dict[str, ModelMetadata] = {}
        self._role_mappings: Dict[str, str] = {}
        self._initialize_default_models()

    def _initialize_default_models(self):
        # Qwen 2.5 Coder 7B
        self.register_model(
            ModelMetadata(
                id="qwen2.5-coder:7b",
                name="Qwen 2.5 Coder (7B)",
                provider="ollama",
                capabilities=ModelCapabilities(
                    vision_support=False,
                    reasoning_support=False,
                    streaming_support=True,
                    context_length=32768
                )
            )
        )
        
        # DeepSeek R1 8B
        self.register_model(
            ModelMetadata(
                id="deepseek-r1:8b",
                name="DeepSeek R1 (8B)",
                provider="ollama",
                capabilities=ModelCapabilities(
                    vision_support=False,
                    reasoning_support=True,
                    streaming_support=True,
                    context_length=131072
                )
            )
        )
        
        # Qwen 2.5 VL 7B
        self.register_model(
            ModelMetadata(
                id="qwen2.5vl:7b",
                name="Qwen 2.5 VL (7B)",
                provider="ollama",
                capabilities=ModelCapabilities(
                    vision_support=True,
                    reasoning_support=False,
                    streaming_support=True,
                    context_length=32768
                )
            )
        )

        # Register mappings based on requirements
        self.set_role_model("coding", "qwen2.5-coder:7b")
        self.set_role_model("review", "qwen2.5-coder:7b")
        self.set_role_model("debug", "qwen2.5-coder:7b")
        self.set_role_model("search", "qwen2.5-coder:7b")
        
        self.set_role_model("planning", "deepseek-r1:8b")
        self.set_role_model("vision", "qwen2.5vl:7b")

    def register_model(self, metadata: ModelMetadata):
        """Register a new model."""
        self._models[metadata.id] = metadata

    def set_role_model(self, role: str, model_id: str):
        """Map a specific role (e.g., 'coding') to a model_id."""
        if model_id not in self._models:
            raise ModelNotFoundError(f"Cannot map role '{role}' to unknown model '{model_id}'")
        self._role_mappings[role] = model_id

    def get_model_for_role(self, role: str) -> ModelMetadata:
        """Get the model mapped to a specific role."""
        model_id = self._role_mappings.get(role)
        if not model_id:
            raise ModelNotFoundError(f"No model mapped for role: {role}")
        return self._models[model_id]
        
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
