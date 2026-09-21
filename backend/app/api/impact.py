"""Scheme-level impact metrics for the implementing department (MoSJE).

Every number here is counted from live database records. Nothing is projected,
estimated or padded: if the platform has no orders, the earnings are zero.
"""
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from backend.app.database.database import get_db
from backend.app.models.artisan import Artisan
from backend.app.models.bulk_request import BulkRequest
from backend.app.models.order import Order
from backend.app.models.product import Product

router = APIRouter(prefix="/impact", tags=["Impact & Governance"])

EARNING_STATUSES = {"Placed", "Confirmed", "Packed", "Shipped", "Delivered"}


def _state_of(region: str) -> str:
    return (region or "").split(",")[-1].strip() or "Unknown"


@router.get("/summary")
def impact_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    artisans = db.query(Artisan).all()
    products = db.query(Product).all()
    orders = db.query(Order).options(joinedload(Order.items)).all()
    bulk = db.query(BulkRequest).all()

    published = [p for p in products if p.status == "Published"]
    live_orders = [o for o in orders if o.status in EARNING_STATUSES]
    delivered = [o for o in orders if o.status == "Delivered"]

    # Earnings per artisan, from real order lines.
    earnings_by_artisan: Dict[int, float] = defaultdict(float)
    units_by_artisan: Dict[int, int] = defaultdict(int)
    for order in live_orders:
        for item in order.items:
            if item.artisan_id:
                earnings_by_artisan[item.artisan_id] += float(item.line_total or 0)
                units_by_artisan[item.artisan_id] += int(item.quantity or 0)

    total_earnings = round(sum(earnings_by_artisan.values()), 2)
    delivered_earnings = round(
        sum(float(item.line_total or 0) for order in delivered for item in order.items), 2
    )
    earning_artisans = len([value for value in earnings_by_artisan.values() if value > 0])
    selling_artisan_ids = {p.artisan_id for p in published if p.artisan_id}

    # Reach
    states: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"artisans": 0, "products": 0, "earnings": 0.0})
    for artisan in artisans:
        states[_state_of(artisan.region)]["artisans"] += 1
        states[_state_of(artisan.region)]["earnings"] += round(earnings_by_artisan.get(artisan.id, 0.0), 2)
    for product in published:
        states[_state_of(product.region or (product.artisan.region if product.artisan else ""))]["products"] += 1

    # 12-month trend of orders and artisan earnings
    today = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    months = []
    for offset in range(11, -1, -1):
        month = today
        for _ in range(offset):
            month = (month - timedelta(days=1)).replace(day=1)
        months.append({"month": month.strftime("%b %Y"), "key": month.strftime("%Y-%m"), "orders": 0, "earnings": 0.0})
    by_key = {entry["key"]: entry for entry in months}
    for order in live_orders:
        key = order.created_at.strftime("%Y-%m")
        entry = by_key.get(key)
        if entry:
            entry["orders"] += 1
            entry["earnings"] += round(sum(float(item.line_total or 0) for item in order.items), 2)

    languages: Dict[str, int] = defaultdict(int)
    for artisan in artisans:
        languages[artisan.language or "Hindi"] += 1

    verified_ids = len([a for a in artisans if a.artisan_card_number or a.pan_or_gst])
    with_bank = len([a for a in artisans if a.bank_account and a.ifsc_code])

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "artisans": {
            "onboarded": len(artisans),
            "with_live_listings": len(selling_artisan_ids),
            "earning": earning_artisans,
            "with_government_id": verified_ids,
            "with_bank_details": with_bank,
        },
        "catalogue": {
            "total_listings": len(products),
            "live_listings": len(published),
            "awaiting_review": len([p for p in products if p.status == "Pending Approval"]),
            "categories": len({p.category for p in published if p.category}),
            "crafts": len({p.craft_type for p in published if p.craft_type}),
        },
        "market": {
            "retail_orders": len(live_orders),
            "delivered_orders": len(delivered),
            "cancelled_orders": len([o for o in orders if o.status == "Cancelled"]),
            "bulk_requests": len(bulk),
            "bulk_quoted": len([b for b in bulk if b.status in {"Quoted", "Accepted"}]),
            "bulk_accepted": len([b for b in bulk if b.status == "Accepted"]),
            "bulk_value_accepted": round(
                sum(float(b.quoted_unit_price or 0) * int(b.quantity or 0) for b in bulk if b.status == "Accepted"), 2
            ),
            "units_sold": sum(units_by_artisan.values()),
        },
        "earnings": {
            "total_to_artisans": total_earnings,
            "delivered_to_artisans": delivered_earnings,
            "average_per_earning_artisan": round(total_earnings / earning_artisans, 2) if earning_artisans else 0.0,
            "platform_commission": 0.0,
        },
        "reach": {
            "states": sorted(
                [{"state": name, **values} for name, values in states.items() if name != "Unknown"],
                key=lambda row: (-row["earnings"], -row["artisans"], row["state"]),
            ),
            "languages": sorted(
                [{"language": name, "artisans": count} for name, count in languages.items()],
                key=lambda row: -row["artisans"],
            ),
        },
        "trend": months,
    }
