import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Landmark, MapPin, ShieldCheck, Sparkles, Store, X } from 'lucide-react';
import Logo from '../components/Logo';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import { CRAFT_CATEGORIES } from '../components/AuthModal';
import { Notice, Spinner, cx } from '../components/ui';

const STEPS = [
  { title: 'Your store', detail: 'Name, contact and craft', icon: Store },
  { title: 'Verification', detail: 'Artisan ID or GST', icon: ShieldCheck },
  { title: 'Bank details', detail: 'Where you get paid', icon: Landmark },
  { title: 'Pickup address', detail: 'Where parcels are collected', icon: MapPin },
];

const rules = {
  0: (f) => ({
    owner_name: f.owner_name.trim().length < 2 && 'Enter your full name',
    store_name: f.store_name.trim().length < 2 && 'Enter a store name',
    email: !/^\S+@\S+\.\S+$/.test(f.email.trim()) && 'Enter a valid email',
    phone: f.phone.replace(/\D/g, '').length < 10 && 'Enter a 10-digit mobile number',
    region: f.region.trim().length < 2 && 'Enter your city or region',
  }),
  1: () => ({}),
  2: (f) => ({
    bank_account: f.bank_account && !/^\d{9,18}$/.test(f.bank_account.trim()) && 'Account number should be 9–18 digits',
    ifsc_code: (f.bank_account || f.ifsc_code) && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.ifsc_code.trim().toUpperCase()) && 'IFSC looks like SBIN0001234',
  }),
  3: (f) => ({
    address: f.address.trim().length < 5 && 'Enter the pickup address',
    pincode: !/^\d{6}$/.test(f.pincode.trim()) && 'Pincode must be 6 digits',
  }),
};

