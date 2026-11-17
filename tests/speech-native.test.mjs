import test from 'node:test';
import assert from 'node:assert/strict';
import { bakedPath, speakable } from '../lib/speech-core.mjs';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const tone = () => Float32Array.from({ length: 4800 }, (_, i) => .3 * Math.sin(i * 2 * Math.PI * 200 / 24000));
let copies = 0;

async function nativeSpeech({ lifecycle = false, missingBridge = false } = {}) {
  const calls = [];
  const nativeEvents = new Map();
  const stops = [];
  const usage = { workers: 0, browser: 0, audio: 0, fetches: 0, stopped: 0 };
  const plugin = {
    addListener(name, callback) {
      assert.ok(['speechStart', 'speechResume'].includes(name));
      const listeners = nativeEvents.get(name) || new Set();
      listeners.add(callback);
      nativeEvents.set(name, listeners);
      return Promise.resolve({ remove() { listeners.delete(callback); } });
    },
    speak(options) {
      let resolve, reject;
      const result = new Promise((yes, no) => { resolve = yes; reject = no; });
      calls.push({ options, resolve, reject });
      return result;
    },
    stop(options) { usage.stopped++; stops.push(options?.id); return Promise.resolve(); },
    prepare() { return Promise.resolve({ ready: true, engine: 'native', english: true, offline: true }); },
    status() { return Promise.resolve({ ready: true, engine: 'native', english: true, offline: true }); }
  };
  const capacitor = {
    isNativePlatform: () => true,
    getPlatform: () => 'android',
    Plugins: { SproutsSpeech: plugin },
    registerPlugin: name => { assert.equal(name, 'SproutsSpeech'); return plugin; }
  };
  if (missingBridge) {
    capacitor.Plugins = {};
    delete capacitor.registerPlugin;
  }
  globalThis.window = { Capacitor: capacitor };
  globalThis.Capacitor = capacitor;
  globalThis.Worker = class { constructor() { usage.workers++; throw new Error('Native speech must not need Kokoro'); } };
  globalThis.AudioContext = class { constructor() { usage.audio++; throw new Error('Native playback must not depend on Web Audio'); } };
  globalThis.speechSynthesis = { speak() { usage.browser++; }, cancel() {}, getVoices() { return []; } };
  globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  globalThis.fetch = async () => { usage.fetches++; throw new Error('Native clips must not fetch through WebView'); };
  globalThis.location = { hostname: 'app.local', search: '' };
  const events = new Map();
  if (lifecycle) {
    globalThis.document = {
      hidden: false,
      addEventListener(name, callback) {
        const listeners = events.get(name) || [];
        listeners.push(callback);
        events.set(name, listeners);
      }
    };
  } else delete globalThis.document;
  const speech = await import(`../lib/speech.js?native-test=${++copies}`);
  const start = (call, engine) => {
    for (const listener of nativeEvents.get('speechStart') || []) listener({ id: call.options.id, engine });
  };
  const resume = async () => {
    for (const listener of nativeEvents.get('speechResume') || []) listener({});
    await flush();
  };
  const visibility = async hidden => {
    globalThis.document.hidden = hidden;
    for (const listener of events.get('visibilitychange') || []) listener();
    await flush();
  };
  return { speech, plugin, calls, usage, start, visibility, resume, stops };
}

test('APK packaged clips and dynamic questions use native speech without WebView engines or downloads', async () => {
  const { speech, calls, usage, start } = await nativeSpeech();
  speech.warm('af_heart');
  speech.prefetchSpeech(['A custom question.']);
  const shipped = speech.speakAndWait('Try another one.', { voiceId: 'af_heart' });
  await flush();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.clipPath, bakedPath({ voice: 'af_heart', text: 'Try another one.' }));
  start(calls[0], 'native-file');
  assert.equal(speech.getSpeechStatus().speaking, 'native-file');
  calls[0].resolve({ status: 'completed', engine: 'native-file' });
  assert.deepEqual(await shipped, { status: 'completed', engine: 'native-file' });

  const dynamic = speech.speakAndWait('What is 7 × 8?', { voiceId: 'af_heart' });
  await flush();
  assert.equal(calls[1].options.text, speakable('What is 7 × 8?'));
  assert.ok(!calls[1].options.clipPath);
  start(calls[1], 'native-tts');
  calls[1].resolve({ status: 'completed', engine: 'native-tts' });
  assert.deepEqual(await dynamic, { status: 'completed', engine: 'native-tts' });
  assert.equal(usage.workers, 0);
  assert.equal(usage.browser, 0);
  assert.equal(usage.audio, 0);
  assert.equal(usage.fetches, 0);
});

