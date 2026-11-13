/**
 * Garden gulp — pure rules for size, swallow, and soft rival gulps.
 * City-grid layout, dense street clutter, bigger block buildings.
 * The hole idea follows Hole.io / Donut County style games. Numbers here are ours.
 */

export const ROUND_SECONDS = 120;
export const START_RADIUS = 0.55;
export const MAP_HALF = 52;
export const BLOCK = 10;
export const ROAD = 3.6;
export const CELL = BLOCK + ROAD;
export const GULP_RATIO = 1.12;

export function canSwallow(holeR, bitSize) {
  return holeR >= bitSize * GULP_RATIO;
}

/** Area-based growth: a hole gains a slice of what it swallows, so size has a ceiling
 *  near what the whole city adds up to instead of growing without limit. */
export const GROW_SHARE = 0.05;
export function growFrom(holeR, bitSize) {
  return Math.sqrt(holeR * holeR + GROW_SHARE * bitSize * bitSize);
}

export function softGulpShrink(holeR) {
  // Never grows a hole that a wrong answer already shrank below the start size.
  return Math.min(holeR, Math.max(START_RADIUS, holeR * 0.7));
}

export const RIVAL_SHARE = 0.4;

/** Answer bubbles: any hole size can gulp one. Right answers are the fastest way to grow. */
export const BUBBLE_REACH = 0.45;
export const ANSWER_GROW = 0.9;
export const ANSWER_GROW_SHARE = 0.06;
export const MISS_SHRINK = 0.85;
export const MISS_BITE = 0.25;
/** A wrong answer can shrink a hole below the starting size, down to this. */
export const MIN_RADIUS = 0.4;

export function rightAnswerGrow(r) {
  return Math.sqrt(r * r * (1 + ANSWER_GROW_SHARE) + ANSWER_GROW);
}

/** A wrong answer always takes a visible bite: 15% or a quarter unit, whichever is more. */
export function wrongAnswerShrink(r) {
  return Math.max(MIN_RADIUS, Math.min(r * MISS_SHRINK, r - MISS_BITE));
}

/** How close a bubble must be to the hole's center. A big hole must aim — the bubble
 *  has to be well inside it, not just brushing the rim. */
export function bubbleReach(r) {
  return Math.min(r, 0.6 + r * 0.55) + BUBBLE_REACH;
}

/** Bubbles this hole is touching this frame. The caller decides right or wrong. */
export function touchedBubbles(hole, bubbles) {
  const out = [];
  const reach = bubbleReach(hole.r);
  for (const b of bubbles) {
    if (!b.alive) continue;
    if ((b.x - hole.x) ** 2 + (b.z - hole.z) ** 2 <= reach * reach) out.push(b);
  }
  return out;
}

export function canGulpRival(aR, bR) {
  return aR >= bR * GULP_RATIO;
}

export function overlap(ax, az, ar, bx, bz, br) {
  const dx = ax - bx;
  const dz = az - bz;
  const reach = Math.max(0, ar - br * 0.35);
  return dx * dx + dz * dz <= reach * reach;
}

export function clampPos(x, z, r = 0) {
  const lim = MAP_HALF - Math.max(0.4, r * 0.4);
  return {
    x: Math.max(-lim, Math.min(lim, x)),
    z: Math.max(-lim, Math.min(lim, z))
  };
}

export function scoreFromRadius(r) {
  return Math.max(0, Math.round((r - START_RADIUS) * 100));
}

export function ranks(players) {
  return [...players]
    .map(p => ({ id: p.id, score: scoreFromRadius(p.r), r: p.r }))
    .sort((a, b) => b.score - a.score || b.r - a.r);
}

export function aliveCount(bits) {
  let n = 0;
  for (const bit of bits) if (bit.alive) n += 1;
  return n;
}

export function cityCleared(bits) {
  return aliveCount(bits) === 0;
}

/** Mulberry32 — same seed makes the same city for host and guest. */
export function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const STREET = [
  { kind: 'pebble', size: 0.26, color: 0x8a8478 },
  { kind: 'cone', size: 0.42, color: 0xd4a04a },
  { kind: 'hydrant', size: 0.48, color: 0xc23b3b },
  { kind: 'person', size: 0.52, color: 0x4a6fa5 },
  { kind: 'lamp', size: 0.7, color: 0x5a5f66 },
  { kind: 'bin', size: 0.78, color: 0x3f6b4a },
  { kind: 'bench', size: 0.95, color: 0x8b5e3c },
  { kind: 'scooter', size: 1.05, color: 0x3aa0c8 },
  { kind: 'car', size: 1.45, color: 0x4a6d8c },
  { kind: 'van', size: 1.85, color: 0x6a7a4a },
  { kind: 'bus', size: 2.35, color: 0xd4a04a }
];

const LOT = [
  { kind: 'bush', size: 1.15, color: 0x4f8a4a },
  { kind: 'tree', size: 1.9, color: 0x3f6b3c },
  { kind: 'kiosk', size: 2.2, color: 0xc4a06a },
  { kind: 'shop', size: 2.8, color: 0xb07050 },
  { kind: 'house', size: 3.4, color: 0xc48a6a },
  { kind: 'office', size: 4.2, color: 0x6d7886 },
  { kind: 'tower', size: 5.2, color: 0x4f6578 }
];

function pushBit(bits, id, kind, size, color, x, z) {
  const pos = clampPos(x, z, size * 0.3);
  bits.push({
    id,
    kind,
    size,
    color,
    x: pos.x,
    z: pos.z,
    alive: true
  });
}

