/**
 * The learner's garden buddy as a small 3D character.
 *
 * Rule: when a game has a player character, it is the garden buddy chosen on the
 * learner's profile (fox, bear, bunny, frog, owl, or chick). Colors match the buddy
 * drawings in style.css. Games pass in their own THREE so this file needs no import map.
 *
 *   const kind = buddyKind(msg.buddy);          // host message, else saved profile, else fox
 *   const buddy = makeBuddy(THREE, kind);
 *   scene.add(buddy.group);
 *   buddy.animate(dt, run, time);               // run: 0 standing … 1 full speed
 *
 * The group stands on y = 0, faces +z, and is about 1.2 units tall.
 *
 * Options for games with their own look and animation (Paint Sphere):
 *   material(color) -> Material   build every colored part with the game's material
 *   shadow: false                 leave out the soft blob shadow
 *   gear: 'cap chain67' | ''      star-shop gear to wear (ids with spaces); left out, the learner's own
 *                                 buddy wears what they picked in the shop (a rival does not)
 * The result also has the rig parts: chest (moves the whole upper body), head,
 * arms [left, right], legs [left, right], and eyes (for blinking).
 */
import { SPRITES, profileSprite } from '../logic/profiles.mjs?v=buddy1';
import { gearList, wornGear } from '../logic/shop.mjs?v=shop3';

export const BUDDIES = SPRITES;

/** The active learner's buddy and star-shop gear from this browser's saved Sprouts data. */
export function savedLook(storage = globalThis.localStorage) {
  try {
    const data = JSON.parse(storage?.getItem('sprouts-v1')) || {};
    const index = Math.max(0, data.active | 0);
    const profile = data.profiles?.[index];
    return profile ? { kind: profileSprite(profile, index), gear: wornGear(profile) } : { kind: '', gear: '' };
  } catch {
    return { kind: '', gear: '' };
  }
}

/** The active learner's buddy from this browser's saved Sprouts data. */
export function savedBuddy(storage) {
  return savedLook(storage).kind;
}

/** Gear the saved learner's buddy wears, but only when `kind` is that buddy (not a rival). */
export function buddyGear(kind, storage) {
  const look = savedLook(storage);
  return look.kind && look.kind === kind ? look.gear : '';
}

/** A buddy name from the host if it sent one, else the saved profile, else the fox. */
export function buddyKind(fromHost, storage) {
  if (SPRITES.includes(fromHost)) return fromHost;
  return savedBuddy(storage) || SPRITES[0];
}

/** Colors per buddy, shared with the 2D drawing in lib/buddy2d.mjs. */
export const BUDDY_LOOK = {
  fox: { fur: '#e07a2f', body: '#e08a45', belly: '#f6e2cf', inner: '#f3c7a4', nose: '#6b3418', limb: '#9a4a1c', eye: '#244b3d' },
  bear: { fur: '#8b5a3c', body: '#8b5a3c', belly: '#e6c2a4', inner: '#c4896a', nose: '#3d2a22', snout: '#f0d2b8', limb: '#6e4630', eye: '#2c211c' },
  bunny: { fur: '#f7f1e6', body: '#f7f1e6', belly: '#ffffff', inner: '#f3b7c4', nose: '#e7a0b0', limb: '#e4d3c0', eye: '#244b3d' },
  frog: { fur: '#7daa45', body: '#6b9840', belly: '#c9dc8f', nose: '#c46a4a', limb: '#5d8a36', eye: '#244b3d', rim: '#4f6b38' },
  owl: { fur: '#8d6b45', body: '#a6845c', belly: '#d9c3a0', nose: '#e0a15a', limb: '#e0a15a', wing: '#7a5a38', eye: '#244b3d' },
  chick: { fur: '#f6d35b', body: '#f3c43a', belly: '#fbe7a0', nose: '#e07a2f', limb: '#e07a2f', wing: '#e7b72e', eye: '#244b3d' }
};

