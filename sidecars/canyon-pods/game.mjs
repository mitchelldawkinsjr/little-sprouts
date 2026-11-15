import { makeQuiz } from '../../lib/sidecar-quiz.mjs';
import { boost, clearGate, LAP, makeRace, position, step } from './logic.mjs';
import { createView, PODS } from './view.mjs?v=2';

const $ = id => document.getElementById(id);
const quiz = makeQuiz();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const held = new Set();
const touch = new Map();
const controls = [
  ['left', 'ArrowLeft'], ['right', 'ArrowRight'], ['brake', 'ArrowDown']
];
let mode = 'loading', learning = false, run = makeRace(false), selected = 0, kind;
let view, until = 0, previous = 0, noticeUntil = 0, dirty = true;

addEventListener('message', event => {
  if (event.source !== window.parent || event.origin !== location.origin || event.data?.source !== 'sprouts-sidecar') return;
  if (event.data.type !== 'ask') return;
  kind = event.data.buddy;
  view?.setBuddy(kind);
  dirty = true;
});

function clearInput() {
  held.clear();
  touch.clear();
  for (const [id] of controls) $(id).removeAttribute('data-held');
}

function setMode(next) {
  mode = next;
  if (mode !== 'race') clearInput();
  $('panel').hidden = !['loading','intro','pause','result','error'].includes(mode);
  $('hud').hidden = ['loading','intro','error'].includes(mode);
  // The controller uses this button as a shortcut to the menu, only while racing.
  $('pause').hidden = mode !== 'race';
  $('controls').hidden = mode !== 'race';
  $('countdown').hidden = mode !== 'countdown';
  $('toast').hidden = true;
  dirty = true;
}

function menu(next, heading, description, action = '') {
  setMode(next);
  $('heading').textContent = heading;
  $('description').textContent = description;
  $('start').textContent = action;
  $('start').hidden = !action;
  $('start').toggleAttribute('data-resume', next === 'pause');
  $('leave').hidden = !quiz.live || next === 'loading';
  $('leave').textContent = next === 'result' && learning ? 'Save stars' : 'All games';
  $('pods').hidden = next !== 'intro' && !(next === 'result' && !learning);
  $('instructions').hidden = next === 'error';
  const focus = action ? $('start') : $('leave');
  if (!focus.hidden) focus.focus({ preventScroll: true });
}

function countdown(seconds, label) {
  until = performance.now() + seconds * 1000;
  $('digit').textContent = seconds;
  $('count-label').textContent = label;
  setMode('countdown');
  paintHud();
}

function flash(message) {
  $('toast').textContent = message;
  $('toast').hidden = false;
  noticeUntil = performance.now() + 1350;
}

function paintHud() {
  $('lap').textContent = `LAP ${Math.min(2, 1 + Math.floor(run.d / LAP))} / 2`;
  $('place').textContent = `${position(run)} / 4`;
  $('speed').textContent = `${Math.round(run.speed)} m/s`;
  $('shield').hidden = !run.shield;
  $('charges').textContent = run.charges;
  $('boost').toggleAttribute('data-empty', !run.charges);
}

function pick(i) {
  selected = i;
  [...$('pods').children].forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
  view?.setPod(i);
  dirty = true;
}

PODS.forEach((pod,i)=>{
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = pod.name;
  button.style.setProperty('--pod','#'+pod.body.toString(16).padStart(6,'0'));
  button.onclick = () => pick(i);
  $('pods').appendChild(button);
});

function pause() {
  if (mode === 'race') menu('pause', 'Race paused', 'Take a breather. Your place is saved.', 'Resume');
  else if (mode === 'pause') countdown(2, 'Back to the race');
}

function fireBoost() {
  if (mode !== 'race') return;
  if (boost(run)) flash('Boost!');
}

async function question() {
  setMode('question');
  const answered = await quiz.ask({ title: 'Canyon checkpoint', note: 'Pick the right answer to charge a boost and a shield.' });
  if (mode !== 'question') return;
  clearGate(run, answered && !quiz.cleared);
  quiz.progress(`Checkpoint ${run.gate} of 4`);
  countdown(2, answered && !quiz.cleared ? 'Boost and shield ready!' : 'Back to the race');
}

