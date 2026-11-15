/** Named tour stops on the pinned Sketchbook map. Coordinates mark places to stand, not vehicle centers. */
export const STOPS = Object.freeze([
  Object.freeze([9, 14.804, 10]),      // next to the parked cars
  Object.freeze([-23, 14.804, 69]),    // west side of the stunt bowl
  Object.freeze([82, 14.804, 0]),      // east tunnel exit
  Object.freeze([149, 15.16, -92.6]), // airplane's left entry
  Object.freeze([101.2, 16.44, -80])   // helicopter's south entry
]);
export const LANDMARKS = Object.freeze([
  { name: 'Parked cars', hint: 'Walk up to a car and press F, X, or Vehicle to get in.' },
  { name: 'Stunt bowl', hint: 'Try running the slopes or bring a car back for a lap.' },
  { name: 'Tunnel crossing', hint: 'Follow the trail through the tunnel to the runway side.',
    via: [[12, 14.804, 0], [28, 11.52, 0], [64, 11.1, 0]] },
  { name: 'Runway airplane', hint: 'Board from here with F, X, or Vehicle. Hold Shift, RB, or Throttle to take off.',
    aircraft: 'Spawn011' },
  { name: 'Low helipad', hint: 'Board from here with F, X, or Vehicle. Hold Shift, RB, or Rise to lift off.',
    aircraft: 'Spawn010' }
]);
export const HOME = Object.freeze([9, 15.38, -5.17]);
export const ARRIVAL_RADIUS = 2.05;
export const HEIGHT_TOLERANCE = 2.2;

export function distanceTo(position, [x, , z]) {
  return Math.hypot(position.x - x, position.z - z);
}

export function atBeacon(position, stop) {
  return !!position && !!stop && Math.abs(position.y - stop[1]) < HEIGHT_TOLERANCE
    && distanceTo(position, stop) <= ARRIVAL_RADIUS;
}

/** Track only one pending checkpoint. A retry never advances or grants a second reward. */
export function makeTrail(stops = STOPS) {
  let index = 0, pending = false, leg = 0;
  const detours = stops === STOPS ? LANDMARKS : [];
  return {
    get index() { return index; },
    get resumePosition() {
      if (!index) return HOME;
      const [x, y, z] = stops[index - 1];
      return [x, y + 0.65, z];
    },
    get target() { return stops[index] || null; },
    get guide() { return detours[index]?.via?.[leg] || stops[index] || null; },
    updateGuide(position) {
      const via = detours[index]?.via;
      if (via && leg < via.length && Math.abs(position.y - via[leg][1]) < HEIGHT_TOLERANCE
          && distanceTo(position, via[leg]) < 3) leg++;
      return this.guide;
    },
    restartLeg() { leg = 0; },
    get done() { return index === stops.length; },
    get pending() { return pending; },
    reach(position) {
      if (pending || !atBeacon(position, stops[index])) return false;
      pending = true;
      return true;
    },
    settle(correct) {
      if (!pending) return false;
      pending = false;
      if (!correct) return false;
      index++;
      leg = 0;
      return true;
    }
  };
}
