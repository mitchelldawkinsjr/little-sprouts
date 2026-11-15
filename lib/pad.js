// One controller works in every game.
// Left stick and d-pad move or steer. Right stick aims the pointer, or looks around in a game that
// has a view to turn (see the `pad` map on a sidecar in lib/sidecar.js).
// Right trigger (and the bottom face button) is gas, shoot, and left click.
// B goes back. Y hears the prompt again. Start goes on.
// Menus inside a game's frame (the mission picker, the friend card, a game's own buttons) are walked
// with the d-pad and pressed with A, the same as the home page.
import { PAD_BUTTONS, actionDown, actionFor, buttonEdges, held, keyName, lookDelta, moveDirs, moveKeys, nextIndex, readPad } from './pad-core.mjs?v=pad-map1';
import { padMapFor } from './sidecar.js?v=arcade1';

const PRIMARY = '#app .choice, #app [data-option], #app [data-letter], #app [data-game], #app .match-card, #app .sort-tube, #app #again, #app #gotit, #app #notyet, #app #arm'
  // The Star shop
  + ', #app [data-buy], #app [data-wear], #app [data-off], #app [data-try], #app [data-shop-slot]';
const EXTRA = '#app .profile, #app .stylebtn, #app #back, #app #listen, #app #next:not([hidden])'
  // Home page and Star shop extras, and the header
  + ', #app [data-shelf], #app [data-hear], #app [data-style], #app [data-learner], #app [data-shop-hear], #app #openShop, #app #listenHome, #app #homeAddLearner'
  + ', #app #shopBack, #app #shopRead, #app #shopAllOff, #app #shopDance, #app #shopEarn, #app #playAlone, #app #all'
  + ', #readToMe, #parents, #headLearner';
// Inside a game's frame: the mission picker and finish card, and the friend card.
const FRAME_MENU = '[data-pad-menu] button';
const CLICK_SURFACE = 'canvas, svg, .crayon-page';
const REPEAT_MS = 220;
const LOOK_ID = 7;
const FOCUS_RING = '4px solid #ffb348';

const cursor = document.createElement('div');
cursor.className = 'pad-cursor';
cursor.setAttribute('aria-hidden', 'true');
document.documentElement.append(cursor);
const note = document.createElement('p');
note.className = 'pad-note';
note.textContent = 'Controller on. Right trigger is gas, shoot, and click.';
document.documentElement.append(note);

const DEV = ['localhost', '127.0.0.1'].includes(location.hostname);
const pressed = { x: 0, y: 0, action: false, back: false, hear: false, next: false };
const mapped = { was: {}, doc: null, codes: null };
let focusEl = null;
let latched = null;
let pointerEl = null;
let pressedItem = null;
let repeatAt = 0;
let dirKey = '';
let keyTarget = null;
let seenPad = false;
let cursorX = innerWidth / 2;
let cursorY = innerHeight / 2;
let look = null;

// Card art that repeats its card's Play button (aria-hidden, tabindex -1) is skipped.
const visible = el => !!el && !el.disabled && !el.closest('[hidden], [aria-hidden="true"]') && el.getAttribute('tabindex') !== '-1' && el.getClientRects().length > 0
  && el.ownerDocument.defaultView.getComputedStyle(el).visibility !== 'hidden';
const typing = () => /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');

/** Same-origin game frames, with where they sit on the page and their controller map. */
function frameList() {
  return [...document.querySelectorAll('iframe.sidecar-frame')].flatMap(frame => {
    try {
      const doc = frame.contentDocument;
      if (!doc) return [];
      return [{ frame, doc, map: padMapFor(doc.defaultView?.location?.href || frame.src) }];
    } catch { return []; }
  });
}
function frames() {
  return frameList().map(f => f.doc);
}

/** Buttons in a frame's open shadow roots (the friend card lives in one). */
function shadowButtons(doc) {
  const out = [];
  for (const host of doc.body?.children || []) {
    if (host.shadowRoot) out.push(...host.shadowRoot.querySelectorAll('button'));
  }
  return out;
}

/** The frame's menu right now: its friend card, its mission card, or the buttons its map lists.
 *  The map's own buttons are a soft menu: the game's other mapped buttons keep working beside it. */
