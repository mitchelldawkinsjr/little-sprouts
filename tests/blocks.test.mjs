import test from 'node:test';
import assert from 'node:assert/strict';
import { chestDistance, goalFrom, localQuestion, nextLetterOk, normalizeAsk, readSave } from '../sidecars/blocks/quiz.mjs';
import { readPad } from '../lib/pad-core.mjs';

test('a host ask becomes a gift-box question without leaking which answer is right', () => {
  const ask = normalizeAsk({ round: 2, prompt: 'Find red.', choices: [{ label: 'red', ok: true, fill: '#f00' }, { label: 'blue', ok: false }], freeEvery: 5 });
  assert.equal(ask.prompt, 'Find red.');
  assert.equal(ask.choices.length, 2);
  assert.equal('ok' in ask.choices[0], false);
  assert.equal(goalFrom(ask), 5);
  assert.equal(normalizeAsk({ choices: [{ label: 'one' }] }), null);
  const spell = normalizeAsk({ kind: 'spell', word: 'cat', letters: ['t', 'c', 'a'], choices: [{ label: 'cat' }] });
  assert.equal(spell.kind, 'spell');
});

test('spelling checks the next letter only', () => {
  assert.equal(nextLetterOk('cat', '', 'C'), true);
  assert.equal(nextLetterOk('cat', 'c', 't'), false);
  assert.equal(nextLetterOk('cat', 'cat', 'a'), false);
});

test('gift boxes move farther out, and sample questions have one right answer', () => {
  assert.ok(chestDistance(4) > chestDistance(0));
  assert.ok(chestDistance(50) <= 34);
  for (let i = 0; i < 8; i++) assert.equal(localQuestion(Math.random, i).choices.filter(c => c.ok).length, 1);
});

test('a damaged save is cleaned up instead of breaking the world', () => {
  const opts = { starter: ['grass', 'dirt'], all: ['grass', 'dirt', 'red'] };
  assert.equal(readSave('not json', opts), null);
  const save = readSave(JSON.stringify({ edits: [['1.2.3', 'red'], ['bad', 'red'], ['4.5.6', 'lava'], ['7.8.9', '']], pos: [1, 2, 3], unlocked: ['red', 'lava'], pitch: 9 }), opts);
  assert.deepEqual(save.edits, [['1.2.3', 'red'], ['7.8.9', '']]);
  assert.ok(save.unlocked.includes('grass') && save.unlocked.includes('red') && !save.unlocked.includes('lava'));
  assert.equal(save.pitch, 1.4);
});

test('the pad reader exposes X, shoulders, and the left trigger for games that read the pad themselves', () => {
  const pad = readPad({ axes: [], buttons: { 2: { pressed: true, value: 1 }, 4: { pressed: true, value: 1 }, 6: { pressed: false, value: 0.7 } } });
  assert.equal(pad.x, 1);
  assert.equal(pad.lb, 1);
  assert.equal(pad.rb, 0);
  assert.equal(pad.lt, 0.7);
});
