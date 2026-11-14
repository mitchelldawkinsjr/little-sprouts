// Block meadow: an open voxel world on the Little Sprouts adventures shelf.
// The world engine in ./engine is forked from SimonDev's Quick_MinecraftClone2 (MIT, see engine/LICENSE):
// streamed 16-block chunks built in workers, biomes, trees, ambient occlusion, clouds, and the
// entity/component loop. This file is Little Sprouts' own: kid controls (touch, mouse, keys, and
// the shared controller layout), gift boxes that ask the learner's questions, block rewards,
// free build, and saving the world in this browser.
import * as THREE from '../../vendor/three/build/three.module.js?v=r187';
import { entity_manager } from './engine/entity-manager.js?v=blocks5';
import { entity } from './engine/entity.js?v=blocks5';
import { threejs_component } from './engine/threejs-component.js?v=blocks5';
import { sparse_voxel_cell_manager } from './engine/sparse-voxel-cell-manager.js?v=blocks5';
import { cloud_controller } from './engine/cloud-controller.js?v=blocks5';
import { player_controller } from './engine/player-controller.js?v=blocks5';
import { voxel_tools } from './engine/voxel-tools.js?v=blocks5';
import { ui_controller } from './engine/ui-controller.js?v=blocks5';
import { hack_defs } from './engine/hack-defs.js?v=blocks5';
import { texture_defs } from './engine/texture-defs.js?v=blocks5';
import { voxel_block_builder } from './engine/voxel-block-builder.js?v=blocks5';
import { questionHolding } from '../../lib/hold.js?v=hold2';
import { actionDown, axisDir, held, moveDirs, nextIndex, readPad } from '../../lib/pad-core.mjs?v=pad-blocks';
import { resolveAutoQuality, pixelRatioCap, rendererOptions, isPerformanceTier } from '../../lib/device-tier.mjs?v=low-end1';
import { chestDistance, goalFrom, localQuestion, nextLetterOk, normalizeAsk, readSave } from './quiz.mjs?v=blocks5';
import { BUGS, COME_FROM, CYCLE, LINES, NIGHT, bugTarget, canGrab, feetBlock, sheltered, skyAt, stepToward } from './night.mjs?v=blocks5';
import { animate as animateBug, dropBug, makeCaterpillar, makeSpider } from './bugs.js?v=blocks5';
import { DAY_BOXES, KITS, NEW_DAY, POWERS, TOO_CLOSE, boosts, facingFromYaw, kitCells, kitToWorld, prizeFor } from './prizes.mjs?v=blocks5';
import { SEND_EVERY, SKY_EVERY, STILL_EVERY, readEdit, readSpot, roomLine, worldCollector, worldParts } from './friends.mjs?v=blocks5';
import { BUDDIES, buddyGear, buddyKind, makeBuddy } from '../../lib/buddy3d.mjs?v=ball3';

const SOURCE = 'sprouts-sidecar';
const SAVE_KEY = 'sprouts-blocks-v1';
const solo = window.parent === window;
const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(any-pointer: coarse)').matches || navigator.maxTouchPoints > 0;
document.body.classList.toggle('touch', touch);

const tier = resolveAutoQuality({ embedded: !solo });
const lowGpu = isPerformanceTier(tier);
hack_defs.WORLD_SIZE = lowGpu ? 4 : 7;
const viewBlocks = hack_defs.WORLD_SIZE * hack_defs.WORLD_BLOCK_SIZE;
const fogRange = [viewBlocks * 0.55, viewBlocks * 0.95];
const workers = Math.max(1, Math.min(lowGpu ? 2 : 4, (navigator.hardwareConcurrency || 2) - 1));

const ALL_TYPES = Object.keys(texture_defs.DEFS).filter(t => t !== 'ocean');
function readOwnSave() {
  try { return readSave(localStorage.getItem(SAVE_KEY), { starter: texture_defs.STARTER, all: ALL_TYPES }); }
  catch { return null; }
}
// Opened from a friend's room link: start in a fresh world, which becomes the host's world.
// Your own world stays saved and comes back after.
const roomParam = (new URLSearchParams(location.search).get('room') || '').slice(0, 16);
const saved = readOwnSave();
if (roomParam && saved) {
  saved.edits = [];
  saved.pos = null;
}
// ownWorld: the world on screen is this player's own, so building in it is saved.
const friend = { role: 'solo', peer: false, room: '', status: '', url: '', loading: false, ownWorld: !roomParam };

function send(type, extra) {
  if (solo) return;
  window.parent.postMessage({ source: SOURCE, type, ...extra }, '*');
}

// ---- Where to start: saved spot, or a grassy hill found from the same terrain the workers build.
function findSpawn() {
  if (saved?.pos) return new THREE.Vector3(...saved.pos);
  const ocean = voxel_block_builder.OCEAN_LEVEL;
  for (let r = 0; r < 6000; r += 48) {
    for (let a = 0; a < 8; a++) {
      const x = Math.round(512 + Math.cos(a * Math.PI / 4) * r);
      const z = Math.round(512 + Math.sin(a * Math.PI / 4) * r);
      const [type, h] = voxel_block_builder.TerrainSample(x, z);
      if (type === 'grass' && h > ocean + 2 && h < 40) return new THREE.Vector3(x, h + 3, z);
    }
  }
  return new THREE.Vector3(512, 40, 512);
}

// ---- Build the world with SimonDev's entity system.
const em = new entity_manager.EntityManager();
const view = $('view');
let renderer;
try {
  const r = new entity.Entity();
  r.AddComponent(new threejs_component.ThreeJSController({
    container: view,
    rendererOptions: rendererOptions(tier),
    pixelRatio: pixelRatioCap(tier)
  }));
  em.Add(r, 'renderer');
  renderer = r.GetComponent('ThreeJSController');
} catch (err) {
  $('loadingText').textContent = 'Block meadow needs WebGL 2. Update the browser or turn on hardware acceleration.';
  throw err;
}

const voxelEntity = new entity.Entity();
voxelEntity.AddComponent(new sparse_voxel_cell_manager.SparseVoxelCellManager({
  cellSize: hack_defs.WORLD_BLOCK_SIZE,
  worldSize: hack_defs.WORLD_SIZE,
  edits: saved?.edits || [],
  fogRange,
  workers
}));
em.Add(voxelEntity, 'voxels');
const voxels = voxelEntity.GetComponent('SparseVoxelCellManager');

let clouds = null;
if (!lowGpu) {
  const cloudEntity = new entity.Entity();
  cloudEntity.AddComponent(new cloud_controller.CloudController());
  em.Add(cloudEntity);
  clouds = cloudEntity.GetComponent('CloudController');
}

const playerEntity = new entity.Entity();
playerEntity.AddComponent(new player_controller.PlayerController({ yaw: saved?.yaw || 0, pitch: saved?.pitch || 0 }));
playerEntity.AddComponent(new voxel_tools.VoxelTools());
const startSpot = findSpawn();
playerEntity.SetPosition(startSpot);
em.Add(playerEntity, 'player');
const player = playerEntity.GetComponent('PlayerController');
const tools = playerEntity.GetComponent('VoxelTools');

