/**
 * Garden gulp questions. Inside Little Sprouts the host sends questions from the
 * learner's profile. On its own page (and in friend rooms) the game makes simple
 * ones here. Either way a question is { prompt, choices: [{ label, ok, fill, shape }] }.
 */
import { clampPos, bubbleReach } from './logic.mjs?v=gulp11';

export const COLORS = [
  ['red', '#dc6253'], ['blue', '#538cbf'], ['yellow', '#f5d400'], ['green', '#76a265'],
  ['orange', '#e99d4d'], ['purple', '#a381c0'], ['pink', '#e5a2bd'], ['brown', '#9a7153']
];
export const SHAPES = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'diamond', 'star', 'hexagon'];

/** Copies of each answer scattered for one question. More right ones to chase. */
export const RIGHT_COPIES = 3;
export const WRONG_COPIES = 2;

function pickN(rnd, list, n) {
  const pool = [...list];
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return out;
}

function shuffle(rnd, list) {
  return pickN(rnd, list, list.length);
}

function numberChoices(rnd, answer, n, max) {
  const set = new Set([answer]);
  for (let tries = 0; set.size < n && tries < 40; tries++) {
    const near = answer + Math.round((rnd() - 0.5) * 6);
    if (near >= 0 && near <= max) set.add(near);
  }
  for (let v = 0; set.size < n; v++) set.add(v);
  return shuffle(rnd, [...set]).map(v => ({ label: String(v), ok: v === answer }));
}

/** A simple question for play away from the Sprouts shelf. Kinds take turns. */
export function localQuestion(rnd, index = 0) {
  const kind = ['add', 'color', 'sub', 'shape'][Math.abs(index) % 4];
  if (kind === 'add') {
    const a = 1 + Math.floor(rnd() * 6);
    const b = 1 + Math.floor(rnd() * 5);
    return { prompt: `What is ${a} + ${b}? Gulp that answer.`, choices: numberChoices(rnd, a + b, 3, 12) };
  }
  if (kind === 'sub') {
    const a = 4 + Math.floor(rnd() * 7);
    const b = 1 + Math.floor(rnd() * (a - 1));
    return { prompt: `What is ${a} − ${b}? Gulp that answer.`, choices: numberChoices(rnd, a - b, 3, 10) };
  }
  if (kind === 'color') {
    const picks = pickN(rnd, COLORS, 3);
    const target = picks[Math.floor(rnd() * picks.length)];
    return {
      prompt: `Gulp ${target[0]}.`,
      choices: picks.map(([label, fill]) => ({ label, fill, ok: label === target[0] }))
    };
  }
  const picks = pickN(rnd, SHAPES, 3);
  const target = picks[Math.floor(rnd() * picks.length)];
  return {
    prompt: `Gulp the ${target}.`,
    choices: picks.map(name => ({ label: name, shape: name, fill: '#5d7a45', ok: name === target }))
  };
}

/** Make a host question safe to use: at least two choices and exactly one right. */
export function normalizeQuestion(msg) {
  const choices = Array.isArray(msg?.choices) ? msg.choices.slice(0, 6).map((c, index) => ({
    index,
    label: String(c?.label ?? ''),
    ok: !!c?.ok,
    fill: typeof c?.fill === 'string' ? c.fill : '',
    shape: typeof c?.shape === 'string' ? c.shape : ''
  })) : [];
  if (choices.length < 2 || choices.filter(c => c.ok).length !== 1) return null;
  return { prompt: String(msg.prompt || ''), show: String(msg.show || ''), choices };
}

/** Gap between bubble centers: wider than the hole's whole bite, so one gulp takes one answer. */
export function bubbleGap(r = 0) {
  return Math.max(2.6, 2 * bubbleReach(r) + 1.6);
}

/**
 * Scatter answer bubbles in a ring around the player, spaced apart and inside the map.
 * The ring and the gaps grow with the hole, so a big hole still has to aim.
 * Returns [{ id, choice, x, z, alive }].
 */
export function placeBubbles(rnd, choices, near, startId = 0) {
  const r = near.r || 0;
  const gap = bubbleGap(r);
  const inner = Math.max(3.5, bubbleReach(r) + 2.5);
  const outer = inner + Math.max(7.5, gap * 2.2);
  const want = [];
  choices.forEach((c, i) => {
    const copies = c.ok ? RIGHT_COPIES : WRONG_COPIES;
    for (let k = 0; k < copies; k++) want.push(i);
  });
  const spots = [];
  const bubbles = [];
  const order = shuffle(rnd, want);
  order.forEach((choice, n) => {
    // Keep the spot farthest from the others; stop early once it clears the gap.
    let best = null;
    let bestGap = -1;
    for (let tries = 0; tries < 40; tries++) {
      const angle = rnd() * Math.PI * 2;
      const dist = inner + rnd() * (outer - inner);
      const pos = clampPos(near.x + Math.cos(angle) * dist, near.z + Math.sin(angle) * dist, 1.5);
      if (Math.hypot(pos.x - near.x, pos.z - near.z) < inner * 0.8) continue;
      const nearest = spots.reduce((m, s) => Math.min(m, Math.hypot(s.x - pos.x, s.z - pos.z)), Infinity);
      if (nearest > bestGap) {
        best = pos;
        bestGap = nearest;
      }
      if (nearest >= gap) break;
    }
    const spot = best || clampPos(near.x + inner, near.z, 1.5);
    spots.push(spot);
    bubbles.push({ id: startId + n, choice, x: spot.x, z: spot.z, alive: true });
  });
  return bubbles;
}
