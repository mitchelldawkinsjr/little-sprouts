export const LANE_WIDTH = 1;
export const WORLD_RADIUS = 26;
export const SPEED = WORLD_RADIUS * .48;
export const ROW_GAP = SPEED / 2;
export const FIRST_ROW = ROW_GAP * 2;
export const FIRST_CHECKPOINT = FIRST_ROW + ROW_GAP * 1.5;
export const CHECKPOINT_GAP = ROW_GAP * 12;
export const START_HEARTS = 3;
export const CHECKPOINT_COUNTDOWN_MS = 2000;

export function makeRun({ seed = 0, learning = false } = {}) {
  return {
    seed, learning, distance: 0, lane: 0, x: 0, lift: 0, vy: 0,
    hearts: learning ? START_HEARTS : 1, shield: false, nextGate: FIRST_CHECKPOINT,
    gatePending: false, resumeAt: null, ended: false
  };
}

function hash(n) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}

// Each row has one or two trees. Visual placement and collision use the same seeded layout.
export function rowLanes(index, seed = 0) {
  const pattern = hash((index + 1) ^ seed);
  const first = pattern % 3;
  if (pattern & 4) return [first - 1];
  return [first - 1, (first + 1 + (pattern & 1)) % 3 - 1];
}

export const rowDistance = index => FIRST_ROW + index * ROW_GAP;
export const rowAt = distance => Math.floor((distance - FIRST_ROW) / ROW_GAP + 1e-9);
export const score = run => Math.floor(run.distance / ROW_GAP + 1e-9);

function grounded(run) {
  return !run.ended && !run.gatePending && run.lift === 0 && run.vy === 0;
}

export function steer(run, dir) {
  if (!grounded(run)) return;
  const lane = Math.max(-1, Math.min(1, run.lane + dir));
  if (lane === run.lane) return;
  run.lane = lane;
  run.vy = 3.6;
}

export function hop(run) {
  if (grounded(run)) run.vy = 6.6;
}

// Called with a frame step of at most 50 ms. A tree row is judged once, at crossing.
export function step(run, dt) {
  if (run.ended || run.gatePending) return '';
  const from = run.distance;
  run.distance += SPEED * dt;
  run.x += (run.lane * LANE_WIDTH - run.x) * (1 - Math.exp(-dt * 13));
  if (run.vy || run.lift) {
    run.lift += run.vy * dt - 9 * dt * dt;
    run.vy -= 18 * dt;
    if (run.lift <= 0) run.lift = run.vy = 0;
  }
  const row = rowAt(run.distance);
  if (row >= 0 && row !== rowAt(from) && run.lift < .75
    && rowLanes(row, run.seed).some(lane => Math.abs(lane * LANE_WIDTH - run.x) < .58)) {
    if (run.shield) { run.shield = false; return 'shield'; }
    run.ended = --run.hearts === 0;
    return run.ended ? 'end' : 'bump';
  }
  if (run.learning && run.distance >= run.nextGate) {
    run.gatePending = true;
    return 'gate';
  }
  return '';
}

// A right answer charges the shield now, but leaves the course frozen.
export function startCheckpointCountdown(run, now) {
  if (!run.gatePending || run.ended) return;
  run.shield = true;
  run.resumeAt = now + CHECKPOINT_COUNTDOWN_MS;
}

// The rendered number is the number of seconds still showing. Zero resumes play.
export function checkpointSeconds(run, now) {
  if (run.resumeAt === null) return null;
  const seconds = Math.max(0, Math.ceil((run.resumeAt - now) / 1000));
  if (seconds === 0) {
    run.resumeAt = null;
    run.nextGate += CHECKPOINT_GAP;
    run.gatePending = false;
  }
  return seconds;
}
