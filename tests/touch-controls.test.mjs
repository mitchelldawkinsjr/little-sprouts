import test from 'node:test';
import assert from 'node:assert/strict';
import { KID, buttonSpot, readStick } from '../lib/touch-controls.mjs';
import { VirtualGamepad } from '../vendor/gamepad/core.js';

const view = { width: 800, height: 600, inset: { top: 0, right: 0, bottom: 0, left: 0 } };

test('Touch controls: buttons sit bottom-right in a 2x2 block, clear of the safe area', () => {
  const r = KID.button;
  const main = buttonSpot(0, view);
  assert.deepEqual(main, { x: 800 - KID.edge - r, y: 600 - KID.edge - r });
  assert.ok(buttonSpot(1, view).y < main.y && buttonSpot(1, view).x === main.x, 'slot 1 is above');
  assert.ok(buttonSpot(2, view).x < main.x && buttonSpot(2, view).y === main.y, 'slot 2 is to the left');
  const notch = buttonSpot(0, { ...view, inset: { top: 0, right: 30, bottom: 20, left: 0 } });
  assert.deepEqual(notch, { x: main.x - 30, y: main.y - 20 });
});

test('Touch controls: a stick reading becomes a -1..1 vector, and rests at zero in the dead zone', () => {
  assert.deepEqual(readStick(null), { active: false, x: 0, y: 0, magnitude: 0, angle: 0 });
  const pad = new VirtualGamepad({ stick: { radius: KID.stick, knobRadius: KID.knob, deadZone: KID.deadZone } });
  pad.setViewport(800, 600);
  pad.pointerDown(1, 100, 400);
  pad.pointerMove(1, 104, 400);
  assert.equal(readStick(pad.getStick()).active, false, 'a resting thumb does not drift the buddy');
  pad.pointerMove(1, 100 + KID.stick + 20, 400);
  const right = readStick(pad.getStick());
  assert.equal(right.active, true);
  assert.ok(Math.abs(right.x - 1) < 1e-9 && Math.abs(right.y) < 1e-9, 'full push right');
  pad.pointerMove(1, 100, 400 - KID.stick);
  const up = readStick(pad.getStick());
  assert.ok(up.y < -0.8 && Math.abs(up.x) < 1e-9, 'up the screen is negative y');
  pad.pointerUp(1);
  assert.equal(readStick(pad.getStick()).active, false);
});

test('Touch controls: a button press is seen once as a tap and held while down', () => {
  const pad = new VirtualGamepad({ buttons: [{ id: 'refill', position: (v) => buttonSpot(0, v) }] });
  pad.setViewport(view.width, view.height, view.inset);
  const c = buttonSpot(0, view);
  pad.pointerDown(7, c.x, c.y);
  pad.nextFrame();
  assert.equal(pad.justPressed('refill'), true);
  assert.equal(pad.isButtonDown('refill'), true);
  pad.nextFrame();
  assert.equal(pad.justPressed('refill'), false, 'only one tap per press');
  pad.pointerUp(7);
  assert.equal(pad.isButtonDown('refill'), false);
});

test('Touch as a controller: sticks become axes and held buttons are pressed, standard mapping', async () => {
  const { PAD_BUTTONS, blankPad, fillPad } = await import('../lib/touch-controls.mjs');
  const pad = blankPad(2);
  assert.equal(pad.mapping, 'standard');
  assert.equal(pad.buttons.length, 17);
  assert.equal(pad.connected, false, 'off until a touch device or a touch');
  fillPad(pad, { move: { x: 0.5, y: -1 }, aim: { active: true, x: 0, y: 1, magnitude: 1 }, held: ['a'], fire: 'rt' });
  assert.deepEqual(pad.axes, [0.5, -1, 0, 1]);
  assert.equal(pad.buttons[PAD_BUTTONS.a].pressed, true);
  assert.equal(pad.buttons[PAD_BUTTONS.rt].value, 1, 'pushing the aim stick out holds fire');
  fillPad(pad, { move: null, aim: { active: true, x: 0.1, y: 0, magnitude: 0.1 }, held: [], fire: 'rt' });
  assert.deepEqual(pad.axes, [0, 0, 0.1, 0]);
  assert.equal(pad.buttons[PAD_BUTTONS.rt].pressed, false, 'a thumb resting near the middle only turns');
  assert.equal(pad.buttons[PAD_BUTTONS.a].pressed, false, 'buttons let go');
});
