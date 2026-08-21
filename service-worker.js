const CACHE = 'bypronos-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  // Ne jamais mettre en cache Firebase / API / CDN dynamiques
  if (/firebaseio|firebasedatabase|googleapis|gstatic|firebaseapp|run\.app|api-sports|media\.api-sports/.test(url.host)) return;
  // Network-first : derniere version quand en ligne, cache en secours hors-ligne
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.status === 200 && url.origin === location.origin) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      throw err;
    }
  })());
});