test('native completion waits for the plugin and stale starts or results cannot complete the next question', async () => {
  const { speech, calls, start, stops } = await nativeSpeech();
  const first = speech.speakAndWait('An old question.');
  await flush();
  assert.equal(await Promise.race([first.then(() => 'settled'), pause(25).then(() => 'waiting')]), 'waiting');
  speech.stop();
  assert.equal((await first).status, 'interrupted');
  assert.deepEqual(stops, [calls[0].options.id]);

  const second = speech.speakAndWait('The current question.');
  await flush();
  assert.notEqual(calls[0].options.id, calls[1].options.id);
  start(calls[0], 'native-tts');
  calls[0].resolve({ status: 'completed', engine: 'native-tts' });
  await flush();
  assert.equal(speech.getSpeechStatus().speaking, null);
  assert.equal(await Promise.race([second.then(() => 'settled'), pause(25).then(() => 'waiting')]), 'waiting');
  start(calls[1], 'native-tts');
  assert.equal(speech.getSpeechStatus().speaking, 'native-tts');
  calls[1].resolve({ status: 'completed', engine: 'native-tts' });
  assert.equal((await second).status, 'completed');
});

test('a native engine failure is observable, does not leak prompt text, and a later replay can recover', async () => {
  const { speech, calls, usage, start } = await nativeSpeech();
  const privateText = 'Private learner prompt with a custom sight word.';
  const first = speech.speakAndWait(privateText);
  await flush();
  calls[0].resolve({ status: 'failed', engine: 'native-tts', reason: 'missing-english-voice' });
  assert.equal((await first).status, 'failed');
  const status = speech.getSpeechStatus();
  assert.equal(status.metrics.failed, 1);
  assert.ok(status.speechError || status.error || status.log.some(entry => entry.reason === 'missing-english-voice'));
  assert.ok(!JSON.stringify(status).includes(privateText));

  const retry = speech.speakAndWait(privateText);
  await flush();
  start(calls[1], 'native-tts');
  calls[1].resolve({ status: 'completed', engine: 'native-tts' });
  assert.equal((await retry).status, 'completed');
  assert.equal(usage.browser, 0, 'a failed native engine does not silently fall back to WebView speech');
});

test('the explicit speech retry reopens the failed question and clears its failure after completion', async () => {
  const { speech, calls, start } = await nativeSpeech();
  const first = speech.speakAndWait('Find the custom answer.');
  await flush();
  calls[0].resolve({ status: 'failed', engine: 'native-tts', reason: 'tts-start-timeout' });
  assert.equal((await first).status, 'failed');
  assert.equal(speech.getSpeechStatus().speechError, 'tts-start-timeout');
  const replay = speech.retrySpeech();
  await flush();
  assert.equal(calls[1].options.text, calls[0].options.text);
  assert.notEqual(calls[1].options.id, calls[0].options.id);
  start(calls[1], 'native-tts');
  calls[1].resolve({ status: 'completed', engine: 'native-tts' });
  assert.equal((await replay).status, 'completed');
  assert.equal(speech.getSpeechStatus().speechError, null);
  assert.equal((await speech.retrySpeech()).status, 'skipped');
});

test('returning from background replays the interrupted question and ignores its stale completion', async () => {
  const { speech, calls, start, visibility } = await nativeSpeech({ lifecycle: true });
  const line = speech.speakAndWait('The question interrupted by locking the tablet.');
  await flush();
  start(calls[0], 'native-tts');
  await visibility(true);
  assert.equal((await line).status, 'interrupted');
  await visibility(false);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].options.text, calls[0].options.text);
  calls[0].resolve({ status: 'completed', engine: 'native-tts' });
  await flush();
  assert.equal(speech.getSpeechStatus().speaking, null);
  start(calls[1], 'native-tts');
  calls[1].resolve({ status: 'completed', engine: 'native-tts' });
  await flush();
  assert.equal(speech.getSpeechStatus().metrics.completed, 1);
});

