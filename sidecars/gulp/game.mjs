/**
 * Garden gulp — drag to move a hole through a garden. Swallow what fits.
 * Friend rooms use the same /link relay as Paint Sphere: host simulates, guest sends input.
 */
import * as THREE from 'three';
import {
  ROUND_SECONDS, START_RADIUS, MAP_HALF, BLOCK, ROAD, CELL,
  buildBits, stepHole, trySwallowBits, tryRivalGulp, ranks, scoreFromRadius, clampPos,
  aliveCount, cityCleared, touchedBubbles, rightAnswerGrow, wrongAnswerShrink
} from './logic.mjs?v=gulp11';
import { localQuestion, normalizeQuestion, placeBubbles } from './quiz.mjs?v=gulp11';
import {
  resolveAutoQuality, pixelRatioCap, rendererOptions, isPerformanceTier
} from '../../lib/device-tier.mjs?v=low-end1';
import { readPad, moveDirs, actionDown } from '../../lib/pad-core.mjs?v=pad-rt';

const $ = (id) => document.getElementById(id);
const overlay = $('overlay');
const roomEl = $('room');
const playBtn = $('play');
const friendBtn = $('friend');
const resultEl = $('result');
const card = overlay.querySelector('.card');
const podium = $('podium');
const verdictEl = $('verdict');
const reasonEl = $('reason');
const boardEl = $('board');
const intro = ['title', 'blurb', 'help'].map($);
const hud = $('hud');
const clockEl = $('clock');
const youScore = $('youScore');
const themScore = $('themScore');
const stage = $('stage');
const askEl = $('ask');
const askText = $('askText');
const toastEl = $('toast');
const youStars = $('youStars');
const SIDECAR_SOURCE = 'sprouts-sidecar';

let session = null;
let link = null;
let ready = false;

function call(fn, arg) {
  try { return fn?.(arg); } catch { return undefined; }
}

class Link {
  constructor(game, onChange) {
    this.game = game;
    this.onChange = onChange;
    this.role = 'solo';
    this.peer = false;
    this.room = '';
    this.status = '';
    this.url = '';
    this.socket = null;
    this.seq = 0;
    this.held = { x: 0, z: 0 };
    this.sendAt = 0;
    this.snapAt = 0;
  }

  host() { this.open({ t: 'create' }); }
  join(code) { this.open({ t: 'join', room: code }); }

  open(msg) {
    this.socket?.close();
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${proto}://${location.host}/link`);
    this.socket = socket;
    this.status = 'Connecting…';
    this.onChange();
    socket.addEventListener('open', () => {
      if (this.socket === socket) socket.send(JSON.stringify(msg));
    });
    socket.addEventListener('message', (ev) => {
      if (this.socket === socket) this.receive(String(ev.data));
    });
    socket.addEventListener('close', () => {
      if (this.socket !== socket) return;
      this.socket = null;
      if (this.role === 'solo') {
        this.status = 'Could not open the link.';
        this.onChange();
        return;
      }
      const wasGuest = this.role === 'guest';
      this.role = 'solo';
      this.peer = false;
      this.room = '';
      this.url = '';
      this.status = wasGuest ? 'The host left. You can play on your own.' : '';
      if (wasGuest) this.game.dropLink();
      this.onChange();
    });
  }

  receive(text) {
    let msg;
    try { msg = JSON.parse(text); } catch { return; }
    if (msg.t === 'welcome') {
      this.role = msg.role;
      this.room = msg.room;
      this.url = `${location.origin}${location.pathname}?room=${msg.room}`;
      if (msg.role === 'host') {
        this.game.becomeHost();
        this.status = 'Waiting for a friend.';
        history.replaceState(null, '', `?room=${msg.room}`);
        navigator.clipboard?.writeText(this.url).catch(() => {});
      } else {
        this.game.becomeGuest();
        this.status = 'Waiting for the host to start.';
      }
      this.onChange();
      return;
    }
    if (msg.t === 'peer') {
      this.peer = !!msg.here;
      this.status = msg.here
        ? (this.role === 'host' ? 'Friend joined. Press Play.' : 'Waiting for the host to start.')
        : 'Your friend left. The link still works if they rejoin.';
      if (!msg.here) this.game.clearGuest();
      this.onChange();
      return;
    }
    if (msg.t === 'full' || msg.t === 'missing' || msg.t === 'closed') {
      this.status = msg.t === 'full' ? 'That room is full.'
        : msg.t === 'missing' ? 'That room is not open.'
        : 'The host left.';
      if (msg.t === 'closed') this.game.abandon();
      this.onChange();
      return;
    }
    if (msg.t === 'input' && this.role === 'host') {
      this.game.setGuestInput(msg);
      return;
    }
    if (msg.t === 'round' && this.role === 'guest') {
      this.game.adoptRound(msg);
      this.onChange();
      return;
    }
    if (msg.t === 'snap' && this.role === 'guest') {
      this.game.applySnap(msg);
      return;
    }
    if (msg.t === 'end' && this.role === 'guest') {
      this.game.applyEnd(msg);
      this.onChange();
    }
  }

  send(msg) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(msg));
  }

  capture(input) {
    this.held = input;
  }

  flush(dt) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    if (this.role === 'host') {
      this.snapAt += dt;
      if (this.snapAt < 0.05 || this.game.phase !== 'play') return;
      this.snapAt = 0;
      this.send(this.game.snapshot());
      return;
    }
    if (this.role !== 'guest' || this.game.phase !== 'play') return;
    this.sendAt += dt;
    if (this.sendAt < 0.05) return;
    this.sendAt = 0;
    this.seq += 1;
    this.send({ t: 'input', seq: this.seq, x: this.held.x, z: this.held.z });
  }
}

