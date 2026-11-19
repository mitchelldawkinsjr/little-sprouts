/**
 * Lite mode for the heavy games: on a weak device, draw fewer pixels and drop costly extras so the game
 * stays playable. Load it as the first script in a game page's <head>, before the game's own code.
 *
 * Level 0 changes nothing. Levels 1, 2 and 3 render at 75%, 60% and 50% of the screen's pixels per side.
 * They do it by lowering window.devicePixelRatio, which every game here reads when it sizes its renderer,
 * and by turning off WebGL antialiasing.
 *
 * The level starts from what the device says about itself (memory, processor cores, Fire tablet, Save-Data).
 * A frame watcher then steps it up while the game keeps running slowly, and back down when it has room.
 * The level is remembered per game on this device, so the next launch starts where it settled. A drop takes
 * full effect on the next launch, because most games size their renderer once.
 *
 * Games that can cut more read window.SproutsLite.level and listen for the 'sprouts-lite' event.
 * Add ?sprouts-lite=0 to ?sprouts-lite=3 to the page URL to force a level for testing (Station Scout's own
 * ?lite means something else). Rally is left out: its own low preset already scales its resolution.
 */
(function (global) {
  var SCALE = [0, 0.75, 0.6, 0.5];
  var MAX = SCALE.length - 1;
  /** A frame slower than this (about 29 frames a second) counts as struggling. */
  var SLOW_MS = 34;
  /** A frame faster than this (about 66 a second) has room to spare. */
  var ROOM_MS = 15;
  /** Frames are judged in windows of 90, or 3 seconds' worth on a very slow device (at least 10 frames). */
  var WINDOW = 90;
  var WINDOW_MS = 3000;
  var WARMUP_MS = 5000;

  /** The starting level from what the device reports, before any frames are measured. */
  function fromHints(h) {
    var level = 0;
    var mem = h.deviceMemory;
    var cores = h.hardwareConcurrency;
    if (typeof mem === 'number' && mem > 0) level = Math.max(level, mem <= 2 ? 2 : mem <= 4 && h.coarsePointer ? 1 : 0);
    if (typeof cores === 'number' && cores > 0) level = Math.max(level, cores <= 2 ? 2 : cores <= 4 && h.coarsePointer ? 1 : 0);
    // Fire tablets (Silk, or Fire OS model names like KFTRWI) are the weakest devices this app meets.
    if (/\bSilk\b|\bKF[A-Z]{2,6}\b/.test(h.userAgent || '')) level = Math.max(level, 2);
    if (h.saveData) level = Math.max(level, 1);
    return level;
  }

  /** The level to start at: a forced ?sprouts-lite wins; otherwise the higher of the device's hint and what was learned before. */
  function pick(h, learned, forced) {
    if (typeof forced === 'number' && forced >= 0 && forced <= MAX) return forced;
    var known = typeof learned === 'number' && learned >= 0 && learned <= MAX ? learned : 0;
    return Math.max(fromHints(h), known);
  }

  /**
   * One window of frame times (ms) in, a step out: +1 while the median is slow, -1 once it has had room for
   * `roomy` windows in a row (never below `floor`), else 0.
   */
  function judge(frames, level, floor, roomy) {
    var sorted = frames.slice().sort(function (a, b) { return a - b; });
    var median = sorted[sorted.length >> 1];
    if (median > SLOW_MS && level < MAX) return { step: 1, roomy: 0 };
    if (median < ROOM_MS && level > floor) return roomy + 1 >= 6 ? { step: -1, roomy: 0 } : { step: 0, roomy: roomy + 1 };
    return { step: 0, roomy: 0 };
  }

  var api = { SCALE: SCALE, fromHints: fromHints, pick: pick, judge: judge, level: 0, scale: 1 };
  global.SproutsLite = api;
  if (!global.document || !global.navigator) return;

  var nav = global.navigator;
  var coarse = false;
  var saveData = false;
  try { coarse = !!global.matchMedia('(pointer: coarse)').matches; } catch (e) { coarse = false; }
  try { saveData = !!(nav.connection && nav.connection.saveData); } catch (e) { saveData = false; }
  var hints = { deviceMemory: nav.deviceMemory, hardwareConcurrency: nav.hardwareConcurrency, coarsePointer: coarse, saveData: saveData, userAgent: nav.userAgent };

  var key = 'sprouts-lite:' + global.location.pathname;
  var learned = null;
  try { learned = parseInt(global.localStorage.getItem(key), 10); } catch (e) { learned = null; }
  var forcedRaw = /[?&]sprouts-lite=(\d)/.exec(global.location.search);
  var forced = forcedRaw ? Number(forcedRaw[1]) : null;
  var floor = forced !== null ? forced : fromHints(hints);
  var level = pick(hints, learned, forced);

  var realRatio = global.devicePixelRatio || 1;
  try {
    Object.defineProperty(global, 'devicePixelRatio', {
      configurable: true,
      get: function () { return level ? Math.min(realRatio, SCALE[level]) : realRatio; }
    });
  } catch (e) { /* an old browser keeps its real ratio */ }

  // Antialiasing is a big cost on tablets; the lower resolution already softens edges.
  var proto = global.HTMLCanvasElement && global.HTMLCanvasElement.prototype;
  if (proto && proto.getContext) {
    var getContext = proto.getContext;
    proto.getContext = function (type, attrs) {
      if (level > 0 && /webgl/.test(String(type))) {
        var copy = {};
        for (var k in attrs || {}) copy[k] = attrs[k];
        copy.antialias = false;
        attrs = copy;
      }
      return getContext.call(this, type, attrs);
    };
  }

  function apply(next, why) {
    level = next;
    api.level = level;
    api.scale = level ? SCALE[level] : 1;
    global.document.documentElement.setAttribute('data-lite', String(level));
    if (forced === null) {
      try { global.localStorage.setItem(key, String(level)); } catch (e) { /* private mode */ }
    }
    try { global.dispatchEvent(new CustomEvent('sprouts-lite', { detail: { level: level, scale: api.scale, why: why } })); } catch (e) { /* old browser */ }
  }
  api.level = level;
  api.scale = level ? SCALE[level] : 1;
  global.document.documentElement.setAttribute('data-lite', String(level));

  if (forced !== null || !global.requestAnimationFrame) return;
  var frames = [];
  var spent = 0;
  var last = 0;
  var startAt = 0;
  var roomy = 0;
  function frame(t) {
    global.requestAnimationFrame(frame);
    if (global.document.hidden) {
      last = 0;
      frames.length = 0;
      spent = 0;
      return;
    }
    if (!startAt) startAt = t;
    if (last && t - startAt > WARMUP_MS) {
      var dt = t - last;
      // A gap over a second is a pause (a question card, a tab switch), not a slow frame.
      if (dt < 1000) {
        frames.push(dt);
        spent += dt;
      }
    }
    last = t;
    if (frames.length < WINDOW && (spent < WINDOW_MS || frames.length < 10)) return;
    var verdict = judge(frames, level, floor, roomy);
    frames.length = 0;
    spent = 0;
    roomy = verdict.roomy;
    if (verdict.step) {
      apply(level + verdict.step, verdict.step > 0 ? 'slow' : 'room');
      startAt = t;
    }
  }
  global.requestAnimationFrame(frame);
})(typeof window !== 'undefined' ? window : globalThis);
