# CraftLink AI — System Architecture (SIH26090)

CraftLink AI is an end-to-end AI-driven market linkage and smart cataloging platform designed for rural Indian artisans and handloom weavers under the Ministry of Social Justice and Empowerment.

## High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Artisan & Buyer Client Layer"]
        A1["📸 Raw Photo Capture"]
        A2["🎙️ Native Voice Input (Hindi/Indic)"]
        UI["Modern Web / Mobile App (React + Tailwind)"]
        A1 --> UI
        A2 --> UI
    end

    subgraph APILayer ["FastAPI Backend Engine (:8000)"]
        Router["API Gateway / Routers"]
        UI <-->|REST / JSON| Router
        
        Router --> ImgSvc["Image AI Service (Computer Vision)"]
        Router --> SpchSvc["Speech AI Service (Speech-to-Text)"]
        Router --> ExtSvc["Product Intelligence (NLP Extraction)"]
        Router --> ListSvc["Multilingual Listing Engine (GenAI)"]
        Router --> PriceSvc["Smart Pricing Engine (ML + Cost Model)"]
    end

    subgraph AIPipeline ["Core AI / ML Services"]
        ImgSvc --> CV["CLAHE + U2Net / GrabCut + Studio Backdrop"]
        SpchSvc --> STT["Acoustic Transcription & Language Detection"]
        ExtSvc --> NLP["Zero-Hallucination Entity Parser"]
        ListSvc --> GEN["Bilingual Listing Generator (EN + HI)"]
        PriceSvc --> RF["Random Forest Regressor (reference_prices.csv)"]
    end

    subgraph DataLayer ["Persistence & Export Layer"]
        DB[("SQLite Database (craftlink.db)")]
        MediaStore["Local /uploads/ Directory"]
        
        CV --> MediaStore
        NLP --> DB
        GEN --> DB
        RF --> DB
        
        DB --> CatalogView["Artisan Catalog View"]
        DB --> BuyerMarket["Buyer Marketplace Portal"]
        DB --> AdminView["Impact & Admin Dashboard"]
        DB --> ExportCSV["RFC4180 CSV Export"]
        DB --> ExportJSON["Structured ONDC JSON Export"]
    end

    classDef ai fill:#fef3c7,stroke:#d97706,stroke-width:2px;
    classDef client fill:#f0fdf4,stroke:#16a34a,stroke-width:2px;
    classDef db fill:#eff6ff,stroke:#2563eb,stroke-width:2px;

    class CV,STT,NLP,GEN,RF ai;
    class UI,A1,A2 client;
    class DB,MediaStore,ExportCSV,ExportJSON db;
```

---

## Data Flow & Processing Pipeline

1. **Artisan Intake (Zero Tech Barrier)**:
   - Artisan takes a raw photograph of their craft on any messy surface (bedsheet, floor, cluttered workshop).
   - Artisan taps the microphone and speaks naturally in Hindi, English, or their regional dialect.
2. **Computer Vision Enhancement**:
   - `ImageService` applies Contrast-Limited Adaptive Histogram Equalization (CLAHE) on the L-channel of the LAB color space to lift dark shadows and reveal fine weave/carving textures.
   - Foreground segmentation isolates the craft from cluttered backgrounds and composites it onto a studio-grade neutral background with soft ambient grounding shadows.
3. **Speech-to-Text & Language Detection**:
   - `SpeechService` decodes the audio stream (WAV, MP3, WebM) and transcribes artisan speech with language identification.
4. **Anti-Hallucination Product Intelligence**:
   - `ProductIntelligenceService` maps spoken entities to structured craft taxonomy (`category`, `material`, `craft_type`, `technique`, `dimensions`, `production_time`, `region`).
   - Fields not mentioned by the artisan are strictly preserved as `"Not specified (Needs Confirmation)"` rather than hallucinated.
5. **Multilingual Listing Generation**:
   - `ListingService` generates high-converting e-commerce product titles, short marketplace summaries, storytelling rich descriptions, bulleted technical specifications, and SEO discovery tags in English and Hindi.
6. **Smart Fair-Trade Pricing Engine**:
   - Blends direct production economics (`Material Cost + Labor Cost + Packaging`) with craft complexity multipliers and a trained **Scikit-Learn Random Forest Regressor** trained on authentic Indian craft benchmark records (`reference_prices.csv`).
   - Computes minimum sustainable price, recommended fair-trade range, and suggested retail price with a complete "Why this price?" transparent reasoning breakdown.
7. **Artisan Verification & Digital Distribution**:
   - Artisan reviews confidence scores, edits any attribute if desired, and confirms publication into the digital catalog, buyer marketplace, and CSV/JSON export feeds.
