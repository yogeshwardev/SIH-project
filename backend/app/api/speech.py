import os
import shutil
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Response
from backend.app.config import settings
from backend.app.schemas.product import SpeechTranscribeResponse, SpeechSynthesizeRequest
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
            audio_duration_seconds=result["audio_duration_seconds"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE if "not configured" in str(e).lower() else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech transcription failed: {str(e)}"
        )

@router.post("/synthesize")
async def synthesize_speech(req: SpeechSynthesizeRequest):
    try:
        audio = speech_service.synthesize_speech(req.text.strip(), req.language or "hi-IN")
        return Response(content=audio, media_type="audio/mpeg", headers={"Cache-Control": "no-store"})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE if "not configured" in str(e).lower() else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voiceover failed: {str(e)}",
        )

@router.get("/capabilities")
async def speech_capabilities():
    cloud_enabled = settings.AI_PROVIDER.lower() == "openai" and bool(settings.OPENAI_API_KEY)
    return {
        "cloud_transcription": cloud_enabled,
        "cloud_voiceover": cloud_enabled,
        "browser_dictation_fallback": True,
        "browser_voiceover_fallback": True,
    }
