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
 */
import { SPRITES, profileSprite } from '../logic/profiles.mjs?v=buddy1';

export const BUDDIES = SPRITES;

/** The active learner's buddy from this browser's saved Sprouts data. */
export function savedBuddy(storage = globalThis.localStorage) {
  try {
    const data = JSON.parse(storage?.getItem('sprouts-v1')) || {};
    const index = Math.max(0, data.active | 0);
    const profile = data.profiles?.[index];
    return profile ? profileSprite(profile, index) : '';
  } catch {
    return '';
  }
}

/** A buddy name from the host if it sent one, else the saved profile, else the fox. */
export function buddyKind(fromHost, storage) {
  if (SPRITES.includes(fromHost)) return fromHost;
  return savedBuddy(storage) || SPRITES[0];
}

const LOOK = {
  fox: { fur: '#e07a2f', body: '#e08a45', belly: '#f6e2cf', inner: '#f3c7a4', nose: '#6b3418', limb: '#9a4a1c', eye: '#244b3d' },
  bear: { fur: '#8b5a3c', body: '#8b5a3c', belly: '#e6c2a4', inner: '#c4896a', nose: '#3d2a22', snout: '#f0d2b8', limb: '#6e4630', eye: '#2c211c' },
  bunny: { fur: '#f7f1e6', body: '#f7f1e6', belly: '#ffffff', inner: '#f3b7c4', nose: '#e7a0b0', limb: '#e4d3c0', eye: '#244b3d' },
  frog: { fur: '#7daa45', body: '#6b9840', belly: '#c9dc8f', nose: '#c46a4a', limb: '#5d8a36', eye: '#244b3d', rim: '#4f6b38' },
  owl: { fur: '#8d6b45', body: '#a6845c', belly: '#d9c3a0', nose: '#e0a15a', limb: '#e0a15a', wing: '#7a5a38', eye: '#244b3d' },
  chick: { fur: '#f6d35b', body: '#f3c43a', belly: '#fbe7a0', nose: '#e07a2f', limb: '#e07a2f', wing: '#e7b72e', eye: '#244b3d' }
};

export function makeBuddy(THREE, kind = 'fox') {
  const k = LOOK[kind] ? kind : 'fox';
  const c = LOOK[k];
  const std = (color, roughness = 0.65) => new THREE.MeshStandardMaterial({ color, roughness });
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
  const body = new THREE.Group();
  body.position.y = 0.5;
  group.add(body);
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
    } else {
      const eye = sphere(0.05, M.eye, 1, 1.15, 1, 12);
      eye.position.set(side * 0.13, 0.06, 0.29);
      const glint = sphere(0.017, M.white, 1, 1, 1, 8);
      glint.position.set(side * 0.13 + 0.015, 0.085, 0.335);
      head.add(eye, glint);
    }
    if (k !== 'owl') {
      const blush = new THREE.Mesh(new THREE.CircleGeometry(0.045, 12), M.cheek);
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

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 24),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.25, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  let stride = 0;
  return {
    kind: k,
    group,
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
