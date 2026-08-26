import React, { useState } from 'react';
import { 
  Star, 
  Heart, 
  ShoppingBag, 
  Zap, 
  ShieldCheck, 
  Check, 
  Truck, 
  MapPin, 
  Clock, 
  X, 
  Volume2, 
  VolumeX, 
  Share2, 
  RotateCcw,
  Award,
  ChevronRight,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';
import { voiceAssistant } from '../services/voiceAssistant';

export default function ProductDetailModal({ 
  product, 
  onClose, 
  onAddToCart, 
  onBuyNow 
}) {
  const [selectedImage, setSelectedImage] = useState(product?.enhanced_image || product?.original_image);
  const [showSliderMode, setShowSliderMode] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('110001');
  const [pincodeChecked, setPincodeChecked] = useState(true);
  const [isPlayingStory, setIsPlayingStory] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  if (!product) return null;

  const discount = product.discount_pct || 35;
  const mrp = product.mrp || Math.round((product.suggested_price || 2499) * 1.5);
  const price = product.price || product.suggested_price || 2499;

  const handlePlayVoice = () => {
    const textToRead = product.description || product.short_description || product.title;
    if (isPlayingStory) {
      voiceAssistant.stopSpeaking();
      setIsPlayingStory(false);
    } else {
      setIsPlayingStory(true);
      voiceAssistant.speak(textToRead, 'hi-IN', () => setIsPlayingStory(false));
    }
  };

  const handleAdd = () => {
    onAddToCart({ ...product, quantity });
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 font-sans animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-800">
        
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold truncate">
            <span>Marketplace</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>{product.category}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 font-bold truncate">{product.product_name}</span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
              title="Add to Wishlist"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} />
            </button>
            <button
              onClick={() => {
                voiceAssistant.stopSpeaking();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main 3-Column PDP Grid */}
        <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* ========================================== */}
          {/* COLUMN 1: IMAGE GALLERY & VIEWER (5 COLS)  */}
          {/* ========================================== */}
          <div className="lg:col-span-5 space-y-4">
            
            {showSliderMode ? (
              <div className="bg-slate-900 rounded-xl overflow-hidden p-2">
                <BeforeAfterSlider
                  originalUrl={product.original_image}
                  enhancedUrl={product.enhanced_image}
                  title="Studio AI Transformation View"
                />
              </div>
            ) : (
              <div className="relative aspect-[4/3] w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                <img
                  src={selectedImage}
                  alt={product.product_name}
                  className="w-full h-full object-contain"
                />
                
                {product.badge && (
                  <span className="absolute top-3 left-3 bg-[#e67a00] text-white text-xs font-black px-2.5 py-1 rounded shadow">
                    {product.badge}
                  </span>
                )}
              </div>
            )}

            {/* Toggle Raw vs Studio Split Slider */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setShowSliderMode(!showSliderMode)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 text-terracotta-600" />
                <span>{showSliderMode ? 'Show Standard Photo' : 'Compare Raw vs AI Studio'}</span>
              </button>

              <button
                onClick={handlePlayVoice}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-sm transition-colors"
              >
                {isPlayingStory ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4 text-amber-700" />}
                <span>{isPlayingStory ? 'Stop Audio' : '🔊 AI Voiceover'}</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span className="font-bold text-emerald-900">100% Certified GI Origin</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-700 flex-shrink-0" />
                <span className="font-bold text-blue-900">Direct Master Artisan</span>
              </div>
            </div>

          </div>

          {/* ========================================== */}
          {/* COLUMN 2: PRODUCT INFORMATION (4 COLS)     */}
          {/* ========================================== */}
          <div className="lg:col-span-4 space-y-4">
            
            <div>
              <a href="#artisan-store" className="text-xs font-extrabold text-[#007185] hover:underline hover:text-[#c45500]">
                Visit the {product.brand_or_guild || product.artisan_name || 'Varanasi Master Weavers Guild'} Store
              </a>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 leading-snug">
                {product.title || product.product_name}
              </h1>
            </div>

            {/* Star Rating & Answered Questions */}
            <div className="flex items-center gap-3 text-xs border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1 text-amber-500">
                <span className="font-black text-slate-900 text-sm">{product.rating || 4.8}</span>
                <div className="flex text-amber-400 text-xs">
                  {'★'.repeat(5)}
                </div>
              </div>
              <span className="text-slate-400">•</span>
              <span className="text-[#007185] font-semibold hover:underline cursor-pointer">
                {(product.review_count || 1420).toLocaleString()} Ratings
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-[#007185] font-semibold hover:underline cursor-pointer">
                85 Answered Questions
              </span>
            </div>

            {/* Price Box */}
            <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="bg-[#cc0c39] text-white text-xs font-black px-2 py-0.5 rounded">
                  -{discount}% OFF
                </span>
                <span className="text-xs font-extrabold text-[#cc0c39] uppercase">
                  Great Indian Handloom Festival Deal
                </span>
              </div>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-sm font-normal text-slate-600">₹</span>
                <span className="text-3xl font-black text-slate-950">
                  {price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500">
                  M.R.P.: <span className="line-through">₹{mrp.toLocaleString('en-IN')}</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                Inclusive of all taxes • 0% Middleman Deduction (100% to Artisan Cluster)
              </span>
            </div>

            {/* Specifications Table */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                Product Specifications
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-2 p-2 bg-slate-50 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Category</span>
                  <span className="font-semibold text-slate-900">{product.category}</span>
                </div>
                <div className="grid grid-cols-2 p-2 bg-white border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Craft Technique</span>
                  <span className="font-semibold text-slate-900">{product.craft_type}</span>
                </div>
                <div className="grid grid-cols-2 p-2 bg-slate-50 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Primary Material</span>
                  <span className="font-semibold text-slate-900">{product.material}</span>
                </div>
                <div className="grid grid-cols-2 p-2 bg-white border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Origin Cluster</span>
                  <span className="font-semibold text-slate-900">{product.region}</span>
                </div>
                <div className="grid grid-cols-2 p-2 bg-slate-50">
                  <span className="text-slate-500 font-bold">Handcrafting Duration</span>
                  <span className="font-semibold text-slate-900">{product.production_time || '3-5 days'}</span>
                </div>
              </div>
            </div>

            {/* Bullet Points */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                About this item
              </h3>
              <ul className="space-y-1 text-xs text-slate-600">
                {product.features ? product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                    <span>{f}</span>
                  </li>
                )) : (
                  <li className="text-xs text-slate-600">{product.description}</li>
                )}
              </ul>
            </div>

          </div>

          {/* ========================================== */}
          {/* COLUMN 3: BUY BOX (3 COLS)                */}
          {/* ========================================== */}
          <div className="lg:col-span-3">
            <div className="border border-slate-300 rounded-2xl p-5 shadow-sm space-y-4 bg-white sticky top-20">
              
              <div className="text-2xl font-black text-slate-900">
                ₹{price.toLocaleString('en-IN')}
              </div>

              {/* Delivery Estimation */}
              <div className="text-xs space-y-1.5">
                <div className="flex items-center gap-1 text-[#007600] font-extrabold text-sm">
                  <Truck className="w-4 h-4" />
                  <span>FREE Delivery</span>
                </div>
                <p className="text-slate-600 font-medium">
                  Order within <strong className="text-slate-900">4 hrs 12 mins</strong> for delivery by <strong>Friday, 8 PM</strong>.
                </p>
                
                {/* Pincode Checker */}
                <div className="pt-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-500">Deliver to</span>
                  <strong className="text-slate-900">{pincode}</strong>
                </div>
              </div>

              {/* Stock Status */}
              <div>
                <span className="text-sm font-extrabold text-[#007600] block">
                  In Stock ({product.stock_quantity || 12} units available)
                </span>
                <span className="text-[11px] text-slate-500">
                  Dispatched directly from Varanasi Artisan Guild
                </span>
              </div>

              {/* Quantity Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity:</label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 10].map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>

              {/* Added to Cart Flash Notice */}
              {addedNotice && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Added {quantity} unit(s) to cart!</span>
                </div>
              )}

              {/* Amazon Style Yellow / Orange CTA Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleAdd}
                  className="w-full py-3 rounded-full text-xs font-extrabold bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 border border-[#fcd200] shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={() => {
                    onBuyNow({ ...product, quantity });
                  }}
                  className="w-full py-3 rounded-full text-xs font-extrabold bg-[#ffa41c] hover:bg-[#fa8900] text-slate-950 border border-[#ff8f00] shadow-sm transition-all active:scale-95 flex items-center justify-center"
                >
                  <span>Buy Now</span>
                </button>
              </div>

              {/* E-Commerce Guarantee Table */}
              <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Secure 256-Bit SSL Transaction</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                  <span>7-Day Easy Returns & Exchange</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
