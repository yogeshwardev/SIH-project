import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  ShoppingBag, 
  ChevronDown, 
  Globe, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  Menu, 
  X,
  Package,
  Zap,
  Truck
} from 'lucide-react';

export default function AmazonHeader({
  activeTab,
  setActiveTab,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenOrders,
  searchTerm,
  setSearchTerm,
  onSearch,
  selectedCategory,
  setSelectedCategory,
  userPincode,
  onOpenPincodeModal,
  pendingAdminCount = 0
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const categories = [
    'All Categories',
    'Handloom & Textiles',
    'Pottery & Ceramics',
    'Woodcraft & Carving',
    'Metal Craft & Bell Metal',
    'Cane & Bamboo',
    'Traditional Paintings'
  ];

  const quickLinks = [
    { label: '⚡ Today\'s Deals', filter: 'deals' },
    { label: '👗 Handlooms & Sarees', filter: 'Handloom & Textiles' },
    { label: '🏺 Blue Pottery', filter: 'Pottery & Ceramics' },
    { label: '🪵 Channapatna Toys', filter: 'Woodcraft & Carving' },
    { label: '💍 Tribal Bell Metal', filter: 'Metal Craft & Bell Metal' },
    { label: '🧺 Cane & Bamboo', filter: 'Cane & Bamboo' },
    { label: '⭐ Best Sellers', filter: 'bestsellers' },
    { label: '🔥 Under ₹999 Store', filter: 'under999' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#131921] text-white shadow-md font-sans">
      
      {/* Primary Top Nav Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('buyer')}
            className="flex items-center gap-1.5 cursor-pointer py-1 px-2 border border-transparent hover:border-white rounded transition-colors group flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-terracotta-600 flex items-center justify-center text-slate-950 font-black shadow">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="font-black text-xl tracking-tight text-white">CraftLink</span>
                <span className="text-amber-400 font-black text-lg">.in</span>
              </div>
              <span className="text-[9px] text-amber-300 -mt-1 font-semibold tracking-wider">DIRECT ARTISAN</span>
            </div>
          </div>

          {/* Delivery Location Widget (Amazon style) */}
          <div 
            onClick={onOpenPincodeModal}
            className="hidden lg:flex items-center gap-1.5 cursor-pointer py-1.5 px-2 border border-transparent hover:border-white rounded transition-colors flex-shrink-0"
          >
            <MapPin className="w-4 h-4 text-amber-400 -mt-2" />
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[11px] text-slate-400">Deliver to New Delhi</span>
              <span className="text-xs font-bold text-white truncate max-w-[110px]">{userPincode || '110001'} (Update)</span>
            </div>
          </div>

          {/* Mega Search Bar (Amazon / Flipkart style) */}
          <div className="flex-1 max-w-2xl relative">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                onSearch();
              }}
              className="flex items-center rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-amber-400 shadow-inner"
            >
              {/* Category Dropdown */}
              <div className="hidden sm:flex items-center bg-slate-100 border-r border-slate-300 text-slate-700 text-xs px-2.5 py-2.5 font-medium cursor-pointer">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent border-none outline-none cursor-pointer pr-1 text-slate-800 font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="text-slate-900">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text Input */}
              <input
                type="text"
                placeholder="Search Banarasi silk, Jaipur blue pottery, wooden toys, tribal art..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />

              {/* Submit Search Button */}
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 sm:px-5 py-2.5 sm:py-2.5 transition-colors flex items-center justify-center font-bold"
                title="Search"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 stroke-[2.5]" />
              </button>
            </form>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Returns & Orders (Amazon style) */}
            <button
              onClick={onOpenOrders}
              className="hidden md:flex flex-col text-left py-1.5 px-2 border border-transparent hover:border-white rounded transition-colors"
            >
              <span className="text-[11px] text-slate-400">Returns</span>
              <span className="text-xs font-bold text-white">& Orders</span>
            </button>

            {/* Seller Central / Supplier Hub (Meesho / Flipkart style) */}
            <button
              onClick={() => setActiveTab('seller')}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'seller'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Artisan Seller Central"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Seller Central</span>
            </button>

            {/* Admin Portal */}
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all relative ${
                activeTab === 'admin'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Operations & Governance"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">Admin</span>
              {pendingAdminCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1 right-1"></span>
              )}
            </button>

            {/* Cart Button (Amazon Yellow Badge Style) */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 py-1.5 px-2.5 border border-transparent hover:border-white rounded transition-colors group"
            >
              <div className="relative">
                <ShoppingBag className="w-6 h-6 text-amber-400" />
                <span className="absolute -top-1.5 -right-2 bg-amber-400 text-slate-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {cartCount}
                </span>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Cart</span>
                <span className="text-xs font-extrabold text-amber-300">₹{cartTotal?.toLocaleString('en-IN') || 0}</span>
              </div>
            </button>

          </div>

        </div>
      </div>

      {/* Secondary Horizontal Category Navigation Bar (Flipkart / Amazon style) */}
      <div className="bg-[#232f3e] text-slate-200 border-t border-slate-700/50 overflow-x-auto text-xs py-1.5 px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-4 sm:gap-6 whitespace-nowrap">
          
          <button 
            onClick={() => setActiveTab('buyer')}
            className="flex items-center gap-1.5 font-extrabold text-white hover:text-amber-400 py-1"
          >
            <Menu className="w-4 h-4" />
            <span>All Categories</span>
          </button>

          {quickLinks.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveTab('buyer');
                if (item.filter.startsWith('Handloom') || item.filter.startsWith('Pottery') || item.filter.startsWith('Woodcraft') || item.filter.startsWith('Metal') || item.filter.startsWith('Cane')) {
                  setSelectedCategory(item.filter);
                } else if (item.filter === 'deals' || item.filter === 'under999' || item.filter === 'bestsellers') {
                  const el = document.getElementById(item.filter);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-amber-300 font-medium py-1 transition-colors border-b-2 border-transparent hover:border-amber-400"
            >
              {item.label}
            </button>
          ))}

          <div className="ml-auto hidden md:flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
            <Truck className="w-3.5 h-3.5" />
            <span>Direct from 100+ Verified GI Artisan Clusters</span>
          </div>

        </div>
      </div>

    </header>
  );
}
