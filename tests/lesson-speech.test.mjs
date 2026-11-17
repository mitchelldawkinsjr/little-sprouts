import test from 'node:test';
import assert from 'node:assert/strict';

const ORIGIN = 'https://localhost';

function installGlobals(t, values) {
  const saved = Object.fromEntries(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  t.after(() => {
    for (const [key, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
}

for (const name of ['station-scout', 'paint-the-plan', 'field-guide-fishing']) {
  const { speak } = await import(`../sidecars/${name}/lessons/lesson.mjs`);

  test(`${name}: embedded lesson speech reaches the parent even without WebView speech support`, t => {
    const messages = [];
    const frame = { parent: { postMessage: (...args) => messages.push(args) } };
    installGlobals(t, {
      window: frame,
      location: { origin: ORIGIN },
      speechSynthesis: undefined,
      SpeechSynthesisUtterance: class { constructor() { throw new Error('The iframe must not synthesize APK speech'); } }
    });
    speak('Which flower is blue?');
    speak('');
    assert.deepEqual(messages, [[{ source: 'sprouts-sidecar', type: 'say', text: 'Which flower is blue?' }, ORIGIN]]);
  });

  test(`${name}: embedded lesson speech bypasses browser synthesis when it is present`, t => {
    const messages = [];
    installGlobals(t, {
      window: { parent: { postMessage: (...args) => messages.push(args) } },
      location: { origin: ORIGIN },
      speechSynthesis: {
        getVoices() { throw new Error('Embedded lessons must use the parent voice service'); },
        cancel() { throw new Error('Embedded lessons must not cancel browser speech'); },
        speak() { throw new Error('Embedded lessons must not call browser speech'); }
      },
      SpeechSynthesisUtterance: class { constructor() { throw new Error('Unexpected browser utterance'); } }
    });
    speak('Find four fish.');
    assert.deepEqual(messages, [[{ source: 'sprouts-sidecar', type: 'say', text: 'Find four fish.' }, ORIGIN]]);
  });

  test(`${name}: standalone lesson keeps its local English browser voice`, t => {
    const spoken = [];
    const english = { localService: true, lang: 'en-US' };
    let cancellations = 0;
    const standalone = {};
    standalone.parent = standalone;
    installGlobals(t, {
      window: standalone,
      location: { origin: ORIGIN },
      speechSynthesis: {
        getVoices: () => [{ localService: true, lang: 'ja-JP' }, english],
        cancel() { cancellations++; },
        speak(line) { spoken.push(line); }
      },
      SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } }
    });
    speak('Choose the right answer.');
    assert.equal(cancellations, 1);
    assert.equal(spoken.length, 1);
    assert.equal(spoken[0].text, 'Choose the right answer.');
    assert.equal(spoken[0].lang, 'en-US');
    assert.equal(spoken[0].voice, english);
    assert.equal(spoken[0].rate, .88);
  });
}
