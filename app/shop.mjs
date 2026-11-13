/**
 * Star shop screen: spend learning stars on gear for the garden buddy.
 * Rules live in logic/shop.mjs; this file only draws the screen and saves.
 */
import { GEAR, buyGear, gearItem, ownedGear, starsToSpend, takeOffGear, wearGear, wornGear } from '../logic/shop.mjs?v=shop1';
import { profileSprite } from '../logic/profiles.mjs?v=buddy1';
import { spriteHtml } from '../lib/home-ui.mjs?v=shop1';
import { $, esc } from './runtime.mjs?v=lean-r2';

const starWord = (n) => (n === 1 ? '1 star' : `${n} stars`);

export function registerShop(rt) {
  // One purchase at a time: taps while a confirm is open or a save runs are ignored.
  let busy = false;

  function setProfile(next) {
    rt.data.profiles[rt.data.active] = next;
    rt.save();
  }

  function cardHtml(item, profile, kind) {
    const owned = ownedGear(profile).includes(item.id);
    const worn = wornGear(profile) === item.id;
    const have = starsToSpend(profile);
    let action;
    let state;
    if (worn) {
      state = '<span class="shop-state worn">Wearing it</span>';
      action = `<button type="button" class="quiet" data-off="${item.id}">Take it off</button>`;
    } else if (owned) {
      state = '<span class="shop-state owned">Yours!</span>';
      action = `<button type="button" class="primary" data-wear="${item.id}">Put it on</button>`;
    } else if (have >= item.price) {
      state = `<span class="shop-price"><span aria-hidden="true">⭐</span> ${starWord(item.price)}</span>`;
      action = `<button type="button" class="primary" data-buy="${item.id}">Buy it</button>`;
    } else {
      const need = item.price - have;
      state = `<span class="shop-price"><span aria-hidden="true">⭐</span> ${starWord(item.price)}</span>`;
      action = `<button type="button" class="quiet" disabled>Earn ${need} more ${need === 1 ? 'star' : 'stars'}</button>`;
    }
    return `<li class="shop-item${worn ? ' worn' : ''}"><span class="shop-preview" style="--grow:3">${spriteHtml(kind, item.id)}</span><b>${esc(item.name)}</b>${state}${action}</li>`;
  }

  function openShop({ syncHash = true, message = '' } = {}) {
    if (!rt.data.profiles?.length) {
      rt.showWelcome?.();
      return;
    }
    if (syncHash) rt.setHash?.('shop');
    const profile = rt.p();
    const kind = profileSprite(profile, rt.data.active);
    const have = starsToSpend(profile);
    const worn = wornGear(profile);
    const owned = ownedGear(profile);
    const wallet = have
      ? `You have <b>${starWord(have)}</b> to spend.`
      : 'You have no stars to spend yet. Play a game to earn some!';
    const closet = owned.length
      ? `Your ${esc(kind)}’s gear: ${owned.map(id => esc(gearItem(id).name)).join(', ')}.`
      : `Your ${esc(kind)} has no gear yet. Pick something fun!`;
    const wearing = worn ? `Wearing the ${esc(gearItem(worn).name)}.` : 'Not wearing anything.';
    $('#app').innerHTML = `<div class="playtop shop-top"><button type="button" class="quiet" id="shopBack">← Home</button><div class="stars"><span aria-hidden="true">⭐</span> ${starWord(have)} to spend</div></div><section class="playarea shop"><h1>Star shop</h1><div class="shop-me"><span class="shop-preview big" style="--grow:5">${spriteHtml(kind, worn)}</span><div><p>${wallet}</p><p class="hint">${closet} ${wearing}</p></div></div><p class="feedback" id="shopNote" aria-live="polite">${esc(message)}</p><ul class="shop-list">${GEAR.map(item => cardHtml(item, profile, kind)).join('')}</ul>${rt.storageOK ? '' : '<p class="hint">Saving is unavailable in this browser, so gear goes away when the page closes.</p>'}</section>`;
    $('#shopBack').onclick = () => rt.home();
    document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => buy(b.dataset.buy, b));
    document.querySelectorAll('[data-wear]').forEach(b => b.onclick = () => {
      const item = gearItem(b.dataset.wear);
      setProfile(wearGear(rt.p(), item.id));
      openShop({ syncHash: false, message: `Your ${kind} has the ${item.name} on!` });
    });
    document.querySelectorAll('[data-off]').forEach(b => b.onclick = () => {
      setProfile(takeOffGear(rt.p()));
      openShop({ syncHash: false, message: `You took it off. Your ${kind} can put it on again any time.` });
    });
    rt.focusHeading();
  }

  async function buy(id, button) {
    if (busy) return;
    busy = true;
    if (button) button.disabled = true;
    try {
      const item = gearItem(id);
      const before = rt.p();
      const have = starsToSpend(before);
      if (!item) return;
      if (have < item.price) {
        openShop({ syncHash: false, message: `You need ${starWord(item.price - have)} more. Play a game to earn them!` });
        return;
      }
      const ok = await rt.ask(`Buy the ${item.name}?`, `It costs ${starWord(item.price)}. You will have ${starWord(have - item.price)} left.`, 'Buy it');
      if (!ok) {
        if (button) button.disabled = false;
        return;
      }
      // Check again against the saved profile: buyGear refuses an item already owned,
      // so a second tap can never charge twice.
      const result = buyGear(rt.p(), id);
      const kind = profileSprite(rt.p(), rt.data.active);
      if (!result.ok) {
        const why = result.reason === 'owned' ? `Your ${kind} already has the ${item.name}.` : `You need more stars for the ${item.name}. Play a game to earn them!`;
        openShop({ syncHash: false, message: why });
        return;
      }
      setProfile(wearGear(result.profile, id));
      const message = `Yay! Your ${kind} is wearing the ${item.name}!`;
      if (rt.data.sound) rt.say(message);
      openShop({ syncHash: false, message });
    } finally {
      busy = false;
    }
  }

  Object.assign(rt, { openShop });
}
