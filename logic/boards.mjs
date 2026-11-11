import { pointSegmentDistance } from './geom.mjs';

export function laneCount(level, wordCount) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  const want = [3, 4, 5][index];
  return Math.min(want, Math.max(0, wordCount | 0));
}

export function rocketSubject(index) {
  return index % 2 === 0 ? 'math' : 'words';
}

export function rocketZone(altitude) {
  const n = Math.min(1, Math.max(0, +altitude || 0));
  if (n >= 0.9) return 'Space';
  if (n >= 0.65) return 'Stars';
  if (n >= 0.4) return 'Sky';
  if (n >= 0.18) return 'Clouds';
  return 'Garden';
}

export function fuelSeconds(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return [18, 12, 8][index];
}

const HOOK_CASTS = [
  { id: 'pond', name: 'Sunny pond', fish: 3, drop: 0.11, trash: 0 },
  { id: 'cove', name: 'Kelp cove', fish: 4, drop: 0.16, trash: 1 },
  { id: 'deep', name: 'Deep water', fish: 5, drop: 0.22, trash: 2 }
];

export function hookCast(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...HOOK_CASTS[index] };
}

const SKY_WAVES = [
  { rocks: 3, foes: 1, drift: 34, foe: 26, bolt: 80, aim: 2.6 },
  { rocks: 4, foes: 2, drift: 50, foe: 38, bolt: 110, aim: 1.9 },
  { rocks: 5, foes: 3, drift: 68, foe: 52, bolt: 140, aim: 1.35 }
];

export function skyWave(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...SKY_WAVES[index] };
}

const PLANET_WAVES = [
  { rocks: 3, seconds: 10 },
  { rocks: 4, seconds: 8 },
  { rocks: 5, seconds: 6 }
];

export function planetWave(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...PLANET_WAVES[index] };
}

const PUZZLE_BOARDS = [
  { pieces: 2, outline: true },
  { pieces: 4, outline: false },
  { pieces: 6, outline: false }
];

export function puzzleBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...PUZZLE_BOARDS[index] };
}

const MARBLE_TRACKS = [
  { colors: 3, speed: 26, quota: 4, step: 8, gap: 32, chain: 14 },
  { colors: 4, speed: 36, quota: 6, step: 10, gap: 30, chain: 18 },
  { colors: 5, speed: 48, quota: 8, step: 12, gap: 28, chain: 22 }
];

export function marbleTrack(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...MARBLE_TRACKS[index] };
}

export function marbleLevel(points, step) {
  const size = Math.max(1, Math.round(+step) || 1);
  return 1 + Math.floor(Math.max(0, +points || 0) / size);
}

const BRIDGE_SPANS = [
  { gap: 86, pad: 84, grow: 150 },
  { gap: 128, pad: 62, grow: 190 },
  { gap: 168, pad: 46, grow: 230 }
];

export function bridgeSpan(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...BRIDGE_SPANS[index] };
}

export function bridgeReach(length, near, far) {
  const stick = +length || 0;
  return stick >= near && stick <= far;
}

export function bridgeWindow(easy, near, far) {
  const span = Math.max(0, far - near);
  if (easy) return { near: near - span * 0.45, far: far + span * 0.35 };
  const mid = (near + far) / 2;
  const half = Math.max(6, span * 0.12);
  return { near: mid - half, far: mid + half };
}

const MAZE_CLOCKS = [
  { seconds: 50, cols: 7, rows: 9, holes: 2, bonus: 12 },
  { seconds: 40, cols: 9, rows: 11, holes: 4, bonus: 10 },
  { seconds: 30, cols: 11, rows: 13, holes: 6, bonus: 8 }
];

export function mazeClock(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...MAZE_CLOCKS[index] };
}

const CHASE_BOARDS = [
  { cols: 9, rows: 7, bugs: 1, player: 3.4, bug: 2.15, copies: 2, choices: 3 },
  { cols: 11, rows: 9, bugs: 2, player: 3.8, bug: 2.7, copies: 3, choices: 4 },
  { cols: 13, rows: 9, bugs: 3, player: 4.2, bug: 3.15, copies: 3, choices: 5 }
];

export function chaseBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...CHASE_BOARDS[index] };
}

const HOP_BOARDS = [
  { choices: 3, gap: 78, width: 102, gravity: 420, drift: 0, lives: 4 },
  { choices: 4, gap: 90, width: 90, gravity: 500, drift: 0, lives: 3 },
  { choices: 5, gap: 102, width: 80, gravity: 580, drift: 28, lives: 2 }
];

