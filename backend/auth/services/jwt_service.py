import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt

from config.settings import settings
from auth.exceptions import JWTCreationError, AuthError

logger = logging.getLogger(__name__)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a JWT access token."""
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc).replace(tzinfo=None) + expires_delta
        else:
            expire = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        logger.info("JWT Generated...")
        return encoded_jwt
    except Exception as e:
        logger.error(f"Failed to create JWT: {repr(e)}")
        raise JWTCreationError("Failed to create JWT token.") from e

def verify_token(token: str) -> Optional[dict]:
    """Verifies and decodes a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"JWT Verification Failed: {repr(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error verifying JWT: {repr(e)}")
        return None
