// Shared, dependency-free Little Sprouts Web Audio engine.
// One AudioContext per host page. Every sound is generated locally: works in the
// PWA and Fire APK without audio downloads or a network request.
import { AUDIO_DEFAULTS, SOUND_EVENTS, canPlayEvent, clampVolume, normalizeAudioSettings, safeSoundEvent } from './game-audio-policy.mjs';
import { audioPreset, hzForNote, themeForGame } from './game-audio-presets.mjs';

const SILENT = 0.0001;
const MAX_NOTES = 16;
const LOOKAHEAD = 0.36;
const GESTURE_REQUIRED = 'The first tap starts audio';

export function createGameAudio({ contextFactory, clock = () => Date.now(), scheduler = globalThis } = {}) {
  let context = null;
  let master = null, musicBus = null, effectsBus = null, ambienceBus = null;
  let game = null, theme = null, playing = false, finished = false, suspended = false, ducked = false;
  let settings = { ...AUDIO_DEFAULTS };
  let musicTick = null, nextNote = 0, step = 0, noteCount = 0;
  let lastEvent = Object.create(null);
  let disposed = false;
  const loops = new Set();
  const handles = new Set();

  function gain(node, target, seconds = 0.12) {
    if (!node || !context) return;
    const now = context.currentTime;
    try {
      node.gain.cancelScheduledValues(now);
      node.gain.setTargetAtTime(Math.max(0, target), now, Math.max(0.008, seconds / 3));
    } catch { node.gain.value = Math.max(0, target); }
  }
  function mix() {
    const audible = !settings.muted && !suspended && playing;
    gain(master, audible ? settings.master : 0);
    gain(musicBus, audible && !finished ? settings.music * (ducked ? 0.08 : 1) : 0, ducked ? 0.06 : 0.25);
    gain(ambienceBus, audible && !finished ? settings.ambience * (ducked ? 0.08 : 1) : 0, ducked ? 0.06 : 0.25);
    gain(effectsBus, audible ? settings.sfx * (ducked ? 0.35 : 1) : 0, 0.05);
  }
  function makeContext() {
    if (context || disposed) return context;
    try {
      const Factory = contextFactory || globalThis.AudioContext || globalThis.webkitAudioContext;
      if (typeof Factory !== 'function') return null;
      context = new Factory({ latencyHint: 'interactive' });
      master = context.createGain();
      musicBus = context.createGain();
      effectsBus = context.createGain();
      ambienceBus = context.createGain();
      master.gain.value = settings.muted ? 0 : settings.master;
      musicBus.gain.value = 0;
      effectsBus.gain.value = 0;
      ambienceBus.gain.value = 0;
      musicBus.connect(master);
      effectsBus.connect(master);
      ambienceBus.connect(master);
      master.connect(context.destination);
      mix();
    } catch {
      context = null;
      master = musicBus = effectsBus = ambienceBus = null;
    }
    return context;
  }
  async function unlock() {
    const ctx = makeContext();
    if (!ctx) return false;
    try {
      if (ctx.state === 'suspended') await ctx.resume();
      if (ctx.state !== 'running') return false;
      if (playing) beginSchedule();
      return true;
    } catch { return false; }
  }

  function synth(frequency, when, length, level, wave, bus, { pan = 0 } = {}) {
    if (!context || !bus || noteCount >= MAX_NOTES || frequency <= 0) return false;
    try {
      const start = Math.max(context.currentTime, when);
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, start);
      envelope.gain.setValueAtTime(SILENT, start);
      envelope.gain.exponentialRampToValueAtTime(Math.max(SILENT, level), start + 0.014);
      envelope.gain.exponentialRampToValueAtTime(SILENT, start + length);
      oscillator.connect(envelope);
      let panner = null;
      if (pan && typeof context.createStereoPanner === 'function') {
        panner = context.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        envelope.connect(panner);
        panner.connect(bus);
      } else envelope.connect(bus);
      ++noteCount;
      oscillator.onended = () => {
        noteCount = Math.max(0, noteCount - 1);
        try { oscillator.disconnect(); envelope.disconnect(); panner?.disconnect(); } catch {}
      };
      oscillator.start(start);
      oscillator.stop(start + length + 0.025);
      return true;
    } catch { return false; }
  }

  function play(event, options = {}) {
    const name = safeSoundEvent(event);
    if (!name || !playing || suspended || settings.muted || !settings.sfx) return false;
    if (!context || context.state !== 'running') return false;
    const now = clock();
    if (!canPlayEvent(name, now, lastEvent)) return false;
    lastEvent[name] = now;
    const sound = SOUND_EVENTS[name];
    const level = sound.level * clampVolume(options?.volume ?? 1);
    const pitch = Math.min(2, Math.max(0.5, Number(options?.pitch) || 1));
    const pan = Number.isFinite(options?.pan) ? options.pan : 0;
    if (!level) return false;
    sound.notes.forEach((freq, index) => synth(freq * pitch, context.currentTime + 0.046 * index,
      sound.duration, level / (1 + index * 0.20), sound.wave, effectsBus, { pan }));
    return true;
  }

  function tick() {
    if (!playing || finished || suspended || !context || context.state !== 'running') return;
    if (!settings.music && !settings.ambience) return;
    const preset = audioPreset(theme);
    const interval = 60 / preset.bpm / 2;
    let safety = 0;
    while (nextNote < context.currentTime + LOOKAHEAD && safety++ < 6) {
      const note = preset.notes[step % preset.notes.length];
      if (settings.music > 0 && note >= 0 && !settings.muted)
        synth(hzForNote(preset.root, note), nextNote, interval * 0.66, 0.09,
          'sine', musicBus);
      if (settings.music > 0 && step % 4 === 0 && !settings.muted) {
        const bass = preset.bass[Math.floor(step / 4) % preset.bass.length];
        synth(hzForNote(preset.root / 2, bass), nextNote, interval * 1.8, 0.075,
          'triangle', musicBus);
      }
      // A quiet, procedural bird/wind bell: no extra files, CPU work or downloads.
      if (settings.ambience > 0 && !settings.muted && step % 16 === 3) {
        const freq = preset.ambience === 'birds' ? 1100 : preset.ambience === 'wind' ? 170 : 700;
        synth(freq, nextNote, preset.ambience === 'wind' ? 0.34 : 0.09, 0.08,
          preset.ambience === 'wind' ? 'sine' : 'triangle', ambienceBus, { pan: -0.4 });
      }
      nextNote += interval;
      step += 1;
    }
    if (nextNote < context.currentTime) nextNote = context.currentTime + 0.02;
  }
  function beginSchedule() {
    if (!playing || finished || suspended || !context || context.state !== 'running' || musicTick !== null) return;
    nextNote = context.currentTime + 0.08;
    musicTick = scheduler.setInterval(tick, 150);
    tick();
  }
  function haltSchedule() {
    if (musicTick !== null) { scheduler.clearInterval(musicTick); musicTick = null; }
  }
  function start(gameId) {
    if (disposed) return;
    if (playing && game === gameId) return;
    stop();
    playing = true;
    finished = false;
    game = String(gameId || 'arcade');
    theme = themeForGame(game);
    lastEvent = Object.create(null);
    mix();
    void unlock();
  }
  function music(name) {
    if (!playing || disposed) return;
    theme = typeof name === 'string' ? name : themeForGame(game);
    step = 0;
    nextNote = context?.currentTime || 0;
  }
  function duck(on) {
    ducked = !!on;
    mix();
  }
  // Stop background soundtrack at results, keeping a brief victory SFX audible.
  function finish(event = 'reward.win') {
    if (!playing || finished) return;
    haltSchedule();
    finished = true;
    mix();
    play(event);
  }
  function setSettings(value) {
    settings = normalizeAudioSettings(value);
    mix();
    return getSettings();
  }
  const getSettings = () => ({ ...settings });
  function pause() {
    suspended = true;
    haltSchedule();
    mix();
  }
  function resume() {
    suspended = false;
    mix();
    void unlock();
  }
  function loop(event, options = {}) {
    if (!safeSoundEvent(event)) return { stop() {}, set() {} };
    let opts = { ...options }, done = false;
    const handle = {
      set(next) { opts = { ...opts, ...(next || {}) }; },
      stop() {
        if (done) return;
        done = true;
        scheduler.clearInterval(id);
        loops.delete(handle);
      }
    };
    const interval = Math.max(250, Math.min(1500, Number(options.interval) || 380));
    const id = scheduler.setInterval(() => { if (!done) play(event, opts); }, interval);
    loops.add(handle);
    return handle;
  }
  function stop() {
    haltSchedule();
    for (const handle of [...loops]) handle.stop();
    playing = false;
    finished = false;
    game = theme = null;
    ducked = false;
    lastEvent = Object.create(null);
    step = 0;
    mix();
  }
  async function dispose() {
    if (disposed) return;
    stop();
    disposed = true;
    try { await context?.close(); } catch {}
    context = master = musicBus = effectsBus = ambienceBus = null;
  }
  return {
    unlock, start, play, music, loop, duck, finish, setSettings, getSettings, pause, resume,
    stop, dispose,
    get currentGame() { return game; },
    get ready() { return context?.state === 'running'; },
    get disabledReason() { return !context ? GESTURE_REQUIRED : context.state; }
  };
}

export const gameAudio = createGameAudio();
