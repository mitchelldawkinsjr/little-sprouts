import test from 'node:test';
import assert from 'node:assert/strict';
import { TILT_GAMES, isTouch, sideTilt, steerAmount, tiltDir } from './touch-core.mjs';

test('a coarse pointer or touch points count as a touch device', () => {
  assert.equal(isTouch({ coarse: true }), true);
  assert.equal(isTouch({ maxTouchPoints: 5 }), true);
  assert.equal(isTouch({ forced: true }), true);
  assert.equal(isTouch({}), false);
});

test('side tilt follows the way the screen is turned', () => {
  const reading = { beta: 12, gamma: -8 };
  assert.equal(sideTilt(reading, 0), -8);
  assert.equal(sideTilt(reading, 90), 12);
  assert.equal(sideTilt(reading, 270), -12);
  assert.equal(sideTilt(reading, -90), -12);
  assert.equal(sideTilt(reading, 180), 8);
});

test('steering is measured from the angle the phone started at', () => {
  assert.equal(steerAmount(30, 30), 0);
  assert.equal(steerAmount(41, 30), 0.5);
  assert.equal(steerAmount(-80, 0), -1);
});

test('a direction holds until the phone comes back near level', () => {
  assert.equal(tiltDir(0.2, 0), 0);
  assert.equal(tiltDir(0.4, 0), 1);
  assert.equal(tiltDir(0.25, 1), 1);
  assert.equal(tiltDir(0.1, 1), 0);
  assert.equal(tiltDir(-0.5, 1), -1);
});

test('tilt is offered only in games that steer left and right', () => {
  for (const mode of ['lanes', 'race', 'rally', 'flight', 'walk']) assert.ok(TILT_GAMES.has(mode));
  for (const mode of ['maze', 'bike', 'chase', 'shapes']) assert.ok(!TILT_GAMES.has(mode));
});
