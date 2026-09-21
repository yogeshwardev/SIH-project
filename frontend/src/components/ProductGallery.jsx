import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { productImageSources } from '../utils/productMedia';

export default function ProductGallery({ product, alt, badge, translate = value => value }) {
  const images = productImageSources(product);
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => { setActive(0); setZoomed(false); }, [product?.id]);
  useEffect(() => {
    if (!zoomed) return undefined;
    const onKeyDown = event => {
      if (event.key === 'Escape') setZoomed(false);
      if (event.key === 'ArrowLeft') setActive(current => (current - 1 + images.length) % images.length);
      if (event.key === 'ArrowRight') setActive(current => (current + 1) % images.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zoomed, images.length]);

  if (!images.length) {
    return <div className="flex h-full min-h-[420px] items-center justify-center bg-paper-100 text-sm text-ink-500">{translate('Photo unavailable')}</div>;
  }

  const move = direction => setActive(current => (current + direction + images.length) % images.length);

  return (
    <>
      <div className="flex h-full min-h-[500px] flex-col bg-paper-100 p-3 sm:p-4 md:flex-row md:gap-3">
        {images.length > 1 && (
          <div className="order-2 mt-3 flex gap-2 overflow-x-auto pb-1 md:order-1 md:mt-0 md:w-[72px] md:flex-col md:overflow-y-auto md:overflow-x-hidden">
            {images.map((source, index) => (
              <button
                key={source}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`${translate('Show product view')} ${index + 1}`}
                aria-current={active === index ? 'true' : undefined}
                className={`h-[68px] w-[68px] flex-none overflow-hidden rounded-xl border-2 bg-white p-1 transition ${active === index ? 'border-brand-600 ring-2 ring-brand-600/15' : 'border-transparent hover:border-brand-300'}`}
              >
                <img src={source} alt="" className="h-full w-full rounded-lg object-contain" />
              </button>
            ))}
          </div>
        )}

        <div className="relative order-1 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-white md:order-2">
          <button type="button" onClick={() => setZoomed(true)} className="group flex h-full min-h-[420px] w-full items-center justify-center p-5 sm:p-8" aria-label={translate('Open full-size photo')}>
            <img src={images[active]} alt={`${alt} — ${translate('view')} ${active + 1}`} className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-[1.02]" />
            <span className="absolute bottom-4 right-4 flex h-10 items-center gap-2 rounded-full bg-white/95 px-3 text-xs font-bold text-ink-800 shadow-card"><Expand className="h-4 w-4" />{translate('Zoom')}</span>
          </button>
          {badge && <span className="absolute left-4 top-4 rounded-full bg-clay-400 px-3 py-1.5 text-xs font-bold text-ink-950 shadow-card">{translate(badge)}</span>}
          {images.length > 1 && (
            <>
              <button type="button" onClick={() => move(-1)} aria-label={translate('Previous photo')} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink-900 shadow-card hover:bg-white"><ChevronLeft className="h-5 w-5" /></button>
              <button type="button" onClick={() => move(1)} aria-label={translate('Next photo')} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink-900 shadow-card hover:bg-white"><ChevronRight className="h-5 w-5" /></button>
              <span className="absolute bottom-4 left-4 rounded-full bg-brand-950/80 px-3 py-1.5 text-xs font-bold text-white">{active + 1} / {images.length}</span>
            </>
          )}
        </div>
      </div>

      {zoomed && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-brand-950/95 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={translate('Full-size product photo')} onMouseDown={event => { if (event.target === event.currentTarget) setZoomed(false); }}>
          <button type="button" onClick={() => setZoomed(false)} aria-label={translate('Close full-size photo')} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-900 shadow-card"><X className="h-5 w-5" /></button>
          <img src={images[active]} alt={`${alt} — ${translate('view')} ${active + 1}`} className="max-h-full max-w-full object-contain" />
          {images.length > 1 && <>
            <button type="button" onClick={() => move(-1)} aria-label={translate('Previous photo')} className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-900 shadow-card"><ChevronLeft /></button>
            <button type="button" onClick={() => move(1)} aria-label={translate('Next photo')} className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-900 shadow-card"><ChevronRight /></button>
          </>}
        </div>
      )}
    </>
  );
}
