// The offline service worker (sw.js), run in Node with a fake cache and a fake network.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const ORIGIN = 'https://sprouts.test';
const source = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const abs = (u) => new URL(typeof u === 'string' ? u : u.url, `${ORIGIN}/`).toString();
const stamp = (body) => `${createHash('sha1').update(body).digest('hex').slice(0, 16)}-${Buffer.byteLength(body)}`;

/** A Cache Storage that keeps each entry's bytes and headers. */
function fakeCaches() {
  const stores = new Map();
  const open = async (name) => {
    if (!stores.has(name)) {
      const entries = new Map();
      stores.set(name, {
        entries,
        async put(req, res) { entries.set(abs(req), { body: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type') }); },
        async match(req, opts = {}) {
          let url = abs(req);
          if (opts.ignoreSearch) url = url.split('?')[0];
          const hit = entries.get(url) || (opts.ignoreSearch ? [...entries].find(([k]) => k.split('?')[0] === url)?.[1] : null);
          return hit ? new Response(hit.body, { headers: hit.type ? { 'content-type': hit.type } : {} }) : undefined;
        },
        async keys() { return [...entries.keys()].map(url => new Request(url)); },
        async delete(req) { return entries.delete(abs(req)); },
      });
    }
    return stores.get(name);
  };
  return { open, keys: async () => [...stores.keys()], delete: async (n) => stores.delete(n), stores };
}

/** Load sw.js against `files` (path → body) served by a network that can be switched off. */
function worker(files) {
  const listeners = {};
  const net = { on: true, calls: [] };
  const caches = fakeCaches();
  const fetch = async (input) => {
    const url = new URL(abs(input));
    net.calls.push(url.pathname + url.search);
    if (!net.on) throw new TypeError('offline');
    if (url.pathname === '/offline-files.json') {
      const list = Object.fromEntries(Object.entries(files).map(([p, b]) => [`.${p}`, stamp(b)]));
      return Response.json(list);
    }
    const body = files[url.pathname];
    if (body === undefined) return new Response('', { status: 404 });
    const res = new Response(body, { headers: { 'content-type': 'text/plain' } });
    Object.defineProperty(res, 'type', { value: 'basic' });
    return res;
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type, fn) => { listeners[type] = fn; },
    clients: { matchAll: async () => [], claim: async () => {} },
    skipWaiting: async () => {},
  };
  vm.runInNewContext(source, { self, caches, fetch, Request, Response, URL, crypto, setTimeout, clearTimeout, Promise, JSON, Date, Uint8Array, Array, Number, String, Object, Set, Map });
  const warm = async (data = {}) => {
    let done;
    listeners.message({ data: { type: 'warm', ...data }, source: null, waitUntil: (p) => { done = p; } });
    await done;
  };
  const get = async (path) => {
    let answer;
    const waits = [];
    listeners.fetch({ request: new Request(abs(path)), respondWith: (p) => { answer = p; }, waitUntil: (p) => waits.push(p) });
    const res = await answer;
    await Promise.all(waits);
    return res;
  };
  const saved = async () => [...(await caches.open('sprouts-offline-v1')).entries.keys()].map(u => u.slice(ORIGIN.length));
  return { warm, get, net, caches, saved };
}

const FILES = {
  '/sidecars/rally/audio/beep.opus': 'opus beep',
  '/sidecars/rally/audio/beep.m4a': 'm4a beep',
  '/voice/1/af_heart/a.m4a': 'heart line',
  '/voice/1/bm_george/a.m4a': 'george line',
  '/lib/tool.js': 'export const v = 1;',
};

test('saves only what this device needs: its own voice, and one copy of each Rally sound', async () => {
  const sw = worker(FILES);
  await sw.warm({ voices: ['af_heart'], opus: true });
  const saved = await sw.saved();
  assert.ok(saved.includes('/voice/1/af_heart/a.m4a'));
  assert.ok(saved.includes('/sidecars/rally/audio/beep.opus'));
  assert.ok(!saved.includes('/voice/1/bm_george/a.m4a'));
  assert.ok(!saved.includes('/sidecars/rally/audio/beep.m4a'));
});

test('a second save downloads nothing when no file changed', async () => {
  const sw = worker(FILES);
  await sw.warm({ voices: ['af_heart'] });
  sw.net.calls.length = 0;
  await sw.warm({ voices: ['af_heart'] });
  assert.deepEqual(sw.net.calls.filter(c => !c.startsWith('/offline-files.json')), []);
});

test('a file saved under an old time stamp is kept when its bytes are the same', async () => {
  const sw = worker({ '/lib/tool.js': FILES['/lib/tool.js'] });
  const cache = await sw.caches.open('sprouts-offline-v1');
  await cache.put('./lib/tool.js', new Response(FILES['/lib/tool.js']));
  await cache.put('./__offline-stamps.json', Response.json({ './lib/tool.js': '1794766319-19' }));
  await sw.warm({});
  assert.deepEqual(sw.net.calls.filter(c => c === '/lib/tool.js'), []);
});

test('a changed file is downloaded again, and a removed one is deleted', async () => {
  const files = { ...FILES };
  const sw = worker(files);
  await sw.warm({ voices: ['af_heart'] });
  files['/lib/tool.js'] = 'export const v = 2;';
  delete files['/voice/1/af_heart/a.m4a'];
  sw.net.calls.length = 0;
  await sw.warm({ voices: ['af_heart'] });
  assert.ok(sw.net.calls.includes('/lib/tool.js'));
  assert.equal(await (await sw.get('/lib/tool.js?v=2')).text(), 'export const v = 2;');
  assert.ok(!(await sw.saved()).includes('/voice/1/af_heart/a.m4a'));
});

test('a saved, current file answers without the network; offline, any saved copy answers', async () => {
  const sw = worker(FILES);
  await sw.warm({});
  sw.net.calls.length = 0;
  assert.equal(await (await sw.get('/lib/tool.js?v=abc')).text(), 'export const v = 1;');
  assert.deepEqual(sw.net.calls, []);
  sw.net.on = false;
  await sw.get('/style-only-cached-by-play.css').then(() => assert.fail('nothing saved'), () => {});
  const cache = await sw.caches.open('sprouts-offline-v1');
  await cache.put('./games/x.js', new Response('saved x'));
  assert.equal(await (await sw.get('/games/x.js?v=9')).text(), 'saved x');
});

test('an online answer is saved once, under its address without ?v=', async () => {
  const sw = worker({ '/games/y.js': 'y' });
  await sw.get('/games/y.js?v=1');
  const saved = await sw.saved();
  assert.ok(saved.includes('/games/y.js'));
  assert.ok(!saved.some(p => p.includes('?')));
});
