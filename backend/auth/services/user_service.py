import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import bcrypt

from database.models import User
from auth.exceptions import UserCreationError, AuthError
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

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """Finds a user by their primary key ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    try:
        existing_user = await get_user_by_email(db, user_in.email)
        if existing_user:
            raise UserCreationError("Email already registered.")
            
        hashed_password = get_password_hash(user_in.password)
        user = User(
            email=user_in.email,
            display_name=user_in.display_name,
            hashed_password=hashed_password,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info("User created successfully.")
        return user
    except UserCreationError:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {repr(e)}")
        await db.rollback()
        raise UserCreationError(f"Failed to create user account: {str(e)}") from e

async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def format_user_payload(user: User) -> dict:
    """Formats the user model into a standardized dictionary payload."""
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "avatar": user.avatar,
    }
