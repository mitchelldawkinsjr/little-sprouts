// Pure game-audio preferences and semantic event policy. No browser APIs.
export const AUDIO_DEFAULTS = Object.freeze({
  muted: false, master: 0.75, music: 0.22, sfx: 0.65, ambience: 0.18
});

export const SOUND_EVENTS = Object.freeze({
  'ui.select': { notes: [580], duration: 0.085, level: 0.11, wave: 'sine', cooldown: 55 },
  'ui.back': { notes: [480, 340], duration: 0.11, level: 0.10, wave: 'sine', cooldown: 90 },
  'ui.start': { notes: [392, 523, 659], duration: 0.14, level: 0.16, wave: 'triangle', cooldown: 250 },
  'quiz.correct': { notes: [523, 659, 784], duration: 0.12, level: 0.17, wave: 'sine', cooldown: 180 },
  'quiz.incorrect': { notes: [330, 294], duration: 0.12, level: 0.11, wave: 'triangle', cooldown: 220 },
  'reward.star': { notes: [784, 988, 1175], duration: 0.15, level: 0.15, wave: 'sine', cooldown: 250 },
  'reward.level-up': { notes: [392, 494, 587, 784], duration: 0.14, level: 0.18, wave: 'triangle', cooldown: 320 },
  'reward.win': { notes: [523, 659, 784, 1046], duration: 0.18, level: 0.17, wave: 'triangle', cooldown: 600 },
  'player.jump': { notes: [300, 490], duration: 0.095, level: 0.13, wave: 'sine', cooldown: 120 },
  'player.land': { notes: [190], duration: 0.095, level: 0.10, wave: 'triangle', cooldown: 120 },
  'player.step': { notes: [180], duration: 0.055, level: 0.045, wave: 'triangle', cooldown: 160 },
  'player.collect': { notes: [659, 988], duration: 0.10, level: 0.13, wave: 'sine', cooldown: 80 },
  'player.power-up': { notes: [392, 587, 880], duration: 0.14, level: 0.13, wave: 'sine', cooldown: 300 },
  'player.hit': { notes: [240, 160], duration: 0.09, level: 0.12, wave: 'triangle', cooldown: 220 },
  'player.crash': { notes: [125, 90], duration: 0.19, level: 0.17, wave: 'sawtooth', cooldown: 380 },
  'vehicle.engine': { notes: [105], duration: 0.12, level: 0.07, wave: 'sawtooth', cooldown: 220 },
  'vehicle.brake': { notes: [440, 200], duration: 0.11, level: 0.13, wave: 'sawtooth', cooldown: 230 },
  'vehicle.explosion': { notes: [110, 75, 54], duration: 0.19, level: 0.17, wave: 'sawtooth', cooldown: 350 },
  'boss.approach': { notes: [220, 196], duration: 0.15, level: 0.10, wave: 'triangle', cooldown: 650 },
  'boss.attack': { notes: [196, 131], duration: 0.14, level: 0.13, wave: 'sawtooth', cooldown: 320 },
  'boss.defeat': { notes: [392, 523, 659, 784], duration: 0.14, level: 0.18, wave: 'triangle', cooldown: 450 }
});

export const SOUND_NAMES = Object.freeze(Object.keys(SOUND_EVENTS));
export const clampVolume = value => Number.isFinite(+value) ? Math.min(1, Math.max(0, +value)) : 0;

export function normalizeAudioSettings(value = {}) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return Object.fromEntries(Object.entries(AUDIO_DEFAULTS).map(([key, fallback]) =>
    [key, key === 'muted' ? (typeof input[key] === 'boolean' ? input[key] : fallback)
      : (typeof input[key] === 'number' && Number.isFinite(input[key]) ? clampVolume(input[key]) : fallback)]));
}

export function safeSoundEvent(event) {
  return typeof event === 'string' && Object.hasOwn(SOUND_EVENTS, event) ? event : null;
}

export function canPlayEvent(event, at, last = {}) {
  const name = safeSoundEvent(event);
  if (!name) return false;
  return !Number.isFinite(last[name]) || at - last[name] >= SOUND_EVENTS[name].cooldown;
}
