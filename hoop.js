/**
 * Shooting hoops — drag the ball, then flick it at a rim.
 * Three hoops sit across the gym. The one you drop through is the answer.
 * The throw, the arc, and the net follow the flick-to-shoot hoop.
 */
import { questionHolding } from './hold.js?v=ask-first';

let active = null;

export function stopHoop() {
  active?.destroy();
  active = null;
}

function call(fn, arg) {
  try { return fn?.(arg); }
  catch { return undefined; }
}

export function mountHoop(root, { locked = false, reduced = false, stats = {}, hoops = [], onSwish, onWrong, onBrick, onLocked } = {}) {
  stopHoop();
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

  const source = hoops.length ? hoops.slice(0, 3) : [{ label: '', ok: true }, { label: '', ok: true }, { label: '', ok: true }];
  let width = 360;
  let height = 480;
  let lockedNow = !!locked;
  let score = stats.score || 0;
  let shots = stats.shots || 0;
  let streak = stats.streak || 0;
  let phase = 'rest';
  let ball = { x: 180, y: 400, vx: 0, vy: 0, rot: 0 };
  let rest = { x: 180, y: 400 };
  let rims = source.map(hoop => ({
    label: String(hoop.label ?? ''),
    ok: hoop.ok !== false,
    x: 180,
    y: 120,
    w: 72,
    net: 1
  }));
  let grab = null;
  let trail = [];
  let scored = false;
  let backAt = 0;
  let frame = 0;
  let last = 0;

  root.innerHTML = `<div class="hoop-play"><canvas></canvas><p class="hoop-hint">Drag the ball, then flick it at a hoop.</p></div>`;
  const canvas = root.querySelector('canvas');
  const hint = root.querySelector('.hoop-hint');
  const ctx = canvas.getContext('2d');
  const gravity = reduced ? 1400 : 2200;

  const layout = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = Math.max(260, rect.width);
    height = Math.max(280, rect.height);
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const rimW = Math.min(78, Math.max(42, width * 0.15));
    const board = rimW * 1.2;
    const margin = board / 2 + 8;
    const spots = rims.length === 1
      ? [width / 2]
      : rims.length === 2
        ? [width * 0.32, width * 0.68]
        : [margin, width / 2, width - margin];
    const y = Math.max(78, height * 0.2);
    rims.forEach((rim, i) => {
      rim.x = spots[i];
      rim.y = y;
      rim.w = rimW;
    });
    rest = { x: width * 0.5, y: height * 0.8 };
    if (phase === 'rest') ball = { ...ball, x: rest.x, y: rest.y, vx: 0, vy: 0 };
    const names = rims.map(rim => rim.label || 'open').join(', ');
    canvas.setAttribute('aria-label', `Three hoops, left to right: ${names}. Drag the ball and flick it through the right one. Space also shoots.`);
  };

  const ballR = () => Math.max(16, Math.min(width, height) * 0.048);
  const scaleOf = () => {
    const span = Math.max(1, rest.y - rims[0].y);
    const rise = Math.min(1, Math.max(0, (rest.y - ball.y) / span));
    return 1 - rise * (reduced ? 0.12 : 0.38);
  };

  const info = () => ({ score, shots, streak });

  const finish = (kind, rim) => {
    phase = 'back';
    backAt = performance.now();
    scored = true;
    if (kind === 'swish') {
      streak += 1;
      score += Math.abs(ball.vx) > 520 ? 3 : 2;
      rim.net = 1.35;
      call(onSwish, info());
    } else if (kind === 'wrong') {
      streak = 0;
      rim.net = 1.2;
      call(onWrong, { ...info(), label: rim.label });
    } else {
      streak = 0;
      call(onBrick, info());
    }
  };

  const paintRim = rim => {
    const boardW = rim.w * 1.2;
    const boardH = rim.w * 0.95;
    ctx.fillStyle = '#faf9f5';
    ctx.strokeStyle = '#32634e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(rim.x - boardW / 2, rim.y - boardH * 0.78, boardW, boardH, 8);
    ctx.fill();
    ctx.stroke();
    if (rim.label) {
      let size = Math.max(13, rim.w * 0.36);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#244b3d';
      do {
        ctx.font = `700 ${size}px Outfit, sans-serif`;
        size -= 1;
      } while (size > 11 && ctx.measureText(rim.label).width > boardW * 0.86);
      ctx.fillText(rim.label, rim.x, rim.y - boardH * 0.32);
    }

    ctx.strokeStyle = '#b7c3ae';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const drop = rim.w * 0.5 * rim.net;
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      ctx.moveTo(rim.x - rim.w / 2 + rim.w * t, rim.y + 7);
      ctx.lineTo(rim.x - rim.w * 0.3 + rim.w * 0.6 * t, rim.y + 7 + drop);
    }
    ctx.stroke();

    ctx.fillStyle = '#df6a45';
    ctx.beginPath();
    ctx.roundRect(rim.x - rim.w / 2, rim.y, rim.w, 7, 3);
    ctx.fill();
  };

  const paint = () => {
    ctx.clearRect(0, 0, width, height);
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#f4efe4');
    sky.addColorStop(1, '#d7e4cf');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#c5d4b8';
    ctx.fillRect(0, height * 0.86, width, height * 0.14);
    rims.forEach(paintRim);

    const r = ballR() * scaleOf();
    const shadow = Math.min(1, Math.max(0.25, (height - ball.y) / height));
    ctx.fillStyle = `rgba(36,75,61,${0.16 * shadow})`;
    ctx.beginPath();
    ctx.ellipse(ball.x, rest.y + ballR() * 0.9, r * 0.8, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rot);
    ctx.fillStyle = lockedNow && phase === 'rest' ? '#e7b199' : '#e0703a';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#faf9f5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, -0.4, 2.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.quadraticCurveTo(0, r * 0.35, r, 0);
    ctx.stroke();
    ctx.restore();
  };

  const step = now => {
    if (session.dead) return;
    frame = requestAnimationFrame(step);
    const dt = Math.min(0.034, last ? (now - last) / 1000 : 0.016);
    last = now;
    rims.forEach(rim => { if (rim.net > 1) rim.net = Math.max(1, rim.net - dt * 0.7); });
    const holding = questionHolding();
    if (!holding && phase === 'fly') {
      const prevX = ball.x;
      const prevY = ball.y;
      ball.vy += gravity * dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.rot += ball.vx * dt * 0.008;
      const r = ballR();
      if (ball.x < r) { ball.x = r; ball.vx *= -0.4; }
      if (ball.x > width - r) { ball.x = width - r; ball.vx *= -0.4; }
      const rimY = rims[0].y;
      if (!scored && ball.vy > 0 && prevY < rimY + 16 && ball.y >= rimY) {
        const span = ball.y - prevY || 1;
        const t = Math.min(1, Math.max(0, (rimY - prevY) / span));
        const x = prevX + (ball.x - prevX) * t;
        let hit = null;
        let near = null;
        let nearDist = Infinity;
        for (const rim of rims) {
          const dist = Math.abs(x - rim.x);
          if (dist < rim.w * 0.36 && (!hit || dist < Math.abs(x - hit.x))) hit = rim;
          if (dist < rim.w * 0.62 && dist < nearDist) { near = rim; nearDist = dist; }
        }
        if (hit) finish(hit.ok ? 'swish' : 'wrong', hit);
        else if (near) {
          ball.vy *= -0.35;
          ball.vx += (x - near.x) * 1.4;
        }
      }
      if (!scored && phase === 'fly' && (ball.y > height + r || now - (ball.thrownAt || now) > 2200)) finish('brick');
    } else if (phase === 'back') {
      const t = Math.min(1, (now - backAt) / (reduced ? 180 : 420));
      ball.x += (rest.x - ball.x) * 0.18;
      ball.y += (rest.y - ball.y) * 0.18;
      ball.rot *= 0.9;
      if (t >= 1) {
        phase = 'rest';
        ball.x = rest.x;
        ball.y = rest.y;
        ball.vx = 0;
        ball.vy = 0;
        ball.rot = 0;
        scored = false;
      }
    }
    paint();
  };

  const point = event => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const down = event => {
    if (session.dead || phase === 'fly' || phase === 'back' || questionHolding()) return;
    const p = point(event);
    const near = Math.hypot(p.x - ball.x, p.y - ball.y) < ballR() + 28;
    if (!near) return;
    if (lockedNow) { call(onLocked); return; }
    phase = 'drag';
    grab = { dx: ball.x - p.x, dy: ball.y - p.y };
    trail = [{ ...p, t: performance.now() }];
    canvas.setPointerCapture?.(event.pointerId);
    hint.textContent = 'Let go to shoot.';
  };

  const move = event => {
    if (phase !== 'drag' || !grab) return;
    const p = point(event);
    const r = ballR();
    ball.x = Math.min(width - r, Math.max(r, p.x + grab.dx));
    ball.y = Math.min(height - r, Math.max(height * 0.48, p.y + grab.dy));
    const t = performance.now();
    trail.push({ ...p, t });
    while (trail.length && t - trail[0].t > 90) trail.shift();
  };

  const shoot = (vx, vy) => {
    shots += 1;
    scored = false;
    phase = 'fly';
    ball.vx = vx;
    ball.vy = vy;
    ball.thrownAt = performance.now();
  };

  const up = () => {
    if (phase !== 'drag') return;
    const a = trail[0];
    const b = trail[trail.length - 1];
    phase = 'rest';
    grab = null;
    hint.textContent = 'Drag the ball, then flick it at a hoop.';
    if (!a || !b) return;
    const dt = Math.max(0.016, (b.t - a.t) / 1000);
    let vx = (b.x - a.x) / dt * 0.55;
    let vy = (b.y - a.y) / dt * 1.15;
    const speed = Math.hypot(vx, vy);
    const max = reduced ? 900 : 1600;
    if (speed > max) { vx *= max / speed; vy *= max / speed; }
    if (speed < 280 || vy > -120) return;
    shoot(vx, vy);
  };

  const aimAt = rim => {
    const peak = rim.y - (reduced ? 36 : 64);
    const rise = Math.max(40, rest.y - peak);
    const speedUp = Math.sqrt(2 * gravity * rise);
    const tUp = speedUp / gravity;
    const tDown = Math.sqrt(2 * Math.max(8, rim.y - peak) / gravity);
    return { vx: (rim.x - rest.x) / (tUp + tDown), vy: -speedUp };
  };

  const key = event => {
    if (session.dead || questionHolding() || phase === 'fly' || phase === 'back') return;
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (lockedNow) { call(onLocked); return; }
    event.preventDefault();
    const rim = rims[Math.floor(Math.random() * rims.length)];
    const shot = aimAt(rim);
    shoot(shot.vx, shot.vy);
  };

  layout();
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  window.addEventListener('keydown', key);
  window.addEventListener('resize', layout);
  session.cleanups.push(() => {
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', up);
    canvas.removeEventListener('pointercancel', up);
    window.removeEventListener('keydown', key);
    window.removeEventListener('resize', layout);
    cancelAnimationFrame(frame);
  });
  canvas.tabIndex = 0;
  frame = requestAnimationFrame(step);

  return {
    unlock() { lockedNow = false; },
    lock() { lockedNow = true; },
    destroy() { session.destroy(); }
  };
}
