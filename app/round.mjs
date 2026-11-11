import {
  applyRound,
  candidateWords,
  choicesFor,
  countQuestion,
  distractorLetters,
  fuelSeconds,
  grade4Prompt,
  mathTip,
  numberRange,
  pathPrompt,
  pathQuestion,
  raceBoard,
  raceKinds,
  rallyGates,
  rallyQuestionCount,
  rallyClearCount,
  stageOf,
  laneCount,
  hookCast,
  skyWave,
  planetWave,
  puzzleBoard,
  marbleTrack,
  bridgeSpan,
  mazeClock,
  chaseBoard,
  hopBoard,
  toastBoard,
  aisleBoard,
  lilyBoard,
  moleBoard,
  cubeBoard,
  stackBoard,
  lampBoard,
  bustBoard
} from '../logic.mjs?v=structure4';
import { canSpeak, commonLines, prefetchSpeech } from '../lib/speech.js?v=wait-2s';
import { stopArcade } from '../games/arcade.js?v=ask-first2-r2';
import { stopHoop } from '../games/hoop.js?v=hoop-trio-r2';
import { stopHook } from '../games/hook.js?v=ask-first2-r2';
import { stopSky } from '../games/sky.js?v=ask-first2-r2';
import { stopPlanet } from '../games/planet.js?v=ask-first2-r2';
import { stopPuzzle } from '../games/puzzle.js?v=puzzle-glass';
import { stopMatch } from '../games/match.js?v=pair-match2';
import { stopChase } from '../games/chase.js?v=ask-first2-r2';
import { stopHop } from '../games/hop.js?v=ask-first-r2';
import { stopToast } from '../games/toast.js?v=ask-first-r2';
import { stopGlide } from '../games/glide.js?v=ask-first-r2';
import { stopAisle } from '../games/aisle.js?v=market-aisle2-r2';
import { stopLily } from '../games/lily.js?v=ask-first-r2';
import { stopBust } from '../games/bust.js?v=ghost-same2-r2';
import { stopMole } from '../games/mole.js?v=mole-pop3';
import { stopCube } from '../games/cube.js?v=pad-jump';
import { stopStack } from '../games/stack.js?v=stack-words-r2';
import { stopLamp } from '../games/lamp.js?v=lamp-r2';
import { stopTrace } from '../games/trace.js?v=trace-car2';
import { stopSort } from '../games/sort.js?v=sort-roll';
import { stopMerge } from '../games/merge.js?v=goo-jar2';
import { stopCrayon } from '../games/crayon.js?v=crayon-more';
import { stopMarble } from '../games/marble.js?v=ask-first2-r2';
import { stopBridge } from '../games/bridge.js?v=ask-first-r2';
import { stopMaze } from '../games/maze.js?v=ask-first-r2';
import { postSidecar, sidecarGame, stopSidecar } from '../lib/sidecar.js?v=quickmath';
import { $, esc } from './runtime.mjs?v=lean-r2';
import { ARCADE } from './arcade-modes.mjs?v=arcade';

const NO_WORD = new Set(['trace', 'sort', 'merge']);
const SUBJECT_WORDS = new Set('rally flight bike walk glide rocket lunar hoop light hook sky planet bridge maze chase hop toast aisle lily mole bust stack lamp cube'.split(' '));

