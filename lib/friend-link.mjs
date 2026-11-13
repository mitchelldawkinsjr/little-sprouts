/**
 * Friend rooms for Paint Sphere and Garden gulp, with or without the internet.
 *
 * The games speak the /link room protocol (create, join, welcome, peer, closed, then
 * their own messages) to a WebSocket. Each game's link.js swaps in a stand-in socket,
 * and this module decides what is underneath:
 *
 *   Internet up   The relay hands out the room code as before. Once both sides are in,
 *                 they open a direct WebRTC data channel through it, and game messages
 *                 move there (same Wi-Fi: they never leave the house). If the direct
 *                 channel can't open, messages keep going through the relay.
 *   Internet down No relay answers. A card asks Start or Join. The host's computer chirps
 *                 its connection details (friend-sound.mjs) and shows them as a QR code;
 *                 the friend's computer hears or scans them and answers the same way.
 *                 Then the data channel opens and the game carries on as if the relay
 *                 were there.
 *
 * The games never know which one happened.
 */
import { packSignal, unpackSignal, toQrText, fromQrText } from './friend-wire.mjs?v=friend1';

const STUN = [{ urls: 'stun:stun.l.google.com:19302' }];
const RELAY_WAIT_MS = 3500;
const ROOM_PORT = '5180';
const WIFI_ROOM = 'wifi';
const GATHER_MS = 2500;
const CONNECT_MS = 12000;
const CHIRP_GAP_MS = 1800;
const LOST_MS = 4000;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Test and support hook: which path is in use, and the last signal this page made. */
const probe = { mode: '', transport: 'none', lastSignal: null, rooms: [] };
window.__friendLink = probe;

// Closing the tab hangs up properly, so the friend hears about it at once.
addEventListener('pagehide', () => probe.rooms.forEach((room) => room.dropPeer()));

function relayFallback(url) {
  try {
    const u = new URL(url);
    if (u.port === ROOM_PORT) return '';
    u.port = ROOM_PORT;
    return u.href;
  } catch { return ''; }
}

function gathered(pc) {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') { resolve(); return; }
    const done = () => { if (pc.iceGatheringState === 'complete') resolve(); };
    pc.addEventListener('icegatheringstatechange', done);
    setTimeout(resolve, GATHER_MS);
  });
}

export function openRoom(url, facade, Native) {
  const room = new Room(url, facade, Native);
  probe.rooms.push(room);
  room.connect();
  return room;
}

class Room {
  constructor(url, facade, Native) {
    this.url = url;
    this.facade = facade;
    this.Native = Native;
    this.relay = null;
    this.mode = 'connecting'; // connecting | relay | wifi | closed
    this.role = '';
    this.pc = null;
    this.dc = null;
    this.peerHere = false;
    this.wifiPeer = false;
    this.heldLeave = null;
    this.wifi = null; // { session, signal, answered, sound } while a Wi-Fi handshake runs
    this.panel = null;
    this.chip = null;
    this.ui = null;
  }

  /* ---------- the stand-in socket ---------- */

  fire(type, data) {
    let ev;
    if (type === 'message') ev = new MessageEvent('message', { data });
    else if (type === 'close') ev = new CloseEvent('close');
    else ev = new Event(type);
    this.facade.dispatchEvent(ev);
    try { this.facade[`on${type}`]?.(ev); } catch { /* the game's handler */ }
  }

  tell(msg) {
    this.fire('message', JSON.stringify(msg));
  }

  async connect() {
    const relay = (await this.tryRelay(this.url)) || (await this.tryRelay(relayFallback(this.url)));
    if (this.mode === 'closed') { relay?.close(); return; }
    if (relay) this.useRelay(relay);
    else this.mode = probe.mode = 'wifi';
    this.facade.readyState = 1;
    this.fire('open');
  }

