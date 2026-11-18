import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium, devices, webkit } from 'playwright';

const engine = process.env.SPEECH_BROWSER || 'webkit';
const port = '4178';
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server/serve.mjs'], {
  cwd: new URL('../../', import.meta.url), env: { ...process.env, PORT: port }, stdio: 'ignore'
});
let browser;
const fixture = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
<button id="unlock">Enable read-aloud</button><button id="recording">Read recording</button>
<button id="question">Read question</button><button id="retry">Hear it again</button>
<script type="module">
import * as speech from '/lib/speech.js?v=offline4';
window.speech = speech;
const read = line => { window.result = null; speech.speakAndWait(line).then(result => window.result = result); };
document.querySelector('#recording').onclick = () => read('Try another one.');
document.querySelector('#question').onclick = () => read('A custom question without a recording.');
document.querySelector('#retry').onclick = () => { window.result = null; speech.retrySpeech().then(result => window.result = result); };
</script>`;

async function page(context) {
  await context.route(`${origin}/__speech-smoke`, route => route.fulfill({ contentType: 'text/html', body: fixture }));
  const page = await context.newPage();
  page.on('pageerror', error => { throw error; });
  await page.goto(`${origin}/__speech-smoke`);
  await page.waitForFunction(() => !!window.speech);
  return page;
}

try {
  for (let tries = 0; ; tries++) {
    if (await fetch(`${origin}/healthz`).then(r => r.ok).catch(() => false)) break;
    if (tries > 50) throw new Error('Speech test server did not start');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await ({ webkit, chromium }[engine]).launch({
    headless: true,
    ...(process.env.SPEECH_BROWSER_EXECUTABLE ? { executablePath: process.env.SPEECH_BROWSER_EXECUTABLE } : {})
  });
  const { defaultBrowserType, ...iphone } = devices['iPhone 13'];
  const options = { ...iphone, serviceWorkers: 'block' };

  // Real Web Audio and the real shipped AAC file: fetch, decode, start, onended.
  const audioContext = await browser.newContext(options);
  const recording = await page(audioContext);
  await recording.locator('#recording').tap();
  await recording.waitForFunction(() => window.result?.status === 'completed', null, { timeout: 15000 });
  assert.equal(await recording.evaluate(() => window.result.engine), 'kokoro');
  assert.equal(await recording.evaluate(() => window.speech.getSpeechStatus().metrics.completed), 1);
  await audioContext.close();
  console.log(`${engine}: real shipped recording decoded and completed in an iPhone viewport`);

  // Linux WebKit lacks the iOS-only speech restriction and system voices. Model
  // that gate explicitly while retaining real DOM events and real Web Audio.
  const gatedContext = await browser.newContext(options);
  await gatedContext.addInitScript(() => {
    let gestureEvent, unlocked = false;
    window.speechCalls = [];
    window.failSpeech = false;
    for (const type of ['touchend', 'click', 'keydown']) document.addEventListener(type, event => { gestureEvent = event; }, true);
    Object.defineProperty(window, 'speechSynthesis', { value: {
      paused: false,
      getVoices: () => [],
      cancel() {},
      resume() { this.paused = false; },
      speak(line) {
        const gesture = !!(gestureEvent?.isTrusted && gestureEvent.eventPhase);
        if (gesture) unlocked = true;
        speechCalls.push({ chars: line.text.length, gesture, accepted: unlocked });
        if (!unlocked || this.paused || !line.text) return;
        setTimeout(() => {
          if (failSpeech) line.onerror?.({ error: 'synthesis-failed' });
          else { line.onstart?.(); setTimeout(() => line.onend?.(), 40); }
        }, 20);
      }
    } });
    window.Worker = class {
      postMessage(message) {
        if (message.type === 'SYNTHESIZE') setTimeout(() => this.onmessage({ data: { type: 'ERROR', kind: 'miss', id: message.id } }), 50);
      }
    };
  });
  const gated = await page(gatedContext);
  await gated.locator('#unlock').evaluate(button => button.click());
  assert.equal(await gated.evaluate(() => speechCalls.length), 0, 'synthetic click cannot unlock speech');
  await gated.locator('#question').tap();
  await gated.waitForFunction(() => window.result?.status === 'completed');
  const calls = await gated.evaluate(() => speechCalls);
  assert.equal(calls[0].chars, 0);
  assert.equal(calls[0].gesture, true, 'first speak() ran within a real iPhone tap');
  assert.ok(calls.some(call => call.chars > 0 && !call.gesture && call.accepted), 'delayed question accepted after the gesture ended');

  await gated.evaluate(() => { speechSynthesis.paused = true; });
  await gated.locator('#question').tap();
  await gated.waitForFunction(() => window.result?.status === 'completed');
  assert.equal(await gated.evaluate(() => speechSynthesis.paused), false);
  assert.equal(await gated.evaluate(() => speechCalls.filter(call => !call.chars).length), 1);

  await gated.evaluate(() => { window.failSpeech = true; });
  await gated.locator('#question').tap();
  await gated.waitForFunction(() => window.result?.status === 'failed');
  await gated.evaluate(() => { window.failSpeech = false; });
  await gated.locator('#retry').tap();
  await gated.waitForFunction(() => window.result?.status === 'completed');
  assert.equal(await gated.evaluate(() => speech.getSpeechStatus().speechError), null);
  await gatedContext.close();
  console.log(`${engine}: trusted touch unlock, delayed questions, paused service and failed-question retry passed (iOS speech gate simulated)`);
} finally {
  await browser?.close();
  server.kill();
}
