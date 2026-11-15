import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { ARRIVAL_RADIUS, atBeacon, distanceTo, HOME, LANDMARKS, makeTrail, MEGA_RAMP, pastRampLanding, STOPS } from '../sidecars/sketchbook/checkpoints.mjs';
import { padMapFor, sidecarArcadeIds, sidecarGame } from '../lib/sidecar.js';

const pos = ([x, y, z]) => ({ x, y, z });

test('Sketchbook uses the shared question reward and controller conventions', () => {
  const game = sidecarGame('sketchbook');
  assert.equal(game.banks, true);
  assert.equal(game.lesson, undefined);
  const save = globalThis.location;
  globalThis.location = { href: 'http://localhost/' };
  try {
    const pad = padMapFor('http://localhost/' + game.src);
    assert.equal(pad.move, 'wasd');
    assert.equal(pad.lookOn, '#canvas');
    assert.equal(pad.keys.a, 'Space');
    assert.equal(pad.keys.x, 'KeyF');
    assert.equal(pad.menuOpen, '#trail-menu');
    assert.ok(pad.menuBack.includes('[data-trail-back]'));
    assert.ok(pad.menuBack.includes('[data-id="cancel"]'));
    assert.equal(pad.keys.rs, 'KeyV');
    assert.equal(pad.keys.ls, 'KeyG');
    assert.equal(pad.keys.rt, 'KeyB');
  } finally {
    if (save) globalThis.location = save; else delete globalThis.location;
  }
});

test('The trail spans both sides of the map with distinct northern and southern stretches', () => {
  const route = [HOME, ...STOPS];
  const lengths = STOPS.map((stop, i) => distanceTo(pos(route[i]), stop));
  assert.equal(STOPS.length, 5);
  assert.ok(lengths[0] > 12 && lengths.slice(1).every(length => length > 45));
  assert.ok(lengths.reduce((a, b) => a + b) > 330);
  assert.ok(STOPS.some(([x]) => x <= -20) && STOPS.some(([x]) => x >= 20));
  assert.ok(STOPS.some(([, , z]) => z < -65) && STOPS.some(([, , z]) => z > 65));
});

test('A checkpoint needs ground-level proximity and gives its reward only once', () => {
  const trail = makeTrail();
  const [x,y,z] = STOPS[0];
  assert.equal(atBeacon(pos(HOME), STOPS[0]), false);
  assert.equal(atBeacon({x, y:y+4, z}, STOPS[0]), false);
  assert.equal(atBeacon({x:x+ARRIVAL_RADIUS+0.1, y, z}, STOPS[0]), false);
  assert.equal(trail.reach(pos(STOPS[1])), false);
  assert.equal(trail.reach({x,y,z}), true);
  assert.equal(trail.reach({x,y,z}), false);
  assert.equal(trail.settle(false), false);
  assert.equal(trail.index, 0);
  assert.equal(trail.reach({x,y,z}), true);
  assert.equal(trail.settle(true), true);
  assert.equal(trail.settle(true), false);
  for (const p of STOPS.slice(1)) {
    assert.equal(trail.reach(pos(p)), true);
    assert.equal(trail.settle(true), true);
  }
  assert.equal(trail.done, true);
  assert.equal(trail.target, null);
  assert.equal(trail.reach({x,y,z}), false);
});

