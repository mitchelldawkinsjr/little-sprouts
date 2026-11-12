/**
 * City glide — a paper plane slides between downtown blocks.
 * Steer with the arrows, the on-screen pad, or a controller.
 * Fly through the ring with the answer. The ground or a building ends the flight.
 * The flight idea follows TurdleTips' Paper City Glider. The plane, city, and rings are drawn here.
 */
import { moveDirs, readPad } from '../lib/pad-core.mjs?v=pad-rt';

const THREE_URL = '../vendor/three/build/three.module.js';
const RING = 3.4;

let active = null;

export function stopCity() {
  active?.destroy();
  active = null;
}

function call(fn, arg) {
  try { return fn?.(arg); }
  catch { return undefined; }
}

export function steerInput(held, padDirs) {
  let x = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  let y = (held.down ? 1 : 0) - (held.up ? 1 : 0);
  if (padDirs?.x) x = padDirs.x;
  if (padDirs?.y) y = padDirs.y;
  return { x, y };
}

const STEP = 32;

// The first stretch is a straight slot. After that the slot steps sideways
// so the plane has to slide between the towers.
export function streetAt(z) {
  if (z > -80) return 0;
  const n = Math.round(z / STEP);
  const slot = ((n % 5) + 5) % 5;
  return (slot - 2) * 4;
}

export function crossedRing(prevZ, z, ringZ, x, y, ringX, ringY, radius) {
  const before = prevZ - ringZ;
  const after = z - ringZ;
  if (!before || before * after > 0) return false;
  const dx = x - ringX;
  const dy = y - ringY;
  return dx * dx + dy * dy <= radius * radius;
}

function padDirs() {
  const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
  for (const pad of pads) {
    if (!pad) continue;
    const dirs = moveDirs(readPad(pad));
    if (dirs.x || dirs.y) return dirs;
  }
  return null;
}

