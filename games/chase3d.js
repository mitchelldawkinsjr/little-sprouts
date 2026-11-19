/**
 * Garden chase in 3D. The game itself (games/chase.js) keeps its maze, rules, questions, and controls;
 * this only draws them: hedges of tall grass (Grass maze's instanced grass, lib-free shader), the learner's
 * 3D garden buddy, snails, berries with their answer cards, and the child's built boss.
 *
 * Loaded on demand when a Garden chase round starts, so three.js never slows the rest of the app.
 * Light enough for tablets: one draw for the floor, grass in patches (simple blades away from the buddy),
 * no shadows, and a capped pixel ratio. On a very weak device the hedges are plain merged boxes instead of
 * grass, and games/chase.js falls back to its flat drawing if this still can't keep up.
 */
import * as THREE from 'three';
import { makeGrass } from '../sidecars/grass/grass.mjs?v=grass1';
import { makeBuddy } from '../lib/buddy3d.mjs?v=gear2';
import { makeBoss } from '../lib/boss-model.mjs';

/** One maze cell, in metres. */
export const CELL = 1.6;
const BUDDY_SCALE = 1.15;
const BOSS_SCALE = 0.62;
const SNAIL_SCALE = 1.5;
/** How much of the maze the camera shows around the buddy, top to bottom (in cells). */
const VIEW_CELLS = 12;
/** Camera tilt: how far above the ground it looks down from (radians up from flat). */
const TILT = 0.95;

/** Which look a device gets: full grass, thinner grass, or box hedges for the weakest devices. */
export function chaseLook(env = globalThis) {
  const nav = env.navigator || {};
  const mem = nav.deviceMemory;
  const cores = nav.hardwareConcurrency;
  if ((mem > 0 && mem <= 2) || (cores > 0 && cores <= 2) || /\bSilk\b|\bKF[A-Z]{2,6}\b/.test(nav.userAgent || '')) return 'boxes';
  let coarse = false;
  try { coarse = !!env.matchMedia?.('(pointer: coarse)').matches; } catch { coarse = false; }
  if ((mem > 0 && mem <= 4) || (cores > 0 && cores <= 4) || coarse) return 'grass-low';
  return 'grass';
}

/** World position of a point in the game's grid units (`unit` per cell), with the maze centred on the origin. */
export function toWorld(x, y, unit, cols, rows, out = { x: 0, z: 0 }) {
  out.x = (x / unit - (cols - 1) / 2) * CELL;
  out.z = (y / unit - (rows - 1) / 2) * CELL;
  return out;
}

/** Which way a thing faces in the world for a move direction (models face +x; the buddy faces +z). */
const YAW = { right: 0, left: Math.PI, up: Math.PI / 2, down: -Math.PI / 2 };

