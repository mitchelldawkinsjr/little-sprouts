/**
 * The learner's garden buddy drawn on a 2D canvas, front view, for canvas games.
 * Same buddies and colors as the home screen and lib/buddy3d.mjs (ADR 0001).
 *
 *   const kind = buddyKind(opts.buddy);
 *   drawBuddy(ctx, kind, x, feetY, height, { flip, step, squash, alpha });
 *
 * x is the center, feetY is where the feet touch the ground, height is head to toe.
 * step is a walk phase in radians (feet lift, wings flap); flip mirrors it to face left.
 * part: 'head' draws only the head, centered on (x, y), for games that keep their own body
 * (the dirt bike rider). Use buddyColors(kind) to color that body.
 * gear: star-shop gear ids with spaces ('cap chain67 kicks67'); left out, the learner's own buddy wears
 * what they picked in the shop and any other buddy (a rival) wears nothing.
 */
import { BUDDY_LOOK, BUDDIES, buddyKind, savedBuddy, savedLook } from './buddy3d.mjs?v=gear2';
import { gearItem, gearList } from '../logic/shop.mjs?v=shop3';

export { BUDDIES, buddyKind, savedBuddy };

// drawBuddy runs every frame, so the saved gear is read at most once a second.
let lookCache = { at: -Infinity, kind: '', gear: '' };
function savedGearFor(kind) {
  const now = Date.now();
  if (now - lookCache.at > 1000) lookCache = { at: now, ...savedLook() };
  return lookCache.kind === kind ? lookCache.gear : '';
}

/** { fur, body, belly, limb, nose, ... } for a buddy. */
export function buddyColors(kind) {
  return { ...(BUDDY_LOOK[kind] || BUDDY_LOOK.fox) };
}

function ellipse(ctx, x, y, rx, ry, fill, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.stroke();
}

function tri(ctx, pts, fill) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  ctx.lineTo(pts[2], pts[3]);
  ctx.lineTo(pts[4], pts[5]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.stroke();
}

