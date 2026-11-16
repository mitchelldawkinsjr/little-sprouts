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
import { packSignal, unpackSignal, toQrText, fromQrText, readSdp } from './friend-wire.mjs?v=group1';

const STUN = [{ urls: 'stun:stun.l.google.com:19302' }];
const RELAY_WAIT_MS = 3500;
const ROOM_PORT = '5180';
const WIFI_ROOM = 'wifi';
const GATHER_MS = 2500;
const CONNECT_MS = 20000;   // room for a call, an answer, and one more try if the two chirps collide
const CHIRP_GAP_MS = 1800;
// After each call, the host stays quiet long enough for the friend to hear it, build an answer
// (up to GATHER_MS), and chirp the answer back, which takes about as long as the call itself.
const ANSWER_ROOM = 1.4;
const HANDSHAKE_SLACK_MS = 1500;
const BUSY_WAIT_MS = 8000;
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

export function openRoom(url, facade, Native, options = {}) {
  const room = new Room(url, facade, Native, options);
  probe.rooms.push(room);
  room.connect();
  return room;
}

// One cancellable, isolated pairing attempt. Group hosts keep one of these
// instances per guest, so opening a pairing card never touches a live channel.
export function pairLocal(facade, role) {
  const room = new Room('', facade, null, { wifi: true, wifiChip: false, pairOnly: true });
  room.mode = 'wifi';
  room.role = role;
  const duringPair = setTimeout(() => { if (!room.wifiPeer) room.close(); }, 120_000);
  const stop = () => clearTimeout(duringPair);
  facade.addEventListener('close', stop, { once: true });
  facade.addEventListener('open', stop, { once: true });
  const pairing = role === 'host' ? room.hostWifi() : room.guestWifi();
  pairing.catch(() => room.close());
  return room;
}

class Room {
  constructor(url, facade, Native, { wifi = false, wifiChip = true, pairOnly = false } = {}) {
    this.url = url;
    this.facade = facade;
    this.Native = Native;
    this.wifiOnly = wifi;
    this.wifiChip = wifiChip;
    this.pairOnly = pairOnly;
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
    const relay = this.wifiOnly ? await Promise.resolve(null)
      : (await this.tryRelay(this.url)) || (await this.tryRelay(relayFallback(this.url)));
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
    probe.rooms = probe.rooms.filter(room => room !== this);
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
      if (msg.role === 'host' && this.wifiChip) this.offerSoundJoin();
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
    if (this.pairOnly) this.fire('open');
    else this.tell({ t: 'peer', here: true });
  }

  onDirectClosed() {
    if (this.mode === 'closed') return;
    if (this.pairOnly) { this.close(); return; }
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
      this.ui = Promise.all([import('./friend-panel.mjs?v=group1'), import('./friend-sound.mjs?v=group1')])
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
    if (this.wifi !== w) return;
    w.sound = new SoundLink();
    w.sound.onBytes = (bytes) => { void this.gotSignal(w, bytes).catch(() => this.close()); };
    try {
      await w.sound.start({ listen: true });
      if (this.wifi !== w) w.sound.close();
    } catch {
      if (this.wifi !== w) return;
      // No microphone: chirps can still go out, and the other side's code can be scanned.
      try { await w.sound.start({ listen: false }); } catch { w.sound = null; }
    }
  }

  playPairSignal(w) {
    if (this.wifi !== w || !w.audioReady || !w.signal || w.chirping) return;
    w.chirping = true;
    const host = this.role === 'host';
    void this.chirpLoop(w, () => host ? !w.answered : !this.wifiPeer, { host });
  }

  async chirpLoop(w, stillNeeded, { host = false } = {}) {
    while (this.wifi === w && w.sound && stillNeeded()) {
      // Never talk over the friend: wait while a chirp is coming in.
      const waitUntil = performance.now() + BUSY_WAIT_MS;
      while (w.sound?.busy && performance.now() < waitUntil && this.wifi === w && stillNeeded()) await sleep(200);
      if (this.wifi !== w || !w.sound || !stillNeeded()) return;
      const began = performance.now();
      try { await w.sound.play(w.signal); } catch { return; }
      const chirp = performance.now() - began;
      // The host leaves room for the whole answer. Both add a little jitter so they don't stay in step.
      const gap = host ? Math.max(CHIRP_GAP_MS, GATHER_MS + chirp * ANSWER_ROOM + HANDSHAKE_SLACK_MS) : CHIRP_GAP_MS;
      await sleep(gap + Math.random() * 700);
    }
  }

  scanButton(w) {
    this.panel.button('scan', async () => {
      try {
        await this.panel.scan((text) => {
          const bytes = fromQrText(text);
          if (bytes) void this.gotSignal(w, bytes).catch(() => this.close());
        });
      } catch {
        this.panel.problem('The camera didn’t open. Allow the camera for this site, or keep the computers close so they can hear each other.');
      }
    });
    this.panel.button('cancel', () => this.close());
  }

