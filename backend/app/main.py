from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api import dashboard, emi, health, installments, profile, purchases, scenarios
from .config import settings
from .database import SessionLocal, init_db
from .services.seed import seed_demo_data


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    if settings.seed_demo:
        with SessionLocal() as db:
            seed_demo_data(db)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Explainable financial futures and purchase decision intelligence.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    health.router,
    profile.router,
    dashboard.router,
    scenarios.router,
    purchases.router,
    emi.router,
    installments.router,
):
    app.include_router(router, prefix=settings.api_prefix)


@app.get("/")
def root() -> JSONResponse:
    return JSONResponse(
        {
            "name": settings.app_name,
            "message": "API is running. Start the Streamlit interface on port 8501 for the full experience.",
            "streamlit": "http://localhost:8501",
            "docs": "/docs",
            "health": f"{settings.api_prefix}/health",
        }
    )


@app.get("/api")
def api_information() -> dict:
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": f"{settings.api_prefix}/health",
    }
