/**
 * Garden dash rules with no drawing. Seen from the side, the buddy stands on top of a
 * round garden that turns under it. Things on the garden have an angle around its
 * middle: 0 is the right edge, π/2 is the top where the buddy runs, π is the left.
 * The garden turns the angle up, so things come in from the right and pass behind.
 *
 * The numbers follow Karim Maaloul's (Yakudoo) running CodePen, scaled down by ten:
 * speed grows by 2 every 3 seconds up to 48, the floor turns 0.03 × speed radians a
 * second, and the chaser's place is a fraction of π that creeps toward the buddy.
 */

export const R = 20;                 // garden radius
export const TOP = Math.PI / 2;      // where the buddy runs

export const SPEED = {
  start: 5,
  step: 2,
  every: 3,        // seconds between speed-ups (endless)
  max: 48,
  read: 12,        // never faster than this while answers float past, so they can be read
  slow: 4
};

export const CHASE = {
  start: 0.56,        // chaser angle as a fraction of π (0.5 would be on the buddy)
  target: 0.65,
  catchAt: 0.56,
  creep: 0.004,       // the target slides this much a second
  carrot: 0.025,
  bump: -0.04,
  right: 0.06,
  wrong: -0.035,
  far: 0.72           // never further back than this
};

export const JUMP_H = 4.5;
export const CARROT_H = 4;      // carrots and answers float this high
export const HIT = { obstacle: 1.0, carrot: 2.0, answer: 1.7 };
export const ROW_GAP = 0.45;    // angle between answers in a row
export const RESPAWN = 2.5;     // past this angle a thing goes round again

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/** How fast the floor turns, in radians a second, at a speed. */
export function turnRate(speed) {
  return 0.03 * speed;
}

/** Endless speed after `t` seconds: one step at the start, then a step every few seconds. */
export function endlessSpeed(t) {
  return Math.min(SPEED.max, SPEED.start + SPEED.step * (1 + Math.floor(t / SPEED.every)));
}

/** Point on the garden for a thing at `angle` (already turned) and `h` above the grass. */
export function onGarden(angle, h = 0) {
  return { x: Math.cos(angle) * (R + h), y: -R + Math.sin(angle) * (R + h) };
}

/**
 * Move the chase on. The target slides toward the buddy, and the chaser eases to it.
 * Returns { pos, target }.
 */
export function stepChase(chase, dt, creep) {
  const target = Math.min(CHASE.far, chase.target - dt * creep);
  const pos = chase.pos + (target - chase.pos) * Math.min(1, dt);
  return { pos, target };
}

/** The chase after something happens: 'carrot', 'bump', 'right', or 'wrong'. */
export function chaseAfter(chase, event) {
  return { pos: chase.pos, target: clamp(chase.target + (CHASE[event] || 0), CHASE.catchAt - 0.05, CHASE.far) };
}

export function isCaught(chase) {
  return chase.pos < CHASE.catchAt;
}

/** Height of a jump at fraction `k` (0..1) of its time: quick up, slow top, quick down. */
export function jumpHeight(k) {
  if (k <= 0 || k >= 1) return 0;
  if (k < 0.5) {
    const u = k * 2;
    return JUMP_H * (1 - (1 - u) * (1 - u));
  }
  const u = (k - 0.5) * 2;
  return JUMP_H * (1 - u * u * u * u);
}

/** How long a jump lasts at a speed (the pen uses 10 / speed). */
export function jumpTime(speed) {
  return clamp(10 / Math.max(1, speed), 0.4, 1.5);
}

/**
 * The answers that float past for a question: the right one and up to two wrong ones
 * not tried yet, in a shuffled row.
 */
export function answerRow(choices, tried = new Set(), rnd = Math.random) {
  const right = choices.find(c => c.ok);
  if (!right) return [];
  const pool = choices.filter(c => !c.ok && !tried.has(c.index));
  const row = [right];
  while (row.length < 3 && pool.length) row.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  for (let i = row.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [row[i], row[j]] = [row[j], row[i]];
  }
  return row;
}

/** Distance between two points. */
export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Distance shown to the child, as the pen counts it. */
export function meters(distance) {
  return Math.floor(distance / 2);
}

/** Best endless distance kept on this browser. */
export function readBest(storage = globalThis.localStorage) {
  try { return Math.max(0, Number(storage?.getItem('sprouts-dash-best')) || 0); } catch { return 0; }
}

export function saveBest(m, storage = globalThis.localStorage) {
  const best = readBest(storage);
  if (m <= best) return best;
  try { storage?.setItem('sprouts-dash-best', String(m)); } catch { /* private window */ }
  return m;
}
