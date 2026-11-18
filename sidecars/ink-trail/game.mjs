import { sfx } from '../../lib/game-sound.mjs?v=audio2';
import { buddyKind } from '../../lib/buddy3d.mjs?v=gear2';
import { BOSS_EMOJI, DEFAULT_BOSS, bossName, readBoss } from '../../lib/boss-design.mjs';
import { makeBossBuilder } from '../../lib/boss-builder.mjs';
import { BOSS_CHOMP_SECONDS } from '../../lib/boss-catch.mjs';
import { actionDown, moveDirs, nextIndex, readPad } from '../../lib/pad-core.mjs?v=pad-map1';
import { attachTouchControls, isTouchDevice } from '../../lib/touch-controls.mjs?v=touch3';
import { localQuestion, normalizeQuestion, LOCAL_ROUND } from '../roll/quiz.mjs?v=roll1';
import { CHASE_RANGE, COUNT_IN, answer, bossDistance, makeRun, nearestBoss, penStickDirection, resumeCaught, stepRun } from './logic.mjs';
import { makeView } from './view.mjs';

const $ = id => document.getElementById(id);
const embedded = parent !== window;
const SOURCE = 'sprouts-sidecar';
const send = (type, extra = {}) => {
  if (embedded) parent.postMessage({ source: SOURCE, type, ...extra }, location.origin);
};
const panel = $('panel'), builder = $('builder'), question = $('question');
const canvas = $('trail');
let touchDevice = isTouchDevice();
const touch = attachTouchControls({
  tint: '#a4f8ff',
  // Use the shared stick's full playfield. Don't let the overlays start a stroke.
  ignore: 'main > :not(#trail)',
  onFirstTouch() {
    touchDevice = true;
    showTouchStick();
  }
});
const view = makeView(canvas, $('creature'), $('preview-spot'));
const keys = new Set();
const tried = new Set();
const point = { id: null, pending: [], pressure: 0 };
const driveKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
let design = readBoss() || DEFAULT_BOSS;
let run = makeRun({ design });
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
let catchAge = 0;
let countMessage = '';
let pausedCount = 0;
let pausedMessage = '';
let statusFor = 0;
let lastTime = performance.now();
let elapsed = 0;
let padX = 0, padY = 0, padAction = false, padPause = false, padFocus = null;
let arcadeBest = 0;

const BEST_KEY = 'sprouts-ink-trail-best-v1';
const BEARINGS = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
try { arcadeBest = Number(localStorage.getItem(BEST_KEY)) || 0; } catch { /* storage off */ }
const meters = () => Math.floor(run.distance / 10);

function status(line, seconds = 2) {
  $('status').textContent = line;
  $('status').hidden = !line;
  statusFor = seconds;
}

function paintChase() {
  const closest = nearestBoss(run);
  const active = run.bosses.filter(boss => boss.active);
  const gap = $('gap'), label = $('chase-label'), icons = $('chase-icons');
  const distance = bossDistance(closest, run.buddy);
  const text = distance < 48 ? 'Boss is close!' : active.length === 1 ? '1 boss chasing' : `${active.length} bosses chasing`;
  if (gap.max !== CHASE_RANGE) gap.max = CHASE_RANGE;
  gap.value = distance;
  if (label.textContent !== text) label.textContent = text;
  const heads = active.map(boss => {
    const angle = Math.atan2(boss.z - run.buddy.z, boss.x - run.buddy.x);
    return BOSS_EMOJI[boss.design.head] + BEARINGS[(Math.round(angle * 4 / Math.PI) + 8) % 8];
  }).join(' ');
  if (icons.textContent !== heads) icons.textContent = heads;
}

function focusButton(el) { el?.focus({ preventScroll: true }); }

function showTouchStick() {
  const playing = screen === 'run';
  touch.setVisible(playing && touchDevice);
  $('tip').textContent = touchDevice ? 'Touch anywhere, then slide to steer the pen' : 'Draw in any direction · arrows or controller';
}

function clearPen() {
  keys.clear();
  const pointerId = point.id;
  point.id = null;
  if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
  point.pending.length = 0;
  point.pressure = 0;
  touch.reset();
}

