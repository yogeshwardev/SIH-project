import React, { useState } from 'react';
import { Heart, ShoppingCart, Zap, Check, Eye, Star, Truck } from 'lucide-react';

export default function ProductCardCommercial({ product, onAddToCart, onQuickView, onBuyNow }) {
  const [wishlisted, setWishlisted]     = useState(false);
  const [addedToCart, setAddedToCart]   = useState(false);

  const price    = product.price || product.suggested_price || 2499;
  const mrp      = product.mrp  || Math.round(price * 1.45);
  const discount = product.discount_pct || Math.round(((mrp - price) / mrp) * 100);
  const rating   = product.rating || 4.7;
  const reviews  = product.review_count || 230;

  const handleCart = (e) => {
    e.stopPropagation();
    onAddToCart(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Star display
  const fullStars  = Math.floor(rating);
  const halfStar   = rating - fullStars >= 0.5;

  return (
    <div
      className="product-card-hover bg-white rounded-lg border border-gray-200 hover:border-gray-300 flex flex-col overflow-hidden cursor-pointer group"
      onClick={() => onQuickView(product)}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── IMAGE BLOCK ────────────────────────────── */}
      <div className="relative bg-white" style={{ paddingTop: '100%' }}>
        <div className="absolute inset-0 flex items-center justify-center p-3 img-zoom-container bg-gray-50">
          <img
            src={product.enhanced_image || product.original_image}
            alt={product.product_name}
            className="w-full h-full object-contain"
            loading="lazy"
            onError={e => {
              e.target.src = `https://placehold.co/400x400/f8f9fa/6b7280?text=${encodeURIComponent(product.product_name?.slice(0,12) || 'Craft')}`;
            }}
          />
        </div>

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 deal-badge">
            -{discount}% off
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={e => { e.stopPropagation(); setWishlisted(w => !w); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Quick View overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100">
          <span className="bg-white/95 text-gray-800 text-[11px] font-semibold px-3 py-1 rounded-full shadow border border-gray-200 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Quick View
          </span>
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────── */}
      <div className="p-3 flex flex-col flex-1">

        {/* Brand / Guild */}
        <div className="text-[11px] text-blue-600 font-semibold truncate mb-1 hover:underline">
          {product.brand_or_guild || 'Verified Artisan'}
        </div>

        {/* Product Name */}
        <h3 className="text-[13px] text-gray-900 font-normal leading-snug line-clamp-2 mb-1.5 group-hover:text-[#c45500]">
          {product.title || product.product_name}
        </h3>

        {/* Stars */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-0.5 text-amber-500 text-xs">
            {'★'.repeat(fullStars)}
            {halfStar && '½'}
            {'☆'.repeat(Math.max(0, 5 - fullStars - (halfStar ? 1 : 0)))}
          </div>
          <span className="text-[12px] text-blue-600 hover:text-orange-500 hover:underline cursor-pointer">
            ({reviews.toLocaleString()})
          </span>
        </div>

        {/* Prime & Delivery */}
        <div className="flex items-center gap-1.5 mb-2">
          {product.is_prime && (
            <span className="prime-badge text-[10px] px-1.5 py-0.5 rounded-sm">prime</span>
          )}
          <span className="text-[11px] text-gray-600 truncate">{product.delivery_days}</span>
        </div>

        {/* Badge */}
        {product.badge && (
          <div className="mb-1.5">
            <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
              product.badge === 'Best Seller' ? 'bg-orange-500 text-white' :
              product.badge === "Amazon's Choice" ? 'bg-gray-900 text-white' :
              product.badge === 'GI Certified' ? 'bg-emerald-700 text-white' :
              'bg-red-600 text-white'
            }`}>
              #{product.badge}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Pricing */}
        <div className="mb-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[12px] text-gray-600 font-normal">₹</span>
            <span className="text-[20px] font-bold text-gray-900 leading-none">
              {price.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            M.R.P.: <span className="line-through">₹{mrp.toLocaleString('en-IN')}</span>
            {' '}<span className="text-green-700 font-semibold">(Save ₹{(mrp - price).toLocaleString('en-IN')})</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-1.5 mt-auto">
          <button
            onClick={handleCart}
            className={`btn-amazon-cart flex items-center justify-center gap-1 text-[12px] font-bold py-2 rounded-lg transition-all active:scale-95 ${
              addedToCart ? 'bg-green-500 border-green-600 text-white' : ''
            }`}
          >
            {addedToCart ? (
              <><Check className="w-3.5 h-3.5" /><span>Added</span></>
            ) : (
              <><ShoppingCart className="w-3.5 h-3.5" /><span>Add to Cart</span></>
            )}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onBuyNow(product); }}
            className="btn-amazon-buy flex items-center justify-center text-[12px] font-bold py-2 rounded-lg transition-all active:scale-95"
          >
            Buy Now
          </button>
        </div>

      </div>
    </div>
  );
}
