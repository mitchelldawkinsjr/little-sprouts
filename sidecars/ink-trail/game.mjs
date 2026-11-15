import { buddyKind } from '../../lib/buddy2d.mjs?v=gear2';
import { BOSS_EMOJI, DEFAULT_BOSS, bossName, readBoss } from '../../lib/boss-design.mjs';
import { makeBossBuilder } from '../../lib/boss-builder.mjs';
import { actionDown, moveDirs, nextIndex, readPad } from '../../lib/pad-core.mjs?v=pad-map1';
import { localQuestion, normalizeQuestion, LOCAL_ROUND } from '../roll/quiz.mjs?v=roll1';
import { COUNT_IN, answer, makeRun, resumeCaught, stepRun } from './logic.mjs';
import { makeView } from './view.mjs';

const $ = id => document.getElementById(id);
const embedded = parent !== window;
const SOURCE = 'sprouts-sidecar';
const send = (type, extra = {}) => {
  if (embedded) parent.postMessage({ source: SOURCE, type, ...extra }, location.origin);
};
const panel = $('panel'), builder = $('builder'), question = $('question');
const canvas = $('trail');
const view = makeView(canvas, $('creature'), $('preview-spot'));
const keys = new Set();
const tried = new Set();
const point = { id: null, y: .5 };
const driveKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
let design = readBoss() || DEFAULT_BOSS;
let run = makeRun();
let buddy = buddyKind();
let playMode = embedded ? null : 'learning';
let buddySound = true;
let level = 1;
let finishedQuestions = 0;
let total = LOCAL_ROUND;
let current = null;
let activeQuestion = null;
let pending = -1;
let screen = 'menu';
let count = 0;
let countMessage = '';
let pausedCount = 0;
let pausedMessage = '';
let target = .5;
let statusFor = 0;
let lastTime = performance.now();
let elapsed = 0;
let padX = 0, padY = 0, padAction = false, padPause = false, padFocus = null;
let arcadeBest = 0;

const BEST_KEY = 'sprouts-ink-trail-best-v1';
try { arcadeBest = Number(localStorage.getItem(BEST_KEY)) || 0; } catch { /* storage off */ }
const meters = () => Math.floor(run.distance / 10);

function status(line, seconds = 2) {
  $('status').textContent = line;
  $('status').hidden = !line;
  statusFor = seconds;
}

function focusButton(el) { el?.focus({ preventScroll: true }); }

function clearPen() {
  keys.clear();
  point.id = null;
}

function setScreen(name) {
  screen = name;
  panel.hidden = !['menu', 'pause', 'caught', 'win'].includes(name);
  builder.hidden = name !== 'build';
  question.hidden = name !== 'question';
  $('hud').hidden = ['menu', 'build'].includes(name);
  $('pause').disabled = name !== 'run' && name !== 'count';
  $('tip').hidden = name !== 'run';
  $('count').hidden = name !== 'count';
  view.setPreview(name === 'build');
}

function menu({ tag, title, intro, play, action, build = false, endless = false, info = '' }) {
  $('eyebrow').textContent = tag;
  $('title').textContent = title;
  $('intro').textContent = intro;
  $('menu-boss').textContent = info;
  $('menu-boss').hidden = !info;
  $('play').disabled = !action;
  $('play').textContent = play;
  $('play').onclick = action;
  $('build').hidden = !build;
  $('endless').hidden = !endless;
  $('help').hidden = !build;
}

function home() {
  clearPen();
  setScreen('menu');
  menu({
    tag: 'Little Sprouts · Run & Draw', title: 'Ink Trail',
    intro: 'Draw a glowing trail for your garden buddy. Keep the ink flowing and don’t let your boss catch up!',
    play: !playMode ? 'Getting ready…' : playMode === 'arcade' ? 'Start drawing' : 'Start learning run',
    action: playMode ? () => start(playMode) : null, build: true, endless: !embedded,
    info: `${BOSS_EMOJI[design.head]} ${bossName(design)}`
  });
}

const bossBuilder = makeBossBuilder({
  presets: $('presets'), picks: $('parts'), name: $('boss-name'), surprise: $('surprise'), done: $('done'),
  onChange(next) { view.setBoss(next); },
  onSave(next) {
    design = next;
    view.setBoss(design);
    home();
    focusButton($('build'));
  }
});

$('build').onclick = () => {
  view.setBoss(bossBuilder.set(design));
  setScreen('build');
  focusButton($('presets').querySelector('button'));
};
$('endless').onclick = () => start('arcade');

function countdown(message, seconds = COUNT_IN) {
  clearPen();
  count = seconds;
  countMessage = message;
  $('count-line').textContent = message;
  $('number').textContent = String(Math.ceil(count));
  setScreen('count');
  focusButton(canvas);
}

function start(mode) {
  finishedQuestions = 0;
  activeQuestion = null;
  tried.clear();
  run = makeRun({ learning: mode === 'learning', level });
  target = run.penY;
  status('');
  countdown('Get your pen ready!');
}

