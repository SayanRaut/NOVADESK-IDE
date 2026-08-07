import uuid

def generate_request_id() -> str:
    """Generate a unique request ID."""
    return str(uuid.uuid4())

def sanitize_messages(messages: list) -> list:
    """Ensure messages are in the correct format before sending to providers."""
    sanitized = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        sanitized.append({"role": role, "content": content})
    return sanitized
