import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { FEATURED_GAMES, GAME_ADDED, featuredGames, orderGames, recentGameIds, recentGames, rememberGame } from '../lib/game-discovery.mjs';
import { discoveryHtml, shelfPanelHtml, gameCardHtml, GAMEPLAY_ART } from '../lib/home-ui.mjs';
import { sidecarRows } from '../lib/sidecar.js';
import { inventory } from '../tools/static-files.mjs';

const games = ['shapes', 'gulp', 'skybound', 'boss', 'cabin', 'sketchbook', 'blocks', 'moon-swing', 'canyon-pods'].map(id => [id, id]);
const ids = rows => rows.map(row => row[0]);
const card = id => `<article data-test-game="${id}"></article>`;

test('featured games follow the requested order and omit unavailable games', () => {
  assert.deepEqual(ids(featuredGames(games)), ['blocks', 'sketchbook', 'cabin', 'boss', 'skybound', 'gulp']);
  assert.deepEqual(ids(featuredGames(games.filter(([id]) => !['blocks', 'boss'].includes(id)))), ['sketchbook', 'cabin', 'skybound', 'gulp']);
  assert.deepEqual(featuredGames([]), []);
});

test('browse sorting features the six picks or uses fixed addition dates, without changing the catalog', () => {
  const before = [...games];
  assert.deepEqual(ids(orderGames(games)).slice(0, 6), FEATURED_GAMES);
  const newest = ids(orderGames(games, 'newest'));
  assert.equal(newest[0], 'moon-swing');
  assert.ok(newest.indexOf('canyon-pods') < newest.indexOf('skybound'));
  assert.equal(newest.at(-1), 'shapes');
  assert.deepEqual(new Set(newest), new Set(ids(games)));
  assert.deepEqual(games, before);
  assert.deepEqual(ids(orderGames([...games].reverse(), 'newest')), newest);
  assert.deepEqual(ids(orderGames([['future-game'], ['shapes']], 'newest')), ['shapes', 'future-game']);
});

test('every registered game has an explicit valid addition date', () => {
  const helpers = readFileSync(new URL('../app/helpers.mjs', import.meta.url), 'utf8');
  const builtins = [...helpers.split('const games = ')[1].split('.concat(sidecarRows())')[0].matchAll(/\['([\w-]+)',/g)].map(m => m[1]);
  const all = [...builtins, ...sidecarRows().map(row => row[0])];
  assert.equal(all.length, Object.keys(GAME_ADDED).length);
  for (const id of all) {
    assert.match(GAME_ADDED[id], /^\d{4}-\d{2}-\d{2}$/, id);
    assert.equal(new Date(GAME_ADDED[id]).toISOString().slice(0,10), GAME_ADDED[id]);
  }
});

test('recent play is bounded, deduplicated, per learner, and compatible with old profiles', () => {
  const alice = { lastPlayed: 'blocks' };
  const bob = { lastPlayed: 'boss' };
  assert.deepEqual(recentGameIds(alice), ['blocks']);
  assert.deepEqual(recentGameIds({recentGames:'invalid'}), []);
  alice.recentGames = rememberGame(alice, 'gulp');
  alice.lastPlayed = 'gulp';
  assert.deepEqual(recentGameIds(alice), ['gulp', 'blocks']);
  assert.deepEqual(recentGameIds(bob), ['boss']);
  assert.deepEqual(rememberGame({lastPlayed:'a',recentGames:['b','c','d','e','f','g']},'c'), ['c','a','b','d','e','f']);
  assert.deepEqual(ids(recentGames(games, {lastPlayed:'missing-game',recentGames:['blocks','gulp']})), ['blocks','gulp']);
});

test('discovery hides empty recent rows, filters every row to available games, and renders exact featured order', () => {
  const html = discoveryHtml(games, {}, card);
  assert.ok(!html.includes('Keep Playing'));
  const featured = html.split('data-discovery="featured"')[1].split('</section>')[0];
  assert.deepEqual([...featured.matchAll(/data-test-game="([^"]+)"/g)].map(m=>m[1]), FEATURED_GAMES);
  const offline = discoveryHtml([['blocks']], {lastPlayed:'gulp'}, card);
  assert.ok(!offline.includes('data-test-game="gulp"'));
  assert.ok(!offline.includes('Keep Playing'));
  assert.ok(discoveryHtml(games, {lastPlayed:'gulp'}, card).includes('Keep Playing'));
  assert.equal(discoveryHtml([], {}, card), '');
});

test('all-games and category sorting preserve membership and expose the active sort', () => {
  const available = [{id:'test',label:'Test',games}];
  const html = shelfPanelHtml(available, 'all', 'blocks', card, 'featured');
  assert.deepEqual([...html.matchAll(/data-test-game="([^"]+)"/g)].map(m=>m[1]), ids(orderGames(games)));
  const newest = shelfPanelHtml(available, 'newest', '', card, 'newest');
  assert.match(newest, /value="newest" selected/);
  assert.deepEqual([...newest.matchAll(/data-test-game="([^"]+)"/g)].map(m=>m[1]), ids(orderGames(games,'newest')));
  const category = shelfPanelHtml([{id:'test',label:'Test',games:[['gulp'],['blocks']]}], 'test', '', card);
  assert.deepEqual([...category.matchAll(/data-test-game="([^"]+)"/g)].map(m=>m[1]), ['blocks','gulp']);
});

test('every game has a gameplay picture in the offline pack and an accessible play button', () => {
  const root = new URL('../', import.meta.url).pathname;
  const manifest = inventory(root).offline();
  for(const id of Object.keys(GAME_ADDED)) {
    assert.ok(GAMEPLAY_ART.has(id));
    assert.ok(existsSync(new URL(`../icons/gameplay/${id}.jpg`, import.meta.url)));
    assert.ok(manifest[`./icons/gameplay/${id}.jpg`]);
    const html = gameCardHtml({gid:id,name:id,blurb:'Play',icon:'',tint:'#fff',stageLabel:'Pre-K',level:1,state:'New',esc:String});
    assert.match(html, new RegExp(`src="icons/gameplay/${id}.jpg"`));
    assert.match(html, new RegExp(`class="gcard-play" data-game="${id}" aria-label="Play`));
  }
});
