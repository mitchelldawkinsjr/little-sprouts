/**
 * The child's Build your boss design, drawn flat on a 2D canvas for the 2D games (Garden chase).
 * Same parts as the 3D boss (lib/boss-model.mjs): any head on any body, with legs, color, eyes, a topper,
 * and a size. The head leads; the body pieces follow along `trail`, the path the head took, like a chain.
 * Plain canvas drawing, no three.js, so it costs nothing on a weak device.
 */

/** Main and dark shade for each color, the same numbers as lib/boss-model.mjs COLORS (a test keeps them matched). */
export const COLORS_2D = {
  green: ['#7fbf3f', '#5a9a2e'],
  purple: ['#8a63c4', '#5f3f93'],
  red: ['#e0564a', '#a83a33'],
  blue: ['#4f9bd9', '#336fa6'],
  orange: ['#f29a3a', '#c06f1d'],
  pink: ['#f08aa6', '#c45f7f'],
  gray: ['#8a9aa8', '#62717e'],
  teal: ['#3fb8a8', '#2a8a7d']
};

/** How big each size draws, against one maze cell. */
export const SIZE_2D = { 1: 0.85, 2: 1.05, 3: 1.3 };

/** Body pieces behind the head, and how big each is against the head. */
const BODY = {
  wiggly: { count: 3, size: 0.8 },
  round: { count: 1, size: 1.15 },
  long: { count: 5, size: 0.62 },
  finned: { count: 2, size: 0.78, tail: 'fin' },
  scaly: { count: 3, size: 0.74, tail: 'point' },
  none: { count: 0, size: 0 }
};

const INK = '#24332c';

/**
 * Draw the boss with its head at (x, y), facing `dir` ('left' | 'right' | 'up' | 'down').
 * `s` is one maze cell in pixels; `trail` is a list of [x, y] pixel points behind the head, nearest first.
 */
export function drawBoss2d(ctx, design, { x, y, s, dir = 'right', trail = [], tick = 0 }) {
  const [main, dark] = COLORS_2D[design.color] ?? COLORS_2D.green;
  const k = s * (SIZE_2D[design.size] ?? 1);
  const r = k * 0.42;
  const body = BODY[design.body] ?? BODY.wiggly;
  const wiggle = Math.sin(tick / 6);

  // Body pieces, farthest first so the head sits on top.
  const step = r * 2 * body.size * 0.62;
  const spots = [];
  for (let i = 1; i <= body.count; i++) spots.push(along(trail, x, y, step * i));
  for (let i = spots.length - 1; i >= 0; i--) {
    const [sx, sy] = spots[i];
    const pr = r * body.size * (1 - i * 0.04);
    if (design.legs === 'stubby' || design.legs === 'spider') {
      ctx.fillStyle = dark;
      for (const side of [-1, 1]) blob(ctx, sx + side * pr * 0.55, sy + pr * 0.75, pr * 0.28, pr * 0.2);
    }
    ctx.fillStyle = i % 2 ? dark : main;
    ctx.beginPath();
    ctx.arc(sx, sy, pr, 0, Math.PI * 2);
    ctx.fill();
    if (design.body === 'scaly') {
      ctx.fillStyle = dark;
      tri(ctx, sx, sy - pr * 1.25, pr * 0.32, pr * 0.4);
    }
  }
  if (body.tail && spots.length) {
    const [tx, ty] = spots[spots.length - 1];
    const [bx, by] = along(trail, x, y, step * (body.count + 0.9));
    const a = Math.atan2(by - ty, bx - tx);
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(a);
    ctx.fillStyle = dark;
    ctx.beginPath();
    if (body.tail === 'fin') { ctx.moveTo(-r * 0.4, 0); ctx.lineTo(r * 0.5, -r * 0.7); ctx.lineTo(r * 0.3, 0); ctx.lineTo(r * 0.5, r * 0.7); }
    else { ctx.moveTo(-r * 0.5, -r * 0.35); ctx.lineTo(r * 0.7, 0); ctx.lineTo(-r * 0.5, r * 0.35); }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // The head, drawn facing +x, turned to face its way (flipped, not turned, for left so it stays upright).
  ctx.save();
  ctx.translate(x, y);
  if (dir === 'left') ctx.scale(-1, 1);
  else if (dir === 'up') ctx.rotate(-Math.PI / 2);
  else if (dir === 'down') ctx.rotate(Math.PI / 2);

  if (design.legs === 'tentacles') {
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(2, r * 0.18);
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const off = (i - 1.5) * r * 0.32;
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, off);
      ctx.quadraticCurveTo(-r * 1.1, off + Math.sin(tick / 5 + i) * r * 0.35, -r * 1.6, off * 1.3);
      ctx.stroke();
    }
  }
  if (design.legs === 'spider') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.5, r * 0.09);
    for (let i = 0; i < 3; i++) {
      const lx = r * (0.45 - i * 0.45);
      const swing = Math.sin(tick / 4 + i) * r * 0.12;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx + swing, side * r * 1.15);
        ctx.lineTo(lx + swing - r * 0.2, side * r * 1.45);
        ctx.stroke();
      }
    }
  }
  if (design.legs === 'fins') {
    ctx.fillStyle = dark;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, side * r * 0.6);
      ctx.lineTo(-r * 0.75, side * r * (1.2 + wiggle * 0.1));
      ctx.lineTo(r * 0.25, side * r * 0.75);
      ctx.closePath();
      ctx.fill();
    }
  }
  if (design.legs === 'stubby' && body.count === 0) {
    ctx.fillStyle = dark;
    for (const side of [-1, 1]) blob(ctx, -r * 0.2, side * r * 0.85, r * 0.28, r * 0.2);
  }

  head(ctx, design.head, r, main, dark, tick);
  topper(ctx, design.extra, r, dark, tick);
  eyes(ctx, design.eyes, r, design.head);
  ctx.restore();
}

