/**
 * Merge jar — drop tokens. Two of the same that touch become the next one.
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

  root.innerHTML = `<div class="merge-play${reduced ? ' plain' : ''}"><p class="merge-next"></p><div class="merge-jar"><canvas></canvas></div></div>`;
  const next = root.querySelector('.merge-next');
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = Math.max(240, rect.width);
    height = Math.max(240, rect.height);
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const radiusFor = () => Math.max(22, Math.min(width, height) * (size / 520));

  const paintNext = () => {
    const item = waiting[0];
    next.textContent = item ? `Next: ${item.label}` : (done ? 'Made.' : 'Jar');
  };

  const drawBody = body => {
    ctx.beginPath();
    ctx.fillStyle = body.made ? '#e5f0dc' : '#f7f3e8';
    ctx.strokeStyle = '#32634e';
    ctx.lineWidth = 3;
    ctx.arc(body.x, body.y, body.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (body.draw === 'shape') {
      ctx.fillStyle = '#5d7a45';
      drawShape(ctx, body.label, body.x, body.y - 2, body.r * 0.42);
    } else {
      ctx.fillStyle = '#244b3d';
      ctx.font = `700 ${Math.max(16, body.r * 0.62)}px Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(body.label, body.x, body.y);
    }
  };

  const paint = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#9db08c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 28);
    ctx.lineTo(width - 18, 28);
    ctx.stroke();
    const x = 18 + aim * (width - 36);
    ctx.fillStyle = '#32634e';
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x - 7, 6);
    ctx.lineTo(x + 7, 6);
    ctx.closePath();
    ctx.fill();
    bodies.forEach(drawBody);
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
    const rect = canvas.getBoundingClientRect();
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
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  window.addEventListener('keydown', key);
  window.addEventListener('resize', resize);
  session.cleanups.push(() => {
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    window.removeEventListener('keydown', key);
    window.removeEventListener('resize', resize);
    cancelAnimationFrame(frame);
  });
  paintNext();
  frame = requestAnimationFrame(step);
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('aria-label', 'Drop tokens into the jar. Left and right aim. Space drops.');
  return session;
}
