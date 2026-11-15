import * as THREE from '../../vendor/three/build/three.module.js?v=r187';
import { buddyKind, makeBuddyBall } from '../../lib/buddy3d.mjs';
import { makeQuiz } from '../../lib/sidecar-quiz.mjs';
import { chargeShield, hop, LANE_WIDTH, makeRun, ROW_GAP, rowLanes, steer, step, WORLD_RADIUS } from './logic.mjs';

const $ = id => document.getElementById(id);
const quiz = makeQuiz();
const menu = $('menu');
const play = $('play');
const leave = $('leave');
const hud = $('hud');
const controls = $('controls');
const notice = $('notice');
const radius = WORLD_RADIUS;
const ballRadius = 0.64;
const rollAxis = new THREE.Vector3(-1, 0, 0);
const modes = { intro: 'intro', play: 'play', paused: 'paused', question: 'question', end: 'end' };
let mode = modes.intro;
let run = makeRun();
let learning = false;
let buddy;
let buddyFromHost;
let noteTime = 0;
let finishTimer;
let dirty = true;

addEventListener('message', ({ source, data }) => {
  if (source === window.parent && data?.source === 'sprouts-sidecar' && data.type === 'ask') buddyFromHost = data.buddy;
});

function coursePose(object, x, ahead, lift = 0) {
  const angle = ahead / radius;
  object.position.set(x, Math.cos(angle) * (radius + lift) - radius, -Math.sin(angle) * (radius + lift));
  object.rotation.x = -angle;
}

function pine(trunkGeo, needles, materials) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(trunkGeo, materials.bark);
  trunk.position.y = .45;
  tree.add(trunk);
  for (let i = 0; i < 3; i++) {
    const layer = new THREE.Mesh(needles, i === 1 ? materials.mint : materials.pine);
    layer.scale.setScalar(1.45 - i * .27);
    layer.position.y = .83 + i * .49;
    layer.rotation.y = i * .38;
    tree.add(layer);
  }
  return tree;
}

