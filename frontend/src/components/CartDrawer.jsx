import React from 'react';
import { ShoppingCart, X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Package } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onCheckout }) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.price || item.suggested_price || 2499;
    return sum + price * (item.quantity || 1);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 w-full max-w-[420px] bg-white shadow-2xl flex flex-col animate-slide-right">

        {/* HEADER */}
        <div className="bg-[#232f3e] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-white font-bold text-[15px]">Your Cart</h3>
              <span className="text-gray-400 text-[11px]">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} · Free delivery
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="w-14 h-14 text-gray-200 mb-4" />
              <p className="text-[15px] font-semibold text-gray-700 mb-1">Your cart is empty</p>
              <p className="text-[13px] text-gray-400">Discover authentic artisan crafts on the marketplace!</p>
              <button
                onClick={onClose}
                className="mt-4 px-5 py-2 rounded-full text-[13px] font-bold"
                style={{ backgroundColor: '#ffd814', color: '#0f1111' }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => {
              const price = item.price || item.suggested_price || 2499;
              const mrp = item.mrp || Math.round(price * 1.45);
              return (
                <div key={item.id} className="py-4 flex gap-3.5">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <img
                      src={item.enhanced_image || item.original_image}
                      alt={item.product_name}
                      className="w-full h-full object-contain p-1"
                      onError={e => e.target.src = 'https://placehold.co/80x80/f3f4f6/9ca3af?text=Craft'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name */}
                    <h4 className="text-[13px] font-medium text-gray-900 line-clamp-2 leading-snug">
                      {item.product_name}
                    </h4>

                    {/* Stock & Prime */}
                    <div className="flex items-center gap-1.5 mt-1 mb-1.5">
                      <span className="text-green-700 text-[11px] font-semibold">In Stock</span>
                      {item.is_prime && (
                        <span className="prime-badge text-[9px] px-1 py-0.5 rounded-sm">prime</span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-[16px] font-bold text-gray-900">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-gray-400 line-through">
                        ₹{mrp.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Qty + Remove */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button
                          onClick={() => onUpdateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition-colors text-[14px] font-bold"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1 text-[13px] font-bold text-gray-900 border-x border-gray-300">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-[12px] text-red-500 hover:text-red-700 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
            <div className="flex items-center justify-between text-[13px] text-gray-600 font-medium">
              <span>Cluster Direct Shipping:</span>
              <span className="text-green-700 font-bold">FREE</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[13px] text-gray-600">Subtotal ({cartItems.length} items):</span>
                <div className="text-[20px] font-bold text-gray-900 leading-none mt-0.5">
                  ₹{subtotal.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full py-3 rounded-full font-bold text-[14px] transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#ffd814', border: '1px solid #f0c000', color: '#0f1111' }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Secure Checkout
              </span>
              <span>•</span>
              <span>7-Day Returns</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
