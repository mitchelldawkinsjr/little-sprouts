/**
 * Garden biplane for Sky flight. Three.js primitives + canvas paint maps.
 * Little Sprouts original — no outside model files.
 *
 * Commercial note: this craft is ours. We do not ship Web Flight Simulator
 * (dimartarmizi/web-flight-simulator needs a separate commercial license),
 * OpenSkyFlight loaders, or third-party jet models.
 */
import * as THREE from 'three';

const CRAFT_LENGTH = 16;
const VISUAL_ROLL_FACTOR = 90;
const VISUAL_ROLL_MAX = 1.1;
const VISUAL_SMOOTH = 4.5;

function canvasTex(draw, w = 256, h = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  return map;
}

/** Cream fuselage with soft wood undertone, panel lines, and a gold stripe. */
function bodyMap() {
  return canvasTex((ctx, w, h) => {
    const base = ctx.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, '#fff6e0');
    base.addColorStop(0.35, '#f0d9a8');
    base.addColorStop(0.7, '#d9b078');
    base.addColorStop(1, '#b8894c');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 40; i++) {
      const y = (i / 40) * h;
      ctx.strokeStyle = `rgba(120, 70, 30, ${0.05 + (i % 4) * 0.02})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 10) ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 1.8);
      ctx.stroke();
    }

    // panel seams
    ctx.strokeStyle = 'rgba(80, 45, 20, 0.28)';
    ctx.lineWidth = 2;
    for (const x of [w * 0.22, w * 0.45, w * 0.68, w * 0.88]) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // gold racing stripe
    const stripe = ctx.createLinearGradient(0, h * 0.38, 0, h * 0.62);
    stripe.addColorStop(0, '#ffe08a');
    stripe.addColorStop(0.5, '#f0b429');
    stripe.addColorStop(1, '#c48418');
    ctx.fillStyle = stripe;
    ctx.fillRect(0, h * 0.4, w, h * 0.18);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, h * 0.42, w, h * 0.04);

    // rivets
    ctx.fillStyle = 'rgba(90, 55, 25, 0.35)';
    for (let x = 10; x < w; x += 18) {
      for (const y of [h * 0.18, h * 0.78]) {
        ctx.beginPath();
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, 512, 256);
}

/** Leaf-green wing fabric with veins and sun fade. */
function wingMap() {
  return canvasTex((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#c5e68a');
    g.addColorStop(0.4, '#7eb84f');
    g.addColorStop(0.75, '#4f8a38');
    g.addColorStop(1, '#2f5e28');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 220, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 2);
    ctx.lineTo(w * 0.5, h - 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(35, 70, 25, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 8; i++) {
      const y = (i / 8) * h;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, y);
      ctx.quadraticCurveTo(w * 0.78, y + 4, w - 4, y + 22);
      ctx.moveTo(w * 0.5, y);
      ctx.quadraticCurveTo(w * 0.22, y + 4, 4, y + 22);
      ctx.stroke();
    }

    // fabric ribs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 3;
    for (let x = w * 0.12; x < w; x += w * 0.12) {
      ctx.beginPath();
      ctx.moveTo(x, 4);
      ctx.lineTo(x, h - 4);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 250, 200, 0.28)';
    ctx.fillRect(0, 0, w, h * 0.16);
    ctx.strokeStyle = 'rgba(40, 70, 20, 0.45)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
  }, 512, 256);
}

function noseMap() {
  return canvasTex((ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.45, h * 0.4, 2, w * 0.5, h * 0.5, w * 0.6);
    g.addColorStop(0, '#fff8d4');
    g.addColorStop(0.35, '#f2c65a');
    g.addColorStop(0.75, '#d08928');
    g.addColorStop(1, '#8a5018');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(w * 0.32, h * 0.3, w * 0.2, h * 0.12, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }, 256, 256);
}

function glassMap() {
  return canvasTex((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#eaf7ff');
    g.addColorStop(0.35, '#8ec8f0');
    g.addColorStop(0.7, '#3f7eb8');
    g.addColorStop(1, '#1e4a78');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(w * 0.3, h * 0.28, w * 0.22, h * 0.14, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 40, 60, 0.45)';
    ctx.lineWidth = 5;
    ctx.strokeRect(4, 4, w - 8, h - 8);
  }, 256, 128);
}

function propMap() {
  return canvasTex((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2);
    for (let i = 0; i < 2; i++) {
      ctx.rotate(i * Math.PI / 2);
      const g = ctx.createLinearGradient(0, -h * 0.45, 0, h * 0.45);
      g.addColorStop(0, '#5a3a1c');
      g.addColorStop(0.5, '#c49a5a');
      g.addColorStop(1, '#5a3a1c');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.08, h * 0.46, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 256, 256);
}

function std(map, opts = {}) {
  return new THREE.MeshStandardMaterial({
    map,
    roughness: opts.rough ?? 0.62,
    metalness: opts.metal ?? 0.08,
    side: opts.side ?? THREE.FrontSide,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
    flatShading: false
  });
}

function addMesh(parent, geo, material, pos, rot) {
  const mesh = new THREE.Mesh(geo, material);
  if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  parent.add(mesh);
  return mesh;
}

function buildPlane() {
  const group = new THREE.Group();
  const body = std(bodyMap(), { rough: 0.7 });
  const wing = std(wingMap(), { rough: 0.55, side: THREE.DoubleSide });
  const nose = std(noseMap(), { rough: 0.45, metal: 0.12 });
  const glass = std(glassMap(), { rough: 0.2, metal: 0.2 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3d2918, roughness: 0.65, metalness: 0.1 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xf0c45a, roughness: 0.4, metalness: 0.25 });

  // fuselage
  addMesh(group, new THREE.CapsuleGeometry(0.95, 5.2, 10, 20), body, [0, 0.2, 0.2], [0, 0, Math.PI / 2]);
  addMesh(group, new THREE.ConeGeometry(0.95, 2.8, 16), nose, [0, 0.2, -3.7], [-Math.PI / 2, 0, 0]);
  addMesh(group, new THREE.CylinderGeometry(0.55, 0.95, 1.1, 14), body, [0, 0.2, 3.55], [Math.PI / 2, 0, 0]);

  // cockpit bubble
  const canopy = addMesh(group, new THREE.SphereGeometry(0.85, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), glass, [0, 1.05, -0.35]);
  canopy.scale.set(1.05, 0.78, 1.55);
  canopy.rotation.x = Math.PI;

  // lower + upper wings (biplane read)
  addMesh(group, new THREE.BoxGeometry(12.5, 0.12, 3.1), wing, [0, 0.15, 0.15], [-0.05, 0, 0]);
  addMesh(group, new THREE.BoxGeometry(11.2, 0.1, 2.6), wing, [0, 1.55, 0.35], [0.02, 0, 0]);

  // wing tips
  addMesh(group, new THREE.BoxGeometry(0.2, 0.7, 1.2), wing, [-6.05, 0.45, 0]);
  addMesh(group, new THREE.BoxGeometry(0.2, 0.7, 1.2), wing, [6.05, 0.45, 0]);

  // struts
  for (const x of [-3.2, 3.2]) {
    addMesh(group, new THREE.CylinderGeometry(0.06, 0.06, 1.45, 6), dark, [x, 0.85, 0.2]);
    addMesh(group, new THREE.CylinderGeometry(0.05, 0.05, 1.55, 6), dark, [x * 0.55, 0.85, 0.9], [0, 0, x > 0 ? 0.25 : -0.25]);
  }

  // tail
  addMesh(group, new THREE.BoxGeometry(4.2, 0.1, 1.5), wing, [0, 0.55, 3.6]);
  addMesh(group, new THREE.BoxGeometry(0.14, 2.4, 1.9), wing, [0, 1.55, 3.35]);
  addMesh(group, new THREE.BoxGeometry(0.12, 1.1, 1.1), wing, [-1.1, 1.0, 3.5], [0, 0, 0.35]);
  addMesh(group, new THREE.BoxGeometry(0.12, 1.1, 1.1), wing, [1.1, 1.0, 3.5], [0, 0, -0.35]);

  // spinner + propeller
  addMesh(group, new THREE.SphereGeometry(0.38, 14, 14), gold, [0, 0.2, -5.05]);
  const prop = addMesh(group, new THREE.PlaneGeometry(5.2, 0.55), std(propMap(), { rough: 0.55, side: THREE.DoubleSide, transparent: true }), [0, 0.2, -5.15]);
  prop.name = 'prop';

  // wheels (tucked-ish but readable)
  for (const x of [-1.1, 1.1]) {
    addMesh(group, new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6), dark, [x, -0.35, 0.4], [0, 0, Math.PI / 2]);
    const wheel = addMesh(group, new THREE.CylinderGeometry(0.38, 0.38, 0.22, 12), dark, [x, -0.75, 0.4], [0, 0, Math.PI / 2]);
    wheel.material = new THREE.MeshStandardMaterial({ color: 0x222018, roughness: 0.9 });
  }

  // underside seed accent
  addMesh(group, new THREE.SphereGeometry(0.5, 12, 12), new THREE.MeshStandardMaterial({ color: 0x7a4a24, roughness: 0.7 }), [0, -0.15, 1.5]);

  group.rotation.y = Math.PI;
  group.scale.setScalar(CRAFT_LENGTH / 12);
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
      if (prop) prop.rotation.z += dt * (10 + Math.abs(state.speed || 0) * 0.08);
    },
    setVisible(visible) {
      root.visible = visible;
    }
  };
}
