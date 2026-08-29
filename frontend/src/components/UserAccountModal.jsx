import React from 'react';
import {
  X,
  User,
  ShoppingBag,
  Store,
  ShieldCheck,
  MapPin,
  CreditCard,
  LogOut,
  Sparkles,
  Package,
  Truck,
  Settings,
  ChevronRight,
  Award,
  Phone,
  Mail,
  Building2
} from 'lucide-react';

export default function UserAccountModal({
  isOpen,
  onClose,
  currentUser,
  currentRole,
  onSignOut,
  onOpenOrders,
  onNavigateToSeller,
  onNavigateToAdmin,
  onOpenAuthModal
}) {
  if (!isOpen) return null;

  const isSeller = currentRole === 'seller';
  const isAdmin = currentRole === 'admin';
  const isBuyer = !isSeller && !isAdmin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* Top Profile Banner */}
        <div className="bg-[#131921] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg ${
              isSeller ? 'bg-gradient-to-br from-orange-500 to-amber-500' :
              isAdmin ? 'bg-gradient-to-br from-emerald-600 to-teal-700' :
              'bg-gradient-to-br from-blue-600 to-indigo-700'
            }`}>
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isSeller ? 'bg-orange-500/20 text-orange-300 border-orange-400/40' :
                  isAdmin ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' :
                  'bg-blue-500/20 text-blue-300 border-blue-400/40'
                }`}>
                  {isSeller ? 'Verified Artisan Seller' : isAdmin ? 'Governance Officer' : 'Verified Buyer'}
                </span>
              </div>

              <h3 className="text-lg font-black text-white truncate" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {currentUser?.store_name || currentUser?.name || 'CraftLink User'}
              </h3>
              
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                {currentUser?.email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3" />
                    {currentUser.email}
                  </span>
                )}
                {currentUser?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {currentUser.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Details & Quick Actions */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Role specific quick stats/badges */}
          {isSeller && (
            <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-orange-900">Artisan Guild Cluster</span>
                <span className="font-semibold text-orange-700">{currentUser?.region || 'Varanasi, UP'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-orange-900">Direct NEFT Bank Settlement</span>
                <span className="font-semibold text-green-700">✓ 100% (0% Fee)</span>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-emerald-900">Department</span>
                <span className="font-semibold text-emerald-700">Handloom & Handicrafts Directorate</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900">Clearance Tier</span>
                <span className="font-semibold text-emerald-800">SuperAdmin Governance Clearance</span>
              </div>
            </div>
          )}

          {/* Quick Actions List */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-2">Account Management</div>
            
            {/* Orders */}
            <button
              onClick={() => { onClose(); onOpenOrders?.(); }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Your Orders & Deliveries</div>
                  <div className="text-[11px] text-gray-500">Track shipments, download GST invoices</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700" />
            </button>

            {/* Seller Central Gateway */}
            <button
              onClick={() => { onClose(); onNavigateToSeller?.(); }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-orange-300 hover:bg-orange-50/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Seller Central Dashboard</div>
                  <div className="text-[11px] text-gray-500">Manage catalog, orders & AI studio</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600" />
            </button>

            {/* Admin Portal Gateway */}
            <button
              onClick={() => { onClose(); onNavigateToAdmin?.(); }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Admin Governance Portal</div>
                  <div className="text-[11px] text-gray-500">Compliance, approvals & reports</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
            </button>
          </div>

          {/* Footer Actions: Switch Account / Logout */}
          <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
            <button
              onClick={() => { onClose(); onOpenAuthModal?.(); }}
              className="flex-1 py-2 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors text-center"
            >
              Switch Account
            </button>

            <button
              onClick={() => { onSignOut?.(); onClose(); }}
              className="py-2 px-4 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold text-red-700 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
