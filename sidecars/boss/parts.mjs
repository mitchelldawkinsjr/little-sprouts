/**
 * The boss the child builds. The caterpillar and spider come from Block meadow's night bugs
 * (sidecars/blocks/bugs.js): the same blocky head, jaw, teeth, fangs, body blocks, and bendy
 * legs. The shark, squid, gator, and octopus are built the same blocky way. Any head goes with
 * any body, legs, color, eyes, and topper, so a shark head can wiggle on a caterpillar body.
 *
 * The boss faces +x. `lead` is the head; `segs` are the body pieces (maybe none), which the
 * game places one by one along the path the head swam, so the boss follows like a chain.
 * `holder` sits in the jaw, where a caught buddy is held.
 */
import * as THREE from 'three';
import { normalizeBoss } from './logic.mjs?v=boss2';

export const COLORS = {
  green: [0x7fbf3f, 0x5a9a2e],
  purple: [0x8a63c4, 0x5f3f93],
  red: [0xe0564a, 0xa83a33],
  blue: [0x4f9bd9, 0x336fa6],
  orange: [0xf29a3a, 0xc06f1d],
  pink: [0xf08aa6, 0xc45f7f],
  gray: [0x8a9aa8, 0x62717e],
  teal: [0x3fb8a8, 0x2a8a7d]
};

/** How big each size is, against the buddy. */
export const SIZE_SCALE = { 1: 0.8, 2: 1.05, 3: 1.35 };

const unit = new THREE.BoxGeometry(1, 1, 1);
const cone = new THREE.ConeGeometry(0.5, 1, 4);
const fin3 = new THREE.ConeGeometry(0.5, 1, 3);
const dome = new THREE.IcosahedronGeometry(1, 0);

