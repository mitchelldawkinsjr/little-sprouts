/**
 * Star shop screen: spend learning stars on gear for the garden buddy.
 * Rules live in logic/shop.mjs; this file only draws the screen and saves.
 * The buddy can wear one thing in each spot (a hat, glasses, a smile, a necklace, a jersey,
 * a cape or wings, shoes, and a little extra), so a whole outfit shows in every game.
 */
import { GEAR, SLOTS, SLOT_NAMES, buyGear, gearItem, ownedGear, starsToSpend, takeOffGear, wearGear, wornGear, wornList } from '../logic/shop.mjs?v=shop3';
import { profileSprite } from '../logic/profiles.mjs?v=buddy1';
import { stageLabel, stageOf } from '../logic.mjs?v=offline1';
import { drawBuddy } from '../lib/buddy2d.mjs?v=gear2';
import { $, esc } from './runtime.mjs?v=lean-r2';

const starWord = (n) => (n === 1 ? '1 star' : `${n} stars`);
// Shop order: things kids look for first.
const SHOP_ORDER = ['hat', 'eyes', 'mouth', 'neck', 'body', 'feet', 'back', 'pin'];
const SLOT_ICON = { hat: '🎩', eyes: '🕶', mouth: '😁', neck: '📿', body: '👕', feet: '👟', back: '🦋', pin: '✨' };
/** One gear spot, as a short label for a card ("Hat", not "Hats"). */
const SLOT_ONE = { hat: 'Hat', eyes: 'Glasses', mouth: 'Smile', neck: 'Necklace', body: 'Shirt', back: 'Cape or wings', feet: 'Shoes', pin: 'Little extra' };

/** The outfit with `id` tried on in its spot. */
function tryOn(profile, id) {
  const slot = gearItem(id).slot;
  return [...wornList(profile).filter(other => gearItem(other).slot !== slot), id].join(' ');
}

/** Draw the buddy in an outfit on a canvas, sharp on high-density screens. */
function paintBuddy(canvas, kind, outfit) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.clientWidth || +canvas.width;
  const h = canvas.clientHeight || +canvas.height;
  const scale = Math.min(3, window.devicePixelRatio || 1);
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, w, h);
  // Head to toe takes most of the box, with room above for tall hats.
  const height = h * 0.66;
  drawBuddy(ctx, kind, w / 2, h - h * 0.07, height, { gear: outfit });
}

