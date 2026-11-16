import { GROUP, COUNTDOWN_MS, roomCode } from '../../lib/group-room.mjs';
import { localGuest, localHost, relayGroup } from '../../lib/group-transport.mjs';
import { RACE, rivalFinish } from './logic.mjs';

export { roomCode };
export const lane = seat => [-6, -2, 2, 6][seat];
export const shortTime = ms => (ms / 1000).toFixed(1);
const quantize = n => Math.round(n * 100) / 100;

export function packPose(run) {
  return { d: Math.min(RACE, quantize(run.d)), x: quantize(run.x), speed: quantize(run.speed),
    steer: quantize(run.steer), boost: run.boost > 0 };
}

export const aiGrid = grid => [0, 1, 2, 3]
  .filter(seat => !grid.some(player => player.seat === seat))
  .map((seat, bot) => ({ seat, bot }));

export function finishOrder(grid, finishes) {
  const times = new Map(finishes.map(({ id, ms }) => [id, ms]));
  const human = grid.map(({ id, seat }) => ({ id, seat, ms: times.get(id) ?? null }));
  const bots = aiGrid(grid).map(({ seat, bot }) => ({ seat, bot, ms: Math.round(rivalFinish(bot) * 1000) }));
  return [...human, ...bots].sort((a, b) => (a.ms ?? Infinity) - (b.ms ?? Infinity) || a.seat - b.seat);
}

const reasons = {
  closed: 'The host closed the room.',
  full: 'That room already has four racers.',
  missing: 'That invite no longer opens a room.',
  'in-progress': 'A race is in progress. Ask your friend to try the invite after the finish.',
  'game-mismatch': 'This invite uses a different game or room version.',
  unavailable: 'The room relay is unavailable. Try Same Wi-Fi if your friends are nearby.',
  pairing: 'Wi-Fi pairing ended. Try joining again.',
};

export function makeFriendRace({ update, start, pose, finish, results, rematch, lost }) {
  let transport, epoch = 0, clockTimer, samples = new Map(), best = Infinity, offset = 0, sample = 0;
  let round = 0, id, room = {};
  const publish = values => { room = { ...room, ...values }; update(room); };
  const send = (type, extra) => transport?.send({ t: GROUP, type, ...extra });
  const clock = () => {
    if (samples.size > 8) samples.clear();
    samples.set(++sample, Date.now());
    send('clock', { sample });
  };

  function leave(status = '') {
    epoch++;
    const old = transport;
    transport = null;
    old?.close();
    clearInterval(clockTimer);
    samples.clear();
    best = Infinity;
    offset = 0;
    id = undefined;
    round = 0;
    room = {};
    publish({ status });
  }

  function incoming(m) {
    if (m.type === 'welcome') {
      id = m.id;
      publish({ id, code: m.code, connected: true, status: '' });
      clock();
      clockTimer = setInterval(clock, 2500);
    } else if (m.type === 'clock' && samples.has(m.sample)) {
      const before = samples.get(m.sample);
      samples.delete(m.sample);
      const rtt = Date.now() - before;
      if (rtt >= 0 && rtt <= best + 5) { best = rtt; offset = m.at - (before + rtt / 2); }
    } else if (m.type === 'roster') {
      const old = room.state;
      publish({ players: m.players, state: m.state });
      if (old === 'results' && m.state === 'lobby') rematch();
    } else if (m.type === 'start' && m.round > round) {
      const self = m.grid.find(p => p.id === id);
      if (!self) return;
      round = m.round;
      publish({ state: 'race' });
      const delay = Number.isFinite(best) ? Math.max(-1000, m.startAt - (Date.now() + offset)) : COUNTDOWN_MS;
      start({ self, grid: m.grid, at: performance.now() + delay });
    } else if (m.round === round && m.type === 'pose') pose(m.id, m.pose);
    else if (m.round === round && m.type === 'finish') finish(m.id, m.ms);
    else if (m.round === round && m.type === 'results') {
      publish({ state: 'results' });
      results(m.finishes);
    }
  }

  function open(mode, code = '') {
    leave();
    const lease = epoch;
    publish({ active: true, mode, status: 'Opening a room…' });
    const current = () => epoch === lease;
    const ended = reason => {
      if (!current()) return;
      const wasConnected = room.connected;
      const status = reasons[reason] || reasons.unavailable;
      leave(status);
      if (wasConnected) lost();
    };
    const message = m => {
      if (!current()) return;
      if (m.type === 'error' || m.type === 'closed') ended(m.reason || 'closed');
      else incoming(m);
    };
    function pair(facade, role) {
      // The Wi-Fi module is already cached with the app, but only pairing loads its UI and audio.
      const pending = { close() { pending.closed = true; pending.link?.close(); },
        send(data) { pending.link?.send(data); } };
      import('../../lib/friend-link.mjs?v=group1').then(m => {
        if (!pending.closed) pending.link = m.pairLocal(facade, role);
      }).catch(() => {
        if (!pending.closed) facade.dispatchEvent(new Event('close'));
      });
      return pending;
    }
    try {
      if (mode === 'wifi-host') {
        transport = localHost({ message, pair, pairing: (pairing, status) => {
          if (current()) publish({ pairing, status });
        } });
        transport.add();
      } else if (mode === 'wifi-guest') transport = localGuest({ message, ended, pair });
      else {
        const url = new URL('/link', location.href);
        url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        transport = relayGroup({ url, code, message, ended });
      }
    } catch { ended('unavailable'); }
  }

  return {
    host: () => open('relay'),
    hostWifi: () => open('wifi-host'),
    guestWifi: () => open('wifi-guest'),
    join: code => { if (roomCode(code)) open('relay', code); },
    add: () => transport?.add?.(),
    leave,
    ready: loadout => send('ready', { loadout }),
    start: () => send('start'),
    rematch: () => send('rematch'),
    send: run => send('pose', { round, pose: packPose(run) }),
    finish: ms => send('finish', { round, ms }),
  };
}
