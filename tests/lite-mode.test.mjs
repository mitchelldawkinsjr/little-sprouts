import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// The decision code without a page: no document, so the script only sets up window.SproutsLite.
const sandbox = {};
vm.runInNewContext(readFileSync(new URL('../lib/lite-mode.js', import.meta.url), 'utf8'), { window: sandbox, globalThis: sandbox });
const lite = sandbox.SproutsLite;

test('lite mode starts from what the device reports', () => {
  assert.equal(lite.fromHints({ deviceMemory: 8, hardwareConcurrency: 8 }), 0);
  assert.equal(lite.fromHints({ deviceMemory: 4, hardwareConcurrency: 8 }), 0, 'a 4 GB laptop is fine');
  assert.equal(lite.fromHints({ deviceMemory: 4, hardwareConcurrency: 8, coarsePointer: true }), 1, 'a 4 GB tablet gets a little help');
  assert.equal(lite.fromHints({ deviceMemory: 2 }), 2);
  assert.equal(lite.fromHints({ hardwareConcurrency: 2 }), 2);
  assert.equal(lite.fromHints({ userAgent: 'Mozilla/5.0 (Linux; Android 9; KFTRWI) AppleWebKit/537.36 Silk/120' }), 2, 'Fire tablet');
  assert.equal(lite.fromHints({ saveData: true }), 1);
});

test('a forced level wins; otherwise the higher of the hint and what was learned', () => {
  assert.equal(lite.pick({ deviceMemory: 2 }, 0, 0), 0);
  assert.equal(lite.pick({ deviceMemory: 8 }, 3, null), 3);
  assert.equal(lite.pick({ deviceMemory: 2 }, 1, null), 2);
  assert.equal(lite.pick({}, 'junk', null), 0);
});

test('slow frames step the level up; lasting room steps it back down, never below the floor', () => {
  const slow = Array(90).fill(40);
  const fast = Array(90).fill(10);
  assert.deepEqual({ ...lite.judge(slow, 1, 0, 0) }, { step: 1, roomy: 0 });
  assert.equal(lite.judge(slow, 3, 0, 0).step, 0, 'already at the lowest');
  let roomy = 0;
  for (let i = 0; i < 5; i++) {
    const v = lite.judge(fast, 2, 0, roomy);
    assert.equal(v.step, 0);
    roomy = v.roomy;
  }
  assert.equal(lite.judge(fast, 2, 0, roomy).step, -1);
  assert.equal(lite.judge(fast, 1, 1, 5).step, 0, 'the device hint is the floor');
});
