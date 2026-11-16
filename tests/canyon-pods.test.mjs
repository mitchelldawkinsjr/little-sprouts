import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { BARRIERS, GATES, LAP, RACE, WIDTH, boost, clearGate, makeRace, position, rivalAt, sampleTrack, step } from '../sidecars/canyon-pods/logic.mjs';
import { sidecarGame, sidecarArcadeIds } from '../lib/sidecar.js';

const advance = (race, event, steer = 0, brake = false) => {
  for (let i = 0; i < 5000; i++) {
    if (step(race, 1 / 60, steer, brake) === event) return;
  }
  assert.fail('Race never reached ' + event);
};

test('Canyon Pods ships with Learning Play, Arcade Play, input mapping, and offline assets', () => {
  const game = sidecarGame('canyon-pods');
  assert.equal(game.banks, true);
  assert.ok(sidecarArcadeIds().includes(game.id));
  assert.deepEqual(game.pad.keys, { a: 'Space', x: 'KeyS', rt: 'Space' });
  assert.equal(game.pad.menuBack, '[data-pad-back]');
  const read = p => readFileSync(new URL('../'+p, import.meta.url), 'utf8');
  assert.match(read('Dockerfile'), /COPY sidecars\/canyon-pods /);
  assert.match(read('Dockerfile'), /find sidecars vendor lib/);
  assert.match(read('server/serve.mjs'), /LISTED = \['sidecars', 'vendor', 'lib'/);
  for (const p of ['index.html', 'pods.css', 'logic.mjs', 'game.mjs', 'view.mjs', 'friends.mjs']) {
    assert.ok(read('sidecars/canyon-pods/' + p).length);
  }
  assert.match(read('sidecars/canyon-pods/game.mjs'), /attachTouchControls/);
  assert.match(read('sidecars/canyon-pods/game.mjs'), /data-pad-standalone/);
});

test('Closed track wraps, stays continuous and is parameterized by metres', () => {
  const p = sampleTrack(0), q = sampleTrack(LAP);
  assert.deepEqual(p, q);
  for(let d=0; d<LAP; d+=12) {
    const a = sampleTrack(d), b = sampleTrack(d+1);
    assert.ok(Math.abs(Math.hypot(a.x-b.x,a.z-b.z)-1)<.04);
  }
  const edge = sampleTrack(15, WIDTH), centre = sampleTrack(15);
  assert.ok(Math.abs(Math.hypot(centre.x-edge.x,centre.z-edge.z)-WIDTH)<.01);
});

test('Learning gates freeze the race and reward only once even after a retry', () => {
  const run = makeRace(true);
  for (const gate of GATES) {
    advance(run,'question');
    assert.equal(run.d,gate);
    const t = run.time;
    assert.equal(boost(run),false);
    assert.equal(step(run,.05,1),'');
    assert.equal(run.time,t);
    assert.equal(clearGate(run),true);
    assert.equal(clearGate(run),false);
    assert.equal(run.shield,true);
  }
  advance(run,'finish');
  assert.equal(run.d,RACE);
  assert.equal(run.won,true);
  assert.ok(position(run) >= 1 && position(run) <= 4);
});

test('Arcade gates recharge boosts, never pause for a question, and finish after two laps', () => {
  const run = makeRace(false);
  let charges = 0;
  assert.equal(boost(run),true);
  assert.equal(boost(run),false);
  for(let i=0;i<5000&&!run.won;i++){
    const event=step(run,1/60);
    assert.notEqual(event,'question');
    if(event==='charge') charges++;
  }
  assert.equal(charges,4);assert.equal(run.shield,false);assert.equal(run.won,true);
  assert.equal(rivalAt(0,Infinity).d,RACE);
});

test('Two-finger brake and steering stay responsive and hazards can be avoided or shielded', () => {
  const r=makeRace(false);
  for(let i=0;i<100;i++) step(r,1/60,1,true);
  assert.ok(r.x>8);
  assert.ok(r.speed<=21);
  const b=BARRIERS[0];
  const blocked={...makeRace(false), d:b.d-.15, x:b.x, speed:40, shield:true};
  assert.equal(step(blocked,.02), 'shield');
  assert.equal(blocked.bumps,0);
  const bumped={...makeRace(false), d:b.d-.15, x:b.x, speed:40};
  assert.equal(step(bumped,.02), 'bump');
  assert.ok(bumped.speed<40);
  const safe={...makeRace(false), d:b.d-.15, x:-b.x, speed:40};
  assert.equal(step(safe,.02), '');
});

test('All four pod cockpits use different Three.js garden-buddy drivers', async () => {
  const THREE = await import('../vendor/three/build/three.module.js?v=r187');
  const { BUDDIES } = await import('../lib/buddy3d.mjs');
  const { rivalDrivers, seatDriver } = await import('../sidecars/canyon-pods/view.mjs');
  for (const kind of BUDDIES) {
    const grid = [kind, ...rivalDrivers(kind)];
    assert.equal(new Set(grid).size, 4);
    for (const [i, driver] of grid.entries()) {
      const racer = { chassis: new THREE.Group(), buddy: null };
      seatDriver(racer, driver, i !== 0);
      assert.equal(racer.buddy.kind, driver);
      assert.equal(racer.chassis.children[0], racer.buddy.group);
      assert.ok(racer.buddy.group.position.y > 0.5);
      seatDriver(racer, BUDDIES.find(other => other !== driver), true);
      assert.equal(racer.chassis.children.length, 1);
      racer.buddy.dispose();
    }
  }
});

test('The Canyon Pods catalog entry maps to the Drive, Fly & Aim shelf', async () => {
  const { sidecarRows } = await import('../lib/sidecar.js');
  const { shelfOf, SHELF_META } = await import('../lib/home-ui.mjs');
  const game = sidecarGame('canyon-pods');
  assert.deepEqual(sidecarRows().find(([id]) => id === game.id)?.slice(0, 2), ['canyon-pods', 'Canyon Pods']);
  assert.equal(SHELF_META.find(({ id }) => id === shelfOf(game.id, game.shelf))?.label, 'Drive, Fly & Aim');
});
