/**
 * Light lines rules, kept free of three.js so they can be tested in node.
 *
 * The world is H units tall and W units wide (W follows the screen shape).
 * x runs right and y runs down, like the screen. The ball drops from a lamp near
 * the top and falls under gravity. It rolls on the lines the player draws, bounces
 * off dark walls, and comes to rest in one of the answer pockets along the bottom.
 *
 * Every solid is a capsule: a segment with a radius and a kind.
 *   wall   - dark stone, only seen where light reaches it
 *   plain  - a white line: an ordinary ramp
 *   boost  - a green line: speeds the ball up along it
 *   bouncy - a blue line: springs the ball back hard
 *   slow   - a yellow line: sticky, slows the ball down
 *   hazard - a red line, part of the level: touching it costs a life
 */

export const H = 100;
export const BALL_R = 2.3;
export const LINE_R = 1.0;
export const WALL_R = 1.2;
export const HAZARD_R = 1.1;
export const GRAVITY = 150;
export const MAX_SPEED = 160;
export const POCKET_DEPTH = 13;
export const MIN_SEG = 1.4;
export const LIVES = 3;

/** How each kind of solid treats the ball. */
export const KINDS = {
  wall: { bounce: 0.3, friction: 0.4 },
  plain: { bounce: 0.25, friction: 0.35 },
  boost: { bounce: 0.25, friction: 0, push: 140 },
  bouncy: { bounce: 0.95, friction: 0.2, spring: 55 },
  slow: { bounce: 0.05, friction: 7 },
  hazard: { bounce: 0.4, friction: 0.4 }
};

/** Inks the player can pick, in toolbar order. Red is never an ink: red is danger. */
export const INKS = ['plain', 'boost', 'bouncy', 'slow'];

export function worldWidth(aspect) {
  return H * Math.min(2.2, Math.max(0.62, aspect || 1));
}

/** Ink for one question: enough for a few ramps, not enough to wall everything off. */
export function inkFor(W) {
  return Math.round(W * 1.1 + 45);
}

export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seg = (ax, ay, bx, by, r, kind, extra) => ({ ax, ay, bx, by, r, kind, ...extra });

function segDist(px, py, s) {
  const bax = s.bx - s.ax;
  const bay = s.by - s.ay;
  const len2 = bax * bax + bay * bay;
  const h = len2 > 1e-9 ? Math.max(0, Math.min(1, ((px - s.ax) * bax + (py - s.ay) * bay) / len2)) : 0;
  const cx = s.ax + bax * h;
  const cy = s.ay + bay * h;
  return { d: Math.hypot(px - cx, py - cy), cx, cy };
}

/**
 * One question's board: rim walls, pocket dividers, dark bars and red hazard lines in
 * the middle, and the drop lamp. Harder steps add more bars and hazards.
 */
