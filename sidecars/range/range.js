import * as THREE from 'three';
import { questionHolding } from '../../lib/hold.js?v=hold2';
import {
  EYE, STAND_DIST, assignAsk, clearRange, createRange, markRange, nudgeRange, setRangeMode, shootRange, stepRange, typeRange, walkRange
} from './sim.mjs?v=range4';
import { BUILDINGS, PLANTER, YARD } from './map.mjs';
import { buildPlaza } from './plaza.js?v=range4';
import { createSound } from './sound.mjs?v=range4';
import { actionDown, axisDir, moveDirs, readPad } from '../../lib/pad-core.mjs?v=pad-rt';
import {
  resolveAutoQuality, pixelRatioCap, rendererOptions, isPerformanceTier
} from '../../lib/device-tier.mjs?v=low-end1';

const SOURCE = 'sprouts-sidecar';
const MODE_KEY = 'sprouts-range-mode';
const DIST = STAND_DIST;
const DRAG_RATE = 0.004;
const STEP_EVERY = 1.5;
const PAINT = ['#e8453c', '#f2a93b', '#f6d84a', '#4fbf6a', '#3b8fe8', '#9b5de5', '#f15bb5'];
const view = document.getElementById('view');
const cross = document.getElementById('cross');
const promptEl = document.getElementById('prompt');
const showEl = document.getElementById('show');
const slotsEl = document.getElementById('slots');
const spellTypeEl = document.getElementById('spellType');
const spellInput = document.getElementById('spellInput');
const noteEl = document.getElementById('note');
const modeBtn = document.getElementById('modeBtn');
const hearBtn = document.getElementById('hearBtn');
const gearsEl = document.getElementById('gears');
const countEl = document.getElementById('count');
const doneEl = document.getElementById('done');
const mapEl = document.getElementById('map');
const mapDraw = mapEl.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const visualTier = resolveAutoQuality({ embedded: true });
const lowGpu = isPerformanceTier(visualTier);
const solo = window.parent === window;
const state = createRange({ reduced });
const sound = createSound();
const aimRate = reduced ? 0.6 : 0.95;
const turnRate = reduced ? 1.3 : 1.9;
const keys = new Set();
const held = { aimLeft: false, aimRight: false, aimUp: false, aimDown: false };
let drag = null;
let last = 0;
let needed = 0;
let noteUntil = 0;
let boardKey = '';
let stride = 0;
let bob = 0;
// Controller latch. lib/pad.js leaves this frame alone, so the range reads pad-core itself.
const padHeld = { action: false };

let renderer;
try {
  renderer = new THREE.WebGLRenderer(rendererOptions(visualTier));
  if (!renderer.getContext()) throw new Error('no-webgl');
} catch (err) {
  noteEl.hidden = false;
  noteEl.textContent = 'This device needs WebGL. Update the browser or turn on hardware acceleration.';
  promptEl.textContent = 'Shooting range needs a newer browser';
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap(visualTier)));
renderer.setSize(view.clientWidth, view.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x9fd2ef);
view.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9fd2ef, 30, 95);
const camera = new THREE.PerspectiveCamera(60, view.clientWidth / Math.max(1, view.clientHeight), 0.05, 200);
camera.rotation.order = 'YXZ';
camera.position.set(0, EYE, 0);
scene.add(camera);
const sunLight = new THREE.DirectionalLight(0xfff4dd, 1.6);
sunLight.position.set(-6, 14, 8);
scene.add(new THREE.AmbientLight(0xffffff, 1.1), sunLight);

const lambert = color => new THREE.MeshLambertMaterial({ color });

// Stand mode: the counter, the lane, and the berm behind the boards.
const standGroup = new THREE.Group();
scene.add(standGroup);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), lambert(0x7fb35a));
ground.rotation.x = -Math.PI / 2;
standGroup.add(ground);

const lane = new THREE.Mesh(new THREE.PlaneGeometry(10, 18), lambert(0xc9b27c));
lane.rotation.x = -Math.PI / 2;
lane.position.set(0, 0.01, -9);
standGroup.add(lane);

const wood = lambert(0x9a6a3c);
const counter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 0.7), wood);
counter.position.set(0, 1.05, -0.75);
const front = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1, 0.08), lambert(0xc8452f));
front.position.set(0, 0.5, -1.06);
standGroup.add(counter, front);

const berm = new THREE.Mesh(new THREE.BoxGeometry(60, 5, 6), lambert(0x5f8f45));
berm.position.set(0, 2.2, -DIST - 9);
standGroup.add(berm);

