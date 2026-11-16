import { fileURLToPath } from 'node:url';
import { inventory } from '../tools/static-files.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { sidecarGame, sidecarAlone, sidecarArcadeIds } from '../lib/sidecar.js';
import { contextFor } from '../lib/speech-core.mjs';
import { PRESETS, readBoss as readShared, saveBoss as saveShared } from '../lib/boss-design.mjs';
import { readBoss as readFromChase, saveBoss as saveFromChase } from '../sidecars/boss/logic.mjs';
import { answer, bossDistance, FIRST_QUESTION, INK_BOOST, makeRun, nearestBoss, PEN_AHEAD, PEN_WOBBLE, penStickDirection, resumeCaught, stepRun, strokeAt } from '../sidecars/ink-trail/logic.mjs';
import { makeBossCatch } from '../lib/boss-catch.mjs';
import { KID, readStick } from '../lib/touch-controls.mjs';
import { VirtualGamepad } from '../vendor/gamepad/core.js';
import { Group } from '../vendor/three/build/three.module.js';

function simulate(run, seconds, input = {}) {
  const events = [];
  for (let frame = 0; frame < seconds * 60; frame++) events.push(...stepRun(run, 1 / 60, input));
  return events;
}

test('the Ink Trail shelf card, arcade mode, controller, touch controls, and offline files ship together', () => {
  const spec = sidecarGame('ink-trail');
  assert.equal(spec.shelf, 'run-jump-dodge');
  assert.equal(contextFor(spec.id), 'gameHost');
  assert.ok(sidecarArcadeIds().includes(spec.id));
  assert.equal(spec.pad.keys.a, 'Space');
  assert.equal(spec.pad.keys.start, 'KeyP');
  assert.equal(sidecarAlone(spec).href, 'sidecars/ink-trail/index.html');
  const docker = readFileSync(new URL('../Dockerfile', import.meta.url), 'utf8');
  // The deploy's offline list (tools/static-files.mjs) must carry every file the game loads.
  const listed = inventory(fileURLToPath(new URL('..', import.meta.url))).offline();
  assert.match(docker, /COPY sidecars\/ink-trail /);
  for (const name of ['index.html', 'trail.css', 'game.mjs', 'logic.mjs', 'view.mjs', 'ink-surface.mjs'].map(x => 'sidecars/ink-trail/' + x)
    .concat(['boss-design', 'boss-builder', 'boss-model', 'boss-catch', 'touch-controls'].map(x => 'lib/' + x + '.mjs'))
    .concat(['core', 'dom', 'physical', 'safe-area'].map(x => 'vendor/gamepad/' + x + '.js'))) {
    assert.ok(existsSync(new URL('../' + name, import.meta.url)), name);
    assert.ok(listed['./' + name], name);
  }
});

test('the shared touch joystick steers the ink diagonally and releases without drawing more', () => {
  const pad = new VirtualGamepad({ stick: { radius: KID.stick, knobRadius: KID.knob, deadZone: KID.deadZone } });
  pad.setViewport(390, 700);
  const run = makeRun();
  pad.pointerDown(1, 78, 600);
  pad.pointerMove(1, 82, 598);
  assert.equal(penStickDirection(readStick(pad.getStick())), null);
  pad.pointerMove(1, 78 + KID.stick, 600 - KID.stick);
  const direction = penStickDirection(readStick(pad.getStick()));
  const { x, z } = run.pen;
  simulate(run, .4, { direction });
  assert.ok(run.pen.x > x + 50);
  assert.ok(run.pen.z < z - 50);
  assert.ok(Math.abs(run.pen.x - x + run.pen.z - z) < 1e-8);
  assert.deepEqual(run.buddy, strokeAt(run.trail, run.distance));
  pad.pointerUp(1);
  assert.equal(penStickDirection(readStick(pad.getStick())), null);
  const end = run.trail.at(-1);
  const distance = run.distance;
  simulate(run, .25, { direction: penStickDirection(readStick(pad.getStick())) });
  assert.equal(run.trail.at(-1), end);
  assert.ok(run.distance > distance, 'the garden buddy still runs along the ink already drawn');
});

test('more joystick travel draws faster while an active floor drag keeps its own direction', () => {
  const light = makeRun(), full = makeRun(), drag = makeRun();
  const small = penStickDirection({ active: true, x: .25, y: 0, magnitude: .25 });
  const large = penStickDirection({ active: true, x: 1, y: 0, magnitude: 1 });
  simulate(light, .2, { direction: small });
  simulate(full, .2, { direction: large });
  simulate(drag, .2, { direction: large, target: { x: 65, z: 100 } });
  assert.ok(full.pen.x > light.pen.x);
  assert.equal(drag.pen.x, 65);
  assert.ok(drag.pen.z > 70);
});

