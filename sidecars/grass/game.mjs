/**
 * Grass maze — run the garden buddy through a maze of tall grass and find the sign
 * with the right answer. Inside Little Sprouts the host sends each question; on its
 * own page the game makes them.
 */
import * as THREE from 'three';
import {
  BLOCK, RUN_SPEED,
  makeField, moveRunner, pickupUnder, heightMask, isSolid
} from './logic.mjs?v=grass1';
import { localQuestion, normalizeQuestion, LOCAL_ROUND } from './quiz.mjs?v=grass1';
import { makeGrass } from './grass.mjs?v=grass1';
import { makeBuddy, buddyKind, BUDDIES } from '../../lib/buddy3d.mjs?v=shop1';
import { resolveAutoQuality, pixelRatioCap, rendererOptions, isPerformanceTier } from '../../lib/device-tier.mjs?v=low-end1';
import { readPad, moveDirs, actionDown } from '../../lib/pad-core.mjs?v=pad-rt';

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const overlay = $('overlay');
const playBtn = $('play');
const titleEl = $('title');
const verdictEl = $('verdict');
const reasonEl = $('reason');
const intro = [$('blurb'), $('help')];
const hud = $('hud');
const countEl = $('count');
const starsEl = $('stars');
const mapBtn = $('map');
const askEl = $('ask');
const askText = $('askText');
const showEl = $('show');
const toastEl = $('toast');
const hintEl = $('hint');
const stickEl = $('stick');
const SIDECAR_SOURCE = 'sprouts-sidecar';
const MARGIN = 10;
const SIGN_H = 2.7;

const call = (fn, arg) => { try { return fn?.(arg); } catch { return undefined; } };
const sproutsSettings = () => { try { return JSON.parse(localStorage.getItem('sprouts-v1')) || {}; } catch { return {}; } };
const embedded = window.parent !== window;

/* ---------- state ---------- */

const state = {
  phase: 'menu', // menu | wait | look | play | won | end
  source: embedded ? 'wait' : 'local',
  waitSince: 0,
  q: null,
  pending: null,
  hostKey: '',
  field: null,
  spots: [],
  runner: { x: 0, z: 0, vx: 0, vz: 0, face: 0 },
  step: 0,
  stars: 0,
  missed: false,
  localIndex: 0,
  nextAt: 0,
  lookUntil: 0,
  map: false,
  sound: true
};

/* ---------- three.js scene ---------- */

const tier = resolveAutoQuality({ embedded });
const lowGpu = isPerformanceTier(tier);
const renderer = new THREE.WebGLRenderer({ canvas: stage, ...rendererOptions(tier) });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap(tier)));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const SKY = new THREE.Color('#bfe3f2');
const scene = new THREE.Scene();
scene.background = SKY;
scene.fog = new THREE.Fog(SKY, 26, 70);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);

const sunDir = new THREE.Vector3(-0.5, 0.8, 0.35).normalize();
const sunColour = new THREE.Color('#fff1d6');
scene.add(new THREE.HemisphereLight('#e8f6ff', '#4f6a2c', 1.4));
const sun = new THREE.DirectionalLight(sunColour, 2.2);
sun.position.copy(sunDir).multiplyScalar(20);
scene.add(sun);

const meadow = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: '#33521f' }));
meadow.rotation.x = -Math.PI / 2;
meadow.position.y = -0.02;
scene.add(meadow);

let levelGroup = null;
let grass = null;

/* ---------- the runner: the learner's garden buddy ---------- */

let runnerModel = makeBuddy(THREE, buddyKind());
scene.add(runnerModel.group);

/** Swap in a different buddy, for example when the host names this learner's. */
function useBuddy(kind) {
  if (!BUDDIES.includes(kind) || kind === runnerModel.kind) return;
  const old = runnerModel;
  runnerModel = makeBuddy(THREE, kind);
  runnerModel.group.position.copy(old.group.position);
  runnerModel.group.rotation.y = old.group.rotation.y;
  scene.remove(old.group);
  old.dispose();
  scene.add(runnerModel.group);
}

/* ---------- answer signs ---------- */

