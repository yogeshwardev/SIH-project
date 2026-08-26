import sys
import os
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Set Python path to workspace root
BASE_DIR = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(BASE_DIR))

from backend.app.config import settings
from backend.app.database.database import engine, SessionLocal, Base
from backend.app.models.artisan import Artisan
from backend.app.models.product import Product
from backend.app.models.order_inquiry import OrderInquiry
from backend.app.ml.pricing_model import pricing_ml_model
from backend.app.utils.helpers import safe_json_dumps

def create_sample_craft_images():
    """Generates authentic raw and AI studio-enhanced sample images for demo handicrafts."""
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    items = [
        ("banarasi_saree", (180, 40, 50), (218, 165, 32), "Banarasi Silk Saree", "Rich Silk & Gold Zari Weave"),
        ("blue_pottery", (20, 70, 160), (240, 240, 255), "Jaipur Blue Pottery", "Cobalt Glaze & Floral Motif"),
        ("bamboo_basket", (160, 110, 60), (220, 190, 140), "Assam Bamboo Basket", "Natural Handwoven Fiber"),
        ("dhokra_figurine", (140, 100, 40), (200, 170, 90), "Dhokra Brass Figurine", "Lost-Wax Cast Bell Metal"),
        ("channapatna_toy", (220, 60, 60), (245, 180, 40), "Channapatna Wooden Toy", "Natural Lacquer Finish")
    ]

    for item_key, primary_color, secondary_color, title, subtitle in items:
        raw_path = upload_dir / f"{item_key}_raw.jpg"
        enhanced_path = upload_dir / f"{item_key}_studio_enhanced.png"

        # 1. Create Raw "Messy Background" Photo
        raw_img = Image.new("RGB", (600, 600), (145, 130, 120))  # Cluttered floor / bed tone
        draw_raw = ImageDraw.Draw(raw_img)
        # Background clutter patterns
        for i in range(0, 600, 40):
            draw_raw.line([(0, i), (600, i)], fill=(130, 115, 105), width=2)
            draw_raw.line([(i, 0), (i, 600)], fill=(130, 115, 105), width=2)
        # Draw product body
        draw_raw.rounded_rectangle([150, 120, 450, 480], radius=25, fill=primary_color, outline=(80, 50, 30), width=4)
        draw_raw.rectangle([180, 180, 420, 420], fill=secondary_color)
        draw_raw.text((200, 280), title, fill=(20, 20, 20))
        draw_raw.text((200, 310), "(Raw Photo)", fill=(60, 60, 60))
        raw_img.save(raw_path, "JPEG", quality=85)

        # 2. Create AI Studio Enhanced Catalog Image
        studio_img = Image.new("RGBA", (600, 600), (250, 250, 252, 255))
        draw_studio = ImageDraw.Draw(studio_img)
        # Soft studio ground shadow
        draw_studio.ellipse([120, 460, 480, 520], fill=(210, 210, 215, 140))
        # Crisp product cutout with subtle gradient
        draw_studio.rounded_rectangle([150, 110, 450, 470], radius=25, fill=primary_color, outline=(255, 255, 255, 200), width=3)
        draw_studio.rectangle([180, 170, 420, 410], fill=secondary_color)
        draw_studio.text((190, 270), title, fill=(20, 20, 20))
        draw_studio.text((190, 295), "★ AI STUDIO CATALOG ★", fill=(30, 90, 40))
        studio_img.save(enhanced_path, "PNG", quality=95)