/** A point `dist` back along the trail from the head (the trail is drawn from the head backward). */
function along(trail, x, y, dist) {
  let px = x, py = y, left = dist;
  for (const [tx, ty] of trail) {
    const d = Math.hypot(tx - px, ty - py);
    if (d >= left && d > 0) return [px + (tx - px) * (left / d), py + (ty - py) * (left / d)];
    left -= d;
    px = tx;
    py = ty;
  }
  return [px - left, py];
}

function blob(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function tri(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y + h / 2);
  ctx.lineTo(x, y - h / 2);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.closePath();
  ctx.fill();
}

function teeth(ctx, x0, x1, y, size, up = false) {
  ctx.fillStyle = '#ffffff';
  for (let tx = x0; tx < x1 - size * 0.5; tx += size) {
    ctx.beginPath();
    ctx.moveTo(tx, y);
    ctx.lineTo(tx + size / 2, y + (up ? -size : size));
    ctx.lineTo(tx + size, y);
    ctx.closePath();
    ctx.fill();
  }
}

function head(ctx, kind, r, main, dark, tick) {
  const chomp = (Math.sin(tick / 5) + 1) * 0.5;
  ctx.fillStyle = main;
  ctx.beginPath();
  if (kind === 'shark') {
    ctx.moveTo(r * 1.35, r * 0.05);
    ctx.quadraticCurveTo(r * 0.9, -r * 0.85, -r * 0.6, -r * 0.7);
    ctx.quadraticCurveTo(-r * 1.0, 0, -r * 0.6, r * 0.7);
    ctx.quadraticCurveTo(r * 0.9, r * 0.8, r * 1.35, r * 0.05);
  } else if (kind === 'gator') {
    ctx.ellipse(-r * 0.15, 0, r * 0.8, r * 0.7, 0, 0, Math.PI * 2);
    ctx.rect(r * 0.2, -r * 0.32, r * 1.15, r * 0.64);
  } else if (kind === 'squid') {
    ctx.moveTo(r * 0.7, -r * 0.65);
    ctx.lineTo(-r * 1.4, 0);
    ctx.lineTo(r * 0.7, r * 0.65);
    ctx.arc(r * 0.45, 0, r * 0.7, Math.PI / 2, -Math.PI / 2, true);
  } else if (kind === 'octopus') {
    ctx.ellipse(0, -r * 0.05, r * 0.95, r * 0.88, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.fillStyle = dark;
  if (kind === 'spider') {
    ctx.beginPath();
    ctx.arc(-r * 0.25, 0, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    tri(ctx, r * 0.78, r * 0.32, r * 0.18, r * 0.34);
    tri(ctx, r * 0.78, -r * 0.32, r * 0.18, r * 0.34);
  } else if (kind === 'caterpillar') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.5, r * 0.1);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(r * 0.95, side * r * 0.35, r * 0.25, side > 0 ? Math.PI * 0.6 : Math.PI * 1.4, side > 0 ? Math.PI * (1.2 + chomp * 0.2) : Math.PI * (0.8 - chomp * 0.2), side < 0);
      ctx.stroke();
    }
  } else if (kind === 'shark') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.beginPath();
    ctx.moveTo(r * 0.3, r * 0.35);
    ctx.quadraticCurveTo(r * 0.85, r * 0.45, r * 1.15, r * 0.2);
    ctx.stroke();
    teeth(ctx, r * 0.35, r * 1.1, r * 0.33, r * 0.16);
  } else if (kind === 'gator') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.beginPath();
    ctx.moveTo(r * 0.2, r * 0.05);
    ctx.lineTo(r * 1.35, r * 0.05);
    ctx.stroke();
    teeth(ctx, r * 0.3, r * 1.3, r * 0.05, r * 0.15);
    teeth(ctx, r * 0.4, r * 1.3, r * 0.05, r * 0.15, true);
    ctx.fillStyle = dark;
    blob(ctx, r * 1.2, -r * 0.18, r * 0.06, r * 0.05);
  } else if (kind === 'octopus' || kind === 'squid') {
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 3; i++) blob(ctx, -r * 0.2 + i * r * 0.3, -r * 0.45 + (i % 2) * r * 0.2, r * 0.09, r * 0.09);
    ctx.globalAlpha = 1;
  }
}

