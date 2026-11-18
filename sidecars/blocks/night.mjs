// Block meadow's day and night, and the night bugs' rules. No Three.js here, so tests can load it.
//
// Each visit starts in the morning. The day is long enough to find a gift box or two and put up
// walls and a roof. Then the light fades, a big caterpillar and a big spider come out, and anyone
// standing inside something they built (a roof overhead, walls on every side) is safe.

export const DAY = 150;       // seconds of full light
export const DUSK = 12;       // light fading
export const NIGHT = 60;      // the bugs are out
export const DAWN = 10;       // light coming back, the bugs go home
export const WARN = 25;       // seconds before dusk that the "Night is coming" warning shows
export const CYCLE = DAY + DUSK + NIGHT + DAWN;

const smooth = x => x * x * (3 - 2 * x);

/**
 * Where in the day `t` seconds falls.
 * daylight: 1 in the day, 0 at night. phase: day, dusk, night, or dawn.
 * warn: the last WARN seconds of the day. bugs: true from the end of dusk until dawn starts.
 * night: which night this is (0 for the first), so each night's bugs can be told apart.
 */
export function skyAt(t) {
  const time = Math.max(0, t);
  const night = Math.floor(time / CYCLE);
  const s = time - night * CYCLE;
  if (s < DAY) return { phase: 'day', daylight: 1, warn: s >= DAY - WARN, bugs: false, night, left: DAY - s };
  if (s < DAY + DUSK) {
    const k = (s - DAY) / DUSK;
    return { phase: 'dusk', daylight: 1 - smooth(k), warn: true, bugs: false, night, left: DAY + DUSK - s };
  }
  if (s < DAY + DUSK + NIGHT) return { phase: 'night', daylight: 0, warn: false, bugs: true, night, left: DAY + DUSK + NIGHT - s };
  const k = (s - DAY - DUSK - NIGHT) / DAWN;
  return { phase: 'dawn', daylight: smooth(k), warn: false, bugs: false, night, left: CYCLE - s };
}

/** Blend two [r, g, b] colours. */
export function mixRgb(a, b, k) {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

export const ROOF_REACH = 12;   // a roof this many blocks above the head still counts
export const WALL_REACH = 8;    // walls this far out on each side still count

/**
 * Is the player inside a shelter? `solidAt(x, y, z)` says whether a block is solid there.
 * (x, z) is the column the player stands in, and feetY the block the feet are in.
 * Safe means: something solid overhead, and on each of the four sides a wall at head height
 * or at feet height. A shut door is a wall. An open door is a gap, so look past it.
 * Caves and holes dug into hills count too: they keep the bugs out just the same.
 */
export function sheltered(solidAt, x, feetY, z) {
  const head = feetY + 1;
  let roof = false;
  for (let d = 1; d <= ROOF_REACH && !roof; d++) roof = solidAt(x, head + d, z);
  if (!roof) return false;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    let wall = false;
    for (let d = 1; d <= WALL_REACH && !wall; d++) {
      wall = solidAt(x + dx * d, head, z + dz * d) && solidAt(x + dx * d, feetY, z + dz * d);
    }
    if (!wall) return false;
  }
  return true;
}

/** Feet block for a camera at eye height `eyeY` (the eye is 1.6 above the soles). */
export function feetBlock(eyeY) {
  return Math.round(eyeY - 1.6 + 0.5);
}

export const BUGS = {
  caterpillar: { speed: 3.1, reach: 1.7, delay: 0, label: 'caterpillar' },
  spider: { speed: 4.0, reach: 1.8, delay: 7, label: 'spider' },
  // Made fresh each night from the Boss chase parts (lib/boss-design.mjs).
  boss: { speed: 3.5, reach: 1.8, delay: 12, label: 'night bug' }
};
export const MAX_BUGS = 8;

/**
 * Who comes out on night n (0 for the first): the caterpillar and the spider, then one more
 * made-up bug each night after, up to MAX_BUGS. Later ones wait a little longer to set out.
 */
export function nightBugs(n) {
  const count = Math.min(MAX_BUGS, 2 + Math.max(0, Math.floor(n) || 0));
  return Array.from({ length: count }, (_, i) => i === 0 ? { kind: 'caterpillar', delay: BUGS.caterpillar.delay }
    : i === 1 ? { kind: 'spider', delay: BUGS.spider.delay }
    : { kind: 'boss', delay: BUGS.boss.delay + (i - 2) * 5 });
}
export const COME_FROM = 30;    // the bugs start this far away, out in the dark
export const CIRCLE = 7;        // around a safe player, they keep this far off

/**
 * Where a bug heads this frame, on the ground plane.
 * Toward the player while they are out in the open; around them, at CIRCLE, while they are safe.
 * `spin` is the bug's own angle around the player (it creeps round while circling).
 */
export function bugTarget(bug, player, safe) {
  if (!safe) return { x: player.x, z: player.z };
  return { x: player.x + Math.cos(bug.spin) * CIRCLE, z: player.z + Math.sin(bug.spin) * CIRCLE };
}

/** Step (x, z) toward a target at `speed`, never past it. Returns the new spot and the heading. */
export function stepToward(from, target, speed, dt) {
  const dx = target.x - from.x;
  const dz = target.z - from.z;
  const far = Math.hypot(dx, dz);
  if (far < 1e-6) return { x: from.x, z: from.z, heading: null, far: 0 };
  const go = Math.min(far, speed * dt);
  return { x: from.x + (dx / far) * go, z: from.z + (dz / far) * go, heading: Math.atan2(dx, dz), far: far - go };
}

/**
 * Can the bug grab the player? Only out in the open, close by, and at about the same height.
 * bug.y and player.y are the heights their feet stand on.
 */
export function canGrab(bug, player, safe, reach) {
  if (safe) return false;
  return Math.hypot(player.x - bug.x, player.z - bug.z) < reach && Math.abs(player.y - bug.y) < 2.6;
}

/** Spoken and shown lines. Each one is baked in lib/speech-core.mjs. */
export const LINES = {
  warn: 'Night is coming. Build a house with a roof, and go inside!',
  night: 'It is night. The bugs are out. Stay inside!',
  morning: 'Good morning! The bugs went home.',
  caterpillar: 'Munch! The caterpillar got you. Hide inside a house at night.',
  spider: 'Munch! The spider got you. Hide inside a house at night.',
  boss: 'Munch! A night bug got you. Hide inside a house at night.'
};
