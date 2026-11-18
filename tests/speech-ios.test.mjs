import test from 'node:test';
import assert from 'node:assert/strict';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const tone = () => Float32Array.from({ length: 4800 }, (_, i) => .3 * Math.sin(i * 2 * Math.PI * 200 / 24000));
let copies = 0;

// Model WebKit's independent iOS speech gate: only speak() inside a trusted
// gesture removes it. A delayed speak() is silently ignored, without an error.
async function iphone() {
  delete globalThis.Capacitor;
  delete globalThis.window;
  let gesture = false, unlocked = false;
  const events = new Map(), contexts = [], nodes = [], spoken = [], started = [];
  const usage = { resumes: 0, workers: 0 };
  globalThis.document = {
    hidden: false,
    addEventListener(type, listener) {
      const list = events.get(type) || [];
      list.push(listener);
      events.set(type, list);
    }
  };
  globalThis.location = { hostname: 'app.local', search: '' };
  globalThis.AudioContext = class {
    state = 'suspended';
    destination = {};
    pending = [];
    constructor() { contexts.push(this); }
    resume() {
      if (gesture) {
        this.state = 'running';
        this.pending.splice(0).forEach(resolve => resolve());
        return Promise.resolve();
      }
      return new Promise(resolve => this.pending.push(resolve));
    }
    createBuffer(channels, length, rate) {
      return { duration: length / rate, getChannelData: () => new Float32Array(length) };
    }
    createGain() { return { gain: { value: 1 }, connect() {} }; }
    createBufferSource() {
      const node = { connect() {}, start() { nodes.push(node); }, stop() {} };
      return node;
    }
    async decodeAudioData() { return { sampleRate: 24000, getChannelData: tone }; }
  };
  globalThis.speechSynthesis = {
    paused: false,
    getVoices: () => [],
    cancel() {},
    resume() { this.paused = false; usage.resumes++; },
    speak(utterance) {
      spoken.push(utterance);
      if (gesture) unlocked = true;
      if (!unlocked || this.paused || !utterance.text) return;
      started.push(utterance);
      queueMicrotask(() => utterance.onstart?.());
    }
  };
  globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  globalThis.Worker = class {
    constructor() { usage.workers++; }
    postMessage(message) {
      if (message.type === 'SYNTHESIZE') queueMicrotask(() => this.onmessage({ data: { type: 'ERROR', kind: 'miss', id: message.id } }));
    }
  };
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  const speech = await import(`../lib/speech.js?ios-test=${++copies}`);
  function dispatch(type, isTrusted = true) {
    gesture = isTrusted && ['touchend', 'click', 'keydown'].includes(type);
    for (const listener of events.get(type) || []) listener({ type, isTrusted });
    gesture = false;
  }
  return { speech, contexts, nodes, spoken, started, usage, dispatch };
}

for (const event of ['touchend', 'click', 'keydown']) {
  test(`${event} unlocks delayed iPhone questions independently of Web Audio`, async () => {
    const { speech, contexts, started, dispatch } = await iphone();
    dispatch(event);
    // The lookup completes after the gesture, just like an IndexedDB cache miss.
    const line = speech.speakAndWait('A custom question without a shipped recording.');
    await flush();
    assert.equal(contexts[0].state, 'running');
    assert.equal(started.length, 1, 'iOS must accept the asynchronous browser fallback');
    started[0].onend();
    assert.deepEqual(await line, { status: 'completed', engine: 'browser' });
  });
}

test('synthetic clicks cannot unlock either iPhone audio engine', async () => {
  const { contexts, spoken, dispatch } = await iphone();
  dispatch('click', false);
  assert.equal(contexts.length, 0);
  assert.equal(spoken.length, 0);
});

