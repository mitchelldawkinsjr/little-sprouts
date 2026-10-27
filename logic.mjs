export function gateQuestion(rand = Math.random) {
  const teen = () => 11 + Math.floor(rand() * 9);
  const a = teen();
  const b = teen();
  return { a, b, answer: a + b, text: `What is ${a} + ${b}?` };
}

export function gateOk(value, answer) {
  const text = String(value).trim();
  return /^\d+$/.test(text) && Number.isInteger(answer) && Number(text) === answer;
}

export function validWord(word) {
  if (!/^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(word)) return false;
  const letters = word.replace(/'/g, '').length;
  return letters >= 1 && letters <= 12;
}

export function parseWords(text) {
  const words = [...new Map(
    String(text).split(/[,\n]/).map(w => w.trim()).filter(Boolean).map(w => [w.toLowerCase(), w])
  ).values()];
  return { words, ok: words.length >= 3 && words.every(validWord) };
}

export function wordsFromSheet(rows, name, stage) {
  const list = (rows || []).filter(row => row && row.game === 'words' && String(row.item || '').trim());
  const who = String(name || '').trim().toLowerCase();
  const band = String(stage || '').trim().toLowerCase();
  const learnerOf = row => String(row.learner || '*').trim().toLowerCase() || '*';
  const grade4Only = new Set();
  if (band !== 'grade4') {
    for (const row of list) {
      if (learnerOf(row) === 'grade4') grade4Only.add(String(row.item).trim().toLowerCase());
    }
  }
  const keep = row => !grade4Only.has(String(row.item).trim().toLowerCase());
  const specific = list.filter(row => {
    const learner = learnerOf(row);
    return learner !== '*' && (learner === who || learner === band) && keep(row);
  });
  const general = list.filter(row => {
    const learner = learnerOf(row);
    return (!learner || learner === '*') && keep(row);
  });
  for (const set of [specific, general]) {
    const parsed = parseWords(set.map(row => row.item).join(','));
    if (parsed.ok) return parsed.words;
  }
  return [];
}

export function letterCount(word) {
  return String(word || '').replace(/'/g, '').length;
}

export function kindergartenWords(words, manual = []) {
  const list = Array.isArray(words) ? words : [];
  const extras = [];
  const extraKeys = new Set();
  for (const word of Array.isArray(manual) ? manual : []) {
    const text = String(word || '').trim();
    const n = letterCount(text);
    if (n > 4 && n <= 12 && validWord(text) && !extraKeys.has(text.toLowerCase())) {
      extraKeys.add(text.toLowerCase());
      extras.push(text);
    }
  }
  const kept = [];
  const seen = new Set();
  const push = word => {
    const text = String(word || '').trim();
    const key = text.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    kept.push(text);
  };
  for (const word of list) {
    const text = String(word || '').trim();
    const n = letterCount(text);
    if ((n >= 1 && n <= 4) || extraKeys.has(text.toLowerCase())) push(text);
  }
  for (const word of extras) push(word);
  return kept;
}

export function spellingWords(words, stage, manual = [], level = 3) {
  const list = stage === 'kindergarten' ? kindergartenWords(words, manual) : (Array.isArray(words) ? words : []);
  if (stage !== 'kindergarten') return list;
  const max = (Math.round(+level) || 1) <= 1 ? 3 : 4;
  const extra = new Set((Array.isArray(manual) ? manual : []).map(word => String(word || '').trim().toLowerCase()));
  return list.filter(word => {
    const n = letterCount(word);
    if (n < 2 || n > 12) return false;
    if (n <= max) return true;
    return n > 4 && extra.has(String(word).trim().toLowerCase());
  });
}

export function candidateWords(words, mode) {
  if (mode !== 'build') return words;
  const longer = words.filter(w => w.replace(/'/g, '').length > 1);
  return longer.length ? longer : words;
}

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
  { rocks: 3, seconds: 8 },
  { rocks: 4, seconds: 6 },
  { rocks: 5, seconds: 4.5 }
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

export function marbleClear(chain, min = 3) {
  const left = Array.isArray(chain) ? chain.slice() : [];
  const need = Math.max(2, min | 0);
  const cleared = [];
  let guard = 0;
  while (guard++ < 24) {
    let cut = null;
    for (let i = 0; i < left.length;) {
      let j = i + 1;
      while (j < left.length && left[j] === left[i]) j++;
      if (j - i >= need) { cut = [i, j]; break; }
      i = j;
    }
    if (!cut) break;
    cleared.push(...left.slice(cut[0], cut[1]));
    left.splice(cut[0], cut[1] - cut[0]);
  }
  return { left, cleared };
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
  { choices: 3, gap: 86, width: 96, gravity: 480, drift: 0 },
  { choices: 4, gap: 98, width: 84, gravity: 600, drift: 0 },
  { choices: 5, gap: 110, width: 74, gravity: 720, drift: 36 }
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

function pointSegmentDistance(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  if (len === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
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

const CRAYON_BOARDS = [
  { regions: 4, colors: 4, brush: 8, cover: 0.3 },
  { regions: 6, colors: 4, brush: 6.2, cover: 0.38 },
  { regions: 8, colors: 6, brush: 4.6, cover: 0.46 }
];

export function crayonBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...CRAYON_BOARDS[index] };
}

export function crayonLegend(ids, palette, numbers) {
  const slots = Math.min(ids?.length || 0, palette?.length || 0, numbers?.length || 0);
  if (!slots) return [];
  return ids.map((id, index) => {
    const slot = index % slots;
    const [name, hex] = palette[slot];
    return { id, name, hex, number: numbers[slot] };
  });
}

export function shapeHolds(shape, x, y) {
  if (!shape || !Number.isFinite(+x) || !Number.isFinite(+y)) return false;
  if (shape.parts) return shape.parts.some(part => shapeHolds(part, x, y));
  if (shape.circle) {
    const [cx, cy, r] = shape.circle;
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  }
  if (shape.ellipse) {
    const [cx, cy, rx, ry] = shape.ellipse;
    if (!(rx > 0) || !(ry > 0)) return false;
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }
  const points = shape.poly;
  if (!Array.isArray(points) || points.length < 3) return false;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function regionAt(regions, x, y) {
  if (!Array.isArray(regions)) return null;
  for (let i = regions.length - 1; i >= 0; i--) {
    if (shapeHolds(regions[i]?.shape, x, y)) return regions[i];
  }
  return null;
}

export function crayonSamples(regions, step = 2) {
  const gap = Math.max(1, +step || 2);
  return (regions || []).map(region => {
    const points = [];
    for (let y = gap / 2; y < 100; y += gap) {
      for (let x = gap / 2; x < 100; x += gap) {
        if (regionAt(regions, x, y)?.id === region.id) points.push({ x, y });
      }
    }
    return points;
  });
}

export function crayonInk(point, from, to, radius) {
  if (!point || !from || !to) return false;
  const limit = +radius;
  if (!Number.isFinite(limit) || limit < 0) return false;
  return pointSegmentDistance(point, from, to) <= limit;
}

export function crayonCovered(hit, total, need) {
  const count = +total;
  if (!Number.isFinite(count) || count <= 0) return false;
  return hit / count >= +need;
}

const flowerPage = {
  name: 'flower',
  regions: [
    { id: 'sky', label: [12, 18], shape: { poly: [[0, 0], [100, 0], [100, 64], [0, 64]] } },
    { id: 'grass', label: [86, 86], shape: { poly: [[0, 64], [100, 64], [100, 100], [0, 100]] } },
    {
      id: 'petals',
      label: [50, 41],
      shape: {
        parts: [
          { circle: [50, 41, 12] },
          { circle: [64, 51, 12] },
          { circle: [59, 68, 12] },
          { circle: [41, 68, 12] },
          { circle: [36, 51, 12] },
          { poly: [[47, 70], [53, 70], [53, 92], [47, 92]] },
          { ellipse: [74, 88, 8, 3.6] }
        ]
      }
    },
    { id: 'center', label: [50, 56], shape: { circle: [50, 56, 8] } }
  ]
};

const fishPage = {
  name: 'fish',
  marks: [
    { circle: [70, 51, 3.4], fill: '#fffdf8' },
    { circle: [71.2, 51, 1.5], fill: '#2c2824', stroke: false }
  ],
  regions: [
    { id: 'water', label: [12, 12], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'tail', label: [16, 54], shape: { poly: [[40, 54], [8, 36], [8, 72]] } },
    { id: 'body', label: [68, 58], shape: { ellipse: [58, 54, 20, 14] } },
    { id: 'fin', label: [52, 32], shape: { poly: [[54, 42], [42, 22], [70, 28]] } }
  ]
};

const housePage = {
  name: 'house',
  marks: [
    { poly: [[34, 52], [44, 52], [44, 62], [34, 62]], fill: '#fffdf8' },
    { line: [[39, 52], [39, 62]] },
    { line: [[34, 57], [44, 57]] }
  ],
  regions: [
    { id: 'sky', label: [16, 28], shape: { poly: [[0, 0], [100, 0], [100, 70], [0, 70]] } },
    { id: 'grass', label: [16, 88], shape: { poly: [[0, 70], [100, 70], [100, 100], [0, 100]] } },
    { id: 'sun', label: [82, 18], shape: { circle: [82, 18, 11] } },
    { id: 'wall', label: [66, 58], shape: { poly: [[28, 46], [76, 46], [76, 80], [28, 80]] } },
    { id: 'roof', label: [52, 36], shape: { poly: [[22, 46], [52, 24], [82, 46]] } },
    { id: 'door', label: [53, 72], shape: { poly: [[46, 62], [60, 62], [60, 80], [46, 80]] } }
  ]
};

const boatPage = {
  name: 'boat',
  marks: [{ line: [[52, 64], [52, 14]], width: 2.5 }],
  regions: [
    { id: 'sky', label: [16, 22], shape: { poly: [[0, 0], [100, 0], [100, 62], [0, 62]] } },
    { id: 'sea', label: [16, 90], shape: { poly: [[0, 58], [100, 58], [100, 100], [0, 100]] } },
    { id: 'sun', label: [82, 18], shape: { circle: [82, 18, 10] } },
    { id: 'sail', label: [62, 40], shape: { poly: [[52, 66], [52, 18], [76, 50]] } },
    { id: 'hull', label: [52, 74], shape: { poly: [[28, 62], [80, 62], [70, 82], [36, 82]] } },
    { id: 'flag', label: [58, 20], shape: { poly: [[52, 14], [68, 20], [52, 26]] } }
  ]
};

const gardenPage = {
  name: 'garden',
  marks: [
    { poly: [[62, 52], [70, 52], [70, 61], [62, 61]], fill: '#fffdf8' },
    { line: [[66, 52], [66, 61]] },
    { line: [[62, 56], [70, 56]] }
  ],
  regions: [
    { id: 'sky', label: [28, 44], shape: { poly: [[0, 0], [100, 0], [100, 68], [0, 68]] } },
    { id: 'grass', label: [50, 90], shape: { poly: [[0, 68], [100, 68], [100, 100], [0, 100]] } },
    { id: 'sun', label: [16, 16], shape: { circle: [16, 16, 9] } },
    {
      id: 'cloud',
      label: [48, 16],
      shape: { parts: [{ circle: [40, 18, 8] }, { circle: [48, 16, 10] }, { circle: [58, 18, 7] }] }
    },
    { id: 'wall', label: [84, 56], shape: { poly: [[60, 48], [90, 48], [90, 78], [60, 78]] } },
    { id: 'roof', label: [75, 38], shape: { poly: [[54, 48], [75, 28], [96, 48]] } },
    { id: 'door', label: [75, 70], shape: { poly: [[70, 60], [80, 60], [80, 78], [70, 78]] } },
    {
      id: 'flower',
      label: [26, 70],
      shape: {
        parts: [
          { circle: [26, 70, 8] },
          { circle: [34, 76, 8] },
          { circle: [30, 86, 8] },
          { circle: [22, 86, 8] },
          { circle: [18, 76, 8] },
          { circle: [26, 78, 5] },
          { poly: [[24, 84], [28, 84], [28, 98], [24, 98]] }
        ]
      }
    }
  ]
};

const butterflyPage = {
  name: 'butterfly',
  marks: [
    { line: [[48, 34], [42, 24]] },
    { line: [[52, 34], [58, 24]] },
    { circle: [42, 24, 1.6], fill: '#2c2824', stroke: false },
    { circle: [58, 24, 1.6], fill: '#2c2824', stroke: false }
  ],
  regions: [
    { id: 'sky', label: [50, 12], shape: { poly: [[0, 0], [100, 0], [100, 70], [0, 70]] } },
    { id: 'grass', label: [50, 92], shape: { poly: [[0, 70], [100, 70], [100, 100], [0, 100]] } },
    { id: 'sun', label: [84, 16], shape: { circle: [84, 16, 8] } },
    { id: 'left', label: [26, 50], shape: { ellipse: [34, 48, 18, 24] } },
    { id: 'right', label: [74, 52], shape: { ellipse: [66, 48, 18, 24] } },
    { id: 'body', label: [50, 56], shape: { ellipse: [50, 50, 6, 18] } },
    { id: 'spots', label: [28, 40], shape: { parts: [{ circle: [28, 40, 6] }, { circle: [72, 40, 6] }] } },
    {
      id: 'flower',
      label: [18, 76],
      shape: {
        parts: [
          { circle: [18, 76, 7] },
          { circle: [25, 80, 7] },
          { circle: [22, 88, 7] },
          { circle: [14, 88, 7] },
          { circle: [11, 80, 7] },
          { circle: [18, 82, 4] }
        ]
      }
    }
  ]
};

const CRAYON_PAGES = {
  4: [flowerPage, fishPage],
  6: [housePage, boatPage],
  8: [gardenPage, butterflyPage]
};

export function crayonPicture(level, index = 0) {
  const pages = CRAYON_PAGES[crayonBoard(level).regions];
  const n = Number.isFinite(+index) ? Math.abs(Math.trunc(+index)) : 0;
  return pages[n % pages.length];
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

export const RACE_KINDS = ['facts', 'words', 'shapes', 'colors'];

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

export function starChip(profile) {
  const noun = profile.stars === 1 ? 'star' : 'stars';
  const stars = `${profile.stars} learning ${noun}`;
  if (!profile.total) return stars;
  return `${stars} · ${profile.correct} of ${profile.total} first tries`;
}

/** Sprout sprites grow as learning stars add up. */
export function spriteGrow(stars) {
  const n = Math.max(0, Math.floor(+stars) || 0);
  if (n >= 40) return 5;
  if (n >= 20) return 4;
  if (n >= 8) return 3;
  if (n >= 1) return 2;
  return 1;
}

export const SPRITES = ['fox', 'bear', 'bunny', 'frog', 'owl', 'chick'];

export function profileSprite(profile, index = 0) {
  if (SPRITES.includes(profile?.sprite)) return profile.sprite;
  return SPRITES[Math.max(0, index | 0) % SPRITES.length];
}

export function nextSprite(profiles) {
  const list = Array.isArray(profiles) ? profiles : [];
  const used = new Set(list.map((profile, index) => profileSprite(profile, index)));
  return SPRITES.find(kind => !used.has(kind)) || SPRITES[list.length % SPRITES.length];
}

export function blankLearner(name = 'New learner', sprite = 'fox') {
  const trimmed = String(name || 'New learner').trim().slice(0, 24);
  return {
    name: trimmed || 'New learner',
    stage: 'preschool',
    level: 1,
    rounds: 5,
    style: 'tap',
    sprite: profileSprite({ sprite }, 0),
    words: ['I', 'a', 'the', 'my', 'see'],
    stars: 0,
    earned: 0,
    sessions: 0,
    correct: 0,
    total: 0
  };
}

/**
 * Star-garden standings. With no stars yet, learners stay in their usual order.
 * Once someone has stars, the board is a podium: second, first, third.
 */
export function pointBoard(profiles) {
  const rows = (Array.isArray(profiles) ? profiles : []).map((profile, index) => {
    const stars = Math.max(0, Math.floor(+profile?.stars) || 0);
    return {
      index,
      name: String(profile?.name || `Learner ${index + 1}`).trim() || `Learner ${index + 1}`,
      stars,
      earned: Math.max(0, Math.floor(+profile?.earned) || 0),
      grow: spriteGrow(stars),
      sprite: profileSprite(profile, index)
    };
  });
  const ranked = [...rows].sort((a, b) => b.stars - a.stars || a.index - b.index);
  ranked.forEach((row, place) => {
    row.rank = place && row.stars === ranked[place - 1].stars ? ranked[place - 1].rank : place + 1;
  });
  if (!rows.some(row => row.stars > 0) || ranked.length < 3) return ranked;
  return [ranked[1], ranked[0], ranked[2], ...ranked.slice(3)];
}

export function roundsSentence(profile) {
  const rounds = profile.sessions === 1 ? '1 round' : `${profile.sessions} rounds`;
  return `${rounds} completed · ${profile.correct} of ${profile.total} first tries correct.`;
}

export const ROUND_CHOICES = [5, 10, 15];

/** Questions in one round. Only 5, 10, or 15. */
export function roundCount(value) {
  const n = Math.round(+value);
  return ROUND_CHOICES.includes(n) ? n : 5;
}

/** How many rally questions fit a stage. Five on a usual round, up to eight on a long one. */
export function rallyQuestionCount(rounds) {
  const n = roundCount(rounds);
  if (n <= 5) return n;
  if (n >= 15) return 8;
  return 7;
}

/** Right answers that open the rest of a rally stage. A usual round opens after five. */
export function rallyClearCount(rounds) {
  return Math.min(5, rallyQuestionCount(rounds));
}

/** Progress marks from just after the start to just before the finish. */
export function rallyGates(count) {
  const stops = Math.max(1, Math.round(+count) || 1);
  return Array.from({ length: stops }, (_, index) => (index + 1) / (stops + 1));
}

export function skillState(record) {
  const rec = record || { total: 0, correct: 0 };
  if (rec.total >= 10 && rec.correct / rec.total >= 0.8) return 'Flourishing';
  if (rec.total) return 'Growing';
  return 'Ready to explore';
}

export function progressKey(style, level) {
  return style === 'tap' ? level : style + level;
}

const STYLE_LABELS = [['tap', 'Tap'], ['move', 'Move'], ['hunt', 'Hunt'], ['reach', 'Reach']];

export function skillStatText(profile, id, level) {
  const parts = STYLE_LABELS.map(([style, label]) => {
    const rec = profile.skills?.[id]?.[progressKey(style, level)];
    if (!rec?.total) return '';
    const rounds = rec.sessions === 1 ? '1 round' : `${rec.sessions} rounds`;
    return `${label} ${rec.correct}/${rec.total} (${rounds})`;
  }).filter(Boolean);
  return parts.length ? `First tries correct · ${parts.join(' · ')}` : 'No practice yet at this level';
}

export function levelsVary(globalLevel, skillLevels) {
  return skillLevels.some(level => +level !== +globalLevel);
}

export function levelSummary(globalLevel, skillLevels, rounds) {
  const challenges = `${rounds} little challenges`;
  return levelsVary(globalLevel, skillLevels) ? challenges : `Level ${globalLevel} · ${challenges}`;
}

export function applyRound(profile, mode, key, rounds, firstCorrect) {
  const skills = { ...(profile.skills || {}) };
  const byMode = { ...(skills[mode] || {}) };
  const rec = byMode[key] || { total: 0, correct: 0, sessions: 0 };
  byMode[key] = {
    total: rec.total + rounds,
    correct: rec.correct + firstCorrect,
    sessions: rec.sessions + 1
  };
  skills[mode] = byMode;
  return {
    ...profile,
    stars: profile.stars + rounds,
    earned: Math.max(0, rounds | 0),
    sessions: profile.sessions + 1,
    correct: profile.correct + firstCorrect,
    total: profile.total + rounds,
    skills
  };
}

export const STAGES = [
  ['preschool', 'Preschool'],
  ['kindergarten', 'Kindergarten'],
  ['grade4', '4th grade']
];

export function stageOf(profile, index = 0) {
  const raw = profile?.stage;
  if (raw === 'preschool' || raw === 'kindergarten' || raw === 'grade4') return raw;
  return ['preschool', 'kindergarten', 'grade4'][index] || 'preschool';
}

export function stageLabel(stage) {
  return STAGES.find(([id]) => id === stage)?.[1] || 'Preschool';
}

export function mathBlurb(stage, id) {
  if (id === 'catch') {
    return {
      preschool: 'Catch the number that answers the question.',
      kindergarten: 'Catch how many. Later, hops that add or take away.',
      grade4: 'Catch the product as the answers fall.'
    }[stage];
  }
  if (id === 'count') {
    return {
      preschool: 'Count a few pictures. Start small.',
      kindergarten: 'Count groups up to 5, then 10, then 20.',
      grade4: 'Arrays, times tables, and multi-digit multiplication.'
    }[stage];
  }
  return {
    preschool: 'Find numbers and say which is more.',
    kindergarten: 'Find numbers through 5, then before and after, then hops that add or take away.',
    grade4: 'Skip-counting, multiples, factors, and primes.'
  }[stage];
}

export function numberRange(lo, hi) {
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
}

export function nearbyChoices(target, lo, hi, count, rand = Math.random) {
  const pool = numberRange(lo, hi)
    .filter(n => n !== target)
    .sort((a, b) => Math.abs(a - target) - Math.abs(b - target) || a - b)
    .slice(0, count + 1);
  const picked = [];
  while (picked.length < count - 1 && pool.length) picked.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return [...picked, target];
}

export function countMax(stage, level, style) {
  const max = {
    preschool: [5, 8, 10],
    kindergarten: [5, 10, 20],
    grade4: [12, 12, 12]
  }[stage][level - 1];
  return style === 'hunt' && stage !== 'grade4' ? Math.min(max, 10) : max;
}

const between = (lo, hi, rand) => lo + Math.floor(rand() * (hi - lo + 1));
const times = n => (n === 1 ? 'once' : `${n} times`);

export function countQuestion(stage, level, style, rand = Math.random, facts) {
  if (stage === 'grade4') return gradeCount(level, rand, facts);
  const max = countMax(stage, level, style);
  const target = between(1, max, rand);
  return {
    kind: 'count', target, show: 'items', floor: true, max,
    lo: 1, hi: max, question: `How many? Count them!`
  };
}

export function pathQuestion(stage, level, rand = Math.random, facts) {
  const pickKind = kinds => kinds[Math.floor(rand() * kinds.length)];
  if (stage === 'preschool') {
    const kinds = [['find'], ['find', 'after'], ['after', 'before', 'more']][level - 1];
    const hi = [5, 8, 10][level - 1];
    return earlyPath(pickKind(kinds), hi, rand);
  }
  if (stage === 'kindergarten') {
    const kinds = [['find'], ['after', 'before', 'more'], ['add', 'take']][level - 1];
    const hi = [5, 10, 10][level - 1];
    const hop = level === 3 ? 5 : 3;
    return earlyPath(pickKind(kinds), hi, rand, hop);
  }
  const kinds = [['next', 'multipleOf'], ['next', 'multipleOf'], ['factor', 'common', 'prime']][level - 1];
  return gradePath(pickKind(kinds), level, rand, facts);
}

function earlyPath(kind, hi, rand, hop = 3) {
  const floor = true;
  if (kind === 'find') {
    const target = between(1, hi, rand);
    return { kind, target, lo: 1, hi, floor, question: `Find the number ${target}.` };
  }
  if (kind === 'after') {
    const a = between(0, hi - 1, rand);
    return { kind, a, target: a + 1, lo: 0, hi, floor, question: `What number comes after ${a}?` };
  }
  if (kind === 'before') {
    const a = between(1, hi, rand);
    return { kind, a, target: a - 1, lo: 0, hi, floor, question: `What number comes before ${a}?` };
  }
  if (kind === 'more') {
    const a = between(0, hi, rand);
    let b = between(0, hi - 1, rand);
    if (b >= a) b++;
    return { kind, a, b, target: Math.max(a, b), choices: [a, b], lo: 0, hi, floor, question: `Which is more, ${a} or ${b}?` };
  }
  if (kind === 'add') {
    const a = between(0, hi - 1, rand), b = between(1, Math.min(hop, hi - a), rand);
    return { kind, a, b, target: a + b, lo: 0, hi, floor, question: `Start at ${a}. Hop ${b} more. Where do you land?` };
  }
  const a = between(1, hi, rand), b = between(1, Math.min(hop, a), rand);
  return { kind, a, b, target: a - b, lo: 0, hi, floor, question: `Start at ${a}. Hop back ${b}. Where do you land?` };
}

const pickFrom = (list, rand) => list[Math.floor(rand() * list.length)];
const shuffleWith = (list, rand) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const uniqueOthers = (list, target) => [...new Set(list)].filter(n => Number.isInteger(n) && n > 0 && n !== target);
const productPool = (a, b) => uniqueOthers([(a + 1) * b, (a - 1) * b, a * (b + 1), a * (b - 1), a + b, a * b + 10, a * b - 10, a * b + 1, a * b - 1], a * b);
const g4 = q => ({ show: 'none', floor: false, grade: true, lo: 1, hi: q.target * 2 + 10, ...q });

const FACT_OFF = /^(off|hide|no|skip|false)$/i;

function asFactSet(facts) {
  if (!facts) return null;
  if (Array.isArray(facts)) {
    const tables = [...new Set(facts.map(Number).filter(n => Number.isInteger(n) && n >= 2 && n <= 12))];
    return tables.length ? { tables, decades: [], double: false } : null;
  }
  if (typeof facts === 'object') return facts;
  return null;
}

function decadesIn(text) {
  return [...String(text).matchAll(/([1-9])0s?/gi)].map(match => Number(match[1]) * 10);
}

function readCap(item, extra) {
  if (item === 'cap' || item === 'max' || item === 'under') {
    if (FACT_OFF.test(extra)) return null;
    const n = Number(extra);
    return Number.isInteger(n) && n >= 2 && n <= 90 ? n : 12;
  }
  if (item === 'above') {
    if (FACT_OFF.test(extra) || extra === '' || extra === '12') return 12;
    const n = Number(extra);
    return Number.isInteger(n) && n >= 2 && n <= 90 ? n : 12;
  }
  return undefined;
}

export function factSetFromRows(rows) {
  const tables = [];
  const decades = [];
  let double = false;
  let enabled = 0;
  let cap = null;
  let sawCap = false;
  for (const row of rows || []) {
    const extra = String(row?.extra || '').trim();
    const item = String(row?.item || '').trim().toLowerCase();
    if (!item) continue;
    const nextCap = readCap(item, extra);
    if (nextCap !== undefined) {
      sawCap = true;
      cap = nextCap;
      continue;
    }
    if (FACT_OFF.test(extra)) continue;
    if (item === 'double' || item === 'digits' || item === 'doubles' || item === 'double digits') {
      double = true;
      enabled += 1;
      decades.push(...decadesIn(extra));
      continue;
    }
    const decade = item.match(/^([1-9])0s$/);
    if (decade) {
      decades.push(Number(decade[1]) * 10);
      enabled += 1;
      continue;
    }
    const n = Number(item);
    if (Number.isInteger(n) && n >= 2 && n <= 12) {
      tables.push(n);
      enabled += 1;
    }
  }
  if (!enabled) return null;
  const limit = sawCap ? cap : null;
  return {
    tables: [...new Set(tables)].filter(n => limit == null || n <= limit).sort((a, b) => a - b),
    decades: [...new Set(decades)].filter(n => n >= 10 && n <= 90 && (limit == null || n <= limit)).sort((a, b) => a - b),
    double,
    cap: limit
  };
}

function tableQuestion(tables, rand) {
  const a = pickFrom(tables, rand);
  const b = pickFrom(tables, rand);
  if (rand() < 0.3) {
    return g4({
      kind: 'missing', a, b, product: a * b, target: a, lo: 1, hi: Math.max(...tables),
      question: `What times ${b} makes ${a * b}?`
    });
  }
  return g4({ kind: 'mul', a, b, target: a * b, pool: productPool(a, b), question: `What is ${a} × ${b}?` });
}

function tensQuestion(decade, rand) {
  const a = decade;
  const b = between(2, 9, rand);
  return g4({
    kind: 'tens', a, b, target: a * b,
    pool: uniqueOthers([a * b / 10, (a + 10) * b, Math.max(0, a - 10) * b, a * (b + 1), a * (b - 1), a * b * 10], a * b),
    question: `What is ${a} × ${b}?`
  });
}

function doubleQuestion(decade, rand, cap) {
  const hi = cap ? Math.min(9, cap - decade) : 9;
  if (hi < 1) return null;
  const ones = between(1, hi, rand);
  const a = decade + ones;
  const b = between(2, 9, rand);
  return g4({
    kind: 'mul21', a, b, tens: decade, ones, target: a * b,
    pool: uniqueOthers([decade * b + ones, decade * b + ones * b + 10, a * b - 10, a * (b + 1), a * (b - 1), (a + 1) * b], a * b),
    question: `What is ${a} × ${b}?`
  });
}

function placedQuestion(set, rand) {
  const kinds = [];
  if (set.double) kinds.push('mul21');
  if (set.decades.length) kinds.push('tens');
  if (!kinds.length) return set.tables.length ? tableQuestion(set.tables, rand) : null;
  const decade = pickFrom(set.decades.length ? set.decades : [10], rand);
  if (pickFrom(kinds, rand) === 'tens' && set.decades.length) return tensQuestion(decade, rand);
  return doubleQuestion(set.decades.length ? decade : 10, rand, set.cap) || (set.tables.length ? tableQuestion(set.tables, rand) : null);
}

function stepNumbers(set, level, fallback) {
  if (!set) return fallback;
  let nums = set.tables.slice();
  if (level > 1) nums = nums.concat(set.decades);
  if (level === 1) {
    const easy = nums.filter(n => [2, 3, 4, 5, 10].includes(n));
    if (easy.length) nums = easy;
  }
  return nums.length ? nums : fallback;
}

function gradeCount(level, rand, facts) {
  if (level === 1) {
    const rows = between(2, 5, rand), cols = between(2, 6, rand), target = rows * cols;
    return g4({
      kind: 'array', rows, cols, target, show: 'array',
      pool: uniqueOthers([(rows + 1) * cols, (rows - 1) * cols, rows * (cols + 1), rows * (cols - 1), rows + cols], target),
      question: `${rows} rows of ${cols}. How many in all?`
    });
  }
  const set = asFactSet(facts);
  if (!set) {
    if (level === 2) return tableQuestion(numberRange(2, 12), rand);
    const kind = pickFrom(['mul21', 'mul21', 'mul21', 'tens'], rand);
    if (kind === 'tens') {
      const a = between(2, 9, rand) * 10, b = between(2, 9, rand);
      return g4({ kind, a, b, target: a * b, pool: uniqueOthers([a * b / 10, (a + 10) * b, (a - 10) * b, a * (b + 1), a * (b - 1), a * b * 10], a * b), question: `What is ${a} × ${b}?` });
    }
    let a = between(12, 49, rand);
    if (a % 10 === 0) a += 1;
    const b = between(3, 9, rand), tens = a - (a % 10), ones = a % 10;
    return g4({
      kind: 'mul21', a, b, tens, ones, target: a * b,
      pool: uniqueOthers([tens * b + ones, tens * b + ones * b + 10, a * b - 10, a * (b + 1), a * (b - 1), (a + 1) * b], a * b),
      question: `What is ${a} × ${b}?`
    });
  }
  if (level === 2 && set.tables.length) return tableQuestion(set.tables, rand);
  return placedQuestion(set, rand) || tableQuestion(set.tables.length ? set.tables : [2, 10], rand);
}

const FACTOR_TARGETS = [12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 54, 56, 60, 63, 64, 72, 84, 90, 96];
const COMMON_PAIRS = [[2, 3], [2, 5], [3, 4], [3, 5], [4, 5], [4, 6], [2, 7], [3, 7]];
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
const TRICKY_COMPOSITES = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 4, 6, 8, 10, 12, 14, 22];
const lcm = (a, b) => { let m = Math.max(a, b); while (m % a || m % b) m++; return m; };

function gradePath(kind, level, rand, facts) {
  if (kind === 'next') {
    const n = pickFrom(stepNumbers(asFactSet(facts), level, level === 1 ? [2, 3, 4, 5, 10] : [6, 7, 8, 9, 11, 12]), rand), k = between(1, 6, rand);
    const strip = [n * k, n * (k + 1), n * (k + 2)], target = n * (k + 3);
    return g4({
      kind, n, strip, target, pool: uniqueOthers([target + n, target - 1, target + 1, target + 10, target - 2], target),
      question: `Count by ${n}s: ${strip.join(', ')}… What comes next?`
    });
  }
  if (kind === 'multipleOf') {
    const n = pickFrom(stepNumbers(asFactSet(facts), level, level === 1 ? [2, 5, 10] : [3, 4, 6, 7, 8, 9]), rand), target = n * between(2, 9, rand);
    const near = numberRange(Math.max(2, target - 12), target + 12).filter(x => x % n);
    return g4({ kind, n, target, choices: [...shuffleWith(near, rand).slice(0, 3), target], question: `Which number is a multiple of ${n}?` });
  }
  if (kind === 'factor') {
    const big = pickFrom(FACTOR_TARGETS, rand);
    const factors = numberRange(2, big - 1).filter(d => big % d === 0 && d <= 12);
    const target = pickFrom(factors, rand);
    const non = numberRange(2, 15).filter(d => big % d);
    return g4({ kind, big, target, choices: [...shuffleWith(non, rand).slice(0, 3), target], question: `Which number is a factor of ${big}?` });
  }
  if (kind === 'common') {
    const [a, b] = pickFrom(COMMON_PAIRS, rand), both = lcm(a, b);
    const target = both * between(1, Math.max(1, Math.floor(60 / both)), rand);
    const one = numberRange(2, 60).filter(x => (x % a === 0) !== (x % b === 0));
    return g4({ kind, a, b, target, choices: [...shuffleWith(one, rand).slice(0, 3), target], question: `Which number is a multiple of both ${a} and ${b}?` });
  }
  const target = pickFrom(PRIMES, rand);
  return g4({ kind: 'prime', target, choices: [...shuffleWith(TRICKY_COMPOSITES, rand).slice(0, 3), target], question: 'Which number is prime?' });
}

export function choicesFor(q, count, rand = Math.random) {
  if (q.choices) return q.choices;
  if (q.pool?.length >= count - 1) return [...shuffleWith(q.pool, rand).slice(0, count - 1), q.target];
  const picked = q.pool || [];
  const fill = nearbyChoices(q.target, q.lo, q.hi, count + picked.length, rand).filter(n => n !== q.target && !picked.includes(n));
  return [...picked, ...fill].slice(0, count - 1).concat(q.target);
}

export function grade4Prompt(q, style, options = q.choices) {
  if (style !== 'move' && style !== 'hunt') return q.question;
  if (q.choices && options) {
    const list = options.length > 1 ? `${options.slice(0, -1).join(', ')}, or ${options.at(-1)}` : String(options[0]);
    q = { ...q, question: `${q.question.replace(/\?$/, '')}: ${list}?` };
  }
  if (style === 'move') {
    const moves = {
      array: () => `Clap ${q.rows} rows of ${q.cols}: clap ${q.cols} times, pause, and do that ${q.rows} times. How many claps in all?`,
      mul: () => `${q.a} × ${q.b}: jump and skip-count by ${q.b}s. Stop after ${q.a} jumps. What number did you land on?`,
      missing: () => `Jump and skip-count by ${q.b}s until you say ${q.product}. How many jumps did it take?`,
      mul21: () => `${q.a} × ${q.b}: take ${q.b} giant steps counting by ${q.tens}s, then ${q.b} baby steps adding ${q.ones} each time. Where did you land?`,
      tens: () => `${q.a} × ${q.b}: take ${q.b} giant steps counting by ${q.a}s. Where did you land?`,
      next: () => `Jump and count by ${q.n}s: ${q.strip.join(', ')}… One more jump. What number?`,
      multipleOf: () => `${q.question} Skip-count by ${q.n}s with a jump on each one to check.`,
      factor: () => `${q.question} Pick one and skip-count by it with jumps. Do you land right on ${q.big}?`,
      common: () => `${q.question} Clap counting by ${q.a}s, then stomp counting by ${q.b}s. Which number did you say both times?`,
      prime: () => `${q.question} Try to clap each one out in equal rows. A prime only works as one row!`
    };
    return moves[q.kind]?.() || `${q.question} Tell a grown-up the answer.`;
  }
  if (style === 'hunt') {
    if (q.kind === 'array') return `Build ${q.rows} rows of ${q.cols} with spoons, coins or blocks. How many in all?`;
    if (q.kind === 'mul' && q.target <= 40) return `Build ${q.a} groups of ${q.b} with small things around you. How many in all?`;
    if (q.kind === 'missing' && q.product <= 40) return `Count out ${q.product} small things and share them into groups of ${q.b}. How many groups?`;
    if (['next', 'multipleOf', 'common'].includes(q.kind)) return `${q.question} Check with a calendar or a 100 chart!`;
    return `${q.question} Say the answer out loud.`;
  }
}

export function pathPrompt(q, style, verb = 'Hop') {
  if (style === 'hunt') {
    if (!q.floor) return `${q.question} Say the answer out loud.`;
    return q.kind === 'find'
      ? `Find the number ${q.target} on a clock, a book, or a door!`
      : `${q.question} Then find that number on a clock, a book, or a sign!`;
  }
  if (style !== 'move') return q.question;
  if (!q.floor) return `${q.question} Tell a grown-up the answer.`;
  return {
    find: `${verb} to number ${q.target}!`,
    after: `Stand on ${q.a}. Take one giant step forward. What number are you on?`,
    before: `Stand on ${q.a}. Take one giant step back. What number are you on?`,
    more: `Which is more, ${q.a} or ${q.b}? ${verb} to it!`,
    add: `Stand on ${q.a}. Hop forward ${times(q.b)}. What number are you on?`,
    take: `Stand on ${q.a}. Hop back ${times(q.b)}. What number are you on?`
  }[q.kind] || q.question;
}

export function mathHint(q, mode) {
  const kind = q?.kind;
  if (mode === 'count' && kind === 'count') return `Touch each one as you count. Look for ${q.target}.`;
  if (kind === 'array') return `Skip-count the rows. Each row has ${q.cols}.`;
  if (kind === 'mul') return `Think of ${q.a} groups of ${q.b}. Skip-count by ${q.b}s.`;
  if (kind === 'missing') return `Skip-count by ${q.b}s until you reach ${q.product}. Count the skips.`;
  if (kind === 'mul21') return `Break it apart: ${q.tens} × ${q.b}, plus ${q.ones} × ${q.b}.`;
  if (kind === 'tens') return `Work out ${q.a / 10} × ${q.b}, then make it ten times bigger.`;
  if (kind === 'mul22') return `Break ${q.b} into 10 and ${q.b - 10}: ${q.a} × 10, plus ${q.a} × ${q.b - 10}.`;
  if (kind === 'next') return `Add ${q.n} to the last number.`;
  if (kind === 'multipleOf') return `Skip-count by ${q.n}s. Which choice do you land on?`;
  if (kind === 'factor') return `Skip-count by each choice. Which one lands exactly on ${q.big}?`;
  if (kind === 'common') return `List the ${q.a}s and the ${q.b}s. Which choice is on both lists?`;
  if (kind === 'prime') return 'A prime has only two factors: 1 and itself. The others can be split into equal groups.';
  if (mode === 'path' && q?.floor) return `Count along the numbers with your finger. Look for ${q.target}.`;
  return `Look for ${q?.target}.`;
}

export function mathTip(q, mode, target) {
  const kind = q?.kind;
  if (kind === 'count') return `Ask: can you show me ${target} on your fingers?`;
  if (kind === 'array') return `Ask: what multiplication fact matches ${q.rows} rows of ${q.cols}?`;
  if (kind === 'mul' || kind === 'tens') return `Ask: what is ${q.b} × ${q.a}? Does flipping the order change the answer?`;
  if (kind === 'missing') return `Ask: what division fact goes with ${target} × ${q.b} = ${q.product}?`;
  if (kind === 'mul21' || kind === 'mul22') return 'Ask: how did you break the numbers apart?';
  if (kind === 'next' || kind === 'multipleOf') return `Ask: what are the next three multiples of ${q.n}?`;
  if (kind === 'factor') return `Ask: what number goes with ${target} to make ${q.big}?`;
  if (kind === 'common') return `Ask: what is the smallest number that is a multiple of both ${q.a} and ${q.b}?`;
  if (kind === 'prime') return `Ask: why can’t ${target} be made into equal rows?`;
  if (mode === 'path') return `Ask: what number is one more than ${target}?`;
  return 'Ask: how did you know?';
}

export function numberDeck(stage, countLevel, pathLevel) {
  if (stage === 'grade4') return numberRange(0, 12);
  if (stage === 'preschool') return numberRange(1, countMax(stage, Math.max(countLevel, pathLevel), 'move'));
  const pathHi = [5, 10, 10][Math.min(3, Math.max(1, Math.round(+pathLevel) || 1)) - 1];
  return numberRange(0, Math.max(countMax(stage, countLevel, 'move'), pathHi));
}

export function resetProgress(profile) {
  return { ...profile, stars: 0, earned: 0, sessions: 0, correct: 0, total: 0, skills: {} };
}

const SHEET_GAMES = { words: 'words', word: 'words', count: 'count', hunt: 'hunt', facts: 'facts', fact: 'facts' };

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  const s = String(text).replace(/^\uFEFF/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some(x => String(x).trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some(x => String(x).trim())) rows.push(row);
  }
  return rows;
}

export function parseSheet(text) {
  const table = parseCsv(text);
  if (!table.length) return { rows: [], note: 'empty' };
  const head = table[0].map(h => String(h).trim().toLowerCase());
  const col = (...names) => names.map(n => head.indexOf(n)).find(i => i >= 0) ?? -1;
  const learner = col('learner', 'name');
  const game = col('game');
  const item = col('item', 'word');
  const extra = col('extra');
  if (game < 0 || item < 0) return { rows: [], note: 'columns' };
  const rows = [];
  for (const line of table.slice(1)) {
    const kind = SHEET_GAMES[String(line[game] || '').trim().toLowerCase()];
    const value = String(line[item] || '').trim();
    if (!kind || !value) continue;
    const who = learner < 0 ? '*' : String(line[learner] || '').trim() || '*';
    const hide = col('hide', 'off');
    if (hide >= 0 && /^(1|y|yes|true|hide|off|skip)$/i.test(String(line[hide] || '').trim())) continue;
    rows.push({ learner: who, game: kind, item: value, extra: extra < 0 ? '' : String(line[extra] || '').trim() });
  }
  return { rows, note: rows.length ? 'ok' : 'none' };
}

function withNewFacts(defaults, extra) {
  const seen = new Set(extra.filter(row => row.game === 'facts').map(row => String(row.item).trim().toLowerCase()));
  const added = defaults.filter(row => row.game === 'facts' && !seen.has(String(row.item).trim().toLowerCase()));
  return added.length ? [...extra, ...added] : extra;
}

function withNewBandWords(defaults, extra) {
  const bands = new Set(['preschool', 'kindergarten', 'grade4']);
  const seen = new Set(extra.filter(row => row.game === 'words').map(row => `${String(row.learner || '').trim().toLowerCase()}|${String(row.item).trim().toLowerCase()}`));
  const added = defaults.filter(row => {
    if (row.game !== 'words') return false;
    const who = String(row.learner || '').trim().toLowerCase();
    return bands.has(who) && !seen.has(`${who}|${String(row.item).trim().toLowerCase()}`);
  });
  return added.length ? [...extra, ...added] : extra;
}

export function mergeSheets(base, overlay) {
  const defaults = base?.rows || [];
  const extra = overlay?.rows || [];
  const games = [...new Set(extra.map(row => row.game))];
  const rows = withNewBandWords(defaults, withNewFacts(defaults, [...defaults.filter(row => !games.includes(row.game)), ...extra]));
  return { rows, note: rows.length ? 'ok' : (base?.note || 'empty'), games };
}
