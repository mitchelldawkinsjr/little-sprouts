/**
 * Lily cross — hop one square at a time across the road and the river,
 * then land on the lily pad with the right answer.
 * The lanes follow a Frogger-style grid. The frog, logs, cars, and
 * questions are drawn here.
 */
import { lilyPads, lilyRide, lilyOverlap } from './logic.mjs?v=lily-cross';

const COLS = 5;
const FROG = 0.56;
let active = null;

export function stopLily() {
  active?.destroy();
  active = null;
}

function call(fn, arg) {
  try { return fn?.(arg); }
  catch { return undefined; }
}

function rowsFor(board) {
  const rows = [{ kind: 'home' }];
  for (let i = 0; i < board.rivers; i++) {
    rows.push({ kind: 'river', dir: i % 2 === 0 ? 1 : -1, rate: board.speed * (0.62 + (i % 2) * 0.14) });
  }
  rows.push({ kind: 'safe' });
  for (let i = 0; i < board.roads; i++) {
    rows.push({ kind: 'road', dir: i % 2 === 0 ? -1 : 1, rate: board.speed * (0.92 + (i % 3) * 0.18) });
  }
  rows.push({ kind: 'start' });
  return rows;
}

function fillLane(row, index) {
  if (row.kind !== 'road' && row.kind !== 'river') return;
  const river = row.kind === 'river';
  const count = 2;
  const base = river ? 1.85 : 0.95;
  const gap = (COLS + base) / count;
  row.movers = [];
  for (let i = 0; i < count; i++) {
    const w = base + (i % 2) * (river ? 0.45 : 0.28);
    const x = row.dir > 0 ? -w * 0.3 + i * gap : COLS - i * gap;
    row.movers.push({
      x,
      w,
      speed: row.rate * row.dir,
      hue: ['#e07a5f', '#3d6f8f', '#e0b15a', '#c46b8a'][(index + i) % 4]
    });
  }
}

function columnOf(x) {
  return Math.max(0, Math.min(COLS - 1, Math.floor(x + FROG / 2)));
}

function gridLeft(col) {
  return col + (1 - FROG) / 2;
}

function ink(fill) {
  if (!fill || fill[0] !== '#' || fill.length < 7) return '#143024';
  const r = parseInt(fill.slice(1, 3), 16);
  const g = parseInt(fill.slice(3, 5), 16);
  const b = parseInt(fill.slice(5, 7), 16);
  return r * 0.3 + g * 0.59 + b * 0.11 > 170 ? '#143024' : '#fffaf0';
}

function fitFont(ctx, text, maxWidth) {
  let size = 18;
  ctx.font = `700 ${size}px Outfit, sans-serif`;
  while (size > 9 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `700 ${size}px Outfit, sans-serif`;
  }
  return size;
}

function drawShape(ctx, shape, x, y, s, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill || '#244b3d';
  ctx.beginPath();
  const k = s * 0.28;
  if (shape === 'circle' || shape === 'oval') ctx.ellipse(0, 0, k, shape === 'oval' ? k * 0.68 : k, 0, 0, Math.PI * 2);
  else if (shape === 'triangle') { ctx.moveTo(0, -k); ctx.lineTo(k, k * 0.75); ctx.lineTo(-k, k * 0.75); ctx.closePath(); }
  else if (shape === 'diamond') { ctx.moveTo(0, -k); ctx.lineTo(k, 0); ctx.lineTo(0, k); ctx.lineTo(-k, 0); ctx.closePath(); }
  else if (shape === 'star' || shape === 'hexagon') ctx.arc(0, 0, k * 0.85, 0, Math.PI * 2);
  else ctx.rect(-k, -k * 0.7, k * 2, k * 1.4);
  ctx.fill();
  ctx.restore();
}

