/**
 * Toast pop — toasts arc up from the counter. Tap the one with the right answer.
 * The arc, the speeding spawn, and the lives follow the toast catcher pen.
 * These toasts and the questions are drawn here.
 */
import { questionHolding } from './hold.js?v=ask-first';

const VIEW_W = 450;
const VIEW_H = 680;
const TOAST_W = 124;
const TOAST_H = 96;

let active = null;

export function stopToast() {
  active?.destroy();
  active = null;
}

function fitLabel(ctx, text, maxWidth, start) {
  let size = start;
  const font = px => `700 ${px}px Outfit, sans-serif`;
  ctx.font = font(size);
  while (size > 11 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = font(size);
  }
  return size;
}

function roundBox(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function drawMark(ctx, shape, fill, s) {
  ctx.fillStyle = fill || '#5d7a45';
  ctx.beginPath();
  if (shape === 'circle' || shape === 'oval') ctx.ellipse(0, 0, s, shape === 'oval' ? s * 0.66 : s, 0, 0, Math.PI * 2);
  else if (shape === 'triangle') {
    ctx.moveTo(0, -s);
    ctx.lineTo(s, s * 0.8);
    ctx.lineTo(-s, s * 0.8);
    ctx.closePath();
  } else if (shape === 'diamond') {
    ctx.moveTo(0, -s);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, 0);
    ctx.closePath();
  } else if (shape === 'star') {
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 ? s * 0.42 : s;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const px = Math.cos(a) * radius;
      const py = Math.sin(a) * radius;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
  } else if (shape === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI / 3;
      const px = Math.cos(a) * s;
      const py = Math.sin(a) * s;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
  } else ctx.rect(-s, -s * 0.7, s * 2, s * 1.4);
  ctx.fill();
}

function drawHeart(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f16f33';
  ctx.beginPath();
  ctx.moveTo(0, s * 0.32);
  ctx.bezierCurveTo(-s * 0.55, -s * 0.2, -s, s * 0.28, 0, s);
  ctx.bezierCurveTo(s, s * 0.28, s * 0.55, -s * 0.2, 0, s * 0.32);
  ctx.fill();
  ctx.restore();
}

