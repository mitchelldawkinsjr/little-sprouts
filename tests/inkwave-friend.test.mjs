import test from 'node:test';
import assert from 'node:assert/strict';
import { peerId, mirrorPoint, mirrorYaw, mirrorCoverage, packActor, readActor, readStart, friendLine, TEAM_SIZE } from '../sidecars/paint-the-plan/src/friend-core.js';
import { assignTags } from '../sidecars/sky-deliveries/sprouts-sky.mjs';

test('Inkwave friends: each player is team 0, slot 0 on their own screen', () => {
  assert.equal(peerId(0), TEAM_SIZE);
  assert.equal(peerId(TEAM_SIZE), 0);
  assert.equal(peerId(3), 7);
  for (let id = 0; id < 8; id++) assert.equal(peerId(peerId(id)), id);
});

test('Inkwave friends: positions mirror through the middle of the map', () => {
  assert.deepEqual(mirrorPoint([1, 2.2, -39.2]), [-1, 2.2, 39.2]);
  assert.ok(Math.abs(mirrorYaw(0) - Math.PI) < 1e-9);
  assert.ok(Math.abs(mirrorYaw(Math.PI / 2) + Math.PI / 2) < 1e-9);
  assert.deepEqual(mirrorCoverage([0.3, 0.5]), [0.5, 0.3]);
});

test('Inkwave friends: a player state goes across and comes back turned around', () => {
  const row = packActor({ id: 0, pos: [1.234, 2, -30], vel: [0, 0, 5], yaw: 0.5, aimYaw: 0.5, aimPitch: 0.1, move: [0, 1], fire: true, squid: false, sub: false, alive: true, jumps: 2, specials: 1, special: 120 });
  const a = readActor(row);
  assert.equal(a.id, TEAM_SIZE);
  assert.deepEqual(a.pos, [-1.23, 2, 30]);
  assert.deepEqual(a.vel, [-0, 0, -5]);
  assert.deepEqual(a.move, [-0, -1]);
  assert.equal(a.fire, true);
  assert.equal(a.alive, true);
  assert.equal(a.jumps, 2);
  assert.equal(readActor([0, 1, 2]), null);
  assert.equal(readActor([9, ...new Array(15).fill(0)]), null);
  assert.equal(readActor([0, 'x', ...new Array(14).fill(0)]), null);
  assert.ok(Math.abs(readActor([0, 9999, 0, 0, ...new Array(12).fill(0)]).pos[0]) <= 400);
});

test('Inkwave friends: the start message names the map, palette, and who carries what', () => {
  const maps = [{ id: 'tidewater' }];
  const pals = [{ id: 'p1', a: '#f00', b: '#00f', names: ['Red', 'Blue'] }];
  const roster = Array.from({ length: 8 }, (_, i) => [i === 4 ? 'roller' : 'shooter', 'P' + i]);
  const s = readStart({ t: 'start', map: 'tidewater', dur: 180, pal: 'p1', roster }, maps, pals);
  assert.equal(s.map, 'tidewater');
  assert.equal(s.pal.id, 'p1');
  assert.equal(s.roster[0].weapon, 'roller');   // the friend's own slot on their screen
  assert.equal(s.roster[4].name, 'P0');         // the host, across the map
  assert.equal(readStart({ t: 'start', map: 'nowhere' }, maps, pals), null);
  assert.match(friendLine({ role: 'host', peer: false, room: 'ab12', url: 'u' }), /Send them this link: u/);
  assert.match(friendLine({ role: 'guest', peer: true }), /opposite teams/);
});

test('Cloudkeep: answers go on different kinds of creature, and kinds take turns', () => {
  const at = (id, x, species) => ({ id, species, mode: 'roam', pos: { x, y: 0, z: 0 } });
  const ship = { x: 0, y: 0, z: 0 };
  const sky = [at(1, 2, 'bird'), at(2, 3, 'bird'), at(3, 4, 'koi'), at(4, 5, 'ray'), at(5, 6, 'bird')];
  const tags = assignTags(sky, ship, new Map(), 3);
  const kinds = [...tags.keys()].map(id => sky.find(c => c.id === id).species).sort();
  assert.deepEqual(kinds, ['bird', 'koi', 'ray']);
  // last time it was birds and koi: a ray goes first now
  const next = assignTags(sky, ship, new Map(), 1, 70, new Set(), new Set(['bird', 'koi']));
  assert.equal(sky.find(c => c.id === [...next.keys()][0]).species, 'ray');
});