def seed_database():
    print("==================================================")
    print("CraftLink AI: Seeding Database & Generating Assets")
    print("==================================================")
    
    # Recreate tables with latest schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Create Artisans
    artisan_varanasi = Artisan(
        name="Sunita Devi",
        language="Hindi",
        region="Varanasi, Uttar Pradesh",
        contact="+91 98765 11001"
    )
    artisan_jaipur = Artisan(
        name="Rameshwar Lal Kumhar",
        language="Hindi",
        region="Jaipur, Rajasthan",
        contact="+91 98765 22002"
    )
    artisan_assam = Artisan(
        name="Ananya Das",
        language="Assamese / Hindi",
        region="Barpeta, Assam",
        contact="+91 98765 33003"
    )
    artisan_bastar = Artisan(
        name="Somnath Ghadwa",
        language="Hindi",
        region="Bastar, Chhattisgarh",
        contact="+91 98765 44004"
    )
    artisan_karnataka = Artisan(
        name="Nagaraj Gowda",
        language="Kannada / English",
        region="Channapatna, Karnataka",
        contact="+91 98765 55005"
    )

    db.add_all([artisan_varanasi, artisan_jaipur, artisan_assam, artisan_bastar, artisan_karnataka])
    db.commit()

    # Generate media assets
    create_sample_craft_images()

    # 2. Seed Products
    p1 = Product(
        artisan_id=artisan_varanasi.id,
        original_image="/uploads/banarasi_saree_raw.jpg",
        enhanced_image="/uploads/banarasi_saree_studio_enhanced.png",
        transcript="यह शुद्ध बनारसी कतान सिल्क साड़ी है। इसमें असली सोने और चांदी की जरी का काम है। इसे हथकरघे पर बुनने में लगभग 6 दिन का समय लगता है। इसकी लंबाई 6.5 मीटर है।",
        detected_language="Hindi",
        product_name="Handwoven Banarasi Katan Silk Saree",
        category="Handloom & Textiles",
        material="Pure Silk & Gold Zari",
        craft_type="Banarasi Silk Weaving",
        color="Royal Crimson & Antique Gold",
        technique="Traditional Handloom Kadwa Weave",
        dimensions="6.5 meters with blouse piece",
        weight="750 grams",
        production_time="6 days",
        region="Varanasi, Uttar Pradesh",
        title="Authentic Handwoven Banarasi Katan Silk Saree | Varanasi Handloom",
        title_hindi="प्रामाणिक हथकरघा बनारसी कतान सिल्क साड़ी | वाराणसी का पारंपरिक शिल्प",
        short_description="Exquisite pure Katan silk saree handwoven with intricate floral gold zari bootis by Varanasi master weavers.",
        short_description_hindi="शुद्ध कतान सिल्क और महीन सुनहरी जरी से हथकरघे पर हस्तनिर्मित बनारसी साड़ी।",
        description="Immerse in timeless Indian royal elegance with this authentic Banarasi Katan Silk Saree. Hand-crafted over 6 intensive days on traditional pit looms in Varanasi.",
        description_hindi="भारतीय वस्त्र परंपरा का उत्कृष्ट उदाहरण। वाराणसी के कुशल बुनकरों द्वारा ६ दिनों के धैर्यपूर्ण परिश्रम से तैयार।",
        specifications=safe_json_dumps([
            "Craft: Banarasi Silk Weaving (GI Certified)",
            "Material: 100% Pure Mulberry Katan Silk & Zari",
            "Length: 6.5 Meters (Includes running blouse piece)",
            "Weaving Technique: Handloom Kadwa Motifs",
            "Origin: Varanasi, Uttar Pradesh",
            "Direct Artisan Fair-Trade Product"
        ]),
        keywords=safe_json_dumps(["banarasi saree", "katan silk", "handloom", "zari work", "wedding saree", "varanasi craft"]),
        material_cost=2200.0,
        labor_cost=4800.0,
        packaging_cost=250.0,
        total_cost=7250.0,
        minimum_price=8555.0,
        recommended_min_price=8900.0,
        recommended_max_price=11500.0,
        suggested_price=9850.0,
        pricing_explanation=safe_json_dumps({
            "production_cost": 7250.0,
            "margin_percentage": 35.8,
            "reference_range": "₹8,900 – ₹11,500",
            "justification": "High labor intensity (48 artisan hours) + pure silk material with 100% GI authenticity certification."
        }),
        ai_confidence=safe_json_dumps({"product_name": "HIGH", "craft_type": "HIGH", "material": "HIGH", "overall": 0.98}),
        status="Published"
    )

    p2 = Product(
        artisan_id=artisan_jaipur.id,
        original_image="/uploads/blue_pottery_raw.jpg",
        enhanced_image="/uploads/blue_pottery_studio_enhanced.png",
        transcript="This is a handcrafted Jaipur Blue Pottery vase made from quartz stone powder and natural blue cobalt glaze. It takes 3 days to mold, paint, and fire in the traditional kiln.",
        detected_language="English",
        product_name="Jaipur Blue Pottery Floral Vase",
        category="Pottery & Ceramics",
        material="Quartz Stone Powder & Glass Glaze",
        craft_type="Jaipur Blue Pottery",
        color="Cobalt Blue & Turquoise",
        technique="Traditional Egyptian Faience Technique",
        dimensions="10 inches height x 4.5 inches diameter",
        weight="680 grams",
        production_time="3 days",
        region="Jaipur, Rajasthan",
        title="Handcrafted Jaipur Blue Pottery Ceramic Vase (10 inch)",
        title_hindi="हस्तनिर्मित जयपुर ब्लू पॉटरी फ्लोरल फूलदान (10 इंच)",
        short_description="Stunning hand-painted Jaipur Blue Pottery vase crafted from quartz powder without clay.",
        short_description_hindi="क्वार्ट्ज पाउडर और नीले कोबाल्ट रंगों से हाथ से चित्रित प्रामाणिक जयपुरी ब्लू पॉटरी फूलदान।",
        description="Authentic Jaipur Blue Pottery decorative vase featuring Persian-inspired floral motifs. Free of natural clay, made with traditional quartz paste.",
        description_hindi="जयपुर की प्रसिद्ध हस्तकला। बिना मिट्टी के केवल क्वार्ट्ज पत्थर और कांच के सम्मिश्रण से तैयार।",
        specifications=safe_json_dumps([
            "Craft: Jaipur Blue Pottery (GI Certified)",
            "Material: Quartz Powder, Glass, Fuller's Earth",
            "Glaze: Cobalt Blue & Natural Mineral Oxides",
            "Height: 10 Inches",
            "Origin: Jaipur, Rajasthan"
        ]),
        keywords=safe_json_dumps(["blue pottery", "jaipur pottery", "ceramic vase", "rajasthan handicraft", "home decor"]),
        material_cost=350.0,
        labor_cost=1400.0,
        packaging_cost=200.0,
        total_cost=1950.0,
        minimum_price=2300.0,
        recommended_min_price=2400.0,
        recommended_max_price=3200.0,
        suggested_price=2750.0,
        pricing_explanation=safe_json_dumps({
            "production_cost": 1950.0,
            "margin_percentage": 41.0,
            "reference_range": "₹2,400 – ₹3,200",
            "justification": "Fragile kiln firing process and intricate hand-painting labor."
        }),
        ai_confidence=safe_json_dumps({"product_name": "HIGH", "craft_type": "HIGH", "material": "HIGH", "overall": 0.96}),
        status="Published"
    )

    p3 = Product(
        artisan_id=artisan_assam.id,
        original_image="/uploads/bamboo_basket_raw.jpg",
        enhanced_image="/uploads/bamboo_basket_studio_enhanced.png",
        transcript="यह प्राकृतिक असमिया बांस से बनी मजबूत और पर्यावरण के अनुकूल स्टोरेज बास्केट है। इसे पारंपरिक हाथ की बुनाई से तैयार किया गया है और 2 दिन का समय लगा है।",
        detected_language="Hindi",
        product_name="Eco-Friendly Assam Handwoven Bamboo Basket",
        category="Cane & Bamboo",
        material="Natural Treated Bamboo & Cane",
        craft_type="Assam Bamboo Craft",
        color="Natural Golden Bamboo Tone",
        technique="Traditional Fine Splint Weaving",
        dimensions="14 inches x 10 inches x 8 inches",
        weight="450 grams",
        production_time="2 days",
        region="Barpeta, Assam",
        title="Eco-Friendly Handwoven Assam Bamboo Storage Basket",
        title_hindi="पर्यावरण के अनुकूल असमिया हस्तनिर्मित बांस की टोकरी",
        short_description="Durable, zero-plastic multi-purpose storage basket handwoven from wild Assam bamboo.",
        short_description_hindi="असम के प्राकृतिक बांस से बनी टिकाऊ, सुंदर और प्लास्टिक-मुक्त मल्टीपर्पस टोकरी।",
        description="Crafted by indigenous artisans of Assam, this bamboo basket blends sustainable utility with rustic elegance.",
        description_hindi="पूर्वोत्तर भारत के पारंपरिक बांस कारीगरों द्वारा हस्तनिर्मित सतत और टिकाऊ टोकरी।",
        specifications=safe_json_dumps([
            "Craft: Assam Cane & Bamboo Weaving",
            "Material: 100% Biodegradable Assam Bamboo",
            "Finish: Natural Non-Toxic Polish",
            "Origin: Barpeta, Assam"
        ]),
        keywords=safe_json_dumps(["bamboo basket", "assam craft", "eco friendly storage", "natural cane", "sustainable living"]),
        material_cost=210.0,
        labor_cost=1150.0,
        packaging_cost=140.0,
        total_cost=1500.0,
        minimum_price=1770.0,
        recommended_min_price=1900.0,
        recommended_max_price=2600.0,
        suggested_price=2250.0,
        pricing_explanation=safe_json_dumps({
            "production_cost": 1500.0,
            "margin_percentage": 33.3,
            "reference_range": "₹1,900 – ₹2,600",
            "justification": "Eco-friendly natural material processing & fine splint hand weaving."
        }),
        ai_confidence=safe_json_dumps({"product_name": "HIGH", "craft_type": "HIGH", "material": "HIGH", "overall": 0.95}),
        status="Published"
    )

    p4 = Product(
        artisan_id=artisan_bastar.id,
        original_image="/uploads/dhokra_figurine_raw.jpg",
        enhanced_image="/uploads/dhokra_figurine_studio_enhanced.png",
        transcript="यह पारंपरिक ढोकरा बेल मेटल की मूर्ति है जिसे प्राचीन लॉस्ट-वैक्स कास्टिंग तकनीक से बनाया गया है। इसमें बस्तर के जनजातीय संगीतकार की आकृति है।",
        detected_language="Hindi",
        product_name="Dhokra Tribal Musician Brass Figurine",
        category="Metal Craft & Bell Metal",
        material="Brass & Bell Metal (Lost-Wax Alloy)",
        craft_type="Dhokra Bell Metal Casting",
        color="Antique Rustic Brass",
        technique="4000-year-old Cire-Perdue Lost-Wax Casting",
        dimensions="8 inches height x 3.5 inches width",
        weight="820 grams",
        production_time="4 days",
        region="Bastar, Chhattisgarh",
        title="Traditional Dhokra Lost-Wax Bell Metal Musician Figurine",
        title_hindi="पारंपरिक ढोकरा लॉस्ट-वैक्स धातु जनजातीय संगीतकार मूर्ति",
        short_description="Authentic tribal brass figurine created using the ancient 4000-year-old lost-wax casting technique.",
        short_description_hindi="बस्तर के आदिवासी शिल्पकारों द्वारा प्राचीन ढलाई कला से निर्मित ढोकरा पीतल शिल्प।",
        description="Trace your connection to the Indus Valley Civilization with this Dhokra metal sculpture depicting a folk musician.",
        description_hindi="4000 वर्ष प्राचीन लॉस्ट-वैक्स तकनीक से ढली हुई बस्तर की अनूठी ढोकरा मूर्ति।",
        specifications=safe_json_dumps([
            "Craft: Bastar Dhokra (GI Certified)",
            "Technique: Lost-Wax Metal Casting",
            "Material: Recycled Brass & Bell Metal",
            "Weight: 820g Solid Metal",
            "Origin: Bastar, Chhattisgarh"
        ]),
        keywords=safe_json_dumps(["dhokra art", "bastar craft", "tribal sculpture", "bell metal", "antique brass", "folk art"]),
        material_cost=480.0,
        labor_cost=1950.0,
        packaging_cost=150.0,
        total_cost=2580.0,
        minimum_price=3045.0,
        recommended_min_price=3200.0,
        recommended_max_price=4400.0,
        suggested_price=3690.0,
        pricing_explanation=safe_json_dumps({
            "production_cost": 2580.0,
            "margin_percentage": 30.1,
            "reference_range": "₹3,200 – ₹4,400",
            "justification": "Ancient non-replicable lost-wax mold craft with high thermal casting labor."
        }),
        ai_confidence=safe_json_dumps({"product_name": "HIGH", "craft_type": "HIGH", "material": "HIGH", "overall": 0.97}),
        status="Published"
    )

    p5 = Product(
        artisan_id=artisan_karnataka.id,
        original_image="/uploads/channapatna_toy_raw.jpg",
        enhanced_image="/uploads/channapatna_toy_studio_enhanced.png",
        transcript="This is an authentic Channapatna wooden stacker toy crafted with Ivory wood and polished with non-toxic natural vegetable dyes. Child-safe and completely handmade.",
        detected_language="English",
        product_name="Channapatna Wooden Rainbow Stacker Toy",
        category="Woodcraft & Carving",
        material="Ivory Wood (Aale Mara) & Vegetable Lacquer",
        craft_type="Channapatna Wooden Toys",
        color="Multi-Color Natural Dyes",
        technique="Traditional Lathe Turning & Lacquer Buffing",
        dimensions="7 inches height x 4 inches base",
        weight="380 grams",
        production_time="1 day",
        region="Channapatna, Karnataka",
        title="Eco-Friendly Channapatna Wooden Stacking Toy (GI Certified)",
        title_hindi="पर्यावरण-अनुकूल चन्नपटना लकड़ी का खिलौना (GI प्रमाणित)",
        short_description="100% child-safe, non-toxic wooden stacker toy crafted in Karnataka's Gombegala Ooru (Toy Town).",
        short_description_hindi="कर्नाटक के चन्नपटना के कारीगरों द्वारा प्राकृतिक वनस्पति रंगों से बना बच्चों के लिए सुरक्षित खिलौना।",
        description="Hand-turned on traditional wood lathes using seasoned soft ivory wood and polished to a brilliant gleam with natural plant resins and turmeric/kumkum dyes.",
        description_hindi="प्राकृतिक लकड़ी और सुरक्षित रंगों से निर्मित चन्नपटना का प्रसिद्ध पारंपरिक खिलौना।",
        specifications=safe_json_dumps([
            "Craft: Channapatna Toys (GI Certified)",
            "Material: Wrightia Tinctoria (Ivory Wood)",
            "Dyes: 100% Natural Organic Vegetable Lacquer",
            "Safety: Non-toxic, Lead-free, Child Safe",
            "Origin: Ramanagara, Karnataka"
        ]),
        keywords=safe_json_dumps(["channapatna toys", "wooden toys", "montessori toy", "natural wooden stacker", "karnataka craft"]),
        material_cost=160.0,
        labor_cost=650.0,
        packaging_cost=90.0,
        total_cost=900.0,
        minimum_price=1060.0,
        recommended_min_price=1150.0,
        recommended_max_price=1650.0,
        suggested_price=1350.0,
        pricing_explanation=safe_json_dumps({
            "production_cost": 900.0,
            "margin_percentage": 33.3,
            "reference_range": "₹1,150 – ₹1,650",
            "justification": "GI certified non-toxic toy safety and artisanal lathe craft."
        }),
        ai_confidence=safe_json_dumps({"product_name": "HIGH", "craft_type": "HIGH", "material": "HIGH", "overall": 0.98}),
        status="Published"
    )

    db.add_all([p1, p2, p3, p4, p5])
    db.commit()

    print(f"Successfully seeded {db.query(Artisan).count()} artisans and {db.query(Product).count()} authentic craft products!")
    db.close()

if __name__ == "__main__":
    seed_database()