export default function SellerOnboardingPage({ onCompleteOnboarding, onCancel }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    owner_name: '', store_name: '', email: '', phone: '', craft_category: CRAFT_CATEGORIES[0], region: '',
    artisan_card_number: '', pan_or_gst: '', bank_account: '', ifsc_code: '', address: '', pincode: '',
  });

  const errors = Object.fromEntries(Object.entries(rules[step](form)).filter(([, message]) => message));
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const next = async () => {
    setTouched(true);
    if (Object.keys(errors).length) return;
    setTouched(false);
    if (step < STEPS.length - 1) { setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setLoading(true);
    setError('');
    try {
      const clean = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() || null : value]));
      clean.ifsc_code = clean.ifsc_code?.toUpperCase() || null;
      const res = await api.registerSeller(clean);
      onCompleteOnboarding?.(res.user);
    } catch (submitError) {
      setError(submitError.message);
      setLoading(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div className={props.wide ? 'sm:col-span-2' : ''}>
      <label htmlFor={`onboard-${name}`} className="label">{t(label)}{props.optional && <span className="font-normal text-ink-400"> ({t('optional')})</span>}</label>
      {props.textarea ? (
        <textarea id={`onboard-${name}`} rows={3} value={form[name]} onChange={update(name)} className={cx('field resize-y', touched && errors[name] && 'field-invalid')} {...props.input} />
      ) : (
        <input id={`onboard-${name}`} value={form[name]} onChange={update(name)} className={cx('field', touched && errors[name] && 'field-invalid', props.mono && 'font-mono')} {...props.input} />
      )}
      {touched && errors[name] ? <p className="mt-1 text-xs text-red-700">{t(errors[name])}</p> : props.hint && <p className="hint">{t(props.hint)}</p>}
    </div>
  );

  const StepIcon = STEPS[step].icon;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <span className="flex items-center gap-2.5">
            <Logo />
            <span className="hidden text-sm font-medium text-ink-500 sm:inline">· {t('Seller setup')}</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><LanguageSelector compact /></div>
            {onCancel && <button type="button" onClick={onCancel} className="btn btn-ghost"><X className="h-4 w-4" /><span className="hidden sm:inline">{t('Exit')}</span></button>}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:py-12">
        <aside>
          <h1 className="text-2xl font-semibold text-ink-950">{t('Open your CraftLink store')}</h1>
          <p className="mt-2 text-sm text-ink-500">{t('About 5 minutes. You can list products as soon as you finish.')}</p>
          <ol className="mt-6 flex gap-2 overflow-x-auto scrollbar-none lg:flex-col lg:gap-1">
            {STEPS.map((item, index) => {
              const state = index < step ? 'done' : index === step ? 'current' : 'todo';
              return (
                <li key={item.title} className="flex-shrink-0">
                  <button type="button" disabled={index >= step} onClick={() => setStep(index)} className={cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition disabled:cursor-default', state === 'current' && 'bg-white shadow-card', state === 'done' && 'hover:bg-white/60')}>
                    <span className={cx('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold', state === 'done' && 'bg-brand-700 text-white', state === 'current' && 'bg-brand-600 text-white', state === 'todo' && 'border-2 border-line-strong text-ink-400')}>
                      {state === 'done' ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <span className="hidden sm:block">
                      <span className={cx('block text-sm font-semibold', state === 'todo' ? 'text-ink-500' : 'text-ink-950')}>{t(item.title)}</span>
                      <span className="block text-xs text-ink-500">{t(item.detail)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="card">
          <header className="flex items-center gap-3 border-b border-line px-5 py-5 sm:px-7">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-50 text-clay-600"><StepIcon className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-medium text-ink-500">{t('Step')} {step + 1} {t('of')} {STEPS.length}</p>
              <h2 className="text-lg font-semibold text-ink-950">{t(STEPS[step].title)}</h2>
            </div>
          </header>

          <form onSubmit={(event) => { event.preventDefault(); next(); }} noValidate className="px-5 py-6 sm:px-7">
            {error && <Notice tone="error" className="mb-5" onDismiss={() => setError('')}>{error}</Notice>}

            {step === 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                {field('owner_name', 'Your full name', { input: { autoComplete: 'name' } })}
                {field('store_name', 'Store name', { hint: 'Buyers see this on your products' })}
                {field('email', 'Email', { input: { type: 'email', autoComplete: 'email' } })}
                {field('phone', 'Mobile number', { input: { type: 'tel', autoComplete: 'tel' } })}
                <div>
                  <label htmlFor="onboard-category" className="label">{t('Main craft')}</label>
                  <select id="onboard-category" value={form.craft_category} onChange={update('craft_category')} className="field">
                    {CRAFT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>
                {field('region', 'City / region', { input: { placeholder: 'e.g. Channapatna, Karnataka' } })}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <Notice tone="info">{t('Verified sellers earn more buyer trust. Add at least one ID now or later from your store profile.')}</Notice>
                <div className="grid gap-5 sm:grid-cols-2">
                  {field('artisan_card_number', 'Artisan (Pehchan) card number', { optional: true, mono: true })}
                  {field('pan_or_gst', 'PAN or GSTIN', { optional: true, mono: true, input: { style: { textTransform: 'uppercase' } } })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <Notice tone="info">{t('Used only to settle your earnings. We show only the last 4 digits anywhere in the app.')}</Notice>
                <div className="grid gap-5 sm:grid-cols-2">
                  {field('bank_account', 'Account number', { optional: true, mono: true, input: { inputMode: 'numeric', autoComplete: 'off' } })}
                  {field('ifsc_code', 'IFSC code', { optional: !form.bank_account, mono: true, input: { style: { textTransform: 'uppercase' }, autoComplete: 'off', maxLength: 11 } })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  {field('address', 'Workshop / pickup address', { wide: true, textarea: true, input: { autoComplete: 'street-address' } })}
                  {field('pincode', 'Pincode', { input: { inputMode: 'numeric', maxLength: 6, autoComplete: 'postal-code' } })}
                </div>
                <div className="rounded-xl bg-paper-100 p-4">
                  <h3 className="text-sm font-semibold text-ink-950">{t('Review')}</h3>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    {[['Store', form.store_name], ['Owner', form.owner_name], ['Email', form.email], ['Mobile', form.phone], ['Craft', form.craft_category], ['Region', form.region], ['Bank', form.bank_account ? '•••• ' + form.bank_account.slice(-4) : t('Not added')]].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-3"><dt className="text-ink-500">{t(label)}</dt><dd className="truncate text-right font-medium text-ink-900">{value || '—'}</dd></div>
                    ))}
                  </dl>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
              {step > 0 ? <button type="button" onClick={() => { setTouched(false); setStep(step - 1); }} className="btn btn-secondary"><ArrowLeft className="h-4 w-4" />{t('Back')}</button> : <span />}
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
                {loading && <Spinner className="h-4 w-4" />}
                {t(step === STEPS.length - 1 ? 'Create store' : 'Continue')}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
