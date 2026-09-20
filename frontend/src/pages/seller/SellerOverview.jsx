import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Camera, CheckCircle2, Clock, IndianRupee, MessageCircle, Package, PackageCheck, Sparkles, Tag, Truck, XCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState, StatCard, StatusPill, cx, formatDate, formatINR } from '../../components/ui';
import { dailyRevenue, storeLines, storeOrderValue } from './sellerData';

export default function SellerOverview({ products, orders, metrics, storeId, loading, onNavigate, storeName }) {
  const { t } = useLanguage();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading && !products.length && !orders.length) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((index) => <div key={index} className="skeleton h-32 rounded-2xl" />)}</div>
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    );
  }

  const attention = [
    metrics.toFulfil.length && { icon: Truck, tone: 'text-sky-700 bg-sky-50', title: `${metrics.toFulfil.length} ${t(metrics.toFulfil.length === 1 ? 'order needs action' : 'orders need action')}`, detail: t('Confirm, pack and ship to keep buyers happy'), go: 'orders' },
    metrics.rejected.length && { icon: XCircle, tone: 'text-red-700 bg-red-50', title: `${metrics.rejected.length} ${t('listing returned by review')}`, detail: t('See the reviewer note, fix and resubmit'), go: 'inventory' },
    metrics.lowStock.length && { icon: AlertTriangle, tone: 'text-amber-700 bg-amber-50', title: `${metrics.lowStock.length} ${t('live product low on stock')}`, detail: t('Restock before it sells out'), go: 'inventory' },
    metrics.pending.length && { icon: Clock, tone: 'text-ink-700 bg-paper-200', title: `${metrics.pending.length} ${t('listing waiting for review')}`, detail: t('Usually reviewed within a working day'), go: 'inventory' },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h2 className="mt-0.5 text-2xl font-semibold text-ink-950">{t(greeting)}, {storeName}</h2>
        </div>
      </div>

      {products.length === 0 ? <FirstListing onStart={() => onNavigate('studio')} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Total sales')} value={formatINR(metrics.revenue)} hint={`${metrics.orderCount} ${t((metrics.orderCount) === 1 ? 'order' : 'orders')} · ${metrics.unitsSold} ${t((metrics.unitsSold) === 1 ? 'unit' : 'units')}`} icon={IndianRupee} tone="brand" />
        <StatCard label={t('To fulfil')} value={metrics.toFulfil.length} hint={t('Placed, confirmed or packed')} icon={PackageCheck} tone="sky" />
        <StatCard label={t('Live products')} value={metrics.published.length} hint={`${metrics.pending.length} ${t('in review')} · ${metrics.rejected.length} ${t('returned')}`} icon={Tag} tone="clay" />
        <StatCard label={t('Cash collected')} value={formatINR(metrics.collected)} hint={`${formatINR(metrics.inTransit)} ${t('on the way')}`} icon={CheckCircle2} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <SalesChart orders={orders} storeId={storeId} />
        <section className="card flex flex-col">
          <header className="border-b border-line px-5 py-4">
            <h3 className="text-base font-semibold text-ink-950">{t('Needs your attention')}</h3>
          </header>
          {attention.length ? (
            <ul className="divide-y divide-line">
              {attention.map((item) => (
                <li key={item.title}>
                  <button type="button" onClick={() => onNavigate(item.go)} className="group flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-paper-50">
                    <span className={cx('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', item.tone)}><item.icon className="h-[18px] w-[18px]" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-ink-900">{item.title}</span><span className="block truncate text-xs text-ink-500">{item.detail}</span></span>
                    <ArrowRight className="h-4 w-4 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-ink-700" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CheckCircle2} title={t('All caught up')} className="flex-1 py-10">{t('No pending orders or listing issues right now.')}</EmptyState>
          )}
        </section>
      </div>

      <section className="card overflow-hidden">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-base font-semibold text-ink-950">{t('Recent orders')}</h3>
          {orders.length > 0 && <button type="button" onClick={() => onNavigate('orders')} className="link text-sm">{t('View all')}</button>}
        </header>
        {orders.length ? (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>{t('Order')}</th><th>{t('Buyer')}</th><th>{t('Items')}</th><th className="text-right">{t('Your share')}</th><th>{t('Status')}</th></tr></thead>
              <tbody>
                {orders.slice(0, 6).map((order) => {
                  const lines = storeLines(order, storeId);
                  return (
                    <tr key={order.id} className="cursor-pointer" onClick={() => onNavigate('orders')}>
                      <td><span className="font-mono text-[13px] font-semibold text-ink-900">{order.order_number}</span><span className="block text-xs text-ink-500">{formatDate(order.created_at)}</span></td>
                      <td><span className="font-medium">{order.buyer_name}</span><span className="block text-xs text-ink-500">{order.city}</span></td>
                      <td className="max-w-[260px]"><span className="line-clamp-1">{lines.map((item) => `${item.product_name} ×${item.quantity}`).join(', ')}</span></td>
                      <td className="text-right font-semibold tabular-nums">{formatINR(storeOrderValue(order, storeId))}</td>
                      <td><StatusPill status={order.status} label={t(order.status)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Package} title={t('No orders yet')}>{t('When a buyer orders one of your live products, it shows up here.')}</EmptyState>
        )}
      </section>
    </div>
  );
}

function FirstListing({ onStart }) {
  const { t } = useLanguage();
  return (
    <section className="overflow-hidden rounded-2xl bg-brand-900 text-white">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <span className="eyebrow text-clay-200"><Sparkles className="h-3.5 w-3.5" />{t('Get started')}</span>
          <h3 className="mt-3 text-2xl font-semibold text-white">{t('List your first product in about five minutes')}</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-100">{t('Take one photo, answer a few simple questions by voice or text, and we write the listing and suggest a fair price. Nothing goes live until you and our team review it.')}</p>
          <button type="button" onClick={onStart} className="btn btn-accent btn-lg mt-6">{t('Create a listing')}<ArrowRight className="h-[18px] w-[18px]" /></button>
        </div>
        <ol className="grid gap-2.5">
          {[[Camera, 'Add one photo'], [MessageCircle, 'Answer simple questions'], [IndianRupee, 'Check the fair price'], [CheckCircle2, 'Send for review']].map(([Icon, label], index) => (
            <li key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">{index + 1}</span>
              <Icon className="h-4 w-4 text-clay-200" />{t(label)}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function SalesChart({ orders, storeId }) {
  const { t } = useLanguage();
  const [range, setRange] = useState(14);
  const [hover, setHover] = useState(null);
  const data = useMemo(() => dailyRevenue(orders, storeId, range), [orders, storeId, range]);
  const total = data.reduce((sum, day) => sum + day.value, 0);
  // Round the axis up to a readable number (e.g. 12,480 -> 15,000).
  const peak = Math.max(...data.map((day) => day.value), 0);
  const step = peak > 0 ? 10 ** Math.floor(Math.log10(peak)) : 1;
  const max = peak > 0 ? Math.ceil(peak / (step / 2)) * (step / 2) : 1;
  const ticks = peak > 0 ? [max, max / 2, 0] : [];
  const active = hover != null ? data[hover] : null;

  return (
    <section className="card p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink-950">{t('Sales')}</h3>
          <p className="mt-0.5 text-sm text-ink-500"><span className="font-semibold tabular-nums text-ink-900">{formatINR(total)}</span> {t('in the last')} {range} {t('days')}</p>
        </div>
        <div className="flex rounded-lg bg-paper-200 p-0.5" role="group" aria-label={t('Date range')}>
          {[7, 14, 30].map((days) => (
            <button key={days} type="button" aria-pressed={range === days} onClick={() => setRange(days)} className={cx('rounded-md px-3 py-1 text-xs font-semibold transition', range === days ? 'bg-white text-ink-950 shadow-xs' : 'text-ink-500 hover:text-ink-900')}>{days}{t('d')}</button>
          ))}
        </div>
      </header>

      <div className="relative mt-6 grid grid-cols-[48px_1fr] gap-2">
        <div className="flex h-48 flex-col justify-between text-right text-[11px] tabular-nums text-ink-400">
          {ticks.map((tick) => <span key={tick}>{tick >= 1000 ? `₹${+(tick / 1000).toFixed(1)}k` : `₹${Math.round(tick)}`}</span>)}
        </div>
        <div className="relative">
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
          <div className="relative flex h-48 items-end gap-[2px] border-b border-line-strong" onMouseLeave={() => setHover(null)}>
            {data.map((day, index) => (
              <div
                key={day.key}
                className="group relative flex h-full flex-1 items-end justify-center"
                onMouseEnter={() => setHover(index)}
                onFocus={() => setHover(index)}
                tabIndex={0}
                aria-label={`${formatDate(day.date)}: ${formatINR(day.value)}, ${day.orders} ${t((day.orders) === 1 ? 'order' : 'orders')}`}
              >
                <div
                  className={cx('w-full max-w-[28px] rounded-t transition-colors', day.value ? (hover === index ? 'bg-brand-600' : 'bg-brand-700') : 'bg-transparent')}
                  style={{ height: day.value ? `${Math.max(3, (day.value / max) * 100)}%` : 0 }}
                />
              </div>
            ))}
          </div>
          {active && (
            <div className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lift" style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}>
              <p className="font-medium text-ink-500">{formatDate(active.date)}</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink-950">{formatINR(active.value)}</p>
              <p className="text-ink-500">{active.orders} {t('orders')}</p>
            </div>
          )}
          <div className="mt-2 flex justify-between text-[11px] text-ink-400">
            <span>{data[0].date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            <span>{t('Today')}</span>
          </div>
        </div>
      </div>
      {total === 0 && <p className="mt-3 text-center text-xs text-ink-500">{t('No sales in this period yet.')}</p>}
    </section>
  );
}