const trunk = lambert(0x7a5230);
const leaves = lambert(0x3f7a3a);
const treeCount = lowGpu ? 4 : 10;
for (let index = 0; index < treeCount; index++) {
  const side = index % 2 ? 1 : -1;
  const x = side * (9 + (index * 3.7) % 12);
  const z = -6 - ((index * 5.3) % 22);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.6, 6), trunk);
  stem.position.set(x, 0.8, z);
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3.2, 7), leaves);
  top.position.set(x, 3.1, z);
  standGroup.add(stem, top);
}

// Walk mode: the plaza is built the first time someone picks Walk.
let plaza = null;

// The blaster rides with the camera, low and to the right.
const blaster = new THREE.Group();
const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.42), lambert(0x2f7fc4));
const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 10), lambert(0xf2c14e));
barrel.rotation.x = Math.PI / 2;
barrel.position.set(0, 0.02, -0.33);
const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.08), lambert(0xe86a3a));
grip.position.set(0, -0.12, 0.1);
blaster.add(body, barrel, grip);
blaster.position.set(0.32, -0.3, -0.7);
camera.add(blaster);
let kick = 0;

const dart = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), lambert(0xf28c28));
dart.visible = false;
scene.add(dart);
const shot = { from: new THREE.Vector3(), to: new THREE.Vector3(), t: 1 };

const boardRoot = new THREE.Group();
scene.add(boardRoot);
const boardMeshes = new Map();

// Paint splats. One soft blob texture per color, shared by every splat of that color.
const splatTextures = PAINT.map(color => splatTexture(color));
const splatGeometry = new THREE.PlaneGeometry(1, 1);
const groundSplats = [];
const groundRoot = new THREE.Group();
scene.add(groundRoot);

function send(type, extra) {
  if (solo) return;
  const message = { source: SOURCE, type };
  if (extra) Object.assign(message, extra);
  window.parent.postMessage(message, '*');
}

function aimDir(out = new THREE.Vector3()) {
  return out.set(
    Math.sin(state.yaw) * Math.cos(state.pitch),
    Math.sin(state.pitch),
    -Math.cos(state.yaw) * Math.cos(state.pitch)
  );
}

function aimPoint(yaw, pitch, distance, out = new THREE.Vector3()) {
  return out.set(
    Math.sin(yaw) * Math.cos(pitch) * distance,
    EYE + Math.sin(pitch) * distance,
    -Math.cos(yaw) * Math.cos(pitch) * distance
  );
}

