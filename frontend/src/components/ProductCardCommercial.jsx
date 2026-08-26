import React, { useState } from 'react';
import { 
  Star, 
  Heart, 
  ShoppingBag, 
  Zap, 
  ShieldCheck, 
  Check, 
  Truck,
  Eye
} from 'lucide-react';

export default function ProductCardCommercial({ 
  product, 
  onAddToCart, 
  onQuickView, 
  onBuyNow 
}) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const discount = product.discount_pct || Math.round(((product.mrp - product.price) / (product.mrp || 1)) * 100) || 35;
  const mrp = product.mrp || Math.round(product.suggested_price * 1.5) || 3999;
  const price = product.price || product.suggested_price || 2499;

  return (
    <div 
      onClick={() => onQuickView(product)}
      className="group relative bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer p-3 sm:p-4 text-slate-800"
    >
      
      {/* Top Floating Badges & Wishlist */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {product.badge && (
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${
            product.badge.includes('Best') 
              ? 'bg-[#e67a00] text-white'
              : product.badge.includes('Choice')
              ? 'bg-[#0f1111] text-white'
              : 'bg-emerald-700 text-white'
          }`}>
            {product.badge}
          </span>
        )}
        <span className="bg-white/95 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 backdrop-blur-sm">
          {product.region?.split(',')[0] || 'GI Certified'}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsWishlisted(!isWishlisted);
        }}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-red-600 transition-colors"
        title="Add to Wishlist"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} />
      </button>

      {/* Product Image Stage */}
      <div className="relative aspect-[4/3] w-full bg-slate-950/90 rounded-lg overflow-hidden flex items-center justify-center mb-3">
        <img
          src={product.enhanced_image || product.original_image}
          alt={product.product_name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Quick View Hover Pill */}
        <div className="absolute inset-x-0 bottom-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-slate-900/90 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-sm">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick View & AI Details</span>
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-between">
        
        <div>
          {/* Artisan Lineage / Brand */}
          <div className="text-[11px] font-bold text-slate-500 truncate mb-0.5">
            {product.brand_or_guild || product.artisan_name || 'Verified Master Artisan'}
          </div>

          {/* Title */}
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#c45500] transition-colors">
            {product.title || product.product_name}
          </h3>

          {/* Star Ratings (Amazon style) */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <div className="flex text-amber-500 text-[11px]">
              {'★'.repeat(4)}{'☆'}
            </div>
            <span className="font-bold text-slate-700">{product.rating || 4.8}</span>
            <span className="text-slate-400 text-[11px]">({(product.review_count || 320).toLocaleString()})</span>
          </div>

          {/* Deal / Discount Pill */}
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-[#cc0c39] text-white text-[11px] font-black px-1.5 py-0.5 rounded">
              {discount}% off
            </span>
            <span className="text-[11px] font-extrabold text-[#cc0c39] uppercase tracking-wider">
              Limited Deal
            </span>
          </div>

          {/* Pricing Row (Amazon slashed MRP style) */}
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xs font-medium text-slate-600">₹</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {price.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500 line-through">
              M.R.P.: ₹{mrp.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Prime & Delivery Estimate */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-slate-700">
            <span className="text-[10px] font-black text-white bg-[#00a8e1] px-1.5 py-0.2 rounded italic">
              prime
            </span>
            <span className="text-[11px] text-slate-600 truncate">
              {product.delivery_days || 'FREE Delivery Tomorrow'}
            </span>
          </div>
        </div>

        {/* Action Buttons (Amazon Yellow / Orange Buy Buttons) */}
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
          
          <button
            onClick={handleAdd}
            className={`py-2 px-2 rounded-lg text-xs font-extrabold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1 ${
              isAdded 
                ? 'bg-emerald-600 text-white'
                : 'bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 border border-[#fcd200]'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow(product);
            }}
            className="py-2 px-2 rounded-lg text-xs font-extrabold bg-[#ffa41c] hover:bg-[#fa8900] text-slate-950 border border-[#ff8f00] shadow-sm transition-all active:scale-95 flex items-center justify-center"
          >
            <span>Buy Now</span>
          </button>

        </div>

      </div>

    </div>
  );
}