export function drawBuddy(ctx, kind, x, y, height, opts = {}) {
  const k = BUDDY_LOOK[kind] ? kind : (savedBuddy() || 'fox');
  const c = BUDDY_LOOK[k];
  const { flip = false, step = 0, squash = 0, alpha = 1, shadow = true, part = 'all' } = opts;
  const gear = typeof opts.gear === 'string' ? opts.gear : savedGearFor(k);
  // The outfit by spot: { hat: 'cap', neck: 'chain67', ... }.
  const wear = {};
  for (const id of gearList(gear)) wear[gearItem(id).slot] = id;
  const headOnly = part === 'head';
  const u = height / 100;
  const lift = Math.sin(step);
  const bob = -Math.abs(lift) * 3 * (step ? 1 : 0);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -u : u, u * (1 - squash * 0.25));
  ctx.globalAlpha *= alpha;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(40, 30, 20, 0.28)';

  if (headOnly) ctx.translate(0, 56);
  if (shadow && !headOnly) {
    ctx.save();
    ctx.strokeStyle = 'transparent';
    ellipse(ctx, 0, 0, 22, 5, 'rgba(0, 0, 0, 0.18)');
    ctx.restore();
  }
  ctx.translate(0, bob);

  // Fox tail peeks out behind the body.
  if (!headOnly) {
  if (k === 'fox') {
    ellipse(ctx, 22, -20, 9, 16, c.fur, -0.9);
    ellipse(ctx, 30, -30, 5, 6, c.belly, -0.9);
  }

  if (wear.back) drawBack(ctx, wear.back);

  // Feet take turns lifting while walking.
  const footLift = (side) => (step ? Math.max(0, side * lift) * 6 : 0);
  ellipse(ctx, -10, -4 - footLift(1), k === 'frog' ? 10 : 8, 4.5, c.limb);
  ellipse(ctx, 10, -4 - footLift(-1), k === 'frog' ? 10 : 8, 4.5, c.limb);
  if (wear.feet) drawShoes(ctx, k, wear.feet, footLift(1), footLift(-1));

  // Arms or wings, behind the body.
  const winged = k === 'owl' || k === 'chick';
  if (winged) {
    const flap = step ? Math.sin(step * 2.5) * 0.5 : 0;
    ellipse(ctx, -21, -26, 7, 13, c.wing, 0.5 + flap);
    ellipse(ctx, 21, -26, 7, 13, c.wing, -0.5 - flap);
  } else {
    const swing = step ? lift * 4 : 0;
    ellipse(ctx, -21, -27 + swing, 5.5, 9, c.limb, 0.4);
    ellipse(ctx, 21, -27 - swing, 5.5, 9, c.limb, -0.4);
  }

  // Body and tummy.
  ellipse(ctx, 0, -24, 21, 19, c.body);
  ctx.save();
  ctx.strokeStyle = 'transparent';
  ellipse(ctx, 0, -21, 12, 11, c.belly);
  ctx.restore();
  if (wear.body) drawJersey(ctx, wear.body);
  if (wear.neck) drawNeck(ctx, wear.neck);
  }

  // Ears behind the head.
  if (k === 'fox') {
    tri(ctx, [-24, -66, -8, -74, -21, -90], c.fur);
    tri(ctx, [24, -66, 8, -74, 21, -90], c.fur);
    ctx.save();
    ctx.strokeStyle = 'transparent';
    tri(ctx, [-19, -71, -12, -74, -18, -83], c.inner);
    tri(ctx, [19, -71, 12, -74, 18, -83], c.inner);
    ctx.restore();
  } else if (k === 'bear') {
    ellipse(ctx, -19, -77, 9, 9, c.fur);
    ellipse(ctx, 19, -77, 9, 9, c.fur);
    ellipse(ctx, -19, -77, 4.5, 4.5, c.inner);
    ellipse(ctx, 19, -77, 4.5, 4.5, c.inner);
  } else if (k === 'bunny') {
    ellipse(ctx, -9, -92, 6.5, 18, c.fur, -0.12);
    ellipse(ctx, 9, -92, 6.5, 18, c.fur, 0.12);
    ctx.save();
    ctx.strokeStyle = 'transparent';
    ellipse(ctx, -9, -91, 3, 12, c.inner, -0.12);
    ellipse(ctx, 9, -91, 3, 12, c.inner, 0.12);
    ctx.restore();
  } else if (k === 'owl') {
    tri(ctx, [-22, -70, -10, -76, -21, -86], c.fur);
    tri(ctx, [22, -70, 10, -76, 21, -86], c.fur);
  } else if (k === 'chick') {
    ellipse(ctx, 0, -84, 3.5, 6, c.nose);
  }

  // Head.
  if (k === 'frog') ellipse(ctx, 0, -55, 31, 20, c.fur);
  else ellipse(ctx, 0, -58, 26, 24, c.fur);

  // Eyes.
  if (k === 'frog') {
    for (const s of [-1, 1]) {
      ellipse(ctx, s * 14, -72, 9.5, 9.5, c.rim);
      ellipse(ctx, s * 14, -72, 7, 7, '#f7f4ea');
      ellipse(ctx, s * 14, -71, 3.5, 3.5, c.eye);
    }
  } else if (k === 'owl') {
    for (const s of [-1, 1]) {
      ellipse(ctx, s * 10, -61, 8.5, 8.5, '#f7f1e6');
      ellipse(ctx, s * 10, -61, 4, 4, c.eye);
    }
  } else {
    ctx.save();
    ctx.strokeStyle = 'transparent';
    for (const s of [-1, 1]) {
      ellipse(ctx, s * 10, -61, 3.2, 3.8, c.eye);
      ellipse(ctx, s * 10 + 1, -62.5, 1.1, 1.1, '#ffffff');
    }
    ctx.restore();
  }

  // Cheeks.
  if (k !== 'owl') {
    ctx.save();
    ctx.strokeStyle = 'transparent';
    ctx.globalAlpha *= 0.7;
    ellipse(ctx, -17, -50, 4, 2.8, '#f2a0a0');
    ellipse(ctx, 17, -50, 4, 2.8, '#f2a0a0');
    ctx.restore();
  }

  // Nose, snout, beak, or smile.
  ctx.save();
  ctx.strokeStyle = 'transparent';
  if (k === 'fox') {
    ellipse(ctx, 0, -50, 9, 6, c.belly);
    ellipse(ctx, 0, -53, 3.5, 2.6, c.nose);
  } else if (k === 'bear') {
    ellipse(ctx, 0, -50, 10, 7, c.snout);
    ellipse(ctx, 0, -53, 3.6, 2.8, c.nose);
  } else if (k === 'bunny') {
    ellipse(ctx, 0, -53, 3, 2.2, c.nose);
  } else if (k === 'owl') {
    tri(ctx, [-4, -55, 4, -55, 0, -47], c.nose);
  } else if (k === 'chick') {
    tri(ctx, [-5, -54, 5, -54, 0, -47], c.nose);
  }
  ctx.restore();
  if (k === 'frog' || k === 'fox' || k === 'bear' || k === 'bunny') {
    ctx.beginPath();
    const mouthY = k === 'frog' ? -52 : -48;
    const mouthR = k === 'frog' ? 9 : 3.5;
    ctx.arc(0, mouthY, mouthR, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.strokeStyle = k === 'frog' ? c.nose : 'rgba(40, 30, 20, 0.7)';
    ctx.lineWidth = k === 'frog' ? 2.2 : 1.4;
    ctx.stroke();
  }
  for (const slot of ['mouth', 'eyes', 'hat', 'pin']) {
    if (!wear[slot]) continue;
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(40, 30, 20, 0.28)';
    drawGear(ctx, k, wear[slot]);
  }
  ctx.restore();
}

