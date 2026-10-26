/**
 * Sprout hop — bounce up the leaves and land on the answer.
 * The hop matches the doodle-jump pen (400×600, 60fps): a fixed
 * bounce of 10px/frame, gravity of 0.2px/frame², a steady 4px/frame
 * sideways while a direction is held, and wrap at the sides. Once the
 * sprout is above the pen's line, leaves scroll down at 3px/frame and
 * gravity picks up by 0.25. Wrong answers break. Springs and sliding
 * leaves show up on higher levels. This sprout and these leaves are drawn here.
 */
import { questionHolding } from './hold.js?v=ask-first';

let active = null;

export function stopHop() {
  active?.destroy();
  active = null;
}

function fitLabel(ctx, text, maxWidth) {
  let size = 16;
  const font = px => `700 ${px}px Outfit, sans-serif`;
  ctx.font = font(size);
  while (size > 9 && ctx.measureText(text).width > maxWidth) {
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

function drawSprout(ctx, x, y, w, h, face, rising) {
  ctx.save();
  ctx.translate(x + w / 2, y + h * 0.62);
  ctx.scale(face === 'left' ? -1 : 1, rising ? 0.82 : 1);
  const r = Math.min(w, h) * 0.62;
  ctx.fillStyle = '#f8ce6c';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.72, r * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a6a12';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#7f9f62';
  ctx.beginPath();
  ctx.ellipse(r * 0.15, -r * 0.85, r * 0.42, r * 0.2, -0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#244b3d';
  ctx.beginPath();
  ctx.arc(-r * 0.22, -r * 0.02, r * 0.09, 0, Math.PI * 2);
  ctx.arc(r * 0.18, -r * 0.02, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMark(ctx, plat, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = plat.fill || '#5d7a45';
  const k = s * 0.42;
  ctx.beginPath();
  if (plat.shape === 'circle' || plat.shape === 'oval') ctx.ellipse(0, 0, k, plat.shape === 'oval' ? k * 0.68 : k, 0, 0, Math.PI * 2);
  else if (plat.shape === 'triangle') { ctx.moveTo(0, -k); ctx.lineTo(k, k * 0.75); ctx.lineTo(-k, k * 0.75); ctx.closePath(); }
  else if (plat.shape === 'diamond') { ctx.moveTo(0, -k); ctx.lineTo(k, 0); ctx.lineTo(0, k); ctx.lineTo(-k, 0); ctx.closePath(); }
  else if (plat.shape === 'star') ctx.arc(0, 0, k * 0.72, 0, Math.PI * 2);
  else if (plat.shape === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI / 3;
      const px = Math.cos(a) * k;
      const py = Math.sin(a) * k;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
  } else if (plat.shape) ctx.rect(-k, -k * 0.7, k * 2, k * 1.4);
  else ctx.arc(0, 0, k * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function mountHop(root, { board = {}, reduced, nextQuestion, onPrompt, onMiss, onClear, onFinished }) {
  stopHop();
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

  const calm = reduced ? 0.78 : 1;
  root.innerHTML = `<div class="hop-play"><div class="hop" role="application" aria-label="Bounce up the leaves. Hop on the right answer."><canvas></canvas></div><div class="steer"><button type="button" class="steer-btn" data-dir="left" aria-label="Move left">←</button><button type="button" class="steer-btn" data-dir="right" aria-label="Move right">→</button></div></div>`;
  const stage = root.querySelector('.hop');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const held = new Set();
  const platforms = [];
  const bits = [];
  const clouds = Array.from({ length: 5 }, (_, i) => ({ x: 24 + i * 70, y: 36 + (i % 3) * 90, w: 46 + (i % 3) * 14 }));
  const player = { x: 0, y: 0, w: 42, h: 32, vx: 0, vy: 0, face: 'right' };
  let play = null;
  let gap = 120;
  let gravity = 720;
  let jumpV = 600;
  let springV = 1200;
  let springH = 26;
  let scrollV = 180;
  let boostG = 900;
  let xSpeed = 240;
  let scrolling = false;
  let width = 360;
  let height = 420;
  let lastBrittle = false;
  let cooldown = 3;
  let questionLive = false;
  let questionY = 0;
  let livePack = null;
  let slipped = false;
  let pause = 0;
  let ending = false;
  let climbed = false;
  let prompted = false;
  let promptIn = 0;
  let last = 0;
  const call = (fn, arg) => {
    try { return fn?.(arg); }
    catch { return undefined; }
  };

  const tune = () => {
    const unit = play.h / 600;
    const unitX = play.w / 400;
    gap = play.h / 5;
    gravity = 720 * unit * calm;
    jumpV = 600 * unit * calm;
    springV = jumpV * 2;
    springH = 28 * unit;
    scrollV = 180 * unit * calm;
    boostG = 900 * unit * calm;
    xSpeed = 240 * unitX * calm;
  };
  const leafW = () => Math.max(48 * play.scale, (board.width || 86) * (play.w / 422));
  const leafH = () => Math.max(11, 15 * play.scale);
  const highest = () => {
    let top = play.h;
    platforms.forEach(plat => { if (!plat.dead && plat.y < top) top = plat.y; });
    return top;
  };
  const reap = () => {
    for (let i = platforms.length - 1; i >= 0; i--) if (platforms[i].dead) platforms.splice(i, 1);
  };
  const shatter = plat => {
    const mid = plat.x + plat.w / 2;
    const kick = 70 * play.scale;
    bits.push(
      { x: plat.x, y: plat.y, w: plat.w / 2, h: plat.h, vx: -kick, vy: -40 * play.scale },
      { x: mid, y: plat.y, w: plat.w / 2, h: plat.h, vx: kick, vy: -16 * play.scale }
    );
    plat.dead = true;
  };
  const shake = () => {
    stage.classList.add('shake');
    const timer = setTimeout(() => stage.classList.remove('shake'), 280);
    session.cleanups.push(() => clearTimeout(timer));
  };
  const placeQuestion = (y, fresh) => {
    if (!livePack?.choices?.length) return false;
    if (fresh) slipped = false;
    const list = livePack.choices;
    const h = Math.max(leafH(), 28 * (play.h / 600));
    const hole = player.w + 36 * play.scale;
    const leftCount = Math.ceil(list.length / 2);
    const rightCount = list.length - leftCount;
    const side = (play.w - hole) / 2;
    const span = Math.max(40, side - 10);
    list.forEach((choice, i) => {
      const onLeft = i < leftCount;
      const count = onLeft ? leftCount : rightCount;
      const index = onLeft ? i : i - leftCount;
      const w = Math.max(36 * play.scale, Math.min(leafW(), (span - 8 * (count - 1)) / count));
      const x = (onLeft ? 8 : play.w - side) + index * (w + 8);
      platforms.push({
        kind: 'choice',
        x, y, w, h,
        minX: x, maxX: x,
        vx: 0,
        label: String(choice.label),
        ok: !!choice.ok,
        fill: choice.fill || '',
        shape: choice.shape || '',
        spring: false,
        sprung: false,
        dead: false
      });
    });
    questionLive = true;
    questionY = y;
    if (!prompted) {
      prompted = true;
      call(onPrompt);
    } else promptIn = reduced ? 0.45 : 0.8;
    return true;
  };
  const spawnFiller = y => {
    const w = leafW();
    const h = leafH();
    const pad = Math.max(8, 15 * (play.w / 400));
    const x = pad + Math.random() * Math.max(0, play.w - w - pad * 2);
    const near = !questionLive && cooldown <= 2;
    const slideSpeed = (52 + ((board.choices || 3) - 3) * 16) * play.scale * calm;
    let kind = 'leaf';
    let vx = 0;
    if ((board.choices || 3) >= 4 && !near && Math.random() < 0.45) {
      kind = 'slide';
      vx = Math.random() < 0.5 ? -slideSpeed : slideSpeed;
    }
    if ((board.drift || 0) > 0 && !near && !lastBrittle && Math.random() < 0.22) {
      kind = 'brittle';
      vx = 0;
    }
    lastBrittle = kind === 'brittle';
    const spring = kind === 'leaf' && (board.drift || 0) > 0 && !near && Math.random() < 0.2;
    platforms.push({
      kind, x, y, w, h,
      minX: 6, maxX: play.w - w - 6,
      vx, label: '', ok: false, fill: '', shape: '',
      spring, sprung: false, dead: false
    });
  };
  const spawnOne = y => {
    if (!questionLive && cooldown <= 0) {
      if (!livePack) {
        const pack = call(nextQuestion);
        if (!pack?.choices?.length) {
          ending = true;
          call(onFinished);
          return false;
        }
        livePack = pack;
        return placeQuestion(y, true);
      }
      return placeQuestion(y, false);
    }
    spawnFiller(y);
    if (!questionLive && cooldown > 0) cooldown -= 1;
    return true;
  };
  const ensure = () => {
    if (ending) return;
    for (let n = 0; n < 30; n++) {
      const top = highest();
      if (questionLive ? top <= questionY + 0.5 : top <= -gap) break;
      if (!spawnOne(top - gap)) break;
    }
  };
  const shiftWorld = dy => {
    if (dy > 0.5) climbed = true;
    platforms.forEach(plat => { plat.y += dy; });
    bits.forEach(bit => { bit.y += dy; });
    clouds.forEach(cloud => { cloud.y += dy * 0.18; });
    questionY += dy;
  };
  const clearQuestion = plat => {
    const clean = !slipped;
    platforms.forEach(other => { if (other.kind === 'choice' && other !== plat) shatter(other); });
    plat.kind = 'leaf';
    plat.label = '';
    plat.spring = false;
    questionLive = false;
    cooldown = 3;
    livePack = null;
    reap();
    call(onClear, clean);
    if (session.dead || ending) return;
    ensure();
  };
  const layout = () => {
    const cssW = stage.clientWidth || 360;
    const cssH = stage.clientHeight || 420;
    if (cssW < 40 || cssH < 40) return null;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    width = cssW;
    height = cssH;
    return { x: 0, y: 0, w: cssW, h: cssH, scale: cssH / 600 };
  };
  const begin = () => {
    platforms.length = 0;
    bits.length = 0;
    questionLive = false;
    questionY = 0;
    cooldown = 3;
    lastBrittle = false;
    scrolling = false;
    tune();
    player.w = 60 * (play.h / 600);
    player.h = 60 * (play.h / 600);
    const h = Math.max(10, 12 * play.scale);
    platforms.push({
      kind: 'base', x: 0, y: play.h - h, w: play.w, h,
      minX: 0, maxX: 0, vx: 0, label: '', ok: false, fill: '', shape: '',
      spring: false, sprung: false, dead: false
    });
    ensure();
    const base = platforms.find(plat => plat.kind === 'base');
    player.x = play.w / 2 - player.w / 2;
    player.y = (base?.y || play.h) - player.h - 1;
    player.vx = 0;
    player.vy = 6 * (play.h / 600);
    player.face = 'right';
  };
  const rescue = () => {
    if (ending || pause > 0) return;
    slipped = true;
    pause = reduced ? 0.3 : 0.45;
    shake();
    call(onMiss, 'fall');
    if (session.dead || ending || !play) return;
    const w = leafW();
    const h = leafH();
    const y = play.h - h - 8;
    const x = Math.max(8, Math.min(play.w - w - 8, player.x));
    platforms.push({
      kind: 'leaf', x, y, w, h,
      minX: 6, maxX: Math.max(6, play.w - w - 6),
      vx: 0, label: '', ok: false, fill: '', shape: '',
      spring: false, sprung: false, dead: false
    });
    player.w = 60 * (play.h / 600);
    player.h = 60 * (play.h / 600);
    player.x = x + (w - player.w) / 2;
    player.y = y - player.h;
    player.vx = 0;
    player.vy = -jumpV;
    scrolling = false;
    if (!questionLive) ensure();
  };

  const drawLeaf = (plat, x, y) => {
    const brittle = plat.kind === 'brittle';
    ctx.fillStyle = plat.kind === 'base' ? '#5f8f55' : brittle ? '#e4c79a' : '#7f9f62';
    ctx.strokeStyle = brittle ? '#8a6a3a' : '#32634e';
    ctx.lineWidth = 2;
    roundBox(ctx, x, y, plat.w, plat.h, plat.kind === 'base' ? 4 : 8);
    ctx.fill();
    ctx.stroke();
    if (plat.kind === 'slide') {
      ctx.strokeStyle = '#244b3d';
      ctx.beginPath();
      ctx.moveTo(x + 10, y + plat.h / 2);
      ctx.lineTo(x + 18, y + plat.h / 2);
      ctx.moveTo(x + plat.w - 18, y + plat.h / 2);
      ctx.lineTo(x + plat.w - 10, y + plat.h / 2);
      ctx.stroke();
    }
    if (brittle) {
      ctx.strokeStyle = '#8a6a3a';
      ctx.beginPath();
      ctx.moveTo(x + plat.w * 0.35, y + 2);
      ctx.lineTo(x + plat.w * 0.55, y + plat.h - 2);
      ctx.stroke();
    }
    if (!plat.spring) return;
    const sw = 22 * play.scale;
    const sh = plat.sprung ? springH * 0.45 : springH;
    const sx = x + plat.w / 2;
    const sy = y - sh;
    ctx.strokeStyle = '#3e8f4a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx - sw / 2, y);
    for (let i = 0; i < 4; i++) {
      const py = y - (i + 0.5) * (sh / 4);
      ctx.lineTo(sx + (i % 2 ? sw / 2 : -sw / 2), py);
    }
    ctx.stroke();
    ctx.fillStyle = plat.sprung ? '#c9e6b0' : '#8fce6a';
    ctx.beginPath();
    ctx.ellipse(sx, sy, sw * 0.45, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  const draw = () => {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#b7d7ee');
    sky.addColorStop(1, '#e7f6df');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    clouds.forEach(cloud => {
      const span = play.h + 80;
      const y = play.y + ((cloud.y % span) + span) % span - 30;
      const x = play.x + (cloud.x % Math.max(1, play.w));
      ctx.fillStyle = '#ffffffd4';
      ctx.beginPath();
      ctx.ellipse(x, y, cloud.w * 0.46, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(x + cloud.w * 0.28, y + 3, cloud.w * 0.32, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(x - cloud.w * 0.22, y + 4, cloud.w * 0.28, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    platforms.forEach(plat => {
      if (plat.dead) return;
      const x = play.x + plat.x;
      const y = play.y + plat.y;
      if (y > play.y + play.h + 30 || y < play.y - 80) return;
      if (plat.kind === 'choice') {
        ctx.fillStyle = '#faf9f5';
        ctx.strokeStyle = '#244b3d';
        ctx.lineWidth = 2;
        roundBox(ctx, x, y, plat.w, plat.h, 8);
        ctx.fill();
        ctx.stroke();
        const mark = plat.shape || plat.fill ? 16 : 0;
        const size = fitLabel(ctx, plat.label, plat.w - mark - 8);
        const textW = ctx.measureText(plat.label).width;
        ctx.fillStyle = '#24332c';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const tx = x + (plat.w - textW - mark) / 2 + mark;
        ctx.fillText(plat.label, tx, y + plat.h / 2);
        if (mark) drawMark(ctx, plat, tx - mark * 0.7, y + plat.h / 2, size);
        return;
      }
      drawLeaf(plat, x, y);
    });
    bits.forEach(bit => {
      ctx.fillStyle = '#e4c79a';
      roundBox(ctx, play.x + bit.x, play.y + bit.y, bit.w, bit.h, 4);
      ctx.fill();
    });
    const rising = player.vy < -jumpV * 0.45;
    drawSprout(ctx, play.x + player.x, play.y + player.y, player.w, player.h, player.face, rising);
  };

  const frame = now => {
    if (session.dead) return;
    try {
    const dt = Math.min(0.032, last ? (now - last) / 1000 : 0.016);
    last = now;
    const box = layout();
    if (!box) return;
    if (!play) {
      play = box;
      begin();
    } else if (!climbed && (Math.abs(box.w - play.w) > 48 || Math.abs(box.h - play.h) > 48)) {
      const pack = livePack;
      play = box;
      livePack = pack;
      begin();
    } else {
      const resized = Math.abs(box.w - play.w) > 1 || Math.abs(box.h - play.h) > 1;
      play.x = box.x;
      play.y = box.y;
      play.w = box.w;
      play.h = box.h;
      play.scale = box.scale;
      if (resized) tune();
    }
    pause = Math.max(0, pause - dt);
    if (pause <= 0 && play && !questionHolding()) {
      if (scrolling) shiftWorld(scrollV * dt);
      const axis = held.has('left') === held.has('right') ? 0 : held.has('left') ? -1 : 1;
      player.vx = axis * xSpeed;
      if (axis < 0) player.face = 'left';
      else if (axis > 0) player.face = 'right';
      player.x += player.vx * dt;
      if (player.x > play.w) player.x = -player.w;
      else if (player.x < -player.w) player.x = play.w;
      platforms.forEach(plat => {
        if (!plat.vx || plat.dead) return;
        plat.x += plat.vx * dt;
        if (plat.x < plat.minX || plat.x > plat.maxX) {
          plat.vx *= -1;
          plat.x = Math.max(plat.minX, Math.min(plat.maxX, plat.x));
        }
      });
      const beforeY = player.y;
      player.vy += gravity * dt;
      player.y += player.vy * dt;
      for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].y > play.h + 24) platforms.splice(i, 1);
      }
      if (questionLive && !platforms.some(plat => plat.kind === 'choice' && !plat.dead)) {
        questionLive = false;
        cooldown = 2;
      }
      ensure();
      if (!ending && player.vy > 0) {
        const feet = player.y + player.h;
        const prev = beforeY + player.h;
        const inset = 0;
        const springW = 24 * play.scale;
        const overlap = plat => Math.min(player.x + player.w - inset, plat.x + plat.w) - Math.max(player.x + inset, plat.x);
        const hits = platforms.filter(plat => {
          if (plat.dead || overlap(plat) <= 0) return false;
          if (prev > plat.y + plat.h) return false;
          return prev <= plat.y + 6 && feet >= plat.y;
        }).sort((a, b) => a.y - b.y || overlap(b) - overlap(a));
        const seen = new Set();
        for (const plat of hits) {
          const row = Math.round(plat.y);
          if (seen.has(row)) continue;
          seen.add(row);
          if (plat.spring && !plat.sprung) {
            const sx = plat.x + plat.w / 2 - springW / 2;
            const springHit = player.x + inset < sx + springW && player.x + player.w - inset > sx && feet >= plat.y - springH;
            if (springHit) {
              plat.sprung = true;
              player.vy = -springV;
              player.y = plat.y - springH - player.h;
              break;
            }
          }
          if (plat.kind === 'brittle' || (plat.kind === 'choice' && !plat.ok)) {
            const wrong = plat.kind === 'choice';
            shatter(plat);
            if (wrong) {
              slipped = true;
              shake();
              call(onMiss, 'break');
            }
            continue;
          }
          player.y = plat.y - player.h;
          player.vy = -jumpV;
          if (plat.kind === 'choice' && plat.ok) clearQuestion(plat);
          break;
        }
        reap();
      }
      bits.forEach(bit => {
        bit.vy += gravity * dt;
        bit.y += bit.vy * dt;
        bit.x += bit.vx * dt;
      });
      for (let i = bits.length - 1; i >= 0; i--) if (bits[i].y > play.h + 40) bits.splice(i, 1);
      if (!ending && player.y > play.h + player.h * 0.2) rescue();
      if (player.y < play.h * (250 / 600)) {
        player.vy += boostG * dt;
        scrolling = true;
      } else scrolling = false;
    }
    if (promptIn > 0) {
      promptIn = Math.max(0, promptIn - dt);
      if (promptIn === 0) call(onPrompt);
    }
    if (play) draw();
    } finally {
      if (!session.dead) session.raf = requestAnimationFrame(frame);
    }
  };

  const typing = e => e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  const keyDir = e => (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ? 'left'
    : e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ? 'right' : '');
  const onKey = e => {
    if (document.querySelector('dialog[open]') || typing(e)) return;
    const dir = keyDir(e);
    if (!dir) return;
    e.preventDefault();
    if (e.type === 'keydown') {
      if (!e.repeat) held.add(dir);
    } else held.delete(dir);
  };
  const endHold = () => held.clear();
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);
  window.addEventListener('blur', endHold);
  root.querySelectorAll('[data-dir]').forEach(button => {
    const dir = button.dataset.dir;
    const down = e => {
      e.preventDefault();
      button.setPointerCapture?.(e.pointerId);
      held.add(dir);
    };
    const up = () => held.delete(dir);
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
  });
  const onStage = e => {
    if (e.button !== undefined && e.button !== 0) return;
    const dir = e.clientX < stage.getBoundingClientRect().left + stage.clientWidth / 2 ? 'left' : 'right';
    held.add(dir);
    const up = () => {
      held.delete(dir);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  stage.addEventListener('pointerdown', onStage);
  session.cleanups.push(() => {
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup', onKey);
    window.removeEventListener('blur', endHold);
    stage.removeEventListener('pointerdown', onStage);
  });
  session.raf = requestAnimationFrame(frame);
}
