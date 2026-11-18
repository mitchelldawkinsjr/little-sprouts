import test from 'node:test';
import assert from 'node:assert/strict';
import { tune } from '../lib/game-sound.mjs';

test('each game gets its own steady, friendly loop', () => {
  const a = tune('hop');
  assert.deepEqual(tune('hop'), a, 'same game, same tune');
  assert.notDeepEqual(tune('mole'), a, 'different games sound different');
  for (const name of ['hop', 'mole', 'gulp', 'canyon-pods', 'quickmath']) {
    const { bpm, melody, bass } = tune(name);
    assert.ok(bpm >= 84 && bpm <= 108, `${name} tempo stays calm`);
    assert.equal(melody.length, 16);
    assert.equal(bass.length, 8);
    assert.notEqual(melody[0], null, 'the loop starts on a note');
    const notes = melody.filter(n => n != null);
    assert.ok(notes.length >= 8, `${name} is more tune than rest`);
    for (const n of notes) assert.ok(Number.isInteger(n) && n >= 60 && n <= 96, `${name} note ${n} in a kid-friendly range`);
    const inKey = key => [...notes, ...bass].every(n => [0, 2, 4, 7, 9].includes((n - key + 120) % 12));
    assert.ok([60, 62, 65, 67].some(inKey), `${name} stays on one pentatonic scale`);
  }
});
