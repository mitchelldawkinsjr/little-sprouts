import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import test from 'node:test';
import { GROUP, GAME } from '../lib/group-room.mjs';
import { attachRelay } from '../server/paint-link.mjs';

const wrap = (type, fields) => ({ t: GROUP, game: GAME, type, ...fields });
const loadout = { pod: 0, kind: 'fox' };
const motion = { d: 50, x: 2, steer: 0, speed: 40, boost: false };

test('Real /link relay supports four group seats and preserves legacy two-seat rooms', async t => {
  const server = createServer();
  attachRelay(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const sessions = [];
  t.after(async () => {
    for (const s of sessions) s.close();
    await new Promise(resolve => server.close(resolve));
  });
  async function connect() {
    const socket = new WebSocket(`ws://127.0.0.1:${server.address().port}/link`);
    const seen = [];
    const target = new EventTarget();
    socket.addEventListener('message', e => {
      seen.push(JSON.parse(e.data));
      target.dispatchEvent(new Event('message'));
    });
    const client = {
      close: () => socket.close(),
      send: data => socket.send(JSON.stringify(data)),
      next: async (f, since = 0) => {
        for (;;) {
          const hit = seen.slice(since).find(f);
          if (hit) return hit;
          await once(target, 'message', { signal: AbortSignal.timeout(5000) });
        }
      },
      seen,
    };
    sessions.push(client);
    await once(socket, 'open');
    return client;
  }
  const is = type => m => m.type === type;
  const host = await connect(), a = await connect(), b = await connect(), c = await connect(), d = await connect();
  host.send(wrap('create'));
  const welcome = await host.next(is('welcome'));
  const room = welcome.code;
  assert.match(room, /^[a-z2-9]{4}$/);
  a.send(wrap('join', { room, t: 'sprouts-group/2' }));
  assert.equal((await a.next(is('error'))).reason, 'game-mismatch');
  const received = a.seen.length;
  a.send(wrap('join', { room, game: 'another-game' }));
  assert.equal((await a.next(is('error'), received)).reason, 'game-mismatch');
  for (const [i, peer] of [a, b, c].entries()) {
    peer.send(wrap('join', { room }));
    assert.equal((await peer.next(is('welcome'))).id, i + 2);
    await host.next(m => m.type === 'roster' && m.players.length === i + 2);
  }
  d.send(wrap('join', { room }));
  assert.equal((await d.next(is('error'))).reason, 'full');
  c.close();
  await host.next(m => m.type === 'roster' && m.players.length === 3 && !m.players.some(p => p.id === 4));
  for (const peer of [host, a, b]) peer.send(wrap('ready', { loadout }));
  const ready = await host.next(m => m.type === 'roster' && m.players.length === 3 && m.players.every(p => p.ready));
  assert.equal(ready.players.length, 3);
  a.send(wrap('start'));
  a.send(wrap('clock', { sample: 100 }));
  await a.next(m => m.type === 'clock' && m.sample === 100);
  assert.equal(a.seen.some(is('start')), false);
  host.send(wrap('start'));
  const start = await a.next(is('start'));
  assert.equal(start.grid.length, 3);
  d.send(wrap('join', { room }));
  assert.equal((await d.next(m => m.type === 'error' && m.reason !== 'full')).reason, 'in-progress');
  await new Promise(resolve => setTimeout(resolve, Math.max(0, start.startAt + 1050 - Date.now())));
  a.send(wrap('pose', { round: 0, pose: motion }));
  a.send(wrap('pose', { round: start.round, id: 999, pose: motion }));
  assert.deepEqual(await b.next(is('pose')), { t: GROUP, type: 'pose', id: 2, round: 1, pose: motion });
  b.close();
  await host.next(m => m.type === 'finish' && m.id === 3 && m.ms === null);
  for (const peer of [host, a]) peer.send(wrap('finish', { round: start.round, ms: 1000 }));
  const result = await a.next(is('results'));
  assert.deepEqual(result.finishes.map(f => f.ms), [1000, 1000, null]);
  d.send(wrap('join', { room }));
  await d.next(is('welcome'));
  a.send(wrap('rematch'));
  await host.next(m => m.type === 'roster' && m.state === 'lobby' && m.players.every(p => !p.ready), host.seen.findIndex(is('results')));
  host.close();
  await a.next(is('closed'));

  const oldHost = await connect(), oldGuest = await connect();
  oldHost.send({ t: 'create' });
  const old = await oldHost.next(m => m.t === 'welcome');
  oldGuest.send({ t: 'join', room: old.room });
  await oldGuest.next(m => m.t === 'peer' && m.here);
  oldGuest.send({ t: 'test-legacy', value: 42 });
  assert.equal((await oldHost.next(m => m.t === 'test-legacy')).value, 42);
});
