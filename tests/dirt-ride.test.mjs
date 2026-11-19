import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const page = readFileSync(new URL('../sidecars/bike/index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../sidecars/bike/rampage.js', import.meta.url), 'utf8');

function mountRide(level = 1, reduced = false) {
  const labels = new Set();
  const stored = new Map();
  const events = {};
  let focused, frame;
  let now = 0;
  const noop = () => {};
  const ctx = new Proxy({
    fillText: text => labels.add(text),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
  }, { get: (obj, key) => obj[key] ?? noop });
  const els = Object.fromEntries([...page.matchAll(/<[\w-]+\s+[^>]*?\bid="([^"]+)"([^>]*)>/g)].map(([, id, attrs]) => [id, {
    hidden: /\bhidden\b/.test(attrs),
    style: {},
    getContext: () => ctx,
    setAttribute: noop,
    focus: () => { focused = id; },
    addEventListener(event, fn) { this[event] = fn; },
  }]));
  const window = { parent: { document: { body: { classList: { contains: () => false } } } } };
  runInNewContext(engine, {
    window, document: { getElementById: id => els[id] }, navigator: {},
    performance: { now: () => now },
    innerWidth: 1280, innerHeight: 720,
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: fn => { frame = fn; },
    addEventListener: (type, fn) => { events[type] = fn; },
    localStorage: { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) },
  });
  const bike = window.DirtRampage;
  bike.setDifficulty({ level, reduced });
  function tick() {
    labels.clear();
    frame(now += 1000 / 60);
  }
  function key(code, down) { events[down ? 'keydown' : 'keyup']({ code, preventDefault: noop }); }
  function until(done, maxFrames = 900) {
    for (let i = 0; i < maxFrames; i++) {
      tick();
      if (done()) return;
    }
    assert.fail('Ride did not reach the expected state');
  }
  function finish(distance) {
    bike.setProgress({ travel: distance - 120 });
    key('ArrowUp', true);
    until(() => !els.results.hidden);
    key('ArrowUp', false);
  }
  return { els, bike, labels, stored, key, tick, until, finish, focus: () => focused };
}

test('embedded dirt rides stop at the finish and let riders replay or advance', () => {
  const ride = mountRide();
  const { bike, els, labels, stored } = ride;
  ride.finish(3600);
  assert.equal(ride.focus(), 'ride-next');
  assert.equal(els['ride-next'].hidden, false);
  assert.equal(stored.get('dbr_unlocked'), '2');
  assert.ok(JSON.parse(stored.get('dbr_stars'))[0] > 0);
  const finish = bike.getProgress().travel;
  bike.setDifficulty({ level: 1 });
  ride.tick();
  assert.equal(els.results.hidden, false);
  assert.equal(bike.getProgress().travel, finish);

  els['ride-replay'].click();
  ride.tick();
  assert.equal(els.results.hidden, true);
  assert.equal(bike.getProgress().travel, 150);
  assert.ok(labels.has('SUNNY TRAILS'));

  ride.finish(3600);
  els['ride-next'].click();
  bike.setDifficulty({ level: 1 }); // A fresh question must not send the rider back to Sunny Trails.
  ride.tick();
  assert.equal(bike.getProgress().travel, 150);
  assert.ok(labels.has('DESERT DUNES'));
});

test('the final dirt ride offers replay and level select with no next level', () => {
  const ride = mountRide(3);
  ride.finish(5600);
  ride.els['ride-next'].click();
  ride.finish(6600);
  assert.equal(ride.els['ride-next'].hidden, true);
  assert.equal(ride.focus(), 'ride-replay');
  ride.els['ride-next'].click();
  assert.equal(ride.els.results.hidden, false);
  ride.els['ride-replay'].click();
  ride.tick();
  assert.ok(ride.labels.has('NIGHT RUN'));
  ride.finish(6600);
  ride.els['ride-select'].click();
  ride.tick();
  assert.ok(ride.labels.has('Select a level'));
});

test('a badly timed flip still crashes and respawns at the checkpoint', () => {
  const ride = mountRide(2);
  ride.bike.setProgress({ travel: 1300 });
  ride.key('ArrowUp', true);
  ride.key('ArrowLeft', true);
  let spin = 0;
  ride.until(() => {
    spin = Math.max(spin, Math.abs(ride.bike.status().spin));
    return ride.labels.has('CRASHED!');
  });
  assert.ok(spin > 1, 'the rider spun in the air before crashing');
  assert.ok(ride.labels.has('Back to the last checkpoint.'));
  assert.equal(ride.els.results.hidden, true);
  const crashAt = ride.bike.getProgress().travel;
  const checkpoint = Math.max(150, Math.floor(crashAt / 1200) * 1200);
  ride.key('ArrowUp', false);
  ride.key('ArrowLeft', false);
  ride.until(() => !ride.labels.has('CRASHED!'));
  assert.equal(ride.bike.getProgress().travel, checkpoint);
});
