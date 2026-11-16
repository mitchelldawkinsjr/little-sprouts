/** Prefer browser fullscreen; keep the game usable when the browser can't enter it. */
export function makePlayFullscreen(doc) {
  let expanded = false;
  let pending = false;
  let revision = 0;
  const element = () => doc.fullscreenElement || doc.webkitFullscreenElement;
  const root = doc.documentElement;
  const request = () => (doc.fullscreenEnabled !== false && root.requestFullscreen)
    || (doc.webkitFullscreenEnabled !== false && root.webkitRequestFullscreen);
  const exit = () => doc.fullscreenElement ? doc.exitFullscreen : doc.webkitExitFullscreen;
  async function exitNative() {
    try { await exit()?.call(doc); } catch { /* browser leaves its own exit controls */ }
  }

  return {
    get native() { return !!element(); },
    get expanded() { return expanded; },
    get canRequest() { return !!request(); },
    async toggle() {
      if (pending) return;
      if (expanded) { expanded = false; return; }
      if (element()) {
        await exitNative();
        return;
      }
      const enter = request();
      const started = revision;
      if (enter) {
        pending = true;
        try {
          const result = enter.call(root);
          if (result?.then) await result;
          // Old WebKit may return void before its native fullscreen-change event.
          else if (!element()) await new Promise(resolve => setTimeout(resolve, 400));
          if (element()) {
            if (revision !== started) await exitNative();
            return;
          }
        } catch { /* denied requests still get the larger in-page view */ }
        finally { pending = false; }
      }
      if (revision === started) expanded = true;
    },
    leave() {
      revision++;
      expanded = false;
      if (element()) return exitNative();
    }
  };
}
