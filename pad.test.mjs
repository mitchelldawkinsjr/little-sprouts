import test from 'node:test';
import assert from 'node:assert/strict';
import { actionDown, actionFor, axisDir, held, moveDirs, nextIndex, readPad } from './pad-core.mjs';

const button = (pressed, value = pressed ? 1 : 0) => ({ pressed, value });

test('the right trigger and the face button read from a standard pad', () => {
  const pad = readPad({
    axes: [-0.9, 0.1, 0.4, -0.2],
    buttons: { 0: button(false), 7: button(true, 0.8), 12: button(false), 14: button(true) }
  });
  assert.equal(pad.rt, 0.8);
  assert.equal(pad.lx, -0.9);
  assert.equal(pad.left, 1);
  assert.equal(axisDir(pad.lx), -1);
  assert.equal(axisDir(0.1), 0);
});

test('a resting trigger does not count as held, and a half pull stays held', () => {
  assert.equal(held(0.2, false), false);
  assert.equal(held(0.6, false), true);
  assert.equal(held(0.4, true), true);
  assert.equal(held(0.1, true), false);
  assert.equal(actionDown({ rt: 0.7, a: 0 }, false), true);
  assert.equal(actionDown({ rt: 0, a: 1 }, false), true);
  assert.equal(actionDown({ rt: 0.1, a: 0 }, false), false);
});

test('the stick and the d-pad share one direction', () => {
  assert.deepEqual(moveDirs({ lx: -0.8, ly: 0, up: 0, down: 0, left: 0, right: 0 }), { x: -1, y: 0 });
  assert.deepEqual(moveDirs({ lx: 0, ly: 0, up: 1, down: 0, left: 0, right: 1 }), { x: 1, y: -1 });
});

test('the right trigger is a click on a menu, a shot on empty space, and gas on a canvas', () => {
  assert.deepEqual(actionFor('menu'), { click: true, pointer: false, space: false, gas: false });
  assert.deepEqual(actionFor('button'), { click: true, pointer: false, space: false, gas: false });
  assert.deepEqual(actionFor('sky'), { click: false, pointer: false, space: true, gas: true });
  assert.deepEqual(actionFor('canvas'), { click: false, pointer: true, space: false, gas: true });
  assert.deepEqual(actionFor('frame'), { click: false, pointer: false, space: false, gas: true });
  assert.deepEqual(actionFor('none'), { click: false, pointer: false, space: true, gas: true });
});

test('the highlight moves to the card in that direction', () => {
  const rects = [
    { x: 0, y: 0, w: 100, h: 40 },
    { x: 120, y: 0, w: 100, h: 40 },
    { x: 0, y: 80, w: 100, h: 40 }
  ];
  assert.equal(nextIndex(rects, 0, { x: 1, y: 0 }), 1);
  assert.equal(nextIndex(rects, 0, { x: 0, y: 1 }), 2);
  assert.equal(nextIndex(rects, 1, { x: 1, y: 0 }), 1);
});
