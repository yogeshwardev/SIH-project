import React, { useState, useEffect } from 'react';
import AmazonHeader from './components/AmazonHeader';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import SellerPortalPage from './pages/SellerPortalPage';
import AdminPortalPage from './pages/AdminPortalPage';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import { api } from './services/api';
import { MapPin, Sparkles, Truck, ShieldCheck, RotateCcw, Phone } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab]         = useState('buyer');
  const [userPincode, setUserPincode]     = useState('110001');
  const [pincodeInput, setPincodeInput]   = useState('110001');
  const [showPincodeModal, setShowPincodeModal] = useState(false);

  // Search
  const [searchTerm, setSearchTerm]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Cart state
  const [cartItems, setCartItems]         = useState([]);
  const [isCartOpen, setIsCartOpen]       = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen]   = useState(false);
  const [pendingAdminCount, setPendingAdminCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // One-time fetch on mount
    api.getPendingProducts?.()
      .then(data => { if (!cancelled) setPendingAdminCount(data?.length || 0); })
      .catch(() => {});
    // Poll every 60 seconds (not 10) to avoid hammering the backend
    const interval = setInterval(() => {
      if (!cancelled) {
        api.getPendingProducts?.()
          .then(data => { if (!cancelled) setPendingAdminCount(data?.length || 0); })
          .catch(() => {});
      }
    }, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Cart operations
  const handleAddToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id
          ? { ...i, quantity: (i.quantity || 1) + (product.quantity || 1) }
          : i
        );
      }
      return [...prev, { ...product, quantity: product.quantity || 1 }];
    });
    setIsCartOpen(true);
  };

  const handleBuyNow = (product) => {
    handleAddToCart(product);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleUpdateQuantity = (id, qty) => {
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const handleRemoveItem = (id) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const handleOrderCompleted = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + (i.price || i.suggested_price || 2499) * (i.quantity || 1), 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#f3f4f6' }}>

      {/* HEADER */}
      <AmazonHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearch={() => setActiveTab('buyer')}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        userPincode={userPincode}
        onOpenPincodeModal={() => setShowPincodeModal(true)}
        pendingAdminCount={pendingAdminCount}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {activeTab === 'buyer' && (
          <BuyerDashboardPage
            onAddToCart={handleAddToCart}
            onOpenCart={() => setIsCartOpen(true)}
            onBuyNow={handleBuyNow}
          />
        )}
        {activeTab === 'seller' && (
          <SellerPortalPage
            onNavigateToAdmin={() => setActiveTab('admin')}
            onNavigateToStore={() => setActiveTab('buyer')}
          />
        )}
        {activeTab === 'admin' && (
          <AdminPortalPage
            onNavigateToMarketplace={() => setActiveTab('buyer')}
          />
        )}
      </main>

      {/* ═══ AMAZON-STYLE FOOTER ══════════════════════ */}
      <footer style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* Back to Top */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-full bg-[#37475a] hover:bg-[#485769] text-white text-[13px] font-semibold py-3 transition-colors"
        >
          Back to top
        </button>

        {/* 4-Col Footer Links */}
        <div className="bg-[#232f3e] text-white">
          <div className="max-w-[1400px] mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">

            <div>
              <h5 className="font-bold text-[14px] mb-4">Get to Know Us</h5>
              <ul className="space-y-2 text-[13px] text-gray-300">
                <li className="hover:text-white cursor-pointer">About CraftLink</li>
                <li className="hover:text-white cursor-pointer">Artisan Impact Stories</li>
                <li className="hover:text-white cursor-pointer">Ministry of Social Justice</li>
                <li className="hover:text-white cursor-pointer">Careers</li>
                <li className="hover:text-white cursor-pointer">Press & Media</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-[14px] mb-4">Make Money With Us</h5>
              <ul className="space-y-2 text-[13px] text-gray-300">
                <li
                  onClick={() => setActiveTab('seller')}
                  className="hover:text-amber-400 cursor-pointer font-semibold text-amber-300"
                >
                  Sell on CraftLink (Free)
                </li>
                <li className="hover:text-white cursor-pointer">Register an Artisan Guild</li>
                <li className="hover:text-white cursor-pointer">Supply to Govt Clusters</li>
                <li className="hover:text-white cursor-pointer">ONDC Network Partnership</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-[14px] mb-4">Payment & Delivery</h5>
              <ul className="space-y-2 text-[13px] text-gray-300">
                <li className="hover:text-white cursor-pointer">UPI, Cards, Netbanking, COD</li>
                <li className="hover:text-white cursor-pointer">Cluster Direct Shipping</li>
                <li className="hover:text-white cursor-pointer">Track Your Order</li>
                <li className="hover:text-white cursor-pointer">Delivery Speed Options</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-[14px] mb-4">Let Us Help You</h5>
              <ul className="space-y-2 text-[13px] text-gray-300">
                <li onClick={() => setIsOrdersOpen(true)} className="hover:text-white cursor-pointer">
                  Your Account & Orders
                </li>
                <li className="hover:text-white cursor-pointer">100% Purchase Protection</li>
                <li className="hover:text-white cursor-pointer">7-Day Returns & Refunds</li>
                <li className="hover:text-white cursor-pointer">Help Centre</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-[#131921] border-t border-gray-700">
          <div className="max-w-[1400px] mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-black text-[16px]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                CraftLink<span className="text-amber-400">.in</span>
              </span>
            </div>

            {/* Trust pills */}
            <div className="flex items-center gap-4 text-[11px] text-gray-400">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-green-400" /> Secure Site</span>
              <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-blue-400" /> Free Delivery</span>
              <span className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5 text-amber-400" /> 7-Day Returns</span>
            </div>

            <div className="text-[12px] text-gray-500">
              © {new Date().getFullYear()} CraftLink Technologies Pvt. Ltd.
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ OVERLAYS ══════════════════════════════════ */}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        onOrderCompleted={handleOrderCompleted}
      />

      <OrderTrackingModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />

      {/* Pincode Modal */}
      {showPincodeModal && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-[16px] font-bold text-gray-900 mb-1 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              Choose Your Delivery Location
            </h3>
            <p className="text-[12px] text-gray-500 mb-4">
              Enter your area pincode to see faster delivery options.
            </p>
            <input
              type="text"
              value={pincodeInput}
              onChange={e => setPincodeInput(e.target.value)}
              placeholder="6-digit Pincode (e.g. 110001)"
              maxLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-[14px] font-semibold text-gray-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowPincodeModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { setUserPincode(pincodeInput || '110001'); setShowPincodeModal(false); }}
                className="flex-1 py-2.5 rounded-lg font-bold text-[13px] transition-all"
                style={{ backgroundColor: '#ffd814', color: '#0f1111' }}
              >
                Apply Location
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
