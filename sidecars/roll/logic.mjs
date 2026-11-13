/**
 * Marble box rules, kept free of three.js so they can be tested in node.
 * The maze lies in the x/z plane, centered on the origin. Cell (c, r) has its
 * center at x = (c + 0.5) * CELL - width / 2 and z = (r + 0.5) * CELL - depth / 2.
 * Row 0 is the far side of the box; the start sits on the near side.
 */

export const CELL = 2;
export const WALL = 0.34;
export const MARBLE_R = 0.42;
export const POCKET_R = 0.62;

/** How hard a full tilt pushes the marble, and how quickly it slows on its own. */
export const ACCEL = 15;
export const DRAG = 0.9;
export const MAX_SPEED = 8.5;
export const BOUNCE = 0.35;

/** Seeded random numbers so a maze can be rebuilt from its seed. */
export function rng(seed = 1) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIRS = [
  { key: 'n', dc: 0, dr: -1, back: 's' },
  { key: 's', dc: 0, dr: 1, back: 'n' },
  { key: 'e', dc: 1, dr: 0, back: 'w' },
  { key: 'w', dc: -1, dr: 0, back: 'e' }
];

export function cellIndex(maze, c, r) {
  return r * maze.cols + c;
}

export function openDirs(maze, c, r) {
  const cell = maze.cells[cellIndex(maze, c, r)];
  return DIRS.filter(d => !cell[d.key]);
}

/** A perfect maze (one path between any two cells), grown from the start cell. */
export function carveMaze(rnd, cols, rows, start = { c: Math.floor(cols / 2), r: rows - 1 }) {
  const cells = Array.from({ length: cols * rows }, () => ({ n: true, s: true, e: true, w: true }));
  const maze = { cols, rows, start: { ...start }, cells };
  const seen = new Uint8Array(cols * rows);
  const stack = [start];
  seen[cellIndex(maze, start.c, start.r)] = 1;
  while (stack.length) {
    const here = stack[stack.length - 1];
    const next = DIRS.filter(d => {
      const c = here.c + d.dc;
      const r = here.r + d.dr;
      return c >= 0 && r >= 0 && c < cols && r < rows && !seen[cellIndex(maze, c, r)];
    });
    if (!next.length) {
      stack.pop();
      continue;
    }
    const d = next[Math.floor(rnd() * next.length)];
    const c = here.c + d.dc;
    const r = here.r + d.dr;
    cells[cellIndex(maze, here.c, here.r)][d.key] = false;
    cells[cellIndex(maze, c, r)][d.back] = false;
    seen[cellIndex(maze, c, r)] = 1;
    stack.push({ c, r });
  }
  return maze;
}

/** Steps from the start to every cell along open paths. */
export function distances(maze, from = maze.start) {
  const dist = new Array(maze.cols * maze.rows).fill(-1);
  const queue = [from];
  dist[cellIndex(maze, from.c, from.r)] = 0;
  while (queue.length) {
    const here = queue.shift();
    const d0 = dist[cellIndex(maze, here.c, here.r)];
    for (const d of openDirs(maze, here.c, here.r)) {
      const c = here.c + d.dc;
      const r = here.r + d.dr;
      const i = cellIndex(maze, c, r);
      if (dist[i] >= 0) continue;
      dist[i] = d0 + 1;
      queue.push({ c, r });
    }
  }
  return dist;
}

export function deadEnds(maze) {
  const out = [];
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      if (c === maze.start.c && r === maze.start.r) continue;
      if (openDirs(maze, c, r).length === 1) out.push({ c, r });
    }
  }
  return out;
}

/**
 * Pick pocket cells among the dead ends: far from the start and spread apart.
 * A dead end is only ever entered on purpose, so the marble never falls into
 * a wrong answer on its way to another one.
 */
