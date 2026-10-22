import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyRound,
  blanks,
  candidateWords,
  choicesFor,
  countMax,
  countQuestion,
  distractorLetters,
  gateOk,
  gateQuestion,
  grade4Prompt,
  levelSummary,
  mathBlurb,
  fuelSeconds,
  laneCount,
  rocketSubject,
  nearbyChoices,
  numberDeck,
  mergeSheets,
  parseSheet,
  parseWords,
  pathPrompt,
  pathQuestion,
  stageOf,
  resetProgress,
  roundsSentence,
  skillStatText,
  skillState,
  starChip
} from './logic.mjs';

test('grown-up check uses a new addition in the teens', () => {
  const first = gateQuestion(() => 0);
  const later = gateQuestion(() => 0.99);
  assert.equal(first.text, 'What is 11 + 11?');
  assert.equal(first.answer, 22);
  assert.equal(later.a, 19);
  assert.equal(later.b, 19);
  assert.equal(later.answer, 38);
  assert.notEqual(first.text, later.text);
  assert.equal(gateOk('22', first.answer), true);
  assert.equal(gateOk(22, first.answer), true);
  assert.equal(gateOk('', first.answer), false);
  assert.equal(gateOk('21', first.answer), false);
  assert.equal(gateOk('211', first.answer), false);
  assert.equal(gateOk('22abc', first.answer), false);
  assert.equal(gateOk('22', later.answer), false);
});

test('sight words allow one apostrophe and reject other symbols', () => {
  assert.equal(parseWords("I, a, don't").ok, true);
  assert.equal(parseWords('I, a, see').ok, true);
  assert.deepEqual(parseWords("See, see, the, my").words, ['see', 'the', 'my']);
  assert.equal(parseWords("I, a, don't!").ok, false);
  assert.equal(parseWords("I, a, ''").ok, false);
  assert.equal(parseWords('I, a').ok, false);
  assert.equal(parseWords('I, a, abcdefghijklm').ok, false);
});

test('build-a-word skips one-letter words when longer ones exist', () => {
  assert.deepEqual(candidateWords(['I', 'a', 'see'], 'build'), ['see']);
  assert.deepEqual(candidateWords(['I', 'a'], 'build'), ['I', 'a']);
  assert.deepEqual(candidateWords(['I', 'a', 'see'], 'words'), ['I', 'a', 'see']);
});

test('letter games add distractors only above level 1', () => {
  assert.deepEqual(distractorLetters('see', 1), []);
  assert.equal(distractorLetters('see', 2).length, 1);
  assert.equal(distractorLetters('see', 3).length, 2);
  assert.equal(distractorLetters('see', 2).includes('s'), false);
  assert.equal(distractorLetters("don't", 2).includes("'"), false);
});

test('letter blanks keep a single spaced format', () => {
  assert.equal(blanks('', 'see'), '_ _ _');
  assert.equal(blanks('se', 'see'), 's e _');
  assert.equal(blanks('see', 'see'), 's e e');
});

test('star chip and round sentence stay grammatical', () => {
  assert.equal(starChip({ stars: 0, total: 0, correct: 0 }), '0 learning stars');
  assert.equal(starChip({ stars: 1, total: 0, correct: 0 }), '1 learning star');
  assert.equal(starChip({ stars: 5, total: 5, correct: 4 }), '5 learning stars · 4 of 5 first tries');
  assert.equal(roundsSentence({ sessions: 1, correct: 4, total: 5 }), '1 round completed · 4 of 5 first tries correct.');
  assert.equal(roundsSentence({ sessions: 2, correct: 8, total: 10 }), '2 rounds completed · 8 of 10 first tries correct.');
});

test('skill state and per-level stats follow the stored level', () => {
  assert.equal(skillState({ total: 0, correct: 0 }), 'Ready to explore');
  assert.equal(skillState({ total: 5, correct: 4 }), 'Growing');
  assert.equal(skillState({ total: 10, correct: 8 }), 'Flourishing');
  const profile = { skills: { shapes: { 1: { total: 5, correct: 4, sessions: 1 }, 3: { total: 0, correct: 0, sessions: 0 } } } };
  assert.match(skillStatText(profile, 'shapes', 1), /Tap 4\/5 \(1 round\)/);
  assert.equal(skillStatText(profile, 'shapes', 3), 'No practice yet at this level');
  assert.equal(skillStatText(profile, 'colors', 1), 'No practice yet at this level');
});

test('home level label hides a single level when skills differ', () => {
  assert.equal(levelSummary(3, [3, 3, 3], 5), 'Level 3 · 5 little challenges');
  assert.equal(levelSummary(3, [1, 3, 2], 5), '5 little challenges');
});

