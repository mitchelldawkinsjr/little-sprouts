// Kokoro runs here so a prompt cannot freeze taps or the Next button.
// Identical lines are reused: first from memory, then from this browser’s storage, and only then generated.
// Requests: INIT, SYNTHESIZE, PREFETCH, CANCEL, CLEAR_CACHE, GET_STATUS. Replies: READY, PROGRESS, AUDIO, ERROR, STATUS.
import { DTYPE, MODEL, clipKey, createQueue, evictionPlan, usable } from './speech-core.mjs?v=mix-level';

const KOKORO = 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1';
const MEMORY_LIMIT = 32;
const STORE_LIMIT = 160;
const STORES = ['audio', 'meta'];

let model = null, loading = null, loadFailed = false, busy = false, latest = 0;
let base = null, persistOff = false, quotaHits = 0, writes = 0, progressAt = 0;
const queue = createQueue();
const memory = new Map();
const files = new Map();

const post = (message, transfer = []) => self.postMessage(message, transfer);
const why = error => String(error?.message || error || 'unknown');

function request(call) {
  return new Promise((resolve, reject) => {
    call.onsuccess = () => resolve(call.result);
    call.onerror = () => reject(call.error);
  });
}

function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('storage aborted'));
  });
}

function own(samples) {
  // The model hands back a view of its own memory. Copy each value now, before the next line reuses it.
  const out = new Float32Array(samples?.length || 0);
  for (let i = 0; i < out.length; i++) out[i] = samples[i];
  return out;
}

function floatsFrom(stored) {
  if (!stored) return null;
  if (stored instanceof Float32Array) return own(stored);
  const buffer = stored instanceof ArrayBuffer ? stored : stored.buffer;
  const offset = stored instanceof ArrayBuffer ? 0 : stored.byteOffset || 0;
  const bytes = stored instanceof ArrayBuffer ? buffer.byteLength : stored.byteLength;
  if (!buffer || bytes < 4 || bytes % 4) return null;
  return own(new Float32Array(buffer, offset, bytes / 4));
}

function database() {
  if (persistOff || typeof indexedDB === 'undefined') return Promise.reject(new Error('storage off'));
  base ??= new Promise((resolve, reject) => {
    const open = indexedDB.open('sprouts-voice', 3);
    open.onupgradeneeded = () => {
      const db = open.result;
      for (const name of STORES) {
        if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name);
      }
      for (const name of STORES) db.createObjectStore(name);
    };
    open.onsuccess = () => {
      const db = open.result;
      // Another tab upgrading the store must not be held up by this one.
      db.onversionchange = () => { db.close(); base = null; };
      db.onclose = () => { base = null; };
      resolve(db);
    };
    open.onerror = () => reject(open.error);
    open.onblocked = () => reject(new Error('storage blocked by another tab'));
  }).catch(error => {
    base = null;
    throw error;
  });
  return base;
}

function remember(key, samples, rate) {
  memory.delete(key);
  memory.set(key, { samples, rate });
  while (memory.size > MEMORY_LIMIT) memory.delete(memory.keys().next().value);
}

async function trim(limit) {
  const db = await database();
  const meta = db.transaction('meta', 'readonly').objectStore('meta');
  const [rows, keys] = await Promise.all([request(meta.getAll()), request(meta.getAllKeys())]);
  const doomed = evictionPlan(keys.map((key, i) => ({ key, at: rows[i]?.at || 0 })), limit);
  if (!doomed.length) return;
  const tx = db.transaction(STORES, 'readwrite');
  for (const key of doomed) {
    tx.objectStore('audio').delete(key);
    tx.objectStore('meta').delete(key);
  }
  await done(tx);
}

async function storageTrouble(error) {
  if (error?.name !== 'QuotaExceededError') return;
  quotaHits += 1;
  if (quotaHits >= 2) persistOff = true;
  post({ type: 'ERROR', kind: 'storage', message: persistOff ? 'storage full; saving paused' : 'storage full' });
  try { await trim(Math.floor(STORE_LIMIT / 2)); } catch { /* memory still holds this visit’s lines */ }
}

async function persist(key, samples, rate) {
  if (persistOff) return;
  try {
    const db = await database();
    const tx = db.transaction(STORES, 'readwrite');
    tx.objectStore('audio').put(samples.slice().buffer, key);
    tx.objectStore('meta').put({ rate, at: Date.now() }, key);
    await done(tx);
    writes += 1;
    if (writes === 1 || writes % 20 === 0) await trim(STORE_LIMIT);
  } catch (error) {
    await storageTrouble(error);
  }
}

async function forget(key) {
  try {
    const db = await database();
    const tx = db.transaction(STORES, 'readwrite');
    tx.objectStore('audio').delete(key);
    tx.objectStore('meta').delete(key);
    await done(tx);
  } catch { /* the bad clip is skipped either way */ }
}

async function touch(key, rate) {
  try {
    const db = await database();
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ rate, at: Date.now() }, key);
    await done(tx);
  } catch { /* only the eviction order is affected */ }
}

async function recall(key) {
  const hit = memory.get(key);
  if (hit) {
    memory.delete(key);
    memory.set(key, hit);
    return { ...hit, source: 'memory' };
  }
  if (persistOff) return null;
  try {
    const db = await database();
    const tx = db.transaction(STORES, 'readonly');
    const [buffer, meta] = await Promise.all([
      request(tx.objectStore('audio').get(key)),
      request(tx.objectStore('meta').get(key))
    ]);
    if (!buffer) return null;
    const samples = floatsFrom(buffer);
    if (!samples || !usable(samples)) {
      void forget(key);
      return null;
    }
    const rate = meta?.rate || 24000;
    remember(key, samples, rate);
    void touch(key, rate);
    return { samples, rate, source: 'store' };
  } catch {
    return null;
  }
}

