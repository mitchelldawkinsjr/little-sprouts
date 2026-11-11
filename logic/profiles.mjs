export function starChip(profile) {
  const noun = profile.stars === 1 ? 'star' : 'stars';
  const stars = `${profile.stars} learning ${noun}`;
  if (!profile.total) return stars;
  return `${stars} · ${profile.correct} of ${profile.total} first tries`;
}

/** Sprout sprites grow as learning stars add up. */
export function spriteGrow(stars) {
  const n = Math.max(0, Math.floor(+stars) || 0);
  if (n >= 40) return 5;
  if (n >= 20) return 4;
  if (n >= 8) return 3;
  if (n >= 1) return 2;
  return 1;
}

export const SPRITES = ['fox', 'bear', 'bunny', 'frog', 'owl', 'chick'];

export function profileSprite(profile, index = 0) {
  if (SPRITES.includes(profile?.sprite)) return profile.sprite;
  return SPRITES[Math.max(0, index | 0) % SPRITES.length];
}

export function nextSprite(profiles) {
  const list = Array.isArray(profiles) ? profiles : [];
  const used = new Set(list.map((profile, index) => profileSprite(profile, index)));
  return SPRITES.find(kind => !used.has(kind)) || SPRITES[list.length % SPRITES.length];
}

export function blankLearner(name = 'New learner', sprite = 'fox') {
  const trimmed = String(name || 'New learner').trim().slice(0, 24);
  return {
    name: trimmed || 'New learner',
    stage: 'preschool',
    level: 1,
    rounds: 5,
    style: 'tap',
    sprite: profileSprite({ sprite }, 0),
    words: ['I', 'a', 'the', 'my', 'see'],
    upNext: '',
    lastPlayed: '',
    stars: 0,
    earned: 0,
    sessions: 0,
    correct: 0,
    total: 0
  };
}

/** Parent pin wins when still listed; otherwise the game after lastPlayed (wraps). */
export function nextUpGame(ids, { upNext = '', lastPlayed = '' } = {}) {
  const list = Array.isArray(ids) ? ids.filter(Boolean) : [];
  if (!list.length) return '';
  const pin = String(upNext || '').trim();
  if (pin && list.includes(pin)) return pin;
  const last = String(lastPlayed || '').trim();
  const at = last ? list.indexOf(last) : -1;
  if (at >= 0) return list[(at + 1) % list.length];
  return list[0];
}

/**
 * Star-garden standings. With no stars yet, learners stay in their usual order.
 * Once someone has stars, the board is a podium: second, first, third.
 */
export function pointBoard(profiles) {
  const rows = (Array.isArray(profiles) ? profiles : []).map((profile, index) => {
    const stars = Math.max(0, Math.floor(+profile?.stars) || 0);
    return {
      index,
      name: String(profile?.name || `Learner ${index + 1}`).trim() || `Learner ${index + 1}`,
      stars,
      earned: Math.max(0, Math.floor(+profile?.earned) || 0),
      grow: spriteGrow(stars),
      sprite: profileSprite(profile, index)
    };
  });
  const ranked = [...rows].sort((a, b) => b.stars - a.stars || a.index - b.index);
  ranked.forEach((row, place) => {
    row.rank = place && row.stars === ranked[place - 1].stars ? ranked[place - 1].rank : place + 1;
  });
  if (!rows.some(row => row.stars > 0) || ranked.length < 3) return ranked;
  return [ranked[1], ranked[0], ranked[2], ...ranked.slice(3)];
}

export function roundsSentence(profile) {
  const rounds = profile.sessions === 1 ? '1 round' : `${profile.sessions} rounds`;
  return `${rounds} completed · ${profile.correct} of ${profile.total} first tries correct.`;
}

const ROUND_CHOICES = [5, 10, 15];

/** Questions in one round. Only 5, 10, or 15. */
export function roundCount(value) {
  const n = Math.round(+value);
  return ROUND_CHOICES.includes(n) ? n : 5;
}

/** How many rally questions fit a stage. Five on a usual round, up to eight on a long one. */
export function rallyQuestionCount(rounds) {
  const n = roundCount(rounds);
  if (n <= 5) return n;
  if (n >= 15) return 8;
  return 7;
}

/** Right answers that open the rest of a rally stage. A usual round opens after five. */
export function rallyClearCount(rounds) {
  return Math.min(5, rallyQuestionCount(rounds));
}

/** Progress marks from just after the start to just before the finish. */
export function rallyGates(count) {
  const stops = Math.max(1, Math.round(+count) || 1);
  return Array.from({ length: stops }, (_, index) => (index + 1) / (stops + 1));
}

export function skillState(record) {
  const rec = record || { total: 0, correct: 0 };
  if (rec.total >= 10 && rec.correct / rec.total >= 0.8) return 'Flourishing';
  if (rec.total) return 'Growing';
  return 'Ready to explore';
}

export function progressKey(style, level) {
  return style === 'tap' ? level : style + level;
}

const STYLE_LABELS = [['tap', 'Tap'], ['move', 'Move'], ['hunt', 'Hunt'], ['reach', 'Reach']];

export function skillStatText(profile, id, level) {
  const parts = STYLE_LABELS.map(([style, label]) => {
    const rec = profile.skills?.[id]?.[progressKey(style, level)];
    if (!rec?.total) return '';
    const rounds = rec.sessions === 1 ? '1 round' : `${rec.sessions} rounds`;
    return `${label} ${rec.correct}/${rec.total} (${rounds})`;
  }).filter(Boolean);
  return parts.length ? `First tries correct · ${parts.join(' · ')}` : 'No practice yet at this level';
}

export function applyRound(profile, mode, key, rounds, firstCorrect) {
  const skills = { ...(profile.skills || {}) };
  const byMode = { ...(skills[mode] || {}) };
  const rec = byMode[key] || { total: 0, correct: 0, sessions: 0 };
  byMode[key] = {
    total: rec.total + rounds,
    correct: rec.correct + firstCorrect,
    sessions: rec.sessions + 1
  };
  skills[mode] = byMode;
  return {
    ...profile,
    stars: profile.stars + rounds,
    earned: Math.max(0, rounds | 0),
    sessions: profile.sessions + 1,
    correct: profile.correct + firstCorrect,
    total: profile.total + rounds,
    skills
  };
}