export function registerShop(rt) {
  // One purchase at a time: taps while a confirm is open or a save runs are ignored.
  let busy = false;
  rt.shopSlot = 'all';

  function setProfile(next) {
    rt.data.profiles[rt.data.active] = next;
    rt.save();
  }

  function cardHtml(item, profile) {
    const owned = ownedGear(profile).includes(item.id);
    const worn = wornList(profile).includes(item.id);
    const have = starsToSpend(profile);
    const name = esc(item.name);
    let badge;
    let price;
    let action;
    if (worn) {
      badge = '<span class="sc-badge on">✓ Wearing</span>';
      price = '<span class="sc-price owned">Owned</span>';
      action = `<button type="button" class="sc-act soft" data-off="${item.id}"><span aria-hidden="true">↺</span> Take it off</button>`;
    } else if (owned) {
      badge = '<span class="sc-badge">🎒 Yours</span>';
      price = '<span class="sc-price owned">Owned</span>';
      action = `<button type="button" class="sc-act soft" data-wear="${item.id}"><span aria-hidden="true">👕</span> Put it on</button>`;
    } else if (have >= item.price) {
      badge = item.price <= 6 ? '<span class="sc-badge gold">★ Starter</span>' : '';
      price = `<span class="sc-price"><span aria-hidden="true">⭐</span> ${starWord(item.price)}</span>`;
      action = `<button type="button" class="sc-act go" data-buy="${item.id}"><span aria-hidden="true">🛍</span> Buy for ${item.price} <span aria-hidden="true">⭐</span></button>`;
    } else {
      const need = item.price - have;
      badge = '<span class="sc-badge lock">🔒 Locked</span>';
      price = `<span class="sc-price"><span aria-hidden="true">🔒</span> ${starWord(item.price)}</span>`;
      action = `<button type="button" class="sc-act soft" disabled><span aria-hidden="true">⭐</span> Earn ${need} more ${need === 1 ? 'star' : 'stars'}</button>`;
    }
    const hear = `${item.name}. ${item.about || ''} ${worn ? 'Your buddy is wearing it.' : owned ? 'You have it.' : `It costs ${starWord(item.price)}.`}`;
    return `<li class="sc-card${worn ? ' worn' : ''}${!owned && have < item.price ? ' locked' : ''}"><div class="sc-art"><canvas class="shop-preview" data-try="${item.id}" width="140" height="150" aria-hidden="true"></canvas>${badge}<button type="button" class="sc-hear" data-shop-hear="${esc(hear)}" aria-label="Hear about the ${name}"><span aria-hidden="true">🔊</span></button></div><div class="sc-meta"><span class="sc-kind">${esc(SLOT_ONE[item.slot] || '')}</span>${price}</div><b class="sc-name">${name}</b><span class="sc-about">${esc(item.about || '')}</span>${action}</li>`;
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
    const worn = wornList(profile);
    const owned = ownedGear(profile);
    const wallet = have
      ? `You have <b>${starWord(have)}</b> to spend.`
      : 'You have no stars to spend yet. Play a game to earn some!';
    const closet = owned.length
      ? `Your ${esc(kind)} owns ${owned.length === 1 ? '1 thing' : `${owned.length} things`}.`
      : `Your ${esc(kind)} has no gear yet. Pick something fun!`;
    const wearing = worn.length ? `Wearing: ${worn.map(id => esc(gearItem(id).name)).join(', ')}.` : 'Not wearing anything.';
    const slots = SHOP_ORDER.filter(slot => SLOTS.includes(slot) && GEAR.some(item => item.slot === slot));
    if (rt.shopSlot !== 'all' && !slots.includes(rt.shopSlot)) rt.shopSlot = 'all';
    const shown = GEAR.filter(item => rt.shopSlot === 'all' || item.slot === rt.shopSlot)
      .sort((x, y) => slots.indexOf(x.slot) - slots.indexOf(y.slot) || x.price - y.price);
    const tabs = [['all', '▦', 'All treasures', GEAR.length], ...slots.map(slot => [slot, SLOT_ICON[slot] || '•', SLOT_NAMES[slot], GEAR.filter(item => item.slot === slot).length])]
      .map(([id, icon, label, n]) => `<button type="button" class="sc-tab${id === rt.shopSlot ? ' on' : ''}" data-shop-slot="${id}" aria-pressed="${id === rt.shopSlot}"><span aria-hidden="true">${icon}</span> ${esc(label)} <small>(${n})</small></button>`).join('');
    const goal = GEAR.filter(item => !owned.includes(item.id)).sort((x, y) => x.price - y.price).find(item => item.price > have)
      || GEAR.filter(item => !owned.includes(item.id)).sort((x, y) => y.price - x.price)[0];
    const goalPct = goal ? Math.min(100, Math.round(have / goal.price * 100)) : 100;
    const goalLine = !goal
      ? 'Your buddy owns everything in the shop. Amazing!'
      : have >= goal.price ? `You have enough for the ${esc(goal.name)}!` : `Only <b>${starWord(goal.price - have)}</b> more for the ${esc(goal.name)}.`;
    const name = esc(profile.name);
    const stage = esc(stageLabel(stageOf(profile, rt.data.active)));
    const wornNames = worn.map(id => esc(gearItem(id).name));
    const allOff = worn.length ? '<button type="button" class="sc-mini" id="shopAllOff"><span aria-hidden="true">↺</span> Take all off</button>' : '';
    $('#app').innerHTML = `<div class="playtop shop-top"><button type="button" class="quiet" id="shopBack">← Home</button><div class="stars sc-wallet"><span aria-hidden="true">⭐</span> <b>${have}</b> ${have === 1 ? 'star' : 'stars'} to spend</div></div>`
      + `<section class="shop2"><div class="sc-head"><div><span class="sc-kicker"><span aria-hidden="true">🌱</span> ${name.toUpperCase()}’S GARDEN</span><h1>Star shop <span aria-hidden="true">⭐</span></h1><p>Celebrate your learning! Dress up your garden buddy with stars you earn in the games.</p></div><button type="button" class="sc-read" id="shopRead"><span aria-hidden="true">🔊</span> Read it to me</button></div>`
      + `<div class="sc-hero"><div class="sc-stage"><div class="sc-stage-top"><span class="sc-pill"><i></i> Buddy dressing room</span><span class="sc-pill dark">Live view</span></div><div class="sc-stage-pic"><canvas class="shop-preview big" id="shopMe" width="220" height="230" aria-label="Your ${esc(kind)}${worn.length ? ` wearing ${wornNames.join(', ')}` : ''}"></canvas><span class="sc-wearing">${worn.length ? `<span aria-hidden="true">✨</span> ${wornNames.join(' · ')}` : 'Not wearing anything yet'}</span></div><div class="sc-stage-btns">${allOff}<button type="button" class="sc-mini gold" id="shopDance"><span aria-hidden="true">🎵</span> Buddy dance</button></div></div>`
      + `<div class="sc-hero-copy"><div class="sc-chips"><span class="sc-chip gold">${stage}</span><span class="sc-chip">${owned.length === 1 ? '1 thing owned' : `${owned.length} things owned`}</span></div><h2>${name}’s garden ${esc(kind)}</h2><p>${wallet} ${closet}</p><p class="sc-sub">Your buddy can wear one thing from each group at the same time, and wears the outfit in every game.</p>`
      + `<div class="sc-goal"><div class="sc-goal-top"><span class="sc-goal-icon" aria-hidden="true">${goal ? SLOT_ICON[goal.slot] || '⭐' : '🏆'}</span><div><small>NEXT TREASURE</small><b>${goal ? esc(goal.name) : 'All collected'}</b></div><span class="sc-goal-n"><b>${have}</b> / ${goal ? goal.price : have} stars</span></div><div class="sc-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${goalPct}"><i style="width:${goalPct}%"></i></div><div class="sc-goal-line"><span>${goalLine}</span><b>${goalPct}%</b></div><div class="sc-goal-foot"><span>Earn stars every time you finish a round.</span><button type="button" class="sc-act go small" id="shopEarn">Play a game to earn stars <span aria-hidden="true">↗</span></button></div></div></div></div>`
      + `<p class="feedback" id="shopNote" aria-live="polite">${esc(message)}</p>`
      + `<div class="sc-tabs" role="group" aria-label="Shop groups">${tabs}</div><ul class="sc-grid">${shown.map(item => cardHtml(item, profile)).join('')}</ul>`
      + `<div class="sc-safe"><span class="sc-safe-icon" aria-hidden="true">🛡</span><div><div class="sc-chips"><span class="sc-chip dark">GROWN-UP NOTE</span><span>No real money, ever</span></div><b>100% free &amp; kid-safe</b><p>Stars come only from practicing numbers, shapes, colors, and words. Nothing here costs money.</p></div></div>`
      + `${rt.storageOK ? '' : '<p class="hint">Saving is unavailable in this browser, so gear goes away when the page closes.</p>'}</section>`;
    paintBuddy($('#shopMe'), kind, wornGear(profile));
    document.querySelectorAll('canvas[data-try]').forEach(c => paintBuddy(c, kind, tryOn(profile, c.dataset.try)));
    $('#shopBack').onclick = () => rt.home();
    $('#shopEarn').onclick = () => rt.home();
    document.querySelectorAll('[data-shop-slot]').forEach(btn => btn.onclick = () => {
      rt.shopSlot = btn.dataset.shopSlot;
      openShop({ syncHash: false });
    });
    document.querySelectorAll('[data-shop-hear]').forEach(btn => btn.onclick = () => rt.sayNow(btn.dataset.shopHear));
    $('#shopRead').onclick = () => rt.sayNow(`${profile.name}'s star shop. You have ${starWord(have)} to spend.${goal && have < goal.price ? ` ${starWord(goal.price - have)} more for the ${goal.name}.` : ''}`);
    $('#shopDance').onclick = () => {
      const pic = $('#shopMe');
      pic.classList.remove('dance');
      void pic.offsetWidth;
      pic.classList.add('dance');
      if (rt.data.sound) rt.sayNow('Dance, buddy, dance!');
    };
    if ($('#shopAllOff')) $('#shopAllOff').onclick = () => {
      setProfile(takeOffGear(rt.p()));
      openShop({ syncHash: false, message: `All off! Your ${kind} can put things on again any time.` });
    };
    document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => buy(b.dataset.buy, b));
    document.querySelectorAll('[data-wear]').forEach(b => b.onclick = () => {
      const item = gearItem(b.dataset.wear);
      setProfile(wearGear(rt.p(), item.id));
      openShop({ syncHash: false, message: `Your ${kind} has the ${item.name} on!` });
    });
    document.querySelectorAll('[data-off]').forEach(b => b.onclick = () => {
      const item = gearItem(b.dataset.off);
      setProfile(takeOffGear(rt.p(), item.id));
      openShop({ syncHash: false, message: `You took off the ${item.name}. Your ${kind} can put it on again any time.` });
    });
    rt.paintHeader?.();
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
