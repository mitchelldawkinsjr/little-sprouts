/**
 * Catch the light — a bulb runs around a ring. Tap when it lands on the right spot.
 * Stroll, Bike, Car, Jet, and Rocket keep one speed.
 * Rush starts slow and gets faster after every catch, until the light is too quick.
 * With questions on, answer bulbs light up on the wheel and all look the same.
 * Catch the moving light on the right answer, not a wrong one.
 * The ring, the chase, and the one-bulb window follow Catch That Light.
 * This ring and the questions are drawn here.
 */

export const LIGHT_BULBS = 60;
export const LIGHT_PACES = { stroll: 5, bike: 4, car: 3, jet: 2, rocket: 1 };
export const RUSH_START = 5;
export const RUSH_FLOOR = 0.34;
export const RUSH_STEP = 0.85;

/** Even spots around the ring for answer lights. */
export function lightMarkSlots(count) {
  const n = Math.max(1, Math.min(LIGHT_BULBS, count | 0));
  if (n === 1) return [0];
  const slots = [];
  for (let k = 0; k < n; k++) {
    const i = Math.round((k * LIGHT_BULBS) / n) % LIGHT_BULBS;
    if (!slots.includes(i)) slots.push(i);
  }
  while (slots.length < n) {
    const i = slots.length % LIGHT_BULBS;
    if (!slots.includes(i)) slots.push(i);
    else break;
  }
  return slots;
}

const PACE_NAMES = [
  ['stroll', 'Stroll', '🚶'],
  ['bike', 'Bike', '🚲'],
  ['car', 'Car', '🚗'],
  ['jet', 'Jet', '✈️'],
  ['rocket', 'Rocket', '🚀'],
  ['rush', 'Rush', '⚡']
];

let active = null;

export function lightWindow(level) {
  const bulbs = level >= 3 ? 0.6 : level >= 2 ? 1 : 2;
  return bulbs / LIGHT_BULBS;
}

export function lightGap(phase) {
  return lightGapTo(phase, 0);
}

export function lightGapTo(phase, targetIndex = 0) {
  const target = (((targetIndex % LIGHT_BULBS) + LIGHT_BULBS) % LIGHT_BULBS) / LIGHT_BULBS;
  const p = ((phase % 1) + 1) % 1;
  const d = ((p - target) % 1 + 1) % 1;
  return Math.min(d, 1 - d);
}

export function lightNearestMark(phase, marks) {
  if (!marks?.length) return null;
  let best = null;
  let bestGap = Infinity;
  for (const mark of marks) {
    const gap = lightGapTo(phase, mark.i);
    if (gap < bestGap) {
      bestGap = gap;
      best = mark;
    }
  }
  return best ? { mark: best, gap: bestGap } : null;
}

export function lightVerdict(phase, level, targetIndex = 0) {
  const gap = lightGapTo(phase, targetIndex);
  if (gap <= lightWindow(level)) return 'catch';
  if (gap <= 3 / LIGHT_BULBS) return 'almost';
  return 'miss';
}

