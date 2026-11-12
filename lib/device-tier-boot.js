/** Classic-script boot helper for sidecar HTML pages (no import map needed).
 *  Sets window.__sproutsTier and window.SproutsDevice.
 */
(function (global) {
  function hints() {
    var nav = global.navigator || {};
    var coarse = false;
    var small = false;
    var reduced = false;
    try {
      coarse = !!(global.matchMedia && global.matchMedia('(pointer: coarse)').matches);
      small = !!(global.matchMedia && global.matchMedia('(max-width: 900px), (max-height: 700px)').matches);
      reduced = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { /* ignore */ }
    var saveData = false;
    try { saveData = !!(nav.connection && nav.connection.saveData); } catch (e) { saveData = false; }
    var embedded = false;
    try { embedded = !!(global.parent && global.parent !== global); } catch (e) { embedded = true; }
    return {
      embedded: embedded,
      deviceMemory: nav.deviceMemory,
      hardwareConcurrency: nav.hardwareConcurrency,
      saveData: saveData,
      reducedMotion: reduced,
      coarsePointer: coarse,
      smallViewport: small
    };
  }

  function resolve(choice, h) {
    if (choice === 'cinematic' || choice === 'balanced' || choice === 'performance') return choice;
    h = h || hints();
    var lowMem = typeof h.deviceMemory === 'number' && h.deviceMemory > 0 && h.deviceMemory <= 4;
    var lowCpu = typeof h.hardwareConcurrency === 'number' && h.hardwareConcurrency > 0 && h.hardwareConcurrency <= 4;
    if (h.embedded || lowMem || lowCpu || h.saveData || h.reducedMotion || (h.coarsePointer && h.smallViewport)) {
      return 'performance';
    }
    return 'balanced';
  }

  var tier = resolve('auto', hints());
  global.__sproutsTier = tier;
  global.SproutsDevice = {
    hints: hints,
    resolve: resolve,
    tier: tier,
    isLow: tier === 'performance',
    pixelRatioCap: tier === 'performance' ? 1 : tier === 'cinematic' ? 1.5 : 1.15
  };

  /** Prefer rally's built-in low graphics preset on weak / embedded devices. */
  try {
    if (tier === 'performance') {
      var key = 'backroad-rally.display';
      var raw = global.localStorage.getItem(key);
      var data = raw ? JSON.parse(raw) : {};
      if (!data || typeof data !== 'object') data = {};
      if (!data.quality || data.quality === 'auto') {
        data.quality = 'low';
        if (!data.fpsLimit) data.fpsLimit = 30;
        global.localStorage.setItem(key, JSON.stringify(data));
      }
    }
  } catch (e) { /* private mode */ }
})(typeof window !== 'undefined' ? window : globalThis);