test('repeated taps unlock speech once without canceling the question already playing', async () => {
  const { speech, spoken, started, dispatch } = await iphone();
  dispatch('touchend');
  const line = speech.speakAndWait('One question with several taps.');
  await flush();
  dispatch('click');
  dispatch('touchend');
  assert.equal(spoken.filter(utterance => !utterance.text).length, 1);
  assert.equal(started.length, 1);
  started[0].onend();
  assert.equal((await line).status, 'completed');
});

test('a paused browser speech service resumes before the next question', async () => {
  const { speech, started, usage, dispatch } = await iphone();
  dispatch('touchend');
  globalThis.speechSynthesis.paused = true;
  const line = speech.speakAndWait('A question after the speech service was paused.');
  await flush();
  assert.equal(usage.resumes, 1);
  assert.equal(started.length, 1);
  started[0].onend();
  assert.equal((await line).status, 'completed');
});

test('Safari cancellation callbacks from an abandoned attempt cannot cancel its retry', async () => {
  const { speech, started, dispatch } = await iphone();
  dispatch('touchend');
  const synth = globalThis.speechSynthesis;
  const speak = synth.speak;
  let abandoned;
  synth.speak = function (line) {
    if (!abandoned) {
      abandoned = line;
      queueMicrotask(() => line.onend()); // Service ended the attempt before starting it.
    } else speak.call(this, line);
  };
  synth.cancel = () => abandoned?.onerror({ error: 'canceled' });
  const line = speech.speakAndWait('Retry after a Safari service startup failure.');
  await new Promise(resolve => setTimeout(resolve, 450));
  assert.equal(started.length, 1);
  abandoned.onend();
  assert.equal(speech.getSpeechStatus().metrics.completed, 0);
  started[0].onend();
  assert.equal((await line).status, 'completed');
});

test('a synchronous browser start retains its completion timeout', async t => {
  const { speech, dispatch } = await iphone();
  dispatch('touchend');
  globalThis.speechSynthesis.speak = line => line.onstart?.();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const line = speech.speakAndWait('An unfinished line.');
  // The fake cache miss and onstart run through microtasks.
  await Promise.resolve();
  await Promise.resolve();
  t.mock.timers.tick(10000);
  assert.equal((await line).status, 'failed');
  assert.equal(speech.getSpeechStatus().metrics.completed, 0);
});

test('a touch unlocks shipped recordings before their asynchronous fetch and decode', async () => {
  const { speech, nodes, usage, dispatch } = await iphone();
  dispatch('touchend');
  const line = speech.speakAndWait('Try another one.');
  await flush();
  assert.equal(nodes.length, 1);
  assert.equal(usage.workers, 0);
  nodes[0].onended();
  assert.deepEqual(await line, { status: 'completed', engine: 'kokoro' });
});

test('returning to the iPhone app replays an interrupted recording after another tap', async () => {
  const { speech, contexts, nodes, dispatch } = await iphone();
  dispatch('touchend');
  const first = speech.speakAndWait('Try another one.');
  await flush();
  globalThis.document.hidden = true;
  dispatch('visibilitychange');
  assert.equal((await first).status, 'interrupted');
  contexts[0].state = 'interrupted';
  globalThis.document.hidden = false;
  dispatch('visibilitychange');
  dispatch('touchend');
  await flush();
  assert.equal(contexts[0].state, 'running');
  assert.equal(nodes.length, 2);
  nodes[0].onended();
  assert.equal(speech.getSpeechStatus().metrics.completed, 0, 'stale completion cannot finish the replay');
  nodes[1].onended();
  assert.equal(speech.getSpeechStatus().metrics.completed, 1);
});

test('a closed iPhone audio context is replaced on the next tap', async () => {
  const { speech, contexts, nodes, dispatch } = await iphone();
  dispatch('touchend');
  contexts[0].state = 'closed';
  dispatch('click');
  const line = speech.speakAndWait('Try another one.');
  await flush();
  assert.equal(contexts.length, 2);
  assert.equal(contexts[1].state, 'running');
  nodes[0].onended();
  assert.equal((await line).status, 'completed');
});
