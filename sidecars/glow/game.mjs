/**
 * Light lines — draw glowing lines on a dark board, then drop a ball that rolls down
 * (the learner's garden buddy in a clear ball, ADR 0001)
 * them into the pocket with the right answer. The light is real 2D global illumination
 * (radiance cascades): drawn lines light the floor, reveal hidden walls, and cast shadows.
 * Inside Little Sprouts the host sends each question; on its own page the game makes them.
 */
import * as THREE from 'three';
import {
  H, BALL_R, LINE_R, POCKET_DEPTH, LIVES, INKS,
  makeLevel, solids, stepBall, pocketUnder, newBall, extendStroke, strokeLength,
  strokeSegments, lidSegments, pickAnswerPocket, worldWidth, inkFor
} from './logic.mjs?v=glow1';
import { RadianceField } from './radiance.mjs?v=glow1';
import { localQuestion, normalizeQuestion, LOCAL_ROUND } from './quiz.mjs?v=glow1';
import { resolveAutoQuality, isPerformanceTier } from '../../lib/device-tier.mjs?v=low-end1';
import { readPad, actionDown } from '../../lib/pad-core.mjs?v=pad-rt';
import { drawBuddyBall, buddyKind } from '../../lib/buddy2d.mjs?v=ball2';

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const marks = $('marks');
const ctx = marks.getContext('2d');
const overlay = $('overlay');
const playBtn = $('play');
const titleEl = $('title');
const verdictEl = $('verdict');
const reasonEl = $('reason');
const intro = [$('blurb'), $('help')];
const hud = $('hud');
const countEl = $('count');
const livesEl = $('lives');
const starsEl = $('stars');
const askEl = $('ask');
const askText = $('askText');
const toastEl = $('toast');
const hintEl = $('hint');
const toolsEl = $('tools');
const inkFill = $('inkbar').firstElementChild;
const inkBtns = [...document.querySelectorAll('#tools .ink')];
const undoBtn = $('undo');
const clearBtn = $('clear');
const dropBtn = $('drop');
const SIDECAR_SOURCE = 'sprouts-sidecar';

const call = (fn, arg) => { try { return fn?.(arg); } catch { return undefined; } };
const sproutsSettings = () => { try { return JSON.parse(localStorage.getItem('sprouts-v1')) || {}; } catch { return {}; } };
const embedded = window.parent !== window;

/** Light each kind gives off (linear rgb, can go above 1), and how it looks on the marks layer. */
const LIGHT = {
  plain: [2.2, 2.05, 1.8],
  boost: [0.45, 2.3, 0.6],
  bouncy: [0.45, 0.95, 2.6],
  slow: [2.3, 1.75, 0.3],
  hazard: [2.6, 0.2, 0.14],
  pocket: [0.4, 0.38, 0.55],
  lamp: [0.9, 0.75, 0.5],
  ball: [1.4, 1.3, 1.05],
  wall: [0, 0, 0]
};

/* ---------- state ---------- */

const state = {
  phase: 'menu', // menu | wait | draw | roll | pop | drop | won | end
  source: embedded ? 'wait' : 'local',
  waitSince: 0,
  q: null,
  pending: null,
  hostKey: '',
  level: null,
  answerPocket: 0,
  pocketChoice: [],
  strokes: [],
  live: null,
  ink: 0,
  inkMax: 1,
  kind: 'plain',
  lives: LIVES,
  ball: null,
  buddy: buddyKind(),
  spin: 0,
  list: [],
  still: 0,
  rollTime: 0,
  pop: null,
  drop: null,
  step: 0,
  stars: 0,
  missed: false,
  localIndex: 0,
  nextAt: 0,
  sound: true
};

/* ---------- renderer and light ---------- */

const tier = resolveAutoQuality({ embedded });
const lowGpu = isPerformanceTier(tier);
let renderer = null;
let light = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowGpu ? 1 : 2));
  renderer.setClearColor(0x000000, 1);
  light = new RadianceField(renderer, { maxSide: lowGpu ? 560 : 900, steps: lowGpu ? 32 : 48 });
} catch {
  renderer = null;
}

/** Where the world sits on screen, in css pixels. */
const view = { cw: 1, ch: 1, ox: 0, oy: 0, scale: 1, dpr: 1 };

