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
  parseSheet,
  parseWords,
  pathPrompt,
  pathQuestion,
  progressKey,
  resetProgress,
  rocketSubject,
  roundsSentence,
  skillState,
  skillStatText,
  stageLabel,
  stageOf,
  starChip,
  laneCount
} from './logic.mjs?v=rocket';
import { canSpeak, knownVoice, sampleLine, speak, stop, voices, warm } from './speech.js?v=stable-voice';
import { mountCatch, mountLanes, mountRocket, pokeRocket, stopArcade } from './arcade.js?v=play';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const defaults = () => ({
  active: 0,
  sound: true,
  voice: 'af_heart',
  camera: false,
  profiles: [
    { name: 'Learner 1', stage: 'preschool', level: 1, rounds: 5, style: 'tap', words: ['I', 'a', 'the', 'my', 'see'], stars: 0, sessions: 0, correct: 0, total: 0 },
    { name: 'Learner 2', stage: 'kindergarten', level: 2, rounds: 5, style: 'tap', words: ['I', 'a', 'the', 'my', 'see'], stars: 0, sessions: 0, correct: 0, total: 0, levels: { count: 2, path: 2 } },
    { name: 'Learner 3', stage: 'grade4', level: 3, rounds: 5, style: 'tap', words: ['I', 'a', 'the', 'my', 'see'], stars: 0, sessions: 0, correct: 0, total: 0, levels: { count: 3, path: 3 } }
  ]
});

let data;
try {
  data = JSON.parse(localStorage.getItem('sprouts-v1'));
  if (!data?.profiles?.length) data = defaults();
} catch {
  data = defaults();
}
data.profiles.forEach((profile, i) => { profile.stage = stageOf(profile, i); });
data.voice = knownVoice(data.voice);
if (data.sheet && !Array.isArray(data.sheet.rows)) delete data.sheet;
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQdhKSZBII7leKaxTQ6mRPG0Q6POsFtOrCADtNIFDl6yrlnPoCXLXaUCsGvzzNIZPodTxfOHnAjP5MQ/pub?output=csv';
let game = null, storageOK = true, camera = null, cleanSnapshot = '', askResolve = null, loadingForm = false;
let moreOpen = false, grownupOk = false, gateNext = null, gateAnswer = 0, askYesOnCancel = false, coverTimer = 0;
const p = () => data.profiles[data.active];
const band = () => stageOf(p(), data.active);

function save() {
  try { localStorage.setItem('sprouts-v1', JSON.stringify(data)); }
  catch { storageOK = false; }
}

