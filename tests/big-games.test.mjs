import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { BIG_PATHS, bigGamesOn, installedApp, nativeApp, setBigGames } from '../lib/big-games.mjs';

const store = (init = {}) => {
  const data = { ...init };
  return { getItem: k => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
};
const env = ({ standalone = false, native = false } = {}, storage = store()) => ({
  localStorage: storage,
  matchMedia: q => ({ matches: standalone && q.includes('standalone') }),
  navigator: {},
  Capacitor: native ? { isNativePlatform: () => true } : undefined
});

test('Big games are on in a browser tab, off once installed, and never in the tablet app', () => {
  assert.equal(bigGamesOn(env()), true, 'browser tab');
  assert.equal(bigGamesOn(env({ standalone: true })), false, 'home-screen app');
  assert.equal(bigGamesOn(env({ native: true })), false, 'Fire tablet app');
  assert.equal(installedApp(env({ standalone: true })), true);
  assert.equal(nativeApp(env({ native: true })), true);
});

test("a parent's choice wins, except in the tablet app, which doesn't carry them", () => {
  const s = store();
  setBigGames(true, s);
  assert.equal(bigGamesOn(env({ standalone: true }, s)), true);
  setBigGames(false, s);
  assert.equal(bigGamesOn(env({}, s)), false);
  assert.equal(bigGamesOn(env({ native: true }, store({ 'sprouts-big-games': 'on' }))), false);
});

test('the shelf, the service worker, and the tablet app build all leave out the same two games', () => {
  const sidecar = readFileSync(new URL('../lib/sidecar.js', import.meta.url), 'utf8');
  for (const id of ['rally', 'fishing']) assert.match(sidecar, new RegExp(`id: '${id}',\\n[^}]*?big: true`), id);
  assert.match(sidecar, /if \(game\.big && !bigGamesOn\(\)\) return null;/);
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.ok(sw.includes(`const BIG_GAMES = ${BIG_PATHS};`), 'sw.js keeps the same folders');
  assert.match(sw, /if \(!big && BIG_GAMES\.test\(path\)\) continue;/);
  assert.match(sw, /big: event\.data\.big === true/);
  assert.match(readFileSync(new URL('../lib/offline-warm.mjs', import.meta.url), 'utf8'), /big: bigGamesOn\(\)/);
  assert.match(readFileSync(new URL('../tools/fire-tablet/stage.py', import.meta.url), 'utf8'), /BIG_GAMES = \{"rally", "field-guide-fishing"\}/);
  assert.ok(BIG_PATHS.test('./sidecars/rally/index.html') && BIG_PATHS.test('./sidecars/field-guide-fishing/a.js'));
  assert.ok(!BIG_PATHS.test('./sidecars/skybound/index.html'));
});
