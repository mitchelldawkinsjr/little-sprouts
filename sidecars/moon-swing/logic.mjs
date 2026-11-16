// World units: x/z run along the rink, y is height. No renderer or DOM in the simulation.
export const RADIUS = 7.25;
export const ANCHOR = Object.freeze({ x: 0, y: 6.6, z: 0 });
export const MODES = Object.freeze([
  { name: 'Easy', target: 10, hazards: 1, aerial: 1, boss: false },
  { name: 'Harder', target: 15, hazards: 3, aerial: 3, boss: false },
  { name: 'Very tough', target: 20, hazards: 4, aerial: 4, boss: true },
]);
const GRAVITY = 14.5;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function difficulty(value) {
  return Number.isInteger(value) ? clamp(value, 1, MODES.length) : 1;
}
export function nextUnlock(unlocked, won) {
  return Math.min(MODES.length, Math.max(difficulty(unlocked), difficulty(won) + 1));
}
function dotsFor(mode, wave) {
  const base = wave * 1.83;
  return Array.from({ length: 5 }, (_, i) => {
    const a = base + i * Math.PI * 2 / 5 + .39;
    const air = i < MODES[mode - 1].aerial;
    const r = i % 2 ? 5.05 : 3.4;
    return { id: i, x: Math.cos(a) * r, z: Math.sin(a) * r,
      y: air ? 1.95 + (i % 3) * .5 : .62, air, a, value: air ? 2 : 1, taken: false };
  });
}

