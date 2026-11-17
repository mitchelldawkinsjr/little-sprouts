import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';

const { chromium } = await import('/tmp/sprouts-capture/node_modules/playwright-core/index.mjs');
const chrome = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/opt/google/chrome/chrome', '/usr/bin/chromium']
  .find(existsSync);
assert.ok(chrome, 'Google Chrome / Chromium must be installed on the runner');
mkdirSync('docs/screenshots', { recursive: true });
const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader']
});
const profile = {
  name: 'Sprout', stage: 'preschool', level: 1, rounds: 5,
  style: 'tap', sprite: 'fox', words: ['I', 'a', 'the', 'my', 'see'],
  stars: 0, earned: 0, sessions: 0, correct: 0, total: 0
};
const saved = {
  active: 0, sound: false, voice: 'af_heart',
  characterVoices: false, camera: false, profiles: [profile]
};
try {
  async function capture({ width, height, prefix, focus = false }) {
    const context = await browser.newContext({
      viewport: { width, height }, deviceScaleFactor: 1,
      reducedMotion: 'reduce'
    });
    await context.addInitScript(value => {
      localStorage.setItem('sprouts-v1', JSON.stringify(value));
    }, saved);
    const page = await context.newPage();
    const failures = [];
    page.on('pageerror', e => failures.push(e.message));
    await page.goto('http://127.0.0.1:8000/#play/walk', {
      waitUntil: 'domcontentloaded', timeout: 35000
    });
    await page.locator('#playAlone').waitFor({ state: 'visible', timeout: 35000 });
    await page.locator('iframe.sidecar-frame').waitFor({ state: 'visible', timeout: 35000 });
    const ids = ['back', 'playAlone', 'playListen', 'playFocus', 'playFull'];
    const row = await page.evaluate(ids => ids.map(id => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { id, top: r.top, bottom: r.bottom, left: r.left, right: r.right,
        visible: !!(r.width && r.height) && getComputedStyle(el).visibility !== 'hidden' };
    }), ids);
    assert.ok(row.every(Boolean), 'Expected all game toolbar buttons');
    assert.ok(row.every(x => x.visible), 'Toolbar buttons should be visible');
    assert.ok(Math.max(...row.map(x => x.top)) - Math.min(...row.map(x => x.top)) < 8,
      'Toolbar buttons must be on one horizontal row');
    assert.ok(row.every(x => x.right <= width + 1), 'Toolbar should fit tablet width');
    if (focus) {
      await page.locator('#playFocus').click();
      await page.locator('body.play-focus').waitFor();
      assert.equal(await page.locator('#playAlone').isVisible(), true,
        'Focus view must not hide Play on its own');
      assert.equal(await page.locator('#playFocus').isVisible(), true,
        'Focus toggle remains available to exit');
    }
    await page.waitForTimeout(2200);
    const path = `docs/screenshots/${prefix}.png`;
    await page.screenshot({ path, animations: 'disabled', fullPage: false });
    console.log(JSON.stringify({ screenshot: path, viewport: [width, height], focus,
      buttons: row.map(x => x.id), pageErrors: failures.slice(0, 4) }));
    await context.close();
  }
  await capture({ width: 1180, height: 820, prefix: 'tablet-game-toolbar-landscape' });
  await capture({ width: 1180, height: 820, prefix: 'tablet-game-focus-landscape', focus: true });
  await capture({ width: 820, height: 1180, prefix: 'tablet-game-focus-portrait', focus: true });
} finally {
  await browser.close();
}