export function registerRound(rt) {
  Object.assign(rt, {
    prefetchRound,
    fillLightAsk,
    bikeConfig,
    rallyMessage,
    gradeRally,
    question,
    rallyPrefs,
    arcadeQuestion,
    askMaze,
    finishRun,
    wordHidden,
    foundLine,
    strategyHint,
    hintMode,
    raceQuestion,
    answer,
    finishRace,
    finish
  });
  function prefetchRound(g) {
    if (!rt.data.sound) return;
    const voiceId = rt.voiceNow(g.mode);
    const words = ['words', 'build', 'lanes'].includes(g.mode) ? rt.wordList().slice(0, 8).map(w => rt.wordPrompt(g.mode, w, g.style)) : [];
    prefetchSpeech(words.concat(rt.sidecarLines[g.mode] || [], commonLines).map(text => ({ text, voiceId })), { priority: 'next' });
  }
  function fillLightAsk(g) {
    g.level = g.level || rt.skillLevel('light');
    g.subject = rt.playSubject(g.index || 0);
    g.shown = false;
    if (g.freePlay) {
      g.math = null;
      g.target = '';
      g.show = '';
      g.options = [];
      g.prompt = g.pace === 'rush' ? 'Rush gets faster after every catch.' : 'Tap when the light hits the green bulb.';
      g.render = x => esc(String(x));
      return '';
    }
    const count = [3, 4, 5][(g.level || 1) - 1] || 3;
    if (g.subject === 'words') {
      const words = rt.wordList();
      const n = Math.min(count, Math.max(1, words.length));
      g.math = null;
      g.show = '';
      g.target = rt.pick(words);
      g.prompt = `Catch the light on ${g.target}.`;
      g.options = rt.shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, n - 1)).concat(g.target);
      g.render = x => esc(x);
    } else {
      loadScreenMath(g, g.level);
      const rest = g.options.filter(x => String(x) !== String(g.target));
      g.options = [...rest.slice(0, count - 1), g.target];
      g.prompt = `${g.prompt} Catch the light on that answer.`;
    }
    return String(g.target ?? '');
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
      audio: rt.data.sound !== false,
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
      message.stops = g.rallyStops || rallyQuestionCount(rt.questionCount());
      message.gates = rallyGates(message.stops);
    }
    if (g.mode === 'flight') message.freeEvery = rallyClearCount(rt.questionCount());
    return message;
  }
  function gradeRally(index) {
    const g = rt.game;
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
    rt.say(line);
    if (flightMiss) return;
    if (g.mode === 'flight') {
      g.flightRights = (g.flightRights || 0) + 1;
      if (g.flightRights >= rallyClearCount(rt.questionCount())) return;
    }
    if (g.mode === 'rally' && ok) g.rallyRights = (g.rallyRights || 0) + 1;
    rt.continueAfter('rally', g, 1200, 500);
  }
  function question() {
    const g = rt.game;
    g.missed = false;
    g.done = false;
    g.armed = false;
    g.built = '';
    g.target2 = null;
    g.show = '';
    const l = rt.skillLevel(g.mode);
    g.level = l;
    const { n, ss, cs } = rt.pools(l);
    g.title = rt.games.find(x => x[0] === g.mode)[1];
    g.phase = 'answer';
    if (g.mode === 'shapes') {
      g.target = rt.pick(ss);
      g.prompt = `Find the ${g.target}.`;
      g.options = rt.shuffle(ss).slice(0, n);
      if (!g.options.includes(g.target)) g.options[0] = g.target;
      g.render = x => rt.shape(x);
    }
    if (g.mode === 'colors') {
      g.target = rt.pick(cs)[0];
      g.prompt = `Find ${g.target}.`;
      g.options = rt.shuffle(cs.map(c => c[0])).slice(0, n);
      if (!g.options.includes(g.target)) g.options[0] = g.target;
      g.render = x => rt.swatch(x, rt.colors.find(c => c[0] === x)[1]);
    }
    if (g.mode === 'mix') {
      const pool = ss.flatMap(s => cs.map(c => `${c[0]} ${s}`));
      g.target = rt.pick(pool);
      g.prompt = `Find the ${g.target}.`;
      g.options = rt.shuffle(pool.filter(x => x !== g.target)).slice(0, n - 1).concat(g.target);
      g.render = x => {
        const [c, s] = x.split(' ');
        return rt.shape(s, rt.colors.find(v => v[0] === c)[1]);
      };
      if (g.style === 'move') {
        const deck = rt.mixDeck(l);
        g.target = rt.pick(deck);
        if (l === 3) g.target2 = rt.pick(deck.filter(x => x !== g.target));
      }
    }
    if (g.mode === 'missing') {
      g.memory = rt.shuffle(ss).slice(0, [3, 4, 5][l - 1]);
      g.target = rt.pick(g.memory);
      g.options = rt.shuffle(ss).slice(0, n);
      if (!g.options.includes(g.target)) g.options[0] = g.target;
      g.prompt = 'Look carefully. Remember these shapes!';
      g.phase = 'remember';
      g.render = x => rt.shape(x);
    }
    if (g.mode === 'words' || g.mode === 'build') {
      const words = g.mode === 'build' ? rt.spellList(l) : rt.wordList();
      g.target = rt.pick(candidateWords(words, g.mode));
      g.prompt = rt.wordPrompt(g.mode, g.target);
      g.options = rt.shuffle(words.filter(x => x !== g.target)).slice(0, n - 1).concat(g.target);
      g.render = x => `${esc(x)}<span aria-hidden="true" style="font-size:20px">🚙</span>`;
      if (g.mode === 'build') g.letters = rt.shuffle([...g.target, ...distractorLetters(g.target, l)]);
    }
    if (g.mode === 'count') {
      const [item, name] = rt.pick(rt.countPool());
      const q = g.math = countQuestion(rt.band(), l, g.style, Math.random, rt.factPool());
      g.target = q.target;
      g.countName = name;
      g.prompt = q.kind === 'count' ? `How many ${name}? Count them!` : q.question;
      g.options = choicesFor(q, n);
      g.render = x => String(x);
      if (q.show === 'array') g.show = `<div class="countrow array" style="--cols:${q.cols}" role="img" aria-label="${q.rows} rows of ${q.cols}">${Array(q.target).fill(`<span>${item}</span>`).join('')}</div>`;
      else if (q.show === 'items') g.show = `<div class="countrow" role="img" aria-label="${esc(name)} to count">${Array(g.target).fill(`<span>${item}</span>`).join('')}</div>`;
    }
    if (g.mode === 'path') {
      const q = g.path = pathQuestion(rt.band(), l, Math.random, rt.factPool());
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
      const words = rt.wordList();
      const count = laneCount(l, words.length);
      g.target = rt.pick(words);
      g.prompt = rt.wordPrompt(g.mode, g.target, g.style);
      g.options = rt.shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, count - 1)).concat(g.target);
      g.speed = rt.laneDriveSpeed(g);
      g.render = x => esc(x);
      g.phase = g.started ? 'play' : 'ready';
    }
    if (g.mode === 'rocket') {
      g.shown = false;
      g.subject = rt.playSubject(g.index);
      g.seconds = fuelSeconds(l);
      if (g.altitude == null) g.altitude = 0.32;
      if (g.subject === 'words') {
        const words = rt.wordList();
        const count = laneCount(l, words.length);
        g.math = null;
        g.target = rt.pick(words);
        g.prompt = `Lift the rocket with the word ${g.target}.`;
        g.options = rt.shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, count - 1)).concat(g.target);
        g.render = x => esc(x);
      } else loadScreenMath(g, l);
    }
    if (g.mode === 'lunar') {
      g.points ??= 0;
      g.shots ??= 0;
      g.streak ??= 0;
      g.subject = rt.playSubject(g.index);
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
        const words = rt.wordList();
        const count = laneCount(l, words.length);
        g.math = null;
        g.target = rt.pick(words);
        g.prompt = `Pick the word ${g.target}, then take your shot.`;
        g.options = rt.shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, count - 1)).concat(g.target);
        g.render = x => esc(x);
      } else loadScreenMath(g, l);
    }
    if (g.mode === 'hoop') {
      g.points ??= 0;
      g.shots ??= 0;
      g.streak ??= 0;
      g.subject = rt.playSubject(g.index);
      if (g.freePlay) {
        g.math = null;
        g.target = '';
        g.prompt = 'Flick the ball through a hoop.';
        g.options = [];
        g.render = x => esc(String(x));
      } else if (g.subject === 'words') {
        const words = rt.wordList();
        g.math = null;
        g.target = rt.pick(words);
        g.prompt = `Flick through the hoop that says ${g.target}.`;
        const rest = rt.shuffle(words.filter(w => w !== g.target));
        g.options = rt.shuffle(rest.slice(0, 2).concat(g.target));
        g.render = x => esc(x);
      } else {
        loadScreenMath(g, l);
        const rest = rt.shuffle(g.options.filter(x => String(x) !== String(g.target)));
        g.options = rt.shuffle([...rest.slice(0, 2), g.target]);
      }
    }
    if (g.mode === 'light' && !g.started) {
      g.phase = 'ready';
      g.prompt = 'Tap when the light hits the right answer.';
      g.howTo = 'Rush gets faster after every catch, until you cannot time it.';
      g.options = [];
      g.target = '';
      g.show = '';
      g.render = x => esc(String(x));
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
      g.subject = rt.playSubject(g.index);
      g.cast = hookCast(l);
      g.howTo = g.style === 'reach'
        ? (g.cast.trash ? 'Move your hand onto the right fish. Leave the trash.' : 'Move your hand onto the right fish.')
        : (g.cast.trash ? 'Steer the hook onto the right fish. Leave the trash.' : 'Steer the hook onto the right fish.');
      g.phase = g.started ? 'play' : 'ready';
      if (g.subject === 'words') {
        const words = rt.wordList();
        const count = Math.min(g.cast.fish, Math.max(1, words.length));
        g.math = null;
        g.target = rt.pick(words);
        g.prompt = `Hook the fish that says ${g.target}.`;
        g.options = rt.shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, count - 1)).concat(g.target);
        g.render = x => esc(x);
      } else {
        loadScreenMath(g, l);
        const rest = g.options.filter(x => String(x) !== String(g.target));
        g.options = [...rest.slice(0, g.cast.fish - 1), g.target];
      }
    }
    if (g.mode === 'sky') {
      g.shown = false;
      g.subject = rt.playSubject(g.index);
      g.wave = skyWave(l);
      g.howTo = 'Turn the ship and shoot the rock with the right answer. Dodge the ships that shoot back.';
      g.phase = g.started ? 'play' : 'ready';
      if (g.subject === 'words') {
        const words = rt.wordList();
        const count = Math.min(g.wave.rocks, Math.max(1, words.length));
        g.math = null;
        g.target = rt.pick(words);
        g.prompt = `Shoot the rock that says ${g.target}.`;
        g.options = rt.shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, count - 1)).concat(g.target);
        g.render = x => esc(x);
      } else if (rt.band() === 'grade4' && rallyPrefs(rt.p()).span !== 'wide') {
        rallyMath(g, g.wave.rocks, rallyPrefs(rt.p()).span);
      } else {
        loadScreenMath(g, l);
        const rest = g.options.filter(x => String(x) !== String(g.target));
        g.options = [...rest.slice(0, g.wave.rocks - 1), g.target];
      }
    }
    if (g.mode === 'planet') {
      g.shown = false;
      g.subject = rt.playSubject(g.index);
      g.wave = planetWave(l);
      g.howTo = 'Aim the gun with the pointer. Click or tap to shoot the rock with the right answer. Rocks fly in from the edges.';
      g.phase = g.started ? 'play' : 'ready';
      if (g.subject === 'words') {
        const words = rt.wordList();
        const count = Math.min(g.wave.rocks, Math.max(1, words.length));
        g.math = null;
        g.target = rt.pick(words);
        g.prompt = `Shoot the rock that says ${g.target}.`;
        g.options = rt.shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, count - 1)).concat(g.target);
        g.render = x => esc(x);
      } else {
        loadScreenMath(g, l);
        const rest = g.options.filter(x => String(x) !== String(g.target));
        g.options = [...rest.slice(0, g.wave.rocks - 1), g.target];
      }
    }
    if (g.mode === 'puzzle') {
      const board = puzzleBoard(l);
      g.target = rt.pick(ss);
      g.pieces = board.pieces;
      g.outline = board.outline;
      g.prompt = 'Put the pieces together.';
      g.phase = 'build';
      g.options = rt.shuffle(ss.filter(name => name !== g.target)).slice(0, Math.max(0, n - 1)).concat(g.target);
      g.render = x => rt.shape(x);
    }
    if (g.mode === 'match') {
      g.faces = rt.matchFaces(l);
      g.prompt = rt.band() === 'preschool' ? 'Match the shapes, colors, and numbers.' : 'Match the shapes, colors, numbers, and words.';
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
        ? 'Tap the arrows to walk the aisles. Pick things up before the clock runs out.'
        : 'Tap the arrows to walk the aisles. Pick up the right thing before the clock runs out.';
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
    if (g.mode === 'bust') {
      g.board = bustBoard(l);
      g.howTo = g.freePlay
        ? 'Bust the ghosts before time runs out. Colored ghosts score more.'
        : rt.band() === 'grade4'
          ? 'Bust the ghost with the right answer before time runs out. The ghosts match, so use the answer.'
          : 'Bust the ghost with the right answer before time runs out. The ghosts match, so use the answer. A color question uses the ghost’s color.';
      g.phase = g.started ? 'play' : 'ready';
      if (!g.started) {
        g.prompt = g.howTo;
        g.options = [];
        g.tokens = [];
        g.subject = '';
        g.render = x => esc(String(x));
      }
    }
    if (g.mode === 'mole') {
      g.board = moleBoard(l);
      g.lives = g.board.lives;
      g.howTo = g.freePlay
        ? 'Tap the moles before they hide. An empty hole is just dirt.'
        : 'Tap the mole with the right answer before it hides. A wrong mole misses. An empty hole is just dirt. Letting the right mole hide costs a life.';
      g.phase = g.started ? 'play' : 'ready';
      if (!g.started) {
        g.prompt = g.howTo;
        g.options = [];
        g.tokens = [];
        g.subject = '';
        g.render = x => esc(String(x));
      }
    }
    if (g.mode === 'cube') {
      g.board = cubeBoard(l);
      g.lives = g.board.lives;
      g.howTo = g.freePlay
        ? 'Steer the blue cube. Jump over the red ones.'
        : 'Steer the blue cube. Jump over the red ones. Touch the cube with the right answer. A red cube costs a life.';
      g.phase = g.started ? 'play' : 'ready';
      if (!g.started) {
        g.prompt = g.howTo;
        g.options = [];
        g.tokens = [];
        g.subject = '';
        g.render = x => esc(String(x));
      }
    }
    if (g.mode === 'stack') {
      g.board = stackBoard(l);
      g.lives = g.board.lives;
      g.howTo = g.freePlay
        ? 'Tap to drop the blocks. Line them up on the tower. Blocks that hang off fall away.'
        : 'Tap when the right answer is on the tower. Blocks that hang off fall away. Missing the tower costs a try.';
      g.phase = g.started ? 'play' : 'ready';
      if (!g.started) {
        g.prompt = g.howTo;
        g.options = [];
        g.tokens = [];
        g.subject = '';
        g.render = x => esc(String(x));
      }
    }
    if (g.mode === 'lamp') {
      g.board = lampBoard(l);
      g.howTo = g.freePlay
        ? 'Tap the stones to build the lighthouse. When it is tall, the lamp turns on.'
        : 'Tap the stone with the right answer. It rises into the tower. A wrong stone splashes. When the questions are done, the lamp turns on.';
      g.phase = g.started ? 'play' : 'ready';
      if (!g.started) {
        g.prompt = g.howTo;
        g.options = [];
        g.tokens = [];
        g.subject = '';
        g.render = x => esc(String(x));
      }
    }
    if (g.mode === 'trace') rt.prepareTrace(g, l);
    if (g.mode === 'sort') rt.prepareSort(g, l);
    if (g.mode === 'merge') rt.prepareMerge(g, l);
    if (g.mode === 'crayon') {
      g.pageIndex = null;
      rt.prepareCrayon(g, l);
    }
    const sideSpec = sidecarGame(g.mode);
    if (sideSpec) {
      g.sidecar = sideSpec;
      g.howTo = sideSpec.howTo;
      g.started = true;
      g.phase = 'play';
      if (g.mode === 'rally') g.rallyStops = g.rallyStops || rallyQuestionCount(rt.questionCount());
      if (g.mode === 'quickmath') {
        g.prompt = 'Pick a mission.';
        g.tokens = [];
        g.options = [];
        g.show = '';
      } else if (g.freePlay && (g.mode === 'flight' || g.mode === 'walk' || g.mode === 'bike')) {
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
      // The card opens a few seconds later, when the ride reaches it. Make the line now so it plays the moment it shows.
      if (rt.data.sound && g.prompt && g.mode !== 'quickmath') prefetchSpeech([{ text: g.prompt, voiceId: rt.voiceNow(g.mode) }], { priority: 'next' });
      if (document.querySelector('iframe.sidecar-frame')) {
        if (g.mode === 'quickmath') return;
        rt.paintRallyChrome(g);
        postSidecar(rallyMessage(g));
      } else rt.renderGame();
      return;
    }
    hybrid(g);
    g.options = rt.shuffle(g.options);
    if (g.mode === 'rocket' && g.launched && !g.flightOver && $('#rocketShow')) {
      rt.paintRocketQuestion();
      rt.askBeforePlay(g.prompt);
      return;
    }
    if (g.mode === 'bridge' && g.live) {
      rt.paintAsk(g);
      rt.askBeforePlay(g.prompt);
      return;
    }
    const gatesPlay = g.phase !== 'ready' && !['glide', 'marble', 'hop', 'toast', 'aisle', 'lily', 'mole', 'bust', 'stack', 'lamp', 'cube'].includes(g.mode);
    if (gatesPlay) rt.askBeforePlay(g.prompt);
    rt.renderGame();
    if (g.mode === 'lanes' && g.phase === 'ready') rt.say(g.style === 'reach' ? 'Step into the word. You have 10 seconds to get there.' : 'Drive to the word.');
    else if ((g.mode === 'hook' || g.mode === 'sky' || g.mode === 'planet' || g.mode === 'marble' || g.mode === 'bridge' || g.mode === 'maze' || g.mode === 'chase' || g.mode === 'hop' || g.mode === 'toast' || g.mode === 'aisle' || g.mode === 'lily' || g.mode === 'mole' || g.mode === 'bust' || g.mode === 'stack' || g.mode === 'lamp' || g.mode === 'cube') && g.phase === 'ready') rt.say(g.howTo);
    else if (g.mode === 'marble' && g.phase === 'play') { /* the marble path speaks each color */ }
    else if (g.mode === 'hop' && g.phase === 'play') { /* sprout hop speaks each landing */ }
    else if (g.mode === 'toast' && g.phase === 'play') { /* toast pop speaks each catch */ }
    else if (g.mode === 'aisle' && g.phase === 'play') { /* aisle cart speaks each shelf */ }
    else if (g.mode === 'lily' && g.phase === 'play') { /* lily cross speaks each pad */ }
    else if (g.mode === 'mole' && g.phase === 'play') { /* mole pop speaks each peek */ }
    else if (g.mode === 'bust' && g.phase === 'play') { /* ghost bust speaks each wave */ }
    else if (g.mode === 'stack' && g.phase === 'play') { /* stacker speaks each drop */ }
    else if (g.mode === 'lamp' && g.phase === 'play') { /* light the lamp speaks each stone */ }
    else if (g.mode === 'cube' && g.phase === 'play') { /* cube dash speaks each cube */ }
    else if (g.mode === 'glide') rt.say(g.howTo);
    else if (g.mode === 'catch' && g.phase === 'ready') rt.say(g.style === 'reach' ? 'Reach up and catch the number with your hand.' : 'Slide the basket under the number.');
    else if (!gatesPlay) rt.say(g.prompt);
  }
  function loadScreenMath(g, l, fromProfile) {
    const stage = rt.band();
    const [item, name] = rt.pick(rt.countPool());
    const usePath = stage !== 'grade4' && Math.random() < 0.5;
    const level = fromProfile ? rt.skillLevel(usePath ? 'path' : 'count') : l;
    const q = usePath ? pathQuestion(stage, level, Math.random, rt.factPool()) : countQuestion(stage, level, 'tap', Math.random, rt.factPool());
    g.math = q;
    g.target = q.target;
    g.countName = name;
    g.prompt = q.kind === 'count' ? `How many ${name}? Count them!` : q.question;
    const count = [3, 4, 5][l - 1];
    const rest = rt.shuffle(choicesFor(q, count).filter(x => String(x) !== String(q.target)));
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
    g.subject = rt.playSubject(g.mode === 'maze' ? (g.asked || 0) : g.index);
    g.shown = false;
    if (g.subject === 'words') {
      const words = rt.wordList();
      const n = Math.min(count, Math.max(1, words.length));
      g.math = null;
      g.show = '';
      g.target = rt.pick(words);
      g.prompt = g.mode === 'maze' ? `Pick the word ${g.target} to add time.` : `Pick the word ${g.target}.`;
      g.options = rt.shuffle(words.filter(w => w !== g.target)).slice(0, Math.max(0, n - 1)).concat(g.target);
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
    const board = place === 'lamp' ? lampBoard(g.level) : place === 'stack' ? stackBoard(g.level) : place === 'bust' ? bustBoard(g.level) : place === 'lily' ? lilyBoard(g.level) : place === 'cube' ? cubeBoard(g.level) : place === 'mole' ? moleBoard(g.level) : place === 'hop' || place === 'glide' || place === 'rally' || place === 'walk' ? hopBoard(g.level) : place === 'toast' ? toastBoard(g.level) : place === 'aisle' ? aisleBoard(g.level) : chaseBoard(g.level);
    const want = board.choices;
    const kinds = (rt.band() === 'preschool' ? ['facts', 'shapes', 'colors'] : rt.band() === 'grade4' ? ['words', 'facts', 'shapes'] : ['words', 'facts', 'shapes', 'colors']).filter(kind => {
      if (kind === 'words') return rt.wordList().length >= 2;
      if (kind === 'shapes') return rt.pools(rt.skillLevel('shapes')).ss.length >= 2;
      if (kind === 'colors') return rt.band() !== 'grade4' && rt.pools(rt.skillLevel('colors')).cs.length >= 2;
      return true;
    });
    const kind = kinds[Math.max(0, g.index) % kinds.length];
    g.math = null;
    g.show = '';
    g.countName = '';
    if (kind === 'words') {
      g.subject = 'words';
      const words = rt.wordList();
      const n = Math.max(1, Math.min(want, words.length));
      g.target = rt.pick(words);
      g.options = rt.shuffle(words.filter(word => word !== g.target)).slice(0, n - 1).concat(g.target);
      g.prompt = place === 'lamp' ? `Set the stone that says ${g.target}.` : place === 'stack' ? `Drop the block that says ${g.target}.` : place === 'bust' ? `Bust the ghost that says ${g.target}.` : place === 'lily' ? `Hop to the pad that says ${g.target}.` : place === 'cube' ? `Touch the cube that says ${g.target}.` : place === 'mole' ? `Whack the mole that says ${g.target}.` : place === 'hop' ? `Hop on the word ${g.target}.` : place === 'toast' ? `Pop the toast that says ${g.target}.` : place === 'aisle' ? `Find the word ${g.target} in the market.` : place === 'glide' ? `Grab the gem that says ${g.target}.` : place === 'rally' ? `Which one says ${g.target}?` : place === 'walk' ? `Walk to the word ${g.target}.` : `Eat the berries that say ${g.target}.`;
      g.render = x => esc(x);
      g.tokens = tokenList(rt.shuffle(g.options), g.target);
      return { choices: g.tokens };
    }
    if (kind === 'shapes') {
      g.subject = 'shapes';
      const { ss } = rt.pools(rt.skillLevel('shapes'));
      const n = Math.max(2, Math.min(want, ss.length));
      g.target = rt.pick(ss);
      g.options = rt.shuffle(ss.filter(name => name !== g.target)).slice(0, n - 1).concat(g.target);
      g.prompt = place === 'lamp' ? `Set the ${g.target} stone.` : place === 'stack' ? `Drop the ${g.target} block.` : place === 'bust' ? `Bust the ${g.target} ghost.` : place === 'lily' ? `Hop to the ${g.target}.` : place === 'cube' ? `Touch the ${g.target} cube.` : place === 'mole' ? `Whack the ${g.target} mole.` : place === 'hop' ? `Hop on the ${g.target}.` : place === 'toast' ? `Pop the ${g.target} toast.` : place === 'aisle' ? `Find the ${g.target} in the market.` : place === 'glide' ? `Grab the ${g.target} gem.` : place === 'rally' ? `Which one is the ${g.target}?` : place === 'walk' ? `Walk to the ${g.target}.` : `Eat the ${g.target} berries.`;
      g.render = x => rt.shape(x);
      g.tokens = tokenList(rt.shuffle(g.options), g.target).map(token => ({ ...token, shape: token.label, fill: '#5d7a45' }));
      return { choices: g.tokens };
    }
    if (kind === 'colors') {
      g.subject = 'colors';
      const { cs } = rt.pools(rt.skillLevel('colors'));
      const n = Math.max(2, Math.min(want, cs.length));
      const target = rt.pick(cs);
      g.target = target[0];
      const mixed = rt.shuffle(rt.shuffle(cs.filter(color => color[0] !== target[0])).slice(0, n - 1).concat([target]));
      g.options = mixed.map(color => color[0]);
      g.prompt = place === 'lamp' ? `Set the ${g.target} stone.` : place === 'stack' ? `Drop the ${g.target} block.` : place === 'bust' ? `Bust the ${g.target} ghost.` : place === 'lily' ? `Hop to ${g.target}.` : place === 'cube' ? `Touch the ${g.target} cube.` : place === 'mole' ? `Whack the ${g.target} mole.` : place === 'hop' ? `Hop on ${g.target}.` : place === 'toast' ? `Pop the ${g.target} toast.` : place === 'aisle' ? `Find ${g.target} in the market.` : place === 'glide' ? `Grab the ${g.target} gem.` : place === 'rally' ? `Which one is ${g.target}?` : place === 'walk' ? `Walk to ${g.target}.` : `Eat the ${g.target} berries.`;
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
    g.tokens = tokenList(rt.shuffle(g.options), g.target);
    if (place === 'glide') g.prompt = `${g.prompt} Grab that gem.`;
    if (place === 'lily') g.prompt = `${g.prompt} Hop to that pad.`;
    if (place === 'mole') g.prompt = `${g.prompt} Whack that mole.`;
    if (place === 'cube') g.prompt = `${g.prompt} Touch that cube.`;
    if (place === 'stack') g.prompt = `${g.prompt} Drop that block.`;
    if (place === 'lamp') g.prompt = `${g.prompt} Set that stone.`;
    if (place === 'bust') g.prompt = `${g.prompt} Bust that ghost.`;
    return { choices: g.tokens };
  }
  function rallyPrefs(profile) {
    const stage = stageOf(profile, Math.max(0, rt.data.profiles.indexOf(profile)));
    const fallback = stage === 'grade3' || stage === 'grade4'
      ? { spell: true, match: false, math: true, span: 'twelves' }
      : stage === 'preschool'
        ? { spell: false, match: true, math: true, span: 'twelves' }
        : stage === 'grade1' || stage === 'grade2'
          ? { spell: true, match: true, math: true, span: 'twelves' }
          : { spell: true, match: true, math: false, span: 'twelves' };
    const saved = profile?.rally && typeof profile.rally === 'object' ? profile.rally : {};
    const prefs = {
      spell: 'spell' in saved ? !!saved.spell : fallback.spell,
      match: 'match' in saved ? !!saved.match : fallback.match,
      math: 'math' in saved ? !!saved.math : fallback.math,
      span: ['single', 'twelves', 'wide'].includes(saved.span) ? saved.span : fallback.span
    };
    if (stage === 'preschool') prefs.spell = false;
    if (!prefs.spell && !prefs.match && !prefs.math) {
      if (stage === 'preschool') prefs.math = true;
      else prefs.spell = true;
    }
    return prefs;
  }
  function rallySpell(g, words) {
    g.subject = 'words';
    g.rallyKind = 'spell';
    g.math = null;
    g.show = '';
    g.countName = '';
    g.target = rt.pick(words);
    g.prompt = `Spell ${g.target}.`;
    g.letters = rt.shuffle([...g.target, ...distractorLetters(g.target, g.level)]);
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
    if (rt.band() !== 'grade4' || span === 'wide') {
      if (rt.band() === 'grade4' && span === 'wide') {
        const q = countQuestion('grade4', g.level, 'tap', Math.random, rt.factPool());
        g.math = q;
        g.target = q.target;
        g.prompt = q.question;
        const count = Math.max(2, Math.min(want, 4));
        g.options = choicesFor(q, count);
        g.render = x => String(x);
        g.tokens = tokenList(rt.shuffle(g.options.map(String)), String(g.target));
        return { choices: g.tokens };
      }
      loadScreenMath(g, g.level, false);
      const rest = g.options.filter(item => String(item) !== String(g.target));
      g.options = [...rest.slice(0, Math.max(0, want - 1)), g.target];
      g.tokens = tokenList(rt.shuffle(g.options.map(String)), String(g.target));
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
    g.options = rt.shuffle([...wrong.slice(0, Math.max(1, want - 1)), target]);
    g.render = x => String(x);
    g.tokens = tokenList(g.options.map(String), String(target));
    return { choices: g.tokens };
  }
  function rallyMatch(g, want) {
    const kinds = ['words', 'shapes', 'colors'].filter(kind => {
      if (kind === 'words') return rt.band() !== 'preschool' && rt.wordList().length >= 2;
      if (kind === 'shapes') return rt.pools(rt.skillLevel('shapes')).ss.length >= 2;
      return rt.band() !== 'grade4' && rt.pools(rt.skillLevel('colors')).cs.length >= 2;
    });
    const kind = kinds[Math.max(0, g.index) % Math.max(1, kinds.length)] || (rt.band() === 'preschool' ? 'shapes' : 'words');
    g.rallyKind = 'match';
    g.math = null;
    g.show = '';
    g.countName = '';
    if (kind === 'shapes') {
      g.subject = 'shapes';
      const { ss } = rt.pools(rt.skillLevel('shapes'));
      const n = Math.max(2, Math.min(want, ss.length));
      g.target = rt.pick(ss);
      g.options = rt.shuffle(ss.filter(name => name !== g.target)).slice(0, n - 1).concat(g.target);
      g.prompt = `Which one matches the ${g.target}?`;
      g.render = x => rt.shape(x);
      g.tokens = tokenList(rt.shuffle(g.options), g.target).map(token => ({ ...token, shape: token.label, fill: '#5d7a45' }));
      return { choices: g.tokens };
    }
    if (kind === 'colors') {
      g.subject = 'colors';
      const { cs } = rt.pools(rt.skillLevel('colors'));
      const n = Math.max(2, Math.min(want, cs.length));
      const target = rt.pick(cs);
      g.target = target[0];
      const mixed = rt.shuffle(rt.shuffle(cs.filter(color => color[0] !== target[0])).slice(0, n - 1).concat([target]));
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
    const words = rt.wordList();
    const n = Math.max(1, Math.min(want, words.length));
    g.target = rt.pick(words);
    g.options = rt.shuffle(words.filter(word => word !== g.target)).slice(0, n - 1).concat(g.target);
    g.prompt = `Which one matches ${g.target}?`;
    g.render = x => esc(x);
    g.tokens = tokenList(rt.shuffle(g.options), g.target);
    return { choices: g.tokens };
  }
  function rallyAsk(g) {
    const prefs = rallyPrefs(rt.p());
    const want = hopBoard(g.level).choices;
    const words = rt.spellList(g.level);
    const kinds = [];
    if (prefs.spell && words.length) kinds.push('spell');
    if (prefs.match) kinds.push('match');
    if (prefs.math) kinds.push('math');
    if (!kinds.length) kinds.push(rt.band() === 'preschool' || !words.length ? 'match' : 'spell');
    const kind = kinds[Math.max(0, g.index) % kinds.length];
    if (kind === 'spell') return rallySpell(g, words);
    if (kind === 'math') return rallyMath(g, want, prefs.span);
    return rallyMatch(g, want);
  }
  function shellAsk(g) {
    loadScreenMath(g, g.level, true);
    const rest = g.options.filter(item => String(item) !== String(g.target));
    g.options = [...rest.slice(0, 1), g.target];
    g.tokens = tokenList(rt.shuffle(g.options.map(String)), String(g.target));
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
    const g = rt.game;
    if (!g?.freePlay || !pack?.choices) return pack;
    g.prompt = prompt;
    g.show = '';
    pack.choices = pack.choices.map(choice => ({ ...choice, ok: true }));
    g.tokens = pack.choices;
    return pack;
  }
  function arcadeQuestion(mode) {
    const g = rt.game;
    if (!g || g.finished || g[`${mode}Done`]) return null;
    g.missed = false;
    g.done = false;
    return arcadePack(profileAsk(g, mode), ARCADE[mode].prompt);
  }
  function askMaze(g, kind) {
    if (!g || rt.game !== g || g.finished || g.asking) return;
    g.asking = kind;
    g.done = false;
    g.missed = false;
    g.court?.pause();
    fillPlayQuestion(g, g.level);
    g.options = rt.shuffle(g.options);
    rt.paintAsk(g);
    const line = kind === 'fall' ? 'A right answer brings you back and adds time.' : 'A right answer adds time.';
    const feedback = $('#feedback');
    if (feedback) feedback.textContent = line;
    rt.askBeforePlay(`${line} ${g.prompt}`);
  }
  function finishRun(g, title, detail) {
    rt.releaseListen();
    if (!g || g.finished) return;
    g.finished = true;
    rt.clearTimers('bridge');
    stopMarble();
    stopBridge();
    rt.clearLight();
    stopMaze();
    stopChase();
    stopHop();
    stopToast();
    stopGlide();
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
    rt.clearTimers('learn');
    rt.camOff();
    const asked = Math.max(0, g.asked || 0);
    const correct = Math.min(asked, g.firstCorrect || 0);
    if (asked > 0) {
      Object.assign(rt.p(), applyRound(rt.p(), g.mode, g.key, asked, correct));
      rt.save();
    }
    const stars = asked > 0 ? `<p>First try: ${correct} of ${asked}</p><p class="hint">+${asked} learning stars</p>` : '';
    $('#app').innerHTML = `<section class="playarea"><div class="result-star" aria-hidden="true">🌟</div><h1>${esc(title)}</h1><p>${esc(detail || '')}</p>${stars}${rt.starGardenHtml()}<button class="primary" id="again">Play again</button> <button class="quiet" id="all">Choose a game</button></section>`;
    $('#again').onclick = () => rt.start(g.mode);
    $('#all').onclick = rt.home;
    rt.say(title);
    rt.focusHeading();
  }
  function hybrid(g) {
    if (sidecarGame(g.mode)) return;
    if (g.mode === 'catch' || g.mode === 'lanes' || g.mode === 'rocket' || g.mode === 'lunar' || g.mode === 'hoop' || g.mode === 'light' || g.mode === 'race' || g.mode === 'hook' || g.mode === 'sky' || g.mode === 'planet' || g.mode === 'puzzle' || g.mode === 'match' || g.mode === 'marble' || g.mode === 'bridge' || g.mode === 'maze' || g.mode === 'chase' || g.mode === 'hop' || g.mode === 'toast' || g.mode === 'glide' || g.mode === 'aisle' || g.mode === 'lily' || g.mode === 'mole' || g.mode === 'bust' || g.mode === 'stack' || g.mode === 'lamp' || g.mode === 'cube' || g.mode === 'trace' || g.mode === 'sort' || g.mode === 'merge' || g.mode === 'crayon') return;
    const t = g.target, [verb, icon] = rt.pick(rt.moves);
    g.icon = icon;
    if (g.mode === 'count' || g.mode === 'path') { mathHybrid(g, verb); return; }
    if (g.style === 'move' && g.mode !== 'missing') {
      g.prompt = {
        shapes: `${verb} to the ${t}!`,
        colors: `${verb} to ${t}!`,
        mix: g.target2 ? `${verb} to the ${t}, then ${rt.pick(rt.moves)[0].toLowerCase()} to the ${g.target2}!` : `${verb} to the ${t}!`,
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
        shapes: `Find something shaped like ${rt.an(t)} ${t}!`,
        colors: `Find something ${t}!`,
        mix: `Find something ${c}. Then find something shaped like ${rt.an(s || '')} ${s}!`,
        words: `Find the word “${t}” in a book, on a box, or on a sign!`,
        build: t.length > 1 ? `Find each letter of “${t}” in a book or on a sign. Say each one!` : `Find the letter “${t}” in a book or on a sign!`
      }[g.mode];
    }
  }
  function mathHybrid(g, verb) {
    const t = g.target, floor = g.math?.floor !== false;
    if (g.math?.grade) {
      g.options = rt.shuffle(g.options);
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
      const [one, many] = rt.pick(rt.huntPool());
      g.icon = '🔎';
      g.show = '';
      g.prompt = `Bring me ${t} ${t === 1 ? one : many}! Count them out loud.`;
    }
  }
  function wordHidden(g) {
    if (!g || g.level < 2 || !rt.data.sound || !canSpeak() || g.shown) return false;
    if (NO_WORD.has(g.mode)) return false;
    if (SUBJECT_WORDS.has(g.mode)) return g.subject === 'words';
    if (g.mode === 'race') return g.kind === 'words';
    return !!rt.listen[g.mode];
  }
  const heading = g => {
    if ((g?.mode === 'rally' || g?.mode === 'flight' || g?.mode === 'bike') && g.rallyKind === 'spell') {
      if (rt.data.sound && canSpeak()) return g.mode === 'flight' ? 'Fly through the letters in order.' : 'Spell the word.';
      return g.prompt;
    }
    if (!wordHidden(g)) return g.prompt;
    return rt.listenBy[g.mode]?.[g.style] || rt.listen[g.mode];
  };
  function foundLine(g) {
    if (g.mode === 'lunar' || g.mode === 'hoop') return g.streak >= 3 ? `Swish! ${g.streak} in a row.` : 'Swish!';
    if (g.mode === 'light') return g.streak >= 3 ? `Amazing! ${g.streak} in a row.` : 'Amazing!';
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
    if (g.mode === 'mole') return g.subject === 'shapes' || g.subject === 'colors' ? `You whacked the ${g.target} mole.` : `You whacked ${g.target}.`;
    if (g.mode === 'cube') return g.subject === 'words' ? `You touched the cube that says ${g.target}.` : g.subject === 'shapes' || g.subject === 'colors' ? `You touched the ${g.target} cube.` : `You touched ${g.target}.`;
    if (g.mode === 'bust') return g.subject === 'shapes' || g.subject === 'colors' ? `You busted the ${g.target} ghost.` : `You busted ${g.target}.`;
    if (g.mode === 'stack') return g.subject === 'shapes' || g.subject === 'colors' ? `You stacked the ${g.target}.` : `You stacked ${g.target}.`;
    if (g.mode === 'lamp') return g.subject === 'shapes' || g.subject === 'colors' ? `You set the ${g.target} stone.` : `You set ${g.target}.`;
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
    if (g.mode === 'quickmath') return 'Pick a mission. Answer as many as you can in three minutes.';
    if (g.mode === 'paint') return 'Paint the half with the right answer.';
    if (g.mode === 'walk') return g.subject === 'words' ? 'Listen for the word, then walk to it.' : 'Walk to the one that matches.';
    if (g.mode === 'flight') return g.rallyKind === 'spell' ? 'Listen for the word, then fly through each letter or type it.' : 'Steer through the gate that matches.';
    if (g.mode === 'chase' || g.mode === 'hop' || g.mode === 'toast' || g.mode === 'aisle' || g.mode === 'lily' || g.mode === 'mole' || g.mode === 'bust' || g.mode === 'stack' || g.mode === 'lamp' || g.mode === 'cube' || g.mode === 'glide' || g.mode === 'rally' || g.mode === 'bike') {
      if (g.subject === 'words') {
        if (g.mode === 'chase') return 'Listen for the word, then eat those berries.';
        if (g.mode === 'toast') return 'Listen for the word, then pop that toast.';
        if (g.mode === 'aisle') return 'Listen for the word, then tap the arrows and pick it up.';
        if (g.mode === 'lily') return 'Listen for the word, then hop to that pad.';
        if (g.mode === 'mole') return 'Listen for the word, then whack that mole.';
        if (g.mode === 'cube') return 'Listen for the word, then touch that cube.';
        if (g.mode === 'bust') return 'Listen for the word, then bust that ghost.';
        if (g.mode === 'stack') return 'Listen for the word, then drop that block.';
        if (g.mode === 'lamp') return 'Listen for the word, then set that stone.';
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
      if (g.mode === 'aisle') return 'Tap the arrows. Pick up the right number before time runs out.';
      if (g.mode === 'lily') return 'Hop to the pad with the right number.';
      if (g.mode === 'mole') return 'Whack the mole with the right number.';
      if (g.mode === 'cube') return 'Touch the cube with the right number.';
      if (g.mode === 'bust') return 'Bust the ghost with the right number.';
      if (g.mode === 'stack') return 'Drop the block with the right number.';
      if (g.mode === 'lamp') return 'Set the stone with the right number.';
      if (g.mode === 'glide') return 'Grab the gem with the right number.';
      if (g.mode === 'rally') return g.rallyKind === 'math' ? 'Work out the fact, then tap that number.' : 'Tap the one that matches. A right answer turbos the car.';
      if (g.mode === 'bike') return g.rallyKind === 'math' ? 'Work out the fact, then tap that number.' : 'Tap the one that matches. A right answer says good, and the ride continues.';
      return 'Hop on the right number.';
    }
    if (g.mode === 'light') return g.pace === 'rush' ? 'Each catch makes the light faster.' : 'Tap when the yellow light is on the right answer.';
    if (g.mode === 'build') return 'Say the word, then find the next letter.';
    if (g.mode === 'words' || g.mode === 'lanes' || ((g.mode === 'rocket' || g.mode === 'lunar' || g.mode === 'hook' || g.mode === 'sky' || g.mode === 'planet' || g.mode === 'bridge' || g.mode === 'maze') && g.subject === 'words')) return 'Listen for the word, then find it.';
    if (g.mode === 'colors') return 'Look at the colors.';
    if (g.mode === 'puzzle') return 'Look at the whole puzzle, then tap its name or say it.';
    if (g.mode === 'match') return 'Turn two cards that look the same.';
    if (g.mode === 'trace') return 'Start at the dot and stay on the line.';
    if (g.mode === 'sort') return 'Tap a tube to lift the top balls. Pour them onto the same kind, or into an empty tube.';
    if (g.mode === 'merge') return 'Drop two that are the same so they touch.';
    if (g.mode === 'crayon') {
      if (g.phase === 'pick') return 'Pick the picture you want to color.';
      return `${g.swatch?.number} is ${g.swatch?.name}. Tap matching spots to fill them.`;
    }
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
      shapes: `Ask: where else can you see ${rt.an(t)} ${t}?`,
      colors: `Ask: what else around you is ${t}?`,
      mix: `Ask: what other things are ${c}?`,
      missing: 'Ask: how did you remember?',
      words: `Ask them to read “${t}” to you and use it in a sentence.`,
      build: `Ask: what sound does “${t[0]}” make?`,
      puzzle: `Ask: what makes this a ${t}?`
    }[g.mode];
  }
  function makeRaceGate(g) {
    const level = g.level;
    const kinds = raceKinds(rt.p().race).filter(kind => {
      if (kind === 'words') return rt.band() !== 'preschool' && rt.wordList().length >= 2;
      if (kind === 'shapes') return rt.pools(rt.skillLevel('shapes')).ss.length >= 2;
      if (kind === 'colors') return rt.band() !== 'grade4' && rt.pools(rt.skillLevel('colors')).cs.length >= 2;
      return true;
    });
    const usable = kinds.length ? kinds : (rt.band() === 'grade4' ? ['facts', 'shapes'] : ['facts', 'shapes', 'colors']);
    const pool = usable.filter(kind => kind !== g.lastKind);
    const kind = rt.pick(pool.length ? pool : usable);
    if (kind === 'words') {
      const words = rt.wordList();
      const count = Math.max(2, Math.min(laneCount(level, words.length) || 2, words.length));
      const target = rt.pick(words);
      const shown = rt.shuffle(words.filter(word => word !== target).slice(0, count - 1).concat(target));
      return { kind, prompt: `Drive to the word ${target}.`, target, show: '', options: shown.map(label => ({ label })), answer: shown.indexOf(target) };
    }
    if (kind === 'shapes') {
      const { ss } = rt.pools(rt.skillLevel('shapes'));
      const count = Math.max(2, Math.min(laneCount(level, ss.length) || 2, ss.length));
      const target = rt.pick(ss);
      const shown = rt.shuffle(ss.filter(shapeName => shapeName !== target).slice(0, count - 1).concat(target));
      return { kind, prompt: `Drive to the ${target}.`, target, show: '', options: shown.map(label => ({ label, shape: label, fill: '#8fac73' })), answer: shown.indexOf(target) };
    }
    if (kind === 'colors') {
      const { cs } = rt.pools(rt.skillLevel('colors'));
      const count = Math.max(2, Math.min(laneCount(level, cs.length) || 2, cs.length));
      const target = rt.pick(cs);
      const shown = rt.shuffle(cs.filter(color => color[0] !== target[0]).slice(0, count - 1).concat([target]));
      return { kind, prompt: `Drive to ${target[0]}.`, target: target[0], show: '', options: shown.map(([label, fill]) => ({ label, fill, swatch: true })), answer: shown.findIndex(color => color[0] === target[0]) };
    }
    const stage = rt.band();
    const [item, name] = rt.pick(rt.countPool());
    const usePath = stage !== 'grade4' && Math.random() < 0.5;
    const q = usePath ? pathQuestion(stage, level, Math.random, rt.factPool()) : countQuestion(stage, level, 'tap', Math.random, rt.factPool());
    const shown = rt.raceLabels(q, level);
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
    const g = rt.game;
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
  function answer(ok, b) {
    const g = rt.game;
    if (!g || g.done || g.flightOver) return;
    if (g.mode === 'rocket') { rt.resolveRocket(ok, b); return; }
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
      rt.say(line);
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
        rt.say(line);
        g.court?.play({ easy: false });
        return;
      }
      if (g.mode === 'puzzle') {
        rt.stopEars();
        const line = g.heard ? `I heard ${g.heard}. Look again.` : 'Look again.';
        $('#feedback').textContent = line;
        rt.say(line);
        const again = $('#sayShape');
        if (again) { again.disabled = false; again.textContent = 'Say the shape'; }
        rt.showHint();
        return;
      }
      $('#feedback').textContent = 'Keep exploring. Try another one!';
      rt.say('Try another one.');
      rt.showHint();
      return;
    }
    g.done = true;
    if (g.mode === 'puzzle') {
      rt.stopEars();
      const box = $('#puzzleSay');
      if (box) box.hidden = true;
    }
    if (g.mode === 'bridge') {
      document.querySelectorAll('#askChoices .choice').forEach(el => { el.disabled = true; });
      if (b?.classList.contains('choice')) b.classList.add('correct');
      if (!g.missed) g.firstCorrect++;
      const line = 'Hold to grow the bridge. The landing is wide.';
      $('#feedback').textContent = line;
      rt.say(line);
      g.court?.play({ easy: true });
      return;
    }
    $('#help')?.remove();
    if (!g.missed) g.firstCorrect++;
    const found = foundLine(g);
    $('#feedback').textContent = found;
    rt.say(found);
    if (g.mode === 'lanes') {
      g.laneClears = (g.laneClears || 0) + 1;
      rt.continueAfter('lane', g, 1700, 800, 400);
      return;
    }
    if (g.mode === 'hook') {
      rt.continueAfter('hook', g, 1600, 700);
      return;
    }
    if (g.mode === 'sky') {
      rt.continueAfter('sky', g, 1600, 700);
      return;
    }
    if (g.mode === 'planet') {
      rt.continueAfter('planet', g, 1600, 700);
      return;
    }
    if (g.mode === 'chase') {
      rt.continueAfter('chase', g, 1500, 650);
      return;
    }
    if (g.mode === 'match') {
      rt.continueAfter('match', g, 1400, 600);
      return;
    }
    if (g.mode === 'trace' || g.mode === 'sort' || g.mode === 'merge' || g.mode === 'crayon') {
      rt.continueAfter('learn', g, 1400, 600);
      return;
    }
    if (b?.classList.contains('choice')) b.classList.add('correct');
    if ((g.style === 'move' || g.style === 'hunt') && g.mode !== 'catch' && g.mode !== 'lanes' && g.mode !== 'rocket' && g.mode !== 'lunar' && g.mode !== 'hoop' && g.mode !== 'hook' && g.mode !== 'sky' && g.mode !== 'planet' && g.mode !== 'puzzle') $('#feedback').insertAdjacentHTML('afterend', `<p class="hint">Grown-up: ${esc(tip(g))}</p>`);
    $('#next').hidden = false;
    document.querySelectorAll('.choice,.confirm,.steer-btn').forEach(x => { x.disabled = true; });
    $('#next').focus();
  }
  function finishRace(result) {
    rt.clearTimers('lane', 'rocket');
    stopArcade();
    rt.stopLunar();
    stopHoop();
    const g = rt.game;
    if (!g || g.finished) return;
    g.finished = true;
    rt.camOff();
    const distance = Math.max(0, Math.round(+result?.distance || 0));
    const gates = Math.max(0, result?.correct | 0);
    const faced = Math.max(1, gates + (result?.reason === 'wrong' ? 1 : 0));
    Object.assign(rt.p(), applyRound(rt.p(), 'race', g.key, faced, gates));
    const board = raceBoard(rt.loadBoard(), { name: rt.p().name, distance, at: Date.now() });
    rt.saveBoard(board.list);
    rt.save();
    const why = result?.reason === 'wrong' ? `That lane was not the answer. It was ${g.target}.` : 'The tank ran out.';
    const mark = distance >= board.best
      ? (board.rank === 1 ? 'Furthest on this device.' : `Best for ${rt.p().name}. Number ${board.rank} on this device.`)
      : `Best for ${rt.p().name} is ${board.best} m.`;
    $('#app').innerHTML = `<section class="playarea"><div class="result-star" aria-hidden="true">⛽</div><h1>You drove ${distance} m.</h1><p>${esc(why)}</p><p>${gates} right ${gates === 1 ? 'answer' : 'answers'}. ${esc(mark)}</p><p class="hint">+${faced} learning stars</p>${rt.raceBoardHtml(board.list)}${rt.starGardenHtml()}<button class="primary" id="again">Drive again</button> <button class="quiet" id="all">Choose a game</button></section>`;
    $('#again').onclick = () => rt.start('race');
    $('#all').onclick = rt.home;
    rt.say(`You drove ${distance} meters.`);
    rt.focusHeading();
  }
  function finish(detail) {
    rt.releaseListen();
    rt.clearTimers('lane', 'hook', 'sky', 'planet', 'match');
    stopArcade();
    rt.stopLunar();
    stopHoop();
    stopHook();
    stopSky();
    stopPlanet();
    stopPuzzle();
    stopMatch();
    stopMarble();
    stopBridge();
    rt.clearLight();
    stopMaze();
    stopChase();
    stopHop();
    stopToast();
    stopGlide();
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
    rt.clearTimers('learn', 'chase', 'hop', 'toast', 'glide', 'aisle', 'lily', 'bust', 'mole', 'cube', 'stack', 'lamp', 'rally');
    rt.stopEars();
    const g = rt.game;
    g.finished = true;
    rt.camOff();
    const flightEnd = g.mode === 'flight' && (detail === 'crash' || detail === 'flew');
    const stageEnd = g.mode === 'rally' && detail === 'stage';
    const rounds = flightEnd ? (g.flightRights || 5) : stageEnd ? Math.max(1, g.index || g.rallyRights || 1) : rt.questionCount();
    Object.assign(rt.p(), applyRound(rt.p(), g.mode, g.key, rounds, g.firstCorrect));
    rt.save();
    const dots = Array.from({ length: rounds }, (_, i) => `<span class="${i < g.firstCorrect ? 'on' : ''}"></span>`).join('');
    const played = rounds === 1 ? 'You played 1 question.' : `You played ${rounds}.`;
    const heading = flightEnd ? (detail === 'crash' ? 'Game over.' : 'You flew for 2 minutes.') : stageEnd ? 'You finished the stage.' : played;
    const note = flightEnd && detail === 'crash' ? 'The plane hit the ground.' : stageEnd ? `${g.rallyRights || 0} right along the road` : 'First try';
    const spoken = flightEnd ? (detail === 'crash' ? 'Game over. The plane hit the ground.' : 'You flew for 2 minutes.') : stageEnd ? 'You finished the stage.' : played;
    const stars = rounds === 1 ? '+1 learning star' : `+${rounds} learning stars`;
    $('#app').innerHTML = `<section class="playarea"><div class="result-star" aria-hidden="true">${flightEnd && detail === 'crash' ? '✈' : '🌟'}</div><h1>${heading}</h1><p>${note}</p><div class="dots" aria-label="${g.firstCorrect} of ${rounds} first tries">${dots}</div><p class="hint">${stars}</p>${rt.starGardenHtml()}<button class="primary" id="again">Play again</button> <button class="quiet" id="all">Choose a game</button></section>`;
    $('#again').onclick = () => rt.start(g.mode);
    $('#all').onclick = rt.home;
    rt.say(spoken);
    rt.focusHeading();
  }
  Object.assign(rt, {
    heading
  });
}
