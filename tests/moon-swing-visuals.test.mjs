import test from 'node:test';
import assert from 'node:assert/strict';
import { makeIceMotion, reflectionSize } from '../sidecars/moon-swing/motion.mjs';
import { makeRun } from '../sidecars/moon-swing/logic.mjs';

test('Moonlight Swing caps reflection buffers by quality without changing their aspect', () => {
  assert.deepEqual(reflectionSize(1200, 600, 'performance'), [300, 150]);
  assert.deepEqual(reflectionSize(400, 800, 'balanced'), [230, 460]);
  assert.deepEqual(reflectionSize(100, 100, 'performance'), [100, 100]);
  assert.deepEqual(reflectionSize(0, 0, 'cinematic'), [24, 24]);
});

test('skate marks and pickup spray are visual-only, bounded, and reset on a new game', () => {
  const run = makeRun();
  const effects = makeIceMotion();
  effects.frame(run);
  for (let i = 1; i <= 200; i++) {
    run.time = i * .05;
    run.p.x = Math.cos(i * .21);
    run.p.vx = 4;
    const before = JSON.stringify(run);
    const fx = effects.frame(run);
    assert.equal(JSON.stringify(run), before);
    assert.ok(fx.marks.length <= 68);
    assert.ok(fx.sparks.length <= 56);
  }
  assert.ok(effects.frame(run).marks.length);
  effects.burst(run, 'pickup');
  assert.ok(effects.frame(run).sparks.some(spark => spark.gold));
  run.time += 4;
  run.p.vx = 0;
  assert.deepEqual(effects.frame(run), { marks: [], sparks: [] });
  assert.deepEqual(effects.frame(makeRun()), { marks: [], sparks: [] });
});

test('reduced motion suppresses pickup particles', () => {
  const run = makeRun();
  const effects = makeIceMotion(true);
  effects.burst(run, 'pickup');
  assert.deepEqual(effects.frame(run).sparks, []);
});
