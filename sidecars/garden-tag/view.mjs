import * as THREE from '../../vendor/three/build/three.module.js?v=r187';
import { makeBuddy } from '../../lib/buddy3d.mjs?v=gear2';
import { ARENA, MAPS, POWERS, TALL } from './logic.mjs?v=gift1';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lite = () => (window.SproutsLite?.level || 0) > 0;

/** A canvas-text sprite: a rounded sign with an optional color or shape swatch. */
function signTexture(text, { fill = '', shape = '', bg = '#fffdf5', fg = '#1f3d22', edge = '#3f7d3a' } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const font = '800 56px system-ui, sans-serif';
  g.font = font;
  const sw = fill || shape ? 70 : 0;
  c.width = Math.ceil(Math.max(120, g.measureText(text).width + 70 + sw));
  c.height = 96;
  g.font = font;
  g.fillStyle = bg;
  g.strokeStyle = edge;
  g.lineWidth = 8;
  g.beginPath(); g.roundRect(4, 4, c.width - 8, c.height - 8, 44); g.fill(); g.stroke();
  if (sw) {
    g.fillStyle = fill || '#5d7a45';
    const x = 62, y = 48, r = 22;
    g.beginPath();
    if (shape === 'square' || shape === 'rectangle') g.rect(x - r, y - r, r * 2, r * 2);
    else if (shape === 'triangle') { g.moveTo(x, y - r); g.lineTo(x + r, y + r); g.lineTo(x - r, y + r); }
    else if (shape === 'diamond') { g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); }
    else g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, (c.width + sw) / 2, 52);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, aspect: c.width / c.height };
}
function makeSign(text, opts, height = .62) {
  const { tex, aspect } = signTexture(text, opts);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sprite.scale.set(height * aspect, height, 1);
  sprite.renderOrder = 5;
  return sprite;
}
function retext(sprite, text, opts, height = .5) {
  const { tex, aspect } = signTexture(text, opts);
  sprite.material.map.dispose();
  sprite.material.map = tex;
  sprite.material.needsUpdate = true;
  sprite.scale.set(height * aspect, height, 1);
}

/** A gift box with a ribbon; its power floats above it as an emoji sign. */
function makeGift() {
  const gift = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(.7, .55, .7), new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: .5, emissive: '#5b1335', emissiveIntensity: .35 }));
  box.position.y = .3;
  const ribbon = new THREE.MeshStandardMaterial({ color: '#fde047', roughness: .4 });
  const a = new THREE.Mesh(new THREE.BoxGeometry(.74, .57, .14), ribbon);
  const b = new THREE.Mesh(new THREE.BoxGeometry(.14, .57, .74), ribbon);
  a.position.y = b.position.y = .3;
  const bow = new THREE.Mesh(new THREE.TorusGeometry(.13, .05, 8, 16), ribbon);
  bow.position.y = .65;
  gift.add(box, a, b, bow);
  return gift;
}

function makeBee() {
  const bee = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(.17, 16, 12), new THREE.MeshStandardMaterial({ color: '#facc15', roughness: .5 }));
  body.scale.set(1.3, 1, 1);
  bee.add(body);
  const dark = new THREE.MeshStandardMaterial({ color: '#2b2118' });
  for (const x of [-.06, .1]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(.155, .035, 6, 16), dark);
    band.rotation.y = Math.PI / 2;
    band.position.x = x;
    bee.add(band);
  }
  const wingMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .8, side: THREE.DoubleSide });
  const wings = [-1, 1].map(side => {
    const w = new THREE.Mesh(new THREE.CircleGeometry(.13, 12), wingMat);
    w.position.set(0, .17, side * .09);
    w.rotation.x = -Math.PI / 2 + side * .5;
    bee.add(w);
    return w;
  });
  bee.userData.wings = wings;
  return bee;
}

