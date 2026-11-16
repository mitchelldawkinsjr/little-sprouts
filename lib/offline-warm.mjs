/**
 * Ask the service worker to save the games for offline play while online.
 * The worker reads offline-files.json (written at image build, or by server/serve.mjs) for the
 * list of files; the page adds what only it knows: which voices this family hears, and whether
 * this browser plays .opus sound.
 */
import { knownVoice, profiles } from './speech.js?v=offline4';

const RETRY_MS = 3 * 60 * 1000;
const MB = 1_000_000;

let status = { state: 'starting' };
let timer = null;

function mb(n) {
  return Math.max(1, Math.round((n || 0) / MB));
}

/** Parent corner line for the offline download. */
export function offlineStatusText(s, online = true) {
  const pct = s.total ? Math.min(100, Math.floor((s.saved / s.total) * 100)) : 0;
  const amount = s.total > MB ? ` (${mb(s.saved)} of ${mb(s.total)} MB)` : '';
  switch (s.state) {
    case 'unsupported':
      return 'This browser cannot save the games for offline play.';
    case 'ready':
      return '✓ Ready for offline play. Every game is saved on this device.';
    case 'saving':
      if (!online) return `Offline. ${pct}% of the games are saved. Connect to the internet to finish.`;
      return `Saving games for offline play… ${pct}%${amount}. Keep the app open until this says ready.`;
    case 'partial':
      if (!online) return `Offline. ${pct}% of the games are saved. Connect to the internet to finish.`;
      return `${pct}% saved${amount}. ${s.failed} ${s.failed === 1 ? 'file' : 'files'} did not download. Trying again in a few minutes.`;
    default:
      return online
        ? 'Checking which games are saved for offline play…'
        : 'Offline. Connect to the internet to check which games are saved.';
  }
}

/** Short home and footer copy: [title, note, badge]. */
export function offlineShortText(s, online = true) {
  const pct = s.total ? Math.min(100, Math.floor((s.saved / s.total) * 100)) : 0;
  const size = s.total > MB ? `${mb(s.total)} MB saved on this device` : 'Saved on this device';
  switch (s.state) {
    case 'unsupported':
      return ['Online play only', 'This browser cannot save the games', 'Online'];
    case 'ready':
      return ['Offline ready', `${size}. Plays in the car, on a plane, or at the park.`, 'All ready'];
    case 'saving':
    case 'partial':
      if (!online) return [`${pct}% saved for offline`, 'Connect to the internet to finish', `${pct}%`];
      return ['Saving games for offline', 'Keep the app open until it says ready', `${pct}%`];
    default:
      return [online ? 'Checking offline play…' : 'You are offline', 'Games save to this device while online', '…'];
  }
}

function render() {
  window.sproutsOffline = status;
  const [title, note, badge] = offlineShortText(status, navigator.onLine);
  document.querySelectorAll('[data-offline-title]').forEach(el => { el.textContent = title; });
  document.querySelectorAll('[data-offline-note]').forEach(el => { el.textContent = note; });
  document.querySelectorAll('[data-offline-badge]').forEach(el => { el.textContent = badge; el.classList.toggle('is-ready', status.state === 'ready'); });
  const text = document.getElementById('offlineStatus');
  const bar = document.getElementById('offlineBar');
  if (text) {
    text.textContent = offlineStatusText(status, navigator.onLine);
    text.classList.toggle('offline-ready', status.state === 'ready');
  }
  if (bar) {
    bar.hidden = status.state === 'ready' || status.state === 'unsupported';
    bar.value = status.total ? status.saved / status.total : 0;
  }
}

async function worker() {
  const reg = await navigator.serviceWorker?.ready;
  return navigator.serviceWorker.controller || reg?.active || null;
}

/** The grown-up's voice, and the game hosts' voices when those are on. */
function voices() {
  let data = {};
  try { data = JSON.parse(localStorage.getItem('sprouts-v1') || '{}') || {}; } catch { data = {}; }
  const list = new Set([knownVoice(data.voice)]);
  if (data.characterVoices) Object.values(profiles).forEach(p => { if (p.voice) list.add(p.voice); });
  return [...list];
}

function playsOpus() {
  try { return document.createElement('audio').canPlayType('audio/ogg; codecs="opus"') !== ''; } catch { return false; }
}

async function request() {
  if (!navigator.onLine) return;
  const w = await worker();
  w?.postMessage({ type: 'warm', voices: voices(), opus: playsOpus() });
}

function schedule() {
  clearTimeout(timer);
  if (status.state === 'ready') return;
  timer = setTimeout(async () => { await request(); schedule(); }, RETRY_MS);
}

/**
 * Ask the service worker to save every game, show its progress in Parent corner,
 * and try again every few minutes until everything is saved.
 */
export async function warmOffline() {
  window.sproutsPaintOffline = render;
  // Parent corner calls this after a new voice is picked, so that voice is saved too.
  window.sproutsOfflineRefresh = request;
  if (!('serviceWorker' in navigator) || !('caches' in window)) {
    status = { state: 'unsupported' };
    render();
    return;
  }
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type !== 'offline-progress') return;
    status = event.data;
    render();
    if (status.state !== 'saving') schedule();
  });
  window.addEventListener('online', () => { render(); request(); });
  window.addEventListener('offline', render);
  render();
  // Ask the browser to keep the saved games (and the profiles) instead of clearing them when space runs low.
  try { await navigator.storage?.persist?.(); } catch { /* not offered here */ }
  await request();
  if (!navigator.onLine) (await worker())?.postMessage({ type: 'offline-status' });
  schedule();
}
