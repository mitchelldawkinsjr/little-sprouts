// Spoken prompts use Kokoro on this device. Generation runs in a worker so the games stay tappable.
// A line that is not ready almost immediately is spoken by the browser so play does not sit in silence.
const SPEED = 1;
const FALLBACK_MS = 220;

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

export function canSpeak() {
  const audio = 'AudioContext' in window || 'webkitAudioContext' in window;
  const browser = 'speechSynthesis' in window;
  if (failed) return browser;
  return audio || browser;
}

const REPEATED = [
  'You found it! Great growing!',
  'Try another one.',
  'Try another letter.',
  'You did it! Great growing!'
];

let ctx, source, token = 0, worker, failed = false, fallbackTimer = 0;
const waiters = new Map();
const clips = new Map();

function prime() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx ??= new AudioCtx();
  return ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
}

function halt() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  try { source?.stop(); } catch { /* already stopped */ }
  source = null;
}

function finishWaiters() {
  for (const waiter of waiters.values()) waiter.resolve();
  waiters.clear();
}

function clearFallback() {
  clearTimeout(fallbackTimer);
  fallbackTimer = 0;
}

function settle(waiter) {
  if (!waiter || waiter.settled) return;
  waiter.settled = true;
  waiter.resolve();
}

export function stop() {
  token += 1;
  clearFallback();
  halt();
  finishWaiters();
}

function browserSay(text) {
  if (!text || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = SPEED;
  speechSynthesis.speak(utterance);
}

function clipKey(text, voice) {
  return `${knownVoice(voice)}\n${text}`;
}

function keep(text, voice, samples, rate) {
  const key = clipKey(text, voice);
  clips.delete(key);
  clips.set(key, { samples, rate });
  while (clips.size > 24) clips.delete(clips.keys().next().value);
}

function usable(samples) {
  if (!samples || samples.length < 400) return false;
  let peak = 0, wild = 0;
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i];
    if (!Number.isFinite(x)) return false;
    const mag = Math.abs(x);
    if (mag > peak) peak = mag;
    if (mag > 1.5) wild++;
  }
  return peak >= 0.02 && peak <= 1.5 && wild / samples.length < 0.002;
}

function play(samples, rate) {
  if (!ctx || !usable(samples)) return false;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  const copy = new Float32Array(samples.length);
  for (let i = 0; i < copy.length; i++) copy[i] = samples[i];
  const buffer = ctx.createBuffer(1, copy.length, rate || 24000);
  buffer.getChannelData(0).set(copy);
  const node = ctx.createBufferSource();
  node.buffer = buffer;
  node.connect(ctx.destination);
  source = node;
  node.onended = () => { if (source === node) source = null; };
  node.start();
  return true;
}

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./speech-worker.js?v=voice-clean', import.meta.url), { type: 'module' });
  worker.onmessage = async event => {
    const { id, samples, rate, error } = event.data;
    const waiter = waiters.get(id);
    if (!waiter || id !== token) {
      waiter?.resolve();
      waiters.delete(id);
      return;
    }
    try {
      if (error) {
        if (waiter.live !== 'browser') browserSay(waiter.text);
      } else {
        keep(waiter.text, waiter.voice, samples, rate);
        if (waiter.live !== 'browser') {
          clearFallback();
          if (waiter.resumed) await waiter.resumed;
          if (id !== token) return;
          if (!play(samples, rate)) browserSay(waiter.text);
        }
      }
    } finally {
      settle(waiter);
      waiters.delete(id);
    }
  };
  worker.onerror = () => {
    failed = true;
    clearFallback();
    const current = waiters.get(token);
    if (current && current.live !== 'browser') browserSay(current.text);
    finishWaiters();
  };
  return worker;
}

function stored(text, voice) {
  const key = clipKey(text, voice);
  const hit = clips.get(key);
  if (!hit) return null;
  clips.delete(key);
  clips.set(key, hit);
  return hit;
}

export function warm(voice) {
  if (failed) return;
  try {
    const chosen = knownVoice(voice);
    const active = ensureWorker();
    active.postMessage({ preload: true });
    for (const text of REPEATED) {
      if (!stored(text, chosen)) active.postMessage({ prefetch: true, text, voice: chosen });
    }
  } catch { /* the next spoken line still tries */ }
}

function armFallback(id) {
  clearFallback();
  fallbackTimer = setTimeout(() => {
    if (id !== token) return;
    const waiter = waiters.get(id);
    if (!waiter || waiter.live) return;
    waiter.live = 'browser';
    browserSay(waiter.text);
    settle(waiter);
  }, FALLBACK_MS);
}

export function speak(text, voice, opts = {}) {
  const mine = ++token;
  clearFallback();
  halt();
  finishWaiters();
  const resumed = prime();
  const chosen = knownVoice(voice);
  if (failed) {
    browserSay(text);
    return Promise.resolve();
  }
  const hit = stored(text, chosen);
  if (hit) {
    return Promise.resolve(resumed).then(() => {
      if (mine !== token) return;
      if (!play(hit.samples, hit.rate)) browserSay(text);
    });
  }
  return new Promise(resolve => {
    waiters.set(mine, { resolve, resumed, text, voice: chosen });
    if (!opts.full) armFallback(mine);
    try {
      ensureWorker().postMessage({ id: mine, text, voice: chosen });
    } catch {
      failed = true;
      clearFallback();
      browserSay(text);
      resolve();
      waiters.delete(mine);
    }
  });
}
