// INKWAVE with a friend, head to head (see friend-core.js for the wire and the mirror).
//
// 👫 Friend opens a room and shows a link. When the friend opens it, the host starts a fresh match
// with the friend on the other team, in place of one of the other team's bots. Each computer runs
// its own player; everyone else on that screen is a puppet the network steers: it walks, swims,
// jumps, and sprays with the game's own code, so ink lands on both screens, and it is pulled back
// to where its own computer says whenever it drifts. Puppets don't take damage on this screen:
// a player is splatted on their own screen, and the host's bots on the host's. The host runs the
// clock and the bots, and the host's turf count decides the match on both screens.
//
// Messages (JSON, through the /link room):
//   hello { name }                         friend → host: ready to play (after the page loads)
//   start { map, dur, pal, roster }        host → friend: a fresh match; roster[id] = [weapon, name]
//   w     { a: [actor...], time, st, cov? }   host → friend: host player and bots, clock, state, turf
//   me    { a: actor }                     friend → host: the friend's player
import { G } from './core/ctx.js';
import { MAPS, TEAM_PALETTES, COLORBLIND_PALETTE } from './config.js';
import { BotBrain } from './game/bots.js';
import {
  TEAM_SIZE, SEND_EVERY, COVER_EVERY, SNAP_DIST, packActor, readActor, readStart, mirrorCoverage, friendLine,
} from './friend-core.js?v=f1';

const PALETTES = [...TEAM_PALETTES, COLORBLIND_PALETTE];
const params = new URLSearchParams(location.search);

