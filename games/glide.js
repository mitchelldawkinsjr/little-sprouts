/**
 * Island glide — a little red plane over a slowly turning green world.
 * Move the finger, mouse, or arrows and the plane eases after it, tilting as it goes.
 * A controller works through the shared Little Sprouts controller (lib/pad.js): the d-pad
 * and left stick arrive as arrow keys, and the right stick and trigger as the pointer.
 * The world turns under the plane and brings gems around: yellow gems are fuel, labeled
 * gems are answers. Hills rise from the land and storm clouds float in the air; hitting
 * one, or the ground, costs a heart. No hearts or an empty tank ends the flight.
 *
 * The look and feel follow Zultan's CodePen "mwGZBP" (a take on The Aviator): a turning
 * cylinder of land with low-poly trees and flowers, orbiting clouds, a big low sun, warm
 * fog, and a plane that chases the pointer. The scene is rebuilt here for current Three.js,
 * the learner's garden buddy flies the plane, and the gems and questions are Little Sprouts'.
 */
import { gamePaused } from '../lib/hold.js?v=hold2';
import { makeBuddy, buddyKind } from '../lib/buddy3d.mjs?v=ball3';
import {
  resolveAutoQuality, pixelRatioCap, rendererOptions, isPerformanceTier
} from '../lib/device-tier.mjs?v=low-end1';

const THREE_URL = '../vendor/three/build/three.module.js?v=r187';
const TAU = Math.PI * 2;

/** The pen's palette. */
export const COLORS = {
  red: 0xf25346,
  yellow: 0xedeb27,
  white: 0xd8d0d1,
  brown: 0x59332e,
  brownDark: 0x23190f,
  blue: 0x68c3c0,
  green: 0x458248,
  lightgreen: 0x629265,
  fog: 0xf7d9aa
};

/** The world: land radius, how far its center sits below the horizon, and the flying lane. */
export const LAND_R = 600;
export const LANE_Z = -250;
/** Where the plane may go (world units). Low enough to touch the ground, so flying low is risky. */
export const BOX = { x0: -100, x1: -20, y0: 4, y1: 190 };
/** Hearts per flight. */
export const LIVES = 3;
/** Wheels touch the land below this height. */
export const GROUND_CLEAR = 12;
/** Seconds of blinking after a bump, when nothing else can hit. */
export const SAFE_TIME = 1.6;
/** Radians per second the land turns: the pen turns 0.005 a frame. */
export const TURN = 0.24;

let active = null;

export function stopGlide() {
  active?.destroy();
  active = null;
}

/** Map v from [vmin, vmax] (clamped) onto [tmin, tmax]. */
export function normalize(v, vmin, vmax, tmin, tmax) {
  const nv = Math.max(Math.min(v, vmax), vmin);
  return tmin + ((nv - vmin) / (vmax - vmin)) * (tmax - tmin);
}

/** Where the plane wants to be for a pointer at (-1..1, -1..1), y up. */
export function aimFor(px, py) {
  return {
    x: normalize(px, -0.75, 0.75, BOX.x0, BOX.x1),
    y: normalize(py, -0.75, 0.75, BOX.y0, BOX.y1)
  };
}

/**
 * One frame of the pen's chase: move a tenth of the way (per 60th of a second) and tilt by
 * what is left. Returns the new position and rotation.
 */
export function chase(plane, aim, dt) {
  const k = 1 - Math.pow(0.9, dt * 60);
  const x = plane.x + (aim.x - plane.x) * k;
  const y = plane.y + (aim.y - plane.y) * k;
  const tilt = v => Math.max(-0.7, Math.min(0.7, v));
  return {
    x,
    y,
    rz: tilt((aim.y - y) * 0.0128),
    rx: tilt((y - aim.y) * 0.0064),
    ry: tilt((x - aim.x) * 0.0064)
  };
}

/** A world point as an angle around the land's center and a height above the land. */
export function onLand(x, y) {
  return { angle: Math.atan2(y + LAND_R, x), alt: Math.hypot(x, y + LAND_R) - LAND_R };
}

/** How tall a hill (h high, `base` wide each side) stands `d` units along the land from its peak. */
export function hillTop(d, hill) {
  return hill.h * Math.max(0, 1 - Math.abs(d) / hill.base);
}

/** Whether the plane (`alt` high, `d` along from a hill's peak) touches that hill. */
export function hitsHill(d, alt, hill) {
  const reach = Math.max(0, Math.abs(d) - 12);
  return alt - 8 < hill.h * Math.max(0, 1 - reach / hill.base);
}

/** A spot `height` above the land, `ahead` radians in front of the top, after the land turned `turn`. */
export function spotOnLand(ahead, height) {
  const r = LAND_R + height;
  const a = Math.PI / 2 - ahead;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r - LAND_R };
}

/** Heights (above the land) for the answer gems, so the plane has to move to each one. */
export const ASK_HEIGHTS = [70, 150, 110, 180, 60];

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function call(fn, ...args) {
  try { return fn?.(...args); } catch { return undefined; }
}