function pause() {
  if (screen !== 'run' && screen !== 'count') return;
  pausedCount = screen === 'count' ? count : 0;
  pausedMessage = countMessage;
  clearPen();
  setScreen('pause');
  menu({
    tag: 'Pen down', title: 'Taking a break?', intro: 'Your garden buddy and boss will wait.',
    play: 'Keep drawing', action: () => countdown(pausedCount ? pausedMessage : 'Get your pen ready!', pausedCount || COUNT_IN)
  });
  focusButton($('play'));
}
$('pause').onclick = pause;

function localAsk() {
  const raw = localQuestion(Math.random, finishedQuestions);
  raw.prompt = raw.prompt.replace(/ Roll to that answer\.$/, '').replace(/^Roll to (.*?)\.$/, 'Which one is $1?');
  return normalizeQuestion(raw);
}

function replay() {
  if (embedded) send('replay');
  else if (buddySound && 'speechSynthesis' in window) {
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(activeQuestion.prompt));
  }
}
$('hear').onclick = replay;

const shapes = new Set(['circle', 'triangle', 'square', 'oval', 'rectangle', 'star', 'diamond', 'hexagon']);
function optionButton(choice) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.index = choice.index;
  if (choice.fill || shapes.has(choice.shape)) {
    const swatch = document.createElement('span');
    swatch.classList.add('swatch');
    if (shapes.has(choice.shape)) swatch.classList.add(choice.shape);
    swatch.style.setProperty('--fill', /^#[\da-f]{3,8}$/i.test(choice.fill) ? choice.fill : '#82d2b8');
    button.append(swatch);
  }
  button.append(document.createTextNode(choice.label));
  button.onclick = () => pick(choice.index);
  if (tried.has(choice.index)) {
    button.classList.add('wrong');
    button.disabled = true;
  }
  return button;
}

function openQuestion() {
  if (embedded && (!current || current.round !== finishedQuestions)) {
    // A checkpoint stays frozen until the host's next card arrives.
    clearPen();
    countdown('Waiting for your question…', .25);
    send('need');
    return;
  }
  activeQuestion = embedded ? current : (activeQuestion || localAsk());
  pending = -1;
  clearPen();
  setScreen('question');
  $('checkpoint').textContent = `Ink checkpoint · ${finishedQuestions + 1} of ${total}`;
  $('prompt').textContent = activeQuestion.prompt;
  // show is the same trusted, same-origin math markup used by the host.
  $('show').innerHTML = activeQuestion.show || '';
  $('choices').replaceChildren(...activeQuestion.choices.map(optionButton));
  $('hear').hidden = !buddySound || (!embedded && !('speechSynthesis' in window));
  focusButton($('choices').querySelector('button:not(:disabled)'));
  if (embedded) send('show');
}

function pick(index) {
  if (screen !== 'question' || pending !== -1 || tried.has(index)) return;
  const choice = activeQuestion.choices[index];
  if (!choice) return;
  pending = index;
  $('choices').querySelectorAll('button').forEach(button => { button.disabled = true; });
  if (embedded) send('pick', { index });
  else mark(choice.ok, index);
}

function mark(ok, index) {
  if (screen !== 'question' || pending === -1 || pending !== index) return;
  pending = -1;
  if (ok) {
    finishedQuestions++;
    activeQuestion = null;
    tried.clear();
  } else tried.add(index);
  answer(run, ok, ok && finishedQuestions >= total);
  countdown(ok ? 'Nice! Golden ink boost!' : 'Oops! Wobbly ink ahead. Keep drawing!');
}

function caught() {
  clearPen();
  setScreen('caught');
  status('');
  if (run.learning) {
    menu({
      tag: 'The boss caught up!', title: 'Shake it off!',
      intro: 'Your garden buddy gets another chance. Keep drawing from right here.',
      play: 'Keep drawing', action: () => {
        resumeCaught(run);
        target = run.penY;
        countdown('A fresh trail!');
      },
      info: `${meters()} m · ${finishedQuestions} of ${total} answered`
    });
  } else {
    arcadeBest = Math.max(arcadeBest, meters());
    try { localStorage.setItem(BEST_KEY, String(arcadeBest)); } catch { /* storage off */ }
    menu({
      tag: 'Arcade play', title: 'The boss caught up!', intro: 'Try a new line and see how far your buddy can go.',
      play: 'Draw again', action: () => start('arcade'), build: true,
      info: `${meters()} m · Best ${arcadeBest} m`
    });
  }
  focusButton($('play'));
}

function win() {
  clearPen();
  setScreen('win');
  status('');
  menu({
    tag: 'Ink Trail complete', title: 'You got away!', intro: 'Your garden buddy is safe. Great drawing!',
    play: embedded ? 'See my stars' : 'Draw again', action: embedded ? () => {
      $('play').disabled = true;
      send('finish', { detail: 'escape' });
    } : () => start('learning'),
    info: `${meters()} m · ${finishedQuestions} of ${total} answered`
  });
  focusButton($('play'));
}

