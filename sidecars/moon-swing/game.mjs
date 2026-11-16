import { buddyKind } from '../../lib/buddy3d.mjs?v=gear2';
import { attachTouchControls, isTouchDevice } from '../../lib/touch-controls.mjs?v=touch3';
import { localQuestion, normalizeQuestion, LOCAL_ROUND } from '../roll/quiz.mjs?v=roll1';
import { MODES, difficulty, makeRun, markChoice, nextUnlock, placeChoices, step } from './logic.mjs';
import { makeView } from './view.mjs?v=leash1';

const $ = id => document.getElementById(id);
const embedded = window.parent !== window;
const CHANNEL = 'sprouts-sidecar';
const send = (type, props = {}) => {
  if (embedded) window.parent.postMessage({ source: CHANNEL, type, ...props }, location.origin);
};
const UNLOCK = 'sprouts-moon-swing-unlocked-v1';
let unlocked = 1;
try { unlocked = difficulty(Number(localStorage.getItem(UNLOCK))); } catch { /* storage is optional */ }
let mode = 1, run = makeRun(), phase = 'menu', context = embedded ? null : 'arcade';
let current = null, progress = 0, total = LOCAL_ROUND, sound = true;
let count = 0, goAfterCount, flashFor = 0, waitingRound = -1, requestedAt = 0;
let touchDevice = isTouchDevice();
const keys = new Set();
let floorAim = null, jump = false, touchJump = false;
const view = makeView($('world'), $('backup'), $('labels'));
view.setBuddy(buddyKind());
const touch = attachTouchControls({
  half: 'left',
  tint: '#a4f8ff',
  hints: { move: 'Pull the leash' },
  buttons: [
    { id: 'jump', label: '↗', slot: 0, radius: 34 },
  ],
  ignore: '#menu, #levels, #hud, #question, #count',
  onFirstTouch() { touchDevice = true; syncTouch(); },
});
const modes = [...$('levels').querySelectorAll('button')];

function levelButtons() {
  modes.forEach((button, i) => {
    const value = i + 1;
    const locked = value > unlocked;
    button.setAttribute('aria-pressed', String(value === mode));
    button.disabled = locked || (phase !== 'menu' && !(phase === 'win' && (!embedded || !run.learning)));
    button.querySelector('small').textContent = locked ? '🔒 Beat ' + i : MODES[i].name;
  });
}
for (const button of modes) button.addEventListener('click', () => {
  mode = difficulty(+button.value);
  if (phase === 'win') home();
  else {
    run = makeRun(mode);
    levelButtons();
    $('target').textContent = mode === 3 ? 'Jump the boss’s shockwave.' : 'Arcade goal: ' + run.spec.target + ' points.';
  }
});

function syncTouch() {
  touch.setVisible(phase === 'run');
  $('help-keys').hidden = touchDevice;
  $('help-touch').hidden = !touchDevice;
}
function resetInput() {
  keys.clear();
  touch.reset();
  jump = touchJump = false;
  floorAim = null;
}
function setPhase(next) {
  phase = next;
  resetInput();
  const live = phase === 'run';
  view.area.toggleAttribute('data-touch-ignore', !live);
  $('menu').hidden = !['menu', 'pause', 'win'].includes(phase);
  $('levels').hidden = !['menu', 'win'].includes(phase);
  $('hud').hidden = ['menu', 'win'].includes(phase);
  $('pause').disabled = phase !== 'run' && phase !== 'count';
  $('count').hidden = phase !== 'count' && phase !== 'waiting';
  $('question').hidden = !run.learning || run.choices.length === 0 || !['run', 'count'].includes(phase);
  // Older touch controls set these globally. Don't let that lock the scrollable menu.
  document.documentElement.style.touchAction = document.body.style.touchAction = live ? 'none' : 'auto';
  syncTouch();
  levelButtons();
}
function notice(line, seconds = 1.45) {
  $('notice').hidden = !line;
  $('notice').textContent = line;
  flashFor = seconds;
}
function home() {
  run = makeRun(mode);
  setPhase('menu');
  $('eyebrow').textContent = 'LITTLE SPROUTS · SWING & COLLECT';
  $('headline').textContent = 'Moonlight Swing';
  $('description').textContent = 'Lead your buddy on a stretchy leash across the glowing rink. Hop and spin for the high gems and stay clear of the rose-colored obstacles.';
  $('target').hidden = false;
  $('target').textContent = mode === 3 ? 'Watch the boss’s feet. Jump when the warning ring lights up.' : 'Arcade goal: ' + run.spec.target + ' points.';
  $('play').textContent = context === 'learning' ? 'Start learning play' : 'Start swinging';
  $('play').disabled = !context;
  $('play').onclick = () => start(context === 'learning');
  $('practice').hidden = embedded;
  $('practice').onclick = () => start(true);
  $('how').hidden = false;
  notice('');
}
function showQuestion(q) {
  placeChoices(run, q.choices, progress);
  $('prompt').textContent = q.prompt;
  // show is same-origin question markup, just as in the other sidecars.
  $('question-show').innerHTML = q.show || '';
  $('hear').hidden = !sound || (!embedded && !('speechSynthesis' in window));
  $('progress').textContent = 'Question ' + (progress + 1) + ' of ' + total;
}
function replayQuestion() {
  if (embedded) send('replay');
  else if ('speechSynthesis' in window && current) {
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(current.prompt));
  }
}
$('hear').onclick = replayQuestion;

