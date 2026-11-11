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

const STAGES = [
  ['preschool', 'Pre-K'],
  ['kindergarten', 'Kindergarten'],
  ['grade1', '1st grade'],
  ['grade2', '2nd grade'],
  ['grade3', '3rd grade'],
  ['grade4', '4th grade']
];
const STAGE_IDS = new Set(STAGES.map(([id]) => id));

export function stageOf(profile, index = 0) {
  const raw = profile?.stage;
  if (STAGE_IDS.has(raw)) return raw;
  return ['preschool', 'kindergarten', 'grade4'][index] || 'preschool';
}

export function stageLabel(stage) {
  return STAGES.find(([id]) => id === stage)?.[1] || 'Pre-K';
}

const MATH_BLURB = {
  catch: {
    preschool: 'Catch the number that answers the question.',
    kindergarten: 'Catch how many. Later, hops that add or take away.',
    grade1: 'Catch sums and differences within 20.',
    grade2: 'Catch sums and differences within 100.',
    grade3: 'Catch the product as the answers fall.',
    grade4: 'Catch the product as the answers fall.'
  },
  count: {
    preschool: 'Count a few pictures. Start small.',
    kindergarten: 'Count groups up to 5, then 10, then 20.',
    grade1: 'Count up to 20. Add and take away within 20.',
    grade2: 'Add and take away within 20, then within 100.',
    grade3: 'Arrays and times tables through 10.',
    grade4: 'Arrays, times tables, and multi-digit multiplication.'
  },
  path: {
    preschool: 'Find numbers and say which is more.',
    kindergarten: 'Find numbers through 5, then before and after, then hops that add or take away.',
    grade1: 'Add and take away within 10, then within 20.',
    grade2: 'Add and take away within 100, then skip-count by 2s, 5s, and 10s.',
    grade3: 'Skip-count, find multiples, then find a factor.',
    grade4: 'Skip-counting, multiples, factors, and primes.'
  }
};

