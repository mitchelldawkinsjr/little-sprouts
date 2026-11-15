import { makeQuiz } from '../../lib/sidecar-quiz.mjs';
import { attachTouchControls, isTouchDevice } from '../../lib/touch-controls.mjs?v=touch1';
import { buddyKind, makeBuddy } from '../../lib/buddy3d.mjs';
import { isPerformanceTier, resolveAutoQuality } from '../../lib/device-tier.mjs';
import { distanceTo, makeTrail, STOPS } from './checkpoints.mjs?v=trail3';

const $ = id => document.getElementById(id);
const quiz = makeQuiz();
const trail = makeTrail();
const runtime = globalThis.Sketchbook;
const supported = !!runtime?.World;
const performanceTier = isPerformanceTier(resolveAutoQuality());
const state = { world: null, buddy: null, ready: false, arcade: !quiz.live, responded: false, finished: false };
let fromHost, paused, driving, timer = 0, motion = 0, touch, touchDevice = false;
const touchCodes = new Map();
const movementCodes = new Set();
const touchPanel = $('trail-touch');
const touchButtons = [...touchPanel.querySelectorAll('button')];
const menuOpen = () => !$('trail-panel').hidden || !$('trail-picker').hidden;
const lights = [];
const canvas = () => state.world?.renderer.domElement;
const player = () => {
  const world = state.world;
  const receiver = world?.inputManager.inputReceiver;
  return world?.characters.includes(receiver) ? receiver
    : world?.characters.includes(world.cameraOperator.characterCaller) ? world.cameraOperator.characterCaller : null;
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

function setBuddy() {
  const character = player(), kind = buddyKind(fromHost);
  if (!character || !runtime) return;
  if (state.buddy?.character === character && state.buddy.rig.kind === kind) return;
  if (state.buddy) {
    state.buddy.rig.group.parent?.remove(state.buddy.rig.group);
    state.buddy.rig.dispose();
  }
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
  // The original skeletal rig still supplies animation timing and vehicle entry poses.
  // Hide its body and render this learner's garden buddy in the same model container.
  for (const child of character.modelContainer.children) child.visible = false;
  const rig = makeBuddy(three, kind, { shadow: false });
  // Sprouts art faces +Z, the same direction as the Sketchbook character.
  rig.group.scale.setScalar(0.65);
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
    : trail.done ? 'All 5 beacons lit! Keep exploring or finish.'
    : `${trail.index} of ${STOPS.length} beacons lit · Follow the arrow`;
  $('trail-menu').hidden = false;
  $('trail-starts').hidden = !state.arcade;
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

function releaseTouchButton(id) {
  const button = touchCodes.get(id);
  if (!button) return;
  touchCodes.delete(id);
  button.removeAttribute('data-held');
  sendKey(button.dataset.control, false);
}

for (const button of touchButtons) {
  button.addEventListener('pointerdown', event => {
    if (paused || button.hasAttribute('data-held') || event.button !== 0) return;
    event.preventDefault();
    try { button.setPointerCapture(event.pointerId); } catch { /* The pointer may already be gone. */ }
    touchCodes.set(event.pointerId, button);
    button.setAttribute('data-held', '');
    sendKey(button.dataset.control, true);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(type, event => releaseTouchButton(event.pointerId));
  }
  // Keyboard and assistive-technology clicks have no pointer to hold/release the action.
  button.addEventListener('click', event => {
    if (paused || event.detail !== 0) return;
    sendKey(button.dataset.control, true);
    sendKey(button.dataset.control, false);
  });
}

function clearTouch() {
  for (const code of movementCodes) sendKey(code, false);
  movementCodes.clear();
  for (const id of touchCodes.keys()) releaseTouchButton(id);
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
    sendKey(code, held);
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
    const ok = await quiz.ask({ title: 'Light a beacon', note: 'Pick the right answer to switch this trail light on.' });
    if (trail.settle(ok && !quiz.cleared && !state.arcade)) {
      paintLights();
      paintMode();
      notice(trail.done ? 'Trail complete! All five beacons are lit.' : `Beacon ${reward} lit! Follow the next arrow.`);
      quiz.progress(`${reward} of ${STOPS.length} beacons lit`);
    }
  } finally {
    if (!document.hidden && !state.finished && !menuOpen()) pause(false);
  }
}

function resetTrailPosition() {
  const world = state.world;
  if (!state.ready || !world || trail.pending) return;
  hideMenus();
  state.ready = false;
  pause(true);
  // Relaunch to recover the player and vehicles even if the player was in a seat or flying.
  world.launchScenario('default');
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
  $('trail-panel').hidden = name !== 'trail-panel';
  $('trail-picker').hidden = name !== 'trail-picker';
  $('trail-menu').setAttribute('aria-expanded', String(!!name));
  if (name) $(name).querySelector('button:not([hidden])')?.focus({ preventScroll: true });
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
$('trail-starts').onclick = () => { if (state.arcade) panel('trail-picker'); };
$('trail-close').onclick = () => panel('trail-panel');
addEventListener('keydown', event => {
  if (event.repeat || !['KeyM', 'Escape'].includes(event.code)) return;
  if (!$('trail-picker').hidden) panel('trail-panel');
  else if (!$('trail-panel').hidden) resumeGame();
  else if (event.code === 'KeyM') openMenu();
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
  if (state.arcade || trail.done || !character || state.finished) return;
  const pos = character.getWorldPosition(v);
  const dx = trail.target[0] - pos.x, dz = trail.target[2] - pos.z;
  world.camera.getWorldDirection(forward);
  const angle = Math.atan2(dx, -dz) - Math.atan2(forward.x, -forward.z);
  $('trail-arrow').style.transform = `rotate(${angle}rad)`;
  $('trail-distance').textContent = `${Math.round(distanceTo(pos, trail.target))} m`;
  if (!quiz.cleared && trail.reach(pos)) void activateBeacon();
}

async function loaded() {
  if (!state.responded) {
    state.responded = true;
    state.arcade = !(await quiz.ready());
    if (!state.arcade) addLights();
    else for (const scenario of state.world.scenarios) {
      if (scenario.spawnAlways || !scenario.name) continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = scenario.name;
      b.onclick = () => {
        hideMenus();
        state.ready = false;
        pause(true);
        state.world.launchScenario(scenario.id);
      };
      $('trail-scenarios').append(b);
    }
  }
  setBuddy();
  driving = player()?.controlledObject;
  paintControls(driving);
  if (!state.arcade) {
    player()?.setPosition(...trail.resumePosition);
    state.world.cameraOperator.theta = 0;
    state.world.cameraOperator.phi = 18;
    state.world.cameraOperator.targetRadius = 4.4;
  }
  state.world.setTimeScale(1);
  state.ready = true;
  $('trail-help').hidden = false;
  paintMode();
  pause(document.hidden);
}

try {
  if (!supported) throw new Error('Sketchbook bundle missing');
  state.world = new runtime.World('./build/assets/world-lite.glb', {
    performance: performanceTier,
    onReady() { void loaded().catch(() => error('Sketchbook Trail could not start. Reload once online, then try again.')); },
    onError() { error('Sketchbook Trail could not load its world. Save it again while online, then try again.'); }
  });
  const view = canvas();
  view.tabIndex = 0;
  view.setAttribute('aria-label', 'Sketchbook Trail playground');
  touch = attachTouchControls({
    aim: true,
    hints: { move: 'Move', aim: 'Look' },
    ignore: '#trail-hud, #sprouts-quiz, #loading-screen',
    onFirstTouch: showTouchControls
  });
  if (isTouchDevice()) showTouchControls();
  if (!quiz.live) {
    document.documentElement.setAttribute('data-pad-standalone', '');
    void import('../../lib/pad.js?v=trail3');
  }
  pause(true);
  state.world.registerUpdatable({ updateOrder: 99, update: tick });
  view.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    error('The graphics stopped. Reload the game to try again.');
  });
} catch (cause) {
  console.error(cause);
  error('Sketchbook Trail needs WebGL and its local game files. Reload once online, then try again.');
}
