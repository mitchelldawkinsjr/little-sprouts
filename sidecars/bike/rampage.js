"use strict";
(() => {
// Dirt Bike Rampage — the dirt ride engine, with Little Sprouts hooks.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 1280, H = 720;
const GROUND_BASE = H * 0.60;
const TOUCH = matchMedia('(pointer:coarse)').matches || ('ontouchstart' in window);
const embedded = window.parent !== window;
document.getElementById('loading').style.display = 'none';

function resize() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  canvas.style.width = (W * s) + 'px';
  canvas.style.height = (H * s) + 'px';
}
addEventListener('resize', resize); resize();

class Sound {
  constructor() { this.ctx = null; this.enabled = true; this.engineOn = false; }
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.enabled = false; return; }
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.85;
    this.master.connect(this.ctx.destination);
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate * 1.2, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = b;
  }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  startEngine() {
    if (!this.ctx || this.engineOn) return;
    const c = this.ctx;
    this.eo1 = c.createOscillator(); this.eo1.type = 'sawtooth';
    this.eo2 = c.createOscillator(); this.eo2.type = 'square'; this.eo2.detune.value = -10;
    this.eFilter = c.createBiquadFilter(); this.eFilter.type = 'lowpass'; this.eFilter.frequency.value = 700;
    this.eGain = c.createGain(); this.eGain.gain.value = 0;
    this.eo1.connect(this.eFilter); this.eo2.connect(this.eFilter);
    this.eFilter.connect(this.eGain); this.eGain.connect(this.master);
    this.eo1.frequency.value = 60; this.eo2.frequency.value = 60;
    this.eo1.start(); this.eo2.start(); this.engineOn = true;
  }
  stopEngine() {
    if (!this.engineOn) return;
    try { this.eGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); } catch (e) {}
    this.engineOn = false;
  }
  updateEngine(throttle, speed) {
    if (!this.engineOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    const rpm = 52 + speed * 5.0 + throttle * 40;
    this.eo1.frequency.setTargetAtTime(rpm, t, 0.04);
    this.eo2.frequency.setTargetAtTime(rpm * 1.01, t, 0.04);
    const g = this.enabled ? (0.045 + throttle * 0.06 + Math.min(speed, 18) * 0.0022) : 0;
    this.eGain.gain.setTargetAtTime(g, t, 0.07);
    this.eFilter.frequency.setTargetAtTime(450 + throttle * 1300 + speed * 45, t, 0.05);
  }
  tone(freq, dur, type, vol, when = 0) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    const t = c.currentTime + when;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.03);
  }
  noise(dur, filt, vol) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = 'lowpass'; f.frequency.value = filt;
    const t = c.currentTime;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur);
  }
  thud(intensity) { this.noise(0.16, 320, Math.min(0.5, intensity * 0.05)); }
  crash() { this.noise(0.5, 1400, 0.5); this.tone(70, 0.45, 'sawtooth', 0.28); this.tone(160, 0.3, 'square', 0.12, 0.02); }
  flip(n) { for (let i = 0; i < 3; i++) this.tone(440 + i * 220 + n * 60, 0.12, 'square', 0.12, i * 0.07); }
  finish(stars) {
    const seq = [523, 659, 784, 1046];
    for (let i = 0; i <= stars; i++) this.tone(seq[Math.min(i, 3)], 0.22, 'triangle', 0.18, i * 0.13);
  }
  click() { this.tone(660, 0.06, 'square', 0.08); }
  toggle() {
    this.enabled = !this.enabled;
    if (this.master) this.master.gain.setTargetAtTime(this.enabled ? 0.85 : 0, this.ctx.currentTime, 0.03);
    return this.enabled;
  }
}
const audio = new Sound();

