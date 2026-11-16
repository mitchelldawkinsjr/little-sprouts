// Cabin camp with a friend. No Three.js here, so tests can load it.
//
// Two garden buddies keep one cabin cozy together, through the same friend rooms as Paint
// Sphere, Garden gulp, and Block meadow (lib/friend-link.mjs: the relay with a direct
// connection on top, or a sound and QR handshake on the same Wi-Fi with no internet).
//
// The host's cabin is the one played in. The host runs the raccoons, the rounds, and the
// doors and windows; the friend sees them from snapshots and sends where they are and when
// they spray, and the host's raccoons get wet from the friend's water too. Raccoons go for
// whichever buddy is closer. Each player answers their own Little Sprouts questions and
// picks their own prizes between rounds; the host waits for the friend before the next round.
// A buddy out of hearts naps for a moment and comes back with one; the night only ends when
// both are napping at once.
//
// Messages:
//   hi    { buddy, gear }                      who I am, sent when the friend arrives
//   me    { p: [x, z], yaw, nap }              where I am, a few times a second (both ways)
//   spray { p: [x, z], d: [dx, dz], hot, dmg, pierce, n }  I sprayed (both ways; the host's
//                                               copy is only for show on the friend's screen)
//   snap  { w, k, r: [[id, x, z, yaw, gait, wet]...], o: [hp...] }  host to friend: the cabin
//   home  { id }                               host to friend: that raccoon went home happy
//   ouch  {}                                   host to friend: a raccoon reached you
//   round { n }                                host to friend: round n is cleared
//   wave  { n }                                host to friend: round n starts
//   busy  { on }                               friend to host: answering or picking a prize
//   over  { w, k }                             host to friend: both buddies napped; the night ends

export const SEND_EVERY = 0.1;    // seconds between position messages
export const SNAP_EVERY = 0.1;    // seconds between cabin snapshots
export const NAP_TIME = 8;        // seconds a buddy with no hearts naps
export const BUSY_MAX = 40;       // seconds the host waits for a friend still answering
export const MAX_RACCOONS = 60;

const num = (v) => typeof v === 'number' && Number.isFinite(v);
const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round2 = (v) => Math.round(v * 100) / 100;

/** A position from a friend: [x, z] inside a sensible yard, or null. */
export function readSpot(p, limit = 40) {
  return Array.isArray(p) && p.length === 2 && p.every(num) ? p.map(v => clampN(v, -limit, limit)) : null;
}

/** A spray from a friend, checked and clamped so a bad message can't do anything strange. */
export function readSpray(msg) {
  const p = readSpot(msg?.p);
  const d = Array.isArray(msg?.d) && msg.d.length === 2 && msg.d.every(num) ? msg.d : null;
  if (!p || !d) return null;
  const l = Math.hypot(d[0], d[1]);
  if (l < 1e-3) return null;
  return {
    p,
    d: [d[0] / l, d[1] / l],
    hot: !!msg.hot,
    dmg: num(msg.dmg) ? clampN(msg.dmg, 0.5, 8) : 1,
    pierce: Number.isInteger(msg.pierce) ? clampN(msg.pierce, 0, 3) : 0,
    n: Number.isInteger(msg.n) ? clampN(msg.n, 1, 4) : 1,
  };
}

/** The host's cabin as one small message: round, shooed count, raccoons, and door/window hearts. */
export function packSnap({ wave, kills, raccoons, openings }) {
  return {
    t: 'snap',
    w: wave | 0,
    k: kills | 0,
    r: raccoons.slice(0, MAX_RACCOONS).map(z => [z.id | 0, round2(z.x), round2(z.z), round2(z.yaw), round2(z.gait), z.wet ? 1 : 0]),
    o: openings.map(hp => Math.max(0, Math.round(hp))),
  };
}

/** A snapshot from the host, checked. Bad raccoon rows are dropped; returns null if it isn't one. */
export function readSnap(msg) {
  if (!msg || msg.t !== 'snap' || !Array.isArray(msg.r)) return null;
  const raccoons = [];
  for (const row of msg.r.slice(0, MAX_RACCOONS)) {
    if (!Array.isArray(row) || row.length < 6 || !row.slice(0, 5).every(num) || !Number.isInteger(row[0])) continue;
    raccoons.push({ id: row[0], x: clampN(row[1], -40, 40), z: clampN(row[2], -40, 40), yaw: row[3], gait: clampN(row[4], 0, 1), wet: !!row[5] });
  }
  return {
    wave: Number.isInteger(msg.w) ? Math.max(0, msg.w) : 0,
    kills: Number.isInteger(msg.k) ? Math.max(0, msg.k) : 0,
    raccoons,
    openings: Array.isArray(msg.o) ? msg.o.map(v => (num(v) ? Math.max(0, v) : 0)) : [],
  };
}

/** Which buddy a raccoon goes for: the closer one that is awake. null when both nap. */
export function pickTarget(z, me, friend) {
  const d = (b) => (b && !b.nap ? Math.hypot(b.x - z.x, b.z - z.z) : Infinity);
  const a = d(me), b = d(friend);
  if (a === Infinity && b === Infinity) return null;
  return b < a ? 'friend' : 'me';
}

/** What happens when a buddy runs out of hearts: nap if the other buddy is awake, else the night ends. */
export function outOfHearts({ withFriend, friendNapping }) {
  return withFriend && !friendNapping ? 'nap' : 'over';
}

/** The line in the friend box. */
export function roomLine({ role, peer, room, status, url }) {
  if (role === 'host') {
    if (peer) return 'Your friend is here. Keep the cabin cozy together!';
    return room && room !== 'wifi' ? `Waiting for a friend. Send them this link: ${url}` : (status || 'Waiting for a friend.');
  }
  if (role === 'guest') return peer ? 'You are in your friend’s cabin. Splash together!' : (status || 'Joining…');
  return status || '';
}

/** Nearest eligible buddy of any group size. Input order breaks exact ties. */
export function nearestAwake(from, buddies) {
  let best = null, distance = Infinity;
  for (const buddy of buddies) {
    if (buddy.asleep) continue;
    const d = Math.hypot(buddy.position.x - from.x, buddy.position.z - from.z);
    if (d < distance) { best = buddy; distance = d; }
  }
  return best;
}
