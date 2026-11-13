import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/build/three.module.js';
import { makeBuddyBall, BUDDIES } from '../lib/buddy3d.mjs';
import { drawBuddyBall } from '../lib/buddy2d.mjs';

test('Buddy ball 3D: every buddy fits inside its ball and stays upright while the shell rolls', () => {
  const R = 0.42;
  for (const kind of BUDDIES) {
    const ball = makeBuddyBall(THREE, kind, R, { gear: '' });
    assert.equal(ball.kind, kind);
    assert.equal(ball.group.name, `buddy-ball-${kind}`);
    ball.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(ball.buddy.group);
    assert.ok(box.min.y >= -R * 1.01, `${kind} feet stay inside the ball`);
    assert.ok(box.max.y <= R * 1.15, `${kind} head stays about inside the ball`);

    const axis = new THREE.Vector3(1, 0, 0);
    ball.roll(axis, 1.2);
    assert.ok(Math.abs(ball.shell.quaternion.x) > 0.1, 'the shell turns');
    assert.equal(ball.buddy.group.quaternion.x, 0, 'the buddy does not tumble');

    // Moving toward +x turns the buddy to face +x (yaw +90°).
    for (let i = 0; i < 60; i++) ball.animate(1 / 60, 2, 0, i / 60);
    assert.ok(Math.abs(ball.buddy.group.rotation.y - Math.PI / 2) < 0.05, `${kind} faces where it rolls`);
    ball.dispose();
  }
});

test('Buddy ball 3D: an unknown buddy falls back to the fox', () => {
  assert.equal(makeBuddyBall(THREE, 'dragon', 0.5).kind, 'fox');
});

test('Buddy ball 2D: every buddy draws clipped inside its ball', () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (target, key) => (key in target ? target[key] : (...args) => calls.push([key, ...args])),
    set: (target, key, value) => { target[key] = value; return true; }
  });
  for (const kind of BUDDIES) {
    calls.length = 0;
    drawBuddyBall(ctx, kind, 40, 40, 16, { spin: 1, gear: 'hat' });
    assert.ok(calls.some(([k]) => k === 'clip'), `${kind} is clipped to the ball`);
    assert.ok(calls.filter(([k]) => k === 'fill').length > 8, `${kind} draws its face`);
    const saves = calls.filter(([k]) => k === 'save').length;
    assert.equal(saves, calls.filter(([k]) => k === 'restore').length, 'canvas state is balanced');
  }
});