function getLocal() {
  const q = localQuestion(Math.random, progress);
  q.prompt = q.prompt.replace(/ Roll to that answer\.$/, '').replace(/^Roll to (.*?)\.$/, 'Which one is $1?');
  return normalizeQuestion(q);
}
function start(learning) {
  if (learning && embedded && (!current || current.round !== 0)) return;
  run = makeRun(mode, learning);
  progress = 0;
  waitingRound = -1;
  if (learning) {
    if (!embedded) { total = LOCAL_ROUND; current = getLocal(); }
    showQuestion(current);
  }
  paintHud();
  countIn('Get ready to swing!', () => {
    play();
    if (learning && embedded) send('show');
  });
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
function paintHud() {
  const score = run.learning ? run.score + ' pts' : run.score + ' / ' + run.spec.target + ' pts';
  if ($('score').textContent !== score) $('score').textContent = score;
  $('shield').hidden = run.shield <= 0;
  $('round-mode').textContent = run.spec.name;
}
function pause() {
  if ((phase !== 'run' && phase !== 'count') || run.waiting !== null) return;
  const resume = phase === 'count' ? goAfterCount : play;
  setPhase('pause');
  $('eyebrow').textContent = 'PAUSED';
  $('headline').textContent = 'Take a breather';
  $('description').textContent = 'Your garden buddy will wait right here.';
  $('how').hidden = true;
  $('target').hidden = true;
  $('practice').hidden = true;
  $('play').textContent = 'Keep swinging';
  $('play').disabled = false;
  $('play').onclick = () => countIn('Back to the rink', resume);
  $('play').focus();
}
$('pause').onclick = pause;
function win() {
  run.done = true;
  unlocked = nextUnlock(unlocked, mode);
  try { localStorage.setItem(UNLOCK, String(unlocked)); } catch { /* optional */ }
  setPhase('win');
  $('headline').textContent = mode === 3 ? 'You outswung the boss!' : 'You cleared the rink!';
  $('eyebrow').textContent = 'MOONLIGHT SWING · COMPLETE';
  $('description').textContent = run.score + ' points. ' + (mode < 3 ? 'Mode ' + (mode + 1) + ' is unlocked for your next run.' : 'You beat all three difficulty modes.');
  $('target').hidden = true;
  $('how').hidden = true;
  $('practice').hidden = true;
  $('play').textContent = embedded && run.learning ? 'See my stars' : 'Back to the rink';
  $('play').disabled = false;
  $('play').onclick = () => {
    if (embedded && run.learning) { $('play').disabled = true; send('finish', { detail: 'swing-clear' }); }
    else home();
  };
  $('play').focus();
}
function useHostQuestion(q) {
  current = q;
  if (phase === 'waiting' && q.round === waitingRound) {
    waitingRound = -1;
    showQuestion(q);
    countIn('Next answer in the air', () => { play(); send('show'); });
  }
}
function grade(index, ok) {
  if (!markChoice(run, index, ok)) return;
  if (!ok) {
    notice('Not that one. Swing toward another answer.');
    return;
  }
  progress++;
  notice('Nice catch! +3 and a shield');
  if (!embedded) {
    if (progress >= total) { win(); return; }
    current = getLocal();
    showQuestion(current);
    countIn('Next answer in the air', play);
    return;
  }
  waitingRound = progress;
  setPhase('waiting');
  $('count-digit').textContent = '✓';
  $('count-label').textContent = 'Nice catch! A shield is ready.';
  requestedAt = performance.now() + 2200;
}
addEventListener('message', event => {
  if (!embedded || event.source !== window.parent || event.origin !== location.origin || event.data?.source !== CHANNEL) return;
  const msg = event.data;
  if (msg.type === 'ask') {
    const q = normalizeQuestion(msg);
    if (!q || !Number.isInteger(q.round) || q.round < progress) return;
    sound = msg.sound !== false;
    view.setBuddy(buddyKind(msg.buddy));
    total = Number.isInteger(msg.total) && msg.total > 0 ? msg.total : total;
    const first = !context;
    context = 'learning';
    useHostQuestion({ ...q, show: typeof msg.show === 'string' ? msg.show : '' });
    if (first && phase === 'menu') home();
  } else if (msg.type === 'arcade' && !context) {
    context = 'arcade';
    view.setBuddy(buddyKind(msg.buddy));
    home();
  } else if (msg.type === 'mark' && phase === 'run') grade(msg.index, msg.ok === true);
  else if (msg.type === 'clear' && phase === 'waiting' && run.learning && progress >= total) win();
});
const left = ['ArrowLeft', 'KeyA'], right = ['ArrowRight', 'KeyD'];
const up = ['ArrowUp', 'KeyW'], down = ['ArrowDown', 'KeyS'];
const movement = [...left, ...right, ...up, ...down, 'Space'];
const any = codes => codes.some(k => keys.has(k));
addEventListener('keydown', event => {
  if (event.target?.closest?.('button')) return;
  if ((event.code === 'Escape' || event.code === 'KeyP') && !event.repeat) { pause(); return; }
  if (phase !== 'run' || !movement.includes(event.code)) return;
  event.preventDefault();
  if (event.code === 'Space' && !keys.has(event.code) && !event.repeat) jump = true;
  keys.add(event.code);
  floorAim = null;
});
addEventListener('keyup', event => keys.delete(event.code));
view.area.addEventListener('pointermove', event => {
  if (phase === 'run' && event.pointerType === 'mouse' && (event.movementX || event.movementY)) {
    const target = view.pickFloor(event.clientX, event.clientY);
    if (target) floorAim = target;
  }
});
view.area.addEventListener('pointerdown', event => {
  if (phase === 'run' && event.pointerType !== 'touch' && event.button === 0) jump = true;
});
addEventListener('blur', resetInput);
document.addEventListener('visibilitychange', () => { if (document.hidden) resetInput(); });

let last = performance.now(), accumulator = 0;
function frame(now) {
  const dt = Math.min(.075, Math.max(0, (now - last) / 1000));
  last = now;
  touch.update();
  if (phase === 'count') {
    count -= dt;
    $('count-digit').textContent = String(Math.max(1, Math.ceil(count)));
    if (count <= 0) goAfterCount();
  } else if (phase === 'waiting') {
    if (now >= requestedAt) { send('need'); requestedAt = now + 1500; }
  } else if (phase === 'run') {
    touchJump ||= touch.tapped('jump');
    let x = +any(right) - +any(left), z = +any(down) - +any(up);
    if (touch.move.active) { x = touch.move.x; z = touch.move.y; }
    accumulator += dt;
    while (phase === 'run' && accumulator >= 1 / 120) {
      // The mouse sets the leash target, as in the pen; keys and sticks slide it.
      const events = step(run, 1 / 120, { x, z, aim: floorAim, jump: jump || touchJump });
      jump = touchJump = false;
      floorAim = null;
      accumulator -= 1 / 120;
      for (const e of events) {
        if (e.type === 'pickup') {
          view.burst(run);
          if (e.air) notice('Air gem! +2');
        }
        else if (e.type === 'shield') notice('Your shield blocked the bump!');
        else if (e.type === 'hit') notice(e.boss ? 'Boss bump! Jump the rose ring.' : 'Oof! Dodge the rose obstacles.');
        else if (e.type === 'pick') {
          if (embedded) send('pick', { index: e.index });
          else grade(e.index, !!current.choices[e.index]?.ok);
        } else if (e.type === 'complete') win();
      }
    }
    paintHud();
  } else {
    accumulator = 0;
    touchJump = false;
  }
  if (flashFor > 0 && (flashFor -= dt) <= 0) notice('', 0);
  view.draw(run, phase === 'run' ? dt : 0);
  requestAnimationFrame(frame);
}

home();
if (embedded) {
  send('ready');
  const nudge = setInterval(() => {
    if (context) clearInterval(nudge);
    else send('need');
  }, 1200);
} else {
  document.documentElement.setAttribute('data-pad-standalone', '');
  void import('../../lib/pad.js?v=offline4');
}
requestAnimationFrame(frame);
