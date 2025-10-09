"""Routes package initialization."""

from .recommend import router as recommend_router
from .explain import router as explain_router

__all__ = ["recommend_router", "explain_router"]