/** A round answer badge: a word or number, a color swatch, or a shape. */
function choiceTexture(choice) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;
  const colorOnly = choice.fill && !choice.shape;
  ctx.beginPath();
  ctx.arc(c, c, c - 10, 0, Math.PI * 2);
  ctx.fillStyle = colorOnly ? choice.fill : '#fffdf6';
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#2f2418';
  ctx.stroke();
  if (choice.shape) drawShape(ctx, choice.shape, c, c, 70, choice.fill || '#5d7a45');
  else if (!colorOnly) {
    let font = 120;
    ctx.font = `800 ${font}px "Trebuchet MS", sans-serif`;
    while (ctx.measureText(choice.label).width > size - 64 && font > 34) {
      font -= 6;
      ctx.font = `800 ${font}px "Trebuchet MS", sans-serif`;
    }
    ctx.fillStyle = '#2f2418';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(choice.label, c, c + font * 0.05);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawShape(ctx, name, x, y, r, fill) {
  ctx.beginPath();
  const poly = (n, rot = -Math.PI / 2, rx = r, ry = r) => {
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rx, y + Math.sin(a) * ry);
    }
    ctx.closePath();
  };
  if (name === 'circle') ctx.arc(x, y, r, 0, Math.PI * 2);
  else if (name === 'oval') ctx.ellipse(x, y, r * 1.1, r * 0.65, 0, 0, Math.PI * 2);
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

const SHARED = {
  stake: new THREE.MeshStandardMaterial({ color: '#8f5e36', roughness: 0.8 }),
  stakeGeo: new THREE.CylinderGeometry(0.06, 0.08, SIGN_H, 8),
  ringGeo: new THREE.TorusGeometry(0.75, 0.08, 8, 32)
};

/** A soft picture of the maze floor: dark under the grass walls, light on the paths. */
function groundTexture(grid) {
  const px = 16;
  const canvas = document.createElement('canvas');
  canvas.width = grid.gw * px;
  canvas.height = grid.gh * px;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#33521f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.filter = 'blur(3px)';
  ctx.fillStyle = '#7d9a45';
  for (let j = 0; j < grid.gh; j++) {
    for (let i = 0; i < grid.gw; i++) {
      if (!isSolid(grid, i, j)) ctx.fillRect(i * px - 1, j * px - 1, px + 2, px + 2);
    }
  }
  ctx.filter = 'none';
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function disposeLevel() {
  if (!levelGroup) return;
  scene.remove(levelGroup);
  levelGroup.traverse((o) => {
    o.userData.mask?.dispose();
    if (o.isMesh || o.isSprite) {
      if (o.geometry && o.geometry !== SHARED.stakeGeo && o.geometry !== SHARED.ringGeo) o.geometry.dispose();
      if (o.material && o.material !== SHARED.stake) {
        o.material.map?.dispose();
        o.material.dispose();
      }
    }
  });
  grass?.dispose();
  grass = null;
  levelGroup = null;
}

/** Build the maze, its grass, and one sign per answer. */
function buildLevel(q) {
  disposeLevel();
  const seed = (Math.random() * 1e9) | 0;
  const field = makeField(seed, q.choices.length, state.step);
  const { grid } = field;
  const w = grid.gw * BLOCK;
  const d = grid.gh * BLOCK;
  const group = new THREE.Group();

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: groundTexture(grid) }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  group.add(floor);

  const m = heightMask(grid, 8);
  const mask = new THREE.DataTexture(m.data, m.width, m.height, THREE.RedFormat, THREE.UnsignedByteType);
  mask.magFilter = THREE.LinearFilter;
  mask.minFilter = THREE.LinearFilter;
  mask.wrapS = mask.wrapT = THREE.ClampToEdgeWrapping;
  mask.needsUpdate = true;

  grass = makeGrass({
    rect: { x0: -w / 2 - MARGIN, z0: -d / 2 - MARGIN, x1: w / 2 + MARGIN, z1: d / 2 + MARGIN },
    mask,
    maskRect: new THREE.Vector4(-w / 2, -d / 2, w, d),
    low: lowGpu,
    sunDir,
    sunColour: new THREE.Color('#fff1d6'),
    skyColour: new THREE.Color('#cfe8f5')
  });
  group.add(grass.group);
  // The mask texture belongs to this level; dispose it with the floor.
  floor.userData.mask = mask;

  const startPad = new THREE.Mesh(new THREE.CircleGeometry(0.7, 28), new THREE.MeshLambertMaterial({ color: '#e9d8a6' }));
  startPad.rotation.x = -Math.PI / 2;
  startPad.position.set(field.start.x, 0.005, field.start.z);
  group.add(startPad);

  // Answers go to dead ends in a shuffled order.
  const order = q.choices.map((_, i) => i).sort(() => Math.random() - 0.5);
  const spots = field.spots.map((at, k) => {
    const choice = q.choices[order[k]];
    const stake = new THREE.Mesh(SHARED.stakeGeo, SHARED.stake);
    stake.position.set(at.x, SIGN_H / 2, at.z);
    const ring = new THREE.Mesh(SHARED.ringGeo, new THREE.MeshBasicMaterial({ color: '#ffe27a' }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(at.x, 0.06, at.z);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: choiceTexture(choice), transparent: true }));
    label.scale.set(1.5, 1.5, 1);
    label.position.set(at.x, SIGN_H + 0.6, at.z);
    group.add(stake, ring, label);
    return { x: at.x, z: at.z, choice, closed: false, ring, label, stake, lift: 0 };
  });

  scene.add(group);
  levelGroup = group;
  state.field = field;
  state.spots = spots;
  placeRunnerAtStart();
}

