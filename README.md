# CraftLink AI — From Handmade to Market-Ready in Minutes
### Smart India Hackathon Prototype (SIH26090)
**Ministry**: Ministry of Social Justice and Empowerment  
**Category**: Software | AI / ML / Social Impact  

---

## 1. Problem & Solution

Rural Indian artisans and handloom weavers create exquisite heritage products but struggle to sell digitally due to:
1. Poor product photography against cluttered backgrounds.
2. Language barriers and inability to write professional e-commerce listings.
3. Lack of understanding of SEO keywords, technical specifications, and digital marketing.
4. Distress pricing and exploitation by intermediaries who undervalue artisan labor.

**CraftLink AI** removes the digital barrier completely:  
**The artisan does not need to learn e-commerce.**  
**The core workflow is: TAKE A PHOTO + SPEAK NATURALLY $\rightarrow$ AI CREATES A MARKET-READY PRODUCT.**

---

## 2. Architecture & Pipeline

```mermaid
flowchart TD
    A[Artisan Mobile/Web App] --> B[FastAPI Backend]

    B --> C[Image AI - Computer Vision]
    B --> D[Speech AI - Audio Transcription]
    B --> E[Product Intelligence - NLP Extraction]
    B --> F[Listing Generation - Multilingual GenAI]
    B --> G[Smart Pricing - Random Forest ML + Economics]

    C --> H[Studio Enhanced Image]
    D --> I[Multilingual Transcript]
    E --> J[Structured Metadata]
    F --> K[English + Hindi + Telugu Listings]
    G --> L[Transparent Fair Price]

    H --> M[(SQLite Database)]
    I --> M
    J --> M
    K --> M
    L --> M

    M --> N[Artisan Catalog]
    M --> O[Buyer Marketplace]
    M --> P[Admin & Impact Analytics]
    M --> Q[CSV & JSON Export]
```

---

## 3. AI Models & Technologies Used

| Module | Model / Technology | Why Chosen & Implementation Details |
| :--- | :--- | :--- |
| **Image AI** | **U2NetP → BiRefNet-General-Lite cascade + Intel OpenVINO + Studio Compositor** | A calibrated mask gate returns clear product photos through the low-latency model and escalates cluttered/thin objects to BiRefNet. Component coherence, geometry, and edge certainty are reported separately; foreground-aware color correction and a soft shadow produce a 1200 × 1200 catalog image. |
| **Speech AI** | **Browser Dictation + Faster Whisper `base` → `small` cascade (CPU int8) + Interactive Product Interview** | Live captions are immediate. Recorded audio uses the fast local model first and invokes the accuracy model only below the word-confidence threshold. Product understanding reaches 99% only after the artisan confirms the extracted facts. |
| **Product Intelligence** | **Evidence-Gated Entity & Cost Collector** | Retains facts across turns, identifies missing fields, and blocks pricing until identity, material, production time, material cost, labor, and packaging are confirmed. |
| **Listing GenAI** | **Bilingual Multilingual Engine (EN + HI)** | Generates marketplace titles, summaries, storytelling heritage narratives, bullet specifications, and SEO tags. (Supports Gemini/OpenAI/local fallback). |
| **Pricing Engine** | **Random Forest + Gradient Boosting Ensemble + Fair-Trade Economics** | Blends confirmed direct costs with craft benchmarks, reports benchmark coverage and similarity confidence, exposes assumptions, and flags unfamiliar products for human review. |

---

## 4. Beginner-Friendly Quickstart Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**

### Step 1: Clone or Navigate to Directory
```powershell
cd d:\sih
```

### Step 2: Set Up Backend Virtual Environment
```powershell
# Create Python virtual environment
python -m venv backend/venv

# Activate virtual environment (Windows PowerShell)
.\backend\venv\Scripts\Activate.ps1

# Upgrade pip & install backend dependencies
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
```

### Step 3: Seed Database & Train ML Model
```powershell
# Populate authentic GI crafts, master artisans, and sample visual assets
python -m backend.app.database.seed

# Train the Random Forest pricing regressor
python -m backend.app.ml.training
```

