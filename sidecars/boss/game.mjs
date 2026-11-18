import { englishLine } from '../../lib/english-voice.mjs?v=en1';
/**
 * Boss chase — build a boss from caterpillar and spider parts, then swim away from it.
 *
 * Seen from the side, under water. The garden buddy swims where the finger, mouse, or arrow
 * keys point it, the water streams past from the right, and the boss the child built swims
 * behind on the buddy's own path, a little late and a little clumsy. Answer bubbles float in:
 * swim into the right one to zoom ahead. Jellyfish, puffers, and crates can be tapped (or set
 * off with A) to trip the boss up; rocks bump anyone; bubble vents give a boost; shells push
 * the boss back.
 *
 * Play asks this learner's questions (the profile's round length) and you get away after the
 * last one. Endless keeps the questions coming until the boss catches you. Arcade play is
 * endless with no questions.
 *
 * Look and feel follow Karim Maaloul's (Yakudoo) fish CodePen: the side view, flat-shaded
 * low-poly shapes, the stream of little colored shapes flowing past faster as you speed up,
 * and the swimmer that leans toward where it is going. The buddy, the boss, and the code are
 * Little Sprouts' own.
 */
import * as THREE from 'three';
import {
  BAND, BUDDY_X, SPAWN_X, GONE_X, GAP, SAFE_AFTER_BUMP, BUDDY_R,
  SPEED, swimSpeed, bossSpeed, throttleAt, speedNow, creepRate, stepGap, gapAfter, isCaught, swimToward, touching,
  columnYs, answerColumn, bossAim, trimTrail, meters, saveBest
} from './logic.mjs?v=boss2';
import { makeBoss } from '../../lib/boss-model.mjs';
import { BOSS_CHOMP_SECONDS, bossLungeBlend, makeBossCatch } from '../../lib/boss-catch.mjs';
import { BOSS_EMOJI, DEFAULT_BOSS, bossName, readBoss } from '../../lib/boss-design.mjs';
import { makeBossBuilder } from '../../lib/boss-builder.mjs';
import { localQuestion, normalizeQuestion, LOCAL_ROUND } from './quiz.mjs?v=boss2';
import { makeBuddy, buddyKind, BUDDIES } from '../../lib/buddy3d.mjs?v=gear2';
import { resolveAutoQuality, pixelRatioCap, rendererOptions, isPerformanceTier } from '../../lib/device-tier.mjs?v=low-end1';
import { readPad, actionDown, moveDirs } from '../../lib/pad-core.mjs?v=pad-rt';

const $ = (id) => document.getElementById(id);
const stage = $('world');
const overlay = $('overlay');
const menuCard = $('menu');
const builderCard = $('builder');
const playBtn = $('play');
const endlessBtn = $('endless');
const buildBtn = $('build');
const titleEl = $('title');
const verdictEl = $('verdict');
const reasonEl = $('reason');
const bossLineEl = $('bossLine');
const intro = [$('blurb'), $('help')];
const hud = $('hud');
const distEl = $('distValue');
const starsEl = $('stars');
const shellsEl = $('shells');
const meterEl = $('meter');
const meterFill = $('meterFill');
const meterBuddy = $('meterBuddy');
const meterBoss = $('meterBoss');
const speedFill = $('speedFill');
const presetsEl = $('presets');
const askEl = $('ask');
const askText = $('askText');
const showEl = $('show');
const toastEl = $('toast');
const caughtEl = $('caught');
const instructionsEl = $('instructions');
const againEl = $('again');
const againTap = $('againTap');
const overStatsEl = $('overStats');
const bossNameEl = $('bossName');
const picksEl = $('picks');
const SIDECAR_SOURCE = 'sprouts-sidecar';
const HERO_SCALE = 1.5;
const BUDDY_EMOJI = { fox: '🦊', bear: '🐻', bunny: '🐰', frog: '🐸', owl: '🦉', chick: '🐥' };

const call = (fn, arg) => { try { return fn?.(arg); } catch { return undefined; } };
const sproutsSettings = () => { try { return JSON.parse(localStorage.getItem('sprouts-v1')) || {}; } catch { return {}; } };
const embedded = window.parent !== window;
const send = (type, extra = {}) => { if (embedded) window.parent.postMessage({ source: SIDECAR_SOURCE, type, ...extra }, '*'); };

/* ---------- state ---------- */

const state = {
  phase: 'menu',     // menu | build | wait | run | over | free | end
  mode: 'quiz',      // quiz | endless
  arcade: false,
  source: embedded ? 'wait' : 'local',
  waitSince: 0,
  q: null,
  pending: null,
  hostKey: '',
  cleared: false,    // the host has no more questions for this round
  tried: new Set(),
  answered: false,
  missed: false,
  rowDue: 0,
  calmUntil: 0,
  step: 0,
  stars: 0,
  localIndex: 0,
  nextAt: 0,
  t: 0,
  distance: 0,
  shells: 0,
  speed: 6,
  throttle: SPEED.cruise,   // 0 slow .. 1 fast, from how far right the finger is
  x: BUDDY_X,               // the buddy sits a little further right when it swims fast
  boostUntil: 0,
  slowUntil: 0,
  safeUntil: 0,
  stunUntil: 0,
  bossCrashAt: -9,
  gap: GAP.start,
  y: 0,
  aimY: 0,
  vy: 0,
  spawnIn: 1.5,
  overAt: 0,
  readyToReplay: false,
  asking: true,
  flash: 0,
  sound: true
};

/* ---------- three.js scene ---------- */

const tier = resolveAutoQuality({ embedded });
const lowGpu = isPerformanceTier(tier);
const renderer = new THREE.WebGLRenderer({ canvas: stage, ...rendererOptions(tier), alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap(tier)));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const FLASH = new THREE.Color('#ff7a59');
renderer.setClearColor(FLASH, 0);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#17708a', 30, 70);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
const camLook = new THREE.Vector3(-2, 0, 0);

scene.add(new THREE.HemisphereLight('#d8fbff', '#0d3f52', 2.2));
const sun = new THREE.DirectionalLight('#ffffff', 1.6);
sun.position.set(-2, 8, 6);
scene.add(sun);

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
const MAT = {
  sand: lambert('#e3c98f'),
  sandDark: lambert('#c9ab6b'),
  rock: lambert('#6f7f8c'),
  rockDark: lambert('#55626d'),
  kelp: lambert('#4f9a3c'),
  kelpDark: lambert('#3c7a2c'),
  jelly: lambert('#f2a7e0', { transparent: true, opacity: 0.85 }),
  jellyGlow: new THREE.MeshBasicMaterial({ color: '#ffe0fb' }),
  puffer: lambert('#f5c84b'),
  pufferSpot: lambert('#d99a2b'),
  white: lambert('#fff8ec'),
  black: new THREE.MeshBasicMaterial({ color: '#1d1a24' }),
  wood: lambert('#b07a45'),
  woodDark: lambert('#8a5a2e'),
  shell: lambert('#ffb4a2'),
  shellDark: lambert('#f08a73'),
  bubble: new THREE.MeshLambertMaterial({ color: '#e8fbff', transparent: true, opacity: 0.45, depthWrite: false }),
  star: new THREE.MeshBasicMaterial({ color: '#ffd25a' })
};
const unit = new THREE.BoxGeometry(1, 1, 1);
function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(unit, mat);
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  return m;
}

/* ---------- the sea: sand below, light above, kelp behind, and the pen's stream of shapes ---------- */

const SEA_W = 60;
const seabeds = [];
function makeSeabed() {
  const geo = new THREE.PlaneGeometry(SEA_W, 26, 30, 10);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const edge = Math.abs(x) > SEA_W / 2 - 0.01;
    // The ends match so two strips meet without a seam.
    pos.setY(i, edge ? Math.sin(pos.getZ(i)) * 0.4 : Math.sin(x * 0.7) * 0.35 + Math.random() * 0.7);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, MAT.sand);
  mesh.position.set(0, BAND.bottom - 2.6, -6);
  return mesh;
}
for (let i = 0; i < 2; i++) {
  const s = makeSeabed();
  s.position.x = i * SEA_W;
  scene.add(s);
  seabeds.push(s);
}

