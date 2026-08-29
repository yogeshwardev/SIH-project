import React, { useState } from 'react';
import {
  Search,
  MapPin,
  ShoppingCart,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Building2,
  ShieldCheck,
  Package,
  Bell,
  Truck,
  User,
  Store,
  LogOut
} from 'lucide-react';

const CATEGORIES = [
  'All Categories',
  'Handloom & Textiles',
  'Pottery & Ceramics',
  'Woodcraft & Toys',
  'Metal & Bell Metal',
  'Cane & Bamboo',
  'Tribal Paintings',
];

const NAV_LINKS = [
  { label: "Today's Deals", icon: '⚡', scroll: 'deals' },
  { label: 'Handloom Sarees', icon: '🧣', cat: 'Handloom & Textiles' },
  { label: 'Blue Pottery', icon: '🏺', cat: 'Pottery & Ceramics' },
  { label: 'Wooden Toys', icon: '🪵', cat: 'Woodcraft & Carving' },
  { label: 'Tribal Art', icon: '🔱', cat: 'Metal Craft & Bell Metal' },
  { label: 'Under ₹999', icon: '🔥', scroll: 'under999' },
  { label: 'Best Sellers', icon: '⭐', scroll: 'bestsellers' },
];

export default function AmazonHeader({
  activeTab,
  setActiveTab,
  cartCount = 0,
  cartTotal = 0,
  onOpenCart,
  onOpenOrders,
  searchTerm,
  setSearchTerm,
  onSearch,
  selectedCategory,
  setSelectedCategory,
  userPincode = '110001',
  onOpenPincodeModal,
  pendingAdminCount = 0,
  currentUser = null,
  currentRole = 'buyer',
  onOpenAuthModal,
  onOpenAccountModal,
  onSignOut
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [localCat, setLocalCat] = useState('All Categories');

  const displayName = currentUser?.store_name || currentUser?.name || (currentUser ? 'User' : 'Sign In');
  const greetingText = currentUser ? `Hello, ${displayName.split(' ')[0]}` : 'Hello, Sign In';

  return (
    <header className="sticky top-0 z-50 shadow-header" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── TOP PROMO STRIP ─────────────────────────── */}
      <div className="bg-[#232f3e] text-center py-1.5 text-[11px] font-semibold text-amber-300 tracking-wide hidden md:block">
        🎉 &nbsp;FREE Delivery on orders above ₹499 &nbsp;•&nbsp; 7-Day Easy Returns &nbsp;•&nbsp; 100% GI-Certified Artisan Crafts
      </div>

      {/* ── MAIN HEADER BAR ─────────────────────────── */}
      <div className="bg-[#131921] px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 sm:gap-3 h-[60px] max-w-[1400px] mx-auto">

          {/* LOGO */}
          <button
            onClick={() => setActiveTab('buyer')}
            className="flex-shrink-0 flex items-center gap-2 border-2 border-transparent hover:border-white/40 rounded px-1.5 py-1 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block leading-none text-left">
              <div className="flex items-baseline gap-0.5">
                <span className="text-white font-black text-[18px] tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>CraftLink</span>
                <span className="text-amber-400 font-black text-[16px]">.in</span>
              </div>
              <div className="text-[9px] text-slate-400 font-bold tracking-widest">DIRECT ARTISAN</div>
            </div>
          </button>

          {/* DELIVER TO (Amazon Style) */}
          <button
            onClick={onOpenPincodeModal}
            className="hidden xl:flex flex-col items-start border-2 border-transparent hover:border-white/40 rounded px-2 py-1.5 transition-colors flex-shrink-0"
          >
            <span className="text-[11px] text-slate-400 leading-none">Deliver to</span>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-white flex-shrink-0" />
              <span className="text-white text-[13px] font-bold leading-none">{userPincode}</span>
            </div>
          </button>

          {/* SEARCH BAR */}
          <div className="flex-1 min-w-0">
            <form
              onSubmit={e => { e.preventDefault(); onSearch?.(); }}
              className="flex h-[42px] rounded-lg overflow-hidden search-bar-wrapper"
            >
              {/* Category Dropdown */}
              <div className="hidden sm:flex items-center bg-[#f3f4f6] border-r border-gray-300 flex-shrink-0">
                <select
                  value={localCat}
                  onChange={e => { setLocalCat(e.target.value); setSelectedCategory?.(e.target.value); }}
                  className="h-full bg-transparent text-[12px] font-semibold text-gray-700 pl-2 pr-6 outline-none cursor-pointer"
                  style={{ appearance: 'auto' }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Input */}
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm?.(e.target.value)}
                placeholder="Search for Banarasi silk, blue pottery, wooden toys, tribal art..."
                className="flex-1 px-3 text-[13px] text-gray-900 placeholder-gray-400 bg-white outline-none min-w-0"
              />

              {/* Search Button */}
              <button
                type="submit"
                className="w-[50px] bg-amber-400 hover:bg-amber-500 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <Search className="w-5 h-5 text-gray-900 stroke-[2.5]" />
              </button>
            </form>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">

            {/* Account & Lists Dropdown Trigger */}
            <div
              className="relative hidden md:block"
              onMouseEnter={() => setAccountMenuOpen(true)}
              onMouseLeave={() => setAccountMenuOpen(false)}
            >
              <button
                onClick={() => {
                  if (currentUser) {
                    onOpenAccountModal?.();
                  } else {
                    onOpenAuthModal?.('buyer');
                  }
                }}
                className="flex flex-col items-start border-2 border-transparent hover:border-white/40 rounded px-2 py-1.5 transition-colors"
              >
                <span className="text-[11px] text-slate-400 leading-none truncate max-w-[110px]">{greetingText}</span>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className="text-white text-[13px] font-bold leading-none">Account & Lists</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </button>

              {/* Amazon Style Hover Flyout Menu */}
              {accountMenuOpen && (
                <div className="absolute right-0 top-full pt-1 w-[260px] z-50 animate-fade-in">
                  <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 text-gray-900">
                    
                    {!currentUser ? (
                      <div className="text-center pb-3 border-b border-gray-100 mb-3">
                        <button
                          onClick={() => { setAccountMenuOpen(false); onOpenAuthModal?.('buyer'); }}
                          className="w-full py-2 px-4 rounded-lg bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] font-bold text-xs text-gray-900 shadow"
                        >
                          Sign In / Register
                        </button>
                        <p className="text-[11px] text-gray-500 mt-1.5">
                          New customer?{' '}
                          <button
                            onClick={() => { setAccountMenuOpen(false); onOpenAuthModal?.('buyer'); }}
                            className="text-blue-600 font-bold hover:underline"
                          >
                            Start here
                          </button>
                        </p>
                      </div>
                    ) : (
                      <div className="pb-3 border-b border-gray-100 mb-3">
                        <div className="text-xs font-bold text-gray-900 truncate">{currentUser.store_name || currentUser.name}</div>
                        <div className="text-[11px] text-gray-500 truncate">{currentUser.email || currentUser.phone}</div>
                        <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {currentRole === 'seller' ? 'Artisan Seller' : currentRole === 'admin' ? 'Govt. Officer' : 'Buyer'}
                        </span>
                      </div>
                    )}

                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-gray-900 px-2 py-1 text-[11px] uppercase tracking-wider text-gray-400">Your Shortcuts</div>
                      
                      <button
                        onClick={() => { setAccountMenuOpen(false); if (currentUser) onOpenAccountModal?.(); else onOpenAuthModal?.('buyer'); }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 hover:text-blue-600 font-medium"
                      >
                        Your Account
                      </button>

                      <button
                        onClick={() => { setAccountMenuOpen(false); onOpenOrders?.(); }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 hover:text-blue-600 font-medium"
                      >
                        Your Orders & Tracking
                      </button>

                      <div className="border-t border-gray-100 my-1 pt-1">
                        <div className="font-bold text-gray-900 px-2 py-1 text-[11px] uppercase tracking-wider text-gray-400">Producer & Admin</div>
                        
                        <button
                          onClick={() => {
                            setAccountMenuOpen(false);
                            if (currentUser && (currentUser.role === 'seller' || currentUser.role === 'admin')) {
                              setActiveTab('seller');
                            } else {
                              onOpenAuthModal('seller');
                            }
                          }}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-orange-50 text-orange-800 font-bold flex items-center justify-between"
                        >
                          <span>Seller Central</span>
                          <Store className="w-3.5 h-3.5 text-orange-600" />
                        </button>

                        {currentUser && currentUser.role === 'admin' && (
                          <button
                            onClick={() => { setAccountMenuOpen(false); setActiveTab('admin'); }}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-emerald-50 text-emerald-800 font-bold flex items-center justify-between"
                          >
                            <span>Admin Governance</span>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          </button>
                        )}
                      </div>

                      {currentUser && (
                        <div className="border-t border-gray-100 pt-1 mt-1">
                          <button
                            onClick={() => { setAccountMenuOpen(false); onSignOut?.(); }}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-red-50 text-red-600 font-semibold"
                          >
                            Sign Out
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* Returns & Orders */}
            <button
              onClick={onOpenOrders}
              className="hidden md:flex flex-col items-start border-2 border-transparent hover:border-white/40 rounded px-2 py-1.5 transition-colors"
            >
              <span className="text-[11px] text-slate-400 leading-none">Returns</span>
              <span className="text-white text-[13px] font-bold leading-none mt-0.5">& Orders</span>
            </button>

            {/* Seller Central Button */}
            <button
              onClick={() => {
                if (currentUser && (currentUser.role === 'seller' || currentUser.role === 'admin')) {
                  setActiveTab('seller');
                } else {
                  onOpenAuthModal('seller');
                }
              }}
              className={`hidden lg:flex flex-col items-start border-2 rounded px-2 py-1.5 transition-colors ${
                activeTab === 'seller'
                  ? 'border-amber-400 bg-amber-400/10'
                  : 'border-transparent hover:border-white/40'
              }`}
            >
              <span className="text-[11px] text-slate-400 leading-none">Sell on</span>
              <span className={`text-[13px] font-bold leading-none mt-0.5 ${activeTab === 'seller' ? 'text-amber-400' : 'text-white'}`}>
                CraftLink
              </span>
            </button>

            {/* Admin Portal Button - only show for admins */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`relative flex items-center gap-1 border-2 rounded px-2 py-2 transition-colors ${
                  activeTab === 'admin'
                    ? 'border-green-400 text-green-400'
                    : 'border-transparent text-slate-300 hover:border-white/40 hover:text-white'
                }`}
                title="Admin Governance Portal"
              >
                <ShieldCheck className="w-5 h-5" />
                {pendingAdminCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {pendingAdminCount}
                  </span>
                )}
              </button>
            )}

            {/* CART */}
            <button
              onClick={onOpenCart}
              className="flex items-end gap-1.5 border-2 border-transparent hover:border-white/40 rounded px-2 py-1 transition-colors relative"
            >
              <div className="relative">
                <ShoppingCart className="w-9 h-9 text-white" strokeWidth={1.8} />
                <span className="absolute -top-1 left-3 min-w-[20px] h-5 bg-amber-400 text-[#0f1111] text-[11px] font-black rounded-full flex items-center justify-center px-1">
                  {cartCount}
                </span>
              </div>
              <div className="hidden sm:block pb-1">
                <span className="text-white font-black text-[13px] leading-none">Cart</span>
              </div>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(m => !m)}
              className="md:hidden p-2 text-white hover:text-amber-400"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* ── SECONDARY NAV BAR (Category Links) ─────── */}
      <div className="bg-[#232f3e] overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-0 h-10 max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 whitespace-nowrap">

          {/* "All" hamburger */}
          <button
            onClick={() => setActiveTab('buyer')}
            className="flex items-center gap-1.5 text-white text-[13px] font-bold hover:text-amber-300 px-3 h-full border-2 border-transparent hover:border-white/30 transition-colors flex-shrink-0"
          >
            <Menu className="w-4 h-4" />
            <span>All</span>
          </button>

          {NAV_LINKS.map((link, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveTab('buyer');
                if (link.cat) setSelectedCategory?.(link.cat);
                if (link.scroll) {
                  setTimeout(() => {
                    document.getElementById(link.scroll)?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }}
              className="text-white text-[13px] hover:text-amber-300 px-3 h-full border-2 border-transparent hover:border-white/30 transition-colors flex-shrink-0 font-medium"
            >
              {link.icon} {link.label}
            </button>
          ))}

          {/* Trust badge on right */}
          <div className="ml-auto hidden lg:flex items-center gap-1.5 text-emerald-400 text-[12px] font-semibold flex-shrink-0 pl-3">
            <Truck className="w-3.5 h-3.5" />
            <span>100+ GI Artisan Clusters</span>
          </div>
        </div>
      </div>

      {/* ── MOBILE MENU ─────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 p-4 space-y-3 animate-fade-in">
          {currentUser ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl mb-2 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-gray-900">{currentUser.store_name || currentUser.name}</div>
                <div className="text-[11px] text-gray-500">{currentUser.email || currentUser.phone}</div>
              </div>
              <button
                onClick={() => { setMobileMenuOpen(false); onSignOut?.(); }}
                className="text-xs font-bold text-red-600"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => { onOpenAuthModal?.('buyer'); setMobileMenuOpen(false); }}
              className="w-full py-2.5 px-4 rounded-lg bg-[#FFD814] font-bold text-xs text-gray-900 shadow text-center"
            >
              Sign In / Register
            </button>
          )}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (currentUser && (currentUser.role === 'seller' || currentUser.role === 'admin')) {
                setActiveTab('seller');
              } else {
                onOpenAuthModal('seller');
              }
            }}
            className="w-full text-left px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold text-sm flex items-center justify-between"
          >
            <span>🏪 Seller Central (0% Commission)</span>
            <Store className="w-4 h-4 text-orange-600" />
          </button>

          <button
            onClick={() => { onOpenOrders?.(); setMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 font-semibold text-sm"
          >
            📦 Returns & Orders
          </button>

          <button
            onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 font-semibold text-sm flex items-center justify-between"
          >
            <span>🛡 Admin Portal {pendingAdminCount > 0 && `(${pendingAdminCount} pending)`}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

    </header>
  );
}
