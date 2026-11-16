import assert from 'node:assert/strict';
import test from 'node:test';
import { createDiagnostics } from '../lib/diagnostics.mjs';

function fixtures() {
  const sent = [];
  const saved = new Map();
  const storage = { getItem: k => saved.get(k), setItem: (k, v) => saved.set(k, v) };
  let net = false, time = 100, response = 204;
  const client = () => createDiagnostics({
    storage, online: () => net, now: () => time,
    send: async rows => { sent.push(rows); return response; }
  });
  return { client, sent, storage, online: () => { net = true; }, change: n => { time += n; }, status: n => { response = n; } };
}

test('default diagnostics stay local, including when online', async () => {
  const f = fixtures();
  f.online();
  const client = f.client();
  client.record('app_ready', 440);
  client.record('learner_name', 0);
  client.record('js_error', 'a private error');
  client.record(['js_error'], 0);
  await client.flush();
  assert.equal(client.snapshot().latest.app_ready, 440);
  assert.equal(client.snapshot().local.js_error, 0);
  assert.equal(client.snapshot().pending, 0);
  assert.deepEqual(f.sent, []);
});

test('opted-in queue survives a reload offline and retries after a transient response', async () => {
  const f = fixtures();
  const first = f.client();
  first.setEnabled(true);
  first.record('app_ready', 620);
  first.record('offline_partial');
  await first.flush();
  const reload = f.client();
  assert.equal(reload.snapshot().pending, 2);
  f.online();
  f.status(503);
  await reload.flush();
  assert.equal(reload.snapshot().pending, 2);
  f.status(204);
  await reload.flush();
  assert.deepEqual(f.sent, [
    [['app_ready', 620], ['offline_partial', 0]],
    [['app_ready', 620], ['offline_partial', 0]]
  ]);
  assert.equal(reload.snapshot().pending, 0);
});

test('queue is bounded and expires old signals, opt-out cancels a scheduled send', async () => {
  const f = fixtures();
  const client = f.client();
  client.setEnabled(true);
  for (let i = 0; i < 50; i++) client.record('sidecar_ready', i);
  assert.equal(client.snapshot().pending, 48);
  f.change(86400001);
  assert.equal(client.snapshot().pending, 0);
  client.record('worker_failed');
  f.online();
  const flush = client.flush();
  client.setEnabled(false);
  await flush;
  assert.deepEqual(f.sent, []);
  assert.equal(f.client().snapshot().enabled, false);
  assert.equal(f.client().snapshot().pending, 0);
});
