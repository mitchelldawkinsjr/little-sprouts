import { gearItem, gearList } from '../logic/shop.mjs?v=shop3';
/**
 * Home screen HTML builders. app.js still owns state and click handlers.
 */

export const SHELF_META = [
  { id: 'calm-create', label: 'Calm & Create', icon: '🎨🧩', note: 'Puzzles & art' },
  { id: 'quick-play', label: 'Quick Play', icon: '⚡🎯', note: 'Short & snappy' },
  { id: 'run-jump-dodge', label: 'Run, Jump & Dodge', icon: '🏃🐸', note: 'Move your buddy' },
  { id: 'drive-fly-aim', label: 'Drive, Fly & Aim', icon: '🚀🚗', note: 'Steer & soar' },
  { id: 'words-numbers', label: 'Words & Numbers', icon: '🔤🔢', note: 'Letters & counting' }
];

/** Games with a painted picture in icons/art (from the Stitch redesign). Others show their emoji. */
export const GAME_ART = new Set(['hop', 'walk', 'catch', 'lanes', 'puzzle', 'gulp', 'lunar', 'lily', 'crayon', 'toast', 'blocks', 'flight', 'bust']);
const artFor = (gid, icon) => GAME_ART.has(gid)
  ? `<img class="art-img" src="icons/art/${gid}.jpg" alt="" loading="lazy" decoding="async">`
  : `<span class="gcard-icon">${icon}</span>`;

/** "Name. Blurb" for read-aloud, without doubling up when the name already ends in ? or !. */
export const spokenLine = (name, blurb) => (/[.!?]$/.test(name) ? `${name} ${blurb}` : `${name}. ${blurb}`);

/** The "every game" tile on the subject row. Not a real shelf, so it stays out of SHELF_META. */
export const ALL_SHELF = { id: 'all', label: 'All Games', icon: '🌈', note: 'Full garden' };

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

/** "Hop off the chair" panel: how we play (Tap, Move, Hunt, Reach), floor cards, and the camera note. */
export function bodyPlayHtml({ learnerName, styleId, styles, cameraOn, arcadeOn }) {
  const info = styles.find(st => st[0] === styleId) || styles[0];
  const buttons = styles.filter(st => st[0] !== 'reach' || cameraOn)
    .map(([id, icon, label]) => `<button type="button" class="stylebtn2${id === styleId ? ' selected' : ''}" data-style="${id}" aria-pressed="${id === styleId}"><span aria-hidden="true">${icon}</span> ${label}</button>`).join('');
  const moveTip = styleId === 'move' ? ' Clear a space, use bare feet or grippy socks, and stay close.' : '';
  return '<section class="bodyplay" aria-labelledby="bodyTitle"><div class="bodyplay-main">'
    + '<div class="bodyplay-tags"><span class="chip chip-go"><span aria-hidden="true">🤸</span> ACTIVE BODY PLAY</span><span class="bodyplay-private">Camera video stays on this device</span></div>'
    + '<h3 id="bodyTitle">Hop off the chair! Play with hands or printed floor cards.</h3>'
    + '<p>Turn a game into active play. <b>Reach</b> follows hands with the camera, right here on the device. Nothing is recorded or saved. Or print floor cards for jumping and counting.</p>'
    + `<div class="bodyplay-styles" role="group" aria-label="How are we playing?">${buttons}</div>`
    + `<p class="bodyplay-note">${info[3]}${moveTip}${arcadeOn ? ' Arcade play is on for this learner.' : ''}</p>`
    + `<div class="bodyplay-actions"><button type="button" class="btn-white" id="printCards"><span aria-hidden="true">🖨</span> Print ${learnerName}’s floor cards</button>`
    + `<span class="cam-chip"><span aria-hidden="true">📷</span> Reach camera: <b>${cameraOn ? 'On' : 'Off'}</b></span></div></div>`
    + '<div class="pose-card" aria-hidden="true"><div class="pose-head"><span>REACH TIPS</span><i></i></div><div class="pose-hands"><span>✋</span><small>Both hands</small><span>🤚</span></div><p>Stand back so both shoulders and hands fit in the camera view.</p></div>'
    + '</section>';
}

