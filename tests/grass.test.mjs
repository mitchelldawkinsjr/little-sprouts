import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeField, moveRunner, pickupUnder, heightMask, isSolid, blockCenter, BLOCK, PLAYER_R
} from '../sidecars/grass/logic.mjs';
import { localQuestion, normalizeQuestion } from '../sidecars/grass/quiz.mjs';

/** Open blocks reachable from the start, walking block to block. */
function reachable(grid, from) {
  const seen = new Set([`${from.i},${from.j}`]);
  const queue = [from];
  while (queue.length) {
    const { i, j } = queue.shift();
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${i + di},${j + dj}`;
      if (seen.has(k) || isSolid(grid, i + di, j + dj)) continue;
      seen.add(k);
      queue.push({ i: i + di, j: j + dj });
    }
  }
  return seen;
}

const blockOf = (grid, p) => ({
  i: Math.floor((p.x + (grid.gw * BLOCK) / 2) / BLOCK),
  j: Math.floor((p.z + (grid.gh * BLOCK) / 2) / BLOCK)
});

test('Grass maze: every sign is on an open path you can run to', () => {
  for (let seed = 1; seed <= 150; seed++) {
    for (const count of [2, 3, 4, 5]) {
      const field = makeField(seed, count, seed % 6);
      const { grid } = field;
      assert.equal(field.spots.length, count);
      const open = reachable(grid, blockOf(grid, field.start));
      for (const s of field.spots) {
        const b = blockOf(grid, s);
        assert.ok(open.has(`${b.i},${b.j}`), 'the sign can be reached');
      }
      // The outer ring is all grass, so nobody runs off the field.
      for (let i = 0; i < grid.gw; i++) assert.ok(isSolid(grid, i, 0) && isSolid(grid, i, grid.gh - 1));
      for (let j = 0; j < grid.gh; j++) assert.ok(isSolid(grid, 0, j) && isSolid(grid, grid.gw - 1, j));
    }
  }
});

test('Grass maze: the runner slides along grass walls and never ends up inside one', () => {
  const field = makeField(9, 3, 2);
  const { grid } = field;
  const p = { x: field.start.x, z: field.start.z };
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let dir = { x: 1, z: 0 };
  for (let i = 0; i < 5000; i++) {
    if (i % 30 === 0) dir = { x: rnd() * 2 - 1, z: rnd() * 2 - 1 };
    moveRunner(p, dir.x * 0.09, dir.z * 0.09, grid);
    for (let j = 0; j < grid.gh; j++) {
      for (let k = 0; k < grid.gw; k++) {
        if (!isSolid(grid, k, j)) continue;
        const c = blockCenter(grid, k, j);
        const px = Math.max(c.x - BLOCK / 2, Math.min(p.x, c.x + BLOCK / 2));
        const pz = Math.max(c.z - BLOCK / 2, Math.min(p.z, c.z + BLOCK / 2));
        assert.ok(Math.hypot(p.x - px, p.z - pz) >= PLAYER_R - 1e-3, 'not inside the grass');
      }
    }
  }
});

test('Grass maze: an open sign is picked up, a faded one is not', () => {
  const spot = { x: 0, z: 0, closed: false };
  assert.equal(pickupUnder({ x: 0.5, z: 0 }, [spot]), spot);
  assert.equal(pickupUnder({ x: 3, z: 0 }, [spot]), null);
  assert.equal(pickupUnder({ x: 0, z: 0 }, [{ ...spot, closed: true }]), null);
});

test('Grass maze: the height mask is tall over walls and short on paths', () => {
  const { grid } = makeField(4, 2, 0);
  const m = heightMask(grid, 4);
  assert.equal(m.width, grid.gw * 4);
  assert.equal(m.height, grid.gh * 4);
  for (let j = 0; j < grid.gh; j++) {
    for (let i = 0; i < grid.gw; i++) {
      const v = m.data[(j * 4 + 2) * m.width + i * 4 + 2];
      assert.equal(v, isSolid(grid, i, j) ? 255 : 0);
    }
  }
});

test('Grass maze: local questions have one right answer and say Find', () => {
  for (let i = 0; i < 40; i++) {
    const q = normalizeQuestion(localQuestion(Math.random, i));
    assert.ok(q);
    assert.equal(q.choices.filter(c => c.ok).length, 1);
    assert.ok(/Find/.test(q.prompt));
  }
});

test('Garden buddy: the host name wins, then the saved profile, then the fox', async () => {
  const { buddyKind, savedBuddy, BUDDIES } = await import('../lib/buddy3d.mjs');
  const store = (data) => ({ getItem: () => JSON.stringify(data) });
  const saved = store({ active: 1, profiles: [{ sprite: 'bear' }, { sprite: 'owl' }] });
  assert.equal(savedBuddy(saved), 'owl');
  assert.equal(buddyKind('frog', saved), 'frog');
  assert.equal(buddyKind('', saved), 'owl');
  assert.equal(buddyKind('dragon', saved), 'owl', 'an unknown name falls back');
  assert.equal(buddyKind(undefined, store({})), 'fox');
  assert.equal(buddyKind(undefined, { getItem: () => '{bad' }), 'fox');
  // A profile saved before buddies existed gets the same default the home screen shows.
  assert.equal(savedBuddy(store({ active: 2, profiles: [{}, {}, {}] })), BUDDIES[2]);
});
