const CACHE = 'sprouts-offline-v1';
const MAX = 20_000_000;
const SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './sheet.csv',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  './vendor/fonts/fonts.css?v=r187',
  './vendor/fonts/dm-sans.woff2',
  './vendor/fonts/outfit.woff2',
  './vendor/three/build/three.module.js?v=r187',
  './vendor/three/addons/objects/Sky.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

/** Cache-bust query strings must not create separate offline entries. */
function bare(req) {
  const url = new URL(req.url);
  if (!url.search) return req;
  url.search = '';
  return new Request(url.toString(), { headers: req.headers, mode: 'same-origin', credentials: req.credentials });
}

function keep(response) {
  if (!response.ok || response.type !== 'basic') return false;
  const type = response.headers.get('content-type') || '';
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX) return false;
  if (!type) return true;
  return /javascript|css|html|json|svg|png|jpe?g|webp|gif|csv|manifest|wasm|woff2?|ttf|otf|glb|gltf|octet-stream|webmanifest|audio|wav|mp3|ogg|opus|mpeg|mp4|aac|m4a/.test(type);
}

async function put(cache, req, response) {
  const key = bare(req);
  await cache.put(key, response.clone());
  if (key.url !== req.url) await cache.put(req, response.clone());
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
      if (fresh.ok && keep(fresh)) await put(cache, req, fresh);
      if (fresh.ok && req.mode === 'navigate') await cache.put('./index.html', fresh.clone());
      return fresh;
    } catch (error) {
      const hit = await cache.match(req)
        || await cache.match(bare(req))
        || (req.mode === 'navigate' ? await cache.match('./index.html') : undefined);
      if (hit) return hit;
      throw error;
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'warm' || !Array.isArray(event.data.urls)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(event.data.urls.map(async path => {
      try {
        const req = new Request(path, { cache: 'reload' });
        const fresh = await fetch(req);
        if (fresh.ok && keep(fresh)) await put(cache, req, fresh);
      } catch {}
    }));
  })());
});
