import React, { useState, useEffect } from 'react';
import AmazonHeader from './components/AmazonHeader';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import SellerPortalPage from './pages/SellerPortalPage';
import SellerOnboardingPage from './pages/SellerOnboardingPage';
import AdminPortalPage from './pages/AdminPortalPage';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import AuthModal from './components/AuthModal';
import UserAccountModal from './components/UserAccountModal';
import { api } from './services/api';
import { MapPin, Sparkles, Truck, ShieldCheck, RotateCcw, Phone } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('buyer'); // 'buyer', 'seller', 'seller-onboarding', 'admin'
  const [userPincode, setUserPincode] = useState('110001');
  const [pincodeInput, setPincodeInput] = useState('110001');
  const [showPincodeModal, setShowPincodeModal] = useState(false);

  // Authentication & Account State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('craftlink_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Purge stale demo/hardcoded users that should never have been persisted
      const DEMO_NAMES = ['Master Weaver Ramesh', 'Varanasi Master Weavers Guild'];
      if (DEMO_NAMES.includes(parsed?.name) || DEMO_NAMES.includes(parsed?.store_name)) {
        localStorage.removeItem('craftlink_user');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState(() => {
    try {
      const saved = localStorage.getItem('craftlink_user');
      if (saved) return JSON.parse(saved)?.role || 'buyer';
    } catch {}
    return 'buyer';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('buyer');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Cart state
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [pendingAdminCount, setPendingAdminCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.getPendingProducts?.()
      .then(data => { if (!cancelled) setPendingAdminCount(data?.length || 0); })
      .catch(() => {});
    const interval = setInterval(() => {
      if (!cancelled) {
        api.getPendingProducts?.()
          .then(data => { if (!cancelled) setPendingAdminCount(data?.length || 0); })
          .catch(() => {});
      }
    }, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleLoginSuccess = (user, role) => {
    setCurrentUser(user);
    setCurrentRole(role);
    try {
      localStorage.setItem('craftlink_user', JSON.stringify(user));
    } catch {}
    
    if (role === 'seller') {
      setActiveTab('seller');
    } else if (role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('buyer');
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setCurrentRole('buyer');
    try {
      localStorage.removeItem('craftlink_user');
    } catch {}
    setActiveTab('buyer');
  };

  const handleOpenAuth = (tab = 'buyer') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

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

      {/* HEADER - Only on Consumer Marketplace */}
      {activeTab === 'buyer' && (
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
          currentUser={currentUser}
          currentRole={currentRole}
          onOpenAuthModal={handleOpenAuth}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
          onSignOut={handleSignOut}
        />
      )}

      {/* MAIN CONTENT ROUTER */}
      <main className="flex-1">
        {activeTab === 'buyer' && (
          <BuyerDashboardPage
            onAddToCart={handleAddToCart}
            onOpenCart={() => setIsCartOpen(true)}
            onBuyNow={handleBuyNow}
          />
        )}

        {activeTab === 'seller' && (
          currentUser && (currentUser.role === 'seller' || currentUser.role === 'admin')
            ? (
              <SellerPortalPage
                currentUser={currentUser}
                onNavigateToAdmin={() => setActiveTab('admin')}
                onNavigateToStore={() => setActiveTab('buyer')}
                onNavigateToOnboarding={() => setActiveTab('seller-onboarding')}
                onOpenAuthModal={handleOpenAuth}
              />
            ) : (
              // Not logged in - show auth modal and redirect back to buyer
              (() => {
                setTimeout(() => {
                  handleOpenAuth('seller');
                  setActiveTab('buyer');
                }, 0);
                return null;
              })()
          )
        )}

        {activeTab === 'seller-onboarding' && (
          <SellerOnboardingPage
            currentUser={currentUser}
            onCompleteOnboarding={(newSeller) => {
              handleLoginSuccess(newSeller, 'seller');
              setActiveTab('seller');
            }}
            onCancel={() => setActiveTab(currentUser ? 'seller' : 'buyer')}
          />
        )}

        {activeTab === 'admin' && (
          currentUser && currentUser.role === 'admin'
            ? (
              <AdminPortalPage
                currentUser={currentUser}
                onNavigateToMarketplace={() => setActiveTab('buyer')}
                onOpenAuthModal={handleOpenAuth}
              />
            ) : (
              (() => {
                setTimeout(() => {
                  handleOpenAuth('admin');
                  setActiveTab('buyer');
                }, 0);
                return null;
              })()
            )
        )}
      </main>

      {/* ═══ FOOTER - Only on Consumer Marketplace ══════════════════════ */}
      {activeTab === 'buyer' && (
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
                <h5 className="font-bold text-[14px] mb-4 text-white">Get to Know Us</h5>
                <ul className="space-y-2 text-[13px] text-gray-300">
                  <li className="hover:text-white cursor-pointer">About CraftLink India</li>
                  <li className="hover:text-white cursor-pointer">Master Artisan Network</li>
                  <li className="hover:text-white cursor-pointer">GI Certification Standard</li>
                  <li className="hover:text-white cursor-pointer">National Handloom Directorate</li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-[14px] mb-4 text-white">Sell on CraftLink</h5>
                <ul className="space-y-2 text-[13px] text-gray-300">
                  <li
                    onClick={() => {
                      if (currentUser && (currentUser.role === 'seller' || currentUser.role === 'admin')) {
                        setActiveTab('seller');
                      } else {
                        handleOpenAuth('seller');
                      }
                    }}
                    className="hover:text-amber-400 cursor-pointer font-semibold text-amber-300"
                  >
                    Sell on CraftLink (0% Fee)
                  </li>
                  <li
                    onClick={() => setActiveTab('seller-onboarding')}
                    className="hover:text-white cursor-pointer"
                  >
                    Register as Master Artisan
                  </li>
                  <li className="hover:text-white cursor-pointer">AI Voice Cataloging Studio</li>
                  <li className="hover:text-white cursor-pointer">NEFT Direct Payouts</li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-[14px] mb-4 text-white">Artisan Clusters</h5>
                <ul className="space-y-2 text-[13px] text-gray-300">
                  <li className="hover:text-white cursor-pointer">Varanasi Handloom Silk</li>
                  <li className="hover:text-white cursor-pointer">Jaipur Cobalt Blue Pottery</li>
                  <li className="hover:text-white cursor-pointer">Bastar Dhokra Bell Metal</li>
                  <li className="hover:text-white cursor-pointer">Channapatna Wooden Toys</li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-[14px] mb-4 text-white">Governance & Help</h5>
                <ul className="space-y-2 text-[13px] text-gray-300">
                  <li
                    onClick={() => setActiveTab('admin')}
                    className="hover:text-emerald-400 cursor-pointer font-semibold text-emerald-300"
                  >
                    Admin Governance Portal
                  </li>
                  <li onClick={() => setIsOrdersOpen(true)} className="hover:text-white cursor-pointer">Track Orders</li>
                  <li className="hover:text-white cursor-pointer">Fair-Trade Wage Guarantee</li>
                  <li className="hover:text-white cursor-pointer">Artisan Helpline (Toll Free)</li>
                </ul>
              </div>

            </div>

            {/* Bottom strip */}
            <div className="border-t border-gray-700 py-6 text-center text-[12px] text-gray-400">
              <div className="flex items-center justify-center gap-6 mb-2">
                <span className="flex items-center gap-1.5 text-white font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  CraftLink.in
                </span>
                <span>•</span>
                <span>100% Direct Producer Revenue</span>
                <span>•</span>
                <span>Zero Intermediary Exploitation</span>
              </div>
              <p>© 2026 CraftLink India Enterprise. All rights reserved. Registered National Handloom & Handicraft Marketplace.</p>
            </div>
          </div>

        </footer>
      )}

      {/* ═══ OVERLAYS & MODALS ════════════════════════ */}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cartItems={cartItems}
          cartTotal={cartTotal}
          onOrderSuccess={handleOrderCompleted}
        />
      )}

      {/* Order Tracking Modal */}
      {isOrdersOpen && (
        <OrderTrackingModal
          isOpen={isOrdersOpen}
          onClose={() => setIsOrdersOpen(false)}
        />
      )}

      {/* Auth Modal (Buyer / Seller / Admin) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
        onLoginSuccess={handleLoginSuccess}
        onNavigateToSellerOnboarding={() => setActiveTab('seller-onboarding')}
      />

      {/* User Account Dashboard Modal */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        currentRole={currentRole}
        onSignOut={handleSignOut}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onNavigateToSeller={() => setActiveTab('seller')}
        onNavigateToAdmin={() => setActiveTab('admin')}
        onOpenAuthModal={handleOpenAuth}
      />

      {/* Pincode Change Modal */}
      {showPincodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Choose your location
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter your Indian postal pincode to see accurate delivery speed and artisan cluster availability.
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={pincodeInput}
                onChange={e => setPincodeInput(e.target.value)}
                placeholder="Enter 6-digit Pincode"
                maxLength={6}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold outline-none focus:border-amber-400 font-mono"
              />
              <button
                onClick={() => {
                  setUserPincode(pincodeInput || '110001');
                  setShowPincodeModal(false);
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-xs rounded-lg transition-colors"
              >
                Apply
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPincodeModal(false)}
                className="text-xs text-gray-500 hover:text-gray-800 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