export function mathBlurb(stage, id) {
  const lines = MATH_BLURB[id] || MATH_BLURB.path;
  return lines[stage] || MATH_BLURB.path.preschool;
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

const COUNT_MAX = {
  preschool: [5, 8, 10],
  kindergarten: [5, 10, 20],
  grade1: [10, 20, 20],
  grade2: [20, 20, 20],
  grade3: [12, 12, 12],
  grade4: [12, 12, 12]
};

function multiplies(stage) {
  return stage === 'grade3' || stage === 'grade4';
}

export function countMax(stage, level, style) {
  const row = COUNT_MAX[stage] || COUNT_MAX.preschool;
  const max = row[Math.min(3, Math.max(1, level)) - 1];
  return style === 'hunt' && !multiplies(stage) ? Math.min(max, 10) : max;
}

const between = (lo, hi, rand) => lo + Math.floor(rand() * (hi - lo + 1));
const times = n => (n === 1 ? 'once' : `${n} times`);

const EARLY_PATH = {
  preschool: {
    kinds: [['find'], ['find', 'after'], ['after', 'before', 'more']],
    hi: [5, 8, 10],
    hop: [3, 3, 3]
  },
  kindergarten: {
    kinds: [['find'], ['after', 'before', 'more'], ['add', 'take']],
    hi: [5, 10, 10],
    hop: [3, 3, 5]
  },
  grade1: {
    kinds: [['add', 'take'], ['add', 'take'], ['add', 'take', 'before', 'after']],
    hi: [10, 20, 20],
    hop: [5, 10, 10]
  },
  grade2: {
    kinds: [['add', 'take'], ['add', 'take'], ['add', 'take', 'next']],
    hi: [20, 100, 100],
    hop: [10, 10, 20]
  }
};
const GRADE3_TABLES = {
  1: [2, 5, 10],
  2: [2, 5, 10],
  3: [2, 3, 4, 5, 6, 7, 8, 9, 10]
};

export function countQuestion(stage, level, style, rand = Math.random, facts) {
  const step = Math.min(3, Math.max(1, level));
  if (stage === 'grade4') return gradeCount(step, rand, facts);
  if (stage === 'grade3') return grade3Count(step, rand);
  const max = countMax(stage, step, style);
  const target = between(1, max, rand);
  return {
    kind: 'count', target, show: 'items', floor: true, max,
    lo: 1, hi: max, question: `How many? Count them!`
  };
}

function grade3Count(level, rand) {
  if (level === 1) return gradeCount(1, rand);
  return tableQuestion(GRADE3_TABLES[level], rand);
}

export function pathQuestion(stage, level, rand = Math.random, facts) {
  const pickKind = kinds => kinds[Math.floor(rand() * kinds.length)];
  const step = Math.min(3, Math.max(1, level));
  const plan = EARLY_PATH[stage];
  if (plan) {
    const kind = pickKind(plan.kinds[step - 1]);
    if (kind === 'next') return gradePath('next', 1, rand, { tables: [2, 5, 10], decades: [], double: false });
    return earlyPath(kind, plan.hi[step - 1], rand, plan.hop[step - 1]);
  }
  if (stage === 'grade3') {
    const kinds = [['next'], ['next', 'multipleOf'], ['multipleOf', 'factor']][step - 1];
    return gradePath(pickKind(kinds), step === 1 ? 1 : 2, rand, { tables: GRADE3_TABLES[step], decades: [], double: false });
  }
  const kinds = [['next', 'multipleOf'], ['next', 'multipleOf'], ['factor', 'common', 'prime']][step - 1];
  return gradePath(pickKind(kinds), step, rand, facts);
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

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const pickFrom = (list, rand) => list[Math.floor(rand() * list.length)];
export const shuffle = (list, rand = Math.random) => {
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

const FACT_OFF = /^(off|hide|no|skip|false)$/i;

function asFactSet(facts) {
  if (!facts) return null;
  if (Array.isArray(facts)) {
    const tables = [...new Set(facts.map(Number).filter(n => Number.isInteger(n) && n >= 2 && n <= 12))];
    return tables.length ? { tables, decades: [], double: false } : null;
  }
  if (typeof facts === 'object') return facts;
  return null;
}

function decadesIn(text) {
  return [...String(text).matchAll(/([1-9])0s?/gi)].map(match => Number(match[1]) * 10);
}

function readCap(item, extra) {
  if (item === 'cap' || item === 'max' || item === 'under') {
    if (FACT_OFF.test(extra)) return null;
    const n = Number(extra);
    return Number.isInteger(n) && n >= 2 && n <= 90 ? n : 12;
  }
  if (item === 'above') {
    if (FACT_OFF.test(extra) || extra === '' || extra === '12') return 12;
    const n = Number(extra);
    return Number.isInteger(n) && n >= 2 && n <= 90 ? n : 12;
  }
  return undefined;
}

export function factSetFromRows(rows) {
  const tables = [];
  const decades = [];
  let double = false;
  let enabled = 0;
  let cap = null;
  let sawCap = false;
  for (const row of rows || []) {
    const extra = String(row?.extra || '').trim();
    const item = String(row?.item || '').trim().toLowerCase();
    if (!item) continue;
    const nextCap = readCap(item, extra);
    if (nextCap !== undefined) {
      sawCap = true;
      cap = nextCap;
      continue;
    }
    if (FACT_OFF.test(extra)) continue;
    if (item === 'double' || item === 'digits' || item === 'doubles' || item === 'double digits') {
      double = true;
      enabled += 1;
      decades.push(...decadesIn(extra));
      continue;
    }
    const decade = item.match(/^([1-9])0s$/);
    if (decade) {
      decades.push(Number(decade[1]) * 10);
      enabled += 1;
      continue;
    }
    const n = Number(item);
    if (Number.isInteger(n) && n >= 2 && n <= 12) {
      tables.push(n);
      enabled += 1;
    }
  }
  if (!enabled) return null;
  const limit = sawCap ? cap : null;
  return {
    tables: [...new Set(tables)].filter(n => limit == null || n <= limit).sort((a, b) => a - b),
    decades: [...new Set(decades)].filter(n => n >= 10 && n <= 90 && (limit == null || n <= limit)).sort((a, b) => a - b),
    double,
    cap: limit
  };
}

function tableQuestion(tables, rand) {
  const a = pickFrom(tables, rand);
  const b = pickFrom(tables, rand);
  if (rand() < 0.3) {
    return g4({
      kind: 'missing', a, b, product: a * b, target: a, lo: 1, hi: Math.max(...tables),
      question: `What times ${b} makes ${a * b}?`
    });
  }
  return g4({ kind: 'mul', a, b, target: a * b, pool: productPool(a, b), question: `What is ${a} × ${b}?` });
}

function tensQuestion(decade, rand) {
  const a = decade;
  const b = between(2, 9, rand);
  return g4({
    kind: 'tens', a, b, target: a * b,
    pool: uniqueOthers([a * b / 10, (a + 10) * b, Math.max(0, a - 10) * b, a * (b + 1), a * (b - 1), a * b * 10], a * b),
    question: `What is ${a} × ${b}?`
  });
}

function doubleQuestion(decade, rand, cap) {
  const hi = cap ? Math.min(9, cap - decade) : 9;
  if (hi < 1) return null;
  const ones = between(1, hi, rand);
  const a = decade + ones;
  const b = between(2, 9, rand);
  return g4({
    kind: 'mul21', a, b, tens: decade, ones, target: a * b,
    pool: uniqueOthers([decade * b + ones, decade * b + ones * b + 10, a * b - 10, a * (b + 1), a * (b - 1), (a + 1) * b], a * b),
    question: `What is ${a} × ${b}?`
  });
}

function placedQuestion(set, rand) {
  const kinds = [];
  if (set.double) kinds.push('mul21');
  if (set.decades.length) kinds.push('tens');
  if (!kinds.length) return set.tables.length ? tableQuestion(set.tables, rand) : null;
  const decade = pickFrom(set.decades.length ? set.decades : [10], rand);
  if (pickFrom(kinds, rand) === 'tens' && set.decades.length) return tensQuestion(decade, rand);
  return doubleQuestion(set.decades.length ? decade : 10, rand, set.cap) || (set.tables.length ? tableQuestion(set.tables, rand) : null);
}

function stepNumbers(set, level, fallback) {
  if (!set) return fallback;
  let nums = set.tables.slice();
  if (level > 1) nums = nums.concat(set.decades);
  if (level === 1) {
    const easy = nums.filter(n => [2, 3, 4, 5, 10].includes(n));
    if (easy.length) nums = easy;
  }
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
  const set = asFactSet(facts);
  if (!set) {
    if (level === 2) return tableQuestion(numberRange(2, 12), rand);
    const kind = pickFrom(['mul21', 'mul21', 'mul21', 'tens'], rand);
    if (kind === 'tens') {
      const a = between(2, 9, rand) * 10, b = between(2, 9, rand);
      return g4({ kind, a, b, target: a * b, pool: uniqueOthers([a * b / 10, (a + 10) * b, (a - 10) * b, a * (b + 1), a * (b - 1), a * b * 10], a * b), question: `What is ${a} × ${b}?` });
    }
    let a = between(12, 49, rand);
    if (a % 10 === 0) a += 1;
    const b = between(3, 9, rand), tens = a - (a % 10), ones = a % 10;
    return g4({
      kind: 'mul21', a, b, tens, ones, target: a * b,
      pool: uniqueOthers([tens * b + ones, tens * b + ones * b + 10, a * b - 10, a * (b + 1), a * (b - 1), (a + 1) * b], a * b),
      question: `What is ${a} × ${b}?`
    });
  }
  if (level === 2 && set.tables.length) return tableQuestion(set.tables, rand);
  return placedQuestion(set, rand) || tableQuestion(set.tables.length ? set.tables : [2, 10], rand);
}

const FACTOR_TARGETS = [12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 54, 56, 60, 63, 64, 72, 84, 90, 96];
const COMMON_PAIRS = [[2, 3], [2, 5], [3, 4], [3, 5], [4, 5], [4, 6], [2, 7], [3, 7]];
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
const TRICKY_COMPOSITES = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 4, 6, 8, 10, 12, 14, 22];
const lcm = (a, b) => { let m = Math.max(a, b); while (m % a || m % b) m++; return m; };

function gradePath(kind, level, rand, facts) {
  if (kind === 'next') {
    const n = pickFrom(stepNumbers(asFactSet(facts), level, level === 1 ? [2, 3, 4, 5, 10] : [6, 7, 8, 9, 11, 12]), rand), k = between(1, 6, rand);
    const strip = [n * k, n * (k + 1), n * (k + 2)], target = n * (k + 3);
    return g4({
      kind, n, strip, target, pool: uniqueOthers([target + n, target - 1, target + 1, target + 10, target - 2], target),
      question: `Count by ${n}s: ${strip.join(', ')}… What comes next?`
    });
  }
  if (kind === 'multipleOf') {
    const n = pickFrom(stepNumbers(asFactSet(facts), level, level === 1 ? [2, 5, 10] : [3, 4, 6, 7, 8, 9]), rand), target = n * between(2, 9, rand);
    const near = numberRange(Math.max(2, target - 12), target + 12).filter(x => x % n);
    return g4({ kind, n, target, choices: [...shuffle(near, rand).slice(0, 3), target], question: `Which number is a multiple of ${n}?` });
  }
  if (kind === 'factor') {
    const big = pickFrom(FACTOR_TARGETS, rand);
    const factors = numberRange(2, big - 1).filter(d => big % d === 0 && d <= 12);
    const target = pickFrom(factors, rand);
    const non = numberRange(2, 15).filter(d => big % d);
    return g4({ kind, big, target, choices: [...shuffle(non, rand).slice(0, 3), target], question: `Which number is a factor of ${big}?` });
  }
  if (kind === 'common') {
    const [a, b] = pickFrom(COMMON_PAIRS, rand), both = lcm(a, b);
    const target = both * between(1, Math.max(1, Math.floor(60 / both)), rand);
    const one = numberRange(2, 60).filter(x => (x % a === 0) !== (x % b === 0));
    return g4({ kind, a, b, target, choices: [...shuffle(one, rand).slice(0, 3), target], question: `Which number is a multiple of both ${a} and ${b}?` });
  }
  const target = pickFrom(PRIMES, rand);
  return g4({ kind: 'prime', target, choices: [...shuffle(TRICKY_COMPOSITES, rand).slice(0, 3), target], question: 'Which number is prime?' });
}

export function choicesFor(q, count, rand = Math.random) {
  if (q.choices) return q.choices;
  if (q.pool?.length >= count - 1) return [...shuffle(q.pool, rand).slice(0, count - 1), q.target];
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
  if (multiplies(stage)) return numberRange(0, 12);
  if (stage === 'preschool') return numberRange(1, countMax(stage, Math.max(countLevel, pathLevel), 'move'));
  const plan = EARLY_PATH[stage] || EARLY_PATH.kindergarten;
  const pathHi = plan.hi[Math.min(3, Math.max(1, Math.round(+pathLevel) || 1)) - 1];
  return numberRange(0, Math.max(countMax(stage, countLevel, 'move'), Math.min(20, pathHi)));
}

export function resetProgress(profile) {
  return { ...profile, stars: 0, earned: 0, sessions: 0, correct: 0, total: 0, skills: {} };
}

