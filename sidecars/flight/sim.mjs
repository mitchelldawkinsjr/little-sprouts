/* Cruise model: hold a steady height and steer the nose.
   A question is a row of gates. The right gate finishes it.
   A wrong gate slows the plane and turns it back toward that same row.
   A short round opens free flight after that many right answers.
   A usual round opens it after five. Free flight lasts two minutes.
   The plane keeps flying where the nose points. Forward goes faster,
   back flies backward, and slide moves sideways. */

import { CRUISE_ALT, METERS, groundMeters } from './terrain.mjs';

const AHEAD = 70;
const RECOVER_S = 2;
export const FREE_EVERY = 5;
export const FREE_S = 120;
const FREE_CEILING = 4500;
const PITCH_LIMIT = Math.PI / 2 - 0.02;

function wrapAngle(rad) {
  let angle = rad % (Math.PI * 2);
  if (angle > Math.PI) angle -= Math.PI * 2;
  if (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function cruise(state) {
  const base = [16, 19, 23][state.level - 1] || 16;
  return state.reduced ? base * 0.62 : base;
}

function spellSpecs(state) {
  const ask = state.ask;
  const next = ask.word[state.built.length];
  const want = [3, 4, 4][state.level - 1] || 3;
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
  if (ask.kind === 'spell' && ask.letters.length && state.built.length < ask.word.length) return spellSpecs(state);
  return ask.choices.map((choice, index) => ({
    index,
    label: choice.label,
    fill: choice.fill,
    shape: choice.shape
  }));
}

function placeGates(state) {
  const specs = specsOf(state);
  const count = specs.length;
  const yaw = state.yaw;
  const forwardX = Math.sin(yaw);
  const forwardZ = Math.cos(yaw);
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);
  const gap = count <= 1 ? 0 : Math.min(16, 52 / Math.max(1, count - 1));
  const half = count <= 1 ? 5.5 : gap * 0.36;
  state.gateYaw = yaw;
  state.gates = specs.map((spec, index) => {
    const offset = (index - (count - 1) / 2) * gap;
    return {
      ...spec,
      x: state.x + forwardX * AHEAD + rightX * offset,
      z: state.z + forwardZ * AHEAD + rightZ * offset,
      half
    };
  });
}

function centroid(state) {
  let x = 0;
  let z = 0;
  state.gates.forEach(gate => {
    x += gate.x;
    z += gate.z;
  });
  const count = state.gates.length || 1;
  return { x: x / count, z: z / count };
}

function near(state, gate) {
  const dx = state.x - gate.x;
  const dz = state.z - gate.z;
  const reach = gate.half * 0.92;
  return dx * dx + dz * dz <= reach * reach;
}

function outside(state) {
  return !state.gates.some(gate => near(state, gate));
}

function forwardOf(state, gate) {
  const dx = gate.x - state.x;
  const dz = gate.z - state.z;
  return dx * Math.sin(state.yaw) + dz * Math.cos(state.yaw);
}

function askKey(ask) {
  const labels = ask.choices.map(choice => choice.label).join('|');
  const letters = (ask.letters || []).join('');
  return [ask.round, ask.kind, ask.prompt, ask.word, labels, letters].join('~');
}

function beginRecover(state) {
  const center = state.gates.length ? centroid(state) : { x: state.x, z: state.z + 1 };
  const yaw = state.gateYaw || 0;
  state.faceYaw = yaw;
  state.aimX = center.x - Math.sin(yaw) * 46;
  state.aimZ = center.z - Math.cos(yaw) * 46;
  state.recover = RECOVER_S;
  state.lockout = true;
  state.boost = 0;
  state.speed = cruise(state) * 0.35;
}

export function createFlight(options = {}) {
  return {
    x: 0,
    z: 0,
    yaw: 0,
    speed: 16,
    bank: 0,
    gates: [],
    ask: null,
    askKey: '',
    used: [],
    built: '',
    solved: false,
    pending: null,
    pendingFor: 0,
    lockout: false,
    recover: 0,
    boost: 0,
    steer: 0,
    pitch: 0,
    thrust: 0,
    strafe: 0,
    nose: 0,
    alt: CRUISE_ALT,
    lift: 0,
    free: 0,
    crashed: false,
    over: false,
    rights: 0,
    freeEvery: FREE_EVERY,
    queued: null,
    aimX: 0,
    aimZ: 1,
    level: 1,
    reduced: !!options.reduced
  };
}

export function steerFlight(state, steer) {
  state.steer = Math.max(-1, Math.min(1, steer || 0));
}

export function pitchFlight(state, pitch) {
  state.pitch = Math.max(-1, Math.min(1, pitch || 0));
}

export function thrustFlight(state, thrust) {
  state.thrust = Math.max(-1, Math.min(1, thrust || 0));
}

export function strafeFlight(state, strafe) {
  state.strafe = Math.max(-1, Math.min(1, strafe || 0));
}

export function assignAsk(state, ask) {
  if (!ask || !Array.isArray(ask.choices) || !ask.choices.length) return false;
  const key = askKey(ask);
  if (state.free > 0 || state.over) {
    state.queued = ask;
    return false;
  }
  if (key === state.askKey) return false;
  state.askKey = key;
  state.ask = {
    round: ask.round,
    kind: ask.kind || '',
    prompt: ask.prompt || '',
    show: ask.show || '',
    word: ask.word || '',
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
  state.lockout = false;
  state.recover = 0;
  state.level = Math.min(3, Math.max(1, Math.round(+ask.level) || 1));
  const every = Math.round(+ask.freeEvery);
  if (every >= 1 && every <= FREE_EVERY) state.freeEvery = every;
  placeGates(state);
  return true;
}

function worldOf(state) {
  return { x: state.x * METERS, z: -state.z * METERS };
}

export function beginArcade(state) {
  beginFree(state);
  state.arcade = true;
}

function beginFree(state) {
  const where = worldOf(state);
  const clear = groundMeters(where.x, where.z) + 160;
  state.free = FREE_S;
  state.over = false;
  state.crashed = false;
  state.gates = [];
  state.solved = true;
  state.lockout = true;
  state.recover = 0;
  state.boost = 0;
  state.pitch = 0;
  state.lift = Math.max(0, clear - state.alt);
}

export function markFlight(state, ok) {
  if (state.free > 0 || state.over) return;
  state.pending = null;
  state.pendingFor = 0;
  if (ok) {
    state.solved = true;
    state.gates = [];
    state.lockout = false;
    state.recover = 0;
    state.boost = 1.2;
    state.rights += 1;
    if (state.rights % (state.freeEvery || FREE_EVERY) === 0) beginFree(state);
    return;
  }
  beginRecover(state);
}

function hitSpell(state, gate, events) {
  const next = state.ask.word[state.built.length];
  if (gate.label !== next) {
    beginRecover(state);
    events.push({ type: 'slip' });
    return;
  }
  state.used[gate.index] = true;
  state.built += next;
  if (state.built === state.ask.word) {
    state.solved = true;
    state.gates = [];
    state.lockout = false;
    state.boost = 1.2;
    events.push({ type: 'pick', index: 0 });
    return;
  }
  state.boost = 0.45;
  placeGates(state);
}

export function typeSpell(state, raw) {
  const events = [];
  const ask = state.ask;
  if (!ask || ask.kind !== 'spell' || state.solved || state.recover > 0) return events;
  const chars = String(raw || '').match(/[a-zA-Z']/g) || [];
  for (const ch of chars) {
    if (state.built.length >= ask.word.length) break;
    const next = ask.word[state.built.length];
    if (ch.toLowerCase() !== String(next).toLowerCase()) {
      beginRecover(state);
      events.push({ type: 'slip' });
      break;
    }
    const gate = state.gates.find(item => item.label === next && !state.used[item.index]);
    if (!gate) break;
    hitSpell(state, gate, events);
    if (state.solved) break;
  }
  return events;
}

function hitChoice(state, gate, events) {
  const center = centroid(state);
  state.aimX = center.x;
  state.aimZ = center.z;
  state.pending = gate.index;
  state.pendingFor = 0;
  state.lockout = true;
  events.push({ type: 'pick', index: gate.index });
}

function stepOpen(state, dt, events) {
  if (!state.arcade) state.free = Math.max(0, state.free - dt);
  const calm = state.reduced ? 0.55 : 1;
  state.yaw += state.steer * 1.15 * calm * dt;
  state.nose = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, state.nose + state.pitch * 0.95 * calm * dt));
  const pace = cruise(state) * 2.2 * calm;
  const along = state.thrust < 0 ? state.thrust * pace : pace * (1 + state.thrust * 0.75);
  const side = state.strafe * pace * 0.75;
  const ahead = Math.cos(state.nose);
  state.x += (Math.sin(state.yaw) * along * ahead + Math.cos(state.yaw) * side) * dt;
  state.z += (Math.cos(state.yaw) * along * ahead - Math.sin(state.yaw) * side) * dt;
  state.alt += Math.sin(state.nose) * along * METERS * dt;
  if (state.lift > 0) {
    const rise = Math.min(state.lift, 220 * dt);
    state.alt += rise;
    state.lift -= rise;
  }
  const where = worldOf(state);
  const ground = groundMeters(where.x, where.z);
  if (state.lift <= 0 && state.alt <= ground + 8) {
    state.alt = ground + 8;
    state.crashed = true;
    state.over = true;
    state.free = 0;
    state.nose = -0.55;
    state.speed = 0;
    events.push({ type: 'over', crashed: true });
    return;
  }
  state.alt = Math.min(FREE_CEILING, state.alt);
  if (!state.arcade && state.free === 0) {
    state.over = true;
    state.speed = 0;
    events.push({ type: 'over', crashed: false });
    return;
  }
  state.speed = Math.abs(along);
  const tilt = state.steer * 0.55;
  state.bank += (tilt - state.bank) * Math.min(1, dt * 6);
}

function stepOnce(state, dt) {
  const events = [];
  if (state.over) return events;
  if (state.free > 0) {
    stepOpen(state, dt, events);
    return events;
  }
  const turning = state.recover > 0;
  if (turning) {
    const diff = wrapAngle((state.faceYaw || 0) - state.yaw);
    const step = Math.PI * dt / 1.1;
    state.yaw += Math.max(-step, Math.min(step, diff));
    const glide = Math.min(1, dt * 1.6);
    state.x += (state.aimX - state.x) * glide;
    state.z += (state.aimZ - state.z) * glide;
    state.recover = Math.max(0, state.recover - dt);
    state.speed = cruise(state) * 0.35;
  } else {
    state.yaw += state.steer * 1.15 * dt;
  }

  if (state.pending != null) {
    state.pendingFor += dt;
    if (state.pendingFor > 1.5) {
      state.pending = null;
      state.pendingFor = 0;
      state.lockout = false;
    }
  }
  if (state.boost > 0) state.boost = Math.max(0, state.boost - dt);

  let target = cruise(state);
  if (turning) target *= 0.35;
  if (state.boost > 0) target *= 1.65;
  if (!turning) {
    state.speed += (target - state.speed) * Math.min(1, dt * 4);
    state.x += Math.sin(state.yaw) * state.speed * dt;
    state.z += Math.cos(state.yaw) * state.speed * dt;
  }

  const tilt = turning ? Math.max(-1, Math.min(1, wrapAngle((state.faceYaw || 0) - state.yaw))) * 0.7 : state.steer * 0.5;
  state.bank += (tilt - state.bank) * Math.min(1, dt * 6);

  if (turning || state.pending != null || state.solved || !state.gates.length) return events;
  if (state.lockout) {
    if (outside(state)) state.lockout = false;
    return events;
  }

  let best = null;
  let bestDistance = Infinity;
  state.gates.forEach(gate => {
    const dx = state.x - gate.x;
    const dz = state.z - gate.z;
    const distance = dx * dx + dz * dz;
    const reach = gate.half * 0.92;
    if (distance <= reach * reach && distance < bestDistance) {
      best = gate;
      bestDistance = distance;
    }
  });
  if (best) {
    if (state.ask?.kind === 'spell') hitSpell(state, best, events);
    else hitChoice(state, best, events);
    return events;
  }

  const passed = state.gates.every(gate => forwardOf(state, gate) < -20);
  if (passed) placeGates(state);
  return events;
}

export function stepFlight(state, dt) {
  const span = Math.min(0.25, Math.max(0, +dt || 0));
  const chunks = Math.max(1, Math.ceil(span / 0.05));
  const step = span / chunks;
  const events = [];
  for (let index = 0; index < chunks; index++) events.push(...stepOnce(state, step));
  return events;
}
