/**
 * Touch controls for Little Sprouts games: one API every game can use on a phone or tablet.
 *
 * Built on @vibedgames/gamepad (vendor/gamepad, MIT): a floating thumb stick that appears
 * where the thumb lands, plus big round buttons. This layer adds what young players need:
 *
 *   - Two sticks when a game wants them: the left half of the screen walks, the right half
 *     aims (and can spray or shoot while held). One stick when a game only moves.
 *   - Big buttons with a picture (emoji) on them, in fixed spots bottom-right that stay clear
 *     of the notch and home bar.
 *   - The buttons, and a faint ring where each thumb goes, show up on touch devices before the
 *     first touch, so a child can see where to put their thumbs.
 *   - Taps on the game's own buttons, cards, menus, and question cards are left alone, so a
 *     touch never both picks an answer and walks the buddy.
 *   - The mouse is ignored: a computer keeps its own mouse and keyboard controls.
 *
 * Use it from a game (a page in its own iframe, like the sidecars):
 *
 *   import { attachTouchControls } from '/lib/touch-controls.mjs?v=touch1';
 *   const touch = attachTouchControls({
 *     move: true,
 *     aim: true,                      // a second stick on the right half
 *     buttons: [{ id: 'jump', label: '⬆️', slot: 0 }],
 *     hints: { move: 'Walk', aim: 'Aim' },
 *     ignore: '#picker, #ask',        // extra places taps should be left alone
 *   });
 *   // every frame:
 *   touch.update();
 *   if (touch.move.active) walk(touch.move.x, touch.move.y);   // -1..1 each; y is down the screen
 *   if (touch.aim.active) face(touch.aim.angle);
 *   if (touch.tapped('jump')) jump();                          // once per press
 *   if (touch.down('jump')) holdJump();                        // while held
 *
 * Stick readings: { active, x, y, magnitude (0..1), angle (radians, screen space) }.
 * `active` is false in the dead zone, so a resting thumb doesn't drift the buddy.
 */
import { attachDomGamepad } from '../vendor/gamepad/dom.js';

/** Sizes for small hands and big thumbs, in CSS pixels. */
export const KID = { stick: 72, knob: 32, deadZone: 10, button: 50, gap: 18, edge: 22 };

// Places on the screen tapped as buttons, cards, menus, or form fields: never a stick.
const LEAVE_ALONE = 'button, a, input, select, textarea, [role="button"], [data-gamepad-ignore], [data-touch-ignore]';

/**
 * Where button `slot` sits: 0 is the main button, bottom-right; 1 sits above it; 2 to its
 * left; 3 above-left. `v` is the gamepad viewport ({ width, height, inset }).
 */
export function buttonSpot(slot, v, r = KID.button) {
  const step = r * 2 + KID.gap;
  const col = slot === 2 || slot === 3 ? 1 : 0;
  const row = slot === 1 || slot === 3 ? 1 : 0;
  return {
    x: v.width - KID.edge - r - v.inset.right - col * step,
    y: v.height - KID.edge - r - v.inset.bottom - row * step,
  };
}

/** A stick snapshot from the library, as a -1..1 vector a game can use straight away. */
export function readStick(s) {
  if (!s?.active || s.inDeadZone) return { active: false, x: 0, y: 0, magnitude: 0, angle: s?.angle || 0 };
  return { active: true, x: Math.cos(s.angle) * s.magnitude, y: Math.sin(s.angle) * s.magnitude, magnitude: s.magnitude, angle: s.angle };
}

/** True on a phone or tablet (a coarse pointer or touch events), where controls should show up front. */
export function isTouchDevice() {
  try { return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0; } catch { return false; }
}

/**
 * Attach touch controls to this page. Options:
 *   move     true for a walking stick (the whole screen, or the left half when `aim` is on)
 *   aim      true for a second stick on the right half
 *   buttons  [{ id, label, slot (0-3) or position(v), radius }]
 *   hints    { move: 'Walk', aim: 'Aim' } faint rings showing where each thumb goes
 *   tint     accent color (CSS), default a soft leaf green
 *   ignore   extra CSS selector where taps are left to the page
 *   half     'left' keeps a lone move stick on the left half, so the right half stays the page's
 *            own (Cloudkeep: left thumb flies, right thumb drags the sky to steer)
 *   onFirstTouch  called once, when the first finger lands
 */
