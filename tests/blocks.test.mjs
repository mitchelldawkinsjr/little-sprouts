import test from 'node:test';
import assert from 'node:assert/strict';
import { chestDistance, goalFrom, localQuestion, nextLetterOk, normalizeAsk, readSave } from '../sidecars/blocks/quiz.mjs';
import { readPad } from '../lib/pad-core.mjs';

test('a host ask becomes a gift-box question without leaking which answer is right', () => {
  const ask = normalizeAsk({ round: 2, prompt: 'Find red.', choices: [{ label: 'red', ok: true, fill: '#f00' }, { label: 'blue', ok: false }], freeEvery: 5 });
  assert.equal(ask.prompt, 'Find red.');
  assert.equal(ask.choices.length, 2);
  assert.equal('ok' in ask.choices[0], false);
  assert.equal(goalFrom(ask), 5);
  assert.equal(normalizeAsk({ choices: [{ label: 'one' }] }), null);
  const spell = normalizeAsk({ kind: 'spell', word: 'cat', letters: ['t', 'c', 'a'], choices: [{ label: 'cat' }] });
  assert.equal(spell.kind, 'spell');
});

test('spelling checks the next letter only', () => {
  assert.equal(nextLetterOk('cat', '', 'C'), true);
  assert.equal(nextLetterOk('cat', 'c', 't'), false);
  assert.equal(nextLetterOk('cat', 'cat', 'a'), false);
});

test('gift boxes move farther out, and sample questions have one right answer', () => {
  assert.ok(chestDistance(4) > chestDistance(0));
  assert.ok(chestDistance(50) <= 34);
  for (let i = 0; i < 8; i++) assert.equal(localQuestion(Math.random, i).choices.filter(c => c.ok).length, 1);
});

test('a damaged save is cleaned up instead of breaking the world', () => {
  const opts = { starter: ['grass', 'dirt'], all: ['grass', 'dirt', 'red'] };
  assert.equal(readSave('not json', opts), null);
  const save = readSave(JSON.stringify({ edits: [['1.2.3', 'red'], ['bad', 'red'], ['4.5.6', 'lava'], ['7.8.9', '']], pos: [1, 2, 3], unlocked: ['red', 'lava'], pitch: 9 }), opts);
  assert.deepEqual(save.edits, [['1.2.3', 'red'], ['7.8.9', '']]);
  assert.ok(save.unlocked.includes('grass') && save.unlocked.includes('red') && !save.unlocked.includes('lava'));
  assert.equal(save.pitch, 1.4);
});

test('the pad reader exposes X, shoulders, and the left trigger for games that read the pad themselves', () => {
  const pad = readPad({ axes: [], buttons: { 2: { pressed: true, value: 1 }, 4: { pressed: true, value: 1 }, 6: { pressed: false, value: 0.7 } } });
  assert.equal(pad.x, 1);
  assert.equal(pad.lb, 1);
  assert.equal(pad.rb, 0);
  assert.equal(pad.lt, 0.7);
});

import { CYCLE, DAY, DUSK, LINES, NIGHT, bugTarget, canGrab, feetBlock, sheltered, skyAt, stepToward } from '../sidecars/blocks/night.mjs';
import { bakedLines } from '../lib/speech-core.mjs';

test('the day turns to night, the bugs come out only at night, and morning comes back', () => {
  assert.equal(skyAt(0).phase, 'day');
  assert.equal(skyAt(0).daylight, 1);
  assert.equal(skyAt(0).warn, false);
  assert.equal(skyAt(DAY - 5).warn, true);
  assert.equal(skyAt(DAY - 5).bugs, false);
  const dusk = skyAt(DAY + DUSK / 2);
  assert.equal(dusk.phase, 'dusk');
  assert.ok(dusk.daylight > 0 && dusk.daylight < 1);
  assert.equal(skyAt(DAY + DUSK + 1).bugs, true);
  assert.equal(skyAt(DAY + DUSK + 1).daylight, 0);
  assert.equal(skyAt(DAY + DUSK + NIGHT + 1).bugs, false);
  assert.equal(skyAt(CYCLE + 1).phase, 'day');
  assert.equal(skyAt(CYCLE + 1).night, 1);
});

test('a house with a roof and walls on every side is safe; open ground and a roof alone are not', () => {
  // A 5 by 5 hut around (0, 0): floor at y 0, walls y 1 and 2, roof at y 3, a shut door counts as wall.
  const hut = new Set();
  for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) {
    hut.add(`${x},0,${z}`);
    hut.add(`${x},3,${z}`);
    if (Math.abs(x) === 2 || Math.abs(z) === 2) { hut.add(`${x},1,${z}`); hut.add(`${x},2,${z}`); }
  }
  const solid = set => (x, y, z) => set.has(`${x},${y},${z}`);
  assert.equal(sheltered(solid(hut), 0, 1, 0), true);
  assert.equal(sheltered(solid(new Set(['0,0,0'])), 0, 1, 0), false);
  const roofOnly = new Set([...hut].filter(k => k.split(',')[1] !== '1' && k.split(',')[1] !== '2'));
  assert.equal(sheltered(solid(roofOnly), 0, 1, 0), false);
  // An open doorway on one side, with nothing beyond it: not safe.
  const open = new Set(hut);
  open.delete('2,1,0'); open.delete('2,2,0');
  assert.equal(sheltered(solid(open), 0, 1, 0), false);
  assert.equal(feetBlock(1.6 + 0.5), 1);
});

