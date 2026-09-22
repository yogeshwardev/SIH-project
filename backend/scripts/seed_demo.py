"""Put one artisan's story into the database so a demo has something to show.

A fresh CraftLink install is deliberately empty — empty states are honest. That
is the right default and the wrong thing to present to a panel for the first
ninety seconds, so this script creates a single demo artisan with a few
listings, two retail orders and two wholesale enquiries.

Everything it writes is tagged `craftlink-demo` and can be removed again:

    python backend/scripts/seed_demo.py            # create
    python backend/scripts/seed_demo.py --remove   # delete every demo row

The demo seller signs in with the email printed at the end (any password: the
login route looks the artisan up, it does not check a password yet).
"""
import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR.parent))

from backend.app.database.database import Base, SessionLocal, engine  # noqa: E402
from backend.app.models.artisan import Artisan  # noqa: E402
from backend.app.models.product import Product  # noqa: E402
from backend.app.models.order import Order, OrderItem  # noqa: E402
from backend.app.models.order_inquiry import OrderInquiry  # noqa: F401,E402  (mapper registration)
from backend.app.models.bulk_request import BulkRequest  # noqa: E402

DEMO_TAG = "craftlink-demo"
DEMO_EMAIL = "demo.artisan@craftlink.in"

ARTISAN = {
    "name": "Meena Devi",
    "store_name": "Mithila Art House",
    "email": DEMO_EMAIL,
    "phone": "9000000100",
    "language": "Hindi",
    "region": "Madhubani, Bihar",
    "craft_category": "Traditional Paintings",
    "pincode": "847211",
    "kyc_status": "Verified",
    "artisan_card_number": "DEMO-PEHCHAN-0001",
    "contact": DEMO_TAG,
}

PRODUCTS = [
    {
        "product_name": "Madhubani Fish and Lotus Painting",
        "title": "Madhubani Fish and Lotus Painting | Handmade in Bihar",
        "short_description": "Hand-painted on handmade paper with natural colours, in the Mithila line style.",
        "category": "Traditional Paintings",
        "craft_type": "Madhubani Painting",
        "material": "Handmade paper and natural colours",
        "technique": "Hand-painted",
        "region": "Madhubani, Bihar",
        "production_time": "2 days",
        "suggested_price": 2499.0,
        "total_cost": 1800.0,
        "stock_quantity": 6,
        "image": "madhubani-fish-lotus-painting.jpg",
        "sold": 2,
    },
    {
        "product_name": "Madhubani Tussar Silk Dupatta",
        "title": "Madhubani Hand-Painted Tussar Silk Dupatta",
        "short_description": "Tussar silk dupatta painted by hand, motif by motif, over four days.",
        "category": "Handloom & Textiles",
        "craft_type": "Madhubani Painting",
        "material": "Tussar silk",
        "technique": "Hand-painted",
        "region": "Madhubani, Bihar",
        "production_time": "4 days",
        "suggested_price": 4299.0,
        "total_cost": 3100.0,
        "stock_quantity": 3,
        "image": "madhubani-tussar-dupatta.jpg",
        "sold": 1,
    },
    {
        "product_name": "Madhubani Goddess Painting on Canvas",
        "title": "Madhubani Goddess Painting on Canvas",
        "short_description": "A large canvas in the bharni style, filled with colour by hand.",
        "category": "Traditional Paintings",
        "craft_type": "Madhubani Painting",
        "material": "Canvas and acrylic",
        "technique": "Hand-painted",
        "region": "Madhubani, Bihar",
        "production_time": "5 days",
        "suggested_price": 5999.0,
        "total_cost": 4200.0,
        "stock_quantity": 2,
        "image": "madhubani-goddess-painting.jpg",
        "sold": 0,
    },
]

ORDERS = [
    {
        "order_number": "CL-DEMO-1001",
        "buyer_name": "Anitha Raman",
        "buyer_email": "anitha.demo@example.com",
        "buyer_phone": "9000000201",
        "city": "Bengaluru",
        "state": "Karnataka",
        "postal_code": "560001",
        "status": "Delivered",
        "days_ago": 12,
        "lines": [(0, 1)],
    },
    {
        "order_number": "CL-DEMO-1002",
        "buyer_name": "Rahul Mehta",
        "buyer_email": "rahul.demo@example.com",
        "buyer_phone": "9000000202",
        "city": "Pune",
        "state": "Maharashtra",
        "postal_code": "411001",
        "status": "Placed",
        "days_ago": 1,
        "lines": [(1, 1), (0, 1)],
    },
]

BULK_REQUESTS = [
    {
        "reference": "RFQ-DEMO-0001",
        "product_index": 0,
        "buyer_name": "Procurement Officer",
        "organisation": "State Handicrafts Emporium",
        "buyer_type": "Government emporium",
        "buyer_email": "procurement.demo@example.com",
        "buyer_phone": "9000000301",
        "gstin": "10AAACG1234F1Z5",
        "delivery_city": "Patna",
        "delivery_state": "Bihar",
        "quantity": 120,
        "target_price": 1900.0,
        "needed_by": "Before Diwali",
        "message": "For the festive counter. Mithila motifs only, packed flat.",
        "status": "Open",
        "days_ago": 2,
    },
    {
        "reference": "RFQ-DEMO-0002",
        "product_index": 1,
        "buyer_name": "Kavya Nair",
        "organisation": "Anouk Exports",
        "buyer_type": "Exporter",
        "buyer_email": "kavya.demo@example.com",
        "buyer_phone": "9000000302",
        "delivery_city": "Kochi",
        "delivery_state": "Kerala",
        "quantity": 40,
        "target_price": 3600.0,
        "needed_by": "Within six weeks",
        "message": "Sample of two first, then the full lot if the colours hold.",
        "status": "Accepted",
        "quoted_unit_price": 3850.0,
        "quoted_lead_time": "35 days",
        "quote_note": "Includes flat packing. Transport billed at actuals.",
        "days_ago": 9,
    },
]


