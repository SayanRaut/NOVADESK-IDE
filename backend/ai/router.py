from .registry import model_registry, ModelMetadata
from .intent import IntentResult
from .core.exceptions import ModelNotFoundError

class ModelRouter:
    """
    Routes an intent to the appropriate model based on the Model Registry mappings.
    """
    
    # Map high-level intents to role mappings in the registry
    INTENT_TO_ROLE = {
        "coding": "coding",
        "planning": "planning",
        "review": "review",
        "debug": "debug",
        "vision": "vision",
        "git": "coding",          # Git operations usually involve code understanding
        "search": "search",       
        "documentation": "coding",# Doc writing requires code models
        "chat": "coding",         # Default fast interaction
        "testing": "coding"       # Test writing is coding
    }

    def route(self, intent_result: IntentResult) -> ModelMetadata:
        """
        Takes an intent and determines which model should process it.
        """
        role = self.INTENT_TO_ROLE.get(intent_result.intent, "coding")
        
        try:
            model = model_registry.get_model_for_role(role)
            return model
        except ModelNotFoundError as e:
            # Fallback to the default coding model if mapping fails
            return model_registry.get_model_for_role("coding")

model_router = ModelRouter()
