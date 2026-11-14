/**
 * Garden dash — seen from the side, the garden buddy runs on top of a little round garden
 * that turns under it, and a hungry caterpillar follows close behind. Tap to jump the rocks,
 * logs, and flower pots, and jump to grab carrots. When a question is on, its answers float
 * past at jump height: jump to catch the right one. Endless run has no questions and ends
 * when the caterpillar catches up.
 *
 * Look and feel follow Karim Maaloul's (Yakudoo) running CodePen: the pale sky, the green
 * planet with its see-through shadow layer, tall black trees with cube fruit, flat-shaded
 * blocky models in the same warm colors, the side camera, the red flash on a bump, and the
 * pull-back when you are caught. The buddy, caterpillar, garden things, and code are
 * Little Sprouts' own.
 */
import * as THREE from 'three';
import { mergeGeometries } from '../../vendor/three/addons/utils/BufferGeometryUtils.js';
import {
  R, TOP, SPEED, CHASE, CARROT_H, HIT, ROW_GAP,
  turnRate, endlessSpeed, onGarden, stepChase, chaseAfter, isCaught,
  jumpHeight, jumpTime, answerRow, dist, meters, saveBest
} from './logic.mjs?v=dash2';
import { localQuestion, normalizeQuestion, LOCAL_ROUND } from './quiz.mjs?v=dash2';
import { makeBuddy, buddyKind, BUDDIES } from '../../lib/buddy3d.mjs?v=ball3';
import { resolveAutoQuality, pixelRatioCap, rendererOptions, isPerformanceTier } from '../../lib/device-tier.mjs?v=low-end1';
import { readPad, actionDown, moveDirs } from '../../lib/pad-core.mjs?v=pad-rt';
import { to, killTweensOf, update as tweenUpdate, Ease } from './tween.mjs?v=dash3';

const $ = (id) => document.getElementById(id);
const stage = $('world');
const overlay = $('overlay');
const playBtn = $('play');
const endlessBtn = $('endless');
const titleEl = $('title');
const verdictEl = $('verdict');
const reasonEl = $('reason');
const intro = [$('blurb'), $('help')];
const hud = $('hud');
const distEl = $('distValue');
const starsEl = $('stars');
const carrotsEl = $('carrots');
const askEl = $('ask');
const askText = $('askText');
const showEl = $('show');
const toastEl = $('toast');
const caughtEl = $('caught');
const instructionsEl = $('instructions');
const againEl = $('again');
const overStatsEl = $('overStats');
const SIDECAR_SOURCE = 'sprouts-sidecar';
const HERO_SCALE = 1.8;

const call = (fn, arg) => { try { return fn?.(arg); } catch { return undefined; } };
const sproutsSettings = () => { try { return JSON.parse(localStorage.getItem('sprouts-v1')) || {}; } catch { return {}; } };
const embedded = window.parent !== window;

/* ---------- state ---------- */

const state = {
  phase: 'menu',     // menu | wait | run | over | end
  mode: 'quiz',      // quiz | endless
  arcade: false,
  source: embedded ? 'wait' : 'local',
  waitSince: 0,
  q: null,
  pending: null,
  hostKey: '',
  tried: new Set(),
  answered: false,
  rowDue: 0,
  step: 0,
  stars: 0,
  missed: false,
  localIndex: 0,
  nextAt: 0,
  t: 0,
  floor: 0,          // how far the garden has turned
  distance: 0,
  carrots: 0,
  speed: SPEED.start,
  boostUntil: 0,
  slowUntil: 0,
  tumbleUntil: 0,
  chase: { pos: CHASE.start, target: CHASE.target },
  jumpAt: -1,        // run time the jump started, or -1
  jumpFor: 1,
  y: 0,
  overAt: 0,
  readyToReplay: false,
  asking: true,      // questions come along the run (not in arcade play)
  flash: 0,
  sound: true
};

/* ---------- three.js scene ---------- */

const tier = resolveAutoQuality({ embedded });
const lowGpu = isPerformanceTier(tier);
const renderer = new THREE.WebGLRenderer({ canvas: stage, ...rendererOptions(tier), alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap(tier)));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = !lowGpu;
const FLASH = new THREE.Color('#b44b39');
renderer.setClearColor(FLASH, 0);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#d6eae6', 16, 35);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
const CAM_GAME = new THREE.Vector3(0, 3, 16);
const CAM_OVER = new THREE.Vector3(-3, 6, 26);
const CAM_MENU = new THREE.Vector3(4, 4.5, 19);

scene.add(new THREE.AmbientLight('#ffffff', 2.1));
const sun = new THREE.DirectionalLight('#ffffff', 1.9);
sun.position.set(-3, 4, 2);
sun.castShadow = !lowGpu;
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 0.1, far: 200 });
sun.shadow.mapSize.set(tier === 'cinematic' ? 2048 : 1024, tier === 'cinematic' ? 2048 : 1024);
scene.add(sun);

/** The pen's materials: flat-shaded, no shine. */
const phong = (color, extra = {}) => new THREE.MeshPhongMaterial({ color, flatShading: true, shininess: 0, ...extra });
const MAT = {
  black: phong('#100707'),
  brown: phong('#b44b39'),
  green: phong('#7abf8e'),
  pink: phong('#dc5f45'),
  lightBrown: phong('#e07a57'),
  white: phong('#a49789'),
  cream: phong('#fbf0e4'),
  leaf: phong('#5f9042'),
  leafDark: phong('#4b7a34'),
  stone: phong('#8d8378'),
  yellow: phong('#f2c14e')
};
const shadowed = (o) => { o.traverse(m => { if (m.isMesh) { m.castShadow = !lowGpu; m.receiveShadow = !lowGpu; } }); return o; };

/* The planet: a soft shadow layer over a plain green ball, as in the pen. */
const floor = new THREE.Group();
floor.position.y = -R;
scene.add(floor);
const floorShadow = new THREE.Mesh(new THREE.SphereGeometry(R, 50, 50), new THREE.MeshPhongMaterial({ color: '#7abf8e', specular: '#000000', shininess: 1, transparent: true, opacity: 0.5 }));
floorShadow.receiveShadow = !lowGpu;
const floorGrass = new THREE.Mesh(new THREE.SphereGeometry(R - 0.05, 50, 50), new THREE.MeshBasicMaterial({ color: '#7abf8e' }));
floor.add(floorShadow, floorGrass);