const uiEntity = new entity.Entity();
uiEntity.AddComponent(new ui_controller.UIController({
  bar: $('bar'),
  unlocked: saved?.unlocked || texture_defs.STARTER,
  selected: saved?.selected,
  kits: saved?.kits || [],
  kitInfo: KITS,
  onMode: mode => setMode(mode)
}));
em.Add(uiEntity, 'ui');
const ui = uiEntity.GetComponent('UIController');

// ---- Little sounds, made on the spot. Quiet under the spoken question.
let audio = null;
let soundOn = true;
let ducked = false;
function blip(freq, length = 0.08, kind = 'triangle', gain = 0.12) {
  if (!soundOn || joinHold) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = kind;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + length);
    amp.gain.setValueAtTime(gain * (ducked ? 0.25 : 1), t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(amp).connect(audio.destination);
    osc.start(t);
    osc.stop(t + length + 0.02);
  } catch { /* no audio here */ }
}
playerEntity._RegisterHandler('tools.placed', () => blip(520, 0.07));
playerEntity._RegisterHandler('tools.dug', () => blip(180, 0.1, 'square', 0.06));
playerEntity._RegisterHandler('tools.door', m => blip(m.value === 'open' ? 440 : 300, 0.09, 'sine', 0.1));

// ---- Notes and the HUD.
let noteTimer = 0;
function note(text, seconds = 2.2) {
  const el = $('note');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => { el.hidden = true; }, seconds * 1000);
}

function setMode(mode) {
  tools.SetMode(mode);
  // A build kit is picked: the hand is empty, and a tap puts the whole kit down.
  if (uiEntity.GetComponent('UIController').Kit) tools.held_.visible = false;
  const dig = tools.Mode === 'dig';
  uiEntity.GetComponent('UIController').ShowMode(tools.Mode);
  $('modeIcon').textContent = dig ? '⛏' : '🧱';
  $('modeText').textContent = dig ? 'Dig' : 'Build';
  $('mode').classList.toggle('on', dig);
}
$('mode').addEventListener('click', () => setMode(tools.Mode === 'dig' ? 'build' : 'dig'));

// ---- Save the world in this browser.
let saveDirty = false;
voxels.onEdit = () => { saveDirty = true; };
function save() {
  try {
    const p = player.camera_.position;
    // In a friend's world, keep your own world's blocks and spot as they were saved.
    const own = friend.ownWorld ? null : (JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') || {});
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      edits: own ? own.edits || [] : [...voxels.Edits].slice(-40000),
      pos: own ? own.pos : [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10 + 0.5, Math.round(p.z * 10) / 10],
      yaw: own ? own.yaw : player.Yaw,
      pitch: own ? own.pitch : player.Pitch,
      unlocked: ui.Unlocked,
      selected: ui.Selected,
      kits: ui.Kits
    }));
    saveDirty = false;
  } catch { /* storage full or blocked: the world still plays */ }
}
setInterval(() => { if (started) save(); }, 3000);
addEventListener('pagehide', () => { if (started) save(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && started) save(); });

// ---- Gift boxes and questions.
const quest = {
  ask: null,          // the question waiting in the next gift box
  solvedKey: '',      // a question already answered right, so a repeat ask is ignored
  rights: 0,
  goal: 5,
  free: false,
  arcade: false,
  dayAsks: 0,         // in free build: gift boxes left today (each new morning brings DAY_BOXES)
  chest: null,
  open: false,
  pending: false,     // a pick went to the host; waiting for its mark
  built: '',
  slipped: false,
  focus: 0,
  awayFromChest: true,
  localIndex: 0
};
const rnd = Math.random;

// Gift boxes come out until free build, and after that for a few boxes each new morning.
function asking() {
  return !quest.free || (!quest.arcade && quest.dayAsks > 0);
}

function newDay() {
  if (!quest.free || quest.arcade) return;
  quest.dayAsks = DAY_BOXES;
  // After the "good morning" line.
  setTimeout(() => {
    note(`🎁 ${NEW_DAY}`, 4.5);
    speakLine(NEW_DAY);
  }, 3500);
}

const chestTexture = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#e9b949'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#c4862b'; g.fillRect(0, 0, 64, 6); g.fillRect(0, 58, 64, 6); g.fillRect(0, 0, 6, 64); g.fillRect(58, 0, 6, 64);
  g.fillStyle = '#dc6253'; g.fillRect(27, 0, 10, 64); g.fillRect(0, 27, 64, 10);
  g.fillStyle = '#fff6d8'; g.font = '900 30px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('?', 32, 33);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  return t;
})();
const chestMaterial = new THREE.MeshBasicMaterial({ map: chestTexture });
const beamMaterial = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
const sparks = [];

function clearChest() {
  if (!quest.chest) return;
  renderer.scene_.remove(quest.chest.group);
  quest.chest = null;
}

function spawnChest() {
  const p = player.camera_.position;
  const radius = chestDistance(quest.rights);
  for (let tries = 0; tries < 10; tries++) {
    const angle = rnd() * Math.PI * 2;
    const x = Math.round(p.x + Math.cos(angle) * radius);
    const z = Math.round(p.z + Math.sin(angle) * radius);
    const ground = voxels.GroundAt(x, z);
    if (ground == null) continue;
    // Not under water, and with room to stand.
    if (voxels.VoxelTypeAt(x, ground + 1, z) === 'ocean' || ground < voxel_block_builder.OCEAN_LEVEL) continue;
    const group = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), chestMaterial);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 40, 10, 1, true), beamMaterial);
    beam.position.y = 20;
    group.add(box, beam);
    group.position.set(x, ground + 1, z);
    renderer.scene_.add(group);
    quest.chest = { group, box, x, z, y: ground + 1, t: 0 };
    quest.awayFromChest = true;
    return true;
  }
  return false;
}

function burst(at) {
  const colours = [0xdc6253, 0xf5d400, 0x538cbf, 0x76a265, 0xa381c0, 0xe99d4d];
  for (let i = 0; i < (reduced ? 4 : 14); i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), new THREE.MeshBasicMaterial({ color: colours[i % colours.length] }));
    m.position.copy(at);
    renderer.scene_.add(m);
    sparks.push({ m, v: new THREE.Vector3((rnd() - 0.5) * 6, 4 + rnd() * 4, (rnd() - 0.5) * 6), life: 1 });
  }
}

function stepSparks(dt) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.life -= dt;
    s.v.y -= 14 * dt;
    s.m.position.addScaledVector(s.v, dt);
    s.m.rotation.x += dt * 6;
    if (s.life <= 0) {
      renderer.scene_.remove(s.m);
      s.m.geometry.dispose();
      s.m.material.dispose();
      sparks.splice(i, 1);
    }
  }
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
function face(choice) {
  if (choice.shape) return `<span class="shape ${esc(choice.shape)}" style="--shape-color:${esc(choice.fill || '#5d7a45')}"></span><span>${esc(choice.label)}</span>`;
  if (choice.fill) return `<span class="swatch" style="background:${esc(choice.fill)}"></span><span>${esc(choice.label)}</span>`;
  return `<span>${esc(choice.label)}</span>`;
}

function cardButtons() {
  return [...document.querySelectorAll('#card button')].filter(b => !b.disabled && !b.hidden);
}
function setFocus(index) {
  const buttons = cardButtons();
  buttons.forEach(b => b.classList.remove('focus'));
  if (!buttons.length) return;
  quest.focus = (index + buttons.length) % buttons.length;
  buttons[quest.focus].classList.add('focus');
}

