import { makeQuiz } from '../../lib/sidecar-quiz.mjs';
import { attachTouchControls, isTouchDevice } from '../../lib/touch-controls.mjs?v=touch1';
import { buddyGear, buddyKind, makeBuddy } from '../../lib/buddy3d.mjs';
import { isPerformanceTier, resolveAutoQuality } from '../../lib/device-tier.mjs';
import { openRoom } from '../../lib/friend-link.mjs?v=sketchbook1';
import { friendRoomCode, makeFriendSession } from './friends.mjs?v=1';
import { distanceTo, LANDMARKS, makeTrail, MEGA_RAMP, pastRampLanding, RAMP_LANDING, STOPS } from './checkpoints.mjs?v=trail6';

const $ = id => document.getElementById(id);
const quiz = makeQuiz();
const trail = makeTrail();
const runtime = globalThis.Sketchbook;
const supported = !!runtime?.World;
const performanceTier = isPerformanceTier(resolveAutoQuality());
const state = { world: null, buddy: null, ready: false, arcade: !quiz.live, responded: false, finished: false };
let fromHost, paused, driving, flightHint, onRamp = false, returningToTrail = false, pickerFromMenu = false, timer = 0, motion = 0, touch, touchDevice = false;
const touchCodes = new Map();
const movementCodes = new Set();
const pressedTouchKeys = new Set();
const touchPanel = $('trail-touch');
const touchButtons = [...touchPanel.querySelectorAll('button')];
const panelIds = ['trail-panel', 'trail-picker', 'trail-friend-panel'];
const menuOpen = () => panelIds.some(id => !$(id).hidden) || !!document.querySelector('[data-friend-panel]');
const lights = [];
const canvas = () => state.world?.renderer.domElement;
const player = () => {
  const world = state.world;
  const receiver = world?.inputManager.inputReceiver;
  if (world?.characters.includes(receiver)) return receiver;
  if (world?.characters.includes(receiver?.controllingCharacter)) return receiver.controllingCharacter;
  return world?.characters.includes(world.cameraOperator.characterCaller) ? world.cameraOperator.characterCaller : null;
};
const v = supported ? new runtime.Vector3() : null;
const forward = supported ? new runtime.Vector3() : null;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (quiz.live) addEventListener('message', event => {
  if (event.source !== parent || event.origin !== location.origin || event.data?.source !== 'sprouts-sidecar') return;
  if (event.data.type === 'ask') {
    fromHost = event.data.buddy;
    setBuddy();
  }
});

function notice(line, seconds = 2.6) {
  $('trail-notice').textContent = line;
  $('trail-notice').hidden = false;
  timer = seconds;
}

function error(message) {
  $('trail-mode').textContent = message;
  $('trail-mode').setAttribute('role', 'alert');
  $('trail-hud').style.zIndex = '60';
  if ($('loading-screen')) $('loading-screen').hidden = true;
  pause(true);
}

function trailBuddy(kind, gear) {
  // Sketchbook ships Three.js r113. Alias the new geometry names onto the same engine
  // so the Sprouts rig and the rest of the world share one scene graph and renderer.
  const Capsule = function(radius, length, capSegments = 4, radialSegments = 8) {
    const profile = [];
    for (let i = 0; i <= capSegments; i++) {
      const a = -Math.PI / 2 + i / capSegments * Math.PI / 2;
      profile.push(new runtime.Vector2(Math.cos(a) * radius, -length / 2 + Math.sin(a) * radius));
    }
    for (let i = 0; i <= capSegments; i++) {
      const a = i / capSegments * Math.PI / 2;
      profile.push(new runtime.Vector2(Math.cos(a) * radius, length / 2 + Math.sin(a) * radius));
    }
    return new runtime.LatheBufferGeometry(profile, radialSegments);
  };
  const three = { ...runtime, CapsuleGeometry: Capsule, PlaneGeometry: runtime.PlaneBufferGeometry,
    CircleGeometry: runtime.CircleBufferGeometry, SphereGeometry: runtime.SphereBufferGeometry,
    ConeGeometry: runtime.ConeBufferGeometry, TorusGeometry: runtime.TorusBufferGeometry };
  const rig = makeBuddy(three, kind, { shadow: false, gear });
  rig.group.scale.setScalar(0.65);
  return rig;
}