function result() {
  const rank = ['','1st','2nd','3rd','4th'][position(run)];
  const line = `${rank} place · ${run.time.toFixed(1)} seconds`;
  menu('result', 'You finished!', line, learning ? '' : 'Race again');
}

$('leave').onclick = () => {
  if (mode === 'result' && learning) quiz.finish(`2 laps · ${run.time.toFixed(1)} seconds`);
  else quiz.quit();
};
$('pause').onclick = pause;
$('start').onclick = () => {
  if (mode === 'pause') { pause(); return; }
  if (mode !== 'intro' && mode !== 'result') return;
  run = makeRace(learning);
  view.setPod(selected);
  countdown(3, 'Get ready!');
};
$('boost').onclick = fireBoost;
for (const [id, code] of controls) {
  const button = $(id);
  button.addEventListener('pointerdown', event => {
    if (mode !== 'race' || event.button !== 0) return;
    // Move focus before recording the pointer. In an iframe that cancels the blur from the previous button.
    $('world').focus({ preventScroll: true });
    event.preventDefault();
    try { button.setPointerCapture(event.pointerId); } catch { /* already released */ }
    touch.set(event.pointerId, code);
    button.setAttribute('data-held', '');
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type,event=>{
    touch.delete(event.pointerId);
    if (![...touch.values()].includes(code)) button.removeAttribute('data-held');
  });
}

const movement = { ArrowLeft: 'ArrowLeft', KeyA: 'ArrowLeft', ArrowRight: 'ArrowRight', KeyD: 'ArrowRight', ArrowDown: 'ArrowDown', KeyS: 'ArrowDown' };
document.addEventListener('keydown', e => {
  if ((e.code === 'Escape' || e.code === 'KeyP') && (mode === 'race' || mode === 'pause')) {
    if (!e.repeat) pause();
    e.preventDefault();
  } else if (mode === 'race' && movement[e.code]) {
    held.add(e.code);
    e.preventDefault();
  } else if (mode === 'race' && e.code === 'Space' && !e.target?.closest?.('button')) {
    if (!e.repeat) fireBoost();
    e.preventDefault();
  }
});
document.addEventListener('keyup', e => held.delete(e.code));
addEventListener('blur', event => { if (event.target === window) clearInput(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && mode === 'race') pause();
  if (!document.hidden && mode === 'countdown') until = performance.now() + 2000;
});

try {
  view = createView($('world'), event => {
    event.preventDefault();
    menu('error', '3D paused', 'Reload Canyon Pods to try again.');
  });
  pick(0);
  view.setBuddy();
  quiz.ready().then(ready => {
    if (mode !== 'loading') return;
    learning = ready;
    view.setBuddy(kind);
    menu('intro','Canyon Pods', learning
      ? 'Pick your pod. Race two laps against three garden buddies and answer at the glowing gates to charge your boost and shield.'
      : 'Pick your pod. Race two laps against three garden buddies and collect boosts at the glowing gates.', 'Race!');
  });
  const isDown = code => [...held].some(key => movement[key] === code) || [...touch.values()].includes(code);
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05,(now-(previous||now))/1000);
    previous = now;
    if (mode === 'race') {
      const direction = Number(isDown('ArrowRight')) - Number(isDown('ArrowLeft'));
      const event = step(run,dt,direction,isDown('ArrowDown'));
      if (event === 'question') void question();
      else if (event === 'finish') result();
      else if (event === 'charge') flash('Boost charged!');
      else if (event === 'shield') flash('Shield blocked the bump!');
      else if (event === 'bump') flash('Rock bump! Keep racing.');
      if (now > noticeUntil) $('toast').hidden = true;
      paintHud();
      dirty = true;
    } else if (mode === 'countdown' && !document.hidden) {
      const n = Math.ceil((until - now)/1000);
      if (n <= 0) {
        setMode('race');
        $('world').focus({ preventScroll: true });
      } else $('digit').textContent = n;
    }
    if (dirty && mode !== 'error') { view.draw(run,reduced); dirty = false; }
  }
  requestAnimationFrame(frame);
} catch {
  menu('error','3D isn’t available','Canyon Pods needs a browser with WebGL 2.');
}