// Shimmering surface far above, seen from below.
const surface = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 60),
  new THREE.MeshBasicMaterial({ color: '#bff3fb', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
);
surface.rotation.x = Math.PI / 2;
surface.position.set(0, BAND.top + 4, -10);
scene.add(surface);

// Sun rays slanting down through the water.
const rays = [];
const rayMat = new THREE.MeshBasicMaterial({ color: '#e8fbff', transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
for (let i = 0; i < 6; i++) {
  const ray = new THREE.Mesh(new THREE.PlaneGeometry(2 + Math.random() * 3, 34), rayMat);
  ray.position.set(-30 + i * 11 + Math.random() * 4, 2, -12 - Math.random() * 6);
  ray.rotation.z = 0.35;
  ray.userData.phase = Math.random() * 6;
  scene.add(ray);
  rays.push(ray);
}

// Kelp and rocks in the back, drifting past slower than the near things.
const scenery = [];
function makeKelp() {
  const g = new THREE.Group();
  const n = 5 + Math.floor(Math.random() * 4);
  const parts = [];
  for (let i = 0; i < n; i++) {
    const leaf = box(0.35, 1.1, 0.35, i % 2 ? MAT.kelp : MAT.kelpDark, 0, 0.55, 0);
    const joint = new THREE.Group();
    joint.add(leaf);
    if (parts.length) { joint.position.y = 1.05; parts[parts.length - 1].add(joint); } else g.add(joint);
    parts.push(joint);
  }
  g.userData.parts = parts;
  return g;
}
function makeBackRock() {
  const r = 1 + Math.random() * 2;
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), Math.random() > 0.5 ? MAT.rock : MAT.rockDark);
  m.scale.y = 0.6;
  return m;
}
for (let i = 0; i < 16; i++) {
  const kelp = i % 3 !== 2;
  const obj = kelp ? makeKelp() : makeBackRock();
  const depth = -4 - Math.random() * 10;
  obj.position.set(-35 + i * 4.5 + Math.random() * 2, BAND.bottom - 2.2, depth);
  scene.add(obj);
  scenery.push({ obj, kelp, par: 0.45 + (depth + 14) * 0.04, phase: Math.random() * 6 });
}

// The pen's flowing particles: little colored shapes streaming past.
const FLOW_COLORS = ['#ffd25a', '#ff7a59', '#e8fbff', '#7fbf3f', '#f2a7e0', '#4fb3c4'];
const flowGeos = [new THREE.TetrahedronGeometry(0.18), new THREE.BoxGeometry(0.22, 0.22, 0.22), new THREE.OctahedronGeometry(0.16)];
const flowMats = FLOW_COLORS.map(c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.7 }));
const flow = [];
for (let i = 0; i < (lowGpu ? 50 : 110); i++) {
  const m = new THREE.Mesh(flowGeos[i % 3], flowMats[i % flowMats.length]);
  m.position.set(-30 + Math.random() * 60, -9 + Math.random() * 18, -8 + Math.random() * 12);
  m.userData.k = 0.7 + Math.random() * 0.8;
  m.userData.spin = (Math.random() - 0.5) * 4;
  scene.add(m);
  flow.push(m);
}

/* ---------- little bubbles from the swimmer ---------- */

const bubbleGeo = new THREE.SphereGeometry(0.12, 8, 6);
const bubbles = [];
for (let i = 0; i < 24; i++) {
  const b = new THREE.Mesh(bubbleGeo, MAT.bubble);
  b.visible = false;
  scene.add(b);
  bubbles.push({ mesh: b, life: 0 });
}
let bubbleNext = 0;
function puffBubble(x, y, size = 1) {
  const b = bubbles.find(p => p.life <= 0);
  if (!b) return;
  b.life = 1.6;
  b.mesh.visible = true;
  b.mesh.position.set(x, y, 0.3);
  b.mesh.scale.setScalar(size * (0.6 + Math.random() * 0.8));
}

/* ---------- the swimmer: the learner's garden buddy, lying along the water ---------- */

const swimmer = new THREE.Group();   // leans toward where it swims
scene.add(swimmer);
const bossCatch = makeBossCatch(swimmer);
let hero = makeHero(buddyKind());
function makeHero(kind) {
  const b = makeBuddy(THREE, kind, { material: (color) => lambert(color) });
  b.group.scale.setScalar(HERO_SCALE);
  b.group.rotation.y = Math.PI / 2;
  b.group.position.y = -0.6 * HERO_SCALE;
  swimmer.add(b.group);
  meterBuddy.textContent = BUDDY_EMOJI[b.kind] || '🫧';
  return b;
}
function useBuddy(kind) {
  if (!BUDDIES.includes(kind) || kind === hero.kind) return;
  const old = hero;
  old.group.parent?.remove(old.group);
  old.dispose?.();
  hero = makeHero(kind);
}

/* ---------- the boss ---------- */

let design = readBoss() || null;
let boss = null;
const bossPath = [];        // where the head has been, carried along by the water: [{ x, y }]
const buddyTrail = [];      // the buddy's height over time, for the boss to follow: [{ t, y }]
const bossPos = { x: -12, y: 0 };
const dizzy = new THREE.Group();
for (let i = 0; i < 3; i++) {
  const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), MAT.star);
  s.position.set(Math.cos(i * 2.1) * 0.9, 0, Math.sin(i * 2.1) * 0.9);
  dizzy.add(s);
}
dizzy.visible = false;
scene.add(dizzy);

function buildBoss(d) {
  bossCatch.release();
  boss?.dispose();
  boss = makeBoss(d || DEFAULT_BOSS);
  meterBoss.textContent = BOSS_EMOJI[boss.design.head] || '🐛';
  scene.add(boss.group);
  bossPath.length = 0;
}

/** Head in front, then each body piece at its spacing along the path the head swam. */
function placeBossBody() {
  const head = bossPath[0];
  if (!head) return;
  boss.lead.position.set(head.x, head.y, 0);
  // Walk back along the path; `from` is where the walk has got to, `walked` how far that is.
  let i = 1;
  let walked = 0;
  let want = 0;
  let from = head;
  let front = head;
  for (let s = 0; s < boss.segs.length; s++) {
    want += boss.spacing[s];
    let spot = null;
    while (i < bossPath.length) {
      const p = bossPath[i];
      const step = Math.hypot(p.x - from.x, p.y - from.y);
      if (walked + step >= want) {
        const k = step ? (want - walked) / step : 0;
        spot = { x: from.x + (p.x - from.x) * k, y: from.y + (p.y - from.y) * k };
        from = spot;
        walked = want;
        break;
      }
      walked += step;
      from = p;
      i++;
    }
    if (!spot) {
      // Not enough path yet: carry straight on behind.
      spot = { x: from.x - (want - walked), y: from.y };
      from = spot;
      walked = want;
    }
    const seg = boss.segs[s].group;
    seg.position.set(spot.x, spot.y, 0);
    seg.rotation.z = Math.atan2(front.y - spot.y, Math.max(0.05, front.x - spot.x));
    front = spot;
  }
  // Keep only as much path as the body needs.
  if (i + 4 < bossPath.length) bossPath.length = i + 4;
}

/** Move the head and lay a fresh path point; the water carries the old ones back. */
function swimBoss(dt, x, y, drift) {
  for (const p of bossPath) p.x -= drift;
  bossPos.x = x;
  bossPos.y = y;
  const last = bossPath[0];
  if (!last || Math.hypot(last.x - x, last.y - y) > 0.08) bossPath.unshift({ x, y });
  else { last.x = x; last.y = y; }
  if (bossPath.length > 400) bossPath.length = 400;
  placeBossBody();
  const front = bossPath[Math.min(3, bossPath.length - 1)];
  boss.lead.rotation.z = front ? THREE.MathUtils.clamp(Math.atan2(y - front.y, Math.max(0.3, x - front.x)), -0.6, 0.6) : 0;
}