function paintCard() {
  const ask = quest.ask;
  $('cardPrompt').textContent = ask.prompt || 'Pick one.';
  $('cardShow').innerHTML = ask.show || '';
  $('cardSay').textContent = '';
  const choices = $('cardChoices');
  const spelling = ask.kind === 'spell';
  $('cardSlots').hidden = !spelling;
  if (spelling) {
    quest.built = '';
    quest.slipped = false;
    $('cardSlots').textContent = ask.word.split('').map(() => '_').join(' ');
    choices.innerHTML = ask.letters.map((l, i) => `<button type="button" class="choice letter" data-i="${i}">${esc(l)}</button>`).join('');
    choices.querySelectorAll('button').forEach(b => b.addEventListener('click', () => spellTap(b)));
  } else {
    choices.innerHTML = ask.choices.map((c, i) => `<button type="button" class="choice" data-i="${i}">${face(c)}</button>`).join('');
    choices.querySelectorAll('button').forEach(b => b.addEventListener('click', () => choose(+b.dataset.i, b)));
  }
  setFocus(0);
}

function openCard() {
  if (quest.open || !quest.ask) return;
  quest.open = true;
  quest.pending = false;
  paintCard();
  $('card').hidden = false;
  player.input.frozen = true;
  tools.enabled = false;
  blip(660, 0.15, 'sine', 0.1);
  send('show');
}

function closeCard() {
  quest.open = false;
  $('card').hidden = true;
  player.input.frozen = false;
  tools.enabled = true;
  quest.awayFromChest = false;
}
$('later').addEventListener('click', () => { if (!quest.pending) closeCard(); });

function choose(index, button) {
  if (!quest.open || quest.pending || questionHolding()) return;
  quest.pending = true;
  quest.picked = button;
  if (solo) setTimeout(() => mark(!!quest.ask.choices[index]?.ok), 150);
  else send('pick', { index });
}

function spellTap(button) {
  if (!quest.open || quest.pending || button.disabled || questionHolding()) return;
  const ask = quest.ask;
  const letter = ask.letters[+button.dataset.i];
  if (!nextLetterOk(ask.word, quest.built, letter)) {
    button.classList.add('wrong');
    setTimeout(() => button.classList.remove('wrong'), 300);
    $('cardSay').textContent = 'Not that letter. Try another.';
    if (!quest.slipped) {
      quest.slipped = true;
      send('slip');
    }
    return;
  }
  quest.built += letter;
  button.disabled = true;
  $('cardSlots').textContent = ask.word.split('').map((l, i) => (i < quest.built.length ? l : '_')).join(' ');
  setFocus(quest.focus);
  if (quest.built.length < ask.word.length) return;
  quest.pending = true;
  if (solo) setTimeout(() => mark(true), 150);
  else send('pick', { index: 0 });
}

function mark(ok) {
  if (!quest.open) return;
  quest.pending = false;
  if (!ok) {
    if (quest.picked) {
      quest.picked.classList.add('wrong');
      quest.picked.disabled = true;
    }
    $('cardSay').textContent = 'Not yet. Try another one.';
    blip(200, 0.18, 'sine', 0.08);
    setFocus(0);
    return;
  }
  quest.picked?.classList.add('right');
  quest.rights++;
  quest.solvedKey = quest.ask.key;
  quest.ask = null;
  const reward = texture_defs.REWARDS.find(t => !ui.Unlocked.includes(t));
  if (reward) ui.Unlock(reward);
  const prize = prizeFor(quest.rights);
  // With the bugs turned off there is no night, so a lantern would never light.
  if (bugsOff && prize.id === 'lantern') prize.id = 'jump';
  const won = prize.kind === 'kit' ? KITS[prize.id] : POWERS[prize.id];
  if (prize.kind === 'kit') ui.AddKit(prize.id);
  else powerUp(prize.id);
  if (quest.chest) burst(quest.chest.group.position);
  clearChest();
  blip(780, 0.12, 'sine', 0.12);
  setTimeout(() => blip(1040, 0.16, 'sine', 0.12), 110);
  setTimeout(() => {
    closeCard();
    const colour = reward ? ` And ${texture_defs.DEFS[reward].label} blocks.` : '';
    if (quest.free) {
      quest.dayAsks = Math.max(0, quest.dayAsks - 1);
      note(`${won.icon} ${won.line}${quest.dayAsks ? '' : ' More gift boxes come tomorrow morning.'}`, 4.5);
    } else if (quest.rights >= quest.goal) startFree();
    else note(`${won.icon} ${won.line}${colour}`, 4.5);
    saveDirty = true;
  }, reduced ? 300 : 700);
  // After the host's own "yes", so the two do not talk over each other.
  setTimeout(() => speakLine(won.line), 1300);
  paintHud();
}

function startFree(arcade = false) {
  quest.free = true;
  quest.arcade = arcade;
  quest.ask = null;
  clearChest();
  if (quest.open) closeCard();
  texture_defs.REWARDS.forEach(t => ui.Unlock(t));
  ui.Select(1);
  $('done').hidden = solo;
  note(arcade ? 'Free build. Every block is yours.' : 'Free build! Every block is yours now. More gift boxes come every morning.', 4);
  saveDirty = true;
  paintHud();
}
$('done').addEventListener('click', () => {
  save();
  send('finish', { detail: 'build' });
});

function takeAsk(ask) {
  if (!ask || !asking()) return;
  if (ask.key === quest.solvedKey) return;
  if (quest.ask && quest.ask.key === ask.key) return;
  soundOn = ask.sound;
  quest.goal = goalFrom(ask, quest.goal);
  quest.ask = ask;
  if (quest.open) paintCard();
  paintHud();
}

function localAsk() {
  takeAsk(localQuestion(rnd, quest.localIndex++));
}

addEventListener('message', event => {
  const data = event.data;
  if (!data || data.source !== SOURCE || event.source !== window.parent) return;
  if (data.type === 'ask') takeAsk(normalizeAsk(data));
  else if (data.type === 'mark') mark(!!data.ok);
  else if (data.type === 'clear') { if (!quest.free) startFree(); else { quest.dayAsks = 0; quest.ask = null; clearChest(); } }
  else if (data.type === 'arcade') startFree(true);
  else if (data.type === 'duck') ducked = !!data.on;
});

function stepQuest(dt) {
  if (!asking()) {
    if (quest.chest && !quest.open) clearChest();
    return;
  }
  if (!quest.ask) {
    if (solo && !quest.open) localAsk();
    return;
  }
  if (!quest.chest && !spawnChest()) return;
  const c = quest.chest;
  c.t += dt;
  c.box.position.y = reduced ? 0 : Math.sin(c.t * 2.4) * 0.12;
  c.box.rotation.y += dt * (reduced ? 0 : 0.8);
  const p = player.camera_.position;
  const near = Math.hypot(p.x - c.x, p.z - c.z);
  if (near > 3.5) quest.awayFromChest = true;
  if (!quest.open && quest.awayFromChest && near < 2.2 && Math.abs(p.y - 1.6 - c.y) < 2.5 && !questionHolding()) openCard();
}

