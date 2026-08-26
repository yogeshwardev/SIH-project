import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  Edit3, 
  FileSpreadsheet, 
  FileCode, 
  Tag, 
  MapPin, 
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function CatalogPage({ onAddNewProduct, onViewProductDetails }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Handloom & Textiles',
    'Pottery & Ceramics',
    'Cane & Bamboo',
    'Metal Craft & Bell Metal',
    'Woodcraft & Carving',
    'Traditional Paintings'
  ];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({
        search: searchTerm,
        category: selectedCategory !== 'All' ? selectedCategory : undefined
      });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this craft listing from the catalog?')) {
      try {
        await api.deleteProduct(id);
        fetchProducts();
      } catch (err) {
        alert('Failed to delete product: ' + err.message);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Action Header */}
      <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-5 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-terracotta-100 text-terracotta-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Digital Artisan Catalog
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active verified marketplace listings ready for e-commerce, export, and buyers
            </p>
          </div>

          {/* Export and Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            <a
              href={api.csvExportUrl}
              download="craftlink_artisan_catalog.csv"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors shadow-sm"
              title="Download CSV of all database products"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </a>

            <a
              href={api.jsonExportUrl}
              download="craftlink_artisan_catalog.json"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors shadow-sm"
              title="Download structured JSON for ONDC & e-commerce"
            >
              <FileCode className="w-4 h-4 text-blue-600" />
              <span>Export JSON</span>
            </a>

            <button
              onClick={onAddNewProduct}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-terracotta-600 hover:bg-terracotta-700 text-white shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Craft</span>
            </button>

          </div>

        </div>

        {/* Search & Category Filter Bar */}
        <div className="mt-5 pt-4 border-t border-artisan-100 flex flex-col md:flex-row items-center justify-between gap-3">
          
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by craft, material, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-artisan-50 border border-artisan-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
            />
          </form>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-artisan-50 text-slate-600 hover:bg-artisan-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-artisan-200">
          <div className="w-10 h-10 border-4 border-terracotta-200 border-t-terracotta-600 rounded-full animate-spin mb-3"></div>
          <span className="text-xs font-bold text-slate-500">Loading Artisan Catalog...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-artisan-200 shadow-sm p-6">
          <div className="w-16 h-16 rounded-full bg-artisan-100 text-terracotta-600 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No craft listings found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Create your first smart catalog listing by taking a photo and speaking in your native language!
          </p>
          <button
            onClick={onAddNewProduct}
            className="px-5 py-2.5 rounded-xl bg-terracotta-600 text-white text-xs font-bold shadow-md hover:bg-terracotta-700 transition-all"
          >
            Create Product with AI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="relative group">
              <ProductCard
                product={p}
                onViewDetails={onViewProductDetails}
              />
              {/* Card Floating Delete Action */}
              <button
                onClick={() => handleDelete(p.id)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/90 backdrop-blur-md text-slate-400 hover:text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
                title="Delete Listing"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
