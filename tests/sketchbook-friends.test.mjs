import test from 'node:test';
import assert from 'node:assert/strict';
import { friendRoomCode, makeFriendSession, packFriendPose, readFriendPose } from '../sidecars/sketchbook/friends.mjs';

const pose = { p: [1.000008, 77, -92], yaw: 1, gait: 0, kind: 'bunny', gear: 'cap',
  ride: { type: 'heli', p: [1, 75, -92], q: [0, 0, 0, 1] } };

test('Sketchbook poses carry the garden buddy and vehicle, but no questions or stars', () => {
  const message = packFriendPose({ ...pose, stars: 50, answer: 2 });
  assert.deepEqual(readFriendPose(message), { ...pose, p: [1, 77, -92] });
  assert.equal('stars' in message, false);
  assert.equal('answer' in message, false);
  assert.equal(readFriendPose({ ...message, t: 'me' }), null);
  assert.equal(readFriendPose({ ...message, kind: 'invalid' }), null);
  assert.equal(readFriendPose({ ...message, p: [Infinity, 0, 0] }), null);
  assert.equal(readFriendPose({ ...message, ride: { ...message.ride, q: [0, 0, 0, 0] } }).ride, null);
});

test('Sketchbook accepts only codes issued by the shared relay', () => {
  assert.equal(friendRoomCode('a2hz'), 'a2hz');
  for (const bad of ['', 'wifi', '1234', 'abcd/', 'IJKL', 'a2hz\\nabc']) assert.equal(friendRoomCode(bad), '');
});

test('Sketchbook opens shared rooms, syncs only with a peer, and cleans up on leave', () => {
  let socket, closed = 0, state, lastPose, wifiOnly;
  const sent = [];
  const session = makeFriendSession({
    transport(facade, wifi) {
      socket = facade;
      wifiOnly = wifi;
      return { send: text => sent.push(JSON.parse(text)), close: () => { closed++; socket.dispatchEvent(new Event('close')); } };
    },
    update: view => { state = view; },
    receive: update => { lastPose = update; },
    clear: () => { lastPose = null; }
  });
  const tell = msg => socket.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(msg) }));
  session.host(true);
  assert.equal(wifiOnly, true);
  socket.dispatchEvent(new Event('open'));
  assert.deepEqual(sent.shift(), { t: 'create' });
  tell({ t: 'welcome', role: 'host', room: 'wifi' });
  assert.equal(state.code, '');
  session.send(pose);
  assert.equal(sent.length, 0);
  tell({ t: 'peer', here: true });
  session.send(pose);
  assert.equal(sent.shift().ride.type, 'heli');
  tell(packFriendPose(pose));
  assert.equal(lastPose.kind, 'bunny');
  tell({ t: 'peer', here: false });
  assert.equal(lastPose, null);
  session.join('abcd');
  assert.equal(closed, 1);
  socket.dispatchEvent(new Event('open'));
  assert.deepEqual(sent.shift(), { t: 'join', room: 'abcd' });
  tell({ t: 'full' });
  assert.equal(state.active, false);
  assert.match(state.status, /two players/);
  assert.equal(closed, 2);
});