function splatTexture(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const draw = canvas.getContext('2d');
  draw.fillStyle = color;
  draw.beginPath();
  draw.arc(64, 64, 30, 0, Math.PI * 2);
  draw.fill();
  for (let index = 0; index < 9; index++) {
    const angle = (index / 9) * Math.PI * 2 + (index % 3) * 0.3;
    const reach = 30 + (index % 4) * 8;
    draw.beginPath();
    draw.arc(64 + Math.cos(angle) * reach, 64 + Math.sin(angle) * reach, 6 + (index % 3) * 4, 0, Math.PI * 2);
    draw.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function splatMaterial() {
  return new THREE.MeshBasicMaterial({
    map: splatTextures[Math.floor(Math.random() * splatTextures.length)],
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2
  });
}

function drawShape(draw, shape, x, y, r) {
  draw.beginPath();
  if (shape === 'oval') draw.ellipse(x, y, r * 1.45, r * 0.9, 0, 0, Math.PI * 2);
  else if (shape === 'square') draw.rect(x - r, y - r, r * 2, r * 2);
  else if (shape === 'rectangle') draw.rect(x - r * 1.5, y - r * 0.8, r * 3, r * 1.6);
  else if (shape === 'triangle' || shape === 'diamond' || shape === 'hexagon') {
    const sides = shape === 'triangle' ? 3 : shape === 'diamond' ? 4 : 6;
    for (let index = 0; index < sides; index++) {
      const angle = -Math.PI / 2 + (index / sides) * Math.PI * 2;
      draw.lineTo(x + Math.cos(angle) * r * 1.1, y + Math.sin(angle) * r * 1.1);
    }
    draw.closePath();
  } else if (shape === 'star') {
    for (let index = 0; index < 10; index++) {
      const angle = -Math.PI / 2 + (index / 10) * Math.PI * 2;
      const reach = index % 2 ? r * 0.5 : r * 1.2;
      draw.lineTo(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach);
    }
    draw.closePath();
  } else draw.arc(x, y, r, 0, Math.PI * 2);
  draw.fill();
}

function labelTexture(board) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const draw = canvas.getContext('2d');
  draw.fillStyle = '#f7f4ec';
  draw.fillRect(0, 0, 512, 384);
  draw.strokeStyle = '#f2c9bf';
  draw.lineWidth = 14;
  [170, 120].forEach(r => {
    draw.beginPath();
    draw.arc(256, 192, r, 0, Math.PI * 2);
    draw.stroke();
  });
  draw.strokeStyle = '#c8452f';
  draw.lineWidth = 18;
  draw.strokeRect(9, 9, 494, 366);
  const art = board.shape || board.fill;
  if (art) {
    draw.fillStyle = board.fill || '#5d7a45';
    drawShape(draw, board.shape, 256, 128, 58);
  }
  draw.fillStyle = '#16382c';
  draw.font = `800 ${Math.max(64, Math.min(170, 700 / Math.max(2, board.label.length)))}px Outfit, Trebuchet MS, sans-serif`;
  draw.textAlign = 'center';
  draw.textBaseline = 'middle';
  draw.fillText(board.label, 256, art ? 280 : 196);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function clearBoards() {
  while (boardRoot.children.length) {
    const group = boardRoot.children.pop();
    group.traverse(child => {
      child.geometry?.dispose();
      if (child.material) {
        // Splat textures are shared, so only label maps go.
        if (!splatTextures.includes(child.material.map)) child.material.map?.dispose();
        child.material.dispose();
      }
    });
  }
  boardMeshes.clear();
}

function buildStandBoard(board) {
  const group = new THREE.Group();
  const width = 2 * DIST * Math.tan(board.halfYaw) * 0.94;
  const height = 2 * DIST * Math.tan(board.halfPitch) * 0.94;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: labelTexture(board), side: THREE.DoubleSide })
  );
  const back = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, height + 0.2, 0.12), lambert(0x6b4a2b));
  back.position.z = -0.08;
  const center = aimPoint(board.yaw, board.pitch, DIST);
  // The post stops at the board's bottom edge and stands well behind it, so it never crosses the answer.
  const postHeight = Math.max(0.2, center.y - height / 2 + 0.05);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, postHeight, 0.16), lambert(0x6b4a2b));
  post.position.set(0, -center.y + postHeight / 2, -0.45);
  const tilt = new THREE.Group();
  tilt.add(back, face);
  group.add(post, tilt);
  group.position.copy(center);
  group.lookAt(camera.position.x, center.y, camera.position.z);
  boardRoot.add(group);
  boardMeshes.set(board.index, { group, tilt, faces: [face], width, height, faceZ: 0.01, splats: 0, wobble: 0 });
}

// Walk boards stand on their own in the plaza and read the same from either side.
function buildWalkBoard(board) {
  const group = new THREE.Group();
  const map = labelTexture(board);
  const faceMaterial = new THREE.MeshBasicMaterial({ map });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(board.w, board.h), faceMaterial);
  front.position.z = 0.065;
  const rear = new THREE.Mesh(new THREE.PlaneGeometry(board.w, board.h), faceMaterial.clone());
  rear.position.z = -0.065;
  rear.rotation.y = Math.PI;
  const back = new THREE.Mesh(new THREE.BoxGeometry(board.w + 0.2, board.h + 0.2, 0.12), lambert(0x6b4a2b));
  const postHeight = board.y - board.h / 2 - 0.1;
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, postHeight, 0.16), lambert(0x6b4a2b));
  post.position.set(0, -board.y + postHeight / 2, 0);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.5), lambert(0x6b4a2b));
  foot.position.set(0, -board.y + 0.04, 0);
  const tilt = new THREE.Group();
  tilt.add(back, front, rear);
  group.add(post, foot, tilt);
  group.position.set(board.x, board.y, board.z);
  group.rotation.y = board.face;
  boardRoot.add(group);
  boardMeshes.set(board.index, { group, tilt, faces: [front, rear], width: board.w, height: board.h, faceZ: 0.075, splats: 0, wobble: 0 });
}

function syncBoards() {
  const key = `${state.mode}#${state.askKey}#${state.layout}`;
  if (key !== boardKey) {
    boardKey = key;
    clearBoards();
    state.boards.forEach(state.mode === 'walk' ? buildWalkBoard : buildStandBoard);
  }
  const standing = new Set(state.boards.map(board => board.index));
  boardMeshes.forEach((mesh, index) => { mesh.group.visible = standing.has(index); });
  state.boards.forEach(board => {
    const mesh = boardMeshes.get(board.index);
    if (mesh) mesh.faces.forEach(face => face.material.color.setHex(board.wrong ? 0x8a8a8a : 0xffffff));
  });
}

