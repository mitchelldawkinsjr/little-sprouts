/**
 * Lunar freethrow — one file you can drop into another app.
 *
 *   import { mountLunar, bodies, rules } from './lunar.js'
 *   const game = mountLunar(document.querySelector('#court'), {
 *     g: 1.62, body: 'moon', aim: true,
 *     learn: true, picker: true, dial: true,
 *     locked: false, motion: 'still', sound: true, reduced: false,
 *     onSwish(info) {}, onBrick(info) {}, onShot(info) {}, onLocked() {}
 *   })
 *   game.unlock()
 *   game.pause()
 *   game.resume()
 *   game.reset()
 *   game.destroy()
 *
 * `motion` is 'still', 'sway' (the hoop drifts), or 'trick' (drift plus a rock).
 * `onSwish` and `onBrick` receive { score, shots, streak }.
 * Pass `stats: { score, shots, streak }` to keep those numbers across a remount.
 * Edit `rules` for feel (ball size, pull, bounce). Edit `bodies` for worlds.
 * A host can pass `bodies` / `locked` and gate shots with unlock().
 */
export const rules = {
  earthG: 9.81,
  gMin: 0.1,
  gMax: 26,
  pxScale: 380,
  ballR: 16,
  maxPull: 160,
  restitution: 0.55,
  air: 0.9994,
  friction: 0.985,
  ballKg: 0.62
};

export const bodies = [
  { id: 'mercury', name: 'Mercury', kind: 'planet', g: 3.7, hue: '#b0b0b0', sky: ['#050810', '#1a1410', '#2a2018'], analogy: 'Like shooting with a light backpack on — still a pull, but the ball hangs longer.', feel: 'Same push jumps about 2½× higher than on Earth.', facts: ['Smallest planet, closest to the Sun.', 'Almost no air. Days are scorching and nights are freezing.', 'The surface is cratered, a bit like a hotter Moon.'] },
  { id: 'venus', name: 'Venus', kind: 'planet', g: 8.87, hue: '#e8c07a', sky: ['#1a0e08', '#3a2010', '#4a2814'], analogy: 'Almost an Earth freethrow. The arc will look familiar.', feel: 'Jumps last only a little longer than at home.', facts: ['Nearly Earth’s size, but hotter than Mercury’s day side.', 'Thick clouds hide the ground.', 'A Venus day is longer than its year.'] },
  { id: 'earth', name: 'Earth', kind: 'planet', g: 9.81, hue: '#4ea8de', sky: ['#071018', '#0c2438', '#123048'], analogy: 'This is the baseline. Every other world is heavier or floatier than a gym on Earth.', feel: 'A normal freethrow — the arc you already know.', facts: ['1 g is about 9.81 m/s².', 'The only world we know with oceans and life.', 'Your body is built for this pull.'] },
  { id: 'moon', name: 'Moon', kind: 'moon', g: 1.62, hue: '#c9cdd6', sky: ['#050810', '#0d1528', '#1a1610'], analogy: 'Trampoline physics: same push, way more float.', feel: 'Jump about 6× higher. Shots hang in the air.', facts: ['About 1/6 of Earth’s gravity.', 'No air to slow the ball.', 'Apollo astronauts hopped because walking felt bouncy.'] },
  { id: 'mars', name: 'Mars', kind: 'planet', g: 3.71, hue: '#c45c3a', sky: ['#100808', '#2a1410', '#3a1c12'], analogy: 'Like playing while slightly buoyant — grounded, but every leap lasts longer.', feel: 'Jumps are about 2½× higher than on Earth.', facts: ['About 38% of Earth’s gravity.', 'Home of the tallest volcano in the solar system.', 'Rusty dust makes it look red.'] },
  { id: 'jupiter', name: 'Jupiter', kind: 'planet', g: 24.79, hue: '#d4a574', sky: ['#0c0804', '#241810', '#3a2818'], analogy: 'Like shooting in a lead suit. The ball gets yanked down hard.', feel: 'Jumps shrink to about 40% of Earth. Arcs look stubby.', facts: ['About 2½× Earth’s gravity.', 'A gas giant — this sim uses cloud-top gravity.', 'The Great Red Spot is a storm wider than Earth.'] },
  { id: 'saturn', name: 'Saturn', kind: 'planet', g: 10.44, hue: '#e6d5a8', sky: ['#0a0a08', '#1c1810', '#2a2418'], analogy: 'A huge world with a soft pull. Only a notch stronger than Earth.', feel: 'Shots drop a little faster than at home.', facts: ['Famous for icy rings.', 'Less dense than water.', 'A day here is about 10.7 hours.'] },
  { id: 'uranus', name: 'Uranus', kind: 'planet', g: 8.69, hue: '#7ec8d8', sky: ['#040c12', '#0c2030', '#143848'], analogy: 'Almost Earth-normal gravity, on a planet tipped on its side.', feel: 'Freethrows look familiar, just a touch floatier.', facts: ['An ice giant of water, ammonia, and methane.', 'Seasons last about 20 years.', 'Methane makes it blue-green.'] },
  { id: 'neptune', name: 'Neptune', kind: 'planet', g: 11.15, hue: '#4169e1', sky: ['#040814', '#0c1830', '#142848'], analogy: 'A bit heavier than Earth — shots fall sooner than you expect.', feel: 'Jumps are about 12% shorter. Add a little more arc.', facts: ['The farthest planet from the Sun.', 'The fastest winds in the solar system.', 'Found by math before anyone saw it.'] },
  { id: 'pluto', name: 'Pluto', kind: 'dwarf', g: 0.62, hue: '#c4a882', sky: ['#06050a', '#121018', '#1c1820'], analogy: 'Ultra-float. The ball barely wants to come down.', feel: 'Jump about 16× higher than on Earth.', facts: ['A dwarf planet with a heart-shaped ice plain.', 'About 1/16 of Earth’s gravity.', 'Its big moon Charon makes them orbit a shared point.'] }
];