let lastHud = '';
function paintHud() {
  const c = quest.chest;
  const questEl = $('quest');
  questEl.hidden = !asking() || !c;
  $('stars').hidden = quest.free || solo && quest.rights === 0;
  $('starCount').textContent = `${quest.rights} / ${quest.goal}`;
  if (!c || !asking()) return;
  const p = player.camera_.position;
  const dx = c.x - p.x;
  const dz = c.z - p.z;
  const steps = Math.round(Math.hypot(dx, dz));
  // Camera faces (-sin yaw, -cos yaw). Turn the arrow by the angle from there to the box.
  const fx = -Math.sin(player.Yaw);
  const fz = -Math.cos(player.Yaw);
  const angle = Math.atan2(fx * dz - fz * dx, fx * dx + fz * dz);
  $('arrow').style.transform = `rotate(${angle}rad)`;
  const text = steps <= 2 ? 'Open the gift box' : `Gift box · ${steps} steps`;
  if (text !== lastHud) {
    lastHud = text;
    $('questText').textContent = text;
  }
}

// ---- Night: the light fades, the bugs come out, and a house keeps you safe.
// ?bugs=off keeps the day going with no bugs, for a calm world.
const bugsOff = new URLSearchParams(location.search).get('bugs') === 'off';
let sproutsVoice = null;
if (solo) import('../../lib/speech.js?v=night1').then(mod => { sproutsVoice = mod; }).catch(() => {});
function speakLine(text) {
  if (!soundOn || joinHold) return;
  if (!solo) { send('say', { text }); return; }
  let data = {};
  try { data = JSON.parse(localStorage.getItem('sprouts-v1')) || {}; } catch { /* no settings */ }
  if (data.sound === false) return;
  try {
    if (sproutsVoice) {
      const context = sproutsVoice.contextFor('blocks');
      sproutsVoice.speak(text, sproutsVoice.voiceFor(context, data.voice, data.characterVoices), { context });
      return;
    }
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  } catch { /* no voice here */ }
}

const nightLights = (() => {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x6a6a7a, 1.6);
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(-1, 3, 1);
  renderer.scene_.add(hemi, sun);
  const ui = [];
  renderer.uiScene_.traverse(o => { if (o.isLight) ui.push({ light: o, base: o.intensity }); });
  return { hemi, sun, ui };
})();
const nightColour = new THREE.Color(0xaab4ff);
const white = new THREE.Color(0xffffff);

const night = {
  t: 0,
  sky: skyAt(0),
  said: '',            // the last spoken phase line, so each one is said once
  safe: false,
  safeAt: 0,
  safeSpot: null,      // the last place the player was safe, where a caught player is set down
  bugs: [],            // { kind, model, x, z, y, spin, t, state: 'come' | 'grab' | 'leave', fade }
  spawned: new Set(),  // `${night}:${kind}` already out this night
  grab: null           // { bug, t, from, look }
};

function applyDaylight(daylight) {
  voxels.daylight = daylight;
  // The bugs keep enough light to be seen: a cool moonlight at night.
  nightLights.hemi.intensity = 2.2 - 0.6 * daylight;
  nightLights.sun.intensity = 0.5 + 0.7 * daylight;
  nightLights.hemi.color.copy(nightColour).lerp(white, daylight);
  for (const { light, base } of nightLights.ui) light.intensity = base * (0.35 + 0.65 * daylight);
  if (clouds) clouds.group_.visible = daylight > 0.35;
}

function playerFeet() {
  const p = player.camera_.position;
  return { x: p.x, z: p.z, y: p.y - 1.6 };
}

function checkSafe(now) {
  if (now < night.safeAt) return night.safe;
  night.safeAt = now + 250;
  const p = player.camera_.position;
  const x = Math.round(p.x);
  const z = Math.round(p.z);
  night.safe = sheltered((a, b, c) => voxels.IsSolidAt(a, b, c), x, feetBlock(p.y), z);
  if (night.safe && !night.grab) night.safeSpot = p.clone();
  return night.safe;
}

function groundUnder(x, z, fallback) {
  const g = voxels.GroundAt(Math.round(x), Math.round(z));
  if (g == null) return fallback;
  return Math.max(g, voxel_block_builder.OCEAN_LEVEL - 1) + 0.5;
}

function spawnBug(kind) {
  const feet = playerFeet();
  for (let tries = 0; tries < 16; tries++) {
    const far = tries < 10 ? COME_FROM : COME_FROM * 0.6;
    const angle = rnd() * Math.PI * 2;
    const x = feet.x + Math.cos(angle) * far;
    const z = feet.z + Math.sin(angle) * far;
    const y = groundUnder(x, z, null);
    if (y == null) continue;
    const model = kind === 'spider' ? makeSpider() : makeCaterpillar();
    model.segs.forEach(seg => seg.position.set(x, y, z));
    renderer.scene_.add(model.group);
    const bug = { kind, model, x, z, y, spin: angle, heading: angle + Math.PI, t: rnd() * 10, state: 'come', fade: 0 };
    placeBug(bug, 0);
    night.bugs.push(bug);
    return true;
  }
  return false;
}

// Put the bug's meshes where it is. The caterpillar's body blocks follow the head like a chain.
function placeBug(bug, dt) {
  const m = bug.model;
  const size = bug.state === 'leave' ? Math.max(0.01, 1 - bug.fade) : Math.min(1, bug.fade + 0.01);
  m.lead.position.set(bug.x, bug.y, bug.z);
  m.lead.rotation.y = bug.heading - Math.PI / 2;
  const base = bug.kind === 'spider' ? 1.3 : 1.25;
  m.lead.scale.setScalar(base * size);
  for (let i = 1; i < m.segs.length; i++) {
    const seg = m.segs[i];
    const ahead = m.segs[i - 1].position;
    const dx = seg.position.x - ahead.x;
    const dz = seg.position.z - ahead.z;
    const far = Math.hypot(dx, dz) || 1;
    const gap = m.gap * size;
    if (far > gap) {
      seg.position.x = ahead.x + (dx / far) * gap;
      seg.position.z = ahead.z + (dz / far) * gap;
    }
    const y = groundUnder(seg.position.x, seg.position.z, seg.position.y);
    seg.position.y += (y - seg.position.y) * Math.min(1, dt * 8 || 1);
    seg.rotation.y = Math.atan2(-dx, -dz) - Math.PI / 2;
    seg.scale.setScalar(base * size);
  }
}

