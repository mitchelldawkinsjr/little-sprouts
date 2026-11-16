import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { sidecarGame, sidecarAlone, sidecarArcadeIds } from '../lib/sidecar.js';
import { contextFor } from '../lib/speech-core.mjs';
import { PRESETS, readBoss as readShared, saveBoss as saveShared } from '../lib/boss-design.mjs';
import { readBoss as readFromChase, saveBoss as saveFromChase } from '../sidecars/boss/logic.mjs';
import { answer, FIRST_QUESTION, INK_BOOST, makeRun, PEN_AHEAD, PEN_WOBBLE, resumeCaught, stepRun, strokeAt } from '../sidecars/ink-trail/logic.mjs';

function simulate(run, seconds, input = {}) {
  const events = [];
  for (let frame = 0; frame < seconds * 60; frame++) events.push(...stepRun(run, 1 / 60, input));
  return events;
}

test('the Ink Trail shelf card, arcade mode, controller, and offline files ship together', () => {
  const spec = sidecarGame('ink-trail');
  assert.equal(spec.shelf, 'run-jump-dodge');
  assert.equal(contextFor(spec.id), 'gameHost');
  assert.ok(sidecarArcadeIds().includes(spec.id));
  assert.equal(spec.pad.keys.a, 'Space');
  assert.equal(spec.pad.keys.start, 'KeyP');
  assert.equal(sidecarAlone(spec).href, 'sidecars/ink-trail/index.html');
  const docker = readFileSync(new URL('../Dockerfile', import.meta.url), 'utf8');
  const warm = readFileSync(new URL('../lib/offline-warm.mjs', import.meta.url), 'utf8');
  assert.match(docker, /COPY sidecars\/ink-trail /);
  for (const name of ['index.html', 'trail.css', 'game.mjs', 'logic.mjs', 'view.mjs', 'ink-surface.mjs'].map(x => 'sidecars/ink-trail/' + x)
    .concat(['boss-design', 'boss-builder', 'boss-model'].map(x => 'lib/' + x + '.mjs'))) {
    assert.ok(existsSync(new URL('../' + name, import.meta.url)), name);
    assert.ok(warm.includes('./' + name), name);
  }
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
  assert.equal(run.buddy.x, x);
  assert.equal(run.buddy.z, z);
  assert.ok(resumeCaught(run));
  assert.equal(run.buddy.x, x);
  assert.equal(run.pen.z, z);
  assert.equal(run.nextQuestion, FIRST_QUESTION);
});

test('a wrong answer adds skipped ink on the run and reopens a checkpoint without advancing it', () => {
  const run = makeRun({ learning: true });
  const input = { direction: { x: 1, z: 0 } };
  assert.deepEqual(simulate(run, 6, input), ['question']);
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

test('a right answer pushes the boss back, thickens the ink, and opens the final stretch', () => {
  const run = makeRun({ learning: true });
  const input = { direction: { x: 1, z: 0 } };
  simulate(run, 6, input);
  const gap = run.gap;
  assert.ok(answer(run, true, true));
  assert.equal(run.boost, INK_BOOST);
  assert.ok(run.gap > gap);
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
  for (const [x,z] of [[1,0],[0,-1],[-1,0],[0,1]]) {
    const before = { ...run.pen };
    simulate(run, 1, { direction: { x,z } });
    assert.ok((run.pen.x - before.x)*x + (run.pen.z - before.z)*z > 50);
    assert.ok(run.trail.at(-1).s - run.distance <= PEN_AHEAD);
  }
});
