/**
 * Sky shot — turn a ship, shoot the rock with the right answer, and dodge
 * enemy ships that fire back. The dark sky, distant star, and ring are drawn
 * here. No outside game code.
 */
import { questionHolding } from './hold.js?v=ask-first';

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

let active = null;

export function stopSky() {
  active?.destroy();
  active = null;
}

function wrap(body, w, h) {
  const m = body.r || 0;
  if (body.x < -m) body.x = w + m;
  else if (body.x > w + m) body.x = -m;
  if (body.y < -m) body.y = h + m;
  else if (body.y > h + m) body.y = -m;
}

function fitLabel(ctx, text, maxWidth) {
  let size = 18;
  const font = px => `700 ${px}px Outfit, sans-serif`;
  ctx.font = font(size);
  while (size > 11 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = font(size);
  }
  return size;
}

function drawShip(ctx, ship, flash) {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.a);
  if (ship.thrusting) {
    ctx.fillStyle = '#7ef6ff';
    ctx.beginPath();
    ctx.moveTo(-10, 5);
    ctx.lineTo(-22, 0);
    ctx.lineTo(-10, -5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(126, 246, 255, .35)';
    ctx.beginPath();
    ctx.moveTo(-14, 3);
    ctx.lineTo(-30, 0);
    ctx.lineTo(-14, -3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = flash ? '#f4fff0' : '#7dff6a';
  ctx.strokeStyle = '#d8ffe0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-12, 11);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-12, -11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawFoe(ctx, foe) {
  ctx.save();
  ctx.translate(foe.x, foe.y);
  ctx.rotate(foe.a);
  ctx.fillStyle = foe.cool < 0.28 ? '#c9a0ff' : '#7a3dff';
  ctx.strokeStyle = '#2a0848';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(0, 10);
  ctx.lineTo(-12, 0);
  ctx.lineTo(0, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#33ff66';
  ctx.shadowColor = '#33ff66';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(4, -3, 2.2, 0, Math.PI * 2);
  ctx.arc(4, 3, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawRock(ctx, rock) {
  const pop = rock.pop || 0;
  const scale = pop > 0 ? Math.max(0.15, pop) : 1;
  ctx.save();
  ctx.translate(rock.x, rock.y);
  ctx.rotate(rock.spin);
  ctx.scale(scale, scale);
  ctx.beginPath();
  rock.pts.forEach((p, i) => {
    const a = (i / rock.pts.length) * Math.PI * 2;
    const x = Math.cos(a) * rock.r * p;
    const y = Math.sin(a) * rock.r * p;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = rock.flash > 0 ? '#fff4ec' : '#6e6258';
  ctx.strokeStyle = rock.flash > 0 ? '#a85a2a' : '#2c2622';
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();
  ctx.clip();
  ctx.fillStyle = 'rgba(255, 236, 210, .28)';
  ctx.beginPath();
  ctx.ellipse(-rock.r * 0.28, -rock.r * 0.32, rock.r * 0.42, rock.r * 0.28, -0.5, 0, Math.PI * 2);
  ctx.fill();
  rock.pts.forEach((p, i) => {
    if (i % 2) return;
    const a = (i / rock.pts.length) * Math.PI * 2;
    ctx.fillStyle = 'rgba(28, 22, 18, .45)';
    ctx.beginPath();
    ctx.arc(Math.cos(a) * rock.r * 0.38, Math.sin(a) * rock.r * 0.38, rock.r * 0.12 * p, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
  if (pop > 0 && pop < 0.85) return;
  ctx.save();
  ctx.translate(rock.x, rock.y);
  ctx.fillStyle = '#faf9f5';
  ctx.strokeStyle = '#32634e';
  ctx.lineWidth = 2;
  ctx.font = `700 ${fitLabel(ctx, rock.label, rock.r * 1.7)}px Outfit, sans-serif`;
  const width = ctx.measureText(rock.label).width;
  const w = width + 14;
  const h = 22;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, 8);
  else ctx.rect(-w / 2, -h / 2, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#24332c';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rock.label, 0, 1);
  ctx.restore();
}

export function mountSky(root, { prompt, choices, target, wave, reduced, onDone, onMiss, onEmpty, onOver, onRetry }) {
  stopSky();
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
  const label = `${prompt} Turn the ship and shoot that rock. Dodge the ships that shoot back.`;
  root.innerHTML = `<div class="sky-play"><div class="sky-hud"><span id="hullLabel">Hull</span><span class="hull-pips" role="meter" aria-valuemin="0" aria-valuemax="3" aria-valuenow="3" aria-labelledby="hullLabel"><i class="on"></i><i class="on"></i><i class="on"></i></span></div><div class="sky" role="application" aria-label="${esc(label)}"><canvas class="sky-view"></canvas></div><div class="steer sky-controls"><button type="button" class="steer-btn" data-act="left" aria-label="Turn left">↺</button><button type="button" class="steer-btn" data-act="thrust" aria-label="Thrust">▲</button><button type="button" class="steer-btn" data-act="right" aria-label="Turn right">↻</button><button type="button" class="steer-btn" data-act="fire" aria-label="Shoot">●</button></div></div>`;
  const stage = root.querySelector('.sky');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const meter = root.querySelector('.hull-pips');
  const tuning = wave || { rocks: 3, foes: 1, drift: 34, foe: 26, bolt: 80, aim: 2.6 };
  const ship = { x: 320, y: 180, r: 16, a: -Math.PI / 2, vx: 0, vy: 0, thrusting: false };
  const rocks = [];
  const foes = [];
  const shots = [];
  const bolts = [];
  const stars = Array.from({ length: 78 }, (_, i) => ({
    x: ((i * 47 + (i % 5) * 13) % 100) / 100,
    y: ((i * 29 + (i % 7) * 11) % 100) / 100,
    r: i % 13 === 0 ? 2.2 : i % 3 === 0 ? 1.35 : 0.75,
    phase: i * 0.73,
    tint: i % 9 === 0 ? '#9ad7ff' : i % 7 === 0 ? '#ffe6b0' : '#f7f4ea'
  }));
  const clouds = [
    { x: 0.18, y: 0.28, rx: 0.46, ry: 0.32, color: '110, 48, 180' },
    { x: 0.72, y: 0.62, rx: 0.4, ry: 0.28, color: '24, 72, 150' },
    { x: 0.48, y: 0.16, rx: 0.28, ry: 0.18, color: '48, 90, 170' }
  ];
  let clock = 0;
  let width = 640;
  let height = 360;
  let spawned = false;
  let hull = 3;
  let wrecked = false;
  let invuln = 0;
  let cool = 0;
  let missed = false;
  let phase = 'play';
  let popLeft = 0;
  let finished = false;
  let downLeft = 0;
  let last = 0;
  let releaseNeeded = false;
  const keys = { left: false, right: false, thrust: false };
  const buttons = { left: false, right: false, thrust: false };

  const paintHull = () => {
    if (!meter) return;
    meter.setAttribute('aria-valuenow', String(hull));
    [...meter.children].forEach((pip, i) => pip.classList.toggle('on', i < hull));
  };
  const shake = () => {
    stage.classList.add('shake');
    const timer = setTimeout(() => stage.classList.remove('shake'), 280);
    session.cleanups.push(() => clearTimeout(timer));
  };
  const call = (fn, arg) => { try { fn?.(arg); } catch { /* the host owns errors */ } };
  const inputsHeld = () => keys.left || keys.right || keys.thrust || buttons.left || buttons.right || buttons.thrust;
  const steer = () => (phase === 'play' && !releaseNeeded)
    ? {
      left: keys.left || buttons.left,
      right: keys.right || buttons.right,
      thrust: keys.thrust || buttons.thrust
    }
    : { left: false, right: false, thrust: false };
  const parkShip = () => {
    ship.x = width / 2;
    ship.y = height / 2;
    ship.vx = 0;
    ship.vy = 0;
    ship.a = -Math.PI / 2;
    ship.thrusting = false;
    const needFrom = (body, gap) => {
      const dx = body.x - ship.x;
      const dy = body.y - ship.y;
      const dist = Math.hypot(dx, dy) || 1;
      const need = body.r + ship.r + gap;
      if (dist >= need) return;
      body.x = ship.x + (dx / dist) * need;
      body.y = ship.y + (dy / dist) * need;
      wrap(body, width, height);
    };
    rocks.forEach(rock => needFrom(rock, 48));
    foes.forEach(foe => needFrom(foe, 80));
  };
  const replay = () => {
    if (session.dead || wrecked || phase === 'over' || phase === 'play') return;
    rocks.length = 0;
    foes.length = 0;
    shots.length = 0;
    bolts.length = 0;
    spawned = false;
    spawn();
    parkShip();
    invuln = 1.6;
    cool = 0;
    downLeft = 0;
    phase = 'play';
    releaseNeeded = inputsHeld();
    call(onRetry);
  };
  const hurt = () => {
    if (invuln > 0 || phase !== 'play') return;
    hull -= 1;
    missed = true;
    bolts.length = 0;
    shots.length = 0;
    parkShip();
    releaseNeeded = true;
    shake();
    const empty = hull <= 0;
    if (empty) {
      hull = 0;
      wrecked = true;
    }
    paintHull();
    phase = 'down';
    downLeft = reduced ? 1.1 : 1.6;
    call(empty ? onEmpty : onMiss, empty ? undefined : 'hull');
  };
  const separated = (x, y, r) => [...rocks, ...foes].every(body => Math.hypot(body.x - x, body.y - y) > body.r + r + 16)
    && Math.hypot(x - width / 2, y - height / 2) > 110;

  const spawn = () => {
    const list = [...(choices || [])];
    if (!list.some(choice => String(choice) === String(target))) list.push(target);
    let marked = false;
    list.forEach(choice => {
      const text = String(choice);
      const r = clamp(20 + text.length * 3.4, 30, 58);
      const ok = !marked && text === String(target);
      if (ok) marked = true;
      let x = width * 0.5;
      let y = height * 0.25;
      for (let n = 0; n < 24; n++) {
        const nx = r + Math.random() * (width - r * 2);
        const ny = r + Math.random() * (height - r * 2);
        if (separated(nx, ny, r)) { x = nx; y = ny; break; }
        if (n === 23) {
          const dx = nx - width / 2;
          const dy = ny - height / 2;
          const dist = Math.hypot(dx, dy) || 1;
          const need = r + 140;
          x = width / 2 + (dx / dist) * need;
          y = height / 2 + (dy / dist) * need;
        }
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = tuning.drift * calm;
      rocks.push({
        label: text,
        ok,
        x,
        y,
        r,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        spin: Math.random() * Math.PI * 2,
        spinV: (Math.random() - 0.5) * 0.6,
        pts: Array.from({ length: 8 }, () => 0.78 + Math.random() * 0.28),
        flash: 0,
        guard: 0,
        pop: 0
      });
    });
    const corners = [
      [28, 28],
      [width - 28, 28],
      [28, height - 28],
      [width - 28, height - 28]
    ];
    for (let i = 0; i < tuning.foes; i++) {
      const r = 15;
      const [x, y] = corners[i % corners.length];
      const angle = Math.atan2(height / 2 - y, width / 2 - x) + Math.PI;
      const speed = tuning.foe * calm;
      foes.push({
        x, y, r,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        a: angle,
        cool: tuning.aim * (0.9 + i * 0.35)
      });
    }
    ship.x = width / 2;
    ship.y = height / 2;
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
      [ship, ...rocks, ...foes, ...shots, ...bolts].forEach(body => {
        body.x *= sx;
        body.y *= sy;
      });
    }
    width = cssW;
    height = cssH;
  };

  const fire = () => {
    if (phase !== 'play' || releaseNeeded || cool > 0 || shots.length >= 5) return;
    cool = 0.32;
    const speed = Math.max(280, Math.min(width, height) * 0.95);
    shots.push({
      x: ship.x + Math.cos(ship.a) * 20,
      y: ship.y + Math.sin(ship.a) * 20,
      vx: Math.cos(ship.a) * speed + ship.vx * 0.25,
      vy: Math.sin(ship.a) * speed + ship.vy * 0.25,
      r: 4,
      life: 1.05
    });
  };

  const step = dt => {
    cool = Math.max(0, cool - dt);
    invuln = Math.max(0, invuln - dt);
    const move = steer();
    const turn = (move.left === move.right ? 0 : move.left ? -1 : 1) * 3.4 * (reduced ? 0.8 : 1);
    ship.a += turn * dt;
    ship.thrusting = move.thrust;
    if (move.thrust) {
      const push = 260 * calm;
      ship.vx += Math.cos(ship.a) * push * dt;
      ship.vy += Math.sin(ship.a) * push * dt;
    }
    const drag = Math.exp(-0.85 * dt);
    ship.vx *= drag;
    ship.vy *= drag;
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed > 220) {
      ship.vx = ship.vx / speed * 220;
      ship.vy = ship.vy / speed * 220;
    }
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    wrap(ship, width, height);

    rocks.forEach(rock => {
      rock.x += rock.vx * dt;
      rock.y += rock.vy * dt;
      rock.spin += rock.spinV * dt;
      rock.flash = Math.max(0, rock.flash - dt);
      rock.guard = Math.max(0, rock.guard - dt);
      rock.pop = Math.max(0, rock.pop - dt);
      wrap(rock, width, height);
    });
    foes.forEach(foe => {
      foe.x += foe.vx * dt;
      foe.y += foe.vy * dt;
      foe.a += 0.4 * dt;
      foe.cool -= dt;
      wrap(foe, width, height);
      if (foe.cool <= 0 && phase === 'play') {
        const dx = ship.x - foe.x;
        const dy = ship.y - foe.y;
        const dist = Math.hypot(dx, dy) || 1;
        const pace = tuning.bolt * calm;
        bolts.push({ x: foe.x, y: foe.y, vx: dx / dist * pace, vy: dy / dist * pace, r: 5, life: 2.4 });
        foe.cool = tuning.aim * (reduced ? 1.45 : 1);
      }
      if (invuln <= 0 && Math.hypot(ship.x - foe.x, ship.y - foe.y) < ship.r + foe.r) hurt();
    });
    if (phase !== 'play') return;

    for (let i = shots.length - 1; i >= 0; i--) {
      const shot = shots[i];
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;
      wrap(shot, width, height);
      if (shot.life <= 0) { shots.splice(i, 1); continue; }
      const foeHit = foes.some(foe => Math.hypot(shot.x - foe.x, shot.y - foe.y) < foe.r + shot.r);
      if (foeHit) { shots.splice(i, 1); continue; }
      const rock = rocks.find(item => item.pop <= 0 && Math.hypot(shot.x - item.x, shot.y - item.y) < item.r);
      if (!rock) continue;
      shots.splice(i, 1);
      if (rock.ok) {
        phase = 'pop';
        popLeft = 0.32;
        rock.pop = 1;
        return;
      }
      if (rock.guard > 0) continue;
      rock.guard = 0.8;
      rock.flash = 0.35;
      missed = true;
      shake();
      call(onMiss, 'rock');
    }

    for (let i = bolts.length - 1; i >= 0; i--) {
      const bolt = bolts[i];
      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;
      bolt.life -= dt;
      wrap(bolt, width, height);
      if (bolt.life <= 0) { bolts.splice(i, 1); continue; }
      if (Math.hypot(bolt.x - ship.x, bolt.y - ship.y) < ship.r + bolt.r) {
        bolts.splice(i, 1);
        hurt();
      }
    }
  };

  const drawStreak = (body, color, length) => {
    const pace = Math.hypot(body.vx, body.vy) || 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, body.r * 1.3);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(body.x, body.y);
    ctx.lineTo(body.x - (body.vx / pace) * length, body.y - (body.vy / pace) * length);
    ctx.stroke();
  };
  const drawSky = () => {
    ctx.fillStyle = '#050814';
    ctx.fillRect(0, 0, width, height);
    clouds.forEach(cloud => {
      const x = cloud.x * width;
      const y = cloud.y * height;
      const rx = cloud.rx * width;
      const ry = cloud.ry * height;
      const wash = ctx.createRadialGradient(x, y, 8, x, y, Math.max(rx, ry));
      wash.addColorStop(0, `rgba(${cloud.color}, .42)`);
      wash.addColorStop(1, `rgba(${cloud.color}, 0)`);
      ctx.fillStyle = wash;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    const sx = width * 0.84;
    const sy = height * 0.16;
    const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, 78);
    glow.addColorStop(0, 'rgba(255, 244, 214, .95)');
    glow.addColorStop(0.22, 'rgba(255, 196, 120, .4)');
    glow.addColorStop(1, 'rgba(255, 196, 120, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, 78, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff6df';
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fill();
    const px = width * 0.16;
    const py = height * 0.78;
    const pr = Math.min(width, height) * 0.18;
    const shell = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, pr * 0.1, px, py, pr);
    shell.addColorStop(0, 'rgba(90, 160, 255, .28)');
    shell.addColorStop(1, 'rgba(12, 28, 64, .55)');
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 186, 255, .7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(px, py, pr * 0.96, pr * 0.34, -0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(px, py, pr * 0.34, pr * 0.96, 0.15, 0, Math.PI * 2);
    ctx.stroke();
    stars.forEach(star => {
      const twinkle = reduced ? 0.8 : 0.55 + Math.sin(clock * 1.4 + star.phase) * 0.35;
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = star.tint;
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };
  const draw = () => {
    drawSky();
    rocks.forEach(rock => drawRock(ctx, rock));
    foes.forEach(foe => drawFoe(ctx, foe));
    shots.forEach(shot => drawStreak(shot, '#7dff6a', 16));
    bolts.forEach(bolt => drawStreak(bolt, '#37d8ff', 14));
    ctx.lineCap = 'butt';
    if (phase === 'down') {
      ctx.strokeStyle = '#e07a2f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '800 42px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Hit!', width / 2, height * 0.42);
      drawShip(ctx, ship, true);
    } else {
      const blink = invuln > 0 && Math.floor(invuln * 12) % 2 === 0;
      if (!blink) drawShip(ctx, ship, invuln > 0);
    }
  };

  const frame = now => {
    if (session.dead || phase === 'over') return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
    last = now;
    clock += dt;
    try {
      fit();
      if (!spawned && width > 40) spawn();
      const paused = !!document.querySelector('dialog[open]') || questionHolding();
      if (!paused && spawned && phase === 'play') step(dt);
      else if (!paused && phase === 'down') {
        downLeft -= dt;
        if (downLeft <= 0 && wrecked) {
          phase = 'over';
          call(onOver);
        } else if (downLeft <= 0) replay();
      } else if (!paused && phase === 'pop') {
        popLeft -= dt;
        rocks.forEach(rock => { if (rock.pop > 0) rock.pop = Math.max(0, rock.pop - dt * 2.4); });
        if (popLeft <= 0 && !finished) {
          finished = true;
          phase = 'over';
          call(onDone, !missed);
        }
      }
      if (phase !== 'over') draw();
    } catch { /* keep the sky running after a hit */ }
    if (!session.dead && phase !== 'over') session.raf = requestAnimationFrame(frame);
  };

  const typing = e => e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  const onKey = e => {
    if (session.dead || document.querySelector('dialog[open]') || typing(e)) return;
    const button = e.target?.closest?.('button');
    if (button && !button.closest('.sky-controls')) return;
    const act = e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ? 'left'
      : e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ? 'right'
      : e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' ? 'thrust'
      : e.key === ' ' || e.code === 'Space' ? 'fire' : '';
    if (!act) return;
    e.preventDefault();
    if (act === 'fire') {
      if (e.type === 'keydown' && !e.repeat) fire();
      return;
    }
    keys[act] = e.type === 'keydown';
    if (e.type === 'keyup' && releaseNeeded && phase === 'play' && !inputsHeld()) releaseNeeded = false;
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
    else bindHold(button, () => { buttons[act] = true; }, () => {
      buttons[act] = false;
      if (releaseNeeded && phase === 'play' && !inputsHeld()) releaseNeeded = false;
    });
  });
  const onBlur = () => {
    keys.left = keys.right = keys.thrust = false;
    buttons.left = buttons.right = buttons.thrust = false;
    if (phase === 'play') releaseNeeded = false;
  };
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);
  window.addEventListener('blur', onBlur);
  session.cleanups.push(() => {
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup', onKey);
    window.removeEventListener('blur', onBlur);
  });

  paintHull();
  session.raf = requestAnimationFrame(frame);
  return session;
}
