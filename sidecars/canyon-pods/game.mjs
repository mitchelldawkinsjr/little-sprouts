import { buddyKind } from '../../lib/buddy3d.mjs';
import { openRoom } from '../../lib/friend-link.mjs?v=sketchbook1';
import { makeQuiz } from '../../lib/sidecar-quiz.mjs';
import { attachTouchControls } from '../../lib/touch-controls.mjs?v=touch1';
import { makeFriendRace, roomCode } from './friends.mjs';
import { boost, clearGate, LAP, makeRace, position, step } from './logic.mjs';
import { createView, PODS } from './view.mjs?v=3';

const $ = id => document.getElementById(id);
const quiz = makeQuiz();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const held = new Set();
const touch = attachTouchControls({
  half: 'left',
  hints: { move: 'Steer' },
  tint: '#ffd278',
  ignore: '#hud, #sprouts-quiz, #countdown, [data-friend-panel]',
  buttons: [
    { id: 'boost', label: '⚡ Boost', slot: 0, radius: 38 },
    { id: 'brake', label: 'Brake', slot: 1, radius: 38 },
  ],
});
touch.setVisible(false);

const invited = roomCode(new URLSearchParams(location.search).get('room'));
let mode = 'loading', learning = false, run = makeRace(false), selected = 0, kind;
let view, until = 0, previous = 0, noticeUntil = 0, dirty = true;
let room = {}, friendRole = '', remote = null, remoteDraw = null, inviteUrl = '', sentAt = -Infinity;

addEventListener('message', event => {
  if (event.source !== window.parent || event.origin !== location.origin || event.data?.source !== 'sprouts-sidecar') return;
  if (event.data.type !== 'ask' && event.data.type !== 'arcade') return;
  kind = event.data.buddy;
  view?.setBuddy(kind);
  dirty = true;
});

function clearInput() {
  held.clear();
  touch.reset();
}

function setMode(next) {
  mode = next;
  clearInput();
  touch.setVisible(mode === 'race');
  // Restore scrolling on the short landscape menu and shared invite/question cards.
  document.documentElement.style.touchAction = document.body.style.touchAction = mode === 'race' ? 'none' : 'auto';
  $('panel').hidden = !['loading', 'intro', 'pause', 'friend-pause', 'result', 'error'].includes(mode);
  $('friend-panel').hidden = mode !== 'friends';
  $('hud').hidden = !['race', 'pause', 'friend-pause', 'question', 'countdown', 'result'].includes(mode);
  $('pause').hidden = mode !== 'race';
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
  $('start').disabled = false;
  $('start').toggleAttribute('data-pad-back', next === 'pause' || next === 'friend-pause');
  $('friends').hidden = learning || !(next === 'intro' || (next === 'result' && !friendRole));
  const exitRace = next === 'friend-pause' || (next === 'result' && friendRole);
  $('leave').hidden = (!quiz.live && !exitRace) || next === 'loading';
  $('leave').textContent = exitRace ? 'Leave friend race'
    : next === 'result' && learning ? 'Save stars' : 'All games';
  $('pods').hidden = next !== 'intro' && !(next === 'result' && !learning && !friendRole);
  $('instructions').hidden = next === 'error';
  const focus = action ? $('start') : $('leave');
  if (!focus.hidden) focus.focus({ preventScroll: true });
}

function intro() {
  menu('intro', 'Canyon Pods', learning
    ? 'Pick your pod. Race two laps against three garden buddies and answer at the glowing gates to charge your boost and shield.'
    : 'Pick your pod for a solo race, or invite a friend for a two-player race.', 'Race!');
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
  $('place').textContent = `${position(run, remote, friendRole)} / 4`;
  $('speed').textContent = `${Math.round(run.speed)} m/s`;
  $('shield').hidden = !run.shield;
  $('charges').textContent = run.charges;
  $('boost-meter').toggleAttribute('data-empty', !run.charges);
  $('friend-hud').hidden = !friendRole;
}

function pick(i) {
  selected = i;
  for (const id of ['pods', 'friend-pods']) {
    [...$(id).children].forEach((button, j) => button.setAttribute('aria-pressed', String(i === j)));
  }
  view?.setPod(i);
  dirty = true;
}

for (const id of ['pods', 'friend-pods']) {
  PODS.forEach((pod, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = pod.name;
    button.style.setProperty('--pod', '#' + pod.body.toString(16).padStart(6, '0'));
    button.onclick = () => pick(i);
    $(id).appendChild(button);
  });
}

