import React, { useEffect, useState } from 'react';
import { Building2, Download, IndianRupee, Languages, MapPin, Package, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState, Notice, Spinner, StatCard, formatDate, formatINR } from '../../components/ui';

// Every number here is counted from live records. An empty platform shows
// zeros; nothing is projected, and the page says so.
export default function ImpactDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.getImpactSummary()
      .then((summary) => { if (!cancelled) setData(summary); })
      .catch((summaryError) => { if (!cancelled) setError(summaryError.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="card flex items-center justify-center py-16"><Spinner className="h-7 w-7 text-brand-700" /></div>;
  }
  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <EmptyState icon={Users} title={t('No impact data yet')} />;

  const { artisans, catalogue, market, earnings, reach, trend } = data;
  const peak = Math.max(1, ...trend.map((month) => month.earnings));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={t('Artisans onboarded')} value={artisans.onboarded}
          hint={`${artisans.with_live_listings} ${t('selling now')} · ${artisans.earning} ${t('earning')}`} />
        <StatCard icon={Package} label={t('Live listings')} value={catalogue.live_listings}
          hint={`${catalogue.crafts} ${t('crafts')} · ${catalogue.categories} ${t('categories')}`} />
        <StatCard icon={IndianRupee} label={t('Earned by artisans')} value={formatINR(earnings.total_to_artisans)}
          hint={`${t('Platform commission')}: ${formatINR(earnings.platform_commission)}`} />
        <StatCard icon={Building2} label={t('Bulk enquiries')} value={market.bulk_requests}
          hint={`${market.bulk_accepted} ${t('accepted')} · ${formatINR(market.bulk_value_accepted)}`} />
      </div>

      <section className="card card-pad">
        <h3 className="text-base font-semibold text-ink-950">{t('Artisan earnings, last 12 months')}</h3>
        <p className="mt-1 text-sm text-ink-500">{t('Counted from order lines, not estimates')}</p>
        <ol className="mt-5 flex h-40 items-end gap-1.5">
          {trend.map((month) => (
            <li key={month.key} className="flex flex-1 flex-col items-center justify-end gap-1.5" title={`${month.month}: ${formatINR(month.earnings)}`}>
              <span className="w-full rounded-t bg-brand-600/85" style={{ height: `${Math.max(2, (month.earnings / peak) * 100)}%` }} />
              <span className="text-[10px] text-ink-400">{month.month.split(' ')[0]}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card card-pad">
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950"><MapPin className="h-4 w-4 text-clay-500" />{t('Reach by state')}</h3>
          {reach.states.length === 0 ? (
            <p className="mt-3 text-sm text-ink-500">{t('No states recorded yet.')}</p>
          ) : (
            <table className="table-base mt-4">
              <thead><tr><th>{t('State')}</th><th className="text-right">{t('Artisans')}</th><th className="text-right">{t('Live products')}</th><th className="text-right">{t('Earned')}</th></tr></thead>
              <tbody>
                {reach.states.slice(0, 8).map((row) => (
                  <tr key={row.state}>
                    <td className="font-medium text-ink-900">{row.state}</td>
                    <td className="text-right tabular-nums">{row.artisans}</td>
                    <td className="text-right tabular-nums">{row.products}</td>
                    <td className="text-right tabular-nums">{formatINR(row.earnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card card-pad">
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950"><Languages className="h-4 w-4 text-clay-500" />{t('Languages artisans work in')}</h3>
          <ul className="mt-4 space-y-2.5">
            {reach.languages.map((row) => (
              <li key={row.language}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink-700">{t(row.language)}</span>
                  <span className="tabular-nums text-ink-800">{row.artisans}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper-200">
                  <div className="h-full rounded-full bg-clay-400"
                    style={{ width: `${Math.min(100, (row.artisans / Math.max(1, artisans.onboarded)) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card card-pad">
          <h3 className="text-base font-semibold text-ink-950">{t('Verification and payouts')}</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              [t('With a government ID on file'), artisans.with_government_id],
              [t('With bank details for settlement'), artisans.with_bank_details],
              [t('Retail orders delivered'), market.delivered_orders],
              [t('Units sold'), market.units_sold],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-paper-100 px-4 py-3">
                <dt className="text-xs text-ink-500">{label}</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-ink-950">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="card card-pad">
          <h3 className="text-base font-semibold text-ink-950">{t('Government marketplace feeds')}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            {t('Live listings in the shapes ONDC network participants and GeM catalogue uploads expect. These are data feeds generated from real listings, not certified integrations.')}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={api.ondcExportUrl} download className="btn btn-secondary rounded-full"><Download className="h-4 w-4" />{t('ONDC catalogue (JSON)')}</a>
            <a href={api.gemExportUrl} download className="btn btn-secondary rounded-full"><Download className="h-4 w-4" />{t('GeM upload sheet (CSV)')}</a>
          </div>
        </section>
      </div>

      <p className="text-xs text-ink-500">
        {t('Generated')} {formatDate(data.generated_at, true)} · {t('Every figure is counted from live records; empty means empty.')}
      </p>
    </div>
  );
}
