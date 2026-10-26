import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { questionHolding } from '../../hold.js?v=ask-first';
import { assignAsk, beginArcade, createFlight, markFlight, pitchFlight, steerFlight, stepFlight, strafeFlight, thrustFlight, typeSpell } from './sim.mjs?v=arcade-play';
import { CRUISE_ALT, groundMeters, landColor } from './terrain.mjs';
import AircraftManager from './opensky/aircraft/AircraftManager.js';
import ChaseCameraController from './opensky/camera/ChaseCameraController.js';
import {
  DEFAULT_FOV,
  DEFAULT_NEAR,
  MAX_ROLL,
  ROLL_DAMP_SPEED,
  ROLL_SENSITIVITY
} from './opensky/constants/camera.js';

const SOURCE = 'sprouts-sidecar';
const WORLD = 6;
const view = document.getElementById('view');
const promptEl = document.getElementById('prompt');
const showEl = document.getElementById('show');
const slotsEl = document.getElementById('slots');
const spellTypeEl = document.getElementById('spellType');
const spellInput = document.getElementById('spellInput');
const noteEl = document.getElementById('note');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = createFlight({ reduced });
const keys = new Set();
const held = { left: false, right: false, drag: 0, lift: 0 };
const quizSteer = document.getElementById('quizSteer');
const flypad = document.getElementById('flypad');
let drag = null;
let last = 0;
let needed = 0;
let bankRoll = 0;
let prevYaw = 0;
let gateKey = '';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setSize(view.clientWidth, view.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.55;
renderer.setClearColor(0x8ec6ea);
view.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x9ec8e6, 0.000045);
const camera = new THREE.PerspectiveCamera(DEFAULT_FOV, view.clientWidth / Math.max(1, view.clientHeight), DEFAULT_NEAR, 2000000);
const ambient = new THREE.AmbientLight(0xffffff, 0.45);
const sunLight = new THREE.DirectionalLight(0xfff4dd, 1.35);
scene.add(ambient, sunLight);

const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);
const sun = new THREE.Vector3();
sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 28), THREE.MathUtils.degToRad(180));
const skyUniforms = sky.material.uniforms;
skyUniforms.turbidity.value = 6;
skyUniforms.rayleigh.value = 1.4;
skyUniforms.mieCoefficient.value = 0.003;
skyUniforms.mieDirectionalG.value = 0.75;
skyUniforms.sunPosition.value.copy(sun);
sunLight.position.copy(sun).multiplyScalar(1e5);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(80000, 48),
  new THREE.MeshLambertMaterial({ color: 0x6d9354 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const SEG = 80;
const SPAN = 7200;
const terrainGeo = new THREE.PlaneGeometry(SPAN, SPAN, SEG, SEG);
terrainGeo.rotateX(-Math.PI / 2);
terrainGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(terrainGeo.attributes.position.count * 3), 3));
const terrainMesh = new THREE.Mesh(terrainGeo, new THREE.MeshLambertMaterial({ vertexColors: true }));
terrainMesh.visible = false;
terrainMesh.frustumCulled = false;
const water = new THREE.Mesh(
  new THREE.CircleGeometry(SPAN * 1.6, 40),
  new THREE.MeshLambertMaterial({ color: 0x3c86b0 })
);
water.rotation.x = -Math.PI / 2;
water.position.y = 12;
water.visible = false;
scene.add(terrainMesh, water);
const terrain = { originX: null, originZ: null };

