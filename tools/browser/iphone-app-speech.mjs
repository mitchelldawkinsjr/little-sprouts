import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium, devices, webkit } from 'playwright';

const engine = process.env.SPEECH_BROWSER || 'webkit';
const port = process.env.SPEECH_APP_PORT || '4179';
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server/serve.mjs'], {
  cwd: new URL('../../', import.meta.url), env: { ...process.env, PORT: port }, stdio: 'ignore'
});
let browser;

// Run the real app and real DOM event handlers. Linux WebKit has no iOS speech
// service or iOS-only permission gate, so model just those APIs explicitly.
async function installPhoneSpeech(context) {
  await context.addInitScript(() => {
    localStorage.setItem('sprouts-v1', JSON.stringify({
      active: 0, sound: true, voice: 'af_heart', camera: false,
      profiles: [{ name: 'Audio check', sprite: 'fox', stage: 'grade2', level: 1,
        rounds: 5, style: 'tap', words: ['see', 'can', 'the'], stars: 0 }]
    }));
    let gestureEvent, unlocked = false, active;
    window.speechCalls = [];
    window.holdSpeech = false;
    window.failSpeech = false;
    window.interruptSpeech = false;
    for (const type of ['touchend', 'click', 'keydown']) document.addEventListener(type, event => { gestureEvent = event; }, true);
    Object.defineProperty(window, 'speechSynthesis', { value: {
      paused: false,
      getVoices: () => [],
      cancel() {
        if (!active) return;
        const previous = active;
        active = null;
        clearTimeout(previous.timer);
        previous.line.onerror?.({ error: 'canceled' });
      },
      resume() { this.paused = false; },
      speak(line) {
        const gesture = !!(gestureEvent?.isTrusted && gestureEvent.eventPhase);
        if (gesture) unlocked = true;
        const call = { text: line.text, gesture, accepted: unlocked, started: false, completed: false };
        speechCalls.push(call);
        if (!unlocked || this.paused || !line.text) return;
        const request = { line, timer: 0 };
        active = request;
        request.timer = setTimeout(() => {
          if (active !== request) return;
          if (failSpeech) { active = null; line.onerror?.({ error: 'synthesis-failed' }); return; }
          call.started = true;
          line.onstart?.();
          if (holdSpeech) return;
          request.timer = setTimeout(() => {
            if (active !== request) return;
            active = null;
            if (window.interruptSpeech) {
              window.interruptSpeech = false;
              line.onerror?.({ error: 'interrupted' });
              return;
            }
            call.completed = true;
            line.onend?.();
          }, 60);
        }, 20);
      }
    } });
    window.Worker = class {
      postMessage(message) {
        if (message.type === 'SYNTHESIZE') setTimeout(() => this.onmessage({ data: { type: 'ERROR', kind: 'miss', id: message.id } }), 50);
      }
    };
  });
}

async function status(page) {
  return page.evaluate(async () => (await import('/lib/speech.js?v=offline4')).getSpeechStatus());
}

async function completeAfter(page, before) {
  await page.waitForFunction(async count => (await import('/lib/speech.js?v=offline4')).getSpeechStatus().metrics.completed > count,
    before, { timeout: 15000 });
  await page.waitForFunction(() => !document.body.classList.contains('listen-first'));
}

async function openShapes(page) {
  await page.locator('[data-shelf="all"]').first().tap();
  await page.locator('.gcard-play[data-game="shapes"]').tap();
  await page.waitForSelector('.playtop[data-mode="shapes"]');
}

async function goHome(page) {
  await page.locator('#back').tap();
  await page.waitForFunction(() => document.querySelector('.greet') || document.querySelector('#confirm[open]'));
  if (await page.locator('#confirm[open]').count()) await page.locator('#confirm').getByRole('button', { name: 'Leave round', exact: true }).tap();
  await page.waitForSelector('.greet').catch(async error => {
    console.error('Home navigation failed:', await page.evaluate(() => ({
      hash: location.hash, dialogs: [...document.querySelectorAll('dialog[open]')].map(el => el.outerHTML),
      text: document.querySelector('#app')?.innerText.slice(0, 500)
    })));
    throw error;
  });
}

