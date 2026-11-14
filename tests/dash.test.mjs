import test from 'node:test';
import assert from 'node:assert/strict';
import {
  R, TOP, SPEED, CHASE, JUMP_H, turnRate, endlessSpeed, onGarden, stepChase, chaseAfter, isCaught,
  jumpHeight, jumpTime, answerRow, dist, meters, readBest, saveBest
} from '../sidecars/dash/logic.mjs';
import { localQuestion, normalizeQuestion, LOCAL_ROUND } from '../sidecars/dash/quiz.mjs';

const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const q = (n) => normalizeQuestion({ prompt: 'p', choices: Array.from({ length: n }, (_, i) => ({ label: String(i), ok: i === 0 })) });

test('the top of the garden is where the buddy stands', () => {
  const top = onGarden(TOP);
  assert.ok(Math.abs(top.x) < 1e-9);
  assert.ok(Math.abs(top.y) < 1e-9);
  assert.ok(onGarden(0).x > R - 1e-9, 'angle 0 is the right edge');
  assert.ok(Math.abs(onGarden(TOP, 4).y - 4) < 1e-9);
});

test('endless speed follows the pen: a step at the start, +2 every 3 s, up to 48', () => {
  assert.equal(endlessSpeed(0), SPEED.start + SPEED.step);
  assert.equal(endlessSpeed(3), SPEED.start + SPEED.step * 2);
  assert.equal(endlessSpeed(10_000), SPEED.max);
  assert.ok(Math.abs(turnRate(10) - 0.3) < 1e-9);
});

test('the chaser creeps closer and catches a buddy who never grabs anything', () => {
  let chase = { pos: CHASE.start, target: CHASE.target };
  let caughtAt = -1;
  for (let i = 0; i < 60 * 120; i++) {
    chase = stepChase(chase, 1 / 60, CHASE.creep);
    if (isCaught(chase)) { caughtAt = i / 60; break; }
  }
  assert.ok(caughtAt > 5, `caught too soon: ${caughtAt}`);
  assert.ok(caughtAt < 120, 'caught in the end');
});

test('carrots and right answers push the chaser back; bumps and wrong answers bring it closer', () => {
  const c = { pos: 0.6, target: 0.62 };
  assert.ok(chaseAfter(c, 'carrot').target > c.target);
  assert.ok(chaseAfter(c, 'right').target > chaseAfter(c, 'carrot').target);
  assert.ok(chaseAfter(c, 'bump').target < c.target);
  assert.ok(chaseAfter(c, 'wrong').target < c.target);
  assert.ok(chaseAfter({ pos: 0.7, target: 0.72 }, 'right').target <= CHASE.far);
});

test('a jump rises to its height and lands', () => {
  assert.equal(jumpHeight(0), 0);
  assert.equal(jumpHeight(1), 0);
  assert.ok(Math.abs(jumpHeight(0.5) - JUMP_H) < 1e-9);
  assert.ok(jumpHeight(0.25) > 0 && jumpHeight(0.75) > 0);
  assert.ok(jumpTime(5) > jumpTime(20), 'jumps get quicker as the run speeds up');
  assert.ok(jumpTime(48) >= 0.4);
});

test('an answer row always has the right answer, no repeats, and leaves tried ones out', () => {
  for (let n = 2; n <= 5; n++) {
    for (let seed = 1; seed < 30; seed++) {
      const row = answerRow(q(n).choices, new Set(), seeded(seed));
      assert.equal(row.length, Math.min(3, n));
      assert.equal(row.filter(c => c.ok).length, 1);
      assert.equal(new Set(row.map(c => c.index)).size, row.length);
    }
  }
  const row = answerRow(q(3).choices, new Set([1, 2]), seeded(4));
  assert.deepEqual(row.map(c => c.index), [0]);
});

test('distance, meters, and best', () => {
  assert.equal(dist({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  const store = new Map();
  const storage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  assert.equal(meters(101), 50);
  assert.equal(saveBest(40, storage), 40);
  assert.equal(saveBest(10, storage), 40);
  assert.equal(readBest(storage), 40);
});

test('local questions are valid', () => {
  for (let i = 0; i < LOCAL_ROUND * 2; i++) assert.ok(normalizeQuestion(localQuestion(seeded(i + 1), i)));
});

import { to, update, killTweensOf, activeCount, Ease } from '../sidecars/dash/tween.mjs';

test('tweens reach their goal, wait out a delay, and call onComplete', () => {
  const o = { a: 0, b: 10 };
  let done = 0;
  to(o, 1, { a: 1 }, { ease: Ease.linear });
  to(o, 1, { b: 0 }, { ease: Ease.linear, delay: 0.5, onComplete: () => { done++; } });
  update(0.5);
  assert.ok(Math.abs(o.a - 0.5) < 1e-9);
  assert.equal(o.b, 10, 'still waiting');
  update(0.5);
  assert.equal(o.a, 1);
  assert.ok(Math.abs(o.b - 5) < 1e-9);
  update(1);
  assert.equal(o.b, 0);
  assert.equal(done, 1);
});

test('a yoyo blink closes and opens again; killTweensOf stops a tween', () => {
  const eye = { s: 1 };
  to(eye, 0.1, { s: 0 }, { ease: Ease.linear, yoyo: true, repeat: 1 });
  update(0.1);
  assert.ok(eye.s < 0.01);
  update(0.1);
  assert.equal(eye.s, 1);
  const o = { x: 0 };
  to(o, 1, { x: 5 });
  killTweensOf(o);
  update(1);
  assert.equal(o.x, 0);
  assert.equal(activeCount(), 0);
});
