import { sfx } from '../../lib/game-sound.mjs?v=audio2';
import { BUDDIES, buddyKind } from '../../lib/buddy3d.mjs?v=gear2';
import { attachTouchControls, isTouchDevice } from '../../lib/touch-controls.mjs?v=touch3';
import { makeQuiz } from '../../lib/sidecar-quiz.mjs';
import { localQuestion } from '../roll/quiz.mjs?v=roll1';
import { MODES, POWERS, difficulty, makeRun, openGift, step } from './logic.mjs?v=gift1';
import { makeView } from './view.mjs?v=gift1';

const $ = id => document.getElementById(id);
// With no learner question from Little Sprouts (Arcade, two players, this page on its own),
// gift boxes still ask: a simple counting, color, or shape question made here.
let localIndex = 0;
const quiz = makeQuiz({
  local() {
    const q = localQuestion(Math.random, localIndex++);
    q.prompt = q.prompt.replace(/ Roll to that answer\.$/, '').replace(/^Roll to (.*?)\.$/, 'Which one is $1?');
    return q;
  },
});
let mode = 1, run = makeRun(), phase = 'loading', learning = false, two = false;
let count = 0, goAfterCount, flashFor = 0;
let touchDevice = isTouchDevice();
let names = ['You', 'Bear'];
const keys = new Set();
const jumps = [false, false];
const view = makeView($('stage'));
// Each player's camera direction (radians); a camera sits behind its buddy looking this way.
const yaws = [Math.PI, 0];
let snapCamera = true;
if (!view) {
  $('description').textContent = 'Garden tag needs 3D graphics, and this browser could not start them. Try another browser or device.';
  throw new Error('Garden tag: WebGL unavailable');
}
const touch = attachTouchControls({
  half: 'left',
  tint: '#7cc95a',
  hints: { move: 'Run' },
  buttons: [{ id: 'jump', label: '↑', slot: 0, radius: 36 }],
  ignore: '#menu, #levels, #hud, #count, #sprouts-quiz',
  onFirstTouch() { touchDevice = true; syncTouch(); },
});
const modes = [...$('levels').querySelectorAll('button')];

/** The learner's buddy comes from the saved profile; the rival is the next buddy after it (ADR 0001). */
function setBuddy() {
  const mine = buddyKind();
  const rival = BUDDIES[(BUDDIES.indexOf(mine) + 1) % BUDDIES.length] || 'bear';
  view.setBuddies(mine, rival);
  names = two ? ['P1', 'P2'] : ['You', rival[0].toUpperCase() + rival.slice(1)];
}

