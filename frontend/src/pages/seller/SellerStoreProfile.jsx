import React from 'react';
import { BadgeCheck, Building2, ClipboardList, Landmark, MapPin, UserRound } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Notice, StatusPill, formatDate } from '../../components/ui';
import { maskAccount } from './sellerData';

export default function SellerStoreProfile({ profile, products, onNavigateToOnboarding }) {
  const { t } = useLanguage();
  if (!profile) return <div className="skeleton h-64 rounded-2xl" />;

  const checklist = [
    ['Contact email', Boolean(profile.email)],
    ['Mobile number', Boolean(profile.phone)],
    ['Artisan ID or GST/PAN', Boolean(profile.artisan_card_number || profile.pan_or_gst)],
    ['Bank account for settlements', Boolean(profile.bank_account && profile.ifsc_code)],
    ['Pickup address', Boolean(profile.address && profile.pincode)],
    ['At least one product listed', products.length > 0],
  ];
  const done = checklist.filter(([, ok]) => ok).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="card overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-brand-700 to-brand-600" />
          <div className="-mt-10 px-6 pb-6">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-clay-100 text-3xl font-semibold text-clay-700">{(profile.store_name || profile.name || 'S').charAt(0).toUpperCase()}</span>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-ink-950">{profile.store_name || profile.name}</h2>
              {profile.kyc_status && <StatusPill status={profile.kyc_status} label={`KYC ${t(profile.kyc_status)}`} />}
            </div>
            <p className="mt-1 text-sm text-ink-500">{profile.craft_category || t('Artisan store')} · {t('Seller since')} {formatDate(profile.created_at)}</p>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <DetailCard icon={UserRound} title={t('Owner & contact')} rows={[['Name', profile.name], ['Email', profile.email], ['Phone', profile.phone], ['Language', profile.language]]} />
          <DetailCard icon={MapPin} title={t('Location & pickup')} rows={[['Region', profile.region], ['Pickup address', profile.address], ['Pincode', profile.pincode]]} />
          <DetailCard icon={Building2} title={t('Verification')} rows={[['Artisan ID', profile.artisan_card_number], ['GST / PAN', profile.pan_or_gst]]} mono />
          <DetailCard icon={Landmark} title={t('Settlement account')} rows={[['Account', maskAccount(profile.bank_account)], ['IFSC', profile.ifsc_code]]} mono />
        </div>
      </div>

      <aside className="space-y-4">
        <section className="card p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950"><ClipboardList className="h-[18px] w-[18px] text-clay-500" />{t('Store setup')}</h3>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-200"><div className="h-full rounded-full bg-brand-700" style={{ width: `${(done / checklist.length) * 100}%` }} /></div>
            <span className="text-sm font-semibold tabular-nums text-ink-700">{done}/{checklist.length}</span>
          </div>
          <ul className="mt-4 space-y-2.5">
            {checklist.map(([label, ok]) => (
              <li key={label} className="flex items-center gap-2.5 text-sm">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${ok ? 'bg-emerald-600 text-white' : 'border-2 border-line-strong'}`}>{ok && <BadgeCheck className="h-3.5 w-3.5" />}</span>
                <span className={ok ? 'text-ink-800' : 'text-ink-500'}>{t(label)}</span>
              </li>
            ))}
          </ul>
          {done < checklist.length && onNavigateToOnboarding && <button type="button" onClick={onNavigateToOnboarding} className="btn btn-secondary mt-5 w-full">{t('Complete full store setup')}</button>}
        </section>
        <Notice tone="info">{t('To change store details that are already verified, contact CraftLink support so we can re-check them.')}</Notice>
      </aside>
    </div>
  );
}

function DetailCard({ icon: Icon, title, rows, mono }) {
  const { t } = useLanguage();
  return (
    <section className="card p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-950"><Icon className="h-4 w-4 text-ink-400" />{title}</h3>
      <dl className="mt-3 space-y-2.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[110px_1fr] gap-3">
            <dt className="text-ink-500">{t(label)}</dt>
            <dd className={`break-words ${value ? 'text-ink-900' : 'text-ink-400'} ${mono && value ? 'font-mono text-[13px]' : ''}`}>{value || t('Not added')}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
