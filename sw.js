const CACHE = 'sprouts-shell-v1';
const SHELL = ['./', './index.html', './style.css', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

function keep(response) {
  if (!response.ok || response.type !== 'basic') return false;
  const type = response.headers.get('content-type') || '';
  const length = Number(response.headers.get('content-length') || 0);
  if (length > 2_000_000) return false;
  return /javascript|css|html|json|svg|png|csv|manifest/.test(type);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/link')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const fresh = await fetch(req);
      if (fresh.ok && keep(fresh)) cache.put(req, fresh.clone());
      if (fresh.ok && req.mode === 'navigate') cache.put('./index.html', fresh.clone());
      return fresh;
    } catch (error) {
      const hit = await cache.match(req)
        || (req.mode === 'navigate' ? await cache.match('./index.html') : undefined);
      if (hit) return hit;
      throw error;
    }
  })());
});