function freshRun() {
  run = makeRun(mode, learning, two, (Math.random() * 2 ** 32) >>> 0);
  run.players.forEach((p, i) => { yaws[i] = p.yaw; });
  snapCamera = true;
}
function levelButtons() {
  modes.forEach((button, i) => {
    button.setAttribute('aria-pressed', String(i + 1 === mode));
    button.disabled = phase !== 'menu';
  });
}
for (const button of modes) button.addEventListener('click', () => {
  mode = difficulty(+button.value);
  freshRun();
  levelButtons();
  target();
});
function target() {
  $('target').textContent = MODES[mode - 1].name + ' · ' + run.map.name;
}
function syncTouch() {
  touch.setVisible(phase === 'run');
  $('help-keys').hidden = touchDevice;
  $('help-touch').hidden = !touchDevice;
  // Two players share one keyboard and play without questions.
  $('two').hidden = touchDevice || learning || phase !== 'menu';
}
function resetInput() {
  keys.clear();
  touch.reset();
  jumps[0] = jumps[1] = false;
}
function setPhase(next) {
  phase = next;
  resetInput();
  const live = phase === 'run';
  view.area.toggleAttribute('data-touch-ignore', !live);
  $('menu').hidden = !['loading', 'menu', 'pause', 'win'].includes(phase);
  $('levels').hidden = phase !== 'menu';
  $('hud').hidden = ['loading', 'menu', 'win'].includes(phase);
  $('pause').disabled = phase !== 'run' && phase !== 'count';
  $('count').hidden = phase !== 'count';
  document.documentElement.style.touchAction = document.body.style.touchAction = live ? 'none' : 'auto';
  syncTouch();
  levelButtons();
}
function notice(line, seconds = 1.6) {
  $('notice').hidden = !line;
  $('notice').textContent = line;
  flashFor = seconds;
}
function home() {
  two = false;
  setBuddy();
  freshRun();
  setPhase('menu');
  $('eyebrow').textContent = 'LITTLE SPROUTS · RUN & TAG';
  $('headline').textContent = 'Garden tag';
  $('description').textContent = 'Whoever has the bee is it. Tag the other buddy to pass the bee along. Open gift boxes for power-ups.';
  $('target').hidden = false;
  target();
  $('play').textContent = learning ? 'Start learning play' : 'Start tag';
  $('play').disabled = false;
  $('play').onclick = () => start(false);
  $('two').onclick = () => start(true);
  $('how').hidden = false;
  notice('');
}
function start(twoPlayers) {
  two = twoPlayers;
  setBuddy();
  freshRun();
  paintHud();
  countIn(two ? 'P2 has the bee. P1, run!' : names[1] + ' has the bee. Run!', play);
}
function countIn(hint, next, seconds = 2) {
  count = seconds;
  goAfterCount = next;
  $('count-label').textContent = hint;
  $('count-digit').textContent = String(Math.ceil(seconds));
  setPhase('count');
}
function play() {
  setPhase('run');
  view.area.focus({ preventScroll: true });
}
function powersOf(p) {
  const on = [];
  if (p.boost > 0) on.push('⚡');
  if (p.shield > 0) on.push('🫧');
  if (p.jump > 0) on.push('🚀');
  if (p.slow > 0) on.push('🐌');
  return on.join(' ');
}
function paintHud() {
  const clock = String(Math.ceil(run.clock));
  if ($('clock').textContent !== clock) $('clock').textContent = clock;
  const it = run.it === 0 ? (two ? 'P1 is it!' : 'You are it! Tag ' + names[1] + '.') : (two ? 'P2 is it!' : 'Run from ' + names[1] + '!');
  if ($('who-it').textContent !== it) $('who-it').textContent = it;
  const powers = two ? run.players.map((p, i) => powersOf(p) && names[i] + ' ' + powersOf(p)).filter(Boolean).join(' · ') : powersOf(run.players[0]);
  if ($('powers').textContent !== powers) $('powers').textContent = powers;
  $('powers').hidden = !powers;
}
function pause() {
  if (phase !== 'run' && phase !== 'count') return;
  const resume = phase === 'count' ? goAfterCount : play;
  setPhase('pause');
  $('eyebrow').textContent = 'PAUSED';
  $('headline').textContent = 'Catch your breath';
  $('description').textContent = 'The bee will wait right here.';
  $('how').hidden = true;
  $('target').hidden = true;
  $('play').textContent = 'Keep playing';
  $('play').disabled = false;
  $('play').onclick = () => countIn('Back to the garden', resume);
  $('play').focus();
}
$('pause').onclick = pause;
function timeUp(winner) {
  run.done = true;
  setPhase('win');
  const free = run.players.map(p => Math.round(p.free));
  $('eyebrow').textContent = 'GARDEN TAG · TIME';
  $('headline').textContent = two ? (winner === 0 ? 'P1' : 'P2') + ' got away!' : winner === 0 ? 'You got away!' : names[1] + ' got away!';
  $('description').textContent = two ? 'P1 ran free ' + free[0] + ' s, P2 ' + free[1] + ' s.' : 'You ran free for ' + free[0] + ' seconds.';
  $('target').hidden = true;
  $('how').hidden = true;
  $('play').textContent = learning ? 'See my stars' : 'Play again';
  $('play').disabled = false;
  $('play').onclick = () => {
    if (learning) { $('play').disabled = true; quiz.finish(free[0] + ' seconds free'); }
    else home();
  };
  $('play').focus();
}

/** A gift box was touched: ask a question, and open it once it is answered right. */
async function gift(e) {
  const power = POWERS[e.power];
  sfx('pop');
  // Every power-up is behind a right answer. Only the learner's own questions count toward stars.
  setPhase('question');
  await quiz.ask({ title: (two ? names[e.who] + ' · ' : '') + power.icon + ' ' + power.name, note: 'Answer right to open the gift.' });
  if (phase !== 'question') return;
  openGift(run);
  sfx('sparkle');
  countIn(power.icon + ' ' + power.name + '!', play, 1);
}

