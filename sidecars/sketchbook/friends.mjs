// Sketchbook shares the existing two-player room transport, not either learner's profile.
const VERSION = 'sketchbook/1';
const KINDS = ['fox', 'bear', 'bunny', 'frog', 'owl', 'chick'];
const RIDES = ['plane', 'car', 'heli'];
const bounded = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const vector = (v, size, min, max) => Array.isArray(v) && v.length === size && v.every(n => bounded(n, min, max));
const rounded = arr => arr.map(n => Math.round(n * 10000) / 10000);

export function friendRoomCode(value) {
  return typeof value === 'string' && /^[a-hj-km-np-z2-9]{4}$/.test(value) ? value : '';
}

export function packFriendPose({ p, yaw, gait, kind, gear, ride }) {
  return { t: VERSION, p: rounded(p), yaw, gait, kind, gear, ...(ride ? {
    ride: { type: ride.type, p: rounded(ride.p), q: rounded(ride.q) }
  } : {}) };
}

export function readFriendPose(msg) {
  if (msg?.t !== VERSION || !KINDS.includes(msg.kind) || !vector(msg.p, 3, -2500, 2500) ||
      !bounded(msg.yaw, -Math.PI, Math.PI) || !bounded(msg.gait, 0, 1)) return null;
  const gear = typeof msg.gear === 'string' ? msg.gear.slice(0, 160) : '';
  let ride = null;
  if (msg.ride && RIDES.includes(msg.ride.type) && vector(msg.ride.p, 3, -2500, 2500) && vector(msg.ride.q, 4, -1, 1)) {
    const size = Math.hypot(...msg.ride.q);
    if (size > 0.98 && size < 1.02) ride = { type: msg.ride.type, p: msg.ride.p, q: msg.ride.q.map(n => n / size) };
  }
  return { p: msg.p, yaw: msg.yaw, gait: msg.gait, kind: msg.kind, gear, ride };
}

/** Adapter around the shared WebSocket / direct Wi-Fi room. It only sends local pose data. */
export function makeFriendSession({ transport, update, receive, clear }) {
  let room, peer = false;
  let view = { status: '', code: '', connected: false, active: false };
  function change(values) {
    view = { ...view, ...values };
    update(view);
  }
  function leave(status = '') {
    const old = room;
    room = null;
    peer = false;
    old?.close();
    clear();
    change({ status, code: '', connected: false, active: false });
  }
  function open(first, wifi = false) {
    leave();
    change({ status: 'Opening a room…', active: true });
    const keeper = new EventTarget();
    const current = { close: () => {}, send: () => {} };
    room = current;
    keeper.addEventListener('open', () => { if (room === current) current.send(first); });
    keeper.addEventListener('close', () => { if (room === current) leave('Room closed. You can keep playing.'); });
    keeper.addEventListener('message', ({ data }) => {
      if (room !== current) return;
      let msg;
      try { msg = JSON.parse(data); } catch { return; }
      switch (msg?.t) {
        case 'welcome': {
          const code = msg.role === 'host' ? friendRoomCode(msg.room) : '';
          change({ code, status: code ? 'Send this link to a friend.' :
            msg.role === 'host' ? 'Waiting for a friend…' : 'Joining your friend…' });
          break;
        }
        case 'peer':
          peer = msg.here === true;
          if (!peer) clear();
          change({ connected: peer, status: peer ? 'Your friend is here! Explore together.' : 'Your friend left. You can keep playing.' });
          break;
        case 'full': leave('That room already has two players.'); break;
        case 'missing': leave('That room is no longer open.'); break;
        case 'closed': leave('Your friend closed the room.'); break;
        default: {
          const pose = peer && readFriendPose(msg);
          if (pose) receive(pose);
        }
      }
    });
    try {
      const socket = transport(keeper, wifi);
      if (room !== current) { socket.close(); return; }
      current.close = () => socket.close();
      current.send = msg => socket.send(JSON.stringify(msg));
    } catch {
      if (room === current) leave('Could not open a room. Try again.');
    }
  }
  return {
    get connected() { return peer; },
    host: wifi => open({ t: 'create' }, wifi),
    join: code => { const clean = friendRoomCode(code); if (clean) return open({ t: 'join', room: clean }); },
    leave,
    send(pose) { if (peer) room?.send(packFriendPose(pose)); }
  };
}
