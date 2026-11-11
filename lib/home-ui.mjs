/**
 * Home screen HTML builders. app.js still owns state and click handlers.
 */

export const SHELF_META = [
  { id: 'shapes', label: 'Shapes and colors' },
  { id: 'words', label: 'Words' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'adventures', label: 'Adventures' }
];

const SHELF_OF = {
  shapes: 'shapes', colors: 'shapes', mix: 'shapes', missing: 'shapes', puzzle: 'shapes', match: 'shapes', marble: 'shapes', crayon: 'shapes', sort: 'shapes', merge: 'shapes',
  words: 'words', build: 'words', lanes: 'words', verse: 'words',
  count: 'numbers', path: 'numbers', catch: 'numbers', quickmath: 'numbers'
};

export function shelfOf(id, sidecarShelf) {
  return SHELF_OF[id] || sidecarShelf || 'adventures';
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

export function spriteHtml(kind) {
  const eyes = '<i class="eye l"></i><i class="eye r"></i>';
  if (kind === 'bear') return `<span class="buddy-sprite bear" aria-hidden="true"><i class="ear l"></i><i class="ear r"></i><i class="head">${eyes}<i class="snout"></i></i><i class="body"></i></span>`;
  if (kind === 'bunny') return `<span class="buddy-sprite bunny" aria-hidden="true"><i class="ear l"></i><i class="ear r"></i><i class="head">${eyes}<i class="nose"></i></i><i class="body"></i></span>`;
  if (kind === 'frog') return `<span class="buddy-sprite frog" aria-hidden="true"><i class="head">${eyes}<i class="nose"></i></i><i class="body"></i></span>`;
  if (kind === 'owl') return `<span class="buddy-sprite owl" aria-hidden="true"><i class="ear l"></i><i class="ear r"></i><i class="head">${eyes}<i class="nose"></i></i><i class="body"></i></span>`;
  if (kind === 'chick') return `<span class="buddy-sprite chick" aria-hidden="true"><i class="head">${eyes}<i class="nose"></i></i><i class="ear l"></i><i class="ear r"></i><i class="body"></i></span>`;
  return `<span class="buddy-sprite fox" aria-hidden="true"><i class="ear l"></i><i class="ear r"></i><i class="head">${eyes}<i class="nose"></i></i><i class="body"></i><i class="tail"></i></span>`;
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
    return `<${tag} class="sprout-card${mine ? ' mine' : ''}${row.rank === 1 && row.stars ? ' lead' : ''}"${type}${learner}${current} style="--grow:${row.grow}"><span class="float-stars" aria-hidden="true">${bits}</span>${spriteHtml(row.sprite)}<i class="stand" aria-hidden="true"></i><b>${esc(row.name)}</b><span class="points">${row.stars} ${noun}</span><span class="earned${row.earned ? '' : ' quiet-earn'}">${earned}</span></${tag}>`;
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
  return `<div class="learnerbar"><div class="profiles"><span class="profile selected"><span class="avatar" aria-hidden="true">${avatar}</span><span>${learnerName}</span></span></div><div class="stars"><span aria-hidden="true">⭐</span> ${starsChip}</div></div><section class="home-hello"><h1>Hi, ${learnerName}.<br><em>Tap a picture to play.</em></h1></section>${upNextCard ? `<section class="up-next" aria-label="Up next">${upNextCard}</section>` : ''}<div class="sectionhead"><h2>What shall we play?</h2></div>${shelfChips}${shelfPanel}${howWePlay}${starGarden}<div class="bottom-note"><span style="font-size:25px" aria-hidden="true">🌱</span><div><b>Growing at their own pace.</b> ${note}<br>${lists}${storageOK ? '' : ' Saving is unavailable in this browser.'}</div></div>`;
}