export function mountToast(root, { board = {}, reduced, paceFor, nextQuestion, onPrompt, onLives, onMiss, onClear, onOver, onFinished }) {
  stopToast();
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

  const call = (fn, arg) => {
    try { return fn?.(arg); }
    catch { return undefined; }
  };

  root.innerHTML = `<div class="toast-play"><div id="toastShow"></div><div class="toast" role="application" aria-label="Tap the toast with the right answer before it lands."><canvas></canvas></div></div>`;
  const stage = root.querySelector('.toast');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const clouds = [
    { x: 70, y: 150, w: 78 },
    { x: 230, y: 210, w: 96 },
    { x: 360, y: 130, w: 70 },
    { x: 140, y: 320, w: 84 },
    { x: 320, y: 390, w: 76 }
  ];
  const toasts = [];
  let queue = [];
  let view = { scale: 1, ox: 0, oy: 0, dpr: 1 };
  let lives = board.lives || 5;
  let score = 0;
  let livePack = null;
  let slipped = false;
  let resolving = false;
  let replay = false;
  let wait = 0;
  let over = false;
  let overAt = 0;
  let overSent = false;
  let ending = false;
  let roundStart = 0;
  let last = 0;

  const fit = () => {
    const cssW = Math.max(1, stage.clientWidth || 360);
    const cssH = Math.max(1, stage.clientHeight || 480);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const nextW = Math.round(cssW * dpr);
    const nextH = Math.round(cssH * dpr);
    if (canvas.width !== nextW || canvas.height !== nextH) {
      canvas.width = nextW;
      canvas.height = nextH;
    }
    const scale = Math.min(cssW / VIEW_W, cssH / VIEW_H);
    view = { scale, ox: (cssW - VIEW_W * scale) / 2, oy: (cssH - VIEW_H * scale) / 2, dpr };
  };
  const applyView = () => {
    ctx.setTransform(view.dpr * view.scale, 0, 0, view.dpr * view.scale, view.dpr * view.ox, view.dpr * view.oy);
  };
  const shake = () => {
    stage.classList.remove('shake');
    void stage.offsetWidth;
    stage.classList.add('shake');
  };
  const clampX = n => Math.max(16, Math.min(VIEW_W - TOAST_W - 16, n));
  const launch = pack => {
    const elapsed = (performance.now() - roundStart) / 1000;
    const pace = paceFor?.(board, elapsed) || { flight: board.flight || 3000, gap: board.gap || 900 };
    const duration = Math.max(700, Math.round(pace.flight * (reduced ? 1.4 : 1)));
    const gap = Math.max(280, Math.round(pace.gap * (reduced ? 1.25 : 1)));
    const now = performance.now();
    const count = pack.choices.length;
    queue = pack.choices.map((choice, i) => {
      const slot = (VIEW_W - TOAST_W - 32) / Math.max(1, count);
      const jitter = (Math.random() - 0.5) * slot * 0.45;
      return {
        choice,
        at: now + i * gap,
        duration,
        startX: clampX(16 + slot * i + jitter),
        endX: clampX(16 + Math.random() * (VIEW_W - TOAST_W - 32)),
        peakY: 150 + Math.random() * 90
      };
    });
    toasts.length = 0;
  };
  const beginWave = isReplay => {
    if (session.dead || ending || over) return;
    if (!isReplay) {
      const pack = call(nextQuestion);
      if (!pack?.choices?.length) {
        ending = true;
        call(onFinished);
        return;
      }
      livePack = pack;
      slipped = false;
      call(onPrompt);
    }
    if (!livePack?.choices?.length) return;
    resolving = false;
    launch(livePack);
  };
  const dropLife = () => {
    if (resolving || ending || over) return;
    resolving = true;
    replay = true;
    slipped = true;
    lives = Math.max(0, lives - 1);
    queue = [];
    toasts.length = 0;
    shake();
    call(onLives, lives);
    call(onMiss, 'drop');
    if (session.dead || ending) return;
    if (lives <= 0) {
      over = true;
      overAt = performance.now();
      return;
    }
    wait = reduced ? 0.35 : 0.6;
  };
  const pop = toast => {
    if (!toast || toast.state !== 'fly' || resolving || over || ending) return;
    if (!toast.ok) {
      toast.burnt = true;
      toast.state = 'up';
      toast.vy = -520;
      slipped = true;
      call(onMiss, 'wrong');
      return;
    }
    toast.state = 'up';
    toast.vy = -680;
    score += 1;
    resolving = true;
    replay = false;
    queue = [];
    toasts.forEach(other => {
      if (other !== toast && other.state === 'fly') {
        other.state = 'up';
        other.vy = -420;
      }
    });
    call(onClear, !slipped);
    if (session.dead || ending) return;
    livePack = null;
    wait = reduced ? 0.25 : 0.4;
  };
  const pointer = event => {
    if (session.dead || over || ending || !view.scale) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - view.ox) / view.scale;
    const y = (event.clientY - rect.top - view.oy) / view.scale;
    for (let i = toasts.length - 1; i >= 0; i--) {
      const toast = toasts[i];
      if (toast.state !== 'fly') continue;
      if (x >= toast.x && x <= toast.x + TOAST_W && y >= toast.y && y <= toast.y + TOAST_H) {
        pop(toast);
        return;
      }
    }
  };

  const drawCloud = cloud => {
    ctx.fillStyle = '#feecbf';
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, cloud.w * 0.46, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x - cloud.w * 0.22, cloud.y + 6, cloud.w * 0.28, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x + cloud.w * 0.22, cloud.y + 5, cloud.w * 0.3, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  const drawToast = (toast, now) => {
    const flap = reduced ? 1 : 0.82 + Math.sin(now / 90 + toast.startX) * 0.18;
    const blink = reduced ? 1 : (Math.sin(now / 420 + toast.peakY) > 0.94 ? 0.12 : 1);
    ctx.save();
    ctx.translate(toast.x + TOAST_W / 2, toast.y + TOAST_H / 2);
    ctx.fillStyle = '#fde2a9';
    ctx.strokeStyle = '#7f3412';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(-TOAST_W * 0.38, -12);
    ctx.scale(1, flap);
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 11, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(TOAST_W * 0.38, -12);
    ctx.scale(1, flap);
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 11, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    const crust = toast.burnt ? '#6a3014' : '#c7511b';
    const crumb = toast.burnt ? '#a56a32' : (!toast.shape && toast.fill ? toast.fill : '#febb63');
    roundBox(ctx, -46, -40, 92, 80, 18);
    ctx.fillStyle = crust;
    ctx.fill();
    roundBox(ctx, -38, -32, 76, 64, 14);
    ctx.fillStyle = crumb;
    ctx.fill();
    ctx.fillStyle = toast.burnt ? '#4a2412' : '#7f3412';
    const eye = blink;
    ctx.save();
    ctx.translate(-14, -16);
    ctx.scale(1, eye);
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.4, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(14, -16);
    ctx.scale(1, eye);
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.4, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#7f3412';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (toast.burnt) {
      ctx.moveTo(-8, -6);
      ctx.quadraticCurveTo(0, -12, 8, -6);
    } else {
      ctx.moveTo(-8, -8);
      ctx.quadraticCurveTo(0, -1, 8, -8);
    }
    ctx.stroke();
    if (toast.shape) {
      ctx.save();
      ctx.translate(0, -14);
      drawMark(ctx, toast.shape, '#32634e', 9);
      ctx.restore();
    }
    roundBox(ctx, -40, 2, 80, 26, 8);
    ctx.fillStyle = toast.burnt ? '#e7c49a' : '#fff6e4';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#7f3412';
    ctx.stroke();
    fitLabel(ctx, toast.label, 74, toast.shape ? 13 : 18);
    ctx.fillStyle = '#4a2a16';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(toast.label, 0, 15);
    ctx.restore();
  };
  const drawHud = () => {
    ctx.fillStyle = '#976f4a';
    ctx.fillRect(0, 0, VIEW_W, 80);
    ctx.fillStyle = '#67442b';
    ctx.fillRect(0, 74, VIEW_W, 6);
    roundBox(ctx, 10, 10, 430, 54, 12);
    ctx.fillStyle = '#67442b';
    ctx.fill();
    ctx.fillStyle = '#fedaa1';
    ctx.font = '900 28px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(score).padStart(8, '0'), 28, 38);
    const livesText = `${lives}X`;
    ctx.textAlign = 'right';
    ctx.fillText(livesText, 386, 38);
    drawHeart(ctx, 404, 24, 16);
  };
  const drawOver = () => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = '900 40px Outfit, sans-serif';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#603719';
    ctx.strokeText('GAME OVER', VIEW_W / 2, 250);
    ctx.fillStyle = '#f16f33';
    ctx.fillText('GAME OVER', VIEW_W / 2, 250);
    ctx.font = '700 24px Outfit, sans-serif';
    ctx.fillStyle = '#fffaf2';
    ctx.fillText(`Final score: ${score}`, VIEW_W / 2, 300);
  };
  const draw = now => {
    fit();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    applyView();
    ctx.fillStyle = '#7dc8cf';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    clouds.forEach(drawCloud);
    ctx.fillStyle = '#fdc571';
    ctx.fillRect(0, 631, VIEW_W, 49);
    toasts.forEach(toast => drawToast(toast, now));
    drawHud();
    if (over) drawOver();
  };
  const placeToast = (toast, now) => {
    if (toast.state === 'up') return;
    const t = (now - toast.startTime) / toast.duration;
    toast.t = t;
    const u = Math.min(1, Math.max(0, t));
    toast.x = toast.startX + (toast.endX - toast.startX) * u;
    toast.y = toast.startY - (4 * u * (1 - u)) * (toast.startY - toast.peakY);
  };
  const frame = now => {
    if (session.dead) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (!over && !ending && !questionHolding()) {
      if (wait > 0) {
        wait -= dt;
        if (wait < 0) wait = 0;
      } else {
        queue = queue.filter(item => {
          if (now < item.at) return true;
          toasts.push({
            label: String(item.choice.label),
            ok: !!item.choice.ok,
            shape: item.choice.shape || '',
            fill: item.choice.fill || '',
            startX: item.startX,
            endX: item.endX,
            startY: VIEW_H,
            peakY: item.peakY,
            startTime: now,
            duration: item.duration,
            state: 'fly',
            burnt: false,
            x: item.startX,
            y: VIEW_H,
            vy: 0,
            t: 0
          });
          return false;
        });
      }
      for (let i = toasts.length - 1; i >= 0; i--) {
        const toast = toasts[i];
        if (!toast) break;
        if (toast.state === 'up') {
          toast.y += toast.vy * dt;
          if (toast.y < -110) toasts.splice(i, 1);
          continue;
        }
        placeToast(toast, now);
        if (toast.t >= 1) {
          const missed = toast.ok;
          toasts.splice(i, 1);
          if (missed) {
            dropLife();
            break;
          }
        }
      }
      if (wait === 0 && resolving && !over && !ending) {
        resolving = false;
        beginWave(replay);
      }
    }
    draw(now);
    if (over && !overSent && now - overAt > 1100) {
      overSent = true;
      call(onOver);
      if (session.dead) return;
    }
    session.raf = requestAnimationFrame(frame);
  };

  canvas.addEventListener('pointerdown', pointer);
  const watch = new ResizeObserver(() => fit());
  watch.observe(stage);
  session.cleanups.push(() => {
    canvas.removeEventListener('pointerdown', pointer);
    watch.disconnect();
  });
  fit();
  roundStart = performance.now();
  call(onLives, lives);
  beginWave(false);
  session.raf = requestAnimationFrame(frame);
}