function stepBugs(dt, now) {
  const sky = night.sky;
  const feet = playerFeet();
  const paused = quest.open || questionHolding();
  if (sky.bugs && !bugsOff) {
    const into = sky.phase === 'night' ? NIGHT - sky.left : 0;
    for (const kind of Object.keys(BUGS)) {
      const key = `${sky.night}:${kind}`;
      if (!night.spawned.has(key) && into >= BUGS[kind].delay && spawnBug(kind)) night.spawned.add(key);
    }
  }
  // A lit lantern keeps the bugs off just like a house: they circle at a distance.
  const safe = checkSafe(now) || powers.lantern === 'lit';
  for (let i = night.bugs.length - 1; i >= 0; i--) {
    const bug = night.bugs[i];
    const rule = BUGS[bug.kind];
    bug.t += dt;
    if (!sky.bugs && bug.state === 'come') bug.state = 'leave';
    let pace = 0;
    if (bug.state === 'come' && !paused && !night.grab) {
      bug.spin += dt * 0.25;
      const step = stepToward(bug, bugTarget(bug, feet, safe), rule.speed, dt);
      if (step.heading != null) bug.heading = step.heading;
      pace = Math.hypot(step.x - bug.x, step.z - bug.z) / Math.max(dt, 1e-4) / rule.speed;
      bug.x = step.x;
      bug.z = step.z;
      // While circling a safe player, turn to face them.
      if (safe && step.far < 0.5) bug.heading = Math.atan2(feet.x - bug.x, feet.z - bug.z);
      bug.fade = Math.min(1, bug.fade + dt / 1.2);
      if (!player.waiting_ && canGrab(bug, feet, safe, rule.reach * 1.3)) startGrab(bug);
    } else if (bug.state === 'leave') {
      const away = stepToward(bug, { x: bug.x * 2 - feet.x, z: bug.z * 2 - feet.z }, rule.speed * 1.4, dt);
      if (away.heading != null) bug.heading = away.heading;
      bug.x = away.x;
      bug.z = away.z;
      pace = 1.4;
      bug.fade = Math.min(1, bug.fade + dt / 2.5);
      if (bug.fade >= 1) {
        dropBug(renderer.scene_, bug.model);
        night.bugs.splice(i, 1);
        continue;
      }
    }
    const ground = groundUnder(bug.x, bug.z, bug.y);
    bug.y += (ground - bug.y) * Math.min(1, dt * 8);
    animateBug(bug.model, bug.t, Math.max(0.15, Math.min(1.4, pace)), night.grab?.bug === bug);
    placeBug(bug, dt);
  }
}

// Caught: the camera is lifted to the bug's mouth, it munches, the screen goes dark, and the player
// wakes up back in the last safe spot (or where this visit started). That bug goes home for the night.
const grabLook = new THREE.Vector3();
const grabSpot = new THREE.Vector3();
function startGrab(bug) {
  if (night.grab) return;
  night.grab = { bug, t: 0, from: player.camera_.position.clone(), fromQ: player.camera_.quaternion.clone(), said: false };
  bug.heading = Math.atan2(player.camera_.position.x - bug.x, player.camera_.position.z - bug.z);
  player.input.held = true;
  tools.enabled = false;
  renderer.uiScene_.visible = false;
  document.body.classList.add('grabbed');
  blip(140, 0.3, 'sawtooth', 0.08);
}

function stepGrab(dt) {
  const g = night.grab;
  if (!g) return;
  g.t += dt;
  const m = g.bug.model;
  m.group.updateMatrixWorld(true);
  m.mouth.getWorldPosition(grabSpot);
  m.face.getWorldPosition(grabLook);
  const cam = player.camera_;
  const k = Math.min(1, g.t / 0.45);
  const ease = k * k * (3 - 2 * k);
  const shake = reduced ? 0 : Math.sin(g.t * 30) * 0.05 * (g.t < 2 ? 1 : 0);
  cam.position.lerpVectors(g.from, grabSpot, ease);
  cam.position.y += shake;
  const lookQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(cam.position, grabLook, new THREE.Vector3(0, 1, 0)));
  cam.quaternion.copy(g.fromQ).slerp(lookQ, ease);
  if (g.t > 0.5 && !g.said) {
    g.said = true;
    $('munch').hidden = false;
    blip(220, 0.12, 'square', 0.07);
    setTimeout(() => blip(180, 0.12, 'square', 0.07), 260);
    setTimeout(() => blip(150, 0.16, 'square', 0.07), 520);
    speakLine(LINES[g.bug.kind]);
  }
  if (g.t > 2.1) $('fade').classList.add('on');
  if (g.t > 2.6) letGo();
}

function letGo() {
  const g = night.grab;
  night.grab = null;
  $('munch').hidden = true;
  g.bug.state = 'leave';
  g.bug.fade = 0.6;
  const spot = night.safeSpot || startSpot;
  player.input.held = false;
  renderer.uiScene_.visible = true;
  document.body.classList.remove('grabbed');
  player.Teleport(spot.clone());
  tools.enabled = !quest.open;
  note(`The ${BUGS[g.bug.kind].label} let you go. Build a house with a roof and walls, then go inside.`, 4.5);
  setTimeout(() => $('fade').classList.remove('on'), 250);
}

let lastPhase = 'day';
let lastWarn = false;
function stepNight(dt, now) {
  if (bugsOff) {
    // No night, but the days still go by, and each new one brings gift boxes back.
    const day = Math.floor(night.t / CYCLE);
    if (!quest.open) night.t += dt;
    if (Math.floor(night.t / CYCLE) > day) newDay();
    return;
  }
  if (!quest.open && !night.grab) night.t += dt;
  const sky = skyAt(night.t);
  night.sky = sky;
  applyDaylight(sky.daylight);
  if (sky.warn && sky.phase === 'day' && !lastWarn) {
    note('🌙 Night is coming. Build a house with a roof, and go inside!', 4.5);
    speakLine(LINES.warn);
  }
  if (sky.phase === 'night' && lastPhase !== 'night') {
    note('🌙 Night! The bugs are out. Stay inside!', 4);
    speakLine(LINES.night);
  }
  if (sky.phase === 'dawn' && lastPhase === 'night') {
    note('☀️ Good morning! The bugs went home.', 3.5);
    speakLine(LINES.morning);
    newDay();
  }
  lastWarn = sky.warn && sky.phase === 'day';
  lastPhase = sky.phase;
  stepBugs(dt, now);
  stepGrab(dt);
  paintSky();
}

let lastSky = '';
function paintSky() {
  const sky = night.sky;
  const el = $('sky');
  const show = sky.warn || sky.phase !== 'day';
  let text = '';
  let icon = '🌙';
  let kind = 'night';
  if (show) {
    if (night.safe) { icon = '🏠'; text = sky.phase === 'dawn' ? 'Morning is coming' : 'Safe inside'; kind = 'safe'; }
    else if (powers.lantern === 'lit') { icon = POWERS.lantern.icon; text = 'The lantern keeps the bugs away'; kind = 'safe'; }
    else if (sky.phase === 'day') text = 'Night is coming';
    else if (sky.phase === 'dawn') { icon = '☀️'; text = 'Morning is coming'; kind = ''; }
    else text = 'Go inside!';
  }
  const key = `${show}|${icon}|${text}|${kind}`;
  if (key === lastSky) return;
  lastSky = key;
  el.hidden = !show;
  el.className = `pill ${kind}`;
  $('skyIcon').textContent = icon;
  $('skyText').textContent = text;
}

// ---- Input: keys, mouse, touch, and the controller all fill player.input.
const keys = new Set();
addEventListener('keydown', event => {
  if (event.target instanceof HTMLInputElement) return;
  if (quest.open) {
    if (event.code === 'ArrowLeft' || event.code === 'ArrowUp') { setFocus(quest.focus - 1); event.preventDefault(); }
    else if (event.code === 'ArrowRight' || event.code === 'ArrowDown') { setFocus(quest.focus + 1); event.preventDefault(); }
    else if (event.code === 'Escape') { if (!quest.pending) closeCard(); }
    return;
  }
  keys.add(event.code);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  if (event.repeat) return;
  if (event.code === 'KeyE' || event.code === 'Enter') act(null);
  else if (event.code === 'KeyQ' || event.code === 'Tab') { event.preventDefault(); setMode(tools.Mode === 'dig' ? 'build' : 'dig'); }
  else if (event.code === 'BracketLeft') ui.CycleBuildIcon_(-1);
  else if (event.code === 'BracketRight') ui.CycleBuildIcon_(1);
  else if (/^Digit[0-9]$/.test(event.code)) ui.Select(+event.code.slice(5));
});
addEventListener('keyup', event => keys.delete(event.code));
addEventListener('blur', () => keys.clear());
view.addEventListener('wheel', event => { event.preventDefault(); ui.CycleBuildIcon_(event.deltaY > 0 ? 1 : -1); }, { passive: false });

