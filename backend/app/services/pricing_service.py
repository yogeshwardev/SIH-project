import re
import math
from difflib import SequenceMatcher
import pandas as pd
from typing import Dict, Any, List
from backend.app.config import settings
from backend.app.ml.pricing_model import pricing_ml_model
from backend.app.schemas.product import (
    PriceCalculateRequest, 
    PriceRecommendationResponse, 
    PriceBreakdownItem
)

class PricingService:
    def __init__(self):
        self.craft_data_path = settings.DATA_DIR / "crafts.csv"
        self.category_data_path = settings.DATA_DIR / "categories.csv"
        self._load_craft_metadata()

    def _load_craft_metadata(self):
        """Load craft complexity factors and category margin benchmarks."""
        self.crafts_df = None
        self.categories_df = None
        if self.craft_data_path.exists():
            self.crafts_df = pd.read_csv(self.craft_data_path)
        if self.category_data_path.exists():
            self.categories_df = pd.read_csv(self.category_data_path)

    def calculate_price_recommendation(self, req: PriceCalculateRequest) -> PriceRecommendationResponse:
        """
        Hybrid Smart Pricing Engine:
        1. Cost-Based Production Economics
        2. Craft Complexity & Artisan Fair-Trade Margin Adjustment
        3. Machine Learning Reference Market Pricing
        4. Calculation of Recommended Range & Suggested Price
        5. Full Transparent Price Breakdown
        """
        material_cost = float(req.material_cost)
        labor_cost = float(req.labor_cost)
        packaging_cost = float(req.packaging_cost)

        # 1. Total Direct Production Cost
        total_cost = material_cost + labor_cost + packaging_cost
        if total_cost <= 0:
            total_cost = 500.0  # Fallback minimum baseline

        # 2. Parse Production Time in Hours
        prod_hours = self._parse_production_hours(req.production_time)

        # 3. Craft Complexity & Category Benchmark Margins
        base_margin = 0.30  # Default 30% sustainable margin
        craft_complexity_multiplier = 1.05

        if req.craft_type:
            craft_lower = req.craft_type.lower()
            if any(k in craft_lower for k in ["silk", "pashmina", "filigree", "tanjore", "dhokra"]):
                craft_complexity_multiplier = 1.25
                base_margin = 0.35
            elif any(k in craft_lower for k in ["madhubani", "carving", "chanderi", "blue pottery"]):
                craft_complexity_multiplier = 1.15
                base_margin = 0.32

        # 4. Minimum Sustainable Price (Guarantees no below-cost distress selling)
        minimum_sustainable_price = total_cost * 1.18  # 18% minimum survival margin

        # 5. Cost-Based Fair Trade Price
        cost_based_price = total_cost * (1.0 + base_margin) * craft_complexity_multiplier

        # 6. ML Model Market Valuation
        try:
            ml_predicted_price = pricing_ml_model.predict_market_price(
                category=req.category or "Handloom & Textiles",
                craft_type=req.craft_type or "Handcrafted",
                material=req.material or "Natural",
                production_hours=prod_hours,
                material_cost=material_cost,
                labor_cost=labor_cost,
                packaging_cost=packaging_cost
            )
        except Exception:
            ml_predicted_price = cost_based_price

        # 7. Blend Cost-Based and ML Market Intelligence (60% Cost economics, 40% Market benchmarking)
        blended_target = (cost_based_price * 0.60) + (ml_predicted_price * 0.40)
        blended_target = max(blended_target, minimum_sustainable_price)

        # 8. Calculate Range & Suggested Price
        recommended_min = math.floor((blended_target * 0.90) / 50.0) * 50.0
        recommended_max = math.ceil((blended_target * 1.15) / 50.0) * 50.0
        
        # Psychological e-commerce price rounding (e.g. ₹2,499 or ₹990)
        suggested_price = self._round_to_retail_price(blended_target)
        if suggested_price < minimum_sustainable_price:
            suggested_price = math.ceil(minimum_sustainable_price / 50.0) * 50.0 - 1.0

        # 9. Profit Margin Calculation
        artisan_profit = suggested_price - total_cost
        profit_margin_pct = round((artisan_profit / suggested_price) * 100.0, 1)

        # 10. Generate Transparent Breakdown Items
        breakdown_items = [
            PriceBreakdownItem(
                label="Raw Material Cost",
                amount=material_cost,
                percentage=round((material_cost / suggested_price) * 100.0, 1),
                description="Direct cost of genuine yarn, natural clay, brass, dyes, or wood."
            ),
            PriceBreakdownItem(
                label="Artisan Skilled Labor",
                amount=labor_cost,
                percentage=round((labor_cost / suggested_price) * 100.0, 1),
                description=f"Compensates {prod_hours:.0f} hours of manual craft technique at fair hourly wage."
            ),
            PriceBreakdownItem(
                label="Protective Packaging",
                amount=packaging_cost,
                percentage=round((packaging_cost / suggested_price) * 100.0, 1),
                description="Eco-friendly cushioning, tags, and shipping-ready box."
            ),
            PriceBreakdownItem(
                label="Artisan Sustainable Profit & Craft Premium",
                amount=artisan_profit,
                percentage=profit_margin_pct,
                description="Fair-trade surplus rewarding heritage technique, tool wear, and business growth."
            )
        ]

        market_ref_str = f"₹{recommended_min:,.0f} – ₹{recommended_max:,.0f}"

        explanation = (
            f"Production cost is ₹{total_cost:,.0f} (Material: ₹{material_cost:,.0f}, "
            f"Labor: ₹{labor_cost:,.0f}, Packaging: ₹{packaging_cost:,.0f}). "
            f"Based on {req.craft_type} complexity and reference market data for {req.category}, "
            f"a sustainable margin of {profit_margin_pct}% yields a recommended price range of "
            f"{market_ref_str}, with an optimal suggested listing price of ₹{suggested_price:,.0f}."
        )

        confidence = self._benchmark_confidence(
            req.category or "", req.craft_type or "", req.material or "",
            prod_hours, total_cost,
        )
        assumptions = ["One artisan working 8 productive hours per stated working day."]
        if packaging_cost == 0:
            assumptions.append("Packaging cost was confirmed as zero; shipping charges are excluded.")
        assumptions.append("Recommendation is for one retail unit and excludes marketplace tax or delivery fees.")

        return PriceRecommendationResponse(
            total_cost=round(total_cost, 2),
            minimum_sustainable_price=round(minimum_sustainable_price, 2),
            recommended_min_price=round(recommended_min, 2),
            recommended_max_price=round(recommended_max, 2),
            suggested_price=round(suggested_price, 2),
            profit_margin_percentage=profit_margin_pct,
            market_reference_range=market_ref_str,
            price_breakdown=breakdown_items,
            explanation=explanation,
            pricing_model_type="Hybrid Ensemble ML + Fair-Trade Cost Model",
            pricing_confidence_score=confidence["score"],
            confidence_level=confidence["level"],
            benchmark_sample_count=confidence["sample_count"],
            benchmark_similarity_score=confidence["similarity"],
            requires_human_review=confidence["requires_review"],
            assumptions=assumptions,
        )

    def _benchmark_confidence(
        self, category: str, craft_type: str, material: str,
        production_hours: float, total_cost: float,
    ) -> Dict[str, Any]:
        """Estimate benchmark coverage; never disguise extrapolation as certainty."""
        try:
            frame = pricing_ml_model.reference_data
            if frame is None or frame.empty:
                return {"score": 0.35, "level": "LOW", "sample_count": 0, "similarity": 0.0, "requires_review": True}

            category_text = category.strip().lower()
            same_category = frame[frame["category"].astype(str).str.lower() == category_text]
            candidates = same_category if not same_category.empty else frame
            craft_similarity = max(
                SequenceMatcher(None, craft_type.lower(), str(value).lower()).ratio()
                for value in candidates["craft_type"].dropna()
            ) if len(candidates) else 0.0
            material_similarity = max(
                SequenceMatcher(None, material.lower(), str(value).lower()).ratio()
                for value in candidates["material"].dropna()
            ) if len(candidates) else 0.0

            cost_min = float(candidates["total_production_cost"].quantile(0.05))
            cost_max = float(candidates["total_production_cost"].quantile(0.95))
            day_value = production_hours / 8.0
            day_min = float(candidates["production_time_days"].quantile(0.05))
            day_max = float(candidates["production_time_days"].quantile(0.95))
            category_coverage = 1.0 if not same_category.empty else 0.0
            cost_coverage = 1.0 if cost_min <= total_cost <= cost_max else 0.35
            time_coverage = 1.0 if day_min <= day_value <= day_max else 0.35
            score = min(0.98, 0.35 + 0.15 * category_coverage + 0.20 * craft_similarity + 0.10 * material_similarity + 0.10 * cost_coverage + 0.10 * time_coverage)
            score = round(score, 2)
            level = "HIGH" if score >= 0.85 else "MEDIUM" if score >= 0.70 else "LOW"
            return {
                "score": score,
                "level": level,
                "sample_count": int(len(same_category)),
                "similarity": round(craft_similarity, 2),
                "requires_review": score < 0.70,
            }
        except Exception:
            return {"score": 0.35, "level": "LOW", "sample_count": 0, "similarity": 0.0, "requires_review": True}

    def _parse_production_hours(self, time_str: str) -> float:
        """Parse human readable production duration into approximate hours."""
        if not time_str:
            return 8.0
        time_lower = time_str.lower()
        
        match_days = re.search(r'(\d+)\s*(days?|दिन)', time_lower)
        if match_days:
            return float(match_days.group(1)) * 8.0  # 8 working hours per artisan day

        match_hours = re.search(r'(\d+)\s*(hours?|घंटे)', time_lower)
        if match_hours:
            return float(match_hours.group(1))

        match_weeks = re.search(r'(\d+)\s*(weeks?|सप्ताह)', time_lower)
        if match_weeks:
            return float(match_weeks.group(1)) * 48.0

        return 12.0

    def _round_to_retail_price(self, price: float) -> float:
        """Round to appealing retail endings like ₹499, ₹999, ₹2,499."""
        if price < 500:
            return math.ceil(price / 50.0) * 50.0 - 1.0
        elif price < 3000:
            base = round(price / 100.0) * 100.0
            return max(price, base) - 1.0 if base > price else base + 99.0
        else:
            base = round(price / 500.0) * 500.0
            return max(price, base) - 1.0 if base > price else base + 499.0

pricing_service = PricingService()
