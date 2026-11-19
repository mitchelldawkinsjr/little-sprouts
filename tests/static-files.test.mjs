import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { gunzipSync } from 'node:zlib';
import { inventory } from '../tools/static-files.mjs';

test('static build emits a catalog separately from complete offline stamps and gzips original bytes', t => {
  const root = mkdtempSync(join(tmpdir(), 'sprouts-build-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const add = (path, content = 'abc') => {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  };
  const js = 'export const data = "' + 'pack '.repeat(2000) + '";';
  add('app.js', js);
  add('index.html');
  add('lib/sidecar.js', "const a = [{src: 'sidecars/dash/index.html?x=1'}, {src: 'sidecars/rally/index.html?v=2'}, {src: 'sidecars/field-guide-fishing/tidewater-coast.html?v=3'}]");
  add('sidecars/dash/index.html');
  add('sidecars/field-guide-fishing/tidewater-coast.html');
  add('for-parents/parents.css');
  const build = inventory(root);
  assert.deepEqual(build.sidecars(), ['sidecars/dash/index.html', 'sidecars/field-guide-fishing/tidewater-coast.html']);
  const offline = build.offline();
  assert.ok(offline['./index.html']);
  assert.ok(offline['./sidecars/dash/index.html']);
  // Tidewater is listed; the service worker saves it only for Full on a WebGPU device.
  assert.ok(offline['./sidecars/field-guide-fishing/tidewater-coast.html']);
  assert.ok(!offline['./for-parents/parents.css']);
  const metrics = build.compress();
  assert.equal(metrics.files, 1);
  assert.equal(gunzipSync(readFileSync(join(root, 'app.js.gz'))).toString(), js);
  assert.deepEqual(build.offline(), offline);
});
