const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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

export function mountCatch(root, { prompt, choices, target, speed, reduced, onDone, onMiss }) {
  const session = openSession();
  const list = [...choices];
  if (!list.some(choice => String(choice) === String(target))) list.push(target);
  let marked = false;
  const items = list.map(choice => {
    const ok = !marked && String(choice) === String(target);
    if (ok) marked = true;
    return { choice, ok, x: 0, y: 0, el: null };
  });
  root.innerHTML = `<div class="arcade"><div class="field" role="group" aria-label="${esc(prompt)}. Move left and right to catch the right answer.">${items.map(item => `<span class="falling">${esc(item.choice)}</span>`).join('')}<span class="basket" aria-hidden="true">🧺</span></div>${steerButtons()}</div>`;
  const stage = root.querySelector('.arcade');
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
  let missed = false;
  let holdUntil = 0;
  let waveTimer = 0;
  let last = 0;
  session.cleanups.push(() => clearTimeout(waveTimer));

  const paintBasket = () => { basket.style.left = `${basketX * 100}%`; };
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
  session.cleanups.push(attachSteer(stage, {
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
      if (holdUntil || document.querySelector('dialog[open]') || !steered) return;
      if (!dragging && axis) {
        basketX = clamp(basketX + axis * 1.05 * dt, minX, maxX);
        paintBasket();
      }
      const fieldRect = field.getBoundingClientRect();
      const basketRect = basket.getBoundingClientRect();
      for (const item of items) {
        item.y += fall * dt;
        item.el.style.top = `${item.y * 100}%`;
        const rect = item.el.getBoundingClientRect();
        const hit = rect.bottom >= basketRect.top + 6 && rect.top <= basketRect.bottom && rect.right > basketRect.left + 8 && rect.left < basketRect.right - 8;
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

export function mountLanes(root, { prompt, choices, target, speed, reduced, onDone, onMiss }) {
  const session = openSession();
  const lanes = [...choices];
  if (!lanes.some(choice => String(choice) === String(target))) lanes.push(target);
  const correct = Math.max(0, lanes.findIndex(choice => String(choice) === String(target)));
  root.innerHTML = `<div class="arcade"><div class="road" style="--lanes:${lanes.length}" role="group" aria-label="${esc(prompt)}. Move left and right to reach that word.">${lanes.map(word => `<div class="lane"><span class="sign">${esc(word)}</span></div>`).join('')}<div class="finish" aria-hidden="true"></div><div class="car" aria-hidden="true">🚗</div></div>${steerButtons()}</div>`;
  const stage = root.querySelector('.arcade');
  const road = root.querySelector('.road');
  const car = root.querySelector('.car');
  const signs = [...road.querySelectorAll('.lane')];
  const drive = paceOf(speed, reduced);
  let lane = Math.floor((lanes.length - 1) / 2);
  let progress = 0;
  let axis = 0;
  let repeat = 0;
  let dragX = 0;
  let steered = false;
  let missed = false;
  let holdUntil = 0;
  let waveTimer = 0;
  let last = 0;
  session.cleanups.push(() => clearTimeout(waveTimer));

  const paint = () => {
    road.style.setProperty('--lane', lane);
    road.style.setProperty('--progress', progress);
    signs.forEach((el, i) => el.classList.toggle('here', i === lane));
  };
  const step = dir => {
    lane = clamp(lane + dir, 0, lanes.length - 1);
    paint();
  };
  const stopRepeat = () => {
    clearInterval(repeat);
    repeat = 0;
  };
  const miss = () => {
    if (session.dead || holdUntil) return;
    missed = true;
    holdUntil = 1;
    signs[lane]?.classList.add('wrong');
    road.classList.add('shake');
    clearTimeout(waveTimer);
    waveTimer = setTimeout(() => {
      if (session.dead) return;
      holdUntil = 0;
      reset();
    }, 420);
    try { onMiss?.(); } catch { /* the car still gets another run */ }
  };
  const win = () => {
    if (session.dead || holdUntil) return;
    signs[lane]?.classList.add('caught');
    const clean = !missed;
    session.destroy();
    onDone?.(clean);
  };
  const reset = () => {
    progress = 0;
    lane = Math.floor((lanes.length - 1) / 2);
    signs.forEach(el => el.classList.remove('wrong', 'caught'));
    road.classList.remove('shake');
    paint();
  };

  paint();
  session.cleanups.push(() => stopRepeat());
  session.cleanups.push(attachSteer(stage, {
    onAxis(next) {
      if (next) steered = true;
      if (next === axis) return;
      axis = next;
      stopRepeat();
      if (!next || session.dead) return;
      step(next);
      repeat = setInterval(() => step(axis), 340);
    },
    onDrag(_clientX, dx) {
      if (dx) steered = true;
      dragX += dx;
      while (dragX >= 36) { dragX -= 36; step(1); }
      while (dragX <= -36) { dragX += 36; step(-1); }
    },
    onRelease() { dragX = 0; }
  }));

  const frame = now => {
    if (session.dead) return;
    try {
      if (!road.isConnected) { session.destroy(); return; }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (holdUntil || document.querySelector('dialog[open]') || !steered) return;
      progress = Math.min(1, progress + drive * dt);
      paint();
      if (progress >= 1) {
        if (lane === correct) win();
        else miss();
      }
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

export function mountRocket(root, { altitude = 0, step = 0.2, seconds = 18, reduced, onEmpty, onAltitude }) {
  const session = openSession();
  const skyAlt = n => n >= 0.9 ? 'The Moon' : n >= 0.65 ? 'Stars' : n >= 0.4 ? 'Sky' : n >= 0.18 ? 'Clouds' : 'Garden';
  const stars = Array.from({ length: 14 }, (_, i) => `<i style="left:${(i * 17 + 6) % 92}%;top:${(i * 13 + 4) % 78}%"></i>`).join('');
  root.innerHTML = `<div class="rocket-play"><div class="rocket-sky" style="--alt:${altitude}" role="img" aria-label="Rocket over the garden"><div class="rocket-column" aria-hidden="true"><div class="rocket-moon"></div><div class="rocket-stars">${stars}</div><div class="rocket-clouds"><span></span><span></span><span></span></div><div class="rocket-hill"></div></div><svg class="rocket-ship lit" viewBox="0 0 64 96" aria-hidden="true"><path class="flame" d="M26 78h12l-6 16z"/><path fill="#5d7a45" d="M8 70 L20 58 V78 Z"/><path fill="#5d7a45" d="M56 70 L44 58 V78 Z"/><rect x="20" y="28" width="24" height="46" rx="8" fill="#faf9f5" stroke="#32634e" stroke-width="2"/><path fill="#e07a2f" d="M20 36 L32 8 L44 36 Z"/><circle cx="32" cy="48" r="6" fill="#8ec4ea" stroke="#32634e" stroke-width="2"/></svg><span class="rocket-band">Garden</span></div><div class="fuel-row"><span id="fuelLabel">Fuel</span><div class="fuel" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" aria-labelledby="fuelLabel"><span></span></div></div></div>`;
  const sky = root.querySelector('.rocket-sky');
  const ship = root.querySelector('.rocket-ship');
  const meter = root.querySelector('.fuel');
  const fill = meter.querySelector('span');
  const band = root.querySelector('.rocket-band');
  let alt = clamp(altitude, 0, 1);
  let fuel = 1;
  let hold = 0;
  let coasting = false;
  let last = 0;
  let shakeTimer = 0;
  let shown = '';
  const drain = paceOf(1 / Math.max(1, seconds), reduced);
  const paint = () => {
    const name = skyAlt(alt);
    sky.style.setProperty('--alt', alt);
    fill.style.transform = `scaleX(${fuel})`;
    meter.classList.toggle('low', fuel < 0.3);
    meter.setAttribute('aria-valuenow', String(Math.round(fuel * 100)));
    ship.classList.toggle('lit', fuel > 0.04);
    if (name !== shown) {
      shown = name;
      band.textContent = name;
      sky.setAttribute('aria-label', `Rocket climbing through ${name}`);
    }
  };
  const shake = () => {
    sky.classList.remove('shake');
    void sky.offsetWidth;
    sky.classList.add('shake');
    clearTimeout(shakeTimer);
    shakeTimer = setTimeout(() => sky.classList.remove('shake'), 320);
  };
  const empty = () => {
    if (session.dead || coasting || hold) return false;
    alt = clamp(alt - step, 0, 1);
    fuel = 0.7;
    hold = 0.9;
    shake();
    onAltitude?.(alt);
    paint();
    try { onEmpty?.(); } catch { /* the tank still refills */ }
    return true;
  };
  session.rocket = {
    boost() {
      if (session.dead || coasting) return false;
      coasting = true;
      alt = clamp(alt + step, 0, 1);
      fuel = 1;
      hold = 0;
      onAltitude?.(alt);
      paint();
      return true;
    },
    burn() {
      if (session.dead || coasting || hold) return false;
      fuel = Math.max(0, fuel - 0.3);
      shake();
      paint();
      if (fuel <= 0) return empty();
      return false;
    }
  };
  paint();
  session.cleanups.push(() => clearTimeout(shakeTimer));
  const frame = now => {
    if (session.dead) return;
    try {
      if (!sky.isConnected) { session.destroy(); return; }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (hold) {
        hold = Math.max(0, hold - dt);
        return;
      }
      if (coasting || document.querySelector('dialog[open]')) return;
      fuel = Math.max(0, fuel - drain * dt);
      paint();
      if (fuel <= 0) empty();
    } finally {
      if (!session.dead) session.raf = requestAnimationFrame(frame);
    }
  };
  session.raf = requestAnimationFrame(frame);
}