function splatBoard(event) {
  const mesh = boardMeshes.get(event.index);
  if (!mesh || mesh.splats >= 10) return;
  mesh.splats += 1;
  const size = 0.35 + Math.random() * 0.25;
  const splat = new THREE.Mesh(splatGeometry, splatMaterial());
  splat.scale.set(size, size, 1);
  splat.position.set(
    Math.max(-mesh.width / 2 + 0.15, Math.min(mesh.width / 2 - 0.15, event.u || 0)),
    Math.max(-mesh.height / 2 + 0.15, Math.min(mesh.height / 2 - 0.15, event.v || 0)),
    (event.side < 0 ? -1 : 1) * mesh.faceZ
  );
  if (event.side < 0) splat.rotation.y = Math.PI;
  splat.rotation.z = Math.random() * Math.PI * 2;
  mesh.tilt.add(splat);
}

function splatGround() {
  const dir = aimDir();
  if (dir.y > -0.03) return false;
  const t = camera.position.y / -dir.y;
  if (t > 40) return false;
  const x = camera.position.x + dir.x * t;
  const z = camera.position.z + dir.z * t;
  if (state.mode === 'walk' && (Math.abs(x) > YARD || Math.abs(z) > YARD)) return false;
  const size = 0.4 + Math.random() * 0.3;
  const splat = new THREE.Mesh(splatGeometry, splatMaterial());
  splat.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI * 2);
  splat.scale.set(size, size, 1);
  splat.position.set(x, 0.02, z);
  groundRoot.add(splat);
  groundSplats.push(splat);
  if (groundSplats.length > 30) {
    const old = groundSplats.shift();
    old.material.dispose();
    groundRoot.remove(old);
  }
  shot.ground = t;
  return true;
}

function clearGroundSplats() {
  groundSplats.splice(0).forEach(splat => {
    splat.material.dispose();
    groundRoot.remove(splat);
  });
}

function showNote(text, seconds = 1.2) {
  noteEl.textContent = text;
  noteUntil = performance.now() + seconds * 1000;
}

function fireDart(distance) {
  camera.updateMatrixWorld();
  blaster.localToWorld(shot.from.set(0, 0.02, -0.5));
  shot.to.copy(camera.position).addScaledVector(aimDir(), distance || (state.mode === 'walk' ? 30 : DIST));
  shot.t = 0;
  dart.visible = !reduced;
  kick = 1;
  sound.shoot();
}

function applyEvents(events) {
  events.forEach(event => {
    if (event.type === 'hit') {
      const mesh = boardMeshes.get(event.index);
      if (mesh) mesh.wobble = 1;
      splatBoard(event);
      sound.hit();
    } else if (event.type === 'miss') {
      showNote(state.mode === 'walk' ? 'Missed. Find a board and aim at it.' : 'Missed. Aim at a board.', 0.8);
      sound.miss();
    } else if (event.type === 'letter') sound.letter();
    else if (event.type === 'slip') {
      showNote('Not that letter.', 1);
      sound.wrong();
      demoMissed = true;
      send('slip');
    } else if (event.type === 'pick') {
      if (solo) playDemo(event);
      else send('pick', { index: event.index });
    } else if (event.type === 'gear') {
      sound.gear();
    }
  });
}

function judged(ok) {
  showNote(ok ? 'Yes!' : 'Not yet. Shoot another one.');
  if (ok) sound.right();
  else sound.wrong();
}

function fire() {
  if (questionHolding()) return;
  const events = shootRange(state);
  if (!events.length) return;
  const hit = events.find(event => event.type === 'hit');
  shot.ground = 0;
  const landed = !hit && splatGround();
  fireDart(hit?.t || (landed ? shot.ground : 0));
  if (landed) sound.splat();
  applyEvents(events);
}

// Stand and Walk share the four arrow buttons. In Walk they walk and turn instead of aiming.
const buttonLabels = {
  stand: { aimUp: 'Aim up', aimDown: 'Aim down', aimLeft: 'Aim left', aimRight: 'Aim right' },
  walk: { aimUp: 'Walk forward', aimDown: 'Walk back', aimLeft: 'Turn left', aimRight: 'Turn right' }
};

