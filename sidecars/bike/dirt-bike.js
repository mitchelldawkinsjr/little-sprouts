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

function slopeAt(x, baseline, diff) {
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