class Game {
  constructor() {
    this.phase = 'menu';
    this.linkRole = 'solo';
    this.seed = 1;
    this.timeLeft = ROUND_SECONDS;
    this.bits = [];
    this.you = null;
    this.them = null;
    this.bots = [];
    this.guestInput = { x: 0, z: 0 };
    this.localInput = { x: 0, z: 0 };
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.meshes = new Map();
    this.holeMeshes = new Map();
    this.raf = 0;
    this.last = 0;
    this.reduced = false;
    this.abandoned = false;
    this.quiz = new Quiz(this);
  }

  becomeHost() {
    this.linkRole = 'host';
    this.them = makeHole('friend', 0x4a90c8, 6, 0);
  }

  becomeGuest() {
    this.linkRole = 'guest';
    this.them = makeHole('host', 0xe07a4a, -6, 0);
  }

  dropLink() {
    this.linkRole = 'solo';
    this.them = null;
  }

  clearGuest() {
    if (this.phase === 'play') return;
    this.them = null;
  }

  abandon() {
    this.abandoned = true;
    if (this.phase === 'play') this.endRound('The room closed.');
    else this.dropLink();
  }

  setGuestInput(msg) {
    this.guestInput = { x: msg.x || 0, z: msg.z || 0 };
  }

  begin(seed = (Date.now() & 0xffff) || 1) {
    this.abandoned = false;
    this.seed = seed;
    this.timeLeft = ROUND_SECONDS;
    this.bits = buildBits(seed);
    this.you = makeHole('you', 0xe07a4a, -4, 0);
    if (this.linkRole === 'host') {
      this.them = makeHole('friend', 0x4a90c8, 4, 0);
      this.bots = [];
    } else if (this.linkRole === 'guest') {
      this.them = makeHole('host', 0x4a90c8, 4, 0);
      this.bots = [];
    } else {
      this.them = null;
      this.bots = [
        makeHole('bot1', 0x7a5ea7, 8, 8),
        makeHole('bot2', 0x2f7d72, -8, -6)
      ];
    }
    this.phase = 'play';
    this.rebuildWorld();
    this.quiz.start();
    overlay.hidden = true;
    hud.hidden = false;
    resultEl.hidden = true;
    this.showPodium(false);
    call(window.SproutsSidecar?.progress, 'Growing');
  }

  adoptRound(msg) {
    this.begin(msg.seed || 1);
    this.timeLeft = msg.seconds ?? ROUND_SECONDS;
  }

  snapshot() {
    return {
      t: 'snap',
      time: this.timeLeft,
      you: packHole(this.you),
      them: packHole(this.them),
      gone: this.bits.filter(b => !b.alive).map(b => b.id),
      quiz: this.quiz.pack()
    };
  }

  applySnap(msg) {
    if (this.phase !== 'play') return;
    this.timeLeft = msg.time;
    // Guest's local hole is "you"; host's snap.you is the host's hole = them for guest.
    applyHole(this.them, msg.you);
    applyHole(this.you, msg.them);
    // Same seed builds the same city, so the host only sends what was eaten.
    const gone = new Set(msg.gone || []);
    for (const bit of this.bits) bit.alive = !gone.has(bit.id);
    const before = { stars: this.you.stars, misses: this.you.misses };
    this.quiz.adopt(msg.quiz);
    if (this.you.stars > before.stars) this.quiz.toast('Yes! ⭐', 'good');
    else if (this.you.misses > before.misses) this.quiz.toast('Not yet', 'bad');
    this.syncMeshes();
    this.paintHud();
    if (cityCleared(this.bits)) this.endRound('City cleared!');
  }

  applyEnd(msg) {
    // The host's board calls the host "you" and the guest "friend"; flip it for this side.
    const flip = { you: 'host', friend: 'you' };
    const list = (msg.ranks || []).map(r => ({ ...r, id: flip[r.id] || r.id }));
    this.endRound(msg.line || 'Round over.', list.length ? list : undefined);
  }

  endRound(line, list) {
    if (this.phase === 'ended') return;
    this.phase = 'ended';
    const asked = this.quiz.asked;
    this.quiz.stop();
    const board = list || ranks(this.players());
    const place = board.findIndex(r => r.id === 'you') + 1;
    const score = scoreFromRadius(this.you?.r || START_RADIUS);
    const top = board[0]?.score ?? 0;
    const tied = place > 0 && board[place - 1].score === top && board.filter(r => r.score === top).length > 1;
    const won = place === 1 && !tied;
    const outcome = won ? 'win' : tied ? 'tie' : 'lose';

    verdictEl.innerHTML = '';
    const emoji = document.createElement('span');
    emoji.className = 'emoji';
    emoji.textContent = won ? '🏆' : tied ? '🤝' : '🕳️';
    verdictEl.append(emoji, won ? 'You win!' : tied ? 'It’s a tie!' : 'Nice try!');
    reasonEl.textContent = won
      ? `${line} You were the biggest hole.`
      : tied ? `${line} You matched the biggest hole.`
      : `${line} ${holeName(board[0]?.id)} grew the biggest.`;
    if (asked) {
      const n = this.you?.stars || 0;
      reasonEl.textContent += n ? ` You gulped ${n} right answer${n === 1 ? '' : 's'}.` : ' Gulp right answers to grow fast.';
    }

    boardEl.replaceChildren(...board.map((row, i) => {
      const li = document.createElement('li');
      if (row.id === 'you') li.className = 'me';
      const medal = ['🥇', '🥈', '🥉'][i] || String(i + 1);
      const hole = this.players().find(h => h.id === row.id);
      li.innerHTML = '<span class="place"></span><span class="dot"></span><span class="name"></span><span class="pts"></span>';
      li.querySelector('.place').textContent = medal;
      li.querySelector('.dot').style.background = `#${(hole?.color ?? 0x888888).toString(16).padStart(6, '0')}`;
      li.querySelector('.name').textContent = holeName(row.id);
      li.querySelector('.pts').textContent = hole?.stars ? `⭐${hole.stars}  ${row.score}` : String(row.score);
      return li;
    }));

    card.classList.toggle('win', won);
    card.classList.toggle('lose', !won);
    this.showPodium(true);
    overlay.hidden = false;
    playBtn.textContent = 'Play again';
    friendBtn.hidden = this.linkRole !== 'solo';
    call(window.SproutsSidecar?.progress, `Score ${score}`);
    call(window.SproutsSidecar?.finish, outcome === 'lose' ? 'miss' : 'cleared');
    this.paintHud();
  }

