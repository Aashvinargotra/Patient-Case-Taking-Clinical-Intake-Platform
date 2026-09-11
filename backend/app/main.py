from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import init_db
from app.api.v1.auth import router as auth_router
from app.api.v1.intake import router as intake_router
from app.api.v1.doctor import router as doctor_router
from app.api.v1.queue import router as queue_router
from app.api.v1.triage import router as triage_router
from app.api.v1.documents import router as documents_router
from app.api.v1.patient_portal import router as patient_portal_router
from app.api.v1.admin import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB schema
    try:
        await init_db()
    except Exception as e:
        print(f"[WARN] Database auto-init skipped or deferred: {e}")
    yield
    # Shutdown: Clean up connections

app = FastAPI(
    title="MediKiosk Clinical Intake & Decision-Support Platform API",
    description="AI-powered multilingual clinical intake and triage platform for Indian hospital OPDs (Allopathic & AYUSH - SIH Problem Statement SIH26047).",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles

# Mount API V1 Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(intake_router, prefix=settings.API_V1_STR)
app.include_router(doctor_router, prefix=settings.API_V1_STR)
app.include_router(queue_router, prefix=settings.API_V1_STR)
app.include_router(triage_router, prefix=settings.API_V1_STR)
app.include_router(documents_router, prefix=settings.API_V1_STR)
app.include_router(patient_portal_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

# Mount Static Kiosk Frontend if directory exists
kiosk_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend_patient_kiosk"))
if os.path.exists(kiosk_dir):
    app.mount("/kiosk", StaticFiles(directory=kiosk_dir, html=True), name="kiosk")

# Mount Static Clinical Web Portals Suite if directory exists
portal_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend_web_apps"))
if os.path.exists(portal_dir):
    app.mount("/portal", StaticFiles(directory=portal_dir, html=True), name="portal")



@app.get("/health", tags=["System Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0"
    }

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to MediKiosk Clinical Intake Platform API",
        "docs_url": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
