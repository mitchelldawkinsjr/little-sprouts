// One controller works in every game.
// Left stick and d-pad move or steer. Right stick aims the pointer.
// Right trigger (and the bottom face button) is gas, shoot, and left click.
// B goes back. Y hears the prompt again.
import { actionDown, actionFor, held, moveDirs, nextIndex, readPad } from './pad-core.mjs?v=pad-rt';

const PRIMARY = '#app .choice, #app [data-option], #app [data-letter], #app [data-game], #app .match-card, #app .sort-tube, #app #again, #app #gotit, #app #notyet, #app #arm';
const EXTRA = '#app .profile, #app .stylebtn, #app #back, #app #listen, #app #next:not([hidden])';
const CLICK_SURFACE = 'canvas, svg, .crayon-page';
const REPEAT_MS = 220;

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
let focusEl = null;
let latched = null;
let pointerEl = null;
let repeatAt = 0;
let dirKey = '';
let keyTarget = null;
let seenPad = false;
let cursorX = innerWidth / 2;
let cursorY = innerHeight / 2;

const visible = el => !!el && !el.disabled && !el.closest('[hidden]') && el.getClientRects().length > 0;
const typing = () => /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');

function frames() {
  return [...document.querySelectorAll('iframe.sidecar-frame')].flatMap(frame => {
    try { return frame.contentDocument ? [frame.contentDocument] : []; }
    catch { return []; }
  });
}

function menuItems() {
  if (document.querySelector('dialog[open]')) {
    return [...document.querySelectorAll('dialog[open] button')].filter(visible);
  }
  const primary = [...document.querySelectorAll(PRIMARY)].filter(visible);
  if (!primary.length) return [];
  return primary.concat([...document.querySelectorAll(EXTRA)].filter(visible));
}

function placeCursor() {
  cursorX = Math.max(0, Math.min(innerWidth, cursorX));
  cursorY = Math.max(0, Math.min(innerHeight, cursorY));
  cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
}

function highlight(el) {
  if (focusEl === el) return;
  focusEl?.classList.remove('pad-focus');
  focusEl = el;
  if (!el) return;
  el.classList.add('pad-focus');
  try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch { /* a hidden card can skip this */ }
}

function moveMenu(items, dir) {
  if (!items.length || (!dir.x && !dir.y)) return;
  if (!items.includes(focusEl)) highlight(items[0]);
  const rects = items.map(el => {
    const rect = el.getBoundingClientRect();
    return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
  });
  highlight(items[nextIndex(rects, Math.max(0, items.indexOf(focusEl)), dir)]);
}

function kindAt(x, y, menu) {
  if (menu) return 'menu';
  const el = document.elementFromPoint(x, y);
  if (!el) return 'none';
  if (el.closest('iframe')) return 'frame';
  if (el.closest('.choice, [data-option], [data-letter], [data-game], .match-card, .sort-tube, .crayon-chip')) return 'choice';
  if (el.closest('.shard')) return 'canvas';
  if (el.closest('.sky-view, [data-act="fire"], [data-act="shoot"], [data-act="jump"], .bridge-hold, .pad-space')) return 'sky';
  if (el.closest(CLICK_SURFACE)) return 'canvas';
  if (el.closest('button, a, [role="button"]')) return 'button';
  return 'none';
}

// Paint sphere reads the controller itself. A key injected on the trigger would also walk it forward.
function driveFrames() {
  return frames().filter(doc => !String(doc.defaultView?.location?.pathname || '').includes('/paint/'));
}

function key(type, code, keyName, docs, repeat = false, target = null) {
  const init = { code, key: keyName, bubbles: true, cancelable: true, repeat };
  for (const doc of docs) {
    doc.dispatchEvent(new doc.defaultView.KeyboardEvent(type, init));
  }
  if (!target?.isConnected) return;
  target.dispatchEvent(new target.ownerDocument.defaultView.KeyboardEvent(type, { ...init, bubbles: false }));
}

