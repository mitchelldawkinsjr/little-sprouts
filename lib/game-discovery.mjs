/** Home discovery is independent of the game's learning level or rendering engine. */
export const FEATURED_GAMES = ['blocks', 'boss', 'grass', 'skybound', 'gulp', 'ink-trail', 'chase', 'sketchbook', 'cabin'];

// First source/catalog appearance in Git history, not file modification or update dates.
// Set an explicit YYYY-MM-DD date here when adding a game; old updates keep their date.
export const GAME_ADDED = {
  'shapes': '2026-10-22',
  'colors': '2026-10-22',
  'mix': '2026-10-22',
  'missing': '2026-10-22',
  'words': '2026-10-22',
  'build': '2026-10-22',
  'count': '2026-10-22',
  'path': '2026-10-22',
  'catch': '2026-10-22',
  'lanes': '2026-10-22',
  'rocket': '2026-10-22',
  'lunar': '2026-10-24',
  'hoop': '2026-10-26',
  'light': '2026-10-26',
  'race': '2026-10-24',
  'hook': '2026-10-24',
  'sky': '2026-10-24',
  'planet': '2026-10-24',
  'puzzle': '2026-10-24',
  'match': '2026-10-24',
  'marble': '2026-10-24',
  'bridge': '2026-10-24',
  'maze': '2026-10-24',
  'chase': '2026-10-24',
  'hop': '2026-10-24',
  'toast': '2026-10-24',
  'glide': '2026-10-24',
  'city': '2026-11-11',
  'aisle': '2026-10-24',
  'lily': '2026-10-24',
  'bust': '2026-10-26',
  'mole': '2026-10-26',
  'cube': '2026-10-26',
  'stack': '2026-10-26',
  'lamp': '2026-10-26',
  'trace': '2026-10-24',
  'sort': '2026-10-24',
  'merge': '2026-10-24',
  'crayon': '2026-10-22',
  'verse': '2026-11-11',
  'clue': '2026-11-11',
  'rally': '2026-10-24',
  'flight': '2026-10-24',
  'bike': '2026-10-24',
  'walk': '2026-10-24',
  'paint': '2026-10-24',
  'gulp': '2026-11-13',
  'roll': '2026-11-13',
  'grass': '2026-11-13',
  'dash': '2026-11-13',
  'pinecone-trail': '2026-11-15',
  'pebble': '2026-11-15',
  'boss': '2026-11-14',
  'moon-swing': '2026-11-16',
  'ink-trail': '2026-11-15',
  'cabin': '2026-11-14',
  'glow': '2026-11-13',
  'range': '2026-11-13',
  'blocks': '2026-11-13',
  'skybound': '2026-11-12',
  'fishing': '2026-11-15',
  'inkwave': '2026-11-15',
  'station': '2026-11-15',
  'deliveries': '2026-11-15',
  'canyon-pods': '2026-11-15',
  'sketchbook': '2026-11-15',
  'quickmath': '2026-11-10',
  'paint-rivals': '2026-11-18',
};

// The home New Games row is hand-picked; the full "newest" shelf still sorts by GAME_ADDED.
export const NEW_GAMES = ['bike', 'moon-swing', 'canyon-pods', 'ink-trail', 'dash', 'roll', 'glide'];

export function featuredGames(games, ids = FEATURED_GAMES) {
  const byId = new Map(games.map(game => [game[0], game]));
  return ids.flatMap(id => byId.has(id) ? [byId.get(id)] : []);
}

export function orderGames(games, order = 'featured') {
  const rank = id => {
    const at = FEATURED_GAMES.indexOf(id);
    return at < 0 ? FEATURED_GAMES.length : at;
  };
  return [...games].sort((a, b) => {
    if (order === 'featured') {
      const difference = rank(a[0]) - rank(b[0]);
      if (difference) return difference;
    }
    return (GAME_ADDED[b[0]] || '').localeCompare(GAME_ADDED[a[0]] || '')
      || a[0].localeCompare(b[0]);
  });
}

/** Old profiles with only lastPlayed work without a migration. */
export function recentGameIds(profile = {}) {
  const saved = Array.isArray(profile.recentGames) ? profile.recentGames : [];
  return [...new Set([profile.lastPlayed, ...saved].filter(id => typeof id === 'string' && id))].slice(0, 6);
}

export function rememberGame(profile, id) {
  return [...new Set([id, ...recentGameIds(profile)])].slice(0, 6);
}

export function recentGames(games, profile) {
  const byId = new Map(games.map(game => [game[0], game]));
  return recentGameIds(profile).flatMap(id => byId.has(id) ? [byId.get(id)] : []);
}
