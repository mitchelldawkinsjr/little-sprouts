/** Shared low-resource / browser-compat helpers for Little Sprouts.
 *  Same paradigm as Skybound: prefer Performance on weak or embedded devices.
 */

export const QUALITY_PRESETS = ['cinematic', 'balanced', 'performance'];

/**
 * Resolve Auto → a concrete visual tier.
 * Explicit choices always win. Auto never picks cinematic.
 */
export function resolveVisualQuality({
  choice = 'auto',
  embedded = false,
  deviceMemory,
  hardwareConcurrency,
  saveData = false,
  reducedMotion = false,
  coarsePointer = false,
  smallViewport = false
} = {}) {
  if (QUALITY_PRESETS.includes(choice)) return choice;

  const lowMemory = typeof deviceMemory === 'number' && deviceMemory > 0 && deviceMemory <= 4;
  const lowCpu = typeof hardwareConcurrency === 'number' && hardwareConcurrency > 0 && hardwareConcurrency <= 4;
  if (
    embedded ||
    lowMemory ||
    lowCpu ||
    saveData ||
    reducedMotion ||
    (coarsePointer && smallViewport)
  ) {
    return 'performance';
  }
  return 'balanced';
}

export function detectDeviceHints(embedded = false, env = globalThis) {
  const nav = env.navigator || {};
  const mm = typeof env.matchMedia === 'function' ? env.matchMedia.bind(env) : null;
  const coarsePointer = mm ? !!mm('(pointer: coarse)').matches : false;
  const smallViewport = mm
    ? !!mm('(max-width: 900px), (max-height: 700px)').matches
    : (typeof env.innerWidth === 'number' && (env.innerWidth < 900 || env.innerHeight < 700));
  let saveData = false;
  try {
    saveData = !!(nav.connection && nav.connection.saveData);
  } catch {
    saveData = false;
  }
  const reducedMotion = mm ? !!mm('(prefers-reduced-motion: reduce)').matches : false;
  let embeddedFlag = !!embedded;
  try {
    if (!embeddedFlag && env.window && env.window.parent && env.window.parent !== env.window) {
      embeddedFlag = true;
    }
  } catch {
    embeddedFlag = true;
  }
  return {
    embedded: embeddedFlag,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    saveData,
    reducedMotion,
    coarsePointer,
    smallViewport
  };
}

export function resolveAutoQuality(extra = {}) {
  return resolveVisualQuality({ choice: 'auto', ...detectDeviceHints(extra.embedded), ...extra });
}

export function isPerformanceTier(tier) {
  return tier === 'performance';
}

/** Caps used by Three.js callers. */
export function pixelRatioCap(tier) {
  if (tier === 'performance') return 1;
  if (tier === 'cinematic') return 1.5;
  return 1.15;
}

export function rendererOptions(tier) {
  const performance = isPerformanceTier(tier);
  return {
    antialias: !performance,
    powerPreference: performance ? 'low-power' : 'high-performance',
    alpha: false
  };
}

export function applyRendererTier(renderer, THREE, tier) {
  const performance = isPerformanceTier(tier);
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, pixelRatioCap(tier)));
  renderer.shadowMap.enabled = !performance;
  if (THREE) {
    renderer.shadowMap.type = tier === 'cinematic'
      ? THREE.PCFSoftShadowMap
      : THREE.BasicShadowMap;
  }
  return renderer;
}
