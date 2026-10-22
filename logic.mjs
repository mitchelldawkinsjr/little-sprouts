export function gateQuestion(rand = Math.random) {
  const teen = () => 11 + Math.floor(rand() * 9);
  const a = teen();
  const b = teen();
  return { a, b, answer: a + b, text: `What is ${a} + ${b}?` };
}

export function gateOk(value, answer) {
  const text = String(value).trim();
  return /^\d+$/.test(text) && Number.isInteger(answer) && Number(text) === answer;
}

export function validWord(word) {
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

export function candidateWords(words, mode) {
  if (mode !== 'build') return words;
  const longer = words.filter(w => w.replace(/'/g, '').length > 1);
  return longer.length ? longer : words;
}

export function laneCount(level, wordCount) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  const want = [3, 4, 5][index];
  return Math.min(want, Math.max(0, wordCount | 0));
}

export function rocketSubject(index) {
  return index % 2 === 0 ? 'math' : 'words';
}

export function fuelSeconds(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return [18, 12, 8][index];
}

export function distractorLetters(word, level) {
  const count = level >= 3 ? 2 : level === 2 ? 1 : 0;
  const used = new Set([...word.toLowerCase()]);
  return [...'abcdefghijklmnopqrstuvwxyz'].filter(ch => !used.has(ch)).slice(0, count);
}

export function blanks(built, target) {
  return [...target].map((_, i) => (i < built.length ? built[i] : '_')).join(' ');
}

export function starChip(profile) {
  const noun = profile.stars === 1 ? 'star' : 'stars';
  const stars = `${profile.stars} learning ${noun}`;
  if (!profile.total) return stars;
  return `${stars} · ${profile.correct} of ${profile.total} first tries`;
}

export function roundsSentence(profile) {
  const rounds = profile.sessions === 1 ? '1 round' : `${profile.sessions} rounds`;
  return `${rounds} completed · ${profile.correct} of ${profile.total} first tries correct.`;
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

export function levelsVary(globalLevel, skillLevels) {
  return skillLevels.some(level => +level !== +globalLevel);
}

export function levelSummary(globalLevel, skillLevels, rounds) {
  const challenges = `${rounds} little challenges`;
  return levelsVary(globalLevel, skillLevels) ? challenges : `Level ${globalLevel} · ${challenges}`;
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
    sessions: profile.sessions + 1,
    correct: profile.correct + firstCorrect,
    total: profile.total + rounds,
    skills
  };
}

export const STAGES = [
  ['preschool', 'Preschool'],
  ['kindergarten', 'Kindergarten'],
  ['grade4', '4th grade']
];

export function stageOf(profile, index = 0) {
  const raw = profile?.stage;
  if (raw === 'preschool' || raw === 'kindergarten' || raw === 'grade4') return raw;
  return ['preschool', 'kindergarten', 'grade4'][index] || 'preschool';
}

export function stageLabel(stage) {
  return STAGES.find(([id]) => id === stage)?.[1] || 'Preschool';
}

export function mathBlurb(stage, id) {
  if (id === 'catch') {
    return {
      preschool: 'Catch the number that answers the question.',
      kindergarten: 'Catch how many, and hops that add or take away.',
      grade4: 'Catch the product as the answers fall.'
    }[stage];
  }
  if (id === 'count') {
    return {
      preschool: 'Count a few pictures. Start small.',
      kindergarten: 'Count groups up to 10, then 20.',
      grade4: 'Arrays, times tables, and multi-digit multiplication.'
    }[stage];
  }
  return {
    preschool: 'Find numbers and say which is more.',
    kindergarten: 'Before, after, and hops that add or take away.',
    grade4: 'Skip-counting, multiples, factors, and primes.'
  }[stage];
}

export function numberRange(lo, hi) {
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
}

export function nearbyChoices(target, lo, hi, count, rand = Math.random) {
  const pool = numberRange(lo, hi)
    .filter(n => n !== target)
    .sort((a, b) => Math.abs(a - target) - Math.abs(b - target) || a - b)
    .slice(0, count + 1);
  const picked = [];
  while (picked.length < count - 1 && pool.length) picked.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return [...picked, target];
}

export function countMax(stage, level, style) {
  const max = {
    preschool: [5, 8, 10],
    kindergarten: [10, 20, 20],
    grade4: [12, 12, 12]
  }[stage][level - 1];
  return style === 'hunt' && stage !== 'grade4' ? Math.min(max, 10) : max;
}

const between = (lo, hi, rand) => lo + Math.floor(rand() * (hi - lo + 1));
const times = n => (n === 1 ? 'once' : `${n} times`);

export function countQuestion(stage, level, style, rand = Math.random, facts) {
  if (stage === 'grade4') return gradeCount(level, rand, facts);
  const max = countMax(stage, level, style);
  const target = between(1, max, rand);
  return {
    kind: 'count', target, show: 'items', floor: true, max,
    lo: 1, hi: max, question: `How many? Count them!`
  };
}

export function pathQuestion(stage, level, rand = Math.random, facts) {
  const pickKind = kinds => kinds[Math.floor(rand() * kinds.length)];
  if (stage === 'preschool') {
    const kinds = [['find'], ['find', 'after'], ['after', 'before', 'more']][level - 1];
    const hi = [5, 8, 10][level - 1];
    return earlyPath(pickKind(kinds), hi, rand);
  }
  if (stage === 'kindergarten') {
    const kinds = [['find'], ['after', 'before', 'more'], ['add', 'take']][level - 1];
    const hi = [10, 10, 10][level - 1];
    const hop = level === 3 ? 5 : 3;
    return earlyPath(pickKind(kinds), hi, rand, hop);
  }
  const kinds = [['next', 'multipleOf'], ['next', 'multipleOf'], ['factor', 'common', 'prime']][level - 1];
  return gradePath(pickKind(kinds), level, rand, facts);
}

function earlyPath(kind, hi, rand, hop = 3) {
  const floor = true;
  if (kind === 'find') {
    const target = between(1, hi, rand);
    return { kind, target, lo: 1, hi, floor, question: `Find the number ${target}.` };
  }
  if (kind === 'after') {
    const a = between(0, hi - 1, rand);
    return { kind, a, target: a + 1, lo: 0, hi, floor, question: `What number comes after ${a}?` };
  }
  if (kind === 'before') {
    const a = between(1, hi, rand);
    return { kind, a, target: a - 1, lo: 0, hi, floor, question: `What number comes before ${a}?` };
  }
  if (kind === 'more') {
    const a = between(0, hi, rand);
    let b = between(0, hi - 1, rand);
    if (b >= a) b++;
    return { kind, a, b, target: Math.max(a, b), choices: [a, b], lo: 0, hi, floor, question: `Which is more, ${a} or ${b}?` };
  }
  if (kind === 'add') {
    const a = between(0, hi - 1, rand), b = between(1, Math.min(hop, hi - a), rand);
    return { kind, a, b, target: a + b, lo: 0, hi, floor, question: `Start at ${a}. Hop ${b} more. Where do you land?` };
  }
  const a = between(1, hi, rand), b = between(1, Math.min(hop, a), rand);
  return { kind, a, b, target: a - b, lo: 0, hi, floor, question: `Start at ${a}. Hop back ${b}. Where do you land?` };
}

const pickFrom = (list, rand) => list[Math.floor(rand() * list.length)];
const shuffleWith = (list, rand) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const uniqueOthers = (list, target) => [...new Set(list)].filter(n => Number.isInteger(n) && n > 0 && n !== target);
const productPool = (a, b) => uniqueOthers([(a + 1) * b, (a - 1) * b, a * (b + 1), a * (b - 1), a + b, a * b + 10, a * b - 10, a * b + 1, a * b - 1], a * b);
const g4 = q => ({ show: 'none', floor: false, grade: true, lo: 1, hi: q.target * 2 + 10, ...q });

function factNumbers(facts, fallback) {
  const nums = [...new Set((facts || []).map(Number).filter(n => Number.isInteger(n) && n >= 2 && n <= 12))];
  return nums.length ? nums : fallback;
}

function gradeCount(level, rand, facts) {
  if (level === 1) {
    const rows = between(2, 5, rand), cols = between(2, 6, rand), target = rows * cols;
    return g4({
      kind: 'array', rows, cols, target, show: 'array',
      pool: uniqueOthers([(rows + 1) * cols, (rows - 1) * cols, rows * (cols + 1), rows * (cols - 1), rows + cols], target),
      question: `${rows} rows of ${cols}. How many in all?`
    });
  }
  if (level === 2) {
    const tables = factNumbers(facts, numberRange(2, 12));
    const a = pickFrom(tables, rand), b = pickFrom(tables, rand);
    if (rand() < 0.3) {
      return g4({
        kind: 'missing', a, b, product: a * b, target: a, lo: 1, hi: 12,
        question: `What times ${b} makes ${a * b}?`
      });
    }
    return g4({ kind: 'mul', a, b, target: a * b, pool: productPool(a, b), question: `What is ${a} × ${b}?` });
  }
  const kind = pickFrom(['mul21', 'mul21', 'tens', 'mul22'], rand);
  if (kind === 'tens') {
    const a = between(2, 9, rand) * 10, b = between(2, 9, rand);
    return g4({ kind, a, b, target: a * b, pool: uniqueOthers([a * b / 10, (a + 10) * b, (a - 10) * b, a * (b + 1), a * (b - 1), a * b * 10], a * b), question: `What is ${a} × ${b}?` });
  }
  if (kind === 'mul22') {
    const a = between(11, 19, rand), b = between(11, 15, rand);
    return g4({ kind, a, b, target: a * b, pool: uniqueOthers([a * (b - 10) + a, a * b + 10, a * b - 10, a * (b + 1), (a + 1) * b, a * b + 100], a * b), question: `What is ${a} × ${b}?` });
  }
  let a = between(12, 49, rand);
  if (a % 10 === 0) a++;
  const b = between(3, 9, rand), tens = a - (a % 10), ones = a % 10;
  return g4({
    kind, a, b, tens, ones, target: a * b,
    pool: uniqueOthers([tens * b + ones, tens * b + ones * b + 10, a * b - 10, a * (b + 1), a * (b - 1), (a + 1) * b], a * b),
    question: `What is ${a} × ${b}?`
  });
}

const FACTOR_TARGETS = [12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 54, 56, 60, 63, 64, 72, 84, 90, 96];
const COMMON_PAIRS = [[2, 3], [2, 5], [3, 4], [3, 5], [4, 5], [4, 6], [2, 7], [3, 7]];
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
const TRICKY_COMPOSITES = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 4, 6, 8, 10, 12, 14, 22];
const lcm = (a, b) => { let m = Math.max(a, b); while (m % a || m % b) m++; return m; };

function gradePath(kind, level, rand, facts) {
  if (kind === 'next') {
    const n = pickFrom(factNumbers(facts, level === 1 ? [2, 3, 4, 5, 10] : [6, 7, 8, 9, 11, 12]), rand), k = between(1, 6, rand);
    const strip = [n * k, n * (k + 1), n * (k + 2)], target = n * (k + 3);
    return g4({
      kind, n, strip, target, pool: uniqueOthers([target + n, target - 1, target + 1, target + 10, target - 2], target),
      question: `Count by ${n}s: ${strip.join(', ')}… What comes next?`
    });
  }
  if (kind === 'multipleOf') {
    const n = pickFrom(factNumbers(facts, level === 1 ? [2, 5, 10] : [3, 4, 6, 7, 8, 9]), rand), target = n * between(2, 9, rand);
    const near = numberRange(Math.max(2, target - 12), target + 12).filter(x => x % n);
    return g4({ kind, n, target, choices: [...shuffleWith(near, rand).slice(0, 3), target], question: `Which number is a multiple of ${n}?` });
  }
  if (kind === 'factor') {
    const big = pickFrom(FACTOR_TARGETS, rand);
    const factors = numberRange(2, big - 1).filter(d => big % d === 0 && d <= 12);
    const target = pickFrom(factors, rand);
    const non = numberRange(2, 15).filter(d => big % d);
    return g4({ kind, big, target, choices: [...shuffleWith(non, rand).slice(0, 3), target], question: `Which number is a factor of ${big}?` });
  }
  if (kind === 'common') {
    const [a, b] = pickFrom(COMMON_PAIRS, rand), both = lcm(a, b);
    const target = both * between(1, Math.max(1, Math.floor(60 / both)), rand);
    const one = numberRange(2, 60).filter(x => (x % a === 0) !== (x % b === 0));
    return g4({ kind, a, b, target, choices: [...shuffleWith(one, rand).slice(0, 3), target], question: `Which number is a multiple of both ${a} and ${b}?` });
  }
  const target = pickFrom(PRIMES, rand);
  return g4({ kind: 'prime', target, choices: [...shuffleWith(TRICKY_COMPOSITES, rand).slice(0, 3), target], question: 'Which number is prime?' });
}

export function choicesFor(q, count, rand = Math.random) {
  if (q.choices) return q.choices;
  if (q.pool?.length >= count - 1) return [...shuffleWith(q.pool, rand).slice(0, count - 1), q.target];
  const picked = q.pool || [];
  const fill = nearbyChoices(q.target, q.lo, q.hi, count + picked.length, rand).filter(n => n !== q.target && !picked.includes(n));
  return [...picked, ...fill].slice(0, count - 1).concat(q.target);
}

export function grade4Prompt(q, style, options = q.choices) {
  if (style !== 'move' && style !== 'hunt') return q.question;
  if (q.choices && options) {
    const list = options.length > 1 ? `${options.slice(0, -1).join(', ')}, or ${options.at(-1)}` : String(options[0]);
    q = { ...q, question: `${q.question.replace(/\?$/, '')}: ${list}?` };
  }
  if (style === 'move') {
    const moves = {
      array: () => `Clap ${q.rows} rows of ${q.cols}: clap ${q.cols} times, pause, and do that ${q.rows} times. How many claps in all?`,
      mul: () => `${q.a} × ${q.b}: jump and skip-count by ${q.b}s. Stop after ${q.a} jumps. What number did you land on?`,
      missing: () => `Jump and skip-count by ${q.b}s until you say ${q.product}. How many jumps did it take?`,
      mul21: () => `${q.a} × ${q.b}: take ${q.b} giant steps counting by ${q.tens}s, then ${q.b} baby steps adding ${q.ones} each time. Where did you land?`,
      tens: () => `${q.a} × ${q.b}: take ${q.b} giant steps counting by ${q.a}s. Where did you land?`,
      next: () => `Jump and count by ${q.n}s: ${q.strip.join(', ')}… One more jump. What number?`,
      multipleOf: () => `${q.question} Skip-count by ${q.n}s with a jump on each one to check.`,
      factor: () => `${q.question} Pick one and skip-count by it with jumps. Do you land right on ${q.big}?`,
      common: () => `${q.question} Clap counting by ${q.a}s, then stomp counting by ${q.b}s. Which number did you say both times?`,
      prime: () => `${q.question} Try to clap each one out in equal rows. A prime only works as one row!`
    };
    return moves[q.kind]?.() || `${q.question} Tell a grown-up the answer.`;
  }
  if (style === 'hunt') {
    if (q.kind === 'array') return `Build ${q.rows} rows of ${q.cols} with spoons, coins or blocks. How many in all?`;
    if (q.kind === 'mul' && q.target <= 40) return `Build ${q.a} groups of ${q.b} with small things around you. How many in all?`;
    if (q.kind === 'missing' && q.product <= 40) return `Count out ${q.product} small things and share them into groups of ${q.b}. How many groups?`;
    if (['next', 'multipleOf', 'common'].includes(q.kind)) return `${q.question} Check with a calendar or a 100 chart!`;
    return `${q.question} Say the answer out loud.`;
  }
}

export function pathPrompt(q, style, verb = 'Hop') {
  if (style === 'hunt') {
    if (!q.floor) return `${q.question} Say the answer out loud.`;
    return q.kind === 'find'
      ? `Find the number ${q.target} on a clock, a book, or a door!`
      : `${q.question} Then find that number on a clock, a book, or a sign!`;
  }
  if (style !== 'move') return q.question;
  if (!q.floor) return `${q.question} Tell a grown-up the answer.`;
  return {
    find: `${verb} to number ${q.target}!`,
    after: `Stand on ${q.a}. Take one giant step forward. What number are you on?`,
    before: `Stand on ${q.a}. Take one giant step back. What number are you on?`,
    more: `Which is more, ${q.a} or ${q.b}? ${verb} to it!`,
    add: `Stand on ${q.a}. Hop forward ${times(q.b)}. What number are you on?`,
    take: `Stand on ${q.a}. Hop back ${times(q.b)}. What number are you on?`
  }[q.kind] || q.question;
}

export function mathHint(q, mode) {
  const kind = q?.kind;
  if (mode === 'count' && kind === 'count') return `Touch each one as you count. Look for ${q.target}.`;
  if (kind === 'array') return `Skip-count the rows. Each row has ${q.cols}.`;
  if (kind === 'mul') return `Think of ${q.a} groups of ${q.b}. Skip-count by ${q.b}s.`;
  if (kind === 'missing') return `Skip-count by ${q.b}s until you reach ${q.product}. Count the skips.`;
  if (kind === 'mul21') return `Break it apart: ${q.tens} × ${q.b}, plus ${q.ones} × ${q.b}.`;
  if (kind === 'tens') return `Work out ${q.a / 10} × ${q.b}, then make it ten times bigger.`;
  if (kind === 'mul22') return `Break ${q.b} into 10 and ${q.b - 10}: ${q.a} × 10, plus ${q.a} × ${q.b - 10}.`;
  if (kind === 'next') return `Add ${q.n} to the last number.`;
  if (kind === 'multipleOf') return `Skip-count by ${q.n}s. Which choice do you land on?`;
  if (kind === 'factor') return `Skip-count by each choice. Which one lands exactly on ${q.big}?`;
  if (kind === 'common') return `List the ${q.a}s and the ${q.b}s. Which choice is on both lists?`;
  if (kind === 'prime') return 'A prime has only two factors: 1 and itself. The others can be split into equal groups.';
  if (mode === 'path' && q?.floor) return `Count along the numbers with your finger. Look for ${q.target}.`;
  return `Look for ${q?.target}.`;
}

export function mathTip(q, mode, target) {
  const kind = q?.kind;
  if (kind === 'count') return `Ask: can you show me ${target} on your fingers?`;
  if (kind === 'array') return `Ask: what multiplication fact matches ${q.rows} rows of ${q.cols}?`;
  if (kind === 'mul' || kind === 'tens') return `Ask: what is ${q.b} × ${q.a}? Does flipping the order change the answer?`;
  if (kind === 'missing') return `Ask: what division fact goes with ${target} × ${q.b} = ${q.product}?`;
  if (kind === 'mul21' || kind === 'mul22') return 'Ask: how did you break the numbers apart?';
  if (kind === 'next' || kind === 'multipleOf') return `Ask: what are the next three multiples of ${q.n}?`;
  if (kind === 'factor') return `Ask: what number goes with ${target} to make ${q.big}?`;
  if (kind === 'common') return `Ask: what is the smallest number that is a multiple of both ${q.a} and ${q.b}?`;
  if (kind === 'prime') return `Ask: why can’t ${target} be made into equal rows?`;
  if (mode === 'path') return `Ask: what number is one more than ${target}?`;
  return 'Ask: how did you know?';
}

export function numberDeck(stage, countLevel, pathLevel) {
  if (stage === 'grade4') return numberRange(0, 12);
  if (stage === 'preschool') return numberRange(1, countMax(stage, Math.max(countLevel, pathLevel), 'move'));
  return numberRange(0, Math.max(countMax(stage, countLevel, 'move'), pathLevel > 1 ? 10 : 10));
}

export function resetProgress(profile) {
  return { ...profile, stars: 0, sessions: 0, correct: 0, total: 0, skills: {} };
}

const SHEET_GAMES = { words: 'words', word: 'words', count: 'count', hunt: 'hunt', facts: 'facts', fact: 'facts' };

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

export function mergeSheets(base, overlay) {
  const defaults = base?.rows || [];
  const extra = overlay?.rows || [];
  const games = [...new Set(extra.map(row => row.game))];
  const rows = [...defaults.filter(row => !games.includes(row.game)), ...extra];
  return { rows, note: rows.length ? 'ok' : (base?.note || 'empty'), games };
}
