import { GAME, GROUP, groupCapacity, makeGroupRoom, readGroup } from './group-room.mjs';

export function relayGroup({ url, code, game = GAME, message, ended }) {
  const socket = new WebSocket(url);
  let closed = false, admitted = false;
  const timer = setTimeout(() => { if (!admitted) socket.close(); }, 15000);
  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ t: GROUP, game, type: code ? 'join' : 'create', room: code }));
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
      const motion = value.type === 'pose' || ['me', 'sketchbook/1', 'snap'].includes(value.data?.t);
      if (closed || socket.readyState !== 1 || (motion && socket.bufferedAmount > 8192)) return;
      socket.send(JSON.stringify(value));
    },
    close() { closed = true; clearTimeout(timer); socket.close(); },
  };
}

// The host runs the same room state machine used by the WebSocket relay.
export function localHost({ game = GAME, message, pairing, pair, createRoom = makeGroupRoom }) {
  const room = createRoom({ game });
  const self = { send: value => queueMicrotask(() => { if (!closed) message(value); }) };
  const peers = new Set();
  let pending, closed = false;
  queueMicrotask(() => { if (!closed) room.attach(self); });
  return {
    send(value) { if (!closed) room.receive(self, value); },
    add() {
      if (pending || closed || peers.size >= groupCapacity(game) - 1) return;
      pairing(true);
      const facade = new EventTarget();
      let link;
      const connection = { send: value => link.send(JSON.stringify(value)), close: () => link.close() };
      let admissionTimer;
      const reject = reason => {
        if (pending !== link) return;
        pending = null;
        pairing(false, 'Pairing ended. Check that your friend opened the same game.');
        if (reason) connection.send({ t: GROUP, type: 'error', reason });
        setTimeout(() => link.close(), 250);
      };
      facade.addEventListener('open', () => {
        if (closed || pending !== link) { link.close(); return; }
        admissionTimer = setTimeout(() => reject('unavailable'), 4000);
      }, { once: true });
      facade.addEventListener('message', ({ data }) => {
        const msg = readGroup(data);
        if (!msg || closed) return;
        if (peers.has(connection)) { room.receive(connection, msg); return; }
        if (pending !== link || msg.type !== 'identify') return;
        clearTimeout(admissionTimer);
        if (msg.game !== game) { reject('game-mismatch'); return; }
        if (!room.attach(connection)) { reject(); return; }
        peers.add(connection);
        pending = null;
        pairing(false);
      });
      facade.addEventListener('close', () => {
        clearTimeout(admissionTimer);
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

export function localGuest({ game = GAME, message, ended, pair }) {
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
  let link;
  facade.addEventListener('open', () => {
    if (!closed) link.send(JSON.stringify({ t: GROUP, type: 'identify', game }));
  }, { once: true });
  link = pair(facade, 'guest');
  return {
    send(value) { if (!closed) link.send(JSON.stringify(value)); },
    close() { closed = true; link.close(); },
  };
}
