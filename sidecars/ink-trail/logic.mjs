import { normalizeBoss, PRESETS } from '../../lib/boss-design.mjs';

/** Freehand ink on a plane. s is arc length along the stroke, not a screen/world axis. */
export const PEN_AHEAD = 190;
export const PEN_WOBBLE = 2.4;
export const INK_BOOST = 3.5;
export const COUNT_IN = 2;
export const FIRST_QUESTION = 560;
export const QUESTION_SPACING = 730;
export const CHASE_RANGE = 220;
const PACK = [
  { joinAt: 0, back: 120, side: 0, speed: 87, turn: 3.2, lead: 0 },
  { joinAt: 220, back: 18, side: -148, speed: 102, turn: 2.6, lead: 22 },
  { joinAt: 430, back: 35, side: 155, speed: 108, turn: 2.25, lead: 28 }
];
const STEP = 5;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function seedTrail(run, x = 0, z = 0) {
  run.trail = [];
  for (let offset = -160; offset <= 65; offset += STEP) {
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
      ...boss, design: i ? reserves[i - 1] : custom, active: i === 0
    })),
    caughtBy: null, wobble: 0, boost: 0, safe: 0, splash: 0, dots: 0,
    nextQuestion: learning ? FIRST_QUESTION : Infinity,
    finishAt: Infinity, objects: [], spawn: 245, row: 0
  };
  seedTrail(run);
  placeBoss(run.bosses[0], run.buddy);
  return run;
}

export const bossDistance = (boss, buddy) => Math.hypot(boss.x - buddy.x, boss.z - buddy.z);

export function nearestBoss(run) {
  return run.bosses.reduce((near, boss) =>
    boss.active && bossDistance(boss, run.buddy) < bossDistance(near, run.buddy) ? boss : near, run.bosses[0]);
}

function placeBoss(boss, buddy) {
  boss.x = buddy.x - buddy.dx * boss.back - buddy.dz * boss.side;
  boss.z = buddy.z - buddy.dz * boss.back + buddy.dx * boss.side;
  boss.heading = Math.atan2(buddy.z - boss.z, buddy.x - boss.x);
}

function retreat(boss, buddy, amount) {
  const distance = bossDistance(boss, buddy);
  const dx = distance > .01 ? (boss.x - buddy.x) / distance : -Math.cos(boss.heading);
  const dz = distance > .01 ? (boss.z - buddy.z) / distance : -Math.sin(boss.heading);
  boss.x += dx * amount;
  boss.z += dz * amount;
}

/** The garden buddy follows the actual stroke, including loops and crossings. */
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

/** Sweep along the traversed stroke against a moving boss in relative floor coordinates. */
function catchTime(trail, before, after, fromX, fromZ, boss) {
  const radius = 17 + boss.design.size * 2;
  const vx = boss.x - fromX, vz = boss.z - fromZ;
  let buddy = strokeAt(trail, before);
  let t0 = 0;
  function contact(next, t1) {
    const x = fromX + vx * t0 - buddy.x, z = fromZ + vz * t0 - buddy.z;
    const dx = vx * (t1 - t0) - (next.x - buddy.x), dz = vz * (t1 - t0) - (next.z - buddy.z);
    const c = x * x + z * z - radius * radius;
    if (c <= 0) return t0;
    const a = dx * dx + dz * dz, b = x * dx + z * dz;
    const d = b * b - a * c;
    if (b >= 0 || d < 0) return Infinity;
    const hit = c / (-b + Math.sqrt(d));
    return hit <= 1 ? t0 + (t1 - t0) * hit : Infinity;
  }
  for (const next of trail) {
    if (next.s <= before) continue;
    if (next.s >= after) break;
    const t1 = (next.s - before) / (after - before);
    const hit = contact(next, t1);
    if (hit < Infinity) return hit;
    buddy = next;
    t0 = t1;
  }
  return contact(strokeAt(trail, after), 1);
}

function chaseBoss(boss, buddy, dt, speed, moving) {
  // Flankers aim a little ahead. Limited steering lets a timely turn slip past them.
  const look = moving ? boss.lead : 0;
  const dx = buddy.x + buddy.dx * look - boss.x, dz = buddy.z + buddy.dz * look - boss.z;
  const aim = Math.atan2(dz, dx) - boss.heading;
  const turn = Math.atan2(Math.sin(aim), Math.cos(aim));
  boss.heading += clamp(turn, -boss.turn * dt, boss.turn * dt);
  const stride = Math.min(speed * dt, Math.hypot(dx, dz));
  boss.x += Math.cos(boss.heading) * stride;
  boss.z += Math.sin(boss.heading) * stride;
}

