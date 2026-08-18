from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.routes import system, analysis

def create_app() -> FastAPI:
    app = FastAPI(
        title="CAN Anomaly Detection API",
        description="Local offline API for CAN bus anomaly detection",
        version="1.0.0",
    )

    # Configure CORS for local React/Capacitor frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(system.router, prefix="/api/system", tags=["System"])
    app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])

    @app.on_event("startup")
    async def startup_event():
        os.makedirs("data/uploads", exist_ok=True)

    return app

app = create_app()
