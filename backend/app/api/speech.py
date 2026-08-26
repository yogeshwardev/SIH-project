import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from backend.app.config import settings
from backend.app.schemas.product import SpeechTranscribeResponse
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

    safe_name = sanitize_filename(file.filename or "recording.webm")
    if not safe_name.endswith(ext):
        safe_name += ext

    filepath = settings.UPLOAD_DIR / safe_name
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

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
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech transcription failed: {str(e)}"
        )
