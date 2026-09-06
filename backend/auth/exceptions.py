class AuthError(Exception):
    """Base exception for authentication errors."""
    pass

class GoogleTokenError(AuthError):
    """Raised when Google ID token verification fails."""
    pass

class OAuthExchangeError(AuthError):
    """Raised when exchanging authorization code with Google fails."""
    pass

class JWTCreationError(AuthError):
    """Raised when JWT creation fails."""
    pass

class UserCreationError(AuthError):
    """Raised when user creation from Google profile fails."""
    pass

class TicketExpiredError(AuthError):
    """Raised when a temporary login ticket has expired or is invalid."""
    pass

class InvalidStateError(AuthError):
    """Raised when the OAuth state parameter is invalid."""
    pass

class UserUnverifiedError(AuthError):
    """Raised when user account is not yet email/OTP verified."""
    pass

class OTPVerificationError(AuthError):
    """Raised when OTP verification fails or expires."""
    pass
