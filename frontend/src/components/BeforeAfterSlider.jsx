import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, Eye, Download, MoveHorizontal } from 'lucide-react';

export default function BeforeAfterSlider({
  originalUrl,
  enhancedUrl,
  title = 'AI Studio Enhancement',
}) {
  const [pos, setPos] = useState(50); // 0–100 percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Position calculation helper
  const updatePosition = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setPos(pct);
  }, []);

  // Pointer event handlers with pointer capture (supports Mouse, Touch, Stylus, Trackpad)
  const handlePointerDown = (e) => {
    // Only handle primary button / primary touch
    if (e.button !== undefined && e.button !== 0) return;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleRangeChange = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      setPos(val);
    }
  };

  const showBoth = !!originalUrl && !!enhancedUrl;
  const imgSrc = enhancedUrl || originalUrl;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #D5D9D9',
        borderRadius: '12px',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #EAEDED',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#EAF7EE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles style={{ width: '14px', height: '14px', color: '#1D7A3B' }} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F1111' }}>
            {title}
          </span>
        </div>
        {showBoth && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#565959',
              fontWeight: 600,
            }}
          >
            <MoveHorizontal style={{ width: '14px', height: '14px', color: '#FF9900' }} />
            <span>Drag slider to compare</span>
          </div>
        )}
      </div>

      {/* ── Slider Viewport ── */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'relative',
          width: '100%',
          height: '380px',
          overflow: 'hidden',
          background: '#18181b',
          cursor: showBoth ? 'ew-resize' : 'default',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none', // Crucial to prevent mobile scroll canceling drag
        }}
      >
        {/* 1. Base Layer: AI Enhanced Image (Full Width) */}
        <img
          src={imgSrc}
          alt="AI Enhanced Product"
          draggable="false"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            userSelect: 'none',
            WebkitUserDrag: 'none',
          }}
          onError={(e) => {
            e.target.src = 'https://placehold.co/400x380/18181b/ffffff?text=AI+Enhanced+Image';
          }}
        />

        {/* AI Enhanced Badge (Top Right) */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            background: 'rgba(22, 101, 52, 0.92)',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'none',
          }}
        >
          <Sparkles style={{ width: '12px', height: '12px' }} />
          <span>AI ENHANCED</span>
        </div>

        {/* 2. Top Layer: Original Image (Clipped dynamically by polygon) */}
        {showBoth && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              clipPath: `polygon(0 0, ${pos}% 0, ${pos}% 100%, 0 100%)`,
              WebkitClipPath: `polygon(0 0, ${pos}% 0, ${pos}% 100%, 0 100%)`,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <img
              src={originalUrl}
              alt="Raw Artisan Product"
              draggable="false"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserDrag: 'none',
              }}
              onError={(e) => {
                e.target.src = 'https://placehold.co/400x380/27272a/ffffff?text=Original+Raw+Photo';
              }}
            />

            {/* Original Badge (Top Left) */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                zIndex: 10,
                background: 'rgba(24, 24, 27, 0.90)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(4px)',
                pointerEvents: 'none',
              }}
            >
              <Eye style={{ width: '12px', height: '12px' }} />
              <span>ORIGINAL</span>
            </div>
          </div>
        )}

        {/* 3. Divider Line & Interactive Handle Visual */}
        {showBoth && (
          <>
            {/* Vertical Divider Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${pos}%`,
                width: '2px',
                background: '#ffffff',
                boxShadow: '0 0 10px rgba(0,0,0,0.7)',
                transform: 'translateX(-50%)',
                zIndex: 20,
                pointerEvents: 'none',
              }}
            />

            {/* Circular Handle */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${pos}%`,
                transform: 'translate(-50%, -50%)',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '3px solid #FF9900',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 21,
                pointerEvents: 'none',
                transformOrigin: 'center center',
                scale: isDragging ? '1.15' : '1',
                transition: isDragging ? 'none' : 'scale 0.15s ease',
              }}
            >
              <MoveHorizontal style={{ width: '18px', height: '18px', color: '#FF9900' }} />
            </div>
          </>
        )}

        {/* 4. Native Range Input Overlay for Universal Compatibility & Accessibility */}
        {showBoth && (
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={pos}
            onChange={handleRangeChange}
            onInput={handleRangeChange}
            aria-label="Before and after comparison slider"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'ew-resize',
              zIndex: 30,
              margin: 0,
              padding: 0,
              touchAction: 'none',
              WebkitAppearance: 'none',
              appearance: 'none',
            }}
          />
        )}

        {/* Single Image Notice */}
        {!showBoth && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 15,
              background: 'rgba(0,0,0,0.75)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(4px)',
            }}
          >
            Upload a photo to see the live AI studio comparison
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #EAEDED',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FAFAFA',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#565959' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#1D7A3B',
              display: 'inline-block',
            }}
          />
          <span>Background Isolated · Studio Lighting · Shadow Applied</span>
        </div>
        {enhancedUrl && (
          <a
            href={enhancedUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#007185',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
            }}
          >
            <Download style={{ width: '14px', height: '14px' }} />
            <span>Download HD</span>
          </a>
        )}
      </div>
    </div>
  );
}
