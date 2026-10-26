/**
 * Tilt maze — roll to the flag before the clock runs out.
 * A fall or an empty clock waits for the host to add time.
 * The board is drawn here for Little Sprouts.
 */
import { questionHolding } from './hold.js?v=ask-first';

let active = null;

export function stopMaze() {
  active?.destroy();
  active = null;
}

function carve(cols, rows, rand) {
  const hWall = Array.from({ length: rows }, () => Array(cols - 1).fill(true));
  const vWall = Array.from({ length: rows - 1 }, () => Array(cols).fill(true));
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const stack = [[0, 0]];
  seen[0][0] = true;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const next = [];
    if (x > 0 && !seen[y][x - 1]) next.push([x - 1, y, 'h', x - 1, y]);
    if (x + 1 < cols && !seen[y][x + 1]) next.push([x + 1, y, 'h', x, y]);
    if (y > 0 && !seen[y - 1][x]) next.push([x, y - 1, 'v', x, y - 1]);
    if (y + 1 < rows && !seen[y + 1][x]) next.push([x, y + 1, 'v', x, y]);
    if (!next.length) { stack.pop(); continue; }
    const pick = next[Math.floor(rand() * next.length)];
    if (pick[2] === 'h') hWall[pick[4]][pick[3]] = false;
    else vWall[pick[4]][pick[3]] = false;
    seen[pick[1]][pick[0]] = true;
    stack.push([pick[0], pick[1]]);
  }
  return { hWall, vWall };
}

function route(cols, rows, walls) {
  const dist = Array.from({ length: rows }, () => Array(cols).fill(-1));
  const prev = Array.from({ length: rows }, () => Array(cols).fill(null));
  const open = (x, y, nx, ny) => {
    if (nx === x + 1) return x + 1 < cols && !walls.hWall[y][x];
    if (nx === x - 1) return x > 0 && !walls.hWall[y][x - 1];
    if (ny === y + 1) return y + 1 < rows && !walls.vWall[y][x];
    return y > 0 && !walls.vWall[y - 1][x];
  };
  const queue = [[0, 0]];
  dist[0][0] = 0;
  while (queue.length) {
    const [x, y] = queue.shift();
    [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(([nx, ny]) => {
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || dist[ny][nx] >= 0 || !open(x, y, nx, ny)) return;
      dist[ny][nx] = dist[y][x] + 1;
      prev[ny][nx] = [x, y];
      queue.push([nx, ny]);
    });
  }
  const on = Array.from({ length: rows }, () => Array(cols).fill(false));
  let cur = [cols - 1, rows - 1];
  while (cur) {
    on[cur[1]][cur[0]] = true;
    cur = prev[cur[1]][cur[0]];
  }
  return { dist, on };
}

function setWall(walls, kind, wy, wx, open) {
  if (wy < 0 || wx < 0) return false;
  if (kind === 'h') {
    if (wy >= walls.hWall.length || wx >= walls.hWall[wy].length) return false;
    walls.hWall[wy][wx] = !open;
  } else {
    if (wy >= walls.vWall.length || wx >= walls.vWall[wy].length) return false;
    walls.vWall[wy][wx] = !open;
  }
  return true;
}

function holesFor(cols, rows, count, walls, rand) {
  const { dist, on } = route(cols, rows, walls);
  const sides = [[1, 0, 'h', 0, 0], [-1, 0, 'h', 0, -1], [0, 1, 'v', 0, 0], [0, -1, 'v', -1, 0]];
  const pockets = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!on[y][x] || dist[y][x] < 2) continue;
      sides.forEach(([dx, dy, kind, wy, wx]) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || on[ny][nx]) return;
        pockets.push({ x: nx, y: ny, kind, wy: y + wy, wx: x + wx, from: dist[y][x] });
      });
    }
  }
  pockets.sort((a, b) => a.from - b.from || rand() - 0.5);
  const holes = [];
  const used = new Set();
  pockets.forEach(pocket => {
    if (holes.length >= count || used.has(`${pocket.x},${pocket.y}`)) return;
    if (!setWall(walls, pocket.kind, pocket.wy, pocket.wx, true)) return;
    const later = route(cols, rows, walls);
    if (later.on[pocket.y][pocket.x]) {
      setWall(walls, pocket.kind, pocket.wy, pocket.wx, false);
      return;
    }
    used.add(`${pocket.x},${pocket.y}`);
    holes.push([pocket.x, pocket.y]);
  });
  return holes;
}

