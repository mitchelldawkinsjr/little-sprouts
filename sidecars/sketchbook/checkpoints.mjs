/** A walkable route across the north, west, and south of the pinned Sketchbook map. */
export const STOPS = Object.freeze([
  Object.freeze([22, 14.804, -32]),
  Object.freeze([22, 14.804, -79]),
  Object.freeze([-24, 14.804, -78]),
  Object.freeze([-12, 14.804, 19]),
  Object.freeze([-25, 14.804, 66])
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
  let index = 0, pending = false;
  return {
    get index() { return index; },
    get target() { return stops[index] || null; },
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
      return true;
    }
  };
}
