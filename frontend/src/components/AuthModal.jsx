import React, { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, Store, UserRound, X } from 'lucide-react';
import Logo from './Logo';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';
import useDialogFocus from '../hooks/useDialogFocus';
import { Notice, Spinner, cx } from './ui';

export const CRAFT_CATEGORIES = ['Handloom & Textiles', 'Pottery & Ceramics', 'Woodcraft & Carving', 'Metal Craft & Bell Metal', 'Cane & Bamboo', 'Traditional Paintings', 'Leather Craft', 'Stone Carving', 'Jewelry & Accessories'];

const EMPTY = {
  identifier: '', password: '', name: '', phone: '',
  owner_name: '', store_name: '', email: '', craft_category: CRAFT_CATEGORIES[0], region: '',
  admin_id: '', officer_name: '', access_key: '',
};

export default function AuthModal({ isOpen, onClose, initialTab = 'buyer', onLoginSuccess, onNavigateToSellerOnboarding }) {
  const { t } = useLanguage();
  const dialogRef = useDialogFocus(isOpen, onClose);
  const [role, setRole] = useState(initialTab);
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) { setRole(initialTab); setRegister(false); setError(''); setForm(EMPTY); setShowPassword(false); }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const switchRole = (next) => { setRole(next); setRegister(false); setError(''); };
  const finish = (user, userRole) => { onLoginSuccess?.(user, userRole); onClose(); };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (role === 'buyer' && register) {
        const res = await api.registerBuyer({ name: form.name.trim(), email: form.identifier.trim(), phone: form.phone.trim(), password: form.password });
        finish(res.user, 'buyer');
      } else if (role === 'buyer') {
        const res = await api.login({ email_or_phone: form.identifier.trim(), password: form.password, role: 'buyer' });
        finish(res.user, 'buyer');
      } else if (role === 'seller' && register) {
        const res = await api.registerSeller({
          owner_name: form.owner_name.trim(), store_name: form.store_name.trim(), email: form.email.trim(), phone: form.phone.trim(),
          craft_category: form.craft_category, region: form.region.trim(),
        });
        finish(res.user, 'seller');
      } else if (role === 'seller') {
        const res = await api.login({ email_or_phone: form.identifier.trim(), password: form.password, role: 'seller' });
        finish(res.user, 'seller');
      } else {
        const res = await api.adminLogin({ admin_id: form.admin_id.trim(), access_key: form.access_key, officer_name: form.officer_name.trim() });
        finish(res.user, 'admin');
      }
    } catch (submitError) {
      setError(submitError.message || t('Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const input = (name, label, props = {}) => (
    <div className={props.wrapperClass}>
      <label htmlFor={`auth-${name}`} className="label">{t(label)}</label>
      <input id={`auth-${name}`} value={form[name]} onChange={update(name)} required className="field" {...props.input} />
    </div>
  );

  const passwordInput = (
    <div>
      <label htmlFor="auth-password" className="label">{t('Password')}</label>
      <div className="relative">
        <input id="auth-password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={update('password')} required minLength={register ? 6 : undefined} autoComplete={register ? 'new-password' : 'current-password'} className="field pr-11" />
        <button type="button" onClick={() => setShowPassword((show) => !show)} className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-ink-500 hover:text-ink-900" aria-label={t(showPassword ? 'Hide password' : 'Show password')}>
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  const copy = {
    buyer: register ? ['Create your account', 'Save your details for faster checkout.'] : ['Welcome back', 'Sign in to track your orders and manage your account.'],
    seller: register ? ['Open your store', 'Start listing your craft in a few minutes.'] : ['Seller sign in', 'Manage your products, orders, and inventory in one place.'],
    admin: ['Operations sign in', 'Review listings and manage fulfilment.'],
  }[role];

  const tabs = [['buyer', 'Shopper', UserRound], ['seller', 'Seller', Store], ['admin', 'Operations', ShieldCheck]];

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto bg-brand-950/55 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="auth-title" className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-modal outline-none animate-pop sm:rounded-3xl">
        <header className="flex items-center justify-between gap-3 px-6 pt-5">
          <span className="flex items-center gap-2">
            <Logo />
          </span>
          <div className="flex items-center gap-1">
            <LanguageSelector compact />
            <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label={t('Close')}><X className="h-5 w-5" /></button>
          </div>
        </header>

        <div className="px-6 pt-5">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-paper-200 p-1" role="tablist">
            {tabs.map(([id, label, Icon]) => (
              <button key={id} type="button" role="tab" aria-selected={role === id} onClick={() => switchRole(id)} className={cx('flex h-9 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold transition', role === id ? 'bg-white text-ink-950 shadow-card' : 'text-ink-500 hover:text-ink-900')}>
                <Icon className="h-4 w-4" />{t(label)}
              </button>
            ))}
          </div>
          <h2 id="auth-title" className="mt-6 text-2xl font-semibold text-ink-950">{t(copy[0])}</h2>
          <p className="mt-1 text-sm text-ink-500">{t(copy[1])}</p>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 pb-6 pt-5">
          {error && <Notice tone="error">{t(error)}</Notice>}

          {role === 'buyer' && (
            <>
              {register && input('name', 'Full name', { input: { autoComplete: 'name', minLength: 2 } })}
              {input('identifier', register ? 'Email' : 'Email or phone', { input: { type: register ? 'email' : 'text', autoComplete: 'username' } })}
              {register && input('phone', 'Mobile number', { input: { type: 'tel', autoComplete: 'tel', minLength: 10 } })}
              {passwordInput}
            </>
          )}

          {role === 'seller' && !register && (
            <>
              {input('identifier', 'Registered email or phone', { input: { autoComplete: 'username' } })}
              {passwordInput}
            </>
          )}

          {role === 'seller' && register && (
            <div className="grid gap-4 sm:grid-cols-2">
              {input('owner_name', 'Your name', { input: { autoComplete: 'name', minLength: 2 } })}
              {input('store_name', 'Store name', { input: { minLength: 2 } })}
              {input('email', 'Email', { input: { type: 'email', autoComplete: 'email' } })}
              {input('phone', 'Mobile number', { input: { type: 'tel', autoComplete: 'tel', minLength: 10 } })}
              <div>
                <label htmlFor="auth-category" className="label">{t('Main craft')}</label>
                <select id="auth-category" value={form.craft_category} onChange={update('craft_category')} className="field">
                  {CRAFT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              {input('region', 'City / region', { input: { placeholder: 'e.g. Jaipur, Rajasthan' } })}
            </div>
          )}

          {role === 'admin' && (
            <>
              {input('admin_id', 'Staff ID', { input: { autoComplete: 'username' } })}
              {input('officer_name', 'Full name', { input: { autoComplete: 'name' } })}
              <div>
                <label htmlFor="auth-key" className="label">{t('Access key')}</label>
                <input id="auth-key" type="password" value={form.access_key} onChange={update('access_key')} required autoComplete="current-password" className="field" />
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
            {loading ? <Spinner className="h-4 w-4" /> : null}
            {t(loading ? 'Please wait…' : role === 'admin' ? 'Sign in' : register ? (role === 'seller' ? 'Create store' : 'Create account') : 'Sign in')}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>

          {role !== 'admin' && (
            <p className="text-center text-sm text-ink-600">
              {t(register ? 'Already have an account?' : role === 'seller' ? 'New seller?' : 'New to CraftLink?')}{' '}
              <button type="button" onClick={() => { setRegister(!register); setError(''); }} className="link">{t(register ? 'Sign in' : role === 'seller' ? 'Open your store' : 'Create your account')}</button>
            </p>
          )}
          {role === 'seller' && onNavigateToSellerOnboarding && (
            <button type="button" onClick={() => { onClose(); onNavigateToSellerOnboarding(); }} className="w-full rounded-xl border border-dashed border-line-strong px-4 py-3 text-left text-sm text-ink-600 hover:border-brand-600 hover:bg-brand-50/40">
              <span className="font-semibold text-ink-900">{t('Full store setup')}</span> — {t('add artisan ID, bank and pickup details now')} →
            </button>
          )}
        </form>
      </section>
    </div>
  );
}
