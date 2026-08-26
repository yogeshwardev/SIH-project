import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Zap, SlidersHorizontal, ShieldCheck, 
  Star, Truck, Award, ShoppingCart, Filter, X
} from 'lucide-react';
import { api } from '../services/api';
import { COMMERCIAL_PRODUCTS, CRAFT_CATEGORIES } from '../data/commercialProducts';
import ProductCardCommercial from '../components/ProductCardCommercial';
import ProductDetailModal from '../components/ProductDetailModal';

// Hero banner data
const HERO_BANNERS = [
  {
    title: 'Great Indian Handloom Festival',
    subtitle: 'Shop pure Banarasi silk & Kanchipuram sarees direct from the loom',
    discount: 'Up to 45% OFF',
    tag: '100% Silk Mark & GI Certified',
    bg: 'linear-gradient(135deg, #7B0D1E 0%, #4A0E17 50%, #1A0508 100%)',
    ctaText: 'Shop Handlooms',
    ctaCat: 'Handloom & Textiles',
    image: 'https://images.unsplash.com/photo-1610030460946-7e2e7e01e37e?w=800&q=80',
  },
  {
    title: 'Jaipur Blue Pottery — 500-Year Heritage',
    subtitle: 'Clay-free quartz pottery glazed with cobalt blue & hand-painted',
    discount: 'Flat 36% OFF',
    tag: 'From Sanganer Kiln Masters',
    bg: 'linear-gradient(135deg, #0F3460 0%, #16213E 50%, #0D1117 100%)',
    ctaText: 'Explore Ceramics',
    ctaCat: 'Pottery & Ceramics',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
  },
  {
    title: 'Bastar Dhokra — 4000 Years of Bell Metal',
    subtitle: 'Lost-wax cast tribal bronze sculptures by indigenous Ghadwa artists',
    discount: 'Zero Middlemen',
    tag: 'GI Tagged • 100% Tribal Community',
    bg: 'linear-gradient(135deg, #3D2612 0%, #2A1810 50%, #140C06 100%)',
    ctaText: 'Discover Tribal Art',
    ctaCat: 'Metal Craft & Bell Metal',
    image: 'https://images.unsplash.com/photo-1611095790444-1dfa35e37b52?w=800&q=80',
  },
];

