import * as THREE from 'three';
import { buddyKind, makeBuddy, savedLook } from '/lib/buddy3d.mjs?v=cabin1';
import { readPad, actionDown, moveDirs } from '../../lib/pad-core.mjs?v=pad-rt';
import { attachTouchControls, isTouchDevice } from '../../lib/touch-controls.mjs?v=touch1';
import { makeWorldFriends, mountWorldFriendControls } from '../../lib/world-friends.mjs';
import { BUSY_MAX, NAP_TIME, SEND_EVERY, SNAP_EVERY, nearestAwake, packSnap, readSnap, readSpot, readSpray } from './friends.mjs?v=cabin1';

// ===================================================================
// Cabin camp — keep the garden buddy's cabin cozy at dusk
// ===================================================================
// A raccoon family lives just past the treeline. When the lantern comes on
// they wander in for a snack. Water them gently from the watering can and
// they trot home happy. Questions from Little Sprouts arrive between rounds.

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const TWILIGHT = 0x3a5474;
const scene = new THREE.Scene();
scene.background = new THREE.Color(TWILIGHT);
scene.fog = new THREE.Fog(TWILIGHT, 40, 78);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
const CAM_OFFSET = new THREE.Vector3(0, 27, 12);

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);
onResize();

// ---------- shared geometry / materials ----------
const BOX = new THREE.BoxGeometry(1, 1, 1);

// ---------- block building: everything in the game is made of these ----------
// chamfered box: every edge is cut at 45° so it catches a thin highlight,
// which keeps the blocks reading as separate shapes at gameplay distance.
// Built at its real size (not scaled) so the bevels stay even, with UVs
// box-projected in world units so a texture keeps one scale on every part.
const UV_UNIT = 0.32; // world units per texture repeat
const bevelCache = new Map();
function bevelBox(w, h, d, r = 0.03) {
  const key = `${w},${h},${d},${r}`;
  if (bevelCache.has(key)) return bevelCache.get(key);
  const e = [w / 2, h / 2, d / 2];
  r = Math.min(r, e[0] * 0.45, e[1] * 0.45, e[2] * 0.45);
  // corner `s` (a sign per axis), pulled in by r on every axis except `a`
  const V = (s, a) => e.map((v, i) => s[i] * (i === a ? v : v - r));
  const sg = (a, sa, b, sb, c, sc) => { const s = []; s[a] = sa; s[b] = sb; s[c] = sc; return s; };
  const pos = [], nrm = [], uv = [];
  const p0 = new THREE.Vector3(), n = new THREE.Vector3(), q = new THREE.Vector3();
  const face = pts => {
    p0.fromArray(pts[0]);
    n.fromArray(pts[1]).sub(p0).cross(q.fromArray(pts[2]).sub(p0)).normalize();
    if (n.dot(p0) < 0) { pts = pts.slice().reverse(); n.negate(); } // wind outward (the box is convex)
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    const [u, v] = ax >= ay && ax >= az ? [2, 1] : ay >= az ? [0, 2] : [0, 1];
    for (let i = 1; i < pts.length - 1; i++) {
      for (const p of [pts[0], pts[i], pts[i + 1]]) {
        pos.push(p[0], p[1], p[2]); nrm.push(n.x, n.y, n.z); uv.push(p[u] / UV_UNIT, p[v] / UV_UNIT);
      }
    }
  };
  for (let a = 0; a < 3; a++) {
    const b = (a + 1) % 3, c = (a + 2) % 3;
    for (const sa of [1, -1]) {
      face([[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([sb, sc]) => V(sg(a, sa, b, sb, c, sc), a))); // flat face
      for (const sb of [1, -1]) {                                                                  // bevel strip a|b
        face([V(sg(a, sa, b, sb, c, 1), a), V(sg(a, sa, b, sb, c, -1), a),
              V(sg(a, sa, b, sb, c, -1), b), V(sg(a, sa, b, sb, c, 1), b)]);
      }
    }
  }
  for (const x of [1, -1]) for (const y of [1, -1]) for (const z of [1, -1]) {
    face([0, 1, 2].map(a => V([x, y, z], a)));                                                     // corner
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  bevelCache.set(key, g);
  return g;
}
// Collects colored blocks into one vertex-colored geometry, so a whole wall, prop or
// body part is a single draw call. A block: [w, h, d, x, y, z, color, rx, ry, rz, bevel]
// (turned by ry, then tilted by rx and rz).
// `parent` (optional Matrix4) places a whole group of blocks, e.g. a prop in the world.
const _bkM = new THREE.Matrix4(), _bkN = new THREE.Matrix3(), _bkQ = new THREE.Quaternion(), _bkE = new THREE.Euler();
const _bkP = new THREE.Vector3(), _bkS = new THREE.Vector3(1, 1, 1), _bkV = new THREE.Vector3(), _bkC = new THREE.Color();
// `flat` (or a bevel of 0) uses plain 12-triangle boxes: for blades of grass and far-off
// trees, where a chamfer wouldn't be seen but would cost 44 triangles a block.
const plainCache = new Map();
const plainBox = (w, h, d) => {
  const key = `${w},${h},${d}`;
  if (!plainCache.has(key)) plainCache.set(key, new THREE.BoxGeometry(w, h, d).toNonIndexed());
  return plainCache.get(key);
};
class BlockBatch {
  constructor() { this.pos = []; this.nrm = []; this.col = []; }
  add(blocks, rng, parent, flat = false) {
    for (const [w, h, d, x, y, z, hex, rx = 0, ry = 0, rz = 0, r = 0.025] of blocks) {
      const g = flat || r <= 0 ? plainBox(w, h, d) : bevelBox(w, h, d, r);
      _bkM.compose(_bkP.set(x, y, z), _bkQ.setFromEuler(_bkE.set(rx, ry, rz, 'YXZ')), _bkS);
      if (parent) _bkM.premultiply(parent);
      _bkN.getNormalMatrix(_bkM);
      // each block a shade lighter or darker, for a hand-painted look
      _bkC.setHex(hex).multiplyScalar(0.9 + rng() * 0.2);
      const P = g.attributes.position.array, N = g.attributes.normal.array;
      for (let i = 0; i < P.length; i += 3) {
        _bkV.fromArray(P, i).applyMatrix4(_bkM); this.pos.push(_bkV.x, _bkV.y, _bkV.z);
        _bkV.fromArray(N, i).applyMatrix3(_bkN).normalize(); this.nrm.push(_bkV.x, _bkV.y, _bkV.z);
        this.col.push(_bkC.r, _bkC.g, _bkC.b);
      }
    }
    return this;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    return g;
  }
}
const bakeBlocks = (blocks, rng, flat) => new BlockBatch().add(blocks, rng, null, flat).build();
// small seeded RNG so baked models come out the same every load
function seeded(n) {
  return () => ((n = (n * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ===================================================================
// AUDIO — procedural Web Audio (no external files). Classic chip voices
// (NES-style pulse waves, a 4-bit stepped triangle and LFSR noise) played
// through a modern mix: separate buses, convolution reverb, tempo-synced echo,
// music ducking, stereo placement and a bus compressor.
// ===================================================================
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
const rnd = (a, b) => a + Math.random() * (b - a);

// --- saved settings and best run (localStorage can throw in a sandboxed frame, so guard it) ---
const store = {
  get(k, fallback) { try { return JSON.parse(localStorage.getItem('cabin-' + k)) ?? fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem('cabin-' + k, JSON.stringify(v)); } catch { /* not persisted */ } },
};
const settings = Object.assign({ master: 7, music: 5, shake: true }, store.get('settings', {})); // volumes are 0..10

const audio = {
  ctx: null, muted: false, waves: {}, bufs: {}, lastHit: 0, lastHover: 0, stepAlt: false,
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.buildVoices();
    this.buildMix();
    this.applyVolume();
    this.startWind();
    music.start();
  },
  ok() { return this.ctx && !this.muted; },
  t() { return this.ctx.currentTime; },

  // --- chip voices: band-limited pulse/triangle tables + LFSR noise buffers ---
  buildVoices() {
    const c = this.ctx;
    // DFT one cycle of samples into a PeriodicWave (band-limited, so no aliasing fizz)
    const table = s => {
      const N = s.length, H = 64, re = new Float32Array(H), im = new Float32Array(H);
      for (let n = 1; n < H; n++) for (let k = 0; k < N; k++) {
        const ph = 2 * Math.PI * n * k / N;
        re[n] += s[k] * Math.cos(ph); im[n] += s[k] * Math.sin(ph);
      }
      return c.createPeriodicWave(re, im);
    };
    const cycle = fn => Array.from({ length: 256 }, (_, k) => fn(k / 256));
    this.waves.pulse12 = table(cycle(p => p < 0.125 ? 1 : -1));
    this.waves.pulse25 = table(cycle(p => p < 0.25 ? 1 : -1));
    this.waves.pulse50 = table(cycle(p => p < 0.5 ? 1 : -1));
    // the NES triangle is a 32-step, 4-bit staircase — that grit is the "classic" bass
    this.waves.tri = table(cycle(p => { const s = Math.floor(p * 32); return (s < 16 ? 15 - s : s - 16) / 7.5 - 1; }));

    // 15-bit LFSR noise: long mode = hiss, short mode (93-step loop) = metallic buzz
    const lfsr = (short, len) => {
      const b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
      let r = 1;
      for (let i = 0; i < len; i++) {
        const fb = (r & 1) ^ ((r >> (short ? 6 : 1)) & 1);
        r = (r >> 1) | (fb << 14);
        d[i] = r & 1 ? 0.8 : -0.8;
      }
      return b;
    };
    this.bufs.noise = lfsr(false, c.sampleRate * 2);
    this.bufs.metal = lfsr(true, 93 * 64);
    const w = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), wd = w.getChannelData(0);
    for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;
    this.bufs.white = w;
  },

  // --- mix: sfx/music/reverb buses → master → muffle → post → mute → compressor ---
  buildMix() {
    const c = this.ctx;
    const gain = (v, to) => { const g = c.createGain(); g.gain.value = v; if (to) g.connect(to); return g; };
    const filt = (type, f, to) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; if (to) b.connect(to); return b; };
    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -12; this.comp.knee.value = 8; this.comp.ratio.value = 5;
    this.comp.attack.value = 0.002; this.comp.release.value = 0.2;
    // brickwall limiter after the glue compressor so stacked impacts never clip
    this.limiter = c.createDynamicsCompressor();
    this.limiter.threshold.value = -2; this.limiter.knee.value = 0; this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.001; this.limiter.release.value = 0.08;
    this.comp.connect(this.limiter); this.limiter.connect(c.destination);
    this.mute = gain(this.level(), this.comp);
    this.post = gain(1, this.mute);                 // after the muffle: impacts that should stay crisp
    this.muffle = filt('lowpass', 20000, this.post); // swept down when you get hit
    this.master = gain(0.8, this.muffle);
    this.sfx = gain(1, this.master);
    this.verb = c.createConvolver(); this.verb.buffer = this.impulse(2.8);
    this.verb.connect(gain(0.45, this.master));
    // music: in → [echo] → lowpass → duck → volume → master, with a reverb send
    this.musicVol = gain(1, this.master);
    this.duck = gain(1, this.musicVol);
    this.musicLP = filt('lowpass', 18000, this.duck);
    this.musicIn = gain(0.5, this.musicLP);
    this.musicVerb = gain(1, this.verb);
    this.musicIn.connect(gain(0.22, this.musicVerb));
    this.echo = c.createDelay(1); this.echo.delayTime.value = 0.34;
    const fb = gain(0.36), damp = filt('lowpass', 2600);
    this.echo.connect(damp); damp.connect(fb); fb.connect(this.echo); damp.connect(this.musicLP);
    this.echoIn = gain(0.5, this.echo);
    this.musicWet = gain(1, this.musicIn); // dry + echo send in one
    this.musicWet.connect(this.echoIn);
  },
  // stereo noise tail with a darkening exponential decay — a big, dark room
  impulse(dur) {
    const c = this.ctx, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / n, k = 0.6 - t * 0.5; // smoothing grows with time: highs die first
        lp += (Math.random() * 2 - 1 - lp) * k;
        d[i] = i < c.sampleRate * 0.012 ? 0 : lp * Math.pow(1 - t, 3.2);
      }
    }
    return b;
  },
  // ambient night wind: filtered noise with slowly wandering pitch and level
  startWind() {
    const c = this.ctx, src = c.createBufferSource(); src.buffer = this.bufs.white; src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 1.1;
    const g = c.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.06, c.currentTime + 5);
    const lfo = (f, depth, param) => {
      const o = c.createOscillator(); o.frequency.value = f;
      const d = c.createGain(); d.gain.value = depth; o.connect(d); d.connect(param); o.start();
    };
    lfo(0.07, 220, bp.frequency);
    lfo(0.13, 0.025, g.gain);
    src.connect(bp); bp.connect(g); g.connect(this.master); src.start();
    this.windGain = g;
  },
  // storm level 0..1 and the current gust (around 1)
  weather(level, gust) {
    if (!this.ctx) return;
    this.windGain.gain.setTargetAtTime(0.06 + 0.2 * level * level * gust, this.t(), 0.4);
  },
  // thunder: a long roll, louder the closer the strike (near: 0 far .. 1 overhead)
  thunder(near) {
    if (!this.ok()) return;
    const t = this.t(), o = this.out(0.45 + 0.45 * near, rnd(-0.4, 0.4), 0.5);
    for (let i = 0; i < 4; i++) // overlapping rumbles, so it rolls rather than booms
      this.nz(o, t + i * rnd(0.2, 0.6), { rate: 0.08, f: rnd(140, 320), dur: rnd(1.8, 4.2), v: rnd(0.5, 0.9), a: rnd(0.05, 0.3) });
    this.duckMusic(0.55, 1.8);
  },

  // --- building blocks ---
  // a per-sound output: gain → stereo pan → bus, plus a reverb send
  out(v, pan = 0, wet = 0.15, bus = this.sfx) {
    const c = this.ctx, g = c.createGain(); g.gain.value = v;
    let n = g;
    if (pan && c.createStereoPanner) {
      const p = c.createStereoPanner(); p.pan.value = Math.max(-0.9, Math.min(0.9, pan));
      g.connect(p); n = p;
    }
    n.connect(bus);
    if (wet) { const s = c.createGain(); s.gain.value = wet; n.connect(s); s.connect(this.verb); }
    return g;
  },
  // oscillator note. w: chip table name or native type. Percussive decay by default;
  // pass `hold` (s) for a gated, sustained note. `vib` = vibrato depth in semitones.
  osc(dest, at, { w = 'pulse50', f, f2, dur = 0.2, v = 1, a = 0.002, hold, vib = 0 }) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    if (this.waves[w]) o.setPeriodicWave(this.waves[w]); else o.type = w;
    o.frequency.setValueAtTime(f, at);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + (hold || dur));
    if (vib) {
      const l = c.createOscillator(), d = c.createGain();
      l.frequency.value = 5.5; d.gain.setValueAtTime(0, at);
      d.gain.linearRampToValueAtTime(f * (Math.pow(2, vib / 12) - 1), at + Math.min(0.25, (hold || dur) * 0.6));
      l.connect(d); d.connect(o.frequency); l.start(at); l.stop(at + (hold || dur) + 0.1);
    }
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(v, at + a);
    let end;
    if (hold) {
      g.gain.setTargetAtTime(v * 0.6, at + a, hold * 0.4);
      g.gain.setValueAtTime(v * 0.6, at + hold);   // anchor the release
      g.gain.linearRampToValueAtTime(0, at + hold + 0.05);
      end = at + hold + 0.06;
    } else {
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      end = at + dur + 0.02;
    }
    o.connect(g); g.connect(dest); o.start(at); o.stop(end);
  },
  // filtered noise burst. buf: noise | metal | white; rate < 1 pitches the LFSR down (crunchier)
  nz(dest, at, { buf = 'noise', rate = 1, type = 'lowpass', f = 2000, f2, q = 0.7, dur = 0.2, v = 1, a = 0.001 }) {
    const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.bufs[buf]; s.loop = true; s.playbackRate.value = rate;
    fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f, at);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, at + dur);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(v, at + a);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(fl); fl.connect(g); g.connect(dest);
    s.start(at, Math.random() * s.buffer.duration * 0.9); s.stop(at + dur + 0.02);
  },
  // throaty raccoon voice: two detuned saws through vowel formants, wobbling and sagging
  growl(dest, at, { f, f2, dur, v, formant = 600, a = 0.08 }) {
    const c = this.ctx, g = c.createGain(), f1 = c.createBiquadFilter(), fm = c.createBiquadFilter();
    f1.type = 'bandpass'; f1.frequency.value = formant; f1.Q.value = 2.5;
    fm.type = 'bandpass'; fm.frequency.value = formant * 1.8; fm.Q.value = 4;
    const lfo = c.createOscillator(), ld = c.createGain();
    lfo.frequency.value = rnd(5, 9); ld.gain.value = f * 0.06; lfo.connect(ld);
    for (const det of [0, 9]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.detune.value = det;
      o.frequency.setValueAtTime(f, at); o.frequency.exponentialRampToValueAtTime(f2, at + dur);
      ld.connect(o.frequency); o.connect(f1); o.connect(fm);
      o.start(at); o.stop(at + dur + 0.05);
    }
    lfo.start(at); lfo.stop(at + dur + 0.05);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(v, at + a);
    g.gain.setTargetAtTime(v * 0.7, at + a, dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    f1.connect(g); fm.connect(g); g.connect(dest);
  },
  // stereo position + distance falloff for something at world (x, z), relative to the player
  place(pos) {
    const dx = pos.x - player.position.x, dz = pos.z - player.position.z;
    return { pan: dx / 12, near: 1 / (1 + Math.hypot(dx, dz) / 7) };
  },
  // pull the music down for a moment (impacts, stingers)
  duckMusic(depth, dur) {
    const g = this.duck.gain, t = this.t();
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(depth, t + 0.03);
    g.setTargetAtTime(1, t + dur, dur * 0.4);
  },
  // muffle the whole mix (concussion) — sounds on the `post` bus cut through
  muffleFor(dur, freq) {
    const f = this.muffle.frequency, t = this.t();
    f.cancelScheduledValues(t); f.setValueAtTime(freq, t);
    f.setTargetAtTime(20000, t + dur * 0.4, dur * 0.35);
  },

  // pause: sink the whole mix under a low muffle so the score keeps breathing quietly
  pause(on) {
    if (!this.ctx) return;
    const t = this.t();
    this.muffle.frequency.cancelScheduledValues(t);
    this.muffle.frequency.setTargetAtTime(on ? 500 : 20000, t, on ? 0.08 : 0.15);
    this.master.gain.setTargetAtTime(on ? 0.45 : 0.8, t, 0.1);
  },

  // --- SFX ---
  spray(hot, spread) {
    if (!this.ok()) return;
    const t = this.t(), p = rnd(0.94, 1.06), o = this.out(0.55, 0, 0.12);
    this.nz(o, t, { buf: 'white', type: 'bandpass', f: 2600, f2: 900, q: 0.9, dur: 0.09, v: 0.28 }); // pfft of water
    this.osc(o, t, { w: 'sine', f: 620 * p, f2: 240, dur: 0.07, v: 0.16 });                       // little plip
    this.nz(o, t, { rate: 0.6 * p, f: 2400, f2: 500, dur: spread ? 0.24 : 0.16, v: 0.16 });         // spray tail
    if (hot) this.osc(o, t, { w: 'pulse12', f: midiHz(86), f2: midiHz(93), dur: 0.08, v: 0.07 });   // SUPER SPRAY sparkle
  },
  splash(pos) {
    if (!this.ok() || this.t() - this.lastHit < 0.03) return; // pierce/buckshot can hit many in one frame
    const t = this.lastHit = this.t(), { pan, near } = this.place(pos), o = this.out(0.45 + near * 0.35, pan, 0.08);
    this.osc(o, t, { w: 'sine', f: rnd(700, 900), f2: 320, dur: 0.09, v: 0.3 });                     // drippy plip
    this.nz(o, t, { rate: rnd(0.5, 0.7), type: 'bandpass', f: 1800, q: 1.2, dur: 0.06, v: 0.35 });  // tiny splash
  },
  cheer(pos) {
    if (!this.ok()) return;
    const t = this.t(), p = rnd(0.9, 1.1), { pan, near } = this.place(pos), o = this.out(0.5 + near * 0.4, pan, 0.2);
    // the raccoon giggles and trots home: a happy rising triad and a leafy poof
    [72, 76, 79].forEach((m, i) => this.osc(o, t + i * 0.05, { w: 'pulse25', f: midiHz(m) * p, dur: 0.12, v: 0.24 }));
    this.nz(o, t, { rate: 0.5, f: 2400, f2: 700, dur: 0.16, v: 0.3 });                              // leaf rustle
    this.osc(o, t, { w: 'tri', f: midiHz(48), dur: 0.12, v: 0.2 });
  },
  chatter(pos) {
    if (!this.ok()) return;
    const t = this.t(), { pan, near } = this.place(pos), o = this.out(0.22 + near * 0.45, pan, 0.3);
    // soft chittering rather than a groan: three little high chirps
    for (let i = 0; i < 3; i++) this.osc(o, t + i * 0.07, { w: 'pulse12', f: midiHz(84 + i * 2), f2: midiHz(79 + i * 2), dur: 0.05, v: 0.12 });
    this.nz(o, t, { rate: 0.9, type: 'bandpass', f: 3200, q: 2, dur: 0.12, v: 0.1 });
  },
  swish(pos) { // a raccoon's paw catching only air
    if (!this.ok()) return;
    const t = this.t(), { pan, near } = this.place(pos), o = this.out(0.25 + near * 0.35, pan, 0.05);
    this.nz(o, t, { buf: 'white', type: 'bandpass', f: 900, f2: 2000, q: 1.2, dur: 0.14, v: 0.28, a: 0.04 });
  },
  // doors and windows (pos = the opening)
  knock(pos, v = 1) { // a paw drumming on a plank door
    if (!this.ok()) return;
    const t = this.t(), { pan, near } = this.place(pos), o = this.out((0.3 + near * 0.4) * v, pan, 0.2);
    this.osc(o, t, { w: 'sine', f: rnd(140, 160), f2: 80, dur: 0.12, v: 0.5 });
    this.nz(o, t, { rate: 0.7, f: 1100, f2: 420, dur: 0.08, v: 0.34 });
  },
  crack(pos) { // the glass gives a little
    if (!this.ok()) return;
    const t = this.t(), { pan, near } = this.place(pos), o = this.out(0.3 + near * 0.4, pan, 0.2);
    this.osc(o, t, { w: 'sine', f: 90, f2: 50, dur: 0.1, v: 0.45 });
    this.nz(o, t, { buf: 'metal', type: 'highpass', f: 3500, dur: 0.07, v: 0.45 });
    this.osc(o, t, { w: 'tri', f: 2400, f2: 1700, dur: 0.05, v: 0.14 });
  },
  shatter(pos) {
    if (!this.ok()) return;
    const t = this.t(), { pan, near } = this.place(pos), o = this.out(0.4 + near * 0.45, pan, 0.3);
    this.nz(o, t, { buf: 'white', type: 'highpass', f: 2500, dur: 0.4, v: 0.45 });
    this.nz(o, t, { buf: 'metal', type: 'bandpass', f: 6000, q: 1, dur: 0.28, v: 0.3 });
    for (let i = 0; i < 9; i++) // shards tinkling down
      this.osc(o, t + 0.05 + Math.random() * 0.5, { w: 'pulse12', f: rnd(2500, 5000), dur: 0.04, v: rnd(0.03, 0.07) });
  },
  doorBreak(pos) {
    if (!this.ok()) return;
    const t = this.t(), { pan, near } = this.place(pos), o = this.out(0.45 + near * 0.45, pan, 0.3);
    this.osc(o, t, { w: 'sine', f: 110, f2: 60, dur: 0.22, v: 0.55 });
    this.nz(o, t, { rate: 0.5, f: 1200, f2: 260, dur: 0.3, v: 0.5 });
    this.osc(o, t + 0.34, { w: 'sine', f: 90, f2: 55, dur: 0.2, v: 0.4 });   // ...and it settles on the floor
    this.nz(o, t + 0.34, { rate: 0.4, f: 700, f2: 200, dur: 0.2, v: 0.4 });
  },
  bump() {
    if (!this.ok()) return;
    const t = this.t(), o = this.out(0.7, 0, 0.1, this.post);
    // a soft boop, a wobble, and a friendly little "woah" on the way down
    this.osc(o, t, { w: 'sine', f: 240, f2: 120, dur: 0.18, v: 0.55 });
    this.nz(o, t, { rate: 0.35, f: 900, f2: 300, dur: 0.16, v: 0.3 });
    this.osc(o, t + 0.1, { w: 'tri', f: midiHz(69), f2: midiHz(64), dur: 0.2, v: 0.2 });
    this.duckMusic(0.4, 0.5);
  },
  step() {
    if (!this.ok()) return;
    const t = this.t(), o = this.out(0.16, 0, 0.05);
    this.stepAlt = !this.stepAlt;
    this.nz(o, t, { rate: 0.3, f: 520, dur: 0.04, v: 0.5 });                                        // paw on boards
    this.osc(o, t, { w: 'tri', f: this.stepAlt ? 140 : 128, f2: 90, dur: 0.05, v: 0.3 });
  },
  canOut() {
    if (!this.ok()) return;
    const t = this.t(), o = this.out(0.5, 0.15, 0.08);
    this.nz(o, t, { buf: 'metal', rate: 0.6, type: 'highpass', f: 2600, dur: 0.04, v: 0.4 });   // cap off
    this.osc(o, t, { w: 'pulse12', f: 900, f2: 640, dur: 0.03, v: 0.1 });
  },
  canIn() {
    if (!this.ok()) return;
    const t = this.t(), o = this.out(0.55, 0.15, 0.1);
    this.nz(o, t, { buf: 'metal', rate: 0.5, type: 'bandpass', f: 1800, q: 1.5, dur: 0.05, v: 0.45 }); // cap on
    this.osc(o, t, { w: 'tri', f: 340, f2: 210, dur: 0.06, v: 0.28 });
    [76, 83].forEach((m, i) => this.osc(o, t + 0.11 + i * 0.06, { w: 'pulse25', f: midiHz(m), dur: 0.08, v: 0.1 })); // ready chime
  },
  pickup(id) {
    if (!this.ok()) return;
    const t = this.t(), o = this.out(0.6, 0, 0.3);
    const arps = { med: [65, 69, 72, 77, 81], dmg: [67, 72, 76, 79, 84], ammo: [69, 74, 78, 81, 86], fast: [72, 76, 79, 84, 88], wide: [64, 69, 73, 76, 81], feet: [70, 74, 77, 82, 86], shield: [60, 67, 72, 76, 79] };
    (arps[id] || arps.med).forEach((m, i) => {
      this.osc(o, t + i * 0.055, { w: id === 'dmg' ? 'pulse12' : 'pulse25', f: midiHz(m), dur: 0.18, v: 0.26 });
      this.osc(o, t + i * 0.055, { w: 'tri', f: midiHz(m - 12), dur: 0.12, v: 0.22 });
    });
    this.nz(o, t, { buf: 'metal', rate: 1, type: 'highpass', f: 6000, dur: 0.4, v: 0.07 });       // shimmer
  },

  waveStart(n) {
    music.setMode('combat');
    if (!this.ok()) return;
    const t = this.t(), o = this.out(0.55, 0, 0.6);
    // a warm garden bell welcomes the next little crowd
    [65, 69, 72, 77].forEach((m, i) => this.osc(o, t + i * 0.08, { w: 'sine', f: midiHz(m), dur: 1.2, v: 0.16, a: 0.006 }));
    this.osc(o, t, { w: 'tri', f: midiHz(41), dur: 0.9, v: 0.3 });
    if (n > 1) [72, 74, 76].forEach((m, i) => this.osc(o, t + 0.3 + i * 0.11, { w: 'pulse25', f: midiHz(m), hold: 0.12, v: 0.12 }));
    this.duckMusic(0.5, 1.0);
  },
  waveClear() {
    music.setMode('calm');
    if (!this.ok()) return;
    const t = this.t(), o = this.out(0.55, 0, 0.35);
    // a chip fanfare in F major
    [65, 69, 72, 77].forEach((m, i) => this.osc(o, t + i * 0.09, { w: 'pulse25', f: midiHz(m), hold: 0.08, v: 0.28 }));
    this.osc(o, t + 0.36, { w: 'pulse25', f: midiHz(81), hold: 0.7, v: 0.28, vib: 0.3 });
    this.osc(o, t + 0.36, { w: 'pulse12', f: midiHz(77), hold: 0.7, v: 0.14 });
    this.osc(o, t, { w: 'tri', f: midiHz(53), hold: 1, v: 0.4 });
    this.nz(o, t + 0.36, { buf: 'metal', type: 'highpass', f: 5000, dur: 1, v: 0.1 });
    this.duckMusic(0, 1.4);
  },
  deal(count) {
    if (!this.ok()) return;
    const t = this.t();
    for (let i = 0; i < count; i++) {
      const o = this.out(0.4, (i - (count - 1) / 2) * 0.5, 0.1);
      this.nz(o, t + 0.05 + i * 0.09, { buf: 'white', type: 'bandpass', f: 3200, f2: 1400, q: 1.5, dur: 0.07, v: 0.7 });
      this.osc(o, t + 0.05 + i * 0.09, { w: 'pulse12', f: midiHz(74 + i * 5), dur: 0.05, v: 0.12 });
    }
  },
  hover(i) {
    if (!this.ok() || this.t() - this.lastHover < 0.05) return;
    const t = this.lastHover = this.t();
    this.osc(this.out(0.3, (i - 1) * 0.4, 0.1), t, { w: 'pulse12', f: midiHz(81 + i * 2), dur: 0.04, v: 0.25 });
  },
  upgrade(cat) {
    if (!this.ok()) return;
    const t = this.t(), o = this.out(0.55, 0, 0.35), up = { firepower: 0, handling: 2, survival: 5, fortune: 7 }[cat] || 0;
    this.osc(o, t, { w: 'pulse12', f: 180, f2: 1700, dur: 0.3, v: 0.12 });                       // power-up sweep
    [62, 69, 74, 78, 81].forEach((m, i) => this.osc(o, t + i * 0.05, { w: 'pulse25', f: midiHz(m + up), dur: 0.2, v: 0.25 }));
  },
  death() {
    music.setMode('dead');
    if (!this.ok()) return;
    const t = this.t() + 0.2, o = this.out(0.55, 0, 0.45, this.post);
    // a soft music-box "aww": five notes drifting down, then a warm low hug
    [81, 79, 77, 76, 72].forEach((m, i) =>
      this.osc(o, t + i * 0.26, { w: 'sine', f: midiHz(m), dur: 0.7, v: 0.22, a: 0.004 }));
    [65, 72].forEach((m, i) => this.osc(o, t + 1.15 + i * 0.05, { w: 'tri', f: midiHz(m), dur: 1.6, v: 0.18, a: 0.02 }));
    this.osc(o, t + 1.15, { w: 'sine', f: midiHz(41), dur: 2.2, v: 0.3, a: 0.03 });
    this.nz(o, t + 1.15, { buf: 'metal', type: 'highpass', f: 6000, dur: 1.2, v: 0.05 });
  },
  toggleMute() {
    this.muted = !this.muted;
    this.applyVolume();
    return this.muted;
  },
  // the settings sliders run 0..10, where 8 is the mix as designed (10 is +4 dB, and the
  // limiter catches it); squared so each step sounds like an even step
  level() { return this.muted ? 0 : (settings.master / 8) ** 2; },
  applyVolume() {
    if (!this.ctx) return;
    const t = this.t(), m = (settings.music / 8) ** 2;
    this.mute.gain.setTargetAtTime(this.level(), t, 0.03);
    this.musicVol.gain.setTargetAtTime(m, t, 0.03);
    this.musicVerb.gain.setTargetAtTime(m, t, 0.03);
  },
  // menu blips: quiet and short
  ui(kind) {
    if (!this.ok() || this.t() - this.lastHover < 0.04) return;
    const t = this.lastHover = this.t(), o = this.out(0.3, 0, 0.12);
    if (kind === 'move') this.osc(o, t, { w: 'pulse12', f: midiHz(81), dur: 0.035, v: 0.2 });
    else if (kind === 'back') this.osc(o, t, { w: 'pulse12', f: midiHz(74), f2: midiHz(69), dur: 0.07, v: 0.18 });
    else [76, 83].forEach((m, i) => this.osc(o, t + i * 0.05, { w: 'pulse12', f: midiHz(m), dur: 0.06, v: 0.18 }));
  },
};

