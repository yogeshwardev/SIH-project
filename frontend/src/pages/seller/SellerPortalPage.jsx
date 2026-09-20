import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Eye, LayoutDashboard, LogOut, Package, Plus, RefreshCw, ShieldCheck, Sparkles, Store, Truck, Wallet } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import WorkspaceShell from '../../components/WorkspaceShell';
import { Notice } from '../../components/ui';
import { computeSellerMetrics } from './sellerData';
import SellerOverview from './SellerOverview';
import SellerInventory from './SellerInventory';
import SellerOrders from './SellerOrders';
import SellerPayouts from './SellerPayouts';
import SellerInsights from './SellerInsights';
import SellerStoreProfile from './SellerStoreProfile';
import AiListingStudio from './AiListingStudio';

const TITLES = {
  overview: ['Overview', 'How your store is doing today'],
  studio: ['Create a listing', 'Photo, a few questions, a fair price — then review'],
  inventory: ['Products', 'Everything you have listed on CraftLink'],
  orders: ['Orders', 'Confirm, pack and ship what buyers ordered'],
  payouts: ['Payments', 'Money from your delivered orders'],
  insights: ['Insights', 'What sells, and what needs attention'],
  store: ['Store profile', 'The details buyers and our team see'],
};

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

  // Operations staff can open any store; sellers only ever see their own.
  useEffect(() => {
    if (!isAdmin) return;
    api.getArtisans().then((list) => {
      setStores(list || []);
      setStoreId((current) => current ?? list?.[0]?.id ?? null);
    }).catch(() => setError('Could not load stores.'));
  }, [isAdmin]);

  const load = useCallback(async () => {
    if (storeId == null) { setLoading(false); return; }
    setLoading(true);
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
    } catch (loadError) {
      setError(loadError.message || 'Could not load your store data.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const metrics = useMemo(() => computeSellerMetrics(products, orders, storeId), [products, orders, storeId]);
  const storeName = profile?.store_name || profile?.name || t('Your store');
  const [title, subtitle] = TITLES[tab];

  const nav = [
    { label: t('Store'), items: [
      { id: 'overview', label: t('Overview'), icon: LayoutDashboard },
      { id: 'orders', label: t('Orders'), icon: Truck, count: metrics.toFulfil.length },
      { id: 'inventory', label: t('Products'), icon: Package, count: products.length },
      { id: 'studio', label: t('Create a listing'), icon: Sparkles },
    ] },
    { label: t('Business'), items: [
      { id: 'payouts', label: t('Payments'), icon: Wallet },
      { id: 'insights', label: t('Insights'), icon: BarChart3 },
      { id: 'store', label: t('Store profile'), icon: Store },
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
      <button type="button" onClick={load} disabled={loading} className="btn btn-secondary btn-icon" aria-label={t('Refresh')} title={t('Refresh')}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
      {tab !== 'studio' && <button type="button" onClick={() => setTab('studio')} className="btn btn-primary"><Plus className="h-4 w-4" /><span className="hidden sm:inline">{t('New listing')}</span></button>}
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
    </WorkspaceShell>
  );
}
