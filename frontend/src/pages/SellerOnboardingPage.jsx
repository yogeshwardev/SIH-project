import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CreditCard,
  MapPin,
  FileCheck,
  Store,
  Truck,
  Award,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function SellerOnboardingPage({ onCompleteOnboarding, onCancel }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    owner_name: 'Master Weaver Ramesh',
    store_name: 'Varanasi Master Weavers Guild',
    email: 'ramesh.varanasi@craftlink.in',
    phone: '+91 98765 11223',
    craft_category: 'Handloom & Textiles',
    region: 'Varanasi, Uttar Pradesh',
    artisan_card_number: 'IND-PEHCHAN-2026-8842',
    pan_or_gst: '09AAACG1234F1Z5',
    bank_name: 'State Bank of India',
    bank_account: '98765432101234',
    ifsc_code: 'SBIN0001234',
    address: 'Bunkar Colony, Chowk Varanasi',
    pincode: '221001',
  });

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.registerSeller(formData);
      onCompleteOnboarding?.(res.user);
    } catch (err) {
      setError(err.message || 'Onboarding failed. Please review your details.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] py-10 px-4 sm:px-6 lg:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-3xl mx-auto">
        
        {/* Top Header Banner */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-orange-800 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  National Producer Network
                </span>
                <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                  0% Commission
                </span>
              </div>
              <h1 className="text-xl font-black text-gray-900 mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Sell on CraftLink — Master Artisan Store Onboarding
              </h1>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Cancel & Exit
            </button>
          )}
        </div>

        {/* Step Progress Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-4 gap-2">
            {[
              { n: 1, title: 'Store Details', sub: 'Artisan info' },
              { n: 2, title: 'Artisan Pehchan', sub: 'Govt. Verification' },
              { n: 3, title: 'Bank Account', sub: '100% Payouts' },
              { n: 4, title: 'Pickup Address', sub: 'Logistics hub' },
            ].map(s => {
              const active = step === s.n;
              const done = step > s.n;
              return (
                <button
                  key={s.n}
                  onClick={() => step > s.n && setStep(s.n)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                    active ? 'bg-orange-50 border border-orange-200' :
                    done ? 'bg-green-50/50 border border-green-200 text-green-800' :
                    'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    done ? 'bg-green-600 text-white' :
                    active ? 'bg-orange-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {done ? '✓' : s.n}
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <div className="text-xs font-bold text-gray-900 truncate">{s.title}</div>
                    <div className="text-[10px] text-gray-400 truncate">{s.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: STORE & ARTISAN IDENTITY ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 animate-fade-in space-y-4">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Step 1: Artisan Store & Guild Identification
              </h2>
              <p className="text-xs text-gray-500">Provide the commercial name of your studio or producer collective.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Master Artisan / Business Owner Name *</label>
                <input
                  type="text"
                  value={formData.owner_name}
                  onChange={(e) => handleChange('owner_name', e.target.value)}
                  className="input-field"
                  placeholder="e.g. Ramesh Kumar"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Store / Guild Commercial Name *</label>
                <input
                  type="text"
                  value={formData.store_name}
                  onChange={(e) => handleChange('store_name', e.target.value)}
                  className="input-field"
                  placeholder="e.g. Varanasi Weavers Hub"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="input-field"
                  placeholder="e.g. ramesh@varanasiguild.in"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Contact (WhatsApp enabled) *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="input-field"
                  placeholder="+91 98765 00000"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Primary Craft Specialization *</label>
                <select
                  value={formData.craft_category}
                  onChange={(e) => handleChange('craft_category', e.target.value)}
                  className="input-field"
                >
                  <option value="Handloom & Textiles">Handloom & Textiles (Silk, Sarees, Shawls)</option>
                  <option value="Pottery & Ceramics">Pottery & Ceramics (Blue Pottery, Terracotta)</option>
                  <option value="Woodcraft & Carving">Woodcraft & Wooden Toys (Channapatna, Saharanpur)</option>
                  <option value="Metal Craft & Bell Metal">Metal Craft & Bell Metal (Dhokra, Moradabad)</option>
                  <option value="Cane & Bamboo">Cane & Bamboo Crafts (Assam, Tripura)</option>
                  <option value="Traditional Paintings">Traditional Paintings (Madhubani, Warli, Pattachitra)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cluster / Geographic Origin *</label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => handleChange('region', e.target.value)}
                  className="input-field"
                  placeholder="e.g. Varanasi, Uttar Pradesh"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={() => setStep(2)}
                className="btn-primary flex items-center gap-2"
              >
                <span>Continue to Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: ARTISAN PEHCHAN & GOVT ID ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 animate-fade-in space-y-4">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Step 2: Government Artisan Pehchan & Quality Verification
              </h2>
              <p className="text-xs text-gray-500">Fast-track direct marketplace publishing with verified artisan registration.</p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <Award className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <span className="font-bold block mb-0.5">Government GI & Artisan Pehchan Recognition</span>
                Verified Pehchan cardholders get 0% marketplace commission, subsidized logistics, and verified producer trust badges on product pages.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Artisan Pehchan Card / SHG Number</label>
                <input
                  type="text"
                  value={formData.artisan_card_number}
                  onChange={(e) => handleChange('artisan_card_number', e.target.value)}
                  className="input-field font-mono"
                  placeholder="e.g. IND-PEHCHAN-2026-8842"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">PAN or GSTIN (Optional for Handloom)</label>
                <input
                  type="text"
                  value={formData.pan_or_gst}
                  onChange={(e) => handleChange('pan_or_gst', e.target.value)}
                  className="input-field font-mono"
                  placeholder="e.g. 09AAACG1234F1Z5 or PAN"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="btn-primary flex items-center gap-2"
              >
                <span>Continue to Bank Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: BANK DETAILS ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 animate-fade-in space-y-4">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Step 3: Direct Bank Settlement Account
              </h2>
              <p className="text-xs text-gray-500">100% of customer order amounts are settled directly via NEFT within 24 hours.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                  className="input-field"
                  placeholder="e.g. State Bank of India"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  value={formData.bank_account}
                  onChange={(e) => handleChange('bank_account', e.target.value)}
                  className="input-field font-mono"
                  placeholder="98765432101234"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">IFSC Code *</label>
                <input
                  type="text"
                  value={formData.ifsc_code}
                  onChange={(e) => handleChange('ifsc_code', e.target.value)}
                  className="input-field font-mono uppercase"
                  placeholder="SBIN0001234"
                  required
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => setStep(2)}
                className="btn-secondary flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(4)}
                className="btn-primary flex items-center gap-2"
              >
                <span>Continue to Pickup Address</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: PICKUP ADDRESS & CONFIRMATION ── */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 animate-fade-in space-y-4">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Step 4: Artisan Workshop Pickup Address
              </h2>
              <p className="text-xs text-gray-500">Logistics couriers will collect packed craft items directly from this address.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Workshop / Guild Street Address *</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="input-field"
                  placeholder="e.g. Bunkar Colony, Chowk, Varanasi"
                  required
                />
              </div>

              <div className="w-full sm:w-1/2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  className="input-field font-mono"
                  placeholder="221001"
                  required
                />
              </div>

              {/* Summary Box */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-gray-900 border-b border-gray-200 pb-1">Onboarding Summary</div>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <div><strong>Store:</strong> {formData.store_name}</div>
                  <div><strong>Master Artisan:</strong> {formData.owner_name}</div>
                  <div><strong>Craft:</strong> {formData.craft_category}</div>
                  <div><strong>Cluster:</strong> {formData.region}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => setStep(3)}
                className="btn-secondary flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Activating Store...' : 'Complete Registration & Open Seller Central'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
