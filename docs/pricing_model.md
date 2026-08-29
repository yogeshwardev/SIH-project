# CraftLink AI — Smart Pricing Engine & Fair-Trade Economic Model

The primary reason rural artisans remain trapped in poverty is **distress pricing** caused by intermediaries and lack of e-commerce market intelligence. CraftLink AI implements a mathematically transparent hybrid pricing algorithm that guarantees a fair living wage.

---

## 1. Mathematical Formulation

### 1. Direct Production Cost ($C_{\text{prod}}$)
$$C_{\text{prod}} = C_{\text{material}} + C_{\text{labor}} + C_{\text{packaging}}$$

Where:
- $C_{\text{material}}$: Raw cost of genuine yarn, silk, natural clay, brass, wood, pigments.
- $C_{\text{labor}}$: Skilled artisan compensation ($T_{\text{hours}} \times \text{Fair Hourly Wage}$).
- $C_{\text{packaging}}$: Eco-friendly shipping and protective materials.

### 2. Minimum Sustainable Price ($P_{\text{min}}$)
To ensure the artisan never suffers a loss:
$$P_{\text{min}} = C_{\text{prod}} \times (1 + \mu_{\text{min}})$$
where $\mu_{\text{min}} = 0.18$ (18% guaranteed survival threshold).

### 3. Craft Complexity Adjusted Cost Price ($P_{\text{cost\_adj}}$)
$$P_{\text{cost\_adj}} = C_{\text{prod}} \times (1 + \mu_{\text{base}}) \times \gamma_{\text{craft}}$$
Where:
- $\mu_{\text{base}} \in [0.25, 0.40]$: Baseline fair-trade margin.
- $\gamma_{\text{craft}} \in [1.05, 1.25]$: Craft technique complexity multiplier (e.g., Banarasi silk kadwa weave or lost-wax Dhokra casting receives a 1.25 multiplier).

### 4. Machine Learning Market Valuation ($P_{\text{ML}}$)
A Random Forest regressor predicts benchmark market tolerance based on reference craft records:
$$P_{\text{ML}} = \mathcal{M}_{\text{RF}}(X_{\text{craft}}, X_{\text{material}}, X_{\text{hours}}, X_{\text{costs}})$$

### 5. Blended Fair-Trade Target ($P_{\text{target}}$)
$$P_{\text{target}} = \max(P_{\text{min}}, 0.60 \cdot P_{\text{cost\_adj}} + 0.40 \cdot P_{\text{ML}})$$

### 6. Recommended Range & Suggested Retail Price
- **Recommended Minimum**: $\lfloor 0.90 \cdot P_{\text{target}} / 50 \rfloor \times 50$
- **Recommended Maximum**: $\lceil 1.15 \cdot P_{\text{target}} / 50 \rceil \times 50$
- **Suggested Price**: Rounded to appealing retail e-commerce numbers (e.g., ending in `₹xx99` or `₹xx50`).

---

## 2. Transparent "Why this price?" Breakdown

For every product, the UI displays a complete audit trail:

| Cost Component | Typical Share (%) | Description |
| :--- | :--- | :--- |
| **Raw Materials** | 25% – 35% | Direct purchase of authentic raw goods |
| **Skilled Artisan Labor** | 45% – 55% | Fair hourly compensation for artisan time |
| **Packaging & Boxes** | 3% – 5% | Shipping-ready protective packaging |
| **Artisan Fair Surplus** | 25% – 40% | Reinvestment into tools, health, and family |

Artisans maintain 100% human-in-the-loop control to modify base costs or override the final price before publishing.
