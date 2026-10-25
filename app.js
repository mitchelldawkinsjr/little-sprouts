import {
  applyRound,
  blanks,
  candidateWords,
  choicesFor,
  countQuestion,
  distractorLetters,
  gateOk,
  gateQuestion,
  fuelSeconds,
  grade4Prompt,
  mathBlurb,
  mathHint,
  mathTip,
  numberDeck,
  numberRange,
  mergeSheets,
  factSetFromRows,
  parseSheet,
  parseWords,
  wordsFromSheet,
  pathPrompt,
  pathQuestion,
  progressKey,
  resetProgress,
  raceBoard,
  raceGateSeconds,
  raceKinds,
  raceStandings,
  rocketSubject,
  rocketZone,
  roundsSentence,
  roundCount,
  rallyGates,
  rallyQuestionCount,
  rallyClearCount,
  skillState,
  skillStatText,
  stageLabel,
  stageOf,
  pointBoard,
  profileSprite,
  nextSprite,
  blankLearner,
  SPRITES,
  starChip,
  laneCount,
  hookCast,
  skyWave,
  planetWave,
  puzzleBoard,
  spokenShape,
  matchPairs,
  countMax,
  marbleTrack,
  bridgeSpan,
  mazeClock,
  chaseBoard,
  hopBoard,
  toastBoard,
  toastPace,
  aisleBoard,
  lilyBoard,
  traceBoard,
  sortBoard,
  sortDeal,
  mergeBoard,
  crayonBoard,
  crayonPicture,
  crayonLegend
} from './logic.mjs?v=lily-cross';
import { canSpeak, commonLines, contextFor, getSpeechStatus, knownVoice, onSpeechStatus, prefetchSpeech, prepareSpeech, profiles, sampleLine, speak, speakAndWait, stop, voiceFor, voices, warm } from './speech.js?v=voice-life';
import { mountCatch, mountLanes, mountRace, mountRocket, pokeRocket, stopArcade } from './arcade.js?v=gas-car';
import { mountLunar } from './lunar.js?v=moon-board';
import { mountHook, stopHook } from './hook.js?v=hook-reach';
import { mountSky, stopSky } from './sky.js?v=sky-space';
import { mountPlanet, stopPlanet } from './planet.js?v=planet-aim';
import { mountPuzzle, stopPuzzle } from './puzzle.js?v=puzzle-glass';
import { mountMatch, stopMatch } from './match.js?v=pair-match';
import { mountChase, stopChase } from './chase.js?v=chase-clear';
import { mountHop, stopHop } from './hop.js?v=hop-doodle';
import { mountToast, stopToast } from './toast.js?v=toast-pop';
import { mountGlide, stopGlide } from './glide.js?v=island-steer2';
import { mountAisle, stopAisle } from './aisle.js?v=market-walk2';
import { mountLily, stopLily } from './lily.js?v=lily-cross';
import { mountTrace, stopTrace } from './trace.js?v=trace-car2';
import { mountSort, stopSort } from './sort.js?v=sort-roll';
import { mountMerge, stopMerge } from './merge.js?v=learn-three';
import { mountCrayon, stopCrayon } from './crayon.js?v=color-num';
import { mountMarble, stopMarble } from './marble.js?v=marble-path';
import { mountBridge, stopBridge } from './bridge.js?v=bridge-run';
import { mountMaze, stopMaze } from './maze.js?v=maze-board';
import { findBuiltSidecars, mountSidecar, postSidecar, sidecarGame, sidecarIsBuilt, sidecarRows, stopSidecar } from './sidecar.js?v=arcade-play';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const defaults = () => ({
  active: 0,
  sound: true,
  voice: 'af_heart',
  characterVoices: false,
  camera: false,
  profiles: [
    { name: 'Malik', stage: 'preschool', level: 1, rounds: 5, style: 'tap', words: ['I', 'a', 'the', 'my', 'see'], stars: 0, sessions: 0, correct: 0, total: 0 },
    { name: 'Micah', stage: 'kindergarten', level: 2, rounds: 5, style: 'tap', words: ['I', 'a', 'the', 'my', 'see'], stars: 0, sessions: 0, correct: 0, total: 0, levels: { count: 2, path: 2 } },
    { name: 'Mitch', stage: 'grade4', level: 3, rounds: 5, style: 'tap', words: ['I', 'a', 'the', 'my', 'see'], stars: 0, sessions: 0, correct: 0, total: 0, levels: { count: 3, path: 3 } }
  ]
});

let data;
try {
  data = JSON.parse(localStorage.getItem('sprouts-v1'));
  if (!data?.profiles?.length) data = defaults();
} catch {
  data = defaults();
}
const learnerNames = ['Malik', 'Micah', 'Mitch'];
const LEARNER_LIMIT = 8;
let named = false;
data.profiles.forEach((profile, i) => {
  const slot = `Learner ${i + 1}`;
  if (learnerNames[i] && (!profile.name || profile.name === slot)) {
    profile.name = learnerNames[i];
    named = true;
  }
  profile.stage = stageOf(profile, i);
  const questions = roundCount(profile.rounds);
  if (questions !== profile.rounds) {
    profile.rounds = questions;
    named = true;
  }
  if (!SPRITES.includes(profile.sprite)) {
    profile.sprite = profileSprite(profile, i);
    named = true;
  }
});
if (!Number.isInteger(+data.active) || !data.profiles[+data.active]) {
  data.active = 0;
  named = true;
} else data.active = +data.active;
data.voice = knownVoice(data.voice);
data.characterVoices = !!data.characterVoices;
if (data.sheet && !Array.isArray(data.sheet.rows)) delete data.sheet;
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQdhKSZBII7leKaxTQ6mRPG0Q6POsFtOrCADtNIFDl6yrlnPoCXLXaUCsGvzzNIZPodTxfOHnAjP5MQ/pub?output=csv';
let game = null, lunarCourt = null, storageOK = true, camera = null, cleanSnapshot = '', askResolve = null, loadingForm = false;
let grownupOk = false, gateNext = null, gateAnswer = 0, askYesOnCancel = false, coverTimer = 0, rocketTimer = 0, laneTimer = 0, hookTimer = 0, skyTimer = 0, planetTimer = 0, matchTimer = 0, learnTimer = 0, bridgeTimer = 0, chaseTimer = 0, hopTimer = 0, toastTimer = 0, glideTimer = 0, aisleTimer = 0, lilyTimer = 0, rallyTimer = 0;
const p = () => data.profiles[data.active];
const questionCount = () => roundCount(p().rounds);
const band = () => stageOf(p(), data.active);