test('bugs walk to an open player, circle a safe one, and can only grab out in the open', () => {
  const bug = { x: 10, z: 0, y: 0, spin: 0 };
  const player = { x: 0, z: 0, y: 0 };
  assert.deepEqual(bugTarget(bug, player, false), { x: 0, z: 0 });
  const ring = bugTarget(bug, player, true);
  assert.ok(Math.hypot(ring.x, ring.z) > 5);
  const step = stepToward(bug, player, 3, 1);
  assert.equal(step.x, 7);
  assert.ok(stepToward({ x: 0.1, z: 0 }, player, 3, 1).x === 0);
  assert.equal(canGrab({ x: 1, z: 0, y: 0 }, player, false, 1.7), true);
  assert.equal(canGrab({ x: 1, z: 0, y: 0 }, player, true, 1.7), false);
  assert.equal(canGrab({ x: 1, z: 0, y: 5 }, player, false, 1.7), false);
  assert.equal(canGrab({ x: 4, z: 0, y: 0 }, player, false, 1.7), false);
});

test('every night line has a baked voice clip', () => {
  for (const line of Object.values(LINES)) assert.ok(bakedLines.includes(line), line);
});

test('right answers take turns: a build kit, then a power-up, each list going round', async () => {
  const { prizeFor, KIT_ORDER, POWER_ORDER } = await import('../sidecars/blocks/prizes.mjs');
  const firstSix = [1, 2, 3, 4, 5, 6].map(prizeFor);
  assert.deepEqual(firstSix.map(p => p.kind), ['kit', 'power', 'kit', 'power', 'kit', 'power']);
  assert.equal(firstSix[0].id, KIT_ORDER[0]);
  assert.equal(firstSix[1].id, 'lantern');
  assert.equal(prizeFor(1 + KIT_ORDER.length * 2).id, KIT_ORDER[0]);
  assert.equal(prizeFor(2 + POWER_ORDER.length * 2).id, POWER_ORDER[0]);
});

for (const [kit, middle] of [['house', 2], ['fortress', 4]]) test(`a ${kit} kit is a night shelter with its door shut, and not with it open`, async () => {
  const { kitCells, kitToWorld, facingFromYaw } = await import('../sidecars/blocks/prizes.mjs');
  const { solid } = (await import('../sidecars/blocks/engine/texture-defs.js')).texture_defs;
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const base = [10, 5, 20];
    const facing = facingFromYaw(yaw);
    const world = new Map();
    for (const c of kitCells(kit)) world.set(kitToWorld(c, base, facing).join(','), c.type);
    const solidAt = (x, y, z) => solid(world.get([x, y, z].join(',')) || '');
    // The middle of the house: two steps in from the door.
    const inside = kitToWorld({ r: 0, y: 0, f: middle }, base, facing);
    assert.equal(world.get(inside.join(',')), '', 'hollow inside');
    assert.ok(sheltered(solidAt, inside[0], inside[1], inside[2]), `safe inside, yaw ${yaw}`);
    // The door faces the child: the tapped spot is the door.
    assert.equal(world.get(base.join(',')), 'door');
    const open = (x, y, z) => {
      const t = world.get([x, y, z].join(','));
      return t === 'door' || t === 'door_top' ? false : solidAt(x, y, z);
    };
    assert.equal(sheltered(open, inside[0], inside[1], inside[2]), false, 'an open door lets the bugs in');
  }
});

test('stairs climb one block a step, and a bridge lies level with the ground', async () => {
  const { kitCells } = await import('../sidecars/blocks/prizes.mjs');
  const tops = new Map();
  for (const c of kitCells('stairs')) tops.set(c.f, Math.max(tops.get(c.f) ?? -1, c.y));
  [...tops.keys()].sort((a, b) => a - b).forEach((f, i, all) => { if (i) assert.equal(tops.get(f) - tops.get(all[i - 1]), 1); });
  assert.ok(kitCells('bridge').every(c => c.y === -1 && c.type === 'planks'));
});

test('kits face the way the child looks', async () => {
  const { facingFromYaw, kitToWorld } = await import('../sidecars/blocks/prizes.mjs');
  assert.deepEqual(facingFromYaw(0), [0, -1]);
  assert.deepEqual(facingFromYaw(Math.PI / 2), [-1, 0]);
  // One step forward and one to the right, looking down -z: right is +x.
  assert.deepEqual(kitToWorld({ r: 1, y: 0, f: 1 }, [0, 0, 0], [0, -1]), [1, 0, -1]);
});