function setBuddy() {
  const character = player(), kind = buddyKind(fromHost);
  if (!character || !runtime) return;
  if (state.buddy?.character === character && state.buddy.rig.kind === kind) return;
  if (state.buddy) {
    state.buddy.rig.group.parent?.remove(state.buddy.rig.group);
    state.buddy.rig.dispose();
  }
  // Keep Sketchbook's skeletal animation and vehicle entry, but show the learner's buddy.
  for (const child of character.modelContainer.children) child.visible = false;
  const rig = trailBuddy(kind);
  character.modelContainer.add(rig.group);
  state.buddy = { character, rig };
}

function addLights() {
  for (const [x, y, z] of STOPS) {
    const ringMat = new runtime.MeshBasicMaterial({ color: 0xffcd65 });
    const gemMat = new runtime.MeshBasicMaterial({ color: 0xffb92d });
    const ring = new runtime.Mesh(new runtime.TorusBufferGeometry(1.4, 0.11, 8, 32), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, y + 0.14, z);
    const gem = new runtime.Mesh(new runtime.BoxBufferGeometry(0.53, 0.53, 0.53), gemMat);
    gem.position.set(x, y + 1.2, z);
    gem.rotation.z = Math.PI / 4;
    state.world.graphicsWorld.add(ring, gem);
    lights.push({ ring, gem, ringMat, gemMat, y });
  }
  paintLights();
}

function paintLights() {
  lights.forEach(({ ring, gem, ringMat, gemMat }, i) => {
    ring.visible = gem.visible = !state.arcade && i <= trail.index;
    ringMat.color.set(i < trail.index ? 0x52eba8 : 0xffcd65);
    gemMat.color.set(i < trail.index ? 0x71ffc4 : 0xffb92d);
  });
}

function paintMode() {
  $('trail-mode').textContent = state.arcade ? 'Free roam · No questions'
    : trail.done ? `All ${STOPS.length} beacons lit! Keep exploring or finish.`
    : `${trail.index} of ${STOPS.length} beacons lit · Next: ${onRamp ? 'Mega Ramp landing' : LANDMARKS[trail.index].name}`;
  $('trail-menu').hidden = false;
  $('trail-quick-starts').hidden = false;
  $('trail-starts').hidden = false;
  $('trail-return').hidden = state.arcade || trail.done;
  $('trail-finish').hidden = state.arcade || trail.index === 0;
  $('trail-guide').hidden = state.arcade || trail.done;
}

function pause(on) {
  if (paused === on) return;
  paused = on;
  document.body.toggleAttribute('data-trail-paused', on);
  const world = state.world;
  if (world) {
    if (on) {
      clearTouch();
      const character = player();
      character?.resetControls();
      character?.controlledObject?.resetControls?.();
      if (document.pointerLockElement) document.exitPointerLock?.();
    }
    world.inputPaused = on;
  }
  if (on) touch?.reset();
  touch?.setVisible(!on);
  touch?.update();
  if (!on) canvas()?.focus({ preventScroll: true });
}

function sendKey(code, down) {
  document.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true, cancelable: true }));
}

function syncTouchKey(code) {
  const down = movementCodes.has(code) || [...touchCodes.values()].some(button => button.dataset.control === code);
  if (down === pressedTouchKeys.has(code)) return;
  if (down) pressedTouchKeys.add(code);
  else pressedTouchKeys.delete(code);
  sendKey(code, down);
}

function releaseTouchButton(id) {
  const button = touchCodes.get(id);
  if (!button) return;
  touchCodes.delete(id);
  button.removeAttribute('data-held');
  syncTouchKey(button.dataset.control);
}

