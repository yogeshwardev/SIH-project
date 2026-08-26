import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.config import settings
from backend.app.database.database import get_db
from backend.app.models.product import Product
from backend.app.models.artisan import Artisan
from backend.app.schemas.product import (
    ImageEnhanceResponse,
    ProductExtractRequest,
    ProductAttributes,
    ListingGenerateRequest,
    MultilingualListingResponse,
    PriceCalculateRequest,
    PriceRecommendationResponse,
    ProductCreate,
    ProductUpdate,
    ProductResponse
)
from backend.app.services.image_service import image_service
from backend.app.services.product_intelligence import product_intelligence_service
from backend.app.services.listing_service import listing_service
from backend.app.services.pricing_service import pricing_service
from backend.app.utils.helpers import sanitize_filename, safe_json_loads, safe_json_dumps

router = APIRouter(prefix="/products", tags=["Products & AI Pipeline"])

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

@router.post("/image-enhance", response_model=ImageEnhanceResponse)
async def enhance_image(file: UploadFile = File(...)):
    """
    Step 1 of AI Pipeline:
    Uploads messy raw artisan photo -> Performs Computer Vision background segmentation, 
    lighting correction, color temperature balancing, and studio compositing.
    """
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Invalid image format '{ext}'. Allowed: {list(ALLOWED_IMAGE_EXTENSIONS)}"
        )

    content_type = (file.content_type or "").lower()
    if content_type and not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not an image.")

    # Save under a unique name so separate artisans never overwrite each other.
    safe_name = f"{uuid.uuid4().hex[:10]}_{sanitize_filename(file.filename)}"
    input_filepath = settings.UPLOAD_DIR / safe_name

    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    size = 0
    with open(input_filepath, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > max_bytes:
                buffer.close()
                input_filepath.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail=f"Image exceeds {settings.MAX_IMAGE_SIZE_MB}MB limit.")
            buffer.write(chunk)

    try:
        # Run real Computer Vision pipeline
        result = image_service.enhance_product_image(str(input_filepath))
        
        return ImageEnhanceResponse(
            original_image_url=result["original_image_url"],
            enhanced_image_url=result["enhanced_image_url"],
            detected_objects=result["detected_objects"],
            dominant_colors=result["dominant_colors"],
            processing_time_seconds=result["processing_time_seconds"],
            confidence_score=result["confidence_score"]
        )
    except HTTPException:
        raise
    except ValueError as e:
        input_filepath.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"Image enhancement failed: {str(e)}")
    except Exception as e:
        input_filepath.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Image enhancement failed: {str(e)}")

@router.post("/extract-information", response_model=ProductAttributes)
async def extract_product_information(req: ProductExtractRequest):
    """
    Step 2 of AI Pipeline:
    Converts unstructured artisan voice transcript into structured product attributes
    strictly without hallucinations.
    """
    if not req.transcript or len(req.transcript.strip()) < 3:
        raise HTTPException(status_code=400, detail="Voice transcript is empty or too short.")

    try:
        attrs = product_intelligence_service.extract_structured_attributes(
            transcript=req.transcript,
            detected_objects=req.detected_objects,
            language=req.language or "Hindi"
        )
        return attrs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Information extraction failed: {str(e)}")

@router.post("/generate-listing", response_model=MultilingualListingResponse)
async def generate_product_listing(req: ListingGenerateRequest):
    """
    Step 3 of AI Pipeline:
    Generates high-converting bilingual e-commerce listings (English + Hindi)
    including titles, descriptions, technical specs, and SEO keywords.
    """
    try:
        listing = listing_service.generate_listing(
            attributes=req.attributes,
            artisan_name=req.artisan_name or "Master Artisan"
        )
        return listing
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Listing generation failed: {str(e)}")

@router.post("/price-recommendation", response_model=PriceRecommendationResponse)
async def recommend_price(req: PriceCalculateRequest):
    """
    Step 4 of AI Pipeline:
    Calculates cost-plus fair trade economics + Machine Learning reference benchmarking
    and returns transparent 'Why this price?' explanation.
    """
    try:
        recommendation = pricing_service.calculate_price_recommendation(req)
        return recommendation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pricing calculation failed: {str(e)}")

