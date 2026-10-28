/**
 * Ghost bust — ghosts bob out of a 3 by 3 yard. Tap one to bust it.
 * The bob, the 15 second clock, the bust, and the colored-ghost score
 * follow the pure CSS ghost game. These ghosts and the questions are drawn here.
 */
import { questionHolding } from './hold.js?v=ask-first';

const COLS = 3;
const ROWS = 3;
const VIEW_W = 400;
const VIEW_H = 480;
const COLOR = '#ace7ff';
const BUST_MS = 1750;
const TOMB_MS = 520;

let active = null;

export function stopBust() {
  active?.destroy();
  active = null;
}

function call(fn, arg) {
  try { return fn?.(arg); }
  catch { return undefined; }
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function fitLabel(ctx, text, maxWidth, start) {
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

function drawMark(ctx, shape, fill, s) {
  ctx.fillStyle = fill || '#244b3d';
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

function cells() {
  const gap = 14;
  const top = 58;
  const side = 18;
  const size = (VIEW_W - side * 2 - gap * (COLS - 1)) / COLS;
  const list = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      list.push({
        c,
        r,
        x: side + c * (size + gap),
        y: top + r * (size + gap),
        s: size
      });
    }
  }
  return list;
}

export function mountBust(root, { board = {}, reduced, freePlay, nextQuestion, onPrompt, onTime, onScore, onMiss, onClear, onOver, onFinished } = {}) {
  stopBust();
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

  const calm = reduced ? 1.55 : 1;
  const bustMs = reduced ? 700 : BUST_MS;
  const spec = {
    choices: board.choices || 3,
    seconds: board.seconds || 15,
    bob: (board.bob || 2.4) * calm,
    colorScore: board.colorScore || 5,
    whiteScore: board.whiteScore || 1
  };
  const yard = cells();
  root.replaceChildren();
  const host = document.createElement('div');
  host.className = 'bust-play';
  host.innerHTML = `<div id="bustShow"></div><div class="bust" role="application" aria-label="Tap the ghost with the right answer before it ducks."><canvas></canvas></div>`;
  root.appendChild(host);
  const stage = host.querySelector('.bust');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const ghosts = [];
  const pops = [];
  let view = { scale: 1, ox: 0, oy: 0, dpr: 1 };
  let score = 0;
  let clock = spec.seconds;
  let shownClock = spec.seconds;
  let phaseClock = 0;
  let flashClock = 0;
  let slipped = false;
  let timeUp = false;
  let resolving = false;
  let wait = 0;
  let over = false;
  let overAt = 0;
  let overSent = false;
  let ending = false;
  let wave = 0;
  let last = 0;

  const fit = () => {
    const cssW = Math.max(1, stage.clientWidth || 360);
    const cssH = Math.max(1, stage.clientHeight || 420);
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
  const riseOf = ghost => {
    if (ghost.hold) return 1;
    let p = (phaseClock / ghost.speed + ghost.offset) % 1;
    if (p < 0) p += 1;
    const tri = p < 0.5 ? p * 2 : 2 - p * 2;
    return tri * tri * (3 - 2 * tri);
  };
  const boxOf = ghost => {
    const cell = yard[ghost.slot];
    const rise = ghost.state === 'bob' ? riseOf(ghost) : 1;
    const scale = 0.78 + rise * 0.47;
    const w = 58 * scale;
    const h = 74 * scale;
    const cx = cell.x + cell.s / 2;
    const cy = cell.y + cell.s * 0.72 - rise * cell.s * 0.62;
    return { cx, cy, w, h, rise, scale, cell };
  };
  const paintScore = next => {
    score = next;
    call(onScore, score);
  };
  const makeGhost = (slot, choice, colored) => {
    const speed = freePlay
      ? 0.85 + Math.random() * 2.7
      : spec.bob * (0.72 + Math.random() * 0.55);
    const worth = choice ? !!choice.ok : !!colored;
    const colorQuestion = !!(choice && choice.fill && !choice.shape);
    const body = colorQuestion ? choice.fill : (choice ? '#fff' : (colored ? COLOR : '#fff'));
    return {
      slot,
      choice: choice || null,
      ok: worth,
      label: choice ? String(choice.label) : '',
      shape: choice?.shape || '',
      color: body,
      points: worth ? spec.colorScore : spec.whiteScore,
      speed,
      offset: freePlay || !choice ? Math.random() : Math.random(),
      state: 'bob',
      hold: false,
      bustAt: 0,
      tombAt: 0,
      respawn: false
    };
  };
  const spawnFree = () => {
    ghosts.length = 0;
    yard.forEach((cell, slot) => {
      const colored = Math.random() < 0.18;
      const ghost = makeGhost(slot, null, colored);
      ghost.ok = true;
      ghosts.push(ghost);
    });
  };
  const spawnLearn = pack => {
    ghosts.length = 0;
    const spots = shuffle(yard.map((_, index) => index)).slice(0, pack.choices.length);
    pack.choices.forEach((choice, index) => {
      ghosts.push(makeGhost(spots[index], choice, !!choice.ok));
    });
  };
  const beginWave = () => {
    if (session.dead || ending || over) return;
    if (freePlay) {
      spawnFree();
      clock = spec.seconds;
      shownClock = spec.seconds;
      timeUp = false;
      call(onTime, shownClock);
      return;
    }
    const pack = call(nextQuestion);
    if (!pack?.choices?.length) {
      ending = true;
      call(onFinished);
      return;
    }
    wave += 1;
    slipped = false;
    timeUp = false;
    resolving = false;
    clock = spec.seconds;
    shownClock = spec.seconds;
    spawnLearn(pack);
    call(onTime, shownClock);
    call(onPrompt);
  };
  const bust = ghost => {
    if (!ghost || ghost.state !== 'bob' || resolving || over || ending) return;
    if (!freePlay && timeUp && !ghost.ok) return;
    const risen = ghost.hold || riseOf(ghost) > (reduced ? 0.28 : 0.42);
    if (!risen) return;
    ghost.state = 'bust';
    ghost.bustAt = performance.now();
    ghost.hold = false;
    if (!ghost.ok) {
      ghost.respawn = true;
      slipped = true;
      shake();
      call(onMiss, 'wrong');
      return;
    }
    const gained = ghost.points;
    paintScore(score + gained);
    pops.push({ text: `+${gained}`, x: boxOf(ghost).cx, y: boxOf(ghost).cy, life: 0.8 });
    if (freePlay) {
      ghost.respawn = true;
      return;
    }
    resolving = true;
    ghost.respawn = false;
    call(onClear, !slipped);
    if (session.dead || ending) return;
    wait = reduced ? 0.45 : 0.95;
  };
  const pointer = event => {
    if (session.dead || over || ending || resolving || !view.scale) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - view.ox) / view.scale;
    const y = (event.clientY - rect.top - view.oy) / view.scale;
    let hit = null;
    let best = -1;
    ghosts.forEach(ghost => {
      if (ghost.state !== 'bob') return;
      const box = boxOf(ghost);
      if (box.rise < (ghost.hold ? 0.2 : (reduced ? 0.28 : 0.42))) return;
      const pad = 10;
      if (x < box.cx - box.w / 2 - pad || x > box.cx + box.w / 2 + pad) return;
      if (y < box.cy - box.h / 2 - pad || y > box.cy + box.h / 2 + pad) return;
      if (box.rise >= best) {
        best = box.rise;
        hit = ghost;
      }
    });
    if (hit) bust(hit);
  };

  const drawPen = cell => {
    ctx.fillStyle = '#06160e';
    roundBox(ctx, cell.x, cell.y, cell.s, cell.s, 16);
    ctx.fill();
    ctx.fillStyle = '#123222';
    ctx.beginPath();
    ctx.ellipse(cell.x + cell.s / 2, cell.y + cell.s * 0.78, cell.s * 0.28, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  const drawTomb = (cell, alpha) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    const x = cell.x + cell.s * 0.22;
    const y = cell.y + cell.s * 0.28;
    const w = cell.s * 0.56;
    const h = cell.s * 0.5;
    ctx.fillStyle = '#6c7a89';
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + 16);
    ctx.arc(x + w / 2, y + 16, w / 2, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2e3131';
    ctx.font = '700 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('R.I.P', x + w / 2, y + h * 0.62);
    ctx.restore();
  };
  const drawGhost = (ghost, now) => {
    const box = boxOf(ghost);
    const bustT = ghost.state === 'bust' ? Math.min(1, (now - ghost.bustAt) / bustMs) : 0;
    if (ghost.state === 'bob' && box.rise < 0.04) return;
    ctx.save();
    ctx.translate(box.cx, box.cy);
    const wiggle = bustT > 0 && !reduced ? Math.sin(bustT * Math.PI * 8) * 14 * (1 - bustT) : 0;
    ctx.translate(wiggle, bustT * -70);
    const shrink = bustT > 0 ? 1 - bustT : 1;
    ctx.scale(box.scale * shrink, box.scale * shrink);
    ctx.globalAlpha = bustT > 0 ? 1 - bustT : Math.min(1, box.rise * 2.2);
    ctx.fillStyle = ghost.color;
    ctx.beginPath();
    ctx.moveTo(-24, 6);
    ctx.bezierCurveTo(-26, -34, 26, -34, 24, 6);
    ctx.quadraticCurveTo(16, 20, 8, 6);
    ctx.quadraticCurveTo(0, 22, -8, 6);
    ctx.quadraticCurveTo(-16, 20, -24, 6);
    ctx.closePath();
    ctx.fill();
    if (bustT > 0) {
      ctx.strokeStyle = '#161616';
      ctx.lineWidth = 2.4;
      [[-8, -8], [9, -10]].forEach(([ex, ey]) => {
        ctx.beginPath();
        ctx.moveTo(ex - 4, ey - 4);
        ctx.lineTo(ex + 4, ey + 4);
        ctx.moveTo(ex + 4, ey - 4);
        ctx.lineTo(ex - 4, ey + 4);
        ctx.stroke();
      });
    } else {
      ctx.fillStyle = '#161616';
      ctx.beginPath();
      ctx.arc(-8, -8, 3.1, 0, Math.PI * 2);
      ctx.arc(9, -10, 4.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffc0cb';
      ctx.beginPath();
      ctx.ellipse(1, 2, 7, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (!ghost.label || bustT > 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, box.rise * 2.2);
    const label = ghost.label;
    const width = Math.min(box.w - 8, 78);
    const size = fitLabel(ctx, label, width - 8, ghost.shape ? 12 : 15);
    const textW = Math.min(width, ctx.measureText(label).width + 10);
    const pillY = box.cy + box.h * 0.12;
    roundBox(ctx, box.cx - textW / 2, pillY - size * 0.65, textW, size + 6, 7);
    ctx.fillStyle = '#fffaf0';
    ctx.fill();
    if (ghost.shape) {
      ctx.save();
      ctx.translate(box.cx, box.cy - box.h * 0.12);
      drawMark(ctx, ghost.shape, '#32634e', 8);
      ctx.restore();
    }
    ctx.fillStyle = '#143024';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, box.cx, pillY + 1);
    ctx.restore();
    if (ghost.hold) {
      ctx.strokeStyle = COLOR;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(box.cx, box.cy, box.w * 0.55, box.h * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  };
  const drawHud = () => {
    ctx.fillStyle = '#f4fff6';
    ctx.font = '700 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(score).padStart(2, '0'), 22, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`${shownClock}s`, VIEW_W - 22, 30);
  };
  const drawPops = () => {
    pops.forEach(pop => {
      ctx.globalAlpha = Math.max(0, 1 - pop.life / 0.8);
      ctx.fillStyle = '#fff4b0';
      ctx.font = '800 22px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pop.text, pop.x, pop.y - pop.life * 40);
      ctx.globalAlpha = 1;
    });
  };
  const drawOver = () => {
    const t = Math.min(1, (performance.now() - overAt) / 420);
    ctx.fillStyle = `rgba(8, 8, 8, ${0.92 * t})`;
    ctx.fillRect(0, VIEW_H * (1 - t), VIEW_W, VIEW_H);
    if (t < 0.45) return;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = '800 36px Outfit, sans-serif';
    ctx.fillText('Good job!', VIEW_W / 2, VIEW_H * 0.4);
    ctx.font = '700 26px Outfit, sans-serif';
    ctx.fillText(`You scored ${score}`, VIEW_W / 2, VIEW_H * 0.52);
  };
  const draw = now => {
    fit();
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, stage.clientWidth || VIEW_W, stage.clientHeight || VIEW_H);
    sky.addColorStop(0, '#10281a');
    sky.addColorStop(1, '#07140d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, stage.clientWidth || VIEW_W, stage.clientHeight || VIEW_H);
    applyView();
    yard.forEach(drawPen);
    ghosts.forEach(ghost => {
      if (ghost.state === 'tomb') {
        const alpha = Math.min(1, (now - ghost.tombAt) / 180);
        drawTomb(yard[ghost.slot], alpha);
        return;
      }
      if (ghost.state === 'bust') {
        const t = (now - ghost.bustAt) / bustMs;
        if (t > 0.35) drawTomb(yard[ghost.slot], Math.min(1, (t - 0.35) / 0.25));
      }
      drawGhost(ghost, now);
    });
    drawHud();
    drawPops();
    const tick = Math.floor(flashClock * 10) % 100;
    if (!reduced && tick >= 71 && tick <= 79 && tick % 2 === 1) {
      ctx.fillStyle = 'rgba(255, 255, 204, 0.45)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (over) drawOver();
  };
  const frame = now => {
    if (session.dead) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (!questionHolding()) {
      phaseClock += dt;
      flashClock += dt;
      for (let i = pops.length - 1; i >= 0; i--) {
        pops[i].life += dt;
        if (pops[i].life >= 0.8) pops.splice(i, 1);
      }
      if (!over && !ending) {
        if (wait > 0) {
          wait -= dt;
          if (wait <= 0) {
            wait = 0;
            resolving = false;
            beginWave();
          }
        } else if (!resolving && !timeUp) {
          clock = Math.max(0, clock - dt);
          const next = Math.ceil(clock - 0.001);
          if (next !== shownClock) {
            shownClock = Math.max(0, next);
            call(onTime, shownClock);
          }
          if (clock <= 0 && !timeUp) {
            timeUp = true;
            shownClock = 0;
            call(onTime, 0);
            if (freePlay) {
              over = true;
              overAt = now;
            } else {
              slipped = true;
              const right = ghosts.find(ghost => ghost.ok && ghost.state === 'bob');
              if (right) right.hold = true;
              call(onMiss, 'time');
            }
          }
        }
        for (let i = ghosts.length - 1; i >= 0; i--) {
          const ghost = ghosts[i];
          if (ghost.state === 'bust' && now - ghost.bustAt >= bustMs) {
            ghost.state = 'tomb';
            ghost.tombAt = now;
          } else if (ghost.state === 'tomb' && now - ghost.tombAt >= (reduced ? 280 : TOMB_MS)) {
            const slot = ghost.slot;
            const again = ghost.respawn && !over && !ending && (freePlay || !resolving);
            const choice = ghost.choice;
            ghosts.splice(i, 1);
            if (again) {
              const next = makeGhost(slot, choice, freePlay ? Math.random() < 0.18 : !!choice?.ok);
              if (freePlay) next.ok = true;
              else next.ok = !!choice?.ok;
              next.offset = -(phaseClock / next.speed);
              ghosts.push(next);
            }
          }
        }
      }
    }
    draw(now);
    if (over && !overSent && now - overAt > 1200) {
      overSent = true;
      call(onOver, score);
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
  paintScore(0);
  beginWave();
  session.raf = requestAnimationFrame(frame);
}
