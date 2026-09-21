"""Measure a piece from its photo and the artisan's own description.

The price an artisan can ask for depends on things they rarely put into words:
how much detail is worked into the piece, how many colours it carries, how big
it is in the frame, whether they used a premium material. This service reads
those signals off the enhanced photo and the spoken description, and turns them
into a bounded, explainable adjustment to the recommended price.

Every factor is reported with the number behind it, so the artisan sees exactly
why the suggestion moved — nothing here is a hidden coefficient.
"""
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

import cv2
import numpy as np

# The adjustment can never swing a price wildly: the artisan's own costs stay
# the dominant term in the recommendation.
MIN_MULTIPLIER = 0.92
MAX_MULTIPLIER = 1.28

# Materials and techniques that carry a real, documented price premium in
# Indian handicraft markets. Matched against the artisan's own words.
PREMIUM_TERMS = {
    "silk": 0.06, "pattu": 0.06, "zari": 0.05, "kanchipuram": 0.06, "banarasi": 0.06,
    "pashmina": 0.08, "pure": 0.03, "gold": 0.04, "silver": 0.05, "brass": 0.03,
    "bronze": 0.05, "dhokra": 0.05, "bell metal": 0.05, "teak": 0.04, "rosewood": 0.05,
    "sandalwood": 0.07, "marble": 0.04, "natural dye": 0.04, "vegetable dye": 0.04,
    "hand-painted": 0.04, "hand painted": 0.04, "hand-carved": 0.05, "hand carved": 0.05,
    "handwoven": 0.04, "hand woven": 0.04, "inlay": 0.05, "filigree": 0.06,
    "gi ": 0.05, "geographical indication": 0.05, "organic": 0.03,
}

# Words that describe scale. A large piece takes more material and more time.
SIZE_TERMS = ("large", "big", "full size", "life size", "wall", "floor", "king size", "6 feet", "5 feet")

MATERIAL_WORDS = ("silk", "cotton", "clay", "terracotta", "brass", "bronze", "wood", "bamboo",
                  "cane", "jute", "wool", "leather", "stone", "marble", "paper", "metal")


