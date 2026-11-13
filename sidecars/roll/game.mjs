/**
 * Marble box — tilt a wooden maze and roll the marble into the pocket with the right answer.
 * The marble is the learner's garden buddy in a clear ball (ADR 0001).
 * Inside Little Sprouts the host sends each question; on its own page the game makes them.
 */
import * as THREE from 'three';
import {
  CELL, WALL, MARBLE_R, POCKET_R,
  makeLevel, cellCenter, wallBoxes, stepMarble, pocketUnder, tiltFromOrientation
} from './logic.mjs?v=roll1';
import { localQuestion, normalizeQuestion, LOCAL_ROUND } from './quiz.mjs?v=roll1';
import { resolveAutoQuality, pixelRatioCap, rendererOptions, isPerformanceTier } from '../../lib/device-tier.mjs?v=low-end1';
import { readPad, moveDirs, actionDown } from '../../lib/pad-core.mjs?v=pad-rt';
import { makeBuddyBall, buddyKind } from '../../lib/buddy3d.mjs?v=ball2';

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
const tiltBtn = $('tilt');
const askEl = $('ask');
const askText = $('askText');
const showEl = $('show');
const toastEl = $('toast');
const hintEl = $('hint');
const stickEl = $('stick');
const SIDECAR_SOURCE = 'sprouts-sidecar';
const WALL_H = 0.7;
const RIM_H = 1.0;
const GLASS_H = 1.7;
const TILT_LOOK = 0.11;

const call = (fn, arg) => { try { return fn?.(arg); } catch { return undefined; } };
const sproutsSettings = () => { try { return JSON.parse(localStorage.getItem('sprouts-v1')) || {}; } catch { return {}; } };
const embedded = window.parent !== window;

/* ---------- state ---------- */

const state = {
  phase: 'menu', // menu | play | drop | won | end
  source: embedded ? 'wait' : 'local',
  waitSince: 0,
  q: null,
  pending: null,
  hostKey: '',
  level: null,
  boxes: [],
  pockets: [],
  marble: { x: 0, z: 0, vx: 0, vz: 0, y: MARBLE_R },
  drop: null,
  step: 0,
  stars: 0,
  missed: false,
  localIndex: 0,
  nextAt: 0,
  sound: true
};

/* ---------- three.js scene ---------- */

const tier = resolveAutoQuality({ embedded });
const lowGpu = isPerformanceTier(tier);
const renderer = new THREE.WebGLRenderer({ canvas: stage, ...rendererOptions(tier) });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap(tier)));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#efe3cf');
scene.fog = new THREE.Fog('#efe3cf', 40, 90);
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

scene.add(new THREE.HemisphereLight('#fff6e6', '#8a6a48', 1.5));
const sun = new THREE.DirectionalLight('#fff1d6', 2.1);
sun.position.set(-6, 14, 8);
scene.add(sun);

function woodTexture(base, line, repeat = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 46; i++) {
    const y = Math.random() * 256;
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.08 + Math.random() * 0.14;
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 256; x += 32) ctx.lineTo(x, y + Math.sin(x / 40 + i) * 3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}

const MATS = {
  table: new THREE.MeshStandardMaterial({ map: woodTexture('#9c6b43', '#5a3820', 6), roughness: 0.85 }),
  floor: new THREE.MeshStandardMaterial({ map: woodTexture('#e2c497', '#a4774a', 2), roughness: 0.75 }),
  wall: new THREE.MeshStandardMaterial({ map: woodTexture('#c08d55', '#7a5230', 1), roughness: 0.6 }),
  rim: new THREE.MeshStandardMaterial({ map: woodTexture('#8f5e36', '#4f3119', 1), roughness: 0.6 }),
  glass: new THREE.MeshStandardMaterial({ color: '#e6f6ff', transparent: true, opacity: 0.16, roughness: 0.05, depthWrite: false }),
  hole: new THREE.MeshBasicMaterial({ color: '#241a10' }),
  start: new THREE.MeshStandardMaterial({ color: '#9cc27f', roughness: 0.9 }),
  shadow: new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28, depthWrite: false })
};

