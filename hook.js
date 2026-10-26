/**
 * Hook the fish — a learning cast for Little Sprouts.
 * The drop-and-steer loop follows the idea in Hooked (cnrasili/Hooked).
 * Pictures here are drawn on the canvas. That project's art and music are not used.
 */
import { questionHolding } from './hold.js?v=ask-first';

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const HUES = ['#e07a4c', '#e6b325', '#3d9a8a', '#7a6bb5', '#d45d7a'];
const PONDS = {
  pond: { sky: '#b9e2f2', shallow: '#7ec8e3', deep: '#2f86ad', sand: '#e7d3a4', weed: '#3e8f62' },
  cove: { sky: '#d5ead4', shallow: '#7eb489', deep: '#2f6a4e', sand: '#cbb892', weed: '#245c40' },
  deep: { sky: '#d5e4f2', shallow: '#6a9ec4', deep: '#1a4468', sand: '#d5e1ea', weed: '#8ec4ea' }
};

let active = null;

export function stopHook() {
  active?.destroy();
  active = null;
}

function paceOf(speed, reduced) {
  const calm = reduced ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return speed * (calm ? 0.55 : 1);
}

function fitFont(ctx, text, maxWidth) {
  let size = 20;
  const font = px => `700 ${px}px Outfit, sans-serif`;
  ctx.font = font(size);
  while (size > 11 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = font(size);
  }
}

function drawBoat(ctx, x, y) {
  ctx.fillStyle = '#f4efe4';
  ctx.fillRect(x - 3, y - 34, 6, 32);
  ctx.fillStyle = '#e7eddf';
  ctx.beginPath();
  ctx.moveTo(x + 3, y - 32);
  ctx.lineTo(x + 28, y - 14);
  ctx.lineTo(x + 3, y - 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8d5a3c';
  ctx.beginPath();
  ctx.moveTo(x - 46, y);
  ctx.lineTo(x + 46, y);
  ctx.quadraticCurveTo(x + 34, y + 22, x, y + 22);
  ctx.quadraticCurveTo(x - 34, y + 22, x - 46, y);
  ctx.fill();
  ctx.fillStyle = '#c4a484';
  ctx.fillRect(x - 18, y + 4, 36, 5);
}

function drawHook(ctx, x, y) {
  ctx.strokeStyle = '#24332c';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x + 2, y + 2, 11, Math.PI * 0.2, Math.PI * 1.25, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 4);
  ctx.lineTo(x, y - 12);
  ctx.stroke();
}