/** Lay a straight-ish path behind the head so the body is already stretched out. */
function seedBossPath(x, y) {
  bossPos.x = x;
  bossPos.y = y;
  bossPath.length = 0;
  for (let i = 0; i < 160; i++) bossPath.push({ x: x - i * 0.1, y });
  placeBossBody();
}

/* ---------- answer bubbles ---------- */

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

function choiceTexture(choice) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;
  const colorOnly = choice.fill && !choice.shape;
  ctx.beginPath();
  ctx.arc(c, c, c - 14, 0, Math.PI * 2);
  ctx.fillStyle = colorOnly ? choice.fill : '#fffaf0';
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#ff7a59';
  ctx.stroke();
  if (choice.shape) drawShape(ctx, choice.shape, c, c, 64, choice.fill || '#5f9042');
  else if (!colorOnly) {
    let font = 120;
    ctx.font = `800 ${font}px "Trebuchet MS", sans-serif`;
    while (ctx.measureText(choice.label).width > size - 70 && font > 30) {
      font -= 6;
      ctx.font = `800 ${font}px "Trebuchet MS", sans-serif`;
    }
    ctx.fillStyle = '#102028';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(choice.label, c, c + font * 0.05);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const ANSWER_R = 1.25;
const shellGeo = new THREE.SphereGeometry(ANSWER_R, 20, 14);
const discGeo = new THREE.CircleGeometry(ANSWER_R * 0.86, 32);
let column = null;   // { items: [{ group, face, glass, choice, x, y, gone }], x }

function dropColumn() {
  if (!column) return;
  for (const a of column.items) {
    scene.remove(a.group);
    a.face.map?.dispose();
    a.face.dispose();
    a.glass.dispose();
  }
  column = null;
}

function spawnColumn() {
  if (!state.q) return;
  dropColumn();
  const choices = answerColumn(state.q.choices, state.tried);
  const ys = columnYs(choices.length);
  column = {
    x: SPAWN_X,
    items: choices.map((choice, i) => {
      const group = new THREE.Group();
      const face = new THREE.MeshBasicMaterial({ map: choiceTexture(choice), transparent: true });
      const glass = new THREE.MeshLambertMaterial({ color: '#e8fbff', transparent: true, opacity: 0.3, depthWrite: false });
      const disc = new THREE.Mesh(discGeo, face);
      disc.position.z = 0.4;
      group.add(new THREE.Mesh(shellGeo, glass), disc);
      group.position.set(SPAWN_X, ys[i], 0);
      scene.add(group);
      return { group, face, glass, choice, y: ys[i], gone: false, phase: Math.random() * 6 };
    })
  };
}

/* ---------- things in the water ---------- */

function makeRock() {
  const g = new THREE.Group();
  const r = 1.1 + Math.random() * 0.5;
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), MAT.rock);
  m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
  g.add(m);
  g.add(box(0.5, 0.5, 0.5, MAT.kelp, r * 0.3, r * 0.75, 0.3));
  return { obj: g, r: r * 0.95 };
}
function makeJelly() {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), MAT.jelly);
  g.add(dome);
  const legs = [];
  for (let i = 0; i < 5; i++) {
    const leg = box(0.1, 1.1, 0.1, MAT.jelly, -0.5 + i * 0.25, -0.55, 0);
    g.add(leg);
    legs.push(leg);
  }
  for (const x of [-0.25, 0.25]) g.add(box(0.12, 0.16, 0.05, MAT.black, x, 0.3, 0.72));
  const glowCore = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), MAT.jellyGlow);
  glowCore.position.y = 0.15;
  glowCore.visible = false;
  g.add(glowCore);
  g.userData = { legs, glowCore };
  return { obj: g, r: 0.85 };
}
function makePuffer() {
  const g = new THREE.Group();
  const body = new THREE.Group();
  body.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 0), MAT.puffer));
  const spikes = new THREE.Group();
  const spikeGeo = new THREE.ConeGeometry(0.12, 0.45, 4);
  const ico = new THREE.IcosahedronGeometry(0.75, 0).attributes.position;
  for (let i = 0; i < ico.count; i += 3) {
    const v = new THREE.Vector3(ico.getX(i), ico.getY(i), ico.getZ(i)).normalize();
    const s = new THREE.Mesh(spikeGeo, MAT.white);
    s.position.copy(v).multiplyScalar(0.8);
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    spikes.add(s);
  }
  spikes.scale.setScalar(0.2);
  body.add(spikes);
  for (const z of [-0.6, 0.6]) {
    body.add(box(0.22, 0.26, 0.1, MAT.white, -0.35, 0.18, z));
    body.add(box(0.1, 0.14, 0.12, MAT.black, -0.4, 0.18, z * 1.05));
  }
  const tail = box(0.45, 0.6, 0.08, MAT.pufferSpot, 0.85, 0, 0);
  g.add(body, tail);
  g.userData = { body, spikes, tail };
  return { obj: g, r: 0.75 };
}
function makeCrate() {
  const g = new THREE.Group();
  g.add(box(1.6, 1.6, 1.6, MAT.wood));
  for (const y of [-0.6, 0.6]) g.add(box(1.7, 0.25, 1.7, MAT.woodDark, 0, y, 0));
  g.add(box(0.25, 1.7, 1.7, MAT.woodDark));
  return { obj: g, r: 0.95 };
}
function makeVent() {
  const g = new THREE.Group();
  g.add(box(1.4, 0.6, 1.2, MAT.rockDark, 0, BAND.bottom - 1.9, 0));
  const rising = [];
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Mesh(bubbleGeo, MAT.bubble);
    b.position.set((Math.random() - 0.5) * 0.9, BAND.bottom - 1.5 + Math.random() * 14, (Math.random() - 0.5) * 0.6);
    b.scale.setScalar(1 + Math.random() * 1.5);
    g.add(b);
    rising.push(b);
  }
  g.userData = { rising };
  return { obj: g, r: 0.9 };
}
function makeShell() {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 6), MAT.shell);
  s.rotation.z = Math.PI;
  g.add(s);
  for (let i = -1; i <= 1; i++) g.add(box(0.08, 0.65, 0.08, MAT.shellDark, i * 0.18, 0.02, 0.3));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 6), MAT.bubble));
  return { obj: g, r: 0.6 };
}
const MAKERS = { rock: makeRock, jelly: makeJelly, puffer: makePuffer, crate: makeCrate, vent: makeVent, shell: makeShell };
const WEIGHTS = [['rock', 3], ['jelly', 3], ['puffer', 2.2], ['crate', 1.5], ['vent', 1.2], ['shell', 2.2]];
/** Things you can tap (or set off with A) to trip up the boss. */
const TAPPABLE = new Set(['jelly', 'puffer', 'crate']);

let things = [];

function pickKind() {
  const total = WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of WEIGHTS) { r -= w; if (r <= 0) return k; }
  return 'rock';
}

function spawnThing(kind = pickKind(), x = SPAWN_X) {
  const made = MAKERS[kind]();
  const y = kind === 'crate' ? BAND.top + 0.4 : kind === 'vent' ? 0 : BAND.bottom + 0.8 + Math.random() * (BAND.top - BAND.bottom - 1.6);
  made.obj.position.set(x, y, 0);
  scene.add(made.obj);
  const t = { kind, obj: made.obj, r: made.r, baseR: made.r, x, y, baseY: y, phase: Math.random() * 6, on: 0, vy: 0, hitBuddy: false, hitBoss: false, fly: null };
  things.push(t);
  return t;
}

