import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  X, 
  FileText, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function OrderTrackingModal({ isOpen, onClose }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      api.getInquiries()
        .then(data => setInquiries(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 font-sans animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-800">
        
        {/* Header */}
        <div className="bg-[#131921] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">Your Orders & Artisan Shipments</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Loading orders...</div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-16 space-y-2 text-slate-400">
              <Package className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-bold text-sm text-slate-600">You have no past orders</p>
              <p className="text-xs">Browse the craft marketplace to place your first direct artisan order!</p>
            </div>
          ) : (
            inquiries.map((order) => (
              <div key={order.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                
                {/* Order Meta Bar */}
                <div className="bg-slate-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 border-b border-slate-200">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Order Placed</span>
                      <span className="font-semibold text-slate-800">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Total</span>
                      <span className="font-extrabold text-slate-900">₹{order.total_amount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Ship To</span>
                      <span className="font-semibold text-slate-800">{order.buyer_name}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Order ID</span>
                    <span className="font-black text-slate-900">#CRF-{order.id}</span>
                  </div>
                </div>

                {/* Order Item Body & Timeline */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={order.product_image || '/uploads/banarasi_saree_studio_enhanced.png'}
                      alt=""
                      className="w-16 h-16 rounded-lg object-contain bg-slate-950 flex-shrink-0"
                    />
                    <div>
                      <div className="text-[11px] font-extrabold text-[#007600] flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Arriving Friday by 8 PM</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">
                        {order.product_name} (Qty: {order.quantity})
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Direct delivery from certified rural artisan cluster
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      order.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      ● {order.status}
                    </span>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
