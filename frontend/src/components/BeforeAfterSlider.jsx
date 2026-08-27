import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Eye, Download, MoveHorizontal } from 'lucide-react';

export default function BeforeAfterSlider({
  originalUrl,
  enhancedUrl,
  title = 'AI Studio Enhancement',
}) {
  const [pos, setPos]           = useState(50);   // 0–100 %
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);

  /* ── Core position calculation ── */
  const calcPos = useCallback((clientX) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct  = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  /* ── Mouse events ── */
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
    calcPos(e.clientX);
  }, [calcPos]);

  /* ── Touch events ── */
  const onTouchStart = useCallback((e) => {
    setDragging(true);
    calcPos(e.touches[0].clientX);
  }, [calcPos]);

  /* ── Global move / up listeners (added when dragging) ── */
  useEffect(() => {
    if (!dragging) return;

    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      calcPos(clientX);
    };
    const onStop = () => setDragging(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onStop);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend',  onStop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onStop);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend',  onStop);
    };
  }, [dragging, calcPos]);

  const showBoth = !!originalUrl && !!enhancedUrl;
  const imgSrc   = enhancedUrl || originalUrl;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #D5D9D9',
      borderRadius: '12px',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #EAEDED', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#EAF7EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles style={{ width: '14px', height: '14px', color: '#1D7A3B' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F1111' }}>AI Studio Enhancement</span>
        </div>
        {showBoth && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#8D9096' }}>
            <MoveHorizontal style={{ width: '13px', height: '13px' }} />
            Drag to compare
          </div>
        )}
      </div>

      {/* Slider container */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{
          position: 'relative',
          width: '100%',
          height: '340px',
          overflow: 'hidden',
          background: '#1a1a1a',
          cursor: dragging ? 'ew-resize' : showBoth ? 'ew-resize' : 'default',
          userSelect: 'none',
          /* Prevent native image drag from interrupting our drag */
          WebkitUserDrag: 'none',
        }}
      >
        {/* ── AFTER / enhanced image (full width, always visible underneath) ── */}
        <img
          src={imgSrc}
          alt="AI Enhanced"
          draggable="false"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
          onError={e => { e.target.src = 'https://placehold.co/400x340/1a1a1a/555?text=Enhanced'; }}
        />

        {/* AFTER badge */}
        <div style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 15,
          background: 'rgba(29,122,59,0.92)',
          color: '#fff', fontSize: '10px', fontWeight: 800,
          padding: '3px 8px', borderRadius: '4px',
          display: 'flex', alignItems: 'center', gap: '4px',
          backdropFilter: 'blur(4px)',
        }}>
          <Sparkles style={{ width: '10px', height: '10px' }} />
          AI ENHANCED
        </div>

        {/* ── BEFORE / original image — clipped to left side ── */}
        {showBoth && (
          <div
            style={{
              position: 'absolute', inset: 0,
              overflow: 'hidden',
              /* The clip: only show the left `pos`% of the container */
              clipPath: `inset(0 ${100 - pos}% 0 0)`,
              pointerEvents: 'none',
            }}
          >
            <img
              src={originalUrl}
              alt="Original Photo"
              draggable="false"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'contain',
              }}
              onError={e => { e.target.src = 'https://placehold.co/400x340/2a2a2a/888?text=Original'; }}
            />

            {/* BEFORE badge */}
            <div style={{
              position: 'absolute', top: '10px', left: '10px', zIndex: 15,
              background: 'rgba(0,0,0,0.80)',
              color: '#fff', fontSize: '10px', fontWeight: 800,
              padding: '3px 8px', borderRadius: '4px',
              display: 'flex', alignItems: 'center', gap: '4px',
              backdropFilter: 'blur(4px)',
            }}>
              <Eye style={{ width: '10px', height: '10px' }} />
              ORIGINAL
            </div>
          </div>
        )}

        {/* ── Divider line + drag handle ── */}
        {showBoth && (
          <div
            style={{
              position: 'absolute', top: 0, bottom: 0, zIndex: 20,
              left: `${pos}%`,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          >
            {/* Vertical line */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: '50%',
              width: '2px', background: '#fff',
              boxShadow: '0 0 8px rgba(0,0,0,0.6)',
              transform: 'translateX(-50%)',
            }} />

            {/* Circular handle */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '36px', height: '36px', borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
              border: '2px solid #FF9900',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: dragging ? 'none' : 'transform 0.1s ease',
              /* Slightly scale up when dragging for feedback */
              scale: dragging ? '1.12' : '1',
            }}>
              <MoveHorizontal style={{ width: '16px', height: '16px', color: '#FF9900' }} />
            </div>
          </div>
        )}

        {/* Only one image — just show it without slider UI */}
        {!showBoth && (
          <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 15,
            background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '11px', fontWeight: 600,
            padding: '4px 10px', borderRadius: '6px', whiteSpace: 'nowrap', backdropFilter: 'blur(4px)' }}>
            Upload an original photo to see the comparison
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #EAEDED', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#8D9096' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1D7A3B', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          Background Isolated · Studio Lighting · Shadow Applied
        </div>
        {enhancedUrl && (
          <a
            href={enhancedUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '11px', fontWeight: 700, color: '#007185', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
          >
            <Download style={{ width: '13px', height: '13px' }} />
            Download HD
          </a>
        )}
      </div>
    </div>
  );
}