export function makeBuddy(THREE, kind = 'fox', opts = {}) {
  const k = BUDDY_LOOK[kind] ? kind : 'fox';
  const c = BUDDY_LOOK[k];
  const std = opts.material
    ? (color) => opts.material(color)
    : (color, roughness = 0.65) => new THREE.MeshStandardMaterial({ color, roughness });
  const eyes = [];
  const flat = (color) => new THREE.MeshBasicMaterial({ color });
  const M = {
    fur: std(c.fur), body: std(c.body), belly: std(c.belly), limb: std(c.limb, 0.7),
    inner: std(c.inner || c.belly), nose: std(c.nose, 0.4), eye: flat(c.eye), white: flat('#ffffff'),
    cheek: flat('#f2a0a0'), extra: std(c.snout || c.wing || c.rim || c.fur)
  };
  const sphere = (r, mat, sx = 1, sy = 1, sz = 1, seg = 20) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), mat);
    m.scale.set(sx, sy, sz);
    return m;
  };

  const group = new THREE.Group();
  group.name = `buddy-${k}`;
  const chest = new THREE.Group();
  group.add(chest);
  const body = new THREE.Group();
  body.position.y = 0.5;
  chest.add(body);
  const head = new THREE.Group();
  head.position.y = 0.3;
  body.add(head);

  // Torso and tummy.
  const torso = sphere(0.3, M.body, 1, 0.9, 0.85);
  torso.position.y = -0.04;
  body.add(torso);
  const tummy = sphere(0.2, M.belly, 1, 1, 0.5);
  tummy.position.set(0, -0.05, 0.19);
  body.add(tummy);

  // Head shape.
  const wide = k === 'frog' ? 1.25 : 1;
  const skull = sphere(0.34, M.fur, wide, k === 'frog' ? 0.78 : 0.95, 0.9, 24);
  head.add(skull);

  // Eyes: big round ones for the frog and owl, little dots for the rest.
  const big = k === 'frog' || k === 'owl';
  for (const side of [-1, 1]) {
    if (big) {
      const ball = sphere(0.11, M.white);
      const pupil = sphere(0.05, M.eye);
      if (k === 'frog') {
        const rim = sphere(0.125, M.extra);
        rim.position.set(side * 0.17, 0.22, 0.12);
        ball.position.set(side * 0.17, 0.24, 0.17);
        pupil.position.set(side * 0.17, 0.25, 0.27);
        head.add(rim);
      } else {
        ball.position.set(side * 0.13, 0.06, 0.26);
        pupil.position.set(side * 0.13, 0.06, 0.36);
      }
      head.add(ball, pupil);
      eyes.push(ball, pupil);
    } else {
      const eye = sphere(0.05, M.eye, 1, 1.15, 1, 12);
      eye.position.set(side * 0.13, 0.06, 0.29);
      const glint = sphere(0.017, M.white, 1, 1, 1, 8);
      glint.position.set(side * 0.13 + 0.015, 0.085, 0.335);
      head.add(eye, glint);
      eyes.push(eye, glint);
    }
    if (k !== 'owl') {
      // Some game builds of three.js leave out CircleGeometry; a flat sphere looks the same.
      const blush = THREE.CircleGeometry
        ? new THREE.Mesh(new THREE.CircleGeometry(0.045, 12), M.cheek)
        : sphere(0.045, M.cheek, 1, 0.7, 0.15, 10);
      blush.position.set(side * 0.21, -0.04, 0.27);
      blush.rotation.y = side * 0.55;
      head.add(blush);
    }
  }

  // Nose, snout, or beak.
  if (k === 'fox') {
    const muzzle = sphere(0.13, M.belly, 1, 0.75, 1);
    muzzle.position.set(0, -0.08, 0.25);
    const nose = sphere(0.045, M.nose);
    nose.position.set(0, -0.05, 0.37);
    head.add(muzzle, nose);
  } else if (k === 'bear') {
    const snout = sphere(0.13, M.extra, 1.1, 0.8, 0.9);
    snout.position.set(0, -0.09, 0.26);
    const nose = sphere(0.045, M.nose, 1.2, 0.9, 1);
    nose.position.set(0, -0.05, 0.37);
    head.add(snout, nose);
  } else if (k === 'bunny') {
    const nose = sphere(0.035, M.nose, 1.3, 1, 1);
    nose.position.set(0, -0.04, 0.32);
    head.add(nose);
  } else if (k === 'frog') {
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 6, 16, Math.PI), M.nose);
    mouth.rotation.z = Math.PI;
    mouth.position.set(0, -0.02, 0.3);
    head.add(mouth);
  } else {
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, k === 'owl' ? 0.12 : 0.15, 10), M.nose);
    if (k === 'owl') {
      beak.rotation.x = Math.PI;
      beak.position.set(0, -0.06, 0.33);
    } else {
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, -0.04, 0.36);
    }
    head.add(beak);
  }
  if (k !== 'frog' && k !== 'owl' && k !== 'chick') {
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.011, 6, 12, Math.PI), M.eye);
    smile.rotation.z = Math.PI;
    smile.position.set(0, k === 'bunny' ? -0.1 : -0.15, k === 'bunny' ? 0.31 : 0.3);
    head.add(smile);
  }

  // Ears, tufts, or a comb. These wiggle as the buddy runs.
  const ears = [];
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    if (k === 'fox' || k === 'owl') {
      const tall = k === 'fox' ? 0.24 : 0.16;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(k === 'fox' ? 0.1 : 0.07, tall, 4), M.fur);
      cone.position.y = tall / 2;
      ear.add(cone);
      if (k === 'fox') {
        const inner = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.13, 4), M.inner);
        inner.position.set(0, 0.07, 0.04);
        ear.add(inner);
      }
      ear.position.set(side * 0.18, 0.24, 0);
      ear.rotation.z = side * -0.3;
    } else if (k === 'bear') {
      const round = sphere(0.1, M.fur, 1, 1, 0.6);
      const inner = sphere(0.055, M.inner, 1, 1, 0.5);
      inner.position.z = 0.04;
      ear.add(round, inner);
      ear.position.set(side * 0.22, 0.25, 0);
    } else if (k === 'bunny') {
      const long = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3, 4, 10), M.fur);
      long.position.y = 0.2;
      const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.22, 4, 8), M.inner);
      inner.position.set(0, 0.2, 0.04);
      ear.add(long, inner);
      ear.position.set(side * 0.11, 0.24, 0);
      ear.rotation.z = side * -0.15;
    } else if (k === 'chick' && side === 1) {
      const tuft = sphere(0.06, M.nose, 0.6, 1.2, 1);
      tuft.position.y = 0.05;
      ear.add(tuft);
      ear.position.set(0, 0.3, 0);
    }
    if (ear.children.length) {
      head.add(ear);
      ears.push({ ear, side, rest: ear.rotation.z });
    }
  }

  // Arms (paws or wings).
  const winged = k === 'owl' || k === 'chick';
  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.27, 0.04, 0);
    const limb = winged
      ? sphere(0.13, M.extra, 0.45, 1, 0.8)
      : new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.14, 4, 8), M.limb);
    limb.position.set(side * 0.03, -0.1, 0);
    shoulder.rotation.z = side * (winged ? 0.25 : 0.35);
    shoulder.add(limb);
    body.add(shoulder);
    return shoulder;
  });

  // Legs with round feet.
  const legs = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.12, 0.34, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.14, 4, 8), M.limb);
    leg.position.y = -0.13;
    const foot = sphere(0.08, M.limb, 1, 0.55, k === 'frog' ? 1.8 : 1.4, 12);
    foot.position.set(0, -0.27, 0.05);
    hip.add(leg, foot);
    group.add(hip);
    return hip;
  });

  // Tails.
  let tail = null;
  if (k === 'fox') {
    tail = new THREE.Group();
    const brush = sphere(0.12, M.fur, 0.8, 0.8, 1.9);
    brush.position.z = -0.18;
    const tip = sphere(0.07, M.belly, 1, 1, 1.2);
    tip.position.z = -0.38;
    tail.add(brush, tip);
    tail.position.set(0, -0.08, -0.22);
    tail.rotation.x = -0.5;
    body.add(tail);
  } else if (k === 'bunny' || k === 'bear') {
    tail = new THREE.Group();
    tail.add(sphere(k === 'bunny' ? 0.08 : 0.06, k === 'bunny' ? M.belly : M.fur));
    tail.position.set(0, -0.14, -0.27);
    body.add(tail);
  }

  // Gear is a bonus: if a game's three.js build lacks a shape, the buddy still shows.
  try {
    addGear(THREE, { head, body, legs }, k, typeof opts.gear === 'string' ? opts.gear : buddyGear(k), std, sphere);
  } catch (err) {
    console.warn('Buddy gear skipped.', err);
  }

  const shadow = opts.shadow === false ? null : new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 24),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.25, depthWrite: false })
  );
  if (shadow) {
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);
  }

  let stride = 0;
  return {
    kind: k,
    group,
    chest,
    body,
    head,
    arms,
    legs,
    eyes,
    /** Walk cycle: legs, arms (or flapping wings), bob, ear wiggle, tail wag. Returns the stride phase. */
    animate(dt, run, time) {
      const r = Math.max(0, Math.min(1, run));
      if (r > 0.05) stride += dt * (4 + r * 10);
      const s = Math.sin(stride);
      legs[0].rotation.x = s * 0.9 * r;
      legs[1].rotation.x = -s * 0.9 * r;
      if (winged) {
        const flap = Math.sin(time * (r > 0.05 ? 18 : 2)) * (0.15 + r * 0.5);
        arms[0].rotation.z = -0.25 - flap;
        arms[1].rotation.z = 0.25 + flap;
      } else {
        arms[0].rotation.x = -s * 0.8 * r;
        arms[1].rotation.x = s * 0.8 * r;
      }
      const hop = k === 'frog' || k === 'bunny' ? 0.12 : 0.07;
      body.position.y = 0.5 + Math.abs(Math.cos(stride)) * hop * r + Math.sin(time * 2.5) * 0.012 * (1 - r);
      body.rotation.x = r * 0.16;
      head.rotation.z = Math.sin(time * 1.3) * 0.05 * (1 - r);
      for (const e of ears) e.ear.rotation.z = e.rest + Math.sin(time * 3 + stride * 0.5 + e.side) * (0.05 + r * 0.15) * e.side;
      if (tail) tail.rotation.y = Math.sin(time * 4 + stride) * (0.2 + r * 0.3);
      return stride;
    },
    get stride() { return stride; },
    dispose() {
      group.traverse((o) => {
        if (o.isMesh) {
          o.geometry.dispose();
          o.material.dispose();
        }
      });
    }
  };
}