/** Keyboard keys and the offline save state, side by side under the games. */
export function helperBarsHtml() {
  return '<section class="helpbars" id="shortcuts" aria-label="Keyboard and offline">'
    + '<div class="helpbar"><span class="helpbar-title"><span aria-hidden="true">⌨️</span> Shortcuts:</span><span class="keys"><kbd>Space</kbd> Jump <kbd>← →</kbd> Steer <kbd>Enter</kbd> Choose</span></div>'
    + '<div class="helpbar"><span class="helpbar-title"><span aria-hidden="true">☁️</span><span class="offline-copy"><b data-offline-title>Checking offline play…</b><small data-offline-note>Games save to this device while online</small></span></span><span class="chip chip-leaf" data-offline-badge>…</span></div>'
    + '</section>';
}

export function gameCardHtml({ gid, name, blurb, icon, tint, kicker = '', stageLabel, level, state, next = false, esc }) {
  const label = `Play ${name}, ${stageLabel}, Level ${level}, ${state}. ${blurb}`;
  const nextMark = next ? '<span class="gcard-next">Up next</span>' : '';
  return `<article class="gcard${next ? ' is-next' : ''}" style="--tint:${tint}">`
    + `<div class="gcard-art"><button type="button" class="gcard-pic" data-game="${gid}" tabindex="-1" aria-hidden="true">${artFor(gid, icon)}</button>`
    + (Number.isFinite(level) ? `<span class="gcard-chip">Level ${level}</span>` : '') + nextMark
    + `<button type="button" class="gcard-hear" data-hear="${esc(spokenLine(name, blurb))}" aria-label="Hear about ${esc(name)}"><span aria-hidden="true">🔊</span></button></div>`
    + `<div class="gcard-meta"><span class="gcard-kicker">${esc(kicker)}</span><span class="gcard-state">${esc(state)}</span></div>`
    + `<h4 class="gcard-title">${name}</h4><p class="gcard-blurb">${blurb}</p>`
    + `<button type="button" class="gcard-play" data-game="${gid}" aria-label="${esc(label)}"><span aria-hidden="true">▶</span> Play</button></article>`;
}

/** The big "Up next" banner at the top of home. */
export function upNextHeroHtml({ gid, name, blurb, icon, tint, kicker = '', learnerName, stageLabel, level, state, esc }) {
  const filled = Math.max(1, Math.min(3, level || 1));
  const stars = Array.from({ length: 3 }, (_, i) => `<i class="${i < filled ? 'on' : ''}"></i>`).join('');
  return `<section class="hero2" aria-label="Up next" style="--tint:${tint}">`
    + `<div class="hero2-art"><button type="button" class="hero2-pic" data-game="${gid}" tabindex="-1" aria-hidden="true">${GAME_ART.has(gid) ? artFor(gid, icon) : `<span>${icon}</span>`}</button><span class="hero2-tag">${esc(kicker)}</span></div>`
    + `<div class="hero2-copy"><div class="hero2-chips"><span class="chip chip-leaf">Up next for ${learnerName}</span><span class="chip">${esc(stageLabel)}${Number.isFinite(level) ? ` · Level ${level}` : ''}</span><span class="hero2-stars" role="img" aria-label="${esc(state)}">${stars}</span></div>`
    + `<h2 class="hero2-title">${name}</h2><p class="hero2-blurb">${blurb}</p>`
    + `<div class="hero2-actions"><button type="button" class="btn-go" data-game="${gid}"><span aria-hidden="true">▶</span> Play now</button>`
    + `<button type="button" class="btn-soft" data-hear="${esc(spokenLine(name, blurb))}"><span aria-hidden="true">🔊</span> Hear rules</button><span class="hero2-hint">⌨️ <kbd>Space</kbd> <kbd>←</kbd><kbd>→</kbd> or tilt in many games</span></div></div></section>`;
}

export function shelfChipsHtml(available, openId) {
  const total = available.reduce((n, sh) => n + sh.games.length, 0);
  const tiles = [{ ...ALL_SHELF, count: total }, ...available.map(sh => ({ ...sh, count: sh.games.length }))];
  return `<div class="subjects" role="group" aria-label="Game shelves">${tiles.map(t => `<button type="button" class="subject${t.id === openId ? ' selected' : ''}" data-shelf="${t.id}" aria-pressed="${t.id === openId}"><span class="subject-icon" aria-hidden="true">${t.icon || '🌱'}</span><span class="subject-label">${t.label}</span><span class="subject-note">${t.note || 'More games'} · ${t.count}</span></button>`).join('')}</div>`;
}