const CSS = `
.lj{height:100%;min-height:260px;display:flex;flex-direction:column;position:relative;color:#e7f6ff;font-family:inherit;user-select:none;touch-action:none}
.lj-stage{position:relative;flex:1;min-height:220px;border-radius:18px;overflow:hidden}
.lj canvas{width:100%;height:100%;display:block;cursor:grab;touch-action:none}
.lj canvas.aim{cursor:grabbing}
.lj-hint{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);margin:0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#c4b59ab3;pointer-events:none}
.lj-toast{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);margin:0;font:800 42px/1 Outfit,Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#ffb14a;text-shadow:0 3px 0 #000a;opacity:0;pointer-events:none;transition:opacity .2s;z-index:3}
.lj-toast.show{opacity:1}
.lj-hud{position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:4;display:flex;gap:8px;margin:0;padding:8px 10px;border-radius:16px;background:#080c16ee;border:2px solid #ffb14a88;box-shadow:0 8px 20px #0008;pointer-events:none}
.lj-hud span{display:flex;flex-direction:column;align-items:center;min-width:72px;gap:2px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#f4e7c3}
.lj-hud b{font:800 32px/1 Outfit,Inter,sans-serif;font-variant-numeric:tabular-nums;color:#fff}
.lj-hud span.hot{color:#ffb14a}
.lj-hud span.hot b{color:#ffb14a}
.lj-bar,.lj-panel{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.lj-panel{position:absolute;top:8px;right:8px;width:min(168px,42%);padding:8px;border-radius:14px;background:#080c16c7;border:1px solid #7ed7ef44}
.lj-learn{position:absolute;top:8px;left:8px;width:min(240px,46%);padding:8px 10px;border-radius:14px;background:#080c16c7;border:1px solid #7ed7ef33;font-size:12px;line-height:1.35}
.lj-learn h2{margin:0;font-size:16px}
.lj-learn p{margin:4px 0 0}
.lj-analogy{border-left:2px solid #ffb14a;padding-left:6px}
.lj button,.lj-check{font:inherit;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#9ee7f6;background:transparent;border:1px solid #7ed7ef40;border-radius:8px;padding:4px 6px;cursor:pointer}
.lj button.on{color:#ffb14a;border-color:#ffb14a88}
.lj-check{display:flex;gap:6px;align-items:center;text-transform:none;letter-spacing:0;font-size:11px;border:0;padding:0}
.lj input[type=range]{width:100%}
.lj-presets{display:grid;grid-template-columns:1fr 1fr;gap:4px;width:100%;max-height:132px;overflow:auto}
`;

let cssReady = false;
const kindLabel = { planet: 'planet', moon: 'natural satellite', dwarf: 'dwarf planet' };

function ensureCss() {
  if (cssReady || document.getElementById('lj-css')) { cssReady = true; return; }
  const tag = document.createElement('style');
  tag.id = 'lj-css';
  tag.textContent = CSS;
  document.head.appendChild(tag);
  cssReady = true;
}

function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgba(h, a) {
  const c = hex(h);
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}
function mix(a, b, t) {
  const A = hex(a), B = hex(b);
  const ch = k => Math.round(A[k] + (B[k] - A[k]) * t);
  return `rgb(${ch('r')},${ch('g')},${ch('b')})`;
}

