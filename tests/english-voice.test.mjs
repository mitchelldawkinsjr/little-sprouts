import test from 'node:test';
import assert from 'node:assert/strict';
import { englishVoice } from '../lib/english-voice.mjs';

const v = (name, lang, localService = true, def = false) => ({ name, lang, localService, default: def });

test('English voice: never a Japanese one, even when it is the default', () => {
  const synth = { getVoices: () => [v('Kyoko', 'ja-JP', true, true), v('Daniel', 'en-GB'), v('Samantha', 'en-US')] };
  assert.equal(englishVoice(synth).name, 'Samantha');
});

test('English voice: any English when there is no US voice, null when none', () => {
  assert.equal(englishVoice({ getVoices: () => [v('Kyoko', 'ja-JP'), v('Daniel', 'en_GB')] }).name, 'Daniel');
  assert.equal(englishVoice({ getVoices: () => [v('Kyoko', 'ja-JP')] }), null);
  assert.equal(englishVoice({ getVoices: () => { throw new Error('no'); } }), null);
});
