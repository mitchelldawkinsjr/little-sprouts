import assert from 'node:assert/strict';
import test from 'node:test';
import { findBuiltSidecars, savedOffline } from '../lib/sidecar.js';

test('built sidecars require only one catalog request, even when WebGPU is unavailable', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, opts) => {
    calls.push([url, opts.method || 'GET']);
    return Response.json(['sidecars/dash/index.html', 'sidecars/field-guide-fishing/tidewater-coast.html']);
  });
  assert.deepEqual(await findBuiltSidecars(), ['dash']);
  assert.deepEqual(calls, [['./sidecars.json', 'GET']]);
});

test('offline availability requires a sidecar page and the full compatible pack, not just the page', async () => {
  const path = '/sidecars/dash/index.html';
  const js = '/sidecars/dash/game.mjs';
  const list = { ['.' + path]: 'stamp', ['.' + js]: 'stamp' };
  assert.equal(await savedOffline('https://sprouts.test' + path, { list, keys: new Set([path]) }), false);
  assert.equal(await savedOffline('https://sprouts.test' + path, { list, keys: new Set([path, js]) }), true);
  assert.equal(await savedOffline('https://sprouts.test' + path, {
    list, keys: new Set([path, js]), stamps: { ['.' + js]: 'older stamp' }
  }), false);
  assert.equal(await savedOffline('https://sprouts.test/sidecars/field-guide-fishing/tidewater-coast.html', {
    list: null, keys: new Set(['/sidecars/field-guide-fishing/tidewater-coast.html'])
  }), false);
});
