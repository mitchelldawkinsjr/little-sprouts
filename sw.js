const PREFIX = 'sprouts-offline-';
const CACHE = `${PREFIX}v1`;
/** Written at image build: every shipped file, so sidecars with hashed names stay current. */
const LIST = './offline-files.json';
const PARALLEL = 6;
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
    .then(keys => Promise.all(keys
      // Skybound keeps its own cache from its own worker. Only drop ours.
      .filter(key => key.startsWith(PREFIX) && key !== CACHE)
      .map(key => caches.delete(key))))
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
  return /javascript|css|html|json|svg|png|jpe?g|webp|gif|csv|manifest|wasm|woff2?|ttf|otf|glb|gltf|octet-stream|webmanifest|audio|wav|mp3|ogg|opus|mpeg|mp4|aac|m4a|gzip|model|font|image|text/.test(type);
}

async function put(cache, req, response) {
  const key = bare(req);
  await cache.put(key, response.clone());
  if (key.url !== req.url) await cache.put(req, response.clone());
}

const MATCH = { ignoreVary: true };

/** The app page itself, not a sidecar loading in its frame. */
function isShell(req, url) {
  return req.mode === 'navigate' && req.destination === 'document'
    && /^\/(index\.html)?$/.test(url.pathname);
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
      if (fresh.ok && isShell(req, url)) await cache.put('./index.html', fresh.clone());
      return fresh;
    } catch (error) {
      const hit = await cache.match(req, MATCH)
        || await cache.match(bare(req), MATCH)
        || (req.mode === 'navigate' && !url.pathname.startsWith('/sidecars/')
          ? await cache.match('./index.html', MATCH) : undefined);
      if (hit) return hit;
      throw error;
    }
  })());
});

/** Path → version stamp (mtime-size) for every shipped file. Empty when there is no list, as in local dev. */
async function shipped() {
  try {
    const res = await fetch(`${LIST}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return {};
    const list = await res.json();
    return list && typeof list === 'object' && !Array.isArray(list) ? list : {};
  } catch {
    return {};
  }
}

const STAMPS = './__offline-stamps.json';

async function readStamps(cache) {
  try {
    return (await (await cache.match(STAMPS))?.json()) || {};
  } catch {
    return {};
  }
}

function saveStamps(cache, stamps) {
  return cache.put(STAMPS, new Response(JSON.stringify(stamps), { headers: { 'content-type': 'application/json' } }));
}

/** Size in bytes from a "mtime-size" stamp. Files without one count as 1. */
function bytes(stamp) {
  const n = Number(String(stamp || '').split('-')[1]);
  return n > 0 ? n : 1;
}

let last = null;

const STATUS = './__offline-status.json';

async function tell(state) {
  last = state;
  if (state.state !== 'saving') {
    const cache = await caches.open(CACHE);
    await cache.put(STATUS, new Response(JSON.stringify(state), { headers: { 'content-type': 'application/json' } }));
  }
  for (const client of await self.clients.matchAll({ includeUncontrolled: true })) {
    client.postMessage({ type: 'offline-progress', ...state });
  }
}

/**
 * Fetch files that are missing, or whose stamp changed since they were cached.
 * Reports progress to every open page. Ready means every file on the build list
 * (or, without one, every requested file) is saved. A warm cut short resumes on the next request.
 */
async function warm(urls) {
  const cache = await caches.open(CACHE);
  const list = await shipped();
  const stamps = await readStamps(cache);
  const todo = [...new Set([...Object.keys(list), ...urls])];
  // The build list is the truth. The page's own list only counts when there is no build list.
  const needed = new Set(Object.keys(list).length ? Object.keys(list) : urls);
  let total = 0;
  for (const path of needed) total += bytes(list[path]);
  let saved = 0;
  let failed = 0;
  let checked = 0;
  let next = 0;
  let sinceSave = 0;
  let lastTell = 0;
  const report = (force = false) => {
    const now = Date.now();
    if (!force && now - lastTell < 400) return;
    lastTell = now;
    return tell({ state: 'saving', saved, total, failed, checked, count: todo.length });
  };
  async function lane() {
    while (next < todo.length) {
      const path = todo[next++];
      const stamp = list[path];
      let ok = false;
      try {
        const req = new Request(path, { cache: 'no-cache' });
        const have = await cache.match(req, MATCH) || await cache.match(bare(req), MATCH);
        if (have && (!stamp || stamps[path] === stamp)) {
          ok = true;
        } else {
          const fresh = await fetch(req);
          if (fresh.ok && keep(fresh)) {
            await put(cache, req, fresh);
            if (stamp) stamps[path] = stamp;
            if (++sinceSave % 25 === 0) await saveStamps(cache, stamps);
            ok = true;
          }
        }
      } catch {}
      checked++;
      if (needed.has(path)) {
        if (ok) saved += bytes(stamp);
        else failed++;
      }
      report();
    }
  }
  await tell({ state: 'saving', saved, total, failed, checked, count: todo.length });
  await Promise.all(Array.from({ length: PARALLEL }, lane));
  await saveStamps(cache, stamps);
  await tell({ state: failed ? 'partial' : 'ready', saved, total, failed, checked, count: todo.length });
}

let running = null;

self.addEventListener('message', event => {
  const type = event.data?.type;
  if (type === 'offline-status') {
    event.waitUntil((async () => {
      let state = last;
      if (!state) {
        try { state = await (await (await caches.open(CACHE)).match(STATUS))?.json(); } catch {}
      }
      if (state) event.source?.postMessage({ type: 'offline-progress', ...state });
    })());
    return;
  }
  if (type !== 'warm' || !Array.isArray(event.data.urls)) return;
  if (!running) running = warm(event.data.urls).finally(() => { running = null; });
  else if (last) event.source?.postMessage({ type: 'offline-progress', ...last });
  event.waitUntil(running);
});