// ===================================================================
// MUSIC — an adaptive score in F major for the chip voices, arranged like a modern
// game soundtrack: extended chords voiced for smooth voice leading, one theme that
// comes back in every mode (music box on the title, full band in the fight, easy
// swung keys between waves), song forms that branch on how busy the garden is, a
// sidechained stereo pad, twin-lead harmony and drum fills. Sequenced in 16ths
// with lookahead on the audio clock; mode changes land on the next beat.
//   title   the theme on music-box bells over a slow pad, then harmonized, then an interlude
//   combat  every 8 bars picks A (theme) / B (climax) / C (half-time breakdown) from the
//           heat (wave + raiders alive), and layers 1-3 within each section
//   calm    between waves: swung electric-piano comping, walking bass, the theme in F major
//   dead    the band sags out, then the sting (audio.death)
// ===================================================================
// chords: [bass, ...pad voicing]. Mostly rootless voicings (the bass has the root),
// picked so each voice moves a step or less into the next chord
const CH = {
  Fmaj9:     [41, 55, 57, 60, 64],  // G A C E — home
  Fmaj7:     [41, 53, 57, 60, 64],  // F A C E
  F6:        [41, 55, 57, 60, 62],  // G A C D
  Dm9:       [38, 53, 57, 60, 64],  // F A C E
  Dm7:       [38, 53, 57, 60, 65],  // F A C F
  Bbmaj9:    [34, 53, 57, 60, 62],  // F A C D
  Bbmaj7:    [34, 53, 57, 62, 69],  // F A D A
  Gm9:       [43, 53, 58, 62, 69],  // F Bb D A
  Gm7:       [43, 53, 58, 62, 67],  // F Bb D G
  Cadd9:     [36, 55, 60, 62, 64],  // G C D E
  C69:       [36, 55, 57, 62, 64],  // G A D E
  C7sus:     [36, 53, 55, 58, 60],  // F G Bb C
  C7:        [36, 52, 55, 58, 60],  // E G Bb C
  Am7:       [45, 55, 60, 64, 69],  // G C E A
};
// melodies: [16th step in the 8-bar section, midi note, length in 16ths]
const tune = notes => new Map(notes.map(([s, m, l]) => [s, { m, l }]));
const THEME = tune([ // the main theme, everywhere in F major
  [0, 72, 4], [4, 77, 2], [6, 79, 2], [8, 81, 4], [12, 79, 4],
  [16, 84, 4], [20, 81, 4], [24, 79, 8],
  [32, 77, 4], [36, 81, 4], [40, 84, 6], [46, 82, 2],
  [48, 81, 8], [56, 79, 8],
  [64, 72, 4], [68, 77, 2], [70, 79, 2], [72, 81, 6], [78, 79, 2],
  [80, 84, 4], [84, 81, 4], [88, 79, 4], [92, 77, 4],
  [96, 77, 4], [100, 79, 2], [102, 81, 2], [104, 84, 4], [108, 81, 4],
  [112, 79, 4], [116, 77, 4], [120, 72, 8],
]);
const SOAR = tune([ // the busy version: long lines climbing over the garden
  [0, 84, 6], [6, 81, 2], [8, 84, 4], [12, 86, 4],
  [16, 84, 8], [24, 81, 4], [28, 79, 4],
  [32, 81, 4], [36, 84, 4], [40, 89, 8],
  [48, 86, 4], [52, 84, 4], [56, 81, 4], [60, 79, 4],
  [64, 84, 6], [70, 81, 2], [72, 84, 4], [76, 89, 4],
  [80, 86, 8], [88, 84, 4], [92, 86, 4],
  [96, 89, 8], [104, 86, 4], [108, 84, 4],
  [112, 89, 4], [116, 84, 12],
]);
const GLIDE = tune([ // the breakdown: a slow call on the bells, answered, then a climb back
  [0, 81, 8], [8, 79, 4], [12, 77, 4],
  [16, 79, 16],
  [32, 84, 6], [38, 81, 2], [40, 79, 8], [48, 77, 16],
  [64, 81, 8], [72, 79, 4], [76, 77, 4],
  [80, 76, 16],
  [96, 77, 4], [100, 79, 4], [104, 81, 4], [108, 84, 4],
  [112, 81, 4], [116, 79, 8], [124, 84, 4],
]);
const HAVEN = tune([ // the theme's shape, easy and unhurried, for between waves
  [0, 76, 6], [6, 74, 2], [8, 72, 8],
  [16, 72, 4], [20, 76, 4], [24, 79, 8],
  [32, 77, 6], [38, 76, 2], [40, 74, 8],
  [48, 72, 4], [52, 77, 4], [56, 76, 8],
  [64, 81, 6], [70, 79, 2], [72, 77, 8],
  [80, 76, 4], [84, 77, 4], [88, 81, 8],
  [96, 82, 6], [102, 81, 2], [104, 79, 4], [108, 77, 4],
  [112, 76, 4], [116, 72, 4], [120, 77, 8],
]);
// 8-bar sections: one or two chords a bar (two = a change at the half bar)
const SECTIONS = {
  A: { bars: [['Fmaj9'], ['Dm9'], ['Gm9'], ['C7sus', 'C7'], ['Fmaj9'], ['Dm9'], ['Bbmaj7', 'Am7'], ['C7']], mel: THEME },
  B: { bars: [['Fmaj9'], ['Bbmaj7'], ['Cadd9'], ['Dm9'], ['Bbmaj7'], ['C69'], ['Am7', 'Dm7'], ['C7']], mel: SOAR },
  C: { bars: [['Fmaj9'], ['Bbmaj7'], ['Gm9'], ['Dm9'], ['Fmaj9'], ['Am7'], ['Bbmaj7'], ['C7sus', 'C7']], mel: GLIDE, pedal: 41 },
  I: { bars: [['Bbmaj7'], ['Gm9'], ['Am7'], ['Dm9'], ['Bbmaj7'], ['Cadd9'], ['Am7'], ['C7']] }, // title interlude
  F: { bars: [['Fmaj9'], ['Am7'], ['Bbmaj7'], ['C7sus', 'C7'], ['Fmaj9'], ['Dm9'], ['Gm9'], ['C7']], mel: HAVEN },
};
// a second voice under a melody note: the nearest chord tone at least a minor third below
function harmonyUnder(m, chord) {
  for (let t = m - 3; t >= m - 9; t--) if (chord.some(c => (c - t) % 12 === 0)) return t;
  return null;
}
const ARP_UPDOWN = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 2, 3];
const hum = v => v * (0.9 + Math.random() * 0.2); // a little velocity life

const music = {
  mode: 'off', pending: null, step: 0, next: 0, timer: null, layer: 1, lowHp: false,
  sec: 'A', secN: 0, vary: false, // current section, sections played in this mode, second-pass variation
  lead: null,                      // last lead note { m, end }, for legato glides
  wave: 0, alive: 0,               // fed by the game loop
  start() {
    const c = audio.ctx;
    // persistent voice buses, each panned into the music chain
    const bus = (pan, to, v = 1) => {
      const g = c.createGain(); g.gain.value = v;
      if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(to); }
      else g.connect(to);
      return g;
    };
    // sidechain: pads and arps duck under every kick, so the low end breathes
    this.pump = bus(0, audio.musicIn);
    this.pumpWet = bus(0, audio.musicWet);
    this.padLP = [-0.55, 0.55].map(pan => {
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 0.9;
      f.connect(bus(pan, this.pump));
      return f;
    });
    this.arp = [bus(-0.35, this.pumpWet), bus(0.35, this.pumpWet)];
    this.leadBus = bus(0.08, audio.musicWet);
    this.harmBus = bus(-0.22, audio.musicWet);
    this.bellBus = bus(0.15, audio.musicWet);
    this.keysBus = bus(-0.1, audio.musicWet);
    this.bassBus = bus(0, audio.musicIn);
    this.kit = bus(0, audio.musicIn);
    this.hatBus = bus(0.25, audio.musicIn);
    this.crashBus = bus(-0.3, audio.musicIn);
    this.next = audio.t() + 0.1;
    this.timer = setInterval(() => this.tick(), 25);
    this.setMode('title');
  },
  setMode(m) {
    if (!audio.ctx || m === (this.pending || this.mode)) return;
    if (m !== 'dead') { this.pending = m; return; } // lands on the next beat (see advance)
    this.pending = null;
    this.mode = 'dead';
    const t = audio.t();
    audio.musicLP.frequency.cancelScheduledValues(t);
    audio.musicLP.frequency.setTargetAtTime(120, t, 0.25);
    audio.duck.gain.cancelScheduledValues(t);
    audio.duck.gain.setTargetAtTime(0, t, 0.3);
    clearTimeout(this.reviveT);
    this.reviveT = setTimeout(() => this.setMode('title'), 4200);
  },
  // switch modes on a beat, starting the new mode's score from the top
  enter(m) {
    this.pending = null;
    if (m === this.mode) return;
    const prev = this.mode;
    this.mode = m;
    this.step = 0; this.secN = 0; this.lead = null;
    clearTimeout(this.reviveT);
    if (prev === 'dead') audio.duck.gain.setTargetAtTime(1, audio.t(), 0.8);
    this.filter();
  },
  // music lowpass: wide open, darker between waves, choked while you're on your last heart
  filter() {
    const f = this.mode === 'dead' ? 120 : this.lowHp ? 900 : this.mode === 'calm' ? 6000 : 18000;
    audio.musicLP.frequency.setTargetAtTime(f, audio.t(), 0.4);
  },
  heat() { return 0.1 + this.wave * 0.06 + this.alive / 30 * 0.6; },
  bpm() {
    if (this.mode === 'combat') return Math.min(156, 126 + this.wave * 2);
    return this.mode === 'calm' ? 92 : 76;
  },
  swing() { return this.mode === 'calm' ? 0.16 : this.mode === 'title' ? 0.06 : 0; },
  sixteenth() { return 60 / this.bpm() / 4; },
  dur(steps) { return steps * this.sixteenth(); },
  tick() {
    const c = audio.ctx;
    if (!c || c.state !== 'running') return;
    const lowHp = this.mode === 'combat' && this.lowHp;
    if (lowHp !== this._lowHp) { this._lowHp = lowHp; this.filter(); }
    audio.echo.delayTime.setTargetAtTime(this.sixteenth() * 3, c.currentTime, 0.1); // dotted-8th echo
    if (this.next < c.currentTime) this.next = c.currentTime + 0.02; // fell behind (tab was hidden)
    while (this.next < c.currentTime + 0.12) this.advance();
  },
  advance() {
    if (this.pending && this.step % 4 === 0) this.enter(this.pending);
    const swing = this.step % 2 ? this.swing() * this.sixteenth() : 0; // late off-beats
    if (!audio.muted && this.mode !== 'dead' && this.mode !== 'off') this.play(this.step, this.next + swing);
    this.next += this.sixteenth();
    this.step++;
  },
  // which 8-bar section comes next. The fight goes A → B → A' → (C, or B' when it's hot)
  pickSection() {
    const n = this.secN++;
    if (this.mode === 'title') { this.sec = n % 3 === 2 ? 'I' : 'A'; this.vary = n % 3 === 1; return; }
    if (this.mode === 'calm') { this.sec = 'F'; this.vary = n % 2 === 1; return; }
    const k = n % 4;
    this.sec = k === 1 ? 'B' : k === 3 ? (this.heat() >= 0.55 ? 'B' : 'C') : 'A';
    this.vary = k >= 2;
  },

  // --- instruments ---
  // one enveloped oscillator: attack `a`, optional decay toward decay[0]×v (time constant
  // decay[1]), held for `len`, released over ~r. `from` glides in from another note.
  voice(dest, at, { w = 'pulse25', m, len, v, a = 0.005, r = 0.08, vib = 0, from, det = 0, decay }) {
    const c = audio.ctx, o = c.createOscillator(), g = c.createGain(), f = midiHz(m);
    if (audio.waves[w]) o.setPeriodicWave(audio.waves[w]); else o.type = w;
    o.detune.value = det;
    if (from !== undefined) { o.frequency.setValueAtTime(midiHz(from), at); o.frequency.exponentialRampToValueAtTime(f, at + 0.05); }
    else o.frequency.setValueAtTime(f, at);
    if (vib && len > 0.3) { // delayed vibrato, like a held note on a real instrument
      const l = c.createOscillator(), d = c.createGain();
      l.frequency.value = 5.2; d.gain.setValueAtTime(0, at + 0.18);
      d.gain.linearRampToValueAtTime(f * (Math.pow(2, vib / 12) - 1), at + Math.min(len, 0.5));
      l.connect(d); d.connect(o.frequency); l.start(at); l.stop(at + len + r * 2);
    }
    const end = at + Math.max(len, a);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(v, at + a);
    if (decay) g.gain.setTargetAtTime(v * decay[0], at + a, decay[1]);
    g.gain.setTargetAtTime(0, end, r / 3);
    o.connect(g); g.connect(dest); o.start(at); o.stop(end + r * 2);
  },
  // stereo pad: a 25% and a 50% pulse per note, detuned apart and split left/right
  pad(at, notes, steps, v, a) {
    for (const m of notes) [0, 1].forEach(k =>
      this.voice(this.padLP[k], at, { w: k ? 'pulse50' : 'pulse25', m, len: this.dur(steps), v, a, r: 0.7, det: k ? 8 : -8 }));
  },
  padTone(at, f) { for (const lp of this.padLP) lp.frequency.setTargetAtTime(f, at, 0.4); },
  bass(at, m, steps, v) {
    const len = this.dur(steps) * 0.85;
    this.voice(this.bassBus, at, { w: 'tri', m, len, v, a: 0.004, r: 0.05 });
    this.voice(this.bassBus, at, { w: 'sine', m, len, v: v * 0.5, a: 0.004, r: 0.05 }); // body under the 4-bit grit
  },
  leadNote(at, m, steps, v, { bus = this.leadBus, w = 'pulse25', vib = 0.22 } = {}) {
    // long legato notes slide in from the last one
    const l = this.lead, glide = l && steps >= 4 && Math.abs(at - l.end) < 0.04 && Math.abs(m - l.m) <= 5 ? l.m : undefined;
    this.voice(bus, at, { w, m, len: this.dur(steps) * 0.92, v, a: 0.01, r: 0.12, vib: steps >= 4 ? vib : 0, from: glide });
    if (bus === this.leadBus) this.lead = { m, end: at + this.dur(steps) };
  },
  // music-box tine: a bright strike that rings down, with a quick metallic overtone
  bell(at, m, v) {
    this.voice(this.bellBus, at, { w: 'sine', m, len: 0.01, v, a: 0.002, r: 1.8 });
    this.voice(this.bellBus, at, { w: 'sine', m: m + 12, len: 0.01, v: v * 0.3, a: 0.002, r: 0.5 });
    this.voice(this.bellBus, at, { w: 'tri', m: m + 24, len: 0.01, v: v * 0.1, a: 0.001, r: 0.12 });
  },
  // electric piano: a sine that blooms and settles, with a little tine bark on top
  keys(at, m, steps, v) {
    this.voice(this.keysBus, at, { w: 'sine', m, len: this.dur(steps), v, a: 0.004, r: 0.5, decay: [0.45, 0.4] });
    this.voice(this.keysBus, at, { w: 'tri', m: m + 12, len: 0.04, v: v * 0.16, a: 0.002, r: 0.2 });
  },
  kick(at, v = 0.9) {
    audio.osc(this.kit, at, { w: 'sine', f: 160, f2: 44, dur: 0.18, v });
    audio.nz(this.kit, at, { buf: 'white', type: 'highpass', f: 2500, dur: 0.012, v: v * 0.22 }); // beater click
    for (const p of [this.pump, this.pumpWet]) { p.gain.setValueAtTime(0.3, at); p.gain.setTargetAtTime(1, at + 0.03, 0.09); }
  },
  snare(at, v = 0.5) {
    audio.nz(this.kit, at, { rate: 0.55, type: 'bandpass', f: 2200, q: 0.8, dur: 0.16, v });
    audio.osc(this.kit, at, { w: 'tri', f: 230, f2: 150, dur: 0.07, v: v * 0.6 });
  },
  hat(at, v = 0.12, open = false) {
    audio.nz(this.hatBus, at + (Math.random() - 0.5) * 0.004, { buf: 'metal', type: 'highpass', f: 7000, dur: open ? 0.2 : 0.035, v: hum(v) });
  },
  brush(at, v) { audio.nz(this.hatBus, at, { buf: 'white', type: 'bandpass', f: 3500, q: 0.7, dur: 0.14, v: hum(v), a: 0.03 }); },
  crash(at, v = 0.22) {
    audio.nz(this.crashBus, at, { buf: 'white', type: 'highpass', f: 4500, dur: 1.8, v });
    audio.nz(this.crashBus, at, { buf: 'metal', type: 'highpass', f: 8000, dur: 1.1, v: v * 0.4 });
  },
  tom(at, f, v = 0.6) { audio.osc(this.kit, at, { w: 'sine', f, f2: f * 0.55, dur: 0.22, v }); },
  // filtered noise swelling into the next downbeat
  riser(at, len, v) {
    const c = audio.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = audio.bufs.white; s.loop = true;
    f.type = 'bandpass'; f.Q.value = 1.4;
    f.frequency.setValueAtTime(300, at); f.frequency.exponentialRampToValueAtTime(6000, at + len);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + len);
    g.gain.linearRampToValueAtTime(0, at + len + 0.03);
    s.connect(f); f.connect(g); g.connect(this.crashBus); s.start(at); s.stop(at + len + 0.05);
  },
  heart(at) {
    const o = audio.out(0.9, 0, 0, audio.post);
    audio.osc(o, at, { w: 'sine', f: 62, f2: 40, dur: 0.14, v: 1 });
    audio.osc(o, at + 0.16, { w: 'sine', f: 55, f2: 38, dur: 0.12, v: 0.7 });
  },

  play(step, at) {
    if (step % 128 === 0) this.pickSection();
    const s = step % 16, bar = (step >> 4) % 8, sec = SECTIONS[this.sec];
    const chords = sec.bars[bar], ch = CH[chords[s < 8 ? 0 : chords.length - 1]];
    const bassOf = b => sec.pedal && b < 7 ? sec.pedal : CH[sec.bars[b][0]][0];
    const g = {
      s, bar, sec, ch, pad: ch.slice(1), root: bassOf(bar), bassOf,
      change: s === 0 || (s === 8 && chords.length === 2), // a chord lands here
      span: chords.length === 2 ? 8 : 16,                   // ...and lasts this many 16ths
      mel: sec.mel?.get(step % 128),
    };
    if (this.mode === 'title') this.playTitle(at, g);
    else if (this.mode === 'calm') this.playCalm(at, g);
    else this.playCombat(at, g);
  },

  playTitle(at, { s, ch, pad, root, change, span, mel }) {
    // a slow pad and a held low root under everything
    if (change) { this.pad(at, pad, span, 0.026, 0.9); this.padTone(at, 1100); }
    if (s === 0) this.voice(this.bassBus, at, { w: 'tri', m: root, len: this.dur(15), v: 0.28, a: 0.3, r: 0.8 });
    if (this.sec === 'I') {
      // interlude: stray chimes picked from the chord, high and far apart
      if (s % 6 === 3 && Math.random() < 0.6) this.bell(at, pad[(Math.random() * 4) | 0] + 12, 0.08);
      return;
    }
    if (mel) {
      this.bell(at, mel.m, 0.27);
      if (this.vary) { const h = harmonyUnder(mel.m, ch); if (h) this.bell(at + 0.012, h, 0.12); } // second pass: in harmony
    }
    if (this.vary && s % 4 === 2) this.voice(this.arp[(s >> 2) & 1], at, { w: 'pulse12', m: pad[(s >> 2) % 4] + 12, len: this.dur(2), v: 0.035 });
  },

  playCalm(at, { s, bar, ch, pad, root, bassOf, change, span, mel }) {
    // electric piano comping: a rolled chord on the change, a short stab on the "and" of 3
    if (change) pad.forEach((m, i) => this.keys(at + i * 0.018, m, span, hum(0.05)));
    else if (s === 10 && span === 16) pad.forEach((m, i) => this.keys(at + i * 0.012, m, 2, hum(0.032)));
    if (change) this.pad(at, pad, span, 0.008, 0.4);
    if (s === 0) this.padTone(at, 1400);
    // walking bass: root, fifth, octave, then a half step into the next bar's root
    if (s % 4 === 0) {
      const next = bassOf((bar + 1) % 8);
      this.bass(at, [root, root + 7, root + 12, next > root ? next - 1 : next + 1][s >> 2], 4, hum(0.24));
    }
    // brushes: swept backbeat, ticking quarters
    if (s === 4 || s === 12) this.brush(at, 0.05);
    if (s % 4 === 0) this.hat(at, 0.035);
    else if (s % 2 === 0) this.hat(at, 0.02);
    // the theme in F major on the first pass; the second leaves room for the keys
    if (mel && !this.vary) this.leadNote(at, mel.m, mel.l, 0.13, { w: 'tri', vib: 0.15 });
  },

  playCombat(at, { s, bar, ch, pad, root, bassOf, change, span, mel }) {
    // pick the arrangement layer at each bar line so changes land on the beat
    if (s === 0) { const h = this.heat(); this.layer = h < 0.35 ? 1 : h < 0.7 ? 2 : 3; }
    const L = this.layer, half = this.sec === 'C', last = bar === 7;
    // pad: opens up with the layer; the breakdown sweeps it open across its 8 bars
    if (change) this.pad(at, pad, span, 0.014 + 0.007 * L, 0.06);
    if (s === 0) this.padTone(at, half ? 500 + bar * 320 : 650 + L * 650);
    if (s === 0 && bar === 0 && this.secN > 1 && L >= 2) this.crash(at);

    if (half) {
      // --- breakdown: half time, a pedal in the bass, the call on the bells ---
      if (s === 0) this.bass(at, root, 16, 0.42);
      if (last && s % 2 === 0) this.bass(at, root + 12 * ((s >> 1) & 1), 2, 0.35); // pumps back up into the fight
      if (s === 0 || (L >= 2 && s === 11)) this.kick(at, 0.85);
      if (s === 8 && !last) this.snare(at, 0.55);
      if (s % 4 === 2) this.hat(at, 0.07);
      if (last) {
        if (s === 0) this.riser(at, this.dur(16), 0.18);
        if (s >= 8 || s % 2 === 0) this.snare(at, 0.12 + s * 0.02); // roll, building
      }
      if (mel) this.bell(at, mel.m, 0.2);
      if (this.lowHp && s % 4 === 0) this.heart(at);
      return;
    }

    // --- bass: octave-jumping 8ths, galloping 16ths at full intensity, and a
    // chromatic step into the next bar's root on the last 8th ---
    const gallop = [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1];
    if (L < 3 ? s % 2 === 0 : gallop[s]) {
      let m = root + (s % 4 === 2 ? 12 : 0);
      if (s === 14 && !last) { const nb = bassOf(bar + 1); if (nb !== root) m = nb + (nb > root ? -1 : 1); }
      this.bass(at, m, L < 3 ? 2 : 1, hum(0.3 + 0.03 * L));
    }

    // --- drums, with a tom fill into each new section ---
    const fill = last && s >= 12 && L >= 2;
    if (fill) this.tom(at, [200, 165, 135, 105][s - 12]);
    else {
      if (s === 0 || s === 8 || (L >= 2 && s === 10) || (L >= 3 && s === 3)) this.kick(at);
      if (L >= 2 && (s === 4 || s === 12)) this.snare(at, hum(0.5));
      if (L >= 3 && (s === 7 || s === 15)) this.snare(at, hum(0.1)); // ghost notes
      const open = this.sec === 'B' && L >= 2 && s % 4 === 2;
      if (L >= 3 || s % 2 === 0) this.hat(at, open ? 0.1 : s % 4 === 2 ? 0.16 : 0.08, open);
    }

    // --- arpeggio over the pad voicing, ping-ponging across the stereo field ---
    const arp = [...pad, ...pad.map(n => n + 12)];
    if (L === 1 ? s % 4 === 2 : L === 2 ? s % 2 === 0 : true) {
      const i = L === 1 ? 4 + ((s >> 2) & 3) : L === 2 ? (s >> 1) : ARP_UPDOWN[s];
      this.voice(this.arp[s & 2 ? 1 : 0], at + (Math.random() - 0.5) * 0.004, { w: 'pulse12', m: arp[i], len: this.dur(L === 3 ? 1 : 2) * 0.8, v: hum(0.042), r: 0.05 });
    }

    // --- the tune: soft triangle at layer 1, the pulse lead from 2, doubled an octave
    // down at 3, and a twin-lead harmony on second passes and in the climax ---
    if (mel) {
      if (L === 1) this.leadNote(at, mel.m, mel.l, 0.12, { w: 'tri' });
      else this.leadNote(at, mel.m, mel.l, 0.18);
      if (L >= 3) this.voice(this.leadBus, at, { w: 'pulse50', m: mel.m - 12, len: this.dur(mel.l) * 0.9, v: 0.06, r: 0.1 });
      if (L >= 2 && (this.vary || this.sec === 'B')) {
        const h = harmonyUnder(mel.m, ch);
        if (h) this.leadNote(at, h, mel.l, 0.09, { bus: this.harmBus, w: 'pulse50', vib: 0.15 });
      }
    }
    if (this.lowHp && s % 4 === 0) this.heart(at);
  },
};

// Start the title music as soon as the page loads. Browsers block audio until the
// first click or keypress, which is what the title's PRESS ANY KEY splash collects.
audio.ensure();
function initAudio() {
  audio.ensure();
  ['click', 'keydown', 'touchstart'].forEach(e => document.removeEventListener(e, initAudio));
}
['click', 'keydown', 'touchstart'].forEach(e => document.addEventListener(e, initAudio));
// park the audio clock while the tab is hidden so the score doesn't stutter
document.addEventListener('visibilitychange', () => {
  if (!audio.ctx) return;
  if (document.hidden) audio.ctx.suspend(); else audio.ctx.resume();
});

// ===================================================================
// WORLD: forest floor, plank floor, log walls (with gaps), yard, forest, lights
// ===================================================================
const HALF = 10;            // interior half-extent (cabin is 20x20)
const WALL_H = 2.4;
const WALL_T = 0.7;

const world = new THREE.Group();
scene.add(world);

// Everything static is baked from blocks into a few vertex-colored meshes
// (floor, walls, props) plus instanced trees and undergrowth, so the whole
// set is a couple of dozen draw calls.
const worldMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 });
const GROUND_Y = -0.06; // the forest floor sits just under the cabin boards
function bakedMesh(batch, cast = true) {
  const m = new THREE.Mesh(batch.build(), worldMat);
  m.castShadow = cast; m.receiveShadow = true;
  world.add(m);
  return m;
}
// a matrix placing a prop at (x, z), turned ry
const _place = new THREE.Matrix4();
const at = (x, z, ry = 0, y = 0) => _place.makeRotationY(ry).setPosition(x, y, z);

