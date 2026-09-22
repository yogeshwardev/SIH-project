import { mediaUrl } from '../services/config.js';

export function productImageSources(product = {}) {
  const gallery = (Array.isArray(product.gallery) ? product.gallery : []).map(item => {
    if (typeof item === 'string') return item;
    if (!item || typeof item !== 'object') return [];
    return item.enhanced_image_url || item.enhanced_image || item.url || item.src || item.original_image_url || item.original_image;
  });
  const valid = value => typeof value === 'string' && (/^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value));
  const enhanced = [product.enhanced_image, product.enhanced_image_url, ...gallery].filter(valid);
  const images = enhanced.length ? enhanced : [product.original_image, product.original_image_url].filter(valid);
  // Photos live on the server; a packaged app needs the absolute URL.
  return [...new Set(images)].map(mediaUrl);
}

export function productTitle(product, locale = 'en') {
  return (locale === 'te' && (product.title_telugu || product.title_te)) || (locale === 'hi' && (product.title_hindi || product.title_hi)) || product.product_name || product.title || '';
}

export function productPrice(product) {
  const value = Number(product.price ?? product.suggested_price ?? 0);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}
