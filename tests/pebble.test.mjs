import assert from 'node:assert/strict';
import test from 'node:test';
import { chargeShield, hop, makeRun, ROW_GAP, rowLanes, steer, step } from '../sidecars/pebble/logic.mjs';

test('pebble rows always leave an open lane', () => {
  for (let row = 1; row < 100; row++) {
    const lanes = rowLanes(row);
    assert.ok(lanes.length >= 1 && lanes.length <= 2);
    assert.equal(new Set(lanes).size, lanes.length);
    assert.ok(lanes.every(lane => [-1, 0, 1].includes(lane)));
  }
});

test('pebble clamps steering and a jump cannot restart in midair', () => {
  const run = makeRun();
  steer(run, 1);
  steer(run, 1);
  assert.equal(run.lane, 1);
  hop(run);
  step(run, .05);
  const before = run.vy;
  hop(run);
  assert.equal(run.vy, before);
  for (let i = 0; i < 20; i++) step(run, .05);
  assert.equal(run.lift, 0);
});

test('only learning pauses at a gate, and a right answer grants one shield', () => {
  const run = makeRun();
  run.distance = run.nextGate - .1;
  assert.equal(step(run, .02, { learning: true }), 'gate');
  const stop = run.distance;
  step(run, .05, { learning: true });
  assert.equal(run.distance, stop);
  const arcade = makeRun();
  arcade.distance = run.nextGate - .1;
  assert.equal(step(arcade, .02), '');
  assert.equal(arcade.gatePending, false);
  chargeShield(run);
  assert.equal(run.gatePending, false);
  assert.equal(run.shield, true);
  assert.ok(run.nextGate > stop);
  run.distance = 2 * ROW_GAP - .1; // center lane has a rock in row 2
  assert.equal(step(run, .02), 'shield');
  assert.equal(run.hearts, 3);
  assert.equal(run.shield, false);
  assert.equal(step(run, .02), ''); // the same rock cannot hit twice
});

test('jumping clears a rock, while the last unshielded bump ends the run', () => {
  const run = makeRun();
  run.distance = 2 * ROW_GAP - .1;
  run.lift = 1;
  assert.equal(step(run, .02), '');
  assert.equal(run.hearts, 3);
  run.distance = 2 * ROW_GAP - .1;
  run.lift = run.vy = 0;
  run.hearts = 1;
  assert.equal(step(run, .02), 'end');
  assert.equal(run.hearts, 0);
  const stop = run.distance;
  step(run, .02);
  assert.equal(run.distance, stop);
});

test('the Pebble roll sidecar ships with arcade, controller, learning, and offline support', async () => {
  const { sidecarGame, sidecarArcadeIds } = await import('../lib/sidecar.js');
  const { readFile } = await import('node:fs/promises');
  const file = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
  const spec = sidecarGame('pebble');
  assert.equal(spec.shelf, 'run-jump-dodge');
  assert.equal(spec.banks, true);
  assert.equal(spec.pad.keys.a, 'Space');
  assert.equal(spec.pad.keys.start, 'KeyP');
  assert.ok(sidecarArcadeIds().includes(spec.id));
  const assets = [spec.src.split('?')[0], 'sidecars/pebble/game.mjs',
    'sidecars/pebble/logic.mjs', 'lib/sidecar-quiz.mjs', 'lib/buddy3d.mjs',
    'vendor/three/build/three.module.js', 'vendor/three/build/three.core.js'];
  const warm = await file('lib/offline-warm.mjs');
  for (const asset of assets) {
    assert.ok((await file(asset)).length > 0);
    assert.ok(warm.includes('./' + asset), asset + ' is in the static offline list');
  }
  assert.match(await file('Dockerfile'), /COPY sidecars\/pebble /);
});
