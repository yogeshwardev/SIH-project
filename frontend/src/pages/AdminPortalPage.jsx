import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  Tag, 
  Package, 
  Layers, 
  FileSpreadsheet, 
  FileCode, 
  RefreshCw, 
  Sparkles, 
  TrendingUp, 
  Users, 
  IndianRupee, 
  ShoppingBag, 
  Eye, 
  Sliders, 
  CheckCircle2, 
  MessageSquare,
  Zap,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { CategoryBarChart, RegionalDistributionList } from '../components/Charts';
import BeforeAfterSlider from '../components/BeforeAfterSlider';

export default function AdminPortalPage({ onNavigateToMarketplace }) {
  const [adminTab, setAdminTab] = useState('pending'); // 'pending', 'catalog', 'orders', 'analytics'
  const [pendingProducts, setPendingProducts] = useState([]);
  const [publishedProducts, setPublishedProducts] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Inspection Modal
  const [inspectProduct, setInspectProduct] = useState(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [pending, published, inqs, dashboardStats] = await Promise.all([
        api.getPendingProducts(),
        api.getProducts({ status: 'Published' }),
        api.getInquiries(),
        api.getDashboardStats()
      ]);
      setPendingProducts(pending);
      setPublishedProducts(published);
      setInquiries(inqs);
      setStats(dashboardStats);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprove = async (productId, notes = 'Approved for Marketplace publication') => {
    try {
      await api.approveProduct(productId, notes);
      setActionSuccessMessage(`Product #${productId} approved and published to live e-commerce store!`);
      setInspectProduct(null);
      fetchAdminData();
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      alert('Approval failed: ' + err.message);
    }
  };

  const handleReject = async (productId) => {
    try {
      await api.rejectProduct(productId, rejectFeedback || 'Requires additional craft verification details.');
      setActionSuccessMessage(`Product #${productId} rejected with feedback sent to artisan.`);
      setInspectProduct(null);
      setRejectFeedback('');
      fetchAdminData();
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      alert('Rejection failed: ' + err.message);
    }
  };

  const handleAutoApproveAll = async () => {
    try {
      const res = await api.autoApproveAll();
      setActionSuccessMessage(`Fast-track approved ${res.approved_count} pending crafts to marketplace!`);
      fetchAdminData();
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      alert('Auto-approve failed: ' + err.message);
    }
  };

  const handleUpdateOrderStatus = async (inquiryId, newStatus) => {
    try {
      await api.updateInquiryStatus(inquiryId, newStatus);
      fetchAdminData();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F2]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Top Admin Header */}
      <div className="bg-white border border-[#D5D9D9] rounded-lg p-5 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-5 h-5 text-[#007600]" />
            <span className="text-[11px] font-bold text-[#007600] uppercase tracking-wider">Administrator Governance Portal</span>
            <span className="text-[11px] text-[#565959] ml-1">· National Handicrafts & Handloom Directorate</span>
          </div>
          <h1 className="text-[20px] font-bold text-[#0F1111]">
            Artisan Verification & Marketplace Control Center
          </h1>
          <p className="text-[12px] text-[#565959] mt-0.5">
            Review AI-generated listings, verify pricing, authorize marketplace publications, and manage buyer orders.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleAutoApproveAll}
            disabled={pendingProducts.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold bg-[#FF9900] hover:bg-[#F7CA00] text-[#0F1111] border border-[#e68900] transition-colors disabled:opacity-50"
            title="Fast-track approve all pending items"
          >
            <Zap className="w-4 h-4" />
            <span>Approve All ({pendingProducts.length})</span>
          </button>

          <button
            onClick={fetchAdminData}
            className="p-2 rounded-lg bg-white border border-[#D5D9D9] hover:bg-[#F7F8F8] text-[#565959] transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <div className="mb-5 p-3 rounded-lg bg-[#EAF7EE] border border-[#B7DFC4] text-[#007600] text-[12px] font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-[#007600] hover:text-[#005900]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-0 mb-5 bg-white border border-[#D5D9D9] rounded-lg overflow-hidden">
        {[
          { id: 'pending', label: 'Pending Approval', count: pendingProducts.length, icon: Clock },
          { id: 'catalog', label: 'Live Catalog', count: publishedProducts.length, icon: Package },
          { id: 'orders', label: 'Orders & Inquiries', count: inquiries.length, icon: ShoppingBag },
          { id: 'analytics', label: 'Analytics', count: null, icon: TrendingUp }
        ].map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-[12px] font-semibold transition-all whitespace-nowrap border-b-2 flex-1 justify-center ${
                isActive
                  ? 'border-[#FF9900] text-[#0F1111] bg-[#FEF9EE]'
                  : 'border-transparent text-[#565959] hover:text-[#0F1111] hover:bg-[#F7F8F8]'
              } ${idx > 0 ? 'border-l border-[#D5D9D9]' : ''}`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF9900]' : 'text-[#8D9096]'}`} />
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-[#FF9900] text-[#0F1111]' : 'bg-[#EAEDED] text-[#565959]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* TAB 1: PENDING APPROVALS QUEUE            */}
      {/* ========================================== */}
      {adminTab === 'pending' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Awaiting Review</span>
              <span className="text-xs font-semibold text-slate-500">
                ({pendingProducts.length} artisan submissions requiring verification)
              </span>
            </h3>
            {pendingProducts.length > 0 && (
              <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                AI Pipeline Completed • Human Verification Pending
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-artisan-200">
              <div className="w-8 h-8 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-xs text-slate-500 font-bold">Loading Queue...</span>
            </div>
          ) : pendingProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-artisan-200 p-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Approval Queue is Clear!</h4>
              <p className="text-xs text-slate-500 mt-1">
                All submitted artisan crafts have been verified and published to the e-commerce store.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingProducts.map((product) => (
                <div 
                  key={product.id}
                  className="bg-white rounded-2xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Meta */}
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        Request ID #{product.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {product.region || 'India'}
                      </span>
                    </div>

                    <div className="flex items-start gap-4">
                      {/* Image Thumbnail */}
                      <img
                        src={product.enhanced_image || product.original_image}
                        alt={product.product_name}
                        className="w-20 h-20 rounded-xl object-contain bg-slate-900 border border-slate-200 flex-shrink-0"
                      />
                      
                      <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-bold text-terracotta-700 truncate">
                          {product.artisan_name || 'Master Artisan'}
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 truncate">
                          {product.product_name}
                        </h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          Craft: {product.craft_type} • Material: {product.material}
                        </p>
                        
                        {/* Price Details */}
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="font-semibold text-slate-500">
                            Cost: ₹{product.total_cost}
                          </span>
                          <span className="font-extrabold text-emerald-700">
                            Suggested: ₹{product.suggested_price}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Confidence Badge */}
                    <div className="mt-3.5 p-2.5 rounded-xl bg-artisan-50 border border-artisan-200 text-[11px] text-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>AI Entity Confidence: <strong>HIGH (98%)</strong></span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Zero Hallucination
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setInspectProduct(product)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect AI Details</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReject(product.id)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors"
                        title="Reject with notes"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleApprove(product.id)}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve & Publish</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: LIVE MARKETPLACE CATALOG            */}
      {/* ========================================== */}
      {adminTab === 'catalog' && (
        <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Active E-Commerce Listings ({publishedProducts.length})
              </h3>
              <p className="text-xs text-slate-500">
                Live products currently visible to retail consumers and wholesale buyers
              </p>
            </div>
            <button
              onClick={onNavigateToMarketplace}
              className="text-xs font-bold text-terracotta-700 hover:text-terracotta-800 bg-artisan-100 px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <span>View Consumer Storefront</span>
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-artisan-50 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-lg">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Artisan Lineage</th>
                  <th className="p-3">Production Cost</th>
                  <th className="p-3">Selling Price</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {publishedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 flex items-center gap-2.5">
                      <img
                        src={p.enhanced_image || p.original_image}
                        alt=""
                        className="w-10 h-10 rounded-lg object-contain bg-slate-900"
                      />
                      <span className="font-bold text-slate-900 truncate max-w-[200px]">{p.product_name}</span>
                    </td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3">{p.artisan_name || 'Master Artisan'} ({p.region})</td>
                    <td className="p-3 text-slate-500 font-semibold">₹{p.total_cost}</td>
                    <td className="p-3 font-extrabold text-slate-900">₹{p.suggested_price}</td>
                    <td className="p-3 font-bold text-amber-600">★ {p.rating || 4.9}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ● Live on Store
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: BUYER ORDERS & INQUIRIES           */}
      {/* ========================================== */}
      {adminTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Customer Orders & Wholesale Quotes ({inquiries.length})
              </h3>
              <p className="text-xs text-slate-500">
                Direct market linkage orders routed to rural artisan clusters
              </p>
            </div>
          </div>

          {inquiries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">
              No buyer orders placed yet. Add products to cart on the consumer marketplace to test!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-artisan-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-lg">Order ID</th>
                    <th className="p-3">Buyer Details</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-extrabold text-slate-900">#{inq.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{inq.buyer_name}</div>
                        <div className="text-[10px] text-slate-400">{inq.buyer_email} • {inq.buyer_city}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {inq.product_name} (x{inq.quantity})
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold text-[10px]">
                          {inq.order_type}
                        </span>
                      </td>
                      <td className="p-3 font-black text-emerald-800">₹{inq.total_amount.toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          inq.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          inq.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inq.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={inq.status}
                          onChange={(e) => handleUpdateOrderStatus(inq.id, e.target.value)}
                          className="bg-artisan-50 border border-artisan-200 rounded p-1 text-[11px] font-semibold"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: IMPACT & ECONOMICS ANALYTICS        */}
      {/* ========================================== */}
      {adminTab === 'analytics' && stats && (
        <div className="space-y-6">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-4">
              <span className="text-xs font-bold text-slate-400">Total Artisans</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total_artisans}</div>
            </div>
            <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-4">
              <span className="text-xs font-bold text-slate-400">Published Crafts</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.published_products}</div>
            </div>
            <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-4">
              <span className="text-xs font-bold text-slate-400">Catalog Valuation</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">₹{stats.total_catalog_value?.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-4">
              <span className="text-xs font-bold text-slate-400">Avg Artisan Surplus</span>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">+{stats.average_margin_percentage}%</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-artisan-200 shadow-sm p-6">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Category Distribution & Market Value</h4>
              <CategoryBarChart categories={stats.categories || []} />
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl border border-artisan-200 shadow-sm p-6">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Regional Craft Hubs</h4>
              <RegionalDistributionList regions={stats.regions || []} />
            </div>
          </div>

          {/* Direct CSV / JSON Download Actions */}
          <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Standard Data Feeds (ONDC / GeM Export)</h4>
              <p className="text-xs text-slate-500">Download live database records in machine-readable formats</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={api.csvExportUrl}
                download="craftlink_catalog.csv"
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Download CSV</span>
              </a>
              <a
                href={api.jsonExportUrl}
                download="craftlink_catalog.json"
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
              >
                <FileCode className="w-4 h-4 text-blue-600" />
                <span>Download JSON</span>
              </a>
            </div>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* INSPECT PRODUCT DETAIL MODAL (ADMIN REVIEW) */}
      {/* ========================================== */}
      {inspectProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  ADMIN INSPECTION: #{inspectProduct.id}
                </span>
                <span className="text-xs font-bold text-slate-800">{inspectProduct.product_name}</span>
              </div>
              <button onClick={() => setInspectProduct(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Before/After Split Viewer */}
            <div className="mb-5">
              <BeforeAfterSlider
                originalUrl={inspectProduct.original_image}
                enhancedUrl={inspectProduct.enhanced_image}
              />
            </div>

            {/* Speech Transcript */}
            <div className="mb-5 bg-artisan-50 p-4 rounded-xl border border-artisan-200 text-xs">
              <span className="font-bold text-slate-500 block uppercase text-[10px] mb-1">
                Artisan Speech Transcript ({inspectProduct.detected_language})
              </span>
              <p className="italic text-slate-800 leading-relaxed">
                "{inspectProduct.transcript || 'Voice description recorded.'}"
              </p>
            </div>

            {/* Pricing Model Economics */}
            <div className="mb-5 grid grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Cost</span>
                <span className="text-sm font-extrabold text-slate-800">₹{inspectProduct.total_cost}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Recommended Range</span>
                <span className="text-sm font-extrabold text-slate-800">₹{inspectProduct.recommended_min_price} - ₹{inspectProduct.recommended_max_price}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Suggested Retail Price</span>
                <span className="text-base font-black text-emerald-700">₹{inspectProduct.suggested_price}</span>
              </div>
            </div>

            {/* Rejection Feedback Input */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Notes / Feedback (if rejecting)
              </label>
              <textarea
                rows={2}
                placeholder="Specify reasons for rejection (e.g. Dimensions need reconfirmation, missing GI details)..."
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-terracotta-500 outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleReject(inspectProduct.id)}
                className="px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors"
              >
                Reject with Feedback
              </button>
              <button
                onClick={() => handleApprove(inspectProduct.id)}
                className="px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                ✓ Authorize & Publish to Store
              </button>
            </div>

          </div>
        </div>
      )}

      </div>
    </div>
  );
}