function dropThing(t) {
  scene.remove(t.obj);
  t.obj.traverse(o => { if (o.geometry && o.geometry !== unit && o.geometry !== bubbleGeo) o.geometry.dispose(); });
}

function clearThings() {
  things.forEach(dropThing);
  things = [];
}

/** Tap or A: the jellyfish lights up and grows its sting, the puffer puffs, the crate sinks. */
function setOff(t) {
  if (!TAPPABLE.has(t.kind) || t.fly) return false;
  if (t.kind === 'crate') {
    if (t.vy) return false;
    t.vy = -0.5;
    splash();
  } else {
    if (t.on > 0) return false;
    t.on = 4;
    if (t.kind === 'jelly') zing(); else puff();
  }
  return true;
}

/* ---------- bursts ---------- */

const burst = { group: new THREE.Group(), parts: [], t: -1 };
const burstMats = [new THREE.MeshBasicMaterial({ color: '#ffd25a' }), new THREE.MeshBasicMaterial({ color: '#ff7a59' }), new THREE.MeshBasicMaterial({ color: '#e8fbff' })];
for (let i = 0; i < 18; i++) {
  const m = box(0.35, 0.35, 0.35, burstMats[i % 3]);
  burst.parts.push({ mesh: m, to: new THREE.Vector3(), speed: 1 });
  burst.group.add(m);
}
burst.group.visible = false;
scene.add(burst.group);
function explode(at) {
  burst.group.position.copy(at);
  burst.group.visible = true;
  burst.t = 0;
  for (const p of burst.parts) {
    p.to.set(-4 + Math.random() * 8, -4 + Math.random() * 8, -2 + Math.random() * 4);
    p.speed = 0.5 + Math.random() * 0.5;
  }
}

/* ---------- camera ---------- */

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

/** Step back far enough to see the open water and some of the boss behind. */
function camDistance() {
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const halfW = camera.aspect < 1 ? 9 : 13;
  return Math.max(8.2, halfW / camera.aspect) / tan;
}

function moveCamera(dt, snap = false) {
  const building = state.phase === 'build';
  const portrait = camera.aspect < 1;
  const z = building ? camDistance() * (portrait ? 0.75 : 0.62) : camDistance();
  const x = building ? (portrait ? -2 : -5.5) : state.phase === 'over' ? bossPos.x + 4 : -2.5;
  const y = building && portrait ? -2.5 : 0;
  const k = snap ? 1 : 1 - Math.exp(-dt * 2);
  camera.position.x += (x - camera.position.x) * k;
  camera.position.y += (y - camera.position.y) * k;
  camera.position.z += (z - camera.position.z) * k;
  camLook.set(camera.position.x, camera.position.y, 0);
  camera.lookAt(camLook);
  scene.fog.near = camera.position.z + 4;
  scene.fog.far = camera.position.z + 40;
}

/* ---------- input ---------- */

const keys = { up: false, down: false, left: false, right: false };
let pointerAim = null;   // the height the finger or mouse points at, or null
const ray = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const hitPoint = new THREE.Vector3();
const ndc = new THREE.Vector2();

function waterPoint(e) {
  const r = stage.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  return ray.ray.intersectPlane(plane, hitPoint) ? hitPoint.clone() : null;
}

/** The tappable thing under a tap, if any. Generous, for small fingers. */
function thingAt(p) {
  let best = null;
  let bestD = Infinity;
  for (const t of things) {
    if (!TAPPABLE.has(t.kind)) continue;
    const d = Math.hypot(t.x - p.x, t.y - p.y);
    if (d < t.r + 1.3 && d < bestD) { best = t; bestD = d; }
  }
  return best;
}

/** A: set off the thing nearest in front of the boss's nose. */
function setOffNearest() {
  const ahead = things.filter(t => TAPPABLE.has(t.kind) && !t.fly && t.x > bossPos.x - 1 && t.x < SPAWN_X - 4 && !(t.on > 0) && !t.vy);
  ahead.sort((a, b) => (a.x - bossPos.x) - (b.x - bossPos.x));
  if (ahead[0]) setOff(ahead[0]);
}

let dragging = false;
stage.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  wakeAudio();
  if (state.readyToReplay) { replay(); return; }
  if (state.phase !== 'run') return;
  const p = waterPoint(e);
  if (!p) return;
  const t = thingAt(p);
  if (t && setOff(t)) return;
  dragging = true;
  pointerAim = p.y;
  state.throttle = throttleAt(e.clientX / innerWidth);
});
stage.addEventListener('pointermove', (e) => {
  if (state.phase !== 'run') return;
  // A mouse steers just by moving; a finger steers while it is down.
  if (e.pointerType === 'mouse' || dragging) {
    const p = waterPoint(e);
    if (p) pointerAim = p.y;
    // As in the fish pen: further right swims faster.
    state.throttle = throttleAt(e.clientX / innerWidth);
  }
});
addEventListener('pointerup', () => { dragging = false; });
addEventListener('pointercancel', () => { dragging = false; });

/*
 * Little Sprouts' controller layer (lib/pad.js) drives a game frame with keys: the stick and
 * d-pad send arrow keys, and A or the right trigger sends W. So inside Sprouts the game only
 * listens to keys. On its own page it reads the controller itself, with the same buttons.
 */
let menuFocus = 0;
let padUsed = false;   // the focus ring shows only once keys or a controller move it
function focusables() {
  if (state.phase === 'build') return [...presetsEl.querySelectorAll('.preset'), ...picksEl.querySelectorAll('.pick'), $('surprise'), $('done')];
  return [playBtn, endlessBtn, buildBtn].filter(b => !b.hidden && !b.disabled);
}
function paintFocus() {
  const list = focusables();
  menuFocus = Math.max(0, Math.min(menuFocus, list.length - 1));
  document.querySelectorAll('.pad-focus').forEach(el => el.classList.remove('pad-focus'));
  if (padUsed) list[menuFocus]?.classList.add('pad-focus');
}
function focusMenu(step) {
  padUsed = true;
  const list = focusables();
  if (!list.length) return;
  menuFocus = (menuFocus + step + list.length) % list.length;
  paintFocus();
}
function sideMenu(step) {
  padUsed = true;
  const el = focusables()[menuFocus];
  if (el?.classList.contains('pick')) changePart(el.dataset.key, step);
  else focusMenu(step);
}
function pressMenu() {
  const el = focusables()[menuFocus];
  if (!el) return;
  if (el.classList.contains('pick')) changePart(el.dataset.key, 1);
  else el.click();
}