### Step 4: Run AI Evaluation & Backend Tests
```powershell
# Run model evaluation metrics (MAE, RMSE, R², F1 score)
python backend/evaluation.py

# Run Pytest suite
pytest tests/test_backend.py -v
```

### Step 5: Start the Backend Server
```powershell
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
> Backend API will be running at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`)

### Step 6: Start the Frontend Application
Open a new terminal window:
```powershell
cd d:\sih\frontend
npm install
npm run dev
```
> Open your browser at: `http://localhost:5173`

---

## 5. Environment Variables Configuration

Copy `backend/.env.example` to `backend/.env` if you wish to configure optional cloud LLMs:

```ini
# ==========================================
# CraftLink AI Configuration
# ==========================================
PROJECT_NAME="CraftLink AI"
API_PREFIX="/api"

# AI Provider: "local" (default built-in zero-dependency AI engine), "gemini", "openai"
AI_PROVIDER=local

# Optional Cloud API Keys (Leave blank to use robust built-in local engine)
GEMINI_API_KEY=
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-4.1-mini
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=coral
IMAGE_SEGMENTATION_MODEL=birefnet-general-lite
IMAGE_FAST_SEGMENTATION_MODEL=u2netp
IMAGE_FAST_ACCEPT_CONFIDENCE=0.95
IMAGE_MODEL_PRELOAD=true
IMAGE_ENABLE_OPENVINO=true
LOCAL_WHISPER_FAST_MODEL=base
LOCAL_WHISPER_MODEL=small
LOCAL_WHISPER_FAST_ACCEPT_CONFIDENCE=0.84
VOICE_MODEL_PRELOAD=true

HOST=0.0.0.0
PORT=8000
```

---

## 6. SIH Live Demo Flow (< 2 Minutes)

1. Open `http://localhost:5173`.
2. Click **"SIH Demo"** or pick any craft preset (**Banarasi Saree**, **Blue Pottery**, **Bamboo Basket**, **Dhokra Art**, or **Wooden Toy**).
3. **Step 1 (Photo Studio)**: Drag the interactive **Before/After Split Slider** to showcase background removal and studio lighting.
4. **Step 2 (Interactive Voice AI)**: Choose Hindi, Telugu, or English. Answer six friendly questions one at a time, checking each answer before tapping **Save & Next**.
5. **Step 3 (AI Understanding)**: Confirm the summary, then verify that **Your Description** preserves the artisan's exact words.
6. **Step 4 (Listing Studio)**: Toggle between **English, Hindi, and Telugu listings**, specifications, and SEO keywords.
7. **Step 5 (Smart Pricing)**: Show the full **"Why this price?"** economic breakdown and ML market reference range.
8. **Step 6 (Publish & Impact)**: Publish to catalog, explore the **Buyer Marketplace**, and download **CSV / JSON export files**.

---

## 7. Known Limitations & Technical Honesty

- **Prototype Pricing Dataset**: ML pricing is trained on 30 benchmark craft cluster records. In production, expansion to 10,000+ cluster transaction records is planned.
- **Connectivity**: Local fallback algorithms provide full offline capability; cloud LLMs offer richer regional dialects when internet is present.
- **Confidence Semantics**: Acoustic word probability and image-mask quality are measured values and are never forced to 95%. The 99% product-understanding badge means the artisan explicitly confirmed the extracted identity and cost facts; it is not a claim that every audio token was recognized with 99% probability.
- **Physical Verification**: AI assists in metadata extraction, but final GI tagging certification remains governed by authorized craft councils.

---

## 8. Future Roadmap

- **Phase 2**: Open Network for Digital Commerce (**ONDC**) direct protocol adaptor.
- **Phase 3**: Government e-Marketplace (**GeM**) & Tribal Co-operative Marketing Federation (**TRIFED**) integration.
- **Phase 4**: Real-time artisan craft provenance tracking using tamper-evident QR certificates.
- **Phase 5**: WhatsApp Voice Bot for ultra-low digital literacy access in remote rural areas.