function freeRect() {
  const cw = innerWidth;
  const ch = innerHeight;
  const top = askEl.hidden ? 60 : Math.max(60, askEl.getBoundingClientRect().bottom + 6);
  const bottom = toolsEl.hidden ? ch - 12 : Math.min(ch - 12, toolsEl.getBoundingClientRect().top - 6);
  return { left: 8, top, width: cw - 16, height: Math.max(80, bottom - top) };
}

function fitView() {
  view.cw = innerWidth;
  view.ch = innerHeight;
  view.dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (renderer) renderer.setSize(view.cw, view.ch, false);
  marks.width = Math.round(view.cw * view.dpr);
  marks.height = Math.round(view.ch * view.dpr);
  if (light) light.resize(view.cw, view.ch);
  const W = state.level?.W ?? H;
  const r = freeRect();
  view.scale = Math.min(r.width / W, r.height / H);
  view.ox = r.left + (r.width - W * view.scale) / 2;
  view.oy = r.top + (r.height - H * view.scale) / 2;
  if (state.level) restampAll();
}
addEventListener('resize', fitView);

const toCss = (x, y) => ({ x: view.ox + x * view.scale, y: view.oy + y * view.scale });
const toWorld = (cx, cy) => ({ x: (cx - view.ox) / view.scale, y: (cy - view.oy) / view.scale });

/** A world capsule as a light-scene shape (scene pixels, y up). */
function shapeOf(s, lightRgb) {
  const q = light.q;
  const a = toCss(s.ax, s.ay);
  const b = toCss(s.bx, s.by);
  return { ax: a.x * q, ay: (view.ch - a.y) * q, bx: b.x * q, by: (view.ch - b.y) * q, r: s.r * view.scale * q, light: lightRgb };
}

function staticShapes() {
  const lv = state.level;
  const out = [];
  for (const w of lv.walls) out.push(shapeOf(w, w.kind === 'hazard' ? LIGHT.hazard : LIGHT.wall));
  for (const p of lv.pockets) {
    if (lv.closed.has(p.index)) {
      for (const s of lidSegments(p)) out.push(shapeOf(s, LIGHT.wall));
    } else {
      out.push(shapeOf({ ax: p.x0 + 3, ay: H - 2.2, bx: p.x1 - 3, by: H - 2.2, r: 0.8 }, LIGHT.pocket));
    }
  }
  const d = lv.dropper;
  out.push(shapeOf({ ax: d.x - 3.2, ay: d.y - 3.6, bx: d.x + 3.2, by: d.y - 3.6, r: 0.6 }, LIGHT.lamp));
  return out;
}

function restampAll() {
  if (!light || !state.level) return;
  const shapes = staticShapes();
  for (const s of state.strokes) for (const seg of strokeSegments(s)) shapes.push(shapeOf(seg, LIGHT[s.kind]));
  if (state.live) for (const seg of strokeSegments(state.live)) shapes.push(shapeOf(seg, LIGHT[state.live.kind]));
  light.stamp(shapes, true);
}

/* ---------- board ---------- */

function buildLevel(q) {
  const r = freeRect();
  const W = worldWidth(r.width / r.height);
  const level = makeLevel((Math.random() * 1e9) | 0, q.choices.length, state.step, W);
  state.level = level;
  state.answerPocket = pickAnswerPocket(level);
  // The right answer goes to its pocket; the others fill the rest in a shuffled order.
  const wrong = q.choices.filter(c => !c.ok).sort(() => Math.random() - 0.5);
  state.pocketChoice = level.pockets.map(p => (p.index === state.answerPocket ? q.choices.find(c => c.ok) : wrong.pop()));
  state.strokes = [];
  state.live = null;
  state.inkMax = inkFor(W);
  state.ink = state.inkMax;
  state.lives = LIVES;
  resetBall();
  fitView();
}

function resetBall() {
  state.ball = newBall(state.level);
  state.still = 0;
  state.rollTime = 0;
}

/* ---------- drawing input ---------- */

let drawId = null;

function inkUsed() {
  return state.strokes.reduce((n, s) => n + strokeLength(s), 0) + (state.live ? strokeLength(state.live) : 0);
}

