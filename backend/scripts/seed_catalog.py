"""Seed (or remove) the illustrative CraftLink sample catalog.

    python -m backend.scripts.seed_catalog              # download photos + upsert stores and listings
    python -m backend.scripts.seed_catalog --images-only
    python -m backend.scripts.seed_catalog --remove     # delete only the rows this script created

Run from the repository root with the backend virtualenv. Idempotent: re-running updates
existing seeded rows instead of duplicating them.
"""
import argparse
import io
import json
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

from backend.app.config import settings
from backend.app.database.database import Base, SessionLocal, engine
from backend.app.models.artisan import Artisan
from backend.app.models.product import Product
from backend.app.models.order import Order, OrderItem  # noqa: F401 — registers mappers used by relationships
from backend.app.models.order_inquiry import OrderInquiry  # noqa: F401
from backend.scripts.catalog_data import BANNERS, MAKERS, PRODUCTS

SEED_TAG = "craftlink-sample-catalog"
EMAIL_DOMAIN = "sample.craftlink.in"
PRODUCT_DIR = Path(settings.UPLOAD_DIR) / "catalog"
BANNER_DIR = Path(__file__).resolve().parents[2] / "frontend" / "public" / "images" / "storefront"


def pexels_url(photo_id: int, width: int) -> str:
    return f"https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}.jpeg?auto=compress&cs=tinysrgb&w={width}"


def fetch(photo_id: int, width: int) -> Image.Image:
    request = urllib.request.Request(pexels_url(photo_id, width), headers={"User-Agent": "CraftLink catalog seeder"})
    with urllib.request.urlopen(request, timeout=60) as response:
        if not response.headers.get("Content-Type", "").startswith("image/"):
            raise RuntimeError(f"Pexels {photo_id}: not an image")
        return ImageOps.exif_transpose(Image.open(io.BytesIO(response.read()))).convert("RGB")


def crop_to_ratio(image: Image.Image, box, ratio: float) -> Image.Image:
    """Apply the optional fractional crop, then centre-crop to width/height `ratio`."""
    if box:
        w, h = image.size
        image = image.crop((int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)))
    w, h = image.size
    if w / h > ratio:
        new_w = int(h * ratio)
        left = (w - new_w) // 2
        image = image.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / ratio)
        top = (h - new_h) // 2
        image = image.crop((0, top, w, top + new_h))
    return image


def save_images(force: bool = False) -> None:
    PRODUCT_DIR.mkdir(parents=True, exist_ok=True)
    BANNER_DIR.mkdir(parents=True, exist_ok=True)
    for item in PRODUCTS:
        target = PRODUCT_DIR / f"{item['slug']}.jpg"
        if target.exists() and not force:
            continue
        image = crop_to_ratio(fetch(item["photo"], 1600), item.get("crop"), 4 / 5)
        image.thumbnail((960, 1200), Image.LANCZOS)
        image.save(target, "JPEG", quality=86, optimize=True, progressive=True)
        print(f"product  {target.name}  {target.stat().st_size // 1024} KB")
    for name, photo_id in BANNERS.items():
        target = BANNER_DIR / name
        if target.exists() and not force:
            continue
        image = crop_to_ratio(fetch(photo_id, 2000), None, 16 / 9)
        image.thumbnail((1920, 1080), Image.LANCZOS)
        image.save(target, "JPEG", quality=84, optimize=True, progressive=True)
        print(f"banner   {target.name}  {target.stat().st_size // 1024} KB")


def upsert_catalog() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        makers = {}
        for key, (name, store, region, category, language, pincode) in MAKERS.items():
            email = f"{key}@{EMAIL_DOMAIN}"
            artisan = db.query(Artisan).filter(Artisan.email == email).first() or Artisan(email=email)
            artisan.name, artisan.store_name, artisan.region = name, store, region
            artisan.craft_category, artisan.language, artisan.pincode = category, language, pincode
            artisan.kyc_status, artisan.contact = "Verified", SEED_TAG
            db.add(artisan)
            db.flush()
            makers[key] = artisan

        for item in PRODUCTS:
            artisan = makers[item["maker"]]
            image_path = f"/uploads/catalog/{item['slug']}.jpg"
            product = (
                db.query(Product)
                .filter(Product.ai_confidence.like(f'%"{item["slug"]}"%'), Product.ai_confidence.like(f"%{SEED_TAG}%"))
                .first()
            ) or Product()
            material, labour, packaging = item["costs"]
            total = material + labour + packaging
            price = item["price"]
            hi_title, hi_short = item["hi"]
            te_title, te_short = item["te"]
            values = dict(
                artisan_id=artisan.id,
                original_image=image_path,
                enhanced_image=image_path,
                detected_language=artisan.language,
                product_name=item["name"],
                title=item["name"],
                title_hindi=hi_title,
                title_telugu=te_title,
                short_description=item["short"],
                short_description_hindi=hi_short,
                short_description_telugu=te_short,
                description=item["desc"],
                description_hindi=hi_short,
                description_telugu=te_short,
                category=item["category"],
                craft_type=item["craft"],
                material=item["material"],
                color=item["color"],
                technique=item["technique"],
                dimensions=item["dimensions"],
                weight=item["weight"],
                production_time=item["time"],
                region=artisan.region,
                specifications=json.dumps(item["specs"], ensure_ascii=False),
                keywords=json.dumps([item["craft"], item["category"], artisan.region.split(",")[0]], ensure_ascii=False),
                material_cost=material,
                labor_cost=labour,
                packaging_cost=packaging,
                total_cost=total,
                minimum_price=round(total * 1.15),
                recommended_min_price=round(min(price, total * 1.35)),
                recommended_max_price=round(max(price, total * 1.9)),
                suggested_price=price,
                pricing_explanation=json.dumps({"summary": "Price set by the maker from recorded material, labour and packaging costs."}),
                ai_confidence=json.dumps({"source": SEED_TAG, "slug": item["slug"]}),
                status="Published",
                admin_notes="Sample catalog listing",
                stock_quantity=item["stock"],
                is_featured=bool(item.get("featured")),
                badge=item.get("badge"),
                rating=0.0,
                review_count=0,
            )
            for key, value in values.items():
                setattr(product, key, value)
            db.add(product)
        db.commit()
        print(f"Upserted {len(makers)} stores and {len(PRODUCTS)} listings.")
    finally:
        db.close()


def remove_catalog() -> None:
    db = SessionLocal()
    try:
        products = db.query(Product).filter(Product.ai_confidence.like(f"%{SEED_TAG}%")).all()
        for product in products:
            db.delete(product)
        artisans = db.query(Artisan).filter(Artisan.contact == SEED_TAG, Artisan.email.like(f"%@{EMAIL_DOMAIN}")).all()
        for artisan in artisans:
            if not any(p for p in artisan.products if p not in products):
                db.delete(artisan)
        db.commit()
        print(f"Removed {len(products)} listings and {len(artisans)} stores. Image files were left in place.")
    finally:
        db.close()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--images-only", action="store_true")
    parser.add_argument("--remove", action="store_true")
    parser.add_argument("--force-images", action="store_true", help="re-download and re-crop all photos")
    args = parser.parse_args()
    if args.remove:
        remove_catalog()
        return 0
    save_images(force=args.force_images)
    if not args.images_only:
        upsert_catalog()
    return 0


if __name__ == "__main__":
    sys.exit(main())
