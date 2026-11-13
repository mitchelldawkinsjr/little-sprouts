import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeLevel, distances, openDirs, cellIndex, cellCenter, wallBoxes, stepMarble,
  pocketUnder, tiltFromOrientation, MARBLE_R, CELL
} from '../sidecars/roll/logic.mjs';
import { localQuestion, normalizeQuestion } from '../sidecars/roll/quiz.mjs';

test('Marble box: every answer pocket is a reachable dead end', () => {
  for (let seed = 1; seed <= 200; seed++) {
    for (const count of [2, 3, 4, 5]) {
      const wide = seed % 2 === 0;
      const { maze, pockets } = makeLevel(seed, count, seed % 7, wide);
      assert.equal(pockets.length, count);
      const dist = distances(maze);
      assert.ok(dist.every(d => d >= 0), 'every cell can be reached');
      const keys = new Set();
      for (const p of pockets) {
        assert.equal(openDirs(maze, p.c, p.r).length, 1, 'a pocket is a dead end, so no path runs through it');
        assert.ok(dist[cellIndex(maze, p.c, p.r)] >= 2, 'a pocket is not next to the start');
        keys.add(`${p.c},${p.r}`);
      }
      assert.equal(keys.size, count, 'pockets do not share a cell');
    }
  }
});

test('Marble box: the marble never ends up inside a wall', () => {
  const { maze, pockets } = makeLevel(42, 3, 2);
  const boxes = wallBoxes(maze);
  const start = cellCenter(maze, maze.start.c, maze.start.r);
  const m = { x: start.x, z: start.z, vx: 0, vz: 0 };
  const w = (maze.cols * CELL) / 2;
  const d = (maze.rows * CELL) / 2;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let tilt = { x: 1, z: -1 };
  for (let i = 0; i < 6000; i++) {
    if (i % 40 === 0) tilt = { x: rnd() * 2 - 1, z: rnd() * 2 - 1 };
    stepMarble(m, tilt, 1 / 60, boxes, pockets.map(p => ({ ...cellCenter(maze, p.c, p.r), closed: true })));
    assert.ok(Math.abs(m.x) <= w - MARBLE_R + 1e-6 && Math.abs(m.z) <= d - MARBLE_R + 1e-6, 'inside the box');
    for (const b of boxes) {
      const px = Math.max(b.x0, Math.min(m.x, b.x1));
      const pz = Math.max(b.z0, Math.min(m.z, b.z1));
      assert.ok(Math.hypot(m.x - px, m.z - pz) >= MARBLE_R - 0.02, 'not inside a wall');
    }
  }
});

test('Marble box: an open pocket catches the marble, a closed one does not', () => {
  const pocket = { x: 0, z: 0, closed: false };
  const m = { x: 0.6, z: 0, vx: 0, vz: 0 };
  for (let i = 0; i < 60 && !pocketUnder(m, [pocket]); i++) stepMarble(m, { x: 0, z: 0 }, 1 / 60, [], [pocket]);
  assert.equal(pocketUnder(m, [pocket]), pocket);
  assert.equal(pocketUnder({ x: 0, z: 0 }, [{ ...pocket, closed: true }]), null);
});

test('Marble box: phone tilt maps to the screen in every orientation', () => {
  const center = { beta: 30, gamma: 0 };
  assert.deepEqual(tiltFromOrientation(30, 0, center), { x: 0, z: 0 });
  const right = tiltFromOrientation(30, 18, center, 0);
  assert.ok(right.x > 0.9 && Math.abs(right.z) < 1e-9);
  const away = tiltFromOrientation(12, 0, center, 0);
  assert.ok(away.z < -0.9, 'top edge down rolls toward the far side');
  const landscape = tiltFromOrientation(48, 0, center, 90);
  assert.ok(landscape.x > 0.9, 'turned sideways, the bottom edge is the right side');
});

test('Marble box: local questions have one right answer the host format accepts', () => {
  for (let i = 0; i < 40; i++) {
    const q = normalizeQuestion(localQuestion(Math.random, i));
    assert.ok(q);
    assert.equal(q.choices.filter(c => c.ok).length, 1);
    assert.ok(/Roll/.test(q.prompt));
  }
  assert.equal(normalizeQuestion({ prompt: 'x', choices: [{ label: 'a', ok: true }] }), null);
});
