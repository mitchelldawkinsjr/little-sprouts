/**
 * Boss chase rules with no drawing. Seen from the side, under water: the garden buddy swims
 * left to right in a band of open water while the world streams past from the right, and the
 * boss the child built swims behind it. `gap` is how far the boss's mouth is behind the buddy,
 * in world units. It creeps smaller over time; right answers, shells, and the boss crashing
 * into things make it bigger; wrong answers and bumps make it smaller. Gap at CATCH is a catch.
 */

/** The open water the buddy can swim in, top to bottom. */
export const BAND = { top: 5.5, bottom: -5.5 };
/** Where the buddy sits across the screen. Things come in at SPAWN_X and leave past GONE_X. */
export const BUDDY_X = -1;
export const SPAWN_X = 18;
export const GONE_X = -26;

/*
 * Speed, after the fish pen: the further right the finger or mouse, the faster the swim
 * (`throttle`, 0 slow to 1 fast). Swimming faster than the boss pulls away from it, slower
 * lets it close in, but things in the water come at you faster too.
 */
export const SPEED = {
  min: 4,
  max: 11,
  maxEndless: 13.5,
  grow: 0.04,     // endless: top speed added each second
  read: 8,        // never faster than this while answer bubbles are on the way
  boost: 3.5,     // added while boosting
  slow: 0.55,     // multiplied while slowed
  cruise: 0.5     // throttle with no input
};

/** The boss swims at a steady speed in Play and keeps getting faster in Endless. */
export const BOSS_SPEED = { start: 7.5, max: 11, grow: 0.05 };

/** Gap gained each second for each unit of speed faster than the boss. */
export const PULL = 0.06;

export const GAP = {
  start: 9,
  max: 13,
  catch: 0.6,
  creep: 0.18,          // gap lost each second at the start
  creepEndless: 0.012,  // endless: extra creep added each second, up to creepMax
  creepMax: 0.5,
  right: 4,
  wrong: -2.5,
  shell: 1.5,
  bump: -2,
  crash: 3              // the boss swam into something
};

/** Seconds the buddy can't be bumped again after a bump. */
export const SAFE_AFTER_BUMP = 1.2;
/** How close counts as touching, for the buddy (radius) against a thing's own radius. */
export const BUDDY_R = 0.8;
/** Gap between answer bubbles in a column. */
export const COLUMN_GAP = 3.6;

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/** How fast the buddy swims at a throttle (0..1) after `t` seconds. Endless raises the top. */
export function swimSpeed(throttle, t = 0, endless = false) {
  const hi = endless ? Math.min(SPEED.maxEndless, SPEED.max + SPEED.grow * t) : SPEED.max;
  return SPEED.min + (hi - SPEED.min) * clamp(throttle, 0, 1);
}

/** How fast the boss swims after `t` seconds. */
export function bossSpeed(t = 0, endless = false) {
  return endless ? Math.min(BOSS_SPEED.max, BOSS_SPEED.start + BOSS_SPEED.grow * t) : BOSS_SPEED.start;
}

/** Throttle from where the pointer is across the screen (0 left edge, 1 right edge). */
export function throttleAt(fraction) {
  return clamp((fraction - 0.15) / 0.7, 0, 1);
}

/** Speed right now: reading cap, boost, and slow-down on top of the run's speed. */
export function speedNow(base, { reading = false, boosting = false, slowed = false } = {}) {
  let s = reading ? Math.min(base, SPEED.read) : base;
  if (boosting) s += SPEED.boost;
  if (slowed) s *= SPEED.slow;
  return s;
}

/** How fast the boss closes in after `t` seconds. A big boss is a little slower. */
export function creepRate(t, endless, size = 2) {
  const base = endless ? Math.min(GAP.creepMax, GAP.creep + GAP.creepEndless * t) : GAP.creep;
  return base * (1.15 - size * 0.075);
}

/**
 * The gap after `dt` seconds: the boss creeps in at `rate`, and swimming faster or slower
 * than the boss pulls away or lets it close. A fresh question gives a short calm while it is read.
 */