function placeTerrain(worldX, worldZ) {
  const snap = (SPAN / SEG) * 6;
  const ox = Math.round(worldX / snap) * snap;
  const oz = Math.round(worldZ / snap) * snap;
  if (ox === terrain.originX && oz === terrain.originZ) return;
  terrain.originX = ox;
  terrain.originZ = oz;
  terrainMesh.position.set(ox, 0, oz);
  water.position.x = ox;
  water.position.z = oz;
  const pos = terrainGeo.attributes.position;
  const col = terrainGeo.attributes.color;
  for (let index = 0; index < pos.count; index++) {
    const x = ox + pos.getX(index);
    const z = oz + pos.getZ(index);
    const height = groundMeters(x, z);
    pos.setY(index, height);
    const rgb = landColor(height, x, z);
    col.setXYZ(index, rgb[0], rgb[1], rgb[2]);
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;
  terrainGeo.computeVertexNormals();
}

const cloudTexture = cloudSprite();
const clouds = Array.from({ length: 14 }, (_, index) => {
  const material = new THREE.SpriteMaterial({ map: cloudTexture, transparent: true, depthWrite: false, opacity: 0.55 });
  const sprite = new THREE.Sprite(material);
  const scale = 180 + (index % 5) * 70;
  sprite.scale.set(scale * 1.8, scale, 1);
  sprite.position.set((index - 7) * 420, CRUISE_ALT + 140 + (index % 4) * 40, (index % 6) * 360);
  scene.add(sprite);
  return sprite;
});

const aircraft = new AircraftManager(scene);
const chase = new ChaseCameraController();
const aircraftPosition = new THREE.Vector3();
const aircraftQuat = new THREE.Quaternion();
const aircraftEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const gateRoot = new THREE.Group();
scene.add(gateRoot);

aircraft.load(new URL('./models/rafale/Rafale.gltf', import.meta.url).href).catch(() => {
  noteEl.hidden = false;
  noteEl.textContent = 'The plane could not load.';
});

function send(type, extra) {
  if (window.parent === window) return;
  const message = { source: SOURCE, type };
  if (extra) Object.assign(message, extra);
  window.parent.postMessage(message, '*');
}

function clampStick(value) {
  return Math.max(-1, Math.min(1, value || 0));
}

function steerNow() {
  const left = held.left || keys.has('ArrowLeft') || keys.has('KeyA');
  const right = held.right || keys.has('ArrowRight') || keys.has('KeyD');
  return clampStick((right ? 1 : 0) - (left ? 1 : 0) + held.drag);
}

function lookYaw() {
  const left = held.turnLeft || keys.has('ArrowLeft');
  const right = held.turnRight || keys.has('ArrowRight');
  return clampStick((right ? 1 : 0) - (left ? 1 : 0) + held.drag);
}

function lookPitch() {
  const up = held.noseUp || keys.has('ArrowUp');
  const down = held.noseDown || keys.has('ArrowDown');
  return clampStick((up ? 1 : 0) - (down ? 1 : 0) + held.lift);
}

function thrustNow() {
  const forward = held.forward || keys.has('KeyW');
  const back = held.back || keys.has('KeyS');
  return clampStick((forward ? 1 : 0) - (back ? 1 : 0));
}

function slideNow() {
  const left = held.slideLeft || keys.has('KeyA');
  const right = held.slideRight || keys.has('KeyD');
  return clampStick((right ? 1 : 0) - (left ? 1 : 0));
}

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

hold(document.getElementById('left'), 'left');
hold(document.getElementById('right'), 'right');
['noseUp', 'noseDown', 'turnLeft', 'turnRight', 'forward', 'back', 'slideLeft', 'slideRight'].forEach(id => {
  const button = document.getElementById(id);
  if (button) hold(button, id);
});

window.addEventListener('keydown', event => {
  if (event.target === spellInput) return;
  keys.add(event.code);
  if (event.code.startsWith('Arrow') || event.code === 'KeyW' || event.code === 'KeyA' || event.code === 'KeyS' || event.code === 'KeyD') event.preventDefault();
});
window.addEventListener('keyup', event => {
  keys.delete(event.code);
});

renderer.domElement.addEventListener('pointerdown', event => {
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  renderer.domElement.setPointerCapture?.(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  held.drag = Math.max(-1, Math.min(1, (event.clientX - drag.x) / 90));
  held.lift = Math.max(-1, Math.min(1, (drag.y - event.clientY) / 110));
});
function endDrag(event) {
  if (!drag || (event && event.pointerId !== drag.id)) return;
  drag = null;
  held.drag = 0;
  held.lift = 0;
}
renderer.domElement.addEventListener('pointerup', endDrag);
renderer.domElement.addEventListener('pointercancel', endDrag);

function resize() {
  const width = Math.max(1, view.clientWidth);
  const height = Math.max(1, view.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);

function wrap(rad) {
  let angle = rad % (Math.PI * 2);
  if (angle > Math.PI) angle -= Math.PI * 2;
  if (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function cloudSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const draw = canvas.getContext('2d');
  const blob = (x, y, r) => {
    const gradient = draw.createRadialGradient(x, y, r * 0.2, x, y, r);
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    draw.fillStyle = gradient;
    draw.beginPath();
    draw.arc(x, y, r, 0, Math.PI * 2);
    draw.fill();
  };
  blob(90, 70, 60);
  blob(140, 64, 74);
  blob(190, 74, 52);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function labelTexture(gate) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 280;
  const draw = canvas.getContext('2d');
  draw.fillStyle = '#f7f4ec';
  draw.fillRect(0, 0, 512, 280);
  draw.strokeStyle = '#1d3b30';
  draw.lineWidth = 18;
  draw.strokeRect(12, 12, 488, 256);
  if (gate.shape) {
    draw.fillStyle = gate.fill || '#5d7a45';
    draw.beginPath();
    if (gate.shape === 'circle' || gate.shape === 'oval') draw.ellipse(256, 92, gate.shape === 'oval' ? 70 : 46, 46, 0, 0, Math.PI * 2);
    else draw.arc(256, 92, 46, 0, Math.PI * 2);
    draw.fill();
  } else if (gate.fill) {
    draw.fillStyle = gate.fill;
    draw.beginPath();
    draw.arc(256, 88, 40, 0, Math.PI * 2);
    draw.fill();
  }
  draw.fillStyle = '#16382c';
  draw.font = `700 ${Math.max(72, Math.min(150, 620 / Math.max(2, gate.label.length)))}px Outfit, Trebuchet MS, sans-serif`;
  draw.textAlign = 'center';
  draw.textBaseline = 'middle';
  draw.fillText(gate.label, 256, gate.shape || gate.fill ? 190 : 146);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function clearGates() {
  while (gateRoot.children.length) {
    const group = gateRoot.children.pop();
    group.traverse(child => {
      child.geometry?.dispose();
      if (child.material) {
        child.material.map?.dispose();
        child.material.dispose();
      }
    });
  }
}

function buildGate(gate) {
  const group = new THREE.Group();
  const width = Math.max(28, gate.half * 2 * WORLD);
  const post = new THREE.MeshLambertMaterial({ color: 0xf4efe4 });
  const height = 34;
  const left = new THREE.Mesh(new THREE.BoxGeometry(1.6, height, 1.6), post);
  const right = new THREE.Mesh(new THREE.BoxGeometry(1.6, height, 1.6), post);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(width, 1.6, 1.6), post);
  left.position.set(-width / 2, height / 2, 0);
  right.position.set(width / 2, height / 2, 0);
  bar.position.set(0, height, 0);
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.86, width * 0.42),
    new THREE.MeshBasicMaterial({ map: labelTexture(gate), side: THREE.DoubleSide })
  );
  banner.position.set(0, height * 0.72, 0.9);
  group.add(left, right, bar, banner);
  group.position.set(gate.x * WORLD, CRUISE_ALT + 10, -gate.z * WORLD);
  group.rotation.y = -state.gateYaw;
  return group;
}

function syncGates() {
  const key = state.gates.map(gate => `${gate.index}:${gate.label}:${gate.x.toFixed(1)}:${gate.z.toFixed(1)}`).join('|');
  if (key === gateKey) return;
  gateKey = key;
  clearGates();
  state.gates.forEach(gate => gateRoot.add(buildGate(gate)));
}

function clock(seconds) {
  const left = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}

function paintHud() {
  const open = state.free > 0;
  quizSteer.hidden = open || state.over;
  flypad.hidden = !open;
  if (state.over) {
    promptEl.textContent = state.crashed ? 'Game over. The plane hit the ground.' : 'You flew for 2 minutes.';
    if (showEl.dataset.html) {
      showEl.dataset.html = '';
      showEl.innerHTML = '';
    }
    slotsEl.hidden = true;
    spellTypeEl.hidden = true;
    noteEl.hidden = true;
    view.setAttribute('aria-label', promptEl.textContent);
    return;
  }
  if (open) {
    promptEl.textContent = 'Free flight. The plane flies where you look.';
    if (showEl.dataset.html) {
      showEl.dataset.html = '';
      showEl.innerHTML = '';
    }
    slotsEl.hidden = true;
    spellTypeEl.hidden = true;
    noteEl.hidden = false;
    noteEl.textContent = `${clock(state.free)} left`;
    view.setAttribute('aria-label', promptEl.textContent);
    return;
  }
  const ask = state.ask;
  promptEl.textContent = ask?.prompt || 'Hold the buttons. Steer through a gate.';
  if ((showEl.dataset.html || '') !== (ask?.show || '')) {
    showEl.dataset.html = ask?.show || '';
    showEl.innerHTML = ask?.show || '';
  }
  const spelling = ask?.kind === 'spell' && ask.word;
  slotsEl.hidden = !spelling;
  spellTypeEl.hidden = !spelling;
  if (spelling) {
    slotsEl.textContent = ask.word.split('').map((letter, index) => (index < state.built.length ? letter : '_')).join(' ');
  }
  const turning = state.recover > 0;
  if (noteEl.textContent !== 'The plane could not load.') {
    noteEl.hidden = !turning;
    noteEl.textContent = turning ? 'Turning back' : '';
  }
  const labels = state.gates.map(gate => gate.label).join(', ');
  view.setAttribute('aria-label', labels ? `${promptEl.textContent} Gates: ${labels}` : promptEl.textContent);
}

function fly(dt) {
  const yawRate = dt > 0 ? wrap(state.yaw - prevYaw) / dt : 0;
  prevYaw = state.yaw;
  const threeYaw = -state.yaw;
  const targetRoll = Math.max(-MAX_ROLL, Math.min(MAX_ROLL, -yawRate * ROLL_SENSITIVITY));
  bankRoll += (targetRoll - bankRoll) * Math.min(1, ROLL_DAMP_SPEED * dt);
  const nose = state.free > 0 || state.over ? state.nose : -0.08;
  aircraftPosition.set(state.x * WORLD, state.alt, -state.z * WORLD);
  aircraftEuler.set(nose, threeYaw, 0);
  aircraftQuat.setFromEuler(aircraftEuler);
  const aircraftState = {
    position: aircraftPosition,
    yaw: threeYaw,
    pitch: nose,
    yawRate: -yawRate,
    pitchRate: 0,
    quaternion: aircraftQuat,
    roll: bankRoll
  };
  aircraft.update(aircraftState, dt);
  chase.update(aircraftState, camera, dt);
  const open = state.free > 0 || state.over;
  ground.visible = !open;
  terrainMesh.visible = open;
  water.visible = open;
  scene.fog.density = open ? 0.000028 : 0.000045;
  if (open) placeTerrain(aircraftPosition.x, aircraftPosition.z);
  else {
    ground.position.x = aircraftPosition.x;
    ground.position.z = aircraftPosition.z;
  }
  clouds.forEach((sprite, index) => {
    const span = open ? 6400 : 2800;
    const base = ((index - 7) * (open ? 520 : 260) - aircraftPosition.x) % span;
    sprite.position.x = aircraftPosition.x + base;
    sprite.position.y = open ? 640 + (index % 5) * 220 : CRUISE_ALT + 140 + (index % 4) * 40;
    sprite.position.z = aircraftPosition.z + ((index % 6) * (open ? 480 : 240) - (open ? 1200 : 600));
  });
}

function applyEvents(events) {
  events.forEach(event => {
    if (event.type === 'pick') send('pick', { index: event.index });
    else if (event.type === 'slip') send('slip');
    else if (event.type === 'over') send('finish', { detail: event.crashed ? 'crash' : 'flew' });
  });
}

spellInput.addEventListener('keydown', event => event.stopPropagation());
spellInput.addEventListener('input', () => {
  const raw = spellInput.value;
  spellInput.value = '';
  if (!raw) return;
  const events = typeSpell(state, raw);
  if (events.some(event => event.type === 'slip')) spellInput.classList.add('wrong');
  else spellInput.classList.remove('wrong');
  applyEvents(events);
});

function frame(now) {
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
  last = now;
  if (questionHolding()) {
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
    return;
  }
  if (state.free > 0) {
    steerFlight(state, lookYaw());
    pitchFlight(state, lookPitch());
    thrustFlight(state, thrustNow());
    strafeFlight(state, slideNow());
  } else {
    steerFlight(state, steerNow());
    pitchFlight(state, 0);
    thrustFlight(state, 0);
    strafeFlight(state, 0);
  }
  const events = stepFlight(state, dt);
  applyEvents(events);
  if (window.parent === window) playDemo(events);
  const holding = state.free > 0 || state.over;
  if (!holding && (state.solved || !state.ask) && !state.gates.length && now > needed) {
    needed = now + 1000;
    send('need');
  }
  syncGates();
  fly(dt);
  paintHud();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

const demos = [
  { prompt: 'Fly through the word cat.', choices: ['dog', 'cat', 'sun'], answer: 'cat' },
  { prompt: 'Fly through 4.', choices: ['2', '4', '9'], answer: '4' }
];
let demoRound = 0;

function loadDemo(round) {
  const demo = demos[round % demos.length];
  assignAsk(state, {
    round,
    kind: 'match',
    prompt: demo.prompt,
    choices: demo.choices.map(label => ({ label }))
  });
}

function playDemo(events) {
  if (state.over) return;
  events.forEach(event => {
    if (event.type !== 'pick' || !state.ask) return;
    const label = state.ask.choices[event.index]?.label;
    const ok = label === demos[demoRound % demos.length].answer;
    markFlight(state, ok);
    if (!ok) return;
    const round = ++demoRound;
    setTimeout(() => loadDemo(round), 800);
  });
}

function onAsk(data) {
  const shown = assignAsk(state, data);
  if (shown) send('show');
}

window.addEventListener('message', event => {
  const data = event.data;
  if (!data || data.source !== SOURCE || event.source !== window.parent) return;
  if (data.type === 'arcade') beginArcade(state);
  if (data.type === 'ask' && data.choices && data.choices.length) onAsk(data);
  if (data.type === 'mark') markFlight(state, !!data.ok);
});

if (window.parent === window) loadDemo(0);
send('ready');
requestAnimationFrame(frame);
