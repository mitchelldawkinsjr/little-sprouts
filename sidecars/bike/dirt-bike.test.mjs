import assert from 'node:assert/strict';
import test from 'node:test';
import { armRide, createRideState, difficultyFromLevel, stepRide, surfaceY, terrainHeight } from './dirt-bike.js';

const reward = { boostUntil: 0, slowUntil: 0 };
const baseline = 400;

function ride(diff, input, seconds) {
  const state = createRideState(diff, baseline);
  const frames = Math.round(seconds / 0.016);
  for (let i = 0; i < frames; i++) stepRide(state, input, 0.016, diff, baseline, reward, i * 16);
  return state;
}

test('a tap of the throttle stays far under the speed cap', () => {
  const diff = difficultyFromLevel(1, false);
  const tapped = ride(diff, { go: true }, 0.1);
  assert.ok(tapped.speed > 0);
  assert.ok(tapped.speed < diff.speedCap * 0.15, tapped.speed);
  const held = ride(diff, { go: true }, 3);
  assert.ok(held.speed <= diff.speedCap);
  assert.ok(held.speed > diff.speedCap * 0.9, held.speed);
});

test('letting go settles toward a roll', () => {
  const diff = difficultyFromLevel(1, false);
  const state = createRideState(diff, baseline);
  for (let i = 0; i < 180; i++) stepRide(state, {}, 0.016, diff, baseline, reward, i * 16);
  assert.ok(Math.abs(state.speed - diff.cruise) < 8, state.speed);
  assert.equal(state.grounded, true);
});

test('jump leaves the ground and a level 1 landing stays upright', () => {
  const diff = difficultyFromLevel(1, false);
  const state = createRideState(diff, baseline);
  state.speed = 80;
  const jumped = stepRide(state, { jump: true }, 0.016, diff, baseline, reward, 0);
  assert.equal(jumped.landed, 'jump');
  assert.equal(state.grounded, false);
  assert.ok(state.vy < 0);
  state.angle = 2;
  state.vy = 80;
  state.y = surfaceY(state.x, baseline, diff) - 4;
  let landed = '';
  for (let i = 0; i < 30 && state.grounded === false; i++) {
    landed = stepRide(state, {}, 0.016, diff, baseline, reward, 1000 + i * 16).landed;
  }
  assert.equal(state.grounded, true);
  assert.equal(landed, 'stick');
});

test('a steep landing on level 3 sets the bike back on its wheels more slowly', () => {
  const diff = difficultyFromLevel(3, false);
  const state = createRideState(diff, baseline);
  state.grounded = false;
  state.vx = 100;
  state.speed = 100;
  state.vy = 60;
  state.angle = 1.8;
  state.y = surfaceY(state.x, baseline, diff) - 2;
  let landed = { landed: '' };
  for (let i = 0; i < 40 && !state.grounded; i++) landed = stepRide(state, {}, 0.016, diff, baseline, reward, 2000 + i * 16);
  assert.equal(landed.landed, 'wipe');
  assert.equal(state.grounded, true);
  assert.ok(state.speed < 60, state.speed);
});

test('the track has ramps above the surrounding hills', () => {
  const diff = difficultyFromLevel(2, false);
  let low = Infinity;
  let high = -Infinity;
  for (let x = 0; x < 1400; x += 8) {
    const h = terrainHeight(x, diff);
    low = Math.min(low, h);
    high = Math.max(high, h);
  }
  assert.ok(high - low > diff.ramp * 0.8, high - low);
});

test('holding the gas keeps the bike on the dirt', () => {
  const diff = difficultyFromLevel(3, false);
  const state = createRideState(diff, baseline);
  let air = 0;
  for (let i = 0; i < 500; i++) {
    stepRide(state, { go: true }, 0.016, diff, baseline, reward, i * 16);
    if (!state.grounded) air++;
  }
  assert.equal(air, 0);
  assert.ok(state.speed > diff.speedCap * 0.9);
});

test('leaning back on level 2 lifts the front wheel and level 1 stays with the hill', () => {
  const leaned = difficultyFromLevel(2, false);
  const state = createRideState(leaned, baseline);
  state.speed = 90;
  for (let i = 0; i < 50; i++) stepRide(state, { go: true, left: true }, 0.016, leaned, baseline, reward, i * 16);
  assert.ok(state.pose < -0.4, state.pose);
  assert.equal(state.grounded, true);
  assert.ok(state.speed < leaned.speedCap);
  const upright = ride(difficultyFromLevel(1, false), { go: true, left: true }, 1);
  assert.ok(Math.abs(upright.pose) < 0.08, upright.pose);
});

test('a question waits for a stretch of track', () => {
  const diff = difficultyFromLevel(3, false);
  const state = createRideState(diff, baseline);
  armRide(state);
  let asked = false;
  for (let i = 0; i < 40; i++) {
    asked = stepRide(state, { go: true }, 0.016, diff, baseline, reward, i * 16).ask;
  }
  assert.equal(asked, false);
  state.x = state.anchor + diff.gap;
  assert.equal(stepRide(state, { go: true }, 0.016, diff, baseline, reward, 900).ask, true);
});