function frameMenu(f) {
  const friend = shadowButtons(f.doc).filter(visible);
  if (friend.length) return { items: friend, soft: false };
  const lesson = [...f.doc.querySelectorAll(FRAME_MENU)].filter(visible);
  if (lesson.length) return { items: lesson, soft: false };
  if (!f.map?.menu) return { items: [], soft: false };
  return { items: [...f.doc.querySelectorAll(f.map.menu)].filter(visible), soft: true };
}

function menuItems() {
  if (document.querySelector('dialog[open]')) {
    return { items: [...document.querySelectorAll('dialog[open] button')].filter(visible), soft: false };
  }
  const primary = [...document.querySelectorAll(PRIMARY)].filter(visible);
  if (primary.length) return { items: primary.concat([...document.querySelectorAll(EXTRA)].filter(visible)), soft: false };
  for (const f of frameList()) {
    const menu = frameMenu(f);
    if (menu.items.length) return menu;
  }
  return { items: [], soft: false };
}

/** Where an element is on the top page, adding its frame's offset when it lives in a game. */
function pageRect(el) {
  const rect = el.getBoundingClientRect();
  const doc = el.ownerDocument;
  if (doc === document) return rect;
  const frame = [...document.querySelectorAll('iframe.sidecar-frame')].find(fr => {
    try { return fr.contentDocument === doc; } catch { return false; }
  });
  const box = frame?.getBoundingClientRect() || { left: 0, top: 0 };
  return { left: rect.left + box.left, top: rect.top + box.top, width: rect.width, height: rect.height };
}

function placeCursor() {
  cursorX = Math.max(0, Math.min(innerWidth, cursorX));
  cursorY = Math.max(0, Math.min(innerHeight, cursorY));
  cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
}

function highlight(el) {
  if (focusEl === el) return;
  if (focusEl) {
    focusEl.classList.remove('pad-focus');
    // A game's page has no pad styles, so its highlight is drawn inline.
    if (focusEl.ownerDocument !== document || focusEl.getRootNode() !== document) {
      focusEl.style.outline = focusEl.dataset.padOutline || '';
      focusEl.style.outlineOffset = '';
      delete focusEl.dataset.padOutline;
    }
  }
  focusEl = el;
  if (!el) return;
  el.classList.add('pad-focus');
  if (el.ownerDocument !== document || el.getRootNode() !== document) {
    el.dataset.padOutline = el.style.outline || '';
    el.style.outline = FOCUS_RING;
    el.style.outlineOffset = '3px';
  }
  try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch { /* a hidden card can skip this */ }
}

function moveMenu(items, dir) {
  if (!items.length || (!dir.x && !dir.y)) return;
  if (!items.includes(focusEl)) { highlight(items[0]); return; }
  const rects = items.map(el => {
    const rect = pageRect(el);
    return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
  });
  highlight(items[nextIndex(rects, Math.max(0, items.indexOf(focusEl)), dir)]);
}

/** What sits under the cursor inside a frame, using the frame's own coordinates. */
function frameHit(x, y) {
  const el = document.elementFromPoint(x, y);
  const frame = el?.closest?.('iframe');
  if (!frame) return null;
  try {
    const doc = frame.contentDocument;
    const box = frame.getBoundingClientRect();
    const fx = x - box.left;
    const fy = y - box.top;
    const inner = doc?.elementFromPoint(fx, fy);
    return inner ? { el: inner, x: fx, y: fy } : null;
  } catch { return null; }
}

function kindAt(x, y, menu) {
  if (menu) return 'menu';
  const el = document.elementFromPoint(x, y);
  if (!el) return 'none';
  if (el.closest('iframe')) {
    // A button inside a game's page is clicked, like anywhere else.
    return frameHit(x, y)?.el?.closest?.('button, a, [role="button"], input, select, label') ? 'framebutton' : 'frame';
  }
  if (el.closest('.choice, [data-option], [data-letter], [data-game], .match-card, .sort-tube, .crayon-chip, .crayon-pick')) return 'choice';
  if (el.closest('.shard')) return 'canvas';
  if (el.closest('.sky-view, [data-act="fire"], [data-act="shoot"], [data-act="jump"], .bridge-hold, .pad-space')) return 'sky';
  if (el.closest(CLICK_SURFACE)) return 'canvas';
  if (el.closest('button, a, [role="button"]')) return 'button';
  return 'none';
}

