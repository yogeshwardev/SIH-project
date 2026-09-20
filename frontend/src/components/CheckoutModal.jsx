import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Banknote, Check, CheckCircle2, Copy, MapPin, PackageSearch, ShieldCheck, Truck } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { productPrice, productTitle } from '../utils/productMedia';
import { rememberOrder } from '../utils/recentOrders';
import ProductImage from './ProductImage';
import { Modal, Notice, Spinner, cx, formatINR } from './ui';

const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

const validate = (form) => {
  const errors = {};
  if (form.buyer_name.trim().length < 2) errors.buyer_name = 'Enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(form.buyer_email.trim())) errors.buyer_email = 'Enter a valid email — you will need it to track the order';
  if (form.buyer_phone.replace(/\D/g, '').length < 10) errors.buyer_phone = 'Enter a 10-digit mobile number';
  if (form.address_line1.trim().length < 5) errors.address_line1 = 'Enter house number and street';
  if (form.city.trim().length < 2) errors.city = 'Enter your city';
  if (!form.state) errors.state = 'Choose your state';
  if (!/^\d{6}$/.test(form.postal_code.trim())) errors.postal_code = 'Pincode must be 6 digits';
  return errors;
};

export default function CheckoutModal({ isOpen, onClose, items = [], currentUser, onOrderCompleted, onTrackOrder }) {
  const { locale, t } = useLanguage();
  const [step, setStep] = useState(1); // 1 address · 2 review · 3 placed
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    buyer_name: currentUser?.role === 'buyer' ? currentUser?.name || '' : '',
    buyer_email: currentUser?.role === 'buyer' && currentUser?.email?.includes('@') ? currentUser.email : '',
    buyer_phone: currentUser?.role === 'buyer' ? currentUser?.phone || '' : '',
    address_line1: '', address_line2: '', city: '', state: '', postal_code: '',
  });

  const lines = step === 3 && order ? order.items : items;
  const subtotal = step === 3 && order ? order.total_amount : items.reduce((sum, item) => sum + productPrice(item) * (item.quantity || 1), 0);
  const errors = validate(form);
  const showError = (field) => touched && errors[field];
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  if (!isOpen || (!items.length && step !== 3)) return null;

  const continueToReview = (event) => {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length === 0) { setError(''); setStep(2); }
  };

  const placeOrder = async () => {
    setSubmitting(true);
    setError('');
    try {
      const created = await api.checkout({
        buyer_name: form.buyer_name.trim(),
        buyer_email: form.buyer_email.trim(),
        buyer_phone: form.buyer_phone.trim(),
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim() || null,
        city: form.city.trim(),
        state: form.state,
        postal_code: form.postal_code.trim(),
        payment_method: 'cod',
        items: items.map((item) => ({ product_id: item.id, quantity: item.quantity || 1 })),
      });
      rememberOrder(created);
      setOrder(created);
      setStep(3);
      onOrderCompleted?.(created);
    } catch (placeError) {
      setError(placeError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyOrderNumber = async () => {
    try { await navigator.clipboard.writeText(order.order_number); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  };

  const field = (name, label, props = {}) => (
    <div className={props.wrapperClass}>
      <label htmlFor={`checkout-${name}`} className="label">{t(label)}{props.optional && <span className="font-normal text-ink-400"> ({t('optional')})</span>}</label>
      <input id={`checkout-${name}`} value={form[name]} onChange={update(name)} aria-invalid={Boolean(showError(name))} className={cx('field', showError(name) && 'field-invalid')} {...props.input} />
      {showError(name) && <p className="mt-1 text-xs text-red-700">{t(errors[name])}</p>}
    </div>
  );

  const steps = ['Delivery', 'Review & pay', 'Confirmation'];

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      title={step === 3 ? t('Order placed') : t('Checkout')}
      description={step === 3 ? null : t('Pay with cash when your order arrives.')}
    >
      {step < 3 && (
        <ol className="flex items-center gap-2 border-b border-line bg-paper-50 px-5 py-3 text-sm sm:px-6">
          {steps.map((label, index) => {
            const number = index + 1;
            const state = step > number ? 'done' : step === number ? 'current' : 'todo';
            return (
              <li key={label} className="flex items-center gap-2">
                {index > 0 && <span className="h-px w-6 bg-line-strong sm:w-10" aria-hidden="true" />}
                <span className={cx('flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold', state === 'done' && 'bg-brand-700 text-white', state === 'current' && 'bg-brand-600 text-white ring-4 ring-brand-600/15', state === 'todo' && 'bg-paper-300 text-ink-500')}>
                  {state === 'done' ? <Check className="h-3.5 w-3.5" /> : number}
                </span>
                <span className={cx('hidden font-medium sm:inline', state === 'todo' ? 'text-ink-400' : 'text-ink-900')}>{t(label)}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="grid md:grid-cols-[1fr_300px]">
        <div className="p-5 sm:p-6">
          {error && <Notice tone="error" className="mb-5" onDismiss={() => setError('')}>{error}</Notice>}

          {step === 1 && (
            <form id="checkout-address" onSubmit={continueToReview} noValidate className="grid gap-4 sm:grid-cols-2">
              <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950 sm:col-span-2"><MapPin className="h-[18px] w-[18px] text-clay-500" />{t('Where should we deliver?')}</h3>
              {field('buyer_name', 'Full name', { input: { autoComplete: 'name' } })}
              {field('buyer_phone', 'Mobile number', { input: { autoComplete: 'tel', inputMode: 'tel', placeholder: '98765 43210' } })}
              {field('buyer_email', 'Email', { wrapperClass: 'sm:col-span-2', input: { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' } })}
              {field('address_line1', 'House, building, street', { wrapperClass: 'sm:col-span-2', input: { autoComplete: 'address-line1' } })}
              {field('address_line2', 'Area, landmark', { wrapperClass: 'sm:col-span-2', optional: true, input: { autoComplete: 'address-line2' } })}
              {field('city', 'City', { input: { autoComplete: 'address-level2' } })}
              {field('postal_code', 'Pincode', { input: { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 6 } })}
              <div className="sm:col-span-2">
                <label htmlFor="checkout-state" className="label">{t('State')}</label>
                <select id="checkout-state" value={form.state} onChange={update('state')} aria-invalid={Boolean(showError('state'))} className={cx('field', showError('state') && 'field-invalid')}>
                  <option value="">{t('Select state')}</option>
                  {INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
                {showError('state') && <p className="mt-1 text-xs text-red-700">{t(errors.state)}</p>}
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <section className="rounded-xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-ink-900">{t('Delivering to')}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-700">
                      {form.buyer_name} · {form.buyer_phone}<br />
                      {form.address_line1}{form.address_line2 && `, ${form.address_line2}`}<br />
                      {form.city}, {form.state} {form.postal_code}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">{form.buyer_email}</p>
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="link text-sm">{t('Edit')}</button>
                </div>
              </section>

              <section>
                <h3 className="mb-2.5 text-sm font-semibold text-ink-900">{t('Payment method')}</h3>
                <div className="flex items-start gap-3 rounded-xl border-2 border-brand-700 bg-brand-50/60 p-4">
                  <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600"><span className="h-2 w-2 rounded-full bg-white" /></span>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink-900"><Banknote className="h-4 w-4 text-brand-700" />{t('Cash on delivery')}</p>
                    <p className="mt-0.5 text-[13px] text-ink-600">{t('Pay in cash when the parcel reaches you. Online payments are coming soon.')}</p>
                  </div>
                </div>
              </section>

              <p className="flex items-start gap-2 text-xs text-ink-500"><ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-700" />{t('Stock is checked again when you place the order. If an item sold out, we will tell you before anything is charged.')}</p>
            </div>
          )}

          {step === 3 && order && (
            <div className="py-2 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-8 ring-emerald-50/50"><CheckCircle2 className="h-9 w-9" /></span>
              <h3 className="mt-5 text-2xl font-semibold text-ink-950">{t('Thank you')}, {order.buyer_name.split(' ')[0]}!</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-600">{t('Your order has been sent to the artisan. Keep your order number to track it.')}</p>
              <div className="mx-auto mt-6 flex max-w-sm items-center justify-between gap-3 rounded-xl border border-line bg-paper-50 px-4 py-3 text-left">
                <div>
                  <p className="text-xs text-ink-500">{t('Order number')}</p>
                  <p className="font-mono text-lg font-semibold tracking-wide text-ink-950">{order.order_number}</p>
                </div>
                <button type="button" onClick={copyOrderNumber} className="btn btn-secondary btn-sm">{copied ? <Check className="h-4 w-4 text-emerald-700" /> : <Copy className="h-4 w-4" />}{t(copied ? 'Copied' : 'Copy')}</button>
              </div>
              <p className="mt-3 text-xs text-ink-500">{t('Tracking email')}: {order.buyer_email}</p>
              <div className="mt-7 flex flex-wrap justify-center gap-2.5">
                <button type="button" onClick={onTrackOrder} className="btn btn-secondary"><PackageSearch className="h-4 w-4" />{t('Track order')}</button>
                <button type="button" onClick={onClose} className="btn btn-primary">{t('Continue shopping')}</button>
              </div>
            </div>
          )}
        </div>

        <aside className="border-t border-line bg-paper-50 p-5 sm:p-6 md:border-l md:border-t-0">
          <h3 className="text-sm font-semibold text-ink-900">{t('Order summary')}</h3>
          <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
            {lines.map((line) => {
              const title = line.product_name && !line.id ? line.product_name : productTitle(line, locale);
              const quantity = line.quantity || 1;
              const amount = line.line_total ?? productPrice(line) * quantity;
              return (
                <li key={line._catalogKey || line.product_id || line.id} className="flex items-center gap-3">
                  <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white p-1 [&_img]:h-full [&_img]:object-contain">
                    {line.product_image ? <img src={line.product_image} alt="" /> : <ProductImage product={line} alt="" />}
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-700 px-1 text-[10px] font-bold text-white">{quantity}</span>
                  </span>
                  <span className="line-clamp-2 flex-1 text-[13px] text-ink-800">{title}</span>
                  <span className="text-[13px] font-semibold tabular-nums text-ink-900">{formatINR(amount)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-ink-600"><dt>{t('Subtotal')}</dt><dd className="tabular-nums">{formatINR(subtotal)}</dd></div>
            <div className="flex justify-between text-ink-600"><dt className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" />{t('Shipping')}</dt><dd className="font-medium text-emerald-700">{t('Free')}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink-950"><dt>{t('Total')}</dt><dd className="tabular-nums">{formatINR(subtotal)}</dd></div>
          </dl>
          {step === 1 && <button type="submit" form="checkout-address" className="btn btn-primary btn-lg mt-5 w-full">{t('Continue')}<ArrowRight className="h-[18px] w-[18px]" /></button>}
          {step === 2 && (
            <div className="mt-5 space-y-2">
              <button type="button" onClick={placeOrder} disabled={submitting} className="btn btn-buy btn-lg w-full">
                {submitting ? <><Spinner className="h-4 w-4" />{t('Placing order…')}</> : <>{t('Place order')} · {formatINR(subtotal)}</>}
              </button>
              <button type="button" onClick={() => setStep(1)} disabled={submitting} className="btn btn-ghost w-full"><ArrowLeft className="h-4 w-4" />{t('Back')}</button>
            </div>
          )}
        </aside>
      </div>
    </Modal>
  );
}