export function makeLevel(seed, count, step = 0, W = H) {
  const rnd = rng(seed);
  const walls = [
    seg(0, 0, 0, H, WALL_R, 'wall', { rim: true }),
    seg(W, 0, W, H, WALL_R, 'wall', { rim: true }),
    seg(0, H, W, H, WALL_R, 'wall', { rim: true }),
    seg(0, 0, W, 0, WALL_R, 'wall', { rim: true })
  ];
  const pw = W / count;
  const top = H - POCKET_DEPTH;
  const pockets = [];
  for (let i = 0; i < count; i++) pockets.push({ index: i, x0: i * pw, x1: (i + 1) * pw, cx: (i + 0.5) * pw, top });
  for (let i = 1; i < count; i++) walls.push(seg(i * pw, top, i * pw, H, WALL_R, 'wall', { divider: true }));

  const dropper = { x: W * (0.2 + rnd() * 0.6), y: 9 };
  const scale = Math.min(1, W / 110);
  const bars = Math.min(5, 2 + Math.floor(step / 2)) + (W > 150 ? 1 : 0);
  const hazards = Math.min(3, 1 + Math.floor(step / 2));
  const placed = [];
  const tryPlace = (kind, minLen, maxLen) => {
    for (let tries = 0; tries < 60; tries++) {
      const len = (minLen + rnd() * (maxLen - minLen)) * Math.max(0.7, scale);
      const cx = 8 + len / 2 + rnd() * Math.max(1, W - 16 - len);
      const cy = 28 + rnd() * (top - 14 - 28);
      const ang = (rnd() < 0.5 ? -1 : 1) * (kind === 'hazard' ? rnd() * 0.5 : 0.25 + rnd() * 0.4);
      const far = placed.every(p => Math.hypot(p.cx - cx, p.cy - cy) > (p.len + len) * 0.45 + 7);
      // Keep a clear column under the lamp for the first few units of fall.
      const lampClear = Math.abs(cx - dropper.x) > len / 2 + 4 || cy > 40;
      if (!far || !lampClear) continue;
      const dx = Math.cos(ang) * len / 2;
      const dy = Math.sin(ang) * len / 2;
      placed.push({ cx, cy, len });
      return seg(cx - dx, cy - dy, cx + dx, cy + dy, kind === 'hazard' ? HAZARD_R : WALL_R * 1.4, kind);
    }
    return null;
  };
  for (let i = 0; i < bars; i++) { const s = tryPlace('wall', 12, 22); if (s) walls.push(s); }
  for (let i = 0; i < hazards; i++) { const s = tryPlace('hazard', 8, 16); if (s) walls.push(s); }

  const level = { seed, W, H, walls, pockets, dropper, closed: new Set() };
  level.freeFall = simulateDrop(level, []).pocket;
  return level;
}

/** Capsules for one stroke: { kind, pts: [{x, y}] }. */
export function strokeSegments(stroke) {
  const out = [];
  const pts = stroke.pts;
  if (pts.length === 1) out.push(seg(pts[0].x, pts[0].y, pts[0].x, pts[0].y, LINE_R, stroke.kind));
  for (let i = 1; i < pts.length; i++) out.push(seg(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, LINE_R, stroke.kind));
  return out;
}

/** A peaked lid over a closed pocket, so the ball rolls off it to a neighbor. */
export function lidSegments(pocket) {
  const peak = pocket.top - 4;
  return [
    seg(pocket.x0, pocket.top, pocket.cx, peak, WALL_R, 'wall', { lid: true }),
    seg(pocket.cx, peak, pocket.x1, pocket.top, WALL_R, 'wall', { lid: true })
  ];
}

/** Everything the ball can touch right now. */
export function solids(level, strokes) {
  const out = [...level.walls];
  for (const p of level.pockets) if (level.closed.has(p.index)) out.push(...lidSegments(p));
  for (const s of strokes) out.push(...strokeSegments(s));
  return out;
}

export function strokeLength(stroke) {
  let len = 0;
  for (let i = 1; i < stroke.pts.length; i++) len += Math.hypot(stroke.pts[i].x - stroke.pts[i - 1].x, stroke.pts[i].y - stroke.pts[i - 1].y);
  return len;
}

/**
 * Extend a stroke toward a point, spending ink. Points closer than MIN_SEG are skipped
 * so a slow finger doesn't make hundreds of tiny segments. Returns the ink spent.
 */
export function extendStroke(stroke, x, y, inkLeft, W = H) {
  x = Math.max(0, Math.min(W, x));
  y = Math.max(0, Math.min(H, y));
  const last = stroke.pts[stroke.pts.length - 1];
  if (!last) { stroke.pts.push({ x, y }); return 0; }
  let d = Math.hypot(x - last.x, y - last.y);
  if (d < MIN_SEG || inkLeft <= 0) return 0;
  if (d > inkLeft) {
    const k = inkLeft / d;
    x = last.x + (x - last.x) * k;
    y = last.y + (y - last.y) * k;
    d = inkLeft;
  }
  stroke.pts.push({ x, y });
  return d;
}

/**
 * Advance the ball by dt seconds against the solids. Returns what happened:
 * { hit: hardest impact speed, hazard: touched a red line, kinds: Set of kinds touched }.
 */
