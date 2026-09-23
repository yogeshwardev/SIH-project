"""Translate what the artisan actually said into English and Hindi.

An artisan describes a piece in Kannada or Bengali; the buyer reads English or
Hindi. That crossing has to be a real translation, not a phrase table, or the
meaning of their own words is lost.

Engines, in order of preference:
  1. A configured LLM (Gemini or OpenAI), when the deployment has a key.
  2. A local NLLB-200 model through CTranslate2 — no network, no per-call cost,
     which is what a village deployment needs. Fetch it once with
     `python backend/scripts/download_translation_model.py`.
  3. A craft glossary, which only substitutes the domain terms it knows and
     says so, rather than pretending to have translated the sentence.

Every result carries the engine that produced it, so nothing downstream has to
guess how reliable it is.
"""
import re
import threading
from pathlib import Path
from typing import Dict, List, Optional

from backend.app.config import settings

# Locale → NLLB (FLORES-200) code, for the nine languages the app speaks.
FLORES_CODES: Dict[str, str] = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "te": "tel_Telu",
    "ta": "tam_Taml",
    "bn": "ben_Beng",
    "mr": "mar_Deva",
    "kn": "kan_Knda",
    "gu": "guj_Gujr",
    "ml": "mal_Mlym",
}

MODEL_NAME = "nllb-200-distilled-600M-ct2-int8"

# Two places the model can live. A deployment points MODELS_DIR at a mounted
# disk so a download survives a redeploy; a container built with
# --build-arg WITH_TRANSLATION_MODEL=true carries it in the image instead, and
# that copy sits beside the code, not on the disk. Look in both, or a baked-in
# model is invisible the moment MODELS_DIR is overridden.
MODEL_CANDIDATES = (
    settings.MODELS_DIR / MODEL_NAME,
    settings.BASE_DIR / "saved_models" / MODEL_NAME,
)


def _model_dir():
    """The first candidate holding a usable model, or None."""
    for candidate in MODEL_CANDIDATES:
        if (candidate / "model.bin").exists() and (candidate / "tokenizer.json").exists():
            return candidate
    return None

# Craft vocabulary. Used to keep domain terms intact in generated copy, and as
# the last-resort engine when no model is installed.
GLOSSARY_EN_TO_HI = {
    "Handloom": "हथकरघा", "Handcrafted": "हस्तनिर्मित", "Silk": "रेशम", "Cotton": "सूती",
    "Terracotta": "टेराकोटा", "Clay": "मिट्टी", "Bamboo": "बांस", "Cane": "बेंत",
    "Brass": "पीतल", "Bell Metal": "कांसा", "Eco-friendly": "पर्यावरण के अनुकूल",
    "Natural Dyes": "प्राकृतिक रंग", "Authentic": "प्रामाणिक", "Master Artisan": "मास्टर शिल्पकार",
    "Sustainable": "टिकाऊ", "GI Certified": "जीआई प्रमाणित", "Zari": "ज़री",
    "Hand-painted": "हाथ से चित्रित", "Hand-carved": "हाथ से तराशा", "Wood": "लकड़ी",
    "Jute": "जूट", "Marble": "संगमरमर", "Leather": "चमड़ा", "Pottery": "मिट्टी के बर्तन",
}

# Joining words, so a glossed phrase reads as one phrase rather than a
# Hindi noun bolted to an English "and".
CONNECTORS_EN_TO_HI = {"and": "और", "&": "और", "with": "से", "or": "या", "on": "पर"}

# The same protection for Telugu: a general model reads "Bamboo" as
# "బాంబు" (bomb) and "cane" as "stick" when it has no context.
GLOSSARY_EN_TO_TE = {
    "Handloom": "చేనేత", "Handcrafted": "చేతితో తయారైనది", "Silk": "పట్టు", "Cotton": "నూలు",
    "Terracotta": "మట్టి", "Clay": "మట్టి", "Bamboo": "వెదురు", "Cane": "బెత్తం",
    "Brass": "ఇత్తడి", "Bell Metal": "కంచు", "Weaving": "నేత", "Pottery": "కుండల తయారీ",
    "Carving": "చెక్కడం", "Painting": "చిత్రకళ", "Wood": "కలప", "Jute": "జనపనార",
    "Marble": "పాలరాయి", "Leather": "తోలు", "Stone": "రాయి", "Natural Dyes": "సహజ రంగులు",
    "Hand-painted": "చేతితో చిత్రించిన", "Hand-carved": "చేతితో చెక్కిన",
    "Hand-woven": "చేతితో నేసిన", "Zari": "జరీ", "Basket": "బుట్ట",
}

