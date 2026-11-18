import { sfx } from '../../lib/game-sound.mjs?v=audio2';
import { buddyKind } from '../../lib/buddy3d.mjs';
import { makeQuiz } from '../../lib/sidecar-quiz.mjs';
import { attachTouchControls } from '../../lib/touch-controls.mjs?v=touch1';
import { aiGrid, finishOrder, lane, makeFriendRace, roomCode, shortTime } from './friends.mjs';
import { boost, clearGate, LAP, makeRace, position, RACE, rivalAt, step } from './logic.mjs';
import { createView, PODS } from './view.mjs?v=4';

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

const params = new URLSearchParams(location.search);
const invited = roomCode(params.get('room'));
let mode = 'loading', learning = false, run = makeRace(false), selected = 0, kind;
let view, until = 0, previous = 0, noticeUntil = 0, dirty = true;
let room = {}, match = null, inviteUrl = '', sentAt = -Infinity;
const clearMatch = () => { match = null; run = makeRace(learning); };
const elapsed = (at = performance.now()) => Math.max(0, at - match.at);
const racers = (time, dt = null) => {
  const { grid, self, remote, bots } = match;
  return [...grid.filter(p => p.id !== self.id).map(p => {
    const state = remote.get(p.id);
    const d = state.target.d, x = state.target.x;
    if (dt === null) return { ...state.target, seat: p.seat, dnf: state.dnf };
    const f = Math.min(1, dt * 18);
    state.d += (d - state.d) * f;
    state.x += (x - state.x) * f;
    return { ...state.target, d: state.d, x: state.x, dnf: state.dnf, loadout: p.loadout, seat: p.seat };
  }), ...bots.map(({ seat, bot }) => ({ ...rivalAt(bot, time), seat,
    ...(time === 0 ? { d: 0, x: lane(seat) } : {}) }))].sort((a, b) => a.seat - b.seat);
};

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
  $('results').hidden = true;
  $('start').toggleAttribute('data-pad-back', next === 'pause' || next === 'friend-pause');
  $('friends').hidden = learning || !(next === 'intro' || (next === 'result' && !match));
  const exitRace = next === 'friend-pause' || (next === 'result' && match);
  $('leave').hidden = (!quiz.live && !exitRace) || next === 'loading';
  $('leave').textContent = exitRace ? 'Leave friend race'
    : next === 'result' && learning ? 'Save stars' : 'All games';
  $('pods').hidden = next !== 'intro' && !(next === 'result' && !learning && !match);
  $('instructions').hidden = next === 'error';
  const focus = action ? $('start') : $('leave');
  if (!focus.hidden) focus.focus({ preventScroll: true });
}

function intro() {
  menu('intro', 'Canyon Pods', learning
    ? 'Pick your pod. Race two laps against three garden buddies and answer at the glowing gates to charge your boost and shield.'
    : 'Pick your pod for a solo race, or race with up to three friends.', 'Race!');
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
  const place = match ? 1 + racers(elapsed() / 1000).filter(r => !r.dnf &&
    (r.d > run.d || (r.d === run.d && r.seat < match.self.seat))).length : position(run);
  $('place').textContent = `${place} / 4`;
  $('speed').textContent = `${Math.round(run.speed)} m/s`;
  $('shield').hidden = !run.shield;
  $('charges').textContent = run.charges;
  $('boost-meter').toggleAttribute('data-empty', !run.charges);
  $('friend-hud').hidden = !match;
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
  const { active, connected, players = [], id, status, code, pairing, mode: transport } = room;
  const me = players.find(p => p.id === id);
  const host = me?.seat === 0;
  const lobby = room.state === 'lobby';
  $('friend-status').textContent = status || (!connected ? 'Start a room and invite your friends.'
    : players.length < 2 ? 'Waiting for friends…'
      : me?.ready ? 'Ready! The host starts once everyone is ready.' : 'Pick a pod and tap Ready to race.');
  $('host').hidden = $('wifi').hidden = $('wifi-join').hidden = !!active;
  $('ready').hidden = $('friend-pods').hidden = !connected || !lobby;
  $('ready').disabled = !!me?.ready;
  $("race-start").hidden = !host || !lobby;
  $("race-start").disabled = !!pairing || players.length < 2 || !players.every(p => p.ready);
  $('wifi-add').hidden = !host || !lobby || transport !== 'wifi-host' || players.length >= 4;
  $('wifi-add').disabled = !!pairing;
  for (const button of $('friend-pods').children) button.disabled = !!me?.ready;
  $('roster').hidden = !connected;
  $('roster').replaceChildren(...players.map(p => {
    const row = document.createElement('li');
    row.textContent = `Racer ${p.seat + 1}${p.id === id ? ' (you)' : ''}${p.seat === 0 ? ' · Host' : ''} · ${p.ready ? 'Ready' : 'Picking a pod'}`;
    return row;
  }));
  const url = new URL('index.html', location.href);
  if (code) { url.searchParams.set('room', code); url.searchParams.set('v', 'group1'); }
  inviteUrl = code ? url.href : '';
  $('invite-row').hidden = !code || !lobby || players.length >= 4;
  if (inviteUrl) $('invite').href = inviteUrl;
  else $('invite').removeAttribute('href');
}

