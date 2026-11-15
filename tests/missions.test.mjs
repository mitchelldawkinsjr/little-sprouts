import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonMission, lessonResult, sidecarGame, sidecarIsLesson } from '../lib/sidecar.js';
import { buttonEdges, keyName, lookDelta, moveKeys } from '../lib/pad-core.mjs';
import { makePaintMission, makeStationMission, makeFishingMission, nextDeparture } from '../sidecars/station-scout/lessons/rules.mjs';
import { readMe } from '../sidecars/station-scout/lessons/friends.mjs';
import { CATS, errandList, pickErrand } from '../sidecars/station-scout/lessons/errands.mjs';
import { assignTags } from '../sidecars/sky-deliveries/sprouts-sky.mjs';

test('mission games are marked, and the banking games ask in their own play', () => {
  assert.equal(sidecarIsLesson('station'), false);
  assert.equal(sidecarIsLesson('deliveries'), false);
  assert.equal(sidecarIsLesson('inkwave'), false);
  for (const id of ['cabin', 'inkwave', 'fishing', 'station', 'deliveries']) assert.equal(sidecarGame(id).banks, true, id);
  assert.equal(sidecarGame('fishing').needs, 'webgpu');
});

test('a saved mission is worth 3 to 5 stars, with first tries shared out', () => {
  assert.deepEqual(lessonResult('lesson:1:1', 0), { stars: 3, firstRight: 3 });
  assert.deepEqual(lessonResult('lesson:2:1', 2), { stars: 5, firstRight: 3 });
  assert.deepEqual(lessonResult('lesson:1:0', 1), { stars: 4, firstRight: 0 });
  assert.equal(lessonResult('crash'), null);
  assert.equal(lessonResult('lesson:x:1'), null);
});

test('the mission follows the game level, or else the grade and overall level', () => {
  assert.equal(lessonMission('grade3', 2, 1), 0);
  assert.equal(lessonMission('preschool', 3, 3), 2);
  assert.equal(lessonMission('kindergarten', 2), 0);
  assert.equal(lessonMission('grade1', 2), 1);
  assert.equal(lessonMission('grade4', 1), 1);
  assert.equal(lessonMission('grade4', 3), 2);
  assert.equal(lessonMission('preschool', 1), 0);
});

test('generated paint plans always have an answer that fits the court', () => {
  for (let level = 0; level < 3; level++) {
    for (let i = 0; i < 200; i++) {
      const m = makePaintMission(level);
      const n = m.columns * m.rows;
      assert.ok(Number.isInteger(m.target) && m.target > 0 && m.target < n, JSON.stringify(m));
      assert.ok(m.pre >= 0 && m.pre < m.target, JSON.stringify(m));
      assert.match(m.goal, /\w/);
    }
  }
});

test('a generated timetable has one next train to the town in the clue', () => {
  for (let i = 0; i < 200; i++) {
    const m = makeStationMission(2);
    const [step] = m.steps;
    const now = +step.clue.match(/It is (\d+):(\d+)/).slice(1).reduce((h, mm) => h * 60 + +mm);
    const town = step.clue.match(/next train to (\w+)/)[1];
    assert.equal(nextDeparture(town, now, m.departures), step.aim);
    assert.equal(new Set(m.departures.map(d => d.id)).size, 3);
  }
  assert.equal(makeStationMission(1).steps.length, 2);
  assert.ok(['circle', 'triangle', 'square'].includes(makeStationMission(0).steps[0].aim));
});

test('a fishing trip asks for a mark the pier has', () => {
  for (let i = 0; i < 50; i++) {
    const trip = makeFishingMission();
    assert.ok(trip.samples.pier.some(f => f.marks === trip.want));
    assert.equal(trip.samples.reef.length, 3);
  }
});

test('controller maps: movement keys, mapped buttons, and right-stick look', () => {
  assert.deepEqual(moveKeys({ x: -1, y: 0 }, 'wasd').filter(k => k[2]).map(k => k[0]), ['KeyA']);
  assert.deepEqual(moveKeys({ x: 0, y: -1 }).filter(k => k[2]).map(k => k[0]), ['ArrowUp']);
  assert.equal(keyName('KeyE'), 'e');
  assert.equal(keyName('Space'), ' ');
  const was = {};
  assert.deepEqual(buttonEdges({ a: 1, x: 0 }, { a: 'KeyE', x: 'Space' }, was), [{ button: 'a', code: 'KeyE', down: true }]);
  assert.deepEqual(buttonEdges({ a: 1, x: 0 }, { a: 'KeyE', x: 'Space' }, was), []);
  assert.deepEqual(buttonEdges({ a: 0, x: 1 }, { a: 'KeyE', x: 'Space' }, was), [{ button: 'a', code: 'KeyE', down: false }, { button: 'x', code: 'Space', down: true }]);
  assert.deepEqual(lookDelta({ rx: 0.1, ry: 0 }, 0.016), { dx: 0, dy: 0 });
  const full = lookDelta({ rx: 1, ry: -1 }, 0.1);
  assert.ok(full.dx > 40 && full.dy < -40);
});

test('a friend position is checked and kept inside the town', () => {
  assert.deepEqual(readMe({ p: [3, -4], yaw: 1, run: 2 }), { x: 3, z: -4, yaw: 1, run: 1 });
  assert.equal(readMe({ p: ['a', 1] }), null);
  assert.equal(readMe({}), null);
  assert.equal(readMe({ p: [9999, 0] }).x, 400);
});

test('town errands: every errand has a shop and a person, and the next one is a good walk away', () => {
  const list = errandList();
  assert.ok(list.length >= 5);
  for (const e of list) {
    assert.ok(e.shop && e.shop.name && Number.isFinite(e.shop.x) && Number.isFinite(e.shop.z), e.who);
    assert.ok(Number.isFinite(e.x) && Number.isFinite(e.z) && e.item && e.icon, e.who);
  }
  const at = { x: 8, z: -11 };
  for (let i = 0; i < 100; i++) {
    const e = pickErrand(list, new Set(), at);
    assert.ok(Math.hypot(e.shop.x - at.x, e.shop.z - at.z) > 15, e.who);
  }
  const done = new Set(list.slice(1).map(e => e.who));
  assert.equal(pickErrand(list, done, { x: 0, z: 200 }).who, list[0].who);
  assert.equal(CATS.length, 3);
});

test('Cloudkeep answer catch: each answer rides the nearest free creature, and lost ones are replaced', () => {
  const at = (id, x, mode = 'roam') => ({ id, mode, pos: { x, y: 0, z: 0 } });
  const ship = { x: 0, y: 0, z: 0 };
  const tags = assignTags([at(1, 50), at(2, 5), at(3, 20), at(4, 200)], ship, new Map(), 3);
  assert.deepEqual([...tags].sort((a, b) => a[1] - b[1]), [[2, 0], [3, 1], [1, 2]]);
  // Creature 3 was caught: its answer moves to the next free one.
  assignTags([at(1, 50), at(2, 5), at(4, 200)], ship, tags, 3);
  assert.equal([...tags].find(([, i]) => i === 1)[0], 4);
  // A creature being reeled in is not given a new answer.
  const t2 = assignTags([at(5, 3, 'capturing'), at(6, 9)], ship, new Map(), 1);
  assert.deepEqual([...t2], [[6, 0]]);
});
