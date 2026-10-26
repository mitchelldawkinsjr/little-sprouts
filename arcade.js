import { questionHolding } from './hold.js?v=ask-first';
import { rocketZone } from './logic.mjs?v=rocket-fly';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pointHits = (nx, ny, stage, item, pad = 24) => {
  const x = stage.left + nx * stage.width;
  const y = stage.top + ny * stage.height;
  return x >= item.left - pad && x <= item.right + pad && y >= item.top - pad && y <= item.bottom + pad;
};
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

let active = null;

export function stopArcade() {
  active?.destroy();
  active = null;
}

function paceOf(speed, reduced) {
  const calm = reduced ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return speed * (calm ? 0.5 : 1);
}

function attachSteer(stage, hooks) {
  const held = new Set();
  let axis = 0;
  let pointerId = null;
  let drag = false;
  let startX = 0;
  let lastX = 0;

  const publish = () => {
    const next = held.has('left') === held.has('right') ? 0 : held.has('left') ? -1 : 1;
    if (next === axis) return;
    axis = next;
    hooks.onAxis(axis);
  };
  const setHeld = (name, on) => {
    if (on) held.add(name);
    else held.delete(name);
    publish();
  };
  const endPointer = () => {
    held.delete('left');
    held.delete('right');
    pointerId = null;
    drag = false;
    publish();
    hooks.onRelease?.();
  };
  const keyDir = e => (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ? 'left'
    : e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ? 'right' : '');
  const typing = e => e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  const onKey = e => {
    if (document.querySelector('dialog[open]') || typing(e)) return;
    const dir = keyDir(e);
    if (!dir) return;
    e.preventDefault();
    if (e.type === 'keydown') {
      if (e.repeat) return;
      setHeld(dir, true);
    } else setHeld(dir, false);
  };
  const sideName = clientX => {
    const rect = stage.getBoundingClientRect();
    return clientX < rect.left + rect.width / 2 ? 'left' : 'right';
  };
  const onDown = e => {
    if (e.button !== undefined && e.button !== 0) return;
    pointerId = e.pointerId;
    startX = lastX = e.clientX;
    drag = false;
    e.preventDefault();
    stage.setPointerCapture?.(e.pointerId);
    setHeld(sideName(e.clientX), true);
  };
  const onMove = e => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    if (!drag && Math.abs(dx) > 12) {
      drag = true;
      held.delete('left');
      held.delete('right');
      publish();
    }
    if (!drag) return;
    hooks.onDrag?.(e.clientX, e.clientX - lastX);
    lastX = e.clientX;
  };
  const onUp = e => {
    if (e.pointerId !== pointerId) return;
    endPointer();
  };
  const onButtonKey = e => {
    const dir = e.currentTarget?.dataset.dir === 'left' ? 'left' : 'right';
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (e.type === 'keydown' && e.repeat) return;
    setHeld(dir, e.type === 'keydown');
  };

  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);
  window.addEventListener('blur', endPointer);
  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
  stage.querySelectorAll('[data-dir]').forEach(button => {
    button.addEventListener('keydown', onButtonKey);
    button.addEventListener('keyup', onButtonKey);
  });

  return () => {
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup', onKey);
    window.removeEventListener('blur', endPointer);
    stage.removeEventListener('pointerdown', onDown);
    stage.removeEventListener('pointermove', onMove);
    stage.removeEventListener('pointerup', onUp);
    stage.removeEventListener('pointercancel', onUp);
    held.clear();
    pointerId = null;
  };
}

function steerButtons() {
  return `<div class="steer"><button type="button" class="steer-btn" data-dir="left" aria-label="Move left">←</button><button type="button" class="steer-btn" data-dir="right" aria-label="Move right">→</button></div>`;
}

function openSession() {
  stopArcade();
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
  return session;
}

