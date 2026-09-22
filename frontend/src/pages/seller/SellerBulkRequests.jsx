import React, { useMemo, useState } from 'react';
import { Building2, IndianRupee, Mail, MapPin, Phone, Send } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState, Modal, Notice, Spinner, StatusPill, cx, formatDate, formatINR } from '../../components/ui';

const TABS = [
  ['Open', ['Open']],
  ['Quoted', ['Quoted']],
  ['Accepted', ['Accepted']],
  ['All', null],
];

// A wholesale enquiry is the one message an artisan cannot afford to miss, so
// the list leads with what it is worth and what the artisan has to do next.
export default function SellerBulkRequests({ requests, loading, onRefresh }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState(requests.some((request) => request.status === 'Open') ? 'Open' : 'All');
  const [quoting, setQuoting] = useState(null);
  const [form, setForm] = useState({ quoted_unit_price: '', quoted_lead_time: '', quote_note: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  const counts = useMemo(() => {
    const result = {};
    TABS.forEach(([id, statuses]) => {
      result[id] = statuses ? requests.filter((request) => statuses.includes(request.status)).length : requests.length;
    });
    return result;
  }, [requests]);

  const visible = useMemo(() => {
    const statuses = TABS.find(([id]) => id === tab)?.[1];
    return statuses ? requests.filter((request) => statuses.includes(request.status)) : requests;
  }, [requests, tab]);

  const openQuote = (request) => {
    setQuoting(request);
    setError('');
    setForm({
      quoted_unit_price: request.quoted_unit_price ?? request.unit_price ?? '',
      quoted_lead_time: request.quoted_lead_time || '',
      quote_note: request.quote_note || '',
    });
  };

  const sendQuote = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      await api.quoteBulkRequest(quoting.reference, {
        quoted_unit_price: Number(form.quoted_unit_price),
        quoted_lead_time: form.quoted_lead_time.trim(),
        quote_note: form.quote_note.trim() || null,
      });
      setQuoting(null);
      setFlash(t('Your price is with the buyer.'));
      setTimeout(() => setFlash(''), 4000);
      onRefresh?.();
    } catch (quoteError) {
      setError(quoteError.message);
    } finally {
      setSending(false);
    }
  };

  const quoteTotal = Number(form.quoted_unit_price || 0) * Number(quoting?.quantity || 0);

  if (loading && requests.length === 0) {
    return <div className="card flex items-center justify-center py-16"><Spinner className="h-7 w-7 text-brand-700" /></div>;
  }

  return (
    <div className="space-y-4">
      {flash && <Notice tone="success" onDismiss={() => setFlash('')}>{flash}</Notice>}

      <div className="flex flex-wrap gap-2">
        {TABS.map(([id]) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            className={cx(
              'rounded-full px-4 py-2 text-sm font-semibold transition',
              tab === id ? 'bg-brand-700 text-white shadow-xs' : 'bg-paper-200 text-ink-700 hover:bg-paper-300',
            )}
          >
            {t(id)} <span className="tabular-nums opacity-70">{counts[id] || 0}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Building2} title={t(requests.length ? 'Nothing here' : 'No bulk enquiries yet')}>
          {t(requests.length
            ? 'No enquiries match this view.'
            : 'When a shop, exporter or government emporium asks for a quantity of your work, it arrives here.')}
        </EmptyState>
      ) : (
        <ul className="grid gap-4">
          {visible.map((request) => (
            <li key={request.reference} className="card card-pad">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={request.status} />
                    <span className="font-mono text-xs text-ink-500">{request.reference}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold leading-snug text-ink-950">
                    {request.quantity} × {request.product_name}
                  </h3>
                  <p className="mt-0.5 text-sm text-ink-600">
                    {request.organisation} · {t(request.buyer_type)} · {formatDate(request.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-500">{t(request.quote_total ? 'Your quote' : 'At your listed price')}</p>
                  <p className="text-2xl font-semibold tabular-nums text-ink-950">
                    {formatINR(request.quote_total || (request.unit_price || 0) * request.quantity)}
                  </p>
                  {request.target_price && (
                    <p className="text-xs text-ink-500">{t('Buyer hoped for')} {formatINR(request.target_price)}/{t('piece')}</p>
                  )}
                </div>
              </div>

              {request.message && (
                <p className="mt-3 rounded-xl bg-paper-100 px-4 py-3 text-sm leading-relaxed text-ink-700">“{request.message}”</p>
              )}

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-xs text-ink-500">{t('Buyer')}</dt><dd className="font-medium text-ink-900">{request.buyer_name}</dd></div>
                <div><dt className="text-xs text-ink-500">{t('Contact')}</dt><dd className="flex flex-col gap-0.5 text-ink-800">
                  <a href={`tel:${request.buyer_phone}`} className="inline-flex items-center gap-1.5 hover:text-brand-700"><Phone className="h-3.5 w-3.5" />{request.buyer_phone}</a>
                  <a href={`mailto:${request.buyer_email}`} className="inline-flex items-center gap-1.5 truncate hover:text-brand-700"><Mail className="h-3.5 w-3.5" />{request.buyer_email}</a>
                </dd></div>
                <div><dt className="text-xs text-ink-500">{t('Deliver to')}</dt><dd className="inline-flex items-center gap-1.5 text-ink-800"><MapPin className="h-3.5 w-3.5" />{[request.delivery_city, request.delivery_state].filter(Boolean).join(', ') || '—'}</dd></div>
                <div><dt className="text-xs text-ink-500">{t('Needed by')}</dt><dd className="text-ink-800">{request.needed_by || '—'}</dd></div>
              </dl>

              {request.quoted_unit_price && (
                <p className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
                  {t('You quoted')} <strong>{formatINR(request.quoted_unit_price)}</strong>/{t('piece')} · {request.quoted_lead_time}
                  {request.status === 'Quoted' && ` · ${t('waiting for the buyer')}`}
                </p>
              )}

              {['Open', 'Quoted'].includes(request.status) && (
                <button type="button" onClick={() => openQuote(request)} className="btn btn-primary mt-4 rounded-full">
                  <IndianRupee className="h-4 w-4" />{t(request.status === 'Quoted' ? 'Change my price' : 'Send my price')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(quoting)} onClose={() => setQuoting(null)} title={t('Send your price')}>
        {quoting && (
          <form onSubmit={sendQuote} className="space-y-4 p-5 sm:p-6">
            <p className="text-sm text-ink-600">
              {quoting.organisation} {t('asked for')} <strong className="text-ink-900">{quoting.quantity} × {quoting.product_name}</strong>.
            </p>
            {error && <Notice tone="error" onDismiss={() => setError('')}>{error}</Notice>}

            <div>
              <label htmlFor="quote-price" className="label">{t('Your price for one piece')}</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">₹</span>
                <input id="quote-price" type="number" min="1" inputMode="numeric" required value={form.quoted_unit_price}
                  onChange={(event) => setForm({ ...form, quoted_unit_price: event.target.value })} className="field pl-7 tabular-nums" />
              </div>
              {quoteTotal > 0 && (
                <p className="mt-1.5 text-sm text-ink-600">
                  {quoting.quantity} {t('pieces')} = <strong className="tabular-nums text-ink-950">{formatINR(quoteTotal)}</strong>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="quote-lead" className="label">{t('How long will it take?')}</label>
              <input id="quote-lead" required value={form.quoted_lead_time}
                onChange={(event) => setForm({ ...form, quoted_lead_time: event.target.value })}
                placeholder={t('For example: 12 days')} className="field" />
            </div>

            <div>
              <label htmlFor="quote-note" className="label">{t('Anything to add')}<span className="font-normal text-ink-400"> ({t('optional')})</span></label>
              <textarea id="quote-note" rows={3} value={form.quote_note}
                onChange={(event) => setForm({ ...form, quote_note: event.target.value })}
                placeholder={t('Packing, transport, advance payment…')} className="field resize-y" />
            </div>

            <button type="submit" disabled={sending} className="btn btn-primary btn-lg w-full rounded-full">
              <Send className="h-5 w-5" />{t(sending ? 'Sending…' : 'Send my price')}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
