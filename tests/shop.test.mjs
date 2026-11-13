import test from 'node:test';
import assert from 'node:assert/strict';
import { GEAR, buyGear, gearItem, ownedGear, starsToSpend, takeOffGear, wearGear, wornGear } from '../logic/shop.mjs';
import { applyRound, blankLearner, pointBoard, resetProgress } from '../logic.mjs';
import { buddyGear, savedLook } from '../lib/buddy3d.mjs';
import { spriteHtml } from '../lib/home-ui.mjs';
import { parseHash } from '../app/router.mjs';

const learner = (extra = {}) => ({ ...blankLearner('Ada', 'fox'), ...extra });

test('Star shop: every item has a name, a price, and a unique id', () => {
  assert.ok(GEAR.length >= 3);
  assert.equal(new Set(GEAR.map(item => item.id)).size, GEAR.length);
  for (const item of GEAR) {
    assert.ok(item.name);
    assert.ok(Number.isInteger(item.price) && item.price > 0);
    assert.equal(gearItem(item.id), item);
  }
  assert.equal(gearItem('cape'), null);
});

test('Star shop: an old profile with no shop fields has its stars to spend and no gear', () => {
  const old = { name: 'Bo', stars: 12, sessions: 2, correct: 8, total: 10 };
  assert.equal(starsToSpend(old), 12);
  assert.deepEqual(ownedGear(old), []);
  assert.equal(wornGear(old), '');
  assert.equal(starsToSpend({}), 0);
});

test('Star shop: buying takes the price once and keeps lifetime stars', () => {
  const hat = gearItem('hat');
  const result = buyGear(learner({ stars: 9 }), 'hat');
  assert.equal(result.ok, true);
  assert.equal(result.profile.stars, 9, 'stars stays the lifetime total for the star garden');
  assert.equal(result.profile.spent, hat.price);
  assert.equal(starsToSpend(result.profile), 9 - hat.price);
  assert.deepEqual(ownedGear(result.profile), ['hat']);
});

test('Star shop: buying the same item again never charges twice', () => {
  const first = buyGear(learner({ stars: 50 }), 'hat').profile;
  const again = buyGear(first, 'hat');
  assert.equal(again.ok, false);
  assert.equal(again.reason, 'owned');
  assert.equal(again.profile, first, 'the profile comes back unchanged');
  assert.equal(starsToSpend(again.profile), 50 - gearItem('hat').price);
});

test('Star shop: not enough stars is refused and nothing is spent', () => {
  const crown = gearItem('crown');
  const poor = learner({ stars: crown.price - 1 });
  const result = buyGear(poor, 'crown');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'short');
  assert.equal(result.profile, poor);
  // Exactly the price is enough, and leaves zero.
  const exact = buyGear(learner({ stars: crown.price }), 'crown');
  assert.equal(exact.ok, true);
  assert.equal(starsToSpend(exact.profile), 0);
  // Spent stars count against the balance.
  assert.equal(buyGear(learner({ stars: 20, spent: 18 }), 'flower').reason, 'short');
});

test('Star shop: unknown items are refused', () => {
  const p = learner({ stars: 99 });
  assert.equal(buyGear(p, 'cape').reason, 'unknown');
  assert.equal(buyGear(p, 'cape').profile, p);
});

test('Star shop: a learner can wear and take off only gear they own', () => {
  const owned = buyGear(learner({ stars: 20 }), 'shades').profile;
  assert.equal(wornGear(owned), '');
  const worn = wearGear(owned, 'shades');
  assert.equal(wornGear(worn), 'shades');
  assert.equal(starsToSpend(worn), starsToSpend(owned), 'wearing is free');
  assert.equal(wearGear(worn, 'crown'), worn, 'gear not owned cannot be worn');
  const off = takeOffGear(worn);
  assert.equal(wornGear(off), '');
  assert.deepEqual(ownedGear(off), ['shades'], 'taking it off keeps it');
  // A saved `wearing` that is not owned (hand-edited or stale) shows nothing.
  assert.equal(wornGear({ wearing: 'crown', gear: [] }), '');
});

