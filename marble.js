/**
 * Marble path — a path shooter. The frog sits in the hole and aims at a
 * chain of marbles rolling along a spiral toward the nest. A shot inserts
 * into the chain; three or more of the same color pop, then the chain rolls
 * closed and can pop again. Clearing the asked color counts.
 */
import { marbleLevel } from './logic.mjs?v=marble-path';

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const DIAM = 26;
const STEP = 4;

let active = null;

export function stopMarble() {
  active?.destroy();
  active = null;
}

function buildPath(w, h) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const frogR = clamp(Math.min(w, h) * 0.075, 16, 28);
  const inner = frogR + 34;
  const rx = Math.max(inner + 64, w * 0.5 - 16);
  const ry = Math.max(inner + 52, h * 0.5 - 14);
  const turns = 2.2;
  const raw = [];
  const samples = 760;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const ang = -Math.PI / 2 + t * turns * Math.PI * 2;
    const px = inner + (rx - inner) * (1 - t);
    const py = inner + (ry - inner) * (1 - t);
    raw.push({ x: cx + Math.cos(ang) * px, y: cy + Math.sin(ang) * py });
  }
  const lens = [0];
  for (let i = 1; i < raw.length; i++) {
    lens.push(lens[i - 1] + Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y));
  }
  const total = lens[lens.length - 1] || 1;
  const atRaw = d => {
    let lo = 1;
    let hi = lens.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (lens[mid] < d) lo = mid + 1;
      else hi = mid;
    }
    const span = lens[lo] - lens[lo - 1] || 1;
    const u = clamp((d - lens[lo - 1]) / span, 0, 1);
    const a = raw[lo - 1];
    const b = raw[lo];
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
  };
  const pts = [];
  for (let d = 0; d < total; d += STEP) pts.push(atRaw(d));
  pts.push(raw[raw.length - 1]);
  return { pts, length: total, frogR, cx, cy };
}

