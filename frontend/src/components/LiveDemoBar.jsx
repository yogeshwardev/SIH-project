import React from 'react';
import { Zap, Sparkles, ArrowRight } from 'lucide-react';

export const DEMO_PRESETS = [
  {
    id: 'banarasi_saree',
    name: 'Banarasi Silk Saree',
    category: 'Handloom & Textiles',
    craft: 'Banarasi Silk Weaving',
    region: 'Varanasi, UP',
    icon: '🥻',
    rawImage: '/uploads/banarasi_saree_raw.jpg',
    enhancedImage: '/uploads/banarasi_saree_studio_enhanced.png',
    voiceText: 'यह शुद्ध बनारसी कतान सिल्क साड़ी है। इसमें असली सोने और चांदी की जरी का काम है। इसे हथकरघे पर बुनने में लगभग 6 दिन का समय लगता है। इसकी लंबाई 6.5 मीटर है।',
    language: 'Hindi',
    materialCost: 2200,
    laborCost: 4800,
    packagingCost: 250,
    productionTime: '6 days'
  },
  {
    id: 'blue_pottery',
    name: 'Jaipur Blue Pottery Vase',
    category: 'Pottery & Ceramics',
    craft: 'Jaipur Blue Pottery',
    region: 'Jaipur, Rajasthan',
    icon: '🏺',
    rawImage: '/uploads/blue_pottery_raw.jpg',
    enhancedImage: '/uploads/blue_pottery_studio_enhanced.png',
    voiceText: 'This is a handcrafted Jaipur Blue Pottery vase made from quartz stone powder and natural blue cobalt glaze. It takes 3 days to mold, paint, and fire in the traditional kiln.',
    language: 'English',
    materialCost: 350,
    laborCost: 1400,
    packagingCost: 200,
    productionTime: '3 days'
  },
  {
    id: 'bamboo_basket',
    name: 'Assam Bamboo Basket',
    category: 'Cane & Bamboo',
    craft: 'Assam Bamboo Craft',
    region: 'Barpeta, Assam',
    icon: '🧺',
    rawImage: '/uploads/bamboo_basket_raw.jpg',
    enhancedImage: '/uploads/bamboo_basket_studio_enhanced.png',
    voiceText: 'यह प्राकृतिक असमिया बांस से बनी मजबूत और पर्यावरण के अनुकूल स्टोरेज बास्केट है। इसे पारंपरिक हाथ की बुनाई से तैयार किया गया है और 2 दिन का समय लगा है।',
    language: 'Hindi',
    materialCost: 210,
    laborCost: 1150,
    packagingCost: 140,
    productionTime: '2 days'
  },
  {
    id: 'dhokra_figurine',
    name: 'Dhokra Brass Figurine',
    category: 'Metal Craft & Bell Metal',
    craft: 'Dhokra Bell Metal Casting',
    region: 'Bastar, Chhattisgarh',
    icon: '🪆',
    rawImage: '/uploads/dhokra_figurine_raw.jpg',
    enhancedImage: '/uploads/dhokra_figurine_studio_enhanced.png',
    voiceText: 'यह पारंपरिक ढोकरा बेल मेटल की मूर्ति है जिसे प्राचीन लॉस्ट-वैक्स कास्टिंग तकनीक से बनाया गया है। इसमें बस्तर के जनजातीय संगीतकार की आकृति है।',
    language: 'Hindi',
    materialCost: 480,
    laborCost: 1950,
    packagingCost: 150,
    productionTime: '4 days'
  },
  {
    id: 'channapatna_toy',
    name: 'Channapatna Wooden Toy',
    category: 'Woodcraft & Carving',
    craft: 'Channapatna Wooden Toys',
    region: 'Channapatna, Karnataka',
    icon: '🪵',
    rawImage: '/uploads/channapatna_toy_raw.jpg',
    enhancedImage: '/uploads/channapatna_toy_studio_enhanced.png',
    voiceText: 'This is an authentic Channapatna wooden stacker toy crafted with Ivory wood and polished with non-toxic natural vegetable dyes. Child-safe and completely handmade.',
    language: 'English',
    materialCost: 160,
    laborCost: 650,
    packagingCost: 90,
    productionTime: '1 day'
  }
];

export default function LiveDemoBar({ onSelectPreset, activePresetId }) {
  return (
    <div className="bg-gradient-to-r from-amber-50 via-terracotta-50/40 to-amber-50 border-b border-artisan-200 py-2.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Banner Title */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500 text-white font-black tracking-wide shadow-sm">
            <Zap className="w-3.5 h-3.5" />
            <span>SIH LIVE DEMO</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">
            Select a raw artisan product to demonstrate the end-to-end AI pipeline in &lt; 2 minutes:
          </span>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {DEMO_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                  isSelected
                    ? 'bg-terracotta-600 text-white shadow-sm scale-105'
                    : 'bg-white text-slate-700 hover:bg-artisan-100 hover:text-slate-900 border border-artisan-200 shadow-sm'
                }`}
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
