/**
 * Block meadow questions. Inside Little Sprouts the host sends them from the learner's profile.
 * On the game's own page these simple ones stand in. Either way the page works with
 * { key, prompt, show, kind, word, letters, choices: [{ label, fill, shape, ok? }] }.
 */

const COLORS = [
  ['red', '#dc6253'], ['blue', '#538cbf'], ['yellow', '#f5d400'], ['green', '#76a265'],
  ['orange', '#e99d4d'], ['purple', '#a381c0'], ['pink', '#e5a2bd'], ['brown', '#9a7153']
];
const SHAPES = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'diamond', 'star', 'hexagon'];

function pickN(rnd, list, n) {
  const pool = [...list];
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return out;
}

function numberChoices(rnd, answer, n, max) {
  const set = new Set([answer]);
  for (let tries = 0; set.size < n && tries < 40; tries++) {
    const near = answer + Math.round((rnd() - 0.5) * 6);
    if (near >= 0 && near <= max) set.add(near);
  }
  for (let v = 0; set.size < n; v++) set.add(v);
  return pickN(rnd, [...set], set.size).map(v => ({ label: String(v), ok: v === answer }));
}

/** A simple question for the game's own page. Kinds take turns. */
export function localQuestion(rnd, index = 0) {
  const kind = ['add', 'color', 'count', 'shape'][Math.abs(index) % 4];
  const key = `local-${index}`;
  if (kind === 'add') {
    const a = 1 + Math.floor(rnd() * 5);
    const b = 1 + Math.floor(rnd() * 4);
    return { key, prompt: `What is ${a} + ${b}?`, show: '', kind: 'math', choices: numberChoices(rnd, a + b, 3, 10) };
  }
  if (kind === 'count') {
    const n = 2 + Math.floor(rnd() * 5);
    const show = `<div class="countrow">${'<span>🧱</span>'.repeat(n)}</div>`;
    return { key, prompt: 'How many blocks?', show, kind: 'math', choices: numberChoices(rnd, n, 3, 9) };
  }
  if (kind === 'color') {
    const picks = pickN(rnd, COLORS, 3);
    const target = picks[Math.floor(rnd() * picks.length)];
    return {
      key,
      prompt: `Which one is ${target[0]}?`,
      show: '',
      kind: 'match',
      choices: picks.map(([label, fill]) => ({ label, fill, ok: label === target[0] }))
    };
  }
  const picks = pickN(rnd, SHAPES, 3);
  const target = picks[Math.floor(rnd() * picks.length)];
  return {
    key,
    prompt: `Find the ${target}.`,
    show: '',
    kind: 'match',
    choices: picks.map(name => ({ label: name, shape: name, fill: '#5d7a45', ok: name === target }))
  };
}

/** Make a host ask message safe to use. Returns null when it cannot be asked. */
export function normalizeAsk(msg) {
  if (!msg || !Array.isArray(msg.choices)) return null;
  const choices = msg.choices.slice(0, 6).map(c => ({
    label: String(c?.label ?? ''),
    fill: typeof c?.fill === 'string' ? c.fill : '',
    shape: typeof c?.shape === 'string' ? c.shape : ''
  }));
  const kind = String(msg.kind || '');
  const word = String(msg.word || '');
  const letters = Array.isArray(msg.letters) ? msg.letters.map(String) : [];
  const spelling = kind === 'spell' && word && letters.length;
  if (!spelling && choices.length < 2) return null;
  const prompt = String(msg.prompt || '');
  return {
    key: `${msg.round ?? ''}|${prompt}|${choices.map(c => c.label).join(',')}`,
    prompt,
    show: String(msg.show || ''),
    kind: spelling ? 'spell' : kind,
    word,
    letters,
    choices,
    freeEvery: Math.round(+msg.freeEvery) || 0,
    sound: msg.sound !== false
  };
}

/** How many right answers before free build: the host's number when it sends one, else five. */
export function goalFrom(ask, fallback = 5) {
  const n = Math.round(+ask?.freeEvery);
  return n >= 1 && n <= 12 ? n : fallback;
}

/** Spelling: is `letter` the next one the word needs after `built`? */
export function nextLetterOk(word, built, letter) {
  const next = String(word || '')[String(built || '').length];
  return next != null && String(letter).toLowerCase() === next.toLowerCase();
}

/** Where to put the next gift box: a ring around the player that grows with each one found. */
export function chestDistance(found) {
  return Math.min(34, 12 + found * 4);
}

/** Saved world, clamped so a damaged save cannot break the page. */
export function readSave(raw, { starter, all }) {
  let data = null;
  try { data = JSON.parse(raw || 'null'); } catch { data = null; }
  if (!data || typeof data !== 'object') return null;
  const edits = Array.isArray(data.edits)
    ? data.edits.filter(e => Array.isArray(e) && typeof e[0] === 'string' && /^-?\d+\.-?\d+\.-?\d+$/.test(e[0]) && (e[1] === '' || all.includes(e[1])))
    : [];
  const pos = Array.isArray(data.pos) && data.pos.length === 3 && data.pos.every(Number.isFinite) ? data.pos : null;
  const unlocked = Array.isArray(data.unlocked) ? data.unlocked.filter(t => all.includes(t)) : [];
  // Starter blocks first, in their own order (new ones show up for old saves too), then the rest.
  unlocked.splice(0, unlocked.length, ...starter, ...unlocked.filter(t => !starter.includes(t)));
  return {
    edits: edits.slice(-40000),
    pos,
    yaw: Number.isFinite(data.yaw) ? data.yaw : 0,
    pitch: Number.isFinite(data.pitch) ? Math.max(-1.4, Math.min(1.4, data.pitch)) : 0,
    unlocked,
    selected: all.includes(data.selected) ? data.selected : starter[0]
  };
}
