import React, { useMemo, useState } from 'react';
import { ArrowRight, Download, Mail, MapPin, Phone, Search, ShoppingBag, X } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { OrderTimeline } from '../../components/OrderTrackingModal';
import { EmptyState, Modal, Notice, Spinner, StatusPill, cx, downloadCsv, formatDate, formatINR } from '../../components/ui';
import { CANCELLABLE, NEXT_STATUS, storeLines, storeOrderValue } from './sellerData';

const TABS = [
  ['action', 'Needs action', ['Placed', 'Confirmed', 'Packed']],
  ['Shipped', 'Shipped', ['Shipped']],
  ['Delivered', 'Delivered', ['Delivered']],
  ['Cancelled', 'Cancelled', ['Cancelled']],
  ['all', 'All', null],
];

export default function SellerOrders({ orders, storeId, loading, setOrders }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState(orders.some((order) => ['Placed', 'Confirmed', 'Packed'].includes(order.status)) ? 'action' : 'all');
  const [query, setQuery] = useState('');
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const statusesFor = (id) => TABS.find((entry) => entry[0] === id)[2];
  const countFor = (id) => { const statuses = statusesFor(id); return statuses ? orders.filter((order) => statuses.includes(order.status)).length : orders.length; };

  const visible = useMemo(() => {
    const statuses = statusesFor(tab);
    const needle = query.trim().toLowerCase();
    return orders
      .filter((order) => !statuses || statuses.includes(order.status))
      .filter((order) => !needle || [order.order_number, order.buyer_name, order.city, order.state, order.postal_code, ...storeLines(order, storeId).map((item) => item.product_name)].join(' ').toLowerCase().includes(needle));
  }, [orders, tab, query, storeId]);

  const selected = orders.find((order) => order.order_number === selectedNumber);

  const advance = async (order, status) => {
    setBusy(order.order_number + status);
    setError('');
    try {
      const updated = await api.updateOrderStatus(order.order_number, status);
      setOrders((list) => list.map((item) => (item.order_number === updated.order_number ? updated : item)));
      return true;
    } catch (updateError) {
      setError(updateError.message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = () => downloadCsv(`craftlink-orders-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['Order', 'Placed on', 'Status', 'Buyer', 'Phone', 'City', 'State', 'Pincode', 'Items', 'Your amount (INR)', 'Payment'],
    ...visible.map((order) => [order.order_number, formatDate(order.created_at, true), order.status, order.buyer_name, order.buyer_phone, order.city, order.state, order.postal_code, storeLines(order, storeId).map((item) => `${item.product_name} x${item.quantity}`).join('; '), storeOrderValue(order, storeId), order.payment_status]),
  ]);

  return (
    <div className="space-y-5">
      {error && <Notice tone="error" onDismiss={() => setError('')}>{error}</Notice>}

      <div className="border-b border-line">
        <div className="scrollbar-none -mb-px flex gap-6 overflow-x-auto" role="tablist">
          {TABS.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cx('flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition', tab === id ? 'border-clay-500 text-ink-950' : 'border-transparent text-ink-500 hover:text-ink-900')}>
              {t(label)}
              <span className={cx('rounded-full px-2 py-0.5 text-xs tabular-nums', tab === id ? 'bg-brand-600 text-white' : 'bg-paper-200 text-ink-600')}>{countFor(id)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search order number, buyer, city or product')} aria-label={t('Search orders')} className="field pl-9" />
          {query && <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-800" aria-label={t('Clear search')}><X className="h-4 w-4" /></button>}
        </div>
        <button type="button" onClick={exportCsv} disabled={!visible.length} className="btn btn-secondary"><Download className="h-4 w-4" />{t('Export')}</button>
      </div>

      {loading && !orders.length ? (
        <div className="space-y-3">{[0, 1, 2].map((index) => <div key={index} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : !visible.length ? (
        <div className="card">
          <EmptyState icon={ShoppingBag} title={t(orders.length ? 'Nothing here' : 'No orders yet')}>
            {t(orders.length ? 'No orders match this view.' : 'When a buyer orders one of your live products, it shows up here.')}
          </EmptyState>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((order) => {
            const lines = storeLines(order, storeId);
            const next = NEXT_STATUS[order.status];
            return (
              <li key={order.id} className="card overflow-hidden transition hover:border-line-strong">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper-50 px-5 py-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <button type="button" onClick={() => setSelectedNumber(order.order_number)} className="font-mono font-semibold text-ink-950 hover:text-brand-700">{order.order_number}</button>
                    <span className="text-ink-500">{formatDate(order.created_at, true)}</span>
                  </div>
                  <StatusPill status={order.status} label={t(order.status)} />
                </div>
                <div className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_200px_auto] md:items-center">
                  <ul className="space-y-2">
                    {lines.map((item) => (
                      <li key={item.product_id} className="flex items-center gap-3">
                        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-paper-200 p-1">{item.product_image && <img src={item.product_image} alt="" className="h-full object-contain" />}</span>
                        <span className="min-w-0 flex-1 text-sm"><span className="line-clamp-1 font-medium text-ink-900">{item.product_name}</span><span className="text-ink-500">{item.quantity} × {formatINR(item.unit_price)}</span></span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-sm">
                    <p className="font-medium text-ink-900">{order.buyer_name}</p>
                    <p className="text-ink-500">{order.city}, {order.state}</p>
                    <p className="mt-1 font-semibold tabular-nums text-ink-950">{formatINR(storeOrderValue(order, storeId))} <span className="text-xs font-normal text-ink-500">· COD</span></p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <button type="button" onClick={() => setSelectedNumber(order.order_number)} className="btn btn-secondary btn-sm">{t('Details')}</button>
                    {next && (
                      <button type="button" onClick={() => advance(order, next.status)} disabled={Boolean(busy)} className="btn btn-primary btn-sm">
                        {busy === order.order_number + next.status ? <Spinner className="h-3.5 w-3.5" /> : null}{t(next.label)}<ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {selected && <OrderDetailModal order={selected} storeId={storeId} busy={busy} onAdvance={advance} onClose={() => setSelectedNumber(null)} />}
    </div>
  );
}

function OrderDetailModal({ order, storeId, busy, onAdvance, onClose }) {
  const { t } = useLanguage();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const lines = storeLines(order, storeId);
  const otherItems = order.items.length - lines.length;
  const next = NEXT_STATUS[order.status];
  const cancellable = CANCELLABLE.includes(order.status);

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={<span className="font-mono">{order.order_number}</span>}
      description={`${t('Placed')} ${formatDate(order.created_at, true)}`}
      footer={confirmCancel ? (
        <>
          <span className="mr-auto text-sm text-red-800">{t('Cancel this order and return the stock?')}</span>
          <button type="button" onClick={() => setConfirmCancel(false)} className="btn btn-secondary">{t('No, keep it')}</button>
          <button type="button" disabled={Boolean(busy)} onClick={async () => { if (await onAdvance(order, 'Cancelled')) setConfirmCancel(false); }} className="btn bg-red-700 text-white hover:bg-red-800">{busy && <Spinner className="h-4 w-4" />}{t('Yes, cancel order')}</button>
        </>
      ) : (next || cancellable) ? (
        <>
          {cancellable && <button type="button" onClick={() => setConfirmCancel(true)} className="btn btn-danger mr-auto">{t('Cancel order')}</button>}
          {next && <button type="button" disabled={Boolean(busy)} onClick={() => onAdvance(order, next.status)} className="btn btn-primary">{busy ? <Spinner className="h-4 w-4" /> : null}{t(next.label)}<ArrowRight className="h-4 w-4" /></button>}
        </>
      ) : null}
    >
      <div className="space-y-6 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <StatusPill status={order.status} label={t(order.status)} />
          <span className="text-sm text-ink-500">{t('Payment')}: {t('Cash on delivery')} · {t(order.payment_status)}</span>
        </div>
        <OrderTimeline status={order.status} />

        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">{t('Ship to')}</h3>
            <div className="mt-2 space-y-1.5 rounded-xl border border-line p-4 text-sm">
              <p className="font-semibold text-ink-950">{order.buyer_name}</p>
              <p className="flex gap-2 text-ink-700"><MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-400" /><span>{order.address_line1}{order.address_line2 && `, ${order.address_line2}`}<br />{order.city}, {order.state} — {order.postal_code}</span></p>
              <a href={`tel:${order.buyer_phone}`} className="flex items-center gap-2 text-brand-700 hover:underline"><Phone className="h-4 w-4" />{order.buyer_phone}</a>
              <a href={`mailto:${order.buyer_email}`} className="flex items-center gap-2 break-all text-brand-700 hover:underline"><Mail className="h-4 w-4 flex-shrink-0" />{order.buyer_email}</a>
            </div>
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">{t('Your items')}</h3>
            <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
              {lines.map((item) => (
                <li key={item.product_id} className="flex items-center gap-3 p-3">
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-paper-200 p-1">{item.product_image && <img src={item.product_image} alt="" className="h-full object-contain" />}</span>
                  <span className="min-w-0 flex-1 text-sm"><span className="line-clamp-2 font-medium text-ink-900">{item.product_name}</span><span className="text-ink-500">{item.quantity} × {formatINR(item.unit_price)}</span></span>
                  <span className="text-sm font-semibold tabular-nums">{formatINR(item.line_total)}</span>
                </li>
              ))}
              <li className="flex justify-between bg-paper-50 p-3 text-sm font-semibold"><span>{t('Your total')}</span><span className="tabular-nums">{formatINR(storeOrderValue(order, storeId))}</span></li>
            </ul>
            {otherItems > 0 && storeId != null && <p className="mt-2 text-xs text-ink-500">{t('This order also includes')} {otherItems} {t('item(s) from other sellers.')}</p>}
          </section>
        </div>
      </div>
    </Modal>
  );
}
