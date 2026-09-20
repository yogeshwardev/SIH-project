import test from 'node:test';
import assert from 'node:assert/strict';
import { productImageSources, productTitle, productPrice } from '../src/utils/productMedia.js';
import { normalizeCategory, STOREFRONT_CATEGORIES } from '../src/data/storefrontCategories.js';

test('product media falls back to actual original and gallery photos, never stock photos', () => {
  assert.deepEqual(productImageSources({ enhanced_image: '/uploads/enhanced.png', original_image: '/uploads/original.png', gallery: ['/uploads/original.png', 'https://example.com/detail.jpg'] }), ['/uploads/enhanced.png', '/uploads/original.png', 'https://example.com/detail.jpg']);
  assert.deepEqual(productImageSources({}), []);
});
test('invalid image schemes cannot be used in listings', () => {
  assert.deepEqual(productImageSources({ enhanced_image: 'javascript:alert(1)', original_image: '//untrusted.example/x', gallery: [null, 'data:image/svg+xml,x', '/uploads/valid.jpg'] }), ['/uploads/valid.jpg']);
});
test('listing titles support both stored translation field formats', () => {
  const product = { product_name: 'Basket', title_te: 'బుట్ట', title_hi: 'टोकरी' };
  assert.equal(productTitle(product, 'te'), 'బుట్ట');
  assert.equal(productTitle(product, 'hi'), 'टोकरी');
  assert.equal(productTitle(product, 'en'), 'Basket');
});
test('price handling preserves zero and never invents a default price', () => {
  assert.equal(productPrice({price: 0, suggested_price: 100}), 0);
  assert.equal(productPrice({suggested_price: '2250'}), 2250);
  assert.equal(productPrice({price: 'not a price'}), 0);
});
test('category normalization supports existing backend and old catalog labels', () => {
  assert.equal(normalizeCategory('Woodcraft & Toys'), 'Woodcraft & Carving');
  assert.equal(normalizeCategory('Metal & Bell Metal'), 'Metal Craft & Bell Metal');
  assert.equal(normalizeCategory('All Categories'), 'All');
  assert.equal(new Set(STOREFRONT_CATEGORIES.map(category => category.id)).size, 6);
});