const table = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), MATS.table);
table.rotation.x = -Math.PI / 2;
table.position.y = -0.9;
scene.add(table);

const tray = new THREE.Group();
scene.add(tray);
let levelGroup = null;

// The marble is the learner's garden buddy in a clear ball; the host's ask can swap it.
let marble = makeBuddyBall(THREE, buddyKind(), MARBLE_R);
let marbleMesh = marble.group;
function setBuddy(kind) {
  if (kind === marble.kind) return;
  const next = makeBuddyBall(THREE, kind, MARBLE_R);
  next.group.position.copy(marbleMesh.position);
  next.group.scale.copy(marbleMesh.scale);
  const parent = marbleMesh.parent;
  if (parent) { parent.remove(marbleMesh); parent.add(next.group); }
  marble.dispose();
  marble = next;
  marbleMesh = next.group;
}
const marbleShadow = new THREE.Mesh(new THREE.CircleGeometry(MARBLE_R * 1.05, 24), MATS.shadow);
marbleShadow.rotation.x = -Math.PI / 2;
marbleShadow.renderOrder = 2;

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

function disposeGroup(group) {
  group.traverse((o) => {
    if (o.isMesh || o.isSprite) {
      if (o.geometry && !o.userData.shared) o.geometry.dispose();
      if (o.material && !Object.values(MATS).includes(o.material)) {
        o.material.map?.dispose();
        o.material.dispose();
      }
    }
  });
}

/** Build the box, walls, pockets, and labels for one question. */
function buildLevel(q) {
  if (levelGroup) {
    levelGroup.remove(marbleMesh, marbleShadow);
    tray.remove(levelGroup);
    disposeGroup(levelGroup);
  }
  const wide = innerWidth > innerHeight * 1.15;
  const seed = (Math.random() * 1e9) | 0;
  const level = makeLevel(seed, q.choices.length, state.step, wide);
  const { maze } = level;
  const w = maze.cols * CELL;
  const d = maze.rows * CELL;
  const group = new THREE.Group();

  const floor = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, 0.5, d + 1.2), MATS.floor);
  floor.position.y = -0.25;
  group.add(floor);

  const boxes = wallBoxes(maze);
  const inner = boxes.filter(b => !b.rim);
  const wallMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, WALL_H, 1), MATS.wall, Math.max(1, inner.length));
  const m4 = new THREE.Matrix4();
  inner.forEach((b, i) => {
    m4.makeScale(b.x1 - b.x0, 1, b.z1 - b.z0);
    m4.setPosition((b.x0 + b.x1) / 2, WALL_H / 2, (b.z0 + b.z1) / 2);
    wallMesh.setMatrixAt(i, m4);
  });
  wallMesh.count = inner.length;
  group.add(wallMesh);

  // Outer rim: thick wood, then a glass pane above it.
  const rimT = 0.6;
  const rims = [
    [w + rimT * 2 + WALL, rimT, 0, -(d / 2 + rimT / 2)],
    [w + rimT * 2 + WALL, rimT, 0, d / 2 + rimT / 2],
    [rimT, d + WALL, -(w / 2 + rimT / 2), 0],
    [rimT, d + WALL, w / 2 + rimT / 2, 0]
  ];
  for (const [sx, sz, x, z] of rims) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(sx, RIM_H, sz), MATS.rim);
    rim.position.set(x, RIM_H / 2, z);
    group.add(rim);
    // The near pane stays low so it never hides the maze.
    const near = z > d / 4;
    const paneH = near ? 0.5 : GLASS_H;
    const glass = new THREE.Mesh(sx > sz ? new THREE.BoxGeometry(sx, paneH, 0.08) : new THREE.BoxGeometry(0.08, paneH, sz), MATS.glass);
    glass.position.set(x, RIM_H + (near ? 0.25 : GLASS_H / 2), z);
    glass.renderOrder = 5;
    group.add(glass);
  }
  // Rim boxes for the physics come from wallBoxes; the visible rim sits just outside them.

  const start = cellCenter(maze, maze.start.c, maze.start.r);
  const pad = new THREE.Mesh(new THREE.CircleGeometry(0.7, 28), MATS.start);
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(start.x, 0.005, start.z);
  group.add(pad);

  // Answers go to pockets in a shuffled order.
  const order = q.choices.map((_, i) => i).sort(() => Math.random() - 0.5);
  const pockets = level.pockets.map((cell, k) => {
    const choice = q.choices[order[k]];
    const at = cellCenter(maze, cell.c, cell.r);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(POCKET_R, 32), MATS.hole);
    hole.rotation.x = -Math.PI / 2;
    hole.position.set(at.x, 0.006, at.z);
    const ringMat = new THREE.MeshStandardMaterial({ color: '#f3d36b', roughness: 0.4, metalness: 0.2 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(POCKET_R, 0.09, 10, 36), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(at.x, 0.03, at.z);
    const labelMat = new THREE.SpriteMaterial({ map: choiceTexture(choice), depthTest: false, transparent: true });
    const label = new THREE.Sprite(labelMat);
    label.scale.set(1.45, 1.45, 1);
    label.position.set(at.x, 1.25, at.z);
    label.renderOrder = 10;
    group.add(hole, ring, label);
    return { ...at, choice, closed: false, ring, label, hole };
  });

  group.add(marbleMesh, marbleShadow);
  tray.add(group);
  levelGroup = group;
  state.level = level;
  state.boxes = boxes;
  state.pockets = pockets;
  placeMarbleAtStart();
  fitCamera();
}

