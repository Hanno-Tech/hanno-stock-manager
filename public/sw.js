// Service worker mínimo para instalabilidade do PWA (app shell).
// Estratégia: network-first para navegação; cache-first para assets estáticos.
const CACHE = 'estoque-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // não intercepta MinIO/R2, etc.

  // Assets estáticos do Next: cache-first.
  if (url.pathname.startsWith('/_next/static') || url.pathname.match(/\.(png|svg|ico|webmanifest|woff2?)$/)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  // Navegação/páginas: network-first, cai no cache se offline.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
  }
});
