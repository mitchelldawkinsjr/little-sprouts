// Garden tag rules in 3D. x and z run across a walled garden, y is up. No DOM or renderer here.
export const ARENA = 13;
export const R = .45, TALL = 1.2;
export const ROUND_SECONDS = 60;
const GRAVITY = 30, RUN = 6.5, JUMP = 11.2, SPRING = 16.5, FALL_MAX = 22;
const TAG_COOL = 1.4, FREEZE = .9, GIFT_BACK = 7, SUPER_JUMP = 1.45;

/** What a gift box gives. seconds: how long it lasts on the buddy who opened it. */
export const POWERS = Object.freeze({
  speed: { icon: '⚡', name: 'Speed', seconds: 5 },
  shield: { icon: '🫧', name: 'Shield', seconds: 8 },
  jump: { icon: '🚀', name: 'Super jump', seconds: 6 },
  freeze: { icon: '🧊', name: 'Freeze', seconds: 3 },
  bee: { icon: '🐝', name: 'Bee magnet', seconds: 4 },
});
const POWER_IDS = Object.keys(POWERS);

// cpu: the rival's top speed (1 = yours). think: seconds between rival decisions.
export const MODES = Object.freeze([
  { name: 'Easy', cpu: .72, think: .45 },
  { name: 'Harder', cpu: .87, think: .3 },
  { name: 'Very tough', cpu: 1, think: .18 },
]);

// Solid log blocks ({ x, z, w, d, h }: center, size across x and z, top height) and springy
// mushrooms ({ x, z }). spots are where gift boxes sit: [x, z, the top they sit on].
const box = (x, z, w, d, h) => ({ x, z, w, d, h });
export const MAPS = Object.freeze([
  { name: 'Sunny meadow', night: false, boxes: [
    box(0, 0, 5, 5, 1), box(0, 0, 2.4, 2.4, 2),
    box(-8, -7, 3, 3, 1), box(8, 7, 3, 3, 1), box(-8, 7, 3, 2, 1), box(8, -7, 2, 3, 1),
  ], springs: [{ x: -5, z: 0 }, { x: 5, z: 0 }],
  spots: [[0, 0, 2], [-8, -7, 1], [8, 7, 1], [-8, 7, 1], [8, -7, 1]] },
  { name: 'Treehouse', night: false, boxes: [
    box(-6, -6, 4, 4, 1), box(-6, -6, 2, 2, 2), box(6, 6, 4, 4, 1), box(6, 6, 2, 2, 2),
    box(6, -6, 3, 3, 1), box(-6, 6, 3, 3, 1), box(0, 0, 3, 3, 3), box(0, 3, 2, 3, 1), box(0, -3, 2, 3, 2), box(0, -6, 2, 2, 1),
    box(-10.5, 0, 2, 6, 1), box(10.5, 0, 2, 6, 1),
  ], springs: [{ x: 3, z: 0 }, { x: -3, z: 0 }, { x: 0, z: 9 }],
  spots: [[0, 0, 3], [-6, -6, 2], [6, 6, 2], [6, -6, 1], [-6, 6, 1]] },
  { name: 'Firefly night', night: true, boxes: [
    box(-7, -9, 2, 2, 1), box(-3.5, -9, 2, 2, 2), box(0, -9, 2, 2, 3), box(3.5, -9, 2, 2, 2), box(7, -9, 2, 2, 1),
    box(-9, 0, 2, 4, 1.6), box(9, 0, 2, 4, 1.6), box(0, 0, 4, 4, 1), box(0, 0, 1.6, 1.6, 2.2),
    box(-5, 6, 3, 2, 1), box(5, 6, 3, 2, 1), box(0, 9.5, 6, 1.6, 1.5),
  ], springs: [{ x: -4.5, z: -4 }, { x: 4.5, z: -4 }, { x: 0, z: 4.5 }],
  spots: [[0, -9, 3], [-9, 0, 1.6], [9, 0, 1.6], [0, 0, 2.2], [0, 9.5, 1.5]] },
]);

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export function difficulty(value) {
  return Number.isInteger(value) ? clamp(value, 1, MODES.length) : 1;
}
function player(x, z, yaw) {
  return { x, y: 0, z, vx: 0, vy: 0, vz: 0, yaw, ground: true, boost: 0, shield: 0, jump: 0, slow: 0, freeze: 0, free: 0 };
}

