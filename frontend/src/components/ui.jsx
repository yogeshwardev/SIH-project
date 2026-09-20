import React from 'react';
import { X, Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import useDialogFocus from '../hooks/useDialogFocus';

export const cx = (...classes) => classes.filter(Boolean).join(' ');

export const formatINR = (value) => {
  const number = Number(value);
  return '₹' + (Number.isFinite(number) ? number : 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

export const formatDate = (value, withTime = false) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}) });
};

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={cx('animate-spin', className)} aria-hidden="true" />;
}

const STATUS_TONES = {
  Published: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  'Pending Approval': 'bg-amber-50 text-amber-800 ring-amber-600/25',
  Rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  Draft: 'bg-paper-200 text-ink-700 ring-ink-500/20',
  Placed: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  Confirmed: 'bg-indigo-50 text-indigo-800 ring-indigo-600/20',
  Packed: 'bg-violet-50 text-violet-800 ring-violet-600/20',
  Shipped: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  Delivered: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  Cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  Verified: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  Pending: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  Paid: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
};

export function StatusPill({ status, label }) {
  const tone = STATUS_TONES[status] || 'bg-paper-200 text-ink-700 ring-ink-500/20';
  return (
    <span className={cx('badge', tone)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {label || status}
    </span>
  );
}

export function Notice({ tone = 'info', children, onDismiss, className = '' }) {
  const styles = {
    info: ['border-sky-200 bg-sky-50 text-sky-900', Info],
    success: ['border-emerald-200 bg-emerald-50 text-emerald-900', CheckCircle2],
    warning: ['border-amber-200 bg-amber-50 text-amber-900', AlertCircle],
    error: ['border-red-200 bg-red-50 text-red-800', AlertCircle],
  }[tone];
  const Icon = styles[1];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cx('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm', styles[0], className)}>
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="-m-1 rounded-md p-1 opacity-60 hover:opacity-100" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action, className = '' }) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-paper-200 text-ink-500">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {children && <p className="mt-1.5 max-w-sm text-sm text-ink-500">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    clay: 'bg-clay-50 text-clay-600',
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-sky-50 text-sky-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-500">{label}</p>
        {Icon && (
          <span className={cx('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl', tones[tone])}>
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-2 text-[26px] font-semibold tracking-tight text-ink-950 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

export function SectionHeader({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-ink-950">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// Accessible modal shell: focus trap, Escape to close, backdrop click, scroll lock.
export function Modal({ open, onClose, title, description, children, footer, size = 'md', labelledBy, hideHeader = false }) {
  const dialogRef = useDialogFocus(open, onClose);
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  const titleId = labelledBy || 'modal-title';
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto bg-brand-950/55 p-0 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-6"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx('relative flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-modal outline-none animate-pop sm:max-h-[calc(100dvh-48px)] sm:rounded-2xl', widths[size])}
      >
        {!hideHeader && (
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 id={titleId} className="text-[17px] font-semibold text-ink-950">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
            </div>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-icon -mr-2 -mt-1 flex-shrink-0" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-paper-50 px-5 py-3.5 sm:px-6">{footer}</footer>}
      </section>
    </div>
  );
}

export function downloadCsv(filename, rows) {
  const escape = (value) => {
    const text = value == null ? '' : String(value);
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  };
  const csv = rows.map((row) => row.map(escape).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