export function attachTouchControls(options = {}) {
  const { move = true, aim = false, half = '', buttons = [], hints = {}, tint = '#9fd36a', ignore = '', onFirstTouch } = options;
  const skip = ignore ? `${LEAVE_ALONE}, ${ignore}` : LEAVE_ALONE;
  const leaveAlone = (target) => target instanceof Element && target.closest(skip) !== null;
  const stickOpts = { radius: KID.stick, knobRadius: KID.knob, deadZone: KID.deadZone };
  const fixed = buttons.map(b => ({
    id: b.id,
    label: b.label,
    radius: b.radius || KID.button,
    position: b.position || ((v) => buttonSpot(b.slot | 0, v, b.radius || KID.button)),
  }));
  // A touch on (or just beside) a button is that button's, never the aiming stick's.
  const onButton = (x, y) => fixed.some(b => {
    const c = b.position(left.pad.viewport);
    return Math.hypot(x - c.x, y - c.y) <= b.radius + 6;
  });

  // The library draws faint white chrome. Over bright grass or snow that vanishes, so give the
  // stick and buttons a soft dark backdrop, a bigger picture, and full strength (presses still
  // light up in the tint).
  if (!document.getElementById('touch-controls-style')) {
    const style = document.createElement('style');
    style.id = 'touch-controls-style';
    style.textContent = '.vg-btn{opacity:1!important;box-shadow:inset 0 0 0 999px rgba(16,32,26,.38),0 4px 12px rgba(0,0,0,.35);border-width:3px!important;font-size:44px!important;line-height:1}'
      + '.vg-stick-base{box-shadow:inset 0 0 0 999px rgba(16,32,26,.22);border-width:3px!important}'
      + '.vg-stick-knob{box-shadow:0 3px 10px rgba(0,0,0,.35)}';
    document.head.append(style);
  }

  // The game owns gesture policy. game-touch.css locks playfields and controls,
  // without disabling scroll and zoom on menus in this document.

  let first = true;
  const firstTouch = () => { if (first) { first = false; ring.update(); onFirstTouch?.(); } };
  // The left (or only) pad owns the buttons; with two sticks, a second pad owns the right half.
  const left = attachDomGamepad({
    visible: 'coarse',
    ignore: leaveAlone,
    buttons: fixed,
    stick: move ? { ...stickOpts, region: aim || half === 'left' ? (p, v) => p.x < v.width / 2 : undefined } : false,
    render: { tint },
    onFirstTouch: firstTouch,
  });
  const right = aim ? attachDomGamepad({
    visible: 'coarse',
    ignore: leaveAlone,
    buttons: [],
    stick: { ...stickOpts, region: (p, v) => p.x >= v.width / 2 && !onButton(p.x, p.y) },
    render: { tint },
  }) : null;

  // Faint rings where the thumbs go, until each stick is in use.
  const ring = hintRings({ move: move && hints.move, aim: aim && hints.aim, tint, split: aim });

  const api = {
    move: readStick(null),
    aim: readStick(null),
    get isTouch() { return left.isTouch || !!right?.isTouch; },
    /** A finger is on a stick or button right now. */
    get touching() { return left.pad.isTouching || !!right?.pad.isTouching; },
    down: (id) => left.isButtonDown(id),
    tapped: (id) => left.justPressed(id),
    released: (id) => left.justReleased(id),
    update() {
      left.update();
      right?.update();
      api.move = move ? readStick(left.getStick()) : readStick(null);
      api.aim = right ? readStick(right.getStick()) : readStick(null);
      ring.paint(api.move.active || left.getStick().active, !!right && (api.aim.active || right.getStick().active));
    },
    /** Hide the controls (a title screen, a question card); input keeps working. */
    setVisible(on) {
      left.setVisible(on);
      right?.setVisible(on);
      ring.show(on);
    },
    /** Let go of every finger, e.g. when a card opens over the game. */
    reset() { left.pad.reset(); right?.pad.reset(); },
    destroy() { left.destroy(); right?.destroy(); ring.remove(); },
  };
  return api;
}

// Faint thumb rings: shown on touch devices, hidden while that stick is held or once hidden.
function hintRings({ move, aim, tint, split }) {
  const root = document.createElement('div');
  root.className = 'touch-hints';
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:39;font:800 15px system-ui,sans-serif;';
  const make = (label, side) => {
    if (!label) return null;
    const d = document.createElement('div');
    const r = KID.stick;
    d.textContent = label;
    // a short screen (a phone on its side, or the game framed inside the app) gets smaller rings
    const size = `min(${r * 2}px, 38vh)`;
    d.style.cssText = `position:absolute;bottom:calc(min(${KID.edge + 40}px, 9vh) + env(safe-area-inset-bottom));width:${size};height:${size};` +
      `${side}:calc(${side === 'left' ? KID.edge + 20 : KID.edge + KID.button * 2 + KID.gap + 30}px + env(safe-area-inset-${side}));` +
      `border-radius:50%;border:3px dashed ${tint};background:rgba(255,255,255,.08);color:#fff;display:flex;align-items:center;justify-content:center;` +
      'text-shadow:0 1px 3px #0009;opacity:.7;transition:opacity .2s;';
    root.append(d);
    return d;
  };
  const m = make(move, 'left');
  const a = make(aim, split ? 'right' : 'left');
  document.body.append(root);
  let visible = true;
  let device = isTouchDevice();
  // each ring teaches once: after that thumb has used its stick, the ring stays away
  let movedOnce = false, aimedOnce = false;
  return {
    update() { device = true; },
    show(on) { visible = on; },
    paint(moveHeld, aimHeld) {
      movedOnce ||= moveHeld;
      aimedOnce ||= aimHeld;
      const on = visible && device;
      if (m) m.style.opacity = on && !movedOnce ? '.7' : '0';
      if (a) a.style.opacity = on && !aimedOnce ? '.7' : '0';
    },
    remove() { root.remove(); },
  };
}