export function makeChase3d(host, { map, rows, cols, unit, wall, kind, boss, paintLabel, look = chaseLook() }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'chase-3d';
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);
  const low = look !== 'grass';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !low, alpha: false, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, look === 'boxes' ? 0.75 : low ? 1 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const disposables = [];
  const keep = (thing) => { disposables.push(thing); return thing; };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#bfe3c2');
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  const sunDir = new THREE.Vector3(-0.4, 0.85, 0.3).normalize();
  scene.add(new THREE.HemisphereLight('#f2fbff', '#55703a', 1.6));
  const sun = new THREE.DirectionalLight('#fff1d6', 1.8);
  sun.position.copy(sunDir).multiplyScalar(20);
  scene.add(sun);

  const W = cols * CELL;
  const D = rows * CELL;

  // The floor: dirt paths and dark hedge beds, one pixel per cell, drawn crisp.
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = cols;
  floorCanvas.height = rows;
  const fctx = floorCanvas.getContext('2d');
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      fctx.fillStyle = map[r][c] === wall ? '#3d6b45' : (c + r) % 2 ? '#e4d4a8' : '#ddcca0';
      fctx.fillRect(c, r, 1, 1);
    }
  }
  const floorTex = keep(new THREE.CanvasTexture(floorCanvas));
  floorTex.magFilter = THREE.NearestFilter;
  floorTex.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(keep(new THREE.PlaneGeometry(W, D)), keep(new THREE.MeshLambertMaterial({ map: floorTex })));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const meadow = new THREE.Mesh(keep(new THREE.PlaneGeometry(W * 4, D * 4)), keep(new THREE.MeshLambertMaterial({ color: '#4f7a37' })));
  meadow.rotation.x = -Math.PI / 2;
  meadow.position.y = -0.02;
  scene.add(meadow);

  // Hedges: Grass maze's tall grass over the walls, or plain boxes on the weakest devices.
  let grass = null;
  if (look === 'boxes') {
    const parts = [];
    const color = new THREE.Color();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (map[r][c] !== wall) continue;
        const box = new THREE.BoxGeometry(CELL, 1.1, CELL);
        const p = toWorld(c * unit, r * unit, unit, cols, rows);
        box.translate(p.x, 0.55, p.z);
        color.set((c + r) % 2 ? '#3f7a45' : '#386e3f');
        const n = box.getAttribute('position').count;
        box.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: n * 3 }, (_, i) => [color.r, color.g, color.b][i % 3]), 3));
        parts.push(box.toNonIndexed());
        box.dispose();
      }
    }
    const merged = keep(mergeBoxes(parts));
    parts.forEach(part => part.dispose());
    scene.add(new THREE.Mesh(merged, keep(new THREE.MeshLambertMaterial({ vertexColors: true }))));
  } else {
    const res = 8;
    const data = new Uint8Array(cols * res * rows * res);
    for (let y = 0; y < rows * res; y++) {
      for (let x = 0; x < cols * res; x++) data[y * cols * res + x] = map[Math.floor(y / res)][Math.floor(x / res)] === wall ? 255 : 0;
    }
    const mask = keep(new THREE.DataTexture(data, cols * res, rows * res, THREE.RedFormat, THREE.UnsignedByteType));
    mask.magFilter = mask.minFilter = THREE.LinearFilter;
    mask.needsUpdate = true;
    grass = makeGrass({
      rect: { x0: -W / 2 - 1, z0: -D / 2 - 1, x1: W / 2 + 1, z1: D / 2 + 1 },
      mask,
      maskRect: new THREE.Vector4(-W / 2, -D / 2, W, D),
      low,
      sunDir,
      sunColour: new THREE.Color('#fff1d6'),
      skyColour: new THREE.Color('#cfe8f5')
    });
    scene.add(grass.group);
  }

  // The learner's garden buddy.
  const buddy = makeBuddy(THREE, kind);
  buddy.group.scale.setScalar(BUDDY_SCALE);
  scene.add(buddy.group);

  // Snails: a colored shell on a soft body, with two eye stalks.
  const snailBody = keep(new THREE.CapsuleGeometry(0.16, 0.5, 4, 8));
  const snailShell = keep(new THREE.SphereGeometry(0.3, 14, 10));
  const stalk = keep(new THREE.CylinderGeometry(0.025, 0.025, 0.26, 5));
  const bodyMat = keep(new THREE.MeshLambertMaterial({ color: '#c4a882' }));
  const inkMat = keep(new THREE.MeshLambertMaterial({ color: '#24332c' }));
  const snails = [];
  const snailFor = (color) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(snailBody, bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.16;
    const shell = new THREE.Mesh(snailShell, keep(new THREE.MeshLambertMaterial({ color })));
    shell.position.set(-0.08, 0.4, 0);
    g.add(body, shell);
    for (const z of [-0.07, 0.07]) {
      const s = new THREE.Mesh(stalk, inkMat);
      s.position.set(0.3, 0.38, z);
      s.rotation.z = -0.4;
      g.add(s);
    }
    g.scale.setScalar(SNAIL_SCALE);
    scene.add(g);
    return g;
  };

  // The child's built boss, standing on the paths, its body following the head like a chain.
  let bossRig = null;
  /** Build (or swap, or remove with null) the boss; the start screen's builder calls this on every change. */
  function setBoss(design) {
    bossRig?.dispose();
    bossRig = null;
    if (!design) return;
    bossRig = makeBoss(design);
    const rigs = [bossRig.lead, ...bossRig.segs.map(seg => seg.group)];
    rigs.forEach(piece => piece.scale.multiplyScalar(BOSS_SCALE));
    bossRig.group.updateMatrixWorld(true);
    bossRig.lift = Math.max(0, -new THREE.Box3().setFromObject(bossRig.group).min.y);
    bossRig.pieces = rigs;
    scene.add(bossRig.group);
  }
  setBoss(boss);

  // Berries: a red berry with a leaf, and its answer on a card that always faces the camera.
  const berryGeo = keep(new THREE.SphereGeometry(0.36, 14, 10));
  const leafGeo = keep(new THREE.SphereGeometry(0.12, 8, 6));
  const leafMat = keep(new THREE.MeshLambertMaterial({ color: '#7f9f62' }));
  const berries = new Map();
  const berryFor = (berry) => {
    const g = new THREE.Group();
    const mat = keep(new THREE.MeshLambertMaterial({ color: '#c4534a' }));
    const fruit = new THREE.Mesh(berryGeo, mat);
    fruit.position.y = 0.35;
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.scale.set(1.4, 0.5, 0.8);
    leaf.position.set(0.12, 0.6, 0);
    g.add(fruit, leaf);
    const card = document.createElement('canvas');
    card.width = 320;
    card.height = 160;
    paintLabel(card.getContext('2d'), berry, card.width, card.height);
    const tex = keep(new THREE.CanvasTexture(card));
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: tex, depthTest: false })));
    sprite.renderOrder = 10;
    // A fixed size on screen, however far away, so every answer can be read.
    sprite.material.sizeAttenuation = false;
    sprite.scale.set(0.15, 0.075, 1);
    sprite.position.y = 1.7;
    g.add(sprite);
    scene.add(g);
    return { group: g, mat, sprite };
  };

  const at = { x: 0, z: 0 };
  let w = 0;
  let h = 0;

  /**
   * A camera that follows the buddy from above at a tilt, showing about VIEW_CELLS of the maze and keeping
   * inside it (centred when the maze is smaller than the view). `snap` jumps straight there.
   */
  const camDir = new THREE.Vector3(0, Math.sin(TILT), Math.cos(TILT));
  const target = new THREE.Vector3();
  let camDist = 20;
  function fitCamera() {
    const halfH = Math.min(D, VIEW_CELLS * CELL) / 2;
    camDist = halfH / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / Math.sin(TILT) * 1.05;
  }
  let zoom = 1;
  /** `close`: the builder is open, so come in near the boss and keep it clear of the card (right of it, or above on a phone). */
  function follow(x, z, snap, close = false, dt = 1 / 60) {
    // Eases in about half a second whatever the frame rate.
    const k = snap ? 1 : 1 - Math.exp(-dt * 5);
    zoom += ((close ? 0.45 : 1) - zoom) * k;
    const dist = camDist * zoom;
    const halfH = dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * 0.9;
    const halfW = halfH * camera.aspect;
    let tx;
    let tz;
    if (close) {
      const wide = camera.aspect >= 1.1;
      tx = x - (wide ? halfW * 0.4 : 0);
      tz = z + (wide ? 0 : halfH * 0.45);
    } else {
      const clampTo = (v, half, size) => (half * 2 >= size ? 0 : THREE.MathUtils.clamp(v, -size / 2 + half, size / 2 - half));
      tx = clampTo(x, halfW, W + CELL);
      tz = clampTo(z, halfH, D + CELL);
    }
    target.x += (tx - target.x) * k;
    target.z += (tz - target.z) * k;
    camera.position.copy(camDir).multiplyScalar(dist).add(target);
    camera.lookAt(target);
  }
  let snapped = false;

  return {
    look,
    resize(cssW, cssH) {
      if (cssW === w && cssH === h) return;
      w = cssW;
      h = cssH;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      fitCamera();
    },
    /** Draw one frame of the game. `snap` is the game's own state, read only. */
    setBoss,
    draw({ player, moving, dying, critters, hunter, list, tick, dt, focus = 'buddy' }) {
      const t = tick / 60;
      // Buddy: faces the way it goes, runs while moving, and spins down when caught.
      toWorld(player.x, player.y, unit, cols, rows, at);
      buddy.group.position.set(at.x, 0, at.z);
      if (player.dir !== 'none') buddy.group.rotation.y = YAW[player.dir] + Math.PI / 2;
      buddy.group.rotation.z = dying > 0 ? (1 - dying) * 1.2 : 0;
      buddy.group.scale.setScalar(BUDDY_SCALE * (dying > 0 ? Math.max(0.3, dying) : 1));
      buddy.animate(dt, moving && dying <= 0 ? 1 : 0, t);
      grass?.update(t, at);
      // The camera follows the buddy, or the boss while the builder is open.
      if (focus === 'boss' && hunter) {
        const b = toWorld(hunter.x, hunter.y, unit, cols, rows);
        follow(b.x, b.z, !snapped, true, dt);
      } else follow(at.x, at.z, !snapped, false, dt);
      snapped = true;

      critters.forEach((snail, i) => {
        const g = snails[i] ?? (snails[i] = snailFor(snail.color));
        toWorld(snail.x, snail.y, unit, cols, rows, at);
        g.position.set(at.x, Math.abs(Math.sin(tick / 8)) * 0.03, at.z);
        g.rotation.y = YAW[snail.dir] ?? 0;
      });

      if (bossRig && hunter) {
        // Head at the hunter; each body piece back along the path it took, at the boss's own spacing.
        const path = [[hunter.x, hunter.y], ...hunter.trail].map(([x, y]) => { const p = toWorld(x, y, unit, cols, rows); return [p.x, p.z]; });
        let back = 0;
        bossRig.pieces.forEach((piece, i) => {
          if (i) back += bossRig.spacing[i - 1] * BOSS_SCALE;
          const [px, pz, yaw] = along(path, back, YAW[hunter.dir]);
          piece.position.set(px, bossRig.lift, pz);
          piece.rotation.y = yaw;
        });
        bossRig.animate(t, 1, 0.5, Math.sin(t * 2.3) > 0.97 ? 0.1 : 1);
      }

      for (const berry of list) {
        let view = berries.get(berry);
        if (!view) berries.set(berry, view = berryFor(berry));
        const showing = !berry.gone || berry.flash > 0;
        view.group.visible = showing;
        if (!showing) continue;
        toWorld(berry.c * unit, berry.r * unit, unit, cols, rows, at);
        view.group.position.set(at.x, Math.sin(tick / 4) * 0.05, at.z);
        view.mat.color.set(berry.flash > 0 && !berry.ok ? '#e7a383' : '#c4534a');
      }
      renderer.render(scene, camera);
    },
    dispose() {
      grass?.dispose();
      bossRig?.dispose();
      disposables.forEach(d => d.dispose?.());
      renderer.dispose();
      canvas.remove();
    }
  };
}

/** A point `dist` metres back along a path of [x, z] points (head first), and the way it faces there. */
function along(path, dist, headYaw) {
  let left = dist;
  for (let i = 1; i < path.length; i++) {
    const [ax, az] = path[i - 1];
    const [bx, bz] = path[i];
    const d = Math.hypot(bx - ax, bz - az);
    if (d > 0 && d >= left) {
      const k = left / d;
      return [ax + (bx - ax) * k, az + (bz - az) * k, Math.atan2(-(az - bz), ax - bx)];
    }
    left -= d;
  }
  const [lx, lz] = path[path.length - 1];
  return [lx, lz, headYaw];
}

/** Merge same-layout box geometries into one, so all the hedges draw at once. */
function mergeBoxes(parts) {
  const total = parts.reduce((n, p) => n + p.getAttribute('position').count, 0);
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'color']) {
    const size = parts[0].getAttribute(name).itemSize;
    const arr = new Float32Array(total * size);
    let offset = 0;
    for (const p of parts) {
      arr.set(p.getAttribute(name).array, offset);
      offset += p.getAttribute(name).array.length;
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  return out;
}