/**
 * Star-shop gear. `gear` is one id or several with spaces ('cap chain67 kicks67'), one per spot.
 * Head pieces go on the head group (center (0, 0), top about y 0.32); jerseys, chains, capes,
 * and wings on the body group (torso center about (0, -0.04), front about z 0.26); shoes on
 * each leg's hip (the foot sits at (0, -0.27, 0.05)).
 * Games may pass a cut-down THREE (Paint Sphere, Skybound): gear uses only spheres, cones,
 * tori, and capsules, which every buddy needs anyway. Numbers on jerseys and the 67 pieces
 * are drawn on a canvas only when that THREE has one; without it the shapes still show.
 */
const GOLD = '#f1c232';
const DARK = '#25303a';

function numberPlate(THREE, text, { fg = '#16382c', bg = '', size = 0.12 } = {}) {
  if (!THREE.CanvasTexture || !THREE.PlaneGeometry || typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 96;
  const g = c.getContext('2d');
  if (!g) return null;
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, 128, 96); }
  g.font = '900 78px "Arial Black", Impact, system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 8;
  g.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  g.strokeText(text, 64, 52);
  g.fillStyle = fg;
  g.fillText(text, 64, 52);
  const tex = new THREE.CanvasTexture(c);
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(size * 1.33, size), new THREE.MeshBasicMaterial({ map: tex, transparent: !bg }));
  return plate;
}

function addGear(THREE, rig, k, gear, std, sphere) {
  for (const id of gearList(gear)) {
    // One item that can't be built never takes the rest of the outfit with it.
    try {
      const piece = gearPiece(THREE, rig, k, id, std, sphere);
      if (piece) piece.name = `gear-${id}`;
    } catch (err) {
      console.warn(`Buddy gear ${id} skipped.`, err);
    }
  }
}