test('Star shop: earning stars works the same, and spending does not change the star garden', () => {
  const shopper = buyGear(learner({ stars: 10 }), 'hat').profile;
  const after = applyRound(shopper, 'shapes', 1, 5, 4);
  assert.equal(after.stars, 15);
  assert.equal(starsToSpend(after), 15 - gearItem('hat').price);
  assert.deepEqual(ownedGear(after), ['hat']);
  const board = pointBoard([shopper, learner({ name: 'Bo', stars: 7 })]);
  assert.equal(board[0].name, 'Ada');
  assert.equal(board[0].stars, 10);
});

test('Star shop: each learner keeps their own stars and gear', () => {
  const a = buyGear(learner({ stars: 10 }), 'hat').profile;
  const b = learner({ name: 'Bo', stars: 10 });
  assert.deepEqual(ownedGear(b), []);
  assert.equal(starsToSpend(b), 10);
  assert.notEqual(a.gear, b.gear);
});

test('Star shop: reset clears spent stars but keeps gear the learner bought', () => {
  const p = wearGear(buyGear(learner({ stars: 10 }), 'hat').profile, 'hat');
  const next = resetProgress(p);
  assert.equal(starsToSpend(next), 0);
  assert.equal(next.spent, 0);
  assert.equal(starsToSpend(applyRound(next, 'shapes', 1, 5, 5)), 5);
  assert.deepEqual(ownedGear(next), ['hat']);
  assert.equal(wornGear(next), 'hat');
});

test('Star shop: games read the worn gear from saved data, only for the learner\'s own buddy', () => {
  const store = (data) => ({ getItem: () => JSON.stringify(data) });
  const saved = store({ active: 1, profiles: [{ sprite: 'bear', gear: ['hat'], wearing: 'hat' }, { sprite: 'owl', gear: ['crown'], wearing: 'crown' }] });
  assert.deepEqual(savedLook(saved), { kind: 'owl', gear: 'crown' });
  assert.equal(buddyGear('owl', saved), 'crown');
  assert.equal(buddyGear('bear', saved), '', 'a rival buddy does not wear the learner\'s gear');
  assert.equal(buddyGear('owl', store({ active: 0, profiles: [{ sprite: 'owl' }] })), '', 'an old profile wears nothing');
  assert.equal(buddyGear('fox', { getItem: () => '{bad' }), '');
});

test('Star shop: the buddy drawing shows the worn gear', () => {
  assert.match(spriteHtml('frog', 'crown'), /class="gear gear-crown"/);
  assert.doesNotMatch(spriteHtml('frog'), /gear/);
  assert.doesNotMatch(spriteHtml('frog', 'cape'), /gear/);
});

test('Star shop: #shop is its own view', () => {
  assert.deepEqual(parseHash('#shop'), { view: 'shop' });
});

test('Star shop: every buddy can wear every item in 3D and on canvas', async () => {
  const THREE = await import('../vendor/three/build/three.module.js');
  const { makeBuddy, BUDDIES } = await import('../lib/buddy3d.mjs');
  const { drawBuddy } = await import('../lib/buddy2d.mjs');
  const calls = [];
  const ctx = new Proxy({}, {
    get: (target, key) => (key in target ? target[key] : (...args) => calls.push(key)),
    set: (target, key, value) => { target[key] = value; return true; }
  });
  for (const kind of BUDDIES) {
    const plain = makeBuddy(THREE, kind, { gear: '' });
    assert.equal(plain.head.getObjectByName('gear-hat'), undefined);
    for (const item of GEAR) {
      const buddy = makeBuddy(THREE, kind, { gear: item.id });
      assert.ok(buddy.head.getObjectByName(`gear-${item.id}`), `${kind} wears ${item.id} in 3D`);
      buddy.dispose();
      const before = calls.length;
      drawBuddy(ctx, kind, 50, 100, 80, { gear: item.id });
      const withGear = calls.length - before;
      const mark = calls.length;
      drawBuddy(ctx, kind, 50, 100, 80, { gear: '' });
      assert.ok(withGear > calls.length - mark, `${kind} draws ${item.id} on canvas`);
    }
  }
});
