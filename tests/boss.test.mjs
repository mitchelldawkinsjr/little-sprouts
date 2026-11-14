import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BAND, GAP, SPEED, swimSpeed, bossSpeed, throttleAt, speedNow, creepRate, stepGap, gapAfter, isCaught, swimToward,
  touching, columnYs, answerColumn, bossAim, trimTrail, meters,
  PARTS, PART_NAMES, PRESETS, BOSS_EMOJI, DEFAULT_BOSS, normalizeBoss, cyclePart, randomBoss, bossName, readBoss, saveBoss, readBest, saveBest
} from '../sidecars/boss/logic.mjs';
import { localQuestion, normalizeQuestion, LOCAL_ROUND } from '../sidecars/boss/quiz.mjs';

const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const memory = () => {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
};

test('further right swims faster, as in the fish pen', () => {
  assert.equal(swimSpeed(0), SPEED.min);
  assert.equal(swimSpeed(1), SPEED.max);
  assert.ok(swimSpeed(0.5) > swimSpeed(0.2));
  assert.equal(throttleAt(0), 0);
  assert.equal(throttleAt(1), 1);
  assert.ok(Math.abs(throttleAt(0.5) - 0.5) < 1e-9);
});

test('endless raises the top speed, and the boss speeds up too', () => {
  assert.ok(swimSpeed(1, 60, true) > swimSpeed(1, 0, true));
  assert.equal(swimSpeed(1, 1e5, true), SPEED.maxEndless);
  assert.equal(bossSpeed(500, false), bossSpeed(0, false));
  assert.ok(bossSpeed(60, true) > bossSpeed(0, true));
});

test('swimming faster than the boss pulls away; slower lets it close in', () => {
  const fast = stepGap(5, 1, 0, { speed: 11, boss: 7.5 });
  const slow = stepGap(5, 1, 0, { speed: 4, boss: 7.5 });
  assert.ok(fast > 5 && slow < 5);
});

test('full speed in Play just about holds the boss off; in long Endless it does not', () => {
  const run = (endless, seconds) => {
    let gap = GAP.start;
    for (let t = 0; t < seconds; t += 1 / 30) gap = stepGap(gap, 1 / 30, creepRate(t, endless), { speed: swimSpeed(1, t, endless), boss: bossSpeed(t, endless) });
    return gap;
  };
  assert.ok(run(false, 60) > GAP.start - 1);
  assert.ok(isCaught(run(true, 300)));
});

test('answers on the way hold the speed down so they can be read; boost and slow stack', () => {
  assert.equal(speedNow(11, { reading: true }), SPEED.read);
  assert.equal(speedNow(5, { reading: true }), 5);
  assert.equal(speedNow(6, { boosting: true }), 6 + SPEED.boost);
  assert.ok(speedNow(6, { slowed: true }) < 6);
});

test('the boss catches a buddy who does nothing, sooner in endless', () => {
  const timeToCatch = (endless) => {
    let gap = GAP.start;
    for (let t = 0; t < 600; t += 1 / 60) {
      gap = stepGap(gap, 1 / 60, creepRate(t, endless), { speed: swimSpeed(SPEED.cruise, t, endless), boss: bossSpeed(t, endless) });
      if (isCaught(gap)) return t;
    }
    return Infinity;
  };
  const play = timeToCatch(false);
  const endless = timeToCatch(true);
  assert.ok(Number.isFinite(play));
  assert.ok(endless < play, `endless ${endless} < play ${play}`);
});

test('a fresh question gives a calm moment', () => {
  assert.ok(stepGap(5, 1, 0.2, { calm: true }) > stepGap(5, 1, 0.2));
});

test('a bigger boss creeps a little slower', () => {
  assert.ok(creepRate(0, false, 3) < creepRate(0, false, 1));
});

test('right answers, shells, and boss crashes push it back; wrong answers and bumps let it closer', () => {
  assert.ok(gapAfter(5, 'right') > 5);
  assert.ok(gapAfter(5, 'shell') > 5);
  assert.ok(gapAfter(5, 'crash') > 5);
  assert.ok(gapAfter(5, 'wrong') < 5);
  assert.ok(gapAfter(5, 'bump') < 5);
  assert.equal(gapAfter(GAP.max, 'right'), GAP.max);
});

test('a wrong answer or a bump never makes the catch by itself', () => {
  assert.ok(!isCaught(gapAfter(1.5, 'wrong')));
  assert.ok(!isCaught(gapAfter(1.1, 'bump')));
  // Already nearly caught stays where it was rather than jumping back.
  assert.equal(gapAfter(0.8, 'wrong'), 0.8);
});

test('the buddy swims toward the finger and stays in the open water', () => {
  let y = 0;
  for (let i = 0; i < 120; i++) y = swimToward(y, 100, 1 / 60);
  assert.ok(Math.abs(y - BAND.top) < 0.01);
  y = 0;
  y = swimToward(y, 2, 1 / 60);
  assert.ok(y > 0 && y < 2);
});

