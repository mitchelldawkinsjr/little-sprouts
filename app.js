import './lib/pad.js?v=offline4-bike1';
import './lib/tilt.js?v=ask-first';
import { roundCount, stageOf, profileSprite, SPRITES } from './logic.mjs?v=offline1';
import { knownVoice } from './lib/speech.js?v=offline4';
import { findBuiltSidecars } from './lib/sidecar.js?v=power8-bike1';
import { rt } from './app/runtime.mjs?v=lean-r2';
import { registerHelpers } from './app/helpers.mjs?v=audio2-rivals1-bike1';
import { registerRound } from './app/round.mjs?v=audio2-fort1-bike1';
import { registerMounts } from './app/mounts.mjs?v=audio2-rivals1-bike1';
import { registerParent } from './app/parent.mjs?v=audio1-bike1';
import { registerShop } from './app/shop.mjs?v=bloom1';
import { registerRouter } from './app/router.mjs?v=shop1';
import { diagnostic, startDiagnostics } from './lib/diagnostics.mjs';

startDiagnostics();

// Live state. Every module reads and writes it through rt.
Object.assign(rt, {
  data: undefined,
  game: null,
  lunarCourt: null,
  lightCourt: null,
  storageOK: true,
  camera: null,
  cleanSnapshot: '',
  askResolve: null,
  loadingForm: false,
  grownupOk: false,
  gateNext: null,
  gateAnswer: 0,
  askYesOnCancel: false,
  homeShelf: 'featured',
  homeSort: 'featured',
  homeHowOpen: false,
  listenToken: 0,
  talking: false,
  ears: null
});

const emptyInstall = () => ({
  active: 0,
  sound: true,
  voice: 'af_heart',
  characterVoices: false,
  camera: false,
  profiles: []
});
try {
  const saved = JSON.parse(localStorage.getItem('sprouts-v1'));
  rt.data = saved && typeof saved === 'object' && Array.isArray(saved.profiles) ? saved : emptyInstall();
} catch {
  rt.data = emptyInstall();
}
let named = false;
rt.data.profiles.forEach((profile, i) => {
  profile.stage = stageOf(profile, i);
  const questions = roundCount(profile.rounds);
  if (questions !== profile.rounds) {
    profile.rounds = questions;
    named = true;
  }
  if (!SPRITES.includes(profile.sprite)) {
    profile.sprite = profileSprite(profile, i);
    named = true;
  }
});
if (!Number.isInteger(+rt.data.active) || !rt.data.profiles[+rt.data.active]) {
  rt.data.active = 0;
  named = true;
} else rt.data.active = +rt.data.active;
rt.data.voice = knownVoice(rt.data.voice);
rt.data.characterVoices = !!rt.data.characterVoices;
if (rt.data.sheet && !Array.isArray(rt.data.sheet.rows)) delete rt.data.sheet;

registerHelpers(rt);
registerRound(rt);
registerMounts(rt);
registerParent(rt);
registerShop(rt);
registerRouter(rt);

if (named) rt.save();
const catalog = findBuiltSidecars();
const deepLink = location.hash && location.hash !== '#' ? location.hash : '';
// Show the first screen with built-in games immediately. Only a game deep link needs the catalog first.
if (rt.data.profiles.length) rt.home('catalog', { syncHash: !deepLink });
else rt.showWelcome({ syncHash: !deepLink });
if (deepLink && !deepLink.startsWith('#play/')) rt.applyHash();
const redrawHome = () => {
  if (rt.data.profiles.length && !rt.game && !document.querySelector('dialog[open]')
      && (!location.hash || location.hash === '#home')) rt.home('catalog');
};
catalog.then(() => {
  if (deepLink.startsWith('#play/') && location.hash === deepLink && !rt.game) rt.applyHash();
  else redrawHome();
}).catch(() => { diagnostic('catalog_fallback'); });
function refreshCatalog() {
  findBuiltSidecars().then(redrawHome).catch(() => diagnostic('catalog_fallback'));
}
window.addEventListener('online', refreshCatalog);
window.addEventListener('offline', refreshCatalog);
window.addEventListener('sprouts-offline-changed', () => { if (!navigator.onLine) refreshCatalog(); });
requestAnimationFrame(() => requestAnimationFrame(() => {
  diagnostic('app_ready', Math.min(300000, Math.round(performance.now())));
  // Load the question sheet and start offline caching after the first view can paint.
  rt.loadSheet();
  void import('./lib/offline-warm.mjs?v=reset1-bike1').then(({ warmOffline }) => warmOffline())
    .catch(() => diagnostic('worker_failed'));
}));
