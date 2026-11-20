import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../lib/fire-updater.js', import.meta.url), 'utf8');

test('Fire updater mounts in Parents Corner and shows automatic install errors without overlapping checks', async () => {
  const alerts = [];
  const listeners = {};
  const buttons = [];
  let timer;
  let click;
  let checks = 0;
  let finishInstall;
  const button = { addEventListener(name, fn) { assert.equal(name, 'click'); click = fn; } };
  const parentUpdates = { hidden: true, append: child => buttons.push(child) };
  runInNewContext(script, {
    window: { Capacitor: { Plugins: { SproutsUpdater: {
      check: async () => {
        checks++;
        return checks === 1
          ? { wifi: true, available: true, version: '1.0.12', url: 'u', digest: 'd' }
          : { wifi: true, available: false };
      },
      install: () => new Promise((_, reject) => { finishInstall = () => reject(new Error('Allow Little Sprouts to install unknown apps')); })
    } } } },
    document: {
      hidden: false,
      getElementById(id) { assert.equal(id, 'parentAppUpdates'); return parentUpdates; },
      createElement(tag) { assert.equal(tag, 'button'); return button; },
      addEventListener: (name, fn) => { listeners[name] = fn; }
    },
    setTimeout: fn => { timer = fn; },
    alert: message => alerts.push(message),
    confirm: () => true
  });

  assert.deepEqual(buttons, [button]);
  assert.equal(parentUpdates.hidden, false);
  assert.equal(button.textContent, 'Check for app updates');

  const pending = timer();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(button.disabled, true);
  listeners.visibilitychange(); // coming back from Settings mid-install
  await click();
  assert.equal(checks, 1);
  finishInstall();
  await pending;
  assert.deepEqual(alerts, ['Update did not install: Allow Little Sprouts to install unknown apps']);
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, 'Check for app updates');
  click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(checks, 2);
  assert.equal(alerts.at(-1), 'Little Sprouts is up to date.');
});

test('the updater leaves the Parents Corner update section hidden outside the APK', () => {
  assert.match(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), /id="parentAppUpdates" hidden/);
  // A browser without the native bridge should never touch the DOM or start a check.
  runInNewContext(script, { window: {} });
});