/* ---------- trees: tall dark trunks with little branches and cube fruit ---------- */

const FRUIT_MATS = [MAT.black, MAT.brown, MAT.pink, MAT.white, MAT.green, MAT.lightBrown, MAT.pink, MAT.yellow];

function push(byMat, mat, geo, matrix) {
  geo.applyMatrix4(matrix);
  if (!byMat.has(mat)) byMat.set(mat, []);
  byMat.get(mat).push(geo);
}

/** One tree's pieces, sorted by material, placed with `matrix`. */
function treeParts(byMat, matrix) {
  const height = 5 + Math.random() * 15;
  const top = 0.1 + Math.random() * 0.5;
  const bottom = 0.5 + Math.random() * 0.5;
  const trunk = new THREE.CylinderGeometry(top, bottom, height, 3, 3).toNonIndexed();
  trunk.translate(0, height / 2, 0);
  // Knock the corners about a little, keeping shared corners together.
  const pos = trunk.attributes.position;
  const nudges = new Map();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    if (!nudges.has(key)) nudges.set(key, [(Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2]);
    const [dx, dy, dz] = nudges.get(key);
    pos.setXYZ(i, pos.getX(i) + dx, pos.getY(i) + dy, pos.getZ(i) + dz);
  }
  trunk.computeVertexNormals();
  const corners = [...nudges.keys()].map(k => k.split(',').map(Number));
  push(byMat, MAT.black, trunk, matrix);
  for (const [x, y, z] of corners) {
    if (Math.random() > 0.7) {
      const size = Math.random() * 0.3 + 0.05;
      const fruit = new THREE.BoxGeometry(size, size, size).toNonIndexed();
      fruit.rotateX(Math.random() * Math.PI).rotateY(Math.random() * Math.PI).translate(x, y + 0.3, z);
      push(byMat, FRUIT_MATS[Math.floor(Math.random() * FRUIT_MATS.length)], fruit, matrix);
    }
    if (Math.random() > 0.5 && y > 1 && y < height - 1) {
      const h = 0.3 + Math.random() * 0.5;
      const thick = 0.02 + Math.random() * 0.1;
      const branch = new THREE.CylinderGeometry(thick / 2, thick, h, 3, 1).toNonIndexed();
      branch.translate(0, h / 2, 0);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, 0.2, z).normalize());
      branch.applyQuaternion(q).translate(x, y, z);
      push(byMat, MAT.black, branch, matrix);
    }
  }
}

/** Trees all round the planet, mostly behind the path and a few in front. */
function plantTrees() {
  const n = lowGpu ? 60 : 100;
  const byMat = new Map();
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const phi = i * (Math.PI * 2) / n;
    const theta = Math.PI / 2 + 0.25 + Math.random() * 0.3;
    const p = new THREE.Vector3(Math.sin(theta) * Math.cos(phi) * R, Math.sin(theta) * Math.sin(phi) * (R - 1), Math.cos(theta) * R);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize());
    m.compose(p, q, new THREE.Vector3(1, 1, 1));
    treeParts(byMat, m);
  }
  for (const [mat, geos] of byMat) {
    const merged = mergeGeometries(geos.map(g => { g.deleteAttribute('uv'); return g; }), false);
    geos.forEach(g => g.dispose());
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = !lowGpu;
    mesh.receiveShadow = !lowGpu;
    floor.add(mesh);
  }
}
plantTrees();

/* ---------- garden things: blocky, in the pen's colors ---------- */

const box = (w, h, d, mat, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  return mesh;
};

function makeRock() {
  const g = new THREE.Group();
  const big = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 0), MAT.stone);
  big.scale.set(1.15, 0.85, 1);
  big.position.y = 0.45;
  big.rotation.set(Math.random(), Math.random() * 3, 0);
  const small = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), MAT.white);
  small.position.set(0.55, 0.22, 0.25);
  g.add(big, small, box(0.4, 0.12, 0.4, MAT.leaf, -0.1, 0.92, 0));
  return g;
}

function makePot() {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.38, 0.8, 4, 1), MAT.brown);
  pot.rotation.y = Math.PI / 4;
  pot.position.y = 0.4;
  g.add(pot, box(0.95, 0.16, 0.95, MAT.lightBrown, 0, 0.82), box(0.7, 0.05, 0.7, MAT.black, 0, 0.9));
  for (let i = 0; i < 3; i++) {
    const leaf = box(0.12, 0.55, 0.3, MAT.leaf, (i - 1) * 0.18, 1.15, 0);
    leaf.rotation.z = (i - 1) * 0.5;
    g.add(leaf);
  }
  g.add(box(0.28, 0.28, 0.28, MAT.pink, 0, 1.5, 0), box(0.12, 0.12, 0.3, MAT.yellow, 0, 1.5, 0.05));
  return g;
}

function makeLog() {
  const g = new THREE.Group();
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.5, 6), MAT.lightBrown);
  log.rotation.x = Math.PI / 2;
  log.position.y = 0.42;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.52, 6), MAT.cream);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.42;
  g.add(log, ring, box(0.1, 0.35, 0.1, MAT.leaf, 0.1, 0.95, 0), box(0.25, 0.08, 0.15, MAT.leaf, 0.2, 1.1, 0));
  return g;
}

const OBSTACLES = { rock: makeRock, pot: makePot, log: makeLog };

/** A carrot, as blocky as the rest. */
function makeCarrot() {
  const g = new THREE.Group();
  const spin = new THREE.Group();
  spin.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 1, 4, 1), MAT.pink));
  for (const [z, s] of [[0.3, 1], [-0.3, 1.3]]) {
    const leaf = box(0.5, 1, 0.1, MAT.green, 0, 0.5 + 0.5 * s, 0);
    leaf.scale.y = s;
    leaf.rotation.z = z;
    spin.add(leaf);
  }
  g.add(spin);
  g.userData.spin = spin;
  return g;
}