export function makeRun(mode = 1, learning = false) {
  mode = difficulty(mode);
  const spec = MODES[mode - 1];
  return {
    mode, learning, spec, time: 0, score: 0, wave: 0, restock: 5, done: false,
    p: { x: 0, y: 0, z: 2.38, vx: 0, vy: 0, vz: 0, yaw: 0, rope: 0, rearm: true, safe: 0 },
    dots: dotsFor(mode, 0), choices: [], waiting: null, shield: 0,
    boss: spec.boss ? { x: 0, z: -5.6, yaw: Math.PI / 2, cycle: 0, pulse: 0, stompX: 0, stompZ: 0, tell: false } : null,
  };
}
const CHOICE_SPOTS = [
  [-4.05, 1.03, -2.35], [3.8, 2.45, -2.3], [0, 2.95, 4.1],
  [-4.2, .83, 2.3], [4.5, 1.45, 2.3],
];
export function placeChoices(run, choices, round = 0) {
  run.waiting = null;
  run.choices = choices.slice(0, 5).map((choice, i) => {
    const [x, y, z] = CHOICE_SPOTS[(i + round) % CHOICE_SPOTS.length];
    const target = { ...choice, x, y, z, a: i * 1.9, taken: false };
    // A new question can reuse the spot where the previous answer was caught.
    // Let the buddy leave before that token becomes collectible.
    target.armed = pickupDistance(run.p, pickupAt(target, run.time)) > 1;
    return target;
  });
  run.p.safe = Math.max(run.p.safe, 1.15);
}
export function markChoice(run, index, ok) {
  if (run.waiting !== index) return false;
  run.waiting = null;
  if (ok) {
    run.choices = [];
    run.score += 3;
    run.shield = 6;
  } else {
    const missed = run.choices.find(c => c.index === index);
    if (missed) missed.taken = true;
  }
  return true;
}
export function pickupAt(o, time) {
  return { x: o.x + (o.air ? Math.sin(time * 1.6 + o.a) * .78 : 0),
    y: o.y + Math.sin(time * 2.4 + o.a) * (o.air ? .24 : .09),
    z: o.z + (o.air ? Math.cos(time * 1.6 + o.a) * .43 : 0) };
}
function pickupDistance(p, point) {
  return Math.hypot(p.x - point.x, p.y + .55 - point.y, p.z - point.z);
}
export function hazardsAt(run) {
  return Array.from({ length: run.spec.hazards }, (_, i) => {
    const moving = run.mode > 1 && i > 0;
    const a = .7 + i * 1.64 + (moving ? run.time * (.4 + .18 * i) : 0);
    const r = 5.72 - .44 * i;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, y: .42, r: .48 + .045 * i };
  });
}
function resolveRope(p) {
  const ox = p.x - ANCHOR.x, oy = p.y - ANCHOR.y, oz = p.z - ANCHOR.z;
  const distance = Math.hypot(ox, oy, oz) || 1;
  const nx = ox / distance, ny = oy / distance, nz = oz / distance;
  p.x = ANCHOR.x + nx * p.rope;
  p.y = ANCHOR.y + ny * p.rope;
  p.z = ANCHOR.z + nz * p.rope;
  const radial = p.vx * nx + p.vy * ny + p.vz * nz;
  p.vx -= radial * nx;
  p.vy -= radial * ny;
  p.vz -= radial * nz;
}
function move(p, dt, input) {
  const ax = clamp(Number(input.x) || 0, -1, 1);
  const az = clamp(Number(input.z) || 0, -1, 1);
  const scale = Math.max(1, Math.hypot(ax, az));
  if (!input.swing) { p.rope = 0; p.rearm = true; }
  if (input.swing && !p.rope && p.rearm && !input.jump) {
    const reach = Math.hypot(p.x - ANCHOR.x, p.y - ANCHOR.y, p.z - ANCHOR.z);
    if (reach <= 8) {
      p.rope = clamp(reach, 2.7, 6.36);
      p.rearm = false;
      resolveRope(p);
    }
  }
  if (input.jump && (p.rope || p.y <= .015)) {
    const wasSwinging = !!p.rope;
    p.rope = 0;
    if (input.swing) p.rearm = false;
    p.vy = Math.max(p.vy + (wasSwinging ? 2.4 : 0), wasSwinging ? 8.7 : 8.55);
    if (wasSwinging) { p.vx += ax * 1.25; p.vz += az * 1.25; }
  }
  const grounded = !p.rope && p.y <= .015;
  const drag = Math.exp(-dt * (p.rope ? .8 : grounded ? 4 : 1.15));
  const drive = p.rope ? 20 : grounded ? 25 : 13;
  p.vx = (p.vx + ax / scale * drive * dt) * drag;
  p.vz = (p.vz + az / scale * drive * dt) * drag;
  p.vy -= GRAVITY * dt;
  const speed = Math.hypot(p.vx, p.vz);
  if (speed > 9.1) { p.vx *= 9.1 / speed; p.vz *= 9.1 / speed; }
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.z += p.vz * dt;
  if (p.rope) resolveRope(p);
  else if (p.y < 0) { p.y = 0; p.vy = 0; }
  const rim = Math.hypot(p.x, p.z);
  if (rim > RADIUS) {
    p.x *= RADIUS / rim;
    p.z *= RADIUS / rim;
    const radial = (p.vx * p.x + p.vz * p.z) / RADIUS;
    if (radial > 0) { p.vx -= radial * p.x / RADIUS; p.vz -= radial * p.z / RADIUS; }
  }
  if (Math.hypot(p.vx, p.vz) > .22) p.yaw = Math.atan2(p.vx, p.vz);
}
function updateBoss(run, dt) {
  const b = run.boss, p = run.p;
  b.cycle += dt;
  b.pulse = Math.max(0, b.pulse - dt);
  if (b.cycle >= 6.4) {
    b.cycle -= 6.4;
    b.pulse = .86;
    b.stompX = b.x;
    b.stompZ = b.z;
  }
  b.tell = b.cycle > 5.25;
  if (!b.tell && b.pulse <= 0) {
    const x = p.x - b.x, z = p.z - b.z, d = Math.hypot(x, z);
    if (d > .28) {
      b.yaw = Math.atan2(z, x);
      b.x += x / d * Math.min(d, 2.35 * dt);
      b.z += z / d * Math.min(d, 2.35 * dt);
    }
  }
}
export function step(run, dt, input = {}) {
  if (!(dt > 0) || run.done) return [];
  dt = Math.min(dt, 1 / 30);
  const p = run.p;
  run.time += dt;
  run.shield = Math.max(0, run.shield - dt);
  p.safe = Math.max(0, p.safe - dt);
  move(p, dt, input);
  const events = [];
  if (run.boss) updateBoss(run, dt);
  if (p.safe === 0) {
    const hazard = p.y < .68 && hazardsAt(run).find(h => Math.hypot(p.x - h.x, p.z - h.z) < h.r + .32);
    const b = run.boss;
    const bossHit = b && p.y < 1.08 && Math.hypot(p.x - b.x, p.z - b.z) < 1.18;
    const pulse = b?.pulse && b.pulse < .78 && p.y < .54 &&
      Math.hypot(p.x - b.stompX, p.z - b.stompZ) < (1 - b.pulse / .86) * 4.3;
    if (hazard || bossHit || pulse) {
      p.safe = 1.5;
      if (run.shield > 0) { run.shield = 0; events.push({ type: 'shield' }); }
      else {
        run.score = Math.max(0, run.score - 2);
        p.rope = 0;
        p.vx *= .48;
        p.vz *= .48;
        p.vy = Math.max(3.7, p.vy);
        events.push({ type: 'hit', boss: !!(bossHit || pulse) });
      }
    }
  }
  for (const item of run.dots) {
    if (item.taken) continue;
    const pt = pickupAt(item, run.time);
    if (pickupDistance(p, pt) < .72) {
      item.taken = true;
      run.score += item.value;
      events.push({ type: 'pickup', air: item.air });
    }
  }
  if (run.dots.every(d => d.taken) || run.time >= run.restock) {
    run.dots = dotsFor(run.mode, ++run.wave);
    run.restock = run.time + 6;
  }
  if (run.waiting === null) {
    const choice = run.choices.find(item => {
      if (item.taken) return false;
      const pt = pickupAt(item, run.time);
      const distance = pickupDistance(p, pt);
      if (!item.armed) item.armed = distance > 1;
      return item.armed && distance < .84;
    });
    if (choice) {
      run.waiting = choice.index;
      events.push({ type: 'pick', index: choice.index });
    }
  }
  if (!run.learning && run.score >= run.spec.target) {
    run.done = true;
    events.push({ type: 'complete' });
  }
  return events;
}