export function hopBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...HOP_BOARDS[index] };
}

const TOAST_BOARDS = [
  { choices: 3, lives: 5, flight: 3400, minFlight: 2200, gap: 1000, minGap: 560 },
  { choices: 4, lives: 4, flight: 2800, minFlight: 1800, gap: 800, minGap: 460 },
  { choices: 5, lives: 3, flight: 2200, minFlight: 1400, gap: 620, minGap: 380 }
];

export function toastBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...TOAST_BOARDS[index] };
}

const AISLE_BOARDS = [
  { choices: 3, seconds: 32 },
  { choices: 4, seconds: 26 },
  { choices: 5, seconds: 20 }
];

export function aisleBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...AISLE_BOARDS[index] };
}

const LILY_BOARDS = [
  { choices: 3, lives: 4, roads: 2, rivers: 2, speed: 1.35 },
  { choices: 4, lives: 3, roads: 3, rivers: 2, speed: 1.9 },
  { choices: 5, lives: 2, roads: 3, rivers: 3, speed: 2.45 }
];

export function lilyBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...LILY_BOARDS[index] };
}

const BUST_BOARDS = [
  { choices: 3, seconds: 15, bob: 2.6, colorScore: 5, whiteScore: 1 },
  { choices: 4, seconds: 12, bob: 2.0, colorScore: 5, whiteScore: 1 },
  { choices: 5, seconds: 9, bob: 1.45, colorScore: 5, whiteScore: 1 }
];

export function bustBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...BUST_BOARDS[index] };
}

export function lilyPads(choices, cols = 5) {
  const width = Math.max(1, Math.round(+cols) || 1);
  const n = Math.max(1, Math.min(width, Math.round(+choices) || 1));
  if (n === 1) return [Math.floor((width - 1) / 2)];
  const used = new Set();
  const pads = [];
  for (let i = 0; i < n; i++) {
    let col = Math.round((i * (width - 1)) / (n - 1));
    while (used.has(col)) col += 1;
    used.add(col);
    pads.push(col);
  }
  return pads;
}

export function lilyOverlap(x, w, otherX, otherW) {
  return x < otherX + otherW && otherX < x + w;
}

const STACK_BOARDS = [
  { choices: 3, lives: 4, rows: 8, cycle: 3200 },
  { choices: 4, lives: 3, rows: 10, cycle: 2500 },
  { choices: 5, lives: 2, rows: 10, cycle: 1800 }
];

export function stackBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { cols: 7, ...STACK_BOARDS[index] };
}

// The carnival tower starts three blocks wide, then two, then one.
export function stackRowWidth(row) {
  const n = Math.max(0, Math.round(+row) || 0);
  if (n < 2) return 3;
  if (n < 5) return 2;
  return 1;
}

// Higher rows cross the well faster. The steps match the pen's 2.5s row.
export function stackCycle(base, row) {
  const ms = Math.max(400, Math.round(+base) || 2500);
  const n = Math.max(0, Math.round(+row) || 0);
  if (n > 7) return Math.round(ms * 0.34);
  if (n > 5) return Math.round(ms * 0.5);
  if (n > 3) return Math.round(ms * 0.6);
  if (n > 1) return Math.round(ms * 0.8);
  return ms;
}

export function stackLand(prevLeft, prevWidth, nextLeft, nextWidth) {
  const a0 = Math.round(+prevLeft);
  const aw = Math.max(0, Math.round(+prevWidth) || 0);
  const b0 = Math.round(+nextLeft);
  const bw = Math.max(0, Math.round(+nextWidth) || 0);
  const left = Math.max(Number.isFinite(a0) ? a0 : 0, Number.isFinite(b0) ? b0 : 0);
  const right = Math.min((Number.isFinite(a0) ? a0 : 0) + aw, (Number.isFinite(b0) ? b0 : 0) + bw);
  const width = right - left;
  if (width <= 0 || aw <= 0 || bw <= 0) return { ok: false, left: Number.isFinite(b0) ? b0 : 0, width: 0 };
  return { ok: true, left, width };
}

// Stops include one miss past each end so every choice can sit on the tower.
export function stackStops(column, width) {
  const c = Math.round(+column) || 0;
  const w = Math.max(1, Math.round(+width) || 1);
  const stops = [];
  for (let left = c - w; left <= c + 1; left++) stops.push(left);
  return stops;
}

export function stackStopsArcade(width, cols = 7) {
  const span = Math.max(1, Math.round(+cols) || 1);
  const w = Math.max(1, Math.min(span, Math.round(+width) || 1));
  const stops = [];
  for (let left = 0; left <= span - w; left++) stops.push(left);
  return stops;
}

