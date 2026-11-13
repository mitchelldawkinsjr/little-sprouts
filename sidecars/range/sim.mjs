/* Two ways to play Targets.
   Stand: the learner stays at the counter with a toy paint launcher.
   A question is a row of boards in front of the counter.
   Walk: the learner walks a plaza (map.mjs). The boards stand around it, readable
   from both sides, and the learner hunts for the one to paint.

   In both, match and math rounds paint one board, and the host grades it.
   A wrong board stays up but greys out; the others keep standing.
   Spelling paints one letter at a time. A wrong letter is a slip.
   Stand puts up the next row after each right letter. Walk keeps every letter
   where it stands and takes away the ones already painted.
   The whole word sends one pick. A miss or a slip only pauses the launcher for a moment. */

import { BUILDINGS, GEARS, PLANTER, PROPS, SLOTS, SPAWN, YARD } from './map.mjs';

export const YAW_LIMIT = 0.72;
export const PITCH_MIN = -0.3;
export const PITCH_MAX = 0.34;
export const EYE = 1.6;
export const STAND_DIST = 12;
export const WALK_BOARD = { w: 2, h: 1.5, y: 1.75 };
const WALK_PITCH = 0.9;
const WALK_REACH = 45;
const WALK_SPEED = 3.6;
const BODY = 0.35;
const BOARD_BODY = 1;
const NEAR_SPAWN = 6;
const GEAR_REACH = 0.9;
const MISS_COOL = 0.45;
const SLIP_COOL = 0.9;
const PENDING_S = 2;
const BOARD_PITCH = 0.04;
const BOARD_HALF_PITCH = 0.12;

