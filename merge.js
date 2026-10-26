/**
 * Merge jar — drop tokens. Two of the same that touch become the next one.
 * Matching tokens melt together with the gooey blur from Cassie Evans’s blobby background.
 * The tokens are drawn here. This is not a fruit-merge game.
 */
import { mergePromote } from './logic.mjs?v=learn-three';

let active = null;

export function stopMerge() {
  active?.destroy();
  active = null;
}

function drawShape(ctx, name, x, y, r) {
  ctx.beginPath();
  if (name === 'triangle') {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y + r * 0.8);
    ctx.lineTo(x - r, y + r * 0.8);
    ctx.closePath();
  } else if (name === 'square' || name === 'rectangle') {
    const w = name === 'rectangle' ? r * 1.35 : r;
    const h = name === 'rectangle' ? r * 0.8 : r;
    ctx.rect(x - w, y - h, w * 2, h * 2);
  } else if (name === 'diamond') {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  } else if (name === 'star') {
    for (let i = 0; i <= 10; i++) {
      const radius = i % 2 ? r * 0.45 : r;
      const a = -Math.PI / 2 + (i % 10) * Math.PI / 5;
      const px = x + Math.cos(a) * radius;
      const py = y + Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (name === 'hexagon') {
    for (let i = 0; i <= 6; i++) {
      const a = -Math.PI / 2 + (i % 6) * Math.PI / 3;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (name === 'oval') {
    ctx.ellipse(x, y, r * 1.25, r * 0.8, 0, 0, Math.PI * 2);
  } else ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function mountMerge(root, { queue = [], chain = [], target = '', size = 64, reduced = false, onMiss, onDone } = {}) {
  stopMerge();
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
  const waiting = queue.map(item => ({ ...item }));
  const bodies = [];
  let missed = false;
  let done = false;
  let frame = 0;
  let aim = 0.5;
  let width = 360;
  let height = 420;

  root.innerHTML = `<div class="merge-play${reduced ? ' plain' : ''}"><p class="merge-next"></p><div class="merge-jar"><div class="merge-goo"></div><canvas class="merge-ink"></canvas></div><svg class="merge-filter" aria-hidden="true"><filter id="mergeGoo" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB"><feGaussianBlur id="mergeBlur" in="SourceGraphic" stdDeviation="8" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo"/></filter></svg></div>`;
  const next = root.querySelector('.merge-next');
  const jar = root.querySelector('.merge-jar');
  const goo = root.querySelector('.merge-goo');
  const ink = root.querySelector('.merge-ink');
  const ctx = ink.getContext('2d');
  const blur = root.querySelector('#mergeBlur');
  const layers = new Map();
  const colors = ['#5d7a45', '#3d6d8c', '#c47b4a', '#7a5ea7', '#b85c6a', '#2f7d72', '#a6842f'];
  const colorFor = id => {
    const text = String(id);
    let n = 0;
    for (let i = 0; i < text.length; i++) n += text.charCodeAt(i) * (i + 1);
    return colors[n % colors.length];
  };
  const fit = canvas => {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  const layer = id => {
    let canvas = layers.get(id);
    if (canvas) return canvas;
    canvas = document.createElement('canvas');
    goo.appendChild(canvas);
    layers.set(id, canvas);
    fit(canvas);
    return canvas;
  };

  const resize = () => {
    const rect = jar.getBoundingClientRect();
    width = Math.max(240, rect.width);
    height = Math.max(240, rect.height);
    if (blur) blur.setAttribute('stdDeviation', reduced ? '0' : String(Math.min(10, Math.max(5, radiusFor() * 0.16))));
    fit(ink);
    layers.forEach(fit);
  };

  const radiusFor = () => Math.max(22, Math.min(width, height) * (size / 520));

  const paintNext = () => {
    const item = waiting[0];
    next.textContent = item ? `Next: ${item.label}` : (done ? 'Made.' : 'Jar');
  };

  const mark = (x, y, r, item, alpha = 1) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#faf9f5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (item.draw === 'shape') drawShape(ctx, item.label, x, y, r * 0.42);
    else {
      ctx.font = `700 ${Math.max(16, r * 0.55)}px Outfit, sans-serif`;
      ctx.fillText(item.label, x, y);
    }
    ctx.restore();
  };

  const paint = () => {
    layers.forEach(canvas => canvas.getContext('2d').clearRect(0, 0, width, height));
    bodies.forEach(body => {
      const blob = layer(body.id).getContext('2d');
      blob.fillStyle = colorFor(body.id);
      blob.beginPath();
      blob.arc(body.x, body.y, body.r, 0, Math.PI * 2);
      blob.fill();
    });
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#9db08c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, 36);
    ctx.lineTo(16, height - 18);
    ctx.quadraticCurveTo(width / 2, height + 10, width - 16, height - 18);
    ctx.lineTo(width - 16, 36);
    ctx.stroke();
    const x = 18 + aim * (width - 36);
    const preview = waiting[0];
    if (preview && !done) {
      const r = radiusFor();
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = colorFor(preview.id);
      ctx.beginPath();
      ctx.arc(x, r + 8, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      mark(x, r + 8, r, preview);
    }
    ctx.fillStyle = '#32634e';
    ctx.beginPath();
    ctx.moveTo(x, 16);
    ctx.lineTo(x - 7, 4);
    ctx.lineTo(x + 7, 4);
    ctx.closePath();
    ctx.fill();
    bodies.forEach(body => mark(body.x, body.y, body.r, body));
  };

  const separate = (a, b) => {
    const dx = b.x - a.x || 0.01;
    const dy = b.y - a.y || 0.01;
    const dist = Math.hypot(dx, dy) || 0.01;
    const overlap = a.r + b.r - dist;
    if (overlap <= 0) return;
    const nx = dx / dist;
    const ny = dy / dist;
    a.x -= nx * overlap / 2;
    a.y -= ny * overlap / 2;
    b.x += nx * overlap / 2;
    b.y += ny * overlap / 2;
    const push = reduced ? 0.4 : 1.1;
    a.vx -= nx * push;
    a.vy -= ny * push;
    b.vx += nx * push;
    b.vy += ny * push;
  };

  const succeed = (a, b, id) => {
    done = true;
    const label = String(id).startsWith('big:') ? a.label : String(id);
    bodies.splice(0, bodies.length, {
      id,
      label,
      draw: a.draw,
      made: true,
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      vx: 0,
      vy: 0,
      r: Math.max(a.r, b.r) + 6
    });
    paintNext();
    setTimeout(() => { if (!session.dead) call(onDone, !missed); }, reduced ? 700 : 420);
  };

  const drop = () => {
    if (done || session.dead || !waiting.length) return;
    const item = waiting.shift();
    const r = radiusFor();
    const x = 18 + aim * (width - 36);
    bodies.push({ ...item, x: Math.min(width - r - 8, Math.max(r + 8, x)), y: r + 8, vx: 0, vy: 0, r });
    paintNext();
  };

  const step = () => {
    if (session.dead) return;
    frame = requestAnimationFrame(step);
    if (!done) {
      const gravity = reduced ? 0.12 : 0.28;
      bodies.forEach(body => {
        if (body.made) return;
        body.vy += gravity;
        body.vx *= 0.995;
        body.x += body.vx;
        body.y += body.vy;
        if (body.x < body.r + 8) { body.x = body.r + 8; body.vx *= -0.2; }
        if (body.x > width - body.r - 8) { body.x = width - body.r - 8; body.vx *= -0.2; }
        if (body.y > height - body.r - 10) { body.y = height - body.r - 10; body.vy *= -0.18; body.vx *= 0.9; }
      });
      for (let i = 0; i < bodies.length && !done; i++) {
        for (let j = i + 1; j < bodies.length && !done; j++) {
          const a = bodies[i];
          const b = bodies[j];
          const dist = Math.hypot(b.x - a.x, b.y - a.y);
          if (dist >= a.r + b.r) {
            if (a.touch === b) a.touch = null;
            if (b.touch === a) b.touch = null;
            continue;
          }
          const next = mergePromote(a.id, b.id, chain);
          if (next != null && String(next) === String(target)) {
            succeed(a, b, next);
            break;
          }
          if (String(a.id) === String(b.id) && a.touch !== b) {
            a.touch = b;
            b.touch = a;
            if (!a.cool) {
              a.cool = true;
              setTimeout(() => { a.cool = false; }, 800);
              missed = true;
              call(onMiss);
            }
          }
          separate(a, b);
        }
      }
    }
    paint();
  };

  const pointAim = event => {
    const rect = jar.getBoundingClientRect();
    aim = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  };

  const down = event => {
    pointAim(event);
    drop();
  };
  const move = event => { if (!done) pointAim(event); };
  const key = event => {
    if (done) return;
    if (event.key === 'ArrowLeft') { aim = Math.max(0, aim - 0.06); event.preventDefault(); }
    if (event.key === 'ArrowRight') { aim = Math.min(1, aim + 0.06); event.preventDefault(); }
    if (event.key === ' ' || event.key === 'Enter') { drop(); event.preventDefault(); }
  };

  resize();
  jar.addEventListener('pointerdown', down);
  jar.addEventListener('pointermove', move);
  window.addEventListener('keydown', key);
  window.addEventListener('resize', resize);
  session.cleanups.push(() => {
    jar.removeEventListener('pointerdown', down);
    jar.removeEventListener('pointermove', move);
    window.removeEventListener('keydown', key);
    window.removeEventListener('resize', resize);
    cancelAnimationFrame(frame);
  });
  paintNext();
  frame = requestAnimationFrame(step);
  jar.tabIndex = 0;
  jar.setAttribute('aria-label', 'Drop tokens into the jar. Left and right aim. Space drops.');
  return session;
}