test('leaving the game while backgrounded cancels its automatic replay', async () => {
  const { speech, calls, visibility, resume } = await nativeSpeech({ lifecycle: true });
  const line = speech.speakAndWait('The previous game question.');
  await flush();
  await visibility(true);
  assert.equal((await line).status, 'interrupted');
  speech.stop();
  await visibility(false);
  await resume();
  assert.equal(calls.length, 1);
  calls[0].resolve({ status: 'interrupted', engine: 'native-tts' });
  await flush();
});

test('native audio-focus loss offers a retry that can complete the interrupted question', async () => {
  const { speech, calls, start } = await nativeSpeech();
  const first = speech.speakAndWait('The question interrupted by another audio app.');
  await flush();
  start(calls[0], 'native-tts');
  calls[0].resolve({ status: 'interrupted', engine: 'native-tts', reason: 'audio-focus-lost' });
  assert.equal((await first).status, 'interrupted');
  assert.equal(speech.getSpeechStatus().speechError, 'audio-focus-lost');
  const replay = speech.retrySpeech();
  await flush();
  assert.equal(calls.length, 2);
  assert.equal(calls[1].options.text, calls[0].options.text);
  start(calls[1], 'native-tts');
  calls[1].resolve({ status: 'completed', engine: 'native-tts' });
  assert.equal((await replay).status, 'completed');
  assert.equal(speech.getSpeechStatus().speechError, null);
});

test('native resume replays a background interruption even without a document visibility event', async () => {
  const { speech, calls, start, resume } = await nativeSpeech();
  const first = speech.speakAndWait('The native activity pause question.');
  await flush();
  start(calls[0], 'native-tts');
  calls[0].resolve({ status: 'interrupted', engine: 'native-tts', reason: 'background' });
  assert.equal((await first).status, 'interrupted');
  await resume();
  assert.equal(calls.length, 2);
  assert.equal(calls[1].options.text, calls[0].options.text);
  await resume();
  assert.equal(calls.length, 2, 'duplicate native resume cannot repeat the same prompt');
  start(calls[1], 'native-tts');
  calls[1].resolve({ status: 'completed', engine: 'native-tts' });
  await flush();
});

test('document and native resume signals replay the background question only once', async () => {
  const { speech, calls, start, visibility, resume } = await nativeSpeech({ lifecycle: true });
  const first = speech.speakAndWait('One question after both resume notifications.');
  await flush();
  start(calls[0], 'native-tts');
  await visibility(true);
  assert.equal((await first).status, 'interrupted');
  await visibility(false);
  await resume();
  assert.equal(calls.length, 2);
  start(calls[1], 'native-tts');
  calls[1].resolve({ status: 'completed', engine: 'native-tts' });
  await flush();
  await resume();
  assert.equal(calls.length, 2, 'a late native resume cannot replay the completed question');
  calls[0].resolve({ status: 'interrupted', engine: 'native-tts', reason: 'background' });
  await flush();
  await resume();
  assert.equal(calls.length, 2, 'a stale interruption callback cannot restore an old replay');
});

test('native bridge rejection settles as failure and leaves the queue usable', async () => {
  const { speech, calls, start } = await nativeSpeech();
  const first = speech.speakAndWait('First question.', { queue: true });
  const second = speech.speakAndWait('Second question.', { queue: true });
  await flush();
  calls[0].reject(new Error('Native bridge unavailable'));
  assert.equal((await first).status, 'failed');
  await flush();
  assert.equal(calls.length, 2);
  start(calls[1], 'native-tts');
  calls[1].resolve({ status: 'completed', engine: 'native-tts' });
  assert.equal((await second).status, 'completed');
});

