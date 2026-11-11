// Pieces of the voice system with no browser parts, shared by speech.js, speech-worker.js, and the tests.
export const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
export const DTYPE = 'q8';
export const SPEED = 1;
export const CACHE_VERSION = 4;
const KEY_HEAD = `v${CACHE_VERSION}|${MODEL}|${DTYPE}|`;

// Lines said word for word in many games, so they are worth making before they are needed.
export const commonLines = [
  'Try another one.',
  'Keep exploring. Try another one!',
  'Try another letter.',
  'Look again.',
  'Not a match.',
  'Next maze.'
];

// A blank voice follows the grown-up's pick. Hosts only take their own voice when character voices are on.
export const profiles = {
  narrator: { label: 'Narrator', voice: null, line: 'Hi! Tap a picture to play.' },
  readingCoach: { label: 'Reading coach', voice: null, line: 'Park on the word see.' },
  mathCoach: { label: 'Math coach', voice: null, line: 'What is 3 + 4?' },
  sportsHost: { label: 'Sports host', voice: 'am_michael', line: 'Yes! Turbo!' },
  gameHost: { label: 'Game host', voice: 'bf_emma', line: 'You hooked the fish.' }
};

const ROLE_OF_MODE = {
  words: 'readingCoach', build: 'readingCoach', lanes: 'readingCoach',
  count: 'mathCoach', path: 'mathCoach', catch: 'mathCoach',
  race: 'sportsHost', rocket: 'sportsHost', lunar: 'sportsHost', hoop: 'sportsHost', rally: 'sportsHost', bike: 'sportsHost', flight: 'sportsHost',
  hook: 'gameHost', sky: 'gameHost', planet: 'gameHost', marble: 'gameHost', bridge: 'gameHost', maze: 'gameHost',
  chase: 'gameHost', hop: 'gameHost', toast: 'gameHost', glide: 'gameHost', aisle: 'gameHost', lily: 'gameHost', mole: 'gameHost', cube: 'gameHost', stack: 'gameHost', lamp: 'gameHost', light: 'gameHost',
  puzzle: 'gameHost', match: 'gameHost', merge: 'gameHost', sort: 'gameHost', crayon: 'gameHost', trace: 'gameHost',
  walk: 'gameHost', paint: 'gameHost'
};

export function contextFor(mode) {
  return ROLE_OF_MODE[mode] || 'narrator';
}

export function voiceFor(context, parentVoice, characterVoices = false) {
  const own = profiles[context]?.voice;
  return characterVoices && own ? own : parentVoice;
}

// Grown-up picks and the two host voices. A shipped line exists for each of these.
export const voiceIds = ['af_heart', 'af_bella', 'af_sarah', 'af_nicole', 'am_adam', 'am_michael', 'bf_emma', 'bf_isabella', 'bm_george'];

// Bump this when the clips are rendered again. The number is part of the file path, so old copies are not reused.
export const BAKE_VERSION = 1;

