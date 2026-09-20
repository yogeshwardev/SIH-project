import React, { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, IndianRupee, Package, Percent, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState, StatCard, formatINR } from '../../components/ui';
import { LOW_STOCK_THRESHOLD, revenueByCategory, revenueByProduct } from './sellerData';

export default function SellerInsights({ products, orders, metrics, storeId, onNavigate }) {
  const { t } = useLanguage();
  const topProducts = useMemo(() => revenueByProduct(orders, storeId).slice(0, 5), [orders, storeId]);
  const categories = useMemo(() => revenueByCategory(orders, products, storeId), [orders, products, storeId]);
  const priced = products.filter((product) => Number(product.suggested_price) > 0 && Number(product.total_cost) > 0);
  const averageMargin = priced.length ? Math.round(priced.reduce((sum, product) => sum + ((product.suggested_price - product.total_cost) / product.suggested_price) * 100, 0) / priced.length) : null;
  const soldIds = useMemo(() => new Set(revenueByProduct(orders, storeId).map((row) => row.id)), [orders, storeId]);
  const neverSold = metrics.published.filter((product) => !soldIds.has(product.id));
  const stockValue = metrics.published.reduce((sum, product) => sum + Number(product.suggested_price || 0) * Number(product.stock_quantity || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Units sold')} value={metrics.unitsSold} hint={`${metrics.orderCount} ${t((metrics.orderCount) === 1 ? 'order' : 'orders')}`} icon={TrendingUp} tone="brand" />
        <StatCard label={t('Average order')} value={formatINR(metrics.averageOrder)} icon={IndianRupee} tone="clay" />
        <StatCard label={t('Average margin')} value={averageMargin == null ? '—' : `${averageMargin}%`} hint={t('Price over your recorded costs')} icon={Percent} tone="sky" />
        <StatCard label={t('Stock value')} value={formatINR(stockValue)} hint={t('Live products at current price')} icon={Package} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HorizontalBars
          title={t('Sales by category')}
          description={t('Revenue from non-cancelled orders')}
          rows={categories.map((row) => ({ key: row.name, label: row.name, value: row.revenue }))}
          empty={t('Category sales appear after your first order.')}
        />
        <section className="card overflow-hidden">
          <header className="border-b border-line px-5 py-4">
            <h3 className="text-base font-semibold text-ink-950">{t('Best sellers')}</h3>
            <p className="text-sm text-ink-500">{t('Top products by revenue')}</p>
          </header>
          {topProducts.length ? (
            <ol className="divide-y divide-line">
              {topProducts.map((row, index) => (
                <li key={row.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 text-sm font-semibold tabular-nums text-ink-400">{index + 1}</span>
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-paper-200 p-1">{row.image && <img src={row.image} alt="" className="h-full object-contain" />}</span>
                  <span className="min-w-0 flex-1"><span className="line-clamp-1 text-sm font-medium text-ink-900">{row.name}</span><span className="text-xs text-ink-500">{row.units} {t('units')}</span></span>
                  <span className="text-sm font-semibold tabular-nums">{formatINR(row.revenue)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon={BarChart3} title={t('No sales yet')}>{t('Your best sellers will be ranked here.')}</EmptyState>
          )}
        </section>
      </div>

      <section className="card overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-ink-950">{t('Listing health')}</h3>
            <p className="text-sm text-ink-500">{t('Live products that may need a nudge')}</p>
          </div>
          <button type="button" onClick={() => onNavigate('inventory')} className="link text-sm">{t('Manage products')}</button>
        </header>
        <div className="grid divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0">
          <HealthList icon={AlertTriangle} tone="text-amber-700" title={`${t('Low stock')} (≤ ${LOW_STOCK_THRESHOLD})`} items={metrics.lowStock} detail={(product) => `${product.stock_quantity ?? 0} ${t('left')}`} empty={t('Every live product has healthy stock.')} />
          <HealthList icon={Package} tone="text-ink-500" title={t('Live but not sold yet')} items={neverSold} detail={(product) => formatINR(product.suggested_price)} empty={t('Every live product has sold at least once.')} />
        </div>
      </section>
    </div>
  );
}

export function HorizontalBars({ title, description, rows, empty, format = formatINR }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...rows.map((row) => row.value), 1);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return (
    <section className="card p-5">
      <h3 className="text-base font-semibold text-ink-950">{title}</h3>
      <p className="text-sm text-ink-500">{description}</p>
      {rows.length ? (
        <ul className="mt-5 space-y-4">
          {rows.map((row) => (
            <li key={row.key} onMouseEnter={() => setHover(row.key)} onMouseLeave={() => setHover(null)} className="relative">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium text-ink-800">{row.label}</span>
                <span className="tabular-nums text-ink-900">{format(row.value)} <span className="text-xs text-ink-500">· {Math.round((row.value / total) * 100)}%</span></span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-paper-200">
                <div className={`h-full rounded-full transition-colors ${hover === row.key ? 'bg-brand-600' : 'bg-brand-700'}`} style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 pb-6 text-center text-sm text-ink-500">{empty}</p>
      )}
    </section>
  );
}

function HealthList({ icon: Icon, tone, title, items, detail, empty }) {
  return (
    <div className="p-5">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-ink-900"><Icon className={`h-4 w-4 ${tone}`} />{title}<span className="text-ink-400">{items.length}</span></h4>
      {items.length ? (
        <ul className="mt-3 space-y-2">
          {items.slice(0, 6).map((product) => (
            <li key={product.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-ink-700">{product.product_name}</span>
              <span className="flex-shrink-0 tabular-nums text-ink-500">{detail(product)}</span>
            </li>
          ))}
          {items.length > 6 && <li className="text-xs text-ink-500">+{items.length - 6} more</li>}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-500">{empty}</p>
      )}
    </div>
  );
}