@router.post("/create", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    """
    Final Step:
    Persist confirmed product and its AI-generated attributes into SQLite database.
    """
    # Create or assign artisan
    artisan_id = product_in.artisan_id
    if not artisan_id:
        # Check or create default artisan
        artisan = db.query(Artisan).first()
        if not artisan:
            artisan = Artisan(
                name="Sunita Devi", 
                region=product_in.region or "Varanasi, UP", 
                language="Hindi", 
                contact="+91 98765 43210"
            )
            db.add(artisan)
            db.commit()
            db.refresh(artisan)
        artisan_id = artisan.id

    db_product = Product(
        artisan_id=artisan_id,
        original_image=product_in.original_image,
        enhanced_image=product_in.enhanced_image,
        audio_file=product_in.audio_file,
        transcript=product_in.transcript,
        detected_language=product_in.detected_language or "Hindi",
        product_name=product_in.product_name,
        category=product_in.category,
        material=product_in.material,
        craft_type=product_in.craft_type,
        color=product_in.color,
        technique=product_in.technique,
        dimensions=product_in.dimensions,
        weight=product_in.weight,
        production_time=product_in.production_time,
        region=product_in.region,
        title=product_in.title,
        title_hindi=product_in.title_hindi,
        short_description=product_in.short_description,
        short_description_hindi=product_in.short_description_hindi,
        description=product_in.description,
        description_hindi=product_in.description_hindi,
        specifications=safe_json_dumps(product_in.specifications),
        keywords=safe_json_dumps(product_in.keywords),
        material_cost=product_in.material_cost,
        labor_cost=product_in.labor_cost,
        packaging_cost=product_in.packaging_cost,
        total_cost=product_in.total_cost or (product_in.material_cost + product_in.labor_cost + product_in.packaging_cost),
        minimum_price=product_in.minimum_price,
        recommended_min_price=product_in.recommended_min_price,
        recommended_max_price=product_in.recommended_max_price,
        suggested_price=product_in.suggested_price,
        pricing_explanation=safe_json_dumps(product_in.pricing_explanation),
        ai_confidence=safe_json_dumps(product_in.ai_confidence),
        status=product_in.status or "Published"
    )

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return _format_product_response(db_product, db)

@router.get("", response_model=List[ProductResponse])
async def list_products(
    search: Optional[str] = Query(None, description="Search term in name, description or craft"),
    category: Optional[str] = Query(None, description="Filter by category"),
    craft_type: Optional[str] = Query(None, description="Filter by craft type"),
    region: Optional[str] = Query(None, description="Filter by region"),
    status: Optional[str] = Query("Published", description="Filter by product status ('Published', 'Pending Approval', 'All')"),
    min_price: Optional[float] = Query(None, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, description="Maximum price filter"),
    db: Session = Depends(get_db)
):
    """List products with full multi-attribute filtering for Buyer and Artisan catalog views."""
    query = db.query(Product)

    if status and status != "All":
        query = query.filter(Product.status == status)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Product.product_name.ilike(search_pattern),
                Product.craft_type.ilike(search_pattern),
                Product.material.ilike(search_pattern),
                Product.title.ilike(search_pattern),
                Product.description.ilike(search_pattern),
                Product.region.ilike(search_pattern)
            )
        )

    if category and category != "All":
        query = query.filter(Product.category == category)
    if craft_type and craft_type != "All":
        query = query.filter(Product.craft_type.ilike(f"%{craft_type}%"))
    if region and region != "All":
        query = query.filter(Product.region.ilike(f"%{region}%"))
    if min_price is not None:
        query = query.filter(Product.suggested_price >= min_price)
    if max_price is not None:
        query = query.filter(Product.suggested_price <= max_price)

    products = query.order_by(Product.created_at.desc()).all()
    return [_format_product_response(p, db) for p in products]

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Retrieve single product details."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _format_product_response(product, db)

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, update_data: ProductUpdate, db: Session = Depends(get_db)):
    """Update product information."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_dict = update_data.model_dump(exclude_unset=True)
    if "specifications" in update_dict and update_dict["specifications"] is not None:
        update_dict["specifications"] = safe_json_dumps(update_dict["specifications"])
    if "keywords" in update_dict and update_dict["keywords"] is not None:
        update_dict["keywords"] = safe_json_dumps(update_dict["keywords"])

    for key, value in update_dict.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return _format_product_response(product, db)

@router.delete("/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"status": "success", "message": f"Product {product_id} deleted"}

def _format_product_response(p: Product, db: Session) -> ProductResponse:
    artisan = p.artisan if p.artisan else None
    return ProductResponse(
        id=p.id,
        artisan_id=p.artisan_id,
        artisan_name=artisan.name if artisan else "Master Artisan",
        artisan_region=artisan.region if artisan else p.region,
        original_image=p.original_image,
        enhanced_image=p.enhanced_image,
        audio_file=p.audio_file,
        transcript=p.transcript,
        detected_language=p.detected_language or "Hindi",
        product_name=p.product_name,
        category=p.category,
        material=p.material,
        craft_type=p.craft_type,
        color=p.color,
        technique=p.technique,
        dimensions=p.dimensions,
        weight=p.weight,
        production_time=p.production_time,
        region=p.region,
        title=p.title or p.product_name,
        title_hindi=p.title_hindi,
        short_description=p.short_description,
        short_description_hindi=p.short_description_hindi,
        description=p.description,
        description_hindi=p.description_hindi,
        specifications=safe_json_loads(p.specifications, []),
        keywords=safe_json_loads(p.keywords, []),
        material_cost=p.material_cost,
        labor_cost=p.labor_cost,
        packaging_cost=p.packaging_cost,
        total_cost=p.total_cost,
        minimum_price=p.minimum_price,
        recommended_min_price=p.recommended_min_price,
        recommended_max_price=p.recommended_max_price,
        suggested_price=p.suggested_price,
        pricing_explanation=safe_json_loads(p.pricing_explanation, {}),
        ai_confidence=safe_json_loads(p.ai_confidence, {}),
        status=p.status or "Pending Approval",
        admin_notes=p.admin_notes,
        admin_reviewed_at=p.admin_reviewed_at,
        rating=getattr(p, "rating", 4.9) or 4.9,
        review_count=getattr(p, "review_count", 18) or 18,
        stock_quantity=getattr(p, "stock_quantity", 5) or 5,
        is_featured=getattr(p, "is_featured", False) or False,
        badge=getattr(p, "badge", "GI Certified") or "GI Certified",
        created_at=p.created_at,
        updated_at=p.updated_at
    )