/** two: a second child plays the rival on the same keyboard. */
export function makeRun(mode = 1, learning = false, two = false, seed = 1) {
  mode = difficulty(mode);
  const run = {
    mode, learning, two, spec: MODES[mode - 1], map: MAPS[mode - 1],
    time: 0, clock: ROUND_SECONDS, done: false, winner: -1,
    // Opposite corners, each facing the middle; every garden keeps these clear.
    players: [player(-11, 11, Math.atan2(1, -1)), player(11, -11, Math.atan2(-1, 1))],
    // The rival starts out as "it", so the learner's first job is to run.
    it: 1, cool: TAG_COOL,
    gifts: [], opening: null,
    cpu: { at: 0, x: 0, z: 0, stuck: 0, detour: 0, turn: 1 }, seed: seed >>> 0 || 1,
  };
  run.gifts = run.map.spots.map(([x, z, top], i) => ({ x, z, y: top, power: POWER_IDS[i % POWER_IDS.length], back: 0 }));
  return run;
}
function rand(run) {
  run.seed = (Math.imul(run.seed, 1664525) + 1013904223) >>> 0;
  return run.seed / 4294967296;
}

/**
 * Give the power in a gift box to player who. In learning play the game asks a question first and
 * calls this once it is answered right. Freeze and the bee act on the other buddy.
 */
export function givePower(run, who, power) {
  const me = run.players[who], other = run.players[1 - who];
  const secs = POWERS[power]?.seconds || 0;
  if (power === 'speed') me.boost = secs;
  else if (power === 'shield') me.shield = secs;
  else if (power === 'jump') me.jump = secs;
  else if (power === 'freeze') other.freeze = Math.max(other.freeze, secs);
  else if (power === 'bee') {
    // Holding the bee: it flies straight to the other buddy. Running: it buzzes the chaser, who slows down.
    if (run.it === who) {
      run.it = 1 - who;
      other.freeze = Math.max(other.freeze, FREEZE);
      run.cool = TAG_COOL;
    } else other.slow = secs;
  }
}

/** Open the gift box that was just touched: give its power and let play go on. */
export function openGift(run) {
  const o = run.opening;
  if (!o) return null;
  run.opening = null;
  givePower(run, o.who, o.power);
  return o;
}

/** Height of the ground under (x, z) for something whose feet are at y: the highest top not above it. */
export function floorAt(run, x, z, y = Infinity) {
  let top = 0;
  for (const b of run.map.boxes) {
    if (b.h <= y + .05 && b.h > top && Math.abs(x - b.x) < b.w / 2 + R * .6 && Math.abs(z - b.z) < b.d / 2 + R * .6) top = b.h;
  }
  return top;
}

/** The rival buddy: chase when it is "it", run away when it is not. Returns a world-space move. */
export function cpuInput(run, dt) {
  const c = run.cpu, me = run.players[1], you = run.players[0];
  // Pressed against a log too tall to hop: walk around it for a moment.
  c.stuck = me.freeze <= 0 && Math.hypot(me.vx, me.vz) < 1.2 ? c.stuck + dt : 0;
  if (c.stuck > .4) {
    c.stuck = 0; c.detour = .9; c.turn = rand(run) < .5 ? 1 : -1; c.at = 0;
  }
  c.detour = Math.max(0, c.detour - dt);
  c.at -= dt;
  if (c.at > 0) return { x: c.x, z: c.z, jump: false };
  c.at = run.spec.think * (.7 + rand(run) * .6);
  let dx = you.x - me.x, dz = you.z - me.z;
  const dist = Math.hypot(dx, dz) || 1;
  dx /= dist; dz /= dist;
  const chasing = run.it === 1;
  let jump = false;
  if (chasing) {
    c.x = dx; c.z = dz;
    if (you.y > me.y + .4 && dist < 4.5) jump = true;
  } else {
    // Run away, and lean toward the middle near a wall so it does not get stuck in a corner.
    let fx = -dx - me.x / ARENA * 1.4, fz = -dz - me.z / ARENA * 1.4;
    const f = Math.hypot(fx, fz) || 1;
    c.x = fx / f; c.z = fz / f;
    if (dist < 4) jump = rand(run) < .4;
  }
  // Blocked by a log: hop up onto it.
  if (Math.hypot(me.vx, me.vz) < 1.2 && me.ground) jump = true;
  if (c.detour > 0) [c.x, c.z] = [-c.z * c.turn, c.x * c.turn];
  return { x: c.x, z: c.z, jump };
}