export function initFriend(game) {
  const friend = { role: 'solo', peer: false, room: '', url: '', status: '', live: false };
  const nets = new Map();      // this screen's actor id → latest state from the other screen
  const seen = new Map();      // actor id → { jumps, specials } already acted on
  let socket = null;
  let sendT = 0, coverT = 0;
  let hostCov = null;
  let pendingStart = null;
  let starting = false;
  let peerName = 'Friend';

  // ---------------------------------------------------------------- the room
  function open(first) {
    close();
    const s = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/link`);
    socket = s;
    friend.status = 'Opening a room…';
    paint();
    s.addEventListener('open', () => s.send(JSON.stringify(first)));
    s.addEventListener('message', (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } if (m && typeof m.t === 'string') onMessage(m); });
    s.addEventListener('close', () => {
      if (socket !== s) return;
      socket = null;
      const had = friend.peer, was = friend.role;
      Object.assign(friend, { role: 'solo', peer: false, room: '', url: '', live: false });
      friend.status = was === 'solo' ? 'Could not open a room. Try again in a little while.' : '';
      if (had) left();
      paint();
    });
  }
  function close() { const s = socket; socket = null; try { s?.close(); } catch { /* closed */ } }
  function send(msg) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg)); }
  function leave() {
    const had = friend.peer;
    close();
    Object.assign(friend, { role: 'solo', peer: false, room: '', url: '', status: '', live: false });
    if (had) left();
    paint();
  }

  function onMessage(m) {
    if (m.t === 'welcome') {
      friend.role = m.role === 'guest' ? 'guest' : 'host';
      friend.room = String(m.room || '');
      friend.url = `${location.origin}${location.pathname}?room=${encodeURIComponent(friend.room)}`;
      friend.status = friend.role === 'host' ? 'Waiting for a friend.' : 'Joining your friend…';
      if (friend.role === 'host' && friend.room !== 'wifi') navigator.clipboard?.writeText(friend.url).catch(() => {});
      paint();
      return;
    }
    if (m.t === 'peer') {
      const was = friend.peer;
      friend.peer = !!m.here;
      if (friend.peer && !was && friend.role === 'guest') sayHello();
      if (!friend.peer && was) left();
      paint();
      return;
    }
    if (m.t === 'full' || m.t === 'missing' || m.t === 'closed') {
      friend.status = m.t === 'full' ? 'That room already has two players.' : m.t === 'missing' ? 'That room is not open any more.' : 'Your friend closed the room.';
      const had = friend.peer;
      close();
      Object.assign(friend, { role: 'solo', peer: false, room: '', url: '', live: false });
      if (had) left();
      paint();
      return;
    }
    if (m.t === 'hello' && friend.role === 'host') { peerName = String(m.name || 'Friend').slice(0, 16); startForTwo(); return; }
    if (m.t === 'start' && friend.role === 'guest') { const s = readStart(m, MAPS, PALETTES); if (s) joinStart(s); return; }
    if (m.t === 'w' && friend.role === 'guest') {
      if (Array.isArray(m.a)) for (const row of m.a) { const a = readActor(row); if (a) nets.set(a.id, { ...a, at: performance.now() }); }
      if (Array.isArray(m.cov) && m.cov.length === 2 && m.cov.every(Number.isFinite)) hostCov = mirrorCoverage(m.cov);
      syncClock(m);
      return;
    }
    if (m.t === 'me' && friend.role === 'host') {
      const a = readActor(m.a);
      if (a && a.id === TEAM_SIZE) nets.set(a.id, { ...a, at: performance.now() });
    }
  }

  // The friend's page has finished loading (or the friend just arrived): ask for a match.
  function sayHello() {
    if (!booted()) { setTimeout(sayHello, 500); return; }
    send({ t: 'hello', name: game.profile?.name || 'Friend' });
  }
  const booted = () => !!G.mode && G.mode !== 'boot' && !!game.timer;

  // ---------------------------------------------------------------- matches
  // The host: a fresh match, the friend in place of the other team's first bot.
  async function startForTwo() {
    if (starting) return;
    starting = true;
    friend.live = true;
    nets.clear(); seen.clear(); hostCov = null;
    const o = game.lastMatchOpts || {};
    try { await realStart({ mapId: o.mapId || game.mapDef?.id, duration: o.duration, difficulty: o.difficulty }); } finally { starting = false; }
    const m = game.match;
    if (!m) return;
    m.actors[TEAM_SIZE].name = peerName;
    makePuppet(m.actors[TEAM_SIZE]);
    send({
      t: 'start', map: game.mapDef.id, dur: m.duration, pal: game.palette?.id || '',
      roster: m.actors.map((a) => [a.weaponId, a.name]),
    });
    say('Your friend is here! You are on opposite teams.');
  }

  // The friend: the same match, turned around.
  async function joinStart(s) {
    if (!booted()) { pendingStart = s; return; }
    friend.live = true;
    nets.clear(); seen.clear(); hostCov = null;
    const pick = game._pickPalette;
    if (s.pal) game._pickPalette = () => ({ ...s.pal, a: s.pal.b, b: s.pal.a, names: [...(s.pal.names || [])].reverse() });
    starting = true;
    try { await realStart({ mapId: s.map, duration: s.dur, difficulty: 'easy' }); } finally { game._pickPalette = pick; starting = false; }
    const m = game.match;
    if (!m) return;
    m.actors.forEach((a, id) => {
      const r = s.roster[id];
      if (r && r.weapon && r.weapon !== a.weaponId) { try { a.setWeapon(r.weapon); } catch { /* keep its own */ } }
      if (r && r.name && !a.isLocal) a.name = r.name;
      if (!a.isLocal) makePuppet(a);
    });
    // the host's turf count decides the match on both screens
    const judge = m._judge.bind(m);
    m._judgeSolo = judge;
    m._judge = () => {
      if (!hostCov) { judge(); return; }
      const cov = hostCov;
      m.result = { coverage: cov, winner: cov[0] === cov[1] ? 1 : cov[0] > cov[1] ? 0 : 1 };
      m.setState('judge');
    };
  }

  // startMatch, kept for the friend code; a solo start while a friend is here goes through the room.
  const realStart = game.startMatch.bind(game);
  game.startMatch = async (o = {}) => {
    if (friend.peer && !starting) {
      if (friend.role === 'host') return startForTwo();
      say('Your friend starts the next match.');
      return;
    }
    return realStart(o);
  };

  // ---------------------------------------------------------------- puppets
  function makePuppet(a) {
    a.bot = null;
    a.puppet = true;
    a.damage = () => false;
    const splat = a.splat.bind(a);
    a.splat = (att, cause) => { if (a._netSplat) splat(att, cause); };
    a._netSplat = false;
  }

  function steer(a, n, dt) {
    if (!n) { a.intent.fire = a.intent.squid = a.intent.sub = a.intent.jump = a.intent.special = false; a.intent.move.set(0, 0, 0); return; }
    if (!n.alive) {
      if (a.alive) { a._netSplat = true; a.splat(null, 'net'); a._netSplat = false; }
      a.respawnTimer = 1e9;
      return;
    }
    if (!a.alive) a.respawn();
    // where its own computer says it is now, a moment after the message
    const age = Math.min(0.25, (performance.now() - n.at) / 1000);
    const tx = n.pos[0] + n.vel[0] * age, ty = n.pos[1] + n.vel[1] * age, tz = n.pos[2] + n.vel[2] * age;
    const dx = tx - a.pos.x, dy = ty - a.pos.y, dz = tz - a.pos.z;
    if (Math.hypot(dx, dy, dz) > SNAP_DIST) { a.pos.set(tx, ty, tz); a.character.root.position.copy(a.pos); }
    else { const k = Math.min(1, dt * 10); a.pos.x += dx * k; a.pos.y += dy * k; a.pos.z += dz * k; }
    a.vel.set(n.vel[0], n.vel[1], n.vel[2]);
    a.aimYaw = n.aimYaw; a.aimPitch = n.aimPitch;
    a.special = n.special;
    const it = a.intent;
    it.move.set(n.move[0], 0, n.move[1]);
    it.fire = n.fire; it.squid = n.squid; it.sub = n.sub;
    const s = seen.get(a) || { jumps: n.jumps, specials: n.specials };
    it.jump = n.jumps > s.jumps;
    it.special = n.specials > s.specials;
    s.jumps = n.jumps; s.specials = n.specials;
    seen.set(a, s);
  }

  // Count presses on this screen's own players, so a tap between two messages still arrives.
  const presses = new Map();
  function state(a, id) {
    const p = presses.get(a) || { jumps: 0, specials: 0, j: false, s: false };
    if (a.intent.jump && !p.j) p.jumps++;
    if (a.intent.special && !p.s) p.specials++;
    p.j = a.intent.jump; p.s = a.intent.special;
    presses.set(a, p);
    return packActor({
      id, pos: [a.pos.x, a.pos.y, a.pos.z], vel: [a.vel.x, a.vel.y, a.vel.z], yaw: a.yaw, aimYaw: a.aimYaw, aimPitch: a.aimPitch,
      move: [a.intent.move.x, a.intent.move.z], fire: a.intent.fire, squid: a.intent.squid, sub: a.intent.sub,
      alive: a.alive, jumps: p.jumps, specials: p.specials, special: a.special,
    });
  }

  function syncClock(msg) {
    const m = game.match;
    if (!m || m.attract || !Number.isFinite(msg.time)) return;
    if (msg.st === 'playing' && m.state === 'intro') m.setState('playing');
    if (m.state === 'playing' && msg.st === 'playing') m.time = Math.max(0, msg.time);
  }

  // Runs before each step of the match on this screen.
  function beforeUpdate(m, dt) {
    if (!friend.live || !friend.peer || m.attract) return;
    m.actors.forEach((a, id) => { if (a.puppet) steer(a, nets.get(id), dt); });
    // Little Sprouts: a question card holds this player still (and safe) instead of pausing the match
    if (game.sprouts?.busy && m.local?.alive) {
      const it = m.local.intent;
      it.move.set(0, 0, 0); it.fire = it.squid = it.sub = it.jump = it.special = false;
      m.local.invuln = Math.max(m.local.invuln, 0.3);
    }
  }

  // Once a frame: send this screen's own players.
  function tick(dt) {
    const m = game.match;
    if (!friend.live || !friend.peer || !m || m.attract) return;
    sendT += dt; coverT += dt;
    if (sendT < SEND_EVERY) return;
    sendT = 0;
    if (friend.role === 'host') {
      const rows = m.actors.map((a, id) => (a.puppet ? null : state(a, id))).filter(Boolean);
      const out = { t: 'w', a: rows, st: m.state, time: m.time };
      if (coverT >= COVER_EVERY || m.state !== 'playing') { coverT = 0; out.cov = G.paint.coverage(); }
      send(out);
    } else if (m.local) send({ t: 'me', a: state(m.local, 0) });
  }

  // Hook the match as it is made: puppets are steered just before each step.
  const hookMatch = () => {
    const m = game.match;
    if (!m || m._friendHooked) return;
    m._friendHooked = true;
    const update = m.update.bind(m);
    m.update = (dt) => { beforeUpdate(m, dt); update(dt); };
  };

  function left() {
    friend.live = false;
    nets.clear();
    const m = game.match;
    if (m && !m.attract) {
      // the other screen's players go back to being ordinary bots, and the match plays on
      for (const a of m.actors) {
        if (!a.puppet) continue;
        a.puppet = false; delete a.damage; delete a.splat;
        if (!a.alive) a.respawnTimer = 1;
        a.bot = new BotBrain(a, 'easy');
      }
      if (m._judgeSolo) { m._judge = m._judgeSolo; }
      say('Your friend left. Bots take their place.');
    }
  }

  const say = (text) => G.hud?.feed?.({ text, color: '#ffffff', kind: 'info' });

  // ---------------------------------------------------------------- the friend box
  const css = document.createElement('style');
  css.textContent = `
#ink-friend{position:fixed;left:12px;top:12px;z-index:40;display:flex;flex-direction:column;align-items:flex-start;gap:6px;font:700 14px/1.3 system-ui,sans-serif;pointer-events:none}
#ink-friend button{pointer-events:auto;border:0;border-radius:999px;padding:8px 14px;background:#fff;color:#1b1d3a;font:800 14px system-ui,sans-serif;cursor:pointer;box-shadow:0 3px 12px #0005}
#ink-friend .box{pointer-events:auto;max-width:min(420px,calc(100vw - 24px));background:#fffdf6;color:#1b1d3a;border-radius:16px;padding:10px 12px;box-shadow:0 6px 20px #0006;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
#ink-friend .box p{margin:0;flex:1 1 100%;word-break:break-all}
#ink-friend .box button{background:#eef2ff;box-shadow:none}
#ink-friend [hidden]{display:none}`;
  document.head.append(css);
  const root = document.createElement('div');
  root.id = 'ink-friend';
  root.innerHTML = '<button type="button" class="go">👫 Friend</button><div class="box" hidden><p></p><button type="button" class="copy">Copy link</button><button type="button" class="leave">Leave</button></div>';
  document.body.append(root);
  const $ = (s) => root.querySelector(s);
  $('.go').addEventListener('click', (e) => { e.stopPropagation(); open({ t: 'create' }); });
  $('.leave').addEventListener('click', (e) => { e.stopPropagation(); leave(); });
  $('.copy').addEventListener('click', (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(friend.url).then(() => say('Link copied'), () => {});
  });
  for (const ev of ['mousedown', 'pointerdown']) root.addEventListener(ev, (e) => e.stopPropagation());
  function paint() {
    const line = friendLine(friend);
    $('.box').hidden = !line;
    $('.box p').textContent = line;
    $('.copy').hidden = !(friend.role === 'host' && !friend.peer && friend.room && friend.room !== 'wifi');
    $('.leave').hidden = friend.role === 'solo';
    $('.go').hidden = friend.role !== 'solo';
  }
  paint();

  // Opened from a friend's link: join their room.
  const roomParam = params.get('room');
  if (roomParam) open({ t: 'join', room: roomParam });

  return {
    get live() { return friend.live && friend.peer; },
    get role() { return friend.role; },
    /** Call once a frame, after the game has booted. */
    tick(dt) {
      if (pendingStart && booted()) { const s = pendingStart; pendingStart = null; joinStart(s); }
      hookMatch();
      tick(dt);
    },
    state: friend,
  };
}
