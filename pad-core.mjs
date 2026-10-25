// Standard gamepad layout, shared by the browser poller and the tests.
// Buttons: 0 A, 1 B, 3 Y, 7 right trigger, 12–15 d-pad.
export const DEAD = 0.28;
export const TRIGGER_ON = 0.5;
export const TRIGGER_OFF = 0.28;

export function axisDir(value, dead = DEAD) {
  const n = Number(value) || 0;
  if (n <= -dead) return -1;
  if (n >= dead) return 1;
  return 0;
}

export function buttonValue(button) {
  if (!button) return 0;
  if (typeof button === 'number') return button > 0 ? button : 0;
  if (button.pressed) return button.value > 0 ? button.value : 1;
  return button.value > 0 ? button.value : 0;
}

export function readPad(pad) {
  const button = i => buttonValue(pad?.buttons?.[i]);
  const axis = i => Number(pad?.axes?.[i]) || 0;
  return {
    lx: axis(0),
    ly: axis(1),
    rx: axis(2),
    ry: axis(3),
    rt: button(7),
    a: button(0),
    b: button(1),
    y: button(3),
    start: button(9),
    up: button(12),
    down: button(13),
    left: button(14),
    right: button(15)
  };
}

export function held(value, was, on = TRIGGER_ON, off = TRIGGER_OFF) {
  const n = Number(value) || 0;
  return was ? n >= off : n >= on;
}

// Left stick and d-pad agree on one direction. A later active direction wins.
export function moveDirs(pad) {
  const parts = [
    { x: axisDir(pad.lx), y: axisDir(pad.ly) },
    { x: (pad.right >= TRIGGER_ON ? 1 : 0) - (pad.left >= TRIGGER_ON ? 1 : 0), y: (pad.down >= TRIGGER_ON ? 1 : 0) - (pad.up >= TRIGGER_ON ? 1 : 0) }
  ];
  let x = 0;
  let y = 0;
  for (const part of parts) {
    if (part.x) x = part.x;
    if (part.y) y = part.y;
  }
  return { x, y };
}

// Right trigger and the bottom face button are the same action: gas, shoot, or click.
export function actionDown(pad, was) {
  return held(Math.max(pad.rt || 0, pad.a || 0), was);
}

// kind: menu | choice | button | canvas | sky | frame | none
export function actionFor(kind) {
  if (kind === 'menu' || kind === 'choice' || kind === 'button') return { click: true, pointer: false, space: false, gas: false };
  if (kind === 'canvas') return { click: false, pointer: true, space: false, gas: true };
  if (kind === 'frame') return { click: false, pointer: false, space: false, gas: true };
  if (kind === 'sky') return { click: false, pointer: false, space: true, gas: true };
  return { click: false, pointer: false, space: true, gas: true };
}

export function nextIndex(rects, index, dir) {
  if (!rects.length) return 0;
  const current = rects[Math.max(0, Math.min(index, rects.length - 1))];
  const cx = current.x + current.w / 2;
  const cy = current.y + current.h / 2;
  let best = index;
  let bestScore = Infinity;
  rects.forEach((rect, i) => {
    if (i === index) return;
    const x = rect.x + rect.w / 2 - cx;
    const y = rect.y + rect.h / 2 - cy;
    const along = dir.x ? dir.x * x : dir.y * y;
    if (along < 20) return;
    const cross = Math.abs(dir.x ? y : x);
    const score = along + cross * 1.6;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}
