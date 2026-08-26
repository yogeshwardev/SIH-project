import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Heart, 
  Star, 
  MapPin, 
  ShieldCheck, 
  MessageCircle, 
  Sparkles, 
  Tag, 
  Clock, 
  Check, 
  SlidersHorizontal,
  X,
  ExternalLink,
  Store,
  ChevronRight,
  TrendingUp,
  Volume2,
  VolumeX,
  CheckCircle2,
  Package,
  Truck
} from 'lucide-react';
import { api } from '../services/api';
import { voiceAssistant } from '../services/voiceAssistant';
import BeforeAfterSlider from '../components/BeforeAfterSlider';

export default function BuyerDashboardPage({ 
  selectedProductFromParent, 
  onClearSelectedProduct,
  cartItems = [],
  onAddToCart,
  onOpenCart
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [maxPrice, setMaxPrice] = useState(25000);
  const [isPlayingStory, setIsPlayingStory] = useState(false);

  // Active Modals
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [showDirectOrderModal, setShowDirectOrderModal] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [buyerForm, setBuyerForm] = useState({
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 98112 34567',
    city: 'New Delhi',
    message: 'Looking for direct delivery with authentic artisan lineage certificate.'
  });
  const [orderSuccess, setOrderSuccess] = useState(false);

  const categories = [
    'All',
    'Handloom & Textiles',
    'Pottery & Ceramics',
    'Cane & Bamboo',
    'Metal Craft & Bell Metal',
    'Woodcraft & Carving',
    'Traditional Paintings'
  ];

  const regions = [
    'All',
    'Varanasi, Uttar Pradesh',
    'Jaipur, Rajasthan',
    'Barpeta, Assam',
    'Bastar, Chhattisgarh',
    'Channapatna, Karnataka'
  ];

  const fetchStoreProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({
        search: searchTerm,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        region: selectedRegion !== 'All' ? selectedRegion : undefined,
        status: 'Published',
        max_price: maxPrice
      });
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreProducts();
  }, [selectedCategory, selectedRegion, maxPrice]);

  useEffect(() => {
    if (selectedProductFromParent) {
      setActiveModalProduct(selectedProductFromParent);
    }
  }, [selectedProductFromParent]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!activeModalProduct) return;
    try {
      await api.createInquiry({
        product_id: activeModalProduct.id,
        buyer_name: buyerForm.name,
        buyer_email: buyerForm.email,
        buyer_phone: buyerForm.phone,
        buyer_city: buyerForm.city,
        order_type: 'Retail Marketplace Purchase',
        quantity: orderQuantity,
        total_amount: (activeModalProduct.suggested_price || 2499) * orderQuantity,
        message: buyerForm.message
      });
      setOrderSuccess(true);
    } catch (err) {
      alert('Order placement failed: ' + err.message);
    }
  };

  const handlePlayVoiceover = (text) => {
    if (isPlayingStory) {
      voiceAssistant.stopSpeaking();
      setIsPlayingStory(false);
    } else {
      setIsPlayingStory(true);
      voiceAssistant.speak(text, 'hi-IN', () => setIsPlayingStory(false));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Hero E-Commerce Marketplace Carousel */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-950 via-indigoCraft-900 to-terracotta-900 text-white p-7 sm:p-10 mb-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% Verified GI Heritage Marketplace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            From India's Finest Rural Guilds to Your Doorstep
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
            Every item is handcrafted by master artisans with AI-verified authentic materials and fair-trade pricing, directly eliminating middlemen.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const el = document.getElementById('marketplace-grid');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-terracotta-600 hover:from-amber-600 hover:to-terracotta-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-terracotta-600/30 transition-all active:scale-95 flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Collection</span>
            </button>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-300 pl-2">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                Zero Middlemen
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-300">
                <Truck className="w-4 h-4" />
                Cluster-Direct Shipping
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Scrolling Pills */}
      <div className="mb-6 overflow-x-auto pb-2 flex items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-artisan-100 border border-artisan-200 shadow-sm'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search & Region Filter Bar */}
      <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-4 sm:p-5 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Banarasi saree, Blue pottery, Bamboo basket, Dhokra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchStoreProducts()}
              className="w-full bg-artisan-50 border border-artisan-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-artisan-50 border border-artisan-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  Origin: {r}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex items-center justify-between bg-artisan-50 border border-artisan-200 rounded-xl px-4 py-2">
            <span className="text-[11px] font-bold text-slate-500">Max: ₹{maxPrice.toLocaleString('en-IN')}</span>
            <input
              type="range"
              min="500"
              max="30000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-24 accent-terracotta-600 cursor-pointer"
            />
          </div>

        </div>
      </div>

      {/* Main E-Commerce Product Grid */}
      <div id="marketplace-grid">
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-artisan-200">
            <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-xs font-bold text-slate-500">Loading Authentic Crafts...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-artisan-200 p-6">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No active products found</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting search filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div 
                key={product.id}
                className="group bg-white rounded-2xl border border-artisan-200 shadow-sm hover:shadow-xl hover:border-terracotta-300 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden">
                  <img
                    src={product.enhanced_image || product.original_image}
                    alt={product.product_name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    <span className="bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-700">
                      {product.category}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 z-10">
                    <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 border border-emerald-400/40">
                      <ShieldCheck className="w-3 h-3" />
                      {product.badge || 'GI Certified'}
                    </span>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent p-3 pt-6 text-white flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate max-w-[150px] font-semibold">{product.region || 'India'}</span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {product.rating || 4.9} ({product.review_count || 18})
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-terracotta-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>{product.artisan_name || 'Master Artisan'}</span>
                      <span className="text-slate-400 font-normal">{product.production_time}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-terracotta-600 transition-colors line-clamp-1">
                      {product.title || product.product_name}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {product.short_description || product.description}
                    </p>
                  </div>

                  {/* Pricing & Actions */}
                  <div className="mt-4 pt-3 border-t border-artisan-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Fair-Trade Price</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-slate-900">
                          ₹{product.suggested_price?.toLocaleString('en-IN') || '2,499'}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                          Direct Price
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (onAddToCart) onAddToCart(product);
                        }}
                        className="px-3 py-2 rounded-xl bg-artisan-100 hover:bg-terracotta-50 text-terracotta-700 font-bold text-xs transition-colors flex items-center gap-1"
                        title="Add to Cart"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>

                      <button
                        onClick={() => setActiveModalProduct(product)}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-terracotta-600 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        Details
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* CONSUMER PRODUCT DETAIL MODAL              */}
      {/* ========================================== */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            
            {/* Top Modal Close */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  {activeModalProduct.badge || 'GI Certified Craft'}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {activeModalProduct.region} • Artisan: <strong>{activeModalProduct.artisan_name}</strong>
                </span>
              </div>
              <button 
                onClick={() => {
                  setActiveModalProduct(null);
                  if (onClearSelectedProduct) onClearSelectedProduct();
                  voiceAssistant.stopSpeaking();
                }} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              
              {/* Product Gallery & Before/After */}
              <div className="lg:col-span-6">
                <BeforeAfterSlider
                  originalUrl={activeModalProduct.original_image}
                  enhancedUrl={activeModalProduct.enhanced_image}
                />
              </div>

              {/* Product Info & Purchase Box */}
              <div className="lg:col-span-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                    {activeModalProduct.title || activeModalProduct.product_name}
                  </h2>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-600">
                    <div className="flex text-amber-400">
                      {'★'.repeat(5)}
                    </div>
                    <span>{activeModalProduct.rating || 4.9} ({activeModalProduct.review_count || 18} Customer Reviews)</span>
                  </div>

                  {/* Price Banner */}
                  <div className="mt-4 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-extrabold uppercase block">
                      Direct Fair-Trade Artisan Price
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-black text-emerald-950">
                        ₹{activeModalProduct.suggested_price?.toLocaleString('en-IN') || '2,499'}
                      </span>
                      <span className="text-xs text-emerald-700 font-bold">
                        (0% Intermediary Margin • 100% to Weaver Lineage)
                      </span>
                    </div>
                  </div>

                  {/* AI Story Voiceover Button */}
                  <div className="mt-4">
                    <button
                      onClick={() => handlePlayVoiceover(activeModalProduct.description || activeModalProduct.short_description)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors shadow-sm"
                    >
                      {isPlayingStory ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4 text-amber-700" />}
                      <span>{isPlayingStory ? 'Stop Audio' : '🔊 Listen to Craft Heritage Story (AI वॉयसओवर)'}</span>
                    </button>
                  </div>
                </div>

                {/* Purchase Action Buttons */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setShowDirectOrderModal(true);
                      }}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Direct Buy / Inquire Order</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onAddToCart) onAddToCart(activeModalProduct);
                      }}
                      className="py-3 px-5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-sm"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Heritage Story & Specifications */}
            <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  Craft Lineage & Narrative
                </h4>
                <p className="text-slate-600 leading-relaxed bg-artisan-50 p-4 rounded-2xl border border-artisan-200">
                  {activeModalProduct.description || activeModalProduct.short_description}
                </p>
              </div>

              {activeModalProduct.specifications && activeModalProduct.specifications.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                    Verified Craft Specifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeModalProduct.specifications.map((spec, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-terracotta-600"></span>
                        <span className="font-semibold text-slate-800">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DIRECT ORDER & WHOLESALE INQUIRY MODAL     */}
      {/* ========================================== */}
      {showDirectOrderModal && activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            
            {!orderSuccess ? (
              <form onSubmit={handlePlaceOrder}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Place Fair-Trade Order / Inquiry
                  </h3>
                  <button onClick={() => setShowDirectOrderModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4 p-3 rounded-xl bg-artisan-50 border border-artisan-200 flex items-center gap-3">
                  <img
                    src={activeModalProduct.enhanced_image || activeModalProduct.original_image}
                    alt=""
                    className="w-12 h-12 rounded-lg object-contain bg-slate-900"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 truncate max-w-[220px]">{activeModalProduct.product_name}</h4>
                    <span className="text-xs font-extrabold text-emerald-700">₹{activeModalProduct.suggested_price}</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={buyerForm.name}
                      onChange={(e) => setBuyerForm({ ...buyerForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={buyerForm.email}
                        onChange={(e) => setBuyerForm({ ...buyerForm, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={buyerForm.city}
                        onChange={(e) => setBuyerForm({ ...buyerForm, city: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantity</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 bg-slate-50 border border-slate-300 rounded-lg p-2 text-center font-bold"
                      />
                      <span className="text-xs font-bold text-slate-600">
                        Total: <strong className="text-emerald-800">₹{((activeModalProduct.suggested_price || 2499) * orderQuantity).toLocaleString('en-IN')}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDirectOrderModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md"
                  >
                    Confirm Purchase
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-5 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">Order Confirmed!</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your order has been routed to the master artisan guild in <strong>{activeModalProduct.region}</strong> and registered in the Admin Order Portal.
                </p>
                <button
                  onClick={() => {
                    setShowDirectOrderModal(false);
                    setOrderSuccess(false);
                    setActiveModalProduct(null);
                  }}
                  className="mt-4 px-6 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Return to Store
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
