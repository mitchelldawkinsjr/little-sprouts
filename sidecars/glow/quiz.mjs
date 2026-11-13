/**
 * Light lines questions. Inside Little Sprouts the host sends them from the learner's
 * profile. On its own page the game makes simple ones here.
 * A question is { prompt, choices: [{ label, ok, fill, shape }] }.
 */

export const COLORS = [
  ['red', '#dc6253'], ['blue', '#538cbf'], ['yellow', '#f5d400'], ['green', '#76a265'],
  ['orange', '#e99d4d'], ['purple', '#a381c0'], ['pink', '#e5a2bd'], ['brown', '#9a7153']
];
export const SHAPES = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'diamond', 'star', 'hexagon'];

/** Boards in one round on the game's own page. */
export const LOCAL_ROUND = 5;

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

/** A simple question for play away from the Sprouts shelf. Kinds take turns. */
export function localQuestion(rnd, index = 0) {
  const kind = ['add', 'color', 'shape', 'sub'][Math.abs(index) % 4];
  const n = index < 2 ? 2 : 3;
  if (kind === 'add') {
    const a = 1 + Math.floor(rnd() * 5);
    const b = 1 + Math.floor(rnd() * 4);
    return { prompt: `What is ${a} + ${b}? Light the way to that answer.`, choices: numberChoices(rnd, a + b, n, 10) };
  }
  if (kind === 'sub') {
    const a = 4 + Math.floor(rnd() * 6);
    const b = 1 + Math.floor(rnd() * (a - 1));
    return { prompt: `What is ${a} − ${b}? Light the way to that answer.`, choices: numberChoices(rnd, a - b, n, 10) };
  }
  if (kind === 'color') {
    const picks = pickN(rnd, COLORS, n);
    const target = picks[Math.floor(rnd() * picks.length)];
    return { prompt: `Light the way to ${target[0]}.`, choices: picks.map(([label, fill]) => ({ label, fill, ok: label === target[0] })) };
  }
  const picks = pickN(rnd, SHAPES, n);
  const target = picks[Math.floor(rnd() * picks.length)];
  return {
    prompt: `Light the way to the ${target}.`,
    choices: picks.map(name => ({ label: name, shape: name, fill: '#5d7a45', ok: name === target }))
  };
}

/** Make a host question safe to use: two to five choices and exactly one right. */
export function normalizeQuestion(msg) {
  const choices = Array.isArray(msg?.choices) ? msg.choices.slice(0, 5).map((c, index) => ({
    index,
    label: String(c?.label ?? ''),
    ok: !!c?.ok,
    fill: typeof c?.fill === 'string' ? c.fill : '',
    shape: typeof c?.shape === 'string' ? c.shape : ''
  })) : [];
  if (choices.length < 2 || choices.filter(c => c.ok).length !== 1) return null;
  return {
    prompt: String(msg.prompt || ''),
    choices,
    round: Number.isFinite(+msg.round) ? +msg.round : 0,
    total: Number.isFinite(+msg.total) ? +msg.total : 0
  };
}