function drawFrog(ctx, x, y, s, face, squash) {
  ctx.save();
  ctx.translate(x, y);
  if (face === 'left') ctx.rotate(-Math.PI / 2);
  else if (face === 'right') ctx.rotate(Math.PI / 2);
  else if (face === 'down') ctx.rotate(Math.PI);
  const belly = squash ? 0.22 : 0.34;
  ctx.fillStyle = '#3e9a45';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.06, s * 0.4, s * belly, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b6e38a';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.12, s * 0.2, s * belly * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4fff2';
  ctx.beginPath();
  ctx.arc(-s * 0.16, -s * 0.2, s * 0.12, 0, Math.PI * 2);
  ctx.arc(s * 0.16, -s * 0.2, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d3324';
  ctx.beginPath();
  ctx.arc(-s * 0.16, -s * 0.2, s * 0.055, 0, Math.PI * 2);
  ctx.arc(s * 0.16, -s * 0.2, s * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function mountLily(root, { board = {}, reduced, nextQuestion, onPrompt, onMiss, onClear, onLives, onOver, onFinished } = {}) {
  stopLily();
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

  const calm = reduced ? 0.55 : 1;
  const hopTime = reduced ? 0.22 : 0.15;
  const spec = {
    choices: board.choices || 3,
    lives: board.lives || 4,
    roads: board.roads || 2,
    rivers: board.rivers || 2,
    speed: (board.speed || 1.35) * calm
  };
  const rows = rowsFor(spec);
  rows.forEach((row, index) => fillLane(row, index));
  const host = document.createElement('div');
  host.className = 'arcade lily-play';
  host.innerHTML = `<div class="lily" role="application" aria-label="Hop across the road and the river. Land on the lily pad with the right answer."><canvas></canvas></div><div class="steer market-pad" aria-label="Hop"><button type="button" class="steer-btn" data-dir="up" aria-label="Hop up">↑</button><button type="button" class="steer-btn" data-dir="left" aria-label="Hop left">←</button><button type="button" class="steer-btn" data-dir="down" aria-label="Hop down">↓</button><button type="button" class="steer-btn" data-dir="right" aria-label="Hop right">→</button></div>`;
  root.replaceChildren(host);
  const stage = host.querySelector('.lily');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const frog = { x: 0, y: 0, row: 0 };
  let pads = [];
  let lives = spec.lives;
  let phase = 'play';
  let hop = null;
  let face = 'up';
  let pause = 0;
  let slipped = false;
  let hurtKind = '';
  let last = 0;

  const spawn = () => {
    frog.row = rows.length - 1;
    frog.x = gridLeft(2);
    frog.y = frog.row + (1 - FROG) / 2;
    hop = null;
    face = 'up';
  };
  const begin = () => {
    const pack = call(nextQuestion);
    if (!pack?.choices?.length) {
      phase = 'done';
      call(onFinished);
      return;
    }
    const cols = lilyPads(pack.choices.length, COLS);
    pads = cols.map((col, i) => ({ ...pack.choices[i], col }));
    slipped = false;
    phase = 'play';
    spawn();
    call(onLives, lives);
    call(onPrompt);
  };
  const hurt = kind => {
    if (phase !== 'play') return;
    phase = 'hurt';
    hop = null;
    hurtKind = kind;
    slipped = true;
    lives -= 1;
    stage.classList.remove('shake');
    void stage.offsetWidth;
    stage.classList.add('shake');
    call(onLives, Math.max(0, lives));
    call(onMiss, kind);
    pause = reduced ? 0.35 : 0.72;
  };
  const settle = () => {
    const row = rows[frog.row];
    if (!row || phase !== 'play') return;
    if (row.kind === 'home') {
      const pad = pads.find(item => item.col === columnOf(frog.x));
      if (!pad) { hurt('water'); return; }
      if (!pad.ok) {
        slipped = true;
        call(onMiss, 'pad');
        phase = 'back';
        pause = reduced ? 0.2 : 0.4;
        return;
      }
      phase = 'score';
      pause = reduced ? 0.22 : 0.48;
      call(onClear, !slipped);
      return;
    }
    if (row.kind === 'river' && !lilyRide(frog.x, FROG, row.movers)) hurt('water');
    if (row.kind === 'road' && row.movers.some(car => lilyOverlap(frog.x, FROG, car.x, car.w))) hurt('car');
  };
  const tryHop = dir => {
    if (phase !== 'play' || hop || pause > 0) return;
    const col = columnOf(frog.x);
    let nextCol = col;
    let nextRow = frog.row;
    if (dir === 'left') nextCol -= 1;
    if (dir === 'right') nextCol += 1;
    if (dir === 'up') nextRow -= 1;
    if (dir === 'down') nextRow += 1;
    if (nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= rows.length) return;
    hop = {
      x0: frog.x,
      y0: frog.y,
      x1: gridLeft(nextCol),
      y1: nextRow + (1 - FROG) / 2,
      row: nextRow,
      from: frog.row,
      t: 0,
      dir
    };
    face = dir;
  };

  const draw = (w, h) => {
    const cell = Math.min(w / COLS, h / rows.length);
    const ox = (w - cell * COLS) / 2;
    const oy = (h - cell * rows.length) / 2;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#c5e4b4';
    ctx.fillRect(0, 0, w, h);
    rows.forEach((row, r) => {
      const y = oy + r * cell;
      ctx.fillStyle = row.kind === 'road' ? '#d8c4a4' : row.kind === 'river' || row.kind === 'home' ? '#3f8fb8' : '#8fbf73';
      ctx.fillRect(ox, y, cell * COLS, cell + 0.5);
      if (row.kind === 'road') {
        ctx.strokeStyle = 'rgba(255,255,255,.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([cell * 0.22, cell * 0.18]);
        ctx.beginPath();
        ctx.moveTo(ox + 6, y + cell / 2);
        ctx.lineTo(ox + cell * COLS - 6, y + cell / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (row.kind === 'river' || row.kind === 'home') {
        ctx.strokeStyle = 'rgba(255,255,255,.28)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ox, y + cell * 0.35);
        ctx.bezierCurveTo(ox + cell, y + cell * 0.15, ox + cell * 2, y + cell * 0.55, ox + cell * COLS, y + cell * 0.3);
        ctx.stroke();
      }
    });
    pads.forEach(pad => {
      const cx = ox + (pad.col + 0.5) * cell;
      const cy = oy + cell * 0.52;
      ctx.fillStyle = pad.shape ? '#7fba6c' : (pad.fill || '#7fba6c');
      ctx.beginPath();
      ctx.ellipse(cx, cy, cell * 0.42, cell * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2d6a38';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#2f7a3a';
      ctx.beginPath();
      ctx.ellipse(cx - cell * 0.22, cy + cell * 0.02, cell * 0.1, cell * 0.06, -0.6, 0, Math.PI * 2);
      ctx.ellipse(cx + cell * 0.22, cy + cell * 0.02, cell * 0.1, cell * 0.06, 0.6, 0, Math.PI * 2);
      ctx.fill();
      if (pad.shape) drawShape(ctx, pad.shape, cx, cy - cell * 0.02, cell, '#244b3d');
      else {
        ctx.fillStyle = ink(pad.fill || '#7fba6c');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        fitFont(ctx, String(pad.label), cell * 0.72);
        ctx.fillText(String(pad.label), cx, cy - cell * 0.02);
      }
    });
    rows.forEach((row, r) => {
      if (!row.movers) return;
      row.movers.forEach(mover => {
        const x = ox + mover.x * cell;
        const y = oy + r * cell;
        if (row.kind === 'river') {
          ctx.fillStyle = '#8d5a3c';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(x, y + cell * 0.28, mover.w * cell, cell * 0.42, cell * 0.12);
          else ctx.rect(x, y + cell * 0.28, mover.w * cell, cell * 0.42);
          ctx.fill();
          ctx.strokeStyle = '#6a4128';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,220,170,.45)';
          ctx.beginPath();
          ctx.arc(x + mover.w * cell * 0.3, y + cell * 0.48, cell * 0.08, 0, Math.PI * 2);
          ctx.stroke();
          return;
        }
        const body = y + cell * 0.22;
        ctx.fillStyle = mover.hue;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, body, mover.w * cell, cell * 0.48, cell * 0.1);
        else ctx.rect(x, body, mover.w * cell, cell * 0.48);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        const cab = mover.speed > 0 ? x + mover.w * cell * 0.55 : x + cell * 0.08;
        ctx.fillRect(cab, body + cell * 0.06, mover.w * cell * 0.28, cell * 0.16);
        ctx.fillStyle = '#2a3038';
        ctx.beginPath();
        ctx.arc(x + cell * 0.18, body + cell * 0.48, cell * 0.07, 0, Math.PI * 2);
        ctx.arc(x + mover.w * cell - cell * 0.18, body + cell * 0.48, cell * 0.07, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    if (phase !== 'hurt') {
      const lift = hop ? Math.sin(Math.min(1, hop.t) * Math.PI) * cell * 0.16 : 0;
      const px = ox + (frog.x + FROG / 2) * cell;
      const py = oy + (frog.y + FROG / 2) * cell - lift;
      drawFrog(ctx, px, py, cell * 0.72, face, false);
    } else if (hurtKind === 'water') {
      const px = ox + (frog.x + FROG / 2) * cell;
      const py = oy + (frog.y + FROG / 2) * cell;
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, cell * 0.18, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const px = ox + (frog.x + FROG / 2) * cell;
      const py = oy + (frog.y + FROG * 0.8) * cell;
      drawFrog(ctx, px, py, cell * 0.72, face, true);
    }
    for (let i = 0; i < Math.max(0, lives); i++) {
      ctx.fillStyle = '#2f7a3a';
      ctx.beginPath();
      ctx.arc(ox + 12 + i * 14, oy + rows.length * cell - 12, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const frame = now => {
    if (session.dead) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (pause > 0) {
      pause -= dt;
      if (pause <= 0) {
        pause = 0;
        stage.classList.remove('shake');
        if (phase === 'hurt') {
          if (lives <= 0) {
            phase = 'over';
            call(onOver);
          } else {
            spawn();
            phase = 'play';
          }
        } else if (phase === 'back') {
          spawn();
          phase = 'play';
        } else if (phase === 'score') begin();
      }
    } else if (phase === 'play') {
      const standing = rows[frog.row];
      const ride = !hop && standing?.kind === 'river' ? lilyRide(frog.x, FROG, standing.movers) : null;
      rows.forEach(row => {
        row.movers?.forEach(mover => { mover.x += mover.speed * dt; });
      });
      if (ride) frog.x += ride.speed * dt;
      rows.forEach(row => {
        row.movers?.forEach(mover => {
          if (mover.speed > 0 && mover.x > COLS) mover.x = -mover.w;
          if (mover.speed < 0 && mover.x + mover.w < 0) mover.x = COLS;
        });
      });
      if (hop) {
        hop.t += dt / hopTime;
        const u = Math.min(1, hop.t);
        const e = u < 0.5 ? 2 * u * u : 1 - ((-2 * u + 2) ** 2) / 2;
        frog.x = hop.x0 + (hop.x1 - hop.x0) * e;
        frog.y = hop.y0 + (hop.y1 - hop.y0) * e;
        const lane = rows[u > 0.55 ? hop.row : hop.from];
        if (lane?.kind === 'road' && lane.movers.some(car => lilyOverlap(frog.x, FROG, car.x, car.w))) hurt('car');
        if (hop && u >= 1) {
          frog.x = hop.x1;
          frog.y = hop.y1;
          frog.row = hop.row;
          hop = null;
          settle();
        }
      } else {
        const row = rows[frog.row];
        if (row?.kind === 'river') {
          if (!ride || frog.x < -0.04 || frog.x + FROG > COLS + 0.04 || !lilyRide(frog.x, FROG, row.movers)) hurt('water');
        } else if (row?.kind === 'road' && row.movers.some(car => lilyOverlap(frog.x, FROG, car.x, car.w))) hurt('car');
      }
    }
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(220, rect.width || 360);
    const h = Math.max(260, rect.height || 480);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(w, h);
    if (!session.dead) session.raf = requestAnimationFrame(frame);
  };

  const typing = e => e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  const keyDir = e => (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ? 'left'
    : e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ? 'right'
    : e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' ? 'up'
    : e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' ? 'down' : '');
  const onKey = e => {
    if (document.querySelector('dialog[open]') || typing(e)) return;
    const dir = keyDir(e);
    if (!dir || e.repeat) return;
    e.preventDefault();
    tryHop(dir);
  };
  document.addEventListener('keydown', onKey);
  session.cleanups.push(() => document.removeEventListener('keydown', onKey));
  host.querySelectorAll('[data-dir]').forEach(button => {
    const onPointer = e => {
      e.preventDefault();
      tryHop(button.dataset.dir);
    };
    button.addEventListener('pointerdown', onPointer);
    session.cleanups.push(() => button.removeEventListener('pointerdown', onPointer));
  });
  let drag = null;
  const onPointerDown = e => {
    if (e.target.closest('.steer-btn')) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerUp = e => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag = null;
    if (Math.hypot(dx, dy) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) tryHop(dx < 0 ? 'left' : 'right');
    else tryHop(dy < 0 ? 'up' : 'down');
  };
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointerup', onPointerUp);
  session.cleanups.push(() => {
    stage.removeEventListener('pointerdown', onPointerDown);
    stage.removeEventListener('pointerup', onPointerUp);
  });

  spawn();
  begin();
  session.raf = requestAnimationFrame(frame);
}
