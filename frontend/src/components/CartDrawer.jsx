import React from 'react';
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import useDialogFocus from '../hooks/useDialogFocus';
import ProductImage from './ProductImage';
import { productTitle, productPrice } from '../utils/productMedia';
import { formatINR } from './ui';

export default function CartDrawer({ isOpen, onClose, cartItems = [], onUpdateQuantity, onRemoveItem, onCheckout }) {
  const { locale, t } = useLanguage();
  const dialogRef = useDialogFocus(isOpen, onClose);
  if (!isOpen) return null;
  const count = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = cartItems.reduce((sum, item) => sum + productPrice(item) * (item.quantity || 1), 0);

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-brand-950/50 backdrop-blur-[2px] animate-fade-in" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="cart-title" className="flex h-full w-full max-w-md flex-col bg-white shadow-modal outline-none animate-slide-in">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 id="cart-title" className="text-lg font-semibold text-ink-950">{t('Your cart')}</h2>
            <p className="text-sm text-ink-500">{count} {t('items')}</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label={t('Close')}><X className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-5">
          {!cartItems.length ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-paper-200 text-ink-400"><ShoppingBag className="h-7 w-7" /></span>
              <h3 className="mt-4 text-base font-semibold text-ink-900">{t('Your cart is empty')}</h3>
              <p className="mt-1 text-sm text-ink-500">{t('Discover pieces made by hand across India.')}</p>
              <button type="button" onClick={onClose} className="btn btn-primary mt-6">{t('Continue shopping')}</button>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {cartItems.map((item) => {
                const key = item._catalogKey || item.id;
                const title = productTitle(item, locale);
                const quantity = item.quantity || 1;
                const atStock = item.stock_quantity != null && quantity >= Number(item.stock_quantity);
                return (
                  <li key={key} className="flex gap-4 py-5">
                    <div className="flex h-24 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-paper-200 p-2 [&_img]:h-full [&_img]:object-contain">
                      <ProductImage product={item} alt={title} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink-900">{title}</h3>
                        <button type="button" onClick={() => onRemoveItem(key)} className="-mr-2 -mt-1 rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-700" aria-label={t('Remove') + ': ' + title}><Trash2 className="h-4 w-4" /></button>
                      </div>
                      {item.artisan_name && <p className="mt-0.5 truncate text-xs text-ink-500">{item.artisan_name}</p>}
                      <div className="mt-auto flex items-end justify-between pt-3">
                        <div className="inline-flex items-center rounded-lg border border-line-strong">
                          <button type="button" aria-label={t('Decrease quantity')} disabled={quantity <= 1} onClick={() => onUpdateQuantity(key, quantity - 1)} className="flex h-8 w-8 items-center justify-center text-ink-700 hover:bg-paper-200 disabled:opacity-40"><Minus className="h-3.5 w-3.5" /></button>
                          <output className="w-8 text-center text-sm font-semibold tabular-nums">{quantity}</output>
                          <button type="button" aria-label={t('Increase quantity')} disabled={atStock} onClick={() => onUpdateQuantity(key, quantity + 1)} className="flex h-8 w-8 items-center justify-center text-ink-700 hover:bg-paper-200 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <span className="text-sm font-semibold text-ink-950 tabular-nums">{formatINR(productPrice(item) * quantity)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!!cartItems.length && (
          <footer className="border-t border-line bg-paper-50 px-5 py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-600">{t('Subtotal')}</span>
              <strong className="text-xl font-semibold text-ink-950 tabular-nums">{formatINR(subtotal)}</strong>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500"><Truck className="h-3.5 w-3.5" />{t('Free shipping · Cash on delivery')}</p>
            <button type="button" onClick={onCheckout} className="btn btn-buy btn-lg mt-4 w-full">{t('Place order')}<ArrowRight className="h-[18px] w-[18px]" /></button>
            <button type="button" onClick={onClose} className="btn btn-ghost mt-1.5 w-full">{t('Continue shopping')}</button>
          </footer>
        )}
      </section>
    </div>
  );
}