addEventListener('message', event => {
  if (!embedded || event.source !== parent || event.origin !== location.origin || event.data?.source !== SOURCE) return;
  const msg = event.data;
  if (msg.type === 'ask') {
    const next = normalizeQuestion(msg);
    if (!next) return;
    current = { ...next, show: typeof msg.show === 'string' ? msg.show : '' };
    buddy = buddyKind(msg.buddy);
    buddySound = msg.sound !== false;
    total = next.total || total;
    level = Math.max(1, Math.min(3, Number(msg.level) || 1));
    const first = !playMode;
    playMode = 'learning';
    if (first && screen === 'menu') home();
  } else if (msg.type === 'arcade') {
    const first = !playMode;
    playMode = 'arcade';
    if (first && screen === 'menu') home();
  } else if (msg.type === 'mark') mark(msg.ok === true, msg.index);
});

function pointerMove(event) {
  if (event.pointerId !== point.id) return;
  point.y = view.targetY(event.clientY);
}
canvas.addEventListener('pointerdown', event => {
  if (!['run', 'count'].includes(screen) || event.button !== 0 || point.id !== null) return;
  point.id = event.pointerId;
  // The host controller may dispatch synthetic pointer events with no capturable pointer.
  try { canvas.setPointerCapture(event.pointerId); } catch { /* synthetic input */ }
  pointerMove(event);
});
canvas.addEventListener('pointermove', pointerMove);
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  canvas.addEventListener(name, event => { if (event.pointerId === point.id) point.id = null; });
}
addEventListener('keydown', event => {
  if (!event.repeat && ['Escape', 'KeyP'].includes(event.code) && ['run', 'count'].includes(screen)) {
    event.preventDefault();
    pause();
  }
  if (!driveKeys.includes(event.code) || !['run', 'count'].includes(screen) || event.target?.closest?.('button')) return;
  event.preventDefault();
  keys.add(event.code);
});
addEventListener('keyup', event => keys.delete(event.code));
addEventListener('blur', clearPen);

function readController() {
  if (embedded) return { y: 0, draw: false };
  const pad = readPad(Array.from(navigator.getGamepads?.() || []).find(Boolean));
  const { x, y } = moveDirs(pad);
  const act = actionDown(pad, padAction);
  const startButton = pad.start >= .5;
  if (startButton && !padPause) {
    if (screen === 'pause') $('play').click();
    else pause();
  }
  const buttons = [...document.querySelectorAll('[data-pad-menu]:not([hidden]) button')].filter(b => !b.disabled && !b.hidden);
  if (buttons.length) {
    let index = buttons.indexOf(padFocus);
    if (((x && x !== padX) || (y && y !== padY)) && index >= 0) {
      index = nextIndex(buttons.map(b => {
        const r = b.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      }), index, { x, y });
    }
    if ((x || y || act) && (padFocus !== buttons[Math.max(0, index)] || document.activeElement !== padFocus)) {
      padFocus = buttons[Math.max(0, index)];
      focusButton(padFocus);
    }
    if (act && !padAction) padFocus?.click();
  }
  padX = x; padY = y; padAction = act; padPause = startButton;
  return { y, draw: act || !!x || !!y };
}

function tick(now) {
  const dt = Math.min(.08, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  const controller = readController();
  const up = keys.has('ArrowUp');
  const down = keys.has('ArrowDown');
  const dir = controller.y || (+down - +up);
  const drawing = point.id !== null || keys.size > 0 || controller.draw;
  if (point.id !== null) target = point.y;
  else if (dir) target = Math.max(.12, Math.min(.86, target + dir * dt * .9));
  if (screen === 'count') {
    count -= dt;
    const number = String(Math.max(1, Math.ceil(count)));
    if ($('number').textContent !== number) $('number').textContent = number;
    if (count <= 0) {
      if (run.phase === 'question') openQuestion();
      else {
        setScreen('run');
        if (run.boost > 0) status('✦ Golden ink boost!', run.boost);
        else if (run.wobble > 0) status('~ Wobbly ink! Keep drawing.', run.wobble);
      }
    }
  } else if (screen === 'run') {
    for (const event of stepRun(run, dt, { target, drawing })) {
      if (event === 'question') openQuestion();
      if (event === 'caught') caught();
      if (event === 'finish') win();
      if (event === 'dot') status('✦ Ink drop! The boss fell back.');
      if (event === 'wash') status('Splash! Draw around the puddles.');
    }
    if (screen === 'run' && !drawing && !run.onInk && statusFor <= 0) status('Hold and drag to keep the ink flowing.', 1.5);
    $('distance').textContent = `${meters()} m`;
    $('score').textContent = `💧 ${run.dots}`;
    $('gap').value = run.gap;
    $('chase-label').textContent = run.gap < 48 ? 'Boss is close!' : 'Boss behind';
  }
  if (statusFor > 0 && (statusFor -= dt) <= 0) status('');
  elapsed += dt;
  view.paint(run, buddy, screen === 'run' ? run.time : (['menu', 'build'].includes(screen) ? elapsed : run.time), drawing, target);
  requestAnimationFrame(tick);
}

view.setBoss(design);
home();
if (embedded) {
  send('ready');
  const nudge = setInterval(() => {
    if (playMode) clearInterval(nudge);
    else send('need');
  }, 1200);
}
requestAnimationFrame(tick);