function placeRunnerAtStart() {
  const { start } = state.field;
  Object.assign(state.runner, { x: start.x, z: start.z, vx: 0, vz: 0, face: Math.PI });
}

/* ---------- camera ---------- */

const camPos = new THREE.Vector3(0, 30, 20);
const camLook = new THREE.Vector3();
const want = { pos: new THREE.Vector3(), look: new THREE.Vector3() };

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

/** Where the camera wants to be: close behind the runner, or high over the whole maze. */
function cameraGoal(overview) {
  const r = state.runner;
  if (overview && state.field) {
    const { grid } = state.field;
    const hw = (grid.gw * BLOCK) / 2 + 1;
    const hd = (grid.gh * BLOCK) / 2 + 1;
    const v = THREE.MathUtils.degToRad(camera.fov) / 2;
    const h = Math.atan(Math.tan(v) * camera.aspect);
    // Leave room for the question at the top.
    // The question covers the top of the screen, so fit the maze in the lower part.
    const band = Math.min(0.32, 150 / innerHeight);
    const dist = Math.max(hd / Math.tan(v) / (1 - band) * 1.05, hw / Math.tan(h) * 1.08) + 1;
    const dir = new THREE.Vector3(0, 1, 0.3).normalize();
    want.look.set(0, 0, -Math.tan(v) * dist * band * 0.9);
    want.pos.copy(want.look).addScaledVector(dir, dist);
    return want;
  }
  const portrait = camera.aspect < 0.9;
  const dist = portrait ? 15 : 12;
  const dir = new THREE.Vector3(0, 1, 0.62).normalize();
  want.look.set(r.x, 0.4, r.z - 0.8);
  want.pos.copy(want.look).addScaledVector(dir, dist);
  return want;
}

function moveCamera(dt, snap = false) {
  const overview = state.map || state.phase === 'look' || state.phase === 'menu';
  const goal = cameraGoal(overview);
  const k = snap ? 1 : 1 - Math.exp(-dt * (overview ? 3 : 5));
  camPos.lerp(goal.pos, k);
  camLook.lerp(goal.look, k);
  camera.position.copy(camPos);
  camera.lookAt(camLook);
  // Fog starts past what the camera is looking at, close up or high over the maze.
  const reach = camPos.distanceTo(camLook);
  scene.fog.near = reach * 1.6;
  scene.fog.far = reach * 4.5;
}

/* ---------- input ---------- */

const input = {
  keys: new Set(),
  drag: null,
  pad: { x: 0, z: 0 },
  move: { x: 0, z: 0 }
};

const KEY_DIRS = {
  ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
  ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1]
};

