/**
 * Shape puzzle — glass pieces that snap into a shape.
 * The glass-piece idea follows the Glass Physics 3D Jigsaw on FreeFrontend.
 * The pictures, cuts, and speech check here are Little Sprouts’ own.
 */
const SIZE = 100;
let active = null;

export function stopPuzzle() {
  active?.destroy();
  active = null;
}

function starPath(cx, cy, outer, inner) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    d += `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)} `;
  }
  return `${d}Z`;
}

function shapePath(name) {
  switch (name) {
    case 'square': return 'M16,16 H84 V84 H16 Z';
    case 'triangle': return 'M50,8 L92,90 H8 Z';
    case 'rectangle': return 'M6,28 H94 V72 H6 Z';
    case 'oval': return 'M50,20 A38,28 0 1 0 50.1,20 Z';
    case 'diamond': return 'M50,6 L92,50 L50,94 L8,50 Z';
    case 'hexagon': return 'M28,10 H72 L94,50 L72,90 H28 L6,50 Z';
    case 'star': return starPath(50, 52, 44, 18);
    default: return 'M50,6 A44,44 0 1 0 50.1,6 Z';
  }
}

function gridFor(count) {
  if (count <= 2) return { cols: 2, rows: 1 };
  if (count <= 4) return { cols: 2, rows: 2 };
  return { cols: 3, rows: 2 };
}

function verticalSeam(x, yFrom, yTo, radius, bulgeX) {
  const mid = (yFrom + yTo) / 2;
  const arc = [];
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + Math.PI * (i / 8);
    arc.push([x + Math.cos(a) * radius * bulgeX, mid + Math.sin(a) * radius]);
  }
  return yTo > yFrom ? arc : arc.reverse();
}

function horizontalSeam(y, xFrom, xTo, radius, bulgeY) {
  const mid = (xFrom + xTo) / 2;
  const sign = xTo > xFrom ? 1 : -1;
  const sweep = sign * (bulgeY > 0 ? -1 : 1) * Math.PI;
  const start = sign > 0 ? Math.PI : 0;
  const arc = [];
  for (let i = 0; i <= 8; i++) {
    const a = start + sweep * (i / 8);
    arc.push([mid + Math.cos(a) * radius, y + Math.sin(a) * radius]);
  }
  return arc;
}

function piecePoints(col, row, cols, rows) {
  const w = SIZE / cols;
  const h = SIZE / rows;
  const x0 = col * w;
  const y0 = row * h;
  const x1 = x0 + w;
  const y1 = y0 + h;
  const radius = Math.min(w, h) * 0.2;
  const pts = [[x0, y0]];
  if (row > 0) {
    const knobDown = (col + row - 1) % 2 === 0;
    pts.push(...horizontalSeam(y0, x0, x1, radius, knobDown ? 1 : -1));
  }
  pts.push([x1, y0]);
  if (col < cols - 1) {
    const knobRight = (col + row) % 2 === 0;
    pts.push(...verticalSeam(x1, y0, y1, radius, knobRight ? 1 : -1));
  }
  pts.push([x1, y1]);
  if (row < rows - 1) {
    const knobDown = (col + row) % 2 === 0;
    pts.push(...horizontalSeam(y1, x1, x0, radius, knobDown ? 1 : -1));
  }
  pts.push([x0, y1]);
  if (col > 0) {
    const knobRight = (col - 1 + row) % 2 === 0;
    pts.push(...verticalSeam(x0, y1, y0, radius, knobRight ? 1 : -1));
  }
  return pts;
}

function outlinePath(pts) {
  return `${pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('')}Z`;
}

