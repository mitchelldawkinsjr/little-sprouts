import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { sidecarArcadeIds, sidecarGame } from '../lib/sidecar.js';
import { contextFor } from '../lib/speech-core.mjs';
import { inventory } from '../tools/static-files.mjs';
import { ARENA, MAPS, MODES, POWERS, R, ROUND_SECONDS, floorAt, givePower, makeRun, openGift, step } from '../sidecars/garden-tag/logic.mjs';

const DT = 1 / 120;
function simulate(run, seconds, inputs = () => []) {
  const events = [];
  for (let i = 0; i < Math.round(seconds / DT); i++) events.push(...step(run, DT, inputs(i)));
  return events;
}
function park(p, x, z, y = 0) {
  Object.assign(p, { x, z, y, vx: 0, vy: 0, vz: 0, ground: true });
}

test('a log blocks a buddy that walks into it, and a jump climbs onto it', () => {
  const run = makeRun(1, false, true);
  const p = run.players[0];
  const log = MAPS[0].boxes[2];
  park(p, log.x, log.z + log.d / 2 + 2);
  park(run.players[1], 10, -10);
  simulate(run, 1, () => [{ z: -1 }, {}]);
  assert.equal(p.y, 0);
  assert.ok(p.z >= log.z + log.d / 2 + R - 1e-9, 'stopped at the side of the log');
  // Keep pushing until it lands on top, then stop so it does not walk off the far side.
  simulate(run, 1, i => [{ z: p.ground && p.y > 0 ? 0 : -1, jump: i === 0 }, {}]);
  assert.equal(p.y, log.h);
  assert.ok(p.ground);
});

test('every gift box can be reached by climbing one step at a time or bouncing', () => {
  // One jump rises about 2.09; a mushroom about 4.5. Neighbours within 2 can be jumped between.
  const gap = (a, b) => Math.max(0, Math.abs(a.x - b.x) - (a.w + b.w) / 2, Math.abs(a.z - b.z) - (a.d + b.d) / 2);
  for (const map of MAPS) {
    const reached = new Set();
    let grew = true;
    while (grew) {
      grew = false;
      for (const b of map.boxes) {
        if (reached.has(b)) continue;
        const fromGround = b.h <= 1.9;
        const fromSpring = map.springs.some(s => gap(b, { x: s.x, z: s.z, w: 0, d: 0 }) <= 2 && b.h <= 4.2);
        const fromBox = [...reached].some(a => gap(a, b) <= 2 && b.h - a.h <= 1.9);
        if (fromGround || fromSpring || fromBox) { reached.add(b); grew = true; }
      }
    }
    for (const [x, z, top] of map.spots) {
      if (top === 0) continue;
      assert.ok([...reached].some(b => b.h === top && Math.abs(x - b.x) <= b.w / 2 && Math.abs(z - b.z) <= b.d / 2), `${map.name}: spot ${x},${z} at ${top}`);
    }
  }
});

test('the fence keeps buddies in the garden, and a mushroom bounces them up', () => {
  const run = makeRun(1, false, true);
  const p = run.players[0];
  park(p, ARENA - 1, ARENA - 1);
  simulate(run, 1, () => [{ x: 1, z: 1 }, {}]);
  assert.ok(p.x <= ARENA - R && p.z <= ARENA - R);
  const s = run.map.springs[0];
  park(p, s.x, s.z, .5);
  p.ground = false;
  const events = simulate(run, .4);
  assert.ok(events.some(e => e.type === 'bounce' && e.who === 0));
  assert.ok(p.y > 1.5);
  assert.equal(floorAt(run, 0, 0), 2);
  assert.equal(floorAt(run, 0, 0, 1.2), 1, 'a buddy below the top block stands on the lower one');
});

test('a tag passes the bee, freezes the new chaser, and cannot be tagged straight back', () => {
  const run = makeRun(1, false, true);
  run.cool = 0;
  park(run.players[0], 6, 10);
  park(run.players[1], 6.5, 10);
  const events = step(run, DT, []);
  assert.deepEqual(events.filter(e => e.type === 'tag'), [{ type: 'tag', it: 0 }]);
  assert.equal(run.it, 0);
  assert.ok(run.players[0].freeze > 0);
  assert.equal(simulate(run, .5).filter(e => e.type === 'tag').length, 0);
});

test('the bubble blocks one tag', () => {
  const run = makeRun(1, true, true);
  givePower(run, 0, 'shield');
  assert.equal(run.players[0].shield, POWERS.shield.seconds);
  run.cool = 0;
  park(run.players[1], run.players[0].x + .3, run.players[0].z);
  const events = step(run, DT, []);
  assert.equal(events[0]?.type, 'blocked');
  assert.equal(run.it, 1);
  assert.equal(run.players[0].shield, 0);
});

