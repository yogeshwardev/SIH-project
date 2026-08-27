import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Zap, Package,
  SlidersHorizontal, Search, Filter, TrendingUp, Truck
} from 'lucide-react';
import { api } from '../services/api';
import { COMMERCIAL_PRODUCTS } from '../data/commercialProducts';
import ProductCardCommercial from '../components/ProductCardCommercial';
import ProductDetailModal from '../components/ProductDetailModal';

/* ─── Hero Banners ─── one dark photo per slide, no rainbows */
const BANNERS = [
  {
    label:    'GREAT INDIAN HANDLOOM SALE',
    heading:  'Pure Silk Sarees\nDirect From the Loom',
    sub:      'Banarasi · Kanjeevaram · Chanderi — GI Certified',
    discount: 'Up to 45% off',
    cta:      'Shop Handlooms',
    cat:      'Handloom & Textiles',
    img:      'https://images.unsplash.com/photo-1610030460946-7e2e7e01e37e?w=900&q=80',
  },
  {
    label:    '500-YEAR HERITAGE',
    heading:  'Jaipur Blue Pottery\nCollection',
    sub:      'Quartz-glazed · Cobalt blue · Hand-painted',
    discount: 'Flat 36% off',
    cta:      'Explore Ceramics',
    cat:      'Pottery & Ceramics',
    img:      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&q=80',
  },
  {
    label:    'BASTAR TRIBAL COMMUNITY',
    heading:  '4000 Years of\nBell Metal Craft',
    sub:      'Lost-wax cast Dhokra · Zero industrial machines',
    discount: 'Direct from artisan',
    cta:      'Discover Tribal Art',
    cat:      'Metal Craft & Bell Metal',
    img:      'https://images.unsplash.com/photo-1611095790444-1dfa35e37b52?w=900&q=80',
  },
];

/* ─── Quick categories ─── */
const CATS = [
  { id: 'All',                       emoji: '🛍️', label: 'All Crafts' },
  { id: 'Handloom & Textiles',       emoji: '🧣', label: 'Handloom' },
  { id: 'Pottery & Ceramics',        emoji: '🏺', label: 'Pottery' },
  { id: 'Woodcraft & Carving',       emoji: '🪵', label: 'Woodcraft' },
  { id: 'Metal Craft & Bell Metal',  emoji: '🔱', label: 'Metal Art' },
  { id: 'Cane & Bamboo',             emoji: '🧺', label: 'Bamboo' },
  { id: 'Traditional Paintings',     emoji: '🎨', label: 'Paintings' },
];

/* ─── Trust items ─── */
const TRUST = [
  { icon: '🚚', title: 'Free Delivery',   sub: 'Orders above ₹499' },
  { icon: '🔒', title: 'Secure Payments', sub: 'UPI · Card · COD' },
  { icon: '↩️', title: '7-Day Returns',   sub: 'Hassle-free' },
  { icon: '🏅', title: 'GI Certified',    sub: '100% authentic craft' },
  { icon: '🤝', title: 'Zero Middlemen',  sub: 'Direct artisan price' },
];

const SEEDED_CATALOG_PRODUCTS = COMMERCIAL_PRODUCTS.map((product) => ({
  ...product,
  _catalogKey: `seed-${product.id}`,
}));