function bounds(pts) {
  const pad = 1.2;
  const minX = Math.max(0, Math.min(...pts.map(p => p[0])) - pad);
  const minY = Math.max(0, Math.min(...pts.map(p => p[1])) - pad);
  const maxX = Math.min(SIZE, Math.max(...pts.map(p => p[0])) + pad);
  const maxY = Math.min(SIZE, Math.max(...pts.map(p => p[1])) + pad);
  return { minX, minY, maxX, maxY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
}

function localPolygon(pts, box) {
  return `polygon(${pts.map(([x, y]) => `${((x - box.minX) / box.w * 100).toFixed(2)}% ${((y - box.minY) / box.h * 100).toFixed(2)}%`).join(',')})`;
}

export function mountPuzzle(root, { shape = 'circle', pieces = 2, outline = false, onBuilt } = {}) {
  stopPuzzle();
  const count = pieces <= 2 ? 2 : pieces <= 4 ? 4 : 6;
  const { cols, rows } = gridFor(count);
  const path = shapePath(shape);
  const shards = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const pts = piecePoints(col, row, cols, rows);
      const box = bounds(pts);
      shards.push({
        col, row, pts, box,
        cx: (box.minX + box.w / 2) / SIZE,
        cy: (box.minY + box.h / 2) / SIZE,
        x: 0, y: 0, locked: false, dragging: false
      });
    }
  }
  const glass = i => `glass${i}`;
  root.innerHTML = `<div class="puzzle-stage arcade"><div class="puzzle-board"><div class="puzzle-mat" role="group" aria-label="Puzzle board">${outline ? `<svg class="puzzle-outline" viewBox="0 0 100 100" aria-hidden="true"><path d="${path}"/></svg>` : ''}${shards.map((shard, i) => `<button type="button" class="shard" data-piece="${i}" aria-label="Puzzle piece" style="left:${shard.box.minX}%;top:${shard.box.minY}%;width:${shard.box.w}%;height:${shard.box.h}%;clip-path:${localPolygon(shard.pts, shard.box)}"><svg viewBox="${shard.box.minX} ${shard.box.minY} ${shard.box.w} ${shard.box.h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${glass(i)}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7fffb"/><stop offset="0.45" stop-color="#c5eadb"/><stop offset="1" stop-color="#7eb8a4"/></linearGradient><clipPath id="shape${i}"><path d="${path}"/></clipPath></defs><g clip-path="url(#shape${i})"><path d="${outlinePath(shard.pts)}" fill="url(#${glass(i)})" stroke="#2f6a58" stroke-opacity=".35" stroke-width=".45" stroke-linejoin="round"/><ellipse cx="${(shard.col + 0.42) * (SIZE / cols)}" cy="${(shard.row + 0.32) * (SIZE / rows)}" rx="${Math.min(SIZE / cols, SIZE / rows) * 0.16}" ry="${Math.min(SIZE / cols, SIZE / rows) * 0.09}" fill="#fff" fill-opacity=".45"/></g></svg></button>`).join('')}</div></div><div class="puzzle-tray" aria-hidden="true"></div></div>`;
  shards.forEach((shard, i) => { shard.el = root.querySelector(`[data-piece="${i}"]`); });
  let reported = false;
  const mat = root.querySelector('.puzzle-mat');

  function paint(shard) {
    const scale = shard.locked ? 1 : (shard.scale || 1);
    shard.el.style.transformOrigin = 'center';
    shard.el.style.transform = `translate(${shard.x}px, ${shard.y}px) scale(${scale})`;
  }

  function lock(shard) {
    if (shard.locked) return;
    shard.locked = true;
    shard.dragging = false;
    shard.x = 0;
    shard.y = 0;
    shard.el.classList.add('home');
    shard.el.setAttribute('aria-label', 'Puzzle piece, in place');
    paint(shard);
    if (!reported && shards.every(item => item.locked)) {
      reported = true;
      onBuilt?.();
    }
  }

  function nearHome(shard) {
    return Math.hypot(shard.x, shard.y) < 46;
  }

  function tray(shard, index) {
    const matBox = mat.getBoundingClientRect();
    const trayBox = root.querySelector('.puzzle-tray').getBoundingClientRect();
    if (!matBox.width || !trayBox.width || !trayBox.height) return;
    const trayCols = Math.min(3, shards.length);
    const trayRows = Math.ceil(shards.length / trayCols);
    const col = index % trayCols;
    const row = Math.floor(index / trayCols);
    const cellW = trayBox.width / trayCols;
    const cellH = trayBox.height / trayRows;
    const pieceW = shard.box.w / SIZE * matBox.width;
    const pieceH = shard.box.h / SIZE * matBox.height;
    const pad = 10;
    shard.scale = Math.min(1, (cellW - pad) / pieceW, (cellH - pad) / pieceH);
    const tx = (trayBox.left - matBox.left) + (col + 0.5) * cellW;
    const ty = (trayBox.top - matBox.top) + (row + 0.5) * cellH;
    shard.x = tx - shard.cx * matBox.width;
    shard.y = ty - shard.cy * matBox.height;
    paint(shard);
  }

  function keepOnStage(shard) {
    const stage = root.querySelector('.puzzle-stage')?.getBoundingClientRect();
    const matBox = mat.getBoundingClientRect();
    if (!stage?.width || !matBox.width) return;
    const scale = shard.locked ? 1 : (shard.scale || 1);
    const pieceW = shard.box.w / SIZE * matBox.width * scale;
    const pieceH = shard.box.h / SIZE * matBox.height * scale;
    const centerX = matBox.left + shard.cx * matBox.width + shard.x;
    const centerY = matBox.top + shard.cy * matBox.height + shard.y;
    const minX = stage.left + pieceW / 2 + 4;
    const maxX = stage.right - pieceW / 2 - 4;
    const minY = stage.top + pieceH / 2 + 4;
    const maxY = stage.bottom - pieceH / 2 - 4;
    const nextX = Math.min(Math.max(centerX, Math.min(minX, maxX)), Math.max(minX, maxX));
    const nextY = Math.min(Math.max(centerY, Math.min(minY, maxY)), Math.max(minY, maxY));
    shard.x += nextX - centerX;
    shard.y += nextY - centerY;
  }

  function layout() {
    shards.forEach((shard, index) => {
      if (shard.locked) { paint(shard); return; }
      if (shard.dragging) return;
      tray(shard, index);
    });
  }

  function pointerDown(event) {
    const shard = shards.find(item => item.el === event.currentTarget);
    if (!shard || shard.locked || reported) return;
    shard.dragging = true;
    shard.el.classList.add('dragging');
    try { shard.el.setPointerCapture?.(event.pointerId); } catch { /* pointer already released */ }
    shard.grabX = event.clientX - shard.x;
    shard.grabY = event.clientY - shard.y;
  }

  function pointerMove(event) {
    const shard = shards.find(item => item.el === event.currentTarget);
    if (!shard?.dragging) return;
    shard.x = event.clientX - shard.grabX;
    shard.y = event.clientY - shard.grabY;
    keepOnStage(shard);
    paint(shard);
    if (nearHome(shard)) lock(shard);
  }

  function pointerUp(event) {
    const shard = shards.find(item => item.el === event.currentTarget);
    if (!shard || shard.locked) return;
    shard.dragging = false;
    shard.el.classList.remove('dragging');
    if (nearHome(shard)) lock(shard);
  }

  function keyMove(event) {
    const shard = shards.find(item => item.el === event.currentTarget);
    if (!shard || shard.locked || reported) return;
    const step = 18;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[event.key]) {
      event.preventDefault();
      shard.x += moves[event.key][0];
      shard.y += moves[event.key][1];
      keepOnStage(shard);
      paint(shard);
      if (nearHome(shard)) lock(shard);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (nearHome(shard)) lock(shard);
    }
  }

  shards.forEach(shard => {
    shard.el.addEventListener('pointerdown', pointerDown);
    shard.el.addEventListener('pointermove', pointerMove);
    shard.el.addEventListener('pointerup', pointerUp);
    shard.el.addEventListener('pointercancel', pointerUp);
    shard.el.addEventListener('keydown', keyMove);
  });
  const observer = new ResizeObserver(layout);
  observer.observe(root.querySelector('.puzzle-stage'));
  requestAnimationFrame(layout);

  const api = {
    destroy() {
      observer.disconnect();
      shards.forEach(shard => {
        shard.el.removeEventListener('pointerdown', pointerDown);
        shard.el.removeEventListener('pointermove', pointerMove);
        shard.el.removeEventListener('pointerup', pointerUp);
        shard.el.removeEventListener('pointercancel', pointerUp);
        shard.el.removeEventListener('keydown', keyMove);
      });
      root.replaceChildren();
      if (active === api) active = null;
    }
  };
  active = api;
  return api;
}
