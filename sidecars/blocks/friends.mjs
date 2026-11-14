// Block meadow with a friend. No Three.js here, so tests can load it.
//
// Two players share the host's world through the same friend rooms as Paint Sphere and
// Garden gulp (lib/friend-link.mjs: the relay with a direct connection on top, or a sound
// and QR handshake on the same Wi-Fi with no internet). The host's world is the one played in:
// a friend who joins sees it in place of their own, and gets their own back on leaving.
// Every build, dig, door, and build kit goes both ways. Each player sees the other as their
// garden buddy. The host's day and night clock is the clock for both.
//
// Messages:
//   hi    { buddy, gear }            who I am, sent when the friend arrives
//   world { i, n, edits }            host to guest: the host's changes, in parts
//   spot  { p }                      host to guest: where to start, next to the host
//   me    { p, yaw }                 where I am, a few times a second
//   ed    { k, v }                   one block changed ('' when dug out)
//   sky   { at }                     host to guest: the day clock

export const SEND_EVERY = 0.1;   // seconds between position messages while moving
export const STILL_EVERY = 1;    // and while standing still
export const SKY_EVERY = 2;      // seconds between clock messages
export const PART = 1500;        // block changes per world message

const KEY = /^-?\d{1,6}\.-?\d{1,4}\.-?\d{1,6}$/;

/** The host's changes in parts small enough for one message each. Always at least one part. */
export function worldParts(entries, size = PART) {
  const list = [...entries];
  const parts = [];
  for (let i = 0; i < list.length; i += size) parts.push(list.slice(i, i + size));
  if (!parts.length) parts.push([]);
  return parts.map((edits, i) => ({ t: 'world', i, n: parts.length, edits }));
}

/** One block change from a friend, checked. `known` says whether a block type exists. */
export function readEdit(k, v, known) {
  if (typeof k !== 'string' || !KEY.test(k)) return null;
  if (v !== '' && (typeof v !== 'string' || v === 'ocean' || !known(v))) return null;
  return { pos: k.split('.').map(Number), type: v };
}

/** The changes from a world message that pass readEdit, as [key, type] pairs. */
export function readWorld(msg, known) {
  if (!msg || !Array.isArray(msg.edits)) return [];
  const out = [];
  for (const e of msg.edits) {
    if (!Array.isArray(e)) continue;
    const ok = readEdit(e[0], e[1], known);
    if (ok) out.push([e[0], ok.type]);
  }
  return out;
}

/** A position from a friend: three finite numbers, or null. */
export function readSpot(p) {
  return Array.isArray(p) && p.length === 3 && p.every(Number.isFinite) ? p.map(Number) : null;
}

/** Collects a world sent in parts. add() returns the whole list once the last part is in. */
export function worldCollector() {
  let parts = [];
  let total = 0;
  return {
    add(msg, known) {
      if (!Number.isInteger(msg?.i) || !Number.isInteger(msg?.n) || msg.n < 1 || msg.n > 1000) return null;
      if (msg.i === 0) { parts = []; total = msg.n; }
      if (msg.n !== total || msg.i !== parts.length) return null;
      parts.push(readWorld(msg, known));
      if (parts.length < total) return null;
      const all = parts.flat();
      parts = [];
      total = 0;
      return all;
    }
  };
}

/** The line in the friend box. */
export function roomLine({ role, peer, room, status, url }) {
  if (role === 'host') {
    if (peer) return 'Your friend is here. Build together!';
    // A room made on the same Wi-Fi with no internet has no link to share.
    return room && room !== 'wifi' ? `Waiting for a friend. Send them this link: ${url}` : (status || 'Waiting for a friend.');
  }
  if (role === 'guest') return peer ? 'You are in your friend’s world. Build together!' : (status || 'Joining…');
  return status || '';
}
