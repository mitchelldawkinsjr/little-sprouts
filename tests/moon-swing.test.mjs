import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { sidecarArcadeIds, sidecarGame } from '../lib/sidecar.js';
import { contextFor } from '../lib/speech-core.mjs';
import { inventory } from '../tools/static-files.mjs';
import { MODES, RADIUS, difficulty, hazardsAt, jumpHeight, makeRun, markChoice, nextUnlock, pickupAt, placeChoices, step } from '../sidecars/moon-swing/logic.mjs';

function simulate(run, seconds, input) {
  const events = [];
  for (let i = 0; i < Math.round(seconds * 120); i++) events.push(...step(run, 1 / 120, input));
  return events;
}

test('the elastic leash pulls the buddy to the target, overshoots, and keeps it in the rink', () => {
  const run = makeRun();
  const p = run.p;
  step(run, 1 / 120, { aim: { x: 4, z: 0 } });
  assert.deepEqual([p.tx, p.tz], [4, 0]);
  let farthest = 0;
  for (let i = 0; i < 240; i++) { step(run, 1 / 120, {}); farthest = Math.max(farthest, p.x); }
  assert.ok(farthest > 4.5, 'springy overshoot like the pen');
  simulate(run, 12, {});
  assert.ok(Math.hypot(p.x - 4, p.z) < .3, 'settles on the target');
  assert.ok(Math.abs(Math.atan2(4 - 0, 0) - p.yaw) < 1.6);
  simulate(run, 3, { x: 1 });
  assert.ok(Math.hypot(p.tx, p.tz) <= RADIUS + 1e-9);
  step(run, 1 / 120, { aim: { x: 40, z: 0 } });
  simulate(run, 2, {});
  assert.ok(Math.hypot(p.x, p.z) <= RADIUS + 1e-8);
});

test('a hop spins once standing, and faster skating means more turns, a higher and longer hop', () => {
  const still = makeRun();
  step(still, 1 / 120, { jump: true });
  assert.equal(still.p.jump.turns, 1);
  assert.ok(Math.abs(still.p.jump.dur - .7) < 1e-9);
  let peak = 0;
  for (let i = 0; i < 120; i++) { step(still, 1 / 120, {}); peak = Math.max(peak, still.p.y); }
  assert.ok(peak > .98 && peak <= 1);
  assert.equal(still.p.jump, null);
  assert.equal(still.p.y, 0);
  assert.equal(still.p.spin, 0);
  const fast = makeRun();
  fast.p.vx = 26;
  step(fast, 1 / 120, { jump: true });
  assert.equal(fast.p.jump.turns, 3);
  assert.ok(Math.abs(jumpHeight({ t: .55, dur: 1.1, turns: 3 }) - 3) < 1e-9);
  const capped = makeRun();
  capped.p.vx = 500;
  step(capped, 1 / 120, { jump: true });
  assert.equal(capped.p.jump.turns, 4);
});

test('a suspended gem moves and is collected from a hop, not by passing beneath it', () => {
  const run = makeRun(1, true);
  const air = { x: 0, y: 1.5, z: 0, a: 0, air: true, value: 2, taken: false };
  run.dots = [air];
  assert.notDeepEqual(pickupAt(air, .2), pickupAt(air, .7));
  Object.assign(run.p, { z: 0, tz: 0 });
  simulate(run, .25, {});
  assert.equal(run.score, 0);
  step(run, 1 / 120, { jump: true });
  const events = simulate(run, .7, {});
  assert.ok(events.some(e => e.type === 'pickup' && e.air));
  assert.equal(run.score, 2);
});

test('answer picking accepts one pending catch, retries a miss, then awards one shield', () => {
  const run = makeRun(2, true);
  placeChoices(run, [{ index: 0, label: '3' }, { index: 1, label: '6' }]);
  const wrong = run.choices[0], right = run.choices[1];
  const contact = item => {
    Object.assign(run.p, { x: item.x, y: Math.max(0, item.y - .55), z: item.z, tx: item.x, tz: item.z, vx: 0, vz: 0 });
    return step(run, 1 / 120, {}).filter(e => e.type === 'pick');
  };
  assert.deepEqual(contact(wrong), [{ type: 'pick', index: 0 }]);
  assert.deepEqual(contact(right), []);
  assert.equal(markChoice(run, 1, true), false);
  assert.equal(markChoice(run, 0, false), true);
  assert.equal(wrong.taken, true);
  assert.equal(run.choices.length, 2);
  assert.deepEqual(contact(right), [{ type: 'pick', index: 1 }]);
  assert.equal(markChoice(run, 1, true), true);
  assert.equal(markChoice(run, 1, true), false);
  assert.equal(run.score, 3);
  assert.ok(run.shield > 0);
});