function friendPanel() {
  setMode('friends');
  paintRoom();
  ($('ready').hidden || $('ready').disabled ? ($('host').hidden ? $('friend-back') : $('host')) : $('ready')).focus({ preventScroll: true });
}

function paintRoom() {
  const { active, connected, localReady, remoteReady, status, code } = room;
  $('friend-status').textContent = connected && localReady ? 'Ready! Waiting for your friend…'
    : connected && remoteReady ? 'Your friend is ready. Pick your pod and tap Ready to race.'
      : status || 'Start a room and send the link to your friend.';
  $('host').hidden = $('wifi').hidden = !!active;
  $('ready').hidden = $('friend-pods').hidden = !connected;
  $('ready').disabled = !!localReady;
  for (const button of $('friend-pods').children) button.disabled = !!localReady;
  const url = new URL('index.html', location.href);
  if (code) url.searchParams.set('room', code);
  inviteUrl = code ? url.href : '';
  $('invite-row').hidden = !code || connected;
  if (inviteUrl) $('invite').href = inviteUrl;
  else $('invite').removeAttribute('href');
}

const friend = makeFriendRace({
  open(facade, wifi) {
    const url = new URL('/link', location.href);
    url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return openRoom(url.href, facade, WebSocket, { wifi, wifiChip: false });
  },
  update(next) {
    const newlyConnected = next.connected && !room.connected;
    room = next;
    paintRoom();
    if (mode === 'friends' && newlyConnected) $('ready').focus({ preventScroll: true });
  },
  start(role) {
    friendRole = role;
    remote = remoteDraw = null;
    sentAt = -Infinity;
    run = makeRace(false);
    run.x = role === 'host' ? -2 : 2;
    view.setPod(selected);
    countdown(3, 'Friend race · Get ready!');
    sendPose();
  },
  pose(next) {
    remote = next;
    dirty = true;
    if (mode === 'result' && friendRole) showFriendResult();
  },
  lost() {
    friendRole = '';
    remote = remoteDraw = null;
    run = makeRace(false);
    if (mode !== 'error') friendPanel();
  },
});

function sendPose() {
  friend.send(run, selected, buddyKind(kind));
}

function exitFriend() {
  friend.leave();
  friendRole = '';
  remote = remoteDraw = null;
  run = makeRace(learning);
  intro();
}

$('friends').onclick = friendPanel;
$('host').onclick = () => friend.host(false);
$('wifi').onclick = () => friend.host(true);
$('ready').onclick = () => friend.ready();
$('friend-back').onclick = exitFriend;
$('copy').onclick = async () => {
  try {
    await navigator.clipboard.writeText(inviteUrl);
    $('friend-status').textContent = 'Invite link copied!';
  } catch {
    $('invite').textContent = inviteUrl;
    const range = document.createRange();
    range.selectNodeContents($('invite'));
    const selection = getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    $('friend-status').textContent = 'Copy the highlighted invite link.';
  }
};
addEventListener('pagehide', () => friend.leave());

function pause() {
  if (mode === 'race' && friendRole) menu('friend-pause', 'Race options', 'Your pod keeps moving while this menu is open.', 'Back to race');
  else if (mode === 'friend-pause') {
    setMode('race');
    $('world').focus({ preventScroll: true });
  } else if (mode === 'race') menu('pause', 'Race paused', 'Take a breather. Your place is saved.', 'Resume');
  else if (mode === 'pause') countdown(2, 'Back to the race');
}

function fireBoost() {
  if (mode === 'race' && boost(run)) flash('Boost!');
}

async function question() {
  setMode('question');
  const answered = await quiz.ask({ title: 'Canyon checkpoint', note: 'Pick the right answer to charge a boost and a shield.' });
  if (mode !== 'question') return;
  clearGate(run, answered && !quiz.cleared);
  quiz.progress(`Checkpoint ${run.gate} of 4`);
  countdown(2, answered && !quiz.cleared ? 'Boost and shield ready!' : 'Back to the race');
}