export function stepRun(run, dt, { target, direction, pressure = 0 } = {}) {
  if (run.phase !== 'run' || !(dt > 0)) return [];
  const events = [];
  const before = run.distance;
  run.time += dt;
  extendStroke(run, target, direction, dt, pressure);
  const pace = (run.level - 1) * 11 + (run.learning ? 0 : Math.min(49, run.time * .44));
  const speed = (109 + pace + (run.boost > 0 ? 32 : 0)) * (run.splash > 0 ? .72 : 1);
  run.distance = Math.min(before + dt * (run.onInk ? speed : speed * .77), run.trail.at(-1).s, run.nextQuestion, run.finishAt);
  run.buddy = strokeAt(run.trail, run.distance);
  run.moving = run.distance - before > .01;
  const stopped = run.distance >= run.trail.at(-1).s - .01;
  run.onInk = run.buddy.ink && !stopped;
  let catcher = null, firstHit = Infinity, contactX, contactZ;
  const arcadePressure = run.learning ? 0 : Math.min(15, Math.max(0, run.time - 9) * .8);
  for (const boss of run.bosses) {
    if (!boss.active) continue;
    const { x, z } = boss;
    chaseBoss(boss, run.buddy, dt, boss.speed + pace + arcadePressure, run.moving && !stopped);
    if (run.safe > 0) {
      const space = 46 - bossDistance(boss, run.buddy);
      if (space > 0) retreat(boss, run.buddy, space);
      continue;
    }
    const hit = catchTime(run.trail, before, run.distance, x, z, boss);
    if (hit < firstHit) {
      firstHit = hit;
      catcher = boss;
      contactX = x + (boss.x - x) * hit;
      contactZ = z + (boss.z - z) * hit;
    }
  }
  if (catcher && firstHit < 1) {
    run.distance = before + (run.distance - before) * firstHit;
    run.buddy = strokeAt(run.trail, run.distance);
    catcher.x = contactX;
    catcher.z = contactZ;
  }
  for (const boss of run.bosses) if (!boss.active && run.distance >= boss.joinAt) {
    boss.active = true;
    placeBoss(boss, run.buddy);
    events.push('join');
  }
  spawnObjects(run);
  if (run.distance > before) {
    for (const item of run.objects) {
      if (!touchesStroke(run.trail, before, run.distance, item, item.type === 'dot' ? 17 : 29)) continue;
      if (item.type === 'dot') {
        if (!run.onInk) continue;
        run.dots++;
        for (const boss of run.bosses) if (boss.active) retreat(boss, run.buddy, 23);
      } else if (run.splash <= 0 && run.boost <= 0) {
        run.splash = .85;
      } else continue;
      item.used = true;
      events.push(item.type);
    }
  }
  // Keep enough behind for dry ink to fade out.
  const keep = run.distance - 620;
  let discard = 0;
  while (discard < run.trail.length - 2 && run.trail[discard + 1].s < keep) discard++;
  if (discard) run.trail.splice(0, discard);
  run.wobble = Math.max(0, run.wobble - dt);
  run.boost = Math.max(0, run.boost - dt);
  run.safe = Math.max(0, run.safe - dt);
  run.splash = Math.max(0, run.splash - dt);
  if (run.distance >= run.finishAt) {
    run.phase = 'finished';
    events.push('finish');
  } else if (catcher) {
    run.caughtBy = catcher;
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
    run.splash = 0;
    for (const boss of run.bosses) if (boss.active) retreat(boss, run.buddy, 36);
    run.nextQuestion = final ? Infinity : run.distance + QUESTION_SPACING;
    if (final) run.finishAt = run.distance + 400;
  } else {
    run.wobble = PEN_WOBBLE;
    run.nextQuestion = run.distance + 480;
    // Leave time to draw out of trouble when the shaky ink slows the buddy down.
    for (const boss of run.bosses) if (boss.active) {
      const space = 170 - bossDistance(boss, run.buddy);
      if (space > 0) retreat(boss, run.buddy, space);
    }
  }
  run.phase = 'run';
  return true;
}

export function resumeCaught(run) {
  if (run.phase !== 'caught' || !run.learning) return false;
  seedTrail(run, run.buddy.x, run.buddy.z);
  run.phase = 'run';
  run.caughtBy = null;
  for (const boss of run.bosses) if (boss.active) placeBoss(boss, run.buddy);
  run.splash = 0;
  run.safe = 2;
  return true;
}