test('the old Boss Chase save survives in both directions', () => {
  const data = new Map([['sprouts-boss-v1', JSON.stringify(PRESETS.shark)]]);
  const storage = { getItem: k => data.get(k), setItem: (k, v) => data.set(k, v) };
  assert.deepEqual(readShared(storage), PRESETS.shark);
  saveShared({ ...PRESETS.octopus, eyes: 6 }, storage);
  assert.equal(readFromChase(storage).eyes, 6);
  saveFromChase(PRESETS.spider, storage);
  assert.deepEqual(readShared(storage), PRESETS.spider);
  assert.deepEqual([...data.keys()], ['sprouts-boss-v1']);
});

test('the runner follows a freehand corner, then doubles back in floor coordinates', () => {
  const run = makeRun();
  run.safe = 12; // This test exercises the drawing controls, not boss avoidance.
  const settle = (x, z) => {
    for (let i = 0; i < 110; i++) {
      stepRun(run, 1 / 60, { target: { x, z } });
      assert.deepEqual(run.buddy, strokeAt(run.trail, run.distance));
      if (Math.hypot(run.pen.x-x, run.pen.z-z) < .01) return;
    }
    assert.fail('pen never got to its floor-space target');
  };
  settle(160, 0);
  settle(160, -125);
  settle(25, -125);
  settle(25, 35); // Cross the starter line without jumping onto it.
  assert.ok(run.trail.some(p => p.ink && p.z < -124 && p.x > 155));
  assert.ok(run.trail.some(p => p.ink && p.z < -124 && p.x < 27));
  const before = run.distance;
  simulate(run, 1, {});
  assert.ok(run.distance > before);
  assert.ok(run.buddy.z < 34.9, 'buddy did not skip ahead at the crossing');
  assert.ok(run.trail.every((p, i) => i === 0 || p.s > run.trail[i-1].s));
});

test('a short stroke stops the buddy at the endpoint and lets the boss catch up', () => {
  const run = makeRun({ learning: true });
  const x = run.pen.x, z = run.pen.z;
  assert.ok(simulate(run, 6).includes('caught'));
  assert.equal(run.caughtBy, run.bosses[0]);
  assert.equal(run.buddy.x, x);
  assert.equal(run.buddy.z, z);
  assert.ok(resumeCaught(run));
  assert.equal(run.caughtBy, null);
  assert.equal(run.buddy.x, x);
  assert.equal(run.pen.z, z);
  assert.equal(run.nextQuestion, FIRST_QUESTION);
});

test('the custom boss leads and two distinct bosses join before the first question', () => {
  const run = makeRun({ learning: true, design: PRESETS.spider });
  assert.deepEqual(run.bosses[0].design, PRESETS.spider);
  assert.equal(new Set(run.bosses.map(boss => boss.design.head)).size, 3);
  assert.equal(run.bosses.filter(boss => boss.active).length, 1);
  const input = { direction: { x: 1, z: 0 } };
  assert.deepEqual(simulate(run, 3, input), ['join']);
  assert.equal(run.bosses.filter(boss => boss.active).length, 2);
  assert.deepEqual(simulate(run, 3, input), ['join', 'question']);
  assert.equal(run.bosses.filter(boss => boss.active).length, 3);
  const positions = run.bosses.map(({ x, z }) => [x, z]);
  simulate(run, 2, input);
  assert.deepEqual(run.bosses.map(({ x, z }) => [x, z]), positions, 'a question freezes the whole pack');
});

test('any active boss can catch the buddy on contact, and only a learning run resumes', () => {
  for (const learning of [false, true]) {
    for (const i of [0, 1, 2]) {
      const run = makeRun({ learning });
      simulate(run, 4.25, { direction: { x: 1, z: 0 } });
      const catcher = run.bosses[i];
      assert.ok(catcher.active);
      catcher.x = run.buddy.x + 22;
      catcher.z = run.buddy.z;
      catcher.heading = Math.PI;
      assert.equal(nearestBoss(run), catcher);
      assert.deepEqual(stepRun(run, 1 / 60), ['caught']);
      assert.equal(run.caughtBy, catcher);
      const distance = run.distance;
      assert.deepEqual(stepRun(run, 1), []);
      assert.equal(resumeCaught(run), learning);
      assert.equal(run.distance, distance);
      if (learning) {
        assert.equal(run.caughtBy, null);
        assert.ok(run.bosses.every(boss => boss.active && bossDistance(boss, run.buddy) >= 120));
        assert.equal(run.nextQuestion, FIRST_QUESTION);
      }
    }
  }
});

test('flankers cut over unpainted floor from opposite sides of a straight stroke', () => {
  const run = makeRun();
  assert.deepEqual(simulate(run, 5, { direction: { x: 1, z: 0 } }), ['join', 'join']);
  assert.ok(run.trail.every(p => p.z === 0));
  assert.ok(run.bosses[1].z < -5);
  assert.ok(run.bosses[2].z > 35);
  assert.deepEqual(simulate(run, 6), ['caught']);
  assert.equal(run.caughtBy, run.bosses[2]);
});