test('a round adds participation stars and first-try counts', () => {
  const profile = { name: 'Learner 1', stars: 0, sessions: 0, correct: 0, total: 0, skills: {} };
  const next = applyRound(profile, 'shapes', 1, 5, 4);
  assert.equal(next.stars, 5);
  assert.equal(next.sessions, 1);
  assert.equal(next.correct, 4);
  assert.equal(next.total, 5);
  assert.deepEqual(next.skills.shapes[1], { total: 5, correct: 4, sessions: 1 });
  assert.equal(profile.stars, 0);
  const again = applyRound(next, 'shapes', 1, 5, 5);
  assert.equal(again.skills.shapes[1].total, 10);
  assert.equal(again.skills.shapes[1].correct, 9);
});

test('reset clears scores and keeps the learner setup', () => {
  const profile = { name: 'Ada', level: 2, words: ['see'], stars: 5, sessions: 1, correct: 4, total: 5, skills: { shapes: {} }, style: 'move' };
  const next = resetProgress(profile);
  assert.equal(next.stars, 0);
  assert.equal(next.sessions, 0);
  assert.equal(next.total, 0);
  assert.deepEqual(next.skills, {});
  assert.equal(next.name, 'Ada');
  assert.equal(next.level, 2);
  assert.equal(next.style, 'move');
  assert.deepEqual(next.words, ['see']);
});

const numberRangeLocal = (lo, hi) => Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);

const seeded = seed => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

test('number choices include the answer, stay in range and never repeat', () => {
  for (let s = 1; s < 200; s++) {
    const rand = seeded(s), target = 1 + (s % 20);
    const choices = nearbyChoices(target, 1, 20, 6, rand);
    assert.equal(choices.length, 6);
    assert.ok(choices.includes(target));
    assert.equal(new Set(choices).size, 6);
    assert.ok(choices.every(n => n >= 1 && n <= 20));
  }
  assert.deepEqual(nearbyChoices(1, 1, 2, 3).sort(), [1, 2]);
});

test('learner slots default to preschool, kindergarten, and 4th grade', () => {
  assert.equal(stageOf({}, 0), 'preschool');
  assert.equal(stageOf({}, 1), 'kindergarten');
  assert.equal(stageOf({}, 2), 'grade4');
  assert.equal(stageOf({ stage: 'grade4' }, 0), 'grade4');
  assert.match(mathBlurb('preschool', 'count'), /small/i);
  assert.match(mathBlurb('grade4', 'path'), /multiples/i);
  assert.match(mathBlurb('grade4', 'catch'), /product/i);
  assert.match(mathBlurb('kindergarten', 'catch'), /hops/i);
});

test('rocket climb alternates math and sight words, with a shorter tank at higher levels', () => {
  assert.deepEqual([0, 1, 2, 3].map(rocketSubject), ['math', 'words', 'math', 'words']);
  assert.deepEqual([1, 2, 3].map(fuelSeconds), [18, 12, 8]);
  assert.equal(fuelSeconds(9), 8);
  assert.equal(fuelSeconds(0), 18);
});

test('word lanes never offer more lanes than the list has', () => {
  assert.deepEqual([1, 2, 3].map(level => laneCount(level, 8)), [3, 4, 5]);
  assert.equal(laneCount(3, 4), 4);
  assert.equal(laneCount(2, 2), 2);
  assert.equal(laneCount(1, 0), 0);
});

test('counting tops out by stage, and Hunt stays at 10 or below for young learners', () => {
  assert.deepEqual([1, 2, 3].map(l => countMax('preschool', l, 'tap')), [5, 8, 10]);
  assert.deepEqual([1, 2, 3].map(l => countMax('kindergarten', l, 'tap')), [10, 20, 20]);
  assert.deepEqual([1, 2, 3].map(l => countMax('kindergarten', l, 'hunt')), [10, 10, 10]);
  assert.equal(countMax('preschool', 3, 'hunt'), 10);
});

test('preschool and kindergarten count questions stay in a countable range', () => {
  for (let s = 1; s < 80; s++) {
    const pre = countQuestion('preschool', 1, 'tap', seeded(s));
    assert.equal(pre.kind, 'count');
    assert.ok(pre.target >= 1 && pre.target <= 5);
    const k = countQuestion('kindergarten', 3, 'tap', seeded(s + 9));
    assert.ok(k.target >= 1 && k.target <= 20);
    const hunt = countQuestion('kindergarten', 3, 'hunt', seeded(s + 3));
    assert.ok(hunt.target <= 10);
  }
});

