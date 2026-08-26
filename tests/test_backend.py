import os
import sys
import io
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

# Add project root
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.main import app
from backend.app.database.database import Base, engine, SessionLocal
from backend.app.models.artisan import Artisan
from backend.app.models.product import Product
from backend.app.models.order_inquiry import OrderInquiry
from backend.app.services.image_service import image_service
from backend.app.services.speech_service import speech_service
from backend.app.services.product_intelligence import product_intelligence_service
from backend.app.services.listing_service import listing_service
from backend.app.services.pricing_service import pricing_service

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Ensure at least one artisan exists
    artisan = db.query(Artisan).first()
    if not artisan:
        artisan = Artisan(
            name="Master Artisan Sunita",
            language="Hindi",
            region="Varanasi, UP",
            contact="+91 98765 00000"
        )
        db.add(artisan)
        db.commit()
    db.close()
    yield

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "CraftLink AI"
    assert data["status"] == "operational"

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_image_enhancement_endpoint_returns_renderable_urls():
    from PIL import Image, ImageDraw

    image = Image.new("RGB", (240, 180), "white")
    ImageDraw.Draw(image).ellipse((50, 20, 190, 170), fill=(32, 110, 170))
    payload = io.BytesIO()
    image.save(payload, format="JPEG")
    payload.seek(0)

    response = client.post(
        "/api/products/image-enhance",
        files={"file": ("blue-pottery.jpg", payload, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["original_image_url"].startswith("/uploads/")
    assert data["enhanced_image_url"].endswith("_studio_enhanced.png")
    assert client.get(data["original_image_url"]).status_code == 200
    assert client.get(data["enhanced_image_url"]).status_code == 200

def test_speech_capabilities_are_explicit():
    response = client.get("/api/speech/capabilities")
    assert response.status_code == 200
    assert response.json()["browser_dictation_fallback"] is True
    assert "cloud_transcription" in response.json()

def test_nlp_product_information_extraction():
    transcript = "यह शुद्ध बनारसी कतान सिल्क साड़ी है जिसे हथकरघे पर 6 दिन में बुना गया है। इसकी लंबाई 6.5 मीटर है।"
    payload = {
        "transcript": transcript,
        "language": "Hindi"
    }
    response = client.post("/api/products/extract-information", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Handloom & Textiles"
    assert "Banarasi" in data["craft_type"]
    assert "Silk" in data["material"]
    assert "6 days" in data["production_time"]
    assert "6.5" in data["dimensions"]
    # Check strict anti-hallucination for unmentioned fields
    assert "Not specified" in data["weight"] or "Not provided" in data["weight"]
    assert data["confidence_scores"]["craft_type"] == "HIGH"

def test_multilingual_listing_generation():
    payload = {
        "attributes": {
            "product_name": "Handcrafted Blue Pottery Vase",
            "category": "Pottery & Ceramics",
            "material": "Quartz Stone Powder & Glass",
            "craft_type": "Jaipur Blue Pottery",
            "color": "Cobalt Blue",
            "technique": "Traditional Faience",
            "dimensions": "10 inches",
            "weight": "650 grams",
            "production_time": "3 days",
            "region": "Jaipur, Rajasthan"
        },
        "artisan_name": "Rameshwar Lal"
    }
    response = client.post("/api/products/generate-listing", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Blue Pottery" in data["title_en"]
    assert "ब्लू पॉटरी" in data["title_hi"]
    assert len(data["specifications"]) >= 4
    assert len(data["keywords"]) >= 4

def test_smart_pricing_engine():
    payload = {
        "material_cost": 1200.0,
        "labor_cost": 2500.0,
        "packaging_cost": 150.0,
        "production_time": "4 days",
        "category": "Handloom & Textiles",
        "craft_type": "Banarasi Silk Weaving",
        "material": "Pure Silk"
    }
    response = client.post("/api/products/price-recommendation", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_cost"] == 3850.0
    assert data["minimum_sustainable_price"] > 3850.0
    assert data["suggested_price"] >= data["recommended_min_price"]
    assert len(data["price_breakdown"]) == 4
    assert "Banarasi" in data["explanation"]

def test_product_crud_lifecycle():
    # 1. Create Product
    create_payload = {
        "product_name": "Test Handcrafted Terracotta Pot",
        "category": "Pottery & Ceramics",
        "craft_type": "Gorakhpur Terracotta",
        "material": "Natural Clay",
        "material_cost": 200.0,
        "labor_cost": 600.0,
        "packaging_cost": 50.0,
        "total_cost": 850.0,
        "minimum_price": 1000.0,
        "recommended_min_price": 1100.0,
        "recommended_max_price": 1600.0,
        "suggested_price": 1299.0,
        "title": "Authentic Handcrafted Terracotta Clay Pot",
        "short_description": "Eco-friendly natural clay pot.",
        "status": "Published"
    }
    create_res = client.post("/api/products/create", json=create_payload)
    assert create_res.status_code == 201
    created = create_res.json()
    product_id = created["id"]
    assert product_id > 0
    assert created["product_name"] == "Test Handcrafted Terracotta Pot"

    # 2. Get Product by ID
    get_res = client.get(f"/api/products/{product_id}")
    assert get_res.status_code == 200
    assert get_res.json()["suggested_price"] == 1299.0

    # 3. List and Filter Products
    list_res = client.get(f"/api/products?search=Terracotta")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 4. Update Product
    update_res = client.put(f"/api/products/{product_id}", json={"suggested_price": 1399.0})
    assert update_res.status_code == 200
    assert update_res.json()["suggested_price"] == 1399.0

    # 5. Delete Product
    del_res = client.delete(f"/api/products/{product_id}")
    assert del_res.status_code == 200

def test_dashboard_stats():
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_products" in data
    assert "categories" in data
    assert "average_price" in data

def test_catalog_exports():
    # Test CSV export
    csv_res = client.get("/api/catalog/export/csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Product ID,Artisan Name,Product Name" in csv_res.text

    # Test JSON export
    json_res = client.get("/api/catalog/export/json")
    assert json_res.status_code == 200
    assert "application/json" in json_res.headers["content-type"]
    assert isinstance(json_res.json(), list)