export function mountGlide(root, { reduced, onScore, nextQuestion, onPrompt, onClear, onMiss, onOver, onFinished } = {}) {
  stopGlide();
  const session = {
    dead: false,
    raf: 0,
    cleanups: [],
    destroy() {
      if (this.dead) return;
      this.dead = true;
      cancelAnimationFrame(this.raf);
      this.cleanups.forEach(fn => { try { fn(); } catch { /* gone */ } });
      if (active === this) active = null;
    }
  };
  active = session;
  root.innerHTML = `<div class="glide-play"><div class="glide" role="application" aria-label="Move your finger or the mouse and the plane follows. Grab the gem with the answer." style="background:linear-gradient(#e4e0ba,#f7d9aa)"><p class="city-wait" style="margin:0;padding:24px;text-align:center;font:700 18px Outfit,sans-serif;color:#5a3a22">The island is coming.</p></div></div>`;
  const stage = root.querySelector('.glide');
  import(THREE_URL).then(THREE => {
    if (session.dead) return;
    stage.querySelector('.city-wait')?.remove();
    begin(THREE, stage, session, { reduced, onScore, nextQuestion, onPrompt, onClear, onMiss, onOver, onFinished });
  }).catch(() => {
    if (session.dead) return;
    const wait = stage.querySelector('.city-wait');
    if (wait) wait.textContent = 'The island could not load. Check the connection and try again.';
  });
  return { destroy: () => session.destroy(), peek: () => session.peek?.() };
}