test('4th grade count is arrays and facts, not counting 20 pictures', () => {
  const kinds = new Set();
  for (let s = 1; s < 200; s++) {
    const q = countQuestion('grade4', 1 + (s % 3), 'tap', seeded(s));
    kinds.add(q.kind);
    if (q.kind === 'array') assert.equal(q.target, q.rows * q.cols);
    if (q.kind === 'mul') assert.equal(q.target, q.a * q.b);
    if (q.kind === 'missing') assert.equal(q.target * q.b, q.product);
    if (['mul21', 'tens', 'mul22'].includes(q.kind)) assert.equal(q.target, q.a * q.b);
    if (q.kind === 'mul21') assert.equal(q.tens + q.ones, q.a);
    assert.ok(q.grade);
    assert.notEqual(q.kind, 'count');
  }
  for (const k of ['array', 'mul', 'missing', 'mul21', 'tens', 'mul22']) assert.ok(kinds.has(k), k);
});

test('number path questions match the learner stage', () => {
  const kinds = { preschool: new Set(), kindergarten: new Set(), grade4: new Set() };
  const expected = {
    find: q => q.target, after: q => q.a + 1, before: q => q.a - 1, more: q => Math.max(q.a, q.b),
    add: q => q.a + q.b, take: q => q.a - q.b, greater: q => Math.max(q.a, q.b),
    place: q => Math.floor(q.n / { ones: 1, tens: 10, hundreds: 100, thousands: 1000 }[q.place]) % 10,
    round: q => Math.round(q.n / 10) * 10, add2: q => q.a + q.b, sub2: q => q.a - q.b,
    next: q => q.strip.at(-1) + q.n,
    multipleOf: q => (q.target % q.n === 0 ? q.target : NaN),
    factor: q => (q.big % q.target === 0 ? q.target : NaN),
    common: q => (q.target % q.a === 0 && q.target % q.b === 0 ? q.target : NaN),
    prime: q => (numberRangeLocal(2, q.target - 1).every(d => q.target % d) ? q.target : NaN)
  };
  for (let s = 1; s < 400; s++) {
    for (const stage of ['preschool', 'kindergarten', 'grade4']) {
      const q = pathQuestion(stage, 1 + (s % 3), seeded(s * 5 + stage.length));
      kinds[stage].add(q.kind);
      assert.equal(q.target, expected[q.kind](q), JSON.stringify(q));
      assert.ok(q.target >= q.lo && q.target <= q.hi, JSON.stringify(q));
    }
  }
  assert.ok([...kinds.preschool].every(k => ['find', 'after', 'before', 'more'].includes(k)));
  assert.ok(kinds.kindergarten.has('add') && kinds.kindergarten.has('find'));
  for (const k of ['next', 'multipleOf', 'factor', 'common', 'prime']) assert.ok(kinds.grade4.has(k), k);
  assert.equal(kinds.preschool.has('mul'), false);
  assert.equal(kinds.kindergarten.has('prime'), false);
});

test('number path prompts fit the play style', () => {
  const add = { kind: 'add', a: 3, b: 1, target: 4, floor: true, question: 'Start at 3. Hop 1 more. Where do you land?' };
  assert.equal(pathPrompt(add, 'tap'), add.question);
  assert.equal(pathPrompt(add, 'move'), 'Stand on 3. Hop forward once. What number are you on?');
  assert.equal(pathPrompt({ ...add, b: 2, target: 5 }, 'move'), 'Stand on 3. Hop forward 2 times. What number are you on?');
  assert.match(pathPrompt(add, 'hunt'), /^Start at 3.*Then find that number/);
  assert.equal(pathPrompt({ kind: 'find', target: 4, floor: true, question: 'Find the number 4.' }, 'move', 'Leap like a frog'), 'Leap like a frog to number 4!');
  assert.match(pathPrompt({ kind: 'mul', a: 7, b: 8, target: 56, floor: false, question: 'What is 7 × 8?' }, 'move'), /Tell a grown-up/);
});

