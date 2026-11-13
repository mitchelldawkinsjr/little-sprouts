/* Targets sounds, made on the spot with Web Audio. No files to load.
   Everything runs through one level, matching lib/sidecar-guest.js:
   the game sits under the spoken question and dips further while a line is read. */

const GAME_LEVEL = 0.4;
const DUCK_LEVEL = 0.12;

export function createSound() {
  let ctx = null;
  let mix = null;
  let noise = null;
  let on = true;
  let ducked = false;

  function wake() {
    if (!on) return null;
    try {
      if (!ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        ctx = new Ctx();
        mix = ctx.createGain();
        mix.gain.value = ducked ? DUCK_LEVEL : GAME_LEVEL;
        mix.connect(ctx.destination);
        noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
        const data = noise.getChannelData(0);
        for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1;
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch { return null; /* the game plays without sound */ }
  }

  function tone({ type = 'triangle', from, to = from, at = 0, dur, level }) {
    const start = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(mix);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  function hiss({ at = 0, dur, level, freq, to = freq, q = 1 }) {
    const start = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = q;
    band.frequency.setValueAtTime(freq, start);
    if (to !== freq) band.frequency.exponentialRampToValueAtTime(to, start + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(band).connect(gain).connect(mix);
    src.start(start);
    src.stop(start + dur + 0.02);
  }

  const play = make => () => {
    if (!wake()) return;
    try { make(); } catch { /* a dropped sound never stops play */ }
  };

  return {
    // Call from the first tap or key so the browser lets audio start.
    wake,
    setOn(value) {
      on = value !== false;
      if (!on && ctx?.state === 'running') ctx.suspend();
    },
    duck(value) {
      ducked = !!value;
      if (mix) mix.gain.setTargetAtTime(ducked ? DUCK_LEVEL : GAME_LEVEL, ctx.currentTime, ducked ? 0.05 : 0.3);
    },
    // A soft, bubbly pop as a paint ball leaves the launcher.
    pop: play(() => {
      hiss({ dur: 0.1, level: 0.4, freq: 1400, to: 600, q: 0.9 });
      tone({ type: 'sine', from: 660, to: 300, dur: 0.08, level: 0.1 });
    }),
    // Paint splats onto a wooden board.
    hit: play(() => {
      tone({ type: 'sine', from: 190, to: 85, dur: 0.16, level: 0.5 });
      hiss({ dur: 0.05, level: 0.35, freq: 2400, q: 2 });
      hiss({ at: 0.02, dur: 0.12, level: 0.2, freq: 700, to: 300, q: 0.7 });
    }),
    // Paint landing on the ground.
    splat: play(() => {
      hiss({ dur: 0.14, level: 0.24, freq: 800, to: 250, q: 0.8 });
    }),
    // A paint ball sails past everything.
    miss: play(() => {
      hiss({ at: 0.05, dur: 0.28, level: 0.18, freq: 900, to: 2600, q: 3 });
    }),
    // A right letter in a spelling word.
    letter: play(() => {
      tone({ from: 784, dur: 0.1, level: 0.22, at: 0.06 });
      tone({ from: 1175, dur: 0.16, level: 0.2, at: 0.13 });
    }),
    // The right answer: a bright climb.
    right: play(() => {
      [523, 659, 784, 1047].forEach((from, index) => tone({ from, dur: index === 3 ? 0.34 : 0.14, level: 0.24, at: 0.1 + index * 0.08 }));
    }),
    // A soft footstep on the pavers. Alternating pitch keeps it from sounding like a clock.
    step: (() => {
      let left = false;
      return play(() => {
        left = !left;
        hiss({ dur: 0.07, level: 0.22, freq: left ? 420 : 360, q: 1.2 });
        tone({ type: 'sine', from: left ? 120 : 105, to: 70, dur: 0.08, level: 0.18 });
      });
    })(),
    // Picking up a gear: a quick sparkle.
    gear: play(() => {
      [1319, 1568, 2093].forEach((from, index) => tone({ type: 'sine', from, dur: 0.12, level: 0.14, at: index * 0.05 }));
    }),
    // Not yet: two gentle low notes, never a harsh buzz.
    wrong: play(() => {
      tone({ from: 330, to: 300, dur: 0.16, level: 0.22, at: 0.08 });
      tone({ from: 247, to: 220, dur: 0.26, level: 0.22, at: 0.26 });
    })
  };
}
