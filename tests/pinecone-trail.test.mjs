import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { sidecarGame, sidecarArcadeIds } from '../lib/sidecar.js';
import {
  arcadeBest, FIRST_GATE, GATE_GAP, LANE_WIDTH, makeRow, makeRun, MAX_HEARTS,
  reward, SHIELD_TIME, speedAt, steer, jump, stepRun
} from '../sidecars/pinecone-trail/logic.mjs';

function seeded(seed) {
  return () => ((seed = seed * 16807 % 2147483647) / 2147483647);
}

test('Pinecone Trail ships under Run, Jump & Dodge with Arcade play, rewards, and the shared controller map', () => {
  const game = sidecarGame('pinecone-trail');
  assert.equal(game.shelf, 'run-jump-dodge');
  assert.ok(game.banks);
  assert.ok(sidecarArcadeIds().includes(game.id));
  assert.equal(game.pad.keys.a, 'Space');
  assert.equal(game.pad.keys.start, 'KeyP');
  assert.ok(statSync(new URL('../' + game.src.split('?')[0], import.meta.url)).isFile());
  const docker = readFileSync(new URL('../Dockerfile', import.meta.url), 'utf8');
  const warm = readFileSync(new URL('../lib/offline-warm.mjs', import.meta.url), 'utf8');
  assert.match(docker, /COPY sidecars\/pinecone-trail /);
  for (const path of ['index.html', 'trail.css', 'game.mjs', 'logic.mjs', 'world.mjs']) {
    assert.ok(warm.includes('./sidecars/pinecone-trail/' + path), path);
  }
});

test('long runs always leave a reachable safe lane and never block all three lanes', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const rng = seeded(seed);
    let previous = 0;
    for (let distance = 18; distance < 1200; distance += 11) {
      const { safe, obstacles } = makeRow(distance, previous, rng);
      assert.ok(Math.abs(safe - previous) <= 1);
      assert.ok(obstacles.every(o => o.lane !== safe));
      assert.equal(new Set(obstacles.map(o => o.lane)).size, obstacles.length);
      previous = safe;
    }
  }
});

test('steering clamps to three lanes and a jump rises and lands', () => {
  const run = makeRun();
  steer(run, -1);
  steer(run, -1);
  assert.equal(run.lane, -1);
  jump(run);
  for (let i = 0; i < 24; i++) stepRun(run, 1 / 60);
  assert.equal(run.x, -LANE_WIDTH);
  assert.ok(run.height > 1);
  jump(run);
  for (let i = 0; i < 36; i++) stepRun(run, 1 / 60);
  assert.equal(run.height, 0);
});

test('checkpoints freeze the run until the correct answer rewards it', () => {
  const run = makeRun({ learning: true });
  run.hearts = 1;
  run.distance = FIRST_GATE - 0.04;
  assert.deepEqual(stepRun(run, 1 / 60), ['question']);
  assert.equal(run.phase, 'question');
  assert.equal(run.distance, FIRST_GATE);
  assert.deepEqual(stepRun(run, 0.1), []);
  assert.equal(run.seeds, 0);
  assert.ok(reward(run));
  assert.equal(run.shield, SHIELD_TIME);
  assert.equal(run.hearts, 2);
  assert.equal(run.nextGate, FIRST_GATE + GATE_GAP);
  assert.equal(run.seeds, 1);
  assert.equal(reward(run), false, 'the same reward cannot be applied twice');
});

test('the final checkpoint sets up a shielded finish instead of another question', () => {
  const run = makeRun({ learning: true });
  run.distance = FIRST_GATE;
  run.hearts = MAX_HEARTS;
  run.phase = 'question';
  assert.ok(reward(run, true));
  assert.equal(run.hearts, MAX_HEARTS);
  assert.equal(run.nextGate, Infinity);
  run.distance = run.finishAt - 0.04;
  assert.deepEqual(stepRun(run, 1 / 60), ['finish']);
  assert.equal(run.phase, 'finished');
  assert.deepEqual(stepRun(run, 1 / 60), []);
});