function setScreen(name) {
  screen = name;
  // Hiding the shared stick doesn't disable input, so opt the floor out between runs.
  canvas.toggleAttribute('data-touch-ignore', name !== 'run');
  showTouchStick();
  // Builder and quiz cards must still scroll on short touchscreens.
  document.documentElement.style.touchAction = document.body.style.touchAction = name === 'run' ? 'none' : 'auto';
  panel.hidden = !['menu', 'pause', 'caught', 'win'].includes(name);
  builder.hidden = name !== 'build';
  question.hidden = name !== 'question';
  $('hud').hidden = ['menu', 'build'].includes(name);
  $('pause').disabled = name !== 'run' && name !== 'count';
  $('tip').hidden = name !== 'run';
  $('count').hidden = name !== 'count';
  $('chomp').hidden = name !== 'chomp';
  view.setPreview(name === 'build');
  if (!$('hud').hidden) paintChase();
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
    intro: 'Draw a glowing trail for your garden buddy. Turn away from bosses as they close in from different sides!',
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
    run = makeRun({ design });
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
  run = makeRun({ learning: mode === 'learning', level, design });
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
    tag: 'Pen down', title: 'Taking a break?', intro: 'Your garden buddy and the bosses will wait.',
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
  status('');
  catchAge = 0;
  $('chomp-boss').textContent = `${bossName(run.caughtBy.design)} caught you!`;
  setScreen('chomp');
}

function showCaughtMenu() {
  setScreen('caught');
  const name = bossName(run.caughtBy.design);
  if (run.learning) {
    menu({
      tag: `${name} caught up!`, title: 'Shake it off!',
      intro: 'Your garden buddy gets another chance. Keep drawing from right here.',
      play: 'Keep drawing', action: () => {
        resumeCaught(run);
        countdown('A fresh trail!');
      },
      info: `${meters()} m · ${finishedQuestions} of ${total} answered`
    });
  } else {
    arcadeBest = Math.max(arcadeBest, meters());
    try { localStorage.setItem(BEST_KEY, String(arcadeBest)); } catch { /* storage off */ }
    menu({
      tag: 'Arcade play', title: `${name} caught up!`, intro: 'Try a new line and see how far your buddy can go.',
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
  const samples = event.getCoalescedEvents?.() || [];
  for (const sample of samples.length ? samples : [event]) {
    const next = view.targetPoint(sample.clientX, sample.clientY);
    if (!next) continue;
    const last = point.pending.at(-1) || run.pen;
    if (Math.hypot(last.x - next.x, last.z - next.z) < 2) continue;
    if (point.pending.length >= 120) point.pending.pop();
    point.pending.push(next);
  }
}
canvas.addEventListener('pointerdown', event => {
  // Fingers steer the shared floating stick. Mouse, stylus and synthetic controller
  // pointers still draw directly on the floor.
  if (event.pointerType === 'touch') return;
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
document.addEventListener('visibilitychange', () => { if (document.hidden) clearPen(); });

function readController() {
  if (embedded) return { x: 0, y: 0, draw: false };
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
  return { x, y, draw: act || !!x || !!y };
}

function tick(now) {
  const dt = Math.min(.08, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  const controller = readController();
  touch.update();
  const stick = screen === 'run' ? penStickDirection(touch.move) : null;
  const x = controller.x || (+keys.has('ArrowRight') - +keys.has('ArrowLeft'));
  const z = controller.y || (+keys.has('ArrowDown') - +keys.has('ArrowUp'));
  const direction = stick ?? (x || z ? { x, z }
    : keys.has('Space') || controller.draw ? { x: run.pen.dx, z: run.pen.dz } : null);
  if (direction && point.id === null) point.pending.length = 0;
  while (point.pending.length && Math.hypot(point.pending[0].x - run.pen.x, point.pending[0].z - run.pen.z) < 2) point.pending.shift();
  const target = point.pending[0];
  const drawing = point.id !== null || !!target || !!direction;
  point.pressure = drawing ? Math.min(1, point.pressure + dt * 1.6) : 0;
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
  } else if (screen === 'chomp') {
    catchAge += dt;
    if (catchAge >= BOSS_CHOMP_SECONDS) showCaughtMenu();
  } else if (screen === 'run') {
    const nextBoss = run.bosses.find(boss => !boss.active);
    const events = stepRun(run, dt, { target, direction, pressure: point.pressure });
    for (const event of events) {
      sfx({ caught: 'bump', finish: 'swish', join: 'whoosh', dot: 'sparkle', wash: 'splash' }[event]);
      if (event === 'question') openQuestion();
      if (event === 'caught') caught();
      if (event === 'finish') win();
      if (event === 'join' && screen === 'run' && nextBoss) status(`${bossName(nextBoss.design)} is cutting across the floor!`);
      if (event === 'dot') status('✦ Ink drop! The bosses fell back.');
      if (event === 'wash') status('Splash! Draw around the puddles.');
    }
    if (screen === 'run' && !run.onInk && statusFor <= 0) status('Draw a little farther so your buddy can keep running.', 1.5);
    $('distance').textContent = `${meters()} m`;
    $('score').textContent = `💧 ${run.dots}`;
    paintChase();
  }
  if (statusFor > 0 && (statusFor -= dt) <= 0) status('');
  elapsed += dt;
  const clock = ['menu', 'build', 'chomp', 'caught'].includes(screen) ? elapsed : run.time;
  view.paint(run, buddy, clock, drawing, dt, screen === 'run', catchAge);
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