stage.addEventListener('pointerdown', (e) => {
  wakeAudio();
  if (state.phase !== 'draw' || drawId !== null) return;
  if (state.ink <= 0.5) { toast('Out of ink! Undo a line', 'bad'); return; }
  stage.setPointerCapture?.(e.pointerId);
  drawId = e.pointerId;
  hintEl.hidden = true;
  const p = toWorld(e.clientX, e.clientY);
  state.live = { kind: state.kind, pts: [] };
  extendStroke(state.live, p.x, p.y, state.ink, state.level.W);
  if (light) light.stamp([shapeOf(strokeSegments(state.live)[0], LIGHT[state.kind])]);
});

stage.addEventListener('pointermove', (e) => {
  if (e.pointerId !== drawId || !state.live) return;
  const events = e.getCoalescedEvents?.() || [e];
  const fresh = [];
  for (const ev of events) {
    const p = toWorld(ev.clientX, ev.clientY);
    const before = state.live.pts.length;
    const spent = extendStroke(state.live, p.x, p.y, state.ink, state.level.W);
    if (state.live.pts.length > before) {
      state.ink -= spent;
      const pts = state.live.pts;
      const a = pts[pts.length - 2];
      const b = pts[pts.length - 1];
      fresh.push(shapeOf({ ax: a.x, ay: a.y, bx: b.x, by: b.y, r: LINE_R }, LIGHT[state.live.kind]));
      hum();
    }
  }
  if (fresh.length && light) light.stamp(fresh);
  if (state.ink <= 0.01 && fresh.length) toast('Out of ink', 'bad');
  paintTools();
});

const endDraw = (e) => {
  if (e.pointerId !== drawId) return;
  drawId = null;
  if (state.live) {
    // A tap leaves a single glowing dot: a little peg.
    state.strokes.push(state.live);
    state.live = null;
  }
  paintTools();
};
stage.addEventListener('pointerup', endDraw);
stage.addEventListener('pointercancel', endDraw);

function chooseInk(kind) {
  state.kind = kind;
  inkBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ink === kind)));
  tone(kind === 'boost' ? 880 : kind === 'bouncy' ? 660 : kind === 'slow' ? 330 : 520, 0, 0.12, 'triangle', 0.12);
}
inkBtns.forEach(b => b.addEventListener('click', () => { wakeAudio(); chooseInk(b.dataset.ink); }));

function undo() {
  if (state.phase !== 'draw' || !state.strokes.length) return;
  state.strokes.pop();
  state.ink = state.inkMax - inkUsed();
  restampAll();
  paintTools();
  tone(300, 0, 0.1, 'sine', 0.12);
}
function clearAll() {
  if (state.phase !== 'draw' || !state.strokes.length) return;
  state.strokes = [];
  state.ink = state.inkMax;
  restampAll();
  paintTools();
  tone(220, 0, 0.16, 'sine', 0.12);
}
undoBtn.addEventListener('click', undo);
clearBtn.addEventListener('click', clearAll);

function dropOrStop() {
  wakeAudio();
  if (state.phase === 'draw') {
    if (drawId !== null) return;
    state.list = solids(state.level, state.strokes);
    resetBall();
    state.phase = 'roll';
    hintEl.hidden = true;
    tone(520, 0, 0.1, 'sine', 0.15);
  } else if (state.phase === 'roll') {
    backToDraw();
  }
  paintTools();
}
dropBtn.addEventListener('click', dropOrStop);

addEventListener('keydown', (e) => {
  wakeAudio();
  if (!overlay.hidden) {
    if ((e.code === 'Enter' || e.code === 'Space') && !playBtn.disabled) { e.preventDefault(); playBtn.click(); }
    return;
  }
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); dropOrStop(); }
  else if (e.code === 'KeyZ' || e.code === 'Backspace') { e.preventDefault(); undo(); }
  else if (/^Digit[1-4]$/.test(e.code)) chooseInk(INKS[+e.code.slice(5) - 1]);
});

const padState = { a: false, b: false, lb: false, rb: false };
function pollPad() {
  let pads = [];
  try { pads = [...(navigator.getGamepads?.() || [])].filter(Boolean); } catch { pads = []; }
  if (!pads.length) return;
  const raw = readPad(pads[0]);
  const a = actionDown(raw, padState.a) || raw.start >= 0.5;
  const b = raw.b >= 0.5;
  const lb = raw.lb >= 0.5 || raw.left >= 0.5;
  const rb = raw.rb >= 0.5 || raw.right >= 0.5;
  if (!overlay.hidden) {
    playBtn.classList.add('pad-focus');
    if (a && !padState.a && !playBtn.disabled) playBtn.click();
  } else {
    if (a && !padState.a) dropOrStop();
    if (b && !padState.b) undo();
    const i = INKS.indexOf(state.kind);
    if (lb && !padState.lb) chooseInk(INKS[(i + INKS.length - 1) % INKS.length]);
    if (rb && !padState.rb) chooseInk(INKS[(i + 1) % INKS.length]);
  }
  Object.assign(padState, { a, b, lb, rb });
}

