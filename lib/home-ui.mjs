import { gearItem, gearList } from '../logic/shop.mjs?v=shop2';
/**
 * Home screen HTML builders. app.js still owns state and click handlers.
 */

export const SHELF_META = [
  { id: 'calm-create', label: 'Calm & Create' },
  { id: 'quick-play', label: 'Quick Play' },
  { id: 'run-jump-dodge', label: 'Run, Jump & Dodge' },
  { id: 'drive-fly-aim', label: 'Drive, Fly & Aim' },
  { id: 'words-numbers', label: 'Words & Numbers' }
];

const SHELF_OF = {
  missing: 'calm-create', puzzle: 'calm-create', match: 'calm-create', trace: 'calm-create', sort: 'calm-create', merge: 'calm-create', crayon: 'calm-create', lamp: 'calm-create', verse: 'calm-create',
  catch: 'quick-play', toast: 'quick-play', mole: 'quick-play', bust: 'quick-play', hoop: 'quick-play', lunar: 'quick-play', stack: 'quick-play', light: 'quick-play', marble: 'quick-play', bridge: 'quick-play',
  hop: 'run-jump-dodge', lily: 'run-jump-dodge', chase: 'run-jump-dodge', cube: 'run-jump-dodge', maze: 'run-jump-dodge', aisle: 'run-jump-dodge',
  lanes: 'drive-fly-aim', race: 'drive-fly-aim', rocket: 'drive-fly-aim', glide: 'drive-fly-aim', city: 'drive-fly-aim', hook: 'drive-fly-aim', sky: 'drive-fly-aim', planet: 'drive-fly-aim',
  shapes: 'words-numbers', colors: 'words-numbers', mix: 'words-numbers', words: 'words-numbers', build: 'words-numbers', count: 'words-numbers', path: 'words-numbers', quickmath: 'words-numbers', clue: 'words-numbers'
};

export function shelfOf(id, sidecarShelf) {
  return SHELF_OF[id] || sidecarShelf || 'calm-create';
}

export function gameBlurb(gid, desc, { stage, mathBlurb }) {
  if (gid === 'count' || gid === 'path' || gid === 'catch') return mathBlurb(stage, gid);
  if (stage === 'preschool' && gid === 'match') return 'Flip cards. Match shapes, colors, and numbers.';
  if (stage === 'preschool' && gid === 'chase') return 'Eat the berries that match. Steer clear of the snails.';
  if (stage === 'preschool' && gid === 'rally') return 'Match a shape or color, or answer a number question. A right answer turbos the car.';
  return desc;
}

export function howWePlayHtml({ open, styleId, styles, cameraOn, arcadeOn }) {
  const info = styles.find(s => s[0] === styleId);
  const summary = `<button type="button" class="how-toggle" id="howToggle" aria-expanded="${open}"><span aria-hidden="true">${info[1]}</span> How we play · ${info[2]}</button>`;
  if (!open) return `<section class="how-play">${summary}</section>`;
  const arcadeNote = arcadeOn ? '<p>Arcade play is on for this learner.</p>' : '';
  const body = `<div class="stylebar"><div><small>HOW ARE WE PLAYING?</small><div class="styles">${styles.filter(s => s[0] !== 'reach' || cameraOn).map(([id, icon, label]) => `<button class="stylebtn ${id === styleId ? 'selected' : ''}" data-style="${id}" aria-pressed="${id === styleId}"><span aria-hidden="true">${icon}</span> ${label}</button>`).join('')}</div><p>${info[3]}${styleId === 'move' ? ' Clear a space, use bare feet or grippy socks, and stay close.' : ''}</p>${arcadeNote}</div>${styleId === 'move' ? '<button class="quiet" id="printCards"><span aria-hidden="true">🖨</span> Print floor cards</button>' : ''}</div>`;
  return `<section class="how-play open">${summary}${body}</section>`;
}

export function gameCardHtml({ gid, name, blurb, icon, tint, stageLabel, level, state, featured = false, next = false, esc }) {
  const label = `${name}, ${stageLabel}, Level ${level}, ${state}. ${blurb}`;
  const cls = ['card', featured && 'card-next', next && !featured && 'is-next'].filter(Boolean).join(' ');
  const mark = next && !featured ? '<span class="next-mark">Up next</span>' : '';
  const title = featured
    ? `<span class="card-next-copy"><span class="next-kicker">Up next</span><span class="card-title">${name}</span></span>`
    : `<span class="card-title">${name}</span>${mark}`;
  return `<button class="${cls}" data-game="${gid}" style="--tint:${tint}" aria-label="${esc(label)}"><span class="card-art" aria-hidden="true">${icon}</span>${title}</button>`;
}

export function shelfChipsHtml(available, openId) {
  return `<div class="shelf-chips" role="group" aria-label="Game shelves">${available.map(s => `<button type="button" class="shelf-chip${s.id === openId ? ' selected' : ''}" data-shelf="${s.id}" aria-pressed="${s.id === openId}">${s.label}</button>`).join('')}</div>`;
}

