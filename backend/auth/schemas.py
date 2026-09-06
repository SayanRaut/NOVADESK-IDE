from pydantic import BaseModel, EmailStr
from typing import Optional, Any

class UserCreate(BaseModel):
    email: str
    display_name: str
    password: str
    confirm_password: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class ResendOTPRequest(BaseModel):
    email: str

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

class OTPResponse(BaseModel):
    success: bool = True
    message: str
    email: str
    requires_otp: bool = True