  showPodium(on) {
    podium.hidden = !on;
    for (const el of intro) el.hidden = on;
    if (!on) card.classList.remove('win', 'lose');
  }

  players() {
    return [this.you, this.them, ...this.bots].filter(Boolean);
  }

  rebuildWorld() {
    if (!this.scene) return;
    for (const mesh of this.meshes.values()) {
      this.scene.remove(mesh);
      mesh.dispose?.();
    }
    this.meshes.clear();
    for (const mesh of this.holeMeshes.values()) {
      this.scene.remove(mesh);
      mesh.traverse?.(c => {
        c.geometry?.dispose?.();
        c.material?.dispose?.();
      });
    }
    this.holeMeshes.clear();

    // One InstancedMesh per (kind, part): ~20 draw calls instead of ~3000 meshes.
    // Thousands of separate meshes made iOS Safari kill the tab on Play.
    const byKind = new Map();
    for (const bit of this.bits) {
      if (!byKind.has(bit.kind)) byKind.set(bit.kind, []);
      byKind.get(bit.kind).push(bit);
    }
    this.bitSlots = new Map();
    for (const [kind, list] of byKind) {
      const parts = kindParts(THREE, kind, list[0].color);
      const meshes = parts.map((part, p) => {
        const mesh = new THREE.InstancedMesh(part.geo, part.mat, list.length);
        mesh.frustumCulled = false;
        this.meshes.set(`${kind}:${p}`, mesh);
        this.scene.add(mesh);
        return mesh;
      });
      list.forEach((bit, i) => {
        bit.shown = null;
        this.bitSlots.set(bit.id, { meshes, i });
      });
    }
    for (const hole of this.players()) {
      const group = holeMesh(THREE, hole);
      this.holeMeshes.set(hole.id, group);
      this.scene.add(group);
    }
    this.syncMeshes();
  }

  syncMeshes() {
    const dirty = new Set();
    for (const bit of this.bits) {
      const key = bit.alive ? `${bit.x},${bit.z},${bit.size}` : '';
      if (bit.shown === key) continue;
      const slot = this.bitSlots?.get(bit.id);
      if (!slot) continue;
      bit.shown = key;
      if (bit.alive) {
        SCRATCH.makeScale(bit.size, bit.size, bit.size);
        SCRATCH.setPosition(bit.x, 0, bit.z);
      } else {
        SCRATCH.makeScale(0, 0, 0);
      }
      for (const mesh of slot.meshes) {
        mesh.setMatrixAt(slot.i, SCRATCH);
        dirty.add(mesh);
      }
    }
    for (const mesh of dirty) mesh.instanceMatrix.needsUpdate = true;
    for (const hole of this.players()) {
      const group = this.holeMeshes.get(hole.id);
      if (!group) continue;
      group.position.set(hole.x, 0.11, hole.z);
      group.scale.setScalar(hole.r / START_RADIUS);
      group.visible = !(hole.stunUntil > performance.now() / 1000 && Math.floor(performance.now() / 120) % 2);
      // The rim flashes red after a wrong answer, so the shrink is easy to notice.
      const hurt = hole.hurtUntil > performance.now() / 1000;
      group.children[1]?.material.color.setHex(hurt && Math.floor(performance.now() / 110) % 2 ? 0xd9362b : hole.color);
    }
  }

