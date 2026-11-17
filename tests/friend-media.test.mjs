import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mediaPermissionHelp } from '../lib/friend-panel.mjs';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('friend QR scan explains missing or denied Fire tablet camera permissions', () => {
  const denied = mediaPermissionHelp('camera', { name: 'NotAllowedError' });
  assert.match(denied, /Camera access was blocked/);
  assert.match(denied, /Little Sprouts/);
  assert.match(denied, /Permissions → Camera/);
  assert.match(mediaPermissionHelp('camera', { name: 'NotFoundError' }), /No available camera/);
  assert.match(mediaPermissionHelp('camera', { name: 'NotReadableError' }), /busy or unavailable/);
  assert.match(mediaPermissionHelp('camera', { name: 'TypeError' }), /unavailable in this browser/);
});

test('microphone denied still explains QR alternative and app permission settings', () => {
  const denied = mediaPermissionHelp('microphone', { name: 'NotAllowedError' });
  assert.match(denied, /Microphone access was blocked/);
  assert.match(denied, /Permissions → Microphone/);
  assert.match(mediaPermissionHelp('microphone', { name: 'NotFoundError' }), /QR scanner/);
});

test('friend camera/microphone path uses media capture with recovery and closes tracks', () => {
  const panel = source('lib/friend-panel.mjs');
  const link = source('lib/friend-link.mjs');
  const sound = source('lib/friend-sound.mjs');
  const sidecar = source('lib/sidecar.js');
  assert.match(panel, /navigator\.mediaDevices\.getUserMedia\(\{ video:/);
  assert.match(panel, /stream\?\.getTracks\(\)\.forEach\(t => t\.stop\(\)\)/);
  assert.match(panel, /throw new Error\(mediaPermissionHelp\('camera', error\)\)/);
  assert.match(sound, /navigator\.mediaDevices\.getUserMedia\(\{/);
  assert.match(sound, /echoCancellation: false, noiseSuppression: false/);
  assert.match(link, /w\.micError = mediaPermissionHelp\('microphone', error\)/);
  assert.match(link, /w\.sound\.start\(\{ listen: false \}\)/);
  assert.match(link, /this\.panel\.problem\(w\.micError\)/);
  assert.match(link, /this\.panel\.problem\(error\?\.message/);
  assert.match(sidecar, /'autoplay; fullscreen; gamepad; camera; microphone'/);
});
