// Block meadow: an open voxel world on the Little Sprouts adventures shelf.
// The world engine in ./engine is forked from SimonDev's Quick_MinecraftClone2 (MIT, see engine/LICENSE):
// streamed 16-block chunks built in workers, biomes, trees, ambient occlusion, clouds, and the
// entity/component loop. This file is Little Sprouts' own: kid controls (touch, mouse, keys, and
// the shared controller layout), gift boxes that ask the learner's questions, block rewards,
// free build, and saving the world in this browser.
import * as THREE from '../../vendor/three/build/three.module.js?v=r187';
import { entity_manager } from './engine/entity-manager.js?v=blocks3';
import { entity } from './engine/entity.js?v=blocks3';
import { threejs_component } from './engine/threejs-component.js?v=blocks3';
import { sparse_voxel_cell_manager } from './engine/sparse-voxel-cell-manager.js?v=blocks3';
import { cloud_controller } from './engine/cloud-controller.js?v=blocks3';
import { player_controller } from './engine/player-controller.js?v=blocks3';
import { voxel_tools } from './engine/voxel-tools.js?v=blocks3';
import { ui_controller } from './engine/ui-controller.js?v=blocks3';
import { hack_defs } from './engine/hack-defs.js?v=blocks3';
import { texture_defs } from './engine/texture-defs.js?v=blocks3';
import { voxel_block_builder } from './engine/voxel-block-builder.js?v=blocks3';
import { questionHolding } from '../../lib/hold.js?v=hold2';
import { actionDown, axisDir, held, moveDirs, nextIndex, readPad } from '../../lib/pad-core.mjs?v=pad-blocks';
import { resolveAutoQuality, pixelRatioCap, rendererOptions, isPerformanceTier } from '../../lib/device-tier.mjs?v=low-end1';
import { chestDistance, goalFrom, localQuestion, nextLetterOk, normalizeAsk, readSave } from './quiz.mjs?v=blocks3';

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
const saved = (() => {
  try { return readSave(localStorage.getItem(SAVE_KEY), { starter: texture_defs.STARTER, all: ALL_TYPES }); }
  catch { return null; }
})();

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

if (!lowGpu) {
  const clouds = new entity.Entity();
  clouds.AddComponent(new cloud_controller.CloudController());
  em.Add(clouds);
}

const playerEntity = new entity.Entity();
playerEntity.AddComponent(new player_controller.PlayerController({ yaw: saved?.yaw || 0, pitch: saved?.pitch || 0 }));
playerEntity.AddComponent(new voxel_tools.VoxelTools());
playerEntity.SetPosition(findSpawn());
em.Add(playerEntity, 'player');
const player = playerEntity.GetComponent('PlayerController');
const tools = playerEntity.GetComponent('VoxelTools');

const uiEntity = new entity.Entity();
uiEntity.AddComponent(new ui_controller.UIController({
  bar: $('bar'),
  unlocked: saved?.unlocked || texture_defs.STARTER,
  selected: saved?.selected,
  onMode: mode => setMode(mode)
}));
em.Add(uiEntity, 'ui');
const ui = uiEntity.GetComponent('UIController');

// ---- Little sounds, made on the spot. Quiet under the spoken question.
let audio = null;
let soundOn = true;
let ducked = false;
function blip(freq, length = 0.08, kind = 'triangle', gain = 0.12) {
  if (!soundOn) return;
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
    const edits = [...voxels.Edits].slice(-40000);
    const p = player.camera_.position;
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      edits,
      pos: [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10 + 0.5, Math.round(p.z * 10) / 10],
      yaw: player.Yaw,
      pitch: player.Pitch,
      unlocked: ui.Unlocked,
      selected: ui.Selected
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
  if (quest.chest) burst(quest.chest.group.position);
  clearChest();
  blip(780, 0.12, 'sine', 0.12);
  setTimeout(() => blip(1040, 0.16, 'sine', 0.12), 110);
  setTimeout(() => {
    closeCard();
    if (quest.rights >= quest.goal) startFree();
    else note(reward ? `You got ${texture_defs.DEFS[reward].label} blocks!` : 'Yes! Find the next gift box.');
    saveDirty = true;
  }, reduced ? 300 : 700);
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
  note(arcade ? 'Free build. Every block is yours.' : 'Free build! Every block is yours now.', 3);
  saveDirty = true;
  paintHud();
}
$('done').addEventListener('click', () => {
  save();
  send('finish', { detail: 'build' });
});

function takeAsk(ask) {
  if (!ask || quest.free) return;
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
  else if (data.type === 'clear') { if (!quest.free) startFree(); }
  else if (data.type === 'arcade') startFree(true);
  else if (data.type === 'duck') ducked = !!data.on;
});

function stepQuest(dt) {
  if (quest.free) return;
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
  questEl.hidden = quest.free || !c;
  $('stars').hidden = quest.free || solo && quest.rights === 0;
  $('starCount').textContent = `${quest.rights} / ${quest.goal}`;
  if (!c || quest.free) return;
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
  if (!quest.chest || quest.free) return false;
  pickRay.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), renderer.camera_);
  const hit = pickRay.intersectObject(quest.chest.box)[0];
  if (!hit || hit.distance > 8) return false;
  quest.awayFromChest = true;
  openCard();
  return true;
}

function act(ndc) {
  if (quest.open || questionHolding()) return;
  if (tappedChest(ndc || { x: 0, y: 0 })) return;
  tools.Act(ndc);
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

// ---- Main loop.
let started = false;
let last = 0;
let needAt = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = last ? Math.min(1 / 30, (now - last) / 1000) : 0;
  last = now;
  gatherInput(dt);
  em.Update(dt);
  if (!started && !player.waiting_) {
    started = true;
    $('loading').hidden = true;
    send('ready');
    note(quest.free ? 'Free build.' : 'Walk to the glowing gift box.', 3);
  }
  if (started) {
    stepQuest(dt);
    stepSparks(dt);
    paintHud();
    if (!solo && !quest.free && !quest.ask && now > needAt) {
      needAt = now + 1000;
      send('need');
    }
  }
  renderer.Render();
}
requestAnimationFrame(frame);
setMode('build');
if (['localhost', '127.0.0.1'].includes(location.hostname)) globalThis.blockMeadow = { quest, player, tools, voxels, ui, save };
