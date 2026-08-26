import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database.database import engine, Base
from backend.app.api.products import router as products_router
from backend.app.api.speech import router as speech_router
from backend.app.api.pricing import router as pricing_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.export import router as export_router
from backend.app.api.admin import router as admin_router, inquiries_router

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CraftLink AI — From Handmade to Market-Ready in Minutes. (SIH26090)"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Uploads Directory for Images and Media
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Include Routers
app.include_router(products_router, prefix=settings.API_PREFIX)
app.include_router(speech_router, prefix=settings.API_PREFIX)
app.include_router(pricing_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)
app.include_router(export_router, prefix=settings.API_PREFIX)
app.include_router(admin_router, prefix=settings.API_PREFIX)
app.include_router(inquiries_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "project": "CraftLink AI",
        "tagline": "From Handmade to Market-Ready — In Minutes.",
        "sih_problem_code": "SIH26090",
        "ministry": "Ministry of Social Justice and Empowerment",
        "status": "operational",
        "api_docs": "/docs",
        "api_prefix": settings.API_PREFIX
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": settings.VERSION}
