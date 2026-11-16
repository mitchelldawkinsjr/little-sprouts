import { GAME, GROUP, makeGroupRoom, readGroup } from './group-room.mjs';

export function relayGroup({ url, code, message, ended }) {
  const socket = new WebSocket(url);
  let closed = false, admitted = false;
  const timer = setTimeout(() => { if (!admitted) socket.close(); }, 5000);
  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ t: GROUP, game: GAME, type: code ? 'join' : 'create', room: code }));
  });
  socket.addEventListener('message', event => {
    const msg = readGroup(event.data);
    if (!msg) return;
    if (msg.type === 'welcome') { admitted = true; clearTimeout(timer); }
    message(msg);
  });
  socket.addEventListener('close', () => {
    clearTimeout(timer);
    if (!closed) ended(admitted ? 'closed' : 'unavailable');
  });
  return {
    send(value) {
      if (closed || socket.readyState !== 1 || (value.type === 'pose' && socket.bufferedAmount > 8192)) return;
      socket.send(JSON.stringify(value));
    },
    close() { closed = true; clearTimeout(timer); socket.close(); },
  };
}

// The host runs the same room state machine used by the WebSocket relay.
export function localHost({ message, pairing, pair, createRoom = makeGroupRoom }) {
  const room = createRoom();
  const self = { send: value => queueMicrotask(() => { if (!closed) message(value); }) };
  const peers = new Set();
  let pending, closed = false;
  queueMicrotask(() => { if (!closed) room.attach(self); });
  return {
    send(value) { if (!closed) room.receive(self, value); },
    add() {
      if (pending || closed || peers.size >= 3) return;
      pairing(true);
      const facade = new EventTarget();
      let link;
      const connection = { send: value => link.send(JSON.stringify(value)), close: () => link.close() };
      facade.addEventListener('open', () => {
        if (closed || pending !== link) { link.close(); return; }
        pending = null;
        if (room.attach(connection)) {
          peers.add(connection);
          pairing(false);
        } else {
          pairing(false, 'This room is full or the race already started.');
          // Let the reliable channel deliver the reason before closing.
          setTimeout(() => link.close(), 500);
        }
      }, { once: true });
      facade.addEventListener('message', ({ data }) => room.receive(connection, readGroup(data)));
      facade.addEventListener('close', () => {
        if (pending === link) {
          pending = null;
          if (!closed) pairing(false, 'Pairing ended. You can add another friend.');
        }
        if (peers.delete(connection)) room.detach(connection);
      });
      try { link = pair(facade, 'host'); pending = link; }
      catch { pairing(false, 'This browser could not start a Wi-Fi pairing.'); }
    },
    close() {
      closed = true;
      pending?.close();
      room.close();
      peers.clear();
    },
  };
}

export function localGuest({ message, ended, pair }) {
  const facade = new EventTarget();
  let closed = false, admitted = false;
  facade.addEventListener('message', ({ data }) => {
    const msg = readGroup(data);
    if (!msg || closed) return;
    admitted ||= msg.type === 'welcome';
    message(msg);
  });
  facade.addEventListener('close', () => {
    if (!closed) ended(admitted ? 'closed' : 'pairing');
  });
  const link = pair(facade, 'guest');
  return {
    send(value) { if (!closed) link.send(JSON.stringify(value)); },
    close() { closed = true; link.close(); },
  };
}