const colors = [['red', '#dc6253'], ['blue', '#538cbf'], ['yellow', '#f5d400'], ['green', '#76a265'], ['orange', '#e99d4d'], ['purple', '#a381c0'], ['pink', '#e5a2bd'], ['brown', '#9a7153'], ['black', '#343c3a'], ['white', '#ffffff']];
const shapes = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'diamond', 'star', 'hexagon'];
const games = [['shapes', 'Shape safari', 'Find circles, triangles & more.', '◒', '#edf0df', 'SHAPES'], ['colors', 'Color garden', 'Pick a color. Grow your skills.', '✿', '#f9e6dc', 'COLORS'], ['mix', 'Jump to it!', 'Match a shape and its color.', '◆', '#e4edf4', 'MIX & MATCH'], ['missing', 'What’s missing?', 'A little look. A big memory!', '☁', '#eee7f5', 'MEMORY'], ['words', 'Word parking', 'Drive into a new sight word.', '🚙', '#fcf0d5', 'READING'], ['build', 'Build a word', 'Little letters, big discoveries.', 'abc', '#e3eee7', 'LETTERS'], ['count', 'Count & clap', 'Count it, jump it, clap it.', '🍎', '#fbe9e3', 'COUNTING'], ['path', 'Number path', 'Hop along the numbers.', '🐸', '#e6efe9', 'NUMBERS'], ['catch', 'Catch the answer', 'Grab the right number as it falls.', '🧺', '#fbe9e3', 'MATH'], ['lanes', 'Word lanes', 'Steer into the word you hear.', '🚗', '#fcf0d5', 'READING'], ['rocket', 'Rocket climb', 'Answer before the fuel runs out.', '🚀', '#e7f1f6', 'WORDS + MATH']];
const countItems = [['🍎', 'apples'], ['⭐', 'stars'], ['🐞', 'ladybugs'], ['🌼', 'flowers'], ['🐟', 'fish'], ['🎈', 'balloons']];
const huntThings = [['sock', 'socks'], ['spoon', 'spoons'], ['toy', 'toys'], ['book', 'books'], ['block', 'blocks'], ['crayon', 'crayons']];
const styles = [['tap', '👆', 'Tap', 'Tap the answer on the screen.'], ['move', '🦘', 'Move', 'Spread floor cards out. The game calls the moves and a grown-up taps ✓.'], ['hunt', '🔎', 'Hunt', 'Find real things around you. A grown-up taps ✓. What’s missing? plays as Move.'], ['reach', '📷', 'Reach', 'Stand back so the camera sees shoulders and hands. Hold one hand on an answer until it fills. Video stays on this device and is never recorded.']];
const moves = [['Hop like a bunny', '🐰'], ['Stomp like an elephant', '🐘'], ['Tiptoe like a mouse', '🐭'], ['Waddle like a penguin', '🐧'], ['Gallop like a horse', '🐴'], ['Crawl like a turtle', '🐢'], ['Leap like a frog', '🐸']];
const breaks = ['Run to the door and back!', 'Spin around three times!', 'Do five big jumps!', 'March in a circle and come back!'];
const listen = {
  words: { tap: 'Listen, then park your car.', move: 'Listen, then drive to the word.', hunt: 'Listen, then find the word.' },
  build: { tap: 'Listen, then build the word.', move: 'Listen, then collect the letters.', hunt: 'Listen, then find the letters.' },
  lanes: { tap: 'Listen, then drive to the word.', move: 'Listen, then drive to the word.', hunt: 'Listen, then drive to the word.' },
  rocket: { tap: 'Listen, then pick the word.', move: 'Listen, then pick the word.', hunt: 'Listen, then pick the word.' }
};
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
function sheetRows(game) {
  const name = p().name.trim().toLowerCase();
  return (data.sheet?.rows || []).filter(r => r.game === game && (r.learner === '*' || r.learner.toLowerCase() === name));
}
function wordList() {
  const parsed = parseWords(sheetRows('words').map(r => r.item).join(','));
  return parsed.ok ? parsed.words : p().words;
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
  const nums = [...new Set(sheetRows('facts').map(r => Number(r.item)).filter(n => Number.isInteger(n) && n >= 2 && n <= 12))];
  return nums.length ? nums : null;
}
const mixDeck = l => {
  const { ss, cs } = pools(l);
  return ss.flatMap((s, i) => [cs[i % cs.length], cs[(i + 2) % cs.length]].map(c => `${c[0]} ${s}`));
};
const roundActive = () => !!(game && !game.finished);

