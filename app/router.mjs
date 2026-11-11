/**
 * Hash views for browser Back/Forward.
 * Programmatic setHash uses history push/replace (no popstate).
 * popstate (Back/Forward) calls applyHash.
 */

export function parseHash(hash) {
  const raw = String(hash || '').replace(/^#/, '').trim();
  if (!raw || raw === 'home') return { view: 'home' };
  const [view, detail] = raw.split('/');
  if (view === 'play' && detail) return { view: 'play', mode: detail };
  if (view === 'welcome' || view === 'settings') return { view };
  return { view: 'home' };
}

export function registerRouter(rt) {
  let routing = false;

  function currentHash() {
    return location.hash || '';
  }

  function targetFor(hash) {
    return `#${hash || 'home'}`;
  }

  rt.setHash = (hash, { replace = false } = {}) => {
    const target = targetFor(hash);
    const cur = currentHash();
    if (cur === target) return;
    // First paint from bare URL: replace so Back does not leave an empty entry.
    if (!cur && (hash === 'home' || hash === 'welcome')) replace = true;
    if (replace) history.replaceState(null, '', target);
    else history.pushState(null, '', target);
  };

  function knownMode(mode) {
    return Array.isArray(rt.games) && rt.games.some(([id]) => id === mode);
  }

  function restoreGameHash() {
    const g = rt.game;
    if (g && !g.finished && g.mode) rt.setHash(`play/${g.mode}`, { replace: true });
    else rt.setHash('home', { replace: true });
  }

  async function leaveRoundThen(next) {
    if (!rt.roundActive()) {
      next();
      return;
    }
    const ok = await rt.ask('Leave this round?', 'This round will not be saved.', 'Leave round', { keep: true });
    if (ok) next();
    else restoreGameHash();
  }

  rt.applyHash = async () => {
    if (routing) return;
    routing = true;
    try {
      const { view, mode } = parseHash(currentHash());

      if (view === 'play' && mode) {
        if (!rt.data.profiles?.length) {
          rt.setHash('welcome', { replace: true });
          rt.showWelcome?.({ syncHash: false });
          return;
        }
        if (!knownMode(mode)) {
          rt.setHash('home', { replace: true });
          rt.home?.(undefined, { syncHash: false });
          return;
        }
        if (rt.game?.mode === mode && !rt.game.finished) return;
        await leaveRoundThen(() => {
          rt.home?.(undefined, { syncHash: false });
          rt.start?.(mode, { syncHash: false });
        });
        return;
      }

      if (view === 'settings') {
        await leaveRoundThen(() => {
          if (rt.roundActive()) rt.home?.(undefined, { syncHash: false });
          rt.openParentCorner?.();
        });
        return;
      }

      if (view === 'welcome') {
        if (rt.data.profiles?.length) {
          rt.setHash('home', { replace: true });
          await leaveRoundThen(() => rt.home?.(undefined, { syncHash: false }));
          return;
        }
        rt.showWelcome?.({ syncHash: false });
        return;
      }

      // home
      if (!rt.data.profiles?.length) {
        rt.setHash('welcome', { replace: true });
        rt.showWelcome?.({ syncHash: false });
        return;
      }
      await leaveRoundThen(() => rt.home?.(undefined, { syncHash: false }));
    } finally {
      routing = false;
    }
  };

  window.addEventListener('popstate', () => {
    rt.applyHash();
  });
}
