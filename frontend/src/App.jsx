import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LiveDemoBar, { DEMO_PRESETS } from './components/LiveDemoBar';
import ArtisanStudioPage from './pages/ArtisanStudioPage';
import CatalogPage from './pages/CatalogPage';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import AdminPortalPage from './pages/AdminPortalPage';
import CartDrawer from './components/CartDrawer';
import { api } from './services/api';
import { Sparkles, Heart, ShieldCheck, Cpu, Store } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('buyer'); // 'buyer' (E-Commerce Store), 'studio', 'catalog', 'admin'
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [activePreset, setActivePreset] = useState(null);
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
    const interval = setInterval(fetchPendingCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPreset = (preset) => {
    setActivePreset(preset);
    setActiveTab('studio');
  };

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
          message: 'Direct fair-trade order placed from CraftLink E-Commerce Marketplace.'
        });
      }
      alert('🎉 Order successfully placed! The order is now registered in the Admin Portal.');
      setCartItems([]);
      setIsCartOpen(false);
      fetchPendingCount();
    } catch (err) {
      alert('Checkout failed: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-artisan-50 flex flex-col justify-between text-slate-800 selection:bg-terracotta-500 selection:text-white font-sans">
      
      {/* Top Main Navigation */}
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          onLaunchDemo={() => handleSelectPreset(DEMO_PRESETS[0])}
          cartCount={cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0)}
          onOpenCart={() => setIsCartOpen(true)}
          pendingCount={pendingCount}
        />

        {/* SIH Live Demo Quick Bar */}
        <LiveDemoBar
          onSelectPreset={handleSelectPreset}
          activePresetId={activePreset?.id}
        />

        {/* Main Tab Routing */}
        <main className="pb-12">
          {/* E-Commerce Storefront */}
          {activeTab === 'buyer' && (
            <BuyerDashboardPage
              selectedProductFromParent={selectedProductForBuyerModal}
              onClearSelectedProduct={() => setSelectedProductForBuyerModal(null)}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              onOpenCart={() => setIsCartOpen(true)}
            />
          )}

          {/* Artisan AI Studio (Photo + Live Speech + Voiceover + Admin Request) */}
          {activeTab === 'studio' && (
            <ArtisanStudioPage
              onProductCreated={() => {
                fetchPendingCount();
              }}
              activePreset={activePreset}
              onNavigateToAdmin={() => setActiveTab('admin')}
            />
          )}

          {/* Artisan Catalog */}
          {activeTab === 'catalog' && (
            <CatalogPage
              onAddNewProduct={() => {
                setActivePreset(null);
                setActiveTab('studio');
              }}
              onViewProductDetails={(product) => {
                setSelectedProductForBuyerModal(product);
                setActiveTab('buyer');
              }}
            />
          )}

          {/* Dedicated Admin Portal (Approval Queue, Live Catalog, Orders, Impact) */}
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

      {/* Footer */}
      <footer className="bg-white border-t border-artisan-200 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm">CraftLink AI</span>
            <span>— Smart India Hackathon Commercial Prototype (SIH26090)</span>
          </div>

          <div className="flex items-center gap-4 font-semibold text-slate-600">
            <span className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ministry of Social Justice & Empowerment</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-terracotta-600" />
              <span>Speech AI & Voiceover + Computer Vision + Fair Pricing Engine</span>
            </span>
          </div>

          <div className="text-slate-400">
            Empowering 7M+ Rural Artisans & Handloom Weavers
          </div>

        </div>
      </footer>

    </div>
  );
}
