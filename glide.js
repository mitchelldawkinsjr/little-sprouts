/**
 * Island glide — hold to raise the nose, release to dive.
 * The biplane circles a low island. Yellow gems add to the score
 * and put a little fuel back. The ground and an empty tank end the flight.
 * The plane, island, and gems here are Little Sprouts' own.
 */
let active = null;

export function stopGlide() {
  active?.destroy();
  active = null;
}

const TAU = Math.PI * 2;
const RING = 46;
const SLICES = 72;
const RINGS = [
  { r0: 0, r1: 11, kind: 'lagoon' },
  { r0: 11, r1: 17, kind: 'sand' },
  { r0: 17, r1: 26, kind: 'grass' },
  { r0: 26, r1: 34, kind: 'grass' },
  { r0: 34, r1: 42, kind: 'grass' },
  { r0: 42, r1: 50, kind: 'grass' },
  { r0: 50, r1: 57, kind: 'sand' },
  { r0: 57, r1: 68, kind: 'shallows' },
  { r0: 68, r1: 96, kind: 'ocean' }
];

function ground(angle) {
  const peak = Math.pow(Math.max(0, Math.sin(angle - 0.7)), 3) * 8;
  const ridge = Math.pow(Math.max(0, Math.sin(angle * 2 + 2.2)), 4) * 4.5;
  const roll = Math.sin(angle * 3 + 1.1) * 1.4 + Math.sin(angle * 5 + 0.4) * 0.7;
  return 1.6 + peak + ridge + Math.max(0, roll);
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function fade(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0 || 1)));
  return t * t * (3 - 2 * t);
}

function landY(angle, radius) {
  if (radius < 11 || radius > 68) return 0.2;
  const inland = fade(11, 20, radius) * fade(68, 52, radius);
  return 0.2 + (ground(angle) - 0.2) * inland;
}

function surfaceY(kind, angle, time) {
  if (kind === 'lagoon' || kind === 'shallows' || kind === 'ocean') {
    return 0.22 + Math.sin(angle * 7 + time) * 0.1 + Math.sin(angle * 3 - time * 0.6) * 0.05;
  }
  if (kind === 'sand') return 0.72 + Math.max(0, ground(angle) - 1.6) * 0.04;
  return ground(angle);
}