// ===================================================================
// Touch as a game controller: for games built elsewhere (Paint Sphere, Backroad rally) or any
// game that already reads a controller through the Gamepad API. The touch sticks and buttons
// show up to the game as one more standard controller, so it plays by touch with no change
// to its own code. A real controller, when one is plugged in, still comes first.
// ===================================================================

/** Standard-mapping button numbers (https://w3c.github.io/gamepad/#remapping). */
export const PAD_BUTTONS = { a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, lt: 6, rt: 7, back: 8, start: 9, ls: 10, rs: 11, up: 12, down: 13, left: 14, right: 15 };

/** A blank standard controller. `axes` are left x, left y, right x, right y (y is down). */
export function blankPad(index = 0) {
  return {
    id: 'Little Sprouts touch controls (STANDARD GAMEPAD)',
    index,
    connected: false,
    mapping: 'standard',
    timestamp: 0,
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
    vibrationActuator: null,
  };
}

/** Write one frame of touch input into the pad: sticks to axes, held buttons to buttons. */
export function fillPad(pad, { move, aim, held = [], fire = '' }) {
  pad.axes[0] = move?.x || 0;
  pad.axes[1] = move?.y || 0;
  pad.axes[2] = aim?.x || 0;
  pad.axes[3] = aim?.y || 0;
  const down = new Set(held);
  // twin-stick games: pushing the aiming stick out also holds the fire button
  if (fire && aim?.active && aim.magnitude > 0.3) down.add(fire);
  pad.buttons.forEach((b, i) => { b.pressed = false; b.touched = false; b.value = 0; });
  for (const name of down) {
    const b = pad.buttons[PAD_BUTTONS[name]];
    if (b) { b.pressed = true; b.touched = true; b.value = 1; }
  }
  pad.timestamp = performance.now();
  return pad;
}

/**
 * Show touch input to the page as a standard controller. Options:
 *   aim      true for a right stick (look or aim)
 *   fire     a button held while the right stick is pushed out ('rt' for twin-stick games)
 *   buttons  [{ button: 'a' | 'rt' | ..., label: '⬆️', slot: 0-3 }]
 *   hints, tint, ignore   as attachTouchControls
 * The pad only reports connected on a touch device (or after the first touch), so on a
 * computer nothing changes.
 */
export function attachTouchGamepad(options = {}) {
  const { aim = false, fire = '', buttons = [], hints = {}, tint, ignore } = options;
  const touch = attachTouchControls({
    move: true,
    aim,
    buttons: buttons.map(b => ({ id: b.button, label: b.label, slot: b.slot, radius: b.radius })),
    hints,
    tint,
    ignore,
  });
  // Games built for mouse-look ask to lock the mouse pointer when play starts. A finger has no mouse
  // to lock, and the browser throws; the touch sticks do the looking instead. A real mouse (a laptop
  // with a touch screen, a tablet with a mouse) still locks: only a request right after a touch is skipped.
  if (isTouchDevice() && typeof Element !== 'undefined' && Element.prototype.requestPointerLock) {
    const lock = Element.prototype.requestPointerLock;
    let lastPointer = matchMedia('(any-pointer: fine)').matches ? '' : 'touch';
    window.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType; }, true);
    Element.prototype.requestPointerLock = function requestPointerLock(...args) {
      if (lastPointer === 'touch') return Promise.resolve();
      return lock.apply(this, args);
    };
  }
  const native = typeof navigator.getGamepads === 'function' ? navigator.getGamepads.bind(navigator) : () => [];
  const pad = blankPad();
  pad.connected = isTouchDevice();
  const names = buttons.map(b => b.button);
  Object.defineProperty(navigator, 'getGamepads', {
    configurable: true,
    value: () => {
      let real = [];
      try { real = [...(native() || [])]; } catch { real = []; }
      pad.index = real.length;
      return pad.connected ? [...real, pad] : real;
    },
  });
  let raf = 0;
  const frame = () => {
    touch.update();
    if (touch.isTouch) pad.connected = true;
    fillPad(pad, { move: touch.move, aim: touch.aim, held: names.filter(n => touch.down(n)), fire });
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return {
    pad,
    touch,
    setVisible: (on) => touch.setVisible(on),
    destroy() {
      cancelAnimationFrame(raf);
      touch.destroy();
      Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: native });
    },
  };
}
