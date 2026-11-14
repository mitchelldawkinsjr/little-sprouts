import test from 'node:test';
import assert from 'node:assert/strict';
import { offlineStatusText } from '../lib/offline-warm.mjs';

test('offline status says ready only when everything is saved', () => {
  assert.match(offlineStatusText({ state: 'ready', saved: 10, total: 10 }), /Ready for offline play/);
  assert.doesNotMatch(offlineStatusText({ state: 'saving', saved: 5, total: 10 }), /Ready/);
});

test('offline status shows percent and megabytes while saving', () => {
  const line = offlineStatusText({ state: 'saving', saved: 45_000_000, total: 180_000_000 });
  assert.match(line, /25%/);
  assert.match(line, /45 of 180 MB/);
});

test('offline status asks for a connection when offline mid-download', () => {
  assert.match(offlineStatusText({ state: 'saving', saved: 1, total: 2 }, false), /Connect to the internet/);
  assert.match(offlineStatusText({ state: 'partial', saved: 1, total: 2, failed: 3 }, false), /Connect/);
});

test('offline status counts failed files', () => {
  assert.match(offlineStatusText({ state: 'partial', saved: 9, total: 10, failed: 1 }), /1 file did not/);
  assert.match(offlineStatusText({ state: 'partial', saved: 8, total: 10, failed: 2 }), /2 files did not/);
});

test('offline status never shows 100% before ready', () => {
  assert.match(offlineStatusText({ state: 'saving', saved: 999, total: 1000 }), /99%/);
});
