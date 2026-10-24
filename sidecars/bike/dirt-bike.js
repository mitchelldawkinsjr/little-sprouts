/* Dirt ride. Original Little Sprouts game, MIT License. See LICENSE.
   The parent app owns learner profiles. This module only rides. */

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function wrap(angle) {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/** Lift of the dirt above the baseline, in pixels. Positive is up the screen. */
export function terrainHeight(x, diff) {
  const hill = Math.sin(x * 0.0068) * diff.hill + Math.sin(x * 0.0155 + 1.4) * diff.hill * 0.33;
  const whoops = Math.sin(x * 0.042) * diff.hill * 0.1;
  return hill + whoops + rampLift(x, diff.ramp);
}

function rampLift(x, height) {
  const span = 1360;
  const local = ((x % span) + span) % span;
  const start = 560;
  const rise = 250;
  const flat = 100;
  const fall = 210;
  const t = local - start;
  if (t < 0 || t > rise + flat + fall) return 0;
  if (t < rise) return height * (t / rise);
  if (t < rise + flat) return height;
  return height * (1 - (t - rise - flat) / fall);
}

export function surfaceY(x, baseline, diff) {
  return baseline - terrainHeight(x, diff);
}

export function slopeAt(x, baseline, diff) {
  const step = 72;
  return Math.atan2(surfaceY(x + step, baseline, diff) - surfaceY(x - step, baseline, diff), step * 2);
}

export function difficultyFromLevel(level, reduced) {
  const lv = Math.min(3, Math.max(1, level | 0 || 1));
  const rows = {
    1: { hill: 26, ramp: 64, speedCap: 170, cruise: 64, gap: 4200, landLimit: 2.6, airControl: false, accel: 76 },
    2: { hill: 40, ramp: 108, speedCap: 200, cruise: 60, gap: 4000, landLimit: 0.9, airControl: true, accel: 80 },
    3: { hill: 52, ramp: 136, speedCap: 220, cruise: 56, gap: 3800, landLimit: 0.65, airControl: true, accel: 84 }
  };
  const row = { level: lv, reduced: !!reduced, ...rows[lv] };
  if (reduced) {
    row.hill *= 0.35;
    row.ramp *= 0.4;
    row.speedCap = 120;
    row.cruise = 48;
    row.gap = 4600;
    row.landLimit = 2.6;
    row.airControl = false;
    row.accel = 60;
  }
  return row;
}

export function createRideState(diff, baseline) {
  const x = 0;
  return {
    x,
    y: surfaceY(x, baseline, diff),
    vx: 0,
    vy: 0,
    speed: 0,
    angle: slopeAt(x, baseline, diff),
    angVel: 0,
    grounded: true,
    jumpHeld: false,
    wheel: 0,
    pose: 0,
    squat: 0.15,
    anchor: 0,
    idle: 0,
    live: false,
    noticeUntil: 0,
    dust: []
  };
}

export function armRide(state) {
  state.live = true;
  state.anchor = state.x;
  state.idle = 0;
}

/**
 * One physics step. Speed builds while gas is held. A short tap cannot reach the cap.
 * Jump leaves the ground. Landing compares the bike angle with the slope.
 */
export function stepRide(state, input, dt, diff, baseline, reward, nowMs) {
  const go = !!input?.go;
  const brake = !!input?.brake;
  const left = !!input?.left;
  const right = !!input?.right;
  const edge = !!(input?.jump && !state.jumpHeld);
  state.jumpHeld = !!input?.jump;
  const step = clamp(dt || 0, 0, 0.05);
  const boosts = reward || {};
  const now = nowMs || 0;
  const boosting = now < (boosts.boostUntil || 0);
  const slowing = now < (boosts.slowUntil || 0);
  let landed = '';
  if (input?.paused || step === 0) return { ask: false, landed };

  const cap = diff.speedCap + (boosting ? 36 : 0);
  if (state.grounded) {
    let accel = 0;
    if (slowing || brake) accel = -240;
    else if (go || boosting) accel = boosting ? diff.accel * 1.65 : diff.accel;
    state.speed += accel * step;
    state.speed += Math.sin(slopeAt(state.x, baseline, diff)) * 55 * step;
    if (!go && !brake && !boosting && !slowing) state.speed += (diff.cruise - state.speed) * Math.min(1, step * 1.6);
    state.speed = clamp(state.speed, -28, cap);
    state.x += state.speed * step;
    state.y = surfaceY(state.x, baseline, diff);
    const slope = slopeAt(state.x, baseline, diff);
    state.angle += wrap(slope - state.angle) * Math.min(1, step * 16);
    state.angVel = 0;
    state.vx = state.speed;
    state.vy = 0;
    const wantPose = diff.airControl ? (left ? -0.7 : 0) + (right ? 0.32 : 0) : 0;
    state.pose += (wantPose - state.pose) * Math.min(1, step * 5);
    state.squat += ((go ? 0.72 : 0.16) - state.squat) * Math.min(1, step * 7);
    if (go && state.speed > 36 && Math.random() < step * 16) {
      state.dust.push({ x: state.x - 46, y: state.y, life: 0.55, rise: 16 + Math.random() * 34 });
    }
    if (edge) {
      state.grounded = false;
      state.vx = state.speed;
      state.vy = -420;
      state.angle = wrap(slope + clamp(state.pose, -0.28, 0.2));
      state.pose = 0;
      state.squat = 0.2;
      landed = 'jump';
    }
  } else {
    state.vy += 1250 * step;
    if (go && !slowing) state.vx += 18 * step;
    if (brake || slowing) state.vx -= 50 * step;
    state.vx = clamp(state.vx, -28, cap);
    state.x += state.vx * step;
    state.y += state.vy * step;
    if (diff.airControl) {
      const lean = (right ? 1 : 0) - (left ? 1 : 0);
      state.angVel += lean * 3.5 * step;
      state.angVel *= Math.exp(-1.5 * step);
      state.angVel = clamp(state.angVel, -2.1, 2.1);
      state.angle += state.angVel * step;
    } else {
      const slope = slopeAt(state.x, baseline, diff);
      state.angVel = 0;
      state.angle += wrap(slope - state.angle) * Math.min(1, step * 6);
    }
    state.pose += (0 - state.pose) * Math.min(1, step * 6);
    state.squat += (0.1 - state.squat) * Math.min(1, step * 4);
    const ground = surfaceY(state.x, baseline, diff);
    if (state.y >= ground && state.vy >= 0) {
      const slope = slopeAt(state.x, baseline, diff);
      const tipped = diff.airControl && Math.abs(wrap(state.angle - slope)) > diff.landLimit;
      state.y = ground;
      state.vy = 0;
      state.grounded = true;
      state.angle = slope;
      state.angVel = 0;
      state.pose = 0;
      state.squat = 1;
      state.speed = clamp(state.vx, -28, cap);
      if (tipped) {
        state.speed = Math.max(0, state.speed * 0.45);
        state.noticeUntil = now + 1400;
        landed = 'wipe';
      } else landed = 'stick';
      state.vx = state.speed;
      state.dust.push({ x: state.x, y: ground, life: 0.35 });
    }
  }
  state.wheel += state.speed * step * 0.18;
  state.dust = state.dust.filter(bit => {
    bit.life -= step;
    return bit.life > 0;
  });
  if (Math.abs(state.speed) < 10) state.idle += step;
  else state.idle = 0;
  const ask = !!state.live && (state.x - state.anchor >= diff.gap || state.idle >= 18);
  return { ask, landed };
}

function createAudio() {
  let ctx = null;
  let engine = null;
  let master = null;
  let enabled = true;
  let muted = false;
  function context() {
    if (!enabled || muted) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.03;
      master.connect(ctx.destination);
      engine = ctx.createOscillator();
      engine.type = 'triangle';
      engine.frequency.value = 78;
      const tone = ctx.createGain();
      tone.gain.value = 0.4;
      engine.connect(tone);
      tone.connect(master);
      engine.start();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  return {
    setEnabled(on) { enabled = !!on; if (!enabled && master) master.gain.value = 0; },
    toggle() {
      muted = !muted;
      if (master) master.gain.value = muted || !enabled ? 0 : 0.03;
      return muted;
    },
    muted() { return muted || !enabled; },
    hum(speed) {
      if (!context() || !engine) return;
      engine.frequency.setTargetAtTime(72 + clamp(speed, 0, 240) * 0.28, ctx.currentTime, 0.12);
    },
    blip(freq) {
      if (!context()) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    },
    stop() {
      try { engine?.stop(); } catch { /* already stopped */ }
      try { ctx?.close(); } catch { /* already closed */ }
    }
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function knobby(ctx, x, y, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.fillStyle = '#1c1612';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a3128';
  for (let i = 0; i < 14; i++) {
    ctx.save();
    ctx.rotate((i / 14) * Math.PI * 2);
    ctx.fillRect(-3.2, -20.5, 6.4, 5.5);
    ctx.restore();
  }
  ctx.fillStyle = '#f4f0e6';
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b7b0a2';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6);
  }
  ctx.stroke();
  ctx.fillStyle = '#db8b32';
  ctx.beginPath();
  ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function coachLine(diff, state, now) {
  if (now < state.noticeUntil) return 'Steady. The bike is back on its wheels.';
  if (!state.grounded && diff.airControl) return 'Nose up or down, then land on both wheels.';
  if (!state.grounded) return 'The bike stays upright.';
  if (diff.airControl && diff.level >= 3) return 'Lean back to lift the front wheel. Jump the ramp.';
  if (diff.airControl) return 'Lean back on the gas. Jump off a ramp.';
  return 'Hold the arrow. The bike speeds up slowly.';
}

/**
 * Embeddable ride. Difficulty, rewards, and ride position come from the parent.
 * hooks.onQuestion fires after a stretch of track. hooks.onProgress reports distance.
 */
export function createDirtBike(canvas, hooks = {}) {
  const ctx = canvas.getContext('2d');
  let diff = difficultyFromLevel(1, false);
  let baseline = 200;
  let viewW = 320;
  let viewH = 180;
  let state = createRideState(diff, baseline);
  const reward = { boostUntil: 0, slowUntil: 0, scaleBoost: 1, scaleSlow: 1 };
  const input = { go: false, brake: false, jump: false, left: false, right: false, paused: false };
  const audio = createAudio();
  let last = 0;
  let report = 0;
  let running = true;
  let coach = '';

  function measure() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    viewW = Math.max(280, rect.width || 320);
    viewH = Math.max(180, rect.height || 200);
    canvas.width = Math.round(viewW * dpr);
    canvas.height = Math.round(viewH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    baseline = viewH * 0.64;
    if (state.grounded) {
      state.y = surfaceY(state.x, baseline, diff);
      state.angle = slopeAt(state.x, baseline, diff);
    }
  }

  function paintHill(color, parallax, lift, scale) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    const origin = viewW * 0.32;
    for (let x = 0; x <= viewW; x += 8) {
      const world = state.x * parallax + (x - origin);
      const n = Math.sin(world * 0.004) * diff.hill + Math.sin(world * 0.011 + 2) * diff.hill * 0.4;
      ctx.lineTo(x, baseline - lift - n * scale);
    }
    ctx.lineTo(viewW, viewH);
    ctx.fill();
  }

  function paintTrack() {
    ctx.fillStyle = '#9a6236';
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    const origin = viewW * 0.32;
    for (let x = 0; x <= viewW; x += 8) {
      const world = state.x + (x - origin);
      ctx.lineTo(x, surfaceY(world, baseline, diff));
    }
    ctx.lineTo(viewW, viewH);
    ctx.fill();
    ctx.strokeStyle = '#c4844a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = 0; x <= viewW; x += 8) {
      const world = state.x + (x - origin);
      const y = surfaceY(world, baseline, diff);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(74, 42, 22, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= viewW; x += 8) {
      const world = state.x + (x - origin);
      const y = surfaceY(world, baseline, diff) + 10;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let x = 0; x <= viewW; x += 18) {
      const world = state.x + (x - origin);
      const n = Math.sin(world * 12.9898) * 43758.5453;
      const speck = n - Math.floor(n);
      if (speck < 0.55) continue;
      const y = surfaceY(world, baseline, diff) + 8 + speck * 18;
      ctx.fillStyle = speck > 0.82 ? '#6e4528' : '#c49a6a';
      ctx.beginPath();
      ctx.ellipse(x, y, 2 + speck * 3, 1.4 + speck, speck * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function paintBike() {
    const origin = viewW * 0.32;
    const ground = surfaceY(state.x, baseline, diff);
    const lift = Math.max(0, ground - state.y);
    const rear = -40;
    const front = 48;
    const pose = state.pose || 0;
    ctx.fillStyle = 'rgba(90, 50, 24, 0.28)';
    ctx.beginPath();
    ctx.ellipse(origin + rear * 0.15, ground + 6, Math.max(18, 46 - lift * 0.04), 6, state.angle * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(origin, state.y);
    ctx.rotate(state.angle);
    const axle = pose < 0 ? rear : front;
    ctx.translate(axle, 0);
    ctx.rotate(pose);
    ctx.translate(-axle, 0);
    ctx.scale(1.45, 1.45);
    const drop = (state.squat || 0) * 6;
    knobby(ctx, rear, -20, state.wheel);
    knobby(ctx, front, -20, state.wheel + 0.4);
    ctx.strokeStyle = '#5c5348';
    ctx.fillStyle = '#6b6258';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(rear + 4, -20);
    ctx.quadraticCurveTo(-18, -8, -8, -16 + drop);
    ctx.stroke();
    ctx.strokeStyle = '#244b3d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(rear, -20);
    ctx.lineTo(-10, -36 + drop);
    ctx.moveTo(-16, -24);
    ctx.lineTo(-8, -40 + drop);
    ctx.stroke();
    ctx.strokeStyle = '#d7decc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(22, -44 + drop);
    ctx.lineTo(front - 2, -22);
    ctx.moveTo(28, -42 + drop);
    ctx.lineTo(front + 3, -22);
    ctx.stroke();
    ctx.fillStyle = '#f3e2c4';
    ctx.beginPath();
    ctx.ellipse(front, -30, 16, 6, -0.5, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rear + 2, -32, 14, 5, 0.4, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#244b3d';
    roundRect(ctx, -18, -46 + drop, 26, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#1a3a2e';
    ctx.fillRect(-14, -40 + drop, 8, 6);
    ctx.fillStyle = '#db8b32';
    ctx.beginPath();
    ctx.ellipse(6, -50 + drop, 16, 9, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b241c';
    ctx.beginPath();
    ctx.ellipse(-8, -48 + drop, 16, 5, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#244b3d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, -46 + drop);
    ctx.lineTo(8, -62 + drop);
    ctx.lineTo(30, -60 + drop);
    ctx.stroke();
    ctx.strokeStyle = '#1c1612';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(6, -62 + drop);
    ctx.lineTo(32, -60 + drop);
    ctx.stroke();
    ctx.fillStyle = '#f7f4ea';
    ctx.fillRect(4, -66 + drop, 6, 5);
    ctx.fillRect(26, -64 + drop, 6, 5);
    ctx.fillStyle = '#f3e2c4';
    roundRect(ctx, 24, -58 + drop, 12, 14, 2);
    ctx.fill();
    ctx.fillStyle = '#32634e';
    ctx.beginPath();
    ctx.ellipse(30, -52 + drop, 3, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#32634e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, -50 + drop);
    ctx.lineTo(-8, -68 + drop);
    ctx.moveTo(-8, -60 + drop);
    ctx.lineTo(16, -60 + drop);
    ctx.stroke();
    ctx.fillStyle = '#6f9a5c';
    ctx.beginPath();
    ctx.arc(-8, -74 + drop, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d5eef8';
    ctx.fillRect(-12, -76 + drop, 10, 4);
    ctx.fillStyle = '#32634e';
    ctx.beginPath();
    ctx.ellipse(-12, -80 + drop, 5, 3, -0.6, 0, Math.PI * 2);
    ctx.ellipse(-4, -79 + drop, 5, 3, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, viewH);
    sky.addColorStop(0, '#d5eef8');
    sky.addColorStop(1, '#f4efe4');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.fillStyle = '#f0c24d';
    ctx.beginPath();
    ctx.arc(viewW * 0.8, viewH * 0.16, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.beginPath();
    ctx.ellipse(viewW * 0.22, viewH * 0.2, 36, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(viewW * 0.55, viewH * 0.14, 28, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    paintHill('#e4d2a4', 0.28, viewH * 0.14, 0.45);
    paintTrack();
    state.dust.forEach(bit => {
      const origin = viewW * 0.32;
      ctx.fillStyle = `rgba(122, 78, 42, ${Math.max(0, bit.life)})`;
      const rise = (bit.rise || 12) * (1 - bit.life);
      ctx.beginPath();
      ctx.arc(origin + (bit.x - state.x), bit.y - 6 - rise, 3 + (0.55 - bit.life) * 8, 0, Math.PI * 2);
      ctx.fill();
    });
    paintBike();
  }

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = last ? Math.min(0.033, (now - last) / 1000) : 0;
    last = now;
    if (!viewW) measure();
    const result = stepRide(state, input, dt, diff, baseline, reward, now);
    if (result.landed === 'jump') audio.blip(520);
    if (result.landed === 'stick') audio.blip(180);
    if (result.landed === 'wipe') audio.blip(90);
    if (!input.paused) audio.hum(state.speed);
    if (result.ask) hooks.onQuestion?.();
    const line = coachLine(diff, state, now);
    if (line !== coach) {
      coach = line;
      hooks.onCoach?.(line);
    }
    if (!input.paused) {
      report += dt;
      if (report >= 4) {
        report = 0;
        hooks.onProgress?.(progress());
      }
    }
    draw();
  }

  function progress() {
    return {
      travel: state.x,
      speed: state.speed,
      grounded: state.grounded,
      level: diff.level
    };
  }

  measure();
  requestAnimationFrame(frame);

  return {
    press(name, down) {
      if (!(name in input) || name === 'paused') return;
      input[name] = !!down;
      if (down) audio.hum(state.speed);
    },
    releaseAll() {
      input.go = input.brake = input.jump = input.left = input.right = false;
    },
    pause() {
      input.paused = true;
      input.go = input.brake = input.jump = input.left = input.right = false;
    },
    resume() {
      input.paused = false;
      armRide(state);
    },
    arm() { armRide(state); },
    setDifficulty(partial = {}) {
      const level = partial.level ?? diff.level;
      const reduced = typeof partial.reduced === 'boolean' ? partial.reduced : diff.reduced;
      const next = difficultyFromLevel(level, reduced);
      if (Number.isFinite(partial.hills)) next.hill = partial.hills;
      if (Number.isFinite(partial.ramp)) next.ramp = partial.ramp;
      if (Number.isFinite(partial.speed)) next.speedCap = partial.speed;
      if (Number.isFinite(partial.gap)) next.gap = partial.gap;
      diff = next;
      if (state.grounded) state.y = surfaceY(state.x, baseline, diff);
    },
    setReward(partial = {}) {
      if (Number.isFinite(partial.boost)) reward.scaleBoost = partial.boost;
      if (Number.isFinite(partial.slow)) reward.scaleSlow = partial.slow;
    },
    grant(ok, now = performance.now()) {
      if (ok) reward.boostUntil = now + 1600 * (reward.scaleBoost || 1);
      else reward.slowUntil = now + 2000 * (reward.scaleSlow || 1);
    },
    setProgress(partial = {}) {
      if (!Number.isFinite(partial.travel) || partial.travel <= 0) return;
      state.x = Math.max(0, partial.travel);
      state.grounded = true;
      state.vy = 0;
      state.vx = 0;
      state.y = surfaceY(state.x, baseline, diff);
      state.angle = slopeAt(state.x, baseline, diff);
      state.pose = 0;
      armRide(state);
    },
    setAudio(on) { audio.setEnabled(on); },
    toggleMute() { return audio.toggle(); },
    getProgress: progress,
    status() {
      return { level: diff.level, airControl: diff.airControl, reduced: diff.reduced, grounded: state.grounded };
    },
    resize: measure,
    destroy() {
      running = false;
      audio.stop();
    }
  };
}