function ndcOf(event) {
  const rect = renderer.threejs_.domElement.getBoundingClientRect();
  return { x: ((event.clientX - rect.left) / rect.width) * 2 - 1, y: -((event.clientY - rect.top) / rect.height) * 2 + 1 };
}

// Tapping or clicking the gift box opens it from a few steps away.
const pickRay = new THREE.Raycaster();
function tappedChest(ndc) {
  if (!quest.chest || !asking()) return false;
  pickRay.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), renderer.camera_);
  const hit = pickRay.intersectObject(quest.chest.box)[0];
  if (!hit || hit.distance > 8) return false;
  quest.awayFromChest = true;
  openCard();
  return true;
}

function act(ndc) {
  if (quest.open || questionHolding() || night.grab) return;
  if (tappedChest(ndc || { x: 0, y: 0 })) return;
  if (tools.Mode === 'build' && ui.Kit) { placeKit(ui.Kit, ndc); return; }
  tools.Act(ndc);
}

// ---- Prizes: build kits go down with one tap, power-ups run for a while.
// A kit is built facing the way the child looks, starting at the spot tapped.
function placeKit(id, ndc) {
  const target = tools.FindTarget_(ndc);
  if (!target || !target.side) return;
  const facing = facingFromYaw(player.Yaw);
  const cells = kitCells(id).map(c => ({ pos: kitToWorld(c, target.side, facing), type: c.type }));
  if (cells.some(c => c.type && player.Overlaps(...c.pos))) {
    note(TOO_CLOSE, 2.5);
    speakLine(TOO_CLOSE);
    return;
  }
  for (const { pos, type } of cells) {
    if (type) voxels.PlaceVoxel(pos, type);
    else if (voxels.VoxelTypeAt(...pos)) voxels.DigVoxel(pos);
  }
  ui.UseKit();
  blip(520, 0.07);
  setTimeout(() => blip(700, 0.1, 'sine', 0.1), 90);
  burst(new THREE.Vector3(...target.side).add(new THREE.Vector3(0, 1, 0)));
  saveDirty = true;
}

// Seconds left on super jump and super speed. The lantern is held until night, then lit all night.
const powers = { jump: 0, speed: 0, lantern: 'off' };   // lantern: 'off' | 'held' | 'lit'
function powerUp(id) {
  if (id === 'lantern') powers.lantern = night.sky?.phase === 'night' ? 'lit' : 'held';
  else powers[id] = POWERS[id].seconds;
}

function stepPowers(dt) {
  const paused = quest.open || questionHolding() || night.grab;
  if (!paused) {
    powers.jump = Math.max(0, powers.jump - dt);
    powers.speed = Math.max(0, powers.speed - dt);
  }
  const phase = night.sky?.phase;
  if (powers.lantern === 'held' && phase === 'night') powers.lantern = 'lit';
  else if (powers.lantern === 'lit' && phase !== 'night') powers.lantern = 'off';
  Object.assign(player.boost, boosts(powers));
  paintPowers();
}

let lastPowers = '';
function paintPowers() {
  const parts = [];
  // A lit lantern shows in the night pill instead.
  if (powers.lantern === 'held') parts.push(`${POWERS.lantern.icon} Lantern for tonight`);
  if (powers.jump > 0) parts.push(`${POWERS.jump.icon} ${Math.ceil(powers.jump)}`);
  if (powers.speed > 0) parts.push(`${POWERS.speed.icon} ${Math.ceil(powers.speed)}`);
  const text = parts.join(' · ');
  if (text === lastPowers) return;
  lastPowers = text;
  $('powers').hidden = !text;
  $('powersText').textContent = text;
}

function capture(el, id) {
  try { el.setPointerCapture(id); } catch { /* the pointer already ended */ }
}