export function stepGap(gap, dt, rate, { calm = false, speed = 0, boss = 0 } = {}) {
  const pull = speed && boss ? (speed - boss) * PULL : 0;
  return clamp(gap + dt * (pull - rate * (calm ? 0.25 : 1)), 0, GAP.max);
}

/**
 * The gap after something happens: 'right', 'wrong', 'shell', 'bump', or 'crash'.
 * A wrong answer or a bump never makes the catch by itself: it leaves a moment to swim away.
 */
export function gapAfter(gap, event) {
  return clamp(gap + (GAP[event] || 0), Math.min(gap, GAP.catch + 0.4), GAP.max);
}

export function isCaught(gap) {
  return gap <= GAP.catch;
}

/** Ease the buddy's height toward where the finger points, staying in the open water. */
export function swimToward(y, target, dt, rate = 6) {
  const goal = clamp(target, BAND.bottom, BAND.top);
  return y + (goal - y) * Math.min(1, dt * rate);
}

/** Two round things touch. */
export function touching(a, b, ra, rb) {
  return Math.hypot(a.x - b.x, a.y - b.y) < ra + rb;
}

/**
 * Heights for a column of answer bubbles, spread evenly through the open water and centered.
 * Two answers sit a little apart; up to four fit.
 */
export function columnYs(n) {
  const count = clamp(n | 0, 1, 4);
  const gap = Math.min(COLUMN_GAP, (BAND.top - BAND.bottom) / Math.max(1, count - 1));
  const top = (gap * (count - 1)) / 2;
  return Array.from({ length: count }, (_, i) => top - i * gap);
}

/**
 * The answers in a column: the right one and up to three wrong ones not tried yet, shuffled.
 */
export function answerColumn(choices, tried = new Set(), rnd = Math.random) {
  const right = choices.find(c => c.ok);
  if (!right) return [];
  const pool = choices.filter(c => !c.ok && !tried.has(c.index));
  const col = [right];
  while (col.length < 3 && pool.length) col.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  for (let i = col.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [col[i], col[j]] = [col[j], col[i]];
  }
  return col;
}

/**
 * The boss swims along the buddy's path a little late, and smooths it: it can't turn as sharp,
 * so a quick dodge round something can leave the boss swimming into it.
 * `trail` is a list of { t, y } (newest last). Returns the height the boss's head aims for.
 */
export function bossAim(trail, now, late) {
  if (!trail.length) return 0;
  const when = now - late;
  for (let i = trail.length - 1; i > 0; i--) {
    const a = trail[i - 1];
    const b = trail[i];
    if (a.t <= when && when <= b.t) {
      const k = b.t > a.t ? (when - a.t) / (b.t - a.t) : 0;
      return a.y + (b.y - a.y) * k;
    }
  }
  return when < trail[0].t ? trail[0].y : trail[trail.length - 1].y;
}

/** Drop trail points older than `keep` seconds, but always keep one. */
export function trimTrail(trail, now, keep = 6) {
  while (trail.length > 1 && trail[1].t < now - keep) trail.shift();
  return trail;
}

/** Distance shown to the child. */
export function meters(distance) {
  return Math.floor(distance / 2);
}

// Keep the Boss Chase rules module's design exports for existing consumers.
export {
  PARTS, PART_NAMES, DEFAULT_BOSS, PRESETS, BOSS_EMOJI, normalizeBoss,
  cyclePart, randomBoss, bossName, readBoss, saveBoss
} from '../../lib/boss-design.mjs';

/** Best endless distance kept on this browser. */
export function readBest(storage = globalThis.localStorage) {
  try { return Math.max(0, Number(storage?.getItem('sprouts-boss-best')) || 0); } catch { return 0; }
}

export function saveBest(m, storage = globalThis.localStorage) {
  const best = readBest(storage);
  if (m <= best) return best;
  try { storage?.setItem('sprouts-boss-best', String(m)); } catch { /* private window */ }
  return m;
}
