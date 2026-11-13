/**
 * Garden chase — steer a beetle through hedge paths. Eat only the berries
 * that match. Stay clear of the snails. Little Sprouts original maze and art.
 */
import { questionHolding } from '../lib/hold.js?v=hold2';
import { drawBuddy, buddyKind } from '../lib/buddy2d.mjs?v=ball3';
import { esc, shuffle } from '../logic.mjs?v=structure3';

const UNIT = 10;
const STEP = 2;
const WALL = 0;
const PATH = 1;
const EMPTY = 2;
/* Garden hedge maze: beds of hedges with winding dirt paths. No wrap tunnels. */
const MAP = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0],
  [0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0],
  [0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  [0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0],
  [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0],
  [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];
const ROWS = MAP.length;
const COLS = MAP[0].length;
const SNAIL_COLORS = ['#8b6b4a', '#6a8f5a', '#a67c52', '#5c7a6e'];
const DIRS = ['left', 'right', 'up', 'down'];

let active = null;

export function stopChase() {
  active?.destroy();
  active = null;
}

function rem(v) {
  return ((v % UNIT) + UNIT) % UNIT;
}

function aligned(v) {
  const part = rem(v);
  return part < 0.01 || part > UNIT - 0.01;
}

function onGrid(body) {
  return aligned(body.x) && aligned(body.y);
}

function samePlane(a, b) {
  const horizontal = dir => dir === 'left' || dir === 'right';
  return horizontal(a) === horizontal(b);
}

function delta(dir) {
  if (dir === 'left') return [-STEP, 0];
  if (dir === 'right') return [STEP, 0];
  if (dir === 'up') return [0, -STEP];
  if (dir === 'down') return [0, STEP];
  return [0, 0];
}

function moved(body, dir) {
  const [dx, dy] = delta(dir);
  return { x: body.x + dx, y: body.y + dy };
}

function nextSquare(v, dir) {
  const part = rem(v);
  if (part === 0) return v;
  if (dir === 'right' || dir === 'down') return v + (UNIT - part);
  return v - part;
}

function nextCell(body, dir) {
  return {
    c: Math.round(nextSquare(body.x, dir) / UNIT),
    r: Math.round(nextSquare(body.y, dir) / UNIT)
  };
}

function tile(map, c, r) {
  if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return null;
  return map[r][c];
}

function isWall(map, c, r) {
  return tile(map, c, r) === WALL;
}

function isFloor(map, c, r) {
  const kind = tile(map, c, r);
  return kind === PATH || kind === EMPTY;
}

function perpendicular(dir) {
  const choices = dir === 'left' || dir === 'right' ? ['up', 'down'] : ['left', 'right'];
  return choices[Math.floor(Math.random() * choices.length)];
}

function fitLabel(ctx, text, maxWidth) {
  let size = 15;
  const font = px => `700 ${px}px Outfit, sans-serif`;
  ctx.font = font(size);
  while (size > 8 && ctx.measureText(text).width > maxWidth) {
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

function drawMark(ctx, choice, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = choice.fill || '#5d7a45';
  const k = s * 0.42;
  const shape = choice.shape;
  ctx.beginPath();
  if (shape === 'circle') ctx.arc(0, 0, k, 0, Math.PI * 2);
  else if (shape === 'oval') ctx.ellipse(0, 0, k, k * 0.62, 0, 0, Math.PI * 2);
  else if (shape === 'triangle') { ctx.moveTo(0, -k); ctx.lineTo(k, k * 0.82); ctx.lineTo(-k, k * 0.82); ctx.closePath(); }
  else if (shape === 'square') ctx.rect(-k * 0.78, -k * 0.78, k * 1.56, k * 1.56);
  else if (shape === 'rectangle') ctx.rect(-k, -k * 0.48, k * 2, k * 0.96);
  else if (shape === 'diamond') { ctx.moveTo(0, -k); ctx.lineTo(k * 0.75, 0); ctx.lineTo(0, k); ctx.lineTo(-k * 0.75, 0); ctx.closePath(); }
  else if (shape === 'star') {
    const inner = k * 0.42;
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? inner : k;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
  } else if (shape === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI / 3;
      const px = Math.cos(a) * k;
      const py = Math.sin(a) * k;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
  } else ctx.rect(-k * 0.7, -k * 0.7, k * 1.4, k * 1.4);
  ctx.fill();
  ctx.restore();
}

// The player is the learner's garden buddy (ADR 0001); it walks while moving.
function drawBeetle(ctx, kind, x, y, s, dir, dying, moving) {
  drawBuddy(ctx, kind, x + s / 2, y + s * 0.95, s * 1.05, {
    flip: dir === 'left',
    step: moving ? performance.now() / 70 : 0,
    alpha: dying > 0 ? Math.max(0.15, 1 - dying) : 1
  });
}

function drawSnail(ctx, x, y, s, color, dir, tick) {
  const cx = x + s / 2;
  const cy = y + s / 2;
  const bob = Math.sin(tick / 8) * s * 0.04;
  ctx.save();
  ctx.translate(cx, cy + bob);
  const face = dir === 'left' ? -1 : 1;
  ctx.scale(face, 1);
  ctx.fillStyle = '#c4a882';
  ctx.beginPath();
  ctx.ellipse(s * 0.08, s * 0.18, s * 0.32, s * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(-s * 0.05, 0, s * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(1.5, s * 0.05);
  ctx.beginPath();
  ctx.arc(-s * 0.05, 0, s * 0.16, 0.4, Math.PI * 1.6);
  ctx.stroke();
  ctx.strokeStyle = '#5a4632';
  ctx.beginPath();
  ctx.moveTo(s * 0.28, s * 0.02);
  ctx.quadraticCurveTo(s * 0.4, -s * 0.22, s * 0.34, -s * 0.32);
  ctx.moveTo(s * 0.22, s * 0.06);
  ctx.quadraticCurveTo(s * 0.32, -s * 0.12, s * 0.28, -s * 0.24);
  ctx.stroke();
  ctx.fillStyle = '#24332c';
  ctx.beginPath();
  ctx.arc(s * 0.3, s * 0.1, s * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHedges(ctx, map, cell, ox, oy) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (map[r][c] !== WALL) continue;
      const x = ox + c * cell;
      const y = oy + r * cell;
      ctx.fillStyle = (c + r) % 2 ? '#3d6b45' : '#355f3d';
      ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
      ctx.fillStyle = 'rgba(180, 220, 140, 0.18)';
      ctx.fillRect(x + cell * 0.15, y + cell * 0.12, cell * 0.35, cell * 0.28);
    }
  }
}

export function mountChase(root, { buddy, prompt, choices = [], copies = 2, playerSpeed = 3.4, bugSpeed = 2.15, bugs = 1, reduced, onDone, onMiss }) {
  const kind = buddyKind(buddy);
  stopChase();
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
  const calm = reduced ? 0.62 : 1;
  const playerRate = (5.2 * playerSpeed / 3.4) * calm;
  const bugRate = (4.4 * bugSpeed / 2.15) * calm;
  root.innerHTML = `<div class="chase-play"><div class="chase" role="application" aria-label="${esc(prompt)}. Steer through the garden paths. Eat only the matching berries. Stay away from the snails."><canvas></canvas></div><div class="steer pad"><button type="button" class="steer-btn" data-dir="left" aria-label="Move left">←</button><button type="button" class="steer-btn" data-dir="up" aria-label="Move up">↑</button><button type="button" class="steer-btn" data-dir="down" aria-label="Move down">↓</button><button type="button" class="steer-btn" data-dir="right" aria-label="Move right">→</button></div></div>`;
  const stage = root.querySelector('.chase');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const map = MAP.map(row => row.slice());
  const openSpots = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (MAP[r][c] === PATH) openSpots.push([c, r]);
    }
  }
  const list = choices.length ? choices : [{ label: '?', ok: true }];
  const berries = [];
  list.forEach(choice => {
    const n = choice.ok ? Math.max(1, copies) : 1;
    for (let i = 0; i < n; i++) berries.push({ label: String(choice.label), ok: !!choice.ok, fill: choice.fill || '', shape: choice.shape || '', c: 1, r: 1, gone: false, flash: 0 });
  });
  const spots = [];
  const pool = shuffle(openSpots.slice());
  for (const min of [6, 4, 3, 2, 1, 0]) {
    pool.forEach(cell => {
      if (spots.length >= berries.length) return;
      if (spots.some(spot => spot[0] === cell[0] && spot[1] === cell[1])) return;
      const room = spots.every(([c, r]) => Math.abs(c - cell[0]) + Math.abs(r - cell[1]) >= min);
      if (room) spots.push(cell);
    });
  }
  berries.forEach((berry, i) => {
    const spot = spots[i] || pool[i % pool.length] || [1, 1];
    berry.c = spot[0];
    berry.r = spot[1];
    if (map[berry.r][berry.c] === PATH) map[berry.r][berry.c] = EMPTY;
  });
  const startCells = [[9, 9], [3, 5], [15, 5], [9, 15]];
  const critters = Array.from({ length: Math.max(1, Math.min(4, bugs)) }, (_, i) => {
    const cell = startCells[i] || startCells[0];
    return {
      x: cell[0] * UNIT,
      y: cell[1] * UNIT,
      dir: perpendicular('left'),
      due: perpendicular('up'),
      color: SNAIL_COLORS[i]
    };
  });
  const player = { x: 9 * UNIT, y: 19 * UNIT, dir: 'none', due: '' };
  let missed = false;
  let finished = false;
  let dying = 0;
  let armed = true;
  let tick = 0;
  let width = 640;
  let height = 480;
  let playerAcc = 0;
  let ghostAcc = 0;
  let last = 0;
  const call = (fn, arg) => { try { fn?.(arg); } catch { /* the host owns errors */ } };

  const shake = () => {
    stage.classList.add('shake');
    const timer = setTimeout(() => stage.classList.remove('shake'), 280);
    session.cleanups.push(() => clearTimeout(timer));
  };
  const resetPlayer = () => {
    player.x = 9 * UNIT;
    player.y = 19 * UNIT;
    player.dir = 'none';
    player.due = '';
    dying = 0;
  };
  const gap = snail => Math.hypot(snail.x - player.x, snail.y - player.y);
  const touching = () => critters.some(snail => gap(snail) < 10);
  const passed = () => critters.every(snail => gap(snail) >= 24);
  const caught = () => {
    if (finished || dying > 0 || !armed) return;
    missed = true;
    dying = 1;
    armed = false;
    shake();
    call(onMiss, 'bug');
  };
  const eatBerry = (c, r) => {
    const berry = berries.find(item => !item.gone && item.c === c && item.r === r);
    if (!berry || finished) return;
    berry.gone = true;
    if (!berry.ok) {
      missed = true;
      berry.flash = 0.35;
      shake();
      call(onMiss, 'berry');
    }
    if (!berries.some(item => item.ok && !item.gone)) {
      finished = true;
      call(onDone, !missed);
    }
  };
  const eatHere = () => {
    berries.forEach(berry => {
      if (berry.gone) return;
      const dx = player.x - berry.c * UNIT;
      const dy = player.y - berry.r * UNIT;
      if (Math.hypot(dx, dy) < 8) eatBerry(berry.c, berry.r);
    });
  };
  const stepPlayer = () => {
    if (player.due && player.due !== player.dir) {
      const trial = moved(player, player.due);
      const cell = nextCell(trial, player.due);
      if (samePlane(player.due, player.dir) || (onGrid(player) && isFloor(map, cell.c, cell.r))) {
        player.dir = player.due;
      }
    }
    if (player.dir === 'none') return;
    const ahead = moved(player, player.dir);
    const cell = nextCell(ahead, player.dir);
    if (onGrid(player) && isWall(map, cell.c, cell.r)) {
      player.dir = 'none';
      return;
    }
    player.x = ahead.x;
    player.y = ahead.y;
    eatHere();
  };
  const stepSnail = snail => {
    let tries = 0;
    const go = () => {
      if (tries++ > 6) return;
      let next = null;
      if (snail.due !== snail.dir) {
        const trial = moved(snail, snail.due);
        const cell = nextCell(trial, snail.due);
        if (onGrid(snail) && isFloor(map, cell.c, cell.r)) {
          snail.dir = snail.due;
          next = trial;
        }
      }
      if (!next) next = moved(snail, snail.dir);
      const cell = nextCell(next, snail.dir);
      if (onGrid(snail) && isWall(map, cell.c, cell.r)) {
        snail.due = perpendicular(snail.dir);
        go();
        return;
      }
      snail.x = next.x;
      snail.y = next.y;
      snail.due = perpendicular(snail.dir);
    };
    go();
  };

  const fit = () => {
    const cssW = Math.max(280, stage.clientWidth || 640);
    const cssH = Math.max(220, stage.clientHeight || 480);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    width = cssW;
    height = cssH;
  };

  const draw = () => {
    const cell = Math.min(width / COLS, height / ROWS);
    const ox = (width - cell * COLS) / 2;
    const oy = (height - cell * ROWS) / 2;
    const at = (x, y) => [ox + (x / UNIT) * cell, oy + (y / UNIT) * cell];
    ctx.fillStyle = '#c9b896';
    ctx.fillRect(0, 0, width, height);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (map[r][c] === WALL) continue;
        ctx.fillStyle = (c + r) % 2 ? '#e4d4a8' : '#ddcca0';
        ctx.fillRect(ox + c * cell, oy + r * cell, cell + 0.5, cell + 0.5);
      }
    }
    drawHedges(ctx, map, cell, ox, oy);
    critters.forEach(snail => {
      const [x, y] = at(snail.x, snail.y);
      drawSnail(ctx, x, y, cell, snail.color, snail.dir, tick);
    });
    const [px, py] = at(player.x, player.y);
    drawBeetle(ctx, kind, px, py, cell, player.dir === 'none' ? 'up' : player.dir, dying, player.dir !== 'none');
    berries.forEach(berry => {
      if (berry.gone && berry.flash <= 0) return;
      const [x, y] = at(berry.c * UNIT, berry.r * UNIT);
      const bob = 0.5 + 0.5 * Math.sin(tick / 4);
      const radius = cell * (0.28 + bob * 0.06);
      ctx.fillStyle = berry.flash > 0 && !berry.ok ? '#e7a383' : '#c4534a';
      ctx.beginPath();
      ctx.arc(x + cell / 2, y + cell / 2, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7f9f62';
      ctx.beginPath();
      ctx.ellipse(x + cell / 2 + 4, y + cell / 2 - radius * 0.7, Math.max(3, cell * 0.12), Math.max(2, cell * 0.07), -0.6, 0, Math.PI * 2);
      ctx.fill();
      if (berry.shape) {
        const s = Math.max(26, cell * 1.05);
        let badgeX = x + cell / 2 - s / 2;
        badgeX = Math.max(4, Math.min(width - s - 4, badgeX));
        const badgeY = Math.max(4, y - s * 0.22);
        ctx.fillStyle = '#faf9f5';
        ctx.strokeStyle = '#244b3d';
        ctx.lineWidth = 2;
        roundBox(ctx, badgeX, badgeY, s, s, 10);
        ctx.fill();
        ctx.stroke();
        drawMark(ctx, berry, badgeX + s / 2, badgeY + s / 2, s * 1.15);
      } else {
        const size = fitLabel(ctx, berry.label, Math.max(28, cell * 2.4));
        const textW = ctx.measureText(berry.label).width;
        const mark = berry.fill ? size : 0;
        const pw = textW + mark + 14;
        const ph = size + 8;
        let labelX = x + cell / 2 - pw / 2;
        labelX = Math.max(4, Math.min(width - pw - 4, labelX));
        const labelY = Math.max(4, y - ph + 2);
        ctx.fillStyle = '#faf9f5';
        ctx.strokeStyle = '#244b3d';
        ctx.lineWidth = 2;
        roundBox(ctx, labelX, labelY, pw, ph, 8);
        ctx.fill();
        ctx.stroke();
        if (mark) drawMark(ctx, berry, labelX + 7 + mark * 0.35, labelY + ph / 2, size);
        ctx.fillStyle = '#24332c';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(berry.label, labelX + (mark ? mark + 6 : 7), labelY + ph / 2 + 1);
      }
    });
  };

  const takeSteps = (acc, rate, dt) => {
    const next = acc + dt * rate * 5;
    const count = Math.min(3, Math.floor(next));
    return [next - count, count];
  };

  const frame = now => {
    if (session.dead) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    fit();
    tick += 1;
    berries.forEach(berry => { berry.flash = Math.max(0, berry.flash - dt); });
    if (dying > 0) {
      dying = Math.max(0, dying - dt / (reduced ? 0.45 : 0.7));
      if (dying === 0) resetPlayer();
    } else if (!finished && !questionHolding()) {
      let playerSteps = 0;
      let snailSteps = 0;
      [playerAcc, playerSteps] = takeSteps(playerAcc, playerRate, dt);
      [ghostAcc, snailSteps] = takeSteps(ghostAcc, bugRate, dt);
      const cycles = Math.max(playerSteps, snailSteps);
      for (let i = 0; i < cycles; i++) {
        if (i < playerSteps) stepPlayer();
        if (dying > 0) break;
        if (i < snailSteps) critters.forEach(stepSnail);
        if (touching()) {
          if (armed) {
            caught();
            break;
          }
        } else if (passed()) armed = true;
      }
    }
    draw();
    session.raf = requestAnimationFrame(frame);
  };

  const steer = dir => {
    if (!DIRS.includes(dir) || finished || dying > 0) return;
    player.due = dir;
    if (player.dir === 'none') player.dir = dir;
  };
  const typing = e => e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  const keyDir = e => (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ? 'left'
    : e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ? 'right'
    : e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' ? 'up'
    : e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' ? 'down' : '');
  const onKey = e => {
    if (document.querySelector('dialog[open]') || typing(e)) return;
    const dir = keyDir(e);
    if (!dir || e.type !== 'keydown' || e.repeat) return;
    e.preventDefault();
    steer(dir);
  };
  document.addEventListener('keydown', onKey);
  root.querySelectorAll('[data-dir]').forEach(button => {
    button.addEventListener('pointerdown', e => {
      e.preventDefault();
      steer(button.dataset.dir);
    });
  });
  let drag = null;
  const onPointerDown = e => {
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerMove = e => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) steer(dx < 0 ? 'left' : 'right');
    else steer(dy < 0 ? 'up' : 'down');
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  session.cleanups.push(() => {
    document.removeEventListener('keydown', onKey);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
  });
  session.raf = requestAnimationFrame(frame);
}
