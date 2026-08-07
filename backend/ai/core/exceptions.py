class AICoreException(Exception):
    """Base exception for all AI Core errors."""
    pass

class ModelNotFoundError(AICoreException):
    """Raised when a requested model is not found in the registry."""
    pass

class ModelLoadError(AICoreException):
    """Raised when a model fails to load into memory."""
    pass

class ProviderError(AICoreException):
    """Raised when the AI provider (e.g., Ollama) returns an error."""
    pass

class IntentClassificationError(AICoreException):
    """Raised when intent classification fails."""
    pass

class AgentExecutionError(AICoreException):
    """Raised when an agent fails to execute its task."""
    pass
