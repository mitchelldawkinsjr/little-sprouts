import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AUDIO_DEFAULTS, SOUND_EVENTS, normalizeAudioSettings, safeSoundEvent, canPlayEvent } from '../lib/game-audio-policy.mjs';
import { audioPreset, themeForGame, hzForNote } from '../lib/game-audio-presets.mjs';
import { createGameAudio } from '../lib/game-audio.mjs';
import { inventory } from '../tools/static-files.mjs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

class FakeGain {
  constructor() {
    this.gain = {
      value: 0,
      cancelScheduledValues() {},
      setTargetAtTime(value) { this.value = value; },
      setValueAtTime(value) { this.value = value; },
      exponentialRampToValueAtTime(value) { this.value = value; }
    };
  }
  connect() { return this; }
  disconnect() {}
}
class FakeOscillator {
  constructor() { this.frequency = { setValueAtTime() {} }; this.onended = null; }
  connect() { return this; }
  disconnect() {}
  start() { this.started = true; }
  stop() { this.stopped = true; }
}
class FakeContext {
  static all = [];
  constructor() {
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = new FakeGain();
    this.gains = [];
    this.oscillators = [];
    FakeContext.all.push(this);
  }
  createGain() { const gain = new FakeGain(); this.gains.push(gain); return gain; }
  createOscillator() { const osc = new FakeOscillator(); this.oscillators.push(osc); return osc; }
  async resume() { this.state = 'running'; }
  async close() { this.state = 'closed'; }
}

function harness() {
  let now = 1000;
  const timers = new Map();
  let nextId = 1;
  const scheduler = {
    setInterval(callback) { const id = nextId++; timers.set(id, callback); return id; },
    clearInterval(id) { timers.delete(id); }
  };
  const audio = createGameAudio({ contextFactory: FakeContext, scheduler, clock: () => now });
  return { audio, timers, advance(ms) { now += ms; }, get ctx() { return FakeContext.all.at(-1); } };
}

test('gameplay audio settings are independent, bounded, and backward compatible', () => {
  assert.deepEqual(normalizeAudioSettings(), AUDIO_DEFAULTS);
  assert.deepEqual(normalizeAudioSettings(null), AUDIO_DEFAULTS);
  assert.deepEqual(normalizeAudioSettings([]), AUDIO_DEFAULTS);
  assert.deepEqual(normalizeAudioSettings({
    music: 5, master: -1, sfx: Infinity, ambience: NaN, muted: 'false'
  }), { ...AUDIO_DEFAULTS, master: 0, music: 1 });
  assert.equal(normalizeAudioSettings({ muted: true }).muted, true);
  assert.ok(!Object.hasOwn(normalizeAudioSettings({ extra: 'untrusted' }), 'extra'));
});

test('all semantic sound names have a policy and high-frequency sounds are throttled', () => {
  for (const [id, preset] of Object.entries(SOUND_EVENTS)) {
    assert.equal(safeSoundEvent(id), id);
    assert.ok(preset.duration > 0 && preset.duration < 1);
    assert.ok(preset.level > 0 && preset.level < 1);
    assert.ok(preset.cooldown >= 50);
    assert.ok(preset.notes.every(n => n > 0));
  }
  assert.equal(safeSoundEvent('something.else'), null);
  assert.equal(safeSoundEvent('__proto__'), null);
  assert.equal(canPlayEvent('player.step', 200, { 'player.step': 100 }), false);
  assert.equal(canPlayEvent('player.step', 261, { 'player.step': 100 }), true);
});

test('featured 3D games use distinctive original music themes without downloads', () => {
  assert.equal(themeForGame('grass'), 'meadow');
  assert.equal(themeForGame('blocks'), 'meadow');
  assert.equal(themeForGame('sketchbook'), 'drive');
  assert.equal(themeForGame('skybound'), 'sky');
  assert.equal(themeForGame('boss'), 'chase');
  for (const game of ['grass','blocks','sketchbook','skybound','boss','words','lunar']) {
    const preset = audioPreset(game);
    assert.equal(preset.notes.length, 16);
    assert.ok(preset.bpm >= 70 && preset.bpm <= 140);
    assert.ok(hzForNote(preset.root, 7) > preset.root);
  }
});

