// Phones and tablets: tilt to steer in the games that steer left and right.
// Tilt holds the arrow keys, the same way a controller does, so every game and sidecar hears it without changes.
import { TILT_GAMES, isTouch, sideTilt, steerAmount, tiltDir } from './touch-core.mjs?v=tilt-steer';

const KEY = 'sprouts-tilt';
const touch = isTouch({
  coarse: matchMedia('(any-pointer: coarse)').matches,
  maxTouchPoints: navigator.maxTouchPoints || 0,
  forced: new URLSearchParams(location.search).has('touch')
});
const canTilt = touch && 'DeviceOrientationEvent' in window;
const needsAsk = typeof DeviceOrientationEvent?.requestPermission === 'function';

document.documentElement.classList.toggle('touch', touch);

let wanted = localStorage.getItem(KEY) === 'on';
let allowed = !needsAsk;
let center = null;
let held = 0;
let mode = '';

function frames() {
  return [...document.querySelectorAll('iframe.sidecar-frame')].flatMap(frame => {
    try { return frame.contentDocument ? [frame.contentDocument] : []; }
    catch { return []; }
  });
}

function key(type, code) {
  for (const doc of frames().concat(document)) {
    doc.dispatchEvent(new doc.defaultView.KeyboardEvent(type, { code, key: code, bubbles: true, cancelable: true }));
  }
}

function hold(dir) {
  if (dir === held) return;
  if (held) key('keyup', held < 0 ? 'ArrowLeft' : 'ArrowRight');
  if (dir) key('keydown', dir < 0 ? 'ArrowLeft' : 'ArrowRight');
  held = dir;
}

const playing = () => wanted && allowed && TILT_GAMES.has(mode) && !!document.querySelector('#arcade') && !document.body.classList.contains('listen-first') && !document.querySelector('dialog[open]');

function onTilt(event) {
  if (event.gamma == null && event.beta == null) return;
  const angle = screen.orientation?.angle ?? window.orientation ?? 0;
  const tilt = sideTilt(event, angle);
  if (center == null) center = tilt;
  hold(playing() ? tiltDir(steerAmount(tilt, center), held) : 0);
}

async function ask() {
  if (allowed) return true;
  try { allowed = (await DeviceOrientationEvent.requestPermission()) === 'granted'; }
  catch { allowed = false; }
  return allowed;
}

function paint() {
  const button = document.querySelector('#tiltToggle');
  if (!button) return;
  button.setAttribute('aria-pressed', String(wanted));
  button.textContent = wanted ? '📱 Tilt on' : '📱 Tilt';
}

async function toggle() {
  wanted = !wanted;
  localStorage.setItem(KEY, wanted ? 'on' : 'off');
  center = null;
  if (wanted && !(await ask())) wanted = false;
  if (!wanted) hold(0);
  paint();
}

function place() {
  const top = document.querySelector('#app .playtop');
  const next = top?.dataset.mode || '';
  if (next !== mode) { mode = next; center = null; hold(0); }
  if (!top || !canTilt || !TILT_GAMES.has(mode) || top.querySelector('#tiltToggle')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'quiet tilt-toggle';
  button.id = 'tiltToggle';
  button.title = 'Tilt the phone to steer';
  button.onclick = toggle;
  top.querySelector('b')?.after(button);
  paint();
}

if (canTilt) {
  addEventListener('deviceorientation', onTilt);
  if (wanted && needsAsk) {
    // iOS asks for motion again after each page load, and only from a tap.
    addEventListener('pointerup', async () => {
      if (wanted && !(await ask())) { wanted = false; paint(); }
    }, { once: true });
  }
  const app = document.querySelector('#app');
  if (app) new MutationObserver(place).observe(app, { childList: true });
  addEventListener('blur', () => hold(0));
  document.addEventListener('visibilitychange', () => { if (document.hidden) hold(0); });
}