const friend = makeFriendRace({
  update(next) {
    const hadLobby = room.state === 'lobby';
    room = next;
    paintRoom();
    if (mode === 'friends' && !hadLobby && next.state === 'lobby') $('ready').focus({ preventScroll: true });
  },
  start({ self, grid, at }) {
    match = { self, grid, at, bots: aiGrid(grid), remote: new Map(), order: null };
    for (const p of grid) {
      if (p.id === self.id) continue;
      const x = lane(p.seat);
      match.remote.set(p.id, { d: 0, x, target: { d: 0, x, speed: 0 } });
    }
    sentAt = -Infinity;
    run = makeRace(false);
    run.x = lane(self.seat);
    view.setPod(self.loadout.pod);
    countdown(3, 'Friend race · Get ready!');
    until = at;
  },
  pose(id, pose) {
    const player = match?.remote.get(id);
    if (!player || player.done) return;
    player.target = { ...pose, d: Math.min(RACE, pose.d) };
    dirty = true;
  },
  finish(id, ms) {
    const player = match?.remote.get(id);
    if (!player) return;
    player.done = true;
    player.dnf = ms === null;
    if (!player.dnf) player.target = { ...player.target, d: RACE, speed: 0, boost: false };
    dirty = true;
  },
  results(finishes) {
    if (!match) return;
    match.order = finishOrder(match.grid, finishes);
    if (mode === 'result') showFriendResult();
    else result();
  },
  rematch() {
    clearMatch();
    friendPanel();
  },
  lost() {
    clearMatch();
    if (mode !== 'error') friendPanel();
  },
});

function exitFriend() {
  friend.leave();
  clearMatch();
  intro();
}

$('friends').onclick = friendPanel;
$('host').onclick = () => friend.host();
$('wifi').onclick = () => friend.hostWifi();
$('wifi-join').onclick = () => friend.guestWifi();
$('wifi-add').onclick = () => friend.add();
$('ready').onclick = () => friend.ready({ pod: selected, kind: buddyKind(kind) });
$('race-start').onclick = () => friend.start();
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
  if (mode === 'race' && match) menu('friend-pause', 'Race options', 'Your pod keeps moving while this menu is open.', 'Back to race');
  else if (mode === 'friend-pause') {
    setMode('race');
    $('world').focus({ preventScroll: true });
  } else if (mode === 'race') menu('pause', 'Race paused', 'Take a breather. Your place is saved.', 'Resume');
  else if (mode === 'pause') countdown(2, 'Back to the race');
}

function fireBoost() {
  if (mode === 'race' && boost(run)) { sfx('whoosh'); flash('Boost!'); }
}

async function question() {
  setMode('question');
  const answered = await quiz.ask({ title: 'Canyon checkpoint', note: 'Pick the right answer to charge a boost and a shield.' });
  if (mode !== 'question') return;
  clearGate(run, answered && !quiz.cleared);
  quiz.progress(`Checkpoint ${run.gate} of 4`);
  countdown(2, answered && !quiz.cleared ? 'Boost and shield ready!' : 'Back to the race');
}

