import test from 'node:test';
import { assignAsk, beginArcade, createFlight, markFlight, pitchFlight, stepFlight, typeSpell } from './sidecars/flight/sim.mjs';
import { groundMeters } from './sidecars/flight/terrain.mjs';
import { findBuiltSidecars, sidecarGame, sidecarIsBuilt, sidecarRows } from './sidecar.js';
import assert from 'node:assert/strict';
import {
  applyRound,
  blanks,
  candidateWords,
  choicesFor,
  countMax,
  countQuestion,
  factSetFromRows,
  distractorLetters,
  gateOk,
  gateQuestion,
  grade4Prompt,
  levelSummary,
  mathBlurb,
  fuelSeconds,
  hookCast,
  skyWave,
  planetWave,
  puzzleBoard,
  matchPairs,
  traceBoard,
  traceOnPath,
  sortBoard,
  sortPourCount,
  sortPour,
  sortSolved,
  sortDeal,
  crayonBoard,
  crayonLegend,
  crayonPicture,
  crayonSamples,
  crayonInk,
  crayonCovered,
  shapeHolds,
  regionAt,
  mergeBoard,
  mergePromote,
  spokenShape,
  marbleTrack,
  marbleLevel,
  marbleClear,
  bridgeSpan,
  bridgeReach,
  bridgeWindow,
  mazeClock,
  chaseBoard,
  hopBoard,
  toastBoard,
  toastPace,
  aisleBoard,
  lilyBoard,
  lilyPads,
  lilyOverlap,
  lilyRide,
  laneCount,
  raceBoard,
  raceGateSeconds,
  raceKinds,
  rocketSubject,
  rocketZone,
  nearbyChoices,
  numberDeck,
  mergeSheets,
  parseSheet,
  parseWords,
  wordsFromSheet,
  pathPrompt,
  pathQuestion,
  stageOf,
  resetProgress,
  roundsSentence,
  roundCount,
  rallyGates,
  rallyQuestionCount,
  rallyClearCount,
  skillStatText,
  skillState,
  spriteGrow,
  pointBoard,
  profileSprite,
  nextSprite,
  blankLearner,
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
  assert.deepEqual([1, 2, 3, 4, 5, 10, 15].map(roundCount), [5, 5, 5, 5, 5, 10, 15]);
  assert.deepEqual([5, 10, 15].map(rallyQuestionCount), [5, 7, 8]);
  assert.deepEqual([5, 10, 15].map(rallyClearCount), [5, 5, 5]);
  const gates = rallyGates(5);
  assert.equal(gates.length, 5);
  assert.ok(gates[0] > 0.15 && gates[0] < 0.2);
  assert.ok(gates.at(-1) > 0.8 && gates.at(-1) < 0.86);
  assert.ok(rallyGates(8).at(-1) < 0.9);
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

test('star garden ranks points and keeps the stars just earned', () => {
  assert.equal(spriteGrow(0), 1);
  assert.equal(spriteGrow(1), 2);
  assert.equal(spriteGrow(7), 2);
  assert.equal(spriteGrow(8), 3);
  assert.equal(spriteGrow(19), 3);
  assert.equal(spriteGrow(20), 4);
  assert.equal(spriteGrow(39), 4);
  assert.equal(spriteGrow(40), 5);
  const played = applyRound({ stars: 1, sessions: 0, correct: 0, total: 0, earned: 2, skills: {} }, 'words', 1, 5, 3);
  assert.equal(played.stars, 6);
  assert.equal(played.earned, 5);
  const board = pointBoard([
    { name: 'Malik', stars: 10, earned: 5 },
    { name: 'Micah', stars: 4, earned: 0 },
    { name: 'Mitch', stars: 4, earned: 4 }
  ]);
  assert.deepEqual(board.map(row => row.name), ['Micah', 'Malik', 'Mitch']);
  assert.deepEqual(board.map(row => row.rank), [2, 1, 2]);
  assert.equal(board[1].sprite, 'fox');
  assert.equal(board[0].sprite, 'bear');
  assert.equal(board[1].grow, 3);
  assert.equal(board[2].earned, 4);
  const quiet = pointBoard([
    { name: 'Malik', stars: 0 },
    { name: 'Micah', stars: 0 },
    { name: 'Mitch', stars: 0 }
  ]);
  assert.deepEqual(quiet.map(row => row.index), [0, 1, 2]);
  assert.deepEqual(quiet.map(row => row.sprite), ['fox', 'bear', 'bunny']);
});

test('a new learner starts fresh and keeps a chosen buddy', () => {
  const made = blankLearner('Ada', 'owl');
  assert.equal(made.name, 'Ada');
  assert.equal(made.stage, 'preschool');
  assert.equal(made.level, 1);
  assert.equal(made.sprite, 'owl');
  assert.equal(made.stars, 0);
  assert.equal(made.earned, 0);
  assert.deepEqual(made.words, ['I', 'a', 'the', 'my', 'see']);
  assert.equal(blankLearner('   ', 'nope').name, 'New learner');
  assert.equal(blankLearner('   ', 'nope').sprite, 'fox');
  assert.equal(profileSprite({ sprite: 'chick' }, 0), 'chick');
  assert.equal(profileSprite({ sprite: 'nope' }, 1), 'bear');
  assert.equal(nextSprite([{ sprite: 'fox' }, { sprite: 'bear' }, { sprite: 'bunny' }]), 'frog');
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
  assert.equal(next.earned, 0);
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
  assert.deepEqual([1, 2, 3].map(level => hookCast(level).fish), [3, 4, 5]);
  assert.deepEqual([1, 2, 3].map(level => hookCast(level).trash), [0, 1, 2]);
  assert.equal(hookCast(1).name, 'Sunny pond');
  assert.equal(hookCast(9).id, 'deep');
  assert.ok(hookCast(1).drop < hookCast(3).drop);
  assert.equal(fuelSeconds(9), 8);
  assert.equal(fuelSeconds(0), 18);
  assert.equal(rocketZone(0), 'Garden');
  assert.equal(rocketZone(0.18), 'Clouds');
  assert.equal(rocketZone(0.4), 'Sky');
  assert.equal(rocketZone(0.65), 'Stars');
  assert.equal(rocketZone(0.9), 'Space');
  assert.equal(rocketZone(2), 'Space');
});

test('gas race follows the learner topics and keeps each driver’s furthest run', () => {
  assert.deepEqual(raceKinds(undefined), ['facts', 'words', 'shapes', 'colors']);
  assert.deepEqual(raceKinds({ facts: true, words: false, shapes: true, colors: false }), ['facts', 'shapes']);
  assert.deepEqual(raceKinds({ facts: false, words: false, shapes: false, colors: false }), ['facts', 'words', 'shapes', 'colors']);
  assert.deepEqual([1, 2, 3].map(raceGateSeconds), [11, 8, 6]);
  assert.equal(raceGateSeconds(0), 11);
  assert.equal(raceGateSeconds(9), 6);
  assert.ok(raceGateSeconds(1) < fuelSeconds(1));
  assert.ok(raceGateSeconds(2) < fuelSeconds(2));
  assert.ok(raceGateSeconds(3) < fuelSeconds(3));
  const first = raceBoard([], { name: 'Ada', distance: 120.4, at: 1 });
  assert.equal(first.distance, 120);
  assert.equal(first.rank, 1);
  assert.equal(first.best, 120);
  const second = raceBoard(first.list, { name: 'Bea', distance: 300, at: 2 });
  assert.equal(second.list[0].name, 'Bea');
  assert.equal(second.rank, 1);
  const shorter = raceBoard(second.list, { name: 'Ada', distance: 40, at: 3 });
  assert.equal(shorter.best, 120);
  assert.equal(shorter.distance, 40);
  assert.equal(shorter.list.find(row => row.name === 'Ada').distance, 120);
  assert.equal(shorter.rank, 2);
  const longer = raceBoard(shorter.list, { name: ' ada ', distance: 500, at: 4 });
  assert.equal(longer.list.filter(row => row.name.toLowerCase() === 'ada').length, 1);
  assert.equal(longer.best, 500);
  assert.equal(longer.rank, 1);
});

test('sky shot puts the answer on more rocks and adds enemy ships by level', () => {
  assert.deepEqual([1, 2, 3].map(level => skyWave(level).rocks), [3, 4, 5]);
  assert.deepEqual([1, 2, 3].map(level => skyWave(level).foes), [1, 2, 3]);
  assert.ok(skyWave(1).drift < skyWave(3).drift);
  assert.ok(skyWave(1).bolt < skyWave(3).bolt);
  assert.ok(skyWave(1).aim > skyWave(3).aim);
  assert.equal(skyWave(9).foes, 3);
  assert.equal(skyWave(0).rocks, 3);
});

test('planet guard sends more rocks, and less time, as the level rises', () => {
  assert.deepEqual([1, 2, 3].map(level => planetWave(level).rocks), [3, 4, 5]);
  assert.ok(planetWave(1).seconds > planetWave(2).seconds);
  assert.ok(planetWave(2).seconds > planetWave(3).seconds);
  assert.equal(planetWave(0).rocks, 3);
  assert.equal(planetWave(9).rocks, 5);
  assert.equal(planetWave(9).seconds, 4.5);
});

test('shape puzzle builds a shape, then checks the spoken name', () => {
  assert.deepEqual([1, 2, 3].map(level => puzzleBoard(level).pieces), [2, 4, 6]);
  assert.equal(puzzleBoard(1).outline, true);
  assert.equal(puzzleBoard(2).outline, false);
  assert.equal(puzzleBoard(3).outline, false);
  assert.equal(puzzleBoard(0).pieces, 2);
  assert.equal(puzzleBoard(9).pieces, 6);
  const names = ['circle', 'square', 'triangle', 'rectangle', 'star', 'hexagon'];
  assert.equal(spokenShape('It is a circle', names), 'circle');
  assert.equal(spokenShape('a round one', names), 'circle');
  assert.equal(spokenShape('Square!', names), 'square');
  assert.equal(spokenShape('the rectangle', names), 'rectangle');
  assert.equal(spokenShape('hexagon please', names), 'hexagon');
  assert.equal(spokenShape('I see a star and a circle', names), '');
  assert.equal(spokenShape('start over', names), '');
  assert.equal(spokenShape('banana', names), '');
});

test('memory match adds pairs as the level rises', () => {
  assert.deepEqual([1, 2, 3].map(matchPairs), [4, 6, 8]);
  assert.equal(matchPairs(0), 4);
  assert.equal(matchPairs(9), 8);
});

test('trace drive thickens the guide, then fades a number or letter', () => {
  assert.deepEqual([1, 2, 3].map(level => traceBoard(level).kind), ['shape', 'shape', 'mark']);
  assert.ok(traceBoard(1).guide > traceBoard(2).guide);
  assert.ok(traceBoard(2).guide > traceBoard(3).guide);
  assert.equal(traceBoard(1).fade, false);
  assert.equal(traceBoard(2).fade, false);
  assert.equal(traceBoard(3).fade, true);
  assert.equal(traceBoard(0).kind, 'shape');
  assert.equal(traceBoard(9).fade, true);
  const path = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
  assert.equal(traceOnPath({ x: 5, y: 2 }, path, 3), true);
  assert.equal(traceOnPath({ x: 5, y: 0 }, path, 0), true);
  assert.equal(traceOnPath({ x: 5, y: 8 }, path, 3), false);
  assert.equal(traceOnPath({ x: 5, y: 2 }, [], 3), false);
});

test('ball sort pours a matching run and deals a solvable tube puzzle', () => {
  assert.deepEqual([1, 2, 3].map(level => sortBoard(level).colors), [2, 3, 4]);
  assert.ok(sortBoard(1).capacity < sortBoard(3).capacity);
  assert.equal(sortBoard(0).colors, 2);
  assert.equal(sortBoard(9).empty, 2);
  assert.equal(sortPourCount(['red', 'red'], ['red'], 4), 2);
  assert.equal(sortPourCount(['red', 'blue'], [], 4), 1);
  assert.equal(sortPourCount(['red', 'red'], ['blue'], 4), 0);
  assert.equal(sortPourCount(['red'], ['red', 'red', 'red', 'red'], 4), 0);
  const poured = sortPour([['a', 'a'], ['b'], []], 0, 2, 3);
  assert.deepEqual(poured, [[], ['b'], ['a', 'a']]);
  assert.equal(sortPour([['a'], ['b']], 0, 1, 3), null);
  assert.equal(sortSolved([['a', 'a'], ['b', 'b'], []], 2), true);
  assert.equal(sortSolved([['a', 'b'], ['a'], []], 2), false);
  const dealt = sortDeal(['red', 'blue'], sortBoard(1), () => 0);
  assert.equal(dealt.length, 3);
  assert.equal(dealt.flat().filter(item => item === 'red').length, sortBoard(1).capacity);
  assert.equal(sortSolved(dealt, sortBoard(1).capacity), false);
});

test('color by number pairs each number with one color', () => {
  assert.deepEqual([1, 2, 3].map(level => crayonBoard(level).regions), [4, 6, 8]);
  assert.deepEqual([1, 2, 3].map(level => crayonBoard(level).colors), [4, 4, 6]);
  assert.ok(crayonBoard(1).brush > crayonBoard(3).brush);
  assert.equal(crayonBoard(0).regions, 4);
  assert.equal(crayonBoard(9).regions, 8);
  const rows = crayonLegend(['sky', 'grass', 'sun', 'bug'], [['blue', '#00f'], ['green', '#0f0']], [5, 2]);
  assert.deepEqual(rows.map(row => row.number), [5, 2, 5, 2]);
  assert.equal(rows[0].name, 'blue');
  assert.equal(rows[2].hex, '#00f');
  assert.equal(rows[1].id, 'grass');
  assert.deepEqual(crayonLegend([], [['blue', '#00f']], [1]), []);
  assert.equal(shapeHolds({ poly: [[0, 0], [10, 0], [10, 10], [0, 10]] }, 5, 5), true);
  assert.equal(shapeHolds({ poly: [[0, 0], [10, 0], [10, 10], [0, 10]] }, 15, 5), false);
  assert.equal(shapeHolds({ circle: [0, 0, 5] }, 3, 4), true);
  assert.equal(shapeHolds({ circle: [0, 0, 5] }, 4, 4), false);
  assert.equal(shapeHolds({ parts: [{ circle: [0, 0, 2] }, { circle: [10, 0, 2] }] }, 10, 0), true);
  const layers = [
    { id: 'back', shape: { poly: [[0, 0], [10, 0], [10, 10], [0, 10]] } },
    { id: 'front', shape: { circle: [5, 5, 2] } }
  ];
  assert.equal(regionAt(layers, 5, 5).id, 'front');
  assert.equal(regionAt(layers, 1, 1).id, 'back');
  assert.equal(regionAt(layers, 20, 20), null);
  assert.equal(crayonInk({ x: 5, y: 1 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 1.5), true);
  assert.equal(crayonInk({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 1.5), false);
  assert.equal(crayonCovered(3, 10, 0.3), true);
  assert.equal(crayonCovered(2, 10, 0.3), false);
  assert.equal(crayonCovered(0, 0, 0.3), false);
  for (const level of [1, 2, 3]) {
    for (let index = 0; index < 2; index++) {
      const page = crayonPicture(level, index);
      assert.equal(page.regions.length, crayonBoard(level).regions, page.name);
      assert.equal(new Set(page.regions.map(region => region.id)).size, page.regions.length);
      const samples = crayonSamples(page.regions);
      page.regions.forEach((region, slot) => {
        assert.equal(regionAt(page.regions, region.label[0], region.label[1])?.id, region.id, `${page.name} ${region.id}`);
        assert.ok(samples[slot].length >= 8, `${page.name} ${region.id} ${samples[slot].length}`);
      });
    }
  }
  assert.equal(crayonPicture(1, 3).name, crayonPicture(1, 1).name);
});

test('merge jar promotes only an equal pair', () => {
  assert.deepEqual([1, 2, 3].map(level => mergeBoard(level).chain), [3, 4, 5]);
  assert.ok(mergeBoard(1).size > mergeBoard(3).size);
  assert.ok(mergeBoard(1).count < mergeBoard(3).count);
  assert.equal(mergeBoard(0).chain, 3);
  assert.equal(mergeBoard(9).count, 8);
  const chain = ['2', '4', '8'];
  assert.equal(mergePromote('2', '2', chain), '4');
  assert.equal(mergePromote('4', '4', chain), '8');
  assert.equal(mergePromote('8', '8', chain), null);
  assert.equal(mergePromote('2', '4', chain), null);
  assert.equal(mergePromote('3', '3', chain), null);
});

test('marble path clears a color run, then levels up on points', () => {
  assert.deepEqual([1, 2, 3].map(level => marbleTrack(level).colors), [3, 4, 5]);
  assert.deepEqual([1, 2, 3].map(level => marbleTrack(level).quota), [4, 6, 8]);
  assert.ok(marbleTrack(1).speed < marbleTrack(3).speed);
  assert.equal(marbleTrack(0).chain, 14);
  assert.equal(marbleTrack(9).colors, 5);
  assert.equal(marbleLevel(0, 8), 1);
  assert.equal(marbleLevel(7, 8), 1);
  assert.equal(marbleLevel(8, 8), 2);
  assert.equal(marbleLevel(16, 8), 3);
  const popped = marbleClear(['red', 'red', 'blue', 'blue', 'blue', 'red']);
  assert.deepEqual(popped.left, []);
  assert.deepEqual(popped.cleared, ['blue', 'blue', 'blue', 'red', 'red', 'red']);
  assert.deepEqual(marbleClear(['red', 'blue', 'red']).left, ['red', 'blue', 'red']);
});

test('stick bridge lands only when the stick meets the next stop', () => {
  assert.ok(bridgeSpan(1).pad > bridgeSpan(3).pad);
  assert.ok(bridgeSpan(1).gap < bridgeSpan(3).gap);
  assert.equal(bridgeSpan(9).gap, 168);
  assert.equal(bridgeSpan(0).pad, 84);
  assert.equal(bridgeReach(100, 90, 160), true);
  assert.equal(bridgeReach(89, 90, 160), false);
  assert.equal(bridgeReach(161, 90, 160), false);
  const wide = bridgeWindow(true, 90, 160);
  const tight = bridgeWindow(false, 90, 160);
  assert.ok(wide.near < 90 && wide.far > 160);
  assert.ok(tight.far - tight.near < wide.far - wide.near);
  assert.ok(tight.near > 90 && tight.far < 160);
  assert.equal(bridgeReach(125, tight.near, tight.far), true);
  assert.equal(bridgeReach(95, tight.near, tight.far), false);
});

test('garden chase and sprout hop get harder as the level rises', () => {
  assert.deepEqual([1, 2, 3].map(level => chaseBoard(level).bugs), [1, 2, 3]);
  assert.ok(chaseBoard(1).player < chaseBoard(3).player);
  assert.ok(chaseBoard(1).choices < chaseBoard(3).choices);
  assert.equal(chaseBoard(0).cols, 9);
  assert.equal(chaseBoard(9).rows, 9);
  assert.deepEqual([1, 2, 3].map(level => hopBoard(level).choices), [3, 4, 5]);
  assert.ok(hopBoard(1).width > hopBoard(3).width);
  assert.equal(hopBoard(1).drift, 0);
  assert.ok(hopBoard(3).drift > 0);
  assert.equal(hopBoard(0).choices, 3);
});

test('lily cross adds pads and lanes, and shortens the hops, as the level rises', () => {
  assert.deepEqual([1, 2, 3].map(level => lilyBoard(level).choices), [3, 4, 5]);
  assert.ok(lilyBoard(1).lives > lilyBoard(3).lives);
  assert.ok(lilyBoard(1).speed < lilyBoard(3).speed);
  assert.equal(lilyBoard(1).rivers, 2);
  assert.equal(lilyBoard(3).rivers, 3);
  assert.equal(lilyBoard(0).roads, 2);
  assert.equal(lilyBoard(9).choices, 5);
  assert.deepEqual(lilyPads(3), [0, 2, 4]);
  assert.deepEqual(lilyPads(4), [0, 1, 3, 4]);
  assert.deepEqual(lilyPads(5), [0, 1, 2, 3, 4]);
  assert.deepEqual(lilyPads(1), [2]);
  assert.equal(lilyOverlap(0.2, 0.6, 0.5, 1), true);
  assert.equal(lilyOverlap(0.2, 0.6, 1.2, 1), false);
  const ride = lilyRide(1, 0.6, [{ x: 0, w: 1.2, id: 'a' }, { x: 1.1, w: 2, id: 'b' }]);
  assert.equal(ride.id, 'b');
  assert.equal(lilyRide(3, 0.5, [{ x: 0, w: 1 }]), null);
});

test('market walk adds a shelf and shortens the clock as the level rises', () => {
  assert.deepEqual([1, 2, 3].map(level => aisleBoard(level).choices), [3, 4, 5]);
  assert.ok(aisleBoard(1).seconds > aisleBoard(3).seconds);
  assert.equal(aisleBoard(0).choices, 3);
  assert.equal(aisleBoard(9).seconds, 20);
});

test('toast pop gives fewer lives and a faster flight as the level rises', () => {
  assert.deepEqual([1, 2, 3].map(level => toastBoard(level).choices), [3, 4, 5]);
  assert.ok(toastBoard(1).lives > toastBoard(3).lives);
  assert.ok(toastBoard(1).flight > toastBoard(3).flight);
  assert.equal(toastBoard(0).lives, 5);
  assert.equal(toastBoard(9).choices, 5);
  const easy = toastBoard(1);
  const start = toastPace(easy, 0);
  const later = toastPace(easy, 20);
  assert.equal(start.flight, easy.flight);
  assert.ok(later.flight < start.flight);
  assert.ok(later.gap < start.gap);
  const floor = toastPace(easy, 1000);
  assert.equal(floor.flight, easy.minFlight);
  assert.equal(floor.gap, easy.minGap);
});

test('tilt maze gives less time and more holes as the level rises', () => {
  assert.deepEqual([1, 2, 3].map(level => mazeClock(level).seconds), [50, 40, 30]);
  assert.deepEqual([1, 2, 3].map(level => mazeClock(level).holes), [2, 4, 6]);
  assert.ok(mazeClock(1).bonus > mazeClock(3).bonus);
  assert.equal(mazeClock(0).cols, 7);
  assert.equal(mazeClock(9).rows, 13);
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
    if (['mul21', 'tens'].includes(q.kind)) {
      assert.equal(q.target, q.a * q.b);
      assert.ok(q.a >= 10 && q.a <= 99 && q.b >= 2 && q.b <= 9);
    }
    if (q.kind === 'mul21') assert.equal(q.tens + q.ones, q.a);
    assert.notEqual(q.kind, 'mul22');
    assert.ok(q.grade);
    assert.notEqual(q.kind, 'count');
  }
  for (const k of ['array', 'mul', 'missing', 'mul21', 'tens']) assert.ok(kinds.has(k), k);
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

test('4th grade sheet words stay on that band', () => {
  const rows = [
    { learner: '*', game: 'words', item: 'see' },
    { learner: '*', game: 'words', item: 'the' },
    { learner: '*', game: 'words', item: 'my' },
    { learner: '*', game: 'words', item: 'Seedling' },
    { learner: '*', game: 'words', item: 'Dreary' },
    { learner: 'kindergarten', game: 'words', item: 'see' },
    { learner: 'kindergarten', game: 'words', item: 'away' },
    { learner: 'kindergarten', game: 'words', item: 'little' },
    { learner: 'grade4', game: 'words', item: 'Seedling' },
    { learner: 'grade4', game: 'words', item: 'Dreary' },
    { learner: 'grade4', game: 'words', item: 'Queasy' }
  ];
  assert.deepEqual(wordsFromSheet(rows, 'Learner 1', 'preschool'), ['see', 'the', 'my']);
  assert.deepEqual(wordsFromSheet(rows, 'Learner 3', 'grade4'), ['Seedling', 'Dreary', 'Queasy']);
  assert.deepEqual(wordsFromSheet(rows, 'Ava', 'kindergarten'), ['see', 'away', 'little']);
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
  const facts = mergeSheets(
    { rows: [{ learner: '*', game: 'facts', item: '10s', extra: '' }, { learner: '*', game: 'facts', item: '20s', extra: 'off' }, { learner: '*', game: 'facts', item: '7', extra: 'off' }] },
    { rows: [{ learner: '*', game: 'facts', item: '7', extra: '' }] }
  );
  assert.deepEqual(facts.rows.map(row => [row.item, row.extra]), [['7', ''], ['10s', ''], ['20s', 'off']]);
  const band = mergeSheets(
    { rows: [{ learner: '*', game: 'words', item: 'cat', extra: '' }, { learner: 'kindergarten', game: 'words', item: 'away', extra: '' }] },
    { rows: [{ learner: '*', game: 'words', item: 'dog', extra: '' }, { learner: 'kindergarten', game: 'words', item: 'a', extra: '' }] }
  );
  assert.deepEqual(band.rows.map(row => [row.learner, row.item]), [['*', 'dog'], ['kindergarten', 'a'], ['kindergarten', 'away']]);
});

test('4th grade times tables follow the sheet numbers', () => {
  const q = countQuestion('grade4', 2, 'tap', () => 0.9, [7]);
  assert.equal(q.kind, 'mul');
  assert.equal(q.a, 7);
  assert.equal(q.b, 7);
  const path = pathQuestion('grade4', 1, () => 0, [7]);
  assert.equal(path.n, 7);
});

test('question sheet turns 4th grade multiplication down to the 10s and double digits', () => {
  const rows = [
    ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => ({ item: String(n), extra: '' })),
    { item: '11', extra: 'off' },
    { item: '12', extra: 'off' },
    { item: 'double', extra: '' },
    { item: '10s', extra: '' },
    { item: '20s', extra: 'off' },
    { item: '30s', extra: 'off' }
  ];
  const set = factSetFromRows(rows);
  assert.deepEqual(set.tables, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(set.decades, [10]);
  assert.equal(set.double, true);
  for (let s = 1; s < 40; s++) {
    const easy = countQuestion('grade4', 2, 'tap', seeded(s), set);
    assert.ok(easy.a <= 10 && easy.b <= 10, JSON.stringify(easy));
    const hard = countQuestion('grade4', 3, 'tap', seeded(s + 3), set);
    assert.ok(hard.kind === 'mul21' || hard.kind === 'tens', hard.kind);
    assert.ok(hard.a >= 10 && hard.a <= 19, JSON.stringify(hard));
    assert.equal(hard.target, hard.a * hard.b);
    if (hard.kind === 'mul21') assert.equal(hard.tens, 10);
  }
  const wider = factSetFromRows([...rows, { item: '20s', extra: '' }, { item: '30s', extra: '' }]);
  assert.deepEqual(wider.decades, [10, 20, 30]);
  const seen = new Set();
  for (let s = 1; s < 80; s++) {
    const hard = countQuestion('grade4', 3, 'tap', seeded(s + 9), wider);
    seen.add(hard.tens || hard.a);
    assert.ok([10, 20, 30].includes(hard.tens || hard.a - (hard.a % 10)), JSON.stringify(hard));
  }
  assert.ok(seen.has(20) || [...seen].some(n => n >= 20 && n < 30));
  assert.ok(seen.has(30) || [...seen].some(n => n >= 30 && n < 40));
});

test('sidecar games stay a list a new bootstrapped game can join', async () => {
  const rally = sidecarGame('rally');
  assert.equal(rally.title, 'Backroad rally');
  assert.match(rally.src, /^sidecars\/rally\/index\.html/);
  assert.equal(sidecarGame('missing'), null);
  const bike = sidecarGame('bike');
  assert.equal(bike.title, 'Dirt ride');
  assert.match(bike.src, /^sidecars\/bike\/index\.html/);
  assert.match(bike.howTo, /Level 1 stays upright/);
  const flight = sidecarGame('flight');
  assert.equal(flight.title, 'Sky flight');
  assert.match(flight.src, /^sidecars\/flight\/index\.html/);
  const paint = sidecarGame('paint');
  assert.equal(paint.title, 'Paint sphere');
  assert.match(paint.src, /^sidecars\/paint\/index\.html/);
  assert.match(paint.howTo, /learner’s profile/);
  assert.deepEqual(sidecarRows()[0].slice(0, 2), ['rally', 'Backroad rally']);
  assert.equal(sidecarIsBuilt('rally'), false);
  const saved = globalThis.fetch;
  globalThis.fetch = async url => ({ ok: String(url).includes('sidecars/rally/index.html') });
  try {
    assert.deepEqual(await findBuiltSidecars(), ['rally']);
    assert.equal(sidecarIsBuilt('rally'), true);
  } finally {
    globalThis.fetch = async () => ({ ok: false });
    await findBuiltSidecars();
    globalThis.fetch = saved;
    assert.equal(sidecarIsBuilt('rally'), false);
  }
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

test('a wrong sky-flight gate turns the plane back and keeps the question', () => {
  const state = createFlight();
  const ask = {
    round: 0,
    kind: 'match',
    prompt: 'Fly through the word cat.',
    choices: [
      { label: 'dog' },
      { label: 'cat' },
      { label: 'sun' }
    ]
  };
  assert.equal(assignAsk(state, ask), true);
  assert.equal(state.gates.length, 3);
  const dog = state.gates.find(gate => gate.label === 'dog');
  state.x = dog.x;
  state.z = dog.z;
  const hit = stepFlight(state, 0.05).find(event => event.type === 'pick');
  assert.equal(hit.index, dog.index);
  assert.equal(state.gates.length, 3);
  markFlight(state, false);
  assert.equal(state.recover, 2);
  state.yaw = 1.4;
  const labels = state.gates.map(gate => gate.label).join();
  for (let step = 0; step < 40; step++) stepFlight(state, 0.05);
  assert.equal(state.recover, 0);
  assert.ok(Math.abs(state.yaw) < 0.35, state.yaw);
  assert.ok(state.speed < 14, state.speed);
  assert.ok(state.gates.every(gate => gate.z > state.z + 20), JSON.stringify(state.gates.map(gate => gate.z)));
  assert.equal(state.gates.map(gate => gate.label).join(), labels);
  assert.equal(assignAsk(state, ask), false);
});

test('the right sky-flight gate clears the row and a miss does not', () => {
  const state = createFlight();
  assignAsk(state, {
    round: 1,
    kind: 'match',
    prompt: 'Fly through 4.',
    choices: [{ label: '2' }, { label: '4' }, { label: '9' }]
  });
  const four = state.gates.find(gate => gate.label === '4');
  state.x = four.x;
  state.z = four.z;
  const hit = stepFlight(state, 0.05).find(event => event.type === 'pick');
  assert.equal(hit.index, four.index);
  markFlight(state, true);
  assert.equal(state.gates.length, 0);
  assert.equal(state.solved, true);
});

test('flying past every gate brings the same gates back ahead', () => {
  const state = createFlight();
  assignAsk(state, {
    round: 2,
    kind: 'match',
    prompt: 'Fly through the circle.',
    choices: [{ label: 'circle' }, { label: 'star' }]
  });
  state.x = 80;
  state.z = state.gates[0].z + 40;
  state.yaw = 0;
  const events = stepFlight(state, 0.05);
  assert.equal(events.length, 0);
  assert.ok(state.gates.every(gate => gate.z > state.z + 40));
});

test('spelling gates take letters in order and turn back on a wrong letter', () => {
  const state = createFlight();
  assignAsk(state, {
    round: 3,
    kind: 'spell',
    prompt: 'Fly the letters of cat.',
    word: 'cat',
    letters: ['c', 'x', 'a', 't'],
    choices: [{ label: 'cat' }]
  });
  const wrong = state.gates.find(gate => gate.label === 'x');
  state.x = wrong.x;
  state.z = wrong.z;
  const slip = stepFlight(state, 0.05).find(event => event.type === 'slip');
  assert.ok(slip);
  assert.equal(state.built, '');
  assert.ok(state.recover > 0);
  state.recover = 0;
  state.lockout = true;
  state.x = 0;
  state.z = -40;
  state.yaw = 0;
  stepFlight(state, 0.05);
  assert.equal(state.lockout, false);
  const events = [];
  for (const letter of ['c', 'a', 't']) {
    const gate = state.gates.find(item => item.label === letter);
    assert.ok(gate, letter);
    state.x = gate.x;
    state.z = gate.z;
    state.recover = 0;
    state.lockout = false;
    events.push(...stepFlight(state, 0.05));
  }
  assert.equal(state.built, 'cat');
  assert.equal(events.filter(event => event.type === 'pick').length, 1);
  assert.equal(state.gates.length, 0);
});

test('typed spelling letters follow the same order as the gates', () => {
  const state = createFlight();
  assignAsk(state, {
    round: 4,
    kind: 'spell',
    prompt: 'Fly the letters of cat.',
    word: 'cat',
    letters: ['c', 'a', 't', 'x'],
    choices: [{ label: 'cat' }]
  });
  const miss = typeSpell(state, 'x');
  assert.equal(miss.filter(event => event.type === 'slip').length, 1);
  assert.equal(state.built, '');
  state.recover = 0;
  const typed = typeSpell(state, 'Cat');
  assert.equal(state.built, 'cat');
  assert.equal(typed.filter(event => event.type === 'pick').length, 1);
  assert.equal(state.gates.length, 0);
});

test('arcade flight stays open instead of returning to questions', () => {
  const state = createFlight();
  beginArcade(state);
  assert.equal(state.arcade, true);
  assert.equal(state.gates.length, 0);
  state.alt = 4000;
  state.lift = 0;
  state.thrust = 0;
  state.steer = 0;
  state.pitch = 0;
  state.nose = 0;
  for (let step = 0; step < 300; step++) stepFlight(state, 0.5);
  assert.equal(state.over, false);
  assert.equal(state.free, 120);
  assert.equal(state.gates.length, 0);
});

test('a short round opens free flight after that many right answers', () => {
  const state = createFlight();
  assignAsk(state, {
    round: 0,
    prompt: 'Fly through 2.',
    choices: [{ label: '2' }, { label: '4' }],
    freeEvery: 2
  });
  markFlight(state, true);
  assert.equal(state.free, 0);
  markFlight(state, true);
  assert.equal(state.free, 120);
});

test('five right answers open two minutes of free flight, and a crash or the clock ends it', () => {
  const state = createFlight();
  markFlight(state, false);
  for (let count = 0; count < 4; count++) markFlight(state, true);
  assert.equal(state.free, 0);
  assert.equal(state.rights, 4);
  markFlight(state, true);
  assert.equal(state.free, 120);
  assert.equal(state.rights, 5);
  assert.equal(state.gates.length, 0);
  const parked = state.z;
  state.lift = 0;
  state.thrust = 0;
  state.nose = 0;
  state.yaw = 0;
  for (let step = 0; step < 8; step++) stepFlight(state, 0.2);
  assert.ok(state.z > parked + 5, state.z);
  state.thrust = -1;
  const backing = state.z;
  for (let step = 0; step < 6; step++) stepFlight(state, 0.2);
  assert.ok(state.z < backing, state.z);
  state.thrust = 0;
  const next = {
    round: 9,
    kind: 'match',
    prompt: 'Fly through the star.',
    choices: [{ label: 'star' }, { label: 'moon' }]
  };
  assert.equal(assignAsk(state, next), false);
  assert.equal(state.gates.length, 0);
  const before = state.alt;
  state.lift = 0;
  state.thrust = 1;
  pitchFlight(state, 1);
  for (let step = 0; step < 10; step++) stepFlight(state, 0.2);
  assert.ok(state.nose > 1, state.nose);
  assert.ok(state.alt > before + 30, state.alt);
  state.pitch = 0;
  state.thrust = 0;
  state.strafe = 1;
  state.yaw = 0;
  const across = state.x;
  for (let step = 0; step < 6; step++) stepFlight(state, 0.2);
  assert.ok(state.x > across + 2, state.x);

  const crash = createFlight();
  crash.rights = 4;
  markFlight(crash, true);
  crash.lift = 0;
  crash.alt = groundMeters(crash.x * 6, -crash.z * 6);
  const hit = stepFlight(crash, 0.05);
  assert.equal(hit.filter(event => event.type === 'over' && event.crashed).length, 1);
  assert.equal(crash.over, true);
  assert.equal(stepFlight(crash, 0.2).length, 0);

  const clock = createFlight();
  clock.rights = 4;
  markFlight(clock, true);
  clock.lift = 0;
  clock.alt = 900;
  clock.free = 0.05;
  const done = stepFlight(clock, 0.2);
  assert.equal(done.filter(event => event.type === 'over' && !event.crashed).length, 1);
  assert.equal(clock.over, true);
  assert.equal(clock.gates.length, 0);
  assert.equal(clock.ask?.prompt, undefined);
});
