# CraftLink AI — Engineering Handover

Updated: 28 August 2026

## Current state

CraftLink now runs as a real persisted marketplace rather than a seeded presentation. The live SQLite database was cleaned of seed/test sellers, products, and inquiries after a recoverable backup was written to `backend/backups/craftlink-pre-production-cleanup-20260828.db`. A new installation and the current database both start with zero storefront records.

The active UI has three connected surfaces:

1. Buyer marketplace: published products only, real stock, cart, server-calculated COD checkout, and order tracking.
2. Seller workspace: explicit seller profile, AI listing flow, real inventory, seller-scoped orders, and fulfilment actions.
3. Marketplace operations: manual listing approval, complete catalog, and valid order-state transitions.

## Active architecture

```text
React/Vite
  ├─ BuyerDashboardPage → products, cart, checkout, tracking
  ├─ SellerWorkspacePage → profiles, AI listing, inventory, orders
  └─ AdminPortalPage → approvals, catalog, order operations
          │
          ▼ /api and /uploads
FastAPI
  ├─ products.py   image AI, extraction, listing, pricing, CRUD
  ├─ speech.py     transcription, neural question voice, interview
  ├─ artisans.py   seller profiles
  ├─ orders.py     atomic checkout, tracking, status transitions
  ├─ admin.py      manual listing review
  ├─ dashboard.py  database-derived metrics
  └─ export.py     database-derived CSV/JSON
          │
          ▼
SQLite: artisans, products, orders, order_items
```

Legacy inquiry endpoints, auto-approval, demo catalog modules, seed scripts, synthetic pricing data/model, and demonstration pages were removed from the active project.

## Data guarantees

- Product creation requires an existing `artisan_id` and exact `stock_quantity`.
- New products are always `Pending Approval`; a client cannot publish directly.
- Approval requires original and enhanced image URLs, a positive price, and a manual review note.
- Buyer listing calls default to `Published` products.
- Checkout reloads products on the server, rejects unpublished or insufficient-stock items, recalculates prices, saves the order and line-item snapshots, and deducts stock in one transaction.
- Cancelling an eligible order restores stock. COD becomes paid only when delivered.
- Tracking requires both order number and normalized checkout email.
- Seller and operations metrics are calculated from persisted products and orders.

## AI listing workflow

The seller must select a real profile first. The listing sequence is:

1. Upload one real JPG/PNG/WebP product photo.
2. Review original/enhanced comparison and choose Hindi, Telugu, or English.
3. Answer one question at a time. Questions cover the seller's own description, material, production time, and per-unit material/labour/packaging costs.
4. Use Previous/Next; answers can be spoken or typed. The assistant speaks each question through neural TTS when available and browser speech synthesis otherwise.
5. Confirm extracted facts; edit any field; review English/Hindi/Telugu listing copy.
6. Review the cost calculation and live comparable count, enter exact stock, then submit for manual approval.

Confidence values are measured pipeline signals, not marketing guarantees. Image confidence comes from mask geometry/coherence/edge measurements. Audio confidence comes from word and language probabilities. Seller confirmation is a separate boolean and is not converted into a 99% accuracy badge.

## Pricing

The removed model was trained on generated reference rows and therefore could not support a production accuracy claim. The replacement is evidence-gated:

- required basis: seller-entered material, labour, and packaging cost;
- cost target: transparent operating-margin calculation;
- optional evidence: persisted published same-category prices, with exact sample count;
- no evidence: clearly says no market-comparable claim is made;
- fewer than three comparables: `requires_human_review=true`.

See `docs/pricing_model.md`.

## API additions

- `GET/POST /api/artisans`
- `POST /api/orders/checkout`
- `GET /api/orders`
- `GET /api/orders/track/{order_number}?email=...`
- `PUT /api/orders/{order_number}/status`

Existing product, speech, review, dashboard, and export APIs remain under `/api`.

## Verification

```powershell
cd D:\sih
.\backend\venv\Scripts\python.exe -m pytest tests\test_backend.py -q
cd frontend
npm run build
```

Tests run against an in-memory SQLite database. Browser verification should cover empty marketplace, seller profile creation, photo-first listing, spoken question playback, one-question layout, manual review, stock-aware checkout, tracking, and order progression.

## Deployment work still required

Do not describe the current local build as internet-production-ready. It lacks authenticated accounts and role authorization, so seller and operations identity is only a local workspace selection. Before public deployment add:

- authentication, sessions, password/account recovery, and admin RBAC;
- PostgreSQL and schema migrations;
- gateway-backed online payments and webhook reconciliation;
- carrier rates, shipment labels, tracking events, tax rules, returns/refunds;
- email/SMS/WhatsApp notification provider;
- object storage, malware scanning, retention controls, backups, monitoring, and audit logs;
- privacy/terms/returns content and accessibility/security review.

The UI deliberately labels unavailable integrations instead of simulating success.
