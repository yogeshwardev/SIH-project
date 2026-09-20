import React, { useMemo } from 'react';
import { Banknote, CheckCircle2, Clock, Download, Landmark, Wallet, XCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState, Notice, StatCard, StatusPill, downloadCsv, formatDate, formatINR } from '../../components/ui';
import { ACTIVE_STATUSES, maskAccount, storeOrderValue } from './sellerData';

export default function SellerPayouts({ orders, metrics, storeId, profile }) {
  const { t } = useLanguage();
  const cancelled = orders.filter((order) => order.status === 'Cancelled');
  const cancelledValue = cancelled.reduce((sum, order) => sum + storeOrderValue(order, storeId), 0);
  const ledger = useMemo(() => orders.map((order) => ({
    order,
    amount: storeOrderValue(order, storeId),
    state: order.status === 'Delivered' ? 'Collected' : order.status === 'Cancelled' ? 'Cancelled' : 'Awaiting delivery',
  })), [orders, storeId]);

  const exportCsv = () => downloadCsv(`craftlink-payments-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['Order', 'Placed on', 'Order status', 'Payment status', 'Amount (INR)'],
    ...ledger.map(({ order, amount, state }) => [order.order_number, formatDate(order.created_at), order.status, state, amount]),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Collected')} value={formatINR(metrics.collected)} hint={t('Cash paid on delivered orders')} icon={CheckCircle2} tone="brand" />
        <StatCard label={t('Awaiting delivery')} value={formatINR(metrics.inTransit)} hint={`${orders.filter((order) => ACTIVE_STATUSES.includes(order.status)).length} ${t('open orders')}`} icon={Clock} tone="amber" />
        <StatCard label={t('Cancelled')} value={formatINR(cancelledValue)} hint={`${cancelled.length} ${t((cancelled.length) === 1 ? 'order' : 'orders')}`} icon={XCircle} tone="red" />
        <StatCard label={t('Average order')} value={formatINR(metrics.averageOrder)} hint={t('Excluding cancelled')} icon={Wallet} tone="clay" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h3 className="text-base font-semibold text-ink-950">{t('Payment activity')}</h3>
              <p className="text-sm text-ink-500">{t('One row per order that includes your products')}</p>
            </div>
            <button type="button" onClick={exportCsv} disabled={!ledger.length} className="btn btn-secondary btn-sm"><Download className="h-4 w-4" />{t('Export')}</button>
          </header>
          {ledger.length ? (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead><tr><th>{t('Order')}</th><th>{t('Date')}</th><th>{t('Payment')}</th><th className="text-right">{t('Amount')}</th></tr></thead>
                <tbody>
                  {ledger.map(({ order, amount, state }) => (
                    <tr key={order.id}>
                      <td className="font-mono text-[13px] font-semibold">{order.order_number}</td>
                      <td className="text-ink-600">{formatDate(order.created_at)}</td>
                      <td><StatusPill status={{ Collected: 'Paid', Cancelled: 'Cancelled', 'Awaiting delivery': 'Pending' }[state]} label={t(state)} /></td>
                      <td className={`text-right font-semibold tabular-nums ${state === 'Cancelled' ? 'text-ink-400 line-through' : ''}`}>{formatINR(amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Banknote} title={t('No payments yet')}>{t('Payments appear here once buyers order your products.')}</EmptyState>
          )}
        </section>

        <aside className="space-y-4">
          <section className="card p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Landmark className="h-5 w-5" /></span>
              <h3 className="text-base font-semibold text-ink-950">{t('Bank account')}</h3>
            </div>
            {profile?.bank_account ? (
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-ink-500">{t('Account')}</dt><dd className="font-mono font-medium">{maskAccount(profile.bank_account)}</dd></div>
                {profile.ifsc_code && <div className="flex justify-between"><dt className="text-ink-500">IFSC</dt><dd className="font-mono font-medium">{profile.ifsc_code}</dd></div>}
                <div className="flex justify-between"><dt className="text-ink-500">KYC</dt><dd><StatusPill status={profile.kyc_status || 'Pending'} label={t(profile.kyc_status || 'Pending')} /></dd></div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-ink-600">{t('No bank account on file. Add one through full store setup so settlements can be arranged.')}</p>
            )}
          </section>
          <Notice tone="info">
            <p className="font-semibold">{t('How payments work today')}</p>
            <p className="mt-1 text-[13px] leading-relaxed">{t('CraftLink currently supports cash on delivery only. An order counts as collected once it is marked delivered. Online payments and automatic bank settlements are not live yet.')}</p>
          </Notice>
        </aside>
      </div>
    </div>
  );
}
