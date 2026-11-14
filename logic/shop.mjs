/**
 * Star shop: learners spend learning stars on gear their garden buddy wears.
 *
 * Profile fields (all optional, so profiles saved before the shop still work):
 *   spent    stars spent in the shop so far. `stars` stays the lifetime total, so the
 *            star garden, sprout growth, and the stars a round adds never change.
 *   gear     ids of the gear this learner owns.
 *   wearing  ids of the gear the buddy has on: one per spot (a hat, glasses, a smile,
 *            something round the neck, a shirt, something on the back, shoes, a pin).
 *            Older saves hold one id as a string; that still works.
 *
 * Stars to spend = stars - spent.
 *
 * Games and drawings get the outfit as one string of ids with spaces between
 * (wornGear), so a single item id still reads the same as before.
 */

/** Where gear goes on the buddy, in drawing order (back first, pin last). */
export const SLOTS = ['back', 'body', 'feet', 'neck', 'mouth', 'eyes', 'hat', 'pin'];

export const SLOT_NAMES = {
  hat: 'Hats',
  eyes: 'Glasses',
  mouth: 'Smiles',
  neck: 'Necklaces',
  body: 'Shirts',
  back: 'Capes and wings',
  feet: 'Shoes',
  pin: 'Little extras'
};

export const GEAR = [
  // Hats
  { id: 'hat', name: 'Party hat', price: 5, slot: 'hat', about: 'Every day is a party.' },
  { id: 'cap', name: 'Backwards cap', price: 6, slot: 'hat', about: 'Turned around for style.' },
  { id: 'beanie', name: 'Cozy beanie', price: 6, slot: 'hat', about: 'Warm ears, pom on top.' },
  { id: 'cowboy', name: 'Cowboy hat', price: 10, slot: 'hat', about: 'Yee-haw!' },
  { id: 'phones', name: 'Big headphones', price: 10, slot: 'hat', about: 'Hear the beat.' },
  { id: 'wizard', name: 'Wizard hat', price: 12, slot: 'hat', about: 'Sparkly stars. Very magic.' },
  { id: 'crown', name: 'Gold crown', price: 15, slot: 'hat', about: 'For the ruler of the garden.' },
  { id: 'chef', name: 'Chef hat', price: 7, slot: 'hat', about: 'Something tasty is cooking.' },
  { id: 'pirate', name: 'Pirate hat', price: 11, slot: 'hat', about: 'Ahoy! Treasure ahead.' },
  { id: 'halo', name: 'Gold halo', price: 13, slot: 'hat', about: 'A glowing ring that floats.' },
  // Glasses
  { id: 'shades', name: 'Sunglasses', price: 8, slot: 'eyes', about: 'Too cool.' },
  { id: 'starshades', name: 'Star glasses', price: 9, slot: 'eyes', about: 'Shine like a star.' },
  { id: 'hearts', name: 'Heart glasses', price: 9, slot: 'eyes', about: 'Lots of love.' },
  { id: 'roundies', name: 'Round glasses', price: 6, slot: 'eyes', about: 'Smart and ready to read.' },
  { id: 'pixel', name: 'Pixel shades', price: 11, slot: 'eyes', about: 'Blocky black shades. So cool.' },
  // Smiles
  { id: 'grillz', name: 'Gold grillz', price: 14, slot: 'mouth', about: 'A shiny gold smile.' },
  { id: 'icegrillz', name: 'Ice grillz', price: 18, slot: 'mouth', about: 'Sparkly, frosty teeth.' },
  { id: 'mustache', name: 'Silly mustache', price: 5, slot: 'mouth', about: 'Very fancy. Very curly.' },
  { id: 'rainbowgrillz', name: 'Rainbow grillz', price: 20, slot: 'mouth', about: 'Every color in one smile.' },
  // Necklaces
  { id: 'bowtie', name: 'Bow tie', price: 5, slot: 'neck', about: 'Fancy!' },
  { id: 'chain', name: 'Gold chain', price: 12, slot: 'neck', about: 'Big gold links and a shiny coin.' },
  { id: 'chain67', name: '67 chain', price: 16, slot: 'neck', about: 'Six seven! A gold 67 on a chain.' },
  { id: 'scarf', name: 'Cozy scarf', price: 6, slot: 'neck', about: 'Striped and snuggly.' },
  { id: 'medal', name: 'Gold medal', price: 11, slot: 'neck', about: 'Number one learner!' },
  { id: 'icechain', name: 'Ice chain', price: 20, slot: 'neck', about: 'Silver links and a big blue gem.' },
  // Jerseys
  { id: 'jersey10', name: 'Number 10 jersey', price: 14, slot: 'body', about: 'Sky blue stripes. For a magic left foot.' },
  { id: 'jersey7', name: 'Number 7 jersey', price: 14, slot: 'body', about: 'Red and green. Jump high, then celebrate!' },
  { id: 'jersey23', name: 'Number 23 jersey', price: 14, slot: 'body', about: 'Red hoops jersey. Fly to the rim!' },
  { id: 'hoodie', name: 'Comfy hoodie', price: 9, slot: 'body', about: 'Purple, soft, with a front pocket.' },
  // Capes and wings
  { id: 'cape', name: 'Hero cape', price: 10, slot: 'back', about: 'Ready to save the day.' },
  { id: 'wings', name: 'Fairy wings', price: 12, slot: 'back', about: 'Flutter, flutter.' },
  { id: 'backpack', name: 'Backpack', price: 7, slot: 'back', about: 'Ready for school.' },
  { id: 'dragonwings', name: 'Dragon wings', price: 16, slot: 'back', about: 'Big green wings. Roar!' },
  // Shoes
  { id: 'boots', name: 'Rain boots', price: 6, slot: 'feet', about: 'Puddles? No problem.' },
  { id: 'lightups', name: 'Light-up sneakers', price: 10, slot: 'feet', about: 'Glow with every step.' },
  { id: 'kicks67', name: '67 kicks', price: 13, slot: 'feet', about: 'Six seven on your feet!' },
  { id: 'cleats', name: 'Golden boots', price: 15, slot: 'feet', about: 'For the top scorer.' },
  { id: 'slides', name: 'Slides and socks', price: 7, slot: 'feet', about: 'Comfy on game day.' },
  { id: 'skates', name: 'Roller skates', price: 12, slot: 'feet', about: 'Zoom zoom on four wheels.' },
  // Little extras
  { id: 'flower', name: 'Flower', price: 3, slot: 'pin', about: 'A pink flower by the ear.' },
  { id: 'starpin', name: 'Star clip', price: 4, slot: 'pin', about: 'A little gold star.' },
  { id: 'butterfly', name: 'Butterfly clip', price: 5, slot: 'pin', about: 'A blue butterfly friend.' }
];