test('an APK without the registered native plugin fails clearly without reverting to WebView speech', async () => {
  const { speech, calls, usage } = await nativeSpeech({ missingBridge: true });
  const result = await speech.speakAndWait('A question in an older APK.');
  assert.equal(result.status, 'failed');
  assert.equal(speech.getSpeechStatus().speechError, 'native-unavailable');
  assert.equal(calls.length, 0);
  assert.equal(usage.browser, 0);
  assert.equal(usage.workers, 0);
});

test('native preparation reports an unavailable offline English voice without loading Kokoro', async () => {
  const { speech, plugin, usage } = await nativeSpeech();
  plugin.prepare = async () => ({ ready: false, english: false, offline: false, reason: 'missing-english-voice' });
  assert.deepEqual(await speech.prepareSpeech(), { status: 'failed', error: 'missing-english-voice' });
  assert.deepEqual(speech.getSpeechStatus().nativeInfo, { ready: false, english: false, offline: false, reason: 'missing-english-voice' });
  assert.equal(usage.workers, 0);
  assert.equal(usage.fetches, 0);
});

test('diagnostics sanitize native errors that contain untrusted prompt text', async () => {
  const { speech, calls } = await nativeSpeech();
  const text = 'A private reading question.';
  const line = speech.speakAndWait(text);
  await flush();
  calls[0].resolve({ status: 'failed', engine: 'native-tts', reason: `Failed while saying ${text}` });
  assert.equal((await line).status, 'failed');
  const status = speech.getSpeechStatus();
  assert.equal(status.speechError, 'native-speech-failed');
  assert.ok(!JSON.stringify(status).includes(text));
});

async function browserSpeech() {
  delete globalThis.Capacitor;
  delete globalThis.window;
  delete globalThis.document;
  const workers = [], contexts = [], sources = [];
  globalThis.Worker = class {
    constructor() { this.sent = []; workers.push(this); }
    postMessage(data) { this.sent.push(data); }
    reply(data) { this.onmessage({ data }); }
  };
  globalThis.AudioContext = class {
    constructor() { this.state = 'running'; this.destination = {}; contexts.push(this); }
    resume() { return Promise.resolve(); }
    createBuffer(channels, length, rate) {
      return { duration: length / rate, getChannelData: () => new Float32Array(length) };
    }
    createGain() { return { gain: { value: 1 }, connect() {} }; }
    createBufferSource() {
      const source = { connect() {}, start() { sources.push(source); }, stop() { source.stopped = true; } };
      return source;
    }
  };
  const speech = await import(`../lib/speech.js?browser-health-test=${++copies}`);
  speech.warm('af_heart', { lines: [] });
  workers[0].reply({ type: 'READY', loadMs: 1 });
  const deliver = () => {
    const req = workers[0].sent.findLast(message => message.type === 'SYNTHESIZE');
    workers[0].reply({ type: 'AUDIO', id: req.id, text: req.text, voice: req.voice, speed: req.speed, samples: tone(), rate: 24000, source: 'model' });
  };
  return { speech, contexts, sources, deliver };
}

test('a suspended Web Audio source that never ends fails rather than claiming completion', async () => {
  const { speech, contexts, sources, deliver } = await browserSpeech();
  const line = speech.speakAndWait('A dynamic browser question.', { fallback: 'never' });
  deliver();
  await flush();
  assert.equal(sources.length, 1);
  contexts[0].state = 'suspended';
  const result = await line;
  assert.equal(result.status, 'failed');
  assert.equal(speech.getSpeechStatus().metrics.completed, 0);
});

test('a closed Web Audio context is replaced before the next question', async () => {
  const { speech, contexts, sources, deliver } = await browserSpeech();
  const first = speech.speakAndWait('A first browser question.', { fallback: 'never' });
  deliver();
  await flush();
  sources[0].onended();
  assert.equal((await first).status, 'completed');
  contexts[0].state = 'closed';
  const next = speech.speakAndWait('A different browser question.', { fallback: 'never' });
  deliver();
  await flush();
  assert.equal(contexts.length, 2);
  assert.equal(contexts[1].state, 'running');
  assert.equal(sources.length, 2);
  sources[1].onended();
  assert.equal((await next).status, 'completed');
});
