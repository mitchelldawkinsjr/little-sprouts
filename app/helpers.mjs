import {
  candidateWords,
  factSetFromRows,
  wordsFromSheet,
  progressKey,
  shuffle,
  rocketSubject,
  roundCount,
  stageOf,
  spellingWords,
  wordsFor
} from '../logic.mjs?v=structure4';
import { contextFor, onSpeechStatus, prefetchSpeech, speak, stop, voiceFor } from '../lib/speech.js?v=wait-2s';
import { postSidecar, sidecarRows } from '../lib/sidecar.js?v=hills-free1';
import { $, esc } from './runtime.mjs?v=lean-r2';

export function registerHelpers(rt) {
  Object.assign(rt, {
    save,
    loadBoard,
    saveBoard,
    doublingChain,
    wordList,
    spellList,
    playSubject,
    hidesReading,
    countPool,
    huntPool,
    factPool,
    voiceNow,
    say,
    releaseListen,
    askBeforePlay,
    wordPrompt,
    stopSpeech: stop,
    focusHeading,
    shape,
    swatch,
    skillLevel,
    styleOf,
    record
  });
  const p = () => rt.data.profiles[rt.data.active];
  const questionCount = () => roundCount(p().rounds);
  const band = () => stageOf(p(), rt.data.active);
  function save() {
    try { localStorage.setItem('sprouts-v1', JSON.stringify(rt.data)); }
    catch { rt.storageOK = false; }
  }
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
    catch { rt.storageOK = false; }
  }
  const colors = [['red', '#dc6253'], ['blue', '#538cbf'], ['yellow', '#f5d400'], ['green', '#76a265'], ['orange', '#e99d4d'], ['purple', '#a381c0'], ['pink', '#e5a2bd'], ['brown', '#9a7153'], ['black', '#343c3a'], ['white', '#ffffff']];
  const shapes = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'diamond', 'star', 'hexagon'];
  const games = [['shapes', 'Shape safari', 'Find circles, triangles & more.', '◒', '#edf0df', 'SHAPES'], ['colors', 'Color garden', 'Pick a color. Grow your skills.', '✿', '#f9e6dc', 'COLORS'], ['mix', 'Jump to it!', 'Match a shape and its color.', '◆', '#e4edf4', 'MIX & MATCH'], ['missing', 'What’s missing?', 'A little look. A big memory!', '☁', '#eee7f5', 'MEMORY'], ['words', 'Word parking', 'Drive into a new sight word.', '🚙', '#fcf0d5', 'READING'], ['build', 'Build a word', 'Little letters, big discoveries.', 'abc', '#e3eee7', 'LETTERS'], ['count', 'Count & clap', 'Count it, jump it, clap it.', '🍎', '#fbe9e3', 'COUNTING'], ['path', 'Number path', 'Hop along the numbers.', '🐸', '#e6efe9', 'NUMBERS'], ['catch', 'Catch the answer', 'Grab the right number as it falls.', '🧺', '#fbe9e3', 'MATH'], ['lanes', 'Word lanes', 'Steer into the word you hear.', '🚗', '#fcf0d5', 'READING'], ['rocket', 'Rocket climb', 'Answer in time and fly to space.', '🚀', '#e7f1f6', 'WORDS + MATH'], ['lunar', 'Moon shot', 'Answer, then shoot the freethrow.', '🌙', '#e4eef6', 'SPACE'], ['hoop', 'Shooting hoops', 'Flick the ball through the right hoop.', '🏀', '#f8e6dc', 'HOOPS'], ['light', 'Catch the light', 'Catch the light on the right answer.', '🔆', '#e5f6ea', 'LIGHT'], ['race', 'Gas race', 'Drive to the answer. See who goes furthest.', '⛽', '#f8efd4', 'RACE'], ['hook', 'Hook the fish', 'Steer the hook onto the right fish.', '🎣', '#d7eef5', 'FISHING'], ['sky', 'Sky shot', 'Shoot the rock with the right answer.', '🛸', '#d9e4f2', 'SPACE'], ['planet', 'Planet guard', 'Aim and keep the planet safe.', '🪐', '#d7e6f4', 'SPACE'], ['puzzle', 'Shape puzzle', 'Build the pieces, then tap or say the shape.', '🧩', '#e5f4ef', 'SHAPES'], ['match', 'Pair match', 'Flip cards. Match shapes, colors, numbers, and words.', '🃏', '#f3efe4', 'MEMORY'], ['marble', 'Marble path', 'Shoot one color. Points raise the level.', '🔴', '#fde8e4', 'COLORS'], ['bridge', 'Stick bridge', 'Hold the stick across each gap. Reach the last platform.', '🪵', '#f3ead7', 'WORDS + MATH'], ['maze', 'Tilt maze', 'Tilt to the flag. A right answer adds time.', '🧭', '#e4eef6', 'MAZE'], ['chase', 'Garden chase', 'Eat the berries that match your words, numbers, shapes, and colors.', '🫐', '#e7f0d8', 'MAZE'], ['hop', 'Sprout hop', 'Bounce up the leaves and hop on the right answer.', '🌿', '#e4f2ea', 'JUMP'], ['toast', 'Toast pop', 'Tap the toast with the right answer.', '🍞', '#f8e6c8', 'CATCH'], ['glide', 'Island glide', 'Hold to climb. Let go to dive. Grab the gem with the answer.', '✈', '#d7ebf5', 'FLIGHT'], ['city', 'City glide', 'Slide through downtown and fly through the answer ring.', '🏙', '#d5e4f2', 'FLIGHT'], ['aisle', 'Market walk', 'Tap the arrows to walk the aisles and pick up the right thing.', '🛒', '#f6efe2', 'SHOP'], ['lily', 'Lily cross', 'Hop across the road and the river. Land on the right lily pad.', '🪷', '#d7eef2', 'POND'], ['bust', 'Ghost bust', 'Tap the ghost with the right answer.', '👻', '#e4eee6', 'CATCH'], ['mole', 'Mole pop', 'Tap the mole with the right answer.', '🐹', '#efe4cf', 'HOLES'], ['cube', 'Cube dash', 'Dodge the red cubes. Touch the right one.', '🧊', '#d7eef8', 'DODGE'], ['stack', 'Stacker', 'Tap to drop the blocks. Land the right one on the tower.', '🧱', '#e4eaf2', 'STACK'], ['lamp', 'Light the lamp', 'Set the right stone and light the lamp.', '💡', '#f6ead8', 'LAMP'], ['trace', 'Trace drive', 'Trace the path. A car drives it.', '✎', '#e7f0df', 'TRACE'], ['sort', 'Sort bins', 'Tap a tube. Pour the top balls onto a match or into an empty tube.', '🧪', '#f8efd4', 'SORT'], ['merge', 'Merge jar', 'Drop two that match. Make the next one.', '◎', '#e4eef6', 'MERGE'], ['crayon', 'Color by number', 'Paint each number the color in the legend.', '🖍', '#fde8f0', 'COLORS']].concat(sidecarRows());
  const countItems = [['🍎', 'apples'], ['⭐', 'stars'], ['🐞', 'ladybugs'], ['🌼', 'flowers'], ['🐟', 'fish'], ['🎈', 'balloons']];
  const huntThings = [['sock', 'socks'], ['spoon', 'spoons'], ['toy', 'toys'], ['book', 'books'], ['block', 'blocks'], ['crayon', 'crayons']];
  const styles = [['tap', '👆', 'Tap', 'Tap the answer on the screen.'], ['move', '🦘', 'Move', 'Spread floor cards out. The game calls the moves and a grown-up taps ✓.'], ['hunt', '🔎', 'Hunt', 'Find real things around you. A grown-up taps ✓. What’s missing? plays as Move.'], ['reach', '📷', 'Reach', 'Stand back so the camera sees shoulders and hands. Hold one hand on an answer until it fills. Video stays on this device and is never recorded.']];
  const ARCADE_PLAY = new Set(['bike', 'flight', 'walk', 'lunar', 'hoop', 'light', 'bridge', 'maze', 'chase', 'hop', 'toast', 'glide', 'city', 'aisle', 'lily', 'mole', 'bust', 'stack', 'lamp', 'cube', 'crayon']);
  const moves = [['Hop like a bunny', '🐰'], ['Stomp like an elephant', '🐘'], ['Tiptoe like a mouse', '🐭'], ['Waddle like a penguin', '🐧'], ['Gallop like a horse', '🐴'], ['Crawl like a turtle', '🐢'], ['Leap like a frog', '🐸']];
  const breaks = ['Run to the door and back!', 'Spin around three times!', 'Do five big jumps!', 'March in a circle and come back!'];
  const listen = {
    words: 'Listen, then park your car.',
    build: 'Listen, then build the word.',
    lanes: 'Listen, then drive to the word.',
    rocket: 'Listen, then pick the word.',
    lunar: 'Listen, then pick the word and shoot.',
    hoop: 'Listen, then flick the ball through the right hoop.',
    light: 'Listen, then catch the light.',
    race: 'Listen, then drive to the word.',
    hook: 'Listen, then hook the fish.',
    sky: 'Listen, then shoot the right rock.',
    planet: 'Listen, then shoot the right rock.',
    bridge: 'Answer, then hold to grow the stick.',
    maze: 'Listen, then pick the word to add time.',
    chase: 'Listen, then eat the right berries.',
    hop: 'Bounce up the leaves, then hop on the right one. Falls and wrong landings cost a life.',
    toast: 'Listen, then pop the right toast.',
    glide: 'Listen, then grab the right gem.',
    city: 'Listen, then fly through the right ring.',
    aisle: 'Listen, then find it in the market.',
    lily: 'Listen, then hop to the right flower pot.',
    bust: 'Listen, then bust the ghost with the right answer.',
    mole: 'Listen, then whack the right mole.',
    cube: 'Listen, then touch the right cube.',
    stack: 'Listen, then drop the right block.',
    lamp: 'Listen, then catch the right glow bug.',
    rally: 'Listen, then tap the right answer.',
    bike: 'Listen, then tap the right answer.',
    flight: 'Listen, then fly through the word.',
    walk: 'Listen, then walk to the word.',
    trace: 'Start at the dot and stay on the line.',
    sort: 'Tap a tube, then pour into a match or an empty tube.',
    merge: 'Drop two that match so they touch.'
  };
  // Styles that read differently from the mode's base line above.
  const listenBy = {
    words: { move: 'Listen, then drive to the word.', hunt: 'Listen, then find the word.' },
    build: { move: 'Listen, then collect the letters.', hunt: 'Listen, then find the letters.' },
    lanes: { reach: 'Listen, then step into the word. You have 10 seconds.' },
    hook: { reach: 'Listen, then move your hand onto the fish.' }
  };
  const RACE_LABELS = { facts: 'math facts', words: 'sight words', shapes: 'shapes', colors: 'colors' };
  const BOARD_KEY = 'sprouts-race-board';
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const an = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
  const pools = l => ({ n: [3, 4, 6][l - 1], ss: shapes.slice(0, [3, 5, 8][l - 1]), cs: colors.slice(0, [4, 6, 10][l - 1]) });
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
  function sheetRows(game) {
    const name = p().name.trim().toLowerCase();
    return (rt.data.sheet?.rows || []).filter(r => r.game === game && (r.learner === '*' || r.learner.toLowerCase() === name));
  }
  function wordList() {
    return wordsFor({ words: p().words, rows: rt.data.sheet?.rows, name: p().name, stage: band() });
  }
  function spellList(level) {
    const fromSheet = wordsFromSheet(rt.data.sheet?.rows, p().name, band());
    const words = wordList();
    const manual = fromSheet.length ? fromSheet : p().words;
    return candidateWords(spellingWords(words, band(), manual, level), 'build');
  }
  function playSubject(index) {
    if (band() === 'preschool') return 'math';
    return rocketSubject(index);
  }
  const READING_GAMES = new Set(['words', 'build', 'lanes']);
  function hidesReading(stage = band()) {
    return stage === 'preschool';
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
  const roundActive = () => !!(rt.game && !rt.game.finished);
  function voiceNow(mode = rt.game?.mode) {
    return voiceFor(contextFor(mode), rt.data.voice, rt.data.characterVoices);
  }
  function say(t) {
    if (rt.data.sound) speak(t, voiceNow(), { context: contextFor(rt.game?.mode), queue: true });
  }
  // For a tap on Hear it again: cut in instead of waiting behind the line already playing.
  function sayNow(t) {
    if (rt.data.sound) return speak(t, voiceNow(), { context: contextFor(rt.game?.mode) });
    return Promise.resolve();
  }
  function releaseListen() {
    rt.listenToken += 1;
    document.body.classList.remove('listen-first');
  }
  function askBeforePlay(text) {
    if (!rt.data.sound || !text || rt.game?.finished) return Promise.resolve();
    const token = ++rt.listenToken;
    const line = $('#listenLine');
    if (line) line.textContent = text;
    document.body.classList.add('listen-first');
    prefetchSpeech([{ text, voiceId: voiceNow() }], { priority: 'next' });
    const cap = setTimeout(() => {
      if (token !== rt.listenToken) return;
      document.body.classList.remove('listen-first');
    }, 12000);
    return Promise.resolve(sayNow(text)).finally(() => {
      clearTimeout(cap);
      if (token !== rt.listenToken) return;
      document.body.classList.remove('listen-first');
    });
  }
  window.addEventListener('keydown', event => {
    if (!document.body.classList.contains('listen-first') || event.type !== 'keydown') return;
    if (event.target?.closest?.('#listen, #listenAgain, #listenBack, #back, #tiltToggle')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  document.addEventListener('click', event => {
    if (event.target?.closest?.('#listenAgain')) {
      const again = document.querySelector('#listen');
      if (again) again.click();
      else if (rt.game?.prompt) askBeforePlay(rt.game.prompt);
    }
    if (event.target?.closest?.('#listenBack')) document.querySelector('#back')?.click();
  });
  onSpeechStatus(shot => {
    const now = !!shot.speaking;
    if (now === rt.talking) return;
    rt.talking = now;
    postSidecar({ type: 'duck', on: now });
  });
  function wordPrompt(mode, word, style) {
    if (mode === 'lanes') return style === 'reach' ? `Step into the word ${word}. You have 10 seconds.` : `Drive to the word ${word}.`;
    return mode === 'words' ? `Park on the word ${word}.` : `Build the word ${word}.`;
  }
  const sidecarLines = {
    bike: ['Good.', 'Not yet. The bike speeds up.'],
    rally: ['Yes! Turbo!', 'Not yet. The car slows down.'],
    flight: ['Yes! Through the gate.', 'Not yet. The glider turns back.'],
    walk: ['You found it.', 'Not yet. Walk to another one.']
  };
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
    if (s === 'reach' && !rt.data.camera) s = 'tap';
    if (s === 'hunt' && id === 'missing') s = 'move';
    return s;
  }
  function record(id) {
    return p().skills?.[id]?.[progressKey(styleOf(id), skillLevel(id))] || { total: 0, correct: 0, sessions: 0 };
  }
  Object.assign(rt, {
    p,
    questionCount,
    band,
    colors,
    shapes,
    games,
    styles,
    ARCADE_PLAY,
    moves,
    breaks,
    listen,
    listenBy,
    RACE_LABELS,
    shuffle,
    pick,
    an,
    pools,
    READING_GAMES,
    mixDeck,
    roundActive,
    sidecarLines
  });
}