test('logs can be jumped, tall pines cost a heart, and a shield blocks collisions', () => {
  const run = makeRun();
  const testObstacle = (kind, lane = 0) => {
    run.rows.push({ at: run.distance + 0.1, obstacles: [{ lane, kind, hit: false }] });
    return stepRun(run, 1 / 60);
  };
  run.height = 0.95;
  assert.deepEqual(testObstacle('log'), []);
  assert.deepEqual(testObstacle('pine', 1), []);
  assert.deepEqual(testObstacle('pine'), ['bump']);
  assert.equal(run.hearts, 2);
  assert.deepEqual(testObstacle('pine'), [], 'brief grace keeps one mistake from taking multiple hearts');
  run.grace = 0;
  run.shield = SHIELD_TIME;
  assert.deepEqual(testObstacle('pine'), ['shield']);
  assert.equal(run.hearts, 2);
  run.grace = run.shield = 0;
  run.hearts = 1;
  assert.deepEqual(testObstacle('pine'), ['bump', 'over']);
  assert.equal(run.phase, 'over');
});

test('Arcade play never receives checkpoints or rewards, and only improves its own saved best', () => {
  const run = makeRun();
  assert.equal(run.nextGate, Infinity);
  assert.equal(reward(run), false);
  assert.ok(speedAt(200) > speedAt(0));
  assert.ok(speedAt(5000) <= 11);
  const map = new Map();
  const store = { getItem: k => map.get(k), setItem: (k, v) => map.set(k, v) };
  assert.equal(arcadeBest(83.9, store), 83);
  assert.equal(arcadeBest(40, store), 83);
  assert.equal(arcadeBest(104, store), 104);
  assert.deepEqual([...map.keys()], ['sprouts-pinecone-trail-best-v1']);
});

test('the host retries wrong checkpoint answers and banks a completed learning set only once', async () => {
  const { registerRound } = await import('../app/round.mjs');
  const { blankLearner } = await import('../logic/profiles.mjs');
  const learner = blankLearner('Trail player', 'bunny');
  const g = {
    mode: 'pinecone-trail', key: 'tap:1', index: 0, firstCorrect: 0,
    done: false, finished: false, missed: false, prompt: 'Which one is the circle?',
    tokens: [{ label: 'circle', ok: true, shape: 'circle' }, { label: 'square', ok: false, shape: 'square' }]
  };
  const lines = [];
  let saves = 0;
  const rt = {
    game: g, data: { active: 0, sound: false, profiles: [learner] }, p: () => learner,
    questionCount: () => 5, save() { saves++; }, say: line => lines.push(line)
  };
  registerRound(rt);
  rt.question = () => { g.done = g.missed = false; };
  const oldDoc = globalThis.document;
  const oldMatch = globalThis.matchMedia;
  globalThis.document = { querySelector: () => null };
  globalThis.matchMedia = () => ({ matches: false });
  try {
    const ask = rt.rallyMessage(g);
    assert.equal(ask.buddy, 'bunny');
    assert.equal(ask.total, 5);
    assert.equal(ask.choices[0].shape, 'circle');
    rt.gradeRally(1);
    assert.ok(g.missed);
    assert.equal(g.done, false);
    assert.equal(g.index, 0);
    assert.equal(learner.stars, 0);
    for (let i = 0; i < 5; i++) rt.gradeRally(0);
    assert.equal(learner.stars, 5);
    assert.equal(learner.correct, 4);
    assert.equal(saves, 1);
    assert.equal(rt.bankCabin(g), 0, 'finishing after the last checkpoint cannot bank again');
    assert.equal(learner.stars, 5);
    assert.ok(lines.some(line => line.includes('trail shield')));
  } finally {
    if (oldDoc === undefined) delete globalThis.document;
    else globalThis.document = oldDoc;
    if (oldMatch === undefined) delete globalThis.matchMedia;
    else globalThis.matchMedia = oldMatch;
  }
});
