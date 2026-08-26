import React from 'react';
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onCheckout }) {
  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.suggested_price || 2499) * (item.quantity || 1), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200">
          
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-terracotta-100 text-terracotta-700 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Your Craft Cart</h3>
                <span className="text-xs text-slate-400">{cartItems.length} unique artisan items</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-100">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-600">Your shopping cart is empty</p>
                <p className="text-xs text-slate-400">Discover authentic GI crafts on the marketplace!</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="py-4 flex items-center gap-3.5">
                  <img
                    src={item.enhanced_image || item.original_image}
                    alt=""
                    className="w-16 h-16 rounded-xl object-contain bg-slate-900 flex-shrink-0"
                  />
                  
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.product_name}</h4>
                    <div className="text-[11px] text-terracotta-700 font-semibold">{item.craft_type}</div>
                    <div className="text-xs font-extrabold text-slate-900 mt-1">
                      ₹{item.suggested_price}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => onUpdateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                      className="p-1 text-slate-600 hover:text-slate-900"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold px-1.5">{item.quantity || 1}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                      className="p-1 text-slate-600 hover:text-slate-900"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {cartItems.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Direct Artisan Cluster Shipping</span>
                <span className="text-emerald-700 font-bold">FREE</span>
              </div>
              <div className="flex items-center justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Subtotal</span>
                <span className="text-xl font-black text-emerald-900">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>

              <button
                onClick={onCheckout}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Proceed to Fair-Trade Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