// Paint, Skybound, Garden gulp, Targets, Block meadow, Marble box, Grass maze, Cabin camp, and the
// Paint the Plan free match read the controller themselves. Injected keys would double-steer or fight the camera.
function selfPad(doc) {
  const path = String(doc.defaultView?.location?.pathname || '');
  return path.includes('/paint/') || path.includes('/skybound/') || path.includes('/gulp/') || path.includes('/range/') || path.includes('/blocks/')
    || path.includes('/roll/') || path.includes('/grass/') || path.includes('/cabin/') || path.includes('/turf-riot');
}
function selfPadFrames(docs) {
  return docs.filter(doc => !selfPad(doc));
}
function driveFrames() {
  return selfPadFrames(frames());
}
function keyDocs() {
  return selfPadFrames(frames()).concat(document);
}
/** The game frame with a controller map, when one is playing and does not read the pad itself. */
function mappedFrame() {
  return frameList().find(f => f.map && !selfPad(f.doc)) || null;
}

function key(type, code, keyName, docs, repeat = false, target = null) {
  const init = { code, key: keyName, bubbles: true, cancelable: true, repeat };
  for (const doc of docs) {
    doc.dispatchEvent(new doc.defaultView.KeyboardEvent(type, init));
  }
  if (!target?.isConnected) return;
  target.dispatchEvent(new target.ownerDocument.defaultView.KeyboardEvent(type, { ...init, bubbles: false }));
}

/** Hold the movement keys for a direction. Each page gets arrows, or WASD when its map says so. */
function setKeys(dirs, docs) {
  const now = performance.now();
  if (dirs.x || dirs.y) {
    const hit = document.elementFromPoint(cursorX, cursorY)?.closest?.('.shard');
    if (hit) keyTarget = hit;
  }
  const target = keyTarget;
  if (!dirs.x && !dirs.y) keyTarget = null;
  const maps = new Map(frameList().map(f => [f.doc, f.map]));
  const groups = new Map();
  for (const doc of docs) {
    const move = maps.get(doc)?.move === 'wasd' ? 'wasd' : 'arrows';
    if (!groups.has(move)) groups.set(move, []);
    groups.get(move).push(doc);
  }
  let edged = false;
  const repeat = !edged && (dirs.x || dirs.y) && now >= repeatAt;
  for (const [move, list] of groups) {
    for (const [code, keyName, on] of moveKeys(dirs, move)) {
      const slot = `${move}:${code}`;
      const was = pressed[slot];
      if (on && !was) {
        key('keydown', code, keyName, list, false, move === 'arrows' ? target : null);
        edged = true;
      }
      if (!on && was) key('keyup', code, keyName, list, false, move === 'arrows' ? target : null);
      pressed[slot] = on;
    }
  }
  if (edged) repeatAt = now + REPEAT_MS;
  else if (repeat) {
    for (const [move, list] of groups) {
      for (const [code, keyName, on] of moveKeys(dirs, move)) {
        if (on) key('keydown', code, keyName, list, true, move === 'arrows' ? target : null);
      }
    }
    repeatAt = now + REPEAT_MS;
  }
}

function releaseKeys(docs) {
  setKeys({ x: 0, y: 0 }, docs);
}

function pointer(type, el, x, y, id = 1) {
  if (!el) return;
  const view = el.ownerDocument.defaultView;
  const init = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1, pointerId: id, pointerType: 'mouse', isPrimary: true };
  el.dispatchEvent(new view.PointerEvent(type, init));
  el.dispatchEvent(new view.MouseEvent(type === 'pointerdown' ? 'mousedown' : type === 'pointerup' ? 'mouseup' : 'mousemove', init));
}