export function mountCatch(root, { prompt, choices, target, speed, reduced, onDone, onMiss, watchHands }) {
  const session = openSession();
  const list = [...choices];
  if (!list.some(choice => String(choice) === String(target))) list.push(target);
  let marked = false;
  const items = list.map(choice => {
    const ok = !marked && String(choice) === String(target);
    if (ok) marked = true;
    return { choice, ok, x: 0, y: 0, el: null };
  });
  const reach = typeof watchHands === 'function';
  root.innerHTML = reach
    ? `<div class="camstage catch-cam"><video playsinline muted autoplay></video><div class="field" role="group" aria-label="${esc(prompt)}. Reach up and catch the right answer with your hand.">${items.map(item => `<span class="falling">${esc(item.choice)}</span>`).join('')}</div><span class="hand" hidden></span><span class="hand" hidden></span><p class="camstatus" id="camstatus"></p></div>`
    : `<div class="arcade"><div class="field" role="group" aria-label="${esc(prompt)}. Move left and right to catch the right answer.">${items.map(item => `<span class="falling">${esc(item.choice)}</span>`).join('')}<span class="basket" aria-hidden="true">🧺</span></div>${steerButtons()}</div>`;
  const stage = root.querySelector('.arcade') || root.querySelector('.catch-cam');
  const field = root.querySelector('.field');
  const basket = root.querySelector('.basket');
  items.forEach((item, i) => { item.el = field.querySelectorAll('.falling')[i]; });

  const fall = paceOf(speed, reduced);
  const minX = 0.14;
  const maxX = 0.86;
  let basketX = 0.5;
  let axis = 0;
  let dragging = false;
  let steered = false;
  let hands = [];
  let missed = false;
  let holdUntil = 0;
  let waveTimer = 0;
  let last = 0;
  session.cleanups.push(() => clearTimeout(waveTimer));

  const paintBasket = () => { if (basket) basket.style.left = `${basketX * 100}%`; };
  const raised = () => hands.filter(h => h.up);
  const park = () => {
    items.forEach((item, i) => {
      item.x = (i + 0.5) / items.length;
      item.y = 0.06;
      item.el.hidden = false;
      item.el.classList.remove('wrong', 'caught');
      item.el.style.left = `${item.x * 100}%`;
      item.el.style.top = `${item.y * 100}%`;
    });
  };
  const place = () => {
    items.forEach((item, i) => {
      item.x = (i + 0.5) / items.length;
      item.y = -0.2 - i * 0.24;
      item.el.hidden = false;
      item.el.classList.remove('wrong', 'caught');
      item.el.style.left = `${item.x * 100}%`;
      item.el.style.top = `${item.y * 100}%`;
    });
  };
  const relaunch = () => {
    if (session.dead) return;
    holdUntil = 0;
    field.classList.remove('shake');
    place();
  };
  const miss = (item) => {
    if (session.dead || holdUntil) return;
    missed = true;
    holdUntil = 1;
    item?.el.classList.add('wrong');
    field.classList.add('shake');
    clearTimeout(waveTimer);
    waveTimer = setTimeout(relaunch, 420);
    try { onMiss?.(); } catch { /* the wave still comes back */ }
  };
  const win = (item) => {
    if (session.dead || holdUntil) return;
    item.el.classList.add('caught');
    const clean = !missed;
    session.destroy();
    onDone?.(clean);
  };

  park();
  paintBasket();
  if (reach) session.cleanups.push(watchHands(next => { hands = next || []; }));
  else session.cleanups.push(attachSteer(stage, {
    onAxis(next) {
      if (next) steered = true;
      if (next && next !== axis) basketX = clamp(basketX + next * 0.16, minX, maxX);
      axis = next;
      paintBasket();
    },
    onDrag(clientX) {
      const rect = field.getBoundingClientRect();
      steered = true;
      dragging = true;
      basketX = clamp((clientX - rect.left) / rect.width, minX, maxX);
      paintBasket();
    },
    onRelease() { dragging = false; }
  }));

  const frame = now => {
    if (session.dead) return;
    try {
      if (!field.isConnected) { session.destroy(); return; }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (reach && raised().length) steered = true;
      if (holdUntil || document.querySelector('dialog[open]') || questionHolding() || !steered) return;
      if (!reach && !dragging && axis) {
        basketX = clamp(basketX + axis * 1.05 * dt, minX, maxX);
        paintBasket();
      }
      const fieldRect = field.getBoundingClientRect();
      const basketRect = basket?.getBoundingClientRect();
      for (const item of items) {
        item.y += fall * dt;
        item.el.style.top = `${item.y * 100}%`;
        const rect = item.el.getBoundingClientRect();
        const hit = reach
          ? raised().some(h => pointHits(h.x, h.y, fieldRect, rect))
          : rect.bottom >= basketRect.top + 6 && rect.top <= basketRect.bottom && rect.right > basketRect.left + 8 && rect.left < basketRect.right - 8;
        if (hit) {
          if (item.ok) win(item);
          else miss(item);
          break;
        }
        if (item.ok && rect.top > fieldRect.bottom) {
          miss(item);
          break;
        }
      }
    } finally {
      if (!session.dead) session.raf = requestAnimationFrame(frame);
    }
  };
  session.raf = requestAnimationFrame(frame);
}

// Road projection adapted from Jake Gordon's javascript-racer (MIT).
// Copyright (c) 2012-2016 Jake Gordon and contributors.
const SEGMENT = 200;
const ROAD_W = 2000;
const CAM_H = 1100;
const CAM_DEPTH = 1 / Math.tan((100 / 2) * Math.PI / 180);
const DRAW = 120;
const WORD_AT = 16;

function projectRoad(z, camZ, camX, width, height) {
  const cameraZ = z - camZ;
  if (cameraZ <= CAM_DEPTH) return null;
  const scale = CAM_DEPTH / cameraZ;
  return {
    x: Math.round(width / 2 + scale * -camX * width / 2),
    y: Math.round(height / 2 - scale * -CAM_H * height / 2),
    w: Math.round(scale * ROAD_W * width / 2),
    scale
  };
}

function polygon(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
}

function laneCenter(index, count) {
  return ((index + 0.5) / count) * 2 - 1;
}

function mountBodyLanes(session, root, { prompt, lanes, correct, watchBody, onDone, onMiss }) {
  const PREP = 10000;
  root.innerHTML = `<div class="camstage lane-cam"><video playsinline muted autoplay></video><div class="lane-board" style="--lanes:${lanes.length}" role="group" aria-label="${esc(prompt)}. Step into that lane. The check waits 10 seconds.">${lanes.map(word => `<div class="lane"><span class="sign">${esc(word)}</span></div>`).join('')}</div><p class="lane-count" data-count aria-live="polite">10</p><p class="camstatus" id="camstatus"></p></div>`;
  const stage = root.querySelector('.lane-cam');
  const countEl = root.querySelector('[data-count]');
  const cols = [...root.querySelectorAll('.lane')];
  let bodyX = null;
  let seenAt = 0;
  let laneNow = -1;
  let missed = false;
  let holdUntil = 0;
  let prepLeft = PREP;
  let shown = '';
  let last = 0;
  let waveTimer = 0;
  session.cleanups.push(() => clearTimeout(waveTimer));
  session.cleanups.push(watchBody(body => {
    if (!body?.live) { bodyX = null; return; }
    seenAt = performance.now();
    bodyX = bodyX == null ? body.x : bodyX * 0.55 + body.x * 0.45;
  }));
  const showCount = label => {
    if (label === shown) return;
    shown = label;
    countEl.hidden = !label;
    countEl.textContent = label;
  };
  const paint = lane => {
    cols.forEach((col, i) => {
      col.classList.toggle('here', i === lane);
      col.classList.toggle('wrong', !!(holdUntil && i === lane && i !== correct));
    });
  };
  const miss = () => {
    if (session.dead || holdUntil) return;
    missed = true;
    holdUntil = 1;
    paint(laneNow);
    stage.classList.add('shake');
    clearTimeout(waveTimer);
    waveTimer = setTimeout(() => {
      if (session.dead) return;
      holdUntil = 0;
      stage.classList.remove('shake');
      paint(laneNow);
    }, 420);
    try { onMiss?.(); } catch { /* another 10 seconds starts after this */ }
  };
  const win = () => {
    if (session.dead || holdUntil) return;
    cols[correct]?.classList.add('caught');
    session.destroy();
    onDone?.(!missed);
  };
  const frame = now => {
    if (session.dead) return;
    try {
      if (!stage.isConnected) { session.destroy(); return; }
      const dt = last ? Math.min(50, now - last) : 0;
      last = now;
      if (holdUntil || document.querySelector('dialog[open]')) return;
      const live = bodyX != null && now - seenAt < 500;
      laneNow = live ? clamp(Math.floor(bodyX * lanes.length), 0, lanes.length - 1) : -1;
      paint(laneNow);
      if (prepLeft > 0) {
        prepLeft -= dt;
        showCount(String(Math.max(1, Math.ceil(prepLeft / 1000))));
        return;
      }
      showCount('');
      prepLeft = PREP;
      if (laneNow === correct) win();
      else miss();
    } finally {
      if (!session.dead) session.raf = requestAnimationFrame(frame);
    }
  };
  session.raf = requestAnimationFrame(frame);
}

