/**
 * Grass maze rules, kept free of three.js so they can be tested in node.
 * The maze comes from Marble box. Here it becomes a grid of square blocks:
 * a wall block grows tall grass, and an open block is a mowed path.
 * Block (i, j) has its center at x = (i + 0.5) * BLOCK - width / 2, z = (j + 0.5) * BLOCK - depth / 2.
 * Row 0 is the far side; the start is on the near side.
 */
import { makeLevel, cellIndex } from '../roll/logic.mjs?v=roll1';

export const BLOCK = 2;
export const PLAYER_R = 0.42;
export const RUN_SPEED = 4.6;
export const PICK_R = 1.0;

/** Turn a cell maze into solid and open blocks. */
export function blockGrid(maze) {
  const gw = maze.cols * 2 + 1;
  const gh = maze.rows * 2 + 1;
  const solid = new Uint8Array(gw * gh).fill(1);
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      const i = c * 2 + 1;
      const j = r * 2 + 1;
      const cell = maze.cells[cellIndex(maze, c, r)];
      solid[j * gw + i] = 0;
      if (!cell.e) solid[j * gw + i + 1] = 0;
      if (!cell.s) solid[(j + 1) * gw + i] = 0;
    }
  }
  return { gw, gh, solid };
}

export function cellBlock(c, r) {
  return { i: c * 2 + 1, j: r * 2 + 1 };
}

export function blockCenter(grid, i, j) {
  return {
    x: (i + 0.5) * BLOCK - (grid.gw * BLOCK) / 2,
    z: (j + 0.5) * BLOCK - (grid.gh * BLOCK) / 2
  };
}

export function isSolid(grid, i, j) {
  if (i < 0 || j < 0 || i >= grid.gw || j >= grid.gh) return true;
  return grid.solid[j * grid.gw + i] === 1;
}

/** A whole level: the maze, its block grid, the start, and one pickup spot per answer. */
export function makeField(seed, count, step = 0) {
  // Marble box sizes the maze: bigger with more answers and later questions.
  const level = makeLevel(seed, count, step, false);
  const grid = blockGrid(level.maze);
  const sb = cellBlock(level.maze.start.c, level.maze.start.r);
  const start = blockCenter(grid, sb.i, sb.j);
  const spots = level.pockets.map((p) => {
    const b = cellBlock(p.c, p.r);
    return { ...blockCenter(grid, b.i, b.j), c: p.c, r: p.r };
  });
  return { ...level, grid, start, spots };
}

/**
 * Move the runner by (dx, dz), sliding along grass walls.
 * Axis by axis, in small steps, so a fast move cannot tunnel through a wall.
 */
export function moveRunner(p, dx, dz, grid) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (PLAYER_R * 0.5)));
  for (let s = 0; s < steps; s++) {
    p.x += dx / steps;
    pushOut(p, grid);
    p.z += dz / steps;
    pushOut(p, grid);
  }
  return p;
}

function pushOut(p, grid) {
  const w = (grid.gw * BLOCK) / 2;
  const d = (grid.gh * BLOCK) / 2;
  const i0 = Math.floor((p.x - PLAYER_R + w) / BLOCK);
  const i1 = Math.floor((p.x + PLAYER_R + w) / BLOCK);
  const j0 = Math.floor((p.z - PLAYER_R + d) / BLOCK);
  const j1 = Math.floor((p.z + PLAYER_R + d) / BLOCK);
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      if (!isSolid(grid, i, j)) continue;
      const x0 = i * BLOCK - w;
      const z0 = j * BLOCK - d;
      const px = Math.max(x0, Math.min(p.x, x0 + BLOCK));
      const pz = Math.max(z0, Math.min(p.z, z0 + BLOCK));
      let nx = p.x - px;
      let nz = p.z - pz;
      const dist = Math.hypot(nx, nz);
      if (dist >= PLAYER_R) continue;
      if (dist < 1e-6) {
        // The center is inside the block: leave by the nearest face.
        const faces = [p.x - x0, x0 + BLOCK - p.x, p.z - z0, z0 + BLOCK - p.z];
        const k = faces.indexOf(Math.min(...faces));
        if (k === 0) p.x = x0 - PLAYER_R;
        else if (k === 1) p.x = x0 + BLOCK + PLAYER_R;
        else if (k === 2) p.z = z0 - PLAYER_R;
        else p.z = z0 + BLOCK + PLAYER_R;
        continue;
      }
      nx /= dist;
      nz /= dist;
      p.x += nx * (PLAYER_R - dist);
      p.z += nz * (PLAYER_R - dist);
    }
  }
}

/** The open pickup the runner is standing on, if any. */
export function pickupUnder(p, spots) {
  for (const s of spots) {
    if (s.closed) continue;
    if (Math.hypot(s.x - p.x, s.z - p.z) < PICK_R) return s;
  }
  return null;
}

/**
 * A grass height mask, res texels per block: 255 under a wall, 0 on a path.
 * Rows run from the far side (j = 0) to the near side, matching the texture's v.
 */
export function heightMask(grid, res = 8) {
  const w = grid.gw * res;
  const h = grid.gh * res;
  const data = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      data[y * w + x] = isSolid(grid, Math.floor(x / res), Math.floor(y / res)) ? 255 : 0;
    }
  }
  return { data, width: w, height: h };
}
