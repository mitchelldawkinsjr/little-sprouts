// Kokoro runs here so a prompt cannot freeze taps or the Next button.
// Identical lines are reused: first from memory, then from this browser’s storage, and only then generated.
const KOKORO = 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1';
const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const SPEED = 1;
const MEMORY_LIMIT = 24;
const STORE_LIMIT = 80;

let model, loading, failed = false, latest = 0, queued = null, busy = false, preloaded = false;
const prefetch = [];
const memory = new Map();

function keyOf(voice, text) {
  return `${voice}\n${SPEED}\n${text}`;
}

function request(call) {
  return new Promise((resolve, reject) => {
    call.onsuccess = () => resolve(call.result);
    call.onerror = () => reject(call.error);
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

function usable(samples) {
  if (!samples || samples.length < 400) return false;
  let peak = 0, sum = 0, crossings = 0, wild = 0, prev = 0;
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i];
    if (!Number.isFinite(x)) return false;
    const mag = Math.abs(x);
    if (mag > peak) peak = mag;
    if (mag > 1.5) wild++;
    sum += x * x;
    if (i && (x >= 0) !== (prev >= 0)) crossings++;
    prev = x;
  }
  const rms = Math.sqrt(sum / samples.length);
  const zcr = crossings / samples.length;
  return peak >= 0.02 && peak <= 1.5 && rms >= 0.008 && wild / samples.length < 0.002 && zcr < 0.4;
}

function database() {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('sprouts-voice', 3);
    open.onupgradeneeded = () => {
      const db = open.result;
      for (const name of ['audio', 'meta']) {
        if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name);
      }
      db.createObjectStore('audio');
      db.createObjectStore('meta');
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}

function rememberMemory(key, samples, rate) {
  memory.delete(key);
  memory.set(key, { samples, rate });
  while (memory.size > MEMORY_LIMIT) memory.delete(memory.keys().next().value);
}

let writes = 0;

async function persist(key, samples, rate) {
  const saved = samples.slice();
  try {
    const base = await database();
    const tx = base.transaction(['audio', 'meta'], 'readwrite');
    const meta = tx.objectStore('meta');
    tx.objectStore('audio').put(saved.buffer, key);
    meta.put({ rate, at: Date.now() }, key);
    writes += 1;
    if (writes % 20 === 0) {
      const [rows, keys] = await Promise.all([request(meta.getAll()), request(meta.getAllKeys())]);
      if (keys.length > STORE_LIMIT) {
        rows.map((row, i) => ({ key: keys[i], at: row?.at || 0 }))
          .sort((a, b) => a.at - b.at)
          .slice(0, keys.length - STORE_LIMIT)
          .forEach(row => {
            meta.delete(row.key);
            tx.objectStore('audio').delete(row.key);
          });
      }
    }
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
  } catch { /* a missed save only means the line is generated again next visit */ }
}

async function recall(key) {
  const hit = memory.get(key);
  if (hit) {
    memory.delete(key);
    memory.set(key, hit);
    return hit;
  }
  try {
    const base = await database();
    const tx = base.transaction(['audio', 'meta'], 'readonly');
    const [buffer, meta] = await Promise.all([
      request(tx.objectStore('audio').get(key)),
      request(tx.objectStore('meta').get(key))
    ]);
    if (!buffer) return null;
    const samples = floatsFrom(buffer);
    if (!samples) return null;
    const rate = meta?.rate || 24000;
    rememberMemory(key, samples, rate);
    return { samples, rate };
  } catch {
    return null;
  }
}

function reply(id, samples, rate) {
  const copy = new Float32Array(samples);
  self.postMessage({ id, samples: copy, rate }, [copy.buffer]);
}

async function kick() {
  if (busy) return;
  busy = true;
  try {
    for (;;) {
      const job = queued || prefetch.shift();
      if (!job) break;
      if (job === queued) queued = null;
      if (job.preload) {
        await load();
        continue;
      }
      const key = keyOf(job.voice, job.text);
      const mine = job.id;
      if (job.prefetch && queued) {
        prefetch.unshift(job);
        continue;
      }
      const hit = await recall(key);
      if (job.prefetch && queued) {
        prefetch.unshift(job);
        continue;
      }
      if (hit && usable(hit.samples)) {
        if (!job.prefetch && mine === latest && !queued) reply(mine, hit.samples, hit.rate);
        continue;
      }
      if (hit) memory.delete(key);
      if (!job.prefetch && (mine !== latest || queued)) continue;
      try {
        const tts = await load();
        if (job.prefetch && queued) {
          prefetch.unshift(job);
          continue;
        }
        if (!job.prefetch && (mine !== latest || queued)) continue;
        const audio = await tts.generate(job.text, { voice: job.voice, speed: SPEED });
        const samples = own(audio.audio);
        const rate = audio.sampling_rate || 24000;
        if (!usable(samples)) throw new Error('unusable audio');
        rememberMemory(key, samples, rate);
        if (!job.prefetch && mine === latest && !queued) reply(mine, samples, rate);
        void persist(key, samples, rate);
      } catch (error) {
        if (!job.prefetch && mine === latest && !queued) self.postMessage({ id: mine, error: String(error) });
      }
    }
  } finally {
    busy = false;
    if (queued || prefetch.length) kick();
  }
}

async function load() {
  if (model) return model;
  if (failed) throw new Error('voice unavailable');
  // q8 on CPU. The smaller and GPU builds sometimes return static or garbled audio.
  loading ??= (async () => {
    const { KokoroTTS } = await import(KOKORO);
    return KokoroTTS.from_pretrained(MODEL, { dtype: 'q8', device: 'wasm' });
  })();
  try {
    model = await loading;
    return model;
  } catch (error) {
    failed = true;
    loading = null;
    throw error;
  }
}

self.onmessage = event => {
  const data = event.data;
  if (data.preload) {
    if (preloaded || model) return;
    preloaded = true;
    prefetch.unshift({ preload: true, prefetch: true });
    kick();
    return;
  }
  if (data.prefetch) {
    const key = keyOf(data.voice, data.text);
    if (memory.has(key) || prefetch.some(job => job.text === data.text && job.voice === data.voice)) return;
    prefetch.push({ prefetch: true, text: data.text, voice: data.voice });
    kick();
    return;
  }
  latest = data.id;
  queued = data;
  kick();
};