export default function BuyerDashboardPage({ onAddToCart, onBuyNow }) {
  const [products, setProducts]   = useState(SEEDED_CATALOG_PRODUCTS);
  const [heroIdx, setHeroIdx]     = useState(0);
  const [pdpProduct, setPdp]      = useState(null);
  const [activeCat, setActiveCat] = useState('All');
  const [maxPrice, setMaxPrice]   = useState(35000);
  const [minRating, setMinRating] = useState(0);
  const [searchQ, setSearchQ]     = useState('');
  const heroTimer = useRef(null);

  useEffect(() => {
    api.getProducts({ status: 'Published' })
      .then(d => {
        if (d?.length) {
          const databaseProducts = d.map((product) => ({
            ...product,
            _catalogKey: `database-${product.id}`,
          }));
          setProducts([...SEEDED_CATALOG_PRODUCTS, ...databaseProducts]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    heroTimer.current = setInterval(() => setHeroIdx(i => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(heroTimer.current);
  }, []);

  const advanceBanner = (dir) => {
    clearInterval(heroTimer.current);
    setHeroIdx(i => (i + dir + BANNERS.length) % BANNERS.length);
    heroTimer.current = setInterval(() => setHeroIdx(i => (i + 1) % BANNERS.length), 5000);
  };

  const filtered = products.filter(p => {
    const price  = p.price || p.suggested_price || 2499;
    const rating = p.rating || 4.7;
    const catOk  = activeCat === 'All' || p.category === activeCat;
    const prOk   = price <= maxPrice;
    const rOk    = rating >= minRating;
    const sOk    = !searchQ || (p.product_name || '').toLowerCase().includes(searchQ.toLowerCase());
    return catOk && prOk && rOk && sOk;
  });

  return (
    <div style={{ background: '#F2F2F2', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ═══ HERO — dark photo, white text, NO colour gradients ═══ */}
      <div className="relative overflow-hidden" style={{ height: 'clamp(260px, 42vw, 400px)' }}>
        {BANNERS.map((b, i) => (
          <div
            key={i}
            className="absolute inset-0 hero-slide"
            style={{ opacity: heroIdx === i ? 1 : 0, pointerEvents: heroIdx === i ? 'auto' : 'none' }}
          >
            {/* Photo background */}
            <img
              src={b.img}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'brightness(0.45)' }}
            />
            {/* Subtle gradient only to ensure text readability — NOT decorative */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }}
            />

            {/* Content */}
            <div className="relative h-full flex flex-col justify-center px-8 sm:px-14 lg:px-20 max-w-[560px]">
              <span
                className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3"
              >
                {b.label}
              </span>
              <h1
                className="font-black text-white mb-3"
                style={{
                  fontSize: 'clamp(24px, 4vw, 46px)',
                  fontFamily: "'Outfit', sans-serif",
                  lineHeight: 1.1,
                  whiteSpace: 'pre-line',
                  textShadow: '0 1px 12px rgba(0,0,0,0.4)',
                }}
              >
                {b.heading}
              </h1>
              <p className="text-white/70 text-sm mb-5 leading-relaxed">{b.sub}</p>
              <div className="flex items-center gap-4">
                <span className="text-white font-black text-xl">{b.discount}</span>
                <button
                  onClick={() => setActiveCat(b.cat)}
                  style={{
                    background: '#FF9900',
                    border: '1px solid #e68900',
                    color: '#111',
                    padding: '9px 20px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#e68900'}
                  onMouseOut={e => e.currentTarget.style.background = '#FF9900'}
                >
                  {b.cta} →
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Arrows */}
        {[{dir: -1, side: 'left-3'}, {dir: 1, side: 'right-3'}].map(({dir, side}) => (
          <button
            key={dir}
            onClick={() => advanceBanner(dir)}
            className={`absolute ${side} top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center`}
            style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
          >
            {dir < 0 ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        ))}

        {/* Dots */}
        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 z-10">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              style={{
                width: heroIdx === i ? '22px' : '8px',
                height: '8px',
                borderRadius: '99px',
                background: heroIdx === i ? '#FF9900' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* ═══ CATEGORY STRIP ═══ */}
      <div style={{ background: '#fff', borderBottom: '1px solid #D5D9D9' }}>
        <div className="max-w-[1400px] mx-auto flex overflow-x-auto scrollbar-none">
          {CATS.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className="flex flex-col items-center gap-1.5 px-5 py-3.5 flex-shrink-0"
              style={{
                color: activeCat === c.id ? '#FF9900' : '#565959',
                background: 'none',
                border: 'none',
                borderBottom: activeCat === c.id ? '2px solid #FF9900' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '20px' }}>{c.emoji}</span>
              <span style={{ fontSize: '11px', fontWeight: activeCat === c.id ? 700 : 500, whiteSpace: 'nowrap' }}>
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TRUST STRIP ═══ */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-3">
        <div
          style={{
            background: '#fff',
            border: '1px solid #D5D9D9',
            borderRadius: '8px',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {TRUST.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 18px',
                flex: 1,
                minWidth: '140px',
                borderRight: i < TRUST.length - 1 ? '1px solid #EAEDED' : 'none',
              }}
            >
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F1111' }}>{item.title}</div>
                <div style={{ fontSize: '11px', color: '#8D9096' }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ DEALS OF THE DAY ═══ */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-3">
        <div style={{ background: '#fff', border: '1px solid #D5D9D9', borderRadius: '8px', overflow: 'hidden' }}>

          {/* Section header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #EAEDED', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap style={{ width: 18, height: 18, color: '#CC0C39', fill: '#CC0C39' }} />
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#0F1111', fontFamily: "'Outfit', sans-serif" }}>
                Deal of the Day
              </span>
              <span style={{ fontSize: '12px', color: '#565959' }}>
                Ends in: <strong className="animate-countdown" style={{ color: '#CC0C39' }}>04:18:32</strong>
              </span>
            </div>
            <button style={{ fontSize: '13px', color: '#007185', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              See all deals →
            </button>
          </div>

          {/* Deal grid */}
          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {products.slice(0, 5).map(p => {
              const price = p.price || p.suggested_price || 2499;
              const mrp   = p.mrp || Math.round(price * 1.45);
              const disc  = Math.round(((mrp - price) / mrp) * 100);
              const sold  = 40 + ((p.id * 17) % 50);
              return (
                <button
                  key={p._catalogKey || p.id}
                  onClick={() => setPdp(p)}
                  style={{
                    background: '#FAFAFA',
                    border: '1px solid #D5D9D9',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    padding: 0,
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#FF9900'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#D5D9D9'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', background: '#fff' }}>
                    <img
                      src={p.enhanced_image || p.original_image}
                      alt={p.product_name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={e => e.target.src = `https://placehold.co/150x150/F7F8F8/9EA2A2?text=${encodeURIComponent((p.product_name || '').slice(0, 6))}`}
                    />
                  </div>
                  <div style={{ padding: '10px' }}>
                    <span className="deal-badge">-{disc}%</span>
                    {/* Sold bar */}
                    <div style={{ margin: '8px 0 6px' }}>
                      <div style={{ background: '#EAEDED', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${sold}%`, height: '100%', borderRadius: '99px', background: sold > 70 ? '#CC0C39' : '#FF9900' }} />
                      </div>
                      <span style={{ fontSize: '10px', color: sold > 70 ? '#CC0C39' : '#FF9900', fontWeight: 700, marginTop: '3px', display: 'block' }}>
                        {sold > 70 ? '🔥 Almost gone' : `${sold}% claimed`}
                      </span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F1111' }}>₹{price.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '10px', color: '#8D9096', textDecoration: 'line-through' }}>₹{mrp.toLocaleString('en-IN')}</div>
                    <p style={{ fontSize: '11px', color: '#565959', marginTop: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {p.product_name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ CATALOG — SIDEBAR + GRID ═══ */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-3 pb-16">
        <div className="flex gap-3 items-start">

          {/* FILTER SIDEBAR */}
          <aside className="hidden lg:block w-[200px] flex-shrink-0 sticky top-[70px]">
            <div style={{ background: '#fff', border: '1px solid #D5D9D9', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #EAEDED', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F1111' }}>Filters</span>
                <button
                  onClick={() => { setActiveCat('All'); setMaxPrice(35000); setMinRating(0); }}
                  style={{ fontSize: '11px', color: '#007185', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear all
                </button>
              </div>

              <div style={{ padding: '14px' }}>
                {/* Category */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#8D9096', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Category</div>
                  {CATS.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio" name="cat"
                        checked={activeCat === c.id}
                        onChange={() => setActiveCat(c.id)}
                        style={{ accentColor: '#FF9900', width: '13px', height: '13px' }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: activeCat === c.id ? 700 : 500, color: activeCat === c.id ? '#FF9900' : '#565959' }}>
                        {c.emoji} {c.label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Price */}
                <div style={{ borderTop: '1px solid #EAEDED', paddingTop: '14px', marginBottom: '18px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#8D9096', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    Max Price: <span style={{ color: '#0F1111', textTransform: 'none', fontWeight: 800 }}>₹{maxPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <input type="range" min={499} max={35000} step={500} value={maxPrice}
                    onChange={e => setMaxPrice(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#FF9900' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8D9096', fontWeight: 600, marginTop: '4px' }}>
                    <span>₹499</span><span>₹35,000</span>
                  </div>
                </div>

                {/* Rating */}
                <div style={{ borderTop: '1px solid #EAEDED', paddingTop: '14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#8D9096', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Rating</div>
                  {[{v: 4, l: '4★ & above'}, {v: 3, l: '3★ & above'}, {v: 0, l: 'All ratings'}].map(r => (
                    <label key={r.v} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="rating" checked={minRating === r.v} onChange={() => setMinRating(r.v)}
                        style={{ accentColor: '#FF9900', width: '13px', height: '13px' }} />
                      <span style={{ fontSize: '12px', color: minRating === r.v ? '#FF9900' : '#565959', fontWeight: minRating === r.v ? 700 : 500 }}>
                        {r.l}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* PRODUCT AREA */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Toolbar */}
            <div style={{ background: '#fff', border: '1px solid #D5D9D9', borderRadius: '8px', padding: '10px 14px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: '#565959' }}>
                Showing <strong style={{ color: '#0F1111' }}>{filtered.length}</strong> results
                {activeCat !== 'All' && <> in <strong style={{ color: '#C45500' }}>{activeCat}</strong></>}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F7F8F8', border: '1px solid #D5D9D9', borderRadius: '6px', padding: '6px 10px' }}>
                  <Search style={{ width: 14, height: 14, color: '#8D9096' }} />
                  <input
                    type="text" placeholder="Search products..."
                    value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    style={{ background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: '#0F1111', width: '160px' }}
                  />
                </div>
              </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #D5D9D9', borderRadius: '8px', padding: '60px 20px', textAlign: 'center' }}>
                <Package style={{ width: 40, height: 40, color: '#D5D9D9', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#565959' }}>No products found</p>
                <button onClick={() => { setActiveCat('All'); setMaxPrice(35000); setMinRating(0); setSearchQ(''); }}
                  style={{ marginTop: '10px', fontSize: '13px', color: '#007185', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '10px' }}>
                {filtered.map(product => (
                  <ProductCardCommercial
                    key={product._catalogKey || product.id}
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

      {/* ═══ UNDER ₹999 SECTION ═══ */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div style={{ background: '#fff', border: '1px solid #D5D9D9', borderRadius: '8px', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <TrendingUp style={{ width: 16, height: 16, color: '#007185' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#007185', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Budget Artisan Store</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F1111', marginBottom: '6px', fontFamily: "'Outfit', sans-serif" }}>
              Everyday Crafts Under ₹999
            </h2>
            <p style={{ fontSize: '13px', color: '#565959' }}>
              Bamboo baskets, terracotta diyas, wooden toys — straight from India's villages
            </p>
          </div>
          <button
            onClick={() => { setMaxPrice(999); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ background: '#FF9900', border: '1px solid #e68900', color: '#111', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
            onMouseOver={e => e.currentTarget.style.background = '#e68900'}
            onMouseOut={e => e.currentTarget.style.background = '#FF9900'}
          >
            Browse Under ₹999
          </button>
        </div>
      </div>

      {pdpProduct && (
        <ProductDetailModal product={pdpProduct} onClose={() => setPdp(null)} onAddToCart={onAddToCart} onBuyNow={onBuyNow} />
      )}
    </div>
  );
}
