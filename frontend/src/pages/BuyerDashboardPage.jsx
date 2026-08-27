import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Zap, ShoppingCart, Filter,
  Search, ShieldCheck, Truck, RotateCcw, Star, SlidersHorizontal,
  TrendingUp, Package, X
} from 'lucide-react';
import { api } from '../services/api';
import { COMMERCIAL_PRODUCTS, CRAFT_CATEGORIES } from '../data/commercialProducts';
import ProductCardCommercial from '../components/ProductCardCommercial';
import ProductDetailModal from '../components/ProductDetailModal';

/* ─────────────────────────────────────────────────────
   HERO BANNER DATA
───────────────────────────────────────────────────── */
const BANNERS = [
  {
    eyebrow:  'Great Indian Handloom Sale',
    headline: 'Pure Silk\nSarees Direct\nFrom the Loom',
    sub:      'Banarasi, Kanjeevaram & Chanderi — GI Certified, Zero Middlemen',
    discount: 'Up to 45% off',
    ctaText:  'Shop Handlooms',
    ctaCat:   'Handloom & Textiles',
    accent:   '#D4A017',
    bg:       'linear-gradient(130deg, #1a0a00 0%, #3b1508 40%, #6b2408 100%)',
    img:      'https://images.unsplash.com/photo-1610030460946-7e2e7e01e37e?w=700&q=85',
  },
  {
    eyebrow:  '500-Year Heritage Craft',
    headline: 'Jaipur Blue\nPottery\nCollection',
    sub:      'Clay-free quartz glazed with cobalt blue — Handpainted, Kiln Fired',
    discount: 'Flat 36% off',
    ctaText:  'Explore Ceramics',
    ctaCat:   'Pottery & Ceramics',
    accent:   '#60A5FA',
    bg:       'linear-gradient(130deg, #030B1A 0%, #0C1F3F 40%, #0F3460 100%)',
    img:      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=85',
  },
  {
    eyebrow:  'Bastar Tribal Community',
    headline: '4000 Years of\nBell Metal\nCraft',
    sub:      'Lost-wax cast Dhokra sculptures — Zero Industrial Machines Used',
    discount: 'Direct from artisan',
    ctaText:  'Discover Tribal Art',
    ctaCat:   'Metal Craft & Bell Metal',
    accent:   '#FB923C',
    bg:       'linear-gradient(130deg, #0D0500 0%, #2A1000 40%, #4A1A00 100%)',
    img:      'https://images.unsplash.com/photo-1611095790444-1dfa35e37b52?w=700&q=85',
  },
];

/* ─────────────────────────────────────────────────────
   TRUST STRIP
───────────────────────────────────────────────────── */
const TRUST_ITEMS = [
  { icon: '🚚', title: 'Free Delivery', sub: 'Orders above ₹499' },
  { icon: '🔒', title: 'Secure Payments', sub: 'UPI · Cards · COD' },
  { icon: '↩️', title: '7-Day Returns', sub: 'No questions asked' },
  { icon: '🏅', title: 'GI Certified', sub: '100% authentic origin' },
  { icon: '🤝', title: 'Zero Middlemen', sub: 'Direct artisan pricing' },
];

