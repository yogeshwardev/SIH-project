import os
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from backend.app.config import settings
from backend.app.database.database import engine, Base
from backend.app.api.auth import router as auth_router
from backend.app.api.products import router as products_router
from backend.app.api.speech import router as speech_router
from backend.app.api.pricing import router as pricing_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.export import router as export_router
from backend.app.api.admin import router as admin_router, inquiries_router
from backend.app.api.artisans import router as artisans_router
from backend.app.api.orders import router as orders_router
from backend.app.services.image_service import image_service
from backend.app.services.speech_service import speech_service

# Initialize Database tables
Base.metadata.create_all(bind=engine)

def ensure_database_columns() -> None:
    inspector = inspect(engine)
    
    # Products table column additions
    if "products" in inspector.get_table_names():
        existing = {column["name"] for column in inspector.get_columns("products")}
        additions = {
            "title_telugu": "VARCHAR",
            "short_description_telugu": "TEXT",
            "description_telugu": "TEXT",
        }
        with engine.begin() as connection:
            for column_name, column_type in additions.items():
                if column_name not in existing:
                    connection.execute(text(
                        f"ALTER TABLE products ADD COLUMN {column_name} {column_type}"
                    ))
                    
    # Artisans table column additions
    if "artisans" in inspector.get_table_names():
        existing_artisan_cols = {column["name"] for column in inspector.get_columns("artisans")}
        artisan_additions = {
            "store_name": "VARCHAR",
            "email": "VARCHAR",
            "phone": "VARCHAR",
            "craft_category": "VARCHAR",
            "pan_or_gst": "VARCHAR",
            "artisan_card_number": "VARCHAR",
            "bank_account": "VARCHAR",
            "ifsc_code": "VARCHAR",
            "kyc_status": "VARCHAR DEFAULT 'Verified'",
            "address": "VARCHAR",
            "pincode": "VARCHAR"
        }
        with engine.begin() as connection:
            for column_name, column_type in artisan_additions.items():
                if column_name not in existing_artisan_cols:
                    connection.execute(text(
                        f"ALTER TABLE artisans ADD COLUMN {column_name} {column_type}"
                    ))

ensure_database_columns()

@asynccontextmanager
async def lifespan(_app: FastAPI):
    def warmup_models():
        if settings.IMAGE_MODEL_PRELOAD:
            image_service.warmup(include_primary=False)
        if settings.VOICE_MODEL_PRELOAD:
            speech_service.warmup()
        if settings.IMAGE_MODEL_PRELOAD:
            image_service.warmup(include_primary=True)

    if settings.IMAGE_MODEL_PRELOAD or settings.VOICE_MODEL_PRELOAD:
        threading.Thread(target=warmup_models, name="ai-model-warmup", daemon=True).start()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CraftLink — National Direct Artisan Marketplace and Producer Operations API.",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Uploads Directory for Images and Media
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Include Routers
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(products_router, prefix=settings.API_PREFIX)
app.include_router(speech_router, prefix=settings.API_PREFIX)
app.include_router(pricing_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)
app.include_router(export_router, prefix=settings.API_PREFIX)
app.include_router(admin_router, prefix=settings.API_PREFIX)
app.include_router(inquiries_router, prefix=settings.API_PREFIX)
app.include_router(artisans_router, prefix=settings.API_PREFIX)
app.include_router(orders_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "project": "CraftLink India",
        "tagline": "Authentic Handcrafted Products Directly from Verified Master Artisans.",
        "status": "operational",
        "api_docs": "/docs",
        "api_prefix": settings.API_PREFIX
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": settings.VERSION}
