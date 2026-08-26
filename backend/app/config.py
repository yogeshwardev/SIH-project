import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "CraftLink AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Storage paths
    BASE_DIR: Path = BASE_DIR
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    DATA_DIR: Path = BASE_DIR / "data"
    MODELS_DIR: Path = BASE_DIR / "saved_models"
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/craftlink.db"
    
    # AI Providers (Optional external API keys; system has full local intelligence fallback)
    AI_PROVIDER: str = "local"  # "local", "gemini", "openai", "groq"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    OPENAI_TRANSCRIPTION_MODEL: str = "gpt-4o-mini-transcribe"
    OPENAI_TTS_MODEL: str = "gpt-4o-mini-tts"
    OPENAI_TTS_VOICE: str = "coral"
    GROQ_API_KEY: str = ""
    
    # Image enhancement config
    MAX_IMAGE_SIZE_MB: int = 15
    MAX_AUDIO_SIZE_MB: int = 25
    
    # Host & Port
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.MODELS_DIR, exist_ok=True)
