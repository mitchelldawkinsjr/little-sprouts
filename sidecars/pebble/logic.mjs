export const LANE_WIDTH = 1.8;
export const ROW_GAP = 12;
export const CHECKPOINT_GAP = 56;
export const START_HEARTS = 3;
export const WORLD_RADIUS = 34;

export function makeRun() {
  return {
    distance: 0, lane: 0, x: 0, lift: 0, vy: 0,
    hearts: START_HEARTS, shield: false, nextGate: CHECKPOINT_GAP,
    gatePending: false, ended: false
  };
}

// One or two occupied lanes per row, so there is always a way through.
export function rowLanes(index) {
  const first = (index * 5 + Math.floor(index / 4)) % 3;
  const second = (first + 1 + index % 2) % 3;
  return index % 4 < 2 ? [first - 1] : [first - 1, second - 1];
}

export function steer(run, dir) {
  if (!run.ended && !run.gatePending) run.lane = Math.max(-1, Math.min(1, run.lane + dir));
}

export function hop(run) {
  if (!run.ended && !run.gatePending && run.lift === 0 && run.vy === 0) run.vy = 8.5;
}

// Fixed-size frames come from the renderer (at most 50 ms). A row is judged once at crossing.
export function step(run, dt, { learning = false, level = 1 } = {}) {
  if (run.ended || run.gatePending) return '';
  const speed = Math.min(14, 7.5 + (level - 1) * 1.1 + run.distance / 95);
  const from = run.distance;
  run.distance += speed * dt;
  run.x += (run.lane * LANE_WIDTH - run.x) * Math.min(1, dt * 15);
  if (run.vy || run.lift) {
    run.lift += run.vy * dt - 11 * dt * dt;
    run.vy -= 22 * dt;
    if (run.lift <= 0) run.lift = run.vy = 0;
  }
  const row = Math.floor(run.distance / ROW_GAP);
  if (row !== Math.floor(from / ROW_GAP) && run.lift < 0.66
    && rowLanes(row).some(lane => Math.abs(lane * LANE_WIDTH - run.x) < 0.82)) {
    if (run.shield) { run.shield = false; return 'shield'; }
    run.ended = --run.hearts === 0;
    return run.ended ? 'end' : 'bump';
  }
  if (learning && run.distance >= run.nextGate) {
    run.gatePending = true;
    return 'gate';
  }
  return '';
}

export function chargeShield(run) {
  if (!run.gatePending || run.ended) return;
  run.shield = true;
  run.nextGate += CHECKPOINT_GAP;
  run.gatePending = false;
}
