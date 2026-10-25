import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CACHE_VERSION,
  chooseEngine,
  clipKey,
  contextFor,
  createQueue,
  currentKey,
  evictionPlan,
  retryDelay,
  settler,
  speakable,
  usable,
  voiceFor
} from './speech-core.mjs';

const tone = (n = 4800) => Float32Array.from({ length: n }, (_, i) => 0.3 * Math.sin(i * 2 * Math.PI * 200 / 24000));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const flush = () => pause(0);

test('clip keys separate voice, speed, and model version', () => {
  const a = clipKey({ voice: 'af_heart', text: 'Hi.' });
  assert.notEqual(a, clipKey({ voice: 'bf_emma', text: 'Hi.' }));
  assert.notEqual(a, clipKey({ voice: 'af_heart', text: 'Hi.', speed: 0.9 }));
  assert.ok(a.startsWith(`v${CACHE_VERSION}|`));
  assert.ok(currentKey(a));
  assert.equal(currentKey('af_heart\n1\nHi.'), false);
});

test('eviction drops old-format clips first, then the least recently heard', () => {
  const fresh = at => ({ key: clipKey({ voice: 'af_heart', text: `line ${at}` }), at });
  const rows = [fresh(5), { key: 'af_heart\n1\nold', at: 99 }, fresh(1), fresh(3)];
  assert.deepEqual(evictionPlan(rows, 2), ['af_heart\n1\nold', fresh(1).key]);
  assert.deepEqual(evictionPlan([fresh(1)], 5), []);
});

test('engine choice waits for a working Kokoro and only uses the browser voice for readiness or failure', () => {
  assert.equal(chooseEngine({ engine: 'ready', fallback: 'not-ready', browser: true }), 'kokoro');
  assert.equal(chooseEngine({ engine: 'loading', fallback: 'not-ready', browser: true }), 'cached');
  assert.equal(chooseEngine({ engine: 'loading', fallback: 'on-error', browser: true }), 'kokoro');
  assert.equal(chooseEngine({ engine: 'idle', fallback: 'never', browser: true }), 'kokoro');
  assert.equal(chooseEngine({ engine: 'failed', fallback: 'on-error', browser: true }), 'cached');
  assert.equal(chooseEngine({ engine: 'failed', fallback: 'on-error', browser: true, store: false }), 'browser');
  assert.equal(chooseEngine({ engine: 'unsupported', fallback: 'not-ready', browser: true }), 'browser');
  assert.equal(chooseEngine({ engine: 'unsupported', fallback: 'never', browser: true }), null);
  assert.equal(chooseEngine({ engine: 'unsupported', fallback: 'on-error', browser: false }), null);
});

test('retries back off and then stop', () => {
  assert.deepEqual([1, 2, 3, 4].map(retryDelay), [5000, 30000, 120000, null]);
});

test('a result settles only once', () => {
  const seen = [];
  const settle = settler(result => seen.push(result));
  assert.equal(settle('completed', 'kokoro'), true);
  assert.equal(settle('interrupted'), false);
  assert.deepEqual(seen, [{ status: 'completed', engine: 'kokoro' }]);
});

test('spoken text reads math, skip counting, and spelling aloud', () => {
  assert.equal(speakable('What is 7 × 8?'), 'What is 7 times 8?');
  assert.equal(speakable('3 + 4 = ?'), '3 plus 4 equals what?');
  assert.equal(speakable('9 − 2 = 7'), '9 minus 2 equals 7');
  assert.equal(speakable('Count by 2s: 2, 4, 6… What comes next?'), 'Count by twos: 2, 4, 6… What comes next?');
  assert.equal(speakable('Shapes & colors 🚙'), 'Shapes and colors');
  assert.equal(speakable('Ask Mr. Fox.'), 'Ask Mister Fox.');
  assert.equal(speakable('cat', { spell: true }), 'C, A, T.');
  assert.equal(speakable('  '), '');
  assert.equal(speakable('Drive to the word see.'), 'Drive to the word see.');
});