/** The pill row under the header: the same shelves as the subject tiles. */
export function subnavHtml(available, openId) {
  const tabs = [ALL_SHELF, ...available];
  return `<nav class="subnav" aria-label="Game shelves"><div class="subnav-row">${tabs.map(t => `<button type="button" class="subnav-tab${t.id === openId ? ' selected' : ''}" data-shelf="${t.id}"${t.id === openId ? ' aria-current="true"' : ''}><span class="subject-label">${t.label}</span></button>`).join('')}</div></nav>`;
}

export function shelfPanelHtml(available, openId, nextId, cardFor) {
  const shelf = openId === ALL_SHELF.id
    ? { ...ALL_SHELF, games: available.flatMap(sh => sh.games) }
    : available.find(sh => sh.id === openId) || available[0];
  if (!shelf) return '';
  const cards = shelf.games.map(g => cardFor(g[0], { next: g[0] === nextId })).join('');
  const count = shelf.games.length === 1 ? '1 game' : `${shelf.games.length} games`;
  const title = shelf.id === ALL_SHELF.id ? 'The whole garden' : shelf.label;
  return `<section class="shelf2" aria-labelledby="shelfTitle"><div class="sectionhead2"><h3 id="shelfTitle">${title} <span class="chip">${count}</span></h3><span class="sectionhint">Tap 🔊 to hear about a game</span></div><div class="gcards">${cards}</div></section>`;
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
  stageLabel = '',
  starsChip,
  learnerCount = 1,
  learnerMenu = '',
  progressLine = '',
  subnav = '',
  bodyPlay = '',
  helperBars = '',
  upNextHero = '',
  shelfChips,
  shelfPanel,
  howWePlay,
  starGarden,
  note,
  storageOK,
  lists = 'Change words, math facts, and the question sheet in Parent corner.'
}) {
  const switcher = learnerCount > 1
    ? `<details class="switcher"><summary class="btn-soft"><span aria-hidden="true">👥</span> Switch learner <span class="switcher-n">(${learnerCount})</span></summary><div class="switcher-menu" role="group" aria-label="Learners on this browser"><small class="switcher-head">LEARNERS ON THIS BROWSER</small>${learnerMenu}<button type="button" class="switcher-add" id="addLearner"><span aria-hidden="true">＋</span> Add learner (grown-up)</button></div></details>`
    : '';
  const stage = stageLabel ? `<span class="chip chip-leaf">${stageLabel}</span>` : '';
  return `${subnav}<div class="home2">`
    + '<div class="readbar" id="readBar" role="status" aria-live="polite" hidden><span class="readbar-mark" aria-hidden="true">🔊</span><p id="readLine"></p><button type="button" class="readbar-again" id="readAgain" aria-label="Hear it again"><span aria-hidden="true">↻</span><em> Hear it again</em></button><button type="button" class="readbar-close" id="readClose" aria-label="Close">✕</button></div>'
    + `<section class="greet"><div class="greet-who"><span class="greet-avatar" aria-hidden="true">${avatar}<i>✦</i></span><div><div class="greet-line"><h1>Hi, ${learnerName}!</h1>${stage}<span class="chip chip-sun"><span aria-hidden="true">⭐</span> ${starsChip}</span></div><p class="greet-sub">Tap a picture to play.${progressLine ? `<i class="dot" aria-hidden="true"></i><b>${progressLine}</b>` : ''}</p></div></div>`
    + `<div class="greet-tools">${switcher}<button type="button" class="btn-soft shop-open" id="openShop"><span aria-hidden="true">🛍</span> Star shop</button><button type="button" class="btn-sun" id="listenHome"><span aria-hidden="true">🔊</span> Listen</button></div></section>`
    + upNextHero
    + `<section class="pick" aria-labelledby="pickTitle"><div class="sectionhead2"><h2 id="pickTitle">Pick a garden subject</h2></div>${shelfChips}</section>`
    + `${shelfPanel}${bodyPlay || howWePlay}${helperBars}${starGarden}`
    + `<div class="bottom-note"><span style="font-size:25px" aria-hidden="true">🌱</span><div><b>Growing at their own pace.</b> ${note}<br>${lists}${storageOK ? '' : ' Saving is unavailable in this browser.'}</div></div>`
    + '</div>';
}
