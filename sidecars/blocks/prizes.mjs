// Block meadow prizes. No Three.js here, so tests can load it.
//
// Every right answer still unlocks a new block colour. On top of that, the prizes take turns:
// a build kit (a ready-made thing the child puts down with one tap), then a power-up
// (a lantern for the night, super jump, or super speed), then the next kit, and so on.

export const KITS = {
  house: { label: 'little house', icon: '🏠', line: 'You got a little house! Tap the ground to put it down.' },
  stairs: { label: 'stairs', icon: '🪜', line: 'You got stairs! Tap the ground to put them down.' },
  bridge: { label: 'bridge', icon: '🌉', line: 'You got a bridge! Tap the ground to put it down.' },
  tree: { label: 'tree', icon: '🌳', line: 'You got a tree! Tap the ground to put it down.' }
};
export const KIT_ORDER = ['house', 'stairs', 'bridge', 'tree'];

// seconds: how long it lasts once on. The lantern waits for the night, then lasts all night.
export const POWERS = {
  lantern: { label: 'Lantern', icon: '🏮', line: 'You got a lantern! At night, the bugs stay away from you.' },
  jump: { label: 'Super jump', icon: '🦘', seconds: 40, jump: 1.45, line: 'Super jump! You can jump extra high for a little while.' },
  speed: { label: 'Super speed', icon: '⚡', seconds: 40, speed: 1.8, line: 'Super speed! You can run extra fast for a little while.' }
};
export const POWER_ORDER = ['lantern', 'jump', 'speed'];

export const TOO_CLOSE = 'Too close. Step back, then try again.';

// After free build starts, each new morning brings this many gift boxes back, for more prizes.
export const DAY_BOXES = 3;
export const NEW_DAY = 'A new day! Find the gift boxes for a house or a power-up.';

/** Every prize line, for baking voice clips. */
export const PRIZE_LINES = [
  ...KIT_ORDER.map(id => KITS[id].line),
  ...POWER_ORDER.map(id => POWERS[id].line),
  TOO_CLOSE,
  NEW_DAY
];

/**
 * The prize for the nth right answer (1 for the first). Odd answers give a kit, even ones a power-up,
 * each list going round in order.
 */
export function prizeFor(n) {
  const k = Math.max(1, Math.floor(n)) - 1;
  const turn = Math.floor(k / 2);
  if (k % 2 === 0) return { kind: 'kit', id: KIT_ORDER[turn % KIT_ORDER.length] };
  return { kind: 'power', id: POWER_ORDER[turn % POWER_ORDER.length] };
}

/**
 * The blocks of a kit, in the kit's own frame: r to the right, f forward (away from the child),
 * y up from the spot that was tapped. type '' clears the cell, so a house is hollow inside.
 */
export function kitCells(id) {
  const cells = [];
  const add = (r, y, f, type) => cells.push({ r, y, f, type });
  if (id === 'house') {
    // Five by five, walls three high, a roof, and a shut door facing the child.
    // Inside it counts as shelter: a roof overhead and a wall (or the shut door) on every side.
    for (let r = -2; r <= 2; r++) for (let f = 0; f <= 4; f++) {
      add(r, -1, f, 'planks');
      add(r, 3, f, 'roof');
      const edge = Math.abs(r) === 2 || f === 0 || f === 4;
      for (let y = 0; y <= 2; y++) {
        if (!edge) add(r, y, f, '');
        else if (r === 0 && f === 0 && y < 2) add(r, y, f, y === 0 ? 'door' : 'door_top');
        else if (y === 1 && ((Math.abs(r) === 2 && f === 2) || (r === 0 && f === 4))) add(r, y, f, 'window');
        else add(r, y, f, 'planks');
      }
    }
  } else if (id === 'stairs') {
    // Two wide and six steps up, each one block higher, so walking climbs it.
    for (let f = 0; f < 6; f++) for (let r = 0; r <= 1; r++) for (let y = 0; y <= f; y++) add(r, y, f, 'stone');
  } else if (id === 'bridge') {
    // Three wide and ten long, level with the ground the child taps, so it reaches over water.
    for (let f = 0; f < 10; f++) for (let r = -1; r <= 1; r++) add(r, -1, f, 'planks');
  } else if (id === 'tree') {
    const f0 = 1;
    for (let y = 0; y <= 3; y++) add(0, y, f0, 'tree_bark');
    for (let r = -2; r <= 2; r++) for (let f = -2; f <= 2; f++) for (let y = 3; y <= 5; y++) {
      if (r === 0 && f === 0 && y === 3) continue;
      if (Math.abs(r) + Math.abs(f) + Math.max(0, y - 4) * 2 > 3) continue;
      add(r, y, f0 + f, 'tree_leaves');
    }
  }
  return cells;
}

/** The world axis the child faces, snapped to x or z, from the camera yaw. */
export function facingFromYaw(yaw) {
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  return Math.abs(fx) > Math.abs(fz) ? [Math.sign(fx), 0] : [0, Math.sign(fz) || -1];
}

/** A kit cell in the world, from the tapped spot `base` [x, y, z] and the facing [fx, fz]. */
export function kitToWorld(cell, base, [fx, fz]) {
  // Right of forward, with y up: (-fz, fx).
  const rx = -fz;
  const rz = fx;
  return [base[0] + cell.r * rx + cell.f * fx, base[1] + cell.y, base[2] + cell.r * rz + cell.f * fz];
}

/** Keep only kit names this game knows, for a save read back. */
export function cleanKits(list) {
  return Array.isArray(list) ? list.filter(id => id in KITS).slice(0, 20) : [];
}

/**
 * Power-ups that are on right now, from the time left on each.
 * `left` is { jump: seconds, speed: seconds }. lantern is a flag: held (waiting for night) or lit.
 */
export function boosts(left) {
  return {
    jump: left.jump > 0 ? POWERS.jump.jump : 1,
    speed: left.speed > 0 ? POWERS.speed.speed : 1
  };
}