export function mountGlide(root, { reduced, onScore, nextQuestion, onPrompt, onClear, onMiss, onOver, onFinished } = {}) {
  stopGlide();
  const calm = reduced ? 0.8 : 1;
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

  root.innerHTML = `<div class="glide-play"><div class="glide" role="application" aria-label="Hold to climb. Let go and the plane dives. Grab the gem with the answer."><canvas class="glide-view"></canvas></div></div>`;
  const stage = root.querySelector('.glide');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let width = 960;
  let height = 540;
  let mode = 'title';
  let holding = false;
  let angle = 0.4;
  let alt = ground(angle) + 8;
  let pitch = 0.2;
  let fuel = 1;
  let score = 0;
  let grace = 0;
  let bonus = 0;
  let lap = 0;
  let asking = false;
  let askWait = 0;
  let slipped = false;
  let learningDone = false;
  let closed = false;
  let last = 0;
  let spin = 0;
  const gems = [];
  const rand = mulberry(19);
  const place = (count, test) => {
    const list = [];
    let guard = 0;
    while (list.length < count && guard < count * 12) {
      guard += 1;
      const a = rand() * TAU;
      const h = ground(a);
      const spot = test(a, h, rand);
      if (spot) list.push(spot);
    }
    return list;
  };
  const palms = place(22, (a, h, roll) => {
    if (h > 4.4) return null;
    const beach = roll() > 0.5;
    return { a, r: beach ? 15.2 : 54.2, y: 0.9, lean: roll() * 1.4 - 0.7, s: 0.85 + roll() * 0.7 };
  });
  const pines = place(34, (a, h, roll) => {
    if (h < 3.2 || h > 10.5) return null;
    return { a, r: 22 + roll() * 26, h: 1.5 + roll() * 2.1, shade: roll(), fat: roll() };
  });
  const rocks = place(18, (a, h, roll) => {
    if (h < 7) return null;
    return { a, r: 24 + roll() * 22, s: 0.6 + roll() * 0.9 };
  });
  const blooms = place(40, (a, h, roll) => {
    if (h < 2.4 || h > 8) return null;
    return { a, r: 20 + roll() * 28, c: roll() > 0.5 ? '#e07a8a' : '#f2d35a' };
  });
  const birds = Array.from({ length: 5 }, () => ({
    x: rand(),
    y: 0.08 + rand() * 0.22,
    w: 0.4 + rand() * 0.8,
    flip: rand() > 0.5 ? 1 : -1
  }));
  const hut = { a: 3.4, r: 32 };
  const light = { a: 5.1, r: 54.5 };

  const call = (fn, ...args) => { try { return fn?.(...args); } catch { return undefined; } };
  const tell = () => call(() => onScore?.(score));

  const seedGems = () => {
    gems.length = 0;
    for (let i = 0; i < 8; i++) {
      const a = angle + 1.6 + i * 0.7;
      gems.push({ a, y: ground(a) + 3.2 + (i % 3) * 1.8, hot: false, ask: false });
    }
  };

  const placeAsk = () => {
    if (typeof nextQuestion !== 'function' || learningDone || asking || closed) return;
    const pack = call(nextQuestion);
    if (!pack?.choices?.length) {
      learningDone = true;
      closed = true;
      call(onFinished);
      return;
    }
    slipped = false;
    asking = true;
    const offsets = [-6, 0, 6, -3, 3];
    pack.choices.forEach((choice, i) => {
      const a = angle + 1.55 + i * 0.62;
      const y = Math.max(ground(a) + 3.2, alt + offsets[i % offsets.length]);
      gems.push({
        a,
        y,
        hot: false,
        ask: true,
        label: String(choice.label || ''),
        ok: !!choice.ok,
        fill: choice.fill || '',
        shape: choice.shape || ''
      });
    });
    call(onPrompt);
  };

  const begin = () => {
    mode = 'fly';
    angle = 0.4;
    alt = ground(angle) + 7.5;
    pitch = 0.28;
    fuel = 1;
    score = 0;
    grace = 0.85;
    bonus = 0;
    lap = 0;
    asking = false;
    askWait = 0.45;
    slipped = false;
    seedGems();
    tell();
  };

  const end = reason => {
    if (mode !== 'fly') return;
    mode = 'over';
    holding = false;
    tell();
    if (closed || learningDone) return;
    closed = true;
    call(onOver, reason);
  };

  const layout = () => {
    const rect = stage.getBoundingClientRect();
    width = Math.max(320, rect.width);
    height = Math.max(220, rect.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const camera = () => {
    const back = angle - 0.72;
    const floor = ground(angle);
    const lift = Math.max(0, alt - floor);
    const eye = {
      x: Math.cos(back) * (RING + 4),
      y: alt + 2.4,
      z: Math.sin(back) * (RING + 4)
    };
    let soon = null;
    let soonRel = Infinity;
    gems.forEach(gem => {
      if (!gem.ask || gem.gone) return;
      let rel = gem.a - angle;
      while (rel <= -Math.PI) rel += TAU;
      while (rel > Math.PI) rel -= TAU;
      if (rel < -0.15 || rel >= soonRel) return;
      soon = gem;
      soonRel = rel;
    });
    const fall = Math.min(lift, 24) * 0.62;
    const want = soon ? soon.y : alt - fall;
    const lookY = Math.max(alt - 18, Math.min(alt - 1.2, alt * 0.5 + want * 0.5));
    const ahead = angle + 0.55;
    const at = {
      x: Math.cos(ahead) * RING,
      y: lookY,
      z: Math.sin(ahead) * RING
    };
    const fwd = norm(sub(at, eye));
    const right = norm(cross(fwd, { x: 0, y: 1, z: 0 }));
    const up = cross(right, fwd);
    return { eye, fwd, right, up };
  };

  const project = (p, cam) => {
    const d = sub(p, cam.eye);
    const cz = dot(d, cam.fwd);
    if (cz < 0.9) return null;
    const cx = dot(d, cam.right);
    const cy = dot(d, cam.up);
    const f = Math.min(width, height) * 0.9;
    return {
      x: width / 2 + cx / cz * f,
      y: height * 0.58 - cy / cz * f,
      z: cz,
      s: f / cz
    };
  };

  const sky = () => {
    const drop = pitch * height * 0.1;
    ctx.save();
    ctx.translate(0, drop);
    const g = ctx.createLinearGradient(0, -height, 0, height);
    g.addColorStop(0, '#6ea8d8');
    g.addColorStop(0.42, '#f3c7a4');
    g.addColorStop(0.68, '#f7e2cf');
    g.addColorStop(1, '#8ebed4');
    ctx.fillStyle = g;
    ctx.fillRect(0, -height, width, height * 3);
    const sunX = width * 0.78;
    const sunY = height * 0.16;
    const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 90);
    glow.addColorStop(0, 'rgba(255, 244, 210, 0.95)');
    glow.addColorStop(0.35, 'rgba(255, 214, 150, 0.45)');
    glow.addColorStop(1, 'rgba(255, 214, 150, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - 100, sunY - 100, 200, 200);
    ctx.fillStyle = '#fff6df';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 26, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(sunX - 8, sunY - 8, 8, 5, -0.6, 0, TAU);
    ctx.fill();
    birds.forEach(bird => {
      const x = ((bird.x + spin * 0.008 * bird.flip) % 1) * width;
      const y = bird.y * height + Math.sin(spin + bird.x * 6) * 4;
      ctx.strokeStyle = 'rgba(70, 78, 92, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 7 * bird.w, y);
      ctx.quadraticCurveTo(x - 3 * bird.w, y - 5 * bird.w, x, y);
      ctx.quadraticCurveTo(x + 3 * bird.w, y - 5 * bird.w, x + 7 * bird.w, y);
      ctx.stroke();
    });
    for (let i = 0; i < 4; i++) {
      const x = ((0.12 + i * 0.22 + spin * 0.004) % 1) * width;
      const y = height * (0.12 + (i % 2) * 0.08);
      const w = 46 + i * 8;
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.beginPath();
      ctx.ellipse(x, y, w, w * 0.38, 0, 0, TAU);
      ctx.ellipse(x + w * 0.55, y + 6, w * 0.62, w * 0.28, 0, 0, TAU);
      ctx.ellipse(x - w * 0.48, y + 8, w * 0.5, w * 0.24, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(210, 196, 184, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x, y + 10, w * 0.7, w * 0.16, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  };

  const fillPoly = pts => {
    ctx.beginPath();
    pts.forEach((p, n) => n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();
  };

  const rounded = (x, y, w, h, r) => {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  };

  const banner = text => {
    ctx.save();
    ctx.translate(width / 2, 14);
    rounded(-70, 0, 140, 46, 14);
    ctx.fillStyle = '#8a5a34';
    ctx.fill();
    rounded(-62, 6, 124, 34, 10);
    ctx.fillStyle = '#f6e7c1';
    ctx.fill();
    ctx.fillStyle = '#e2b437';
    ctx.beginPath();
    ctx.moveTo(-40, 23);
    ctx.lineTo(-32, 14);
    ctx.lineTo(-24, 23);
    ctx.lineTo(-32, 32);
    ctx.fill();
    ctx.fillStyle = '#5a3a22';
    ctx.font = '800 26px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 10, 23);
    ctx.restore();
  };

  const fuelBar = () => {
    const w = Math.min(220, width * 0.34);
    const x = width / 2 - w / 2;
    const y = height - 28;
    rounded(x - 28, y - 10, w + 56, 26, 13);
    ctx.fillStyle = 'rgba(20, 48, 62, 0.82)';
    ctx.fill();
    ctx.fillStyle = '#f6e7c1';
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Fuel', x - 18, y + 3);
    rounded(x + 16, y - 2, w - 8, 10, 5);
    ctx.fillStyle = '#10283f';
    ctx.fill();
    const fill = Math.max(0, (w - 8) * fuel);
    if (fill > 1) {
      rounded(x + 16, y - 2, fill, 10, 5);
      ctx.fillStyle = fuel > 0.28 ? '#f2c14b' : '#e23b3b';
      ctx.fill();
    }
  };

  const drawPlane = (px, py, sc, nose) => {
    const s = Math.max(48, Math.min(120, sc));
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-nose * 0.55);
    ctx.fillStyle = '#b84334';
    rounded(-s * 1.15, s * 0.18, s * 2.3, s * 0.2, s * 0.08);
    ctx.fill();
    ctx.strokeStyle = '#6a4632';
    ctx.lineWidth = Math.max(1.5, s * 0.035);
    ctx.beginPath();
    ctx.moveTo(-s * 0.55, -s * 0.32);
    ctx.lineTo(-s * 0.72, s * 0.22);
    ctx.moveTo(s * 0.2, -s * 0.32);
    ctx.lineTo(s * 0.34, s * 0.22);
    ctx.stroke();
    ctx.fillStyle = '#3f86b0';
    ctx.beginPath();
    ctx.ellipse(s * 0.02, -s * 0.02, s * 0.46, s * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2c688c';
    ctx.beginPath();
    ctx.ellipse(-s * 0.08, s * 0.04, s * 0.3, s * 0.16, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d45340';
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.08);
    ctx.lineTo(-s * 0.78, -s * 0.46);
    ctx.lineTo(-s * 0.22, -s * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e15a45';
    rounded(-s * 1.28, -s * 0.46, s * 2.56, s * 0.22, s * 0.08);
    ctx.fill();
    ctx.fillStyle = '#f4d35e';
    ctx.fillRect(-s * 0.08, -s * 0.46, s * 0.14, s * 0.22);
    ctx.fillStyle = '#f7f3ea';
    ctx.fillRect(-s * 1.28, -s * 0.4, s * 2.56, s * 0.035);
    ctx.save();
    ctx.translate(s * 0.5, -s * 0.02);
    ctx.rotate(spin * (holding ? 1.8 : 1));
    ctx.strokeStyle = 'rgba(55, 46, 40, 0.9)';
    ctx.lineWidth = Math.max(2, s * 0.055);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, 0);
    ctx.lineTo(s * 0.3, 0);
    ctx.moveTo(0, -s * 0.3);
    ctx.lineTo(0, s * 0.3);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#5c4634';
    ctx.beginPath();
    ctx.arc(s * 0.5, -s * 0.02, Math.max(2, s * 0.06), 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f4f0e4';
    ctx.beginPath();
    ctx.ellipse(s * 0.12, -s * 0.06, s * 0.11, s * 0.08, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#24322c';
    ctx.beginPath();
    ctx.arc(s * 0.14, -s * 0.06, Math.max(1.5, s * 0.035), 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  const drawPalm = (p, tree) => {
    const s = Math.max(10, tree.s * p.s * 0.11);
    const topX = p.x + tree.lean * s * 0.45;
    const topY = p.y - s * 1.15;
    ctx.strokeStyle = '#8d5a32';
    ctx.lineWidth = Math.max(2, s * 0.12);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.quadraticCurveTo(p.x + tree.lean * s, p.y - s * 0.55, topX, topY);
    ctx.stroke();
    ctx.strokeStyle = '#2f7a45';
    ctx.lineWidth = Math.max(2, s * 0.1);
    for (let i = 0; i < 5; i++) {
      const a = -2.4 + i * 0.85;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(
        topX + Math.cos(a) * s * 0.45,
        topY + Math.sin(a) * s * 0.2,
        topX + Math.cos(a) * s * 0.85,
        topY + Math.sin(a) * s * 0.35
      );
      ctx.stroke();
    }
    ctx.fillStyle = '#6aaa45';
    ctx.beginPath();
    ctx.ellipse(topX, topY + 2, s * 0.16, s * 0.1, 0, 0, TAU);
    ctx.fill();
  };

  const drawPine = (p, tree) => {
    const h = tree.h * p.s * 0.1;
    ctx.fillStyle = '#6d5336';
    ctx.fillRect(p.x - Math.max(1.5, h * 0.06), p.y - h * 0.28, Math.max(3, h * 0.12), h * 0.32);
    const greens = tree.shade > 0.55 ? ['#2f6a40', '#3e8a4c', '#67a85a'] : ['#245c48', '#2f7a52', '#4e9460'];
    greens.forEach((color, i) => {
      const rise = h * (0.35 + i * 0.22);
      const wide = h * (0.52 - i * 0.1);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - rise - h * 0.28);
      ctx.lineTo(p.x + wide, p.y - rise + h * 0.22);
      ctx.lineTo(p.x - wide, p.y - rise + h * 0.22);
      ctx.closePath();
      ctx.fill();
    });
  };

  const paintWorld = () => {
    const cam = camera();
    const time = spin * 0.35;
    const sun = norm({ x: 0.42, y: 0.84, z: 0.32 });
    const items = [];
    const push = (z, draw) => items.push({ z, draw });
    const radii = [];
    for (let r = 0; r <= 76; r += 2.5) radii.push(r);
    const arc = Math.PI * 1.15;
    const steps = 42;
    for (let i = 0; i < steps; i++) {
      const a0 = angle - 0.7 + i / steps * arc;
      const a1 = angle - 0.7 + (i + 1) / steps * arc;
      for (let b = 0; b < radii.length - 1; b++) {
        const r0 = radii[b];
        const r1 = radii[b + 1];
        const y00 = landY(a0, r0);
        const y10 = landY(a1, r0);
        const y11 = landY(a1, r1);
        const y01 = landY(a0, r1);
        const corners = [
          { x: Math.cos(a0) * r0, y: y00, z: Math.sin(a0) * r0 },
          { x: Math.cos(a1) * r0, y: y10, z: Math.sin(a1) * r0 },
          { x: Math.cos(a1) * r1, y: y11, z: Math.sin(a1) * r1 },
          { x: Math.cos(a0) * r1, y: y01, z: Math.sin(a0) * r1 }
        ];
        const pts = corners.map(p => project(p, cam));
        if (pts.some(p => !p)) continue;
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        if (Math.max(...xs) - Math.min(...xs) > width * 1.2) continue;
        if (Math.max(...ys) - Math.min(...ys) > height * 1.2) continue;
        if (pts.every(p => p.x < -40 || p.x > width + 40 || p.y < -40 || p.y > height + 40)) continue;
        const z = (pts[0].z + pts[1].z + pts[2].z + pts[3].z) / 4;
        const yMid = (y00 + y10 + y11 + y01) / 4;
        const rMid = (r0 + r1) / 2;
        const e1 = sub(corners[1], corners[0]);
        const e2 = sub(corners[3], corners[0]);
        const nrm = norm(cross(e2, e1));
        if (nrm.y < 0) { nrm.x = -nrm.x; nrm.y = -nrm.y; nrm.z = -nrm.z; }
        const light = 0.78 + Math.max(0, dot(nrm, sun)) * 0.22;
        const water = rMid < 11 || rMid > 68;
        const coast = !water && (rMid < 16.5 || rMid > 57);
        const peak = !water && !coast && yMid > 7.4;
        const base = water
          ? (rMid < 11 ? '#3f96a8' : '#2f86a4')
          : peak
            ? (yMid > 9.2 ? '#f7f4ee' : '#c9b8a2')
            : coast
              ? '#e4d0a2'
              : (yMid > 4.8 ? '#7eaa4e' : '#62943f');
        const color = tinted(base, 1 - light, water ? '#12384c' : '#2a4030');
        push(z, () => {
          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.lineJoin = 'round';
          fillPoly(pts);
          ctx.stroke();
        });
      }
    }
    const scatter = (list, draw) => {
      list.forEach(item => {
        const y = item.y ?? ground(item.a);
        const p = project({ x: Math.cos(item.a) * item.r, y, z: Math.sin(item.a) * item.r }, cam);
        if (!p || p.x < -60 || p.x > width + 60) return;
        push(p.z, () => draw(p, item));
      });
    };
    scatter(rocks, (p, rock) => {
      const s = Math.max(5, rock.s * p.s * 0.08);
      ctx.fillStyle = '#8d8274';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, s, s * 0.62, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#b7aea2';
      ctx.beginPath();
      ctx.ellipse(p.x - s * 0.2, p.y - s * 0.16, s * 0.55, s * 0.36, -0.4, 0, TAU);
      ctx.fill();
    });
    scatter(pines, drawPine);
    scatter(palms, drawPalm);
    scatter(blooms, (p, bloom) => {
      const s = Math.max(2, p.s * 0.012);
      ctx.fillStyle = '#3f7a3a';
      ctx.fillRect(p.x, p.y - s * 2, 1.2, s * 2);
      ctx.fillStyle = bloom.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y - s * 2.4, s * 1.3, 0, TAU);
      ctx.fill();
    });
    const hutP = project({ x: Math.cos(hut.a) * hut.r, y: ground(hut.a), z: Math.sin(hut.a) * hut.r }, cam);
    if (hutP) {
      push(hutP.z, () => {
        const s = Math.max(8, hutP.s * 0.05);
        ctx.fillStyle = '#a56b3c';
        ctx.fillRect(hutP.x - s * 0.7, hutP.y - s * 0.7, s * 1.4, s * 0.75);
        ctx.fillStyle = '#8d4d32';
        ctx.beginPath();
        ctx.moveTo(hutP.x - s * 0.95, hutP.y - s * 0.65);
        ctx.lineTo(hutP.x, hutP.y - s * 1.35);
        ctx.lineTo(hutP.x + s * 0.95, hutP.y - s * 0.65);
        ctx.fill();
        ctx.fillStyle = '#5c3a28';
        ctx.fillRect(hutP.x - s * 0.16, hutP.y - s * 0.38, s * 0.32, s * 0.42);
        ctx.fillStyle = '#f2d48a';
        ctx.fillRect(hutP.x + s * 0.28, hutP.y - s * 0.52, s * 0.22, s * 0.2);
      });
    }
    const lamp = project({ x: Math.cos(light.a) * light.r, y: 0.9, z: Math.sin(light.a) * light.r }, cam);
    if (lamp) {
      push(lamp.z, () => {
        const s = Math.max(8, lamp.s * 0.055);
        ctx.fillStyle = 'rgba(40, 40, 40, 0.2)';
        ctx.beginPath();
        ctx.ellipse(lamp.x, lamp.y + 2, s * 0.45, s * 0.16, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#f7f4ee';
        ctx.fillRect(lamp.x - s * 0.16, lamp.y - s * 1.35, s * 0.32, s * 1.35);
        ctx.fillStyle = '#d45340';
        ctx.fillRect(lamp.x - s * 0.16, lamp.y - s * 0.85, s * 0.32, s * 0.22);
        ctx.fillStyle = '#3f86b0';
        ctx.beginPath();
        ctx.arc(lamp.x, lamp.y - s * 1.48, s * 0.2, 0, TAU);
        ctx.fill();
        const beam = 0.5 + 0.5 * Math.sin(spin * 0.8);
        ctx.fillStyle = `rgba(255, 236, 170, ${0.15 + beam * 0.2})`;
        ctx.beginPath();
        ctx.moveTo(lamp.x, lamp.y - s * 1.48);
        ctx.lineTo(lamp.x + s * 1.8, lamp.y - s * 0.2);
        ctx.lineTo(lamp.x + s * 1.1, lamp.y + s * 0.3);
        ctx.fill();
      });
    }
    const gy = ground(angle);
    const clearance = alt - gy;
    const shadow = project({
      x: Math.cos(angle) * RING,
      y: gy + 0.2,
      z: Math.sin(angle) * RING
    }, cam);
    if (shadow) {
      push(shadow.z - 0.05, () => {
        const near = Math.max(0, Math.min(1, 1 - clearance / 14));
        const rx = Math.max(8, shadow.s * 0.09 * (0.55 + near * 0.7));
        ctx.fillStyle = clearance < 2.2 ? `rgba(176, 48, 40, ${0.25 + near * 0.25})` : `rgba(36, 58, 44, ${0.16 + near * 0.22})`;
        ctx.beginPath();
        ctx.ellipse(shadow.x, shadow.y, rx, rx * 0.42, 0, 0, TAU);
        ctx.fill();
      });
    }
    const craft = project({
      x: Math.cos(angle) * RING,
      y: alt,
      z: Math.sin(angle) * RING
    }, cam);
    gems.forEach(gem => {
      if (gem.ask) return;
      const bob = Math.sin(spin * 2 + gem.a) * 0.35;
      const p = project({
        x: Math.cos(gem.a) * RING,
        y: gem.y + bob,
        z: Math.sin(gem.a) * RING
      }, cam);
      if (!p) return;
      push(p.z - 0.15, () => {
        const s = Math.max(16, p.s * 0.13) * (gem.hot ? 1.15 : 1);
        const glow = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, s * 2.1);
        glow.addColorStop(0, gem.hot ? 'rgba(255, 196, 80, 0.9)' : 'rgba(255, 226, 90, 0.75)');
        glow.addColorStop(1, 'rgba(255, 226, 90, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, s * 2.1, 0, TAU);
        ctx.fill();
        ctx.fillStyle = gem.hot ? '#ffb703' : '#ffe14a';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s * 0.72, p.y);
        ctx.lineTo(p.x, p.y + s * 0.85);
        ctx.lineTo(p.x - s * 0.72, p.y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = gem.hot ? '#fff1c2' : '#fff6b0';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s * 0.72);
        ctx.lineTo(p.x + s * 0.28, p.y - s * 0.05);
        ctx.lineTo(p.x, p.y + s * 0.15);
        ctx.lineTo(p.x - s * 0.18, p.y - s * 0.08);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(p.x - s * 0.08, p.y - s * 0.55, Math.max(2, s * 0.16), s * 0.28);
      });
    });
    items.sort((a, b) => b.z - a.z);
    items.forEach(item => item.draw());
    if (shadow && craft && mode === 'fly') {
      ctx.save();
      ctx.strokeStyle = clearance < 2.2 ? 'rgba(176, 48, 40, 0.55)' : 'rgba(36, 58, 44, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      ctx.moveTo(craft.x, craft.y);
      ctx.lineTo(shadow.x, shadow.y);
      ctx.stroke();
      ctx.restore();
    }
    if (craft) drawPlane(craft.x, craft.y, Math.min(craft.s * 1.15, 90), pitch);
    else drawPlane(width * 0.5, height * 0.62, 56, pitch);
    gems.forEach(gem => {
      if (!gem.ask || gem.gone) return;
      const p = project({
        x: Math.cos(gem.a) * RING,
        y: gem.y,
        z: Math.sin(gem.a) * RING
      }, cam);
      if (p) drawChoice(p, gem);
    });
  };

  const drawShape = (kind, x, y, k) => {
    ctx.beginPath();
    if (kind === 'circle' || kind === 'oval') ctx.ellipse(x, y, k, kind === 'oval' ? k * 0.68 : k, 0, 0, TAU);
    else if (kind === 'triangle') {
      ctx.moveTo(x, y - k);
      ctx.lineTo(x + k, y + k * 0.75);
      ctx.lineTo(x - k, y + k * 0.75);
      ctx.closePath();
    } else if (kind === 'diamond') {
      ctx.moveTo(x, y - k);
      ctx.lineTo(x + k, y);
      ctx.lineTo(x, y + k);
      ctx.lineTo(x - k, y);
      ctx.closePath();
    } else if (kind === 'star') ctx.arc(x, y, k * 0.72, 0, TAU);
    else if (kind === 'hexagon') {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 3;
        const px = x + Math.cos(a) * k;
        const py = y + Math.sin(a) * k;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.closePath();
    } else ctx.rect(x - k, y - k * 0.7, k * 2, k * 1.4);
    ctx.fill();
  };

  const drawChoice = (p, gem) => {
    const s = Math.max(26, Math.min(52, p.s * 0.18));
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = gem.fill || '#ffe14a';
    ctx.strokeStyle = '#6a4630';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.72, 0);
    ctx.lineTo(0, s * 0.85);
    ctx.lineTo(-s * 0.72, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (gem.shape) {
      ctx.fillStyle = '#f7f3ea';
      drawShape(gem.shape, 0, -s * 0.02, s * 0.32);
    }
    const text = gem.label;
    let size = 18;
    ctx.font = `700 ${size}px Outfit, sans-serif`;
    while (size > 11 && ctx.measureText(text).width > 132) {
      size -= 1;
      ctx.font = `700 ${size}px Outfit, sans-serif`;
    }
    const plateW = Math.max(56, ctx.measureText(text).width + 16);
    const plateH = size + 10;
    const plateY = s * 0.95;
    rounded(-plateW / 2, plateY, plateW, plateH, 8);
    ctx.fillStyle = '#faf7f0';
    ctx.fill();
    ctx.strokeStyle = '#24506d';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#1d3a4c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, plateY + plateH / 2);
    ctx.restore();
  };

  const overlay = () => {
    if (mode === 'fly') return;
    const cardW = Math.min(336, width - 24);
    const cardY = height * 0.58;
    const cardH = Math.min(height * 0.38, height - cardY - 8);
    ctx.fillStyle = 'rgba(18, 42, 58, 0.28)';
    ctx.fillRect(0, 0, width, height);
    rounded(width / 2 - cardW / 2, cardY, cardW, cardH, 22);
    ctx.fillStyle = 'rgba(250, 247, 240, 0.94)';
    ctx.fill();
    ctx.fillStyle = '#24506d';
    ctx.font = '800 36px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mode === 'title' ? 'Island glide' : 'Flight over', width / 2, cardY + 36);
    if (mode === 'over') {
      ctx.font = '700 16px Outfit, sans-serif';
      ctx.fillStyle = '#5a3a22';
      ctx.fillText(fuel <= 0 ? 'The fuel ran out.' : 'The plane met the island.', width / 2, cardY + 68);
    }
    const by = cardY + cardH * 0.58;
    ctx.beginPath();
    ctx.arc(width / 2, by, 28, 0, TAU);
    ctx.fillStyle = '#3c92d6';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(width / 2 - 7, by - 12);
    ctx.lineTo(width / 2 + 12, by);
    ctx.lineTo(width / 2 - 7, by + 12);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 15px Outfit, sans-serif';
    ctx.fillStyle = '#24506d';
    const gemLine = `${score} ${score === 1 ? 'gem' : 'gems'}`;
    ctx.fillText(mode === 'title' ? 'Grab the gem with the answer.' : gemLine, width / 2, cardY + cardH - 22);
  };

  const paint = () => {
    sky();
    paintWorld();
    if (mode === 'fly') {
      banner(String(score));
      fuelBar();
      const clearance = Math.max(0, alt - ground(angle));
      const lifted = Math.round(clearance);
      ctx.save();
      ctx.translate(16, height * 0.5);
      rounded(0, -78, 44, 156, 12);
      ctx.fillStyle = 'rgba(20, 48, 62, 0.82)';
      ctx.fill();
      const rise = Math.max(0, Math.min(1, clearance / 16));
      ctx.fillStyle = clearance < 2.2 ? '#e23b3b' : '#f2c14b';
      ctx.fillRect(10, 62 - rise * 120, 24, Math.max(6, rise * 120));
      ctx.fillStyle = '#f6e7c1';
      ctx.font = '700 13px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(lifted), 22, 70);
      ctx.restore();
      if (bonus > 0) {
        ctx.fillStyle = '#d24b3a';
        ctx.font = '800 22px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Bonus!', width / 2, 78);
      }
    }
    overlay();
  };

  const tick = now => {
    if (session.dead) return;
    const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016);
    last = now;
    spin += dt * (mode === 'fly' ? 18 : 6) * calm;
    const paused = !!document.querySelector('dialog[open]');
    if (!paused && mode === 'title') angle += dt * 0.12 * calm;
    if (!paused && mode === 'fly') {
      const lift = holding ? 1.35 : -1.15;
      pitch = Math.max(-1.05, Math.min(0.95, pitch + lift * calm * dt));
      alt += Math.sin(pitch) * 9 * calm * dt;
      angle += 0.5 * calm * dt;
      grace = Math.max(0, grace - dt);
      bonus = Math.max(0, bonus - dt);
      fuel = Math.max(0, fuel - 0.03 * dt);
      const floor = ground(angle) + 0.7;
      if (grace <= 0 && alt < floor) end('ground');
      else if (fuel <= 0) end('fuel');
      else {
        askWait = Math.max(0, askWait - dt);
        if (!asking && askWait <= 0) placeAsk();
        const nextLap = Math.floor((angle - 0.4) / TAU);
        if (nextLap > lap) {
          lap = nextLap;
          bonus = 4;
          for (let i = 0; i < 5; i++) gems.push({ a: angle + 0.8 + i * 0.22, y: ground(angle) + 5 + i * 1.3, hot: true, ask: false });
        }
        const px = Math.cos(angle) * RING;
        const pz = Math.sin(angle) * RING;
        const near = gem => {
          const dx = Math.cos(gem.a) * RING - px;
          const dy = gem.y - alt;
          const dz = Math.sin(gem.a) * RING - pz;
          return dx * dx + dy * dy + dz * dz;
        };
        let tookAsk = false;
        gems.forEach(gem => {
          if (!gem.ask || gem.gone) return;
          if (near(gem) > 22) return;
          tookAsk = true;
          if (gem.ok) {
            score += 1;
            fuel = Math.min(1, fuel + 0.18);
            gems.forEach(other => { if (other.ask) other.gone = true; });
            asking = false;
            askWait = 0.75;
            tell();
            call(onClear, !slipped);
          } else {
            gem.gone = true;
            slipped = true;
            call(onMiss);
          }
        });
        const behind = gems.filter(gem => {
          if (!gem.ask || gem.gone) return false;
          let passed = angle - gem.a;
          while (passed > Math.PI) passed -= TAU;
          while (passed < -Math.PI) passed += TAU;
          return passed > 0.4;
        });
        const offsets = [-6, 0, 6, -3, 3];
        behind.forEach((gem, i) => {
          gem.a = angle + 1.55 + i * 0.62;
          gem.y = Math.max(ground(gem.a) + 3.2, alt + offsets[i % offsets.length]);
        });
        if (!tookAsk) {
          gems.forEach(gem => {
            if (gem.ask || gem.gone) return;
            if (near(gem) > 7) return;
            score += gem.hot || bonus > 0 ? 2 : 1;
            fuel = Math.min(1, fuel + 0.14);
            gem.hot = bonus > 0;
            gem.a = angle + 2.4 + Math.random() * 2.2;
            gem.y = ground(gem.a) + 3.2 + Math.random() * 7;
            tell();
          });
        }
        for (let i = gems.length - 1; i >= 0; i--) if (gems[i].gone) gems.splice(i, 1);
      }
    }
    if (!session.dead) paint();
    session.raf = requestAnimationFrame(tick);
  };

  const down = event => {
    if (session.dead) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    if (mode !== 'fly') begin();
    holding = true;
  };
  const up = () => { holding = false; };
  const typing = event => event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
  const onKey = event => {
    if (document.querySelector('dialog[open]') || typing(event)) return;
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (event.type === 'keydown' && !event.repeat) down(event);
    if (event.type === 'keyup') up();
  };

  seedGems();
  layout();
  canvas.addEventListener('pointerdown', down);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);
  window.addEventListener('resize', layout);
  session.cleanups.push(() => {
    canvas.removeEventListener('pointerdown', down);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup', onKey);
    window.removeEventListener('resize', layout);
  });
  session.raf = requestAnimationFrame(tick);
  return { destroy: session.destroy };
}

function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
function mul(a, s) { return { x: a.x * s, y: a.y * s, z: a.z * s }; }
function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
function cross(a, b) {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
function norm(a) {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return mul(a, 1 / l);
}
function tinted(hex, t, toward) {
  const parse = color => {
    if (color[0] === '#') return [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
    const parts = String(color).match(/[\d.]+/g);
    return parts ? parts.slice(0, 3).map(Number) : [40, 60, 50];
  };
  const amount = Math.max(0, Math.min(1, t));
  const a = parse(hex);
  const b = parse(toward);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