/* ---------- sound ---------- */

let audio = null;
function wakeAudio() {
  if (audio) {
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    return;
  }
  try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { audio = null; }
}

function tone(freq, time, length, type = 'sine', volume = 0.2, slide = 0) {
  if (!audio || !state.sound) return;
  const t = audio.currentTime + time;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + length);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + length + 0.02);
}

let lastHum = 0;
function hum() {
  const now = performance.now();
  if (now - lastHum < 60) return;
  lastHum = now;
  const base = { plain: 520, boost: 700, bouncy: 600, slow: 380 }[state.kind];
  tone(base + (1 - state.ink / state.inkMax) * 200, 0, 0.07, 'sine', 0.05);
}
let lastClack = 0;
function contact(r) {
  const now = performance.now();
  if (now - lastClack < 90) return;
  if (r.kinds.has('bouncy') && r.hit > 8) { lastClack = now; tone(400, 0, 0.18, 'sine', 0.16, 500); return; }
  if (r.kinds.has('boost')) { lastClack = now; tone(900, 0, 0.08, 'sawtooth', 0.04, 400); return; }
  if (r.hit > 12) { lastClack = now; tone(700 + Math.random() * 300, 0, 0.05, 'triangle', Math.min(0.2, r.hit * 0.004)); }
}
const chime = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.05 + i * 0.09, 0.35, 'triangle', 0.16));
const boop = () => { tone(330, 0.05, 0.18, 'square', 0.06); tone(247, 0.2, 0.25, 'square', 0.06); };
const zap = () => { tone(180, 0, 0.3, 'sawtooth', 0.12, -120); tone(90, 0.1, 0.3, 'square', 0.08); };

/* ---------- voice (on its own page; inside Sprouts the host reads) ---------- */

let sproutsVoice = null;
import('../../lib/speech.js?v=ball2').then((mod) => { sproutsVoice = mod; }).catch(() => {});

function speak(text) {
  if (!text || embedded) return;
  const data = sproutsSettings();
  if (data.sound === false) return;
  if (sproutsVoice) {
    try {
      const context = sproutsVoice.contextFor('glow');
      sproutsVoice.speak(text, sproutsVoice.voiceFor(context, data.voice, data.characterVoices), { context });
      return;
    } catch { /* fall back to the browser voice */ }
  }
  try {
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(String(text).replace(/\s*\+\s*/g, ' plus ').replace(/\s*−\s*/g, ' minus ')));
  } catch { /* no voice here */ }
}

/* ---------- flow ---------- */

let toastTimer = 0;
function toast(text, kind) {
  toastEl.textContent = text;
  toastEl.className = kind;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 1300);
}

function paintHud() {
  const total = state.q?.total || (state.source === 'local' ? LOCAL_ROUND : 0);
  countEl.textContent = total ? `Board ${Math.min(total, state.step + 1)} / ${total}` : `Board ${state.step + 1}`;
  starsEl.textContent = `⭐ ${state.stars}`;
  livesEl.textContent = '❤️'.repeat(Math.max(0, state.lives)) + '🖤'.repeat(Math.max(0, LIVES - state.lives));
}

function paintTools() {
  const drawing = state.phase === 'draw';
  inkFill.style.width = `${Math.max(0, (state.ink / state.inkMax) * 100)}%`;
  undoBtn.disabled = !drawing || !state.strokes.length;
  clearBtn.disabled = !drawing || !state.strokes.length;
  inkBtns.forEach(b => { b.disabled = !drawing; });
  dropBtn.disabled = !(drawing || state.phase === 'roll');
  dropBtn.textContent = state.phase === 'roll' ? 'Stop ■' : 'Drop ▶';
}

function present(q) {
  state.q = q;
  state.missed = false;
  state.drop = null;
  state.pop = null;
  if (typeof q.round === 'number' && state.source === 'host') state.step = q.round;
  askText.textContent = q.prompt;
  askEl.classList.remove('done');
  askEl.hidden = false;
  toolsEl.hidden = false;
  buildLevel(q);
  state.phase = 'draw';
  paintHud();
  paintTools();
  if (state.source === 'host') call(window.SproutsSidecar?.show);
  else speak(q.prompt);
}

