import React, { useEffect, useState } from 'react';
import { Check, ChevronRight, MapPin, PackageSearch, Search, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { getRecentOrders } from '../utils/recentOrders';
import { Modal, Notice, Spinner, StatusPill, cx, formatDate, formatINR } from './ui';

export const ORDER_FLOW = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];

export function OrderTimeline({ status, compact = false }) {
  const { t } = useLanguage();
  if (status === 'Cancelled') {
    return <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800"><XCircle className="h-4 w-4" />{t('This order was cancelled. Any reserved stock has been released.')}</p>;
  }
  const current = ORDER_FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-1">
      {ORDER_FLOW.map((step, index) => {
        const done = index <= current;
        return (
          <li key={step} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cx('h-0.5 flex-1', index === 0 ? 'bg-transparent' : done ? 'bg-brand-700' : 'bg-line-strong')} />
              <span className={cx('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold', done ? 'bg-brand-600 text-white' : 'border-2 border-line-strong bg-white text-ink-400', index === current && 'ring-4 ring-brand-600/15')}>
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className={cx('h-0.5 flex-1', index === ORDER_FLOW.length - 1 ? 'bg-transparent' : index < current ? 'bg-brand-700' : 'bg-line-strong')} />
            </div>
            {!compact && <span className={cx('mt-2 text-xs font-medium', done ? 'text-ink-900' : 'text-ink-400')}>{t(step)}</span>}
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderTrackingModal({ isOpen, onClose, currentUser }) {
  const { t } = useLanguage();
  const [recent] = useState(getRecentOrders);
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState(currentUser?.email?.includes('@') ? currentUser.email : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  const lookup = async (number = orderNumber, address = email) => {
    if (!number.trim() || !address.trim()) { setError(t('Enter your order number and the email used at checkout.')); return; }
    setLoading(true);
    setError('');
    try {
      setOrder(await api.trackOrder(number, address));
    } catch (lookupError) {
      setOrder(null);
      setError(lookupError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && recent.length === 1) {
      setOrderNumber(recent[0].order_number);
      setEmail(recent[0].email);
      lookup(recent[0].order_number, recent[0].email);
    }
  }, [isOpen]);

  return (
    <Modal open={isOpen} onClose={onClose} size="lg" title={t('Track your order')} description={t('Use the order number from your confirmation and the email you ordered with.')}>
      <div className="p-5 sm:p-6">
        <form onSubmit={(event) => { event.preventDefault(); lookup(); }} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="track-number" className="label">{t('Order number')}</label>
            <input id="track-number" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="CL-260914-A1B2C3" className="field font-mono uppercase placeholder:normal-case" autoComplete="off" />
          </div>
          <div>
            <label htmlFor="track-email" className="label">{t('Email')}</label>
            <input id="track-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="field" autoComplete="email" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary h-[42px]">{loading ? <Spinner className="h-4 w-4" /> : <Search className="h-4 w-4" />}{t('Track')}</button>
        </form>

        {error && <Notice tone="error" className="mt-4">{error}</Notice>}

        {!order && recent.length > 0 && (
          <section className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">{t('Orders placed on this device')}</h3>
            <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
              {recent.map((item) => (
                <li key={item.order_number}>
                  <button type="button" onClick={() => { setOrderNumber(item.order_number); setEmail(item.email); lookup(item.order_number, item.email); }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper-50">
                    <PackageSearch className="h-5 w-5 text-ink-400" />
                    <span className="flex-1">
                      <span className="block font-mono text-sm font-semibold text-ink-900">{item.order_number}</span>
                      <span className="text-xs text-ink-500">{formatDate(item.placed_at)} · {formatINR(item.total)}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-ink-400" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!order && !recent.length && !error && (
          <div className="mt-8 flex flex-col items-center py-6 text-center text-ink-500">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-paper-200"><PackageSearch className="h-6 w-6" /></span>
            <p className="mt-3 max-w-xs text-sm">{t('Your order number starts with CL- and is shown right after checkout.')}</p>
          </div>
        )}

        {order && (
          <article className="mt-6 overflow-hidden rounded-2xl border border-line animate-fade-up">
            <header className="flex flex-wrap items-center justify-between gap-3 bg-paper-50 px-5 py-4">
              <div>
                <p className="font-mono text-base font-semibold text-ink-950">{order.order_number}</p>
                <p className="text-xs text-ink-500">{t('Placed')} {formatDate(order.created_at, true)} · {t('Updated')} {formatDate(order.updated_at, true)}</p>
              </div>
              <StatusPill status={order.status} label={t(order.status)} />
            </header>
            <div className="px-5 py-6"><OrderTimeline status={order.status} /></div>
            <div className="grid gap-5 border-t border-line px-5 py-5 sm:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-500">{t('Items')}</h4>
                <ul className="mt-2 space-y-2.5">
                  {order.items.map((item) => (
                    <li key={item.product_id} className="flex items-center gap-3">
                      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-paper-200 p-1">{item.product_image && <img src={item.product_image} alt="" className="h-full object-contain" />}</span>
                      <span className="flex-1 text-sm text-ink-800">{item.product_name} <span className="text-ink-500">× {item.quantity}</span></span>
                      <span className="text-sm font-medium tabular-nums">{formatINR(item.line_total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-500">{t('Delivery address')}</h4>
                  <p className="mt-2 flex gap-2 text-sm leading-relaxed text-ink-800"><MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-400" /><span>{order.buyer_name}<br />{order.address_line1}{order.address_line2 && `, ${order.address_line2}`}<br />{order.city}, {order.state} {order.postal_code}</span></p>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-paper-50 px-4 py-3 text-sm">
                  <span className="text-ink-600">{t('Cash on delivery')} · {t(order.payment_status)}</span>
                  <strong className="tabular-nums text-ink-950">{formatINR(order.total_amount)}</strong>
                </div>
              </div>
            </div>
          </article>
        )}
      </div>
    </Modal>
  );
}
