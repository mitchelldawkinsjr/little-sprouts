import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { ARRIVAL_RADIUS, atBeacon, HOME, makeTrail, STOPS } from '../sidecars/sketchbook/checkpoints.mjs';
import { padMapFor, sidecarGame } from '../lib/sidecar.js';

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
  } finally {
    if (save) globalThis.location = save; else delete globalThis.location;
  }
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
  assert.match(read('app/helpers.mjs'), /ARCADE_PLAY = new Set\([^\n]*'sketchbook'/);
  const warm = read('lib/offline-warm.mjs');
  const files = ['index.html','trail.css','trail.mjs','checkpoints.mjs','build/sketchbook.min.js',
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