function send(job, clip, source, synthMs) {
  const samples = new Float32Array(clip.samples);
  post({ type: 'AUDIO', id: job.id, text: job.text, voice: job.voice, speed: job.speed, samples, rate: clip.rate, source, synthMs: Math.round(synthMs) }, [samples.buffer]);
}

function progress(info) {
  if (!info?.file || typeof info.loaded !== 'number') return;
  files.set(info.file, { loaded: info.loaded, total: info.total || 0 });
  const now = Date.now();
  if (now - progressAt < 200) return;
  progressAt = now;
  let loaded = 0, total = 0;
  for (const file of files.values()) {
    loaded += file.loaded;
    total += file.total;
  }
  if (total) post({ type: 'PROGRESS', progress: Math.min(0.99, loaded / total) });
}

function load() {
  if (model) return Promise.resolve(model);
  if (loadFailed) return Promise.reject(new Error('voice unavailable'));
  // q8 on CPU. The smaller and GPU builds sometimes return static or garbled audio.
  loading ??= (async () => {
    const started = performance.now();
    const { KokoroTTS } = await import(KOKORO);
    model = await KokoroTTS.from_pretrained(MODEL, { dtype: DTYPE, device: 'wasm', progress_callback: progress });
    post({ type: 'READY', loadMs: Math.round(performance.now() - started) });
    return model;
  })().catch(error => {
    loadFailed = true;
    loading = null;
    queue.clear();
    post({ type: 'ERROR', kind: 'load', message: why(error) });
    throw error;
  });
  return loading;
}

async function run(job) {
  const fore = job.id != null;
  const live = () => fore && job.id === latest;
  // Prefetched lines go to the page too, so they play at once even while this worker is busy generating.
  const hand = (clip, source, ms) => { if (live() || !fore) send(job, clip, source, ms); };
  const hit = await recall(job.key);
  if (hit) {
    if (live() || (!fore && hit.source === 'store')) hand(hit, hit.source, 0);
    return;
  }
  if (fore && !live()) return;
  if (!fore) {
    // Generation blocks this thread, so let a waiting tap’s message in first.
    await new Promise(resolve => setTimeout(resolve, 0));
    if (queue.waiting) return queue.requeue(job);
  }
  let tts;
  try { tts = await load(); }
  catch { return; }
  if (fore && !live()) return;
  if (!fore && queue.waiting) return queue.requeue(job);
  const started = performance.now();
  try {
    const audio = await tts.generate(job.text, { voice: job.voice, speed: job.speed });
    const samples = own(audio.audio);
    const rate = audio.sampling_rate || 24000;
    if (!usable(samples)) throw new Error('unusable audio');
    remember(job.key, samples, rate);
    hand({ samples, rate }, 'model', performance.now() - started);
    void persist(job.key, samples, rate);
  } catch (error) {
    if (live()) post({ type: 'ERROR', id: job.id, kind: 'synth', message: why(error) });
  }
}

async function kick() {
  if (busy) return;
  busy = true;
  try {
    for (let job = queue.take(); job; job = queue.take()) await run(job);
  } finally {
    busy = false;
  }
}

async function status() {
  let stored = null;
  try {
    const db = await database();
    stored = await request(db.transaction('meta', 'readonly').objectStore('meta').count());
  } catch { /* storage is off or unavailable */ }
  return {
    type: 'STATUS',
    model: model ? 'ready' : loading ? 'loading' : loadFailed ? 'failed' : 'idle',
    cache: { memory: memory.size, stored, saving: !persistOff, queued: queue.size }
  };
}

async function clearCache() {
  memory.clear();
  try {
    const db = await database();
    const tx = db.transaction(STORES, 'readwrite');
    for (const name of STORES) tx.objectStore(name).clear();
    await done(tx);
  } catch { /* nothing stored to clear */ }
}

function job(item, id) {
  const text = String(item.text || '');
  const voice = String(item.voice || '');
  const speed = Number(item.speed) || 1;
  return { id, text, voice, speed, key: clipKey({ voice, text, speed }) };
}

self.onmessage = event => {
  const data = event.data || {};
  switch (data.type) {
    case 'INIT':
      if (model) { post({ type: 'READY', loadMs: null }); break; }
      loadFailed = false;
      load().catch(() => {});
      break;
    case 'SYNTHESIZE': {
      const next = job(data, data.id);
      latest = next.id;
      queue.cancel();
      if (!data.cachedOnly) {
        queue.foreground(next);
        kick();
        break;
      }
      // While the model is still loading, only a stored line can answer.
      recall(next.key).then(hit => {
        if (next.id !== latest) return;
        if (hit) send(next, hit, hit.source, 0);
        else post({ type: 'ERROR', id: next.id, kind: 'miss', message: 'not stored' });
      });
      break;
    }
    case 'PREFETCH':
      for (const item of data.items || []) {
        const next = job(item);
        if (next.text && next.voice && !memory.has(next.key)) queue.prefetch(next, data.priority);
      }
      kick();
      break;
    case 'CANCEL':
      queue.cancel(data.id);
      if (data.id == null || data.id === latest) latest = 0;
      break;
    case 'CLEAR_CACHE':
      clearCache().then(status).then(post);
      break;
    case 'GET_STATUS':
      status().then(post);
      break;
  }
};
