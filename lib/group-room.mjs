// The same room authority runs on the relay and on the Wi-Fi host. Transports supply
// a send function per connection. A payload can never choose its own sender or seat.
export const GROUP = 'sprouts-group/1';
export const GAME = 'canyon-pods';
export const SEATS = 4;
const GRID = Array.from({ length: SEATS }, (_, i) => i);
export const COUNTDOWN_MS = 3000;
export const RACE_LIMIT_MS = 120_000;
export const MAX_GROUP_BYTES = 2048;
export const roomCode = value => typeof value === 'string' && /^[a-hj-km-np-z2-9]{4}$/.test(value) ? value : '';
const BUDDIES = ['fox', 'bear', 'bunny', 'frog', 'owl', 'chick'];
const bounded = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;

export function readGroup(text) {
  if (typeof text !== 'string' || text.length > MAX_GROUP_BYTES) return null;
  try {
    const msg = JSON.parse(text);
    return msg?.t === GROUP && typeof msg.type === 'string' ? msg : null;
  } catch { return null; }
}

export function readLoadout(value) {
  if (!Number.isInteger(value?.pod) || !bounded(value.pod, 0, 2) || !BUDDIES.includes(value.kind)) return null;
  return { pod: value.pod, kind: value.kind };
}

export function readMotion(value) {
  if (!value || !bounded(value.d, 0, 2000) || !bounded(value.x, -10, 10) ||
      !bounded(value.speed, 0, 66) || !bounded(value.steer, -1, 1) ||
      typeof value.boost !== 'boolean') return null;
  const { d, x, speed, steer, boost } = value;
  return { d, x, speed, steer, boost };
}

export function makeGroupRoom({ code = '', now = Date.now, schedule = setTimeout, unschedule = clearTimeout, ended = () => {} } = {}) {
  const players = new Map();
  let sequence = 0, round = 0, state = 'lobby', startAt = 0, grid = [], deadline;
  const result = new Map();
  const emit = (member, type, extra) => member.connection.send({ t: GROUP, type, ...extra });
  const all = (type, extra, except) => {
    for (const member of players.values()) if (member !== except) emit(member, type, extra);
  };
  const info = ({ id, seat, ready, loadout }) => ({ id, seat, ready, loadout });
  const roster = () => all('roster', { players: [...players.values()].map(info), state });
  const reject = (connection, reason) => connection.send({ t: GROUP, type: 'error', reason });

  function results(force = false) {
    if (state !== 'race' || (!force && result.size !== grid.length)) return;
    unschedule(deadline);
    state = 'results';
    for (const { id } of grid) if (!result.has(id)) result.set(id, null);
    all('results', { round, finishes: grid.map(({ id, seat }) => ({ id, seat, ms: result.get(id) })) });
  }

  function close() {
    if (state === 'closed') return;
    state = 'closed';
    unschedule(deadline);
    const old = [...players.values()];
    players.clear();
    ended();
    for (const member of old) {
      emit(member, 'closed');
      member.connection.close?.();
    }
  }

  return {
    attach(connection) {
      if (players.has(connection)) return false;
      if (state === 'closed') { reject(connection, 'missing'); return false; }
      if (players.size >= SEATS) { reject(connection, 'full'); return false; }
      if (state === 'race') { reject(connection, 'in-progress'); return false; }
      const seats = new Set([...players.values()].map(p => p.seat));
      const seat = GRID.find(i => !seats.has(i));
      const player = { connection, seat, id: ++sequence, ready: false, loadout: null };
      players.set(connection, player);
      emit(player, 'welcome', { id: player.id, code, game: GAME });
      roster();
      return true;
    },
    receive(connection, msg) {
      const p = players.get(connection);
      if (!p || msg?.t !== GROUP) return;
      const at = now();
      if (msg.type === 'clock' && Number.isSafeInteger(msg.sample) && at - (p.lastClock ?? -Infinity) >= 200) {
        p.lastClock = at;
        emit(p, 'clock', { sample: msg.sample, at });
      } else if (msg.type === 'ready' && state === 'lobby') {
        const loadout = readLoadout(msg.loadout);
        if (!loadout || p.ready) return;
        p.loadout = loadout;
        p.ready = true;
        roster();
      } else if (msg.type === 'start' && state === 'lobby' && p.seat === 0 &&
                  players.size >= 2 && [...players.values()].every(p => p.ready)) {
        round++;
        state = 'race';
        startAt = at + COUNTDOWN_MS;
        grid = [...players.values()].map(info);
        result.clear();
        for (const player of players.values()) { player.lastAt = -Infinity; player.lastD = 0; }
        deadline = schedule(() => results(true), COUNTDOWN_MS + RACE_LIMIT_MS);
        all('start', { round, startAt, at, grid });
      } else if (msg.type === 'rematch' && state === 'results') {
        state = 'lobby';
        for (const player of players.values()) { player.ready = false; player.loadout = null; }
        roster();
      } else if (state === 'race' && msg.round === round && !result.has(p.id) && at >= startAt - 250) {
        if (msg.type === 'pose' && at - p.lastAt >= 35) {
          const pose = readMotion(msg.pose);
          if (!pose || pose.d < p.lastD) return;
          p.lastAt = at;
          p.lastD = pose.d;
          all('pose', { round, id: p.id, pose }, p);
        } else if (msg.type === 'finish' && Number.isSafeInteger(msg.ms) &&
                   bounded(msg.ms, 1000, RACE_LIMIT_MS) && msg.ms <= at - startAt + 500) {
          result.set(p.id, msg.ms);
          all('finish', { round, id: p.id, ms: msg.ms });
          results();
        }
      }
    },
    detach(connection) {
      const p = players.get(connection);
      if (!p) return;
      players.delete(connection);
      if (p.seat === 0) { close(); return; }
      if (state === 'race' && !result.has(p.id)) {
        result.set(p.id, null);
        all('finish', { round, id: p.id, ms: null });
        results();
      }
      roster();
    },
    close,
  };
}
