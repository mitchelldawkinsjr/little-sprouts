// Pieces of touch and tilt play with no browser parts, shared by tilt.js and the tests.
export const TILT_RANGE = 22;
export const TILT_ON = 0.35;
export const TILT_OFF = 0.18;

// Games where holding left or right steers. Tilt maze has its own tilt.
export const TILT_GAMES = new Set(['lanes', 'race', 'catch', 'hook', 'hop', 'rally', 'flight', 'walk']);

export function isTouch({ coarse = false, maxTouchPoints = 0, forced = false } = {}) {
  return forced || coarse || maxTouchPoints > 0;
}

// Side-to-side tilt in degrees for the way the screen is turned. Positive is a tilt to the right.
export function sideTilt({ beta = 0, gamma = 0 } = {}, angle = 0) {
  const turn = ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
  if (turn === 90) return beta;
  if (turn === 270) return -beta;
  if (turn === 180) return -gamma;
  return gamma;
}

// -1 to 1 around the angle the phone was held at when tilt was turned on.
export function steerAmount(tilt, center = 0) {
  return Math.max(-1, Math.min(1, (tilt - center) / TILT_RANGE));
}

// Holds a direction until the phone comes back near level, so a small wobble does not flicker the keys.
export function tiltDir(amount, held = 0) {
  if (held && Math.sign(amount) === held && Math.abs(amount) > TILT_OFF) return held;
  if (Math.abs(amount) >= TILT_ON) return Math.sign(amount);
  return 0;
}
