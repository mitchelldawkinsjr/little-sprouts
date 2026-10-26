/**
 * Catch the light — a bulb runs around a ring. Tap when it lands on the green one.
 * Stroll, Bike, Car, Jet, and Rocket keep one speed.
 * Rush starts slow and gets faster after every catch, until the light is too quick.
 * The ring, the chase, and the one-bulb window follow Catch That Light.
 * This ring and the questions are drawn here.
 */

export const LIGHT_BULBS = 60;
export const LIGHT_PACES = { stroll: 5, bike: 4, car: 3, jet: 2, rocket: 1 };
export const RUSH_START = 5;
export const RUSH_FLOOR = 0.34;
export const RUSH_STEP = 0.85;

const PACE_NAMES = [
  ['stroll', 'Stroll'],
  ['bike', 'Bike'],
  ['car', 'Car'],
  ['jet', 'Jet'],
  ['rocket', 'Rocket'],
  ['rush', 'Rush']
];

let active = null;

export function lightWindow(level) {
  const bulbs = level >= 3 ? 0.6 : level >= 2 ? 1 : 2;
  return bulbs / LIGHT_BULBS;
}

export function lightGap(phase) {
  const p = ((phase % 1) + 1) % 1;
  return Math.min(p, 1 - p);
}

export function lightVerdict(phase, level) {
  const gap = lightGap(phase);
  if (gap <= lightWindow(level)) return 'catch';
  if (gap <= 3 / LIGHT_BULBS) return 'almost';
  return 'miss';
}

export function rushSeconds(seconds) {
  const next = (+seconds || RUSH_START) * RUSH_STEP;
  return Math.max(RUSH_FLOOR, Math.round(next * 1000) / 1000);
}

export function stopLight() {
  active?.destroy();
  active = null;
}

function call(fn, arg) {
  try { return fn?.(arg); }
  catch { return undefined; }
}

