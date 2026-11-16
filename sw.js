const PREFIX = 'sprouts-offline-';
const CACHE = `${PREFIX}v1`;
/** Written at image build (and by server/serve.mjs): every shipped file with a content stamp. */
const LIST = './offline-files.json';
const PARALLEL = 6;
const MAX = 20_000_000;
/** On a slow connection, a saved copy answers after this long instead of waiting on the network. */
const SLOW_MS = 3000;
const SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './logic.mjs',
  './sheet.csv',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  './vendor/fonts/fonts.css',
  './vendor/fonts/dm-sans.woff2',
  './vendor/fonts/outfit.woff2',
  './vendor/three/build/three.module.js',
  './vendor/three/addons/objects/Sky.js'
];
/** The folders the build list covers. Saved files there that this device no longer needs are deleted. */
const LISTED = /^\.\/(sidecars|vendor|lib|app|logic|games|icons|voice)\//;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(SHELL.map(async path => {
      const res = await fetch(path, { cache: 'no-cache' });
      if (res.ok) await cache.put(path, res);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys
      // Skybound keeps its own cache from its own worker. Only drop ours.
      .filter(key => key.startsWith(PREFIX) && key !== CACHE)
      .map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

/** './path' for a same-origin address: the form the build list and the saved stamps use. */
function pathOf(url) {
  return `.${new URL(url).pathname}`;
}

/** Every file is saved once, under its address without the ?v= cache-bust query. */
function bare(req) {
  const url = new URL(req.url);
  url.search = '';
  return url.toString();
}

function keep(response) {
  if (!response.ok || response.status !== 200 || response.type !== 'basic') return false;
  const type = response.headers.get('content-type') || '';
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX) return false;
  if (!type) return true;
  return /javascript|css|html|json|svg|png|jpe?g|webp|gif|csv|manifest|wasm|woff2?|ttf|otf|glb|gltf|octet-stream|webmanifest|audio|wav|mp3|ogg|opus|mpeg|mp4|aac|m4a|gzip|model|font|image|text/.test(type);
}

const MATCH = { ignoreVary: true };

/** The app page itself, not a sidecar loading in its frame. */
function isShell(req, url) {
  return req.mode === 'navigate' && req.destination === 'document'
    && /^\/(index\.html)?$/.test(url.pathname);
}

const STAMPS = './__offline-stamps.json';
/** The files this device keeps, as of the last finished warm: the app reads it offline to tell which games are whole. */
const SAVED_LIST = './__offline-files.json';
const STATUS = './__offline-status.json';

// What is saved (path → stamp), and what the newest build ships (path → stamp), known once a warm has
// fetched the build list while this worker runs.
let stampsLoad = null;
let shippedNow = null;
const stampsReady = () => (stampsLoad ||= caches.open(CACHE).then(readStamps));
// A worker that just woke up fetches the build list once, so saved files answer at once from then on.
let listLoad = null;
const loadList = () => (listLoad ||= shipped().then(list => { if (!shippedNow && Object.keys(list).length) shippedNow = list; }));

/** A saved copy that is already the newest build's version answers at once, without the network. */
async function current(cache, req, url) {
  if (!shippedNow) loadList();
  if (req.mode === 'navigate' || !shippedNow) return null;
  const path = pathOf(url);
  const stamp = shippedNow[path];
  if (!stamp || (await stampsReady())[path] !== stamp) return null;
  return cache.match(bare(req), MATCH);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/link')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const ready = await current(cache, req, url);
    if (ready) return ready;
    const saved = () => cache.match(bare(req), MATCH)
      .then(hit => hit || (req.mode === 'navigate' && !url.pathname.startsWith('/sidecars/')
        ? cache.match('./index.html', MATCH) : undefined));
    const network = fetch(req).then(fresh => {
      // Hand the page the response at once; saving the copy finishes in the background.
      if (fresh.ok && keep(fresh)) {
        event.waitUntil(cache.put(bare(req), fresh.clone()).catch(() => {}));
        if (isShell(req, url)) event.waitUntil(cache.put('./index.html', fresh.clone()).catch(() => {}));
      }
      return fresh;
    });
    network.catch(() => {});
    // A slow network: a saved copy, if there is one, answers after SLOW_MS. The download still finishes and is saved.
    const slow = new Promise(resolve => setTimeout(() => saved().then(hit => hit && resolve(hit)), SLOW_MS));
    try {
      return await Promise.race([network, slow]);
    } catch (error) {
      const hit = await saved();
      if (hit) return hit;
      throw error;
    }
  })());
});

/** Path → stamp ("sha1prefix-size") for every shipped file. Empty when there is no list. */
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