/** Right stick looks around: a drag on the game's view, started at its middle and let go when the stick rests. */
function stepLook(f, pad, dt) {
  const { dx, dy } = lookDelta(pad, dt);
  const target = f && (dx || dy) ? f.doc.querySelector(f.map.lookOn || 'canvas') : null;
  // look: 'move' sends mouse movement the game reads as look (Tidewater turns with movementX/Y).
  if (target && f.map.look === 'move') {
    const view = target.ownerDocument.defaultView;
    const event = new view.MouseEvent('mousemove', { bubbles: true, cancelable: true, movementX: dx, movementY: dy });
    event.sproutsLook = true;
    target.dispatchEvent(event);
    return;
  }
  if (!target) {
    if (look) {
      pointer('pointerup', look.el, look.x, look.y, LOOK_ID);
      look = null;
    }
    return;
  }
  if (!look || look.el !== target) {
    const box = target.getBoundingClientRect();
    look = { el: target, x: box.left + box.width / 2, y: box.top + box.height / 2 };
    pointer('pointerdown', target, look.x, look.y, LOOK_ID);
  }
  look.x += dx;
  look.y += dy;
  pointer('pointermove', target, look.x, look.y, LOOK_ID);
}
function endLook() {
  if (look) pointer('pointerup', look.el, look.x, look.y, LOOK_ID);
  look = null;
}

/** A on a highlighted button: press it, and hold it while A is held (Hold Reel and the like listen for Enter). */
function pressItem(el) {
  if (!el) return;
  pressedItem = el;
  if (el.ownerDocument !== document) key('keydown', 'Enter', 'Enter', [], false, el);
  el.click();
}
function releaseItem() {
  if (pressedItem && pressedItem.ownerDocument !== document) key('keyup', 'Enter', 'Enter', [], false, pressedItem);
  pressedItem = null;
}

function startAction(plan, el) {
  latched = plan;
  if (plan.click) pressItem(el);
  if (plan.frameClick) {
    const hit = frameHit(cursorX, cursorY);
    hit?.el?.closest?.('button, a, [role="button"], input, select, label')?.click();
  }
  if (plan.pointer) {
    pointerEl = el;
    pointer('pointerdown', el, cursorX, cursorY);
  }
  if (plan.space) key('keydown', 'Space', ' ', [document]);
  if (plan.gas) key('keydown', 'KeyW', 'w', driveFrames());
}

function stopAction() {
  if (!latched) return;
  if (latched.click) releaseItem();
  if (latched.pointer) pointer('pointerup', pointerEl, cursorX, cursorY);
  if (latched.space) key('keyup', 'Space', ' ', [document]);
  if (latched.gas) key('keyup', 'KeyW', 'w', driveFrames());
  latched = null;
  pointerEl = null;
}

/** One mapped button: a key, or Mouse0 / Mouse2 (left and right mouse button on the game's view). */
function press(f, code, down) {
  const mouse = /^Mouse([0-2])$/.exec(code);
  if (!mouse) { key(down ? 'keydown' : 'keyup', code, keyName(code), [f.doc]); return; }
  const target = f.doc.querySelector(f.map?.lookOn || 'canvas') || f.doc.body;
  const box = target.getBoundingClientRect();
  const button = +mouse[1];
  const view = f.doc.defaultView;
  const init = { bubbles: true, cancelable: true, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2, button, buttons: down ? (button === 2 ? 2 : 1) : 0 };
  target.dispatchEvent(new view.PointerEvent(down ? 'pointerdown' : 'pointerup', { ...init, pointerId: LOOK_ID + 1, pointerType: 'mouse', isPrimary: false }));
  target.dispatchEvent(new view.MouseEvent(down ? 'mousedown' : 'mouseup', init));
}

/** Buttons the game's map turns into keys (A reads a sign, X jumps, a shoulder runs...).
 *  Anything still held is let go when the map changes, a menu opens, or the game ends. */
function stepMapped(f, pad, keys) {
  const same = keys && mapped.doc === f?.doc && mapped.codes && PAD_BUTTONS.every(b => mapped.codes[b] === keys[b]);
  if (!same) {
    for (const b of PAD_BUTTONS) {
      if (mapped.was[b] && mapped.codes?.[b] && mapped.doc?.defaultView) press({ doc: mapped.doc, map: mapped.map }, mapped.codes[b], false);
      mapped.was[b] = false;
    }
    mapped.doc = keys ? f.doc : null;
    mapped.map = keys ? f.map : null;
    mapped.codes = keys || null;
  }
  if (!keys) return;
  for (const edge of buttonEdges(pad, keys, mapped.was)) {
    press(f, edge.code, edge.down);
  }
}