export function stepBall(ball, list, dt) {
  const n = Math.max(1, Math.ceil(dt / (1 / 480)));
  const h = dt / n;
  const out = { hit: 0, hazard: false, kinds: new Set() };
  for (let s = 0; s < n; s++) {
    ball.vy += GRAVITY * h;
    let sp = Math.hypot(ball.vx, ball.vy);
    if (sp > MAX_SPEED) { ball.vx *= MAX_SPEED / sp; ball.vy *= MAX_SPEED / sp; }
    ball.x += ball.vx * h;
    ball.y += ball.vy * h;
    for (const c of list) {
      const { d, cx, cy } = segDist(ball.x, ball.y, c);
      const min = c.r + BALL_R;
      if (d >= min) continue;
      let nx = 0;
      let ny = -1;
      if (d > 1e-6) { nx = (ball.x - cx) / d; ny = (ball.y - cy) / d; }
      ball.x += nx * (min - d);
      ball.y += ny * (min - d);
      const rule = KINDS[c.kind] || KINDS.wall;
      out.kinds.add(c.kind);
      if (c.kind === 'hazard') out.hazard = true;
      const vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) {
        let bounce = rule.bounce;
        ball.vx -= (1 + bounce) * vn * nx;
        ball.vy -= (1 + bounce) * vn * ny;
        out.hit = Math.max(out.hit, -vn);
        // A blue line always springs back at least a little, so it feels bouncy even on a soft landing.
        if (rule.spring && -vn * bounce < rule.spring) {
          const extra = rule.spring - (-vn * bounce);
          ball.vx += nx * extra;
          ball.vy += ny * extra;
        }
      }
      // Along the surface: friction drags, a green line pushes the way the ball already rolls.
      const vn2 = ball.vx * nx + ball.vy * ny;
      const tx = ball.vx - vn2 * nx;
      const ty = ball.vy - vn2 * ny;
      const k = Math.min(1, rule.friction * h);
      ball.vx -= tx * k;
      ball.vy -= ty * k;
      if (rule.push) {
        const tl = Math.hypot(tx, ty);
        // Resting still on a flat green line: push along the line toward its lower end, or right.
        let ux = -ny;
        let uy = nx;
        if (tl > 0.5) { ux = tx / tl; uy = ty / tl; } else if (uy < 0 || (Math.abs(uy) < 1e-6 && ux < 0)) { ux = -ux; uy = -uy; }
        ball.vx += ux * rule.push * h;
        ball.vy += uy * rule.push * h;
      }
    }
  }
  return out;
}

/** The open pocket the ball has dropped into, or null. */
export function pocketUnder(ball, level) {
  if (ball.y < H - POCKET_DEPTH + BALL_R) return null;
  for (const p of level.pockets) {
    if (ball.x >= p.x0 && ball.x <= p.x1 && !level.closed.has(p.index)) return p;
  }
  return null;
}

export function newBall(level) {
  return { x: level.dropper.x, y: level.dropper.y, vx: 0, vy: 0 };
}

/**
 * Run a whole drop without drawing anything on screen.
 * Returns { pocket: index or -1, hazard, time }. -1 means it got stuck or ran out of time.
 */
export function simulateDrop(level, strokes, maxTime = 14) {
  const ball = newBall(level);
  const list = solids(level, strokes);
  const dt = 1 / 60;
  let still = 0;
  for (let t = 0; t < maxTime; t += dt) {
    const r = stepBall(ball, list, dt);
    if (r.hazard) return { pocket: -1, hazard: true, time: t };
    const p = pocketUnder(ball, level);
    if (p) return { pocket: p.index, hazard: false, time: t };
    still = Math.hypot(ball.vx, ball.vy) < 3 ? still + dt : 0;
    if (still > 1.2) break;
  }
  return { pocket: -1, hazard: false, time: maxTime };
}

/** Which pocket gets the right answer: never the one a plain drop already falls into. */
export function pickAnswerPocket(level, rnd = Math.random) {
  const options = level.pockets.map(p => p.index).filter(i => i !== level.freeFall);
  return options[Math.floor(rnd() * options.length)];
}
