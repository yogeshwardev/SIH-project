import re
from typing import Any, Dict, List, Optional

from backend.app.services.product_intelligence import product_intelligence_service


class ProductInterviewService:
    """Evidence-gated, multilingual product discovery interview.

    The service is deliberately stateless: the client sends confirmed facts from the
    previous turn. This makes conversations resumable and prevents cross-user data
    leakage while still supporting an unlimited number of voice turns.
    """

    # Keep the assisted flow deliberately short. Technique, dimensions and region
    # are still extracted when the artisan mentions them, but are not mandatory
    # questions for pricing.
    QUESTION_ORDER = [
        "product_description", "material", "production_time",
        "material_cost", "labor_cost", "packaging_cost",
    ]
    PRICING_REQUIRED = set(QUESTION_ORDER)

    QUESTIONS = {
        "en": {
            "product_description": "Hello! I am here to help you create your product listing. First, please describe your product in your own words. What is it called, what makes it special, and how is it used? There is no wrong answer.",
            "material": "Thank you. What is your product made from? You can name the main material in simple words.",
            "production_time": "Great. About how long does one item take you to make? You can answer in hours or days.",
            "material_cost": "You are doing well. About how much do the materials for one item cost, in rupees?",
            "labor_cost": "And how much should you be paid fairly for your work on one item, in rupees?",
            "packaging_cost": "Just one more cost question. How much does packing one item cost? You can say zero if there is no cost.",
            "confirmation": "Is this information correct? Choose Yes to continue, or tell me what to change.",
        },
        "hi": {
            "product_description": "नमस्ते! मैं आपकी उत्पाद सूची बनाने में मदद करूँगी। सबसे पहले, अपने उत्पाद के बारे में अपने शब्दों में बताइए। इसका नाम क्या है, इसकी खास बात क्या है और इसका उपयोग कैसे होता है? जैसा आसान लगे वैसा बोलिए।",
            "material": "धन्यवाद। आपका उत्पाद किस चीज़ से बना है? मुख्य सामग्री का नाम आसान शब्दों में बताइए।",
            "production_time": "बहुत अच्छा। एक उत्पाद बनाने में लगभग कितना समय लगता है? घंटे या दिन में बता सकते हैं।",
            "material_cost": "आप बहुत अच्छा कर रहे हैं। एक उत्पाद की सामग्री पर लगभग कितने रुपये खर्च होते हैं?",
            "labor_cost": "एक उत्पाद बनाने की आपकी मेहनत के उचित कितने रुपये मिलने चाहिए?",
            "packaging_cost": "खर्च से जुड़ा बस एक आखिरी सवाल। एक उत्पाद की पैकिंग में कितने रुपये लगते हैं? खर्च नहीं है तो शून्य कहें।",
            "confirmation": "क्या यह जानकारी सही है? आगे बढ़ने के लिए हाँ चुनें, या जो बदलना है वह बताइए।",
        },
        "te": {
            "product_description": "నమస్కారం! మీ ఉత్పత్తి జాబితాను తయారు చేయడంలో నేను మీకు సహాయం చేస్తాను. ముందుగా, మీ ఉత్పత్తి గురించి మీ మాటల్లో చెప్పండి. దాని పేరు ఏమిటి, దాని ప్రత్యేకత ఏమిటి, దాన్ని ఎలా ఉపయోగిస్తారు? మీకు సులభంగా అనిపించినట్లు చెప్పండి.",
            "material": "ధన్యవాదాలు. మీ ఉత్పత్తి దేనితో తయారైంది? ముఖ్యమైన పదార్థం పేరును సులభమైన మాటల్లో చెప్పండి.",
            "production_time": "చాలా బాగుంది. ఒక ఉత్పత్తి తయారు చేయడానికి సుమారుగా ఎంత సమయం పడుతుంది? గంటలు లేదా రోజుల్లో చెప్పవచ్చు.",
            "material_cost": "మీరు చాలా బాగా చేస్తున్నారు. ఒక ఉత్పత్తికి కావలసిన పదార్థాల ఖర్చు సుమారుగా ఎన్ని రూపాయలు?",
            "labor_cost": "ఒక ఉత్పత్తి తయారుచేసిన మీ పనికి న్యాయంగా ఎన్ని రూపాయలు రావాలి?",
            "packaging_cost": "ఖర్చుకు సంబంధించిన చివరి ప్రశ్న. ఒక ఉత్పత్తి ప్యాకింగ్‌కు ఎన్ని రూపాయలు ఖర్చవుతుంది? ఖర్చు లేకపోతే సున్నా అని చెప్పండి.",
            "confirmation": "ఈ సమాచారం సరైందా? ముందుకు వెళ్లడానికి అవును ఎంచుకోండి, లేదా మార్చాల్సింది చెప్పండి.",
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
        # A blank first turn starts the assisted, one-question-at-a-time flow.
        # Visual guesses can help the listing later, but they must not silently
        # skip questions that the artisan has not answered themselves.
        if not utterance and not conversation_transcript and not last_question_key:
            attrs["_interview_confirmed_fields"] = []
        if utterance and not conversation_transcript and not self._meaningful(attrs.get("artisan_description")):
            attrs["artisan_description"] = utterance[:600]
            evidence["artisan_description"] = "artisan's own words"
        answer_was_invalid = self._apply_contextual_answer(
            attrs, costs, evidence, last_question_key, utterance
        )
        self._extract_labeled_costs(full_transcript, costs, evidence)

        missing = self._missing_fields(attrs, costs)
        completed = not any(field in self.PRICING_REQUIRED for field in missing)
        human_confirmed = bool(attrs.get("_human_confirmed"))
        answered_count = len(self.QUESTION_ORDER) - len(missing)
        readiness = round(answered_count / len(self.QUESTION_ORDER), 2)

        next_key = missing[0] if missing else None
        locale = self._locale(language)
        if completed and human_confirmed:
            assistant_message = {
                "hi": "धन्यवाद। जानकारी पूरी है। अब अपने उत्पाद का विवरण और उचित मूल्य देखिए।",
                "te": "ధన్యవాదాలు. సమాచారం పూర్తైంది. ఇప్పుడు మీ ఉత్పత్తి వివరణ మరియు సరైన ధరను చూడండి.",
                "en": "Thank you. The information is complete. You can now review your product description and fair price.",
            }[locale]
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
            if answer_was_invalid:
                retry = {
                    "hi": "कोई बात नहीं, मैं वह जवाब समझ नहीं पाया। कृपया एक बार फिर आसान शब्दों में बताइए।",
                    "te": "పరవాలేదు, ఆ సమాధానం నాకు అర్థం కాలేదు. దయచేసి మరోసారి సులభంగా చెప్పండి.",
                    "en": "No problem, I could not understand that answer. Please try once more in simple words.",
                }[locale]
                assistant_message = f"{retry} {assistant_message}"
            status = "needs_information"
            confidence_score = round(0.45 + readiness * 0.45, 2)

        confirmed = [label for label in self.QUESTION_ORDER if label not in missing]
        summary = {
            "hi": f"{len(confirmed)} में से {len(self.QUESTION_ORDER)} आसान सवाल पूरे हुए।",
            "te": f"{len(self.QUESTION_ORDER)} సులభమైన ప్రశ్నల్లో {len(confirmed)} పూర్తయ్యాయి.",
            "en": f"Completed {len(confirmed)} of {len(self.QUESTION_ORDER)} simple questions.",
        }[locale]
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
            "question_number": (
                len(self.QUESTION_ORDER) + 1
                if next_key in {None, "confirmation"}
                else self.QUESTION_ORDER.index(next_key) + 1
            ),
            "total_questions": len(self.QUESTION_ORDER) + 1,
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
    ) -> bool:
        if not question_key or not answer:
            return False
        if question_key == "confirmation":
            normalized = answer.strip().lower()
            confirmed = bool(re.search(
                r"\b(yes|correct|confirm|confirmed|right|ok|okay)\b|^(हाँ|हां|जी|सही|అవును|సరే|సరి|కరెక్ట్)",
                normalized,
            ))
            attrs["_human_confirmed"] = confirmed
            evidence["human_confirmation"] = "confirmed by artisan" if confirmed else "correction requested"
            return False
        if question_key in {"material_cost", "labor_cost", "packaging_cost"}:
            amount = self._first_amount(answer)
            if amount is not None and amount >= 0:
                costs[question_key] = amount
                evidence[question_key] = "direct voice answer"
                self._mark_interview_field_confirmed(attrs, question_key)
                return False
            return True
        if question_key == "product_description":
            if len(answer.strip()) < 8:
                return True
            attrs["artisan_description"] = answer[:600]
            if not self._meaningful(attrs.get("craft_type")):
                attrs["craft_type"] = answer[:160]
            if not self._meaningful(attrs.get("product_name")):
                attrs["product_name"] = answer[:160]
            evidence["artisan_description"] = "artisan's own words"
            self._mark_interview_field_confirmed(attrs, question_key)
        elif question_key == "production_time":
            duration = self._duration(answer)
            if duration:
                attrs["production_time"] = duration
                evidence["production_time"] = "direct voice answer"
                self._mark_interview_field_confirmed(attrs, question_key)
            else:
                return True
        elif question_key in {"material", "technique", "dimensions", "region"}:
            if question_key == "material" and self._looks_like_currency_only(answer):
                return True
            attrs[question_key] = answer[:180]
            evidence[question_key] = "direct voice answer"
            self._mark_interview_field_confirmed(attrs, question_key)
        return False

    @staticmethod
    def _mark_interview_field_confirmed(attrs: Dict[str, Any], question_key: str) -> None:
        confirmed = attrs.get("_interview_confirmed_fields")
        if not isinstance(confirmed, list):
            return
        if question_key not in confirmed:
            confirmed.append(question_key)

    def _extract_labeled_costs(self, text: str, costs: Dict[str, Any], evidence: Dict[str, str]) -> None:
        patterns = {
            "material_cost": r"(?:material|raw material|कच्च[ेी]? माल|सामग्री|ముడి సరుకు|పదార్థాల?)(?:\s+cost|\s+की लागत)?[^\d]{0,24}(\d[\d,]*(?:\.\d+)?)",
            "labor_cost": r"(?:labou?r|wage|मजदूरी|कारीगर|కూలి|పని|శ్రమ)[^\d]{0,24}(\d[\d,]*(?:\.\d+)?)",
            "packaging_cost": r"(?:packaging|packing|पैकिंग|पैकेजिंग|ప్యాకింగ్|ప్యాకేజింగ్)[^\d]{0,24}(\d[\d,]*(?:\.\d+)?)",
        }
        for key, pattern in patterns.items():
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                costs[key] = float(match.group(1).replace(",", ""))
                evidence[key] = "labeled voice statement"

    def _missing_fields(self, attrs: Dict[str, Any], costs: Dict[str, Any]) -> List[str]:
        assisted_confirmed = attrs.get("_interview_confirmed_fields")
        assisted_mode = isinstance(assisted_confirmed, list)

        def answered(field: str, has_value: bool) -> bool:
            return has_value and (not assisted_mode or field in assisted_confirmed)

        present = {
            "product_description": answered("product_description", self._meaningful(attrs.get("artisan_description"))),
            "material": answered("material", self._meaningful(attrs.get("material"))),
            "production_time": answered("production_time", self._meaningful(attrs.get("production_time"))),
            "material_cost": answered("material_cost", costs.get("material_cost") is not None),
            "labor_cost": answered("labor_cost", costs.get("labor_cost") is not None),
            "packaging_cost": answered("packaging_cost", costs.get("packaging_cost") is not None),
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
        if locale == "te":
            return (
                f"నేను అర్థం చేసుకున్నది: {attrs.get('craft_type') or attrs.get('product_name')}, "
                f"పదార్థం {attrs.get('material')}, తయారీ సమయం {attrs.get('production_time')}, "
                f"పదార్థాల ఖర్చు ₹{costs.get('material_cost', 0):,.0f}, మీ పని ₹{costs.get('labor_cost', 0):,.0f}, "
                f"ప్యాకింగ్ ₹{costs.get('packaging_cost', 0):,.0f}."
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
        if match:
            return float(match.group(1).replace(",", ""))

        normalized = str(text or "").strip().lower().replace("-", " ")
        if any(word in normalized for word in ("zero", "शून्य", "सिफर", "సున్నా", "శూన్యం")):
            return 0.0

        english_values = {
            "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
            "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
            "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
            "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18,
            "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40,
            "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
        }
        current = 0
        total = 0
        found = False
        for token in re.findall(r"[a-z]+", normalized):
            if token in english_values:
                current += english_values[token]
                found = True
            elif token == "hundred" and found:
                current = max(1, current) * 100
            elif token == "thousand" and found:
                total += max(1, current) * 1000
                current = 0
        if found:
            return float(total + current)

        simple_numbers = {
            "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "पाँच": 5,
            "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
            "ఒకటి": 1, "ఒక": 1, "రెండు": 2, "మూడు": 3, "నాలుగు": 4,
            "ఐదు": 5, "ఆరు": 6, "ఏడు": 7, "ఎనిమిది": 8, "తొమ్మిది": 9, "పది": 10,
        }
        base = next((
            value for word, value in sorted(simple_numbers.items(), key=lambda item: len(item[0]), reverse=True)
            if word in normalized
        ), None)
        if base is not None:
            if any(word in normalized for word in ("हजार", "వెయ్యి", "వేలు")):
                return float(base * 1000)
            if any(word in normalized for word in ("सौ", "వంద")):
                return float(base * 100)
            return float(base)
        return None

    @staticmethod
    def _looks_like_currency_only(text: str) -> bool:
        return bool(re.fullmatch(
            r"\s*(?:₹|rs\.?|inr)?\s*\d[\d,]*(?:\.\d+)?\s*"
            r"(?:rupees?|रुप(?:ये|या)?|रुपये|రూపాయలు?|రూపాయి)?\s*",
            str(text or ""),
            flags=re.IGNORECASE,
        ))

    @staticmethod
    def _duration(text: str) -> Optional[str]:
        unit_pattern = r"hours?|hrs?|days?|weeks?|घंटे?|घंटा|दिन|सप्ताह|గంటలు?|గంట|రోజులు?|రోజు|వారాలు?|వారం"
        match = re.search(rf"(\d+(?:\.\d+)?)\s*({unit_pattern})", text, flags=re.IGNORECASE)
        amount: Optional[float] = float(match.group(1)) if match else None
        unit = match.group(2).lower() if match else None

        if amount is None:
            unit_match = re.search(unit_pattern, text, flags=re.IGNORECASE)
            if not unit_match:
                return None
            unit = unit_match.group(0).lower()
            prefix = text[:unit_match.start()].strip().lower()
            if any(value in prefix for value in ("half", "आधा", "అర")):
                amount = 0.5
            else:
                spoken_numbers = {
                    "one": 1, "two": 2, "three": 3, "four": 4,
                    "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
                    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "पाँच": 5,
                    "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
                    "ఒక": 1, "ఒకటి": 1, "రెండు": 2, "మూడు": 3, "నాలుగు": 4,
                    "ఐదు": 5, "ఆరు": 6, "ఏడు": 7, "ఎనిమిది": 8, "తొమ్మిది": 9, "పది": 10,
                }
                amount = next((
                    float(value)
                    for word, value in sorted(spoken_numbers.items(), key=lambda item: len(item[0]), reverse=True)
                    if word in prefix
                ), None)
                if amount is None and re.search(r"\b(?:a|an)\s*$", prefix):
                    amount = 1.0
                if amount is not None and re.search(r"\b(?:and a half|and half)\b", prefix):
                    amount += 0.5

        if amount is None or unit is None:
            return None
        normalized = (
            "hours" if unit.startswith(("hour", "hr", "घंट", "గంట"))
            else "weeks" if unit.startswith(("week", "सप्त", "వార"))
            else "days"
        )
        amount_text = str(int(amount)) if amount.is_integer() else str(amount)
        return f"{amount_text} {normalized}"

    @staticmethod
    def _locale(language: str) -> str:
        value = str(language or "").strip().lower()
        if value.startswith("te") or "telugu" in value or "తెలుగు" in value:
            return "te"
        if value.startswith("hi") or "hindi" in value or "हिन्द" in value or "हिंदी" in value:
            return "hi"
        return "en"


product_interview_service = ProductInterviewService()