// --- forest floor: blocky flecks of moss, needles and dirt on a small repeating texture ---
function groundTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d'), rng = seeded(5);
  g.fillStyle = '#3f5a2c';
  g.fillRect(0, 0, 128, 128);
  const tones = ['#4a6a33', '#365027', '#58703a', '#3f5f2e', '#2f4622', '#638049'];
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = tones[(rng() * tones.length) | 0];
    const s = rng() < 0.85 ? 2 : 4;
    g.fillRect((rng() * 64 | 0) * 2, (rng() * 64 | 0) * 2, s, s);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(25, 25);
  t.magFilter = THREE.NearestFilter;
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 1 }));
ground.position.y = GROUND_Y;
ground.receiveShadow = true;
scene.add(ground);

// --- cabin floor: staggered boards, each its own shade; the chamfers draw the seams ---
const floorBase = new THREE.Mesh(new THREE.BoxGeometry(HALF * 2 + WALL_T, 0.4, HALF * 2 + WALL_T),
  new THREE.MeshStandardMaterial({ color: 0x2a1d12, roughness: 1 }));
floorBase.position.y = -0.28;
floorBase.receiveShadow = true;
world.add(floorBase);

const EDGE = HALF + WALL_T / 2, BOARD = 0.42;
const floorB = new BlockBatch(), frng = seeded(11);
const boardTones = [0x8a6440, 0x7d5a39, 0x96704a, 0x745233];
for (let z = -EDGE + BOARD / 2; z < EDGE; z += BOARD) {
  for (let x = -EDGE - frng() * 2; x < EDGE;) {
    const len = 1.6 + frng() * 2.6, a = Math.max(x, -EDGE), b = Math.min(x + len, EDGE), r = frng();
    const tone = r < 0.05 ? 0x2e2115 : r < 0.1 ? 0x5e4730 : boardTones[(frng() * 4) | 0]; // the odd stained or newer board
    floorB.add([[b - a - 0.015, 0.08, BOARD - 0.015, (a + b) / 2, -0.04, z, tone, 0, 0, 0, 0.018]], frng);
    x += len;
  }
}
// a braided rug, stepped into an oval (each ring a little higher so they never z-fight)
[[3.8, 2.2, 3.2, 2.7, 0xa8563f], [3.2, 1.6, 2.6, 2.1, 0xd0a95c], [2.6, 1.0, 2.0, 1.5, 0xa8563f], [1.7, 0.45, 1.3, 0.75, 0x7d4a30]]
  .forEach(([w1, d1, w2, d2, c], i) => floorB.add([
    [w1, 0.012, d1, 0, 0.006 + i * 0.008, 0, c, 0, 0, 0, 0.004],
    [w2, 0.012, d2, 0, 0.009 + i * 0.008, 0, c, 0, 0, 0, 0.004],
  ], frng, at(3, -2.6, 0.08)));
// odds and ends the wind blew in: a few leaves and a scattering of dry grass
for (const [x, z, ry] of [[-6.5, -7.8, 0.4], [-6.1, -7.4, 1.3], [7.2, 6.4, 2.2], [-8.2, 3.2, 0.9], [1.2, 7.9, 2.8]]) {
  floorB.add([[0.22, 0.006, 0.3, 0, 0.004, 0, 0xc8a35a, 0, 0, 0, 0.002]], frng, at(x, z, ry));
}
floorB.add([[0.13, 0.13, 0.17, 0, 0.065, 0, 0x8a8f96, 0, 0, 0, 0.02], [0.135, 0.07, 0.1, 0, 0.065, 0.02, 0x6e8a4a, 0, 0, 0, 0.01]], frng, at(-3.5, 6.2, 0.7));
for (const [x, z, w, ry] of [[0.4, 8.9, 0.9, 0.2], [-0.5, 8.1, 0.6, -0.4], [0.9, 7.3, 0.5, 0.6]]) {
  floorB.add([[w, 0.006, w * 0.45, 0, 0.004, 0, 0x8a6a34, 0, 0, 0, 0.002]], frng, at(x, z, ry));
}

// --- walls: stacked logs with chinking and overhanging corners, two doors and three windows ---
// The openings are where the raccoons get in: they nudge the doors open and peek through the windows.
const openings = []; // the doors and windows (see makeOpening)
const wallBoxes = []; // world-space {minX, maxX, minZ, maxZ} footprints for spray collision
const wallB = new BlockBatch(), wrng = seeded(23);
const LOG_STEP = 0.4, LOG_H = 0.42, LOG_D = 0.62, OVERHANG = 0.42;
const LOG_TONES = [0x8a6a48, 0x7b5a3a, 0x9a7750, 0x70503a];
const END_GRAIN = 0xc09a6c, CHINK = 0xc8bfa8, POST = 0x5c4530, WEATHERED = 0x9a8a72;
const STONE_TONES = [0x8a8b8d, 0x999a9c, 0x7c7d7f];
// a block lying along a wall: `u0..u1` along it, centered `n` off the wall plane
function wallBlock(axis, fixed, u0, u1, y, h, d, color, bevel, n = 0, tilt = 0) {
  const len = Math.abs(u1 - u0), c = (u0 + u1) / 2;
  return axis === 'x'
    ? [len, h, d, c, y, fixed + n, color, 0, 0, tilt, bevel]
    : [d, h, len, fixed + n, y, c, color, -tilt, 0, 0, bevel];
}

// builds a wall along an axis. `fixed` = the constant coord, `axis` = 'x' or 'z';
// `gaps` = [start, end, 'door' | 'window'] along the moving axis (world units)
const OPENING_INSET = 1.5; // how far in/out the entry waypoints sit from the wall plane
const SILL = { x: 0.85, z: 1.05 }, HEAD = { x: 1.63, z: 1.83 }; // window openings fall between log courses
const DOOR_TOP = 2.03, JAMB = 0.14;
const DOOR_HP = 12, WINDOW_HP = 2; // blows it takes to break one in
function buildWall(axis, fixed, gaps) {
  const min = -EDGE, max = EDGE, mine = [];
  const segs = [];
  let cursor = min;
  for (const [gs, ge, kind] of gaps.slice().sort((a, b) => a[0] - b[0])) {
    if (gs > cursor) segs.push([cursor, gs]);
    cursor = Math.max(cursor, ge);
    mine.push(makeOpening(axis, fixed, gs, ge, kind));
  }
  if (cursor < max) segs.push([cursor, max]);
  const layer0 = axis === 'x' ? 0.24 : 0.44; // the two directions interleave at the corners
  for (const [a, b] of segs) {
    const hw = (axis === 'x' ? b - a : WALL_T) / 2, hd = (axis === 'x' ? WALL_T : b - a) / 2;
    const cx = axis === 'x' ? (a + b) / 2 : fixed, cz = axis === 'x' ? fixed : (a + b) / 2;
    wallBoxes.push({ minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd });
    logRun(axis, fixed, a, b, layer0, () => true, a > min + 0.01, b < max - 0.01, true);
  }
  // across each opening: a lintel over a door; logs under the sill and over the head of a window
  for (const o of mine) {
    const keep = o.kind === 'door'
      ? y => y - LOG_H / 2 >= DOOR_TOP - 0.01
      : y => y + LOG_H / 2 <= o.sill + 0.01 || y - LOG_H / 2 >= o.head - 0.01;
    logRun(axis, fixed, o.u0, o.u1, layer0, keep, true, true, o.kind === 'window');
    fitOpening(o);
    openings.push(o);
  }
}

// a run of stacked logs from a to b (only the courses `keep` allows). Ends that meet an
// opening are cut square for its frame; ends at a corner run on past the other wall
function logRun(axis, fixed, a, b, layer0, keep, cutA, cutB, footing) {
  for (let k = 0; k < 6; k++) {
    const y = layer0 + k * LOG_STEP;
    if (!keep(y)) continue;
    const u0 = cutA ? a : a - OVERHANG, u1 = cutB ? b : b + OVERHANG;
    wallB.add([wallBlock(axis, fixed, u0, u1, y, LOG_H, LOG_D, LOG_TONES[(wrng() * 4) | 0], 0.19)], wrng); // deep chamfer: round-ish logs
    if (k < 5 && keep(y + LOG_STEP)) wallB.add([wallBlock(axis, fixed, a, b, y + LOG_STEP / 2, 0.08, LOG_D * 0.72, CHINK, 0.02)], wrng);
    for (const [cut, u] of [[cutA, u0], [cutB, u1]]) {
      if (!cut) wallB.add([wallBlock(axis, fixed, u - 0.012, u + 0.012, y, LOG_H * 0.8, LOG_D * 0.8, END_GRAIN, 0.1)], wrng); // end grain
    }
  }
  if (!footing) return;
  if (axis === 'z') wallB.add([wallBlock(axis, fixed, a, b, 0.13, 0.24, LOG_D * 0.9, LOG_TONES[1], 0.06)], wrng); // sill log
  for (let u = a - (cutA ? 0 : 0.3); u < b + (cutB ? 0 : 0.3);) { // fieldstone footing
    const len = 0.45 + wrng() * 0.6;
    wallB.add([wallBlock(axis, fixed, u, Math.min(u + len, b + (cutB ? 0 : 0.3)) - 0.04, 0.02, 0.18, LOG_D + 0.16, STONE_TONES[(wrng() * 3) | 0], 0.05)], wrng);
    u += len;
  }
}

// An opening's geometry and waypoints. Raccoons come in via the OUTER waypoint, stand at
// the FRONT to nudge it, then go through to the INNER one (or climb to the LANDING).
// Its parts are modeled in a local frame: x along the wall, +z out of the cabin.
function makeOpening(axis, fixed, u0, u1, kind) {
  const c = (u0 + u1) / 2, s = Math.sign(fixed), ht = WALL_T / 2;
  const p = out => axis === 'x' ? [c, fixed + s * out] : [fixed + s * out, c]; // world x, z at `out` from the wall
  const [x, z] = p(0), [ox, oz] = p(OPENING_INSET), [ix, iz] = p(-OPENING_INSET), [fx, fz] = p(0.85), [lx, lz] = p(-0.95);
  return {
    kind, axis, u0, u1, w: u1 - u0, x, z, ox, oz, ix, iz, fx, fz, lx, lz,
    sill: SILL[axis], head: HEAD[axis],
    rotY: axis === 'x' ? (s > 0 ? 0 : Math.PI) : s * Math.PI / 2,
    box: axis === 'x' ? { minX: u0, maxX: u1, minZ: fixed - ht, maxZ: fixed + ht } : { minX: fixed - ht, maxX: fixed + ht, minZ: u0, maxZ: u1 },
    maxHp: kind === 'door' ? DOOR_HP : WINDOW_HP, hp: 0,
    climber: null, // the raccoon clambering through a broken window (one at a time)
    jolt: 0, fallT: -1,
  };
}

const glassMat = new THREE.MeshStandardMaterial({ color: 0xbcd6e8, roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.3, depthWrite: false });
const glassCracked = new THREE.MeshStandardMaterial({ color: 0xe8f2fa, roughness: 0.45, metalness: 0.2, transparent: true, opacity: 0.55, depthWrite: false });
// frame it in the baked walls, and build the parts that move or break
function fitOpening(o) {
  const place = at(o.x, o.z, o.rotY), hw = o.w / 2, frng = seeded(Math.round(o.x * 7 + o.z * 13) + 99);
  const root = new THREE.Group();
  root.position.set(o.x, 0, o.z); root.rotation.y = o.rotY;
  world.add(root);
  if (o.kind === 'door') {
    wallB.add([
      [JAMB, DOOR_TOP + 0.1, LOG_D + 0.1, -hw + JAMB / 2, (DOOR_TOP + 0.1) / 2, 0, POST, 0, 0, 0, 0.03],  // posts
      [JAMB, DOOR_TOP + 0.1, LOG_D + 0.1, hw - JAMB / 2, (DOOR_TOP + 0.1) / 2, 0, POST, 0, 0, 0, 0.03],
      [o.w + 0.1, 0.14, LOG_D + 0.12, 0, DOOR_TOP + 0.02, 0, POST, 0, 0, 0, 0.03],                     // header
      [o.w - 0.1, 0.05, LOG_D, 0, 0.0, 0, POST, 0, 0, 0, 0.02],                                       // threshold
    ], wrng, place);
    // a ledged-and-braced plank door, hinged at its left edge, braces on the inside face
    const lw = o.w - 2 * JAMB - 0.02, lh = 1.92, n = 4, pw = lw / n;
    const blocks = [];
    for (let i = 0; i < n; i++) blocks.push([pw - 0.012, lh, 0.06, pw * (i + 0.5), lh / 2, 0, i % 2 ? WEATHERED : 0x5f5646, 0, 0, 0, 0.012]);
    blocks.push([lw - 0.04, 0.14, 0.04, lw / 2, 0.35, -0.05, POST, 0, 0, 0, 0.012], [lw - 0.04, 0.14, 0.04, lw / 2, lh - 0.35, -0.05, POST, 0, 0, 0, 0.012]);
    const bl = Math.hypot(lw - 0.1, lh - 0.7);
    blocks.push([0.12, bl, 0.04, lw / 2, lh / 2, -0.05, POST, 0, 0, -Math.atan2(lw - 0.1, lh - 0.7), 0.012]);
    blocks.push([0.05, 0.05, 0.08, lw - 0.15, 1.0, 0.06, 0x2a2a2a, 0, 0, 0, 0.01]);                                     // handle
    for (const y of [0.35, lh - 0.35]) blocks.push([0.32, 0.05, 0.015, 0.16, y, 0.035, 0x2a2a2a, 0, 0, 0, 0.005]);     // strap hinges
    const leafMesh = new THREE.Mesh(bakeBlocks(blocks, frng), worldMat);
    leafMesh.castShadow = true; leafMesh.receiveShadow = true;
    o.fall = new THREE.Group(); o.fall.position.z = -0.02; root.add(o.fall);                   // pivot it falls in about
    o.leaf = new THREE.Group(); o.leaf.position.set(-hw + JAMB + 0.01, 0.02, 0); o.fall.add(o.leaf); // hinge line
    o.leaf.add(leafMesh);
  } else {
    const h = o.head - o.sill, mid = (o.sill + o.head) / 2, iw = o.w - 0.2;
    wallB.add([
      [0.1, h + 0.1, LOG_D + 0.06, -hw + 0.05, mid, 0, POST, 0, 0, 0, 0.02],              // jambs
      [0.1, h + 0.1, LOG_D + 0.06, hw - 0.05, mid, 0, POST, 0, 0, 0, 0.02],
      [o.w + 0.12, 0.08, LOG_D + 0.08, 0, o.head, 0, POST, 0, 0, 0, 0.02],              // head
      [o.w + 0.3, 0.07, LOG_D + 0.24, 0, o.sill, 0.05, WEATHERED, 0, 0, 0, 0.02],        // sill board, lipped outside
    ], wrng, place);
    o.pane = new THREE.Group(); o.pane.position.y = mid; root.add(o.pane);
    o.glass = new THREE.Mesh(new THREE.BoxGeometry(iw, h - 0.08, 0.02), glassMat);
    const bars = new THREE.Mesh(bakeBlocks([[0.05, h - 0.08, 0.05, 0, 0, 0, POST], [iw, 0.05, 0.05, 0, 0, 0, POST]], frng), worldMat);
    bars.castShadow = true;
    o.bars = bars;
    o.pane.add(o.glass, bars);
    // what's left in the frame once it's smashed: jagged teeth round the edges
    const teeth = [];
    for (let i = 0; i < 9; i++) {
      const side = i % 3, t = frng() - 0.5, len = 0.12 + frng() * 0.2;
      const [px, py] = side === 0 ? [t * iw, -(h - 0.1) / 2 + 0.05] : side === 1 ? [-iw / 2 + 0.05, t * (h - 0.1)] : [iw / 2 - 0.05, t * (h - 0.1)];
      teeth.push([0.03 + frng() * 0.06, len, 0.015, px, py, 0, 0xffffff, 0, 0, (frng() - 0.5) * 1.6, 0]);
    }
    for (let i = 0; i < 3; i++) teeth.push([0.04 + frng() * 0.05, 0.1 + frng() * 0.12, 0.015, (frng() - 0.5) * iw, (h - 0.1) / 2 - 0.04, 0, 0xffffff, 0, 0, Math.PI + (frng() - 0.5) * 1.2, 0]);
    o.shards = new THREE.Mesh(bakeBlocks(teeth, frng, true), glassMat);
    o.pane.add(o.shards);
  }
}

// south wall (+Z, nearest the camera): the back door
buildWall('x',  HALF, [[-0.8, 0.8, 'door']]);
// north wall (-Z): the front door on the left, a window on the right
buildWall('x', -HALF, [[-5.8, -4.2, 'door'], [4, 6, 'window']]);
// west and east walls: a window each
buildWall('z', -HALF, [[-1.5, 0.5, 'window']]);
buildWall('z',  HALF, [[1.5, 3.5, 'window']]);

// --- inside, on the walls the camera looks at: a pantry shelf, a trophy, a calendar, a coat ---
const IN_N = -HALF + LOG_D / 2, IN_W = -HALF + LOG_D / 2, IN_E = HALF - LOG_D / 2;
wallB.add([
  [1.9, 0.06, 0.3, -1.7, 1.6, IN_N + 0.15, 0x5e4730, 0, 0, 0, 0.015],          // shelf
  [0.05, 0.22, 0.26, -2.5, 1.48, IN_N + 0.13, POST], [0.05, 0.22, 0.26, -0.9, 1.48, IN_N + 0.13, POST],
  [0.14, 0.2, 0.14, -2.45, 1.73, IN_N + 0.15, 0x6e7f4a, 0, 0, 0, 0.03],         // jars and cans
  [0.14, 0.22, 0.14, -2.22, 1.74, IN_N + 0.15, 0xa05a2a, 0, 0, 0, 0.03],
  [0.12, 0.16, 0.12, -1.95, 1.71, IN_N + 0.15, 0x8a8f96, 0, 0, 0, 0.02],
  [0.12, 0.16, 0.12, -1.78, 1.71, IN_N + 0.13, 0x8a8f96, 0, 0, 0, 0.02],
  [0.32, 0.08, 0.22, -1.25, 1.67, IN_N + 0.14, 0x5a2a20, 0, 0.1, 0, 0.015],     // stacked books
  [0.3, 0.07, 0.2, -1.24, 1.745, IN_N + 0.14, 0x2a3a4a, 0, -0.15, 0, 0.015],
  [0.36, 0.44, 0.05, 1.4, 1.9, IN_N + 0.025, POST, 0, 0, 0, 0.02],             // picture frame
  [0.28, 0.34, 0.02, 1.4, 1.9, IN_N + 0.055, 0x8ec4d8, 0, 0, 0, 0.01],          // a little landscape
  [0.2, 0.12, 0.02, 1.32, 1.83, IN_N + 0.06, 0x5c8a48, 0, 0, 0.2, 0.005],       // hills
  [0.12, 0.1, 0.02, 1.5, 1.87, IN_N + 0.06, 0xf2d47a, 0, 0, 0, 0.005],          // sun
  [0.18, 0.24, 0.18, 1.15, 1.6, IN_N + 0.12, 0x9a6a3f, 0, 0, 0, 0.03],          // a little pot on a bracket
  [0.22, 0.2, 0.22, 1.15, 1.78, IN_N + 0.12, 0x4f8a3a, 0, 0.4, 0, 0.05],        // and its plant
  [0.48, 0.62, 0.02, 2.75, 1.4, IN_N + 0.012, 0xb8a888, 0, 0, 0.04, 0.005],     // calendar
  [0.4, 0.2, 0.025, 2.75, 1.58, IN_N + 0.015, 0x7a2a22, 0, 0, 0.04, 0.005],
  [0.06, 0.06, 1.1, IN_W + 0.04, 1.75, 4.6, POST, 0, 0, 0, 0.015],             // coat hooks
  [0.16, 0.85, 0.5, IN_W + 0.1, 1.3, 4.3, 0x3e4a33, 0, 0, 0.04, 0.04],          // a coat
  [0.24, 0.12, 0.24, IN_W + 0.14, 1.76, 4.95, 0x6b5232, 0, 0, 0, 0.04],         // hat
  [0.03, 0.5, 0.42, IN_E - 0.015, 1.6, -5, POST, 0, 0, 0, 0.01],               // mirror
  [0.035, 0.42, 0.34, IN_E - 0.02, 1.6, -5, 0x55606a, 0, 0, 0, 0.005],
], wrng);
bakedMesh(floorB, false);
bakedMesh(wallB);

// --- the yard: woodpile, chopping block, an old pickup, a porch lantern, a broken fence ---
const yard = new BlockBatch(), yrng = seeded(41);
const CLEARINGS = []; // props trees and brush keep out of: [x, z, radius]
for (let k = 0; k < 4; k++) for (let i = 0; i < 10; i++) {                     // split firewood
  const x = 3.75 + i * 0.37 + (k % 2) * 0.18, y = 0.17 + k * 0.3;
  if (x > 7.5) continue;
  yard.add([[0.33, 0.3, 0.62, x, y, 10.9, LOG_TONES[(yrng() * 4) | 0], 0, 0, (yrng() - 0.5) * 0.2, 0.1],
            [0.27, 0.24, 0.02, x, y, 11.22, END_GRAIN, 0, 0, 0, 0.06]], yrng);
}
yard.add([[0.12, 1.4, 0.12, 3.45, 0.7, 10.9, POST], [0.12, 1.4, 0.12, 7.75, 0.7, 10.9, POST]], yrng);
CLEARINGS.push([5.6, 11, 2.4]);
yard.add([
  [0.62, 0.5, 0.62, 0, 0.25, 0, LOG_TONES[2], 0, 0, 0, 0.18],                  // chopping block
  [0.5, 0.02, 0.5, 0, 0.505, 0, END_GRAIN, 0, 0, 0, 0.12],
  [0.34, 0.26, 0.34, -0.28, 0.63, 0.1, 0xb06a48, 0, 0.3, 0, 0.03],             // a stack of flower pots
  [0.28, 0.22, 0.28, -0.28, 0.87, 0.1, 0xa05c3c, 0, 0.9, 0, 0.03],
  [0.22, 0.18, 0.22, 0.34, 0.59, -0.2, 0xb06a48, 0, 0.1, 0, 0.03],
  [0.2, 0.12, 0.2, 0.34, 0.74, -0.2, 0x6aa84a, 0, 0, 0, 0.04],
  [0.14, 0.1, 0.14, 0.34, 0.85, -0.2, 0xf2c84a, 0, 0.5, 0, 0.02],
], yrng, at(-4.3, 12.5, 0.6));
CLEARINGS.push([-4.3, 12.5, 1.5]);
// rusted pickup, one tire flat, one headlight out
const RUST = 0x5f7a68, RUST2 = 0x8a6440, CHROME = 0xa8a89e, GLASS = 0x2a3c48;
yard.add([
  [1.92, 0.62, 4.6, 0, 0.78, 0, RUST, 0, 0, 0, 0.12],                          // body
  [1.8, 0.74, 1.5, 0, 1.45, 0.45, RUST, 0, 0, 0, 0.1],                          // cab
  [1.6, 0.4, 0.05, 0, 1.52, 1.21, GLASS, -0.25, 0, 0, 0.01],                    // windshield
  [1.82, 0.36, 1.2, 0, 1.55, 0.4, GLASS, 0, 0, 0, 0.02],                        // side windows
  [1.86, 0.2, 1.4, 0, 1.18, 1.55, RUST, 0, 0, 0, 0.08],                         // hood
  [0.1, 0.42, 2.0, 0.92, 1.28, -1.2, RUST, 0, 0, 0, 0.03], [0.1, 0.42, 2.0, -0.92, 1.28, -1.2, RUST, 0, 0, 0, 0.03],
  [1.94, 0.42, 0.1, 0, 1.28, -2.25, RUST, 0, 0, 0.06, 0.03],                    // tailgate, sprung
  [1.7, 0.06, 1.9, 0, 1.1, -1.2, 0x2a2a28, 0, 0, 0, 0.01],                      // bed floor
  [2.02, 0.2, 0.16, 0, 0.6, 2.33, CHROME, 0, 0, 0, 0.05], [2.02, 0.2, 0.16, 0, 0.6, -2.33, CHROME, 0, 0, 0, 0.05],
  [0.32, 0.2, 0.05, 0.62, 0.95, 2.31, 0xe8e2b0, 0, 0, 0, 0.02], [0.32, 0.2, 0.05, -0.62, 0.95, 2.31, 0x1a1a18, 0, 0, 0, 0.02],
  [0.6, 0.34, 0.03, 0.97, 0.85, 0.9, RUST2, 0, 0, 0, 0.01], [0.5, 0.3, 0.03, -0.97, 0.75, -1.6, RUST2, 0, 0, 0, 0.01],
  [0.9, 0.04, 0.7, 0.2, 1.33, -1.5, 0x4a3a2a, 0, 0.3, 0, 0.01],                 // tarp in the bed
  [0.36, 0.7, 0.7, 0.98, 0.35, 1.45, 0x141414, 0, 0, 0, 0.2], [0.36, 0.7, 0.7, -0.98, 0.35, 1.45, 0x141414, 0, 0, 0, 0.2],
  [0.36, 0.7, 0.7, 0.98, 0.35, -1.45, 0x141414, 0, 0, 0, 0.2], [0.36, 0.56, 0.78, -0.98, 0.26, -1.45, 0x141414, 0, 0, 0, 0.16],
], yrng, at(-7.6, 15.2, 0.55));
CLEARINGS.push([-7.6, 15.2, 3.4]);
// props raiders have to walk around: oriented boxes, half extents in the prop's own frame
const SOLIDS = [];
function addSolid(x, z, ry, hx, hz) { SOLIDS.push({ x, z, hx, hz, c: Math.cos(ry), s: Math.sin(ry) }); }
addSolid(-7.6, 15.2, 0.55, 1.05, 2.45); // the pickup, bumper to bumper
CLEARINGS.push([2, 23.5, 4.5], [1, 17.5, 3.5], [7.5, 20, 3.5]); // the title screen's camera and its view of the door
// porch lantern on a post by the door
yard.add([[0.16, 2.3, 0.16, 2.7, 1.15, 11.3, POST], [0.56, 0.08, 0.08, 2.48, 2.22, 11.3, POST], [0.24, 0.06, 0.24, 2.26, 2.0, 11.3, 0x2a2a2a]], yrng);
// a fence that gave up
for (const [x0, z0, x1, z1, broken] of [[8.6, 12.6, 10.8, 12.0, 0], [10.8, 12.0, 12.6, 10.6, 1], [-12.5, -9.5, -12.2, -12, 0]]) {
  const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
  yard.add([[0.14, 1.2, 0.14, 0, 0.6, 0, POST]], yrng, at(x0, z0, ry));
  yard.add([[0.14, 1.2, 0.14, 0, 0.6, 0, POST]], yrng, at(x1, z1, ry));
  yard.add(broken
    ? [[0.08, 0.14, len, 0, 0.5, len / 2, WEATHERED, 0.35, 0, 0, 0.02]]          // rail down at one end
    : [[0.08, 0.14, len, 0, 0.95, len / 2, WEATHERED, 0, 0, 0, 0.02], [0.08, 0.14, len, 0, 0.5, len / 2, WEATHERED, 0, 0, 0, 0.02]], yrng, at(x0, z0, ry));
}
// stumps and a fallen trunk at the treeline
for (const [x, z, s] of [[11.6, -4, 1], [-11.4, 7.5, 0.8], [6, -12, 1.1], [-12.6, -2.5, 0.9], [12.8, 7.5, 0.85], [-2.5, -12.4, 1]]) {
  yard.add([[0.55 * s, 0.4 * s, 0.55 * s, 0, 0.2 * s, 0, 0x3a2b1d, 0, yrng(), 0, 0.15], [0.46 * s, 0.02, 0.46 * s, 0, 0.4 * s + 0.01, 0, END_GRAIN, 0, yrng(), 0, 0.12]], yrng, at(x, z));
}
yard.add([[0.6, 0.55, 5.5, 0, 0.27, 0, 0x3a2f24, 0, 0, 0, 0.18], [0.5, 0.45, 0.02, 0, 0.27, 2.76, END_GRAIN, 0, 0, 0, 0.12],
          [0.14, 0.9, 0.14, 0.3, 0.6, -1.2, 0x3a2f24, 0, 0, -0.7, 0.03]], yrng, at(-13.5, 4, 0.3));
CLEARINGS.push([-13.5, 4, 3]);
bakedMesh(yard);

const lanternGlass = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.2),
  new THREE.MeshStandardMaterial({ color: 0x2a1a08, emissive: 0xffb050, emissiveIntensity: 1.6 }));
lanternGlass.position.set(2.26, 1.84, 11.3);
world.add(lanternGlass);
const lanternLight = new THREE.PointLight(0xffa64a, 7, 9, 2);
lanternLight.position.set(2.26, 1.7, 11.3);
world.add(lanternLight);
// a guttering flame: two slow wobbles and the odd dip, worse in the wind
function updateWorld(dt) {
  const t = performance.now() / 1000;
  const f = 0.85 + 0.08 * Math.sin(t * 7.3) + 0.06 * Math.sin(t * 13.1 + 1) - (Math.sin(t * 0.9) > 0.97 ? 0.35 : 0);
    - weather.level * 0.2 * (0.5 + 0.5 * Math.sin(t * 5.3) * Math.sin(t * 2.1)); // and gutters in the storm
  lanternLight.intensity = 7 * f;
  lanternGlass.material.emissiveIntensity = 1.6 * f;
}

