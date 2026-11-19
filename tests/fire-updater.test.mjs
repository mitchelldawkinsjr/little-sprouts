import assert from 'node:assert/strict';
import test from 'node:test';

test('Fire updater shows install errors after an automatic check and never overlaps checks', async () => {
  const alerts = [];
  const listeners = {};
  let timer;
  let checks = 0;
  let finishInstall;
  const button = { style: {}, addEventListener() {} };
  globalThis.window = { Capacitor: { Plugins: { SproutsUpdater: {
    check: async () => { checks++; return { wifi: true, available: true, version: '1.0.12', url: 'u', digest: 'd' }; },
    install: () => new Promise((_, reject) => { finishInstall = () => reject(new Error('Allow Little Sprouts to install unknown apps')); })
  } } } };
  globalThis.document = {
    hidden: false,
    createElement: () => button,
    body: { append() {} },
    addEventListener: (name, fn) => { listeners[name] = fn; }
  };
  globalThis.setTimeout = fn => { timer = fn; };
  globalThis.alert = message => alerts.push(message);
  globalThis.confirm = () => true;
  await import(`../lib/fire-updater.js?t=${Date.now()}`);

  timer(); // the automatic launch check
  await new Promise(resolve => setImmediate(resolve));
  listeners.visibilitychange(); // coming back from Settings mid-install
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(checks, 1);
  finishInstall();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(alerts, ['Update did not install: Allow Little Sprouts to install unknown apps']);
  listeners.visibilitychange();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(checks, 2);
});
