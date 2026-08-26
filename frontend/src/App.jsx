import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import SellerPortalPage from './pages/SellerPortalPage';
import AdminPortalPage from './pages/AdminPortalPage';
import CartDrawer from './components/CartDrawer';
import { api } from './services/api';
import { ShieldCheck, Cpu, Store, Building2, Truck, Award, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('buyer'); // 'buyer' (Marketplace), 'seller' (Seller Central), 'admin' (Admin Operations)
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [selectedProductForBuyerModal, setSelectedProductForBuyerModal] = useState(null);

  // Cart State
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = async () => {
    try {
      const pending = await api.getPendingProducts();
      setPendingCount(pending.length);
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
          item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId, newQty) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleCheckoutFromCart = async () => {
    if (cartItems.length === 0) return;
    try {
      for (const item of cartItems) {
        await api.createInquiry({
          product_id: item.id,
          buyer_name: 'Online Consumer',
          buyer_email: 'customer@craftlink.in',
          buyer_phone: '+91 98765 00000',
          buyer_city: 'New Delhi',
          order_type: 'Cart Direct Checkout',
          quantity: item.quantity || 1,
          total_amount: (item.suggested_price || 2499) * (item.quantity || 1),
          message: 'Direct fair-trade purchase from CraftLink Artisan Marketplace.'
        });
      }
      alert('🎉 Order successfully placed! Your order has been routed to the artisan guild and registered in Admin Operations.');
      setCartItems([]);
      setIsCartOpen(false);
      fetchPendingCount();
    } catch (err) {
      alert('Checkout failed: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 selection:bg-terracotta-500 selection:text-white font-sans">
      
      {/* Top Navigation */}
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          cartCount={cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0)}
          onOpenCart={() => setIsCartOpen(true)}
          pendingCount={pendingCount}
        />

        {/* Primary Page Content */}
        <main className="pb-12">
          {/* Consumer Marketplace */}
          {activeTab === 'buyer' && (
            <BuyerDashboardPage
              selectedProductFromParent={selectedProductForBuyerModal}
              onClearSelectedProduct={() => setSelectedProductForBuyerModal(null)}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              onOpenCart={() => setIsCartOpen(true)}
            />
          )}

          {/* Seller Central Portal (Artisan Enterprise Hub) */}
          {activeTab === 'seller' && (
            <SellerPortalPage
              onNavigateToAdmin={() => setActiveTab('admin')}
              onNavigateToStore={() => setActiveTab('buyer')}
            />
          )}

          {/* Admin Operations & Governance Portal */}
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
        onCheckout={handleCheckoutFromCart}
      />

      {/* Commercial Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs text-slate-400">
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-black text-white text-lg tracking-tight">CraftLink.</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              India's authentic direct artisan marketplace empowering rural handloom weavers and craft guilds through zero-hallucination artificial intelligence.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Craft Clusters</h4>
            <ul className="space-y-1.5">
              <li>• Varanasi Silk Brocades</li>
              <li>• Jaipur Blue Pottery</li>
              <li>• Assam Cane & Bamboo</li>
              <li>• Bastar Dhokra Bell Metal</li>
              <li>• Channapatna Wooden Toys</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Commercial Trust</h4>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% GI Origin Certified
              </li>
              <li className="flex items-center gap-1 text-amber-300 font-semibold">
                <Award className="w-3.5 h-3.5" />
                Zero Middlemen Margins
              </li>
              <li className="flex items-center gap-1 text-blue-300 font-semibold">
                <Truck className="w-3.5 h-3.5" />
                Cluster-Direct Insured Logistics
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Enterprise Portals</h4>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('seller')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-between"
              >
                <span>Artisan Seller Central</span>
                <span>→</span>
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-between"
              >
                <span>Admin & Operations</span>
                <span>→</span>
              </button>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} CraftLink Technologies Pvt. Ltd. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Artisan Fair-Trade Charter</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