const GOLD = '#f1c232';
const OUTLINE = 'rgba(40, 30, 20, 0.28)';

function label(ctx, text, x, y, size, fill, edge = 'rgba(0, 0, 0, 0.45)') {
  ctx.save();
  ctx.font = `900 ${size}px "Arial Black", Impact, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(1, size * 0.16);
  ctx.strokeStyle = edge;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Capes and wings, behind everything. */
function drawBack(ctx, id) {
  if (id === 'cape') {
    ctx.beginPath();
    ctx.moveTo(-17, -40);
    ctx.quadraticCurveTo(0, -44, 17, -40);
    ctx.lineTo(27, -4);
    ctx.quadraticCurveTo(0, 2, -27, -4);
    ctx.closePath();
    ctx.fillStyle = '#d9434f';
    ctx.fill();
    ctx.stroke();
  } else if (id === 'wings') {
    ctx.save();
    ctx.globalAlpha *= 0.85;
    for (const s of [-1, 1]) {
      ellipse(ctx, s * 30, -40, 10, 17, '#cdb8f2', s * 0.6);
      ellipse(ctx, s * 27, -18, 7, 11, '#cdb8f2', s * 2.3);
    }
    ctx.restore();
  } else if (id === 'backpack') {
    for (const s of [-1, 1]) ellipse(ctx, s * 19, -26, 7, 15, '#f08a24', s * 0.25);
  } else if (id === 'dragonwings') {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 12, -36);
      ctx.lineTo(s * 46, -58);
      ctx.lineTo(s * 42, -40);
      ctx.lineTo(s * 48, -30);
      ctx.lineTo(s * 38, -24);
      ctx.lineTo(s * 40, -12);
      ctx.lineTo(s * 14, -18);
      ctx.closePath();
      ctx.fillStyle = '#4caf50';
      ctx.fill();
      ctx.stroke();
      tri(ctx, [s * 44, -56, s * 50, -64, s * 47, -54], '#2e7d32');
    }
  }
}

/** Shoes over the feet; lifts follow the walk. */
function drawShoes(ctx, k, id, liftL, liftR) {
  const color = { boots: '#f2c230', lightups: '#f4f4f4', kicks67: '#f4f4f4', cleats: GOLD, slides: '#2a6ed1', skates: '#ff6fa8' }[id];
  const sole = { boots: '#9b7a10', lightups: '#41e1ff', kicks67: '#ff7a1a', cleats: '#7a5c10', slides: '#f4f4f4', skates: '#8a8f99' }[id];
  const w = k === 'frog' ? 11 : 9;
  for (const [x, up] of [[-10, liftL], [10, liftR]]) {
    const y = -4 - up;
    if (id === 'boots' || id === 'skates') ellipse(ctx, x, y - 6, 6.5, 7, color);
    if (id === 'slides') ellipse(ctx, x, y - 5, 6, 6, '#f7f7f2');
    ellipse(ctx, x, y, w, 5, color);
    ctx.save();
    ctx.strokeStyle = 'transparent';
    ellipse(ctx, x, y + 3.2, w, 1.9, sole);
    if (id === 'cleats') for (const dx of [-4, 0, 4]) ellipse(ctx, x + dx, y + 5, 1.1, 1.3, sole);
    if (id === 'skates') for (const dx of [-5, 5]) ellipse(ctx, x + dx, y + 6.5, 2.4, 2.4, '#ffd84a');
    if (id === 'lightups' || id === 'kicks67') ellipse(ctx, x, y - 0.5, w * 0.55, 1.2, sole);
    ctx.restore();
    if (id === 'kicks67') label(ctx, '67', x, y - 0.6, 5.5, '#ff7a1a', 'rgba(255, 255, 255, 0.9)');
  }
}

/** Jerseys over the body, with the number on the front. */
function drawJersey(ctx, id) {
  if (id === 'hoodie') {
    ellipse(ctx, 0, -42, 15, 5, '#5f4396');
    ellipse(ctx, 0, -24, 21.5, 19.5, '#7d5bbf');
    ctx.save();
    ctx.strokeStyle = 'rgba(40, 30, 20, 0.28)';
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(-7, -20);
    ctx.lineTo(7, -20);
    ctx.lineTo(10, -12);
    ctx.closePath();
    ctx.fillStyle = '#5f4396';
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#f7f7f2';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 4, -39);
      ctx.lineTo(s * 4, -31);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  const ten = id === 'jersey10';
  const hoops = id === 'jersey23';
  ctx.save();
  ellipse(ctx, 0, -24, 21.5, 19.5, ten ? '#79b8e3' : hoops ? '#ce1141' : '#c8102e');
  ctx.beginPath();
  ctx.ellipse(0, -24, 21.5, 19.5, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'transparent';
  if (ten) {
    ctx.fillStyle = '#f7f7f2';
    for (const x of [-15, -3, 9]) ctx.fillRect(x, -44, 6, 40);
  } else {
    ctx.fillStyle = hoops ? '#111111' : '#046a38';
    ctx.fillRect(-22, -10, 44, 6);
  }
  ctx.restore();
  // Collar.
  ctx.save();
  ctx.strokeStyle = 'transparent';
  ellipse(ctx, 0, -41, 8, 3, ten ? '#f7f7f2' : hoops ? '#111111' : '#046a38');
  ctx.restore();
  label(ctx, ten ? '10' : hoops ? '23' : '7', 0, -23, hoops ? 13 : 15, ten ? '#16233a' : hoops ? '#ffffff' : GOLD, ten ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.55)');
}

/** Chains and the bow tie, on the chest under the chin. */
function drawNeck(ctx, id) {
  if (id === 'bowtie') {
    tri(ctx, [0, -36, -9, -41, -9, -31], '#d9434f');
    tri(ctx, [0, -36, 9, -41, 9, -31], '#d9434f');
    ellipse(ctx, 0, -36, 2.6, 2.6, '#b8323e');
    return;
  }
  if (id === 'scarf') {
    ellipse(ctx, 0, -40, 17, 5, '#d9434f');
    ctx.save();
    ctx.strokeStyle = 'transparent';
    for (const x of [-9, 0, 9]) ellipse(ctx, x, -40, 2, 4.5, '#f7f7f2');
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(5, -38, 7, 16);
    ctx.fillStyle = '#d9434f';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }
  const ribbon = id === 'medal';
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-14, -40);
  ctx.quadraticCurveTo(0, -20, 14, -40);
  ctx.lineWidth = ribbon ? 4 : 3;
  ctx.strokeStyle = ribbon ? '#3f6fd1' : id === 'icechain' ? '#dfe7ee' : GOLD;
  if (!ribbon) ctx.setLineDash?.([2.6, 1.4]);
  ctx.stroke();
  ctx.setLineDash?.([]);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = OUTLINE;
  if (id === 'medal') {
    ellipse(ctx, 0, -26, 7, 7, GOLD);
    label(ctx, '1', 0, -25.5, 8, '#7a4c00', 'rgba(255, 246, 200, 0.9)');
  } else if (id === 'icechain') {
    tri(ctx, [-6, -30, 6, -30, 0, -20], '#5ad1ff');
    tri(ctx, [-6, -30, 6, -30, 0, -33], '#9fe6ff');
    ctx.strokeStyle = 'transparent';
    ellipse(ctx, 2, -29, 1.2, 1.2, '#ffffff');
  } else if (id === 'chain') {
    ellipse(ctx, 0, -27, 5, 5, GOLD);
    ellipse(ctx, 0, -27, 1.8, 1.8, '#d9434f');
  } else {
    ellipse(ctx, 0, -25.5, 9, 6.5, GOLD);
    label(ctx, '67', 0, -25.5, 9, '#7a4c00', 'rgba(255, 246, 200, 0.9)');
  }
  ctx.restore();
}

/** Head gear (hat, glasses, smile, pin) in drawBuddy's 100-unit space: head center (0, -58), top about -82. */
function drawGear(ctx, k, gear) {
  const frog = k === 'frog';
  const top = frog ? -75 : -82;
  if (gear === 'hat') {
    tri(ctx, [-14, top + 5, 14, top + 5, 4, top - 26], '#e2557a');
    ellipse(ctx, 4, top - 27, 4.5, 4.5, '#f6d35b');
  } else if (gear === 'crown') {
    ctx.beginPath();
    const base = top + 5;
    const peak = top - 13;
    ctx.moveTo(-17, base);
    ctx.lineTo(-17, peak);
    ctx.lineTo(-8.5, top - 3);
    ctx.lineTo(0, peak - 3);
    ctx.lineTo(8.5, top - 3);
    ctx.lineTo(17, peak);
    ctx.lineTo(17, base);
    ctx.closePath();
    ctx.fillStyle = '#f1c232';
    ctx.fill();
    ctx.stroke();
    ellipse(ctx, 0, top, 2.6, 2.6, '#d9434f');
  } else if (gear === 'chef') {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-12, top - 4, 24, 9);
    ctx.fillStyle = '#fbfbf7';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    for (const [dx, dy, r] of [[-8, -9, 8], [8, -9, 8], [0, -14, 9.5]]) ellipse(ctx, dx, top + dy, r, r, '#fbfbf7');
  } else if (gear === 'pirate') {
    ctx.beginPath();
    ctx.moveTo(frog ? -34 : -28, top + 6);
    ctx.quadraticCurveTo(0, top - 30, frog ? 34 : 28, top + 6);
    ctx.quadraticCurveTo(0, top - 2, frog ? -34 : -28, top + 6);
    ctx.fillStyle = '#22252b';
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.strokeStyle = 'transparent';
    ellipse(ctx, 0, top - 7, 3.6, 3.2, '#f7f7f2');
    ellipse(ctx, -1.3, top - 7.5, 0.9, 0.9, '#22252b');
    ellipse(ctx, 1.3, top - 7.5, 0.9, 0.9, '#22252b');
    ctx.restore();
  } else if (gear === 'halo') {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, top - 10, 16, 4.5, 0, 0, Math.PI * 2);
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = '#ffd84a';
    ctx.shadowColor = '#ffe98a';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.restore();
  } else if (gear === 'roundies' || gear === 'pixel') {
    const big = frog || k === 'owl';
    const y = frog ? -72 : -61;
    const x = frog ? 14 : 10;
    const r = big ? 10 : 7.5;
    ctx.save();
    if (gear === 'pixel') {
      ctx.strokeStyle = 'transparent';
      ctx.fillStyle = '#111111';
      const p = r / 3;
      ctx.fillRect(-x - r * 1.1, y - r * 0.8, (x + r * 1.1) * 2, p);
      for (const s of [-1, 1]) {
        ctx.fillRect(s * x - r, y - r * 0.8, r * 2, p * 2);
        ctx.fillRect(s * x - r + p, y - r * 0.8 + p * 2, r * 2 - p * 2, p);
      }
      ctx.fillStyle = '#ffffff';
      for (const s of [-1, 1]) ctx.fillRect(s * x - r + p, y - r * 0.8 + p * 0.5, p, p * 0.8);
    } else {
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = GOLD;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s * x, y, r * 0.95, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-x + r * 0.95, y - 1);
      ctx.lineTo(x - r * 0.95, y - 1);
      ctx.stroke();
    }
    ctx.restore();
  } else if (gear === 'mustache') {
    const beak = k === 'owl' || k === 'chick';
    const y = frog ? -53 : beak ? -48 : -49;
    for (const s of [-1, 1]) {
      ellipse(ctx, s * 5, y, 6, 2.8, '#5b3a1e', s * 0.25);
      ellipse(ctx, s * 10.5, y - 2, 2, 2, '#5b3a1e');
    }
  } else if (gear === 'starpin') {
    star(ctx, -17, top + 9, 7, 3.2, GOLD);
  } else if (gear === 'butterfly') {
    const cx = -17;
    const cy = top + 9;
    for (const s of [-1, 1]) {
      ellipse(ctx, cx + s * 5, cy - 2, 5, 6, '#3f9fe8', s * 0.4);
      ellipse(ctx, cx + s * 4, cy + 4.5, 3.4, 3.6, '#7cc4f5', s * -0.4);
    }
    ellipse(ctx, cx, cy, 1.4, 6, '#25303a');
  } else if (gear === 'flower') {
    const cx = -17;
    const cy = top + 9;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ellipse(ctx, cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, 4.2, 4.2, '#f29ab7');
    }
    ellipse(ctx, cx, cy, 3.4, 3.4, '#f6d35b');
  } else if (gear === 'shades' || gear === 'starshades' || gear === 'hearts') {
    const big = frog || k === 'owl';
    const y = frog ? -72 : -61;
    const x = frog ? 14 : 10;
    const r = big ? 10 : 7.5;
    const color = gear === 'shades' ? '#25303a' : gear === 'hearts' ? '#e23b5a' : '#f29ab7';
    for (const s of [-1, 1]) {
      if (gear === 'shades') ellipse(ctx, s * x, y, r, r * 0.8, color);
      else if (gear === 'hearts') heart(ctx, s * x, y, r * 1.1, color);
      else star(ctx, s * x, y, r * 1.15, r * 0.55, color);
    }
    ctx.beginPath();
    ctx.moveTo(-x + r * 0.8, y - 1.5);
    ctx.lineTo(x - r * 0.8, y - 1.5);
    ctx.strokeStyle = gear === 'shades' ? '#25303a' : GOLD;
    ctx.lineWidth = 2.4;
    ctx.stroke();
  } else if (gear === 'grillz' || gear === 'icegrillz' || gear === 'rainbowgrillz') {
    const beak = k === 'owl' || k === 'chick';
    const y = frog ? -50 : beak ? -45 : -46;
    const w = frog ? 9 : 5.5;
    const shine = gear === 'grillz' ? GOLD : gear === 'icegrillz' ? '#cfeeff' : '#f7f7f2';
    ctx.save();
    ctx.strokeStyle = 'rgba(40, 30, 20, 0.45)';
    ctx.lineWidth = 0.8;
    ellipse(ctx, 0, y, w, 2.6, shine);
    if (gear === 'rainbowgrillz') {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, y, w, 2.6, 0, 0, Math.PI * 2);
      ctx.clip();
      ['#e8414b', '#f6d35b', '#4bbf6b', '#3f8fe0'].forEach((fill, i) => {
        ctx.fillStyle = fill;
        ctx.fillRect(-w + (i / 4) * w * 2, y - 3, (w * 2) / 4, 6);
      });
      ctx.restore();
    }
    for (let i = 1; i < 4; i++) {
      const tx = -w + (i / 4) * w * 2;
      ctx.beginPath();
      ctx.moveTo(tx, y - 2.2);
      ctx.lineTo(tx, y + 2.2);
      ctx.stroke();
    }
    if (gear === 'icegrillz') {
      ctx.strokeStyle = 'transparent';
      ellipse(ctx, w * 0.45, y - 0.8, 1, 1, '#ffffff');
    }
    ctx.restore();
  } else if (gear === 'cap') {
    halfDome(ctx, 0, top + 9, frog ? 30 : 25, 14, '#d9434f');
    ellipse(ctx, 0, top - 4, 2.4, 2.4, '#faf6ef');
    ellipse(ctx, 0, top + 9, 10, 2.6, '#a8323c');
  } else if (gear === 'beanie') {
    halfDome(ctx, 0, top + 10, frog ? 31 : 26, 18, '#3aa39a');
    ctx.save();
    ctx.beginPath();
    ctx.rect(frog ? -31 : -26, top + 5, frog ? 62 : 52, 6);
    ctx.fillStyle = '#2b7d76';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ellipse(ctx, 0, top - 9, 5.5, 5.5, '#faf6ef');
  } else if (gear === 'cowboy') {
    ellipse(ctx, 0, top + 6, frog ? 42 : 36, 6, '#a8703f');
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-14, top + 5);
    ctx.lineTo(-13, top - 14);
    ctx.quadraticCurveTo(0, top - 8, 13, top - 14);
    ctx.lineTo(14, top + 5);
    ctx.closePath();
    ctx.fillStyle = '#a8703f';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'transparent';
    ctx.fillStyle = '#5b3a1e';
    ctx.fillRect(-14, top - 1, 28, 4);
    ctx.restore();
  } else if (gear === 'wizard') {
    ellipse(ctx, 0, top + 6, frog ? 32 : 27, 5, '#6a4bb5');
    tri(ctx, [-15, top + 5, 15, top + 5, 6, top - 36], '#6a4bb5');
    ctx.save();
    ctx.strokeStyle = 'transparent';
    star(ctx, -2, top - 6, 3.6, 1.6, GOLD);
    star(ctx, 5, top - 20, 2.8, 1.2, GOLD);
    ctx.restore();
  } else if (gear === 'phones') {
    const wx = frog ? 32 : 27;
    const cy = frog ? -55 : -58;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, cy, wx, frog ? 24 : 30, 0, Math.PI, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#25303a';
    ctx.stroke();
    ctx.restore();
    for (const s of [-1, 1]) {
      ellipse(ctx, s * wx, cy, 6, 10, '#25303a');
      ellipse(ctx, s * (wx + 2), cy, 3, 7, '#e2557a');
    }
  }
}

function halfDome(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.stroke();
}

function star(ctx, x, y, outer, inner, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? inner : outer;
    if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.stroke();
}

function heart(ctx, x, y, size, fill) {
  const s = size / 10;
  ctx.beginPath();
  ctx.moveTo(x, y + 7 * s);
  ctx.bezierCurveTo(x - 12 * s, y - 1 * s, x - 6 * s, y - 10 * s, x, y - 4 * s);
  ctx.bezierCurveTo(x + 6 * s, y - 10 * s, x + 12 * s, y - 1 * s, x, y + 7 * s);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.stroke();
}

/**
 * The garden buddy rolled up in a clear ball, for canvas games whose player is a ball
 * (ADR 0001). The physics stays a plain circle of radius r; only the look changes.
 *
 *   drawBuddyBall(ctx, kind, x, y, r, { spin, gear, alpha });
 *
 * x, y is the ball center. spin is the roll angle in radians (distance / r): the shell's
 * shine turns with it so rolling reads, while the buddy inside stays upright.
 */
export function drawBuddyBall(ctx, kind, x, y, r, opts = {}) {
  const { spin = 0, alpha = 1 } = opts;
  const k = BUDDY_LOOK[kind] ? kind : (savedBuddy() || 'fox');
  const c = BUDDY_LOOK[k];
  ctx.save();
  ctx.globalAlpha *= alpha;
  // Shell behind: a soft tint of the buddy's color so the ball still reads as a ball.
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = c.belly;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Buddy's head, upright, filling the ball. Ears and hats that reach the rim are clipped.
  const gear = typeof opts.gear === 'string' ? opts.gear : savedGearFor(k);
  drawBuddy(ctx, k, x, y + r * 0.12, r * 2, { part: 'head', shadow: false, gear });
  ctx.restore();
  // Shell in front: rim, a shine that turns as it rolls, and a band to show the spin.
  ctx.lineWidth = Math.max(1.5, r * 0.1);
  ctx.strokeStyle = c.limb;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = Math.max(1.5, r * 0.14);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, spin - 2.4, spin - 1.7);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, spin + 0.7, spin + 1.0);
  ctx.stroke();
  ctx.restore();
}
