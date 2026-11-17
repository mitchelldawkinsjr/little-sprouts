/* Game sounds and background music for games that bring none of their own, made with Web Audio.
   No files to load, so it works offline. Levels match lib/sidecar-guest.js: the game sits under
   the spoken question and dips further while a line is read. */

const GAME_LEVEL = 0.4;
const DUCK_LEVEL = 0.12;
const MUSIC_LEVEL = 0.35; // music sits under the effects
const LOOKAHEAD = 0.3;
const PENTATONIC = [0, 2, 4, 7, 9]; // no wrong notes, so a random walk always sounds friendly
const KEYS = [60, 62, 65, 67]; // C, D, F, G

function hash(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function random(seed) {
  let s = seed || 1;
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) ^ Math.imul(s ^ (s >>> 13), 3266489917)) >>> 0) / 4294967296;
}

/** A game's own 2-bar loop: the same game always gets the same tune. Notes are MIDI numbers, null is a rest. */
export function tune(name) {
  const seed = hash(name);
  const next = random(seed);
  const key = KEYS[seed % KEYS.length];
  const bpm = 84 + (seed % 5) * 6;
  const scale = step => key + 12 * Math.floor(step / 5) + PENTATONIC[((step % 5) + 5) % 5];
  let step = 5 + Math.floor(next() * 3);
  const melody = [];
  for (let i = 0; i < 16; i++) {
    if (i % 4 !== 0 && next() < 0.3) { melody.push(null); continue; }
    step = Math.max(3, Math.min(9, step + [-2, -1, -1, 0, 1, 1, 2][Math.floor(next() * 7)]));
    melody.push(scale(step));
  }
  const roots = [0, 3, 4, 0].map(degree => scale(degree) - 12);
  return { bpm, melody, bass: [roots[0], roots[0], roots[1], roots[1]].concat([roots[2], roots[2], roots[3], roots[3]]) };
}

const hz = note => 440 * 2 ** ((note - 69) / 12);

export function createGameSound() {
  let ctx = null;
  let mix = null;
  let music = null;
  let ducked = false;
  let timer = 0;

  function wake() {
    try {
      if (!ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        ctx = new Ctx();
        mix = ctx.createGain();
        mix.gain.value = ducked ? DUCK_LEVEL : GAME_LEVEL;
        mix.connect(ctx.destination);
        music = ctx.createGain();
        music.gain.value = MUSIC_LEVEL;
        music.connect(mix);
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) ctx.suspend();
          else if (timer) ctx.resume();
        });
      }
      if (ctx.state === 'suspended' && !document.hidden) ctx.resume();
      return ctx;
    } catch { return null; /* the game plays without sound */ }
  }

  function tone({ type = 'triangle', from, to = from, at = 0, dur, level, out = mix }) {
    const start = Math.max(ctx.currentTime, at);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(out);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  const cue = notes => () => {
    if (!wake()) return;
    const now = ctx.currentTime;
    notes.forEach(([from, at, dur, level = 0.22, to]) => tone({ from, to, at: now + at, dur, level }));
  };

  function stopMusic() {
    clearInterval(timer);
    timer = 0;
  }

  return {
    // Call from a tap or key so the browser lets audio start.
    wake,
    duck(value) {
      ducked = !!value;
      if (mix) mix.gain.setTargetAtTime(ducked ? DUCK_LEVEL : GAME_LEVEL, ctx.currentTime, ducked ? 0.05 : 0.3);
    },
    // A bright climb for a right answer.
    right: cue([[523, 0, 0.14], [659, 0.08, 0.14], [784, 0.16, 0.14], [1047, 0.24, 0.32]]),
    // Not yet: two gentle low notes, never a harsh buzz.
    wrong: cue([[330, 0, 0.16, 0.2, 300], [247, 0.18, 0.26, 0.2, 220]]),
    // The round is done: a little fanfare.
    win: cue([[523, 0, 0.18], [659, 0.15, 0.18], [784, 0.3, 0.18], [1047, 0.45, 0.5, 0.26], [784, 0.45, 0.5, 0.14]]),
    /** Loops `name`'s tune while `keep()` stays true, so it also stops when a game ends some other way. */
    startMusic(name, keep) {
      stopMusic();
      if (!wake()) return;
      const { bpm, melody, bass } = tune(name);
      const eighth = 30 / bpm;
      let index = 0;
      let at = ctx.currentTime + 0.1;
      timer = setInterval(() => {
        if (!keep()) { stopMusic(); return; }
        if (document.hidden) { at = ctx.currentTime + 0.1; return; }
        while (at < ctx.currentTime + LOOKAHEAD) {
          const note = melody[index % 16];
          if (note != null) tone({ from: hz(note), at, dur: eighth * 0.9, level: 0.16, out: music });
          if (index % 2 === 0) tone({ type: 'sine', from: hz(bass[(index / 2) % 8]), at, dur: eighth * 1.8, level: 0.2, out: music });
          index++;
          at += eighth;
        }
      }, 100);
    },
    stopMusic
  };
}