// --- forest: instanced pines, spruces, oaks and dead snags, plus brush on the floor ---
// Filled from just outside the walls out to well beyond the fog far plane,
// so the tree line never visibly ends — it just fades into black.
const FOREST_COUNT = 900;
const R_MIN = 13, R_MAX = 70; // R_MAX is far past fog.far (78) so no visible edge
const SHADOW_R = 24;          // trees nearer than this cast shadows (the rest soften into the haze)
const TRUNK = 0x5a3f2a, NEEDLES = 0x2f5c33, NEEDLE_TIPS = 0x4c8044;
function pineTree(rng, tiers, w0, tierH, trunkH) {
  const b = [[0.32, trunkH, 0.32, 0, trunkH / 2, 0, TRUNK, 0, 0, 0, 0.06]];
  let y = trunkH * 0.6;
  for (let i = 0; i < tiers; i++) {
    const w = w0 * (1 - (i / tiers) * 0.75), ry = (i % 2) * Math.PI / 4; // each tier turned 45°: a star from above
    b.push([w, tierH * 0.62, w, 0, y, 0, NEEDLES, 0, ry, 0, 0.14],
           [w * 0.6, tierH * 0.42, w * 0.6, 0, y + tierH * 0.36, 0, NEEDLE_TIPS, 0, ry, 0, 0.09]); // moonlit top of the bough
    y += tierH * 0.78;
  }
  b.push([0.3, tierH * 0.7, 0.3, 0, y, 0, NEEDLE_TIPS, 0, 0, 0, 0.08]);
  return b;
}
function oakTree(rng) {
  const b = [[0.46, 2.4, 0.46, 0, 1.2, 0, TRUNK, 0, 0, 0, 0.08]];
  for (let i = 0; i < 6; i++) {
    const s = 1.3 + rng() * 0.9, a = i * 1.05;
    b.push([s, s * 0.85, s, Math.cos(a) * 0.75 * (i ? 1 : 0), 2.6 + rng() * 1.1 + (i ? 0 : 0.8), Math.sin(a) * 0.75 * (i ? 1 : 0), i % 2 ? 0x3d6a34 : 0x4c7a3e, 0, rng(), 0, 0.2]);
  }
  return b;
}
function fruitTree(rng) { // a round little apple tree with a few bright apples
  const b = [[0.3, 1.9, 0.3, 0, 0.95, 0, TRUNK, 0, 0, 0, 0.06]];
  for (let i = 0; i < 5; i++) {
    const a = i * 1.25, s = 1.1 + rng() * 0.5;
    b.push([s, s * 0.9, s, Math.cos(a) * 0.5, 2.2 + rng() * 0.6, Math.sin(a) * 0.5, i % 2 ? 0x4a7a3a : 0x5a8a44, 0, rng(), 0, 0.18]);
  }
  b.push([1.4, 1.2, 1.4, 0, 2.6, 0, 0x548544, 0, 0.3, 0, 0.22]);
  for (let i = 0; i < 5; i++) {
    const a = rng() * Math.PI * 2, r = 0.5 + rng() * 0.45;
    b.push([0.14, 0.14, 0.14, Math.cos(a) * r, 2.35 + rng() * 0.7, Math.sin(a) * r, 0xd8483c, 0, 0, 0, 0.03]);
  }
  return b;
}
const trng = seeded(77);
// near trees are bevelled and cast shadows; far ones (lost in the fog) are flat boxes
const treeKind = (blocks, weight) => ({ geo: bakeBlocks(blocks, seeded(1)), far: bakeBlocks(blocks, seeded(1), true), weight });
const TREE_KINDS = [
  treeKind(pineTree(trng, 4, 3.0, 1.05, 1.6), 34),  // pine
  treeKind(pineTree(trng, 3, 2.6, 0.95, 1.2), 16),  // young pine
  treeKind(pineTree(trng, 6, 1.8, 0.75, 1.3), 18),  // spruce
  treeKind(oakTree(trng), 18),
  treeKind(fruitTree(trng), 14),
];
const inClearing = (x, z, pad = 0) => (Math.abs(x) < EDGE + 0.6 + pad && Math.abs(z) < EDGE + 0.6 + pad)
  || CLEARINGS.some(([cx, cz, r]) => (x - cx) ** 2 + (z - cz) ** 2 < (r + pad) ** 2);
// scatter instances of each kind across the forest; near ones (within SHADOW_R) cast shadows
function scatter(kinds, count, rMin, rMax, pad, scale, tint) {
  // near instances go in four quadrant meshes, so the camera and each face of the muzzle
  // light's shadow can cull the ones it can't see; everything far is one mesh
  const lists = kinds.map(() => [[], [], [], [], []]);
  const total = kinds.reduce((s, k) => s + k.weight, 0);
  const _o = new THREE.Object3D(), _col = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // sqrt() keeps density roughly uniform across the annulus area
    const rad = Math.sqrt(rMin * rMin + Math.random() * (rMax * rMax - rMin * rMin));
    const ang = Math.random() * Math.PI * 2;
    const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
    if (inClearing(x, z, pad)) continue;
    let r = Math.random() * total, k = 0;
    while ((r -= kinds[k].weight) > 0) k++;
    const s = scale[0] + Math.random() * (scale[1] - scale[0]);
    _o.position.set(x, GROUND_Y, z);
    _o.rotation.set(0, Math.random() * Math.PI * 2, 0);
    _o.scale.set(s, s * (0.9 + Math.random() * 0.3), s);
    _o.updateMatrix();
    lists[k][rad < SHADOW_R ? (x > 0 ? 1 : 0) + (z > 0 ? 2 : 0) : 4].push([_o.matrix.clone(), _col.setScalar(tint[0] + Math.random() * (tint[1] - tint[0])).clone()]);
  }
  kinds.forEach((kind, k) => lists[k].forEach((items, slot) => {
    if (!items.length) return;
    const far = slot === 4;
    const m = new THREE.InstancedMesh(far && kind.far ? kind.far : kind.geo, worldMat, items.length);
    items.forEach(([mat, col], i) => { m.setMatrixAt(i, mat); m.setColorAt(i, col); });
    m.computeBoundingSphere();
    m.castShadow = kind.shadow !== false && !far;
    m.receiveShadow = true;
    world.add(m);
  }));
}
scatter(TREE_KINDS, FOREST_COUNT, R_MIN, R_MAX, 0.8, [0.85, 1.3], [0.8, 1.1]);

// brush: grass tufts, ferns and rocks between the walls and the trees
const brng = seeded(91);
const tuft = [];
for (let i = 0; i < 6; i++) {
  const a = i * 1.05 + brng(), h = 0.25 + brng() * 0.25;
  tuft.push([0.05, h, 0.05, Math.cos(a) * 0.07, h / 2, Math.sin(a) * 0.07, brng() < 0.5 ? 0x4a6a2e : 0x5a7a3a, Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35, 0]);
}
const fern = [];
for (let i = 0; i < 7; i++) {
  const a = i * 0.9;
  fern.push([0.11, 0.03, 0.6, Math.sin(a) * 0.28, 0.12, Math.cos(a) * 0.28, 0x44703a, -0.35, a, 0, 0]);
}
const rock = [[0.5, 0.32, 0.42, 0, 0.12, 0, 0x8a867c, 0, 0.3, 0.1, 0.1], [0.3, 0.22, 0.3, 0.24, 0.08, 0.14, 0x7c786e, 0, 0.9, 0, 0.08]];
const BRUSH = [
  { geo: bakeBlocks(tuft, brng), weight: 60, shadow: false },
  { geo: bakeBlocks(fern, brng), weight: 25, shadow: false },
  { geo: bakeBlocks(rock, brng), weight: 15 },
];
scatter(BRUSH, 1000, 10.6, 28, 0, [0.7, 1.4], [0.75, 1.15]); // out to where the haze softens it

// --- lights ---
const ambient = new THREE.AmbientLight(0xa8bcd8, 3.4);
scene.add(ambient);
const duskGlow = new THREE.HemisphereLight(0xffcfa8, 0x4a6a38, 1.1); // warm sky, green bounce
scene.add(duskGlow);
const moon = new THREE.DirectionalLight(0xdfe8ff, 2.8);
moon.position.set(-18, 34, -10);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
moon.shadow.camera.left = -28; moon.shadow.camera.right = 28;
moon.shadow.camera.top = 28; moon.shadow.camera.bottom = -28;
moon.shadow.camera.near = 1; moon.shadow.camera.far = 80;
scene.add(moon);

// --- dusk sky: only the low title shot ever sees it (the gameplay camera looks down
// too steeply). A peach glow at the horizon settles into lavender overhead ---
const sky = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `varying vec3 vDir;
    void main() {
      float h = clamp(vDir.y, 0.0, 1.0);
      vec3 c = mix(vec3(0.94, 0.62, 0.42), vec3(0.30, 0.36, 0.62), pow(h, 0.5));
      c = mix(c, vec3(0.30, 0.36, 0.62), smoothstep(0.0, -0.04, vDir.y)); // below the horizon: the fog's haze
      gl_FragColor = vec4(c, 1.0);
    }`,
}));
sky.renderOrder = -1;
scene.add(sky);
function moonTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const halo = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  halo.addColorStop(0, 'rgba(200,214,240,.55)');
  halo.addColorStop(0.2, 'rgba(160,180,220,.16)');
  halo.addColorStop(1, 'rgba(160,180,220,0)');
  g.fillStyle = halo; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#e4e9f2';
  g.beginPath(); g.arc(128, 128, 22, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(150,160,180,.35)'; // a few maria
  for (const [x, y, r] of [[121, 122, 7], [134, 131, 5], [126, 137, 4]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const moonDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTexture(), transparent: true, depthWrite: false, fog: false }));
moonDisc.position.set(-26, 27, -116); // rides on the sky dome, low over the trees behind the cabin
moonDisc.scale.setScalar(30);
sky.add(moonDisc);

// ===================================================================
// DUSK — clear and calm. The sky keeps its colour and the lantern flickers;
// no rain and no lightning, just a soft evening around the cabin.
// ===================================================================
const weather = {
  level: 0, target: 0, gust: 1,
  set() {},
};
function updateWeather() {}

// ===================================================================
// PLAYER — the learner's garden buddy, out watering the garden
// ===================================================================
const player = new THREE.Group();

const BUDDY_SCALE = 2.0; // the buddy stands about 2.4 world units: eye to eye with a raccoon
const look = savedLook();
const buddy = makeBuddy(THREE, buddyKind(look.kind), { gear: look.kind ? look.gear : '' });
buddy.group.scale.setScalar(BUDDY_SCALE);
buddy.group.traverse(o => { if (o.isMesh && o.material.depthWrite !== false) o.castShadow = true; });
player.add(buddy.group);
scene.add(player);

const mat = (color, o) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...o });

// --- watering can: held low and to the buddy's right, spout forward ---
const CAN = mat(0x7fa8c8, { metalness: 0.3, roughness: 0.42 });
const CAN_DK = mat(0x4f7a9e, { metalness: 0.3, roughness: 0.5 });
const CAN_LIGHT = mat(0xd8ecf6, { roughness: 0.3, metalness: 0.2 });
const can = new THREE.Group();
can.position.set(0.6, 0.98, 0.34);
player.add(can);
{
  const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.44, 12), CAN);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.035, 6, 14), CAN_DK);
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.22;
  const base = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.03, 6, 14), CAN_DK);
  base.rotation.x = Math.PI / 2; base.position.y = -0.22;
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.55, 8), CAN_DK);
  spout.rotation.x = 1.15; spout.position.set(0, 0.2, 0.33);
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.07, 10), CAN_LIGHT);
  rose.rotation.x = 1.15; rose.position.set(0, 0.35, 0.58);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 6, 14, Math.PI), CAN);
  handle.position.set(0, 0.22, -0.06); handle.rotation.y = Math.PI / 2;
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.06, 12, 1, true), CAN_LIGHT);
  stripe.position.y = 0.02;
  can.add(bodyMesh, rim, base, spout, rose, handle, stripe);
  can.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
}
// droplets and the puff spawn here
const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.36, 0.64); can.add(muzzle);

// --- spray puff: a little cloud of soft white-blue, lit for a moment ---
const FLASH_COLOR = 0xcfeaff;
const muzzleLight = new THREE.PointLight(FLASH_COLOR, 0, 9, 2);
scene.add(muzzleLight);

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.4)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const additive = color => new THREE.MeshBasicMaterial({
  color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
});
const sprayTexture = glowTexture();
const puff = new THREE.Group(); puff.visible = false; muzzle.add(puff);
const puffBits = [];
for (let i = 0; i < 5; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sprayTexture, color: i % 2 ? 0xd8f0ff : 0xffffff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  s.position.set((i - 2) * 0.08, (i % 3 - 1) * 0.06, 0.12 + i * 0.05);
  puff.add(s);
  puffBits.push(s);
}
const puffGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: sprayTexture, color: FLASH_COLOR, transparent: true, opacity: 0,
  blending: THREE.AdditiveBlending, depthWrite: false,
}));
puffGlow.position.z = 0.3;
puffGlow.scale.setScalar(1.1);
puff.add(puffGlow);

// --- water beads: little droplets that arc out of the rose and blink away ---
const debris = [];
const dropGeo = new THREE.SphereGeometry(0.05, 5, 4);
const waterDropMat = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, roughness: 0.15, metalness: 0.15, transparent: true, opacity: 0.9 });
function spawnDebris(mesh, vel, o) {
  mesh.userData = { vel, life: o.life, max: o.life, spin: o.spin || null, bounce: o.bounce ?? -99 };
  scene.add(mesh);
  debris.push(mesh);
}
function updateDebris(dt) {
  updateRipples(dt);
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i], u = d.userData;
    u.life -= dt;
    u.vel.y -= 14 * dt;
    d.position.addScaledVector(u.vel, dt);
    if (u.spin) { d.rotation.x += u.spin.x * dt; d.rotation.y += u.spin.y * dt; }
    if (d.position.y < u.bounce) {
      d.position.y = u.bounce;
      u.vel.set(u.vel.x * 0.4, 0, u.vel.z * 0.4);
    }
    if (u.life < 0.25) d.scale.setScalar(Math.max(0.01, u.life / 0.25));
    if (u.life <= 0) { scene.remove(d); debris.splice(i, 1); }
  }
}

// --- animation state ---
const rig = {
  t: 0,
  gait: 0,      // 0 standing .. 1 full speed
  kick: 0,      // the can's little recoil, 1 on the spray
  flash: 0,     // puff, 1 on the spray
  flashPeak: 0,
  reload: 0,    // refill pose weight
};

const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const wrapA = a => a - Math.round(a / (Math.PI * 2)) * Math.PI * 2;
const ease = t => t * t * (3 - 2 * t);

// where one foot is in its gait cycle p (0..1): planted for the first `beta` of it,
// sliding back under the body (s: 0.5 -> -0.5 of the stride), then lifted and
// carried forward. Shared by the buddy and the raccoons.
const _foot = { s: 0, lift: 0, pitch: 0 };
function footCycle(p, beta) {
  if (p < beta) {
    _foot.s = 0.5 - p / beta; _foot.lift = 0; _foot.pitch = 0;
  } else {
    const t = (p - beta) / (1 - beta);
    _foot.s = -0.5 + ease(t);
    _foot.lift = Math.sin(Math.PI * t);
    _foot.pitch = 0.6 * (1 - t) * (1 - t) - 0.3 * t * t; // toe-off, then heel first
  }
  return _foot;
}

const _ikD = new THREE.Vector3(), _ikP = new THREE.Vector3();
// two-bone IK: from joint `a`, reach toward `t` with bones l1 then l2, bending
// the middle joint toward `pole`. Writes the middle joint into `out`.
function ik2(a, t, l1, l2, pole, out) {
  _ikD.subVectors(t, a);
  const d = THREE.MathUtils.clamp(_ikD.length(), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  _ikD.normalize();
  const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d); // law of cosines: distance along the reach
  _ikP.copy(pole).addScaledVector(_ikD, -pole.dot(_ikD)).normalize();
  return out.copy(a).addScaledVector(_ikD, x).addScaledVector(_ikP, Math.sqrt(Math.max(0, l1 * l1 - x * x)));
}
const _bx = new THREE.Vector3(), _by = new THREE.Vector3(), _bz = new THREE.Vector3(), _bm = new THREE.Matrix4();
// lay a limb block (built along local Y) from joint `a` to joint `b`, front toward `face`
function bone(mesh, a, b, face) {
  _by.subVectors(a, b).normalize();
  _bz.copy(face).addScaledVector(_by, -face.dot(_by));
  if (_bz.lengthSq() < 1e-6) _bz.set(0, 0, 1);
  _bz.normalize();
  _bx.crossVectors(_by, _bz);
  mesh.quaternion.setFromRotationMatrix(_bm.makeBasis(_bx, _by, _bz));
  mesh.position.addVectors(a, b).multiplyScalar(0.5);
}

// called by fire(): a puff at the rose, a warm glint, and a handful of droplets
function sprayPuff(hot) {
  rig.kick = 1;
  rig.flash = 1;
  rig.flashPeak = 0.35 + Math.random() * 0.2; // a faint wet glint, not a flash
  const color = hot ? 0xa8e6ff : FLASH_COLOR;
  muzzleLight.color.setHex(color);
  puffGlow.material.color.setHex(color);
  puff.rotation.z = Math.random() * Math.PI * 2;
  puff.scale.setScalar(0.9 + Math.random() * 0.3);
  puffBits.forEach((s, i) => {
    s.position.set((Math.random() - 0.5) * 0.24, (Math.random() - 0.5) * 0.2, 0.1 + i * 0.06);
    s.scale.setScalar(0.18 + Math.random() * 0.16);
  });
  puffGlow.scale.setScalar(1.0 + Math.random() * 0.4);

  muzzle.updateWorldMatrix(true, false);
  const fwd = new THREE.Vector3(0, 0, 1).transformDirection(muzzle.matrixWorld);
  const right = new THREE.Vector3(1, 0, 0).transformDirection(muzzle.matrixWorld);
  for (let i = 0; i < 5; i++) {
    const drop = new THREE.Mesh(dropGeo, waterDropMat);
    muzzle.getWorldPosition(drop.position);
    const vel = fwd.clone().multiplyScalar(2.2 + Math.random() * 1.6)
      .addScaledVector(right, (Math.random() - 0.5) * 1.4)
      .add(new THREE.Vector3(0, Math.random() * 0.6, 0));
    spawnDebris(drop, vel, { life: 0.35 + Math.random() * 0.3, bounce: 0.04 });
  }
}

// pose the whole buddy for this frame. (mx, mz) is the player's world velocity.
function animatePlayer(dt, mx, mz) {
  const pace = Math.min(1, Math.hypot(mx, mz) / state.speed);
  const moving = pace > 0.05;
  rig.t += dt;
  rig.gait = damp(rig.gait, pace, moving ? 9 : 7, dt);
  rig.kick *= Math.exp(-12 * dt);
  buddy.animate(dt, rig.gait, rig.t);

  // lean into the travel a touch, so the run has some weight to it
  const aim = player.rotation.y;
  const moveYaw = Math.atan2(mx, mz);
  const rel = Math.atan2(Math.sin(moveYaw - aim), Math.cos(moveYaw - aim));
  const side = moving ? Math.sin(rel) : 0;
  buddy.group.rotation.x = 0.07 * rig.gait * (moving ? Math.cos(rel) : 0) + 0.05 * rig.kick;
  buddy.group.rotation.z = -0.06 * side * rig.gait;

  // the can lifts and tips to refill, and sways with the stride
  rig.reload = damp(rig.reload, state.reloading ? 1 : 0, state.reloading ? 12 : 8, dt);
  can.position.set(
    0.6 + 0.04 * side * rig.gait,
    0.98 + Math.sin(rig.t * 2.2) * 0.015 - 0.16 * rig.reload,
    0.34 - 0.1 * rig.reload
  );
  can.rotation.set(
    -0.7 * rig.reload + 0.05 * Math.sin(rig.t * 1.7),
    -0.1,
    0.09 * Math.sin(rig.t * 8) * rig.gait
  );

  // the puff fades quickly, the light with it
  rig.flash = Math.max(0, rig.flash - dt / 0.16);
  const f = rig.flash;
  puff.visible = f > 0.05;
  puffBits.forEach(s => { s.material.opacity = Math.min(1, f * 1.1); });
  puffGlow.material.opacity = 0.3 * f;
  muzzleLight.intensity = rig.flashPeak * f * f;
  if (f > 0) {
    muzzle.getWorldPosition(muzzleLight.position);
    muzzleLight.position.y += 0.2;
  }
}

// ===================================================================
// STATE
// ===================================================================
const state = {
  running: false,
  paused: false,
  hp: 3,
  maxHp: 3,
  kills: 0,
  shots: 0, // sprays this run
  wave: 0,
  mag: 8,
  magSize: 8,
  reloading: false,
  reloadT: 0,
  reloadTime: 1.2,
  fireCd: 0,
  fireRate: 0.13,
  dmgCd: 0,
  // upgradeable stats (see UPGRADES)
  damage: 1,
  pierce: 0,     // extra raccoons each water bead passes through
  spread: 0,     // extra streams per spray
  speed: 6.2,
  dropBonus: 0,
  upgrades: {},  // upgrade id -> times taken this run
  // timed power-ups from drops (seconds remaining)
  pDamage: 0,
  pAmmo: 0,
  pRate: 0,      // FAST SPRAY: twice the spray rate
  pSpread: 0,    // SPRINKLER BURST: two extra streams
  pSpeed: 0,     // FAST FEET: faster walking
  pShield: 0,    // BUBBLE: no lost hearts
  sinceDrop: 0,  // kills since the last drop (pity timer)
  // wave control
  toSpawn: 0,
  spawnTimer: 0,
  intermission: 0,
  choosing: false, // wave cleared, waiting on an upgrade pick
  raiderSpeed: 2.2,
  raiderHp: 2,
  shake: 0,
};

const bullets = [];
const raiders = [];
const particles = [];

// reusable materials for spawned objects
// A spray is a blob of water with a trail of smaller drops behind it, wobbling as it flies,
// so it reads as water from a can and never as a bullet.
const waterBlob = new THREE.MeshStandardMaterial({ color: 0x5fc4f5, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.82, emissive: 0x1a5f88, emissiveIntensity: 0.35 });
const waterBlobHot = new THREE.MeshStandardMaterial({ color: 0x9fe8ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.9, emissive: 0x3aa8d8, emissiveIntensity: 0.6 }); // SUPER SPRAY
const waterShine = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
const blobGeo = new THREE.SphereGeometry(0.5, 10, 8);
const TRAIL = [[-0.32, 0.72], [-0.6, 0.55], [-0.86, 0.4], [-1.1, 0.28]]; // [behind the head, size]
function makeTracer(hot) {
  const b = new THREE.Group(); // +Z is the direction of travel; the drops trail behind the head
  const mat = hot ? waterBlobHot : waterBlob;
  const size = hot ? 0.3 : 0.24;
  const head = new THREE.Mesh(blobGeo, mat); head.scale.set(size, size * 0.85, size * 1.35);
  const shine = new THREE.Mesh(blobGeo, waterShine); shine.scale.setScalar(size * 0.28); shine.position.set(-size * 0.18, size * 0.22, size * 0.2);
  b.add(head, shine);
  const drops = TRAIL.map(([z, k], i) => {
    const d = new THREE.Mesh(blobGeo, mat);
    d.scale.setScalar(size * k);
    d.position.set((i % 2 ? 1 : -1) * 0.04, 0, z);
    b.add(d);
    return d;
  });
  b.userData.blob = { head, drops, size, seed: Math.random() * 6 };
  return b;
}
// a quick wobble so the water looks soft and wet as it flies
function wobbleWater(b, t) {
  const w = b.userData.blob; if (!w) return;
  const s = w.size, q = Math.sin(t * 38 + w.seed) * 0.12;
  w.head.scale.set(s * (1 + q), s * 0.85 * (1 - q), s * 1.35);
  w.drops.forEach((d, i) => { d.position.x = Math.sin(t * 24 + i * 1.7 + w.seed) * 0.06; d.position.y = Math.cos(t * 21 + i * 2.1 + w.seed) * 0.04; });
}
// Water splashing off whatever it hits: drops that pop up and fall, and a ring that spreads out.
const splashMat = new THREE.MeshStandardMaterial({ color: 0x8fd6ff, roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.85 });
const rippleMat = new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide });
const rippleGeo = new THREE.TorusGeometry(0.5, 0.06, 6, 24);
const ripples = [];
function splashAt(x, y, z, n = 9, power = 1) {
  for (let i = 0; i < n; i++) {
    const d = new THREE.Mesh(blobGeo, splashMat);
    d.scale.setScalar(0.07 + Math.random() * 0.09 * power);
    d.position.set(x, y, z);
    const a = Math.random() * Math.PI * 2, out = (1.2 + Math.random() * 2.2) * power;
    spawnDebris(d, new THREE.Vector3(Math.cos(a) * out, (2 + Math.random() * 3) * power, Math.sin(a) * out), { life: 0.45 + Math.random() * 0.35, bounce: 0.04 });
  }
  const r = new THREE.Mesh(rippleGeo, rippleMat.clone());
  r.position.set(x, y, z);
  r.rotation.x = Math.PI / 2;
  r.scale.setScalar(0.3);
  r.userData = { life: 0.4, max: 0.4, grow: 1.6 * power };
  scene.add(r);
  ripples.push(r);
}
function updateRipples(dt) {
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i], u = r.userData;
    u.life -= dt;
    const k = 1 - Math.max(0, u.life) / u.max;
    r.scale.setScalar(0.3 + k * u.grow);
    r.material.opacity = 0.8 * (1 - k);
    if (u.life <= 0) { scene.remove(r); r.material.dispose(); ripples.splice(i, 1); }
  }
}
const petalMat = splashMat; // a raccoon heading home leaves a big splash, never anything red

// ===================================================================
// INPUT
// ===================================================================
const keys = {};
const mouse = new THREE.Vector2();
let firing = false;
const aimPoint = new THREE.Vector3();
const aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.9);
const raycaster = new THREE.Raycaster();