function collide(run, p, axis) {
  for (const b of run.map.boxes) {
    if (p.y >= b.h - .02) continue;
    const ox = b.w / 2 + R - Math.abs(p.x - b.x), oz = b.d / 2 + R - Math.abs(p.z - b.z);
    if (ox <= 0 || oz <= 0) continue;
    if (axis === 'x') { p.x += Math.sign(p.x - b.x || 1) * ox; p.vx = 0; }
    else { p.z += Math.sign(p.z - b.z || 1) * oz; p.vz = 0; }
  }
}
function move(run, p, input, speed, dt, events, who) {
  if (p.freeze > 0) { p.freeze -= dt; input = {}; }
  let ix = input.x || 0, iz = input.z || 0;
  const len = Math.hypot(ix, iz);
  if (len > 1) { ix /= len; iz /= len; }
  const top = RUN * speed * (p.boost > 0 ? 1.3 : 1) * (p.slow > 0 ? .5 : 1);
  const grip = Math.min(1, dt * (p.ground ? 12 : 5));
  p.vx += (ix * top - p.vx) * grip;
  p.vz += (iz * top - p.vz) * grip;
  if (len > .1) p.yaw = Math.atan2(ix, iz);
  if (input.jump && p.ground) { p.vy = JUMP * (p.jump > 0 ? SUPER_JUMP : 1); p.ground = false; events.push({ type: 'jump', who }); }

  p.x = clamp(p.x + p.vx * dt, -ARENA + R, ARENA - R);
  collide(run, p, 'x');
  p.z = clamp(p.z + p.vz * dt, -ARENA + R, ARENA - R);
  collide(run, p, 'z');

  p.vy = Math.max(-FALL_MAX, p.vy - GRAVITY * dt);
  const prevY = p.y;
  p.y += p.vy * dt;
  const floor = floorAt(run, p.x, p.z, prevY);
  p.ground = false;
  if (p.y <= floor) {
    p.y = floor; p.vy = 0; p.ground = true;
    if (floor === 0 && run.map.springs.some(s => Math.hypot(s.x - p.x, s.z - p.z) < .9)) {
      p.vy = SPRING; p.ground = false; events.push({ type: 'bounce', who });
    }
  }
  for (const k of ['boost', 'shield', 'jump', 'slow']) if (p[k] > 0) p[k] = Math.max(0, p[k] - dt);
}
function touching(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z) < R * 2.3 && Math.abs(a.y - b.y) < TALL * .9;
}

/** inputs: [learner, rival]. Each is { x, z: world-space move -1..1, jump: pressed this step }. */
export function step(run, dt, inputs = []) {
  const events = [];
  if (run.done) return events;
  run.time += dt;
  const rival = run.two ? inputs[1] || {} : cpuInput(run, dt);
  move(run, run.players[0], inputs[0] || {}, 1, dt, events, 0);
  move(run, run.players[1], rival, run.two ? 1 : run.spec.cpu, dt, events, 1);
  run.players[1 - run.it].free += dt;

  run.cool = Math.max(0, run.cool - dt);
  const [a, b] = run.players;
  if (run.cool === 0 && touching(a, b)) {
    const runner = run.players[1 - run.it];
    run.cool = TAG_COOL;
    if (runner.shield > 0) {
      runner.shield = 0;
      events.push({ type: 'blocked', who: 1 - run.it });
    } else {
      run.it = 1 - run.it;
      // The new "it" waits a moment so the runner can get away.
      run.players[run.it].freeze = FREEZE;
      events.push({ type: 'tag', it: run.it });
    }
  }

  // Gift boxes. The learner opens them; with two players, either one can. The computer rival does not.
  for (const g of run.gifts) {
    if (g.back > 0) { g.back = Math.max(0, g.back - dt); continue; }
    if (run.opening) continue;
    for (const who of run.two ? [0, 1] : [0]) {
      const p = run.players[who];
      if (Math.hypot(p.x - g.x, p.z - g.z) < .9 && Math.abs(p.y - g.y) < .6) {
        g.back = GIFT_BACK;
        run.opening = { who, power: g.power };
        events.push({ type: 'gift', who, power: g.power });
        // The next box here holds something else.
        g.power = POWER_IDS[Math.floor(rand(run) * POWER_IDS.length)];
        break;
      }
    }
  }
  run.clock = Math.max(0, run.clock - dt);
  if (run.clock === 0) {
    run.done = true;
    run.winner = 1 - run.it;
    events.push({ type: 'end', winner: run.winner });
  }
  return events;
}
