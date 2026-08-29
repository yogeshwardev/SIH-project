import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Plus, Package, TrendingUp, IndianRupee,
  Truck, ShieldCheck, CheckCircle2, Eye, Edit3, Trash2, Send,
  Building2, Clock, AlertCircle, Sparkles, Camera, Upload, Mic,
  ArrowRight, ArrowLeft, Check, Globe, Tag, Volume2, VolumeX,
  RefreshCw, Star, BarChart2, Bell, Settings, ChevronRight,
  LogOut, HelpCircle, Zap, Award, Users, ShoppingBag, X,
  FileText, Layers, Download, Filter, Search, MoreHorizontal,
  ChevronDown, Banknote, Wallet, Activity, PieChart, MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { voiceAssistant } from '../services/voiceAssistant';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import VoiceRecorder from '../components/VoiceRecorder';
import PriceExplainerCard from '../components/PriceExplainerCard';

const SELLER_LANGUAGE_OPTIONS = [
  { name: 'Hindi', code: 'hi-IN', label: 'हिन्दी' },
  { name: 'Telugu', code: 'te-IN', label: 'తెలుగు' },
  { name: 'English', code: 'en-IN', label: 'English' },
];

const speechCodeForLanguage = (language) => {
  const value = String(language || '').toLowerCase();
  if (value.startsWith('te') || value.includes('telugu') || value.includes('తెలుగు')) return 'te-IN';
  if (value.startsWith('hi') || value.includes('hindi') || value.includes('हिन्द')) return 'hi-IN';
  if (value.startsWith('ta') || value.includes('tamil')) return 'ta-IN';
  if (value.startsWith('bn') || value.includes('bengali')) return 'bn-IN';
  if (value.startsWith('mr') || value.includes('marathi')) return 'mr-IN';
  return 'en-IN';
};

const confirmationAnswerForLanguage = (language) => {
  const code = speechCodeForLanguage(language);
  if (code === 'te-IN') return 'అవును, ఈ సమాచారం మరియు ఖర్చులు సరైనవి.';
  if (code === 'hi-IN') return 'हाँ, यह जानकारी और लागत सही है।';
  return 'Yes, these details and costs are correct.';
};

const questionUiCopyFor = (language) => {
  const code = speechCodeForLanguage(language);
  if (code === 'te-IN') return {
    heading: 'ఒక సులభమైన ప్రశ్న',
    question: 'ప్రశ్న',
    of: 'లో',
    confirm: '✓ అవును, ఇది సరైనది — తర్వాత',
    heard: 'మేము విన్న సమాధానం',
    checkAnswer: 'ఇది సరైందైతే తర్వాత నొక్కండి. కాకపోతే మళ్లీ రికార్డ్ చేయండి.',
    recordAgain: 'మళ్లీ రికార్డ్ చేయండి',
    saveVoice: 'సమాధానం సేవ్ చేసి తర్వాత',
    orType: 'లేదా సమాధానం టైప్ చేయండి',
    placeholder: 'మీ భాషలో టైప్ చేయండి…',
    save: 'సేవ్ చేసి తర్వాత',
    back: 'ఫోటోకు తిరిగి వెళ్లండి',
    previous: 'వెనుకకు',
    next: 'తర్వాత',
    listenQuestion: 'ప్రశ్నను వినండి',
    stopQuestion: 'వాయిస్ ఆపండి',
    preparingVoice: 'సహజమైన వాయిస్ సిద్ధమవుతోంది…',
    questionHelp: 'ఈ ప్రశ్నను సహజమైన వాయిస్‌లో చదువుతాం. మళ్లీ వినాలంటే కింద ఉన్న బటన్ నొక్కండి.',
    answerChoice: 'మాట్లాడండి లేదా టైప్ చేయండి — మీకు సులభమైనది ఎంచుకోండి.',
    confirmationHelp: 'వివరాలను ఒకసారి చూసుకోండి. అన్నీ సరైతే నిర్ధారించి తర్వాత నొక్కండి. ఏదైనా మార్చాలంటే వెనుకకు నొక్కండి.',
    languageLabel: 'సమాధానం చెప్పే భాష',
  };
  if (code === 'hi-IN') return {
    heading: 'एक आसान सवाल',
    question: 'सवाल',
    of: 'में से',
    confirm: '✓ हाँ, यह सही है — आगे',
    heard: 'हमने यह जवाब सुना',
    checkAnswer: 'यह सही है तो आगे दबाएँ। नहीं तो फिर रिकॉर्ड करें।',
    recordAgain: 'फिर रिकॉर्ड करें',
    saveVoice: 'जवाब सहेजें और आगे जाएँ',
    orType: 'या जवाब लिखें',
    placeholder: 'अपनी भाषा में लिखें…',
    save: 'सहेजें और आगे जाएँ',
    back: 'फोटो पर वापस जाएँ',
    previous: 'पिछला',
    next: 'अगला',
    listenQuestion: 'सवाल सुनें',
    stopQuestion: 'आवाज़ रोकें',
    preparingVoice: 'स्वाभाविक आवाज़ तैयार हो रही है…',
    questionHelp: 'यह सवाल स्वाभाविक आवाज़ में अपने-आप पढ़ा जाएगा। दोबारा सुनने के लिए नीचे का बटन दबाएँ।',
    answerChoice: 'बोलें या लिखें — जो आपके लिए आसान हो उसे चुनें।',
    confirmationHelp: 'जानकारी एक बार देख लें। सब सही है तो पुष्टि करके आगे बढ़ें। बदलने के लिए पिछला दबाएँ।',
    languageLabel: 'जवाब की भाषा',
  };
  return {
    heading: 'One simple question',
    question: 'Question',
    of: 'of',
    confirm: '✓ Yes, this is correct — Next',
    heard: 'We heard your answer',
    checkAnswer: 'If this looks right, tap Next. Otherwise record it again.',
    recordAgain: 'Record again',
    saveVoice: 'Save answer & Next',
    orType: 'Or type the answer',
    placeholder: 'Type in your own language…',
    save: 'Save & Next',
    back: 'Back to Photo',
    previous: 'Previous',
    next: 'Next',
    listenQuestion: 'Listen to question',
    stopQuestion: 'Stop voice',
    preparingVoice: 'Preparing natural voice…',
    questionHelp: 'The assistant reads this aloud automatically. Tap below whenever you want to hear it again.',
    answerChoice: 'Speak or type — choose whichever is easier for you.',
    confirmationHelp: 'Check the details once. If everything is correct, confirm and continue. Use Previous to change an answer.',
    languageLabel: 'Answer language',
  };
};

// ── KPI Cards data ────────────────────────────────
function StatCard({ borderColor, label, value, sub, trend }) {
  return (
    <div className={`bg-white border border-[#D5D9D9] rounded-lg p-4 border-l-4 ${borderColor} shadow-sm`}>
      <div className="text-[11px] text-[#565959] font-medium uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[28px] font-black text-[#0F1111] leading-none mb-1">{value}</div>
      {sub && <div className="text-[11px] text-[#8D9096]">{sub}</div>}
      {trend && (
        <div className={`text-[11px] font-semibold mt-1.5 flex items-center gap-1 ${trend.up ? 'text-[#007600]' : 'text-[#CC0C39]'}`}>
          <TrendingUp className={`w-3 h-3 ${!trend.up && 'rotate-180'}`} />
          {trend.label}
        </div>
      )}
    </div>
  );
}

