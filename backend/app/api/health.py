from fastapi import APIRouter
from sqlalchemy import text

from ..config import settings
from ..database import engine

router = APIRouter(tags=["Health"])


@router.get("/health")
def health() -> dict:
    database_ok = True
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:  # pragma: no cover - defensive health endpoint
        database_ok = False
    return {
        "status": "ok" if database_ok else "degraded",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "database": "connected" if database_ok else "unavailable",
    }