export function mountLunar(root, opt = {}) {
  ensureCss();
  const list = opt.bodies || bodies;
  const R = { ...rules, ...opt.rules };
  const show = {
    learn: opt.learn !== false,
    picker: opt.picker !== false,
    dial: opt.dial !== false,
    hud: opt.hud !== false,
    reset: opt.reset !== false,
    aimToggle: opt.aimToggle !== false,
    hint: opt.hint !== false,
    keys: opt.keys !== false
  };
  const hook = (name, detail) => { try { opt[name]?.(detail); } catch { /* host owns errors */ } };

  root.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'lj';
  wrap.innerHTML = `
    <div class="lj-stage">
      ${show.hud ? '<div class="lj-hud" aria-live="polite"><span>Score <b data-score>0</b></span><span>Shots <b data-shots>0</b></span><span data-streak-chip>Streak <b data-streak>0</b></span></div>' : ''}
      <canvas aria-label="Freethrow court"></canvas>
      ${show.hint ? '<p class="lj-hint" data-hint>Pull back · release to shoot</p>' : ''}
      <p class="lj-toast" data-toast></p>
      ${show.learn ? '<aside class="lj-learn" data-learn><p data-kind></p><h2 data-name></h2><p><b data-g></b> m/s² · <span data-vs></span></p><p class="lj-analogy" data-analogy></p><p data-feel></p><p data-fact></p><button type="button" data-more>More</button></aside>' : ''}
      ${(show.dial || show.picker || show.aimToggle) ? `<aside class="lj-panel">
        ${show.dial ? '<label>Gravity <b data-readout></b><input data-dial type="range" min="0" max="100"></label>' : ''}
        ${show.aimToggle ? '<label class="lj-check"><input data-aim type="checkbox"> Show aim arc</label>' : ''}
        ${show.picker ? '<div class="lj-presets" data-presets></div>' : ''}
      </aside>` : ''}
    </div>
    ${show.reset ? '<div class="lj-bar"><button type="button" data-reset>Reset shot</button></div>' : ''}`;
  root.append(wrap);

  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const q = sel => wrap.querySelector(sel);
  const stage = q('.lj-stage');
  let factAt = 0;
  let dead = false;
  let raf = 0;
  let toastTimer = 0;
  let resetTimer = 0;
  const state = {
    w: 1, h: 1, dpr: 1,
    score: Math.max(0, opt.stats?.score | 0),
    shots: Math.max(0, opt.stats?.shots | 0),
    streak: Math.max(0, opt.stats?.streak | 0),
    g: opt.g || 1.62, bodyId: opt.body || 'moon', sky: ['#050810', '#0d1528', '#1a1610'],
    aiming: false, flying: false, resetArmed: false, scored: false, passed: false,
    locked: !!opt.locked, aim: opt.aim !== false,
    pull: { x: 0, y: 0 }, pointerId: null, stars: [], craters: [], trail: [], net: [], netPhase: 0,
    ball: { x: 0, y: 0, vx: 0, vy: 0, r: R.ballR, spin: 0, homeX: 0, homeY: 0 },
    hoop: { x: 0, y: 0, rimW: 78, backboard: 90 },
    hoopBaseX: 0, motion: opt.motion === 'trick' || opt.motion === 'sway' ? opt.motion : 'still',
    reduced: !!opt.reduced, clock: 0, hold: false, audio: null,
    rock: { x: 0, y: 0, r: 16, on: false }
  };
  const shotInfo = () => ({ score: state.score, shots: state.shots, streak: state.streak });
  const tone = (freq, dur) => {
    if (opt.sound === false) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      state.audio = state.audio || new Ctx();
      const osc = state.audio.createOscillator();
      const gain = state.audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.045, state.audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, state.audio.currentTime + dur);
      osc.connect(gain);
      gain.connect(state.audio.destination);
      osc.start();
      osc.stop(state.audio.currentTime + dur);
    } catch { /* the shot still counts */ }
  };

  const find = id => list.find(b => b.id === id) || null;
  const nearest = g => list.reduce((best, b) => Math.abs(b.g - g) < Math.abs((best?.g ?? 99) - g) ? b : best, null);
  const sliderOf = g => ((g - R.gMin) / (R.gMax - R.gMin)) * 100;
  const gOfSlider = v => R.gMin + (Number(v) / 100) * (R.gMax - R.gMin);
  const gPx = () => (state.g / R.earthG) * R.pxScale;

  function shotPower() {
    const span = Math.max(240, state.hoop.x - state.ball.homeX);
    const rise = Math.max(80, state.ball.homeY - state.hoop.y);
    const frames = 58;
    const g = gPx() / 60;
    const vy0 = -rise / frames - 0.5 * g * frames;
    const vx0 = (span / frames) * 1.02;
    return (Math.hypot(vx0, Math.abs(vy0)) / R.maxPull) * 1.15;
  }

  function paintStats() {
    const set = (sel, val) => { const el = q(sel); if (el) el.textContent = val; };
    set('[data-score]', state.score);
    set('[data-shots]', state.shots);
    set('[data-streak]', state.streak);
    q('[data-streak-chip]')?.classList.toggle('hot', state.streak >= 3);
  }

  function paintLearn(body, g) {
    if (!show.learn) return;
    const ratio = g / R.earthG;
    const facts = body?.facts?.length ? body.facts : ['Lower gravity floats. Higher gravity drops fast.'];
    factAt = (factAt % facts.length + facts.length) % facts.length;
    q('[data-kind]').textContent = kindLabel[body?.kind] || 'custom gravity';
    q('[data-name]').textContent = body?.name || 'Custom';
    q('[data-g]').textContent = g < 10 ? g.toFixed(2) : g.toFixed(1);
    q('[data-vs]').textContent = `${Math.round(ratio * 100)}% of Earth`;
    q('[data-analogy]').textContent = body?.analogy || 'Drag the dial. Watch how the arc changes.';
    q('[data-feel]').textContent = body?.feel || `A ${R.ballKg} kg ball feels like ${(R.ballKg * ratio).toFixed(2)} kg.`;
    q('[data-fact]').textContent = facts[factAt];
    const more = q('[data-more]');
    more.hidden = facts.length < 2;
    more.textContent = `More ${factAt + 1}/${facts.length}`;
  }

  function matchedBody(id) {
    const body = id ? find(id) : nearest(state.g);
    if (!body || (!id && Math.abs(body.g - state.g) > 0.15)) return null;
    return body;
  }

  function setGravity(g, bodyId) {
    state.g = Math.min(R.gMax, Math.max(R.gMin, g));
    const body = matchedBody(bodyId);
    state.bodyId = body?.id || 'custom';
    if (body?.sky) state.sky = body.sky;
    const dial = q('[data-dial]');
    const readout = q('[data-readout]');
    if (dial) dial.value = String(Math.round(sliderOf(state.g)));
    if (readout) readout.textContent = state.g < 10 ? state.g.toFixed(2) : state.g.toFixed(1);
    paintLearn(body, state.g);
    wrap.querySelectorAll('[data-body]').forEach(btn => btn.classList.toggle('on', btn.dataset.body === state.bodyId));
    factAt = bodyId ? 0 : factAt;
    if (bodyId) paintLearn(body, state.g);
  }

  function toast(text) {
    const el = q('[data-toast]');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 900);
  }

  function layout() {
    const floor = state.h * 0.82;
    state.ball.homeX = state.w * 0.32;
    state.ball.homeY = floor - R.ballR - 2;
    state.hoopBaseX = state.w * 0.68;
    state.hoop.y = state.h * 0.46;
    state.hoop.rimW = Math.max(72, Math.min(130, state.w * 0.11));
    state.hoop.backboard = Math.max(56, state.h * 0.13);
    if (!state.flying && !state.aiming) {
      state.ball.x = state.ball.homeX;
      state.ball.y = state.ball.homeY;
    }
    placeCourt(false);
  }

  function placeNet() {
    const strands = 8;
    const segs = 5;
    state.net = [];
    for (let i = 0; i < strands; i++) {
      const t = i / (strands - 1);
      const x0 = state.hoop.x - state.hoop.rimW / 2 + t * state.hoop.rimW;
      const strand = [];
      for (let s = 0; s <= segs; s++) strand.push({ ox: x0, oy: state.hoop.y + (s / segs) * 42 });
      state.net.push(strand);
    }
  }

  function placeCourt(move) {
    const speed = state.reduced ? 0.4 : 1;
    if (move && state.motion !== 'still' && !state.scored) state.clock += speed / 60;
    const amp = state.motion === 'trick' ? 0.08 : state.motion === 'sway' ? 0.05 : 0;
    state.hoop.x = state.hoopBaseX + Math.sin(state.clock * 1.2) * state.w * amp;
    state.rock.on = state.motion === 'trick';
    if (state.rock.on) {
      state.rock.r = Math.max(14, state.w * 0.028);
      state.rock.x = state.w * 0.48;
      state.rock.y = state.h * 0.36 + Math.sin(state.clock * 1.7) * (state.reduced ? 6 : 18);
    }
    placeNet();
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    state.dpr = Math.min(devicePixelRatio || 1, 2);
    state.w = Math.max(1, rect.width);
    state.h = Math.max(1, rect.height);
    canvas.width = Math.floor(state.w * state.dpr);
    canvas.height = Math.floor(state.h * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    layout();
    state.stars = Array.from({ length: 48 }, () => ({ x: Math.random() * state.w, y: Math.random() * state.h * 0.7, r: Math.random() * 1.3 + 0.3, a: Math.random() * 0.6 + 0.2, tw: Math.random() * 6 }));
    state.craters = Array.from({ length: 9 }, () => ({ x: Math.random() * state.w, y: state.h * 0.84 + Math.random() * state.h * 0.12, rx: 16 + Math.random() * 36, ry: 5 + Math.random() * 10 }));
  }

  function resetBall() {
    clearTimeout(resetTimer);
    resetTimer = 0;
    state.resetArmed = false;
    state.flying = false;
    state.aiming = false;
    state.pointerId = null;
    state.scored = false;
    state.passed = false;
    state.pull.x = state.pull.y = 0;
    state.trail = [];
    state.ball.vx = state.ball.vy = state.ball.spin = 0;
    state.ball.x = state.ball.homeX;
    state.ball.y = state.ball.homeY;
    canvas.classList.remove('aim');
    const hint = q('[data-hint]');
    if (hint) hint.textContent = state.locked ? (opt.lockedHint || 'Answer first') : 'Pull back · release to shoot';
  }

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function onDown(e) {
    if (dead || state.flying || state.resetArmed) return;
    if (state.locked) { hook('onLocked'); return; }
    const p = pos(e);
    const dx = p.x - state.ball.homeX;
    const dy = p.y - state.ball.homeY;
    if (dx * dx + dy * dy > 160 ** 2) return;
    e.preventDefault();
    state.aiming = true;
    state.pointerId = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    canvas.classList.add('aim');
    pull(p);
  }
  function pull(p) {
    let dx = state.ball.homeX - p.x;
    let dy = state.ball.homeY - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const c = Math.min(len, R.maxPull);
    state.pull.x = (dx / len) * c;
    state.pull.y = (dy / len) * c;
    state.ball.x = state.ball.homeX - state.pull.x;
    state.ball.y = Math.min(state.h * 0.82 - R.ballR, state.ball.homeY - state.pull.y);
  }
  function onMove(e) {
    if (!state.aiming || e.pointerId !== state.pointerId) return;
    pull(pos(e));
  }
  function onUp(e) {
    if (!state.aiming || e.pointerId !== state.pointerId) return;
    const power = Math.hypot(state.pull.x, state.pull.y);
    state.aiming = false;
    canvas.classList.remove('aim');
    state.pointerId = null;
    if (power < 14) { resetBall(); return; }
    const pwr = shotPower();
    state.flying = true;
    state.scored = false;
    state.passed = false;
    state.shots += 1;
    paintStats();
    state.ball.x = state.ball.homeX;
    state.ball.y = state.ball.homeY;
    state.ball.vx = state.pull.x * pwr;
    state.ball.vy = state.pull.y * pwr;
    state.ball.spin = state.ball.vx * 0.08;
    state.pull.x = state.pull.y = 0;
    hook('onShot', shotInfo());
  }

  function hit(cx, cy, r) {
    const b = state.ball;
    const dx = b.x - cx;
    const dy = b.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const min = b.r + r;
    if (dist >= min) return;
    const nx = dx / dist;
    const ny = dy / dist;
    b.x += nx * (min - dist);
    b.y += ny * (min - dist);
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      b.vx -= (1 + R.restitution) * vn * nx;
      b.vy -= (1 + R.restitution) * vn * ny;
    }
  }

  function step(dt) {
    if (!state.flying) return;
    const b = state.ball;
    const g = gPx();
    b.vy += g * dt;
    b.vx *= R.air;
    b.vy *= R.air;
    b.x += b.vx * dt * 60;
    b.y += b.vy * dt * 60;
    b.spin += b.vx * 0.4 * dt;
    state.trail.push({ x: b.x, y: b.y, life: 1 });
    if (state.trail.length > 16) state.trail.shift();
    state.trail.forEach(t => { t.life *= 0.92; });
    const floorY = state.h * 0.82 - b.r;
    if (b.y > floorY) {
      b.y = floorY;
      if (b.vy > 0.8) { b.vy *= -R.restitution; b.vx *= R.friction; }
      else if (b.vy > 0) { b.vy = 0; b.vx *= 0.9; }
    }
    const boardX = state.hoop.x + state.hoop.rimW / 2 + 10;
    const top = state.hoop.y - state.hoop.backboard * 0.55;
    const bot = state.hoop.y + state.hoop.backboard * 0.2;
    if (b.x + b.r > boardX && b.x < boardX + 8 && b.y > top && b.y < bot && b.vx > 0) {
      b.x = boardX - b.r;
      b.vx *= -0.55;
    }
    const rimY = state.hoop.y;
    const left = state.hoop.x - state.hoop.rimW / 2;
    const right = state.hoop.x + state.hoop.rimW / 2;
    hit(left, rimY, 3);
    hit(right, rimY, 3);
    if (state.rock.on) hit(state.rock.x, state.rock.y, state.rock.r);
    const inside = b.x > left + 2 && b.x < right - 2;
    if (!state.scored && inside && b.vy > -0.5 && b.y > rimY - 20 && b.y < rimY + 36) {
      if (b.y >= rimY - 6) state.passed = true;
      if (state.passed && b.y > rimY + 8) {
        state.scored = true;
        state.score += 2;
        state.streak += 1;
        paintStats();
        toast(state.streak >= 3 ? 'On fire' : 'Swish');
        tone(state.streak >= 3 ? 880 : 660, 0.12);
        state.netPhase = 1;
        b.x = state.hoop.x;
        b.vx *= 0.2;
        b.vy = Math.max(b.vy * 0.35, 1.5);
        hook('onSwish', shotInfo());
        return;
      }
    }
    const slow = Math.hypot(b.vx, b.vy) < 0.35 && Math.abs(b.y - floorY) < 1.5;
    const out = b.x < -80 || b.x > state.w + 80 || b.y > state.h + 80;
    if ((slow || out) && !state.resetArmed) {
      state.resetArmed = true;
      state.flying = false;
      const missed = !state.scored;
      if (missed) state.streak = 0;
      paintStats();
      if (missed) tone(180, 0.1);
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        if (dead) return;
        resetBall();
        if (missed) hook('onBrick', shotInfo());
      }, out ? 220 : 500);
    }
    if (state.netPhase > 0) state.netPhase *= 0.94;
  }

  function shade(cx, cy, r, lit, mid, dark) {
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.08, cx, cy, r);
    g.addColorStop(0, lit);
    g.addColorStop(0.5, mid);
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function clip(cx, cy, r, draw) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    draw();
    ctx.restore();
  }
  function craters(cx, cy, r, n, color) {
    let seed = (cx * 13 + cy * 7 + r) | 0;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.28;
      const d = rnd() * r * 0.7;
      const cr = r * (0.05 + rnd() * 0.1);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.9, cr, cr * 0.8, a, 0, 6.28);
      ctx.fill();
    }
  }
  function rings(cx, cy, r, half) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.15);
    [1.85, 1.62, 1.4].forEach((s, i) => {
      ctx.strokeStyle = ['#d2be8c88', '#f0dcaa99', '#b4a06e88'][i];
      ctx.lineWidth = Math.max(2, r * (0.1 - i * 0.02));
      ctx.beginPath();
      ctx.ellipse(0, 0, r * s, r * s * 0.22, 0.32, half === 'back' ? Math.PI : 0, half === 'back' ? Math.PI * 2 : Math.PI);
      ctx.stroke();
    });
    ctx.restore();
  }
  function world(body, cx, cy, r) {
    const id = body?.id;
    const hue = body?.hue || '#7ed7ef';
    const glow = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.2);
    glow.addColorStop(0, rgba(hue, 0.22));
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.2, 0, 6.28);
    ctx.fill();
    if (id === 'saturn') rings(cx, cy, r, 'back');
    if (id === 'earth') {
      shade(cx, cy, r, '#8ec8ff', '#2f6fb5', '#0b2a4a');
      clip(cx, cy, r, () => {
        ctx.fillStyle = '#3d8f4a';
        [[-0.2, -0.1, 0.32, 0.22], [0.22, 0.08, 0.24, 0.18], [0, 0.32, 0.36, 0.16]].forEach(([x, y, w, h]) => {
          ctx.beginPath();
          ctx.ellipse(cx + x * r, cy + y * r, w * r, h * r, 0.4, 0, 6.28);
          ctx.fill();
        });
        ctx.fillStyle = '#ffffffaa';
        ctx.beginPath();
        ctx.ellipse(cx, cy - r * 0.78, r * 0.3, r * 0.12, 0, 0, 6.28);
        ctx.fill();
      });
    } else if (id === 'mars') {
      shade(cx, cy, r, '#e8906a', '#c04528', '#5a1808');
      clip(cx, cy, r, () => {
        ctx.fillStyle = '#f5f8ffee';
        ctx.beginPath();
        ctx.ellipse(cx, cy - r * 0.78, r * 0.26, r * 0.12, 0, 0, 6.28);
        ctx.fill();
      });
    } else if (id === 'jupiter') {
      shade(cx, cy, r, '#f0d2a8', '#c9975a', '#6a4020');
      clip(cx, cy, r, () => {
        ['#e8c896', '#b87840', '#f2dcb0', '#a86838', '#e6c890', '#c08048'].forEach((color, i) => {
          ctx.fillStyle = color;
          ctx.fillRect(cx - r, cy + (-0.55 + i * 0.18) * r, r * 2, r * 0.16);
        });
        ctx.fillStyle = '#c45c3a';
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.28, cy + r * 0.15, r * 0.2, r * 0.12, 0.1, 0, 6.28);
        ctx.fill();
      });
    } else if (id === 'saturn') {
      shade(cx, cy, r, '#fff2c8', '#e0c88a', '#8a7040');
      clip(cx, cy, r, () => {
        ctx.fillStyle = '#c8aa6466';
        [-0.3, 0, 0.3].forEach(y => ctx.fillRect(cx - r, cy + y * r, r * 2, r * 0.08));
      });
    } else if (id === 'venus') {
      shade(cx, cy, r, '#fff0c8', '#e0b86a', '#8a6030');
      clip(cx, cy, r, () => {
        ctx.strokeStyle = '#fff0c866';
        ctx.lineWidth = Math.max(2, r * 0.05);
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.ellipse(cx, cy + i * r * 0.22, r * 0.9, r * 0.16, -0.2, 0, 6.28);
          ctx.stroke();
        }
      });
    } else if (id === 'uranus' || id === 'neptune') {
      shade(cx, cy, r, id === 'uranus' ? '#d8f4f8' : '#8ab4ff', id === 'uranus' ? '#7ec8d8' : '#2f4ec8', id === 'uranus' ? '#2a6070' : '#0a1a50');
      if (id === 'neptune') clip(cx, cy, r, () => {
        ctx.fillStyle = '#14205088';
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.2, cy + r * 0.1, r * 0.16, r * 0.1, 0.2, 0, 6.28);
        ctx.fill();
      });
    } else if (id === 'pluto') {
      shade(cx, cy, r, '#e8d8c0', '#b89878', '#5a4838');
      clip(cx, cy, r, () => {
        ctx.fillStyle = '#f5ebdcdd';
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.1, cy, r * 0.2, r * 0.18, -0.4, 0, 6.28);
        ctx.ellipse(cx + r * 0.12, cy, r * 0.2, r * 0.18, 0.4, 0, 6.28);
        ctx.fill();
      });
    } else if (id === 'moon' || id === 'mercury') {
      shade(cx, cy, r, id === 'moon' ? '#f2f3f5' : '#d8d2c8', id === 'moon' ? '#b8bcc4' : '#9a958c', '#4a4640');
      clip(cx, cy, r, () => craters(cx, cy, r, id === 'moon' ? 16 : 12, '#3c383266'));
    } else {
      shade(cx, cy, r, '#fff', hue, '#222');
    }
    if (id === 'saturn') rings(cx, cy, r, 'front');
  }

  function draw() {
    const [c0, c1, c2] = state.sky;
    const bg = ctx.createLinearGradient(0, 0, 0, state.h);
    bg.addColorStop(0, c0);
    bg.addColorStop(0.6, c1);
    bg.addColorStop(1, c2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, state.w, state.h);
    const t = performance.now() / 1000;
    for (const s of state.stars) {
      ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(t + s.tw));
      ctx.fillStyle = '#dce9ff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const body = find(state.bodyId) || { id: state.bodyId, hue: '#7ed7ef' };
    const size = { jupiter: 0.11, saturn: 0.095, neptune: 0.08, uranus: 0.08, earth: 0.072, venus: 0.07, mars: 0.062, moon: 0.058, mercury: 0.052, pluto: 0.045 }[body.id] || 0.06;
    world(body, state.w * 0.78, state.h * 0.16, Math.min(state.w * size, body.id === 'jupiter' ? 92 : 74));
    const floor = state.h * 0.82;
    ctx.fillStyle = '#3a342c';
    ctx.beginPath();
    ctx.moveTo(0, floor);
    ctx.quadraticCurveTo(state.w * 0.4, floor - 16, state.w, floor - 4);
    ctx.lineTo(state.w, state.h);
    ctx.lineTo(0, state.h);
    ctx.fill();
    ctx.fillStyle = '#4a4338';
    for (const c of state.craters) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, 6.28);
      ctx.fill();
    }
    const h = state.hoop;
    ctx.strokeStyle = '#8a93a8';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(h.x + h.rimW / 2 + 26, floor);
    ctx.lineTo(h.x + h.rimW / 2 + 26, h.y - 8);
    ctx.lineTo(h.x + h.rimW / 2 + 8, h.y);
    ctx.stroke();
    ctx.fillStyle = '#f0f6ffe0';
    ctx.fillRect(h.x + h.rimW / 2 + 10, h.y - h.backboard * 0.55, 8, h.backboard);
    ctx.strokeStyle = '#e6ecff88';
    ctx.lineWidth = 1.2;
    for (const strand of state.net) {
      ctx.beginPath();
      strand.forEach((p, i) => {
        const sway = Math.sin(t * 4 + i) * 2 * state.netPhase;
        const x = p.ox + sway;
        if (i) ctx.lineTo(x, p.oy);
        else ctx.moveTo(x, p.oy);
      });
      ctx.stroke();
    }
    ctx.strokeStyle = '#ff6b2d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(h.x - h.rimW / 2, h.y);
    ctx.lineTo(h.x + h.rimW / 2, h.y);
    ctx.stroke();
    if (state.rock.on) {
      const rock = ctx.createRadialGradient(state.rock.x - 4, state.rock.y - 5, 2, state.rock.x, state.rock.y, state.rock.r);
      rock.addColorStop(0, '#d7c4b0');
      rock.addColorStop(1, '#6b5344');
      ctx.fillStyle = rock;
      ctx.beginPath();
      ctx.arc(state.rock.x, state.rock.y, state.rock.r, 0, 6.28);
      ctx.fill();
    }
    if (state.aiming) {
      ctx.strokeStyle = '#7ed7ef77';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(state.ball.homeX, state.ball.homeY);
      ctx.lineTo(state.ball.x, state.ball.y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (state.aim) {
        let x = state.ball.homeX;
        let y = state.ball.homeY;
        let vx = state.pull.x * shotPower();
        let vy = state.pull.y * shotPower();
        const g = gPx();
        ctx.fillStyle = '#ffb14aaa';
        for (let i = 0; i < 36; i++) {
          vy += g / 60;
          vx *= R.air;
          vy *= R.air;
          x += vx;
          y += vy;
          if (y > floor) break;
          ctx.globalAlpha = Math.max(0.15, 1 - i / 36);
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, 6.28);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
    const b = state.ball;
    for (const dot of state.trail) {
      ctx.globalAlpha = dot.life * 0.35;
      ctx.fillStyle = '#e85d04';
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, b.r * 0.45 * dot.life, 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.spin * 0.05);
    const ball = ctx.createRadialGradient(-5, -6, 3, 0, 0, b.r);
    ball.addColorStop(0, '#ff9f43');
    ball.addColorStop(0.6, '#e85d04');
    ball.addColorStop(1, '#9a3412');
    ctx.fillStyle = ball;
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, 6.28);
    ctx.fill();
    ctx.strokeStyle = '#28100688';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, b.r * 0.72, -0.8, 0.8);
    ctx.stroke();
    ctx.restore();
  }

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    if (dead) return;
    const frozen = state.hold || !!document.querySelector('dialog[open]');
    if (!frozen) {
      acc += Math.min(0.05, (now - last) / 1000);
      last = now;
      while (acc >= 1 / 60) {
        placeCourt(true);
        step(1 / 60);
        acc -= 1 / 60;
      }
    } else last = now;
    draw();
    raf = requestAnimationFrame(frame);
  }

  const presets = q('[data-presets]');
  if (presets) {
    presets.innerHTML = list.map(b => `<button type="button" data-body="${b.id}">${b.name}</button>`).join('');
    presets.onclick = e => {
      const id = e.target?.dataset?.body;
      const body = id && find(id);
      if (body) setGravity(body.g, body.id);
    };
  }
  q('[data-dial]')?.addEventListener('input', e => setGravity(gOfSlider(e.target.value)));
  q('[data-aim]') && (q('[data-aim]').checked = state.aim);
  q('[data-aim]')?.addEventListener('change', e => { state.aim = e.target.checked; });
  q('[data-reset]')?.addEventListener('click', () => { resetBall(); q('[data-toast]')?.classList.remove('show'); });
  q('[data-more]')?.addEventListener('click', () => { factAt += 1; paintLearn(matchedBody(state.bodyId), state.g); });
  const onKey = e => {
    if (!show.keys || e.key !== 'r' && e.key !== 'R') return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    e.preventDefault();
    resetBall();
  };
  if (show.keys) window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  const ro = new ResizeObserver(() => { if (!dead) resize(); });
  ro.observe(stage);

  const boot = find(opt.body) || nearest(state.g) || list[3] || list[0];
  resize();
  setGravity(opt.g || boot?.g || 1.62, opt.body || boot?.id);
  paintStats();
  if (state.locked) {
    const hint = q('[data-hint]');
    if (hint) hint.textContent = opt.lockedHint || 'Answer first';
  }
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      if (dead) return;
      dead = true;
      cancelAnimationFrame(raf);
      clearTimeout(resetTimer);
      clearTimeout(toastTimer);
      ro.disconnect();
      window.removeEventListener('keydown', onKey);
      try { state.audio?.close(); } catch { /* already closed */ }
      root.replaceChildren();
    },
    lock() { state.locked = true; resetBall(); },
    unlock() {
      state.locked = false;
      const hint = q('[data-hint]');
      if (hint) hint.textContent = 'Pull back · release to shoot';
    },
    pause() { state.hold = true; },
    resume() { state.hold = false; },
    reset: resetBall,
    setAim(on) { state.aim = !!on; const box = q('[data-aim]'); if (box) box.checked = state.aim; },
    setGravity(g, bodyId) { setGravity(g, bodyId); },
    get locked() { return state.locked; }
  };
}