function topper(ctx, extra, r, dark, tick) {
  if (extra === 'feelers') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    const sway = Math.sin(tick / 7) * r * 0.1;
    for (const off of [0.15, 0.5]) {
      ctx.beginPath();
      ctx.moveTo(r * off, -r * 0.75);
      ctx.quadraticCurveTo(r * (off + 0.2) + sway, -r * 1.35, r * (off + 0.35) + sway, -r * 1.45);
      ctx.stroke();
      ctx.fillStyle = dark;
      blob(ctx, r * (off + 0.35) + sway, -r * 1.45, r * 0.11, r * 0.11);
    }
  } else if (extra === 'horns') {
    ctx.fillStyle = '#f4ead2';
    tri(ctx, r * 0.05, -r * 0.95, r * 0.28, r * 0.5);
    tri(ctx, r * 0.5, -r * 0.88, r * 0.28, r * 0.5);
  } else if (extra === 'spikes') {
    ctx.fillStyle = dark;
    for (let i = 0; i < 3; i++) tri(ctx, -r * 0.5 + i * r * 0.45, -r * (0.9 - (i === 1 ? 0.05 : 0)), r * 0.3, r * 0.4);
  } else if (extra === 'fin') {
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.6);
    ctx.lineTo(-r * 0.25, -r * 1.55);
    ctx.lineTo(r * 0.45, -r * 0.62);
    ctx.closePath();
    ctx.fill();
  }
}

function eyes(ctx, count, r, kind) {
  const front = kind === 'gator' ? r * 0.05 : kind === 'shark' ? r * 0.55 : r * 0.35;
  const rows = count >= 6 ? [[-0.45, 3], [-0.05, 3]] : count >= 4 ? [[-0.45, 2], [-0.05, 2]] : [[-0.3, 2]];
  const er = r * (count >= 6 ? 0.13 : count >= 4 ? 0.16 : 0.2);
  for (const [yy, n] of rows) {
    for (let i = 0; i < n; i++) {
      const ex = front + (i - (n - 1) / 2) * er * 2.3 * 0.55;
      const ey = r * yy + (i - (n - 1) / 2) * er * 2.3 * 0.75;
      ctx.fillStyle = '#ffffff';
      blob(ctx, ex, ey, er, er);
      ctx.fillStyle = INK;
      blob(ctx, ex + er * 0.35, ey, er * 0.5, er * 0.5);
    }
  }
}