test('game modes map to roles, and hosts keep the grown-up voice unless character voices are on', () => {
  assert.equal(contextFor('words'), 'readingCoach');
  assert.equal(contextFor('path'), 'mathCoach');
  assert.equal(contextFor('race'), 'sportsHost');
  assert.equal(contextFor('hook'), 'gameHost');
  assert.equal(contextFor(undefined), 'narrator');
  assert.equal(voiceFor('sportsHost', 'af_bella', false), 'af_bella');
  assert.equal(voiceFor('sportsHost', 'af_bella', true), 'am_michael');
  assert.equal(voiceFor('readingCoach', 'af_bella', true), 'af_bella');
});

test('PCM checks pass speech and reject silence, static, and broken values', () => {
  assert.equal(usable(tone()), true);
  assert.equal(usable(new Float32Array(4800)), false);
  assert.equal(usable(Float32Array.from({ length: 4800 }, (_, i) => (i % 2 ? 0.5 : -0.5))), false);
  const broken = tone();
  broken[10] = NaN;
  assert.equal(usable(broken), false);
  assert.equal(usable(tone(100)), false);
});

test('the queue serves the newest foreground line first and never repeats a prefetch', () => {
  const q = createQueue(3);
  const job = (key, id) => ({ key, id });
  assert.equal(q.prefetch(job('a')), true);
  assert.equal(q.prefetch(job('a')), false);
  q.prefetch(job('b'));
  q.prefetch(job('n'), 'next');
  q.foreground(job('old', 1));
  q.foreground(job('new', 2));
  assert.equal(q.waiting, true);
  assert.equal(q.take().key, 'new');
  assert.equal(q.take().key, 'n');
  q.foreground(job('gone', 3));
  q.cancel(3);
  assert.equal(q.waiting, false);
  const a = q.take();
  q.requeue(a);
  assert.equal(q.take().key, 'a');
  assert.equal(q.take().key, 'b');
  assert.equal(q.take(), null);
});

// Browser stand-ins for speech.js. Each test loads a fresh copy so state does not carry over.
const workers = [];
const sources = [];
const synth = {
  spoken: [],
  cancel() {},
  speak(utterance) { this.spoken.push(utterance); }
};
class FakeWorker {
  constructor() {
    this.sent = [];
    workers.push(this);
  }
  postMessage(message) { this.sent.push(message); }
  terminate() { this.terminated = true; }
  reply(message) { this.onmessage({ data: message }); }
  last(type) { return this.sent.filter(m => m.type === type).at(-1); }
  count(type) { return this.sent.filter(m => m.type === type).length; }
}
class FakeAudio {
  state = 'running';
  destination = {};
  createBuffer(channels, length, rate) {
    const data = new Float32Array(length);
    return { duration: length / rate, getChannelData: () => data };
  }
  createBufferSource() {
    const node = { connect() {}, start() { node.started = true; sources.push(node); }, stop() { node.stopped = true; } };
    return node;
  }
  resume() { return Promise.resolve(); }
}
globalThis.Worker = FakeWorker;
globalThis.AudioContext = FakeAudio;
globalThis.speechSynthesis = synth;
globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };

let copies = 0;
async function fresh({ ready = false } = {}) {
  workers.length = 0;
  sources.length = 0;
  synth.spoken.length = 0;
  const speech = await import(`./speech.js?test=${++copies}`);
  if (ready) {
    speech.warm('af_heart', { lines: [] });
    speech.prefetchSpeech(['Try another one.']);
    workers[0].reply({ type: 'READY', loadMs: 1234 });
  }
  return speech;
}
const audioFor = (req, extra = {}) => ({ type: 'AUDIO', id: req.id, text: req.text, voice: req.voice, speed: req.speed, samples: tone(), rate: 24000, source: 'model', synthMs: 900, ...extra });

