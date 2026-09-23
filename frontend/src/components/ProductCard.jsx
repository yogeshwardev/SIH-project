import React, { useState } from 'react';
import { Check, MapPin, Plus, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ProductImage from './ProductImage';
import { productPrice, productTitle } from '../utils/productMedia';
import { cx, formatINR } from './ui';

// Studio-enhanced uploads are cut-out PNGs (contain); catalog photos are full-bleed (cover).
const isCutout = (product) => /\.png($|\?)/i.test(product.enhanced_image || product.original_image || '');

export default function ProductCard({ product, onAddToCart, onViewDetail, compact = false }) {
  const { locale, t } = useLanguage();
  const [added, setAdded] = useState(false);
  const price = productPrice(product);
  const title = productTitle(product, locale);
  const stock = product.stock_quantity == null ? null : Number(product.stock_quantity);
  const soldOut = stock !== null && stock <= 0;
  const lowStock = stock !== null && stock > 0 && stock <= 3;
  const state = (product.region || '').split(',').pop().trim();
  const cutout = isCutout(product);

  const add = (event) => {
    event.stopPropagation();
    onAddToCart?.(product, { openDrawer: false });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="group flex h-full flex-col">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onViewDetail?.(product)}
        onKeyDown={(event) => { if (event.key === 'Enter') onViewDetail?.(product); }}
        aria-label={t('View product') + ': ' + title}
        className={cx('relative block w-full cursor-pointer overflow-hidden rounded-2xl', compact ? 'aspect-square' : 'aspect-[4/5]', cutout ? 'bg-paper-200' : 'bg-paper-300')}
      >
        <span className={cx('absolute inset-0 flex items-center justify-center [&_img]:h-full [&_img]:w-full [&_img]:transition [&_img]:duration-500 group-hover:[&_img]:scale-[1.04]', cutout ? 'p-5 [&_img]:object-contain' : '[&_img]:object-cover')}>
          <ProductImage product={product} alt={title} />
        </span>
        <span className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {product.badge && <span className="rounded-full bg-clay-400 px-2.5 py-1 text-[11px] font-bold text-ink-950 shadow-xs">{t(product.badge)}</span>}
          {lowStock && <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-rose-700 shadow-xs">{t('Only')} {stock} {t('left')}</span>}
          {stock !== null && stock > 3 && <span className="rounded-full bg-emerald-50/95 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 shadow-xs">{stock} {t('in stock')}</span>}
        </span>
        {soldOut ? (
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-ink-950/80 py-2 text-center text-xs font-semibold text-white">{t('Out of stock')}</span>
        ) : (
          <button
            type="button"
            onClick={add}
            aria-label={`${t('Add to cart')}: ${title}`}
            className={cx('absolute bottom-3 right-3 flex h-11 items-center gap-2 rounded-full px-3.5 text-sm font-bold shadow-lift transition sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus:translate-y-0 sm:focus:opacity-100', added ? 'bg-emerald-600 text-white sm:translate-y-0 sm:opacity-100' : 'bg-white text-ink-950 hover:bg-clay-400')}
          >
            {added ? <Check className="h-4 w-4" /> : compact ? <Plus className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            {!compact && <span>{t(added ? 'Added' : 'Add')}</span>}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pt-3">
        {/* Truncating the row cut the state in half - "Uttar Pra". The maker's
            name gives way first, and the place stays whole. */}
        <p className="flex items-center gap-1 text-xs font-medium text-ink-500">
          <span className="min-w-0 truncate">{product.artisan_name || t('Artisan')}</span>
          {state && (
            <>
              <span className="text-ink-300">·</span>
              <MapPin className="h-3 w-3 flex-shrink-0 text-clay-500" />
              <span className="flex-shrink-0">{state}</span>
            </>
          )}
        </p>
        <button type="button" onClick={() => onViewDetail?.(product)} className={cx('mt-1 text-left font-display font-semibold leading-snug text-ink-950 hover:text-brand-600', compact ? 'line-clamp-1 text-sm' : 'line-clamp-2 min-h-[2.6rem] text-[15px]')}>
          {title}
        </button>
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 pt-2">
          <span className={cx('font-display font-bold text-ink-950', compact ? 'text-base' : 'text-lg')}>{formatINR(price)}</span>
          {!compact && product.craft_type && <span className="text-[11px] font-medium leading-tight text-brand-600">{product.craft_type}</span>}
        </div>
      </div>
    </article>
  );
}
