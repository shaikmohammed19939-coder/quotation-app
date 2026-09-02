const CACHE_NAME = 'quotation-app-shell-v2';
const APP_SHELL = [
  './quotation_footer_updated-3.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Network-first for the app HTML so updates are picked up quickly, falling
// back to the cached shell when offline; cache-first for everything else
// (icons, fonts, vendor scripts) since those rarely change.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const isAppShellDoc = event.request.mode === 'navigate' || event.request.url.includes('quotation_footer_updated-3.html');

  if (isAppShellDoc) {
    event.respondWith(
      // cache: 'no-store' bypasses the browser's own HTTP cache (GitHub
      // Pages serves this file with a Cache-Control that otherwise lets the
      // browser reuse a stale response for several minutes) so a fixed,
      // freshly-deployed build is picked up on the very next load instead
      // of silently continuing to serve whatever was cached before.
      fetch(event.request, { cache: 'no-store' })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('./quotation_footer_updated-3.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      }).catch(() => cached);
    })
  );
});
