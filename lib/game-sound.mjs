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
  let noise = null;
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
        noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
        const data = noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
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

  // Filtered noise: splashes, whooshes, crumbs and pops.
  function hiss({ at = 0, dur, level, freq, to = freq, q = 1 }) {
    const start = Math.max(ctx.currentTime, at);
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = noise;
    filter.type = 'bandpass';
    filter.Q.value = q;
    filter.frequency.setValueAtTime(freq, start);
    if (to !== freq) filter.frequency.exponentialRampToValueAtTime(to, start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter).connect(gain).connect(mix);
    src.start(start);
    src.stop(start + dur + 0.02);
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
    stopMusic,
    /** One action sound by name (see ACTIONS). Unknown names stay quiet. */
    play(kind) {
      const make = ACTIONS[kind];
      if (!make || !wake()) return;
      const now = ctx.currentTime;
      make({
        tone: o => tone({ ...o, at: now + (o.at || 0) }),
        hiss: o => hiss({ ...o, at: now + (o.at || 0) })
      });
    }
  };
}

// Soft, toy-like action sounds. Nothing harsh: no square waves, no loud bangs.
const ACTIONS = {
  jump: ({ tone }) => tone({ type: 'sine', from: 300, to: 720, dur: 0.16, level: 0.24 }),
  bounce: ({ tone }) => tone({ type: 'sine', from: 240, to: 560, dur: 0.12, level: 0.2 }),
  land: ({ tone, hiss }) => { tone({ type: 'sine', from: 170, to: 80, dur: 0.12, level: 0.32 }); hiss({ dur: 0.06, level: 0.12, freq: 900 }); },
  step: ({ tone, hiss }) => { hiss({ dur: 0.06, level: 0.16, freq: 400, q: 1.2 }); tone({ type: 'sine', from: 115, to: 70, dur: 0.07, level: 0.14 }); },
  tap: ({ tone }) => tone({ type: 'sine', from: 900, to: 700, dur: 0.05, level: 0.16 }),
  pop: ({ tone, hiss }) => { hiss({ dur: 0.09, level: 0.3, freq: 1400, to: 600, q: 0.9 }); tone({ type: 'sine', from: 680, to: 300, dur: 0.08, level: 0.14 }); },
  bop: ({ tone, hiss }) => { tone({ type: 'sine', from: 420, to: 160, dur: 0.12, level: 0.3 }); hiss({ dur: 0.05, level: 0.18, freq: 1800, q: 2 }); },
  whoosh: ({ hiss }) => hiss({ dur: 0.3, level: 0.18, freq: 500, to: 1800, q: 1.5 }),
  splash: ({ hiss, tone }) => { hiss({ dur: 0.4, level: 0.3, freq: 1500, to: 300, q: 0.7 }); tone({ type: 'sine', from: 500, to: 900, dur: 0.08, level: 0.08, at: 0.05 }); },
  shoot: ({ tone, hiss }) => { tone({ from: 900, to: 280, dur: 0.12, level: 0.14 }); hiss({ dur: 0.05, level: 0.08, freq: 2500 }); },
  boom: ({ tone, hiss }) => { tone({ type: 'sine', from: 140, to: 40, dur: 0.35, level: 0.34 }); hiss({ dur: 0.35, level: 0.26, freq: 700, to: 120, q: 0.6 }); },
  crumble: ({ hiss, tone }) => { hiss({ dur: 0.35, level: 0.26, freq: 500, to: 150, q: 0.8 }); [0, 0.07, 0.15].forEach(at => tone({ type: 'sine', from: 160, to: 90, dur: 0.06, level: 0.12, at })); },
  bump: ({ tone }) => { tone({ type: 'sine', from: 220, to: 90, dur: 0.22, level: 0.3 }); tone({ type: 'sine', from: 180, to: 70, dur: 0.22, level: 0.18, at: 0.1 }); },
  sparkle: ({ tone }) => [1319, 1568, 2093].forEach((from, i) => tone({ type: 'sine', from, dur: 0.12, level: 0.13, at: i * 0.05 })),
  chomp: ({ tone, hiss }) => [0, 0.09].forEach(at => { hiss({ dur: 0.05, level: 0.2, freq: 1200, q: 1.5, at }); tone({ type: 'sine', from: 260, to: 140, dur: 0.06, level: 0.14, at }); }),
  flip: ({ hiss, tone }) => { hiss({ dur: 0.07, level: 0.16, freq: 2400, to: 1200, q: 1 }); tone({ type: 'sine', from: 520, to: 640, dur: 0.06, level: 0.08 }); },
  snap: ({ tone }) => { tone({ type: 'sine', from: 1250, dur: 0.04, level: 0.18 }); tone({ type: 'sine', from: 1870, dur: 0.05, level: 0.14, at: 0.04 }); },
  drop: ({ tone, hiss }) => { tone({ type: 'sine', from: 320, to: 120, dur: 0.14, level: 0.28 }); hiss({ dur: 0.05, level: 0.1, freq: 700 }); },
  swish: ({ hiss }) => hiss({ dur: 0.28, level: 0.24, freq: 3200, to: 1400, q: 0.7 }),
  click: ({ tone }) => tone({ type: 'sine', from: 1500, dur: 0.025, level: 0.12 }),
  brush: ({ hiss }) => hiss({ dur: 0.1, level: 0.08, freq: 2600, q: 0.8 }),
  roll: ({ hiss }) => hiss({ dur: 0.22, level: 0.12, freq: 300, to: 500, q: 2 }),
  rise: ({ tone }) => tone({ type: 'sine', from: 400, to: 1200, dur: 0.4, level: 0.16 }),
  fall: ({ tone }) => tone({ type: 'sine', from: 800, to: 200, dur: 0.45, level: 0.16 }),
  zap: ({ tone }) => { tone({ type: 'sine', from: 1400, to: 500, dur: 0.15, level: 0.16 }); tone({ type: 'sine', from: 1000, to: 350, dur: 0.15, level: 0.1, at: 0.04 }); }
};

export const ACTION_SOUNDS = Object.keys(ACTIONS);

// One shared player for every game on the page. The host decides when games may make sound.
const shared = createGameSound();
let allowed = () => true; // a game page opened on its own plays its sounds
export const gameSound = shared;
/** The host passes a check that says, right now, whether the game on screen may make sound. */
export function allowGameSounds(check) { allowed = check; }
/** Games call this at the moment of an action, e.g. sfx('jump'). A game inside Little Sprouts hands
    the sound to the host page, so the host's mute, speech ducking and game check apply to it too. */
export function sfx(kind) {
  if (typeof window === 'undefined') return; // tests run games without a browser
  if (window.parent !== window) {
    try { if (window.parent.sproutsSfx) { window.parent.sproutsSfx(kind); return; } } catch { /* another site: play here */ }
  }
  if (allowed()) shared.play(kind);
}
