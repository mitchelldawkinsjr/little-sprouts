import { buddyKind } from '../../lib/buddy3d.mjs?v=gear2';
import { readPad, moveDirs, actionDown, held, nextIndex } from '../../lib/pad-core.mjs?v=pad-rt';
import { makeQuiz } from '../../lib/sidecar-quiz.mjs?v=quiz1';
import { isTouchDevice } from '../../lib/touch-controls.mjs?v=touch1';
import { makeRun, stepRun, steer, jump, reward, arcadeBest, MAX_HEARTS } from './logic.mjs?v=1';
import { makeWorld } from './world.mjs?v=1';

const $ = id => document.getElementById(id);
const canvas = $('trail');
const panel = $('panel');
const primary = $('primary');
const secondary = $('secondary');
const hud = $('hud');
const controls = $('touch-controls');
const touch = isTouchDevice();
const embedded = window.parent !== window;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let world;
let quiz;
let run = makeRun();
let mode = 'loading';
let screen = 'intro';
let total = 0;
let toastUntil = 0;
let lastTime = 0;
let dirty = true;

function exit() {
  if (quiz?.live) quiz.quit();
  else if (embedded) window.parent.postMessage({ source: 'sprouts-sidecar', type: 'quit' }, location.origin);
  else location.href = '../../';
}

function setPanel(tag, title, copy, button, handler, helper = '') {
  $('tag').textContent = tag;
  $('title').textContent = title;
  $('copy').textContent = copy;
  $('best').textContent = helper;
  $('best').hidden = !helper;
  $('keys').hidden = screen !== 'intro';
  primary.hidden = !button;
  primary.textContent = button;
  primary.disabled = !handler;
  primary.onclick = handler;
  secondary.hidden = false;
  secondary.onclick = exit;
  hud.hidden = true;
  controls.hidden = true;
  $('toast').hidden = true;
  panel.hidden = false;
}

function write(id, value) {
  const el = $(id);
  if (el.textContent !== value) el.textContent = value;
}

function paintHud() {
  const distance = Math.floor(run.distance);
  write('meters', distance + ' m');
  const hearts = '♥ '.repeat(run.hearts) + '♡ '.repeat(MAX_HEARTS - run.hearts);
  if ($('hearts').textContent !== hearts.trim()) {
    $('hearts').textContent = hearts.trim();
    $('hearts').setAttribute('aria-label', run.hearts + (run.hearts === 1 ? ' heart' : ' hearts'));
  }
  write('seed-count', total ? run.seeds + '/' + total : String(run.seeds));
  $('shield').hidden = run.shield <= 0;
  if (run.shield > 0) write('shield-time', Math.ceil(run.shield) + 's');
}

function say(text) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  toastUntil = performance.now() + 2100;
}

function showRun() {
  screen = 'play';
  panel.hidden = true;
  hud.hidden = false;
  controls.hidden = !touch;
  $('pause').hidden = false;
  $('seeds').hidden = !run.learning;
  canvas.focus({ preventScroll: true });
  lastTime = 0;
  paintHud();
}

function start() {
  run = makeRun({ learning: mode === 'learning', level: mode === 'learning' ? quiz.level || 2 : 2 });
  showRun();
}

function pause() {
  if (screen === 'pause') { showRun(); return; }
  if (screen !== 'play' || run.phase !== 'run') return;
  screen = 'pause';
  setPanel('TAKE A BREATH', 'Trail paused', 'Your garden buddy is right where you left it.', 'Keep rolling', showRun, Math.floor(run.distance) + ' m rolled');
  primary.focus();
}

function arcadeOver() {
  screen = 'over';
  const distance = Math.floor(run.distance);
  const best = arcadeBest(distance);
  setPanel('ARCADE PLAY', 'Trail complete!', 'Your garden buddy rolled ' + distance + ' m. Want another turn?', 'Roll again', start, 'Best distance · ' + best + ' m');
  primary.focus();
}

function finishLearning() {
  screen = 'end';
  setPanel('LEARNING TRAIL', 'You lit the trail!', 'You cleared every checkpoint and earned learning stars for your Star Garden.', 'See my stars', () => {
    primary.disabled = true;
    quiz.finish('trail');
  });
  primary.focus();
}

async function checkpoint() {
  screen = 'question';
  controls.hidden = true;
  $('pause').hidden = true;
  const answered = await quiz.ask({
    title: 'Trail checkpoint ' + (run.seeds + 1),
    note: 'A right answer earns a shield and restores one heart.'
  });
  if (!answered) return;
  const final = total > 0 && run.seeds + 1 >= total;
  if (!reward(run, final)) return;
  showRun();
  say(final ? 'Trail shield on! Roll through the finish arch.' : 'Trail shield on!');
}

function handle(event) {
  if (event === 'finish') { finishLearning(); return; }
  if (event === 'question') { void checkpoint(); return; }
  if (event === 'shield') say('Your shield blocked a bump!');
  if (event === 'bump') say('Careful! Switch lanes or jump over logs.');
  if (event === 'over') {
    if (!run.learning) { arcadeOver(); return; }
    screen = 'rest';
    setPanel('LEARNING TRAIL', 'Rest stop', 'Your garden buddy can catch its breath. Keep your checkpoint progress and roll again with fresh hearts.', 'Keep rolling', () => {
      run.phase = 'run';
      run.hearts = MAX_HEARTS;
      run.grace = 1.35;
      showRun();
    });
    primary.focus();
  }
}