function nextLocal() {
  if (state.step >= LOCAL_ROUND) { endRound(); return; }
  present(normalizeQuestion(localQuestion(Math.random, state.localIndex++)));
}

function hostAsk(msg) {
  const q = normalizeQuestion(msg);
  if (!q) return;
  if ('sound' in msg) state.sound = msg.sound !== false;
  state.buddy = buddyKind(msg.buddy);
  const key = `${q.round}|${q.prompt}|${q.choices.map(c => c.label).join(',')}`;
  if (key === state.hostKey) return;
  state.hostKey = key;
  state.source = 'host';
  state.pending = q;
  if (state.phase === 'draw' || state.phase === 'wait') present(q);
}

function backToDraw() {
  resetBall();
  state.phase = 'draw';
  paintTools();
}

function loseLife() {
  state.missed = true;
  state.lives--;
  zap();
  state.phase = 'pop';
  state.pop = { x: state.ball.x, y: state.ball.y, t: 0 };
  paintHud();
  paintTools();
  if (state.lives <= 0) toast('Out of hearts! Fresh ink', 'bad');
  else toast('Ouch! Red is danger', 'bad');
}

function afterPop() {
  state.pop = null;
  if (state.lives <= 0) {
    state.lives = LIVES;
    state.strokes = [];
    state.ink = state.inkMax;
    restampAll();
    paintHud();
  }
  backToDraw();
}

function landed(pocket) {
  const choice = state.pocketChoice[pocket.index];
  if (state.source === 'host') call(window.SproutsSidecar?.pick, choice.index);
  if (choice.ok) {
    if (!state.missed) state.stars++;
    state.step++;
    chime();
    toast(state.missed ? 'You found it!' : 'Yes! ⭐', 'good');
    askEl.classList.add('done');
    state.phase = 'won';
    state.won = pocket.index;
    paintHud();
    paintTools();
    state.nextAt = performance.now() + (state.source === 'local' ? 1600 : 1300);
    return;
  }
  state.missed = true;
  boop();
  toast('Not that one', 'bad');
  state.level.closed.add(pocket.index);
  restampAll();
  backToDraw();
}

function endRound() {
  state.phase = 'end';
  askEl.hidden = true;
  hud.hidden = true;
  toolsEl.hidden = true;
  titleEl.textContent = 'All done!';
  verdictEl.hidden = false;
  verdictEl.textContent = `⭐ ${state.stars} / ${LOCAL_ROUND}`;
  reasonEl.hidden = false;
  reasonEl.textContent = state.stars === LOCAL_ROUND ? 'Every board right the first time!' : 'Stars are for the right pocket on the first try.';
  intro.forEach(el => { el.hidden = true; });
  playBtn.textContent = 'Play again';
  overlay.hidden = false;
  speak(`All done! You earned ${state.stars} stars.`);
}

function startGame() {
  wakeAudio();
  overlay.hidden = true;
  hud.hidden = false;
  hintEl.hidden = false;
  if (state.phase === 'end') {
    state.step = 0;
    state.stars = 0;
  }
  state.phase = 'wait';
  state.waitSince = performance.now();
  if (state.source === 'host' && state.pending) present(state.pending);
  else if (state.source === 'local') nextLocal();
}
playBtn.addEventListener('click', startGame);

addEventListener('message', (event) => {
  if (!embedded || event.source !== window.parent) return;
  const data = event.data;
  if (!data || data.source !== SIDECAR_SOURCE) return;
  if (data.type === 'ask') hostAsk(data);
  else if (data.type === 'clear' || data.type === 'arcade') {
    askEl.hidden = true;
    toast('Great lighting!', 'good');
  }
});
if (embedded) call(window.SproutsSidecar?.need);

/* ---------- marks layer: answers, lamp, ball ---------- */

