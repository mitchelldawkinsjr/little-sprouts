// Shared friend-room client for ongoing worlds, without Canyon Pods' race rules.
import { GROUP, groupCapacity, roomCode } from './group-room.mjs';
import { localGuest, localHost, relayGroup } from './group-transport.mjs';

const messages = {
  full: 'This room is full.',
  missing: 'This invite no longer opens a room.',
  closed: 'The host closed the room.',
  'game-mismatch': 'Open the same game as your friend before joining.',
  pairing: 'Wi-Fi pairing ended. Try joining again.',
  unavailable: 'The room relay is unavailable. Try the Same Wi-Fi buttons if your friends are nearby.',
};
const initial = () => ({ active: false, role: 'solo', others: [], status: '', url: '' });

export function makeWorldFriends({ game, update, admit = () => {}, arrived = () => {}, departed = () => {}, leave = () => {}, receive }) {
  const capacity = groupCapacity(game);
  let transport, state = initial();
  const publish = changes => { state = { ...state, ...changes }; update(state); };
  function close(reason = '') {
    const previous = state, old = transport;
    transport = null;
    state = initial();
    old?.close();
    for (const peer of previous.others) departed(peer);
    if (previous.role !== 'solo') leave(previous);
    publish({ status: reason });
  }
  function open(mode, code = '') {
    close();
    const ticket = {};
    publish({ active: true, mode, status: 'Opening a room…', ticket });
    const current = () => state.ticket === ticket;
    const end = reason => { if (current()) close(messages[reason] || messages.unavailable); };
    const message = msg => {
      if (!current()) return;
      if (msg.type === 'error' || msg.type === 'closed') end(msg.reason || 'closed');
      else if (msg.type === 'welcome') {
        if (msg.game !== game) { end('game-mismatch'); return; }
        const role = mode === 'wifi-guest' || code ? 'guest' : 'host';
        const url = new URL(location.pathname, location.origin);
        // Preserve the user's graphics settings on an invite, not profile or debug data.
        const here = new URLSearchParams(location.search);
        for (const key of ['q', 'lite']) if (here.has(key)) url.searchParams.set(key, here.get(key));
        if (msg.code) { url.searchParams.set('room', msg.code); url.searchParams.set('v', 'group1'); }
        publish({ id: msg.id, role, url: role === 'host' && msg.code ? url.href : '', status: '' });
        admit(state);
      } else if (msg.type === 'roster') {
        const old = state.others;
        const others = msg.players.filter(p => p.id !== state.id);
        const host = msg.players.find(p => p.seat === 0)?.id;
        publish({ others, host, seat: msg.players.find(p => p.id === state.id)?.seat });
        for (const peer of old) if (!others.some(p => p.id === peer.id)) departed(peer);
        for (const peer of others) if (!old.some(p => p.id === peer.id)) arrived(peer);
      } else if (msg.type === 'event') {
        const from = state.others.find(p => p.id === msg.id);
        if (from) receive(msg.data, from);
      }
    };
    function pair(facade, role) {
      const handle = { close() { handle.closed = true; handle.link?.close(); },
        send(data) { handle.link?.send(data); } };
      import('./friend-link.mjs?v=group1').then(mod => {
        if (!handle.closed) handle.link = mod.pairLocal(facade, role);
      }).catch(() => {
        if (!handle.closed) facade.dispatchEvent(new Event('close'));
      });
      return handle;
    }
    try {
      if (mode === 'wifi-host') {
        transport = localHost({ game, message, pair, pairing: (pairing, status) => {
          if (current()) publish({ pairing, status });
        } });
        transport.add();
      } else if (mode === 'wifi-guest') transport = localGuest({ game, message, ended: end, pair });
      else {
        const url = new URL('/link', location.href);
        url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        transport = relayGroup({ game, url, code, message, ended: end });
      }
    } catch { end('unavailable'); }
  }
  const api = {
    capacity,
    get state() { return state; },
    host: () => open('relay'),
    hostWifi: () => open('wifi-host'),
    guestWifi: () => open('wifi-guest'),
    add: () => transport?.add?.(),
    join(code) { if (roomCode(code)) open('relay', code); else close(messages.missing); },
    fromInvite() {
      const params = new URLSearchParams(location.search);
      if (!params.has('room')) return;
      if (params.get('v') !== 'group1') { close('This is an older invite. Ask your friend for a new link.'); return; }
      api.join(params.get('room'));
    },
    close,
    send(data, to) { transport?.send({ t: GROUP, type: 'event', data, to }); },
  };
  return api;
}

export function worldFriendStatus(state, capacity) {
  if (state.status) return state.status;
  if (state.pairing) return 'Pairing a friend on this Wi-Fi…';
  if (state.role === 'solo') return 'Start a room or join a friend on the same Wi-Fi.';
  return `${state.others.length + 1} of ${capacity} players${state.others.length ? '' : ' · Waiting for friends…'}`;
}

export function mountWorldFriendControls({ room, button, box, text, row, beforeOpen = () => true }) {
  let shown = false, wasActive = false;
  const make = (label, action) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.textContent = label;
    node.onclick = e => { e.stopPropagation(); action(); };
    row.append(node);
    return node;
  };
  const invite = document.createElement('a');
  invite.textContent = 'Invite link';
  invite.target = '_blank';
  invite.rel = 'noopener';
  box.insertBefore(invite, row);
  const online = make('Start an online room', () => beforeOpen() && room.host());
  const wifi = make('Host on same Wi-Fi', () => beforeOpen() && room.hostWifi());
  const join = make('Join on same Wi-Fi', () => beforeOpen() && room.guestWifi());
  const add = make('Add another friend', room.add);
  const copy = make('Copy invite', async () => {
    try { await navigator.clipboard.writeText(room.state.url); text.textContent = 'Invite copied.'; }
    catch { text.textContent = room.state.url; }
  });
  const leave = make('Leave room', () => room.close());
  const dismiss = make('Hide', () => { shown = false; paint(room.state); });
  function paint(state) {
    if (state.active && !wasActive) shown = true;
    wasActive = state.active;
    if (state.status && !state.active) shown = true;
    box.hidden = !shown;
    button.setAttribute('aria-expanded', String(shown));
    text.textContent = worldFriendStatus(state, room.capacity);
    online.hidden = wifi.hidden = join.hidden = !!state.active;
    add.hidden = !(state.mode === 'wifi-host' && state.role === 'host' && state.others.length + 1 < room.capacity);
    add.disabled = !!state.pairing;
    invite.hidden = copy.hidden = !state.url;
    invite.href = state.url || '#';
    leave.hidden = !state.active;
    dismiss.hidden = false;
  }
  button.type = 'button';
  button.addEventListener('click', e => {
    e.stopPropagation();
    shown = !shown;
    paint(room.state);
  });
  box.addEventListener('mousedown', e => e.stopPropagation());
  button.addEventListener('mousedown', e => e.stopPropagation());
  addEventListener('pagehide', () => room.close());
  paint(room.state);
  return paint;
}