window.addEventListener('keydown', e => {
  if (sidecar.asking) { handleQuestionKey(e); return; }
  if (menu.key(e)) { e.preventDefault(); return; }
  if (e.code === 'Enter' && !state.running && !document.getElementById('death').classList.contains('hidden')) return startGame();
  keys[e.code] = true;
  if (e.code === 'Escape' || e.code === 'KeyP') { if (!e.repeat) setPaused(!state.paused); return; }
  if (state.paused) return;
  if (e.code === 'KeyR') startReload();
  if (state.choosing && /^Digit[1-3]$/.test(e.code)) choose(+e.code.slice(5) - 1);
  if (e.code === 'KeyM') {
    const m = audio.toggleMute();
    document.getElementById('reloadHint').textContent = m ? '[R] REFILL   ·   [M] MUTED' : '[R] REFILL';
  }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
// After a tap, browsers send made-up mouse events too. Those aren't the mouse: the touch
// controls already have that finger, so a tap never sprays or swings the aim.
let lastTouchAt = -1e9;
window.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') lastTouchAt = performance.now(); }, true);
const fromTouch = (e) => e.sourceCapabilities?.firesTouchEvents || performance.now() - lastTouchAt < 900;
window.addEventListener('mousemove', e => {
  if (fromTouch(e)) return;
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});
window.addEventListener('mousedown', e => { if (!sidecar.asking && !fromTouch(e)) firing = true; });
window.addEventListener('mouseup', () => { firing = false; });
window.addEventListener('contextmenu', e => e.preventDefault());

// the death screen: go again, or back to the title
document.getElementById('retryBtn').addEventListener('click', () => startGame());
document.getElementById('deathQuitBtn').addEventListener('click', quitToTitle);
document.getElementById('resumeBtn').addEventListener('click', () => setPaused(false));
document.getElementById('quitBtn').addEventListener('click', quitToTitle);
// alt-tabbing away mid-run pauses (and would otherwise leave WASD stuck down)
window.addEventListener('blur', () => {
  if (!friendHere()) { setPaused(true); return; }
  // Losing window focus must not stop the host's cabin for everyone else.
  firing = false;
  for (const k in keys) keys[k] = false;
});
document.getElementById('cards').addEventListener('click', e => {
  const c = e.target.closest('.card');
  if (c) choose(+c.dataset.i);
});
document.getElementById('cards').addEventListener('mouseover', e => {
  const c = e.target.closest('.card');
  if (c && !c.contains(e.relatedTarget) && state.choosing) audio.hover(+c.dataset.i);
});

// ===================================================================
// HUD
// ===================================================================
const hud = {
  wave: document.getElementById('waveNum'),
  kills: document.getElementById('kills'),
  zleft: document.getElementById('zleft'),
  health: document.getElementById('health'),
  powerups: document.getElementById('powerups'),
  toast: document.getElementById('toast'),
  picker: document.getElementById('picker'),
  pickerTitle: document.getElementById('pickerTitle'),
  pickerSub: document.getElementById('pickerSub'),
  cards: document.getElementById('cards'),
  mag: document.getElementById('mag'),
  reloadBar: document.getElementById('reloadBar'),
  reloadFill: document.getElementById('reloadFill'),
  flash: document.getElementById('flash'),
  banner: document.getElementById('banner'),
  bannerText: document.getElementById('bannerText'),
  bannerSub: document.getElementById('bannerSub'),
};

function updateHUD() {
  hud.wave.textContent = state.wave;
  hud.kills.textContent = state.kills;
  const remaining = raiders.length + state.toSpawn;
  hud.zleft.textContent = state.intermission > 0 || state.choosing ? '' : remaining + ' VISITING';
  if (hud.health.children.length !== state.maxHp) hud.health.innerHTML = pixelIcon(UPGRADE_ICONS.heal, 'pip').repeat(state.maxHp);
  [...hud.health.children].forEach((p, i) => p.classList.toggle('dead', i >= state.hp));
  // power-up time left as a clock: 0:10 … 0:01
  const clock = t => { const s = Math.ceil(t); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  let pu = '';
  if (state.pDamage > 0) pu += `<div style="color:#5ac8e8">SUPER SPRAY ${clock(state.pDamage)}</div>`;
  if (state.pAmmo > 0) pu += `<div style="color:#9ad8a0">FULL CAN ${clock(state.pAmmo)}</div>`;
  if (state.pRate > 0) pu += `<div style="color:#f2d04a">FAST SPRAY ${clock(state.pRate)}</div>`;
  if (state.pSpread > 0) pu += `<div style="color:#7ad0f0">SPRINKLER BURST ${clock(state.pSpread)}</div>`;
  if (state.pSpeed > 0) pu += `<div style="color:#f08a5a">FAST FEET ${clock(state.pSpeed)}</div>`;
  if (state.pShield > 0) pu += `<div style="color:#b9a2f2">BUBBLE ${clock(state.pShield)}</div>`;
  hud.powerups.innerHTML = pu;
  let m = '';
  for (let i = 0; i < state.magSize; i++) {
    m += `<span class="${i < state.mag ? 'live' : 'empty'}">▮</span>`;
  }
  hud.mag.innerHTML = m;
  hud.reloadBar.classList.toggle('active', state.reloading);
  if (state.reloading) hud.reloadFill.style.width = (state.reloadT / state.reloadTime * 100) + '%';
}

let flashT = 0;
function damageFlash() { hud.flash.style.background = '#ff9aaa'; flashT = 0.35; state.shake = 0.4; }

function showToast(text, color) {
  hud.toast.textContent = text;
  hud.toast.style.color = color;
  hud.toast.style.opacity = 1;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { hud.toast.style.opacity = 0; }, 1400);
}

function showBanner(text, sub, dur = 1.6) {
  hud.bannerText.textContent = text;
  hud.bannerSub.textContent = sub || '';
  hud.banner.style.opacity = 1;
  clearTimeout(showBanner._t);
  showBanner._t = setTimeout(() => { hud.banner.style.opacity = 0; }, dur * 1000);
}

// ===================================================================
// LITTLE SPROUTS — a question between rounds
// ===================================================================
// The host sends one question at a time from this learner's profile. The run freezes
// while the card is up, the host reads it aloud, and the game reports the pick.
const embedded = window.parent !== window;
const sidecar = {
  ask: null,       // the question on screen
  pending: null,   // a question that arrived while the run was busy
  asking: false,   // the card is up and taking a pick
  closing: false,  // a right answer is showing before the card goes away
  waiting: false,  // between rounds, waiting for the host to send one
  arcade: false,   // arcade play: no questions, just the cabin
  hold: false,     // freeze the run while the card is up
  started: false,  // the first question has been answered, so the run can begin
  answeredAny: false, // a question has been answered at least once this visit
  finished: false,
  after: null,     // what to do when this card closes (the upgrade picker)
  timer: 0,
  answerTimer: 0,
  key: '',
  focus: 0,
  missed: false,
};
const bridge = {
  post(type, extra) {
    if (!embedded) return;
    try { window.parent.postMessage({ source: 'sprouts-sidecar', type, ...extra }, '*'); } catch { /* not framed */ }
  },
  ready() { this.post('ready'); },
  need() { this.post('need'); },
  show() { this.post('show'); },
  pick(index) { this.post('pick', { index: index | 0 }); },
  replay() { this.post('replay'); },
  finish(detail) { this.post('finish', { detail: detail || '' }); },
  quit() { this.post('quit'); },
};
function sidecarFinish(detail) {
  if (!embedded || sidecar.finished) return;
  sidecar.finished = true;
  bridge.finish(detail);
}

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
));
const askEl = document.getElementById('ask');
const askPromptEl = document.getElementById('askPrompt');
const askShowEl = document.getElementById('askShow');
const askChoicesEl = document.getElementById('askChoices');

function faceHtml(choice) {
  const label = `<span>${esc(choice.label)}</span>`;
  if (choice.shape) return `<span class="shape ${esc(choice.shape)}" style="--shape-color:${esc(choice.fill || '#5d7a45')}"></span>${label}`;
  if (choice.fill) return `<span class="swatch" style="background:${esc(choice.fill)}"></span>${label}`;
  return label;
}

function questionKey(q) {
  return `${q.round ?? ''}|${q.prompt || ''}|${(q.choices || []).map(choice => choice.label).join(',')}`;
}

function paintFocus() {
  [...askChoicesEl.children].forEach(button => button.classList.toggle('sel', +button.dataset.i === sidecar.focus));
}

function moveFocus(delta) {
  const q = sidecar.ask;
  if (!q) return;
  const n = q.choices.length;
  let i = sidecar.focus;
  for (let step = 0; step < n; step++) {
    i = (i + delta + n) % n;
    if (!q.choices[i].used) break;
  }
  sidecar.focus = i;
  paintFocus();
}

function presentQuestion(q) {
  clearTimeout(sidecar.timer);
  sidecar.timer = 0;
  sidecar.pending = null;
  sidecar.waiting = false;
  sidecar.ask = q;
  sidecar.asking = true;
  sidecar.closing = false;
  sidecar.missed = false;
  sidecar.focus = q.choices.findIndex(choice => !choice.used);
  sidecar.hold = state.running; // the opening card sits over the title scene, which can keep moving
  askPromptEl.textContent = q.prompt || 'Pick the answer.';
  askShowEl.innerHTML = q.show || '';
  askChoicesEl.innerHTML = q.choices.map((choice, i) =>
    `<button type="button" data-i="${i}"${choice.used ? ' class="wrong" disabled' : ''}>${faceHtml(choice)}</button>`
  ).join('');
  askEl.hidden = false;
  document.body.classList.add('asking');
  paintFocus();
  bridge.show();
  if (sidecar.focus < 0) sidecar.focus = 0;
}

// What a Little Sprouts answer does in the cabin, once its card closes and play can be seen:
// a right answer showers treats around the buddy: 3 for a first try, one more for each first
// try in a row (up to 6), and 2 after a miss. Treats from a right answer stay until they're picked up. Any miss on the card spills the watering can,
// so the round starts with a refill. Never a lost heart.
let answerStreak = 0;
function answerResult(missed) {
  answerStreak = missed ? 0 : answerStreak + 1;
  if (!state.running) return;
  if (missed) {
    state.mag = 0;
    state.pAmmo = 0;
    state.reloading = false;
    startReload();
    splashAt(player.position.x, 0.9, player.position.z, 10, 0.9);
  }
  // every kind shows up before any repeats, so a big shower is a real mix
  const pool = DROP_TYPES.filter(t => t.id !== 'med' || state.hp < state.maxHp).sort(() => Math.random() - 0.5);
  const count = missed ? 2 : Math.min(6, 2 + answerStreak);
  const start = Math.random() * Math.PI * 2;
  for (let i = 0; i < count; i++) {
    const type = pool[i % pool.length];
    // in a ring a few steps away, so the buddy runs round collecting them (strays slide inside)
    const a = start + (i / count) * Math.PI * 2;
    const r = 2.8 + Math.random() * 1.2;
    const lim = HALF - 1.2;
    spawnDrop(type, {
      x: THREE.MathUtils.clamp(player.position.x + Math.cos(a) * r, -lim, lim),
      z: THREE.MathUtils.clamp(player.position.z + Math.sin(a) * r, -lim, lim),
    }, !missed);
  }
  showToast(missed ? `Can spilled! Refill · ${count} treats` : answerStreak > 1 ? `${answerStreak} in a row! ${count} treats` : `Yay! ${count} treats`, '#e0b84a');
}

function closeQuestion() {
  const missed = sidecar.missed;
  clearTimeout(sidecar.answerTimer);
  sidecar.answerTimer = 0;
  sidecar.asking = false;
  sidecar.closing = false;
  sidecar.ask = null;
  sidecar.hold = false;
  askEl.hidden = true;
  document.body.classList.remove('asking');
  askChoicesEl.innerHTML = '';
  askShowEl.innerHTML = '';
  if (!sidecar.started) {
    sidecar.started = true;
    sidecar.answeredAny = true;
    startGame(true);
    // the run swoops in from the title first; the treats land once the buddy is in the cabin
    setTimeout(() => answerResult(missed), 2200);
    return;
  }
  sidecar.answeredAny = true;
  const after = sidecar.after;
  sidecar.after = null;
  after?.();
  answerResult(missed);
}

function answerQuestion(index) {
  const q = sidecar.ask;
  if (!sidecar.asking || !q) return;
  const choice = q.choices[index];
  const button = askChoicesEl.querySelector(`button[data-i="${index}"]`);
  if (!choice || choice.used || !button) return;
  sidecar.focus = index;
  paintFocus();
  bridge.pick(index);
  if (!choice.ok) {
    choice.used = true;
    sidecar.missed = true;
    button.classList.add('wrong');
    button.disabled = true;
    moveFocus(1);
    return; // the host says a gentle "not yet"; the same card stays up
  }
  sidecar.asking = false;
  sidecar.closing = true;
  [...askChoicesEl.children].forEach(el => { el.disabled = true; });
  button.classList.add('correct');
  sidecar.answerTimer = setTimeout(closeQuestion, 900);
}

function handleQuestionKey(event) {
  const code = event.code;
  if (code === 'ArrowRight' || code === 'ArrowDown' || code === 'KeyD' || code === 'KeyS') moveFocus(1);
  else if (code === 'ArrowLeft' || code === 'ArrowUp' || code === 'KeyA' || code === 'KeyW') moveFocus(-1);
  else if (code === 'Enter' || code === 'Space') answerQuestion(sidecar.focus);
  else if (/^Digit[1-9]$/.test(code)) answerQuestion(+code.slice(5) - 1);
  else if (code === 'KeyH') bridge.replay();
  else return false;
  event.preventDefault();
  return true;
}

function receiveAsk(data) {
  if (sidecar.arcade) return;
  if (!data || !Array.isArray(data.choices) || !data.choices.length) return;
  const key = questionKey(data);
  if (key === sidecar.key && (sidecar.ask || sidecar.pending)) return;
  sidecar.key = key;
  const q = {
    prompt: String(data.prompt || ''),
    show: typeof data.show === 'string' ? data.show : '',
    round: data.round,
    choices: data.choices.map((choice, i) => ({
      label: choice.label == null ? String(i + 1) : String(choice.label),
      ok: !!choice.ok,
      fill: choice.fill || '',
      shape: choice.shape || '',
      used: false,
    })),
  };
  if (sidecar.waiting || !sidecar.answeredAny || (!sidecar.started && !sidecar.ask)) presentQuestion(q);
  else sidecar.pending = q;
}

function receiveClear() {
  sidecar.pending = null;
  if (!sidecar.waiting) return;
  sidecar.waiting = false;
  clearTimeout(sidecar.timer);
  sidecar.timer = 0;
  sidecar.hold = false;
  const after = sidecar.after;
  sidecar.after = null;
  after?.();
}

function askBetweenRounds(healed) {
  if (sidecar.finished) return;
  setBusy(true);
  if (!embedded || sidecar.arcade) { openPicker(healed); return; } // playing on its own: the upgrade picker is enough
  sidecar.after = () => openPicker(healed);
  const q = sidecar.pending;
  sidecar.pending = null;
  if (q) { presentQuestion(q); return; }
  sidecar.waiting = true;
  sidecar.hold = state.running;
  bridge.need();
  showBanner('A QUESTION IS COMING', 'listen closely', 1.0);
  clearTimeout(sidecar.timer);
  sidecar.timer = setTimeout(() => {
    sidecar.timer = 0;
    if (!sidecar.waiting) return;
    sidecar.waiting = false;
    sidecar.hold = false;
    const after = sidecar.after;
    sidecar.after = null;
    after?.();
  }, 1600);
}

window.addEventListener('message', event => {
  if (!embedded || event.source !== window.parent) return;
  const data = event.data;
  if (!data || data.source !== 'sprouts-sidecar') return;
  if (data.type === 'ask') receiveAsk(data);
  else if (data.type === 'clear') receiveClear();
  else if (data.type === 'arcade') {
    // Arcade play skips the questions: start the cabin right away and only use the picker.
    sidecar.arcade = true;
    sidecar.pending = null;
    if (!sidecar.started && !sidecar.ask) {
      sidecar.started = true;
      clearTimeout(sidecar.timer);
      sidecar.timer = 0;
      sidecar.waiting = false;
      sidecar.hold = false;
      startGame(true);
    }
  }
  // `mark`, `duck`, and `boot` are the host's business; the game grades from choice.ok.
});
askChoicesEl.addEventListener('click', event => {
  const button = event.target.closest('button[data-i]');
  if (button) answerQuestion(+button.dataset.i);
});
askChoicesEl.addEventListener('mouseover', event => {
  const button = event.target.closest('button[data-i]');
  if (!button || button.disabled) return;
  sidecar.focus = +button.dataset.i;
  paintFocus();
});
document.getElementById('askHear').addEventListener('click', () => bridge.replay());

// A question may be posted before this module's listener is ready. Ask once more on load;
// the host treats a repeat `need` as a request for the current question.
if (embedded) {
  window.addEventListener('load', () => {
    if (sidecar.ask || sidecar.pending || sidecar.finished) return;
    sidecar.waiting = true;
    bridge.need();
  });
}

// ===================================================================
// CONTROLLER — Little Sprouts' shared pad layout
// ===================================================================
// Left stick or d-pad moves, the right stick aims, and A or the right trigger sprays.
// On the question card, the d-pad/stick picks an answer and A/RT chooses it; Y hears it again.
const padState = {
  seen: false, action: false, b: false, y: false, start: false,
  dx: 0, dy: 0, fire: false, aimOn: false,
  move: { x: 0, z: 0 }, aim: { x: 0, y: 0 },
};
// ===================================================================
// TOUCH — phones and tablets (lib/touch-controls.mjs): the left thumb walks, the right thumb
// aims and sprays while it's held, and the big 🚰 button refills the can.
// ===================================================================
const touch = attachTouchControls({
  move: true,
  aim: true,
  buttons: [{ id: 'refill', label: '🚰', slot: 0 }],
  hints: { move: 'Walk', aim: 'Aim + spray' },
  tint: '#7fd0ff',
  ignore: '#picker, #ask, #menu, #pause, #death, #friendWrap, .overlay',
  onFirstTouch: () => document.body.classList.add('touch'),
});
if (isTouchDevice()) document.body.classList.add('touch');
function pollTouch() {
  const playing = state.running && !state.paused && !sidecar.hold && !sidecar.asking && !state.choosing;
  touch.setVisible(playing && !title.active);
  touch.update();
  if (!playing) return;
  if (touch.move.active) { padState.move.x = touch.move.x; padState.move.z = touch.move.y; }
  if (touch.aim.active) {
    padState.aimOn = true;
    padState.aim.x = touch.aim.x;
    padState.aim.y = touch.aim.y;
    // a thumb pushed out from the middle sprays; resting near the middle just turns
    if (touch.aim.magnitude > 0.3) padState.fire = true;
  }
  if (touch.tapped('refill')) startReload();
}

function pollPad() {
  pollController();
  pollTouch();
}
function pollController() {
  let list = [];
  try { list = [...(navigator.getGamepads?.() || [])].filter(Boolean); } catch { list = []; }
  if (!list.length) {
    padState.move.x = 0; padState.move.z = 0;
    padState.aimOn = false; padState.fire = false;
    return;
  }
  if (!padState.seen) {
    padState.seen = true;
    document.body.classList.add('pad');
  }
  const raw = readPad(list[0]);
  const dirs = moveDirs(raw);
  const stick = Math.hypot(raw.lx, raw.ly) > 0.2;
  padState.move.x = stick ? raw.lx : dirs.x;
  padState.move.z = stick ? raw.ly : dirs.y;
  padState.aim.x = raw.rx;
  padState.aim.y = raw.ry;
  padState.aimOn = Math.hypot(raw.rx, raw.ry) > 0.25;
  const action = actionDown(raw, padState.action);
  const b = raw.b >= 0.5, y = raw.y >= 0.5, start = raw.start >= 0.5;

  if (sidecar.asking) {
    if (dirs.x && dirs.x !== padState.dx) moveFocus(dirs.x);
    if (dirs.y && dirs.y !== padState.dy) moveFocus(dirs.y);
    if (action && !padState.action) answerQuestion(sidecar.focus);
    if (y && !padState.y) bridge.replay();
    padState.fire = false;
  } else if (state.running && !state.paused && !sidecar.hold) {
    padState.fire = action;
    if ((start && !padState.start) || (b && !padState.b)) setPaused(true);
  } else {
    padState.fire = false;
    if (start && !padState.start && !document.getElementById('death').classList.contains('hidden')) startGame();
  }

  padState.action = action;
  padState.b = b;
  padState.y = y;
  padState.start = start;
  padState.dx = dirs.x;
  padState.dy = dirs.y;
}

// ===================================================================
// WEAPON
// ===================================================================
function startReload() {
  if (!state.running || state.reloading || state.mag === state.magSize) return;
  state.reloading = true;
  state.reloadT = 0;
  audio.canOut();
}
function finishReload() {
  state.reloading = false;
  state.mag = state.magSize;
  audio.canIn();
}

const WATER_SPEED = 26, WATER_LIFE = 1.3; // about the same reach as before, at a speed the eye can follow
function fire() {
  if (state.fireCd > 0 || state.reloading || state.mag <= 0 || !state.running) return;
  if (state.pAmmo <= 0) {
    state.mag--;
    if (state.mag <= 0) startReload();
  }
  state.shots++;
  state.fireCd = state.fireRate * (state.pRate > 0 ? 0.5 : 1);

  const aim = new THREE.Vector3(aimPoint.x - player.position.x, 0, aimPoint.z - player.position.z);
  if (aim.lengthSq() < 1e-4) return;
  aim.normalize();

  // spawn at the spout; SPRINKLER fans extra streams around the aim line
  const mp = new THREE.Vector3();
  muzzle.getWorldPosition(mp);
  const count = 1 + state.spread + (state.pSpread > 0 ? 2 : 0);
  for (let k = 0; k < count; k++) {
    const a = (k - (count - 1) / 2) * 0.13;
    const c = Math.cos(a), s = Math.sin(a);
    const dir = new THREE.Vector3(aim.x * c - aim.z * s, 0, aim.x * s + aim.z * c);
    const b = makeTracer(state.pDamage > 0);
    b.position.copy(mp);
    b.lookAt(mp.clone().add(dir));
    b.userData = { dir, life: WATER_LIFE, pierce: state.pierce, hits: new Set(), y0: mp.y, t: 0, drip: 0, blob: b.userData.blob };
    scene.add(b);
    bullets.push(b);
  }

  sprayPuff(state.pDamage > 0);
  sendSpray(mp, aim, count);
  // no screen kick: a watering can doesn't recoil
  audio.spray(state.pDamage > 0, state.spread);
}

// ===================================================================
// RAIDERS — a family of raccoons from past the treeline
// ===================================================================
// Built like the player (chamfered blocks, IK limbs, planted feet), but each
// body part is baked into one vertex-colored mesh so a crowd of 30 stays cheap:
// every raccoon shares a handful of geometries and two materials.

const Z_THIGH = 0.42, Z_SHIN = 0.4, Z_ANKLE = 0.11, Z_HIP = 0.9;
const Z_UPPER_ARM = 0.4, Z_FOREARM = 0.39;
// the rig is modeled in slightly smaller units than the player's: Z_SCALE brings its legs and
// height up, and Z_UPPER widens the torso and head, so they stand at a friendly size
const Z_SCALE = 1.08, Z_UPPER = 1.1;

// four raccoons, each in its own bandana; fur stays in warm greys so they read at a glance
const RAIDER_LOOKS = [
  { fur: 0x8b909a, belly: 0xd8d5cb, mask: 0x2f3138, scarf: 0xd85a4a, paw: 0x3a3c44 }, // red bandana
  { fur: 0x7d838d, belly: 0xcfccc0, mask: 0x272930, scarf: 0x5a8ac8, paw: 0x34363e }, // blue bandana
  { fur: 0x9aa0a8, belly: 0xe0ddd2, mask: 0x33353c, scarf: 0x6aa84a, paw: 0x3e4048 }, // green bandana
  { fur: 0x757b85, belly: 0xc8c4b8, mask: 0x2a2c33, scarf: 0xe0a83a, paw: 0x303238 }, // yellow bandana
];
const darker = (hex, k = 0.65) => new THREE.Color(hex).multiplyScalar(k).getHex();

// bake every body part for one look. Limbs are built along Y around their
// bone's midpoint; the forearm carries the paw below it.
function bakeRaider(L, seed) {
  const rng = seeded(seed);
  const furDk = darker(L.fur, 0.78), bellyDk = darker(L.belly, 0.9);
  const head = [
    [0.46, 0.42, 0.46, 0, 0.24, 0, L.fur],                        // skull
    [0.48, 0.14, 0.05, 0, 0.28, 0.215, L.mask],                   // the robber's mask
    [0.1, 0.1, 0.08, -0.235, 0.2, 0.02, L.belly],                 // cheek tufts
    [0.1, 0.1, 0.08, 0.235, 0.2, 0.02, L.belly],
    [0.22, 0.16, 0.16, 0, 0.12, 0.24, L.belly],                   // muzzle
    [0.09, 0.06, 0.06, 0, 0.14, 0.33, 0x24262c],                  // nose
    [0.07, 0.26, 0.05, 0, 0.36, 0.21, L.belly],                   // pale stripe up the forehead
  ];
  for (const s of [-1, 1]) {
    head.push([0.17, 0.17, 0.08, s * 0.18, 0.46, -0.01, L.fur]);  // ears
    head.push([0.09, 0.09, 0.03, s * 0.18, 0.46, 0.035, bellyDk]);
  }
  const torso = [
    [0.64, 0.6, 0.36, 0, 0.32, 0, L.fur],                         // chest
    [0.44, 0.44, 0.04, 0, 0.3, 0.185, L.belly],                   // tummy
    [0.7, 0.18, 0.38, 0, 0.56, -0.01, L.fur],                     // shoulders
    [0.34, 0.2, 0.12, 0, 0.48, -0.2, furDk],                      // rounded back
    [0.2, 0.12, 0.2, 0, 0.67, 0.04, L.fur],                       // neck
    [0.5, 0.11, 0.38, 0, 0.6, 0.01, L.scarf],                     // bandana
    [0.12, 0.26, 0.07, 0.18, 0.46, 0.19, L.scarf, 0.2, 0, -0.25], // knotted end
  ];
  const pelvis = [
    [0.52, 0.26, 0.32, 0, 0.02, 0, L.fur],
    [0.36, 0.18, 0.03, 0, 0.03, 0.17, L.belly],
  ];
  const upperArm = [[0.17, Z_UPPER_ARM + 0.06, 0.18, 0, 0, 0, L.fur]];
  const hand = -Z_FOREARM / 2 - 0.06;
  const forearm = [
    [0.15, Z_FOREARM + 0.04, 0.16, 0, 0, 0, L.fur],
    [0.16, 0.13, 0.15, 0, hand, 0.01, L.paw],                     // paw
  ];
  for (const x of [-0.045, 0.045]) forearm.push([0.035, 0.07, 0.05, x, hand - 0.09, 0.03, L.paw, 0.25, 0, 0, 0.01]);
  const thigh = [[0.21, Z_THIGH + 0.06, 0.23, 0, 0, 0, L.fur]];
  const shin = [[0.19, Z_SHIN + 0.05, 0.21, 0, 0, 0, L.fur], [0.21, 0.07, 0.23, 0, -Z_SHIN / 2 + 0.02, 0, furDk]];
  const foot = [[0.2, 0.1, 0.3, 0, -0.06, 0.05, L.paw], [0.22, 0.03, 0.31, 0, -0.1, 0.05, darker(L.paw, 0.8), 0, 0, 0, 0.01]];
  const eyes = [
    [0.085, 0.1, 0.02, -0.11, 0.28, 0.235, 0xffffff, 0, 0, 0, 0.005],
    [0.085, 0.1, 0.02, 0.11, 0.28, 0.235, 0xffffff, 0, 0, 0, 0.005],
    [0.045, 0.055, 0.012, -0.11, 0.28, 0.247, 0x1c1e24, 0, 0, 0, 0.002],
    [0.045, 0.055, 0.012, 0.11, 0.28, 0.247, 0x1c1e24, 0, 0, 0, 0.002],
  ];
  const jaw = [
    [0.18, 0.07, 0.16, 0, -0.01, 0.19, L.belly],                   // a little open mouth
    [0.1, 0.03, 0.02, 0, 0.015, 0.28, 0x24262c, 0, 0, 0, 0.01],
  ];
  // the tail: four rings, curling up behind, and the widest part of the silhouette
  const tail = [
    [0.24, 0.24, 0.3, 0, -0.02, -0.16, L.fur],
    [0.23, 0.23, 0.28, 0, 0.02, -0.4, L.mask],
    [0.21, 0.21, 0.26, 0, 0.08, -0.62, L.fur],
    [0.18, 0.18, 0.22, 0, 0.15, -0.82, L.mask],
    [0.13, 0.13, 0.16, 0, 0.22, -0.98, L.fur],
  ];
  const b = parts => bakeBlocks(parts, rng);
  return {
    head: b(head), jaw: b(jaw), eyes: b(eyes), torso: b(torso), pelvis: b(pelvis),
    upperArm: b(upperArm), forearm: b(forearm), thigh: b(thigh), shin: b(shin),
    feet: [b(foot), b(foot)], tail: b(tail),
  };
}
const RAIDER_KITS = RAIDER_LOOKS.map((L, i) => bakeRaider(L, 7 + i * 31));
const raiderFur = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
// on a hit the whole body swaps to this for a beat (same shader, no recompile)
const raiderHurt = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, emissive: 0x7fd0ff, emissiveIntensity: 0.4 }); // dripping wet
const raiderEyes = new THREE.MeshBasicMaterial({ vertexColors: true });

// Spawn points sit just past the edge of the gameplay view (worked out from where the
// follow camera will be, whatever the window's shape), so nothing pops in on screen.
const spawnCam = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
const _sp = new THREE.Vector3();
function offscreen(x, z) {
  for (const y of [0, 2.2]) { // feet and head both out of frame
    _sp.set(x, y, z).project(spawnCam);
    if (_sp.z < 1 && Math.abs(_sp.x) < 1.08 && Math.abs(_sp.y) < 1.08) return false;
  }
  return true;
}
function spawnPoint(out) {
  spawnCam.aspect = window.innerWidth / window.innerHeight;
  spawnCam.updateProjectionMatrix();
  spawnCam.position.copy(player.position).add(CAM_OFFSET);
  spawnCam.lookAt(player.position.x, 0, player.position.z);
  spawnCam.updateMatrixWorld();
  const ang = Math.random() * Math.PI * 2, cx = Math.sin(ang), cz = Math.cos(ang);
  let r = 12;
  const along = r => [player.position.x + cx * r, player.position.z + cz * r];
  // walk out along a random bearing until it's off screen and clear of the cabin
  for (; r < 70; r += 1) {
    const [x, z] = along(r);
    if (offscreen(x, z) && (Math.abs(x) > EDGE + 1.5 || Math.abs(z) > EDGE + 1.5)) break;
  }
  [out.x, out.z] = along(r + 1.5 + Math.random() * 3);
  out.y = 0;
  pushOutOfSolids(out);
  return out;
}

let nextRaiderId = 1;
function spawnRaider(pos = spawnPoint(new THREE.Vector3())) {
  const kit = RAIDER_KITS[(Math.random() * RAIDER_KITS.length) | 0];
  const z = new THREE.Group();
  z.rotation.order = 'YXZ';
  const body = [];
  const mesh = (geo, parent, mat = raiderFur) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = mat !== raiderEyes;
    parent.add(m);
    if (mat === raiderFur) body.push(m);
    return m;
  };
  const pelvis = mesh(kit.pelvis, z);
  const upper = new THREE.Group(); upper.rotation.order = 'YXZ'; upper.scale.setScalar(Z_UPPER); z.add(upper); // waist pivot
  mesh(kit.torso, upper);
  const head = new THREE.Group(); head.position.set(0, 0.68, 0.06); head.rotation.order = 'YXZ'; upper.add(head);
  mesh(kit.head, head);
  const eyes = mesh(kit.eyes, head, raiderEyes);
  const jaw = new THREE.Group(); jaw.position.set(0, 0, -0.06); head.add(jaw);
  mesh(kit.jaw, jaw);
  const tail = mesh(kit.tail, upper);
  tail.position.set(0, 0.12, -0.2);
  const side = s => ({
    side: s,
    upperArm: mesh(kit.upperArm, z), forearm: mesh(kit.forearm, z),
    thigh: mesh(kit.thigh, z), shin: mesh(kit.shin, z), foot: mesh(kit.feet[s > 0 ? 0 : 1], z),
    shoulder: new THREE.Vector3(s * 0.36, 0.58, 0), hip: new THREE.Vector3(s * 0.14, 0, 0),
    sh: new THREE.Vector3(), elbow: new THREE.Vector3(), wrist: new THREE.Vector3(), reach: new THREE.Vector3(),
    hipP: new THREE.Vector3(), knee: new THREE.Vector3(), ankle: new THREE.Vector3(), foot3: new THREE.Vector3(),
  });
  const limbs = [side(1), side(-1)];

  z.position.set(pos.x, 0, pos.z);
  z.scale.setScalar(Z_SCALE * (0.94 + Math.random() * 0.12));
  const limp = Math.random() < 0.2 ? 0.3 + Math.random() * 0.3 : 0;
  const pace = 0.85 + Math.random() * 0.3;
  z.userData = {
    id: nextRaiderId++,                                 // the same raccoon on both screens when playing with a friend
    hp: state.raiderHp,
    pace,                                               // its speed relative to the wave's
    speed: state.raiderSpeed * pace,
    hurt: 0, body, eyes, pelvis, upper, head, jaw, tail, limbs,
    // gait personality
    phase: Math.random(),
    seed: Math.random() * 100,
    limp,                                               // 0 = sound legs; else how much one drags
    limpSide: Math.random() < 0.5 ? 1 : -1,
    hunch: 0.08 + Math.random() * 0.14,
    tilt: (Math.random() - 0.5) * 0.24,                 // head tilts to one side
    arms: 2,                                            // both paws out for a snack
    flinch: 0, attack: 0, groan: 0,
    gait: 1,       // 1 = walking, 0 = feet planted
    swing: -1,     // seconds into a swing at the garden buddy; -1 = not swinging
    swingCd: 0.15, struck: false, standing: false, swingAt: null, // swingAt: a door/window it's battering, else you
    climb: -1,     // 0..1 through clambering in a window; -1 = not climbing
    via: -1,       // which prop corner it's heading round (see routeAround)
    stuckT: 0, stuckX: pos.x, stuckZ: pos.z, // progress check (see chaseRaider)
    opening: null, // committed entry opening; null = re-pick on next outside frame
    stage: 0,      // 0 = heading to outer waypoint, 1 = heading through the gap
    heading: Math.atan2(-z.position.x, -z.position.z), // current facing, starts toward cabin
    turn: 3.0 + Math.random() * 2.0,                   // max turn rate (rad/s), varied per raccoon
  };
  z.rotation.y = z.userData.heading;
  scene.add(z);
  raiders.push(z);
  return z;
}

