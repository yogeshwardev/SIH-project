import csv
import io
import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.models.product import Product
from backend.app.utils.helpers import safe_json_loads

router = APIRouter(prefix="/catalog", tags=["Catalog Export"])

# Indicative HSN codes for handicraft categories, used to pre-fill government
# marketplace sheets. Sellers should confirm the code with their tax adviser.
HSN_BY_CATEGORY = {
    "Handloom & Textiles": "5208",
    "Pottery & Ceramics": "6912",
    "Metal Craft & Bell Metal": "8306",
    "Woodcraft & Carving": "4420",
    "Cane & Bamboo": "4602",
    "Traditional Paintings": "9701",
    "Leather Craft": "4202",
    "Handmade Jewellery": "7117",
    "Stone & Marble Inlay": "6802",
}

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
        "Telugu Title",
        "Short Description (EN)",
        "Short Description (HI)",
        "Short Description (TE)",
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
            p.title_telugu or "",
            p.short_description or "",
            p.short_description_hindi or "",
            p.short_description_telugu or "",
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
                "title_te": p.title_telugu,
                "short_description_en": p.short_description,
                "short_description_hi": p.short_description_hindi,
                "short_description_te": p.short_description_telugu,
                "description_en": p.description,
                "description_hi": p.description_hindi,
                "description_te": p.description_telugu,
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

# ──────────────────────────────────────────────────────────────────────────────
# Government / network marketplace feeds
# ──────────────────────────────────────────────────────────────────────────────

def _live_products(db: Session, artisan_id: Optional[int]):
    query = db.query(Product).filter(Product.status == "Published")
    if artisan_id is not None:
        query = query.filter(Product.artisan_id == artisan_id)
    return query.order_by(Product.id.asc()).all()


@router.get("/export/ondc.json")
async def export_ondc_catalog(artisan_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    """Catalogue in an ONDC-style item envelope for network onboarding.

    Field names follow the ONDC retail item vocabulary (descriptor / price /
    quantity / fulfillment) so a network participant can map it quickly. It is a
    data feed, not a certified ONDC integration.
    """
    products = _live_products(db, artisan_id)
    items = []
    for p in products:
        artisan = p.artisan
        items.append({
            "id": f"craftlink-{p.id}",
            "descriptor": {
                "name": p.title or p.product_name,
                "code": f"CRAFTLINK-{p.id}",
                "short_desc": p.short_description or "",
                "long_desc": p.description or "",
                "images": [url for url in [p.enhanced_image, p.original_image] if url],
                "translations": {
                    "hi": {"name": p.title_hindi or "", "short_desc": p.short_description_hindi or ""},
                    "te": {"name": p.title_telugu or "", "short_desc": p.short_description_telugu or ""},
                },
            },
            "category_id": p.category,
            "craft": p.craft_type,
            "price": {"currency": "INR", "value": f"{float(p.suggested_price or 0):.2f}"},
            "quantity": {"available": {"count": int(p.stock_quantity or 0)}, "unit": "piece"},
            "attributes": {
                "material": p.material or "",
                "technique": p.technique or "",
                "dimensions": p.dimensions or "",
                "weight": p.weight or "",
                "production_time": p.production_time or "",
                "handmade": "true",
            },
            "provider": {
                "id": f"artisan-{p.artisan_id}" if p.artisan_id else None,
                "name": (artisan.store_name or artisan.name) if artisan else None,
                "artisan": artisan.name if artisan else None,
                "region": (artisan.region if artisan else p.region) or "",
                "artisan_id_number": (artisan.artisan_card_number if artisan else None),
            },
            "fulfillment": {"type": "Delivery", "serviceable": "PAN_INDIA", "payment": ["COD"]},
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        })

    payload = {
        "context": {
            "domain": "ONDC:RET10",
            "country": "IND",
            "city": "*",
            "core_version": "1.2.0",
            "bpp_id": "craftlink.in",
            "bpp_descriptor": {"name": "CraftLink artisan catalogue"},
            "timestamp": datetime.utcnow().isoformat(),
        },
        "catalog": {"items": items, "count": len(items)},
        "note": "Data feed generated from live CraftLink listings. Not a certified ONDC network integration.",
    }
    return Response(
        content=json.dumps(payload, ensure_ascii=False, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="craftlink_ondc_catalog.json"'},
    )


@router.get("/export/gem.csv")
async def export_gem_catalog(artisan_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    """Seller catalogue upload sheet in a GeM-style column layout."""
    products = _live_products(db, artisan_id)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Seller Item ID", "Product Title", "Category", "Sub Category (Craft)", "Brand",
        "Seller Name", "Seller Artisan ID", "State", "HSN Code", "Unit of Measure",
        "Offer Price (INR)", "MRP (INR)", "Available Quantity", "Minimum Order Quantity",
        "Country of Origin", "Handmade", "Material", "Dimensions", "Weight",
        "Product Description", "Product Description (Hindi)", "Image URL",
    ])
    for p in products:
        artisan = p.artisan
        price = float(p.suggested_price or 0)
        writer.writerow([
            f"CRAFTLINK-{p.id}",
            p.title or p.product_name,
            p.category or "",
            p.craft_type or "",
            (artisan.store_name if artisan else "") or "CraftLink Artisan",
            artisan.name if artisan else "",
            (artisan.artisan_card_number if artisan else "") or "",
            ((artisan.region if artisan else p.region) or "").split(",")[-1].strip(),
            HSN_BY_CATEGORY.get(p.category or "", "9601"),
            "Piece",
            f"{price:.2f}",
            f"{price:.2f}",
            int(p.stock_quantity or 0),
            1,
            "India",
            "Yes",
            p.material or "",
            p.dimensions or "",
            p.weight or "",
            (p.description or p.short_description or "").replace("\n", " "),
            (p.description_hindi or p.short_description_hindi or "").replace("\n", " "),
            p.enhanced_image or p.original_image or "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="craftlink_gem_catalog.csv"'},
    )
