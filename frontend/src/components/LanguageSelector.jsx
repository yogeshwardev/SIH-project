import React, { useId } from 'react';
import { Globe2, ChevronDown } from 'lucide-react';
import { LANGUAGE_OPTIONS, useLanguage } from '../context/LanguageContext';

export default function LanguageSelector({ className = '', disabled = false, tone = 'light', compact = false }) {
  const { locale, setLocale, t } = useLanguage();
  const id = useId();
  const tones = tone === 'dark'
    ? 'border-white/15 bg-white/5 text-white hover:bg-white/10 [&_option]:text-ink-900'
    : 'border-line-strong bg-white text-ink-800 hover:border-ink-300';
  return (
    <label htmlFor={id} className={`relative inline-flex h-10 flex-shrink-0 items-center gap-1.5 rounded-lg border pl-2.5 pr-7 text-sm font-medium shadow-xs transition focus-within:ring-4 focus-within:ring-brand-600/10 ${tones} ${className}`}>
      <Globe2 className="h-4 w-4 opacity-70" aria-hidden="true" />
      <span className="sr-only">{t('Language')}</span>
      <select
        id={id}
        value={locale}
        disabled={disabled}
        onChange={(event) => setLocale(event.target.value)}
        className={`cursor-pointer appearance-none bg-transparent outline-none ${compact ? 'max-w-[7.5rem]' : ''}`}
      >
        {LANGUAGE_OPTIONS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 opacity-60" aria-hidden="true" />
    </label>
  );
}
