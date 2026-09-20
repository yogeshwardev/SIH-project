import React, { useCallback, useRef, useState } from 'react';
import { Download, MoveHorizontal, Sparkles } from 'lucide-react';

export default function BeforeAfterSlider({ originalUrl, enhancedUrl, title = 'Photo preview' }) {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);
  const showBoth = Boolean(originalUrl && enhancedUrl);
  const imgSrc = enhancedUrl || originalUrl;

  const updatePosition = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const onPointerDown = (event) => {
    if (!showBoth || (event.button !== undefined && event.button !== 0)) return;
    setDragging(true);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* unsupported */ }
    updatePosition(event.clientX);
  };
  const onPointerUp = (event) => {
    setDragging(false);
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* unsupported */ }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink-950"><Sparkles className="h-4 w-4 text-clay-500" />{title}</span>
        {showBoth && <span className="flex items-center gap-1.5 text-xs text-ink-500"><MoveHorizontal className="h-3.5 w-3.5" />Drag to compare</span>}
      </div>

      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={(event) => dragging && updatePosition(event.clientX)}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative h-[360px] w-full select-none overflow-hidden bg-[repeating-conic-gradient(#e9ecf1_0%_25%,#f7f8fa_0%_50%)] bg-[length:24px_24px]"
        style={{ cursor: showBoth ? 'ew-resize' : 'default', touchAction: 'none' }}
      >
        {imgSrc && <img src={imgSrc} alt="Enhanced product" draggable="false" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />}
        <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-md bg-brand-600/90 px-2 py-1 text-[11px] font-semibold text-white">Enhanced</span>

        {showBoth && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-paper-200" style={{ clipPath: `polygon(0 0, ${pos}% 0, ${pos}% 100%, 0 100%)` }}>
              <img src={originalUrl} alt="Original product" draggable="false" className="absolute inset-0 h-full w-full object-contain" />
              <span className="absolute left-3 top-3 rounded-md bg-ink-900/85 px-2 py-1 text-[11px] font-semibold text-white">Original</span>
            </div>
            <div className="pointer-events-none absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(0,0,0,.45)]" style={{ left: `${pos}%` }} />
            <div className={`pointer-events-none absolute top-1/2 z-20 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-700 shadow-lift ring-2 ring-brand-600 transition-transform ${dragging ? 'scale-110' : ''}`} style={{ left: `${pos}%` }}>
              <MoveHorizontal className="h-[18px] w-[18px]" />
            </div>
            <input type="range" min="0" max="100" step="0.5" value={pos} onChange={(event) => setPos(Number(event.target.value))} aria-label="Compare original and enhanced photo" className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0" />
          </>
        )}
      </div>

      {enhancedUrl && (
        <div className="flex items-center justify-between gap-3 border-t border-line bg-paper-50 px-4 py-2.5 text-xs text-ink-500">
          <span>Background removed · light balanced</span>
          <a href={enhancedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"><Download className="h-3.5 w-3.5" />Open full size</a>
        </div>
      )}
    </div>
  );
}