// on a water bead hitting: flash, flinch back, and snap the head
function hitRaider(z) {
  const u = z.userData;
  u.hurt = 0.12;
  u.flinch = 1;
  for (const m of u.body) m.material = raiderHurt;
}

const Z_POLE_KNEE = new THREE.Vector3(0, 0, 1);
const _zPole = new THREE.Vector3(), _zReach = new THREE.Vector3();
// pose a raccoon for this frame: a waddling, curious trot that gets brisker
// on later waves, paws out for the snack table.
// `dead` (0..1) goes limp as it leaves; `sag` buckles the knees.
function animateRaider(z, dt, near, dead = 0, sag = dead) {
  const u = z.userData;
  const fall = dead ? u.fallDir : 0; // +1 toppling forward, -1 backward
  const live = 1 - dead;
  const gait = u.gait * live; // 0 when it's standing its ground
  const sp = u.speed * gait;
  const run = THREE.MathUtils.clamp((u.speed - 3) / 2, 0, 1); // later waves lope instead of shamble
  const freq = 1.1 + sp * 0.22;
  const beta = 0.6 - 0.18 * run;
  u.phase = (u.phase + freq * dt * live) % 1;
  const ph = u.phase * Math.PI * 2;
  const L = Math.min(0.7, sp * beta / freq);
  const t = performance.now() / 1000 + u.seed;
  u.flinch *= Math.exp(-7 * dt);
  u.groan *= Math.exp(-2.5 * dt);
  u.attack = damp(u.attack, near < 2.4 && u.swing < 0 ? live : 0, 6, dt);
  // the swing: rear back with the arms up (-1), slam down and lunge (+1), recover
  const sw = u.swing, rec = Z_SWING - Z_STRIKE - 0.1;
  const blow = sw < 0 || dead ? 0
    : sw < Z_STRIKE ? -ease(sw / Z_STRIKE)
    : sw < Z_STRIKE + 0.1 ? -1 + 2 * ease((sw - Z_STRIKE) / 0.1)
    : 1 - ease(Math.min(1, (sw - Z_STRIKE - 0.1) / rec));
  const rear = Math.max(0, -blow), slam = Math.max(0, blow);
  const clamber = u.climb >= 0 && !dead ? Math.sin(Math.PI * u.climb) : 0; // over a window sill

  // pelvis: dips on every step, and drops hard onto the bad leg
  const badStance = u.limp ? Math.max(0, Math.sin(ph + (u.limpSide > 0 ? 0 : Math.PI))) : 0;
  const pelvisY = Z_HIP - 0.05 - 0.06 * run - 0.05 * Math.abs(Math.sin(ph)) * gait - 0.06 * slam - 0.08 * u.limp * badStance - 0.3 * sag;
  u.pelvis.position.set(0, pelvisY, 0);
  u.pelvis.rotation.set(0, 0.12 * Math.sin(ph) * live, (0.1 * Math.sin(ph) + 0.12 * u.limp * badStance * u.limpSide) * live);
  u.pelvis.updateMatrix();

  // torso: hunched, lurching side to side against the hips, kicked back by hits
  u.upper.position.set(0, pelvisY + 0.08, 0);
  u.upper.rotation.set(
    (u.hunch + 0.12 * run + 0.25 * u.attack - 0.55 * rear + 0.5 * slam) * live - 0.6 * u.flinch + 0.35 * fall * dead, // goes over with the fall
    -0.15 * Math.sin(ph) * live,
    (-0.14 * Math.sin(ph) - 0.1 * u.limp * badStance * u.limpSide) * live + 0.04 * Math.sin(t * 0.7));
  u.upper.updateMatrix();
  // head lolls, nods with each step, comes up to look at its meal, snaps back when shot
  u.head.rotation.set(
    (-u.hunch * 0.7 + 0.12 * Math.abs(Math.sin(ph)) - 0.25 * u.attack - 0.2 * rear) * live - 0.7 * u.flinch + (fall > 0 ? 0.3 : -0.6) * dead,
    0.25 * Math.sin(t * 0.9) * live,
    u.tilt + 0.18 * Math.sin(t * 1.3 + 1) * live);
  u.jaw.rotation.x = (0.12 + 0.12 * Math.abs(Math.sin(t * 2.3)) + 0.45 * u.groan + 0.35 * u.attack * Math.abs(Math.sin(t * 9)) + 0.5 * rear) * live + 0.5 * dead;
  u.tail.rotation.set(-0.12 + 0.1 * Math.sin(t * 2 + u.seed), 0.28 * Math.sin(t * 3 + u.seed) + 0.12 * Math.sin(ph), 0);

  for (const l of u.limbs) {
    // --- legs: the good leg steps through, the bad one drags its toe ---
    const bad = u.limp && l.side === u.limpSide;
    const p = (u.phase + (l.side > 0 ? 0 : 0.5 + 0.06 * u.limp)) % 1;
    const { s, lift, pitch } = footCycle(p, beta);
    l.foot3.set(l.side * (0.15 + 0.06 * dead), Z_ANKLE + lift * (bad ? 0.03 : 0.12 + 0.1 * run) * gait + 0.3 * clamber, s * L - 0.2 * clamber);
    l.hipP.copy(l.hip).applyMatrix4(u.pelvis.matrix);
    ik2(l.hipP, l.foot3, Z_THIGH, Z_SHIN, Z_POLE_KNEE, l.knee);
    l.ankle.subVectors(l.foot3, l.knee).normalize().multiplyScalar(Z_SHIN).add(l.knee);
    bone(l.thigh, l.hipP, l.knee, Z_POLE_KNEE);
    bone(l.shin, l.knee, l.ankle, Z_POLE_KNEE);
    l.foot.position.copy(l.ankle);
    l.foot.rotation.set(bad ? 0.35 : pitch * live, l.side * (bad ? 0.35 : 0.12), 0);

    // --- arms: reaching ones grope ahead (and claw when close); the rest hang and swing ---
    l.sh.copy(l.shoulder).applyMatrix4(u.upper.matrix);
    const reaches = (l.side > 0 ? u.arms >= 1 : u.arms >= 2) && !dead;
    const k = l.side * 1.7;
    if (reaches) {
      const claw = u.attack * Math.sin(t * 9 + k);
      l.reach.set(-l.side * 0.08, -0.08 + 0.06 * Math.sin(ph + k) + 0.18 * u.attack + 0.12 * claw - 0.3 * u.flinch,
        0.72 + 0.07 * Math.sin(ph * 2 + k) + 0.2 * claw - 0.35 * u.flinch);
    } else if (dead) {
      l.reach.set(l.side * 0.45 * dead, -0.7, -0.15 * fall * dead); // limp, flung out to the sides
    } else {
      // dangling: a loose pendulum against the stride
      l.reach.set(l.side * 0.1, -0.84, 0.1 + 0.16 * Math.sin(ph + (l.side > 0 ? Math.PI : 0)) * gait + 0.25 * u.flinch);
    }
    // every arm joins the swing: raised overhead, then clubbed down in front
    if (rear) l.reach.lerp(_zReach.set(l.side * 0.22, 0.5, 0.18), rear);
    if (slam) l.reach.lerp(_zReach.set(-l.side * 0.06, -0.3, 0.78), slam);
    if (clamber) l.reach.lerp(_zReach.set(l.side * 0.24, -0.6, 0.45), clamber); // hands planted on the sill
    l.reach.add(l.sh);
    ik2(l.sh, l.reach, Z_UPPER_ARM, Z_FOREARM, _zPole.set(l.side * 0.6, -1, -0.3), l.elbow);
    l.wrist.subVectors(l.reach, l.elbow).normalize().multiplyScalar(Z_FOREARM).add(l.elbow);
    bone(l.upperArm, l.sh, l.elbow, _zPole);
    bone(l.forearm, l.elbow, l.wrist, _zPole);
  }
}

// --- heading home: a puff of petals, a happy hop, and off through the trees ---
const fleeing = [];
function raiderFlees(z) {
  const u = z.userData;
  u.eyes.visible = true;
  u.home = { x: z.position.x - player.position.x, z: z.position.z - player.position.z, t: 0 };
  const l = Math.hypot(u.home.x, u.home.z) || 1;
  u.home.x /= l; u.home.z /= l;
  u.heading = Math.atan2(u.home.x, u.home.z);
  u.speed = Math.max(5.5, state.raiderSpeed * 1.8);
  u.gait = 1;
  u.climb = -1;
  for (const m of u.body) m.material = raiderFur;
  fleeing.push(z);
}
function updateFleeing(dt) {
  for (let i = fleeing.length - 1; i >= 0; i--) {
    const z = fleeing[i], u = z.userData;
    u.home.t += dt;
    z.position.x += u.home.x * u.speed * dt;
    z.position.z += u.home.z * u.speed * dt;
    z.rotation.y = u.heading;
    z.position.y = Math.abs(Math.sin(u.home.t * 11)) * 0.22; // little happy hops
    animateRaider(z, dt, 99);
    if (u.home.t > 1.5) { scene.remove(z); fleeing.splice(i, 1); }
  }
}
function clearFleeing() {
  for (const z of fleeing) scene.remove(z);
  fleeing.length = 0;
}

function nearestOpening(pos, skip) {
  let best = null, bd = Infinity;
  for (const o of openings) {
    if (o === skip) continue;
    const d = (o.x - pos.x) ** 2 + (o.z - pos.z) ** 2;
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}

function inside(pos) {
  return Math.abs(pos.x) < HALF - 0.3 && Math.abs(pos.z) < HALF - 0.3;
}

// --- doors and windows: shut at the start of a run, and stay broken once broken ---
const CLIMB_TIME = 1.1; // seconds to clamber in over a sill
const woodChip = new THREE.MeshStandardMaterial({ color: 0x6d6352, roughness: 0.9 });
function resetOpenings() {
  for (const o of openings) {
    Object.assign(o, { hp: o.maxHp, climber: null, jolt: 0, fallT: -1 });
    if (o.kind === 'door') {
      o.leaf.rotation.y = 0;
      o.fall.rotation.x = 0; o.fall.position.set(0, 0, -0.02);
    } else {
      o.glass.visible = true; o.glass.material = glassMat;
      o.bars.visible = true;
      o.shards.visible = false;
    }
  }
}
// bits flying off a door or window, into the cabin
function burst(o, n, mat, size, speed) {
  const sx = o.ix - o.x, sz = o.iz - o.z, l = Math.hypot(sx, sz);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(BOX, mat);
    m.scale.set(size * rnd(0.4, 1), size * rnd(0.2, 0.6), size * rnd(1, 2.5));
    const along = rnd(-0.5, 0.5) * (o.w - 0.3);
    m.position.set(o.x + (o.axis === 'x' ? along : 0), o.kind === 'door' ? rnd(0.3, 1.8) : rnd(o.sill + 0.05, o.head - 0.05), o.z + (o.axis === 'z' ? along : 0));
    m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    const v = speed * rnd(0.5, 1.2);
    spawnDebris(m, new THREE.Vector3(sx / l * v + rnd(-1, 1), rnd(0.5, 2.5), sz / l * v + rnd(-1, 1)),
      { life: rnd(2, 3.5), bounce: 0.02, spin: new THREE.Vector3(rnd(-12, 12), rnd(-12, 12), rnd(-12, 12)) });
  }
}
// a raccoon's paw (or the garden buddy's water bead, for glass) lands on a door or window
function hitOpening(o) {
  if (o.hp <= 0) return;
  o.hp--;
  o.jolt = 1;
  if (o.kind === 'door') {
    audio.knock(o);
    burst(o, 2, woodChip, 0.12, 2);
  } else if (o.hp > 0) {
    audio.crack(o);
    o.glass.material = glassCracked;
  }
  if (o.hp <= 0) breakOpening(o);
}
function breakOpening(o) {
  o.hp = 0;
  if (o.kind === 'door') {
    // off its hinges and down onto the floor
    o.fallT = 0;
    o.leaf.rotation.y = 0;
    audio.doorBreak(o);
    burst(o, 9, woodChip, 0.16, 3.5);
  } else {
    o.glass.visible = false;
    o.bars.visible = false;
    o.shards.visible = true;
    audio.shatter(o);
    burst(o, 16, glassMat, 0.09, 4);
  }
}
// does an unbroken door or window stand at (x, z)? (they stop water beads and paws)
function shutAt(x, z) {
  for (const o of openings) {
    if (o.hp > 0 && x >= o.box.minX && x <= o.box.maxX && z >= o.box.minZ && z <= o.box.maxZ) return o;
  }
  return null;
}
function updateOpenings(dt) {
  for (const o of openings) {
    o.jolt *= Math.exp(-9 * dt);
    if (o.kind === 'window') { o.pane.position.z = -0.03 * o.jolt; continue; }
    if (o.fallT >= 0) {
      // topples in like a slab: speeds up, slaps flat with a little bounce
      o.fallT += dt;
      const k = Math.min(1, o.fallT / 0.5), slap = k >= 1 ? 0.05 * Math.exp(-(o.fallT - 0.5) * 10) * Math.sin((o.fallT - 0.5) * 30) : 0;
      o.fall.rotation.x = -(Math.PI / 2 - 0.02) * k * k + slap;
      o.fall.position.set(0, 0.08 * k, -0.02 - 0.35 * k);
      continue;
    }
    if (o.hp <= 0) continue;
    // kicked inward on each blow
    o.leaf.rotation.y = o.jolt * 0.07;
  }
}
// start a raccoon clambering in through a broken window
function startClimb(z, o) {
  const ud = z.userData;
  o.climber = z;
  ud.climb = 0; ud.climbO = o;
  ud.climbFrom = z.position.clone();
  ud.heading = Math.atan2(o.lx - z.position.x, o.lz - z.position.z);
  z.rotation.y = ud.heading;
}
function climbStep(z, dt) {
  const ud = z.userData, o = ud.climbO;
  ud.climb = Math.min(1, ud.climb + dt / CLIMB_TIME);
  const k = ud.climb, e = ease(k);
  z.position.x = ud.climbFrom.x + (o.lx - ud.climbFrom.x) * e;
  z.position.z = ud.climbFrom.z + (o.lz - ud.climbFrom.z) * e;
  // up onto the sill, over on its belly, and down inside
  z.position.y = (o.sill - 0.15) * Math.min(1, Math.sin(Math.PI * k) * 1.4);
  z.rotation.x = 0.75 * Math.sin(Math.PI * k);
  if (k >= 1) endClimb(z);
}
function endClimb(z, died) {
  const ud = z.userData, o = ud.climbO;
  if (o.climber === z) o.climber = null;
  if (died && ud.climb < 0.5) z.position.copy(ud.climbFrom); // falls back out
  else z.position.set(o.lx, 0, o.lz);
  z.position.y = 0; z.rotation.x = 0;
  ud.climb = -1; ud.climbO = null; ud.opening = null; ud.stage = 0;
}

// --- solid props (see SOLIDS): raiders are shoved out of them and plan a way round them ---
const Z_RADIUS = 0.4;   // a raccoon's footprint
const ROUND_PAD = 0.35; // how wide of a corner they swing
const _local = { x: 0, z: 0 };
function toLocal(b, x, z) {
  const dx = x - b.x, dz = z - b.z;
  _local.x = dx * b.c - dz * b.s; _local.z = dx * b.s + dz * b.c;
  return _local;
}
function pushOutOfSolids(pos) {
  for (const b of SOLIDS) {
    const { x: lx, z: lz } = toLocal(b, pos.x, pos.z);
    const ex = b.hx + Z_RADIUS, ez = b.hz + Z_RADIUS;
    const px = ex - Math.abs(lx), pz = ez - Math.abs(lz);
    if (px <= 0 || pz <= 0) continue;
    // out through the nearest face, a hair clear of it so it doesn't read as still touching
    const nx = px < pz ? Math.sign(lx) * (ex + 0.01) : lx, nz = px < pz ? lz : Math.sign(lz) * (ez + 0.01);
    pos.x = b.x + nx * b.c + nz * b.s;
    pos.z = b.z - nx * b.s + nz * b.c;
  }
}
// does the segment a→b (prop-local) cross the box ±hx, ±hz? (slab test)
function segHitsBox(ax, az, bx, bz, hx, hz) {
  let t0 = 0, t1 = 1;
  const dx = bx - ax, dz = bz - az;
  if (Math.abs(dx) < 1e-9) { if (Math.abs(ax) >= hx) return false; }
  else {
    const ta = (-hx - ax) / dx, tb = (hx - ax) / dx;
    t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb));
  }
  if (Math.abs(dz) < 1e-9) { if (Math.abs(az) >= hz) return false; }
  else {
    const ta = (-hz - az) / dz, tb = (hz - az) / dz;
    t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb));
  }
  return t0 < t1;
}
// --- finding a way round the props: a shortest path over their corners (padded out so a
// raccoon clears them), searched whenever a prop blocks the straight line to the target ---
const SEE_SLOP = 0.05; // a raccoon pressed against a prop can still see along its side
const ROUND_NODES = SOLIDS.flatMap(b => [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([sx, sz]) => {
  const kx = sx * (b.hx + Z_RADIUS + ROUND_PAD), kz = sz * (b.hz + Z_RADIUS + ROUND_PAD);
  return { x: b.x + kx * b.c + kz * b.s, z: b.z - kx * b.s + kz * b.c };
}));
// can a raccoon walk straight from a to b without going through a prop?
function clearPath(ax, az, bx, bz) {
  for (const b of SOLIDS) {
    const p = toLocal(b, ax, az), px = p.x, pz = p.z, q = toLocal(b, bx, bz);
    if (segHitsBox(px, pz, q.x, q.z, b.hx + Z_RADIUS - SEE_SLOP, b.hz + Z_RADIUS - SEE_SLOP)) return false;
  }
  return true;
}
// which corners can see each other, and how far apart they are (props don't move)
const NODE_LINKS = ROUND_NODES.map(a => ROUND_NODES.map(b =>
  a !== b && clearPath(a.x, a.z, b.x, b.z) ? Math.hypot(a.x - b.x, a.z - b.z) : Infinity));
const _goal = { x: 0, z: 0 }, _from = { x: 0, z: 0 }, _toGoal = [], _done = [];
// Where a raccoon should head to get to (tx, tz): straight there if nothing's in the way,
// otherwise the corner in sight that starts the shortest way round. It doesn't count a
// corner it's already standing at, and stays loyal to its last pick (ud.via) unless another
// way is clearly shorter, so it doesn't dither between two even routes.
function routeAround(z, tx, tz) {
  const ud = z.userData;
  _goal.x = tx; _goal.z = tz;
  _from.x = z.position.x; _from.z = z.position.z;
  pushOutOfSolids(_from); // plan from where it'll be once it's been shoved clear
  const { x, z: fz } = _from;
  if (clearPath(x, fz, tx, tz)) { ud.via = -1; return _goal; }
  // how far each corner is from the goal, going round (Dijkstra out from the goal)
  const n = ROUND_NODES.length, dist = _toGoal;
  for (let i = 0; i < n; i++) {
    const k = ROUND_NODES[i];
    dist[i] = clearPath(k.x, k.z, tx, tz) ? Math.hypot(tx - k.x, tz - k.z) : Infinity;
    _done[i] = false;
  }
  for (let r = 0; r < n; r++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!_done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (dist[u] === Infinity) break;
    _done[u] = true;
    for (let i = 0; i < n; i++) dist[i] = Math.min(dist[i], dist[u] + NODE_LINKS[u][i]);
  }
  let best = -1, bestCost = Infinity, near = -1, nearD = Infinity;
  for (let i = 0; i < n; i++) {
    const k = ROUND_NODES[i], d = Math.hypot(k.x - x, k.z - fz);
    if (d < 0.45 || !clearPath(x, fz, k.x, k.z)) continue;
    if (d < nearD) { nearD = d; near = i; }
    const cost = d + dist[i] - (ud.via === i ? 1 : 0);
    if (cost < bestCost) { bestCost = cost; best = i; }
  }
  if (best < 0) best = near; // no way through from here: at least get round the nearest corner
  if (best < 0) return _goal;
  ud.via = best;
  _goal.x = ROUND_NODES[best].x; _goal.z = ROUND_NODES[best].z;
  return _goal;
}

function shooRaider(z, idx, dir) {
  if (friendHere() && !isGuest()) link.send({ t: 'home', id: z.userData.id });
  if (z.userData.climb >= 0) endClimb(z, true);
  spawnPetals(z.position);
  maybeDrop(z.position);
  raiderFlees(z);
  raiders.splice(idx, 1);
  state.kills++;
}

// ===================================================================
// TREATS — snacks the raccoons sometimes leave behind
// ===================================================================
const DROP_TYPES = [
  { id: 'med',  name: '+1 HEART',      color: 0xe06a7a, weight: 40 },
  { id: 'dmg',  name: 'SUPER SPRAY',   color: 0x5ac8e8, weight: 25 },
  { id: 'ammo', name: 'FULL CAN',      color: 0x9ad8a0, weight: 25 },
  { id: 'fast',   name: 'FAST SPRAY',      color: 0xf2d04a, weight: 15 },
  { id: 'wide',   name: 'SPRINKLER BURST', color: 0x7ad0f0, weight: 15 },
  { id: 'feet',   name: 'FAST FEET',       color: 0xf08a5a, weight: 15 },
  { id: 'shield', name: 'BUBBLE',          color: 0xb9a2f2, weight: 10 },
];
/**
 * How long each timed power-up lasts, in seconds (doubled from the first 10 and 8). Picking up one you
 * already have adds its time, up to POWER_MAX, so a shower of treats is never wasted.
 */
const POWER_TIME = { dmg: 20, ammo: 16, fast: 20, wide: 20, feet: 20, shield: 16 };
const POWER_KEY = { dmg: 'pDamage', ammo: 'pAmmo', fast: 'pRate', wide: 'pSpread', feet: 'pSpeed', shield: 'pShield' };
const POWER_MAX = 60;
// each pickup is a little blocky item in a soft glow of its color
const K = 0x1a1a1a;
const DROP_MODELS = {
  med: [  // a little basket of berries
    [0.5, 0.24, 0.38, 0, -0.04, 0, 0xb07a48, 0, 0, 0, 0.04],
    [0.46, 0.1, 0.34, 0, 0.1, 0, 0xcf9a62, 0, 0, 0, 0.02],
    [0.16, 0.16, 0.16, -0.12, 0.16, 0.06, 0xd8485c, 0, 0.2, 0, 0.05],
    [0.16, 0.16, 0.16, 0.1, 0.16, -0.04, 0xe05a6a, 0, 0, 0, 0.05],
    [0.15, 0.15, 0.15, 0.02, 0.2, 0.1, 0xc83a4e, 0, 0.4, 0, 0.05],
    [0.07, 0.07, 0.03, 0.02, 0.29, 0.1, 0x6a9a3a, 0, 0, 0.5, 0.01],
  ],
  dmg: [  // two little spray bottles
    [0.16, 0.32, 0.16, -0.1, -0.04, 0, 0x4fb8d8, 0, 0, 0, 0.04], [0.16, 0.32, 0.16, 0.1, -0.04, 0, 0x6ac8e8, 0, 0, 0, 0.04],
    [0.1, 0.1, 0.1, -0.1, 0.17, 0, 0xe8f8ff, 0, 0, 0, 0.03], [0.1, 0.1, 0.1, 0.1, 0.17, 0, 0xe8f8ff, 0, 0, 0, 0.03],
    [0.12, 0.05, 0.12, -0.1, 0.24, 0, 0x2e6a80, 0, 0, 0, 0.02], [0.12, 0.05, 0.12, 0.1, 0.24, 0, 0x2e6a80, 0, 0, 0, 0.02],
  ],
  ammo: [ // a full watering can
    [0.34, 0.32, 0.3, 0, -0.02, 0, 0x6f9ab8, 0, 0, 0, 0.05], [0.36, 0.05, 0.32, 0, 0.16, 0, 0x8fb8d0, 0, 0, 0, 0.02],
    [0.09, 0.3, 0.09, 0, 0.12, 0.22, 0x4f7a9e, 0.9, 0, 0, 0.03],
    [0.16, 0.05, 0.16, 0, 0.27, 0.35, 0xd8ecf6, 0.9, 0, 0, 0.02],
    [0.2, 0.05, 0.06, 0, 0.2, -0.18, 0x4f7a9e, 0, 0, 0, 0.02],
    [0.26, 0.05, 0.02, 0, 0.02, 0.152, 0x9ad8a0, 0, 0, 0, 0.005],
  ],
  fast: [ // a zigzag lightning bolt
    [0.14, 0.2, 0.1, 0.06, 0.16, 0, 0xf2d04a, 0, 0, 0.5, 0.03],
    [0.22, 0.08, 0.1, 0, 0.04, 0, 0xffe27a, 0, 0, 0, 0.03],
    [0.14, 0.22, 0.1, -0.06, -0.1, 0, 0xf2d04a, 0, 0, 0.5, 0.03],
  ],
  wide: [ // a sprinkler head with three nozzles
    [0.36, 0.1, 0.36, 0, -0.1, 0, 0x4a8a4a, 0, 0, 0, 0.03],
    [0.12, 0.2, 0.12, 0, 0.04, 0, 0x8a8a8a, 0, 0, 0, 0.02],
    [0.08, 0.08, 0.2, -0.12, 0.18, 0, 0x7ad0f0, 0, 0.6, 0, 0.02],
    [0.08, 0.08, 0.2, 0, 0.2, 0, 0x7ad0f0, 0, 0, 0, 0.02],
    [0.08, 0.08, 0.2, 0.12, 0.18, 0, 0x7ad0f0, 0, -0.6, 0, 0.02],
  ],
  feet: [ // a running shoe
    [0.42, 0.14, 0.2, 0.02, -0.08, 0, 0xf08a5a, 0, 0, 0, 0.04],
    [0.2, 0.16, 0.2, -0.1, 0.06, 0, 0xe0704a, 0, 0, 0, 0.03],
    [0.44, 0.05, 0.22, 0.02, -0.17, 0, 0xf4f0e8, 0, 0, 0, 0.02],
    [0.1, 0.03, 0.21, 0.08, -0.01, 0, 0xffffff, 0, 0, 0, 0.01],
  ],
  shield: [ // a round bubble with a shine
    [0.38, 0.38, 0.38, 0, 0.02, 0, 0xb9a2f2, 0.6, 0.6, 0, 0.12],
    [0.1, 0.1, 0.04, -0.08, 0.12, 0.19, 0xffffff, 0, 0, 0, 0.03],
  ],
};
const dropMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: 0x1c1c1c });
const dropGlow = glowTexture();
for (const t of DROP_TYPES) {
  t.geo = bakeBlocks(DROP_MODELS[t.id], seeded(3));
  t.glow = new THREE.SpriteMaterial({ map: dropGlow, color: t.color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
}
const DROP_CHANCE = 0.05; // per kill, before SCAVENGER
const DROP_PITY = 30;     // guaranteed drop after this many dry kills
const DROP_LIFE = 12;     // seconds before an uncollected drop vanishes
const drops = [];

function maybeDrop(pos) {
  state.sinceDrop++;
  if (Math.random() > DROP_CHANCE + state.dropBonus && state.sinceDrop < DROP_PITY) return;
  state.sinceDrop = 0;
  // no medkits at full health — they'd be a wasted drop
  const pool = DROP_TYPES.filter(t => t.id !== 'med' || state.hp < state.maxHp);
  let r = Math.random() * pool.reduce((a, t) => a + t.weight, 0);
  spawnDrop(pool.find(t => (r -= t.weight) < 0) || pool[0], pos);
}

/** `keep`: a reward for a right answer stays until it's picked up; other drops vanish after DROP_LIFE. */
function spawnDrop(type, pos, keep = false) {
  const d = new THREE.Group();
  const item = new THREE.Mesh(type.geo, dropMat); item.castShadow = true; item.scale.setScalar(1.25); d.add(item);
  const glow = new THREE.Sprite(type.glow); glow.scale.setScalar(2.6); d.add(glow);
  d.position.set(pos.x, 0.7, pos.z);
  d.userData = { type, life: keep ? Infinity : DROP_LIFE, t: Math.random() * 6 };
  scene.add(d);
  drops.push(d);
}

function collect(type) {
  audio.pickup(type.id);
  showToast(type.name, '#' + type.color.toString(16).padStart(6, '0'));
  if (type.id === 'med') { state.hp = Math.min(state.maxHp, state.hp + 1); return; }
  const key = POWER_KEY[type.id];
  state[key] = Math.min(POWER_MAX, state[key] + POWER_TIME[type.id]);
  if (type.id === 'ammo') { state.reloading = false; state.mag = state.magSize; }
}
function updateDrops(dt) {
  const lim = HALF - 0.9;
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i], ud = d.userData;
    ud.life -= dt; ud.t += dt;
    const p = d.position;
    const dx = player.position.x - p.x, dz = player.position.z - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.9) { collect(ud.type); scene.remove(d); drops.splice(i, 1); continue; }
    if (dist < 2.5) {
      // magnet: close drops fly to the player
      p.x += (dx / dist) * 10 * dt; p.z += (dz / dist) * 10 * dt;
    } else {
      // the player can't leave the cabin, so drops that land outside slide in
      const cx = Math.max(-lim, Math.min(lim, p.x)), cz = Math.max(-lim, Math.min(lim, p.z));
      const ox = cx - p.x, oz = cz - p.z, od = Math.hypot(ox, oz);
      if (od > 0.01) { const st = Math.min(od, 6 * dt); p.x += (ox / od) * st; p.z += (oz / od) * st; }
    }
    p.y = 0.7 + Math.sin(ud.t * 3) * 0.15;
    d.rotation.y += dt * 2;
    d.visible = ud.life > 3 || ((ud.t * 8) | 0) % 2 === 0; // blink before vanishing
    if (ud.life <= 0) { scene.remove(d); drops.splice(i, 1); }
  }
}

