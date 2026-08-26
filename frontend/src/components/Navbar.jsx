import React from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  Store, 
  Layers, 
  Globe, 
  Zap, 
  ShieldCheck,
  Lock,
  Clock
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  selectedLanguage, 
  setSelectedLanguage, 
  onLaunchDemo,
  cartCount = 0,
  onOpenCart,
  pendingCount = 0
}) {
  const navTabs = [
    { id: 'buyer', label: 'E-Commerce Store', icon: Store, badge: 'Live Marketplace' },
    { id: 'studio', label: 'Artisan Studio', icon: Sparkles, badge: 'AI Engine' },
    { id: 'catalog', label: 'Artisan Catalog', icon: Layers },
    { 
      id: 'admin', 
      label: 'Admin Portal', 
      icon: ShieldCheck, 
      badge: pendingCount > 0 ? `${pendingCount} Pending` : 'Governance',
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
          
          {/* Brand Logo & Tagline */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('buyer')}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-terracotta-500 to-terracotta-700 flex items-center justify-center text-white shadow-md shadow-terracotta-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl text-indigoCraft-900 tracking-tight">
                  CraftLink <span className="text-terracotta-600 font-extrabold">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  SIH26090
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Direct Artisan Market Linkage & Smart Cataloging
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-artisan-100 p-1.5 rounded-xl border border-artisan-200">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? tab.id === 'admin'
                        ? 'bg-slate-900 text-white shadow-sm font-extrabold'
                        : 'bg-white text-terracotta-700 shadow-sm font-bold border border-artisan-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? (tab.id === 'admin' ? 'text-amber-400' : 'text-terracotta-600') : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
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

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-xl text-slate-700 hover:bg-artisan-100 transition-colors"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-terracotta-600 text-white font-extrabold text-[10px] flex items-center justify-center shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* SIH Live Demo Button */}
            <button
              onClick={onLaunchDemo}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-terracotta-600 text-white shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 transition-all"
              title="Run 2-Minute SIH Live Demo"
            >
              <Zap className="w-4 h-4 text-amber-200 animate-bounce" />
              <span className="hidden sm:inline">SIH Demo</span>
            </button>

            {/* Language Selector */}
            <div className="relative flex items-center bg-artisan-50 border border-artisan-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium">
              <Globe className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent border-none outline-none font-semibold text-slate-800 cursor-pointer pr-1"
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

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-artisan-200 overflow-x-auto gap-2">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  isActive
                    ? tab.id === 'admin'
                      ? 'text-white bg-slate-900 font-bold'
                      : 'text-terracotta-700 font-bold bg-artisan-100'
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
