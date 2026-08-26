import csv
import io
import json
from fastapi import APIRouter, Depends, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.models.product import Product
from backend.app.utils.helpers import safe_json_loads

router = APIRouter(prefix="/catalog", tags=["Catalog Export"])

@router.get("/export/csv")
async def export_catalog_csv(db: Session = Depends(get_db)):
    """
    Exports all live database product listings as a clean RFC4180 CSV file
    for e-commerce, ONDC, and marketplace integration.
    """
    products = db.query(Product).order_by(Product.id.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Headers
    writer.writerow([
        "Product ID",
        "Artisan Name",
        "Product Name",
        "Category",
        "Craft Type",
        "Material",
        "Origin Region",
        "Production Time",
        "Dimensions",
        "English Title",
        "Hindi Title",
        "Short Description (EN)",
        "Short Description (HI)",
        "Material Cost (INR)",
        "Labor Cost (INR)",
        "Packaging Cost (INR)",
        "Total Cost (INR)",
        "Suggested Retail Price (INR)",
        "Status",
        "Created At"
    ])

    for p in products:
        artisan_name = p.artisan.name if p.artisan else "Master Artisan"
        writer.writerow([
            p.id,
            artisan_name,
            p.product_name,
            p.category,
            p.craft_type or "",
            p.material or "",
            p.region or "",
            p.production_time or "",
            p.dimensions or "",
            p.title or p.product_name,
            p.title_hindi or "",
            p.short_description or "",
            p.short_description_hindi or "",
            p.material_cost,
            p.labor_cost,
            p.packaging_cost,
            p.total_cost,
            p.suggested_price,
            p.status,
            p.created_at.strftime("%Y-%m-%d %H:%M:%S") if p.created_at else ""
        ])

    output.seek(0)
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=craftlink_artisan_catalog.csv"
    return response

@router.get("/export/json")
async def export_catalog_json(db: Session = Depends(get_db)):
    """
    Exports all live database product listings as structured JSON for API/ONDC integrations.
    """
    products = db.query(Product).order_by(Product.id.asc()).all()
    records = []

    for p in products:
        artisan_name = p.artisan.name if p.artisan else "Master Artisan"
        records.append({
            "id": p.id,
            "artisan": {
                "id": p.artisan_id,
                "name": artisan_name,
                "region": p.artisan.region if p.artisan else p.region
            },
            "product_name": p.product_name,
            "category": p.category,
            "craft_type": p.craft_type,
            "material": p.material,
            "color": p.color,
            "technique": p.technique,
            "dimensions": p.dimensions,
            "weight": p.weight,
            "production_time": p.production_time,
            "region": p.region,
            "media": {
                "original_image": p.original_image,
                "enhanced_image": p.enhanced_image,
                "audio_file": p.audio_file
            },
            "speech": {
                "transcript": p.transcript,
                "language": p.detected_language
            },
            "listings": {
                "title_en": p.title,
                "title_hi": p.title_hindi,
                "short_description_en": p.short_description,
                "short_description_hi": p.short_description_hindi,
                "description_en": p.description,
                "description_hi": p.description_hindi,
                "specifications": safe_json_loads(p.specifications, []),
                "keywords": safe_json_loads(p.keywords, [])
            },
            "economics": {
                "currency": "INR",
                "material_cost": p.material_cost,
                "labor_cost": p.labor_cost,
                "packaging_cost": p.packaging_cost,
                "total_cost": p.total_cost,
                "minimum_sustainable_price": p.minimum_price,
                "recommended_min_price": p.recommended_min_price,
                "recommended_max_price": p.recommended_max_price,
                "suggested_price": p.suggested_price
            },
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })

    json_str = json.dumps(records, indent=2, ensure_ascii=False)
    response = Response(content=json_str, media_type="application/json")
    response.headers["Content-Disposition"] = "attachment; filename=craftlink_artisan_catalog.json"
    return response
