"""Fetch the local neural translation model used by the auto-cataloguer.

CraftLink translates the artisan's own spoken words into English and Hindi.
Doing that with a real model — rather than a phrase table — keeps the meaning
of what they said, and it has to work at a venue with poor connectivity, so the
model runs locally through CTranslate2 (already installed for faster-whisper).

    python backend/scripts/download_translation_model.py

Roughly 600 MB, downloaded once into backend/saved_models/.
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR.parent))

REPO_ID = "JustFrederik/nllb-200-distilled-600M-ct2-int8"
# During a Docker build MODELS_DIR is the default inside the image; on a server
# it is the mounted disk, where the download survives a redeploy. Following the
# setting means the model lands where the app will look for it.
try:
    from backend.app.config import settings

    TARGET = settings.MODELS_DIR / "nllb-200-distilled-600M-ct2-int8"
except Exception:
    TARGET = BASE_DIR / "saved_models" / "nllb-200-distilled-600M-ct2-int8"
REQUIRED = ("model.bin", "config.json", "shared_vocabulary.txt", "tokenizer.json")


def main() -> int:
    from huggingface_hub import snapshot_download

    if all((TARGET / name).exists() for name in REQUIRED):
        print(f"Model already present at {TARGET}")
        return 0

    print(f"Downloading {REPO_ID} -> {TARGET}")
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    snapshot_download(
        repo_id=REPO_ID,
        local_dir=str(TARGET),
        allow_patterns=["*.json", "*.txt", "*.model", "model.bin"],
    )

    missing = [name for name in REQUIRED if not (TARGET / name).exists()]
    if missing:
        print("Download finished but these files are missing:", ", ".join(missing))
        return 1

    size_mb = sum(f.stat().st_size for f in TARGET.rglob("*") if f.is_file()) / 1e6
    print(f"Ready: {TARGET} ({size_mb:.0f} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