export function mountLanes(root, { prompt, choices, target, speed, reduced, onDone, onMiss, watchBody }) {
  const session = openSession();
  const lanes = [...choices];
  if (!lanes.some(choice => String(choice) === String(target))) lanes.push(target);
  const correct = Math.max(0, lanes.findIndex(choice => String(choice) === String(target)));
  if (typeof watchBody === 'function') {
    mountBodyLanes(session, root, { prompt, lanes, correct, watchBody, onDone, onMiss });
    return;
  }
  root.innerHTML = `<div class="arcade racer"><canvas class="racer-view" aria-label="${esc(prompt)}. Steer into that word."></canvas>${steerButtons()}</div>`;
  const stage = root.querySelector('.arcade');
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const drive = paceOf(speed, reduced);
  const wordZ = WORD_AT * SEGMENT;
  let playerX = laneCenter(Math.floor((lanes.length - 1) / 2), lanes.length);
  let position = 0;
  let axis = 0;
  let steered = false;
  let missed = false;
  let holdUntil = 0;
  let waveTimer = 0;
  let last = 0;
  session.cleanups.push(() => clearTimeout(waveTimer));

  const aimed = () => clamp(Math.floor((playerX + 1) / 2 * lanes.length), 0, lanes.length - 1);
  const miss = () => {
    if (session.dead || holdUntil) return;
    missed = true;
    holdUntil = 1;
    stage.classList.add('shake');
    clearTimeout(waveTimer);
    waveTimer = setTimeout(() => {
      if (session.dead) return;
      holdUntil = 0;
      position = 0;
      playerX = laneCenter(Math.floor((lanes.length - 1) / 2), lanes.length);
      stage.classList.remove('shake');
    }, 420);
    try { onMiss?.(); } catch { /* the car still gets another run */ }
  };
  const win = () => {
    if (session.dead || holdUntil) return;
    session.destroy();
    onDone?.(!missed);
  };

  const drawSign = (x, y, laneW, word, hot, bad) => {
    const w = clamp(laneW * 0.86, 16, 240);
    const h = clamp(w * 0.46, 14, 78);
    const top = y - h - 6;
    ctx.fillStyle = '#32634e';
    ctx.fillRect(x - 2, top + h, 4, Math.max(8, y - (top + h)));
    ctx.fillStyle = bad ? '#fff4ec' : hot ? '#e5f0dc' : '#fff';
    ctx.strokeStyle = bad ? '#a85a2a' : '#32634e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, top, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#244b3d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = Math.max(10, Math.floor(h * 0.5));
    ctx.font = `700 ${size}px Outfit, sans-serif`;
    while (size > 8 && ctx.measureText(word).width > w - 10) {
      size -= 1;
      ctx.font = `700 ${size}px Outfit, sans-serif`;
    }
    ctx.fillText(word, x, top + h / 2);
  };

  const paint = () => {
    const cssW = Math.max(280, stage.clientWidth || 640);
    const cssH = Math.max(180, canvas.clientHeight || 320);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const width = cssW;
    const height = cssH;
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.62);
    sky.addColorStop(0, '#9ec4e4');
    sky.addColorStop(1, '#e7f0df');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    const camX = playerX * ROAD_W;
    const base = Math.floor(position / SEGMENT);
    let maxY = height;
    const here = aimed();
    for (let n = DRAW; n > 0; n--) {
      const index = base + n;
      const z1 = index * SEGMENT;
      const z2 = (index + 1) * SEGMENT;
      const p1 = projectRoad(z1, position, camX, width, height);
      const p2 = projectRoad(z2, position, camX, width, height);
      if (!p1 || !p2 || p2.y > maxY || p1.y <= p2.y) continue;
      const stripe = Math.floor(index / 3) % 2 === 0;
      ctx.fillStyle = stripe ? '#7ea05c' : '#6d9250';
      ctx.fillRect(0, p2.y, width, p1.y - p2.y);
      const rumble = stripe ? '#f4f1e8' : '#e07a2f';
      const r1 = p1.w / Math.max(6, lanes.length * 2);
      const r2 = p2.w / Math.max(6, lanes.length * 2);
      polygon(ctx, p1.x - p1.w - r1, p1.y, p1.x - p1.w, p1.y, p2.x - p2.w, p2.y, p2.x - p2.w - r2, p2.y, rumble);
      polygon(ctx, p1.x + p1.w + r1, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x + p2.w + r2, p2.y, rumble);
      polygon(ctx, p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y, stripe ? '#6a736c' : '#5e6760');
      if (index % 4 < 2) {
        for (let lane = 1; lane < lanes.length; lane++) {
          const t = lane / lanes.length * 2 - 1;
          const mark = Math.max(1, p1.w * 0.03);
          polygon(ctx, p1.x + t * p1.w - mark, p1.y, p1.x + t * p1.w + mark, p1.y, p2.x + t * p2.w + mark, p2.y, p2.x + t * p2.w - mark, p2.y, '#f7f4ec');
        }
      }
      maxY = p1.y;
    }
    const sign = projectRoad(wordZ, position, camX, width, height);
    if (sign && sign.y < height) {
      const laneW = Math.max(8, (sign.w * 2) / lanes.length);
      lanes.forEach((word, i) => {
        const t = laneCenter(i, lanes.length);
        drawSign(sign.x + t * sign.w, sign.y, laneW, word, i === here, holdUntil && i === here);
      });
    }
    const carX = width / 2;
    const carY = height - 28;
    ctx.fillStyle = '#244b3d33';
    ctx.beginPath();
    ctx.ellipse(carX, carY + 16, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#32634e';
    ctx.beginPath();
    ctx.roundRect(carX - 22, carY - 18, 44, 28, 8);
    ctx.fill();
    ctx.fillStyle = '#d7ecf6';
    ctx.beginPath();
    ctx.roundRect(carX - 12, carY - 14, 24, 12, 4);
    ctx.fill();
    ctx.fillStyle = '#244b3d';
    ctx.beginPath();
    ctx.arc(carX - 14, carY + 10, 6, 0, Math.PI * 2);
    ctx.arc(carX + 14, carY + 10, 6, 0, Math.PI * 2);
    ctx.fill();
  };

  session.cleanups.push(attachSteer(stage, {
    onAxis(next) {
      if (next) steered = true;
      axis = next;
    },
    onDrag(_clientX, dx) {
      if (dx) steered = true;
      playerX = clamp(playerX + dx / 160, -0.92, 0.92);
    }
  }));

  const frame = now => {
    if (session.dead) return;
    try {
      if (!canvas.isConnected) { session.destroy(); return; }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const paused = holdUntil || document.querySelector('dialog[open]') || questionHolding();
      if (!paused && steered) {
        playerX = clamp(playerX + axis * 1.35 * dt, -0.92, 0.92);
        position += wordZ * drive * dt;
        if (position >= wordZ - SEGMENT) {
          if (aimed() === correct) win();
          else miss();
        }
      }
      paint();
    } finally {
      if (!session.dead) session.raf = requestAnimationFrame(frame);
    }
  };
  session.raf = requestAnimationFrame(frame);
}