class CraftSignalService:
    """Vision + language signals that feed the pricing assistant."""

    def analyse(
        self,
        image_path: Optional[str] = None,
        description: str = "",
        craft_type: str = "",
        material: str = "",
        dimensions: str = "",
    ) -> Dict[str, Any]:
        visual = self._analyse_image(image_path)
        textual = self._analyse_text(
            " ".join(filter(None, [description, craft_type, material, dimensions])),
            description or "",
        )

        factors: List[Dict[str, Any]] = []
        multiplier = 1.0

        for factor in visual["factors"] + textual["factors"]:
            multiplier += factor["impact"]
            factors.append(factor)

        multiplier = max(MIN_MULTIPLIER, min(MAX_MULTIPLIER, multiplier))

        return {
            "multiplier": round(multiplier, 4),
            "factors": factors,
            "image_analysed": visual["analysed"],
            "metrics": {**visual["metrics"], **textual["metrics"]},
        }

    # ── Photo ────────────────────────────────────────────────────────────────

    def _analyse_image(self, image_path: Optional[str]) -> Dict[str, Any]:
        empty = {"analysed": False, "factors": [], "metrics": {}}
        if not image_path:
            return empty

        path = Path(image_path)
        if not path.exists():
            return empty

        image = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
        if image is None or image.size == 0:
            return empty

        # Studio photos are RGBA on a flat background; use the alpha channel as
        # the subject mask when it is there, otherwise take the whole frame.
        has_cutout = image.ndim == 3 and image.shape[2] == 4
        if has_cutout:
            alpha = image[:, :, 3]
            bgr = image[:, :, :3]
            mask = alpha >= 128
        else:
            bgr = image if image.ndim == 3 else cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
            mask = np.ones(bgr.shape[:2], dtype=bool)

        if mask.sum() < 64:
            mask = np.ones(bgr.shape[:2], dtype=bool)
            has_cutout = False

        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)

        # How much worked detail is on the surface: carving, weave, painted line.
        edges = cv2.Canny(gray, 80, 180) > 0
        detail_density = float(edges[mask].mean()) if mask.any() else 0.0

        # How much of the frame the piece fills — a proxy for physical scale.
        subject_ratio = float(mask.mean())

        # Colour work: distinct hues across the subject, and how saturated it is.
        hues = hsv[:, :, 0][mask]
        saturation = float(hsv[:, :, 1][mask].mean() / 255.0) if mask.any() else 0.0
        hue_spread = float(np.histogram(hues, bins=18, range=(0, 180))[0].astype(bool).sum()) if hues.size else 0.0

        factors: List[Dict[str, Any]] = []

        if detail_density >= 0.14:
            factors.append(self._factor(
                "Intricate surface detail",
                f"{detail_density * 100:.0f}% of the piece shows worked detail",
                0.10,
            ))
        elif detail_density >= 0.075:
            factors.append(self._factor(
                "Visible craft detail",
                f"{detail_density * 100:.0f}% of the piece shows worked detail",
                0.05,
            ))

        if hue_spread >= 9 and saturation >= 0.35:
            factors.append(self._factor(
                "Rich colour work",
                f"{int(hue_spread)} distinct colour tones in the photo",
                0.05,
            ))
        elif hue_spread >= 6:
            factors.append(self._factor(
                "Multiple colours",
                f"{int(hue_spread)} colour tones in the photo",
                0.02,
            ))

        # Only meaningful against a removed background: otherwise the "subject"
        # is simply the whole photo.
        if has_cutout and subject_ratio >= 0.55:
            factors.append(self._factor(
                "Large piece",
                f"the piece fills {subject_ratio * 100:.0f}% of the frame",
                0.04,
            ))

        return {
            "analysed": True,
            "factors": factors,
            "metrics": {
                "detail_density": round(detail_density, 4),
                "subject_ratio": round(subject_ratio, 4) if has_cutout else None,
                "colour_tones": int(hue_spread),
                "saturation": round(saturation, 3),
            },
        }

    # ── Words ────────────────────────────────────────────────────────────────

    def _analyse_text(self, text: str, description: str = "") -> Dict[str, Any]:
        lowered = (text or "").lower()
        factors: List[Dict[str, Any]] = []

        matched = [term for term in PREMIUM_TERMS if term in lowered]
        if matched:
            # Two strongest matches only: a description that lists every word in
            # the glossary should not compound into a runaway premium.
            top = sorted(matched, key=lambda term: PREMIUM_TERMS[term], reverse=True)[:2]
            impact = sum(PREMIUM_TERMS[term] for term in top)
            factors.append(self._factor(
                "Premium material or technique",
                "you mentioned " + ", ".join(term.strip() for term in top),
                impact,
            ))

        if any(term in lowered for term in SIZE_TERMS):
            factors.append(self._factor("Larger format", "your description mentions a large piece", 0.03))

        # Counted on what the artisan actually said, not on the attribute words
        # the app filled in around it.
        words = len(re.findall(r"\w+", description.lower()))
        if description.strip() and words < 8:
            factors.append(self._factor(
                "Short description",
                "buyers pay more when they know the story; add a line or two",
                -0.03,
            ))

        return {
            "factors": factors,
            "metrics": {
                "description_words": words,
                "premium_terms": matched[:5],
                "materials_named": [word for word in MATERIAL_WORDS if word in lowered][:5],
            },
        }

    @staticmethod
    def _factor(label: str, detail: str, impact: float) -> Dict[str, Any]:
        return {
            "label": label,
            "detail": detail,
            "impact": round(impact, 4),
            "impact_percentage": round(impact * 100, 1),
        }


craft_signal_service = CraftSignalService()
