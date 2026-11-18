// The night bugs in Block meadow: a big blocky caterpillar (the same build as Garden dash's chaser)
// and a big blocky spider. Each model faces +x and stands with its feet at y = 0.
// `mouth` marks where a caught player's eyes are held, just in front of the jaws, and `face`
// where the camera looks while held.
import * as THREE from '../../vendor/three/build/three.module.js?v=r187';
// 'three' in boss-model resolves to the same file through the page's import map.
import { makeBoss } from '../../lib/boss-model.mjs';

const mat = color => new THREE.MeshLambertMaterial({ color, flatShading: true });
// Eyes glow a little so the bugs can be seen in the dark.
const glow = color => new THREE.MeshBasicMaterial({ color });
const MAT = {
  leaf: mat(0x7fbf3f),
  leafDark: mat(0x5a9a2e),
  pink: mat(0xf08aa6),
  cream: glow(0xfff4d6),
  black: mat(0x1d1a24),
  pupil: glow(0x1d1a24),
  purple: mat(0x6b4aa0),
  purpleDark: mat(0x4a3373),
  spot: mat(0xf2a7c8),
  fang: glow(0xfff4d6)
};

const unit = new THREE.BoxGeometry(1, 1, 1);
function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(unit, material);
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  return m;
}

/* ---------- the caterpillar: a head with a jaw, then six body blocks that follow along ---------- */

export function makeCaterpillar(scale = 1.25) {
  const head = new THREE.Group();
  const jaw = new THREE.Group();
  jaw.position.set(0.4, -0.75, 0);
  jaw.add(box(1.3, 0.3, 1.2, MAT.leafDark, 0.55, -0.1, 0), box(0.8, 0.08, 0.5, MAT.pink, 0.5, 0.06, 0));
  for (let i = 0; i < 3; i++) jaw.add(box(0.14, 0.18, 0.14, MAT.cream, 0.4 + i * 0.3, 0.12, 0.42), box(0.14, 0.18, 0.14, MAT.cream, 0.4 + i * 0.3, 0.12, -0.42));
  head.add(box(1.9, 1.7, 1.7, MAT.leaf), box(0.7, 0.8, 1.3, MAT.leaf, 0.95, -0.15, 0), box(0.4, 0.4, 0.4, MAT.pink, 1.4, 0.15, 0), jaw);
  // Garden dash shows the caterpillar side on. Here it walks straight at you, so the eyes face front.
  for (const z of [-0.45, 0.45]) {
    const eye = box(0.15, 0.62, 0.55, MAT.cream, 0.98, 0.56, z);
    eye.add(box(1.0, 0.5, 0.5, MAT.pupil, 0.4, -0.12, z > 0 ? -0.18 : 0.18));
    head.add(eye);
    const feeler = box(0.09, 0.9, 0.09, MAT.black, -0.2, 1.25, z * 1.1);
    feeler.rotation.x = z > 0 ? -0.3 : 0.3;
    feeler.add(box(2.6, 0.28, 2.6, MAT.pink, 0, 0.5, 0));
    head.add(feeler);
  }
  head.position.y = 1.1;
  const mouth = new THREE.Object3D();
  mouth.position.set(3.4, 0.1, 0);
  head.add(mouth);
  const face = new THREE.Object3D();
  face.position.set(0.9, -0.2, 0);
  head.add(face);

  const lead = new THREE.Group();
  lead.add(head);
  lead.scale.setScalar(scale);
  const segs = [lead];
  for (let i = 1; i < 7; i++) {
    const size = 1.45 - i * 0.08;
    const seg = new THREE.Group();
    seg.add(box(size, size, size, i % 2 ? MAT.leafDark : MAT.leaf, 0, size / 2 + 0.25, 0));
    for (const z of [-size * 0.35, size * 0.35]) seg.add(box(0.18, 0.4, 0.18, MAT.black, 0, 0.15, z));
    seg.scale.setScalar(scale);
    segs.push(seg);
  }
  const group = new THREE.Group();
  segs.forEach(s => group.add(s));
  return { kind: 'caterpillar', group, lead, segs, head, jaw, mouth, face, gap: 1.25 * scale, legs: [] };
}

/* ---------- the spider: a round-ish body, four eyes, two fangs, and eight bendy legs ---------- */