export function stackPick(left, width, column) {
  const index = Math.round(+column) - Math.round(+left);
  const w = Math.max(0, Math.round(+width) || 0);
  if (!Number.isFinite(index) || index < 0 || index >= w) return -1;
  return index;
}

const LAMP_BOARDS = [
  { choices: 3, courses: 6 },
  { choices: 4, courses: 8 },
  { choices: 5, courses: 10 }
];

export function lampBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...LAMP_BOARDS[index] };
}

// Stones sit along the shore. A crowded shore uses smaller stones so the taps stay apart.
export function lampStones(count, width = 520, height = 560) {
  const n = Math.max(1, Math.min(5, Math.round(+count) || 1));
  const wide = Math.max(240, +width || 520);
  const tall = Math.max(320, +height || 560);
  const left = wide * 0.14;
  const right = wide * 0.86;
  const gap = n === 1 ? 80 : (right - left) / (n - 1);
  const r = Math.max(22, Math.min(34, gap * 0.38));
  const stones = [];
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? wide / 2 : left + gap * i;
    stones.push({ x, y: tall * 0.8, r });
  }
  return stones;
}

export function lampPick(point, stones) {
  if (!point || !Array.isArray(stones)) return -1;
  const px = +point.x;
  const py = +point.y;
  if (!Number.isFinite(px) || !Number.isFinite(py)) return -1;
  for (let i = stones.length - 1; i >= 0; i--) {
    const stone = stones[i];
    const dx = px - stone.x;
    const dy = py - stone.y;
    const r = +stone.r || 34;
    if (dx * dx + dy * dy <= r * r) return i;
  }
  return -1;
}

// 0 is full day. 1 is night, when the last course is set.
export function lampSky(built, total) {
  const done = Math.max(0, +built || 0);
  const need = Math.max(1, +total || 1);
  return Math.max(0, Math.min(1, done / need));
}

export function lilyRide(x, w, logs) {
  let best = null;
  let cover = 0;
  for (const log of logs || []) {
    if (!lilyOverlap(x, w, log.x, log.w)) continue;
    const overlap = Math.min(x + w, log.x + log.w) - Math.max(x, log.x);
    if (overlap > cover) {
      cover = overlap;
      best = log;
    }
  }
  return best;
}

const MOLE_BOARDS = [
  { choices: 3, holes: 3, lives: 5, up: 1700, gap: 480 },
  { choices: 4, holes: 5, lives: 4, up: 1200, gap: 360 },
  { choices: 5, holes: 5, lives: 3, up: 860, gap: 280 }
];

export function moleBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...MOLE_BOARDS[index] };
}

const CUBE_BOARDS = [
  { choices: 3, lives: 4, spawn: 2.8, rush: 1 },
  { choices: 4, lives: 3, spawn: 2.0, rush: 1.35 },
  { choices: 5, lives: 2, spawn: 1.4, rush: 1.75 }
];

export function cubeBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...CUBE_BOARDS[index] };
}

// Answer cubes stand in a row across the path. One cube sits in the middle.
export function cubeLanes(count, width = 7) {
  const n = Math.max(1, Math.min(6, Math.round(+count) || 1));
  const span = Math.max(1, +width || 7);
  if (n === 1) return [0];
  const lanes = [];
  for (let i = 0; i < n; i++) lanes.push(-span / 2 + (span * i) / (n - 1));
  return lanes;
}

export function cubeOverlap(a, b) {
  if (!a || !b) return false;
  const ax = +a.x, ay = +a.y, az = +a.z;
  const bx = +b.x, by = +b.y, bz = +b.z;
  if (![ax, ay, az, bx, by, bz].every(Number.isFinite)) return false;
  const aw = +a.w || 1, ah = +a.h || 1, ad = +a.d || 1;
  const bw = +b.w || 1, bh = +b.h || 1, bd = +b.d || 1;
  return Math.abs(ax - bx) * 2 <= aw + bw
    && Math.abs(ay - by) * 2 <= ah + bh
    && Math.abs(az - bz) * 2 <= ad + bd;
}

// Five holes at most, staggered high and low the way the mole pen lays them out.
export function moleHoles(count, width = 520, height = 560) {
  const n = Math.max(1, Math.min(5, Math.round(+count) || 1));
  const wide = Math.max(200, +width || 520);
  const tall = Math.max(320, +height || 560);
  const left = 86;
  const right = wide - 86;
  const holes = [];
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? wide / 2 : left + ((right - left) * i) / (n - 1);
    const high = i % 2 === 1;
    holes.push({ x, y: high ? tall * 0.46 : tall * 0.64, high });
  }
  return holes;
}