export function pickPockets(rnd, maze, count) {
  const dist = distances(maze);
  const ends = deadEnds(maze).filter(p => dist[cellIndex(maze, p.c, p.r)] >= 2);
  if (ends.length < count) return null;
  ends.sort((a, b) => dist[cellIndex(maze, b.c, b.r)] - dist[cellIndex(maze, a.c, a.r)]);
  const pool = ends.slice(0, Math.max(count, Math.ceil(ends.length * 0.75)));
  const picked = [pool.splice(Math.floor(rnd() * Math.min(3, pool.length)), 1)[0]];
  while (picked.length < count && pool.length) {
    let best = 0;
    let bestGap = -1;
    pool.forEach((p, i) => {
      const gap = Math.min(...picked.map(q => Math.abs(q.c - p.c) + Math.abs(q.r - p.r))) + rnd() * 0.5;
      if (gap > bestGap) { bestGap = gap; best = i; }
    });
    picked.push(pool.splice(best, 1)[0]);
  }
  return picked;
}

/** Knock out a few inner walls for loops, but never next to a pocket or the start. */
export function braid(rnd, maze, pockets, share = 0.12) {
  const keep = new Set(pockets.map(p => cellIndex(maze, p.c, p.r)));
  const walls = [];
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      const cell = maze.cells[cellIndex(maze, c, r)];
      if (c < maze.cols - 1 && cell.e) walls.push({ c, r, d: DIRS[2] });
      if (r < maze.rows - 1 && cell.s) walls.push({ c, r, d: DIRS[1] });
    }
  }
  let knock = Math.round(walls.length * share);
  while (knock > 0 && walls.length) {
    const { c, r, d } = walls.splice(Math.floor(rnd() * walls.length), 1)[0];
    const c2 = c + d.dc;
    const r2 = r + d.dr;
    if (keep.has(cellIndex(maze, c, r)) || keep.has(cellIndex(maze, c2, r2))) continue;
    maze.cells[cellIndex(maze, c, r)][d.key] = false;
    maze.cells[cellIndex(maze, c2, r2)][d.back] = false;
    knock--;
  }
  return maze;
}

/** Maze size for a question: bigger with more answers and later questions. */
export function mazeSize(count, step = 0, wide = false) {
  const grow = Math.min(2, Math.floor(step / 2));
  let cols = Math.min(7, 3 + Math.ceil(count / 2) + grow);
  let rows = cols + 1;
  if (wide) [cols, rows] = [rows + 1, cols - 1];
  return { cols, rows };
}

/** A whole level: the maze, its pockets (one per answer), and the start. */
export function makeLevel(seed, count, step = 0, wide = false) {
  let { cols, rows } = mazeSize(count, step, wide);
  for (let tries = 0; tries < 60; tries++) {
    const rnd = rng(seed + tries * 7919);
    const maze = carveMaze(rnd, cols, rows);
    const pockets = pickPockets(rnd, maze, count);
    if (!pockets) {
      if (tries % 10 === 9) { cols++; rows++; }
      continue;
    }
    braid(rnd, maze, pockets);
    return { maze, pockets, seed };
  }
  throw new Error('no maze');
}

export function cellCenter(maze, c, r) {
  return {
    x: (c + 0.5) * CELL - (maze.cols * CELL) / 2,
    z: (r + 0.5) * CELL - (maze.rows * CELL) / 2
  };
}

/** Wall boxes { x0, z0, x1, z1 }: the outer rim plus every closed inner wall. */
export function wallBoxes(maze) {
  const w = maze.cols * CELL;
  const d = maze.rows * CELL;
  const h = WALL / 2;
  const boxes = [
    { x0: -w / 2 - h, z0: -d / 2 - h, x1: w / 2 + h, z1: -d / 2 + h, rim: true },
    { x0: -w / 2 - h, z0: d / 2 - h, x1: w / 2 + h, z1: d / 2 + h, rim: true },
    { x0: -w / 2 - h, z0: -d / 2 - h, x1: -w / 2 + h, z1: d / 2 + h, rim: true },
    { x0: w / 2 - h, z0: -d / 2 - h, x1: w / 2 + h, z1: d / 2 + h, rim: true }
  ];
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      const cell = maze.cells[cellIndex(maze, c, r)];
      const x = c * CELL - w / 2;
      const z = r * CELL - d / 2;
      if (c < maze.cols - 1 && cell.e) boxes.push({ x0: x + CELL - h, z0: z - h, x1: x + CELL + h, z1: z + CELL + h });
      if (r < maze.rows - 1 && cell.s) boxes.push({ x0: x - h, z0: z + CELL - h, x1: x + CELL + h, z1: z + CELL + h });
    }
  }
  return boxes;
}

