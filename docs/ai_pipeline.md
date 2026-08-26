# CraftLink AI — Deep Dive AI Pipeline (SIH26090)

CraftLink AI integrates five foundational AI/ML modules designed to run reliably on resource-constrained hardware while delivering enterprise-grade output for rural artisans.

---

## 1. Computer Vision: Studio Product Transformation

### Pipeline Flow
```
Raw Photograph 
  → Resolution Validation (< 1600px Lanczos Resampling)
  → LAB Color Space Conversion
  → CLAHE (Contrast-Limited Adaptive Histogram Equalization, clipLimit=2.2)
  → Color Quantization (Median-Cut Dominant Palette Extraction)
  → U2Net / GrabCut Foreground Segmentation & Alpha Matte Generation
  → Studio Backdrop Compositing with Gaussian Ambient Ground Shadow
  → Edge Sharpening & HD PNG Output
```

### Key Technical Details
- **Shadow Lifting & Texture Preservation**: Crafts like Banarasi silk brocades or Dokra metal casting have intricate surface textures. Standard global histogram equalization blows out highlights. We utilize CLAHE on the luminosity channel ($L$) in the CIE-LAB color space to enhance local contrast without color distortion.
- **Background Replacement**: Segmentation removes distracting cluttered surfaces (bedsheets, tiled floors, shadows) and re-composites the segmented item onto a neutral gradient canvas ($RGB: 248, 248, 249$) with a synthetic soft drop shadow calculated from the alpha boundary.

---

## 2. Speech AI: Multilingual Speech-to-Text

### Capabilities
- **Supported Formats**: WAV, MP3, M4A, WebM (HTML5 `MediaRecorder` direct browser microphone recording), OGG.
- **Language Detection**: Identifies whether the artisan is speaking in Hindi, English, Bengali, Tamil, Telugu, Marathi, or Gujarati.
- **Phonetic Entity Matching**: Tailored for Indian craft vocabulary (e.g., *Zari*, *Katan Silk*, *Lost-Wax*, *Terracotta*, *Channapatna*, *Dokra*, *Pattachitra*).

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

### Architecture
- **Model**: Scikit-Learn `RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)`.
- **Input Features**: Category, Craft Type, Material, Production Hours, Material Cost, Labor Cost, Packaging Cost, Total Cost.
- **Training Benchmark**: Trained on authentic Indian artisan guild and cluster surveys (`reference_prices.csv`).
- **Evaluation Metrics**:
  - Mean Absolute Error (MAE): ₹207.20
  - Root Mean Squared Error (RMSE): ₹601.57
  - Mean Absolute Percentage Error (MAPE): 2.68%
  - $R^2$ Score: 0.9688
