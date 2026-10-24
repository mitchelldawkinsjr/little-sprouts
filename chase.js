/**
 * Garden chase — the maze, the continuous steering, the yellow chomper,
 * and the ghosts follow the HTML5 Pac-Man pen. The berries are the
 * learning pieces: eat only the ones that match.
 */
const UNIT = 10;
const STEP = 2;
const TUNNEL_Y = 100;
const WALL = 0;
const BISCUIT = 1;
const EMPTY = 2;
const PILL = 4;
const MAP = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 4, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 4, 0],
  [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
  [2, 2, 2, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 2, 2, 2],
  [0, 0, 0, 0, 1, 0, 1, 0, 0, 3, 0, 0, 1, 0, 1, 0, 0, 0, 0],
  [2, 2, 2, 2, 1, 1, 1, 0, 3, 3, 3, 0, 1, 1, 1, 2, 2, 2, 2],
  [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
  [2, 2, 2, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 2, 2, 2],
  [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
  [0, 4, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 4, 0],
  [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0],
  [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];
const ROWS = MAP.length;
const COLS = MAP[0].length;
const GHOST_COLORS = ['#00ffde', '#ff0000', '#ffb8de', '#ffb847'];
const DIRS = ['left', 'right', 'up', 'down'];

let active = null;

export function stopChase() {
  active?.destroy();
  active = null;
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
  return kind === BISCUIT || kind === EMPTY || kind === PILL;
}

function wrap(body, dir) {
  if (body.y !== TUNNEL_Y) return;
  if (body.x >= 190 && dir === 'right') body.x = -10;
  if (body.x <= -12 && dir === 'left') body.x = 190;
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

function mouth(dir, pos) {
  const open = dir === 'right' ? rem(pos.x) < 5
    : dir === 'left' ? rem(pos.x) < 5
    : dir === 'down' || dir === 'up' ? rem(pos.y) < 5
    : false;
  if (!open) return { start: 0, end: 2, ccw: false };
  if (dir === 'right') return { start: 0.25, end: 1.75, ccw: false };
  if (dir === 'down') return { start: 0.75, end: 2.25, ccw: false };
  if (dir === 'up') return { start: 1.25, end: 1.75, ccw: true };
  return { start: 0.75, end: 1.25, ccw: true };
}

function drawChomper(ctx, x, y, s, dir, unit, dying) {
  const cx = x + s / 2;
  const cy = y + s / 2;
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  if (dying > 0) ctx.arc(cx, cy, s / 2, 0, Math.PI * 2 * (1 - dying), true);
  else {
    const angle = mouth(dir, unit);
    ctx.arc(cx, cy, s / 2, Math.PI * angle.start, Math.PI * angle.end, angle.ccw);
  }
  ctx.closePath();
  ctx.fill();
}

function drawGhost(ctx, x, y, s, color, dir, tick) {
  const left = x;
  const top = y;
  const base = top + s - 3;
  const inc = s / 10;
  const high = tick % 10 > 5 ? 3 : -3;
  const low = tick % 10 > 5 ? -3 : 3;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(left, base);
  ctx.quadraticCurveTo(left, top, left + s / 2, top);
  ctx.quadraticCurveTo(left + s, top, left + s, base);
  ctx.quadraticCurveTo(left + s - inc, base + high, left + s - inc * 2, base);
  ctx.quadraticCurveTo(left + s - inc * 3, base + low, left + s - inc * 4, base);
  ctx.quadraticCurveTo(left + s - inc * 5, base + high, left + s - inc * 6, base);
  ctx.quadraticCurveTo(left + s - inc * 7, base + low, left + s - inc * 8, base);
  ctx.quadraticCurveTo(left + s - inc * 9, base + high, left, base);
  ctx.closePath();
  ctx.fill();
  const look = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir] || [0, 0];
  const shift = s / 12;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(left + s * 0.32, top + s * 0.32, s / 6, 0, Math.PI * 2);
  ctx.arc(left + s * 0.72, top + s * 0.32, s / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(left + s * 0.32 + look[0] * shift, top + s * 0.32 + look[1] * shift, s / 15, 0, Math.PI * 2);
  ctx.arc(left + s * 0.72 + look[0] * shift, top + s * 0.32 + look[1] * shift, s / 15, 0, Math.PI * 2);
  ctx.fill();
}

function outlineWalls(ctx, map, s, ox, oy) {
  const solid = (c, r) => {
    if (r === TUNNEL_Y / UNIT && (c < 0 || c >= COLS)) return false;
    if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return true;
    return map[r][c] === WALL;
  };
  const segs = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!solid(c, r)) continue;
      if (!solid(c, r - 1)) segs.push([c, r, c + 1, r]);
      if (!solid(c + 1, r)) segs.push([c + 1, r, c + 1, r + 1]);
      if (!solid(c, r + 1)) segs.push([c + 1, r + 1, c, r + 1]);
      if (!solid(c - 1, r)) segs.push([c, r + 1, c, r]);
    }
  }
  const from = new Map();
  segs.forEach((seg, index) => {
    const key = `${seg[0]},${seg[1]}`;
    if (!from.has(key)) from.set(key, []);
    from.get(key).push(index);
  });
  const used = new Array(segs.length).fill(false);
  ctx.beginPath();
  segs.forEach((seg, index) => {
    if (used[index]) return;
    used[index] = true;
    ctx.moveTo(ox + seg[0] * s, oy + seg[1] * s);
    let x = seg[2];
    let y = seg[3];
    ctx.lineTo(ox + x * s, oy + y * s);
    for (let guard = 0; guard < segs.length; guard++) {
      const next = (from.get(`${x},${y}`) || []).find(id => !used[id]);
      if (next == null) break;
      used[next] = true;
      x = segs[next][2];
      y = segs[next][3];
      ctx.lineTo(ox + x * s, oy + y * s);
    }
  });
  ctx.strokeStyle = '#0000ff';
  ctx.lineWidth = Math.max(2, s * 0.16);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

export function mountChase(root, { prompt, choices = [], copies = 2, playerSpeed = 3.4, bugSpeed = 2.15, bugs = 1, reduced, onDone, onMiss }) {
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

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const calm = reduced ? 0.62 : 1;
  const playerRate = (6 * playerSpeed / 3.4) * calm;
  const bugRate = (6 * bugSpeed / 2.15) * calm;
  root.innerHTML = `<div class="chase-play"><div class="chase" role="application" aria-label="${esc(prompt)}. Steer through the maze. Eat only the matching berries. Stay away from the ghosts."><canvas></canvas></div><div class="steer pad"><button type="button" class="steer-btn" data-dir="left" aria-label="Move left">←</button><button type="button" class="steer-btn" data-dir="up" aria-label="Move up">↑</button><button type="button" class="steer-btn" data-dir="down" aria-label="Move down">↓</button><button type="button" class="steer-btn" data-dir="right" aria-label="Move right">→</button></div></div>`;
  const stage = root.querySelector('.chase');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const map = MAP.map(row => row.slice());
  const blocked = new Set(['9,12', '7,8', '9,8', '11,8']);
  const openSpots = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (blocked.has(`${c},${r}`)) continue;
      if (MAP[r][c] === PILL || MAP[r][c] === BISCUIT) openSpots.push([c, r, MAP[r][c] === PILL ? 0 : 1]);
    }
  }
  const pills = shuffle(openSpots.filter(spot => spot[2] === 0));
  const dots = shuffle(openSpots.filter(spot => spot[2] === 1));
  const list = choices.length ? choices : [{ label: '?', ok: true }];
  const berries = [];
  list.forEach(choice => {
    const n = choice.ok ? Math.max(1, copies) : 1;
    for (let i = 0; i < n; i++) berries.push({ label: String(choice.label), ok: !!choice.ok, fill: choice.fill || '', shape: choice.shape || '', c: 1, r: 1, gone: false, flash: 0 });
  });
  const spots = [];
  const pool = [...pills, ...dots];
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
    if (map[berry.r][berry.c] === BISCUIT) map[berry.r][berry.c] = EMPTY;
  });
  const critters = Array.from({ length: Math.max(1, Math.min(4, bugs)) }, (_, i) => ({
    x: [70, 90, 110, 50][i],
    y: 80,
    dir: perpendicular('left'),
    due: perpendicular('up'),
    color: GHOST_COLORS[i]
  }));
  const player = { x: 90, y: 120, dir: 'none', due: '' };
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
    player.x = 90;
    player.y = 120;
    player.dir = 'none';
    player.due = '';
    dying = 0;
  };
  const gap = ghost => Math.hypot(ghost.x - player.x, ghost.y - player.y);
  const touching = () => critters.some(ghost => gap(ghost) < 10);
  const passed = () => critters.every(ghost => gap(ghost) >= 24);
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
    const c = Math.round(player.x / UNIT);
    const r = Math.round(player.y / UNIT);
    if (tile(map, c, r) === BISCUIT) map[r][c] = EMPTY;
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
    wrap(player, player.dir);
    eatHere();
  };
  const stepGhost = ghost => {
    let tries = 0;
    const go = () => {
      if (tries++ > 6) return;
      let next = null;
      if (ghost.due !== ghost.dir) {
        const trial = moved(ghost, ghost.due);
        const cell = nextCell(trial, ghost.due);
        if (onGrid(ghost) && isFloor(map, cell.c, cell.r)) {
          ghost.dir = ghost.due;
          next = trial;
        }
      }
      if (!next) next = moved(ghost, ghost.dir);
      const cell = nextCell(next, ghost.dir);
      if (onGrid(ghost) && isWall(map, cell.c, cell.r)) {
        ghost.due = perpendicular(ghost.dir);
        go();
        return;
      }
      ghost.x = next.x;
      ghost.y = next.y;
      wrap(ghost, ghost.dir);
      ghost.due = perpendicular(ghost.dir);
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
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    outlineWalls(ctx, map, cell, ox, oy);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (map[r][c] !== BISCUIT) continue;
        if (berries.some(berry => !berry.gone && berry.c === c && berry.r === r)) continue;
        ctx.fillStyle = '#fff';
        ctx.fillRect(ox + c * cell + cell / 2.5, oy + r * cell + cell / 2.5, Math.max(2, cell / 6), Math.max(2, cell / 6));
      }
    }
    critters.forEach(ghost => {
      const [x, y] = at(ghost.x, ghost.y);
      drawGhost(ctx, x, y, cell, ghost.color, ghost.dir, tick);
    });
    const [px, py] = at(player.x, player.y);
    drawChomper(ctx, px, py, cell, player.dir === 'none' ? 'left' : player.dir, player, dying);
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
    } else if (!finished) {
      let playerSteps = 0;
      let ghostSteps = 0;
      [playerAcc, playerSteps] = takeSteps(playerAcc, playerRate, dt);
      [ghostAcc, ghostSteps] = takeSteps(ghostAcc, bugRate, dt);
      const cycles = Math.max(playerSteps, ghostSteps);
      for (let i = 0; i < cycles; i++) {
        if (i < playerSteps) stepPlayer();
        if (dying > 0) break;
        if (i < ghostSteps) critters.forEach(stepGhost);
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