  tick(dt) {
    if (this.phase !== 'play') return;
    link?.flush(dt);
    if (this.linkRole === 'guest') {
      this.quiz.bob(performance.now() / 1000);
      this.followCamera(this.you);
      return;
    }

    const now = performance.now() / 1000;
    stepHole(this.you, this.localInput, dt);
    trySwallowBits(this.you, this.bits);
    this.quiz.tick(now);

    if (this.linkRole === 'host' && this.them) {
      stepHole(this.them, this.guestInput, dt);
      trySwallowBits(this.them, this.bits);
      tryRivalGulp(this.you, this.them, now);
      tryRivalGulp(this.them, this.you, now);
    }

    for (const bot of this.bots) {
      if (bot.stunUntil > now) continue;
      const target = nearestBite(bot, this.bits) || this.you;
      const input = {
        x: target.x - bot.x,
        z: target.z - bot.z
      };
      if (target === this.you && !canChase(bot, this.you)) {
        input.x = bot.x - this.you.x;
        input.z = bot.z - this.you.z;
      }
      stepHole(bot, input, dt, 7.5);
      trySwallowBits(bot, this.bits);
      tryRivalGulp(bot, this.you, now);
      tryRivalGulp(this.you, bot, now);
    }

    this.timeLeft -= dt;
    this.syncMeshes();
    this.followCamera(this.you);
    this.paintHud();
    const board = ranks(this.players());
    if (cityCleared(this.bits)) {
      const line = 'City cleared!';
      if (this.linkRole === 'host') link?.send({ t: 'end', ranks: board, line });
      this.endRound(line, board);
      return;
    }
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      if (this.linkRole === 'host') link?.send({ t: 'end', ranks: board, line: 'Time is up.' });
      this.endRound('Time is up.', board);
    }
  }

  followCamera(hole) {
    if (!this.camera || !hole) return;
    const goal = new THREE.Vector3(hole.x, 24 + hole.r * 5, hole.z + 18 + hole.r * 2.5);
    this.camera.position.lerp(goal, 0.12);
    this.camera.lookAt(hole.x, 0, hole.z);
  }

  paintHud() {
    const left = aliveCount(this.bits || []);
    const secs = Math.ceil(Math.max(0, this.timeLeft));
    clockEl.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} · ${left} left`;
    youScore.textContent = String(scoreFromRadius(this.you?.r || START_RADIUS));
    youStars.textContent = this.quiz.asked ? ` ⭐${this.you?.stars || 0}` : '';
    themScore.textContent = this.them || this.bots.length
      ? String(scoreFromRadius((this.them || this.bots[0])?.r || START_RADIUS))
      : '—';
  }
}

/**
 * Answer bubbles. A question floats over the city with labelled bubbles around you.
 * Gulp a right one to grow fast (and keep gulping the other right copies for more).
 * A wrong one shrinks you a little and the question stays.
 *   mode 'local' — this page makes the questions (own page, friend rooms)
 *   mode 'wait'  — inside Little Sprouts, waiting for the host's first question
 *   mode 'host'  — questions from the learner's profile; picks go back to the host
 *   mode 'off'   — arcade play or the host has no more questions
 */
class Quiz {
  constructor(game) {
    this.game = game;
    this.mode = 'local';
    this.q = null;
    this.qid = 0;
    this.bubbles = [];
    this.answered = false;
    this.nextAt = 0;
    this.index = 0;
    this.hostKey = '';
    this.pending = null;
    this.waitSince = 0;
    this.asked = false;
    this.group = null;
    this.mats = [];
    this.toastTimer = 0;
    this.upcoming = null;
  }

  /** Room play always uses local questions; the host of the room runs them. */
  get source() {
    return this.game.linkRole === 'solo' ? this.mode : 'local';
  }

  embedded() {
    if (this.mode === 'local') this.mode = 'wait';
  }

  off() {
    this.mode = 'off';
    this.pending = null;
    this.clear();
  }

  hostAsk(msg) {
    if (this.mode === 'off') return;
    const q = normalizeQuestion(msg);
    if (!q) return;
    const key = `${msg.round ?? ''}|${q.prompt}|${q.choices.map(c => c.label).join(',')}`;
    if (key === this.hostKey) return;
    this.hostKey = key;
    this.mode = 'host';
    this.pending = q;
    if (this.game.phase === 'play' && this.game.linkRole === 'solo') this.present(q);
  }

  start() {
    this.clear();
    this.asked = false;
    this.answered = false;
    this.q = null;
    const now = performance.now() / 1000;
    this.nextAt = now + 1.2;
    this.waitSince = now;
    if (this.game.linkRole === 'guest') return;
    if (this.source === 'host' && this.pending) this.present(this.pending);
    else if (this.source === 'wait') call(window.SproutsSidecar?.need);
  }

  stop() {
    this.clear();
    askEl.hidden = true;
    hush();
  }

  clear() {
    this.bubbles = [];
    if (this.group) {
      this.game.scene?.remove(this.group);
      this.group = null;
    }
    for (const m of this.mats) {
      m.map?.dispose();
      m.dispose();
    }
    this.mats = [];
    askEl.hidden = true;
  }

  present(q) {
    const you = this.game.you;
    if (!you) return;
    this.clear();
    this.q = q;
    this.qid += 1;
    this.asked = true;
    this.answered = false;
    this.bubbles = placeBubbles(Math.random, q.choices, you, this.qid * 100);
    this.build();
    askText.textContent = q.prompt;
    askEl.classList.remove('done');
    askEl.hidden = false;
    // Inside Little Sprouts the host reads it in the learner's voice; elsewhere the browser does.
    if (this.source === 'host') sendHost('show');
    else speak(q.prompt);
  }

  build() {
    const scene = this.game.scene;
    if (!scene || !this.q) return;
    this.group = new THREE.Group();
    this.mats = this.q.choices.map(c => new THREE.SpriteMaterial({
      map: choiceTexture(c), transparent: true, depthWrite: false, depthTest: false
    }));
    for (const b of this.bubbles) {
      const sprite = new THREE.Sprite(this.mats[b.choice]);
      sprite.renderOrder = 10; // always on top of buildings, so every answer can be found
      const grow = 1 + Math.max(0, (this.game.you?.r || 0) - 1) * 0.18; // camera rises as you grow
      sprite.scale.set(2.1 * grow, 2.1 * grow, 1);
      sprite.position.set(b.x, 1.6, b.z);
      const shadow = new THREE.Mesh(SHADOW_GEO, SHADOW_MAT);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(b.x, 0.14, b.z);
      b.sprite = sprite;
      b.shadow = shadow;
      this.group.add(sprite, shadow);
    }
    scene.add(this.group);
  }

  bob(now) {
    for (const b of this.bubbles) {
      if (!b.sprite) continue;
      b.sprite.visible = b.shadow.visible = b.alive;
      b.sprite.position.y = 1.6 + Math.sin(now * 2.4 + b.id) * 0.25;
    }
  }

  tick(now) {
    const game = this.game;
    const source = this.source;
    if (source === 'wait' && now - this.waitSince > 4) this.mode = 'local';
    if (source === 'local' && (!this.q || this.answered) && now >= this.nextAt) {
      this.present(this.upcoming || localQuestion(Math.random, this.index++));
      // Make the next question now, so its line is ready in the Sprouts voice when it shows.
      this.upcoming = localQuestion(Math.random, this.index++);
      prefetchLine(this.upcoming.prompt);
    }
    if (this.q) {
      const eaters = [game.you];
      if (game.linkRole === 'host' && game.them) eaters.push(game.them);
      for (const hole of eaters) {
        for (const b of touchedBubbles(hole, this.bubbles)) this.eat(hole, b, now);
      }
      if (source === 'local' && this.answered && !this.bubbles.some(b => b.alive)) {
        this.nextAt = Math.min(this.nextAt, now + 0.8);
      }
    }
    this.bob(now);
  }

  eat(hole, bubble, now) {
    const choice = this.q.choices[bubble.choice];
    const mine = hole === this.game.you;
    bubble.alive = false;
    if (choice.ok) {
      hole.r = rightAnswerGrow(hole.r);
      hole.stars += 1;
      if (mine) this.toast(this.answered ? 'More! ⭐' : 'Yes! ⭐', 'good');
      if (!this.answered) {
        this.answered = true;
        this.nextAt = now + 3;
        // Wrong ones pop; the other right copies stay for a bonus gulp.
        for (const b of this.bubbles) if (!this.q.choices[b.choice].ok) b.alive = false;
        askEl.classList.add('done');
        if (mine && this.source === 'host') sendHost('pick', { index: choice.index });
      }
      return;
    }
    hole.r = wrongAnswerShrink(hole.r);
    hole.misses += 1;
    hole.hurtUntil = performance.now() / 1000 + 0.8;
    if (mine) {
      this.toast('Not yet', 'bad');
      if (this.source === 'host' && !this.answered) sendHost('pick', { index: choice.index });
    }
  }

  toast(text, tone) {
    toastEl.textContent = text;
    toastEl.className = tone;
    toastEl.hidden = false;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { toastEl.hidden = true; }, 1100);
  }

  /** Friend rooms: the host sends the question and the bubbles still floating. */
  pack() {
    if (!this.q) return null;
    return {
      id: this.qid,
      prompt: this.q.prompt,
      done: this.answered,
      choices: this.q.choices.map(c => ({ label: c.label, fill: c.fill, shape: c.shape })),
      bubbles: this.bubbles.filter(b => b.alive).map(b => [b.id, b.choice, b.x, b.z])
    };
  }

  adopt(data) {
    if (!data) {
      if (this.q) { this.clear(); this.q = null; }
      return;
    }
    if (data.id !== this.qid) {
      this.clear();
      this.qid = data.id;
      this.asked = true;
      this.q = { prompt: data.prompt, choices: data.choices };
      this.bubbles = data.bubbles.map(([id, choice, x, z]) => ({ id, choice, x, z, alive: true }));
      this.build();
      askText.textContent = data.prompt;
      askEl.hidden = false;
      speak(data.prompt);
    }
    const alive = new Set(data.bubbles.map(row => row[0]));
    for (const b of this.bubbles) b.alive = alive.has(b.id);
    askEl.classList.toggle('done', !!data.done);
  }
}

const SHADOW_GEO = new THREE.CircleGeometry(0.75, 20);
const SHADOW_MAT = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false });

/** A round answer badge: a word or number, a color swatch, or a shape. */
function choiceTexture(choice) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;
  const colorOnly = choice.fill && !choice.shape;
  ctx.beginPath();
  ctx.arc(c, c, c - 10, 0, Math.PI * 2);
  ctx.fillStyle = colorOnly ? choice.fill : '#fffdf6';
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#1f3528';
  ctx.stroke();
  if (choice.shape) {
    drawShape(ctx, choice.shape, c, c, 70, choice.fill || '#5d7a45');
  } else if (!colorOnly) {
    const text = choice.label;
    let font = 120;
    ctx.font = `800 ${font}px "Trebuchet MS", sans-serif`;
    while (ctx.measureText(text).width > size - 64 && font > 34) {
      font -= 6;
      ctx.font = `800 ${font}px "Trebuchet MS", sans-serif`;
    }
    ctx.fillStyle = '#1f3528';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, c, c + font * 0.05);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawShape(ctx, name, x, y, r, fill) {
  ctx.beginPath();
  const poly = (n, rot = -Math.PI / 2, rx = r, ry = r) => {
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rx, y + Math.sin(a) * ry);
    }
    ctx.closePath();
  };
  if (name === 'circle') ctx.arc(x, y, r, 0, Math.PI * 2);
  else if (name === 'oval') ctx.ellipse(x, y, r * 1.1, r * 0.65, 0, 0, Math.PI * 2);
  else if (name === 'square') ctx.rect(x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6);
  else if (name === 'rectangle') ctx.rect(x - r * 1.1, y - r * 0.6, r * 2.2, r * 1.2);
  else if (name === 'triangle') poly(3, -Math.PI / 2, r * 1.05, r * 1.05);
  else if (name === 'diamond') poly(4, -Math.PI / 2, r * 0.8, r * 1.05);
  else if (name === 'hexagon') poly(6, 0);
  else if (name === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const rr = i % 2 ? r * 0.45 : r * 1.05;
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  } else ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/**
 * Questions are read in the Little Sprouts voice (lib/speech.js: Kokoro, with the grown-up's
 * voice pick and sound setting from this site's saved data). Inside the Sprouts shelf the
 * host reads them instead. If the voice module cannot load, the browser voice reads them.
 */
let sproutsVoice = null;

function loadSproutsVoice() {
  // Loading it early also lets it prime audio on the first tap, which iOS requires.
  import('../../lib/speech.js?v=aviator1')
    .then((mod) => {
      sproutsVoice = mod;
      // The first question is made ahead too, while the menu is up.
      if (session?.quiz && !session.quiz.upcoming) {
        session.quiz.upcoming = localQuestion(Math.random, session.quiz.index++);
        prefetchLine(session.quiz.upcoming.prompt);
      }
    })
    .catch(() => { sproutsVoice = null; });
}

function sproutsSettings() {
  try { return JSON.parse(localStorage.getItem('sprouts-v1')) || {}; } catch { return {}; }
}

function speak(text) {
  if (!text) return;
  const data = sproutsSettings();
  if (data.sound === false) return;
  if (sproutsVoice) {
    try {
      const context = sproutsVoice.contextFor('gulp');
      // A new question cuts off the old one instead of waiting behind it.
      sproutsVoice.speak(text, sproutsVoice.voiceFor(context, data.voice, data.characterVoices), { context });
      return;
    } catch { /* fall back to the browser voice */ }
  }
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
  try {
    synth.cancel();
    synth.speak(new SpeechSynthesisUtterance(String(text).replace(/\s*\+\s*/g, ' plus ').replace(/\s*[−]\s*/g, ' minus ')));
  } catch { /* no voice on this device */ }
}

function prefetchLine(text) {
  if (!sproutsVoice || !text) return;
  const data = sproutsSettings();
  if (data.sound === false) return;
  try {
    const context = sproutsVoice.contextFor('gulp');
    sproutsVoice.prefetchSpeech([{ text, voiceId: sproutsVoice.voiceFor(context, data.voice, data.characterVoices) }], { priority: 'next' });
  } catch { /* the line is made when it is said */ }
}

function hush() {
  try { sproutsVoice?.stop(); } catch { /* nothing playing */ }
  try { window.speechSynthesis?.cancel(); } catch { /* nothing to stop */ }
}

function sendHost(type, extra = {}) {
  if (type === 'pick') call(window.SproutsSidecar?.pick, extra.index);
  else call(window.SproutsSidecar?.show);
}

/** Little Sprouts host messages: boot, ask, clear, arcade. */
function listenToHost(game) {
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (event.source !== window.parent || window.parent === window) return;
    if (!data || data.source !== SIDECAR_SOURCE) return;
    if (data.type === 'boot') game.quiz.embedded();
    else if (data.type === 'ask') game.quiz.hostAsk(data);
    else if (data.type === 'clear' || data.type === 'arcade') game.quiz.off();
  });
}

const HOLE_NAMES = { you: 'You', friend: 'Your friend', host: 'Your friend', bot1: 'Purple hole', bot2: 'Teal hole' };
function holeName(id) {
  return HOLE_NAMES[id] || 'Another hole';
}

function makeHole(id, color, x, z) {
  const pos = clampPos(x, z, START_RADIUS);
  return { id, color, x: pos.x, z: pos.z, r: START_RADIUS, stunUntil: 0, stars: 0, misses: 0 };
}

function packHole(hole) {
  if (!hole) return null;
  return { id: hole.id, x: hole.x, z: hole.z, r: hole.r, color: hole.color, stars: hole.stars, misses: hole.misses };
}

function applyHole(hole, data) {
  if (!hole || !data) return;
  hole.x = data.x;
  hole.z = data.z;
  hole.r = data.r;
  hole.stars = data.stars || 0;
  if ((data.misses || 0) > (hole.misses || 0)) hole.hurtUntil = performance.now() / 1000 + 0.8;
  hole.misses = data.misses || 0;
}

function nearestBite(hole, bits) {
  let best = null;
  let bestD = Infinity;
  for (const bit of bits) {
    if (!bit.alive) continue;
    if (hole.r < bit.size * 1.12) continue;
    const d = (bit.x - hole.x) ** 2 + (bit.z - hole.z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = bit;
    }
  }
  return best;
}

function canChase(bot, you) {
  return bot.r >= you.r * 1.12;
}

const SCRATCH = new THREE.Matrix4();
const PART_CACHE = new Map();

/** Shared unit-size parts for a kind (scaled per instance by bit.size). */
function kindParts(THREE, kind, color) {
  const key = `${kind}:${color}`;
  if (PART_CACHE.has(key)) return PART_CACHE.get(key);
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 });
  const lift = (geo, y) => { geo.translate(0, y, 0); return geo; };
  let parts;
  if (kind === 'pebble' || kind === 'person') {
    parts = [{ geo: lift(new THREE.SphereGeometry(0.5, 8, 6), 0.45), mat: mat(color) }];
  } else if (kind === 'cone' || kind === 'hydrant') {
    parts = [{ geo: lift(new THREE.ConeGeometry(0.35, 1, 8), 0.45), mat: mat(color) }];
  } else if (kind === 'lamp' || kind === 'bin') {
    parts = [{ geo: lift(new THREE.CylinderGeometry(0.16, 0.22, 1, 6), 0.45), mat: mat(color) }];
  } else if (kind === 'car' || kind === 'van' || kind === 'bus' || kind === 'scooter') {
    parts = [{ geo: lift(new THREE.BoxGeometry(kind === 'bus' ? 1.4 : 1.1, 0.45, 0.55), 0.45), mat: mat(color) }];
  } else if (kind === 'tree' || kind === 'bush') {
    parts = [{
      geo: lift(new THREE.ConeGeometry(0.55, kind === 'bush' ? 0.7 : 0.9, 8), kind === 'bush' ? 0.4 : 0.95),
      mat: mat(color)
    }];
    if (kind === 'tree') {
      parts.push({
        geo: lift(new THREE.CylinderGeometry(0.12, 0.16, 0.7, 6), 0.35),
        mat: new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.9 })
      });
    }
  } else {
    const tall = kind === 'tower' || kind === 'office' ? 1.35
      : kind === 'house' || kind === 'shop' ? 0.95
      : kind === 'bench' ? 0.35
      : 0.7;
    const depth = kind === 'bench' ? 0.4 : 0.85;
    parts = [{ geo: lift(new THREE.BoxGeometry(0.85, tall, depth), 0.45), mat: mat(color) }];
  }
  PART_CACHE.set(key, parts);
  return parts;
}

function buildCityScenery(THREE, scene) {
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.95 });
  const walk = new THREE.MeshStandardMaterial({ color: 0xb7b2a6, roughness: 0.92 });
  const lot = new THREE.MeshStandardMaterial({ color: 0x6f8f5a, roughness: 0.96 });
  const span = Math.floor(MAP_HALF / CELL);
  const blocks = (span * 2 + 1) ** 2;
  const roads = span * 2 + 2;
  const make = (geo, mat, count) => {
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
  };
  const pads = make(new THREE.BoxGeometry(BLOCK, 0.08, BLOCK), lot, blocks);
  const walksNS = make(new THREE.BoxGeometry(BLOCK + 1.6, 0.1, 1.2), walk, blocks * 2);
  const walksWE = make(new THREE.BoxGeometry(1.2, 0.1, BLOCK + 1.6), walk, blocks * 2);
  const xRoads = make(new THREE.BoxGeometry(MAP_HALF * 2 + CELL, 0.06, ROAD), asphalt, roads);
  const zRoads = make(new THREE.BoxGeometry(ROAD, 0.06, MAP_HALF * 2 + CELL), asphalt, roads);
  const m = new THREE.Matrix4();
  const at = (mesh, i, x, y, z) => mesh.setMatrixAt(i, m.makeTranslation(x, y, z));
  let b = 0;
  for (let bx = -span; bx <= span; bx++) {
    for (let bz = -span; bz <= span; bz++) {
      const ox = bx * CELL;
      const oz = bz * CELL;
      const edge = BLOCK * 0.5 + 0.7;
      at(pads, b, ox, 0.02, oz);
      at(walksNS, b * 2, ox, 0.04, oz - edge);
      at(walksNS, b * 2 + 1, ox, 0.04, oz + edge);
      at(walksWE, b * 2, ox - edge, 0.04, oz);
      at(walksWE, b * 2 + 1, ox + edge, 0.04, oz);
      b += 1;
    }
  }
  for (let i = -span, r = 0; i <= span + 1; i++, r++) {
    at(xRoads, r, 0, 0.01, i * CELL - CELL * 0.5);
    at(zRoads, r, i * CELL - CELL * 0.5, 0.012, 0);
  }
}

function holeMesh(THREE, hole) {
  const g = new THREE.Group();
  const pit = new THREE.Mesh(
    new THREE.CircleGeometry(START_RADIUS, 28),
    new THREE.MeshBasicMaterial({ color: 0x1a1410 })
  );
  pit.rotation.x = -Math.PI / 2;
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(START_RADIUS * 0.92, START_RADIUS * 1.12, 28),
    new THREE.MeshBasicMaterial({ color: hole.color, side: THREE.DoubleSide })
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.03;
  g.add(pit, rim);
  g.position.set(hole.x, 0.11, hole.z);
  return g;
}

function bindControls(game) {
  const keys = { left: false, right: false, up: false, down: false };
  const drag = { on: false, x0: 0, y0: 0, x: 0, z: 0 };
  const pad = { x: 0, z: 0 };
  const sync = () => {
    let x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    let z = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (pad.x || pad.z) {
      x = pad.x;
      z = pad.z;
    }
    if (drag.on) {
      x = drag.x;
      z = drag.z;
    }
    game.localInput = { x, z };
    link?.capture(game.localInput);
  };
  const onKey = (e, down) => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.up = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S') keys.down = down;
    sync();
  };
  window.addEventListener('keydown', e => onKey(e, true));
  window.addEventListener('keyup', e => onKey(e, false));
  const pointer = (e, on) => {
    if (on) {
      drag.on = true;
      drag.x0 = e.clientX;
      drag.y0 = e.clientY;
    } else {
      drag.on = false;
      drag.x = 0;
      drag.z = 0;
    }
    sync();
  };
  stage.addEventListener('pointerdown', e => {
    stage.setPointerCapture?.(e.pointerId);
    pointer(e, true);
  });
  stage.addEventListener('pointerup', e => pointer(e, false));
  stage.addEventListener('pointercancel', e => pointer(e, false));
  stage.addEventListener('pointermove', e => {
    if (!drag.on) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    const len = Math.hypot(dx, dy) || 1;
    drag.x = dx / Math.max(40, len);
    drag.z = dy / Math.max(40, len);
    sync();
  });
  document.querySelectorAll('.steer-btn').forEach(btn => {
    const dir = btn.dataset.dir;
    const set = (down) => {
      if (dir === 'left') keys.left = down;
      if (dir === 'right') keys.right = down;
      if (dir === 'up') keys.up = down;
      if (dir === 'down') keys.down = down;
      sync();
    };
    btn.addEventListener('pointerdown', e => { e.preventDefault(); set(true); });
    btn.addEventListener('pointerup', () => set(false));
    btn.addEventListener('pointerleave', () => set(false));
  });
  return {
    setPad(x, z) {
      if (x === pad.x && z === pad.z) return;
      pad.x = x;
      pad.z = z;
      sync();
    }
  };
}

/**
 * Little Sprouts controller layout (lib/pad-core.mjs): left stick or d-pad moves the hole,
 * A or the right trigger presses the focused menu button. The shelf's pad skips this page
 * (no injected keys), and still owns B (back) and Y (hear again).
 */
function makePadReader(controls) {
  const state = { action: false, dirKey: '', repeatAt: 0, focus: 0, seen: false };
  const menuButtons = () => [playBtn, friendBtn].filter(b => !b.hidden && !b.disabled);
  const paintFocus = (list) => {
    [playBtn, friendBtn].forEach(b => b.classList.remove('pad-focus'));
    if (!state.seen || overlay.hidden || !list.length) return;
    state.focus = Math.max(0, Math.min(state.focus, list.length - 1));
    list[state.focus].classList.add('pad-focus');
  };
  return function poll(now) {
    let pads = [];
    try { pads = [...(navigator.getGamepads?.() || [])].filter(Boolean); } catch { pads = []; }
    if (!pads.length) {
      if (state.seen) controls.setPad(0, 0);
      return;
    }
    const raw = readPad(pads[0]);
    if (!state.seen) {
      state.seen = true;
      document.body.classList.add('pad');
    }
    const dirs = moveDirs(raw);
    // Analog stick steers smoothly; the d-pad gives the eight directions.
    const stick = Math.hypot(raw.lx, raw.ly) > 0.28 ? { x: raw.lx, z: raw.ly } : null;
    const action = actionDown(raw, state.action) || raw.start >= 0.5;
    if (!overlay.hidden) {
      controls.setPad(0, 0);
      const list = menuButtons();
      const step = dirs.x || dirs.y;
      const key = `${dirs.x},${dirs.y}`;
      if (step && (key !== state.dirKey || now >= state.repeatAt)) {
        state.focus = (state.focus + (step > 0 ? 1 : -1) + list.length) % Math.max(1, list.length);
        state.repeatAt = now + 260;
      }
      state.dirKey = step ? key : '';
      paintFocus(list);
      if (action && !state.action) list[state.focus]?.click();
    } else {
      paintFocus([]);
      controls.setPad(stick ? stick.x : dirs.x, stick ? stick.z : dirs.y);
    }
    state.action = action;
  };
}

function paintRoom() {
  if (!link || link.role === 'solo') {
    roomEl.hidden = !link?.status;
    roomEl.textContent = link?.status || '';
    playBtn.disabled = false;
    friendBtn.hidden = false;
    return;
  }
  roomEl.hidden = false;
  if (link.role === 'host') {
    // A room made on the same Wi-Fi with no internet has no link to share.
    const share = link.room === 'wifi' ? '' : ` Share this link: ${link.url}`;
    roomEl.textContent = link.peer ? `Friend joined. Press Play.${share}` : `${link.status}${share}`;
    playBtn.disabled = !link.peer;
    playBtn.textContent = link.peer ? (session?.phase === 'ended' ? 'Play again' : 'Play') : 'Waiting';
  } else {
    roomEl.textContent = link.status;
    playBtn.disabled = true;
    playBtn.textContent = 'Waiting';
  }
  friendBtn.hidden = true;
}

function boot() {
  session = new Game();
  link = new Link(session, paintRoom);
  listenToHost(session);
  loadSproutsVoice();
  if (new URLSearchParams(location.search).has('debug')) window.__gulp = session;
  if (window.parent !== window) {
    session.quiz.embedded();
    // The host may have sent its question before this module was listening; ask again.
    call(window.SproutsSidecar?.need);
  }
  const controls = bindControls(session);
  const pollPad = makePadReader(controls);
  playBtn.disabled = true;
  playBtn.textContent = 'Loading…';

  playBtn.addEventListener('click', () => {
    if (!ready) return;
    if (link.role === 'host') {
      if (!link.peer) return;
      const seed = (Date.now() & 0xffff) || 1;
      link.send({ t: 'round', seed, seconds: ROUND_SECONDS });
      session.begin(seed);
      paintRoom();
      return;
    }
    if (link.role === 'guest') return;
    session.begin();
    paintRoom();
  });

  friendBtn.addEventListener('click', () => {
    if (!ready) return;
    link.host();
    paintRoom();
  });

  const params = new URLSearchParams(location.search);
  const room = params.get('room');
  if (room) {
    link.join(room);
    paintRoom();
  }

  const visualTier = resolveAutoQuality();
  const lowGpu = isPerformanceTier(visualTier);
  session.reduced = lowGpu;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: stage, ...rendererOptions(visualTier), alpha: false });
    if (!renderer.getContext()) throw new Error('no-webgl');
  } catch {
    playBtn.textContent = 'Needs WebGL';
    roomEl.hidden = false;
    roomEl.textContent = 'Garden gulp needs WebGL. Update the browser or turn on hardware acceleration.';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap(visualTier)));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  session.renderer = renderer;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87a8c4);
  scene.fog = new THREE.Fog(0x9eb6c8, 55, 140);
  session.scene = scene;
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 320);
  camera.position.set(0, 30, 26);
  camera.lookAt(0, 0, 0);
  session.camera = camera;
  scene.add(new THREE.HemisphereLight(0xf0f5ff, 0x4a5a3a, 0.95));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.05);
  sun.position.set(30, 55, 18);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(MAP_HALF + 8, 64),
    new THREE.MeshStandardMaterial({ color: 0x4a5560, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  buildCityScenery(THREE, scene);

  const resize = () => {
    const w = Math.max(280, window.innerWidth);
    const h = Math.max(200, window.innerHeight);
    renderer.setSize(w, h, true);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  const loop = (t) => {
    session.raf = requestAnimationFrame(loop);
    const now = t * 0.001;
    const dt = Math.min(0.05, session.last ? now - session.last : 0.016);
    session.last = now;
    pollPad(t);
    session.tick(dt);
    renderer.render(scene, camera);
  };
  session.raf = requestAnimationFrame(loop);
  ready = true;
  playBtn.disabled = false;
  playBtn.textContent = 'Play';
  paintRoom();
  call(window.SproutsSidecar?.ready);
}

boot();