function buildGarden(scene, map) {
  const garden = new THREE.Group();
  const night = map.night;
  const grass = new THREE.MeshStandardMaterial({ color: night ? '#36553f' : '#8fd06a', roughness: .95 });
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: night ? '#2a4433' : '#7cc05a', roughness: 1 }));
  yard.rotation.x = -Math.PI / 2;
  yard.position.y = -.01;
  garden.add(yard);
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(ARENA * 2, ARENA * 2), grass);
  lawn.rotation.x = -Math.PI / 2;
  garden.add(lawn);

  // A low picket fence around the play area.
  const wood = new THREE.MeshStandardMaterial({ color: night ? '#8a7560' : '#f3e6cf', roughness: .8 });
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(.18, .9, .18), wood, 4 * 27);
  const m = new THREE.Matrix4();
  let n = 0;
  for (let i = 0; i < 27; i++) {
    const t = -ARENA + i * (ARENA * 2 / 26);
    for (const [x, z] of [[t, -ARENA], [t, ARENA], [-ARENA, t], [ARENA, t]]) posts.setMatrixAt(n++, m.makeTranslation(x, .45, z));
  }
  garden.add(posts);
  for (const [x, z, w, d] of [[0, -ARENA, ARENA * 2, .1], [0, ARENA, ARENA * 2, .1], [-ARENA, 0, .1, ARENA * 2], [ARENA, 0, .1, ARENA * 2]]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w, .12, d), wood);
    rail.position.set(x, .62, z);
    garden.add(rail);
  }

  const bark = new THREE.MeshStandardMaterial({ color: night ? '#6b5440' : '#9b6a3f', roughness: .85 });
  const moss = new THREE.MeshStandardMaterial({ color: night ? '#4f8a5c' : '#76c853', roughness: .9 });
  for (const b of map.boxes) {
    const log = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), bark);
    log.position.set(b.x, b.h / 2, b.z);
    garden.add(log);
    const top = new THREE.Mesh(new THREE.BoxGeometry(b.w + .08, .14, b.d + .08), moss);
    top.position.set(b.x, b.h - .05, b.z);
    garden.add(top);
  }
  const stem = new THREE.MeshStandardMaterial({ color: '#f4ead6', roughness: .7 });
  const cap = new THREE.MeshStandardMaterial({ color: '#e2574c', roughness: .5 });
  const dot = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  for (const s of map.springs) {
    const shroom = new THREE.Group();
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.22, .3, .45, 12), stem);
    st.position.y = .22;
    const cp = new THREE.Mesh(new THREE.SphereGeometry(.75, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), cap);
    cp.scale.y = .55;
    cp.position.y = .38;
    shroom.add(st, cp);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05, d = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), dot);
      d.position.set(Math.cos(a) * .48, .62, Math.sin(a) * .48);
      shroom.add(d);
    }
    shroom.position.set(s.x, 0, s.z);
    garden.add(shroom);
  }

  // Trees outside the fence.
  const trunk = new THREE.MeshStandardMaterial({ color: '#7a5634' });
  const leaf = new THREE.MeshStandardMaterial({ color: night ? '#2e5b3f' : '#4fa64a', roughness: .9 });
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2, r = ARENA + 9 + (i % 3) * 2.5;
    const tree = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.25, .35, 2, 8), trunk);
    t.position.y = 1;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.5 + (i % 2) * .4, 12, 9), leaf);
    crown.position.y = 2.8;
    tree.add(t, crown);
    tree.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    garden.add(tree);
  }

  if (night) {
    const n = 40, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([(Math.random() - .5) * ARENA * 2, .6 + Math.random() * 4, (Math.random() - .5) * ARENA * 2], i * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const flies = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffe98a', size: .14 }));
    flies.name = 'fireflies';
    garden.add(flies);
  }
  scene.add(garden);
  return garden;
}

