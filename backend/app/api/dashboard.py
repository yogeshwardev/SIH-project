from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List

from backend.app.database.database import get_db
from backend.app.models.product import Product
from backend.app.models.artisan import Artisan

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])

@router.get("/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns analytics and metrics for Admin and Buyer dashboards:
    - Total artisans & products
    - Total catalog valuation
    - Average pricing and profit margins
    - Category distribution
    - Regional craft representation
    - Recent additions
    """
    total_artisans = db.query(Artisan).count()
    total_products = db.query(Product).count()
    published_products = db.query(Product).filter(Product.status == "Published").count()
    draft_products = db.query(Product).filter(Product.status == "Draft").count()

    # Financial sums
    avg_price_res = db.query(func.avg(Product.suggested_price)).scalar() or 0.0
    total_val_res = db.query(func.sum(Product.suggested_price)).scalar() or 0.0
    avg_cost_res = db.query(func.avg(Product.total_cost)).scalar() or 0.0

    avg_margin_pct = 0.0
    if avg_price_res > 0:
        avg_margin_pct = round(((avg_price_res - avg_cost_res) / avg_price_res) * 100, 1)

    # Category distribution
    category_counts = (
        db.query(Product.category, func.count(Product.id), func.sum(Product.suggested_price))
        .group_by(Product.category)
        .all()
    )
    categories = [
        {"name": cat, "count": count, "total_value": float(tot or 0)}
        for cat, count, tot in category_counts if cat
    ]

    # Regional breakdown
    region_counts = (
        db.query(Product.region, func.count(Product.id))
        .group_by(Product.region)
        .all()
    )
    regions = [
        {"region": reg or "India", "count": count}
        for reg, count in region_counts if reg
    ]

    # Recent 5 products
    recent_records = db.query(Product).order_by(Product.created_at.desc()).limit(5).all()
    recent_products = [
        {
            "id": p.id,
            "product_name": p.product_name,
            "category": p.category,
            "craft_type": p.craft_type,
            "suggested_price": p.suggested_price,
            "enhanced_image": p.enhanced_image,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in recent_records
    ]

    return {
        "total_artisans": max(total_artisans, 1),
        "total_products": total_products,
        "published_products": published_products,
        "draft_products": draft_products,
        "average_price": round(float(avg_price_res), 2),
        "total_catalog_value": round(float(total_val_res), 2),
        "average_margin_percentage": avg_margin_pct,
        "categories": categories,
        "regions": regions,
        "recent_products": recent_products
    }