  tryRelay(url) {
    if (!url || (navigator.onLine === false && !/^wss?:\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url))) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      let socket;
      try { socket = new this.Native(url); } catch { resolve(null); return; }
      let settled = false;
      const fail = () => {
        if (settled) return;
        settled = true;
        try { socket.close(); } catch { /* never opened */ }
        resolve(null);
      };
      const timer = setTimeout(fail, RELAY_WAIT_MS);
      socket.addEventListener('error', fail);
      socket.addEventListener('close', fail);
      socket.addEventListener('open', () => {
        if (settled) { socket.close(); return; }
        settled = true;
        clearTimeout(timer);
        resolve(socket);
      });
    });
  }

  /** From the game. */
  send(text) {
    if (this.mode === 'closed') return;
    let msg = null;
    try { msg = JSON.parse(text); } catch { /* not ours to read */ }
    const control = msg && (msg.t === 'create' || msg.t === 'join');
    if (this.mode === 'wifi') {
      if (control) this.startWifi(msg.t === 'join' ? String(msg.room || '') : null);
      else if (this.dc?.readyState === 'open') this.dc.send(text);
      return;
    }
    if (!control && this.dc?.readyState === 'open') { this.dc.send(text); return; }
    if (this.relay?.readyState === 1) this.relay.send(text);
  }

  /** From the game. */
  close() {
    if (this.mode === 'closed') return;
    this.shutdown();
    this.fire('close');
  }

  shutdown() {
    this.mode = 'closed';
    this.facade.readyState = 3;
    this.chip?.();
    this.chip = null;
    this.endWifi();
    this.dropPeer();
    const relay = this.relay;
    this.relay = null;
    try { relay?.close(); } catch { /* gone */ }
  }

  /* ---------- internet: relay first, then direct ---------- */

  useRelay(socket) {
    this.relay = socket;
    this.mode = probe.mode = 'relay';
    probe.transport = 'relay';
    socket.addEventListener('message', (ev) => this.fromRelay(String(ev.data)));
    socket.addEventListener('close', () => {
      if (this.relay !== socket) return;
      this.relay = null;
      // The internet went away mid-game: a direct channel can carry on alone.
      if (this.dc?.readyState === 'open') return;
      this.shutdown();
      this.fire('close');
    });
  }

  fromRelay(text) {
    let msg = null;
    try { msg = JSON.parse(text); } catch { /* pass it on */ }
    if (msg?.t === 'rtc') { this.onRtc(msg); return; }
    // While the direct channel is open, the relay saying "they left" may only mean their
    // internet dropped. Hold it, and pass it on only if the direct channel closes too.
    const leaving = msg?.t === 'closed' || (msg?.t === 'peer' && !msg.here);
    if (leaving && this.dc?.readyState === 'open') { this.heldLeave = text; return; }
    if (msg?.t === 'welcome') {
      this.role = msg.role;
      if (msg.role === 'host') this.offerSoundJoin();
    } else if (msg?.t === 'peer') {
      this.peerHere = !!msg.here;
      this.chip?.();
      this.chip = null;
      if (msg.here && this.role === 'host') this.startDirect();
      if (!msg.here) this.dropPeer();
    } else if (msg?.t === 'closed') {
      this.dropPeer();
    }
    this.fire('message', text);
  }

  newPc(iceServers) {
    this.dropPeer();
    const pc = new RTCPeerConnection({ iceServers });
    this.pc = pc;
    pc.addEventListener('datachannel', (ev) => this.adopt(ev.channel));
    // A friend who closes the lid or walks out of Wi-Fi range never says goodbye:
    // a connection that stays lost for a few seconds counts as gone.
    pc.addEventListener('connectionstatechange', () => {
      const state = pc.connectionState;
      if (state === 'failed' || state === 'closed') this.lost(pc);
      else if (state === 'disconnected') setTimeout(() => { if (pc.connectionState === 'disconnected') this.lost(pc); }, LOST_MS);
    });
    return pc;
  }

  /** The direct channel is gone, however it went. */
  lost(pc) {
    if (this.pc !== pc || !this.dc) return;
    const dc = this.dc;
    this.dc = null;
    try { dc.close(); } catch { /* closed */ }
    probe.transport = this.relay ? 'relay' : 'none';
    this.onDirectClosed();
  }

  adopt(channel) {
    const pc = this.pc;
    this.dc = channel;
    channel.addEventListener('open', () => {
      if (this.dc !== channel) return;
      probe.transport = 'direct';
      this.onDirectOpen();
    });
    channel.addEventListener('message', (ev) => {
      if (this.dc === channel) this.fire('message', String(ev.data));
    });
    channel.addEventListener('close', () => {
      if (this.dc === channel) this.lost(pc);
    });
  }

  dropPeer() {
    const { pc, dc } = this;
    this.pc = null;
    this.dc = null;
    try { dc?.close(); } catch { /* closed */ }
    try { pc?.close(); } catch { /* closed */ }
    if (probe.transport === 'direct') probe.transport = this.relay ? 'relay' : 'none';
  }

  async startDirect() {
    try {
      const pc = this.newPc(STUN);
      this.adopt(pc.createDataChannel('sprouts', { ordered: true }));
      await pc.setLocalDescription(await pc.createOffer());
      await gathered(pc);
      if (this.pc !== pc) return;
      this.relay?.send(JSON.stringify({ t: 'rtc', kind: 'offer', sdp: pc.localDescription.sdp }));
    } catch { this.dropPeer(); /* the relay keeps carrying messages */ }
  }

  async onRtc(msg) {
    try {
      if (msg.kind === 'offer' && this.role === 'guest') {
        const pc = this.newPc(STUN);
        await pc.setRemoteDescription({ type: 'offer', sdp: String(msg.sdp) });
        await pc.setLocalDescription(await pc.createAnswer());
        await gathered(pc);
        if (this.pc !== pc) return;
        this.relay?.send(JSON.stringify({ t: 'rtc', kind: 'answer', sdp: pc.localDescription.sdp }));
      } else if (msg.kind === 'answer' && this.role === 'host' && this.pc) {
        await this.pc.setRemoteDescription({ type: 'answer', sdp: String(msg.sdp) });
      }
    } catch { this.dropPeer(); }
  }

  onDirectOpen() {
    if (this.mode !== 'wifi' && !this.wifi) return; // the relay already said who is here
    // Wi-Fi handshake finished: say what the relay would have said.
    this.endWifi();
    this.wifiPeer = true;
    this.peerHere = true;
    this.tell({ t: 'peer', here: true });
  }

  onDirectClosed() {
    if (this.mode === 'closed') return;
    const held = this.heldLeave;
    this.heldLeave = null;
    if (held && !this.wifiPeer) {
      // The relay already said they left; now the direct channel agrees.
      this.fromRelay(held);
      if (!this.relay && /"closed"/.test(held)) { this.shutdown(); this.fire('close'); }
      return;
    }
    // The relay reports joins and leaves for friends it brought in; Wi-Fi friends are ours to report.
    if (this.mode === 'relay' && this.relay && !this.wifiPeer) return;
    this.wifiPeer = false;
    if (this.role === 'host') {
      this.peerHere = false;
      this.tell({ t: 'peer', here: false });
      this.friendLeft();
    } else {
      this.tell({ t: 'closed' });
      this.shutdown();
      this.fire('close');
    }
  }

  /** An online host whose friend has no internet can still bring them in by sound. */
  async offerSoundJoin() {
    if (this.chip || typeof RTCPeerConnection !== 'function') return;
    const { floatingChip } = await this.loadUi();
    if (this.peerHere || this.mode !== 'relay' || this.chip) return;
    this.chip = floatingChip('📶 Friend has no internet? Join on this Wi-Fi', () => {
      this.chip?.();
      this.chip = null;
      this.hostWifi();
    });
  }

  /* ---------- no internet: Start or Join, then sound or a QR code ---------- */

  async loadUi() {
    if (!this.ui) {
      this.ui = Promise.all([import('./friend-panel.mjs?v=friend1'), import('./friend-sound.mjs?v=friend1')])
        .then(([panel, sound]) => ({ ...panel, ...sound }));
    }
    return this.ui;
  }

  async startWifi(joinRoom) {
    if (typeof RTCPeerConnection !== 'function') {
      this.tell({ t: 'missing' });
      return;
    }
    const { FriendPanel } = await this.loadUi();
    this.panel = this.panel || new FriendPanel();
    let role = joinRoom && joinRoom !== WIFI_ROOM ? 'guest' : await this.panel.choose('No internet right now');
    if (this.mode === 'closed') return;
    if (!role) {
      this.panel.close();
      this.close();
      return;
    }
    this.role = role;
    this.tell({ t: 'welcome', role, room: WIFI_ROOM });
    if (role === 'host') this.hostWifi();
    else this.guestWifi();
  }

  endWifi() {
    const w = this.wifi;
    this.wifi = null;
    w?.sound?.close();
    this.panel?.close();
  }

  async startSound(w) {
    const { SoundLink } = await this.loadUi();
    w.sound = new SoundLink();
    w.sound.onBytes = (bytes) => this.gotSignal(w, bytes);
    try {
      await w.sound.start({ listen: true });
      w.hearing = true;
    } catch {
      // No microphone: chirps can still go out, and the other side's code can be scanned.
      w.hearing = false;
      try { await w.sound.start({ listen: false }); } catch { w.sound = null; }
    }
  }

  async chirpLoop(w, stillNeeded) {
    while (this.wifi === w && w.sound && stillNeeded()) {
      try { await w.sound.play(w.signal); } catch { return; }
      await sleep(CHIRP_GAP_MS);
    }
  }

  scanButton(w) {
    this.panel.button('scan', async () => {
      try {
        await this.panel.scan((text) => {
          const bytes = fromQrText(text);
          if (bytes) this.gotSignal(w, bytes);
        });
      } catch {
        this.panel.button('scan', () => {});
      }
    });
    this.panel.button('cancel', () => this.close());
  }

  async hostWifi() {
    const { FriendPanel } = await this.loadUi();
    this.panel = this.panel || new FriendPanel();
    this.wifi?.sound?.close();
    const w = { session: 1 + Math.floor(Math.random() * 65534), answered: false, sound: null, hearing: false, signal: null };
    this.wifi = w;
    await this.panel.status({ emoji: '⏳', title: 'Getting ready…', text: 'Setting up the room on this computer.', buttons: [{ id: 'cancel', label: 'Cancel', kind: 'soft' }] });
    this.panel.button('cancel', () => this.close());
    try {
      const pc = this.newPc([]);
      this.adopt(pc.createDataChannel('sprouts', { ordered: true }));
      await pc.setLocalDescription(await pc.createOffer());
      await gathered(pc);
      w.signal = packSignal(pc.localDescription.sdp, { kind: 'offer', session: w.session });
      probe.lastSignal = w.signal;
    } catch {
      await this.panel.status({ emoji: '😕', title: 'This browser can’t start a room', text: 'Try Chrome, Edge, Safari, or Firefox.', buttons: [{ id: 'cancel', label: 'Close', kind: 'soft' }] });
      this.panel.button('cancel', () => this.close());
      return;
    }
    await this.startSound(w);
    if (this.wifi !== w) return;
    await this.panel.status({
      emoji: '🔊', pulse: true, title: 'Calling your friend…',
      text: 'On the other computer, press <b>Play with a friend</b>, then <b>Join a friend</b>. Keep the computers close with the sound up.',
      qr: toQrText(w.signal), meter: w.hearing,
      error: w.hearing ? '' : 'The microphone is off, so scan the code on your friend’s screen when it shows one.',
      buttons: [{ id: 'scan', label: '📷 Scan friend’s code' }, { id: 'cancel', label: 'Cancel', kind: 'soft' }]
    });
    if (w.hearing) this.panel.meter(() => w.sound?.level);
    this.scanButton(w);
    this.chirpLoop(w, () => !w.answered);
  }

  async guestWifi() {
    const { FriendPanel } = await this.loadUi();
    this.panel = this.panel || new FriendPanel();
    const w = { session: 0, answered: false, sound: null, hearing: false, signal: null, busy: false };
    this.wifi = w;
    await this.startSound(w);
    if (this.wifi !== w) return;
    await this.panel.status({
      emoji: '👂', pulse: true, title: 'Listening for your friend…',
      text: 'On the other computer, press <b>Play with a friend</b>, then <b>Start a room</b>. Keep the computers close with the sound up.',
      meter: w.hearing,
      error: w.hearing ? '' : 'The microphone is off. Scan the code on your friend’s screen instead.',
      buttons: [{ id: 'scan', label: '📷 Scan friend’s code' }, { id: 'cancel', label: 'Cancel', kind: 'soft' }]
    });
    if (w.hearing) this.panel.meter(() => w.sound?.level);
    this.scanButton(w);
  }

  /** A signal arrived by sound or by camera. */
  async gotSignal(w, bytes) {
    if (this.wifi !== w) return;
    const sig = unpackSignal(bytes);
    if (!sig) return;
    if (this.role === 'host') {
      if (sig.kind !== 'answer' || sig.session !== w.session || w.answered || !this.pc) return;
      w.answered = true;
      w.sound?.stopPlaying();
      this.panel.stopScan();
      await this.panel.status({ emoji: '🤝', pulse: true, title: 'Heard your friend!', text: 'Connecting…', buttons: [{ id: 'cancel', label: 'Cancel', kind: 'soft' }] });
      this.panel.button('cancel', () => this.close());
      try {
        await this.pc.setRemoteDescription({ type: 'answer', sdp: sig.sdp });
      } catch { w.answered = false; }
      this.watchConnect(w, () => this.hostWifi());
      return;
    }
    // Guest: an offer from the host. The same offer arrives again with every chirp.
    if (sig.kind !== 'offer' || w.busy || sig.session === w.session) return;
    w.busy = true;
    w.session = sig.session;
    this.panel.stopScan();
    try {
      const pc = this.newPc([]);
      await pc.setRemoteDescription({ type: 'offer', sdp: sig.sdp });
      await pc.setLocalDescription(await pc.createAnswer());
      await gathered(pc);
      w.signal = packSignal(pc.localDescription.sdp, { kind: 'answer', session: w.session });
      probe.lastSignal = w.signal;
    } catch {
      w.busy = false;
      w.session = 0;
      return;
    }
    w.busy = false;
    if (this.wifi !== w) return;
    await this.panel.status({
      emoji: '🔊', pulse: true, title: 'Found your friend!',
      text: 'Answering… keep the computers close.',
      qr: toQrText(w.signal),
      buttons: [{ id: 'cancel', label: 'Cancel', kind: 'soft' }]
    });
    this.panel.button('cancel', () => this.close());
    this.chirpLoop(w, () => this.dc?.readyState !== 'open');
    this.watchConnect(w, () => this.guestWifi());
  }

  watchConnect(w, retry) {
    setTimeout(async () => {
      if (this.wifi !== w || this.dc?.readyState === 'open') return;
      await this.panel.status({
        emoji: '😕', title: 'Couldn’t connect',
        text: 'Check that both computers are on the same Wi-Fi (not a guest network), then try again.',
        buttons: [{ id: 'again', label: 'Try again', kind: 'go' }, { id: 'cancel', label: 'Cancel', kind: 'soft' }]
      });
      this.panel.button('again', () => retry());
      this.panel.button('cancel', () => this.close());
    }, CONNECT_MS);
  }

  async friendLeft() {
    if (this.role !== 'host' || this.mode === 'closed') return;
    const { FriendPanel } = await this.loadUi();
    this.panel = this.panel || new FriendPanel();
    await this.panel.status({
      emoji: '👋', title: 'Your friend left',
      text: 'You can call them back into this room.',
      buttons: [{ id: 'again', label: '🔊 Call again', kind: 'go' }, { id: 'later', label: 'Not now', kind: 'soft' }]
    });
    this.panel.button('again', () => this.hostWifi());
    this.panel.button('later', () => this.panel.close());
  }
}
