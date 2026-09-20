import React from 'react';
import { ChevronRight, LogOut, Mail, MapPin, Package, Phone, ShieldCheck, Store } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Modal, StatusPill } from './ui';

export default function UserAccountModal({ isOpen, onClose, currentUser, onSignOut, onOpenOrders, onNavigateToSeller, onNavigateToAdmin }) {
  const { t } = useLanguage();
  if (!isOpen || !currentUser) return null;
  const role = currentUser.role || 'buyer';
  const roleLabel = { buyer: 'Shopper', seller: 'Seller', admin: 'Operations' }[role];
  const initials = (currentUser.store_name || currentUser.name || 'U').split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();

  const actions = [
    { icon: Package, title: 'Track an order', detail: 'Check delivery progress with your order number', onClick: onOpenOrders, show: true },
    { icon: Store, title: 'Seller workspace', detail: 'Listings, orders and payouts', onClick: onNavigateToSeller, show: role === 'seller' || role === 'admin' },
    { icon: ShieldCheck, title: 'Administration', detail: 'Review listings and fulfilment', onClick: onNavigateToAdmin, show: role === 'admin' },
  ].filter((action) => action.show);

  return (
    <Modal open={isOpen} onClose={onClose} size="sm" title={t('Your account')}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-lg font-semibold text-white">{initials}</span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-ink-950">{currentUser.store_name || currentUser.name}</p>
            {currentUser.store_name && <p className="truncate text-sm text-ink-500">{currentUser.name}</p>}
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="badge bg-brand-50 text-brand-700 ring-brand-700/15">{t(roleLabel)}</span>
              {currentUser.kyc_status && <StatusPill status={currentUser.kyc_status} label={`KYC ${t(currentUser.kyc_status)}`} />}
            </div>
          </div>
        </div>

        <dl className="mt-5 divide-y divide-line rounded-xl border border-line text-sm">
          {currentUser.email && <div className="flex items-center gap-3 px-4 py-2.5"><Mail className="h-4 w-4 text-ink-400" /><dd className="truncate text-ink-800">{currentUser.email}</dd></div>}
          {currentUser.phone && <div className="flex items-center gap-3 px-4 py-2.5"><Phone className="h-4 w-4 text-ink-400" /><dd className="text-ink-800">{currentUser.phone}</dd></div>}
          {(currentUser.region || currentUser.department) && <div className="flex items-center gap-3 px-4 py-2.5"><MapPin className="h-4 w-4 text-ink-400" /><dd className="text-ink-800">{currentUser.region || currentUser.department}</dd></div>}
        </dl>

        <ul className="mt-5 space-y-2">
          {actions.map(({ icon: Icon, title, detail, onClick }) => (
            <li key={title}>
              <button type="button" onClick={() => { onClose(); onClick?.(); }} className="group flex w-full items-center gap-3 rounded-xl border border-line px-4 py-3 text-left transition hover:border-line-strong hover:bg-paper-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-paper-200 text-brand-700"><Icon className="h-[18px] w-[18px]" /></span>
                <span className="flex-1"><span className="block text-sm font-semibold text-ink-900">{t(title)}</span><span className="text-xs text-ink-500">{t(detail)}</span></span>
                <ChevronRight className="h-4 w-4 text-ink-400 transition group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>

        <button type="button" onClick={() => { onSignOut?.(); onClose(); }} className="btn btn-danger mt-5 w-full"><LogOut className="h-4 w-4" />{t('Sign out')}</button>
      </div>
    </Modal>
  );
}
