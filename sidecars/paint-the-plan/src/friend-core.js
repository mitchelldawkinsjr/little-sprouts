// INKWAVE with a friend, head to head: the parts with no 3D in them, so tests can load them.
//
// Two players, one on each team, through the same friend rooms as Paint Sphere and Cabin camp
// (lib/friend-link.mjs). Every map is point-symmetric (src/world/level.js builds one half and
// mirrors it through the middle), so the friend's computer plays the same match turned around:
// each player is "team 0, slot 0" on their own screen, at their own base, with their own team in
// front of them. Across the wire a position is mirrored through the middle of the map, a facing
// turns half a circle, and team t on one screen is team 1 - t on the other.
//
// Actor ids are team * 4 + slot in the sender's own world; the receiver turns them with peerId().
// The host runs the clock, the bots, and the final score; each player runs their own buddy.

export const TEAM_SIZE = 4;
export const SEND_EVERY = 1 / 15;   // seconds between state messages
export const COVER_EVERY = 1;       // seconds between the host's turf counts
export const SNAP_DIST = 3;         // farther than this from where the network says, jump straight there
export const MAX_COORD = 400;

const num = (v) => typeof v === 'number' && Number.isFinite(v);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;

/** The same actor on the other screen: team flips, slot stays. */
export function peerId(id) {
  const team = Math.floor(id / TEAM_SIZE), slot = id % TEAM_SIZE;
  return (1 - team) * TEAM_SIZE + slot;
}

/** A point through the middle of the map: x and z flip, height stays. */
export function mirrorPoint([x, y, z]) { return [-x, y, -z]; }

/** A facing turned half a circle, kept in -π..π. */
export function mirrorYaw(yaw) {
  let a = yaw + Math.PI;
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

/** Turf counts from the other screen: their team 0 is our team 1. */
export function mirrorCoverage(cov) { return [cov[1], cov[0]]; }

const FLAGS = { fire: 1, squid: 2, sub: 4, alive: 8 };

/**
 * One actor as a small array:
 * [id, x, y, z, vx, vy, vz, yaw, aimYaw, aimPitch, moveX, moveZ, flags, jumps, specials, special]
 * `jumps` and `specials` count presses, so a quick tap between two messages is never lost.
 */
export function packActor(a) {
  const flags = (a.fire ? FLAGS.fire : 0) | (a.squid ? FLAGS.squid : 0) | (a.sub ? FLAGS.sub : 0) | (a.alive ? FLAGS.alive : 0);
  return [a.id | 0, r2(a.pos[0]), r2(a.pos[1]), r2(a.pos[2]), r2(a.vel[0]), r2(a.vel[1]), r2(a.vel[2]),
    r3(a.yaw), r3(a.aimYaw), r3(a.aimPitch), r2(a.move[0]), r2(a.move[1]), flags, a.jumps | 0, a.specials | 0, Math.round(a.special || 0)];
}

/**
 * An actor from the other screen, checked, clamped, and already turned into this screen's world
 * (id, mirror, facing). Returns null for anything that isn't one.
 */
export function readActor(row) {
  if (!Array.isArray(row) || row.length < 16 || !row.every(num)) return null;
  const id = row[0];
  if (!Number.isInteger(id) || id < 0 || id >= TEAM_SIZE * 2) return null;
  const c = (v) => clamp(v, -MAX_COORD, MAX_COORD);
  const flags = row[12] | 0;
  return {
    id: peerId(id),
    pos: mirrorPoint([c(row[1]), c(row[2]), c(row[3])]),
    vel: mirrorPoint([clamp(row[4], -60, 60), clamp(row[5], -60, 60), clamp(row[6], -60, 60)]),
    yaw: mirrorYaw(row[7]),
    aimYaw: mirrorYaw(row[8]),
    aimPitch: clamp(row[9], -1.6, 1.6),
    move: [-clamp(row[10], -1, 1), -clamp(row[11], -1, 1)],
    fire: !!(flags & FLAGS.fire),
    squid: !!(flags & FLAGS.squid),
    sub: !!(flags & FLAGS.sub),
    alive: !!(flags & FLAGS.alive),
    jumps: Math.max(0, row[13] | 0),
    specials: Math.max(0, row[14] | 0),
    special: clamp(row[15], 0, 10000),
  };
}

/**
 * The match the host starts, for the friend's screen: map, length, palette (the friend's own team
 * colour first, so each team is the same colour on both screens), and who carries which weapon,
 * by this screen's actor ids.
 */
export function readStart(msg, maps, palettes) {
  if (!msg || msg.t !== 'start') return null;
  const map = maps.find((m) => m.id === msg.map);
  if (!map) return null;
  const dur = num(msg.dur) ? clamp(msg.dur, 30, 600) : 180;
  const pal = palettes.find((p) => p.id === msg.pal) || null;
  const roster = new Array(TEAM_SIZE * 2).fill(null);
  if (Array.isArray(msg.roster)) {
    msg.roster.slice(0, TEAM_SIZE * 2).forEach((r, id) => {
      if (!Array.isArray(r)) return;
      roster[peerId(id)] = { weapon: String(r[0] || ''), name: String(r[1] || '').slice(0, 24) };
    });
  }
  return { map: map.id, dur, pal, roster };
}

/** Which way a press counter moved: true once for each new press. */
export function pressed(count, seen) { return count > seen; }

/** The line in the friend box. */
export function friendLine({ role, peer, room, url, status }) {
  if (role === 'host') {
    if (peer) return 'You vs your friend! You are on opposite teams.';
    return room && room !== 'wifi' ? `Waiting for a friend. Send them this link: ${url}` : (status || 'Waiting for a friend.');
  }
  if (role === 'guest') return peer ? 'You vs your friend! You are on opposite teams.' : (status || 'Joining…');
  return status || '';
}