function placeMarbleAtStart() {
  const { maze } = state.level;
  const start = cellCenter(maze, maze.start.c, maze.start.r);
  Object.assign(state.marble, { x: start.x, z: start.z, vx: 0, vz: 0, y: MARBLE_R });
  marbleMesh.scale.setScalar(1);
}

/** Pull the camera back until the whole box fits between the question and the bottom edge. */
function fitCamera() {
  const w = innerWidth;
  const h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  if (!state.level) {
    camera.position.set(0, 18, 9);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    return;
  }
  const { maze } = state.level;
  const hw = (maze.cols * CELL) / 2 + 0.9;
  const hd = (maze.rows * CELL) / 2 + 0.9;
  const corners = [];
  for (const x of [-hw, hw]) for (const z of [-hd, hd]) for (const y of [0, RIM_H + 0.6]) corners.push(new THREE.Vector3(x, y, z));
  // Leave room at the top for the HUD and question, in screen fractions.
  const topLimit = 1 - (2 * Math.min(170, h * 0.3)) / h;
  const bottomLimit = -1 + (2 * 30) / h;
  const sideLimit = 1 - (2 * 14) / w;
  const dir = new THREE.Vector3(0, 1, 0.42).normalize();
  const target = new THREE.Vector3();
  let lo = 4;
  let hi = 120;
  let shift = 0;
  for (let pass = 0; pass < 2; pass++) {
    lo = 4; hi = 120;
    for (let i = 0; i < 30; i++) {
      const dist = (lo + hi) / 2;
      target.set(0, 0, shift);
      camera.position.copy(target).addScaledVector(dir, dist);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      let ok = true;
      let top = -Infinity;
      let bottom = Infinity;
      for (const c of corners) {
        const p = c.clone().project(camera);
        top = Math.max(top, p.y);
        bottom = Math.min(bottom, p.y);
        if (Math.abs(p.x) > sideLimit) ok = false;
      }
      if (top - bottom > topLimit - bottomLimit) ok = false;
      if (ok) hi = dist; else lo = dist;
    }
    // Center the box in the free band below the question.
    camera.position.copy(target).addScaledVector(dir, hi);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    let top = -Infinity;
    let bottom = Infinity;
    for (const c of corners) {
      const p = c.clone().project(camera);
      top = Math.max(top, p.y);
      bottom = Math.min(bottom, p.y);
    }
    const want = (topLimit + bottomLimit) / 2;
    const have = (top + bottom) / 2;
    // Moving the target toward the viewer (+z) moves the box up the screen.
    shift += (want - have) * hd * 0.9;
  }
  camera.position.copy(target).addScaledVector(dir, hi);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
}
addEventListener('resize', fitCamera);