function applyMode() {
  const walking = state.mode === 'walk';
  if (walking && !plaza) plaza = buildPlaza(scene, { lowGpu });
  standGroup.visible = !walking;
  if (plaza) plaza.group.visible = walking;
  scene.fog.near = walking ? 22 : 30;
  scene.fog.far = walking ? 70 : 95;
  modeBtn.textContent = walking ? '🎯 Stand' : '🚶 Walk';
  modeBtn.setAttribute('aria-pressed', String(walking));
  modeBtn.setAttribute('aria-label', walking ? 'Stand at the counter' : 'Walk around the plaza');
  gearsEl.hidden = !walking;
  mapEl.hidden = !walking;
  Object.entries(buttonLabels[state.mode]).forEach(([id, label]) => document.getElementById(id)?.setAttribute('aria-label', label));
  clearGroundSplats();
  boardKey = '';
}

function chooseMode(mode) {
  if (!setRangeMode(state, mode)) return;
  try { localStorage.setItem(MODE_KEY, state.mode); } catch { /* the choice lasts this visit */ }
  applyMode();
  showNote(state.mode === 'walk' ? 'Walk around and find the boards.' : 'Back at the counter.', 1.6);
}

modeBtn.addEventListener('click', () => {
  if (questionHolding()) return;
  chooseMode(state.mode === 'walk' ? 'stand' : 'walk');
  modeBtn.blur();
});

function hold(button, side) {
  const down = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    held[side] = true;
    button.setPointerCapture?.(event.pointerId);
  };
  const up = event => {
    if (event?.pointerId != null && button.hasPointerCapture?.(event.pointerId)) button.releasePointerCapture(event.pointerId);
    held[side] = false;
  };
  button.addEventListener('pointerdown', down);
  button.addEventListener('pointerup', up);
  button.addEventListener('pointercancel', up);
}
Object.keys(held).forEach(id => hold(document.getElementById(id), id));
document.getElementById('shoot').addEventListener('click', fire);

// Reading the question aloud. Inside Little Sprouts the host reads it (on show, or on replay)
// and holds play while it does. On its own page the range reads with the browser's voice and
// holds play the same way: questionHolding() sees listen-first on this page's body.
let speechWaiting = '';
let speechToken = 0;
function readAloud(text) {
  if (!solo) {
    send('replay');
    return;
  }
  if (!text || !('speechSynthesis' in window)) return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) {
    // Browsers only speak after a first tap or key. Say it then.
    speechWaiting = text;
    return;
  }
  speechWaiting = '';
  const token = ++speechToken;
  const done = () => {
    if (token !== speechToken) return;
    document.body.classList.remove('listen-first');
    sound.duck(false);
  };
  speechSynthesis.cancel();
  const line = new SpeechSynthesisUtterance(text);
  line.rate = 0.95;
  line.onend = done;
  line.onerror = done;
  document.body.classList.add('listen-first');
  sound.duck(true);
  speechSynthesis.speak(line);
  setTimeout(done, 12000);
}

hearBtn.addEventListener('click', () => {
  if (state.ask?.prompt) readAloud(state.ask.prompt);
  hearBtn.blur();
});

// Browsers start audio only after a tap or key in this frame.
function firstGesture() {
  sound.wake();
  if (speechWaiting) readAloud(speechWaiting);
}
window.addEventListener('pointerdown', firstGesture, { capture: true });
window.addEventListener('keydown', firstGesture, { capture: true });

window.addEventListener('keydown', event => {
  if (event.target === spellInput) return;
  if (event.code === 'Space' || event.code === 'Enter') {
    event.preventDefault();
    if (!event.repeat) fire();
    return;
  }
  keys.add(event.code);
  if (event.code.startsWith('Arrow')) event.preventDefault();
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());

const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: 0 };
  renderer.domElement.setPointerCapture?.(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  drag.moved += Math.abs(dx) + Math.abs(dy);
  drag.x = event.clientX;
  drag.y = event.clientY;
  if (drag.moved > 8 && !questionHolding()) nudgeRange(state, dx * DRAG_RATE, -dy * DRAG_RATE);
});
renderer.domElement.addEventListener('pointerup', event => {
  if (!drag || event.pointerId !== drag.id) return;
  const tapped = drag.moved <= 8;
  drag = null;
  if (!tapped || questionHolding()) return;
  // A tap aims where the finger landed, then shoots.
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const dir = ray.ray.direction;
  nudgeRange(state, Math.atan2(dir.x, -dir.z) - state.yaw, Math.asin(Math.max(-1, Math.min(1, dir.y))) - state.pitch);
  fire();
});
renderer.domElement.addEventListener('pointercancel', () => { drag = null; });