/* ---------- answer signs: a square board on a stick, floating at jump height ---------- */

function choiceTexture(choice) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const colorOnly = choice.fill && !choice.shape;
  ctx.fillStyle = colorOnly ? choice.fill : '#fbf0e4';
  ctx.fillRect(0, 0, size, size);
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#dc5f45';
  ctx.strokeRect(9, 9, size - 18, size - 18);
  const c = size / 2;
  if (choice.shape) drawShape(ctx, choice.shape, c, c, 72, choice.fill || '#5f9042');
  else if (!colorOnly) {
    let font = 130;
    ctx.font = `800 ${font}px "Trebuchet MS", sans-serif`;
    while (ctx.measureText(choice.label).width > size - 56 && font > 34) {
      font -= 6;
      ctx.font = `800 ${font}px "Trebuchet MS", sans-serif`;
    }
    ctx.fillStyle = '#100707';
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

const SIGN_GEO = new THREE.BoxGeometry(1.9, 1.9, 0.25);
function makeSign(choice) {
  const g = new THREE.Group();
  const face = new THREE.MeshBasicMaterial({ map: choiceTexture(choice), transparent: true });
  const edge = phong('#dc5f45', { transparent: true });
  const board = new THREE.Mesh(SIGN_GEO, [edge, edge, edge, edge, face, edge]);
  g.add(board, box(0.12, 1.2, 0.12, MAT.lightBrown, 0, -1.55, 0));
  shadowed(g);
  return { group: g, face, edge };
}

/* ---------- the hungry caterpillar: blocky segments, a big head, and a jaw ---------- */

function makeCaterpillar() {
  const segs = [];
  const colors = [MAT.leaf, MAT.leafDark];
  const head = new THREE.Group();
  const jaw = new THREE.Group();
  jaw.position.set(0.4, -0.75, 0);
  jaw.add(box(1.3, 0.3, 1.2, MAT.leafDark, 0.55, -0.1, 0), box(0.8, 0.08, 0.5, MAT.pink, 0.5, 0.06, 0));
  for (let i = 0; i < 3; i++) jaw.add(box(0.14, 0.18, 0.14, MAT.cream, 0.4 + i * 0.3, 0.12, 0.42), box(0.14, 0.18, 0.14, MAT.cream, 0.4 + i * 0.3, 0.12, -0.42));
  const holder = new THREE.Group();
  holder.position.set(1.0, 0.1, 0);
  jaw.add(holder);
  head.add(box(1.9, 1.7, 1.7, MAT.leaf), box(0.7, 0.8, 1.3, MAT.leaf, 0.95, -0.15, 0), box(0.4, 0.4, 0.4, MAT.pink, 1.4, 0.15, 0), jaw);
  const eyes = [];
  for (const z of [-0.86, 0.86]) {
    const eye = box(0.6, 0.6, 0.15, MAT.cream, 0.35, 0.35, z);
    eye.add(box(0.28, 0.3, 0.1, MAT.black, 0.12, 0, z > 0 ? 0.08 : -0.08));
    head.add(eye);
    eyes.push(eye);
    const feeler = box(0.09, 0.9, 0.09, MAT.black, -0.2, 1.25, z * 0.5);
    feeler.rotation.x = z > 0 ? -0.3 : 0.3;
    feeler.add(box(0.25, 0.25, 0.25, MAT.pink, 0, 0.5, 0));
    head.add(feeler);
  }
  const headSeg = new THREE.Group();
  head.position.y = 1.1;
  headSeg.add(head);
  segs.push({ group: headSeg, body: head });
  for (let i = 1; i < 7; i++) {
    const size = 1.45 - i * 0.08;
    const seg = new THREE.Group();
    const body = box(size, size, size, colors[i % 2], 0, size / 2 + 0.25, 0);
    seg.add(body);
    for (const z of [-size * 0.35, size * 0.35]) seg.add(box(0.18, 0.4, 0.18, MAT.black, 0, 0.15, z));
    segs.push({ group: seg, body });
  }
  const all = new THREE.Group();
  segs.forEach(s => all.add(s.group));
  shadowed(all);
  return { group: all, segs, head, jaw, eyes, holder };
}

const chaser = makeCaterpillar();
scene.add(chaser.group);

/*
 * The munch scene's poses. The pen tweens its monster's torso, head, mouth, tail, and eyes,
 * and its hero's head and paws; these hold the same values for the caterpillar and buddy.
 */
const CAT_REST = { sit: 0, headZ: 0, headY: 0, jaw: 0.3, tailUp: 0, tailWag: 0, blink: 1 };
const HELD_REST = { x: 0, y: 0, headX: 0, armL: 0, armR: 0, legL: 0, legR: 0, blink: 1 };
const cat = { ...CAT_REST };
const held = { ...HELD_REST };
const look = { y: 0 };      // the buddy glances about, running or hanging
let hanging = false;

/* ---------- path things ---------- */

/** Place a thing on the garden at its turned angle, standing up from the surface. */
function place(obj, angle, h = 0) {
  const p = onGarden(angle, h);
  obj.position.set(p.x, p.y, 0);
  obj.rotation.z = angle - Math.PI / 2;
}

/* The pen keeps one hedgehog going round; here a few garden things take turns. */
const obstacles = [];
const KINDS = ['rock', 'pot', 'log', 'rock'];
KINDS.forEach(kind => {
  const obj = shadowed(OBSTACLES[kind]());
  scene.add(obj);
  obstacles.push({ obj, kind, angle: 0, status: 'ready', fly: 0, parked: false });
});

const carrot = { obj: shadowed(makeCarrot()), angle: 0 };
scene.add(carrot.obj);

/* Bonus burst: pink and green cubes, as the pen does for carrots. */
const burst = { group: new THREE.Group(), parts: [], t: -1 };
for (let i = 0; i < 10; i++) {
  const pink = box(1, 1, 1, MAT.pink);
  const green = box(0.5, 0.5, 0.5, MAT.green);
  burst.parts.push({ mesh: pink, to: new THREE.Vector3(), speed: 1 }, { mesh: green, to: new THREE.Vector3(), speed: 1 });
  burst.group.add(pink, green);
}
burst.group.visible = false;
scene.add(burst.group);
function explode(at) {
  burst.group.position.copy(at);
  burst.group.visible = true;
  burst.t = 0;
  for (const p of burst.parts) {
    p.to.set(-5 + Math.random() * 10, -5 + Math.random() * 10, -5 + Math.random() * 10);
    p.speed = 0.5 + Math.random() * 0.5;
  }
}

/** World angle of something with its own angle. */
const worldAngle = (local) => state.floor + local;
/** Own angle that puts something at a world angle right now. */
const localFor = (world) => world - state.floor;

let row = null;   // { signs: [{ obj, choice, angle, grabbed }] }

function dropRow() {
  if (!row) return;
  for (const s of row.signs) {
    scene.remove(s.obj.group);
    s.obj.face.map?.dispose();
    s.obj.face.dispose();
    s.obj.edge.dispose();
  }
  row = null;
}

/** Send the answers in, one after another, from just past the right edge. */
function spawnRow() {
  if (!state.q) return;
  dropRow();
  const choices = answerRow(state.q.choices, state.tried);
  row = {
    signs: choices.map((choice, i) => {
      const obj = makeSign(choice);
      scene.add(obj.group);
      return { obj, choice, angle: localFor(0.05 - i * ROW_GAP), grabbed: false };
    })
  };
  // Keep the answers' stretch clear: garden things not yet in view wait off to the right.
  for (const o of obstacles) if (o.status === 'ready' && worldAngle(o.angle) < 0.75) o.parked = true;
  if (worldAngle(carrot.angle) < 0.75 && worldAngle(carrot.angle) > -2) carrot.angle = localFor(-2.6);
}

/* ---------- the runner: the learner's garden buddy, flat-shaded like everything else ---------- */

let hero = makeHero(buddyKind());
function makeHero(kind) {
  const b = makeBuddy(THREE, kind, { material: (color) => phong(color), shadow: lowGpu });
  b.group.scale.setScalar(HERO_SCALE);
  b.group.rotation.y = Math.PI / 2;
  shadowed(b.group);
  scene.add(b.group);
  return b;
}
function useBuddy(kind) {
  if (!BUDDIES.includes(kind) || kind === hero.kind) return;
  const old = hero;
  old.group.parent?.remove(old.group);
  old.dispose();
  hero = makeHero(kind);
}

/* ---------- camera ---------- */

const camTo = new THREE.Vector3().copy(CAM_MENU);
const camLook = new THREE.Vector3(0, 3, 0);
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

/** Narrow screens step back so the path ahead stays in view. */
function fitZ(z) {
  const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
  return Math.max(z, 8.5 / half);
}

function moveCamera(dt, snap = false) {
  const goal = state.phase === 'over' || state.phase === 'end' ? CAM_OVER : state.phase === 'menu' ? CAM_MENU : CAM_GAME;
  camTo.set(goal.x, goal.y, fitZ(goal.z));
  // The pen pulls back over three seconds, and eases back in as the run starts again.
  const k = snap ? 1 : 1 - Math.exp(-dt * (state.phase === 'over' || state.phase === 'replay' ? 1.1 : 2));
  camera.position.lerp(camTo, k);
  camera.lookAt(camLook);
  // The pen's fog starts at the camera's distance and fades out by about twice that.
  const reach = camera.position.length();
  scene.fog.near = reach;
  scene.fog.far = reach * 2.2;
}

/* ---------- input: one button, as in the pen ---------- */

function jump() {
  if (state.phase !== 'run' || performance.now() < state.tumbleUntil) return;
  if (state.jumpAt >= 0) return;
  state.jumpAt = state.t;
  state.jumpFor = jumpTime(state.speed);
  boing();
}

/*
 * Little Sprouts' controller layer (lib/pad.js) drives a game frame with keys: the stick and
 * d-pad send arrow keys, and A or the right trigger sends W. B and Y stay with the app (back,
 * hear the question again). So inside Sprouts the game only listens to keys. On its own page
 * it reads the controller itself, with the same buttons.
 */
const menuButtons = () => [playBtn, endlessBtn].filter(b => !b.hidden && !b.disabled);
let menuFocus = 0;
function focusMenu(step) {
  const list = menuButtons();
  if (!list.length) return;
  menuFocus = (menuFocus + step + list.length) % list.length;
  list.forEach((b, i) => b.classList.toggle('pad-focus', i === menuFocus));
}
function pressMenu() {
  const list = menuButtons();
  (list[Math.min(menuFocus, list.length - 1)] || playBtn).click();
}

addEventListener('keydown', (e) => {
  wakeAudio();
  if (!overlay.hidden) {
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyW') { e.preventDefault(); if (!e.repeat) pressMenu(); }
    else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') { e.preventDefault(); focusMenu(-1); }
    else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') { e.preventDefault(); focusMenu(1); }
    return;
  }
  if (e.repeat) return;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Enter') {
    e.preventDefault();
    if (state.readyToReplay) replay();
    else jump();
  }
});
stage.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  wakeAudio();
  if (state.readyToReplay) replay();
  else jump();
});

