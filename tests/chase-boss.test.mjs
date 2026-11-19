import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { COLORS_2D, SIZE_2D } from '../lib/boss-2d.mjs';
import { PARTS } from '../lib/boss-design.mjs';

test('the flat boss has a color and size for every builder choice, matching the 3D boss colors', () => {
  const model = readFileSync(new URL('../lib/boss-model.mjs', import.meta.url), 'utf8');
  for (const color of PARTS.color) {
    const hex = model.match(new RegExp(`${color}: \\[0x([0-9a-f]{6}), 0x([0-9a-f]{6})\\]`));
    assert.ok(hex, `boss-model has ${color}`);
    assert.deepEqual(COLORS_2D[color], [`#${hex[1]}`, `#${hex[2]}`], color);
  }
  for (const size of PARTS.size) assert.ok(SIZE_2D[size] > 0, `size ${size}`);
});

test('Garden chase passes the built boss in, and the boss hunts the buddy at crossings', async () => {
  globalThis.window ??= globalThis;
  globalThis.matchMedia ??= () => ({ matches: false, addEventListener() {} });
  const { bossTurn } = await import('../games/chase.js');
  // An open crossroads: every way is floor.
  const open = Array.from({ length: 5 }, () => Array(5).fill(1));
  assert.equal(bossTurn(open, 2, 2, 'down', [4, 2]), 'right', 'heads toward the buddy');
  assert.notEqual(bossTurn(open, 2, 2, 'right', [0, 2]), 'left', 'never doubles straight back while another way is open');
  // A dead end: back is the only way out.
  const deadEnd = [[0, 0, 0], [0, 1, 0], [0, 1, 0]];
  assert.equal(bossTurn(deadEnd, 1, 1, 'up', [1, 2]), 'down');
  const mounts = readFileSync(new URL('../app/mounts.mjs', import.meta.url), 'utf8');
  assert.match(mounts, /boss: chaseBoss\(\)/);
});
