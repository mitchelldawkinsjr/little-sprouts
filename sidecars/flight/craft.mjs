/**
 * High-wing bush plane for Sky flight (Three.js primitives).
 * Look inspired by the blue/white utility plane in Jens Broecher’s CodePen
 * “Airplane pulling a banner” — rebuilt here, no CodePen bitmap shipped.
 *
 * Commercial note: this craft is ours. We do not ship Web Flight Simulator
 * or third-party jet models. Free flight uses the local hill terrain.
 */
import * as THREE from 'three';

const CRAFT_LENGTH = 18;
const VISUAL_ROLL_FACTOR = 90;
const VISUAL_ROLL_MAX = 1.1;
const VISUAL_SMOOTH = 4.5;

const WHITE = 0xf4f7fb;
const WHITE_SOFT = 0xdde6f0;
const BLUE = 0x2457b8;
const BLUE_DEEP = 0x163a7a;
const BLUE_LIGHT = 0x3a6fd4;
const METAL = 0xc8d0da;
const TIRE = 0x1a1a1a;
const GLASS = 0x7eb8e8;

function solid(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.rough ?? 0.42,
    metalness: opts.metal ?? 0.12,
    side: opts.side ?? THREE.FrontSide,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
    flatShading: !!opts.flat
  });
}

