import { normalizeBoss, PRESETS } from '../../lib/boss-design.mjs';

/** Freehand ink on a plane. s is arc length along the stroke, not a screen/world axis. */
export const PEN_AHEAD = 190;
export const PEN_WOBBLE = 2.4;
export const INK_BOOST = 3.5;
export const COUNT_IN = 2;
export const FIRST_QUESTION = 560;
export const QUESTION_SPACING = 730;
const GAP = { near: 33, catch: 16 };
const PACK = [
  { joinAt: 0, start: 114, max: 152, creep: 0, rush: 34 },
  { joinAt: 220, start: 146, max: 184, creep: .65, rush: 51 },
  { joinAt: 430, start: 174, max: 212, creep: 1.05, rush: 65 }
];
const STEP = 5;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function seedTrail(run, x = 0, z = 0) {
  run.trail = [];
  for (let offset = -340; offset <= 65; offset += STEP) {
    run.trail.push({ s: run.distance + offset, x: x + offset, z, age: run.time, ink: true, style: 'clean' });
  }
  run.buddy = { x, z, dx: 1, dz: 0 };
  run.pen = { x: x + 65, z, dx: 1, dz: 0 };
  run.onInk = true;
}

export function makeRun({ learning = false, level = 1, design } = {}) {
  const custom = normalizeBoss(design);
  // Never send two bosses that look alike, even if the learner built a preset.
  const reserves = [PRESETS.spider, PRESETS.gator, PRESETS.shark].filter(boss => boss.head !== custom.head);
  const run = {
    phase: 'run', learning, level, time: 0, distance: 0,
    bosses: PACK.map((boss, i) => ({
      ...boss, design: i ? reserves[i - 1] : custom, active: i === 0, gap: boss.start
    })),
    caughtBy: null, wobble: 0, boost: 0, safe: 0, dots: 0,
    nextQuestion: learning ? FIRST_QUESTION : Infinity,
    finishAt: Infinity, objects: [], spawn: 245, row: 0
  };
  seedTrail(run);
  return run;
}

export function nearestBoss(run) {
  return run.bosses.reduce((near, boss) => boss.active && boss.gap < near.gap ? boss : near, run.bosses[0]);
}

/** Drive characters on the very samples the renderer paints, including loops and crossings. */
export function strokeAt(trail, s) {
  if (s <= trail[0].s) s = trail[0].s;
  let l = 0, h = trail.length - 1;
  while (l + 1 < h) {
    const m = (l + h) >> 1;
    if (trail[m].s <= s) l = m;
    else h = m;
  }
  const a = trail[l], b = trail[h];
  const t = clamp((s - a.s) / (b.s - a.s), 0, 1);
  return {
    x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t,
    dx: (b.x - a.x) / (b.s - a.s), dz: (b.z - a.z) / (b.s - a.s),
    ink: t === 0 ? a.ink : t === 1 ? b.ink : a.ink && b.ink
  };
}

function extendStroke(run, target, direction, dt, pressure) {
  const last = run.trail.at(-1);
  const pen = run.pen;
  const vx = target ? target.x - pen.x : direction?.x ?? 0;
  const vz = target ? target.z - pen.z : direction?.z ?? 0;
  const length = Math.hypot(vx, vz);
  if (!Number.isFinite(length) || length < .01) return;
  const dx = vx / length, dz = vz / length;
  const room = Math.max(0, run.distance + PEN_AHEAD - last.s);
  let draw = Math.min(room, dt * (target ? 410 : 215), target ? length : Infinity);
  // Move the pen in small increments so the terrain, ink and runner use one continuous line.
  while (draw > .001) {
    const step = Math.min(draw, STEP);
    const tail = run.trail.at(-1);
    const nominal = tail.s + step;
    pen.x += dx * step;
    pen.z += dz * step;
    pen.dx = dx;
    pen.dz = dz;
    const wavy = run.wobble > 0;
    const jitter = wavy ? 7 * Math.sin(nominal / 8) + 3 * Math.sin(nominal / 3.5) : 0;
    const x = pen.x - dz * jitter;
    const z = pen.z + dx * jitter;
    const s = tail.s + Math.hypot(x - tail.x, z - tail.z);
    if (s > tail.s + .001) run.trail.push({
      s, x, z, age: run.time, pressure,
      ink: !wavy || Math.floor(nominal / 30) % 4 !== 2,
      style: wavy ? 'wobble' : run.boost > 0 ? 'gold' : 'clean'
    });
    draw -= step;
  }
}

const OFFSETS = [-105, 83, -70, 123, 48, -126];

function spawnObjects(run) {
  if (run.distance >= run.spawn) {
    const side = OFFSETS[run.row++ % OFFSETS.length];
    const { x, z, dx, dz } = run.pen;
    run.objects.push({ x: x + dx * 138 - dz * side, z: z + dz * 138 + dx * side, s: run.distance, type: 'wash', used: false });
    run.objects.push({ x: x + dx * 170 + dz * side * .32, z: z + dz * 170 - dx * side * .32, s: run.distance, type: 'dot', used: false });
    run.spawn += 210;
  }
  run.objects = run.objects.filter(item => !item.used && run.distance - item.s < 780);
}