test('choosing a turn away from a flanker can avoid a catch', () => {
  const north = makeRun(), south = makeRun();
  for (const run of [north, south]) simulate(run, 3, { direction: { x: 1, z: 0 } });
  assert.ok(!simulate(north, 4, { direction: { x: 0, z: -1 } }).includes('caught'));
  assert.ok(simulate(south, 4, { direction: { x: 0, z: 1 } }).includes('caught'));
  assert.equal(south.caughtBy, south.bosses[2]);
  assert.ok(south.caughtBy.z > 0, 'the chomp comes from the floor, not the old trail behind the buddy');
});

test('a moving boss catches the buddy on a swept path crossing even when the endpoints miss', () => {
  const run = makeRun();
  const boss = run.bosses[0];
  Object.assign(boss, { x: 34, z: -55, heading: Math.PI / 2, speed: 220, turn: 0 });
  assert.deepEqual(stepRun(run, .5, { direction: { x: 1, z: 0 } }), ['caught']);
  assert.equal(run.caughtBy, boss);
  assert.ok(run.distance > 0 && run.distance < 54);
  assert.ok(Math.abs(bossDistance(boss, run.buddy) - 21) < .001);
});

test('the shared chomp holds the garden buddy at the chosen jaw and restores its running transform', () => {
  const scene = new Group(), buddy = new Group();
  buddy.scale.setScalar(1.88);
  buddy.position.set(3, 0, 4);
  scene.add(buddy);
  const rig = () => {
    const lead = new Group(), holder = new Group();
    lead.scale.setScalar(.76);
    lead.add(holder);
    scene.add(lead);
    return { holder };
  };
  const first = rig(), second = rig();
  const chomp = makeBossCatch(buddy);
  chomp.grab(first);
  chomp.grab(second, .8, Math.PI / 2);
  assert.equal(chomp.rig, second);
  assert.equal(first.holder.children.length, 0);
  assert.equal(buddy.parent, second.holder);
  assert.equal(buddy.rotation.y, Math.PI / 2);
  const hero = { arms: [new Group(), new Group()], legs: [new Group(), new Group()] };
  chomp.wriggle(hero, .07);
  assert.ok(hero.legs[0].rotation.x > .5);
  assert.equal(hero.legs[0].rotation.x, -hero.legs[1].rotation.x);
  chomp.release();
  assert.equal(buddy.parent, scene);
  assert.equal(buddy.scale.x, 1.88);
  assert.deepEqual(buddy.position.toArray(), [3, 0, 4]);
});

test('a wrong answer adds skipped ink on the run and reopens a checkpoint without advancing it', () => {
  const run = makeRun({ learning: true });
  const input = { direction: { x: 1, z: 0 } };
  assert.deepEqual(simulate(run, 6, input), ['join', 'join', 'question']);
  assert.equal(run.distance, FIRST_QUESTION);
  simulate(run, 1, input);
  assert.equal(run.distance, FIRST_QUESTION, 'the question pauses the chase');
  assert.ok(answer(run, false));
  assert.equal(run.wobble, PEN_WOBBLE);
  assert.equal(answer(run, false), false);
  simulate(run, .75, input);
  assert.ok(run.trail.some(p => p.style === 'wobble' && !p.ink));
  assert.ok(simulate(run, 5, input).includes('question'));
  assert.equal(run.wobble, 0);
  assert.equal(run.phase, 'question');
});

test('a right answer pushes every boss back, thickens the ink, and opens the final stretch', () => {
  const run = makeRun({ learning: true });
  const input = { direction: { x: 1, z: 0 } };
  simulate(run, 6, input);
  const gaps = run.bosses.map(boss => bossDistance(boss, run.buddy));
  assert.ok(answer(run, true, true));
  assert.equal(run.boost, INK_BOOST);
  assert.ok(run.bosses.every((boss, i) => bossDistance(boss, run.buddy) > gaps[i]));
  assert.equal(run.nextQuestion, Infinity);
  simulate(run, .35, input);
  assert.ok(run.trail.some(p => p.style === 'gold' && p.ink));
  assert.ok(simulate(run, 4, input).includes('finish'));
  assert.equal(run.phase, 'finished');
});

test('collectibles and puddles trigger only when the buddy passes their position on the floor', () => {
  const run = makeRun();
  run.objects.push(
    { s: 0, x: 1, z: 0, type: 'wash' },
    { s: 0, x: 3, z: 0, type: 'dot' },
    { s: 0, x: 3, z: 50, type: 'dot' }
  );
  assert.deepEqual(stepRun(run, .04, { direction: { x: 1, z: 0 } }), ['wash', 'dot']);
  assert.equal(run.dots, 1);
  assert.equal(run.nextQuestion, Infinity);
  assert.equal(resumeCaught(run), false);
});

test('keyboard can draw in all four directions, at a bounded lead', () => {
  const run = makeRun();
  run.safe = 8;
  for (const [x,z] of [[1,0],[0,-1],[-1,0],[0,1]]) {
    const before = { ...run.pen };
    simulate(run, 1, { direction: { x,z } });
    assert.ok((run.pen.x - before.x)*x + (run.pen.z - before.z)*z > 50);
    assert.ok(run.trail.at(-1).s - run.distance <= PEN_AHEAD);
  }
});
