import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Heart, 
  Star, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  SlidersHorizontal,
  Award,
  Zap,
  Tag
} from 'lucide-react';
import { api } from '../services/api';
import { COMMERCIAL_PRODUCTS } from '../data/commercialProducts';
import ProductCardCommercial from '../components/ProductCardCommercial';
import ProductDetailModal from '../components/ProductDetailModal';

export default function BuyerDashboardPage({ 
  selectedProductFromParent, 
  onClearSelectedProduct,
  onAddToCart,
  onOpenCart,
  onBuyNow
}) {
  const [products, setProducts] = useState(COMMERCIAL_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [activeModalProduct, setActiveModalProduct] = useState(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [primeOnly, setPrimeOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(35000);
  const [heroSlide, setHeroSlide] = useState(0);

  // Hero Banners (Amazon / Flipkart Style)
  const heroBanners = [
    {
      title: "Great Indian Handloom Festival",
      subtitle: "Pure Varanasi Katan Silk & Kanchipuram Brocades",
      discount: "Up to 45% OFF",
      tag: "100% Silk Mark & GI Certified",
      bgGradient: "from-[#8B0000] via-[#4A0E17] to-[#1A0508]",
      accentColor: "text-amber-300",
      ctaText: "Shop Handloom Sarees",
      categoryTarget: "Handloom & Textiles",
      badge: "Festive Exclusive"
    },
    {
      title: "Jaipur Royal Blue Pottery Studio",
      subtitle: "Clay-Free Quartz Powder & Natural Cobalt Glaze Vases",
      discount: "Flat 35% OFF",
      tag: "Direct from Sanganer Kiln Masters",
      bgGradient: "from-[#0F3460] via-[#16213E] to-[#1A1A2E]",
      accentColor: "text-cyan-300",
      ctaText: "Explore Ceramics",
      categoryTarget: "Pottery & Ceramics",
      badge: "Mughal Heritage"
    },
    {
      title: "Ancient 4000-Yr Bastar Dhokra Art",
      subtitle: "Tribal Bell Metal & Lost-Wax Bronze Sculptures",
      discount: "Zero Middlemen Margin",
      tag: "100% Direct to Indigenous Artisans",
      bgGradient: "from-[#3D2612] via-[#2A1810] to-[#140C06]",
      accentColor: "text-amber-400",
      ctaText: "Discover Tribal Art",
      categoryTarget: "Metal Craft & Bell Metal",
      badge: "GI Tagged Craft"
    }
  ];

  // Auto slide hero banner every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchLiveProducts = async () => {
    try {
      const data = await api.getProducts({ status: 'Published' });
      if (data && data.length > 0) {
        // Merge backend products with rich commercial catalog
        setProducts(data);
      }
    } catch (e) {
      console.warn('Using local commercial catalog');
    }
  };

  useEffect(() => {
    fetchLiveProducts();
  }, []);

  useEffect(() => {
    if (selectedProductFromParent) {
      setActiveModalProduct(selectedProductFromParent);
    }
  }, [selectedProductFromParent]);

  // Filtered Products Calculation
  const filteredProducts = products.filter((p) => {
    const matchesSearch = !searchTerm || 
      p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.craft_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.region?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesRegion = selectedRegion === 'All' || p.region?.includes(selectedRegion);
    const matchesRating = (p.rating || 4.8) >= minRating;
    const matchesPrice = (p.suggested_price || p.price || 2499) <= maxPrice;

    return matchesSearch && matchesCategory && matchesRegion && matchesRating && matchesPrice;
  });

  const categories = [
    'All',
    'Handloom & Textiles',
    'Pottery & Ceramics',
    'Woodcraft & Carving',
    'Metal Craft & Bell Metal',
    'Cane & Bamboo',
    'Traditional Paintings'
  ];

  const regions = [
    'All',
    'Varanasi',
    'Jaipur',
    'Assam',
    'Bastar',
    'Channapatna'
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-6 font-sans text-slate-800">
      
      {/* ========================================== */}
      {/* 1. AMAZON / FLIPKART STYLE HERO CAROUSEL   */}
      {/* ========================================== */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl min-h-[260px] sm:min-h-[320px] flex items-center">
        {heroBanners.map((banner, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient} p-6 sm:p-10 flex flex-col justify-center transition-opacity duration-700 ${
              heroSlide === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div className="max-w-xl text-white space-y-2 sm:space-y-3">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-black backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{banner.badge} • {banner.tag}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white">
                {banner.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-2">
                {banner.subtitle}
              </p>

              <div className="pt-2 flex items-center gap-3">
                <span className={`text-lg sm:text-2xl font-black ${banner.accentColor}`}>
                  {banner.discount}
                </span>
                <button
                  onClick={() => setSelectedCategory(banner.categoryTarget)}
                  className="px-5 py-2.5 rounded-full bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-black text-xs sm:text-sm shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <span>{banner.ctaText}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        ))}

        {/* Carousel Navigation Arrows */}
        <button
          onClick={() => setHeroSlide((prev) => (prev - 1 + heroBanners.length) % heroBanners.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setHeroSlide((prev) => (prev + 1) % heroBanners.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center gap-1.5">
          {heroBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                heroSlide === i ? 'bg-amber-400 w-6' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. VALUE ROW: TODAY'S FLASH DEALS (FLIPKART STYLE) */}
      {/* ========================================== */}
      <div id="deals" className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-xs shadow">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Today's Lightning Deals & Handloom Offers
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                Direct cluster pricing • Offers end in <strong className="text-red-600">04h : 18m : 32s</strong>
              </span>
            </div>
          </div>

          <span className="text-xs font-bold text-[#007185] hover:underline cursor-pointer">
            See all deals ({filteredProducts.length})
          </span>
        </div>

        {/* Horizontal Deals Scroller */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {products.slice(0, 5).map((deal) => (
            <div
              key={deal.id}
              onClick={() => setActiveModalProduct(deal)}
              className="group border border-slate-200 rounded-xl p-3 bg-white hover:border-[#ffd814] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="aspect-square w-full bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                <img
                  src={deal.enhanced_image || deal.original_image}
                  alt={deal.product_name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
              </div>

              <div>
                <div className="flex items-center gap-1">
                  <span className="bg-[#cc0c39] text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                    -{deal.discount_pct || 38}%
                  </span>
                  <span className="text-[10px] font-extrabold text-[#cc0c39] uppercase">Deal</span>
                </div>

                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xs font-bold text-slate-900">
                    ₹{(deal.price || deal.suggested_price || 2499).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 line-through">
                    ₹{(deal.mrp || 3999).toLocaleString('en-IN')}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-slate-800 truncate mt-1 group-hover:text-[#c45500]">
                  {deal.product_name}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================== */}
      {/* 3. MAIN CATALOG GRID & SIDEBAR FILTERS     */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Filter Sidebar (Amazon Style) */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5 h-fit text-xs">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-amber-500" />
              <span>Filters & Refinements</span>
            </h3>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedRegion('All');
                setMinRating(0);
                setMaxPrice(35000);
              }}
              className="text-[11px] font-bold text-[#007185] hover:underline"
            >
              Clear All
            </button>
          </div>

          {/* Category Filter */}
          <div>
            <h4 className="font-extrabold text-slate-900 mb-2 uppercase text-[10px] tracking-wider">
              Department / Category
            </h4>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-950 font-medium">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat}
                    onChange={() => setSelectedCategory(cat)}
                    className="accent-amber-500"
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Region / GI Cluster */}
          <div className="pt-3 border-t border-slate-200">
            <h4 className="font-extrabold text-slate-900 mb-2 uppercase text-[10px] tracking-wider">
              Artisan Region / GI Origin
            </h4>
            <div className="space-y-1.5">
              {regions.map((reg) => (
                <label key={reg} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-950 font-medium">
                  <input
                    type="radio"
                    name="region"
                    checked={selectedRegion === reg}
                    onChange={() => setSelectedRegion(reg)}
                    className="accent-amber-500"
                  />
                  <span>{reg === 'All' ? 'All Indian Clusters' : `${reg} Guild`}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Customer Reviews Rating Filter (Amazon Style) */}
          <div className="pt-3 border-t border-slate-200">
            <h4 className="font-extrabold text-slate-900 mb-2 uppercase text-[10px] tracking-wider">
              Customer Reviews
            </h4>
            <div className="space-y-1.5">
              {[
                { stars: 4, label: '4 Stars & Up' },
                { stars: 3, label: '3 Stars & Up' },
                { stars: 0, label: 'All Ratings' }
              ].map((r) => (
                <button
                  key={r.stars}
                  onClick={() => setMinRating(r.stars)}
                  className={`flex items-center gap-1.5 text-left w-full p-1 rounded hover:bg-slate-50 ${
                    minRating === r.stars ? 'font-black text-amber-700' : 'text-slate-700'
                  }`}
                >
                  <div className="flex text-amber-500">
                    {'★'.repeat(r.stars || 1)}
                  </div>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider">Price Range</h4>
              <span className="font-bold text-slate-900">Up to ₹{maxPrice.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="500"
              max="35000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

        </aside>

        {/* Right Main Product Feed */}
        <main className="lg:col-span-9 space-y-4">
          
          {/* Results Summary Bar */}
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-600 shadow-sm">
            <div>
              Showing <strong className="text-slate-900">{filteredProducts.length}</strong> authentic handcrafted items
              {selectedCategory !== 'All' && <span> in <strong className="text-slate-900">{selectedCategory}</strong></span>}
            </div>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              100% Zero-Middleman Guarantee
            </span>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 space-y-2">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No items match your filter criteria</h3>
              <p className="text-xs text-slate-500">Try adjusting price range or clearing category filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredProducts.map((product) => (
                <ProductCardCommercial
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onQuickView={(p) => setActiveModalProduct(p)}
                  onBuyNow={onBuyNow}
                />
              ))}
            </div>
          )}

        </main>

      </div>

      {/* ========================================== */}
      {/* 4. UNDER ₹999 CORNER (MEESHO STYLE)        */}
      {/* ========================================== */}
      <div id="under999" className="bg-gradient-to-r from-amber-500 via-orange-500 to-terracotta-600 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-md">
              Budget Artisan Store
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-2">
              Everyday Crafts & Home Essentials Under ₹999
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-xl">
              Authentic handmade cane baskets, wooden toys, and terracotta kitchenware directly from rural village producers.
            </p>
          </div>
          <button
            onClick={() => setMaxPrice(999)}
            className="px-6 py-3 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs sm:text-sm shadow-lg whitespace-nowrap self-start sm:self-auto"
          >
            Browse Under ₹999
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* PRODUCT DETAIL MODAL (FULL PDP)            */}
      {/* ========================================== */}
      {activeModalProduct && (
        <ProductDetailModal
          product={activeModalProduct}
          onClose={() => {
            setActiveModalProduct(null);
            if (onClearSelectedProduct) onClearSelectedProduct();
          }}
          onAddToCart={onAddToCart}
          onBuyNow={onBuyNow}
        />
      )}

    </div>
  );
}