test('one context is reused, side effects wait for a game, and cooldown limits repeated effects', async () => {
  const h = harness();
  assert.equal(h.audio.play('quiz.correct'), false);
  h.audio.start('grass');
  assert.equal(await h.audio.unlock(), true);
  assert.equal(h.audio.currentGame, 'grass');
  assert.equal(h.audio.ready, true);
  const before = h.ctx.oscillators.length;
  assert.equal(h.audio.play('quiz.correct'), true);
  assert.equal(h.audio.play('quiz.correct'), false);
  assert.ok(h.ctx.oscillators.length > before);
  h.advance(200);
  assert.equal(h.audio.play('quiz.correct'), true);
  h.audio.start('grass');
  assert.equal(FakeContext.all.at(-1), h.ctx);
  assert.equal(h.timers.size, 1);
  await h.audio.dispose();
  assert.equal(h.timers.size, 0);
  assert.equal(h.audio.ready, false);
});

test('mute, duck, and visibility pause take effect without muting educational speech', async () => {
  const h = harness();
  h.audio.setSettings({ muted: false, master: 0.85, music: 0.5, sfx: 0.7, ambience: 0.4 });
  h.audio.start('sketchbook');
  await h.audio.unlock();
  const music = h.ctx.gains[1].gain;
  const effects = h.ctx.gains[2].gain;
  assert.equal(music.value, 0.5);
  assert.equal(effects.value, 0.7);
  h.audio.duck(true);
  assert.ok(music.value < 0.1);
  assert.ok(effects.value < 0.7);
  h.audio.duck(false);
  assert.equal(music.value, 0.5);
  h.audio.setSettings({ ...h.audio.getSettings(), muted: true });
  assert.equal(h.ctx.gains[0].gain.value, 0);
  assert.equal(h.audio.play('reward.star'), false);
  h.audio.setSettings({ ...h.audio.getSettings(), muted: false });
  h.audio.pause();
  assert.equal(h.timers.size, 0);
  assert.equal(h.audio.play('player.jump'), false);
  h.audio.resume();
  await h.audio.unlock();
  assert.equal(h.timers.size, 1);
  h.audio.finish('reward.win');
  assert.equal(h.timers.size, 0);
  assert.equal(music.value, 0);
  h.audio.stop();
  assert.equal(h.audio.play('quiz.correct'), false);
  await h.audio.dispose();
});

test('game switches tear down loops, keep preferences, and do not duplicate schedulers', async () => {
  const h = harness();
  h.audio.start('boss');
  await h.audio.unlock();
  const fx = h.audio.loop('vehicle.engine', { interval: 400 });
  assert.equal(h.timers.size, 2);
  fx.set({ pitch: 1.3, volume: 0.2 });
  h.audio.start('skybound');
  await h.audio.unlock();
  assert.equal(h.audio.currentGame, 'skybound');
  assert.equal(h.timers.size, 1);
  h.audio.setSettings({ ...h.audio.getSettings(), music: 0.01 });
  h.audio.stop();
  assert.equal(h.audio.getSettings().music, 0.01);
  assert.equal(h.timers.size, 0);
  await h.audio.dispose();
});

test('host integration, sidecar events, offline inventory and Parent Corner are wired', () => {
  const app = read('app.js');
  const mounts = read('app/mounts.mjs');
  const rounds = read('app/round.mjs');
  const helper = read('app/helpers.mjs');
  const parent = read('app/parent.mjs');
  const guest = read('lib/sidecar-guest.js');
  const bridge = read('lib/sidecar.js');
  const html = read('index.html');
  assert.match(app, /registerGameAudio\(rt\)/);
  assert.match(mounts, /rt\.audio\?\.start\(mode\)/);
  assert.match(mounts, /rt\.audio\?\.stop\(\)/);
  assert.match(mounts, /id="playAudio"/);
  assert.match(mounts, /type: 'audio-config'/);
  assert.match(mounts, /onSound\(event, options\)/);
  assert.match(rounds, /rt\.audio\?\.play\(ok \? 'quiz.correct' : 'quiz.incorrect'\)/);
  assert.match(rounds, /rt\.audio\?\.finish\(/);
  assert.match(helper, /rt\.audio\?\.duck\(now\)/);
  assert.match(bridge, /data\.type === 'sound'/);
  assert.match(guest, /sound: function \(event, options\)/);
  assert.match(guest, /data\.type === 'audio-config'/);
  assert.match(parent, /rt\.updateAudio\?\.\(/);
  for (const id of ['audioMuted','audioMaster','audioMusic','audioEffects','audioAmbience']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  const files = inventory(new URL('../', import.meta.url).pathname).offline();
  for (const file of ['lib/game-audio.mjs','lib/game-audio-policy.mjs','lib/game-audio-presets.mjs','app/game-audio.mjs']) {
    assert.ok(files['./'+file], file + ' must be included in the offline pack');
  }
});