export function mountMarble(root, { palette, track, reduced, onQuestion, onScore, onClear, onOver }) {
  stopMarble();
  const calm = reduced ? 0.55 : 1;
  const session = {
    dead: false,
    raf: 0,
    cleanups: [],
    destroy() {
      if (this.dead) return;
      this.dead = true;
      cancelAnimationFrame(this.raf);
      this.cleanups.forEach(fn => fn());
      if (active === this) active = null;
    }
  };
  active = session;

  const colors = (palette || []).slice(0, Math.max(2, track?.colors || 3));
  const names = colors.map(color => color[0]);
  const hex = Object.fromEntries(colors);
  const quota = track?.quota || 4;
  const step = track?.step || 8;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  root.innerHTML = `<div class="marble-play"><div class="marble" role="application" aria-label="Aim and shoot the color in the question. Groups of three pop. The nest ends the path."><canvas class="marble-view"></canvas></div><div class="steer"><button type="button" class="steer-btn" data-act="aim-left" aria-label="Aim left">↺</button><button type="button" class="steer-btn" data-act="shoot" aria-label="Shoot">●</button><button type="button" class="steer-btn" data-act="aim-right" aria-label="Aim right">↻</button></div></div>`;
  const stage = root.querySelector('.marble');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let width = 640;
  let height = 360;
  let pts = [];
  let pathLength = 1;
  let frogR = 22;
  let center = { x: 320, y: 180 };
  let marbles = [];
  let target = names[0] || 'red';
  let got = 0;
  let points = 0;
  let playLevel = 1;
  let clean = true;
  let shot = null;
  let cool = 0;
  let aim = -Math.PI / 2;
  let over = false;
  let last = 0;
  let pair = null;
  const pops = [];
  const held = { left: false, right: false };

  const call = (fn, arg) => { try { fn?.(arg); } catch { /* the host owns errors */ } };
  const pace = () => (track?.speed || 26) * calm * (1 + 0.18 * (playLevel - 1));
  const publishScore = () => call(onScore, { points, level: playLevel, got, quota, color: target, hex: hex[target] });
  const ask = () => {
    call(onQuestion, { color: target, hex: hex[target], quota, got });
    stage.setAttribute('aria-label', `Shoot ${esc(target)}.`);
  };

  const pointOn = dist => {
    if (pts.length < 2) return { x: center.x, y: center.y };
    const d = clamp(dist, 0, pathLength);
    const f = (pts.length - 1) * (d / pathLength);
    const i = Math.min(pts.length - 2, Math.max(0, Math.floor(f)));
    const u = f - i;
    const a = pts[i];
    const b = pts[i + 1];
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
  };

  const leadDist = () => marbles.reduce((far, marble) => Math.max(far, marble.dist), 0);

  const seed = () => {
    const want = track?.chain || 14;
    const count = Math.max(8, Math.min(want, Math.floor(pathLength * 0.48 / DIAM)));
    const front = Math.min(pathLength * 0.46, pathLength - 64);
    marbles = [];
    for (let i = 0; i < count; i++) {
      const group = Math.floor(i / 2);
      const color = group % 2 === 0 ? target : names[(group + 1) % names.length] || target;
      const dist = front - i * DIAM;
      if (dist > 8) marbles.push({ color, dist });
    }
    if (marbles.length && !marbles.some(marble => marble.color === target)) {
      marbles[0].color = target;
      if (marbles[1]) marbles[1].color = target;
    }
  };

  const nextColor = () => {
    const present = names.filter(name => name !== target && marbles.some(marble => marble.color === name));
    const pickFrom = present.length ? present : names.filter(name => name !== target);
    const pool = pickFrom.length ? pickFrom : names;
    target = pool[Math.floor(Math.random() * pool.length)] || target;
    got = 0;
    clean = true;
    pair = null;
    ask();
  };

  const layout = () => {
    const rect = stage.getBoundingClientRect();
    width = Math.max(280, rect.width);
    height = Math.max(180, rect.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const built = buildPath(width, height);
    if (marbles.length && pathLength > 1) {
      const scale = built.length / pathLength;
      marbles.forEach(marble => { marble.dist *= scale; });
    }
    pts = built.pts;
    pathLength = built.length;
    frogR = built.frogR;
    center = { x: built.cx, y: built.cy };
  };

  const drawMarble = (color, x, y, r, flash) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = flash ? '#fff' : (hex[color] || '#dc6253');
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#24332c55';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - r * 0.28, y - r * 0.32, r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff99';
    ctx.fill();
  };

  const paint = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#e7f3ea';
    ctx.fillRect(0, 0, width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.strokeStyle = '#b7cbb4';
    ctx.lineWidth = 30;
    ctx.stroke();
    ctx.strokeStyle = '#dcead8';
    ctx.lineWidth = 18;
    ctx.stroke();
    const mouth = pointOn(0);
    ctx.beginPath();
    ctx.arc(mouth.x, mouth.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#8faf88';
    ctx.fill();
    const nestAt = pointOn(pathLength);
    const danger = pathLength - leadDist() < 150;
    ctx.beginPath();
    ctx.arc(nestAt.x, nestAt.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = danger ? '#c45a32' : '#32634e';
    ctx.fill();
    ctx.fillStyle = '#faf9f5';
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('nest', nestAt.x, nestAt.y);
    const drawn = marbles.slice().sort((a, b) => a.dist - b.dist);
    drawn.forEach(marble => {
      const at = pointOn(marble.dist);
      drawMarble(marble.color, at.x, at.y, 12, false);
    });
    pops.forEach(pop => drawMarble(pop.color, pop.x, pop.y, 12 * pop.life, true));
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(aim);
    ctx.fillStyle = '#2f6a50';
    ctx.beginPath();
    ctx.arc(0, 0, frogR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e7f6df';
    ctx.beginPath();
    ctx.arc(frogR * 0.42, -frogR * 0.46, frogR * 0.32, 0, Math.PI * 2);
    ctx.arc(frogR * 0.42, frogR * 0.46, frogR * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#24332c';
    ctx.beginPath();
    ctx.arc(frogR * 0.52, -frogR * 0.46, frogR * 0.14, 0, Math.PI * 2);
    ctx.arc(frogR * 0.52, frogR * 0.46, frogR * 0.14, 0, Math.PI * 2);
    ctx.fill();
    drawMarble(target, frogR + 4, 0, 9, false);
    ctx.restore();
    ctx.strokeStyle = '#32634e88';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(center.x + Math.cos(aim) * (frogR + 16), center.y + Math.sin(aim) * (frogR + 16));
    ctx.lineTo(center.x + Math.cos(aim) * (frogR + 58), center.y + Math.sin(aim) * (frogR + 58));
    ctx.stroke();
    ctx.setLineDash([]);
    if (shot) drawMarble(shot.color, shot.x, shot.y, 10, false);
  };

  const popRuns = () => {
    if (marbles.length < 3) return 0;
    marbles.sort((a, b) => b.dist - a.dist);
    const doomed = new Set();
    let i = 0;
    while (i < marbles.length) {
      let j = i;
      while (j + 1 < marbles.length && marbles[j].dist - marbles[j + 1].dist <= DIAM + 1.6) j++;
      let k = i;
      while (k <= j) {
        let end = k;
        while (end + 1 <= j && marbles[end + 1].color === marbles[k].color) end++;
        if (end - k + 1 >= 3) {
          for (let t = k; t <= end; t++) doomed.add(marbles[t]);
        }
        k = end + 1;
      }
      i = j + 1;
    }
    if (!doomed.size) return 0;
    let hits = 0;
    marbles = marbles.filter(marble => {
      if (!doomed.has(marble)) return true;
      const at = pointOn(marble.dist);
      pops.push({ color: marble.color, x: at.x, y: at.y, life: 1 });
      if (marble.color === target) hits++;
      return false;
    });
    return hits;
  };

  const scoreHits = hits => {
    if (!hits || over) return;
    got += hits;
    points += hits;
    playLevel = marbleLevel(points, step);
    publishScore();
    if (got < quota) return;
    const wasClean = clean;
    const color = target;
    call(onClear, { clean: wasClean, color, points, level: playLevel });
    nextColor();
    publishScore();
  };

  const insertShot = (ball, marble) => {
    const ahead = pointOn(marble.dist + 12);
    const behind = pointOn(Math.max(0, marble.dist - 12));
    const inFront = Math.hypot(ball.x - ahead.x, ball.y - ahead.y) <= Math.hypot(ball.x - behind.x, ball.y - behind.y);
    const slot = inFront ? marble.dist + DIAM : marble.dist;
    marbles.forEach(item => {
      if (item.dist >= slot - 0.4) item.dist += DIAM;
    });
    marbles.push({ color: ball.color, dist: slot });
  };

  const nearestMarble = ball => {
    let best = null;
    let bestD = 23;
    marbles.forEach(marble => {
      const at = pointOn(marble.dist);
      const d = Math.hypot(ball.x - at.x, ball.y - at.y);
      if (d < bestD) {
        bestD = d;
        best = marble;
      }
    });
    return best;
  };

  const reachNest = () => {
    if (over || leadDist() < pathLength - 8) return;
    over = true;
    paint();
    call(onOver, { points, level: playLevel });
  };

  const advance = dt => {
    const crawl = pace() * dt;
    const rush = Math.max(crawl, 260 * calm * dt);
    const slop = Math.max(1.5, crawl + 0.6);
    marbles.sort((a, b) => b.dist - a.dist);
    if (!marbles.length) return false;
    let joined = false;
    marbles[0].dist += crawl;
    let i = 1;
    while (i < marbles.length) {
      const limit = marbles[i - 1].dist - DIAM;
      const gap = limit - marbles[i].dist;
      if (gap <= slop) {
        marbles[i].dist = limit;
        i++;
        continue;
      }
      let j = i;
      while (j + 1 < marbles.length && marbles[j].dist - marbles[j + 1].dist <= DIAM + 1.5) j++;
      const push = Math.min(gap, rush);
      for (let k = i; k <= j; k++) marbles[k].dist += push;
      if (limit - marbles[i].dist <= 0.75) {
        const snap = limit - marbles[i].dist;
        for (let k = i; k <= j; k++) marbles[k].dist += snap;
        joined = true;
      }
      i = j + 1;
    }
    return joined;
  };

  const feedColor = () => {
    if (pair) {
      const color = pair;
      pair = null;
      return color;
    }
    const tail = marbles.reduce((rear, marble) => (!rear || marble.dist < rear.dist ? marble : rear), null);
    const choices = names.filter(name => name !== tail?.color);
    const pool = choices.length ? choices : names;
    const wantTarget = target !== tail?.color && Math.random() < 0.55;
    const color = wantTarget ? target : (pool[Math.floor(Math.random() * pool.length)] || target);
    pair = color;
    return color;
  };

  const feed = () => {
    if (marbles.length >= 42) return;
    for (let n = 0; n < 3; n++) {
      const tail = marbles.reduce((rear, marble) => (!rear || marble.dist < rear.dist ? marble : rear), null);
      if (!tail) {
        marbles.push({ color: target, dist: 8 });
        continue;
      }
      if (tail.dist < DIAM + 2) break;
      marbles.push({ color: feedColor(), dist: tail.dist - DIAM });
    }
  };

  const fire = () => {
    if (over || shot || cool > 0 || session.dead) return;
    const mouth = frogR + 18;
    shot = {
      color: target,
      x: center.x + Math.cos(aim) * mouth,
      y: center.y + Math.sin(aim) * mouth,
      vx: Math.cos(aim) * 620,
      vy: Math.sin(aim) * 620,
      life: 1.4
    };
    cool = 0.24;
  };

  const tick = now => {
    if (session.dead) return;
    const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (held.left) aim -= 1.8 * dt;
    if (held.right) aim += 1.8 * dt;
    cool = Math.max(0, cool - dt);
    pops.forEach(pop => { pop.life -= dt * 2.6; });
    for (let i = pops.length - 1; i >= 0; i--) if (pops[i].life <= 0) pops.splice(i, 1);
    if (!over) {
      const joined = advance(dt);
      if (joined) scoreHits(popRuns());
      feed();
      reachNest();
    }
    if (shot && !over) {
      shot.life -= dt;
      const dist = Math.hypot(shot.vx, shot.vy) * dt;
      const steps = Math.max(1, Math.ceil(dist / 8));
      let hit = null;
      for (let s = 0; s < steps && !hit; s++) {
        shot.x += shot.vx * dt / steps;
        shot.y += shot.vy * dt / steps;
        hit = nearestMarble(shot);
      }
      if (hit) {
        insertShot(shot, hit);
        shot = null;
        const hits = popRuns();
        if (!hits) clean = false;
        scoreHits(hits);
        reachNest();
      } else if (shot.life <= 0 || shot.x < -30 || shot.y < -30 || shot.x > width + 30 || shot.y > height + 30) {
        shot = null;
      }
    }
    if (!session.dead) paint();
    if (!session.dead) session.raf = requestAnimationFrame(tick);
  };

  const aimTo = (x, y) => {
    const rect = canvas.getBoundingClientRect();
    const px = (x - rect.left) * (width / rect.width);
    const py = (y - rect.top) * (height / rect.height);
    aim = Math.atan2(py - center.y, px - center.x);
  };
  const onPointer = event => {
    if (event.button !== undefined && event.button !== 0) return;
    aimTo(event.clientX, event.clientY);
    fire();
  };
  const onMove = event => {
    aimTo(event.clientX, event.clientY);
  };
  const typing = event => event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
  const onKey = event => {
    if (document.querySelector('dialog[open]') || typing(event)) return;
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
      event.preventDefault();
      held.left = event.type === 'keydown';
    } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
      event.preventDefault();
      held.right = event.type === 'keydown';
    } else if (event.type === 'keydown' && (event.key === ' ' || event.key === 'Enter') && !event.repeat) {
      event.preventDefault();
      fire();
    }
  };
  const onButton = event => {
    const act = event.currentTarget?.dataset.act;
    if (act === 'shoot') {
      if (event.type === 'click') fire();
      return;
    }
    const on = event.type === 'pointerdown';
    if (act === 'aim-left') held.left = on;
    if (act === 'aim-right') held.right = on;
  };

  layout();
  seed();
  ask();
  publishScore();
  canvas.addEventListener('pointerdown', onPointer);
  canvas.addEventListener('pointermove', onMove);
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);
  root.querySelectorAll('[data-act]').forEach(button => {
    button.addEventListener('pointerdown', onButton);
    button.addEventListener('pointerup', onButton);
    button.addEventListener('pointerleave', onButton);
    button.addEventListener('click', onButton);
  });
  window.addEventListener('resize', layout);
  session.cleanups.push(() => {
    canvas.removeEventListener('pointerdown', onPointer);
    canvas.removeEventListener('pointermove', onMove);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup', onKey);
    window.removeEventListener('resize', layout);
  });
  session.raf = requestAnimationFrame(tick);
  return session;
}
