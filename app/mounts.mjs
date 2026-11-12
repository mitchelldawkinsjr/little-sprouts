import {
  applyRound,
  blanks,
  choicesFor,
  fuelSeconds,
  mathBlurb,
  mathHint,
  numberRange,
  raceGateSeconds,
  raceKinds,
  raceStandings,
  rocketZone,
  roundsSentence,
  rallyQuestionCount,
  rallyClearCount,
  skillState,
  stageLabel,
  pointBoard,
  profileSprite,
  starChip,
  laneCount,
  spokenShape,
  matchPairs,
  countMax,
  mazeClock,
  toastPace,
  traceBoard,
  sortBoard,
  sortDeal,
  mergeBoard,
  crayonBoard,
  crayonCatalog,
  crayonPicture,
  crayonLegend,
  progressKey,
  nextUpGame,
  clueMatch,
  parseVerseScript,
  needsVerseScriptBuild,
  scriptFromSeed,
  verseSheetRows,
  verseRecall,
  verseWithRef
} from '../logic.mjs?v=offline1';
import { canSpeak, warm } from '../lib/speech.js?v=wait-2s';
import { mountCatch, mountLanes, mountRace, mountRocket, pokeRocket, stopArcade } from '../games/arcade.js?v=ask-first2-r2';
import { mountLunar } from '../games/lunar.js?v=moon-board2';
import { mountHoop, stopHoop } from '../games/hoop.js?v=hoop-trio-r2';
import { lightMarkSlots, mountLight, stopLight } from '../games/light.js?v=light-pace-icons';
import { mountHook, stopHook } from '../games/hook.js?v=ask-first2-r2';
import { mountSky, stopSky } from '../games/sky.js?v=ask-first2-r2';
import { mountPlanet, stopPlanet } from '../games/planet.js?v=sky-rocks2';
import { mountPuzzle, stopPuzzle } from '../games/puzzle.js?v=puzzle-glass';
import { mountMatch, stopMatch } from '../games/match.js?v=pair-match2';
import { mountChase, stopChase } from '../games/chase.js?v=ask-first2-r2';
import { mountHop, stopHop } from '../games/hop.js?v=hop-lives-r1';
import { mountToast, stopToast } from '../games/toast.js?v=ask-first-r2';
import { mountGlide, stopGlide } from '../games/glide.js?v=ask-first-r2';
import { mountCity, stopCity } from '../games/city.js?v=city-glide';
import { mountAisle, stopAisle } from '../games/aisle.js?v=market-aisle2-r2';
import { mountLily, stopLily } from '../games/lily.js?v=ask-first-r2';
import { mountBust, stopBust } from '../games/bust.js?v=ghost-same2-r2';
import { mountMole, stopMole } from '../games/mole.js?v=mole-pop3';
import { mountCube, stopCube } from '../games/cube.js?v=pad-jump';
import { mountStack, stopStack } from '../games/stack.js?v=stack-words-r2';
import { mountLamp, stopLamp } from '../games/lamp.js?v=lamp-r2';
import { mountTrace, stopTrace } from '../games/trace.js?v=trace-car2';
import { mountSort, stopSort } from '../games/sort.js?v=sort-roll';
import { mountMerge, stopMerge } from '../games/merge.js?v=goo-jar2';
import { mountCrayon, stopCrayon } from '../games/crayon.js?v=crayon-more';
import { mountMarble, stopMarble } from '../games/marble.js?v=ask-first2-r2';
import { mountBridge, stopBridge } from '../games/bridge.js?v=ask-first-r2';
import { mountMaze, stopMaze } from '../games/maze.js?v=ask-first-r2';
import {
  mountSidecar,
  postSidecar,
  sidecarAlone,
  sidecarGame,
  sidecarIsBuilt,
  stopSidecar
} from '../lib/sidecar.js?v=hills-free1';
import {
  SHELF_META,
  shelfOf as shelfIdOf,
  gameBlurb as blurbFor,
  howWePlayHtml,
  gameCardHtml,
  shelfChipsHtml,
  shelfPanelHtml,
  starGardenHtml as gardenHtml,
  homePageHtml
} from '../lib/home-ui.mjs?v=offline1';
import { $, esc } from './runtime.mjs?v=lean-r2';
import { ARCADE } from './arcade-modes.mjs?v=city-glide';

const words = list => new Set(list.split(' '));
const SCREEN = words('catch lanes');
const IN_ARENA = words('catch lanes rocket lunar hoop light race hook sky planet puzzle match marble bridge maze chase hop toast glide city aisle lily mole cube bust stack lamp trace sort merge crayon');
const NO_CHOICES = words('catch lanes race hook sky planet puzzle match marble maze chase hop toast trace sort merge');
const HAS_READY = words('hook sky planet marble bridge maze chase hop toast aisle lily mole cube bust stack lamp');
const NO_SCENE = words('rocket race chase hop toast glide city aisle lily mole cube bust stack lamp light');
const SHOW = { race: 'raceShow', light: 'lightShow', hop: 'hopShow', aisle: 'aisleShow', lily: 'lilyShow', mole: 'moleShow', cube: 'cubeShow', stack: 'stackShow', lamp: 'lampShow' };

