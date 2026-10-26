// Spoken prompts use Kokoro on this device. Generation runs in a worker so the games stay tappable.
// The browser’s own voice speaks while Kokoro is still downloading with no stored copy of the line,
// when Kokoro cannot run here, or when a new line is still not ready after 2 seconds.
// A clip that finishes after that switch is kept, so the next time plays from here.
// A queued line waits its turn, so the question on screen is not thrown away by the next line.
import { SPEED, bakedPath, chooseEngine, clipKey, commonLines, contextFor, profiles, retryDelay, settler, speakable, usable, voiceFor, voiceGain } from './speech-core.mjs?v=lamp';

export { commonLines, contextFor, profiles, voiceFor };

const STALL_MS = 2000;
const STORED_MS = 600;
const CLIP_LIMIT = 48;
const TRAIL_LIMIT = 50;

export const voices = [
  ['af_heart', 'Heart · American'],
  ['af_bella', 'Bella · American'],
  ['af_sarah', 'Sarah · American'],
  ['af_nicole', 'Nicole · American'],
  ['am_adam', 'Adam · American'],
  ['am_michael', 'Michael · American'],
  ['bf_emma', 'Emma · British'],
  ['bf_isabella', 'Isabella · British'],
  ['bm_george', 'George · British']
];
export const defaultVoice = 'af_heart';
export const sampleLine = 'Hi! Let’s find the circle.';

export function knownVoice(id) {
  return voices.some(([voice]) => voice === id) ? id : defaultVoice;
}

const now = () => performance.now();
const audioCtor = () => globalThis.AudioContext || globalThis.webkitAudioContext;
const browserVoice = () => 'speechSynthesis' in globalThis && typeof globalThis.SpeechSynthesisUtterance === 'function';
const supported = () => typeof globalThis.Worker === 'function' && typeof globalThis.WebAssembly === 'object' && !!audioCtor();
const DEV = ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname) || /[?&]voicedebug\b/.test(globalThis.location?.search || '');

const state = { engine: supported() ? 'idle' : 'unsupported', progress: 0, loadMs: null, error: null, attempts: 0, retryAt: 0, cache: null };
const metrics = { requests: 0, kokoro: 0, browser: 0, cacheHits: 0, completed: 0, interrupted: 0, failed: 0, skipped: 0, fallbacks: {} };
const trail = [];
const listeners = new Set();
const clips = new Map();
const upcoming = [];
const LINE_LIMIT = 6;
let ctx = null, worker = null, current = null, nextId = 0, loadStarted = 0, askedStatus = 0;

function note(entry) {
  if (!DEV) return;
  trail.push(entry);
  if (trail.length > TRAIL_LIMIT) trail.shift();
  console.debug('[voice]', entry);
}

function snapshot() {
  return {
    engine: state.engine,
    progress: state.progress,
    loadMs: state.loadMs,
    error: state.error,
    attempts: state.attempts,
    retryIn: state.retryAt ? Math.max(0, state.retryAt - Date.now()) : null,
    speaking: current?.startedAt ? current.engine : null,
    cache: state.cache,
    metrics: { ...metrics, fallbacks: { ...metrics.fallbacks } },
    log: trail.slice()
  };
}

function emit() {
  if (!listeners.size) return;
  const shot = snapshot();
  for (const listener of listeners) {
    try { listener(shot); } catch { /* a broken listener must not stop speech */ }
  }
}