/** Push the marble out of one wall box. Returns how hard it hit (0 when clear). */
function collide(m, b) {
  const px = Math.max(b.x0, Math.min(m.x, b.x1));
  const pz = Math.max(b.z0, Math.min(m.z, b.z1));
  let nx = m.x - px;
  let nz = m.z - pz;
  let dist = Math.hypot(nx, nz);
  if (dist >= MARBLE_R) return 0;
  if (dist < 1e-6) {
    // The center slipped inside the wall: leave by the nearest face.
    const left = m.x - b.x0;
    const right = b.x1 - m.x;
    const top = m.z - b.z0;
    const bottom = b.z1 - m.z;
    const least = Math.min(left, right, top, bottom);
    nx = least === left ? -1 : least === right ? 1 : 0;
    nz = least === top ? -1 : least === bottom ? 1 : 0;
    dist = 0;
  } else {
    nx /= dist;
    nz /= dist;
  }
  const push = MARBLE_R - dist;
  m.x += nx * push;
  m.z += nz * push;
  const into = m.vx * nx + m.vz * nz;
  if (into < 0) {
    m.vx -= (1 + BOUNCE) * into * nx;
    m.vz -= (1 + BOUNCE) * into * nz;
    return -into;
  }
  return 0;
}

/**
 * Roll the marble for dt seconds under a tilt { x, z } in -1..1.
 * Open pockets pull the marble in a little once it is close.
 * Returns the hardest wall hit this step, for the clack sound.
 */
export function stepMarble(m, tilt, dt, boxes, pockets = []) {
  let ax = Math.max(-1, Math.min(1, tilt.x || 0)) * ACCEL;
  let az = Math.max(-1, Math.min(1, tilt.z || 0)) * ACCEL;
  for (const p of pockets) {
    if (p.closed) continue;
    const dx = p.x - m.x;
    const dz = p.z - m.z;
    const d = Math.hypot(dx, dz);
    if (d < POCKET_R * 1.5 && d > 1e-4) {
      ax += (dx / d) * ACCEL * 0.6;
      az += (dz / d) * ACCEL * 0.6;
    }
  }
  m.vx += ax * dt;
  m.vz += az * dt;
  const slow = Math.exp(-DRAG * dt);
  m.vx *= slow;
  m.vz *= slow;
  const speed = Math.hypot(m.vx, m.vz);
  if (speed > MAX_SPEED) {
    m.vx *= MAX_SPEED / speed;
    m.vz *= MAX_SPEED / speed;
  }
  // Small steps so a fast marble cannot pass through a thin wall.
  const steps = Math.max(1, Math.ceil((Math.hypot(m.vx, m.vz) * dt) / (MARBLE_R * 0.4)));
  let hit = 0;
  for (let i = 0; i < steps; i++) {
    m.x += (m.vx * dt) / steps;
    m.z += (m.vz * dt) / steps;
    for (const b of boxes) hit = Math.max(hit, collide(m, b));
  }
  return hit;
}

/** The open pocket the marble has dropped into, if any. */
export function pocketUnder(m, pockets) {
  for (const p of pockets) {
    if (p.closed) continue;
    if (Math.hypot(p.x - m.x, p.z - m.z) < POCKET_R * 0.55) return p;
  }
  return null;
}

/** Turn a phone's tilt (degrees, relative to how it was held at the start) into a push. */
export function tiltFromOrientation(beta, gamma, center, angle = 0, range = 18) {
  const dx = (gamma - center.gamma) / range;
  const dy = (beta - center.beta) / range;
  const a = ((Math.round(angle / 90) % 4) + 4) % 4;
  const out = a === 0 ? { x: dx, z: dy } : a === 1 ? { x: dy, z: -dx } : a === 2 ? { x: -dx, z: -dy } : { x: -dy, z: dx };
  const len = Math.hypot(out.x, out.z);
  const dead = 0.08;
  if (len < dead) return { x: 0, z: 0 };
  const k = Math.min(1, (len - dead) / (1 - dead)) / len;
  return { x: out.x * k, z: out.z * k };
}
