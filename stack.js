/**
 * Stacker — a row of blocks slides across the tower. Tap to drop it.
 * Blocks that hang off the row below fall away. A total miss costs a try.
 * With questions on, the block that lands on the tower is the answer.
 * The slide, the trim, and the faster rows follow the pure CSS stacker.
 * These blocks and the questions are drawn here.
 */
import { questionHolding } from './hold.js?v=ask-first';
import { stackCycle, stackLand, stackPick, stackRowWidth, stackStops, stackStopsArcade } from './logic.mjs?v=stacker';

const ACTIVE = '#fabc7f';
const CELL = '#233f5a';
const EDGE = '#2f5d83';
const MARK = '#2e5680';

let active = null;

export function stopStack() {
  active?.destroy();
  active = null;
}

function call(fn, arg) {
  try { return fn?.(arg); }
  catch { return undefined; }
}

function ink(fill) {
  if (!fill || fill[0] !== '#' || fill.length < 7) return '#172031';
  const r = parseInt(fill.slice(1, 3), 16);
  const g = parseInt(fill.slice(3, 5), 16);
  const b = parseInt(fill.slice(5, 7), 16);
  return r * 0.3 + g * 0.59 + b * 0.11 > 170 ? '#172031' : '#fffaf0';
}

function fitFont(ctx, text, maxWidth, maxSize = 18) {
  let size = Math.max(11, maxSize);
  ctx.font = `700 ${size}px Outfit, sans-serif`;
  while (size > 11 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `700 ${size}px Outfit, sans-serif`;
  }
  return size;
}

function textWidth(ctx, text, size) {
  ctx.font = `700 ${size}px Outfit, sans-serif`;
  return ctx.measureText(text).width;
}

function drawShape(ctx, shape, x, y, s, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill || '#172031';
  ctx.beginPath();
  const k = s * 0.26;
  if (shape === 'circle' || shape === 'oval') ctx.ellipse(0, 0, k, shape === 'oval' ? k * 0.68 : k, 0, 0, Math.PI * 2);
  else if (shape === 'triangle') { ctx.moveTo(0, -k); ctx.lineTo(k, k * 0.75); ctx.lineTo(-k, k * 0.75); ctx.closePath(); }
  else if (shape === 'diamond') { ctx.moveTo(0, -k); ctx.lineTo(k, 0); ctx.lineTo(0, k); ctx.lineTo(-k, 0); ctx.closePath(); }
  else if (shape === 'star' || shape === 'hexagon') ctx.arc(0, 0, k * 0.85, 0, Math.PI * 2);
  else ctx.rect(-k, -k * 0.7, k * 2, k * 1.4);
  ctx.fill();
  ctx.restore();
}

function plainBlocks(width) {
  return Array.from({ length: width }, () => ({ label: '', fill: ACTIVE }));
}