spellInput.addEventListener('keydown', event => event.stopPropagation());
spellInput.addEventListener('input', () => {
  const raw = spellInput.value;
  spellInput.value = '';
  if (!raw || questionHolding()) return;
  const events = typeRange(state, raw);
  spellInput.classList.toggle('wrong', events.some(event => event.type === 'slip'));
  if (events.some(event => event.type === 'letter')) fireDart();
  applyEvents(events);
});

function resize() {
  const width = Math.max(1, view.clientWidth);
  const height = Math.max(1, view.clientHeight);
  camera.aspect = width / height;
  camera.fov = width < height ? 72 : 60;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);
resize();

// Stand: arrows, WASD, and the buttons aim.
// Walk: up and down (W, S, ▲, ▼) walk, left and right turn, and A and D step sideways.
function keyInput(dt) {
  const on = code => keys.has(code);
  if (state.mode === 'walk') {
    const forward = (held.aimUp || on('ArrowUp') || on('KeyW') ? 1 : 0) - (held.aimDown || on('ArrowDown') || on('KeyS') ? 1 : 0);
    const turn = (held.aimRight || on('ArrowRight') ? 1 : 0) - (held.aimLeft || on('ArrowLeft') ? 1 : 0);
    const strafe = (on('KeyD') ? 1 : 0) - (on('KeyA') ? 1 : 0);
    if (turn) nudgeRange(state, turn * turnRate * dt, 0);
    return { forward, strafe };
  }
  const x = (held.aimRight || on('ArrowRight') || on('KeyD') ? 1 : 0) - (held.aimLeft || on('ArrowLeft') || on('KeyA') ? 1 : 0);
  const y = (held.aimUp || on('ArrowUp') || on('KeyW') ? 1 : 0) - (held.aimDown || on('ArrowDown') || on('KeyS') ? 1 : 0);
  if (x || y) nudgeRange(state, x * aimRate * dt, y * aimRate * 0.7 * dt);
  return { forward: 0, strafe: 0 };
}

// Same mapping as every Little Sprouts game, and A or the right trigger shoots.
// Stand: left stick or d-pad aims, the right stick fine-aims.
// Walk: left stick walks and steps sideways, the d-pad walks and turns, the right stick looks around.
// B, Y, and Start stay with the host page.
function padInput(dt, quiet) {
  let raw = null;
  for (const candidate of navigator.getGamepads?.() || []) if (candidate) raw = candidate;
  if (!raw) {
    padHeld.action = false;
    return { forward: 0, strafe: 0 };
  }
  const pad = readPad(raw);
  const action = actionDown(pad, padHeld.action);
  const fresh = action && !padHeld.action;
  padHeld.action = action;
  if (quiet) return { forward: 0, strafe: 0 };
  const dirs = moveDirs(pad);
  const stickX = axisDir(pad.lx) ? pad.lx : 0;
  const stickY = axisDir(pad.ly) ? pad.ly : 0;
  const lookX = axisDir(pad.rx) ? pad.rx : 0;
  const lookY = axisDir(pad.ry) ? pad.ry : 0;
  let move = { forward: 0, strafe: 0 };
  if (state.mode === 'walk') {
    const dpadTurn = pad.left || pad.right ? dirs.x : 0;
    const dpadWalk = pad.up || pad.down ? -dirs.y : 0;
    move = { forward: dpadWalk || -stickY, strafe: dpadTurn ? 0 : stickX };
    const turn = dpadTurn + lookX * 1.15;
    if (turn || lookY) nudgeRange(state, turn * turnRate * dt, -lookY * aimRate * dt);
  } else {
    const x = (pad.left || pad.right ? dirs.x : stickX) + lookX * 0.4;
    const y = (pad.up || pad.down ? dirs.y : stickY) + lookY * 0.4;
    if (x || y) nudgeRange(state, x * aimRate * dt, -y * aimRate * 0.7 * dt);
  }
  if (fresh) fire();
  return move;
}

function moveWalker(dt, keyMove, padMove) {
  if (state.mode !== 'walk') return;
  const forward = Math.max(-1, Math.min(1, keyMove.forward + padMove.forward));
  const strafe = Math.max(-1, Math.min(1, keyMove.strafe + padMove.strafe));
  const events = walkRange(state, forward, strafe, dt);
  applyEvents(events);
  const moved = events.moved || 0;
  stride += moved;
  bob += moved * 2.4;
  if (stride >= STEP_EVERY) {
    stride = 0;
    sound.step();
  }
}