addEventListener('keydown', (e) => {
  wakeAudio();
  if (!overlay.hidden) {
    // Let a focused button receive the keyboard's native click.
    if (e.isTrusted && e.target?.closest?.('button') && ['Enter', 'Space'].includes(e.code)) return;
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyW') { e.preventDefault(); if (!e.repeat) pressMenu(); }
    else if (e.code === 'ArrowUp') { e.preventDefault(); focusMenu(-1); }
    else if (e.code === 'ArrowDown') { e.preventDefault(); focusMenu(1); }
    else if (e.code === 'ArrowLeft') { e.preventDefault(); sideMenu(-1); }
    else if (e.code === 'ArrowRight') { e.preventDefault(); sideMenu(1); }
    return;
  }
  if (e.code === 'ArrowUp') { e.preventDefault(); keys.up = true; pointerAim = null; }
  else if (e.code === 'ArrowDown') { e.preventDefault(); keys.down = true; pointerAim = null; }
  else if (e.code === 'ArrowRight') { e.preventDefault(); keys.right = true; }
  else if (e.code === 'ArrowLeft') { e.preventDefault(); keys.left = true; }
  else if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'Enter') {
    e.preventDefault();
    if (e.repeat) return;
    if (state.readyToReplay) replay();
    else if (state.phase === 'run') setOffNearest();
  }
});
addEventListener('keyup', (e) => {
  if (e.code === 'ArrowUp') keys.up = false;
  else if (e.code === 'ArrowDown') keys.down = false;
  else if (e.code === 'ArrowRight') keys.right = false;
  else if (e.code === 'ArrowLeft') keys.left = false;
});
addEventListener('blur', () => { keys.up = keys.down = keys.left = keys.right = false; });

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
    if (dirs.y && dirs.y !== padState.y) focusMenu(dirs.y);
    if (dirs.x && dirs.x !== padState.x) sideMenu(dirs.x);
    if (action && !padState.action) pressMenu();
  } else {
    keys.up = dirs.y < 0;
    keys.down = dirs.y > 0;
    keys.right = dirs.x > 0;
    keys.left = dirs.x < 0;
    if (dirs.y) pointerAim = null;
    if (action && !padState.action) {
      if (state.readyToReplay) replay();
      else if (state.phase === 'run') setOffNearest();
    }
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
const blip = () => tone(520, 0, 0.12, 'sine', 0.12, 900);
const pop = () => { tone(700, 0, 0.08, 'sine', 0.16, 1400); };
const thud = () => tone(140, 0, 0.22, 'square', 0.08, 60);
const bonk = () => { tone(220, 0, 0.12, 'square', 0.1, 110); tone(880, 0.1, 0.25, 'triangle', 0.1, 1320); };
const chime = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.05 + i * 0.08, 0.3, 'triangle', 0.15));
const boop = () => { tone(330, 0.02, 0.18, 'square', 0.06); tone(247, 0.18, 0.25, 'square', 0.06); };
const chomp = () => [0, 0.14, 0.28].forEach(t => tone(200, t, 0.1, 'square', 0.07, 120));
const zing = () => tone(900, 0, 0.3, 'sawtooth', 0.05, 1800);
const puff = () => tone(180, 0, 0.25, 'triangle', 0.14, 420);
const splash = () => tone(300, 0, 0.3, 'sine', 0.12, 90);
const whoosh = () => tone(240, 0, 0.4, 'sine', 0.1, 960);
const fanfare = () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.35, 'triangle', 0.15));

/* ---------- voice (on its own page; inside Sprouts the host reads) ---------- */

let sproutsVoice = null;
import('../../lib/speech.js?v=offline4').then((mod) => { sproutsVoice = mod; }).catch(() => {});
function speak(text) {
  if (!text || embedded) return;
  const data = sproutsSettings();
  if (data.sound === false) return;
  if (sproutsVoice) {
    try {
      const context = sproutsVoice.contextFor('boss');
      sproutsVoice.speak(text, sproutsVoice.voiceFor(context, data.voice, data.characterVoices), { context });
      return;
    } catch { /* fall back to the browser voice */ }
  }
  try {
    speechSynthesis.cancel();
    speechSynthesis.speak(englishLine(String(text).replace(/\s*\+\s*/g, ' plus ').replace(/\s*−\s*/g, ' minus ')));
  } catch { /* no voice here */ }
}

/* ---------- builder ---------- */

const bossBuilder = makeBossBuilder({
  presets: presetsEl, picks: picksEl, name: bossNameEl, surprise: $('surprise'), done: $('done'),
  onChange(next, reason) {
    design = next;
    buildBoss(design);
    seedBossPath(bossPos.x, bossPos.y);
    if (reason === 'part') blip(); else whoosh();
    paintFocus();
  },
  onSave(next) {
    design = next;
    speak(`Meet ${bossName(design)}!`);
    showMenu();
    buildBtn.focus();
  }
});

function changePart(key, step) { bossBuilder.cycle(key, step); }

function openBuilder() {
  state.phase = 'build';
  design = design || { ...DEFAULT_BOSS };
  buildBoss(design);
  menuCard.hidden = true;
  builderCard.hidden = false;
  overlay.classList.add('building');
  overlay.hidden = false;
  hud.hidden = true;
  askEl.hidden = true;
  menuFocus = 0;
  bossBuilder.set(design);
  paintFocus();
  seedBossPath(bossPos.x, bossPos.y);
}

buildBtn.addEventListener('click', openBuilder);