export function makeView(host) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !lite(), powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setScissorTest(true);
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Garden tag. Run and jump on the logs. Whoever has the bee is it.');
  host.append(canvas);

  const scene = new THREE.Scene();
  const hemi = new THREE.HemisphereLight('#ffffff', '#5d8a4a', 1.6);
  const sun = new THREE.DirectionalLight('#fff4d6', 1.6);
  sun.position.set(8, 14, 6);
  scene.add(hemi, sun);
  const cams = [0, 1].map(() => new THREE.PerspectiveCamera(55, 1, .1, 120));
  const bees = [makeBee(), makeBee()];
  const bubbles = [0, 1].map(() => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.85, 20, 14), new THREE.MeshBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: .28, depthWrite: false }));
    scene.add(b);
    return b;
  });
  scene.add(...bees);
  let garden = null, mapIndex = -1, buddies = [], kinds = [], tags = [], tagText = ['', ''];
  let gifts = [], giftIcons = [];
  const ice = [0, 1].map(() => {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 1.1), new THREE.MeshStandardMaterial({ color: '#bae6fd', transparent: true, opacity: .45, roughness: .1, depthWrite: false }));
    scene.add(cube);
    return cube;
  });

  function setMap(index) {
    if (index === mapIndex) return;
    mapIndex = index;
    if (garden) scene.remove(garden);
    const map = MAPS[index];
    garden = buildGarden(scene, map);
    for (const g of gifts) scene.remove(g);
    for (const g of giftIcons) scene.remove(g);
    gifts = map.spots.map(() => { const g = makeGift(); scene.add(g); return g; });
    giftIcons = map.spots.map(() => { const s = makeSign(' ', {}, .7); scene.add(s); return s; });
    giftIcons.forEach(s => { s.userData.power = ''; });
    const sky = map.night ? '#26345e' : index === 1 ? '#ffe2b8' : '#bfe8ff';
    scene.background = new THREE.Color(sky);
    scene.fog = new THREE.Fog(sky, 30, 70);
    hemi.intensity = map.night ? .8 : 1.6;
    sun.intensity = map.night ? .5 : 1.6;
  }
  function setBuddies(a, b) {
    if (kinds[0] === a && kinds[1] === b) return;
    kinds = [a, b];
    for (const old of buddies) scene.remove(old.group);
    // The rival never wears the learner's star-shop gear (ADR 0001).
    buddies = [makeBuddy(THREE, a), makeBuddy(THREE, b, { gear: '' })];
    for (const bud of buddies) scene.add(bud.group);
    for (const t of tags) scene.remove(t);
    tags = [0, 1].map(() => { const s = makeSign(' ', {}, .45); scene.add(s); return s; });
    tagText = ['', ''];
  }
  function size() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }
  addEventListener('resize', size);
  size();

  // Each camera eases in behind its buddy.
  const goal = new THREE.Vector3(), look = new THREE.Vector3();
  function follow(cam, p, yaw, dt, snap) {
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    // Stay inside the fence so trees never fill the view.
    const edge = ARENA + 1.5;
    goal.set(Math.max(-edge, Math.min(edge, p.x - fx * 6.2)), p.y + 3.6, Math.max(-edge, Math.min(edge, p.z - fz * 6.2)));
    if (snap) cam.position.copy(goal);
    else cam.position.lerp(goal, 1 - Math.exp(-dt * 6));
    look.set(p.x + fx * 1.5, p.y + 1, p.z + fz * 1.5);
    cam.lookAt(look);
  }

  return {
    area: canvas,
    setBuddies,
    draw(run, names, yaws, dt, snap = false) {
      setMap(run.mode - 1);
      const t = run.time;
      run.players.forEach((p, i) => {
        const bud = buddies[i];
        if (!bud) return;
        bud.group.position.set(p.x, p.y, p.z);
        bud.group.rotation.y = p.yaw;
        bud.animate(still ? 0 : dt, p.ground ? Math.min(1, Math.hypot(p.vx, p.vz) / 6.5) : .3, still ? 0 : t);
        bud.group.visible = p.freeze > 1 || !(p.freeze > 0 && Math.floor(t * 10) % 2);
        const label = run.it === i ? names[i] + ' · IT' : names[i];
        if (tagText[i] !== label) {
          tagText[i] = label;
          retext(tags[i], label, run.it === i ? { bg: '#fff1e6', fg: '#c2410c', edge: '#f97316' } : {}, .42);
        }
        tags[i].position.set(p.x, p.y + TALL + .55, p.z);
        bubbles[i].visible = p.shield > 0;
        bubbles[i].position.set(p.x, p.y + .6, p.z);
        // A long freeze is the 🧊 power; the short wait after a tag just blinks.
        ice[i].visible = p.freeze > 1;
        ice[i].position.set(p.x, p.y + .72, p.z);
      });
      bees.forEach((bee, i) => {
        bee.visible = run.it === i;
        const p = run.players[i];
        const a = still ? 0 : t * 4;
        bee.position.set(p.x + Math.cos(a) * .55, p.y + TALL + 1.05 + (still ? 0 : Math.sin(t * 9) * .08), p.z + Math.sin(a) * .55);
        bee.rotation.y = -a;
        for (const w of bee.userData.wings) w.scale.y = still ? 1 : .6 + Math.abs(Math.sin(t * 40)) * .5;
      });
      run.gifts.forEach((g, i) => {
        const shown = g.back <= 0;
        gifts[i].visible = giftIcons[i].visible = shown;
        if (!shown) return;
        const bob = still ? 0 : Math.sin(t * 2.4 + g.x) * .1;
        gifts[i].position.set(g.x, g.y, g.z);
        gifts[i].rotation.y = still ? 0 : t * .8 + g.x;
        if (giftIcons[i].userData.power !== g.power) {
          giftIcons[i].userData.power = g.power;
          retext(giftIcons[i], POWERS[g.power].icon, { bg: '#ffffff', edge: '#f472b6' }, .7);
        }
        giftIcons[i].position.set(g.x, g.y + 1.25 + bob, g.z);
      });
      const flies = garden.getObjectByName('fireflies');
      if (flies && !still) flies.rotation.y = t * .03;

      const W = host.clientWidth, H = host.clientHeight;
      const views = run.two ? [[0, 0, W / 2, H], [W / 2, 0, W / 2, H]] : [[0, 0, W, H]];
      views.forEach(([x, y, w, h], i) => {
        const cam = cams[i];
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
        follow(cam, run.players[i], yaws[i], dt, snap);
        renderer.setViewport(x, y, w, h);
        renderer.setScissor(x, y, w, h);
        renderer.render(scene, cam);
      });
    },
  };
}