// ===================================================================
// UPGRADES — pick one of three after every cleared round
// ===================================================================
// Each card can be taken up to `max` times per run. `ok` (optional) hides a
// card while it would do nothing. `stat` returns [now, after] for the card.
const UPGRADES = [
  { id: 'mag',    cat: 'handling',  pic: '🪣', name: 'Big can',      desc: 'More water',            max: 5, stat: s => [s.magSize, s.magSize + 4 + ' sprays'],                        apply: s => { s.magSize += 4; s.mag = s.magSize; } },
  { id: 'reload', cat: 'handling',  pic: '🚰', name: 'Fast fill',    desc: 'Fill up quick',            max: 4, stat: s => [s.reloadTime.toFixed(2), (s.reloadTime * 0.75).toFixed(2) + 's'], apply: s => { s.reloadTime *= 0.75; } },
  { id: 'damage', cat: 'firepower', pic: '💦', name: 'Big splash',   desc: 'Splash harder',          max: 6, stat: s => [s.damage + '×', s.damage + 0.5 + '×'],                       apply: s => { s.damage += 0.5; } },
  { id: 'rate',   cat: 'firepower', pic: '⚡', name: 'Fast spray',   desc: 'Spray faster',             max: 4, stat: s => [(1 / s.fireRate).toFixed(1), (1 / (s.fireRate * 0.8)).toFixed(1) + '/s'], apply: s => { s.fireRate *= 0.8; } },
  { id: 'pierce', cat: 'firepower', pic: '🌊', name: 'Long splash',  desc: 'Splash 2 at once',    max: 3, stat: s => [s.pierce, s.pierce + 1 + ' thru'],                        apply: s => { s.pierce++; } },
  { id: 'spread', cat: 'firepower', pic: '🚿', name: 'Sprinkler',    desc: 'More streams',          max: 3, stat: s => [1 + s.spread, 2 + s.spread + ' streams'],                  apply: s => { s.spread++; } },
  { id: 'hp',     cat: 'survival',  pic: '❤️', name: 'New heart',    desc: 'One more heart',         max: 3, stat: s => [s.maxHp, s.maxHp + 1 + ' hearts'],                          apply: s => { s.maxHp++; s.hp++; } },
  { id: 'speed',  cat: 'survival',  pic: '👟', name: 'Fast feet',    desc: 'Walk faster',              max: 3, stat: s => [Math.round(s.speed / 6.2 * 100) + '%', Math.round(s.speed * 1.12 / 6.2 * 100) + '%'], apply: s => { s.speed *= 1.12; } },
  { id: 'luck',   cat: 'fortune',   pic: '🎁', name: 'More gifts',   desc: 'More treats drop',             max: 3, stat: s => [Math.round((DROP_CHANCE + s.dropBonus) * 100) + '%', Math.round((DROP_CHANCE + s.dropBonus + 0.03) * 100) + '% treats'], apply: s => { s.dropBonus += 0.03; } },
  { id: 'heal',   cat: 'survival',  pic: '🍓', name: 'Snack time',   desc: 'Fill your hearts',              max: Infinity, ok: s => s.hp < s.maxHp, stat: s => [s.hp, s.maxHp + ' hearts'], apply: s => { s.hp = s.maxHp; } },
];
const UPGRADE_CATS = {
  firepower: '#4fa8c8',
  handling:  '#e0b84a',
  survival:  '#7aae5a',
  fortune:   '#c87ab8',
};
// 8x8 pixel icons in the game's blocky style: X = solid, o = dim
const UPGRADE_ICONS = {
  mag:    ['XX.XX.XX', 'XX.XX.XX', 'oo.oo.oo', 'oo.oo.oo', 'oo.oo.oo', 'oo.oo.oo', 'XX.XX.XX', '........'],
  reload: ['..XXXX..', '.X....XX', 'X....XXX', 'X.......', 'X......X', 'X......X', '.X....X.', '..XXXX..'],
  damage: ['.XXXXXX.', 'XXXXXXXX', 'X..XX..X', 'X..XX..X', 'XXXXXXXX', '.XXX.XX.', '..XXXX..', '..X.X.X.'],
  rate:   ['....XXX.', '...XXX..', '..XXX...', '.XXXXXX.', '...XXX..', '..XXX...', '.XX.....', '.X......'],
  pierce: ['.o..o...', '.o..o.X.', '.o..o..X', 'XXXXXXXX', '.o..o..X', '.o..o.X.', '.o..o...', '........'],
  spread: ['......XX', '....oo..', '..oo....', 'XXooooXX', '..oo....', '....oo..', '......XX', '........'],
  hp:     ['XXXXXXXX', 'XooooooX', 'XoooXooX', 'XooXXXoX', '.XooXoX.', '.XooooX.', '..XooX..', '...XX...'],
  speed:  ['........', 'XX..XX..', '.XX..XX.', '..XX..XX', '.XX..XX.', 'XX..XX..', '........', '........'],
  luck:   ['XXXXXXXX', 'XX....XX', 'X.X..X.X', 'X..XX..X', 'X..XX..X', 'X.X..X.X', 'XX....XX', 'XXXXXXXX'],
  heal:   ['.XX..XX.', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...', '........'],
};
function pixelIcon(rows, cls = 'cicon') {
  let r = '';
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== '.') r += `<rect x="${x}" y="${y}" width="1" height="1"${c === 'o' ? ' opacity=".35"' : ''}/>`;
  }));
  return `<svg class="${cls}" viewBox="0 0 8 8" shape-rendering="crispEdges" fill="currentColor">${r}</svg>`;
}
let offered = [];
const PICK_LOCKOUT_MS = 650; // ~ when the last card finishes dealing in

function openPicker(healed) {
  const pool = UPGRADES.filter(u => (state.upgrades[u.id] || 0) < u.max && (!u.ok || u.ok(state)));
  for (let i = pool.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
  offered = pool.slice(0, 3);
  if (!offered.length) { state.choosing = false; state.intermission = 3.2; setBusy(false); return; } // everything maxed out
  state.choosing = true;
  clearTimeout(choose._t);
  clearTimeout(openPicker._t);
  // Young players: big pictures, two-word names, and a few plain words. No numbers to read.
  hud.pickerTitle.textContent = 'GREAT JOB!';
  hud.pickerSub.textContent = (healed ? '+1 HEART  ·  ' : '') + 'PICK A PRIZE';
  hud.cards.innerHTML = offered.map((u, i) => {
    return `<div class="card kid" data-i="${i}" style="--accent:${UPGRADE_CATS[u.cat]};animation-delay:${i * 90}ms" role="button" aria-label="${u.name}. ${u.desc}.">` +
      `<span class="ckey" aria-hidden="true">${i + 1}</span>` +
      `<div class="cpic" aria-hidden="true">${u.pic}</div>` +
      `<div class="cname">${u.name}</div><div class="cdesc">${u.desc}</div></div>`;
  }).join('');
  hud.picker.classList.remove('hidden');
  hud.cards.classList.remove('ready');
  audio.deal(offered.length);
  openPicker._t = setTimeout(() => hud.cards.classList.add('ready'), PICK_LOCKOUT_MS);
}

function choose(i) {
  const u = offered[i];
  if (!state.choosing || !u) return;
  state.upgrades[u.id] = (state.upgrades[u.id] || 0) + 1;
  u.apply(state);
  state.choosing = false;
  // brief beat so the pick registers visually before the picker closes
  [...hud.cards.children].forEach((c, k) => c.classList.add(k === i ? 'picked' : 'dropped'));
  clearTimeout(choose._t);
  choose._t = setTimeout(() => hud.picker.classList.add('hidden'), 320);
  state.intermission = 2.0;
  setBusy(false);
  showToast(u.name, UPGRADE_CATS[u.cat]);
  audio.upgrade(u.cat);
}

// ===================================================================
// PARTICLES (petals)
// ===================================================================
function spawnPetals(pos) {
  for (let i = 0; i < 12; i++) {
    const p = new THREE.Mesh(blobGeo, petalMat);
    const s = 0.1 + Math.random() * 0.14;
    p.scale.set(s, s, s);
    p.position.set(pos.x, 0.8, pos.z);
    p.userData = {
      v: new THREE.Vector3((Math.random() - 0.5) * 5, 3 + Math.random() * 4, (Math.random() - 0.5) * 5),
      life: 0.6 + Math.random() * 0.4,
    };
    scene.add(p);
    particles.push(p);
  }
}

// ===================================================================
// WAVES
// ===================================================================
function startWave(n) {
  state.wave = n;
  // Raccoons get a little quicker and sturdier, but slower than the treats let
  // the player scale, so rounds can go long; speed stays under the player's.
  state.raiderSpeed = Math.min(5.2, 2.3 + n * 0.18);
  state.raiderHp = 2 + (n - 1) * 0.4;
  // anything already up counts toward the round
  state.toSpawn = Math.max(0, 5 + n * 3 - raiders.length);
  for (const z of raiders) { z.userData.speed = state.raiderSpeed * z.userData.pace; z.userData.hp = state.raiderHp; }
  state.spawnTimer = 0;
  state.intermission = 0;
  const hellos = { 1: 'here comes the family', 5: 'more little paws', 8: 'a busy evening', 12: 'the whole family', 15: 'a raccoon party' };
  showBanner('ROUND ' + n, hellos[n] || 'more friends');
  audio.waveStart(n);
  if (friendHere() && !isGuest()) link.send({ t: 'wave', n });
}

// ===================================================================
// GAME FLOW
// ===================================================================
// clear everything a run leaves lying around
function clearRun() {
  for (const b of bullets) scene.remove(b);
  for (const r of ripples.splice(0)) { scene.remove(r); r.material.dispose(); }
  for (const z of raiders) scene.remove(z);
  for (const p of particles) scene.remove(p);
  for (const d of drops) scene.remove(d);
  for (const d of debris) scene.remove(d);
  clearFleeing();
  bullets.length = 0; raiders.length = 0; particles.length = 0; drops.length = 0; debris.length = 0;
  hud.picker.classList.add('hidden');
}

// the garden buddy's stats before any upgrades
const BASE_STATS = { maxHp: 3, magSize: 8, reloadTime: 1.2, fireRate: 0.13, damage: 1, pierce: 0, spread: 0, speed: 6.2, dropBonus: 0 };

// `keep` carries over what's on the field (coming from the title: the garden buddy stays
// where they are and the yard's raccoons join round 1, which starts once the camera is down)
function resetGame(keep = false) {
  if (!keep) { clearRun(); resetOpenings(); }
  weather.set(0);
  Object.assign(state, {
    ...BASE_STATS, running: true, hp: BASE_STATS.maxHp, kills: 0, shots: 0, wave: 0,
    mag: BASE_STATS.magSize, reloading: false, reloadT: 0,
    fireCd: 0, dmgCd: 0, toSpawn: 0, spawnTimer: 0,
    intermission: 0, choosing: false, shake: 0, upgrades: {},
    pDamage: 0, pAmmo: 0, pRate: 0, pSpread: 0, pSpeed: 0, pShield: 0, sinceDrop: 0,
  });
  if (keep) {
    state.intermission = SWOOP_TIME * 0.85;
    for (const z of raiders) Object.assign(z.userData, { cross: null, idle: 0, via: -1 });
  } else {
    player.position.set(0, 0, 0);
    startWave(1);
  }
  updateHUD();
}

function startGame(fromTitle = false, fromRoom = false) {
  if (!fromRoom && isGuest() && !state.running && !document.getElementById('death').classList.contains('hidden')) {
    showToast('The host starts the next night.', '#e0b84a');
    return;
  }
  audio.ensure(); // create/resume AudioContext within the click gesture
  endNap();
  document.getElementById('death').classList.add('hidden');
  title.active = false;
  document.body.classList.remove('titling');
  menuEl.classList.add('gone');
  resetGame(fromTitle);
  if (friendHere() && !isGuest()) {
    for (const remote of remotes.values()) Object.assign(remote, { nap: false, busy: false, hurtCd: 0 });
    link.send({ t: 'restart' });
    sendSnap(true);
  }
}

function setPaused(on) {
  if (on && !state.running) return; // only a live run can pause
  if (on === state.paused) return;
  state.paused = on;
  firing = false;
  for (const k in keys) keys[k] = false; // keyups are missed while the menu is up
  document.getElementById('pauseStat').textContent = `ROUND ${state.wave} · ${state.kills} SHOOED`;
  document.getElementById('pause').classList.toggle('hidden', !on);
  audio.pause(on);
}

function quitToTitle() {
  if (embedded) { bridge.quit(); return; }
  setPaused(false);
  state.running = false;
  document.getElementById('death').classList.add('hidden');
  enterTitle(false);
  music.setMode('title');
}

function die() {
  state.running = false;
  firing = false;
  document.getElementById('deathStat').textContent =
    `YOU KEPT THE CABIN COZY TO ROUND ${state.wave} · ${state.kills} SHOOED`;
  // best night is ranked by how many raccoons went home happy
  const best = store.get('best', null), record = state.kills > 0 && (!best || state.kills > best.kills);
  if (record) store.set('best', { wave: state.wave, kills: state.kills });
  const db = document.getElementById('deathBest');
  db.textContent = record ? 'NEW BEST NIGHT' : best ? `BEST: ROUND ${best.wave} · ${best.kills} SHOOED` : '';
  db.classList.toggle('record', record);
  document.getElementById('death').classList.remove('hidden');
  audio.death();
  if (friendHere() && !isGuest()) link.send({ t: 'over', w: state.wave, k: state.kills });
  endNap();
  sidecarFinish('caught');
}

// ===================================================================
// TITLE SCREEN — the menu sits over a live shot of the cabin: the door shut, the garden
// buddy out of sight inside, a few raccoons wandering across the yard, the camera on a slow
// drift. PLAY swoops the camera down into the gameplay view and those raccoons join round 1.
// ===================================================================
const TITLE_RAIDERS = 4;
const SWOOP_TIME = 1.8;
const title = { active: true, t: 0, groan: 3 };
const menuEl = document.getElementById('menu');
const TITLE_CAM = new THREE.Vector3(2, 0, 24); // roughly where the title camera stands

// The raccoons cross the yard between the back wall and the camera, side to side through the
// shot, some each way so neither side empties. Past crossX() they're out of frame (wider
// screens see more of the yard); there they wait a beat and come back in from the far edge.
const CROSS_Z = [11.5, 15.5];
const crossX = () => 2 + 5 * camera.aspect;
function crossYard(z, dir, x = -dir * crossX()) {
  const ud = z.userData, lz = rnd(...CROSS_Z);
  z.position.set(x, 0, lz);
  pushOutOfSolids(z.position);
  Object.assign(ud, {
    cross: { x: dir * (crossX() + 1), z: THREE.MathUtils.clamp(lz + rnd(-2, 2), ...CROSS_Z) },
    // now and then one stops partway to sway a while before carrying on
    stopX: Math.random() < 0.35 ? rnd(-5, 5) : null,
    speed: rnd(0.7, 1.05), heading: dir * Math.PI / 2, idle: 0, via: -1,
  });
  z.rotation.y = ud.heading;
}

function enterTitle(splash) {
  title.active = true;
  clearRun();
  resetOpenings();
  weather.set(0); // the title is a clear night
  state.running = false;
  state.dmgCd = 0;
  player.position.set(0, 0, 0); // in the middle of the cabin, below the line of the walls
  player.rotation.y = 0;
  // the first crowd starts spread along the way, alternating directions
  for (let i = 0; i < TITLE_RAIDERS; i++) {
    const x = crossX() * (2 * (i + rnd(0.2, 0.8)) / TITLE_RAIDERS - 1);
    crossYard(spawnRaider(new THREE.Vector3()), i % 2 ? 1 : -1, x);
  }
  document.body.classList.add('titling');
  menuEl.classList.remove('gone');
  menuEl.classList.toggle('splash', splash);
  menu.open(null);
  menu.select(0, true);
  showBest();
}

function wanderRaider(z, dt) {
  const ud = z.userData, c = ud.cross, dir = Math.sign(c.x);
  let walking = false;
  if (ud.idle > 0) ud.idle -= dt; // stand and sway a while
  else if (ud.stopX !== null && (z.position.x - ud.stopX) * dir > 0) {
    ud.stopX = null;
    ud.idle = rnd(1.5, 3.5);
  } else if (z.position.x * dir > crossX()) { // out of shot: round again after a beat
    crossYard(z, dir);
    ud.idle = rnd(0, 1);
  } else {
    const g = routeAround(z, c.x, c.z);
    walkToward(z, g.x - z.position.x, g.z - z.position.z, ud.speed, 1.5, dt);
    walking = true;
  }
  ud.gait = damp(ud.gait, walking ? 1 : 0, 4, dt);
  animateRaider(z, dt, 99);
}

function updateTitle(dt) {
  title.t += dt;
  // an occasional friendly chatter from the yard
  if ((title.groan -= dt) <= 0 && raiders.length) {
    const gz = raiders[(Math.random() * raiders.length) | 0];
    audio.chatter(gz.position);
    gz.userData.groan = 1;
    title.groan = rnd(3, 7);
  }
}

// --- camera: a slow cinematic drift on the title, the follow cam in a run, a swoop between ---
const TITLE_FOV = 42, GAME_FOV = 55;
const followPos = new THREE.Vector3();
const titlePos = new THREE.Vector3(), titleLook = new THREE.Vector3(), camLook = new THREE.Vector3();
let camMix = 0; // 0 = title shot, 1 = follow cam
const swoop = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease in-out cubic
function updateCamera(dt) {
  tmp.copy(player.position).add(CAM_OFFSET);
  if (state.shake > 0) {
    state.shake = Math.max(0, state.shake - dt * 2.2);
    const s = settings.shake ? state.shake : 0;
    tmp.x += (Math.random() - 0.5) * s;
    tmp.z += (Math.random() - 0.5) * s;
    tmp.y += (Math.random() - 0.5) * s;
  }
  if (camMix === 0) followPos.copy(tmp);
  else followPos.lerp(tmp, 1 - Math.pow(0.001, dt));
  camMix = THREE.MathUtils.clamp(camMix + (title.active ? -1 : 1) * dt / SWOOP_TIME, 0, 1);

  // title shot: low in the yard, drifting side to side and breathing like a handheld
  const t = title.t;
  titlePos.set(TITLE_CAM.x + 1.4 * Math.sin(t * 0.045), 2 + 0.2 * Math.sin(t * 0.07) + 0.03 * Math.sin(t * 1.3), TITLE_CAM.z - 1.2 * Math.sin(t * 0.031));
  titleLook.set(-1.5 + 0.7 * Math.sin(t * 0.045 + 0.6), 2.2 + 0.02 * Math.sin(t * 1.1), 8);

  const e = swoop(camMix);
  camera.position.lerpVectors(titlePos, followPos, e);
  camLook.lerpVectors(titleLook, player.position, e);
  camera.lookAt(camLook);
  const fov = THREE.MathUtils.lerp(TITLE_FOV, GAME_FOV, e);
  if (Math.abs(camera.fov - fov) > 1e-3) { camera.fov = fov; camera.updateProjectionMatrix(); }
  sky.position.copy(camera.position);
}

// --- the menu itself: keyboard (arrows/WASD, enter, esc) and mouse both drive it ---
const menuButtons = [...document.querySelectorAll('#menuList button')];
const settingRows = [...document.querySelectorAll('#settingRows .srow')];
const menu = {
  sel: 0, panel: null, row: 0,
  select(i, quiet) {
    i = (i + menuButtons.length) % menuButtons.length;
    if (i !== this.sel && !quiet) audio.ui('move');
    this.sel = i;
    menuButtons.forEach((b, k) => b.classList.toggle('sel', k === i));
    const b = menuButtons[i], m = document.getElementById('menuMarker');
    m.style.height = b.offsetHeight + 'px';
    m.style.transform = `translateY(${b.offsetTop}px)`;
  },
  open(panel) {
    this.panel = panel;
    document.getElementById('howPanel').classList.toggle('open', panel === 'how');
    document.getElementById('settingsPanel').classList.toggle('open', panel === 'settings');
    if (panel === 'settings') this.selectRow(this.row, true);
    this.hints();
  },
  activate(i = this.sel) {
    const act = menuButtons[i].dataset.act;
    this.select(i, true);
    if (act === 'play') { this.open(null); startGame(true); return; }
    audio.ui(this.panel === act ? 'back' : 'select');
    this.open(this.panel === act ? null : act);
  },
  selectRow(i, quiet) {
    i = (i + settingRows.length) % settingRows.length;
    if (i !== this.row && !quiet) audio.ui('move');
    this.row = i;
    settingRows.forEach((r, k) => r.classList.toggle('sel', k === i));
  },
  adjust(key, dir) {
    if (key === 'shake') settings.shake = dir === 0 ? !settings.shake : dir > 0;
    else settings[key] = THREE.MathUtils.clamp(settings[key] + dir, 0, 10);
    store.set('settings', settings);
    audio.applyVolume();
    audio.ui('move');
    this.drawSettings();
  },
  drawSettings() {
    for (const r of settingRows) {
      const k = r.dataset.key, v = settings[k];
      if (k === 'shake') {
        r.querySelector('.toggle').innerHTML = `<i class="${v ? 'on' : ''}" data-v="1">ON</i><i class="${v ? '' : 'on'}" data-v="0">OFF</i>`;
        r.querySelector('em').textContent = '';
      } else {
        r.querySelector('.meter').innerHTML = Array.from({ length: 10 }, (_, n) => `<i class="${n < v ? 'on' : ''}" data-v="${n + 1}"></i>`).join('');
        r.querySelector('em').textContent = v * 10;
      }
    }
  },
  hints() {
    const keys = this.panel === 'settings'
      ? [['↑', '↓', 'SELECT'], ['←', '→', 'ADJUST'], ['ESC', 'BACK']]
      : this.panel ? [['ESC', 'BACK']]
      : [['↑', '↓', 'SELECT'], ['ENTER', 'CONFIRM']];
    document.getElementById('menuHints').innerHTML = keys.map(k =>
      `<span>${k.slice(0, -1).map(c => `<kbd>${c}</kbd>`).join('')}${k[k.length - 1]}</span>`).join('');
  },
  // keyboard: returns true if the title used the key
  key(e) {
    if (!title.active || menuEl.classList.contains('gone')) return false;
    if (e.code === 'KeyM') return false; // mute works everywhere
    if (menuEl.classList.contains('splash')) { this.leaveSplash(); return true; }
    const c = e.code, up = c === 'ArrowUp' || c === 'KeyW', down = c === 'ArrowDown' || c === 'KeyS';
    const left = c === 'ArrowLeft' || c === 'KeyA', right = c === 'ArrowRight' || c === 'KeyD';
    const ok = c === 'Enter' || c === 'Space', back = c === 'Escape' || c === 'Backspace';
    if (this.panel === 'settings') {
      const key = settingRows[this.row].dataset.key;
      if (up) this.selectRow(this.row - 1);
      else if (down) this.selectRow(this.row + 1);
      else if (left || right) this.adjust(key, left ? -1 : 1);
      else if (ok && key === 'shake') this.adjust(key, 0);
      else if (back) { audio.ui('back'); this.open(null); }
    } else if (this.panel) {
      if (back || ok) { audio.ui('back'); this.open(null); }
    } else if (up) this.select(this.sel - 1);
    else if (down) this.select(this.sel + 1);
    else if (ok) this.activate();
    return true;
  },
  leaveSplash() {
    if (!menuEl.classList.contains('splash')) return;
    audio.ensure();
    menuEl.classList.remove('splash');
    this.select(0, true);
    this.hints();
  },
};
menu.drawSettings();
function showBest() {
  const b = store.get('best', null);
  document.getElementById('bestRun').innerHTML = b
    ? `<span class="lbl">BEST NIGHT</span>ROUND <b>${b.wave}</b> · <b>${b.kills}</b> SHOOED`
    : '';
}
menuButtons.forEach((b, i) => {
  b.addEventListener('mouseenter', () => { if (!menu.panel || menu.panel !== b.dataset.act) menu.select(i); });
  b.addEventListener('click', () => menu.activate(i));
});
settingRows.forEach((r, i) => {
  r.addEventListener('mouseenter', () => menu.selectRow(i));
  r.addEventListener('click', e => {
    const v = e.target.dataset.v, key = r.dataset.key;
    if (v === undefined) { if (key === 'shake') menu.adjust(key, 0); return; }
    if (key === 'shake') menu.adjust(key, v === '1' ? 1 : -1);
    else menu.adjust(key, +v - settings[key]);
  });
});
menuEl.addEventListener('click', e => {
  if (menuEl.classList.contains('splash')) return menu.leaveSplash();
  // clicking the open scene (not the column or a panel) closes a panel
  if (menu.panel && !e.target.closest('.mpanel, #menuList')) { audio.ui('back'); menu.open(null); }
});

// ===================================================================
// UPDATE
// ===================================================================
const PLAYER_SPEED = 6.2; // base pace — FLEET FOOT scales state.speed; the run cadence follows it gently
const MAX_ALIVE = 30;     // spawning pauses while this many raiders are up
const tmp = new THREE.Vector3();
let groanT = 1;

// --- raccoon melee: walk up, stop at arm's length, rear back and swing. The blow lands
// partway through, and only if you're still in range, so a step back dodges it ---
const Z_REACH = 1.2;      // stops and swings when this close (center to center)
const Z_LET_GO = 1.5;     // ...and only gives chase again once you're this far off
const Z_CLOSE = 0.95;     // never gets nearer than this (no standing inside the garden buddy)
const Z_SPACE = 0.8;      // raiders keep this far apart, so a crowd fans out around you
const Z_SWING = 0.85;     // seconds from wind-up to recovered
const Z_STRIKE = 0.2;     // the moment in the swing the blow lands
const Z_HIT_RANGE = 1.65; // the blow connects if you're still this close
const Z_TRACK = 7;        // rad/s a raccoon turns to keep facing you while it stands and swings
const HURT_IFRAMES = 1.5; // after a hit, the garden buddy can't be hit again for this long (and flickers)

// is there a wall (or a shut door or window) between two points? (samples the line)
function wallBetween(a, b) {
  for (let i = 1; i < 4; i++) {
    const x = a.x + (b.x - a.x) * i / 4, z = a.z + (b.z - a.z) * i / 4;
    for (const w of wallBoxes) if (x >= w.minX && x <= w.maxX && z >= w.minZ && z <= w.maxZ) return true;
    if (shutAt(x, z)) return true;
  }
  return false;
}

// turn toward (dx, dz) at up to `rate` rad/s; returns how far off it's still facing
function faceToward(z, dx, dz, rate, dt) {
  const ud = z.userData, dA = wrapA(Math.atan2(dx, dz) - ud.heading);
  ud.heading += Math.max(-rate * dt, Math.min(rate * dt, dA));
  z.rotation.y = ud.heading;
  return Math.abs(dA) - Math.min(Math.abs(dA), rate * dt);
}

// Ease the heading toward the target instead of snapping, so raiders arc into their
// turns, and slow down while facing well off it: a raccoon that overshoots turns round
// and comes back instead of orbiting.
function walkToward(z, dx, dz, speed, turn, dt) {
  const ud = z.userData, off = faceToward(z, dx, dz, turn, dt);
  const v = speed * Math.max(0.15, Math.cos(Math.min(off, Math.PI / 2)));
  z.position.x += Math.sin(ud.heading) * v * dt;
  z.position.z += Math.cos(ud.heading) * v * dt;
}

function hurtPlayer() {
  if (state.dmgCd > 0 || nap.t > 0) return false;
  if (state.pShield > 0) {
    // BUBBLE: the hit splashes off instead of costing a heart
    state.dmgCd = HURT_IFRAMES;
    splashAt(player.position.x, 0.9, player.position.z, 8, 0.8);
    return false;
  }
  state.hp--;
  state.dmgCd = HURT_IFRAMES;
  damageFlash();
  audio.bump();
  if (state.hp <= 0) outOfHeartsNow();
  return true;
}

function chaseRaider(z, dt) {
  const ud = z.userData;
  const target = raccoonTarget(z);
  if (!target) return;
  const p = target.position;
  const hurtTarget = () => target.id === 'me' ? hurtPlayer() : hurtFriend(target.id);
  const pdx = p.x - z.position.x, pdz = p.z - z.position.z, pd = Math.hypot(pdx, pdz);
  let walking = false;
  if (ud.climb >= 0) {
    climbStep(z, dt);
  } else if (ud.swing >= 0) {
    // committed to the blow: feet planted, tracking its target through the wind-up
    const o = ud.swingAt;
    ud.swing += dt;
    if (ud.swing < Z_STRIKE) faceToward(z, o ? o.x - z.position.x : pdx, o ? o.z - z.position.z : pdz, Z_TRACK, dt);
    if (!ud.struck && ud.swing >= Z_STRIKE) {
      ud.struck = true;
      if (o) hitOpening(o);
      else if (!(pd < Z_HIT_RANGE && !wallBetween(z.position, p) && hurtTarget())) audio.swish(z.position);
    }
    if (ud.swing >= Z_SWING) { ud.swing = -1; ud.swingCd = rnd(0.25, 0.6); }
  } else if (pd < (ud.standing ? Z_LET_GO : Z_REACH) && !wallBetween(z.position, p)) {
    // at arm's length: stand, square up, and swing as soon as it's facing you (no
    // cooldown left over from battering its way in)
    if (!ud.standing) ud.swingCd = 0;
    ud.standing = true;
    const off = faceToward(z, pdx, pdz, Z_TRACK, dt);
    ud.swingCd -= dt;
    if (ud.swingCd <= 0 && off < 0.5) { ud.swing = 0; ud.struck = false; ud.swingAt = null; }
  } else {
    ud.standing = false;
    // steer toward nearest opening if outside, else toward player
    let tx = p.x, tz = p.z;
    if (inside(z.position)) {
      ud.opening = null; ud.stage = 0; // through the wall — re-pick if knocked back out
    } else {
      // Commit to one opening (no per-frame re-pick): walk up via its outer waypoint so
      // it comes at the door or window square-on, then break it and go through
      if (!ud.opening) { ud.opening = nearestOpening(z.position); ud.stage = 0; }
      const o = ud.opening;
      if (ud.stage === 0) {
        tx = o.ox; tz = o.oz;
        if ((o.ox - z.position.x) ** 2 + (o.oz - z.position.z) ** 2 < 1.4) ud.stage = 1;
      }
      if (ud.stage === 1) {
        if (o.kind === 'door' && o.hp <= 0) { tx = o.ix; tz = o.iz; } // broken down: straight through
        else if ((o.x - z.position.x) ** 2 + (o.z - z.position.z) ** 2 > 1.45 ** 2) { tx = o.fx; tz = o.fz; }
        else {
          // at it: batter it in, or take a turn climbing through the broken window
          tx = null;
          const off = faceToward(z, o.x - z.position.x, o.z - z.position.z, Z_TRACK, dt);
          ud.swingCd -= dt;
          if (o.hp > 0) { if (ud.swingCd <= 0 && off < 0.5) { ud.swing = 0; ud.struck = false; ud.swingAt = o; } }
          else if (!o.climber) startClimb(z, o);
        }
      }
    }
    if (tx !== null) {
      const g = routeAround(z, tx, tz);
      // turn harder up close so the last few steps home in on you
      walkToward(z, g.x - z.position.x, g.z - z.position.z, ud.speed, ud.turn * (pd < 4 ? 2.5 : 1), dt);
      walking = true;
    }
  }
  // progress check: a raccoon that's been trying to walk for 2s but has barely moved (jammed
  // in a crowd at a door, say) forgets its plan and makes for the next-nearest way in
  if (walking && (ud.stuckT += dt) > 2) {
    if (Math.hypot(z.position.x - ud.stuckX, z.position.z - ud.stuckZ) < 0.6 && ud.opening && !inside(z.position)) {
      ud.opening = nearestOpening(z.position, ud.opening);
      ud.stage = 0; ud.via = -1;
    }
    ud.stuckT = 0;
  }
  if (!walking || ud.stuckT === 0) { ud.stuckX = z.position.x; ud.stuckZ = z.position.z; if (!walking) ud.stuckT = 0; }
  ud.gait = damp(ud.gait, walking ? 1 : 0, 8, dt);
  animateRaider(z, dt, pd);
}

// keep the crowd from stacking into one body, out of the garden buddy, and out of the props
function separateRaiders() {
  for (let i = 0; i < raiders.length; i++) {
    const a = raiders[i].position;
    for (let k = i + 1; k < raiders.length; k++) {
      const b = raiders[k].position, dx = b.x - a.x, dz = b.z - a.z, d2 = dx * dx + dz * dz;
      if (d2 >= Z_SPACE * Z_SPACE || d2 < 1e-6) continue;
      const d = Math.sqrt(d2), push = (Z_SPACE - d) / 2 / d;
      a.x -= dx * push; a.z -= dz * push;
      b.x += dx * push; b.z += dz * push;
    }
  }
  for (const z of raiders) {
    if (z.userData.climb >= 0) continue; // on the sill: the climb places it
    if (state.running) {
      const dx = z.position.x - player.position.x, dz = z.position.z - player.position.z, d = Math.hypot(dx, dz);
      if (d < Z_CLOSE && d > 1e-6) { z.position.x += dx / d * (Z_CLOSE - d); z.position.z += dz / d * (Z_CLOSE - d); }
    }
    pushOutOfSolids(z.position);
  }
}

function update(dt) {
  const px = player.position.x, pz = player.position.z;
  if (state.running) {
    // --- movement ---
    let mx = padState.move.x, mz = padState.move.z;
    if (keys['KeyW'] || keys['ArrowUp']) mz -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) mz += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
    if (nap.t > 0) { mx = 0; mz = 0; }
    const moving = !!(mx || mz);
    if (moving) {
      const l = Math.hypot(mx, mz);
      const pace = state.speed * (state.pSpeed > 0 ? 1.4 : 1);
      player.position.x += (mx / l) * pace * dt;
      player.position.z += (mz / l) * pace * dt;
    }
    // clamp inside cabin
    const lim = HALF - 0.7;
    player.position.x = Math.max(-lim, Math.min(lim, player.position.x));
    player.position.z = Math.max(-lim, Math.min(lim, player.position.z));
    // --- aim ---
    if (padState.aimOn) {
      player.rotation.y = Math.atan2(padState.aim.x, padState.aim.y);
      aimPoint.set(
        player.position.x + Math.sin(player.rotation.y) * 14,
        0.9,
        player.position.z + Math.cos(player.rotation.y) * 14
      );
    } else if (!touch.isTouch) { // on a tablet, keep facing the last way the right thumb aimed
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(aimPlane, aimPoint)) {
        const a = Math.atan2(aimPoint.x - player.position.x, aimPoint.z - player.position.z);
        player.rotation.y = a;
      }
    }

    // --- watering can ---
    state.fireCd -= dt;
    if ((firing || padState.fire) && !state.choosing && nap.t <= 0) fire();
    if (state.reloading) {
      state.reloadT += dt;
      if (state.reloadT >= state.reloadTime) finishReload();
    }
    for (const key of Object.values(POWER_KEY)) state[key] = Math.max(0, state[key] - dt);
    updateDrops(dt);

    // --- waves ---
    if (isGuest()) {
      // the host's game runs the rounds; this screen follows its snapshots
    } else if (state.choosing) {
      // wave cleared — waiting on the upgrade pick
    } else if (state.intermission > 0) {
      state.intermission -= dt;
      // a friend still answering a question or picking a prize gets a little longer
      if (state.intermission <= 0 && friendBusy()) state.intermission = 0.2;
      else if (state.intermission <= 0) startWave(state.wave + 1);
    } else {
      if (state.toSpawn > 0) {
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0 && raiders.length < MAX_ALIVE) {
          // spawn 1-2 at a time, faster on higher waves
          const burst = 1 + (Math.random() < Math.min(0.6, state.wave * 0.08) ? 1 : 0);
          for (let i = 0; i < burst && state.toSpawn > 0; i++) { spawnRaider(); state.toSpawn--; }
          state.spawnTimer = Math.max(0.35, 1.4 - state.wave * 0.08);
        }
      } else if (raiders.length === 0) {
        // wave cleared
        const healed = state.hp < state.maxHp;
        state.hp = Math.min(state.maxHp, state.hp + 1);
        audio.waveClear();
        if (friendHere()) link.send({ t: 'round', n: state.wave });
        askBetweenRounds(healed);
      }
    }

    state.dmgCd -= dt;

    // --- raccoon groans: more of them up = a busier, closer chorus ---
    if (raiders.length) {
      groanT -= dt;
      if (groanT <= 0) {
        const gz = raiders[(Math.random() * raiders.length) | 0];
        audio.chatter(gz.position);
        gz.userData.groan = 1; // its jaw drops with the groan
        groanT = rnd(0.5, 1.6) * 4 / Math.min(8, 2 + raiders.length * 0.5);
      }
    }
  }
  if (title.active) updateTitle(dt);
  music.wave = state.wave;
  music.alive = raiders.length;
  music.lowHp = state.running && state.hp === 1;

  // --- water beads ---
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    const px = b.position.x, pz = b.position.z;
    b.position.addScaledVector(b.userData.dir, WATER_SPEED * dt);
    b.userData.life -= dt;
    // a soft arc up and back down, a wobble, and the odd drip falling off
    const ud = b.userData;
    ud.t += dt;
    const k = ud.t / WATER_LIFE;
    b.position.y = ud.y0 + Math.sin(Math.min(1, k) * Math.PI) * 0.45 - k * 0.35;
    wobbleWater(b, ud.t);
    ud.drip -= dt;
    if (ud.drip <= 0) {
      ud.drip = 0.06 + Math.random() * 0.06;
      const d = new THREE.Mesh(blobGeo, splashMat);
      d.scale.setScalar(0.05 + Math.random() * 0.04);
      d.position.copy(b.position);
      spawnDebris(d, new THREE.Vector3(ud.dir.x * 2, 0.4, ud.dir.z * 2), { life: 0.35, bounce: 0.04 });
    }
    let hit = false;
    // wall collision: sample the path traveled this frame so fast beads
    // can't tunnel through the thin walls (openings have no wall box; shut ones are checked below)
    const steps = Math.max(1, Math.ceil(Math.hypot(b.position.x - px, b.position.z - pz) / (WALL_T * 0.5)));
    for (let s = 1; s <= steps && !hit; s++) {
      const t = s / steps;
      const sx = px + (b.position.x - px) * t, sz = pz + (b.position.z - pz) * t;
      for (const w of wallBoxes) {
        if (sx >= w.minX && sx <= w.maxX && sz >= w.minZ && sz <= w.maxZ) { hit = true; splashAt(sx, b.position.y, sz, 5, 0.6); break; }
      }
      // a shut door stops the round; glass shatters and lets it through
      const o = !hit && shutAt(sx, sz);
      if (o?.kind === 'door') { hit = true; o.jolt = 0.4; burst(o, 1, woodChip, 0.08, 1.5); audio.knock(o, 0.4); }
      else if (o) breakOpening(o);
    }
    for (let j = raiders.length - 1; j >= 0 && !hit; j--) {
      const z = raiders[j];
      if (b.userData.hits.has(z)) continue; // a stream that passes through already went through this one
      // distance from the raccoon to the path traveled this frame (not just the
      // end point), so beads can't skip past raccoons at low frame rates
      const sx = b.position.x - px, sz = b.position.z - pz;
      const t = Math.max(0, Math.min(1, ((z.position.x - px) * sx + (z.position.z - pz) * sz) / (sx * sx + sz * sz || 1)));
      const dx = z.position.x - (px + sx * t), dz = z.position.z - (pz + sz * t);
      if (dx * dx + dz * dz < 0.55) {
        const big = b.userData.hot ?? state.pDamage > 0;
        hitRaider(z);
        splashAt(z.position.x, 1.0, z.position.z, big ? 12 : 8, big ? 1.25 : 1);
        b.userData.hits.add(z);
        // In a friend's cabin the splash is just for show: the host's game says who goes home.
        if (isGuest()) { audio.splash(z.position); if (b.userData.pierce > 0) b.userData.pierce--; else hit = true; continue; }
        z.userData.hp -= b.userData.dmg ?? state.damage * (state.pDamage > 0 ? 2 : 1);
        // small knockback
        z.position.addScaledVector(b.userData.dir, 0.25);
        if (z.userData.hp <= 0) { audio.cheer(z.position); shooRaider(z, j, b.userData.dir); }
        else audio.splash(z.position);
        if (b.userData.pierce > 0) b.userData.pierce--;
        else hit = true; // ends the loop; a stream that passes through keeps checking the rest
      }
    }
    if (!hit && b.userData.life <= 0) splashAt(b.position.x, 0.06, b.position.z, 4, 0.5); // lands on the grass
    if (hit || b.userData.life <= 0) { scene.remove(b); bullets.splice(i, 1); }
  }

  // --- raiders ---
  for (let j = raiders.length - 1; j >= 0; j--) {
    const z = raiders[j];
    const ud = z.userData;
    // hurt flash recover
    if (ud.hurt > 0) {
      ud.hurt -= dt;
      if (ud.hurt <= 0) for (const m of ud.body) m.material = raiderFur;
    }
    if (state.running && isGuest()) followRaider(z, dt);
    else if (state.running) chaseRaider(z, dt);
    else if (title.active) wanderRaider(z, dt);
  }
  if ((state.running && !isGuest()) || title.active) separateRaiders();
  stepFriend(dt);

  // --- particles ---
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.userData.life -= dt;
    p.userData.v.y -= 16 * dt;
    p.position.addScaledVector(p.userData.v, dt);
    if (p.position.y < 0.05) { p.position.y = 0.05; p.userData.v.set(0, 0, 0); }
    if (p.userData.life <= 0) { scene.remove(p); particles.splice(i, 1); }
  }

  updateFleeing(dt);
  updateOpenings(dt);
  updateWeather(dt);
  updateWorld(dt);

  // --- garden buddy rig, driven by how far the garden buddy actually moved (so pushing into a
  // wall doesn't run in place). Runs on the title and death screens too, so the pose settles ---
  const inv = dt > 0 ? 1 / dt : 0;
  animatePlayer(dt, (player.position.x - px) * inv, (player.position.z - pz) * inv);
  napPose();
  // flicker while the post-hit grace period lasts
  player.visible = !title.active && (!state.running || state.dmgCd <= 0 || Math.floor(state.dmgCd * 12) % 2 === 0);
  updateDebris(dt);

  // damage flash fade
  if (flashT > 0) { flashT -= dt; hud.flash.style.opacity = Math.max(0, flashT) * 0.6; }

  updateCamera(dt);

  updateHUD();
}