function showMenu() {
  // Back from a run or the builder: lay the boss out fresh behind where the buddy idles.
  if (state.phase !== 'menu' && boss) seedBossPath(BUDDY_X - 8, 0);
  state.phase = 'menu';
  builderCard.hidden = true;
  menuCard.hidden = false;
  overlay.classList.remove('building');
  overlay.hidden = false;
  bossLineEl.hidden = !design;
  if (design) bossLineEl.textContent = `Your boss: ${bossName(design)}`;
  menuFocus = 0;
  paintFocus();
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

function roundTotal() {
  if (state.mode !== 'quiz') return 0;
  return state.q?.total || (state.source === 'local' ? LOCAL_ROUND : 0);
}

function paintHud() {
  distEl.textContent = String(meters(state.distance)).padStart(3, '0');
  shellsEl.textContent = `🐚 ${state.shells}`;
  if (state.asking) {
    const total = roundTotal();
    starsEl.textContent = total ? `⭐ ${state.stars} · ${Math.min(total, state.step + 1)}/${total}` : `⭐ ${state.stars}`;
    starsEl.hidden = false;
  } else starsEl.hidden = true;
  meterFill.style.width = `${Math.round((state.gap / GAP.max) * 100)}%`;
  speedFill.style.width = `${Math.round(state.throttle * 100)}%`;
  meterEl.classList.toggle('near', state.gap < 3);
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
  state.rowDue = state.t + 2.5;
  state.calmUntil = state.t + 4;
  paintHud();
  if (state.source === 'host') call(window.SproutsSidecar?.show);
  else speak(q.prompt);
}

function nextLocal() {
  if (state.mode === 'quiz' && state.step >= LOCAL_ROUND) { getAway(); return; }
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
  if (state.phase === 'run' && state.asking && (!state.q || state.answered)) {
    state.nextAt = Math.max(state.nextAt, performance.now() + 600);
  } else if (state.phase === 'run' && state.asking && state.q && !state.answered) present(q);
}

/** The buddy swam into an answer bubble. */
function grab(a) {
  a.gone = true;
  const choice = a.choice;
  if (state.source === 'host') call(window.SproutsSidecar?.pick, choice.index);
  if (choice.ok) {
    if (!state.missed) state.stars++;
    state.step++;
    state.answered = true;
    state.boostUntil = performance.now() + 2500;
    state.gap = gapAfter(state.gap, 'right');
    explode(a.group.position);
    for (const it of column.items) { it.group.visible = false; it.gone = true; }
    chime();
    call(window.SproutsSidecar?.sound, 'player.power-up');
    toast(state.missed ? 'You got it! Zoom!' : 'Yes! Zoom! ⭐', 'good');
    askEl.classList.add('done');
    paintHud();
    // Endless gives a stretch of plain swimming between questions; Play asks again soon.
    state.nextAt = performance.now() + (state.mode === 'endless' ? 6000 : 2200);
    if (state.source === 'local' && state.mode === 'quiz' && state.step >= LOCAL_ROUND) state.nextAt = performance.now() + 1200;
    return;
  }
  state.missed = true;
  state.tried.add(choice.index);
  state.slowUntil = performance.now() + 1500;
  state.gap = gapAfter(state.gap, 'wrong');
  a.face.opacity = 0.3;
  a.glass.opacity = 0.1;
  boop();
  state.flash = 0.4;
  toast('Not that one', 'bad');
  paintHud();
}

/** The buddy swam into something. */
function bumpBuddy(t) {
  if (state.t < state.safeUntil) return;
  t.hitBuddy = true;
  state.safeUntil = state.t + SAFE_AFTER_BUMP;
  state.slowUntil = performance.now() + 1100;
  state.gap = gapAfter(state.gap, 'bump');
  state.flash = 0.45;
  thud();
  toast(t.kind === 'jelly' ? 'Zap!' : t.kind === 'puffer' ? 'Ouch, spiky!' : 'Bonk!', 'bad');
  if (t.kind === 'rock' || t.kind === 'crate') knock(t, 1);
}

/** The boss swam into something: it stops, sees stars, and falls back. */
function crashBoss(t) {
  t.hitBoss = true;
  if (state.t - state.bossCrashAt < 1.6) return;
  state.bossCrashAt = state.t;
  state.stunUntil = state.t + 1.3;
  state.gap = gapAfter(state.gap, 'crash');
  bonk();
  call(window.SproutsSidecar?.sound, 'boss.attack');
  const what = t.kind === 'jelly' ? 'jellyfish' : t.kind === 'puffer' ? 'puffer' : t.kind;
  toast(`The boss hit a ${what}!`, 'good');
  if (t.kind !== 'vent') knock(t, -1);
}

/** Send a thing tumbling away. */
function knock(t, dir) {
  t.fly = { vx: dir * 4 + (Math.random() - 0.5) * 2, vy: 3 + Math.random() * 3, spin: (Math.random() - 0.5) * 8 };
}

/* ---------- caught: the boss chomps, as the running pen's monster does ---------- */

function caught() {
  state.phase = 'over';
  state.overAt = state.t;
  state.readyToReplay = false;
  keys.up = keys.down = keys.left = keys.right = false;
  pointerAim = null;
  chomp();
  call(window.SproutsSidecar?.sound, 'player.hit');
  askEl.hidden = true;
  instructionsEl.hidden = true;
  caughtEl.textContent = 'Chomp!';
  caughtEl.classList.remove('free');
  caughtEl.classList.add('show');
  dropColumn();
  const m = meters(state.distance);
  const best = saveBest(m);
  overStatsEl.textContent = state.asking ? `${m} m · ⭐ ${state.stars} · 🐚 ${state.shells}` : `${m} m · best ${best} · 🐚 ${state.shells}`;
  // Into the boss's jaw, wriggling.
  bossCatch.grab(boss);
  speak(`Chomp! ${bossName(design)} got you. You swam ${m} meters.`);
  const endsHere = state.mode === 'endless' && embedded && !state.arcade;
  setTimeout(() => {
    if (state.phase !== 'over') return;
    if (endsHere) {
      againTap.textContent = 'Great swimming!';
      againEl.hidden = false;
      setTimeout(() => call(window.SproutsSidecar?.finish, 'caught'), 1800);
      return;
    }
    againTap.textContent = state.mode === 'quiz' ? 'Tap to swim on' : 'Tap to swim again';
    againEl.hidden = false;
    state.readyToReplay = true;
  }, BOSS_CHOMP_SECONDS * 1000);
}

function releaseHero() {
  bossCatch.release();
  swimmer.scale.setScalar(1);
  swimmer.rotation.set(0, 0, 0);
  swimmer.position.set(state.x, state.y, 0);
}

/** Tap after the chomp: Play swims on with the same question; endless starts over. */
function replay() {
  if (!state.readyToReplay) return;
  state.readyToReplay = false;
  againEl.hidden = true;
  caughtEl.classList.remove('show');
  if (state.mode === 'quiz') continueRun();
  else startGame('endless');
}

/** Back in the water after a chomp in Play: same question, stars, and distance. */
function continueRun() {
  releaseHero();
  clearThings();
  Object.assign(state, {
    phase: 'run', gap: GAP.start, throttle: SPEED.cruise, x: BUDDY_X, boostUntil: 0, slowUntil: 0, safeUntil: state.t + 2, stunUntil: 0, spawnIn: 1.5
  });
  buddyTrail.length = 0;
  seedBossPath(BUDDY_X - GAP.start - 1.2 * boss.scale, state.y);
  hud.hidden = false;
  if (state.q && !state.answered) {
    askEl.hidden = false;
    state.rowDue = state.t + 1.5;
    state.calmUntil = state.t + 3;
  } else state.nextAt = performance.now() + 1200;
}

/* ---------- getting away: after the last question in Play ---------- */

function getAway() {
  if (state.phase !== 'run') return;
  state.phase = 'free';
  state.overAt = state.t;
  askEl.hidden = true;
  instructionsEl.hidden = true;
  dropColumn();
  state.stunUntil = state.t + 99;
  fanfare();
  call(window.SproutsSidecar?.sound, 'boss.defeat');
  caughtEl.textContent = 'Got away!';
  caughtEl.classList.add('show', 'free');
  speak('You got away!');
  setTimeout(() => {
    caughtEl.classList.remove('show');
    if (embedded && state.source === 'host') call(window.SproutsSidecar?.finish, 'escaped');
    else endRound();
  }, 3200);
}

function endRound() {
  state.phase = 'end';
  askEl.hidden = true;
  hud.hidden = true;
  instructionsEl.hidden = true;
  const total = roundTotal() || LOCAL_ROUND;
  titleEl.textContent = 'You got away!';
  verdictEl.hidden = false;
  verdictEl.textContent = `⭐ ${state.stars} / ${total}`;
  reasonEl.hidden = false;
  reasonEl.textContent = `${meters(state.distance)} m · 🐚 ${state.shells}`;
  intro.forEach(el => { el.hidden = true; });
  playBtn.textContent = 'Play again';
  showMenu();
  speak(`You got away! You earned ${state.stars} stars.`);
}

function resetRun(mode) {
  dropColumn();
  releaseHero();
  clearThings();
  caughtEl.classList.remove('show');
  againEl.hidden = true;
  state.readyToReplay = false;
  Object.assign(state, {
    mode, t: 0, distance: 0, shells: 0,
    speed: swimSpeed(SPEED.cruise), throttle: SPEED.cruise, x: BUDDY_X,
    asking: !state.arcade,
    boostUntil: 0, slowUntil: 0, safeUntil: 0, stunUntil: 0, bossCrashAt: -9,
    gap: GAP.start, y: 0, aimY: 0, vy: 0, spawnIn: 1.2, nextAt: 0, calmUntil: 0
  });
  pointerAim = null;
  buddyTrail.length = 0;
  if (mode === 'endless' || state.source === 'local') {
    state.step = 0;
    state.stars = 0;
    state.q = null;
  }
  if (!boss) buildBoss(design);
  seedBossPath(BUDDY_X - GAP.start - 1.2 * boss.scale, 0);
}

function startGame(mode) {
  wakeAudio();
  if (!design) design = saveBoss(DEFAULT_BOSS);
  overlay.hidden = true;
  builderCard.hidden = true;
  hud.hidden = false;
  instructionsEl.hidden = false;
  setTimeout(() => { if (state.phase === 'run') instructionsEl.hidden = true; }, 6000);
  resetRun(mode);
  // Tell Sprouts which way this round goes: endless keeps asking until the catch.
  if (embedded && !state.arcade) send('need', { endless: mode === 'endless' });
  state.phase = 'wait';
  state.waitSince = performance.now();
  askEl.hidden = true;
  if (!state.asking) state.phase = 'run';
  else if (mode === 'endless') {
    // A first stretch of swimming, then questions now and then.
    state.phase = 'run';
    state.nextAt = performance.now() + 4000;
  } else if (state.source === 'host' && state.pending) { state.phase = 'run'; present(state.pending); }
  else if (state.source === 'local') { state.phase = 'run'; nextLocal(); }
  paintHud();
}
playBtn.addEventListener('click', () => startGame(state.arcade ? 'endless' : 'quiz'));
endlessBtn.addEventListener('click', () => startGame('endless'));

addEventListener('message', (event) => {
  if (!embedded || event.source !== window.parent) return;
  const data = event.data;
  if (!data || data.source !== SIDECAR_SOURCE) return;
  if (data.type === 'ask') hostAsk(data);
  else if (data.type === 'arcade') {
    state.arcade = true;
    state.source = 'local';
    playBtn.textContent = 'Swim';
    endlessBtn.hidden = true;
    paintFocus();
  } else if (data.type === 'clear') {
    // Sprouts has asked every question in this round.
    state.cleared = true;
    state.pending = null;
    state.nextAt = Math.max(state.nextAt, performance.now() + 900);
  }
});

/* ---------- the run ---------- */

function stepRun(dt, now) {
  state.t += dt;
  const endless = state.mode === 'endless';
  const reading = !!column && !state.answered;
  // Right and left keys (or the stick) push the speed up or down; it stays where it is let go.
  if (keys.right) state.throttle = Math.min(1, state.throttle + dt * 0.9);
  if (keys.left) state.throttle = Math.max(0, state.throttle - dt * 0.9);
  const base = swimSpeed(state.throttle, state.t, endless);
  state.speed += (speedNow(base, { reading, boosting: now < state.boostUntil, slowed: now < state.slowUntil }) - state.speed) * Math.min(1, dt * 3);
  const drift = state.speed * dt;
  state.distance += drift;

  // Questions: local ones come on a timer; the host's wait until the last one is done.
  if (state.asking && (state.answered || !state.q) && state.nextAt && now >= state.nextAt) {
    if (state.cleared && state.mode === 'quiz') { getAway(); return; }
    // Still no word from Sprouts after a while: use the game's own questions.
    if (state.source === 'wait' && now - state.waitSince > 4000) state.source = 'local';
    if (state.source === 'local') { state.nextAt = 0; nextLocal(); if (state.phase !== 'run') return; }
    else if (state.pending && state.pending !== state.q) { state.nextAt = 0; present(state.pending); }
  }
  if (state.q && !state.answered && !column && state.t >= state.rowDue) spawnColumn();

  // The buddy swims toward the finger, or up and down with the keys.
  if (keys.up || keys.down) state.aimY = THREE.MathUtils.clamp(state.y + (keys.up ? 3 : -3), BAND.bottom, BAND.top);
  else if (pointerAim != null) state.aimY = pointerAim;
  const was = state.y;
  state.y = swimToward(state.y, state.aimY, dt, keys.up || keys.down ? 3 : 5);
  state.vy = (state.y - was) / Math.max(dt, 1e-3);
  buddyTrail.push({ t: state.t, y: state.y });
  trimTrail(buddyTrail, state.t, 8);
  state.x += (BUDDY_X + (state.throttle - 0.5) * 3 - state.x) * Math.min(1, dt * 3);
  const me = { x: state.x, y: state.y };

  // The boss: on the buddy's path, late by how far behind it is, and slow to turn.
  const stunned = state.t < state.stunUntil;
  if (!stunned) {
    state.gap = stepGap(state.gap, dt, creepRate(state.t, endless, design.size), {
      calm: state.t < state.calmUntil, speed: state.speed, boss: bossSpeed(state.t, endless)
    });
  }
  else state.gap = Math.min(GAP.max, state.gap + dt * 0.4);
  const late = state.gap / Math.max(3, state.speed);
  const aim = bossAim(buddyTrail, state.t, late);
  const by = bossPos.y + (aim - bossPos.y) * Math.min(1, dt * (stunned ? 0.5 : 2.2));
  const bx = state.x - state.gap - 1.2 * boss.scale;
  swimBoss(dt, bossPos.x + (bx - bossPos.x) * Math.min(1, dt * 4), by, drift);
  const bossHead = { x: bossPos.x, y: bossPos.y };
  const bossBody = boss.segs[0] ? { x: boss.segs[0].group.position.x, y: boss.segs[0].group.position.y } : bossHead;

  // Answer bubbles float past.
  if (column) {
    column.x -= drift;
    for (const a of column.items) {
      if (a.gone) continue;
      a.group.position.set(column.x, a.y + Math.sin(state.t * 2 + a.phase) * 0.2, 0);
      if (touching(me, a.group.position, BUDDY_R, ANSWER_R)) { grab(a); if (state.phase !== 'run') return; }
    }
    if (column && column.x < state.x - 5) {
      const missed = !state.answered;
      dropColumn();
      // Missed the right one: the column comes round again.
      if (missed && state.q) state.rowDue = state.t + 1;
    }
  }

  // New things in the water, but none in the way of answers on their way in.
  const quiet = (state.q && !state.answered) && (!column || column.x > state.x);
  state.spawnIn -= drift;
  if (state.spawnIn <= 0) {
    state.spawnIn = 5 + Math.random() * 5 - Math.min(2.5, state.t * 0.02);
    if (!quiet) spawnThing();
  }

  for (const t of things) {
    t.x -= drift;
    t.phase += dt;
    if (t.fly) {
      t.fly.vy -= 9 * dt;
      t.x += t.fly.vx * dt;
      t.y += t.fly.vy * dt;
      t.obj.rotation.z += t.fly.spin * dt;
    } else if (t.kind === 'crate' && t.vy) {
      t.vy -= 6 * dt;
      t.y = Math.max(BAND.bottom - 1.6, t.y + t.vy * dt);
      t.obj.rotation.z = Math.sin(t.phase * 3) * 0.15;
      if (t.y <= BAND.bottom - 1.6) t.vy = 0.0001;
    } else if (t.kind === 'jelly') {
      t.y = t.baseY + Math.sin(t.phase * 1.6) * 0.8;
    } else if (t.kind === 'puffer') {
      t.y = t.baseY + Math.sin(t.phase * 1.2) * 0.4;
      // A puffer puffs by itself when the buddy comes close, too.
      if (!(t.on > 0) && Math.abs(t.x - state.x) < 3.2 && Math.abs(t.y - state.y) < 3) t.on = 3;
    }
    if (t.on > 0) t.on -= dt;
    animateThing(t, dt);
    t.obj.position.set(t.x, t.y, 0);
    if (t.fly) continue;

    if (t.kind === 'vent') {
      if (Math.abs(t.x - state.x) < 1 && now >= state.boostUntil - 500) { state.boostUntil = now + 1500; whoosh(); toast('Bubble boost!', 'good'); }
      continue;
    }
    if (t.kind === 'shell') {
      if (touching(me, t, BUDDY_R, t.r)) {
        state.shells++;
        state.gap = gapAfter(state.gap, 'shell');
        pop();
        explode(t.obj.position);
        t.x = GONE_X - 10;
      }
      continue;
    }
    if (!t.hitBuddy && touching(me, t, BUDDY_R, t.r)) bumpBuddy(t);
    if (!t.hitBoss && (touching(bossHead, t, boss.radius, t.r) || touching(bossBody, t, boss.radius * 0.9, t.r))) crashBoss(t);
  }
  const gone = things.filter(t => t.x < GONE_X || t.y < -20);
  if (gone.length) {
    gone.forEach(dropThing);
    things = things.filter(t => !gone.includes(t));
  }

  if (now > bubbleNext) {
    bubbleNext = now + 180 + Math.random() * 200;
    puffBubble(state.x + 0.4, state.y + 0.5, 1);
  }

  if (isCaught(state.gap)) caught();
}

function animateThing(t, dt) {
  const u = t.obj.userData;
  if (t.kind === 'jelly') {
    const lit = t.on > 0;
    const grow = lit ? 1.6 : 1;
    const s = t.obj.scale.x + (grow - t.obj.scale.x) * Math.min(1, dt * 6);
    t.obj.scale.setScalar(s);
    t.r = t.baseR * s;
    u.glowCore.visible = lit && Math.sin(t.phase * 20) > -0.3;
    u.legs.forEach((leg, i) => { leg.rotation.z = Math.sin(t.phase * 4 + i) * 0.25; });
  } else if (t.kind === 'puffer') {
    const on = t.on > 0;
    const grow = on ? 2 : 1;
    const s = u.body.scale.x + (grow - u.body.scale.x) * Math.min(1, dt * 8);
    u.body.scale.setScalar(s);
    u.spikes.scale.setScalar(on ? 1 : 0.2);
    t.r = t.baseR * s;
    u.tail.rotation.y = Math.sin(t.phase * 10) * 0.5;
  } else if (t.kind === 'vent') {
    for (const b of u.rising) {
      b.position.y += dt * 3;
      if (b.position.y > BAND.top + 3) b.position.y = BAND.bottom - 1.5;
    }
  } else if (t.kind === 'shell') {
    t.obj.rotation.y += dt * 2;
  }
}

/* ---------- drawing every frame ---------- */

let last = performance.now();
const clock = { t: 0 };

function animateSea(dt, drift) {
  for (const s of seabeds) {
    s.position.x -= drift * 0.9;
    if (s.position.x < -SEA_W * 1.5) s.position.x += SEA_W * 2;
  }
  for (const s of scenery) {
    s.obj.position.x -= drift * s.par;
    if (s.obj.position.x < -40) s.obj.position.x += 76;
    if (s.kelp) s.obj.userData.parts.forEach((p, i) => { p.rotation.z = Math.sin(clock.t * 1.5 + s.phase + i * 0.6) * 0.15; });
  }
  for (const m of flow) {
    m.position.x -= drift * m.userData.k * 1.4 + dt * 0.3;
    m.rotation.x += m.userData.spin * dt;
    m.rotation.y += m.userData.spin * dt * 0.7;
    if (m.position.x < -32) { m.position.x = 30 + Math.random() * 4; m.position.y = -9 + Math.random() * 18; }
  }
  rays.forEach(r => { r.material.opacity = 0.06 + Math.sin(clock.t * 0.8 + r.userData.phase) * 0.03; r.position.x -= drift * 0.1; if (r.position.x < -36) r.position.x += 66; });
  for (const b of bubbles) {
    if (b.life <= 0) continue;
    b.life -= dt;
    b.mesh.position.y += dt * 2.2;
    b.mesh.position.x -= drift * 0.6;
    if (b.life <= 0) b.mesh.visible = false;
  }
}

function animateHero(dt) {
  const swimming = state.phase !== 'over';
  const pace = state.phase === 'run' ? THREE.MathUtils.clamp(state.speed / 9, 0.4, 1.4) : 1;
  hero.animate(dt, swimming ? Math.min(1, pace) : 0.2, clock.t);
  if (bossCatch.rig) {
    bossCatch.wriggle(hero, clock.t);
    return;
  }
  // Arms sweep like a swimmer; the body lies along the water and leans with the climb.
  state.stroke = (state.stroke || 0) + dt * 9 * pace;
  hero.arms[0].rotation.x = -1.6 + Math.sin(state.stroke) * 1.2;
  hero.arms[1].rotation.x = -1.6 - Math.sin(state.stroke) * 1.2;
  const bump = state.t < state.safeUntil && state.phase === 'run' ? Math.sin(clock.t * 30) * 0.15 : 0;
  const lean = -1.25 + THREE.MathUtils.clamp(state.vy * 0.06, -0.5, 0.5) + bump;
  swimmer.rotation.z += (lean - swimmer.rotation.z) * Math.min(1, dt * 8);
  let x = state.phase === 'menu' || state.phase === 'build' ? BUDDY_X : state.x;
  let y = state.y;
  if (state.phase === 'menu' || state.phase === 'build') y = Math.sin(clock.t * 1.2) * 1.2;
  if (state.phase === 'free') x = state.x + (state.t - state.overAt) * (state.t - state.overAt) * 6;
  swimmer.position.set(x, y + Math.sin(clock.t * 4) * 0.12, 0);
  // Blink when hit. Out of the way while the boss is being built.
  swimmer.visible = state.phase !== 'build' && !(state.t < state.safeUntil && state.phase === 'run' && Math.sin(clock.t * 40) > 0.6);
}

function animateBoss(dt, drift) {
  if (!boss) return;
  if (state.phase === 'build' || state.phase === 'menu' || state.phase === 'end' || state.phase === 'wait') {
    // Swims on the spot so its body wiggles; in the builder it comes up close.
    const portrait = camera.aspect < 1;
    const hx = state.phase === 'build' ? (portrait ? 1 : -2) : BUDDY_X - 8;
    const hy = state.phase === 'build' ? (portrait ? 1.5 : 0) + Math.sin(clock.t * 1.6) * 0.8 : Math.sin(clock.t * 1.2 - 1) * 1.2;
    swimBoss(dt, bossPos.x + (hx - bossPos.x) * Math.min(1, dt * 3), hy, dt * 5);
  } else if (state.phase === 'over') {
    // Lunges in, then bobs about pleased with its catch.
    const blend = bossLungeBlend(state.t - state.overAt, dt);
    swimBoss(dt, bossPos.x + (state.x - 0.6 - bossPos.x) * blend, bossPos.y + (state.y - bossPos.y) * dt * 3 + Math.sin(clock.t * 2) * 0.01, drift);
  } else if (state.phase === 'free') {
    swimBoss(dt, bossPos.x - dt * 3, bossPos.y + Math.sin(clock.t * 3) * 0.02, drift);
  }
  // The run clock keeps going through the chomp and the getaway, which are timed by it.
  if (state.phase === 'over' || state.phase === 'free') state.t += dt;
  const stunned = state.t < state.stunUntil && (state.phase === 'run' || state.phase === 'free');
  const chomping = state.phase === 'over' ? 1 : state.gap < 3 && state.phase === 'run' ? 0.6 : 0;
  const blink = stunned ? 0.15 : Math.sin(clock.t * 2.3) > 0.97 ? 0.1 : 1;
  boss.animate(clock.t, stunned ? 0.3 : 1.2, chomping, blink);
  dizzy.visible = stunned;
  if (stunned) {
    dizzy.position.set(bossPos.x, bossPos.y + 1.6 * boss.scale, 0);
    dizzy.rotation.y += dt * 6;
  }
}

function animateBurst(dt) {
  if (burst.t < 0) return;
  burst.t += dt;
  let alive = false;
  for (const p of burst.parts) {
    const k = Math.min(1, burst.t / p.speed);
    const e = 1 - Math.pow(1 - k, 4);
    p.mesh.position.copy(p.to).multiplyScalar(e);
    p.mesh.scale.setScalar(Math.max(0.01, 0.35 * (1 - e)));
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

  // Inside Sprouts with no question after a while: play the game's own questions.
  if (state.phase === 'wait' && state.source === 'wait' && now - state.waitSince > 4000) {
    state.source = 'local';
    state.phase = 'run';
    if (state.mode === 'quiz') nextLocal(); else state.nextAt = now + 2000;
  }
  if (state.phase === 'wait' && state.source === 'host' && state.pending) {
    state.phase = 'run';
    present(state.pending);
  }

  let drift = dt * 2.5;
  if (state.phase === 'run') {
    stepRun(dt, now);
    drift = state.speed * dt;
    paintHud();
  } else if (state.phase === 'over' || state.phase === 'free') {
    state.speed *= Math.exp(-dt * (state.phase === 'over' ? 3 : 0.5));
    drift = state.speed * dt;
  }
  animateSea(dt, drift);
  if (state.phase !== 'run') for (const t of things) { t.x -= drift; t.obj.position.x = t.x; }

  if (state.flash > 0) {
    state.flash = Math.max(0, state.flash - dt);
    renderer.setClearColor(FLASH, state.flash * 0.6);
  }

  animateHero(dt);
  animateBoss(dt, drift);
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
buildBoss(design || DEFAULT_BOSS);
seedBossPath(BUDDY_X - 8, 0);
moveCamera(0, true);
playBtn.disabled = false;
playBtn.textContent = 'Play';
// First time here: build a boss before anything else.
if (design) showMenu(); else openBuilder();
moveCamera(0, true);
call(window.SproutsSidecar?.ready);
if (new URLSearchParams(location.search).has('debug')) {
  window.__boss = { state, things: () => things, spawnThing, setOff, column: () => column, startGame, openBuilder, boss: () => boss, design: () => design, getAway, caught };
}
requestAnimationFrame(frame);
