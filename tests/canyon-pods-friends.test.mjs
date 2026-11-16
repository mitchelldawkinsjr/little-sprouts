import assert from 'node:assert/strict';
import test from 'node:test';
import { aiGrid, finishOrder, lane, packPose } from '../sidecars/canyon-pods/friends.mjs';
import { makeRace, RACE } from '../sidecars/canyon-pods/logic.mjs';
import { GAME, GROUP, makeGroupRoom, readGroup, readMotion } from '../lib/group-room.mjs';
import { localGuest, localHost } from '../lib/group-transport.mjs';

const msg = (type, extra) => ({ t: GROUP, type, ...extra });
const loadout = { pod: 1, kind: 'frog' };

test('Canyon Pods grid fills empty seats and ranks all four consistently, including ties and DNF', () => {
  const grid = [{ id: 1, seat: 0 }, { id: 4, seat: 1 }, { id: 3, seat: 3 }];
  assert.deepEqual(aiGrid(grid), [{ seat: 2, bot: 0 }]);
  assert.equal(new Set([0, 1, 2, 3].map(lane)).size, 4);
  assert.equal(aiGrid([...grid, { id: 5, seat: 2 }]).length, 0);
  const finishes = [{ id: 4, ms: 20_000 }, { id: 3, ms: null }, { id: 1, ms: 20_000 }];
  const order = finishOrder(grid, finishes);
  assert.deepEqual(order.map(p => p.seat), [0, 1, 2, 3]);
  assert.deepEqual(finishOrder(grid, [...finishes].reverse()), order);
});

test('Race packets keep only bounded motion and no learning data', () => {
  const pose = packPose({ ...makeRace(false), d: RACE, boost: 1, name: 'learner' });
  assert.deepEqual(readMotion({ ...pose, name: 'not relayed' }), pose);
  for (const invalid of [{ d: -1 }, { x: 20 }, { speed: 70 }, { boost: 'yes' }, { steer: 2 }]) {
    assert.equal(readMotion({ ...pose, ...invalid }), null);
  }
  assert.equal(readGroup(JSON.stringify(msg('pose', { junk: 'a'.repeat(4096) }))), null);
  assert.equal(readGroup(JSON.stringify({ t: 'sprouts-group/2', type: 'create' })), null);
});

test('Round timeout produces DNF, retains results and resets readiness on rematch', () => {
  let now = 0, timeout, canceled;
  const room = makeGroupRoom({ now: () => now, schedule: fn => { timeout = fn; return 1; },
    unschedule: token => { canceled = token; } });
  const socket = () => {
    const messages = [];
    return { send: m => messages.push(m), messages };
  };
  const host = socket(), guest = socket(), third = socket();
  for (const peer of [host, guest, third]) {
    room.attach(peer);
    room.receive(peer, msg('ready', { loadout }));
  }
  room.receive(guest, msg('start'));
  assert.equal(host.messages.some(m => m.type === 'start'), false);
  room.receive(host, msg('start'));
  const start = host.messages.at(-1);
  assert.equal(start.type, 'start');
  assert.equal(start.grid.length, 3);
  room.receive(host, msg('finish', { round: 1, ms: 17_000 }));
  assert.equal(host.messages.at(-1).type, 'start');
  now = start.startAt + 20_000;
  room.receive(host, msg('finish', { round: 1, ms: 20_000 }));
  room.detach(third);
  assert.equal(host.messages.find(m => m.type === 'finish' && m.id === 3).ms, null);
  timeout();
  assert.equal(canceled, 1);
  assert.deepEqual(host.messages.at(-1).finishes.map(f => f.ms), [20_000, null, null]);
  room.receive(guest, msg('rematch'));
  assert.equal(host.messages.at(-1).state, 'lobby');
  assert.ok(host.messages.at(-1).players.every(p => !p.ready));
});

test('Same Wi-Fi forwarding uses independent guest links; canceling a second pairing keeps the first connected', async () => {
  const attempts = { host: [], guest: [] };
  const fakePair = (facade, role) => {
    const link = { facade, target: null, down: false,
      send(data) {
        const peer = link.target;
        if (!link.down && peer && !peer.down) queueMicrotask(() => peer.facade.dispatchEvent(new MessageEvent('message', { data })));
      },
      close() {
        if (link.down) return;
        link.down = true;
        facade.dispatchEvent(new Event('close'));
        link.target?.close();
      } };
    attempts[role].push(link);
    return link;
  };
  const wire = () => {
    const a = attempts.host.at(-1), b = attempts.guest.at(-1);
    a.target = b;
    b.target = a;
    a.facade.dispatchEvent(new Event('open'));
    b.facade.dispatchEvent(new Event('open'));
  };
  const tick = () => new Promise(resolve => setImmediate(resolve));
  let now = 0;
  const logs = Array.from({ length: 4 }, () => []);
  const host = localHost({ message: m => logs[0].push(m), pairing: () => {}, pair: fakePair,
    createRoom: () => makeGroupRoom({ now: () => now, schedule: () => 1, unschedule: () => {} }) });
  const join = i => localGuest({ message: m => logs[i].push(m), ended: () => {}, pair: fakePair });
  await tick();
  host.add();
  const one = join(1);
  wire();
  await tick();
  host.add();
  attempts.host.at(-1).close();
  assert.equal(attempts.guest[0].down, false);
  host.add();
  const two = join(2);
  wire();
  await tick();
  for (const client of [host, one, two]) client.send(msg('ready', { loadout }));
  await tick();
  host.send(msg('start'));
  await tick();
  const start = logs[0].at(-1);
  assert.equal(start.grid.length, 3);
  assert.deepEqual(logs[2].at(-1), start);
  now = start.startAt + 2000;
  one.send(msg('pose', { round: start.round, id: 99, pose: packPose(makeRace(false)) }));
  await tick();
  assert.equal(logs[2].at(-1).id, 2);
  two.close();
  await tick();
  assert.equal(logs[1].findLast(m => m.type === 'finish').ms, null);
  host.close();
  await tick();
  assert.ok(attempts.guest.every(p => p.down));
});