function save() {
  try { localStorage.setItem('sprouts-v1', JSON.stringify(data)); }
  catch { storageOK = false; }
}
if (named) save();
function loadBoard() {
  try {
    const list = JSON.parse(localStorage.getItem(BOARD_KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
function saveBoard(list) {
  try { localStorage.setItem(BOARD_KEY, JSON.stringify(list)); }
  catch { storageOK = false; }
}

const colors = [['red', '#dc6253'], ['blue', '#538cbf'], ['yellow', '#f5d400'], ['green', '#76a265'], ['orange', '#e99d4d'], ['purple', '#a381c0'], ['pink', '#e5a2bd'], ['brown', '#9a7153'], ['black', '#343c3a'], ['white', '#ffffff']];
const shapes = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'diamond', 'star', 'hexagon'];
const games = [['shapes', 'Shape safari', 'Find circles, triangles & more.', '◒', '#edf0df', 'SHAPES'], ['colors', 'Color garden', 'Pick a color. Grow your skills.', '✿', '#f9e6dc', 'COLORS'], ['mix', 'Jump to it!', 'Match a shape and its color.', '◆', '#e4edf4', 'MIX & MATCH'], ['missing', 'What’s missing?', 'A little look. A big memory!', '☁', '#eee7f5', 'MEMORY'], ['words', 'Word parking', 'Drive into a new sight word.', '🚙', '#fcf0d5', 'READING'], ['build', 'Build a word', 'Little letters, big discoveries.', 'abc', '#e3eee7', 'LETTERS'], ['count', 'Count & clap', 'Count it, jump it, clap it.', '🍎', '#fbe9e3', 'COUNTING'], ['path', 'Number path', 'Hop along the numbers.', '🐸', '#e6efe9', 'NUMBERS'], ['catch', 'Catch the answer', 'Grab the right number as it falls.', '🧺', '#fbe9e3', 'MATH'], ['lanes', 'Word lanes', 'Steer into the word you hear.', '🚗', '#fcf0d5', 'READING'], ['rocket', 'Rocket climb', 'Answer in time and fly to space.', '🚀', '#e7f1f6', 'WORDS + MATH'], ['lunar', 'Moon shot', 'Answer, then shoot the freethrow.', '🌙', '#e4eef6', 'SPACE'], ['race', 'Gas race', 'Drive to the answer. See who goes furthest.', '⛽', '#f8efd4', 'RACE'], ['hook', 'Hook the fish', 'Steer the hook onto the right fish.', '🎣', '#d7eef5', 'FISHING'], ['sky', 'Sky shot', 'Shoot the rock with the right answer.', '🛸', '#d9e4f2', 'SPACE'], ['planet', 'Planet guard', 'Aim and keep the planet safe.', '🪐', '#d7e6f4', 'SPACE'], ['puzzle', 'Shape puzzle', 'Build the pieces, then tap or say the shape.', '🧩', '#e5f4ef', 'SHAPES'], ['match', 'Pair match', 'Flip cards. Match shapes, colors, numbers, and words.', '🃏', '#f3efe4', 'MEMORY'], ['marble', 'Marble path', 'Shoot one color. Points raise the level.', '🔴', '#fde8e4', 'COLORS'], ['bridge', 'Stick bridge', 'Hold the stick across each gap. Reach the last platform.', '🪵', '#f3ead7', 'WORDS + MATH'], ['maze', 'Tilt maze', 'Tilt to the flag. A right answer adds time.', '🧭', '#e4eef6', 'MAZE'], ['chase', 'Garden chase', 'Eat the berries that match your words, numbers, shapes, and colors.', '🫐', '#e7f0d8', 'MAZE'], ['hop', 'Sprout hop', 'Bounce up the leaves and hop on the right answer.', '🌿', '#e4f2ea', 'JUMP'], ['toast', 'Toast pop', 'Tap the toast with the right answer.', '🍞', '#f8e6c8', 'CATCH'], ['glide', 'Island glide', 'Hold to climb. Let go to dive. Grab the gem with the answer.', '✈', '#d7ebf5', 'FLIGHT'], ['aisle', 'Market walk', 'Walk the market and pick up the right thing before time runs out.', '🧺', '#f6efe2', 'SHOP'], ['lily', 'Lily cross', 'Hop across the road and the river. Land on the right lily pad.', '🪷', '#d7eef2', 'POND'], ['trace', 'Trace drive', 'Trace the path. A car drives it.', '✎', '#e7f0df', 'TRACE'], ['sort', 'Sort bins', 'Tap a tube. Pour the top balls onto a match or into an empty tube.', '🧪', '#f8efd4', 'SORT'], ['merge', 'Merge jar', 'Drop two that match. Make the next one.', '◎', '#e4eef6', 'MERGE'], ['crayon', 'Color by number', 'Paint each number the color in the legend.', '🖍', '#fde8f0', 'COLORS']].concat(sidecarRows());
const countItems = [['🍎', 'apples'], ['⭐', 'stars'], ['🐞', 'ladybugs'], ['🌼', 'flowers'], ['🐟', 'fish'], ['🎈', 'balloons']];
const huntThings = [['sock', 'socks'], ['spoon', 'spoons'], ['toy', 'toys'], ['book', 'books'], ['block', 'blocks'], ['crayon', 'crayons']];
const styles = [['tap', '👆', 'Tap', 'Tap the answer on the screen.'], ['move', '🦘', 'Move', 'Spread floor cards out. The game calls the moves and a grown-up taps ✓.'], ['hunt', '🔎', 'Hunt', 'Find real things around you. A grown-up taps ✓. What’s missing? plays as Move.'], ['reach', '📷', 'Reach', 'Stand back so the camera sees shoulders and hands. Hold one hand on an answer until it fills. Video stays on this device and is never recorded.']];
const ARCADE_PLAY = new Set(['bike', 'flight', 'walk', 'lunar', 'bridge', 'maze', 'chase', 'hop', 'toast', 'glide', 'aisle', 'lily']);
const moves = [['Hop like a bunny', '🐰'], ['Stomp like an elephant', '🐘'], ['Tiptoe like a mouse', '🐭'], ['Waddle like a penguin', '🐧'], ['Gallop like a horse', '🐴'], ['Crawl like a turtle', '🐢'], ['Leap like a frog', '🐸']];
const breaks = ['Run to the door and back!', 'Spin around three times!', 'Do five big jumps!', 'March in a circle and come back!'];
const listen = {
  words: { tap: 'Listen, then park your car.', move: 'Listen, then drive to the word.', hunt: 'Listen, then find the word.' },
  build: { tap: 'Listen, then build the word.', move: 'Listen, then collect the letters.', hunt: 'Listen, then find the letters.' },
  lanes: { tap: 'Listen, then drive to the word.', move: 'Listen, then drive to the word.', hunt: 'Listen, then drive to the word.', reach: 'Listen, then step into the word. You have 10 seconds.' },
  rocket: { tap: 'Listen, then pick the word.', move: 'Listen, then pick the word.', hunt: 'Listen, then pick the word.' },
  lunar: { tap: 'Listen, then pick the word and shoot.', move: 'Listen, then pick the word and shoot.', hunt: 'Listen, then pick the word and shoot.' },
  race: { tap: 'Listen, then drive to the word.', move: 'Listen, then drive to the word.', hunt: 'Listen, then drive to the word.' },
  hook: { tap: 'Listen, then hook the fish.', move: 'Listen, then hook the fish.', hunt: 'Listen, then hook the fish.', reach: 'Listen, then move your hand onto the fish.' },
  sky: { tap: 'Listen, then shoot the right rock.', move: 'Listen, then shoot the right rock.', hunt: 'Listen, then shoot the right rock.' },
  planet: { tap: 'Listen, then shoot the right rock.', move: 'Listen, then shoot the right rock.', hunt: 'Listen, then shoot the right rock.' },
  bridge: { tap: 'Answer, then hold to grow the stick.' },
  maze: { tap: 'Listen, then pick the word to add time.' },
  chase: { tap: 'Listen, then eat the right berries.', move: 'Listen, then eat the right berries.', hunt: 'Listen, then eat the right berries.', reach: 'Listen, then eat the right berries.' },
  hop: { tap: 'Bounce up the leaves, then hop on the right one.', move: 'Bounce up the leaves, then hop on the right one.', hunt: 'Bounce up the leaves, then hop on the right one.', reach: 'Bounce up the leaves, then hop on the right one.' },
  toast: { tap: 'Listen, then pop the right toast.', move: 'Listen, then pop the right toast.', hunt: 'Listen, then pop the right toast.', reach: 'Listen, then pop the right toast.' },
  glide: { tap: 'Listen, then grab the right gem.' },
  aisle: { tap: 'Listen, then find it in the market.', move: 'Listen, then find it in the market.', hunt: 'Listen, then find it in the market.', reach: 'Listen, then find it in the market.' },
  lily: { tap: 'Listen, then hop to the right pad.', move: 'Listen, then hop to the right pad.', hunt: 'Listen, then hop to the right pad.', reach: 'Listen, then hop to the right pad.' },
  rally: { tap: 'Listen, then tap the right answer.' },
  bike: { tap: 'Listen, then tap the right answer.' },
  flight: { tap: 'Listen, then fly through the word.', move: 'Listen, then fly through the word.', hunt: 'Listen, then fly through the word.', reach: 'Listen, then fly through the word.' },
  walk: { tap: 'Listen, then walk to the word.', move: 'Listen, then walk to the word.', hunt: 'Listen, then walk to the word.', reach: 'Listen, then walk to the word.' },
  trace: { tap: 'Start at the dot and stay on the line.' },
  sort: { tap: 'Tap a tube, then pour into a match or an empty tube.' },
  merge: { tap: 'Drop two that match so they touch.' }
};
const RACE_LABELS = { facts: 'math facts', words: 'sight words', shapes: 'shapes', colors: 'colors' };
const BOARD_KEY = 'sprouts-race-board';
const shuffle = a => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const pick = a => a[Math.floor(Math.random() * a.length)];
const an = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
const pools = l => ({ n: [3, 4, 6][l - 1], ss: shapes.slice(0, [3, 5, 8][l - 1]), cs: colors.slice(0, [4, 6, 10][l - 1]) });
function matchFaces(level) {
  const count = matchPairs(level);
  const { ss, cs } = pools(Math.min(3, Math.max(1, level)));
  const hi = countMax(band(), Math.min(3, Math.max(1, level)), 'tap');
  const take = list => shuffle([...list]);
  const groups = [
    take(ss).map(name => ({ id: `shape:${name}`, label: name, html: shape(name, '#5d7a45') })),
    take(cs).map(([name, hex]) => ({ id: `color:${name}`, label: name, html: `${swatch(name, hex)}<span class="match-name">${esc(name)}</span>` })),
    take(numberRange(1, Math.max(1, hi))).map(n => ({ id: `number:${n}`, label: String(n), html: `<b class="match-num">${n}</b>` })),
    take(wordList()).map(word => ({ id: `word:${word}`, label: word, html: `<b class="match-word">${esc(word)}</b>` }))
  ].filter(group => group.length);
  const faces = [];
  let turn = 0;
  while (faces.length < count && groups.some(group => group.length)) {
    const group = groups[turn % groups.length];
    if (group.length) faces.push(group.pop());
    turn += 1;
  }
  return faces;
}
function sortPieces(kind, count) {
  if (kind === 'colors') {
    return shuffle(pools(skillLevel('colors')).cs).slice(0, count).map(([name, hex]) => ({
      id: name, label: name, fill: hex, html: swatch(name, hex)
    }));
  }
  if (kind === 'shapes') {
    return shuffle(pools(skillLevel('shapes')).ss).slice(0, count).map(name => ({
      id: name, label: name, html: shape(name, '#5d7a45')
    }));
  }
  if (kind === 'words') {
    return shuffle(wordList()).slice(0, count).map(word => ({
      id: word, label: word, html: `<b class="sort-word">${esc(word)}</b>`
    }));
  }
  const hi = countMax(band(), Math.min(3, Math.max(1, skillLevel('count'))), 'tap');
  return shuffle(numberRange(1, Math.max(1, hi))).slice(0, count).map(n => ({
    id: String(n), label: String(n), html: `<b class="sort-num">${n}</b>`
  }));
}
function prepareTrace(g, l) {
  const board = traceBoard(l);
  g.board = board;
  g.options = [];
  g.render = x => esc(String(x));
  if (board.kind === 'shape') {
    const names = l >= 2 ? shapes.slice(3) : shapes.slice(0, 3);
    g.traceKind = 'shape';
    g.target = pick(names);
    g.prompt = `Trace the ${g.target}.`;
    return;
  }
  const letters = [...pick(wordList()).toLowerCase()].filter(ch => /[a-z]/.test(ch));
  if (g.index % 2 === 1 && letters.length) {
    g.traceKind = 'letter';
    g.target = pick(letters);
    g.prompt = `Trace the letter ${g.target}.`;
    return;
  }
  const hi = Math.min(9, countMax(band(), Math.min(3, Math.max(1, skillLevel('count'))), 'tap'));
  g.traceKind = 'number';
  g.target = String(1 + Math.floor(Math.random() * hi));
  g.prompt = `Trace the number ${g.target}.`;
}
function prepareCrayon(g, l) {
  const board = crayonBoard(l);
  const picture = crayonPicture(l, g.index);
  const pool = pools(skillLevel('colors')).cs.filter(([name]) => name !== 'black' && name !== 'white');
  const palette = [];
  const bag = shuffle(pool);
  while (palette.length < board.colors) {
    if (!bag.length) bag.push(...shuffle(pool));
    palette.push(bag.pop());
  }
  const countLevel = Math.min(3, Math.max(1, skillLevel('count')));
  const hi = Math.max(board.colors, countMax(band(), countLevel, 'tap'));
  const numbers = shuffle(numberRange(1, hi)).slice(0, board.colors);
  const legend = crayonLegend(picture.regions.map(region => region.id), palette, numbers);
  const spoken = [...legend].sort((a, b) => a.number - b.number)[0];
  g.board = board;
  g.picture = picture;
  g.legend = legend;
  g.swatch = spoken;
  g.target = picture.name;
  g.options = [];
  g.render = x => esc(String(x));
  g.prompt = `Paint the ${picture.name}. ${spoken.number} is ${spoken.name}.`;
}
function prepareSort(g, l) {
  const board = sortBoard(l);
  g.board = board;
  g.options = [];
  g.render = x => esc(String(x));
  const kind = l >= 3 ? (g.index % 2 ? 'words' : 'numbers') : l === 2 ? (g.index % 2 ? 'shapes' : 'colors') : 'colors';
  let pieces = sortPieces(kind, board.colors);
  if (pieces.length < 2) pieces = sortPieces('colors', 2);
  g.pieces = pieces;
  g.tubes = sortDeal(pieces.map(piece => piece.id), board);
  g.target = kind;
  g.prompt = {
    colors: 'Pour until each tube is one color.',
    shapes: 'Pour until each tube is one shape.',
    numbers: 'Pour until each tube is one number.',
    words: 'Pour until each tube is one word.'
  }[kind];
}
function doublingChain(seed, length, max) {
  const chain = [seed];
  while (chain.length < length) {
    const next = chain[chain.length - 1] * 2;
    if (max && next > max) break;
    chain.push(next);
  }
  if (chain.length < 2) chain.push(chain[0] * 2);
  return chain.map(String);
}
function prepareMerge(g, l) {
  const board = mergeBoard(l);
  g.board = board;
  g.options = [];
  g.render = x => esc(String(x));
  const stage = band();
  if (stage !== 'grade4' && g.index % 2 === 0) {
    const names = pools(skillLevel('shapes')).ss;
    const name = pick(names);
    const others = shuffle(names.filter(item => item !== name));
    g.chain = [name, `big:${name}`];
    g.mergeTarget = `big:${name}`;
    g.mergeKind = 'shape';
    g.target = name;
    g.prompt = `Make the ${name}. Drop two that match.`;
    const queue = [
      { id: name, label: name, draw: 'shape' },
      { id: name, label: name, draw: 'shape' }
    ];
    if (others[0] && board.count >= 4) {
      queue.push({ id: others[0], label: others[0], draw: 'shape' });
      queue.push({ id: others[0], label: others[0], draw: 'shape' });
    }
    others.slice(1).forEach(item => { if (queue.length < board.count) queue.push({ id: item, label: item, draw: 'shape' }); });
    let n = 0;
    while (queue.length < board.count) {
      const item = names[n % names.length];
      queue.push({ id: `${item}:${queue.length}`, label: item, draw: 'shape' });
      n += 1;
    }
    g.queue = shuffle(queue);
    return;
  }
  const max = stage === 'grade4' ? 32 : countMax(stage, Math.min(3, Math.max(1, skillLevel('count'))), 'tap');
  const seed = stage === 'grade4' ? 2 + Math.floor(Math.random() * 5) : 1;
  const chain = doublingChain(seed, board.chain, max);
  const precursor = chain[chain.length - 2];
  const target = chain[chain.length - 1];
  g.chain = chain;
  g.mergeTarget = target;
  g.mergeKind = 'number';
  g.target = target;
  g.prompt = `Make ${target}. Drop two ${precursor}s.`;
  const queue = [
    { id: precursor, label: precursor, draw: 'text' },
    { id: precursor, label: precursor, draw: 'text' }
  ];
  if (board.count >= 4) {
    let decoy = 3;
    while (chain.includes(String(decoy))) decoy += 1;
    queue.push({ id: String(decoy), label: String(decoy), draw: 'text' });
    queue.push({ id: String(decoy), label: String(decoy), draw: 'text' });
  }
  let extra = 3;
  while (queue.length < board.count) {
    while (chain.includes(String(extra)) || queue.some(item => item.label === String(extra))) extra += 1;
    queue.push({ id: `${extra}:${queue.length}`, label: String(extra), draw: 'text' });
    extra += 1;
  }
  g.queue = shuffle(queue);
}
function sheetRows(game) {
  const name = p().name.trim().toLowerCase();
  return (data.sheet?.rows || []).filter(r => r.game === game && (r.learner === '*' || r.learner.toLowerCase() === name));
}
function wordList() {
  const fromSheet = wordsFromSheet(data.sheet?.rows, p().name, band());
  return fromSheet.length ? fromSheet : p().words;
}
function countPool() {
  const rows = sheetRows('count').filter(r => r.item && r.item.length <= 24);
  return rows.length ? rows.map(r => [r.extra || '⭐', r.item]) : countItems;
}
function huntPool() {
  const rows = sheetRows('hunt').filter(r => /^[A-Za-z][A-Za-z' -]{0,24}$/.test(r.item));
  if (!rows.length) return huntThings;
  return rows.map(r => {
    const one = r.item.toLowerCase();
    const many = (r.extra || (one.endsWith('s') ? one : `${one}s`)).toLowerCase();
    return [one, many];
  });
}
function factPool() {
  const rows = sheetRows('facts');
  return rows.length ? factSetFromRows(rows) : null;
}
const mixDeck = l => {
  const { ss, cs } = pools(l);
  return ss.flatMap((s, i) => [cs[i % cs.length], cs[(i + 2) % cs.length]].map(c => `${c[0]} ${s}`));
};
const roundActive = () => !!(game && !game.finished);

function voiceNow(mode = game?.mode) {
  return voiceFor(contextFor(mode), data.voice, data.characterVoices);
}
function say(t) {
  if (data.sound) speak(t, voiceNow(), { context: contextFor(game?.mode) });
}
function wordPrompt(mode, word, style) {
  if (mode === 'lanes') return style === 'reach' ? `Step into the word ${word}. You have 10 seconds.` : `Drive to the word ${word}.`;
  return mode === 'words' ? `Park on the word ${word}.` : `Build the word ${word}.`;
}
function prefetchRound(g) {
  if (!data.sound) return;
  const voiceId = voiceNow(g.mode);
  const words = ['words', 'build', 'lanes'].includes(g.mode) ? wordList().slice(0, 8).map(w => wordPrompt(g.mode, w, g.style)) : [];
  prefetchSpeech(words.concat(commonLines).map(text => ({ text, voiceId })), { priority: 'next' });
}
function stopSpeech() {
  stop();
}
function focusHeading() {
  const h = $('#app h1');
  if (!h) return;
  h.tabIndex = -1;
  try { h.focus({ preventScroll: true, focusVisible: false }); }
  catch { h.focus(); }
}
function shape(s, c = '#8fac73', named = false) {
  const light = String(c).toLowerCase() === '#ffffff';
  const label = named ? ` role="img" aria-label="${esc(s)}"` : ' aria-hidden="true"';
  return `<span class="shape ${s}${light ? ' light' : ''}"${label} style="--shape-color:${c}"></span>`;
}
function swatch(name, hex) {
  const light = name === 'white' || name === 'yellow';
  return `<span class="swatch${light ? ' light' : ''}" style="background:${hex}" aria-hidden="true"></span>`;
}
function skillLevel(id) { return +(p().levels?.[id] || p().level); }
function styleOf(id) {
  let s = p().style || 'tap';
  if (s === 'reach' && !data.camera) s = 'tap';
  if (s === 'hunt' && id === 'missing') s = 'move';
  return s;
}
const keyFor = (style, level) => progressKey(style, level);
function record(id) {
  return p().skills?.[id]?.[keyFor(styleOf(id), skillLevel(id))] || { total: 0, correct: 0, sessions: 0 };
}
function skillBadge(id) {
  const state = skillState(record(id));
  const mark = state === 'Flourishing' ? '★ ' : state === 'Growing' ? '🌱 ' : '';
  return `${mark}${state} · Level ${skillLevel(id)}`;
}
function listedGames() {
  return games.filter(([id]) => !sidecarGame(id) || sidecarIsBuilt(id));
}
function recommended() {
  return [...listedGames()].sort((a, b) => {
    const x = record(a[0]), y = record(b[0]);
    return (x.total ? x.correct / x.total + 1 : 0) - (y.total ? y.correct / y.total + 1 : 0);
  })[0];
}
function pathPanel() {
  const next = recommended();
  return `<section class="pathpanel"><div><small>YOUR LEARNING PATH</small><h3>One little adventure at a time</h3><p>Up next: ${next[1]} · Practice a new or growing skill.</p></div><button class="primary" data-game="${next[0]}" aria-label="Play ${esc(next[1])}">Let’s learn →</button></section>`;
}
function styleBar() {
  const cur = styleOf(''), info = styles.find(s => s[0] === cur);
  const arcadeNote = p().arcade ? '<p>Arcade play is on. Dirt ride, Sky flight, Garden walk, Moon shot, Stick bridge, Tilt maze, Garden chase, Sprout hop, Toast pop, Island glide, Market walk, and Lily cross skip the questions.</p>' : '';
  return `<section class="stylebar"><div><small>HOW ARE WE PLAYING?</small><div class="styles">${styles.filter(s => s[0] !== 'reach' || data.camera).map(([id, icon, label]) => `<button class="stylebtn ${id === cur ? 'selected' : ''}" data-style="${id}" aria-pressed="${id === cur}"><span aria-hidden="true">${icon}</span> ${label}</button>`).join('')}</div><p>${info[3]}${cur === 'move' ? ' Clear a space, use bare feet or grippy socks, and stay close.' : ''}</p>${arcadeNote}</div>${cur === 'move' ? '<button class="quiet" id="printCards"><span aria-hidden="true">🖨</span> Print floor cards</button>' : ''}</section>`;
}
function gameCard(id) {
  const row = games.find(g => g[0] === id);
  if (!row) return '';
  const [gid, name, desc, icon, tint, tag] = row;
  const blurb = gid === 'count' || gid === 'path' || gid === 'catch' ? mathBlurb(band(), gid) : desc;
  const state = skillState(record(gid));
  const label = `${name}, ${stageLabel(band())}, Level ${skillLevel(gid)}, ${state}. ${blurb}`;
  return `<button class="card" data-game="${gid}" style="--tint:${tint}" aria-label="${esc(label)}"><div class="card-top"><span class="icon" aria-hidden="true">${icon}</span><span class="tag" aria-hidden="true">${tag}</span></div><span class="card-title">${name}</span><p>${blurb}</p><div class="skillbadge">${skillBadge(gid)}</div><span class="arrow" aria-hidden="true">↗</span></button>`;
}
function stopLunar() {
  lunarCourt?.destroy();
  lunarCourt = null;
}
function clearCover() {
  clearTimeout(coverTimer);
  coverTimer = 0;
}
function clearRocketTimer() {
  clearTimeout(rocketTimer);
  rocketTimer = 0;
}
function clearLaneTimer() {
  clearTimeout(laneTimer);
  laneTimer = 0;
}
function laneDriveSpeed(g) {
  const level = [0.14, 0.2, 0.28][(g.level || 1) - 1] || 0.14;
  if (g.survival) return Math.min(0.62, level * (1.28 ** (g.laneClears || 0)));
  if (g.pace === 'slow') return 0.1;
  if (g.pace === 'fast') return 0.4;
  return level;
}
function lanePaceName(g) {
  if (g.survival) {
    const n = g.laneClears || 0;
    if (n >= 6) return 'Flying';
    if (n >= 3) return 'Fast';
    if (n >= 1) return 'Faster';
    return 'Survival';
  }
  if (g.pace === 'slow') return 'Slow';
  if (g.pace === 'fast') return 'Fast';
  return 'Steady';
}
function clearHookTimer() {
  clearTimeout(hookTimer);
  hookTimer = 0;
}
function continueHook(g) {
  clearHookTimer();
  const rounds = questionCount();
  hookTimer = setTimeout(() => {
    hookTimer = 0;
    if (game !== g || g.finished) return;
    if (document.querySelector('dialog[open]')) { continueHook(g); return; }
    g.index++;
    if (g.index >= rounds) finish();
    else question();
  }, data.sound ? 1600 : 700);
}
function clearSkyTimer() {
  clearTimeout(skyTimer);
  skyTimer = 0;
}
function clearMatchTimer() {
  clearTimeout(matchTimer);
  matchTimer = 0;
}
function clearLearnTimer() {
  clearTimeout(learnTimer);
  learnTimer = 0;
}
function continueLearn(g) {
  clearLearnTimer();
  const rounds = questionCount();
  learnTimer = setTimeout(() => {
    learnTimer = 0;
    if (game !== g || g.finished) return;
    if (document.querySelector('dialog[open]')) { continueLearn(g); return; }
    g.index++;
    if (g.index >= rounds) finish();
    else question();
  }, data.sound ? 1400 : 600);
}
function continueMatch(g) {
  clearMatchTimer();
  const rounds = questionCount();
  matchTimer = setTimeout(() => {
    matchTimer = 0;
    if (game !== g || g.finished) return;
    if (document.querySelector('dialog[open]')) { continueMatch(g); return; }
    g.index++;
    if (g.index >= rounds) finish();
    else question();
  }, data.sound ? 1400 : 600);
}
function endSky() {
  const g = game;
  if (!g || g.finished || g.mode !== 'sky') return;
  g.finished = true;
  clearSkyTimer();
  stopSky();
  camOff();
  const played = Math.max(1, (g.index | 0) + 1);
  const correct = Math.min(played, g.firstCorrect || 0);
  Object.assign(p(), applyRound(p(), g.mode, g.key, played, correct));
  save();
  const stars = played === 1 ? '1 learning star' : `${played} learning stars`;
  $('#app').innerHTML = `<section class="playarea"><div class="result-star" aria-hidden="true">🌟</div><h1>Game over</h1><p>You got ${stars}.</p><p class="hint">First try: ${correct} of ${played}</p>${starGardenHtml()}<button class="primary" id="again">Play again</button> <button class="quiet" id="all">Choose a game</button></section>`;
  $('#again').onclick = () => start('sky');
  $('#all').onclick = home;
  say(`Game over. You got ${stars}.`);
  focusHeading();
}
function clearPlanetTimer() {
  clearTimeout(planetTimer);
  planetTimer = 0;
}
function endPlanet() {
  const g = game;
  if (!g || g.finished || g.mode !== 'planet') return;
  g.finished = true;
  clearPlanetTimer();
  stopPlanet();
  camOff();
  const played = Math.max(1, (g.index | 0) + 1);
  const correct = Math.min(played, g.firstCorrect || 0);
  Object.assign(p(), applyRound(p(), g.mode, g.key, played, correct));
  save();
  const stars = played === 1 ? '1 learning star' : `${played} learning stars`;
  $('#app').innerHTML = `<section class="playarea"><div class="result-star" aria-hidden="true">🌟</div><h1>Game over</h1><p>You got ${stars}.</p><p class="hint">First try: ${correct} of ${played}</p>${starGardenHtml()}<button class="primary" id="again">Play again</button> <button class="quiet" id="all">Choose a game</button></section>`;
  $('#again').onclick = () => start('planet');
  $('#all').onclick = home;
  say(`Game over. You got ${stars}.`);
  focusHeading();
}
function continuePlanet(g) {
  clearPlanetTimer();
  const rounds = questionCount();
  planetTimer = setTimeout(() => {
    planetTimer = 0;
    if (game !== g || g.finished) return;
    if (document.querySelector('dialog[open]')) { continuePlanet(g); return; }
    g.index++;
    if (g.index >= rounds) finish();
    else question();
  }, data.sound ? 1600 : 700);
}
function continueSky(g) {
  clearSkyTimer();
  const rounds = questionCount();
  skyTimer = setTimeout(() => {
    skyTimer = 0;
    if (game !== g || g.finished) return;
    if (document.querySelector('dialog[open]')) { continueSky(g); return; }
    g.index++;
    if (g.index >= rounds) finish();
    else question();
  }, data.sound ? 1600 : 700);
}
function continueChase(g) {
  clearTimeout(chaseTimer);
  const rounds = questionCount();
  chaseTimer = setTimeout(() => {
    chaseTimer = 0;
    if (game !== g || g.finished) return;
    if (document.querySelector('dialog[open]')) { continueChase(g); return; }
    g.index++;
    if (g.index >= rounds) finish();
    else question();
  }, data.sound ? 1500 : 650);
}
function continueRally(g) {
  clearTimeout(rallyTimer);
  const rounds = questionCount();
  rallyTimer = setTimeout(() => {
    rallyTimer = 0;
    if (game !== g || g.finished) return;
    if (document.querySelector('dialog[open]')) { continueRally(g); return; }
    g.index++;
    if (g.mode === 'rally') {
      const stops = g.rallyStops || rallyQuestionCount(rounds);
      const doneAsking = (g.rallyRights || 0) >= rallyClearCount(rounds) || g.index >= stops;
      paintRallyChrome(g);
      if (doneAsking) postSidecar({ type: 'clear' });
      else question();
      return;
    }
    if (g.index >= rounds) finish();
    else question();
  }, data.sound ? 1200 : 500);
}
function bikeConfig(g) {
  return {
    type: 'config',
    difficulty: {
      level: g.level,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches
    },
    reward: { boost: 1, slow: 1 },
    progress: { round: g.index, travel: g.bikeTravel || 0 },
    audio: data.sound !== false,
    arcade: !!g.freePlay
  };
}
function rallyMessage(g) {
  if (!g?.tokens?.length) return null;
  const message = {
    type: 'ask',
    prompt: heading(g),
    show: g.show || '',
    kind: g.rallyKind || '',
    round: g.index,
    level: g.level,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    choices: g.tokens.map(token => ({
      label: String(token.label),
      ok: !!token.ok,
      fill: token.fill || '',
      shape: token.shape || ''
    }))
  };
  if (g.rallyKind === 'spell') {
    message.word = String(g.target || '');
    message.letters = (g.letters || [...message.word]).map(letter => String(letter));
  }
  if (g.mode === 'rally') {
    message.stops = g.rallyStops || rallyQuestionCount(questionCount());
    message.gates = rallyGates(message.stops);
  }
  if (g.mode === 'flight') message.freeEvery = rallyClearCount(questionCount());
  return message;
}
function paintRallyChrome(g) {
  const rally = g.mode === 'rally';
  const rounds = rally ? rallyClearCount(questionCount()) : questionCount();
  const rights = Math.min(rounds, g.rallyRights || 0);
  const title = $('#app h1');
  if (title) title.textContent = rally && rights >= rounds ? 'Drive to the finish.' : heading(g);
  const tally = $('#rallyTally');
  if (tally) tally.textContent = rally ? (rights >= rounds ? 'Finish the stage' : `${rights} / ${rounds}`) : `${Math.min(g.index + 1, rounds)} / ${rounds}`;
  const now = rally ? rights : Math.min(g.index, rounds);
  const bar = document.querySelector('#app .progress div');
  const meter = document.querySelector('#app .progress');
  if (bar) bar.style.width = `${rounds ? now / rounds * 100 : 0}%`;
  if (meter) {
    meter.setAttribute('aria-valuenow', String(now));
    meter.setAttribute('aria-valuemax', String(rounds));
  }
}
function gradeRally(index) {
  const g = game;
  const token = g?.tokens?.[index];
  if (!g || g.finished || g.done || !token) return;
  const ok = !!token.ok;
  postSidecar({ type: 'mark', index, ok });
  const flightMiss = g.mode === 'flight' && !ok;
  g.done = !flightMiss;
  if (!ok) g.missed = true;
  else if (!g.missed) g.firstCorrect++;
  const line = g.mode === 'paint'
    ? (ok ? `Yes. ${g.target} was right.` : `Not yet. ${g.target} was right.`)
    : g.mode === 'flight'
    ? (ok ? (g.rallyKind === 'spell' ? `You spelled ${g.target}.` : 'Yes! Through the gate.') : 'Not yet. The plane turns back.')
    : g.mode === 'bike'
      ? (ok ? 'Good.' : 'Not yet. The bike speeds up.')
      : g.mode === 'walk'
        ? (ok ? 'You found it.' : 'Not yet. Walk to another one.')
        : (ok ? 'Yes! Turbo!' : 'Not yet. The car slows down.');
  const feedback = $('#feedback');
  if (feedback) feedback.textContent = line;
  const title = $('#app h1');
  if (title) title.textContent = line;
  say(line);
  if (flightMiss) return;
  if (g.mode === 'flight') {
    g.flightRights = (g.flightRights || 0) + 1;
    if (g.flightRights >= rallyClearCount(questionCount())) return;
  }
  if (g.mode === 'rally' && ok) g.rallyRights = (g.rallyRights || 0) + 1;
  continueRally(g);
}
function continueLanes(g, wait) {
  clearLaneTimer();
  const rounds = questionCount();
  laneTimer = setTimeout(() => {
    laneTimer = 0;
    if (game !== g || g.finished) return;
    if (document.querySelector('dialog[open]')) { continueLanes(g, 400); return; }
    g.index++;
    if (g.index >= rounds) finish();
    else question();
  }, wait ?? (data.sound ? 1700 : 800));
}
function home(focus) {
  clearCover();
  clearRocketTimer();
  clearLaneTimer();
  clearHookTimer();
  clearSkyTimer();
  clearPlanetTimer();
  clearMatchTimer();
  stopArcade();
  stopLunar();
  stopHook();
  stopSky();
  stopPlanet();
  stopPuzzle();
  stopMatch();
  stopMarble();
  stopBridge();
  stopMaze();
  stopChase();
  stopHop();
  stopToast();
  stopGlide();
  stopAisle();
  stopLily();
  stopTrace();
  stopSort();
  stopMerge();
  stopCrayon();
  stopSidecar();
  clearLearnTimer();
  clearTimeout(chaseTimer);
  clearTimeout(hopTimer);
  clearTimeout(toastTimer);
  clearTimeout(glideTimer);
  clearTimeout(aisleTimer);
  clearTimeout(lilyTimer);
  clearTimeout(rallyTimer);
  chaseTimer = 0;
  hopTimer = 0;
  toastTimer = 0;
  glideTimer = 0;
  aisleTimer = 0;
  lilyTimer = 0;
  rallyTimer = 0;
  stopEars();
  game = null;
  camOff();
  stopSpeech();
  const learner = p();
  const avatar = { fox: '🦊', bear: '🐻', bunny: '🐰', frog: '🐸', owl: '🦉', chick: '🐤' }[profileSprite(learner, data.active)] || '🌱';
  const hello = `Hi, ${learner.name}. Tap a picture to play.`;
  const cards = listedGames().map(g => gameCard(g[0])).join('');
  $('#app').innerHTML = `<div class="learnerbar"><div class="profiles"><span class="profile selected"><span class="avatar" aria-hidden="true">${avatar}</span><span>${esc(learner.name)}</span></span></div><div class="stars"><span aria-hidden="true">⭐</span> ${esc(starChip(learner))}</div></div><section class="hero"><div><h1>Hi, ${esc(learner.name)}.<br><em>Tap a picture to play.</em></h1></div><div class="garden" aria-hidden="true"><div class="sun">◡</div><div class="hill"></div><div class="sprout"><div class="leaf"></div><div class="leaf two"></div></div><div class="buddy">◡</div><div class="buddy blue">◡</div></div></section>${starGardenHtml(true)}<div class="sectionhead"><h2>What shall we play?</h2></div>${styleBar()}${pathPanel()}<section class="games">${cards}</section><div class="bottom-note"><span style="font-size:25px" aria-hidden="true">🌱</span><div><b>Growing at their own pace.</b> ${learner.sessions ? esc(roundsSentence(learner)) : 'Most games wait for you. Rocket climb keeps going until it reaches space or comes back down. Gas race keeps going until the tank is empty or a lane is wrong.'}<br>Adjust levels, word lists, and the question sheet in Parent corner.${storageOK ? '' : ' Saving is unavailable in this browser.'}</div></div>`;
  document.querySelectorAll('[data-style]').forEach(b => b.onclick = () => { p().style = b.dataset.style; save(); home('style'); });
  document.querySelectorAll('[data-learner]').forEach(b => b.onclick = () => pickLearner(+b.dataset.learner));
  if ($('#printCards')) $('#printCards').onclick = openPrint;
  document.querySelectorAll('[data-game]').forEach(b => b.onclick = () => start(b.dataset.game));
  focusHeading();
  if (data.sound) warm(data.voice);
  if (data.sound && focus !== 'style' && focus !== 'more') say(hello);
}
function pickLearner(index) {
  if (!Number.isInteger(index) || index === data.active || !data.profiles[index]) return;
  data.active = index;
  save();
  const learner = p();
  home('style');
  if (data.sound) say(`${learner.name} has ${learner.stars === 1 ? '1 star' : `${learner.stars} stars`}.`);
}
function requestHome() {
  if (!roundActive()) { home(); return; }
  ask('Leave this round?', 'This round will not be saved.', 'Leave round', { keep: true }).then(ok => { if (ok) home(); });
}
function start(mode) {
  clearRocketTimer();
  clearLaneTimer();
  clearHookTimer();
  clearSkyTimer();
  clearPlanetTimer();
  clearMatchTimer();
  clearLearnTimer();
  clearTimeout(bridgeTimer);
  bridgeTimer = 0;
  clearTimeout(chaseTimer);
  clearTimeout(hopTimer);
  clearTimeout(toastTimer);
  clearTimeout(glideTimer);
  clearTimeout(lilyTimer);
  clearTimeout(rallyTimer);
  chaseTimer = 0;
  hopTimer = 0;
  toastTimer = 0;
  glideTimer = 0;
  lilyTimer = 0;
  rallyTimer = 0;
  const style = styleOf(mode);
  game = { mode, style, key: keyFor(style, skillLevel(mode)), index: 0, firstCorrect: 0, missed: false, done: false, finished: false, freePlay: !!p().arcade && ARCADE_PLAY.has(mode) };
  question();
  if (game?.mode === mode) prefetchRound(game);
}
function question() {
  const g = game;
  g.missed = false;
  g.done = false;
  g.armed = false;
  g.built = '';
  g.target2 = null;
  g.show = '';
  const l = skillLevel(g.mode);
  g.level = l;
  const { n, ss, cs } = pools(l);
  g.title = games.find(x => x[0] === g.mode)[1];
  g.phase = 'answer';
  if (g.mode === 'shapes') {
    g.target = pick(ss);
    g.prompt = `Find the ${g.target}.`;
    g.options = shuffle(ss).slice(0, n);
    if (!g.options.includes(g.target)) g.options[0] = g.target;
    g.render = x => shape(x);
  }
  if (g.mode === 'colors') {
    g.target = pick(cs)[0];
    g.prompt = `Find ${g.target}.`;
    g.options = shuffle(cs.map(c => c[0])).slice(0, n);
    if (!g.options.includes(g.target)) g.options[0] = g.target;
    g.render = x => swatch(x, colors.find(c => c[0] === x)[1]);
  }
  if (g.mode === 'mix') {
    const pool = ss.flatMap(s => cs.map(c => `${c[0]} ${s}`));
    g.target = pick(pool);
    g.prompt = `Find the ${g.target}.`;
    g.options = shuffle(pool.filter(x => x !== g.target)).slice(0, n - 1).concat(g.target);
    g.render = x => {
      const [c, s] = x.split(' ');
      return shape(s, colors.find(v => v[0] === c)[1]);
    };
    if (g.style === 'move') {
      const deck = mixDeck(l);
      g.target = pick(deck);
      if (l === 3) g.target2 = pick(deck.filter(x => x !== g.target));
    }
  }
  if (g.mode === 'missing') {
    g.memory = shuffle(ss).slice(0, [3, 4, 5][l - 1]);
    g.target = pick(g.memory);
    g.options = shuffle(ss).slice(0, n);
    if (!g.options.includes(g.target)) g.options[0] = g.target;
    g.prompt = 'Look carefully. Remember these shapes!';
    g.phase = 'remember';
    g.render = x => shape(x);
  }
  if (g.mode === 'words' || g.mode === 'build') {
    const words = wordList();
    g.target = pick(candidateWords(words, g.mode));
    g.prompt = wordPrompt(g.mode, g.target);
    g.options = shuffle(words.filter(x => x !== g.target)).slice(0, n - 1).concat(g.target);
    g.render = x => `${esc(x)}<span aria-hidden="true" style="font-size:20px">🚙</span>`;
    if (g.mode === 'build') g.letters = shuffle([...g.target, ...distractorLetters(g.target, l)]);
  }
  if (g.mode === 'count') {
    const [item, name] = pick(countPool());
    const q = g.math = countQuestion(band(), l, g.style, Math.random, factPool());
    g.target = q.target;
    g.countName = name;
    g.prompt = q.kind === 'count' ? `How many ${name}? Count them!` : q.question;
    g.options = choicesFor(q, n);
    g.render = x => String(x);
    if (q.show === 'array') g.show = `<div class="countrow array" style="--cols:${q.cols}" role="img" aria-label="${q.rows} rows of ${q.cols}">${Array(q.target).fill(`<span>${item}</span>`).join('')}</div>`;
    else if (q.show === 'items') g.show = `<div class="countrow" role="img" aria-label="${esc(name)} to count">${Array(g.target).fill(`<span>${item}</span>`).join('')}</div>`;
  }
  if (g.mode === 'path') {
    const q = g.path = pathQuestion(band(), l, Math.random, factPool());
    g.math = q;
    g.target = q.target;
    g.prompt = q.question;
    g.options = choicesFor(q, n);
    g.render = x => String(x);
    if (q.strip) g.show = `<div class="numpath" aria-hidden="true">${[...q.strip, '?'].map(x => `<span${x === '?' ? ' class="here"' : ''}>${x}</span>`).join('')}</div>`;
    else if (q.floor && q.hi <= 20 && q.kind !== 'find' && q.kind !== 'more') {
      const mark = q.a;
      g.show = `<div class="numpath" aria-hidden="true">${numberRange(q.lo, q.hi).map(x => `<span${x === mark ? ' class="here"' : ''}>${x}</span>`).join('')}</div>`;
    }
  }
  if (g.mode === 'catch') {
    loadScreenMath(g, l);
    g.speed = [0.16, 0.24, 0.36][l - 1];
    g.phase = 'ready';
  }
  if (g.mode === 'lanes') {
    const words = wordList();
    const count = laneCount(l, words.length);
    g.target = pick(words);
    g.prompt = wordPrompt(g.mode, g.target, g.style);
    g.options = shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, count - 1)).concat(g.target);
    g.speed = laneDriveSpeed(g);
    g.render = x => esc(x);
    g.phase = g.started ? 'play' : 'ready';
  }
  if (g.mode === 'rocket') {
    g.shown = false;
    g.subject = rocketSubject(g.index);
    g.seconds = fuelSeconds(l);
    if (g.altitude == null) g.altitude = 0.32;
    if (g.subject === 'words') {
      const words = wordList();
      const count = laneCount(l, words.length);
      g.math = null;
      g.target = pick(words);
      g.prompt = `Lift the rocket with the word ${g.target}.`;
      g.options = shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, count - 1)).concat(g.target);
      g.render = x => esc(x);
    } else loadScreenMath(g, l);
  }
  if (g.mode === 'lunar') {
    g.points ??= 0;
    g.shots ??= 0;
    g.streak ??= 0;
    g.subject = rocketSubject(g.index);
    g.world = ['moon', 'mars', 'earth'][l - 1];
    g.place = ['the Moon', 'Mars', 'Earth'][l - 1];
    if (g.freePlay) {
      g.math = null;
      g.target = '';
      g.prompt = `Shoot on ${g.place}.`;
      g.options = [];
      g.show = '';
      g.render = x => esc(String(x));
    } else if (g.subject === 'words') {
      const words = wordList();
      const count = laneCount(l, words.length);
      g.math = null;
      g.target = pick(words);
      g.prompt = `Pick the word ${g.target}, then take your shot.`;
      g.options = shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, count - 1)).concat(g.target);
      g.render = x => esc(x);
    } else loadScreenMath(g, l);
  }
  if (g.mode === 'race') {
    g.phase = 'ready';
    g.gates = 0;
    g.kind = '';
    g.lastKind = '';
    g.prompt = 'How far can you drive?';
    g.options = [];
    g.show = '';
    g.target = '';
    g.render = x => esc(String(x));
  }
  if (g.mode === 'hook') {
    g.shown = false;
    g.subject = rocketSubject(g.index);
    g.cast = hookCast(l);
    g.howTo = g.style === 'reach'
      ? (g.cast.trash ? 'Move your hand onto the right fish. Leave the trash.' : 'Move your hand onto the right fish.')
      : (g.cast.trash ? 'Steer the hook onto the right fish. Leave the trash.' : 'Steer the hook onto the right fish.');
    g.phase = g.started ? 'play' : 'ready';
    if (g.subject === 'words') {
      const words = wordList();
      const count = Math.min(g.cast.fish, Math.max(1, words.length));
      g.math = null;
      g.target = pick(words);
      g.prompt = `Hook the fish that says ${g.target}.`;
      g.options = shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, count - 1)).concat(g.target);
      g.render = x => esc(x);
    } else {
      loadScreenMath(g, l);
      const rest = g.options.filter(x => String(x) !== String(g.target));
      g.options = [...rest.slice(0, g.cast.fish - 1), g.target];
    }
  }
  if (g.mode === 'sky') {
    g.shown = false;
    g.subject = rocketSubject(g.index);
    g.wave = skyWave(l);
    g.howTo = 'Turn the ship and shoot the rock with the right answer. Dodge the ships that shoot back.';
    g.phase = g.started ? 'play' : 'ready';
    if (g.subject === 'words') {
      const words = wordList();
      const count = Math.min(g.wave.rocks, Math.max(1, words.length));
      g.math = null;
      g.target = pick(words);
      g.prompt = `Shoot the rock that says ${g.target}.`;
      g.options = shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, count - 1)).concat(g.target);
      g.render = x => esc(x);
    } else if (band() === 'grade4' && rallyPrefs(p()).span !== 'wide') {
      rallyMath(g, g.wave.rocks, rallyPrefs(p()).span);
    } else {
      loadScreenMath(g, l);
      const rest = g.options.filter(x => String(x) !== String(g.target));
      g.options = [...rest.slice(0, g.wave.rocks - 1), g.target];
    }
  }
  if (g.mode === 'planet') {
    g.shown = false;
    g.subject = rocketSubject(g.index);
    g.wave = planetWave(l);
    g.howTo = 'Aim the gun with the pointer. Click or tap to shoot the rock with the right answer. Rocks fly in from the edges.';
    g.phase = g.started ? 'play' : 'ready';
    if (g.subject === 'words') {
      const words = wordList();
      const count = Math.min(g.wave.rocks, Math.max(1, words.length));
      g.math = null;
      g.target = pick(words);
      g.prompt = `Shoot the rock that says ${g.target}.`;
      g.options = shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, count - 1)).concat(g.target);
      g.render = x => esc(x);
    } else {
      loadScreenMath(g, l);
      const rest = g.options.filter(x => String(x) !== String(g.target));
      g.options = [...rest.slice(0, g.wave.rocks - 1), g.target];
    }
  }
  if (g.mode === 'puzzle') {
    const board = puzzleBoard(l);
    g.target = pick(ss);
    g.pieces = board.pieces;
    g.outline = board.outline;
    g.prompt = 'Put the pieces together.';
    g.phase = 'build';
    g.options = shuffle(ss.filter(name => name !== g.target)).slice(0, Math.max(0, n - 1)).concat(g.target);
    g.render = x => shape(x);
  }
  if (g.mode === 'match') {
    g.faces = matchFaces(l);
    g.prompt = 'Match the shapes, colors, numbers, and words.';
    g.options = [];
    g.render = x => esc(String(x));
  }
  if (g.mode === 'marble') {
    g.track = marbleTrack(l);
    g.howTo = 'Aim and shoot the color in the question. Three matching marbles pop, then the path rolls together. Clearing that color counts, points raise the level, and the nest ends the path.';
    g.phase = g.started ? 'play' : 'ready';
    g.prompt = 'Shoot the color before the marbles reach the nest.';
    g.options = [];
    g.playLevel = g.playLevel || 1;
    g.points = g.points || 0;
    g.render = x => esc(String(x));
  }
  if (g.mode === 'bridge') {
    g.span = bridgeSpan(l);
    g.howTo = g.freePlay
      ? 'Hold to grow the stick across each gap. Reach the last platform.'
      : 'Each question is the next gap. Hold to grow the stick every time. A right answer makes the landing easier. A wrong answer makes it harder. Get them all to reach the last platform.';
    if (g.lives == null) g.lives = 1;
    g.phase = g.started ? 'play' : 'ready';
    g.movingOn = false;
    if (g.started && g.freePlay) {
      g.prompt = 'Hold to grow the bridge.';
      g.options = [];
      g.show = '';
      g.target = '';
      g.render = x => esc(String(x));
    } else if (g.started) fillPlayQuestion(g, l);
    else {
      g.prompt = g.howTo;
      g.options = [];
      g.render = x => esc(String(x));
    }
  }
  if (g.mode === 'maze') {
    g.clock = g.clock || mazeClock(l);
    g.howTo = g.freePlay
      ? 'Tilt the maze to the flag. A fall puts the ball back. An empty clock adds time.'
      : 'Tilt the maze to the flag before time runs out. If you fall in a hole, a right answer brings you back and adds time.';
    g.phase = g.started ? 'play' : 'ready';
    if (!g.asking) {
      g.prompt = 'Tilt to the flag.';
      g.options = [];
      g.show = '';
      g.render = x => esc(String(x));
    }
  }
  if (g.mode === 'chase') {
    g.board = chaseBoard(l);
    g.howTo = g.freePlay
      ? 'Steer through the maze. Eat the berries. Stay away from the ghosts.'
      : 'Steer through the maze. Eat only the berries that match. Questions follow this learner’s words, math, shapes, and colors. Stay away from the ghosts.';
    g.phase = g.started ? 'play' : 'ready';
    if (g.started) arcadePack(profileAsk(g, 'chase'), 'Eat the berries. Stay away from the ghosts.');
    else {
      g.prompt = g.howTo;
      g.options = [];
      g.tokens = [];
      g.subject = '';
      g.render = x => esc(String(x));
    }
  }
  if (g.mode === 'hop') {
    g.board = hopBoard(l);
    g.howTo = g.freePlay
      ? 'Keep bouncing higher. The leaves hold you up.'
      : 'Keep bouncing higher. Hop on the right answer and the climb continues. A wrong one breaks.';
    g.phase = g.started ? 'play' : 'ready';
    if (!g.started) {
      g.prompt = g.howTo;
      g.options = [];
      g.tokens = [];
      g.subject = '';
      g.render = x => esc(String(x));
    }
  }
  if (g.mode === 'toast') {
    g.board = toastBoard(l);
    g.howTo = g.freePlay
      ? 'Tap the toasts before they land. Letting one land costs a life.'
      : 'Tap the toast with the right answer before it lands. A wrong toast misses. Letting the right one land costs a life.';
    g.phase = g.started ? 'play' : 'ready';
    if (!g.started) {
      g.prompt = g.howTo;
      g.options = [];
      g.tokens = [];
      g.subject = '';
      g.render = x => esc(String(x));
    }
  }
  if (g.mode === 'glide') {
    g.howTo = g.freePlay
      ? 'Hold to climb. Let go to dive. Yellow gems are fuel. Grab the gems.'
      : 'Hold to climb. Let go to dive. Yellow gems are fuel. The labeled gems are answers. Grab the one that matches.';
    g.started = true;
    g.phase = 'play';
    g.prompt = g.howTo;
    g.options = [];
    g.tokens = [];
    g.subject = '';
    g.render = x => esc(String(x));
  }
  if (g.mode === 'aisle') {
    g.board = aisleBoard(l);
    g.howTo = g.freePlay
      ? 'Walk the market and pick things up before the clock runs out.'
      : 'Walk through the market and pick up the right thing before the clock runs out.';
    g.phase = g.started ? 'play' : 'ready';
    if (!g.started) {
      g.prompt = g.howTo;
      g.options = [];
      g.tokens = [];
      g.subject = '';
      g.render = x => esc(String(x));
    }
  }
  if (g.mode === 'lily') {
    g.board = lilyBoard(l);
    g.lives = g.board.lives;
    g.howTo = g.freePlay
      ? 'Hop across the road and the river. Ride the logs and reach a lily pad.'
      : 'Hop across the road and the river. Ride the logs. Land on the lily pad with the right answer. A wrong pad sends you back. A car or the water costs a hop.';
    g.phase = g.started ? 'play' : 'ready';
    if (!g.started) {
      g.prompt = g.howTo;
      g.options = [];
      g.tokens = [];
      g.subject = '';
      g.render = x => esc(String(x));
    }
  }
  if (g.mode === 'trace') prepareTrace(g, l);
  if (g.mode === 'sort') prepareSort(g, l);
  if (g.mode === 'merge') prepareMerge(g, l);
  if (g.mode === 'crayon') prepareCrayon(g, l);
  const sideSpec = sidecarGame(g.mode);
  if (sideSpec) {
    g.sidecar = sideSpec;
    g.howTo = sideSpec.howTo;
    g.started = true;
    g.phase = 'play';
    if (g.mode === 'rally') g.rallyStops = g.rallyStops || rallyQuestionCount(questionCount());
    if (g.freePlay && (g.mode === 'flight' || g.mode === 'walk' || g.mode === 'bike')) {
      g.prompt = g.mode === 'flight' ? 'Fly the plane.' : g.mode === 'walk' ? 'Walk the meadow.' : 'Ride the dirt bike.';
      g.tokens = [];
      g.options = [];
      g.show = '';
    } else if (g.mode === 'walk') walkAsk(g);
    else if (g.mode === 'paint') shellAsk(g);
    else {
      rallyAsk(g);
      if (g.mode === 'flight') flightAsk(g);
    }
    if (document.querySelector('iframe.sidecar-frame')) {
      paintRallyChrome(g);
      postSidecar(rallyMessage(g));
      return;
    }
    renderGame();
    return;
  }
  hybrid(g);
  g.options = shuffle(g.options);
  if (g.mode === 'rocket' && g.launched && !g.flightOver && $('#rocketShow')) {
    paintRocketQuestion();
    say(g.prompt);
    return;
  }
  if (g.mode === 'bridge' && g.live) {
    paintAsk(g);
    say(g.prompt);
    return;
  }
  renderGame();
  if (g.mode === 'lanes' && g.phase === 'ready') say(g.style === 'reach' ? 'Step into the word. You have 10 seconds to get there.' : 'Drive to the word.');
  else if ((g.mode === 'hook' || g.mode === 'sky' || g.mode === 'planet' || g.mode === 'marble' || g.mode === 'bridge' || g.mode === 'maze' || g.mode === 'chase' || g.mode === 'hop' || g.mode === 'toast' || g.mode === 'aisle' || g.mode === 'lily') && g.phase === 'ready') say(g.howTo);
  else if (g.mode === 'marble' && g.phase === 'play') { /* the marble path speaks each color */ }
  else if (g.mode === 'hop' && g.phase === 'play') { /* sprout hop speaks each landing */ }
  else if (g.mode === 'toast' && g.phase === 'play') { /* toast pop speaks each catch */ }
  else if (g.mode === 'aisle' && g.phase === 'play') { /* aisle cart speaks each shelf */ }
  else if (g.mode === 'lily' && g.phase === 'play') { /* lily cross speaks each pad */ }
  else if (g.mode === 'glide') say(g.howTo);
  else say(g.prompt);
}
function loadScreenMath(g, l, fromProfile) {
  const stage = band();
  const [item, name] = pick(countPool());
  const usePath = stage !== 'grade4' && Math.random() < 0.5;
  const level = fromProfile ? skillLevel(usePath ? 'path' : 'count') : l;
  const q = usePath ? pathQuestion(stage, level, Math.random, factPool()) : countQuestion(stage, level, 'tap', Math.random, factPool());
  g.math = q;
  g.target = q.target;
  g.countName = name;
  g.prompt = q.kind === 'count' ? `How many ${name}? Count them!` : q.question;
  const count = [3, 4, 5][l - 1];
  const rest = shuffle(choicesFor(q, count).filter(x => String(x) !== String(q.target)));
  g.options = [...rest.slice(0, count - 1), q.target];
  g.render = x => String(x);
  g.show = mathShow(q, item, name);
}
function mathShow(q, item, name) {
  if (!q) return '';
  if (q.show === 'array') return `<div class="countrow array" style="--cols:${q.cols}" role="img" aria-label="${q.rows} rows of ${q.cols}">${Array(q.target).fill(`<span>${item}</span>`).join('')}</div>`;
  if (q.kind === 'count') return `<div class="countrow" role="img" aria-label="${esc(name)} to count">${Array(q.target).fill(`<span>${item}</span>`).join('')}</div>`;
  if (q.strip) return `<div class="numpath" aria-hidden="true">${[...q.strip, '?'].map(x => `<span${x === '?' ? ' class="here"' : ''}>${x}</span>`).join('')}</div>`;
  if (q.floor && q.hi <= 20 && q.kind !== 'find' && q.kind !== 'more') {
    const mark = q.a;
    return `<div class="numpath" aria-hidden="true">${numberRange(q.lo, q.hi).map(x => `<span${x === mark ? ' class="here"' : ''}>${x}</span>`).join('')}</div>`;
  }
  return '';
}
function fillPlayQuestion(g, l) {
  const count = [3, 4, 5][(l || 1) - 1] || 3;
  g.subject = rocketSubject(g.mode === 'maze' ? (g.asked || 0) : g.index);
  g.shown = false;
  if (g.subject === 'words') {
    const words = wordList();
    const n = Math.min(count, Math.max(1, words.length));
    g.math = null;
    g.show = '';
    g.target = pick(words);
    g.prompt = g.mode === 'maze' ? `Pick the word ${g.target} to add time.` : `Pick the word ${g.target}.`;
    g.options = shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, n - 1)).concat(g.target);
    g.render = x => esc(x);
    return;
  }
  loadScreenMath(g, l);
  const rest = g.options.filter(x => String(x) !== String(g.target));
  g.options = [...rest.slice(0, count - 1), g.target];
}
function tokenList(options, target) {
  let marked = false;
  return options.map(label => {
    const text = String(label);
    const ok = !marked && text === String(target);
    if (ok) marked = true;
    return { label: text, ok };
  });
}
function profileAsk(g, place) {
  const board = place === 'lily' ? lilyBoard(g.level) : place === 'hop' || place === 'glide' || place === 'rally' || place === 'walk' ? hopBoard(g.level) : place === 'toast' ? toastBoard(g.level) : place === 'aisle' ? aisleBoard(g.level) : chaseBoard(g.level);
  const want = board.choices;
  const kinds = ['words', 'facts', 'shapes', 'colors'].filter(kind => {
    if (kind === 'words') return wordList().length >= 2;
    if (kind === 'shapes') return pools(skillLevel('shapes')).ss.length >= 2;
    if (kind === 'colors') return pools(skillLevel('colors')).cs.length >= 2;
    return true;
  });
  const kind = kinds[Math.max(0, g.index) % kinds.length];
  g.math = null;
  g.show = '';
  g.countName = '';
  if (kind === 'words') {
    g.subject = 'words';
    const words = wordList();
    const n = Math.max(1, Math.min(want, words.length));
    g.target = pick(words);
    g.options = shuffle(words.filter(word => word !== g.target)).slice(0, n - 1).concat(g.target);
    g.prompt = place === 'lily' ? `Hop to the pad that says ${g.target}.` : place === 'hop' ? `Hop on the word ${g.target}.` : place === 'toast' ? `Pop the toast that says ${g.target}.` : place === 'aisle' ? `Find the word ${g.target} in the market.` : place === 'glide' ? `Grab the gem that says ${g.target}.` : place === 'rally' ? `Which one says ${g.target}?` : place === 'walk' ? `Walk to the word ${g.target}.` : `Eat the berries that say ${g.target}.`;
    g.render = x => esc(x);
    g.tokens = tokenList(shuffle(g.options), g.target);
    return { choices: g.tokens };
  }
  if (kind === 'shapes') {
    g.subject = 'shapes';
    const { ss } = pools(skillLevel('shapes'));
    const n = Math.max(2, Math.min(want, ss.length));
    g.target = pick(ss);
    g.options = shuffle(ss.filter(name => name !== g.target)).slice(0, n - 1).concat(g.target);
    g.prompt = place === 'lily' ? `Hop to the ${g.target}.` : place === 'hop' ? `Hop on the ${g.target}.` : place === 'toast' ? `Pop the ${g.target} toast.` : place === 'aisle' ? `Find the ${g.target} in the market.` : place === 'glide' ? `Grab the ${g.target} gem.` : place === 'rally' ? `Which one is the ${g.target}?` : place === 'walk' ? `Walk to the ${g.target}.` : `Eat the ${g.target} berries.`;
    g.render = x => shape(x);
    g.tokens = tokenList(shuffle(g.options), g.target).map(token => ({ ...token, shape: token.label, fill: '#5d7a45' }));
    return { choices: g.tokens };
  }
  if (kind === 'colors') {
    g.subject = 'colors';
    const { cs } = pools(skillLevel('colors'));
    const n = Math.max(2, Math.min(want, cs.length));
    const target = pick(cs);
    g.target = target[0];
    const mixed = shuffle(shuffle(cs.filter(color => color[0] !== target[0])).slice(0, n - 1).concat([target]));
    g.options = mixed.map(color => color[0]);
    g.prompt = place === 'lily' ? `Hop to ${g.target}.` : place === 'hop' ? `Hop on ${g.target}.` : place === 'toast' ? `Pop the ${g.target} toast.` : place === 'aisle' ? `Find ${g.target} in the market.` : place === 'glide' ? `Grab the ${g.target} gem.` : place === 'rally' ? `Which one is ${g.target}?` : place === 'walk' ? `Walk to ${g.target}.` : `Eat the ${g.target} berries.`;
    g.render = x => esc(x);
    let marked = false;
    g.tokens = mixed.map(([label, fill]) => {
      const ok = !marked && label === g.target;
      if (ok) marked = true;
      return { label, ok, fill };
    });
    return { choices: g.tokens };
  }
  g.subject = 'math';
  loadScreenMath(g, g.level, place === 'chase');
  const rest = g.options.filter(x => String(x) !== String(g.target));
  g.options = [...rest.slice(0, Math.max(0, want - 1)), g.target];
  g.tokens = tokenList(shuffle(g.options), g.target);
  if (place === 'glide') g.prompt = `${g.prompt} Grab that gem.`;
  if (place === 'lily') g.prompt = `${g.prompt} Hop to that pad.`;
  return { choices: g.tokens };
}
function rallyPrefs(profile) {
  const stage = stageOf(profile, Math.max(0, data.profiles.indexOf(profile)));
  const fallback = stage === 'grade4'
    ? { spell: true, match: false, math: true, span: 'twelves' }
    : { spell: true, match: true, math: false, span: 'twelves' };
  const saved = profile?.rally && typeof profile.rally === 'object' ? profile.rally : {};
  const prefs = {
    spell: 'spell' in saved ? !!saved.spell : fallback.spell,
    match: 'match' in saved ? !!saved.match : fallback.match,
    math: 'math' in saved ? !!saved.math : fallback.math,
    span: ['single', 'twelves', 'wide'].includes(saved.span) ? saved.span : fallback.span
  };
  if (!prefs.spell && !prefs.match && !prefs.math) prefs.spell = true;
  return prefs;
}
function rallySpell(g, words) {
  g.subject = 'words';
  g.rallyKind = 'spell';
  g.math = null;
  g.show = '';
  g.countName = '';
  g.target = pick(words);
  g.prompt = `Spell ${g.target}.`;
  g.letters = shuffle([...g.target, ...distractorLetters(g.target, g.level)]);
  g.options = [g.target];
  g.render = x => esc(x);
  g.tokens = [{ label: g.target, ok: true }];
  return { choices: g.tokens };
}
function rallyFactors(span) {
  if (span === 'single') return [1 + Math.floor(Math.random() * 9), 1 + Math.floor(Math.random() * 9)];
  if (Math.random() < 0.35) {
    const other = 1 + Math.floor(Math.random() * 12);
    return Math.random() < 0.5 ? [12, other] : [other, 12];
  }
  return [1 + Math.floor(Math.random() * 9), 1 + Math.floor(Math.random() * 9)];
}
function rallyMath(g, want, span) {
  g.rallyKind = 'math';
  g.show = '';
  g.countName = '';
  g.subject = 'math';
  if (band() !== 'grade4' || span === 'wide') {
    if (band() === 'grade4' && span === 'wide') {
      const q = countQuestion('grade4', g.level, 'tap', Math.random, factPool());
      g.math = q;
      g.target = q.target;
      g.prompt = q.question;
      const count = Math.max(2, Math.min(want, 4));
      g.options = choicesFor(q, count);
      g.render = x => String(x);
      g.tokens = tokenList(shuffle(g.options.map(String)), String(g.target));
      return { choices: g.tokens };
    }
    loadScreenMath(g, g.level, false);
    const rest = g.options.filter(item => String(item) !== String(g.target));
    g.options = [...rest.slice(0, Math.max(0, want - 1)), g.target];
    g.tokens = tokenList(shuffle(g.options.map(String)), String(g.target));
    g.subject = 'math';
    return { choices: g.tokens };
  }
  const [a, b] = rallyFactors(span);
  const target = a * b;
  g.math = { kind: 'mul', a, b, target, grade: true, question: `What is ${a} × ${b}?` };
  g.target = target;
  g.prompt = `What is ${a} × ${b}?`;
  const pool = [target + 1, target - 1, target + b, target - a, (a + 1) * b, a * Math.max(1, b + 1)].filter(n => n > 0 && n !== target);
  const wrong = [];
  pool.forEach(n => { if (!wrong.includes(n)) wrong.push(n); });
  let extra = target + 2;
  while (wrong.length < Math.max(1, want - 1)) {
    if (extra !== target && !wrong.includes(extra)) wrong.push(extra);
    extra += 1;
  }
  g.options = shuffle([...wrong.slice(0, Math.max(1, want - 1)), target]);
  g.render = x => String(x);
  g.tokens = tokenList(g.options.map(String), String(target));
  return { choices: g.tokens };
}
function rallyMatch(g, want) {
  const kinds = ['words', 'shapes', 'colors'].filter(kind => {
    if (kind === 'words') return wordList().length >= 2;
    if (kind === 'shapes') return pools(skillLevel('shapes')).ss.length >= 2;
    return pools(skillLevel('colors')).cs.length >= 2;
  });
  const kind = kinds[Math.max(0, g.index) % Math.max(1, kinds.length)] || 'words';
  g.rallyKind = 'match';
  g.math = null;
  g.show = '';
  g.countName = '';
  if (kind === 'shapes') {
    g.subject = 'shapes';
    const { ss } = pools(skillLevel('shapes'));
    const n = Math.max(2, Math.min(want, ss.length));
    g.target = pick(ss);
    g.options = shuffle(ss.filter(name => name !== g.target)).slice(0, n - 1).concat(g.target);
    g.prompt = `Which one matches the ${g.target}?`;
    g.render = x => shape(x);
    g.tokens = tokenList(shuffle(g.options), g.target).map(token => ({ ...token, shape: token.label, fill: '#5d7a45' }));
    return { choices: g.tokens };
  }
  if (kind === 'colors') {
    g.subject = 'colors';
    const { cs } = pools(skillLevel('colors'));
    const n = Math.max(2, Math.min(want, cs.length));
    const target = pick(cs);
    g.target = target[0];
    const mixed = shuffle(shuffle(cs.filter(color => color[0] !== target[0])).slice(0, n - 1).concat([target]));
    g.options = mixed.map(color => color[0]);
    g.prompt = `Which one matches ${g.target}?`;
    g.render = x => esc(x);
    let marked = false;
    g.tokens = mixed.map(([label, fill]) => {
      const ok = !marked && label === g.target;
      if (ok) marked = true;
      return { label, ok, fill };
    });
    return { choices: g.tokens };
  }
  g.subject = 'words';
  const words = wordList();
  const n = Math.max(1, Math.min(want, words.length));
  g.target = pick(words);
  g.options = shuffle(words.filter(word => word !== g.target)).slice(0, n - 1).concat(g.target);
  g.prompt = `Which one matches ${g.target}?`;
  g.render = x => esc(x);
  g.tokens = tokenList(shuffle(g.options), g.target);
  return { choices: g.tokens };
}
function rallyAsk(g) {
  const prefs = rallyPrefs(p());
  const want = hopBoard(g.level).choices;
  const words = candidateWords(wordList(), 'build');
  const kinds = [];
  if (prefs.spell && words.length) kinds.push('spell');
  if (prefs.match) kinds.push('match');
  if (prefs.math) kinds.push('math');
  if (!kinds.length) kinds.push(words.length ? 'spell' : 'match');
  const kind = kinds[Math.max(0, g.index) % kinds.length];
  if (kind === 'spell') return rallySpell(g, words);
  if (kind === 'math') return rallyMath(g, want, prefs.span);
  return rallyMatch(g, want);
}
function shellAsk(g) {
  loadScreenMath(g, g.level, true);
  const rest = g.options.filter(item => String(item) !== String(g.target));
  g.options = [...rest.slice(0, 1), g.target];
  g.tokens = tokenList(shuffle(g.options.map(String)), String(g.target));
  g.subject = 'math';
  g.rallyKind = 'math';
}
function walkAsk(g) {
  profileAsk(g, 'walk');
  g.rallyKind = g.subject === 'math' ? 'math' : 'match';
}
function flightAsk(g) {
  if (g.rallyKind === 'spell') g.prompt = `Fly the letters of ${g.target}.`;
  else if (g.rallyKind === 'match' && g.subject === 'words') g.prompt = `Fly through the word ${g.target}.`;
  else if (g.rallyKind === 'match') g.prompt = `Fly through the ${g.target}.`;
}
function arcadePack(pack, prompt) {
  const g = game;
  if (!g?.freePlay || !pack?.choices) return pack;
  g.prompt = prompt;
  g.show = '';
  pack.choices = pack.choices.map(choice => ({ ...choice, ok: true }));
  g.tokens = pack.choices;
  return pack;
}
function toastQuestion() {
  const g = game;
  if (!g || g.finished || g.toastDone) return null;
  g.missed = false;
  g.done = false;
  return arcadePack(profileAsk(g, 'toast'), 'Tap the toasts.');
}
function paintToastPrompt() {
  const g = game;
  if (!g || g.finished) return;
  const title = $('#app h1');
  if (title) title.textContent = heading(g);
  const show = $('#toastShow');
  if (show) show.innerHTML = g.show || '';
  const stage = document.querySelector('.toast');
  if (stage) stage.setAttribute('aria-label', `${g.prompt} Tap that toast before it lands.`);
  bindRocketReveal(g);
  say(g.prompt);
}
function paintToastProgress(lives) {
  const g = game;
  if (!g) return;
  const rounds = questionCount();
  const now = Math.min(g.index, rounds);
  const bar = document.querySelector('#app .progress div');
  const meter = document.querySelector('#app .progress');
  if (bar) bar.style.width = `${rounds ? now / rounds * 100 : 0}%`;
  if (meter) meter.setAttribute('aria-valuenow', String(now));
  const tally = $('#toastTally');
  const left = lives == null ? (g.lives ?? g.board?.lives) : lives;
  if (tally) tally.textContent = `${Math.min(g.index + 1, rounds)} / ${rounds} · ${left} left`;
}
function aisleQuestion() {
  const g = game;
  if (!g || g.finished || g.aisleDone) return null;
  g.missed = false;
  g.done = false;
  return arcadePack(profileAsk(g, 'aisle'), 'Walk the market and pick things up.');
}
function paintAislePrompt() {
  const g = game;
  if (!g || g.finished) return;
  const title = $('#app h1');
  if (title) title.textContent = heading(g);
  const show = $('#aisleShow');
  if (show) show.innerHTML = g.show || '';
  const stage = document.querySelector('.aisle');
  if (stage) stage.setAttribute('aria-label', `${g.prompt} Walk to it before time runs out.`);
  say(g.prompt);
}
function paintAisleProgress() {
  const g = game;
  if (!g) return;
  const rounds = questionCount();
  const now = Math.min(g.index, rounds);
  const bar = document.querySelector('#app .progress div');
  const meter = document.querySelector('#app .progress');
  if (bar) bar.style.width = `${rounds ? now / rounds * 100 : 0}%`;
  if (meter) meter.setAttribute('aria-valuenow', String(now));
  const tally = $('#aisleTally');
  const left = g.clockLeft == null ? (g.board?.seconds || 32) : g.clockLeft;
  if (tally) tally.textContent = `${Math.min(g.index + 1, rounds)} / ${rounds} · ${left}s`;
}
function lilyQuestion() {
  const g = game;
  if (!g || g.finished || g.lilyDone) return null;
  g.missed = false;
  g.done = false;
  return arcadePack(profileAsk(g, 'lily'), 'Hop to a lily pad.');
}
function paintLilyPrompt() {
  const g = game;
  if (!g || g.finished) return;
  const title = $('#app h1');
  if (title) title.textContent = heading(g);
  const show = $('#lilyShow');
  if (show) show.innerHTML = g.show || '';
  const stage = document.querySelector('.lily');
  if (stage) stage.setAttribute('aria-label', `${g.prompt} Hop to that lily pad.`);
  bindRocketReveal(g);
  say(g.prompt);
}
function paintLilyProgress(lives) {
  const g = game;
  if (!g) return;
  const rounds = questionCount();
  const now = Math.min(g.index, rounds);
  const bar = document.querySelector('#app .progress div');
  const meter = document.querySelector('#app .progress');
  if (bar) bar.style.width = `${rounds ? now / rounds * 100 : 0}%`;
  if (meter) meter.setAttribute('aria-valuenow', String(now));
  const tally = $('#lilyTally');
  const left = lives == null ? (g.lives ?? g.board?.lives) : lives;
  if (tally) tally.textContent = `${Math.min(g.index + 1, rounds)} / ${rounds} · ${left} left`;
}
function hopQuestion() {
  const g = game;
  if (!g || g.finished || g.hopDone) return null;
  g.missed = false;
  g.done = false;
  return arcadePack(profileAsk(g, 'hop'), 'Bounce up the leaves.');
}
function paintHopPrompt() {
  const g = game;
  if (!g || g.finished) return;
  const title = $('#app h1');
  if (title) title.textContent = heading(g);
  const show = $('#hopShow');
  if (show) show.innerHTML = g.show || '';
  const stage = document.querySelector('.hop');
  if (stage) stage.setAttribute('aria-label', `${g.prompt} Green leaves bounce. A wrong answer breaks.`);
  bindRocketReveal(g);
  say(g.prompt);
}
function paintHopProgress() {
  const g = game;
  if (!g) return;
  const rounds = questionCount();
  const now = Math.min(g.index, rounds);
  const bar = document.querySelector('#app .progress div');
  const meter = document.querySelector('#app .progress');
  if (bar) bar.style.width = `${rounds ? now / rounds * 100 : 0}%`;
  if (meter) meter.setAttribute('aria-valuenow', String(now));
  const tally = $('#hopTally');
  if (tally) tally.textContent = `${Math.min(g.index + 1, rounds)} / ${rounds}`;
}
function glideQuestion() {
  const g = game;
  if (!g || g.finished || g.glideDone) return null;
  g.missed = false;
  g.done = false;
  return arcadePack(profileAsk(g, 'glide'), 'Hold to climb. Grab the gems.');
}
function paintGlidePrompt() {
  const g = game;
  if (!g || g.finished) return;
  const title = $('#app h1');
  if (title) title.textContent = heading(g);
  const stage = document.querySelector('.glide');
  if (stage) stage.setAttribute('aria-label', `${g.prompt} Hold to climb. Let go to dive.`);
  say(g.prompt);
}
function paintGlideProgress() {
  const g = game;
  if (!g) return;
  const rounds = questionCount();
  const now = Math.min(g.index, rounds);
  const bar = document.querySelector('#app .progress div');
  const meter = document.querySelector('#app .progress');
  if (bar) bar.style.width = `${rounds ? now / rounds * 100 : 0}%`;
  if (meter) meter.setAttribute('aria-valuenow', String(now));
  const tally = $('#glideTally');
  if (tally) tally.textContent = `${Math.min(g.index + 1, rounds)} / ${rounds}`;
}
function paintAsk(g) {
  const title = $('#app h1');
  if (title) title.textContent = heading(g);
  const show = $('#askShow');
  if (show) show.innerHTML = g.show || '';
  const box = $('#askChoices');
  if (box) {
    box.hidden = false;
    box.innerHTML = g.options.map((x, i) => `<button class="choice" data-option="${i}" aria-label="${esc(String(x))}">${g.render(x)}</button>`).join('');
    box.querySelectorAll('[data-option]').forEach(b => b.onclick = () => answer(String(g.options[+b.dataset.option]) === String(g.target), b));
  }
  const feedback = $('#feedback');
  if (feedback) feedback.textContent = '';
  $('#help')?.remove();
  focusHeading();
}
function askMaze(g, kind) {
  if (!g || game !== g || g.finished || g.asking) return;
  g.asking = kind;
  g.done = false;
  g.missed = false;
  g.court?.pause();
  fillPlayQuestion(g, g.level);
  g.options = shuffle(g.options);
  paintAsk(g);
  const line = kind === 'fall' ? 'A right answer brings you back and adds time.' : 'A right answer adds time.';
  const feedback = $('#feedback');
  if (feedback) feedback.textContent = line;
  say(`${line} ${g.prompt}`);
}
function paintBridgeProgress(g) {
  const rounds = questionCount();
  const lives = g.lives || 1;
  const tally = $('#bridgeTally');
  if (tally) tally.textContent = `${Math.min((g.index || 0) + 1, rounds)} / ${rounds} · ${lives} ${lives === 1 ? 'life' : 'lives'}`;
  const bar = document.querySelector('#app .progress div');
  const meter = document.querySelector('#app .progress');
  const pct = rounds ? Math.round((g.index || 0) / rounds * 100) : 0;
  if (bar) bar.style.width = `${pct}%`;
  if (meter) meter.setAttribute('aria-valuenow', String(g.index || 0));
}
function continueBridge(g) {
  clearTimeout(bridgeTimer);
  const rounds = questionCount();
  bridgeTimer = setTimeout(() => {
    bridgeTimer = 0;
    if (game !== g || g.finished) return;
    if (document.querySelector('dialog[open]')) { continueBridge(g); return; }
    g.index++;
    paintBridgeProgress(g);
    if (g.index >= rounds) {
      g.asked = rounds;
      const all = g.firstCorrect >= rounds;
      finishRun(g, all ? 'You reached the last platform.' : 'You crossed.', all ? 'Every answer was right.' : `${g.firstCorrect} of ${rounds} on the first try.`);
      return;
    }
    question();
  }, data.sound ? 900 : 400);
}
function finishRun(g, title, detail) {
  if (!g || g.finished) return;
  g.finished = true;
  clearTimeout(bridgeTimer);
  bridgeTimer = 0;
  stopMarble();
  stopBridge();
  stopMaze();
  stopChase();
  stopHop();
  stopToast();
  stopGlide();
  stopAisle();
  stopLily();
  stopTrace();
  stopSort();
  stopMerge();
  stopCrayon();
  stopSidecar();
  clearLearnTimer();
  camOff();
  const asked = Math.max(0, g.asked || 0);
  const correct = Math.min(asked, g.firstCorrect || 0);
  if (asked > 0) {
    Object.assign(p(), applyRound(p(), g.mode, g.key, asked, correct));
    save();
  }
  const stars = asked > 0 ? `<p>First try: ${correct} of ${asked}</p><p class="hint">+${asked} learning stars</p>` : '';
  $('#app').innerHTML = `<section class="playarea"><div class="result-star" aria-hidden="true">🌟</div><h1>${esc(title)}</h1><p>${esc(detail || '')}</p>${stars}${starGardenHtml()}<button class="primary" id="again">Play again</button> <button class="quiet" id="all">Choose a game</button></section>`;
  $('#again').onclick = () => start(g.mode);
  $('#all').onclick = home;
  say(title);
  focusHeading();
}
function hybrid(g) {
  if (sidecarGame(g.mode)) return;
  if (g.mode === 'catch' || g.mode === 'lanes' || g.mode === 'rocket' || g.mode === 'lunar' || g.mode === 'race' || g.mode === 'hook' || g.mode === 'sky' || g.mode === 'planet' || g.mode === 'puzzle' || g.mode === 'match' || g.mode === 'marble' || g.mode === 'bridge' || g.mode === 'maze' || g.mode === 'chase' || g.mode === 'hop' || g.mode === 'toast' || g.mode === 'glide' || g.mode === 'aisle' || g.mode === 'lily' || g.mode === 'trace' || g.mode === 'sort' || g.mode === 'merge' || g.mode === 'crayon') return;
  const t = g.target, [verb, icon] = pick(moves);
  g.icon = icon;
  if (g.mode === 'count' || g.mode === 'path') { mathHybrid(g, verb); return; }
  if (g.style === 'move' && g.mode !== 'missing') {
    g.prompt = {
      shapes: `${verb} to the ${t}!`,
      colors: `${verb} to ${t}!`,
      mix: g.target2 ? `${verb} to the ${t}, then ${pick(moves)[0].toLowerCase()} to the ${g.target2}!` : `${verb} to the ${t}!`,
      words: `Drive to the word ${t}! Vroom!`,
      build: `Collect the letters for ${t}, one at a time!`
    }[g.mode];
  }
  if (g.style === 'move' && g.mode === 'words') g.icon = '🚙';
  if (g.style === 'move' && g.mode === 'build') g.icon = '🧺';
  if (g.style === 'hunt') {
    const [c, s] = t.split(' ');
    g.icon = '🔎';
    g.prompt = {
      shapes: `Find something shaped like ${an(t)} ${t}!`,
      colors: `Find something ${t}!`,
      mix: `Find something ${c}. Then find something shaped like ${an(s || '')} ${s}!`,
      words: `Find the word “${t}” in a book, on a box, or on a sign!`,
      build: t.length > 1 ? `Find each letter of “${t}” in a book or on a sign. Say each one!` : `Find the letter “${t}” in a book or on a sign!`
    }[g.mode];
  }
}
function mathHybrid(g, verb) {
  const t = g.target, floor = g.math?.floor !== false;
  if (g.math?.grade) {
    g.options = shuffle(g.options);
    g.prompt = grade4Prompt(g.math, g.style, g.options);
    if (g.style === 'move') { g.show = ''; g.icon = ['array', 'common', 'prime'].includes(g.math.kind) ? '👏' : '🦘'; }
    if (g.style === 'hunt') { g.show = ''; g.icon = '🔎'; }
    return;
  }
  if (g.mode === 'path') {
    g.prompt = pathPrompt(g.path, g.style, verb);
    if (g.style === 'move' && floor) g.show = '';
    if (g.style === 'hunt') g.icon = '🔎';
    return;
  }
  if (!floor || g.math?.kind !== 'count') {
    if (g.style === 'move') g.prompt = `${g.prompt} Tell a grown-up the answer.`;
    if (g.style === 'hunt') {
      g.icon = '🔎';
      g.prompt = `${g.math?.question || g.prompt} Say the answer out loud.`;
    }
    return;
  }
  if (g.style === 'move' && Math.random() < 0.5) {
    g.icon = '🦘';
    g.show = '';
    g.prompt = `Do ${t} big ${t === 1 ? 'jump' : 'jumps'}! Count out loud!`;
  } else if (g.style === 'move') {
    g.prompt = `Count the ${g.countName}, then ${verb.toLowerCase()} to that number!`;
  }
  if (g.style === 'hunt') {
    const [one, many] = pick(huntPool());
    g.icon = '🔎';
    g.show = '';
    g.prompt = `Bring me ${t} ${t === 1 ? one : many}! Count them out loud.`;
  }
}
function wordHidden(g) {
  if (!g || g.level < 2 || !data.sound || !canSpeak() || g.shown) return false;
  if (g.mode === 'trace' || g.mode === 'sort' || g.mode === 'merge') return false;
  if (g.mode === 'rally' || g.mode === 'flight' || g.mode === 'bike' || g.mode === 'walk') return g.subject === 'words';
  if (g.mode === 'glide') return g.subject === 'words';
  if (g.mode === 'rocket' || g.mode === 'lunar' || g.mode === 'hook' || g.mode === 'sky' || g.mode === 'planet' || g.mode === 'bridge' || g.mode === 'maze' || g.mode === 'chase' || g.mode === 'hop' || g.mode === 'toast' || g.mode === 'aisle' || g.mode === 'lily') return g.subject === 'words';
  if (g.mode === 'race') return g.kind === 'words';
  return !!listen[g.mode];
}
const heading = g => {
  if ((g?.mode === 'rally' || g?.mode === 'flight' || g?.mode === 'bike') && g.rallyKind === 'spell') {
    if (data.sound && canSpeak()) return g.mode === 'flight' ? 'Fly through the letters in order.' : 'Spell the word.';
    return g.prompt;
  }
  if (!wordHidden(g)) return g.prompt;
  if (g.mode === 'rocket') return listen.rocket.tap;
  return listen[g.mode][g.style] || listen[g.mode].tap;
};
function foundLine(g) {
  if (g.mode === 'lunar') return g.streak >= 3 ? `Swish! ${g.streak} in a row.` : 'Swish!';
  if (g.mode === 'hook') return `You hooked ${g.target}.`;
  if (g.mode === 'match') return 'You found the pairs.';
  if (g.mode === 'sky') return `You hit ${g.target}.`;
  if (g.mode === 'planet') return `You shot ${g.target}. The planet is safe.`;
  if (g.mode === 'bridge') return 'The bridge reaches.';
  if (g.mode === 'maze') return 'More time.';
  if (g.mode === 'marble') return `You cleared ${g.target}.`;
  if (g.mode === 'chase') return g.subject === 'words' ? `You ate the berries that say ${g.target}.` : `You ate the ${g.target} berries.`;
  if (g.mode === 'hop') return g.subject === 'words' || g.subject === 'math' ? `You hopped on ${g.target}.` : `You hopped on the ${g.target}.`;
  if (g.mode === 'toast') return g.subject === 'shapes' || g.subject === 'colors' ? `You popped the ${g.target} toast.` : `You popped ${g.target}.`;
  if (g.mode === 'aisle') return g.subject === 'shapes' || g.subject === 'colors' ? `You found the ${g.target} in the market.` : `You found ${g.target} in the market.`;
  if (g.mode === 'lily') return g.subject === 'shapes' || g.subject === 'colors' ? `You hopped to the ${g.target}.` : `You hopped to ${g.target}.`;
  if (g.mode === 'glide') return g.subject === 'words' ? `You grabbed the gem that says ${g.target}.` : g.subject === 'shapes' || g.subject === 'colors' ? `You grabbed the ${g.target} gem.` : `You grabbed ${g.target}.`;
  if (g.mode === 'paint') return `You painted ${g.target}.`;
  if (g.mode === 'walk') return g.subject === 'shapes' || g.subject === 'colors' ? `You walked to the ${g.target}.` : `You walked to ${g.target}.`;
  if (g.mode === 'flight') return g.rallyKind === 'spell' ? `You spelled ${g.target}.` : g.subject === 'shapes' || g.subject === 'colors' ? `You flew through the ${g.target}.` : `You flew through ${g.target}.`;
  if (g.mode === 'bike') return g.rallyKind === 'spell' ? `You spelled ${g.target}.` : g.subject === 'shapes' || g.subject === 'colors' ? `You rode over the ${g.target}.` : `You rode over ${g.target}.`;
  if (g.mode === 'rally') return g.rallyKind === 'spell' ? `You spelled ${g.target}.` : g.subject === 'words' || g.subject === 'math' ? `You drove through ${g.target}.` : `You drove through the ${g.target}.`;
  if (g.mode === 'trace') return g.traceKind === 'letter' ? `The car drove the letter ${g.target}.` : g.traceKind === 'number' ? `The car drove the number ${g.target}.` : `The car drove the ${g.target}.`;
  if (g.mode === 'sort') return `You sorted the ${g.target}.`;
  if (g.mode === 'merge') return g.mergeKind === 'shape' ? `You made the ${g.target}.` : `You made ${g.target}.`;
  if (g.mode === 'crayon') return `You colored the ${g.target}.`;
  const t = g.target;
  if (g.mode === 'colors') return `Yes. That is ${t}.`;
  if (g.mode === 'shapes' || g.mode === 'missing' || g.mode === 'mix' || g.mode === 'puzzle') return `Yes. That is a ${t}.`;
  if (g.math?.kind === 'count' && g.countName) return `Yes. ${t} ${g.countName}.`;
  return `Yes. ${t}.`;
}
function strategyHint(g) {
  if (g.mode === 'paint') return 'Paint the half with the right answer.';
  if (g.mode === 'walk') return g.subject === 'words' ? 'Listen for the word, then walk to it.' : 'Walk to the one that matches.';
  if (g.mode === 'flight') return g.rallyKind === 'spell' ? 'Listen for the word, then fly through each letter or type it.' : 'Steer through the gate that matches.';
  if (g.mode === 'chase' || g.mode === 'hop' || g.mode === 'toast' || g.mode === 'aisle' || g.mode === 'lily' || g.mode === 'glide' || g.mode === 'rally' || g.mode === 'bike') {
    if (g.subject === 'words') {
      if (g.mode === 'chase') return 'Listen for the word, then eat those berries.';
      if (g.mode === 'toast') return 'Listen for the word, then pop that toast.';
      if (g.mode === 'aisle') return 'Listen for the word, then walk the aisles and pick it up.';
      if (g.mode === 'lily') return 'Listen for the word, then hop to that pad.';
      if (g.mode === 'glide') return 'Listen for the word, then grab that gem.';
      if (g.mode === 'rally') return g.rallyKind === 'spell' ? 'Listen for the word, then tap or type the letters in order.' : 'Tap the one that matches. A right answer turbos the car.';
      if (g.mode === 'bike') return g.rallyKind === 'spell' ? 'Listen for the word, then tap or type the letters in order.' : 'Tap the one that matches. A right answer says good, and the ride continues.';
      return 'Listen for the word, then hop on it.';
    }
    if (g.subject === 'shapes') return 'Look at the shapes.';
    if (g.subject === 'colors') return 'Look at the colors.';
    if (g.math?.kind === 'count') {
      const picture = String(g.countName || 'picture').replace(/s$/, '');
      return `Touch each ${picture} as you count.`;
    }
    if (g.mode === 'chase') return 'Eat the berry with the right number.';
    if (g.mode === 'toast') return 'Pop the toast with the right number.';
    if (g.mode === 'aisle') return 'Walk the aisles and pick up the right number before time runs out.';
    if (g.mode === 'lily') return 'Hop to the pad with the right number.';
    if (g.mode === 'glide') return 'Grab the gem with the right number.';
    if (g.mode === 'rally') return g.rallyKind === 'math' ? 'Work out the fact, then tap that number.' : 'Tap the one that matches. A right answer turbos the car.';
    if (g.mode === 'bike') return g.rallyKind === 'math' ? 'Work out the fact, then tap that number.' : 'Tap the one that matches. A right answer says good, and the ride continues.';
    return 'Hop on the right number.';
  }
  if (g.mode === 'build') return 'Say the word, then find the next letter.';
  if (g.mode === 'words' || g.mode === 'lanes' || ((g.mode === 'rocket' || g.mode === 'lunar' || g.mode === 'hook' || g.mode === 'sky' || g.mode === 'planet' || g.mode === 'bridge' || g.mode === 'maze') && g.subject === 'words')) return 'Listen for the word, then find it.';
  if (g.mode === 'colors') return 'Look at the colors.';
  if (g.mode === 'puzzle') return 'Look at the whole puzzle, then tap its name or say it.';
  if (g.mode === 'match') return 'Turn two cards that look the same.';
  if (g.mode === 'trace') return 'Start at the dot and stay on the line.';
  if (g.mode === 'sort') return 'Tap a tube to lift the top balls. Pour them onto the same kind, or into an empty tube.';
  if (g.mode === 'merge') return 'Drop two that are the same so they touch.';
  if (g.mode === 'crayon') return `${g.swatch?.number} is ${g.swatch?.name}. Paint each spot with that number.`;
  if (g.mode === 'shapes' || g.mode === 'missing' || g.mode === 'mix') return 'Look at the shapes.';
  if (g.math?.kind === 'count') {
    const name = String(g.countName || 'picture').replace(/s$/, '');
    return `Touch each ${name} as you count.`;
  }
  return 'Count along the numbers with your finger.';
}
function hintMode(g) {
  if (g.mode === 'count' || g.mode === 'path') return g.mode;
  return g.math?.kind === 'count' ? 'count' : 'path';
}
function tip(g) {
  const t = String(g.target), c = t.split(' ')[0];
  if (g.mode === 'count' || g.mode === 'path') return mathTip(g.math, g.mode, t);
  return {
    shapes: `Ask: where else can you see ${an(t)} ${t}?`,
    colors: `Ask: what else around you is ${t}?`,
    mix: `Ask: what other things are ${c}?`,
    missing: 'Ask: how did you remember?',
    words: `Ask them to read “${t}” to you and use it in a sentence.`,
    build: `Ask: what sound does “${t[0]}” make?`,
    puzzle: `Ask: what makes this a ${t}?`
  }[g.mode];
}
function camStage(zones = '') {
  return `<div class="camstage"><video playsinline muted autoplay></video>${zones ? `<div class="choices camzones">${zones}</div>` : ''}<span class="hand" hidden></span><span class="hand" hidden></span><p class="camstatus" id="camstatus"></p></div><p class="hint">Hold one hand on an answer until it fills. Raise both hands to go on.</p>`;
}
function raceTopicLine() {
  return raceKinds(p().race).map(kind => RACE_LABELS[kind]).join(', ');
}
function spriteHtml(kind) {
  const eyes = '<i class="eye l"></i><i class="eye r"></i>';
  if (kind === 'bear') return `<span class="buddy-sprite bear" aria-hidden="true"><i class="ear l"></i><i class="ear r"></i><i class="head">${eyes}<i class="snout"></i></i><i class="body"></i></span>`;
  if (kind === 'bunny') return `<span class="buddy-sprite bunny" aria-hidden="true"><i class="ear l"></i><i class="ear r"></i><i class="head">${eyes}<i class="nose"></i></i><i class="body"></i></span>`;
  if (kind === 'frog') return `<span class="buddy-sprite frog" aria-hidden="true"><i class="head">${eyes}<i class="nose"></i></i><i class="body"></i></span>`;
  if (kind === 'owl') return `<span class="buddy-sprite owl" aria-hidden="true"><i class="ear l"></i><i class="ear r"></i><i class="head">${eyes}<i class="nose"></i></i><i class="body"></i></span>`;
  if (kind === 'chick') return `<span class="buddy-sprite chick" aria-hidden="true"><i class="head">${eyes}<i class="nose"></i></i><i class="ear l"></i><i class="ear r"></i><i class="body"></i></span>`;
  return `<span class="buddy-sprite fox" aria-hidden="true"><i class="ear l"></i><i class="ear r"></i><i class="head">${eyes}<i class="nose"></i></i><i class="body"></i><i class="tail"></i></span>`;
}
function starGardenHtml(pick) {
  const rows = pointBoard(data.profiles);
  const cards = rows.map(row => {
    const tag = pick ? 'button' : 'div';
    const noun = row.stars === 1 ? 'star' : 'stars';
    const earned = row.earned === 1 ? 'Earned 1 star' : row.earned ? `Earned ${row.earned} stars` : 'Play to earn stars';
    const bits = Array.from({ length: Math.min(5, row.earned) }, () => '<i></i>').join('');
    const mine = row.index === data.active;
    const type = pick ? ' type="button"' : '';
    const learner = pick ? ` data-learner="${row.index}"` : '';
    const current = mine ? ' aria-current="true"' : '';
    return `<${tag} class="sprout-card${mine ? ' mine' : ''}${row.rank === 1 && row.stars ? ' lead' : ''}"${type}${learner}${current} style="--grow:${row.grow}"><span class="float-stars" aria-hidden="true">${bits}</span>${spriteHtml(row.sprite)}<i class="stand" aria-hidden="true"></i><b>${esc(row.name)}</b><span class="points">${row.stars} ${noun}</span><span class="earned${row.earned ? '' : ' quiet-earn'}">${earned}</span></${tag}>`;
  }).join('');
  const note = pick ? 'Tap a sprout to play as them' : 'Stars from every game';
  return `<section class="star-garden" aria-label="Star garden"><div class="sectionhead"><h2>Star garden</h2><span>${note}</span></div><div class="podium">${cards}</div></section>`;
}
function raceBoardHtml(list) {
  const mine = p().name.trim().toLowerCase();
  if (!list?.length) return '<p class="hint">No drives yet. The furthest car takes the lead.</p>';
  return `<ol class="race-board">${list.map(row => `<li class="${row.name.toLowerCase() === mine ? 'mine' : ''}"><span>${esc(row.name)}</span><span>${row.distance} m</span></li>`).join('')}</ol>`;
}
function raceReadyBody() {
  return `<p>The tank starts full. Steer into the right answer and the gas fills up again. Each right answer makes the car faster. A wrong lane ends the race.</p><p class="hint">This drive uses ${esc(raceTopicLine())}.</p><p class="hint">Shared distances on this device</p>${raceBoardHtml(raceStandings(loadBoard()))}<button class="primary" id="arm">I’m ready! →</button>`;
}
function raceLabels(q, level) {
  const want = Math.max(2, laneCount(level, 8) || 2);
  const unique = [];
  for (const value of choicesFor(q, want)) {
    const label = String(value);
    if (!unique.includes(label)) unique.push(label);
  }
  const target = String(q.target);
  if (!unique.includes(target)) unique.unshift(target);
  let shown = unique.slice(0, want);
  if (!shown.includes(target)) shown = [target, ...shown.filter(label => label !== target)].slice(0, want);
  return shuffle(shown);
}
function makeRaceGate(g) {
  const level = g.level;
  const kinds = raceKinds(p().race).filter(kind => {
    if (kind === 'words') return wordList().length >= 2;
    if (kind === 'shapes') return pools(skillLevel('shapes')).ss.length >= 2;
    if (kind === 'colors') return pools(skillLevel('colors')).cs.length >= 2;
    return true;
  });
  const pool = kinds.filter(kind => kind !== g.lastKind);
  const kind = pick(pool.length ? pool : kinds);
  if (kind === 'words') {
    const words = wordList();
    const count = Math.max(2, Math.min(laneCount(level, words.length) || 2, words.length));
    const target = pick(words);
    const shown = shuffle(words.filter(word => word !== target).slice(0, count - 1).concat(target));
    return { kind, prompt: `Drive to the word ${target}.`, target, show: '', options: shown.map(label => ({ label })), answer: shown.indexOf(target) };
  }
  if (kind === 'shapes') {
    const { ss } = pools(skillLevel('shapes'));
    const count = Math.max(2, Math.min(laneCount(level, ss.length) || 2, ss.length));
    const target = pick(ss);
    const shown = shuffle(ss.filter(shapeName => shapeName !== target).slice(0, count - 1).concat(target));
    return { kind, prompt: `Drive to the ${target}.`, target, show: '', options: shown.map(label => ({ label, shape: label, fill: '#8fac73' })), answer: shown.indexOf(target) };
  }
  if (kind === 'colors') {
    const { cs } = pools(skillLevel('colors'));
    const count = Math.max(2, Math.min(laneCount(level, cs.length) || 2, cs.length));
    const target = pick(cs);
    const shown = shuffle(cs.filter(color => color[0] !== target[0]).slice(0, count - 1).concat([target]));
    return { kind, prompt: `Drive to ${target[0]}.`, target: target[0], show: '', options: shown.map(([label, fill]) => ({ label, fill, swatch: true })), answer: shown.findIndex(color => color[0] === target[0]) };
  }
  const stage = band();
  const [item, name] = pick(countPool());
  const usePath = stage !== 'grade4' && Math.random() < 0.5;
  const q = usePath ? pathQuestion(stage, level, Math.random, factPool()) : countQuestion(stage, level, 'tap', Math.random, factPool());
  const shown = raceLabels(q, level);
  const target = String(q.target);
  return {
    kind: 'facts',
    prompt: q.kind === 'count' ? `How many ${name}? Count them!` : q.question,
    target,
    show: mathShow(q, item, name),
    math: q,
    countName: name,
    options: shown.map(label => ({ label })),
    answer: shown.indexOf(target)
  };
}
function raceQuestion() {
  const g = game;
  if (!g || g.finished) return null;
  const gate = makeRaceGate(g);
  g.kind = gate.kind;
  g.prompt = gate.prompt;
  g.target = gate.target;
  g.show = gate.show || '';
  g.math = gate.math || null;
  g.countName = gate.countName || '';
  g.shown = false;
  g.lastKind = gate.kind;
  return gate;
}
function paintRacePrompt() {
  const g = game;
  if (!g || g.mode !== 'race' || g.finished) return;
  const title = $('#app h1');
  if (title) title.textContent = heading(g);
  const reveal = $('#reveal');
  if (reveal) reveal.hidden = !wordHidden(g);
  const show = $('#raceShow');
  if (show) show.innerHTML = g.show || '';
  say(g.prompt);
}
function renderGame() {
  stopArcade();
  stopLunar();
  stopHook();
  stopSky();
  stopPlanet();
  stopPuzzle();
  stopMatch();
  stopMarble();
  stopBridge();
  stopMaze();
  stopChase();
  stopHop();
  stopToast();
  stopGlide();
  stopAisle();
  stopLily();
  stopTrace();
  stopSort();
  stopMerge();
  stopCrayon();
  stopSidecar();
  stopEars();
  const g = game;
  if (!g) return;
  const screen = g.mode === 'catch' || g.mode === 'lanes';
  const rocket = g.mode === 'rocket';
  const lunar = g.mode === 'lunar';
  const race = g.mode === 'race';
  const hook = g.mode === 'hook';
  const sky = g.mode === 'sky';
  const planet = g.mode === 'planet';
  const puzzle = g.mode === 'puzzle';
  const match = g.mode === 'match';
  const marble = g.mode === 'marble';
  const bridge = g.mode === 'bridge';
  const maze = g.mode === 'maze';
  const chase = g.mode === 'chase';
  const hop = g.mode === 'hop';
  const toast = g.mode === 'toast';
  const glide = g.mode === 'glide';
  const aisle = g.mode === 'aisle';
  const lily = g.mode === 'lily';
  const trace = g.mode === 'trace';
  const sort = g.mode === 'sort';
  const merge = g.mode === 'merge';
  const crayon = g.mode === 'crayon';
  const side = sidecarGame(g.mode);
  const arcade = screen || rocket || lunar || race || hook || sky || planet || puzzle || match || marble || bridge || maze || chase || hop || toast || glide || aisle || lily || trace || sort || merge || crayon || !!side;
  const reach = g.style === 'reach', phys = !arcade && (g.style === 'move' || g.style === 'hunt'), zone = reach ? ' data-zone' : '';
  const picks = (screen || race || hook || sky || planet || puzzle || match || marble || maze || chase || hop || toast || trace || sort || merge || side) ? '' : g.mode === 'build'
    ? g.letters.map((x, i) => `<button class="choice letter" data-letter="${i}"${zone}>${esc(x)}</button>`).join('')
    : g.options.map((x, i) => `<button class="choice" data-option="${i}" aria-label="${esc(String(x))}"${zone}>${g.render(x)}</button>`).join('');
  const slots = g.mode === 'build' ? `<div class="wordslots"><span id="built" aria-live="polite">${blanks(g.built, g.target)}</span></div>` : '';
  const spellField = g.mode === 'build' ? '<label class="spell-type">Type the next letter <input id="spellType" class="spell-key" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" aria-label="Type the next letter"></label>' : '';
  const clear = g.mode === 'build' ? '<button class="quiet" id="clear">Start word again</button>' : '';
  let body;
  const howTo = hook || sky || planet || marble || bridge || maze || chase || hop || toast || aisle || lily
    ? g.howTo
    : g.mode === 'catch'
    ? (reach ? 'Reach up and catch the number with your hand.' : 'Slide the basket under the number.')
    : (reach && g.mode === 'lanes' ? 'Step into the lane with the word. You get 10 seconds to get there.' : 'Drive to the word.');
  if (race && g.phase === 'ready') body = raceReadyBody();
  else if (race) body = '<div id="raceShow"></div><div id="arcade"></div>';
  else if (rocket) body = `<div id="rocketShow">${g.show || ''}</div><div id="arcade"></div><div class="choices" id="rocketChoices">${picks}</div>`;
  else if (lunar) {
    const court = g.level >= 3 ? 'The hoop drifts, and a rock is in the way.' : g.level >= 2 ? 'The hoop drifts.' : 'The hoop stays still.';
    body = `<p class="hint">Shooting on ${esc(g.place)}. ${court}</p><div id="arcade"></div>${g.freePlay ? '' : `<div class="choices">${picks}</div>`}`;
  }
  else if ((hook || sky || planet || marble || bridge || maze || chase || hop || toast || aisle || lily) && g.phase === 'ready') body = `<p>${howTo}</p><button class="primary" id="arm">I’m ready! →</button>`;
  else if (hook || sky || planet || marble) body = '<div id="arcade"></div>';
  else if (chase) body = `<div id="chaseShow">${g.show || ''}</div><div id="arcade"></div>`;
  else if (hop) body = '<div id="hopShow"></div><div id="arcade"></div>';
  else if (toast) body = '<div id="arcade"></div>';
  else if (aisle) body = '<div id="aisleShow"></div><div id="arcade"></div>';
  else if (lily) body = '<div id="lilyShow"></div><div id="arcade"></div>';
  else if (glide) body = '<div id="arcade"></div>';
  else if (bridge) body = `<div id="askShow">${g.show || ''}</div><div id="arcade"></div><div class="choices" id="askChoices">${picks}</div>`;
  else if (maze) body = '<div id="arcade"></div><div id="askShow"></div><div class="choices" id="askChoices" hidden></div>';
  else if (puzzle) body = '<div id="arcade"></div><div id="puzzleSay" hidden></div>';
  else if (match || trace || sort || merge || crayon) body = '<div id="arcade"></div>';
  else if (side && g.phase === 'ready') body = `<p>${esc(side.howTo)}</p><button class="primary" id="arm">I’m ready! →</button>`;
  else if (side) body = '<div id="arcade" class="sidecar-host"></div>';
  else if (g.mode === 'lanes' && g.phase === 'ready' && reach) body = `<p>${howTo}</p><button class="primary" id="arm">I’m ready! →</button>`;
  else if (g.mode === 'lanes' && g.phase === 'ready') {
    const paces = [['slow', 'Slow'], ['steady', 'Steady'], ['fast', 'Fast'], ['survival', 'Survival']];
    body = `<p>${howTo}</p><div class="lane-paces" role="group" aria-label="Car speed">${paces.map(([id, label]) => `<button type="button" class="stylebtn" data-pace="${id}">${label}</button>`).join('')}</div><p class="hint" id="paceHint"></p><button class="primary" id="arm">I’m ready! →</button>`;
  }
  else if (screen && g.phase === 'ready') body = `<p>${howTo}</p><button class="primary" id="arm">I’m ready! →</button>`;
  else if (screen) body = '<div id="arcade"></div>';
  else if (g.phase === 'cover') body = '<p>One shape will be missing.</p>';
  else if (g.phase === 'remember') body = `<p>Take your time. Ready to spot what disappears?</p>${reach ? camStage() : ''}<button class="primary" id="hide" data-camera-go>I’m ready! →</button>`;
  else if (g.phase === 'away') body = `<div class="bigmove" aria-hidden="true">🏃</div><p class="hint">Grown-up: tap when they’re back.</p><button class="primary" id="backIn">We’re back! →</button>`;
  else if (phys) {
    const huntCue = g.style === 'hunt' && (['shapes', 'colors', 'mix'].includes(g.mode) || (g.mode === 'count' && g.math?.kind === 'count') || g.path?.kind === 'find');
    const grownup = g.style === 'hunt' ? 'Tap ✓ when they show you or tell you the answer.'
      : g.math?.floor === false ? 'Tap ✓ when they tell you the right answer.'
      : g.mode === 'count' && !g.show ? 'Tap ✓ when they’ve done the right number.'
      : g.mode === 'path' ? 'Lay the number cards in order in a line. Tap ✓ when they land on the right card.'
      : 'Tap ✓ when they land on the right card.';
    body = `${huntCue ? `<div class="target" role="img" aria-label="${esc(g.target)}">${g.render(g.target)}</div>` : g.show ? '' : `<div class="bigmove" aria-hidden="true">${g.icon}</div>`}<div class="grownup"><small>GROWN-UP</small><p>${grownup}</p>${g.math?.grade ? `<button type="button" class="quiet" id="showAnswer">Show answer</button><b id="answerKey" hidden>${esc(g.target)}</b>` : ''}<button class="primary confirm" id="gotit">✓ Got it</button> <button class="quiet confirm" id="notyet">Not yet</button></div>`;
  }
  else if (reach) body = `${slots}${spellField}${camStage(picks)}${clear}`;
  else body = g.mode === 'build' ? `${slots}${spellField}<div class="choices">${picks}</div>${clear}` : `<div class="choices">${picks}</div>`;
  const memory = g.mode === 'missing' && g.phase !== 'away'
    ? `<div class="memoryrow">${g.memory.map(s => {
      if (g.phase === 'cover') return '<span class="shape covered" aria-hidden="true"></span>';
      return g.phase === 'remember' || s !== g.target ? shape(s, '#8fac73', true) : '<span class="shape missing" role="img" aria-label="Missing shape">?</span>';
    }).join('')}</div>`
    : '';
  const rounds = questionCount();
  const rallyDrive = g.mode === 'rally';
  const freePlay = !!g.freePlay;
  const rallyNeed = rallyClearCount(rounds);
  const rallyRights = Math.min(rallyNeed, g.rallyRights || 0);
  const scene = rocket || race || chase || hop || toast || glide || aisle || lily || side ? '' : g.show;
  const height = Math.round(Math.min(1, Math.max(0, g.altitude || 0)) * 100);
  const paceMark = g.mode === 'lanes' && g.started && g.style !== 'reach' ? `${lanePaceName(g)} · ` : '';
  const tally = freePlay ? '<span>Arcade</span>' : rallyDrive ? `<span id="rallyTally">${rallyRights >= rallyNeed ? 'Finish the stage' : `${g.rallyRights || 0} / ${rallyNeed}`}</span>` : side ? `<span id="rallyTally">${g.index + 1} / ${rounds}</span>` : race ? '<span>Full tank</span>' : glide ? `<span id="glideTally">${g.index + 1} / ${rounds}</span>` : marble ? '<span id="runTally">Level 1 · 0</span>' : maze ? `<span id="runTally">${g.clock?.seconds || 0}s · 1 / ${rounds}</span>` : hop ? `<span id="hopTally">${g.index + 1} / ${rounds}</span>` : toast ? `<span id="toastTally">${g.index + 1} / ${rounds} · ${g.board?.lives || 5} left</span>` : aisle ? `<span id="aisleTally">${g.index + 1} / ${rounds} · ${g.board?.seconds || 32}s</span>` : lily ? `<span id="lilyTally">${g.index + 1} / ${rounds} · ${g.board?.lives || 4} left</span>` : bridge ? `<span id="bridgeTally">${g.index + 1} / ${rounds} · ${g.lives || 1} ${(g.lives || 1) === 1 ? 'life' : 'lives'}</span>` : rocket ? `<span id="rocketTally">${esc(rocketZone(g.altitude || 0.32))}</span>` : `<span>${paceMark}${g.index + 1} / ${rounds}</span>`;
  const barMax = rallyDrive ? rallyNeed : marble ? (g.track?.step || 8) : maze ? (g.clock?.seconds || 50) : rocket ? 100 : rounds;
  const barNow = rallyDrive ? rallyRights : marble ? 0 : maze ? barMax : rocket ? height : g.index;
  const barLabel = rallyDrive ? 'Right answers before the open road' : marble ? 'Points to the next level' : maze ? 'Time left' : rocket ? 'Height toward space' : 'Questions completed';
  const barPct = rallyDrive ? (rallyNeed ? rallyRights / rallyNeed * 100 : 0) : marble ? 0 : maze ? 100 : rocket ? height : (rounds ? g.index / rounds * 100 : 0);
  const bar = race || freePlay ? '' : `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${barMax}" aria-valuenow="${barNow}" aria-label="${barLabel}"><div style="width:${barPct}%"></div></div>`;
  const raceEars = race && g.level >= 2 && data.sound && canSpeak() && raceKinds(p().race).includes('words');
  const reveal = race
    ? (raceEars ? '<button class="quiet" id="reveal" hidden aria-label="Show the word"><span aria-hidden="true">👁</span></button>' : '')
    : (wordHidden(g) ? '<button class="quiet" id="reveal" aria-label="Show the word"><span aria-hidden="true">👁</span></button>' : '');
  $('#app').innerHTML = `<div class="playtop"><button class="quiet" id="back">← All games</button><b>${esc(g.title)}</b>${tally}</div>${bar}<section class="playarea"><h1>${esc(heading(g))}</h1><button class="speaker" id="listen"><span aria-hidden="true">🔈</span> Hear it again</button>${reveal}${memory}${scene}${body}<p class="feedback" id="feedback" aria-live="polite"></p><button class="primary" id="next" data-camera-go hidden>${g.index + 1 === rounds ? 'See my stars ★' : 'Next adventure →'}</button></section>`;
  $('#back').onclick = requestHome;
  $('#listen').onclick = () => say(g.prompt);
  if ($('#reveal')) $('#reveal').onclick = () => {
    g.shown = true;
    const title = $('#app h1');
    if (title) title.textContent = g.prompt;
    $('#reveal').hidden = true;
  };
  if ($('#arm')) {
    if (g.mode === 'lanes' && g.style !== 'reach') {
      g.pace = g.pace || 'steady';
      const notes = {
        slow: 'The car stays slow.',
        steady: 'The car keeps a steady speed.',
        fast: 'The car stays fast.',
        survival: 'Each correct word makes the car faster.'
      };
      const paces = [...document.querySelectorAll('[data-pace]')];
      const hint = $('#paceHint');
      const paintPace = () => {
        paces.forEach(button => {
          const on = button.dataset.pace === g.pace;
          button.classList.toggle('selected', on);
          button.setAttribute('aria-pressed', String(on));
        });
        if (hint) hint.textContent = notes[g.pace] || notes.steady;
      };
      paces.forEach(button => { button.onclick = () => { g.pace = button.dataset.pace; paintPace(); }; });
      paintPace();
    }
    $('#arm').onclick = () => {
      if (side) {
        g.started = true;
        g.phase = 'play';
        renderGame();
        return;
      }
      if (g.mode === 'chase') {
        g.started = true;
        question();
        return;
      }
      if (g.mode === 'hop' || g.mode === 'toast' || g.mode === 'aisle' || g.mode === 'lily') {
        g.started = true;
        g.phase = 'play';
        renderGame();
        return;
      }
      if (g.mode === 'hook' || g.mode === 'sky' || g.mode === 'planet' || g.mode === 'marble' || g.mode === 'bridge' || g.mode === 'maze') {
        g.started = true;
        g.phase = 'play';
        if (g.mode === 'bridge') { question(); return; }
        renderGame();
        if (g.mode !== 'marble') say(g.prompt);
        return;
      }
      if (g.mode === 'lanes') {
        g.started = true;
        g.survival = g.pace === 'survival';
        g.phase = 'play';
        g.speed = laneDriveSpeed(g);
        renderGame();
        say(g.prompt);
        return;
      }
      if (g.mode === 'race') {
        g.phase = 'play';
        renderGame();
        return;
      }
      g.phase = 'play';
      renderGame();
      say(howTo);
    };
  }
  if ($('#hide')) $('#hide').onclick = () => {
    if (g.style === 'move') {
      g.phase = 'away';
      g.prompt = pick(breaks);
      renderGame();
      say(g.prompt);
      return;
    }
    g.phase = 'cover';
    g.prompt = 'Which shape is missing?';
    renderGame();
    say(g.prompt);
    clearCover();
    coverTimer = setTimeout(() => {
      if (game !== g || g.phase !== 'cover') return;
      g.phase = 'answer';
      renderGame();
    }, 900);
  };
  if ($('#backIn')) $('#backIn').onclick = () => {
    g.phase = 'answer';
    g.icon = '🦘';
    g.prompt = 'Which shape is missing? Jump to that card!';
    renderGame();
    say(g.prompt);
  };
  if ($('#gotit')) $('#gotit').onclick = () => withGrownup(() => answer(true, $('#gotit')));
  if ($('#notyet')) $('#notyet').onclick = () => withGrownup(() => answer(false, $('#notyet')));
  if ($('#showAnswer')) $('#showAnswer').onclick = () => withGrownup(() => {
    const key = $('#answerKey');
    if (key) key.hidden = false;
    $('#showAnswer').hidden = true;
  });
  document.querySelectorAll('[data-option]').forEach(b => b.onclick = () => {
    if (g.mode !== 'lunar') { answer(g.options[+b.dataset.option] === g.target, b); return; }
    if (g.options[+b.dataset.option] === g.target) armShot(b);
    else answer(false, b);
  });
  document.querySelectorAll('[data-letter]').forEach(b => b.onclick = () => {
    if (g.done) return;
    const letter = g.letters[+b.dataset.letter];
    if (letter === g.target[g.built.length]) {
      g.built += letter;
      b.disabled = true;
      $('#built').textContent = blanks(g.built, g.target);
      if (g.built === g.target) answer(true, b);
      else $('#feedback').textContent = 'Nice! Find the next letter.';
    } else missLetter(b, letter);
  });
  if ($('#spellType')) $('#spellType').addEventListener('input', () => {
    const field = $('#spellType');
    if (!field || g.done || g.mode !== 'build') return;
    const chars = String(field.value || '').match(/[a-zA-Z']/g) || [];
    field.value = '';
    for (const ch of chars) {
      if (g.done || g.built === g.target) break;
      const next = g.target[g.built.length];
      if (ch.toLowerCase() !== String(next).toLowerCase()) {
        field.classList.add('wrong');
        setTimeout(() => field.classList.remove('wrong'), 280);
        g.missed = true;
        $('#feedback').textContent = `${ch.toUpperCase()} is not the next letter.`;
        say('Try another letter.');
        showHint();
        break;
      }
      const button = [...document.querySelectorAll('[data-letter]')].find(el => !el.disabled && String(g.letters[+el.dataset.letter]).toLowerCase() === String(next).toLowerCase());
      if (!button) break;
      button.click();
    }
  });
  if ($('#clear')) $('#clear').onclick = () => { if (!g.done) { g.built = ''; renderGame(); } };
  $('#next').onclick = () => { g.index++; if (g.index >= rounds) finish(); else question(); };
  if (reach && !arcade) cam();
  if (side && g.phase === 'play') {
    mountSidecar($('#arcade'), side, {
      onReady() {
        const frame = document.querySelector('iframe.sidecar-frame');
        frame?.focus();
        if (game?.mode === 'bike') postSidecar(bikeConfig(game));
        if (game?.freePlay && (game.mode === 'flight' || game.mode === 'walk')) postSidecar({ type: 'arcade' });
        else if (game) postSidecar(rallyMessage(game));
      },
      onProgress(info) {
        if (game?.mode === 'bike' && Number.isFinite(+info?.travel)) game.bikeTravel = +info.travel;
      },
      onShow() {
        if (game && !game.finished) say(game.prompt);
      },
      onReplay() {
        if (game && !game.finished) say(game.prompt);
      },
      onNeed() {
        if (!game || game.finished || game.freePlay) return;
        if (game.mode === 'rally' && ((game.rallyRights || 0) >= rallyClearCount(questionCount()) || game.index >= (game.rallyStops || rallyQuestionCount(questionCount())))) {
          postSidecar({ type: 'clear' });
          return;
        }
        postSidecar(rallyMessage(game));
      },
      onPick(data) { gradeRally(data.index | 0); },
      onSlip() {
        const round = game;
        if (!round || round.finished || round.done) return;
        if (round.mode === 'walk') {
          const first = !round.missed;
          round.missed = true;
          const line = 'Not yet. Walk to another one.';
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = line;
          const title = $('#app h1');
          if (title) title.textContent = line;
          if (first) say(line);
          return;
        }
        if (round.rallyKind !== 'spell') return;
        const first = !round.missed;
        round.missed = true;
        const line = round.mode === 'flight' ? 'Not yet. The plane turns back.' : 'Not that letter. Keep spelling.';
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = line;
        if (round.mode === 'flight' && first) say(line);
      },
      onQuit() { home(); },
      onFinish(detail) {
        const round = game;
        if (!round || round.finished) return;
        if (round.mode === 'rally') {
          clearTimeout(rallyTimer);
          rallyTimer = setTimeout(() => {
            rallyTimer = 0;
            if (game !== round || round.finished) return;
            finish('stage');
          }, 800);
          return;
        }
        if (round.mode !== 'flight') return;
        const line = detail === 'crash' ? 'Game over. The plane hit the ground.' : 'You flew for 2 minutes.';
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = line;
        const title = $('#app h1');
        if (title) title.textContent = line;
        clearTimeout(rallyTimer);
        rallyTimer = setTimeout(() => {
          rallyTimer = 0;
          if (game !== round || round.finished) return;
          finish(detail);
        }, 1200);
      }
    });
  }
  if (screen && g.phase !== 'ready') {
    const mount = g.mode === 'catch' ? mountCatch : mountLanes;
    mount($('#arcade'), {
      prompt: g.prompt,
      choices: g.options,
      target: g.target,
      speed: g.speed,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      watchHands: reach && g.mode === 'catch' ? watchCatchHands : undefined,
      watchBody: reach && g.mode === 'lanes' ? watchLaneBody : undefined,
      onMiss() {
        g.missed = true;
        const feedback = $('#feedback');
        const line = reach && g.mode === 'lanes' ? 'Not yet. Get to the word. You have 10 seconds.' : 'Keep exploring. Try another one!';
        if (feedback) feedback.textContent = line;
        say(reach && g.mode === 'lanes' ? 'Not yet. Get to the word.' : 'Try another one.');
        showHint();
      },
      onDone(clean) {
        if (!clean) g.missed = true;
        answer(true);
      }
    });
  }
  if (hook && g.phase !== 'ready') {
    mountHook($('#arcade'), {
      prompt: g.prompt,
      choices: g.options,
      target: g.target,
      cast: g.cast,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      watchHands: reach ? watchHookHands : undefined,
      onMiss(kind) {
        g.missed = true;
        const line = kind === 'trash' ? 'That’s trash. Hook a fish.' : 'Try another fish.';
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = line;
        say(line);
        showHint();
      },
      onDone(clean) {
        if (!clean) g.missed = true;
        answer(true);
      }
    });
  }
  if (sky && g.phase !== 'ready') {
    mountSky($('#arcade'), {
      prompt: g.prompt,
      choices: g.options,
      target: g.target,
      wave: g.wave,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onMiss(kind) {
        if (game !== g || g.done) return;
        g.missed = true;
        const line = kind === 'hull' ? 'You got hit.' : 'Try another rock.';
        const feedback = $('#feedback');
        if (feedback && feedback.textContent !== line) {
          feedback.textContent = line;
          say(line);
        }
        if (kind !== 'hull') showHint();
      },
      onRetry() {
        if (game !== g || g.done || g.finished) return;
        const feedback = $('#feedback');
        if (feedback && feedback.textContent === 'You got hit.') feedback.textContent = '';
      },
      onEmpty() {
        if (game !== g || g.done || g.finished) return;
        g.missed = true;
        const line = 'You got hit.';
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = line;
        say(line);
      },
      onOver() {
        if (game !== g || g.finished) return;
        endSky();
      },
      onDone(clean) {
        if (game !== g || g.done) return;
        if (!clean) g.missed = true;
        answer(true);
      }
    });
  }
  if (planet && g.phase !== 'ready') {
    mountPlanet($('#arcade'), {
      prompt: g.prompt,
      choices: g.options,
      target: g.target,
      wave: g.wave,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onMiss(kind) {
        if (game !== g || g.done) return;
        g.missed = true;
        const line = kind === 'shield' ? 'A rock reached the planet.' : 'Try another rock.';
        const feedback = $('#feedback');
        if (feedback && feedback.textContent !== line) {
          feedback.textContent = line;
          say(line);
        }
        showHint();
      },
      onEmpty() {
        if (game !== g || g.done || g.finished) return;
        g.missed = true;
        const line = 'A rock reached the planet.';
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = line;
        say(line);
      },
      onOver() {
        if (game !== g || g.finished) return;
        endPlanet();
      },
      onDone(clean) {
        if (game !== g || g.done) return;
        if (!clean) g.missed = true;
        answer(true);
      }
    });
  }
  if (marble && g.phase !== 'ready') {
    const palette = colors.slice(0, g.track?.colors || 3);
    g.live = true;
    g.court = mountMarble($('#arcade'), {
      palette,
      track: g.track,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onQuestion(info) {
        if (game !== g || g.finished) return;
        g.target = info.color;
        g.prompt = `Shoot ${info.color}.`;
        const title = $('#app h1');
        if (title) title.textContent = g.prompt;
        say(g.prompt);
      },
      onScore(info) {
        if (game !== g || g.finished) return;
        g.points = info.points;
        g.playLevel = info.level;
        g.marbleGot = info.got;
        const tally = $('#runTally');
        if (tally) tally.textContent = `Level ${info.level} · ${info.points}`;
        const into = info.points % (g.track?.step || 8);
        const bar = document.querySelector('#app .progress div');
        const meter = document.querySelector('#app .progress');
        const pct = Math.round((into / (g.track?.step || 8)) * 100);
        if (bar) bar.style.width = `${pct}%`;
        if (meter) meter.setAttribute('aria-valuenow', String(into));
      },
      onClear(info) {
        if (game !== g || g.finished) return;
        g.asked = (g.asked || 0) + 1;
        if (info.clean) g.firstCorrect = (g.firstCorrect || 0) + 1;
        const feedback = $('#feedback');
        const line = `You cleared ${info.color}.`;
        if (feedback) feedback.textContent = line;
      },
      onOver(info) {
        if (game !== g || g.finished) return;
        if ((g.marbleGot || 0) < (g.track?.quota || 1)) g.asked = (g.asked || 0) + 1;
        finishRun(g, 'The marbles reached the nest.', `Level ${info.level}. ${info.points} points.`);
      }
    });
  }
  if (bridge && g.phase !== 'ready') {
    g.live = true;
    g.court = mountBridge($('#arcade'), {
      span: g.span,
      stops: questionCount(),
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onCrossed() {
        if (game !== g || g.finished || g.movingOn) return;
        g.movingOn = true;
        if (!g.done) {
          g.done = true;
          if (!g.missed) g.firstCorrect++;
        }
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = g.missed ? 'You made the hard landing.' : 'The bridge reaches.';
        continueBridge(g);
      },
      onMiss(info) {
        if (game !== g || g.finished) return;
        const feedback = $('#feedback');
        if (info?.easy) {
          g.lives = (g.lives || 1) + 1;
          paintBridgeProgress(g);
          const line = 'Another life. Hold and try the bridge again.';
          if (feedback) feedback.textContent = line;
          say(line);
          g.court?.retry();
          return;
        }
        g.asked = (g.index || 0) + 1;
        finishRun(g, 'The bridge fell.', g.freePlay ? 'You did not reach the last platform.' : `The answer was ${g.target}. You did not reach the last platform.`);
      }
    });
    if (g.freePlay) g.court.play({ easy: true });
  }
  if (maze && g.phase !== 'ready') {
    g.live = true;
    g.court = mountMaze($('#arcade'), {
      clock: g.clock,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onTick(info) {
        if (game !== g || g.finished || g.asking) return;
        const tally = $('#runTally');
        if (tally) tally.textContent = `${info.left}s · ${g.index + 1} / ${questionCount()}`;
        const bar = document.querySelector('#app .progress div');
        const meter = document.querySelector('#app .progress');
        const pct = info.total ? Math.round(info.left / info.total * 100) : 0;
        if (bar) bar.style.width = `${pct}%`;
        if (meter) meter.setAttribute('aria-valuenow', String(info.left));
      },
      onFall() {
        if (g.freePlay) {
          g.court?.revive();
          return;
        }
        askMaze(g, 'fall');
      },
      onTime() {
        if (g.freePlay) {
          g.court?.addTime(g.clock?.seconds || 12);
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = 'More time.';
          return;
        }
        askMaze(g, 'time');
      },
      onGoal() {
        if (game !== g || g.finished) return;
        g.asked = (g.asked || 0) + 1;
        g.firstCorrect = (g.firstCorrect || 0) + 1;
        g.index++;
        const rounds = questionCount();
        if (g.index >= rounds) finishRun(g, 'You found every flag.', `${rounds} ${rounds === 1 ? 'maze' : 'mazes'} done.`);
        else {
          g.clock = mazeClock(g.level);
          g.court?.next(g.clock);
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = 'Next maze.';
          say('Next maze.');
        }
      }
    });
  }
  if (puzzle) {
    mountPuzzle($('#arcade'), {
      shape: g.target,
      pieces: g.pieces,
      outline: g.outline,
      onBuilt() { puzzleReady(); }
    });
  }
  if (match) {
    mountMatch($('#arcade'), {
      faces: g.faces,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onPair(face) {
        if (game !== g || g.done) return;
        const line = face.label;
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = line;
        say(line);
      },
      onMiss() {
        if (game !== g || g.done) return;
        g.missed = true;
        const feedback = $('#feedback');
        if (feedback && feedback.textContent !== 'Not a match.') {
          feedback.textContent = 'Not a match.';
          say('Not a match.');
        }
        showHint();
      },
      onDone(clean) {
        if (game !== g || g.done) return;
        if (!clean) g.missed = true;
        answer(true);
      }
    });
  }
  if (trace) {
    mountTrace($('#arcade'), {
      kind: g.traceKind,
      name: g.target,
      guide: g.board.guide,
      fade: g.board.fade,
      tolerance: g.board.tolerance,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onMiss() {
        if (game !== g || g.done) return;
        g.missed = true;
        const feedback = $('#feedback');
        const line = 'Stay on the line. Try the path again.';
        if (feedback) feedback.textContent = line;
        say(line);
        showHint();
      },
      onDrive() {
        if (game !== g || g.done) return;
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = 'The car is driving the line.';
      },
      onDone(clean) {
        if (game !== g || g.done) return;
        if (!clean) g.missed = true;
        answer(true);
      }
    });
  }
  if (sort) {
    mountSort($('#arcade'), {
      tubes: g.tubes,
      pieces: g.pieces,
      capacity: g.board.capacity,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onMiss() {
        if (game !== g || g.done) return;
        g.missed = true;
        const feedback = $('#feedback');
        const line = 'That tube does not match. Pour onto the same kind, or an empty tube.';
        if (feedback) feedback.textContent = line;
        say(line);
        showHint();
      },
      onDone(clean) {
        if (game !== g || g.done) return;
        if (!clean) g.missed = true;
        answer(true);
      }
    });
  }
  if (crayon) {
    mountCrayon($('#arcade'), {
      picture: g.picture,
      legend: g.legend,
      brush: g.board.brush,
      cover: g.board.cover,
      onMiss(spot) {
        if (game !== g || g.done) return;
        g.missed = true;
        const feedback = $('#feedback');
        const line = `${spot.number} is ${spot.name}.`;
        if (feedback && feedback.textContent !== line) {
          feedback.textContent = line;
          say(line);
        }
        showHint();
      },
      onFill(spot) {
        if (game !== g || g.done) return;
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = `${spot.name} is in.`;
      },
      onDone(clean) {
        if (game !== g || g.done) return;
        if (!clean) g.missed = true;
        answer(true);
      }
    });
  }
  if (merge) {
    mountMerge($('#arcade'), {
      queue: g.queue,
      chain: g.chain,
      target: g.mergeTarget,
      size: g.board.size,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onMiss() {
        if (game !== g || g.done) return;
        g.missed = true;
        const feedback = $('#feedback');
        const line = 'Those two do not make it.';
        if (feedback) feedback.textContent = line;
        say(line);
        showHint();
      },
      onDone(clean) {
        if (game !== g || g.done) return;
        if (!clean) g.missed = true;
        answer(true);
      }
    });
  }
  if (chase && g.phase !== 'ready') {
    mountChase($('#arcade'), {
      prompt: g.prompt,
      choices: g.tokens,
      copies: g.board.copies,
      cols: g.board.cols,
      rows: g.board.rows,
      playerSpeed: g.board.player,
      bugSpeed: g.board.bug,
      bugs: g.board.bugs,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onMiss(kind) {
        if (game !== g || g.done) return;
        g.missed = true;
        const line = kind === 'bug' ? 'A ghost got you. Keep going.' : 'That berry is not the one.';
        const feedback = $('#feedback');
        if (feedback && feedback.textContent !== line) {
          feedback.textContent = line;
          say(line);
        }
        showHint();
      },
      onDone(clean) {
        if (game !== g || g.done) return;
        if (!clean) g.missed = true;
        answer(true);
      }
    });
  }
  if (hop && g.phase !== 'ready') {
    mountHop($('#arcade'), {
      board: g.board,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      nextQuestion: hopQuestion,
      onPrompt: paintHopPrompt,
      onMiss(kind) {
        if (game !== g || g.finished) return;
        g.missed = true;
        const line = kind === 'fall' ? 'You fell. Bounce back up the leaves.' : 'That one breaks. Hop on the right answer.';
        const feedback = $('#feedback');
        if (feedback && feedback.textContent !== line) {
          feedback.textContent = line;
          say(line);
        }
        showHint();
      },
      onClear(clean) {
        if (game !== g || g.finished) return;
        if (g.freePlay) return;
        if (!clean) g.missed = true;
        if (!g.missed) g.firstCorrect++;
        const found = foundLine(g);
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = found;
        say(found);
        g.index++;
        g.missed = false;
        $('#help')?.remove();
        paintHopProgress();
        if (g.index >= questionCount()) g.hopDone = true;
      },
      onFinished() {
        clearTimeout(hopTimer);
        hopTimer = setTimeout(() => {
          hopTimer = 0;
          if (game !== g || g.finished) return;
          finish();
        }, data.sound ? 500 : 250);
      }
    });
  }
  if (toast && g.phase !== 'ready') {
    mountToast($('#arcade'), {
      board: g.board,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      paceFor: toastPace,
      nextQuestion: toastQuestion,
      onPrompt: paintToastPrompt,
      onLives(lives) {
        g.lives = lives;
        paintToastProgress(lives);
      },
      onMiss(kind) {
        if (game !== g || g.finished) return;
        g.missed = true;
        const line = kind === 'drop' ? 'That toast landed. You have one less life.' : 'That toast is not the one.';
        const feedback = $('#feedback');
        if (feedback && feedback.textContent !== line) {
          feedback.textContent = line;
          say(line);
        }
        showHint();
      },
      onClear(clean) {
        if (game !== g || g.finished) return;
        if (g.freePlay) return;
        if (!clean) g.missed = true;
        if (!g.missed) g.firstCorrect++;
        const found = foundLine(g);
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = found;
        say(found);
        g.index++;
        g.missed = false;
        $('#help')?.remove();
        paintToastProgress(g.lives);
        if (g.index >= questionCount()) g.toastDone = true;
      },
      onOver() {
        if (game !== g || g.finished) return;
        g.asked = g.index;
        finishRun(g, 'The toasts landed.', 'Catch the right toast before it lands.');
      },
      onFinished() {
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          toastTimer = 0;
          if (game !== g || g.finished) return;
          finish();
        }, data.sound ? 500 : 250);
      }
    });
  }
  if (glide && g.phase !== 'ready') {
    mountGlide($('#arcade'), {
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      nextQuestion: glideQuestion,
      onPrompt: paintGlidePrompt,
      onMiss() {
        if (game !== g || g.finished) return;
        g.missed = true;
        const line = 'That gem is not the answer. Grab the right one.';
        const feedback = $('#feedback');
        if (feedback && feedback.textContent !== line) {
          feedback.textContent = line;
          say(line);
        }
        showHint();
      },
      onClear(clean) {
        if (game !== g || g.finished) return;
        if (g.freePlay) return;
        if (!clean) g.missed = true;
        if (!g.missed) g.firstCorrect++;
        const found = foundLine(g);
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = found;
        say(found);
        g.index++;
        g.missed = false;
        $('#help')?.remove();
        paintGlideProgress();
        if (g.index >= questionCount()) g.glideDone = true;
      },
      onOver(reason) {
        if (game !== g || g.finished) return;
        g.asked = g.index;
        const title = reason === 'fuel' ? 'The tank is empty.' : 'The plane met the island.';
        const grabbed = g.index ? `You grabbed ${g.index} ${g.index === 1 ? 'answer' : 'answers'}.` : 'Grab the gem with the answer.';
        finishRun(g, title, grabbed);
      },
      onFinished() {
        clearTimeout(glideTimer);
        glideTimer = setTimeout(() => {
          glideTimer = 0;
          if (game !== g || g.finished) return;
          finish();
        }, data.sound ? 500 : 250);
      }
    });
  }
  if (aisle && g.phase !== 'ready') {
    mountAisle($('#arcade'), {
      board: g.board,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      nextQuestion: aisleQuestion,
      onPrompt: paintAislePrompt,
      onTime(seconds) {
        g.clockLeft = seconds;
        paintAisleProgress();
      },
      onMiss(kind) {
        if (game !== g || g.finished) return;
        g.missed = true;
        const line = kind === 'time' ? 'Time is up. The right one is glowing. Walk over and pick it up.' : 'That stays on the shelf. Keep walking.';
        const feedback = $('#feedback');
        if (feedback && feedback.textContent !== line) {
          feedback.textContent = line;
          say(line);
        }
        showHint();
      },
      onClear(clean) {
        if (game !== g || g.finished) return;
        if (g.freePlay) return;
        if (!clean) g.missed = true;
        if (!g.missed) g.firstCorrect++;
        const found = foundLine(g);
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = found;
        say(found);
        g.index++;
        g.missed = false;
        $('#help')?.remove();
        paintAisleProgress();
        if (g.index >= questionCount()) g.aisleDone = true;
      },
      onFinished() {
        clearTimeout(aisleTimer);
        aisleTimer = setTimeout(() => {
          aisleTimer = 0;
          if (game !== g || g.finished) return;
          finish();
        }, data.sound ? 500 : 250);
      }
    });
  }
  if (lily && g.phase !== 'ready') {
    mountLily($('#arcade'), {
      board: g.board,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      nextQuestion: lilyQuestion,
      onPrompt: paintLilyPrompt,
      onLives(lives) {
        g.lives = lives;
        paintLilyProgress(lives);
      },
      onMiss(kind) {
        if (game !== g || g.finished) return;
        g.missed = true;
        const line = kind === 'car' ? 'A car got there first. Hop when the road is clear.' : kind === 'water' ? 'That hop missed the log. Ride one across.' : 'That pad is not the one.';
        const feedback = $('#feedback');
        if (feedback && feedback.textContent !== line) {
          feedback.textContent = line;
          say(line);
        }
        showHint();
      },
      onClear(clean) {
        if (game !== g || g.finished) return;
        if (g.freePlay) return;
        if (!clean) g.missed = true;
        if (!g.missed) g.firstCorrect++;
        const found = foundLine(g);
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = found;
        say(found);
        g.index++;
        g.missed = false;
        $('#help')?.remove();
        paintLilyProgress(g.lives);
        if (g.index >= questionCount()) g.lilyDone = true;
      },
      onOver() {
        if (game !== g || g.finished) return;
        g.asked = g.index;
        finishRun(g, 'The hops ran out.', 'Ride the logs and land on the right lily pad.');
      },
      onFinished() {
        clearTimeout(lilyTimer);
        lilyTimer = setTimeout(() => {
          lilyTimer = 0;
          if (game !== g || g.finished) return;
          finish();
        }, data.sound ? 500 : 250);
      }
    });
  }
  if (lunar) {
    lunarCourt = mountLunar($('#arcade'), {
      body: g.world,
      aim: true,
      learn: false,
      picker: false,
      dial: false,
      hud: true,
      motion: g.level >= 3 ? 'trick' : g.level >= 2 ? 'sway' : 'still',
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      sound: data.sound,
      reset: false,
      aimToggle: false,
      keys: false,
      locked: !g.freePlay,
      lockedHint: 'Answer first',
      stats: { score: g.points, shots: g.shots, streak: g.streak },
      onLocked() {
        if (game !== g || g.done || g.armed) return;
        const feedback = $('#feedback');
        if (!feedback || feedback.textContent === 'Answer first, then shoot.') return;
        feedback.textContent = 'Answer first, then shoot.';
        say('Answer first, then shoot.');
      },
      onSwish(info) {
        if (game !== g || g.done || (!g.freePlay && !g.armed)) return;
        g.points = info?.score || 0;
        g.shots = info?.shots || 0;
        g.streak = info?.streak || 1;
        if (g.freePlay) {
          const feedback = $('#feedback');
          const line = g.streak >= 3 ? `Swish! ${g.streak} in a row.` : 'Swish!';
          if (feedback) feedback.textContent = line;
          return;
        }
        answer(true);
      },
      onBrick(info) {
        if (game !== g || g.done || (!g.freePlay && !g.armed)) return;
        if (g.freePlay) {
          g.points = info?.score || 0;
          g.shots = info?.shots || 0;
          g.streak = 0;
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = 'Missed the hoop.';
          return;
        }
        g.armed = false;
        g.missed = true;
        g.points = info?.score || 0;
        g.shots = info?.shots || 0;
        g.streak = 0;
        lunarCourt?.lock();
        document.querySelectorAll('.choice').forEach(el => {
          el.classList.remove('correct');
          if (!el.classList.contains('wrong')) el.disabled = false;
        });
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = 'Missed the hoop. Answer again for another shot.';
        say('Answer again for another shot.');
      }
    });
  }
  if (rocket) {
    mountRocket($('#arcade'), {
      altitude: g.altitude || 0.32,
      seconds: g.seconds,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onAltitude(next) {
        g.altitude = next;
        paintRocketMeters();
      },
      onEmpty() {
        if (game !== g || g.done || g.flightOver) return;
        g.done = true;
        g.missed = true;
        g.asked = (g.asked || 0) + 1;
        document.querySelectorAll('#rocketChoices .choice').forEach(el => { el.disabled = true; });
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = 'Too slow. The rocket is falling!';
        say('Too slow. The rocket is falling.');
        if (!g.flightOver) scheduleRocketQuestion();
      },
      onCrash() {
        if (game !== g || g.scored) return;
        endRocketFlight('crash');
      },
      onSpace() {
        if (game !== g || g.scored) return;
        g.flightOver = true;
        clearRocketTimer();
        const title = $('#app h1');
        if (title) title.textContent = 'You’re in space! Fly the rocket.';
        const show = $('#rocketShow');
        if (show) show.replaceChildren();
        const choices = $('#rocketChoices');
        if (choices) choices.hidden = true;
        $('#help')?.remove();
        $('#reveal')?.remove();
        const tally = $('#rocketTally');
        if (tally) tally.textContent = 'Space';
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = 'Steer onto the moon, or fly past the stars.';
        say('You’re in space! Fly the rocket.');
        focusHeading();
      },
      onFlyDone(result) {
        if (game !== g || g.scored) return;
        endRocketFlight(result?.landed ? 'moon' : 'stars');
      }
    });
    g.launched = true;
  }
  if (race && g.phase === 'play') {
    mountRace($('#arcade'), {
      seconds: fuelSeconds(g.level),
      gateSeconds: raceGateSeconds(g.level),
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      nextGate: raceQuestion,
      onPrompt: paintRacePrompt,
      onOver(result) {
        if (game !== g || g.finished) return;
        finishRace(result);
      }
    });
  }
  focusHeading();
}
function showHint() {
  const g = game;
  if ($('#help')) return;
  const help = document.createElement('button');
  help.id = 'help';
  help.className = 'quiet';
  help.textContent = 'Show me a hint';
  help.onclick = () => {
    const grade4 = !!g.math?.grade;
    if (!grade4 && help.dataset.step !== 'answer') {
      help.dataset.step = 'answer';
      help.textContent = 'Show the answer';
      const hint = strategyHint(g);
      $('#feedback').textContent = hint;
      say(hint);
      return;
    }
    const hint = grade4 ? mathHint(g.math, hintMode(g)) : (g.math ? mathHint(g.math, hintMode(g)) : (g.mode === 'build' ? `The next letter is ${g.target[g.built.length]}.` : g.mode === 'puzzle' ? `The shape is a ${g.target}.` : g.mode === 'match' ? 'Turn two cards that look the same.' : g.mode === 'crayon' ? 'Paint every number with the color beside it.' : `Look for ${g.target}.`));
    $('#feedback').textContent = hint;
    say(hint);
    if (g.mode !== 'build' && !grade4) document.querySelectorAll('[data-option]').forEach(el => {
      if (String(g.options[+el.dataset.option]) === String(g.target)) el.classList.add('hinted');
    });
  };
  $('#feedback').after(help);
}
function missLetter(button, letter) {
  const g = game;
  if (g.done) return;
  g.missed = true;
  button.classList.add('wrong');
  $('#feedback').textContent = `${letter.toUpperCase()} is not the next letter.`;
  say('Try another letter.');
  showHint();
  setTimeout(() => button.classList.remove('wrong'), 700);
}
function paintRocketMeters() {
  const g = game;
  if (!g || g.mode !== 'rocket') return;
  const alt = Math.min(1, Math.max(0, g.altitude || 0));
  const bar = document.querySelector('#app .progress div');
  const meter = document.querySelector('#app .progress');
  if (bar) bar.style.width = `${Math.round(alt * 100)}%`;
  if (meter) meter.setAttribute('aria-valuenow', String(Math.round(alt * 100)));
  const tally = $('#rocketTally');
  if (tally && !g.flightOver) tally.textContent = rocketZone(alt);
}
function bindRocketReveal(g) {
  const existing = $('#reveal');
  if (!wordHidden(g)) {
    existing?.remove();
    return;
  }
  if (existing) {
    existing.hidden = false;
    return;
  }
  const btn = document.createElement('button');
  btn.id = 'reveal';
  btn.className = 'quiet';
  btn.setAttribute('aria-label', 'Show the word');
  btn.innerHTML = '<span aria-hidden="true">👁</span>';
  btn.onclick = () => {
    g.shown = true;
    const title = $('#app h1');
    if (title) title.textContent = g.prompt;
    btn.hidden = true;
  };
  $('#listen')?.after(btn);
}
function paintRocketQuestion() {
  const g = game;
  if (!g || g.flightOver) return;
  g.done = false;
  g.missed = false;
  const title = $('#app h1');
  if (title) title.textContent = heading(g);
  const show = $('#rocketShow');
  if (show) show.innerHTML = g.show || '';
  const choices = $('#rocketChoices');
  if (choices) {
    choices.hidden = false;
    choices.innerHTML = g.options.map((x, i) => `<button class="choice" data-option="${i}" aria-label="${esc(String(x))}">${g.render(x)}</button>`).join('');
    choices.querySelectorAll('[data-option]').forEach(b => b.onclick = () => answer(g.options[+b.dataset.option] === g.target, b));
  }
  const feedback = $('#feedback');
  if (feedback) feedback.textContent = '';
  $('#help')?.remove();
  bindRocketReveal(g);
  pokeRocket('arm');
  paintRocketMeters();
  focusHeading();
}
function scheduleRocketQuestion() {
  clearRocketTimer();
  const g = game;
  rocketTimer = setTimeout(() => {
    rocketTimer = 0;
    if (game !== g || g.flightOver || g.finished) return;
    if (document.querySelector('dialog[open]')) { scheduleRocketQuestion(); return; }
    g.index++;
    question();
  }, 880);
}
function resolveRocket(ok, button) {
  const g = game;
  if (!g || g.done || g.flightOver) return;
  g.done = true;
  g.asked = (g.asked || 0) + 1;
  document.querySelectorAll('#rocketChoices .choice').forEach(el => { el.disabled = true; });
  if (!ok) {
    g.missed = true;
    if (button?.classList.contains('choice')) button.classList.add('wrong');
    pokeRocket('drop');
    if (g.flightOver) return;
    const feedback = $('#feedback');
    if (feedback) feedback.textContent = 'The rocket is dropping. Keep it up!';
    say('The rocket is dropping.');
    scheduleRocketQuestion();
    return;
  }
  if (!g.missed) g.firstCorrect++;
  if (button?.classList.contains('choice')) button.classList.add('correct');
  $('#help')?.remove();
  pokeRocket('boost');
  if (g.flightOver) return;
  const found = foundLine(g);
  const feedback = $('#feedback');
  if (feedback) feedback.textContent = found;
  say(found);
  scheduleRocketQuestion();
}
function endRocketFlight(kind) {
  const g = game;
  if (!g || g.scored) return;
  g.scored = true;
  g.finished = true;
  g.flightOver = true;
  clearRocketTimer();
  const asked = g.asked || 0;
  const correct = Math.min(asked, g.firstCorrect || 0);
  if (asked > 0) {
    Object.assign(p(), applyRound(p(), g.mode, g.key, asked, correct));
    save();
  }
  rocketTimer = setTimeout(() => {
    if (game !== g) return;
    showRocketEnd(g, kind, asked, correct);
  }, kind === 'crash' ? 900 : 500);
}
function showRocketEnd(g, kind, asked, correct) {
  if (game !== g) return;
  stopArcade();
  const title = kind === 'moon' ? 'You landed on the moon!' : kind === 'stars' ? 'You flew past the stars!' : 'The rocket came back down.';
  const sub = kind === 'crash' ? 'Let’s launch again.' : 'Nice flying. Let’s launch again.';
  const stars = asked > 0 ? `<p>First try: ${correct} of ${asked}</p><p class="hint">+${asked} learning stars</p>` : '';
  const mark = kind === 'crash' ? '🚀' : '🌟';
  $('#app').innerHTML = `<section class="playarea"><div class="result-star" aria-hidden="true">${mark}</div><h1>${esc(title)}</h1><p>${esc(sub)}</p>${stars}${starGardenHtml()}<button class="primary" id="again">Launch again</button> <button class="quiet" id="all">Choose a game</button></section>`;
  const launch = () => { if (game === g) start('rocket'); };
  $('#again').onclick = () => { clearRocketTimer(); launch(); };
  $('#all').onclick = () => { clearRocketTimer(); home(); };
  say(title);
  focusHeading();
  rocketTimer = setTimeout(launch, kind === 'crash' ? 1800 : 2400);
}
let ears = null;
function stopEars() {
  const rec = ears;
  if (!rec) return;
  ears = null;
  rec.onresult = null;
  rec.onerror = null;
  rec.onend = null;
  try { rec.abort(); } catch { try { rec.stop(); } catch { /* already stopped */ } }
}
function shapeChoiceButtons(g) {
  return `<div class="choices">${g.options.map((x, i) => `<button class="choice" data-option="${i}" aria-label="${esc(x)}">${shape(x)}</button>`).join('')}</div>`;
}
function bindShapeChoices(g) {
  $('#puzzleSay')?.querySelectorAll('[data-option]').forEach(b => b.onclick = () => {
    if (game !== g || g.done) return;
    stopEars();
    g.heard = '';
    answer(g.options[+b.dataset.option] === g.target, b);
  });
}
function showShapeTaps() {
  const g = game;
  const box = $('#puzzleSay');
  if (!box || !g || g.done) return;
  stopEars();
  $('#sayShape')?.remove();
  const status = $('#sayStatus');
  if (status) status.textContent = 'Tap the shape.';
  else {
    box.hidden = false;
    box.innerHTML = `${shapeChoiceButtons(g)}<p class="hint" id="sayStatus">Tap the shape.</p>`;
    bindShapeChoices(g);
  }
}
function hearShape() {
  const g = game;
  if (!g || g.done || g.phase !== 'say') return;
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) { showShapeTaps(); return; }
  stopEars();
  const rec = new Rec();
  ears = rec;
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 5;
  const button = $('#sayShape');
  const status = $('#sayStatus');
  if (button) { button.disabled = true; button.textContent = 'Listening…'; }
  if (status) status.textContent = 'Say the shape.';
  rec.onresult = event => {
    if (game !== g || g.done) return;
    const result = event.results[0];
    let heard = '';
    for (let i = 0; i < result.length; i++) {
      heard = spokenShape(result[i].transcript, shapes);
      if (heard) break;
    }
    if (!heard) {
      if (status) status.textContent = 'Say the shape you see.';
      say('Say the shape you see.');
      return;
    }
    g.heard = heard;
    answer(heard === g.target);
  };
  rec.onerror = event => {
    if (event.error === 'aborted' || game !== g || g.done) return;
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      showShapeTaps();
      return;
    }
    if (status) status.textContent = event.error === 'no-speech' ? 'I didn’t hear you. Try again.' : 'Say the shape again.';
  };
  rec.onend = () => {
    if (ears === rec) ears = null;
    if (game !== g || g.done || g.phase !== 'say') return;
    const again = $('#sayShape');
    if (again) { again.disabled = false; again.textContent = 'Say the shape'; }
  };
  try { rec.start(); }
  catch { showShapeTaps(); }
}
function puzzleReady() {
  const g = game;
  if (!g || g.mode !== 'puzzle' || g.phase === 'say' || g.done) return;
  g.phase = 'say';
  g.prompt = 'What shape did you build?';
  const title = $('#app h1');
  if (title) title.textContent = g.prompt;
  const box = $('#puzzleSay');
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (box) {
    box.hidden = false;
    const say = Rec
      ? `<button class="primary" type="button" id="sayShape">Say the shape</button><p class="hint" id="sayStatus">Tap a shape, or tap the button and say it.</p>`
      : `<p class="hint" id="sayStatus">Tap the shape.</p>`;
    box.innerHTML = `${shapeChoiceButtons(g)}${say}`;
    bindShapeChoices(g);
    if (Rec) $('#sayShape').onclick = () => hearShape();
  }
  say(g.prompt);
}
function answer(ok, b) {
  const g = game;
  if (!g || g.done || g.flightOver) return;
  if (g.mode === 'rocket') { resolveRocket(ok, b); return; }
  if (g.mode === 'maze' && g.asking) {
    const kind = g.asking;
    g.asking = '';
    g.asked = (g.asked || 0) + 1;
    document.querySelectorAll('#askChoices .choice').forEach(el => { el.disabled = true; });
    if (!ok) {
      if (b?.classList.contains('choice')) b.classList.add('wrong');
      finishRun(g, 'The maze is done.', `The answer was ${g.target}.`);
      return;
    }
    g.firstCorrect = (g.firstCorrect || 0) + 1;
    if (b?.classList.contains('choice')) b.classList.add('correct');
    const bonus = g.clock?.bonus || 8;
    if (kind === 'fall') g.court?.revive();
    g.court?.addTime(bonus);
    const box = $('#askChoices');
    if (box) { box.hidden = true; box.replaceChildren(); }
    const show = $('#askShow');
    if (show) show.replaceChildren();
    g.prompt = 'Tilt to the flag.';
    const title = $('#app h1');
    if (title) title.textContent = g.prompt;
    const feedback = $('#feedback');
    const line = `${bonus} more seconds.`;
    if (feedback) feedback.textContent = line;
    say(line);
    return;
  }
  if (!ok) {
    g.missed = true;
    if (b?.classList.contains('choice')) {
      b.classList.add('wrong');
      b.disabled = true;
    }
    if (g.mode === 'bridge') {
      document.querySelectorAll('#askChoices .choice').forEach(el => { el.disabled = true; });
      const line = 'Hold to grow the bridge. The landing is small.';
      $('#feedback').textContent = line;
      say(line);
      g.court?.play({ easy: false });
      return;
    }
    if (g.mode === 'puzzle') {
      stopEars();
      const line = g.heard ? `I heard ${g.heard}. Look again.` : 'Look again.';
      $('#feedback').textContent = line;
      say(line);
      const again = $('#sayShape');
      if (again) { again.disabled = false; again.textContent = 'Say the shape'; }
      showHint();
      return;
    }
    $('#feedback').textContent = 'Keep exploring. Try another one!';
    say('Try another one.');
    showHint();
    return;
  }
  g.done = true;
  if (g.mode === 'puzzle') {
    stopEars();
    const box = $('#puzzleSay');
    if (box) box.hidden = true;
  }
  if (g.mode === 'bridge') {
    document.querySelectorAll('#askChoices .choice').forEach(el => { el.disabled = true; });
    if (b?.classList.contains('choice')) b.classList.add('correct');
    if (!g.missed) g.firstCorrect++;
    const line = 'Hold to grow the bridge. The landing is wide.';
    $('#feedback').textContent = line;
    say(line);
    g.court?.play({ easy: true });
    return;
  }
  $('#help')?.remove();
  if (!g.missed) g.firstCorrect++;
  const found = foundLine(g);
  $('#feedback').textContent = found;
  say(found);
  if (g.mode === 'lanes') {
    g.laneClears = (g.laneClears || 0) + 1;
    continueLanes(g);
    return;
  }
  if (g.mode === 'hook') {
    continueHook(g);
    return;
  }
  if (g.mode === 'sky') {
    continueSky(g);
    return;
  }
  if (g.mode === 'planet') {
    continuePlanet(g);
    return;
  }
  if (g.mode === 'chase') {
    continueChase(g);
    return;
  }
  if (g.mode === 'match') {
    continueMatch(g);
    return;
  }
  if (g.mode === 'trace' || g.mode === 'sort' || g.mode === 'merge' || g.mode === 'crayon') {
    continueLearn(g);
    return;
  }
  if (b?.classList.contains('choice')) b.classList.add('correct');
  if ((g.style === 'move' || g.style === 'hunt') && g.mode !== 'catch' && g.mode !== 'lanes' && g.mode !== 'rocket' && g.mode !== 'lunar' && g.mode !== 'hook' && g.mode !== 'sky' && g.mode !== 'planet' && g.mode !== 'puzzle') $('#feedback').insertAdjacentHTML('afterend', `<p class="hint">Grown-up: ${esc(tip(g))}</p>`);
  $('#next').hidden = false;
  document.querySelectorAll('.choice,.confirm,.steer-btn').forEach(x => { x.disabled = true; });
  $('#next').focus();
}
function armShot(button) {
  const g = game;
  if (!g || g.done || g.armed) return;
  g.armed = true;
  button.classList.add('correct');
  document.querySelectorAll('.choice').forEach(el => { el.disabled = true; });
  $('#feedback').textContent = 'Pull back and shoot!';
  say('Pull back and shoot.');
  lunarCourt?.unlock();
}
function finishRace(result) {
  clearLaneTimer();
  clearRocketTimer();
  stopArcade();
  stopLunar();
  const g = game;
  if (!g || g.finished) return;
  g.finished = true;
  camOff();
  const distance = Math.max(0, Math.round(+result?.distance || 0));
  const gates = Math.max(0, result?.correct | 0);
  const faced = Math.max(1, gates + (result?.reason === 'wrong' ? 1 : 0));
  Object.assign(p(), applyRound(p(), 'race', g.key, faced, gates));
  const board = raceBoard(loadBoard(), { name: p().name, distance, at: Date.now() });
  saveBoard(board.list);
  save();
  const why = result?.reason === 'wrong' ? `That lane was not the answer. It was ${g.target}.` : 'The tank ran out.';
  const mark = distance >= board.best
    ? (board.rank === 1 ? 'Furthest on this device.' : `Best for ${p().name}. Number ${board.rank} on this device.`)
    : `Best for ${p().name} is ${board.best} m.`;
  $('#app').innerHTML = `<section class="playarea"><div class="result-star" aria-hidden="true">⛽</div><h1>You drove ${distance} m.</h1><p>${esc(why)}</p><p>${gates} right ${gates === 1 ? 'answer' : 'answers'}. ${esc(mark)}</p><p class="hint">+${faced} learning stars</p>${raceBoardHtml(board.list)}${starGardenHtml()}<button class="primary" id="again">Drive again</button> <button class="quiet" id="all">Choose a game</button></section>`;
  $('#again').onclick = () => start('race');
  $('#all').onclick = home;
  say(`You drove ${distance} meters.`);
  focusHeading();
}
function finish(detail) {
  clearLaneTimer();
  clearHookTimer();
  clearSkyTimer();
  clearPlanetTimer();
  clearMatchTimer();
  stopArcade();
  stopLunar();
  stopHook();
  stopSky();
  stopPlanet();
  stopPuzzle();
  stopMatch();
  stopMarble();
  stopBridge();
  stopMaze();
  stopChase();
  stopHop();
  stopToast();
  stopGlide();
  stopAisle();
  stopLily();
  stopTrace();
  stopSort();
  stopMerge();
  stopCrayon();
  stopSidecar();
  clearLearnTimer();
  clearTimeout(chaseTimer);
  clearTimeout(hopTimer);
  clearTimeout(toastTimer);
  clearTimeout(glideTimer);
  clearTimeout(aisleTimer);
  clearTimeout(lilyTimer);
  clearTimeout(rallyTimer);
  chaseTimer = 0;
  hopTimer = 0;
  toastTimer = 0;
  glideTimer = 0;
  aisleTimer = 0;
  lilyTimer = 0;
  rallyTimer = 0;
  stopEars();
  const g = game;
  g.finished = true;
  camOff();
  const flightEnd = g.mode === 'flight' && (detail === 'crash' || detail === 'flew');
  const stageEnd = g.mode === 'rally' && detail === 'stage';
  const rounds = flightEnd ? (g.flightRights || 5) : stageEnd ? Math.max(1, g.index || g.rallyRights || 1) : questionCount();
  Object.assign(p(), applyRound(p(), g.mode, g.key, rounds, g.firstCorrect));
  save();
  const dots = Array.from({ length: rounds }, (_, i) => `<span class="${i < g.firstCorrect ? 'on' : ''}"></span>`).join('');
  const played = rounds === 1 ? 'You played 1 question.' : `You played ${rounds}.`;
  const heading = flightEnd ? (detail === 'crash' ? 'Game over.' : 'You flew for 2 minutes.') : stageEnd ? 'You finished the stage.' : played;
  const note = flightEnd && detail === 'crash' ? 'The plane hit the ground.' : stageEnd ? `${g.rallyRights || 0} right along the road` : 'First try';
  const spoken = flightEnd ? (detail === 'crash' ? 'Game over. The plane hit the ground.' : 'You flew for 2 minutes.') : stageEnd ? 'You finished the stage.' : played;
  const stars = rounds === 1 ? '+1 learning star' : `+${rounds} learning stars`;
  $('#app').innerHTML = `<section class="playarea"><div class="result-star" aria-hidden="true">${flightEnd && detail === 'crash' ? '✈' : '🌟'}</div><h1>${heading}</h1><p>${note}</p><div class="dots" aria-label="${g.firstCorrect} of ${rounds} first tries">${dots}</div><p class="hint">${stars}</p>${starGardenHtml()}<button class="primary" id="again">Play again</button> <button class="quiet" id="all">Choose a game</button></section>`;
  $('#again').onclick = () => start(g.mode);
  $('#all').onclick = home;
  say(spoken);
  focusHeading();
}
function watchHookHands(fn) {
  let off = () => {};
  let gone = false;
  const status = t => { const el = $('#camstatus'); if (el) el.textContent = t; };
  (camera ??= import('./camera.js?v=hook-reach')).then(m => {
    if (gone) return;
    off = m.watchHands(fn);
    m.attach($('.hook-cam'), status);
  }).catch(() => status('Reach play could not load. Use the arrows.'));
  return () => { gone = true; off(); };
}
function watchCatchHands(fn) {
  let off = () => {};
  let gone = false;
  const status = t => { const el = $('#camstatus'); if (el) el.textContent = t; };
  (camera ??= import('./camera.js?v=hook-reach')).then(m => {
    if (gone) return;
    off = m.watchHands(fn);
    m.attach($('.catch-cam'), status);
  }).catch(() => status('Reach play could not load.'));
  return () => { gone = true; off(); };
}
function watchLaneBody(fn) {
  let off = () => {};
  let gone = false;
  const status = t => { const el = $('#camstatus'); if (el) el.textContent = t; };
  (camera ??= import('./camera.js?v=hook-reach')).then(m => {
    if (gone) return;
    off = m.watchBody(fn);
    m.attach($('.lane-cam'), status);
  }).catch(() => status('Reach play could not load.'));
  return () => { gone = true; off(); };
}
function cam() {
  const status = t => { const el = $('#camstatus'); if (el) el.textContent = t; };
  (camera ??= import('./camera.js?v=hook-reach')).then(m => m.attach($('.camstage'), status)).catch(() => {
    camera = null;
    status('Reach play could not load. You can still tap the answers.');
  });
}
function camOff() { camera?.then(m => m.stop()).catch(() => {}); }
function decks(x = p()) {
  const lv = id => +(x.levels?.[id] || x.level);
  const counts = {};
  x.words.forEach(w => {
    const c = {};
    [...w].forEach(ch => { c[ch] = (c[ch] || 0) + 1; });
    Object.entries(c).forEach(([ch, n]) => { counts[ch] = Math.max(counts[ch] || 0, n); });
  });
  const word = w => `<span class="cardword" style="--len:${w.length}">${esc(w)}</span>`;
  const chip = (name, hex) => `<span class="swatch${name === 'white' || name === 'yellow' ? ' light' : ''}" style="background:${hex}"></span>`;
  return [
    ['shapes', 'Shapes', 'Shape safari & What’s missing?', pools(Math.max(lv('shapes'), lv('missing'))).ss.map(s => [shape(s), s])],
    ['colors', 'Colors', 'Color garden', pools(lv('colors')).cs.map(([c, h]) => [chip(c, h), c])],
    ['mix', 'Colored shapes', 'Jump to it!', mixDeck(lv('mix')).map(m => { const [c, s] = m.split(' '); return [shape(s, colors.find(v => v[0] === c)[1]), m]; })],
    ['words', 'Sight words', 'Word parking', x.words.map(w => [word(w), 'Word parking'])],
    ['letters', 'Letters', 'Build a word', Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).flatMap(([ch, n]) => Array(n).fill([word(ch), 'Build a word']))],
    ['numbers', 'Numbers', 'Count & clap and Number path', numberDeck(stageOf(x, data.profiles.indexOf(x)), lv('count'), lv('path')).map(n => [`<span class="cardword${n === 6 || n === 9 ? ' under' : ''}" style="--len:${String(n).length}">${n}</span>`, 'Number'])]
  ];
}
function openPrint() {
  $('#printFor').textContent = p().name;
  $('#deckList').innerHTML = decks().map(([id, name, use, cards]) => `<label class="check"><input type="checkbox" data-deck="${id}" checked> ${name} · ${cards.length} cards <span class="hint">for ${use}</span></label>`).join('');
  $('#printDialog').showModal();
}
function formSnapshot() {
  return JSON.stringify({
    profile: $('#editProfile').value,
    name: $('#name').value,
    stage: $('#stage').value,
    level: $('#level').value,
    rounds: $('#rounds').value,
    arcade: $('#arcade').checked,
    words: $('#words').value,
    sound: $('#sound').checked,
    voice: $('#voice').value,
    characterVoices: $('#characterVoices').checked,
    camera: $('#camera').checked,
    skills: [...document.querySelectorAll('[data-skill]')].map(el => `${el.dataset.skill}:${el.value}`),
    race: [...document.querySelectorAll('[data-race]')].map(el => `${el.dataset.race}:${el.checked ? 1 : 0}`).join(','),
    rally: [...document.querySelectorAll('[data-rally]')].map(el => `${el.dataset.rally}:${el.checked ? 1 : 0}`).join(','),
    rallySpan: $('#rallySpan').value,
    sprite: document.querySelector('[data-sprite].selected')?.dataset.sprite || ''
  });
}
function paintStats() {
  const x = data.profiles[+$('#editProfile').value];
  document.querySelectorAll('[data-skill]').forEach(el => {
    el.closest('.skill-setting').querySelector('[data-stat]').textContent = skillStatText(x, el.dataset.skill, +el.value);
  });
}
function loadForm() {
  loadingForm = true;
  const x = data.profiles[+$('#editProfile').value];
  $('#name').value = x.name;
  $('#stage').value = stageOf(x, +$('#editProfile').value);
  $('#level').value = x.level;
  $('#rounds').value = x.rounds;
  $('#arcade').checked = !!x.arcade;
  $('#words').value = x.words.join(', ');
  $('#sound').checked = data.sound;
  $('#voice').value = knownVoice(data.voice);
  $('#characterVoices').checked = !!data.characterVoices;
  paintVoiceStatus(getSpeechStatus());
  $('#camera').checked = !!data.camera;
  paintSheet();
  $('#error').textContent = '';
  $('#skillSettings').innerHTML = games.filter(([id]) => !sidecarGame(id)).map(([id, name]) => {
    const lv = x.levels?.[id] || x.level;
    return `<div class="skill-setting"><label>${name}<select data-skill="${id}">${[1, 2, 3].map(n => `<option value="${n}" ${n === +lv ? 'selected' : ''}>Level ${n}</option>`).join('')}</select></label><span data-stat>${esc(skillStatText(x, id, +lv))}</span></div>`;
  }).join('');
  document.querySelectorAll('[data-skill]').forEach(el => { el.onchange = paintStats; });
  const picked = new Set(raceKinds(x.race));
  document.querySelectorAll('[data-race]').forEach(el => { el.checked = picked.has(el.dataset.race); });
  const rally = rallyPrefs(x);
  document.querySelectorAll('[data-rally]').forEach(el => { el.checked = !!rally[el.dataset.rally]; });
  $('#rallySpan').value = rally.span;
  const sprite = profileSprite(x, +$('#editProfile').value);
  const pick = $('#spritePick');
  if (pick) {
    pick.innerHTML = SPRITES.map(kind => `<button type="button" class="sprite-choice${kind === sprite ? ' selected' : ''}" data-sprite="${kind}" aria-pressed="${kind === sprite}" aria-label="${kind}">${spriteHtml(kind)}</button>`).join('');
    pick.querySelectorAll('[data-sprite]').forEach(btn => {
      btn.onclick = () => {
        pick.querySelectorAll('[data-sprite]').forEach(el => {
          const on = el === btn;
          el.classList.toggle('selected', on);
          el.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      };
    });
  }
  const remove = $('#removeLearner');
  if (remove) remove.disabled = data.profiles.length < 2;
  const add = $('#addLearner');
  if (add) add.disabled = data.profiles.length >= LEARNER_LIMIT;
  cleanSnapshot = formSnapshot();
  loadingForm = false;
}
function applyForm() {
  const { words } = parseWords($('#words').value);
  const x = data.profiles[+$('#editProfile').value];
  const sprite = document.querySelector('[data-sprite].selected')?.dataset.sprite;
  Object.assign(x, { name: $('#name').value.trim(), stage: $('#stage').value, level: +$('#level').value, rounds: roundCount($('#rounds').value), arcade: $('#arcade').checked, words, sprite: profileSprite({ sprite }, +$('#editProfile').value) });
  x.levels = Object.fromEntries([...document.querySelectorAll('[data-skill]')].map(el => [el.dataset.skill, +el.value]));
  x.race = Object.fromEntries([...document.querySelectorAll('[data-race]')].map(el => [el.dataset.race, el.checked]));
  x.rally = {
    spell: !!document.querySelector('[data-rally="spell"]')?.checked,
    match: !!document.querySelector('[data-rally="match"]')?.checked,
    math: !!document.querySelector('[data-rally="math"]')?.checked,
    span: ['single', 'twelves', 'wide'].includes($('#rallySpan').value) ? $('#rallySpan').value : 'twelves'
  };
  data.sound = $('#sound').checked;
  data.voice = knownVoice($('#voice').value);
  data.characterVoices = $('#characterVoices').checked;
  data.camera = $('#camera').checked;
  data.active = +$('#editProfile').value;
  save();
  cleanSnapshot = formSnapshot();
}
function ask(title, text, okLabel, opts = {}) {
  askYesOnCancel = !!opts.keep;
  $('#confirmTitle').textContent = title;
  $('#confirmText').textContent = text;
  $('#confirmOk').textContent = opts.keep ? 'Keep playing' : okLabel;
  $('#confirmCancel').textContent = opts.keep ? okLabel : 'Go back';
  $('#confirm').showModal();
  return new Promise(resolve => { askResolve = resolve; });
}
function withGrownup(next) {
  if (grownupOk) { next(); return; }
  showGate(next);
}
function showGate(next) {
  const q = gateQuestion();
  gateAnswer = q.answer;
  gateNext = next;
  stopSpeech();
  $('#gateLabel').textContent = q.text;
  $('#gateAnswer').value = '';
  $('#gateError').textContent = '';
  $('#gate').showModal();
  $('#gateAnswer').focus();
}
function settleAsk(ok) {
  if ($('#confirm').open) $('#confirm').close();
  const resolve = askResolve;
  askResolve = null;
  resolve?.(ok);
}
async function closeSettings() {
  if (formSnapshot() !== cleanSnapshot) {
    const ok = await ask('Discard these changes?', 'Your edits will not be saved.', 'Discard');
    if (!ok) return;
  }
  stopSpeech();
  $('#settings').close();
}
function fillLearners(index = data.active) {
  loadingForm = true;
  $('#editProfile').innerHTML = data.profiles.map((x, i) => `<option value="${i}">${esc(x.name)}</option>`).join('');
  $('#editProfile').value = String(index);
  loadingForm = false;
}
function openSettings() {
  $('#gate').close();
  fillLearners(data.active);
  loadForm();
  $('#settings').showModal();
}
async function discardEdits(text) {
  if (formSnapshot() === cleanSnapshot) return true;
  return ask('Discard these changes?', text, 'Discard');
}
async function addLearner() {
  if (data.profiles.length >= LEARNER_LIMIT) {
    $('#error').textContent = 'This device can keep 8 learners. Remove one to add another.';
    return;
  }
  if (!await discardEdits('Adding a learner will drop unsaved edits.')) return;
  data.profiles.push(blankLearner('New learner', nextSprite(data.profiles)));
  data.active = data.profiles.length - 1;
  save();
  fillLearners(data.active);
  loadForm();
  $('#name').focus();
  $('#name').select();
}
async function removeCurrentLearner() {
  if (data.profiles.length < 2) return;
  const index = +$('#editProfile').value;
  const name = data.profiles[index]?.name || 'This learner';
  const ok = await ask('Remove this learner?', `${name} and their stars will be removed from this browser.`, 'Remove learner');
  if (!ok) return;
  data.profiles.splice(index, 1);
  if (data.active > index) data.active -= 1;
  else if (data.active === index) data.active = Math.min(index, data.profiles.length - 1);
  save();
  fillLearners(data.active);
  loadForm();
}

$('#printForm').onsubmit = e => {
  e.preventDefault();
  const chosen = [...document.querySelectorAll('[data-deck]:checked')].map(el => el.dataset.deck);
  const cards = decks().filter(d => chosen.includes(d[0])).flatMap(d => d[3].map(([art, label]) => `<div class="floorcard"><span class="cardart">${art}</span><small>${esc(label)}</small></div>`));
  if (!cards.length) return;
  $('#printArea').innerHTML = cards.join('');
  $('#printDialog').close();
  window.print();
};
$('#printClose').onclick = () => $('#printDialog').close();
$('.brand').onclick = e => { e.preventDefault(); requestHome(); };
$('#parents').onclick = () => {
  const open = () => showGate(openSettings);
  if (!roundActive()) { clearRocketTimer(); open(); return; }
  ask('Leave this round?', 'This round will not be saved.', 'Leave round', { keep: true }).then(ok => {
    if (!ok) return;
    home();
    open();
  });
};
$('#gateCancel').onclick = () => $('#gate').close();
$('#gateForm').onsubmit = e => {
  e.preventDefault();
  if (!gateOk($('#gateAnswer').value, gateAnswer)) {
    $('#gateError').textContent = 'Try that one again.';
    $('#gateAnswer').focus();
    return;
  }
  grownupOk = true;
  const next = gateNext || openSettings;
  $('#gate').close();
  next();
};
$('#editProfile').onchange = async () => {
  if (loadingForm || !cleanSnapshot) return;
  const next = $('#editProfile').value;
  const previous = JSON.parse(cleanSnapshot).profile;
  if (next === previous) return;
  $('#editProfile').value = previous;
  if (formSnapshot() !== cleanSnapshot) {
    const ok = await ask('Discard these changes?', 'Switching learners will drop unsaved edits.', 'Discard');
    if (!ok) return;
  }
  $('#editProfile').value = next;
  loadForm();
};
$('#level').onchange = () => {
  document.querySelectorAll('[data-skill]').forEach(el => { el.value = $('#level').value; });
  paintStats();
};
$('#voice').innerHTML = voices.map(([id, label]) => `<option value="${esc(id)}">${esc(label)}</option>`).join('');
async function hearWith(button, lines) {
  const label = button.textContent;
  const ready = n => { button.textContent = n ? `Getting the voice ready… ${Math.round(n * 100)}%` : 'Getting the voice ready…'; };
  document.querySelectorAll('.voice-preview').forEach(b => { b.disabled = true; });
  ready(0);
  try {
    await prepareSpeech({ onProgress: ready });
    button.textContent = 'Playing…';
    for (const [text, voiceId] of lines()) {
      const { status } = await speakAndWait(text, { voiceId, fallback: 'on-error' });
      if (status !== 'completed') break;
    }
  } finally {
    document.querySelectorAll('.voice-preview').forEach(b => { b.disabled = false; });
    button.textContent = label;
  }
}
$('#hearVoice').onclick = () => hearWith($('#hearVoice'), () => [[sampleLine, $('#voice').value]]);
$('#hearHosts').onclick = () => hearWith($('#hearHosts'), () => Object.entries(profiles).map(([id, role]) => [`${role.label}. ${role.line}`, voiceFor(id, $('#voice').value, $('#characterVoices').checked)]));
function paintVoiceStatus(s) {
  const el = $('#voiceStatus');
  if (!el) return;
  const pct = Math.round((s.progress || 0) * 100);
  el.textContent = {
    unsupported: 'This browser cannot run the voice here, so the browser’s own voice reads aloud.',
    idle: 'The voice downloads the first time read-aloud is used.',
    loading: pct ? `Getting the voice ready… ${pct}%` : 'Getting the voice ready…',
    ready: 'The voice is ready on this device.',
    failed: s.retryIn != null
      ? 'The voice could not load yet. The browser’s own voice reads aloud until it does.'
      : 'The voice could not load. The browser’s own voice reads aloud. Tap Hear this voice to try again.'
  }[s.engine] || '';
}
onSpeechStatus(paintVoiceStatus);
function paintSheet() {
  const el = $('#sheetStatus');
  if (!el) return;
  const sheet = data.sheet;
  if (!sheet) { el.textContent = 'Checking the question sheet…'; return; }
  if (sheet.error && !sheet.rows?.length) { el.textContent = sheet.error; return; }
  if (sheet.note === 'columns') { el.textContent = 'The question sheet needs columns named learner, game, item, and extra.'; return; }
  if (sheet.note === 'empty' || !sheet.rows?.length) { el.textContent = 'No question rows yet. The default sheet and the Google Sheet were both empty.'; return; }
  const counts = {};
  for (const row of sheet.rows) counts[row.game] = (counts[row.game] || 0) + 1;
  const summary = Object.entries(counts).map(([game, n]) => `${n} ${game}`).join(', ');
  const replaced = sheet.games?.length ? `The Google Sheet replaced ${sheet.games.join(', ')}. ` : 'Using the default sheet. ';
  const stale = sheet.error ? ` ${sheet.error}` : '';
  el.textContent = `${replaced}${sheet.rows.length} items (${summary}) stay on this device until you reload.${stale}`;
}
async function loadLocalSheet() {
  if (data.sheet?.rows?.length) { paintSheet(); return; }
  let base = { rows: [], note: 'empty' };
  try {
    const local = await fetch('./sheet.csv?v=word-band', { cache: 'no-store' });
    if (local.ok) base = parseSheet(await local.text());
  } catch { /* the default file is missing */ }
  data.sheet = { at: Date.now(), rows: base.rows, note: base.note, games: [], error: '' };
  if (base.rows.length) save();
  paintSheet();
}
async function loadSheet() {
  const el = $('#sheetStatus');
  if (el) el.textContent = 'Checking the question sheet…';
  let base = { rows: [], note: 'empty' };
  try {
    const local = await fetch('./sheet.csv?v=word-band', { cache: 'no-store' });
    if (local.ok) base = parseSheet(await local.text());
  } catch { /* the default file is missing; the Google Sheet can still supply rows */ }
  let remote = { rows: [], note: 'empty' };
  let error = '';
  try {
    const res = await fetch(SHEET_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    remote = parseSheet(await res.text());
  } catch {
    error = 'The Google Sheet could not be loaded. Games are using the default sheet.';
  }
  const merged = mergeSheets(base, remote);
  data.sheet = { at: Date.now(), rows: merged.rows, note: merged.note, games: merged.games, error };
  if (merged.rows.length || !error) save();
  paintSheet();
}
$('#reloadSheet').onclick = () => loadSheet();
$('#close').onclick = () => closeSettings();
$('#addLearner').onclick = () => addLearner();
$('#removeLearner').onclick = () => removeCurrentLearner();
$('#printOpen').onclick = openPrint;
$('#resetProgress').onclick = async () => {
  const x = data.profiles[+$('#editProfile').value];
  const ok = await ask('Reset progress?', `Stars and scores for ${x.name} will be cleared. The name, levels, and words stay.`, 'Reset progress');
  if (!ok) return;
  Object.assign(x, resetProgress(x));
  save();
  loadForm();
};
$('#confirmForm').onsubmit = e => { e.preventDefault(); settleAsk(!askYesOnCancel); };
$('#confirmCancel').onclick = () => settleAsk(askYesOnCancel);
$('#parentForm').onsubmit = async e => {
  e.preventDefault();
  const parsed = parseWords($('#words').value);
  if (!$('#name').value.trim() || !parsed.ok) {
    $('#error').textContent = 'Add a name and at least 3 different words. Use letters only, with at most one apostrophe, up to 12 letters.';
    return;
  }
  if (![...document.querySelectorAll('[data-race]')].some(el => el.checked)) {
    $('#error').textContent = 'Choose at least one Gas race topic: math facts, sight words, shapes, or colors.';
    return;
  }
  if (![...document.querySelectorAll('[data-rally]')].some(el => el.checked)) {
    $('#error').textContent = 'Choose at least one Backroad rally question: spelling, match, or math facts.';
    return;
  }
  if (roundActive()) {
    const ok = await ask('Leave this round?', 'Saving will end the round in progress. Stars for this round will not be added.', 'Save and leave');
    if (!ok) return;
  }
  applyForm();
  $('#settings').close();
  home();
};
$('#creditsOpen').onclick = () => $('#credits').showModal();
$('#creditsClose').onclick = () => $('#credits').close();
loadSheet();
findBuiltSidecars().then(() => home());
