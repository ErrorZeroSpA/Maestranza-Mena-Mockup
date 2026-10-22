/* SGO · service worker mínimo: la pantalla de piso (/avance) y los estáticos abren sin señal. */
const CACHE = 'sgo-shell-v1';

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const esPiso = url.pathname.startsWith('/avance/');
  const esEstatico = url.pathname.startsWith('/_next/static') || url.pathname === '/logo.svg' || url.pathname === '/manifest.webmanifest';

  if (esEstatico) {
    // cache primero: son archivos con hash, no cambian
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return res; })));
  } else if (esPiso) {
    // red primero, con copia de respaldo para cuando no hay señal
    e.respondWith(fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return res; }).catch(() => caches.match(req)));
  }
});
