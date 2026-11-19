import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

// Resolve bare 'three' to the vendored copy, as the app's import map does in the browser.
const three = new URL('../vendor/three/build/three.module.js', import.meta.url).href;
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) { return s === 'three' ? { url: ${JSON.stringify(three)}, shortCircuit: true } : next(s, c); }`));

test('Garden chase loads its 3D view only when a round starts, and keeps the flat view as the fallback', () => {
  const chase = readFileSync(new URL('../games/chase.js', import.meta.url), 'utf8');
  assert.doesNotMatch(chase, /^import .*three/m, 'no three.js at app start');
  assert.match(chase, /import\('\.\/chase3d\.js\?v=/);
  assert.match(chase, /goFlat/);
  assert.match(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), /"three": "\.\/vendor\/three\/build\/three\.module\.js\?v=r187"/);
});

test('the 3D view centres the maze and picks a lighter look on weaker devices', async () => {
  const { CELL, chaseLook, toWorld } = await import('../games/chase3d.js');
  // A 19 x 21 maze: the middle cell sits at the origin, the corners half a maze out.
  assert.deepEqual(toWorld(9 * 10, 10 * 10, 10, 19, 21), { x: 0, z: 0 });
  assert.deepEqual(toWorld(0, 0, 10, 19, 21), { x: -9 * CELL, z: -10 * CELL });
  const env = (nav, coarse = false) => ({ navigator: nav, matchMedia: () => ({ matches: coarse }) });
  assert.equal(chaseLook(env({ deviceMemory: 8, hardwareConcurrency: 8 })), 'grass');
  assert.equal(chaseLook(env({ deviceMemory: 8, hardwareConcurrency: 8 }, true)), 'grass-low', 'a tablet');
  assert.equal(chaseLook(env({ deviceMemory: 4, hardwareConcurrency: 8 })), 'grass-low');
  assert.equal(chaseLook(env({ deviceMemory: 2 })), 'boxes');
  assert.equal(chaseLook(env({ userAgent: 'Mozilla/5.0 (Linux; Android 9; KFTRWI) Silk/120' })), 'boxes', 'Fire tablet');
});