/* ---------- input ---------- */

const input = {
  keys: new Set(),
  drag: null,
  pad: { x: 0, z: 0 },
  phone: { x: 0, z: 0 },
  tiltOn: false,
  center: null,
  tilt: { x: 0, z: 0 }
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
  const span = 60;
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

/* Phone tilt, read here in the game so it can steer in every direction. */
const touch = matchMedia('(any-pointer: coarse)').matches || (navigator.maxTouchPoints || 0) > 0;
const canTilt = touch && 'DeviceOrientationEvent' in window;
tiltBtn.hidden = !canTilt;

function onOrientation(e) {
  if (!input.tiltOn || e.beta == null || e.gamma == null) return;
  const angle = screen.orientation?.angle ?? window.orientation ?? 0;
  if (!input.center) input.center = { beta: e.beta, gamma: e.gamma };
  input.phone = tiltFromOrientation(e.beta, e.gamma, input.center, angle);
}

async function toggleTilt() {
  wakeAudio();
  if (input.tiltOn) {
    input.tiltOn = false;
    input.phone = { x: 0, z: 0 };
  } else {
    let allowed = true;
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      try { allowed = (await DeviceOrientationEvent.requestPermission()) === 'granted'; } catch { allowed = false; }
    }
    if (allowed) {
      input.tiltOn = true;
      input.center = null;
      addEventListener('deviceorientation', onOrientation);
      toast('Hold it flat, then tip', 'good');
    } else toast('Drag to tilt instead', 'bad');
  }
  tiltBtn.setAttribute('aria-pressed', String(input.tiltOn));
  tiltBtn.textContent = input.tiltOn ? '📱 Tilt on' : '📱 Tilt';
  try { localStorage.setItem('roll-tilt', input.tiltOn ? 'on' : 'off'); } catch { /* not saved */ }
}
tiltBtn.addEventListener('click', toggleTilt);

const padState = { action: false, seen: false };
function pollPad() {
  let pads = [];
  try { pads = [...(navigator.getGamepads?.() || [])].filter(Boolean); } catch { pads = []; }
  if (!pads.length) { input.pad = { x: 0, z: 0 }; return; }
  const raw = readPad(pads[0]);
  if (!padState.seen) {
    padState.seen = true;
    document.body.classList.add('pad');
  }
  const dirs = moveDirs(raw);
  const stick = Math.hypot(raw.lx, raw.ly) > 0.2;
  input.pad = stick ? { x: raw.lx, z: raw.ly } : { x: dirs.x, z: dirs.y };
  const action = actionDown(raw, padState.action) || raw.start >= 0.5;
  if (!overlay.hidden) {
    playBtn.classList.add('pad-focus');
    if (action && !padState.action && !playBtn.disabled) playBtn.click();
  }
  padState.action = action;
}

/** The push this frame: the strongest of the inputs, eased so keys feel like a tilt. */
function readTilt(dt) {
  let kx = 0;
  let kz = 0;
  for (const code of input.keys) {
    kx += KEY_DIRS[code][0];
    kz += KEY_DIRS[code][1];
  }
  const sources = [
    { x: kx, z: kz },
    input.drag ? { x: input.drag.x, z: input.drag.z } : { x: 0, z: 0 },
    input.pad,
    input.tiltOn ? input.phone : { x: 0, z: 0 }
  ];
  let want = { x: 0, z: 0 };
  let best = 0;
  for (const s of sources) {
    const len = Math.hypot(s.x, s.z);
    if (len > best) { best = len; want = s; }
  }
  const len = Math.hypot(want.x, want.z);
  if (len > 1) want = { x: want.x / len, z: want.z / len };
  const ease = 1 - Math.exp(-dt * 12);
  input.tilt.x += (want.x - input.tilt.x) * ease;
  input.tilt.z += (want.z - input.tilt.z) * ease;
  return input.tilt;
}

/* ---------- sound ---------- */

let audio = null;
let rollGain = null;
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
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = last * 0.96 + (Math.random() * 2 - 1) * 0.04;
      data[i] = last * 6;
    }
    const noise = audio.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    rollGain = audio.createGain();
    rollGain.gain.value = 0;
    noise.connect(filter).connect(rollGain).connect(audio.destination);
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