test('touching is two circles overlapping', () => {
  assert.ok(touching({ x: 0, y: 0 }, { x: 1.5, y: 0 }, 0.8, 0.8));
  assert.ok(!touching({ x: 0, y: 0 }, { x: 2, y: 0 }, 0.8, 0.8));
});

test('answer columns sit centered in the open water', () => {
  for (const n of [2, 3, 4]) {
    const ys = columnYs(n);
    assert.equal(ys.length, n);
    assert.ok(Math.abs(ys.reduce((a, b) => a + b, 0)) < 1e-9);
    assert.ok(Math.max(...ys) <= BAND.top && Math.min(...ys) >= BAND.bottom);
  }
});

test('a column always has the right answer and leaves out ones already tried', () => {
  const q = normalizeQuestion({ prompt: 'p', choices: Array.from({ length: 5 }, (_, i) => ({ label: String(i), ok: i === 2 })) });
  const tried = new Set([0, 1]);
  for (let s = 1; s < 20; s++) {
    const col = answerColumn(q.choices, tried, seeded(s));
    assert.ok(col.some(c => c.ok));
    assert.ok(col.length <= 3);
    assert.ok(!col.some(c => tried.has(c.index)));
  }
});

test('the boss follows the buddy\'s path, late', () => {
  const trail = [];
  for (let t = 0; t <= 4; t += 0.1) trail.push({ t, y: t < 2 ? 0 : 4 });
  assert.equal(bossAim(trail, 4, 0.5), 4);
  assert.equal(bossAim(trail, 2.4, 1), 0);
  assert.equal(bossAim([], 1, 1), 0);
  trimTrail(trail, 4, 1);
  assert.ok(trail[0].t >= 2.9 && trail[0].t < 3.1);
});

test('meters are half the distance', () => {
  assert.equal(meters(101), 50);
});

test('every boss part has a name, and the default is a real choice', () => {
  for (const [key, list] of Object.entries(PARTS)) {
    for (const v of list) assert.ok(PART_NAMES[key][v], `${key} ${v}`);
    assert.ok(list.includes(DEFAULT_BOSS[key]));
  }
});

test('a broken saved boss falls back part by part', () => {
  const b = normalizeBoss({ head: 'spider', body: 'dragon', eyes: '4', size: 9 });
  assert.equal(b.head, 'spider');
  assert.equal(b.body, DEFAULT_BOSS.body);
  assert.equal(b.eyes, 4);
  assert.equal(b.size, DEFAULT_BOSS.size);
  assert.deepEqual(normalizeBoss(null), DEFAULT_BOSS);
});

test('cycling a part goes round both ways', () => {
  let b = { ...DEFAULT_BOSS };
  for (let i = 0; i < PARTS.color.length; i++) b = cyclePart(b, 'color', 1);
  assert.equal(b.color, DEFAULT_BOSS.color);
  assert.equal(cyclePart(DEFAULT_BOSS, 'head', -1).head, PARTS.head[PARTS.head.length - 1]);
  assert.equal(cyclePart(DEFAULT_BOSS, 'head', 1).head, 'spider');
});

test('every ready-made boss is a real boss with a picture', () => {
  for (const kind of PARTS.head) {
    assert.ok(PRESETS[kind], kind);
    assert.deepEqual(normalizeBoss(PRESETS[kind]), PRESETS[kind]);
    assert.equal(PRESETS[kind].head, kind);
    assert.ok(BOSS_EMOJI[kind]);
  }
  assert.equal(bossName(PRESETS.octopus), 'Inky Blob');
  assert.equal(bossName(PRESETS.shark), 'Bitey Finn');
});

test('a random boss is always a valid boss, and the name comes from head and body', () => {
  const rnd = seeded(7);
  for (let i = 0; i < 30; i++) {
    const b = randomBoss(rnd);
    assert.deepEqual(normalizeBoss(b), b);
  }
  assert.equal(bossName({ head: 'spider', body: 'long' }), 'Fangy Noodle');
  assert.equal(bossName(DEFAULT_BOSS), 'Chompy Wiggles');
});

test('the boss and the best distance are kept in this browser', () => {
  const store = memory();
  assert.equal(readBoss(store), null);
  saveBoss({ ...DEFAULT_BOSS, color: 'blue' }, store);
  assert.equal(readBoss(store).color, 'blue');
  assert.equal(readBest(store), 0);
  assert.equal(saveBest(40, store), 40);
  assert.equal(saveBest(10, store), 40);
  assert.equal(readBoss({ getItem: () => { throw new Error('blocked'); } }), null);
});

test('local questions say swim, and take turns', () => {
  const rnd = seeded(3);
  for (let i = 0; i < 8; i++) {
    const q = normalizeQuestion(localQuestion(rnd, i));
    assert.ok(q, `question ${i}`);
    assert.ok(/Swim/.test(q.prompt));
  }
  assert.equal(LOCAL_ROUND, 5);
});
