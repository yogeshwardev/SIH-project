import React, { createContext, useContext, useEffect, useState } from 'react';
import { STUDIO_LANGUAGES, localeForLanguage } from '../i18n/studioCopy';

// One list of languages for the whole product: the same nine the voice
// cataloguer speaks (backend/app/services/interview_content.py).
export const LANGUAGE_OPTIONS = [
  ...STUDIO_LANGUAGES.filter((item) => item.locale === 'en'),
  ...STUDIO_LANGUAGES.filter((item) => item.locale !== 'en'),
].map(({ locale, name, label, code }) => ({ code: locale, name, label, speechCode: code }));

export const normalizeLocale = localeForLanguage;

// Keep the first storefront load small. A locale catalog is downloaded only
// when the visitor selects it, then cached for the rest of the session.
const translationLoaders = {
  hi: () => import('../i18n/locales/hi'),
  te: () => import('../i18n/locales/te'),
  ta: () => import('../i18n/locales/ta'),
  bn: () => import('../i18n/locales/bn'),
  mr: () => import('../i18n/locales/mr'),
  kn: () => import('../i18n/locales/kn'),
  gu: () => import('../i18n/locales/gu'),
  ml: () => import('../i18n/locales/ml'),
};
const translationCache = import.meta.hot?.data.translationCache || new Map();
if (import.meta.hot) import.meta.hot.data.translationCache = translationCache;

// Preserve context identity during development refreshes so existing consumers
// never momentarily read a different context from the refreshed provider.
const LanguageContext = import.meta.hot?.data.languageContext || createContext(null);
if (import.meta.hot) import.meta.hot.data.languageContext = LanguageContext;

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    try { return normalizeLocale(localStorage.getItem('craftlink_language') || 'en'); }
    catch { return 'en'; }
  });
  const [dictionary, setDictionary] = useState(() => translationCache.get(locale) || {});
  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem('craftlink_language', locale); } catch { /* private browsing */ }
  }, [locale]);
  useEffect(() => {
    let current = true;
    if (locale === 'en') {
      setDictionary({});
      return () => { current = false; };
    }
    const cached = translationCache.get(locale);
    if (cached) {
      setDictionary(cached);
      return () => { current = false; };
    }
    setDictionary({});
    translationLoaders[locale]().then(({ default: loaded }) => {
      translationCache.set(locale, loaded);
      if (current) setDictionary(loaded);
    }).catch(() => { if (current) setDictionary({}); });
    return () => { current = false; };
  }, [locale]);
  const language = LANGUAGE_OPTIONS.find(item => item.code === locale);
  const t = (key) => dictionary[key] || key;
  return (
    <LanguageContext.Provider value={{ locale, language, t, setLocale: value => setLocale(normalizeLocale(value)) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
