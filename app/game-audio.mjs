// Single audio owner for the app shell; individual games emit semantic events.
// Keeping this here makes native/PWA volume settings and speech ducking universal.
import { gameAudio } from '../lib/game-audio.mjs';
import { normalizeAudioSettings } from '../lib/game-audio-policy.mjs';
import { postSidecar } from '../lib/sidecar.js?v=offline4';

export function registerGameAudio(rt) {
  rt.data.audio = normalizeAudioSettings(rt.data.audio);
  gameAudio.setSettings(rt.data.audio);
  rt.audio = gameAudio;
  rt.updateAudio = changes => {
    rt.data.audio = normalizeAudioSettings({ ...rt.data.audio, ...(changes || {}) });
    gameAudio.setSettings(rt.data.audio);
    rt.save?.();
    postSidecar({ type: 'audio-config', settings: rt.data.audio });
    const button = document.querySelector('#playAudio');
    if (button) {
      button.textContent = rt.data.audio.muted ? '🔇' : '🎵';
      button.setAttribute('aria-pressed', String(!rt.data.audio.muted));
      button.setAttribute('aria-label', 'Game audio');
      button.title = rt.data.audio.muted ? 'Turn game audio on' : 'Mute game audio';
    }
    return rt.data.audio;
  };
  // Browsers do not allow audio before a genuine user activation. An open game
  // can be entered through a deep link or gamepad: a later tap/key unlocks it.
  const wake = () => { if (rt.game) void gameAudio.unlock(); };
  document.addEventListener('pointerdown', wake, { passive: true });
  document.addEventListener('keydown', wake);
  document.addEventListener('visibilitychange', () =>
    document.hidden ? gameAudio.pause() : gameAudio.resume());
}