canvas.tabIndex = -1;
$('pause').onclick = pause;
$('jump').onclick = () => { if (screen === 'play') jump(run); };
controls.querySelectorAll('[data-move]').forEach(button => {
  button.onclick = () => { if (screen === 'play') steer(run, Number(button.dataset.move)); };
});
if (touch) $('keys').textContent = 'Tap the arrows to switch lanes. Tap Jump to hop.';
addEventListener('keydown', event => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.code === 'KeyP' || event.code === 'Escape') {
    if (screen === 'play' || screen === 'pause') { event.preventDefault(); pause(); }
    return;
  }
  if (screen !== 'play') return;
  if (event.code === 'Space' && event.target instanceof HTMLButtonElement) return;
  if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD', 'ArrowUp', 'KeyW', 'Space'].includes(event.code)) {
    event.preventDefault();
    if (['ArrowLeft', 'KeyA'].includes(event.code)) steer(run, -1);
    else if (['ArrowRight', 'KeyD'].includes(event.code)) steer(run, 1);
    else jump(run);
  }
});
addEventListener('message', event => {
  if (!embedded || event.source !== window.parent || event.origin !== location.origin || event.data?.source !== 'sprouts-sidecar') return;
  if (event.data.type !== 'ask') return;
  total = Number.isInteger(event.data.total) && event.data.total > 0 ? event.data.total : total;
  world?.setBuddy(buddyKind(event.data.buddy));
  dirty = true;
});

// In the arcade iframe the shared Controller API handles movement and menu focus.
// On the standalone page, poll the same standard mapping without injecting keys.
let prevDir = { x: 0, y: 0 };
let prevAction = false;
let prevStart = false;
function standaloneController() {
  const pad = (navigator.getGamepads?.() || []).find(p => p?.connected);
  const buttons = readPad(pad);
  const dirs = moveDirs(buttons);
  const action = actionDown(buttons, prevAction);
  const start = held(buttons.start, prevStart);
  if (!panel.hidden) {
    const items = [primary, secondary].filter(b => !b.hidden && !b.disabled);
    const index = items.indexOf(document.activeElement);
    if (items.length && (dirs.x !== prevDir.x || dirs.y !== prevDir.y) && (dirs.x || dirs.y)) {
      const rects = items.map(el => {
        const { x, y, width, height } = el.getBoundingClientRect();
        return { x, y, w: width, h: height };
      });
      items[index < 0 ? 0 : nextIndex(rects, index, dirs)]?.focus();
    }
    if (action && !prevAction) items[Math.max(0, index)]?.click();
    else if (screen === 'pause' && start && !prevStart) showRun();
  } else if (screen === 'play') {
    if (dirs.x && dirs.x !== prevDir.x) steer(run, dirs.x);
    if ((action && !prevAction) || (dirs.y < 0 && prevDir.y >= 0)) jump(run);
    if (start && !prevStart) pause();
  }
  prevDir = dirs;
  prevAction = action;
  prevStart = start;
}

function frame(now) {
  if (!embedded) standaloneController();
  const dt = lastTime ? (now - lastTime) / 1000 : 0;
  lastTime = now;
  const running = screen === 'play' && run.phase === 'run';
  if (running) {
    for (const event of stepRun(run, dt)) handle(event);
    paintHud();
    if (now > toastUntil) $('toast').hidden = true;
  }
  // Cap the purely visual spin as well, notably after a tab has been asleep.
  if (running || dirty) {
    world.draw(run, running ? Math.min(dt, 0.075) : 0, reduced);
    dirty = false;
  }
  requestAnimationFrame(frame);
}

try {
  world = makeWorld(canvas, buddyKind(), embedded);
  world.resize();
  addEventListener('resize', () => {
    world.resize();
    dirty = true;
  });
  // Fill the opening view without advancing the run.
  run.rows = [{ at: 14, obstacles: [{ lane: 1, kind: 'pine' }, { lane: -1, kind: 'log' }] }];
  quiz = makeQuiz();
  // Keep the primary action keyboard-reachable even before the host initializes.
  secondary.hidden = false;
  secondary.onclick = exit;
  quiz.ready().then(learning => {
    mode = learning ? 'learning' : 'arcade';
    if (learning) { run.nextGate = 30; dirty = true; }
    const copy = learning
      ? 'Dodge pines and hop over logs. At each checkpoint, answer a question to power up your shield and restore a heart.'
      : 'Roll as far as you can. Switch lanes around pines, hop over logs, and try to beat your best distance.';
    setPanel(learning ? 'LEARNING TRAIL' : 'ARCADE PLAY', 'Pinecone Trail', copy, 'Start rolling', start,
      learning ? '' : 'Best distance · ' + arcadeBest() + ' m');
  });
  requestAnimationFrame(frame);
} catch {
  screen = 'error';
  setPanel('LITTLE SPROUTS ARCADE', 'The trail couldn’t open', 'This device couldn’t start the 3D view. Choose another game to keep playing.', '', null);
}