export function pokeRocket(action) {
  const fn = active?.rocket?.[action];
  return fn ? fn() : false;
}

export function mountRocket(root, { altitude = 0.32, seconds = 18, reduced, onEmpty, onAltitude, onCrash, onSpace, onFlyDone }) {
  const session = openSession();
  const calm = reduced ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flySeconds = 6;
  const riseK = 2.6;
  const stars = Array.from({ length: 14 }, (_, i) => `<i style="left:${(i * 17 + 6) % 92}%;top:${(i * 13 + 4) % 78}%"></i>`).join('');
  root.innerHTML = `<div class="rocket-play"><div class="rocket-sky" style="--alt:${altitude};--x:0.5" role="img" aria-label="Rocket over the garden"><div class="rocket-column" aria-hidden="true"><div class="rocket-moon"></div><div class="rocket-stars">${stars}</div><div class="rocket-clouds"><span></span><span></span><span></span></div><div class="rocket-hill"></div></div><div class="rocket-pad" hidden></div><svg class="rocket-ship lit" viewBox="0 0 64 96" aria-hidden="true"><path class="flame" d="M26 78h12l-6 16z"/><path fill="#5d7a45" d="M8 70 L20 58 V78 Z"/><path fill="#5d7a45" d="M56 70 L44 58 V78 Z"/><rect x="20" y="28" width="24" height="46" rx="8" fill="#faf9f5" stroke="#32634e" stroke-width="2"/><path fill="#e07a2f" d="M20 36 L32 8 L44 36 Z"/><circle cx="32" cy="48" r="6" fill="#8ec4ea" stroke="#32634e" stroke-width="2"/></svg><span class="rocket-band">Garden</span></div><div class="fuel-row"><span id="fuelLabel">Fuel</span><div class="fuel" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" aria-labelledby="fuelLabel"><span></span></div></div>${steerButtons()}</div>`;
  const play = root.querySelector('.rocket-play');
  const sky = root.querySelector('.rocket-sky');
  const ship = root.querySelector('.rocket-ship');
  const pad = root.querySelector('.rocket-pad');
  const starfield = root.querySelector('.rocket-stars');
  const steer = root.querySelector('.steer');
  const meter = root.querySelector('.fuel');
  const fill = meter.querySelector('span');
  const band = root.querySelector('.rocket-band');
  const fuelName = root.querySelector('#fuelLabel');
  steer.hidden = true;
  let alt = clamp(altitude, 0, 1);
  let x = 0.5;
  let fuel = 1;
  let vy = 0;
  let axis = 0;
  let dragging = false;
  let live = true;
  let mode = 'question';
  let landed = false;
  let flyLeft = flySeconds;
  let last = 0;
  let shakeTimer = 0;
  let shown = '';
  let detachFly = () => {};
  const drain = paceOf(1 / Math.max(1, seconds), calm);
  const report = () => { try { onAltitude?.(alt); } catch { /* the sky still moves */ } };
  const paint = () => {
    const name = mode === 'fly' ? 'Space' : rocketZone(alt);
    const tilt = mode === 'crash' ? 20 : clamp((x - 0.5) * -18 + axis * -8, -14, 14);
    sky.style.setProperty('--alt', alt);
    sky.style.setProperty('--x', x);
    ship.style.transform = `translateX(-50%) rotate(${tilt}deg)`;
    fill.style.transform = `scaleX(${clamp(fuel, 0, 1)})`;
    meter.classList.toggle('low', mode !== 'fly' && fuel < 0.3);
    meter.setAttribute('aria-valuenow', String(Math.round(clamp(fuel, 0, 1) * 100)));
    ship.classList.toggle('lit', mode === 'fly' || vy > 0.02 || (live && fuel > 0.15));
    if (fuelName) fuelName.textContent = mode === 'fly' ? 'Fly' : 'Fuel';
    if (name !== shown) {
      shown = name;
      band.textContent = name;
      sky.setAttribute('aria-label', mode === 'fly' ? 'Rocket in space. Steer left or right.' : `Rocket climbing through ${name}`);
    }
  };
  const shake = () => {
    sky.classList.remove('shake');
    void sky.offsetWidth;
    sky.classList.add('shake');
    clearTimeout(shakeTimer);
    shakeTimer = setTimeout(() => sky.classList.remove('shake'), 320);
  };
  const nearMoon = () => {
    const shipRect = ship.getBoundingClientRect();
    const padRect = pad.getBoundingClientRect();
    if (!padRect.width || !shipRect.width) return false;
    const dx = (shipRect.left + shipRect.width / 2) - (padRect.left + padRect.width / 2);
    const dy = (shipRect.top + shipRect.height / 2) - (padRect.top + padRect.height / 2);
    return Math.hypot(dx, dy) < 56;
  };
  const checkEnds = () => {
    if (mode !== 'question') return;
    if (alt >= 0.9) beginFly();
    else if (alt <= 0.02) crash();
  };
  const impulse = amount => {
    if (mode !== 'question') return;
    if (calm) {
      alt = clamp(alt + amount, 0, 1);
      vy = 0;
      report();
      checkEnds();
      paint();
      return;
    }
    vy += amount * riseK;
  };
  const crash = () => {
    if (mode !== 'question') return;
    mode = 'crash';
    live = false;
    alt = 0;
    vy = 0;
    fuel = 0;
    sky.classList.add('crashed');
    shake();
    paint();
    report();
    try { onCrash?.(); } catch { /* the round still ends */ }
  };
  const finishFly = () => {
    if (mode !== 'fly') return;
    mode = 'over';
    axis = 0;
    dragging = false;
    steer.hidden = true;
    try { onFlyDone?.({ landed }); } catch { /* the round still ends */ }
  };
  const beginFly = () => {
    if (mode !== 'question') return;
    mode = 'fly';
    live = false;
    vy = 0;
    alt = Math.max(alt, 0.9);
    flyLeft = flySeconds;
    landed = false;
    sky.classList.add('flying');
    pad.hidden = false;
    steer.hidden = false;
    detachFly();
    detachFly = attachSteer(play, {
      onAxis(next) { if (mode === 'fly') axis = next; },
      onDrag(clientX) {
        if (mode !== 'fly') return;
        const rect = sky.getBoundingClientRect();
        if (!rect.width) return;
        dragging = true;
        x = clamp((clientX - rect.left) / rect.width, 0.08, 0.92);
      },
      onRelease() { dragging = false; }
    });
    paint();
    report();
    try { onSpace?.(); } catch { /* steering still starts */ }
  };
  session.rocket = {
    arm() {
      if (session.dead || mode !== 'question') return false;
      live = true;
      fuel = 1;
      paint();
      return true;
    },
    boost() {
      if (session.dead || mode !== 'question' || !live) return false;
      const lift = 0.08 + 0.16 * fuel;
      live = false;
      fuel = 1;
      impulse(lift);
      paint();
      return true;
    },
    drop() {
      if (session.dead || mode !== 'question' || !live) return false;
      live = false;
      shake();
      impulse(-0.12);
      paint();
      return true;
    },
    burn() { return this.drop(); }
  };
  paint();
  session.cleanups.push(() => clearTimeout(shakeTimer));
  session.cleanups.push(() => detachFly());
  const frame = now => {
    if (session.dead) return;
    try {
      if (!sky.isConnected) { session.destroy(); return; }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (document.querySelector('dialog[open]') || questionHolding()) return;
      if (mode === 'question') {
        if (live) {
          fuel = Math.max(0, fuel - drain * dt);
          if (fuel <= 0) {
            live = false;
            fuel = 0;
            shake();
            try { onEmpty?.(); } catch { /* the rocket still falls */ }
            impulse(-0.18);
          }
        }
        if (!calm && Math.abs(vy) > 0.0001) {
          alt = clamp(alt + vy * dt, 0, 1);
          vy *= Math.exp(-riseK * dt);
          if (Math.abs(vy) < 0.015) vy = 0;
          report();
          checkEnds();
        }
      } else if (mode === 'fly') {
        flyLeft = Math.max(0, flyLeft - dt);
        fuel = flyLeft / flySeconds;
        if (!dragging && axis) x = clamp(x + axis * paceOf(0.55, calm) * dt, 0.08, 0.92);
        const close = nearMoon();
        if (close) landed = true;
        sky.classList.toggle('docked', landed && close);
        if (!calm) starfield.style.transform = `translateX(${-(now / 28) % 80}px)`;
        if (flyLeft <= 0) finishFly();
      }
      paint();
    } finally {
      if (!session.dead) session.raf = requestAnimationFrame(frame);
    }
  };
  session.raf = requestAnimationFrame(frame);
}