const rank = () => ['','1st','2nd','3rd','4th'][position(run, remote, friendRole)];
function showFriendResult() {
  $('description').textContent = remote?.won ? `${rank()} place · ${run.time.toFixed(1)} seconds · Friend: ${remote.time.toFixed(1)} seconds`
    : `${run.time.toFixed(1)} seconds · Your friend is still racing…`;
  $('start').disabled = !remote?.won;
  if (!remote?.won && document.activeElement === $('start')) $('leave').focus({ preventScroll: true });
}
function result() {
  if (friendRole) {
    sendPose();
    menu('result', 'You finished!', '', 'Race again');
    showFriendResult();
  } else menu('result', 'You finished!', `${rank()} place · ${run.time.toFixed(1)} seconds`, learning ? '' : 'Race again');
}

$('leave').onclick = () => {
  if (mode === 'friend-pause' || (mode === 'result' && friendRole)) { exitFriend(); return; }
  friend.leave();
  if (mode === 'result' && learning) quiz.finish(`2 laps · ${run.time.toFixed(1)} seconds`);
  else quiz.quit();
};
$('pause').onclick = pause;
$('start').onclick = () => {
  if (mode === 'pause' || mode === 'friend-pause') { pause(); return; }
  if (mode !== 'intro' && mode !== 'result') return;
  if (mode === 'result' && friendRole) { friendPanel(); return; }
  run = makeRace(learning);
  view.setPod(selected);
  countdown(3, 'Get ready!');
};

const movement = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'brake', KeyS: 'brake' };
const allModes = ['race', 'pause', 'friend-pause'];
document.addEventListener('keydown', e => {
  if ((e.code === 'Escape' || e.code === 'KeyP') && allModes.includes(mode)) {
    if (!e.repeat) pause();
    e.preventDefault();
  } else if (e.code === 'Escape' && mode === 'friends' && !document.querySelector('[data-friend-panel]')) {
    exitFriend();
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
  if (!friendRole && document.hidden && mode === 'race') pause();
  if (!friendRole && !document.hidden && mode === 'countdown') until = performance.now() + 2000;
});

try {
  view = createView($('world'), event => {
    event.preventDefault();
    friend.leave();
    menu('error', '3D paused', 'Reload Canyon Pods to try again.');
  });
  pick(0);
  view.setBuddy();
  if (!quiz.live) {
    document.documentElement.setAttribute('data-pad-standalone', '');
    void import('../../lib/pad.js?v=offline4');
  }
  quiz.ready().then(ready => {
    if (mode !== 'loading') return;
    learning = ready;
    view.setBuddy(kind);
    intro();
    if (!learning && invited) {
      friendPanel();
      friend.join(invited);
    }
  });
  const isDown = name => [...held].some(key => movement[key] === name);
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (previous || now)) / 1000);
    previous = now;
    touch.update();
    if (mode === 'race' || mode === 'friend-pause') {
      const racing = mode === 'race';
      if (racing && touch.tapped('boost')) fireBoost();
      const keys = Number(isDown('right')) - Number(isDown('left'));
      const direction = racing ? (touch.move.active ? touch.move.x : keys) : 0;
      const event = step(run, dt, direction, racing && (isDown('brake') || touch.down('brake')));
      if (event === 'question') void question();
      else if (event === 'finish') result();
      else if (racing && event === 'charge') flash('Boost charged!');
      else if (racing && event === 'shield') flash('Shield blocked the bump!');
      else if (racing && event === 'bump') flash('Rock bump! Keep racing.');
      if (friendRole && now - sentAt >= 80 && !run.won) {
        sendPose();
        sentAt = now;
      }
      if (now > noticeUntil) $('toast').hidden = true;
      paintHud();
      dirty = true;
    } else if (mode === 'countdown' && (!document.hidden || friendRole)) {
      const n = Math.ceil((until - now) / 1000);
      if (n <= 0) {
        setMode('race');
        $('world').focus({ preventScroll: true });
      } else $('digit').textContent = n;
    }
    if (dirty && mode !== 'error') {
      if (remote) {
        const factor = Math.min(1, dt * 18);
        remoteDraw = remoteDraw ? { ...remote, d: remoteDraw.d + (remote.d - remoteDraw.d) * factor,
          x: remoteDraw.x + (remote.x - remoteDraw.x) * factor } : remote;
      }
      view.draw(run, reduced, friendRole
        ? remoteDraw || { d: 0, x: friendRole === 'host' ? 2 : -2, speed: 0, pod: 1, kind: 'bear' }
        : null);
      dirty = false;
    }
  }
  requestAnimationFrame(frame);
} catch {
  menu('error', '3D isn’t available', 'Canyon Pods needs a browser with WebGL 2.');
}