function setKeys(dirs, docs) {
  const want = [
    ['ArrowLeft', 'ArrowLeft', dirs.x < 0],
    ['ArrowRight', 'ArrowRight', dirs.x > 0],
    ['ArrowUp', 'ArrowUp', dirs.y < 0],
    ['ArrowDown', 'ArrowDown', dirs.y > 0]
  ];
  const now = performance.now();
  if (dirs.x || dirs.y) {
    const hit = document.elementFromPoint(cursorX, cursorY)?.closest?.('.shard');
    if (hit) keyTarget = hit;
  }
  const target = keyTarget;
  if (!dirs.x && !dirs.y) keyTarget = null;
  let edged = false;
  for (const [code, keyName, on] of want) {
    const was = pressed[code];
    if (on && !was) {
      key('keydown', code, keyName, docs, false, target);
      edged = true;
    }
    if (!on && was) key('keyup', code, keyName, docs, false, target);
    pressed[code] = on;
  }
  if (edged) repeatAt = now + REPEAT_MS;
  else if ((dirs.x || dirs.y) && now >= repeatAt) {
    for (const [code, keyName, on] of want) {
      if (on) key('keydown', code, keyName, docs, true, target);
    }
    repeatAt = now + REPEAT_MS;
  }
}

function releaseKeys(docs) {
  setKeys({ x: 0, y: 0 }, docs);
}

function pointer(type, el, x, y) {
  if (!el) return;
  const view = el.ownerDocument.defaultView;
  const init = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1, pointerId: 1, pointerType: 'mouse', isPrimary: true };
  el.dispatchEvent(new view.PointerEvent(type, init));
  el.dispatchEvent(new view.MouseEvent(type === 'pointerdown' ? 'mousedown' : type === 'pointerup' ? 'mouseup' : 'mousemove', init));
}

function startAction(plan, el) {
  latched = plan;
  if (plan.click) el?.click();
  if (plan.pointer) {
    pointerEl = el;
    pointer('pointerdown', el, cursorX, cursorY);
  }
  if (plan.space) key('keydown', 'Space', ' ', [document]);
  if (plan.gas) key('keydown', 'KeyW', 'w', driveFrames());
}

function stopAction() {
  if (!latched) return;
  if (latched.pointer) pointer('pointerup', pointerEl, cursorX, cursorY);
  if (latched.space) key('keyup', 'Space', ' ', [document]);
  if (latched.gas) key('keyup', 'KeyW', 'w', driveFrames());
  latched = null;
  pointerEl = null;
}

function step(pad, dt) {
  const menu = menuItems();
  const action = actionDown(pad, pressed.action);
  const back = held(pad.b, pressed.back);
  const hear = held(pad.y, pressed.hear);
  const next = held(pad.start, pressed.next);
  const dirs = moveDirs(pad);
  const keyNow = `${dirs.x}${dirs.y}`;
  if (keyNow !== dirKey) repeatAt = 0;
  dirKey = keyNow;
  if (!menu.length) highlight(null);
  else if ((dirs.x || dirs.y) && performance.now() >= repeatAt) {
    moveMenu(menu, dirs);
    repeatAt = performance.now() + REPEAT_MS;
  }
  if (!dirs.x && !dirs.y) repeatAt = 0;

  const listening = document.body.classList.contains('listen-first');
  if (menu.length || listening) releaseKeys(frames().concat(document));
  else setKeys(dirs, frames().concat(document));

  cursorX += (pad.rx || 0) * 900 * dt;
  cursorY += (pad.ry || 0) * 900 * dt;
  placeCursor();
  if (latched?.pointer && pointerEl) pointer('pointermove', pointerEl, cursorX, cursorY);

  if (action && !pressed.action && !(listening && !menu.length)) {
    if (menu.length && !menu.includes(focusEl)) highlight(menu[0]);
    startAction(actionFor(kindAt(cursorX, cursorY, menu.length)), menu.length ? focusEl : document.elementFromPoint(cursorX, cursorY));
  }
  if (!action && pressed.action) stopAction();
  pressed.action = action;

  if (back && !pressed.back) {
    const dialog = document.querySelector('dialog[open]');
    const backButton = dialog
      ? dialog.querySelector('#close, #gateCancel, #confirmCancel, #creditsClose, #printClose')
      : document.querySelector('#back');
    backButton?.click();
  }
  pressed.back = back;
  if (hear && !pressed.hear) document.querySelector('#listen')?.click();
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
    releaseKeys(frames().concat(document));
    pressed.action = pressed.back = pressed.hear = pressed.next = false;
  }
  seenPad = connected;
  poll.then = now || performance.now();
  requestAnimationFrame(poll);
}

placeCursor();
requestAnimationFrame(poll);
if (DEV) globalThis.sproutsPad = { step, readPad };
