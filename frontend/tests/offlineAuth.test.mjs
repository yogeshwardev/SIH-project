import assert from 'node:assert/strict';
import test from 'node:test';

const { authenticateOfflineDemo, DEMO_ACCOUNTS } = await import('../src/services/offlineAuth.js');
const { OFFLINE_CATALOG } = await import('../src/data/offlineCatalog.js');

test('all documented demo accounts authenticate completely offline', () => {
  for (const role of ['buyer', 'seller', 'admin']) {
    const user = authenticateOfflineDemo(role, DEMO_ACCOUNTS[role].form);
    assert.equal(user?.role, role);
    assert.equal(user?.offline_demo, true);
  }
});

test('offline seller account is connected to bundled inventory', () => {
  const seller = authenticateOfflineDemo('seller', DEMO_ACCOUNTS.seller.form);
  const inventory = OFFLINE_CATALOG.filter((product) => product.artisan_id === seller.id);
  assert.ok(inventory.length >= 2);
  assert.ok(inventory.every((product) => product.status === 'Published'));
});

test('offline authentication rejects incorrect passwords and unknown accounts', () => {
  assert.equal(authenticateOfflineDemo('buyer', { identifier: 'buyer@craftlink.in', password: 'wrong' }), null);
  assert.equal(authenticateOfflineDemo('seller', { identifier: 'unknown@example.com', password: 'CraftLink@123' }), null);
  assert.equal(authenticateOfflineDemo('admin', { admin_id: 'MOSJE-101', access_key: 'wrong' }), null);
});