// Alone, either set of keys moves you. With two players, WASD is P1 and the arrows are P2.
const KEYS = {
  solo: [{ left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], jump: ['Space'] }],
  two: [
    { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'], jump: ['Space'] },
    { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], jump: ['Enter', 'ShiftRight'] },
  ],
};
const ALL = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space', 'Enter', 'ShiftRight'];
const any = codes => codes.some(k => keys.has(k));
addEventListener('keydown', event => {
  if (event.target?.closest?.('button')) return;
  if ((event.code === 'Escape' || event.code === 'KeyP') && !event.repeat) { pause(); return; }
  if (phase !== 'run' || !ALL.includes(event.code)) return;
  event.preventDefault();
  if (!event.repeat && !keys.has(event.code)) {
    (two ? KEYS.two : KEYS.solo).forEach((set, i) => { if (set.jump.includes(event.code)) jumps[i] = true; });
  }
  keys.add(event.code);
});
addEventListener('keyup', event => keys.delete(event.code));
addEventListener('blur', resetInput);
document.addEventListener('visibilitychange', () => { if (document.hidden) resetInput(); });
// Drag with the mouse to look around; otherwise the camera swings in behind the buddy as it runs.
view.area.addEventListener('pointermove', event => {
  if (phase === 'run' && event.pointerType === 'mouse' && event.buttons) yaws[0] -= event.movementX * .006;
});
function followCameras(dt) {
  run.players.forEach((p, i) => {
    if (Math.hypot(p.vx, p.vz) < 1) return;
    const d = Math.atan2(Math.sin(p.yaw - yaws[i]), Math.cos(p.yaw - yaws[i]));
    // Running back toward the camera should not spin it around.
    if (Math.abs(d) < 2.2) yaws[i] += d * Math.min(1, dt * 1.6);
  });
}
function readInputs() {
  const sets = two ? KEYS.two : KEYS.solo;
  // Up is "away from the camera"; turn that into a world-space direction for each buddy.
  const sticks = sets.map(set => ({ side: +any(set.right) - +any(set.left), ahead: +any(set.up) - +any(set.down) }));
  if (touch.move.active) sticks[0] = { side: touch.move.x, ahead: -touch.move.y };
  const inputs = sticks.map(({ side, ahead }, i) => {
    const a = yaws[i];
    return { x: Math.sin(a) * ahead - Math.cos(a) * side, z: Math.cos(a) * ahead + Math.sin(a) * side, jump: jumps[i] };
  });
  if (touch.tapped('jump')) inputs[0].jump = true;
  return inputs;
}

let last = performance.now(), accumulator = 0;
function frame(now) {
  const dt = Math.min(.075, Math.max(0, (now - last) / 1000));
  last = now;
  touch.update();
  if (phase === 'count') {
    count -= dt;
    $('count-digit').textContent = String(Math.max(1, Math.ceil(count)));
    if (count <= 0) goAfterCount();
  } else if (phase === 'run') {
    const inputs = readInputs();
    accumulator += dt;
    while (phase === 'run' && accumulator >= 1 / 120) {
      const events = step(run, 1 / 120, inputs);
      for (const input of inputs) input.jump = false;
      jumps[0] = jumps[1] = false;
      accumulator -= 1 / 120;
      for (const e of events) {
        sfx({ jump: 'jump', bounce: 'bounce', tag: 'bop', blocked: 'zap', end: 'swish' }[e.type]);
        if (e.type === 'tag') notice(two ? (e.it === 0 ? 'P1 has the bee!' : 'P2 has the bee!') : e.it === 0 ? 'Tagged! Now you are it.' : 'You tagged ' + names[1] + '! Run!');
        else if (e.type === 'blocked') notice('The bubble blocked the tag!');
        else if (e.type === 'gift') gift(e);
        else if (e.type === 'end') timeUp(e.winner);
      }
    }
    followCameras(dt);
    paintHud();
  } else {
    accumulator = 0;
  }
  if (flashFor > 0 && (flashFor -= dt) <= 0) notice('', 0);
  view.draw(run, names, yaws, dt, snapCamera);
  snapCamera = false;
  requestAnimationFrame(frame);
}

setBuddy();
setPhase('loading');
$('play').disabled = true;
if (new URLSearchParams(location.search).has('debug')) window.__tag = { run: () => run, phase: () => phase };
if (!quiz.live) {
  document.documentElement.setAttribute('data-pad-standalone', '');
  void import('../../lib/pad.js?v=offline4');
}
quiz.ready().then(ready => {
  learning = ready;
  home();
});
requestAnimationFrame(frame);
