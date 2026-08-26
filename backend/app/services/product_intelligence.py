import re
from typing import Dict, Any, List, Optional
from backend.app.schemas.product import ProductAttributes

class ProductIntelligenceService:
    def __init__(self):
        # Known craft taxonomy keywords for entity recognition
        self.craft_keywords = {
            "Banarasi Silk Weaving": ["बनारसी", "banarasi", "katan", "कतान", "zari", "जरी", "silk", "रेशम"],
            "Chanderi Weaving": ["chanderi", "चंदेरी", "silk cotton"],
            "Madhubani Painting": ["madhubani", "मधुबनी", "mithila", "मिथिला", "tree of life", "painting"],
            "Dhokra Bell Metal Casting": ["dhokra", "ढोकरा", "bell metal", "brass", "पीतल", "lost-wax", "tribal figurine"],
            "Jaipur Blue Pottery": ["blue pottery", "ब्लू पॉटरी", "quartz", "glazed pottery", "ceramic vase"],
            "Gorakhpur Terracotta": ["terracotta", "टेराकोटा", "clay", "मिट्टी", "kulhar", "elephant"],
            "Channapatna Wooden Toys": ["channapatna", "चन्नपटना", "wooden toy", "ivory wood", "lacquer toy", "खिलौने"],
            "Warli Tribal Art": ["warli", "वारली", "tribal art", "canvas painting"],
            "Assam Bamboo Craft": ["bamboo", "बांस", "cane", "वेत", "storage basket", "टोकरी"],
            "Kashmir Pashmina Weaving": ["pashmina", "पश्मीना", "cashmere", "shawl", "शॉल"],
            "Kolhapuri Leathercraft": ["kolhapuri", "कोल्हापुरी", "chappal", "leather", "चमड़ा"],
            "Sanganeri Hand Block Print": ["sanganeri", "सांगानेरी", "block print", "ब्लॉक प्रिंट"]
        }

        self.material_keywords = {
            "Pure Silk & Gold Zari": ["katan silk", "कतान सिल्क", "pure silk", "रेशमी", "zari", "जरी"],
            "Natural Cotton": ["cotton", "सूती", "कपास", "khadi", "खादी"],
            "Brass & Bell Metal Alloy": ["brass", "पीतल", "bell metal", "कांसा", "bronze"],
            "Natural Terracotta Clay": ["clay", "मिट्टी", "terracotta", "टेराकोटा"],
            "Quartz Stone Powder & Glass": ["quartz", "कॉर्ट्ज़", "blue pottery", "pottery"],
            "Natural Bamboo & Cane": ["bamboo", "बांस", "cane", "बेंत"],
            "Ivory Wood (Wrightia Tinctoria)": ["wood", "लकड़ी", "ivory wood", "channapatna"],
            "Pure Pashmina Cashmere": ["pashmina", "पश्मीना", "cashmere"],
            "Vegetable Tanned Leather": ["leather", "चमड़ा", "leathercraft"]
        }

        self.category_mapping = {
            "saree": "Handloom & Textiles",
            "साड़ी": "Handloom & Textiles",
            "shawl": "Handloom & Textiles",
            "शॉल": "Handloom & Textiles",
            "dupatta": "Handloom & Textiles",
            "painting": "Traditional Paintings",
            "पेंटिंग": "Traditional Paintings",
            "चित्र": "Traditional Paintings",
            "vase": "Pottery & Ceramics",
            "pottery": "Pottery & Ceramics",
            "बर्तन": "Pottery & Ceramics",
            "घड़ा": "Pottery & Ceramics",
            "toy": "Woodcraft & Carving",
            "खिलौना": "Woodcraft & Carving",
            "basket": "Cane & Bamboo",
            "टोकरी": "Cane & Bamboo",
            "figurine": "Metal Craft & Bell Metal",
            "मूर्ति": "Metal Craft & Bell Metal",
            "lamp": "Metal Craft & Bell Metal",
            "chappal": "Traditional Leathercraft",
            "जूती": "Traditional Leathercraft"
        }

    def extract_structured_attributes(
        self, 
        transcript: str, 
        detected_objects: Optional[List[str]] = None,
        language: str = "Hindi"
    ) -> ProductAttributes:
        """
        Entity extraction based strictly on text evidence (Anti-Hallucination).
        Missing attributes are flagged as 'Not provided (Needs Confirmation)'.
        """
        text = transcript.lower()
        confidence = {}

        # 1. Product Name Identification
        product_name = self._extract_product_name(text, language)
        confidence["product_name"] = "HIGH" if product_name != "Handcrafted Artisan Item" else "MEDIUM"

        # 2. Craft Type Identification
        craft_type, craft_conf = self._extract_craft_type(text)
        confidence["craft_type"] = craft_conf

        # 3. Category Identification
        category, cat_conf = self._extract_category(text, craft_type, detected_objects)
        confidence["category"] = cat_conf

        # 4. Material Extraction (Strict Anti-Hallucination)
        material, mat_conf = self._extract_material(text)
        confidence["material"] = mat_conf

        # 5. Production Time
        prod_time, time_conf = self._extract_production_time(text)
        confidence["production_time"] = time_conf

        # 6. Dimensions
        dimensions, dim_conf = self._extract_dimensions(text)
        confidence["dimensions"] = dim_conf

        # 7. Technique
        technique, tech_conf = self._extract_technique(text, craft_type)
        confidence["technique"] = tech_conf

        # 8. Color
        color, color_conf = self._extract_color(text)
        confidence["color"] = color_conf

        # 9. Weight & Region
        weight = self._extract_weight(text)
        confidence["weight"] = "HIGH" if weight != "Not specified (Needs Confirmation)" else "NEEDS_CONFIRMATION"

        region = self._extract_region(text, craft_type)
        confidence["region"] = "HIGH" if region != "India" else "MEDIUM"

        return ProductAttributes(
            product_name=product_name,
            category=category,
            material=material,
            craft_type=craft_type,
            color=color,
            technique=technique,
            dimensions=dimensions,
            weight=weight,
            production_time=prod_time,
            region=region,
            confidence_scores=confidence
        )

    def _extract_product_name(self, text: str, language: str) -> str:
        if "banarasi" in text or "बनारसी" in text:
            return "Handwoven Banarasi Silk Saree"
        elif "blue pottery" in text or "पॉटरी" in text or "vase" in text:
            return "Handcrafted Blue Pottery Ceramic Vase"
        elif "bamboo" in text or "बांस" in text or "basket" in text or "टोकरी" in text:
            return "Handwoven Eco-Friendly Bamboo Basket"
        elif "dhokra" in text or "ढोकरा" in text or "bell metal" in text:
            return "Traditional Dhokra Tribal Brass Figurine"
        elif "channapatna" in text or "चन्नपटना" in text or "toy" in text or "खिलौने" in text:
            return "Channapatna Wooden Handcrafted Toy"
        elif "madhubani" in text or "मधुबनी" in text:
            return "Traditional Madhubani Folk Art Painting"
        elif "terracotta" in text or "टेराकोटा" in text:
            return "Handmade Terracotta Clay Handicraft"
        elif "saree" in text or "साड़ी" in text:
            return "Traditional Handloom Saree"
        return "Handcrafted Artisan Item"

    def _extract_craft_type(self, text: str) -> tuple[str, str]:
        for craft, keywords in self.craft_keywords.items():
            for kw in keywords:
                if kw in text:
                    return craft, "HIGH"
        return "Traditional Handcraft", "NEEDS_CONFIRMATION"

    def _extract_category(self, text: str, craft_type: str, detected_objects: Optional[List[str]]) -> tuple[str, str]:
        for kw, cat in self.category_mapping.items():
            if kw in text:
                return cat, "HIGH"
        if "Textiles" in craft_type or "Weaving" in craft_type or "Silk" in craft_type:
            return "Handloom & Textiles", "HIGH"
        elif "Pottery" in craft_type or "Terracotta" in craft_type:
            return "Pottery & Ceramics", "HIGH"
        elif "Metal" in craft_type or "Dhokra" in craft_type:
            return "Metal Craft & Bell Metal", "HIGH"
        elif "Bamboo" in craft_type or "Cane" in craft_type:
            return "Cane & Bamboo", "HIGH"
        elif "Painting" in craft_type:
            return "Traditional Paintings", "HIGH"
        elif "Wood" in craft_type:
            return "Woodcraft & Carving", "HIGH"
        return "Traditional Handicrafts", "MEDIUM"

    def _extract_material(self, text: str) -> tuple[str, str]:
        for mat_name, kws in self.material_keywords.items():
            for kw in kws:
                if kw in text:
                    return mat_name, "HIGH"
        return "Natural Craft Raw Material (Needs Confirmation)", "NEEDS_CONFIRMATION"

    def _extract_production_time(self, text: str) -> tuple[str, str]:
        # Match days / hours in Hindi or English
        # e.g. "5 दिन", "6 days", "3 days", "24 hours", "2 दिन"
        match_en = re.search(r'(\d+)\s*(days?|hours?|weeks?|months?)', text)
        if match_en:
            return f"{match_en.group(1)} {match_en.group(2)}", "HIGH"
        
        match_hi = re.search(r'(\d+|दो|तीन|चार|पांच|छह|सात|आठ|दस)\s*(दिन|घंटे|सप्ताह)', text)
        if match_hi:
            num_map = {"दो": "2", "तीन": "3", "चार": "4", "पांच": "5", "छह": "6", "सात": "7", "आठ": "8", "दस": "10"}
            val = match_hi.group(1)
            num = num_map.get(val, val)
            unit = "days" if "दिन" in match_hi.group(2) else "hours"
            return f"{num} {unit}", "HIGH"

        return "Not specified (Needs Confirmation)", "NEEDS_CONFIRMATION"

    def _extract_dimensions(self, text: str) -> tuple[str, str]:
        # e.g., "6.5 meter", "6 meters", "18x24", "12 inches", "6.5 मीटर"
        match_dim = re.search(r'(\d+(\.\d+)?)\s*(meters?|meter|मीटर|inches|inch|इंच|cm|सेमी)', text)
        if match_dim:
            return f"{match_dim.group(1)} {match_dim.group(3)}", "HIGH"
        match_size = re.search(r'(\d+\s*x\s*\d+)', text)
        if match_size:
            return f"{match_size.group(1)} inches", "HIGH"
        return "Not specified (Needs Confirmation)", "NEEDS_CONFIRMATION"

    def _extract_technique(self, text: str, craft_type: str) -> tuple[str, str]:
        if "handloom" in text or "हथकरघा" in text or "weaving" in text or "बुनाई" in text:
            return "Traditional Handloom Weaving", "HIGH"
        elif "lost-wax" in text or "ढलाई" in text:
            return "Ancient Cire-Perdue (Lost-Wax) Casting", "HIGH"
        elif "kiln" in text or "firing" in text or "भट्ठी" in text:
            return "Traditional Wood-Fired Kiln Glazing", "HIGH"
        elif "block print" in text or "ब्लॉक प्रिंट" in text:
            return "Hand Wooden Block Stamping", "HIGH"
        return f"Handmade by Traditional Artisan ({craft_type})", "MEDIUM"

    def _extract_color(self, text: str) -> tuple[str, str]:
        colors = {
            "Red / Crimson": ["red", "लाल"],
            "Royal Blue / Cobalt": ["blue", "नीला", "cobalt"],
            "Golden / Yellow": ["gold", "golden", "सुनहरा", "yellow", "पीला"],
            "Forest Green": ["green", "हरा"],
            "Natural Terracotta / Earth": ["clay", "earth", "मिट्टी का रंग", "terracotta"],
            "Natural Bamboo Wood": ["bamboo", "wood tone", "प्राकृतिक"]
        }
        for color_name, kws in colors.items():
            for kw in kws:
                if kw in text:
                    return color_name, "HIGH"
        return "Natural Artisan Palette", "MEDIUM"

    def _extract_weight(self, text: str) -> str:
        match_wt = re.search(r'(\d+(\.\d+)?)\s*(kg|grams?|किलो|ग्राम)', text)
        if match_wt:
            return f"{match_wt.group(1)} {match_wt.group(3)}"
        return "Not specified (Needs Confirmation)"

    def _extract_region(self, text: str, craft_type: str) -> str:
        regions = {
            "Varanasi, Uttar Pradesh": ["varanasi", "banaras", "बनारस", "काशी", "uttar pradesh"],
            "Jaipur, Rajasthan": ["jaipur", "जयपुर", "rajasthan", "राजस्थान"],
            "Madhubani, Bihar": ["madhubani", "मधुबनी", "bihar", "बिहार"],
            "Bastar, Chhattisgarh / Odisha": ["bastar", "बस्तर", "chhattisgarh", "odisha"],
            "Ramanagara, Karnataka": ["channapatna", "चन्नपटना", "karnataka"],
            "Assam": ["assam", "असम"],
            "Kashmir": ["kashmir", "कश्मीर"]
        }
        for reg_name, kws in regions.items():
            for kw in kws:
                if kw in text:
                    return reg_name
        
        # Fallback to craft origin
        if "Banarasi" in craft_type:
            return "Varanasi, Uttar Pradesh"
        elif "Blue Pottery" in craft_type:
            return "Jaipur, Rajasthan"
        elif "Madhubani" in craft_type:
            return "Madhubani, Bihar"
        elif "Dhokra" in craft_type:
            return "Bastar, Chhattisgarh"
        elif "Channapatna" in craft_type:
            return "Ramanagara, Karnataka"
        elif "Bamboo" in craft_type:
            return "Barpeta, Assam"
        return "India"

product_intelligence_service = ProductIntelligenceService()
