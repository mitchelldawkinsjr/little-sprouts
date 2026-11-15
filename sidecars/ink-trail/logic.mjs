/** Ink Trail runs on a forward-only scroll. Each pen sample is permanent until it passes offscreen. */
export const PEN_AHEAD = 174;
export const PEN_WOBBLE = 2.4;
export const INK_BOOST = 3.5;
export const COUNT_IN = 2;
export const FIRST_QUESTION = 560;
export const QUESTION_SPACING = 730;
const GAP = { start: 114, max: 152, near: 33, catch: 16 };
const STEP = 5;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const yInBounds = y => clamp(y, 0.12, 0.86);

function seedTrail(run, y = 0.5) {
  run.trail = [];
  const first = Math.floor((run.distance - 330) / STEP) * STEP;
  for (let x = first; x <= run.distance + PEN_AHEAD; x += STEP) {
    run.trail.push({ x, y, ink: true, style: 'clean' });
  }
  run.penY = run.buddyY = y;
  run.onInk = true;
}

export function makeRun({ learning = false, level = 1 } = {}) {
  const run = {
    phase: 'run', learning, level, time: 0, distance: 0,
    gap: GAP.start, wobble: 0, boost: 0, safe: 0, dots: 0,
    nextQuestion: learning ? FIRST_QUESTION : Infinity,
    finishAt: Infinity, objects: [], spawn: 410, row: 0
  };
  seedTrail(run);
  return run;
}

/** Linear interpolation in the stored stroke. A gap is not a valid running surface. */
export function strokeAt(trail, x) {
  const n = clamp((x - trail[0].x) / STEP, 0, trail.length - 1);
  const i = Math.floor(n);
  const a = trail[i];
  const b = trail[i + 1] || a;
  return { y: a.y + (b.y - a.y) * (n - i), ink: a.ink && (n === i || b.ink) };
}

function extendStroke(run, target, drawing, dt) {
  const first = run.trail[0];
  const last = run.trail.at(-1);
  const aim = drawing ? yInBounds(target) : run.penY;
  // Limit sharp turns. The wobble is deterministic, independent of frame rate.
  run.penY += clamp(aim - run.penY, -dt * 1.25, dt * 1.25);
  const end = run.distance + PEN_AHEAD;
  for (let x = last.x + STEP; x <= end; x += STEP) {
    const wavy = run.wobble > 0;
    const y = run.penY + (wavy ? (0.052 * Math.sin(x / 10) + 0.029 * Math.sin(x / 4.5)) : 0);
    // A wrong answer skips little dabs, but never takes control away from the child.
    const ink = drawing && (!wavy || Math.floor(x / 35) % 4 !== 2);
    run.trail.push({ x, y: yInBounds(y), ink, style: wavy ? 'wobble' : run.boost > 0 ? 'gold' : 'clean' });
  }
  const old = Math.floor((run.distance - 365 - first.x) / STEP);
  if (old > 0) run.trail.splice(0, old);
}

const ROWS = [[0.3, 0.69], [0.58, 0.31], [0.24, 0.58], [0.68, 0.32], [0.44, 0.71], [0.65, 0.26]];

function addObjects(run) {
  while (run.spawn < run.distance + 760) {
    const [wash, dot] = ROWS[run.row++ % ROWS.length];
    run.objects.push({ x: run.spawn, y: wash, type: 'wash', used: false });
    run.objects.push({ x: run.spawn + 65, y: dot, type: 'dot', used: false });
    run.spawn += 230;
  }
  run.objects = run.objects.filter(item => item.x > run.distance - 370);
}

export function stepRun(run, dt, { target = 0.5, drawing = false } = {}) {
  if (run.phase !== 'run' || !(dt > 0)) return [];
  const events = [];
  const before = run.distance;
  run.time += dt;
  run.distance += dt * (109 + (run.level - 1) * 11 + (run.learning ? 0 : Math.min(49, run.time * 0.44)) + (run.boost > 0 ? 32 : 0));
  run.distance = Math.min(run.distance, run.nextQuestion, run.finishAt);
  extendStroke(run, target, drawing, dt);
  const track = strokeAt(run.trail, run.distance);
  run.onInk = track.ink;
  run.buddyY = track.ink ? track.y : run.buddyY + (track.y - run.buddyY) * Math.min(1, dt * 7);
  run.gap += dt * (track.ink ? -(1.3 + (run.level - 1) * 0.8 + (run.learning ? 0 : Math.min(4.4, run.time * 0.043))) : -26);
  if (run.boost > 0 && track.ink) run.gap += dt * 10;
  if (run.safe > 0) run.gap = Math.max(GAP.near, run.gap);
  addObjects(run);
  for (const item of run.objects) {
    if (item.used || item.x <= before || item.x > run.distance) continue;
    const at = strokeAt(run.trail, item.x);
    if (Math.abs(at.y - item.y) > (item.type === 'dot' ? 0.057 : 0.09)) continue;
    if (item.type === 'dot') {
      if (!at.ink) continue;
      run.dots++;
      run.gap += 23;
    } else if (run.safe <= 0 && run.boost <= 0) {
      run.gap = Math.max(Math.min(run.gap, GAP.near), run.gap - 22);
      run.safe = 0.85;
    } else continue;
    item.used = true;
    events.push(item.type);
  }
  run.gap = Math.min(GAP.max, run.gap);
  run.wobble = Math.max(0, run.wobble - dt);
  run.boost = Math.max(0, run.boost - dt);
  run.safe = Math.max(0, run.safe - dt);
  if (run.distance >= run.finishAt) {
    run.phase = 'finished';
    events.push('finish');
  } else if (run.gap <= GAP.catch) {
    run.phase = 'caught';
    events.push('caught');
  } else if (run.distance >= run.nextQuestion) {
    run.phase = 'question';
    events.push('question');
  }
  return events;
}

/** Leave the card on either result. After a miss, retry that same question after the ink recovers. */
export function answer(run, ok, final = false) {
  if (run.phase !== 'question') return false;
  if (ok) {
    run.boost = INK_BOOST;
    run.wobble = 0;
    run.gap = Math.min(GAP.max, run.gap + 36);
    run.nextQuestion = final ? Infinity : run.distance + QUESTION_SPACING;
    if (final) run.finishAt = run.distance + 400;
  } else {
    run.wobble = PEN_WOBBLE;
    run.nextQuestion = run.distance + 480;
    // Let the child see and recover from the wobble, even if the boss was close.
    run.gap = Math.max(run.gap, 71);
  }
  run.phase = 'run';
  return true;
}

/** Learning retries keep distance and the host's current question. Arcade starts a new run. */
export function resumeCaught(run) {
  if (run.phase !== 'caught' || !run.learning) return false;
  seedTrail(run, run.buddyY);
  run.phase = 'run';
  run.gap = GAP.start;
  run.safe = 2;
  return true;
}
