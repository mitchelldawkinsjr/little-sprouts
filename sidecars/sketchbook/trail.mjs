import { makeQuiz } from '../../lib/sidecar-quiz.mjs';
import { attachTouchControls } from '../../lib/touch-controls.mjs?v=touch1';
import { buddyKind, makeBuddy } from '../../lib/buddy3d.mjs';
import { isPerformanceTier, resolveAutoQuality } from '../../lib/device-tier.mjs';
import { distanceTo, HOME, makeTrail, STOPS } from './checkpoints.mjs';

const $ = id => document.getElementById(id);
const quiz = makeQuiz();
const trail = makeTrail();
const runtime = globalThis.Sketchbook;
const supported = !!runtime?.World;
const performanceTier = isPerformanceTier(resolveAutoQuality());
const state = { world: null, buddy: null, ready: false, arcade: !quiz.live, responded: false, finished: false };
let fromHost, paused, driving, timer = 0, motion = 0, touch, heldCodes = new Set();
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
  $('trail-actions').hidden = false;
  $('trail-starts').hidden = !state.arcade;
  $('trail-return').hidden = state.arcade || trail.done;
  $('trail-finish').hidden = state.arcade || trail.index === 0;
  $('trail-guide').hidden = state.arcade || trail.done;
}

function pause(on) {
  if (paused === on) return;
  paused = on;
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
  touch?.setVisible(!on);
  if (on) touch?.reset();
  if (!on) canvas()?.focus({ preventScroll: true });
}

function sendKey(code, down) {
  document.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true, cancelable: true }));
}
function clearTouch() {
  for (const code of heldCodes) sendKey(code, false);
  heldCodes.clear();
}

function touchStep(dt) {
  if (!touch || paused) return;
  touch.update();
  const x = touch.move.x, y = touch.move.y;
  const codes = new Set();
  if (x < -0.27) codes.add('KeyA');
  if (x > 0.27) codes.add('KeyD');
  if (y < -0.27) codes.add('KeyW');
  if (y > 0.27) codes.add('KeyS');
  for (const [id, code] of [['jump', 'Space'], ['enter', 'KeyF'], ['boost', 'ShiftLeft']]) {
    if (touch.down(id)) codes.add(code);
  }
  for (const code of heldCodes) if (!codes.has(code)) sendKey(code, false);
  for (const code of codes) if (!heldCodes.has(code)) sendKey(code, true);
  heldCodes = codes;
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
    if (!document.hidden && !state.finished) pause(false);
  }
}

function resetTrailPosition() {
  const world = state.world;
  if (!state.ready || !world || trail.pending) return;
  pause(true);
  // Relaunch to recover the player and vehicles even if the player was in a seat or flying.
  world.launchScenario('default');
}
$('trail-return').onclick = resetTrailPosition;

$('trail-finish').onclick = () => {
  if (state.arcade || state.finished || trail.pending || trail.index === 0) return;
  state.finished = true;
  pause(true);
  quiz.finish('trail');
};

function chooseStart(open) {
  if (!state.ready || !state.arcade) return;
  $('trail-picker').hidden = !open;
  pause(open);
  if (open) $('trail-scenarios').querySelector('button')?.focus();
}
$('trail-starts').onclick = () => chooseStart(true);
$('trail-close').onclick = () => chooseStart(false);
addEventListener('keydown', event => {
  if (event.code === 'Escape' && !$('trail-picker').hidden) chooseStart(false);
});
addEventListener('blur', () => {
  clearTouch();
  player()?.resetControls();
  player()?.controlledObject?.resetControls?.();
});
addEventListener('visibilitychange', () => {
  if (document.hidden) pause(true);
  else if (state.ready && !trail.pending && !state.finished && $('trail-picker').hidden) pause(false);
});

function tick(dt, wallDt) {
  if (!state.ready) return;
  const character = player(), world = state.world;
  touchStep(Math.min(0.05, wallDt));
  setBuddy();
  motion += reduced ? 0 : dt;
  if (timer > 0 && (timer -= dt) <= 0) $('trail-notice').hidden = true;
  if (character && state.buddy) {
    const inVehicle = !!character.controlledObject, vel = character.characterCapsule.body.velocity;
    state.buddy.rig.animate(dt, inVehicle ? 0 : Math.min(1, Math.hypot(vel.x, vel.z) / 4), motion);
    if (driving !== inVehicle) {
      driving = inVehicle;
      $('trail-help').textContent = driving
        ? 'WASD / stick to drive or steer · F / X to exit · Shift / RB to power aircraft'
        : 'WASD / stick to walk · drag / right stick to look · Space / A to jump · F / X for vehicles';
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
        $('trail-picker').hidden = true;
        pause(true);
        state.world.launchScenario(scenario.id);
      };
      $('trail-scenarios').append(b);
    }
  }
  setBuddy();
  driving = undefined;
  if (!state.arcade) {
    player()?.setPosition(...HOME);
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
    buttons: [{ id: 'jump', label: '⬆️', slot: 0, radius: 25 },
      { id: 'enter', label: '🚙', slot: 1, radius: 25 }, { id: 'boost', label: '⚡', slot: 2, radius: 25 }],
    hints: { move: 'Move', aim: 'Look' }, ignore: '#trail-picker, #sprouts-quiz, #loading-screen'
  });
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
