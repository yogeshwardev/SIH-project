import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  Phone,
  User,
  ArrowRight,
  CheckCircle2,
  Store,
  MapPin,
  FileCheck,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({
  isOpen,
  onClose,
  initialTab = 'buyer', // 'buyer', 'seller', 'admin'
  onLoginSuccess,
  onNavigateToSellerOnboarding,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Buyer Form
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerPassword, setBuyerPassword] = useState('');

  // Seller Form - all empty, user must fill in their own real details
  const [sellerOwnerName, setSellerOwnerName] = useState('');
  const [sellerStoreName, setSellerStoreName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerCategory, setSellerCategory] = useState('Handloom & Textiles');
  const [sellerRegion, setSellerRegion] = useState('');

  // Admin Form - empty by default, no pre-filled demo credentials
  const [adminId, setAdminId] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [officerName, setOfficerName] = useState('');

  if (!isOpen) return null;

  const handleBuyerAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegisterMode) {
        if (!buyerName.trim() || !buyerEmail.trim() || !buyerPassword.trim()) {
          setError('Please fill in your name, email/phone, and password.');
          setLoading(false);
          return;
        }
        const res = await api.registerBuyer({
          name: buyerName.trim(),
          email: buyerEmail.trim(),
          phone: buyerPhone.trim() || undefined,
          password: buyerPassword,
          pincode: '110001',
          city: 'India'
        });
        setSuccessMsg('Account created! Welcome to CraftLink.');
        setTimeout(() => {
          onLoginSuccess?.(res.user, 'buyer');
          onClose();
        }, 1000);
      } else {
        if (!buyerEmail.trim() || !buyerPassword.trim()) {
          setError('Please enter your email/phone and password.');
          setLoading(false);
          return;
        }
        const res = await api.login({
          email_or_phone: buyerEmail.trim(),
          password: buyerPassword,
          role: 'buyer'
        });
        setSuccessMsg(`Welcome back, ${res.user.name}!`);
        setTimeout(() => {
          onLoginSuccess?.(res.user, 'buyer');
          onClose();
        }, 800);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSellerQuickRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!sellerOwnerName.trim() || !sellerStoreName.trim() || !sellerPhone.trim()) {
      setError('Please fill in all required fields to register your store.');
      setLoading(false);
      return;
    }
    try {
      const res = await api.registerSeller({
        owner_name: sellerOwnerName.trim(),
        store_name: sellerStoreName.trim(),
        email: sellerEmail.trim() || undefined,
        phone: sellerPhone.trim(),
        craft_category: sellerCategory,
        region: sellerRegion.trim(),
        kyc_status: 'Pending'
      });
      setSuccessMsg('Seller Store Created! Redirecting to Seller Central...');
      setTimeout(() => {
        onLoginSuccess?.(res.user, 'seller');
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Seller onboarding failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminLogin({
        admin_id: adminId,
        access_key: adminKey,
        officer_name: officerName
      });
      setSuccessMsg('Clearance Verified: Welcome, Director Anand Varma.');
      setTimeout(() => {
        onLoginSuccess?.(res.user, 'admin');
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const quickFillBuyer = (email, name) => {
    setBuyerEmail(email);
    setBuyerName(name);
    setBuyerPhone('+91 98765 43210');
    setBuyerPassword('password123');
  };

  const quickFillSeller = (owner, store, cat, region) => {
    setSellerOwnerName(owner);
    setSellerStoreName(store);
    setSellerEmail(`${store.toLowerCase().replace(/[^a-z0-9]/g, '')}@craftlink.in`);
    setSellerPhone('+91 98765 88990');
    setSellerCategory(cat);
    setSellerRegion(region);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#131921] px-6 py-4 flex items-center justify-between text-white border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-black text-lg text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>CraftLink</span>
                <span className="text-amber-400 font-bold text-sm">Account</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">National Direct Artisan Marketplace & Producer Network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('buyer'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'buyer'
                ? 'bg-white text-gray-900 border-[#FF9900] shadow-sm'
                : 'text-gray-500 border-transparent hover:text-gray-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Buyer Account</span>
          </button>

          <button
            onClick={() => { setActiveTab('seller'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'seller'
                ? 'bg-white text-orange-700 border-[#FF9900] shadow-sm'
                : 'text-gray-500 border-transparent hover:text-orange-600'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Sell on CraftLink</span>
          </button>

          <button
            onClick={() => { setActiveTab('admin'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'admin'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                : 'text-gray-500 border-transparent hover:text-emerald-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          
          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB 1: BUYER AUTH
          ══════════════════════════════════════ */}
          {activeTab === 'buyer' && (
            <div>
              <div className="mb-4">
                <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {isRegisterMode ? 'Create Buyer Account' : 'Sign in to CraftLink'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isRegisterMode
                    ? 'Track orders, save handcrafted favorites, and checkout directly.'
                    : 'Access your orders, wishlist, and fast 1-click checkout.'}
                </p>
              </div>

              <form onSubmit={handleBuyerAuth} className="space-y-3">
                {isRegisterMode && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Your Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="e.g. Priya Sharma"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-[#FF9900] bg-gray-50/50"
                        required={isRegisterMode}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Email or Mobile Number</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. priya@example.com or 9876543210"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-[#FF9900] bg-gray-50/50"
                      required
                    />
                  </div>
                </div>

                {isRegisterMode && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-[#FF9900] bg-gray-50/50"
                        required={isRegisterMode}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={buyerPassword}
                      onChange={(e) => setBuyerPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-[#FF9900] bg-gray-50/50"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] font-bold text-xs text-gray-900 shadow transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? 'Authenticating...' : isRegisterMode ? 'Create Your Account' : 'Sign In'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Switch mode */}
              <div className="mt-4 text-center text-xs text-gray-500">
                {isRegisterMode ? (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsRegisterMode(false)}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    New to CraftLink?{' '}
                    <button
                      type="button"
                      onClick={() => setIsRegisterMode(true)}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Create your account
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB 2: SELLER REGISTRATION & LOGIN
          ══════════════════════════════════════ */}
          {activeTab === 'seller' && (
            <div>
              <div className="mb-4">
                <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5">
                  <Building2 className="w-3 h-3" />
                  0% Commission · 100% Direct Payouts
                </div>
                <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {isRegisterMode ? 'Create Your Artisan Store' : 'Sign In to Seller Central'}
                </h3>
                <p className="text-xs text-gray-500">
                  {isRegisterMode
                    ? 'Launch your online artisan store with AI voice cataloging.'
                    : 'Access your seller dashboard, orders, and inventory.'}
                </p>
              </div>

              {/* Sign In Mode */}
              {!isRegisterMode && (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  setError(null);
                  if (!sellerEmail.trim() || !sellerPhone.trim()) {
                    setError('Please enter your registered email or phone number.');
                    setLoading(false);
                    return;
                  }
                  try {
                    const res = await api.login({
                      email_or_phone: sellerEmail.trim() || sellerPhone.trim(),
                      password: sellerPhone.trim(),
                      role: 'seller'
                    });
                    setSuccessMsg(`Welcome back, ${res.user?.store_name || res.user?.name}!`);
                    setTimeout(() => { onLoginSuccess?.(res.user, 'seller'); onClose(); }, 800);
                  } catch (err) {
                    setError(err.message || 'Sign in failed. Please check your details.');
                  } finally { setLoading(false); }
                }} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Registered Email or Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. ramesh@example.com or 9876500000"
                      value={sellerEmail}
                      onChange={(e) => setSellerEmail(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-orange-500 bg-gray-50/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Password / OTP</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-orange-500 bg-gray-50/50"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-xs text-white shadow transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? 'Signing in...' : 'Sign In to Seller Central'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* Register Mode */}
              {isRegisterMode && (
                <form onSubmit={handleSellerQuickRegister} className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Artisan / Owner Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        value={sellerOwnerName}
                        onChange={(e) => setSellerOwnerName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-orange-500 bg-gray-50/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Store / Guild Name</label>
                      <input
                        type="text"
                        placeholder="e.g. My Artisan Store"
                        value={sellerStoreName}
                        onChange={(e) => setSellerStoreName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-orange-500 bg-gray-50/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        placeholder="+91 98765 00000"
                        value={sellerPhone}
                        onChange={(e) => setSellerPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-orange-500 bg-gray-50/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Craft Specialization</label>
                      <select
                        value={sellerCategory}
                        onChange={(e) => setSellerCategory(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-orange-500 bg-gray-50/50"
                      >
                        <option value="Handloom & Textiles">Handloom & Textiles</option>
                        <option value="Pottery & Ceramics">Pottery & Ceramics</option>
                        <option value="Woodcraft & Carving">Woodcraft & Carving</option>
                        <option value="Metal Craft & Bell Metal">Metal Craft & Bell Metal</option>
                        <option value="Cane & Bamboo">Cane & Bamboo</option>
                        <option value="Traditional Paintings">Traditional Paintings</option>
                        <option value="Leather Craft">Leather Craft</option>
                        <option value="Stone Carving">Stone Carving</option>
                        <option value="Jewelry & Accessories">Jewelry & Accessories</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Email (optional)</label>
                      <input
                        type="email"
                        placeholder="store@example.com"
                        value={sellerEmail}
                        onChange={(e) => setSellerEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-orange-500 bg-gray-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Region / Cluster</label>
                      <input
                        type="text"
                        placeholder="e.g. Varanasi, UP"
                        value={sellerRegion}
                        onChange={(e) => setSellerRegion(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-orange-500 bg-gray-50/50"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-xs text-white shadow transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? 'Creating Store...' : 'Create Store & Open Seller Central'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* Sign In / Register Toggle */}
              <div className="mt-4 text-center text-xs text-gray-500 border-t border-gray-100 pt-3">
                {isRegisterMode ? (
                  <span>
                    Already have a seller account?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsRegisterMode(false); setError(null); }}
                      className="text-orange-600 font-bold hover:underline"
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    New seller?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsRegisterMode(true); setError(null); }}
                      className="text-orange-600 font-bold hover:underline"
                    >
                      Register your store
                    </button>
                  </span>
                )}
              </div>

              {onNavigateToSellerOnboarding && (
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => { onClose(); onNavigateToSellerOnboarding(); }}
                    className="text-xs text-orange-600 font-bold hover:underline"
                  >
                    Need full GST/KYC onboarding? →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB 3: ADMIN GOVERNANCE LOGIN
          ══════════════════════════════════════ */}
          {activeTab === 'admin' && (
            <div>
              <div className="mb-4">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  National Regulatory Directorate Access
                </div>
                <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Government & Compliance Officer Login
                </h3>
                <p className="text-xs text-gray-500">
                  Restricted access for catalog verification, GI certification review & artisan subsidy management.
                </p>
              </div>

              <form onSubmit={handleAdminAuth} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Officer Government ID</label>
                  <input
                    type="text"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-emerald-600 bg-gray-50/50 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Designated Officer Name</label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-emerald-600 bg-gray-50/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Secure Directorate Key</label>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-emerald-600 bg-gray-50/50 font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-gray-900 hover:bg-black font-bold text-xs text-white shadow transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-4"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {loading ? 'Verifying Credentials...' : 'Authenticate & Enter Admin Portal'}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
