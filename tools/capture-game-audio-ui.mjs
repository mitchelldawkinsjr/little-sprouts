import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';

const { chromium } = await import('/tmp/sprouts-capture/node_modules/playwright-core/index.mjs');
const chrome = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/opt/google/chrome/chrome', '/usr/bin/chromium'].find(existsSync);
assert.ok(chrome, 'Chrome / Chromium must be installed on the runner');
mkdirSync('docs/screenshots', { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
const profile = {
  name: 'Sprout', stage: 'preschool', level: 1, rounds: 5,
  style: 'tap', sprite: 'fox', words: ['I','a','the','my','see'],
  stars: 0, earned: 0, sessions: 0, correct: 0, total: 0
};
const saved = { active: 0, sound: false, voice: 'af_heart', characterVoices: false, camera: false, profiles: [profile] };
async function capture(width, height, name, parent = false) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await context.addInitScript(value => { localStorage.setItem('sprouts-v1', JSON.stringify(value)); }, saved);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('http://127.0.0.1:8000/#play/walk', { waitUntil: 'domcontentloaded', timeout: 35000 });
  await page.locator('#playAudio').waitFor({ state: 'visible', timeout: 35000 });
  await page.locator('iframe.sidecar-frame').waitFor({ state: 'visible', timeout: 35000 });
  assert.equal(await page.locator('body.play-focus').count(), 1, 'Games should start in Focus mode');
  const ids = ['back','playAlone','playListen','playAudio','playFocus','playFull'];
  const row = await page.evaluate(ids => ids.map(id => {
    const el = document.getElementById(id);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { id, top: b.top, right: b.right, visible: b.width > 0 && b.height > 0 && getComputedStyle(el).visibility !== 'hidden' };
  }), ids);
  assert.ok(row.every(x => x && x.visible), 'Every gameplay control is visible');
  assert.ok(Math.max(...row.map(x => x.top)) - Math.min(...row.map(x => x.top)) < 8, 'Game controls must stay on one row');
  assert.ok(row.every(x => x.right <= width + 1), 'Game toolbar must fit tablet viewport');

  assert.equal(await page.locator('#playAudio').getAttribute('aria-pressed'), 'true');
  await page.locator('#playAudio').click();
  assert.equal(await page.locator('#playAudio').getAttribute('aria-pressed'), 'false');
  let settings = await page.evaluate(() => JSON.parse(localStorage.getItem('sprouts-v1')).audio);
  assert.equal(settings.muted, true, 'Mute should persist without disabling narration');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('sprouts-v1')).sound), false);
  await page.locator('#playAudio').click();
  assert.equal(await page.locator('#playAudio').getAttribute('aria-pressed'), 'true');
  settings = await page.evaluate(() => JSON.parse(localStorage.getItem('sprouts-v1')).audio);
  assert.equal(settings.muted, false);
  const engine = await page.evaluate(async () => {
    const { rt } = await import('/app/runtime.mjs?v=lean-r2');
    return { currentGame: rt.audio.currentGame, ready: rt.audio.ready };
  });
  assert.equal(engine.currentGame, 'walk');
  if (parent) {
    await page.locator('#playFocus').click();
    await page.evaluate(() => document.getElementById('settings').showModal());
    const controls = ['audioMaster','audioMusic','audioEffects','audioAmbience','audioMuted'];
    for (const name of controls) assert.equal(await page.locator('#'+name).count(), 1);
    await page.locator('#audioMusic').evaluate(el => { el.value = 35; el.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.equal(await page.locator('#audioMusicValue').textContent(), '35%');
    await page.locator('#audioMusic').scrollIntoViewIfNeeded();
  }
  await page.waitForTimeout(650);
  const output = 'docs/screenshots/' + name + '.png';
  await page.screenshot({ path: output, animations: 'disabled' });
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  console.log(JSON.stringify({ screenshot: output, width, height, parent, row: row.map(x=>x.id), engine, errors }));
  await context.close();
}
try {
  await capture(1180, 820, 'game-audio-toolbar-tablet');
  await capture(820, 1180, 'game-audio-portrait-tablet');
  await capture(1180, 820, 'game-audio-parent-settings', true);
} finally { await browser.close(); }
