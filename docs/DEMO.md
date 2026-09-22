# Running the demo

Everything below is real: the app talks to its own API, the AI runs locally, and
no screen is a mock-up.

## Before you start

```bash
# 1. backend (first run downloads the models; give it two minutes)
python backend/scripts/download_translation_model.py
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

# 2. frontend
npm --prefix frontend run dev            # development
npm --prefix frontend run build          # or build once and let the API serve it at :8000

# 3. demo data — a populated artisan so the first screen is not empty
python backend/scripts/seed_demo.py
```

Accounts (the login route looks the person up; it does not check a password yet):

| Who | Sign in with | Sees |
|---|---|---|
| Artisan | `demo.artisan@craftlink.in` · role **seller** | Mithila Art House: 3 listings, 2 orders, 2 bulk enquiries |
| Operations | admin ID `OPS-1`, access key anything | Review queue, catalogue, stores, reports, **Impact** |
| Buyer | any email at checkout | Marketplace, cart, order tracking |

Reset afterwards: `python backend/scripts/seed_demo.py --remove`

**Start the backend at least two minutes before you present.** The speech,
background-removal and translation models load on boot; until they are warm the
first listing takes ~20 seconds instead of ~4.

---

## Three minutes, in order

Have two browser windows open: **artisan** (signed in as the demo artisan) and
**buyer** (signed out, on the marketplace).

### 0:00 — The problem, on one screen (20s)
Open the marketplace. Say the line that matters:

> "Every one of these was listed by an artisan who cannot write an English
> product description. They get three days at a fair, twice a year. This is the
> other 360 days."

### 0:20 — Photograph and catalogue, in their language (70s)
Artisan window → **Add a product**.

1. Pick **ಕನ್ನಡ** (or your own language) as the answer language. *The whole page
   changes — questions, buttons, examples, voice.*
2. **Take a photo now** → shoot the craft item on the table. The background is
   removed and the light corrected in front of them.
3. Answer the questions **by voice, in that language**. Speak one; type the rest
   for time.
4. On the review screen, point at:
   - the **English and Hindi listing** — "she never said an English word"
   - **How buyers will find this**: SEO title, meta description, search words
   - the line under it: *"Translated from your own words in Kannada"*

### 1:30 — The price, explained (35s)
Continue to the price screen.

> "This is where artisans lose money — they guess, and they guess low."

Point at **What we saw in your photo and words**: detail density, colour tones,
premium material, each with the rupee effect it had. Then at the cost
breakdown: *material, labour, packing, what she earns.* Nothing hidden.

### 2:05 — The buyer, and the wholesale buyer (40s)
Buyer window → open any product → **Buying in bulk? Ask the artisan for a
quote**. Fill it as a government emporium, 200 pieces, send.

Artisan window → **Bulk enquiries** → the enquiry is there → **Send my price**
→ ₹12,500 × 200 = ₹25,00,000 quoted back.

> "A fair takes three days and reaches one city. This took eleven seconds."

### 2:45 — What it adds up to (15s)
Operations window → **Impact**. Artisans onboarded, live listings, earnings,
bulk value, reach by state, languages. Then the two buttons:
**ONDC catalogue (JSON)** and **GeM upload sheet (CSV)** — click one, show the
file.

> "Every number counted from real records. No orders means it says zero."

---

## If something fails on stage

| Problem | What to do |
|---|---|
| Voice does not play | The browser voice takes over after 6 seconds. Keep talking; it will speak. |
| Microphone blocked | Type the answers. The flow is identical. |
| Listing is slow | The models are still loading. Use a product you listed earlier. |
| No internet | Everything above works offline except the fonts. The models are local. |

## What to say if asked what is not built

Say it plainly — it reads as engineering judgement, not weakness:

- The ONDC and GeM files are **data feeds in their format**, not certified
  network integrations.
- Payments are **cash on delivery**; online payment and automatic bank
  settlement are not live.
- Translation is NLLB-200 600M running locally; it is good, not perfect, and a
  craft glossary protects the trade's vocabulary.
- The pricing model learns from a reference price set; the photo and description
  signals adjust it within a bounded, explained range.