function drawShape(name, x, y, r, fill) {
  ctx.beginPath();
  const poly = (n, rot = -Math.PI / 2, rx = r, ry = r) => {
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rx, y + Math.sin(a) * ry);
    }
    ctx.closePath();
  };
  if (name === 'oval') ctx.ellipse(x, y, r * 1.1, r * 0.65, 0, 0, Math.PI * 2);
  else if (name === 'square') ctx.rect(x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6);
  else if (name === 'rectangle') ctx.rect(x - r * 1.1, y - r * 0.6, r * 2.2, r * 1.2);
  else if (name === 'triangle') poly(3, -Math.PI / 2, r * 1.05, r * 1.05);
  else if (name === 'diamond') poly(4, -Math.PI / 2, r * 0.8, r * 1.05);
  else if (name === 'hexagon') poly(6, 0);
  else if (name === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const rr = i % 2 ? r * 0.45 : r * 1.05;
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  } else ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawBadge(choice, x, y, r, dim, glow) {
  ctx.save();
  ctx.globalAlpha = dim ? 0.3 : 1;
  const colorOnly = choice.fill && !choice.shape;
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = r * 1.2; }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = colorOnly ? choice.fill : '#fffdf6';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.strokeStyle = '#1b1f33';
  ctx.stroke();
  if (choice.shape) drawShape(choice.shape, x, y, r * 0.55, choice.fill || '#5d7a45');
  else if (!colorOnly) {
    let font = r * 1.0;
    ctx.font = `800 ${font}px "Trebuchet MS", sans-serif`;
    while (ctx.measureText(choice.label).width > r * 1.6 && font > r * 0.35) {
      font -= r * 0.06;
      ctx.font = `800 ${font}px "Trebuchet MS", sans-serif`;
    }
    ctx.fillStyle = '#1b1f33';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(choice.label, x, y + font * 0.05);
  }
  ctx.restore();
}

function drawMarks(now) {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.cw, view.ch);
  const lv = state.level;
  if (!lv || state.phase === 'menu') return;
  const s = view.scale;

  // Answers sit in their pockets; a closed pocket fades and gets a cross.
  const r = Math.min(POCKET_DEPTH * 0.36, (lv.W / lv.pockets.length) * 0.3) * s;
  for (const p of lv.pockets) {
    const choice = state.pocketChoice[p.index];
    if (!choice) continue;
    const c = toCss(p.cx, H - POCKET_DEPTH * 0.5 - 0.6);
    const closed = lv.closed.has(p.index);
    const won = state.phase === 'won' && state.won === p.index;
    drawBadge(choice, c.x, c.y + (closed || won ? 0 : Math.sin(now / 420 + p.cx) * s * 0.4), r, closed, won ? '#7cff9a' : '#d9d4ff');
    if (closed) {
      ctx.strokeStyle = '#ff9a8a';
      ctx.lineWidth = Math.max(2, r * 0.14);
      ctx.beginPath();
      ctx.moveTo(c.x - r * 0.5, c.y - r * 0.5); ctx.lineTo(c.x + r * 0.5, c.y + r * 0.5);
      ctx.moveTo(c.x + r * 0.5, c.y - r * 0.5); ctx.lineTo(c.x - r * 0.5, c.y + r * 0.5);
      ctx.stroke();
    }
  }

  // The lamp the ball drops from.
  const d = toCss(lv.dropper.x, lv.dropper.y);
  ctx.strokeStyle = '#ffe3a8aa';
  ctx.lineWidth = Math.max(2, s * 0.5);
  ctx.beginPath();
  ctx.moveTo(d.x - s * 4.5, d.y - s * 4.2);
  ctx.lineTo(d.x - s * 2.6, d.y - s * 0.4);
  ctx.moveTo(d.x + s * 4.5, d.y - s * 4.2);
  ctx.lineTo(d.x + s * 2.6, d.y - s * 0.4);
  ctx.stroke();

  // The ball: drawn crisp on top of its own light.
  let b = state.ball;
  let scale = 1;
  if (state.phase === 'drop' && state.drop) { b = state.drop.at; scale = 1 - Math.min(1, state.drop.t) * 0.9; }
  if (state.phase === 'won') b = null;
  if (state.phase === 'pop' && state.pop) {
    const k = state.pop.t;
    const c = toCss(state.pop.x, state.pop.y);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 90, 70, ${1 - k})`;
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(c.x + Math.cos(a) * s * (2 + k * 4), c.y + Math.sin(a) * s * (2 + k * 4));
      ctx.lineTo(c.x + Math.cos(a) * s * (3 + k * 9), c.y + Math.sin(a) * s * (3 + k * 9));
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  if (b) {
    const c = toCss(b.x, b.y);
    // The ball is the learner's garden buddy rolled up in a clear ball (ADR 0001).
    drawBuddyBall(ctx, state.buddy, c.x, c.y, BALL_R * s * scale, { spin: state.spin });
  }

  // While drawing, a faint ring follows the pen so you see where ink goes.
  if (state.phase === 'draw' && state.ink <= 0.01) {
    ctx.fillStyle = '#ffffff88';
    ctx.font = `700 ${Math.max(13, s * 3)}px "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Out of ink — Undo to get some back', view.cw / 2, view.oy + s * 20);
  }
}