// Lines that never change. Names, sight words, counts, and math stay on the live model.
export const bakedLines = [
  ...commonLines,
  ...Object.values(profiles).map(role => role.line),
  'Hi! Let’s find the circle.',
  'Good.',
  'Not yet. The bike speeds up.',
  'Not yet. The car slows down.',
  'Not yet. The plane turns back.',
  'You found it.',
  'Not yet. Walk to another one.',
  'How far can you drive?',
  'Move your hand onto the right fish. Leave the trash.',
  'Move your hand onto the right fish.',
  'Steer the hook onto the right fish. Leave the trash.',
  'Steer the hook onto the right fish.',
  'Turn the ship and shoot the rock with the right answer. Dodge the ships that shoot back.',
  'Aim the gun with the pointer. Click or tap to shoot the rock with the right answer. Rocks fly in from the edges.',
  'Put the pieces together.',
  'Match the shapes, colors, numbers, and words.',
  'Aim and shoot the color in the question. Three matching marbles pop, then the path rolls together. Clearing that color counts, points raise the level, and the nest ends the path.',
  'Shoot the color before the marbles reach the nest.',
  'Hold to grow the stick across each gap. Reach the last platform.',
  'Each question is the next gap. Hold to grow the stick every time. A right answer makes the landing easier. A wrong answer makes it harder. Get them all to reach the last platform.',
  'Hold to grow the bridge.',
  'Tilt the maze to the flag. A fall puts the ball back. An empty clock adds time.',
  'Tilt the maze to the flag before time runs out. If you fall in a hole, a right answer brings you back and adds time.',
  'Tilt to the flag.',
  'Steer through the maze. Eat the berries. Stay away from the ghosts.',
  'Steer through the maze. Eat only the berries that match. Questions follow this learner’s words, math, shapes, and colors. Stay away from the ghosts.',
  'Keep bouncing higher. The leaves hold you up.',
  'Keep bouncing higher. Hop on the right answer and the climb continues. A wrong one breaks.',
  'Tap the toasts before they land. Letting one land costs a life.',
  'Tap the toast with the right answer before it lands. A wrong toast misses. Letting the right one land costs a life.',
  'Hold to climb. Let go to dive. Yellow gems are fuel. Grab the gems.',
  'Hold to climb. Let go to dive. Yellow gems are fuel. The labeled gems are answers. Grab the one that matches.',
  'Walk the market and pick things up before the clock runs out.',
  'Walk through the market and pick up the right thing before the clock runs out.',
  'Hop across the road and the river. Ride the logs and reach a lily pad.',
  'Hop across the road and the river. Ride the logs. Land on the lily pad with the right answer. A wrong pad sends you back. A car or the water costs a hop.',
  'Steer the blue cube. Jump over the red ones.',
  'Steer the blue cube. Jump over the red ones. Touch the cube with the right answer. A red cube costs a life.',
  'Tap the moles before they hide. An empty hole is just dirt.',
  'Tap to drop the blocks. Line them up on the tower. Blocks that hang off fall away.',
  'Tap when the right answer is on the tower. Blocks that hang off fall away. Missing the tower costs a try.',
  'Tap the stones to build the lighthouse. When it is tall, the lamp turns on.',
  'Tap the stone with the right answer. It rises into the tower. A wrong stone splashes. When the questions are done, the lamp turns on.',
  'Tap the mole with the right answer before it hides. A wrong mole misses. An empty hole is just dirt. Letting the right mole hide costs a life.',
  'Fly the plane.',
  'Walk the meadow.',
  'Ride the dirt bike.',
  'Step into the word. You have 10 seconds to get there.',
  'Drive to the word.',
  'Not yet. Get to the word.',
  'Not yet. Get to the word. You have 10 seconds.',
  'Reach up and catch the number with your hand.',
  'Slide the basket under the number.',
  'Step into the lane with the word. You get 10 seconds to get there.',
  'That’s trash. Hook a fish.',
  'Try another fish.',
  'You got hit.',
  'Try another rock.',
  'A rock reached the planet.',
  'Answer first, then shoot.',
  'Answer again for another shot.',
  'Too slow. The rocket is falling.',
  'You’re in space! Fly the rocket.',
  'The rocket is dropping.',
  'Say the shape you see.',
  'Pull back and shoot.',
  'Not that hoop.',
  'Missed the hoops.',
  'A right answer brings you back and adds time.',
  'A right answer adds time.',
  'Look carefully. Remember these shapes!',
  'Eat the berries. Stay away from the ghosts.',
  'Not that letter. Keep spelling.',
  'You found the pairs.',
  'The bridge reaches.',
  'More time.',
  'Swish!',
  'Which shape is missing?',
  'Spell the word.',
  'Fly through the letters in order.',
  'Look at the shapes.',
  'Look at the colors.',
  'Look at the whole puzzle, then tap its name or say it.',
  'Turn two cards that look the same.',
  'Start at the dot and stay on the line.',
  'Tap a tube to lift the top balls. Pour them onto the same kind, or into an empty tube.',
  'Drop two that are the same so they touch.',
  'Paint every number with the color beside it.',
  'Count along the numbers with your finger.',
  'Paint the half with the right answer.',
  'Walk to the one that matches.',
  'Steer through the gate that matches.',
  'Listen for the word, then eat those berries.',
  'Listen for the word, then pop that toast.',
  'Listen for the word, then walk the aisles and pick it up.',
  'Listen for the word, then hop to that pad.',
  'Listen for the word, then whack that mole.',
  'Listen for the word, then touch that cube.',
  'Listen for the word, then grab that gem.',
  'Tap the one that matches. A right answer turbos the car.',
  'Tap the one that matches. A right answer says good, and the ride continues.',
  'Listen for the word, then hop on it.',
  'Eat the berry with the right number.',
  'Pop the toast with the right number.',
  'Walk the aisles and pick up the right number before time runs out.',
  'Hop to the pad with the right number.',
  'Whack the mole with the right number.',
  'Touch the cube with the right number.',
  'Grab the gem with the right number.',
  'Work out the fact, then tap that number.',
  'Hop on the right number.',
  'Say the word, then find the next letter.',
  'Listen for the word, then find it.',
  'Listen for the word, then fly through each letter or type it.',
  'Listen for the word, then tap or type the letters in order.',
  'The marbles reached the nest.',
  'The bridge fell.',
  'You found every flag.',
  'The toasts landed.',
  'The moles hid.',
  'The red cubes caught up.',
  'Dodge the red cubes.',
  'A red cube got you. You have one less life.',
  'You drove past the answer. Steer into it.',
  'That cube is not the one.',
  'The blocks missed the tower.',
  'Line the blocks up on the tower.',
  'That block is not the one. Wait for the right answer.',
  'That one missed the tower.',
  'Listen for the word, then drop that block.',
  'Drop the block with the right number.',
  'Drop the blocks.',
  'Listen for the word, then set that stone.',
  'Set the stone with the right number.',
  'Set the stones.',
  'That stone splashes back. Set the right one.',
  'Whack the right mole before it hides.',
  'That mole is not the one.',
  'That mole hid. You have one less life.',
  'That hole is empty.',
  'Whack the moles.',
  'The hops ran out.',
  'The maze is done.',
  'Catch the right toast before it lands.',
  'Ride the logs and land on the right lily pad.'
];

