import test from 'node:test';
import assert from 'node:assert/strict';
import { handRaised, mapCover, pickPose, pointerNorm, reachScore, zoneHit } from './camera.js';

const joint = (x, y, visibility = 0.9, z = 0) => ({ x, y, z, visibility });

test('cover mapping keeps the mirrored center still and crops the wide edges', () => {
  const center = mapCover(0.5, 0.5, 1600, 900, 800, 600);
  assert.ok(Math.abs(center.x - 400) < 0.01);
  assert.ok(Math.abs(center.y - 300) < 0.01);
  const cropped = mapCover(0, 0.5, 1600, 900, 800, 600);
  assert.ok(cropped.x > 800);
});

test('the closest visible pose wins', () => {
  const far = Array.from({ length: 33 }, () => joint(0.5, 0.5, 0.3));
  far[11] = joint(0.48, 0.4, 0.4);
  far[12] = joint(0.52, 0.4, 0.4);
  far[15] = joint(0.47, 0.6, 0.4);
  far[16] = joint(0.53, 0.6, 0.4);
  const near = Array.from({ length: 33 }, () => joint(0.5, 0.5, 0.9));
  near[11] = joint(0.3, 0.4, 0.9);
  near[12] = joint(0.7, 0.4, 0.9);
  near[15] = joint(0.25, 0.7, 0.9);
  near[16] = joint(0.75, 0.7, 0.9);
  assert.equal(pickPose([far, near]), near);
  assert.equal(pickPose([far.map(() => joint(0.5, 0.5, 0))]), null);
});

test('the pointer prefers a visible fingertip and falls back to the wrist', () => {
  const finger = pointerNorm({
    wrist: joint(0.4, 0.4),
    index: joint(0.4, 0.2),
    pinky: joint(0.42, 0.22)
  });
  assert.ok(finger.y < 0.3);
  const wrist = pointerNorm({
    wrist: joint(0.4, 0.5),
    index: joint(0.4, 0.1, 0.05),
    pinky: joint(0.4, 0.1, 0.05)
  });
  assert.equal(wrist.y, 0.5);
});

test('a hand above the shoulder counts as a reach, and a hand at the side does not', () => {
  const up = reachScore({
    shoulder: joint(0.7, 0.45),
    elbow: joint(0.68, 0.32, 0.9, -0.05),
    wrist: joint(0.66, 0.22, 0.9, -0.15),
    index: joint(0.65, 0.14, 0.9, -0.15),
    pinky: joint(0.67, 0.16)
  });
  const down = reachScore({
    shoulder: joint(0.7, 0.4),
    elbow: joint(0.72, 0.55),
    wrist: joint(0.74, 0.72),
    index: joint(0.75, 0.78),
    pinky: joint(0.73, 0.76)
  });
  assert.ok(up > 0.04);
  assert.ok(down < -0.055);
});

test('a reach stays armed through a small dip, then releases when the hand drops', () => {
  assert.equal(handRaised(false, 0.02), false);
  assert.equal(handRaised(false, 0.05), true);
  assert.equal(handRaised(true, 0), true);
  assert.equal(handRaised(true, -0.06), false);
});

test('overlapping answers pick the nearest one, with room to hold on', () => {
  const zones = [
    { el: 'left', rect: { left: 0, right: 100, top: 0, bottom: 80 } },
    { el: 'right', rect: { left: 110, right: 210, top: 0, bottom: 80 } }
  ];
  assert.equal(zoneHit(zones, 90, 40, 18), 'left');
  assert.equal(zoneHit(zones, 112, 40, 18), 'right');
  assert.equal(zoneHit(zones, 104, 40, 0), null);
});
