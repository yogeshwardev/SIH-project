import re
from typing import Any, Dict, List, Optional

from backend.app.services import interview_content
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

    # Every question carries: the spoken sentence (read aloud), a short on-screen
    # title, one line of help, tappable examples and the kind of answer expected.
    # Questions, praise lines and labels live in interview_content.py, one
    # block per language, so adding a language is a data change.
    CONTENT = interview_content.CONTENT
    GREETING = interview_content.GREETING
    PRAISE = interview_content.PRAISE
    RETRY = interview_content.RETRY
    DONE = interview_content.DONE
    SUMMARY_LABELS = interview_content.SUMMARY_LABELS
    LANGUAGES = interview_content.LANGUAGES

    def continue_interview(
        self,
        utterance: str,
        conversation_transcript: str = "",
        language: str = "Hindi",
        detected_objects: Optional[List[str]] = None,
        known_attributes: Optional[Dict[str, Any]] = None,
        cost_inputs: Optional[Dict[str, Any]] = None,
        last_question_key: Optional[str] = None,
        artisan_name: str = "",
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
        content = self.CONTENT[locale]
        summary_items: List[Dict[str, str]] = []
        question: Dict[str, Any] = {}

        if completed and human_confirmed:
            assistant_message = self.DONE[locale]
            status = "ready_for_pricing"
            confidence_score = 0.99
        elif completed:
            question = content["confirmation"]
            summary_items = self._summary_items(attrs, costs, locale)
            spoken_summary = self._spoken_summary(summary_items, locale)
            assistant_message = f"{spoken_summary} {question['speak']}"
            next_key = "confirmation"
            status = "needs_confirmation"
            confidence_score = round(min(0.94, 0.72 + readiness * 0.22), 2)
        else:
            question = content[next_key]
            first_turn = not utterance and not conversation_transcript and not last_question_key
            lead = ""
            if first_turn:
                name = str(artisan_name or "").strip().split(" ")[0]
                lead = self.GREETING[locale].format(name=f" {name}" if name and name.lower() != "artisan" else "")
            elif not answer_was_invalid and answered_count > 0:
                lead = self.PRAISE[locale][min(answered_count - 1, len(self.PRAISE[locale]) - 1)]
            elif answer_was_invalid:
                lead = self.RETRY[locale]
            assistant_message = " ".join(filter(None, [lead, question["speak"]]))
            status = "needs_information"
            confidence_score = round(0.45 + readiness * 0.45, 2)

        confirmed = [label for label in self.QUESTION_ORDER if label not in missing]
        summary = interview_content.PROGRESS[locale].format(
            done=len(confirmed), total=len(self.QUESTION_ORDER)
        )
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
            "question_title": question.get("title", ""),
            "question_help": question.get("help", ""),
            "question_examples": list(question.get("examples", [])),
            "input_type": question.get("input", "text"),
            "placeholder": question.get("placeholder", ""),
            "summary_items": summary_items,
            "answered_count": answered_count,
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
            confirmed = bool(re.search(interview_content.YES_WORDS, normalized))
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

    def _summary_items(self, attrs: Dict[str, Any], costs: Dict[str, Any], locale: str) -> List[Dict[str, str]]:
        labels = self.SUMMARY_LABELS[locale]
        rupees = lambda value: f"\u20b9{float(value or 0):,.0f}"
        return [
            {"label": labels["product"], "value": str(attrs.get("artisan_description") or attrs.get("product_name") or "")[:140]},
            {"label": labels["material"], "value": str(attrs.get("material") or "")},
            {"label": labels["time"], "value": str(attrs.get("production_time") or "")},
            {"label": labels["material_cost"], "value": rupees(costs.get("material_cost"))},
            {"label": labels["labor_cost"], "value": rupees(costs.get("labor_cost"))},
            {"label": labels["packaging_cost"], "value": rupees(costs.get("packaging_cost"))},
        ]

    @staticmethod
    def _spoken_summary(items: List[Dict[str, str]], locale: str) -> str:
        parts = ", ".join(f"{item['label']}: {item['value']}" for item in items if item["value"])
        lead = interview_content.SUMMARY_LEAD[locale]
        return f"{lead} {parts}."

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
        if any(word in normalized for word in interview_content.ZERO_WORDS):
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

        base = next((
            value for word, value in sorted(
                interview_content.NUMBER_WORDS.items(), key=lambda item: len(item[0]), reverse=True
            )
            if word in normalized
        ), None)
        if base is not None:
            if any(word in normalized for word in interview_content.THOUSAND_WORDS):
                return float(base * 1000)
            if any(word in normalized for word in interview_content.HUNDRED_WORDS):
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
        units = sorted(
            interview_content.HOUR_WORDS + interview_content.DAY_WORDS + interview_content.WEEK_WORDS,
            key=len, reverse=True,
        )
        unit_pattern = "|".join(re.escape(word) for word in units)
        match = re.search(rf"(\d+(?:\.\d+)?)\s*({unit_pattern})", text, flags=re.IGNORECASE)
        amount: Optional[float] = float(match.group(1)) if match else None
        unit = match.group(2) if match else None

        if amount is None:
            unit_match = re.search(unit_pattern, text, flags=re.IGNORECASE)
            if not unit_match:
                return None
            unit = unit_match.group(0)
            prefix = text[:unit_match.start()].strip().lower()
            if any(value in prefix for value in interview_content.HALF_WORDS):
                amount = 0.5
            else:
                spoken_numbers = {
                    "one": 1, "two": 2, "three": 3, "four": 4,
                    "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
                    **interview_content.NUMBER_WORDS,
                }
                amount = next((
                    float(value)
                    for word, value in sorted(spoken_numbers.items(), key=lambda item: len(item[0]), reverse=True)
                    if word in prefix
                ), None)
                if amount is None and re.search(r"(?:a|an)\s*$", prefix):
                    amount = 1.0
                if amount is not None and re.search(r"(?:and a half|and half)", prefix):
                    amount += 0.5

        if amount is None or unit is None:
            return None
        amount_text = str(int(amount)) if float(amount).is_integer() else str(amount)
        return f"{amount_text} {interview_content.duration_unit(unit)}"

    @staticmethod
    def _locale(language: str) -> str:
        return interview_content.resolve_locale(language)


product_interview_service = ProductInterviewService()