addEventListener('keydown', (e) => {
  if (KEY_DIRS[e.code]) {
    input.keys.add(e.code);
    e.preventDefault();
  }
  if ((e.code === 'Enter' || e.code === 'Space') && !overlay.hidden && !playBtn.disabled) {
    e.preventDefault();
    playBtn.click();
  }
  if (e.code === 'KeyM' && overlay.hidden) toggleMap();
  wakeAudio();
});
addEventListener('keyup', (e) => input.keys.delete(e.code));
addEventListener('blur', () => input.keys.clear());

stage.addEventListener('pointerdown', (e) => {
  wakeAudio();
  stage.setPointerCapture?.(e.pointerId);
  input.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: 0, z: 0 };
  stickEl.style.left = `${e.clientX}px`;
  stickEl.style.top = `${e.clientY}px`;
  stickEl.firstElementChild.style.transform = '';
  stickEl.hidden = false;
  hintEl.hidden = true;
});
stage.addEventListener('pointermove', (e) => {
  const d = input.drag;
  if (!d || d.id !== e.pointerId) return;
  const span = 50;
  let x = (e.clientX - d.x0) / span;
  let z = (e.clientY - d.y0) / span;
  const len = Math.hypot(x, z);
  if (len > 1) { x /= len; z /= len; }
  d.x = x;
  d.z = z;
  stickEl.firstElementChild.style.transform = `translate(${x * 28}px, ${z * 28}px)`;
});
const endDrag = (e) => {
  if (input.drag?.id !== e.pointerId) return;
  input.drag = null;
  stickEl.hidden = true;
};
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);

const touch = matchMedia('(any-pointer: coarse)').matches || (navigator.maxTouchPoints || 0) > 0;

function toggleMap() {
  wakeAudio();
  state.map = !state.map;
  mapBtn.setAttribute('aria-pressed', String(state.map));
}
mapBtn.addEventListener('click', toggleMap);

const padState = { action: false, map: false, seen: false };
function pollPad() {
  let pads = [];
  try { pads = [...(navigator.getGamepads?.() || [])].filter(Boolean); } catch { pads = []; }
  if (!pads.length) { input.pad = { x: 0, z: 0 }; return; }
  const raw = readPad(pads[0]);
  if (!padState.seen) {
    padState.seen = true;
    document.body.classList.add('pad');
    hintEl.textContent = 'Left stick runs · A shows the map';
  }
  const dirs = moveDirs(raw);
  const stick = Math.hypot(raw.lx, raw.ly) > 0.2;
  input.pad = stick ? { x: raw.lx, z: raw.ly } : { x: dirs.x, z: dirs.y };
  const action = actionDown(raw, padState.action) || raw.start >= 0.5;
  if (!overlay.hidden) {
    playBtn.classList.add('pad-focus');
    if (action && !padState.action && !playBtn.disabled) playBtn.click();
  } else if (action && !padState.action) toggleMap();
  padState.action = action;
}

/** Which way to run this frame: the strongest input, eased a little. */
function readMove(dt) {
  let kx = 0;
  let kz = 0;
  for (const code of input.keys) {
    kx += KEY_DIRS[code][0];
    kz += KEY_DIRS[code][1];
  }
  const sources = [
    { x: kx, z: kz },
    input.drag ? { x: input.drag.x, z: input.drag.z } : { x: 0, z: 0 },
    input.pad
  ];
  let goal = { x: 0, z: 0 };
  let best = 0;
  for (const s of sources) {
    const len = Math.hypot(s.x, s.z);
    if (len > best) { best = len; goal = s; }
  }
  const len = Math.hypot(goal.x, goal.z);
  if (len > 1) goal = { x: goal.x / len, z: goal.z / len };
  if (len < 0.15) goal = { x: 0, z: 0 };
  const ease = 1 - Math.exp(-dt * 14);
  input.move.x += (goal.x - input.move.x) * ease;
  input.move.z += (goal.z - input.move.z) * ease;
  return input.move;
}

/* ---------- sound ---------- */

