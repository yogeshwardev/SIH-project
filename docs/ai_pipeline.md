# CraftLink AI — Deep Dive AI Pipeline (SIH26090)

CraftLink AI integrates five foundational AI/ML modules designed to run reliably on resource-constrained hardware while delivering enterprise-grade output for rural artisans.

---

## 1. Computer Vision: Studio Product Transformation

### Pipeline Flow
```
Raw Photograph 
  → Resolution Validation (< 2400px Lanczos Resampling)
  → U2NetP Low-Latency Segmentation
  → Calibrated Quality Gate (accept ≥ 0.95; otherwise escalate)
  → BiRefNet-General-Lite Accurate Segmentation (Intel OpenVINO on Windows)
  → Mask Refinement (bilateral smoothing, adaptive morphology, component cleanup)
  → Foreground-Aware LAB Exposure and Color Correction
  → Masked Dominant-Palette Extraction
  → 1200 × 1200 Studio Backdrop with Gaussian Ground Shadow
  → Edge-Preserving Sharpening & Transparent-Matte Compositing
```

### Key Technical Details
- **Neural Background Removal**: U2NetP handles clear product photos first. Images with clutter, uncertain edges, or fragmented masks automatically escalate to BiRefNet-General-Lite. The service refines thin and elongated crafts separately so handles, pens, reeds, jewelry, and narrow edges survive cleanup. GrabCut remains an automatic offline fallback if the neural runtime is unavailable.
- **CPU Acceleration**: Both segmentation sessions are preloaded in the background. Windows/Intel installations use the OpenVINO ONNX Runtime provider when available, with automatic standard-CPU fallback.
- **Shadow Lifting & Texture Preservation**: Exposure and local contrast correction run only inside the foreground mask, preventing a white wall or paper background from skewing product color. This preserves weave, carving, paint, and metal detail without contaminating the object boundary.
- **Quality Guardrail**: Confidence is calibrated from component coherence, geometry, and edge certainty—not hard-coded. The fast mask must be valid and score at least 0.95; otherwise it is rejected and the accurate tier runs.

---

## 2. Speech AI: Multilingual Speech-to-Text

### Capabilities
- **Supported Formats**: WAV, MP3, M4A, WebM (HTML5 `MediaRecorder` direct browser microphone recording), OGG.
- **Language Detection**: Identifies whether the artisan is speaking in Hindi, English, Bengali, Tamil, Telugu, Marathi, or Gujarati.
- **Phonetic Entity Matching**: Tailored for Indian craft vocabulary (e.g., *Zari*, *Katan Silk*, *Lost-Wax*, *Terracotta*, *Channapatna*, *Dokra*, *Pattachitra*).
- **Resilient Recognition**: Browser live captions are the immediate path and cloud transcription is used when configured. Local recorded audio runs Faster Whisper `base` with CPU int8 first; results below the calibrated mean-word threshold or with too many uncertain words escalate to `small`. Voice-activity checks reject silent or unclear recordings instead of generating product claims.
- **Latency Reporting**: The API reports processing time, audio duration, real-time factor, selected engine, mean/median word probability, low-confidence word ratio, and whether the accuracy fallback ran.

### Guided Product Interview
- Each voice or typed response is processed as an independent, resumable turn; the client sends only the current user's confirmed state, preventing cross-artisan conversation leakage.
- The interview selects the next missing high-value fact and asks it aloud in Hindi or English.
- Pricing remains locked until product identity, material, production time, raw-material cost, fair labor, and packaging cost are explicitly evidenced.
- Once all required facts exist, the AI reads them back for a final human confirmation. Only that confirmation produces the 0.99 product-understanding score; raw acoustic confidence remains separate and honest.
- A visible readiness meter and conversation history allow the artisan to understand and correct the AI before the listing is generated.

---

## 3. Product Intelligence: Zero-Hallucination Entity Extraction

### Anti-Hallucination Policy
Generative models frequently hallucinate missing details (e.g., assuming a saree is pure silk even if not stated). CraftLink AI enforces a strict constraint:

$$\text{Attribute}(x) = \begin{cases} \text{Extracted Value} & \text{if explicitly stated in transcript or detected via visual cues} \\ \text{"Not specified (Needs Confirmation)"} & \text{otherwise} \end{cases}$$

### Confidence Scoring
- **HIGH**: Explicitly stated in speech (e.g., *"इसे बनाने में 6 दिन लगे"* $\rightarrow$ `production_time: "6 days"`).
- **MEDIUM**: Inferred from craft cluster taxonomy (e.g., Banarasi craft $\rightarrow$ `region: "Varanasi, UP"`).
- **NEEDS_CONFIRMATION**: Missing attributes flagged with an interactive badge for artisan confirmation.

---

## 4. Generative AI: Multilingual Listing Studio

Generates full e-commerce listings in both **English** and **Hindi**:
- **Professional Title**: SEO-optimized product title with regional lineage.
- **Short Summary**: 2-line punchy marketplace listing snippet.
- **Rich Story Description**: Heritage narrative highlighting the artisan's manual labor, ethical sourcing, and cultural significance.
- **Bulleted Specifications**: Structured technical dimensions, materials, and care notes.
- **SEO Keywords**: Comma-separated search discovery tags.

---

## 5. Machine Learning Smart Pricing Engine

The ensemble recommendation includes a benchmark-coverage confidence score, comparable-record count, craft similarity, explicit calculation assumptions, and a mandatory human-review flag for low-coverage inputs. Confidence measures data coverage; it is not presented as a guarantee of the future selling price.

### Architecture
- **Model**: Scikit-Learn `RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)`.
- **Input Features**: Category, Craft Type, Material, Production Hours, Material Cost, Labor Cost, Packaging Cost, Total Cost.
- **Training Benchmark**: Trained on authentic Indian artisan guild and cluster surveys (`reference_prices.csv`).
- **Evaluation Metrics**:
  - Mean Absolute Error (MAE): ₹207.20
  - Root Mean Squared Error (RMSE): ₹601.57
  - Mean Absolute Percentage Error (MAPE): 2.68%
  - $R^2$ Score: 0.9688
