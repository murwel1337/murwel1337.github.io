// Kinguin's Försvar — service worker.
// Network-first: a new upload to Netlify is used the very next time the
// game is opened. The cached copy is only a fallback when there's no
// connection at all. Only same-origin GET requests are touched — Supabase
// (leaderboard, multiplayer lobby) and other external requests pass straight
// through to the network untouched.
const CACHE = 'kf-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    } catch (e) {
      return (await caches.match(req)) || (await caches.match('./')) || Response.error();
    }
  })());
});
