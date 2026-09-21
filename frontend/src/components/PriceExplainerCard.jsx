import React, { useEffect, useState } from 'react';
import { AlertTriangle, Calculator, ChevronDown, Camera, Info, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const inr = (value) => '₹' + Math.round(Number(value) || 0).toLocaleString('en-IN');
const COST_FIELDS = [['material_cost', 'Materials'], ['labor_cost', 'Your labour'], ['packaging_cost', 'Packaging']];

export default function PriceExplainerCard({ pricingData, onUpdateCost, currentCosts }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [costs, setCosts] = useState({});
  useEffect(() => {
    setCosts({
      material_cost: currentCosts?.material_cost ?? 0,
      labor_cost: currentCosts?.labor_cost ?? 0,
      packaging_cost: currentCosts?.packaging_cost ?? 0,
      production_time: currentCosts?.production_time || '',
    });
  }, [currentCosts]);

  if (!pricingData) return null;

  const suggested = Number(pricingData.suggested_price || 0);
  const totalCost = Number(pricingData.total_cost ?? COST_FIELDS.reduce((sum, [key]) => sum + Number(costs[key] || 0), 0));
  const earnings = suggested - totalCost;
  const confidence = Math.round((pricingData.pricing_confidence_score || 0) * 100);
  const signals = pricingData.craft_signals || [];
  const rows = [...COST_FIELDS.map(([key, label]) => ({ key, label, value: Number(costs[key] || 0) })), { key: 'earnings', label: 'You earn', value: Math.max(0, earnings), highlight: true }];

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
        <div>
          <p className="text-sm text-ink-500">{t('Suggested selling price')}</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-ink-950">{inr(suggested)}</p>
          {(pricingData.recommended_min_price || pricingData.recommended_max_price) && (
            <p className="mt-1 text-sm text-ink-600">{t('Fair range')} {inr(pricingData.recommended_min_price)} – {inr(pricingData.recommended_max_price)}</p>
          )}
        </div>
        <button type="button" onClick={() => setEditing(!editing)} className="btn btn-secondary"><Calculator className="h-4 w-4" />{t(editing ? 'Close' : 'Adjust my costs')}</button>
      </div>

      {editing && (
        <div className="grid gap-3 border-b border-line bg-paper-50 p-5 sm:grid-cols-4 sm:p-6">
          {COST_FIELDS.map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`cost-${key}`} className="label">{t(label)}</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">₹</span>
                <input id={`cost-${key}`} type="number" min="0" inputMode="numeric" value={costs[key]} onChange={(event) => setCosts({ ...costs, [key]: Math.max(0, parseFloat(event.target.value) || 0) })} className="field pl-7 tabular-nums" />
              </div>
            </div>
          ))}
          <div className="flex items-end">
            <button type="button" onClick={() => { setEditing(false); onUpdateCost?.(costs); }} className="btn btn-primary w-full">{t('Recalculate')}</button>
          </div>
        </div>
      )}

      <div className="p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-ink-950">{t('Where the money goes')}</h3>
        <ul className="mt-4 space-y-3.5">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="flex items-baseline justify-between text-sm">
                <span className={row.highlight ? 'font-semibold text-ink-950' : 'text-ink-700'}>{t(row.label)}</span>
                <span className={`tabular-nums ${row.highlight ? 'font-semibold text-ink-950' : 'text-ink-800'}`}>{inr(row.value)} <span className="text-xs font-normal text-ink-500">{suggested > 0 ? Math.round((row.value / suggested) * 100) : 0}%</span></span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-200">
                <div className={`h-full rounded-full ${row.highlight ? 'bg-clay-500' : 'bg-brand-700'}`} style={{ width: `${suggested > 0 ? Math.min(100, (row.value / suggested) * 100) : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
        {earnings < 0 && <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800"><AlertTriangle className="h-4 w-4" />{t('This price is below your costs.')}</p>}

        {signals.length > 0 && (
          <section className="mt-6 rounded-xl border border-line bg-paper-50 p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-ink-950">
              <Camera className="h-4 w-4 text-clay-500" />
              {t(pricingData.photo_analysed ? 'What we saw in your photo and words' : 'What we read in your words')}
            </h4>
            <ul className="mt-3 space-y-2">
              {signals.map((signal) => (
                <li key={signal.label} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-ink-700">
                    <span className="font-medium text-ink-900">{t(signal.label)}</span>
                    <span className="block text-xs text-ink-500">{signal.detail}</span>
                  </span>
                  <span className={`flex-shrink-0 tabular-nums font-semibold ${signal.impact_percentage >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {signal.impact_percentage >= 0 ? '+' : ''}{signal.impact_percentage}%
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Fact label={t('Total cost')} value={inr(totalCost)} />
          <Fact label={t('Comparable products')} value={pricingData.benchmark_sample_count || 0} />
          <Fact label={t('Confidence')} value={`${confidence}%`} tone={pricingData.confidence_level === 'HIGH' ? 'text-emerald-700' : pricingData.confidence_level === 'MEDIUM' ? 'text-amber-700' : 'text-red-700'} />
        </div>
        {pricingData.requires_human_review && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900"><Info className="mt-0.5 h-4 w-4 flex-shrink-0" />{t('There are few similar products to compare with, so our team will double-check this price.')}</p>
        )}

        <div className="mt-5 rounded-xl border border-line">
          <button type="button" onClick={() => setShowWhy(!showWhy)} aria-expanded={showWhy} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ink-900">
            {t('Why this price?')}<ChevronDown className={`h-4 w-4 text-ink-500 transition ${showWhy ? 'rotate-180' : ''}`} />
          </button>
          {showWhy && (
            <div className="space-y-3 border-t border-line px-4 py-4 text-sm leading-relaxed text-ink-700">
              {pricingData.explanation && <p>{pricingData.explanation}</p>}
              {pricingData.assumptions?.length > 0 && <ul className="list-disc space-y-1 pl-5">{pricingData.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>}
              <p className="flex items-start gap-2 text-ink-600"><ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />{t('This is a recommendation. You stay in control and can change the price any time.')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value, tone = 'text-ink-950' }) {
  return (
    <div className="rounded-xl bg-paper-100 px-4 py-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
