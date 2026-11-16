import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { operations } from './operations.mjs';

test('diagnostics only accepts the fixed schema and produces low-cardinality metrics', async t => {
  const origin = 'https://sprouts.example';
  const logs = [];
  const ops = operations({ origin, measurementId: 'G-TEST123', log: line => logs.push(line) });
  const server = createServer(async (req, res) => {
    if (!await ops(req, res)) res.writeHead(404).end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const request = (path, opts) => fetch(`http://127.0.0.1:${server.address().port}${path}`, opts);
  const post = (rows, from = origin) => request('/ops/diagnostics', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: from }, body: JSON.stringify(rows)
  });

  assert.equal((await request('/healthz')).status, 200);
  assert.deepEqual(await (await request('/for-parents/analytics.json')).json(), { measurementId: 'G-TEST123' });
  assert.equal((await post([['app_ready', 620], ['sidecar_ready', 240], ['offline_saved_kb', 14000]])).status, 204);
  assert.equal((await post([['app_ready', 620, 'name']])).status, 400);
  assert.equal((await post([['app_ready', 620]], 'https://other.example')).status, 403);
  assert.equal((await post([['app_ready', 'n'.repeat(3000)]])).status, 413);
  assert.equal((await post([['constructor', 0]])).status, 400);

  const metrics = await (await request('/metrics')).text();
  assert.match(metrics, /sprouts_telemetry_batches_total\{result="accepted"\} 1/);
  assert.match(metrics, /sprouts_telemetry_batches_total\{result="rejected"\} 4/);
  assert.match(metrics, /sprouts_app_ready_ms_bucket\{le="500"\} 0/);
  assert.match(metrics, /sprouts_app_ready_ms_bucket\{le="1000"\} 1/);
  assert.match(metrics, /sprouts_offline_saved_kb_sum 14000/);
  assert.deepEqual(logs.map(JSON.parse), [{ event: 'diagnostics_accepted', counts: { app_ready: 1, sidecar_ready: 1, offline_saved_kb: 1 } }]);
});