test('a slow line on a ready Kokoro is waited for, then reports completion when the audio ends', async () => {
  const speech = await fresh({ ready: true });
  const done = speech.speakAndWait('Find the circle.', { voiceId: 'af_heart' });
  const req = workers[0].last('SYNTHESIZE');
  assert.equal(req.cachedOnly, false);
  await pause(300);
  assert.equal(synth.spoken.length, 0, 'no browser voice after the old 220 ms deadline');
  workers[0].reply(audioFor(req));
  await flush();
  assert.equal(sources.length, 1);
  sources[0].onended();
  assert.deepEqual(await done, { status: 'completed', engine: 'kokoro' });
  assert.equal(speech.getSpeechStatus().loadMs, 1234);
});

test('advancing quickly cancels the old line and its late audio never plays', async () => {
  const speech = await fresh({ ready: true });
  const first = speech.speakAndWait('One.');
  const one = workers[0].last('SYNTHESIZE');
  const second = speech.speakAndWait('Two.');
  const two = workers[0].last('SYNTHESIZE');
  assert.deepEqual(await first, { status: 'interrupted', engine: 'kokoro' });
  assert.equal(workers[0].last('CANCEL').id, one.id);
  workers[0].reply(audioFor(one));
  await flush();
  assert.equal(sources.length, 0);
  workers[0].reply(audioFor(two));
  await flush();
  assert.equal(sources.length, 1);
  speech.stop();
  assert.deepEqual(await second, { status: 'interrupted', engine: 'kokoro' });
  sources[0].onended();
  assert.equal(speech.getSpeechStatus().metrics.completed, 0);
});

test('a repeated line plays from the page cache without asking the worker', async () => {
  const speech = await fresh({ ready: true });
  const first = speech.speakAndWait('Again.');
  workers[0].reply(audioFor(workers[0].last('SYNTHESIZE')));
  await flush();
  sources[0].onended();
  await first;
  const before = workers[0].count('SYNTHESIZE');
  const again = speech.speakAndWait('Again.');
  await flush();
  assert.equal(workers[0].count('SYNTHESIZE'), before);
  sources[1].onended();
  assert.deepEqual(await again, { status: 'completed', engine: 'kokoro' });
});

test('a prefetched line handed to the page plays even while the worker is busy', async () => {
  const speech = await fresh({ ready: true });
  const job = workers[0].last('PREFETCH').items[0];
  workers[0].reply({ type: 'AUDIO', text: job.text, voice: job.voice, speed: job.speed, samples: tone(), rate: 24000, source: 'model' });
  const line = speech.speakAndWait('Try another one.');
  assert.equal(workers[0].count('SYNTHESIZE'), 0);
  await flush();
  sources[0].onended();
  assert.deepEqual(await line, { status: 'completed', engine: 'kokoro' });
});

test('while downloading, a stored line plays in Kokoro and a new line uses the browser voice once', async () => {
  const speech = await fresh();
  const stored = speech.speakAndWait('Stored line.');
  assert.equal(workers[0].count('INIT'), 1);
  const ask = workers[0].last('SYNTHESIZE');
  assert.equal(ask.cachedOnly, true);
  workers[0].reply(audioFor(ask, { source: 'store' }));
  await flush();
  sources[0].onended();
  assert.deepEqual(await stored, { status: 'completed', engine: 'kokoro' });

  const fresher = speech.speakAndWait('Brand new line.');
  const miss = workers[0].last('SYNTHESIZE');
  workers[0].reply({ type: 'ERROR', id: miss.id, kind: 'miss' });
  assert.equal(synth.spoken.length, 1);
  synth.spoken[0].onend();
  assert.deepEqual(await fresher, { status: 'completed', engine: 'browser' });
  assert.deepEqual(speech.getSpeechStatus().metrics.fallbacks, { 'not-ready': 1 });
});

