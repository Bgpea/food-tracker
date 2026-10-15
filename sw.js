const CACHE = 'food-tracker-v9';
const LOCAL = ['./', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];
const CHARTJS = 'https://cdn.jsdelivr.net/npm/chart.js';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(LOCAL);
    // Chart.js comes from a CDN; store a copy so the app works offline
    try { await cache.add(new Request(CHARTJS, { mode: 'no-cors' })); } catch (e) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    // Network-first for the app shell so updates show up; fall back to cache offline
    const isShell = new URL(req.url).origin === location.origin;
    if (cached && !isShell) return cached;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    } catch (e) {
      if (cached) return cached;
      if (req.mode === 'navigate') return cache.match('./index.html');
      throw e;
    }
  })());
});
