import assert from 'node:assert/strict';
import test from 'node:test';
import { makeFriendRace, packPose, readPose, roomCode } from '../sidecars/canyon-pods/friends.mjs';
import { makeRace, position, RACE, WIDTH } from '../sidecars/canyon-pods/logic.mjs';

function racer(wifi = true) {
  let facade, closed, usedWifi;
  const sent = [], updates = [], begins = [], poses = [], losses = [];
  const session = makeFriendRace({
    open(target, local) {
      facade = target;
      usedWifi = local;
      return {
        send(data) { sent.push(JSON.parse(data)); },
        close() { closed = true; facade.dispatchEvent(new Event('close')); },
      };
    },
    update(r) { updates.push(r); },
    start(role) { begins.push(role); },
    pose(pose) { poses.push(pose); },
    lost(message) { losses.push(message); },
  });
  return {
    session, sent, updates, begins, poses, losses,
    get closed() { return closed; },
    message(data) { facade.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) })); },
    connect(role) {
      if (role === 'host') session.host(wifi);
      else session.join('abc2');
      facade.dispatchEvent(new Event('open'));
      assert.equal(usedWifi, role === 'host' && wifi);
      this.message({ t: 'welcome', role, room: wifi && role === 'host' ? 'wifi' : 'abc2' });
      this.message({ t: 'peer', here: true });
    },
  };
}

test('Friend packets only carry bounded race state and no learner details', () => {
  const packed = packPose({ ...makeRace(false), d: 123.456, boost: 1, name: 'not shared' }, 2, 'frog');
  assert.equal(packed.d, 123.46);
  assert.equal(packed.boost, true);
  assert.deepEqual(readPose({ ...packed, name: 'not read' }), packed);
  for (const bad of [{ d: -1 }, { x: WIDTH + 1 }, { time: Infinity }, { speed: 67 }, { won: true }, { steer: 2 }, { kind: 'alien' }, { pod: 3 }]) {
    assert.equal(readPose({ ...packed, ...bad }), null);
  }
  assert.equal(roomCode('abc2'), 'abc2');
  assert.equal(roomCode('wifi'), '');
});

test('Both racers ready up, host starts each round, and stale or regressive poses are ignored', () => {
  const host = racer(false), guest = racer(false);
  host.connect('host');
  guest.connect('guest');
  assert.deepEqual(host.sent.shift(), { t: 'create' });
  assert.deepEqual(guest.sent.shift(), { t: 'join', room: 'abc2' });
  assert.equal(host.updates.at(-1).code, 'abc2');

  guest.session.ready();
  host.message(guest.sent.shift());
  assert.deepEqual(host.begins, []);
  host.session.ready();
  guest.message(host.sent.shift());
  const start = host.sent.shift();
  guest.message(start);
  guest.message(start);
  assert.deepEqual(host.begins, ['host']);
  assert.deepEqual(guest.begins, ['guest']);

  const run = { ...makeRace(false), time: 5, d: 10 };
  guest.session.send(run, 0, 'fox');
  const msg = guest.sent.shift();
  host.message({ ...msg, round: 0 });
  host.message(msg);
  host.message({ ...msg, pose: { ...msg.pose, d: 9 } });
  host.message({ ...msg, pose: { ...msg.pose, d: 20, time: 4 } });
  assert.deepEqual(host.poses.map(p => p.d), [10]);

  guest.session.send({ ...run, d: RACE, time: 27, won: true }, 0, 'fox');
  host.message(guest.sent.shift());
  host.message({ ...msg, pose: { ...msg.pose, d: RACE, time: 30 } });
  assert.equal(host.poses.length, 2);
  host.session.ready();
  guest.message(host.sent.shift());
  guest.session.ready();
  host.message(guest.sent.shift());
  guest.message(host.sent.shift());
  assert.deepEqual(host.begins, ['host', 'host']);
  assert.deepEqual(guest.begins, ['guest', 'guest']);
  host.message(msg);
  assert.equal(host.poses.length, 2);
});

test('Wi-Fi starts with the shared room transport and disconnect clears readiness', () => {
  const host = racer();
  host.connect('host');
  assert.equal(host.updates.at(-1).code, '');
  host.session.ready();
  host.message({ t: 'peer', here: false });
  assert.equal(host.updates.at(-1).localReady, false);
  assert.equal(host.updates.at(-1).connected, false);
  assert.match(host.losses.at(-1), /friend left/);
  host.session.leave();
  assert.equal(host.closed, true);
});

test('Friend position replaces the third computer pod and breaks finish ties consistently', () => {
  const run = { ...makeRace(false), d: RACE, time: 26, won: true };
  assert.equal(position(run, { d: RACE, time: 25, won: true }, 'host'), 2);
  assert.equal(position(run, { d: RACE, time: 27, won: true }, 'host'), 1);
  assert.equal(position(run, { d: RACE, time: 26, won: true }, 'host'), 1);
  assert.equal(position(run, { d: RACE, time: 26, won: true }, 'guest'), 2);
  assert.equal(position({ ...run, d: 400, time: 10, won: false }, { d: 420 }, 'host'), 2);
});