const RACE_METERS = 10;
const RACE_RUSH = 1.18;
const RACE_RUSH_MAX = 2.6;
const RACE_DRAW = 200;
const RACE_AHEAD = 86;
const RACE_CAM_H = 1000;

function easeIn(a, b, t) {
  return a + (b - a) * t * t;
}

function easeInOut(a, b, t) {
  const p = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
  return a + (b - a) * p;
}

function buildRaceTrack() {
  const segs = [];
  let last = 0;
  const addSegment = (curve, y) => {
    segs.push({ curve, y1: last, y2: y });
    last = y;
  };
  const addRoad = (enter, hold, leave, curve, hill) => {
    const startY = last;
    const endY = startY + hill * SEGMENT;
    const total = enter + hold + leave;
    for (let n = 0; n < enter; n++) addSegment(easeIn(0, curve, n / enter), easeInOut(startY, endY, n / total));
    for (let n = 0; n < hold; n++) addSegment(curve, easeInOut(startY, endY, (enter + n) / total));
    for (let n = 0; n < leave; n++) addSegment(easeInOut(curve, 0, n / leave), easeInOut(startY, endY, (enter + hold + n) / total));
  };
  addRoad(12, 16, 12, 0, 0);
  addRoad(28, 36, 28, 3.2, 20);
  addRoad(24, 32, 24, -4.4, -16);
  addRoad(20, 24, 20, 5, 28);
  addRoad(30, 20, 30, -2.4, 0);
  addRoad(24, 36, 24, 0, 34);
  addRoad(28, 28, 28, 4, -22);
  addRoad(40, 40, 40, -3, 12);
  const back = 90;
  const startY = last;
  for (let n = 0; n < back; n++) addSegment(0, easeInOut(startY, 0, n / back));
  return segs;
}