// A small map that turns with the learner: forward is always up.
// It shows where every board stands, never which one is right.
function paintMap() {
  if (state.mode !== 'walk') return;
  const size = mapEl.width;
  const half = size / 2;
  const scale = half / 30;
  mapDraw.clearRect(0, 0, size, size);
  mapDraw.save();
  mapDraw.beginPath();
  mapDraw.arc(half, half, half - 2, 0, Math.PI * 2);
  mapDraw.clip();
  mapDraw.translate(half, half);
  mapDraw.rotate(-state.yaw);
  mapDraw.translate(-state.x * scale, -state.z * scale);
  mapDraw.strokeStyle = '#faf9f5aa';
  mapDraw.lineWidth = 3;
  mapDraw.strokeRect(-YARD * scale, -YARD * scale, YARD * 2 * scale, YARD * 2 * scale);
  mapDraw.fillStyle = '#faf9f566';
  BUILDINGS.forEach(box => mapDraw.fillRect((box.x - box.hw) * scale, (box.z - box.hd) * scale, box.hw * 2 * scale, box.hd * 2 * scale));
  mapDraw.beginPath();
  mapDraw.arc(PLANTER.x * scale, PLANTER.z * scale, PLANTER.r * scale, 0, Math.PI * 2);
  mapDraw.fillStyle = '#7fb35a';
  mapDraw.fill();
  mapDraw.fillStyle = '#f2c14e';
  state.gears.forEach(gear => {
    if (gear.taken) return;
    mapDraw.beginPath();
    mapDraw.arc(gear.x * scale, gear.z * scale, 3, 0, Math.PI * 2);
    mapDraw.fill();
  });
  state.boards.forEach(board => {
    mapDraw.save();
    mapDraw.translate(board.x * scale, board.z * scale);
    mapDraw.rotate(-board.face);
    mapDraw.fillStyle = board.wrong ? '#8a8a8a' : '#f7f4ec';
    mapDraw.strokeStyle = '#c8452f';
    mapDraw.lineWidth = 3;
    mapDraw.fillRect(-14, -5, 28, 10);
    mapDraw.strokeRect(-14, -5, 28, 10);
    mapDraw.restore();
  });
  mapDraw.restore();
  mapDraw.fillStyle = '#f28c28';
  mapDraw.beginPath();
  mapDraw.moveTo(half, half - 14);
  mapDraw.lineTo(half + 10, half + 10);
  mapDraw.lineTo(half, half + 4);
  mapDraw.lineTo(half - 10, half + 10);
  mapDraw.closePath();
  mapDraw.fill();
}

function paintHud(now) {
  const ask = state.ask;
  promptEl.textContent = ask?.prompt || (state.mode === 'walk' ? 'Walk around and shoot a board.' : 'Aim at a board and shoot.');
  if ((showEl.dataset.html || '') !== (ask?.show || '')) {
    showEl.dataset.html = ask?.show || '';
    showEl.innerHTML = ask?.show || '';
  }
  const spelling = ask?.kind === 'spell' && ask.word;
  slotsEl.hidden = !spelling;
  spellTypeEl.hidden = !spelling || state.solved;
  if (spelling) slotsEl.textContent = ask.word.split('').map((letter, index) => (index < state.built.length ? letter : '_')).join(' ');
  noteEl.hidden = now > noteUntil;
  cross.classList.toggle('cool', state.cooldown > 0 || state.pending != null || state.solved);
  if (state.mode === 'walk') gearsEl.textContent = `⚙ ${state.gearCount}`;
  const total = ask?.total || 0;
  countEl.hidden = !total;
  if (total) {
    const at = Math.min(total, (Number(ask.round) || 0) + 1);
    countEl.textContent = `${at} / ${total}`;
    countEl.setAttribute('aria-label', `Question ${at} of ${total}`);
  }
  const labels = state.boards.filter(board => !board.wrong).map(board => board.label).join(', ');
  view.setAttribute('aria-label', labels ? `${promptEl.textContent} Boards: ${labels}` : promptEl.textContent);
}

function animate(dt) {
  const walking = state.mode === 'walk';
  const sway = walking && !reduced ? Math.sin(bob) * 0.04 : 0;
  if (walking) camera.position.set(state.x, EYE + sway, state.z);
  else camera.position.set(0, EYE, 0);
  camera.rotation.set(state.pitch, -state.yaw, 0);
  kick = Math.max(0, kick - dt * 6);
  blaster.position.set(0.32 + (walking && !reduced ? Math.cos(bob * 0.5) * 0.012 : 0), -0.3 + sway * 0.4, -0.7 + kick * 0.08);
  blaster.rotation.x = kick * 0.18;
  if (shot.t < 1) {
    shot.t = Math.min(1, shot.t + dt / (walking ? 0.24 : 0.18));
    dart.position.lerpVectors(shot.from, shot.to, shot.t);
    if (shot.t >= 1) dart.visible = false;
  }
  boardMeshes.forEach(mesh => {
    if (mesh.wobble <= 0) return;
    mesh.wobble = Math.max(0, mesh.wobble - dt * 2.2);
    mesh.tilt.rotation.x = reduced ? 0 : -Math.sin(mesh.wobble * 14) * mesh.wobble * 0.2;
  });
  plaza?.update(dt, state);
}

