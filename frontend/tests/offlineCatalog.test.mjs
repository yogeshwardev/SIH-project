import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { OFFLINE_CATALOG } from '../src/data/offlineCatalog.js';

test('the Android offline catalog has stocked products and bundled photos', () => {
  assert.equal(OFFLINE_CATALOG.length, 10);
  for (const product of OFFLINE_CATALOG) {
    assert.ok(product.stock_quantity > 0, `${product.product_name} needs stock`);
    assert.ok(product.suggested_price > 0, `${product.product_name} needs a price`);
    const image = fileURLToPath(new URL(`../public${product.enhanced_image}`, import.meta.url));
    assert.ok(existsSync(image), `${product.product_name} photo must be bundled`);
  }
});