const drags = new Map();
const canvas = renderer.threejs_.domElement;
canvas.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  capture(canvas, event.pointerId);
  drags.set(event.pointerId, { x: event.clientX, y: event.clientY, moved: 0, t: performance.now(), type: event.pointerType });
});
canvas.addEventListener('pointermove', event => {
  if (event.pointerType === 'mouse') {
    usingPad = false;
    tools.aim = ndcOf(event);
  }
  const d = drags.get(event.pointerId);
  if (!d) return;
  const dx = event.clientX - d.x;
  const dy = event.clientY - d.y;
  d.moved += Math.abs(dx) + Math.abs(dy);
  d.x = event.clientX;
  d.y = event.clientY;
  if (d.moved > 8 && !quest.open) {
    const rate = d.type === 'mouse' ? 0.0045 : 0.0065;
    player.input.lookX += dx * rate;
    player.input.lookY += dy * rate;
  }
});
function endDrag(event) {
  const d = drags.get(event.pointerId);
  if (!d) return;
  drags.delete(event.pointerId);
  if (event.type !== 'pointerup') return;
  if (d.moved <= 10 && performance.now() - d.t < 450) act(ndcOf(event));
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') tools.aim = null; });
canvas.addEventListener('contextmenu', event => event.preventDefault());

// Thumb stick for phones and tablets.
const stick = { id: null, x: 0, z: 0 };
const stickEl = $('stick');
function stickMove(event) {
  const rect = stickEl.getBoundingClientRect();
  const r = rect.width / 2;
  let x = (event.clientX - rect.left - r) / r;
  let y = (event.clientY - rect.top - r) / r;
  const len = Math.hypot(x, y);
  if (len > 1) { x /= len; y /= len; }
  stick.x = x;
  stick.z = -y;
  $('knob').style.transform = `translate(${x * r * 0.6}px, ${y * r * 0.6}px)`;
}
stickEl.addEventListener('pointerdown', event => {
  stick.id = event.pointerId;
  capture(stickEl, event.pointerId);
  stickMove(event);
});
stickEl.addEventListener('pointermove', event => { if (event.pointerId === stick.id) stickMove(event); });
function stickEnd(event) {
  if (event.pointerId !== stick.id) return;
  stick.id = null;
  stick.x = stick.z = 0;
  $('knob').style.transform = '';
}
stickEl.addEventListener('pointerup', stickEnd);
stickEl.addEventListener('pointercancel', stickEnd);

let jumpHeld = false;
const jumpEl = $('jump');
jumpEl.addEventListener('pointerdown', event => { event.preventDefault(); jumpHeld = true; });
['pointerup', 'pointercancel', 'pointerleave'].forEach(type => jumpEl.addEventListener(type, () => { jumpHeld = false; }));

// The controller. Same layout as every Little Sprouts game: left stick or d-pad moves, the right
// stick looks, and A or the right trigger acts (build, dig, open, pick). B, Y, and Start stay with
// the host page (back, hear it again, next). Extra for this world: X jumps, the shoulders change
// the block, and the left trigger switches build and dig. lib/pad.js leaves this frame alone.
const padWas = { action: false, x: false, lb: false, rb: false, lt: false, menuDir: '' };
let usingPad = false;
let menuRepeat = 0;
function padInput(dt) {
  let raw = null;
  for (const candidate of navigator.getGamepads?.() || []) if (candidate) raw = candidate;
  document.body.classList.toggle('pad', !!raw && usingPad);
  if (!raw) {
    padWas.action = padWas.x = padWas.lb = padWas.rb = padWas.lt = false;
    return { moveX: 0, moveZ: 0, jump: false };
  }
  const pad = readPad(raw);
  const action = actionDown(pad, padWas.action);
  const fresh = action && !padWas.action;
  padWas.action = action;
  const jump = held(pad.x, padWas.x);
  padWas.x = jump;
  const lb = held(pad.lb, padWas.lb);
  const rb = held(pad.rb, padWas.rb);
  const lt = held(pad.lt, padWas.lt);
  const freshLb = lb && !padWas.lb;
  const freshRb = rb && !padWas.rb;
  const freshLt = lt && !padWas.lt;
  padWas.lb = lb; padWas.rb = rb; padWas.lt = lt;
  const dirs = moveDirs(pad);
  const any = fresh || jump || lb || rb || lt || dirs.x || dirs.y || axisDir(pad.rx) || axisDir(pad.ry);
  if (any && !usingPad) {
    usingPad = true;
    tools.aim = null;
  }

  if (quest.open) {
    const key = `${dirs.x}${dirs.y}`;
    const now = performance.now();
    if ((dirs.x || dirs.y) && (key !== padWas.menuDir || now >= menuRepeat)) {
      const buttons = cardButtons();
      const rects = buttons.map(b => { const r = b.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
      setFocus(nextIndex(rects, quest.focus, dirs));
      menuRepeat = now + 240;
    }
    padWas.menuDir = key;
    if (fresh) cardButtons()[quest.focus]?.click();
    return { moveX: 0, moveZ: 0, jump: false };
  }

  if (freshLb) ui.CycleBuildIcon_(-1);
  if (freshRb) ui.CycleBuildIcon_(1);
  if (freshLt) setMode(tools.Mode === 'dig' ? 'build' : 'dig');
  if (fresh) act(null);

  const look = 2.6 * dt;
  if (axisDir(pad.rx, 0.18)) player.input.lookX += pad.rx * look;
  if (axisDir(pad.ry, 0.18)) player.input.lookY += pad.ry * look * 0.8;
  const stickX = axisDir(pad.lx, 0.2) ? pad.lx : 0;
  const stickY = axisDir(pad.ly, 0.2) ? pad.ly : 0;
  return {
    moveX: pad.left || pad.right ? dirs.x : stickX,
    moveZ: pad.up || pad.down ? -dirs.y : -stickY,
    jump
  };
}

function gatherInput(dt) {
  const pad = padInput(dt);
  const k = code => (keys.has(code) ? 1 : 0);
  const kx = k('KeyD') - k('KeyA');
  const kz = k('KeyW') + k('ArrowUp') - k('KeyS') - k('ArrowDown');
  const turn = k('ArrowRight') - k('ArrowLeft');
  if (turn) player.input.lookX += turn * 2.2 * dt;
  let mx = kx + stick.x + pad.moveX;
  let mz = kz + stick.z + pad.moveZ;
  const len = Math.hypot(mx, mz);
  if (len > 1) { mx /= len; mz /= len; }
  const holding = questionHolding();
  player.input.moveX = holding ? 0 : mx;
  player.input.moveZ = holding ? 0 : mz;
  player.input.jump = !holding && (keys.has('Space') || jumpHeld || pad.jump);
}

// ---- Play with a friend: the same rooms as Paint Sphere and Garden gulp. See friends.mjs.
const knownBlock = type => ALL_TYPES.includes(type);
const collector = worldCollector();
const myBuddy = buddyKind();
let link = null;
let editQueue = [];
let friendSpot = null;
let friendModel = null;   // the friend's garden buddy: { group, animate, dispose }
let friendTime = 0;
let friendAim = null;      // { p: [x, y, z] eye, yaw } last heard
let sendAt = 0;
let stillAt = 0;
let skyAt_ = 0;
let lastSent = '';

class FriendLink {
  constructor() { this.socket = null; }

  host() { this.open({ t: 'create' }); }
  join(code) { this.open({ t: 'join', room: code }); }

  open(msg) {
    this.socket?.close();
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${proto}://${location.host}/link`);
    this.socket = socket;
    friend.status = 'Opening a room…';
    paintFriend();
    socket.addEventListener('open', () => { if (this.socket === socket) socket.send(JSON.stringify(msg)); });
    socket.addEventListener('message', ev => { if (this.socket === socket) this.receive(String(ev.data)); });
    socket.addEventListener('close', () => {
      if (this.socket !== socket) return;
      this.socket = null;
      const was = friend.role;
      friend.role = 'solo';
      friend.peer = false;
      friend.room = '';
      friend.url = '';
      friend.status = was === 'solo' ? 'Could not open a room. Try again in a little while.' : '';
      dropFriend();
      if (was === 'guest') leaveFriendWorld('The room closed. You are back in your own world.');
      else if (was === 'host') note('The room closed.', 3);
      paintFriend();
    });
  }

  leave() {
    const socket = this.socket;
    this.socket = null;
    socket?.close();
    const was = friend.role;
    Object.assign(friend, { role: 'solo', peer: false, room: '', url: '', status: '' });
    dropFriend();
    if (was === 'guest') leaveFriendWorld('You are back in your own world.');
    paintFriend();
  }

  receive(text) {
    let msg;
    try { msg = JSON.parse(text); } catch { return; }
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 'welcome') {
      friend.role = msg.role === 'guest' ? 'guest' : 'host';
      friend.room = String(msg.room || '');
      friend.url = `${location.origin}${location.pathname}?room=${encodeURIComponent(friend.room)}`;
      if (friend.role === 'host') {
        friend.status = 'Waiting for a friend.';
        if (friend.room !== 'wifi') navigator.clipboard?.writeText(friend.url).catch(() => {});
      } else {
        // Keep your own world saved as it is now, then wait for the host's.
        if (friend.ownWorld) save();
        friend.ownWorld = false;
        friend.loading = true;
        friend.status = 'Joining your friend’s world…';
      }
      paintFriend();
      return;
    }
    if (msg.t === 'peer') {
      friend.peer = !!msg.here;
      if (msg.here) friendArrived();
      else {
        dropFriend();
        if (friend.role === 'host') note('Your friend left. They can come back with the same link.', 4);
      }
      paintFriend();
      return;
    }
    if (msg.t === 'full' || msg.t === 'missing' || msg.t === 'closed') {
      friend.status = msg.t === 'full' ? 'That room already has two players.'
        : msg.t === 'missing' ? 'That room is not open any more.' : 'Your friend closed the room.';
      paintFriend();
      return;
    }
    fromFriend(msg);
  }

  send(msg) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(msg));
  }
}

function friendArrived() {
  link.send({ t: 'hi', buddy: myBuddy, gear: buddyGear(myBuddy) });
  if (friend.role !== 'host') return;
  const p = player.camera_.position;
  link.send({ t: 'sky', at: night.t });
  link.send({ t: 'spot', p: [p.x, p.y, p.z] });
  for (const part of worldParts(voxels.Edits)) link.send(part);
  note('👫 Your friend is here. Build together!', 3.5);
}

