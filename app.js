import './lib/pad.js?v=range-pad';
import './lib/tilt.js?v=ask-first';
import { roundCount, stageOf, profileSprite, SPRITES } from './logic.mjs?v=offline1';
import { knownVoice } from './lib/speech.js?v=roll1';
import { findBuiltSidecars } from './lib/sidecar.js?v=roll1';
import { rt } from './app/runtime.mjs?v=lean-r2';
import { registerHelpers } from './app/helpers.mjs?v=roll1';
import { registerRound } from './app/round.mjs?v=roll1';
import { registerMounts } from './app/mounts.mjs?v=roll1';
import { registerParent } from './app/parent.mjs?v=roll1';
import { registerRouter } from './app/router.mjs?v=hash-r1';

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
  homeShelf: '',
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
registerRouter(rt);

if (named) rt.save();
rt.loadSheet();
findBuiltSidecars().then(() => {
  if (location.hash && location.hash !== '#') rt.applyHash();
  else if (rt.data.profiles.length) rt.home();
  else rt.showWelcome();
});
