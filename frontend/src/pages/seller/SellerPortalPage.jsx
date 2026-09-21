import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Eye, LayoutDashboard, LogOut, Package, Plus, RefreshCw, ShieldCheck, Sparkles, Store, Truck, Wallet } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import WorkspaceShell from '../../components/WorkspaceShell';
import { LiveDot, Notice, Toasts, formatINR, timeAgo } from '../../components/ui';
import { computeSellerMetrics, storeLines } from './sellerData';
import SellerOverview from './SellerOverview';
import SellerInventory from './SellerInventory';
import SellerOrders from './SellerOrders';
import SellerPayouts from './SellerPayouts';
import SellerInsights from './SellerInsights';
import SellerStoreProfile from './SellerStoreProfile';
import AiListingStudio from './AiListingStudio';

const TITLES = {
  overview: ['My shop today', 'A quick look at what is happening'],
  studio: ['Add a new product', 'One photo, a few easy questions, and you are done'],
  inventory: ['My products', 'Everything you have put up for sale'],
  orders: ['My orders', 'Confirm, pack and send what buyers ordered'],
  payouts: ['My money', 'What you have earned and what is on the way'],
  insights: ['How I am doing', 'What sells well, and what needs care'],
  store: ['My shop details', 'What buyers and our team can see'],
};

const REFRESH_MS = 30000;