/** With answer lights on the wheel, a tap near the right one catches; near a wrong one fails. */
export function lightVerdictAt(phase, level, marks) {
  if (!marks?.length) return lightVerdict(phase, level, 0);
  const hit = lightNearestMark(phase, marks);
  if (!hit) return 'miss';
  const window = lightWindow(level);
  const almost = 3 / LIGHT_BULBS;
  if (hit.gap <= window) return hit.mark.ok ? 'catch' : 'wrong';
  if (hit.mark.ok && hit.gap <= almost) return 'almost';
  if (!hit.mark.ok && hit.gap <= almost) return 'wrong';
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
  if (!root) return { setLabel() {}, setMarks() {} };
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
  let marks = [];
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
      <div class="light-speeds" role="group" aria-label="Light speed">${PACE_NAMES.map(([id, name, icon]) => `<button type="button" data-pace="${id}" aria-pressed="${id === 'car'}" aria-label="${name}"><span class="light-pace-icon" aria-hidden="true">${icon}</span><span class="light-pace-name">${name}</span></button>`).join('')}</div>
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

  const targetIndex = () => marks.find(mark => mark.ok)?.i ?? 0;

  const paintPaces = () => {
    paceButtons.forEach(button => {
      const on = button.dataset.pace === pace;
      button.setAttribute('aria-pressed', String(on));
    });
    note.textContent = pace === 'rush'
      ? 'Rush starts slow. Every catch makes it faster, until you cannot time it.'
      : 'The light keeps this speed. Tap when it hits the right answer, not a wrong one.';
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
    angle = Math.random() * 0.85 + 0.08;
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

  const drawPill = (x, y, text) => {
    let size = Math.max(12, Math.min(17, 18));
    ctx.font = `700 ${size}px Outfit, sans-serif`;
    while (size > 10 && ctx.measureText(text).width > 72) {
      size -= 1;
      ctx.font = `700 ${size}px Outfit, sans-serif`;
    }
    const padX = 9;
    const padY = 5;
    const tw = ctx.measureText(text).width;
    const bx = x - tw / 2 - padX;
    const by = y - size / 2 - padY;
    const bw = tw + padX * 2;
    const bh = size + padY * 2;
    const br = bh / 2;
    ctx.fillStyle = '#2a2210cc';
    ctx.beginPath();
    ctx.moveTo(bx + br, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + bh, br);
    ctx.arcTo(bx + bw, by + bh, bx, by + bh, br);
    ctx.arcTo(bx, by + bh, bx, by, br);
    ctx.arcTo(bx, by, bx + bw, by, br);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fff8e8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
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
    const byIndex = new Map(marks.map(mark => [((mark.i % LIGHT_BULBS) + LIGHT_BULBS) % LIGHT_BULBS, mark]));
    const goal = targetIndex();
    const choosing = marks.length > 0;

    for (let i = 0; i < LIGHT_BULBS; i++) {
      const theta = Math.PI / 2 + (i / LIGHT_BULBS) * Math.PI * 2;
      const x = cx + Math.cos(theta) * radius;
      const y = cy + Math.sin(theta) * radius;
      const mark = byIndex.get(i);
      const target = !choosing && i === goal;
      const neighbor = !choosing && (i === (goal + 1) % LIGHT_BULBS || i === (goal + LIGHT_BULBS - 1) % LIGHT_BULBS);
      let color = '#2a2208';
      let glow = false;
      let size = radius * 0.04;
      if (phase === 'intro' && i % 4 === twinkle) {
        color = '#ffe14a';
        glow = true;
      } else if (i === lit) {
        color = mark ? '#ffe14a' : target ? '#d6ff6a' : '#ffe14a';
        glow = true;
        size = radius * (mark ? 0.08 : 0.055);
      } else if (mark) {
        // Same amber as every other answer — no green tip-off.
        color = '#8a7020';
        glow = true;
        size = radius * 0.07;
      } else if (target) {
        color = '#1ec75a';
        glow = true;
        size = radius * 0.045;
      } else if (neighbor) color = '#8fbf2a';
      drawBulb(x, y, size, color, glow);
    }

    if (spinning && !reduced) {
      const pulse = 0.85 + Math.sin(now / 140) * 0.15;
      if (choosing) {
        for (const mark of marks) {
          const i = ((mark.i % LIGHT_BULBS) + LIGHT_BULBS) % LIGHT_BULBS;
          const theta = Math.PI / 2 + (i / LIGHT_BULBS) * Math.PI * 2;
          const x = cx + Math.cos(theta) * radius;
          const y = cy + Math.sin(theta) * radius;
          ctx.strokeStyle = '#c9a86a';
          ctx.globalAlpha = 0.35 + pulse * 0.15;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(x, y, radius * 0.14 * pulse, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else {
        const theta = Math.PI / 2 + (goal / LIGHT_BULBS) * Math.PI * 2;
        const x = cx + Math.cos(theta) * radius;
        const y = cy + Math.sin(theta) * radius;
        ctx.strokeStyle = '#7dffb2';
        ctx.globalAlpha = 0.45 + pulse * 0.2;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.11 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    const btnR = radius * 0.38;
    for (let ringNo = 8; ringNo >= 1; ringNo--) {
      ctx.fillStyle = `hsl(174, 72%, ${18 + ringNo * 6}%)`;
      ctx.beginPath();
      ctx.arc(cx, cy, btnR * (0.55 + ringNo * 0.06), 0, Math.PI * 2);
      ctx.fill();
    }

    if (marks.length && phase !== 'menu') {
      const outer = radius * 1.28;
      for (const mark of marks) {
        const text = String(mark.text ?? '');
        if (!text) continue;
        const i = ((mark.i % LIGHT_BULBS) + LIGHT_BULBS) % LIGHT_BULBS;
        const theta = Math.PI / 2 + (i / LIGHT_BULBS) * Math.PI * 2;
        const x = cx + Math.cos(theta) * outer;
        const y = cy + Math.sin(theta) * outer;
        drawPill(x, y, text);
      }
    } else if (label && phase !== 'menu') {
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
    verdict = lightVerdictAt(angle, level, marks);
    phase = 'flash';
    flashUntil = performance.now() + (reduced ? 520 : 880);
    catchBtn.textContent = verdict === 'catch'
      ? 'Amazing!'
      : verdict === 'almost'
        ? 'Almost'
        : verdict === 'wrong'
          ? 'Wrong one'
          : 'Missed';
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
    marks = [];
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
      if (text) marks = [];
    },
    setMarks(list) {
      if (session.dead) return;
      marks = Array.isArray(list) ? list.map(row => ({
        i: row?.i | 0,
        text: String(row?.text ?? ''),
        ok: !!row?.ok
      })).filter(row => row.text) : [];
      if (marks.length) label = '';
    }
  };
}
