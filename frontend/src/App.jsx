import React, { useState, useEffect } from 'react';
import AmazonHeader from './components/AmazonHeader';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import SellerPortalPage from './pages/SellerPortalPage';
import AdminPortalPage from './pages/AdminPortalPage';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import { api } from './services/api';
import { COMMERCIAL_PRODUCTS } from './data/commercialProducts';
import { ShieldCheck, Truck, Award, Lock, MapPin } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('buyer'); // 'buyer', 'seller', 'admin'
  const [userPincode, setUserPincode] = useState('110001');
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [newPincodeInput, setNewPincodeInput] = useState('110001');

  // Search & Filter state for global header
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Cart & Checkout State
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [pendingAdminCount, setPendingAdminCount] = useState(0);

  const fetchPendingCount = async () => {
    try {
      const pending = await api.getPendingProducts();
      setPendingAdminCount(pending.length);
    } catch (e) {}
  };

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: (item.quantity || 1) + (product.quantity || 1) } : item
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

  const handleUpdateQuantity = (productId, newQty) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleStartCheckoutFromCart = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderCompleted = () => {
    setCartItems([]);
    fetchPendingCount();
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.price || item.suggested_price || 2499) * (item.quantity || 1),
    0
  );

  return (
    <div className="min-h-screen bg-[#eaeded] flex flex-col justify-between text-slate-800 font-sans selection:bg-amber-400 selection:text-slate-950">
      
      {/* Amazon / Flipkart Style Top Header */}
      <div>
        <AmazonHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cartCount={cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0)}
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

        {/* Primary Page View */}
        <main className="pb-12">
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
      </div>

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleStartCheckoutFromCart}
      />

      {/* Multi-Step Commercial Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        onOrderCompleted={handleOrderCompleted}
      />

      {/* Returns & Orders Tracking Modal */}
      <OrderTrackingModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />

      {/* Pincode Change Modal */}
      {showPincodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              <span>Choose Your Location</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select delivery location to see product availability and accurate shipping speeds.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={newPincodeInput}
                onChange={(e) => setNewPincodeInput(e.target.value)}
                placeholder="Enter 6-digit Pincode"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                onClick={() => {
                  setUserPincode(newPincodeInput || '110001');
                  setShowPincodeModal(false);
                }}
                className="w-full py-2.5 rounded-full bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-black text-xs shadow-sm"
              >
                Apply Pincode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Amazon / Flipkart Style Multi-Tier Commercial Footer */}
      <footer className="bg-[#131921] text-white border-t border-slate-800 text-xs font-sans mt-auto">
        
        {/* Back to Top Bar */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-full bg-[#232f3e] hover:bg-[#37475a] py-3.5 text-center text-xs font-bold text-slate-200 transition-colors"
        >
          Back to top
        </button>

        {/* 4-Column Links Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 border-b border-slate-700/60">
          
          <div>
            <h4 className="font-extrabold text-white text-sm mb-3">Get to Know Us</h4>
            <ul className="space-y-2 text-slate-300">
              <li className="hover:underline cursor-pointer">About CraftLink</li>
              <li className="hover:underline cursor-pointer">Careers at CraftLink</li>
              <li className="hover:underline cursor-pointer">Artisan Impact Stories</li>
              <li className="hover:underline cursor-pointer">Ministry of Social Justice</li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-white text-sm mb-3">Connect with Us</h4>
            <ul className="space-y-2 text-slate-300">
              <li className="hover:underline cursor-pointer">Facebook</li>
              <li className="hover:underline cursor-pointer">Instagram</li>
              <li className="hover:underline cursor-pointer">Twitter / X</li>
              <li className="hover:underline cursor-pointer">YouTube Handicrafts</li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-white text-sm mb-3">Make Money with Us</h4>
            <ul className="space-y-2 text-slate-300">
              <li onClick={() => setActiveTab('seller')} className="hover:underline cursor-pointer font-bold text-amber-400">
                Sell on CraftLink (0% Commission)
              </li>
              <li className="hover:underline cursor-pointer">Register an Artisan Guild</li>
              <li className="hover:underline cursor-pointer">Supply to Government Clusters</li>
              <li className="hover:underline cursor-pointer">ONDC Network Partnership</li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-white text-sm mb-3">Let Us Help You</h4>
            <ul className="space-y-2 text-slate-300">
              <li onClick={() => setIsOrdersOpen(true)} className="hover:underline cursor-pointer">
                Your Account & Orders
              </li>
              <li className="hover:underline cursor-pointer">100% Purchase Protection</li>
              <li className="hover:underline cursor-pointer">Cluster-Direct Shipping Rates</li>
              <li className="hover:underline cursor-pointer">Help Centre</li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright & Trust Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-base">CraftLink<span className="text-amber-400">.in</span></span>
            <span>— India's Authentic Direct Artisan Marketplace</span>
          </div>
          <div>© {new Date().getFullYear()} CraftLink Technologies Pvt. Ltd. All rights reserved.</div>
        </div>

      </footer>

    </div>
  );
}
