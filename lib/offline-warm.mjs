/**
 * Ask the service worker to save the games for offline play while online.
 * The worker reads offline-files.json (written at image build, or by server/serve.mjs) for the
 * list of files; the page adds what only it knows: which voices this family hears, and whether
 * this browser plays .opus sound.
 */
import { knownVoice, profiles, warm as warmVoice } from './speech.js?v=offline4';
import { webgpuReady } from './sidecar.js?v=power3';
import { diagnostic } from './diagnostics.mjs';

const RETRY_MS = 3 * 60 * 1000;
const MB = 1_000_000;

let status = { state: 'starting' };
let timer = null;
let terminal = '';
const PACK_KEY = 'sprouts-offline-pack';
let pack = 'starter';
function preferredPack() {
  try { return localStorage.getItem(PACK_KEY) === 'full' ? 'full' : 'starter'; }
  catch { return pack; }
}
pack = preferredPack();

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
      return s.pack === 'starter'
        ? '✓ Ready for offline play. Starter games are saved on this device.'
        : '✓ Ready for offline play. The full offline pack is saved on this device.';
    case 'unavailable':
      return 'Could not check offline downloads. Saved games are kept. Try again when connected.';
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
      return ['Offline ready', `${size}. ${s.pack === 'starter' ? 'Starter games are ready.' : 'Full offline pack is ready.'}`, s.pack === 'starter' ? 'Starter ready' : 'Full ready'];
    case 'unavailable':
      return ['Offline download unavailable', 'Saved games are kept. Try again when connected.', 'Retry'];
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
  const full = document.getElementById('saveFullOffline');
  if (full) {
    full.disabled = !navigator.onLine || status.state === 'unsupported' || pack === 'full';
    full.textContent = pack === 'full'
      ? (status.state === 'ready' && status.pack === 'full' ? 'Full offline pack saved' : 'Full offline pack selected')
      : 'Save full offline pack';
  }
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

/**
 * Once the games are saved, download the voice model too (about 90 MB, kept by the browser), so
 * new words and questions are read in this family's voice with no internet. Waiting for the games
 * keeps the first screen light.
 */
let voiceStarted = false;
function voiceAfterGames() {
  if (voiceStarted || !navigator.onLine) return;
  let data = {};
  try { data = JSON.parse(localStorage.getItem('sprouts-v1') || '{}') || {}; } catch { data = {}; }
  if (data.sound === false) return;
  voiceStarted = true;
  try { warmVoice(knownVoice(data.voice)); } catch { /* the browser voice still reads */ }
}

function playsOpus() {
  try { return document.createElement('audio').canPlayType('audio/ogg; codecs="opus"') !== ''; } catch { return false; }
}

async function request() {
  if (!navigator.onLine || !('serviceWorker' in navigator)) return;
  const w = await worker();
  let camera = false;
  try { camera = !!JSON.parse(localStorage.getItem('sprouts-v1') || '{}')?.camera; } catch {}
  const webgpu = await webgpuReady().catch(() => false);
  w?.postMessage({ type: 'warm', voices: voices(), opus: playsOpus(), pack, camera, webgpu });
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
/**
 * Parent corner's full refresh: drop the service worker and its saved files, then load fresh from
 * the server. Profiles, progress, settings (localStorage), and the voice (IndexedDB) stay.
 */
export async function resetAppCache() {
  const regs = await navigator.serviceWorker?.getRegistrations?.().catch(() => []) || [];
  await Promise.all(regs.map(reg => reg.unregister().catch(() => false)));
  const names = await globalThis.caches?.keys().catch(() => []) || [];
  await Promise.all(names.filter(name => name.startsWith('sprouts-offline-')).map(name => caches.delete(name).catch(() => false)));
}

function wireReset() {
  const btn = document.getElementById('resetAppCache');
  if (!btn || btn.dataset.wired) return;
  btn.dataset.wired = '1';
  const label = btn.textContent;
  let armed = 0;
  btn.addEventListener('click', async () => {
    // Two taps, so a stray tap never wipes the offline games.
    if (!armed) {
      btn.textContent = 'Tap again to clear and reload';
      armed = setTimeout(() => { armed = 0; btn.textContent = label; }, 4000);
      return;
    }
    clearTimeout(armed);
    btn.disabled = true;
    btn.textContent = 'Clearing…';
    await resetAppCache();
    location.reload();
  });
}

export async function warmOffline() {
  wireReset();
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
    if (event.data.pack !== pack) return;
    status = event.data;
    const { state, saved, total, failed } = status;
    if (['ready', 'partial', 'unavailable'].includes(state)) {
      const key = [state, pack, saved, total, failed].join(':');
      if (terminal !== key) {
        terminal = key;
        diagnostic(`offline_${state}`);
        if (Number.isFinite(saved)) diagnostic('offline_saved_kb', Math.min(2000000, Math.round(saved / 1000)));
      }
      window.dispatchEvent(new Event('sprouts-offline-changed'));
      if (state !== 'unavailable') voiceAfterGames();
    }
    render();
    if (status.state !== 'saving') schedule();
  });
  async function syncWorker() {
    if (navigator.onLine) await request();
    else (await worker())?.postMessage({ type: 'offline-status' });
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => { void syncWorker(); });
  window.addEventListener('online', () => { render(); void syncWorker(); });
  window.addEventListener('offline', render);
  window.addEventListener('storage', e => {
    if (e.key !== PACK_KEY || pack === preferredPack()) return;
    pack = preferredPack();
    status = { state: 'starting' };
    render();
    void syncWorker();
    schedule();
  });
  document.getElementById('saveFullOffline')?.addEventListener('click', () => {
    if (!navigator.onLine || pack === 'full') return;
    pack = 'full';
    try { localStorage.setItem(PACK_KEY, pack); } catch {}
    status = { state: 'starting' };
    render();
    void request();
    schedule();
  });
  try {
    const registration = await navigator.serviceWorker.register('./sw.js?v=obs1');
    if (registration.active?.scriptURL.endsWith('sw.js?v=obs1')) await syncWorker();
  } catch {
    diagnostic('worker_failed');
    status = { state: 'unavailable' };
    render();
    return;
  }
  render();
  // Ask the browser to keep the saved games (and the profiles) instead of clearing them when space runs low.
  void navigator.storage?.persist?.().catch(() => {});
  schedule();
}