const RACE_TRACK = buildRaceTrack();

function raceSeg(index) {
  const length = RACE_TRACK.length;
  return RACE_TRACK[((index % length) + length) % length];
}

function raceProject(worldY, worldZ, camX, camY, camZ, width, height) {
  const cameraZ = worldZ - camZ;
  if (cameraZ <= CAM_DEPTH) return null;
  const scale = CAM_DEPTH / cameraZ;
  return {
    x: width / 2 + scale * -camX * width / 2,
    y: height / 2 - scale * (worldY - camY) * height / 2,
    w: scale * ROAD_W * width / 2,
    scale
  };
}

function inkOn(hex) {
  const raw = String(hex || '').replace('#', '');
  const full = raw.length === 3 ? raw.replace(/./g, ch => ch + ch) : raw;
  if (full.length !== 6) return '#244b3d';
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.64 ? '#244b3d' : '#fff';
}

function drawRaceShape(ctx, name, cx, cy, size, fill) {
  ctx.fillStyle = fill || '#8fac73';
  ctx.strokeStyle = '#244b3d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (name === 'circle') ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  else if (name === 'oval') ctx.ellipse(cx, cy, size / 1.5, size / 2.5, 0, 0, Math.PI * 2);
  else if (name === 'triangle') {
    ctx.moveTo(cx, cy - size / 2);
    ctx.lineTo(cx + size / 2, cy + size / 2);
    ctx.lineTo(cx - size / 2, cy + size / 2);
    ctx.closePath();
  } else if (name === 'diamond') {
    ctx.moveTo(cx, cy - size / 2);
    ctx.lineTo(cx + size / 2, cy);
    ctx.lineTo(cx, cy + size / 2);
    ctx.lineTo(cx - size / 2, cy);
    ctx.closePath();
  } else if (name === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 6 + i * Math.PI / 3;
      const px = cx + Math.cos(angle) * size / 2;
      const py = cy + Math.sin(angle) * size / 2;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
  } else if (name === 'star') {
    let rot = -Math.PI / 2;
    const step = Math.PI / 5;
    ctx.moveTo(cx + Math.cos(rot) * size / 2, cy + Math.sin(rot) * size / 2);
    for (let i = 0; i < 5; i++) {
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * size / 4.2, cy + Math.sin(rot) * size / 4.2);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * size / 2, cy + Math.sin(rot) * size / 2);
    }
    ctx.closePath();
  } else if (name === 'rectangle') ctx.roundRect(cx - size * 0.72, cy - size * 0.34, size * 1.44, size * 0.68, 3);
  else ctx.roundRect(cx - size / 2, cy - size / 2, size, size, 4);
  ctx.fill();
  ctx.stroke();
}