function fileHash(text) {
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5 ^ 0x01000193;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x01000193);
  }
  const hex = n => (n >>> 0).toString(16).padStart(8, '0');
  return hex(h1) + hex(h2);
}

let bakedSpoken = null;
export function bakedTexts() {
  if (!bakedSpoken) bakedSpoken = [...new Set(bakedLines.map(line => speakable(line)).filter(Boolean))];
  return bakedSpoken;
}

// A path under the site root, or null when this line still has to be generated.
export function bakedPath({ voice, text, speed = SPEED } = {}) {
  if (speed !== SPEED || !voice || !bakedTexts().includes(text)) return null;
  return `voice/${BAKE_VERSION}/${voice}/${fileHash(`${BAKE_VERSION}|${voice}|${speed}|${text}`)}.m4a`;
}

export function clipKey({ voice, text, speed = SPEED }) {
  return `${KEY_HEAD}${voice}|${speed}|${text}`;
}

export function currentKey(key) {
  return typeof key === 'string' && key.startsWith(KEY_HEAD);
}

// Rejects silence, static, and runaway values before they reach a speaker.
export function usable(samples) {
  if (!samples || samples.length < 400) return false;
  let peak = 0, sum = 0, crossings = 0, wild = 0, prev = 0;
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i];
    if (!Number.isFinite(x)) return false;
    const mag = Math.abs(x);
    if (mag > peak) peak = mag;
    if (mag > 1.5) wild++;
    sum += x * x;
    if (i && (x >= 0) !== (prev >= 0)) crossings++;
    prev = x;
  }
  const rms = Math.sqrt(sum / samples.length);
  const zcr = crossings / samples.length;
  return peak >= 0.02 && peak <= 1.5 && rms >= 0.008 && wild / samples.length < 0.002 && zcr < 0.4;
}

// Brings each clip's loudest point up to the same level, so a quiet line still sits above the game sound.
export function voiceGain(samples, target = 0.95, most = 3) {
  let peak = 0;
  for (let i = 0; i < (samples?.length || 0); i++) {
    const mag = Math.abs(samples[i]);
    if (mag > peak) peak = mag;
  }
  return peak > 0 ? Math.min(most, target / peak) : 1;
}