try {
  for (let tries = 0; ; tries++) {
    if (await fetch(`${origin}/healthz`).then(r => r.ok).catch(() => false)) break;
    if (tries > 50) throw new Error('Full-app speech test server did not start');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await ({ webkit, chromium }[engine]).launch({
    headless: true,
    ...(process.env.SPEECH_BROWSER_EXECUTABLE ? { executablePath: process.env.SPEECH_BROWSER_EXECUTABLE } : {})
  });
  for (const name of ['iPhone SE', 'iPhone 13']) {
    const { defaultBrowserType, ...phone } = devices[name];
    const context = await browser.newContext({ ...phone, serviceWorkers: 'block' });
    await installPhoneSpeech(context);
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin);
    await page.waitForSelector('.greet');

    await openShapes(page);
    await completeAfter(page, 0);
    let before = await status(page);
    const prompt = await page.evaluate(async () => (await import('/app/runtime.mjs?v=lean-r2')).rt.game.prompt);
    assert.ok(await page.evaluate(text => speechCalls.some(call => call.text === text && call.completed), prompt), 'actual opening question completed');
    assert.equal(await page.evaluate(() => speechCalls.filter(call => !call.text && call.gesture).length), 1, 'app has one speech unlock instance');

    await page.locator('#playListen').tap();
    await completeAfter(page, before.metrics.completed);
    assert.equal(await page.evaluate(text => speechCalls.filter(call => call.text === text && call.completed).length, prompt), 2, 'toolbar Hear it again repeats the actual question');

    // Answer through the real choice control, then advance to another question.
    const answer = await page.evaluate(async () => (await import('/app/runtime.mjs?v=lean-r2')).rt.game.target);
    await page.locator(`.choice[aria-label="${answer}"]`).tap();
    await page.locator('#next').waitFor({ state: 'visible' });
    await page.waitForFunction(async () => !(await import('/lib/speech.js?v=offline4')).getSpeechStatus().speaking);
    before = await status(page);
    const nextCalls = await page.evaluate(() => speechCalls.length);
    await page.locator('#next').tap();
    await completeAfter(page, before.metrics.completed);
    await page.waitForFunction(async () => (await import('/app/runtime.mjs?v=lean-r2')).rt.game.index === 1);
    assert.ok(await page.evaluate(async count => {
      const prompt = (await import('/app/runtime.mjs?v=lean-r2')).rt.game.prompt;
      return speechCalls.slice(count).some(call => call.text === prompt && call.completed);
    }, nextCalls), 'advancing completes the next actual question, independently of the correct-answer cheer');
    assert.ok((await status(page)).metrics.failed === 0);

    // Pause/resume is simulated; the actual app's visibility and replay handlers run.
    await page.evaluate(() => { window.holdSpeech = true; });
    await page.locator('#playListen').tap();
    await page.waitForFunction(async () => (await import('/lib/speech.js?v=offline4')).getSpeechStatus().speaking === 'browser');
    before = await status(page);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(async () => !(await import('/lib/speech.js?v=offline4')).getSpeechStatus().speaking);
    await page.evaluate(() => {
      window.holdSpeech = false;
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await completeAfter(page, before.metrics.completed);

    // A failed question exposes the actual app's retry notice, which recovers.
    await page.evaluate(() => { window.failSpeech = true; });
    await page.locator('#playListen').tap();
    await page.locator('#speechNotice button').waitFor({ state: 'visible' });
    before = await status(page);
    await page.evaluate(() => { window.failSpeech = false; });
    await page.locator('#speechNotice button').tap();
    await completeAfter(page, before.metrics.completed);
    assert.equal(await page.locator('#speechNotice').count(), 0);

    // An unexpected platform interruption should also offer a usable retry.
    await page.evaluate(() => { window.interruptSpeech = true; });
    await page.locator('#playListen').tap();
    await page.locator('#speechNotice button').waitFor({ state: 'visible' });
    before = await status(page);
    assert.equal(before.speechError, 'browser-interrupted');
    const interrupted = await page.evaluate(() => ({ text: speechCalls.at(-1).text, calls: speechCalls.length }));
    await page.waitForTimeout(450);
    assert.equal(await page.evaluate(() => speechCalls.length), interrupted.calls, 'partially heard words must wait for a manual retry');
    await page.locator('#speechNotice button').tap();
    await completeAfter(page, before.metrics.completed);
    await page.waitForFunction(({ count, text }) => speechCalls.slice(count).some(call => call.text === text && call.completed),
      { count: interrupted.calls, text: interrupted.text });
    assert.equal(await page.locator('#speechNotice').count(), 0);

    await goHome(page);
    await page.locator('#readToMe').tap();
    assert.equal(await page.locator('#readToMe').getAttribute('aria-pressed'), 'false');
    const silentRequests = (await status(page)).metrics.requests;
    await openShapes(page);
    await page.locator('#playListen').tap();
    await page.waitForTimeout(700);
    assert.equal((await status(page)).metrics.requests, silentRequests, 'Read to me off blocks new speech requests');
    assert.equal(await page.locator('#speechNotice').count(), 0);
    assert.deepEqual(errors, []);
    console.log(`${engine} ${name}: full app game opening, Hear it again, next question, simulated background recovery, failure retry and Read to me off passed (iOS speech service/gate simulated)`);
    await context.close();
  }
} finally {
  await browser?.close();
  server.kill();
}
