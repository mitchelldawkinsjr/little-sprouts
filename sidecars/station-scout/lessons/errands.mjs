// Sakura town helper: the people of Sakuragaoka need things, and the garden buddy runs their errands.
//
// Each errand: someone in town asks for something (the café worker wants flowers, the station
// master wants sweets). Walk to the real shop on the shopping street, answer this learner's
// Little Sprouts question there to buy it, then carry it to the person, wherever they are in town.
// Errands go out across the whole town: the platform, the crossing, the plaza, the far end of the
// street. Three cats live in town too; finding one brings a bonus question.
//
// Questions come from the learner's list through lib/sidecar-quiz.mjs, and stars bank as they go.
// After five errands the round ends and Little Sprouts shows the stars. On its own page there are
// no questions, and the errands keep coming.
import { node, button, hold, speak } from './lesson.mjs';
import { makeQuiz } from '../../../lib/sidecar-quiz.mjs?v=quiz1';

const REACH = 2.2;
const ERRANDS_PER_ROUND = 5;
const ARROW_AFTER = 15;
// Each shop's ring is inside the shop, a few steps past its door. Lot-local coordinates from the
// shop builders (src/world/shopsA, shopsB): +z faces the street, the front wall is at ZF, and the
// open part of the doorway is centred at doorX (half-open sliding doors: the open half). `door` is just outside that gap; the arrow leads there first.
const SHOPS = {
  flower: { name: 'Flower shop', icon: '💐', lot: 'W2', doorX: 0, zf: -2.5, depth: 3.0 },
  books: { name: 'Bookstore', icon: '📚', lot: 'W4', doorX: -0.7, zf: -2.3, depth: 3.0 },
  bikes: { name: 'Bike shop', icon: '🚲', lot: 'W6', doorX: -0.8, zf: -2.5, depth: 2.6 },
  cafe: { name: 'Café', icon: '☕', lot: 'E1', doorX: -3.07, zf: -3.8, depth: 2.4 },
  sweets: { name: 'Sweet shop', icon: '🍡', lot: 'E2', doorX: 0.8, zf: -1.2, depth: 2.2 },
  general: { name: 'General store', icon: '🎁', lot: 'E3', doorX: 0.1, zf: -2.0, depth: 2.6 },
  ramen: { name: 'Ramen shop', icon: '🍜', lot: 'E5', doorX: -0.3, zf: -1.5, depth: 2.6 },
};

/** The people who ask, the shops that sell, and what to fetch. `place(lotId, lx, lz)` turns a shop's
 *  lot-local spot into the town's {x, z} (layout.js lotToWorld); tests pass a stand-in. */
export function errandList(place = (lot, lx, lz) => ({ x: lx, z: lz + (parseInt(lot.slice(1), 10) * 9) })) {
  const shops = Object.fromEntries(Object.entries(SHOPS).map(([id, s]) => [id, {
    name: s.name,
    icon: s.icon,
    ...place(s.lot, s.doorX, s.zf - s.depth),
    door: place(s.lot, s.doorX, s.zf + 1.3),
  }]));
  return [
    { who: 'Hana at the café', where: 'outside the café', here: 'Hana is outside the café.', x: 4.9, z: 5.9, item: 'flowers', icon: '💐', shop: shops.flower, ask: 'Hana wants flowers for the café tables.' },
    { who: 'Ken the station master', where: 'on Platform 1', here: 'Ken is on Platform 1, through the station.', x: 10, z: -37.2, item: 'sweets', icon: '🍡', shop: shops.sweets, ask: 'Ken the station master wants sweets for his break.' },
    { who: 'Mei at the crossing', where: 'at the railway crossing', here: 'Mei is waiting at the railway crossing.', x: -10.95, z: -33.2, item: 'a bike bell', icon: '🔔', shop: shops.bikes, ask: 'Mei is waiting at the crossing. Her bike needs a new bell.' },
    { who: 'the students', where: 'in the station plaza', here: 'The students are in the station plaza.', x: -1, z: -10.4, item: 'a story book', icon: '📚', shop: shops.books, ask: 'The students in the plaza want a story book.' },
    { who: 'Taro', where: 'by the drink machines', here: 'Taro is by the drink machines at the station.', x: 14.65, z: -22.6, item: 'a toy', icon: '🎁', shop: shops.general, ask: 'Taro by the drink machines wants a new toy.' },
    { who: 'Yui under the tree', where: 'under the big tree', here: 'Yui is under the big tree in the plaza.', x: -5.4, z: -10.6, item: 'a bowl of ramen', icon: '🍜', shop: shops.ramen, ask: 'Yui under the big tree is hungry. She wants ramen.' },
    { who: 'the ticket helper', where: 'at the station gate', here: 'The ticket helper is at the station gate.', x: 6, z: -27.5, item: 'a hot drink', icon: '☕', shop: shops.cafe, ask: 'The ticket helper at the station gate wants a hot drink.' },
  ];
}