export function shelfPanelHtml(available, openId, nextId, cardFor) {
  const shelf = available.find(s => s.id === openId) || available[0];
  if (!shelf) return '';
  const cards = shelf.games.map(g => cardFor(g[0], { next: g[0] === nextId })).join('');
  return `<section class="shelf" aria-labelledby="shelfTitle"><h3 id="shelfTitle" class="shelf-title">${shelf.label}</h3><div class="games">${cards}</div></section>`;
}

/**
 * The garden buddy drawing. gear is the outfit: star-shop ids with spaces ('cap chain67 kicks67'),
 * or ''. Head gear goes in the head, the jersey in the body, a cape or wings behind, and the
 * chain and shoes in front.
 */
export function spriteHtml(kind, gear = '') {
  const wear = {};
  for (const id of gearList(gear)) wear[gearItem(id).slot] = id;
  const piece = (slot) => (wear[slot] ? `<i class="gear gear-${wear[slot]}"></i>` : '');
  const back = piece('back');
  const onBody = piece('body');
  const front = piece('neck') + (wear.feet ? `<i class="gear gear-${wear.feet} shoe l"></i><i class="gear gear-${wear.feet} shoe r"></i>` : '');
  const eyes = `<i class="eye l"></i><i class="eye r"></i>${piece('mouth')}${piece('eyes')}${piece('hat')}${piece('pin')}`;
  const bodyEl = `<i class="body">${onBody}</i>`;
  const wrap = (cls, inner) => `<span class="buddy-sprite ${cls}" aria-hidden="true">${back}${inner}${front}</span>`;
  if (kind === 'bear') return wrap('bear', `<i class="ear l"></i><i class="ear r"></i><i class="head">${eyes}<i class="snout"></i></i>${bodyEl}`);
  if (kind === 'bunny') return wrap('bunny', `<i class="ear l"></i><i class="ear r"></i><i class="head">${eyes}<i class="nose"></i></i>${bodyEl}`);
  if (kind === 'frog') return wrap('frog', `<i class="head">${eyes}<i class="nose"></i></i>${bodyEl}`);
  if (kind === 'owl') return wrap('owl', `<i class="ear l"></i><i class="ear r"></i><i class="head">${eyes}<i class="nose"></i></i>${bodyEl}`);
  if (kind === 'chick') return wrap('chick', `<i class="head">${eyes}<i class="nose"></i></i><i class="ear l"></i><i class="ear r"></i>${bodyEl}`);
  return wrap('fox', `<i class="ear l"></i><i class="ear r"></i><i class="head">${eyes}<i class="nose"></i></i>${bodyEl}<i class="tail"></i>`);
}

export function starGardenHtml({ rows, activeIndex, pick, esc }) {
  const cards = rows.map(row => {
    const tag = pick ? 'button' : 'div';
    const noun = row.stars === 1 ? 'star' : 'stars';
    const earned = row.earned === 1 ? 'Earned 1 star' : row.earned ? `Earned ${row.earned} stars` : 'Play to earn stars';
    const bits = Array.from({ length: Math.min(5, row.earned) }, () => '<i></i>').join('');
    const mine = row.index === activeIndex;
    const type = pick ? ' type="button"' : '';
    const learner = pick ? ` data-learner="${row.index}"` : '';
    const current = mine ? ' aria-current="true"' : '';
    return `<${tag} class="sprout-card${mine ? ' mine' : ''}${row.rank === 1 && row.stars ? ' lead' : ''}"${type}${learner}${current} style="--grow:${row.grow}"><span class="float-stars" aria-hidden="true">${bits}</span>${spriteHtml(row.sprite, row.gear)}<i class="stand" aria-hidden="true"></i><b>${esc(row.name)}</b><span class="points">${row.stars} ${noun}</span><span class="earned${row.earned ? '' : ' quiet-earn'}">${earned}</span></${tag}>`;
  }).join('');
  const note = pick ? 'Tap a sprout to play as them' : 'Stars from every game';
  return `<section class="star-garden" aria-label="Star garden"><div class="sectionhead"><h2>Star garden</h2><span>${note}</span></div><div class="podium">${cards}</div></section>`;
}

export function homePageHtml({
  learnerName,
  avatar,
  starsChip,
  upNextCard,
  shelfChips,
  shelfPanel,
  howWePlay,
  starGarden,
  note,
  storageOK,
  lists = 'Change words, math facts, and the question sheet in Parent corner.'
}) {
  return `<div class="learnerbar"><div class="profiles"><span class="profile selected"><span class="avatar" aria-hidden="true">${avatar}</span><span>${learnerName}</span></span></div><div class="learnerbar-end"><button type="button" class="quiet shop-open" id="openShop"><span aria-hidden="true">🛍</span> Star shop</button><div class="stars"><span aria-hidden="true">⭐</span> ${starsChip}</div></div></div><section class="home-hello"><h1>Hi, ${learnerName}.<br><em>Tap a picture to play.</em></h1></section>${upNextCard ? `<section class="up-next" aria-label="Up next">${upNextCard}</section>` : ''}<div class="sectionhead"><h2>What shall we play?</h2></div>${shelfChips}${shelfPanel}${howWePlay}${starGarden}<div class="bottom-note"><span style="font-size:25px" aria-hidden="true">🌱</span><div><b>Growing at their own pace.</b> ${note}<br>${lists}${storageOK ? '' : ' Saving is unavailable in this browser.'}</div></div>`;
}