export function moleSprite(hole, rise) {
  const up = Math.max(0, Math.min(1, +rise || 0));
  return { x: hole?.x || 0, y: (hole?.y || 0) - 10 - up * 58 };
}

// A tap on the mole counts. A tap on the hole, even beside a mole, is dirt.
export function molePick(point, holes, rises) {
  if (!point || !Array.isArray(holes)) return null;
  const px = +point.x;
  const py = +point.y;
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
  for (let i = holes.length - 1; i >= 0; i--) {
    const rise = +rises?.[i] || 0;
    if (rise < 0.45) continue;
    const sprite = moleSprite(holes[i], rise);
    if (px >= sprite.x - 40 && px <= sprite.x + 40 && py >= sprite.y - 64 && py <= sprite.y + 34) {
      return { kind: 'mole', index: i };
    }
  }
  for (let i = 0; i < holes.length; i++) {
    const hole = holes[i];
    const dx = (px - hole.x) / 40;
    const dy = (py - hole.y) / 16;
    if (dx * dx + dy * dy <= 1) return { kind: 'dirt', index: i };
  }
  return null;
}

export function toastPace(board, elapsedSeconds) {
  const steps = Math.max(0, Math.floor((+elapsedSeconds || 0) / 10));
  const flight = Math.max(board.minFlight, board.flight - steps * 160);
  const gap = Math.max(board.minGap, board.gap - steps * 90);
  return { flight, gap };
}

export function matchPairs(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return [4, 6, 8][index];
}

const TRACE_BOARDS = [
  { kind: 'shape', guide: 8, fade: false, tolerance: 14 },
  { kind: 'shape', guide: 3.5, fade: false, tolerance: 9 },
  { kind: 'mark', guide: 2.2, fade: true, tolerance: 7 }
];

export function traceBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...TRACE_BOARDS[index] };
}


export function traceOnPath(point, path, tolerance) {
  if (!point || !Array.isArray(path) || !path.length) return false;
  const limit = +tolerance;
  if (!Number.isFinite(limit) || limit < 0) return false;
  let best = path.length === 1 ? Math.hypot(point.x - path[0].x, point.y - path[0].y) : Infinity;
  for (let i = 0; i < path.length - 1; i++) best = Math.min(best, pointSegmentDistance(point, path[i], path[i + 1]));
  return best <= limit;
}

const SORT_BOARDS = [
  { colors: 2, capacity: 3, empty: 1, mixes: 4 },
  { colors: 3, capacity: 4, empty: 1, mixes: 7 },
  { colors: 4, capacity: 4, empty: 2, mixes: 10 }
];

export function sortBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...SORT_BOARDS[index] };
}

export function sortTopRun(tube) {
  if (!tube?.length) return 0;
  const top = tube[tube.length - 1];
  let count = 1;
  for (let i = tube.length - 2; i >= 0 && tube[i] === top; i--) count += 1;
  return count;
}

export function sortPourCount(from, to, capacity) {
  const cap = Math.max(1, capacity | 0);
  if (!from?.length) return 0;
  const room = cap - (to?.length || 0);
  if (room <= 0) return 0;
  const run = sortTopRun(from);
  if (!to?.length) return Math.min(run, room);
  if (to[to.length - 1] !== from[from.length - 1]) return 0;
  return Math.min(run, room);
}

export function sortPour(tubes, from, to, capacity) {
  if (!Array.isArray(tubes) || from === to || from < 0 || to < 0 || from >= tubes.length || to >= tubes.length) return null;
  const next = tubes.map(tube => [...tube]);
  const count = sortPourCount(next[from], next[to], capacity);
  if (!count) return null;
  next[to].push(...next[from].splice(next[from].length - count, count));
  return next;
}

export function sortSolved(tubes, capacity) {
  const cap = Math.max(1, capacity | 0);
  const seen = new Set();
  if (!Array.isArray(tubes) || !tubes.length) return false;
  for (const tube of tubes) {
    if (!tube?.length) continue;
    if (tube.length !== cap || tube.some(item => item !== tube[0]) || seen.has(tube[0])) return false;
    seen.add(tube[0]);
  }
  return seen.size > 0;
}