def remove(db) -> None:
    artisan = db.query(Artisan).filter(Artisan.email == DEMO_EMAIL).first()
    product_ids = []
    if artisan:
        product_ids = [row.id for row in db.query(Product).filter(Product.artisan_id == artisan.id).all()]

    bulk = db.query(BulkRequest).filter(BulkRequest.reference.like("RFQ-DEMO-%")).all()
    for request in bulk:
        db.delete(request)

    orders = db.query(Order).filter(Order.order_number.like("CL-DEMO-%")).all()
    for order in orders:
        db.delete(order)

    if product_ids:
        db.query(OrderItem).filter(OrderItem.product_id.in_(product_ids)).delete(synchronize_session=False)
        db.query(Product).filter(Product.id.in_(product_ids)).delete(synchronize_session=False)
    if artisan:
        db.delete(artisan)

    db.commit()
    print(f"Removed demo data: {len(bulk)} enquiries, {len(orders)} orders, {len(product_ids)} listings.")


def seed(db) -> None:
    artisan = db.query(Artisan).filter(Artisan.email == DEMO_EMAIL).first()
    if not artisan:
        artisan = Artisan(**ARTISAN)
        db.add(artisan)
        db.commit()
        db.refresh(artisan)

    products = []
    for spec in PRODUCTS:
        product = db.query(Product).filter(
            Product.artisan_id == artisan.id,
            Product.product_name == spec["product_name"],
        ).first()
        if not product:
            product = Product(
                artisan_id=artisan.id,
                product_name=spec["product_name"],
                title=spec["title"],
                short_description=spec["short_description"],
                description=(
                    f"{spec['short_description']}\n\n"
                    f"Made in {spec['region']} by {artisan.name}, using {spec['material']} "
                    f"over about {spec['production_time']}."
                ),
                category=spec["category"],
                craft_type=spec["craft_type"],
                material=spec["material"],
                technique=spec["technique"],
                region=spec["region"],
                production_time=spec["production_time"],
                suggested_price=spec["suggested_price"],
                total_cost=spec["total_cost"],
                stock_quantity=spec["stock_quantity"],
                original_image=f"/uploads/catalog/{spec['image']}",
                enhanced_image=f"/uploads/catalog/{spec['image']}",
                status="Published",
            )
            db.add(product)
            db.commit()
            db.refresh(product)
        products.append(product)

    for spec in ORDERS:
        if db.query(Order).filter(Order.order_number == spec["order_number"]).first():
            continue
        placed = datetime.utcnow() - timedelta(days=spec["days_ago"])
        order = Order(
            order_number=spec["order_number"],
            buyer_name=spec["buyer_name"],
            buyer_email=spec["buyer_email"],
            buyer_phone=spec["buyer_phone"],
            address_line1="Demo address",
            city=spec["city"],
            state=spec["state"],
            postal_code=spec["postal_code"],
            payment_method="cod",
            payment_status="Paid on delivery" if spec["status"] == "Delivered" else "Pending on delivery",
            status=spec["status"],
            created_at=placed,
            updated_at=placed,
        )
        db.add(order)
        db.flush()

        subtotal = 0.0
        for index, quantity in spec["lines"]:
            product = products[index]
            line_total = float(product.suggested_price) * quantity
            subtotal += line_total
            db.add(OrderItem(
                order_id=order.id,
                product_id=product.id,
                artisan_id=artisan.id,
                product_name=product.product_name,
                product_image=product.enhanced_image,
                unit_price=float(product.suggested_price),
                quantity=quantity,
                line_total=line_total,
            ))
        order.subtotal = subtotal
        order.total_amount = subtotal
        db.commit()

    for spec in BULK_REQUESTS:
        if db.query(BulkRequest).filter(BulkRequest.reference == spec["reference"]).first():
            continue
        raised = datetime.utcnow() - timedelta(days=spec["days_ago"])
        db.add(BulkRequest(
            reference=spec["reference"],
            product_id=products[spec["product_index"]].id,
            artisan_id=artisan.id,
            buyer_name=spec["buyer_name"],
            organisation=spec["organisation"],
            buyer_type=spec["buyer_type"],
            buyer_email=spec["buyer_email"],
            buyer_phone=spec["buyer_phone"],
            gstin=spec.get("gstin"),
            delivery_city=spec["delivery_city"],
            delivery_state=spec["delivery_state"],
            quantity=spec["quantity"],
            target_price=spec["target_price"],
            needed_by=spec["needed_by"],
            message=spec["message"],
            status=spec["status"],
            quoted_unit_price=spec.get("quoted_unit_price"),
            quoted_lead_time=spec.get("quoted_lead_time"),
            quote_note=spec.get("quote_note"),
            quoted_at=raised + timedelta(days=1) if spec.get("quoted_unit_price") else None,
            created_at=raised,
            updated_at=raised,
        ))
    db.commit()

    print("Demo data ready.")
    print(f"  Seller sign-in : {DEMO_EMAIL}  (role: seller)")
    print(f"  Store          : {ARTISAN['store_name']}, {ARTISAN['region']}")
    print(f"  Listings       : {len(products)}   Orders: {len(ORDERS)}   Bulk enquiries: {len(BULK_REQUESTS)}")
    print("  Everything above is demo data tagged 'craftlink-demo'; remove it with --remove.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed or remove CraftLink demo data.")
    parser.add_argument("--remove", action="store_true", help="delete the demo artisan, listings, orders and enquiries")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if args.remove:
            remove(db)
        else:
            seed(db)
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