function propTex() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);
  ctx.translate(128, 128);
  for (let i = 0; i < 3; i++) {
    ctx.rotate((Math.PI * 2) / 3);
    const g = ctx.createLinearGradient(0, -120, 0, 120);
    g.addColorStop(0, '#222');
    g.addColorStop(0.5, '#9aa0a8');
    g.addColorStop(1, '#222');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-14, -55, 0, -118);
    ctx.quadraticCurveTo(14, -55, 8, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#c8ced6';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

function add(parent, geo, material, pos, rot, scale) {
  const mesh = new THREE.Mesh(geo, material);
  if (pos) mesh.position.set(...pos);
  if (rot) mesh.rotation.set(...rot);
  if (scale) mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}

function buildPlane() {
  const group = new THREE.Group();
  const white = solid(WHITE, { rough: 0.4, metal: 0.08 });
  const whiteSoft = solid(WHITE_SOFT, { rough: 0.45, metal: 0.08 });
  const blue = solid(BLUE, { rough: 0.4, metal: 0.14 });
  const blueDeep = solid(BLUE_DEEP, { rough: 0.4, metal: 0.16 });
  const blueLight = solid(BLUE_LIGHT, { rough: 0.4, metal: 0.14 });
  const strut = solid(METAL, { rough: 0.35, metal: 0.45 });
  const tire = solid(TIRE, { rough: 0.9, metal: 0.05 });
  const glass = solid(GLASS, { rough: 0.12, metal: 0.25, transparent: true, opacity: 0.82 });
  const spinner = solid(0xe8ecf0, { rough: 0.22, metal: 0.5 });
  const propMat = new THREE.MeshStandardMaterial({
    map: propTex(),
    transparent: true,
    roughness: 0.55,
    metalness: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  // —— fuselage: white cabin + blue belly (aft-heavy so chase cam sees paint) ——
  add(group, new THREE.CylinderGeometry(0.9, 1.05, 5.6, 18), white, [0, 0.5, 0.7], [Math.PI / 2, 0, 0]);
  add(group, new THREE.BoxGeometry(1.9, 0.9, 5.0), blue, [0, -0.1, 0.8]);
  add(group, new THREE.BoxGeometry(1.75, 0.4, 4.4), white, [0, 1.1, 0.65]);
  add(group, new THREE.BoxGeometry(2.0, 1.05, 3.8), whiteSoft, [0, 0.5, 0.85]);
  // tapered white tail cone (reads from behind)
  add(group, new THREE.CylinderGeometry(0.35, 0.95, 2.2, 14), white, [0, 0.55, 3.55], [Math.PI / 2, 0, 0]);
  add(group, new THREE.BoxGeometry(1.1, 0.55, 2.0), blue, [0, 0.05, 3.4]);

  // windows
  for (const x of [-1.02, 1.02]) {
    for (const z of [-0.15, 0.75, 1.65]) {
      add(group, new THREE.BoxGeometry(0.08, 0.4, 0.52), glass, [x, 0.68, z]);
    }
  }

  // nose / cowling
  add(group, new THREE.CylinderGeometry(0.82, 1.0, 1.55, 16), blueLight, [0, 0.45, -2.7], [Math.PI / 2, 0, 0]);
  add(group, new THREE.SphereGeometry(0.82, 14, 12), blue, [0, 0.45, -3.4], null, [1, 1, 0.75]);
  add(group, new THREE.BoxGeometry(0.5, 0.26, 0.18), solid(0x111111, { rough: 0.8 }), [0, 0.15, -3.85]);

  const wind = add(group, new THREE.SphereGeometry(0.88, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.48), glass, [0, 1.0, -1.35]);
  wind.scale.set(1.05, 0.72, 1.05);
  wind.rotation.x = Math.PI * 0.9;

  // —— high wing forward of mid-body so aft fuselage + tail stay in frame ——
  add(group, new THREE.BoxGeometry(13.2, 0.15, 3.0), white, [0, 1.85, -0.55], [-0.02, 0, 0]);
  add(group, new THREE.BoxGeometry(1.7, 0.17, 2.95), blue, [-7.4, 1.85, -0.55]);
  add(group, new THREE.BoxGeometry(1.7, 0.17, 2.95), blue, [7.4, 1.85, -0.55]);
  add(group, new THREE.BoxGeometry(13.2, 0.08, 0.2), blueLight, [0, 1.85, -1.95]);

  add(group, new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6), strut, [-3.6, 1.05, -0.2], [0, 0, 0.55]);
  add(group, new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6), strut, [3.6, 1.05, -0.2], [0, 0, -0.55]);

  // —— empennage (big so chase cam catches the swoosh) ——
  add(group, new THREE.BoxGeometry(4.8, 0.12, 1.65), white, [0, 0.85, 4.15]);
  add(group, new THREE.BoxGeometry(0.7, 0.12, 1.55), blue, [-2.5, 0.85, 4.15]);
  add(group, new THREE.BoxGeometry(0.7, 0.12, 1.55), blue, [2.5, 0.85, 4.15]);
  add(group, new THREE.BoxGeometry(0.16, 3.4, 2.4), white, [0, 2.15, 4.0]);
  add(group, new THREE.BoxGeometry(0.18, 1.8, 1.35), blue, [0, 1.55, 4.25]);
  add(group, new THREE.BoxGeometry(0.18, 0.9, 1.9), blueLight, [0, 2.95, 4.05]);
  // white belt stripe around mid-fuselage (CodePen-style)
  add(group, new THREE.BoxGeometry(2.05, 0.18, 4.6), white, [0, 0.22, 0.7]);

  // —— landing gear + wheel pants ——
  for (const x of [-1.25, 1.25]) {
    add(group, new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6), strut, [x, -0.2, 0.35]);
    add(group, new THREE.SphereGeometry(0.42, 12, 10), blue, [x, -0.75, 0.35], null, [0.65, 1, 1.35]);
    add(group, new THREE.CylinderGeometry(0.28, 0.28, 0.16, 12), tire, [x, -0.84, 0.35], [0, 0, Math.PI / 2]);
  }
  add(group, new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), strut, [0, -0.05, -2.15]);
  add(group, new THREE.SphereGeometry(0.26, 10, 8), blueDeep, [0, -0.48, -2.2], null, [0.65, 1, 1.3]);
  add(group, new THREE.CylinderGeometry(0.18, 0.18, 0.12, 10), tire, [0, -0.52, -2.2], [0, 0, Math.PI / 2]);

  add(group, new THREE.SphereGeometry(0.34, 14, 12), spinner, [0, 0.45, -4.05]);
  const prop = add(group, new THREE.PlaneGeometry(5.2, 5.2), propMat, [0, 0.45, -4.15]);
  prop.name = 'prop';

  // Nose at −Z (Three forward). No Y flip — chase cam must see the tail.
  group.scale.setScalar(CRAFT_LENGTH / 14);
  group.traverse(child => {
    child.frustumCulled = false;
  });
  return group;
}

export function createCraft(scene) {
  const root = new THREE.Group();
  const mesh = buildPlane();
  root.add(mesh);
  scene.add(root);

  const prop = mesh.getObjectByName('prop');
  let visualRoll = 0;
  const qRoll = new THREE.Quaternion();
  const axisZ = new THREE.Vector3(0, 0, 1);

  return {
    ready: true,
    update(state, dt) {
      const targetRoll = Math.max(
        -VISUAL_ROLL_MAX,
        Math.min(VISUAL_ROLL_MAX, (state.yawRate || 0) * VISUAL_ROLL_FACTOR)
      );
      const t = Math.min(1, VISUAL_SMOOTH * dt);
      visualRoll += (targetRoll - visualRoll) * t;
      root.position.copy(state.position);
      root.quaternion.copy(state.quaternion);
      qRoll.setFromAxisAngle(axisZ, (state.roll || 0) + visualRoll);
      root.quaternion.multiply(qRoll);
      if (prop) prop.rotation.z += dt * (12 + Math.abs(state.speed || 0) * 0.1);
    },
    setVisible(visible) {
      root.visible = visible;
    }
  };
}
