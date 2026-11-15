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
  for (const name of ['index.html', 'trail.css', 'game.mjs', 'logic.mjs', 'view.mjs'].map(x => 'sidecars/ink-trail/' + x)
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

test('the buddy actually follows the stored stroke, not the current pen position', () => {
  const run = makeRun();
  simulate(run, .5, { drawing: true, target: .28 });
  assert.ok(run.trail.at(-1).y < .3);
  assert.equal(run.buddyY, .5, 'the starter stroke is still under the buddy');
  assert.ok(run.trail.at(-1).x - run.distance <= PEN_AHEAD);
  simulate(run, 1.7, { drawing: true, target: .7 });
  assert.equal(run.buddyY, strokeAt(run.trail, run.distance).y);
  assert.ok(run.buddyY < .69, 'steering does not change the already drawn section');
  assert.ok(run.trail.length < 112, 'the rolling buffer stays bounded');
});

test('uncapped drawing targets stay in bounds and a blank stroke leads to a catch', () => {
  const run = makeRun({ learning: true });
  run.gap = 72;
  simulate(run, .7, { drawing: true, target: 8 });
  assert.equal(run.trail.at(-1).y, .86);
  assert.ok(simulate(run, 6).includes('caught'));
  const distance = run.distance;
  assert.ok(resumeCaught(run));
  assert.equal(run.distance, distance, 'catch does not reset the learning round');
  assert.equal(run.nextQuestion, FIRST_QUESTION);
  assert.equal(run.onInk, true);
});

test('a wrong answer adds skipped ink on the run and reopens a checkpoint without advancing it', () => {
  const run = makeRun({ learning: true });
  const input = { drawing: true, target: .5 };
  assert.deepEqual(simulate(run, 6, input), ['question']);
  assert.equal(run.distance, FIRST_QUESTION);
  simulate(run, 1, input);
  assert.equal(run.distance, FIRST_QUESTION, 'the question pauses the chase');
  assert.ok(answer(run, false));
  assert.equal(run.wobble, PEN_WOBBLE);
  assert.equal(answer(run, false), false);
  simulate(run, .6, input);
  assert.ok(run.trail.some(p => p.style === 'wobble' && !p.ink));
  assert.ok(simulate(run, 4, input).includes('question'));
  assert.equal(run.wobble, 0);
  assert.equal(run.phase, 'question');
});

test('a right answer pushes the boss back, thickens the ink, and opens the final stretch', () => {
  const run = makeRun({ learning: true });
  const input = { drawing: true, target: .5 };
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

test('the same ink sample determines whether boosts, puddles, and drops matter', () => {
  const run = makeRun();
  run.objects.push({ x: 1, y: .5, type: 'wash', used: false }, { x: 3, y: .5, type: 'dot', used: false });
  assert.deepEqual(stepRun(run, .04, { drawing: true }), ['wash', 'dot']);
  assert.equal(run.dots, 1);
  assert.equal(run.nextQuestion, Infinity);
  assert.equal(resumeCaught(run), false);
});