export default function SellerPortalPage({ currentUser, onNavigateToAdmin, onNavigateToStore, onNavigateToOnboarding, onSignOut }) {
  const { t } = useLanguage();
  const isAdmin = currentUser?.role === 'admin';
  const [tab, setTab] = useState('overview');
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState(isAdmin ? null : currentUser?.id ?? null);
  const [profile, setProfile] = useState(isAdmin ? null : currentUser);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tick, setTick] = useState(0);
  const [toasts, setToasts] = useState([]);
  const knownOrders = useRef(null);
  const dismissToast = (id) => setToasts((list) => list.filter((toast) => toast.id !== id));

  // Operations staff can open any store; sellers only ever see their own.
  useEffect(() => {
    if (!isAdmin) return;
    api.getArtisans().then((list) => {
      setStores(list || []);
      setStoreId((current) => current ?? list?.[0]?.id ?? null);
    }).catch(() => setError('Could not load stores.'));
  }, [isAdmin]);

  const load = useCallback(async (quiet = false) => {
    if (storeId == null) { setLoading(false); return; }
    if (!quiet) setLoading(true);
    setError('');
    try {
      const [productList, orderList, artisan] = await Promise.all([
        api.getProducts({ status: 'All', artisan_id: storeId }),
        api.getOrders({ artisan_id: storeId }),
        api.getArtisan(storeId).catch(() => null),
      ]);
      setProducts(productList || []);
      setOrders(orderList || []);
      if (artisan) setProfile(artisan);
      setLastUpdated(new Date());

      // Celebrate orders that arrived while the seller was on the page.
      const seen = knownOrders.current;
      const numbers = new Set((orderList || []).map((order) => order.order_number));
      if (seen) {
        const fresh = (orderList || []).filter((order) => !seen.has(order.order_number));
        fresh.slice(0, 3).forEach((order) => {
          const amount = storeLines(order, storeId).reduce((sum, item) => sum + Number(item.line_total || 0), 0);
          setToasts((list) => [...list, {
            id: order.order_number,
            tone: 'celebrate',
            emoji: '\ud83c\udf89',
            title: `${t('New order')} · ${formatINR(amount)}`,
            detail: `${order.buyer_name} · ${order.city}`,
            action: { label: t('Open orders'), onClick: () => { setTab('orders'); dismissToast(order.order_number); } },
          }]);
        });
      }
      knownOrders.current = numbers;
    } catch (loadError) {
      if (!quiet) setError(loadError.message || 'Could not load your store data.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [storeId, t]);

  useEffect(() => { knownOrders.current = null; load(); }, [load]);

  // Keep the workspace live: refresh quietly, and re-render the "updated" label.
  useEffect(() => {
    const refresh = setInterval(() => { if (!document.hidden) load(true); }, REFRESH_MS);
    const clock = setInterval(() => setTick((value) => value + 1), 20000);
    const onFocus = () => load(true);
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(refresh); clearInterval(clock); window.removeEventListener('focus', onFocus); };
  }, [load]);

  const metrics = useMemo(() => computeSellerMetrics(products, orders, storeId), [products, orders, storeId]);
  const storeName = profile?.store_name || profile?.name || t('Your store');
  const [title, subtitle] = TITLES[tab];

  const nav = [
    { label: t('Store'), items: [
      { id: 'overview', label: t('My shop'), icon: LayoutDashboard },
      { id: 'orders', label: t('Orders'), icon: Truck, count: metrics.toFulfil.length },
      { id: 'inventory', label: t('My products'), icon: Package, count: products.length },
      { id: 'studio', label: t('Add a product'), icon: Sparkles },
    ] },
    { label: t('Business'), items: [
      { id: 'payouts', label: t('My money'), icon: Wallet },
      { id: 'insights', label: t('How I am doing'), icon: BarChart3 },
      { id: 'store', label: t('My shop details'), icon: Store },
      ...(isAdmin ? [{ id: 'admin', label: t('Administration'), icon: ShieldCheck, onClick: onNavigateToAdmin }] : []),
    ] },
  ];

  const identity = (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-clay-100 text-base font-semibold text-clay-700">{storeName.charAt(0).toUpperCase()}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">{storeName}</span>
          <span className="block truncate text-xs text-brand-300">{profile?.region || profile?.craft_category || t('Seller')}</span>
        </span>
      </div>
      {isAdmin && stores.length > 0 && (
        <label className="mt-3 block">
          <span className="mb-1 block text-[11px] font-medium text-brand-300">{t('Viewing store')}</span>
          <select value={storeId ?? ''} onChange={(event) => setStoreId(Number(event.target.value))} className="w-full rounded-md border border-white/10 bg-brand-950/40 px-2 py-1.5 text-xs text-white outline-none [&_option]:text-ink-900">
            {stores.map((store) => <option key={store.id} value={store.id}>#{store.id} · {store.store_name || store.name}</option>)}
          </select>
        </label>
      )}
    </div>
  );

  const footer = (
    <div className="space-y-0.5">
      <button type="button" onClick={onNavigateToStore} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-100 hover:bg-white/[.07] hover:text-white"><Eye className="h-[18px] w-[18px] text-brand-300" />{t('View storefront')}</button>
      <button type="button" onClick={onSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-100 hover:bg-white/[.07] hover:text-white"><LogOut className="h-[18px] w-[18px] text-brand-300" />{t('Sign out')}</button>
    </div>
  );

  const actions = (
    <>
      <span className="hidden sm:block" key={tick}>
        {lastUpdated && <LiveDot label={`${t('Live')} · ${t('updated')} ${timeAgo(lastUpdated, t)}`} />}
      </span>
      <button type="button" onClick={() => load()} disabled={loading} className="btn btn-secondary btn-icon" aria-label={t('Refresh')} title={t('Refresh')}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
      {tab !== 'studio' && <button type="button" onClick={() => setTab('studio')} className="btn btn-primary rounded-full"><Plus className="h-4 w-4" /><span className="hidden sm:inline">{t('Add a product')}</span></button>}
    </>
  );

  const shared = { products, orders, metrics, storeId, loading, onNavigate: setTab, onRefresh: load };

  return (
    <WorkspaceShell badge={t('Seller Central')} identity={identity} nav={nav} activeId={tab} onNavigate={setTab} footer={footer} title={t(title)} subtitle={t(subtitle)} actions={actions}>
      {error && <Notice tone="error" className="mb-6" onDismiss={() => setError('')}><span className="flex flex-wrap items-center gap-3">{t(error)}<button type="button" onClick={load} className="link">{t('Try again')}</button></span></Notice>}
      {storeId == null && !loading ? (
        <Notice tone="warning">{t('No store is linked to this account yet.')} {onNavigateToOnboarding && <button type="button" onClick={onNavigateToOnboarding} className="link">{t('Set up a store')}</button>}</Notice>
      ) : (
        <div key={tab + storeId} className="animate-fade-up">
          {tab === 'overview' && <SellerOverview {...shared} storeName={storeName} profile={profile} />}
          {tab === 'inventory' && <SellerInventory {...shared} setProducts={setProducts} />}
          {tab === 'orders' && <SellerOrders {...shared} setOrders={setOrders} />}
          {tab === 'payouts' && <SellerPayouts {...shared} profile={profile} />}
          {tab === 'insights' && <SellerInsights {...shared} />}
          {tab === 'store' && <SellerStoreProfile profile={profile} products={products} onNavigateToOnboarding={onNavigateToOnboarding} />}
          {tab === 'studio' && (
            <AiListingStudio
              artisanId={storeId}
              artisanName={profile?.name || 'Artisan'}
              onProductCreated={load}
              onViewProducts={() => setTab('inventory')}
            />
          )}
        </div>
      )}
      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </WorkspaceShell>
  );
}
