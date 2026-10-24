/**
 * Planet guard — a learning round with the same feel as a center-planet
 * defense game: the gun follows the pointer, shots fly out from the barrel,
 * and rocks drift in from the edges until they hit the planet or blow up.
 * Drawn here for Little Sprouts. No outside pictures or game code.
 */
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

let active = null;

export function stopPlanet() {
  active?.destroy();
  active = null;
}

function fitLabel(ctx, text, maxWidth) {
  let size = 16;
  const font = px => `700 ${px}px Outfit, sans-serif`;
  ctx.font = font(size);
  while (size > 11 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = font(size);
  }
  return size;
}

function edgePoint(side, width, height, pad) {
  const along = 0.18 + Math.random() * 0.64;
  if (side === 0) return { x: width * along, y: -pad };
  if (side === 1) return { x: width + pad, y: height * along };
  if (side === 2) return { x: width * along, y: height + pad };
  return { x: -pad, y: height * along };
}

function drawRock(ctx, rock) {
  ctx.save();
  ctx.translate(rock.x, rock.y);
  ctx.rotate(rock.spin);
  ctx.beginPath();
  rock.pts.forEach((p, i) => {
    const a = (i / rock.pts.length) * Math.PI * 2;
    const x = Math.cos(a) * rock.r * p;
    const y = Math.sin(a) * rock.r * p;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = '#9aa0a8';
  ctx.strokeStyle = '#3c4148';
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.beginPath();
  ctx.ellipse(-rock.r * 0.2, -rock.r * 0.25, rock.r * 0.28, rock.r * 0.18, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(rock.x, rock.y);
  ctx.fillStyle = '#faf9f5';
  ctx.strokeStyle = '#24332c';
  ctx.lineWidth = 2;
  ctx.font = `700 ${fitLabel(ctx, rock.label, rock.r * 1.6)}px Outfit, sans-serif`;
  const w = ctx.measureText(rock.label).width + 12;
  const h = 20;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, 8);
  else ctx.rect(-w / 2, -h / 2, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1b2430';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rock.label, 0, 1);
  ctx.restore();
}

function drawBurst(ctx, boom) {
  const t = 1 - boom.life / boom.max;
  const radius = boom.r * (0.4 + t * 1.6);
  ctx.save();
  ctx.translate(boom.x, boom.y);
  ctx.globalAlpha = 1 - t;
  ctx.fillStyle = t < 0.35 ? '#fff4d2' : '#e07a2f';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c45c3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#f8ce6c';
  boom.bits.forEach(bit => {
    ctx.beginPath();
    ctx.arc(Math.cos(bit.a) * radius * bit.d, Math.sin(bit.a) * radius * bit.d, bit.s, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawPlanet(ctx, x, y, r, aim, spin, flash) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = 'rgba(255,255,255,.8)';
  ctx.shadowBlur = flash ? 8 : 36;
  ctx.fillStyle = flash ? '#fff' : '#d5dbe3';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
  ctx.clip();
  ctx.rotate(spin);
  ctx.fillStyle = flash ? '#e7eef6' : '#7f93a8';
  [[-0.28, -0.05, 0.34, 0.22], [0.22, 0.18, 0.26, 0.16], [-0.05, 0.32, 0.2, 0.12], [0.34, -0.28, 0.16, 0.12]].forEach(([px, py, rx, ry]) => {
    ctx.beginPath();
    ctx.ellipse(px * r, py * r, rx * r, ry * r, 0.4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(aim);
  ctx.fillStyle = '#e7edf4';
  ctx.strokeStyle = '#2c3442';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(r * 0.15, -11);
  ctx.lineTo(r + 26, -4);
  ctx.lineTo(r + 30, 0);
  ctx.lineTo(r + 26, 4);
  ctx.lineTo(r * 0.15, 11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c45c3a';
  ctx.beginPath();
  ctx.arc(r + 28, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function mountPlanet(root, { prompt, choices, target, wave, reduced, onDone, onMiss, onEmpty, onOver }) {
  stopPlanet();
  const calm = reduced ? 0.55 : 1;
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
  const label = `${prompt} Aim the gun and shoot that rock before it reaches the planet.`;
  root.innerHTML = `<div class="planet-play"><div class="sky-hud"><span id="shieldLabel">Shields</span><span class="hull-pips" role="meter" aria-valuemin="0" aria-valuemax="3" aria-valuenow="3" aria-labelledby="shieldLabel"><i class="on"></i><i class="on"></i><i class="on"></i></span></div><div class="planet" role="application" aria-label="${esc(label)}"><canvas class="planet-view"></canvas></div><div class="steer sky-controls"><button type="button" class="steer-btn" data-act="left" aria-label="Aim left">↺</button><button type="button" class="steer-btn" data-act="fire" aria-label="Shoot">●</button><button type="button" class="steer-btn" data-act="right" aria-label="Aim right">↻</button></div></div>`;
  const stage = root.querySelector('.planet');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const meter = root.querySelector('.hull-pips');
  const tuning = wave || { rocks: 3, seconds: 8 };
  const rocks = [];
  const shots = [];
  const bursts = [];
  const stars = Array.from({ length: 48 }, (_, i) => ({
    x: ((i * 53) % 100) / 100,
    y: ((i * 29) % 100) / 100,
    r: i % 7 === 0 ? 1.6 : 0.9,
    a: 0.35 + (i % 5) * 0.12
  }));
  let width = 640;
  let height = 360;
  let spawned = false;
  let shields = 3;
  let wrecked = false;
  let aim = -Math.PI / 2;
  let spin = 0;
  let cool = 0;
  let missed = false;
  let phase = 'play';
  let burstLeft = 0;
  let finished = false;
  let downLeft = 0;
  let last = 0;
  const held = { left: false, right: false };
  const planetR = () => clamp(Math.min(width, height) * 0.16, 46, 92);

  const paintShields = () => {
    if (!meter) return;
    meter.setAttribute('aria-valuenow', String(shields));
    [...meter.children].forEach((pip, i) => pip.classList.toggle('on', i < shields));
  };
  const shake = () => {
    stage.classList.add('shake');
    const timer = setTimeout(() => stage.classList.remove('shake'), 280);
    session.cleanups.push(() => clearTimeout(timer));
  };
  const call = (fn, arg) => { try { fn?.(arg); } catch { /* the host owns errors */ } };
  const center = () => ({ x: width / 2, y: height / 2, r: planetR() });
  const boom = rock => {
    bursts.push({
      x: rock.x,
      y: rock.y,
      r: rock.r,
      life: reduced ? 0.28 : 0.5,
      max: reduced ? 0.28 : 0.5,
      bits: Array.from({ length: 7 }, (_, i) => ({ a: (i / 7) * Math.PI * 2, d: 0.45 + (i % 3) * 0.2, s: 2 + (i % 3) }))
    });
  };
  const replay = () => {
    rocks.length = 0;
    shots.length = 0;
    bursts.length = 0;
    held.left = held.right = false;
    spawned = false;
    spawn();
    cool = 0;
    downLeft = 0;
    phase = 'play';
  };
  const hurt = () => {
    if (phase !== 'play') return;
    shields -= 1;
    missed = true;
    shots.length = 0;
    held.left = held.right = false;
    shake();
    const empty = shields <= 0;
    if (empty) {
      shields = 0;
      wrecked = true;
    }
    paintShields();
    phase = 'down';
    downLeft = reduced ? 1.1 : 1.6;
    call(empty ? onEmpty : onMiss, empty ? undefined : 'shield');
  };

  const spawn = () => {
    const list = [...(choices || [])];
    if (!list.some(choice => String(choice) === String(target))) list.push(target);
    const { x: cx, y: cy, r: core } = center();
    let marked = false;
    const sides = [0, 1, 2, 3];
    for (let i = sides.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sides[i], sides[j]] = [sides[j], sides[i]];
    }
    list.forEach((choice, i) => {
      const text = String(choice);
      const size = i % 3;
      let r = [42, 34, 28][size];
      if (text.length > 4) r += 6;
      const ok = !marked && text === String(target);
      if (ok) marked = true;
      const spot = edgePoint(sides[i % 4], width, height, r + 36);
      const dx = cx - spot.x;
      const dy = cy - spot.y;
      const dist = Math.hypot(dx, dy) || 1;
      const travel = Math.max(48, dist - core - r * 0.72);
      const pace = [1.12, 1, 0.86][size];
      const speed = travel / ((tuning.seconds || 8) / calm) * pace;
      rocks.push({
        label: text,
        ok,
        x: spot.x,
        y: spot.y,
        r,
        vx: dx / dist * speed,
        vy: dy / dist * speed,
        spin: Math.atan2(dy, dx),
        spinV: (Math.random() - 0.5) * 0.35,
        pts: Array.from({ length: 9 }, () => 0.72 + Math.random() * 0.34),
        wait: 0.25 + i * (reduced ? 0.7 : 0.45)
      });
    });
    spawned = true;
  };

  const fit = () => {
    const cssW = Math.max(280, stage.clientWidth || 640);
    const cssH = Math.max(180, canvas.clientHeight || 320);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (spawned && (cssW !== width || cssH !== height)) {
      const sx = cssW / width;
      const sy = cssH / height;
      [...rocks, ...shots, ...bursts].forEach(body => {
        body.x *= sx;
        body.y *= sy;
      });
    }
    width = cssW;
    height = cssH;
  };

  const aimAt = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    aim = Math.atan2(clientY - rect.top - height / 2, clientX - rect.left - width / 2);
  };

  const fire = () => {
    if (phase !== 'play' || cool > 0 || shots.length >= 8) return;
    cool = reduced ? 0.2 : 0.12;
    const { x, y, r } = center();
    const muzzle = r + 30;
    const speed = (reduced ? 640 : 980);
    shots.push({
      x: x + Math.cos(aim) * muzzle,
      y: y + Math.sin(aim) * muzzle,
      vx: Math.cos(aim) * speed,
      vy: Math.sin(aim) * speed,
      life: 1.2
    });
  };

  const step = dt => {
    cool = Math.max(0, cool - dt);
    spin += dt * (reduced ? 0.04 : 0.1);
    const turn = (held.left === held.right ? 0 : held.left ? -1 : 1) * 2.6 * (reduced ? 0.75 : 1);
    aim += turn * dt;
    const { x: cx, y: cy, r: core } = center();

    for (let i = shots.length - 1; i >= 0; i--) {
      const shot = shots[i];
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;
      if (shot.life <= 0 || shot.x < -40 || shot.y < -40 || shot.x > width + 40 || shot.y > height + 40) {
        shots.splice(i, 1);
        continue;
      }
      const hit = rocks.findIndex(rock => rock.wait <= 0 && Math.hypot(shot.x - rock.x, shot.y - rock.y) < rock.r);
      if (hit < 0) continue;
      const rock = rocks[hit];
      shots.splice(i, 1);
      rocks.splice(hit, 1);
      boom(rock);
      if (rock.ok) {
        phase = 'burst';
        burstLeft = reduced ? 0.28 : 0.48;
        return;
      }
      missed = true;
      call(onMiss, 'rock');
    }
    if (phase !== 'play') return;

    for (let i = rocks.length - 1; i >= 0; i--) {
      const rock = rocks[i];
      rock.spin += rock.spinV * dt;
      if (rock.wait > 0) {
        rock.wait -= dt;
        continue;
      }
      rock.x += rock.vx * dt;
      rock.y += rock.vy * dt;
      if (Math.hypot(rock.x - cx, rock.y - cy) < core + rock.r * 0.72) {
        rocks.splice(i, 1);
        boom(rock);
        hurt();
        return;
      }
    }
  };

  const draw = () => {
    ctx.fillStyle = '#070b12';
    ctx.fillRect(0, 0, width, height);
    const haze = ctx.createRadialGradient(width * 0.72, height * 0.2, 10, width * 0.72, height * 0.2, width * 0.45);
    haze.addColorStop(0, 'rgba(92, 64, 140, .28)');
    haze.addColorStop(1, 'rgba(92, 64, 140, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);
    const teal = ctx.createRadialGradient(width * 0.2, height * 0.8, 10, width * 0.2, height * 0.8, width * 0.4);
    teal.addColorStop(0, 'rgba(32, 92, 110, .22)');
    teal.addColorStop(1, 'rgba(32, 92, 110, 0)');
    ctx.fillStyle = teal;
    ctx.fillRect(0, 0, width, height);
    stars.forEach(star => {
      ctx.globalAlpha = star.a;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    rocks.forEach(rock => { if (rock.wait <= 0) drawRock(ctx, rock); });
    bursts.forEach(item => drawBurst(ctx, item));
    shots.forEach(shot => {
      ctx.save();
      ctx.translate(shot.x, shot.y);
      ctx.rotate(Math.atan2(shot.vy, shot.vx));
      ctx.fillStyle = '#fff6d0';
      ctx.fillRect(-12, -1.6, 18, 3.2);
      ctx.restore();
    });
    const { x, y, r } = center();
    drawPlanet(ctx, x, y, r, aim, spin, phase === 'down');
    if (phase === 'down') {
      ctx.fillStyle = '#fff';
      ctx.font = '800 42px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Hit!', width / 2, Math.max(36, y - r - 28));
    }
  };

  const frame = now => {
    if (session.dead) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
    last = now;
    fit();
    if (!spawned && width > 40) spawn();
    const paused = !!document.querySelector('dialog[open]');
    if (!paused && spawned && phase === 'play') step(dt);
    else if (!paused && phase === 'down') {
      downLeft -= dt;
      bursts.forEach(item => { item.life = Math.max(0, item.life - dt); });
      if (downLeft <= 0 && wrecked) {
        phase = 'over';
        call(onOver);
        return;
      }
      if (downLeft <= 0) replay();
    } else if (!paused && phase === 'burst') {
      burstLeft -= dt;
      bursts.forEach(item => { item.life = Math.max(0, item.life - dt); });
      if (burstLeft <= 0 && !finished) {
        finished = true;
        phase = 'over';
        call(onDone, !missed);
      }
    }
    if (phase === 'play') bursts.forEach(item => { item.life = Math.max(0, item.life - dt); });
    for (let i = bursts.length - 1; i >= 0; i--) if (bursts[i].life <= 0) bursts.splice(i, 1);
    draw();
    session.raf = requestAnimationFrame(frame);
  };

  const typing = e => e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  const onKey = e => {
    if (session.dead || document.querySelector('dialog[open]') || typing(e)) return;
    const button = e.target?.closest?.('button');
    if (button && !button.closest('.sky-controls')) return;
    const act = e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ? 'left'
      : e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ? 'right'
      : e.key === ' ' || e.code === 'Space' ? 'fire' : '';
    if (!act) return;
    e.preventDefault();
    if (act === 'fire') { if (e.type === 'keydown' && !e.repeat) fire(); return; }
    held[act] = e.type === 'keydown';
  };
  const bindHold = (button, down, up) => {
    const start = e => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      button.setPointerCapture?.(e.pointerId);
      down();
    };
    const end = () => up();
    button.addEventListener('pointerdown', start);
    button.addEventListener('pointerup', end);
    button.addEventListener('pointercancel', end);
    session.cleanups.push(() => {
      button.removeEventListener('pointerdown', start);
      button.removeEventListener('pointerup', end);
      button.removeEventListener('pointercancel', end);
    });
  };
  root.querySelectorAll('[data-act]').forEach(button => {
    const act = button.dataset.act;
    if (act === 'fire') bindHold(button, () => fire(), () => {});
    else bindHold(button, () => { held[act] = true; }, () => { held[act] = false; });
  });
  const onPoint = e => {
    if (session.dead || phase !== 'play') return;
    // A plain move reports button -1. Only a middle click is ignored.
    if (e.type === 'pointerdown' && e.button !== 0 && e.button !== 2) return;
    aimAt(e.clientX, e.clientY);
    if (e.type === 'pointerdown') {
      e.preventDefault();
      fire();
    }
  };
  const onMenu = e => {
    e.preventDefault();
    if (session.dead || phase !== 'play') return;
    aimAt(e.clientX, e.clientY);
    fire();
  };
  canvas.addEventListener('pointerdown', onPoint);
  canvas.addEventListener('pointermove', onPoint);
  canvas.addEventListener('contextmenu', onMenu);
  const onBlur = () => { held.left = held.right = false; };
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);
  window.addEventListener('blur', onBlur);
  session.cleanups.push(() => {
    canvas.removeEventListener('pointerdown', onPoint);
    canvas.removeEventListener('pointermove', onPoint);
    canvas.removeEventListener('contextmenu', onMenu);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup', onKey);
    window.removeEventListener('blur', onBlur);
  });

  paintShields();
  session.raf = requestAnimationFrame(frame);
  return session;
}