function drawShape(ctx, name, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#32634e';
  ctx.beginPath();
  if (name === 'square') ctx.rect(-s * 0.38, -s * 0.38, s * 0.76, s * 0.76);
  else if (name === 'triangle') {
    ctx.moveTo(0, -s * 0.46);
    ctx.lineTo(s * 0.44, s * 0.34);
    ctx.lineTo(-s * 0.44, s * 0.34);
    ctx.closePath();
  } else if (name === 'diamond') {
    ctx.moveTo(0, -s * 0.48);
    ctx.lineTo(s * 0.38, 0);
    ctx.lineTo(0, s * 0.48);
    ctx.lineTo(-s * 0.38, 0);
    ctx.closePath();
  } else if (name === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const r = i % 2 ? s * 0.18 : s * 0.46;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
  } else ctx.ellipse(0, 0, name === 'oval' || name === 'rectangle' ? s * 0.58 : s * 0.4, s * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function labelSprite(THREE, choice) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(255,250,240,.96)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(12, 24, 360, 144, 36);
  else ctx.rect(12, 24, 360, 144);
  ctx.fill();
  if (choice.shape) drawShape(ctx, choice.shape, 192, 96, 78);
  else {
    const text = String(choice.label || '');
    ctx.fillStyle = choice.fill || '#143024';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = 72;
    ctx.font = `700 ${size}px Outfit, sans-serif`;
    while (size > 28 && ctx.measureText(text).width > 320) {
      size -= 2;
      ctx.font = `700 ${size}px Outfit, sans-serif`;
    }
    ctx.fillText(text, 192, 100);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(5.2, 2.6, 1);
  sprite.userData.texture = texture;
  return sprite;
}

export function mountCity(root, { board = {}, reduced, nextQuestion, onPrompt, onClear, onMiss, onOver, onFinished } = {}) {
  stopCity();
  const session = {
    dead: false,
    raf: 0,
    clean: [],
    destroy() {
      if (this.dead) return;
      this.dead = true;
      cancelAnimationFrame(this.raf);
      this.clean.forEach(fn => { try { fn(); } catch { /* already gone */ } });
      if (active === this) active = null;
    }
  };
  active = session;
  const host = document.createElement('div');
  host.className = 'arcade city-play';
  host.innerHTML = `<div class="city" role="application" aria-label="Steer the paper plane through the ring with the answer. Arrows, the pad, or a controller."><p class="city-wait">The city is coming.</p></div><div class="steer city-pad" aria-label="Steer"><button type="button" class="steer-btn" data-dir="left" aria-label="Bank left">←</button><button type="button" class="steer-btn" data-dir="up" aria-label="Climb">↑</button><button type="button" class="steer-btn" data-dir="down" aria-label="Dive">↓</button><button type="button" class="steer-btn" data-dir="right" aria-label="Bank right">→</button></div>`;
  root.replaceChildren(host);
  const stage = host.querySelector('.city');
  import(THREE_URL).then(THREE => {
    if (session.dead) return;
    begin(THREE, stage, host, session, { board, reduced, nextQuestion, onPrompt, onClear, onMiss, onOver, onFinished });
  }).catch(() => {
    if (session.dead) return;
    const wait = stage.querySelector('.city-wait');
    if (wait) wait.textContent = 'The city could not load. Check the connection and try again.';
  });
}

function begin(THREE, stage, host, session, { board, reduced, nextQuestion, onPrompt, onClear, onMiss, onOver, onFinished }) {
  stage.querySelector('.city-wait')?.remove();
  const calm = reduced ? 0.65 : 1;
  const choices = Math.max(3, Math.min(5, board.choices || 3));
  const canvas = document.createElement('canvas');
  canvas.className = 'city-view';
  stage.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const sky = 0x6a8fb3;
  scene.background = new THREE.Color(sky);
  scene.fog = new THREE.Fog(0x8aa6c0, 50, 280);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 420);
  scene.add(new THREE.HemisphereLight(0xc9daf0, 0x3d4638, 0.55));
  scene.add(new THREE.AmbientLight(0xb8c4d4, 0.28));
  const sun = new THREE.DirectionalLight(0xffe2b8, 1.05);
  sun.position.set(40, 70, 18);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9eb6d4, 0.35);
  fill.position.set(-30, 20, -10);
  scene.add(fill);

  const paintTex = (w, h, draw) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'));
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy?.() || 1);
    return tex;
  };
  const windowTex = paintTex(64, 128, ctx => {
    ctx.fillStyle = '#243040';
    ctx.fillRect(0, 0, 64, 128);
    for (let y = 3; y < 128; y += 9) {
      for (let x = 3; x < 64; x += 8) {
        const lit = ((x * 3 + y * 5) % 19) > 6;
        ctx.fillStyle = lit ? '#e8f0ff' : '#151c26';
        ctx.fillRect(x, y, 5, 6);
        if (lit) {
          ctx.fillStyle = '#fff6d8';
          ctx.fillRect(x + 1, y + 1, 2, 2);
        }
      }
    }
  });
  windowTex.wrapS = windowTex.wrapT = THREE.RepeatWrapping;
  windowTex.repeat.set(2.4, 5);
  const roadTex = paintTex(128, 256, ctx => {
    ctx.fillStyle = '#2f343c';
    ctx.fillRect(0, 0, 128, 256);
    ctx.fillStyle = '#383e48';
    for (let i = 0; i < 40; i++) {
      ctx.fillRect((i * 37) % 128, (i * 53) % 256, 18, 2);
    }
    ctx.fillStyle = '#d7c56a';
    for (let y = 8; y < 256; y += 28) ctx.fillRect(60, y, 8, 14);
    ctx.fillStyle = '#dfe3ea';
    ctx.fillRect(10, 0, 3, 256);
    ctx.fillRect(115, 0, 3, 256);
  });
  roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
  roadTex.repeat.set(1, 4);

  const street = new THREE.Group();
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 120),
    new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.92, metalness: 0.04 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.02;
  street.add(road);
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.85 });
  const walkMat = new THREE.MeshStandardMaterial({ color: 0xb7b2a6, roughness: 0.9 });
  [[-20.5, walkMat], [20.5, walkMat], [-18.2, curbMat], [18.2, curbMat]].forEach(([x, mat], i) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(i < 2 ? 5.2 : 0.55, i < 2 ? 0.18 : 0.28, 120), mat);
    strip.position.set(x, i < 2 ? 0.09 : 0.14, 0);
    street.add(strip);
  });
  scene.add(street);

  const plane = new THREE.Group();
  const paper = new THREE.BufferGeometry();
  paper.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    0, 0, -1.7,
    0, 0.32, 0.8,
    0, -0.16, 0.55,
    -1.55, 0.14, 0.45,
    1.55, 0.14, 0.45
  ]), 3));
  paper.setIndex([0, 3, 1, 0, 1, 4, 0, 2, 3, 0, 4, 2, 1, 3, 2, 1, 2, 4]);
  paper.computeVertexNormals();
  const sheet = new THREE.Mesh(paper, new THREE.MeshStandardMaterial({ color: 0xf7f4ea, roughness: 0.45, side: THREE.DoubleSide }));
  plane.add(sheet);
  plane.add(new THREE.LineSegments(new THREE.WireframeGeometry(paper), new THREE.LineBasicMaterial({ color: 0x6d6458 })));
  scene.add(plane);

  const blocks = [];
  const rings = [];
  const blockGeo = new THREE.BoxGeometry(1, 1, 1);
  const tones = [0x6d7886, 0x8b6f5c, 0x4f6578, 0x9a9386, 0x5a616c, 0x7a8b79];
  let builtTo = 20;
  let speed = 22;
  let grace = 1.4;
  let asking = false;
  let current = null;
  let waiting = 0.4;
  let slipped = false;
  let learningDone = false;
  let closed = false;
  let last = 0;
  let prevZ = 0;
  const held = { left: false, right: false, up: false, down: false };
  const keys = { left: false, right: false, up: false, down: false };
  const camGoal = new THREE.Vector3();

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(280, rect.width || 640);
    const height = Math.max(200, rect.height || 360);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();

  const dropMesh = (mesh, keepGeo) => {
    scene.remove(mesh);
    mesh.traverse(child => {
      if (!keepGeo) child.geometry?.dispose?.();
      const mats = child.material ? [].concat(child.material) : [];
      mats.forEach(mat => {
        if (mat.map && mat.map !== windowTex && mat.map !== roadTex) mat.map.dispose?.();
        // Shared city maps stay alive until cleanup.
        if (mat.map === windowTex || mat.map === roadTex) mat.map = null;
        mat.dispose?.();
      });
    });
  };

  const addBlock = (x, z, h, w, d) => {
    const group = new THREE.Group();
    const tone = tones[(Math.abs((x * 3 + z) / 11) | 0) % tones.length];
    const glass = tone === 0x4f6578;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: tone,
      map: windowTex,
      roughness: glass ? 0.35 : 0.78,
      metalness: glass ? 0.45 : 0.08
    });
    const body = new THREE.Mesh(blockGeo, bodyMat);
    body.scale.set(w, h, d);
    body.position.y = h / 2;
    group.add(body);
    const crown = Math.min(4.5, h * 0.08);
    const roof = new THREE.Mesh(
      blockGeo,
      new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.7, metalness: 0.2 })
    );
    roof.scale.set(w * 0.92, crown, d * 0.92);
    roof.position.y = h + crown / 2;
    group.add(roof);
    if (h > 48) {
      const cap = new THREE.Mesh(
        blockGeo,
        new THREE.MeshStandardMaterial({ color: 0x3e4a58, roughness: 0.55, metalness: 0.25 })
      );
      cap.scale.set(w * 0.55, Math.min(10, h * 0.12), d * 0.55);
      cap.position.y = h + crown + Math.min(10, h * 0.12) / 2;
      group.add(cap);
    }
    group.position.set(x, 0, z);
    scene.add(group);
    blocks.push({ mesh: group, x, z, h: h + crown + (h > 48 ? Math.min(10, h * 0.12) : 0), w, d });
  };

  const fillCity = () => {
    const ahead = plane.position.z - 240;
    while (builtTo > ahead) {
      builtTo -= STEP;
      const mid = streetAt(builtTo);
      const leftH = 42 + (Math.abs(builtTo * 3) % 34);
      const rightH = 50 + (Math.abs(builtTo * 5) % 30);
      addBlock(mid - 26, builtTo, leftH, 12, 20);
      addBlock(mid + 26, builtTo, rightH, 12, 20);
      addBlock(mid - 48, builtTo, leftH + 14, 14, 18);
      addBlock(mid + 48, builtTo, rightH + 10, 14, 18);
      if ((Math.abs(builtTo / STEP) | 0) % 2) {
        addBlock(mid - 68, builtTo + 8, 28 + (Math.abs(builtTo) % 20), 16, 14);
        addBlock(mid + 68, builtTo - 6, 32 + (Math.abs(builtTo * 2) % 18), 16, 14);
      }
    }
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i].z > plane.position.z + 36) {
        dropMesh(blocks[i].mesh, true);
        blocks.splice(i, 1);
      }
    }
  };

  const clearRings = () => {
    while (rings.length) {
      const ring = rings.pop();
      if (ring.mesh.parent) dropMesh(ring.mesh);
    }
  };

  const spots = (n, z) => {
    const mid = streetAt(z);
    const xs = n <= 3 ? [-5.5, 0, 5.5] : n === 4 ? [-7, -2.4, 2.4, 7] : [-8, -4, 0, 4, 8];
    const ys = [24, 14, 30, 19, 11];
    return xs.slice(0, n).map((x, i) => ({ x: mid + x, y: ys[i] }));
  };

  const placeRow = list => {
    clearRings();
    // Long run-up after the listen freeze lifts.
    const z = Math.round((plane.position.z - 180) / STEP) * STEP;
    list.forEach((choice, i) => {
      const spot = spots(list.length, z)[i];
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(RING, 0.28, 10, 32),
        new THREE.MeshStandardMaterial({ color: 0xf4efe4, roughness: 0.4 })
      );
      mesh.position.set(spot.x, spot.y, z);
      const sprite = labelSprite(THREE, choice);
      sprite.position.y = 0.2;
      mesh.add(sprite);
      scene.add(mesh);
      rings.push({ mesh, x: spot.x, y: spot.y, z, ok: !!choice.ok, gone: false });
    });
    asking = true;
    call(onPrompt);
  };

  const ask = () => {
    if (learningDone || closed || asking) return;
    if (!current) {
      const pack = call(nextQuestion);
      if (!pack?.choices?.length) {
        learningDone = true;
        closed = true;
        call(onFinished);
        return;
      }
      current = pack.choices.slice(0, choices);
      slipped = false;
    }
    placeRow(current);
  };

  const end = () => {
    if (closed) return;
    closed = true;
    call(onOver, 'crash');
  };

  const onKey = event => {
    if (event.target?.matches?.('input, textarea') || event.target?.isContentEditable) return;
    const down = event.type === 'keydown';
    const code = event.code;
    const dir = code === 'ArrowLeft' || code === 'KeyA' ? 'left'
      : code === 'ArrowRight' || code === 'KeyD' ? 'right'
        : code === 'ArrowUp' || code === 'KeyW' ? 'up'
          : code === 'ArrowDown' || code === 'KeyS' ? 'down' : '';
    if (!dir) return;
    keys[dir] = down;
    event.preventDefault();
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  session.clean.push(() => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKey);
  });

  host.querySelectorAll('[data-dir]').forEach(button => {
    const dir = button.dataset.dir;
    const set = on => { held[dir] = on; };
    const down = event => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      set(true);
    };
    const up = () => set(false);
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('lostpointercapture', up);
    session.clean.push(() => {
      button.removeEventListener('pointerdown', down);
      button.removeEventListener('pointerup', up);
      button.removeEventListener('pointercancel', up);
      button.removeEventListener('lostpointercapture', up);
    });
  });

  const onResize = () => resize();
  window.addEventListener('resize', onResize);
  session.clean.push(() => window.removeEventListener('resize', onResize));
  session.clean.push(() => {
    clearRings();
    blocks.forEach(block => dropMesh(block.mesh, true));
    blockGeo.dispose();
    paper.dispose();
    windowTex.dispose();
    roadTex.dispose();
    renderer.dispose();
  });

  const step = dt => {
    camGoal.set(plane.position.x, plane.position.y + 4.5, plane.position.z + 11);
    camera.position.lerp(camGoal, 1 - Math.pow(0.001, dt));
    camera.lookAt(plane.position.x, plane.position.y + 1, plane.position.z - 16);
    // Hold still while the question overlay plays, so rings stay ahead.
    if (document.body.classList.contains('listen-first')) return;
    const stick = steerInput({
      left: keys.left || held.left,
      right: keys.right || held.right,
      up: keys.up || held.up,
      down: keys.down || held.down
    }, padDirs());
    plane.rotation.set(stick.y * 0.28, 0, -stick.x * 0.7);
    prevZ = plane.position.z;
    plane.position.x += stick.x * 16 * calm * dt;
    plane.position.y += -stick.y * 14 * calm * dt;
    plane.position.z -= speed * calm * dt;
    grace = Math.max(0, grace - dt);
    street.position.z = plane.position.z;
    fillCity();
    if (!grace && plane.position.y < 1.1) return end();
    if (!grace) {
      for (const block of blocks) {
        const dx = Math.abs(plane.position.x - block.x);
        const dz = Math.abs(plane.position.z - block.z);
        if (dx < block.w / 2 + 0.45 && dz < block.d / 2 + 0.45 && plane.position.y < block.h + 0.35) return end();
      }
    }
    for (const ring of rings) {
      if (ring.gone) continue;
      if (!crossedRing(prevZ, plane.position.z, ring.z, plane.position.x, plane.position.y, ring.x, ring.y, RING)) continue;
      ring.gone = true;
      dropMesh(ring.mesh);
      if (ring.ok) {
        asking = false;
        current = null;
        clearRings();
        call(onClear, !slipped);
        waiting = 0.85;
        break;
      }
      slipped = true;
      call(onMiss);
    }
    const still = asking && rings.find(ring => ring.ok && !ring.gone);
    if (still && plane.position.z < still.z - 3) {
      asking = false;
      slipped = true;
      clearRings();
      call(onMiss);
      waiting = 0.7;
    }
    if (!asking && !closed) {
      waiting -= dt;
      if (waiting <= 0) ask();
    }
  };

  const frame = now => {
    if (session.dead) return;
    session.raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (!closed) step(dt);
    if (session.dead) return;
    renderer.render(scene, camera);
  };
  plane.position.set(0, 18, 12);
  fillCity();
  session.raf = requestAnimationFrame(frame);
}