function begin(THREE, stage, session, { reduced, onScore, nextQuestion, onPrompt, onClear, onMiss, onOver, onFinished }) {
  const tier = resolveAutoQuality();
  const lowGpu = isPerformanceTier(tier);
  const calm = reduced ? 0.8 : 1;
  const rand = mulberry(19);

  const view = document.createElement('canvas');
  const hud = document.createElement('canvas');
  for (const c of [view, hud]) {
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  }
  view.className = 'glide-view';
  hud.style.pointerEvents = 'none';
  stage.append(view, hud);
  const ctx = hud.getContext('2d');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: view, ...rendererOptions(tier), alpha: true });
    if (!renderer.getContext()) throw new Error('no-webgl');
  } catch {
    view.remove();
    hud.remove();
    stage.append(Object.assign(document.createElement('p'), {
      className: 'city-wait',
      textContent: 'Island glide needs WebGL. Update the browser or turn on hardware acceleration.'
    }));
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap(tier)));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = !lowGpu;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COLORS.fog, 100, 950);
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 1, 10000);
  camera.position.set(0, 150, 100);

  // Lights: the pen's hemisphere and sun. Current Three.js wants about π times the old numbers.
  scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9 * Math.PI));
  const sunLight = new THREE.DirectionalLight(0xffffff, 0.9 * Math.PI);
  sunLight.position.set(0, 350, 350);
  sunLight.castShadow = !lowGpu;
  Object.assign(sunLight.shadow.camera, { left: -650, right: 650, top: 650, bottom: -650, near: 1, far: 1000 });
  sunLight.shadow.mapSize.set(tier === 'cinematic' ? 2048 : 1024, tier === 'cinematic' ? 2048 : 1024);
  scene.add(sunLight);

  const flat = (color, extra = {}) => new THREE.MeshPhongMaterial({ color, flatShading: true, ...extra });
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  // The pen pulls box corners on the -x end in; this does the same on Three's newer boxes.
  const pinchBack = (geom, fn) => {
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getX(i) >= 0) continue;
      const v = fn(pos.getY(i), pos.getZ(i));
      pos.setY(i, v.y);
      pos.setZ(i, v.z);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    return geom;
  };
  const mesh = (geom, mat, shadow = true) => {
    const m = new THREE.Mesh(geom, mat);
    m.castShadow = shadow;
    m.receiveShadow = shadow;
    return m;
  };

  // Land: a long green cylinder lying along z, turning about its axis.
  const world = new THREE.Group();
  world.position.y = -LAND_R;
  scene.add(world);
  const landGeom = new THREE.CylinderGeometry(LAND_R, LAND_R, 1700, 40, 10);
  landGeom.rotateX(-Math.PI / 2);
  const land = mesh(landGeom, flat(COLORS.lightgreen));
  land.castShadow = false;
  world.add(land);

  // Trees and flowers stand on the land. Each part is one instanced mesh, so 650 plants stay cheap.
  const plantParts = new Map();
  const part = (key, geom, mat, shadow = true) => {
    if (!plantParts.has(key)) plantParts.set(key, { geom, mat, shadow, list: [], colors: [] });
    return plantParts.get(key);
  };
  const leavesMat = flat(COLORS.green);
  const treeParts = [
    { p: part('trunk', box(10, 20, 10), new THREE.MeshBasicMaterial({ color: COLORS.brown })), y: 0 },
    { p: part('leaf1', new THREE.CylinderGeometry(1, 36, 36, 4), leavesMat), y: 20 },
    { p: part('leaf2', new THREE.CylinderGeometry(1, 27, 27, 4), leavesMat), y: 40 },
    { p: part('leaf3', new THREE.CylinderGeometry(1, 18, 18, 4), leavesMat), y: 55 }
  ];
  const petalGeom = pinchBack(box(15, 20, 5), (y, z) => ({ y: y - Math.sign(y) * 4, z }));
  petalGeom.translate(12.5, 0, 3);
  const stem = part('stem', box(5, 50, 5), flat(COLORS.green), false);
  const core = part('core', box(10, 10, 10), flat(COLORS.yellow), false);
  const petals = part('petal', petalGeom, new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const petalColors = [COLORS.red, COLORS.yellow, COLORS.blue];
  const place = new THREE.Matrix4();
  const local = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const standAt = (a, z, s) => {
    q.setFromAxisAngle(zAxis, a - Math.PI / 2);
    return new THREE.Matrix4().compose(
      new THREE.Vector3(Math.cos(a) * 605, Math.sin(a) * 605, z), q, new THREE.Vector3(s, s, s));
  };
  const nTrees = lowGpu ? 140 : 300;
  for (let i = 0; i < nTrees; i++) {
    // Trees stay off the flying lane, so the plane never seems to fly through one.
    const z = -rand() * 460;
    const at = standAt((TAU / nTrees) * i, z > -180 ? z : z - 140, 0.3 + rand() * 0.75);
    treeParts.forEach(({ p, y }) => p.list.push(at.clone().multiply(local.makeTranslation(0, y, 0))));
  }
  const nFlowers = lowGpu ? 150 : 350;
  for (let i = 0; i < nFlowers; i++) {
    const at = standAt((TAU / nFlowers) * i, -rand() * 600, 0.1 + rand() * 0.3);
    stem.list.push(at.clone());
    const head = at.clone().multiply(local.makeTranslation(0, 25, 3));
    core.list.push(head.clone());
    const color = new THREE.Color(petalColors[Math.floor(rand() * 3)]);
    for (let k = 0; k < 4; k++) {
      petals.list.push(head.clone().multiply(local.makeRotationZ(k * Math.PI / 2)));
      petals.colors.push(color);
    }
  }
  const forest = new THREE.Group();
  world.add(forest);
  for (const { geom, mat, shadow, list, colors } of plantParts.values()) {
    const inst = new THREE.InstancedMesh(geom, mat, list.length);
    list.forEach((m, i) => inst.setMatrixAt(i, m));
    colors.forEach((c, i) => inst.setColorAt(i, c));
    inst.castShadow = shadow && !lowGpu;
    inst.receiveShadow = shadow;
    forest.add(inst);
  }

  // Clouds: clumps of dodecahedrons on a wider ring that turns a little slower than the land.
  const sky = new THREE.Group();
  sky.position.y = -LAND_R;
  scene.add(sky);
  const cloudGeom = new THREE.DodecahedronGeometry(20, 0);
  const cloudMat = new THREE.MeshPhongMaterial({ color: COLORS.white });
  const nClouds = 25;
  for (let i = 0; i < nClouds; i++) {
    const cloud = new THREE.Group();
    const blocks = 3 + Math.floor(rand() * 3);
    for (let b = 0; b < blocks; b++) {
      const m = mesh(cloudGeom, cloudMat, !lowGpu);
      m.position.set(b * 15, rand() * 10, rand() * 10);
      m.rotation.set(0, rand() * TAU, rand() * TAU);
      const s = 0.1 + rand() * 0.9;
      m.scale.set(s, s, s);
      cloud.add(m);
    }
    const a = (TAU / nClouds) * i;
    const h = 800 + rand() * 200;
    cloud.position.set(Math.cos(a) * h, Math.sin(a) * h, -400 - rand() * 400);
    cloud.rotation.z = a + Math.PI / 2;
    const s = 1 + rand() * 2;
    cloud.scale.set(s, s, s);
    sky.add(cloud);
  }

  // The big low sun behind everything, softened by the fog.
  const sun = new THREE.Mesh(new THREE.SphereGeometry(400, 20, 10), flat(COLORS.yellow));
  sun.scale.set(1, 1, 0.3);
  sun.position.set(0, -30, -850);
  scene.add(sun);

  // The plane, built as in the pen, with the learner's buddy in the seat.
  const plane = new THREE.Group();
  const red = flat(COLORS.red);
  const white = flat(COLORS.white);
  const cockpitGeom = pinchBack(box(80, 50, 50), (y, z) => ({ y: y > 0 ? y - 10 : y + 30, z: z - Math.sign(z) * 20 }));
  plane.add(mesh(cockpitGeom, red));
  const engine = mesh(box(20, 50, 50), white);
  engine.position.x = 40;
  plane.add(engine);
  const tail = mesh(box(15, 20, 5), red);
  tail.position.set(-35, 25, 0);
  plane.add(tail);
  const wingGeom = box(40, 4, 150);
  const wingTop = mesh(wingGeom, red);
  wingTop.position.set(20, 12, 0);
  const wingBottom = mesh(wingGeom, red);
  wingBottom.position.set(20, -3, 0);
  plane.add(wingTop, wingBottom);
  const shield = mesh(box(3, 15, 20), flat(COLORS.white, { transparent: true, opacity: 0.3 }));
  shield.position.set(5, 27, 0);
  plane.add(shield);
  const propeller = mesh(pinchBack(box(20, 10, 10), (y, z) => ({ y: y - Math.sign(y) * 5, z: z - Math.sign(z) * 5 })), flat(COLORS.brown));
  const bladeMat = flat(COLORS.brownDark);
  const blade1 = mesh(box(1, 100, 10), bladeMat);
  blade1.position.x = 8;
  const blade2 = mesh(box(1, 10, 100), bladeMat);
  blade2.position.x = 8;
  propeller.add(blade1, blade2);
  propeller.position.x = 50;
  plane.add(propeller);
  const guardR = mesh(box(30, 15, 10), white);
  guardR.position.set(25, -20, 25);
  const guardL = guardR.clone();
  guardL.position.z = -25;
  const tireMat = flat(COLORS.brownDark);
  const tireR = mesh(box(24, 24, 4), tireMat);
  tireR.position.set(25, -28, 25);
  tireR.add(mesh(box(10, 10, 6), flat(COLORS.brown)));
  const tireL = tireR.clone();
  tireL.position.z = -25;
  const tireB = tireR.clone();
  tireB.scale.set(0.5, 0.5, 0.5);
  tireB.position.set(-35, -5, 0);
  const strutGeom = box(4, 20, 4);
  strutGeom.translate(0, 10, 0);
  const strut = mesh(strutGeom, red);
  strut.position.set(-35, -5, 0);
  strut.rotation.z = -0.3;
  plane.add(guardR, guardL, tireR, tireL, tireB, strut);
  let pilot = null;
  try {
    pilot = makeBuddy(THREE, buddyKind(), { shadow: false, material: color => flat(color) });
    pilot.group.scale.setScalar(22);
    pilot.group.position.set(-12, 6, 0);
    pilot.group.rotation.y = Math.PI / 2;
    pilot.group.traverse(o => { o.castShadow = !lowGpu; });
    plane.add(pilot.group);
  } catch { pilot = null; }
  plane.scale.setScalar(0.42);
  plane.position.set(-40, 110, LANE_Z);
  scene.add(plane);

  // Gems ride on the land, so they come around with it.
  const track = new THREE.Group();
  world.add(track);
  const fuelGeom = new THREE.OctahedronGeometry(12, 0);
  const fuelMat = flat(COLORS.yellow, { emissive: 0x6a5a00 });
  const askGeom = new THREE.OctahedronGeometry(20, 0);
  const gems = [];
  let turn = 0;
  const addGem = (ahead, height, opts = {}) => {
    const ask = !!opts.ask;
    const mat = ask ? flat(new THREE.Color(opts.fill || '#fff4dc'), { emissive: 0x332a18 }) : fuelMat;
    const m = mesh(ask ? askGeom : fuelGeom, mat, !lowGpu);
    const gem = { mesh: m, height, ask, hot: !!opts.hot, gone: false, ...opts };
    placeGem(gem, ahead);
    track.add(m);
    gems.push(gem);
    return gem;
  };
  // Put a gem `ahead` radians in front of the top of the land as it stands now.
  const placeGem = (gem, ahead) => {
    gem.a = Math.PI / 2 - ahead - turn;
    const r = LAND_R + gem.height;
    gem.mesh.position.set(Math.cos(gem.a) * r, Math.sin(gem.a) * r, LANE_Z);
  };
  const dropGem = gem => {
    track.remove(gem.mesh);
    if (gem.ask) gem.mesh.material.dispose();
  };
  const gemWorld = gem => {
    const a = gem.a + turn;
    const r = LAND_R + gem.height;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r - LAND_R };
  };
  const fuelHeight = () => 60 + rand() * 120;
  const seedGems = () => {
    gems.splice(0).forEach(dropGem);
    for (let i = 0; i < 8; i++) addGem(0.55 + i * 0.3, fuelHeight());
  };

  // Obstacles ride on the land too: rocky hills to fly over and storm clouds to fly around.
  const hillMat = flat(0x9a7556);
  const hillCapMat = flat(COLORS.green);
  const stormMat = flat(0x737884);
  const boltMat = new THREE.MeshBasicMaterial({ color: 0xffd23a });
  const stormGeom = new THREE.DodecahedronGeometry(15, 0);
  const boltGeom = box(4, 18, 4);
  const obstacles = [];
  const wrap = a => {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  };
  const makeHill = (h, base) => {
    const g = new THREE.Group();
    const rock = mesh(new THREE.CylinderGeometry(6, base, h, 6, 1), hillMat, !lowGpu);
    rock.position.y = h / 2 - 4;
    const cap = mesh(new THREE.CylinderGeometry(1, base * 0.42, h * 0.32, 6, 1), hillCapMat, !lowGpu);
    cap.position.y = h * 0.84 - 4;
    g.add(rock, cap);
    return g;
  };
  const makeStorm = () => {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const m = mesh(stormGeom, stormMat, !lowGpu);
      m.position.set((i - 1.5) * 13, (i % 2) * 6, (i % 3) * 5 - 5);
      m.scale.setScalar(0.85 + (i % 2) * 0.35);
      g.add(m);
    }
    const bolt1 = new THREE.Mesh(boltGeom, boltMat);
    bolt1.position.set(-2, -16, 0);
    bolt1.rotation.z = 0.5;
    const bolt2 = new THREE.Mesh(boltGeom, boltMat);
    bolt2.position.set(3, -30, 0);
    bolt2.rotation.z = -0.5;
    g.add(bolt1, bolt2);
    return g;
  };
  const addObstacle = (kind, ahead, height = 70 + rand() * 110) => {
    const ob = kind === 'hill'
      ? { kind, h: 55 + rand() * 60, base: 45 + rand() * 25 }
      : { kind, height, radius: 30 };
    ob.mesh = kind === 'hill' ? makeHill(ob.h, ob.base) : makeStorm();
    ob.a = Math.PI / 2 - ahead - turn;
    if (kind === 'hill') {
      ob.mesh.position.set(Math.cos(ob.a) * LAND_R, Math.sin(ob.a) * LAND_R, LANE_Z);
      ob.mesh.rotation.z = ob.a - Math.PI / 2;
    } else {
      const r = LAND_R + ob.height;
      ob.mesh.position.set(Math.cos(ob.a) * r, Math.sin(ob.a) * r, LANE_Z);
      ob.mesh.rotation.z = ob.a - Math.PI / 2;
    }
    track.add(ob.mesh);
    obstacles.push(ob);
    // Fuel gems never hide inside an obstacle.
    gems.forEach(gem => {
      if (gem.ask || Math.abs(wrap(gem.a - ob.a)) > 0.16) return;
      if (kind === 'hill') gem.height = Math.max(gem.height, ob.h + 40);
      else if (Math.abs(gem.height - ob.height) < 60) gem.height = ob.height > 120 ? ob.height - 70 : ob.height + 70;
      placeGem(gem, Math.PI / 2 - turn - gem.a);
    });
    return ob;
  };
  const dropObstacle = ob => {
    track.remove(ob.mesh);
    ob.mesh.traverse(o => { if (o.geometry && o.geometry !== stormGeom && o.geometry !== boltGeom) o.geometry.dispose(); });
  };
  // Answers win: a storm next to a labeled gem moves up or down out of its way, and a gem
  // over a hill floats above the peak. Every answer stays reachable without a bump.
  const NEAR = 0.14;
  const stormAway = h => (h > 120 ? h - 85 : h + 85);
  const moveStorm = (ob, height) => {
    ob.height = Math.max(45, Math.min(185, height));
    const r = LAND_R + ob.height;
    ob.mesh.position.set(Math.cos(ob.a) * r, Math.sin(ob.a) * r, LANE_Z);
  };
  const makeRoom = gem => {
    const near = obstacles.filter(ob => Math.abs(wrap(ob.a - gem.a)) <= NEAR);
    // Hills first, since lifting the gem over one can bring it next to a storm.
    near.forEach(ob => {
      if (ob.kind !== 'hill' || ob.h + 45 <= gem.height) return;
      gem.height = ob.h + 45;
      placeGem(gem, Math.PI / 2 - turn - gem.a);
    });
    near.forEach(ob => {
      if (ob.kind === 'storm' && Math.abs(ob.height - gem.height) < 80) moveStorm(ob, stormAway(gem.height));
    });
  };
  // Heights of the labeled gems near a spot `ahead` of the top.
  const askHeightsAt = ahead => {
    const a = Math.PI / 2 - ahead - turn;
    return gems.filter(gem => gem.ask && !gem.gone && Math.abs(wrap(gem.a - a)) < NEAR).map(gem => gem.height);
  };

  let width = 960;
  let height = 540;
  let mode = 'title';
  let fuel = 1;
  let score = 0;
  let bonus = 0;
  let lap = 0;
  let asking = false;
  let askWait = 0;
  let slipped = false;
  let learningDone = false;
  let closed = false;
  let last = 0;
  let clock = 0;
  let lives = LIVES;
  let safe = 0;
  let bump = 0;
  let nextObstacle = 0;
  const aim = { x: -60, y: 120 };
  const keys = { up: false, down: false, left: false, right: false };
  const pos = { x: -40, y: 110 };

  const tell = () => call(() => onScore?.(score));

  const placeAsk = () => {
    if (typeof nextQuestion !== 'function' || learningDone || asking || closed) return;
    const pack = call(nextQuestion);
    if (!pack?.choices?.length) {
      learningDone = true;
      closed = true;
      call(onFinished);
      return;
    }
    slipped = false;
    asking = true;
    pack.choices.forEach((choice, i) => {
      const gem = addGem(0.6 + i * 0.42, ASK_HEIGHTS[i % ASK_HEIGHTS.length], {
        ask: true,
        label: String(choice.label || ''),
        ok: !!choice.ok,
        fill: choice.fill || '',
        shape: choice.shape || ''
      });
      makeRoom(gem);
    });
    call(onPrompt);
  };

  const start = () => {
    mode = 'fly';
    fuel = 1;
    score = 0;
    bonus = 0;
    lap = Math.floor(turn / TAU);
    asking = false;
    askWait = 0.6;
    slipped = false;
    lives = LIVES;
    safe = 0;
    bump = 0;
    aim.x = -60;
    aim.y = 120;
    obstacles.splice(0).forEach(dropObstacle);
    // A calm few seconds before the first obstacle.
    nextObstacle = turn + 0.9;
    seedGems();
    tell();
  };

  // A bump costs a heart, blinks the plane, and lifts it clear.
  const crash = () => {
    if (safe > 0 || mode !== 'fly') return;
    lives -= 1;
    safe = SAFE_TIME;
    bump = 1;
    if (lives <= 0) { end('crash'); return; }
    aim.y = Math.max(aim.y, 120);
  };

  const end = reason => {
    if (mode !== 'fly') return;
    mode = 'over';
    tell();
    if (closed || learningDone) return;
    closed = true;
    call(onOver, reason);
  };

  const layout = () => {
    const rect = stage.getBoundingClientRect();
    width = Math.max(320, rect.width);
    height = Math.max(220, rect.height);
    renderer.setSize(width, height, false);
    const aspect = width / height;
    camera.aspect = aspect;
    // On a tall screen, widen the view so the gems still show up in time.
    camera.fov = aspect >= 1 ? 60 : (2 * Math.atan(Math.tan(Math.PI / 6) * Math.min(1.8, 1 / aspect)) * 180) / Math.PI;
    camera.updateProjectionMatrix();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    hud.width = Math.round(width * dpr);
    hud.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // ---- 2D layer: score, fuel, answer labels, and the title card. ----
  const rounded = (x, y, w, h, r) => {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  };

  const drawShape = (kind, x, y, k) => {
    ctx.beginPath();
    if (kind === 'circle' || kind === 'oval') ctx.ellipse(x, y, k, kind === 'oval' ? k * 0.68 : k, 0, 0, TAU);
    else if (kind === 'triangle') {
      ctx.moveTo(x, y - k);
      ctx.lineTo(x + k, y + k * 0.75);
      ctx.lineTo(x - k, y + k * 0.75);
      ctx.closePath();
    } else if (kind === 'diamond') {
      ctx.moveTo(x, y - k);
      ctx.lineTo(x + k, y);
      ctx.lineTo(x, y + k);
      ctx.lineTo(x - k, y);
      ctx.closePath();
    } else if (kind === 'star') {
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const r = i % 2 ? k * 0.45 : k;
        if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.closePath();
    } else if (kind === 'hexagon') {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 3;
        if (i) ctx.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
        else ctx.moveTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
      }
      ctx.closePath();
    } else ctx.rect(x - k, y - k * 0.7, k * 2, k * 1.4);
    ctx.fill();
  };

  const screen = new THREE.Vector3();
  const toScreen = (x, y, z) => {
    screen.set(x, y, z).project(camera);
    if (screen.z > 1) return null;
    return { x: (screen.x * 0.5 + 0.5) * width, y: (-screen.y * 0.5 + 0.5) * height };
  };

  const drawLabel = gem => {
    const w = gemWorld(gem);
    const p = toScreen(w.x, w.y - 20, LANE_Z);
    if (!p || p.x < -80 || p.x > width + 80) return;
    const text = gem.label;
    let size = 18;
    ctx.font = `700 ${size}px Outfit, sans-serif`;
    while (size > 11 && ctx.measureText(text).width > 132) {
      size -= 1;
      ctx.font = `700 ${size}px Outfit, sans-serif`;
    }
    const shapeW = gem.shape ? size + 6 : 0;
    const textW = text ? ctx.measureText(text).width : 0;
    const plateW = Math.max(gem.shape && !text ? 36 : 56, textW + shapeW + 16);
    const plateH = Math.max(size + 10, gem.shape ? 30 : 0);
    ctx.save();
    ctx.translate(p.x, p.y);
    rounded(-plateW / 2, 0, plateW, plateH, 8);
    ctx.fillStyle = 'rgba(250, 247, 240, 0.95)';
    ctx.fill();
    ctx.strokeStyle = '#59332e';
    ctx.lineWidth = 2;
    ctx.stroke();
    let x = -plateW / 2 + 8;
    if (gem.shape) {
      ctx.fillStyle = gem.fill || '#59332e';
      drawShape(gem.shape, x + shapeW / 2 - 3, plateH / 2, (size + 2) / 2);
      x += shapeW;
    }
    if (text) {
      ctx.fillStyle = '#23190f';
      ctx.textAlign = gem.shape ? 'left' : 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, gem.shape ? x : 0, plateH / 2 + 1);
    }
    ctx.restore();
  };

  const scoreTag = () => {
    ctx.save();
    ctx.translate(width / 2, 12);
    rounded(-62, 0, 124, 42, 21);
    ctx.fillStyle = 'rgba(250, 247, 240, 0.9)';
    ctx.fill();
    ctx.fillStyle = '#edeb27';
    ctx.strokeStyle = '#59332e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-34, 21);
    ctx.lineTo(-24, 9);
    ctx.lineTo(-14, 21);
    ctx.lineTo(-24, 33);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#59332e';
    ctx.font = '800 24px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(score), 14, 22);
    ctx.restore();
  };

  const fuelBar = () => {
    const w = Math.min(220, width * 0.34);
    const x = width / 2 - w / 2;
    const y = height - 28;
    rounded(x - 28, y - 10, w + 56, 26, 13);
    ctx.fillStyle = 'rgba(250, 247, 240, 0.9)';
    ctx.fill();
    ctx.fillStyle = '#59332e';
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Fuel', x - 18, y + 3);
    rounded(x + 16, y - 2, w - 8, 10, 5);
    ctx.fillStyle = '#e4e0ba';
    ctx.fill();
    const fill = Math.max(0, (w - 8) * fuel);
    if (fill > 1) {
      rounded(x + 16, y - 2, fill, 10, 5);
      ctx.fillStyle = fuel > 0.28 ? '#68c3c0' : '#f25346';
      ctx.fill();
    }
  };

  const card = () => {
    const cardW = Math.min(336, width - 24);
    const cardH = Math.min(176, height - 24);
    const cardY = Math.max(12, height * 0.56 - cardH / 2);
    rounded(width / 2 - cardW / 2, cardY, cardW, cardH, 22);
    ctx.fillStyle = 'rgba(250, 247, 240, 0.94)';
    ctx.fill();
    ctx.fillStyle = '#f25346';
    ctx.font = '800 34px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mode === 'title' ? 'Island glide' : 'Flight over', width / 2, cardY + 34);
    ctx.font = '700 15px Outfit, sans-serif';
    ctx.fillStyle = '#59332e';
    const gemCount = `${score} ${score === 1 ? 'gem' : 'gems'}`;
    const line = mode === 'title'
      ? 'Move and the plane follows. Miss the hills and storms.'
      : lives <= 0 ? `Out of hearts. ${gemCount}.` : `The fuel ran out. ${gemCount}.`;
    ctx.fillText(line, width / 2, cardY + 66);
    const by = cardY + cardH - 46;
    ctx.beginPath();
    ctx.arc(width / 2, by, 26, 0, TAU);
    ctx.fillStyle = '#f25346';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(width / 2 - 7, by - 12);
    ctx.lineTo(width / 2 + 12, by);
    ctx.lineTo(width / 2 - 7, by + 12);
    ctx.closePath();
    ctx.fill();
  };

  const heart = (x, y, s, full) => {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.2, y + s * 0.1, x - s * 0.9, y - s * 0.9, x, y - s * 0.3);
    ctx.bezierCurveTo(x + s * 0.9, y - s * 0.9, x + s * 1.2, y + s * 0.1, x, y + s * 0.9);
    ctx.closePath();
    ctx.fillStyle = full ? '#f25346' : 'rgba(89, 51, 46, 0.18)';
    ctx.fill();
  };

  const hearts = () => {
    rounded(12, 12, 24 + LIVES * 26, 42, 21);
    ctx.fillStyle = 'rgba(250, 247, 240, 0.9)';
    ctx.fill();
    for (let i = 0; i < LIVES; i++) {
      // The heart just lost shakes for a moment.
      const lost = i === lives && bump > 0;
      const shake = lost ? Math.sin(clock * 60) * 3 * bump : 0;
      heart(37 + i * 26 + shake, 33, 10, i < lives);
    }
  };

  const paintHud = () => {
    ctx.clearRect(0, 0, width, height);
    if (mode === 'fly') {
      gems.forEach(gem => { if (gem.ask && !gem.gone) drawLabel(gem); });
      scoreTag();
      hearts();
      fuelBar();
      if (bump > 0) {
        ctx.globalAlpha = Math.min(1, bump * 1.5);
        ctx.fillStyle = '#f25346';
        ctx.font = '800 30px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Bump!', width / 2, height * 0.3);
        ctx.globalAlpha = 1;
      } else if (bonus > 0) {
        ctx.fillStyle = '#f25346';
        ctx.font = '800 22px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Bonus!', width / 2, 76);
      }
      // Fly too low and the ground warns first.
      const { alt } = onLand(pos.x, pos.y);
      if (alt < GROUND_CLEAR + 22 && safe <= 0) {
        ctx.fillStyle = 'rgba(242, 83, 70, 0.9)';
        ctx.font = '800 18px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Too low! Pull up!', width / 2, height - 56);
      }
    } else card();
  };

  // ---- Play ----
  const step = dt => {
    const paused = gamePaused();
    if (paused) return;
    const speed = TURN * calm * (mode === 'fly' ? 1 : 0.6);
    turn += speed * dt;
    world.rotation.z = turn;
    sky.rotation.z = turn * 0.6;

    // Arrow keys (and the controller's d-pad and left stick, which lib/pad.js sends as
    // arrow keys) nudge the aim; the pointer and the controller's cursor set it outright.
    const dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const dy = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
    if (dx || dy) {
      aim.x = Math.max(BOX.x0, Math.min(BOX.x1, aim.x + dx * 90 * dt));
      aim.y = Math.max(BOX.y0, Math.min(BOX.y1, aim.y + dy * 150 * dt));
    }
    const want = mode === 'fly' ? aim : { x: -50, y: 115 + Math.sin(clock * 1.3) * 18 };
    const next = chase(pos, want, dt);
    pos.x = next.x;
    pos.y = next.y;
    plane.position.set(pos.x, pos.y, LANE_Z);
    plane.rotation.set(next.rx, next.ry, next.rz);
    if (bump > 0) plane.rotation.x += Math.sin(clock * 40) * 0.25 * bump;
    plane.visible = safe <= 0 || Math.floor(safe * 10) % 2 === 0;
    propeller.rotation.x += dt * 18 * calm;
    pilot?.animate?.(dt, 0, clock);
    gems.forEach(gem => {
      gem.mesh.rotation.y += dt * 1.6;
      gem.mesh.rotation.x += dt * 0.9;
    });
    obstacles.forEach(ob => {
      if (ob.kind === 'storm') ob.mesh.children.forEach((m, i) => { if (i < 4) m.rotation.y += dt * 0.4; });
    });

    // The bump shake and blink wear off even after the flight ends.
    safe = Math.max(0, safe - dt);
    bump = Math.max(0, bump - dt * 1.4);
    if (mode !== 'fly') return;
    bonus = Math.max(0, bonus - dt);
    fuel = Math.max(0, fuel - 0.03 * dt);
    if (fuel <= 0) { end('fuel'); return; }

    // Obstacles: one every so often, closer together as the score grows, never on an answer.
    if (turn >= nextObstacle) {
      const ahead = 0.85;
      const near = askHeightsAt(ahead);
      // Next to an answer only a storm fits, well above or below every labeled gem there.
      const room = [55, 80, 105, 130, 155, 180].filter(h => near.every(g => Math.abs(g - h) >= 80));
      if (near.length && !room.length) nextObstacle = turn + 0.12;
      else {
        if (near.length) addObstacle('storm', ahead, room[Math.floor(rand() * room.length)]);
        else addObstacle(rand() < 0.45 ? 'hill' : 'storm', ahead);
        const gap = Math.max(0.36, 0.7 - score * 0.02) * (reduced ? 1.25 : 1);
        nextObstacle = turn + gap * (0.8 + rand() * 0.4);
      }
    }
    const here = onLand(pos.x, pos.y);
    if (here.alt < GROUND_CLEAR) crash();
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      const d = wrap(here.angle - (ob.a + turn)) * LAND_R;
      if (ob.kind === 'hill') {
        if (Math.abs(d) < ob.base + 12 && hitsHill(d, here.alt, ob)) crash();
      } else {
        const dy = here.alt - ob.height;
        if (d * d + dy * dy < (ob.radius + 12) ** 2) {
          // A storm cloud you bump puffs away, so it can't catch you twice.
          crash();
          ob.hit = true;
        }
      }
      if (mode !== 'fly') return;
      // d is positive ahead of the plane; gone once well behind it, or puffed away.
      if (ob.hit || d < -220) { dropObstacle(ob); obstacles.splice(i, 1); }
    }
    askWait = Math.max(0, askWait - dt);
    if (!asking && askWait <= 0) placeAsk();
    const nextLap = Math.floor(turn / TAU);
    if (nextLap > lap) {
      lap = nextLap;
      bonus = 4;
      for (let i = 0; i < 5; i++) addGem(0.5 + i * 0.12, 80 + i * 18, { hot: true });
    }

    let tookAsk = false;
    const hits = gem => {
      const w = gemWorld(gem);
      const reach = gem.ask ? 34 : 26;
      return (w.x - pos.x) ** 2 + (w.y - pos.y) ** 2 < reach * reach;
    };
    gems.forEach(gem => {
      if (!gem.ask || gem.gone || !hits(gem)) return;
      tookAsk = true;
      if (gem.ok) {
        score += 1;
        fuel = Math.min(1, fuel + 0.18);
        gems.forEach(other => { if (other.ask) other.gone = true; });
        asking = false;
        askWait = 0.75;
        tell();
        call(onClear, !slipped);
      } else {
        gem.gone = true;
        slipped = true;
        call(onMiss);
      }
    });
    // An answer that slipped past comes around again.
    gems.filter(gem => gem.ask && !gem.gone && gemWorld(gem).x < pos.x - 90)
      .forEach((gem, i) => { placeGem(gem, 0.75 + i * 0.42); makeRoom(gem); });
    gems.forEach(gem => {
      if (gem.ask || gem.gone) return;
      if (!tookAsk && hits(gem)) {
        score += gem.hot || bonus > 0 ? 2 : 1;
        fuel = Math.min(1, fuel + 0.14);
        tell();
        if (gem.hot) { gem.gone = true; return; }
        gem.height = fuelHeight();
        placeGem(gem, 0.7 + rand() * 0.9);
        return;
      }
      if (gemWorld(gem).x < pos.x - 120) {
        if (gem.hot) { gem.gone = true; return; }
        gem.height = fuelHeight();
        placeGem(gem, 0.7 + rand() * 0.9);
      }
    });
    for (let i = gems.length - 1; i >= 0; i--) {
      if (gems[i].gone) { dropGem(gems[i]); gems.splice(i, 1); }
    }
  };

  const tick = now => {
    if (session.dead) return;
    const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016);
    last = now;
    clock += dt;
    step(dt);
    renderer.render(scene, camera);
    paintHud();
    session.raf = requestAnimationFrame(tick);
  };

  // ---- Input ----
  const pointerAim = event => {
    const rect = stage.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const py = 1 - ((event.clientY - rect.top) / rect.height) * 2;
    Object.assign(aim, aimFor(px, py));
  };
  const down = event => {
    if (session.dead) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    if (mode !== 'fly') { start(); return; }
    pointerAim(event);
  };
  const move = event => {
    if (mode !== 'fly') return;
    if (event.pointerType !== 'mouse' && !event.buttons) return;
    pointerAim(event);
  };
  const typing = event => event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
  const KEYMAP = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
  const onKey = event => {
    if (document.querySelector('dialog[open]') || typing(event)) return;
    const dir = KEYMAP[event.key];
    if (dir) {
      event.preventDefault();
      keys[dir] = event.type === 'keydown';
      if (event.type === 'keydown' && mode !== 'fly' && !event.repeat) start();
      return;
    }
    if ((event.key === ' ' || event.key === 'Enter') && event.type === 'keydown' && !event.repeat && mode !== 'fly') {
      event.preventDefault();
      start();
    }
  };
  const blur = () => { keys.up = keys.down = keys.left = keys.right = false; };

  // For tests: where the plane and the gems are.
  session.peek = () => ({
    mode, score, fuel, lives, safe, plane: { ...pos }, alt: onLand(pos.x, pos.y).alt,
    gems: gems.map(g => ({ ask: g.ask, ok: !!g.ok, ...gemWorld(g) })),
    obstacles: obstacles.map(o => ({ kind: o.kind, d: wrap(onLand(pos.x, pos.y).angle - (o.a + turn)) * LAND_R, h: o.h, base: o.base, height: o.height }))
  });

  seedGems();
  layout();
  const resize = new ResizeObserver(layout);
  resize.observe(stage);
  view.addEventListener('pointerdown', down);
  view.addEventListener('pointermove', move);
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);
  window.addEventListener('blur', blur);
  session.cleanups.push(() => {
    resize.disconnect();
    view.removeEventListener('pointerdown', down);
    view.removeEventListener('pointermove', move);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup', onKey);
    window.removeEventListener('blur', blur);
    scene.traverse(o => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach(m => m.dispose?.());
    });
    renderer.dispose();
  });
  session.raf = requestAnimationFrame(tick);
}
