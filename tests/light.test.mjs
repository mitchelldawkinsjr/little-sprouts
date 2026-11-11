import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIGHT_BULBS,
  lightGap,
  lightGapTo,
  lightMarkSlots,
  lightVerdict,
  lightVerdictAt,
  lightWindow,
  rushSeconds,
  RUSH_FLOOR,
  RUSH_START
} from '../games/light.js';

test('the green bulb is a catch, and a far bulb is a miss', () => {
  assert.equal(lightVerdict(0, 2), 'catch');
  assert.equal(lightVerdict(0.5, 2), 'miss');
  assert.equal(lightVerdict(1 / LIGHT_BULBS + 0.001, 2), 'almost');
  assert.ok(lightWindow(1) > lightWindow(2));
  assert.ok(lightWindow(2) > lightWindow(3));
  assert.equal(lightGap(0.99), lightGap(0.01));
});

test('answer lights sit around the ring and the right one must be caught', () => {
  assert.deepEqual(lightMarkSlots(1), [0]);
  const three = lightMarkSlots(3);
  assert.equal(three.length, 3);
  assert.equal(new Set(three).size, 3);
  assert.ok(three.every(i => i >= 0 && i < LIGHT_BULBS));

  const marks = [
    { i: 20, text: 'cat', ok: true },
    { i: 0, text: 'dog', ok: false },
    { i: 40, text: 'hat', ok: false }
  ];
  assert.equal(lightVerdictAt(20 / LIGHT_BULBS, 2, marks), 'catch');
  assert.equal(lightVerdictAt(0, 2, marks), 'wrong');
  assert.equal(lightVerdictAt(40 / LIGHT_BULBS, 2, marks), 'wrong');
  assert.equal(lightVerdictAt(0.5, 2, marks), 'miss');
  assert.ok(lightGapTo(20 / LIGHT_BULBS, 20) < lightGapTo(0, 20));
});

test('rush gets faster after every catch and then stays too quick to time', () => {
  let seconds = RUSH_START;
  for (let i = 0; i < 40; i++) seconds = rushSeconds(seconds);
  assert.equal(seconds, RUSH_FLOOR);
  assert.ok(rushSeconds(RUSH_START) < RUSH_START);
});
