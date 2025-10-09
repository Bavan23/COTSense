"""
Database session management for SQLAlchemy.
Handles database connections and session lifecycle.
"""

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from ..config import settings

# Create database engine
engine = create_engine(
    settings.database_url_sync,
    poolclass=StaticPool,
    connect_args={
        "check_same_thread": False  # Only needed for SQLite
    } if "sqlite" in settings.database_url else {},
    echo=settings.fastapi_debug,  # Log SQL queries in debug mode
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session.
    
    Yields:
        Session: SQLAlchemy database session
        
    Example:
        @app.get("/components/")
        def get_components(db: Session = Depends(get_db)):
            return db.query(Component).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables."""
    from .models import Base
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all database tables. Use with caution!"""
    from .models import Base
    Base.metadata.drop_all(bind=engine)