test('touching a gift box holds it for the question, then opens it once and brings it back later', () => {
  const run = makeRun(1, true, false);
  const g = run.gifts[1];
  const power = g.power;
  park(run.players[0], g.x, g.z, g.y);
  park(run.players[1], -11, -11);
  const events = step(run, DT, []);
  assert.deepEqual(events.filter(e => e.type === 'gift'), [{ type: 'gift', who: 0, power }]);
  assert.deepEqual(run.opening, { who: 0, power });
  assert.equal(simulate(run, .2).filter(e => e.type === 'gift').length, 0, 'an open box cannot be taken twice');
  assert.deepEqual(openGift(run), { who: 0, power });
  assert.equal(run.opening, null);
  assert.equal(openGift(run), null);
  assert.ok(g.back > 0);
  park(run.players[0], 11, 11);
  simulate(run, 7.5);
  assert.equal(g.back, 0, 'the box comes back');
});

test('the computer rival never opens gift boxes; a second player can', () => {
  for (const two of [false, true]) {
    const run = makeRun(1, false, two);
    const g = run.gifts[0];
    park(run.players[0], -11, 11);
    park(run.players[1], g.x, g.z, g.y);
    const got = step(run, DT, [{}, {}]).filter(e => e.type === 'gift');
    assert.deepEqual(got.map(e => e.who), two ? [1] : []);
  }
});

test('each power does its job', () => {
  const run = makeRun(1, false, true);
  const [me, other] = run.players;
  givePower(run, 0, 'speed');
  assert.ok(me.boost > 0);
  givePower(run, 0, 'freeze');
  assert.equal(other.freeze, POWERS.freeze.seconds);
  park(other, 5, 5);
  simulate(run, 1, () => [{}, { x: 1 }]);
  assert.equal(other.x, 5, 'a frozen buddy cannot move');

  // Super jump goes much higher than a plain jump.
  const peak = jump => {
    const r = makeRun(1, false, true);
    park(r.players[0], -11, 11);
    if (jump) givePower(r, 0, 'jump');
    let top = 0;
    for (let i = 0; i < 120; i++) { step(r, DT, [{ jump: i === 0 }, {}]); top = Math.max(top, r.players[0].y); }
    return top;
  };
  assert.ok(peak(true) > peak(false) * 1.8, `${peak(true)} vs ${peak(false)}`);

  // Bee magnet: holding the bee, it flies to the other buddy. Running, the chaser slows down.
  const bee = makeRun(1, false, true);
  bee.it = 0;
  givePower(bee, 0, 'bee');
  assert.equal(bee.it, 1);
  assert.ok(bee.players[1].freeze > 0);
  const slow = makeRun(1, false, true);
  givePower(slow, 0, 'bee');
  assert.equal(slow.it, 1);
  assert.ok(slow.players[1].slow > 0);
});

test('a round ends when the clock runs out; whoever is not it gets away', () => {
  const run = makeRun(1, false, true);
  const events = simulate(run, ROUND_SECONDS + .1);
  assert.deepEqual(events.find(e => e.type === 'end'), { type: 'end', winner: 0 });
  assert.ok(run.done);
  assert.deepEqual(step(run, DT, []), []);
});

test('the rival buddy catches a learner who stands still, faster on harder gardens', () => {
  const times = MODES.map((_, i) => {
    const run = makeRun(i + 1, false, false, 7);
    let t = 0;
    while (run.it === 1 && t < 40) { step(run, DT, []); t += DT; }
    assert.equal(run.it, 0, `mode ${i + 1} rival never tagged`);
    return t;
  });
  assert.ok(times[2] < times[0], times.join(' / '));
});

test('the shelf, controller map, speech, and offline bundle include Garden tag', () => {
  const spec = sidecarGame('garden-tag');
  assert.equal(spec.shelf, 'run-jump-dodge');
  assert.equal(spec.banks, true, 'stars bank with each gift question, as in Canyon Pods');
  assert.ok(sidecarArcadeIds().includes(spec.id));
  assert.equal(spec.pad.keys.a, 'Space');
  assert.equal(contextFor(spec.id), 'gameHost');
  const root = new URL('../', import.meta.url);
  const built = inventory(fileURLToPath(root));
  assert.ok(built.sidecars().includes('sidecars/garden-tag/index.html'));
  const files = built.offline();
  for (const path of ['index.html', 'tag.css', 'game.mjs', 'logic.mjs', 'view.mjs']) {
    assert.ok(files['./sidecars/garden-tag/' + path], path);
  }
  assert.ok(files['./vendor/three/build/three.module.js']);
  const docker = readFileSync(new URL('Dockerfile', root), 'utf8');
  assert.match(docker, /COPY sidecars\/garden-tag /);
});