// ===================================================================
// THREE-PLAYER CO-OP — the host runs waves, hits, raccoons and doors.
const roomParam = new URLSearchParams(location.search).get('room');
const friend = { role: 'solo', peer: false };
const nap = { t: 0 };
const remotes = new Map();
const ringGeo = new THREE.RingGeometry(0.75, 0.95, 28);
const ringMat = new THREE.MeshBasicMaterial({ color: 0xf0c050, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide });
let sendAt = 0, snapAt = 0;
const friendLast = new THREE.Vector3();

const isGuest = () => friend.role === 'guest';
const friendHere = () => friend.peer;
const anyAwake = () => [...remotes.values()].some(remote => remote.aim && !remote.nap);
const friendBusy = () => !isGuest() && [...remotes.values()].some(remote =>
  remote.busy && performance.now() - remote.busySince < BUSY_MAX * 1000);
function setBusy(on) {
  if (isGuest()) link.send({ t: 'busy', on: !!on }, link.state.host);
}

function raccoonTarget(z) {
  const me = { id: 'me', position: player.position, asleep: nap.t > 0 };
  const others = [...remotes].filter(([, remote]) => remote.aim).map(([id, remote]) => ({
    id, position: remote.body.position, asleep: remote.nap || remote.busy,
  }));
  return nearestAwake(z.position, [me, ...others]);
}

function hurtFriend(id) {
  const remote = remotes.get(id);
  if (!remote || remote.hurtCd > 0 || remote.nap || remote.busy) return false;
  remote.hurtCd = HURT_IFRAMES;
  link.send({ t: 'ouch' }, id);
  audio.bump();
  return true;
}

function outOfHeartsNow() {
  if (!isGuest() && !anyAwake()) { die(); return; }
  nap.t = NAP_TIME;
  firing = false;
  showBanner('NAP TIME', 'your friends keep watch', 2);
  sendMe(true);
}
function endNap() { nap.t = 0; }
function stepNap(dt) {
  if (nap.t <= 0) return;
  if (!isGuest() && !anyAwake()) { nap.t = 0; die(); return; }
  nap.t = Math.max(0, nap.t - dt);
  if (!nap.t) {
    state.hp = 1;
    state.dmgCd = HURT_IFRAMES;
    showToast('Awake! Back to it', '#7aae5a');
    sendMe(true);
  }
}
function napPose() {
  if (nap.t > 0) { buddy.group.rotation.z = 1.35; buddy.group.position.y = 0.35; }
  else buddy.group.position.y = 0;
  for (const remote of remotes.values()) {
    if (!remote.model) continue;
    remote.model.group.rotation.z = remote.nap ? 1.35 : 0;
    remote.model.group.position.y = remote.nap ? 0.35 : 0;
  }
}

// ---- sending
function sendMe(now = false) {
  if (!friendHere()) return;
  if (!now && sendAt < SEND_EVERY) return;
  sendAt = 0;
  link.send({ t: 'me', p: [+player.position.x.toFixed(2), +player.position.z.toFixed(2)], yaw: +player.rotation.y.toFixed(2), nap: nap.t > 0 });
}
function sendSpray(mp, aim, n) {
  if (!friendHere()) return;
  const hot = state.pDamage > 0;
  link.send({ t: 'spray', p: [+mp.x.toFixed(2), +mp.z.toFixed(2)], d: [+aim.x.toFixed(3), +aim.z.toFixed(3)], hot,
    dmg: state.damage * (hot ? 2 : 1), pierce: state.pierce, n });
}
function sendSnap(force = false, to) {
  if (!friendHere() || isGuest() || (!force && snapAt < SNAP_EVERY)) return;
  snapAt = 0;
  link.send(packSnap({
    wave: state.wave, kills: state.kills,
    raccoons: raiders.map(z => ({ id: z.userData.id, x: z.position.x, z: z.position.z, yaw: z.rotation.y, gait: z.userData.gait, wet: z.userData.hurt > 0 })),
    openings: openings.map(o => o.hp),
  }), to);
}

// ---- the friend's water: on the host it really splashes raccoons; on the friend's screen it's for show
function friendSpray(msg) {
  const sp = readSpray(msg);
  if (!sp) return;
  for (let k = 0; k < sp.n; k++) {
    const a = (k - (sp.n - 1) / 2) * 0.13;
    const c = Math.cos(a), s2 = Math.sin(a);
    const dir = new THREE.Vector3(sp.d[0] * c - sp.d[1] * s2, 0, sp.d[0] * s2 + sp.d[1] * c);
    const b = makeTracer(sp.hot);
    b.position.set(sp.p[0], 1.1, sp.p[1]);
    b.lookAt(b.position.clone().add(dir));
    b.userData = { dir, life: WATER_LIFE, pierce: sp.pierce, hits: new Set(), y0: 1.1, t: 0, drip: 0, blob: b.userData.blob, dmg: sp.dmg, hot: sp.hot };
    scene.add(b);
    bullets.push(b);
  }
  audio.spray(sp.hot, sp.n - 1);
}

// ---- the friend's screen: the host's raccoons, from snapshots
const netRaccoons = new Map(); // id -> raccoon group
function applySnap(msg) {
  const snap = readSnap(msg);
  if (!snap || !state.running) return;
  state.wave = snap.wave;
  state.kills = snap.kills;
  const seen = new Set();
  for (const r of snap.raccoons) {
    seen.add(r.id);
    let z = netRaccoons.get(r.id);
    if (!z || !raiders.includes(z)) {
      z = spawnRaider({ x: r.x, z: r.z });
      z.userData.id = r.id;
      netRaccoons.set(r.id, z);
    }
    z.userData.net = r;
    if (r.wet && !(z.userData.hurt > 0)) hitRaider(z);
  }
  for (const [id, z] of netRaccoons) {
    if (seen.has(id)) continue;
    netRaccoons.delete(id);
    const i = raiders.indexOf(z);
    if (i >= 0) { raiders.splice(i, 1); scene.remove(z); }
  }
  snap.openings.forEach((hp, i) => {
    const o = openings[i];
    if (!o || o.hp === hp) return;
    if (hp <= 0 && o.hp > 0) breakOpening(o);
    else { o.hp = hp; if (o.kind !== 'door' && hp < o.maxHp && hp > 0) o.glass.material = glassCracked; }
  });
}
function raccoonHome(id) {
  const z = netRaccoons.get(id);
  if (!z) return;
  netRaccoons.delete(id);
  const i = raiders.indexOf(z);
  if (i >= 0) raiders.splice(i, 1);
  audio.cheer(z.position);
  spawnPetals(z.position);
  raiderFlees(z);
}
function followRaider(z, dt) {
  const r = z.userData.net;
  if (!r) return;
  const k = Math.min(1, dt * 12);
  z.position.x += (r.x - z.position.x) * k;
  z.position.z += (r.z - z.position.z) * k;
  const turn = Math.atan2(Math.sin(r.yaw - z.rotation.y), Math.cos(r.yaw - z.rotation.y));
  z.rotation.y += turn * k;
  z.userData.heading = z.rotation.y;
  z.userData.gait = damp(z.userData.gait, r.gait, 8, dt);
  animateRaider(z, dt, Math.hypot(player.position.x - z.position.x, player.position.z - z.position.z));
}

// ---- each remote buddy has its own pose, model and state
function newRemote(id) {
  const body = new THREE.Group();
  body.visible = false;
  scene.add(body);
  const wateringCan = can.clone(true);
  wateringCan.position.copy(can.position);
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  body.add(wateringCan, ring);
  const remote = { body, nap: false, busy: false, busySince: 0, hurtCd: 0, gait: 0, time: 0 };
  remotes.set(id, remote);
  return remote;
}
function showFriend(remote, kind, gear) {
  if (remote.model) { remote.body.remove(remote.model.group); remote.model.dispose?.(); }
  remote.model = makeBuddy(THREE, buddyKind(kind), { gear });
  remote.model.group.scale.setScalar(BUDDY_SCALE);
  remote.body.add(remote.model.group);
}
function dropFriend(id) {
  const remote = remotes.get(id);
  if (!remote) return;
  scene.remove(remote.body);
  remote.model?.dispose?.();
  remotes.delete(id);
}
function stepFriend(dt) {
  sendAt += dt;
  snapAt += dt;
  for (const remote of remotes.values()) remote.hurtCd = Math.max(0, remote.hurtCd - dt);
  if (!state.running) return;
  stepNap(dt);
  if (!state.running || !friendHere()) return;
  sendMe();
  sendSnap();
  for (const remote of remotes.values()) {
    if (!remote.model || !remote.aim) continue;
    const { body: b, model, aim } = remote;
    const [x, z] = aim.p;
    if (!b.visible) b.position.set(x, 0, z);
    b.visible = true;
    friendLast.copy(b.position);
    const k = Math.min(1, dt * 10);
    b.position.x += (x - b.position.x) * k;
    b.position.z += (z - b.position.z) * k;
    b.rotation.y += Math.atan2(Math.sin(aim.yaw - b.rotation.y), Math.cos(aim.yaw - b.rotation.y)) * k;
    const speed = dt > 0 ? friendLast.distanceTo(b.position) / dt : 0;
    remote.gait = damp(remote.gait, Math.min(1, speed / 5), 8, dt);
    remote.time += dt;
    model.animate?.(dt, remote.gait, remote.time);
  }
}

function joinHostCabin() {
  clearRun();
  resetOpenings();
  netRaccoons.clear();
  setPaused(false);
  startGame(false, true);
  state.toSpawn = 0;
  player.position.set(2.5, 0, link.state.seat === 2 ? -1.5 : 1.5);
}

function fromFriend(msg, peer) {
  const remote = remotes.get(peer.id);
  if (!remote) return;
  if (msg.t === 'hi') {
    showFriend(remote, typeof msg.buddy === 'string' ? msg.buddy : 'fox', typeof msg.gear === 'string' ? msg.gear.slice(0, 160) : '');
  } else if (msg.t === 'me') {
    const p = readSpot(msg.p);
    if (p) remote.aim = { p, yaw: Number.isFinite(msg.yaw) ? msg.yaw : 0 };
    remote.nap = msg.nap === true;
  } else if (msg.t === 'spray' && state.running) {
    friendSpray(msg);
  } else if (msg.t === 'busy' && !isGuest()) {
    remote.busy = msg.on === true;
    if (remote.busy) remote.busySince = performance.now();
  } else if (isGuest() && peer.seat === 0) {
    if (msg.t === 'restart') joinHostCabin();
    else if (msg.t === 'snap') applySnap(msg);
    else if (msg.t === 'home' && Number.isInteger(msg.id)) raccoonHome(msg.id);
    else if (msg.t === 'ouch') hurtPlayer();
    else if (msg.t === 'wave' && Number.isInteger(msg.n)) { state.wave = msg.n; showBanner('ROUND ' + msg.n, 'splash together'); audio.waveStart(msg.n); }
    else if (msg.t === 'round') {
      const healed = state.hp < state.maxHp && nap.t <= 0;
      if (nap.t <= 0) state.hp = Math.min(state.maxHp, state.hp + 1);
      audio.waveClear();
      if (sidecar.ask || sidecar.waiting || state.choosing) return;
      askBetweenRounds(healed);
    } else if (msg.t === 'over') {
      if (Number.isInteger(msg.w)) state.wave = msg.w;
      if (Number.isInteger(msg.k)) state.kills = msg.k;
      die();
    }
  }
}

const $id = id => document.getElementById(id);
const link = makeWorldFriends({
  game: 'cabin',
  update(room) {
    friend.peer = room.others.length > 0;
    paintFriend(room);
  },
  admit({ role }) {
    friend.role = role;
    if (role === 'guest') joinHostCabin();
  },
  arrived({ id }) {
    if (isGuest() && !remotes.size) player.position.set(2.5, 0, link.state.seat === 2 ? -1.5 : 1.5);
    newRemote(id);
    const me = savedLook();
    link.send({ t: 'hi', buddy: buddyKind(me.kind), gear: me.kind ? me.gear : '' }, id);
    sendMe(true);
    if (!isGuest()) {
      // A late join sees the current wave or the result, not a new copy of the cabin.
      if (!state.running) link.send({ t: 'over', w: state.wave, k: state.kills }, id);
      else {
        sendSnap(true, id);
        if (state.choosing || state.intermission > 0) link.send({ t: 'round', n: state.wave }, id);
      }
    }
  },
  departed({ id }) { dropFriend(id); },
  leave({ role }) {
    friend.role = 'solo';
    if (role === 'guest') {
      setPaused(false);
      netRaccoons.clear();
      startGame(false);
      showToast('You are back in your own cabin.', '#e0b84a');
    }
  },
  receive: fromFriend,
});
const paintFriend = mountWorldFriendControls({
  room: link, button: $id('friendBtn'), box: $id('friendBox'), text: $id('friendText'),
  row: $id('friendBox').querySelector('.row'),
});

// ---- joining a friend: while the join card (lib/friend-panel.mjs) is up, the cabin holds still
// and goes quiet, so the only sound is the card's own (it talks to the other device by sound).
const joiningFriend = () => !!document.querySelector('[data-friend-panel]');
let joinHold = false;
function holdForJoin(on) {
  if (on === joinHold) return;
  joinHold = on;
  firing = false;
  for (const k in keys) keys[k] = false;
  try { if (on) audio.ctx?.suspend(); else audio.ctx?.resume(); } catch { /* no sound yet */ }
  // Inside Little Sprouts, the app stops talking too.
  bridge.post('hush', { on });
}

// ===================================================================
// LOOP
// ===================================================================
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const joining = joiningFriend();
  holdForJoin(joining);
  if (!joining) pollPad();
  if (!state.paused && !joining) {
    // A question card freezes a live run; the title scene can keep drifting behind the first one.
    if (sidecar.hold) { if (title.active) { updateTitle(dt); updateCamera(dt); } }
    else update(dt);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

enterTitle(true);
if (embedded) {
  // Inside Little Sprouts the cabin opens straight onto the first question, with no title
  // menu. The host posts it from this learner's profile; `need` is the fallback if the
  // first message raced this script.
  document.body.classList.add('embedded');
  menuEl.classList.add('gone');
  sidecar.waiting = true;
  bridge.need();
  clearTimeout(sidecar.timer);
  sidecar.timer = setTimeout(() => {
    sidecar.timer = 0;
    if (sidecar.ask || sidecar.started) return;
    sidecar.waiting = false;
    sidecar.hold = false;
    sidecar.started = true;
    startGame(true);
  }, 2200);
}
if (roomParam) {
  // opened from a friend's room link: skip the title and go straight to their cabin
  menuEl.classList.add('gone');
  startGame(false);
  link.fromInvite();
}
updateCamera(0);
requestAnimationFrame(loop);
// The guest bridge signals readiness on load; a second ready is harmless and covers a
// host that attached its listener after this module ran.
bridge.ready();
// Test hook for _test.html (?test=1) only; the shipped game doesn't expose its state.
if (new URLSearchParams(location.search).has('test')) window.__cabin = { state, sidecar, raiders, die, friend, nap, bullets, hurtPlayer, player, touch, padState, remotes, link, drops, answerResult, startGame, updateDrops };
