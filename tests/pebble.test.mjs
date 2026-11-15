import assert from 'node:assert/strict';
import test from 'node:test';
import { chargeShield, hop, makeRun, ROW_GAP, rowDistance, rowLanes, score, steer, step } from '../sidecars/pebble/logic.mjs';
import { createPebbleScene } from '../sidecars/pebble/view.mjs';
import { Vector3 } from '../vendor/three/build/three.module.js?v=r187';

test('pebble rows always leave an open lane, with 2 rows per second', () => {
  for (let seed = 0; seed < 8; seed++) {
    for (let row = 0; row < 100; row++) {
      const lanes = rowLanes(row, seed);
      assert.ok(lanes.length >= 1 && lanes.length <= 2);
      assert.equal(new Set(lanes).size, lanes.length);
      assert.ok(lanes.every(lane => [-1, 0, 1].includes(lane)));
    }
  }
  const run = makeRun();
  for (let i = 0; i < 20; i++) step(run, .05);
  assert.ok(Math.abs(run.distance - 2 * ROW_GAP) < 1e-9);
  assert.equal(score(run), 2);
});

test('a lane hop is smaller than a jump, and input does not restart either in midair', () => {
  const run = makeRun();
  steer(run, 1);
  const smallHop = run.vy;
  assert.equal(run.lane, 1);
  hop(run);
  assert.equal(run.vy, smallHop);
  steer(run, -1);
  assert.equal(run.lane, 1);
  for (let i = 0; i < 10; i++) step(run, .05);
  steer(run, 1);
  assert.equal(run.vy, 0, 'no hop when already at the edge');
  hop(run);
  assert.ok(run.vy > smallHop);
});

function aimAtTree(run, row = 0) {
  run.distance = rowDistance(row) - .1;
  run.x = run.lane = rowLanes(row, run.seed)[0];
}

test('only learning stops for a question, and the shield absorbs exactly one hit', () => {
  const run = makeRun({ learning: true });
  run.distance = run.nextGate - .1;
  assert.equal(step(run, .02), 'gate');
  const stop = run.distance;
  step(run, .05);
  assert.equal(run.distance, stop);
  const arcade = makeRun();
  arcade.distance = arcade.nextGate - .1;
  assert.equal(step(arcade, .02), '');
  assert.equal(arcade.gatePending, false);
  chargeShield(run);
  assert.equal(run.gatePending, false);
  assert.equal(run.shield, true);
  assert.ok(run.nextGate > stop);
  aimAtTree(run, 4);
  assert.equal(step(run, .02), 'shield');
  assert.equal(run.hearts, 3);
  assert.equal(run.shield, false);
  assert.equal(step(run, .02), '', 'the same tree cannot hit twice');
});

test('an open lane or a jump avoids the tree, while a single unshielded hit ends Arcade Play', () => {
  const run = makeRun();
  aimAtTree(run);
  const clearLane = [-1, 0, 1].find(lane => !rowLanes(0, run.seed).includes(lane));
  run.x = run.lane = clearLane;
  assert.equal(step(run, .02), '');
  aimAtTree(run);
  run.lift = 1;
  assert.equal(step(run, .02), '');
  aimAtTree(run);
  run.lift = run.vy = 0;
  assert.equal(step(run, .02), 'end');
  assert.equal(run.hearts, 0);
  const stop = run.distance;
  step(run, .02);
  assert.equal(run.distance, stop);
});

test('the low camera sees a little buddy ball on a rolling sphere with lane trees', () => {
  const stage = createPebbleScene();
  const { scene, camera } = stage;
  camera.aspect = 1.6;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  stage.setBuddy('bunny');
  const run = makeRun();
  aimAtTree(run, 2);
  const lane = run.lane;
  stage.draw(run, .016, 0, false);
  scene.updateMatrixWorld(true);
  const world = scene.getObjectByName('forest planet');
  const ground = world.getObjectByName('pale spherical terrain');
  assert.equal(ground.geometry.type, 'SphereGeometry');
  assert.equal(ground.material.color.getHex(), 0xfffafa);
  assert.ok(world.rotation.x < 0);
  assert.equal(camera.fov, 60);
  const buddy = scene.getObjectByName('buddy-ball-bunny');
  const point = buddy.position.clone().project(camera);
  assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1);
  const trees = world.children.filter(tree => tree.name === 'lane tree' && tree.visible);
  assert.ok(trees.some(tree => {
    const pos = tree.getWorldPosition(new Vector3());
    return Math.abs(pos.x - lane) < .02 && Math.abs(pos.z - buddy.position.z) < .15;
  }), 'a collision tree is visually aligned with its lane and crossing point');
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
    'sidecars/pebble/logic.mjs', 'sidecars/pebble/view.mjs', 'lib/sidecar-quiz.mjs', 'lib/buddy3d.mjs',
    'vendor/three/build/three.module.js', 'vendor/three/build/three.core.js'];
  const warm = await file('lib/offline-warm.mjs');
  for (const asset of assets) {
    assert.ok((await file(asset)).length > 0);
    assert.ok(warm.includes('./' + asset), asset + ' is in the static offline list');
  }
  assert.match(await file('Dockerfile'), /COPY sidecars\/pebble /);
});