test('the next question does not auto-pick a token spawned where the buddy landed', () => {
  const run = makeRun(1, true);
  const choices = [{ index: 0, label: '1' }, { index: 1, label: '2' }];
  placeChoices(run, choices);
  const sameSpot = run.choices[1];
  Object.assign(run.p, { x: sameSpot.x, y: sameSpot.y - .55, z: sameSpot.z });
  placeChoices(run, choices, 1);
  assert.equal(run.choices[0].armed, false);
  assert.ok(!step(run, 1 / 120, {}).some(e => e.type === 'pick'));
  run.p.x -= 2;
  step(run, 1 / 120, {});
  assert.equal(run.choices[0].armed, true);
  run.p.x += 2;
  assert.deepEqual(step(run, 1 / 120, {}).filter(e => e.type === 'pick'), [{ type: 'pick', index: 0 }]);
});

test('higher difficulties change hazards and airborne gems, and the third mode adds the boss', () => {
  const modes = MODES.map((_, index) => makeRun(index + 1));
  assert.deepEqual(modes.map(run => hazardsAt(run).length), [1, 3, 4]);
  assert.deepEqual(modes.map(run => run.dots.filter(dot => dot.air).length), [1, 3, 4]);
  assert.deepEqual(modes.map(run => !!run.boss), [false, false, true]);
  assert.equal(difficulty(100), 3);
  assert.equal(nextUnlock(1, 1), 2);
  assert.equal(nextUnlock(2, 2), 3);
  assert.equal(nextUnlock(3, 1), 3);
});

test('boss shockwaves can be jumped and a shield absorbs a grounded hit', () => {
  function wave(y, shield) {
    const run = makeRun(3, true);
    Object.assign(run.p, { x: 2, y, z: 0 });
    Object.assign(run.boss, { x: 0, z: 0, stompX: 0, stompZ: 0, pulse: .28 });
    run.score = 4;
    run.shield = shield;
    return { run, events: step(run, 1 / 120, {}) };
  }
  assert.ok(wave(0, 0).events.some(e => e.type === 'hit' && e.boss));
  assert.equal(wave(0, 0).run.score, 2);
  assert.equal(wave(1.6, 0).run.score, 4);
  assert.ok(wave(0, 3).events.some(e => e.type === 'shield'));
  assert.equal(wave(0, 3).run.score, 4);
});

test('Arcade finishes at its point goal while Learning waits for the host question set', () => {
  for (const learning of [false, true]) {
    const run = makeRun(1, learning);
    run.score = run.spec.target;
    assert.equal(step(run, 1 / 120, {}).some(e => e.type === 'complete'), !learning);
    assert.equal(run.done, !learning);
    if (!learning) assert.deepEqual(step(run, 1 / 120, {}), []);
  }
});

test('the shelf, controller map, speech, and offline bundle include Moonlight Swing', () => {
  const spec = sidecarGame('moon-swing');
  assert.equal(spec.shelf, 'run-jump-dodge');
  assert.ok(sidecarArcadeIds().includes(spec.id));
  assert.equal(spec.pad.keys.a, 'Space');
  assert.equal(contextFor(spec.id), 'gameHost');
  const root = new URL('../', import.meta.url);
  const built = inventory(fileURLToPath(root));
  assert.ok(built.sidecars().includes('sidecars/moon-swing/index.html'));
  const files = built.offline();
  for (const path of ['index.html', 'rink.css', 'game.mjs', 'logic.mjs', 'view.mjs', 'ice.mjs', 'motion.mjs']) {
    assert.ok(files['./sidecars/moon-swing/' + path], path);
  }
  assert.ok(files['./lib/game-touch.css']);
  const docker = readFileSync(new URL('Dockerfile', root), 'utf8');
  assert.match(docker, /COPY sidecars\/moon-swing /);
});
