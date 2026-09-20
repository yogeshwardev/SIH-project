import React, { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { productImageSources } from '../utils/productMedia';
import { useLanguage } from '../context/LanguageContext';

export default function ProductImage({ product, alt, loading = 'lazy', className = '' }) {
  const { t } = useLanguage();
  const sources = productImageSources(product);
  const identity = sources.join('|');
  const [index, setIndex] = useState(0);
  useEffect(() => { setIndex(0); }, [identity]);
  if (!sources[index]) {
    return (
      <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-400">
        <ImageIcon className="h-7 w-7" aria-hidden="true" />
        <span className="text-xs">{t('Photo unavailable')}</span>
      </span>
    );
  }
  return <img className={className} src={sources[index]} alt={alt} loading={loading} decoding="async" onError={() => setIndex((current) => current + 1)} />;
}
