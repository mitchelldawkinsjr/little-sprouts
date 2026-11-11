/**
 * Light the lamp — glow bugs wait on the grass. The right one rises into
 * the firefly jar on the stump. A wrong bug flutters away. When the round
 * is done, the jar glows. Little Sprouts original garden scene.
 */
import { questionHolding } from '../lib/hold.js?v=hold2';
import { lampPick, lampSky, lampStones } from '../logic.mjs?v=lamp';

const ROCK = ['#f4e8a0', '#e8d070', '#d4c45a', '#c8b84a', '#fff2b0'];

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
  host.innerHTML = `<div class="lamp" role="application" aria-label="Tap the glow bug with the right answer. It rises into the firefly jar."><canvas></canvas></div>`;
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
    const glow = stone.fill || ROCK[0];
    ctx.fillStyle = 'rgba(255, 230, 120, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.72, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a3020';
    ctx.beginPath();
    ctx.arc(-r * 0.18, -r * 0.08, r * 0.1, 0, Math.PI * 2);
    ctx.arc(r * 0.18, -r * 0.08, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40, 50, 30, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, r * 0.1);
    ctx.quadraticCurveTo(-r * 0.9, -r * 0.2, -r * 0.7, -r * 0.55);
    ctx.moveTo(r * 0.55, r * 0.1);
    ctx.quadraticCurveTo(r * 0.9, -r * 0.2, r * 0.7, -r * 0.55);
    ctx.stroke();
    if (stone.shape) drawMark(ctx, stone.shape, 0, r * 0.55, r * 1.6, '#244b3d');
    else if (stone.label) {
      ctx.fillStyle = '#244b3d';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fitFont(ctx, stone.label, r * 1.7, Math.max(11, r * 0.5));
      ctx.fillText(stone.label, 0, r * 0.95);
    }
    ctx.restore();
  };
  const paintCourse = (choice, box) => {
    ctx.fillStyle = 'rgba(255, 230, 120, 0.35)';
    ctx.beginPath();
    ctx.ellipse(box.x + box.w / 2, box.y + box.h / 2, box.w * 0.55, box.h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = choice.fill || ROCK[0];
    ctx.beginPath();
    ctx.ellipse(box.x + box.w / 2, box.y + box.h / 2, box.w * 0.32, box.h * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    if (choice.shape) drawMark(ctx, choice.shape, box.x + box.w / 2, box.y + box.h / 2, Math.min(box.w, box.h) * 1.2, '#244b3d');
    else if (choice.label) {
      ctx.fillStyle = '#244b3d';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fitFont(ctx, choice.label, box.w * 0.9, Math.min(14, box.h * 0.65));
      ctx.fillText(choice.label, box.x + box.w / 2, box.y + box.h / 2);
    }
  };
  const draw = (w, h) => {
    view = { w, h };
    const layout = tower();
    const dayTop = mix('#9ec8e0', '#1a2040', sky);
    const dayBottom = mix('#d8e8c8', '#243048', sky);
    const wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, dayTop);
    wash.addColorStop(0.55, dayBottom);
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    if (sky > 0.3) {
      ctx.fillStyle = `rgba(255, 245, 180, ${0.2 + sky * 0.55})`;
      for (let i = 0; i < 22; i++) {
        const sx = ((i * 97) % 100) / 100 * w;
        const sy = ((i * 53) % 45) / 100 * h * 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5 + (i % 3) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = mix('#7f9f62', '#2a3c28', sky);
    ctx.fillRect(0, h * 0.68, w, h * 0.32);
    ctx.fillStyle = mix('#8eae62', '#324830', sky);
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.78, w * 0.42, h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    const stumpX = w / 2;
    const stumpY = layout.baseY + 8;
    ctx.fillStyle = mix('#8b6540', '#4a3220', sky * 0.3);
    roundBox(ctx, stumpX - 36, stumpY, 72, 28, 8);
    ctx.fill();
    ctx.fillStyle = mix('#a07848', '#5a3c28', sky * 0.25);
    ctx.beginPath();
    ctx.ellipse(stumpX, stumpY + 4, 40, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    const jarX = stumpX;
    const jarBottom = layout.baseY;
    const jarTop = courses.length ? courseBox(courses.length - 1, layout).y - 18 : jarBottom - 40;
    const jarH = Math.max(48, jarBottom - jarTop);
    const jarW = Math.min(88, w * 0.2);
    ctx.fillStyle = mix('#d8ece8', '#6a8a88', sky * 0.25);
    ctx.globalAlpha = 0.55 + sky * 0.2;
    roundBox(ctx, jarX - jarW / 2, jarTop, jarW, jarH, 18);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = mix('#6a8a82', '#3a5050', sky * 0.3);
    ctx.lineWidth = 3;
    roundBox(ctx, jarX - jarW / 2, jarTop, jarW, jarH, 18);
    ctx.stroke();
    ctx.fillStyle = mix('#c4a070', '#6a5030', sky * 0.2);
    roundBox(ctx, jarX - jarW * 0.28, jarTop - 10, jarW * 0.56, 14, 4);
    ctx.fill();
    courses.forEach((choice, i) => paintCourse(choice, courseBox(i, layout)));
    if (sky > 0.5) {
      ctx.save();
      ctx.globalAlpha = 0.25 + (sky - 0.5) * 0.55;
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath();
      ctx.ellipse(jarX, jarTop + jarH * 0.45, jarW * 0.7, jarH * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (flyer) {
      const r = 26;
      paintStone(flyer.choice, flyer.x, flyer.y, r);
    }
    const spots = shore();
    choices.forEach((stone, i) => {
      const spot = spots[i];
      if (!spot) return;
      const bob = reduced ? 0 : Math.sin(spin * 2.4 + i) * 3;
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
