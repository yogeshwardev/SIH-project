import React, { useState } from 'react';
import { 
  Check, 
  X, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  MapPin, 
  Smartphone, 
  ChevronRight,
  ArrowRight,
  Package,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { api } from '../services/api';

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  items = [], 
  onOrderCompleted 
}) {
  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderIds, setCreatedOrderIds] = useState([]);

  // Form States
  const [address, setAddress] = useState({
    name: 'Yogeshwar Dev',
    phone: '+91 98765 43210',
    pincode: '110001',
    house: 'Plot 42, Green Park Avenue',
    street: 'Outer Ring Road, Near Metro Station',
    city: 'New Delhi',
    state: 'Delhi',
    type: 'Home'
  });

  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'netbanking', 'cod'
  const [upiId, setUpiId] = useState('yogeshwar@okhdfcbank');

  if (!isOpen || items.length === 0) return null;

  const subtotal = items.reduce((sum, item) => sum + (item.price || item.suggested_price || 2499) * (item.quantity || 1), 0);
  const shippingFee = 0; // Free with Prime
  const taxGst = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + taxGst;

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    try {
      const placedIds = [];
      for (const item of items) {
        const res = await api.createInquiry({
          product_id: item.id,
          buyer_name: address.name,
          buyer_email: 'buyer.orders@craftlink.in',
          buyer_phone: address.phone,
          buyer_city: `${address.city}, ${address.state} (${address.pincode})`,
          order_type: `Commercial Checkout (${paymentMethod.toUpperCase()})`,
          quantity: item.quantity || 1,
          total_amount: (item.price || item.suggested_price || 2499) * (item.quantity || 1),
          message: `Delivery Address: ${address.house}, ${address.street}, ${address.city} - ${address.pincode}. Payment: ${paymentMethod.toUpperCase()}`
        });
        placedIds.push(res.id);
      }

      setCreatedOrderIds(placedIds);
      setStep(3); // Go to Order Success Screen
      if (onOrderCompleted) {
        onOrderCompleted(placedIds);
      }
    } catch (err) {
      alert('Order placement error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 font-sans animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 text-slate-800">
        
        {/* Checkout Header */}
        <div className="bg-[#131921] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-lg text-white">CraftLink<span className="text-amber-400">.in</span></span>
            <span className="text-slate-400 text-sm font-semibold">| Secure Checkout</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>

        {/* Multi-Step Indicator */}
        {step < 3 && (
          <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
            <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-[#c45500]' : 'text-emerald-700'}`}>
              <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-[11px]">1</span>
              <span>1. Delivery Address</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-[#c45500]' : 'text-slate-400'}`}>
              <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-[11px]">2</span>
              <span>2. Payment & Review</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-[11px]">3</span>
              <span>3. Confirmation</span>
            </div>
          </div>
        )}

        {/* STEP 1: ADDRESS */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#c45500]" />
              <span>Select / Enter Delivery Address</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number (For Delivery Updates)</label>
                <input
                  type="text"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Flat, House no., Building, Apartment</label>
                <input
                  type="text"
                  value={address.house}
                  onChange={(e) => setAddress({ ...address, house: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Area, Street, Sector, Village</label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Town / City</label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>

              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-full bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span>Use this Address & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PAYMENT & ORDER SUMMARY */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#c45500]" />
              <span>Select a Payment Method</span>
            </h3>

            {/* Payment Options */}
            <div className="space-y-2.5 text-xs">
              
              {/* UPI Option */}
              <label className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-colors ${
                paymentMethod === 'upi' ? 'border-[#ffd814] bg-amber-50/40' : 'border-slate-200 bg-white'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="mt-1 accent-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between font-extrabold text-slate-900">
                    <span>UPI (Google Pay, PhonePe, Paytm, BHIM)</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                      Instant & Zero Surcharge
                    </span>
                  </div>
                  {paymentMethod === 'upi' && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold w-64"
                        placeholder="Enter your UPI ID (e.g. mobile@upi)"
                      />
                      <span className="text-[11px] text-emerald-700 font-bold">✓ Verified</span>
                    </div>
                  )}
                </div>
              </label>

              {/* Card Option */}
              <label className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-colors ${
                paymentMethod === 'card' ? 'border-[#ffd814] bg-amber-50/40' : 'border-slate-200 bg-white'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="mt-1 accent-amber-500"
                />
                <div className="flex-1">
                  <span className="font-extrabold text-slate-900 block">Credit or Debit Card</span>
                  <span className="text-slate-500 text-[11px]">Visa, MasterCard, RuPay, Maestro</span>
                </div>
              </label>

              {/* COD Option */}
              <label className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-colors ${
                paymentMethod === 'cod' ? 'border-[#ffd814] bg-amber-50/40' : 'border-slate-200 bg-white'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 accent-amber-500"
                />
                <div className="flex-1">
                  <span className="font-extrabold text-slate-900 block">Cash on Delivery / Pay on Delivery</span>
                  <span className="text-slate-500 text-[11px]">Pay via cash or UPI at the doorstep</span>
                </div>
              </label>

            </div>

            {/* Order Price Breakdown Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span>Items Subtotal ({items.length} artisan crafts):</span>
                <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span>Cluster Direct Insured Shipping:</span>
                <span className="font-extrabold text-emerald-700">FREE</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span>Applicable GST (5% Handloom & Craft):</span>
                <span>₹{taxGst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-200">
                <span>Order Total:</span>
                <span className="text-xl text-[#c45500]">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                ← Back to Address
              </button>

              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-full bg-[#ffa41c] hover:bg-[#fa8900] text-slate-950 font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Placing Order...' : `Place Your Order in ₹${grandTotal.toLocaleString('en-IN')}`}
              </button>
            </div>

          </div>
        )}

        {/* STEP 3: ORDER SUCCESS & TRACKING */}
        {step === 3 && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <Check className="w-9 h-9 stroke-[3]" />
            </div>

            <h2 className="text-2xl font-black text-slate-900">
              Order Placed Successfully!
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you, <strong>{address.name}</strong>! An email confirmation has been sent with your invoice. Your order has been routed to the master artisan cluster for packaging.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">Order ID:</span>
                <span className="font-extrabold text-slate-900">#CRF-{createdOrderIds[0] || '88392'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">Estimated Delivery:</span>
                <span className="font-extrabold text-emerald-700">Friday by 8:00 PM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Deliver To:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[220px]">{address.house}, {address.city}</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-8 py-2.5 rounded-full bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-black text-xs shadow-sm"
              >
                Continue Shopping
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
