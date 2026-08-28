import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Response
from starlette.concurrency import run_in_threadpool
from backend.app.config import settings
from backend.app.schemas.product import (
    ProductInterviewRequest,
    ProductInterviewResponse,
    SpeechTranscribeResponse,
    SpeechSynthesizeRequest,
)
from backend.app.services.product_interview_service import product_interview_service
from backend.app.services.speech_service import speech_service
from backend.app.utils.helpers import sanitize_filename

router = APIRouter(prefix="/speech", tags=["Speech Recognition AI"])

ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".aac", ".flac"}

@router.post("/transcribe", response_model=SpeechTranscribeResponse)
async def transcribe_speech(
    file: UploadFile = File(...),
    language_hint: Optional[str] = Form(None)
):
    """
    Transcribes audio recording from artisan:
    - Supports WAV, MP3, WebM (browser mic), M4A, OGG
    - Detects language (Hindi, English, Regional)
    - Returns transcribed text & speech confidence score
    """
    ext = Path(file.filename).suffix.lower()
    # WebM from browser MediaRecorder or raw files
    if not ext or ext not in ALLOWED_AUDIO_EXTENSIONS:
        ext = ".webm"

    safe_name = f"{uuid.uuid4().hex[:10]}_{sanitize_filename(file.filename or 'recording.webm')}"
    if not safe_name.endswith(ext):
        safe_name += ext

    filepath = settings.UPLOAD_DIR / safe_name
    max_bytes = settings.MAX_AUDIO_SIZE_MB * 1024 * 1024
    size = 0
    with open(filepath, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > max_bytes:
                buffer.close()
                filepath.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail=f"Audio exceeds {settings.MAX_AUDIO_SIZE_MB}MB limit.")
            buffer.write(chunk)

    try:
        result = speech_service.transcribe_audio(str(filepath), hint_language=language_hint)
        return SpeechTranscribeResponse(
            transcript=result["transcript"],
            detected_language=result["detected_language"],
            confidence=result["confidence"],
            audio_duration_seconds=result["audio_duration_seconds"],
            processing_time_seconds=result["processing_time_seconds"],
            realtime_factor=result["realtime_factor"],
            engine=result["engine"],
            confidence_details=result.get("confidence_details", {}),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE if "not configured" in str(e).lower() else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech transcription failed: {str(e)}"
        )

@router.post("/synthesize")
async def synthesize_speech(req: SpeechSynthesizeRequest):
    try:
        audio = await run_in_threadpool(
            speech_service.synthesize_speech,
            req.text.strip(),
            req.language or "hi-IN",
        )
        return Response(content=audio, media_type="audio/mpeg", headers={"Cache-Control": "no-store"})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE if "not configured" in str(e).lower() else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voiceover failed: {str(e)}",
        )

@router.post("/product-interview", response_model=ProductInterviewResponse)
async def continue_product_interview(req: ProductInterviewRequest):
    """Run one evidence-gated turn of the artisan product interview."""
    try:
        return product_interview_service.continue_interview(
            utterance=req.utterance,
            conversation_transcript=req.conversation_transcript or "",
            language=req.language or "Hindi",
            detected_objects=req.detected_objects,
            known_attributes=req.known_attributes,
            cost_inputs=req.cost_inputs,
            last_question_key=req.last_question_key,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Product interview failed: {str(e)}")

@router.get("/capabilities")
async def speech_capabilities():
    cloud_enabled = settings.AI_PROVIDER.lower() == "openai" and bool(settings.OPENAI_API_KEY)
    return {
        "cloud_transcription": cloud_enabled,
        "local_transcription": speech_service.local_transcription_available(),
        "local_transcription_model": settings.LOCAL_WHISPER_MODEL if speech_service.local_transcription_available() else None,
        "local_fast_model": settings.LOCAL_WHISPER_FAST_MODEL if speech_service.local_transcription_available() else None,
        "local_model_strategy": "fast-first-confidence-fallback",
        "local_fast_accept_confidence": settings.LOCAL_WHISPER_FAST_ACCEPT_CONFIDENCE,
        "cloud_voiceover": cloud_enabled,
        "neural_voiceover": cloud_enabled or speech_service.neural_voiceover_available(),
        "neural_voice_languages": ["Telugu", "Hindi", "English", "Tamil", "Bengali", "Marathi"],
        "browser_dictation_fallback": True,
        "browser_voiceover_fallback": True,
        "guided_product_interview": True,
        "evidence_gated_pricing": True,
        "human_verified_understanding_confidence": 0.99,
    }