test('a model load failure falls back once and waits before trying again', async () => {
  const speech = await fresh();
  const preview = speech.speak('Hear me.', 'af_heart', { full: true });
  assert.equal(workers[0].last('SYNTHESIZE').cachedOnly, false);
  workers[0].reply({ type: 'ERROR', kind: 'load', message: 'offline' });
  assert.equal(synth.spoken.length, 1);
  synth.spoken[0].onend();
  assert.deepEqual(await preview, { status: 'completed', engine: 'browser' });
  const status = speech.getSpeechStatus();
  assert.equal(status.engine, 'failed');
  assert.ok(status.retryIn > 0 && status.retryIn <= 5000);
  speech.warm('af_heart');
  assert.equal(workers[0].count('INIT'), 1, 'no automatic retry before the backoff');
  const prepared = speech.prepareSpeech();
  assert.equal(workers[0].count('INIT'), 2, 'a grown-up tap retries at once');
  workers[0].reply({ type: 'READY', loadMs: 50 });
  assert.equal((await prepared).status, 'ready');
});

test('a crashed worker hands the waiting line to the browser voice and is not reused', async () => {
  const speech = await fresh({ ready: true });
  const line = speech.speakAndWait('Crash.');
  workers[0].onerror({ message: 'boom' });
  assert.equal(workers[0].terminated, true);
  assert.equal(synth.spoken.length, 1);
  synth.spoken[0].onerror({ error: 'synthesis-failed' });
  assert.deepEqual(await line, { status: 'failed', engine: 'browser' });
  const next = speech.speakAndWait('After.');
  assert.equal(synth.spoken.length, 2);
  assert.equal(workers.length, 1);
  speech.stop();
  assert.equal((await next).status, 'interrupted');
});

test('bad audio is never played', async () => {
  const speech = await fresh({ ready: true });
  const line = speech.speakAndWait('Static.');
  workers[0].reply(audioFor(workers[0].last('SYNTHESIZE'), { samples: new Float32Array(4800) }));
  await flush();
  assert.equal(sources.length, 0);
  assert.equal(synth.spoken.length, 1);
  speech.stop();
  assert.equal((await line).status, 'interrupted');
  assert.deepEqual(speech.getSpeechStatus().metrics.fallbacks, { 'bad-audio': 1 });
});

test('never-fallback reports failure, and a non-interrupting line is skipped while another plays', async () => {
  const speech = await fresh({ ready: true });
  const busy = speech.speakAndWait('Busy.');
  assert.deepEqual(await speech.speakAndWait('Wait.', { interrupt: false }), { status: 'skipped', engine: null });
  const strict = speech.speakAndWait('Strict.', { fallback: 'never' });
  assert.equal((await busy).status, 'interrupted');
  workers[0].reply({ type: 'ERROR', id: workers[0].last('SYNTHESIZE').id, kind: 'synth', message: 'bad' });
  assert.deepEqual(await strict, { status: 'failed', engine: 'kokoro' });
  assert.equal(synth.spoken.length, 0);
  assert.deepEqual(await speech.speakAndWait('   '), { status: 'skipped', engine: null });
});

test('the worker reports one load failure and suppresses stale stored-line answers', async () => {
  const out = [];
  globalThis.self = { postMessage: message => out.push(message) };
  await import('./speech-worker.js?test=worker');
  const send = data => self.onmessage({ data });
  send({ type: 'SYNTHESIZE', id: 1, text: 'One.', voice: 'af_heart', speed: 1, cachedOnly: true });
  send({ type: 'SYNTHESIZE', id: 2, text: 'Two.', voice: 'af_heart', speed: 1, cachedOnly: true });
  await pause(20);
  assert.deepEqual(out.map(m => [m.type, m.id, m.kind]), [['ERROR', 2, 'miss']]);
  out.length = 0;
  send({ type: 'SYNTHESIZE', id: 3, text: 'Three.', voice: 'af_heart', speed: 1 });
  send({ type: 'PREFETCH', items: [{ text: 'Later.', voice: 'af_heart', speed: 1 }] });
  await pause(50);
  assert.deepEqual(out.map(m => [m.type, m.kind]), [['ERROR', 'load']]);
  send({ type: 'GET_STATUS' });
  await pause(20);
  assert.equal(out.at(-1).model, 'failed');
  assert.equal(out.at(-1).cache.queued, 0);
});