for (const button of touchButtons) {
  button.addEventListener('pointerdown', event => {
    if (paused || button.hasAttribute('data-held') || event.button !== 0) return;
    event.preventDefault();
    try { button.setPointerCapture(event.pointerId); } catch { /* The pointer may already be gone. */ }
    touchCodes.set(event.pointerId, button);
    button.setAttribute('data-held', '');
    syncTouchKey(button.dataset.control);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(type, event => releaseTouchButton(event.pointerId));
  }
  // Keyboard and assistive-technology clicks have no pointer to hold/release the action.
  button.addEventListener('click', event => {
    if (paused || event.detail !== 0 || pressedTouchKeys.has(button.dataset.control)) return;
    sendKey(button.dataset.control, true);
    sendKey(button.dataset.control, false);
  });
}

function clearTouch() {
  movementCodes.clear();
  for (const id of touchCodes.keys()) releaseTouchButton(id);
  for (const code of pressedTouchKeys) sendKey(code, false);
  pressedTouchKeys.clear();
}

function showTouchControls() {
  touchDevice = true;
  touchPanel.hidden = false;
  document.body.setAttribute('data-trail-touch', '');
}

function paintControls(vehicle) {
  const actions = vehicle?.actions;
  document.body.toggleAttribute('data-trail-flight', !!actions?.yawLeft);
  const labels = {
    KeyQ: actions?.yawLeft && 'Yaw left',
    KeyE: actions?.yawRight && 'Yaw right',
    KeyV: actions?.view && 'View',
    KeyX: actions?.seat_switch && 'Switch seat',
    KeyB: actions?.wheelBrake && 'Wheel brake',
    KeyG: !vehicle && 'Passenger',
    KeyF: vehicle ? 'Exit vehicle' : 'Vehicle',
    KeyW: actions?.throttle && !actions.pitchUp && 'Gas',
    ShiftLeft: !vehicle ? 'Run' : actions.ascend ? 'Rise' : actions.pitchUp && 'Throttle',
    Space: !vehicle ? 'Jump' : actions.descend ? 'Descend' : 'Brake'
  };
  for (const button of touchButtons) {
    const label = labels[button.dataset.control];
    if (!label) {
      for (const [id, held] of touchCodes) if (held === button) releaseTouchButton(id);
    }
    button.hidden = !label;
    if (label) button.textContent = label;
  }
  $('trail-help').textContent = vehicle
    ? 'WASD / left stick to drive or steer · F / X to exit · M / Start for menu'
    : 'WASD / left stick to walk · drag / right stick to look · Space / A to jump · M / Start for menu';
}

function touchStep(dt) {
  if (!touch || paused) return;
  touch.update();
  if (!touchDevice) return;
  const x = touch.move.x, y = touch.move.y;
  for (const [code, held] of [['KeyA', x < -0.27], ['KeyD', x > 0.27], ['KeyW', y < -0.27], ['KeyS', y > 0.27]]) {
    if (held === movementCodes.has(code)) continue;
    if (held) movementCodes.add(code);
    else movementCodes.delete(code);
    syncTouchKey(code);
  }
  if (touch.aim.active) {
    const e = new MouseEvent('mousemove', { movementX: touch.aim.x * 900 * dt, movementY: touch.aim.y * 900 * dt });
    e.sproutsLook = true;
    canvas()?.dispatchEvent(e);
  }
}

async function activateBeacon() {
  const reward = trail.index + 1;
  pause(true);
  try {
    const landmark = LANDMARKS[trail.index];
    const ok = await quiz.ask({ title: 'Light a beacon', note: `${landmark.name} · Pick the right answer to light this stop.` });
    if (trail.settle(ok && !quiz.cleared && !state.arcade)) {
      paintLights();
      paintMode();
      notice(trail.done ? `Trail complete! ${landmark.hint}` : landmark.hint, 6);
      quiz.progress(`${reward} of ${STOPS.length} beacons lit`);
    }
  } finally {
    if (!document.hidden && !state.finished && !menuOpen()) pause(false);
  }
}

function resetTrailPosition() {
  const world = state.world;
  if (!state.ready || !world || trail.pending) return;
  returningToTrail = true;
  trail.restartLeg();
  // Recover the player and vehicles even if the player was in a seat or flying.
  launchStart('default');
}
$('trail-return').onclick = resetTrailPosition;

$('trail-finish').onclick = () => {
  if (state.arcade || state.finished || trail.pending || trail.index === 0) return;
  state.finished = true;
  hideMenus();
  pause(true);
  quiz.finish('trail');
};

function panel(name) {
  for (const id of panelIds) $(id).hidden = id !== name;
  // The shared touch helper disables page panning while playing. Restore it for scrollable cards.
  document.documentElement.style.touchAction = document.body.style.touchAction = name ? 'auto' : 'none';
  $('trail-menu').setAttribute('aria-expanded', String(name === 'trail-panel'));
  $('trail-quick-starts').setAttribute('aria-expanded', String(name === 'trail-picker'));
  if (name) {
    $(name).scrollTop = 0;
    $(name).querySelector('button:not([hidden])')?.focus({ preventScroll: true });
  }
}

function hideMenus() { panel(null); }

function openMenu() {
  if (!state.ready || trail.pending || state.finished) return;
  pause(true);
  panel('trail-panel');
}

function resumeGame() {
  hideMenus();
  if (!document.hidden) pause(false);
}

$('trail-menu').onclick = openMenu;
$('trail-resume').onclick = resumeGame;
function openStartingPlaces(fromMenu) {
  if (!state.ready || trail.pending || state.finished) return;
  pickerFromMenu = fromMenu;
  $('trail-close').textContent = fromMenu ? '← Back to menu' : '← Keep playing';
  pause(true);
  panel('trail-picker');
}

function closeStartingPlaces() {
  if (pickerFromMenu) panel('trail-panel');
  else resumeGame();
}

$('trail-quick-starts').onclick = () => openStartingPlaces(false);
$('trail-starts').onclick = () => openStartingPlaces(true);
$('trail-close').onclick = closeStartingPlaces;
addEventListener('keydown', event => {
  if (event.repeat || !['KeyM', 'Escape'].includes(event.code)) return;
  const wifi = document.querySelector('[data-friend-panel]');
  if (wifi) {
    wifi.shadowRoot?.querySelector('[data-k="cancel"], [data-id="cancel"], [data-id="later"]')?.click();
    return;
  }
  if (!$('trail-picker').hidden) closeStartingPlaces();
  else if (!$('trail-friend-panel').hidden) panel('trail-panel');
  else if (!$('trail-panel').hidden) resumeGame();
  else openMenu();
});
addEventListener('blur', () => {
  clearTouch();
  touch?.reset();
  player()?.resetControls();
  player()?.controlledObject?.resetControls?.();
});
addEventListener('visibilitychange', () => {
  if (document.hidden) pause(true);
  else if (state.ready && !trail.pending && !state.finished && !menuOpen()) pause(false);
});

function tick(dt, wallDt) {
  if (!state.ready) return;
  const character = player(), world = state.world;
  touchStep(Math.min(0.05, wallDt));
  setBuddy();
  motion += reduced ? 0 : dt;
  if (timer > 0 && (timer -= dt) <= 0) $('trail-notice').hidden = true;
  if (character && state.buddy) {
    const vehicle = character.controlledObject, vel = character.characterCapsule.body.velocity;
    state.buddy.rig.animate(dt, vehicle ? 0 : Math.min(1, Math.hypot(vel.x, vel.z) / 4), motion);
    if (driving !== vehicle) {
      driving = vehicle;
      paintControls(vehicle);
    }
  }
  lights.forEach(({ gem, y }, i) => {
    if (!gem.visible) return;
    gem.position.y = y + 1.35 + Math.sin(motion * 3 + i) * 0.18;
    gem.rotation.y = motion * 1.5;
  });
  if (state.arcade || !character || state.finished) return;
  const pos = character.getWorldPosition(v);
  const nearby = !character.controlledObject && LANDMARKS.find(({ aircraft }, i) => {
    if (!aircraft || distanceTo(pos, STOPS[i]) > 5 || Math.abs(pos.y - STOPS[i][1]) > 2.2) return false;
    return world.vehicles.some(vehicle => vehicle.spawnPoint.name === aircraft && vehicle.position.distanceTo(pos) < 7);
  });
  if (nearby !== flightHint) {
    flightHint = nearby;
    $('trail-boarding').hidden = !nearby;
    $('trail-boarding').textContent = nearby ? nearby.hint : '';
  }
  if (trail.done) return;
  if (onRamp && pastRampLanding(pos)) {
    onRamp = false;
    paintMode();
    notice('Nice ride! Follow the arrow to the parked cars.', 5);
  }
  const target = onRamp ? RAMP_LANDING : trail.updateGuide(pos);
  const dx = target[0] - pos.x, dz = target[2] - pos.z;
  world.camera.getWorldDirection(forward);
  const angle = Math.atan2(dx, -dz) - Math.atan2(forward.x, -forward.z);
  $('trail-arrow').style.transform = `rotate(${angle}rad)`;
  $('trail-distance').textContent = `${Math.round(distanceTo(pos, target))} m`;
  if (!onRamp && !quiz.cleared && trail.reach(pos)) void activateBeacon();
}

const roomFromLink = friendRoomCode(new URLSearchParams(location.search).get('room'));
const rideName = vehicle => vehicle?.actions?.ascend ? 'heli'
  : vehicle?.actions?.wheelBrake ? 'plane' : vehicle?.actions?.throttle ? 'car' : '';
let friendPose = null, friendBuddy = null, friendRide = null, inviteUrl = '', openedInvite = false;
const removeRenderObject = object => object?.parent?.remove(object);
const friend = makeFriendSession({
  transport(facade, wifi) {
    const url = new URL('/link', location.href);
    url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return openRoom(url.href, facade, WebSocket, { wifi, wifiChip: false });
  },
  receive(pose) { friendPose = pose; },
  clear() {
    friendPose = null;
    removeRenderObject(friendBuddy?.rig.group);
    friendBuddy?.rig.dispose();
    friendBuddy = null;
    removeRenderObject(friendRide?.model);
    friendRide = null;
  },
  update({ status, code, connected, active }) {
    $('trail-friend-status').textContent = status;
    $('trail-friends-label').textContent = connected ? 'Playing with a friend' : 'Play with a friend';
    $('trail-host').hidden = active;
    $('trail-wifi').hidden = active;
    $('trail-leave').hidden = !active;
    const url = new URL('index.html', location.href);
    if (code) url.searchParams.set('room', code);
    inviteUrl = code ? url.href : '';
    $('trail-invite').hidden = $('trail-copy').hidden = !code || connected;
    $('trail-invite').href = inviteUrl;
    $('trail-invite').textContent = inviteUrl;
    if (!connected) return;
    if (!$('trail-friend-panel').hidden) resumeGame();
    notice('Your friend joined the playground!', 5);
  }
});
$('trail-friends').onclick = () => panel('trail-friend-panel');
$('trail-friend-back').onclick = () => panel('trail-panel');
$('trail-host').onclick = () => friend.host(false);
$('trail-wifi').onclick = () => friend.host(true);
$('trail-leave').onclick = () => friend.leave('Room closed. You can keep playing.');
$('trail-copy').onclick = async () => {
  try {
    await navigator.clipboard.writeText(inviteUrl);
    $('trail-friend-status').textContent = 'Invite link copied!';
  } catch {
    const selection = getSelection();
    const range = document.createRange();
    range.selectNodeContents($('trail-invite'));
    selection?.removeAllRanges();
    selection?.addRange(range);
    $('trail-friend-status').textContent = 'Select and copy this invite link.';
  }
};
addEventListener('pagehide', () => friend.leave());

function sendFriend() {
  const character = player();
  if (!friend.connected || !state.ready || !character) return;
  const kind = buddyKind(fromHost);
  const vehicle = character.occupyingSeat?.vehicle || character.controlledObject;
  friend.send({
    p: character.modelContainer.getWorldPosition(v).toArray(),
    yaw: Math.atan2(character.orientation.x, character.orientation.z),
    gait: vehicle ? 0 : Math.min(1, Math.hypot(character.velocity.x, character.velocity.z)),
    kind, gear: buddyGear(kind),
    ride: vehicle && { type: rideName(vehicle), p: vehicle.position.toArray(), q: vehicle.quaternion.toArray() }
  });
}

function drawFriend(time) {
  requestAnimationFrame(drawFriend);
  if (!friendPose || !state.ready) return;
  const world = state.world.graphicsWorld;
  const { p, yaw, gait, kind, gear, ride } = friendPose;
  const xyz = v.fromArray(p);
  if (friendBuddy?.kind !== kind || friendBuddy.gear !== gear) {
    removeRenderObject(friendBuddy?.rig.group);
    friendBuddy?.rig.dispose();
    const rig = trailBuddy(kind, gear);
    rig.group.name = 'sketchbook-friend-buddy';
    rig.group.position.copy(xyz);
    world.add(rig.group);
    friendBuddy = { rig, kind, gear, time };
  }
  const dt = Math.min(.05, (time - friendBuddy.time) / 1000);
  const alpha = 1 - Math.exp(-dt * 14);
  const rig = friendBuddy.rig;
  if (rig.group.position.distanceToSquared(xyz) > 900) rig.group.position.copy(xyz);
  else rig.group.position.lerp(xyz, alpha);
  rig.group.rotation.y += Math.atan2(Math.sin(yaw - rig.group.rotation.y), Math.cos(yaw - rig.group.rotation.y)) * alpha;
  rig.animate(dt, gait, time / 1000);
  friendBuddy.time = time;
  if (!ride || friendRide?.type !== ride.type) {
    removeRenderObject(friendRide?.model);
    friendRide = null;
  }
  if (!ride) return;
  if (!friendRide) {
    const sample = state.world.vehicles.find(vehicle => rideName(vehicle) === ride.type);
    if (!sample) return;
    const model = sample.modelContainer.clone(true);
    model.name = 'sketchbook-friend-vehicle';
    // Characters and wheel meshes are attached by Sketchbook separately. The clone is visual only.
    for (const wheel of sample.wheels) {
      const mesh = wheel.wheelObject.clone(true);
      const hub = sample.rayCastVehicle.wheelInfos[wheel.rayCastWheelInfoIndex].chassisConnectionPointLocal;
      mesh.position.set(hub.x, hub.y - 0.2, hub.z);
      mesh.quaternion.set(0, 0, 0, 1);
      model.add(mesh);
    }
    model.position.fromArray(ride.p);
    model.quaternion.fromArray(ride.q);
    world.add(model);
    friendRide = { type: ride.type, model, rotation: new runtime.Quaternion() };
  }
  const { model, rotation } = friendRide;
  xyz.fromArray(ride.p);
  if (model.position.distanceToSquared(xyz) > 900) model.position.copy(xyz);
  else model.position.lerp(xyz, alpha);
  model.quaternion.slerp(rotation.fromArray(ride.q), alpha);
}

const startingPlaces = {
  [MEGA_RAMP]: ['🏁', 'Mega Ramp', 'Start in the car at the very top.'],
  default: ['🌿', 'Playground', 'Walk around or try a parked car.'],
  'default001': ['✈️', 'Runway', 'Try the airplane and low helicopter.'],
  race_1: ['🏎️', 'Oval race', 'Race around the big loop.'],
  race_2: ['🚇', 'Tunnel race', 'Drive through the tunnels.'],
  race_3: ['♾️', 'Figure 8 race', 'Race around the figure eight.'],
  stunt_2: ['🎢', 'Loop ramp', 'Build up speed to drive the loop.']
};

function launchStart(id) {
  hideMenus();
  state.ready = false;
  onRamp = id === MEGA_RAMP && !state.arcade && !trail.index;
  pause(true);
  state.world.launchScenario(id);
}

function makeStartingCards() {
  const scenarios = state.world.scenarios.filter(s => !s.spawnAlways && s.name);
  scenarios.sort((a, b) => (a.id !== MEGA_RAMP) - (b.id !== MEGA_RAMP));
  for (const scenario of scenarios) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'trail-card';
    const [icon, title, hint] = startingPlaces[scenario.id] ?? ['📍', scenario.name, 'Explore a new spot.'];
    const badge = document.createElement('span');
    badge.className = 'trail-icon';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = icon;
    const label = document.createElement('strong');
    label.textContent = title;
    const detail = document.createElement('small');
    detail.textContent = hint;
    b.append(badge, label, detail);
    b.onclick = () => launchStart(scenario.id);
    $('trail-scenarios').append(b);
  }
}