function wrapAngle(rad) {
  let angle = rad % (Math.PI * 2);
  if (angle > Math.PI) angle -= Math.PI * 2;
  if (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}

function hash(text) {
  let h = 2166136261;
  for (let index = 0; index < text.length; index++) {
    h ^= text.charCodeAt(index);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(seed) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function spellSpecs(state) {
  const ask = state.ask;
  const next = ask.word[state.built.length];
  const want = [3, 4, 5][state.level - 1] || 3;
  let right = null;
  const extras = [];
  ask.letters.forEach((letter, index) => {
    if (state.used[index]) return;
    if (!right && letter === next) right = { index, label: letter };
    else extras.push({ index, label: letter });
  });
  const row = [];
  if (right) row.push(right);
  extras.slice(0, Math.max(0, want - row.length)).forEach(spec => row.push(spec));
  return row.sort((a, b) => a.index - b.index);
}

function specsOf(state) {
  const ask = state.ask;
  if (!ask) return [];
  if (ask.kind === 'spell' && ask.letters.length && state.built.length < ask.word.length) {
    if (state.mode === 'walk') return ask.letters.map((label, index) => ({ index, label })).filter(spec => !state.used[spec.index]);
    return spellSpecs(state);
  }
  return ask.choices.map((choice, index) => ({
    index,
    label: choice.label,
    fill: choice.fill,
    shape: choice.shape
  }));
}

function placeStand(state, specs) {
  const count = specs.length;
  const gap = count <= 1 ? 0 : Math.min(0.34, 1 / (count - 1));
  const halfYaw = count <= 1 ? 0.16 : Math.min(0.15, gap * 0.4);
  const stagger = count >= 4 ? 0.05 : 0;
  state.boards = specs.map((spec, slot) => ({
    ...spec,
    yaw: (slot - (count - 1) / 2) * gap,
    pitch: BOARD_PITCH + (slot % 2 ? stagger : -stagger),
    halfYaw,
    halfPitch: BOARD_HALF_PITCH,
    wrong: false
  }));
}

// Spread the boards over the plaza spots, away from where the learner stands.
function placeWalk(state, specs) {
  const random = seeded(hash(state.askKey || 'walk'));
  const spots = SLOTS.map(slot => ({ ...slot, roll: random() }));
  spots.sort((a, b) => a.roll - b.roll);
  const far = spots.filter(slot => Math.hypot(slot.x - state.x, slot.z - state.z) >= NEAR_SPAWN);
  const pool = far.length >= specs.length ? far : spots;
  state.boards = specs.map((spec, slot) => {
    const spot = pool[slot % pool.length];
    return {
      ...spec,
      x: spot.x,
      y: WALK_BOARD.y,
      z: spot.z,
      face: spot.face,
      w: WALK_BOARD.w,
      h: WALK_BOARD.h,
      wrong: false
    };
  });
}

function placeBoards(state) {
  const specs = specsOf(state);
  state.layout += 1;
  if (state.mode === 'walk') placeWalk(state, specs);
  else placeStand(state, specs);
}

function askKey(ask) {
  const labels = ask.choices.map(choice => choice.label).join('|');
  const letters = (ask.letters || []).join('');
  return [ask.round, ask.kind, ask.prompt, ask.word, labels, letters].join('~');
}

function aimDir(state) {
  const cos = Math.cos(state.pitch);
  return { x: Math.sin(state.yaw) * cos, y: Math.sin(state.pitch), z: -Math.cos(state.yaw) * cos };
}

function standBoardAt(state) {
  let best = null;
  let bestDistance = Infinity;
  state.boards.forEach(board => {
    const dy = Math.abs(wrapAngle(state.yaw - board.yaw));
    const dp = Math.abs(state.pitch - board.pitch);
    if (dy > board.halfYaw || dp > board.halfPitch) return;
    const distance = dy * dy + dp * dp;
    if (distance < bestDistance) {
      best = board;
      bestDistance = distance;
    }
  });
  if (!best) return null;
  // Where the paint lands on the board face, in the board's own units, for the paint splat.
  const across = STAND_DIST * Math.cos(best.pitch);
  return {
    board: best,
    u: STAND_DIST * Math.tan(wrapAngle(state.yaw - best.yaw)),
    v: across * (Math.tan(state.pitch) - Math.tan(best.pitch)),
    side: 1,
    t: STAND_DIST
  };
}

// A ray from the eye against each board's rectangle. The nearest board wins.
function walkBoardAt(state) {
  const dir = aimDir(state);
  let best = null;
  state.boards.forEach(board => {
    const nx = Math.sin(board.face);
    const nz = Math.cos(board.face);
    const facing = dir.x * nx + dir.z * nz;
    if (Math.abs(facing) < 1e-4) return;
    const t = ((board.x - state.x) * nx + (board.z - state.z) * nz) / facing;
    if (t <= 0 || t > WALK_REACH || (best && t >= best.t)) return;
    const hx = state.x + dir.x * t - board.x;
    const hy = EYE + dir.y * t - board.y;
    const hz = state.z + dir.z * t - board.z;
    const u = hx * Math.cos(board.face) - hz * Math.sin(board.face);
    if (Math.abs(u) > board.w / 2 || Math.abs(hy) > board.h / 2) return;
    const side = (state.x - board.x) * nx + (state.z - board.z) * nz >= 0 ? 1 : -1;
    best = { board, t, u, v: hy, side };
  });
  return best;
}

function boardAt(state) {
  return state.mode === 'walk' ? walkBoardAt(state) : standBoardAt(state);
}

function ready(state) {
  return !!state.ask && !state.solved && state.pending == null && state.cooldown <= 0 && state.boards.length > 0;
}

export function createRange(options = {}) {
  return {
    mode: options.mode === 'walk' ? 'walk' : 'stand',
    yaw: 0,
    pitch: BOARD_PITCH,
    x: SPAWN.x,
    z: SPAWN.z,
    boards: [],
    layout: 0,
    gears: GEARS.map(gear => ({ ...gear, taken: false })),
    gearCount: 0,
    ask: null,
    askKey: '',
    used: [],
    built: '',
    solved: false,
    pending: null,
    pendingFor: 0,
    cooldown: 0,
    paints: 0,
    level: 1,
    reduced: !!options.reduced
  };
}

/** Switch between Stand and Walk. The question stays; the boards move to the new ground. */
export function setRangeMode(state, mode) {
  const next = mode === 'walk' ? 'walk' : 'stand';
  if (next === state.mode) return false;
  state.mode = next;
  state.yaw = next === 'walk' ? SPAWN.yaw : 0;
  state.pitch = BOARD_PITCH;
  if (next === 'walk') {
    state.x = SPAWN.x;
    state.z = SPAWN.z;
  }
  if (state.ask && !state.solved) placeBoards(state);
  else {
    // A solved question has nothing left to paint. Clear the old ground's boards.
    state.boards = [];
    state.layout += 1;
  }
  return true;
}

export function assignAsk(state, ask) {
  if (!ask || !Array.isArray(ask.choices) || !ask.choices.length) return false;
  const key = askKey(ask);
  if (key === state.askKey) return false;
  state.askKey = key;
  state.ask = {
    round: ask.round,
    kind: ask.kind || '',
    prompt: ask.prompt || '',
    show: ask.show || '',
    word: ask.word || '',
    total: Math.max(0, Math.round(+ask.total) || 0),
    letters: Array.isArray(ask.letters) ? ask.letters.map(letter => String(letter)) : [],
    choices: ask.choices.map(choice => ({
      label: String(choice.label),
      fill: choice.fill || '',
      shape: choice.shape || ''
    }))
  };
  state.used = state.ask.letters.map(() => false);
  state.built = '';
  state.solved = false;
  state.pending = null;
  state.pendingFor = 0;
  state.cooldown = 0;
  state.level = Math.min(3, Math.max(1, Math.round(+ask.level) || 1));
  placeBoards(state);
  return true;
}

/** Move the aim by a small step. Drag, keys, and buttons all come through here. Walk can turn all the way round. */
export function nudgeRange(state, yaw, pitch) {
  if (state.mode === 'walk') {
    state.yaw = wrapAngle(state.yaw + (+yaw || 0));
    state.pitch = clamp(state.pitch + (+pitch || 0), -WALK_PITCH, WALK_PITCH);
    return;
  }
  state.yaw = clamp(state.yaw + (+yaw || 0), -YAW_LIMIT, YAW_LIMIT);
  state.pitch = clamp(state.pitch + (+pitch || 0), PITCH_MIN, PITCH_MAX);
}

/** Point straight at a board. Tests use it; a tap can use it too. */
export function aimAtBoard(state, index) {
  const board = state.boards.find(item => item.index === index);
  if (!board) return false;
  if (state.mode === 'walk') {
    const dx = board.x - state.x;
    const dz = board.z - state.z;
    state.yaw = Math.atan2(dx, -dz);
    state.pitch = clamp(Math.atan2(board.y - EYE, Math.hypot(dx, dz)), -WALK_PITCH, WALK_PITCH);
    return true;
  }
  state.yaw = clamp(board.yaw, -YAW_LIMIT, YAW_LIMIT);
  state.pitch = clamp(board.pitch, PITCH_MIN, PITCH_MAX);
  return true;
}

function pushOut(state) {
  const limit = YARD - 0.8;
  state.x = clamp(state.x, -limit, limit);
  state.z = clamp(state.z, -limit, limit);
  BUILDINGS.forEach(box => {
    const dx = state.x - box.x;
    const dz = state.z - box.z;
    const ox = box.hw + BODY - Math.abs(dx);
    const oz = box.hd + BODY - Math.abs(dz);
    if (ox <= 0 || oz <= 0) return;
    if (ox < oz) state.x += Math.sign(dx || 1) * ox;
    else state.z += Math.sign(dz || 1) * oz;
  });
  const circles = PROPS.filter(prop => prop.r > 0)
    .concat([PLANTER])
    .concat(state.boards.map(board => ({ x: board.x, z: board.z, r: BOARD_BODY })));
  circles.forEach(circle => {
    const dx = state.x - circle.x;
    const dz = state.z - circle.z;
    const reach = circle.r + BODY;
    const distance = Math.hypot(dx, dz);
    if (distance >= reach) return;
    if (distance < 1e-6) {
      state.z += reach;
      return;
    }
    state.x = circle.x + (dx / distance) * reach;
    state.z = circle.z + (dz / distance) * reach;
  });
}

/** Walk mode only: forward and strafe are -1..1 sticks. Returns gear pickups. */
export function walkRange(state, forward, strafe, dt) {
  const events = [];
  if (state.mode !== 'walk') return events;
  const span = clamp(+dt || 0, 0, 0.1);
  let f = clamp(+forward || 0, -1, 1);
  let s = clamp(+strafe || 0, -1, 1);
  const length = Math.hypot(f, s);
  if (length > 1) {
    f /= length;
    s /= length;
  }
  const speed = WALK_SPEED * (state.reduced ? 0.72 : 1) * span;
  const beforeX = state.x;
  const beforeZ = state.z;
  state.x += (Math.sin(state.yaw) * f + Math.cos(state.yaw) * s) * speed;
  state.z += (-Math.cos(state.yaw) * f + Math.sin(state.yaw) * s) * speed;
  pushOut(state);
  pushOut(state);
  state.gears.forEach((gear, index) => {
    if (gear.taken || Math.hypot(gear.x - state.x, gear.z - state.z) > GEAR_REACH) return;
    gear.taken = true;
    state.gearCount += 1;
    events.push({ type: 'gear', index });
  });
  if (state.gears.every(gear => gear.taken)) state.gears.forEach(gear => { gear.taken = false; });
  events.moved = Math.hypot(state.x - beforeX, state.z - beforeZ);
  return events;
}

function hitSpell(state, board, events) {
  const next = state.ask.word[state.built.length];
  if (board.label !== next) {
    state.cooldown = SLIP_COOL;
    events.push({ type: 'slip', index: board.index });
    return;
  }
  state.used[board.index] = true;
  state.built += next;
  events.push({ type: 'letter', index: board.index });
  if (state.built === state.ask.word) {
    state.solved = true;
    state.boards = [];
    events.push({ type: 'pick', index: 0 });
    return;
  }
  if (state.mode === 'walk') state.boards = state.boards.filter(item => item.index !== board.index);
  else placeBoards(state);
}

function hitChoice(state, board, events) {
  state.pending = board.index;
  state.pendingFor = 0;
  events.push({ type: 'pick', index: board.index });
}

/** Launch one paint ball at where the learner is looking. Returns local events plus any pick or slip for the host. */
export function paintRange(state) {
  const events = [];
  if (!ready(state)) return events;
  state.paints += 1;
  const found = boardAt(state);
  if (!found || found.board.wrong) {
    state.cooldown = MISS_COOL;
    events.push({ type: 'miss' });
    return events;
  }
  const { board, u, v, side, t } = found;
  events.push({ type: 'hit', index: board.index, u, v, side, t });
  if (state.ask.kind === 'spell') hitSpell(state, board, events);
  else hitChoice(state, board, events);
  return events;
}

/** Typed letters paint the matching board for the learner. Only a whole word sends a pick. */
export function typeRange(state, raw) {
  const events = [];
  const ask = state.ask;
  if (!ask || ask.kind !== 'spell' || !ready(state)) return events;
  const chars = String(raw || '').match(/[a-zA-Z']/g) || [];
  for (const ch of chars) {
    if (state.built.length >= ask.word.length) break;
    const next = ask.word[state.built.length];
    if (ch.toLowerCase() !== String(next).toLowerCase()) {
      state.cooldown = SLIP_COOL;
      events.push({ type: 'slip' });
      break;
    }
    const board = state.boards.find(item => item.label === next && !state.used[item.index]);
    if (!board) break;
    hitSpell(state, board, events);
    if (state.solved) break;
  }
  return events;
}

export function markRange(state, ok) {
  const picked = state.pending;
  state.pending = null;
  state.pendingFor = 0;
  if (!state.ask) return;
  if (ok) {
    state.solved = true;
    state.cooldown = 0;
    return;
  }
  const spell = state.ask.kind === 'spell';
  if (spell && state.built === state.ask.word) {
    // The host turned down a finished word. Start the letters over.
    state.solved = false;
    state.built = '';
    state.used = state.ask.letters.map(() => false);
    placeBoards(state);
  } else if (!spell) {
    const board = state.boards.find(item => item.index === picked);
    if (board) board.wrong = true;
  }
  state.cooldown = SLIP_COOL;
}

/** The round is over: take the boards down until the next round starts. */
export function clearRange(state) {
  state.ask = null;
  state.askKey = '';
  state.boards = [];
  state.layout += 1;
  state.pending = null;
  state.solved = false;
  state.built = '';
}

export function stepRange(state, dt) {
  const span = Math.max(0, +dt || 0);
  if (state.cooldown > 0) state.cooldown = Math.max(0, state.cooldown - span);
  if (state.pending != null) {
    state.pendingFor += span;
    if (state.pendingFor > PENDING_S) {
      state.pending = null;
      state.pendingFor = 0;
    }
  }
}
