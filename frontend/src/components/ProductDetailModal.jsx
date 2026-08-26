import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Heart, ShoppingCart, Zap, ShieldCheck,
  Star, Truck, MapPin, RotateCcw, Check, X, Volume2, VolumeX, SlidersHorizontal, Package
} from 'lucide-react';
import { voiceAssistant } from '../services/voiceAssistant';

export default function ProductDetailModal({ product, onClose, onAddToCart, onBuyNow }) {
  const [mainImg, setMainImg]           = useState(0);
  const [quantity, setQuantity]         = useState(1);
  const [pincode, setPincode]           = useState('110001');
  const [addedMsg, setAddedMsg]         = useState(false);
  const [wishlisted, setWishlisted]     = useState(false);
  const [speaking, setSpeaking]         = useState(false);
  const [showSlider, setShowSlider]     = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; voiceAssistant.stopSpeaking?.(); };
  }, []);

  if (!product) return null;

  const price    = product.price || product.suggested_price || 2499;
  const mrp      = product.mrp  || Math.round(price * 1.45);
  const discount = product.discount_pct || Math.round(((mrp - price) / mrp) * 100);
  const rating   = product.rating || 4.7;

  const gallery = [
    product.enhanced_image || product.original_image,
    product.original_image || product.enhanced_image,
    ...(product.gallery || []),
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 6);

  const handleAddCart = () => {
    onAddToCart({ ...product, quantity });
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2500);
  };

  const toggleVoice = () => {
    if (speaking) {
      voiceAssistant.stopSpeaking?.();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      voiceAssistant.speak?.(
        `${product.product_name}. ${product.description || product.short_description || ''}`,
        'hi-IN',
        () => setSpeaking(false)
      );
    }
  };

  // Star breakdown (mock — looks like real Amazon)
  const starRows = [5, 4, 3, 2, 1].map((s, i) => ({
    star: s,
    pct: [62, 22, 9, 4, 3][i],
  }));

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-start justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in"
      style={{ fontFamily: "'Inter', sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl w-full max-w-[1100px] my-4 shadow-modal overflow-hidden">

        {/* ── MODAL HEADER ─────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-200">
          <div className="text-[12px] text-gray-500 flex items-center gap-1.5 truncate">
            <span className="text-blue-600 hover:underline cursor-pointer">Marketplace</span>
            <span>›</span>
            <span className="text-blue-600 hover:underline cursor-pointer">{product.category}</span>
            <span>›</span>
            <span className="text-gray-800 font-semibold truncate">{product.product_name}</span>
          </div>
          <button
            onClick={() => { voiceAssistant.stopSpeaking?.(); onClose(); }}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 flex-shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── MAIN PDP BODY ──────────────────────────── */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* COL 1: IMAGES (5 cols) */}
          <div className="lg:col-span-5">
            
            {/* Thumbnails (vertical strip on left like Amazon) */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-2 flex-shrink-0">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImg(i)}
                    className={`w-14 h-14 rounded border-2 p-0.5 overflow-hidden flex-shrink-0 transition-colors ${
                      mainImg === i ? 'border-amber-500' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-contain"
                      onError={e => e.target.src = 'https://placehold.co/56x56/f3f4f6/9ca3af?text=img'}
                    />
                  </button>
                ))}
              </div>

              {/* Main Image */}
              <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: '340px' }}>
                <img
                  src={gallery[mainImg] || gallery[0]}
                  alt={product.product_name}
                  className="max-w-full max-h-[400px] object-contain p-4"
                  onError={e => e.target.src = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Image'}
                />
              </div>
            </div>

            {/* Image Controls */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={toggleVoice}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex-1 justify-center"
              >
                {speaking ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
                <span>{speaking ? 'Stop Audio' : '🔊 AI Voice Story'}</span>
              </button>
              
              {product.original_image !== product.enhanced_image && (
                <button
                  onClick={() => setShowSlider(s => !s)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-[12px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors flex-1 justify-center"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Before / After AI</span>
                </button>
              )}
            </div>

            {/* Trust strip */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-700 flex-shrink-0" />
                <span className="text-[11px] font-bold text-green-900">GI Certified Origin</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-700 flex-shrink-0" />
                <span className="text-[11px] font-bold text-blue-900">Direct Artisan</span>
              </div>
            </div>
          </div>

          {/* COL 2: PRODUCT INFO (4 cols) */}
          <div className="lg:col-span-4">
            
            {/* Brand */}
            <a className="text-[13px] text-blue-600 hover:underline hover:text-orange-600 cursor-pointer">
              {product.brand_or_guild || 'Verified Artisan Guild'}
            </a>

            {/* Title */}
            <h1 className="text-[16px] sm:text-[18px] font-medium text-gray-900 mt-1.5 leading-snug">
              {product.title || product.product_name}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-2 mt-2 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-0.5 text-amber-500">
                {'★'.repeat(Math.floor(rating))}
                {rating % 1 >= 0.5 && '½'}
              </div>
              <span className="text-[13px] text-blue-600 hover:underline cursor-pointer font-medium">
                {rating} • {(product.review_count || 230).toLocaleString()} ratings
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-[13px] text-blue-600 hover:underline cursor-pointer">72 answered</span>
            </div>

            {/* Price */}
            <div className="mt-3 pb-3 border-b border-gray-200">
              <div className="flex items-baseline gap-2">
                <span className="text-[26px] font-bold text-gray-900">
                  ₹{price.toLocaleString('en-IN')}
                </span>
                <span className="text-green-700 font-semibold text-[13px]">
                  -{discount}% ({product.badge || 'Deal'})
                </span>
              </div>
              <div className="text-[12px] text-gray-500 mt-0.5">
                M.R.P.: <span className="line-through">₹{mrp.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Inclusive of all taxes • Zero Middlemen — 100% to Artisan
              </div>
            </div>

            {/* Specifications Table */}
            <div className="mt-3">
              <table className="w-full text-[12px]">
                <tbody>
                  {[
                    ['Category', product.category],
                    ['Craft Type', product.craft_type],
                    ['Material', product.material],
                    ['Origin', product.region],
                    ['Dimensions', product.dimensions],
                    ['Production Time', product.production_time],
                  ].filter(r => r[1]).map(([k, v]) => (
                    <tr key={k} className="border-b border-gray-100">
                      <td className="py-1.5 pr-4 text-gray-500 font-semibold w-[40%]">{k}</td>
                      <td className="py-1.5 text-gray-900">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* About this item */}
            {product.features && (
              <div className="mt-4">
                <h4 className="font-bold text-gray-900 text-[13px] mb-1.5">About this item</h4>
                <ul className="space-y-1">
                  {product.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-1.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Star breakdown (Amazon style) */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h4 className="font-bold text-[13px] text-gray-900 mb-2">Customer Rating Distribution</h4>
              {starRows.map(row => (
                <div key={row.star} className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] text-blue-600 w-12 flex-shrink-0">{row.star} star</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-blue-600 w-8 text-right">{row.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* COL 3: BUY BOX (3 cols) */}
          <div className="lg:col-span-3">
            <div className="border border-gray-300 rounded-xl p-4 space-y-3 sticky top-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              
              {/* Price */}
              <div className="text-[24px] font-bold text-gray-900">
                ₹{price.toLocaleString('en-IN')}
              </div>

              {/* Delivery estimate */}
              <div className="text-[13px] space-y-1">
                <div className="text-green-700 font-bold flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  FREE Delivery
                </div>
                <div className="text-gray-700">
                  Order within <strong>4 hrs 12 mins</strong> — Delivers by <strong>Friday 8 PM</strong>
                </div>
              </div>

              {/* Pincode */}
              <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>Deliver to</span>
                <input
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  className="border border-gray-300 rounded px-1.5 py-0.5 text-gray-900 font-semibold w-20 text-center text-[12px]"
                />
              </div>

              {/* Stock */}
              <div className="text-green-700 font-bold text-[14px]">
                In Stock ({product.stock_quantity || 12} available)
              </div>

              {/* Sold by */}
              <div className="text-[12px] text-gray-500">
                Sold by: <span className="text-blue-600 hover:underline cursor-pointer">{product.brand_or_guild}</span>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-[12px] font-semibold text-gray-700 block mb-1">Qty:</label>
                <select
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-gray-900 bg-gray-50"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              {/* Added confirmation */}
              {addedMsg && (
                <div className="bg-green-50 border border-green-300 text-green-800 text-[12px] font-semibold p-2 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Added {quantity} to cart!
                </div>
              )}

              {/* CTA Buttons */}
              <button
                onClick={handleAddCart}
                className="btn-amazon-cart w-full py-2.5 rounded-full font-bold text-[14px] flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>

              <button
                onClick={() => onBuyNow({ ...product, quantity })}
                className="btn-amazon-buy w-full py-2.5 rounded-full font-bold text-[14px] flex items-center justify-center"
              >
                Buy Now
              </button>

              {/* Guarantees */}
              <div className="space-y-1.5 pt-2 border-t border-gray-200 text-[11px] text-gray-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                  Secure Transaction
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                  7-Day Easy Returns
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