export const CATS = [
  { name: 'calico cat', where: 'on the plaza bench', x: -1.25, z: -15.5 },
  { name: 'white cat', where: 'on a garden wall', x: -4.95, z: 29.6 },
  { name: 'black cat', where: 'by the bench near the crossing', x: -16.0, z: -27.6 },
];

/** The next errand: one not done yet, whose shop is a good walk from here. */
export function pickErrand(list, done, at, rand = Math.random) {
  const left = list.filter(e => !done.has(e.who));
  const pool = left.length ? left : list;
  const far = pool.filter(e => Math.hypot(e.shop.x - at.x, e.shop.z - at.z) > 15);
  const from = far.length ? far : pool;
  return from[Math.floor(rand() * from.length)];
}

const CSS = `
.th-goal{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:9984;display:flex;align-items:center;gap:12px;max-width:min(620px,calc(100vw - 24px));padding:10px 18px 10px 12px;border-radius:26px;background:#fffdf4f2;color:#1f3a36;box-shadow:0 6px 22px #10302a40;font:800 clamp(16px,2.3vw,21px)/1.25 system-ui,sans-serif;pointer-events:none}
.th-goal small{display:block;font-size:.74em;font-weight:700;color:#4b6658}
.th-goal.good{background:#e2f5d6}
.th-arrow{flex:none;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:#1f3a36;color:#fff;font-size:28px}
.th-arrow[hidden],.th-goal[hidden]{display:none}
.th-bag{position:fixed;left:max(14px,env(safe-area-inset-left));top:calc(14px + env(safe-area-inset-top,0px));z-index:9984;display:flex;flex-direction:column;gap:6px;pointer-events:auto;font:800 15px/1.2 system-ui,sans-serif}
.th-chip{display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:#fffdf4ee;color:#1f3a36;box-shadow:0 3px 10px #10302a33}
.th-chip b{font-size:20px}
.th-bag button{min-height:42px;padding:6px 12px;border:0;border-radius:14px;background:#fffdf4ee;color:#1f3a36;font:800 15px system-ui,sans-serif;box-shadow:0 3px 10px #10302a33;cursor:pointer;text-align:left}
.th-mark{position:fixed;transform:translate(-50%,-100%);z-index:9980;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:2px;font:800 14px/1.1 system-ui,sans-serif;color:#fff;text-shadow:0 1px 3px #0009}
.th-mark b{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:#fffdf4;border:4px solid var(--c);font-size:28px;box-shadow:0 4px 14px #0005;text-shadow:none}
.th-mark span{padding:3px 8px;border-radius:999px;background:#173d36d9}
.th-mark.edge b{width:40px;height:40px;font-size:21px}
.th-mark.edge span{display:none}
.th-mark[hidden]{display:none}
.th-pop{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%) scale(.6);z-index:9990;padding:16px 26px;border-radius:24px;background:#fffdf4;color:#1f3a36;font:900 clamp(22px,4vw,34px)/1.2 system-ui,sans-serif;box-shadow:0 12px 40px #0005;opacity:0;pointer-events:none;transition:transform .25s,opacity .25s;text-align:center}
.th-pop.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
`;