test('first home choices and boss loot include every reward', async () => {
  const { FIRST_HOME_CHOICES, KITS, POWERS, allRewards } = await import('../sidecars/blocks/prizes.mjs');
  assert.deepEqual(FIRST_HOME_CHOICES, ['fortress', 'house', 'skyscraper']);
  assert.ok(FIRST_HOME_CHOICES.every(id => id in KITS));
  const rewards = allRewards();
  assert.ok(Object.keys(KITS).every(id => rewards.some(r => r.kind === 'kit' && r.id === id)));
  assert.ok(Object.keys(POWERS).every(id => rewards.some(r => r.kind === 'power' && r.id === id)));
  assert.equal(POWERS.strength.seconds, 60);
});

test('every prize line has a baked voice clip, and kits survive a save', async () => {
  const { PRIZE_LINES } = await import('../sidecars/blocks/prizes.mjs');
  for (const line of PRIZE_LINES) assert.ok(bakedLines.includes(line), line);
  const back = readSave(JSON.stringify({ kits: ['house', 7, 'tree'] }), { starter: ['grass'], all: ['grass'] });
  assert.deepEqual(back.kits, ['house', 'tree']);
});

test('a friend room sends the host world in parts and checks every block change that comes in', async () => {
  const { readEdit, readSpot, roomLine, worldCollector, worldParts } = await import('../sidecars/blocks/friends.mjs');
  const known = t => ['red', 'door', 'planks'].includes(t);
  const edits = Array.from({ length: 3500 }, (_, i) => [`${i}.20.5`, i % 2 ? 'red' : '']);
  const parts = worldParts(edits, 1500);
  assert.equal(parts.length, 3);
  const got = worldCollector();
  assert.equal(got.add(parts[0], known), null);
  assert.equal(got.add(parts[2], known), null, 'a part out of order is dropped');
  const fresh = worldCollector();
  let all = null;
  for (const p of parts) all = fresh.add(p, known);
  assert.equal(all.length, 3500);
  assert.deepEqual(worldCollector().add(worldParts([])[0], known), [], 'an untouched world still arrives');
  assert.deepEqual(readEdit('3.-2.7', 'door', known), { pos: [3, -2, 7], type: 'door' });
  assert.deepEqual(readEdit('3.4.5', '', known), { pos: [3, 4, 5], type: '' });
  assert.equal(readEdit('3.4.5', 'ocean', known), null);
  assert.equal(readEdit('3.4.5', 'lava', known), null);
  assert.equal(readEdit('3.4', 'red', known), null);
  assert.equal(readEdit({}, 'red', known), null);
  assert.deepEqual(readSpot([1, 2, 3]), [1, 2, 3]);
  assert.equal(readSpot([1, 2, Infinity]), null);
  assert.match(roomLine({ role: 'host', peer: false, room: 'ab12', url: 'https://x/?room=ab12' }), /\?room=ab12/);
  assert.doesNotMatch(roomLine({ role: 'host', peer: false, room: 'wifi', url: 'https://x/?room=wifi' }), /room=wifi/, 'no link to share offline');
  assert.equal(roomLine({ role: 'solo', status: '' }), '');
});

test('each new morning in free build brings a few gift boxes back', async () => {
  const { DAY_BOXES, NEW_DAY, PRIZE_LINES } = await import('../sidecars/blocks/prizes.mjs');
  assert.ok(DAY_BOXES >= 1);
  assert.ok(PRIZE_LINES.includes(NEW_DAY));
  assert.ok(bakedLines.includes(NEW_DAY));
});

test('the tough question gives a fortress first time, else the little house, so every visit gets a home', async () => {
  const { toughPrize, KITS, KIT_ORDER, TOUGH_LINE, PRIZE_LINES } = await import('../sidecars/blocks/prizes.mjs');
  assert.equal(toughPrize(false), 'fortress');
  assert.equal(toughPrize(true), 'house');
  assert.ok(KITS.fortress && KITS.house);
  assert.ok(!KIT_ORDER.includes('house') && !KIT_ORDER.includes('fortress'));
  assert.ok(PRIZE_LINES.includes(TOUGH_LINE) && bakedLines.includes(TOUGH_LINE));
  const { localQuestion, normalizeAsk } = await import('../sidecars/blocks/quiz.mjs');
  assert.equal(localQuestion(Math.random, 0).tough, true);
  assert.ok(!localQuestion(Math.random, 1).tough);
  const ask = { choices: [{ label: '1', ok: true }, { label: '2' }] };
  assert.equal(normalizeAsk({ ...ask, tough: true }).tough, true);
  assert.equal(normalizeAsk(ask).tough, false);
});

test('two bugs the first night, one more each night, up to the most', async () => {
  const { nightBugs, MAX_BUGS } = await import('../sidecars/blocks/night.mjs');
  assert.deepEqual(nightBugs(0).map(b => b.kind), ['caterpillar', 'spider']);
  assert.deepEqual(nightBugs(1).map(b => b.kind), ['caterpillar', 'spider', 'boss']);
  assert.equal(nightBugs(3).length, 5);
  assert.equal(nightBugs(99).length, MAX_BUGS);
  const delays = nightBugs(99).map(b => b.delay);
  assert.ok(delays.every((d, i) => !i || d >= delays[i - 1]), 'later bugs set out later');
});
