import test from 'node:test';
import assert from 'node:assert/strict';
import { crossedRing, steerInput, streetAt } from '../games/city.js';

test('city steer follows the controller when the stick or d-pad is held', () => {
  assert.deepEqual(steerInput({ left: true }, null), { x: -1, y: 0 });
  assert.deepEqual(steerInput({ up: true }, { x: 1, y: 1 }), { x: 1, y: 1 });
  assert.deepEqual(steerInput({}, { x: 0, y: -1 }), { x: 0, y: -1 });
});

test('city street stays straight, then steps between the towers', () => {
  assert.equal(streetAt(0), 0);
  assert.equal(streetAt(-40), 0);
  assert.notEqual(streetAt(-80), streetAt(-112));
});

test('city ring counts only a pass through the hole', () => {
  assert.equal(crossedRing(10, 8, 9, 0, 12, 0, 12, 2), true);
  assert.equal(crossedRing(10, 8, 9, 6, 12, 0, 12, 2), false);
  assert.equal(crossedRing(8, 7, 9, 0, 12, 0, 12, 2), false);
});
