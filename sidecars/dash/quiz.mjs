/**
 * Garden dash questions. Inside Little Sprouts the host sends them from the learner's
 * profile. On its own page the game makes simple ones here.
 */
import { COLORS, SHAPES, normalizeQuestion } from '../roll/quiz.mjs?v=roll1';

export { normalizeQuestion };

/** Questions in one round on the game's own page. */
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
  const kind = ['add', 'color', 'sub', 'shape'][Math.abs(index) % 4];
  const n = index < 1 ? 2 : 3;
  if (kind === 'add') {
    const a = 1 + Math.floor(rnd() * 5);
    const b = 1 + Math.floor(rnd() * 4);
    return { prompt: `What is ${a} + ${b}? Jump to catch it.`, choices: numberChoices(rnd, a + b, n, 10) };
  }
  if (kind === 'sub') {
    const a = 4 + Math.floor(rnd() * 6);
    const b = 1 + Math.floor(rnd() * (a - 1));
    return { prompt: `What is ${a} − ${b}? Jump to catch it.`, choices: numberChoices(rnd, a - b, n, 10) };
  }
  if (kind === 'color') {
    const picks = pickN(rnd, COLORS, n);
    const target = picks[Math.floor(rnd() * picks.length)];
    return { prompt: `Catch ${target[0]}.`, choices: picks.map(([label, fill]) => ({ label, fill, ok: label === target[0] })) };
  }
  const picks = pickN(rnd, SHAPES, n);
  const target = picks[Math.floor(rnd() * picks.length)];
  return {
    prompt: `Catch the ${target}.`,
    choices: picks.map(name => ({ label: name, shape: name, fill: '#5d7a45', ok: name === target }))
  };
}