export function makeSpider(scale = 1.3) {
  const body = new THREE.Group();
  const abdomen = box(1.8, 1.4, 1.8, MAT.purple, -1.0, 1.55, 0);
  abdomen.add(box(0.3, 0.2, 0.3, MAT.spot, 0.1, 0.55, 0), box(0.25, 0.2, 0.25, MAT.spot, -0.25, 0.52, 0.28), box(0.25, 0.2, 0.25, MAT.spot, -0.25, 0.52, -0.28));
  const head = new THREE.Group();
  head.position.set(0.3, 1.35, 0);
  head.add(box(1.2, 1.0, 1.25, MAT.purpleDark));
  for (const z of [-0.3, 0.3]) {
    const eye = box(0.12, 0.42, 0.38, MAT.cream, 0.62, 0.12, z);
    eye.add(box(1.0, 0.55, 0.55, MAT.pupil, 0.3, -0.05, 0));
    head.add(eye, box(0.1, 0.2, 0.18, MAT.cream, 0.6, 0.45, z * 0.9));
  }
  const jaw = new THREE.Group();
  jaw.position.set(0.55, -0.4, 0);
  for (const z of [-0.2, 0.2]) jaw.add(box(0.14, 0.4, 0.14, MAT.fang, 0.05, -0.15, z));
  head.add(jaw);
  const mouth = new THREE.Object3D();
  mouth.position.set(2.6, 0.2, 0);
  head.add(mouth);
  const face = new THREE.Object3D();
  face.position.set(0.5, -0.05, 0);
  head.add(face);
  body.add(abdomen, head);

  const legs = [];
  const xs = [0.55, 0.2, -0.2, -0.55];
  const spread = [0.75, 0.25, -0.25, -0.75];
  for (const side of [1, -1]) {
    xs.forEach((x, i) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 1.25, side * 0.45);
      // The leg points along +z, then turns out to its side and toward the front or back.
      const turn = side > 0 ? spread[i] : Math.PI - spread[i];
      pivot.rotation.y = turn;
      const hip = new THREE.Group();
      hip.rotation.x = -0.7;
      hip.add(box(0.16, 0.16, 1.2, MAT.purpleDark, 0, 0, 0.6));
      const knee = new THREE.Group();
      knee.position.z = 1.2;
      knee.rotation.x = 1.9;
      knee.add(box(0.13, 0.13, 2.0, MAT.black, 0, 0, 1.0));
      hip.add(knee);
      pivot.add(hip);
      body.add(pivot);
      legs.push({ pivot, hip, turn, phase: (i % 2 === 0) === (side > 0) ? 0 : Math.PI });
    });
  }
  const lead = new THREE.Group();
  lead.add(body);
  lead.scale.setScalar(scale);
  const group = new THREE.Group();
  group.add(lead);
  return { kind: 'spider', group, lead, segs: [lead], head, jaw, mouth, face, body, gap: 0, legs };
}

/* ---------- made-up bugs: any Boss chase design, stood on the ground ---------- */

export function makeBossBug(design) {
  const boss = makeBoss(design);
  const mouth = new THREE.Object3D();
  mouth.position.set(2.8, 0.2, 0);
  boss.head.add(mouth);
  const face = new THREE.Object3D();
  face.position.set(0.8, 0, 0);
  boss.head.add(face);
  // Boss chase swims with the middle on the path; here the lowest part (legs) stands on the ground.
  boss.group.updateMatrixWorld(true);
  const lift = Math.max(0, -new THREE.Box3().setFromObject(boss.group).min.y / boss.scale);
  const base = 1.2 * boss.scale;
  const gaps = [0, ...boss.spacing.map(d => d / boss.scale * base)];
  return { kind: 'boss', boss, group: boss.group, lead: boss.lead, segs: [boss.lead, ...boss.segs.map(seg => seg.group)], head: boss.head, jaw: boss.jaw, mouth, face, gap: 1.25 * base, gaps, base, lift, legs: [] };
}

/** Walk cycle: legs step and the body bobs. `pace` grows with speed; `t` is the bug's own clock. */
export function animate(bug, t, pace, chomp = 0) {
  if (bug.boss) { bug.boss.animate(t, pace, chomp ? 1 : 0); return; }
  if (bug.kind === 'spider') {
    for (const leg of bug.legs) {
      const s = Math.sin(t * 9 * pace + leg.phase);
      leg.hip.rotation.x = -0.7 - Math.max(0, s) * 0.35 * Math.min(1, pace);
      leg.pivot.rotation.y = leg.turn + Math.cos(t * 9 * pace + leg.phase) * 0.18 * Math.min(1, pace);
    }
    bug.body.position.y = Math.abs(Math.sin(t * 9 * pace)) * 0.06;
    bug.jaw.rotation.z = chomp ? Math.sin(t * 22) * 0.4 : Math.sin(t * 3) * 0.08;
    return;
  }
  bug.segs.forEach((seg, i) => {
    seg.children[0].position.y = (i ? (seg.children[0].scale.y / 2 + 0.25) : 1.1) + Math.max(0, Math.sin(t * 7 * pace - i * 0.9)) * 0.22;
  });
  bug.jaw.rotation.z = chomp ? -0.25 - Math.abs(Math.sin(t * 14)) * 0.55 : -0.12 + Math.sin(t * 2.5) * 0.08;
}

/** Throw away a bug's meshes. The shared materials and box stay for the next night. */
export function dropBug(scene, bug) {
  scene.remove(bug.group);
  // A made-up bug has its own materials.
  bug.boss?.dispose();
}
