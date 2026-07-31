import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from database.database import get_db
from database.models import User
from auth.dependencies import get_current_user
from auth.schemas import UserCreate, UserLogin, AuthResponse, RefreshTokenRequest, LogoutRequest
from auth.exceptions import AuthError, UserCreationError
from auth.services.jwt_service import create_access_token
from auth.services.session_service import SessionService
from auth.services.user_service import get_user_by_id, format_user_payload, create_user, authenticate_user
from auth.services.oauth_service import GoogleOAuthService
from auth.exceptions import OAuthExchangeError, InvalidStateError, GoogleTokenError
from fastapi.responses import RedirectResponse, HTMLResponse
import uuid
from config.settings import settings
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Auth"])

_auth_states = {}

def _handle_auth_error(exc: AuthError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": str(exc)
        }
    )

@router.post("/register")
async def register(req: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        user = await create_user(db, req)
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = await SessionService.create_refresh_token(db, user.id)
        
        return {
            "access_token": access_token, 
            "refresh_token": refresh_token,
            "token_type": "bearer", 
            "user": format_user_payload(user)
        }
    except AuthError as exc:
        return _handle_auth_error(exc)
    except Exception as exc:
        logger.error(f"Unexpected error in register: {repr(exc)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {repr(exc)}")

@router.post("/login")
async def login(req: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = await SessionService.create_refresh_token(db, user.id)
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer", 
        "user": format_user_payload(user)
    }

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    prefs = current_user.preferences or {}
    if isinstance(prefs, str):
        try:
            import json
            prefs = json.loads(prefs)
        except Exception:
            prefs = {}
            
    return {
        "id": current_user.id,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "avatar": current_user.avatar,
        "preferences": {
            "theme": current_user.selected_theme,
            "model": prefs.get("model", "default") if isinstance(prefs, dict) else "default"
        }
    }

@router.post("/refresh")
async def refresh_access_token(req: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    token_obj = await SessionService.validate_refresh_token(db, req.refresh_token)
    if not token_obj:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token.")
    
    user = await get_user_by_id(db, token_obj.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
        
    await SessionService.revoke_refresh_token(db, req.refresh_token)
    
    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = await SessionService.create_refresh_token(db, user.id)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": format_user_payload(user)
    }

@router.post("/logout")
async def logout_user(req: LogoutRequest, db: AsyncSession = Depends(get_db)):
    await SessionService.revoke_refresh_token(db, req.refresh_token)
    return {"success": True, "message": "Logged out successfully"}

@router.get("/google/start")
async def google_login_start(state: str):
    url = GoogleOAuthService.generate_login_url(state)
    return RedirectResponse(url)

@router.get("/google/callback")
async def google_login_callback(code: str, state: str, db: AsyncSession = Depends(get_db)):
    try:
        token_data = await GoogleOAuthService.exchange_code(code)
        
        id_token = token_data.get("id_token")
        if not id_token:
            raise GoogleTokenError("No id_token found in response")
        
        decoded = GoogleOAuthService.verify_id_token(id_token)
        email = decoded.get("email")
        name = decoded.get("name", "Google User")
        google_id = decoded.get("sub")
        
        if not email:
            raise GoogleTokenError("Email not provided by Google")
            
        # Check if user exists
        from sqlalchemy.future import select
        from database.models import User
        
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            # Create a new user with Google Auth
            import uuid
            new_password = str(uuid.uuid4())
            req = UserCreate(email=email, password=new_password, display_name=name)
            user = await create_user(db, req)
            # Link google_id if needed, but schema uses hashed_password. 
            
        # Generate our own tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = await SessionService.create_refresh_token(db, user.id)
        
        _auth_states[state] = {
            "access_token": access_token,
            "refresh_token": refresh_token
        }
        return HTMLResponse(
            "<html><body style='font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#0d0d0d;color:#fff;'>"
            "<div style='text-align:center;'><h1>Login successful!</h1><p>You can close this window and return to NovaDesk.</p></div>"
            "<script>window.close();</script></body></html>"
        )
        
    except Exception as e:
        logger.error(f"Google auth callback error: {e}", exc_info=True)
        import urllib.parse
        error_msg = str(e) or "Unknown authentication error"
        _auth_states[state] = {"error": error_msg}
        return HTMLResponse(
            f"<html><body style='font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#0d0d0d;color:#fff;'>"
            f"<div style='text-align:center;'><h1>Login failed</h1><p>{error_msg}</p><p>You can close this window.</p></div>"
            "<script>window.close();</script></body></html>"
        )

@router.get("/google/status")
async def google_login_status(state: str):
    if state in _auth_states:
        result = _auth_states.pop(state)
        return result
    return {"pending": True}