function frame(now) {
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
  last = now;
  if (questionHolding()) {
    // The question is being read. Keep drawing, but take no aim, steps, or shots.
    keys.clear();
    padInput(dt, true);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
    return;
  }
  const keyMove = keyInput(dt);
  const padMove = padInput(dt, false);
  moveWalker(dt, keyMove, padMove);
  stepRange(state, dt);
  if (!solo && (state.solved || !state.ask) && now > needed) {
    needed = now + 1000;
    send('need');
  }
  syncBoards();
  animate(dt);
  paintHud(now);
  paintMap();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// On its own page the range plays a short round of sample questions, then shows the score.
// Inside Little Sprouts the host sets the round length and ends the round itself.
const demos = [
  { kind: 'spell', prompt: 'Spell cat. Shoot the letters in order.', word: 'cat', letters: ['t', 'c', 'o', 'a', 's'], choices: ['cat'], answer: 'cat' },
  { kind: 'math', prompt: 'What is 2 + 2?', choices: ['3', '4', '6'], answer: '4' },
  { kind: 'match', prompt: 'Shoot the word dog.', choices: ['sun', 'dog', 'map', 'cup'], answer: 'dog' },
  { kind: 'match', prompt: 'Shoot the star.', choices: [{ label: 'circle', shape: 'circle', fill: '#5d7a45' }, { label: 'star', shape: 'star', fill: '#5d7a45' }, { label: 'square', shape: 'square', fill: '#5d7a45' }], answer: 'star' },
  { kind: 'spell', prompt: 'Spell sun. Shoot the letters in order.', word: 'sun', letters: ['n', 'u', 'm', 's', 'a'], choices: ['sun'], answer: 'sun' },
  { kind: 'math', prompt: 'What is 3 + 4?', choices: ['6', '7', '9', '8'], answer: '7' }
];
let demoRound = 0;
let demoRight = 0;
let demoMissed = false;

function loadDemo(round) {
  const demo = demos[round];
  demoMissed = false;
  const shown = assignAsk(state, {
    round,
    total: demos.length,
    level: 2,
    kind: demo.kind,
    prompt: demo.prompt,
    word: demo.word,
    letters: demo.letters,
    choices: demo.choices.map(choice => (typeof choice === 'string' ? { label: choice } : choice))
  });
  if (shown) readAloud(demo.prompt);
}

function endDemo() {
  clearRange(state);
  const line = `${demoRight} of ${demos.length} right the first time.`;
  document.getElementById('doneScore').textContent = line;
  doneEl.hidden = false;
  document.getElementById('again').focus();
  readAloud(`Round done! ${line}`);
}

document.getElementById('again').addEventListener('click', () => {
  doneEl.hidden = true;
  demoRound = 0;
  demoRight = 0;
  loadDemo(0);
});

function playDemo(event) {
  if (!state.ask) return;
  const label = state.ask.choices[event.index]?.label;
  const ok = label === demos[demoRound].answer;
  markRange(state, ok);
  judged(ok);
  if (!ok) {
    demoMissed = true;
    return;
  }
  if (!demoMissed) demoRight += 1;
  const round = ++demoRound;
  setTimeout(() => (round >= demos.length ? endDemo() : loadDemo(round)), 900);
}

window.addEventListener('message', event => {
  const data = event.data;
  if (!data || data.source !== SOURCE || event.source !== window.parent) return;
  if (data.type === 'duck') sound.duck(data.on);
  if (data.type === 'ask' && 'sound' in data) sound.setOn(data.sound);
  if (data.type === 'ask' && data.choices && data.choices.length) {
    if (assignAsk(state, data)) send('show');
  }
  if (data.type === 'mark') {
    markRange(state, !!data.ok);
    judged(!!data.ok);
  }
});

let saved = '';
try { saved = localStorage.getItem(MODE_KEY) || ''; } catch { /* Stand is the default */ }
if (new URLSearchParams(location.search).get('mode') === 'walk' || saved === 'walk') setRangeMode(state, 'walk');
applyMode();
if (solo) loadDemo(0);
send('ready');
requestAnimationFrame(frame);
