// Station Scout with a friend: two garden buddies walk the same station town, each on their own
// mission. Same friend rooms as Paint Sphere, Garden gulp, Block meadow, and Cabin camp
// (lib/friend-link.mjs: the relay with a direct connection on top, or a sound and QR handshake on
// the same Wi-Fi with no internet). link.js hands the /link WebSocket to it.
//
// Messages (both ways):
//   hi { buddy, gear }          who I am, sent when the friend arrives
//   me { p: [x, z], yaw, run }  where I am, ten times a second
import { makeBuddy, buddyKind, savedLook } from '../../../lib/buddy3d.mjs?v=cabin1';

const SEND_EVERY = 0.1;
const num = v => typeof v === 'number' && Number.isFinite(v);

/** A position from a friend, checked and kept inside the town. */
export function readMe(msg) {
  if (!Array.isArray(msg?.p) || msg.p.length !== 2 || !msg.p.every(num)) return null;
  const clamp = v => Math.max(-400, Math.min(400, v));
  return { x: clamp(msg.p[0]), z: clamp(msg.p[1]), yaw: num(msg.yaw) ? msg.yaw : 0, run: num(msg.run) ? Math.max(0, Math.min(1, msg.run)) : 0 };
}

export function stationFriends({ THREE, scene, player, ground }) {
  const state = { role: 'solo', peer: false, room: '', url: '', status: '' };
  const body = new THREE.Group();
  body.visible = false;
  scene.add(body);
  // A gold ring at the friend's feet, so two buddies of the same kind are easy to tell apart.
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.7, 28), new THREE.MeshBasicMaterial({ color: 0xf0c050, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  body.add(ring);
  let model = null, aim = null, sendAt = 0, time = 0, socket = null;
  const lastPos = new THREE.Vector3();

  // ---- the Friend button and its little status box
  const wrap = document.createElement('div');
  wrap.id = 'friendWrap';
  wrap.innerHTML = `<style>
#friendWrap{position:fixed;left:max(14px,env(safe-area-inset-left));bottom:max(14px,env(safe-area-inset-bottom));z-index:30;max-width:min(340px,calc(100vw - 28px));font-family:var(--round,system-ui)}
#friendBtn{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:8px 14px;border:0;border-radius:14px;background:#fbf8f2ee;color:#33304a;font:800 15px/1 inherit;cursor:pointer;box-shadow:0 4px 12px #1f3a6833}
#friendBox{margin-bottom:8px;padding:10px 12px;border-radius:14px;background:#fbf8f2f2;color:#33304a;font-weight:700;font-size:14px;line-height:1.3;word-break:break-word;box-shadow:0 4px 12px #1f3a6833}
#friendBox p{margin:0 0 8px}#friendBox .row{display:flex;gap:8px;flex-wrap:wrap}
#friendBox button{min-height:40px;padding:6px 12px;border:0;border-radius:10px;background:#1f3a68;color:#fff;font:800 14px inherit;cursor:pointer}
#friendBox button.soft{background:#e6eef8;color:#33304a}
#friendWrap [hidden]{display:none!important}
</style><div id="friendBox" role="status" aria-live="polite" hidden><p id="friendText"></p><div class="row"><button type="button" id="friendCopy" hidden>Copy link</button><button type="button" class="soft" id="friendLeave" hidden>Leave</button></div></div>
<button type="button" id="friendBtn" aria-label="Play with a friend"><span aria-hidden="true">👫</span> Friend</button>`;
  document.body.append(wrap);
  const $ = id => wrap.querySelector('#' + id);

  function line() {
    if (state.role === 'host') {
      if (state.peer) return 'Your friend is here! Look for the gold ring.';
      return state.room && state.room !== 'wifi' ? `Waiting for a friend. Send them this link: ${state.url}` : (state.status || 'Waiting for a friend.');
    }
    if (state.role === 'guest') return state.peer ? 'You are in your friend’s station town. Explore together!' : (state.status || 'Joining…');
    return state.status || '';
  }
  function paint() {
    const text = line();
    $('friendBox').hidden = !text;
    $('friendText').textContent = text;
    $('friendCopy').hidden = !(state.role === 'host' && state.room && state.room !== 'wifi' && !state.peer);
    $('friendLeave').hidden = state.role === 'solo';
    $('friendBtn').hidden = state.role !== 'solo';
  }
  $('friendBtn').addEventListener('click', () => open({ t: 'create' }));
  $('friendCopy').addEventListener('click', () => navigator.clipboard?.writeText(state.url).catch(() => {}));
  $('friendLeave').addEventListener('click', () => leave());

  // ---- the room
  function send(msg) {
    if (socket && state.peer) try { socket.send(JSON.stringify(msg)); } catch { /* closed */ }
  }
  function open(first) {
    close();
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const s = new WebSocket(`${proto}://${location.host}/link`);
    socket = s;
    state.status = 'Opening a room…';
    paint();
    s.addEventListener('open', () => s.send(JSON.stringify(first)));
    s.addEventListener('message', e => { let msg; try { msg = JSON.parse(e.data); } catch { return; } if (msg && typeof msg.t === 'string') onMessage(msg); });
    s.addEventListener('close', () => {
      if (socket !== s) return;
      socket = null;
      const wasSolo = state.role === 'solo';
      if (state.peer) left();
      Object.assign(state, { role: 'solo', peer: false, room: '', url: '', status: wasSolo ? 'Could not open a room. Try again in a little while.' : '' });
      paint();
    });
  }
  function close() { const s = socket; socket = null; try { s?.close(); } catch { /* already closed */ } }
  function leave() {
    close();
    if (state.peer) left();
    Object.assign(state, { role: 'solo', peer: false, room: '', url: '', status: '' });
    paint();
  }
  function onMessage(msg) {
    if (msg.t === 'welcome') {
      state.role = msg.role === 'guest' ? 'guest' : 'host';
      state.room = String(msg.room || '');
      state.url = `${location.origin}${location.pathname}?room=${encodeURIComponent(state.room)}`;
      state.status = state.role === 'host' ? 'Waiting for a friend.' : 'Joining your friend’s station town…';
      if (state.role === 'host' && state.room !== 'wifi') navigator.clipboard?.writeText(state.url).catch(() => {});
    } else if (msg.t === 'peer') {
      const was = state.peer;
      state.peer = !!msg.here;
      if (msg.here && !was) arrived();
      else if (!msg.here && was) left();
    } else if (msg.t === 'full' || msg.t === 'missing' || msg.t === 'closed') {
      state.status = msg.t === 'full' ? 'That room already has two players.' : msg.t === 'missing' ? 'That room is not open any more.' : 'Your friend closed the room.';
      close();
      if (state.peer) left();
      Object.assign(state, { role: 'solo', peer: false, room: '', url: '' });
    } else if (msg.t === 'hi') {
      show(typeof msg.buddy === 'string' ? msg.buddy : 'fox', typeof msg.gear === 'string' ? msg.gear.slice(0, 160) : '');
    } else if (msg.t === 'me') {
      aim = readMe(msg) || aim;
    }
    paint();
  }
  function arrived() {
    const me = savedLook();
    send({ t: 'hi', buddy: buddyKind(me.kind), gear: me.kind ? me.gear : '' });
    sendAt = SEND_EVERY;
  }
  function left() {
    if (model) { body.remove(model.group); model.dispose?.(); model = null; }
    body.visible = false;
    aim = null;
    state.status = state.role === 'host' ? 'Your friend left. They can come back with the same link.' : 'Your friend left.';
  }
  function show(kind, gear) {
    if (model) { body.remove(model.group); model.dispose?.(); }
    model = makeBuddy(THREE, buddyKind(kind), { gear });
    body.add(model.group);
  }

  const room = (new URLSearchParams(location.search).get('room') || '').slice(0, 16);
  if (room) open({ t: 'join', room });
  paint();

  return {
    update(dt) {
      time += dt;
      sendAt += dt;
      if (state.peer && sendAt >= SEND_EVERY) {
        sendAt = 0;
        const moved = Math.hypot(player.pos.x - lastPos.x, player.pos.z - lastPos.z) / Math.max(dt, 1e-3);
        lastPos.set(player.pos.x, 0, player.pos.z);
        send({ t: 'me', p: [+player.pos.x.toFixed(2), +player.pos.z.toFixed(2)], yaw: +player.yaw.toFixed(2), run: +Math.min(1, moved / 5).toFixed(2) });
      }
      if (!model || !aim) { body.visible = false; return; }
      body.visible = true;
      const k = Math.min(1, dt * 10);
      body.position.x += (aim.x - body.position.x) * k;
      body.position.z += (aim.z - body.position.z) * k;
      body.position.y = ground(body.position.x, body.position.z);
      // The player's yaw 0 faces north (-z); the buddy faces +z, so turn it half way round.
      const want = aim.yaw + Math.PI;
      body.rotation.y += Math.atan2(Math.sin(want - body.rotation.y), Math.cos(want - body.rotation.y)) * k;
      model.animate(dt, aim.run, time);
    },
  };
}
