/**
 * Mole pop — moles peek out of staggered holes. Tap the one with the answer.
 * The holes, the short peek, and the empty-hole miss follow the pure CSS mole pen.
 * These moles and the questions are drawn here.
 */
import { questionHolding } from './hold.js?v=ask-first';
import { moleHoles, molePick, moleSprite } from './logic.mjs?v=mole-pop';

const VIEW_W = 520;
const VIEW_H = 560;

let active = null;

export function stopMole() {
  active?.destroy();
  active = null;
}

function call(fn, arg) {
  try { return fn?.(arg); }
  catch { return undefined; }
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function roundBox(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function fitLabel(ctx, text, maxWidth, start) {
  let size = start;
  ctx.font = `700 ${size}px Outfit, sans-serif`;
  while (size > 11 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `700 ${size}px Outfit, sans-serif`;
  }
  return size;
}

function drawMark(ctx, shape, fill, s) {
  ctx.fillStyle = fill || '#5d7a45';
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
  } else ctx.rect(-s, -s * 0.7, s * 2, s * 1.4);
  ctx.fill();
}

function drawHeart(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#e15b4a';
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(-s * 0.55, -s * 0.25, -s, s * 0.25, 0, s);
  ctx.bezierCurveTo(s, s * 0.25, s * 0.55, -s * 0.25, 0, s * 0.3);
  ctx.fill();
  ctx.restore();
}

function drawMound(ctx, hole) {
  ctx.fillStyle = '#a56b3c';
  ctx.beginPath();
  ctx.ellipse(hole.x, hole.y + 16, 62, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c4894e';
  ctx.beginPath();
  ctx.ellipse(hole.x, hole.y + 12, 48, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2c1b10';
  ctx.beginPath();
  ctx.ellipse(hole.x, hole.y, 40, 16, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawLip(ctx, hole) {
  ctx.fillStyle = '#8d5a32';
  ctx.beginPath();
  ctx.ellipse(hole.x, hole.y + 8, 42, 14, 0, 0, Math.PI);
  ctx.fill();
}

function drawMole(ctx, mole, hole) {
  const sprite = moleSprite(hole, mole.rise);
  const bonk = mole.phase === 'bonk';
  ctx.save();
  ctx.translate(sprite.x, sprite.y);
  ctx.scale(bonk ? 1.08 : 1, bonk ? 0.86 : 1);
  ctx.fillStyle = '#6b3e22';
  ctx.beginPath();
  ctx.ellipse(-22, -26, 10, 13, -0.4, 0, Math.PI * 2);
  ctx.ellipse(22, -26, 10, 13, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0b7b0';
  ctx.beginPath();
  ctx.ellipse(-22, -24, 5, 7, -0.4, 0, Math.PI * 2);
  ctx.ellipse(22, -24, 5, 7, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8d5a34';
  ctx.beginPath();
  ctx.ellipse(0, 2, 32, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = mole.fill || '#f3d7b0';
  ctx.beginPath();
  ctx.ellipse(0, 10, 16, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fffaf3';
  ctx.beginPath();
  ctx.arc(-12, -4, 7, 0, Math.PI * 2);
  ctx.arc(12, -4, 7, 0, Math.PI * 2);
  ctx.fill();
  if (bonk) {
    ctx.strokeStyle = '#2a1c12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, -8);
    ctx.lineTo(-8, 0);
    ctx.moveTo(-8, -8);
    ctx.lineTo(-16, 0);
    ctx.moveTo(8, -8);
    ctx.lineTo(16, 0);
    ctx.moveTo(16, -8);
    ctx.lineTo(8, 0);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#2a1c12';
    ctx.beginPath();
    ctx.arc(-11, -3, 3.2, 0, Math.PI * 2);
    ctx.arc(13, -3, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e07a86';
  ctx.beginPath();
  ctx.ellipse(0, 8, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fffaf3';
  ctx.fillRect(-5, 12, 4, 6);
  ctx.fillRect(1, 12, 4, 6);
  ctx.restore();

  if (mole.rise < 0.72) return;
  ctx.save();
  ctx.translate(sprite.x, sprite.y - 50);
  const w = 84;
  const h = mole.shape ? 40 : 30;
  roundBox(ctx, -w / 2, -h / 2, w, h, 8);
  ctx.fillStyle = '#fff8ee';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#6b4423';
  ctx.stroke();
  if (mole.shape) {
    ctx.save();
    ctx.translate(0, -8);
    drawMark(ctx, mole.shape, '#32634e', 7);
    ctx.restore();
  }
  fitLabel(ctx, mole.label, 74, mole.shape ? 12 : 16);
  ctx.fillStyle = '#3d2918';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mole.label, 0, mole.shape ? 8 : 0);
  ctx.restore();
}

export function mountMole(root, { board = {}, reduced, nextQuestion, onPrompt, onLives, onMiss, onClear, onOver, onFinished } = {}) {
  stopMole();
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

  const spec = {
    holes: board.holes || 3,
    lives: board.lives || 5,
    up: Math.max(400, board.up || 1400) / 1000 * (reduced ? 1.35 : 1),
    gap: Math.max(160, board.gap || 400) / 1000 * (reduced ? 1.2 : 1)
  };
  const riseTime = reduced ? 0.12 : 0.2;
  const duckTime = reduced ? 0.1 : 0.16;
  const host = document.createElement('div');
  host.className = 'arcade mole-play';
  host.innerHTML = `<div class="mole" role="application" aria-label="Tap the mole with the right answer before it hides."><canvas></canvas></div>`;
  root.replaceChildren(host);
  const stage = host.querySelector('.mole');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const flowers = [
    { x: 48, y: 250, c: '#f2d26a' },
    { x: 470, y: 270, c: '#f0a0b0' },
    { x: 36, y: 470, c: '#f0a0b0' },
    { x: 486, y: 450, c: '#f2d26a' }
  ];
  let spots = moleHoles(spec.holes, VIEW_W, VIEW_H);
  let actors = spots.map(() => null);
  let queue = [];
  let puffs = [];
  let view = { scale: 1, ox: 0, oy: 0, dpr: 1 };
  let lives = spec.lives;
  let livePack = null;
  let slipped = false;
  let resolving = false;
  let replay = false;
  let wait = 0;
  let over = false;
  let overAt = 0;
  let overSent = false;
  let ending = false;
  let clock = 0;
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
  const shake = () => {
    if (reduced) return;
    stage.classList.remove('shake');
    void stage.offsetWidth;
    stage.classList.add('shake');
  };
  const beginWave = isReplay => {
    if (session.dead || ending || over) return;
    if (!isReplay) {
      const pack = call(nextQuestion);
      if (!pack?.choices?.length) {
        ending = true;
        call(onFinished);
        return;
      }
      livePack = pack;
      slipped = false;
      call(onPrompt);
    }
    if (!livePack?.choices?.length) return;
    const count = Math.max(spec.holes, livePack.choices.length);
    spots = moleHoles(count, VIEW_W, VIEW_H);
    actors = spots.map(() => null);
    const order = shuffle(spots.map((_, index) => index));
    queue = [];
    livePack.choices.forEach((choice, i) => {
      queue.push({ choice, index: order[i % order.length], at: clock + i * spec.gap });
    });
    resolving = false;
  };
  const dropLife = () => {
    if (resolving || ending || over) return;
    resolving = true;
    replay = true;
    slipped = true;
    lives = Math.max(0, lives - 1);
    queue = [];
    actors = actors.map(() => null);
    shake();
    call(onLives, lives);
    call(onMiss, 'hide');
    if (session.dead || ending) return;
    if (lives <= 0) {
      over = true;
      overAt = performance.now();
      return;
    }
    wait = reduced ? 0.35 : 0.55;
  };
  const whack = index => {
    const mole = actors[index];
    if (!mole || mole.hit || resolving || over || ending) return;
    if (mole.phase === 'duck' || mole.phase === 'bonk') return;
    mole.hit = true;
    mole.phase = 'bonk';
    mole.age = 0;
    mole.rise = 1;
    if (!mole.choice.ok) {
      slipped = true;
      shake();
      call(onMiss, 'wrong');
      return;
    }
    resolving = true;
    replay = false;
    queue = [];
    actors.forEach(other => {
      if (other && other !== mole && other.phase !== 'bonk') {
        other.phase = 'duck';
        other.age = 0;
      }
    });
    call(onClear, !slipped);
    if (session.dead || ending) return;
    wait = reduced ? 0.28 : 0.42;
  };
  const dirt = hole => {
    if (resolving || over || ending || wait > 0) return;
    const live = actors.some(mole => mole && mole.rise >= 0.45 && !mole.hit);
    if (!live) return;
    puffs.push({ x: hole.x, y: hole.y, age: 0 });
    slipped = true;
    shake();
    call(onMiss, 'dirt');
  };
  const pointer = event => {
    if (session.dead || over || ending || !view.scale) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - view.ox) / view.scale;
    const y = (event.clientY - rect.top - view.oy) / view.scale;
    const rises = actors.map(mole => mole?.rise || 0);
    const hit = molePick({ x, y }, spots, rises);
    if (!hit) return;
    if (hit.kind === 'mole') whack(hit.index);
    else dirt(spots[hit.index]);
  };
  const updateMole = (mole, index, dt) => {
    mole.age += dt;
    if (mole.phase === 'rise') {
      mole.rise = Math.min(1, mole.age / riseTime);
      if (mole.rise >= 1) {
        mole.phase = 'up';
        mole.age = 0;
      }
      return;
    }
    if (mole.phase === 'up') {
      mole.rise = 1;
      if (mole.age >= spec.up) {
        mole.phase = 'duck';
        mole.age = 0;
      }
      return;
    }
    if (mole.phase === 'bonk') {
      mole.rise = 1;
      if (mole.age > 0.22) {
        mole.phase = 'duck';
        mole.age = 0;
      }
      return;
    }
    mole.rise = 1 - Math.min(1, mole.age / duckTime);
    if (mole.rise > 0) return;
    const missed = mole.choice.ok && !mole.hit;
    actors[index] = null;
    if (missed) dropLife();
  };

  const draw = () => {
    fit();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.dpr * view.scale, 0, 0, view.dpr * view.scale, view.dpr * view.ox, view.dpr * view.oy);
    ctx.fillStyle = '#b7ddf2';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#fffaf3';
    ctx.beginPath();
    ctx.ellipse(90, 78, 36, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(120, 84, 28, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(390, 64, 40, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8fbe62';
    ctx.beginPath();
    ctx.moveTo(0, 210);
    ctx.quadraticCurveTo(VIEW_W / 2, 150, VIEW_W, 220);
    ctx.lineTo(VIEW_W, VIEW_H);
    ctx.lineTo(0, VIEW_H);
    ctx.fill();
    ctx.fillStyle = '#6fa34a';
    ctx.fillRect(0, 390, VIEW_W, VIEW_H - 390);
    flowers.forEach(flower => {
      ctx.fillStyle = '#3e7a32';
      ctx.fillRect(flower.x - 2, flower.y, 4, 16);
      ctx.fillStyle = flower.c;
      ctx.beginPath();
      ctx.arc(flower.x, flower.y, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    spots.forEach(hole => drawMound(ctx, hole));
    const depth = spots.map((_, index) => index).sort((a, b) => spots[a].y - spots[b].y);
    depth.forEach(index => {
      const mole = actors[index];
      if (mole && mole.rise > 0.02) drawMole(ctx, mole, spots[index]);
    });
    spots.forEach(hole => drawLip(ctx, hole));
    puffs.forEach(puff => {
      const fade = 1 - puff.age / 0.4;
      ctx.fillStyle = `rgba(92, 58, 32, ${0.45 * fade})`;
      ctx.beginPath();
      ctx.arc(puff.x - 10, puff.y - puff.age * 40, 4, 0, Math.PI * 2);
      ctx.arc(puff.x + 8, puff.y - 6 - puff.age * 50, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    for (let i = 0; i < lives; i++) drawHeart(ctx, VIEW_W - 28 - i * 22, 28, 8);
    if (!over) return;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 36px Outfit, sans-serif';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#3d2918';
    ctx.strokeText('The moles hid', VIEW_W / 2, 250);
    ctx.fillStyle = '#fff8ee';
    ctx.fillText('The moles hid', VIEW_W / 2, 250);
  };
  const frame = now => {
    if (session.dead) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (!over && !ending && !questionHolding()) {
      clock += dt;
      for (let i = actors.length - 1; i >= 0; i--) {
        if (actors[i]) updateMole(actors[i], i, dt);
      }
      puffs = puffs.filter(puff => {
        puff.age += dt;
        return puff.age < 0.4;
      });
      if (wait > 0) {
        wait -= dt;
        if (wait <= 0) {
          wait = 0;
          beginWave(replay);
        }
      } else if (!resolving) {
        queue = queue.filter(item => {
          if (clock < item.at || actors[item.index]) return true;
          actors[item.index] = {
            choice: item.choice,
            label: String(item.choice.label),
            shape: item.choice.shape || '',
            fill: item.choice.fill || '',
            phase: 'rise',
            age: 0,
            rise: 0,
            hit: false
          };
          return false;
        });
      }
    }
    draw();
    if (over && !overSent && now - overAt > 1100) {
      overSent = true;
      call(onOver);
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
  call(onLives, lives);
  beginWave(false);
  session.raf = requestAnimationFrame(frame);
}