/** Builds one item, adds it to the right part of the rig, and returns its group. */
function gearPiece(THREE, rig, k, id, std, sphere) {
  const { head, body, legs } = rig;
  const frog = k === 'frog';
  const top = frog ? 0.26 : 0.31;
  const flat = (color) => new THREE.MeshBasicMaterial({ color });
  const cone = (r, h, mat, seg = 12) => new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat);
  const torus = (r, t, mat, arc = Math.PI * 2, seg = 24) => new THREE.Mesh(new THREE.TorusGeometry(r, t, 6, seg, arc), mat);
  const piece = new THREE.Group();
  const on = (part) => { part.add(piece); return piece; };
  // Eyes sit in different places on the frog and owl.
  const eyeY = frog ? 0.24 : 0.06;
  const eyeZ = frog ? 0.3 : (k === 'owl' ? 0.38 : 0.33);
  const eyeX = frog ? 0.17 : 0.13;
  const lensR = frog || k === 'owl' ? 0.12 : 0.085;
  // Where a grill goes: under the smile, the frog's wide mouth, or the beak.
  const mouth = { fox: [0, -0.15, 0.32, 0.05], bear: [0, -0.15, 0.32, 0.05], bunny: [0, -0.1, 0.32, 0.04],
    frog: [0, -0.05, 0.31, 0.09], owl: [0, -0.13, 0.32, 0.045], chick: [0, -0.1, 0.33, 0.045] }[k];

  switch (id) {
    case 'hat': {
      const c = cone(0.13, 0.3, std('#e2557a'), 16);
      c.position.y = 0.13;
      const pom = sphere(0.045, std('#f6d35b'), 1, 1, 1, 10);
      pom.position.y = 0.29;
      piece.add(c, pom);
      piece.position.set(0.04, top - 0.02, 0);
      piece.rotation.z = -0.18;
      return on(head);
    }
    case 'crown': {
      const gold = std(GOLD);
      const band = sphere(0.16, gold, 1, 0.32, 1, 18);
      band.position.y = 0.04;
      piece.add(band);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const point = cone(0.035, 0.08, gold, 6);
        point.position.set(Math.sin(a) * 0.14, 0.12, Math.cos(a) * 0.14);
        piece.add(point);
      }
      const jewel = sphere(0.03, std('#d9434f'), 1, 1, 0.6, 10);
      jewel.position.set(0, 0.04, 0.16);
      piece.add(jewel);
      piece.position.y = top - 0.03;
      return on(head);
    }
    case 'cap': {
      const red = std('#d9434f');
      const dome = sphere(0.3, red, frog ? 1.15 : 1, 0.5, 1, 20);
      const brim = sphere(0.15, red, 1, 0.14, 1.5, 14);
      brim.position.set(0, -0.02, -0.33);
      const button = sphere(0.03, std('#faf6ef'), 1, 1, 1, 8);
      button.position.y = 0.15;
      piece.add(dome, brim, button);
      piece.position.y = top - 0.14;
      return on(head);
    }
    case 'beanie': {
      const teal = std('#3aa39a');
      const dome = sphere(0.31, teal, frog ? 1.15 : 1, 0.6, 1, 20);
      const band = torus(0.3, 0.045, std('#2b7d76'));
      band.rotation.x = Math.PI / 2;
      band.scale.x = frog ? 1.15 : 1;
      const pom = sphere(0.07, std('#faf6ef'), 1, 1, 1, 12);
      pom.position.y = 0.2;
      piece.add(dome, band, pom);
      piece.position.y = top - 0.13;
      return on(head);
    }
    case 'cowboy': {
      const tan = std('#a8703f');
      const brim = sphere(0.43, tan, frog ? 1.2 : 1, 0.06, 1, 24);
      const crown = sphere(0.2, tan, 1, 0.75, 0.9, 16);
      crown.position.y = 0.09;
      const band = torus(0.185, 0.022, std('#5b3a1e'));
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.03;
      piece.add(brim, crown, band);
      piece.position.y = top - 0.04;
      piece.rotation.z = 0.08;
      return on(head);
    }
    case 'wizard': {
      const purple = std('#6a4bb5');
      const brim = sphere(0.3, purple, frog ? 1.2 : 1, 0.06, 1, 20);
      const c = cone(0.19, 0.48, purple, 16);
      c.position.y = 0.24;
      piece.add(brim, c);
      const star = std(GOLD);
      for (const [x, y, z] of [[0.08, 0.14, 0.12], [-0.05, 0.27, 0.08], [0.02, 0.38, 0.05]]) {
        const s = sphere(0.025, star, 1, 1, 0.6, 8);
        s.position.set(x, y, z);
        piece.add(s);
      }
      piece.position.y = top - 0.03;
      piece.rotation.z = -0.1;
      return on(head);
    }
    case 'phones': {
      const dark = std(DARK);
      const w = frog ? 0.43 : 0.36;
      const band = torus(w, 0.03, dark, Math.PI, 20);
      band.scale.y = frog ? 0.75 : 1.02;
      const pink = std('#e2557a');
      for (const side of [-1, 1]) {
        const cup = sphere(0.11, dark, 0.55, 1, 1, 14);
        cup.position.set(side * w, 0, 0);
        const pad = sphere(0.085, pink, 0.4, 0.9, 0.9, 12);
        pad.position.set(side * (w + 0.04), 0, 0);
        piece.add(cup, pad);
      }
      piece.add(band);
      piece.position.y = frog ? -0.02 : 0.02;
      return on(head);
    }
    case 'flower': {
      const petal = std('#f29ab7');
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const p = sphere(0.045, petal, 1, 1, 0.5, 10);
        p.position.set(Math.cos(a) * 0.055, Math.sin(a) * 0.055, 0);
        piece.add(p);
      }
      const middle = sphere(0.035, std('#f6d35b'), 1, 1, 0.6, 10);
      middle.position.z = 0.015;
      piece.add(middle);
      piece.position.set(-0.2, top - 0.06, 0.14);
      piece.rotation.y = -0.6;
      return on(head);
    }
    case 'shades':
    case 'starshades':
    case 'hearts': {
      const color = id === 'shades' ? DARK : id === 'hearts' ? '#e23b5a' : '#f29ab7';
      const lens = std(color);
      for (const side of [-1, 1]) {
        const at = new THREE.Group();
        at.position.set(side * eyeX, eyeY, eyeZ);
        if (id === 'shades') {
          at.add(sphere(lensR, lens, 1, 0.8, 0.3, 14));
        } else if (id === 'hearts') {
          // Two bumps and a point make a heart.
          for (const s of [-1, 1]) {
            const bump = sphere(lensR * 0.55, lens, 1, 1, 0.45, 12);
            bump.position.set(s * lensR * 0.42, lensR * 0.2, 0);
            at.add(bump);
          }
          const tip = cone(lensR * 0.78, lensR * 0.95, lens, 4);
          tip.rotation.z = Math.PI;
          tip.scale.z = 0.4;
          tip.position.y = -lensR * 0.35;
          at.add(tip);
        } else {
          at.add(sphere(lensR * 0.62, lens, 1, 1, 0.35, 12));
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            const ray = cone(lensR * 0.28, lensR * 0.55, lens, 4);
            ray.scale.z = 0.4;
            ray.position.set(Math.sin(a) * lensR * 0.75, Math.cos(a) * lensR * 0.75, 0);
            ray.rotation.z = -a;
            at.add(ray);
          }
        }
        piece.add(at);
      }
      const bridge = sphere(0.5, std(id === 'shades' ? DARK : GOLD), eyeX * 2 - lensR * 1.6, 0.025, 0.025, 8);
      bridge.position.set(0, eyeY + 0.02, eyeZ);
      piece.add(bridge);
      return on(head);
    }
    case 'grillz':
    case 'icegrillz':
    case 'rainbowgrillz': {
      const [x, y, z, spread] = mouth;
      const shine = std(id === 'grillz' ? GOLD : id === 'icegrillz' ? '#cfeeff' : '#f7f7f2', 0.2);
      const rainbow = ['#e8414b', '#f39a2b', '#f6d35b', '#4bbf6b', '#3f8fe0'];
      const band = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, spread * 2, 4, 8), shine);
      band.rotation.z = Math.PI / 2;
      piece.add(band);
      for (let i = 0; i < 5; i++) {
        const tooth = sphere(0.02, id === 'rainbowgrillz' ? std(rainbow[i], 0.2) : shine, 1, 1.3, 0.8, 8);
        tooth.position.set(-spread + (i / 4) * spread * 2, -0.012, 0.012);
        piece.add(tooth);
      }
      if (id === 'icegrillz') {
        const glint = sphere(0.012, flat('#ffffff'), 1, 1, 1, 6);
        glint.position.set(spread * 0.5, 0.012, 0.025);
        piece.add(glint);
      }
      piece.position.set(x, y, z);
      return on(head);
    }
    case 'bowtie': {
      const red = std('#d9434f');
      for (const side of [-1, 1]) {
        const wing = cone(0.06, 0.1, red, 4);
        wing.rotation.z = side * Math.PI / 2;
        wing.scale.z = 0.5;
        wing.position.x = side * 0.05;
        piece.add(wing);
      }
      piece.add(sphere(0.025, red, 1, 1, 0.7, 8));
      piece.position.set(0, 0.12, frog ? 0.24 : 0.25);
      return on(body);
    }
    case 'chain':
    case 'chain67':
    case 'icechain': {
      const gold = std(id === 'icechain' ? '#dfe7ee' : GOLD, 0.25);
      const links = torus(0.17, 0.02, gold, Math.PI, 18);
      links.rotation.z = Math.PI;
      links.rotation.x = -0.35;
      piece.add(links);
      const z = 0.05;
      if (id === 'icechain') {
        const gem = sphere(0.07, std('#5ad1ff', 0.1), 1, 1.15, 0.5, 6);
        gem.position.set(0, -0.21, z);
        const glint = sphere(0.018, flat('#ffffff'), 1, 1, 1, 6);
        glint.position.set(0.025, -0.18, z + 0.03);
        piece.add(gem, glint);
      } else if (id === 'chain') {
        const coin = sphere(0.055, gold, 1, 1, 0.3, 14);
        coin.position.set(0, -0.2, z);
        const dot = sphere(0.02, std('#d9434f'), 1, 1, 0.6, 8);
        dot.position.set(0, -0.2, z + 0.018);
        piece.add(coin, dot);
      } else {
        const tag = sphere(0.085, gold, 1.25, 0.95, 0.25, 16);
        tag.position.set(0, -0.21, z);
        piece.add(tag);
        const text = numberPlate(THREE, '67', { fg: '#7a4c00', size: 0.11 });
        if (text) {
          text.position.set(0, -0.21, z + 0.03);
          piece.add(text);
        }
      }
      piece.position.set(0, 0.12, 0.2);
      return on(body);
    }
    case 'jersey10':
    case 'jersey7':
    case 'jersey23': {
      const ten = id === 'jersey10';
      const hoops = id === 'jersey23';
      const main = std(ten ? '#79b8e3' : hoops ? '#ce1141' : '#c8102e');
      const shirt = sphere(0.305, main, 1.02, 0.9, 1.0, 22);
      shirt.position.y = -0.04;
      piece.add(shirt);
      if (ten) {
        const white = std('#f7f7f2');
        for (const x of [-0.13, 0.13]) {
          const stripe = sphere(0.306, white, 0.16, 0.9, 1.0, 16);
          stripe.position.set(x, -0.04, 0.002);
          piece.add(stripe);
        }
      } else {
        const green = std(hoops ? '#111111' : '#046a38');
        const hem = torus(0.25, 0.03, green);
        hem.rotation.x = Math.PI / 2;
        hem.position.y = -0.22;
        piece.add(hem);
      }
      const collar = torus(0.12, 0.025, std(ten ? '#f7f7f2' : hoops ? '#111111' : '#046a38'));
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 0.2;
      piece.add(collar);
      const number = ten ? '10' : hoops ? '23' : '7';
      const ink = ten ? '#16233a' : hoops ? '#ffffff' : GOLD;
      const back = numberPlate(THREE, number, { fg: ink, size: 0.2 });
      if (back) {
        back.position.set(0, -0.02, -0.31);
        back.rotation.y = Math.PI;
        piece.add(back);
      }
      const front = numberPlate(THREE, number, { fg: ink, size: 0.09 });
      if (front) {
        front.position.set(0.12, 0.06, 0.29);
        front.rotation.y = 0.35;
        piece.add(front);
      }
      return on(body);
    }
    case 'cape': {
      const cape = sphere(0.3, std('#d9434f'), 0.95, 1.15, 0.12, 18);
      cape.position.set(0, -0.12, -0.27);
      cape.rotation.x = 0.18;
      const clasp = sphere(0.035, std(GOLD), 1, 1, 0.6, 8);
      clasp.position.set(0, 0.18, 0.18);
      piece.add(cape, clasp);
      return on(body);
    }
    case 'wings': {
      const wing = std('#cdb8f2');
      for (const side of [-1, 1]) {
        const big = sphere(0.2, wing, 0.55, 1, 0.08, 14);
        big.position.set(side * 0.2, 0.06, -0.28);
        big.rotation.z = side * -0.6;
        const small = sphere(0.13, wing, 0.55, 1, 0.08, 12);
        small.position.set(side * 0.17, -0.16, -0.27);
        small.rotation.z = side * -2.2;
        piece.add(big, small);
      }
      return on(body);
    }
    case 'boots':
    case 'lightups':
    case 'kicks67':
    case 'cleats':
    case 'slides':
    case 'skates': {
      const color = { boots: '#f2c230', lightups: '#f4f4f4', kicks67: '#f4f4f4', cleats: GOLD, slides: '#2a6ed1', skates: '#ff6fa8' }[id];
      const soleColor = { boots: '#9b7a10', lightups: '#41e1ff', kicks67: '#ff7a1a', cleats: '#7a5c10', slides: '#f4f4f4', skates: '#8a8f99' }[id];
      const shoeMat = std(color, id === 'cleats' ? 0.25 : 0.55);
      const soleMat = id === 'lightups' ? flat(soleColor) : std(soleColor);
      const long = frog ? 1.85 : 1.45;
      // A shoe on each foot: built for the left, then a copy for the right.
      const shoeFor = () => {
        const shoe = new THREE.Group();
        const upper = sphere(0.092, shoeMat, 1.05, 0.62, long, 14);
        const sole = sphere(0.095, soleMat, 1.08, 0.22, long + 0.05, 14);
        sole.position.y = -0.04;
        shoe.add(upper, sole);
        if (id === 'slides') {
          const sock = sphere(0.075, std('#f7f7f2'), 1, 1.1, 1, 12);
          sock.position.set(0, 0.06, -0.03);
          shoe.add(sock);
        }
        if (id === 'skates') {
          const wheel = std('#ffd84a', 0.4);
          for (const z of [-0.07, 0.07]) {
            for (const x of [-0.045, 0.045]) {
              const w = sphere(0.03, wheel, 0.6, 1, 1, 8);
              w.position.set(x, -0.08, z);
              shoe.add(w);
            }
          }
        }
        if (id === 'boots' || id === 'skates') {
          const shaft = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.1, 4, 10), shoeMat);
          shaft.position.set(0, 0.1, -0.03);
          shoe.add(shaft);
        }
        if (id === 'cleats') {
          for (const z of [-0.06, 0.06]) {
            const stud = cone(0.018, 0.035, soleMat, 6);
            stud.rotation.x = Math.PI;
            stud.position.set(0, -0.07, z);
            shoe.add(stud);
          }
        }
        if (id === 'kicks67' || id === 'lightups') {
          const stripe = sphere(0.05, soleMat, 0.2, 0.5, 1.6, 10);
          stripe.position.set(0.09, 0.005, 0);
          shoe.add(stripe);
        }
        shoe.position.set(0, -0.27, 0.05);
        return shoe;
      };
      legs.forEach((hip, i) => {
        const shoe = shoeFor();
        if (i === 0) piece.add(shoe);
        else {
          const other = new THREE.Group();
          other.name = `gear-${id}-right`;
          other.add(shoe);
          hip.add(other);
        }
      });
      if (id === 'kicks67') {
        const text = numberPlate(THREE, '67', { fg: '#ff7a1a', size: 0.06 });
        if (text) {
          text.position.set(0.1, -0.26, 0.06);
          text.rotation.y = Math.PI / 2;
          piece.add(text);
        }
      }
      return on(legs[0]);
    }
    case 'chef': {
      const white = std('#fbfbf7');
      const band = sphere(0.17, white, frog ? 1.15 : 1, 0.45, 1, 18);
      piece.add(band);
      for (const [x, z] of [[0, 0], [0.09, 0.05], [-0.09, 0.05], [0.07, -0.08], [-0.07, -0.08]]) {
        const puff = sphere(0.11, white, 1, 0.85, 1, 12);
        puff.position.set(x, 0.17, z);
        piece.add(puff);
      }
      piece.position.y = top - 0.02;
      return on(head);
    }
    case 'pirate': {
      const black = std('#22252b');
      const brim = sphere(0.36, black, frog ? 1.4 : 1.2, 0.09, 0.7, 20);
      const crown = sphere(0.21, black, 1, 0.75, 0.85, 16);
      crown.position.y = 0.07;
      const band = torus(0.2, 0.018, std(GOLD, 0.3));
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.02;
      const skull = sphere(0.045, flat('#f7f7f2'), 1, 0.9, 0.4, 10);
      skull.position.set(0, 0.1, 0.18);
      piece.add(brim, crown, band, skull);
      piece.position.y = top - 0.03;
      return on(head);
    }
    case 'halo': {
      const ring = torus(0.17, 0.028, flat('#ffd84a'), Math.PI * 2, 28);
      ring.rotation.x = Math.PI / 2;
      piece.add(ring);
      piece.position.y = top + 0.12;
      return on(head);
    }
    case 'roundies':
    case 'pixel': {
      const pixel = id === 'pixel';
      const mat = std(pixel ? '#111111' : GOLD, 0.3);
      for (const side of [-1, 1]) {
        if (pixel) {
          const lens = sphere(lensR * 1.05, mat, 1.15, 0.6, 0.3, 4);
          lens.rotation.z = Math.PI / 4;
          lens.position.set(side * eyeX, eyeY - 0.005, eyeZ + 0.01);
          piece.add(lens);
        } else {
          const rim = torus(lensR * 0.95, 0.012, mat, Math.PI * 2, 20);
          rim.position.set(side * eyeX, eyeY, eyeZ + 0.01);
          piece.add(rim);
        }
      }
      const bar = new THREE.Mesh(new THREE.CapsuleGeometry(pixel ? 0.028 : 0.01, eyeX * 2 + (pixel ? lensR * 1.4 : 0), 4, 8), mat);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, eyeY + (pixel ? 0.03 : 0.015), eyeZ + 0.012);
      piece.add(bar);
      return on(head);
    }
    case 'mustache': {
      const [x, y, z] = mouth;
      const brown = std('#5b3a1e');
      for (const side of [-1, 1]) {
        const half = sphere(0.05, brown, 1.35, 0.55, 0.6, 10);
        half.position.set(side * 0.05, 0, 0);
        half.rotation.z = side * 0.25;
        const curl = sphere(0.025, brown, 1, 1, 0.8, 8);
        curl.position.set(side * 0.11, 0.025, 0);
        piece.add(half, curl);
      }
      piece.position.set(x, y + 0.045, z + 0.015);
      return on(head);
    }
    case 'scarf': {
      const red = std('#d9434f');
      const ring = torus(0.15, 0.055, red);
      ring.rotation.x = Math.PI / 2;
      const stripe = torus(0.15, 0.057, std('#f7f7f2'), Math.PI * 2, 24);
      stripe.rotation.x = Math.PI / 2;
      stripe.scale.z = 0.35;
      const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.14, 4, 8), red);
      tail.position.set(0.08, -0.1, 0.17);
      tail.rotation.z = 0.15;
      piece.add(ring, stripe, tail);
      piece.position.set(0, 0.19, 0.02);
      return on(body);
    }
    case 'medal': {
      const ribbon = torus(0.16, 0.022, std('#3f6fd1'), Math.PI, 18);
      ribbon.rotation.z = Math.PI;
      ribbon.rotation.x = -0.35;
      const disk = sphere(0.065, std(GOLD, 0.25), 1, 1, 0.3, 16);
      disk.position.set(0, -0.2, 0.05);
      piece.add(ribbon, disk);
      const one = numberPlate(THREE, '1', { fg: '#7a4c00', size: 0.08 });
      if (one) {
        one.position.set(0, -0.2, 0.075);
        piece.add(one);
      }
      piece.position.set(0, 0.12, 0.2);
      return on(body);
    }
    case 'hoodie': {
      const purple = std('#7d5bbf');
      const shirt = sphere(0.305, purple, 1.02, 0.9, 1.0, 22);
      shirt.position.y = -0.04;
      const hood = sphere(0.19, purple, 1.3, 0.6, 0.75, 14);
      hood.position.set(0, 0.2, -0.2);
      const pocket = sphere(0.12, std('#5f4396'), 1.35, 0.5, 0.25, 12);
      pocket.position.set(0, -0.12, 0.27);
      piece.add(shirt, hood, pocket);
      for (const side of [-1, 1]) {
        const string = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.08, 3, 6), std('#f7f7f2'));
        string.position.set(side * 0.05, 0.1, 0.28);
        piece.add(string);
      }
      return on(body);
    }
    case 'backpack': {
      const orange = std('#f08a24');
      const bag = sphere(0.2, orange, 1, 1.1, 0.55, 16);
      bag.position.set(0, -0.03, -0.3);
      const pocket = sphere(0.11, std('#d06f12'), 1.1, 0.8, 0.4, 12);
      pocket.position.set(0, -0.1, -0.39);
      piece.add(bag, pocket);
      for (const side of [-1, 1]) {
        const strap = torus(0.17, 0.018, std('#8a4a10'), Math.PI, 14);
        strap.rotation.y = Math.PI / 2;
        strap.position.set(side * 0.13, 0.02, -0.02);
        piece.add(strap);
      }
      return on(body);
    }
    case 'dragonwings': {
      const green = std('#4caf50');
      const dark = std('#2e7d32');
      for (const side of [-1, 1]) {
        const wing = sphere(0.24, green, 0.6, 1, 0.08, 14);
        wing.position.set(side * 0.26, 0.1, -0.28);
        wing.rotation.z = side * -0.85;
        const claw = cone(0.03, 0.09, dark, 6);
        claw.position.set(side * 0.43, 0.28, -0.28);
        claw.rotation.z = side * -0.85;
        piece.add(wing, claw);
        for (const t of [0.35, 0.65]) {
          const rib = sphere(0.2, dark, 0.06, 1, 0.1, 8);
          rib.position.set(side * (0.12 + t * 0.2), 0.02 + t * 0.12, -0.27);
          rib.rotation.z = side * -0.85;
          piece.add(rib);
        }
      }
      return on(body);
    }
    case 'starpin':
    case 'butterfly': {
      if (id === 'starpin') {
        const gold = std(GOLD, 0.25);
        piece.add(sphere(0.035, gold, 1, 1, 0.6, 10));
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const ray = cone(0.03, 0.06, gold, 4);
          ray.scale.z = 0.4;
          ray.position.set(Math.sin(a) * 0.05, Math.cos(a) * 0.05, 0);
          ray.rotation.z = -a;
          piece.add(ray);
        }
      } else {
        const blue = std('#3f9fe8');
        for (const side of [-1, 1]) {
          const upper = sphere(0.05, blue, 1, 1.2, 0.3, 10);
          upper.position.set(side * 0.045, 0.025, 0);
          const lower = sphere(0.035, std('#7cc4f5'), 1, 1, 0.3, 8);
          lower.position.set(side * 0.035, -0.04, 0);
          piece.add(upper, lower);
        }
        piece.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.08, 3, 6), std(DARK)));
      }
      piece.position.set(-0.2, top - 0.06, 0.14);
      piece.rotation.y = -0.6;
      return on(head);
    }
    default:
      return null;
  }
}