function createView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd8efea);
  scene.fog = new THREE.FogExp2(0xd8efea, .053);
  const camera = new THREE.PerspectiveCamera(49, 1, .1, 95);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.domElement.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    clearTimeout(finishTimer);
    showMenu(modes.end, 'The screen lost its 3D connection.', 'Choose All games or reload the page.');
  });
  $('world').append(renderer.domElement);
  function resize() {
    const { clientWidth: w, clientHeight: h } = document.documentElement;
    const portrait = w / Math.max(1, h) < .85;
    camera.position.set(0, portrait ? 5.35 : 4.2, portrait ? 10.1 : 7.45);
    camera.lookAt(0, .4, -3.2);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    renderer.setSize(w, h);
    renderer.render(scene, camera);
  }
  addEventListener('resize', resize);
  scene.add(new THREE.HemisphereLight(0xfff3d0, 0x43644c, 2.15));
  const sun = new THREE.DirectionalLight(0xfff1cb, 2.0);
  sun.position.set(-4, 7, -4);
  scene.add(sun);

  const matte = color => new THREE.MeshStandardMaterial({ color, flatShading: true });
  const green = matte(0x83ad70);
  const path = matte(0xe6bb8b);
  const dashes = matte(0xffe5b2);
  const materials = { bark: matte(0x855339), pine: matte(0x286746), mint: matte(0x489479) };
  // The full barrel stays covered as the world turns. Three lanes keep their width as the
  // trail curves away, and the forest rides the same rolling surface as the obstacles.
  const world = new THREE.Group();
  world.position.y = -radius;
  scene.add(world);
  function barrel(width, r, material) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, width, 136, 1), material);
    mesh.rotation.z = Math.PI / 2;
    world.add(mesh);
  }
  barrel(29, radius, green);
  barrel(5.65, radius + .025, path);
  const trunkGeo = new THREE.CylinderGeometry(.10, .16, .95, 5);
  const needles = new THREE.ConeGeometry(.64, 1.06, 5);
  const daisyGeo = new THREE.IcosahedronGeometry(.17, 0);
  const petals = [matte(0xffd47e), matte(0xffe8b9), matte(0xf2a49e)];
  const stripe = new THREE.BoxGeometry(.045, .025, .55);
  function anchor(object, x, angle, lift = 0) {
    object.position.set(x, (radius + lift) * Math.cos(angle), -(radius + lift) * Math.sin(angle));
    object.rotation.x = -angle;
    world.add(object);
  }
  for (let i = 0; i < 120; i++) {
    const angle = i / 120 * Math.PI * 2;
    for (const side of [-1, 1]) {
      const dash = new THREE.Mesh(stripe, dashes);
      anchor(dash, side * LANE_WIDTH / 2, angle, .032);
      const flower = new THREE.Mesh(daisyGeo, petals[i % petals.length]);
      flower.scale.y = .48;
      anchor(flower, side * (3.1 + (i % 5) * .13), angle + side * .01, .055);
      if (i % 2 === 0) {
        const tree = pine(trunkGeo, needles, materials);
        tree.scale.setScalar(.86 + ((i * 17) % 11) * .067);
        anchor(tree, side * (3.85 + ((i * 13) % 7) * .52), angle + side * .024);
      }
    }
  }

  const rockGeo = new THREE.DodecahedronGeometry(.55, 0);
  const rockMat = matte(0x746480);
  const moss = matte(0x578765);
  const rocks = Array.from({ length: 8 }, () => {
    const group = new THREE.Group();
    const stone = new THREE.Mesh(rockGeo, rockMat);
    stone.scale.set(1.18, .77, .82);
    stone.position.y = .31;
    stone.rotation.set(.11, .4, -.18);
    const patch = new THREE.Mesh(rockGeo, moss);
    patch.scale.set(.57, .19, .52);
    patch.position.set(-.15, .64, -.06);
    group.add(stone, patch);
    scene.add(group);
    return group;
  });
  const gate = new THREE.Group();
  const glow = new THREE.MeshBasicMaterial({ color: 0xffe17b });
  const post = new THREE.BoxGeometry(.18, 3.3, .18);
  for (const x of [-2.74, 2.74]) {
    const pole = new THREE.Mesh(post, materials.bark);
    pole.position.set(x, 1.65, 0);
    const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(.4), glow);
    lantern.position.set(x, 3.18, 0);
    gate.add(pole, lantern);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(5.65, .14, .15), glow);
  beam.position.y = 2.85;
  gate.add(beam);
  scene.add(gate);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.7, 24), new THREE.MeshBasicMaterial({
    color: 0x3a4029, transparent: true, opacity: .25, depthWrite: false
  }));
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);
  const aura = new THREE.Mesh(new THREE.TorusGeometry(.82, .055, 8, 32), glow);
  aura.rotation.x = -Math.PI / 2.4;
  scene.add(aura);
  resize();
  return {
    setBuddy(kind) {
      if (buddy?.kind === kind) return;
      if (buddy) { scene.remove(buddy.group); buddy.dispose(); }
      buddy = makeBuddyBall(THREE, kind, ballRadius, { material: matte });
      scene.add(buddy.group);
    },
    draw(dt, distanceDelta) {
      world.rotation.x = (run.distance / radius) % (2 * Math.PI);
      let used = 0;
      const first = Math.max(1, Math.floor((run.distance - 1) / ROW_GAP));
      for (let row = first; row * ROW_GAP <= run.distance + 39; row++) {
        const ahead = row * ROW_GAP - run.distance;
        if (ahead < -1.4) continue;
        for (const lane of rowLanes(row)) {
          const rock = rocks[used++];
          rock.visible = true;
          coursePose(rock, lane * LANE_WIDTH, ahead);
        }
      }
      for (let i = used; i < rocks.length; i++) rocks[i].visible = false;
      gate.visible = learning && run.nextGate - run.distance < 39;
      if (gate.visible) coursePose(gate, 0, run.nextGate - run.distance);
      buddy.group.position.set(run.x, ballRadius + run.lift + .025, 0);
      buddy.roll(rollAxis, distanceDelta / ballRadius);
      buddy.animate(dt, (run.lane * LANE_WIDTH - run.x) * 3, distanceDelta ? -2.6 : 0, run.distance * .85);
      // The camera follows from behind. Tip the clear shell, not the buddy, as it rolls.
      shadow.position.set(run.x, .042, 0);
      shadow.scale.setScalar(1 - run.lift * .16);
      aura.visible = run.shield;
      aura.position.copy(buddy.group.position);
      renderer.render(scene, camera);
    }
  };
}