export function mountStack(root, { board = {}, reduced, freePlay, nextQuestion, onPrompt, onMiss, onClear, onLives, onOver, onFinished } = {}) {
  stopStack();
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

  const cols = board.cols || 7;
  const spec = {
    choices: board.choices || 3,
    lives: board.lives || 4,
    rows: board.rows || 10,
    cycle: (board.cycle || 2500) * (reduced ? 2.2 : 1)
  };
  const pedestal = Math.floor((cols - 1) / 2);
  const host = document.createElement('div');
  host.className = 'arcade stack-play';
  host.innerHTML = `<div class="stack" role="application" aria-label="Tap to drop the blocks onto the tower."><canvas></canvas><button type="button" class="stack-drop" aria-label="Drop the blocks"></button></div>`;
  root.replaceChildren(host);
  const stage = host.querySelector('.stack');
  const canvas = stage.querySelector('canvas');
  const button = stage.querySelector('.stack-drop');
  const ctx = canvas.getContext('2d');

  let lives = spec.lives;
  let placed = [];
  let mover = null;
  let current = [];
  let falls = [];
  let phase = 'play';
  let pause = 0;
  let slipped = false;
  let stops = [0];
  let stopIndex = 0;
  let dir = 1;
  let wait = 0;
  let pending = null;
  let banner = '';
  let last = 0;

  const gridRows = () => (freePlay ? spec.rows : spec.rows + 1);
  const moverRow = () => (freePlay ? placed.length : placed.length + 1);
  const stepDuration = () => {
    const cycle = stackCycle(spec.cycle, placed.length);
    const span = Math.max(1, (stops.length - 1) * 2);
    return cycle / span;
  };
  const arm = blocks => {
    current = blocks;
    mover = { width: blocks.length, blocks, left: 0 };
    stops = freePlay ? stackStopsArcade(blocks.length, cols) : stackStops(pedestal, blocks.length);
    stopIndex = 0;
    dir = 1;
    mover.left = stops[0] ?? 0;
    wait = stepDuration();
  };
  const shake = () => {
    stage.classList.remove('shake');
    void stage.offsetWidth;
    stage.classList.add('shake');
  };
  const begin = () => {
    if (freePlay) {
      const row = placed.length;
      const width = row === 0 ? stackRowWidth(0) : Math.min(stackRowWidth(row), placed[placed.length - 1].width);
      if (width <= 0) {
        phase = 'over';
        pause = reduced ? 0.2 : 0.5;
        return;
      }
      arm(plainBlocks(width));
      phase = 'play';
      call(onLives, lives);
      return;
    }
    const pack = call(nextQuestion);
    if (!pack?.choices?.length) {
      phase = 'done';
      call(onFinished);
      return;
    }
    slipped = false;
    arm(pack.choices.map(choice => ({
      label: choice.shape ? '' : String(choice.label ?? ''),
      shape: choice.shape || '',
      fill: choice.fill || ACTIVE,
      ok: !!choice.ok
    })));
    phase = 'play';
    call(onLives, lives);
    call(onPrompt);
  };
  const fallingFrom = (blocks, left, row, keep) => blocks.map((block, i) => ({
    ...block,
    col: left + i,
    row,
    dy: 0
  })).filter(block => !keep?.(block.col));
  const drop = () => {
    if (session.dead || phase !== 'play' || !mover || questionHolding()) return;
    const left = mover.left;
    const blocks = mover.blocks;
    const width = mover.width;
    const row = moverRow();
    mover = null;
    if (freePlay) {
      if (!placed.length) {
        placed.push({ left, width, blocks });
        pending = { kind: placed.length >= spec.rows ? 'tower' : 'locked' };
        falls = [];
      } else {
        const prev = placed[placed.length - 1];
        const land = stackLand(prev.left, prev.width, left, width);
        const keep = col => land.ok && col >= land.left && col < land.left + land.width;
        falls = fallingFrom(blocks, left, row, keep);
        if (land.ok) {
          const start = land.left - left;
          placed.push({ left: land.left, width: land.width, blocks: blocks.slice(start, start + land.width) });
          pending = { kind: placed.length >= spec.rows ? 'tower' : 'locked' };
        } else {
          pending = { kind: 'life' };
          shake();
        }
      }
    } else {
      const index = stackPick(left, width, pedestal);
      const choice = index >= 0 ? blocks[index] : null;
      if (!choice) {
        falls = fallingFrom(blocks, left, row);
        pending = { kind: 'life' };
        shake();
      } else if (!choice.ok) {
        falls = fallingFrom(blocks, left, row);
        pending = { kind: 'wrong' };
        slipped = true;
        shake();
      } else {
        falls = fallingFrom(blocks, left, row, col => col === pedestal);
        placed.push({ left: pedestal, width: 1, blocks: [choice] });
        pending = { kind: placed.length >= spec.rows ? 'tower' : 'score' };
      }
    }
    phase = 'fall';
    pause = reduced ? 0.16 : (falls.length ? 0.42 : 0.16);
  };
  const resume = () => {
    if (current.length) arm(current);
    phase = 'play';
  };
  const resolve = () => {
    const next = pending;
    pending = null;
    falls = [];
    stage.classList.remove('shake');
    if (!next) { resume(); return; }
    if (next.kind === 'life') {
      lives -= 1;
      call(onLives, Math.max(0, lives));
      call(onMiss, 'miss');
      if (lives <= 0) {
        phase = 'over';
        banner = 'Game over';
        pause = reduced ? 0.2 : 0.55;
        return;
      }
      resume();
      return;
    }
    if (next.kind === 'wrong') {
      call(onMiss, 'block');
      resume();
      return;
    }
    if (next.kind === 'score') {
      call(onClear, !slipped);
      begin();
      return;
    }
    if (next.kind === 'tower') {
      if (!freePlay) call(onClear, !slipped);
      phase = 'win';
      banner = 'Nice stack!';
      pause = reduced ? 0.25 : 0.7;
      return;
    }
    begin();
  };

  const labelsNow = () => {
    const labels = [];
    const take = blocks => blocks?.forEach(block => { if (block.label) labels.push(block.label); });
    take(current);
    placed.forEach(row => take(row.blocks));
    falls.forEach(block => { if (block.label) labels.push(block.label); });
    return labels;
  };
  const columnSpan = () => {
    let min = 0;
    let max = cols - 1;
    const width = Math.max(1, mover?.width || current.length || 1);
    if (!freePlay) {
      stackStops(pedestal, width).forEach(left => {
        min = Math.min(min, left);
        max = Math.max(max, left + width - 1);
      });
    }
    return { min, count: max - min + 1 };
  };
  const layout = (w, h) => {
    const rows = gridRows();
    const lifeBand = 18;
    const margin = 14;
    const innerW = w - margin * 2;
    const innerH = h - margin * 2 - lifeBand;
    const span = columnSpan();
    const square = Math.min(innerW / cols, innerH / rows);
    const word = labelsNow().reduce((best, label) => label.length > best.length ? label : best, '');
    const needed = word ? textWidth(ctx, word, 22) / 0.86 + square * 0.2 : square;
    const cellW = Math.min(innerW / span.count, Math.max(square, needed));
    const cellH = square;
    const gridW = cellW * span.count;
    const gridH = cellH * rows;
    return {
      cellW,
      cellH,
      rows,
      minCol: span.min,
      ox: (w - gridW) / 2,
      oy: lifeBand + (h - lifeBand - gridH) / 2
    };
  };
  const cellBox = (box, col, row) => {
    const inset = Math.min(box.cellW, box.cellH) * 0.12;
    const x = box.ox + (col - box.minCol) * box.cellW + inset;
    const y = box.oy + (box.rows - 1 - row) * box.cellH + inset;
    return { x, y, w: box.cellW - inset * 2, h: box.cellH - inset * 2 };
  };
  const paintBlock = (box, col, row, block, dy = 0) => {
    const spot = cellBox(box, col, row);
    const y = spot.y + dy;
    ctx.fillStyle = block.fill || ACTIVE;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(spot.x, y, spot.w, spot.h, 6);
    else ctx.rect(spot.x, y, spot.w, spot.h);
    ctx.fill();
    if (block.shape) drawShape(ctx, block.shape, spot.x + spot.w / 2, y + spot.h / 2, Math.min(spot.w, spot.h), ink(block.fill || ACTIVE));
    else if (block.label) {
      ctx.fillStyle = ink(block.fill || ACTIVE);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fitFont(ctx, block.label, spot.w * 0.9, Math.min(26, spot.h * 0.58));
      ctx.fillText(block.label, spot.x + spot.w / 2, y + spot.h / 2);
    }
  };
  const draw = (w, h) => {
    const box = layout(w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = EDGE;
    ctx.lineWidth = 6;
    ctx.strokeRect(box.ox - 8, box.oy - 8, box.cellW * columnSpan().count + 16, box.cellH * box.rows + 16);
    for (let r = 0; r < box.rows; r++) {
      for (let c = 0; c < cols; c++) {
        const spot = cellBox(box, c, r);
        const landing = !freePlay && phase === 'play' && c === pedestal && r === moverRow();
        ctx.fillStyle = landing ? MARK : CELL;
        ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
      }
    }
    if (!freePlay) paintBlock(box, pedestal, 0, { fill: '#c9854a' });
    placed.forEach((row, r) => {
      const visual = freePlay ? r : r + 1;
      row.blocks.forEach((block, i) => paintBlock(box, row.left + i, visual, block));
    });
    if (mover && phase === 'play') {
      mover.blocks.forEach((block, i) => paintBlock(box, mover.left + i, moverRow(), block));
    }
    falls.forEach(block => paintBlock(box, block.col, block.row, block, block.dy || 0));
    for (let i = 0; i < Math.max(0, lives); i++) {
      ctx.fillStyle = '#fa7f7f';
      ctx.fillRect(box.ox + i * 14, 4, 9, 9);
    }
    if (banner && (phase === 'win' || phase === 'over')) {
      ctx.fillStyle = '#fffaf0';
      ctx.font = '700 26px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(banner, w / 2, box.oy + box.cellH * box.rows / 2);
    }
  };

  const frame = now => {
    if (session.dead) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (phase === 'fall') falls.forEach(block => { block.dy = (block.dy || 0) + dt * (reduced ? 40 : 280); });
    if (pause > 0) {
      pause -= dt;
      if (pause <= 0) {
        pause = 0;
        if (phase === 'fall') resolve();
        else if (phase === 'over') {
          phase = 'done';
          banner = '';
          call(onOver);
        } else if (phase === 'win') {
          placed = [];
          banner = '';
          begin();
        }
      }
    } else if (phase === 'play' && mover && !questionHolding()) {
      wait -= dt * 1000;
      if (wait <= 0) {
        if (stops.length > 1) {
          const next = stopIndex + dir;
          if (next >= stops.length || next < 0) dir *= -1;
          else stopIndex = next;
          mover.left = stops[stopIndex];
        }
        wait = stepDuration();
      }
    }
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(220, rect.width || 320);
    const h = Math.max(260, rect.height || 420);
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
  const onKey = e => {
    if (document.querySelector('dialog[open]') || typing(e)) return;
    if (e.key !== ' ' && e.key !== 'Enter') return;
    if (e.repeat) return;
    e.preventDefault();
    drop();
  };
  const onPointer = e => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    drop();
  };
  document.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', onPointer);
  button.addEventListener('pointerdown', onPointer);
  session.cleanups.push(() => {
    document.removeEventListener('keydown', onKey);
    canvas.removeEventListener('pointerdown', onPointer);
    button.removeEventListener('pointerdown', onPointer);
  });

  begin();
  session.raf = requestAnimationFrame(frame);
}