function say(t) {
  if (data.sound) speak(t, data.voice);
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
function recommended() {
  return [...games].sort((a, b) => {
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
  return `<section class="stylebar"><div><small>HOW ARE WE PLAYING?</small><div class="styles">${styles.filter(s => s[0] !== 'reach' || data.camera).map(([id, icon, label]) => `<button class="stylebtn ${id === cur ? 'selected' : ''}" data-style="${id}" aria-pressed="${id === cur}"><span aria-hidden="true">${icon}</span> ${label}</button>`).join('')}</div><p>${info[3]}${cur === 'move' ? ' Clear a space, use bare feet or grippy socks, and stay close.' : ''}</p></div>${cur === 'move' ? '<button class="quiet" id="printCards"><span aria-hidden="true">🖨</span> Print floor cards</button>' : ''}</section>`;
}
function featuredIds() {
  return band() === 'grade4' ? ['count', 'path', 'words', 'shapes'] : ['shapes', 'colors', 'words', 'count'];
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
function clearCover() {
  clearTimeout(coverTimer);
  coverTimer = 0;
}
function home(focus) {
  clearCover();
  stopArcade();
  game = null;
  camOff();
  stopSpeech();
  const learner = p();
  const avatar = ['🦊', '🐻', '🐰'][data.active] || '🌱';
  const hello = `Hi, ${learner.name}. Tap a picture to play.`;
  const featured = featuredIds();
  const rest = games.map(g => g[0]).filter(id => !featured.includes(id));
  $('#app').innerHTML = `<div class="learnerbar"><div class="profiles"><span class="profile selected"><span class="avatar" aria-hidden="true">${avatar}</span><span>${esc(learner.name)}</span></span></div><div class="stars"><span aria-hidden="true">⭐</span> ${esc(starChip(learner))}</div></div><section class="hero"><div><h1>Hi, ${esc(learner.name)}.<br><em>Tap a picture to play.</em></h1></div><div class="garden" aria-hidden="true"><div class="sun">◡</div><div class="hill"></div><div class="sprout"><div class="leaf"></div><div class="leaf two"></div></div><div class="buddy">◡</div><div class="buddy blue">◡</div></div></section><div class="sectionhead"><h2>What shall we play?</h2></div>${styleBar()}${pathPanel()}<section class="games">${featured.map(gameCard).join('')}</section><button class="quiet" id="moreGames" aria-expanded="${moreOpen}">More games</button><section class="games" id="moreList"${moreOpen ? '' : ' hidden'}>${rest.map(gameCard).join('')}</section><div class="bottom-note"><span style="font-size:25px" aria-hidden="true">🌱</span><div><b>Growing at their own pace.</b> ${learner.sessions ? esc(roundsSentence(learner)) : 'Most games wait for you. Rocket climb keeps rising until the fuel runs out.'}<br>Adjust levels, word lists, and the question sheet in Parent corner.${storageOK ? '' : ' Saving is unavailable in this browser.'}</div></div>`;
  document.querySelectorAll('[data-style]').forEach(b => b.onclick = () => { p().style = b.dataset.style; save(); home('style'); });
  if ($('#printCards')) $('#printCards').onclick = openPrint;
  document.querySelectorAll('[data-game]').forEach(b => b.onclick = () => start(b.dataset.game));
  $('#moreGames').onclick = () => { moreOpen = !moreOpen; home('more'); };
  focusHeading();
  if (data.sound) warm(data.voice);
  if (data.sound && focus !== 'style' && focus !== 'more') say(hello);
}
function requestHome() {
  if (!roundActive()) { home(); return; }
  ask('Leave this round?', 'This round will not be saved.', 'Leave round', { keep: true }).then(ok => { if (ok) home(); });
}
function start(mode) {
  const style = styleOf(mode);
  game = { mode, style, key: keyFor(style, skillLevel(mode)), index: 0, firstCorrect: 0, missed: false, done: false, finished: false };
  question();
}
function question() {
  const g = game;
  g.missed = false;
  g.done = false;
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
    g.prompt = g.mode === 'words' ? `Park on the word ${g.target}.` : `Build the word ${g.target}.`;
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
    g.prompt = `Drive to the word ${g.target}.`;
    g.options = shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, count - 1)).concat(g.target);
    g.speed = [0.14, 0.2, 0.28][l - 1];
    g.render = x => esc(x);
    g.phase = 'ready';
  }
  if (g.mode === 'rocket') {
    g.subject = rocketSubject(g.index);
    g.seconds = fuelSeconds(l);
    g.step = 1 / Math.max(1, +p().rounds);
    if (g.altitude == null) g.altitude = 0;
    if (g.subject === 'words') {
      const words = wordList();
      const count = laneCount(l, words.length);
      g.math = null;
      g.target = pick(words);
      g.prompt = `Fuel the rocket with the word ${g.target}.`;
      g.options = shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, count - 1)).concat(g.target);
      g.render = x => esc(x);
    } else loadScreenMath(g, l);
  }
  hybrid(g);
  g.options = shuffle(g.options);
  renderGame();
  say(g.prompt);
}
function loadScreenMath(g, l) {
  const stage = band();
  const [item, name] = pick(countPool());
  const usePath = stage !== 'grade4' && Math.random() < 0.5;
  const q = usePath ? pathQuestion(stage, l, Math.random, factPool()) : countQuestion(stage, l, 'tap', Math.random, factPool());
  g.math = q;
  g.target = q.target;
  g.countName = name;
  g.prompt = q.kind === 'count' ? `How many ${name}? Count them!` : q.question;
  const count = [3, 4, 5][l - 1];
  const rest = shuffle(choicesFor(q, count).filter(x => String(x) !== String(q.target)));
  g.options = [...rest.slice(0, count - 1), q.target];
  g.render = x => String(x);
  if (q.show === 'array') g.show = `<div class="countrow array" style="--cols:${q.cols}" role="img" aria-label="${q.rows} rows of ${q.cols}">${Array(q.target).fill(`<span>${item}</span>`).join('')}</div>`;
  else if (q.kind === 'count') g.show = `<div class="countrow" role="img" aria-label="${esc(name)} to count">${Array(g.target).fill(`<span>${item}</span>`).join('')}</div>`;
  else if (q.strip) g.show = `<div class="numpath" aria-hidden="true">${[...q.strip, '?'].map(x => `<span${x === '?' ? ' class="here"' : ''}>${x}</span>`).join('')}</div>`;
  else if (q.floor && q.hi <= 20 && q.kind !== 'find' && q.kind !== 'more') {
    const mark = q.a;
    g.show = `<div class="numpath" aria-hidden="true">${numberRange(q.lo, q.hi).map(x => `<span${x === mark ? ' class="here"' : ''}>${x}</span>`).join('')}</div>`;
  }
}
function hybrid(g) {
  if (g.mode === 'catch' || g.mode === 'lanes' || g.mode === 'rocket') return;
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
  if (g.mode === 'rocket') return g.subject === 'words';
  return !!listen[g.mode];
}
const heading = g => {
  if (!wordHidden(g)) return g.prompt;
  if (g.mode === 'rocket') return listen.rocket.tap;
  return listen[g.mode][g.style === 'reach' ? 'tap' : g.style];
};
function foundLine(g) {
  const t = g.target;
  if (g.mode === 'colors') return `Yes. That is ${t}.`;
  if (g.mode === 'shapes' || g.mode === 'missing' || g.mode === 'mix') return `Yes. That is a ${t}.`;
  if (g.math?.kind === 'count' && g.countName) return `Yes. ${t} ${g.countName}.`;
  return `Yes. ${t}.`;
}
function strategyHint(g) {
  if (g.mode === 'build') return 'Say the word, then find the next letter.';
  if (g.mode === 'words' || g.mode === 'lanes' || (g.mode === 'rocket' && g.subject === 'words')) return 'Listen for the word, then find it.';
  if (g.mode === 'colors') return 'Look at the colors.';
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
    build: `Ask: what sound does “${t[0]}” make?`
  }[g.mode];
}
function camStage(zones = '') {
  return `<div class="camstage"><video playsinline muted autoplay></video>${zones ? `<div class="choices camzones">${zones}</div>` : ''}<span class="hand" hidden></span><span class="hand" hidden></span><p class="camstatus" id="camstatus"></p></div><p class="hint">Hold one hand on an answer until it fills. Raise both hands to go on.</p>`;
}
function renderGame() {
  stopArcade();
  const g = game;
  if (!g) return;
  const screen = g.mode === 'catch' || g.mode === 'lanes';
  const rocket = g.mode === 'rocket';
  const arcade = screen || rocket;
  const reach = g.style === 'reach', phys = !arcade && (g.style === 'move' || g.style === 'hunt'), zone = reach ? ' data-zone' : '';
  const picks = screen ? '' : g.mode === 'build'
    ? g.letters.map((x, i) => `<button class="choice letter" data-letter="${i}"${zone}>${esc(x)}</button>`).join('')
    : g.options.map((x, i) => `<button class="choice" data-option="${i}" aria-label="${esc(String(x))}"${zone}>${g.render(x)}</button>`).join('');
  const slots = g.mode === 'build' ? `<div class="wordslots"><span id="built" aria-live="polite">${blanks(g.built, g.target)}</span></div>` : '';
  const clear = g.mode === 'build' ? '<button class="quiet" id="clear">Start word again</button>' : '';
  let body;
  const howTo = g.mode === 'catch' ? 'Slide the basket under the number.' : 'Drive to the word.';
  if (rocket) body = `<div id="arcade"></div><div class="choices">${picks}</div>`;
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
  else if (reach) body = `${slots}${camStage(picks)}${clear}`;
  else body = g.mode === 'build' ? `${slots}<div class="choices">${picks}</div>${clear}` : `<div class="choices">${picks}</div>`;
  const memory = g.mode === 'missing' && g.phase !== 'away'
    ? `<div class="memoryrow">${g.memory.map(s => {
      if (g.phase === 'cover') return '<span class="shape covered" aria-hidden="true"></span>';
      return g.phase === 'remember' || s !== g.target ? shape(s, '#8fac73', true) : '<span class="shape missing" role="img" aria-label="Missing shape">?</span>';
    }).join('')}</div>`
    : '';
  const rounds = +p().rounds;
  const reveal = wordHidden(g) ? '<button class="quiet" id="reveal" aria-label="Show the word"><span aria-hidden="true">👁</span></button>' : '';
  $('#app').innerHTML = `<div class="playtop"><button class="quiet" id="back">← All games</button><b>${esc(g.title)}</b><span>${g.index + 1} / ${rounds}</span></div><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${rounds}" aria-valuenow="${g.index}" aria-label="Questions completed"><div style="width:${g.index / rounds * 100}%"></div></div><section class="playarea"><h1>${esc(heading(g))}</h1><button class="speaker" id="listen"><span aria-hidden="true">🔈</span> Hear it again</button>${reveal}${memory}${g.show}${body}<p class="feedback" id="feedback" aria-live="polite"></p><button class="primary" id="next" data-camera-go hidden>${g.index + 1 === rounds ? 'See my stars ★' : 'Next adventure →'}</button></section>`;
  $('#back').onclick = requestHome;
  $('#listen').onclick = () => say(g.prompt);
  if ($('#reveal')) $('#reveal').onclick = () => {
    g.shown = true;
    const title = $('#app h1');
    if (title) title.textContent = g.prompt;
    $('#reveal').hidden = true;
  };
  if ($('#arm')) $('#arm').onclick = () => {
    g.phase = 'play';
    renderGame();
    say(howTo);
  };
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
  document.querySelectorAll('[data-option]').forEach(b => b.onclick = () => answer(g.options[+b.dataset.option] === g.target, b));
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
  if ($('#clear')) $('#clear').onclick = () => { if (!g.done) { g.built = ''; renderGame(); } };
  $('#next').onclick = () => { g.index++; if (g.index >= rounds) finish(); else question(); };
  if (reach && !arcade) cam();
  if (screen && g.phase !== 'ready') {
    const mount = g.mode === 'catch' ? mountCatch : mountLanes;
    mount($('#arcade'), {
      prompt: g.prompt,
      choices: g.options,
      target: g.target,
      speed: g.speed,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onMiss() {
        g.missed = true;
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = 'Keep exploring. Try another one!';
        say('Try another one.');
        showHint();
      },
      onDone(clean) {
        if (!clean) g.missed = true;
        answer(true);
      }
    });
  }
  if (rocket) {
    mountRocket($('#arcade'), {
      altitude: g.altitude || 0,
      step: g.step,
      seconds: g.seconds,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onAltitude(next) { g.altitude = next; },
      onEmpty() {
        g.missed = true;
        const feedback = $('#feedback');
        if (feedback) feedback.textContent = 'The fuel ran out. Try again!';
        say('The fuel ran out. Try again.');
        showHint();
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
    const hint = grade4 ? mathHint(g.math, hintMode(g)) : (g.math ? mathHint(g.math, hintMode(g)) : (g.mode === 'build' ? `The next letter is ${g.target[g.built.length]}.` : `Look for ${g.target}.`));
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
function answer(ok, b) {
  const g = game;
  if (g.done) return;
  if (!ok) {
    g.missed = true;
    if (b?.classList.contains('choice')) {
      b.classList.add('wrong');
      b.disabled = true;
    }
    if (g.mode === 'rocket' && pokeRocket('burn')) return;
    $('#feedback').textContent = 'Keep exploring. Try another one!';
    say('Try another one.');
    showHint();
    return;
  }
  g.done = true;
  if (g.mode === 'rocket') pokeRocket('boost');
  $('#help')?.remove();
  if (!g.missed) g.firstCorrect++;
  const found = foundLine(g);
  $('#feedback').textContent = found;
  say(found);
  if (b?.classList.contains('choice')) b.classList.add('correct');
  if ((g.style === 'move' || g.style === 'hunt') && g.mode !== 'catch' && g.mode !== 'lanes' && g.mode !== 'rocket') $('#feedback').insertAdjacentHTML('afterend', `<p class="hint">Grown-up: ${esc(tip(g))}</p>`);
  $('#next').hidden = false;
  document.querySelectorAll('.choice,.confirm,.steer-btn').forEach(x => { x.disabled = true; });
  $('#next').focus();
}
function finish() {
  stopArcade();
  const g = game;
  g.finished = true;
  camOff();
  const rounds = +p().rounds;
  Object.assign(p(), applyRound(p(), g.mode, g.key, rounds, g.firstCorrect));
  save();
  const dots = Array.from({ length: rounds }, (_, i) => `<span class="${i < g.firstCorrect ? 'on' : ''}"></span>`).join('');
  $('#app').innerHTML = `<section class="playarea"><div class="result-star" aria-hidden="true">🌟</div><h1>You played ${rounds}.</h1><p>First try</p><div class="dots" aria-label="${g.firstCorrect} of ${rounds} first tries">${dots}</div><p class="hint">+${rounds} learning stars</p><button class="primary" id="again">Play again</button> <button class="quiet" id="all">Choose a game</button></section>`;
  $('#again').onclick = () => start(g.mode);
  $('#all').onclick = home;
  say(`You played ${rounds}.`);
  focusHeading();
}
function cam() {
  const status = t => { const el = $('#camstatus'); if (el) el.textContent = t; };
  (camera ??= import('./camera.js?v=reach')).then(m => m.attach($('.camstage'), status)).catch(() => {
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
    words: $('#words').value,
    sound: $('#sound').checked,
    voice: $('#voice').value,
    camera: $('#camera').checked,
    skills: [...document.querySelectorAll('[data-skill]')].map(el => `${el.dataset.skill}:${el.value}`)
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
  $('#words').value = x.words.join(', ');
  $('#sound').checked = data.sound;
  $('#voice').value = knownVoice(data.voice);
  $('#camera').checked = !!data.camera;
  paintSheet();
  $('#error').textContent = '';
  $('#skillSettings').innerHTML = games.map(([id, name]) => {
    const lv = x.levels?.[id] || x.level;
    return `<div class="skill-setting"><label>${name}<select data-skill="${id}">${[1, 2, 3].map(n => `<option value="${n}" ${n === +lv ? 'selected' : ''}>Level ${n}</option>`).join('')}</select></label><span data-stat>${esc(skillStatText(x, id, +lv))}</span></div>`;
  }).join('');
  document.querySelectorAll('[data-skill]').forEach(el => { el.onchange = paintStats; });
  cleanSnapshot = formSnapshot();
  loadingForm = false;
}
function applyForm() {
  const { words } = parseWords($('#words').value);
  const x = data.profiles[+$('#editProfile').value];
  Object.assign(x, { name: $('#name').value.trim(), stage: $('#stage').value, level: +$('#level').value, rounds: +$('#rounds').value, words });
  x.levels = Object.fromEntries([...document.querySelectorAll('[data-skill]')].map(el => [el.dataset.skill, +el.value]));
  data.sound = $('#sound').checked;
  data.voice = knownVoice($('#voice').value);
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
function openSettings() {
  $('#gate').close();
  loadingForm = true;
  $('#editProfile').innerHTML = data.profiles.map((x, i) => `<option value="${i}">${esc(x.name)}</option>`).join('');
  $('#editProfile').value = data.active;
  loadingForm = false;
  loadForm();
  $('#settings').showModal();
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
  if (!roundActive()) { open(); return; }
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
$('#hearVoice').onclick = async () => {
  const button = $('#hearVoice');
  const label = button.textContent;
  button.disabled = true;
  button.textContent = 'Getting the voice ready…';
  try { await speak(sampleLine, $('#voice').value, { full: true }); }
  finally {
    button.disabled = false;
    button.textContent = label;
  }
};
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
    const local = await fetch('./sheet.csv?v=sheet', { cache: 'no-store' });
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
    const local = await fetch('./sheet.csv?v=sheet', { cache: 'no-store' });
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
  if (roundActive()) {
    const ok = await ask('Leave this round?', 'Saving will end the round in progress. Stars for this round will not be added.', 'Save and leave');
    if (!ok) return;
  }
  applyForm();
  $('#settings').close();
  home();
};
loadLocalSheet();
home();
