import test from 'node:test';
import assert from 'node:assert/strict';
import { LIGHT_BULBS, lightGap, lightVerdict, lightWindow, rushSeconds, RUSH_FLOOR, RUSH_START } from './light.js';

test('the green bulb is a catch, and a far bulb is a miss', () => {
  assert.equal(lightVerdict(0, 2), 'catch');
  assert.equal(lightVerdict(0.5, 2), 'miss');
  assert.equal(lightVerdict(1 / LIGHT_BULBS + 0.001, 2), 'almost');
  assert.ok(lightWindow(1) > lightWindow(2));
  assert.ok(lightWindow(2) > lightWindow(3));
  assert.equal(lightGap(0.99), lightGap(0.01));
});

test('rush gets faster after every catch and then stays too quick to time', () => {
  let seconds = RUSH_START;
  for (let i = 0; i < 40; i++) seconds = rushSeconds(seconds);
  assert.equal(seconds, RUSH_FLOOR);
  assert.ok(rushSeconds(RUSH_START) < RUSH_START);
});
