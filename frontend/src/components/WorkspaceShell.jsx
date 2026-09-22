import React, { useState } from 'react';
import { Menu, MoreHorizontal, X } from 'lucide-react';
import { LogoMark } from './Logo';
import LanguageSelector from './LanguageSelector';
import { cx } from './ui';
import { useLanguage } from '../context/LanguageContext';

// Full-screen app frame shared by the seller and operations workspaces.
export default function WorkspaceShell({ badge, identity, nav, activeId, onNavigate, footer, title, subtitle, actions, children }) {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const go = (id) => { onNavigate(id); setMobileOpen(false); };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <span className="flex items-center gap-2.5">
          <LogoMark className="h-9 w-9" />
          <span className="leading-none">
            <span className="block font-display text-[17px] font-extrabold tracking-tight text-white">craft<span className="text-clay-400">link</span></span>
            <span className="mt-1 block text-[11px] font-medium uppercase tracking-[.12em] text-brand-300">{badge}</span>
          </span>
        </span>
        <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-brand-200 hover:bg-white/10 lg:hidden" aria-label="Close navigation"><X className="h-5 w-5" /></button>
      </div>

      {identity && <div className="mx-3 mt-2 rounded-xl bg-white/[.06] p-3">{identity}</div>}

      <nav className="mt-4 flex-1 space-y-6 overflow-y-auto px-3 pb-4" aria-label="Workspace">
        {nav.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-brand-400">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map(({ id, label, icon: Icon, count, onClick }) => {
                const active = id === activeId;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={onClick || (() => go(id))}
                      aria-current={active ? 'page' : undefined}
                      className={cx('group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition', active ? 'bg-white text-brand-900 shadow-xs' : 'text-brand-100 hover:bg-white/[.07] hover:text-white')}
                    >
                      <Icon className={cx('h-[18px] w-[18px] flex-shrink-0', active ? 'text-clay-500' : 'text-brand-300 group-hover:text-brand-100')} aria-hidden="true" />
                      <span className="flex-1 text-left">{label}</span>
                      {count > 0 && <span className={cx('min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums', active ? 'bg-clay-500 text-white' : 'bg-white/10 text-brand-100')}>{count}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {footer && <div className="border-t border-white/10 p-3">{footer}</div>}
    </div>
  );

  // The four daily tasks stay under the artisan's thumb. Less frequent tools
  // remain in the full drawer behind "More", keeping the mobile UI calm.
  const mobileItems = nav.flatMap((group) => group.items).filter((item) => !item.onClick).slice(0, 4);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-paper">
      <aside className="hidden w-64 flex-shrink-0 bg-brand-900 lg:block">{sidebar}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button type="button" className="absolute inset-0 bg-brand-950/50 animate-fade-in" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
          <aside className="relative h-full w-72 max-w-[85vw] bg-brand-900 shadow-modal animate-fade-up">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 flex-shrink-0 items-center gap-3 border-b border-line bg-white px-4 py-2.5 sm:px-6">
          <button type="button" onClick={() => setMobileOpen(true)} className="btn btn-secondary btn-icon lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-ink-950">{title}</h1>
            {subtitle && <p className="truncate text-[13px] text-ink-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><LanguageSelector compact /></div>
            {actions}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">{children}</div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(24,31,50,.10)] backdrop-blur lg:hidden" aria-label="Quick workspace navigation">
          {mobileItems.map(({ id, label, icon: Icon, count }) => {
            const active = id === activeId;
            return (
              <button key={id} type="button" onClick={() => go(id)} aria-current={active ? 'page' : undefined} className={cx('relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold', active ? 'text-brand-700' : 'text-ink-500')}>
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="w-full truncate">{label}</span>
                {count > 0 && <span className="absolute right-[18%] top-2 min-w-[18px] rounded-full bg-clay-500 px-1 text-center text-[10px] leading-[18px] text-white">{count}</span>}
              </button>
            );
          })}
          <button type="button" onClick={() => setMobileOpen(true)} className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold text-ink-500" aria-label={t('Open all navigation')}>
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            <span>{t('More')}</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
