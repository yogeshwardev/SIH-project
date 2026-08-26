import React from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  Store, 
  Building2, 
  Globe, 
  ShieldCheck,
  Package,
  Layers,
  Heart
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  selectedLanguage, 
  setSelectedLanguage, 
  cartCount = 0,
  onOpenCart,
  pendingCount = 0
}) {
  const navTabs = [
    { id: 'buyer', label: 'Explore Marketplace', icon: Store },
    { id: 'seller', label: 'Seller Central', icon: Building2, badge: 'Artisan Hub' },
    { 
      id: 'admin', 
      label: 'Admin Operations', 
      icon: ShieldCheck, 
      badge: pendingCount > 0 ? `${pendingCount} Pending` : null,
      isSpecial: true
    },
  ];

  const languages = [
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-artisan-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Commercial Brand Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('buyer')}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-terracotta-600 to-terracotta-800 flex items-center justify-center text-white shadow-md shadow-terracotta-600/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                  CraftLink<span className="text-terracotta-600">.</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Direct Artisan Marketplace
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                India's Authentic GI Crafts & Handloom Luxury
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? tab.id === 'admin'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-white text-terracotta-700 shadow-sm border border-artisan-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? (tab.id === 'admin' ? 'text-amber-400' : 'text-terracotta-600') : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      tab.id === 'admin' && pendingCount > 0
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-terracotta-100 text-terracotta-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-terracotta-600 text-white font-black text-[10px] flex items-center justify-center shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Language Selector */}
            <div className="relative flex items-center bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold">
              <Globe className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer pr-1"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-artisan-200 overflow-x-auto gap-2">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap ${
                  isActive
                    ? tab.id === 'admin'
                      ? 'text-white bg-slate-900'
                      : 'text-terracotta-700 bg-artisan-100'
                    : 'text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
