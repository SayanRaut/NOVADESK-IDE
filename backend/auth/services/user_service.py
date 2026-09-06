import logging
import secrets
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import bcrypt

from database.models import User
from auth.exceptions import UserCreationError, AuthError, UserUnverifiedError, OTPVerificationError
from auth.schemas import UserCreate

logger = logging.getLogger(__name__)

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    pwd_bytes = password.encode('utf-8')
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def generate_otp_code() -> str:
    """Generates a secure 6-digit verification code."""
    return f"{secrets.randbelow(900000) + 100000}"

def log_otp_banner(email: str, otp: str, purpose: str = "REGISTRATION / VERIFICATION"):
    banner = f"""
========================================================================
[AUTH] NOVADESK SECURITY OTP DISPATCH
------------------------------------------------------------------------
To:      {email}
Code:    {otp}
Action:  {purpose}
Valid:   10 minutes
========================================================================
"""
    logger.info(banner)
    try:
        print(banner)
    except Exception:
        pass

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email.strip().lower()))
    return result.scalar_one_or_none()

async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """Finds a user by their primary key ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user_in: UserCreate) -> tuple[User, str]:
    """
    Creates a real user account with encrypted password and dispatches a 6-digit OTP.
    Does NOT verify the user until the OTP is submitted.
    """
    clean_email = user_in.email.strip().lower()
    
    # Validation checks
    if len(user_in.password) < 8:
        raise UserCreationError("Password must be at least 8 characters long.")
        
    if user_in.confirm_password is not None and user_in.password != user_in.confirm_password:
        raise UserCreationError("Passwords do not match. Please re-type your confirm password.")

    try:
        existing_user = await get_user_by_email(db, clean_email)
        otp = generate_otp_code()
        expires = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10)

        if existing_user:
            if existing_user.is_verified:
                raise UserCreationError("This email address is already registered. Please sign in.")
            
            # Re-send verification for pending unverified user and update credentials
            existing_user.display_name = user_in.display_name.strip()
            existing_user.hashed_password = get_password_hash(user_in.password)
            existing_user.otp_code = otp
            existing_user.otp_expires_at = expires
            existing_user.otp_attempts = 0
            
            await db.commit()
            await db.refresh(existing_user)
            log_otp_banner(clean_email, otp, "RE-REGISTRATION VERIFICATION")
            return existing_user, otp

        hashed_password = get_password_hash(user_in.password)
        user = User(
            email=clean_email,
            display_name=user_in.display_name.strip(),
            hashed_password=hashed_password,
            is_verified=False,
            otp_code=otp,
            otp_expires_at=expires,
            otp_attempts=0
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        log_otp_banner(clean_email, otp, "NEW ACCOUNT VERIFICATION")
        return user, otp
    except UserCreationError:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {repr(e)}")
        await db.rollback()
        raise UserCreationError(f"Failed to create user account: {str(e)}") from e

async def verify_user_otp(db: AsyncSession, email: str, otp: str) -> User:
    """Verifies a user's 6-digit OTP code, activating their account."""
    clean_email = email.strip().lower()
    user = await get_user_by_email(db, clean_email)
    if not user:
        raise OTPVerificationError("No account found with this email address.")
        
    if user.is_verified:
        return user

    if user.otp_attempts and user.otp_attempts >= 5:
        raise OTPVerificationError("Too many failed attempts. Please request a new verification code.")

    # Check expiration
    if not user.otp_expires_at or user.otp_expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        raise OTPVerificationError("Verification code has expired. Please request a new one.")

    if not user.otp_code or user.otp_code != otp.strip():
        user.otp_attempts = (user.otp_attempts or 0) + 1
        await db.commit()
        remaining = max(0, 5 - user.otp_attempts)
        raise OTPVerificationError(f"Invalid verification code. {remaining} attempt(s) remaining.")

    # Verification successful
    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    user.otp_attempts = 0
    await db.commit()
    await db.refresh(user)
    logger.info(f"User verified successfully: {clean_email}")
    return user

async def resend_user_otp(db: AsyncSession, email: str) -> str:
    """Resends a fresh 6-digit OTP code to the user's email."""
    clean_email = email.strip().lower()
    user = await get_user_by_email(db, clean_email)
    if not user:
        raise OTPVerificationError("No account found with this email address.")
        
    if user.is_verified:
        raise OTPVerificationError("This account is already verified. You can sign in directly.")

    otp = generate_otp_code()
    user.otp_code = otp
    user.otp_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10)
    user.otp_attempts = 0
    
    await db.commit()
    log_otp_banner(clean_email, otp, "RESENT VERIFICATION CODE")
    return otp

async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    """Authenticates user credentials and strictly enforces email verification."""
    clean_email = email.strip().lower()
    user = await get_user_by_email(db, clean_email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
        
    # Enforce real verification
    if not user.is_verified:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if not user.otp_code or not user.otp_expires_at or user.otp_expires_at < now:
            otp = generate_otp_code()
            user.otp_code = otp
            user.otp_expires_at = now + timedelta(minutes=10)
            user.otp_attempts = 0
            await db.commit()
            log_otp_banner(clean_email, otp, "LOGIN ATTEMPT - EMAIL UNVERIFIED (NEW CODE)")
        else:
            log_otp_banner(clean_email, user.otp_code, "LOGIN ATTEMPT - EMAIL UNVERIFIED (ACTIVE CODE)")
        raise UserUnverifiedError("Your email address is not yet verified. A 6-digit verification code has been sent.")
        
    return user

def format_user_payload(user: User) -> dict:
    """Formats the user model into a standardized dictionary payload."""
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "avatar": user.avatar,
        "is_verified": bool(user.is_verified),
    }
