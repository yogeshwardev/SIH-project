import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Menu, Package, Search, ShieldCheck, ShoppingBag, Store, Truck, UserRound, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';
import Logo from './Logo';
import { STOREFRONT_CATEGORIES, normalizeCategory } from '../data/storefrontCategories';

const CATEGORIES = [{ id: 'All', label: 'All crafts' }, ...STOREFRONT_CATEGORIES];

export default function StoreHeader({
  cartCount = 0, onOpenCart, onOpenOrders, searchTerm, setSearchTerm, selectedCategory = 'All', setSelectedCategory,
  currentUser, onHome, onOpenSeller, onOpenAdmin, onOpenAuth, onOpenAccount, onSignOut,
}) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const activeCategory = normalizeCategory(selectedCategory);

  useEffect(() => {
    if (!accountOpen) return undefined;
    const close = (event) => { if (!accountRef.current?.contains(event.target)) setAccountOpen(false); };
    const escape = (event) => { if (event.key === 'Escape') setAccountOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, [accountOpen]);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const browseCategory = (category) => { setSelectedCategory?.(category); setSearchTerm?.(''); setMenuOpen(false); scrollTo('collection'); };
  const submitSearch = (event) => { event.preventDefault(); setMenuOpen(false); scrollTo('collection'); };
  const isStaff = currentUser && ['seller', 'admin'].includes(currentUser.role);
  const firstName = currentUser?.name?.split(' ')[0];

  const searchForm = (className, withCategory) => (
    <form role="search" onSubmit={submitSearch} className={`flex h-11 items-stretch overflow-hidden rounded-full border border-line bg-paper-100 transition focus-within:border-brand-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/10 sm:h-12 sm:border-2 sm:border-brand-600 sm:bg-white ${className}`}>
      {withCategory && (
        <label className="relative hidden border-r border-line bg-paper-100 lg:flex">
          <span className="sr-only">{t('Category')}</span>
          <select value={activeCategory} onChange={(event) => setSelectedCategory?.(event.target.value)} className="cursor-pointer appearance-none bg-transparent pl-5 pr-9 text-sm font-medium text-ink-700 outline-none">
            {CATEGORIES.map((category) => <option key={category.id} value={category.id}>{t(category.label)}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        </label>
      )}
      <input
        type="search"
        value={searchTerm || ''}
        onChange={(event) => setSearchTerm?.(event.target.value)}
        placeholder={t('Search sarees, blue pottery, Dhokra, Madhubani…')}
        aria-label={t('Search')}
        className="min-w-0 flex-1 bg-transparent px-4 text-[15px] text-ink-900 outline-none placeholder:text-ink-400 sm:px-5"
      />
      {searchTerm && (
        <button type="button" onClick={() => setSearchTerm?.('')} className="px-2 text-ink-400 hover:text-ink-800" aria-label={t('Clear search')}><X className="h-4 w-4" /></button>
      )}
      <button type="submit" className="m-1 flex w-9 items-center justify-center gap-2 rounded-full text-ink-500 hover:text-brand-700 sm:w-auto sm:bg-clay-400 sm:px-5 sm:text-sm sm:font-bold sm:text-ink-950 sm:hover:bg-clay-500" aria-label={t('Search')}>
        <Search className="h-[18px] w-[18px]" /><span className="hidden sm:inline">{t('Search')}</span>
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_#E4E4EE,0_8px_24px_-18px_rgba(30,33,80,.35)]">
      <div className="hidden bg-brand-900 text-brand-100 md:block">
        <div className="mx-auto flex h-9 max-w-[1320px] items-center justify-between px-6 text-xs">
          <span className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-clay-300" />{t('Handmade across India · Cash on delivery on every order')}</span>
          <nav className="flex items-center gap-5" aria-label={t('Help')}>
            <button type="button" onClick={onOpenOrders} className="hover:text-white">{t('Track an order')}</button>
            <button type="button" onClick={onOpenSeller} className="font-semibold text-clay-300 hover:text-clay-200">{t(isStaff ? 'Seller workspace' : 'Sell on CraftLink')}</button>
            <LanguageSelector tone="dark" compact className="h-7 border-0 bg-transparent pl-0 shadow-none" />
          </nav>
        </div>
      </div>
      <div className="border-motif hidden md:block" aria-hidden="true" />

      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-2 px-3 sm:h-[72px] sm:gap-8 sm:px-6">
        <button type="button" onClick={() => setMenuOpen((open) => !open)} className="btn btn-ghost btn-icon -ml-1 shrink-0 lg:hidden" aria-expanded={menuOpen} aria-controls="store-mobile-menu" aria-label={t(menuOpen ? 'Close navigation' : 'Open navigation')}>
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <button type="button" onClick={onHome} className="min-w-0 shrink rounded-xl" aria-label="CraftLink home">
          {/* The tagline is a website flourish; an app bar has room for the name. */}
          <Logo tagline={t('Handmade in India')} taglineClassName="hidden sm:block" markClassName="h-8 w-8 sm:h-10 sm:w-10" className="gap-2" />
        </button>

        {searchForm('hidden flex-1 md:flex', true)}

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => (currentUser ? setAccountOpen((open) => !open) : onOpenAuth?.('buyer'))}
              aria-expanded={currentUser ? accountOpen : undefined}
              aria-label={t(currentUser ? 'Account' : 'Sign in')}
              className="flex h-11 items-center justify-center gap-2.5 rounded-full px-1 hover:bg-paper-100 sm:h-12 sm:px-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                {currentUser ? (currentUser.name || 'U').charAt(0).toUpperCase() : <UserRound className="h-[18px] w-[18px]" />}
              </span>
              <span className="hidden text-left leading-tight lg:block">
                <span className="block text-[11px] text-ink-500">{currentUser ? `${t('Hi')}, ${firstName}` : t('Hello')}</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-ink-900">{t(currentUser ? 'Your account' : 'Sign in')}{currentUser && <ChevronDown className="h-3.5 w-3.5" />}</span>
              </span>
            </button>
            {accountOpen && currentUser && (
              <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-lift animate-pop" role="menu">
                <p className="px-3 py-2 text-xs text-ink-500">{t('Signed in as')}<span className="mt-0.5 block truncate text-sm font-semibold text-ink-900">{currentUser.email || currentUser.name}</span></p>
                <MenuItem icon={UserRound} label={t('Your account')} onClick={() => { setAccountOpen(false); onOpenAccount?.(); }} />
                <MenuItem icon={Package} label={t('Track an order')} onClick={() => { setAccountOpen(false); onOpenOrders?.(); }} />
                {isStaff && <MenuItem icon={Store} label={t('Seller workspace')} onClick={() => { setAccountOpen(false); onOpenSeller?.(); }} />}
                {currentUser.role === 'admin' && <MenuItem icon={ShieldCheck} label={t('Administration')} onClick={() => { setAccountOpen(false); onOpenAdmin?.(); }} />}
                <div className="my-1 border-t border-line" />
                <MenuItem icon={LogOut} label={t('Sign out')} onClick={() => { setAccountOpen(false); onSignOut?.(); }} />
              </div>
            )}
          </div>

          <button type="button" onClick={onOpenCart} className="relative flex h-11 w-11 items-center justify-center rounded-full text-brand-700 hover:bg-paper-100 sm:h-12 sm:w-auto sm:gap-2 sm:bg-brand-600 sm:pl-3.5 sm:pr-4 sm:font-semibold sm:text-white sm:hover:bg-brand-700" aria-label={`${t('Cart')} (${cartCount})`}>
            <ShoppingBag className="h-[22px] w-[22px] sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">{t('Cart')}</span>
            {/* A badge on a phone, an inline count once there is room for one. */}
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-clay-400 px-1 text-[11px] font-bold text-ink-950 ring-2 ring-white sm:static sm:h-6 sm:min-w-6 sm:px-1.5 sm:text-xs sm:ring-0">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
      <div className="px-3 pb-2.5 md:hidden">{searchForm('w-full', false)}</div>

      <nav className="hidden border-t border-line lg:block" aria-label={t('Shop by category')}>
        <div className="mx-auto flex h-11 max-w-[1320px] items-center gap-1 px-6">
          {CATEGORIES.map((category) => {
            const active = activeCategory === category.id;
            return (
              <button key={category.id} type="button" aria-pressed={active} onClick={() => browseCategory(category.id)} className={`h-8 rounded-full px-4 text-sm font-medium transition ${active ? 'bg-brand-600 text-white' : 'text-ink-700 hover:bg-brand-50 hover:text-brand-700'}`}>
                {t(category.label)}
              </button>
            );
          })}
          <span className="mx-2 h-5 w-px bg-line" />
          <button type="button" onClick={() => scrollTo('makers')} className="h-8 rounded-full px-4 text-sm font-semibold text-clay-700 hover:bg-clay-50">{t('Meet the makers')}</button>
        </div>
      </nav>

      {menuOpen && (
        <nav id="store-mobile-menu" className="max-h-[70vh] overflow-y-auto border-t border-line bg-white px-4 pb-5 pt-3 animate-fade-in lg:hidden" aria-label={t('Explore')}>
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('Shop by category')}</p>
          <div className="grid grid-cols-2 gap-1">
            {CATEGORIES.map((category) => (
              <button key={category.id} type="button" onClick={() => browseCategory(category.id)} className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium ${activeCategory === category.id ? 'bg-brand-50 text-brand-700' : 'text-ink-800 hover:bg-paper-100'}`}>{t(category.label)}</button>
            ))}
          </div>
          <div className="mt-3 grid gap-0.5 border-t border-line pt-3">
            <MenuItem icon={Package} label={t('Track an order')} onClick={() => { setMenuOpen(false); onOpenOrders?.(); }} />
            <MenuItem icon={Store} label={t(isStaff ? 'Seller workspace' : 'Sell on CraftLink')} onClick={() => { setMenuOpen(false); onOpenSeller?.(); }} />
            {currentUser?.role === 'admin' && <MenuItem icon={ShieldCheck} label={t('Administration')} onClick={() => { setMenuOpen(false); onOpenAdmin?.(); }} />}
            {currentUser && <MenuItem icon={LogOut} label={t('Sign out')} onClick={() => { setMenuOpen(false); onSignOut?.(); }} />}
          </div>
          <div className="mt-3 border-t border-line pt-3"><LanguageSelector /></div>
        </nav>
      )}
    </header>
  );
}

function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-800 hover:bg-brand-50 hover:text-brand-700">
      <Icon className="h-[18px] w-[18px] text-brand-500" aria-hidden="true" />
      {label}
    </button>
  );
}
