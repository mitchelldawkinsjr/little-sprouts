/**
 * Light the lamp — stones wait on the shore. The right one rises into the tower.
 * A wrong stone splashes. Night falls when the round is done, and the lamp turns on.
 * The island, the water, and the lamp follow the pure CSS lighthouse.
 * These stones and the questions are drawn here.
 */
import { questionHolding } from './hold.js?v=ask-first';
import { lampPick, lampSky, lampStones } from './logic.mjs?v=lamp';

const ROCK = ['#e7d3b0', '#d7b48a', '#c4a574', '#b08968', '#efe0c4'];

let active = null;

export function stopLamp() {
  active?.destroy();
  active = null;
}

function call(fn, arg) {
  try { return fn?.(arg); }
  catch { return undefined; }
}

function ink(fill) {
  if (!fill || fill[0] !== '#' || fill.length < 7) return '#172031';
  const r = parseInt(fill.slice(1, 3), 16);
  const g = parseInt(fill.slice(3, 5), 16);
  const b = parseInt(fill.slice(5, 7), 16);
  return r * 0.3 + g * 0.59 + b * 0.11 > 170 ? '#172031' : '#fffaf0';
}

function mix(a, b, t) {
  const amount = Math.max(0, Math.min(1, t));
  const parse = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const from = parse(a);
  const to = parse(b);
  const c = from.map((v, i) => Math.round(v + (to[i] - v) * amount));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function fitFont(ctx, text, maxWidth, start) {
  let size = start;
  ctx.font = `700 ${size}px Outfit, sans-serif`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `700 ${size}px Outfit, sans-serif`;
  }
  return size;
}