let audio = null;
let swishGain = null;
function wakeAudio() {
  if (audio) {
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    return;
  }
  try {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    const len = audio.sampleRate;
    const buffer = audio.createBuffer(1, len, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const noise = audio.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3200;
    filter.Q.value = 0.7;
    swishGain = audio.createGain();
    swishGain.gain.value = 0;
    noise.connect(filter).connect(swishGain).connect(audio.destination);
    noise.start();
  } catch { audio = null; }
}

function tone(freq, time, length, type = 'sine', volume = 0.2) {
  if (!audio || !state.sound) return;
  const t = audio.currentTime + time;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + length + 0.02);
}
const pop = () => { tone(660, 0, 0.08, 'triangle', 0.22); tone(990, 0.05, 0.12, 'triangle', 0.16); };
const chime = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1 + i * 0.09, 0.35, 'triangle', 0.16));
const boop = () => { tone(330, 0.05, 0.18, 'square', 0.06); tone(247, 0.21, 0.25, 'square', 0.06); };
const tap = () => tone(180 + Math.random() * 40, 0, 0.05, 'sine', 0.08);

/* ---------- voice (on its own page; inside Sprouts the host reads) ---------- */

let sproutsVoice = null;
import('../../lib/speech.js?v=grass1').then((mod) => { sproutsVoice = mod; }).catch(() => {});

