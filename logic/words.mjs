function validWord(word) {
  if (!/^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(word)) return false;
  const letters = word.replace(/'/g, '').length;
  return letters >= 1 && letters <= 12;
}

export function parseWords(text) {
  const words = [...new Map(
    String(text).split(/[,\n]/).map(w => w.trim()).filter(Boolean).map(w => [w.toLowerCase(), w])
  ).values()];
  return { words, ok: words.length >= 3 && words.every(validWord) };
}

export function wordsFromSheet(rows, name, stage) {
  const list = (rows || []).filter(row => row && row.game === 'words' && String(row.item || '').trim());
  const who = String(name || '').trim().toLowerCase();
  const band = String(stage || '').trim().toLowerCase();
  const learnerOf = row => String(row.learner || '*').trim().toLowerCase() || '*';
  const grade4Only = new Set();
  if (band !== 'grade4') {
    for (const row of list) {
      if (learnerOf(row) === 'grade4') grade4Only.add(String(row.item).trim().toLowerCase());
    }
  }
  const keep = row => !grade4Only.has(String(row.item).trim().toLowerCase());
  const specific = list.filter(row => {
    const learner = learnerOf(row);
    return learner !== '*' && (learner === who || learner === band) && keep(row);
  });
  const general = list.filter(row => {
    const learner = learnerOf(row);
    return (!learner || learner === '*') && keep(row);
  });
  for (const set of [specific, general]) {
    const parsed = parseWords(set.map(row => row.item).join(','));
    if (parsed.ok) return parsed.words;
  }
  return [];
}

export const STAGE_WORDS = {
  preschool: ['I', 'a', 'the', 'my', 'see', 'and', 'is', 'to', 'go', 'we', 'like', 'can', 'you'],
  kindergarten: ['a', 'and', 'away', 'big', 'can', 'come', 'go', 'help', 'here', 'I', 'in', 'is', 'it', 'look', 'me', 'my', 'play', 'see', 'the', 'to', 'up', 'we', 'you'],
  grade1: ['and', 'you', 'was', 'said', 'have', 'they', 'with', 'from', 'what', 'when', 'your', 'come', 'some'],
  grade2: ['because', 'around', 'before', 'after', 'always', 'which', 'their', 'would', 'could', 'about', 'again', 'every'],
  grade3: ['animal', 'answer', 'carry', 'city', 'earth', 'enough', 'friend', 'listen', 'picture', 'together'],
  grade4: ['Seedling', 'Neighbor', 'Provide', 'Celebrate', 'Method', 'Variable', 'Courage', 'Growth', 'Curious', 'Empathy']
};

/** Sheet rows win. An empty learner list uses that grade’s built-in words. */
export function wordsFor({ words, rows, name, stage } = {}) {
  const band = Object.hasOwn(STAGE_WORDS, stage) ? stage : 'preschool';
  const fromSheet = wordsFromSheet(rows, name, band);
  if (fromSheet.length) return fromSheet;
  const own = [...new Map(
    (Array.isArray(words) ? words : [])
      .map(word => String(word || '').trim())
      .filter(validWord)
      .map(word => [word.toLowerCase(), word])
  ).values()];
  const list = own.length >= 3 ? own : STAGE_WORDS[band];
  return band === 'kindergarten' ? kindergartenWords(list, list) : list;
}

function letterCount(word) {
  return String(word || '').replace(/'/g, '').length;
}

export function kindergartenWords(words, manual = []) {
  const list = Array.isArray(words) ? words : [];
  const extras = [];
  const extraKeys = new Set();
  for (const word of Array.isArray(manual) ? manual : []) {
    const text = String(word || '').trim();
    const n = letterCount(text);
    if (n > 4 && n <= 12 && validWord(text) && !extraKeys.has(text.toLowerCase())) {
      extraKeys.add(text.toLowerCase());
      extras.push(text);
    }
  }
  const kept = [];
  const seen = new Set();
  const push = word => {
    const text = String(word || '').trim();
    const key = text.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    kept.push(text);
  };
  for (const word of list) {
    const text = String(word || '').trim();
    const n = letterCount(text);
    if ((n >= 1 && n <= 4) || extraKeys.has(text.toLowerCase())) push(text);
  }
  for (const word of extras) push(word);
  return kept;
}

export function spellingWords(words, stage, manual = [], level = 3) {
  const list = stage === 'kindergarten' ? kindergartenWords(words, manual) : (Array.isArray(words) ? words : []);
  if (stage !== 'kindergarten') return list;
  const max = (Math.round(+level) || 1) <= 1 ? 3 : 4;
  const extra = new Set((Array.isArray(manual) ? manual : []).map(word => String(word || '').trim().toLowerCase()));
  return list.filter(word => {
    const n = letterCount(word);
    if (n < 2 || n > 12) return false;
    if (n <= max) return true;
    return n > 4 && extra.has(String(word).trim().toLowerCase());
  });
}

export function candidateWords(words, mode) {
  if (mode !== 'build') return words;
  const longer = words.filter(w => w.replace(/'/g, '').length > 1);
  return longer.length ? longer : words;
}


const SHEET_GAMES = { words: 'words', word: 'words', count: 'count', hunt: 'hunt', facts: 'facts', fact: 'facts', verse: 'verse' };

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  const s = String(text).replace(/^\uFEFF/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some(x => String(x).trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some(x => String(x).trim())) rows.push(row);
  }
  return rows;
}

export function parseSheet(text) {
  const table = parseCsv(text);
  if (!table.length) return { rows: [], note: 'empty' };
  const head = table[0].map(h => String(h).trim().toLowerCase());
  const col = (...names) => names.map(n => head.indexOf(n)).find(i => i >= 0) ?? -1;
  const learner = col('learner', 'name');
  const game = col('game');
  const item = col('item', 'word');
  const extra = col('extra');
  if (game < 0 || item < 0) return { rows: [], note: 'columns' };
  const rows = [];
  for (const line of table.slice(1)) {
    const kind = SHEET_GAMES[String(line[game] || '').trim().toLowerCase()];
    const value = String(line[item] || '').trim();
    if (!kind || !value) continue;
    const who = learner < 0 ? '*' : String(line[learner] || '').trim() || '*';
    const hide = col('hide', 'off');
    if (hide >= 0 && /^(1|y|yes|true|hide|off|skip)$/i.test(String(line[hide] || '').trim())) continue;
    rows.push({ learner: who, game: kind, item: value, extra: extra < 0 ? '' : String(line[extra] || '').trim() });
  }
  return { rows, note: rows.length ? 'ok' : 'none' };
}

function withNewFacts(defaults, extra) {
  const seen = new Set(extra.filter(row => row.game === 'facts').map(row => String(row.item).trim().toLowerCase()));
  const added = defaults.filter(row => row.game === 'facts' && !seen.has(String(row.item).trim().toLowerCase()));
  return added.length ? [...extra, ...added] : extra;
}

export function mergeSheets(base, overlay) {
  const defaults = base?.rows || [];
  const extra = overlay?.rows || [];
  const games = [...new Set(extra.map(row => row.game))];
  const rows = withNewFacts(defaults, [...defaults.filter(row => !games.includes(row.game)), ...extra]);
  return { rows, note: rows.length ? 'ok' : (base?.note || 'empty'), games };
}