// Stored clips from older model or key versions go first, then the least recently heard past the limit.
export function evictionPlan(rows, limit) {
  const stale = rows.filter(row => !currentKey(row.key)).map(row => row.key);
  const fresh = rows.filter(row => currentKey(row.key)).sort((a, b) => (a.at || 0) - (b.at || 0));
  const over = Math.max(0, fresh.length - Math.max(0, limit));
  return stale.concat(fresh.slice(0, over).map(row => row.key));
}

const RETRY_MS = [5000, 30000, 120000];

export function retryDelay(attempt) {
  return RETRY_MS[attempt - 1] ?? null;
}

// engine: idle | loading | ready | failed | unsupported. fallback: not-ready | on-error | never.
// 'cached' plays a stored Kokoro clip if one exists and otherwise falls back.
export function chooseEngine({ engine, fallback = 'not-ready', browser = false, store = true }) {
  if (engine === 'ready') return 'kokoro';
  const waiting = engine === 'idle' || engine === 'loading';
  if (waiting && fallback !== 'not-ready') return 'kokoro';
  if (engine !== 'unsupported' && store) return 'cached';
  return fallback !== 'never' && browser ? 'browser' : null;
}

export function settler(resolve) {
  let settled = false;
  return (status, engine = null) => {
    if (settled) return false;
    settled = true;
    resolve({ status, engine });
    return true;
  };
}

const PLURAL = { 1: 'ones', 2: 'twos', 3: 'threes', 4: 'fours', 5: 'fives', 6: 'sixes', 7: 'sevens', 8: 'eights', 9: 'nines', 10: 'tens', 11: 'elevens', 12: 'twelves', 20: 'twenties', 30: 'thirties', 100: 'hundreds' };
const ABBREVIATIONS = [[/\bMr\./g, 'Mister'], [/\bMrs\./g, 'Missus'], [/\bMs\./g, 'Miz'], [/\bDr\./g, 'Doctor'], [/\bvs\./gi, 'versus'], [/\betc\./gi, 'et cetera']];

export function speakable(text, { spell = false } = {}) {
  let s = String(text ?? '').replace(/\p{Extended_Pictographic}\uFE0F?/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (spell) {
    const letters = s.replace(/[^A-Za-z]/g, '').toUpperCase();
    return letters ? `${[...letters].join(', ')}.` : '';
  }
  for (const [pattern, word] of ABBREVIATIONS) s = s.replace(pattern, word);
  s = s
    .replace(/(\d)\s*[×*]\s*(?=\d)/g, '$1 times ')
    .replace(/(\d) x (?=\d)/g, '$1 times ')
    .replace(/(\d)\s*÷\s*(?=\d)/g, '$1 divided by ')
    .replace(/(\d)\s*\+\s*(?=\d)/g, '$1 plus ')
    .replace(/(\d)\s*−\s*(?=\d)/g, '$1 minus ')
    .replace(/(\d) - (?=\d)/g, '$1 minus ')
    .replace(/\s*=\s*\?/g, ' equals what?')
    .replace(/(\d)\s*=\s*(?=\d)/g, '$1 equals ')
    .replace(/\b(\d+)s\b/g, (whole, n) => PLURAL[n] || whole)
    .replace(/\s*&\s*/g, ' and ');
  return s.replace(/\s+/g, ' ').trim();
}

// Only the newest foreground line is kept. Prefetch waits behind it and never repeats a key.
export function createQueue(limit = 48) {
  let fore = null;
  const back = [];
  const has = key => fore?.key === key || back.some(job => job.key === key);
  return {
    foreground(job) { fore = job; },
    cancel(id) { if (fore && (id == null || fore.id === id)) fore = null; },
    prefetch(job, priority = 'background') {
      if (has(job.key)) return false;
      if (priority === 'next') back.unshift(job);
      else back.push(job);
      if (back.length > limit) back.length = limit;
      return true;
    },
    requeue(job) { if (!has(job.key)) back.unshift(job); },
    take() {
      if (fore) {
        const job = fore;
        fore = null;
        return job;
      }
      return back.shift() || null;
    },
    clear() { fore = null; back.length = 0; },
    get waiting() { return !!fore; },
    get size() { return back.length + (fore ? 1 : 0); }
  };
}
