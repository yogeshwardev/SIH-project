import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Banknote, Building2, Check, Minus, Plus, ShieldCheck, ShoppingBag, Store, Truck, Volume2, VolumeX, X, MapPin, Clock, Ruler } from 'lucide-react';
import { voiceAssistant } from '../services/voiceAssistant';
import { useLanguage } from '../context/LanguageContext';
import useDialogFocus from '../hooks/useDialogFocus';
import ProductGallery from './ProductGallery';
import ProductCard from './ProductCard';
import { productTitle, productPrice } from '../utils/productMedia';
import { cx, formatINR } from './ui';

export default function ProductDetailModal({ product, allProducts = [], storeName, onClose, onAddToCart, onBuyNow, onViewProduct, onVisitMaker, onRequestBulkQuote }) {
  const { locale, language, t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const dialogRef = useDialogFocus(Boolean(product), onClose);
  const scrollRef = useRef(null);

  useEffect(() => () => voiceAssistant.stopSpeaking(), []);
  useEffect(() => { voiceAssistant.stopSpeaking(); setSpeaking(false); setVoiceLoading(false); }, [locale]);
  // Switching to a related product resets the view.
  useEffect(() => { setQuantity(1); setAdded(false); scrollRef.current?.scrollTo({ top: 0 }); }, [product?.id]);
  if (!product) return null;

  const title = productTitle(product, locale);
  const translated = (locale === 'te' && (product.description_telugu || product.description_te)) || (locale === 'hi' && (product.description_hindi || product.description_hi));
  const description = translated || product.description || product.short_description || '';
  const price = productPrice(product);
  const stock = product.stock_quantity == null ? null : Number(product.stock_quantity);
  const soldOut = stock !== null && stock <= 0;
  const specs = Array.isArray(product.specifications) ? product.specifications : [];
  const facts = [['Craft', product.craft_type], ['Material', product.material], ['Technique', product.technique], ['Colour', product.color], ['Size', product.dimensions], ['Weight', product.weight], ['Made in', product.region]].filter(([, value]) => value);
  const fromMaker = allProducts.filter((item) => item.artisan_id && item.artisan_id === product.artisan_id && item.id !== product.id).slice(0, 4);
  const similar = allProducts.filter((item) => item.category === product.category && item.id !== product.id && item.artisan_id !== product.artisan_id).slice(0, 4);
  const makerInitials = (product.artisan_name || 'M').split(' ').map((word) => word[0]).slice(0, 2).join('');

  const speak = async () => {
    if (speaking || voiceLoading) { voiceAssistant.stopSpeaking(); setSpeaking(false); setVoiceLoading(false); return; }
    setVoiceLoading(true);
    const started = await voiceAssistant.speak(description ? `${title}. ${description}` : title, translated ? language.speechCode : 'en-IN', () => { setSpeaking(false); setVoiceLoading(false); });
    setVoiceLoading(false);
    setSpeaking(Boolean(started));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-brand-950/60 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" className="relative flex max-h-[100dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-modal outline-none animate-pop sm:max-h-[calc(100dvh-40px)] sm:rounded-3xl">
        <button type="button" onClick={onClose} aria-label={t('Close')} className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink-800 shadow-card hover:bg-white">
          <X className="h-5 w-5" />
        </button>

        <div ref={scrollRef} className="overflow-y-auto">
          {/* min-w-0 on both columns: a grid track is sized by its content by
              default, and the gallery's natural width was pushing the product
              page 153 px wider than the phone it was open on. */}
          <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr]">
            <div className="relative min-w-0 bg-paper-200 md:sticky md:top-0 md:h-[min(720px,calc(100dvh-40px))]">
              <ProductGallery product={product} alt={title} badge={product.badge} translate={t} />
            </div>

            <div className="flex min-w-0 flex-col p-5 sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-wider text-clay-600">{t(product.category || 'Handmade')}</p>
              <h1 id="product-dialog-title" className="mt-2 pr-8 text-[26px] font-extrabold leading-tight sm:text-3xl">{title}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-display text-3xl font-extrabold text-ink-950">{formatINR(price)}</span>
                <span className="text-sm text-ink-500">{t('Inclusive of all taxes · Free delivery')}</span>
              </div>
              <p className={cx('mt-1.5 text-sm font-semibold', soldOut ? 'text-rose-700' : stock !== null && stock <= 3 ? 'text-clay-700' : 'text-emerald-700')}>
                {soldOut ? t('Out of stock') : stock !== null && stock <= 3 ? `${t('Only')} ${stock} ${t('left — made in small batches')}` : t('In stock, ready to ship')}
              </p>

              {product.short_description && !translated && <p className="mt-4 text-[15px] font-medium leading-relaxed text-ink-800">{product.short_description}</p>}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex h-12 items-center rounded-full border border-line-strong">
                  <button type="button" aria-label={t('Decrease quantity')} disabled={quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-12 w-11 items-center justify-center rounded-l-full text-ink-700 hover:bg-paper-100 disabled:opacity-40"><Minus className="h-4 w-4" /></button>
                  <output className="w-8 text-center font-semibold tabular-nums">{quantity}</output>
                  <button type="button" aria-label={t('Increase quantity')} disabled={soldOut || (stock !== null && quantity >= stock)} onClick={() => setQuantity(quantity + 1)} className="flex h-12 w-11 items-center justify-center rounded-r-full text-ink-700 hover:bg-paper-100 disabled:opacity-40"><Plus className="h-4 w-4" /></button>
                </div>
                <button type="button" disabled={soldOut} onClick={() => { onAddToCart?.({ ...product, quantity }, { openDrawer: false }); setAdded(true); }} className="btn btn-cart btn-lg flex-1 rounded-full">
                  {added ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}{t(added ? 'Added to cart' : 'Add to cart')}
                </button>
                <button type="button" disabled={soldOut} onClick={() => { onClose(); onBuyNow?.({ ...product, quantity }); }} className="btn btn-buy btn-lg flex-1 rounded-full">{t('Buy now')}</button>
              </div>

              {/* Shops and emporiums buy by the dozen; give them a way to ask. */}
              <button
                type="button"
                onClick={() => onRequestBulkQuote?.(product)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 transition hover:border-brand-400 hover:bg-brand-100"
              >
                <Building2 className="h-4 w-4" />{t('Buying in bulk? Ask the artisan for a quote')}
              </button>

              <ul className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-ink-600">
                {[[Banknote, 'Cash on delivery'], [Truck, 'Free delivery'], [ShieldCheck, 'Reviewed listing']].map(([Icon, label]) => (
                  <li key={label} className="flex flex-col items-center gap-1.5 rounded-2xl bg-paper-100 px-2 py-3"><Icon className="h-5 w-5 text-brand-600" />{t(label)}</li>
                ))}
              </ul>

              {product.artisan_name && (
                <section className="mt-6 flex items-center gap-4 rounded-2xl border border-line p-4">
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 font-display font-bold text-white">{makerInitials}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink-500">{t('Made by')}</p>
                    <p className="truncate font-display font-bold text-ink-950">{storeName || product.artisan_name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-ink-500">{storeName && `${product.artisan_name} · `}<MapPin className="h-3 w-3 text-clay-500" />{product.region}</p>
                  </div>
                  {onVisitMaker && <button type="button" onClick={() => onVisitMaker(product.artisan_id)} className="btn btn-secondary btn-sm rounded-full"><Store className="h-4 w-4" />{t('Visit shop')}</button>}
                </section>
              )}

              {description && (
                <section className="mt-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">{t('About this piece')}</h2>
                    <button type="button" onClick={speak} aria-pressed={speaking} aria-busy={voiceLoading} className="btn btn-ghost btn-sm rounded-full text-brand-600">
                      {speaking || voiceLoading ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}{t(voiceLoading ? 'Please wait…' : speaking ? 'Stop' : 'Listen')}
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-700">{description}</p>
                </section>
              )}

              {facts.length > 0 && (
                <section className="mt-6">
                  <h2 className="text-lg font-bold">{t('Details')}</h2>
                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    {facts.map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-paper-100 px-3.5 py-2.5">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{t(label)}</dt>
                        <dd className="mt-0.5 text-sm font-medium text-ink-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {(specs.length > 0 || product.production_time) && (
                <ul className="mt-5 space-y-2 text-sm text-ink-700">
                  {product.production_time && <li className="flex gap-2.5"><Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-clay-500" />{t('Takes about')} {product.production_time} {t('to make by hand')}</li>}
                  {specs.map((spec) => <li key={spec} className="flex gap-2.5"><Ruler className="mt-0.5 h-4 w-4 flex-shrink-0 text-clay-500" />{spec}</li>)}
                </ul>
              )}
            </div>
          </div>

          {(fromMaker.length > 0 || similar.length > 0) && (
            <div className="space-y-8 border-t border-line bg-paper-50 px-6 py-8 sm:px-9">
              {[[fromMaker, `${t('More from')} ${storeName || product.artisan_name}`], [similar, t('You may also like')]].filter(([items]) => items.length).map(([items, heading]) => (
                <section key={heading}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">{heading}</h2>
                    {items === fromMaker && onVisitMaker && <button type="button" onClick={() => onVisitMaker(product.artisan_id)} className="link inline-flex items-center gap-1 text-sm">{t('See all')}<ArrowRight className="h-4 w-4" /></button>}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {items.map((item) => <ProductCard key={item.id} product={item} compact onAddToCart={onAddToCart} onViewDetail={onViewProduct} />)}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
