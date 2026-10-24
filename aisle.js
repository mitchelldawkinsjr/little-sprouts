let stop = () => {};

const call = (fn, ...args) => { try { return fn?.(...args); } catch (error) { console.error(error); } };

const WORLD = { w: 900, h: 1320 };
const SHELVES = [
  { x: 48, y: 150, w: 168, h: 880 },
  { x: 366, y: 150, w: 168, h: 880 },
  { x: 684, y: 150, w: 168, h: 880 }
];
const BINS = [
  { x: 36, y: 1088, w: 250, h: 70 },
  { x: 614, y: 1088, w: 250, h: 70 }
];
const BLOCKS = [...SHELVES, ...BINS];

function shelfSpots() {
  const spots = [];
  SHELVES.forEach(shelf => {
    for (let i = 0; i < 5; i++) {
      const y = 230 + i * 170;
      if (shelf.x < 200) spots.push({ x: shelf.x + shelf.w + 40, y });
      else if (shelf.x > 600) spots.push({ x: shelf.x - 40, y });
      else {
        spots.push({ x: shelf.x - 40, y });
        spots.push({ x: shelf.x + shelf.w + 40, y });
      }
    }
  });
  return spots;
}
const SPOTS = shelfSpots();

export function stopAisle() {
  stop();
  stop = () => {};
}

function drawShape(ctx, name, x, y, s, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill || '#5d7a45';
  ctx.strokeStyle = '#3d5230';
  ctx.lineWidth = Math.max(2, s * 0.06);
  const path = new Path2D();
  if (name === 'square' || name === 'rectangle') {
    const w = name === 'rectangle' ? s * 1.35 : s;
    path.roundRect(-w / 2, -s / 2, w, s, s * 0.12);
  } else if (name === 'triangle') {
    path.moveTo(0, -s * 0.55);
    path.lineTo(s * 0.55, s * 0.42);
    path.lineTo(-s * 0.55, s * 0.42);
    path.closePath();
  } else if (name === 'diamond') {
    path.moveTo(0, -s * 0.58);
    path.lineTo(s * 0.46, 0);
    path.lineTo(0, s * 0.58);
    path.lineTo(-s * 0.46, 0);
    path.closePath();
  } else if (name === 'star') {
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? s * 0.24 : s * 0.55;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      path.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    path.closePath();
  } else if (name === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 3;
      path.lineTo(Math.cos(a) * s * 0.52, Math.sin(a) * s * 0.52);
    }
    path.closePath();
  } else if (name === 'oval') {
    path.ellipse(0, 0, s * 0.62, s * 0.42, 0, 0, Math.PI * 2);
  } else {
    path.arc(0, 0, s * 0.46, 0, Math.PI * 2);
  }
  ctx.fill(path);
  ctx.stroke(path);
  ctx.restore();
}

function hits(x, y, radius) {
  return BLOCKS.some(block => x > block.x - radius && x < block.x + block.w + radius && y > block.y - radius && y < block.y + block.h + radius);
}

