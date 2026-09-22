import React, { useState } from 'react';
import { Building2, CheckCircle2, Send } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Modal, Notice, formatINR } from './ui';

// Shops, exporters and government emporiums buy by the dozen, not the piece.
// Physical fairs are where that conversation normally happens a few days a
// year; this keeps the same conversation open all year.
const BUYER_TYPES = ['Retailer', 'Exporter', 'Government emporium', 'Corporate gifting', 'NGO / SHG', 'Other'];

const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

const EMPTY = {
  buyer_name: '', organisation: '', buyer_type: 'Retailer', buyer_email: '', buyer_phone: '',
  gstin: '', delivery_city: '', delivery_state: '', quantity: 25, target_price: '',
  needed_by: '', message: '',
};

export default function BulkQuoteModal({ isOpen, onClose, product, currentUser }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    ...EMPTY,
    buyer_name: currentUser?.name || '',
    buyer_email: currentUser?.email || '',
    buyer_phone: currentUser?.phone || '',
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(null);

  if (!product) return null;

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const unitPrice = Number(product.suggested_price || 0);
  const quantity = Math.max(1, Number(form.quantity) || 1);

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      const created = await api.createBulkRequest({
        product_id: product.id,
        buyer_name: form.buyer_name.trim(),
        organisation: form.organisation.trim(),
        buyer_type: form.buyer_type,
        buyer_email: form.buyer_email.trim(),
        buyer_phone: form.buyer_phone.trim(),
        gstin: form.gstin.trim() || null,
        delivery_city: form.delivery_city.trim() || null,
        delivery_state: form.delivery_state || null,
        quantity,
        target_price: form.target_price ? Number(form.target_price) : null,
        needed_by: form.needed_by.trim() || null,
        message: form.message.trim() || null,
      });
      setSent(created);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  const close = () => {
    setSent(null);
    setError('');
    onClose();
  };

  const field = (name, label, props = {}) => (
    <div className={props.wrapperClass}>
      <label htmlFor={`bulk-${name}`} className="label">
        {t(label)}{props.optional && <span className="font-normal text-ink-400"> ({t('optional')})</span>}
      </label>
      <input id={`bulk-${name}`} value={form[name]} onChange={update(name)} required={!props.optional} className="field" {...props.input} />
    </div>
  );

  return (
    <Modal open={isOpen} onClose={close} size="lg" title={t('Request a bulk quote')}>
      {sent ? (
        <div className="p-6 text-center sm:p-8">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h3 className="mt-4 text-xl font-semibold text-ink-950">{t('Your enquiry is with the artisan')}</h3>
          <p className="mt-2 text-sm text-ink-600">
            {t('They will reply with a price per piece and a lead time. Keep this reference number.')}
          </p>
          <p className="mt-4 rounded-xl bg-paper-100 px-4 py-3 font-mono text-lg font-semibold tracking-wide text-ink-950">{sent.reference}</p>
          <dl className="mt-4 grid gap-2 text-left text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-paper-50 px-4 py-3"><dt className="text-xs text-ink-500">{t('Product')}</dt><dd className="font-medium text-ink-900">{sent.product_name}</dd></div>
            <div className="rounded-xl bg-paper-50 px-4 py-3"><dt className="text-xs text-ink-500">{t('Quantity')}</dt><dd className="font-medium text-ink-900">{sent.quantity}</dd></div>
          </dl>
          <button type="button" onClick={close} className="btn btn-primary btn-lg mt-6 w-full rounded-full">{t('Close')}</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          <section className="flex items-center gap-3 rounded-xl border border-line bg-paper-50 p-4">
            <Building2 className="h-5 w-5 flex-shrink-0 text-brand-700" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-950">{product.product_name}</p>
              <p className="text-xs text-ink-500">
                {t('Retail price')} {formatINR(unitPrice)} · {t('At')} {quantity} {t('pieces')}: {formatINR(unitPrice * quantity)} {t('before the artisan quotes')}
              </p>
            </div>
          </section>

          {error && <Notice tone="error" onDismiss={() => setError('')}>{error}</Notice>}

          <div className="grid gap-4 sm:grid-cols-2">
            {field('buyer_name', 'Your name', { input: { autoComplete: 'name', minLength: 2 } })}
            {field('organisation', 'Shop or organisation', { input: { minLength: 2 } })}
            <div>
              <label htmlFor="bulk-buyer_type" className="label">{t('You are buying as')}</label>
              <select id="bulk-buyer_type" value={form.buyer_type} onChange={update('buyer_type')} className="field">
                {BUYER_TYPES.map((type) => <option key={type} value={type}>{t(type)}</option>)}
              </select>
            </div>
            {field('buyer_email', 'Email', { input: { type: 'email', autoComplete: 'email' } })}
            {field('buyer_phone', 'Mobile number', { input: { type: 'tel', minLength: 10 } })}
            {field('gstin', 'GSTIN', { optional: true, input: { maxLength: 15 } })}
            <div>
              <label htmlFor="bulk-quantity" className="label">{t('How many pieces?')}</label>
              <input id="bulk-quantity" type="number" min="1" inputMode="numeric" value={form.quantity} onChange={update('quantity')} required className="field tabular-nums" />
            </div>
            <div>
              <label htmlFor="bulk-target_price" className="label">
                {t('Your target price per piece')}<span className="font-normal text-ink-400"> ({t('optional')})</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">₹</span>
                <input id="bulk-target_price" type="number" min="0" inputMode="numeric" value={form.target_price} onChange={update('target_price')} className="field pl-7 tabular-nums" />
              </div>
            </div>
            {field('delivery_city', 'City', { optional: true })}
            <div>
              <label htmlFor="bulk-delivery_state" className="label">{t('State')}<span className="font-normal text-ink-400"> ({t('optional')})</span></label>
              <select id="bulk-delivery_state" value={form.delivery_state} onChange={update('delivery_state')} className="field">
                <option value="">{t('Select state')}</option>
                {INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </div>
            {field('needed_by', 'Needed by', { optional: true, wrapperClass: 'sm:col-span-2', input: { placeholder: t('For example: before Diwali') } })}
          </div>

          <div>
            <label htmlFor="bulk-message" className="label">{t('Anything the artisan should know')}<span className="font-normal text-ink-400"> ({t('optional')})</span></label>
            <textarea id="bulk-message" rows={3} value={form.message} onChange={update('message')} className="field resize-y" placeholder={t('Sizes, colours, packaging, delivery address…')} />
          </div>

          <p className="text-xs leading-relaxed text-ink-500">
            {t('The artisan sets the price. Nothing is charged here — you agree the price and terms with them first.')}
          </p>

          <button type="submit" disabled={sending} className="btn btn-primary btn-lg w-full rounded-full">
            <Send className="h-5 w-5" />{t(sending ? 'Sending…' : 'Send enquiry to the artisan')}
          </button>
        </form>
      )}
    </Modal>
  );
}
