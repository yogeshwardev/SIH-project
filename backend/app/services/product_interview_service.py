import re
from typing import Any, Dict, List, Optional

from backend.app.services.product_intelligence import product_intelligence_service


class ProductInterviewService:
    """Evidence-gated, multilingual product discovery interview.

    The service is deliberately stateless: the client sends confirmed facts from the
    previous turn. This makes conversations resumable and prevents cross-user data
    leakage while still supporting an unlimited number of voice turns.
    """

    QUESTION_ORDER = [
        "product_identity", "material", "technique", "production_time",
        "material_cost", "labor_cost", "packaging_cost", "dimensions", "region",
    ]
    PRICING_REQUIRED = {"product_identity", "material", "production_time", "material_cost", "labor_cost", "packaging_cost"}

    QUESTIONS = {
        "en": {
            "product_identity": "What is this product and which traditional craft is it?",
            "material": "What exact materials are used? Please mention the main material and any decoration or coating.",
            "technique": "Which technique and tools do you use to make it?",
            "production_time": "How many working hours or days does one piece take to make?",
            "material_cost": "What is the total raw-material cost for one piece, in rupees?",
            "labor_cost": "What fair labor amount should be paid for making one piece, in rupees?",
            "packaging_cost": "What does safe packaging for one piece cost, in rupees? Say zero if none.",
            "dimensions": "What are the product dimensions or size?",
            "region": "Where is this product made? Please name the village, city, or state.",
            "confirmation": "Please confirm: are the product details and costs I summarized correct?",
        },
        "hi": {
            "product_identity": "यह कौन सा उत्पाद है और यह किस पारंपरिक शिल्प से बना है?",
            "material": "इसमें कौन-कौन सी सामग्री लगी है? मुख्य सामग्री और सजावट या कोटिंग भी बताइए।",
            "technique": "इसे बनाने में कौन सी तकनीक और औज़ार इस्तेमाल होते हैं?",
            "production_time": "एक पीस बनाने में कितने काम के घंटे या दिन लगते हैं?",
            "material_cost": "एक पीस की कच्ची सामग्री की कुल लागत कितने रुपये है?",
            "labor_cost": "एक पीस बनाने की उचित कारीगर मजदूरी कितने रुपये होनी चाहिए?",
            "packaging_cost": "एक पीस की सुरक्षित पैकिंग में कितने रुपये लगते हैं? खर्च नहीं है तो शून्य कहें।",
            "dimensions": "उत्पाद का आकार या माप क्या है?",
            "region": "यह उत्पाद कहाँ बनाया जाता है? गाँव, शहर या राज्य बताइए।",
            "confirmation": "कृपया पुष्टि करें: क्या मेरे द्वारा बताए गए उत्पाद विवरण और लागत सही हैं?",
        },
    }

    def continue_interview(
        self,
        utterance: str,
        conversation_transcript: str = "",
        language: str = "Hindi",
        detected_objects: Optional[List[str]] = None,
        known_attributes: Optional[Dict[str, Any]] = None,
        cost_inputs: Optional[Dict[str, Any]] = None,
        last_question_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        utterance = " ".join((utterance or "").split()).strip()
        full_transcript = " ".join(filter(None, [conversation_transcript, utterance])).strip()
        attrs = dict(known_attributes or {})
        costs = self._normalize_costs(cost_inputs or {})
        evidence: Dict[str, str] = {}

        extracted = product_intelligence_service.extract_structured_attributes(
            full_transcript, detected_objects or [], language
        )
        self._merge_extracted(attrs, extracted, evidence)
        self._apply_contextual_answer(attrs, costs, evidence, last_question_key, utterance)
        self._extract_labeled_costs(full_transcript, costs, evidence)

        missing = self._missing_fields(attrs, costs)
        completed = not any(field in self.PRICING_REQUIRED for field in missing)
        human_confirmed = bool(attrs.get("_human_confirmed"))
        answered_count = len(self.QUESTION_ORDER) - len(missing)
        readiness = round(answered_count / len(self.QUESTION_ORDER), 2)

        next_key = missing[0] if missing else None
        locale = "hi" if str(language).lower().startswith(("hi", "हिन्द")) else "en"
        if completed and human_confirmed:
            assistant_message = (
                "धन्यवाद। मूल्य निर्धारण के लिए जरूरी जानकारी पूरी है। मैंने आपके उत्तरों के आधार पर उचित बाजार मूल्य तैयार किया है।"
                if locale == "hi" else
                "Thank you. I now have the evidence required for pricing. I have prepared a fair market recommendation from your confirmed answers."
            )
            status = "ready_for_pricing"
            confidence_score = 0.99
        elif completed:
            summary_text = self._confirmation_summary(attrs, costs, locale)
            assistant_message = f"{summary_text} {self.QUESTIONS[locale]['confirmation']}"
            next_key = "confirmation"
            status = "needs_confirmation"
            confidence_score = round(min(0.94, 0.72 + readiness * 0.22), 2)
        else:
            assistant_message = self.QUESTIONS[locale][next_key]
            status = "needs_information"
            confidence_score = round(0.45 + readiness * 0.45, 2)

        confirmed = [label for label in self.QUESTION_ORDER if label not in missing]
        summary = f"Confirmed {len(confirmed)} of {len(self.QUESTION_ORDER)} product and pricing facts."
        return {
            "status": status,
            "assistant_message": assistant_message,
            "next_question_key": next_key,
            "missing_fields": missing,
            "readiness_score": readiness,
            "confidence_score": confidence_score,
            "human_confirmed": human_confirmed,
            "attributes": attrs,
            "cost_inputs": costs,
            "evidence": evidence,
            "turn_summary": summary,
        }

    @staticmethod
    def _meaningful(value: Any) -> bool:
        return bool(value and str(value).strip().lower() not in {
            "not provided", "not specified", "natural", "handcrafted", "india",
            "traditional handcrafted product", "authentic traditional handcrafted product",
        })

    def _merge_extracted(self, attrs: Dict[str, Any], extracted: Dict[str, Any], evidence: Dict[str, str]) -> None:
        for key, value in extracted.items():
            if key == "confidence_scores":
                attrs[key] = {**attrs.get(key, {}), **value}
            elif self._meaningful(value) and not self._meaningful(attrs.get(key)):
                attrs[key] = value
                evidence[key] = "voice transcript"

    def _apply_contextual_answer(
        self, attrs: Dict[str, Any], costs: Dict[str, Any], evidence: Dict[str, str],
        question_key: Optional[str], answer: str,
    ) -> None:
        if not question_key or not answer:
            return
        if question_key == "confirmation":
            normalized = answer.strip().lower()
            confirmed = bool(re.search(r"\b(yes|correct|confirm|confirmed|right|ok|okay)\b|^(हाँ|हां|जी|सही)", normalized))
            attrs["_human_confirmed"] = confirmed
            evidence["human_confirmation"] = "confirmed by artisan" if confirmed else "correction requested"
            return
        if question_key in {"material_cost", "labor_cost", "packaging_cost"}:
            amount = self._first_amount(answer)
            if amount is not None and amount >= 0:
                costs[question_key] = amount
                evidence[question_key] = "direct voice answer"
            return
        if question_key == "product_identity":
            if not self._meaningful(attrs.get("craft_type")):
                attrs["craft_type"] = answer[:160]
            if not self._meaningful(attrs.get("product_name")):
                attrs["product_name"] = answer[:160]
            evidence["product_identity"] = "direct voice answer"
        elif question_key == "production_time":
            duration = self._duration(answer)
            if duration:
                attrs["production_time"] = duration
                evidence["production_time"] = "direct voice answer"
        elif question_key in {"material", "technique", "dimensions", "region"}:
            attrs[question_key] = answer[:180]
            evidence[question_key] = "direct voice answer"

    def _extract_labeled_costs(self, text: str, costs: Dict[str, Any], evidence: Dict[str, str]) -> None:
        patterns = {
            "material_cost": r"(?:material|raw material|कच्च[ेी]? माल|सामग्री)(?:\s+cost|\s+की लागत)?[^\d]{0,24}(\d[\d,]*(?:\.\d+)?)",
            "labor_cost": r"(?:labou?r|wage|मजदूरी|कारीगर)[^\d]{0,24}(\d[\d,]*(?:\.\d+)?)",
            "packaging_cost": r"(?:packaging|packing|पैकिंग|पैकेजिंग)[^\d]{0,24}(\d[\d,]*(?:\.\d+)?)",
        }
        for key, pattern in patterns.items():
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                costs[key] = float(match.group(1).replace(",", ""))
                evidence[key] = "labeled voice statement"

    def _missing_fields(self, attrs: Dict[str, Any], costs: Dict[str, Any]) -> List[str]:
        present = {
            "product_identity": self._meaningful(attrs.get("craft_type")) or self._meaningful(attrs.get("product_name")),
            "material": self._meaningful(attrs.get("material")),
            "technique": self._meaningful(attrs.get("technique")),
            "production_time": self._meaningful(attrs.get("production_time")),
            "material_cost": costs.get("material_cost") is not None,
            "labor_cost": costs.get("labor_cost") is not None,
            "packaging_cost": costs.get("packaging_cost") is not None,
            "dimensions": self._meaningful(attrs.get("dimensions")),
            "region": self._meaningful(attrs.get("region")),
        }
        return [field for field in self.QUESTION_ORDER if not present[field]]

    @staticmethod
    def _confirmation_summary(attrs: Dict[str, Any], costs: Dict[str, Any], locale: str) -> str:
        if locale == "hi":
            return (
                f"मैंने समझा: {attrs.get('craft_type') or attrs.get('product_name')}, "
                f"सामग्री {attrs.get('material')}, समय {attrs.get('production_time')}, "
                f"सामग्री लागत ₹{costs.get('material_cost', 0):,.0f}, मजदूरी ₹{costs.get('labor_cost', 0):,.0f}, "
                f"और पैकिंग ₹{costs.get('packaging_cost', 0):,.0f}."
            )
        return (
            f"I understood: {attrs.get('craft_type') or attrs.get('product_name')}; "
            f"material {attrs.get('material')}; production time {attrs.get('production_time')}; "
            f"material ₹{costs.get('material_cost', 0):,.0f}, labor ₹{costs.get('labor_cost', 0):,.0f}, "
            f"and packaging ₹{costs.get('packaging_cost', 0):,.0f}."
        )

    @staticmethod
    def _normalize_costs(costs: Dict[str, Any]) -> Dict[str, Any]:
        result: Dict[str, Any] = {"material_cost": None, "labor_cost": None, "packaging_cost": None}
        for key in result:
            value = costs.get(key)
            if value is not None and str(value).strip() != "":
                try:
                    result[key] = max(0.0, float(value))
                except (TypeError, ValueError):
                    pass
        if costs.get("production_time"):
            result["production_time"] = str(costs["production_time"])
        return result

    @staticmethod
    def _first_amount(text: str) -> Optional[float]:
        match = re.search(r"(?:₹|rs\.?|inr|रुप(?:ये|या)?)?\s*(\d[\d,]*(?:\.\d+)?)", text, flags=re.IGNORECASE)
        return float(match.group(1).replace(",", "")) if match else None

    @staticmethod
    def _duration(text: str) -> Optional[str]:
        match = re.search(r"(\d+(?:\.\d+)?)\s*(hours?|hrs?|days?|weeks?|घंटे?|दिन|सप्ताह)", text, flags=re.IGNORECASE)
        if not match:
            return None
        unit = match.group(2).lower()
        normalized = "hours" if unit.startswith(("hour", "hr", "घंट")) else "weeks" if unit.startswith(("week", "सप्त")) else "days"
        return f"{match.group(1)} {normalized}"


product_interview_service = ProductInterviewService()