function roundBox(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function drawMark(ctx, shape, x, y, s, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill;
  ctx.beginPath();
  const k = s * 0.28;
  if (shape === 'circle' || shape === 'oval') ctx.ellipse(0, 0, k, shape === 'oval' ? k * 0.68 : k, 0, 0, Math.PI * 2);
  else if (shape === 'triangle') { ctx.moveTo(0, -k); ctx.lineTo(k, k * 0.75); ctx.lineTo(-k, k * 0.75); ctx.closePath(); }
  else if (shape === 'diamond') { ctx.moveTo(0, -k); ctx.lineTo(k, 0); ctx.lineTo(0, k); ctx.lineTo(-k, 0); ctx.closePath(); }
  else if (shape === 'star' || shape === 'hexagon') ctx.arc(0, 0, k * 0.85, 0, Math.PI * 2);
  else ctx.rect(-k, -k * 0.7, k * 2, k * 1.4);
  ctx.fill();
  ctx.restore();
}

function plainStones(count) {
  return Array.from({ length: count }, (_, i) => ({
    label: '',
    shape: '',
    fill: ROCK[i % ROCK.length],
    ok: true,
    splash: 0
  }));
}

export function mountLamp(root, { board = {}, reduced, freePlay, rounds = 5, nextQuestion, onPrompt, onMiss, onClear, onFinished } = {}) {
  stopLamp();
  if (!root) return;
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

  const spec = {
    choices: board.choices || 3,
    courses: board.courses || 6
  };
  const host = document.createElement('div');
  host.className = 'arcade lamp-play';
  host.innerHTML = `<div class="lamp" role="application" aria-label="Tap the stone with the right answer. It rises into the lighthouse."><canvas></canvas></div>`;
  root.replaceChildren(host);
  const stage = host.querySelector('.lamp');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  let choices = [];
  let courses = [];
  let flyer = null;
  let phase = 'play';
  let slipped = false;
  let sky = 0;
  let spin = 0;
  let nightHold = 0;
  let ended = false;
  let last = 0;
  let view = { w: 520, h: 560 };

  const goalCount = () => (freePlay ? spec.courses : Math.max(1, rounds));
  const shake = () => {
    stage.classList.remove('shake');
    void stage.offsetWidth;
    stage.classList.add('shake');
  };
  const begin = () => {
    if (freePlay) {
      choices = plainStones(spec.choices);
      phase = 'play';
      return;
    }
    const pack = call(nextQuestion);
    if (!pack?.choices?.length) {
      phase = 'night';
      nightHold = 0;
      return;
    }
    slipped = false;
    choices = pack.choices.map(choice => ({
      label: choice.shape ? '' : String(choice.label ?? ''),
      shape: choice.shape || '',
      fill: choice.fill || ROCK[0],
      ok: !!choice.ok,
      splash: 0
    }));
    phase = 'play';
    call(onPrompt);
  };
  const shore = () => lampStones(choices.length, view.w, view.h);
  const tower = () => {
    const { w, h } = view;
    const baseY = h * 0.62;
    const top = h * 0.14;
    const need = Math.max(goalCount(), courses.length, 1);
    const ch = Math.min(24, (baseY - top - 46) / need);
    const cw = Math.min(72, w * 0.16);
    return { x: w / 2 - cw / 2, baseY, ch, cw };
  };
  const courseBox = (index, layout = tower()) => ({
    x: layout.x,
    y: layout.baseY - (index + 1) * layout.ch,
    w: layout.cw,
    h: Math.max(8, layout.ch - 2)
  });
  const finishNight = () => {
    if (ended || session.dead) return;
    if (freePlay) {
      courses = [];
      nightHold = 0;
      begin();
      return;
    }
    ended = true;
    phase = 'done';
    call(onFinished);
  };
  const land = () => {
    if (!flyer) return;
    courses.push(flyer.choice);
    flyer = null;
    const built = courses.length >= goalCount();
    call(onClear, !slipped);
    if (freePlay && built) {
      phase = 'night';
      nightHold = 0;
      return;
    }
    begin();
  };
  const choose = index => {
    if (session.dead || phase !== 'play' || questionHolding()) return;
    if (index < 0 || index >= choices.length) return;
    const choice = choices[index];
    if (choice.splash > 0.2) return;
    if (!freePlay && !choice.ok) {
      choice.splash = 1;
      slipped = true;
      shake();
      call(onMiss, 'stone');
      return;
    }
    const spots = shore();
    const from = spots[index] || { x: view.w / 2, y: view.h * 0.8 };
    const box = courseBox(courses.length);
    flyer = {
      choice,
      fromX: from.x,
      fromY: from.y,
      x: from.x,
      y: from.y,
      toX: box.x + box.w / 2,
      toY: box.y + box.h / 2,
      t: 0
    };
    choices.splice(index, 1);
    phase = 'rise';
  };

  const paintStone = (stone, x, y, r) => {
    ctx.save();
    ctx.translate(x, y + Math.sin((stone.splash || 0) * Math.PI) * r * 0.45);
    ctx.fillStyle = 'rgba(20, 40, 48, 0.18)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.72, r * 0.7, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = stone.fill || ROCK[0];
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 250, 240, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.28, -r * 0.22, r * 0.28, r * 0.16, -0.4, 0, Math.PI * 2);
    ctx.fill();
    if (stone.shape) drawMark(ctx, stone.shape, 0, 0, r * 2.1, ink(stone.fill || ROCK[0]));
    else if (stone.label) {
      ctx.fillStyle = ink(stone.fill || ROCK[0]);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fitFont(ctx, stone.label, r * 1.5, Math.max(12, r * 0.55));
      ctx.fillText(stone.label, 0, 2);
    }
    ctx.restore();
  };
  const paintCourse = (choice, box) => {
    ctx.fillStyle = choice.fill || ROCK[0];
    roundBox(ctx, box.x, box.y, box.w, box.h, 4);
    ctx.fill();
    if (choice.shape) drawMark(ctx, choice.shape, box.x + box.w / 2, box.y + box.h / 2, Math.min(box.w, box.h) * 1.6, ink(choice.fill || ROCK[0]));
    else if (choice.label) {
      ctx.fillStyle = ink(choice.fill || ROCK[0]);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fitFont(ctx, choice.label, box.w * 0.84, Math.min(16, box.h * 0.7));
      ctx.fillText(choice.label, box.x + box.w / 2, box.y + box.h / 2);
    }
  };
  const paintTree = (x, y, scale) => {
    ctx.fillStyle = mix('#5c3a4a', '#2a1c28', sky);
    roundBox(ctx, x - 7 * scale, y - 70 * scale, 14 * scale, 78 * scale, 6);
    ctx.fill();
    ctx.fillStyle = mix('#7ea34a', '#243024', sky);
    ctx.beginPath();
    ctx.arc(x - 16 * scale, y - 62 * scale, 22 * scale, 0, Math.PI * 2);
    ctx.arc(x + 14 * scale, y - 70 * scale, 20 * scale, 0, Math.PI * 2);
    ctx.arc(x, y - 86 * scale, 18 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mix('#e0a24a', '#3a2a18', sky);
    ctx.beginPath();
    ctx.arc(x + 8 * scale, y - 78 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.fill();
  };
  const draw = (w, h) => {
    view = { w, h };
    const layout = tower();
    const dayTop = mix('#f6c9a0', '#141b33', sky);
    const dayBottom = mix('#f7efe4', '#1a2744', sky);
    const wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, dayTop);
    wash.addColorStop(0.62, dayBottom);
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    if (sky > 0.35) {
      ctx.fillStyle = `rgba(255, 250, 240, ${0.15 + sky * 0.7})`;
      for (let i = 0; i < 18; i++) {
        const sx = ((i * 97) % 100) / 100 * w;
        const sy = ((i * 53) % 40) / 100 * h * 0.42;
        ctx.fillRect(sx, sy, 2, 2);
      }
    }
    const sunX = w * (0.72 - sky * 0.38);
    const sunY = h * (0.2 + sky * 0.38);
    ctx.fillStyle = sky > 0.72 ? '#f4f0e4' : '#ffd27a';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sky > 0.72 ? 16 : 28, 0, Math.PI * 2);
    ctx.fill();
    const sea = mix('#8ec6d4', '#163044', sky);
    ctx.fillStyle = sea;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
    ctx.fillStyle = mix('#c9e4ea', '#20485c', sky);
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.74);
    for (let x = 0; x <= w; x += 16) ctx.lineTo(x, h * 0.74 + Math.sin(x * 0.04 + spin * 2) * 3);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = mix('#8eae62', '#243428', sky);
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.78, w * 0.34, h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    paintTree(w * 0.24, h * 0.7, Math.min(1.15, w / 520));
    paintTree(w * 0.76, h * 0.72, Math.min(1, w / 560));
    const lampTop = courses.length ? courseBox(courses.length - 1, layout).y : layout.baseY;
    ctx.fillStyle = mix('#c4a574', '#6d5438', sky * 0.35);
    roundBox(ctx, layout.x - 8, layout.baseY, layout.cw + 16, 16, 3);
    ctx.fill();
    courses.forEach((choice, i) => paintCourse(choice, courseBox(i, layout)));
    const roomY = lampTop - 34;
    const roomX = layout.x + layout.cw / 2;
    ctx.fillStyle = mix('#f4efe6', '#d7c7a4', sky * 0.2);
    roundBox(ctx, roomX - 16, roomY, 32, 26, 3);
    ctx.fill();
    const glow = sky > 0.55 ? mix('#ffb15a', '#ffe08a', Math.min(1, (sky - 0.55) / 0.35)) : '#c9bba6';
    ctx.fillStyle = glow;
    ctx.fillRect(roomX - 10, roomY + 6, 20, 12);
    ctx.fillStyle = mix('#e15b4a', '#8a3030', sky * 0.2);
    ctx.beginPath();
    ctx.moveTo(roomX - 20, roomY);
    ctx.lineTo(roomX, roomY - 16);
    ctx.lineTo(roomX + 20, roomY);
    ctx.fill();
    if (sky > 0.62) {
      ctx.save();
      ctx.translate(roomX, roomY + 12);
      ctx.rotate(Math.sin(spin) * 0.55);
      ctx.globalAlpha = 0.28 + (sky - 0.62) * 0.5;
      ctx.fillStyle = '#ffe7a8';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(150, -36);
      ctx.lineTo(150, 36);
      ctx.fill();
      ctx.rotate(Math.PI);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(120, -28);
      ctx.lineTo(120, 28);
      ctx.fill();
      ctx.restore();
    }
    if (flyer) {
      const r = 28;
      paintStone(flyer.choice, flyer.x, flyer.y, r);
    }
    const spots = shore();
    choices.forEach((stone, i) => {
      const spot = spots[i];
      if (!spot) return;
      const bob = reduced ? 0 : Math.sin(spin * 2 + i) * 2;
      paintStone(stone, spot.x, spot.y + bob, spot.r);
    });
  };

  const frame = now => {
    if (session.dead) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    spin += reduced ? dt * 0.2 : dt;
    choices.forEach(stone => {
      if (stone.splash > 0) stone.splash = Math.max(0, stone.splash - dt * (reduced ? 4 : 1.7));
    });
    const goal = phase === 'night' || phase === 'done' ? 1 : lampSky(courses.length, goalCount());
    sky += (goal - sky) * Math.min(1, dt * (reduced ? 6 : 1.4));
    if (phase === 'rise' && flyer) {
      flyer.t = Math.min(1, flyer.t + dt / (reduced ? 0.12 : 0.46));
      const ease = 1 - (1 - flyer.t) * (1 - flyer.t);
      flyer.x = flyer.fromX + (flyer.toX - flyer.fromX) * ease;
      flyer.y = flyer.fromY + (flyer.toY - flyer.fromY) * ease;
      if (flyer.t >= 1) land();
    }
    if (phase === 'night') {
      if (sky > 0.96) nightHold += dt;
      if (nightHold > (reduced ? 0.25 : 1.25)) finishNight();
    }
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(240, rect.width || 520);
    const h = Math.max(280, rect.height || 560);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(w, h);
    if (!session.dead) session.raf = requestAnimationFrame(frame);
  };

  const pointOf = e => {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(240, rect.width || view.w);
    const h = Math.max(280, rect.height || view.h);
    return {
      x: (e.clientX - rect.left) * (w / Math.max(1, rect.width)),
      y: (e.clientY - rect.top) * (h / Math.max(1, rect.height))
    };
  };
  const onPointer = e => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    choose(lampPick(pointOf(e), shore()));
  };
  const typing = e => e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  const onKey = e => {
    if (document.querySelector('dialog[open]') || typing(e)) return;
    const n = Number(e.key);
    if (!n || n > choices.length) return;
    e.preventDefault();
    choose(n - 1);
  };
  canvas.addEventListener('pointerdown', onPointer);
  document.addEventListener('keydown', onKey);
  session.cleanups.push(() => {
    canvas.removeEventListener('pointerdown', onPointer);
    document.removeEventListener('keydown', onKey);
  });

  begin();
  session.raf = requestAnimationFrame(frame);
}
