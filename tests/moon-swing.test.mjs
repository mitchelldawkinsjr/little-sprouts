import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { sidecarArcadeIds, sidecarGame } from '../lib/sidecar.js';
import { contextFor } from '../lib/speech-core.mjs';
import { inventory } from '../tools/static-files.mjs';
import { ANCHOR, MODES, RADIUS, difficulty, hazardsAt, makeRun, markChoice, nextUnlock, pickupAt, placeChoices, step } from '../sidecars/moon-swing/logic.mjs';

function simulate(run, seconds, input) {
  const events = [];
  for (let i = 0; i < Math.round(seconds * 120); i++) events.push(...step(run, 1 / 120, input));
  return events;
}

test('a held rope remains taut in 3D, and jumping releases it without regrabbing while held', () => {
  const run = makeRun();
  simulate(run, .5, { x: 1, z: -.3, swing: true });
  const p = run.p;
  assert.ok(p.rope > 0);
  assert.ok(Math.abs(Math.hypot(p.x - ANCHOR.x, p.y - ANCHOR.y, p.z - ANCHOR.z) - p.rope) < 1e-8);
  assert.ok(p.y > 0 && p.x > 0);
  step(run, 1 / 120, { x: 1, swing: true, jump: true });
  assert.equal(p.rope, 0);
  assert.ok(p.vy > 8);
  simulate(run, .3, { x: 1, swing: true });
  assert.equal(p.rope, 0);
  assert.ok(Math.hypot(p.x, p.z) <= RADIUS + 1e-8);
  step(run, 1 / 120, {});
  assert.equal(p.rearm, true);
});

test('a suspended gem moves and is collected from a jump, not by passing beneath it', () => {
  const run = makeRun(1, true);
  const air = { x: 0, y: 2.6, z: 0, a: 0, air: true, value: 2, taken: false };
  run.dots = [air];
  assert.notDeepEqual(pickupAt(air, .2), pickupAt(air, .7));
  run.p.z = 0;
  simulate(run, .25, {});
  assert.equal(run.score, 0);
  step(run, 1 / 120, { jump: true });
  const events = simulate(run, .62, {});
  assert.ok(events.some(e => e.type === 'pickup' && e.air));
  assert.equal(run.score, 2);
});

test('answer picking accepts one pending catch, retries a miss, then awards one shield', () => {
  const run = makeRun(2, true);
  placeChoices(run, [{ index: 0, label: '3' }, { index: 1, label: '6' }]);
  const wrong = run.choices[0], right = run.choices[1];
  const contact = item => {
    Object.assign(run.p, { x: item.x, y: Math.max(0, item.y - .55), z: item.z, vx: 0, vy: 0, vz: 0 });
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
  assert.equal(spec.pad.keys.x, 'KeyX');
  assert.equal(spec.pad.keys.a, 'Space');
  assert.equal(contextFor(spec.id), 'gameHost');
  const root = new URL('../', import.meta.url);
  const built = inventory(fileURLToPath(root));
  assert.ok(built.sidecars().includes('sidecars/moon-swing/index.html'));
  const files = built.offline();
  for (const path of ['index.html', 'rink.css', 'game.mjs', 'logic.mjs', 'view.mjs']) {
    assert.ok(files['./sidecars/moon-swing/' + path], path);
  }
  assert.ok(files['./lib/game-touch.css']);
  const docker = readFileSync(new URL('Dockerfile', root), 'utf8');
  assert.match(docker, /COPY sidecars\/moon-swing /);
});
