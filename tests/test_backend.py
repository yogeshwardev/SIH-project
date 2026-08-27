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
from backend.app.services.speech_service import SpeechService
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

def test_image_enhancement_endpoint_returns_renderable_urls(monkeypatch):
    from PIL import Image, ImageDraw
    import numpy as np

    image = Image.new("RGB", (240, 180), "white")
    ImageDraw.Draw(image).ellipse((50, 20, 190, 170), fill=(32, 110, 170))
    payload = io.BytesIO()
    image.save(payload, format="JPEG")
    payload.seek(0)

    def test_segment(source):
        width, height = source.size
        alpha = np.zeros((height, width), dtype=np.uint8)
        cv_center = (width // 2, height // 2)
        import cv2
        cv2.ellipse(alpha, cv_center, (70, 70), 0, 0, 360, 255, -1)
        return alpha, "test-segmentation", 0.99, {
            "geometry": 0.99,
            "component_coherence": 1.0,
            "edge_certainty": 0.98,
        }

    monkeypatch.setattr(image_service, "_segment_product", test_segment)

    response = client.post(
        "/api/products/image-enhance",
        files={"file": ("blue-pottery.jpg", payload, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["original_image_url"].startswith("/uploads/")
    assert data["enhanced_image_url"].endswith("_studio_enhanced.png")
    assert data["segmentation_engine"] == "test-segmentation"
    assert data["confidence_score"] == 0.99
    assert data["confidence_breakdown"]["component_coherence"] == 1.0
    assert "segmentation_seconds" in data["latency_breakdown"]
    assert client.get(data["original_image_url"]).status_code == 200
    assert client.get(data["enhanced_image_url"]).status_code == 200

def test_mask_confidence_rewards_coherence_and_rejects_clutter():
    import numpy as np

    coherent = np.zeros((300, 300), dtype=np.uint8)
    coherent[55:245, 90:210] = 255
    quality, valid, details = image_service._score_mask(coherent)
    assert valid is True
    assert quality >= 0.95
    assert details["component_coherence"] == 1.0

    cluttered = coherent.copy()
    cluttered[10:45, 10:100] = 140
    cluttered[250:285, 200:295] = 140
    clutter_quality, _, clutter_details = image_service._score_mask(cluttered)
    assert clutter_quality < quality
    assert clutter_details["component_coherence"] < 0.9

def test_speech_capabilities_are_explicit():
    response = client.get("/api/speech/capabilities")
    assert response.status_code == 200
    assert response.json()["browser_dictation_fallback"] is True
    assert "cloud_transcription" in response.json()
    assert response.json()["local_transcription"] is True
    assert response.json()["local_transcription_model"] == "small"
    assert response.json()["local_fast_model"] == "base"
    assert response.json()["local_model_strategy"] == "fast-first-confidence-fallback"
    assert response.json()["human_verified_understanding_confidence"] == 0.99
    assert response.json()["guided_product_interview"] is True
    assert response.json()["evidence_gated_pricing"] is True

def test_local_speech_uses_fast_model_then_accuracy_fallback(monkeypatch, tmp_path):
    recording = tmp_path / "voice.wav"
    recording.write_bytes(b"valid-audio-placeholder")
    service = SpeechService()
    created = []
    candidates = iter([
        {
            "transcript": "uncertain product",
            "confidence": 0.70,
            "median_word_probability": 0.72,
            "language_probability": 0.98,
            "low_confidence_word_ratio": 0.40,
            "detected_code": "en",
        },
        {
            "transcript": "blue pottery vase material cost 1200 rupees",
            "confidence": 0.93,
            "median_word_probability": 0.96,
            "language_probability": 0.99,
            "low_confidence_word_ratio": 0.0,
            "detected_code": "en",
        },
    ])

    monkeypatch.setattr(service, "_create_whisper_model", lambda name: created.append(name) or object())
    monkeypatch.setattr(service, "_decode_local_candidate", lambda model, path, language: next(candidates))
    transcript, language, confidence, engine, details = service._transcribe_with_local_whisper(recording, "en")

    assert created == ["base", "small"]
    assert "material cost" in transcript
    assert language == "English"
    assert confidence == 0.93
    assert engine == "faster-whisper-small-int8"
    assert details["fallback_triggered"] == 1.0

def test_guided_product_interview_blocks_unverified_pricing():
    first = client.post("/api/speech/product-interview", json={
        "utterance": "This is a Jaipur Blue Pottery vase made with quartz and cobalt glaze. It takes 3 days.",
        "language": "English",
    })
    assert first.status_code == 200
    data = first.json()
    assert data["status"] == "needs_information"
    assert data["next_question_key"] == "material_cost"
    assert "material_cost" in data["missing_fields"]

    second = client.post("/api/speech/product-interview", json={
        "utterance": "1200 rupees",
        "conversation_transcript": "This is a Jaipur Blue Pottery vase made with quartz and cobalt glaze. It takes 3 days.",
        "language": "English",
        "known_attributes": data["attributes"],
        "cost_inputs": data["cost_inputs"],
        "last_question_key": data["next_question_key"],
    })
    assert second.status_code == 200
    second_data = second.json()
    assert second_data["cost_inputs"]["material_cost"] == 1200.0
    assert second_data["next_question_key"] == "labor_cost"

def test_interview_starts_with_one_friendly_description_question_in_telugu():
    response = client.post("/api/speech/product-interview", json={
        "utterance": "",
        "language": "Telugu",
        "detected_objects": ["Pottery"],
    })
    assert response.status_code == 200
    data = response.json()
    assert data["next_question_key"] == "product_description"
    assert data["question_number"] == 1
    assert data["total_questions"] == 7
    assert "మీ ఉత్పత్తి" in data["assistant_message"]
    assert "technique" not in data["missing_fields"]
    assert "dimensions" not in data["missing_fields"]
    assert "region" not in data["missing_fields"]

    answered = client.post("/api/speech/product-interview", json={
        "utterance": "ఇది చేతితో చేసిన మట్టి దీపం. పండుగలకు మరియు ఇంటి అలంకరణకు ఉపయోగిస్తారు.",
        "language": "Telugu",
        "detected_objects": ["Pottery"],
        "known_attributes": data["attributes"],
        "cost_inputs": data["cost_inputs"],
        "last_question_key": "product_description",
    })
    assert answered.status_code == 200
    answered_data = answered.json()
    assert answered_data["attributes"]["artisan_description"].startswith("ఇది చేతితో")
    assert answered_data["next_question_key"] == "material"
    assert "దేనితో" in answered_data["assistant_message"]

    friendly_retry = client.post("/api/speech/product-interview", json={
        "utterance": "300 రూపాయలు",
        "language": "Telugu",
        "detected_objects": ["Pottery"],
        "known_attributes": answered_data["attributes"],
        "cost_inputs": answered_data["cost_inputs"],
        "last_question_key": "material",
    })
    assert friendly_retry.status_code == 200
    retry_data = friendly_retry.json()
    assert retry_data["next_question_key"] == "material"
    assert "మరోసారి" in retry_data["assistant_message"]

def test_guided_product_interview_reaches_pricing_readiness():
    response = client.post("/api/speech/product-interview", json={
        "utterance": (
            "This is a Jaipur Blue Pottery vase made with quartz and cobalt glaze. "
            "It takes 3 days. Material cost 1200 rupees, labor 2500 rupees, packaging 150 rupees."
        ),
        "language": "English",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "needs_confirmation"
    assert data["cost_inputs"] == {
        "material_cost": 1200.0,
        "labor_cost": 2500.0,
        "packaging_cost": 150.0,
    }
    assert data["readiness_score"] >= 0.66

    confirmed = client.post("/api/speech/product-interview", json={
        "utterance": "Yes, these details and costs are correct.",
        "conversation_transcript": "Product details and costs supplied.",
        "language": "English",
        "known_attributes": data["attributes"],
        "cost_inputs": data["cost_inputs"],
        "last_question_key": "confirmation",
    })
    assert confirmed.status_code == 200
    confirmed_data = confirmed.json()
    assert confirmed_data["status"] == "ready_for_pricing"
    assert confirmed_data["human_confirmed"] is True
    assert confirmed_data["confidence_score"] == 0.99

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
            "region": "Jaipur, Rajasthan",
            "artisan_description": "I paint every vase by hand for home decoration."
        },
        "artisan_name": "Rameshwar Lal"
    }
    response = client.post("/api/products/generate-listing", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Blue Pottery" in data["title_en"]
    assert "ब्लू पॉटरी" in data["title_hi"]
    assert "చేతిపని" in data["title_te"]
    assert "I paint every vase by hand" in data["description_en"]
    assert "కళాకారుని స్వంత మాటల్లో" in data["description_te"]
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
    assert 0.0 < data["pricing_confidence_score"] <= 1.0
    assert data["confidence_level"] in {"LOW", "MEDIUM", "HIGH"}
    assert isinstance(data["requires_human_review"], bool)
    assert len(data["assumptions"]) >= 2

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
        "title_telugu": "ప్రామాణిక చేతిపని టెర్రకోట కుండ",
        "short_description": "Eco-friendly natural clay pot.",
        "short_description_telugu": "సహజ మట్టితో చేతితో తయారు చేసిన కుండ.",
        "description_telugu": "కళాకారుని మాటల్లో తయారీ కథ.",
        "status": "Published"
    }
    create_res = client.post("/api/products/create", json=create_payload)
    assert create_res.status_code == 201
    created = create_res.json()
    product_id = created["id"]
    assert product_id > 0
    assert created["product_name"] == "Test Handcrafted Terracotta Pot"
    assert created["title_telugu"].startswith("ప్రామాణిక")

    # 2. Get Product by ID
    get_res = client.get(f"/api/products/{product_id}")
    assert get_res.status_code == 200
    assert get_res.json()["suggested_price"] == 1299.0
    assert get_res.json()["description_telugu"] == "కళాకారుని మాటల్లో తయారీ కథ."

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
