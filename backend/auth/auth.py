from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import os

# Stub for Google OAuth2 integration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class User(BaseModel):
    id: str
    email: str
    name: str
    plan: str = "free"

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Validates the Google OAuth token and retrieves the user profile.
    In a real implementation, this would use google.oauth2.id_token.verify_oauth2_token.
    """
    if not token or token == "invalid":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Mock user for development
    return User(
        id="mock_user_123",
        email="dev@example.com",
        name="Developer",
        plan="free"
    )