test('Sketchbook ships after deployment and all of its runtime assets fit the offline cache', () => {
  const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
  assert.match(read('Dockerfile'), /COPY sidecars\/sketchbook \/usr\/share\/nginx\/html\/sidecars\/sketchbook/);
  assert.ok(sidecarArcadeIds().includes('sketchbook'));
  const warm = read('lib/offline-warm.mjs');
  const files = ['index.html','trail.css','trail.mjs','checkpoints.mjs','friends.mjs','build/sketchbook.min.js',
    ...['world-lite','boxman','car','heli','airplane'].map(x => 'build/assets/' + x + '.glb')];
  for (const name of files) {
    const path = 'sidecars/sketchbook/' + name;
    assert.ok(warm.includes('./' + path), path);
    assert.ok(statSync(new URL('../' + path, import.meta.url)).size < 20_000_000, path);
  }
  const model = readFileSync(new URL('../sidecars/sketchbook/build/assets/world-lite.glb', import.meta.url));
  assert.equal(model.toString('ascii',0,4),'glTF');
  const scene = JSON.parse(model.toString('utf8',20,20+model.readUInt32LE(12)));
  assert.equal(scene.images, undefined);
  assert.ok(scene.nodes.some(n => n.extras?.default === 'true'));
  assert.ok(scene.nodes.some(n => n.extras?.data === 'physics'));
});

test('Back to the trail restarts at the last lit beacon, never at an unanswered one', () => {
  const trail = makeTrail();
  assert.deepEqual(trail.resumePosition, HOME);
  const [x, y, z] = STOPS[0];
  assert.equal(trail.reach(pos(STOPS[0])), true);
  assert.deepEqual(trail.resumePosition, HOME);
  assert.equal(trail.settle(true), true);
  assert.deepEqual(trail.resumePosition, [x, y + 0.65, z]);
  assert.equal(trail.reach(pos(STOPS[1])), true);
  assert.equal(trail.settle(false), false);
  assert.deepEqual(trail.resumePosition, [x, y + 0.65, z]);
});

test('The tunnel direction advances without opening extra questions and resets on return', () => {
  const trail = makeTrail();
  for (const stop of STOPS.slice(0, 2)) {
    assert.equal(trail.reach(pos(stop)), true);
    assert.equal(trail.settle(true), true);
  }
  for (const stop of LANDMARKS[2].via) {
    assert.equal(trail.guide, stop);
    assert.equal(trail.reach(pos(stop)), false);
    trail.updateGuide(pos(stop));
  }
  assert.equal(trail.guide, STOPS[2]);
  trail.restartLeg();
  assert.equal(trail.guide, LANDMARKS[2].via[0]);
});

test('The last two named stops are within easy range of their original ground-level aircraft spawns', () => {
  const model = readFileSync(new URL('../sidecars/sketchbook/build/assets/world-lite.glb', import.meta.url));
  const { nodes } = JSON.parse(model.toString('utf8', 20, 20 + model.readUInt32LE(12)));
  const air = nodes.find(n => n.name === 'air_vehicles');
  for (const i of [3, 4]) {
    const spawn = air.children.map(j => nodes[j]).find(n => n.name.replaceAll('.', '') === LANDMARKS[i].aircraft);
    assert.equal(spawn.extras.type, i === 3 ? 'airplane' : 'heli');
    const [x, y, z] = spawn.translation.map((n, axis) => n + air.translation[axis]);
    assert.ok(distanceTo({ x, z }, STOPS[i]) < 4);
    assert.ok(Math.abs(y - STOPS[i][1]) < .35);
  }
});

test('Mega Ramp starts in a driver car and the descent has no question gate', () => {
  const model = readFileSync(new URL('../sidecars/sketchbook/build/assets/world-lite.glb', import.meta.url));
  const { nodes } = JSON.parse(model.toString('utf8', 20, 20 + model.readUInt32LE(12)));
  const ramp = nodes.find(n => n.name === MEGA_RAMP);
  const car = ramp.children.map(i => nodes[i]).find(n => n.extras?.driver === 'player');
  assert.equal(car.extras.type, 'car');
  assert.ok(ramp.translation[1] + car.translation[1] > 500);
  assert.equal(pastRampLanding({ x: 0, y: 546, z: 625 }), false);
  assert.equal(pastRampLanding({ x: 0, y: 100, z: 205 }), false);
  assert.equal(pastRampLanding({ x: 0, y: 24, z: 201 }), true);
  const trail = makeTrail();
  assert.equal(trail.index, 0);
  assert.equal(trail.reach({ x: 0, y: 24, z: 201 }), false);
});
