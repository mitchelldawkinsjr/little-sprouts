export const LANE_WIDTH = 1.52;
export const BALL_R = 0.53;
export const MAX_HEARTS = 3;
export const VIEW_DISTANCE = 43;
export const FIRST_GATE = 35;
export const GATE_GAP = 57;
export const SHIELD_TIME = 6;
const FINISH_STRETCH = 24;

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function speedAt(distance, level = 2) {
  const pace = [0, 5, 6, 7][level] || 6;
  return pace + Math.min(4.5, distance / 135);
}

export function makeRow(at, previous, rng = Math.random) {
  const lanes = [-1, 0, 1];
  // Keep an adjacent safe lane from the previous row, even on a long arcade run.
  const exits = lanes.filter(lane => previous == null || Math.abs(lane - previous) <= 1);
  const safe = exits[Math.floor(rng() * exits.length)];
  const blocked = lanes.filter(lane => lane !== safe);
  const double = at > 60 && rng() < 0.52;
  const used = double ? blocked : [blocked[Math.floor(rng() * blocked.length)]];
  return { at, safe, obstacles: used.map(lane => ({ lane, kind: rng() < 0.55 ? 'log' : 'pine', hit: false })) };
}

export function makeRun({ learning = false, level = 2, rng = Math.random } = {}) {
  return {
    learning, level, rng,
    distance: 0, lane: 0, x: 0, height: 0, vy: 0,
    hearts: MAX_HEARTS, shield: 0, grace: 0, seeds: 0,
    nextRow: 18, safeLane: 0, nextGate: learning ? FIRST_GATE : Infinity,
    finishAt: Infinity, rows: [], phase: 'run'
  };
}

export function steer(run, direction) {
  if (run.phase === 'run') run.lane = clamp(run.lane + Math.sign(direction), -1, 1);
}

export function jump(run) {
  if (run.phase === 'run' && run.height === 0) run.vy = 6.8;
}

export function reward(run, final = false) {
  if (!run.learning || run.phase !== 'question') return false;
  run.seeds++;
  run.hearts = Math.min(MAX_HEARTS, run.hearts + 1);
  run.shield = SHIELD_TIME;
  if (final) {
    run.nextGate = Infinity;
    run.finishAt = run.distance + FINISH_STRETCH;
  } else run.nextGate += GATE_GAP;
  run.phase = 'run';
  return true;
}

// Simulate small steps so a frame cannot skip a log, tree, or checkpoint.
export function stepRun(run, dt) {
  const events = [];
  for (let remaining = clamp(dt, 0, 0.1); remaining > 1e-7 && run.phase === 'run';) {
    const t = Math.min(remaining, 1 / 90);
    remaining -= t;
    const target = run.lane * LANE_WIDTH;
    run.x += clamp(target - run.x, -t * 7.8, t * 7.8);
    run.height = Math.max(0, run.height + run.vy * t);
    run.vy = run.height > 0 ? run.vy - 16 * t : 0;
    run.grace = Math.max(0, run.grace - t);
    run.shield = Math.max(0, run.shield - t);
    run.distance += speedAt(run.distance, run.level) * t * (run.grace > 0.9 ? 0.68 : 1);

    while (run.nextRow <= run.distance + VIEW_DISTANCE) {
      const at = run.nextRow;
      const gateNear = run.learning && Math.abs(at - run.nextGate) < 5;
      if (!gateNear) {
        const row = makeRow(at, run.safeLane, run.rng);
        run.safeLane = row.safe;
        run.rows.push(row);
      }
      run.nextRow += Math.max(7.4, speedAt(at, run.level) * 1.28) + run.rng() * 2;
    }
    while (run.rows[0]?.at < run.distance - 4) run.rows.shift();
    if (run.distance >= run.finishAt) {
      run.distance = run.finishAt;
      run.phase = 'finished';
      events.push('finish');
      break;
    }
    if (run.distance >= run.nextGate) {
      run.distance = run.nextGate;
      run.phase = 'question';
      events.push('question');
      break;
    }
    for (const row of run.rows) {
      if (Math.abs(row.at - run.distance) > 0.58) continue;
      for (const obstacle of row.obstacles) {
        if (obstacle.hit || Math.abs(obstacle.lane * LANE_WIDTH - run.x) > 0.66) continue;
        if (obstacle.kind === 'log' && run.height > 0.42) continue;
        obstacle.hit = true;
        if (run.shield > 0) events.push('shield');
        else if (run.grace === 0) {
          run.hearts--;
          run.grace = 1.35;
          events.push('bump');
          if (run.hearts === 0) {
            run.phase = 'over';
            events.push('over');
          }
        }
      }
    }
  }
  return events;
}

const BEST_KEY = 'sprouts-pinecone-trail-best-v1';

export function arcadeBest(distance = 0, storage) {
  const meters = Math.max(0, Math.floor(distance));
  try {
    storage ??= globalThis.localStorage;
    const best = Math.max(0, Number(storage?.getItem(BEST_KEY)) || 0);
    if (meters > best) storage?.setItem(BEST_KEY, String(meters));
    return Math.max(best, meters);
  } catch {
    return meters;
  }
}