export function mountMaze(root, { clock, reduced, onTick, onFall, onTime, onGoal }) {
  stopMaze();
  const calm = reduced ? 0.72 : 1;
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

  const spec = {
    seconds: clock?.seconds || 45,
    cols: clock?.cols || 7,
    rows: clock?.rows || 9,
    holes: clock?.holes || 2
  };
  root.innerHTML = `<div class="maze-play"><div class="maze-hud"><span id="mazeClock">0:00</span><span>Tilt to the flag</span></div><div class="maze" role="application" aria-label="Tilt the maze to the flag before time runs out."><div class="maze-board"><canvas class="maze-view"></canvas></div></div><div class="steer maze-pad"><button type="button" class="steer-btn" data-tilt="up" aria-label="Tilt up">↑</button><button type="button" class="steer-btn" data-tilt="left" aria-label="Tilt left">←</button><button type="button" class="steer-btn" data-tilt="down" aria-label="Tilt down">↓</button><button type="button" class="steer-btn" data-tilt="right" aria-label="Tilt right">→</button></div></div>`;
  const stage = root.querySelector('.maze');
  const board = stage.querySelector('.maze-board');
  const canvas = board.querySelector('canvas');
  const clockLabel = root.querySelector('#mazeClock');
  const ctx = canvas.getContext('2d');
  let width = 640;
  let height = 360;
  let cols = spec.cols;
  let rows = spec.rows;
  let walls = carve(cols, rows, Math.random);
  let holes = holesFor(cols, rows, spec.holes, walls, Math.random);
  let ball = { x: 0.5, y: 0.5, vx: 0, vy: 0 };
  let left = spec.seconds;
  let total = spec.seconds;
  let paused = false;
  let over = false;
  let last = 0;
  let reported = '';
  const tilt = { x: 0, y: 0, keys: { up: false, down: false, left: false, right: false } };
  const shown = { roll: 0, pitch: 0 };
  const radius = 0.22;

  const call = (fn, arg) => { try { fn?.(arg); } catch { /* the host owns errors */ } };
  const holeAt = (x, y) => holes.some(([hx, hy]) => hx === x && hy === y);
  const paintClock = () => {
    const show = Math.max(0, Math.ceil(left));
    if (clockLabel) clockLabel.textContent = `${show}s`;
    call(onTick, { left: show, total });
  };

  const layout = () => {
    const rect = stage.getBoundingClientRect();
    const fit = Math.min((rect.width * 0.72) / cols, (rect.height * 0.72) / rows);
    const boardW = Math.max(140, fit * cols);
    const boardH = Math.max(140, fit * rows);
    board.style.width = `${boardW}px`;
    board.style.height = `${boardH}px`;
    width = boardW;
    height = boardH;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const slope = () => {
    const keyed = tilt.keys.right || tilt.keys.left || tilt.keys.up || tilt.keys.down;
    return {
      x: (tilt.keys.right ? 1 : 0) - (tilt.keys.left ? 1 : 0) + (keyed ? 0 : tilt.x),
      y: (tilt.keys.down ? 1 : 0) - (tilt.keys.up ? 1 : 0) + (keyed ? 0 : tilt.y)
    };
  };

  const maxTilt = (reduced ? 12 : 18) * calm;

  const paint = () => {
    ctx.clearRect(0, 0, width, height);
    const cell = Math.min(width / cols, height / rows);
    const ox = (width - cell * cols) / 2;
    const oy = (height - cell * rows) / 2;
    const px = x => ox + x * cell;
    const py = y => oy + y * cell;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const pit = holeAt(x, y);
        const goal = x === cols - 1 && y === rows - 1;
        ctx.fillStyle = pit ? '#1d2a33' : goal ? '#f8ce6c' : ((x + y) % 2 ? '#d5e4c8' : '#e7f0df');
        ctx.fillRect(px(x), py(y), cell + 0.5, cell + 0.5);
        if (pit) {
          ctx.beginPath();
          ctx.arc(px(x + 0.5), py(y + 0.5), cell * 0.28, 0, Math.PI * 2);
          ctx.fillStyle = '#0e161c';
          ctx.fill();
        }
      }
    }
    const poleX = px(cols - 0.32);
    const poleTop = py(rows - 0.78);
    ctx.strokeStyle = '#32634e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(poleX, poleTop);
    ctx.lineTo(poleX, py(rows - 0.28));
    ctx.stroke();
    ctx.fillStyle = '#dc6253';
    ctx.fillRect(poleX, poleTop, cell * 0.26, cell * 0.16);
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = '#6f9460';
    ctx.lineWidth = Math.max(5, cell * 0.18);
    const edge = (x1, y1, x2, y2) => {
      ctx.beginPath();
      ctx.moveTo(px(x1), py(y1));
      ctx.lineTo(px(x2), py(y2));
      ctx.stroke();
    };
    edge(0, 0, cols, 0);
    edge(0, rows, cols, rows);
    edge(0, 0, 0, rows);
    edge(cols, 0, cols, rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols - 1; x++) if (walls.hWall[y][x]) edge(x + 1, y, x + 1, y + 1);
    }
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols; x++) if (walls.vWall[y][x]) edge(x, y + 1, x + 1, y + 1);
    }
    const bx = px(ball.x);
    const by = py(ball.y);
    const r = Math.max(6, cell * 0.28);
    ctx.beginPath();
    ctx.arc(bx + 2, by + 3, r * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = '#24332c33';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fillStyle = '#f4f7ef';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#32634e';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bx - r * 0.28, by - r * 0.28, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  };

  const blocked = (x, y, nx, ny) => {
    let px = nx;
    let py = ny;
    const row = Math.min(rows - 1, Math.max(0, Math.floor(y)));
    const col = Math.min(cols - 1, Math.max(0, Math.floor(x)));
    if (px < radius) px = radius;
    if (py < radius) py = radius;
    if (px > cols - radius) px = cols - radius;
    if (py > rows - radius) py = rows - radius;
    const vx = px - x;
    if (vx > 0 && px + radius > col + 1 && (col + 1 >= cols || walls.hWall[row][col])) px = col + 1 - radius;
    if (vx < 0 && px - radius < col && (col <= 0 || walls.hWall[row][col - 1])) px = col + radius;
    const nextCol = Math.min(cols - 1, Math.max(0, Math.floor(px)));
    const vy = py - y;
    if (vy > 0 && py + radius > row + 1 && (row + 1 >= rows || walls.vWall[row][nextCol])) py = row + 1 - radius;
    if (vy < 0 && py - radius < row && (row <= 0 || walls.vWall[row - 1][nextCol])) py = row + radius;
    return { x: px, y: py };
  };

  const resetBall = () => {
    ball = { x: 0.5, y: 0.5, vx: 0, vy: 0 };
  };

  const build = next => {
    cols = next?.cols || spec.cols;
    rows = next?.rows || spec.rows;
    walls = carve(cols, rows, Math.random);
    holes = holesFor(cols, rows, next?.holes ?? spec.holes, walls, Math.random);
    resetBall();
    reported = '';
    paused = false;
  };

  const tick = now => {
    if (session.dead) return;
    const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016);
    last = now;
    const heldQuestion = questionHolding();
    const lean = paused || over || heldQuestion ? { x: 0, y: 0 } : slope();
    const glide = Math.min(1, dt * 6);
    shown.roll += (lean.x * maxTilt - shown.roll) * glide;
    shown.pitch += (lean.y * maxTilt - shown.pitch) * glide;
    board.style.transform = `rotateX(${shown.pitch}deg) rotateY(${-shown.roll}deg)`;
    if (!paused && !over && !heldQuestion) {
      const ax = shown.roll / maxTilt;
      const ay = shown.pitch / maxTilt;
      ball.vx = (ball.vx + ax * 7.5 * calm * dt) * (1 - Math.min(1, 1.8 * dt));
      ball.vy = (ball.vy + ay * 7.5 * calm * dt) * (1 - Math.min(1, 1.8 * dt));
      const next = blocked(ball.x, ball.y, ball.x + ball.vx * dt, ball.y + ball.vy * dt);
      if (next.x === ball.x) ball.vx = 0;
      if (next.y === ball.y) ball.vy = 0;
      ball.x = next.x;
      ball.y = next.y;
      const cx = Math.floor(ball.x);
      const cy = Math.floor(ball.y);
      if (holeAt(cx, cy) && Math.hypot(ball.x - (cx + 0.5), ball.y - (cy + 0.5)) < 0.36) {
        paused = true;
        if (reported !== 'fall') {
          reported = 'fall';
          call(onFall);
        }
      } else if (cx === cols - 1 && cy === rows - 1 && Math.hypot(ball.x - (cols - 0.5), ball.y - (rows - 0.5)) < 0.34) {
        paused = true;
        if (reported !== 'goal') {
          reported = 'goal';
          call(onGoal);
        }
      }
      left -= dt;
      if (left <= 0) {
        left = 0;
        paused = true;
        if (reported !== 'time' && reported !== 'goal') {
          reported = 'time';
          call(onTime);
        }
      }
      paintClock();
    }
    paint();
    session.raf = requestAnimationFrame(tick);
  };

  const keyName = event => {
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') return 'left';
    if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') return 'right';
    if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') return 'up';
    if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') return 'down';
    return '';
  };
  const typing = event => event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
  const onKey = event => {
    if (document.querySelector('dialog[open]') || typing(event)) return;
    const name = keyName(event);
    if (!name) return;
    event.preventDefault();
    tilt.keys[name] = event.type === 'keydown';
  };
  const push = name => {
    const kick = 2.6;
    if (name === 'right') ball.vx = Math.max(ball.vx, kick);
    if (name === 'left') ball.vx = Math.min(ball.vx, -kick);
    if (name === 'down') ball.vy = Math.max(ball.vy, kick);
    if (name === 'up') ball.vy = Math.min(ball.vy, -kick);
  };
  const onButton = event => {
    const button = event.currentTarget;
    const name = button?.dataset.tilt;
    if (!name) return;
    if (event.type === 'pointerdown') {
      event.preventDefault();
      tilt.keys[name] = true;
      if (!paused && !over) push(name);
      button.setPointerCapture?.(event.pointerId);
      return;
    }
    tilt.keys[name] = false;
  };
  const onOrient = event => {
    if (paused) return;
    const beta = event.beta;
    const gamma = event.gamma;
    if (beta == null || gamma == null) return;
    if (Math.abs(beta) < 2 && Math.abs(gamma) < 2) return;
    tilt.x = Math.max(-1, Math.min(1, gamma / 28));
    tilt.y = Math.max(-1, Math.min(1, (beta - 35) / 28));
  };
  const allowTilt = () => {
    const ask = DeviceOrientationEvent?.requestPermission;
    if (typeof ask === 'function') ask.call(DeviceOrientationEvent).catch(() => {});
  };

  layout();
  paintClock();
  canvas.addEventListener('pointerdown', allowTilt);
  window.addEventListener('deviceorientation', onOrient);
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);
  root.querySelectorAll('[data-tilt]').forEach(button => {
    button.addEventListener('pointerdown', onButton);
    button.addEventListener('pointerup', onButton);
    button.addEventListener('pointercancel', onButton);
    button.addEventListener('lostpointercapture', onButton);
  });
  window.addEventListener('resize', layout);
  session.cleanups.push(() => {
    canvas.removeEventListener('pointerdown', allowTilt);
    window.removeEventListener('deviceorientation', onOrient);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup', onKey);
    window.removeEventListener('resize', layout);
  });
  session.raf = requestAnimationFrame(tick);

  return {
    revive() {
      if (session.dead) return;
      resetBall();
      reported = '';
      paused = false;
    },
    addTime(seconds) {
      if (session.dead) return;
      left += Math.max(0, +seconds || 0);
      total = Math.max(total, left);
      if (reported === 'time') reported = '';
      paused = false;
      paintClock();
    },
    pause() { paused = true; },
    resume() {
      reported = '';
      paused = false;
    },
    next(nextClock) {
      if (session.dead) return;
      build(nextClock || spec);
      left = nextClock?.seconds || spec.seconds;
      total = left;
      paintClock();
    },
    destroy: session.destroy
  };
}
