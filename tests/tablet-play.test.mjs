import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { makePlayFullscreen } from '../lib/play-fullscreen.mjs';
import { inventory } from '../tools/static-files.mjs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('the game enters and exits browser fullscreen on the document element', async () => {
  const root = {};
  const doc = { documentElement: root, fullscreenEnabled: true };
  root.requestFullscreen = async function () {
    assert.equal(this, root);
    doc.fullscreenElement = root;
  };
  doc.exitFullscreen = async function () {
    assert.equal(this, doc);
    doc.fullscreenElement = null;
  };
  const play = makePlayFullscreen(doc);
  assert.equal(play.canRequest, true);
  await play.toggle();
  assert.equal(play.native, true);
  assert.equal(play.expanded, false);
  await play.toggle();
  assert.equal(play.native, false);
  await play.toggle();
  await play.leave();
  assert.equal(play.native, false);
});

test('prefixed WebKit fullscreen remains available when there is no standard method', async () => {
  const doc = { documentElement: {}, webkitFullscreenEnabled: true };
  doc.documentElement.webkitRequestFullscreen = () => { doc.webkitFullscreenElement = doc.documentElement; };
  doc.webkitExitFullscreen = () => { doc.webkitFullscreenElement = null; };
  const play = makePlayFullscreen(doc);
  await play.toggle();
  assert.equal(play.native, true);
  await play.toggle();
  assert.equal(play.native, false);
  assert.equal(play.expanded, false);
});

test('when fullscreen is missing, restricted, or denied, expand the game and allow toggling back', async () => {
  for (const doc of [
    { documentElement: {} },
    { fullscreenEnabled: false, documentElement: { requestFullscreen() { assert.fail('disabled API should not be called'); } } },
    { documentElement: { async requestFullscreen() { throw new Error('not allowed'); } } },
    { documentElement: { async requestFullscreen() {} } }
  ]) {
    const play = makePlayFullscreen(doc);
    await play.toggle();
    assert.equal(play.native, false);
    assert.equal(play.expanded, true);
    await play.toggle();
    assert.equal(play.expanded, false);
    await play.toggle();
    play.leave();
    assert.equal(play.expanded, false);
  }
});

test('leaving a game while fullscreen is pending does not expand the shelf', async () => {
  const doc = { documentElement: {}, exitFullscreen() { this.fullscreenElement = null; } };
  let resolve;
  doc.documentElement.requestFullscreen = () => new Promise(done => { resolve = done; });
  const play = makePlayFullscreen(doc);
  const toggled = play.toggle();
  play.leave();
  doc.fullscreenElement = doc.documentElement;
  resolve();
  await toggled;
  assert.equal(play.native, false);
  assert.equal(play.expanded, false);
});

test('each shelf sidecar loads the playfield policy in its own document', () => {
  const paths = Array.from(read('lib/sidecar.js').matchAll(/src: '(sidecars\/[^'?]+\.html)\?/g), m => m[1]);
  assert.ok(paths.length >= 25);
  for (const path of paths) {
    if (path === 'sidecars/rally/index.html' && !existsSync(new URL(path, root))) {
      const build = read('tools/build-sidecar.sh');
      assert.match(build, /\/lib\/game-touch\.css/, path);
      assert.match(build, /data-game-touch-canvas/, path);
      continue;
    }
    const page = read(path);
    assert.match(page, /href="\/lib\/game-touch\.css\?v=1"/, path);
    assert.match(page, /<body\b[^>]*\bdata-game-(?:touch-canvas|tap)\b/, path);
    assert.doesNotMatch(page, /<meta\s+name="viewport"[^>]*(?:user-scalable\s*=\s*no|maximum-scale\s*=\s*1)\b/i, path);
    assert.doesNotMatch(page, /<body\b[^>]*\bdata-game-touch(?=\s|>)/, 'a sidecar body must not lock its menus');
  }
});