  async hostWifi() {
    const { FriendPanel } = await this.loadUi();
    if (this.mode === 'closed') return;
    this.panel = this.panel || new FriendPanel();
    this.wifi?.sound?.close();
    const w = { session: 1 + crypto.getRandomValues(new Uint16Array(1))[0] % 65534, answered: false, sound: null, signal: null };
    this.wifi = w;
    await this.panel.status({ emoji: '⏳', title: 'Getting ready…', text: 'Setting up the room on this computer.', buttons: [{ id: 'cancel', label: 'Cancel', kind: 'soft' }] });
    this.panel.button('cancel', () => this.close());
    try {
      const pc = this.newPc([]);
      this.adopt(pc.createDataChannel('sprouts', { ordered: true }));
      await pc.setLocalDescription(await pc.createOffer());
      await gathered(pc);
      if (this.wifi !== w) return;
      if (this.pairOnly && !readSdp(pc.localDescription.sdp).candidates.length) throw new Error('no local candidates');
      w.signal = packSignal(pc.localDescription.sdp, { kind: 'offer', session: w.session, version: this.pairOnly ? 2 : undefined });
      probe.lastSignal = w.signal;
    } catch {
      if (this.wifi !== w) return;
      await this.panel.status({ emoji: '😕', title: 'Couldn’t start a Wi-Fi room',
        text: 'Check that this device is connected to Wi-Fi and that the browser allows local connections. Then try again.', buttons: [{ id: 'cancel', label: 'Close', kind: 'soft' }] });
      this.panel.button('cancel', () => this.close());
      return;
    }
    // Do not block the QR route on a microphone permission prompt or audio startup.
    void this.startSound(w).then(() => {
      if (this.wifi !== w) return;
      w.audioReady = true;
      this.playPairSignal(w);
    }).catch(() => {});
    await this.panel.status({
      emoji: '🔊', pulse: true, title: 'Calling your friend…',
      text: this.pairOnly
        ? 'On the other device, choose <b>Join on same Wi-Fi</b>. Scan the code or turn the sound up.'
        : 'On the other computer, press <b>Play with a friend</b>, then <b>Join a friend</b>. Keep the computers close with the sound up.',
      qr: toQrText(w.signal), meter: true, current: () => this.wifi === w,
      small: 'If you prefer not to use the microphone, scan each other’s codes.',
      buttons: [{ id: 'scan', label: '📷 Scan friend’s code' }, { id: 'cancel', label: 'Cancel', kind: 'soft' }]
    });
    if (this.wifi !== w) return;
    this.panel.meter(() => w.sound?.level);
    this.scanButton(w);
    this.playPairSignal(w);
  }

  async guestWifi() {
    const { FriendPanel } = await this.loadUi();
    if (this.mode === 'closed') return;
    this.panel = this.panel || new FriendPanel();
    const w = { session: 0, answered: false, sound: null, signal: null, busy: false };
    this.wifi = w;
    // Do not block the QR route on a microphone permission prompt or audio startup.
    void this.startSound(w).then(() => {
      if (this.wifi !== w) return;
      w.audioReady = true;
      this.playPairSignal(w);
    }).catch(() => {});
    await this.panel.status({
      emoji: '👂', pulse: true, title: 'Listening for your friend…',
      text: this.pairOnly
        ? 'Ask the host to choose <b>Host on same Wi-Fi</b> or <b>Add another friend</b>, then scan their code or listen for the chirp.'
        : 'On the other computer, press <b>Play with a friend</b>, then <b>Start a room</b>. Keep the computers close with the sound up.',
      meter: true,
      small: 'If you prefer not to use the microphone, scan the code on the host’s screen.',
      buttons: [{ id: 'scan', label: '📷 Scan friend’s code' }, { id: 'cancel', label: 'Cancel', kind: 'soft' }]
    });
    if (this.wifi !== w) return;
    this.panel.meter(() => w.sound?.level);
    this.scanButton(w);
  }

  /** A signal arrived by sound or by camera. */
  async gotSignal(w, bytes) {
    if (this.wifi !== w) return;
    const sig = unpackSignal(bytes, this.pairOnly ? 2 : undefined);
    if (!sig) return;
    if (this.role === 'host') {
      if (sig.kind !== 'answer' || sig.session !== w.session || w.answered || !this.pc) return;
      w.answered = true;
      w.sound?.stopPlaying();
      this.panel.stopScan();
      await this.panel.status({ emoji: '🤝', pulse: true, title: 'Heard your friend!', text: 'Connecting…', buttons: [{ id: 'cancel', label: 'Cancel', kind: 'soft' }] });
      this.panel.button('cancel', () => this.close());
      if (this.wifi !== w || !this.pc) return;
      try {
        await this.pc.setRemoteDescription({ type: 'answer', sdp: sig.sdp });
      } catch { /* let the retry card replace this attempt */ }
      this.watchConnect(w, () => this.hostWifi());
      return;
    }
    // Guest: an offer from the host. The same offer arrives again with every chirp.
    if (sig.kind !== 'offer' || w.busy || w.signal || sig.session === w.session) return;
    w.busy = true;
    w.session = sig.session;
    this.panel.stopScan();
    try {
      const pc = this.newPc([]);
      await pc.setRemoteDescription({ type: 'offer', sdp: sig.sdp });
      await pc.setLocalDescription(await pc.createAnswer());
      await gathered(pc);
      if (this.wifi !== w) return;
      w.signal = packSignal(pc.localDescription.sdp, { kind: 'answer', session: w.session, version: this.pairOnly ? 2 : undefined });
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
      qr: toQrText(w.signal), current: () => this.wifi === w,
      buttons: [{ id: 'cancel', label: 'Cancel', kind: 'soft' }]
    });
    this.panel.button('cancel', () => this.close());
    if (this.wifi !== w) return;
    this.playPairSignal(w);
    this.watchConnect(w, () => this.guestWifi());
  }

  watchConnect(w, retry) {
    setTimeout(async () => {
      if (this.wifi !== w || this.dc?.readyState === 'open') return;
      if (this.pairOnly) { w.sound?.close(); this.dropPeer(); }
      await this.panel.status({
        emoji: '😕', title: 'Couldn’t connect',
        text: 'Check that both computers are on the same Wi-Fi (not a guest network), then try again.',
        buttons: [{ id: 'again', label: 'Try again', kind: 'go' }, { id: 'cancel', label: 'Cancel', kind: 'soft' }]
      });
      this.panel.button('again', () => retry().catch(() => this.close()));
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
