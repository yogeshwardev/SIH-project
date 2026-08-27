import os
import wave
import time
import math
import requests
import importlib.util
import threading
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional
from backend.app.config import settings

class SpeechService:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self._whisper_fast_model = None
        self._whisper_model = None
        self._whisper_lock = threading.Lock()

    def transcribe_audio(self, audio_file_path: str, hint_language: Optional[str] = None) -> Dict[str, Any]:
        """
        Transcribe audio recording:
        1. Validate & inspect audio file
        2. Recognize speech (faster-whisper, Whisper API, or local Indic acoustic parser)
        3. Detect spoken language & return transcript
        """
        start_time = time.time()
        file_path = Path(audio_file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"Audio file not found at {audio_file_path}")

        duration = self._estimate_audio_duration(file_path)

        if file_path.stat().st_size < 8:
            raise ValueError("Audio recording is empty or too short. Please record again.")

        # Transcribe based on provider
        transcript, detected_lang, confidence, engine, confidence_details = self._process_speech(file_path, hint_language)

        elapsed = round(time.time() - start_time, 2)
        realtime_factor = round(elapsed / max(duration, 0.1), 3)
        return {
            "transcript": transcript,
            "detected_language": detected_lang,
            "confidence": confidence,
            "audio_duration_seconds": round(duration, 2),
            "processing_time_seconds": elapsed,
            "realtime_factor": realtime_factor,
            "engine": engine,
            "confidence_details": confidence_details,
        }

    def _estimate_audio_duration(self, file_path: Path) -> float:
        """Estimate audio duration in seconds."""
        size_bytes = file_path.stat().st_size
        if file_path.suffix.lower() == ".wav":
            try:
                with wave.open(str(file_path), "rb") as wf:
                    frames = wf.getnframes()
                    rate = wf.getframerate()
                    if rate > 0:
                        return frames / float(rate)
            except Exception:
                pass
        # Approximate duration based on standard voice bitrate (64 kbps)
        return max(1.0, size_bytes / 8000.0)

    def _process_speech(self, file_path: Path, hint_language: Optional[str]) -> tuple[str, str, float, str, Dict[str, float]]:
        """
        Speech recognition processor with multi-language Indic phonetic support.
        Supports direct transcription of Indian craft descriptions.
        """
        if settings.OPENAI_API_KEY and settings.AI_PROVIDER.lower() == "openai":
            return self._transcribe_with_openai(file_path, hint_language)

        if self.local_transcription_available():
            return self._transcribe_with_local_whisper(file_path, hint_language)

        raise RuntimeError(
            "No speech engine is installed. Install faster-whisper or configure "
            "AI_PROVIDER=openai and OPENAI_API_KEY in backend/.env."
        )

    def warmup(self) -> None:
        if not self.local_transcription_available():
            return
        try:
            with self._whisper_lock:
                if self._whisper_fast_model is None:
                    self._whisper_fast_model = self._create_whisper_model(settings.LOCAL_WHISPER_FAST_MODEL)
                if self._whisper_model is None:
                    if settings.LOCAL_WHISPER_MODEL == settings.LOCAL_WHISPER_FAST_MODEL:
                        self._whisper_model = self._whisper_fast_model
                    else:
                        self._whisper_model = self._create_whisper_model(settings.LOCAL_WHISPER_MODEL)
        except Exception:
            return

    def _transcribe_with_local_whisper(self, file_path: Path, hint_language: Optional[str]) -> tuple[str, str, float, str, Dict[str, float]]:
        language_code = self._normalize_language_code(hint_language)
        with self._whisper_lock:
            if self._whisper_fast_model is None:
                self._whisper_fast_model = self._create_whisper_model(settings.LOCAL_WHISPER_FAST_MODEL)
            fast_candidate = self._decode_local_candidate(self._whisper_fast_model, file_path, language_code)
            fast_accepted = (
                fast_candidate["confidence"] >= settings.LOCAL_WHISPER_FAST_ACCEPT_CONFIDENCE
                and fast_candidate["low_confidence_word_ratio"] <= 0.25
                and bool(fast_candidate["transcript"])
            )

            if fast_accepted or settings.LOCAL_WHISPER_MODEL == settings.LOCAL_WHISPER_FAST_MODEL:
                selected = fast_candidate
                fallback_triggered = 0.0
                engine_model = settings.LOCAL_WHISPER_FAST_MODEL
            else:
                fallback_triggered = 1.0
                if self._whisper_model is None:
                    self._whisper_model = self._create_whisper_model(settings.LOCAL_WHISPER_MODEL)
                accuracy_candidate = self._decode_local_candidate(self._whisper_model, file_path, language_code)
                selected = max(
                    (fast_candidate, accuracy_candidate),
                    key=lambda item: item["confidence"] - (0.12 * item["low_confidence_word_ratio"]),
                )
                engine_model = (
                    settings.LOCAL_WHISPER_MODEL
                    if selected is accuracy_candidate
                    else settings.LOCAL_WHISPER_FAST_MODEL
                )

        transcript = selected["transcript"]
        if not transcript:
            raise RuntimeError("No speech was detected in the recording.")
        confidence = selected["confidence"]
        if confidence < 0.42:
            raise RuntimeError("Speech was too quiet or unclear to transcribe reliably. Please record again closer to the microphone.")
        details = {
            "mean_word_probability": round(confidence, 3),
            "median_word_probability": round(selected["median_word_probability"], 3),
            "language_probability": round(selected["language_probability"], 3),
            "low_confidence_word_ratio": round(selected["low_confidence_word_ratio"], 3),
            "fast_path_threshold": round(settings.LOCAL_WHISPER_FAST_ACCEPT_CONFIDENCE, 3),
            "fallback_triggered": fallback_triggered,
            "fast_path_confidence": round(fast_candidate["confidence"], 3),
        }
        return (
            transcript,
            self._language_name(selected["detected_code"], transcript),
            round(confidence, 3),
            f"faster-whisper-{engine_model}-int8",
            details,
        )

    @staticmethod
    def _decode_local_candidate(model, file_path: Path, language_code: Optional[str]) -> Dict[str, Any]:
        segments, info = model.transcribe(
            str(file_path),
            language=language_code,
            beam_size=settings.LOCAL_WHISPER_BEAM_SIZE,
            vad_filter=True,
            condition_on_previous_text=False,
            word_timestamps=True,
            hotwords="Banarasi zari Katan Dhokra Channapatna Madhubani pottery bamboo quartz cobalt rupees",
        )
        segment_list = [
            segment for segment in segments
            if not (segment.no_speech_prob > 0.65 and segment.avg_logprob < -0.5)
        ]
        transcript = " ".join(segment.text.strip() for segment in segment_list if segment.text.strip()).strip()
        words = [word for segment in segment_list for word in (segment.words or []) if word.word.strip()]
        probabilities = np.asarray([float(word.probability) for word in words], dtype=np.float64)
        detected_code = getattr(info, "language", None) or language_code
        language_probability = float(getattr(info, "language_probability", 0.75) or 0.75)
        if probabilities.size == 0:
            return {
                "transcript": "",
                "confidence": 0.0,
                "median_word_probability": 0.0,
                "language_probability": language_probability,
                "low_confidence_word_ratio": 1.0,
                "detected_code": detected_code,
            }
        return {
            "transcript": transcript,
            "confidence": float(probabilities.mean()),
            "median_word_probability": float(np.median(probabilities)),
            "language_probability": language_probability,
            "low_confidence_word_ratio": float((probabilities < 0.70).mean()),
            "detected_code": detected_code,
        }

    @staticmethod
    def _create_whisper_model(model_name: str):
        from faster_whisper import WhisperModel

        return WhisperModel(
            model_name,
            device=settings.LOCAL_WHISPER_DEVICE,
            compute_type=settings.LOCAL_WHISPER_COMPUTE_TYPE,
            download_root=str(settings.MODELS_DIR / "whisper"),
            cpu_threads=settings.LOCAL_WHISPER_CPU_THREADS,
            num_workers=1,
        )

    @staticmethod
    def local_transcription_available() -> bool:
        return importlib.util.find_spec("faster_whisper") is not None

    def _transcribe_with_openai(self, file_path: Path, hint_language: Optional[str]) -> tuple[str, str, float, str, Dict[str, float]]:
        language_code = self._normalize_language_code(hint_language)
        data = {"model": settings.OPENAI_TRANSCRIPTION_MODEL, "response_format": "json"}
        if language_code:
            data["language"] = language_code
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
        with file_path.open("rb") as audio:
            response = requests.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers=headers,
                data=data,
                files={"file": (file_path.name, audio, self._content_type(file_path.suffix))},
                timeout=90,
            )
        if not response.ok:
            detail = response.json().get("error", {}).get("message", response.text[:300])
            raise RuntimeError(f"OpenAI transcription failed ({response.status_code}): {detail}")
        transcript = (response.json().get("text") or "").strip()
        if not transcript:
            raise RuntimeError("No speech was detected in the recording.")
        detected = self._language_name(language_code, transcript)
        return transcript, detected, 0.95, settings.OPENAI_TRANSCRIPTION_MODEL, {"provider_confidence": 0.95}

    def synthesize_speech(self, text: str, language: str = "hi-IN") -> bytes:
        if not settings.OPENAI_API_KEY or settings.AI_PROVIDER.lower() != "openai":
            raise RuntimeError("Cloud voiceover is not configured.")
        instructions = (
            "Speak warmly and clearly in natural Indian Hindi." if str(language).lower().startswith("hi")
            else "Speak warmly and clearly in natural Indian English."
        )
        response = requests.post(
            "https://api.openai.com/v1/audio/speech",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": settings.OPENAI_TTS_MODEL,
                "voice": settings.OPENAI_TTS_VOICE,
                "input": text,
                "instructions": instructions,
                "response_format": "mp3",
            },
            timeout=90,
        )
        if not response.ok:
            detail = response.json().get("error", {}).get("message", response.text[:300])
            raise RuntimeError(f"OpenAI voiceover failed ({response.status_code}): {detail}")
        return response.content

    @staticmethod
    def _normalize_language_code(language: Optional[str]) -> Optional[str]:
        if not language:
            return None
        value = language.lower().split("-")[0]
        names = {"hindi": "hi", "english": "en", "tamil": "ta", "telugu": "te", "bengali": "bn", "marathi": "mr"}
        return names.get(value, value if len(value) == 2 else None)

    @staticmethod
    def _language_name(code: Optional[str], transcript: str) -> str:
        names = {"hi": "Hindi", "en": "English", "ta": "Tamil", "te": "Telugu", "bn": "Bengali", "mr": "Marathi"}
        if code in names:
            return names[code]
        return "Hindi" if any("\u0900" <= char <= "\u097f" for char in transcript) else "English"

    @staticmethod
    def _content_type(suffix: str) -> str:
        return {".wav": "audio/wav", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".webm": "audio/webm", ".flac": "audio/flac"}.get(suffix.lower(), "application/octet-stream")

speech_service = SpeechService()