CONNECTORS_EN_TO_TE = {"and": "మరియు", "&": "మరియు", "with": "తో", "or": "లేదా"}


class TranslationService:
    """Multilingual translation for the artisan auto-cataloguer."""

    def __init__(self) -> None:
        self._translator = None
        self._tokenizer = None
        self._load_lock = threading.Lock()
        self._load_failed = False
        self._cache: Dict[tuple, str] = {}

    # ── Public API ───────────────────────────────────────────────────────────

    def local_model_available(self) -> bool:
        return _model_dir() is not None

    def engine_name(self) -> str:
        if self._llm_key():
            return "llm"
        if self.local_model_available():
            return "nllb-200-distilled-600M"
        return "craft-glossary"

    def translate(self, text: str, source: str, target: str) -> Dict[str, str]:
        """Translate one passage. Returns the text and the engine that made it."""
        clean = " ".join(str(text or "").split())
        if not clean:
            return {"text": "", "engine": "none"}

        source_code = self._locale(source)
        target_code = self._locale(target)
        if source_code == target_code:
            return {"text": clean, "engine": "same-language"}

        cache_key = (source_code, target_code, clean)
        if cache_key in self._cache:
            return {"text": self._cache[cache_key], "engine": self.engine_name()}

        translated = ""
        engine = "none"

        if self._llm_key():
            translated = self._translate_with_llm(clean, source_code, target_code)
            engine = "llm" if translated else engine

        if not translated and self.local_model_available():
            if source_code != "en" and target_code != "en":
                # Indic→Indic is the model's weakest direction; going through
                # English, where both halves are strong, reads far better.
                english = self._translate_locally(clean, source_code, "en")
                translated = self._translate_locally(english, "en", target_code) if english else ""
            if not translated:
                translated = self._translate_locally(clean, source_code, target_code)
            engine = "nllb-200-distilled-600M" if translated else engine

        if not translated:
            translated = self._translate_with_glossary(clean, source_code, target_code)
            engine = "craft-glossary"

        if translated:
            self._cache[cache_key] = translated
        return {"text": translated, "engine": engine}

    def term(self, text: str, target: str, source: str = "English") -> str:
        """Translate a short attribute phrase, falling back to the original.

        Craft vocabulary goes through the glossary first: a model asked to
        translate two words out of context turns "Terracotta Pottery" into
        "terracotta bowl", while the glossary keeps the trade's own word.
        """
        clean = " ".join(str(text or "").split())
        if not clean or clean.lower() in {"not provided", "not specified", "natural"}:
            return clean

        target_code = self._locale(target)
        if self._locale(source) == "en" and target_code in {"hi", "te"}:
            glossed = self._translate_with_glossary(clean, "en", target_code)
            if glossed != clean and not re.search(r"[A-Za-z]", glossed):
                return glossed

        masked, mapping = self._mask_known_terms(clean, target_code)
        result = self.translate(masked, source, target)
        translated = self._restore_terms(result.get("text") or clean, mapping)
        # A term that grows several times longer is usually the model rambling.
        return translated if len(translated) <= max(40, len(clean) * 3) else clean

    def translate_many(self, texts: List[str], source: str, target: str) -> List[str]:
        """Translate several short passages in a single model call."""
        cleaned = [" ".join(str(text or "").split()) for text in texts]
        source_code = self._locale(source)
        target_code = self._locale(target)

        results: List[str] = list(cleaned)
        if source_code == target_code:
            return results

        pending: List[int] = []
        for index, text in enumerate(cleaned):
            if not text:
                continue
            cached = self._cache.get((source_code, target_code, text))
            if cached is not None:
                results[index] = cached
            else:
                pending.append(index)

        if not pending:
            return results

        if self.local_model_available():
            batch = [cleaned[index] for index in pending]
            if source_code != "en" and target_code != "en":
                english = self._translate_batch_locally(batch, source_code, "en")
                translated = self._translate_batch_locally(english, "en", target_code)
            else:
                translated = self._translate_batch_locally(batch, source_code, target_code)
            for index, value in zip(pending, translated):
                if value:
                    results[index] = value
                    self._cache[(source_code, target_code, cleaned[index])] = value
            return results

        # No local model: fall back one by one through the usual chain.
        for index in pending:
            results[index] = self.translate(cleaned[index], source, target)["text"]
        return results

    def terms(self, texts: List[str], target: str, source: str = "English") -> List[str]:
        """term() for a list of phrases, in one model call."""
        cleaned = [" ".join(str(text or "").split()) for text in texts]
        results = list(cleaned)
        pending = []

        for index, text in enumerate(cleaned):
            if not text or text.lower() in {"not provided", "not specified", "natural"}:
                continue
            target_code = self._locale(target)
            if self._locale(source) == "en" and target_code in {"hi", "te"}:
                glossed = self._translate_with_glossary(text, "en", target_code)
                if glossed != text and not re.search(r"[A-Za-z]", glossed):
                    results[index] = glossed
                    continue
            pending.append(index)

        if pending:
            masked, mappings = [], []
            for index in pending:
                text, mapping = self._mask_known_terms(cleaned[index], self._locale(target))
                masked.append(text)
                mappings.append(mapping)

            translated = self.translate_many(masked, source, target)
            for index, value, mapping in zip(pending, translated, mappings):
                original = cleaned[index]
                value = self._restore_terms(value, mapping) if value else value
                # A term that grows several times longer is the model rambling.
                if value and len(value) <= max(40, len(original) * 3):
                    results[index] = value

        return results


    # ── Craft vocabulary protection ──────────────────────────────────────────

    GLOSSARIES = {"hi": "GLOSSARY_EN_TO_HI", "te": "GLOSSARY_EN_TO_TE"}

    def _mask_known_terms(self, text: str, target_code: str):
        """Swap glossary terms for placeholders the model will not translate."""
        glossary = GLOSSARY_EN_TO_HI if target_code == "hi" else GLOSSARY_EN_TO_TE if target_code == "te" else {}
        if not glossary:
            return text, {}

        masked = text
        mapping = {}
        # Longest first, so "Bell Metal" is not consumed by "Metal".
        for english in sorted(glossary, key=len, reverse=True):
            pattern = rf"\b{re.escape(english)}\b"
            if re.search(pattern, masked, flags=re.IGNORECASE):
                token = f"QZ{len(mapping)}"
                masked = re.sub(pattern, token, masked, flags=re.IGNORECASE)
                mapping[token] = glossary[english]
        return masked, mapping

    @staticmethod
    def _restore_terms(text: str, mapping: dict) -> str:
        result = text
        for token, replacement in mapping.items():
            result = re.sub(rf"\b{token}\b", replacement, result, flags=re.IGNORECASE)
        return result

    # ── Local neural model ───────────────────────────────────────────────────

    def _ensure_model(self) -> bool:
        if self._translator is not None:
            return True
        if self._load_failed or not self.local_model_available():
            return False
        with self._load_lock:
            if self._translator is not None:
                return True
            try:
                import ctranslate2
                from tokenizers import Tokenizer

                model_dir = _model_dir()
                self._tokenizer = Tokenizer.from_file(str(model_dir / "tokenizer.json"))
                self._translator = ctranslate2.Translator(
                    str(model_dir), device="cpu", compute_type="int8", inter_threads=1
                )
                return True
            except Exception:
                # A missing or broken model must never take the listing flow
                # down; the glossary engine still answers.
                self._load_failed = True
                return False

    def warmup(self) -> None:
        """Load the model outside the artisan's first request."""
        if self._ensure_model():
            self._translate_locally("namaste", "eng_Latn", "hin_Deva")

    def _translate_locally(self, text: str, source_code: str, target_code: str) -> str:
        return (self._translate_batch_locally([text], source_code, target_code) or [""])[0]

    def _translate_batch_locally(self, texts: List[str], source_code: str, target_code: str) -> List[str]:
        """One CTranslate2 call for every sentence of every passage."""
        if not self._ensure_model():
            return ["" for _ in texts]
        try:
            source_token = FLORES_CODES.get(source_code, source_code)
            target_token = FLORES_CODES.get(target_code, target_code)

            sources: List[List[str]] = []
            spans: List[tuple] = []
            for text in texts:
                sentences = self._split_sentences(text) if text else []
                start = len(sources)
                for sentence in sentences:
                    tokens = [
                        token for token in self._tokenizer.encode(sentence).tokens
                        if token not in ("<s>", "</s>", "<unk>")
                    ]
                    sources.append([source_token] + tokens + ["</s>"])
                spans.append((start, len(sources)))

            if not sources:
                return ["" for _ in texts]

            results = self._translator.translate_batch(
                sources,
                target_prefix=[[target_token]] * len(sources),
                beam_size=2,
                max_decoding_length=256,
                max_batch_size=16,
                replace_unknowns=True,
            )

            decoded: List[str] = []
            for result in results:
                hypothesis = [
                    token for token in result.hypotheses[0]
                    if token not in (target_token, "</s>", "<s>")
                ]
                ids = [self._tokenizer.token_to_id(token) for token in hypothesis]
                decoded.append(self._tokenizer.decode([i for i in ids if i is not None]).strip())

            return [
                " ".join(part for part in decoded[start:end] if part).strip()
                for start, end in spans
            ]
        except Exception:
            return ["" for _ in texts]

    # ── Hosted model ─────────────────────────────────────────────────────────

    @staticmethod
    def _llm_key() -> str:
        provider = (settings.AI_PROVIDER or "").lower()
        if provider == "gemini" and settings.GEMINI_API_KEY:
            return "gemini"
        if provider == "openai" and settings.OPENAI_API_KEY:
            return "openai"
        return ""

    def _translate_with_llm(self, text: str, source_code: str, target_code: str) -> str:
        provider = self._llm_key()
        if not provider:
            return ""
        names = {"en": "English", "hi": "Hindi", "te": "Telugu", "ta": "Tamil", "bn": "Bengali",
                 "mr": "Marathi", "kn": "Kannada", "gu": "Gujarati", "ml": "Malayalam"}
        prompt = (
            f"Translate this {names.get(source_code, source_code)} sentence written by an Indian "
            f"handicraft artisan into {names.get(target_code, target_code)}. Keep craft terms "
            f"(zari, dhokra, pattachitra, terracotta) as they are. Reply with the translation only.\n\n{text}"
        )
        try:
            import requests

            if provider == "gemini":
                response = requests.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{getattr(settings, 'GEMINI_TEXT_MODEL', 'gemini-2.0-flash')}:generateContent",
                    params={"key": settings.GEMINI_API_KEY},
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    timeout=25,
                )
                response.raise_for_status()
                return response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()

            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={
                    "model": settings.OPENAI_TEXT_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2,
                },
                timeout=25,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"].strip()
        except Exception:
            return ""

    # ── Glossary fallback ────────────────────────────────────────────────────

    def _translate_with_glossary(self, text: str, source_code: str, target_code: str) -> str:
        """Substitute known craft terms only. Never claims to be a translation."""
        if source_code == "en" and target_code == "te":
            result = text
            for english, telugu in GLOSSARY_EN_TO_TE.items():
                result = re.sub(rf"\b{re.escape(english)}\b", telugu, result, flags=re.IGNORECASE)
            for english, telugu in CONNECTORS_EN_TO_TE.items():
                result = re.sub(rf"\b{re.escape(english)}\b", telugu, result, flags=re.IGNORECASE)
            return result

        if source_code == "en" and target_code == "hi":
            result = text
            for english, hindi in GLOSSARY_EN_TO_HI.items():
                result = re.sub(rf"\b{re.escape(english)}\b", hindi, result, flags=re.IGNORECASE)
            for english, hindi in CONNECTORS_EN_TO_HI.items():
                result = re.sub(rf"\b{re.escape(english)}\b", hindi, result, flags=re.IGNORECASE)
            return result
        return text

    # ── Helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _locale(language: str) -> str:
        value = str(language or "").strip().lower()
        names = {"english": "en", "hindi": "hi", "telugu": "te", "tamil": "ta", "bengali": "bn",
                 "marathi": "mr", "kannada": "kn", "gujarati": "gu", "malayalam": "ml"}
        if value in names:
            return names[value]
        code = value.split("-")[0].split("_")[0]
        if code in FLORES_CODES:
            return code
        for name, locale in names.items():
            if name in value:
                return locale
        return "en"

    @staticmethod
    def _split_sentences(text: str, limit: int = 220) -> List[str]:
        """Short inputs translate better than one long run-on passage."""
        parts = [part.strip() for part in re.split(r"(?<=[.!?।])\s+", text) if part.strip()]
        chunks: List[str] = []
        for part in parts or [text]:
            while len(part) > limit:
                cut = part.rfind(" ", 0, limit)
                cut = cut if cut > 0 else limit
                chunks.append(part[:cut].strip())
                part = part[cut:].strip()
            if part:
                chunks.append(part)
        return chunks[:12]


translation_service = TranslationService()