export default function BuyerDashboardPage({ onAddToCart, onOpenCart, onBuyNow }) {
  const [products, setProducts]           = useState(COMMERCIAL_PRODUCTS);
  const [heroIdx, setHeroIdx]             = useState(0);
  const [activeProduct, setActiveProduct] = useState(null);
  const [filterOpen, setFilterOpen]       = useState(false);

  // Filter state
  const [activeCat, setActiveCat]   = useState('All');
  const [maxPrice, setMaxPrice]     = useState(35000);
  const [minRating, setMinRating]   = useState(0);

  // Auto-rotate hero
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_BANNERS.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Fetch live products from backend
  useEffect(() => {
    api.getProducts({ status: 'Published' })
      .then(data => { if (data?.length) setProducts([...COMMERCIAL_PRODUCTS, ...data]); })
      .catch(() => {});
  }, []);

  const filtered = products.filter(p => {
    const price  = p.price || p.suggested_price || 2499;
    const rating = p.rating || 4.7;
    const catOk  = activeCat === 'All' || p.category === activeCat;
    const priceOk = price <= maxPrice;
    const ratingOk = rating >= minRating;
    return catOk && priceOk && ratingOk;
  });

  const banner = HERO_BANNERS[heroIdx];
  const deals  = products.slice(0, 5);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#f3f4f6', minHeight: '100vh' }}>

      {/* ═══════════════════════════════════════════
          HERO CAROUSEL
      ═══════════════════════════════════════════ */}
      <div className="relative overflow-hidden" style={{ height: '380px' }}>
        {/* Background */}
        {HERO_BANNERS.map((b, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700 hero-slide"
            style={{ background: b.bg, opacity: heroIdx === i ? 1 : 0, pointerEvents: heroIdx === i ? 'auto' : 'none' }}
          >
            {/* Right image */}
            <div
              className="absolute right-0 top-0 h-full w-[45%] hidden md:block"
              style={{
                backgroundImage: `url(${b.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 40%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 40%, black 100%)',
              }}
            />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 lg:px-16 max-w-[700px]">
              <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm mb-4">
                {b.tag}
              </span>
              <h2 className="text-white font-black leading-tight mb-2" style={{ fontSize: 'clamp(22px, 4vw, 42px)', fontFamily: "'Outfit', sans-serif" }}>
                {b.title}
              </h2>
              <p className="text-white/75 text-sm sm:text-base mb-5 max-w-[520px]">{b.subtitle}</p>
              <div className="flex items-center gap-4">
                <span className="text-amber-300 font-black text-2xl">{b.discount}</span>
                <button
                  onClick={() => setActiveCat(b.ctaCat)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-gray-900 transition-all active:scale-95"
                  style={{ backgroundColor: '#ffd814', border: '1px solid #f0c000' }}
                >
                  {b.ctaText} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Arrows */}
        <button
          onClick={() => setHeroIdx(i => (i - 1 + HERO_BANNERS.length) % HERO_BANNERS.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setHeroIdx(i => (i + 1) % HERO_BANNERS.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 z-20">
          {HERO_BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className={`rounded-full transition-all ${heroIdx === i ? 'w-6 h-2.5 bg-amber-400' : 'w-2.5 h-2.5 bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CATEGORY SHORTCUT ICONS (Flipkart Style)
      ═══════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-0 max-w-[1400px] mx-auto px-4 py-1">
          {CRAFT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.filter || 'All')}
              className={`flex flex-col items-center gap-1.5 px-4 sm:px-6 py-3 flex-shrink-0 border-b-2 transition-all ${
                activeCat === (cat.filter || 'All')
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-orange-500'
              }`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-[11px] font-semibold whitespace-nowrap">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          DEALS OF THE DAY (Flipkart Flash Sale)
      ═══════════════════════════════════════════ */}
      <div id="deals" className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 mt-4">
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          
          {/* Section Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Deal of the Day
                </h2>
                <span className="text-[12px] text-gray-500">
                  Ends in: <span className="text-red-600 font-bold animate-countdown">04h : 18m : 32s</span>
                </span>
              </div>
            </div>
            <button className="text-[13px] font-semibold text-blue-600 hover:underline">
              See all deals →
            </button>
          </div>

          {/* Deal Cards Row */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {deals.map(product => {
              const price = product.price || product.suggested_price || 2499;
              const mrp = product.mrp || Math.round(price * 1.45);
              const disc = product.discount_pct || Math.round(((mrp - price) / mrp) * 100);
              return (
                <div
                  key={product.id}
                  onClick={() => setActiveProduct(product)}
                  className="group border border-gray-200 rounded-lg p-3 hover:border-orange-300 hover:shadow-md cursor-pointer transition-all"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-50 rounded-md overflow-hidden flex items-center justify-center mb-2 img-zoom-container">
                    <img
                      src={product.enhanced_image || product.original_image}
                      alt={product.product_name}
                      className="w-full h-full object-contain p-2"
                      onError={e => e.target.src = `https://placehold.co/200x200/f3f4f6/9ca3af?text=${encodeURIComponent(product.product_name?.slice(0,8) || 'Craft')}`}
                    />
                  </div>

                  {/* Discount pill */}
                  <div className="mb-1.5">
                    <span className="deal-badge">-{disc}%</span>
                    <span className="text-[10px] text-red-600 font-bold ml-1">OFF</span>
                  </div>

                  {/* Progress bar (sold quantity indicator) */}
                  <div className="mb-1.5">
                    <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${Math.round(60 + Math.random() * 30)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-orange-600 font-bold mt-0.5 block">Selling fast</span>
                  </div>

                  <div className="text-[14px] font-bold text-gray-900">₹{price.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-gray-500 line-through">₹{mrp.toLocaleString('en-IN')}</div>
                  <p className="text-[11px] text-gray-700 mt-1 line-clamp-2 group-hover:text-orange-700">{product.product_name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          TRUST STRIP  
      ═══════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 mt-4">
        <div className="bg-white rounded-xl shadow-card p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🚚', title: 'FREE Delivery', sub: 'On orders above ₹499' },
            { icon: '🔒', title: 'Secure Payment', sub: 'UPI, Card, COD accepted' },
            { icon: '↩️', title: '7-Day Returns', sub: 'Hassle-free returns' },
            { icon: '🏅', title: 'GI Certified', sub: '100% authentic crafts' },
          ].map(item => (
            <div key={item.title} className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <div className="text-[13px] font-bold text-gray-900">{item.title}</div>
                <div className="text-[11px] text-gray-500">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          MAIN CATALOG — FILTER SIDEBAR + PRODUCTS GRID
      ═══════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 mt-4 pb-12">
        <div className="flex gap-4 items-start">

          {/* SIDEBAR FILTERS */}
          <aside className="hidden lg:block w-[220px] flex-shrink-0">
            <div className="bg-white rounded-xl shadow-card p-4 space-y-5 sticky top-[130px]">
              
              <h3 className="text-[14px] font-bold text-gray-900 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                <Filter className="w-4 h-4" />
                Filters
              </h3>

              {/* Category */}
              <div>
                <h4 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-2">Category</h4>
                {['All', 'Handloom & Textiles', 'Pottery & Ceramics', 'Woodcraft & Carving', 'Metal Craft & Bell Metal', 'Cane & Bamboo', 'Traditional Paintings'].map(c => (
                  <label key={c} className="flex items-center gap-2 py-1.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="cat"
                      checked={activeCat === c}
                      onChange={() => setActiveCat(c)}
                      className="accent-orange-500"
                    />
                    <span className={`text-[13px] ${activeCat === c ? 'text-orange-600 font-bold' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      {c}
                    </span>
                  </label>
                ))}
              </div>

              {/* Price */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Price: Up to ₹{maxPrice.toLocaleString('en-IN')}
                </h4>
                <input
                  type="range"
                  min={500} max={35000} step={500}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>₹500</span>
                  <span>₹35,000</span>
                </div>
              </div>

              {/* Avg Rating */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-2">Avg. Customer Review</h4>
                {[4, 3, 0].map(r => (
                  <label key={r} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === r}
                      onChange={() => setMinRating(r)}
                      className="accent-orange-500"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-amber-500 text-[12px]">{'★'.repeat(r || 1)}</span>
                      <span className="text-[12px] text-gray-700">
                        {r === 0 ? 'All Ratings' : `${r}★ & Up`}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Clear button */}
              <button
                onClick={() => { setActiveCat('All'); setMaxPrice(35000); setMinRating(0); }}
                className="w-full text-[12px] text-blue-600 hover:underline font-semibold text-left"
              >
                ✕ Clear all filters
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 min-w-0">
            
            {/* Results Bar */}
            <div className="bg-white rounded-xl shadow-card px-4 py-3 mb-3 flex items-center justify-between">
              <div className="text-[13px] text-gray-700">
                Showing <strong className="text-gray-900">{filtered.length}</strong> results
                {activeCat !== 'All' && <span> for <strong className="text-orange-600">"{activeCat}"</strong></span>}
              </div>
              
              {/* Mobile filter toggle */}
              <button
                onClick={() => setFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>

            {/* Products Grid */}
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl shadow-card p-12 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-[15px] font-bold text-gray-700 mb-1">No results found</h3>
                <p className="text-[13px] text-gray-500">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map(product => (
                  <ProductCardCommercial
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    onQuickView={setActiveProduct}
                    onBuyNow={onBuyNow}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          UNDER ₹999 MEESHO STYLE BANNER
      ═══════════════════════════════════════════ */}
      <div id="under999" className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 mb-8">
        <div
          className="rounded-2xl overflow-hidden p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ background: 'linear-gradient(135deg, #F15025 0%, #E91E8C 60%, #9B1FE8 100%)' }}
        >
          <div className="text-white">
            <div className="inline-block bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              Budget Artisan Store
            </div>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Everyday Crafts Under ₹999
            </h2>
            <p className="text-white/80 text-sm max-w-md">
              Authentic bamboo baskets, terracotta diyas, wooden toys and more — straight from India's villages.
            </p>
          </div>
          <button
            onClick={() => { setMaxPrice(999); setActiveCat('All'); window.scrollTo({ top: 0 }); }}
            className="px-8 py-3.5 rounded-full bg-white text-gray-900 font-black text-sm shadow-lg whitespace-nowrap hover:shadow-xl transition-shadow active:scale-95"
          >
            Browse Under ₹999 →
          </button>
        </div>
      </div>

      {/* PRODUCT DETAIL MODAL */}
      {activeProduct && (
        <ProductDetailModal
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onAddToCart={onAddToCart}
          onBuyNow={onBuyNow}
        />
      )}

    </div>
  );
}