/* ─────────────────────────────────────────────────────
   CATEGORY ICONS ROW
───────────────────────────────────────────────────── */
const QUICK_CATS = [
  { id: 'All',                      emoji: '🛍️', label: 'All Crafts' },
  { id: 'Handloom & Textiles',      emoji: '🧣', label: 'Handloom' },
  { id: 'Pottery & Ceramics',       emoji: '🏺', label: 'Pottery' },
  { id: 'Woodcraft & Carving',      emoji: '🪵', label: 'Woodcraft' },
  { id: 'Metal Craft & Bell Metal', emoji: '🔱', label: 'Metal Art' },
  { id: 'Cane & Bamboo',            emoji: '🧺', label: 'Bamboo' },
  { id: 'Traditional Paintings',    emoji: '🎨', label: 'Paintings' },
];

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function BuyerDashboardPage({ onAddToCart, onOpenCart, onBuyNow }) {
  const [products, setProducts]   = useState(COMMERCIAL_PRODUCTS);
  const [heroIdx, setHeroIdx]     = useState(0);
  const [pdpProduct, setPdp]      = useState(null);
  const [activeCat, setActiveCat] = useState('All');
  const [maxPrice, setMaxPrice]   = useState(35000);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQ, setSearchQ]     = useState('');
  const heroTimer = useRef(null);

  useEffect(() => {
    api.getProducts({ status: 'Published' })
      .then(data => { if (data?.length) setProducts([...COMMERCIAL_PRODUCTS, ...data]); })
      .catch(() => {});
  }, []);

  // Auto-rotate hero
  useEffect(() => {
    heroTimer.current = setInterval(() => setHeroIdx(i => (i + 1) % BANNERS.length), 5500);
    return () => clearInterval(heroTimer.current);
  }, []);

  const advanceBanner = (dir) => {
    clearInterval(heroTimer.current);
    setHeroIdx(i => (i + dir + BANNERS.length) % BANNERS.length);
    heroTimer.current = setInterval(() => setHeroIdx(i => (i + 1) % BANNERS.length), 5500);
  };

  const filtered = products.filter(p => {
    const price  = p.price || p.suggested_price || 2499;
    const rating = p.rating || 4.7;
    const name   = (p.product_name || '').toLowerCase();
    const catOk  = activeCat === 'All' || p.category === activeCat;
    const prOk   = price <= maxPrice;
    const rOk    = rating >= minRating;
    const sOk    = !searchQ || name.includes(searchQ.toLowerCase());
    return catOk && prOk && rOk && sOk;
  });

  const banner = BANNERS[heroIdx];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#F0F2F5', minHeight: '100vh' }}>

      {/* ═══════════════════════════════════════════════
          HERO CAROUSEL
      ═══════════════════════════════════════════════ */}
      <div className="relative" style={{ height: 'clamp(300px, 48vw, 440px)', overflow: 'hidden' }}>
        {BANNERS.map((b, i) => (
          <div
            key={i}
            className="absolute inset-0 hero-slide"
            style={{ background: b.bg, opacity: heroIdx === i ? 1 : 0, pointerEvents: heroIdx === i ? 'auto' : 'none' }}
          >
            {/* Right photo — fades in beautifully */}
            <div
              className="absolute inset-y-0 right-0 w-1/2 hidden md:block"
              style={{
                backgroundImage: `url(${b.img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 20%, black 60%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 20%, black 60%)',
              }}
            />

            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20 max-w-[620px]">
              {/* Eyebrow */}
              <div className="mb-4">
                <span
                  className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.08)', color: b.accent }}
                >
                  <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse-dot" style={{ background: b.accent }} />
                  {b.eyebrow}
                </span>
              </div>

              {/* Headline */}
              <h1
                className="font-black text-white leading-none mb-4"
                style={{
                  fontSize: 'clamp(28px, 5vw, 52px)',
                  fontFamily: "'Outfit', sans-serif",
                  textShadow: '0 2px 24px rgba(0,0,0,0.4)',
                  whiteSpace: 'pre-line',
                }}
              >
                {b.headline}
              </h1>

              <p className="text-white/65 text-sm leading-relaxed mb-6 max-w-[420px]">{b.sub}</p>

              <div className="flex items-center gap-4">
                <span className="font-black text-2xl" style={{ color: b.accent }}>{b.discount}</span>
                <button
                  onClick={() => setActiveCat(b.ctaCat)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-sm text-gray-900 transition-all hover:scale-105 active:scale-95"
                  style={{ background: b.accent, boxShadow: `0 4px 20px ${b.accent}50` }}
                >
                  {b.ctaText}
                  <ChevronRight className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Arrows */}
        {[
          { dir: -1, pos: 'left-3' },
          { dir:  1, pos: 'right-3' },
        ].map(({ dir, pos }) => (
          <button
            key={dir}
            onClick={() => advanceBanner(dir)}
            className={`absolute ${pos} top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110`}
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            {dir < 0
              ? <ChevronLeft  className="w-5 h-5 text-white" strokeWidth={2.5} />
              : <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.5} />}
          </button>
        ))}

        {/* Dot indicators */}
        <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-2 z-20">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => { clearInterval(heroTimer.current); setHeroIdx(i); }}
              className="transition-all rounded-full"
              style={{
                width:  heroIdx === i ? '24px' : '8px',
                height: '8px',
                background: heroIdx === i ? banner.accent : 'rgba(255,255,255,0.35)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          CATEGORY QUICK ICONS
      ═══════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-200" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.05)' }}>
        <div className="max-w-[1400px] mx-auto flex overflow-x-auto scrollbar-none">
          {QUICK_CATS.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className="flex flex-col items-center gap-1.5 px-5 py-3.5 flex-shrink-0 transition-colors relative"
              style={{ borderBottom: activeCat === c.id ? '2.5px solid #F97316' : '2.5px solid transparent' }}
            >
              <span className="text-[22px] leading-none">{c.emoji}</span>
              <span
                className="text-[11px] font-semibold whitespace-nowrap"
                style={{ color: activeCat === c.id ? '#EA580C' : '#6B7280' }}
              >
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          TRUST STRIP
      ═══════════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div className="flex items-stretch overflow-x-auto scrollbar-none divide-x divide-gray-100">
            {TRUST_ITEMS.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0 flex-1 min-w-[160px]">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <div className="text-[12px] font-bold text-gray-900 leading-none">{item.title}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          DEALS OF THE DAY
      ═══════════════════════════════════════════════ */}
      <div id="deals" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
                <Zap className="w-4.5 h-4.5 text-white fill-white" />
              </div>
              <div>
                <h2 className="text-[15px] font-black text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Deal of the Day
                </h2>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                  Ends in:
                  <span className="text-red-600 font-black ml-1 animate-countdown">04:18:32</span>
                </div>
              </div>
            </div>
            <button className="text-[13px] font-semibold text-[#007185] hover:text-[#C45500] hover:underline transition-colors">
              See all deals →
            </button>
          </div>

          {/* Deal Cards */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {products.slice(0, 5).map(p => {
              const price = p.price || p.suggested_price || 2499;
              const mrp   = p.mrp || Math.round(price * 1.45);
              const disc  = p.discount_pct || Math.round(((mrp - price) / mrp) * 100);
              const sold  = 40 + ((p.id * 17) % 50);
              return (
                <button
                  key={p.id}
                  onClick={() => setPdp(p)}
                  className="group text-left rounded-xl overflow-hidden border border-gray-200 hover:border-orange-300 transition-all hover:shadow-md"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden p-2">
                    <img
                      src={p.enhanced_image || p.original_image}
                      alt={p.product_name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={e => e.target.src = `https://placehold.co/200x200/F3F4F6/9CA3AF?text=${encodeURIComponent((p.product_name || '').slice(0, 8))}`}
                    />
                  </div>
                  <div className="p-2.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="deal-badge">-{disc}%</span>
                      <span className="text-[10px] text-red-600 font-bold">OFF</span>
                    </div>
                    {/* Sold progress */}
                    <div className="mb-2">
                      <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${sold}%`, background: sold > 70 ? '#EF4444' : '#F97316' }}
                        />
                      </div>
                      <span className="text-[10px] text-orange-600 font-bold mt-0.5 block">
                        {sold > 70 ? '🔥 Almost sold out' : `${sold}% claimed`}
                      </span>
                    </div>
                    <div className="text-[15px] font-black text-gray-900">₹{price.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-gray-400 line-through">₹{mrp.toLocaleString('en-IN')}</div>
                    <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 group-hover:text-orange-700 transition-colors">
                      {p.product_name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          MAIN CATALOG — SIDEBAR + GRID
      ═══════════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 pb-16">
        <div className="flex gap-4 items-start">

          {/* FILTER SIDEBAR */}
          <aside className="hidden lg:block w-[210px] flex-shrink-0 sticky top-[80px]">
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-[13px] font-black text-gray-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                  Filters
                </h3>
                <button
                  onClick={() => { setActiveCat('All'); setMaxPrice(35000); setMinRating(0); }}
                  className="text-[11px] text-[#007185] hover:underline font-semibold"
                >
                  Clear all
                </button>
              </div>

              <div className="p-4 space-y-5">
                {/* Category */}
                <div>
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Category</h4>
                  <div className="space-y-1.5">
                    {QUICK_CATS.map(c => (
                      <label key={c.id} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="radio"
                          name="cat"
                          checked={activeCat === c.id}
                          onChange={() => setActiveCat(c.id)}
                          className="w-3.5 h-3.5 accent-orange-500"
                        />
                        <span className={`text-[12px] flex items-center gap-1.5 ${activeCat === c.id ? 'font-bold text-orange-600' : 'font-medium text-gray-700 group-hover:text-gray-900'}`}>
                          <span>{c.emoji}</span>
                          {c.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Max Price: <span className="text-gray-800 normal-case font-black">₹{maxPrice.toLocaleString('en-IN')}</span>
                  </h4>
                  <input
                    type="range"
                    min={499} max={35000} step={500}
                    value={maxPrice}
                    onChange={e => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 font-semibold">
                    <span>₹499</span><span>₹35,000</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Min. Rating</h4>
                  {[{v: 4, label: '4★ & up'}, {v: 3, label: '3★ & up'}, {v: 0, label: 'All ratings'}].map(r => (
                    <label key={r.v} className="flex items-center gap-2.5 py-1 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        checked={minRating === r.v}
                        onChange={() => setMinRating(r.v)}
                        className="w-3.5 h-3.5 accent-orange-500"
                      />
                      <span className={`text-[12px] flex items-center gap-1 ${minRating === r.v ? 'font-bold text-orange-600' : 'text-gray-600'}`}>
                        {r.v > 0 && <span className="text-amber-500">{'★'.repeat(r.v)}</span>}
                        {r.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* PRODUCTS AREA */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="bg-white rounded-2xl px-4 py-3 mb-3 flex items-center justify-between gap-3"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <div className="text-[13px] text-gray-600">
                Showing <strong className="text-gray-900 font-black">{filtered.length}</strong> results
                {activeCat !== 'All' && (
                  <span> in <strong className="text-orange-600">{activeCat}</strong></span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile filter */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filter
                </button>
                <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl px-3 py-1.5">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    className="bg-transparent text-[12px] text-gray-700 outline-none w-28"
                  />
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-[14px] font-semibold text-gray-500">No products found</p>
                <button
                  onClick={() => { setActiveCat('All'); setMaxPrice(35000); setMinRating(0); setSearchQ(''); }}
                  className="mt-3 text-[13px] text-orange-500 font-bold hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 stagger-children">
                {filtered.map(product => (
                  <ProductCardCommercial
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    onQuickView={setPdp}
                    onBuyNow={onBuyNow}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          UNDER ₹999 MEESHO-STYLE BANNER
      ═══════════════════════════════════════════════ */}
      <div id="under999" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F59E0B 100%)' }}
        >
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
          />
          <div className="relative px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                <TrendingUp className="w-3 h-3" />
                Budget Artisan Store
              </div>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Everyday Crafts Under ₹999
              </h2>
              <p className="text-white/75 text-sm max-w-md">
                Bamboo baskets, terracotta diyas, wooden toys & more — straight from India's villages.
              </p>
            </div>
            <button
              onClick={() => { setMaxPrice(999); setActiveCat('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="px-8 py-3.5 rounded-full bg-white font-black text-sm text-gray-900 shadow-xl whitespace-nowrap hover:shadow-2xl transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            >
              Browse Under ₹999 →
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          PRODUCT DETAIL MODAL
      ═══════════════════════════════════════════════ */}
      {pdpProduct && (
        <ProductDetailModal
          product={pdpProduct}
          onClose={() => setPdp(null)}
          onAddToCart={onAddToCart}
          onBuyNow={onBuyNow}
        />
      )}

    </div>
  );
}
