import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHash } from '../app/router.mjs';

test('parseHash maps empty and home to home', () => {
  assert.deepEqual(parseHash(''), { view: 'home' });
  assert.deepEqual(parseHash('#'), { view: 'home' });
  assert.deepEqual(parseHash('#home'), { view: 'home' });
  assert.deepEqual(parseHash('home'), { view: 'home' });
});

test('parseHash maps play modes', () => {
  assert.deepEqual(parseHash('#play/hop'), { view: 'play', mode: 'hop' });
  assert.deepEqual(parseHash('play/catch'), { view: 'play', mode: 'catch' });
});

test('parseHash maps welcome and settings', () => {
  assert.deepEqual(parseHash('#welcome'), { view: 'welcome' });
  assert.deepEqual(parseHash('#settings'), { view: 'settings' });
});

test('parseHash falls back to home for junk', () => {
  assert.deepEqual(parseHash('#nope'), { view: 'home' });
  assert.deepEqual(parseHash('#play'), { view: 'home' });
  assert.deepEqual(parseHash('#play/'), { view: 'home' });
});
