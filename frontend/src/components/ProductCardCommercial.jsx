import React, { useState } from 'react';
import { Heart, ShoppingCart, Check, Eye, Truck } from 'lucide-react';

/* Star rendering */
function Stars({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5 text-amber-400" style={{ fontSize: '13px', lineHeight: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>
          {i < full ? '★' : i === full && half ? '⯨' : '☆'}
        </span>
      ))}
    </div>
  );
}

export default function ProductCardCommercial({ product, onAddToCart, onQuickView, onBuyNow }) {
  const [wishlisted,  setWishlisted]  = useState(false);
  const [justAdded,   setJustAdded]   = useState(false);

  const price    = product.price || product.suggested_price || 2499;
  const mrp      = product.mrp  || Math.round(price * 1.45);
  const discount = product.discount_pct || Math.round(((mrp - price) / mrp) * 100);
  const rating   = product.rating || 4.7;
  const reviews  = product.review_count || 230;
  const savings  = mrp - price;

  const handleCart = (e) => {
    e.stopPropagation();
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2200);
  };

  const handleBuy = (e) => {
    e.stopPropagation();
    onBuyNow(product);
  };

  const handleWish = (e) => {
    e.stopPropagation();
    setWishlisted(w => !w);
  };

  return (
    <div
      className="product-card-hover group cursor-pointer select-none"
      onClick={() => onQuickView(product)}
      style={{ fontFamily: "'Inter', sans-serif", borderRadius: '12px' }}
    >
      {/* ── IMAGE BLOCK ──────────────────────────── */}
      <div className="relative bg-[#FAFAFA] rounded-t-xl overflow-hidden" style={{ paddingTop: '100%' }}>
        
        {/* Image */}
        <div className="absolute inset-0 flex items-center justify-center p-3 img-zoom-container">
          <img
            src={product.enhanced_image || product.original_image}
            alt={product.product_name}
            className="w-full h-full object-contain"
            loading="lazy"
            onError={e => {
              e.target.src = `https://placehold.co/400x400/F8F9FA/CBD5E1?text=${encodeURIComponent((product.product_name || '').slice(0, 10))}`;
            }}
          />
        </div>

        {/* Discount badge — top left */}
        {discount > 0 && (
          <div
            className="absolute top-2.5 left-2.5 text-white font-black text-[11px] px-1.5 py-0.5 rounded-md"
            style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
          >
            -{discount}%
          </div>
        )}

        {/* Wishlist — top right */}
        <button
          onClick={handleWish}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          style={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', backdropFilter: 'blur(4px)' }}
        >
          <Heart
            className="w-4 h-4 transition-colors"
            style={{ color: wishlisted ? '#EF4444' : '#9CA3AF', fill: wishlisted ? '#EF4444' : 'none' }}
          />
        </button>

        {/* Quick view pill on hover */}
        <div
          className="absolute inset-x-3 bottom-2 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0"
          style={{ transitionDuration: '0.2s' }}
        >
          <div
            className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(6px)', color: '#374151', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}
          >
            <Eye className="w-3.5 h-3.5" />
            Quick View
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────── */}
      <div
        className="p-3 flex flex-col flex-1 border-t border-gray-100"
        style={{ background: 'white', borderRadius: '0 0 12px 12px' }}
      >
        {/* Brand */}
        <div
          className="text-[11px] font-semibold truncate mb-0.5"
          style={{ color: '#007185' }}
        >
          {product.brand_or_guild || 'Verified Artisan'}
        </div>

        {/* Product Name */}
        <h3 className="text-[13px] font-medium text-gray-900 leading-snug line-clamp-2 mb-2"
          style={{ letterSpacing: '-0.01em' }}>
          {product.title || product.product_name}
        </h3>

        {/* Stars + Review count */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <Stars rating={rating} />
          <span className="text-[11px] font-semibold" style={{ color: '#007185' }}>
            ({reviews.toLocaleString()})
          </span>
        </div>

        {/* Delivery + Prime */}
        <div className="flex items-center gap-1.5 mb-2">
          {product.is_prime && (
            <span className="prime-badge text-[9px] px-1.5 py-0.5 rounded-sm">prime</span>
          )}
          <span className="text-[10px] text-gray-500 flex items-center gap-0.5 truncate">
            <Truck className="w-3 h-3 inline flex-shrink-0" />
            {product.delivery_days || 'FREE delivery by Friday'}
          </span>
        </div>

        {/* Badge */}
        {product.badge && (
          <div className="mb-1.5">
            <span
              className="inline-block text-[10px] font-black px-1.5 py-0.5 rounded text-white"
              style={{
                background:
                  product.badge === 'Best Seller' ? '#E87722' :
                  product.badge === "Amazon's Choice" ? '#131921' :
                  product.badge === 'GI Certified' ? '#15803D' :
                  product.badge === 'Luxury Pick' ? '#7C3AED' :
                  '#CC0C39'
              }}
            >
              {product.badge === 'Best Seller' ? '🏆 ' : ''}{product.badge}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price block */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] text-gray-700 font-semibold">₹</span>
            <span className="text-[21px] font-black text-gray-900 leading-none" style={{ letterSpacing: '-0.03em' }}>
              {price.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
            <span>M.R.P.</span>
            <span className="line-through">₹{mrp.toLocaleString('en-IN')}</span>
            <span className="text-green-700 font-bold">Save ₹{savings.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={handleCart}
            className="btn-amazon-cart flex items-center justify-center gap-1"
            style={{ height: '34px', fontSize: '12px' }}
          >
            {justAdded
              ? <><Check className="w-3.5 h-3.5 flex-shrink-0" /><span>Added!</span></>
              : <><ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" /><span>Add to Cart</span></>
            }
          </button>
          <button
            onClick={handleBuy}
            className="btn-amazon-buy flex items-center justify-center"
            style={{ height: '34px', fontSize: '12px' }}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