/**
 * The garden buddy inside a clear rolling ball, for 3D games whose player is a ball
 * (ADR 0001). The physics stays a sphere of `radius`; only the look changes.
 *
 *   const ball = makeBuddyBall(THREE, buddyKind(msg.buddy), MARBLE_R);
 *   scene.add(ball.group);                 // group origin is the ball center
 *   ball.roll(axis, angle);                // turn the shell the way the ball moves
 *   ball.animate(dt, vx, vz, time);        // buddy faces where it goes and runs inside
 *
 * Options: gear (as makeBuddy; left out, the learner's saved gear), tint (shell color),
 * material(color) for games with their own look.
 */
export function makeBuddyBall(THREE, kind = 'fox', radius = 0.5, opts = {}) {
  const k = BUDDY_LOOK[kind] ? kind : 'fox';
  const group = new THREE.Group();
  group.name = `buddy-ball-${k}`;

  // The buddy is about 1.2 tall; it stands inside with its feet near the bottom.
  const buddy = makeBuddy(THREE, k, { shadow: false, gear: opts.gear, material: opts.material });
  const fit = (radius * 1.55) / 1.2;
  buddy.group.scale.setScalar(fit);
  buddy.group.position.y = -radius * 0.8;
  group.add(buddy.group);

  // The shell spins; a band and a shine show the roll while the buddy stays upright.
  const shell = new THREE.Group();
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 20),
    new THREE.MeshStandardMaterial({
      color: opts.tint || BUDDY_LOOK[k].belly, roughness: 0.08, metalness: 0,
      transparent: true, opacity: 0.2, depthWrite: false
    })
  );
  glass.renderOrder = 3;
  // One thin light seam: enough to see the roll without hiding the buddy's face.
  const bandMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, transparent: true, opacity: 0.55, depthWrite: false });
  const band = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.995, radius * 0.025, 6, 48), bandMat);
  const shine = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.16, 12, 8),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 })
  );
  shine.scale.set(1, 0.6, 0.3);
  shine.position.set(-radius * 0.45, radius * 0.6, radius * 0.62);
  shell.add(glass, band);
  group.add(shell, shine);

  let face = 0;
  return {
    kind: k,
    group,
    shell,
    buddy,
    roll(axis, angle) {
      if (angle) shell.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, angle));
    },
    /** Turn the buddy toward its motion (x, z velocity) and run it at the ball's speed. */
    animate(dt, vx = 0, vz = 0, time = 0) {
      const speed = Math.hypot(vx, vz);
      if (speed > 0.05) {
        const want = Math.atan2(vx, vz);
        let d = want - face;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        face += d * Math.min(1, dt * 10);
        buddy.group.rotation.y = face;
      }
      buddy.animate(dt, Math.min(1, speed / 3), time);
    },
    dispose() {
      buddy.dispose();
      group.traverse((o) => {
        if (o.isMesh && !buddy.group.getObjectById(o.id)) {
          o.geometry.dispose();
          o.material.dispose();
        }
      });
    }
  };
}