export function mountAisle(root, { board = {}, reduced, nextQuestion, onPrompt, onMiss, onClear, onTime, onFinished } = {}) {
  stopAisle();
  if (!root) return;
  const host = document.createElement('div');
  host.className = 'arcade aisle-play';
  host.innerHTML = `<canvas class="aisle" aria-label="A market. Walk the aisles and pick up the right thing before time runs out."></canvas><div class="steer market-pad" aria-label="Walk"><button type="button" class="steer-btn" data-dir="up" aria-label="Up">↑</button><button type="button" class="steer-btn" data-dir="left" aria-label="Left">←</button><button type="button" class="steer-btn" data-dir="down" aria-label="Down">↓</button><button type="button" class="steer-btn" data-dir="right" aria-label="Right">→</button></div>`;
  root.replaceChildren(host);
  const canvas = host.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const keys = new Set();
  const player = { x: 450, y: 1230 };
  let alive = true;
  let frame = 0;
  let width = 1;
  let height = 1;
  let dpr = 1;
  let goods = [];
  let phase = 'shop';
  let clock = board.seconds || 32;
  let shown = -1;
  let slipped = false;
  let reveal = false;
  let wait = 0;
  let shake = 0;
  let bob = 0;
  let aim = null;

  const seconds = () => Math.max(8, (+board.seconds || 32) * (reduced ? 1.4 : 1));
  const speed = () => (reduced ? 120 : 188);
  const fit = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(280, rect.width || 640);
    height = Math.max(220, rect.height || 460);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  };
  const lay = choices => {
    const pool = [...SPOTS].sort(() => Math.random() - 0.5);
    const placed = [];
    choices.forEach(choice => {
      let spot = pool.find(candidate => placed.every(item => Math.hypot(item.x - candidate.x, item.y - candidate.y) > 240) && Math.hypot(candidate.x - player.x, candidate.y - player.y) > 90);
      if (!spot) spot = pool.find(candidate => Math.hypot(candidate.x - player.x, candidate.y - player.y) > 70) || pool[0];
      const index = pool.indexOf(spot);
      if (index >= 0) pool.splice(index, 1);
      placed.push({ ...choice, x: spot.x, y: spot.y, tried: false });
    });
    return placed;
  };
  const reportTime = () => {
    const next = Math.max(0, Math.ceil(clock));
    if (next === shown) return;
    shown = next;
    call(onTime, next);
  };
  const begin = () => {
    const pack = call(nextQuestion);
    if (!pack?.choices?.length) {
      phase = 'done';
      call(onFinished);
      return;
    }
    goods = lay(pack.choices);
    phase = 'shop';
    clock = seconds();
    shown = -1;
    slipped = false;
    reveal = false;
    aim = null;
    reportTime();
    call(onPrompt);
  };
  const take = item => {
    if (!item || item.tried || phase !== 'shop') return;
    if (!item.ok) {
      item.tried = true;
      slipped = true;
      shake = 1;
      call(onMiss, 'wrong');
      return;
    }
    item.tried = true;
    phase = 'pocket';
    wait = reduced ? 0.2 : 0.4;
    aim = null;
  };

  const drawShelf = shelf => {
    ctx.fillStyle = '#8d5b3c';
    ctx.beginPath();
    ctx.roundRect(shelf.x, shelf.y, shelf.w, shelf.h, 12);
    ctx.fill();
    for (let y = shelf.y + 28; y < shelf.y + shelf.h - 16; y += 64) {
      ctx.fillStyle = '#c9845a';
      ctx.fillRect(shelf.x + 8, y, shelf.w - 16, 8);
      ctx.fillStyle = '#e7c56a';
      ctx.fillRect(shelf.x + 16, y - 28, 36, 24);
      ctx.fillStyle = '#7ea36a';
      ctx.fillRect(shelf.x + shelf.w - 56, y - 28, 36, 24);
    }
  };
  const drawCard = item => {
    const glow = reveal && item.ok;
    const s = glow ? 34 + Math.sin(performance.now() / 180) * 3 : 30;
    ctx.save();
    ctx.translate(item.x, item.y);
    if (glow) {
      ctx.fillStyle = 'rgba(245, 212, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, 46, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = item.tried && !item.ok ? '#f3d2cc' : '#fffaf3';
    ctx.strokeStyle = glow ? '#e2b100' : '#c9b18a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-s, -s * 0.85, s * 2, s * 1.7, 10);
    ctx.fill();
    ctx.stroke();
    if (item.shape) drawShape(ctx, item.shape, 0, 2, s * 0.9, item.fill || '#5d7a45');
    else if (item.fill) {
      ctx.fillStyle = item.fill;
      ctx.strokeStyle = String(item.fill).toLowerCase() === '#ffffff' ? '#c9b18a' : 'transparent';
      ctx.beginPath();
      ctx.roundRect(-s * 0.55, -s * 0.55, s * 1.1, s * 0.7, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#243028';
      ctx.font = '700 13px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(item.label || ''), 0, s * 0.48);
    } else {
      const text = String(item.label || '');
      ctx.fillStyle = '#243028';
      ctx.font = `700 ${Math.max(14, Math.min(22, 150 / Math.max(2, text.length)))}px "Trebuchet MS", Verdana, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 0);
    }
    ctx.restore();
  };
  const drawKid = () => {
    const y = player.y + Math.sin(bob) * 2;
    ctx.fillStyle = 'rgba(80, 58, 32, 0.18)';
    ctx.beginPath();
    ctx.ellipse(player.x, y + 20, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6f9a52';
    ctx.beginPath();
    ctx.roundRect(player.x - 11, y - 8, 22, 24, 8);
    ctx.fill();
    ctx.fillStyle = '#f3c7a1';
    ctx.beginPath();
    ctx.arc(player.x, y - 16, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5d7a45';
    ctx.beginPath();
    ctx.ellipse(player.x + 2, y - 28, 7, 4, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8d5b3c';
    ctx.beginPath();
    ctx.roundRect(player.x + 8, y - 2, 14, 12, 3);
    ctx.fill();
  };
  const view = () => {
    const scale = width / WORLD.w;
    const viewH = height / scale;
    const camY = Math.max(0, Math.min(Math.max(0, WORLD.h - viewH), player.y - viewH * 0.62));
    return { scale, viewH, camY };
  };
  const draw = () => {
    const { scale, camY } = view();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, -camY * dpr * scale);
    ctx.fillStyle = '#f4e7cf';
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    ctx.fillStyle = '#e7d3ae';
    for (let y = 40; y < WORLD.h; y += 48) ctx.fillRect(24, y, WORLD.w - 48, 2);
    ctx.fillStyle = '#d7c09a';
    ctx.fillRect(24, 120, WORLD.w - 48, WORLD.h - 160);
    SHELVES.forEach(drawShelf);
    BINS.forEach(bin => {
      ctx.fillStyle = '#6f9a52';
      ctx.beginPath();
      ctx.roundRect(bin.x, bin.y, bin.w, bin.h, 12);
      ctx.fill();
      ctx.fillStyle = '#e23b3b';
      ctx.beginPath();
      ctx.arc(bin.x + 28, bin.y + 34, 10, 0, Math.PI * 2);
      ctx.arc(bin.x + 54, bin.y + 30, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5d400';
      ctx.beginPath();
      ctx.arc(bin.x + bin.w - 40, bin.y + 34, 10, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#8d5b3c';
    ctx.fillRect(300, 1168, 300, 18);
    ctx.fillStyle = '#5d4632';
    ctx.font = '700 22px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Market', WORLD.w / 2, 96);
    goods.forEach(item => { if (!item.tried || !item.ok) drawCard(item); });
    drawKid();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const left = Math.max(0, Math.ceil(clock));
    ctx.fillStyle = left === 0 ? '#c45c3a' : '#fffaf3';
    ctx.strokeStyle = '#c9b18a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(width - 92, 12, 76, 32, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = left === 0 ? '#fffaf3' : '#243028';
    ctx.font = '700 16px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${left}s`, width - 54, 28);
  };

  const step = now => {
    if (!alive) return;
    const dt = Math.min(0.05, (now - (step.then || now)) / 1000 || 0);
    step.then = now;
    const paused = !!document.querySelector('dialog[open]');
    if (!paused && phase === 'shop') {
      let dx = 0;
      let dy = 0;
      if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
      if (keys.has('arrowright') || keys.has('d')) dx += 1;
      if (keys.has('arrowup') || keys.has('w')) dy -= 1;
      if (keys.has('arrowdown') || keys.has('s')) dy += 1;
      if (dx || dy) aim = null;
      if (!dx && !dy && aim) {
        dx = aim.x - player.x;
        dy = aim.y - player.y;
        if (Math.hypot(dx, dy) < 8) aim = null;
      }
      const length = Math.hypot(dx, dy) || 1;
      const stepX = (dx / length) * speed() * dt;
      const stepY = (dy / length) * speed() * dt;
      const radius = 16;
      const nextX = Math.max(36, Math.min(WORLD.w - 36, player.x + stepX));
      const nextY = Math.max(130, Math.min(WORLD.h - 36, player.y + stepY));
      if (dx && !hits(nextX, player.y, radius)) player.x = nextX;
      if (dy && !hits(player.x, nextY, radius)) player.y = nextY;
      if (dx || dy) bob += dt * 10;
      const near = goods.find(item => !item.tried && Math.hypot(item.x - player.x, item.y - player.y) < 34);
      if (near) take(near);
      if (!reveal) {
        clock -= dt;
        if (clock <= 0) {
          clock = 0;
          reveal = true;
          slipped = true;
          call(onMiss, 'time');
        }
      }
      reportTime();
    } else if (!paused && phase === 'pocket') {
      wait -= dt;
      if (wait <= 0) {
        call(onClear, !slipped);
        begin();
      }
    }
    if (shake > 0) shake = Math.max(0, shake - dt * 2);
    draw();
    frame = requestAnimationFrame(step);
  };

  const down = event => {
    const key = event.key.toLowerCase();
    keys.add(key);
  };
  const up = event => keys.delete(event.key.toLowerCase());
  const hold = (button, on) => {
    const dir = button.dataset.dir;
    const key = dir === 'up' ? 'arrowup' : dir === 'down' ? 'arrowdown' : dir === 'left' ? 'arrowleft' : 'arrowright';
    if (on) keys.add(key);
    else keys.delete(key);
  };
  const point = event => {
    const rect = canvas.getBoundingClientRect();
    const { scale, camY } = view();
    aim = {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale + camY
    };
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  canvas.addEventListener('pointerdown', point);
  host.querySelectorAll('[data-dir]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      hold(button, true);
      button.setPointerCapture?.(event.pointerId);
    });
    button.addEventListener('pointerup', () => hold(button, false));
    button.addEventListener('pointercancel', () => hold(button, false));
    button.addEventListener('pointerleave', event => { if (!button.hasPointerCapture?.(event.pointerId)) hold(button, false); });
  });
  const onResize = () => fit();
  window.addEventListener('resize', onResize);
  fit();
  begin();
  frame = requestAnimationFrame(step);
  stop = () => {
    alive = false;
    cancelAnimationFrame(frame);
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('resize', onResize);
  };
}