export function buildBits(seed, count) {
  const rnd = mulberry(seed);
  const bits = [];
  let id = 0;
  const span = Math.floor(MAP_HALF / CELL);
  const pick = (list) => list[Math.floor(rnd() * list.length)];

  for (let bx = -span; bx <= span; bx++) {
    for (let bz = -span; bz <= span; bz++) {
      const ox = bx * CELL;
      const oz = bz * CELL;
      const half = BLOCK * 0.5;

      // Sidewalk clutter on all four edges.
      for (let edge = 0; edge < 4; edge++) {
        const along = 10 + Math.floor(rnd() * 4);
        for (let i = 0; i < along; i++) {
          const t = (i + 0.5) / along;
          const side = half + 0.55 + rnd() * 0.55;
          let x = ox;
          let z = oz;
          if (edge === 0) { x = ox - half + t * BLOCK; z = oz - side; }
          if (edge === 1) { x = ox - half + t * BLOCK; z = oz + side; }
          if (edge === 2) { x = ox - side; z = oz - half + t * BLOCK; }
          if (edge === 3) { x = ox + side; z = oz - half + t * BLOCK; }
          const nearPlaza = Math.abs(ox) < CELL && Math.abs(oz) < CELL;
          const tier = nearPlaza || rnd() < 0.72
            ? STREET[Math.min(STREET.length - 1, Math.floor(rnd() * rnd() * STREET.length * 1.4))]
            : pick(STREET);
          pushBit(bits, id++, tier.kind, tier.size * (0.88 + rnd() * 0.28), tier.color, x, z);
        }
      }

      // Parked cars in the road gutters.
      for (let i = 0; i < 4; i++) {
        const tier = rnd() < 0.55 ? STREET[8] : STREET[9];
        const gutter = half + ROAD * 0.42;
        const t = 0.18 + rnd() * 0.64;
        const x = i < 2 ? ox - half + t * BLOCK : (i === 2 ? ox - gutter : ox + gutter);
        const z = i < 2 ? (i === 0 ? oz - gutter : oz + gutter) : oz - half + t * BLOCK;
        pushBit(bits, id++, tier.kind, tier.size * (0.9 + rnd() * 0.2), tier.color, x, z);
      }

      // Buildings and yard props inside the block.
      const buildings = 3 + Math.floor(rnd() * 3);
      for (let i = 0; i < buildings; i++) {
        const tier = LOT[Math.min(LOT.length - 1, Math.floor(rnd() * rnd() * LOT.length * 1.15))];
        const x = ox + (rnd() - 0.5) * (BLOCK - tier.size);
        const z = oz + (rnd() - 0.5) * (BLOCK - tier.size);
        pushBit(bits, id++, tier.kind, tier.size * (0.9 + rnd() * 0.25), tier.color, x, z);
      }
      for (let i = 0; i < 5; i++) {
        const tier = rnd() < 0.5 ? LOT[0] : LOT[1];
        pushBit(
          bits, id++, tier.kind, tier.size * (0.85 + rnd() * 0.25), tier.color,
          ox + (rnd() - 0.5) * (BLOCK - 2),
          oz + (rnd() - 0.5) * (BLOCK - 2)
        );
      }
    }
  }

  // Extra plaza pile near the start so the first seconds stay busy.
  for (let i = 0; i < 48; i++) {
    const tier = STREET[Math.floor(rnd() * 6)];
    const angle = rnd() * Math.PI * 2;
    const dist = 1.2 + rnd() * 7;
    pushBit(bits, id++, tier.kind, tier.size * (0.85 + rnd() * 0.3), tier.color,
      Math.cos(angle) * dist, Math.sin(angle) * dist);
  }

  if (typeof count === 'number' && count > 0) return bits.slice(0, count);
  return bits;
}

export function stepHole(hole, input, dt, speed = 9) {
  const len = Math.hypot(input.x || 0, input.z || 0) || 1;
  const nx = (input.x || 0) / len;
  const nz = (input.z || 0) / len;
  const move = speed * (0.7 + Math.min(1.4, hole.r) * 0.18) * dt;
  const next = clampPos(hole.x + nx * move, hole.z + nz * move, hole.r);
  hole.x = next.x;
  hole.z = next.z;
}

export function trySwallowBits(hole, bits) {
  // Judge every bit against the size at the start of the frame, so one bite cannot
  // unlock the next in the same pass and snowball through the whole city at once.
  const r = hole.r;
  let ate = 0;
  for (const bit of bits) {
    if (!bit.alive) continue;
    if (!canSwallow(r, bit.size)) continue;
    if (!overlap(hole.x, hole.z, r, bit.x, bit.z, bit.size * 0.5)) continue;
    bit.alive = false;
    hole.r = growFrom(hole.r, bit.size);
    ate += 1;
  }
  return ate;
}

export function tryRivalGulp(a, b, now) {
  if (a.stunUntil > now || b.stunUntil > now) return null;
  if (!canGulpRival(a.r, b.r)) return null;
  if (!overlap(a.x, a.z, a.r, b.x, b.z, b.r)) return null;
  // Gulping a rival is worth a real chunk of its area (more than any one building).
  a.r = Math.sqrt(a.r * a.r + RIVAL_SHARE * b.r * b.r);
  b.r = softGulpShrink(b.r);
  b.stunUntil = now + 2;
  const spot = clampPos((Math.random() - 0.5) * MAP_HALF * 1.4, (Math.random() - 0.5) * MAP_HALF * 1.4, b.r);
  b.x = spot.x;
  b.z = spot.z;
  return { eater: a.id, eaten: b.id };
}
