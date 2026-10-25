// Pieces of the voice system with no browser parts, shared by speech.js, speech-worker.js, and the tests.
export const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
export const DTYPE = 'q8';
export const SPEED = 1;
export const CACHE_VERSION = 4;
const KEY_HEAD = `v${CACHE_VERSION}|${MODEL}|${DTYPE}|`;

// Lines said word for word in many games, so they are worth making before they are needed.
export const commonLines = [
  'Try another one.',
  'Keep exploring. Try another one!',
  'Try another letter.',
  'Look again.',
  'Not a match.',
  'Next maze.'
];

// A blank voice follows the grown-up's pick. Hosts only take their own voice when character voices are on.
export const profiles = {
  narrator: { label: 'Narrator', voice: null, line: 'Hi! Tap a picture to play.' },
  readingCoach: { label: 'Reading coach', voice: null, line: 'Park on the word see.' },
  mathCoach: { label: 'Math coach', voice: null, line: 'What is 3 + 4?' },
  sportsHost: { label: 'Sports host', voice: 'am_michael', line: 'Yes! Turbo!' },
  gameHost: { label: 'Game host', voice: 'bf_emma', line: 'You hooked the fish.' }
};

const ROLE_OF_MODE = {
  words: 'readingCoach', build: 'readingCoach', lanes: 'readingCoach',
  count: 'mathCoach', path: 'mathCoach', catch: 'mathCoach',
  race: 'sportsHost', rocket: 'sportsHost', lunar: 'sportsHost', rally: 'sportsHost', bike: 'sportsHost', flight: 'sportsHost',
  hook: 'gameHost', sky: 'gameHost', planet: 'gameHost', marble: 'gameHost', bridge: 'gameHost', maze: 'gameHost',
  chase: 'gameHost', hop: 'gameHost', toast: 'gameHost', glide: 'gameHost', aisle: 'gameHost', lily: 'gameHost',
  puzzle: 'gameHost', match: 'gameHost', merge: 'gameHost', sort: 'gameHost', crayon: 'gameHost', trace: 'gameHost',
  walk: 'gameHost', paint: 'gameHost'
};

export function contextFor(mode) {
  return ROLE_OF_MODE[mode] || 'narrator';
}

export function voiceFor(context, parentVoice, characterVoices = false) {
  const own = profiles[context]?.voice;
  return characterVoices && own ? own : parentVoice;
}

export function clipKey({ voice, text, speed = SPEED }) {
  return `${KEY_HEAD}${voice}|${speed}|${text}`;
}

export function currentKey(key) {
  return typeof key === 'string' && key.startsWith(KEY_HEAD);
}

// Rejects silence, static, and runaway values before they reach a speaker.
export function usable(samples) {
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

// Stored clips from older model or key versions go first, then the least recently heard past the limit.
export function evictionPlan(rows, limit) {
  const stale = rows.filter(row => !currentKey(row.key)).map(row => row.key);
  const fresh = rows.filter(row => currentKey(row.key)).sort((a, b) => (a.at || 0) - (b.at || 0));
  const over = Math.max(0, fresh.length - Math.max(0, limit));
  return stale.concat(fresh.slice(0, over).map(row => row.key));
}

const RETRY_MS = [5000, 30000, 120000];

export function retryDelay(attempt) {
  return RETRY_MS[attempt - 1] ?? null;
}

// engine: idle | loading | ready | failed | unsupported. fallback: not-ready | on-error | never.
// 'cached' plays a stored Kokoro clip if one exists and otherwise falls back.
export function chooseEngine({ engine, fallback = 'not-ready', browser = false, store = true }) {
  if (engine === 'ready') return 'kokoro';
  const waiting = engine === 'idle' || engine === 'loading';
  if (waiting && fallback !== 'not-ready') return 'kokoro';
  if (engine !== 'unsupported' && store) return 'cached';
  return fallback !== 'never' && browser ? 'browser' : null;
}

export function settler(resolve) {
  let settled = false;
  return (status, engine = null) => {
    if (settled) return false;
    settled = true;
    resolve({ status, engine });
    return true;
  };
}

const PLURAL = { 1: 'ones', 2: 'twos', 3: 'threes', 4: 'fours', 5: 'fives', 6: 'sixes', 7: 'sevens', 8: 'eights', 9: 'nines', 10: 'tens', 11: 'elevens', 12: 'twelves', 20: 'twenties', 30: 'thirties', 100: 'hundreds' };
const ABBREVIATIONS = [[/\bMr\./g, 'Mister'], [/\bMrs\./g, 'Missus'], [/\bMs\./g, 'Miz'], [/\bDr\./g, 'Doctor'], [/\bvs\./gi, 'versus'], [/\betc\./gi, 'et cetera']];

export function speakable(text, { spell = false } = {}) {
  let s = String(text ?? '').replace(/\p{Extended_Pictographic}\uFE0F?/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (spell) {
    const letters = s.replace(/[^A-Za-z]/g, '').toUpperCase();
    return letters ? `${[...letters].join(', ')}.` : '';
  }
  for (const [pattern, word] of ABBREVIATIONS) s = s.replace(pattern, word);
  s = s
    .replace(/(\d)\s*[×*]\s*(?=\d)/g, '$1 times ')
    .replace(/(\d) x (?=\d)/g, '$1 times ')
    .replace(/(\d)\s*÷\s*(?=\d)/g, '$1 divided by ')
    .replace(/(\d)\s*\+\s*(?=\d)/g, '$1 plus ')
    .replace(/(\d)\s*−\s*(?=\d)/g, '$1 minus ')
    .replace(/(\d) - (?=\d)/g, '$1 minus ')
    .replace(/\s*=\s*\?/g, ' equals what?')
    .replace(/(\d)\s*=\s*(?=\d)/g, '$1 equals ')
    .replace(/\b(\d+)s\b/g, (whole, n) => PLURAL[n] || whole)
    .replace(/\s*&\s*/g, ' and ');
  return s.replace(/\s+/g, ' ').trim();
}

// Only the newest foreground line is kept. Prefetch waits behind it and never repeats a key.
export function createQueue(limit = 48) {
  let fore = null;
  const back = [];
  const has = key => fore?.key === key || back.some(job => job.key === key);
  return {
    foreground(job) { fore = job; },
    cancel(id) { if (fore && (id == null || fore.id === id)) fore = null; },
    prefetch(job, priority = 'background') {
      if (has(job.key)) return false;
      if (priority === 'next') back.unshift(job);
      else back.push(job);
      if (back.length > limit) back.length = limit;
      return true;
    },
    requeue(job) { if (!has(job.key)) back.unshift(job); },
    take() {
      if (fore) {
        const job = fore;
        fore = null;
        return job;
      }
      return back.shift() || null;
    },
    clear() { fore = null; back.length = 0; },
    get waiting() { return !!fore; },
    get size() { return back.length + (fore ? 1 : 0); }
  };
}