const GEAR_IDS = GEAR.map(item => item.id);
const SLOT_OF = Object.fromEntries(GEAR.map(item => [item.id, item.slot]));

export function gearItem(id) {
  return GEAR.find(item => item.id === id) || null;
}

const count = (value) => Math.max(0, Math.floor(+value) || 0);

/** Ids in an outfit string ('cap chain67 kicks67'), known items only, one per spot, in drawing order. */
export function gearList(value) {
  const ids = Array.isArray(value) ? value : String(value || '').split(/[\s,]+/);
  const bySlot = {};
  for (const id of ids) if (SLOT_OF[id]) bySlot[SLOT_OF[id]] = id;
  return SLOTS.map(slot => bySlot[slot]).filter(Boolean);
}

/** Ids this learner owns, known items only, no repeats. */
export function ownedGear(profile) {
  const list = Array.isArray(profile?.gear) ? profile.gear : [];
  return GEAR_IDS.filter(id => list.includes(id));
}

/** The ids the buddy has on (owned items only, one per spot), in drawing order. */
export function wornList(profile) {
  const owned = ownedGear(profile);
  return gearList(profile?.wearing).filter(id => owned.includes(id));
}

/** The outfit as one string of ids ('' for none). Games and drawings take this. */
export function wornGear(profile) {
  return wornList(profile).join(' ');
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

/** Put on an owned item. It takes the place of whatever was in the same spot. */
export function wearGear(profile, id) {
  if (!ownedGear(profile).includes(id)) return profile;
  const slot = SLOT_OF[id];
  const rest = wornList(profile).filter(other => SLOT_OF[other] !== slot);
  return { ...profile, wearing: gearList([...rest, id]) };
}

/** Take one item off, or everything when no id is given. */
export function takeOffGear(profile, id) {
  if (!id) return { ...profile, wearing: [] };
  return { ...profile, wearing: wornList(profile).filter(other => other !== id) };
}
