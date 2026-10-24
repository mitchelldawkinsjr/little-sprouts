/**
 * Trace drive — follow the guide, then a small car drives the same line.
 * The path, the car, and the questions are Little Sprouts’ own.
 */
import { traceOnPath } from './logic.mjs?v=learn-three';

let active = null;

export function stopTrace() {
  active?.destroy();
  active = null;
}

function ring(cx, cy, rx, ry) {
  const n = 56;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return pts;
}

function poly(pairs) {
  const raw = pairs.map(([x, y]) => ({ x, y }));
  const out = [];
  for (let i = 0; i < raw.length - 1; i++) {
    const a = raw[i];
    const b = raw[i + 1];
    const steps = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 3));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  out.push(raw[raw.length - 1]);
  return out;
}

function star() {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const r = i % 2 ? 15 : 34;
    const a = -Math.PI / 2 + (i % 10) * Math.PI / 5;
    pts.push([50 + Math.cos(a) * r, 52 + Math.sin(a) * r]);
  }
  return poly(pts);
}

function hexagon() {
  const pts = [];
  for (let i = 0; i <= 6; i++) {
    const a = -Math.PI / 2 + (i % 6) * Math.PI / 3;
    pts.push([50 + Math.cos(a) * 34, 52 + Math.sin(a) * 34]);
  }
  return poly(pts);
}

const SHAPES = {
  circle: () => [ring(50, 50, 32, 32)],
  oval: () => [ring(50, 52, 36, 24)],
  square: () => [poly([[18, 18], [82, 18], [82, 82], [18, 82], [18, 18]])],
  rectangle: () => [poly([[14, 32], [86, 32], [86, 70], [14, 70], [14, 32]])],
  triangle: () => [poly([[50, 16], [84, 80], [16, 80], [50, 16]])],
  diamond: () => [poly([[50, 14], [84, 50], [50, 86], [16, 50], [50, 14]])],
  star: () => [star()],
  hexagon: () => [hexagon()]
};

const DIGITS = {
  0: () => [ring(50, 50, 24, 30)],
  1: () => [poly([[50, 22], [50, 78]]), poly([[36, 78], [64, 78]])],
  2: () => [poly([[30, 36], [40, 22], [64, 22], [74, 36], [28, 78], [74, 78]])],
  3: () => [poly([[30, 26], [58, 22], [72, 34], [56, 48], [72, 64], [56, 80], [30, 74]])],
  4: () => [poly([[30, 22], [30, 52], [74, 52]]), poly([[58, 22], [58, 80]])],
  5: () => [poly([[72, 22], [32, 22], [30, 48], [62, 46], [74, 64], [58, 80], [32, 72]])],
  6: () => [poly([[68, 28], [40, 24], [28, 48], [28, 64], [42, 80], [64, 74], [70, 58], [48, 50], [30, 58]])],
  7: () => [poly([[26, 24], [74, 24], [40, 80]])],
  8: () => [ring(50, 36, 18, 16), ring(50, 66, 20, 18)],
  9: () => [ring(50, 36, 18, 16), poly([[66, 40], [66, 78]])]
};

const LETTERS = {
  a: [[[70, 78], [70, 42], [50, 30], [30, 46], [30, 64], [50, 76], [70, 64]]],
  b: [[[32, 18], [32, 82]], [[32, 46], [54, 40], [66, 52], [54, 66], [32, 60]]],
  c: [[[68, 34], [48, 24], [30, 42], [30, 64], [48, 80], [68, 70]]],
  d: [[[68, 18], [68, 82]], [[68, 46], [46, 40], [32, 54], [46, 70], [68, 64]]],
  e: [[[70, 24], [32, 24], [32, 50], [64, 50]], [[32, 24], [32, 78], [70, 78]]],
  f: [[[62, 22], [42, 18], [34, 32], [34, 82]], [[24, 48], [56, 48]]],
  g: [[[64, 36], [46, 26], [30, 42], [30, 62], [48, 76], [66, 66], [66, 88], [40, 92]]],
  h: [[[32, 18], [32, 82]], [[32, 48], [66, 48], [66, 82]]],
  i: [[[50, 22], [50, 30]], [[50, 40], [50, 82]]],
  j: [[[58, 22], [58, 30]], [[58, 40], [58, 74], [44, 86], [30, 74]]],
  k: [[[32, 18], [32, 82]], [[64, 40], [36, 58], [66, 82]]],
  l: [[[40, 18], [40, 78], [64, 78]]],
  m: [[[24, 80], [24, 42], [40, 62], [50, 42], [60, 62], [76, 42], [76, 80]]],
  n: [[[30, 80], [30, 40], [70, 80], [70, 40]]],
  o: [[[50, 28], [28, 50], [50, 78], [72, 50], [50, 28]]],
  p: [[[32, 28], [32, 90]], [[32, 36], [58, 32], [68, 48], [54, 64], [32, 58]]],
  q: [[[36, 36], [64, 32], [72, 52], [58, 68], [36, 58], [36, 36]], [[56, 64], [74, 84]]],
  r: [[[32, 36], [32, 82]], [[32, 48], [52, 40], [66, 48]]],
  s: [[[66, 32], [44, 24], [30, 36], [48, 50], [68, 62], [56, 80], [32, 72]]],
  t: [[[36, 22], [36, 74], [58, 82]], [[22, 40], [54, 40]]],
  u: [[[30, 36], [30, 66], [50, 82], [70, 66], [70, 36]]],
  v: [[[28, 28], [50, 82], [72, 28]]],
  w: [[[22, 30], [34, 80], [50, 48], [66, 80], [78, 30]]],
  x: [[[30, 28], [70, 82]], [[70, 28], [30, 82]]],
  y: [[[30, 28], [50, 52], [70, 28]], [[50, 52], [50, 84]]],
  z: [[[28, 28], [72, 28], [28, 82], [72, 82]]]
};

