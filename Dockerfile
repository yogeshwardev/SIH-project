# CraftLink in one image: the built frontend is served by the API, so a
# deployment is one service on one URL.
#
#   docker build -t craftlink .
#   docker run -p 8000:8000 -v craftlink-data:/app/backend craftlink
#
# The AI models (speech, background removal, translation) need roughly 3 GB of
# RAM. On a smaller instance set VOICE_MODEL_PRELOAD=false and
# IMAGE_MODEL_PRELOAD=false: the app still runs, the browser handles speech, and
# the cataloguer falls back to its craft glossary — every response says which
# engine produced it, so nothing silently pretends otherwise.

FROM node:20-slim AS frontend
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim AS runtime
WORKDIR /app

# OpenCV and Pillow need these; ffmpeg decodes the artisan's voice recordings.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libglib2.0-0 libsm6 libxext6 libxrender1 libgl1 ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY tests/ tests/
COPY --from=frontend /build/dist frontend/dist

ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    IMAGE_MODEL_PRELOAD=true \
    VOICE_MODEL_PRELOAD=true

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s \
    CMD python -c "import urllib.request,os;urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\",8000)}/health')"

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
