/**
 * Backroad rally and Tidewater fishing are the two biggest games (about 160 MB together). An installed
 * app leaves them out unless a parent turns on Big games in the parent corner; a web browser tab keeps
 * them, as before. The Fire tablet app doesn't carry them at all (tools/fire-tablet/stage.py leaves them
 * out of the APK), so there they stay hidden.
 *
 * Off means hidden on the shelf and never saved for offline play (sw.js drops their files, and deletes
 * any already saved). On means they show, and the Full offline pack saves them, as it always has.
 */
export const BIG_GAMES = ['rally', 'fishing'];
/** Their folders, for the service worker (sw.js keeps its own copy; tests/big-games.test.mjs checks they match). */
export const BIG_PATHS = /^\.\/sidecars\/(rally|field-guide-fishing)\//;
const KEY = 'sprouts-big-games';

/** The Fire tablet app (Capacitor). */
export function nativeApp(env = globalThis) {
  return !!env.Capacitor?.isNativePlatform?.();
}

/** Installed: the tablet app, or the web app added to a home screen. */
export function installedApp(env = globalThis) {
  if (nativeApp(env)) return true;
  try {
    if (env.matchMedia?.('(display-mode: standalone)').matches || env.matchMedia?.('(display-mode: fullscreen)').matches) return true;
  } catch { /* old browser */ }
  return env.navigator?.standalone === true;
}

/** Whether Big games are on for this device: the parent's choice, or on in a browser tab and off once installed. */
export function bigGamesOn(env = globalThis, storage = env.localStorage) {
  if (nativeApp(env)) return false;
  let saved = null;
  try { saved = storage?.getItem(KEY); } catch { saved = null; }
  if (saved === 'on') return true;
  if (saved === 'off') return false;
  return !installedApp(env);
}

export function setBigGames(on, storage = globalThis.localStorage) {
  try { storage?.setItem(KEY, on ? 'on' : 'off'); } catch { /* private window */ }
}