function drawFish(ctx, fish, w, h, now) {
  const x = fish.x * w;
  const y = fish.y * h + Math.sin(now / 420 + fish.phase) * 3;
  const face = fish.vx >= 0 ? 1 : -1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face, 1);
  ctx.fillStyle = fish.hue;
  ctx.beginPath();
  ctx.ellipse(0, 0, 48, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(-56, -14);
  ctx.lineTo(-56, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff8ee';
  ctx.beginPath();
  ctx.ellipse(6, 4, 26, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#24332c';
  ctx.beginPath();
  ctx.arc(26, -4, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#24332c';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fitFont(ctx, fish.label, 78);
  ctx.fillText(fish.label, x, y + 3);
}

function drawTrash(ctx, item, w, h) {
  const x = item.x * w;
  const y = item.y * h;
  if (item.kind === 'can') {
    ctx.fillStyle = '#8d98a3';
    ctx.fillRect(x - 10, y - 16, 20, 28);
    ctx.fillStyle = '#d4554a';
    ctx.fillRect(x - 10, y - 8, 20, 6);
    ctx.fillStyle = '#c5ced6';
    ctx.fillRect(x - 8, y - 20, 16, 6);
    return;
  }
  ctx.fillStyle = '#6b4a32';
  ctx.fillRect(x - 8, y - 18, 14, 22);
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 8, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPond(ctx, w, h, pond, t, wash) {
  const sky = h * 0.16;
  const sand = h * 0.9;
  if (wash) ctx.clearRect(0, 0, w, h);
  if (!wash) {
    const water = ctx.createLinearGradient(0, sky, 0, h);
    water.addColorStop(0, pond.shallow);
    water.addColorStop(1, pond.deep);
    ctx.fillStyle = pond.sky;
    ctx.fillRect(0, 0, w, sky + 8);
    ctx.fillStyle = water;
    ctx.fillRect(0, sky, w, h - sky);
  } else {
    ctx.fillStyle = 'rgba(186, 226, 242, 0.18)';
    ctx.fillRect(0, 0, w, sky + 8);
    ctx.fillStyle = 'rgba(32, 110, 150, 0.42)';
    ctx.fillRect(0, sky, w, h - sky);
  }
  ctx.fillStyle = wash ? 'rgba(231, 211, 164, 0.62)' : pond.sand;
  ctx.beginPath();
  ctx.moveTo(0, sand);
  ctx.quadraticCurveTo(w * 0.5, sand - 16, w, sand);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();
  ctx.strokeStyle = '#ffffff88';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const y = sky + 10 + i * 14;
    for (let x = 0; x <= w; x += 8) {
      const wave = Math.sin(x / 28 + t / 500 + i) * 3;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  ctx.fillStyle = pond.weed;
  [0.12, 0.78].forEach((nx, i) => {
    const x = nx * w;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.quadraticCurveTo(x + 10 + Math.sin(t / 600 + i) * 6, sand - 10, x - 4, sand - 36);
    ctx.lineTo(x + 6, sand - 28);
    ctx.quadraticCurveTo(x + 16, sand, x + 8, h);
    ctx.fill();
  });
}

export function mountHook(root, { prompt, choices, target, cast, reduced, onDone, onMiss, watchHands }) {
  stopHook();
  const reach = typeof watchHands === 'function';
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

  const pond = PONDS[cast?.id] || PONDS.pond;
  const drop = paceOf(cast?.drop || 0.14, reduced);
  const swim = paceOf(1, reduced);
  const list = [...choices];
  if (!list.some(choice => String(choice) === String(target))) list.push(target);
  let marked = false;
  const fish = list.map((choice, i) => {
    const ok = !marked && String(choice) === String(target);
    if (ok) marked = true;
    const span = Math.max(1, list.length - 1);
    return {
      label: String(choice),
      ok,
      x: 0.18 + ((i * 0.61) % 0.7),
      y: 0.38 + (i / span) * 0.46,
      vx: (i % 2 ? 0.1 : -0.1) * swim,
      hue: HUES[i % HUES.length],
      phase: i * 1.3
    };
  });
  const junk = Array.from({ length: cast?.trash || 0 }, (_, i) => ({
    kind: i % 2 ? 'can' : 'boot',
    x: 0.2 + i * 0.35,
    y: 0.48 + (i % 2) * 0.22,
    vx: (i % 2 ? -0.07 : 0.07) * swim
  }));
  const bubbles = [0.2, 0.55, 0.8].map((x, i) => ({ x, y: 0.4 + i * 0.15, r: 3 + i }));

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const label = reach
    ? `${prompt} Move your hand onto the fish with that answer.`
    : `${prompt} Steer the hook onto the fish with that answer.`;
  const steer = `<div class="steer"><button type="button" class="steer-btn" data-dir="left" aria-label="Move hook left">←</button><button type="button" class="steer-btn" data-dir="right" aria-label="Move hook right">→</button></div>`;
  const pondHtml = `<div class="pond" role="application" aria-label="${esc(label)}"><canvas></canvas><span class="pond-name">${esc(cast?.name || 'Sunny pond')}</span></div>`;
  root.innerHTML = reach
    ? `<div class="arcade"><div class="camstage hook-cam"><video playsinline muted autoplay></video>${pondHtml}<span class="hand" hidden></span><span class="hand" hidden></span><p class="camstatus" id="camstatus"></p></div>${steer}</div>`
    : `<div class="arcade">${pondHtml}${steer}</div>`;
  const stage = root.querySelector('.pond');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const hook = { x: 0.5, y: 0.36, dir: 1 };
  let axis = 0;
  let dragging = false;
  let steered = false;
  let missed = false;
  let phase = 'fish';
  let pauseUntil = 0;
  let caught = null;
  let last = 0;
  let width = 1;
  let height = 1;

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  const onResize = () => resize();
  window.addEventListener('resize', onResize);
  session.cleanups.push(() => window.removeEventListener('resize', onResize));

  const held = new Set();
  const publish = () => {
    axis = held.has('left') === held.has('right') ? 0 : held.has('left') ? -1 : 1;
    if (axis) steered = true;
  };
  const typing = e => e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  const keyDir = e => (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ? 'left'
    : e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ? 'right' : '');
  const onKey = e => {
    if (document.querySelector('dialog[open]') || typing(e)) return;
    const dir = keyDir(e);
    if (!dir) return;
    e.preventDefault();
    if (e.type === 'keydown' && e.repeat) return;
    if (e.type === 'keydown') held.add(dir);
    else held.delete(dir);
    publish();
  };
  let pointerId = null;
  const onDown = e => {
    if (e.button !== undefined && e.button !== 0) return;
    pointerId = e.pointerId;
    steered = true;
    dragging = true;
    stage.setPointerCapture?.(e.pointerId);
    const rect = stage.getBoundingClientRect();
    hook.x = clamp((e.clientX - rect.left) / rect.width, 0.12, 0.88);
  };
  const onMove = e => {
    if (e.pointerId !== pointerId || !dragging) return;
    const rect = stage.getBoundingClientRect();
    hook.x = clamp((e.clientX - rect.left) / rect.width, 0.12, 0.88);
  };
  const onUp = e => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    dragging = false;
  };
  const onButton = e => {
    const dir = e.currentTarget.dataset.dir === 'left' ? 'left' : 'right';
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (e.type === 'keydown' && e.repeat) return;
    if (e.type === 'keydown') held.add(dir);
    else held.delete(dir);
    publish();
  };
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);
  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
  root.querySelectorAll('[data-dir]').forEach(button => {
    button.addEventListener('pointerdown', e => {
      e.stopPropagation();
      held.add(button.dataset.dir === 'left' ? 'left' : 'right');
      publish();
    });
    button.addEventListener('pointerup', () => {
      held.delete(button.dataset.dir === 'left' ? 'left' : 'right');
      publish();
    });
    button.addEventListener('pointerleave', () => {
      held.delete(button.dataset.dir === 'left' ? 'left' : 'right');
      publish();
    });
    button.addEventListener('keydown', onButton);
    button.addEventListener('keyup', onButton);
  });
  session.cleanups.push(() => {
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup', onKey);
    stage.removeEventListener('pointerdown', onDown);
    stage.removeEventListener('pointermove', onMove);
    stage.removeEventListener('pointerup', onUp);
    stage.removeEventListener('pointercancel', onUp);
  });

  let hands = [];
  if (reach) session.cleanups.push(watchHands(next => { hands = next || []; }));

  const near = (nx, ny, radius) => {
    const dx = (nx - hook.x) * width;
    const dy = (ny - hook.y) * height;
    return dx * dx + dy * dy < radius * radius;
  };
  const miss = (kind, item, listName) => {
    if (phase !== 'fish') return;
    missed = true;
    phase = 'pause';
    pauseUntil = performance.now() + 420;
    const bag = listName === 'junk' ? junk : fish;
    const at = bag.indexOf(item);
    if (at >= 0) bag.splice(at, 1);
    stage.classList.add('shake');
    setTimeout(() => stage.classList.remove('shake'), 280);
    try { onMiss?.(kind); } catch { /* the hook still comes back */ }
  };
  const bite = item => {
    if (phase !== 'fish') return;
    if (!item.ok) { miss('fish', item, 'fish'); return; }
    phase = 'reel';
    caught = item;
    const at = fish.indexOf(item);
    if (at >= 0) fish.splice(at, 1);
  };

  const frame = now => {
    if (session.dead) return;
    try {
      if (!stage.isConnected) { session.destroy(); return; }
      const rect = stage.getBoundingClientRect();
      if (Math.abs(rect.width - width) > 1 || Math.abs(rect.height - height) > 1) resize();
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const paused = document.querySelector('dialog[open]') || questionHolding();
      if (!paused && phase === 'pause' && now >= pauseUntil) phase = 'fish';
      let handOn = false;
      if (reach && !paused && phase !== 'reel') {
        const up = hands.filter(h => h.up);
        if (up.length && !dragging && !axis) {
          handOn = true;
          steered = true;
          const hand = up.reduce((best, h) => h.y > best.y ? h : best);
          hook.x = clamp(hand.x, 0.12, 0.88);
          hook.y = clamp(hand.y, 0.2, 0.92);
        }
      }
      if (!paused && phase === 'fish') {
        for (const item of fish) {
          item.x += item.vx * dt;
          if (item.x < 0.14 || item.x > 0.86) item.vx *= -1;
        }
        for (const item of junk) {
          item.x += item.vx * dt;
          if (item.x < 0.12 || item.x > 0.88) item.vx *= -1;
        }
        bubbles.forEach(bubble => {
          bubble.y -= 0.03 * dt;
          if (bubble.y < 0.2) bubble.y = 0.88;
        });
      }
      if (!paused && phase === 'fish' && steered && !(reach && !handOn && !axis && !dragging)) {
        if (!dragging && axis && (!reach || !handOn)) hook.x = clamp(hook.x + axis * 0.62 * dt, 0.12, 0.88);
        if (!reach) {
          hook.y += drop * hook.dir * dt;
          if (hook.y > 0.9) hook.dir = -1;
          if (hook.y < 0.36 && hook.dir < 0) hook.dir = 1;
        }
        if (hook.y > 0.34) {
          const hitFish = fish.find(item => near(item.x, item.y, 40));
          const hitJunk = junk.find(item => near(item.x, item.y, 28));
          if (hitJunk) miss('trash', hitJunk, 'junk');
          else if (hitFish) bite(hitFish);
        }
      }
      if (!paused && phase === 'reel' && caught) {
        hook.y -= 0.55 * dt;
        caught.x = hook.x;
        caught.y = hook.y + 0.06;
        if (hook.y <= 0.2) {
          const clean = !missed;
          session.destroy();
          onDone?.(clean);
          return;
        }
      }

      drawPond(ctx, width, height, pond, now, reach);
      bubbles.forEach(bubble => {
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff99';
        ctx.lineWidth = 1.5;
        ctx.arc(bubble.x * width, bubble.y * height, bubble.r, 0, Math.PI * 2);
        ctx.stroke();
      });
      junk.forEach(item => drawTrash(ctx, item, width, height));
      fish.forEach(item => drawFish(ctx, item, width, height, now));
      if (caught) drawFish(ctx, caught, width, height, now);
      const boatX = width * 0.5;
      const boatY = height * 0.16;
      const hookX = hook.x * width;
      const hookY = hook.y * height;
      ctx.strokeStyle = '#f4efe4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boatX, boatY + 8);
      ctx.lineTo(hookX, hookY - 10);
      ctx.stroke();
      drawBoat(ctx, boatX, boatY);
      drawHook(ctx, hookX, hookY);
      if (!steered) {
        ctx.font = '700 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1a4468';
        const hint = reach ? 'Move your hand onto a fish' : 'Slide to drop the hook';
        ctx.strokeText(hint, width / 2, height * 0.24);
        ctx.fillStyle = '#faf9f5';
        ctx.fillText(hint, width / 2, height * 0.24);
      }
    } finally {
      if (!session.dead) session.raf = requestAnimationFrame(frame);
    }
  };
  session.raf = requestAnimationFrame(frame);
  return session;
}