const Store = {
  get(k, d) { try { const v = localStorage.getItem('dbr_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('dbr_' + k, JSON.stringify(v)); } catch (e) {} },
};
let bestTimes = Store.get('best', {});
let bestStars = Store.get('stars', {});
let unlocked = Store.get('unlocked', 1);

const LEVELS = [
  { name: 'SUNNY TRAILS',  finish: 3600, cp: 1200,
    terrain: { a1: 58, f1: 0.0016, a2: 28, f2: 0.0042, a3: 11, f3: 0.011, a4: 4, f4: 0.03, s: 0.3 },
    pal: { skyTop:'#5fa8e8', skyBot:'#bfe3f7', sun:'#fff6c8', far:'#9fc6e6', mid:'#7fb56e', dirt:'#7a4f2a', dirtDk:'#5b3a1e', grass:'#4f9d3f', grassDk:'#357027', dust:'#caa46a' } },
  { name: 'DESERT DUNES',  finish: 4800, cp: 1200,
    terrain: { a1: 84, f1: 0.0015, a2: 40, f2: 0.0040, a3: 15, f3: 0.012, a4: 6, f4: 0.032, s: 1.7 },
    pal: { skyTop:'#f2b46b', skyBot:'#ffe6b0', sun:'#fff2cf', far:'#e6b98a', mid:'#d6a25e', dirt:'#c8924a', dirtDk:'#a4742f', grass:'#caa14e', grassDk:'#9c7a32', dust:'#e8cf95' } },
  { name: 'SUNSET RIDGE',  finish: 5600, cp: 1100,
    terrain: { a1: 112, f1: 0.0015, a2: 52, f2: 0.0044, a3: 18, f3: 0.013, a4: 7, f4: 0.034, s: 2.4 },
    pal: { skyTop:'#3a2a6e', skyBot:'#f2825a', sun:'#ffd07a', far:'#6e4f86', mid:'#8a5570', dirt:'#6e4036', dirtDk:'#4e2c28', grass:'#a05a52', grassDk:'#74403c', dust:'#caa0a0' } },
  { name: 'NIGHT RUN',     finish: 6600, cp: 1100,
    terrain: { a1: 132, f1: 0.0016, a2: 60, f2: 0.0048, a3: 22, f3: 0.014, a4: 9, f4: 0.036, s: 3.1 },
    pal: { skyTop:'#0a1030', skyBot:'#26365e', sun:'#cfe0ff', far:'#1b2748', mid:'#243a52', dirt:'#2b3a44', dirtDk:'#1c2730', grass:'#2f6f8a', grassDk:'#1e4a5c', dust:'#7fa8c0' } },
];

function terrainY(x, L) {
  if (x < 0) x = 0;
  const p = L.terrain;
  const ramp = Math.min(1, x / 1100);
  let y = GROUND_BASE;
  y += Math.sin(x * p.f1 + p.s) * p.a1 * ramp;
  y += Math.sin(x * p.f2 + p.s * 1.7) * p.a2 * ramp;
  y += Math.sin(x * p.f3 + p.s * 0.5) * p.a3 * ramp;
  y += Math.sin(x * p.f4) * p.a4 * ramp;
  const fz = L.finish;
  if (x > fz - 260) {
    const flat = GROUND_BASE + 40;
    const t = Math.min(1, (x - (fz - 260)) / 200);
    y = y * (1 - t) + flat * t;
  }
  return y;
}
function terrainSlope(x, L) { return (terrainY(x + 1.5, L) - terrainY(x - 1.5, L)) / 3; }

const particles = [];
function spawn(x, y, vx, vy, life, size, color, grav = 0.12, fade = true) {
  particles.push({ x, y, vx, vy, life, max: life, size, color, grav, fade });
}
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vx *= 0.98; p.vy += p.grav; p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
function drawParticles(cam) {
  for (const p of particles) {
    const a = p.fade ? Math.max(0, p.life / p.max) : 1;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    const sx = p.x - cam.x, sy = p.y - cam.y;
    ctx.beginPath(); ctx.arc(sx, sy, p.size, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

const cam = { x: 0, y: 0, shake: 0 };
function addShake(v) { cam.shake = Math.min(28, cam.shake + v); }

const GRAV = 0.34, SUB = 4, WHEEL_R = 16, WHEEL_BASE = 50, WHEEL_OFF_Y = 14;
const SPRING = 0.22, DAMP = 0.28, ENGINE = 0.48, TOP = 21, FRICTION = 0.78, AIR_CTRL = 0.02, MAX_AV = 0.06;

let bike, level, levelIdx, prevGround, peakFall, airTime, flipAccum, frameAngStart;
let lastCheckpoint, totalFlips, comboScore, elapsed, crashFreeze, finished, finishStars;
let planted = true, airScale = 0, learnerLevel = 1, learnerReduced = false;
let rideTime = 0, askAfter = 9, sproutsPaused = false, boostUntil = 0;
let onAsk = function () {};
let rewardScale = { boost: 1, slow: 1 };

function rot(ox, oy, a) { const c = Math.cos(a), s = Math.sin(a); return { x: ox * c - oy * s, y: ox * s + oy * c }; }

function spawnBikeAt(x) {
  bike = { x, y: terrainY(x, level) - 64, vx: 0, vy: 0, ang: 0, av: 0, wheelSpin: 0 };
  prevGround = false; peakFall = 0; airTime = 0; flipAccum = 0;
}

function startLevel(idx) {
  levelIdx = idx; level = LEVELS[idx];
  lastCheckpoint = 150;
  spawnBikeAt(150);
  totalFlips = 0; comboScore = 0; elapsed = 0; crashFreeze = 0;
  finished = false; finishStars = 0;
  particles.length = 0;
  cam.x = bike.x - W * 0.34; cam.y = bike.y - H * 0.52; cam.shake = 0;
  audio.startEngine();
  state = 'play';
}

function clearRideKeys() {
  Object.keys(keys).forEach(code => { keys[code] = false; });
  Object.keys(input._tc).forEach(key => { input._tc[key] = false; });
}

function physicsStep(scale) {
  const b = bike;
  let onGround = false;
  b.vy += GRAV * scale;

  for (const side of [-1, 1]) {
    const off = rot(side * WHEEL_BASE / 2, WHEEL_OFF_Y, b.ang);
    const wx = b.x + off.x, wy = b.y + off.y;
    const gy = terrainY(wx, level);
    const pen = (wy + WHEEL_R) - gy;
    if (pen > 0) {
      onGround = true;
      const slope = terrainSlope(wx, level);
      const nlen = Math.hypot(slope, 1);
      const nx = slope / nlen, ny = -1 / nlen;
      const tx = 1 / nlen, ty = slope / nlen;
      const wvx = b.vx - b.av * off.y, wvy = b.vy + b.av * off.x;
      const vn = wvx * nx + wvy * ny;
      let fn = pen * SPRING - vn * DAMP; if (fn < 0) fn = 0;
      b.vx += nx * fn; b.vy += ny * fn;
      b.av += (off.x * (ny * fn) - off.y * (nx * fn)) * 0.008;

      const fwdSpeed = b.vx * tx + b.vy * ty;
      const torque = ENGINE * Math.max(0, 1 - Math.max(0, fwdSpeed) / TOP);
      let drive = 0;
      if (input.gas()) drive += torque;
      if (input.brake()) drive -= ENGINE * 1.6;
      b.vx += tx * drive * scale; b.vy += ty * drive * scale;

      const vt = b.vx * tx + b.vy * ty;
      const slideX = b.vx - vt * tx, slideY = b.vy - vt * ty;
      b.vx -= slideX * (1 - FRICTION) * scale; b.vy -= slideY * (1 - FRICTION) * scale;
    }
  }

  if (onGround) {
    let drag = (input.brake() ? 0.08 : input.gas() ? 0.006 : 0.03) * scale;
    if (b.vx > TOP) drag += 0.045 * scale;
    if (b.vx > 0) b.vx = Math.max(0, b.vx - drag);
    else if (b.vx < 0) b.vx = Math.min(0, b.vx + drag);
  }

  if (!onGround) {
    if (!planted && airScale > 0) {
      if (input.back()) b.av -= AIR_CTRL * airScale * scale;
      if (input.fwd()) b.av += AIR_CTRL * airScale * scale;
    } else {
      const want = Math.atan(terrainSlope(b.x, level));
      b.av += (want - b.ang) * 0.05 * scale;
    }
  } else if (planted) {
    const want = Math.atan(terrainSlope(b.x, level));
    b.ang += (want - b.ang) * (1 - Math.pow(0.4, scale));
    b.av *= Math.pow(0.2, scale);
  } else {
    b.av *= Math.pow(0.72, scale);
  }
  if (b.av > MAX_AV) b.av = MAX_AV;
  if (b.av < -MAX_AV) b.av = -MAX_AV;

  b.x += b.vx * scale;
  b.y += b.vy * scale;
  b.ang += b.av * scale;
  if (onGround && !planted) {
    const want = Math.atan(terrainSlope(b.x, level));
    let lean = 0;
    if (input.back() && b.vx > 0.35) lean -= 0.95;
    if (input.fwd()) lean += 0.55;
    b.ang += ((want + lean) - b.ang) * (1 - Math.pow(0.45, scale));
    if (lean) b.av *= 0.2;
  }
  b.wheelSpin += b.vx * 0.15 * scale;

  if (!planted) {
    const head = rot(0, -36, b.ang);
    if (b.y + head.y > terrainY(b.x + head.x, level) + 4) return { onGround, crash: true };
  }
  return { onGround, crash: false };
}

function doCrash() {
  crashFreeze = 60;
  audio.crash(); audio.stopEngine();
  addShake(22);
  const b = bike;
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * 7, sp = 2 + Math.random() * 6;
    spawn(b.x, b.y - 10, Math.cos(a) * sp, -Math.random() * 7 - 1,
      40 + Math.random() * 30, 2 + Math.random() * 4,
      Math.random() < 0.5 ? '#c23b3b' : level.pal.dust, 0.22);
  }
}

function updatePlay(dt) {
  if (sproutsPaused) {
    updateParticles();
    audio.updateEngine(0, 0);
    return;
  }
  if (crashFreeze > 0) {
    crashFreeze--;
    updateParticles();
    if (crashFreeze === 0) {
      spawnBikeAt(lastCheckpoint);
      audio.startEngine();
    }
    return;
  }

  elapsed += dt;
  frameAngStart = bike.ang;
  let grounded = false, crashed = false;
  for (let i = 0; i < SUB; i++) {
    const r = physicsStep(1 / SUB);
    if (r.onGround) grounded = true;
    if (r.crash) { crashed = true; break; }
  }
  if (crashed) { doCrash(); return; }

  const nowMs = performance.now();
  if (nowMs < boostUntil && bike.vx < TOP * 1.45) bike.vx += 0.22;

  if (!grounded) {
    airTime++;
    peakFall = Math.max(peakFall, bike.vy);
    flipAccum += bike.ang - frameAngStart;
  }
  const justLanded = grounded && !prevGround;
  if (justLanded) {
    if (peakFall > 6) {
      const inten = peakFall;
      audio.thud(inten); addShake(Math.min(16, inten * 0.7));
      for (let i = 0; i < 10; i++)
        spawn(bike.x, bike.y + 18, (Math.random() - 0.5) * 4, -Math.random() * 3,
          24 + Math.random() * 16, 2 + Math.random() * 3, level.pal.dust, 0.18);
    }
    if (!planted) {
      const want = Math.atan(terrainSlope(bike.x, level));
      const off = Math.atan2(Math.sin(bike.ang - want), Math.cos(bike.ang - want));
      if (Math.abs(off) < 1.05) {
        bike.ang += (want - bike.ang) * 0.45;
        bike.av *= 0.25;
      }
    }
    if (airTime > 8 && !planted) {
      const n = Math.floor(Math.abs(flipAccum) / (Math.PI * 2));
      if (n > 0) { totalFlips += n; comboScore += n * 250; audio.flip(n); flashFlip = { n, t: 90 }; }
    }
    airTime = 0; flipAccum = 0; peakFall = 0;
  }
  prevGround = grounded;

  if (grounded && input.gas() && Math.abs(bike.vx) > 0.5) {
    const off = rot(-WHEEL_BASE / 2, WHEEL_OFF_Y + WHEEL_R, bike.ang);
    for (let i = 0; i < 2; i++)
      spawn(bike.x + off.x, bike.y + off.y, -bike.vx * 0.25 + (Math.random() - 0.5) * 2,
        -Math.random() * 3 - 1, 18 + Math.random() * 12, 2 + Math.random() * 2.5, level.pal.dust, 0.16);
  }
  if (Math.random() < 0.4) {
    const off = rot(-WHEEL_BASE / 2 - 6, -2, bike.ang);
    spawn(bike.x + off.x, bike.y + off.y, -bike.vx * 0.05 - 0.4, -0.5 - Math.random(),
      26, 2 + Math.random() * 2, 'rgba(120,120,120,0.5)', -0.02);
  }

  updateParticles();

  if (bike.x >= level.finish && !finished) {
    if (embedded) {
      startLevel(levelIdx);
      return;
    }
    finished = true;
    const g = level.finish / 300, s = level.finish / 230;
    finishStars = elapsed <= g ? 3 : elapsed <= s ? 2 : 1;
    if (bestTimes[levelIdx] == null || elapsed < bestTimes[levelIdx]) { bestTimes[levelIdx] = elapsed; Store.set('best', bestTimes); }
    if ((bestStars[levelIdx] || 0) < finishStars) { bestStars[levelIdx] = finishStars; Store.set('stars', bestStars); }
    if (levelIdx + 1 < LEVELS.length && unlocked < levelIdx + 2) { unlocked = levelIdx + 2; Store.set('unlocked', unlocked); }
    audio.finish(finishStars); audio.stopEngine();
    state = 'complete';
    return;
  }

  const cpReached = Math.floor(bike.x / level.cp) * level.cp;
  if (cpReached > lastCheckpoint && cpReached < level.finish - 100) lastCheckpoint = cpReached;

  if (embedded && rideTime >= askAfter) {
    onAsk();
    if (sproutsPaused) return;
  }

  const spd = Math.hypot(bike.vx, bike.vy);
  if (spd > 0.8) rideTime += dt;
  audio.updateEngine(input.gas() ? 1 : 0, spd);

  cam.x = bike.x - W * 0.34;
  const ty = bike.y - H * 0.52;
  cam.y += (ty - cam.y) * 0.10;
  if (cam.shake > 0) cam.shake *= 0.86;
}

let flashFlip = null;

function hex2rgb(h){ const n=parseInt(h.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function shade(hex,amt){ let [r,g,b]=hex2rgb(hex); const f=amt<0?0:255,t=Math.abs(amt); r=r+(f-r)*t; g=g+(f-g)*t; b=b+(f-b)*t; return `rgb(${r|0},${g|0},${b|0})`; }
function blend(a,b,t){ const A=hex2rgb(a),B=hex2rgb(b); return `rgb(${A[0]+(B[0]-A[0])*t|0},${A[1]+(B[1]-A[1])*t|0},${A[2]+(B[2]-A[2])*t|0})`; }
function hash(n){ const s=Math.sin(n*127.1)*43758.5453; return s-Math.floor(s); }
function cloud(x,y,r){ ctx.beginPath(); ctx.ellipse(x,y,r,r*0.5,0,0,7); ctx.ellipse(x+r*0.6,y+6,r*0.7,r*0.42,0,0,7); ctx.ellipse(x-r*0.55,y+8,r*0.6,r*0.4,0,0,7); ctx.fill(); }

function drawHillBand(par, baseOff, amp, color, freq, phase) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, H);
  const ox = cam.x * par, oy = cam.y * 0.12;
  for (let sx = 0; sx <= W; sx += 14) {
    const wx = sx + ox;
    const y = GROUND_BASE - baseOff - oy + Math.sin(wx * freq + phase) * amp * 0.6 + Math.sin(wx * freq * 0.4) * amp * 0.4;
    ctx.lineTo(sx, y);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
}

function drawBackground(pal) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal.skyTop); g.addColorStop(0.7, pal.skyBot); g.addColorStop(1, blend(pal.skyBot, pal.mid, 0.4));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const sunX = W - 180, sunY = 130;
  const rg = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 240);
  rg.addColorStop(0, pal.sun); rg.addColorStop(0.35, 'rgba(255,250,230,0.22)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = pal.sun; ctx.beginPath(); ctx.arc(sunX, sunY, 44, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  const co = cam.x * 0.05;
  for (let i = 0; i < 5; i++) { const cx = ((i * 430 - co) % 1700 + 1700) % 1700 - 200; cloud(cx, 70 + (i * 53 % 130), 56 + (i % 3) * 24); }
  drawHillBand(0.10, 180, 70, blend(pal.far, pal.skyBot, 0.5), 0.0008, 0.2);
  drawHillBand(0.22, 145, 95, pal.far, 0.0012, 0.6);
  drawHillBand(0.42, 88, 135, pal.mid, 0.0019, 1.3);
}

function drawTerrain(pal) {
  const step = 5, pts = [];
  for (let sx = -10; sx <= W + 10; sx += step) pts.push([sx, terrainY(sx + cam.x, level) - cam.y]);
  ctx.beginPath(); ctx.moveTo(pts[0][0], H);
  for (const p of pts) ctx.lineTo(p[0], p[1]);
  ctx.lineTo(pts[pts.length - 1][0], H); ctx.closePath();
  const dg = ctx.createLinearGradient(0, GROUND_BASE - cam.y - 120, 0, H);
  dg.addColorStop(0, pal.dirt); dg.addColorStop(0.5, pal.dirtDk); dg.addColorStop(1, shade(pal.dirtDk, -0.4));
  ctx.fillStyle = dg; ctx.fill();
  const lx = 0.7, ly = -0.72;
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1][0], ay = pts[i - 1][1], bx = pts[i][0], by = pts[i][1];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    const nx = dy / len, ny = -dx / len;
    const lit = nx * lx + ny * ly;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(bx, by + 14); ctx.lineTo(ax, ay + 14); ctx.closePath();
    ctx.fillStyle = lit > 0 ? `rgba(255,244,214,${lit * 0.32})` : `rgba(0,0,0,${-lit * 0.30})`;
    ctx.fill();
  }
  ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.lineWidth = 10; ctx.strokeStyle = pal.grass; ctx.stroke();
  ctx.lineWidth = 3.5; ctx.strokeStyle = pal.grassDk; ctx.stroke();
  const start = Math.floor((cam.x - 20) / 26) * 26;
  for (let wx = start; wx < cam.x + W + 20; wx += 26) {
    const h = hash(wx * 0.1);
    const gx = wx - cam.x, gy = terrainY(wx, level) - cam.y + 6 + h * 46;
    ctx.globalAlpha = 0.10 + h * 0.18; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(gx, gy, 1 + h * 2.6, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCheckpoint(x) {
  const sx = x - cam.x, gy = terrainY(x, level) - cam.y;
  if (sx < -40 || sx > W + 40) return;
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(sx, gy); ctx.lineTo(sx, gy - 60); ctx.stroke();
  const passed = bike && bike.x >= x;
  ctx.fillStyle = passed ? '#46c24a' : '#c9c44a';
  ctx.beginPath(); ctx.moveTo(sx, gy - 60); ctx.lineTo(sx + 26, gy - 52); ctx.lineTo(sx, gy - 44); ctx.closePath(); ctx.fill();
}

function drawFinish() {
  const x = level.finish, sx = x - cam.x, gy = terrainY(x, level) - cam.y;
  if (sx < -80 || sx > W + 120) return;
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(sx - 4, gy - 150, 6, 150);
  ctx.fillRect(sx + 70, gy - 150, 6, 150);
  const cols = 8, rows = 3, bw = 74 / cols, bh = 36 / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    ctx.fillStyle = (r + c) % 2 ? '#111' : '#fff';
    ctx.fillRect(sx - 2 + c * bw, gy - 150 + r * bh, bw + 0.5, bh + 0.5);
  }
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 16px Trebuchet MS'; ctx.textAlign = 'center';
  ctx.fillText('FINISH', sx + 36, gy - 100); ctx.textAlign = 'left';
}

function eyeScale() {
  const t = performance.now() % 4600;
  if (t < 4200) return 1;
  const u = (t - 4200) / 400;
  return u < 0.5 ? Math.max(0.15, 1 - u * 2) : Math.max(0.15, (u - 0.5) * 2);
}
function limb(x1, y1, x2, y2, w, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x1, y1, w * 0.42, 0, 7);
  ctx.arc(x2, y2, w * 0.42, 0, 7);
  ctx.fill();
}
function drawRider() {
  const air = !prevGround && !planted;
  const back = !air && !planted && input.back();
  const fwd = !air && !planted && input.fwd();
  const breath = air ? 0 : Math.sin(performance.now() / 320) * 1.1;
  const crouch = input.gas() && !air ? 1.6 : 0;
  let hip = { x: -7, y: -1 + crouch };
  let shoulder = { x: -1, y: -15 + crouch - breath * 0.35 };
  let head = { x: 3, y: -29 + crouch - breath };
  let hand = { x: 15, y: -18 };
  let knee = { x: -2, y: 7 };
  let boot = { x: -12, y: 13 };
  if (back) {
    hip = { x: -12, y: -5 };
    shoulder = { x: -8, y: -18 - breath * 0.2 };
    head = { x: -7, y: -33 - breath };
    hand = { x: 6, y: -14 };
    knee = { x: -16, y: 1 };
    boot = { x: -8, y: 11 };
  } else if (fwd) {
    hip = { x: -3, y: 1 };
    shoulder = { x: 7, y: -13 };
    head = { x: 11, y: -26 - breath };
    hand = { x: 18, y: -20 };
    knee = { x: 1, y: 8 };
    boot = { x: -8, y: 12 };
  } else if (air) {
    hip = { x: -6, y: -7 };
    shoulder = { x: -1, y: -18 };
    head = { x: 1, y: -33 };
    hand = { x: 12, y: -30 };
    knee = { x: 4, y: -1 };
    boot = { x: 10, y: 7 };
  }
  const suit = '#1f3d6e';
  const suitLite = '#3c6cb8';
  limb(shoulder.x - 2, shoulder.y + 1, hand.x - 2, hand.y + 1, 5, suit);
  limb(hip.x, hip.y, knee.x, knee.y, 6, suit);
  limb(knee.x, knee.y, boot.x, boot.y, 5.5, suit);
  ctx.fillStyle = '#161616';
  ctx.beginPath();
  ctx.ellipse(boot.x, boot.y, 5, 3.2, 0.4, 0, 7);
  ctx.fill();
  ctx.fillStyle = suit;
  ctx.beginPath();
  ctx.ellipse((hip.x + shoulder.x) / 2, (hip.y + shoulder.y) / 2, 8, 10, 0.35, 0, 7);
  ctx.fill();
  ctx.fillStyle = suitLite;
  ctx.beginPath();
  ctx.ellipse(shoulder.x - 2, shoulder.y + 4, 3.2, 5, 0.2, 0, 7);
  ctx.fill();
  limb(shoulder.x + 2, shoulder.y, hand.x, hand.y, 5, suit);
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(hand.x, hand.y, 3.2, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(head.x, head.y, 11, 0, 7);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.beginPath();
  ctx.ellipse(head.x - 3, head.y - 4, 4, 2.4, -0.6, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#243044';
  ctx.beginPath();
  ctx.ellipse(head.x + 3, head.y + 1, 6.5, 4.6, -0.15, 0, 7);
  ctx.fill();
  const eyes = eyeScale();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(head.x + 1.2, head.y + 0.6, 1.5, 2.1 * eyes, 0, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(head.x + 4.6, head.y + 0.4, 1.5, 2.1 * eyes, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(head.x + 1.5, head.y + 0.8, 0.7, 0, 7);
  ctx.arc(head.x + 4.9, head.y + 0.6, 0.7, 0, 7);
  ctx.fill();
}
function drawBike() {
  const b = bike, sx = b.x - cam.x, sy = b.y - cam.y;
  const gy = terrainY(b.x, level) - cam.y;
  ctx.globalAlpha = 0.28; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(sx, gy - 2, 36, 8, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(b.ang);
  const rearX = -WHEEL_BASE / 2, frontX = WHEEL_BASE / 2, wy = WHEEL_OFF_Y;
  const spd = Math.hypot(b.vx, b.vy);
  if (spd > 1.2) { ctx.globalAlpha = Math.min(0.4, (spd - 1.2) * 0.15); ctx.fillStyle = '#000';
    for (const x of [rearX, frontX]) { ctx.beginPath(); ctx.arc(x, wy, WHEEL_R + 1.5, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
  for (const x of [rearX, frontX]) {
    ctx.beginPath(); ctx.arc(x, wy, WHEEL_R, 0, 7); ctx.fillStyle = '#161616'; ctx.fill();
    ctx.save(); ctx.translate(x, wy); ctx.rotate(b.wheelSpin);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    for (let s = 0; s < 12; s++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(WHEEL_R - 3, 0); ctx.lineTo(WHEEL_R + 1.5, 0); ctx.stroke(); }
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, WHEEL_R - 4, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#6a7078'; ctx.lineWidth = 1.5;
    for (let s = 0; s < 5; s++) { ctx.rotate(Math.PI * 2 / 5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(WHEEL_R - 5, 0); ctx.stroke(); }
    ctx.fillStyle = '#cdd2d8'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill();
    ctx.restore();
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#cfd3d8'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(rearX, wy); ctx.lineTo(-6, -6); ctx.stroke();
  ctx.strokeStyle = '#aab0b8'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(10, -12); ctx.lineTo(frontX, wy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -9); ctx.lineTo(frontX - 5, wy); ctx.stroke();
  ctx.strokeStyle = '#e2a23b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(rearX + 6, wy - 2); ctx.stroke();
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.ellipse(frontX, wy - WHEEL_R - 3, 16, 5, -0.25, 0, Math.PI); ctx.fill();
  ctx.strokeStyle = '#888d94'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(rearX + 4, 4); ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.ellipse(-16, -9, 11, 5, -0.15, 0, 7); ctx.fill();
  const grd = ctx.createLinearGradient(-18, -16, 18, 4);
  grd.addColorStop(0, '#ff6a55'); grd.addColorStop(1, '#c41f1f');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(-20, -4);
  ctx.quadraticCurveTo(-18, -16, -4, -15);
  ctx.quadraticCurveTo(8, -16, 16, -8);
  ctx.quadraticCurveTo(22, -2, 18, 3);
  ctx.quadraticCurveTo(4, 8, -14, 5);
  ctx.quadraticCurveTo(-24, 3, -20, -4);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath(); ctx.ellipse(-2, -12, 8, 3, -0.2, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(12, -5, 7, 8, 0.1, 0, 7); ctx.fill();
  ctx.fillStyle = '#111'; ctx.font = 'bold 10px Trebuchet MS'; ctx.textAlign = 'center'; ctx.fillText('7', 12, -1); ctx.textAlign = 'left';
  ctx.strokeStyle = '#cdd2d8'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(10, -12); ctx.quadraticCurveTo(16, -18, 20, -16); ctx.stroke();
  drawRider();
  ctx.restore();
}

function drawSpeedLines() {
  const spd = Math.hypot(bike.vx, bike.vy);
  if (spd < 8) return;
  ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(0.18, (spd - 9) * 0.02) + ')';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const y = (i * 137 + (performance.now() * 0.5 % H)) % H;
    ctx.beginPath(); ctx.moveTo(W, y); ctx.lineTo(W - 60 - spd * 3, y); ctx.stroke();
  }
}

function fmtTime(s) { const m = Math.floor(s / 60), ss = (s % 60); return m + ':' + ss.toFixed(2).padStart(5, '0'); }
function drawStars(x, y, n, size) {
  for (let i = 0; i < 3; i++) {
    ctx.save(); ctx.translate(x + i * (size * 2.4), y);
    ctx.fillStyle = i < n ? '#ffd34d' : 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + k * (Math.PI * 2 / 5);
      ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
      const a2 = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a2) * size * 0.45, Math.sin(a2) * size * 0.45);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
}
function panel(x, y, w, h, r) {
  ctx.fillStyle = 'rgba(15,18,26,0.78)';
  roundRect(x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5;
  roundRect(x, y, w, h, r); ctx.stroke();
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function btn(b, hover) {
  ctx.fillStyle = hover ? b.hc || '#ffd34d' : b.c || 'rgba(255,255,255,0.14)';
  roundRect(b.x, b.y, b.w, b.h, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; roundRect(b.x, b.y, b.w, b.h, 10); ctx.stroke();
  ctx.fillStyle = hover ? '#10131a' : '#fff';
  ctx.font = (b.fs || 22) + 'px Trebuchet MS'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(b.t, b.x + b.w / 2, b.y + b.h / 2 + 1);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
function drawHUD() {
  panel(14, 14, 250, 96, 12);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Trebuchet MS';
  ctx.fillText(level.name, 28, 38);
  ctx.font = '14px Trebuchet MS'; ctx.fillStyle = '#cfd6e0';
  const distM = Math.max(0, Math.floor(bike.x / 12));
  const finM = Math.floor(level.finish / 12);
  const spd = Math.floor(Math.hypot(bike.vx, bike.vy) * 3);
  ctx.fillText('Time  ' + fmtTime(elapsed), 28, 60);
  ctx.fillText('Dist  ' + distM + ' / ' + finM + ' m', 28, 80);
  ctx.fillText('Speed ' + spd + '   Flips ' + totalFlips, 28, 100);
  panel(W / 2 - 200, 16, 400, 16, 8);
  const prog = Math.min(1, bike.x / level.finish);
  ctx.fillStyle = '#ffd34d'; roundRect(W / 2 - 198, 18, 396 * prog, 12, 6); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '11px Trebuchet MS'; ctx.textAlign = 'center';
  ctx.fillText('FINISH', W / 2 + 188, 29); ctx.textAlign = 'left';
  drawTopButtons();
  if (flashFlip && flashFlip.t > 0) {
    flashFlip.t--;
    ctx.globalAlpha = Math.min(1, flashFlip.t / 30);
    ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 44px Trebuchet MS'; ctx.textAlign = 'center';
    const label = flashFlip.n > 1 ? flashFlip.n + 'x FLIP! +' + flashFlip.n * 250 : 'FLIP! +250';
    ctx.fillText(label, W / 2, 150 - (90 - flashFlip.t) * 0.4);
    ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  }
}
const topBtns = {
  pause: { x: W - 110, y: 16, w: 44, h: 40, t: 'II', fs: 18 },
  mute:  { x: W - 60, y: 16, w: 44, h: 40, t: 'Snd', fs: 14 },
};
function drawTopButtons() {
  topBtns.mute.t = audio.enabled ? 'Snd' : 'Off';
  btn(topBtns.pause, hover === 'pause');
  btn(topBtns.mute, hover === 'mute');
}
const tc = {
  gas:   { x: W - 130, y: H - 120, w: 100, h: 100, t: 'GAS' },
  brake: { x: W - 240, y: H - 120, w: 100, h: 100, t: 'BRK' },
  back:  { x: 30,      y: H - 120, w: 110, h: 100, t: 'BACK' },
  fwd:   { x: 150,     y: H - 120, w: 110, h: 100, t: 'NOSE' },
};
function drawTouchControls() {
  if (!TOUCH && !embedded) return;
  for (const key in tc) {
    if (planted && (key === 'back' || key === 'fwd')) continue;
    const b = tc[key];
    ctx.globalAlpha = input._tc[key] ? 0.55 : 0.3;
    ctx.fillStyle = '#fff'; roundRect(b.x, b.y, b.w, b.h, 16); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#10131a'; ctx.font = 'bold 16px Trebuchet MS'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.t, b.x + b.w / 2, b.y + b.h / 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
}

let menuBtns = [], pauseBtns = [], completeBtns = [], levelCards = [];
function drawMenu() {
  drawBackground(LEVELS[0].pal);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.font = 'bold 70px Trebuchet MS';
  ctx.fillText('DIRT BIKE RAMPAGE', W / 2 + 3, 113);
  ctx.fillStyle = '#ffd34d'; ctx.fillText('DIRT BIKE RAMPAGE', W / 2, 110);
  ctx.fillStyle = '#fff'; ctx.font = '20px Trebuchet MS';
  ctx.fillText('Select a level', W / 2, 160);
  ctx.textAlign = 'left';
  levelCards = [];
  const cw = 250, ch = 150, gap = 30, total = LEVELS.length * cw + (LEVELS.length - 1) * gap;
  let x0 = (W - total) / 2, y0 = 210;
  for (let i = 0; i < LEVELS.length; i++) {
    const L = LEVELS[i], x = x0 + i * (cw + gap);
    const locked = i >= unlocked;
    const card = { x, y: y0, w: cw, h: ch, idx: i, locked };
    levelCards.push(card);
    const g = ctx.createLinearGradient(x, y0, x, y0 + ch);
    g.addColorStop(0, L.pal.skyTop); g.addColorStop(1, L.pal.skyBot);
    ctx.fillStyle = g; roundRect(x, y0, cw, ch, 14); ctx.fill();
    ctx.save(); roundRect(x, y0, cw, ch, 14); ctx.clip();
    ctx.fillStyle = L.pal.dirt; ctx.beginPath(); ctx.moveTo(x, y0 + ch);
    for (let sx = 0; sx <= cw; sx += 10) {
      const wx = sx * 6 + 400;
      const yy = y0 + ch - 45 + Math.sin(wx * L.terrain.f1 + L.terrain.s) * 22 + Math.sin(wx * L.terrain.f2) * 10;
      ctx.lineTo(x + sx, yy);
    }
    ctx.lineTo(x + cw, y0 + ch); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = (hover === 'card' + i && !locked) ? '#ffd34d' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = hover === 'card' + i ? 3 : 1.5; roundRect(x, y0, cw, ch, 14); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x, y0 + ch - 56, cw, 56);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 19px Trebuchet MS';
    ctx.fillText((i + 1) + '. ' + L.name, x + cw / 2, y0 + ch - 32);
    drawStars(x + cw / 2 - 22, y0 + ch - 14, bestStars[i] || 0, 8);
    if (bestTimes[i] != null) {
      ctx.fillStyle = '#9fffa0'; ctx.font = '12px Trebuchet MS';
      ctx.fillText('Best ' + fmtTime(bestTimes[i]), x + cw / 2 + 60, y0 + ch - 12);
    }
    if (locked) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; roundRect(x, y0, cw, ch, 14); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '40px Trebuchet MS'; ctx.fillText('LOCKED', x + cw / 2, y0 + ch / 2 + 14);
    }
    ctx.textAlign = 'left';
  }
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '15px Trebuchet MS';
  const hint = TOUCH ? 'Use the on-screen buttons to ride. Tap a level to start.'
    : 'Up or W throttle. Down or S brake. Left lean back. Right lean forward. R restart. P pause.';
  ctx.fillText(hint, W / 2, 430);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '13px Trebuchet MS';
  ctx.fillText('Land flips for bonus points. Clear a level fast for 3 stars.', W / 2, 458);
  menuBtns = [topBtns.mute];
  topBtns.mute.t = audio.enabled ? 'Snd' : 'Off';
  btn(topBtns.mute, hover === 'mute');
  ctx.textAlign = 'left';
}
function drawPauseOverlay() {
  drawScene();
  ctx.fillStyle = 'rgba(8,10,16,0.72)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 56px Trebuchet MS';
  ctx.fillText('PAUSED', W / 2, 230); ctx.textAlign = 'left';
  pauseBtns = [
    { id: 'resume', x: W / 2 - 110, y: 290, w: 220, h: 50, t: 'Resume', hc: '#9fffa0' },
    { id: 'restart', x: W / 2 - 110, y: 352, w: 220, h: 50, t: 'Restart Level' },
    { id: 'menu', x: W / 2 - 110, y: 414, w: 220, h: 50, t: 'Level Select' },
  ];
  for (const b of pauseBtns) btn(b, hover === b.id);
}
function drawComplete() {
  drawScene();
  ctx.fillStyle = 'rgba(8,10,16,0.78)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9fffa0'; ctx.font = 'bold 54px Trebuchet MS';
  ctx.fillText('LEVEL COMPLETE!', W / 2, 170);
  drawStars(W / 2 - 64, 240, finishStars, 26);
  ctx.fillStyle = '#fff'; ctx.font = '26px Trebuchet MS';
  ctx.fillText('Time: ' + fmtTime(elapsed), W / 2, 320);
  ctx.font = '20px Trebuchet MS'; ctx.fillStyle = '#cfd6e0';
  ctx.fillText('Flips: ' + totalFlips + '    Bonus: ' + comboScore, W / 2, 354);
  if (bestTimes[levelIdx] != null) ctx.fillText('Best: ' + fmtTime(bestTimes[levelIdx]), W / 2, 384);
  ctx.textAlign = 'left';
  const hasNext = levelIdx + 1 < LEVELS.length;
  completeBtns = [
    { id: 'retry', x: W / 2 - (hasNext ? 230 : 110), y: 420, w: 220, h: 52, t: 'Retry' },
    { id: 'menu', x: W / 2 - 110, y: 488, w: 220, h: 46, t: 'Level Select' },
  ];
  if (hasNext) completeBtns.unshift({ id: 'next', x: W / 2 + 10, y: 420, w: 220, h: 52, t: 'Next Level', hc: '#9fffa0' });
  for (const b of completeBtns) btn(b, hover === b.id);
}
function drawScene() {
  const pal = level.pal;
  ctx.save();
  if (cam.shake > 0.3) ctx.translate((Math.random() - 0.5) * cam.shake, (Math.random() - 0.5) * cam.shake);
  drawBackground(pal);
  for (let cx = level.cp; cx < level.finish; cx += level.cp) drawCheckpoint(cx);
  drawFinish();
  drawTerrain(pal);
  drawParticles(cam);
  drawBike();
  ctx.restore();
  drawSpeedLines();
  if (levelIdx === 3) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 720);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
}

const keys = {};
const input = {
  _tc: { gas: false, brake: false, back: false, fwd: false },
  gas:   () => keys.ArrowUp || keys.KeyW || input._tc.gas,
  brake: () => keys.ArrowDown || keys.KeyS || input._tc.brake,
  back:  () => keys.ArrowLeft || keys.KeyA || input._tc.back,
  fwd:   () => keys.ArrowRight || keys.KeyD || input._tc.fwd,
};
addEventListener('keydown', e => {
  if (e.target && e.target.classList && e.target.classList.contains('spell-key')) return;
  if (sproutsPaused) return;
  audio.init(); audio.resume();
  keys[e.code] = true;
  if (state === 'play') {
    if (e.code === 'KeyP') { state = 'pause'; audio.stopEngine(); }
    if (e.code === 'KeyR') startLevel(levelIdx);
  } else if (state === 'pause' && e.code === 'KeyP') { state = 'play'; audio.startEngine(); }
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });

function canvasPos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
}
function inRect(p, b) { return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }

let hover = null;
const pointerBtn = new Map();
canvas.addEventListener('pointermove', e => {
  const p = canvasPos(e);
  hover = null;
  if (state === 'menu') {
    for (const c of levelCards) if (!c.locked && inRect(p, c)) hover = 'card' + c.idx;
    if (inRect(p, topBtns.mute)) hover = 'mute';
  } else if (state === 'play') {
    if (inRect(p, topBtns.pause)) hover = 'pause';
    if (inRect(p, topBtns.mute)) hover = 'mute';
  } else if (state === 'pause') { for (const b of pauseBtns) if (inRect(p, b)) hover = b.id; }
  else if (state === 'complete') { for (const b of completeBtns) if (inRect(p, b)) hover = b.id; }
});
canvas.addEventListener('pointerdown', e => {
  audio.init(); audio.resume();
  const p = canvasPos(e);
  if (state === 'play' && (TOUCH || embedded) && !sproutsPaused) {
    for (const key in tc) {
      if (planted && (key === 'back' || key === 'fwd')) continue;
      if (inRect(p, tc[key])) { input._tc[key] = true; pointerBtn.set(e.pointerId, key); }
    }
  }
  if ((state === 'play' || state === 'menu') && inRect(p, topBtns.mute)) { audio.toggle(); audio.click(); return; }
  if (state === 'play' && inRect(p, topBtns.pause) && !sproutsPaused) { state = 'pause'; audio.stopEngine(); audio.click(); return; }
  if (state === 'menu') {
    for (const c of levelCards) if (!c.locked && inRect(p, c)) { audio.click(); startLevel(c.idx); return; }
  } else if (state === 'pause') {
    for (const b of pauseBtns) if (inRect(p, b)) {
      audio.click();
      if (b.id === 'resume') { state = 'play'; audio.startEngine(); }
      else if (b.id === 'restart') startLevel(levelIdx);
      else if (b.id === 'menu') { audio.stopEngine(); state = 'menu'; }
      return;
    }
  } else if (state === 'complete') {
    for (const b of completeBtns) if (inRect(p, b)) {
      audio.click();
      if (b.id === 'retry') startLevel(levelIdx);
      else if (b.id === 'next') startLevel(Math.min(LEVELS.length - 1, levelIdx + 1));
      else if (b.id === 'menu') state = 'menu';
      return;
    }
  }
});
function releasePointer(e) {
  const key = pointerBtn.get(e.pointerId);
  if (key) { input._tc[key] = false; pointerBtn.delete(e.pointerId); }
}
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);
canvas.addEventListener('pointerleave', releasePointer);

let state = 'menu';
let last = performance.now();
levelIdx = 0; level = LEVELS[0];

function applyLearner(levelNo, reduced) {
  const lv = Math.min(3, Math.max(1, levelNo | 0 || 1));
  learnerLevel = lv;
  learnerReduced = !!reduced;
  planted = lv < 2 || !!reduced;
  airScale = planted ? 0 : lv === 2 ? 0.7 : 1;
  askAfter = learnerReduced ? 11 : lv >= 3 ? 7 : 9;
  const idx = Math.min(LEVELS.length - 1, reduced ? 0 : lv - 1);
  if (state !== 'play' || levelIdx !== idx) startLevel(idx);
}
function frame(now) {
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.05) dt = 0.05;
  if (state === 'play') updatePlay(dt);
  ctx.clearRect(0, 0, W, H);
  if (state === 'menu') drawMenu();
  else if (state === 'play') {
    drawScene();
    drawHUD();
    drawTouchControls();
    if (crashFreeze > 0) {
      ctx.fillStyle = 'rgba(140,0,0,0.30)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 52px Trebuchet MS';
      ctx.fillText('CRASHED!', W / 2, H / 2 - 8);
      ctx.font = '20px Trebuchet MS'; ctx.fillText('Back to the last checkpoint.', W / 2, H / 2 + 30);
      ctx.textAlign = 'left';
    }
  }
  else if (state === 'pause') drawPauseOverlay();
  else if (state === 'complete') drawComplete();
  requestAnimationFrame(frame);
}

window.DirtRampage = {
  applyLearner,
  onQuestion(fn) { onAsk = typeof fn === 'function' ? fn : onAsk; },
  pause() { sproutsPaused = true; clearRideKeys(); audio.stopEngine(); },
  resume() {
    sproutsPaused = false;
    rideTime = 0;
    if (state === 'play') audio.startEngine();
  },
  arm() { rideTime = 0; },
  grant(ok) {
    if (ok) return;
    boostUntil = performance.now() + 1600 * (rewardScale.boost || 1);
  },
  setDifficulty(partial = {}) { applyLearner(partial.level ?? learnerLevel, typeof partial.reduced === 'boolean' ? partial.reduced : learnerReduced); },
  setReward(partial = {}) {
    if (Number.isFinite(partial.boost)) rewardScale.boost = partial.boost;
    if (Number.isFinite(partial.slow)) rewardScale.slow = partial.slow;
  },
  setProgress(partial = {}) {
    if (!bike || !Number.isFinite(+partial.travel) || +partial.travel <= 0 || !level) return;
    const x = Math.max(150, Math.min(level.finish - 120, +partial.travel));
    spawnBikeAt(x);
    lastCheckpoint = Math.max(150, Math.floor(x / level.cp) * level.cp);
  },
  setAudio(on) {
    audio.init();
    audio.enabled = !!on;
    if (audio.master && audio.ctx) audio.master.gain.setTargetAtTime(on ? 0.85 : 0, audio.ctx.currentTime, 0.03);
  },
  toggleMute() {
    audio.init();
    return !audio.toggle();
  },
  getProgress() { return { travel: bike ? bike.x : 0 }; },
  status() {
    return {
      level: learnerLevel,
      airControl: airScale > 0,
      reduced: learnerReduced,
      planted,
      grounded: !!prevGround,
      vx: bike ? +bike.vx.toFixed(2) : 0,
      ang: bike ? +bike.ang.toFixed(3) : 0,
    };
  },
  resize() {}
};

if (embedded) startLevel(0);
requestAnimationFrame(frame);
})();
