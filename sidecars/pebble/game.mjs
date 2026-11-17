import { sfx } from '../../lib/game-sound.mjs?v=audio2';
import { buddyKind } from '../../lib/buddy3d.mjs';
import { makeQuiz } from '../../lib/sidecar-quiz.mjs';
import { checkpointSeconds, hop, makeRun, score, startCheckpointCountdown, steer, step } from './logic.mjs';
import { createPebbleView } from './view.mjs';

const $ = id => document.getElementById(id);
const quiz = makeQuiz();
const menu = $('menu');
const play = $('play');
const leave = $('leave');
const hud = $('hud');
const controls = $('controls');
const notice = $('notice');
const countdown = $('countdown');
const digit = $('countdownDigit');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const modes = { intro: 'intro', play: 'play', paused: 'paused', impact: 'impact', question: 'question', countdown: 'countdown', end: 'end' };
let mode = modes.intro;
let run = makeRun();
let learning = false;
let buddyFromHost;
let noteTime = 0;
let finishTimer;
let dirty = true;

addEventListener('message', ({ source, data }) => {
  if (source === window.parent && data?.source === 'sprouts-sidecar' && data.type === 'ask') buddyFromHost = data.buddy;
});

function flash(text) {
  notice.firstElementChild.textContent = text;
  notice.hidden = false;
  noteTime = 1.75;
}

function paintHud() {
  const text = String(score(run));
  if ($('score').textContent !== text) $('score').textContent = text;
  const hearts = `${run.hearts} ${run.hearts === 1 ? 'heart' : 'hearts'}`;
  if ($('hearts').textContent !== hearts) $('hearts').textContent = hearts;
  $('hearts').hidden = !learning;
  $('shield').hidden = !run.shield;
}

function setMode(next) {
  mode = next;
  dirty = true;
  const running = next === modes.play;
  const counting = next === modes.countdown;
  countdown.hidden = !counting;
  menu.hidden = running || counting || next === modes.question || next === modes.impact;
  hud.hidden = !running && next !== modes.impact;
  $('pause').disabled = !running;
  controls.hidden = !running;
  if (!running) notice.hidden = true;
}

function showMenu(next, title, hint, action) {
  setMode(next);
  $('title').textContent = title;
  $('hint').textContent = hint;
  play.hidden = !action;
  play.textContent = action || '';
  leave.hidden = !quiz.live;
  if (action || quiz.live) (action ? play : leave).focus();
}

function start() {
  if (mode !== modes.paused) {
    run = makeRun({ learning, seed: Math.floor(Math.random() * 0x100000000) });
    paintHud();
    view.setBuddy(buddyKind(buddyFromHost));
    notice.hidden = true;
    noteTime = 0;
  }
  setMode(modes.play);
  $('world').focus({ preventScroll: true });
}
function pause() {
  if (mode === modes.play) showMenu(modes.paused, 'Taking a breather?', 'Your run is paused.', 'Resume');
  else if (mode === modes.paused) start();
}

async function checkpoint() {
  setMode(modes.question);
  await quiz.ask({ title: 'Shield checkpoint', note: 'Get it right to block the next bump.' });
  if (mode !== modes.question) return;
  digit.textContent = '2';
  setMode(modes.countdown);
  startCheckpointCountdown(run, performance.now());
}

function end() {
  const result = `Score: ${score(run)}`;
  setMode(modes.impact);
  finishTimer = setTimeout(() => {
    showMenu(modes.end, 'Run over', result, learning ? '' : 'Roll again');
    if (learning) finishTimer = setTimeout(() => quiz.finish(result), 900);
  }, reduced ? 0 : 480);
}

let view;
try {
  view = createPebbleView($('world'), {
    onLost(event) {
      event.preventDefault();
      clearTimeout(finishTimer);
      showMenu(modes.end, 'The screen lost its 3D connection.', 'Choose All games or reload the page.');
    }
  });
}
catch {
  showMenu(modes.end, '3D isn’t available', 'Pebble roll needs a browser with WebGL 2.');
}

leave.onclick = () => quiz.quit();
if (view) {
  $('pause').onclick = pause;
  play.onclick = start;
  $('left').onclick = () => steer(run, -1);
  $('right').onclick = () => steer(run, 1);
  $('jump').onclick = () => jump();
  document.addEventListener('keydown', e => {
    // The host's held stick and D-pad arrive as repeated directional keys.
    const lateral = ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code);
    if ((e.repeat && !lateral) || (e.target?.closest?.('button') && e.code === 'Space')) return;
    if ((e.code === 'KeyP' || e.code === 'Escape') && (mode === modes.play || mode === modes.paused)) {
      e.preventDefault();
      pause();
      return;
    }
    if (mode !== modes.play) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') steer(run, -1);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') steer(run, 1);
    else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') jump();
    else return;
    e.preventDefault();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && mode === modes.play) pause();
    // Give the learner the full countdown if they return from another tab or app.
    if (!document.hidden && mode === modes.countdown) {
      digit.textContent = '2';
      startCheckpointCountdown(run, performance.now());
    }
  });
  view.setBuddy(buddyKind());
  quiz.ready().then(ready => {
    if (mode !== modes.intro) return;
    learning = quiz.live && ready;
    view.setBuddy(buddyKind(buddyFromHost));
    showMenu(modes.intro, 'Pebble roll', learning
      ? 'Dodge trees and answer checkpoint questions to charge a shield.'
      : 'Dodge the trees. How high can you score?', 'Roll!');
  });
  let previous = 0;
  function jump() {
    const before = run.vy;
    hop(run);
    if (run.vy !== before) sfx('jump');
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (previous || now)) / 1000);
    previous = now;
    const from = run.distance;
    if (mode === modes.play) {
      const result = step(run, dt);
      if (result === 'bump' || result === 'shield' || result === 'end') view.hit();
      if (result) sfx({ bump: 'bump', shield: 'zap', end: 'boom', gate: 'sparkle' }[result]);
      if (result === 'gate') void checkpoint();
      if (result === 'bump') flash('Tree bump! Keep rolling.');
      if (result === 'shield') flash('Your shield blocked that bump!');
      if (result === 'end') end();
      if (noteTime > 0 && (noteTime -= dt) <= 0) notice.hidden = true;
      paintHud();
    } else if (mode === modes.countdown && !document.hidden) {
      const seconds = checkpointSeconds(run, now);
      if (seconds === 0) {
        setMode(modes.play);
        paintHud();
        $('world').focus({ preventScroll: true });
      } else if (seconds !== null && digit.textContent !== String(seconds)) {
        digit.textContent = String(seconds);
      }
    }
    if (dirty || run.distance !== from || mode === modes.impact) {
      view.draw(run, dt, run.distance - from, reduced);
      dirty = false;
    }
  }
  requestAnimationFrame(frame);
}
