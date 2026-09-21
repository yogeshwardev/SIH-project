import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Camera, CheckCircle2, Clock, HeartHandshake, IndianRupee, Lightbulb, MessageCircle, Package, PackageCheck, PartyPopper, Sparkles, Tag, Truck, Volume2, VolumeX, XCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { voiceAssistant } from '../../services/voiceAssistant';
import { EmptyState, StatCard, StatusPill, cx, formatDate, formatINR, timeAgo, uiLocale } from '../../components/ui';
import { dailyRevenue, storeLines, storeOrderValue } from './sellerData';

// A short spoken summary so a seller can simply listen to their day.
const spokenSummary = (locale, name, metrics) => {
  const money = Math.round(metrics.revenue);
  const toFulfil = metrics.toFulfil.length;
  const live = metrics.published.length;
  if (locale === 'hi') {
    return `नमस्ते ${name}। अब तक आपकी कुल बिक्री ${money} रुपये है। ${toFulfil} ऑर्डर भेजने बाकी हैं। आपके ${live} उत्पाद ऑनलाइन बिक रहे हैं।`;
  }
  if (locale === 'te') {
    return `నమస్కారం ${name}. ఇప్పటివరకు మీ మొత్తం అమ్మకాలు ${money} రూపాయలు. ${toFulfil} ఆర్డర్లు పంపాల్సి ఉంది. మీ ${live} ఉత్పత్తులు ఆన్‌లైన్‌లో అమ్మకానికి ఉన్నాయి.`;
  }
  return `Hello ${name}. Your total sales so far are ${money} rupees. ${toFulfil} orders are waiting to be sent. ${live} of your products are live for buyers.`;
};