export function sortDeal(kinds, board, random = Math.random) {
  const list = (Array.isArray(kinds) ? kinds : []).map(kind => String(kind)).filter(Boolean);
  const cap = Math.max(1, board?.capacity | 0);
  const tubes = list.map(kind => Array(cap).fill(kind));
  for (let i = 0; i < Math.max(0, board?.empty | 0); i++) tubes.push([]);
  const rand = typeof random === 'function' ? random : Math.random;
  for (let n = 0; n < Math.max(0, board?.mixes | 0); n++) {
    const sources = tubes.flatMap((tube, index) => tube.length ? [index] : []);
    const from = sources[Math.floor(rand() * sources.length)];
    const dests = tubes.flatMap((tube, index) => index !== from && tube.length < cap ? [index] : []);
    if (from == null || !dests.length) break;
    tubes[dests[Math.floor(rand() * dests.length)]].push(tubes[from].pop());
  }
  if (sortSolved(tubes, cap)) {
    const full = tubes.findIndex(tube => tube.length === cap);
    const space = tubes.findIndex(tube => tube.length < cap);
    if (full >= 0 && space >= 0) tubes[space].push(tubes[full].pop());
  }
  return tubes;
}


const MERGE_BOARDS = [
  { size: 78, count: 4, chain: 3 },
  { size: 60, count: 6, chain: 4 },
  { size: 46, count: 8, chain: 5 }
];

export function mergeBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...MERGE_BOARDS[index] };
}

export function mergePromote(a, b, chain) {
  if (a == null || b == null || String(a) !== String(b)) return null;
  const list = Array.isArray(chain) ? chain : [];
  const index = list.findIndex(item => String(item) === String(a));
  if (index < 0 || index >= list.length - 1) return null;
  return list[index + 1];
}

const SHAPE_WORDS = {
  circle: ['circle', 'round'],
  square: ['square'],
  triangle: ['triangle'],
  rectangle: ['rectangle'],
  oval: ['oval'],
  diamond: ['diamond'],
  star: ['star'],
  hexagon: ['hexagon']
};

export function spokenShape(transcript, names) {
  const text = ` ${String(transcript || '').toLowerCase().replace(/[^a-z]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
  const list = Array.isArray(names) && names.length ? names : Object.keys(SHAPE_WORDS);
  const hits = [];
  for (const name of list) {
    const words = SHAPE_WORDS[name] || [String(name).toLowerCase()];
    if (words.some(word => text.includes(` ${word} `))) hits.push(name);
  }
  return hits.length === 1 ? hits[0] : '';
}

const RACE_KINDS = ['facts', 'words', 'shapes', 'colors'];

export function raceKinds(saved) {
  if (!saved || typeof saved !== 'object') return [...RACE_KINDS];
  const on = RACE_KINDS.filter(kind => saved[kind] === true);
  return on.length ? on : [...RACE_KINDS];
}

export function raceGateSeconds(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return [11, 8, 6][index];
}

function raceEntry(entry) {
  const name = String(entry?.name || '').trim().slice(0, 24);
  const distance = Math.round(+entry?.distance);
  if (!name || !Number.isFinite(distance) || distance < 0) return null;
  return { name, distance, at: +entry.at || 0 };
}

export function raceStandings(entries, limit = 8) {
  const byName = new Map();
  for (const entry of entries || []) {
    const item = raceEntry(entry);
    if (!item) continue;
    const key = item.name.toLowerCase();
    const prev = byName.get(key);
    if (!prev || item.distance > prev.distance) byName.set(key, item);
  }
  return [...byName.values()]
    .sort((a, b) => b.distance - a.distance || a.at - b.at)
    .slice(0, Math.max(1, limit | 0));
}

export function raceBoard(entries, next, limit = 8) {
  const row = raceEntry(next) || { name: 'Learner', distance: 0, at: 0 };
  const full = raceStandings([...(Array.isArray(entries) ? entries : []), row], 1000);
  const key = row.name.toLowerCase();
  const best = full.find(item => item.name.toLowerCase() === key)?.distance ?? row.distance;
  const rank = full.findIndex(item => item.name.toLowerCase() === key) + 1;
  return { list: full.slice(0, Math.max(1, limit | 0)), rank, distance: row.distance, best };
}

export function distractorLetters(word, level) {
  const count = level >= 3 ? 2 : level === 2 ? 1 : 0;
  const used = new Set([...word.toLowerCase()]);
  return [...'abcdefghijklmnopqrstuvwxyz'].filter(ch => !used.has(ch)).slice(0, count);
}

export function blanks(built, target) {
  return [...target].map((_, i) => (i < built.length ? built[i] : '_')).join(' ');
}