export function onSpeechStatus(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSpeechStatus() {
  if (worker && Date.now() - askedStatus > 2000) {
    askedStatus = Date.now();
    worker.postMessage({ type: 'GET_STATUS' });
  }
  return snapshot();
}

export function canSpeak() {
  const browser = browserVoice();
  if (state.engine === 'unsupported' || (state.engine === 'failed' && !state.retryAt)) return browser;
  return !!audioCtor() || browser;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function prime() {
  const AudioCtx = audioCtor();
  if (!AudioCtx) return Promise.resolve();
  try { ctx ??= new AudioCtx(); }
  catch { return Promise.resolve(); }
  if (ctx.state === 'running') return Promise.resolve();
  // Without a tap, resume can wait forever on phones. Give up quickly and let play() decide.
  return Promise.race([Promise.resolve(ctx.resume?.()).catch(() => {}), wait(300)]);
}

function markFailed(kind, message) {
  state.attempts += 1;
  const delay = retryDelay(state.attempts);
  state.engine = 'failed';
  state.error = `${kind}: ${message}`;
  state.retryAt = delay == null ? 0 : Date.now() + delay;
  note({ event: 'engine-failed', kind, attempts: state.attempts });
  emit();
}

function crashed(message) {
  try { worker?.terminate(); } catch { /* already gone */ }
  worker = null;
  markFailed('worker', message);
  if (waitingOnWorker(current)) fallBack(current, 'worker-error');
}

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./speech-worker.js?v=mix-level', import.meta.url), { type: 'module' });
  worker.onmessage = event => receive(event.data || {});
  worker.onerror = event => {
    event?.preventDefault?.();
    crashed(event?.message || 'worker error');
  };
  return worker;
}

// Returns true when Kokoro is ready or on its way. Automatic retries wait for their backoff; force skips it.
function startEngine(force = false) {
  if (state.engine === 'ready' || state.engine === 'loading') return true;
  if (state.engine === 'unsupported') return false;
  if (state.engine === 'failed' && !force && (!state.retryAt || Date.now() < state.retryAt)) return false;
  try { ensureWorker().postMessage({ type: 'INIT' }); }
  catch (error) {
    markFailed('worker', String(error?.message || error));
    return false;
  }
  state.engine = 'loading';
  state.error = null;
  state.progress = 0;
  loadStarted = now();
  emit();
  return true;
}

function waitingOnWorker(req) {
  return !!req && !req.done && req.engine === 'kokoro' && !req.node && req.source !== 'file';
}

function keep(key, clip) {
  clips.delete(key);
  clips.set(key, clip);
  while (clips.size > CLIP_LIMIT) clips.delete(clips.keys().next().value);
}

function stored(key) {
  const hit = clips.get(key);
  if (!hit) return null;
  clips.delete(key);
  clips.set(key, hit);
  return hit;
}

function arm(req, ms, then) {
  clearTimeout(req.guard);
  req.guard = setTimeout(then, ms);
}

function begin(req) {
  if (req.startedAt) return;
  req.startedAt = now();
  metrics[req.engine] += 1;
  emit();
}

function finish(req, status) {
  if (req.done) return;
  req.done = true;
  clearTimeout(req.guard);
  if (current === req) current = null;
  metrics[status] += 1;
  const end = now();
  note({
    id: req.id, status, engine: req.engine, voice: req.voice, context: req.context, chars: req.text.length,
    source: req.source ?? null, reason: req.reason ?? null, synthMs: req.synthMs ?? null,
    waitMs: req.startedAt ? Math.round(req.startedAt - req.asked) : null,
    playMs: req.startedAt ? Math.round(end - req.startedAt) : null
  });
  req.settle(status, req.engine);
  emit();
  if (status !== 'interrupted') pump();
}

function halt(req) {
  if (req.utterance) globalThis.speechSynthesis?.cancel();
  try { req.node?.stop(); } catch { /* already stopped */ }
}

function browserSay(req, reason) {
  const synth = globalThis.speechSynthesis;
  req.engine = 'browser';
  req.reason = reason;
  metrics.fallbacks[reason] = (metrics.fallbacks[reason] || 0) + 1;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(req.text);
  utterance.rate = SPEED;
  utterance.volume = 1;
  utterance.onstart = () => begin(req);
  utterance.onend = () => finish(req, 'completed');
  utterance.onerror = event => finish(req, ['interrupted', 'canceled'].includes(event?.error) ? 'interrupted' : 'failed');
  req.utterance = utterance;
  synth.speak(utterance);
  // Some browsers never send end. The guard keeps a waiting caller from hanging.
  arm(req, 4000 + req.text.length * 150, () => finish(req, 'completed'));
}

function fallBack(req, reason) {
  if (!req || req.done || current !== req) return;
  clearTimeout(req.guard);
  if (req.fallback === 'never' || !browserVoice()) {
    req.reason = reason;
    finish(req, 'failed');
    return;
  }
  browserSay(req, reason);
}

async function play(req, clip) {
  await req.resumed;
  if (current !== req || req.done || req.engine === 'browser') return;
  if (!usable(clip.samples)) return fallBack(req, 'bad-audio');
  if (!ctx || ctx.state !== 'running') return fallBack(req, 'audio-locked');
  const buffer = ctx.createBuffer(1, clip.samples.length, clip.rate || 24000);
  buffer.getChannelData(0).set(clip.samples);
  const node = ctx.createBufferSource();
  node.buffer = buffer;
  const level = ctx.createGain();
  level.gain.value = voiceGain(clip.samples);
  node.connect(level);
  level.connect(ctx.destination);
  node.onended = () => finish(req, 'completed');
  req.node = node;
  begin(req);
  node.start();
  arm(req, buffer.duration * 1000 + 2000, () => finish(req, 'completed'));
}

function receive(message) {
  switch (message.type) {
    case 'PROGRESS':
      state.progress = message.progress;
      emit();
      break;
    case 'READY':
      state.engine = 'ready';
      state.progress = 1;
      state.loadMs = message.loadMs ?? state.loadMs ?? Math.round(now() - loadStarted);
      state.attempts = 0;
      state.retryAt = 0;
      state.error = null;
      note({ event: 'ready', loadMs: state.loadMs });
      if (waitingOnWorker(current) && !current.cachedOnly) arm(current, STALL_MS, () => fallBack(current, 'stall'));
      emit();
      break;
    case 'AUDIO': {
      const clip = { samples: message.samples, rate: message.rate };
      const req = current;
      const mine = waitingOnWorker(req) && req.id === message.id;
      if (!usable(clip.samples)) {
        if (mine) fallBack(req, 'bad-audio');
        break;
      }
      keep(clipKey(message), clip);
      if (!mine) break;
      clearTimeout(req.guard);
      req.source = message.source;
      req.synthMs = message.synthMs;
      if (message.source !== 'model') metrics.cacheHits += 1;
      play(req, clip);
      break;
    }
    case 'ERROR': {
      if (message.kind === 'load') markFailed('load', message.message);
      else if (message.kind !== 'miss') note({ event: 'error', kind: message.kind });
      const req = current;
      if (!waitingOnWorker(req)) break;
      if (message.kind === 'load') {
        if (!req.cachedOnly) fallBack(req, 'load-error');
      } else if (message.id === req.id) fallBack(req, message.kind === 'miss' ? req.missReason : 'synth-error');
      break;
    }
    case 'STATUS':
      state.cache = message.cache;
      emit();
      break;
  }
}

function dropUpcoming(reason) {
  const waiting = upcoming.splice(0);
  for (const item of waiting) {
    item.reason ??= reason;
    item.settle('interrupted', null);
  }
}

function waitingText(text) {
  return (current && current.text === text) || upcoming.some(item => item.text === text);
}

function pump() {
  if (current || !upcoming.length) return;
  startLine(upcoming.shift());
}

export function stop(reason = 'interrupted') {
  dropUpcoming(reason);
  const req = current;
  if (!req) return;
  current = null;
  if (waitingOnWorker(req)) worker?.postMessage({ type: 'CANCEL', id: req.id });
  halt(req);
  req.reason ??= reason;
  finish(req, 'interrupted');
}

const MISS_REASON = { idle: 'not-ready', loading: 'not-ready', failed: 'engine-failed', unsupported: 'unsupported' };

function askWorker(req) {
  const before = state.engine;
  const route = chooseEngine({ engine: before, fallback: req.fallback, browser: browserVoice(), store: !!worker || before === 'idle' || before === 'loading' });
  if (route === 'browser') {
    if (before === 'idle') startEngine();
    browserSay(req, MISS_REASON[before] || 'not-ready');
    return;
  }
  if (!route) {
    req.reason = MISS_REASON[before] || null;
    finish(req, 'failed');
    return;
  }
  req.engine = 'kokoro';
  req.source = null;
  req.cachedOnly = route === 'cached';
  req.missReason = MISS_REASON[before] || 'not-ready';
  if (before === 'idle' && !startEngine()) {
    fallBack(req, 'engine-failed');
    return;
  }
  try {
    ensureWorker().postMessage({ type: 'SYNTHESIZE', id: req.id, text: req.text, voice: req.voice, speed: req.speed, cachedOnly: req.cachedOnly });
  } catch (error) {
    crashed(String(error?.message || error));
    return;
  }
  if (req.cachedOnly) arm(req, STORED_MS, () => fallBack(req, req.missReason));
  else if (state.engine === 'ready') arm(req, STALL_MS, () => fallBack(req, 'stall'));
}

// A shipped line plays before Kokoro has downloaded. A missing file falls through to generation.
async function playFile(req, path) {
  req.engine = 'kokoro';
  req.source = 'file';
  arm(req, STALL_MS, () => fallBack(req, 'stall'));
  try {
    const response = await fetch(new URL(path, import.meta.url));
    if (!response.ok) throw new Error('missing');
    const bytes = await response.arrayBuffer();
    await req.resumed;
    if (current !== req || req.done || req.engine === 'browser') return;
    if (!ctx || ctx.state !== 'running') return fallBack(req, 'audio-locked');
    const audio = await ctx.decodeAudioData(bytes.slice(0));
    if (current !== req || req.done || req.engine === 'browser') return;
    const channel = audio.getChannelData(0);
    const samples = new Float32Array(channel.length);
    samples.set(channel);
    if (!usable(samples)) throw new Error('unusable');
    const clip = { samples, rate: audio.sampleRate || 24000 };
    keep(clipKey(req), clip);
    metrics.cacheHits += 1;
    req.synthMs = 0;
    play(req, clip);
  } catch {
    if (current !== req || req.done || req.engine === 'browser') return;
    askWorker(req);
  }
}

function startLine(req) {
  req.id = ++nextId;
  req.asked = now();
  current = req;
  req.resumed = prime();
  const hit = stored(clipKey(req));
  if (hit) {
    req.engine = 'kokoro';
    req.source = 'page';
    metrics.cacheHits += 1;
    play(req, hit);
    return;
  }
  const path = bakedPath(req);
  if (path) {
    void playFile(req, path);
    return;
  }
  askWorker(req);
}

// Resolves once the line has finished, been cut off, or could not be said: { status, engine }.
// queue holds the line until the one already speaking finishes, instead of cutting it off.
export function speakAndWait(text, { voiceId, context = 'narrator', interrupt = true, queue = false, fallback = 'not-ready', spell = false } = {}) {
  let settle;
  const finished = new Promise(resolve => { settle = settler(resolve); });
  metrics.requests += 1;
  const spoken = speakable(text, { spell });
  if (!spoken || (!queue && !interrupt && current)) {
    metrics.skipped += 1;
    settle('skipped', null);
    return finished;
  }
  const req = { text: spoken, voice: knownVoice(voiceId), speed: SPEED, context, fallback, settle, engine: null, asked: now() };
  if (queue) {
    if (waitingText(spoken)) {
      metrics.skipped += 1;
      settle('skipped', null);
      return finished;
    }
    if (current) {
      upcoming.push(req);
      if (upcoming.length > LINE_LIMIT) {
        const dropped = upcoming.shift();
        metrics.skipped += 1;
        dropped.settle('skipped', null);
      }
      return finished;
    }
  } else stop();
  startLine(req);
  return finished;
}

// The older call shape. full waits for Kokoro to download instead of using the browser voice meanwhile.
// queue keeps this line behind the one already speaking so a question is not thrown away.
export function speak(text, voice, opts = {}) {
  return speakAndWait(text, {
    voiceId: voice,
    context: opts.context,
    spell: opts.spell,
    queue: opts.queue,
    fallback: opts.fallback || (opts.full ? 'on-error' : 'not-ready')
  });
}

export function prefetchSpeech(items, { priority = 'background' } = {}) {
  const jobs = [];
  for (const item of items || []) {
    const { text, voiceId, spell } = typeof item === 'string' ? { text: item } : item || {};
    const spoken = speakable(text, { spell });
    if (!spoken) continue;
    const job = { text: spoken, voice: knownVoice(voiceId), speed: SPEED };
    if (!clips.has(clipKey(job)) && !bakedPath(job)) jobs.push(job);
  }
  if (!jobs.length || !startEngine()) return 0;
  worker.postMessage({ type: 'PREFETCH', items: jobs, priority });
  return jobs.length;
}

export function warm(voiceId, { lines = commonLines } = {}) {
  prefetchSpeech(lines.map(text => ({ text, voiceId })));
  // Repeated lines are already files. The model still has to download for a new word or question.
  startEngine();
}

// For a grown-up's tap: tries again even after earlier failures and reports download progress.
export function prepareSpeech({ voiceId, onProgress } = {}) {
  prime();
  if (state.engine === 'ready' || state.engine === 'unsupported') return Promise.resolve({ status: state.engine });
  startEngine(true);
  if (state.engine !== 'loading') return Promise.resolve({ status: state.engine, error: state.error });
  if (voiceId) warm(voiceId);
  return new Promise(resolve => {
    const off = onSpeechStatus(shot => {
      if (shot.engine === 'loading') {
        onProgress?.(shot.progress);
        return;
      }
      off();
      resolve({ status: shot.engine, error: shot.error });
    });
  });
}

export function clearSpeechCache() {
  clips.clear();
  worker?.postMessage({ type: 'CLEAR_CACHE' });
}

if (globalThis.document?.addEventListener) {
  // Phones keep audio locked until a tap. Unlock on any tap so timed prompts later can play.
  for (const type of ['pointerdown', 'keydown']) document.addEventListener(type, () => { prime(); }, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop('hidden'); });
}
if (DEV) globalThis.sproutsVoice = { status: getSpeechStatus, clear: clearSpeechCache };
