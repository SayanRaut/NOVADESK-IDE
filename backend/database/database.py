import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from config.settings import settings

logger = logging.getLogger(__name__)

def get_normalized_db_url(raw_url: str) -> str:
    url = raw_url.strip()
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

db_url = get_normalized_db_url(settings.DATABASE_URL)

connect_args = {}
if "postgresql" in db_url:
    connect_args["prepared_statement_cache_size"] = 0
    connect_args["statement_cache_size"] = 0

engine = create_async_engine(
    db_url,
    echo=False,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def _migrate_users_table(conn):
    from sqlalchemy import text
    try:
        # Check existing columns in users table
        is_sqlite = "sqlite" in str(conn.engine.url)
        if is_sqlite:
            res = await conn.execute(text("PRAGMA table_info(users)"))
            existing_cols = {row[1] for row in res.fetchall()}
            
            if "is_verified" not in existing_cols:
                await conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0"))
            if "otp_code" not in existing_cols:
                await conn.execute(text("ALTER TABLE users ADD COLUMN otp_code VARCHAR"))
            if "otp_expires_at" not in existing_cols:
                await conn.execute(text("ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP"))
            if "otp_attempts" not in existing_cols:
                await conn.execute(text("ALTER TABLE users ADD COLUMN otp_attempts INTEGER DEFAULT 0"))
        else:
            # PostgreSQL column check
            res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users'"))
            existing_cols = {row[0] for row in res.fetchall()}
            if "is_verified" not in existing_cols:
                await conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE"))
            if "otp_code" not in existing_cols:
                await conn.execute(text("ALTER TABLE users ADD COLUMN otp_code VARCHAR"))
            if "otp_expires_at" not in existing_cols:
                await conn.execute(text("ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP"))
            if "otp_attempts" not in existing_cols:
                await conn.execute(text("ALTER TABLE users ADD COLUMN otp_attempts INTEGER DEFAULT 0"))

        # Eliminate dummy demo account legally, and verify existing legitimate users
        await conn.execute(text("DELETE FROM users WHERE email = 'dev@novadesk.io'"))
        await conn.execute(text("UPDATE users SET is_verified = 1 WHERE email != 'dev@novadesk.io' AND is_verified IS NULL OR is_verified = 0"))
    except Exception as e:
        logger.warning(f"Schema migration warning: {e}")

async def init_db():
    global engine, AsyncSessionLocal
    from . import models
    try:
        async with engine.begin() as conn:
            await conn.run_sync(models.Base.metadata.create_all)
            await _migrate_users_table(conn)
        logger.info("Database initialized successfully with security columns.")
    except Exception as e:
        logger.error(
            f"Failed to connect to primary database ({db_url}): {e}\n"
            "If using Supabase, please verify that your project is not paused and that DATABASE_URL is active."
        )
        # Fallback to local SQLite so the server starts cleanly on Render
        if "postgresql" in db_url:
            logger.warning("Falling back to local SQLite database (sqlite+aiosqlite:///./nova_desk.db)...")
            fallback_url = "sqlite+aiosqlite:///./nova_desk.db"
            engine = create_async_engine(fallback_url, echo=False)
            AsyncSessionLocal = async_sessionmaker(
                bind=engine, class_=AsyncSession, expire_on_commit=False
            )
            async with engine.begin() as conn:
                await conn.run_sync(models.Base.metadata.create_all)
                await _migrate_users_table(conn)
            logger.info("Fallback SQLite database initialized successfully.")
