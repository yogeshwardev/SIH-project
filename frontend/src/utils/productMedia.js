export function productImageSources(product = {}) {
  const images = [product.enhanced_image, product.enhanced_image_url, product.original_image, product.original_image_url, ...(Array.isArray(product.gallery) ? product.gallery : [])];
  return [...new Set(images.filter(value => typeof value === 'string' && (/^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value))))];
}

export function productTitle(product, locale = 'en') {
  return (locale === 'te' && (product.title_telugu || product.title_te)) || (locale === 'hi' && (product.title_hindi || product.title_hi)) || product.product_name || product.title || '';
}

export function productPrice(product) {
  const value = Number(product.price ?? product.suggested_price ?? 0);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}
