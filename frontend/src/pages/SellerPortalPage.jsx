import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Package, 
  TrendingUp, 
  IndianRupee, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  Edit3, 
  Trash2, 
  Send,
  Building2,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import ArtisanStudioPage from './ArtisanStudioPage';

export default function SellerPortalPage({ onNavigateToAdmin, onNavigateToStore }) {
  const [sellerTab, setSellerTab] = useState('studio'); // 'studio' (Add product), 'inventory', 'orders', 'payouts'
  const [sellerProducts, setSellerProducts] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSellerData = async () => {
    setLoading(true);
    try {
      const [products, orders] = await Promise.all([
        api.getProducts({ status: 'All' }),
        api.getInquiries()
      ]);
      setSellerProducts(products);
      setInquiries(orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerData();
  }, []);

  const totalGMV = sellerProducts
    .filter(p => p.status === 'Published')
    .reduce((sum, p) => sum + (p.suggested_price || 0) * (p.stock_quantity || 1), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Seller Header Banner */}
      <div className="bg-gradient-to-r from-terracotta-900 via-slate-900 to-indigoCraft-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border border-amber-400/30 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                SELLER CENTRAL • VERIFIED ARTISAN GUILD
              </span>
              <span className="text-xs text-slate-300">
                Direct Handloom & Handicraft Producer Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Artisan Enterprise Dashboard & AI Cataloging
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Create market-ready luxury craft listings with computer vision & voice AI, manage inventory, and track direct fair-trade bank settlements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSellerTab('studio')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-500 to-terracotta-600 hover:from-amber-600 hover:to-terracotta-700 text-white shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Craft Listing</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Active Catalog</span>
            <span className="text-lg font-black text-white">{sellerProducts.length} Items</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Catalog Valuation</span>
            <span className="text-lg font-black text-emerald-400">₹{totalGMV.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Orders / Inquiries</span>
            <span className="text-lg font-black text-amber-300">{inquiries.length} Active</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Producer Margin</span>
            <span className="text-lg font-black text-teal-300">100% Direct to Artisan</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 bg-white p-1.5 rounded-2xl border border-artisan-200 shadow-sm">
        {[
          { id: 'studio', label: '✨ AI Listing Creator', icon: Sparkles },
          { id: 'inventory', label: '📦 My Inventory & Catalog', icon: Package, count: sellerProducts.length },
          { id: 'orders', label: '🚚 Orders & Shipments', icon: Truck, count: inquiries.length },
          { id: 'payouts', label: '💰 Direct Bank Payouts', icon: IndianRupee }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = sellerTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSellerTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-artisan-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  isActive ? 'bg-terracotta-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: AI STUDIO LISTING CREATOR */}
      {sellerTab === 'studio' && (
        <ArtisanStudioPage
          onProductCreated={() => {
            fetchSellerData();
            setSellerTab('inventory');
          }}
          onNavigateToAdmin={onNavigateToAdmin}
        />
      )}

      {/* TAB 2: INVENTORY & CATALOG */}
      {sellerTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Artisan Inventory ({sellerProducts.length} Listings)
              </h3>
              <p className="text-xs text-slate-500">
                Track approval status, stock quantities, and retail pricing
              </p>
            </div>
            <button
              onClick={onNavigateToStore}
              className="text-xs font-bold text-terracotta-700 hover:text-terracotta-800 bg-artisan-100 px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Storefront</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-artisan-50 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-lg">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Production Cost</th>
                  <th className="p-3">Retail Price</th>
                  <th className="p-3">Stock Units</th>
                  <th className="p-3">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {sellerProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 flex items-center gap-2.5">
                      <img
                        src={p.enhanced_image || p.original_image}
                        alt=""
                        className="w-10 h-10 rounded-lg object-contain bg-slate-900"
                      />
                      <span className="font-bold text-slate-900 truncate max-w-[200px]">{p.product_name}</span>
                    </td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3 text-slate-500 font-semibold">₹{p.total_cost}</td>
                    <td className="p-3 font-black text-slate-900">₹{p.suggested_price}</td>
                    <td className="p-3 font-bold text-emerald-800">{p.stock_quantity || 5} units</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'Published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'Pending Approval'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        ● {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS & SHIPMENTS */}
      {sellerTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-6">
          <h3 className="text-base font-extrabold text-slate-900 mb-1">Customer Orders ({inquiries.length})</h3>
          <p className="text-xs text-slate-500 mb-4">Direct retail orders routed for packaging and pickup</p>

          {inquiries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">
              No pending fulfillment orders at the moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-artisan-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-lg">Order ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Payout Amount</th>
                    <th className="p-3 rounded-r-lg">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-slate-50">
                      <td className="p-3 font-extrabold text-slate-900">#{inq.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{inq.buyer_name}</div>
                        <div className="text-[10px] text-slate-400">{inq.buyer_city}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{inq.product_name} (x{inq.quantity})</td>
                      <td className="p-3 font-black text-emerald-800">₹{inq.total_amount.toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {inq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PAYOUTS */}
      {sellerTab === 'payouts' && (
        <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Direct Bank Payouts & Settlement</h3>
              <p className="text-xs text-slate-500">100% fair-trade payments settled via direct NEFT/UPI</p>
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
              Verified Producer Account
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-800 font-bold block uppercase text-[10px]">Total Settled Payouts</span>
              <span className="text-2xl font-black text-emerald-950">₹48,950</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-amber-800 font-bold block uppercase text-[10px]">Pending Escrow Clearance</span>
              <span className="text-2xl font-black text-amber-950">₹9,850</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-bold block uppercase text-[10px]">Platform Intermediary Fee</span>
              <span className="text-2xl font-black text-slate-800">0% (Zero)</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
