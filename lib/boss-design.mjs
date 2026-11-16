/** Shared Build your boss parts, presets, names, and browser storage. */

export const PARTS = {
  head: ['caterpillar', 'spider', 'shark', 'squid', 'gator', 'octopus'],
  body: ['wiggly', 'round', 'long', 'finned', 'scaly', 'none'],
  legs: ['stubby', 'spider', 'tentacles', 'fins', 'none'],
  color: ['green', 'purple', 'red', 'blue', 'orange', 'pink', 'gray', 'teal'],
  eyes: [2, 4, 6],
  extra: ['feelers', 'horns', 'spikes', 'fin', 'none'],
  size: [1, 2, 3]
};

/** What each choice is called on the builder. */
export const PART_NAMES = {
  head: { caterpillar: 'Caterpillar', spider: 'Spider', shark: 'Shark', squid: 'Squid', gator: 'Gator', octopus: 'Octopus' },
  body: { wiggly: 'Wiggly', round: 'Round', long: 'Long', finned: 'Shark tail', scaly: 'Gator tail', none: 'Just a head' },
  legs: { stubby: 'Stubby legs', spider: 'Spider legs', tentacles: 'Tentacles', fins: 'Fins', none: 'No legs' },
  color: { green: 'Green', purple: 'Purple', red: 'Red', blue: 'Blue', orange: 'Orange', pink: 'Pink', gray: 'Gray', teal: 'Teal' },
  eyes: { 2: '2 eyes', 4: '4 eyes', 6: '6 eyes' },
  extra: { feelers: 'Feelers', horns: 'Horns', spikes: 'Spikes', fin: 'Big fin', none: 'Nothing' },
  size: { 1: 'Small', 2: 'Big', 3: 'Huge' }
};

export const DEFAULT_BOSS = { head: 'caterpillar', body: 'wiggly', legs: 'stubby', color: 'green', eyes: 2, extra: 'feelers', size: 2 };

/** Ready-made bosses: one tap sets every part, then the child can change any of them. */
export const PRESETS = {
  caterpillar: { ...DEFAULT_BOSS },
  spider: { head: 'spider', body: 'round', legs: 'spider', color: 'purple', eyes: 6, extra: 'none', size: 2 },
  shark: { head: 'shark', body: 'finned', legs: 'fins', color: 'gray', eyes: 2, extra: 'fin', size: 3 },
  squid: { head: 'squid', body: 'none', legs: 'tentacles', color: 'pink', eyes: 2, extra: 'none', size: 2 },
  gator: { head: 'gator', body: 'scaly', legs: 'stubby', color: 'green', eyes: 2, extra: 'spikes', size: 3 },
  octopus: { head: 'octopus', body: 'none', legs: 'tentacles', color: 'red', eyes: 2, extra: 'none', size: 2 }
};

/** A picture for each head, for the builder's ready-made row and the chase meter. */
export const BOSS_EMOJI = { caterpillar: '🐛', spider: '🕷️', shark: '🦈', squid: '🦑', gator: '🐊', octopus: '🐙' };

/** A boss design with every part valid. Unknown parts fall back to the default. */
export function normalizeBoss(raw) {
  const out = {};
  for (const key of Object.keys(PARTS)) {
    const want = raw?.[key];
    const hit = PARTS[key].find(v => String(v) === String(want));
    out[key] = hit ?? DEFAULT_BOSS[key];
  }
  return out;
}

/** The next (step 1) or previous (step -1) choice for one part. */
export function cyclePart(boss, key, step = 1) {
  const list = PARTS[key];
  if (!list) return normalizeBoss(boss);
  const b = normalizeBoss(boss);
  const i = list.findIndex(v => String(v) === String(b[key]));
  return { ...b, [key]: list[((i + step) % list.length + list.length) % list.length] };
}

/** A boss with every part picked at random. */
export function randomBoss(rnd = Math.random) {
  const out = {};
  for (const [key, list] of Object.entries(PARTS)) out[key] = list[Math.floor(rnd() * list.length)];
  return out;
}

const FIRST = { caterpillar: 'Chompy', spider: 'Fangy', shark: 'Bitey', squid: 'Squishy', gator: 'Snappy', octopus: 'Inky' };
const LAST = { wiggly: 'Wiggles', round: 'Bubbles', long: 'Noodle', finned: 'Finn', scaly: 'Scales', none: 'Blob' };

/** A silly name from the head and body, like "Fangy Noodle". */
export function bossName(boss) {
  const b = normalizeBoss(boss);
  return `${FIRST[b.head]} ${LAST[b.body]}`;
}

const STORE = 'sprouts-boss-v1';

export function readBoss(storage) {
  try {
    const raw = (storage ?? globalThis.localStorage)?.getItem(STORE);
    return raw ? normalizeBoss(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveBoss(boss, storage) {
  const b = normalizeBoss(boss);
  try { (storage ?? globalThis.localStorage)?.setItem(STORE, JSON.stringify(b)); } catch { /* private window */ }
  return b;
}