const rank = place => ['', '1st', '2nd', '3rd', '4th'][place];
function showFriendResult() {
  const order = match.order;
  if (!order) {
    $('description').textContent = 'Waiting for the other racers to finish…';
    $('start').disabled = true;
    $('leave').focus({ preventScroll: true });
    return;
  }
  const mine = order.find(entry => entry.id === match.self.id);
  $('heading').textContent = mine.ms === null ? 'Race ended' : 'You finished!';
  $('description').textContent = mine.ms === null ? 'Did not finish this race.'
    : `${rank(order.indexOf(mine) + 1)} place · ${shortTime(mine.ms)} seconds`;
  $('results').hidden = false;
  $('results').replaceChildren(...order.map(entry => {
    const row = document.createElement('li');
    row.textContent = `${entry.id ? `Racer ${entry.seat + 1}` : 'Computer racer'}${entry === mine ? ' (you)' : ''} · ${entry.ms === null ? 'DNF' : `${shortTime(entry.ms)} s`}`;
    return row;
  }));
  $('start').disabled = false;
}
function result() {
  if (match) {
    if (!match.order) friend.finish(Math.round(elapsed()));
    menu('result', 'You finished!', '', 'Race again');
    showFriendResult();
  } else menu('result', 'You finished!', `${rank(position(run))} place · ${run.time.toFixed(1)} seconds`, learning ? '' : 'Race again');
}
$('leave').onclick = () => {
  if (mode === 'friend-pause' || (mode === 'result' && match)) { exitFriend(); return; }
  friend.leave();
  if (mode === 'result' && learning) quiz.finish(`2 laps · ${run.time.toFixed(1)} seconds`);
  else quiz.quit();
};
$('pause').onclick = pause;
$('start').onclick = () => {
  if (mode === 'pause' || mode === 'friend-pause') { pause(); return; }
  if (mode !== 'intro' && mode !== 'result') return;
  if (mode === 'result' && match) { friend.rematch(); return; }
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
  if (!match && document.hidden && mode === 'race') pause();
  if (!match && !document.hidden && mode === 'countdown') until = performance.now() + 2000;
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
      if (params.get('v') === 'group1') friend.join(invited);
      else $('friend-status').textContent = 'This invite is from an older version. Ask your friend for a new link.';
    }
  });
  const isDown = name => [...held].some(key => movement[key] === name);
  function frame(now) {
    requestAnimationFrame(frame);
    const since = previous || now;
    const dt = Math.min(.05, (now - since) / 1000);
    previous = now;
    touch.update();
    if (mode === 'race' || mode === 'friend-pause') {
      const racing = mode === 'race';
      if (racing && touch.tapped('boost')) fireBoost();
      const keys = Number(isDown('right')) - Number(isDown('left'));
      const direction = racing ? (touch.move.active ? touch.move.x : keys) : 0;
      const braking = racing && (isDown('brake') || touch.down('brake'));
      // Match time is wall-clock time. Catch up after a slow render without letting
      // any physics step exceed its safe range or replaying a held input for seconds.
      const frameTime = match ? Math.min(.25, elapsed(now) / 1000 - run.time) : dt;
      let event = '';
      for (let left = frameTime; left > .00001; left -= .05) {
        const next = step(run, Math.min(.05, left), direction, braking);
        if (next) event = next;
        if (next === 'finish' || next === 'question') break;
      }
      if (racing && event) sfx({ charge: 'sparkle', shield: 'zap', bump: 'bump', finish: 'swish' }[event]);
      if (event === 'question') void question();
      else if (event === 'finish') result();
      else if (racing && event === 'charge') flash('Boost charged!');
      else if (racing && event === 'shield') flash('Shield blocked the bump!');
      else if (racing && event === 'bump') flash('Rock bump! Keep racing.');
      if (match && now - sentAt >= 80 && !run.won) {
        friend.send(run);
        sentAt = now;
      }
      if (now > noticeUntil) $('toast').hidden = true;
      paintHud();
      dirty = true;
    } else if (mode === 'countdown' && (!document.hidden || match)) {
      const n = Math.ceil((until - now) / 1000);
      if (n <= 0) {
        setMode('race');
        $('world').focus({ preventScroll: true });
      } else $('digit').textContent = n;
    }
    if (dirty && mode !== 'error') {
      view.draw(run, reduced, match ? racers(elapsed(now) / 1000, dt) : null);
      dirty = false;
    }
  }
  requestAnimationFrame(frame);
} catch {
  menu('error', '3D isn’t available', 'Canyon Pods needs a browser with WebGL 2.');
}
