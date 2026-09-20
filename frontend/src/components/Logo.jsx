import React from 'react';

// CraftLink mark: two interlocking loops, a thread knot that is also a link.
export function LogoMark({ className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#3B44A8" />
      <rect x="7.5" y="13" width="15" height="14" rx="7" fill="none" stroke="#F9A72B" strokeWidth="3.2" />
      <rect x="17.5" y="13" width="15" height="14" rx="7" fill="none" stroke="#FFFFFF" strokeWidth="3.2" />
      {/* Re-draw the top of the first loop so the links appear woven together. */}
      <path d="M17.5 13.2a7 7 0 0 1 5 6.6" fill="none" stroke="#F9A72B" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ tone = 'dark', tagline, className = '' }) {
  const text = tone === 'light' ? 'text-white' : 'text-ink-950';
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="leading-none">
        <span className={`block font-display text-[22px] font-extrabold tracking-tight ${text}`}>
          craft<span className="text-clay-500">link</span>
        </span>
        {tagline && <span className={`mt-1 block text-[11px] font-medium ${tone === 'light' ? 'text-brand-200' : 'text-ink-500'}`}>{tagline}</span>}
      </span>
    </span>
  );
}