test('number floor cards stay small enough to print', () => {
  assert.deepEqual(numberDeck('preschool', 1, 1), [1, 2, 3, 4, 5]);
  assert.equal(numberDeck('kindergarten', 3, 3).at(-1), 20);
  assert.deepEqual(numberDeck('grade4', 3, 3), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});

test('4th grade answer choices are unique, include the answer, and only one is right', () => {
  const isPrime = n => n > 1 && numberRangeLocal(2, n - 1).every(d => n % d);
  const right = {
    multipleOf: (q, x) => x % q.n === 0,
    factor: (q, x) => q.big % x === 0,
    common: (q, x) => x % q.a === 0 && x % q.b === 0,
    prime: (q, x) => isPrime(x)
  };
  for (let s = 1; s < 400; s++) {
    for (const count of [3, 4, 6]) {
      const level = 1 + (s % 3);
      for (const q of [countQuestion('grade4', level, 'tap', seeded(s + count)), pathQuestion('grade4', level, seeded(s * 7 + count))]) {
        const choices = choicesFor(q, count, seeded(s));
        assert.ok(choices.includes(q.target), JSON.stringify(q));
        assert.equal(new Set(choices).size, choices.length, JSON.stringify(choices));
        assert.ok(choices.every(x => Number.isInteger(x) && x > 0), JSON.stringify(choices));
        if (!q.choices) assert.equal(choices.length, count);
        if (right[q.kind]) assert.deepEqual(choices.filter(x => right[q.kind](q, x)), [q.target], JSON.stringify(q));
      }
    }
  }
});

test('times-table distractors are neighbouring facts, not random numbers', () => {
  const q = { kind: 'mul', a: 7, b: 8, target: 56, pool: [64, 48, 63, 49, 15, 66, 46, 57, 55], lo: 0, hi: 122 };
  const choices = choicesFor(q, 4, seeded(3));
  assert.equal(choices.length, 4);
  assert.ok(choices.every(x => q.pool.includes(x) || x === 56));
  const fact = countQuestion('grade4', 2, 'tap', seeded(11));
  if (fact.kind === 'mul') assert.ok(fact.pool.includes((fact.a + 1) * fact.b) || fact.pool.includes(fact.a * (fact.b + 1)));
});

test('question sheet reads learner rows', () => {
  const csv = 'learner,game,item,extra\n*,words,cat,\nLearner 2,count,"red apples",🍎\n,facts,7,\n';
  const parsed = parseSheet(csv);
  assert.equal(parsed.note, 'ok');
  assert.deepEqual(parsed.rows[0], { learner: '*', game: 'words', item: 'cat', extra: '' });
  assert.deepEqual(parsed.rows[1], { learner: 'Learner 2', game: 'count', item: 'red apples', extra: '🍎' });
  assert.equal(parsed.rows[2].learner, '*');
  assert.equal(parseSheet('').note, 'empty');
  assert.equal(parseSheet('hello,world').note, 'columns');
  assert.equal(parseSheet('game,item\nwords,\n').note, 'none');
  assert.equal(parseSheet('learner,game,item,hide\n*,words,cat,yes\n*,words,dog,\n').rows.length, 1);
  const merged = mergeSheets(
    { rows: [{ learner: '*', game: 'words', item: 'cat', extra: '' }, { learner: '*', game: 'count', item: 'stars', extra: '⭐' }] },
    { rows: [{ learner: '*', game: 'words', item: 'dog', extra: '' }] }
  );
  assert.deepEqual(merged.games, ['words']);
  assert.deepEqual(merged.rows.map(row => row.item), ['stars', 'dog']);
});

test('4th grade times tables follow the sheet numbers', () => {
  const q = countQuestion('grade4', 2, 'tap', () => 0.9, [7]);
  assert.equal(q.kind, 'mul');
  assert.equal(q.a, 7);
  assert.equal(q.b, 7);
  const path = pathQuestion('grade4', 1, () => 0, [7]);
  assert.equal(path.n, 7);
});

test('4th grade Move turns multiplying into skip-count movement', () => {
  assert.equal(grade4Prompt({ kind: 'mul', a: 7, b: 8, target: 56, question: 'What is 7 × 8?' }, 'move'),
    '7 × 8: jump and skip-count by 8s. Stop after 7 jumps. What number did you land on?');
  assert.match(grade4Prompt({ kind: 'mul21', a: 23, b: 4, tens: 20, ones: 3, target: 92, question: 'What is 23 × 4?' }, 'move'),
    /4 giant steps counting by 20s, then 4 baby steps adding 3/);
  assert.match(grade4Prompt({ kind: 'array', rows: 3, cols: 4, target: 12, question: '3 rows of 4. How many in all?' }, 'move'), /^Clap 3 rows of 4/);
  assert.match(grade4Prompt({ kind: 'mul', a: 3, b: 4, target: 12, question: 'What is 3 × 4?' }, 'hunt'), /Build 3 groups of 4/);
  assert.match(grade4Prompt({ kind: 'mul', a: 9, b: 8, target: 72, question: 'What is 9 × 8?' }, 'hunt'), /Say the answer/);
  assert.match(grade4Prompt({ kind: 'multipleOf', n: 7, target: 42, question: 'Which number is a multiple of 7?' }, 'hunt'), /calendar/);
  const prime = { kind: 'prime', target: 7, choices: [9, 15, 21, 7], question: 'Which number is prime?' };
  assert.equal(grade4Prompt(prime, 'tap'), 'Which number is prime?');
  assert.match(grade4Prompt(prime, 'move', [15, 7, 9, 21]), /^Which number is prime: 15, 7, 9, or 21\? Try to clap/);
  assert.match(grade4Prompt(prime, 'hunt', [15, 7, 9, 21]), /^Which number is prime: 15, 7, 9, or 21\? Say the answer/);
});