/* ---------- loop ---------- */

const look = { exposure: 1.0, falloff: 0.8 };

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  pollPad();

  if (state.phase === 'wait' && state.source === 'wait' && now - state.waitSince > 4000) {
    state.source = 'local';
    nextLocal();
  }

  if (state.phase === 'roll') {
    const ball = state.ball;
    const fromX = ball.x;
    const r = stepBall(ball, state.list, dt);
    state.spin += (ball.x - fromX) / BALL_R;
    contact(r);
    state.rollTime += dt;
    if (r.hazard) loseLife();
    else {
      const p = pocketUnder(ball, state.level);
      if (p) {
        state.phase = 'drop';
        state.drop = { pocket: p, t: 0, at: { x: ball.x, y: ball.y } };
        tone(260, 0, 0.2, 'sine', 0.25);
      } else {
        state.still = Math.hypot(ball.vx, ball.vy) < 3 ? state.still + dt : 0;
        if (state.still > 1.2 || state.rollTime > 20) {
          toast('Stuck! Add a line', 'bad');
          backToDraw();
        }
      }
    }
  } else if (state.phase === 'drop' && state.drop) {
    const d = state.drop;
    d.t += dt / 0.3;
    d.at.x += (d.pocket.cx - d.at.x) * Math.min(1, dt * 10);
    d.at.y += (H - 3.5 - d.at.y) * Math.min(1, dt * 10);
    if (d.t >= 1) {
      state.drop = null;
      landed(d.pocket);
    }
  } else if (state.phase === 'pop' && state.pop) {
    state.pop.t += dt / 0.6;
    if (state.pop.t >= 1) afterPop();
  } else if (state.phase === 'won' && now >= state.nextAt) {
    if (state.source === 'local') nextLocal();
    else if (state.pending && state.pending !== state.q) present(state.pending);
  }

  if (light && state.level) {
    let b = state.ball;
    if (state.phase === 'drop' && state.drop) b = state.drop.at;
    if (state.phase === 'pop' || state.phase === 'won') b = null;
    if (state.phase === 'menu') b = null;
    if (b) {
      const c = toCss(b.x, b.y);
      light.setBall({ x: c.x * light.q, y: (view.ch - c.y) * light.q, r: BALL_R * 0.8 * view.scale * light.q, light: LIGHT.ball });
    } else light.setBall(null);
    const tl = toCss(0, 0);
    const br = toCss(state.level.W, H);
    const q = light.q;
    light.render({
      worldRect: [tl.x * q, (view.ch - br.y) * q, br.x * q, (view.ch - tl.y) * q],
      unit: view.scale * q,
      exposure: look.exposure,
      falloff: look.falloff,
      time: now / 1000
    });
  }
  drawMarks(now);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio?.suspend?.().catch(() => {});
  else if (audio && state.phase !== 'menu') audio.resume().catch(() => {});
});

state.sound = sproutsSettings().sound !== false;
if (!renderer || !light) {
  $('nogl').style.display = 'block';
  playBtn.textContent = 'Not available';
} else {
  // A dim sample board glows behind the menu while it loads.
  const sample = normalizeQuestion(localQuestion(Math.random, 1));
  state.q = sample;
  buildLevel(sample);
  state.strokes = [
    { kind: 'plain', pts: [{ x: state.level.W * 0.2, y: 30 }, { x: state.level.W * 0.5, y: 42 }] },
    { kind: 'boost', pts: [{ x: state.level.W * 0.55, y: 58 }, { x: state.level.W * 0.85, y: 50 }] }
  ];
  restampAll();
  state.phase = 'menu';
  playBtn.disabled = false;
  playBtn.textContent = 'Play';
  call(window.SproutsSidecar?.ready);
  if (new URLSearchParams(location.search).has('debug')) window.__glow = { state, light, view, restampAll, look };
  requestAnimationFrame(frame);
}