function flash(text) {
  notice.firstElementChild.textContent = text;
  notice.hidden = false;
  noteTime = 1.75;
}

function paintHud() {
  const metres = Math.floor(run.distance / 2) * 2;
  const text = `${metres} m`;
  if ($('distance').textContent !== text) $('distance').textContent = text;
  const hearts = `${run.hearts} ${run.hearts === 1 ? 'heart' : 'hearts'}`;
  if ($('hearts').textContent !== hearts) $('hearts').textContent = hearts;
  $('shield').hidden = !run.shield;
}

function setMode(next) {
  mode = next;
  dirty = true;
  const running = next === modes.play;
  menu.hidden = running || next === modes.question;
  hud.hidden = !running && next !== modes.question;
  $('pause').disabled = !running;
  controls.hidden = !running;
  if (!running) notice.hidden = true;
}

function showMenu(next, title, hint, action) {
  setMode(next);
  $('title').textContent = title;
  $('hint').textContent = hint;
  play.hidden = !action;
  play.textContent = action || '';
  leave.hidden = !quiz.live;
  (action ? play : leave).focus();
}

function start() {
  if (mode !== modes.paused) {
    run = makeRun();
    view.setBuddy(buddyKind(buddyFromHost));
    notice.hidden = true;
    noteTime = 0;
  }
  setMode(modes.play);
}
function pause() {
  if (mode === modes.play) showMenu(modes.paused, 'Taking a breather?', 'Your run is paused.', 'Resume');
  else if (mode === modes.paused) start();
}

async function checkpoint() {
  setMode(modes.question);
  await quiz.ask({ title: 'Shield gate', note: 'Get it right to block the next bump.' });
  if (mode !== modes.question) return;
  chargeShield(run);
  setMode(modes.play);
  flash('Shield charged!');
}

function end() {
  const result = `You rolled ${Math.floor(run.distance)} m through the pines.`;
  showMenu(modes.end, 'You reached the end of your run!', result, learning ? '' : 'Roll again');
  if (learning) finishTimer = setTimeout(() => quiz.finish(result), 900);
}

let view;
try { view = createView(); }
catch {
  showMenu(modes.end, '3D isn’t available', 'Pebble roll needs a browser with WebGL 2.');
}

leave.onclick = () => quiz.quit();
if (view) {
  $('pause').onclick = pause;
  play.onclick = start;
  $('left').onclick = () => steer(run, -1);
  $('right').onclick = () => steer(run, 1);
  $('jump').onclick = () => hop(run);
  document.addEventListener('keydown', e => {
    if (e.repeat || (e.target?.closest?.('button') && e.code === 'Space')) return;
    if ((e.code === 'KeyP' || e.code === 'Escape') && (mode === modes.play || mode === modes.paused)) {
      e.preventDefault();
      pause();
      return;
    }
    if (mode !== modes.play) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') steer(run, -1);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') steer(run, 1);
    else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') hop(run);
    else return;
    e.preventDefault();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === modes.play) pause(); });
  view.setBuddy(buddyKind());
  quiz.ready().then(ready => {
    if (mode !== modes.intro) return;
    learning = quiz.live && ready;
    view.setBuddy(buddyKind(buddyFromHost));
    showMenu(modes.intro, 'Pebble roll', learning
      ? 'Switch lanes, jump rocks, and charge a shield at each question gate.'
      : 'Switch lanes or jump over rocks. How far can you roll?', 'Roll!');
  });
  let previous = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (previous || now)) / 1000);
    previous = now;
    const from = run.distance;
    if (mode === modes.play) {
      const result = step(run, dt, { learning, level: quiz.level || 1 });
      if (result === 'gate') void checkpoint();
      if (result === 'bump') flash('Rock bump! Keep rolling.');
      if (result === 'shield') flash('Your shield blocked that bump!');
      if (result === 'end') end();
      if (noteTime > 0 && (noteTime -= dt) <= 0) notice.hidden = true;
      paintHud();
    }
    if (dirty || run.distance !== from) {
      view.draw(mode === modes.play ? dt : 0, run.distance - from);
      dirty = false;
    }
  }
  requestAnimationFrame(frame);
}
