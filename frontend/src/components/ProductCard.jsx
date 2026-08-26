import React from 'react';
import { 
  MapPin, 
  Sparkles, 
  Tag, 
  Clock, 
  ShieldCheck, 
  ArrowUpRight, 
  MessageCircle, 
  ShoppingBag 
} from 'lucide-react';

export default function ProductCard({ product, onViewDetails, onContactArtisan }) {
  const isHighConfidence = product.ai_confidence && typeof product.ai_confidence === 'object' && product.ai_confidence.overall > 0.9;

  return (
    <div className="group bg-white rounded-2xl border border-artisan-200 shadow-sm hover:shadow-xl hover:border-terracotta-300 transition-all duration-300 overflow-hidden flex flex-col">
      
      {/* Product Image Container with Badges */}
      <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden">
        <img
          src={product.enhanced_image || product.original_image || '/uploads/banarasi_saree_studio_enhanced.png'}
          alt={product.product_name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-700">
            <Tag className="w-3 h-3 text-terracotta-400" />
            {product.category}
          </span>
        </div>

        {/* GI / AI Certified Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm border border-emerald-400/30">
            <ShieldCheck className="w-3 h-3" />
            AI Verified
          </span>
        </div>

        {/* Bottom Image Overlay with Region */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-2.5 pt-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-200">
            <MapPin className="w-3 h-3 text-terracotta-400" />
            <span className="truncate max-w-[140px]">{product.region || 'India'}</span>
          </div>
          {product.production_time && (
            <div className="flex items-center gap-1 text-[11px] text-amber-300 font-semibold">
              <Clock className="w-3 h-3" />
              <span>{product.production_time}</span>
            </div>
          )}
        </div>

      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Artisan Name */}
          <div className="text-[11px] font-bold text-terracotta-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>{product.artisan_name || 'Master Artisan'}</span>
            <span className="text-slate-400 text-[10px] font-normal">{product.craft_type}</span>
          </div>

          {/* Product Title */}
          <h4 className="text-base font-bold text-slate-900 group-hover:text-terracotta-600 transition-colors line-clamp-1">
            {product.product_name}
          </h4>

          {/* Short Description */}
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.short_description || product.description || 'Authentic handmade Indian craft item with verified craft lineage.'}
          </p>

          {/* Material Chip */}
          {product.material && (
            <div className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Material:</span>
              <span className="bg-artisan-100 px-2 py-0.5 rounded text-slate-700 truncate max-w-[180px]">
                {product.material}
              </span>
            </div>
          )}
        </div>

        {/* Pricing & Footer Actions */}
        <div className="mt-4 pt-3 border-t border-artisan-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Direct Fair Price</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-slate-900">
                ₹{product.suggested_price ? product.suggested_price.toLocaleString('en-IN') : '2,499'}
              </span>
              {product.total_cost > 0 && (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  Fair Trade
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onContactArtisan && (
              <button
                onClick={() => onContactArtisan(product)}
                className="p-2 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:scale-105 active:scale-95 transition-all"
                title="Contact Artisan (WhatsApp/Inquiry)"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onViewDetails(product)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-terracotta-600 text-white text-xs font-bold transition-all shadow-sm group-hover:bg-terracotta-600"
            >
              <span>View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
