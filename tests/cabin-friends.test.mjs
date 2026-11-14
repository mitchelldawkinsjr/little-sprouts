import test from 'node:test';
import assert from 'node:assert/strict';
import { outOfHearts, packSnap, pickTarget, readSnap, readSpot, readSpray, roomLine } from '../sidecars/cabin/friends.mjs';

test('Cabin with a friend: a snapshot survives the trip and bad rows are dropped', () => {
  const msg = packSnap({ wave: 3, kills: 12, raccoons: [{ id: 7, x: 1.234, z: -5.678, yaw: 0.5, gait: 1, wet: true }], openings: [3, 0, 2.4] });
  const back = readSnap(JSON.parse(JSON.stringify(msg)));
  assert.equal(back.wave, 3);
  assert.equal(back.kills, 12);
  assert.deepEqual(back.raccoons, [{ id: 7, x: 1.23, z: -5.68, yaw: 0.5, gait: 1, wet: true }]);
  assert.deepEqual(back.openings, [3, 0, 2]);
  const bad = readSnap({ t: 'snap', r: [['x', 1, 2, 3, 4, 0], [1, 'a', 2, 3, 4, 0], [2, 1, 2, 3, 4, 0]] });
  assert.deepEqual(bad.raccoons.map(r => r.id), [2]);
  assert.equal(readSnap({ t: 'me' }), null);
});

test('Cabin with a friend: sprays from a friend are checked and clamped', () => {
  const sp = readSpray({ p: [1, 2], d: [3, 4], dmg: 99, pierce: 9, n: 9, hot: 1 });
  assert.deepEqual(sp.d, [0.6, 0.8]);
  assert.equal(sp.dmg, 8);
  assert.equal(sp.pierce, 3);
  assert.equal(sp.n, 4);
  assert.equal(sp.hot, true);
  assert.equal(readSpray({ p: [1, 2], d: [0, 0] }), null);
  assert.equal(readSpray({ p: [1], d: [1, 0] }), null);
  assert.deepEqual(readSpot([999, -999]), [40, -40]);
});

test('Cabin with a friend: raccoons go for the closer buddy that is awake', () => {
  const z = { x: 0, z: 0 };
  assert.equal(pickTarget(z, { x: 1, z: 0 }, { x: 5, z: 0 }), 'me');
  assert.equal(pickTarget(z, { x: 5, z: 0 }, { x: 1, z: 0 }), 'friend');
  assert.equal(pickTarget(z, { x: 1, z: 0, nap: true }, { x: 5, z: 0 }), 'friend');
  assert.equal(pickTarget(z, { x: 1, z: 0, nap: true }, { x: 5, z: 0, nap: true }), null);
});

test('Cabin with a friend: out of hearts naps while the friend is awake; alone, or both napping, the night ends', () => {
  assert.equal(outOfHearts({ withFriend: true, friendNapping: false }), 'nap');
  assert.equal(outOfHearts({ withFriend: true, friendNapping: true }), 'over');
  assert.equal(outOfHearts({ withFriend: false, friendNapping: false }), 'over');
});

test('Cabin with a friend: the friend box line', () => {
  assert.match(roomLine({ role: 'host', peer: false, room: 'ab12', url: 'u' }), /Send them this link: u/);
  assert.equal(roomLine({ role: 'host', peer: false, room: 'wifi', status: '' }), 'Waiting for a friend.');
  assert.match(roomLine({ role: 'guest', peer: true }), /friend’s cabin/);
  assert.equal(roomLine({ role: 'solo', status: '' }), '');
});
