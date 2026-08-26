import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Sliders, Download, Eye, Layers } from 'lucide-react';

export default function BeforeAfterSlider({ originalUrl, enhancedUrl, title = 'Product Enhancement' }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onTouchMove = (e) => {
      if (isDragging && e.touches[0]) handleMove(e.touches[0].clientX);
    };
    const onStop = () => setIsDragging(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onStop);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onStop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onStop);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onStop);
    };
  }, [isDragging]);

  return (
    <div className="bg-white rounded-2xl border border-artisan-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            AI Studio Catalog Enhancement
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5 text-terracotta-600" />
          Drag slider to compare
        </span>
      </div>

      {/* Interactive Split View Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        className="relative w-full h-[320px] sm:h-[400px] rounded-xl overflow-hidden cursor-ew-resize select-none bg-slate-900 border border-artisan-200 shadow-inner group"
      >
        {/* ENHANCED IMAGE (Base) */}
        <img
          src={enhancedUrl || originalUrl}
          alt="AI Enhanced Product"
          className="absolute inset-0 w-full h-full object-contain bg-slate-900/50"
        />

        {/* Enhanced Badge */}
        <div className="absolute top-3 right-3 bg-emerald-700/90 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-md z-10 flex items-center gap-1.5 border border-emerald-400/40">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI ENHANCED</span>
        </div>

        {/* RAW / BEFORE IMAGE (Clipped on top) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={originalUrl}
            alt="Raw Artisan Photo"
            className="absolute inset-0 w-full h-full object-contain max-w-none"
            style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
          />

          {/* Raw / Before Badge */}
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-md flex items-center gap-1.5 border border-slate-700">
            <Eye className="w-3.5 h-3.5" />
            <span>ORIGINAL PHOTO</span>
          </div>
        </div>

        {/* Vertical Divider Line & Draggable Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-800 shadow-lg border-2 border-terracotta-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
            <Sliders className="w-4 h-4 text-terracotta-700" />
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Background Isolated • Lighting Normalized • Studio Shadow Applied</span>
        </div>
        {enhancedUrl && (
          <a
            href={enhancedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-terracotta-700 hover:text-terracotta-900 font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Studio HD</span>
          </a>
        )}
      </div>
    </div>
  );
}
