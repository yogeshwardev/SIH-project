import React from 'react';
import { Sparkles, ArrowRight, Layers } from 'lucide-react';

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
    voiceText: 'This is an authentic Bastar tribal lost-wax cast Dhokra horse figurine made from recycled brass and bell metal alloy. Handcrafted over 4 days.',
    language: 'English',
    materialCost: 450,
    laborCost: 1950,
    packagingCost: 180,
    productionTime: '4 days'
  },
  {
    id: 'channapatna_toy',
    name: 'Channapatna Wooden Toy',
    category: 'Woodcraft & Carving',
    craft: 'Channapatna Lacquerware',
    region: 'Ramanagara, Karnataka',
    icon: '🪵',
    rawImage: '/uploads/channapatna_toy_raw.jpg',
    enhancedImage: '/uploads/channapatna_toy_studio_enhanced.png',
    voiceText: 'This is a traditional Channapatna wooden rolling animal toy made of Wrightia tinctoria Ivory Wood, lacquered with non-toxic natural vegetable dyes. Child-safe.',
    language: 'English',
    materialCost: 180,
    laborCost: 850,
    packagingCost: 120,
    productionTime: '1 day'
  }
];

export const CATALOG_TEMPLATES = DEMO_PRESETS;

export default function LiveDemoBar({ onSelectPreset, activePresetId }) {
  return (
    <div className="bg-gradient-to-r from-gray-900 via-[#131921] to-gray-900 text-white border-b border-gray-800 py-2.5 px-4 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Title */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
            <Layers className="w-3 h-3" />
            <span>CATALOG TEMPLATES</span>
          </div>
          <span className="text-xs text-gray-300 hidden lg:inline">
            Fast-track catalog creation with pre-calibrated GI craft templates:
          </span>
        </div>

        {/* Preset Badges */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {DEMO_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset?.(preset)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-400 text-gray-900 shadow-md font-bold scale-105'
                    : 'bg-white/10 text-gray-200 hover:bg-white/20 border border-white/10'
                }`}
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-gray-900/20 text-gray-900' : 'bg-black/30 text-gray-400'
                }`}>
                  {preset.language}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