/** Closest distance to the actually traversed ink, including a turn within this physics frame. */
function touchesStroke(trail, before, after, item, radius) {
  let a = strokeAt(trail, before);
  const hit = b => {
    const dx = b.x - a.x, dz = b.z - a.z;
    const t = clamp(((item.x - a.x) * dx + (item.z - a.z) * dz) / (dx * dx + dz * dz || 1), 0, 1);
    return Math.hypot(item.x - a.x - dx * t, item.z - a.z - dz * t) <= radius;
  };
  for (const b of trail) {
    if (b.s <= before) continue;
    if (b.s >= after) break;
    if (hit(b)) return true;
    a = b;
  }
  return hit(strokeAt(trail, after));
}

export function stepRun(run, dt, { target, direction, pressure = 0 } = {}) {
  if (run.phase !== 'run' || !(dt > 0)) return [];
  const events = [];
  const before = run.distance;
  run.time += dt;
  extendStroke(run, target, direction, dt, pressure);
  const speed = (109 + (run.level - 1) * 11 + (run.learning ? 0 : Math.min(49, run.time * .44)) + (run.boost > 0 ? 32 : 0));
  run.distance = Math.min(before + dt * (run.onInk ? speed : speed * .77), run.trail.at(-1).s, run.nextQuestion, run.finishAt);
  run.buddy = strokeAt(run.trail, run.distance);
  run.moving = run.distance - before > .01;
  const stopped = run.distance >= run.trail.at(-1).s - .01;
  run.onInk = run.buddy.ink && !stopped;
  const creep = 1.3 + (run.level - 1) * .8 + (run.learning ? 0 : Math.min(4.4, run.time * .043));
  for (const boss of run.bosses) {
    if (!boss.active && run.distance >= boss.joinAt) {
      boss.active = true;
      events.push('join');
    }
    if (!boss.active) continue;
    boss.gap -= dt * (run.onInk ? creep + boss.creep : boss.rush);
    if (run.boost > 0 && run.onInk) boss.gap += dt * 10;
    if (run.safe > 0) boss.gap = Math.max(GAP.near, boss.gap);
  }
  spawnObjects(run);
  if (run.distance > before) {
    for (const item of run.objects) {
      if (!touchesStroke(run.trail, before, run.distance, item, item.type === 'dot' ? 17 : 29)) continue;
      if (item.type === 'dot') {
        if (!run.onInk) continue;
        run.dots++;
        for (const boss of run.bosses) if (boss.active) boss.gap += 23;
      } else if (run.safe <= 0 && run.boost <= 0) {
        for (const boss of run.bosses) if (boss.active) {
          boss.gap = Math.max(Math.min(boss.gap, GAP.near), boss.gap - 22);
        }
        run.safe = .85;
      } else continue;
      item.used = true;
      events.push(item.type);
    }
  }
  // Keep enough behind for large boss rigs and for dry ink to fade out.
  const keep = run.distance - 620;
  let discard = 0;
  while (discard < run.trail.length - 2 && run.trail[discard + 1].s < keep) discard++;
  if (discard) run.trail.splice(0, discard);
  for (const boss of run.bosses) boss.gap = Math.min(boss.max, boss.gap);
  run.wobble = Math.max(0, run.wobble - dt);
  run.boost = Math.max(0, run.boost - dt);
  run.safe = Math.max(0, run.safe - dt);
  const closest = nearestBoss(run);
  if (run.distance >= run.finishAt) {
    run.phase = 'finished';
    events.push('finish');
  } else if (closest.gap <= GAP.catch) {
    run.caughtBy = closest;
    run.phase = 'caught';
    events.push('caught');
  } else if (run.distance >= run.nextQuestion) {
    run.phase = 'question';
    events.push('question');
  }
  return events;
}

export function answer(run, ok, final = false) {
  if (run.phase !== 'question') return false;
  if (ok) {
    run.boost = INK_BOOST;
    run.wobble = 0;
    for (const boss of run.bosses) if (boss.active) boss.gap = Math.min(boss.max, boss.gap + 36);
    run.nextQuestion = final ? Infinity : run.distance + QUESTION_SPACING;
    if (final) run.finishAt = run.distance + 400;
  } else {
    run.wobble = PEN_WOBBLE;
    run.nextQuestion = run.distance + 480;
    for (const boss of run.bosses) if (boss.active) boss.gap = Math.max(boss.gap, 85);
  }
  run.phase = 'run';
  return true;
}

export function resumeCaught(run) {
  if (run.phase !== 'caught' || !run.learning) return false;
  seedTrail(run, run.buddy.x, run.buddy.z);
  run.phase = 'run';
  run.caughtBy = null;
  for (const boss of run.bosses) boss.gap = boss.start;
  run.safe = 2;
  return true;
}
