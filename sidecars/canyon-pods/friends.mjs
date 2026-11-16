// Canyon Pods sends only race state over the shared Sprouts room. Learning questions,
// profiles, and star progress stay local. The host starts a round once both pods are ready.
import { RACE, WIDTH } from './logic.mjs';
import { BUDDIES } from '../../lib/buddy3d.mjs';

const WIRE = 'canyon-pods/1';
const bounded = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;
const roundNumber = n => Number.isSafeInteger(n) && n >= 0;
const roundTo = (n, places) => Math.round(n * places) / places;
export const roomCode = value => typeof value === 'string' && /^[a-hj-km-np-z2-9]{4}$/.test(value) ? value : '';

export function packPose(run, pod, kind) {
  return {
    d: run.won ? RACE : Math.min(RACE, roundTo(run.d, 100)),
    x: roundTo(run.x, 100),
    speed: roundTo(run.speed, 10),
    steer: roundTo(run.steer, 100),
    time: roundTo(run.time, 1000),
    won: run.won,
    boost: run.boost > 0,
    pod,
    kind,
  };
}

export function readPose(m) {
  if (!m || !bounded(m.d, 0, RACE) || !bounded(m.x, -WIDTH, WIDTH) ||
      !bounded(m.speed, 0, 66) || !bounded(m.steer, -1, 1) || !bounded(m.time, 0, Number.MAX_SAFE_INTEGER) ||
      typeof m.won !== 'boolean' || (m.won && m.d !== RACE) || typeof m.boost !== 'boolean' ||
      !Number.isInteger(m.pod) || !bounded(m.pod, 0, 2) || !BUDDIES.includes(m.kind)) return null;
  const { d, x, speed, steer, time, won, boost, pod, kind } = m;
  return { d, x, speed, steer, time, won, boost, pod, kind };
}

export function makeFriendRace({ open, update, start, pose, lost }) {
  let socket, round = 0, localReady = false, remoteReady = false, last = null;
  const room = { active: false, connected: false, role: '', code: '', status: '' };
  const publish = () => update({ ...room, localReady, remoteReady });
  const change = values => { Object.assign(room, values); publish(); };
  const send = msg => socket?.send(JSON.stringify(msg));
  const wire = (type, values) => send({ t: WIRE, type, round, ...values });

  function resetRound() {
    round = 0;
    localReady = remoteReady = false;
    last = null;
  }

  function leave(status = '') {
    const old = socket;
    socket = null;
    old?.close();
    resetRound();
    change({ active: false, connected: false, role: '', code: '', status });
  }

  function begin(next) {
    round = next;
    localReady = remoteReady = false;
    last = null;
    start(room.role);
    publish();
  }

  function maybeStart() {
    if (room.role !== 'host' || !localReady || !remoteReady) return;
    const next = round + 1;
    wire('start', { next });
    begin(next);
  }

  function onWire(msg) {
    if (!room.connected || !roundNumber(msg.round) || msg.round !== round) return;
    if (msg.type === 'ready' && msg.ready === true) {
      remoteReady = true;
      publish();
      maybeStart();
    } else if (msg.type === 'start' && room.role === 'guest' && localReady && msg.next === round + 1) {
      begin(msg.next);
    } else if (msg.type === 'pose' && round > 0) {
      const next = readPose(msg.pose);
      if (!next || last?.won || (last && (next.time < last.time || next.d < last.d))) return;
      last = next;
      pose(next);
    }
  }

  function connect(first, wifi) {
    leave();
    change({ active: true, status: 'Opening a room…' });
    const facade = new EventTarget();
    let current;
    const stillOpen = () => socket === current;
    const closed = message => {
      const wasConnected = room.connected;
      leave(message);
      if (wasConnected) lost(message);
    };
    facade.addEventListener('open', () => { if (stillOpen()) send(first); });
    facade.addEventListener('close', () => { if (stillOpen()) closed('Room closed.'); });
    facade.addEventListener('message', ({ data }) => {
      if (!stillOpen()) return;
      let msg;
      try { msg = JSON.parse(data); } catch { return; }
      if (msg?.t === 'welcome') {
        if (msg.role !== 'host' && msg.role !== 'guest') return;
        const code = msg.role === 'host' ? roomCode(msg.room) : '';
        change({ role: msg.role, code, status: code ? 'Send the invite link to a friend.' : 'Waiting for your friend…' });
      } else if (msg?.t === 'peer') {
        if (msg.here === true && room.role) {
          change({ connected: true, status: 'Friend connected! Pick a pod, then both tap Ready.' });
        } else if (room.connected) {
          resetRound();
          const status = 'Your friend left. Invite someone or go back to solo.';
          change({ connected: false, status });
          lost(status);
        }
      } else if (msg?.t === 'closed') closed('Your friend closed the room.');
      else if (msg?.t === 'full') closed('That room already has two racers.');
      else if (msg?.t === 'missing') closed('That room is no longer open.');
      else if (msg?.t === WIRE) onWire(msg);
    });
    try {
      current = open(facade, wifi);
      socket = current;
    } catch {
      leave('Could not open a room. Try again.');
    }
  }

  return {
    host: wifi => connect({ t: 'create' }, wifi),
    join(code) { if (roomCode(code)) connect({ t: 'join', room: code }, false); },
    leave,
    ready() {
      if (!room.connected || localReady) return;
      localReady = true;
      wire('ready', { ready: true });
      publish();
      maybeStart();
    },
    send(run, pod, kind) { if (room.connected && round > 0) wire('pose', { pose: packPose(run, pod, kind) }); },
  };
}
