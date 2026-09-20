import React, { useEffect, useState } from 'react';
import StoreHeader from './components/StoreHeader';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import SellerPortalPage from './pages/seller/SellerPortalPage';
import SellerOnboardingPage from './pages/SellerOnboardingPage';
import AdminPortalPage from './pages/AdminPortalPage';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import AuthModal from './components/AuthModal';
import UserAccountModal from './components/UserAccountModal';
import LanguageSelector from './components/LanguageSelector';
import Logo from './components/Logo';
import { useLanguage } from './context/LanguageContext';

const USER_KEY = 'craftlink_user';
const CART_KEY = 'craftlink_cart';

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const writeStorage = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage unavailable */ }
};

const itemKey = (item) => item._catalogKey || item.id;
const clampToStock = (item, quantity) => {
  const stock = item.stock_quantity == null ? Infinity : Number(item.stock_quantity);
  return Math.max(1, Math.min(quantity, stock));
};

export default function App() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('buyer'); // buyer | seller | seller-onboarding | admin
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = readStorage(USER_KEY, null);
    // Older builds persisted a hardcoded demo identity; never restore it.
    if (['Master Weaver Ramesh', 'Varanasi Master Weavers Guild'].includes(saved?.name) || saved?.store_name === 'Varanasi Master Weavers Guild') {
      writeStorage(USER_KEY, null);
      return null;
    }
    return saved;
  });
  const currentRole = currentUser?.role || 'buyer';

  const [authModal, setAuthModal] = useState({ open: false, tab: 'buyer' });
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [cartItems, setCartItems] = useState(() => {
    const saved = readStorage(CART_KEY, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  useEffect(() => { writeStorage(CART_KEY, cartItems); }, [cartItems]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [activeTab]);

  const openAuth = (tab = 'buyer') => setAuthModal({ open: true, tab });

  // Route guards: workspaces require the matching role.
  const canSell = currentUser && ['seller', 'admin'].includes(currentRole);
  const canAdmin = currentUser && currentRole === 'admin';
  useEffect(() => {
    if (activeTab === 'seller' && !canSell) { setActiveTab('buyer'); openAuth('seller'); }
    if (activeTab === 'admin' && !canAdmin) { setActiveTab('buyer'); openAuth('admin'); }
  }, [activeTab, canSell, canAdmin]);

  const handleLoginSuccess = (user, role) => {
    const signedIn = { ...user, role: user?.role || role };
    setCurrentUser(signedIn);
    writeStorage(USER_KEY, signedIn);
    setActiveTab(role === 'seller' ? 'seller' : role === 'admin' ? 'admin' : 'buyer');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    writeStorage(USER_KEY, null);
    setActiveTab('buyer');
  };

  const openSellerWorkspace = () => (canSell ? setActiveTab('seller') : openAuth('seller'));

  const handleAddToCart = (product, { openDrawer = true } = {}) => {
    setCartItems((previous) => {
      const existing = previous.find((item) => itemKey(item) === itemKey(product));
      if (existing) {
        return previous.map((item) => (itemKey(item) === itemKey(product)
          ? { ...item, quantity: clampToStock(product, (item.quantity || 1) + (product.quantity || 1)) }
          : item));
      }
      return [...previous, { ...product, quantity: clampToStock(product, product.quantity || 1) }];
    });
    if (openDrawer) setIsCartOpen(true);
  };

  const handleBuyNow = (product) => {
    handleAddToCart(product, { openDrawer: false });
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleUpdateQuantity = (key, quantity) => {
    setCartItems((previous) => previous.map((item) => (itemKey(item) === key ? { ...item, quantity: clampToStock(item, quantity) } : item)));
  };
  const handleRemoveItem = (key) => setCartItems((previous) => previous.filter((item) => itemKey(item) !== key));

  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  const inWorkspace = activeTab !== 'buyer';

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {!inWorkspace && (
        <StoreHeader
          cartCount={cartCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenOrders={() => setIsOrdersOpen(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          currentUser={currentUser}
          onHome={() => { setSelectedCategory('All'); setSearchTerm(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onOpenSeller={openSellerWorkspace}
          onOpenAdmin={() => setActiveTab('admin')}
          onOpenAuth={openAuth}
          onOpenAccount={() => setIsAccountOpen(true)}
          onSignOut={handleSignOut}
        />
      )}

      <main className="flex-1">
        {activeTab === 'buyer' && (
          <BuyerDashboardPage
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onClearSearch={() => setSearchTerm('')}
            onSearch={setSearchTerm}
            onOpenSeller={openSellerWorkspace}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        )}
        {activeTab === 'seller' && canSell && (
          <SellerPortalPage
            currentUser={currentUser}
            onNavigateToAdmin={() => setActiveTab('admin')}
            onNavigateToStore={() => setActiveTab('buyer')}
            onNavigateToOnboarding={() => setActiveTab('seller-onboarding')}
            onSignOut={handleSignOut}
          />
        )}
        {activeTab === 'seller-onboarding' && (
          <SellerOnboardingPage
            onCompleteOnboarding={(seller) => handleLoginSuccess(seller, 'seller')}
            onCancel={() => setActiveTab(canSell ? 'seller' : 'buyer')}
          />
        )}
        {activeTab === 'admin' && canAdmin && (
          <AdminPortalPage
            currentUser={currentUser}
            onNavigateToMarketplace={() => setActiveTab('buyer')}
            onNavigateToSeller={() => setActiveTab('seller')}
            onSignOut={handleSignOut}
          />
        )}
      </main>

      {!inWorkspace && (
        <footer className="mt-16 bg-brand-900 text-brand-100">
          <div className="border-motif" aria-hidden="true" />
          <div className="bg-buti">
            <div className="mx-auto grid max-w-[1320px] gap-10 px-6 py-14 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
              <div>
                <Logo tone="light" tagline={t('Handmade in India')} />
                <p className="mt-5 max-w-xs text-sm leading-relaxed text-brand-200">{t('CraftLink connects people with the hands behind the craft. Every piece comes straight from an artisan studio.')}</p>
                <div className="mt-5"><LanguageSelector tone="dark" /></div>
              </div>
              <FooterColumn title={t('Shop')} links={[
                [t('The collection'), () => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })],
                [t('Meet the makers'), () => document.getElementById('makers')?.scrollIntoView({ behavior: 'smooth' })],
                [t('Back to top'), () => window.scrollTo({ top: 0, behavior: 'smooth' })],
              ]} />
              <FooterColumn title={t('For artisans')} links={[
                [t('Seller workspace'), openSellerWorkspace],
                [t('Create a store'), () => setActiveTab('seller-onboarding')],
              ]} />
              <FooterColumn title={t('Help')} links={[
                [t('Track an order'), () => setIsOrdersOpen(true)],
                [t('Your account'), () => (currentUser ? setIsAccountOpen(true) : openAuth('buyer'))],
              ]} />
            </div>
            <div className="border-t border-white/10">
              <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-6 py-5 text-xs text-brand-300 sm:flex-row sm:justify-between">
                <span>© {new Date().getFullYear()} CraftLink. {t('All rights reserved.')}</span>
                <span>{t('Cash on delivery · Free shipping across India')}</span>
              </div>
            </div>
          </div>
        </footer>
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
      />
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          items={cartItems}
          currentUser={currentUser}
          onOrderCompleted={() => setCartItems([])}
          onTrackOrder={() => { setIsCheckoutOpen(false); setIsOrdersOpen(true); }}
        />
      )}
      {isOrdersOpen && <OrderTrackingModal isOpen={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} currentUser={currentUser} />}
      <AuthModal
        isOpen={authModal.open}
        initialTab={authModal.tab}
        onClose={() => setAuthModal((state) => ({ ...state, open: false }))}
        onLoginSuccess={handleLoginSuccess}
        onNavigateToSellerOnboarding={() => setActiveTab('seller-onboarding')}
      />
      <UserAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onNavigateToSeller={() => setActiveTab('seller')}
        onNavigateToAdmin={() => setActiveTab('admin')}
      />
    </div>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="font-display text-sm font-bold text-white">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, onClick]) => (
          <li key={label}><button type="button" onClick={onClick} className="text-sm text-brand-200 transition hover:text-white">{label}</button></li>
        ))}
      </ul>
    </div>
  );
}