async function loaded() {
  if (!state.responded) {
    state.responded = true;
    state.arcade = !(await quiz.ready());
    if (!state.arcade) addLights();
    makeStartingCards();
    // Reuse the built-in Mega Ramp driver scenario so the game opens in the seat.
    launchStart(MEGA_RAMP);
    return;
  }
  setBuddy();
  flightHint = undefined;
  $('trail-boarding').hidden = true;
  driving = player()?.controlledObject;
  paintControls(driving);
  if (returningToTrail) {
    returningToTrail = false;
    const start = trail.resumePosition;
    const target = trail.guide;
    player()?.setPosition(...start);
    if (target) state.world.cameraOperator.theta = Math.atan2(start[0] - target[0], start[2] - target[2]) * 180 / Math.PI;
    state.world.cameraOperator.phi = 18;
    state.world.cameraOperator.targetRadius = 4.4;
  }
  state.world.setTimeScale(1);
  state.ready = true;
  $('trail-help').hidden = false;
  paintMode();
  if (state.world.lastScenarioID === MEGA_RAMP) notice(touchDevice ? 'Hold Gas or push the Move stick up to drive down the Mega Ramp!' : 'Hold W or push the left stick forward to drive down the Mega Ramp!', 6);
  pause(document.hidden);
  if (roomFromLink && !openedInvite) {
    openedInvite = true;
    openMenu();
    panel('trail-friend-panel');
    friend.join(roomFromLink);
  }
}