function step(pad, dt) {
  const { items: menu, soft } = menuItems();
  const game = mappedFrame();
  const inMenu = menu.length > 0;
  const listening = document.body.classList.contains('listen-first');
  // A mapped game keeps its buttons beside its own soft menu, where A presses the highlighted button instead.
  const live = !!game && !listening && (!inMenu || soft);
  const keys = live && game.map.keys ? { ...game.map.keys, ...(inMenu ? { a: undefined } : {}) } : null;
  const action = actionDown({ a: keys?.a ? 0 : pad.a, rt: keys?.rt ? 0 : pad.rt }, pressed.action);
  const back = held(pad.b, pressed.back);
  const hear = held(pad.y, pressed.hear) && !keys?.y;
  const next = held(pad.start, pressed.next) && !keys?.start;
  const dirs = moveDirs(pad);
  const keyNow = `${dirs.x}${dirs.y}`;
  if (keyNow !== dirKey) repeatAt = 0;
  dirKey = keyNow;
  if (!inMenu) highlight(null);
  else if ((dirs.x || dirs.y) && performance.now() >= repeatAt) {
    moveMenu(menu, dirs);
    repeatAt = performance.now() + REPEAT_MS;
  }
  if (!dirs.x && !dirs.y) repeatAt = 0;

  if (inMenu || listening) releaseKeys(keyDocs());
  else setKeys(dirs, keyDocs());

  stepMapped(game, pad, keys);

  // The right stick turns the view in a game that has one, and moves the pointer everywhere else.
  const looking = !!game?.map?.look && !inMenu && !listening;
  document.body.classList.toggle('pad-look', looking);
  if (looking) stepLook(game, pad, dt);
  else {
    endLook();
    cursorX += (pad.rx || 0) * 900 * dt;
    cursorY += (pad.ry || 0) * 900 * dt;
    placeCursor();
  }
  if (latched?.pointer && pointerEl) pointer('pointermove', pointerEl, cursorX, cursorY);

  if (action && !pressed.action && !(listening && !inMenu)) {
    if (inMenu && !menu.includes(focusEl)) highlight(menu[0]);
    const kind = kindAt(cursorX, cursorY, inMenu);
    const plan = kind === 'framebutton' ? { click: false, frameClick: true, pointer: false, space: false, gas: false } : actionFor(kind);
    startAction(plan, inMenu ? focusEl : document.elementFromPoint(cursorX, cursorY));
  }
  if (!action && pressed.action) stopAction();
  pressed.action = action;

  if (back && !pressed.back) {
    const dialog = document.querySelector('dialog[open]');
    const backButton = dialog
      ? dialog.querySelector('#close, #gateCancel, #confirmCancel, #creditsClose, #printClose')
      : document.querySelector('#back, #shopBack');
    backButton?.click();
  }
  pressed.back = back;
  if (hear && !pressed.hear) document.querySelector('#listen, #shopRead, #listenHome')?.click();
  pressed.hear = hear;
  if (next && !pressed.next) document.querySelector('#next:not([hidden]), #again')?.click();
  pressed.next = next;
}

function poll(now) {
  const pads = navigator.getGamepads?.() || [];
  let pad = null;
  for (const candidate of pads) if (candidate) pad = candidate;
  const connected = !!pad;
  document.body.classList.toggle('pad-on', connected);
  if (connected && !typing()) step(readPad(pad), Math.min(0.05, ((now || performance.now()) - (poll.then || now)) / 1000 || 0.016));
  else if (seenPad && !connected) {
    stopAction();
    releaseKeys(keyDocs());
    endLook();
    stepMapped(null, {}, null);
    highlight(null);
    pressed.action = pressed.back = pressed.hear = pressed.next = false;
  }
  seenPad = connected;
  poll.then = now || performance.now();
  requestAnimationFrame(poll);
}

placeCursor();
requestAnimationFrame(poll);
if (DEV) globalThis.sproutsPad = { step, readPad };