export default function SellerOverview({ products, orders, metrics, storeId, loading, onNavigate, storeName, profile }) {
  const { locale, language, t } = useLanguage();
  const [speaking, setSpeaking] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (profile?.name || storeName || '').split(' ')[0];

  const activity = useMemo(() => buildActivity(products, orders, storeId, t), [products, orders, storeId, t]);
  const milestone = useMemo(() => {
    if (!products.length) return null;
    if (metrics.orderCount === 1) return { emoji: '🎉', title: t('Your very first order has arrived!'), detail: t('Confirm it today so the buyer knows their piece is on its way.'), action: 'orders' };
    if (metrics.orderCount === 0 && metrics.published.length > 0) return { emoji: '🌟', title: t('Your shop is live for buyers'), detail: t('Share your shop link with friends and customers. Orders will show up here the moment they arrive.'), action: null };
    return null;
  }, [products.length, metrics.orderCount, metrics.published.length, t]);

  const listen = async () => {
    if (speaking) { voiceAssistant.stopSpeaking(); setSpeaking(false); return; }
    setSpeaking(true);
    const started = await voiceAssistant.speak(spokenSummary(locale, firstName || t('friend'), metrics), language.speechCode, () => setSpeaking(false));
    if (!started) setSpeaking(false);
  };

  if (loading && !products.length && !orders.length) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-9 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((index) => <div key={index} className="skeleton h-32 rounded-2xl" />)}</div>
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    );
  }

  const attention = [
    metrics.toFulfil.length && { icon: Truck, tone: 'text-sky-700 bg-sky-50', title: `${metrics.toFulfil.length} ${t(metrics.toFulfil.length === 1 ? 'order is waiting for you' : 'orders are waiting for you')}`, detail: t('Confirm, pack and send so buyers are not left waiting'), go: 'orders' },
    metrics.rejected.length && { icon: XCircle, tone: 'text-rose-700 bg-rose-50', title: `${metrics.rejected.length} ${t('product came back for changes')}`, detail: t('Read the note from our team, fix it and send again'), go: 'inventory' },
    metrics.lowStock.length && { icon: AlertTriangle, tone: 'text-clay-700 bg-clay-50', title: `${metrics.lowStock.length} ${t('product is almost sold out')}`, detail: t('Add more stock so buyers can keep ordering'), go: 'inventory' },
    metrics.pending.length && { icon: Clock, tone: 'text-ink-700 bg-paper-200', title: `${metrics.pending.length} ${t('product is with our team for checking')}`, detail: t('We usually finish checking within a working day'), go: 'inventory' },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-500">{new Date().toLocaleDateString(uiLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h2 className="mt-0.5 text-2xl font-extrabold text-ink-950 sm:text-[28px]">{t(greeting)}, {firstName || storeName} 👋</h2>
          <p className="mt-1 text-[15px] text-ink-600">
            {metrics.toFulfil.length
              ? `${t('You have')} ${metrics.toFulfil.length} ${t(metrics.toFulfil.length === 1 ? 'order to send today.' : 'orders to send today.')}`
              : products.length
                ? t('Everything is calm right now. Your shop is open and taking orders.')
                : t('Let us put your first product online today.')}
          </p>
        </div>
        <button type="button" onClick={listen} aria-pressed={speaking} className="btn btn-secondary rounded-full">
          {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {t(speaking ? 'Stop' : 'Listen to my summary')}
        </button>
      </div>

      {milestone && (
        <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-clay-200 bg-clay-50 px-5 py-4">
          <span className="text-3xl" aria-hidden="true">{milestone.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold text-ink-950">{milestone.title}</p>
            <p className="text-sm text-ink-700">{milestone.detail}</p>
          </div>
          {milestone.action && <button type="button" onClick={() => onNavigate(milestone.action)} className="btn btn-primary rounded-full">{t('Open orders')}<ArrowRight className="h-4 w-4" /></button>}
        </section>
      )}

      {products.length === 0 ? <FirstListing onStart={() => onNavigate('studio')} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Money from sales')} value={formatINR(metrics.revenue)} hint={`${metrics.orderCount} ${t(metrics.orderCount === 1 ? 'order' : 'orders')} · ${metrics.unitsSold} ${t(metrics.unitsSold === 1 ? 'piece' : 'pieces')}`} icon={IndianRupee} tone="brand" />
        <StatCard label={t('Orders to send')} value={metrics.toFulfil.length} hint={t('New, confirmed or packed')} icon={PackageCheck} tone="sky" />
        <StatCard label={t('Products on sale')} value={metrics.published.length} hint={`${metrics.pending.length} ${t('being checked')} · ${metrics.rejected.length} ${t('to fix')}`} icon={Tag} tone="clay" />
        <StatCard label={t('Cash received')} value={formatINR(metrics.collected)} hint={`${formatINR(metrics.inTransit)} ${t('still on the way')}`} icon={CheckCircle2} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <SalesChart orders={orders} storeId={storeId} />
        <section className="card flex flex-col">
          <header className="flex items-center gap-2 border-b border-line px-5 py-4">
            <Sparkles className="h-[18px] w-[18px] text-clay-500" />
            <h3 className="text-base font-bold text-ink-950">{t('What is happening')}</h3>
          </header>
          {activity.length ? (
            <ol className="max-h-[420px] divide-y divide-line overflow-y-auto">
              {activity.map((item) => (
                <li key={item.id} className="flex gap-3 px-5 py-3.5">
                  <span className={cx('mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full', item.tone)}><item.icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ink-900">{item.text}</span>
                    <span className="text-xs text-ink-500">{timeAgo(item.when, t)}</span>
                  </span>
                  {item.amount != null && <span className="text-sm font-semibold tabular-nums text-ink-900">{formatINR(item.amount)}</span>}
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon={HeartHandshake} title={t('Nothing yet today')} className="flex-1 py-10">{t('Orders and updates will appear here as they happen.')}</EmptyState>
          )}
        </section>
      </div>

      {attention.length > 0 && (
        <section className="card overflow-hidden">
          <header className="border-b border-line px-5 py-4">
            <h3 className="text-base font-bold text-ink-950">{t('Needs your attention')}</h3>
          </header>
          <ul className="divide-y divide-line">
            {attention.map((item) => (
              <li key={item.title}>
                <button type="button" onClick={() => onNavigate(item.go)} className="group flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-paper-50">
                  <span className={cx('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', item.tone)}><item.icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-semibold text-ink-900">{item.title}</span><span className="block truncate text-sm text-ink-500">{item.detail}</span></span>
                  <ArrowRight className="h-4 w-4 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-ink-700" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="text-base font-bold text-ink-950">{t('Latest orders')}</h3>
            {orders.length > 0 && <button type="button" onClick={() => onNavigate('orders')} className="link text-sm">{t('See all')}</button>}
          </header>
          {orders.length ? (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead><tr><th>{t('Order')}</th><th>{t('Buyer')}</th><th>{t('Items')}</th><th className="text-right">{t('Your share')}</th><th>{t('Status')}</th></tr></thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="cursor-pointer" onClick={() => onNavigate('orders')}>
                      <td><span className="font-mono text-[13px] font-semibold text-ink-900">{order.order_number}</span><span className="block text-xs text-ink-500">{timeAgo(order.created_at, t)}</span></td>
                      <td><span className="font-medium">{order.buyer_name}</span><span className="block text-xs text-ink-500">{order.city}</span></td>
                      <td className="max-w-[240px]"><span className="line-clamp-1">{storeLines(order, storeId).map((item) => `${item.product_name} ×${item.quantity}`).join(', ')}</span></td>
                      <td className="text-right font-semibold tabular-nums">{formatINR(storeOrderValue(order, storeId))}</td>
                      <td><StatusPill status={order.status} label={t(order.status)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Package} title={t('No orders yet')}>{t('When someone buys one of your products, it will appear here straight away.')}</EmptyState>
          )}
        </section>

        <section className="card card-pad">
          <h3 className="flex items-center gap-2 text-base font-bold text-ink-950"><Lightbulb className="h-[18px] w-[18px] text-clay-500" />{t('Tips that help you sell')}</h3>
          <ul className="mt-4 space-y-3.5 text-sm text-ink-700">
            {[
              ['Take the photo in daylight', 'Near a window, on a plain cloth. Clear photos sell far more.'],
              ['Tell the story of the piece', 'Buyers love knowing how long it took and who made it.'],
              ['Send orders quickly', 'Confirm the same day. Buyers remember sellers who are quick.'],
              ['Keep stock up to date', 'If a piece is sold out, update it so nobody is disappointed.'],
            ].map(([title, detail], index) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{index + 1}</span>
                <span><strong className="font-semibold text-ink-900">{t(title)}</strong><span className="block text-ink-600">{t(detail)}</span></span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => onNavigate('studio')} className="btn btn-accent mt-5 w-full rounded-full"><Camera className="h-4 w-4" />{t('Add a product')}</button>
        </section>
      </div>
    </div>
  );
}

// Everything in the feed comes from real orders and listings.
function buildActivity(products, orders, storeId, t) {
  const events = [];
  orders.forEach((order) => {
    const lines = storeLines(order, storeId);
    const pieces = lines.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    events.push({
      id: `order-${order.id}`,
      when: order.created_at,
      icon: Package,
      tone: 'bg-brand-50 text-brand-700',
      text: `${order.buyer_name} ${t('ordered')} ${pieces} ${t(pieces === 1 ? 'piece' : 'pieces')} · ${order.city}`,
      amount: storeOrderValue(order, storeId),
    });
    if (order.updated_at && order.updated_at !== order.created_at) {
      const tone = order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : order.status === 'Cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700';
      events.push({
        id: `status-${order.id}`,
        when: order.updated_at,
        icon: order.status === 'Cancelled' ? XCircle : Truck,
        tone,
        text: `${order.order_number} · ${t(order.status)}`,
      });
    }
  });
  products.forEach((product) => {
    const label = product.status === 'Published' ? t('is live for buyers') : product.status === 'Rejected' ? t('came back for changes') : t('is being checked by our team');
    const tone = product.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : product.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-paper-200 text-ink-600';
    events.push({
      id: `product-${product.id}`,
      when: product.created_at,
      icon: product.status === 'Published' ? CheckCircle2 : product.status === 'Rejected' ? XCircle : Clock,
      tone,
      text: `${product.product_name} ${label}`,
    });
  });
  return events
    .filter((event) => event.when)
    .sort((a, b) => new Date(b.when) - new Date(a.when))
    .slice(0, 10);
}

function FirstListing({ onStart }) {
  const { t } = useLanguage();
  return (
    <section className="overflow-hidden rounded-2xl bg-brand-900 text-white">
      <div className="bg-buti grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <span className="eyebrow text-clay-300"><PartyPopper className="h-3.5 w-3.5" />{t('Welcome to CraftLink')}</span>
          <h3 className="mt-3 text-2xl font-extrabold text-white">{t('Your shop is ready. Let us add your first product.')}</h3>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-brand-100">{t('Take one photo and answer a few easy questions by speaking or typing. We write the description and suggest a fair price. Nothing goes online until you say yes.')}</p>
          <button type="button" onClick={onStart} className="btn btn-accent btn-lg mt-6 rounded-full">{t('Add my first product')}<ArrowRight className="h-[18px] w-[18px]" /></button>
        </div>
        <ol className="grid gap-2.5">
          {[[Camera, 'Take one photo'], [MessageCircle, 'Answer easy questions'], [IndianRupee, 'See a fair price'], [CheckCircle2, 'Send for checking']].map(([Icon, label], index) => (
            <li key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-400 text-xs font-bold text-ink-950">{index + 1}</span>
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
  const peak = Math.max(...data.map((day) => day.value), 0);
  const step = peak > 0 ? 10 ** Math.floor(Math.log10(peak)) : 1;
  const max = peak > 0 ? Math.ceil(peak / (step / 2)) * (step / 2) : 1;
  const ticks = peak > 0 ? [max, max / 2, 0] : [];
  const active = hover != null ? data[hover] : null;

  return (
    <section className="card p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink-950">{t('Sales')}</h3>
          <p className="mt-0.5 text-sm text-ink-500"><span className="font-semibold tabular-nums text-ink-900">{formatINR(total)}</span> {t('in the last')} {range} {t('days')}</p>
        </div>
        <div className="flex rounded-full bg-paper-200 p-0.5" role="group" aria-label={t('Date range')}>
          {[7, 14, 30].map((days) => (
            <button key={days} type="button" aria-pressed={range === days} onClick={() => setRange(days)} className={cx('rounded-full px-3 py-1 text-xs font-semibold transition', range === days ? 'bg-white text-ink-950 shadow-xs' : 'text-ink-500 hover:text-ink-900')}>{days}{t('d')}</button>
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
                aria-label={`${formatDate(day.date)}: ${formatINR(day.value)}, ${day.orders} ${t('orders')}`}
              >
                <div
                  className={cx('w-full max-w-[28px] rounded-t transition-colors', day.value ? (hover === index ? 'bg-clay-400' : 'bg-brand-600') : 'bg-transparent')}
                  style={{ height: day.value ? `${Math.max(3, (day.value / max) * 100)}%` : 0 }}
                />
              </div>
            ))}
          </div>
          {active && (
            <div className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lift" style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}>
              <p className="font-medium text-ink-500">{formatDate(active.date)}</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink-950">{formatINR(active.value)}</p>
              <p className="text-ink-500">{active.orders} {t(active.orders === 1 ? 'order' : 'orders')}</p>
            </div>
          )}
          <div className="mt-2 flex justify-between text-[11px] text-ink-400">
            <span>{data[0].date.toLocaleDateString(uiLocale(), { day: 'numeric', month: 'short' })}</span>
            <span>{t('Today')}</span>
          </div>
        </div>
      </div>
      {total === 0 && <p className="mt-3 text-center text-xs text-ink-500">{t('No sales in this period yet. Share your shop link to get started.')}</p>}
    </section>
  );
}