/** Local calendar day key (YYYY-MM-DD) for once-a-day home greeting. */
function localCalendarDay(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function registerMounts(rt) {
  Object.assign(rt, {
    matchFaces,
    prepareTrace,
    prepareCrayon,
    prepareSort,
    prepareMerge,
    stopLunar,
    clearLight,
    clearTimers,
    laneDriveSpeed,
    continueAfter,
    advanceVerse,
    paintRallyChrome,
    home,
    requestHome,
    start,
    paintAsk,
    starGardenHtml,
    raceBoardHtml,
    raceLabels,
    renderGame,
    showHint,
    paintRocketQuestion,
    resolveRocket,
    stopEars,
    camOff
  });
  function matchFaces(level) {
    const count = matchPairs(level);
    const { ss, cs } = rt.pools(Math.min(3, Math.max(1, level)));
    const hi = countMax(rt.band(), Math.min(3, Math.max(1, level)), 'tap');
    const take = list => rt.shuffle([...list]);
    const groups = [
      take(ss).map(name => ({ id: `shape:${name}`, label: name, html: rt.shape(name, '#5d7a45') })),
      take(cs).map(([name, hex]) => ({ id: `color:${name}`, label: name, html: `${rt.swatch(name, hex)}<span class="match-name">${esc(name)}</span>` })),
      take(numberRange(1, Math.max(1, hi))).map(n => ({ id: `number:${n}`, label: String(n), html: `<b class="match-num">${n}</b>` })),
      ...(rt.band() === 'preschool' ? [] : [take(rt.wordList()).map(word => ({ id: `word:${word}`, label: word, html: `<b class="match-word">${esc(word)}</b>` }))])
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
      return rt.shuffle(rt.pools(rt.skillLevel('colors')).cs).slice(0, count).map(([name, hex]) => ({
        id: name, label: name, fill: hex, html: rt.swatch(name, hex)
      }));
    }
    if (kind === 'shapes') {
      return rt.shuffle(rt.pools(rt.skillLevel('shapes')).ss).slice(0, count).map(name => ({
        id: name, label: name, html: rt.shape(name, '#5d7a45')
      }));
    }
    if (kind === 'words') {
      return rt.shuffle(rt.wordList()).slice(0, count).map(word => ({
        id: word, label: word, html: `<b class="sort-word">${esc(word)}</b>`
      }));
    }
    const hi = countMax(rt.band(), Math.min(3, Math.max(1, rt.skillLevel('count'))), 'tap');
    return rt.shuffle(numberRange(1, Math.max(1, hi))).slice(0, count).map(n => ({
      id: String(n), label: String(n), html: `<b class="sort-num">${n}</b>`
    }));
  }
  function prepareTrace(g, l) {
    const board = traceBoard(l);
    g.board = board;
    g.options = [];
    g.render = x => esc(String(x));
    if (board.kind === 'shape') {
      const names = l >= 2 ? rt.shapes.slice(3) : rt.shapes.slice(0, 3);
      g.traceKind = 'shape';
      g.target = rt.pick(names);
      g.prompt = `Trace the ${g.target}.`;
      return;
    }
    const letters = rt.band() === 'preschool' ? [] : [...rt.pick(rt.wordList()).toLowerCase()].filter(ch => /[a-z]/.test(ch));
    if (g.index % 2 === 1 && letters.length) {
      g.traceKind = 'letter';
      g.target = rt.pick(letters);
      g.prompt = `Trace the letter ${g.target}.`;
      return;
    }
    const hi = Math.min(9, countMax(rt.band(), Math.min(3, Math.max(1, rt.skillLevel('count'))), 'tap'));
    g.traceKind = 'number';
    g.target = String(1 + Math.floor(Math.random() * hi));
    g.prompt = `Trace the number ${g.target}.`;
  }
  function prepareCrayon(g, l) {
    const board = crayonBoard(l);
    g.board = board;
    g.catalog = crayonCatalog(l);
    g.options = [];
    g.render = x => esc(String(x));
    if (g.pageIndex == null) {
      if (g.freePlay) {
        g.phase = 'pick';
        g.picture = null;
        g.legend = [];
        g.swatch = null;
        g.target = 'picture';
        g.prompt = 'Pick a picture to color.';
        return;
      }
      g.pageIndex = g.catalog.length ? g.index % g.catalog.length : 0;
    }
    const picture = crayonPicture(l, g.pageIndex);
    const pool = rt.pools(rt.skillLevel('colors')).cs.filter(([name]) => name !== 'black' && name !== 'white');
    const palette = [];
    const bag = rt.shuffle(pool);
    while (palette.length < board.colors) {
      if (!bag.length) bag.push(...rt.shuffle(pool));
      palette.push(bag.pop());
    }
    const countLevel = Math.min(3, Math.max(1, rt.skillLevel('count')));
    const hi = Math.max(board.colors, countMax(rt.band(), countLevel, 'tap'));
    const numbers = rt.shuffle(numberRange(1, hi)).slice(0, board.colors);
    const legend = crayonLegend(picture.regions.map(region => region.id), palette, numbers);
    const spoken = [...legend].sort((a, b) => a.number - b.number)[0];
    g.phase = 'play';
    g.picture = picture;
    g.legend = legend;
    g.swatch = spoken;
    g.target = picture.name;
    g.prompt = `Paint the ${picture.name}. ${spoken.number} is ${spoken.name}.`;
  }
  function prepareSort(g, l) {
    const board = sortBoard(l);
    g.board = board;
    g.options = [];
    g.render = x => esc(String(x));
    let kind = l >= 3 ? (g.index % 2 ? 'words' : 'numbers') : l === 2 ? (g.index % 2 ? 'shapes' : 'colors') : 'colors';
    if (rt.band() === 'preschool' && kind === 'words') kind = 'numbers';
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
  function prepareMerge(g, l) {
    const board = mergeBoard(l);
    g.board = board;
    g.options = [];
    g.render = x => esc(String(x));
    const stage = rt.band();
    if (stage !== 'grade4' && g.index % 2 === 0) {
      const names = rt.pools(rt.skillLevel('shapes')).ss;
      const name = rt.pick(names);
      const others = rt.shuffle(names.filter(item => item !== name));
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
      g.queue = rt.shuffle(queue);
      return;
    }
    const max = stage === 'grade4' ? 32 : countMax(stage, Math.min(3, Math.max(1, rt.skillLevel('count'))), 'tap');
    const seed = stage === 'grade4' ? 2 + Math.floor(Math.random() * 5) : 1;
    const chain = rt.doublingChain(seed, board.chain, max);
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
    g.queue = rt.shuffle(queue);
  }
  function shelfOf(id) {
    return shelfIdOf(id, sidecarGame(id)?.shelf);
  }
  function listedGames() {
    return rt.games.filter(([id]) => (!rt.hidesReading() || !rt.READING_GAMES.has(id)) && (!sidecarGame(id) || sidecarIsBuilt(id)));
  }
  function recommended() {
    const listed = listedGames();
    const id = nextUpGame(listed.map(g => g[0]), rt.p());
    return listed.find(g => g[0] === id) || listed[0];
  }
  function gameBlurb(gid, desc) {
    return blurbFor(gid, desc, { stage: rt.band(), mathBlurb });
  }
  function howWePlay(open) {
    return howWePlayHtml({
      open,
      styleId: rt.styleOf(''),
      styles: rt.styles,
      cameraOn: rt.data.camera,
      arcadeOn: !!rt.p().arcade
    });
  }
  function gameCard(id, opts = {}) {
    const row = rt.games.find(g => g[0] === id);
    if (!row) return '';
    const [gid, name, desc, icon, tint] = row;
    return gameCardHtml({
      gid,
      name,
      blurb: gameBlurb(gid, desc),
      icon,
      tint,
      stageLabel: stageLabel(rt.band()),
      level: rt.skillLevel(gid),
      state: skillState(rt.record(gid)),
      featured: !!opts.featured,
      next: !!opts.next,
      esc
    });
  }
  function shelfPanel(available, openId, nextId) {
    return shelfPanelHtml(available, openId, nextId, gameCard);
  }
  function stopLunar() {
    rt.lunarCourt?.destroy();
    rt.lunarCourt = null;
  }
  function clearLight() {
    stopLight();
    rt.lightCourt = null;
  }
  function lightMarksFor(g) {
    if (g.freePlay || !g.options?.length) return [];
    const target = String(g.target ?? '');
    const wrongs = rt.shuffle(g.options.map(x => String(x)).filter((x, i, all) => x !== target && all.indexOf(x) === i));
    const choices = rt.shuffle([{ text: target, ok: true }, ...wrongs.map(text => ({ text, ok: false }))]);
    const slots = lightMarkSlots(choices.length);
    return choices.map((choice, n) => ({ i: slots[n], text: choice.text, ok: choice.ok }));
  }
  function paintLightMarks(g) {
    rt.lightCourt?.setMarks(lightMarksFor(g));
  }
  function paintLightChrome(g) {
    const title = $('#app h1');
    if (title) title.textContent = rt.heading(g);
    const tally = $('#lightTally');
    const rounds = rt.questionCount();
    if (tally) {
      if (g.freePlay) tally.textContent = g.pace === 'rush' ? `Rush · ${g.streak || 0}` : 'Arcade';
      else if (g.pace === 'rush') tally.textContent = g.index ? `Rush · ${g.index}` : 'Rush';
      else tally.textContent = `${(g.index || 0) + 1} / ${rounds}`;
    }
    const progress = document.querySelector('.progress');
    const bar = progress?.firstElementChild;
    if (!g.freePlay && bar && progress) {
      const now = Math.min(rounds, g.index || 0);
      bar.style.width = `${rounds ? now / rounds * 100 : 0}%`;
      progress.setAttribute('aria-valuenow', String(now));
    }
    const show = $('#lightShow');
    if (show) show.innerHTML = g.show || '';
  }
  function clearTimers(...names) {
    for (const n of names) {
      clearTimeout(rt[`${n}Timer`]);
      rt[`${n}Timer`] = 0;
    }
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
  function advanceVerse(g) {
    clearTimers('verse');
    rt.verseTimer = setTimeout(() => {
      rt.verseTimer = 0;
      if (rt.game !== g || g.finished) return;
      if (document.querySelector('dialog[open]')) { advanceVerse(g); return; }
      g.index++;
      if (g.index >= (g.deck?.length || 0)) showCompletedVerse(g);
      else rt.question();
    }, 700);
  }
  function showCompletedVerse(g) {
    rt.releaseListen();
    rt.stopSpeech();
    const verse = verseWithRef(g.pack);
    const remember = g.pack?.remember ? `<p class="hint">${esc(g.pack.remember)}</p>` : '';
    $('#app').innerHTML = `<div class="playtop" data-mode="verse"><button class="quiet" id="back">← All games</button><b>${esc(g.title || 'Memory verse')}</b></div><section class="playarea"><h1>Read the whole verse.</h1><p class="verse-done">${esc(verse)}</p>${remember}<button class="speaker" id="listen"><span aria-hidden="true">🔈</span> Hear it again</button><button class="primary" id="verseRead">I read it</button></section>`;
    $('#back').onclick = requestHome;
    $('#listen').onclick = () => { rt.stopSpeech(); rt.say(verse); };
    $('#verseRead').onclick = () => rt.finish();
    rt.focusHeading();
  }
  function continueAfter(name, g, soundMs, quietMs, retryMs, wait) {
    clearTimers(name);
    const rounds = rt.questionCount();
    rt[`${name}Timer`] = setTimeout(() => {
      rt[`${name}Timer`] = 0;
      if (rt.game !== g || g.finished) return;
      if (document.querySelector('dialog[open]')) { continueAfter(name, g, soundMs, quietMs, retryMs, retryMs); return; }
      g.index++;
      if (g.mode === 'rally') {
        const stops = g.rallyStops || rallyQuestionCount(rounds);
        const doneAsking = (g.rallyRights || 0) >= rallyClearCount(rounds) || g.index >= stops;
        paintRallyChrome(g);
        if (doneAsking) postSidecar({ type: 'clear' });
        else rt.question();
        return;
      }
      if (g.index >= rounds) rt.finish();
      else rt.question();
    }, wait ?? (rt.data.sound ? soundMs : quietMs));
  }
  function endTimed(mode, stopFn) {
    rt.releaseListen();
    const g = rt.game;
    if (!g || g.finished || g.mode !== mode) return;
    g.finished = true;
    clearTimers(mode);
    stopFn();
    camOff();
    const played = Math.max(1, (g.index | 0) + 1);
    const correct = Math.min(played, g.firstCorrect || 0);
    Object.assign(rt.p(), applyRound(rt.p(), g.mode, g.key, played, correct));
    rt.save();
    const stars = played === 1 ? '1 learning star' : `${played} learning stars`;
    $('#app').innerHTML = `<section class="playarea"><div class="result-star" aria-hidden="true">🌟</div><h1>Game over</h1><p>You got ${stars}.</p><p class="hint">First try: ${correct} of ${played}</p>${starGardenHtml()}<button class="primary" id="again">Play again</button> <button class="quiet" id="all">Choose a game</button></section>`;
    $('#again').onclick = () => start(mode);
    $('#all').onclick = home;
    rt.say(`Game over. You got ${stars}.`);
    rt.focusHeading();
  }
  function paintRallyChrome(g) {
    const rally = g.mode === 'rally';
    const rounds = rally ? rallyClearCount(rt.questionCount()) : rt.questionCount();
    const rights = Math.min(rounds, g.rallyRights || 0);
    const title = $('#app h1');
    if (title) title.textContent = rally && rights >= rounds ? 'Drive to the finish.' : rt.heading(g);
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
  function home(focus, { syncHash = true } = {}) {
    if (!rt.data.profiles?.length) {
      rt.showWelcome?.();
      return;
    }
    if (syncHash) rt.setHash?.('home');
    $('#settings')?.close();
    if ($('#gate')?.open) $('#gate').close();
    rt.releaseListen();
    clearTimers('cover', 'rocket', 'lane', 'hook', 'sky', 'planet', 'match', 'verse');
    stopArcade();
    stopLunar();
    stopHoop();
    stopHook();
    stopSky();
    stopPlanet();
    stopPuzzle();
    stopMatch();
    stopMarble();
    stopBridge();
    clearLight();
    stopMaze();
    stopChase();
    stopHop();
    stopToast();
    stopGlide();
    stopCity();
    stopAisle();
    stopLily();
    stopBust();
    stopMole();
    stopCube();
    stopStack();
    stopLamp();
    stopTrace();
    stopSort();
    stopMerge();
    stopCrayon();
    stopSidecar();
    clearTimers('learn', 'chase', 'hop', 'toast', 'glide', 'city', 'aisle', 'lily', 'bust', 'mole', 'cube', 'stack', 'lamp', 'rally');
    stopEars();
    rt.game = null;
    camOff();
    rt.stopSpeech();
    const learner = rt.p();
    const avatar = { fox: '🦊', bear: '🐻', bunny: '🐰', frog: '🐸', owl: '🦉', chick: '🐤' }[profileSprite(learner, rt.data.active)] || '🌱';
    const hello = `Hi, ${learner.name}. Tap a picture to play.`;
    const next = recommended();
    const listed = listedGames();
    const available = SHELF_META.map(s => ({ ...s, games: listed.filter(g => shelfOf(g[0]) === s.id) })).filter(s => s.games.length);
    if (focus === 'style') rt.homeHowOpen = true;
    if (!available.some(s => s.id === rt.homeShelf)) rt.homeShelf = shelfOf(next?.[0]) || available[0]?.id || 'adventures';
    const note = learner.sessions
      ? esc(roundsSentence(learner))
      : 'Most games wait for you. Rocket climb and Gas race keep going until they finish.';
    $('#app').innerHTML = homePageHtml({
      learnerName: esc(learner.name),
      avatar,
      starsChip: esc(starChip(learner)),
      upNextCard: next ? gameCard(next[0], { featured: true, next: true }) : '',
      shelfChips: shelfChipsHtml(available, rt.homeShelf),
      shelfPanel: shelfPanel(available, rt.homeShelf, next?.[0]),
      howWePlay: howWePlay(rt.homeHowOpen),
      starGarden: starGardenHtml(true),
      note,
      storageOK: rt.storageOK
    });
    document.querySelectorAll('[data-shelf]').forEach(b => b.onclick = () => { rt.homeShelf = b.dataset.shelf; home('shelf'); });
    const howToggle = $('#howToggle');
    if (howToggle) howToggle.onclick = () => { rt.homeHowOpen = !rt.homeHowOpen; home('how'); };
    document.querySelectorAll('[data-style]').forEach(b => b.onclick = () => { rt.p().style = b.dataset.style; rt.save(); home('style'); });
    document.querySelectorAll('[data-learner]').forEach(b => b.onclick = () => pickLearner(+b.dataset.learner));
    if ($('#printCards')) $('#printCards').onclick = rt.openPrint;
    document.querySelectorAll('[data-game]').forEach(b => b.onclick = () => start(b.dataset.game));
    rt.focusHeading();
    if (rt.data.sound) warm(rt.data.voice);
    // Speak the Hi greeting once per learner per local calendar day.
    if (rt.data.sound && focus !== 'style' && focus !== 'more' && focus !== 'shelf' && focus !== 'how') {
      const day = localCalendarDay();
      if (learner.helloDay !== day) {
        learner.helloDay = day;
        rt.save();
        rt.say(hello);
      }
    }
  }
  function pickLearner(index) {
    if (!Number.isInteger(index) || index === rt.data.active || !rt.data.profiles[index]) return;
    rt.data.active = index;
    rt.save();
    const learner = rt.p();
    home('style');
    if (rt.data.sound) rt.say(`${learner.name} has ${learner.stars === 1 ? '1 star' : `${learner.stars} stars`}.`);
  }
  function requestHome() {
    if (!rt.roundActive()) { home(); return; }
    rt.ask('Leave this round?', 'This round will not be saved.', 'Leave round', { keep: true }).then(ok => { if (ok) home(); });
  }
  function aloneBar(spec) {
    const alone = sidecarAlone(spec);
    if (!alone) return '';
    return `<div class="play-alone"><button type="button" class="quiet" id="playAlone">Play on its own</button><p>${esc(alone.note)}</p></div>`;
  }
  function openSidecarAlone() {
    const alone = sidecarAlone(sidecarGame(rt.game?.mode));
    if (!alone) return;
    const go = () => { location.assign(new URL(alone.href, location.href)); };
    if (!rt.roundActive()) { go(); return; }
    rt.ask(`Play ${alone.title} on its own?`, `This round will not be saved. ${alone.note}`, 'Play on its own', { keep: true }).then(ok => { if (ok) go(); });
  }
  function start(mode, { syncHash = true } = {}) {
    rt.releaseListen();
    rt.stopSpeech();
    clearTimers('rocket', 'lane', 'hook', 'sky', 'planet', 'match', 'learn', 'bridge', 'chase', 'hop', 'toast', 'glide', 'city', 'lily', 'bust', 'mole', 'cube', 'stack', 'lamp', 'rally', 'verse');
    const learner = rt.p();
    learner.lastPlayed = mode;
    rt.save();
    const style = rt.styleOf(mode);
    rt.game = { mode, style, key: progressKey(style, rt.skillLevel(mode)), index: 0, firstCorrect: 0, missed: false, done: false, finished: false, freePlay: mode === 'quickmath' || (!!learner.arcade && rt.ARCADE_PLAY.has(mode)) };
    if (syncHash) rt.setHash?.(`play/${mode}`);
    rt.question();
    if (rt.game?.mode === mode) rt.prefetchRound(rt.game);
  }
  function paintArcadePrompt(mode) {
    const g = rt.game;
    if (!g || g.finished) return;
    const cfg = ARCADE[mode];
    const title = $('#app h1');
    if (title) title.textContent = rt.heading(g);
    const show = $(`#${mode}Show`);
    if (show) show.innerHTML = g.show || '';
    const stage = document.querySelector(`.${mode}`);
    if (stage) stage.setAttribute('aria-label', `${g.prompt} ${cfg.aria}`);
    if (cfg.reveal) bindRocketReveal(g);
    if (cfg.said) {
      if (g[`${mode}Said`] === g.prompt) return;
      g[`${mode}Said`] = g.prompt;
    }
    if (cfg.fly) {
      rt.releaseListen();
      rt.say(g.prompt);
    } else rt.askBeforePlay(g.prompt);
  }
  function paintArcadeProgress(mode, value) {
    const g = rt.game;
    const stat = ARCADE[mode].stat;
    if (!g || (stat === 'score' && g.freePlay)) return;
    const rounds = rt.questionCount();
    const now = Math.min(g.index, rounds);
    const bar = document.querySelector('#app .progress div');
    const meter = document.querySelector('#app .progress');
    if (bar) bar.style.width = `${rounds ? now / rounds * 100 : 0}%`;
    if (meter) meter.setAttribute('aria-valuenow', String(now));
    const tally = $(`#${mode}Tally`);
    if (!tally) return;
    let extra = '';
    if (stat === 'lives') extra = ` · ${value == null ? (g.lives ?? g.board?.lives) : value} left`;
    else if (stat === 'clock') extra = ` · ${g.clockLeft == null ? (g.board?.seconds || 32) : g.clockLeft}s`;
    else if (stat === 'score') extra = ` · ${value == null ? (g.clockLeft ?? g.board?.seconds) : value}s · ${g.bustScore || 0}`;
    tally.textContent = `${Math.min(g.index + 1, rounds)} / ${rounds}${extra}`;
  }
  function paintAsk(g) {
    const title = $('#app h1');
    if (title) title.textContent = rt.heading(g);
    const show = $('#askShow');
    if (show) show.innerHTML = g.show || '';
    const box = $('#askChoices');
    if (box) {
      box.hidden = false;
      box.innerHTML = g.options.map((x, i) => `<button class="choice" data-option="${i}" aria-label="${esc(String(x))}">${g.render(x)}</button>`).join('');
      box.querySelectorAll('[data-option]').forEach(b => b.onclick = () => rt.answer(String(g.options[+b.dataset.option]) === String(g.target), b));
    }
    const feedback = $('#feedback');
    if (feedback) feedback.textContent = '';
    $('#help')?.remove();
    rt.focusHeading();
  }
  function paintBridgeProgress(g) {
    const rounds = rt.questionCount();
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
    clearTimers('bridge');
    const rounds = rt.questionCount();
    rt.bridgeTimer = setTimeout(() => {
      rt.bridgeTimer = 0;
      if (rt.game !== g || g.finished) return;
      if (document.querySelector('dialog[open]')) { continueBridge(g); return; }
      g.index++;
      paintBridgeProgress(g);
      if (g.index >= rounds) {
        g.asked = rounds;
        const all = g.firstCorrect >= rounds;
        rt.finishRun(g, all ? 'You reached the last platform.' : 'You crossed.', all ? 'Every answer was right.' : `${g.firstCorrect} of ${rounds} on the first try.`);
        return;
      }
      rt.question();
    }, rt.data.sound ? 900 : 400);
  }
  function camStage(zones = '') {
    return `<div class="camstage"><video playsinline muted autoplay></video>${zones ? `<div class="choices camzones">${zones}</div>` : ''}<span class="hand" hidden></span><span class="hand" hidden></span><p class="camstatus" id="camstatus"></p></div><p class="hint">Hold one hand on an answer until it fills. Raise both hands to go on.</p>`;
  }
  function raceTopicLine() {
    const kinds = raceKinds(rt.p().race).filter(kind => (rt.band() !== 'preschool' || kind !== 'words') && (rt.band() !== 'grade4' || kind !== 'colors'));
    const fallback = rt.band() === 'grade4' ? ['facts', 'shapes'] : ['facts', 'shapes', 'colors'];
    return (kinds.length ? kinds : fallback).map(kind => rt.RACE_LABELS[kind]).join(', ');
  }
  function starGardenHtml(pick) {
    return gardenHtml({
      rows: pointBoard(rt.data.profiles),
      activeIndex: rt.data.active,
      pick: !!pick,
      esc
    });
  }
  function raceBoardHtml(list) {
    const mine = rt.p().name.trim().toLowerCase();
    if (!list?.length) return '<p class="hint">No drives yet. The furthest car takes the lead.</p>';
    return `<ol class="race-board">${list.map(row => `<li class="${row.name.toLowerCase() === mine ? 'mine' : ''}"><span>${esc(row.name)}</span><span>${row.distance} m</span></li>`).join('')}</ol>`;
  }
  function raceReadyBody() {
    return `<p>The tank starts full. Steer into the right answer and the gas fills up again. Each right answer makes the car faster. A wrong lane ends the race.</p><p class="hint">This drive uses ${esc(raceTopicLine())}.</p><p class="hint">Shared distances on this device</p>${raceBoardHtml(raceStandings(rt.loadBoard()))}<button class="primary" id="arm">I’m ready! →</button>`;
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
    return rt.shuffle(shown);
  }
  function paintRacePrompt() {
    const g = rt.game;
    if (!g || g.mode !== 'race' || g.finished) return;
    const title = $('#app h1');
    if (title) title.textContent = rt.heading(g);
    const reveal = $('#reveal');
    if (reveal) reveal.hidden = !rt.wordHidden(g);
    const show = $('#raceShow');
    if (show) show.innerHTML = g.show || '';
    rt.askBeforePlay(g.prompt);
  }
  function verseLine(step, filled) {
    return (step?.parts || []).map(part => {
      if (part.type !== 'blank') return esc(part.text);
      const word = filled?.[part.index];
      return word ? `<b class="blank filled">${esc(word)}</b>` : `<b class="blank">${esc(part.mark || '____')}</b>`;
    }).join('');
  }
  function verseEditor() {
    return `<details class="verse-edit"><summary>Grown-up: use a different verse</summary><p class="hint">Paste a reference like Genesis 21:11, or the full verse. Public text uses World English Bible or King James. One line each in the script: title, remember, verse, bonus, bank, circle, fill, clue.</p><label>Reference or full verse<textarea id="verseSeed" rows="3" placeholder="Genesis 21:11 — or paste the whole verse"></textarea></label><label>Public text <select id="verseTranslation"><option value="web">World English Bible</option><option value="kjv">King James</option></select></label><p><button type="button" class="quiet" id="verseBuild">Make the verse games</button> <button type="button" class="quiet" id="verseCopyRows">Copy sheet rows</button></p><textarea id="verseScript" rows="8">${esc(rt.p().verse || '')}</textarea><p id="verseEditError" class="hint"></p><button type="button" class="quiet" id="verseSave">Use this verse</button></details>`;
  }
  function verseBody(g) {
    const step = g.step;
    const editor = verseEditor();
    const where = g.passage ? `<p class="hint">${esc(g.passage)}</p>` : '';
    if (!step) return `${where}${editor}`;
    if (step.kind === 'write' && g.phase === 'peek') {
      return `${where}<p class="verse-line">${esc(verseWithRef(g.pack))}</p><button class="primary" id="verseCover">Cover the verse</button>${editor}`;
    }
    if (step.kind === 'write') {
      const shown = g.phase === 'answer' ? `<p class="verse-line">${esc(verseWithRef(g.pack))}</p>` : '';
      return `${where}${shown}<label class="spell-type">Write what you remember <span class="hint">(optional)</span><textarea id="verseWrite" class="verse-write" placeholder="Extra star if you write the verse"></textarea></label><p class="hint">Okay to skip. Extra star if you write it.</p><button class="primary" id="verseDone">I’m done</button> <button type="button" class="quiet" id="verseShow">Show the verse</button>${editor}`;
    }
    if (step.kind === 'bonus') {
      const note = g.pack?.remember ? `<p class="hint">${esc(g.pack.remember)}</p>` : '';
      return `${where}<label class="spell-type">Your answer<textarea id="verseWrite" class="verse-write"></textarea></label><button class="primary" id="verseDone">That’s my answer</button>${note}${editor}`;
    }
    if (g.mode === 'clue') {
      const first = esc(String(g.target || '').slice(0, 1));
      return `${where}<p class="verse-line">${verseLine(step, g.filled)}</p><div class="verse-finish"><span class="verse-stem">${first}</span><input id="verseType" class="spell-key verse-rest" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Type the rest of the word"></div><button class="primary" id="verseCheck">That's the word</button>${editor}`;
    }
    const picks = (g.options || []).map((word, i) => `<button class="choice" data-option="${i}" aria-label="${esc(String(word))}">${esc(String(word))}</button>`).join('');
    return `${where}<p class="verse-line">${verseLine(step, g.filled)}</p><div class="choices verse-choices">${picks}</div>${editor}`;
  }
  function onVerseChoice(g, button) {
    if (!g || g.done) return;
    const word = String(g.options[+button.dataset.option] ?? '');
    if (g.verseKind === 'circle' || g.verseKind === 'clue') {
      rt.answer(word.toLowerCase() === String(g.target).toLowerCase(), button);
      return;
    }
    const next = g.answers[g.filled.length];
    if (word.toLowerCase() !== String(next).toLowerCase()) {
      g.missed = true;
      button.classList.add('wrong');
      $('#feedback').textContent = 'Keep exploring. Try another word.';
      rt.say('Try another word.');
      showHint();
      setTimeout(() => button.classList.remove('wrong'), 700);
      return;
    }
    g.filled.push(next);
    button.disabled = true;
    const line = document.querySelector('.verse-line');
    if (line) line.innerHTML = verseLine(g.step, g.filled);
    if (g.filled.length === g.answers.length) rt.answer(true, button);
    else $('#feedback').textContent = 'Nice! Find the next word.';
  }
  function wireVerse(g) {
    const err = () => $('#verseEditError');
    const seedNow = () => {
      const seed = ($('#verseSeed')?.value || '').trim();
      if (seed) return seed;
      const script = $('#verseScript')?.value || '';
      return needsVerseScriptBuild(script) ? script.trim() : '';
    };
    const build = $('#verseBuild');
    if (build) build.onclick = async () => {
      const seed = seedNow();
      if (!seed) {
        if (err()) err().textContent = 'Paste a reference like John 3:16, or the full verse.';
        return;
      }
      if (err()) err().textContent = 'Making the verse games…';
      try {
        const script = await scriptFromSeed(seed, { translation: $('#verseTranslation')?.value || 'web' });
        if (!script || !parseVerseScript(script)) {
          if (err()) err().textContent = 'Need a longer verse, or a reference the public Bible can find.';
          return;
        }
        if ($('#verseScript')) $('#verseScript').value = script;
        if ($('#verseSeed') && needsVerseScriptBuild($('#verseSeed').value)) $('#verseSeed').value = '';
        if (err()) err().textContent = 'Script ready. Tap Use this verse, or copy sheet rows.';
      } catch (ex) {
        if (err()) err().textContent = ex?.message || 'That reference could not be loaded.';
      }
    };
    const copy = $('#verseCopyRows');
    if (copy) copy.onclick = async () => {
      const script = $('#verseScript')?.value || '';
      if (!script.trim() || !parseVerseScript(script)) {
        if (err()) err().textContent = 'Make a verse script first.';
        return;
      }
      try {
        await navigator.clipboard.writeText(`learner,game,item,extra\n${verseSheetRows(script, '*')}`);
        if (err()) err().textContent = 'Sheet rows copied.';
      } catch {
        if (err()) err().textContent = 'Copy failed. Select the script and copy it by hand.';
      }
    };
    const save = $('#verseSave');
    if (save) save.onclick = async () => {
      let text = $('#verseScript')?.value || '';
      if (seedNow() && !parseVerseScript(text)) {
        const seed = seedNow();
        if (err()) err().textContent = 'Making the verse games…';
        try {
          const script = await scriptFromSeed(seed, { translation: $('#verseTranslation')?.value || 'web' });
          if (!script || !parseVerseScript(script)) {
            if (err()) err().textContent = 'Need a longer verse, or a reference the public Bible can find.';
            return;
          }
          text = script;
          if ($('#verseScript')) $('#verseScript').value = script;
        } catch (ex) {
          if (err()) err().textContent = ex?.message || 'That reference could not be loaded.';
          return;
        }
      }
      if (text.trim() && !parseVerseScript(text)) {
        if (err()) err().textContent = 'Add a circle, fill, clue, or verse line.';
        return;
      }
      rt.p().verse = text;
      rt.save();
      g.deck = null;
      g.pack = null;
      g.heardVerse = false;
      g.index = 0;
      g.firstCorrect = 0;
      rt.question();
    };
    const cover = $('#verseCover');
    if (cover) cover.onclick = () => {
      g.phase = 'hidden';
      g.prompt = 'Write what you remember. Optional — extra star if you do.';
      renderGame();
    };
    const done = $('#verseDone');
    if (done) done.onclick = () => {
      if (g.done) return;
      const typed = $('#verseWrite')?.value || '';
      if (g.verseKind === 'bonus') {
        if (!typed.trim()) {
          $('#feedback').textContent = 'Tell a grown-up what you think.';
          return;
        }
        rt.answer(true, done);
        return;
      }
      const score = verseRecall(g.pack?.verse || g.target, typed);
      // Writing is optional: empty or partial still advances; a full recall earns an extra star.
      if (score.ok) {
        g.wroteVerse = true;
        g.extraStars = (g.extraStars || 0) + 1;
      }
      rt.answer(true, done);
    };
    const reveal = $('#verseShow');
    if (reveal) reveal.onclick = () => {
      if (g.done) return;
      g.peeked = true;
      g.missed = true;
      const box = $('#verseWrite');
      if (box) box.value = g.pack?.verse || '';
      rt.answer(true, reveal);
    };
    const checkLetters = () => {
      if (g.done) return;
      const field = $('#verseType');
      const typed = field?.value || '';
      if (clueMatch(g.target, typed)) rt.answer(true, field);
      else {
        g.missed = true;
        field?.classList.add('wrong');
        $('#feedback').textContent = 'Not yet. Type the letters after the first one.';
        rt.say('Try again.');
        showHint();
      }
    };
    const check = $('#verseCheck');
    if (check) check.onclick = checkLetters;
    const field = $('#verseType');
    if (field) {
      field.focus();
      field.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || g.done) return;
        event.preventDefault();
        checkLetters();
      });
    }
  }
  function renderGame() {
    stopArcade();
    stopLunar();
    stopHoop();
    stopHook();
    stopSky();
    stopPlanet();
    stopPuzzle();
    stopMatch();
    stopMarble();
    stopBridge();
    clearLight();
    stopMaze();
    stopChase();
    stopHop();
    stopToast();
    stopGlide();
    stopCity();
    stopAisle();
    stopLily();
    stopBust();
    stopMole();
    stopCube();
    stopStack();
    stopLamp();
    stopTrace();
    stopSort();
    stopMerge();
    stopCrayon();
    stopSidecar();
    stopEars();
    const g = rt.game;
    if (!g) return;
    const screen = SCREEN.has(g.mode);
    const { rocket, lunar, hoop, light, race, hook, sky, planet, puzzle, match, marble, bridge, maze, chase, hop, toast, glide, city, aisle, lily, mole, cube, bust, stack, lamp, trace, sort, merge, crayon } = Object.fromEntries([...IN_ARENA].map(m => [m, g.mode === m]));
    const side = sidecarGame(g.mode);
    const arcade = IN_ARENA.has(g.mode) || !!side;
    const reach = g.style === 'reach', phys = !arcade && (g.style === 'move' || g.style === 'hunt'), zone = reach ? ' data-zone' : '';
    const picks = (NO_CHOICES.has(g.mode) || side) ? '' : g.mode === 'build'
      ? g.letters.map((x, i) => `<button class="choice letter" data-letter="${i}"${zone}>${esc(x)}</button>`).join('')
      : g.options.map((x, i) => `<button class="choice" data-option="${i}" aria-label="${esc(String(x))}"${zone}>${g.render(x)}</button>`).join('');
    const slots = g.mode === 'build' ? `<div class="wordslots"><span id="built" aria-live="polite">${blanks(g.built, g.target)}</span></div>` : '';
    const spellField = g.mode === 'build' ? '<label class="spell-type">Type the next letter <input id="spellType" class="spell-key" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" aria-label="Type the next letter"></label>' : '';
    const clear = g.mode === 'build' ? '<button class="quiet" id="clear">Start word again</button>' : '';
    let body;
    const howTo = HAS_READY.has(g.mode)
      ? g.howTo
      : g.mode === 'catch'
      ? (reach ? 'Reach up and catch the number with your hand.' : 'Slide the basket under the number.')
      : (reach && g.mode === 'lanes' ? 'Step into the lane with the word. You get 10 seconds to get there.' : 'Drive to the word.');
    if (race && g.phase === 'ready') body = raceReadyBody();
    else if (rocket) body = `<div id="rocketShow">${g.show || ''}</div><div id="arcade"></div><div class="choices" id="rocketChoices">${picks}</div>`;
    else if (lunar) {
      const court = g.level >= 3 ? 'The hoop drifts, and a rock is in the way.' : g.level >= 2 ? 'The hoop drifts.' : 'The hoop stays still.';
      body = `<p class="hint">Shooting on ${esc(g.place)}. ${court}</p><div id="arcade"></div>${g.freePlay ? '' : `<div class="choices">${picks}</div>`}`;
    }
    else if (HAS_READY.has(g.mode) && g.phase === 'ready') body = `<p>${howTo}</p><button class="primary" id="arm">I’m ready! →</button>`;
    else if (chase) body = `<div id="chaseShow">${g.show || ''}</div><div id="arcade"></div>`;
    else if (bridge) body = `<div id="askShow">${g.show || ''}</div><div id="arcade"></div><div class="choices" id="askChoices">${picks}</div>`;
    else if (maze) body = '<div id="arcade"></div><div id="askShow"></div><div class="choices" id="askChoices" hidden></div>';
    else if (puzzle) body = '<div id="arcade"></div><div id="puzzleSay" hidden></div>';
    else if (crayon && g.phase === 'pick') {
      const pages = g.catalog || [];
      body = `<p>Pick a picture to color.</p><div class="crayon-picks" role="list">${pages.map(page => `<button type="button" class="crayon-pick" role="listitem" data-page="${page.index}" aria-label="Color the ${esc(page.name)}"><span aria-hidden="true">${page.icon}</span><b>${esc(page.name)}</b></button>`).join('')}</div>`;
    }
    else if (side && g.phase === 'ready') body = `<p>${esc(side.howTo)}</p><button class="primary" id="arm">I’m ready! →</button>`;
    else if (side) body = '<div id="arcade" class="sidecar-host"></div>';
    else if (g.mode === 'lanes' && g.phase === 'ready' && reach) body = `<p>${howTo}</p><button class="primary" id="arm">I’m ready! →</button>`;
    else if (g.mode === 'lanes' && g.phase === 'ready') {
      const paces = [['slow', 'Slow'], ['steady', 'Steady'], ['fast', 'Fast'], ['survival', 'Survival']];
      body = `<p>${howTo}</p><div class="lane-paces" role="group" aria-label="Car speed">${paces.map(([id, label]) => `<button type="button" class="stylebtn" data-pace="${id}">${label}</button>`).join('')}</div><p class="hint" id="paceHint"></p><button class="primary" id="arm">I’m ready! →</button>`;
    }
    else if (screen && g.phase === 'ready') body = `<p>${howTo}</p><button class="primary" id="arm">I’m ready! →</button>`;
    else if (IN_ARENA.has(g.mode)) body = `${SHOW[g.mode] ? `<div id="${SHOW[g.mode]}"></div>` : ''}<div id="arcade"></div>`;
    else if (g.mode === 'verse' || g.mode === 'clue') body = verseBody(g);
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
        return g.phase === 'remember' || s !== g.target ? rt.shape(s, '#8fac73', true) : '<span class="shape missing" role="img" aria-label="Missing shape">?</span>';
      }).join('')}</div>`
      : '';
    const rounds = (g.mode === 'verse' || g.mode === 'clue') && g.deck?.length ? g.deck.length : rt.questionCount();
    const rallyDrive = g.mode === 'rally';
    const freePlay = !!g.freePlay;
    const rallyNeed = rallyClearCount(rounds);
    const rallyRights = Math.min(rallyNeed, g.rallyRights || 0);
    const scene = NO_SCENE.has(g.mode) || side ? '' : g.show;
    const height = Math.round(Math.min(1, Math.max(0, g.altitude || 0)) * 100);
    const paceMark = g.mode === 'lanes' && g.started && g.style !== 'reach' ? `${lanePaceName(g)} · ` : '';
    const tally = light ? '<span id="lightTally">Pick a speed</span>' : g.mode === 'quickmath' ? '<span>Missions</span>' : freePlay ? '<span>Arcade</span>' : rallyDrive ? `<span id="rallyTally">${rallyRights >= rallyNeed ? 'Finish the stage' : `${g.rallyRights || 0} / ${rallyNeed}`}</span>` : side ? `<span id="rallyTally">${g.index + 1} / ${rounds}</span>` : race ? '<span>Full tank</span>' : glide ? `<span id="glideTally">${g.index + 1} / ${rounds}</span>` : city ? `<span id="cityTally">${g.index + 1} / ${rounds}</span>` : marble ? '<span id="runTally">Level 1 · 0</span>' : maze ? `<span id="runTally">${g.clock?.seconds || 0}s · 1 / ${rounds}</span>` : hop ? `<span id="hopTally">${g.index + 1} / ${rounds} · ${g.board?.lives || 4} left</span>` : toast ? `<span id="toastTally">${g.index + 1} / ${rounds} · ${g.board?.lives || 5} left</span>` : aisle ? `<span id="aisleTally">${g.index + 1} / ${rounds} · ${g.board?.seconds || 32}s</span>` : lily ? `<span id="lilyTally">${g.index + 1} / ${rounds} · ${g.board?.lives || 4} left</span>` : cube ? `<span id="cubeTally">${g.index + 1} / ${rounds} · ${g.board?.lives || 4} left</span>` : mole ? `<span id="moleTally">${g.index + 1} / ${rounds} · ${g.board?.lives || 5} left</span>` : bust ? `<span id="bustTally">${g.index + 1} / ${rounds} · ${g.board?.seconds || 15}s</span>` : stack ? `<span id="stackTally">${g.index + 1} / ${rounds} · ${g.board?.lives || 4} left</span>` : lamp ? `<span id="lampTally">${g.index + 1} / ${rounds}</span>` : bridge ? `<span id="bridgeTally">${g.index + 1} / ${rounds} · ${g.lives || 1} ${(g.lives || 1) === 1 ? 'life' : 'lives'}</span>` : rocket ? `<span id="rocketTally">${esc(rocketZone(g.altitude || 0.32))}</span>` : `<span>${paceMark}${g.index + 1} / ${rounds}</span>`;
    const barMax = rallyDrive ? rallyNeed : marble ? (g.track?.step || 8) : maze ? (g.clock?.seconds || 50) : rocket ? 100 : rounds;
    const barNow = rallyDrive ? rallyRights : marble ? 0 : maze ? barMax : rocket ? height : g.index;
    const barLabel = rallyDrive ? 'Right answers before the open road' : marble ? 'Points to the next level' : maze ? 'Time left' : rocket ? 'Height toward space' : 'Questions completed';
    const barPct = rallyDrive ? (rallyNeed ? rallyRights / rallyNeed * 100 : 0) : marble ? 0 : maze ? 100 : rocket ? height : (rounds ? g.index / rounds * 100 : 0);
    const bar = race || freePlay || g.mode === 'quickmath' ? '' : `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${barMax}" aria-valuenow="${barNow}" aria-label="${barLabel}"><div style="width:${barPct}%"></div></div>`;
    const alone = aloneBar(side);
    const raceEars = race && g.level >= 2 && rt.data.sound && canSpeak() && raceKinds(rt.p().race).includes('words');
    const reveal = race
      ? (raceEars ? '<button class="quiet" id="reveal" hidden aria-label="Show the word"><span aria-hidden="true">👁</span></button>' : '')
      : (rt.wordHidden(g) ? '<button class="quiet" id="reveal" aria-label="Show the word"><span aria-hidden="true">👁</span></button>' : '');
    $('#app').innerHTML = `<div class="playtop" data-mode="${esc(g.mode)}"><button class="quiet" id="back">← All games</button><b>${esc(g.title)}</b>${tally}</div>${alone}${bar}<section class="playarea"><h1>${esc(rt.heading(g))}</h1><button class="speaker" id="listen"><span aria-hidden="true">🔈</span> Hear it again</button>${reveal}${memory}${scene}${body}<p class="feedback" id="feedback" aria-live="polite"></p><button class="primary" id="next" data-camera-go hidden>${g.index + 1 === rounds ? 'See my stars ★' : 'Next adventure →'}</button></section>`;
    $('#back').onclick = requestHome;
    if ($('#playAlone')) $('#playAlone').onclick = openSidecarAlone;
    $('#listen').onclick = () => {
      if ((g.mode === 'verse' || g.mode === 'clue') && (g.mode === 'clue' ? (g.hear || g.prompt) : g.pack?.verse)) {
        rt.releaseListen();
        rt.stopSpeech();
        rt.say(g.mode === 'clue' ? (g.hear || g.prompt) : verseWithRef(g.pack));
      } else if (ARCADE[g.mode]?.fly) {
        rt.releaseListen();
        rt.say(g.prompt);
      } else rt.askBeforePlay(g.prompt);
    };
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
          rt.question();
          return;
        }
        if (g.mode === 'hop' || g.mode === 'toast' || g.mode === 'aisle' || g.mode === 'lily' || g.mode === 'mole' || g.mode === 'cube' || g.mode === 'bust' || g.mode === 'stack' || g.mode === 'lamp') {
          g.started = true;
          g.phase = 'play';
          renderGame();
          return;
        }
        if (g.mode === 'hook' || g.mode === 'sky' || g.mode === 'planet' || g.mode === 'marble' || g.mode === 'bridge' || g.mode === 'maze') {
          g.started = true;
          g.phase = 'play';
          if (g.mode === 'bridge') { rt.question(); return; }
          if (g.mode !== 'marble') rt.askBeforePlay(g.prompt);
          renderGame();
          return;
        }
        if (g.mode === 'lanes') {
          g.started = true;
          g.survival = g.pace === 'survival';
          g.phase = 'play';
          g.speed = laneDriveSpeed(g);
          rt.askBeforePlay(g.prompt);
          renderGame();
          return;
        }
        if (g.mode === 'race') {
          g.phase = 'play';
          renderGame();
          return;
        }
        g.phase = 'play';
        rt.askBeforePlay(g.prompt);
        renderGame();
      };
    }
    if ($('#hide')) $('#hide').onclick = () => {
      if (g.style === 'move') {
        g.phase = 'away';
        g.prompt = rt.pick(rt.breaks);
        rt.askBeforePlay(g.prompt);
        renderGame();
        return;
      }
      g.phase = 'cover';
      g.prompt = 'Which shape is missing?';
      rt.askBeforePlay(g.prompt);
      renderGame();
      clearTimers('cover');
      rt.coverTimer = setTimeout(() => {
        if (rt.game !== g || g.phase !== 'cover') return;
        g.phase = 'answer';
        renderGame();
      }, 900);
    };
    if ($('#backIn')) $('#backIn').onclick = () => {
      g.phase = 'answer';
      g.icon = '🦘';
      g.prompt = 'Which shape is missing? Jump to that card!';
      rt.askBeforePlay(g.prompt);
      renderGame();
    };
    if ($('#gotit')) $('#gotit').onclick = () => rt.withGrownup(() => rt.answer(true, $('#gotit')));
    if ($('#notyet')) $('#notyet').onclick = () => rt.withGrownup(() => rt.answer(false, $('#notyet')));
    if ($('#showAnswer')) $('#showAnswer').onclick = () => rt.withGrownup(() => {
      const key = $('#answerKey');
      if (key) key.hidden = false;
      $('#showAnswer').hidden = true;
    });
    document.querySelectorAll('[data-option]').forEach(b => b.onclick = () => {
      if (g.mode === 'verse' || g.mode === 'clue') { onVerseChoice(g, b); return; }
      if (g.mode !== 'lunar') { rt.answer(g.options[+b.dataset.option] === g.target, b); return; }
      if (g.options[+b.dataset.option] === g.target) armShot(b);
      else rt.answer(false, b);
    });
    if (g.mode === 'verse' || g.mode === 'clue') wireVerse(g);
    document.querySelectorAll('[data-letter]').forEach(b => b.onclick = () => {
      if (g.done) return;
      const letter = g.letters[+b.dataset.letter];
      if (letter === g.target[g.built.length]) {
        g.built += letter;
        b.disabled = true;
        $('#built').textContent = blanks(g.built, g.target);
        if (g.built === g.target) rt.answer(true, b);
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
          rt.say('Try another letter.');
          showHint();
          break;
        }
        const button = [...document.querySelectorAll('[data-letter]')].find(el => !el.disabled && String(g.letters[+el.dataset.letter]).toLowerCase() === String(next).toLowerCase());
        if (!button) break;
        button.click();
      }
    });
    if ($('#clear')) $('#clear').onclick = () => { if (!g.done) { g.built = ''; renderGame(); } };
    $('#next').onclick = () => { g.index++; if (g.index >= rounds) rt.finish(); else rt.question(); };
    if (reach && !arcade) cam();
    if (side && g.phase === 'play') {
      mountSidecar($('#arcade'), side, {
        onReady() {
          const frame = document.querySelector('iframe.sidecar-frame');
          frame?.focus();
          if (rt.game?.mode === 'bike') postSidecar(rt.bikeConfig(rt.game));
          if (rt.game?.mode === 'quickmath') return;
          if (rt.game?.freePlay && (rt.game.mode === 'flight' || rt.game.mode === 'walk')) postSidecar({ type: 'arcade' });
          else if (rt.game) postSidecar(rt.rallyMessage(rt.game));
        },
        onProgress(info) {
          if (rt.game?.mode === 'bike' && Number.isFinite(+info?.travel)) rt.game.bikeTravel = +info.travel;
        },
        onShow() {
          if (rt.game && !rt.game.finished) rt.askBeforePlay(rt.game.prompt);
        },
        onReplay() {
          if (rt.game && !rt.game.finished) rt.askBeforePlay(rt.game.prompt);
        },
        onNeed() {
          if (!rt.game || rt.game.finished || rt.game.freePlay) return;
          if (rt.game.mode === 'rally' && ((rt.game.rallyRights || 0) >= rallyClearCount(rt.questionCount()) || rt.game.index >= (rt.game.rallyStops || rallyQuestionCount(rt.questionCount())))) {
            postSidecar({ type: 'clear' });
            return;
          }
          postSidecar(rt.rallyMessage(rt.game));
        },
        onPick(data) { rt.gradeRally(data.index | 0); },
        onSlip() {
          const round = rt.game;
          if (!round || round.finished || round.done) return;
          if (round.mode === 'walk') {
            const first = !round.missed;
            round.missed = true;
            const line = 'Not yet. Walk to another one.';
            const feedback = $('#feedback');
            if (feedback) feedback.textContent = line;
            const title = $('#app h1');
            if (title) title.textContent = line;
            if (first) rt.say(line);
            return;
          }
          if (round.rallyKind !== 'spell') return;
          const first = !round.missed;
          round.missed = true;
          const line = round.mode === 'flight' ? 'Not yet. The glider turns back.' : 'Not that letter. Keep spelling.';
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = line;
          if (round.mode === 'flight' && first) rt.say(line);
        },
        onQuit() { home(); },
        onFinish(detail) {
          const round = rt.game;
          if (!round || round.finished) return;
          if (round.mode === 'rally') {
            clearTimers('rally');
            rt.rallyTimer = setTimeout(() => {
              rt.rallyTimer = 0;
              if (rt.game !== round || round.finished) return;
              rt.finish('stage');
            }, 800);
            return;
          }
          if (round.mode !== 'flight') return;
          const line = detail === 'crash' ? 'Game over. The glider hit the ground.' : 'You flew for 2 minutes.';
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = line;
          const title = $('#app h1');
          if (title) title.textContent = line;
          clearTimers('rally');
          rt.rallyTimer = setTimeout(() => {
            rt.rallyTimer = 0;
            if (rt.game !== round || round.finished) return;
            rt.finish(detail);
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
          rt.say(reach && g.mode === 'lanes' ? 'Not yet. Get to the word.' : 'Try another one.');
          showHint();
        },
        onDone(clean) {
          if (!clean) g.missed = true;
          rt.answer(true);
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
          rt.say(line);
          showHint();
        },
        onDone(clean) {
          if (!clean) g.missed = true;
          rt.answer(true);
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
          if (rt.game !== g || g.done) return;
          g.missed = true;
          const line = kind === 'hull' ? 'You got hit.' : 'Try another rock.';
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          if (kind !== 'hull') showHint();
        },
        onRetry() {
          if (rt.game !== g || g.done || g.finished) return;
          const feedback = $('#feedback');
          if (feedback && feedback.textContent === 'You got hit.') feedback.textContent = '';
        },
        onEmpty() {
          if (rt.game !== g || g.done || g.finished) return;
          g.missed = true;
          const line = 'You got hit.';
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = line;
          rt.say(line);
        },
        onOver() {
          if (rt.game !== g || g.finished) return;
          endTimed('sky', stopSky);
        },
        onDone(clean) {
          if (rt.game !== g || g.done) return;
          if (!clean) g.missed = true;
          rt.answer(true);
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
          if (rt.game !== g || g.done) return;
          g.missed = true;
          const line = kind === 'shield' ? 'A rock reached the planet.' : 'Try another rock.';
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          showHint();
        },
        onEmpty() {
          if (rt.game !== g || g.done || g.finished) return;
          g.missed = true;
          const line = 'A rock reached the planet.';
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = line;
          rt.say(line);
        },
        onOver() {
          if (rt.game !== g || g.finished) return;
          endTimed('planet', stopPlanet);
        },
        onDone(clean) {
          if (rt.game !== g || g.done) return;
          if (!clean) g.missed = true;
          rt.answer(true);
        }
      });
    }
    if (marble && g.phase !== 'ready') {
      const palette = rt.colors.slice(0, g.track?.colors || 3);
      g.live = true;
      g.court = mountMarble($('#arcade'), {
        palette,
        track: g.track,
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        onQuestion(info) {
          if (rt.game !== g || g.finished) return;
          g.target = info.color;
          g.prompt = `Shoot ${info.color}.`;
          const title = $('#app h1');
          if (title) title.textContent = g.prompt;
          rt.askBeforePlay(g.prompt);
        },
        onScore(info) {
          if (rt.game !== g || g.finished) return;
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
          if (rt.game !== g || g.finished) return;
          g.asked = (g.asked || 0) + 1;
          if (info.clean) g.firstCorrect = (g.firstCorrect || 0) + 1;
          const feedback = $('#feedback');
          const line = `You cleared ${info.color}.`;
          if (feedback) feedback.textContent = line;
        },
        onOver(info) {
          if (rt.game !== g || g.finished) return;
          if ((g.marbleGot || 0) < (g.track?.quota || 1)) g.asked = (g.asked || 0) + 1;
          rt.finishRun(g, 'The marbles reached the nest.', `Level ${info.level}. ${info.points} points.`);
        }
      });
    }
    if (bridge && g.phase !== 'ready') {
      g.live = true;
      g.court = mountBridge($('#arcade'), {
        span: g.span,
        stops: rt.questionCount(),
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        onCrossed() {
          if (rt.game !== g || g.finished || g.movingOn) return;
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
          if (rt.game !== g || g.finished) return;
          const feedback = $('#feedback');
          if (info?.easy) {
            g.lives = (g.lives || 1) + 1;
            paintBridgeProgress(g);
            const line = 'Another life. Hold and try the bridge again.';
            if (feedback) feedback.textContent = line;
            rt.say(line);
            g.court?.retry();
            return;
          }
          g.asked = (g.index || 0) + 1;
          rt.finishRun(g, 'The bridge fell.', g.freePlay ? 'You did not reach the last platform.' : `The answer was ${g.target}. You did not reach the last platform.`);
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
          if (rt.game !== g || g.finished || g.asking) return;
          const tally = $('#runTally');
          if (tally) tally.textContent = `${info.left}s · ${g.index + 1} / ${rt.questionCount()}`;
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
          rt.askMaze(g, 'fall');
        },
        onTime() {
          if (g.freePlay) {
            g.court?.addTime(g.clock?.seconds || 12);
            const feedback = $('#feedback');
            if (feedback) feedback.textContent = 'More time.';
            return;
          }
          rt.askMaze(g, 'time');
        },
        onGoal() {
          if (rt.game !== g || g.finished) return;
          g.asked = (g.asked || 0) + 1;
          g.firstCorrect = (g.firstCorrect || 0) + 1;
          g.index++;
          const rounds = rt.questionCount();
          if (g.index >= rounds) rt.finishRun(g, 'You found every flag.', `${rounds} ${rounds === 1 ? 'maze' : 'mazes'} done.`);
          else {
            g.clock = mazeClock(g.level);
            g.court?.next(g.clock);
            const feedback = $('#feedback');
            if (feedback) feedback.textContent = 'Next maze.';
            rt.say('Next maze.');
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
          if (rt.game !== g || g.done) return;
          const line = face.label;
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = line;
          rt.say(line);
        },
        onMiss() {
          if (rt.game !== g || g.done) return;
          g.missed = true;
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== 'Not a match.') {
            feedback.textContent = 'Not a match.';
            rt.say('Not a match.');
          }
          showHint();
        },
        onDone(clean) {
          if (rt.game !== g || g.done) return;
          if (!clean) g.missed = true;
          rt.answer(true);
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
          if (rt.game !== g || g.done) return;
          g.missed = true;
          const feedback = $('#feedback');
          const line = 'Stay on the line. Try the path again.';
          if (feedback) feedback.textContent = line;
          rt.say(line);
          showHint();
        },
        onDrive() {
          if (rt.game !== g || g.done) return;
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = 'The car is driving the line.';
        },
        onDone(clean) {
          if (rt.game !== g || g.done) return;
          if (!clean) g.missed = true;
          rt.answer(true);
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
          if (rt.game !== g || g.done) return;
          g.missed = true;
          const feedback = $('#feedback');
          const line = 'That tube does not match. Pour onto the same kind, or an empty tube.';
          if (feedback) feedback.textContent = line;
          rt.say(line);
          showHint();
        },
        onDone(clean) {
          if (rt.game !== g || g.done) return;
          if (!clean) g.missed = true;
          rt.answer(true);
        }
      });
    }
    if (crayon && g.phase === 'pick') {
      document.querySelectorAll('[data-page]').forEach(button => {
        button.onclick = () => {
          if (rt.game !== g || g.done) return;
          g.pageIndex = +button.dataset.page;
          prepareCrayon(g, g.level);
          rt.askBeforePlay(g.prompt);
          renderGame();
        };
      });
    }
    if (crayon && g.phase === 'play') {
      mountCrayon($('#arcade'), {
        picture: g.picture,
        legend: g.legend,
        brush: g.board.brush,
        cover: g.board.cover,
        glow: rt.band() === 'preschool',
        onMiss(spot) {
          if (rt.game !== g || g.done) return;
          g.missed = true;
          const feedback = $('#feedback');
          const line = `${spot.number} is ${spot.name}.`;
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          showHint();
        },
        onFill(spot) {
          if (rt.game !== g || g.done) return;
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = `${spot.name} is in.`;
        },
        onDone(clean) {
          if (rt.game !== g || g.done) return;
          if (!clean) g.missed = true;
          if (g.freePlay) {
            const found = rt.foundLine(g);
            const feedback = $('#feedback');
            if (feedback) feedback.textContent = found;
            rt.say(found);
            g.pageIndex = null;
            g.done = false;
            g.missed = false;
            prepareCrayon(g, g.level);
            rt.askBeforePlay(g.prompt);
            renderGame();
            return;
          }
          rt.answer(true);
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
          if (rt.game !== g || g.done) return;
          g.missed = true;
          const feedback = $('#feedback');
          const line = 'Those two do not make it.';
          if (feedback) feedback.textContent = line;
          rt.say(line);
          showHint();
        },
        onDone(clean) {
          if (rt.game !== g || g.done) return;
          if (!clean) g.missed = true;
          rt.answer(true);
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
          if (rt.game !== g || g.done) return;
          g.missed = true;
          const line = kind === 'bug' ? 'A snail got you. Keep going.' : 'That berry is not the one.';
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          showHint();
        },
        onDone(clean) {
          if (rt.game !== g || g.done) return;
          if (!clean) g.missed = true;
          rt.answer(true);
        }
      });
    }
    if (hop && g.phase !== 'ready') {
      mountHop($('#arcade'), {
        board: g.board,
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        nextQuestion: () => rt.arcadeQuestion('hop'),
        onPrompt: () => paintArcadePrompt('hop'),
        onLives(lives) {
          g.lives = lives;
          paintArcadeProgress('hop', lives);
        },
        onMiss(kind) {
          if (rt.game !== g || g.finished) return;
          g.missed = true;
          const line = kind === 'fall' ? 'You fell. You have one less life.' : 'That one breaks. You have one less life.';
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          showHint();
        },
        onClear(clean) {
          if (rt.game !== g || g.finished) return;
          if (g.freePlay) return;
          if (!clean) g.missed = true;
          if (!g.missed) g.firstCorrect++;
          const found = rt.foundLine(g);
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = found;
          rt.say(found);
          g.index++;
          g.missed = false;
          $('#help')?.remove();
          paintArcadeProgress('hop', g.lives);
          if (g.index >= rt.questionCount()) g.hopDone = true;
        },
        onOver() {
          if (rt.game !== g || g.finished) return;
          g.asked = g.index;
          rt.finishRun(g, 'The hops ran out.', 'Bounce on the leaves and hop on the right answer.');
        },
        onFinished() {
          clearTimers('hop');
          rt.hopTimer = setTimeout(() => {
            rt.hopTimer = 0;
            if (rt.game !== g || g.finished) return;
            rt.finish();
          }, rt.data.sound ? 500 : 250);
        }
      });
    }
    if (toast && g.phase !== 'ready') {
      mountToast($('#arcade'), {
        board: g.board,
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        paceFor: toastPace,
        nextQuestion: () => rt.arcadeQuestion('toast'),
        onPrompt: () => paintArcadePrompt('toast'),
        onLives(lives) {
          g.lives = lives;
          paintArcadeProgress('toast', lives);
        },
        onMiss(kind) {
          if (rt.game !== g || g.finished) return;
          g.missed = true;
          const line = kind === 'drop' ? 'That toast landed. You have one less life.' : 'That toast is not the one.';
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          showHint();
        },
        onClear(clean) {
          if (rt.game !== g || g.finished) return;
          if (g.freePlay) return;
          if (!clean) g.missed = true;
          if (!g.missed) g.firstCorrect++;
          const found = rt.foundLine(g);
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = found;
          rt.say(found);
          g.index++;
          g.missed = false;
          $('#help')?.remove();
          paintArcadeProgress('toast', g.lives);
          if (g.index >= rt.questionCount()) g.toastDone = true;
        },
        onOver() {
          if (rt.game !== g || g.finished) return;
          g.asked = g.index;
          rt.finishRun(g, 'The toasts landed.', 'Catch the right toast before it lands.');
        },
        onFinished() {
          clearTimers('toast');
          rt.toastTimer = setTimeout(() => {
            rt.toastTimer = 0;
            if (rt.game !== g || g.finished) return;
            rt.finish();
          }, rt.data.sound ? 500 : 250);
        }
      });
    }

    if (cube && g.phase !== 'ready') {
      mountCube($('#arcade'), {
        board: g.board,
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        nextQuestion: () => rt.arcadeQuestion('cube'),
        onPrompt: () => paintArcadePrompt('cube'),
        onLives(lives) {
          g.lives = lives;
          paintArcadeProgress('cube', lives);
        },
        onMiss(kind) {
          if (rt.game !== g || g.finished) return;
          g.missed = true;
          const line = kind === 'red' ? 'A red cube got you. You have one less life.' : kind === 'pass' ? 'You drove past the answer. Steer into it.' : 'That cube is not the one.';
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          showHint();
        },
        onClear(clean) {
          if (rt.game !== g || g.finished) return;
          if (g.freePlay) return;
          if (!clean) g.missed = true;
          if (!g.missed) g.firstCorrect++;
          const found = rt.foundLine(g);
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = found;
          rt.say(found);
          g.index++;
          g.missed = false;
          $('#help')?.remove();
          paintArcadeProgress('cube', g.lives);
          if (g.index >= rt.questionCount()) g.cubeDone = true;
        },
        onOver() {
          if (rt.game !== g || g.finished) return;
          g.asked = g.index;
          rt.finishRun(g, 'The red cubes caught up.', 'Dodge the red cubes and touch the right one.');
        },
        onFinished() {
          clearTimers('cube');
          rt.cubeTimer = setTimeout(() => {
            rt.cubeTimer = 0;
            if (rt.game !== g || g.finished) return;
            rt.finish();
          }, rt.data.sound ? 500 : 250);
        }
      });
    }
    if (mole && g.phase !== 'ready') {
      mountMole($('#arcade'), {
        board: g.board,
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        nextQuestion: () => rt.arcadeQuestion('mole'),
        onPrompt: () => paintArcadePrompt('mole'),
        onLives(lives) {
          g.lives = lives;
          paintArcadeProgress('mole', lives);
        },
        onMiss(kind) {
          if (rt.game !== g || g.finished) return;
          g.missed = true;
          const line = kind === 'hide' ? 'That mole hid. You have one less life.' : kind === 'dirt' ? 'That hole is empty.' : 'That mole is not the one.';
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          showHint();
        },
        onClear(clean) {
          if (rt.game !== g || g.finished) return;
          if (g.freePlay) return;
          if (!clean) g.missed = true;
          if (!g.missed) g.firstCorrect++;
          const found = rt.foundLine(g);
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = found;
          rt.say(found);
          g.index++;
          g.missed = false;
          $('#help')?.remove();
          paintArcadeProgress('mole', g.lives);
          if (g.index >= rt.questionCount()) g.moleDone = true;
        },
        onOver() {
          if (rt.game !== g || g.finished) return;
          g.asked = g.index;
          rt.finishRun(g, 'The moles hid.', 'Whack the right mole before it hides.');
        },
        onFinished() {
          clearTimers('mole');
          rt.moleTimer = setTimeout(() => {
            rt.moleTimer = 0;
            if (rt.game !== g || g.finished) return;
            rt.finish();
          }, rt.data.sound ? 500 : 250);
        }
      });
    }
    if (bust && g.phase !== 'ready') {
      mountBust($('#arcade'), {
        board: g.board,
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        freePlay: !!g.freePlay,
        nextQuestion: () => rt.arcadeQuestion('bust'),
        onPrompt: () => paintArcadePrompt('bust'),
        onTime(seconds) {
          g.clockLeft = seconds;
          paintArcadeProgress('bust', seconds);
        },
        onScore(points) {
          g.bustScore = points;
          paintArcadeProgress('bust', g.clockLeft);
        },
        onMiss(kind) {
          if (rt.game !== g || g.finished) return;
          g.missed = true;
          const line = kind === 'time' ? 'Time is up. The right ghost is waiting.' : 'That ghost is not the one.';
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          showHint();
        },
        onClear(clean) {
          if (rt.game !== g || g.finished) return;
          if (g.freePlay) return;
          if (!clean) g.missed = true;
          if (!g.missed) g.firstCorrect++;
          const found = rt.foundLine(g);
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = found;
          rt.say(found);
          g.index++;
          g.missed = false;
          $('#help')?.remove();
          paintArcadeProgress('bust', g.clockLeft);
          if (g.index >= rt.questionCount()) g.bustDone = true;
        },
        onOver(points) {
          if (rt.game !== g || g.finished) return;
          g.asked = g.index;
          rt.finishRun(g, 'Good job!', `You scored ${points}.`);
        },
        onFinished() {
          clearTimers('bust');
          rt.bustTimer = setTimeout(() => {
            rt.bustTimer = 0;
            if (rt.game !== g || g.finished) return;
            rt.finish();
          }, rt.data.sound ? 500 : 250);
        }
      });
    }
    if (stack && g.phase !== 'ready') {
      mountStack($('#arcade'), {
        board: g.board,
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        freePlay: !!g.freePlay,
        nextQuestion: () => rt.arcadeQuestion('stack'),
        onPrompt: () => paintArcadePrompt('stack'),
        onLives(lives) {
          g.lives = lives;
          paintArcadeProgress('stack', lives);
        },
        onMiss(kind) {
          if (rt.game !== g || g.finished) return;
          g.missed = true;
          const line = kind === 'block' ? 'That block is not the one. Wait for the right answer.' : 'That one missed the tower.';
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          showHint();
        },
        onClear(clean) {
          if (rt.game !== g || g.finished) return;
          if (g.freePlay) return;
          if (!clean) g.missed = true;
          if (!g.missed) g.firstCorrect++;
          const found = rt.foundLine(g);
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = found;
          rt.say(found);
          g.index++;
          g.missed = false;
          $('#help')?.remove();
          paintArcadeProgress('stack', g.lives);
          if (g.index >= rt.questionCount()) g.stackDone = true;
        },
        onOver() {
          if (rt.game !== g || g.finished) return;
          g.asked = g.index;
          rt.finishRun(g, 'The blocks missed the tower.', 'Line the blocks up on the tower.');
        },
        onFinished() {
          clearTimers('stack');
          rt.stackTimer = setTimeout(() => {
            rt.stackTimer = 0;
            if (rt.game !== g || g.finished) return;
            rt.finish();
          }, rt.data.sound ? 500 : 250);
        }
      });
    }
    if (lamp && g.phase !== 'ready') {
      mountLamp($('#arcade'), {
        board: g.board,
        rounds: rt.questionCount(),
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        freePlay: !!g.freePlay,
        nextQuestion: () => rt.arcadeQuestion('lamp'),
        onPrompt: () => paintArcadePrompt('lamp'),
        onMiss() {
          if (rt.game !== g || g.finished) return;
          g.missed = true;
          const line = 'That glow bug flutters away. Catch the right one.';
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          showHint();
        },
        onClear(clean) {
          if (rt.game !== g || g.finished) return;
          if (g.freePlay) return;
          if (!clean) g.missed = true;
          if (!g.missed) g.firstCorrect++;
          const found = rt.foundLine(g);
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = found;
          rt.say(found);
          g.index++;
          g.missed = false;
          $('#help')?.remove();
          paintArcadeProgress('lamp');
          if (g.index >= rt.questionCount()) g.lampDone = true;
        },
        onFinished() {
          clearTimers('lamp');
          rt.lampTimer = setTimeout(() => {
            rt.lampTimer = 0;
            if (rt.game !== g || g.finished) return;
            rt.finish();
          }, rt.data.sound ? 900 : 400);
        }
      });
    }
    if (glide && g.phase !== 'ready') {
      mountGlide($('#arcade'), {
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        nextQuestion: () => rt.arcadeQuestion('glide'),
        onPrompt: () => paintArcadePrompt('glide'),
        onMiss() {
          if (rt.game !== g || g.finished) return;
          g.missed = true;
          const line = 'That gem is not the answer. Grab the right one.';
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          showHint();
        },
        onClear(clean) {
          if (rt.game !== g || g.finished) return;
          if (g.freePlay) return;
          if (!clean) g.missed = true;
          if (!g.missed) g.firstCorrect++;
          const found = rt.foundLine(g);
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = found;
          rt.say(found);
          g.index++;
          g.missed = false;
          $('#help')?.remove();
          paintArcadeProgress('glide');
          if (g.index >= rt.questionCount()) g.glideDone = true;
        },
        onOver(reason) {
          if (rt.game !== g || g.finished) return;
          g.asked = g.index;
          const title = reason === 'fuel' ? 'The tank is empty.' : 'The plane met the island.';
          const grabbed = g.index ? `You grabbed ${g.index} ${g.index === 1 ? 'answer' : 'answers'}.` : 'Grab the gem with the answer.';
          rt.finishRun(g, title, grabbed);
        },
        onFinished() {
          clearTimers('glide');
          rt.glideTimer = setTimeout(() => {
            rt.glideTimer = 0;
            if (rt.game !== g || g.finished) return;
            rt.finish();
          }, rt.data.sound ? 500 : 250);
        }
      });
    }
    if (city && g.phase !== 'ready') {
      mountCity($('#arcade'), {
        board: g.board,
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        nextQuestion: () => rt.arcadeQuestion('city'),
        onPrompt: () => paintArcadePrompt('city'),
        onMiss() {
          if (rt.game !== g || g.finished) return;
          g.missed = true;
          const line = 'That ring is not the answer. Fly through the right one.';
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          showHint();
        },
        onClear(clean) {
          if (rt.game !== g || g.finished) return;
          if (g.freePlay) return;
          if (!clean) g.missed = true;
          if (!g.missed) g.firstCorrect++;
          const found = rt.foundLine(g);
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = found;
          rt.say(found);
          g.index++;
          g.missed = false;
          $('#help')?.remove();
          paintArcadeProgress('city');
          if (g.index >= rt.questionCount()) g.cityDone = true;
        },
        onOver() {
          if (rt.game !== g || g.finished) return;
          g.asked = g.index;
          const flown = g.index ? `You flew through ${g.index} ${g.index === 1 ? 'answer' : 'answers'}.` : 'Fly through the ring with the answer.';
          rt.finishRun(g, 'The plane met the city.', flown);
        },
        onFinished() {
          clearTimers('city');
          rt.cityTimer = setTimeout(() => {
            rt.cityTimer = 0;
            if (rt.game !== g || g.finished) return;
            rt.finish();
          }, rt.data.sound ? 500 : 250);
        }
      });
    }
    if (aisle && g.phase !== 'ready') {
      mountAisle($('#arcade'), {
        board: g.board,
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        nextQuestion: () => rt.arcadeQuestion('aisle'),
        onPrompt: () => paintArcadePrompt('aisle'),
        onTime(seconds) {
          g.clockLeft = seconds;
          paintArcadeProgress('aisle');
        },
        onMiss(kind) {
          if (rt.game !== g || g.finished) return;
          g.missed = true;
          const line = kind === 'time' ? 'Time is up. The right one is glowing. Walk over and pick it up.' : 'That stays on the shelf. Keep walking.';
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          showHint();
        },
        onClear(clean) {
          if (rt.game !== g || g.finished) return;
          if (g.freePlay) return;
          if (!clean) g.missed = true;
          if (!g.missed) g.firstCorrect++;
          const found = rt.foundLine(g);
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = found;
          rt.say(found);
          g.index++;
          g.missed = false;
          $('#help')?.remove();
          paintArcadeProgress('aisle');
          if (g.index >= rt.questionCount()) g.aisleDone = true;
        },
        onFinished() {
          clearTimers('aisle');
          rt.aisleTimer = setTimeout(() => {
            rt.aisleTimer = 0;
            if (rt.game !== g || g.finished) return;
            rt.finish();
          }, rt.data.sound ? 500 : 250);
        }
      });
    }
    if (lily && g.phase !== 'ready') {
      mountLily($('#arcade'), {
        board: g.board,
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        nextQuestion: () => rt.arcadeQuestion('lily'),
        onPrompt: () => paintArcadePrompt('lily'),
        onLives(lives) {
          g.lives = lives;
          paintArcadeProgress('lily', lives);
        },
        onMiss(kind) {
          if (rt.game !== g || g.finished) return;
          g.missed = true;
          const line = kind === 'car' ? 'An apple rolled by. Hop when the path is clear.' : kind === 'water' ? 'That hop missed the pot. Ride one across the creek.' : 'That flower pot is not the one.';
          const feedback = $('#feedback');
          if (feedback && feedback.textContent !== line) {
            feedback.textContent = line;
            rt.say(line);
          }
          showHint();
        },
        onClear(clean) {
          if (rt.game !== g || g.finished) return;
          if (g.freePlay) return;
          if (!clean) g.missed = true;
          if (!g.missed) g.firstCorrect++;
          const found = rt.foundLine(g);
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = found;
          rt.say(found);
          g.index++;
          g.missed = false;
          $('#help')?.remove();
          paintArcadeProgress('lily', g.lives);
          if (g.index >= rt.questionCount()) g.lilyDone = true;
        },
        onOver() {
          if (rt.game !== g || g.finished) return;
          g.asked = g.index;
          rt.finishRun(g, 'The hops ran out.', 'Ride the floating pots and land on the right flower pot.');
        },
        onFinished() {
          clearTimers('lily');
          rt.lilyTimer = setTimeout(() => {
            rt.lilyTimer = 0;
            if (rt.game !== g || g.finished) return;
            rt.finish();
          }, rt.data.sound ? 500 : 250);
        }
      });
    }
    if (lunar) {
      rt.lunarCourt = mountLunar($('#arcade'), {
        body: g.world,
        aim: true,
        learn: false,
        picker: false,
        dial: false,
        hud: true,
        motion: g.level >= 3 ? 'trick' : g.level >= 2 ? 'sway' : 'still',
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        sound: rt.data.sound,
        reset: false,
        aimToggle: false,
        keys: false,
        locked: !g.freePlay,
        lockedHint: 'Answer first',
        stats: { score: g.points, shots: g.shots, streak: g.streak },
        onLocked() {
          if (rt.game !== g || g.done || g.armed) return;
          const feedback = $('#feedback');
          if (!feedback || feedback.textContent === 'Answer first, then shoot.') return;
          feedback.textContent = 'Answer first, then shoot.';
          rt.say('Answer first, then shoot.');
        },
        onSwish(info) {
          if (rt.game !== g || g.done || (!g.freePlay && !g.armed)) return;
          g.points = info?.score || 0;
          g.shots = info?.shots || 0;
          g.streak = info?.streak || 1;
          if (g.freePlay) {
            const feedback = $('#feedback');
            const line = g.streak >= 3 ? `Swish! ${g.streak} in a row.` : 'Swish!';
            if (feedback) feedback.textContent = line;
            return;
          }
          rt.answer(true);
        },
        onBrick(info) {
          if (rt.game !== g || g.done || (!g.freePlay && !g.armed)) return;
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
          rt.lunarCourt?.lock();
          document.querySelectorAll('.choice').forEach(el => {
            el.classList.remove('correct');
            if (!el.classList.contains('wrong')) el.disabled = false;
          });
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = 'Missed the hoop. Answer again for another shot.';
          rt.say('Answer again for another shot.');
        }
      });
    }
    if (hoop) {
      const marks = [];
      if (!g.freePlay) {
        let marked = false;
        g.options.forEach(label => {
          const text = String(label);
          const ok = !marked && text === String(g.target);
          if (ok) marked = true;
          marks.push({ label: text, ok });
        });
      }
      mountHoop($('#arcade'), {
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        stats: { score: g.points, shots: g.shots, streak: g.streak },
        hoops: marks,
        onSwish(info) {
          if (rt.game !== g || g.done) return;
          g.points = info?.score || 0;
          g.shots = info?.shots || 0;
          g.streak = info?.streak || 1;
          if (g.freePlay) {
            const feedback = $('#feedback');
            const line = g.streak >= 3 ? `Swish! ${g.streak} in a row.` : 'Swish!';
            if (feedback) feedback.textContent = line;
            return;
          }
          rt.answer(true);
        },
        onWrong() {
          if (rt.game !== g || g.done || g.freePlay) return;
          g.missed = true;
          g.streak = 0;
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = 'Not that hoop. Try another shot.';
          rt.say('Not that hoop.');
          showHint();
        },
        onBrick(info) {
          if (rt.game !== g || g.done) return;
          g.shots = info?.shots || g.shots;
          g.streak = 0;
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = 'Missed the hoops. Try again.';
          rt.say('Missed the hoops.');
        }
      });
    }
    if (light) {
      rt.lightCourt = mountLight($('#arcade'), {
        level: g.level,
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        onPick(pace) {
          if (rt.game !== g || g.finished) return '';
          g.started = true;
          g.pace = pace;
          g.phase = 'play';
          g.streak = 0;
          g.index = 0;
          g.missed = false;
          const mark = rt.fillLightAsk(g);
          paintLightChrome(g);
          paintLightMarks(g);
          rt.say(g.prompt);
          return mark;
        },
        onCatch(info) {
          if (rt.game !== g || g.done || g.finished) return 'done';
          g.streak = info?.streak || 1;
          g.seconds = info?.seconds;
          if (g.freePlay) {
            paintLightChrome(g);
            rt.lightCourt?.setMarks([]);
            const feedback = $('#feedback');
            if (feedback) feedback.textContent = g.streak >= 3 ? `Amazing! ${g.streak} in a row.` : 'Amazing!';
            return;
          }
          if (!g.missed) g.firstCorrect++;
          g.index++;
          g.missed = false;
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = g.streak >= 3 ? `Amazing! ${g.streak} in a row.` : 'Amazing!';
          const rounds = rt.questionCount();
          if (g.pace !== 'rush' && g.index >= rounds) {
            g.done = true;
            rt.finish();
            return 'done';
          }
          rt.fillLightAsk(g);
          paintLightChrome(g);
          paintLightMarks(g);
          rt.say(g.prompt);
        },
        onMiss(info) {
          if (rt.game !== g || g.finished) return;
          if (info?.end) {
            if (g.freePlay) {
              const feedback = $('#feedback');
              const caught = info.streak || 0;
              if (feedback) feedback.textContent = caught ? `Too fast. You caught ${caught}.` : 'Too fast.';
              rt.say(caught ? `You caught ${caught}.` : 'Too fast.');
              return;
            }
            g.asked = g.index || 0;
            const caught = g.asked;
            rt.finishRun(g, 'Too fast.', caught ? `You caught ${caught}.` : 'The light got away.');
            return;
          }
          if (!g.freePlay) g.missed = true;
          g.streak = 0;
          const feedback = $('#feedback');
          if (feedback) {
            feedback.textContent = info?.verdict === 'wrong'
              ? 'Wrong answer. Catch the right one.'
              : info?.verdict === 'almost'
                ? 'Almost. Catch the right answer.'
                : 'Missed. Catch the right answer.';
          }
          if (info?.verdict === 'wrong') rt.say('Try another one.');
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
          if (rt.game !== g || g.done || g.flightOver) return;
          g.done = true;
          g.missed = true;
          g.asked = (g.asked || 0) + 1;
          document.querySelectorAll('#rocketChoices .choice').forEach(el => { el.disabled = true; });
          const feedback = $('#feedback');
          if (feedback) feedback.textContent = 'Too slow. The rocket is falling!';
          rt.say('Too slow. The rocket is falling.');
          if (!g.flightOver) scheduleRocketQuestion();
        },
        onCrash() {
          if (rt.game !== g || g.scored) return;
          endRocketFlight('crash');
        },
        onSpace() {
          if (rt.game !== g || g.scored) return;
          g.flightOver = true;
          clearTimers('rocket');
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
          rt.say('You’re in space! Fly the rocket.');
          rt.focusHeading();
        },
        onFlyDone(result) {
          if (rt.game !== g || g.scored) return;
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
        nextGate: rt.raceQuestion,
        onPrompt: paintRacePrompt,
        onOver(result) {
          if (rt.game !== g || g.finished) return;
          rt.finishRace(result);
        }
      });
    }
    rt.focusHeading();
  }
  function showHint() {
    const g = rt.game;
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
        const hint = rt.strategyHint(g);
        $('#feedback').textContent = hint;
        rt.say(hint);
        return;
      }
      const hint = grade4 ? mathHint(g.math, rt.hintMode(g)) : (g.math ? mathHint(g.math, rt.hintMode(g)) : (g.mode === 'build' ? `The next letter is ${g.target[g.built.length]}.` : g.mode === 'puzzle' ? `The shape is a ${g.target}.` : g.mode === 'match' ? 'Turn two cards that look the same.' : g.mode === 'crayon' ? (g.phase === 'pick' ? 'Pick a picture.' : 'Tap matching numbers to fill them.') : `Look for ${g.target}.`));
      $('#feedback').textContent = hint;
      rt.say(hint);
      if (g.mode !== 'build' && !grade4) document.querySelectorAll('[data-option]').forEach(el => {
        if (String(g.options[+el.dataset.option]) === String(g.target)) el.classList.add('hinted');
      });
    };
    $('#feedback').after(help);
  }
  function missLetter(button, letter) {
    const g = rt.game;
    if (g.done) return;
    g.missed = true;
    button.classList.add('wrong');
    $('#feedback').textContent = `${letter.toUpperCase()} is not the next letter.`;
    rt.say('Try another letter.');
    showHint();
    setTimeout(() => button.classList.remove('wrong'), 700);
  }
  function paintRocketMeters() {
    const g = rt.game;
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
    if (!rt.wordHidden(g)) {
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
    const g = rt.game;
    if (!g || g.flightOver) return;
    g.done = false;
    g.missed = false;
    const title = $('#app h1');
    if (title) title.textContent = rt.heading(g);
    const show = $('#rocketShow');
    if (show) show.innerHTML = g.show || '';
    const choices = $('#rocketChoices');
    if (choices) {
      choices.hidden = false;
      choices.innerHTML = g.options.map((x, i) => `<button class="choice" data-option="${i}" aria-label="${esc(String(x))}">${g.render(x)}</button>`).join('');
      choices.querySelectorAll('[data-option]').forEach(b => b.onclick = () => rt.answer(g.options[+b.dataset.option] === g.target, b));
    }
    const feedback = $('#feedback');
    if (feedback) feedback.textContent = '';
    $('#help')?.remove();
    bindRocketReveal(g);
    pokeRocket('arm');
    paintRocketMeters();
    rt.focusHeading();
  }
  function scheduleRocketQuestion() {
    clearTimers('rocket');
    const g = rt.game;
    rt.rocketTimer = setTimeout(() => {
      rt.rocketTimer = 0;
      if (rt.game !== g || g.flightOver || g.finished) return;
      if (document.querySelector('dialog[open]')) { scheduleRocketQuestion(); return; }
      g.index++;
      rt.question();
    }, 880);
  }
  function resolveRocket(ok, button) {
    const g = rt.game;
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
      rt.say('The rocket is dropping.');
      scheduleRocketQuestion();
      return;
    }
    if (!g.missed) g.firstCorrect++;
    if (button?.classList.contains('choice')) button.classList.add('correct');
    $('#help')?.remove();
    pokeRocket('boost');
    if (g.flightOver) return;
    const found = rt.foundLine(g);
    const feedback = $('#feedback');
    if (feedback) feedback.textContent = found;
    rt.say(found);
    scheduleRocketQuestion();
  }
  function endRocketFlight(kind) {
    const g = rt.game;
    if (!g || g.scored) return;
    g.scored = true;
    g.finished = true;
    g.flightOver = true;
    clearTimers('rocket');
    const asked = g.asked || 0;
    const correct = Math.min(asked, g.firstCorrect || 0);
    if (asked > 0) {
      Object.assign(rt.p(), applyRound(rt.p(), g.mode, g.key, asked, correct));
      rt.save();
    }
    rt.rocketTimer = setTimeout(() => {
      if (rt.game !== g) return;
      showRocketEnd(g, kind, asked, correct);
    }, kind === 'crash' ? 900 : 500);
  }
  function showRocketEnd(g, kind, asked, correct) {
    if (rt.game !== g) return;
    stopArcade();
    const title = kind === 'moon' ? 'You landed on the moon!' : kind === 'stars' ? 'You flew past the stars!' : 'The rocket came back down.';
    const sub = kind === 'crash' ? 'Let’s launch again.' : 'Nice flying. Let’s launch again.';
    const stars = asked > 0 ? `<p>First try: ${correct} of ${asked}</p><p class="hint">+${asked} learning stars</p>` : '';
    const mark = kind === 'crash' ? '🚀' : '🌟';
    $('#app').innerHTML = `<section class="playarea"><div class="result-star" aria-hidden="true">${mark}</div><h1>${esc(title)}</h1><p>${esc(sub)}</p>${stars}${starGardenHtml()}<button class="primary" id="again">Launch again</button> <button class="quiet" id="all">Choose a game</button></section>`;
    const launch = () => { if (rt.game === g) start('rocket'); };
    $('#again').onclick = () => { clearTimers('rocket'); launch(); };
    $('#all').onclick = () => { clearTimers('rocket'); home(); };
    rt.say(title);
    rt.focusHeading();
    rt.rocketTimer = setTimeout(launch, kind === 'crash' ? 1800 : 2400);
  }
  function stopEars() {
    const rec = rt.ears;
    if (!rec) return;
    rt.ears = null;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    try { rec.abort(); } catch { try { rec.stop(); } catch { /* already stopped */ } }
  }
  function shapeChoiceButtons(g) {
    return `<div class="choices">${g.options.map((x, i) => `<button class="choice" data-option="${i}" aria-label="${esc(x)}">${rt.shape(x)}</button>`).join('')}</div>`;
  }
  function bindShapeChoices(g) {
    $('#puzzleSay')?.querySelectorAll('[data-option]').forEach(b => b.onclick = () => {
      if (rt.game !== g || g.done) return;
      stopEars();
      g.heard = '';
      rt.answer(g.options[+b.dataset.option] === g.target, b);
    });
  }
  function showShapeTaps() {
    const g = rt.game;
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
    const g = rt.game;
    if (!g || g.done || g.phase !== 'say') return;
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) { showShapeTaps(); return; }
    stopEars();
    const rec = new Rec();
    rt.ears = rec;
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    const button = $('#sayShape');
    const status = $('#sayStatus');
    if (button) { button.disabled = true; button.textContent = 'Listening…'; }
    if (status) status.textContent = 'Say the shape.';
    rec.onresult = event => {
      if (rt.game !== g || g.done) return;
      const result = event.results[0];
      let heard = '';
      for (let i = 0; i < result.length; i++) {
        heard = spokenShape(result[i].transcript, rt.shapes);
        if (heard) break;
      }
      if (!heard) {
        if (status) status.textContent = 'Say the shape you see.';
        rt.say('Say the shape you see.');
        return;
      }
      g.heard = heard;
      rt.answer(heard === g.target);
    };
    rec.onerror = event => {
      if (event.error === 'aborted' || rt.game !== g || g.done) return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        showShapeTaps();
        return;
      }
      if (status) status.textContent = event.error === 'no-speech' ? 'I didn’t hear you. Try again.' : 'Say the shape again.';
    };
    rec.onend = () => {
      if (rt.ears === rec) rt.ears = null;
      if (rt.game !== g || g.done || g.phase !== 'say') return;
      const again = $('#sayShape');
      if (again) { again.disabled = false; again.textContent = 'Say the shape'; }
    };
    try { rec.start(); }
    catch { showShapeTaps(); }
  }
  function puzzleReady() {
    const g = rt.game;
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
    rt.askBeforePlay(g.prompt);
  }
  function armShot(button) {
    const g = rt.game;
    if (!g || g.done || g.armed) return;
    g.armed = true;
    button.classList.add('correct');
    document.querySelectorAll('.choice').forEach(el => { el.disabled = true; });
    $('#feedback').textContent = 'Pull back and shoot!';
    rt.say('Pull back and shoot.');
    rt.lunarCourt?.unlock();
  }
  function watchHookHands(fn) {
    let off = () => {};
    let gone = false;
    const status = t => { const el = $('#camstatus'); if (el) el.textContent = t; };
    (rt.camera ??= import('../lib/camera.js?v=hook-reach')).then(m => {
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
    (rt.camera ??= import('../lib/camera.js?v=hook-reach')).then(m => {
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
    (rt.camera ??= import('../lib/camera.js?v=hook-reach')).then(m => {
      if (gone) return;
      off = m.watchBody(fn);
      m.attach($('.lane-cam'), status);
    }).catch(() => status('Reach play could not load.'));
    return () => { gone = true; off(); };
  }
  function cam() {
    const status = t => { const el = $('#camstatus'); if (el) el.textContent = t; };
    (rt.camera ??= import('../lib/camera.js?v=hook-reach')).then(m => m.attach($('.camstage'), status)).catch(() => {
      rt.camera = null;
      status('Reach play could not load. You can still tap the answers.');
    });
  }
  function camOff() { rt.camera?.then(m => m.stop()).catch(() => {}); }
}