test('the shelf keeps its normal viewport and the offline inventory includes the shared protection', () => {
  assert.match(read('index.html'), /href="lib\/game-touch\.css\?v=1"/);
  assert.doesNotMatch(read('index.html'), /user-scalable|maximum-scale|data-game-touch-canvas/);
  assert.doesNotMatch(read('lib/touch-controls.mjs'), /document\.(?:documentElement|body)\.style\.touchAction/);
  const files = inventory(fileURLToPath(root)).offline();
  assert.ok(files['./lib/game-touch.css']);
  assert.ok(files['./lib/play-fullscreen.mjs']);
  assert.match(read('sw.js'), /'\.\/lib\/game-touch\.css'/);
});


test('solo launch shares the game toolbar with focus and fullscreen on every sidecar', () => {
  const mounts = read('app/mounts.mjs');
  assert.match(mounts, /function playTopControls\(alone = ''\)/);
  assert.match(mounts, /<div class="play-actions">\$\{alone\}/);
  assert.match(mounts, /\$\{playTopControls\(alone\)\}<\/div>\$\{bar\}/);
  assert.doesNotMatch(mounts, /<\/div>\$\{alone\}\$\{bar\}/);
  assert.match(mounts, /class="quiet play-alone" id="playAlone"/);
  assert.match(mounts, /aria-describedby="playAloneNote"/);
  assert.match(mounts, /if \(\$\('#playAlone'\)\) \$\('#playAlone'\)\.onclick = openSidecarAlone;/);
});

test('focus and fullscreen keep tablet controls visible and enlarge the sidecar frame', () => {
  const mounts = read('app/mounts.mjs');
  const css = read('style.css');
  assert.doesNotMatch(mounts, /focus\.hidden\s*=\s*playFullscreen/);
  assert.match(css, /\.playtop\{gap:8px;flex-wrap:nowrap/);
  assert.match(css, /\.play-actions\{[^}]*flex:0 0 auto/);
  assert.doesNotMatch(css, /body:is\(\.play-focus,\.play-expanded,\.play-native-full\):has\(\.playtop\) \.play-alone\{display:none\}/);
  assert.match(css, /body:is\(\.play-focus,\.play-expanded,\.play-native-full\):has\(\.playtop\)>main\{max-width:none/);
  assert.match(css, /body:is\(\.play-focus,\.play-expanded,\.play-native-full\) \.sidecar-frame\{min-height:0/);
  assert.match(css, /\.play-alone-short\{display:none\}\s*@media\(max-width:560px\)\{\.play-alone-short\{display:inline\}\}/);
});


test('new games start in Focus, returning to the shelf clears it, and the toggle stays reversible', () => {
  const mounts = read('app/mounts.mjs');
  const css = read('style.css');
  const start = mounts.split('function start(mode, { syncHash = true } = {}) {')[1].split('function paintArcadePrompt(')[0];
  const home = mounts.split('function home(focus, { syncHash = true } = {}) {')[1].split('function ')[0];
  const wiring = mounts.split('function wirePlayViewControls(doListen) {')[1].split('function leavePlayFullscreen()')[0];

  assert.match(start, /document\.body\.classList\.add\('play-focus'\)/);
  assert.match(home, /document\.body\.classList\.remove\('play-focus'\)/);
  assert.match(wiring, /setPlayFocus\(!playFocusOn\(\)\)/);
  assert.doesNotMatch(wiring, /sessionStorage\.getItem\('ls:play-focus'\)/);
  assert.doesNotMatch(mounts, /sessionStorage\.setItem\('ls:play-focus'/);
  // Questions presented in the host playfield must remain readable in the default Focus view.
  assert.doesNotMatch(css, /body\.play-focus:not\([^}]+\.playarea h1\{position:absolute/);
  assert.match(css, /body\.play-focus:has\(\.playtop\) \.playarea h1\{font-size:/);
});