export function mountLight(root, { level = 1, reduced = false, onPick, onCatch, onMiss } = {}) {
  stopLight();
  if (!root) return { setLabel() {} };
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

  let pace = 'car';
  let seconds = LIGHT_PACES.car;
  let label = '';
  let phase = 'menu';
  let angle = 0.08;
  let last = 0;
  let introAt = 0;
  let flashUntil = 0;
  let verdict = '';
  let streak = 0;
  let locked = false;
  let width = 320;
  let height = 360;

  root.innerHTML = `<div class="light-play">
    <canvas></canvas>
    <button type="button" class="light-catch" hidden>Tap</button>
    <div class="light-menu">
      <p class="light-kicker">Select speed</p>
      <div class="light-speeds" role="group" aria-label="Light speed">${PACE_NAMES.map(([id, name]) => `<button type="button" data-pace="${id}" aria-pressed="${id === 'car'}">${name}</button>`).join('')}</div>
      <p class="light-note" id="lightNote">The light keeps this speed.</p>
      <button type="button" class="primary light-start">Start</button>
    </div>
    <div class="light-over" hidden>
      <p class="light-over-line"></p>
      <button type="button" class="primary">Try again</button>
    </div>
  </div>`;

  const stage = root.querySelector('.light-play');
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const catchBtn = root.querySelector('.light-catch');
  const menu = root.querySelector('.light-menu');
  const note = root.querySelector('#lightNote');
  const over = root.querySelector('.light-over');
  const overLine = root.querySelector('.light-over-line');
  const again = over.querySelector('button');
  const paceButtons = [...root.querySelectorAll('[data-pace]')];

  const paintPaces = () => {
    paceButtons.forEach(button => {
      const on = button.dataset.pace === pace;
      button.setAttribute('aria-pressed', String(on));
    });
    note.textContent = pace === 'rush'
      ? 'Rush starts slow. Every catch makes it faster, until you cannot time it.'
      : 'The light keeps this speed. Tap when it hits the green bulb.';
  };

  const layout = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = Math.max(260, rect.width);
    height = Math.max(280, rect.height);
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const introWord = now => {
    const t = now - introAt;
    if (t < 400) return 'Catch';
    if (t < 800) return 'That';
    if (t < 1200) return 'Light!';
    if (t < 1600) return '';
    return 'Go!';
  };

  const showMenu = () => {
    phase = 'menu';
    menu.hidden = false;
    over.hidden = true;
    catchBtn.hidden = true;
    paintPaces();
  };

  const beginRun = () => {
    angle = 0.08;
    locked = false;
    phase = 'run';
    catchBtn.hidden = false;
    catchBtn.textContent = 'Tap';
    last = 0;
  };

  const startSpin = () => {
    menu.hidden = true;
    over.hidden = true;
    catchBtn.hidden = false;
    introAt = performance.now();
    phase = 'intro';
    catchBtn.textContent = 'Catch';
    last = 0;
  };

  const drawBulb = (x, y, radius, color, glow) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = glow ? color : 'transparent';
    ctx.shadowBlur = glow ? 16 : 0;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const draw = now => {
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height * 0.46;
    const radius = Math.min(width, height) * 0.34;
    const ring = ctx.createRadialGradient(cx, cy, radius * 0.45, cx, cy, radius * 1.2);
    ring.addColorStop(0, '#12080c');
    ring.addColorStop(0.7, '#3a1218');
    ring.addColorStop(0.84, '#111');
    ring.addColorStop(1, '#0000');
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.22, 0, Math.PI * 2);
    ctx.fill();

    const spinning = phase === 'run' || phase === 'flash' || phase === 'hold';
    const lit = spinning ? Math.floor(angle * LIGHT_BULBS) % LIGHT_BULBS : -1;
    const twinkle = Math.floor(now / 180) % 4;
    for (let i = 0; i < LIGHT_BULBS; i++) {
      const theta = Math.PI / 2 + (i / LIGHT_BULBS) * Math.PI * 2;
      const x = cx + Math.cos(theta) * radius;
      const y = cy + Math.sin(theta) * radius;
      const target = i === 0;
      const neighbor = i === 1 || i === LIGHT_BULBS - 1;
      let color = '#2a2208';
      let glow = false;
      if (phase === 'intro' && i % 4 === twinkle) {
        color = '#ffe14a';
        glow = true;
      } else if (i === lit) {
        color = target ? '#d6ff6a' : '#ffe14a';
        glow = true;
      } else if (target) color = '#1ec75a';
      else if (neighbor) color = '#8fbf2a';
      drawBulb(x, y, i === lit ? radius * 0.055 : radius * 0.04, color, glow);
    }

    if (spinning && !reduced) {
      const pulse = 0.85 + Math.sin(now / 140) * 0.15;
      const x = cx + Math.cos(Math.PI / 2) * radius;
      const y = cy + Math.sin(Math.PI / 2) * radius;
      ctx.strokeStyle = '#7dffb2';
      ctx.globalAlpha = 0.45 + pulse * 0.2;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.11 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const btnR = radius * 0.38;
    for (let ring = 8; ring >= 1; ring--) {
      ctx.fillStyle = `hsl(174, 72%, ${18 + ring * 6}%)`;
      ctx.beginPath();
      ctx.arc(cx, cy, btnR * (0.55 + ring * 0.06), 0, Math.PI * 2);
      ctx.fill();
    }

    if (label && phase !== 'menu') {
      const text = String(label);
      let size = Math.max(16, Math.min(28, radius * 0.16));
      ctx.font = `700 ${size}px Outfit, sans-serif`;
      while (size > 12 && ctx.measureText(text).width > radius * 1.1) {
        size -= 1;
        ctx.font = `700 ${size}px Outfit, sans-serif`;
      }
      ctx.fillStyle = '#f4fff8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, cx, cy + radius * 0.62);
    }
  };

  const frame = now => {
    if (session.dead) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (phase === 'intro') {
      catchBtn.textContent = introWord(now);
      if (now - introAt >= 2000) beginRun();
    } else if (phase === 'run') {
      angle = (angle + dt / seconds) % 1;
    } else if (phase === 'flash' && now >= flashUntil) {
      settle();
    }
    if (session.dead) return;
    draw(now);
    session.raf = requestAnimationFrame(frame);
  };

  const settle = () => {
    if (verdict === 'catch') {
      streak += 1;
      if (pace === 'rush') seconds = rushSeconds(seconds);
      const stop = call(onCatch, { streak, seconds, pace });
      if (session.dead || stop === 'done') {
        phase = 'hold';
        return;
      }
      beginRun();
      return;
    }
    const caught = streak;
    streak = 0;
    const kind = verdict;
    if (pace === 'rush') {
      phase = 'over';
      catchBtn.hidden = true;
      over.hidden = false;
      overLine.textContent = caught ? `Too fast. You caught ${caught}.` : 'Too fast.';
      call(onMiss, { end: true, streak: caught, verdict: kind, pace });
      return;
    }
    call(onMiss, { end: false, streak: 0, verdict: kind, pace });
    if (session.dead) return;
    beginRun();
  };

  const tap = () => {
    if (phase !== 'run' || locked) return;
    locked = true;
    verdict = lightVerdict(angle, level);
    phase = 'flash';
    flashUntil = performance.now() + (reduced ? 520 : 880);
    catchBtn.textContent = verdict === 'catch' ? 'Amazing!' : verdict === 'almost' ? 'Almost' : 'Missed';
  };

  const onPointer = event => {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest('.light-menu, .light-over')) return;
    tap();
  };
  const onKey = event => {
    if (phase !== 'run') return;
    if (event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    tap();
  };
  const onResize = () => layout();

  paceButtons.forEach(button => {
    button.onclick = () => {
      pace = button.dataset.pace;
      paintPaces();
    };
  });
  root.querySelector('.light-start').onclick = () => {
    const picked = call(onPick, pace);
    if (session.dead) return;
    label = typeof picked === 'string' ? picked : '';
    const base = pace === 'rush' ? RUSH_START : (LIGHT_PACES[pace] || LIGHT_PACES.car);
    seconds = reduced ? base * 1.35 : base;
    streak = 0;
    startSpin();
  };
  again.onclick = () => {
    streak = 0;
    label = '';
    showMenu();
  };
  catchBtn.onclick = tap;
  stage.addEventListener('pointerdown', onPointer);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);
  session.cleanups.push(() => {
    stage.removeEventListener('pointerdown', onPointer);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
  });

  layout();
  showMenu();
  session.raf = requestAnimationFrame(frame);

  return {
    setLabel(text) {
      if (session.dead) return;
      label = String(text ?? '');
    }
  };
}
