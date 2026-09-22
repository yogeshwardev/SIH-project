import React, { useEffect, useState } from 'react';
import { Download, WifiOff, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DISMISSED_KEY = 'craftlink_install_dismissed';

// Two small things an artisan on a phone needs: a way to keep the app on their
// home screen, and an honest signal when the network has gone.
export default function InstallPrompt() {
  const { t } = useLanguage();
  const [deferred, setDeferred] = useState(null);
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    const capture = (event) => {
      // Keep the browser's own banner away; we ask at a calmer moment.
      event.preventDefault();
      setDeferred(event);
    };
    const installed = () => setDeferred(null);
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', capture);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => null);
    setDeferred(null);
  };

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* private browsing */ }
  };

  if (offline) {
    return (
      <div role="status" className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900">
        <WifiOff className="h-4 w-4 flex-shrink-0" />
        {t('You are offline. Saved pages are available, but listings and orders need a connection.')}
      </div>
    );
  }

  if (!deferred || dismissed) return null;

  return (
    <div className="sticky top-0 z-40 flex items-center gap-3 bg-brand-900 px-4 py-2.5 text-white">
      <img src="/icon-192.png" alt="" className="h-8 w-8 flex-shrink-0 rounded-lg" />
      <p className="min-w-0 flex-1 text-sm leading-snug">
        <span className="font-semibold">{t('Keep CraftLink on your phone')}</span>
        <span className="ml-1.5 hidden text-brand-200 sm:inline">{t('Opens like an app, works with a weak network.')}</span>
      </p>
      <button type="button" onClick={install} className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-clay-400 px-4 py-1.5 text-sm font-semibold text-ink-950 hover:bg-clay-300">
        <Download className="h-4 w-4" />{t('Install')}
      </button>
      <button type="button" onClick={dismiss} aria-label={t('Close')} className="flex-shrink-0 rounded-full p-1.5 text-brand-200 hover:bg-white/10 hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