const padState = { action: false, x: 0, y: 0 };
function pollPad() {
  if (embedded) return;   // inside Sprouts the controller arrives as keys
  let list = [];
  try { list = [...(navigator.getGamepads?.() || [])].filter(Boolean); } catch { list = []; }
  if (!list.length) return;
  const raw = readPad(list[0]);
  const action = actionDown(raw, padState.action) || raw.start >= 0.5;
  const dirs = moveDirs(raw);
  if (!overlay.hidden) {
    if (dirs.x && dirs.x !== padState.x) focusMenu(dirs.x);
    if (dirs.y && dirs.y !== padState.y) focusMenu(dirs.y);
    if (action && !padState.action) pressMenu();
  } else if ((action && !padState.action) || (dirs.y < 0 && padState.y >= 0)) {
    if (state.readyToReplay) replay();
    else jump();
  }
  padState.x = dirs.x;
  padState.y = dirs.y;
  padState.action = action;
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
function tone(freq, time, length, type = 'sine', volume = 0.2, to = 0) {
  if (!audio || !state.sound) return;
  const t = audio.currentTime + time;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + length);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + length + 0.02);
}
const boing = () => tone(260, 0, 0.25, 'triangle', 0.14, 640);
const crunch = () => { tone(880, 0, 0.06, 'triangle', 0.16); tone(1320, 0.04, 0.08, 'triangle', 0.12); };
const thud = () => tone(140, 0, 0.22, 'square', 0.08, 60);
const chime = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.05 + i * 0.08, 0.3, 'triangle', 0.15));
const boop = () => { tone(330, 0.02, 0.18, 'square', 0.06); tone(247, 0.18, 0.25, 'square', 0.06); };
const munch = () => [0, 0.14, 0.28].forEach(t => tone(200, t, 0.1, 'square', 0.07, 120));

