from pydantic import BaseModel
from typing import Optional, Any

class UserCreate(BaseModel):
    email: str
    display_name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: Optional[Any] = None
    success: bool = True
    error: Optional[str] = None
    message: Optional[str] = None
    details: Optional[str] = None
    data: Optional[Any] = None