let lastClack = 0;
function clack(strength) {
  const now = performance.now();
  if (strength < 1 || now - lastClack < 70) return;
  lastClack = now;
  tone(900 + Math.random() * 300, 0, 0.06, 'triangle', Math.min(0.25, strength * 0.035));
}
const plunk = () => { tone(220, 0, 0.18, 'sine', 0.3); tone(140, 0.08, 0.25, 'sine', 0.25); };
const chime = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 + i * 0.09, 0.35, 'triangle', 0.16));
const boop = () => { tone(330, 0.1, 0.18, 'square', 0.06); tone(247, 0.26, 0.25, 'square', 0.06); };

/* ---------- voice (on its own page; inside Sprouts the host reads) ---------- */

let sproutsVoice = null;
import('../../lib/speech.js?v=ball2').then((mod) => { sproutsVoice = mod; }).catch(() => {});

function speak(text) {
  if (!text || embedded) return;
  const data = sproutsSettings();
  if (data.sound === false) return;
  if (sproutsVoice) {
    try {
      const context = sproutsVoice.contextFor('roll');
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

/** Show a question: a fresh maze with one pocket per answer. */
function present(q) {
  state.q = q;
  state.missed = false;
  state.drop = null;
  if (typeof q.round === 'number' && state.source === 'host') state.step = q.round;
  buildLevel(q);
  input.center = null;
  askText.textContent = q.prompt;
  showEl.innerHTML = q.show || '';
  askEl.classList.remove('done');
  askEl.hidden = false;
  state.phase = 'play';
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
  setBuddy(buddyKind(msg.buddy));
  const key = `${q.round}|${q.prompt}|${q.choices.map(c => c.label).join(',')}`;
  if (key === state.hostKey) return;
  state.hostKey = key;
  state.source = 'host';
  state.pending = q;
  // Mid-maze (a fresh question for the same round) shows at once; after a right answer
  // the loop waits a moment so the cheer is seen first.
  if (state.phase === 'play') present(q);
}

function dropInto(pocket) {
  state.phase = 'drop';
  state.drop = { pocket, t: 0, from: { x: state.marble.x, z: state.marble.z } };
  plunk();
}

function landed(pocket) {
  const ok = pocket.choice.ok;
  if (state.source === 'host') call(window.SproutsSidecar?.pick, pocket.choice.index);
  if (ok) {
    if (!state.missed) state.stars++;
    state.step++;
    chime();
    toast(state.missed ? 'You found it!' : 'Yes! ⭐', 'good');
    askEl.classList.add('done');
    pocket.ring.material.color.set('#7cc46a');
    state.phase = 'won';
    paintHud();
    state.nextAt = performance.now() + (state.source === 'local' ? 1500 : 1200);
    return;
  }
  state.missed = true;
  boop();
  toast('Not that one', 'bad');
  pocket.closed = true;
  pocket.ring.material.color.set('#9a9a9a');
  pocket.label.material.opacity = 0.35;
  pocket.hole.material = new THREE.MeshBasicMaterial({ color: '#7a6a58' });
  placeMarbleAtStart();
  marbleMesh.scale.setScalar(0.01);
  state.phase = 'play';
}

function endRound() {
  state.phase = 'end';
  askEl.hidden = true;
  hud.hidden = true;
  titleEl.textContent = 'All done!';
  verdictEl.hidden = false;
  verdictEl.textContent = `⭐ ${state.stars} / ${LOCAL_ROUND}`;
  reasonEl.hidden = false;
  reasonEl.textContent = state.stars === LOCAL_ROUND ? 'Every maze right the first time!' : 'Stars are for the right pocket on the first try.';
  intro.forEach(el => { el.hidden = true; });
  playBtn.textContent = 'Play again';
  overlay.hidden = false;
  speak(`All done! You earned ${state.stars} stars.`);
}

function startGame() {
  wakeAudio();
  overlay.hidden = true;
  hud.hidden = false;
  hintEl.hidden = touch && !input.tiltOn ? false : true;
  if (!touch) hintEl.textContent = 'Use the arrow keys or drag to tilt the box';
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
    toast('Great rolling!', 'good');
  }
});
if (embedded) call(window.SproutsSidecar?.need);

/* ---------- loop ---------- */

const axis = new THREE.Vector3();
let last = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  pollPad();
  const tilt = readTilt(dt);
  const m = state.marble;

  if (state.phase === 'wait' && state.source === 'wait' && now - state.waitSince > 4000) {
    state.source = 'local';
    nextLocal();
  }

  let speed = 0;
  if (state.phase === 'play' && state.level) {
    if (marbleMesh.scale.x < 1) marbleMesh.scale.setScalar(Math.min(1, marbleMesh.scale.x + dt * 4));
    const hit = stepMarble(m, tilt, dt, state.boxes, state.pockets);
    clack(hit);
    speed = Math.hypot(m.vx, m.vz);
    const pocket = pocketUnder(m, state.pockets);
    if (pocket) dropInto(pocket);
  } else if (state.phase === 'drop' && state.drop) {
    const d = state.drop;
    d.t += dt / 0.35;
    const k = Math.min(1, d.t);
    m.x = d.from.x + (d.pocket.x - d.from.x) * k;
    m.z = d.from.z + (d.pocket.z - d.from.z) * k;
    m.y = MARBLE_R - k * MARBLE_R * 1.6;
    marbleMesh.scale.setScalar(1 - k * 0.35);
    if (d.t >= 1) {
      state.drop = null;
      landed(d.pocket);
    }
  } else if (state.phase === 'won' && now >= state.nextAt) {
    if (state.source === 'local') nextLocal();
    else if (state.pending && state.pending !== state.q) present(state.pending);
  }
  if (state.phase === 'play') m.y = MARBLE_R;

  // Roll the shell the way it moves; the buddy inside turns to face that way and runs.
  if (speed > 0.01) {
    axis.set(m.vz, 0, -m.vx).normalize();
    marble.roll(axis, (speed * dt) / MARBLE_R);
  }
  marble.animate(dt, state.phase === 'play' ? m.vx : 0, state.phase === 'play' ? m.vz : 0, now / 1000);
  marbleMesh.position.set(m.x, m.y, m.z);
  marbleShadow.position.set(m.x + 0.12, 0.012, m.z + 0.08);
  marbleShadow.visible = state.phase !== 'drop' && marbleMesh.scale.x > 0.5;

  // The box leans with the push so the tilt is easy to see.
  const lean = state.phase === 'play' ? tilt : { x: 0, z: 0 };
  tray.rotation.x += (lean.z * TILT_LOOK - tray.rotation.x) * Math.min(1, dt * 10);
  tray.rotation.z += (-lean.x * TILT_LOOK - tray.rotation.z) * Math.min(1, dt * 10);

  for (const p of state.pockets) {
    if (!p.closed) p.label.position.y = 1.25 + Math.sin(now / 400 + p.x) * 0.08;
  }

  if (rollGain && audio) {
    const want = state.sound && state.phase === 'play' ? Math.min(0.5, speed * 0.06) : 0;
    rollGain.gain.setTargetAtTime(want, audio.currentTime, 0.05);
  }

  renderer.render(scene, camera);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio?.suspend?.().catch(() => {});
  else if (audio && state.phase !== 'menu') audio.resume().catch(() => {});
});

state.sound = sproutsSettings().sound !== false;
fitCamera();
try { if (localStorage.getItem('roll-tilt') === 'on' && canTilt && typeof DeviceOrientationEvent?.requestPermission !== 'function') toggleTilt(); } catch { /* off */ }
// A quiet box sits behind the menu while it loads.
buildLevel(normalizeQuestion(localQuestion(Math.random, 1)));
state.pockets.forEach(p => { p.label.visible = false; });
state.phase = 'menu';
playBtn.disabled = false;
playBtn.textContent = 'Play';
call(window.SproutsSidecar?.ready);
if (new URLSearchParams(location.search).has('debug')) window.__roll = { state, input };
requestAnimationFrame(frame);
