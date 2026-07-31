import logging
import httpx
from config.settings import settings
from auth.exceptions import OAuthExchangeError
from google.oauth2 import id_token
from google.auth.transport import requests

logger = logging.getLogger(__name__)

class GoogleOAuthService:
    @staticmethod
    def generate_login_url(state: str) -> str:
        """Generates the Google OAuth login URL."""
        logger.info("Starting Google OAuth...")
        
        if not settings.GOOGLE_CLIENT_ID:
            raise OAuthExchangeError("GOOGLE_CLIENT_ID is not configured.")
            
        query = (
            f"client_id={settings.GOOGLE_CLIENT_ID}&"
            f"redirect_uri={settings.GOOGLE_REDIRECT_URI}&"
            "response_type=code&"
            "scope=openid%20email%20profile&"
            f"state={state}"
        )
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"

    @staticmethod
    async def exchange_code(code: str) -> dict:
        """Exchange auth code for Google token."""
        if not settings.GOOGLE_CLIENT_SECRET or not settings.GOOGLE_CLIENT_ID:
            raise OAuthExchangeError("Google OAuth credentials are not configured.")
            
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data=data
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            error_body = e.response.text
            logger.error(f"OAuth Exchange Failed: {error_body}")
            raise OAuthExchangeError(f"OAuth Exchange Failed: {error_body}") from e
        except Exception as e:
            logger.error(f"OAuth Exchange Failed: {repr(e)}")
            raise OAuthExchangeError(f"OAuth Exchange Failed: {repr(e)}") from e

    @staticmethod
    def verify_id_token(token: str) -> dict:
        """Verifies the Google ID token and returns the decoded claims."""
        try:
            # Specify the CLIENT_ID of the app that accesses the backend
            id_info = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=60
            )
            return id_info
        except ValueError as e:
            logger.error(f"Invalid Google ID token: {e}")
            raise OAuthExchangeError(f"Invalid token: {e}") from e