function letterStrokes(letter) {
  const rows = LETTERS[String(letter || '').toLowerCase()] || LETTERS.o;
  return rows.map(poly);
}

export function traceStrokes(kind, name) {
  if (kind === 'number') return (DIGITS[String(name)] || DIGITS[0])();
  if (kind === 'letter') return letterStrokes(name);
  return (SHAPES[name] || SHAPES.circle)();
}

function pathD(strokes) {
  return strokes.map(stroke => stroke.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')).join(' ');
}

export function mountTrace(root, { kind = 'shape', name = 'circle', guide = 8, fade = false, tolerance = 14, reduced = false, onMiss, onDrive, onDone } = {}) {
  stopTrace();
  const session = {
    dead: false,
    cleanups: [],
    destroy() {
      if (this.dead) return;
      this.dead = true;
      this.cleanups.forEach(fn => fn());
      if (active === this) active = null;
    }
  };
  active = session;
  const call = (fn, arg) => { try { fn?.(arg); } catch { /* the host owns errors */ } };
  const strokes = traceStrokes(kind, name);
  let stroke = 0;
  let index = 0;
  let drawing = false;
  let held = false;
  let lastPoint = null;
  let missed = false;
  let done = false;
  let fadeTimer = 0;
  let frame = 0;

  root.innerHTML = `<div class="trace-play${reduced ? ' plain' : ''}"><svg class="trace-board" viewBox="0 0 100 100" role="img" aria-label="Trace ${name}"><path class="trace-guide"/><polyline class="trace-ink"/><circle class="trace-start" r="3.2"/><g class="trace-car" visibility="hidden"><ellipse cx="0" cy="0.8" rx="6.4" ry="8.6" fill="#244b3d22"/><rect x="-6.5" y="2.2" width="2.7" height="4.4" rx="1" fill="#1b1b1b"/><rect x="3.8" y="2.2" width="2.7" height="4.4" rx="1" fill="#1b1b1b"/><rect x="-6.2" y="-6.6" width="2.5" height="4" rx="1" fill="#1b1b1b"/><rect x="3.7" y="-6.6" width="2.5" height="4" rx="1" fill="#1b1b1b"/><path d="M-4.3 6.8 Q-4.8 0.6 -3.7 -5.4 Q-2.2 -8.4 0 -8.4 Q2.2 -8.4 3.7 -5.4 Q4.8 0.6 4.3 6.8 Q2.4 7.8 0 7.8 Q-2.4 7.8 -4.3 6.8 Z" fill="#e23b2f" stroke="#244b3d" stroke-width="0.45"/><path d="M-2.5 -0.8 Q-3 -4.4 0 -4.8 Q3 -4.4 2.5 -0.8 Z" fill="#f2fbff" stroke="#244b3d" stroke-width="0.28"/><path d="M-2.2 -0.4 H2.2 L1.5 3.6 H-1.5 Z" fill="#9d241c"/><ellipse cx="-1.6" cy="-6.5" rx="0.95" ry="0.55" fill="#fff4c4"/><ellipse cx="1.6" cy="-6.5" rx="0.95" ry="0.55" fill="#fff4c4"/></g></svg></div>`;
  const svg = root.querySelector('.trace-board');
  const guidePath = root.querySelector('.trace-guide');
  const ink = root.querySelector('.trace-ink');
  const start = root.querySelector('.trace-start');
  const car = root.querySelector('.trace-car');
  guidePath.setAttribute('d', pathD(strokes));
  guidePath.style.strokeWidth = String(guide);

  const paint = () => {
    const current = strokes[stroke] || [];
    const shown = current.slice(0, Math.max(1, index + 1));
    ink.setAttribute('points', shown.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
    const dot = current[0] || { x: 50, y: 50 };
    start.setAttribute('cx', dot.x.toFixed(1));
    start.setAttribute('cy', dot.y.toFixed(1));
    start.setAttribute('visibility', done || !current.length ? 'hidden' : 'visible');
  };

  const scheduleFade = () => {
    clearTimeout(fadeTimer);
    guidePath.classList.remove('faded');
    if (!fade || done) return;
    fadeTimer = setTimeout(() => {
      if (!done) guidePath.classList.add('faded');
    }, reduced ? 2400 : 1400);
  };

  const localPoint = event => {
    const rect = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100
    };
  };

  const miss = () => {
    drawing = false;
    stroke = 0;
    index = 0;
    missed = true;
    paint();
    scheduleFade();
    call(onMiss);
  };

  const heading = (route, at) => {
    const here = route[at];
    let from = here;
    let to = null;
    for (let i = at + 1; i < route.length; i++) {
      if (Math.hypot(route[i].x - here.x, route[i].y - here.y) > 0.4) { to = route[i]; break; }
    }
    if (!to) {
      for (let i = at - 1; i >= 0; i--) {
        if (Math.hypot(route[i].x - here.x, route[i].y - here.y) > 0.4) { from = route[i]; to = here; break; }
      }
    }
    if (!to) return 0;
    return Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI + 90;
  };

  const drive = () => {
    const route = strokes.flat();
    if (!route.length) { call(onDone, !missed); return; }
    car.setAttribute('visibility', 'visible');
    call(onDrive);
    const started = performance.now();
    const duration = reduced ? 2400 : Math.min(2600, Math.max(1500, route.length * 24));
    const step = now => {
      if (session.dead) return;
      const t = Math.min(1, (now - started) / duration);
      const at = Math.min(route.length - 1, Math.max(0, Math.floor(t * Math.max(1, route.length - 1))));
      const p = route[at];
      if (!p) { call(onDone, !missed); return; }
      car.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${heading(route, at).toFixed(1)})`);
      if (t < 1) frame = requestAnimationFrame(step);
      else call(onDone, !missed);
    };
    frame = requestAnimationFrame(step);
  };

  const finish = () => {
    if (done) return;
    done = true;
    drawing = false;
    clearTimeout(fadeTimer);
    guidePath.classList.remove('faded');
    ink.setAttribute('points', strokes.flat().map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
    start.setAttribute('visibility', 'hidden');
    drive();
  };

  const progress = path => index / Math.max(1, path.length - 1);

  const completeStroke = () => {
    if (done) return;
    stroke += 1;
    index = 0;
    drawing = false;
    if (stroke >= strokes.length) finish();
    else paint();
  };

  const down = event => {
    if (done || session.dead) return;
    const point = localPoint(event);
    const path = strokes[stroke];
    if (!path) return;
    const gate = index === 0 ? path[0] : path[Math.min(index, path.length - 1)];
    if (!traceOnPath(point, [gate], tolerance)) return;
    held = true;
    drawing = true;
    lastPoint = point;
    svg.setPointerCapture?.(event.pointerId);
  };

  const move = event => {
    if (done || session.dead) return;
    const point = localPoint(event);
    lastPoint = point;
    if (!drawing) {
      if (!held || stroke === 0) return;
      const gate = strokes[stroke]?.[0];
      if (gate && traceOnPath(point, [gate], tolerance)) drawing = true;
      return;
    }
    const path = strokes[stroke];
    if (!path) return;
    if (!traceOnPath(point, path, tolerance)) {
      miss();
      return;
    }
    let nearest = index;
    let best = Infinity;
    const from = Math.max(0, index - 2);
    const to = Math.min(path.length - 1, index + 10);
    for (let i = from; i <= to; i++) {
      const dist = Math.hypot(path[i].x - point.x, path[i].y - point.y);
      if (dist < best) { best = dist; nearest = i; }
    }
    if (nearest > index) index = nearest;
    const end = path[path.length - 1];
    if (end && progress(path) >= 0.45 && Math.hypot(end.x - point.x, end.y - point.y) <= tolerance) index = path.length - 1;
    paint();
    if (index >= path.length - 1) completeStroke();
  };

  const up = () => {
    if (drawing && !done && lastPoint) {
      const path = strokes[stroke] || [];
      const end = path[path.length - 1];
      const close = end && Math.hypot(end.x - lastPoint.x, end.y - lastPoint.y) <= tolerance;
      if (path.length && (progress(path) >= 0.88 || (progress(path) >= 0.45 && close))) completeStroke();
    }
    held = false;
    drawing = false;
  };

  svg.addEventListener('pointerdown', down);
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', up);
  session.cleanups.push(() => {
    svg.removeEventListener('pointerdown', down);
    svg.removeEventListener('pointermove', move);
    svg.removeEventListener('pointerup', up);
    svg.removeEventListener('pointercancel', up);
    clearTimeout(fadeTimer);
    cancelAnimationFrame(frame);
  });
  paint();
  scheduleFade();
  return session;
}
