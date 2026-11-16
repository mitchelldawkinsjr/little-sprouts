// Race distance is in metres. The arc-length table keeps speed constant around curves.
export const WIDTH = 10;
const TAU = Math.PI * 2;
const LIMIT = 800;
const table = [{ x: 0, z: 0, d: 0 }];
function curve(t) {
  return {
    x: (111 + 14 * Math.sin(3 * t)) * Math.sin(t) + 10 * Math.sin(2 * t),
    z: 83 * (1 - Math.cos(t)) + 10 * Math.sin(3 * t)
  };
}
for (let i = 1; i <= LIMIT; i++) {
  const p = curve(TAU * i / LIMIT), prev = table[i - 1];
  table.push({ ...p, d: prev.d + Math.hypot(p.x - prev.x, p.z - prev.z) });
}
export const LAP = table.at(-1).d;
export const RACE = LAP * 2;
export const GATES = [0.35, 0.73, 1.18, 1.64].map(x => LAP * x);
export const BARRIERS = [0.17, 0.54, 0.90, 1.04, 1.44, 1.86].map((x, i) => ({
  d: LAP * x, x: [4.5, -4.7, 0.2, 5.1, -4.9, 0][i], r: [2.1, 2.1, 1.5, 2.1, 2.1, 1.5][i]
}));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function sampleTrack(distance, offset = 0) {
  const d = ((distance % LAP) + LAP) % LAP;
  let lo = 0, hi = LIMIT;
  while (hi - lo > 1) {
    const m = (hi + lo) >> 1;
    if (table[m].d <= d) lo = m;
    else hi = m;
  }
  const a = table[lo], b = table[hi], n = (d - a.d) / (b.d - a.d);
  const yaw = Math.atan2(b.x - a.x, b.z - a.z);
  return { x: a.x + (b.x - a.x) * n - Math.cos(yaw) * offset,
    z: a.z + (b.z - a.z) * n + Math.sin(yaw) * offset, yaw };
}

export function makeRace(learning) {
  return { learning, d: 0, x: 0, speed: 0, time: 0, steer: 0, gate: 0, hazard: 0,
    charges: 1, shield: false, boost: 0, slow: 0, bumps: 0, pending: false, won: false };
}

export function boost(run) {
  if (!run.charges || run.boost > 0 || run.pending || run.won) return false;
  run.charges--;
  run.boost = 2.6;
  run.slow = 0;
  return true;
}

export function clearGate(run, rewarded = true) {
  if (!run.pending) return false;
  run.pending = false;
  if (rewarded) {
    run.shield = true;
    run.charges = Math.min(3, run.charges + 1);
  }
  return true;
}

// Rivals and timing use simulated race time, which freezes with the player's pod.
const SPEEDS = [35, 38, 41];
export const rivalFinish = i => (RACE - (i + 1) * 4) / SPEEDS[i];
export function rivalAt(i, time) {
  return { d: Math.min(RACE, (i + 1) * 4 + time * SPEEDS[i]),
    x: [-4.5, 0.7, 4.5][i] + 1.35 * Math.sin(time * (0.81 + i * 0.07) + i) };
}
export function position(run) {
  return 1 + [0, 1, 2].filter(i => rivalAt(i, run.time).d > run.d ||
    (run.won && rivalFinish(i) < run.time)).length;
}

export function step(run, delta, steering = 0, braking = false) {
  if (run.pending || run.won) return '';
  const dt = clamp(delta, 0, .05), from = run.d, beforeX = run.x;
  const aim = clamp(steering, -1, 1);
  run.steer += (aim - run.steer) * Math.min(1, 14 * dt);
  run.x = clamp(run.x + run.steer * 13.5 * dt, -WIDTH + .8, WIDTH - .8);
  run.time += dt;
  run.boost = Math.max(0, run.boost - dt);
  run.slow = Math.max(0, run.slow - dt);
  const target = braking ? 21 : run.slow ? 24 : run.boost ? 66 : 43;
  run.speed += clamp(target - run.speed, -48 * dt, 31 * dt);
  run.d = Math.min(RACE, from + run.speed * dt);
  let event = '';
  while (run.hazard < BARRIERS.length && BARRIERS[run.hazard].d <= run.d) {
    const b = BARRIERS[run.hazard++];
    const n = (b.d - from) / Math.max(.00001, run.d - from);
    if (Math.abs(beforeX + (run.x - beforeX) * clamp(n, 0, 1) - b.x) >= b.r + 1) continue;
    if (run.shield) { run.shield = false; event = 'shield'; }
    else {
      run.slow = 1.35;
      run.speed *= .66;
      run.bumps++;
      event = 'bump';
    }
  }
  if (run.gate < GATES.length && run.d >= GATES[run.gate]) {
    run.d = GATES[run.gate++];
    if (run.learning) { run.pending = true; return 'question'; }
    run.charges = Math.min(3, run.charges + 1);
    return 'charge';
  }
  if (run.d >= RACE) { run.won = true; return 'finish'; }
  return event;
}
