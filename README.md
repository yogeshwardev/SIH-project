# CraftLink AI

CraftLink is a database-backed artisan e-commerce application. Sellers create a profile, transform their own product photo, answer a short voice or text interview, review generated multilingual copy and a transparent price recommendation, and submit the listing for manual approval. Buyers browse only approved products, place stock-checked cash-on-delivery orders, and track fulfilment with their order number and email.

The repository intentionally contains no seeded storefront products, invented ratings, prefilled customer identities, synthetic sales dashboards, or automatic approval route. Empty databases render honest empty states.

## Product flows

- **Buyer:** search and filter published products, view seller-supplied details, manage a persistent cart, checkout against server-validated stock, and track an order.
- **Seller:** choose or create a seller profile, create an AI-assisted listing, manage real inventory, view orders containing that seller's items, and progress fulfilment.
- **Operations:** manually approve or return pending listings, inspect the complete catalog, and move valid order states.
- **AI listing:** product photo first; then one friendly question per page with Previous/Next controls; Hindi, Telugu, and English question voice; seller confirmation; multilingual listing; evidence-labelled pricing.

## Stack

- React 18, Vite, Tailwind CSS
- FastAPI, Pydantic, SQLAlchemy, SQLite
- Pillow, OpenCV, rembg/U²-Net-compatible segmentation pipeline
- Browser speech recognition for immediate captions, Faster Whisper for recorded audio, Edge neural TTS with browser speech fallback

## Run locally

PowerShell:

```powershell
cd D:\sih
py -3.11 -m venv backend\venv
.\backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal:

```powershell
cd D:\sih\frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` and `/uploads` to the backend.

## Configuration

Copy `backend/.env.example` to `backend/.env`. Important settings include:

- `DATABASE_URL`
- `CORS_ORIGINS`
- image model preload and fast-accept thresholds
- local Whisper fast and accuracy models
- optional OpenAI provider credentials

Keep credentials out of Git. The default local configuration does not require a cloud AI key.

## Verification

```powershell
cd D:\sih
.\backend\venv\Scripts\python.exe -m pytest tests\test_backend.py -q
cd frontend
npm run build
```

The backend suite uses an isolated in-memory database and does not seed or modify the live catalog.

## Pricing semantics

The price result is a recommendation, not a guaranteed market valuation. It starts with the seller's material, labour, and packaging costs. If the live database contains published products in the same category, their prices are used as explicitly counted comparables. With no comparable records, the UI says so and requires human review. No synthetic benchmark dataset or pre-trained synthetic-price model is bundled.

## Production boundary

Core catalog, inventory, COD checkout, order tracking, and fulfilment are functional. Before public internet deployment, add authenticated buyer/seller/admin accounts, role-based authorization, a production database and migrations, carrier integration, tax/shipping rules, notification delivery, object storage, observability, and a PCI-compliant payment gateway. Online payment is deliberately not shown as working until a gateway exists.
