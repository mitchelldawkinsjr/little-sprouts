/**
 * Star shop: learners spend learning stars on gear their garden buddy wears.
 *
 * Profile fields (all optional, so profiles saved before the shop still work):
 *   spent    stars spent in the shop so far. `stars` stays the lifetime total, so the
 *            star garden, sprout growth, and the stars a round adds never change.
 *   gear     ids of the gear this learner owns.
 *   wearing  id of the gear the buddy has on, or '' for none.
 *
 * Stars to spend = stars - spent.
 */

export const GEAR = [
  { id: 'flower', name: 'Flower', price: 3 },
  { id: 'hat', name: 'Party hat', price: 5 },
  { id: 'shades', name: 'Sunglasses', price: 8 },
  { id: 'crown', name: 'Gold crown', price: 15 }
];

const GEAR_IDS = GEAR.map(item => item.id);

export function gearItem(id) {
  return GEAR.find(item => item.id === id) || null;
}

const count = (value) => Math.max(0, Math.floor(+value) || 0);

/** Ids this learner owns, known items only, no repeats. */
export function ownedGear(profile) {
  const list = Array.isArray(profile?.gear) ? profile.gear : [];
  return GEAR_IDS.filter(id => list.includes(id));
}

/** The gear the buddy has on, or '' when it wears nothing (or something not owned). */
export function wornGear(profile) {
  const id = profile?.wearing;
  return GEAR_IDS.includes(id) && ownedGear(profile).includes(id) ? id : '';
}

export function starsToSpend(profile) {
  return Math.max(0, count(profile?.stars) - count(profile?.spent));
}

/**
 * Try to buy one item. Returns { ok, profile, reason }.
 * reason: 'unknown' | 'owned' | 'short' when ok is false; the profile comes back unchanged.
 * Buying the same item again never charges twice, because owned items are refused.
 */
export function buyGear(profile, id) {
  const item = gearItem(id);
  if (!item) return { ok: false, profile, reason: 'unknown' };
  const owned = ownedGear(profile);
  if (owned.includes(id)) return { ok: false, profile, reason: 'owned' };
  if (starsToSpend(profile) < item.price) return { ok: false, profile, reason: 'short' };
  return {
    ok: true,
    reason: '',
    profile: { ...profile, spent: count(profile.spent) + item.price, gear: [...owned, id] }
  };
}

/** Put on an owned item. Anything else leaves the profile as it was. */
export function wearGear(profile, id) {
  if (!ownedGear(profile).includes(id)) return profile;
  return { ...profile, wearing: id };
}

export function takeOffGear(profile) {
  return { ...profile, wearing: '' };
}
