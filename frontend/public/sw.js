/* CraftLink service worker.
 *
 * Written by hand rather than generated, because what it caches is a product
 * decision: an artisan on a village connection should still be able to open
 * the app, see their listings and their orders, and read a product page. What
 * they must never see is a stale price or a stale order status presented as
 * current, so anything that changes money or state goes to the network first.
 */
const VERSION = 'craftlink-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const DATA_CACHE = `${VERSION}-data`;

const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

// Read-only endpoints worth keeping a copy of, so the app opens with something
// on screen when the network is gone.
// Never cache private order, account or enquiry responses on a shared device.
const CACHEABLE_API = [/\/api\/products(?:\?|$)/, /\/api\/artisans(?:\?|$)/];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;             // never replay a write
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;  // fonts and the like

  // Navigation: serve the shell so the app opens offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((hit) => hit || caches.match('/'))),
    );
    return;
  }

  // Hashed build assets and icons never change under the same name.
  if (url.pathname.startsWith('/assets/') || /\.(png|jpe?g|svg|webp|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE).catch(() => fetch(request)));
    return;
  }

  // Product photos: worth keeping, they are the heaviest thing on the page.
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE).catch(() => fetch(request)));
    return;
  }

  // Data the app can usefully show a moment out of date, but only as a
  // fallback — a live request always wins.
  if (CACHEABLE_API.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request, DATA_CACHE));
  }
});
