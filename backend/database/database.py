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

async def init_db():
    global engine, AsyncSessionLocal
    from . import models
    try:
        async with engine.begin() as conn:
            await conn.run_sync(models.Base.metadata.create_all)
        logger.info("Database initialized successfully.")
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
            logger.info("Fallback SQLite database initialized successfully.")
