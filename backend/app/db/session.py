import logging
from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

logger = logging.getLogger("medikiosk.db")

# Default Engine from settings
def _build_engine(url: str):
    if "sqlite" in url:
        return create_async_engine(
            url,
            echo=False,
            connect_args={"check_same_thread": False}
        )
    return create_async_engine(
        url,
        echo=False,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True
    )

engine = _build_engine(settings.DATABASE_URL)

async_session_factory = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=AsyncSession
)

_is_sqlite_fallback = False

def switch_to_sqlite_fallback():
    global engine, async_session_factory, _is_sqlite_fallback
    fallback_url = "sqlite+aiosqlite:///./medikiosk_dev.db"
    engine = _build_engine(fallback_url)
    async_session_factory = async_sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
        class_=AsyncSession
    )
    _is_sqlite_fallback = True

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency provider for FastAPI route endpoints."""
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    """Initializes database tables and analytical views, falling back to SQLite if PostgreSQL connection fails."""
    from app.models.schemas import metadata
    from app.db.seed_data import seed_database
    
    # Try connecting with primary engine (e.g. Postgres)
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            await conn.run_sync(metadata.create_all)
            
        async with async_session_factory() as session:
            await seed_database(session)
        print("[INFO] Primary database connected and initialized successfully.")
    except Exception as exc:
        print(f"[WARN] Primary database connection failed ({type(exc).__name__}: {exc}). Activating local SQLite fallback...")
        switch_to_sqlite_fallback()
        async with engine.begin() as conn:
            await conn.run_sync(metadata.create_all)
        async with async_session_factory() as session:
            await seed_database(session)
        print("[INFO] SQLite fallback database initialized and seeded successfully with demo records.")
