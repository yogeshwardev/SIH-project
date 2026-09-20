import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Check, ClipboardCheck, Download, Eye, FileSpreadsheet, LogOut, Mic, Package, RefreshCw, Search, Store, Truck, X } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import WorkspaceShell from '../components/WorkspaceShell';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import ProductImage from '../components/ProductImage';
import { EmptyState, Modal, Notice, Spinner, StatCard, StatusPill, cx, formatDate, formatINR } from '../components/ui';
import SellerOrders from './seller/SellerOrders';
import { HorizontalBars } from './seller/SellerInsights';
import { computeSellerMetrics } from './seller/sellerData';

const TITLES = {
  review: ['Review queue', 'Check each listing before it goes live'],
  catalog: ['Catalog', 'Every product across all stores'],
  orders: ['Orders', 'Fulfilment across the marketplace'],
  stores: ['Stores', 'Registered sellers'],
  reports: ['Reports', 'Marketplace numbers and data exports'],
};

export default function AdminPortalPage({ currentUser, onNavigateToMarketplace, onNavigateToSeller, onSignOut }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState('review');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [inspecting, setInspecting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productList, orderList, storeList, dashboard] = await Promise.all([
        api.getProducts({ status: 'All' }), api.getOrders(), api.getArtisans(), api.getDashboardStats(),
      ]);
      setProducts(productList || []);
      setOrders(orderList || []);
      setStores(storeList || []);
      setStats(dashboard);
    } catch (loadError) {
      setError(loadError.message || 'Could not load operations data.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const pending = products.filter((product) => product.status === 'Pending Approval');
  const metrics = useMemo(() => computeSellerMetrics(products, orders, null), [products, orders]);
  const replaceProduct = (updated) => setProducts((list) => list.map((product) => (product.id === updated.id ? updated : product)));
  const showFlash = (message) => { setFlash(message); setTimeout(() => setFlash(''), 4000); };
  const [title, subtitle] = TITLES[tab];

  const nav = [
    { label: t('Marketplace'), items: [
      { id: 'review', label: t('Review queue'), icon: ClipboardCheck, count: pending.length },
      { id: 'orders', label: t('Orders'), icon: Truck, count: metrics.toFulfil.length },
      { id: 'catalog', label: t('Catalog'), icon: Package },
      { id: 'stores', label: t('Stores'), icon: Store },
      { id: 'reports', label: t('Reports'), icon: BarChart3 },
    ] },
    { label: t('Switch to'), items: [{ id: 'seller', label: t('Seller workspace'), icon: Store, onClick: onNavigateToSeller }] },
  ];

  const identity = (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-clay-100 text-base font-semibold text-clay-700">{(currentUser?.name || 'O').charAt(0)}</span>
      <span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{currentUser?.name}</span><span className="block truncate text-xs text-brand-300">{currentUser?.admin_id || t('Operations')}</span></span>
    </div>
  );
  const footer = (
    <div className="space-y-0.5">
      <button type="button" onClick={onNavigateToMarketplace} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-100 hover:bg-white/[.07] hover:text-white"><Eye className="h-[18px] w-[18px] text-brand-300" />{t('View storefront')}</button>
      <button type="button" onClick={onSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-100 hover:bg-white/[.07] hover:text-white"><LogOut className="h-[18px] w-[18px] text-brand-300" />{t('Sign out')}</button>
    </div>
  );

  return (
    <WorkspaceShell
      badge={t('Operations')}
      identity={identity}
      nav={nav}
      activeId={tab}
      onNavigate={setTab}
      footer={footer}
      title={t(title)}
      subtitle={t(subtitle)}
      actions={<button type="button" onClick={load} disabled={loading} className="btn btn-secondary btn-icon" aria-label={t('Refresh')}><RefreshCw className={cx('h-4 w-4', loading && 'animate-spin')} /></button>}
    >
      {error && <Notice tone="error" className="mb-6" onDismiss={() => setError('')}>{t(error)}</Notice>}
      {flash && <Notice tone="success" className="mb-6" onDismiss={() => setFlash('')}>{flash}</Notice>}

      <div key={tab} className="animate-fade-up">
        {tab === 'review' && <ReviewQueue products={pending} loading={loading} onInspect={setInspecting} />}
        {tab === 'catalog' && <Catalog products={products} loading={loading} onInspect={setInspecting} />}
        {tab === 'orders' && <SellerOrders orders={orders} storeId={null} loading={loading} setOrders={setOrders} />}
        {tab === 'stores' && <Stores stores={stores} products={products} loading={loading} />}
        {tab === 'reports' && <Reports stats={stats} metrics={metrics} orders={orders} />}
      </div>

      {inspecting && (
        <InspectModal
          product={inspecting}
          onClose={() => setInspecting(null)}
          onDecided={(updated, message) => { replaceProduct(updated); setInspecting(null); showFlash(message); }}
        />
      )}
    </WorkspaceShell>
  );
}

function ReviewQueue({ products, loading, onInspect }) {
  const { t } = useLanguage();
  if (loading && !products.length) return <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((index) => <div key={index} className="skeleton h-44 rounded-2xl" />)}</div>;
  if (!products.length) return <div className="card"><EmptyState icon={Check} title={t('Queue is clear')}>{t('No listings are waiting for review.')}</EmptyState></div>;
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {products.map((product) => {
        const margin = product.suggested_price > 0 && product.total_cost > 0 ? Math.round(((product.suggested_price - product.total_cost) / product.suggested_price) * 100) : null;
        return (
          <li key={product.id} className="card flex flex-col p-5">
            <div className="flex gap-4">
              <span className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-paper-200 p-2 [&_img]:h-full [&_img]:object-contain"><ProductImage product={product} alt="" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-500">#{product.id} · {t('Submitted')} {formatDate(product.created_at)}</p>
                <h3 className="mt-0.5 line-clamp-2 text-base font-semibold text-ink-950">{product.product_name}</h3>
                <p className="mt-0.5 truncate text-sm text-clay-600">{product.artisan_name || t('Unknown seller')}{product.region && ` · ${product.region}`}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span><span className="text-ink-500">{t('Price')}</span> <strong className="tabular-nums">{formatINR(product.suggested_price)}</strong></span>
                  <span><span className="text-ink-500">{t('Cost')}</span> <span className="tabular-nums">{formatINR(product.total_cost)}</span></span>
                  {margin != null && <span className={margin < 10 ? 'text-red-700' : 'text-ink-700'}>{margin}% {t('margin')}</span>}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-600">
              {[product.category, product.material, `${product.stock_quantity ?? 0} ${t('in stock')}`].filter(Boolean).map((item) => <span key={item} className="rounded-full bg-paper-200 px-2.5 py-1">{item}</span>)}
            </div>
            <div className="mt-auto flex justify-end pt-4">
              <button type="button" onClick={() => onInspect(product)} className="btn btn-primary"><Eye className="h-4 w-4" />{t('Review listing')}</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Catalog({ products, loading, onInspect }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const visible = products.filter((product) => (status === 'all' || product.status === status)
    && (!query.trim() || [product.product_name, product.artisan_name, product.category, String(product.id)].filter(Boolean).join(' ').toLowerCase().includes(query.trim().toLowerCase())));
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search product, seller, category or ID')} aria-label={t('Search catalog')} className="field pl-9" />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="field w-auto" aria-label={t('Status')}>
          <option value="all">{t('All statuses')}</option>
          <option value="Published">{t('Live')}</option>
          <option value="Pending Approval">{t('In review')}</option>
          <option value="Rejected">{t('Returned')}</option>
        </select>
      </div>
      {loading && !products.length ? <div className="space-y-3 p-4">{[0, 1, 2].map((index) => <div key={index} className="skeleton h-12" />)}</div> : visible.length ? (
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>{t('Product')}</th><th>{t('Seller')}</th><th>{t('Status')}</th><th className="text-right">{t('Price')}</th><th className="text-right">{t('Stock')}</th><th /></tr></thead>
            <tbody>
              {visible.map((product) => (
                <tr key={product.id}>
                  <td><div className="flex min-w-[240px] items-center gap-3"><span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-paper-200 p-1 [&_img]:h-full [&_img]:object-contain"><ProductImage product={product} alt="" /></span><span><span className="line-clamp-1 font-medium">{product.product_name}</span><span className="text-xs text-ink-500">#{product.id} · {product.category}</span></span></div></td>
                  <td className="text-ink-700">{product.artisan_name || '—'}</td>
                  <td><StatusPill status={product.status} label={t({ Published: 'Live', 'Pending Approval': 'In review', Rejected: 'Returned' }[product.status] || product.status)} /></td>
                  <td className="text-right font-semibold tabular-nums">{formatINR(product.suggested_price)}</td>
                  <td className="text-right tabular-nums">{product.stock_quantity ?? 0}</td>
                  <td className="text-right"><button type="button" onClick={() => onInspect(product)} className="btn btn-ghost btn-sm">{t('Open')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState icon={Package} title={t('No products found')} />}
    </section>
  );
}

function Stores({ stores, products, loading }) {
  const { t } = useLanguage();
  const counts = products.reduce((map, product) => ({ ...map, [product.artisan_id]: (map[product.artisan_id] || 0) + 1 }), {});
  if (loading && !stores.length) return <div className="skeleton h-64 rounded-2xl" />;
  return (
    <section className="card overflow-hidden">
      {stores.length ? (
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>{t('Store')}</th><th>{t('Contact')}</th><th>{t('Region')}</th><th>{t('KYC')}</th><th className="text-right">{t('Products')}</th><th>{t('Joined')}</th></tr></thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id}>
                  <td><span className="font-medium">{store.store_name || store.name}</span><span className="block text-xs text-ink-500">#{store.id} · {store.name}</span></td>
                  <td className="text-ink-700"><span className="block">{store.email || '—'}</span><span className="text-xs text-ink-500">{store.phone}</span></td>
                  <td className="text-ink-700">{store.region}</td>
                  <td><StatusPill status={store.kyc_status || 'Pending'} label={t(store.kyc_status || 'Pending')} /></td>
                  <td className="text-right tabular-nums">{counts[store.id] || 0}</td>
                  <td className="text-ink-600">{formatDate(store.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState icon={Store} title={t('No stores yet')} />}
    </section>
  );
}

function Reports({ stats, metrics, orders }) {
  const { t } = useLanguage();
  if (!stats) return <div className="skeleton h-64 rounded-2xl" />;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Order value')} value={formatINR(metrics.revenue)} hint={`${metrics.orderCount} ${t((metrics.orderCount) === 1 ? 'order' : 'orders')} · ${orders.filter((order) => order.status === 'Cancelled').length} ${t('cancelled')}`} icon={Truck} tone="brand" />
        <StatCard label={t('Live products')} value={stats.published_products} hint={`${stats.total_products} ${t('total')}`} icon={Package} tone="clay" />
        <StatCard label={t('Stores')} value={stats.total_artisans} icon={Store} tone="sky" />
        <StatCard label={t('Average margin')} value={`${stats.average_margin_percentage}%`} hint={`${t('Avg. price')} ${formatINR(stats.average_price)}`} icon={BarChart3} tone="amber" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <HorizontalBars title={t('Products by category')} description={t('Count of listings in each category')} rows={(stats.categories || []).sort((a, b) => b.count - a.count).map((row) => ({ key: row.name, label: row.name, value: row.count }))} format={(value) => value} empty={t('No products yet.')} />
        <HorizontalBars title={t('Products by region')} description={t('Where listed crafts come from')} rows={(stats.regions || []).sort((a, b) => b.count - a.count).slice(0, 8).map((row) => ({ key: row.region, label: row.region, value: row.count }))} format={(value) => value} empty={t('No products yet.')} />
      </div>
      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><FileSpreadsheet className="h-5 w-5" /></span>
          <div><h3 className="text-base font-semibold text-ink-950">{t('Catalog export')}</h3><p className="text-sm text-ink-500">{t('Download the live catalog for partners and audits')}</p></div>
        </div>
        <div className="flex gap-2">
          <a href={api.csvExportUrl} download className="btn btn-secondary"><Download className="h-4 w-4" />CSV</a>
          <a href={api.jsonExportUrl} download className="btn btn-secondary"><Download className="h-4 w-4" />JSON</a>
        </div>
      </section>
    </div>
  );
}

function InspectModal({ product, onClose, onDecided }) {
  const { t } = useLanguage();
  const [note, setNote] = useState('');
  const [mode, setMode] = useState(null); // null | 'return'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = product.status === 'Pending Approval';

  const decide = async (approve) => {
    setBusy(true);
    setError('');
    try {
      const updated = approve ? await api.approveProduct(product.id, note.trim() || 'Approved for publication') : await api.rejectProduct(product.id, note.trim());
      onDecided(updated, approve ? `“${product.product_name}” ${t('is now live.')}` : `“${product.product_name}” ${t('was returned to the seller.')}`);
    } catch (decideError) {
      setError(decideError.message);
      setBusy(false);
    }
  };

  const footer = !pending ? null : mode === 'return' ? (
    <>
      <button type="button" onClick={() => setMode(null)} className="btn btn-secondary mr-auto">{t('Back')}</button>
      <button type="button" onClick={() => decide(false)} disabled={busy || note.trim().length < 10} className="btn bg-red-700 text-white hover:bg-red-800">{busy && <Spinner className="h-4 w-4" />}{t('Return to seller')}</button>
    </>
  ) : (
    <>
      <button type="button" onClick={() => setMode('return')} className="btn btn-danger mr-auto"><X className="h-4 w-4" />{t('Return with note')}</button>
      <button type="button" onClick={() => decide(true)} disabled={busy} className="btn btn-success">{busy ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}{t('Approve & publish')}</button>
    </>
  );

  return (
    <Modal open onClose={onClose} size="xl" title={product.product_name} description={`#${product.id} · ${product.artisan_name || t('Unknown seller')} · ${formatDate(product.created_at)}`} footer={footer}>
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-line"><BeforeAfterSlider originalUrl={product.original_image} enhancedUrl={product.enhanced_image} title={t('Photos')} /></div>
          {product.transcript && (
            <section>
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500"><Mic className="h-3.5 w-3.5" />{t('Seller answers')} {product.detected_language && `(${product.detected_language})`}</h3>
              <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-line rounded-xl bg-paper-100 p-4 text-sm italic leading-relaxed text-ink-700">{product.transcript}</p>
            </section>
          )}
        </div>
        <div className="space-y-5">
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex items-center gap-2"><StatusPill status={product.status} label={t({ Published: 'Live', 'Pending Approval': 'In review', Rejected: 'Returned' }[product.status] || product.status)} /></div>
          <dl className="grid grid-cols-3 gap-3">
            {[['Cost', product.total_cost], ['Fair range', null], ['Price', product.suggested_price]].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-paper-100 px-3 py-2.5">
                <dt className="text-xs text-ink-500">{t(label)}</dt>
                <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink-950">{label === 'Fair range' ? (product.recommended_min_price ? `${formatINR(product.recommended_min_price)}–${formatINR(product.recommended_max_price)}` : '—') : formatINR(value)}</dd>
              </div>
            ))}
          </dl>
          <dl className="divide-y divide-line rounded-xl border border-line text-sm">
            {[['Category', product.category], ['Craft', product.craft_type], ['Material', product.material], ['Technique', product.technique], ['Dimensions', product.dimensions], ['Region', product.region], ['Stock', product.stock_quantity]].filter(([, value]) => value != null && value !== '').map(([label, value]) => (
              <div key={label} className="grid grid-cols-[110px_1fr] gap-3 px-4 py-2"><dt className="text-ink-500">{t(label)}</dt><dd className="text-ink-900">{value}</dd></div>
            ))}
          </dl>
          {product.description && <p className="max-h-40 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-ink-700">{product.description}</p>}
          {product.admin_notes && !pending && <Notice tone={product.status === 'Rejected' ? 'warning' : 'info'}><strong>{t('Review note')}:</strong> {product.admin_notes}</Notice>}
          {pending && (
            <div>
              <label htmlFor="review-note" className="label">{t(mode === 'return' ? 'What should the seller fix? (required)' : 'Note to seller (optional)')}</label>
              <textarea id="review-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder={t('e.g. Please add the exact dimensions and a clearer photo of the border.')} className={cx('field resize-y', mode === 'return' && note.trim().length < 10 && 'border-amber-400')} />
              {mode === 'return' && <p className="hint">{t('At least 10 characters so the seller knows what to change.')}</p>}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