export function townErrands({ THREE, scene, camera, player, ground, place }) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);
  const quiz = makeQuiz();
  const list = errandList(place);
  const say = text => { if (quiz.sound) speak(text); };

  let errand = null, carrying = false, inDoor = false, done = new Set(), delivered = 0, stepT = 0, helped = false, busy = false, over = false;
  const catsFound = new Set();
  let lastT = performance.now();

  // ---- one beacon (a glowing ring and a tall light) that moves to wherever the errand points
  const beacon = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(REACH - 0.45, REACH, 40), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  const light = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 8, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0.35, depthWrite: false }));
  light.position.y = 4;
  beacon.add(ring, light);
  beacon.visible = false;
  scene.add(beacon);

  // ---- on screen: the goal banner, the backpack, the beacon's label, and a cheer
  const goal = node('div', undefined, 'th-goal');
  const arrow = node('div', '↑', 'th-arrow');
  const goalText = node('div');
  goal.append(arrow, goalText);
  goal.hidden = true;
  const bag = node('div', undefined, 'th-bag');
  const bagChip = node('div', undefined, 'th-chip');
  const doneChip = node('div', undefined, 'th-chip');
  const catChip = node('div', undefined, 'th-chip');
  const hear = button('🔊 Hear it', () => say(goalText.dataset.line || ''));
  const way = button('🧭 Show me the way', () => { helped = true; });
  bag.append(bagChip, doneChip, catChip, hear, way);
  bag.hidden = true;
  const mark = node('div', undefined, 'th-mark');
  mark.append(node('b', ''), node('span', ''));
  mark.hidden = true;
  const pop = node('div', '', 'th-pop');
  document.body.append(goal, bag, mark, pop);
  const controls = node('div', '', 'ls-touch');
  controls.hidden = true;
  document.body.append(controls);
  for (const [name, key] of [['←', 'KeyA'], ['↑', 'KeyW'], ['↓', 'KeyS'], ['→', 'KeyD']]) controls.append(hold(button(name, () => {}), () => player.keys.add(key), () => player.keys.delete(key)));

  const v = new THREE.Vector3();
  let popTimer = 0;
  function cheer(text) {
    pop.textContent = text;
    pop.classList.add('on');
    clearTimeout(popTimer);
    popTimer = setTimeout(() => pop.classList.remove('on'), 1800);
  }
  function chips() {
    bagChip.replaceChildren(node('b', carrying ? errand.icon : '🎒'), document.createTextNode(carrying ? errand.item : 'Backpack'));
    doneChip.replaceChildren(node('b', '⭐'), document.createTextNode(quiz.live ? `${delivered} of ${ERRANDS_PER_ROUND} errands` : `${delivered} errands`));
    catChip.replaceChildren(node('b', '🐱'), document.createTextNode(`${catsFound.size} of ${CATS.length} cats`));
  }
  function target() {
    if (!errand) return null;
    return carrying ? { x: errand.x, z: errand.z, icon: errand.icon, label: errand.who } : { x: errand.shop.x, z: errand.shop.z, icon: errand.shop.icon, label: errand.shop.name, door: errand.shop.door };
  }
  function show(line, sub) {
    goalText.dataset.line = line;
    goalText.replaceChildren(document.createTextNode(line), node('small', sub || ''));
    goal.classList.remove('good');
    stepT = 0;
    helped = false;
    const t = target();
    if (t) {
      // Inside a shop the floor is a little above the street: stand the ring on the street level at its door.
      const base = t.door ? ground(t.door.x, t.door.z) + 0.15 : ground(t.x, t.z);
      beacon.position.set(t.x, base, t.z);
      mark.querySelector('b').textContent = t.icon;
      mark.querySelector('span').textContent = t.label;
    }
    quiz.progress(line);
  }
  function nextErrand() {
    errand = pickErrand(list, done, player.pos);
    carrying = false;
    inDoor = false;
    show(`${errand.ask}`, `Go inside the ${errand.shop.name} ${errand.shop.icon}`);
    say(`${errand.ask} Go inside the ${errand.shop.name}.`);
    chips();
  }

  async function atShop() {
    busy = true;
    try { document.exitPointerLock?.(); } catch { /* not locked */ }
    player.keys.clear();
    await quiz.ask({ title: `${errand.shop.icon} ${errand.shop.name}`, note: `Answer right to get ${errand.item}.` });
    busy = false;
    carrying = true;
    cheer(`${errand.icon} You got ${errand.item}!`);
    show(`Bring ${errand.item} to ${errand.who}`, errand.here);
    say(`You got ${errand.item}! Bring it to ${errand.who}. ${errand.here}`);
    chips();
  }
  function atPerson() {
    done.add(errand.who);
    delivered++;
    goal.classList.add('good');
    cheer(`⭐ Thank you! ⭐`);
    say(`Thank you! You helped ${errand.who}.`);
    errand = null;
    carrying = false;
    chips();
    if (quiz.live && delivered >= ERRANDS_PER_ROUND) {
      over = true;
      goalText.replaceChildren(document.createTextNode('You helped the whole town!'));
      beacon.visible = false;
      mark.hidden = true;
      arrow.hidden = true;
      quiz.progress('You helped the whole town!');
      setTimeout(() => quiz.finish('round'), 2600);
      return;
    }
    if (done.size >= list.length) done = new Set();
    setTimeout(nextErrand, 1900);
  }
  async function foundCat(cat) {
    catsFound.add(cat.name);
    chips();
    cheer(`🐱 You found the ${cat.name}!`);
    say(`You found the ${cat.name}!`);
    if (!quiz.live || quiz.cleared) return;
    busy = true;
    try { document.exitPointerLock?.(); } catch { /* not locked */ }
    player.keys.clear();
    await new Promise(r => setTimeout(r, 900));
    await quiz.ask({ title: `🐱 Bonus: the ${cat.name}`, note: 'A bonus question for finding a cat!' });
    busy = false;
  }

  let begun = false;
  function begin() {
    if (begun) return;
    begun = true;
    goal.hidden = false;
    bag.hidden = false;
    beacon.visible = true;
    nextErrand();
  }

  return {
    /** Where the errand points now (for tests). */
    target,
    /** Every errand (for tests). */
    list,
    update() {
      const t = performance.now();
      const dt = Math.min(0.1, (t - lastT) / 1000);
      lastT = t;
      if (!document.body.classList.contains('playing')) return;
      begin();
      // While a question is up, the buddy stands still.
      player.enabled = !busy;
      controls.hidden = busy || !matchMedia('(pointer:coarse)').matches;
      const aim = target();
      if (!aim || over) return;
      ringMat.opacity = 0.45 + 0.25 * Math.sin(t / 260);
      // The label over the beacon, or a badge at the screen edge when it is behind or off to the side.
      v.set(aim.x, ground(aim.x, aim.z) + 3.4, aim.z).applyMatrix4(camera.matrixWorldInverse);
      const behind = v.z > 0;
      v.set(aim.x, ground(aim.x, aim.z) + 3.4, aim.z).project(camera);
      let x = (v.x + 1) / 2, y = (1 - v.y) / 2;
      const off = behind || x < 0.03 || x > 0.97 || y < 0.1 || y > 0.95;
      if (behind) { x = 1 - x; y = 0.45; }
      mark.classList.toggle('edge', off);
      mark.style.left = Math.max(4, Math.min(96, x * 100)) + '%';
      mark.style.top = Math.max(30, Math.min(94, y * 100)) + '%';
      mark.style.setProperty('--c', carrying ? '#5fb36b' : '#f2b84b');
      mark.hidden = busy;
      if (busy) return;
      stepT += dt;
      // Little explorers always get the arrow; others after a while, or with Show me the way.
      const guide = quiz.level <= 1 || helped || stepT > ARROW_AFTER;
      arrow.hidden = !guide;
      const meters = Math.round(Math.hypot(aim.x - player.pos.x, aim.z - player.pos.z));
      // The arrow leads to the shop's door first, then to the ring inside.
      if (aim.door && !inDoor && Math.hypot(aim.door.x - player.pos.x, aim.door.z - player.pos.z) < 1.8) inDoor = true;
      const way = aim.door && !inDoor ? aim.door : aim;
      if (guide) {
        v.set(way.x, player.pos.y, way.z).applyMatrix4(camera.matrixWorldInverse);
        arrow.style.transform = `rotate(${Math.atan2(v.x, -v.z)}rad)`;
      }
      if (meters < REACH + 0.2) {
        if (!carrying) atShop();
        else atPerson();
        return;
      }
      for (const cat of CATS) {
        if (!catsFound.has(cat.name) && Math.hypot(cat.x - player.pos.x, cat.z - player.pos.z) < 2.6) { foundCat(cat); break; }
      }
    }
  };
}