/* ---------- voice (on its own page; inside Sprouts the host reads) ---------- */

let sproutsVoice = null;
import('../../lib/speech.js?v=aviator1').then((mod) => { sproutsVoice = mod; }).catch(() => {});
function speak(text) {
  if (!text || embedded) return;
  const data = sproutsSettings();
  if (data.sound === false) return;
  if (sproutsVoice) {
    try {
      const context = sproutsVoice.contextFor('dash');
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
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 1200);
}

function paintHud() {
  distEl.textContent = String(meters(state.distance)).padStart(3, '0');
  carrotsEl.textContent = `🥕 ${state.carrots}`;
  if (state.asking) {
    const total = state.mode === 'quiz' ? state.q?.total || (state.source === 'local' ? LOCAL_ROUND : 0) : 0;
    starsEl.textContent = total ? `⭐ ${state.stars} · ${Math.min(total, state.step + 1)}/${total}` : `⭐ ${state.stars}`;
    starsEl.hidden = false;
  } else starsEl.hidden = true;
}

function present(q) {
  state.q = q;
  state.tried = new Set();
  state.answered = false;
  state.missed = false;
  if (typeof q.round === 'number' && state.source === 'host') state.step = q.round;
  askText.textContent = q.prompt;
  showEl.innerHTML = q.show || '';
  askEl.classList.remove('done');
  askEl.hidden = false;
  state.rowDue = state.t + 1.5;
  paintHud();
  if (state.source === 'host') call(window.SproutsSidecar?.show);
  else speak(q.prompt);
}

function nextLocal() {
  if (state.mode === 'quiz' && state.step >= LOCAL_ROUND) { endRound(); return; }
  present(normalizeQuestion(localQuestion(Math.random, state.localIndex++)));
}

function hostAsk(msg) {
  const q = normalizeQuestion(msg);
  if (!q) return;
  q.show = typeof msg.show === 'string' ? msg.show : '';
  if ('sound' in msg) state.sound = msg.sound !== false;
  if (msg.buddy) useBuddy(msg.buddy);
  const key = `${q.round}|${q.prompt}|${q.choices.map(c => c.label).join(',')}`;
  if (key === state.hostKey) return;
  state.hostKey = key;
  state.source = 'host';
  state.pending = q;
  if (state.phase === 'run' && state.mode === 'quiz') {
    if (!state.q || state.answered) state.nextAt = Math.max(state.nextAt, performance.now() + 600);
    else present(q);
  }
}

/** The buddy jumped into an answer. */
function grab(sign) {
  sign.grabbed = true;
  const choice = sign.choice;
  if (state.source === 'host') call(window.SproutsSidecar?.pick, choice.index);
  if (choice.ok) {
    if (!state.missed) state.stars++;
    state.step++;
    state.answered = true;
    state.boostUntil = performance.now() + 2500;
    state.chase = chaseAfter(state.chase, 'right');
    explode(sign.obj.group.position);
    for (const s of row.signs) s.obj.group.visible = false;
    chime();
    toast(state.missed ? 'You got it! Zoom!' : 'Yes! Zoom! ⭐', 'good');
    askEl.classList.add('done');
    paintHud();
    // A question round asks again soon; endless run gives a stretch of plain running first.
    if (state.source === 'local') state.nextAt = performance.now() + (state.mode === 'endless' ? 6000 : 2200);
    return;
  }
  state.missed = true;
  state.tried.add(choice.index);
  state.slowUntil = performance.now() + 1800;
  state.chase = chaseAfter(state.chase, 'wrong');
  sign.obj.face.opacity = 0.3;
  sign.obj.edge.opacity = 0.3;
  boop();
  flash();
  toast('Not that one', 'bad');
  paintHud();
}

function flash() {
  state.flash = 0.5;
}

function bump(o) {
  o.status = 'flying';
  o.fly = 0;
  o.flyX = Math.random() > 0.5 ? -2 - Math.random() : 2 + Math.random() * 0.5;
  o.flyY = Math.random() * 5;
  o.from = o.obj.position.clone();
  state.slowUntil = performance.now() + 900;
  state.chase = chaseAfter(state.chase, 'bump');
  thud();
  flash();
}

function caught() {
  gameOver();
}

/* ---------- the munch scene, after the pen's gameOver, sit, hang, nod, and replay ---------- */

/** The buddy looks about: always while running, and with wriggling paws while it hangs. */
function heroNod() {
  const sp = 0.5 + Math.random();
  to(look, sp, { y: -Math.PI / 6 + Math.random() * Math.PI / 3 }, { ease: Ease.p4InOut, onComplete: heroNod });
  if (!hanging) return;
  to(held, sp / 2, { armL: -Math.random() * Math.PI / 2 }, { ease: Ease.p1InOut, yoyo: true, repeat: 2 });
  to(held, sp / 2, { armR: -Math.random() * Math.PI / 2 }, { ease: Ease.p1InOut, yoyo: true, repeat: 2 });
  to(held, sp / 2, { legL: -0.6 + Math.random() * 1.2 }, { ease: Ease.p1InOut, yoyo: true, repeat: 2 });
  to(held, sp / 2, { legR: -0.6 + Math.random() * 1.2 }, { ease: Ease.p1InOut, yoyo: true, repeat: 2 });
  if (Math.random() > 0.2) to(held, sp / 8, { blink: 0 }, { ease: Ease.p1InOut, yoyo: true, repeat: 1 });
}

/** The caterpillar sits up with its catch, then nods, wags, and blinks until you tap. */
function catSit() {
  to(cat, 1.2, { sit: 1, headZ: 0.9, headY: -Math.PI / 3, jaw: 0.3, tailUp: 2 }, {
    ease: Ease.p4Out,
    onComplete: () => {
      catNod();
      state.readyToReplay = true;
      againEl.hidden = false;
    }
  });
}

function catNod() {
  const sp = 1 + Math.random() * 2;
  to(cat, sp, { headZ: 0.9 - 0.2 + Math.random() * 0.4, headY: -Math.PI / 3 + Math.random() * 0.5 }, { ease: Ease.p4InOut, onComplete: catNod });
  to(cat, sp / 8, { tailWag: -Math.PI / 4 }, { ease: Ease.p1InOut, yoyo: true, repeat: 8 });
  to(cat, sp / 20, { blink: 0 }, { ease: Ease.p1InOut, yoyo: true, repeat: 1 });
}

function gameOver() {
  state.phase = 'over';
  state.overAt = performance.now();
  state.readyToReplay = false;
  state.jumpAt = -1;
  state.y = 0;
  munch();
  askEl.hidden = true;
  instructionsEl.hidden = true;
  caughtEl.classList.add('show');
  carrot.obj.visible = false;
  obstacles.forEach(o => { o.obj.visible = false; });
  dropRow();
  const m = meters(state.distance);
  const best = saveBest(m);
  overStatsEl.textContent = state.asking ? `${m} · ⭐ ${state.stars} · 🥕 ${state.carrots}` : `${m} · best ${best} · 🥕 ${state.carrots}`;

  // Into the caterpillar's mouth, hanging there and facing you, like the pen's hero.
  killTweensOf([cat, held]);
  Object.assign(held, HELD_REST);
  hanging = true;
  chaser.holder.add(hero.group);
  hero.group.scale.setScalar(1.5);
  hero.group.position.set(0, 0, 0);
  hero.group.rotation.set(0, Math.PI / 3, 0);
  to(held, 1, { y: -1.5, headX: Math.PI / 6, armL: -0.5, armR: -0.5, legL: 0.2, legR: -0.2 }, { ease: Ease.p4Out });
  catSit();
  speak(`Munch! You ran ${m}.`);
}

/** Tap after the munch: the jaw opens, the buddy slides out, and the run starts again. */
function replay() {
  if (!state.readyToReplay) return;
  state.readyToReplay = false;
  state.phase = 'replay';
  againEl.hidden = true;
  caughtEl.classList.remove('show');
  killTweensOf([cat, held]);
  cat.blink = 1;
  held.blink = 1;
  to(cat, 2, { sit: 0, headZ: 0, headY: 0, tailUp: 0, tailWag: 0, jaw: 0.6 }, { ease: Ease.p4InOut });
  to(held, 2, { x: 2.4, headX: 0 }, { ease: Ease.p4InOut });
  // A question round carries on where it was; endless run starts over.
  to(cat, 1, { jaw: 0.25 }, { ease: Ease.p4In, delay: 2, onComplete: () => (state.mode === 'quiz' ? continueRun() : startGame('endless')) });
}

/** Back on the path after a munch in a question round: same question, stars, and distance. */
function continueRun() {
  releaseHero();
  placeThings();
  Object.assign(state, {
    phase: 'run', t: 0, speed: endlessSpeed(0),
    boostUntil: 0, slowUntil: 0, tumbleUntil: 0,
    chase: { pos: CHASE.start, target: CHASE.target },
    jumpAt: -1, y: 0
  });
  hud.hidden = false;
  if (state.q && !state.answered) {
    askEl.hidden = false;
    state.rowDue = state.t + 1;
  } else if (state.source === 'local' && state.asking) state.nextAt = performance.now() + 1500;
}

function releaseHero() {
  hanging = false;
  killTweensOf(held);
  Object.assign(held, HELD_REST);
  killTweensOf(cat);
  Object.assign(cat, CAT_REST);
  if (hero.group.parent !== scene) {
    hero.group.parent?.remove(hero.group);
    scene.add(hero.group);
  }
  hero.group.rotation.set(0, Math.PI / 2, 0);
  hero.group.scale.setScalar(HERO_SCALE);
  hero.eyes?.forEach(e => { e.scale.y = 1; });
}

function endRound() {
  state.phase = 'end';
  askEl.hidden = true;
  hud.hidden = true;
  instructionsEl.hidden = true;
  titleEl.textContent = 'All done!';
  verdictEl.hidden = false;
  verdictEl.textContent = `⭐ ${state.stars} / ${LOCAL_ROUND}`;
  reasonEl.hidden = false;
  reasonEl.textContent = `distance ${meters(state.distance)} · 🥕 ${state.carrots}`;
  intro.forEach(el => { el.hidden = true; });
  playBtn.textContent = 'Play again';
  playBtn.dataset.mode = 'quiz';
  endlessBtn.hidden = embedded && !state.arcade;
  overlay.hidden = false;
  speak(`All done! You earned ${state.stars} stars.`);
}

function resetRun(mode) {
  dropRow();
  releaseHero();
  caughtEl.classList.remove('show');
  againEl.hidden = true;
  state.readyToReplay = false;
  Object.assign(state, {
    mode, t: 0, distance: 0, carrots: 0,
    speed: endlessSpeed(0),
    asking: !state.arcade,
    boostUntil: 0, slowUntil: 0, tumbleUntil: 0,
    chase: { pos: CHASE.start, target: CHASE.target },
    jumpAt: -1, y: 0, nextAt: 0
  });
  if (mode === 'endless' || state.source === 'local') {
    state.step = 0;
    state.stars = 0;
    state.q = null;
  }
  placeThings();
}

/** Garden things wait under the right edge, spaced out. Angles below -3 would wrap round to the top left, so the queue stays above that. */
function placeThings() {
  obstacles.forEach((o, i) => {
    o.status = 'ready';
    o.parked = false;
    o.obj.visible = true;
    o.obj.rotation.set(0, 0, 0);
    o.angle = localFor(-0.1 - i * 0.75);
  });
  carrot.obj.visible = true;
  carrot.angle = localFor(-0.5);
}

function startGame(mode) {
  wakeAudio();
  overlay.hidden = true;
  hud.hidden = false;
  instructionsEl.hidden = false;
  setTimeout(() => { if (state.phase === 'run') instructionsEl.hidden = true; }, 6000);
  resetRun(mode);
  state.phase = mode === 'endless' ? 'run' : 'wait';
  state.waitSince = performance.now();
  askEl.hidden = true;
  if (mode === 'quiz') {
    if (state.source === 'host' && state.pending) { state.phase = 'run'; present(state.pending); }
    else if (state.source === 'local') { state.phase = 'run'; nextLocal(); }
  } else if (state.asking) state.nextAt = performance.now() + 4000;   // endless: a first stretch of running, then questions
  paintHud();
}
playBtn.addEventListener('click', () => startGame(playBtn.dataset.mode === 'endless' || state.arcade ? 'endless' : 'quiz'));
endlessBtn.addEventListener('click', () => startGame('endless'));

addEventListener('message', (event) => {
  if (!embedded || event.source !== window.parent) return;
  const data = event.data;
  if (!data || data.source !== SIDECAR_SOURCE) return;
  if (data.type === 'ask') hostAsk(data);
  else if (data.type === 'arcade') {
    state.arcade = true;
    state.source = 'local';
    playBtn.dataset.mode = 'endless';
    playBtn.textContent = 'Run';
    endlessBtn.hidden = true;
  } else if (data.type === 'clear') {
    askEl.hidden = true;
    state.q = null;
    dropRow();
    toast('Great running!', 'good');
  }
});
if (embedded) call(window.SproutsSidecar?.need);

/* ---------- loop ---------- */

let last = performance.now();
const clock = { t: 0 };

function speedNow(now) {
  if (now < state.tumbleUntil) return 1;
  // Every run speeds up like the pen's. While answers float past it holds back so they can be read.
  let base = endlessSpeed(state.t);
  if (row && !state.answered) base = Math.min(base, SPEED.read);
  if (now < state.slowUntil) return Math.max(SPEED.slow, base * 0.6);
  if (now < state.boostUntil) return base + 4;
  return base;
}

/** Where a garden thing that went round comes in again: behind the last one, never too far. */
function nextObstacleAngle(o) {
  const behind = obstacles.filter(x => x !== o && x.status === 'ready').map(x => worldAngle(x.angle));
  const lastOne = Math.min(-0.1, ...behind);
  const gap = 0.7 + Math.random() * 0.8;
  return localFor(Math.max(-2.9, lastOne - gap));
}

function stepRun(dt, now) {
  state.t += dt;
  state.speed += (speedNow(now) - state.speed) * Math.min(1, dt * 3);
  state.floor += turnRate(state.speed) * dt;
  state.distance += state.speed * dt;
  floor.rotation.z = state.floor;

  if (state.jumpAt >= 0) {
    const k = (state.t - state.jumpAt) / state.jumpFor;
    state.y = jumpHeight(k);
    if (k >= 1) { state.jumpAt = -1; state.y = 0; }
  }
  const feet = { x: 0, y: state.y };
  const middle = { x: 0, y: state.y + 1.1 };

  // Garden things go round; one that passed comes in again from the right.
  const answersOut = !!row;
  for (const o of obstacles) {
    if (o.status === 'flying') {
      o.fly += dt / 1.6;
      const e = 1 - Math.pow(1 - Math.min(1, o.fly), 4);
      o.obj.position.set(o.from.x + o.flyX * e, o.from.y + o.flyY * e, 35 * e);
      o.obj.rotation.set(e * Math.PI * 3, e * Math.PI * 6, e * Math.PI * 3);
      if (o.fly >= 1) {
        o.status = 'ready';
        o.obj.rotation.set(0, 0, 0);
        o.angle = nextObstacleAngle(o);
      }
      continue;
    }
    if (o.parked) {
      if (answersOut) o.angle = localFor(Math.min(worldAngle(o.angle), -0.3));
      else { o.parked = false; o.angle = nextObstacleAngle(o); }
    }
    if (worldAngle(o.angle) > 2.5) {
      if (answersOut) { o.parked = true; o.angle = localFor(-0.3); }
      else o.angle = nextObstacleAngle(o);
    }
    place(o.obj, worldAngle(o.angle));
    if (dist(feet, { x: o.obj.position.x, y: o.obj.position.y + 0.3 }) < HIT.obstacle && now >= state.tumbleUntil) bump(o);
  }

  // The carrot goes round and round; grabbing it sends it a quarter turn ahead.
  place(carrot.obj, worldAngle(carrot.angle), CARROT_H);
  carrot.obj.userData.spin.rotation.y += dt * 6;
  if (carrot.obj.visible && dist(middle, carrot.obj.position) < HIT.carrot) {
    explode(carrot.obj.position);
    carrot.angle -= Math.PI / 2 + (answersOut ? Math.PI / 2 : 0);
    state.carrots++;
    state.chase = chaseAfter(state.chase, 'carrot');
    crunch();
  }

  // Answers float in at jump height.
  if (state.asking && state.q && !state.answered && !row && state.t >= state.rowDue) spawnRow();
  if (row) {
    let passed = 0;
    for (const s of row.signs) {
      const a = worldAngle(s.angle);
      place(s.obj.group, a, CARROT_H + Math.sin(clock.t * 3 + s.angle * 5) * 0.12);
      s.obj.group.rotation.z = 0;
      if (!s.grabbed && s.obj.group.visible && dist(middle, s.obj.group.position) < HIT.answer) grab(s);
      if (a > TOP + 0.9 || !s.obj.group.visible) passed++;
    }
    if (passed === row.signs.length) {
      dropRow();
      if (state.q && !state.answered) {
        toast('Jump to catch the answer!', 'bad');
        state.rowDue = state.t + 0.6;
      }
    }
  }

  // The chase.
  if (now >= state.tumbleUntil) state.chase = stepChase(state.chase, dt, CHASE.creep);
  if (isCaught(state.chase) && now >= state.tumbleUntil) caught();

  if (state.asking && state.source === 'local' && (state.answered || !state.q) && state.nextAt && now >= state.nextAt) {
    state.nextAt = 0;
    nextLocal();
  }
  if (state.mode === 'quiz' && state.source === 'host' && (state.answered || !state.q) && state.pending && state.pending !== state.q && now >= state.nextAt) present(state.pending);
}

function animateHero(dt, now) {
  const g = hero.group;
  if (hanging) {
    // Hanging from the caterpillar's mouth: the scene's tweens pose the head and paws.
    g.position.set(held.x, held.y, 0);
    hero.head.rotation.set(held.headX, look.y, 0);
    hero.arms[0].rotation.x = held.armL;
    hero.arms[1].rotation.x = held.armR;
    hero.legs[0].rotation.x = held.legL;
    hero.legs[1].rotation.x = held.legR;
    hero.eyes?.forEach(e => { e.scale.y = Math.max(0.05, held.blink); });
    return;
  }
  g.position.set(0, state.y, 0);
  if (now < state.tumbleUntil) {
    const k = 1 - (state.tumbleUntil - now) / 1100;
    g.rotation.set(0, Math.PI / 2, Math.sin(k * Math.PI) * 1.2);
  } else g.rotation.set(0, Math.PI / 2, state.jumpAt >= 0 ? 0.15 : 0);
  const run = state.phase === 'run' ? Math.min(1, state.speed / 8) : state.phase === 'menu' ? 0.8 : 0;
  hero.animate(dt, state.jumpAt >= 0 ? 0 : run, clock.t);
  if (state.jumpAt >= 0) {
    hero.legs[0].rotation.x = 0.8;
    hero.legs[1].rotation.x = -0.8;
    hero.arms[0].rotation.x = -2.4;
    hero.arms[1].rotation.x = -2.4;
  }
  // The pen's hero keeps glancing about as it runs.
  hero.head.rotation.y = look.y;
}

const SIT_LIFT = [2.1, 1.2, 0.45];
const SIT_TILT = [0, 0.75, 0.4];

function animateChaser(dt) {
  const angle = Math.PI * (state.phase === 'menu' ? 0.62 : state.chase.pos);
  const munching = state.phase === 'over' || state.phase === 'replay';
  const last = chaser.segs.length - 1;
  chaser.segs.forEach((seg, i) => {
    const a = angle + i * 0.085;
    const hop = munching ? 0 : Math.abs(Math.sin(clock.t * 10 - i * 0.8)) * 0.35;
    const lift = munching ? cat.sit * (SIT_LIFT[i] || 0) + (i === last ? cat.tailUp * 0.25 : 0) : hop;
    place(seg.group, a, 0.05 + lift);
    if (munching) {
      seg.body.rotation.z = cat.sit * (SIT_TILT[i] || 0);
      seg.body.rotation.y = i === last ? cat.tailWag : 0;
    } else {
      seg.body.rotation.z = i ? Math.sin(clock.t * 10 - i * 0.8) * 0.12 : 0;
      seg.body.rotation.y = 0;
    }
  });
  const head = chaser.head;
  if (munching) {
    // Sits up with the buddy in its mouth and looks about, pleased.
    head.rotation.z = cat.headZ;
    head.rotation.y = cat.headY;
    chaser.jaw.rotation.z = -cat.jaw;
    chaser.eyes.forEach(e => { e.scale.y = Math.max(0.05, cat.blink); });
    return;
  }
  head.rotation.z = Math.sin(clock.t * 10) * 0.08;
  head.rotation.y = 0;
  chaser.jaw.rotation.z = -0.15 - Math.abs(Math.sin(clock.t * 8)) * 0.45;
  const blink = Math.sin(clock.t * 2.3) > 0.97 ? 0.1 : 1;
  chaser.eyes.forEach(e => { e.scale.y = blink; });
}

function animateBurst(dt) {
  if (burst.t < 0) return;
  burst.t += dt;
  let alive = false;
  for (const p of burst.parts) {
    const k = Math.min(1, burst.t / p.speed);
    const e = 1 - Math.pow(1 - k, 4);
    p.mesh.position.copy(p.to).multiplyScalar(e);
    p.mesh.scale.setScalar(Math.max(0.01, 1 - e));
    if (k < 1) alive = true;
  }
  if (!alive) { burst.group.visible = false; burst.t = -1; }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  clock.t += dt;
  pollPad();

  if (state.phase === 'wait' && state.source === 'wait' && now - state.waitSince > 4000) {
    state.source = 'local';
    state.phase = 'run';
    nextLocal();
  }
  if (state.phase === 'wait' && state.source === 'host' && state.pending) {
    state.phase = 'run';
    present(state.pending);
  }

  if (state.phase === 'run') {
    stepRun(dt, now);
    paintHud();
  } else if (state.phase === 'menu') {
    state.floor += turnRate(5) * dt;
    floor.rotation.z = state.floor;
  } else if (state.phase === 'over' || state.phase === 'replay') {
    // As in the pen, the run slows to a stop over about a second.
    state.speed *= Math.exp(-dt * 3);
    state.floor += turnRate(state.speed) * dt;
    floor.rotation.z = state.floor;
  }
  tweenUpdate(dt);

  if (state.flash > 0) {
    state.flash = Math.max(0, state.flash - dt);
    renderer.setClearColor(FLASH, state.flash);
  }

  animateHero(dt, now);
  animateChaser(dt);
  animateBurst(dt);
  moveCamera(dt);
  renderer.render(scene, camera);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio?.suspend?.().catch(() => {});
  else if (audio && state.phase !== 'menu') audio.resume().catch(() => {});
});

state.sound = sproutsSettings().sound !== false;
resize();
heroNod();
resetRun('quiz');
state.phase = 'menu';
obstacles.forEach(o => { o.obj.visible = false; });
carrot.obj.visible = false;
moveCamera(0, true);
playBtn.disabled = false;
playBtn.textContent = 'Play';
endlessBtn.hidden = embedded;
call(window.SproutsSidecar?.ready);
if (new URLSearchParams(location.search).has('debug')) {
  window.__dash = { state, cat, held, replay, row: () => row, obstacles, carrot, useBuddy, startGame, jump, buddy: () => hero.kind };
}
requestAnimationFrame(frame);
