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
 * gear: star-shop gear ('hat', 'crown', ...); left out, the learner's own buddy wears
 * what they picked in the shop and any other buddy (a rival) wears nothing.
 */
import { BUDDY_LOOK, BUDDIES, buddyKind, savedBuddy, savedLook } from './buddy3d.mjs?v=ball3';

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

  // Feet take turns lifting while walking.
  const footLift = (side) => (step ? Math.max(0, side * lift) * 6 : 0);
  ellipse(ctx, -10, -4 - footLift(1), k === 'frog' ? 10 : 8, 4.5, c.limb);
  ellipse(ctx, 10, -4 - footLift(-1), k === 'frog' ? 10 : 8, 4.5, c.limb);

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
  if (gear) {
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(40, 30, 20, 0.28)';
    drawGear(ctx, k, gear);
  }
  ctx.restore();
}

/** Star-shop gear in drawBuddy's 100-unit space: head center (0, -58), top of head about -82. */
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
  } else if (gear === 'flower') {
    const cx = -17;
    const cy = top + 9;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ellipse(ctx, cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, 4.2, 4.2, '#f29ab7');
    }
    ellipse(ctx, cx, cy, 3.4, 3.4, '#f6d35b');
  } else if (gear === 'shades') {
    const big = frog || k === 'owl';
    const y = frog ? -72 : -61;
    const x = frog ? 14 : 10;
    const r = big ? 10 : 7.5;
    for (const s of [-1, 1]) ellipse(ctx, s * x, y, r, r * 0.8, '#25303a');
    ctx.beginPath();
    ctx.moveTo(-x + r * 0.8, y - 1.5);
    ctx.lineTo(x - r * 0.8, y - 1.5);
    ctx.strokeStyle = '#25303a';
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }
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
