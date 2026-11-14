import test from 'node:test';
import assert from 'node:assert/strict';
import { ASK_HEIGHTS, BOX, GROUND_CLEAR, LAND_R, aimFor, chase, hillTop, hitsHill, normalize, onLand, spotOnLand } from '../games/glide.js';

test('the pointer maps onto the plane box and clamps at the edges', () => {
  assert.equal(normalize(0, -1, 1, 10, 20), 15);
  assert.equal(normalize(5, -1, 1, 10, 20), 20);
  assert.deepEqual(aimFor(-1, -1), { x: BOX.x0, y: BOX.y0 });
  assert.deepEqual(aimFor(1, 1), { x: BOX.x1, y: BOX.y1 });
  const mid = aimFor(0, 0);
  assert.equal(mid.x, (BOX.x0 + BOX.x1) / 2);
  assert.equal(mid.y, (BOX.y0 + BOX.y1) / 2);
});

test('the plane eases toward the aim, noses up while climbing, and settles', () => {
  let p = { x: -60, y: 60 };
  const aim = { x: -60, y: 180 };
  const first = chase(p, aim, 1 / 60);
  assert.ok(Math.abs(first.y - 72) < 1e-9, 'a tenth of the way in one 60th of a second');
  assert.ok(first.rz > 0, 'nose up while below the aim');
  for (let i = 0; i < 240; i++) p = chase(p, aim, 1 / 60);
  assert.ok(Math.abs(p.y - 180) < 0.1);
  assert.ok(Math.abs(p.rz) < 0.01);
  const slow = chase({ x: 0, y: 0 }, { x: 0, y: 100 }, 1 / 30);
  assert.ok(Math.abs(slow.y - 19) < 1e-9, 'a slow frame moves as far as two quick ones');
});

test('gems sit above the land and every answer height is inside the plane box', () => {
  const top = spotOnLand(0, 100);
  assert.ok(Math.abs(top.x) < 1e-9);
  assert.ok(Math.abs(top.y - 100) < 1e-9);
  const ahead = spotOnLand(0.3, 100);
  assert.ok(ahead.x > 0, 'ahead of the top is to the right, where gems come from');
  assert.ok(Math.hypot(ahead.x, ahead.y + LAND_R) - (LAND_R + 100) < 1e-9);
  for (const h of ASK_HEIGHTS) assert.ok(h >= BOX.y0 && h <= BOX.y1, String(h));
});

test('the lowest aim touches the ground, so flying low can crash', () => {
  const low = aimFor(0, -1);
  assert.ok(onLand(low.x, low.y).alt < GROUND_CLEAR);
  const high = aimFor(0, 1);
  assert.ok(onLand(high.x, high.y).alt > 150);
  const top = onLand(0, 50);
  assert.ok(Math.abs(top.alt - 50) < 1e-9);
  assert.ok(Math.abs(top.angle - Math.PI / 2) < 1e-9);
});

test('a hill is tallest at its peak and the plane clears it by flying over', () => {
  const hill = { h: 100, base: 50 };
  assert.equal(hillTop(0, hill), 100);
  assert.equal(hillTop(25, hill), 50);
  assert.equal(hillTop(-60, hill), 0);
  assert.ok(hitsHill(0, 90, hill), 'under the peak');
  assert.ok(!hitsHill(0, 120, hill), 'over the peak');
  assert.ok(hitsHill(30, 60, hill), 'the slope still counts');
  assert.ok(!hitsHill(80, 20, hill), 'past the foot is clear');
  assert.ok(BOX.y1 - 8 > 115, 'the tallest hill (115) can be cleared inside the box');
});