function speak(text) {
  if (!text || embedded) return;
  const data = sproutsSettings();
  if (data.sound === false) return;
  if (sproutsVoice) {
    try {
      const context = sproutsVoice.contextFor('grass');
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
  countEl.textContent = total ? `Maze ${Math.min(total, state.step + 1)} / ${total}` : `Maze ${state.step + 1}`;
  starsEl.textContent = `⭐ ${state.stars}`;
}

/** Show a question: a fresh maze with one sign per answer, seen from above first. */
function present(q) {
  state.q = q;
  state.missed = false;
  if (typeof q.round === 'number' && state.source === 'host') state.step = q.round;
  buildLevel(q);
  askText.textContent = q.prompt;
  showEl.innerHTML = q.show || '';
  askEl.classList.remove('done');
  askEl.hidden = false;
  state.phase = 'look';
  state.lookUntil = performance.now() + 1800;
  paintHud();
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
  // The host's own markup: things to count, or a number path.
  q.show = typeof msg.show === 'string' ? msg.show : '';
  if ('sound' in msg) state.sound = msg.sound !== false;
  if (msg.buddy) useBuddy(msg.buddy);
  const key = `${q.round}|${q.prompt}|${q.choices.map(c => c.label).join(',')}`;
  if (key === state.hostKey) return;
  state.hostKey = key;
  state.source = 'host';
  state.pending = q;
  // Mid-maze (a fresh question for the same round) shows at once; after a right answer
  // the loop waits a moment so the cheer is seen first.
  if (state.phase === 'play' || state.phase === 'look') present(q);
}

function reached(spot) {
  const ok = spot.choice.ok;
  if (state.source === 'host') call(window.SproutsSidecar?.pick, spot.choice.index);
  if (ok) {
    if (!state.missed) state.stars++;
    state.step++;
    pop();
    chime();
    toast(state.missed ? 'You found it!' : 'Yes! ⭐', 'good');
    askEl.classList.add('done');
    spot.ring.material.color.set('#7cc46a');
    spot.closed = true;
    spot.lift = 0.001;
    state.phase = 'won';
    state.map = false;
    mapBtn.setAttribute('aria-pressed', 'false');
    paintHud();
    state.nextAt = performance.now() + (state.source === 'local' ? 1700 : 1400);
    return;
  }
  state.missed = true;
  boop();
  toast('Not that one', 'bad');
  spot.closed = true;
  spot.ring.material.color.set('#9a9a9a');
  spot.label.material.opacity = 0.35;
}

function endRound() {
  state.phase = 'end';
  askEl.hidden = true;
  hud.hidden = true;
  titleEl.textContent = 'All done!';
  verdictEl.hidden = false;
  verdictEl.textContent = `⭐ ${state.stars} / ${LOCAL_ROUND}`;
  reasonEl.hidden = false;
  reasonEl.textContent = state.stars === LOCAL_ROUND ? 'Every maze right the first time!' : 'Stars are for the right sign on the first try.';
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
  hintEl.textContent = padState.seen ? 'Left stick runs · A shows the map' : touch ? 'Drag anywhere to run' : 'Use the arrow keys or drag to run';
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

/* Little Sprouts host: boot, ask, clear. */
addEventListener('message', (event) => {
  if (!embedded || event.source !== window.parent) return;
  const data = event.data;
  if (!data || data.source !== SIDECAR_SOURCE) return;
  if (data.type === 'ask') hostAsk(data);
  else if (data.type === 'clear' || data.type === 'arcade') {
    askEl.hidden = true;
    toast('Great running!', 'good');
  }
});
if (embedded) call(window.SproutsSidecar?.need);

/* ---------- loop ---------- */

let last = performance.now();
let lastStep = 0;
const clock = { t: 0 };

function animateRunner(dt, speed) {
  const r = state.runner;
  const m = runnerModel;
  m.group.position.set(r.x, 0, r.z);
  let turn = r.face - m.group.rotation.y;
  turn = Math.atan2(Math.sin(turn), Math.cos(turn));
  m.group.rotation.y += turn * Math.min(1, dt * 14);
  const run = Math.min(1, speed / RUN_SPEED);
  const before = m.stride;
  const stride = m.animate(dt, run, clock.t);
  // A soft step sound each time a foot lands.
  if (run > 0.4 && Math.floor(stride / Math.PI) !== Math.floor(before / Math.PI) && clock.t - lastStep > 0.15) {
    lastStep = clock.t;
    tap();
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  clock.t += dt;
  pollPad();
  const move = readMove(dt);
  const r = state.runner;

  if (state.phase === 'wait' && state.source === 'wait' && now - state.waitSince > 4000) {
    state.source = 'local';
    nextLocal();
  }
  if (state.phase === 'look' && now >= state.lookUntil) state.phase = 'play';
  // Moving during the first look skips it.
  if (state.phase === 'look' && Math.hypot(move.x, move.z) > 0.3 && now > state.lookUntil - 1300) state.phase = 'play';

  let speed = 0;
  if ((state.phase === 'play' || state.phase === 'won') && state.field) {
    const k = state.phase === 'play' ? 1 : 0;
    r.vx = move.x * RUN_SPEED * k;
    r.vz = move.z * RUN_SPEED * k;
    const bx = r.x;
    const bz = r.z;
    moveRunner(r, r.vx * dt, r.vz * dt, state.field.grid);
    speed = Math.hypot(r.x - bx, r.z - bz) / Math.max(dt, 1e-4);
    if (Math.hypot(move.x, move.z) > 0.2 && k) r.face = Math.atan2(move.x, move.z);
    if (state.phase === 'play') {
      const spot = pickupUnder(r, state.spots);
      if (spot) reached(spot);
    }
  }
  if (state.phase === 'won' && now >= state.nextAt) {
    if (state.source === 'local') nextLocal();
    else if (state.pending && state.pending !== state.q) present(state.pending);
  }
  animateRunner(dt, speed);

  for (const s of state.spots) {
    if (s.lift > 0) {
      s.lift += dt;
      s.label.position.y = SIGN_H + 0.6 + s.lift * s.lift * 4;
      s.label.material.rotation = s.lift * 6;
    } else if (!s.closed) s.label.position.y = SIGN_H + 0.6 + Math.sin(now / 420 + s.x) * 0.1;
    if (!s.closed) s.ring.scale.setScalar(1 + Math.sin(now / 300 + s.z) * 0.06);
  }

  grass?.update(clock.t, r);
  moveCamera(dt);

  if (swishGain && audio) {
    const goal = state.sound && state.phase === 'play' ? Math.min(0.05, speed * 0.011) : 0;
    swishGain.gain.setTargetAtTime(goal, audio.currentTime, 0.08);
  }

  renderer.render(scene, camera);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio?.suspend?.().catch(() => {});
  else if (audio && state.phase !== 'menu') audio.resume().catch(() => {});
});

state.sound = sproutsSettings().sound !== false;
resize();
// A quiet maze sways behind the menu while it loads.
buildLevel(normalizeQuestion(localQuestion(Math.random, 1)));
state.spots.forEach(s => { s.label.visible = false; });
state.phase = 'menu';
moveCamera(0, true);
playBtn.disabled = false;
playBtn.textContent = 'Play';
call(window.SproutsSidecar?.ready);
if (new URLSearchParams(location.search).has('debug')) window.__grass = { state, input, grass: () => grass, renderer, buddy: () => runnerModel.kind, useBuddy };
requestAnimationFrame(frame);