function fromFriend(msg) {
  if (msg.t === 'hi') {
    showFriend(BUDDIES.includes(msg.buddy) ? msg.buddy : 'fox', typeof msg.gear === 'string' ? msg.gear.slice(0, 24) : '');
  } else if (msg.t === 'me') {
    const p = readSpot(msg.p);
    if (p) friendAim = { p, yaw: Number.isFinite(msg.yaw) ? msg.yaw : 0 };
  } else if (msg.t === 'ed') {
    const e = readEdit(msg.k, msg.v, knownBlock);
    if (!e) return;
    if (friend.loading) editQueue.push(e);
    else voxels.ApplyEdit(e.pos, e.type);
  } else if (msg.t === 'world' && friend.role === 'guest') {
    const all = collector.add(msg, knownBlock);
    if (all) joinFriendWorld(all);
  } else if (msg.t === 'spot' && friend.role === 'guest') {
    friendSpot = readSpot(msg.p);
  } else if (msg.t === 'sky' && friend.role === 'guest' && Number.isFinite(msg.at)) {
    if (Math.abs(night.t - msg.at) > 1.5) night.t = Math.max(0, msg.at);
  }
}

// The host's world replaces this one, and you start right next to the host.
function joinFriendWorld(edits) {
  voxels.ResetEdits(edits);
  editQueue.splice(0).forEach(e => voxels.ApplyEdit(e.pos, e.type));
  friend.loading = false;
  const at = friendSpot ? new THREE.Vector3(friendSpot[0] + 1.5, friendSpot[1] + 0.5, friendSpot[2] + 1.5) : player.camera_.position.clone();
  player.Teleport(at);
  if (night.grab) letGo();
  note('👫 You are in your friend’s world. Build together!', 3.5);
  paintFriend();
}

function leaveFriendWorld(line) {
  if (friend.ownWorld) return;
  friend.loading = false;
  editQueue = [];
  const own = readOwnSave();
  voxels.ResetEdits(own?.edits || []);
  player.Teleport(own?.pos ? new THREE.Vector3(...own.pos) : startSpot.clone());
  friend.ownWorld = true;
  if (roomParam) history.replaceState(null, '', location.pathname);
  note(line, 3.5);
}

function showFriend(kind, gear) {
  dropFriend(true);
  const model = makeBuddy(THREE, kind, { gear });
  model.group.scale.setScalar(1.25);
  model.group.visible = false;
  renderer.scene_.add(model.group);
  friendModel = model;
}

function dropFriend(keepAim = false) {
  if (friendModel) {
    renderer.scene_.remove(friendModel.group);
    friendModel.dispose?.();
    friendModel = null;
  }
  if (!keepAim) friendAim = null;
}

const _feet = new THREE.Vector3();
function stepFriend(dt) {
  if (!link || !friend.peer) return;
  if (friendModel && friendAim) {
    // The buddy stands where the friend's feet are and faces where they look (it faces +z).
    const g = friendModel.group;
    _feet.set(friendAim.p[0], friendAim.p[1] - 1.6, friendAim.p[2]);
    if (!g.visible) g.position.copy(_feet);
    g.visible = true;
    const away = Math.hypot(_feet.x - g.position.x, _feet.z - g.position.z);
    g.position.lerp(_feet, Math.min(1, dt * 10));
    let turn = friendAim.yaw + Math.PI - g.rotation.y;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    g.rotation.y += turn * Math.min(1, dt * 10);
    friendTime += dt;
    friendModel.animate?.(dt, Math.min(1, away * 4), friendTime);
  }
  if (friend.loading) return;
  sendAt += dt;
  stillAt += dt;
  skyAt_ += dt;
  const p = player.camera_.position;
  const me = { t: 'me', p: [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)], yaw: +player.Yaw.toFixed(2) };
  const key = `${me.p}|${me.yaw}`;
  if ((sendAt >= SEND_EVERY && key !== lastSent) || stillAt >= STILL_EVERY) {
    link.send(me);
    lastSent = key;
    sendAt = 0;
    stillAt = 0;
  }
  if (friend.role === 'host' && skyAt_ >= SKY_EVERY) {
    skyAt_ = 0;
    link.send({ t: 'sky', at: night.t });
  }
}

// Your own building goes to the friend as it happens.
voxels.onChange = (pos, type) => {
  if (link && friend.peer && !friend.loading) link.send({ t: 'ed', k: pos.join('.'), v: type });
};

function paintFriend() {
  const line = roomLine(friend);
  $('friendBox').hidden = !line;
  $('friendText').textContent = line;
  $('friendCopy').hidden = !(friend.role === 'host' && !friend.peer && friend.room && friend.room !== 'wifi');
  $('friendLeave').hidden = friend.role === 'solo';
  $('friend').hidden = friend.role !== 'solo';
}

$('friend').addEventListener('click', () => {
  link = link || new FriendLink();
  link.host();
});
$('friendLeave').addEventListener('click', () => link?.leave());
$('friendCopy').addEventListener('click', () => {
  navigator.clipboard?.writeText(friend.url).then(() => note('Link copied.', 2), () => note(friend.url, 6));
});
if (roomParam) {
  link = new FriendLink();
  link.join(roomParam);
}

// ---- Main loop.
let started = false;
let last = 0;
let needAt = 0;
// ---- Joining a friend: while the join card (lib/friend-panel.mjs) is up, the game holds still
// and goes quiet, so the only sound is the card's own (it talks to the other device by sound).
// The night clock, the bugs, power-ups, and gift boxes all wait. The friend link keeps going.
const joiningFriend = () => !!document.querySelector('[data-friend-panel]');
let joinHold = false;
function holdForJoin(on) {
  if (on === joinHold) return;
  joinHold = on;
  if (on) {
    try { sproutsVoice?.stop?.(); } catch { /* nothing playing */ }
    try { speechSynthesis.cancel(); } catch { /* no voice here */ }
    audio?.suspend?.().catch(() => {});
    keys.clear();
    jumpHeld = false;
    Object.assign(player.input, { moveX: 0, moveZ: 0, jump: false, lookX: 0, lookY: 0 });
  } else {
    audio?.resume?.().catch(() => {});
  }
  // Inside Little Sprouts, the app stops talking too.
  send('hush', { on });
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = last ? Math.min(1 / 30, (now - last) / 1000) : 0;
  last = now;
  const joining = joiningFriend();
  holdForJoin(joining);
  if (!joining) gatherInput(dt);
  em.Update(dt);
  if (!started && !player.waiting_) {
    started = true;
    $('loading').hidden = true;
    send('ready');
    note(quest.free ? 'Free build.' : 'Walk to the glowing gift box.', 3);
  }
  if (started && joining) {
    stepFriend(dt);
  } else if (started) {
    stepNight(dt, now);
    stepPowers(dt);
    stepFriend(dt);
    stepQuest(dt);
    stepSparks(dt);
    paintHud();
    if (!solo && asking() && !quest.ask && now > needAt) {
      needAt = now + 1000;
      // In free build, ask the host for one more question past the usual count.
      send('need', quest.free ? { more: true } : undefined);
    }
  }
  renderer.Render();
}
requestAnimationFrame(frame);
setMode('build');
if (['localhost', '127.0.0.1'].includes(location.hostname)) globalThis.blockMeadow = { quest, player, tools, voxels, ui, save, night, powers, mark, placeKit, friend, get link() { return link; } };