async function readStamps(cache) {
  try {
    return (await (await cache.match(STAMPS))?.json()) || {};
  } catch {
    return {};
  }
}

function json(value) {
  return new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } });
}

/** Size in bytes from a "hash-size" stamp. Files without one count as 1. */
function bytes(stamp) {
  const n = Number(String(stamp || '').split('-')[1]);
  return n > 0 ? n : 1;
}

/** True when a saved copy already holds the file a stamp names (its SHA-1 starts with the stamp's hash). */
async function sameFile(saved, stamp) {
  const [hash, size] = String(stamp).split('-');
  if (!/^[0-9a-f]{8,40}$/.test(hash) || !saved) return false;
  const body = await saved.arrayBuffer();
  if (body.byteLength !== Number(size)) return false;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-1', body));
  return Array.from(digest, b => b.toString(16).padStart(2, '0')).join('').startsWith(hash);
}

/**
 * The files this device needs. Every voice is shipped, but only the voices this family hears are
 * saved. Backroad rally ships each sound twice and plays the .opus copy when the browser can.
 */
function wanted(list, { voices = [], opus = false } = {}) {
  const keepVoices = new Set(voices);
  const out = {};
  for (const [path, stamp] of Object.entries(list)) {
    const voice = /^\.\/voice\/[^/]+\/([^/]+)\//.exec(path);
    if (voice && !keepVoices.has(voice[1])) continue;
    if (opus && /^\.\/sidecars\/rally\/audio\/.*\.m4a$/.test(path)) continue;
    out[path] = stamp;
  }
  return out;
}

let last = null;

async function tell(state) {
  last = state;
  if (state.state !== 'saving') {
    const cache = await caches.open(CACHE);
    await cache.put(STATUS, json(state));
  }
  for (const client of await self.clients.matchAll({ includeUncontrolled: true })) {
    client.postMessage({ type: 'offline-progress', ...state });
  }
}

/** Delete old ?v= copies, and saved files in the listed folders that this device no longer needs. */
async function prune(cache, need, stamps) {
  for (const req of await cache.keys()) {
    const path = pathOf(req.url);
    if (new URL(req.url).search || (LISTED.test(path) && !need[path])) {
      await cache.delete(req);
      delete stamps[path];
    }
  }
}

/**
 * Fetch files that are missing, or whose stamp changed since they were saved.
 * Reports progress to every open page. Ready means every file this device needs is saved.
 * A warm cut short resumes on the next request.
 */
async function warm(options) {
  const cache = await caches.open(CACHE);
  const list = await shipped();
  if (!Object.keys(list).length) return;
  shippedNow = list;
  const need = wanted(list, options);
  const stamps = await stampsReady();
  const todo = Object.keys(need);
  let total = 0;
  for (const path of todo) total += bytes(need[path]);
  let saved = 0;
  let failed = 0;
  let checked = 0;
  let next = 0;
  let sinceSave = 0;
  let lastTell = 0;
  const report = () => {
    const now = Date.now();
    if (now - lastTell < 400) return;
    lastTell = now;
    return tell({ state: 'saving', saved, total, failed, checked, count: todo.length });
  };
  async function lane() {
    while (next < todo.length) {
      const path = todo[next++];
      const stamp = need[path];
      let ok = false;
      try {
        const have = stamps[path] === stamp ? await cache.match(path, MATCH) : null;
        if (have) {
          ok = true;
        } else if (await sameFile(await cache.match(path, MATCH), stamp)) {
          // Saved before, under an older kind of stamp: the same bytes, so no download.
          stamps[path] = stamp;
          ok = true;
        } else {
          const fresh = await fetch(path, { cache: 'no-cache' });
          if (fresh.ok && keep(fresh)) {
            await cache.put(path, fresh);
            stamps[path] = stamp;
            if (++sinceSave % 25 === 0) await cache.put(STAMPS, json(stamps));
            ok = true;
          }
        }
      } catch {}
      checked++;
      if (ok) saved += bytes(stamp);
      else failed++;
      report();
    }
  }
  await tell({ state: 'saving', saved, total, failed, checked, count: todo.length });
  await Promise.all(Array.from({ length: PARALLEL }, lane));
  await prune(cache, need, stamps);
  await cache.put(STAMPS, json(stamps));
  await cache.put(SAVED_LIST, json(need));
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
  if (type !== 'warm') return;
  const options = {
    voices: Array.isArray(event.data.voices) ? event.data.voices.map(String) : [],
    opus: event.data.opus === true,
  };
  if (!running) running = warm(options).finally(() => { running = null; });
  else if (last) event.source?.postMessage({ type: 'offline-progress', ...last });
  event.waitUntil(running);
});
