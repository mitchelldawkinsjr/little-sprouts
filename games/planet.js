/**
 * Planet guard — a learning round with the same feel as a center-planet
 * defense game: the gun follows the pointer, shots fly out from the barrel,
 * and rocks drift in from the edges until they hit the planet or blow up.
 * Drawn here for Little Sprouts. No outside pictures or game code.
 */
import { gamePaused } from '../lib/hold.js?v=hold2';
import { clamp, esc } from '../logic.mjs?v=structure3';


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

function rockPath(ctx, rock) {
  rock.pts.forEach((p, i) => {
    const a = (i / rock.pts.length) * Math.PI * 2;
    const x = Math.cos(a) * rock.r * p;
    const y = Math.sin(a) * rock.r * p;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.closePath();
}

function drawRock(ctx, rock) {
  const lit = rock.lit || '#b7bcc4';
  const mid = rock.mid || '#7d848e';
  const shade = rock.shade || '#3f454d';
  ctx.save();
  ctx.translate(rock.x, rock.y);

  // Soft space shadow so the rock sits in depth, not flat on the sky.
  ctx.fillStyle = 'rgba(0,0,0,.42)';
  ctx.beginPath();
  ctx.ellipse(rock.r * 0.18, rock.r * 0.24, rock.r * 0.95, rock.r * 0.72, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Thin cool rim so the silhouette pops off dark nebula.
  ctx.save();
  ctx.rotate(rock.spin);
  ctx.beginPath();
  rockPath(ctx, rock);
  ctx.strokeStyle = 'rgba(170, 210, 255, .22)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();

  ctx.rotate(rock.spin);
  ctx.beginPath();
  rockPath(ctx, rock);
  const body = ctx.createRadialGradient(-rock.r * 0.42, -rock.r * 0.48, rock.r * 0.05, rock.r * 0.2, rock.r * 0.28, rock.r * 1.1);
  body.addColorStop(0, lit);
  body.addColorStop(0.35, mid);
  body.addColorStop(0.75, shade);
  body.addColorStop(1, '#1c2026');
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = '#1a1e24';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Clip surface detail to the asteroid silhouette.
  ctx.save();
  ctx.beginPath();
  rockPath(ctx, rock);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.2)';
  ctx.beginPath();
  ctx.ellipse(-rock.r * 0.3, -rock.r * 0.36, rock.r * 0.38, rock.r * 0.24, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // Fracture lines for rocky material.
  ctx.strokeStyle = 'rgba(20,24,30,.35)';
  ctx.lineWidth = 1.5;
  (rock.cracks || []).forEach(line => {
    ctx.beginPath();
    ctx.moveTo(Math.cos(line.a) * rock.r * line.d0, Math.sin(line.a) * rock.r * line.d0);
    ctx.lineTo(Math.cos(line.a + line.bend) * rock.r * line.d1, Math.sin(line.a + line.bend) * rock.r * line.d1);
    ctx.stroke();
  });
  (rock.craters || []).forEach(c => {
    const cx = Math.cos(c.a) * rock.r * c.d;
    const cy = Math.sin(c.a) * rock.r * c.d;
    const rx = rock.r * c.s;
    const ry = rock.r * c.s * 0.78;
    ctx.fillStyle = 'rgba(12,14,18,.55)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, c.a, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.18, cy - ry * 0.22, rx * 0.72, ry * 0.5, c.a, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.25, cy - ry * 0.3, rx * 0.35, ry * 0.22, c.a, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
  ctx.restore();

  ctx.save();
  ctx.translate(rock.x, rock.y);
  ctx.fillStyle = 'rgba(250,249,245,.95)';
  ctx.strokeStyle = '#24332c';
  ctx.lineWidth = 2;
  ctx.font = `700 ${fitLabel(ctx, rock.label, rock.r * 1.6)}px Outfit, sans-serif`;
  const w = ctx.measureText(rock.label).width + 12;
  const h = 20;
  ctx.shadowColor = 'rgba(0,0,0,.4)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, 8);
  else ctx.rect(-w / 2, -h / 2, w, h);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.stroke();
  ctx.fillStyle = '#1b2430';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rock.label, 0, 1);
  ctx.restore();
}

function drawSky(ctx, width, height, stars, t) {
  const deep = ctx.createLinearGradient(0, 0, width * 0.15, height);
  deep.addColorStop(0, '#03050a');
  deep.addColorStop(0.4, '#08101c');
  deep.addColorStop(0.75, '#0b1526');
  deep.addColorStop(1, '#0a121c');
  ctx.fillStyle = deep;
  ctx.fillRect(0, 0, width, height);

  const nebula = (x, y, radius, r, gch, b, a) => {
    const g = ctx.createRadialGradient(x, y, radius * 0.05, x, y, radius);
    g.addColorStop(0, `rgba(${r},${gch},${b},${a})`);
    g.addColorStop(0.55, `rgba(${r},${gch},${b},${a * 0.45})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  };
  // Slow drift so the field feels alive without changing gameplay.
  const driftX = Math.sin(t * 0.12) * width * 0.02;
  const driftY = Math.cos(t * 0.09) * height * 0.015;
  nebula(width * 0.8 + driftX, height * 0.16 + driftY, width * 0.55, 112, 68, 168, 0.42);
  nebula(width * 0.14 - driftX * 0.6, height * 0.82 - driftY, width * 0.48, 24, 110, 128, 0.34);
  nebula(width * 0.58 + driftX * 0.4, height * 0.58, width * 0.32, 196, 92, 58, 0.14);
  nebula(width * 0.32 - driftY, height * 0.24 + driftX * 0.3, width * 0.26, 64, 118, 196, 0.18);

  // Distant world for scale.
  ctx.save();
  ctx.globalAlpha = 0.55;
  const farX = width * 0.88;
  const farY = height * 0.72;
  const farR = Math.min(width, height) * 0.09;
  const far = ctx.createRadialGradient(farX - farR * 0.3, farY - farR * 0.35, farR * 0.1, farX, farY, farR);
  far.addColorStop(0, '#6a8aa8');
  far.addColorStop(0.65, '#2a4058');
  far.addColorStop(1, 'rgba(20,30,45,0)');
  ctx.fillStyle = far;
  ctx.beginPath();
  ctx.arc(farX, farY, farR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180,210,240,.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(farX, farY, farR * 1.55, farR * 0.28, -0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Soft dust lane across the field.
  ctx.save();
  ctx.translate(width * 0.5 + driftX * 0.5, height * 0.48 + driftY);
  ctx.rotate(-0.35);
  const dust = ctx.createLinearGradient(0, -height * 0.1, 0, height * 0.1);
  dust.addColorStop(0, 'rgba(190,210,240,0)');
  dust.addColorStop(0.5, 'rgba(190,210,240,.09)');
  dust.addColorStop(1, 'rgba(190,210,240,0)');
  ctx.fillStyle = dust;
  ctx.fillRect(-width, -height * 0.12, width * 2, height * 0.24);
  ctx.restore();

  stars.forEach(star => {
    const layer = star.layer || 1;
    const twinkle = star.pulse ? 0.6 + 0.4 * Math.sin(t * star.pulse + star.phase) : 1;
    const x = ((star.x + t * 0.003 * layer) % 1) * width;
    const y = star.y * height + Math.sin(t * 0.2 + star.phase) * layer * 0.6;
    ctx.globalAlpha = star.a * twinkle;
    if (star.r >= 1.45) {
      ctx.strokeStyle = star.warm ? '#ffe0b8' : '#eef4ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - star.r * 2.4, y);
      ctx.lineTo(x + star.r * 2.4, y);
      ctx.moveTo(x, y - star.r * 2.4);
      ctx.lineTo(x, y + star.r * 2.4);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.beginPath();
      ctx.arc(x, y, star.r * 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = star.warm ? '#ffe8c8' : '#eef4ff';
    ctx.beginPath();
    ctx.arc(x, y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.52, Math.min(width, height) * 0.22, width * 0.5, height * 0.5, Math.max(width, height) * 0.78);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,.45)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
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

/** Muzzle distance from planet center; shots spawn at this offset. */
function turretReach(r) {
  const cupola = clamp(r * 0.28, 18, 28);
  const barrelLen = clamp(r * 0.55, 36, 58);
  return r + cupola * 0.15 + barrelLen + 6;
}

function drawTurret(ctx, r, flash) {
  // Sit the mount on the rim so the silhouette reads as a turret, not a buried wedge.
  const rim = r;
  const cupola = clamp(r * 0.28, 18, 28);
  const hubX = rim + cupola * 0.15;
  const barrelLen = clamp(r * 0.55, 36, 58);
  const barrelHalf = clamp(r * 0.09, 6, 10);
  const cheek = clamp(r * 0.2, 12, 20);
  const metal = flash ? '#e8edf3' : '#5c6a7c';
  const shade = flash ? '#cfd7e2' : '#3d4756';
  const highlight = flash ? '#f7f9fb' : '#8b98a8';
  const ink = '#1a222e';
  const accent = '#c45c3a';
  const tip = hubX + barrelLen;

  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';

  // Bolted collar on the planet rim.
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(0, 0, rim + 8, -0.9, 0.9);
  ctx.arc(0, 0, rim - 3, 0.9, -0.9, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const a of [-0.62, -0.28, 0.28, 0.62]) {
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (rim + 2.5), Math.sin(a) * (rim + 2.5), 2.6, 0, Math.PI * 2);
    ctx.fillStyle = highlight;
    ctx.fill();
    ctx.stroke();
  }

  // Turret cheeks / trunnion block.
  ctx.fillStyle = shade;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(hubX - cheek * 0.55, -cheek, cheek * 1.15, cheek * 2, 5);
  else ctx.rect(hubX - cheek * 0.55, -cheek, cheek * 1.15, cheek * 2);
  ctx.fill();
  ctx.stroke();

  // Domed cupola.
  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.arc(hubX, 0, cupola, Math.PI * 0.55, Math.PI * 1.45, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(hubX, 0, cupola, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Barrel shroud (wider rear) into the tube.
  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.moveTo(hubX + cupola * 0.35, -barrelHalf * 1.35);
  ctx.lineTo(hubX + cupola * 0.85, -barrelHalf);
  ctx.lineTo(tip - 12, -barrelHalf);
  ctx.lineTo(tip - 12, barrelHalf);
  ctx.lineTo(hubX + cupola * 0.85, barrelHalf);
  ctx.lineTo(hubX + cupola * 0.35, barrelHalf * 1.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Top rail / sight groove so the tube reads as a cannon.
  ctx.strokeStyle = highlight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hubX + cupola * 0.9, -barrelHalf * 0.35);
  ctx.lineTo(tip - 14, -barrelHalf * 0.35);
  ctx.stroke();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5;

  // Muzzle brake.
  ctx.fillStyle = shade;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(tip - 14, -barrelHalf - 3, 10, barrelHalf * 2 + 6, 2);
  else ctx.rect(tip - 14, -barrelHalf - 3, 10, barrelHalf * 2 + 6);
  ctx.fill();
  ctx.stroke();

  // Glowing muzzle.
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(tip - 5, -barrelHalf - 2);
  ctx.lineTo(tip + 6, -barrelHalf * 0.65);
  ctx.lineTo(tip + 6, barrelHalf * 0.65);
  ctx.lineTo(tip - 5, barrelHalf + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#0e131a';
  ctx.beginPath();
  ctx.ellipse(tip + 1, 0, 3.2, barrelHalf * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cupola hatch + optic.
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(hubX - cupola * 0.15, -cupola * 0.2, cupola * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(hubX - cupola * 0.15, -cupola * 0.2, cupola * 0.22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#9ad0e8';
  ctx.beginPath();
  ctx.arc(hubX - cupola * 0.15, -cupola * 0.2, cupola * 0.12, 0, Math.PI * 2);
  ctx.fill();
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
  drawTurret(ctx, r, flash);
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
  const stars = Array.from({ length: 86 }, (_, i) => {
    const bright = i % 11 === 0;
    const mid = i % 5 === 0;
    return {
      x: ((i * 53 + 17) % 100) / 100,
      y: ((i * 29 + 41) % 100) / 100,
      r: bright ? 1.8 : mid ? 1.2 : 0.65 + (i % 3) * 0.08,
      a: bright ? 0.9 : mid ? 0.58 : 0.22 + (i % 4) * 0.07,
      warm: i % 9 === 0,
      pulse: bright || mid ? 1.2 + (i % 4) * 0.35 : 0,
      phase: (i * 0.7) % (Math.PI * 2),
      layer: bright ? 1.4 : mid ? 1 : 0.55
    };
  });
  let width = 640;
  let height = 360;
  let spawned = false;
  let shields = 3;
  let wrecked = false;
  let aim = -Math.PI / 2;
  let spin = 0;
  let skyT = 0;
  let cool = 0;
  let missed = false;
  let phase = 'play';
  let burstLeft = 0;
  let finished = false;
  let downLeft = 0;
  let last = 0;
  const held = { left: false, right: false };
  const planetR = () => clamp(Math.min(width, height) * 0.12, 36, 70);

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
      const pace = [1.02, 0.92, 0.8][size];
      const speed = travel / ((tuning.seconds || 8) / calm) * pace;
      const tone = i % 3;
      const palette = [
        { lit: '#c4c0b8', mid: '#8a857c', shade: '#45423c' },
        { lit: '#b8c0c9', mid: '#7a8490', shade: '#3c444e' },
        { lit: '#c2b4a4', mid: '#8a7a68', shade: '#4a4036' }
      ][tone];
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
        pts: Array.from({ length: 11 + (i % 4) }, (_, p) => {
          const notch = p % 4 === 0 ? 0.58 : 0.72;
          return notch + Math.random() * 0.36;
        }),
        craters: Array.from({ length: 3 + (i % 3) }, (_, c) => ({
          a: (c * 2.15 + i * 0.7) % (Math.PI * 2),
          d: 0.18 + (c % 3) * 0.2,
          s: 0.14 + (c % 2) * 0.1
        })),
        cracks: Array.from({ length: 2 + (i % 2) }, (_, c) => ({
          a: (c * 1.7 + i) % (Math.PI * 2),
          bend: 0.35 + (c % 2) * 0.25,
          d0: 0.15,
          d1: 0.55 + (c % 2) * 0.2
        })),
        lit: palette.lit,
        mid: palette.mid,
        shade: palette.shade,
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
    const muzzle = turretReach(r);
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
    drawSky(ctx, width, height, stars, skyT);
    rocks.forEach(rock => {
      // Show inbound rocks at the rim while they wait, fading up as they start drifting.
      const enter = rock.wait > 0 ? Math.max(0.4, 1 - rock.wait / 1.4) : 1;
      ctx.globalAlpha = enter;
      drawRock(ctx, rock);
      ctx.globalAlpha = 1;
    });
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
    const paused = gamePaused();
    if (!paused) skyT += dt;
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
