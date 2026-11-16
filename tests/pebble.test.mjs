import assert from 'node:assert/strict';
import test from 'node:test';
import { CHECKPOINT_GAP, checkpointSeconds, FIRST_CHECKPOINT, hop, makeRun, ROW_GAP, rowAt, rowDistance, rowLanes, score, startCheckpointCountdown, steer, step } from '../sidecars/pebble/logic.mjs';
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

test('quick lane changes do not lock steering or restart a jump', () => {
  const run = makeRun();
  run.x = run.lane = -1;
  steer(run, 1);
  assert.equal(run.lane, 0);
  assert.equal(run.vy, 0, 'lane bob is visual, not a jump');
  hop(run);
  step(run, .05);
  const { vy } = run;
  steer(run, 1);
  assert.equal(run.lane, 1, 'can steer while jumping');
  hop(run);
  assert.equal(run.vy, vy, 'cannot jump twice in midair');
  for (let i = 0; i < 3; i++) step(run, .05);
  assert.equal(run.x, 1);
});

test('every two-tree wall has a clear approach and at least two single-tree rows between walls', () => {
  let walls = 0;
  for (let seed = 0; seed < 64; seed++) {
    for (let row = 0; row < 120; row++) {
      const lanes = rowLanes(row, seed);
      if (lanes.length !== 2) continue;
      walls++;
      assert.ok(row >= 3);
      const gap = [-1, 0, 1].find(lane => !lanes.includes(lane));
      assert.equal(rowLanes(row - 2, seed).length, 1);
      assert.equal(rowLanes(row - 1, seed).length, 1);
      assert.ok(!rowLanes(row - 1, seed).includes(gap));
    }
  }
  assert.ok(walls > 0);
});

test('the first row after a question is not a two-tree wall', () => {
  for (let seed = 0; seed < 64; seed++) {
    for (let gate = 0; gate < 10; gate++) {
      const firstRowAfter = rowAt(FIRST_CHECKPOINT + gate * CHECKPOINT_GAP) + 1;
      assert.equal(rowLanes(firstRowAfter, seed).length, 1);
    }
  }
});

test('two presses at controller repeat timing reach an opposite-edge gap without jumping', () => {
  const row = 6;
  const seed = Array.from({ length: 64 }, (_, i) => i).find(i => {
    const lanes = rowLanes(row, i);
    return lanes.length === 2 && lanes.includes(-1) && lanes.includes(0) && !rowLanes(row - 1, i).includes(-1);
  });
  assert.notEqual(seed, undefined, 'test uses a real wall with its gap on the right edge');
  for (const learning of [false, true]) {
    for (const fps of [20, 30, 60, 120]) {
      const run = makeRun({ seed, learning });
      // Start mid-run, after the first checkpoint, without relying on a shield.
      if (learning) run.nextGate += CHECKPOINT_GAP;
      run.distance = rowDistance(row - 1) + .01;
      run.x = run.lane = -1;
      const dt = 1 / fps;
      const inputTimes = [.135, .355]; // Reaction time, then the host's 220 ms repeat.
      let t = 0;
      while (run.distance < rowDistance(row)) {
        if (inputTimes.length && t >= inputTimes[0]) {
          inputTimes.shift();
          steer(run, 1);
        }
        assert.equal(step(run, dt), '', `wall hit in ${learning ? 'Learning' : 'Arcade'} at ${fps} fps`);
        t += dt;
      }
      assert.equal(run.x, 1);
    }
  }
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
  startCheckpointCountdown(run, 5000);
  assert.equal(run.shield, true);
  assert.equal(checkpointSeconds(run, 5000), 2);
  assert.equal(checkpointSeconds(run, 5999), 2);
  assert.equal(checkpointSeconds(run, 6000), 1);
  assert.equal(checkpointSeconds(run, 6999), 1);
  step(run, .05);
  steer(run, -1);
  hop(run);
  assert.equal(run.distance, stop);
  assert.equal(run.lane, 0);
  assert.equal(run.vy, 0);
  assert.equal(checkpointSeconds(run, 7000), 0);
  assert.equal(run.gatePending, false);
  assert.equal(checkpointSeconds(run, 7001), null);
  assert.ok(run.nextGate > stop);
  aimAtTree(run, 4);
  assert.equal(step(run, .02), 'shield');
  assert.equal(run.hearts, 3);
  assert.equal(run.shield, false);
  assert.equal(step(run, .02), '', 'the same tree cannot hit twice');
});

test('a countdown restarted on return to the game gives a fresh two seconds', () => {
  const run = makeRun({ learning: true });
  run.distance = run.nextGate - .1;
  assert.equal(step(run, .02), 'gate');
  startCheckpointCountdown(run, 5000);
  assert.equal(checkpointSeconds(run, 6100), 1);
  startCheckpointCountdown(run, 10000);
  assert.equal(checkpointSeconds(run, 10000), 2);
  assert.equal(checkpointSeconds(run, 11999), 1);
  assert.equal(run.gatePending, true);
  assert.equal(checkpointSeconds(run, 12000), 0);
  assert.equal(run.gatePending, false);
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
  // Offline saving follows the build list: every file under the folders the Dockerfile lists.
  const listed = (await file('Dockerfile')).match(/find ([^\n]+?) -type f/)[1].split(' ');
  for (const asset of assets) {
    assert.ok((await file(asset)).length > 0);
    assert.ok(listed.includes(asset.split('/')[0]), asset + ' is in the offline list');
  }
  assert.match(await file('Dockerfile'), /COPY sidecars\/pebble /);
});
