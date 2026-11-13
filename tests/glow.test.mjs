import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeLevel, solids, stepBall, simulateDrop, pocketUnder, extendStroke, strokeLength,
  pickAnswerPocket, newBall, worldWidth, inkFor, H, BALL_R, POCKET_DEPTH
} from '../sidecars/glow/logic.mjs';
import { localQuestion, normalizeQuestion } from '../sidecars/glow/quiz.mjs';

test('Light lines: boards have one pocket per answer and a clear drop lamp', () => {
  for (let seed = 1; seed <= 150; seed++) {
    for (const count of [2, 3, 4, 5]) {
      const W = worldWidth([0.62, 1, 1.6, 2.2][seed % 4]);
      const level = makeLevel(seed, count, seed % 6, W);
      assert.equal(level.pockets.length, count);
      assert.ok(level.dropper.x > 0 && level.dropper.x < W);
      for (const s of level.walls) {
        if (s.rim) continue;
        const near = Math.hypot(s.ax - level.dropper.x, s.ay - level.dropper.y) < BALL_R + s.r;
        assert.ok(!near, 'nothing sits on the lamp');
      }
      const answer = pickAnswerPocket(level, () => 0.5);
      assert.notEqual(answer, level.freeFall, 'dropping without drawing never lands on the answer');
    }
  }
});

test('Light lines: the ball stays inside the board whatever is drawn', () => {
  const W = worldWidth(1.5);
  const level = makeLevel(9, 3, 4, W);
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let round = 0; round < 30; round++) {
    const strokes = [];
    for (let k = 0; k < 4; k++) {
      const s = { kind: ['plain', 'boost', 'bouncy', 'slow'][k], pts: [] };
      let x = rnd() * W;
      let y = 15 + rnd() * 60;
      for (let i = 0; i < 20; i++) { x += (rnd() - 0.3) * 4; y += (rnd() - 0.5) * 3; extendStroke(s, x, y, 999, W); }
      strokes.push(s);
    }
    const list = solids(level, strokes);
    const ball = newBall(level);
    for (let i = 0; i < 900; i++) {
      stepBall(ball, list, 1 / 60);
      assert.ok(ball.x > 0 && ball.x < W && ball.y > 0 && ball.y < H, 'inside the rim');
    }
  }
});

test('Light lines: a ramp under the lamp sends the ball to the side', () => {
  const W = 120;
  const level = makeLevel(5, 2, 0, W);
  level.walls = level.walls.filter(s => s.rim || s.divider);
  level.dropper = { x: 30, y: 9 };
  assert.equal(simulateDrop(level, []).pocket, 0, 'straight down lands left');
  const ramp = { kind: 'plain', pts: [{ x: 20, y: 30 }, { x: 100, y: 55 }] };
  assert.equal(simulateDrop(level, [ramp]).pocket, 1, 'the ramp rolls it right');
});

test('Light lines: each ink changes the ride', () => {
  const W = 120;
  const flat = (kind) => ({ kind, pts: [{ x: 10, y: 50 }, { x: 110, y: 50 }] });
  const run = (kind, frames) => {
    const level = makeLevel(5, 2, 0, W);
    level.walls = level.walls.filter(s => s.rim);
    const ball = { x: 20, y: 50 - BALL_R - 1.0, vx: 30, vy: 0 };
    const list = solids(level, [flat(kind)]);
    let top = ball.y;
    for (let i = 0; i < frames; i++) { stepBall(ball, list, 1 / 60); top = Math.min(top, ball.y); }
    return { ball, top };
  };
  const plain = run('plain', 40).ball.x;
  assert.ok(run('boost', 40).ball.x > plain + 5, 'green speeds the ball up');
  assert.ok(run('slow', 40).ball.x < plain - 5, 'yellow slows it down');

  const drop = (kind) => {
    const level = makeLevel(5, 2, 0, W);
    level.walls = level.walls.filter(s => s.rim);
    const ball = { x: 60, y: 20, vx: 0, vy: 0 };
    const list = solids(level, [flat(kind)]);
    let landed = false;
    let top = Infinity;
    for (let i = 0; i < 150; i++) {
      stepBall(ball, list, 1 / 60);
      if (ball.y > 45) landed = true;
      if (landed) top = Math.min(top, ball.y);
    }
    return top;
  };
  assert.ok(drop('bouncy') < drop('plain') - 10, 'blue bounces much higher');
});

test('Light lines: red lines are hazards', () => {
  const level = makeLevel(5, 2, 0, 120);
  level.walls = level.walls.filter(s => s.rim || s.divider);
  level.dropper = { x: 30, y: 9 };
  level.walls.push({ ax: 20, ay: 40, bx: 40, by: 40, r: 1.1, kind: 'hazard' });
  assert.equal(simulateDrop(level, []).hazard, true);
});

test('Light lines: ink runs out and a closed pocket stops catching', () => {
  const s = { kind: 'plain', pts: [] };
  let ink = 10;
  extendStroke(s, 0, 50, ink, 100);
  for (let x = 2; x < 40; x += 2) ink -= extendStroke(s, x, 50, ink, 100);
  assert.ok(Math.abs(strokeLength(s) - 10) < 1e-6);
  assert.ok(ink <= 1e-9);
  assert.ok(inkFor(100) > 100);

  const level = makeLevel(2, 3, 0, 120);
  const ball = { x: level.pockets[1].cx, y: H - POCKET_DEPTH / 2 };
  assert.equal(pocketUnder(ball, level).index, 1);
  level.closed.add(1);
  assert.equal(pocketUnder(ball, level), null);
});

test('Light lines: local questions have one right answer the host format accepts', () => {
  for (let i = 0; i < 40; i++) {
    const q = normalizeQuestion(localQuestion(Math.random, i));
    assert.ok(q);
    assert.equal(q.choices.filter(c => c.ok).length, 1);
    assert.ok(/Light the way/.test(q.prompt));
  }
});