try {
  if (!supported) throw new Error('Sketchbook bundle missing');
  state.world = new runtime.World('./build/assets/world-lite.glb', {
    performance: performanceTier,
    onReady() { void loaded().catch(() => error('Sketchbook Mega Ramp could not start. Reload once online, then try again.')); },
    onError() { error('Sketchbook Mega Ramp could not load its world. Save it again while online, then try again.'); }
  });
  const view = canvas();
  view.tabIndex = 0;
  view.setAttribute('aria-label', 'Sketchbook Mega Ramp playground');
  touch = attachTouchControls({
    aim: true,
    hints: { move: 'Move', aim: 'Look' },
    ignore: '#trail-hud, #sprouts-quiz, #loading-screen, [data-friend-panel]',
    onFirstTouch: showTouchControls
  });
  if (isTouchDevice()) showTouchControls();
  if (!quiz.live) {
    document.documentElement.setAttribute('data-pad-standalone', '');
    void import('../../lib/pad.js?v=trail8');
  }
  pause(true);
  state.world.registerUpdatable({ updateOrder: 99, update: tick });
  requestAnimationFrame(drawFriend);
  setInterval(sendFriend, 100);
  view.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    error('The graphics stopped. Reload the game to try again.');
  });
} catch (cause) {
  console.error(cause);
  error('Sketchbook Mega Ramp needs WebGL and its local game files. Reload once online, then try again.');
}