// ── Sidebar Nav Item ──────────────────────────────
function SideNavItem({ icon: Icon, label, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all text-left relative ${
        active
          ? 'border-l-[3px] border-[#FF9900] bg-[#FEF9EE] text-[#0F1111] font-semibold pl-[9px]'
          : 'text-[#565959] hover:bg-[#F7F8F8] border-l-[3px] border-transparent'
      }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#FF9900]' : 'text-[#8D9096]'}`} />
      <span className="flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
          active ? 'bg-[#FF9900] text-[#0F1111]' : 'bg-[#EAEDED] text-[#565959]'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Status Badge ──────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    'Published':       'bg-[#EAF7EE] text-[#007600] border-[#B7DFC4]',
    'Pending Approval': 'bg-[#FFF8E7] text-[#B45309] border-[#FCD34D]',
    'Rejected':        'bg-[#FEF2F2] text-[#CC0C39] border-[#FECACA]',
    'Processing':      'bg-[#FFF8E7] text-[#B45309] border-[#FCD34D]',
    'Delivered':       'bg-[#EAF7EE] text-[#007600] border-[#B7DFC4]',
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg[status] || 'bg-[#F7F8F8] text-[#565959] border-[#D5D9D9]'}`}>
      {status}
    </span>
  );
}

// ── Mini Chart Bar ────────────────────────────────
function MiniBarChart({ data }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-10">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-orange-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
          style={{ height: `${(v / max) * 100}%` }}
          title={`₹${v.toLocaleString('en-IN')}`}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SELLER PORTAL
// ═══════════════════════════════════════════════════════════════
export default function SellerPortalPage({
  currentUser,
  onNavigateToAdmin,
  onNavigateToStore,
  onNavigateToOnboarding,
  onOpenAuthModal
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts]   = useState([]);
  const [orders, setOrders]       = useState([]);
  const [artisans, setArtisans]   = useState([]);
  const [selectedArtisanId, setSelectedArtisanId] = useState(currentUser?.id || null);
  const [loading, setLoading]     = useState(true);
  const [searchQ, setSearchQ]     = useState('');

  const activeArtisan = artisans.find(a => a.id === selectedArtisanId) || currentUser || artisans[0] || null;

  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'addproduct', label: 'AI Listing Studio', icon: Sparkles },
    { id: 'inventory', label: 'My Inventory', icon: Package, count: products.length },
    { id: 'orders', label: 'Orders & Shipments', icon: Truck, count: orders.length },
    { id: 'payments', label: 'Payments & Payouts', icon: Banknote },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prods, fulfilmentOrders, artisanProfiles] = await Promise.all([
        api.getProducts({ status: 'All' }),
        api.getOrders(),
        api.getArtisans(),
      ]);
      setProducts(prods || []);
      setOrders((fulfilmentOrders || []).map(order => ({
        ...order,
        buyer_city: order.city,
        product_name: order.items?.map(item => item.product_name).join(', ') || 'Order items',
        quantity: order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0,
      })));
      setArtisans(artisanProfiles || []);
      if (!selectedArtisanId && artisanProfiles?.length > 0) {
        setSelectedArtisanId(artisanProfiles[0].id);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const published  = products.filter(p => p.status === 'Published');
  const pending    = products.filter(p => p.status === 'Pending Approval');
  const totalGMV   = published.reduce((s, p) => s + (p.suggested_price || 0) * (p.stock_quantity || 1), 0);
  const totalPayout = orders.reduce((s, o) => s + (o.total_amount || 0), 0);

  return (
    <div className="flex h-screen bg-[#F0F2F2] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ════════════════════════════
          LEFT SIDEBAR
      ════════════════════════════ */}
      <aside className="w-[240px] flex-shrink-0 bg-white border-r border-[#D5D9D9] flex flex-col h-full overflow-y-auto">

        {/* Seller Profile & Store Switcher */}\n        <div className="px-4 pt-4 pb-2 text-[18px] font-black text-[#131921]">CraftLink</div>
        <div className="p-4 border-b border-[#D5D9D9]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded bg-[#FF9900] flex items-center justify-center text-white font-black text-[15px] flex-shrink-0 shadow">
              {activeArtisan?.store_name ? activeArtisan.store_name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-gray-900 truncate">
                {activeArtisan?.store_name || activeArtisan?.name || 'Your Store'}
              </div>
              <div className="text-[11px] text-gray-500 truncate">
                {activeArtisan?.region || ''}
              </div>
            </div>
          </div>

          {/* Store Switcher Dropdown */}
          {artisans.length > 1 && (
            <div className="mb-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Active Store Profile</label>
              <select
                value={selectedArtisanId || ''}
                onChange={(e) => setSelectedArtisanId(Number(e.target.value))}
                className="w-full text-xs font-semibold bg-gray-50 border border-[#D5D9D9] rounded-lg p-1.5 outline-none focus:border-orange-500 text-gray-800"
              >
                {artisans.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.store_name || a.name} ({a.region?.split(',')[0]})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Register Another Store */}
          {onNavigateToOnboarding && (
            <button
              onClick={onNavigateToOnboarding}
              className="w-full text-left py-1.5 px-2 bg-orange-50/60 hover:bg-orange-100/80 border border-orange-200 rounded-lg text-[11px] font-bold text-orange-800 flex items-center justify-between transition-colors mb-2"
            >
              <span>+ Register New Store</span>
              <Plus className="w-3 h-3 text-orange-600" />
            </button>
          )}

          
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          <div className="text-[10px] font-bold text-[#8D9096] uppercase tracking-widest px-3 pb-1 pt-3">Main Menu</div>
          {NAV.map(item => (
            <SideNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              count={item.count}
              onClick={() => setActiveTab(item.id)}
            />
          ))}

          <div className="text-[10px] font-bold text-[#8D9096] uppercase tracking-widest px-3 pb-1 pt-3">Account</div>
          <SideNavItem icon={Settings} label="Account Settings" active={false} onClick={() => {}} />
          <SideNavItem icon={HelpCircle} label="Help & Support" active={false} onClick={() => {}} />
          <SideNavItem icon={ShieldCheck} label="Admin Portal" active={false} onClick={onNavigateToAdmin} />
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#D5D9D9]">
          <button
            onClick={onNavigateToStore}
            className="w-full flex items-center gap-2 text-[12px] font-semibold text-gray-600 hover:text-gray-900 py-2 px-3 rounded border-b border-[#EAEDED] hover:bg-[#FAFAFA] transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Your Storefront
          </button>
        </div>
      </aside>

      {/* ════════════════════════════
          MAIN CONTENT AREA
      ════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header Bar */}
        <header className="bg-white border-b border-[#D5D9D9] px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-[#0F1111] font-bold text-[15px]" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {activeTab === 'dashboard'  && 'Seller Dashboard'}
              {activeTab === 'addproduct' && 'AI Listing Studio'}
              {activeTab === 'inventory'  && 'My Inventory & Catalog'}
              {activeTab === 'orders'     && 'Orders & Shipments'}
              {activeTab === 'payments'   && 'Payments & Payouts'}
              {activeTab === 'analytics'  && 'Analytics & Insights'}
            </h1>
            <p className="text-[12px] text-[#565959] mt-0.5">
              CraftLink Seller Central · {activeArtisan ? `${activeArtisan.name}, ${activeArtisan.region}` : 'Loading artisan profile…'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded px-3 py-2 w-[220px]">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="bg-transparent text-[13px] text-gray-700 placeholder-gray-400 outline-none flex-1"
              />
            </div>

            {/* Notifications */}
            <button className="relative w-9 h-9 rounded bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <Bell className="w-4 h-4" />
              {pending.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {pending.length}
                </span>
              )}
            </button>

            {/* View Storefront CTA */}
            <button
              onClick={onNavigateToStore}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-[13px] bg-white hover:bg-gray-50 text-[#0F1111] font-semibold border border-[#D5D9D9] transition-all"
              title="Open Consumer Marketplace"
            >
              <Eye className="w-4 h-4 text-[#565959]" />
              <span className="hidden sm:inline">Storefront</span>
            </button>

            {/* Add product CTA */}
            <button
              onClick={() => setActiveTab('addproduct')}
              className="flex items-center gap-2 px-4 py-2 rounded text-[13px] bg-[#FF9900] hover:bg-[#F7CA00] text-[#0F1111] font-bold border border-[#e68900] transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Listing
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ══════════════════════════
              TAB: DASHBOARD
          ══════════════════════════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">

              {/* Welcome Banner — flat, professional */}
              <div
                className="bg-white border border-[#D5D9D9] rounded-lg p-5"
                
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span style={{ background: '#EAF7EE', color: '#1D7A3B', border: '1px solid #B7DFC4', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        ✓ Verified Artisan Guild · Level 3 Seller
                      </span>
                    </div>
                    <h2 className="text-[18px] font-bold text-[#0F1111] mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      Welcome back, {activeArtisan?.store_name || currentUser?.store_name || currentUser?.name || 'Your Store'}
                    </h2>
                    <p className="text-[13px] text-gray-500">
                      You have <strong className="text-gray-900">{orders.length} new orders</strong> awaiting fulfillment and <strong className="text-gray-900">{pending.length} listings</strong> pending admin review.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => setActiveTab('addproduct')}
                      className="btn-primary"
                    >
                      <Sparkles className="w-4 h-4" />
                      AI Listing Studio
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard borderColor="border-[#007185]" label="Active Listings" value={published.length} sub={`${pending.length} pending review`} trend={{ up: true, label: '+2 this week' }} />
                <StatCard borderColor="border-[#007600]" label="Catalog GMV" value={`₹${totalGMV.toLocaleString('en-IN')}`} sub="Gross merchandise value" trend={{ up: true, label: '+12% vs last month' }} />
                <StatCard borderColor="border-[#FF9900]" label="Total Orders" value={orders.length} sub="Direct buyer orders" trend={{ up: true, label: `${orders.length} active` }} />
                <StatCard borderColor="border-[#8B5CF6]" label="Settled Payouts" value={`₹${totalPayout.toLocaleString('en-IN')}`} sub="Direct NEFT to bank" trend={{ up: true, label: '0% platform fee' }} />
              </div>

              {/* Second Row: Chart + Top Products + Pending Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Sales Chart Card */}
                <div className="lg:col-span-2 bg-white border border-[#D5D9D9] rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[14px] font-bold text-gray-900">Revenue Overview</h3>
                      <p className="text-[12px] text-gray-500">Daily orders (last 7 days)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">
                        ↑ 23% vs last week
                      </span>
                      <button className="text-[12px] text-gray-500 hover:text-gray-700 flex items-center gap-1">
                        This Week <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="flex items-end gap-2 h-32 mb-3">
                    {[12000, 18500, 9800, 24000, 16000, 22000, 19500].map((v, i) => {
                      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                      const max = 24000;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] text-gray-400 font-semibold">₹{(v/1000).toFixed(0)}k</span>
                          <div
                            className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                            style={{
                              height: `${(v / max) * 80}px`,
                              background: i === 3 ? '#FF9900' : '#EAEDED',
                            }}
                          />
                          <span className="text-[9px] text-gray-400">{days[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500">
                    <span>Total this week: <strong className="text-[#0F1111]">₹{totalPayout.toLocaleString('en-IN')}</strong></span>
                    <button className="text-blue-600 hover:underline font-semibold">View full report →</button>
                  </div>
                </div>

                {/* Pending Actions */}
                <div className="bg-white border border-[#D5D9D9] rounded-lg p-5 shadow-sm flex flex-col">
                  <h3 className="text-[14px] font-bold text-gray-900 mb-3">Action Required</h3>
                  <div className="space-y-3 flex-1">
                    {[
                      { icon: Clock, color: 'text-[#B45309]', title: 'Pending Review', desc: `${pending.length} listings waiting admin`, action: () => setActiveTab('inventory') },
                      { icon: Truck, color: 'text-[#007185]', title: 'Pack & Ship', desc: `${orders.length} orders to fulfill`, action: () => setActiveTab('orders') },
                      { icon: Zap, color: 'text-[#8B5CF6]', title: 'New AI Feature', desc: 'Try the multilingual voice lister', action: () => setActiveTab('addproduct') },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={item.action}
                        className="w-full flex items-center gap-3 p-3 rounded border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
                      >
                        <div className={`flex-shrink-0 ${item.color}`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-bold text-gray-900">{item.title}</div>
                          <div className="text-[11px] text-gray-500 truncate">{item.desc}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
                      </button>
                    ))}
                  </div>

                  {/* Trust badge */}
                  <div className="mt-4 pt-3 border-t border-gray-100 bg-green-50 rounded p-3 flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="text-[11px] text-green-800 font-semibold leading-snug">
                      0% Platform Fee · 100% Earnings<br />
                      Direct bank settlement in 24h
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Products Preview */}
              <div className="bg-white border border-[#D5D9D9] rounded-lg shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-gray-900">Recent Listings</h3>
                  <button onClick={() => setActiveTab('inventory')} className="text-[12px] text-blue-600 hover:underline font-semibold">
                    View all →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="bg-[#F7F8F8] text-[#565959] text-xs uppercase font-semibold tracking-wider">
                      <tr>
                        <th className="px-5 py-3 text-left">Product</th>
                        <th className="px-5 py-3 text-left">Category</th>
                        <th className="px-5 py-3 text-left">Price</th>
                        <th className="px-5 py-3 text-left">Stock</th>
                        <th className="px-5 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.slice(0, 5).map(p => (
                        <tr key={p.id} className="border-b border-[#EAEDED] hover:bg-[#FAFAFA] transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img
                                  src={p.enhanced_image || p.original_image || 'https://placehold.co/40x40/f3f4f6/9ca3af?text=?'}
                                  alt=""
                                  className="w-full h-full object-contain"
                                  onError={e => e.target.src = 'https://placehold.co/40x40/f3f4f6/9ca3af?text=?'}
                                />
                              </div>
                              <span className="font-semibold text-gray-900 line-clamp-1">{p.product_name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-500">{p.category}</td>
                          <td className="px-5 py-3 font-bold text-gray-900">₹{p.suggested_price?.toLocaleString('en-IN')}</td>
                          <td className="px-5 py-3 text-gray-600">{p.stock_quantity || 5} units</td>
                          <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-[13px]">
                            No products yet. <button onClick={() => setActiveTab('addproduct')} className="text-orange-500 font-bold hover:underline">Add your first listing →</button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════
              TAB: AI LISTING STUDIO
          ══════════════════════════ */}
          {activeTab === 'addproduct' && (
            <AiListingStudio
              onProductCreated={() => { fetchData(); setActiveTab('inventory'); }}
              onNavigateToAdmin={onNavigateToAdmin}
              artisanId={activeArtisan?.id || null}
              artisanName={activeArtisan?.name || 'Artisan'}
            />
          )}

          {/* ══════════════════════════
              TAB: INVENTORY
          ══════════════════════════ */}
          {activeTab === 'inventory' && (
            <div className="space-y-4 animate-fade-in">

              {/* Toolbar */}
              <div className="bg-white rounded-lg border border-[#D5D9D9] shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-gray-100 rounded px-3 py-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search inventory..."
                      className="bg-transparent text-[13px] text-gray-700 placeholder-gray-400 outline-none w-48"
                    />
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded border border-[#D5D9D9] text-[12px] font-semibold text-gray-600 hover:bg-gray-50">
                    <Filter className="w-3.5 h-3.5" />
                    Filter
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded border border-[#D5D9D9] text-[12px] font-semibold text-gray-600 hover:bg-gray-50">
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => setActiveTab('addproduct')}
                    className="flex items-center gap-2 px-4 py-2 rounded text-[13px] bg-[#FF9900] hover:bg-[#F7CA00] text-[#0F1111] font-bold border border-[#e68900] transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Listings', value: products.length, color: 'text-blue-600' },
                  { label: 'Live on Marketplace', value: published.length, color: 'text-green-600' },
                  { label: 'Pending Review', value: pending.length, color: 'text-amber-600' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded border border-[#D5D9D9] shadow-sm p-4 text-center">
                    <div className={`text-[24px] font-black ${s.color}`}>{s.value}</div>
                    <div className="text-[11px] text-gray-500 font-medium mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Inventory Table */}
              <div className="bg-white border border-[#D5D9D9] rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="bg-[#F7F8F8] text-[#565959] text-xs uppercase font-semibold tracking-wider border-b border-[#D5D9D9]">
                      <tr>
                        <th className="px-5 py-3.5 text-left">Product</th>
                        <th className="px-5 py-3.5 text-left">Category</th>
                        <th className="px-5 py-3.5 text-left">Cost Price</th>
                        <th className="px-5 py-3.5 text-left">Sell Price</th>
                        <th className="px-5 py-3.5 text-left">Margin</th>
                        <th className="px-5 py-3.5 text-left">Stock</th>
                        <th className="px-5 py-3.5 text-left">Status</th>
                        <th className="px-5 py-3.5 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-16">
                            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-[14px] font-semibold text-gray-500 mb-3">No products in your catalog yet</p>
                            <button
                              onClick={() => setActiveTab('addproduct')}
                              className="flex items-center gap-2 px-4 py-2 rounded text-[13px] bg-[#FF9900] hover:bg-[#F7CA00] text-[#0F1111] font-bold border border-[#e68900] transition-all active:scale-95"
                            >
                              + Create Your First Listing with AI
                            </button>
                          </td>
                        </tr>
                      ) : products.map(p => {
                        const cost = (p.total_cost || 0);
                        const price = (p.suggested_price || 0);
                        const margin = cost > 0 ? Math.round(((price - cost) / price) * 100) : 0;
                        return (
                          <tr key={p.id} className="border-b border-[#EAEDED] hover:bg-[#FAFAFA] transition-colors group">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded bg-gray-100 border border-[#D5D9D9] flex items-center justify-center overflow-hidden flex-shrink-0">
                                  <img
                                    src={p.enhanced_image || p.original_image || 'https://placehold.co/48x48/f3f4f6/9ca3af?text=?'}
                                    alt=""
                                    className="w-full h-full object-contain p-0.5"
                                    onError={e => e.target.src = 'https://placehold.co/48x48/f3f4f6/9ca3af?text=?'}
                                  />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 line-clamp-1">{p.product_name}</div>
                                  <div className="text-[11px] text-gray-400">{p.craft_type}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-gray-500">{p.category}</td>
                            <td className="px-5 py-3.5 text-gray-600">₹{cost.toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3.5 font-bold text-gray-900">₹{price.toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3.5">
                              <span className={`font-bold ${margin > 30 ? 'text-green-600' : margin > 15 ? 'text-amber-600' : 'text-red-500'}`}>
                                {margin}%
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`font-semibold ${(p.stock_quantity || 5) < 5 ? 'text-red-600' : 'text-gray-700'}`}>
                                {p.stock_quantity || 5}
                              </span>
                            </td>
                            <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="View">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-amber-600" title="Edit">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════
              TAB: ORDERS
          ══════════════════════════ */}
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-fade-in">
              {/* Order Status Filters */}
              <div className="flex items-center gap-6 border-b border-[#D5D9D9] mb-4">
                {['All', 'New', 'Processing', 'Shipped', 'Delivered'].map(status => (
                  <button key={status} className={`pb-2 text-[13px] font-bold ${status === 'All' ? 'text-[#0F1111] border-b-2 border-[#FF9900]' : 'text-[#565959] hover:text-[#0F1111]'}`}>
                    {status}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'bg-blue-500' },
                  { label: 'To Fulfill', value: orders.filter(o => o.status !== 'Delivered').length, icon: Package, color: 'bg-amber-500' },
                  { label: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length, icon: CheckCircle2, color: 'bg-green-500' },
                  { label: 'Revenue', value: `₹${orders.reduce((s, o) => s + (o.total_amount || 0), 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-purple-500' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-lg border border-[#D5D9D9] shadow-sm p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded ${s.color} flex items-center justify-center flex-shrink-0`}>
                      <s.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-[20px] font-black text-gray-900">{s.value}</div>
                      <div className="text-[11px] text-gray-500">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-[#D5D9D9] rounded-lg shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-gray-900">Customer Orders</h3>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#D5D9D9] text-[12px] font-semibold text-gray-600 hover:bg-gray-50">
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-[14px] font-semibold text-gray-500">No orders yet</p>
                    <p className="text-[12px] mt-1">Orders from buyers will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead className="bg-[#F7F8F8] text-[#565959] text-xs uppercase font-semibold tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="px-5 py-3.5 text-left">Order ID</th>
                          <th className="px-5 py-3.5 text-left">Customer</th>
                          <th className="px-5 py-3.5 text-left">Product</th>
                          <th className="px-5 py-3.5 text-left">Qty</th>
                          <th className="px-5 py-3.5 text-left">Amount</th>
                          <th className="px-5 py-3.5 text-left">Your Payout</th>
                          <th className="px-5 py-3.5 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.map(o => (
                          <tr key={o.id} className="border-b border-[#EAEDED] hover:bg-[#FAFAFA] transition-colors">
                            <td className="px-5 py-3.5 font-bold text-gray-900">#CRF-{o.id}</td>
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-gray-900">{o.buyer_name}</div>
                              <div className="text-[11px] text-gray-400">{o.buyer_city}</div>
                            </td>
                            <td className="px-5 py-3.5 text-gray-700">{o.product_name}</td>
                            <td className="px-5 py-3.5 text-gray-600">{o.quantity}</td>
                            <td className="px-5 py-3.5 font-bold text-gray-900">₹{o.total_amount?.toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3.5 font-black text-green-700">₹{o.total_amount?.toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3.5"><StatusBadge status={o.status || 'Processing'} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════
              TAB: PAYMENTS
          ══════════════════════════ */}
          {activeTab === 'payments' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Earnings', value: '₹1,58,950', sub: 'Since account opening', icon: IndianRupee, color: 'bg-green-500', trend: '+₹48,950 this month' },
                  { label: 'In Escrow', value: '₹9,850', sub: 'Clearing in 2 business days', icon: Clock, color: 'bg-amber-500', trend: 'Releasing Friday' },
                  { label: 'Platform Fee', value: '₹0 (Zero)', sub: '100% goes to your bank', icon: ShieldCheck, color: 'bg-blue-500', trend: 'Fair trade guarantee' },
                ].map(c => (
                  <div key={c.label} className="bg-white border border-[#D5D9D9] rounded-lg p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[12px] font-semibold text-gray-500">{c.label}</span>
                      <div className={`w-9 h-9 rounded ${c.color} flex items-center justify-center`}>
                        <c.icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-[26px] font-black text-gray-900">{c.value}</div>
                    <div className="text-[11px] text-gray-400 mt-1">{c.sub}</div>
                    <div className="text-[11px] font-semibold text-green-600 mt-2">{c.trend}</div>
                  </div>
                ))}
              </div>

              {/* Bank Account */}
              <div className="bg-white border border-[#D5D9D9] rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-bold text-gray-900">Bank Settlement Account</h3>
                  <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                    ✓ Verified KYC
                  </span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded border border-[#D5D9D9]">
                  <div className="w-12 h-12 rounded bg-blue-600 flex items-center justify-center text-white font-black text-lg">
                    SBI
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-[14px]">State Bank of India</div>
                    <div className="text-[12px] text-gray-500">A/C No: XXXX XXXX XXXX 4421 · IFSC: SBIN0001234</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">Varanasi, Uttar Pradesh Branch</div>
                  </div>
                  <button className="ml-auto text-[12px] text-blue-600 hover:underline font-semibold">Change Account</button>
                </div>
              </div>

              {/* Settlement History Table */}
              <div className="bg-white border border-[#D5D9D9] rounded-lg shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-[14px] font-bold text-gray-900">Settlement History</h3>
                </div>
                <table className="w-full text-[13px]">
                  <thead className="bg-[#F7F8F8] text-[#565959] text-xs uppercase font-semibold tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5 text-left">Date</th>
                      <th className="px-5 py-3.5 text-left">Reference</th>
                      <th className="px-5 py-3.5 text-left">Amount</th>
                      <th className="px-5 py-3.5 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { date: '24 Aug 2026', orders: 5, gross: 28500, fee: 0, status: 'Settled' },
                      { date: '18 Aug 2026', orders: 3, gross: 12800, fee: 0, status: 'Settled' },
                      { date: '10 Aug 2026', orders: 7, gross: 42000, fee: 0, status: 'Settled' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5 font-medium text-gray-700">{row.date}</td>
                        <td className="px-5 py-3.5 text-gray-500">REF-{Math.floor(Math.random() * 1000000)}</td>
                        <td className="px-5 py-3.5 font-bold text-[#0F1111]">₹{row.gross.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3.5">
                          <span className="bg-green-100 text-green-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                            ✓ {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════
              TAB: ANALYTICS
          ══════════════════════════ */}
          {activeTab === 'analytics' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Listing Views', value: '12,840', trend: '+34%', icon: Eye, color: 'bg-blue-500' },
                  { label: 'Conversion Rate', value: '3.2%', trend: '+0.8%', icon: TrendingUp, color: 'bg-green-500' },
                  { label: 'Avg. Order Value', value: '₹4,850', trend: '+12%', icon: IndianRupee, color: 'bg-orange-500' },
                  { label: 'Repeat Buyers', value: '22%', trend: '+5%', icon: Users, color: 'bg-purple-500' },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-[#D5D9D9] rounded-lg p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded ${s.color} flex items-center justify-center`}>
                        <s.icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">↑ {s.trend}</span>
                    </div>
                    <div className="text-[24px] font-black text-gray-900">{s.value}</div>
                    <div className="text-[12px] text-[#565959] mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-[#D5D9D9] rounded-lg p-5 shadow-sm">
                <h3 className="text-[14px] font-bold text-gray-900 mb-4">Top Performing Categories</h3>
                {[
                  { name: 'Handloom & Textiles', sales: 8, revenue: 88200, pct: 68 },
                  { name: 'Pottery & Ceramics', sales: 3, revenue: 18450, pct: 28 },
                  { name: 'Tribal Art', sales: 1, revenue: 3600, pct: 10 },
                ].map(cat => (
                  <div key={cat.name} className="mb-4">
                    <div className="flex items-center justify-between mb-1.5 text-[13px]">
                      <span className="font-semibold text-gray-900">{cat.name}</span>
                      <span className="font-bold text-gray-700">₹{cat.revenue.toLocaleString('en-IN')} · {cat.sales} sales</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-400"
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// AI LISTING STUDIO (EMBEDDED)
// ═══════════════════════════════════════════════════════════════
function AiListingStudio({ onProductCreated, onNavigateToAdmin, artisanId, artisanName }) {
  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [loadMsg, setLoadMsg]     = useState('');
  const [error, setError]         = useState(null);
  const [speaking, setSpeaking]   = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);

  const [imgData, setImgData]     = useState(null);
  const [transcript, setTxt]      = useState('');
  const [detLang, setDetLang]     = useState('Hindi');
  const [attrs, setAttrs]         = useState(null);
  const [editMode, setEditMode]   = useState(false);
  const [listing, setListing]     = useState(null);
  const [listLang, setListLang]   = useState('en');
  const [pricing, setPricing]     = useState(null);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [costs, setCosts]         = useState({ material_cost: null, labor_cost: null, packaging_cost: null, production_time: '' });
  const [interview, setInterview] = useState(null);
  const [interviewTurns, setInterviewTurns] = useState([]);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [productId, setProductId] = useState(null);
  const lastAutoSpokenQuestionRef = useRef('');
  const questionUi = questionUiCopyFor(detLang);

  const STEPS = [
    { n: 1, label: 'Add Photo', sub: 'AI cleans the image' },
    { n: 2, label: 'Answer Questions', sub: 'One simple question at a time' },
    { n: 3, label: 'Check Details', sub: 'Review your words' },
    { n: 4, label: 'See Fair Price', sub: 'Clear cost calculation' },
    { n: 5, label: 'Send for Review', sub: 'Final submission' },
  ];

  const clearQuestionFlow = () => {
    voiceAssistant.stopSpeaking();
    lastAutoSpokenQuestionRef.current = '';
    setSpeaking(false); setVoiceLoading(false);
    setTxt(''); setAttrs(null); setListing(null); setPricing(null);
    setCosts({ material_cost: null, labor_cost: null, packaging_cost: null, production_time: '' });
    setInterview(null); setInterviewTurns([]); setQuestionHistory([]); setTypedAnswer(''); setPendingAnswer(null);
  };

  const speakPrompt = useCallback(async (message, language = detLang) => {
    if (!message) return;
    setVoiceLoading(true);
    setSpeaking(false);
    const started = await voiceAssistant.speak(
      message,
      speechCodeForLanguage(language),
      () => { setSpeaking(false); setVoiceLoading(false); },
      { preferNeural: true, neuralTimeoutMs: 6000 },
    );
    setVoiceLoading(false);
    setSpeaking(Boolean(started));
  }, [detLang]);

  // Play a question only after its page is mounted and the loading screen has
  // disappeared. Starting speech inside the API handler raced the render and
  // could be dropped by browser autoplay handling even though the question was
  // visible a moment later.
  useEffect(() => {
    const message = interview?.assistant_message;
    if (step !== 2 || loading || !message) return undefined;

    const questionKey = [interview?.question_number || 0, detLang, message].join('|');
    if (lastAutoSpokenQuestionRef.current === questionKey) return undefined;
    lastAutoSpokenQuestionRef.current = questionKey;

    const timer = window.setTimeout(() => {
      speakPrompt(message, detLang);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [step, loading, interview?.assistant_message, interview?.question_number, detLang, speakPrompt]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true); setError(null);
    setLoadMsg('AI Computer Vision: Removing background & enhancing studio quality...');
    try {
      const d = await api.enhanceImage(file);
      clearQuestionFlow();
      setImgData(d);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setLoadMsg(''); }
  };

  const beginInterview = async () => {
    if (!imgData) return;
    voiceAssistant.prepareSpeech();
    setLoading(true); setError(null);
    setLoadMsg('Preparing your first simple question…');
    try {
      const result = await api.continueProductInterview({
        utterance: '',
        conversation_transcript: '',
        language: detLang,
        detected_objects: imgData?.detected_objects || [],
        known_attributes: {},
        cost_inputs: {},
        last_question_key: null,
      });
      setInterview(result);
      setAttrs(result.attributes);
      setCosts({ ...result.cost_inputs, production_time: result.attributes.production_time || '' });
      setInterviewTurns([{ role: 'assistant', text: result.assistant_message }]);
      setQuestionHistory([]);
      setTypedAnswer('');
      setPendingAnswer(null);
      setStep(2);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setLoadMsg(''); }
  };

  const captureVoiceAnswer = async (blob, filename, spokenText = null, spokenLanguage = null) => {
    setLoading(true); setError(null);
    setLoadMsg('Checking the words we heard…');
    try {
      let text = spokenText;
      let language = spokenLanguage || detLang;
      if (!text) {
        const result = await api.transcribeAudio(blob, language, filename);
        text = result.transcript;
        language = result.detected_language || language;
      }
      if (!String(text || '').trim()) throw new Error('We could not hear an answer. Please try again slowly.');
      setDetLang(language);
      setPendingAnswer({ text: String(text).trim(), language });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setLoadMsg(''); }
  };

  const submitInterviewAnswer = async (answerOverride = null, languageOverride = null) => {
    const text = String(answerOverride || pendingAnswer?.text || typedAnswer || '').trim();
    const lang = languageOverride || pendingAnswer?.language || detLang || 'Hindi';
    if (!text) return;
    voiceAssistant.prepareSpeech();
    setLoading(true); setError(null);
    setLoadMsg('Saving your answer and preparing the next step…');
    try {
      const previousTranscript = transcript;
      const fullTranscript = [previousTranscript, text].filter(Boolean).join('\n');
      setTxt(fullTranscript); setDetLang(lang);

      const result = await api.continueProductInterview({
        utterance: text,
        conversation_transcript: previousTranscript,
        language: lang,
        detected_objects: imgData?.detected_objects || [],
        known_attributes: attrs || {},
        cost_inputs: costs,
        last_question_key: interview?.next_question_key || null,
      });
      const mergedCosts = {
        ...result.cost_inputs,
        production_time: result.attributes.production_time || result.cost_inputs.production_time || '',
      };
      setQuestionHistory(history => [...history, {
        interview,
        attrs,
        costs,
        transcript: previousTranscript,
        interviewTurns,
        answer: text,
        language: lang,
      }]);
      setInterview(result);
      setAttrs(result.attributes);
      setCosts(mergedCosts);
      setInterviewTurns(turns => [...turns, { role: 'artisan', text }, { role: 'assistant', text: result.assistant_message }]);
      setTypedAnswer('');
      setPendingAnswer(null);

      if (result.status === 'ready_for_pricing') {
        setLoadMsg('Generating a verified bilingual marketplace listing...');
        const l = await api.generateListing(result.attributes, artisanName);
        setListing(l);
        setLoadMsg('Pricing AI: Blending confirmed costs with regional market benchmarks...');
        const pr = await api.calculatePrice({
          ...mergedCosts,
          category: result.attributes.category,
          craft_type: result.attributes.craft_type,
          material: result.attributes.material,
        });
        setPricing(pr);
        setStep(3);
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setLoadMsg(''); }
  };

  const goToPreviousQuestion = () => {
    voiceAssistant.stopSpeaking();
    setSpeaking(false);
    const previous = questionHistory[questionHistory.length - 1];
    if (!previous) {
      clearQuestionFlow();
      setStep(1);
      return;
    }
    setQuestionHistory(history => history.slice(0, -1));
    setInterview(previous.interview);
    setAttrs(previous.attrs);
    setCosts(previous.costs);
    setTxt(previous.transcript);
    setInterviewTurns(previous.interviewTurns);
    setDetLang(previous.language || detLang);
    setTypedAnswer(previous.answer || '');
    setPendingAnswer(null);
    lastAutoSpokenQuestionRef.current = '';
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!artisanId) {
      setError('No artisan profile is available. Create an artisan profile before submitting a listing.');
      return;
    }
    setLoading(true);
    setLoadMsg('Submitting to Admin Approval Queue...');
    try {
      const payload = {
        artisan_id: artisanId,
        original_image: imgData?.original_image_url || '/uploads/banarasi_saree_raw.jpg',
        enhanced_image: imgData?.enhanced_image_url || '/uploads/banarasi_saree_studio_enhanced.png',
        transcript, detected_language: detLang,
        product_name: attrs?.product_name || 'Handcrafted Artisan Item',
        category: attrs?.category || 'Handloom & Textiles',
        material: attrs?.material || 'Natural Fiber',
        craft_type: attrs?.craft_type || 'Handcrafted',
        color: attrs?.color || 'Natural',
        technique: attrs?.technique || 'Handmade',
        dimensions: attrs?.dimensions || 'Standard',
        production_time: attrs?.production_time || costs.production_time,
        region: attrs?.region || 'India',
        title: listing?.title_en || attrs?.product_name,
        title_hindi: listing?.title_hi,
        title_telugu: listing?.title_te,
        short_description: listing?.short_desc_en,
        short_description_hindi: listing?.short_desc_hi,
        short_description_telugu: listing?.short_desc_te,
        description: listing?.description_en,
        description_hindi: listing?.description_hi,
        description_telugu: listing?.description_te,
        specifications: listing?.specifications || [],
        keywords: listing?.keywords || [],
        material_cost: costs.material_cost,
        labor_cost: costs.labor_cost,
        packaging_cost: costs.packaging_cost,
        total_cost: pricing?.total_cost || (costs.material_cost + costs.labor_cost + costs.packaging_cost),
        minimum_price: pricing?.minimum_sustainable_price,
        recommended_min_price: pricing?.recommended_min_price,
        recommended_max_price: pricing?.recommended_max_price,
        pricing_explanation: pricing,
        suggested_price: pricing?.suggested_price || 2499,
        stock_quantity: stockQuantity,
        status: 'Pending Approval',
      };
      const result = await api.createProduct(payload);
      setProductId(result.id);
      setSubmitted(true);
      if (onProductCreated) onProductCreated(result);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setLoadMsg(''); }
  };

  const reset = () => {
    setStep(1); setImgData(null); setTxt(''); setAttrs(null); setListing(null); setPricing(null); setStockQuantity(1); setSubmitted(false); setProductId(null); setError(null);
    setCosts({ material_cost: null, labor_cost: null, packaging_cost: null, production_time: '' });
    setInterview(null); setInterviewTurns([]); setQuestionHistory([]); setTypedAnswer(''); setPendingAnswer(null);
  };

  // Success Screen
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-8 animate-fade-in">
        <div className="bg-white rounded-2xl border-2 border-green-200 shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-[22px] font-black text-gray-900 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Submitted for Admin Review!
          </h2>
          <p className="text-[13px] text-gray-500 max-w-md mx-auto mb-6">
            Your craft listing #CRF-{productId} has been sent to the Admin Approval Queue. Once approved, it will go live on the marketplace.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4 text-left mb-6">
            <div>
              <div className="text-[12px] font-bold text-amber-900">{attrs?.product_name || 'Your Craft Listing'}</div>
              <div className="text-[11px] text-amber-700">{attrs?.craft_type} · Request #{productId || 'NEW'}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] text-gray-500 uppercase font-bold">Fair Price</div>
              <div className="text-[18px] font-black text-green-700">₹{pricing?.suggested_price?.toLocaleString('en-IN') || '2,499'}</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button onClick={reset} className="px-6 py-2.5 rounded-xl border border-gray-200 text-[13px] font-bold text-gray-700 hover:bg-gray-50">
              + Add Another Listing
            </button>
            {onNavigateToAdmin && (
              <button onClick={onNavigateToAdmin} className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-[13px] font-bold hover:bg-gray-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Open Admin Portal
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── STEP PROGRESS HEADER ────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STEPS.map((s, idx) => {
            const done = step > s.n;
            const cur  = step === s.n && !submitted;
            return (
              <React.Fragment key={s.n}>
                <button
                  onClick={() => {
                    if (loading || step <= s.n) return;
                    if (s.n === 2) goToPreviousQuestion();
                    else setStep(s.n);
                  }}
                  disabled={step < s.n || loading}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                    cur  ? 'bg-orange-50 border border-orange-200 text-orange-700' :
                    done ? 'text-green-700 hover:bg-green-50' :
                           'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black flex-shrink-0 ${
                    done ? 'bg-green-500 text-white' :
                    cur  ? 'bg-orange-500 text-white' :
                           'bg-gray-200 text-gray-500'
                  }`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : s.n}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-[12px] font-bold">{s.label}</div>
                    <div className="text-[10px] text-gray-400 font-normal">{s.sub}</div>
                  </div>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`h-px flex-1 min-w-[20px] rounded-full ${step > s.n ? 'bg-green-300' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800 text-[13px]">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
          <button type="button" aria-label="Close error message" onClick={() => setError(null)} className="ml-auto rounded-md p-1 text-red-400 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm" role="status" aria-live="polite" aria-busy="true">
          <div className="w-14 h-14 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-[14px] font-bold text-gray-900 mb-1">{loadMsg || 'Processing...'}</p>
          <p className="text-[12px] text-gray-500">Please wait. We are preparing the next step for you.</p>
        </div>
      )}

      {/* ── STEP 1: IMAGE UPLOAD ─────────────────── */}
      {step === 1 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Upload Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Camera className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">First, add one product photo</h3>
                <p className="text-[12px] text-gray-500">Do not worry about the background. AI will clean it.</p>
              </div>
            </div>

            <label className="group block cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-all hover:border-orange-400 hover:bg-orange-50/30 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-100">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <div className="w-14 h-14 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </div>
              <p className="text-[14px] font-bold text-gray-700 mb-1">Tap here and choose a photo</p>
              <p className="text-[12px] text-gray-400">JPG, PNG or WebP — up to 15MB</p>
            </label>

            {imgData && (
              <div className="mt-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />
                  <div>
                    <div className="text-[14px] font-black text-emerald-900">Your photo is ready</div>
                    <p className="mt-0.5 text-[12px] text-emerald-800">Choose a language. Next, the assistant will ask only six simple questions.</p>
                  </div>
                </div>
                <label className="mt-4 block text-[11px] font-black uppercase tracking-wider text-emerald-800">Your language</label>
                <select
                  aria-label={questionUi.languageLabel}
                  value={SELLER_LANGUAGE_OPTIONS.find((item) => item.name === detLang)?.name || 'Hindi'}
                  onChange={(event) => setDetLang(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-emerald-300 bg-white px-3 py-3 text-[15px] font-bold text-gray-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {SELLER_LANGUAGE_OPTIONS.map((language) => (
                    <option key={language.name} value={language.name}>{language.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={beginInterview}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-[15px] font-black text-white shadow-md hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                >
                  Next: Answer simple questions <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 bg-black/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-white font-bold text-[13px]">AI Studio Enhancement Preview</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              {imgData ? (
                <BeforeAfterSlider
                  originalUrl={imgData.original_image_url}
                  enhancedUrl={imgData.enhanced_image_url}
                  title="Drag to compare"
                />
              ) : (
                <div className="max-w-xs py-12 text-center text-white">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                    <Sparkles className="h-8 w-8 text-amber-300" />
                  </div>
                  <p className="text-[15px] font-black">Your enhanced photo will appear here</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-slate-300">Choose your real product photo on the left. You can compare the original and improved versions before continuing.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: VOICE ────────────────────────── */}
      {step === 2 && !loading && (
        <div className="mx-auto max-w-3xl space-y-5" data-testid="guided-question-page">
          <section className="rounded-3xl border border-violet-200 bg-white p-5 shadow-md sm:p-7" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[17px] font-black text-violet-950">{questionUi.heading}</div>
                  <div className="text-[12px] font-bold text-violet-600">
                    {questionUi.question} {interview?.question_number || 1} {questionUi.of} {interview?.total_questions || 7}
                  </div>
                </div>
              </div>
              <span className="hidden rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-black text-violet-700 sm:block">
                {interview?.turn_summary || 'One answer at a time'}
              </span>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-violet-100">
              <div className="h-full rounded-full bg-violet-600 transition-all duration-500" style={{ width: `${Math.max(4, (interview?.readiness_score || 0) * 100)}%` }} />
            </div>

            <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-5 text-[17px] font-bold leading-relaxed text-slate-900 sm:text-[19px]" data-testid="current-question">
              {interview?.assistant_message || 'Tell us about your product in your own words.'}
            </div>
            <p className="mt-3 text-[12px] font-medium leading-relaxed text-violet-700">{questionUi.questionHelp}</p>

            <button
              type="button"
              aria-pressed={speaking}
              aria-busy={voiceLoading}
              onClick={() => {
                if (speaking || voiceLoading) {
                  voiceAssistant.stopSpeaking();
                  setSpeaking(false);
                  setVoiceLoading(false);
                } else {
                  speakPrompt(interview?.assistant_message, detLang);
                }
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-violet-300 bg-white px-4 py-3 text-[14px] font-black text-violet-800 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
            >
              {speaking || voiceLoading ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              {voiceLoading ? questionUi.preparingVoice : speaking ? questionUi.stopQuestion : questionUi.listenQuestion}
            </button>
          </section>

          {interview?.status === 'needs_confirmation' ? (
            <section className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 text-emerald-950 shadow-sm" aria-label="Confirm your answers">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />
                <div>
                  <h3 className="text-[15px] font-black">{questionUi.heard}</h3>
                  <p className="mt-1 text-[13px] font-medium leading-relaxed text-emerald-800">{questionUi.confirmationHelp}</p>
                </div>
              </div>
            </section>
          ) : (
            <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-[13px] font-bold text-slate-700">{questionUi.answerChoice}</p>
          )}

          {interview?.status !== 'needs_confirmation' && !pendingAnswer && (
            <VoiceRecorder
              onAudioRecorded={captureVoiceAnswer}
              isProcessing={loading}
              initialLanguage={speechCodeForLanguage(detLang)}
              onLanguageChange={(language) => setDetLang(language)}
              onRecordingStart={() => { setSpeaking(false); setVoiceLoading(false); }}
            />
          )}

          {interview?.status !== 'needs_confirmation' && (pendingAnswer ? (
            <div className="rounded-2xl border-2 border-emerald-300 bg-white p-4 shadow-sm">
              <div className="text-[12px] font-black uppercase tracking-wider text-emerald-700">{questionUi.heard}</div>
              <p className="mt-2 rounded-xl bg-emerald-50 p-3 text-[15px] font-semibold leading-relaxed text-gray-900">“{pendingAnswer.text}”</p>
              <p className="mt-2 text-[12px] text-gray-500">{questionUi.checkAnswer}</p>
              <button type="button" onClick={() => setPendingAnswer(null)} className="mt-3 rounded-xl border border-gray-300 px-4 py-2.5 text-[13px] font-bold text-gray-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200">
                {questionUi.recordAgain}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <label className="mb-2 block text-[12px] font-bold text-gray-600">{questionUi.orType}</label>
              <input
                aria-label={questionUi.orType}
                value={typedAnswer}
                onChange={e => setTypedAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && typedAnswer.trim()) submitInterviewAnswer(); }}
                placeholder={questionUi.placeholder}
                className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-[15px] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          ))}

          <nav className="grid grid-cols-2 gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm" aria-label="Question navigation">
            <button
              type="button"
              onClick={goToPreviousQuestion}
              className="flex min-w-0 items-center justify-center gap-2 rounded-xl border border-gray-300 px-3 py-3 text-[14px] font-black text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200 sm:px-5"
            >
              <ArrowLeft className="h-5 w-5" /> {questionUi.previous}
            </button>
            <button
              type="button"
              onClick={() => {
                if (interview?.status === 'needs_confirmation') {
                  submitInterviewAnswer(confirmationAnswerForLanguage(detLang), detLang);
                } else {
                  submitInterviewAnswer();
                }
              }}
              disabled={interview?.status !== 'needs_confirmation' && !pendingAnswer?.text && !typedAnswer.trim()}
              className="flex min-w-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-3 text-[14px] font-black text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
            >
              <span>{interview?.status === 'needs_confirmation' ? questionUi.confirm : questionUi.next}</span> <ArrowRight className="h-5 w-5 flex-shrink-0" />
            </button>
          </nav>
        </div>
      )}

      {/* ── STEP 3 & 4: REVIEW + PRICING ──────────── */}
      {(step === 3 || step === 4) && !loading && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <h3 className="text-[16px] font-black text-blue-950">Check your product details</h3>
            <p className="mt-1 text-[12px] font-medium text-blue-800">Nothing is submitted yet. Read the details below and use Edit if anything needs changing.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Left: Image + Transcript */}
            <div className="space-y-4">
              {imgData && <div className="bg-gray-900 rounded-2xl overflow-hidden"><BeforeAfterSlider originalUrl={imgData.original_image_url} enhancedUrl={imgData.enhanced_image_url} /></div>}

              {/* Transcript box */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-orange-500" />
                    <span className="text-[13px] font-bold text-gray-900">Artisan Voice Transcript ({detLang})</span>
                  </div>
                  <button
                    onClick={() => {
                      if (speaking) { voiceAssistant.stopSpeaking?.(); setSpeaking(false); }
                      else { setSpeaking(true); voiceAssistant.speak?.(transcript, speechCodeForLanguage(detLang), () => setSpeaking(false)); }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    {speaking ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-blue-600" />}
                    {speaking ? 'Stop' : 'Play'}
                  </button>
                </div>
                <p className="text-[12px] text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3 italic leading-relaxed">
                  "{transcript || 'Voice description will appear here.'}"
                </p>
              </div>

              {/* AI Guarantee */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[12px] font-bold text-green-900 mb-0.5">Based only on your answers</div>
                  <p className="text-[11px] text-green-700 leading-normal">
                    These details come from your confirmed voice answers and product photo. The assistant does not add unsupported claims.
                  </p>
                  {interview?.human_confirmed && <p className="mt-1 text-[11px] font-black text-green-800">99% human-verified product understanding confidence</p>}
                </div>
              </div>
            </div>

            {/* Right: Attributes + Listing */}
            <div className="space-y-4">

              {/* Attributes card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Tag className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-gray-900">AI Product Understanding</h4>
                      <p className="text-[11px] text-gray-400">Extracted structured metadata</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {editMode ? 'Save' : 'Edit'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  {[
                    ['Your Description', 'artisan_description'],
                    ['Product Name', 'product_name'],
                    ['Craft Type', 'craft_type'],
                    ['Material', 'material'],
                    ['Technique', 'technique'],
                    ['Dimensions', 'dimensions'],
                    ['Production Time', 'production_time'],
                    ['Region / Origin', 'region'],
                    ['Color', 'color'],
                  ].map(([label, key]) => (
                    <div key={key} className={`bg-gray-50 border border-gray-200 rounded-xl p-2.5 ${key === 'artisan_description' ? 'col-span-2' : ''}`}>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</span>
                      {editMode ? (
                        <input
                          type="text"
                          value={attrs?.[key] || ''}
                          onChange={e => setAttrs(a => ({ ...a, [key]: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1 text-[12px] text-gray-900 outline-none focus:border-orange-400"
                        />
                      ) : (
                        <span className="font-semibold text-gray-900">{attrs?.[key] || '—'}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Listing Preview */}
              {listing && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <h4 className="text-[14px] font-bold text-gray-900">Generated Marketplace Listing</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex bg-gray-100 rounded-lg p-0.5">
                        {['en', 'hi', 'te'].map(l => (
                          <button key={l} onClick={() => setListLang(l)} className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${listLang === l ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>
                            {l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी' : 'తెలుగు'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-[12px]">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">E-Commerce Title</span>
                      <h5 className="font-bold text-gray-900 mt-0.5 leading-snug text-[13px]">
                        {listLang === 'en' ? listing.title_en : listLang === 'hi' ? listing.title_hi : listing.title_te}
                      </h5>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Short Summary</span>
                      <p className="text-gray-600 mt-0.5 leading-relaxed">
                        {listLang === 'en' ? listing.short_desc_en : listLang === 'hi' ? listing.short_desc_hi : listing.short_desc_te}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Full Product Description</span>
                      <p className="mt-0.5 whitespace-pre-line rounded-xl bg-gray-50 p-3 leading-relaxed text-gray-700">
                        {listLang === 'en' ? listing.description_en : listLang === 'hi' ? listing.description_hi : listing.description_te}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">SEO Keywords</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {listing.keywords?.map((kw, i) => (
                          <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium">#{kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Smart Pricing */}
          {step === 4 && (
            <div className="space-y-4">
              <PriceExplainerCard pricingData={pricing} onUpdateCost={async (c) => {
                setCosts(c);
                try { const pr = await api.calculatePrice({ ...c, category: attrs?.category, craft_type: attrs?.craft_type, material: attrs?.material }); setPricing(pr); } catch (e) {}
              }} currentCosts={costs} />
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <label htmlFor="listing-stock" className="block text-[12px] font-black text-slate-800">Units currently available for sale</label>
                <p className="mt-1 text-[11px] text-slate-500">Orders cannot sell more than this real stock quantity.</p>
                <input
                  id="listing-stock"
                  type="number"
                  min="1"
                  max="100000"
                  value={stockQuantity}
                  onChange={(event) => setStockQuantity(Math.max(1, Number(event.target.value || 1)))}
                  className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-[15px] font-black outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button onClick={() => { if (step === 4) setStep(3); else goToPreviousQuestion(); }} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-4 h-4" /> {step === 4 ? 'Back to Details' : 'Back to Questions'}
            </button>
            {step === 3 ? (
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-[14px] font-black text-white shadow-lg hover:bg-emerald-700"
              >
                Details look good — Next to Price <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-black text-[14px] shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316, #ef4444)' }}
              >
                <Send className="w-4 h-4" />
                Send for Review
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