function drawGasCar(ctx, low, steer) {
  const body = low ? '#c46a22' : '#e23d32';
  const shade = low ? '#8d4614' : '#a32e28';
  const lean = clamp(steer || 0, -1, 1);
  ctx.fillStyle = 'rgba(20, 30, 18, 0.3)';
  ctx.beginPath();
  ctx.ellipse(2, 8, 36, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  if (Math.abs(lean) > 0.05) {
    const side = lean > 0 ? 1 : -1;
    const poke = 6 + Math.abs(lean) * 8;
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.roundRect(side > 0 ? 16 : -16 - poke, -40, poke, 28, 4);
    ctx.fill();
    ctx.fillStyle = '#c5e4f2';
    ctx.beginPath();
    ctx.roundRect(side > 0 ? 18 : -14 - poke * 0.7, -36, poke * 0.55, 12, 2);
    ctx.fill();
  }
  const tire = x => {
    ctx.fillStyle = '#1b1714';
    ctx.beginPath();
    ctx.roundRect(x - 7, -24, 14, 26, 5);
    ctx.fill();
    ctx.fillStyle = '#f3efe6';
    ctx.beginPath();
    ctx.arc(x, -11, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#244b3d';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x - 3, -11);
    ctx.lineTo(x + 3, -11);
    ctx.moveTo(x, -14);
    ctx.lineTo(x, -8);
    ctx.stroke();
  };
  tire(-30);
  tire(30);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(-24, -46, 48, 38, 8);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(-30, -16, 12, 14, 0, Math.PI, 0);
  ctx.ellipse(30, -16, 12, 14, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.roundRect(-16, -62, 32, 20, 7);
  ctx.fill();
  ctx.fillStyle = '#d7eef8';
  ctx.beginPath();
  ctx.moveTo(-12, -58);
  ctx.lineTo(12, -58);
  ctx.lineTo(10, -44);
  ctx.lineTo(-10, -44);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade;
  ctx.fillRect(-12, -64, 24, 4);
  ctx.fillStyle = '#2a312c';
  ctx.beginPath();
  ctx.roundRect(-22, -16, 44, 9, 3);
  ctx.fill();
  ctx.fillStyle = '#ffe08a';
  ctx.beginPath();
  ctx.roundRect(-22, -28, 9, 12, 2);
  ctx.roundRect(13, -28, 9, 12, 2);
  ctx.fill();
  ctx.fillStyle = '#f7f4ea';
  ctx.beginPath();
  ctx.roundRect(-7, -20, 14, 7, 1.5);
  ctx.fill();
  ctx.fillStyle = '#32634e';
  ctx.beginPath();
  ctx.ellipse(0, -16.6, 1.8, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function mountRace(root, { seconds = 18, gateSeconds = 11, reduced, nextGate, onPrompt, onOver }) {
  const session = openSession();
  root.innerHTML = `<div class="race-play"><div class="race-hud"><p class="race-distance"><span id="raceMeters">0</span> m<small id="raceNote">distance</small></p><div class="fuel-row"><span id="fuelLabel">Gas</span><div class="fuel" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" aria-labelledby="fuelLabel"><span></span></div></div></div><div class="arcade racer"><canvas class="racer-view race-view" aria-hidden="true"></canvas><ul class="race-lanes" aria-label="Answer lanes"></ul>${steerButtons()}</div></div>`;
  const stage = root.querySelector('.arcade');
  const canvas = root.querySelector('canvas');
  const lanesEl = root.querySelector('.race-lanes');
  const metersEl = root.querySelector('#raceMeters');
  const noteEl = root.querySelector('#raceNote');
  const meter = root.querySelector('.fuel');
  const fill = meter.querySelector('span');
  const ctx = canvas.getContext('2d');
  const driveScale = paceOf(1, reduced);
  const approach = (RACE_AHEAD * SEGMENT) / Math.max(1, gateSeconds);
  let playerX = 0;
  let position = 0;
  let meters = 0;
  let fuel = 1;
  let axis = 0;
  let gate = null;
  let gateZ = 0;
  let hold = 0;
  let flash = '';
  let gates = 0;
  let rush = 1;
  let ended = false;
  let last = 0;

  const aimed = () => {
    const count = gate?.options?.length || 1;
    return clamp(Math.floor((playerX + 1) / 2 * count), 0, count - 1);
  };
  const publishLanes = () => {
    lanesEl.innerHTML = (gate?.options || []).map(option => `<li>${esc(option.label)}</li>`).join('');
  };
  const hud = () => {
    if (metersEl) metersEl.textContent = String(Math.max(0, Math.round(meters)));
    if (noteEl) noteEl.textContent = flash === 'ok' ? 'Full tank' : rush >= 2 ? 'Flying' : rush >= 1.5 ? 'Fast' : rush > 1.02 ? 'Faster' : 'distance';
    fill.style.transform = `scaleX(${fuel})`;
    meter.classList.toggle('low', fuel < 0.3);
    meter.setAttribute('aria-valuenow', String(Math.round(fuel * 100)));
  };
  const over = reason => {
    if (ended || session.dead) return;
    ended = true;
    const distance = Math.max(0, Math.round(meters));
    const correct = gates;
    session.destroy();
    try { onOver?.({ distance, reason, correct }); } catch { /* the result screen still opens */ }
  };
  const place = (next, from) => {
    if (!next?.options?.length) { over('empty'); return false; }
    gate = next;
    gateZ = from + RACE_AHEAD * SEGMENT;
    flash = '';
    publishLanes();
    hud();
    try { onPrompt?.(gate); } catch { /* the signs still show the choices */ }
    return true;
  };

  const drawBadge = (x, y, w, option, state) => {
    const h = Math.max(14, w * 0.62);
    const top = y - h;
    const radius = clamp(h * 0.16, 3, 14);
    const colorCard = !!(option.swatch && option.fill);
    const ink = colorCard ? inkOn(option.fill) : '#244b3d';
    ctx.fillStyle = colorCard
      ? option.fill
      : state === 'bad' ? '#fff4ec' : state === 'good' ? '#e5f0dc' : state === 'here' ? '#f3f8ec' : '#fff';
    ctx.strokeStyle = state === 'bad' ? '#a85a2a' : colorCard ? '#244b3d' : state === 'here' ? '#5d7a45' : '#32634e';
    ctx.lineWidth = state === 'here' || state === 'good' || colorCard ? clamp(w * 0.045, 1.5, 4) : clamp(w * 0.03, 1, 2.5);
    ctx.beginPath();
    ctx.roundRect(x - w / 2, top, w, h, radius);
    ctx.fill();
    ctx.stroke();
    const picture = !!option.shape;
    const mark = Math.min(h * 0.52, w * 0.42);
    if (picture) drawRaceShape(ctx, option.shape, x, top + h * 0.38, mark, option.fill);
    ctx.fillStyle = ink;
    let size = picture ? Math.max(8, Math.floor(h * 0.24)) : Math.max(8, Math.floor(h * 0.42));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${size}px Outfit, sans-serif`;
    while (size > 8 && ctx.measureText(option.label).width > w - 10) {
      size -= 1;
      ctx.font = `700 ${size}px Outfit, sans-serif`;
    }
    if (size >= 8) ctx.fillText(option.label, x, picture ? top + h * 0.8 : top + h / 2);
  };

  const paint = () => {
    const cssW = Math.max(280, stage.clientWidth || 640);
    const cssH = Math.max(240, canvas.clientHeight || 380);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const width = cssW;
    const height = cssH;
    const base = Math.floor(position / SEGMENT);
    const pct = position / SEGMENT - base;
    const under = raceSeg(base);
    const playerY = under.y1 + (under.y2 - under.y1) * pct;
    const camY = playerY + RACE_CAM_H;
    const horizon = clamp(height * 0.5 - playerY * 0.012, height * 0.28, height * 0.62);
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#4aa4d8');
    sky.addColorStop(0.55, '#72d7ee');
    sky.addColorStop(1, '#b7ebc8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    const scroll = position * 0.02;
    const hill = (color, amp, y0, freq, shift) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 8) {
        const wave = Math.sin((x + scroll * shift) * freq) * amp + Math.sin((x + scroll * shift) * freq * 0.37) * amp * 0.45;
        ctx.lineTo(x, y0 + wave);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    };
    hill('#6ea0c4', 18, horizon - 28, 0.012, 0.35);
    hill('#3e8f4a', 22, horizon + 4, 0.02, 0.7);
    hill('#146b28', 16, horizon + 18, 0.028, 1.15);
    const count = gate?.options?.length || 3;
    const here = aimed();
    const signIndex = gate ? Math.round(gateZ / SEGMENT) : -1;
    let maxY = height;
    let curveX = 0;
    let curveDx = -(raceSeg(base).curve * pct);
    const drawn = [];
    let signPoint = null;
    let carPoint = null;
    for (let n = 1; n <= RACE_DRAW; n++) {
      const index = base + n;
      const seg = raceSeg(index);
      const camNear = playerX * ROAD_W - curveX;
      const camFar = playerX * ROAD_W - curveX - curveDx;
      const p1 = raceProject(seg.y1, index * SEGMENT, camNear, camY, position, width, height);
      const p2 = raceProject(seg.y2, (index + 1) * SEGMENT, camFar, camY, position, width, height);
      curveX += curveDx;
      curveDx += seg.curve;
      if (!p1 || !p2 || p2.y >= maxY || p1.y <= p2.y) continue;
      const dark = Math.floor(index / 3) % 2 === 1;
      const grass = dark ? '#009a00' : '#10aa10';
      const road = dark ? '#696969' : '#6b6b6b';
      const rumble = dark ? '#f4f4f4' : '#d62828';
      ctx.fillStyle = grass;
      ctx.fillRect(0, p2.y, width, p1.y - p2.y);
      const r1 = p1.w / Math.max(6, count * 2);
      const r2 = p2.w / Math.max(6, count * 2);
      polygon(ctx, p1.x - p1.w - r1, p1.y, p1.x - p1.w, p1.y, p2.x - p2.w, p2.y, p2.x - p2.w - r2, p2.y, rumble);
      polygon(ctx, p1.x + p1.w + r1, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x + p2.w + r2, p2.y, rumble);
      polygon(ctx, p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y, road);
      if (!dark) {
        for (let lane = 1; lane < count; lane++) {
          const t = lane / count * 2 - 1;
          const mark1 = Math.max(1, p1.w / Math.max(32, count * 8));
          const mark2 = Math.max(1, p2.w / Math.max(32, count * 8));
          polygon(ctx, p1.x + t * p1.w - mark1, p1.y, p1.x + t * p1.w + mark1, p1.y, p2.x + t * p2.w + mark2, p2.y, p2.x + t * p2.w - mark2, p2.y, '#cccccc');
        }
      }
      const fog = clamp((n / RACE_DRAW - 0.55) / 0.45, 0, 0.72);
      if (fog) {
        ctx.fillStyle = `rgba(114, 215, 238, ${fog})`;
        ctx.fillRect(0, p2.y, width, p1.y - p2.y);
      }
      drawn.push({ index, x: p1.x, y: p1.y, w: p1.w, scale: p1.scale, clip: maxY });
      if (index === signIndex) signPoint = drawn[drawn.length - 1];
      if (index === base + 3) carPoint = p1;
      maxY = p1.y;
    }
    for (let i = drawn.length - 1; i >= 0; i--) {
      const seg = drawn[i];
      if (seg.index % 8 !== 0 || seg.y > seg.clip) continue;
      const side = Math.floor(seg.index / 8) % 2 === 0 ? -1 : 1;
      const h = clamp(seg.scale * 340000, 6, 150);
      const tw = h * 0.42;
      const tx = seg.x + side * (seg.w + tw);
      ctx.fillStyle = '#6b3a1f';
      ctx.fillRect(tx - tw * 0.08, seg.y - h * 0.28, tw * 0.16, h * 0.28);
      ctx.fillStyle = side < 0 ? '#0c6a22' : '#148a32';
      ctx.beginPath();
      ctx.moveTo(tx, seg.y - h);
      ctx.lineTo(tx + tw * 0.55, seg.y - h * 0.18);
      ctx.lineTo(tx - tw * 0.55, seg.y - h * 0.18);
      ctx.closePath();
      ctx.fill();
    }
    if (gate && signPoint && signPoint.y <= signPoint.clip) {
      const laneW = Math.max(8, (signPoint.w * 2) / count);
      const badgeW = clamp(laneW * 0.86, 12, width * 0.42);
      const stateFor = i => flash === 'bad'
        ? (i === here && i !== gate.answer ? 'bad' : i === gate.answer ? 'good' : '')
        : flash === 'ok'
          ? (i === gate.answer ? 'good' : '')
          : (i === here ? 'here' : '');
      gate.options.forEach((option, i) => {
        if (i === here) return;
        drawBadge(signPoint.x + laneCenter(i, count) * signPoint.w, signPoint.y, badgeW, option, stateFor(i));
      });
      const picked = gate.options[here];
      if (picked) drawBadge(signPoint.x + laneCenter(here, count) * signPoint.w, signPoint.y, badgeW * 1.06, picked, stateFor(here));
    }
    const carX = width / 2;
    const bounce = carPoint ? clamp((height * 0.92 - carPoint.y) * 0.08, -10, 16) : 0;
    const carY = height - 34 - bounce;
    ctx.save();
    ctx.translate(carX, carY);
    ctx.rotate(clamp(axis, -1, 1) * -0.14);
    ctx.scale(2.15, 2.15);
    drawGasCar(ctx, fuel < 0.3, axis);
    ctx.restore();
    hud();
  };

  if (!place(nextGate?.(), 0)) return;

  session.cleanups.push(attachSteer(stage, {
    onAxis(next) { axis = next; },
    onDrag(_clientX, dx) {
      if (!dx || hold || ended) return;
      playerX = clamp(playerX + dx / 160, -0.92, 0.92);
    }
  }));

  const frame = now => {
    if (session.dead) return;
    try {
      if (!canvas.isConnected) { session.destroy(); return; }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (document.querySelector('dialog[open]') || questionHolding()) { paint(); return; }
      const step = driveScale * dt;
      const move = step * rush;
      if (hold) {
        hold = Math.max(0, hold - dt);
        if (!hold && flash === 'bad') { over('wrong'); return; }
        if (!hold && flash === 'ok') {
          position = gateZ + SEGMENT * 2;
          if (!place(nextGate?.(), position)) return;
        }
        paint();
        return;
      }
      if (axis) playerX = clamp(playerX + axis * 1.7 * step, -0.92, 0.92);
      position += approach * move;
      meters += RACE_METERS * move;
      fuel = Math.max(0, fuel - step / Math.max(1, seconds));
      if (gate && position >= gateZ) {
        if (aimed() === gate.answer) {
          gates += 1;
          rush = Math.min(RACE_RUSH_MAX, rush * RACE_RUSH);
          fuel = 1;
          flash = 'ok';
          hold = 0.45;
          stage.classList.remove('shake');
        } else {
          flash = 'bad';
          hold = 0.7;
          stage.classList.add('shake');
        }
      } else if (fuel <= 0) {
        fuel = 0;
        over('empty');
        return;
      }
      paint();
    } finally {
      if (!session.dead) session.raf = requestAnimationFrame(frame);
    }
  };
  session.raf = requestAnimationFrame(frame);
}