export function makeBoss(design) {
  const d = normalizeBoss(design);
  const [main, dark] = COLORS[d.color];
  const mats = [];
  const lambert = (color) => { const m = new THREE.MeshLambertMaterial({ color, flatShading: true }); mats.push(m); return m; };
  const glow = (color) => { const m = new THREE.MeshBasicMaterial({ color }); mats.push(m); return m; };
  const M = {
    main: lambert(main),
    dark: lambert(dark),
    pink: lambert(0xf08aa6),
    black: lambert(0x1d1a24),
    cream: glow(0xfff4d6),
    pupil: glow(0x1d1a24),
    spot: lambert(0xfff0c8),
    belly: lambert(0xf2efe6),
    horn: lambert(0xfff4d6)
  };
  const box = (w, h, dd, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(unit, mat);
    m.scale.set(w, h, dd);
    m.position.set(x, y, z);
    return m;
  };
  const spike = (r, h, mat, x = 0, y = 0, z = 0, geo = cone) => {
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(r * 2, h, r * 2);
    m.position.set(x, y, z);
    return m;
  };
  /** A row of pointy teeth along a jaw edge, pointing up (dir 1) or down (dir -1). */
  const teeth = (parent, n, x0, step, y, z, dir = 1, h = 0.26) => {
    for (const side of [1, -1]) {
      for (let i = 0; i < n; i++) {
        const t = spike(0.08, h, M.cream, x0 + i * step, y, side * z);
        if (dir < 0) t.rotation.z = Math.PI;
        parent.add(t);
      }
    }
  };
  /** A flat fin: a thin three-sided cone, leaning back. */
  const finPlate = (w, h, mat, x, y, z = 0, lean = 0.35) => {
    const f = new THREE.Mesh(fin3, mat);
    f.scale.set(w, h, 0.18);
    f.position.set(x, y, z);
    f.rotation.z = lean;
    return f;
  };

  /* ---------- heads ---------- */
  const head = new THREE.Group();
  const jaw = new THREE.Group();
  const holder = new THREE.Group();
  const eyes = [];
  const wobblers = [];   // feelers and horns that bob as it swims
  // Per head: where the eyes go (x, y on the side, z of the side face), the top of the head
  // for toppers, how far the head reaches back (where the body starts), and how the jaw opens.
  let eyeSpots = [[0.45, 0.35], [-0.15, 0.4], [0.15, -0.05]];
  let eyeZ = 0.88;
  let eyeSize = 1;
  let top = 0.85;
  let topX = -0.2;
  let back = 0.95;
  let jawOpen = -1;      // -1 drops a lower jaw, 1 spreads fangs, 0.5 clicks a beak
  let mantle = null;     // the squid's long mantle, which sways

  if (d.head === 'caterpillar') {
    jaw.position.set(0.4, -0.75, 0);
    jaw.add(box(1.3, 0.3, 1.2, M.dark, 0.55, -0.1, 0), box(0.8, 0.08, 0.5, M.pink, 0.5, 0.06, 0));
    for (let i = 0; i < 3; i++) jaw.add(box(0.14, 0.18, 0.14, M.cream, 0.4 + i * 0.3, 0.12, 0.42), box(0.14, 0.18, 0.14, M.cream, 0.4 + i * 0.3, 0.12, -0.42));
    head.add(box(1.9, 1.7, 1.7, M.main), box(0.7, 0.8, 1.3, M.main, 0.95, -0.15, 0), box(0.4, 0.4, 0.4, M.pink, 1.4, 0.15, 0));
    holder.position.set(1.1, 0.25, 0);
  } else if (d.head === 'spider') {
    jaw.position.set(0.8, -0.55, 0);
    for (const z of [-0.3, 0.3]) {
      const fang = box(0.2, 0.6, 0.2, M.cream, 0.1, -0.2, z);
      fang.rotation.z = 0.25;
      jaw.add(fang);
    }
    jaw.add(box(0.7, 0.18, 0.9, M.black, -0.1, 0.05, 0));
    head.add(box(1.7, 1.4, 1.75, M.dark), box(0.5, 0.9, 1.3, M.dark, 0.8, -0.1, 0));
    top = 0.7;
    back = 0.85;
    jawOpen = 1;
    holder.position.set(0.6, 0.1, 0);
  } else if (d.head === 'shark') {
    // A long pointed snout, a pale belly, gill slits, and rows of pointy teeth.
    head.add(box(2.4, 1.4, 1.4, M.main), box(1.1, 1.0, 1.05, M.main, 1.6, 0.12, 0), box(0.55, 0.7, 0.7, M.main, 2.35, 0.2, 0));
    head.add(box(2.6, 0.35, 1.3, M.belly, 0.3, -0.6, 0));
    for (let i = 0; i < 3; i++) for (const z of [-0.71, 0.71]) head.add(box(0.07, 0.75, 0.04, M.dark, -0.55 - i * 0.25, -0.05, z));
    teeth(head, 5, 0.75, 0.28, -0.55, 0.42, -1);
    jaw.position.set(0.6, -0.65, 0);
    jaw.add(box(1.9, 0.3, 1.1, M.belly, 0.85, -0.08, 0), box(1.2, 0.08, 0.6, M.pink, 0.8, 0.07, 0));
    teeth(jaw, 5, 0.25, 0.3, 0.17, 0.42, 1);
    eyeSpots = [[1.25, 0.32], [0.65, 0.4], [0.95, 0.05]];
    eyeZ = 0.54;
    eyeSize = 0.6;
    top = 0.7;
    topX = -0.2;
    back = 1.2;
    holder.position.set(1.2, 0.3, 0);
  } else if (d.head === 'gator') {
    // A long flat snout with teeth up and down, nostrils at the tip, and eyes up on bumps.
    head.add(box(1.6, 1.0, 1.5, M.main), box(2.2, 0.5, 1.1, M.main, 1.8, -0.22, 0));
    for (const z of [-0.25, 0.25]) head.add(box(0.2, 0.12, 0.16, M.dark, 2.75, 0.08, z));
    for (const z of [-0.4, 0.4]) head.add(box(0.5, 0.45, 0.45, M.main, 0.35, 0.6, z));
    teeth(head, 6, 1.0, 0.3, -0.53, 0.5, -1, 0.22);
    jaw.position.set(0.6, -0.55, 0);
    jaw.add(box(2.5, 0.3, 1.05, M.dark, 1.15, -0.05, 0), box(1.8, 0.08, 0.6, M.pink, 1.2, 0.1, 0));
    teeth(jaw, 6, 0.4, 0.3, 0.18, 0.47, 1, 0.22);
    eyeSpots = [[0.4, 0.65], [-0.3, 0.15], [0.15, -0.15]];
    eyeZ = 0.63;
    eyeSize = 0.75;
    top = 0.5;
    topX = -0.35;
    back = 0.8;
    holder.position.set(1.6, 0.3, 0);
  } else if (d.head === 'octopus') {
    // A big round dome over a face, with a little beak underneath.
    const bulb = new THREE.Mesh(dome, M.main);
    bulb.scale.set(1.15, 1.3, 1.05);
    bulb.position.set(-0.25, 0.55, 0);
    head.add(bulb, box(1.3, 0.9, 1.35, M.main, 0.1, -0.35, 0));
    for (const [x, y, z] of [[-0.4, 1.4, 0.4], [-0.9, 0.9, 0.75], [0.05, 1.05, 0.85]]) head.add(box(0.28, 0.22, 0.12, M.dark, x, y, z));
    jaw.position.set(0.7, -0.7, 0);
    jaw.add(spike(0.16, 0.4, M.black, 0.1, 0, 0));
    jaw.children[0].rotation.z = -Math.PI / 2;
    eyeSpots = [[0.45, -0.1], [0.1, 0.45], [-0.25, -0.2]];
    eyeZ = 0.69;
    eyeSize = 1.15;
    top = 1.8;
    topX = -0.3;
    back = 1.1;
    jawOpen = 0.5;
    holder.position.set(0.4, 0, 0);
  } else {
    // Squid: a face with a beak, and a long pointed mantle with fins reaching back.
    head.add(box(1.1, 1.05, 1.15, M.main, 0.45, 0, 0));
    mantle = new THREE.Group();
    const cap = spike(0.75, 2.8, M.main, 0, 0, 0, new THREE.ConeGeometry(0.5, 1, 6));
    cap.rotation.z = Math.PI / 2;
    cap.position.x = -1.3;
    mantle.add(cap);
    for (const s of [1, -1]) {
      const f = finPlate(0.9, 1.1, M.dark, -2.3, s * 0.45, 0, s > 0 ? 0.9 : Math.PI - 0.9);
      mantle.add(f);
    }
    mantle.position.set(-0.05, 0.1, 0);
    head.add(mantle);
    jaw.position.set(1.05, -0.35, 0);
    jaw.add(spike(0.14, 0.35, M.black, 0.08, 0, 0));
    jaw.children[0].rotation.z = -Math.PI / 2;
    eyeSpots = [[0.6, 0.12], [0.2, 0.3], [0.35, -0.25]];
    eyeZ = 0.59;
    eyeSize = 1.0;
    top = 0.55;
    topX = 0.35;
    back = 2.6;
    jawOpen = 0.5;
    holder.position.set(0.4, 0, 0);
  }
  head.add(jaw);
  jaw.add(holder);

  // Eyes on both sides of the head, half on each: one, two, or three per side.
  for (const side of [1, -1]) {
    for (let i = 0; i < d.eyes / 2; i++) {
      const [x, y] = eyeSpots[i];
      const big = (i === 0 ? 1 : 0.75) * eyeSize;
      const eye = box(0.55 * big, 0.6 * big, 0.12, M.cream, x, y, side * eyeZ);
      eye.add(box(0.5, 0.5, 1.2, M.pupil, 0.15, -0.08, side * 0.1));
      eye.userData.h = eye.scale.y;
      head.add(eye);
      eyes.push(eye);
    }
  }

  /* ---------- toppers ---------- */
  if (d.extra === 'feelers') {
    for (const z of [-0.45, 0.45]) {
      const feeler = new THREE.Group();
      feeler.position.set(topX, top, z);
      feeler.add(box(0.09, 0.9, 0.09, M.black, 0, 0.45, 0), box(0.28, 0.28, 0.28, M.pink, 0, 0.95, 0));
      feeler.rotation.x = z > 0 ? -0.3 : 0.3;
      head.add(feeler);
      wobblers.push({ obj: feeler, base: feeler.rotation.x, axis: 'x', amount: 0.25 });
    }
  } else if (d.extra === 'horns') {
    for (const z of [-0.5, 0.5]) {
      const horn = spike(0.22, 0.8, M.horn, topX + 0.3, top + 0.35, z);
      horn.rotation.z = -0.35;
      head.add(horn);
      wobblers.push({ obj: horn, base: horn.rotation.z, axis: 'z', amount: 0.05 });
    }
  } else if (d.extra === 'spikes') {
    for (let i = 0; i < 3; i++) head.add(spike(0.2, 0.55, M.horn, topX + 0.6 - i * 0.45, top + 0.25, 0));
  }

  const lead = new THREE.Group();
  lead.add(head);

  /* ---------- body ---------- */
  const segs = [];
  const addSeg = (seg, size, len = size) => { segs.push({ group: seg, size, len }); };
  if (d.body === 'wiggly') {
    for (let i = 1; i < 7; i++) {
      const size = 1.45 - i * 0.08;
      const seg = new THREE.Group();
      seg.add(box(size, size, size, i % 2 ? M.dark : M.main));
      addSeg(seg, size);
    }
  } else if (d.body === 'long') {
    for (let i = 1; i < 11; i++) {
      const size = 1.05 - i * 0.04;
      const seg = new THREE.Group();
      seg.add(box(size * 1.1, size, size, i % 2 ? M.dark : M.main));
      addSeg(seg, size, size * 1.1);
    }
  } else if (d.body === 'round') {
    // The spider's big spotted abdomen, then a little tail.
    const seg = new THREE.Group();
    seg.add(box(2.2, 1.8, 2.0, M.main));
    seg.add(box(0.4, 0.25, 0.4, M.spot, 0.2, 0.95, 0), box(0.3, 0.22, 0.3, M.spot, -0.35, 0.92, 0.4), box(0.3, 0.22, 0.3, M.spot, -0.35, 0.92, -0.4));
    for (const z of [-1.01, 1.01]) seg.add(box(0.35, 0.35, 0.05, M.spot, -0.2, 0.2, z), box(0.25, 0.25, 0.05, M.spot, 0.45, -0.3, z));
    addSeg(seg, 1.9, 2.2);
    for (let i = 0; i < 2; i++) {
      const tail = new THREE.Group();
      const s = 0.7 - i * 0.2;
      tail.add(box(s, s, s, M.dark));
      addSeg(tail, s);
    }
  } else if (d.body === 'finned') {
    // A shark's body: a pale belly, a fin on the back, tapering to a tall tail fin.
    [1.3, 1.05, 0.8, 0.55].forEach((size, i) => {
      const seg = new THREE.Group();
      seg.add(box(size * 1.3, size, size * 0.95, M.main), box(size * 1.3, size * 0.3, size * 0.9, M.belly, 0, -size * 0.38, 0));
      if (i === 0) seg.add(finPlate(1.0, 1.3, M.dark, -0.1, size / 2 + 0.5));
      if (i === 3) {
        seg.add(finPlate(0.8, 1.5, M.dark, -0.55, 0.65, 0, 0.9));
        seg.add(finPlate(0.6, 1.0, M.dark, -0.5, -0.45, 0, Math.PI - 0.9));
      }
      addSeg(seg, size, size * 1.3);
    });
  } else if (d.body === 'scaly') {
    // A gator's body: wide and flat with bumpy ridges, then a long tapering tail.
    [1.35, 1.25, 1.05, 0.85, 0.65, 0.45].forEach((size, i) => {
      const seg = new THREE.Group();
      seg.add(box(size * 1.2, size * 0.75, size * 1.1, i % 2 ? M.dark : M.main));
      for (const z of [-0.25, 0.25]) seg.add(box(0.22, 0.18, 0.18, M.dark, 0, size * 0.38 + 0.06, z * size));
      addSeg(seg, size * 0.75, size * 1.2);
    });
  }
  if (d.extra === 'spikes') {
    segs.forEach(({ group, size }, i) => { if (i < segs.length - 1) group.add(spike(0.18, 0.45 * size, M.horn, 0, size / 2 + 0.18 * size, 0)); });
  } else if (d.extra === 'fin') {
    // A big fin on the back: on the first body piece, or on the head when there is no body.
    if (segs[0]) segs[0].group.add(finPlate(1.3, 1.8, M.dark, -0.1, segs[0].size / 2 + 0.75));
    else head.add(finPlate(1.2, 1.6, M.dark, topX, top + 0.7));
  }

  /* ---------- legs ---------- */
  const legs = [];
  const hub = segs[0] || { group: head, size: 1.4 };
  if (d.legs === 'stubby') {
    // Every block on a caterpillar or noodle; the front two otherwise; under the head if no body.
    const many = d.body === 'wiggly' || d.body === 'long';
    const carriers = segs.length ? (many ? segs : segs.slice(0, 2)) : [{ group: head, size: 1.5 }];
    carriers.forEach(({ group, size }, i) => {
      for (const side of [1, -1]) {
        const pivot = new THREE.Group();
        pivot.position.set(0, -size * 0.4, side * size * 0.35);
        pivot.add(box(0.2, 0.55, 0.2, M.black, 0, -0.27, 0));
        group.add(pivot);
        legs.push({ pivot, kind: 'stubby', phase: i * 0.9 + (side > 0 ? 0 : Math.PI) });
      }
    });
  } else if (d.legs === 'spider') {
    // Eight bendy legs, four each side, as on Block meadow's spider.
    const xs = [0.5, 0.17, -0.17, -0.5];
    const spread = [0.75, 0.25, -0.25, -0.75];
    for (const side of [1, -1]) {
      xs.forEach((x, i) => {
        const pivot = new THREE.Group();
        pivot.position.set(x * hub.size * 0.8, -0.1, side * hub.size * 0.45);
        const turn = side > 0 ? spread[i] : Math.PI - spread[i];
        pivot.rotation.y = turn;
        const hip = new THREE.Group();
        hip.rotation.x = -0.5;
        hip.add(box(0.16, 0.16, 1.2, M.dark, 0, 0, 0.6));
        const knee = new THREE.Group();
        knee.position.z = 1.2;
        knee.rotation.x = 1.6;
        knee.add(box(0.13, 0.13, 1.6, M.black, 0, 0, 0.8));
        hip.add(knee);
        pivot.add(hip);
        hub.group.add(pivot);
        legs.push({ pivot, hip, turn, kind: 'spider', phase: (i % 2 === 0) === (side > 0) ? 0 : Math.PI });
      });
    }
  } else if (d.legs === 'tentacles') {
    // Eight curling arms from under the head, trailing back and down, with pale suckers.
    const root = d.head === 'octopus' || d.head === 'squid' || !segs.length ? { group: head, x: d.head === 'squid' ? 0.2 : 0, y: -0.75 } : { group: hub.group, x: 0.3, y: -hub.size * 0.4 };
    for (let k = 0; k < 8; k++) {
      const z = ((k % 4) - 1.5) * 0.3 * (k < 4 ? 1 : -1);
      const arm = new THREE.Group();
      arm.position.set(root.x - (k % 4) * 0.12, root.y, z);
      arm.rotation.z = 0.35 + (k % 4) * 0.15;
      const links = [];
      let parent = arm;
      for (let i = 0; i < 5; i++) {
        const link = new THREE.Group();
        const w = 0.26 - i * 0.035;
        link.position.x = i ? -0.5 : 0;
        link.add(box(0.55, w, w, i % 2 ? M.dark : M.main, -0.27, 0, 0));
        if (i < 4) link.add(box(0.14, 0.06, 0.12, M.spot, -0.25, -w / 2, 0));
        parent.add(link);
        links.push(link);
        parent = link;
      }
      root.group.add(arm);
      legs.push({ kind: 'tentacle', links, phase: k * 0.8 });
    }
  } else if (d.legs === 'fins') {
    // Flat side fins that flap as it swims.
    for (const side of [1, -1]) {
      const pivot = new THREE.Group();
      pivot.position.set(0.2, -hub.size * 0.25, side * hub.size * 0.48);
      const f = box(0.9, 0.08, 0.55, M.dark, -0.4, 0, side * 0.2);
      f.rotation.y = side * 0.3;
      pivot.add(f);
      pivot.rotation.z = 0.5;
      hub.group.add(pivot);
      legs.push({ pivot, kind: 'fin', side, phase: side > 0 ? 0 : 0.4 });
    }
  }

  const scale = SIZE_SCALE[d.size];
  lead.scale.setScalar(scale);
  segs.forEach(s => s.group.scale.setScalar(scale));
  const group = new THREE.Group();
  group.add(lead);
  segs.forEach(s => group.add(s.group));

  // How far apart the body pieces sit along the path, front to back.
  const spacing = [];
  let prev = back;
  for (const s of segs) {
    spacing.push((prev + s.len / 2 + 0.05) * scale);
    prev = s.len / 2;
  }

  return {
    design: d,
    group,
    lead,
    head,
    jaw,
    holder,
    eyes,
    segs,
    spacing,
    scale,
    /** Reach of the head and front body for bumping into things. */
    radius: 1.1 * scale,
    /**
     * Swim cycle: legs paddle, tentacles curl, fins flap, feelers bob, the jaw chomps.
     * `pace` grows with speed (0..1.5); `chomp` opens the jaw wide; `blink` closes the eyes.
     */
    animate(t, pace = 1, chomp = 0, blink = 1) {
      for (const leg of legs) {
        const s = Math.sin(t * 8 * pace + leg.phase);
        if (leg.kind === 'stubby') leg.pivot.rotation.z = s * 0.7;
        else if (leg.kind === 'spider') {
          leg.hip.rotation.x = -0.5 - Math.max(0, s) * 0.45;
          leg.pivot.rotation.y = leg.turn + Math.cos(t * 8 * pace + leg.phase) * 0.25;
        } else if (leg.kind === 'tentacle') {
          leg.links.forEach((link, i) => { if (i) link.rotation.z = Math.sin(t * 5 * pace + leg.phase - i * 0.7) * 0.35; });
        } else if (leg.kind === 'fin') {
          leg.pivot.rotation.x = leg.side * Math.sin(t * 6 * pace + leg.phase) * 0.5;
        }
      }
      if (mantle) mantle.rotation.z = Math.sin(t * 4 * pace) * 0.06;
      for (const w of wobblers) w.obj.rotation[w.axis] = w.base + Math.sin(t * 6 + w.base * 3) * w.amount;
      const open = chomp ? 0.25 + Math.abs(Math.sin(t * 12)) * 0.6 * chomp : 0.12 + Math.abs(Math.sin(t * 3)) * 0.18;
      jaw.rotation.z = jawOpen < 0 ? -open : open * (jawOpen > 0.9 ? 0.6 : 0.5);
      eyes.forEach(e => { e.scale.y = e.userData.h * Math.max(0.08, blink); });
    },
    dispose() {
      group.parent?.remove(group);
      mats.forEach(m => m.dispose());
    }
  };
}
