import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import test from 'node:test';
import { GROUP, groupCapacity, makeGroupRoom } from '../lib/group-room.mjs';
import { localGuest, localHost } from '../lib/group-transport.mjs';
import { attachRelay } from '../server/paint-link.mjs';
import { nearestAwake } from '../sidecars/cabin/friends.mjs';
import { worldCollector, worldParts } from '../sidecars/blocks/friends.mjs';

const event = (type, fields) => ({ t: GROUP, type, ...fields });
const gameEvent = (t, fields = {}, to) => event('event', { to, data: { t, ...fields } });

function seatRoom(game) {
  const room = makeGroupRoom({ game });
  const players = [];
  function attach() {
    const log = [];
    const connection = { send(m) { log.push(m); } };
    const accepted = room.attach(connection);
    const player = { log, accepted, id: log[0].id, send: msg => room.receive(connection, msg), close: () => room.detach(connection) };
    players.push(player);
    return player;
  }
  return { room, players, attach };
}
test('Group worlds are opt-in, have a game-specific cap and do not inherit racing rules', () => {
  for (const [name, expected] of Object.entries({ sketchbook: 4, station: 4, blocks: 4, cabin: 3 })) {
    assert.equal(groupCapacity(name), expected);
    const { room, attach } = seatRoom(name);
    const seats = Array.from({ length: expected }, attach);
    assert.ok(seats.every(p => p.accepted));
    assert.deepEqual(seats.map(p => p.id), Array.from({ length: expected }, (_, i) => i + 1));
    assert.equal(attach().log.at(-1).reason, 'full');
    seats[0].send(event('start'));
    assert.equal(seats[1].log.at(-1).state, 'lobby');
    seats[1].close();
    const late = attach();
    assert.ok(late.accepted);
    assert.notEqual(late.id, seats[1].id);
    seats[0].close();
    assert.equal(late.log.at(-1).type, 'closed');
    room.close();
  }
  for (const legacy of ['inkwave', 'paint', 'gulp', 'constructor']) assert.equal(groupCapacity(legacy), 0);
});

test('Host serializes Block Meadow edit requests; commits and snapshots have correct recipients', () => {
  const { attach } = seatRoom('blocks');
  const host = attach(), a = attach(), b = attach();
  const patch = { k: '2.9.4', v: 'grass' };
  a.send(gameEvent('commit', patch));
  assert.equal(b.log.some(m => m.type === 'event'), false);
  a.send(gameEvent('ed', patch, b.id));
  assert.equal(b.log.some(m => m.type === 'event'), false);
  a.send({ ...gameEvent('ed', patch, host.id), id: b.id });
  assert.equal(host.log.at(-1).id, a.id);
  host.send(gameEvent('commit', patch));
  assert.deepEqual(a.log.at(-1), b.log.at(-1));
  host.send(gameEvent('commit', { ...patch, v: '' }));
  assert.equal(a.log.at(-1).data.v, '');
  assert.equal(b.log.at(-1).data.v, '');
  const parts = worldParts(new Map(Array.from({ length: 400 }, (_, i) => [`${i}.9.4`, 'grass'])), 128);
  const collector = worldCollector();
  for (const part of parts) {
    assert.ok(JSON.stringify(gameEvent('world', part, b.id)).length < 8192);
    host.send(gameEvent('world', part, b.id));
    const data = b.log.at(-1).data;
    const edits = collector.add(data, t => t === 'grass');
    if (part.i === part.n - 1) assert.equal(edits.length, 400);
  }
  assert.equal(a.log.at(-1).data.t, 'commit');
});

test('Cabin co-op targets the nearest awake buddy and only the host can send hits and wave state', () => {
  const { attach } = seatRoom('cabin');
  const host = attach(), a = attach(), b = attach();
  b.send(gameEvent('wave', { n: 99 }));
  a.send(gameEvent('ouch', {}, b.id));
  assert.equal(b.log.some(m => m.type === 'event'), false);
  host.send(gameEvent('ouch', {}, b.id));
  assert.equal(b.log.at(-1).data.t, 'ouch');
  assert.equal(a.log.some(m => m.type === 'event'), false);
  a.send(gameEvent('spray', { n: 1 }));
  assert.equal(b.log.at(-1).data.t, 'spray');
  const target = (id, x, asleep) => ({ id, position: { x, z: 0 }, asleep });
  const buddies = [target(1, 5, false), target(2, 1, true), target(3, 2, false)];
  assert.equal(nearestAwake({ x: 0, z: 0 }, buddies).id, 3);
  assert.equal(nearestAwake({ x: 0, z: 0 }, buddies.map(p => ({ ...p, asleep: true }))), null);
});

test('Real relay isolates room codes by game and stamps distinct sender IDs', async t => {
  const server = createServer();
  attachRelay(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const clients = [];
  t.after(() => {
    for (const client of clients) client.close();
    return new Promise(resolve => server.close(resolve));
  });
  async function connect() {
    const socket = new WebSocket(`ws://127.0.0.1:${server.address().port}/link`);
    const log = [];
    socket.addEventListener('message', ev => log.push(JSON.parse(ev.data)));
    clients.push(socket);
    await once(socket, 'open');
    return {
      send: msg => socket.send(JSON.stringify(msg)),
      async next(fn) {
        while (true) {
          const found = log.find(fn);
          if (found) return found;
          await once(socket, 'message', { signal: AbortSignal.timeout(5000) });
        }
      },
    };
  }
  const host = await connect(), a = await connect(), b = await connect();
  host.send(event('create', { game: 'sketchbook' }));
  const { code } = await host.next(m => m.type === 'welcome');
  a.send(event('join', { game: 'station', room: code }));
  assert.equal((await a.next(m => m.type === 'error')).reason, 'game-mismatch');
  for (const guest of [a, b]) {
    guest.send(event('join', { game: 'sketchbook', room: code }));
    await guest.next(m => m.type === 'welcome');
  }
  a.send(gameEvent('sketchbook/1', { kind: 'frog' }));
  b.send(gameEvent('sketchbook/1', { kind: 'bear' }));
  assert.equal((await host.next(m => m.data?.kind === 'frog')).id, 2);
  assert.equal((await host.next(m => m.data?.kind === 'bear')).id, 3);
});

test('Same Wi-Fi admission checks the selected game before adding a player', async () => {
  const pairs = { host: [], guest: [] }, log = [];
  const pair = (facade, role) => {
    const entry = { facade, other: null, send(data) {
      if (entry.other) queueMicrotask(() => entry.other.facade.dispatchEvent(new MessageEvent('message', { data })));
    }, close() { facade.dispatchEvent(new Event('close')); } };
    pairs[role].push(entry);
    return entry;
  };
  const tick = () => new Promise(resolve => setImmediate(resolve));
  const host = localHost({ game: 'station', message: m => log.push(m), pairing() {}, pair });
  const connect = async game => {
    const received = [];
    host.add();
    const guest = localGuest({ game, message: m => received.push(m), ended() {}, pair });
    const a = pairs.host.at(-1), b = pairs.guest.at(-1);
    a.other = b;
    b.other = a;
    a.facade.dispatchEvent(new Event('open'));
    b.facade.dispatchEvent(new Event('open'));
    await tick();
    return { guest, received };
  };
  await tick();
  const first = await connect('station');
  assert.equal(first.received[0].game, 'station');
  const wrong = await connect('blocks');
  assert.equal(wrong.received[0].reason, 'game-mismatch');
  assert.equal(log.at(-1).players.length, 2);
  const third = await connect('station');
  assert.equal(third.received[0].game, 'station');
  assert.equal(log.at(-1).players.length, 3);
  host.close();
});
