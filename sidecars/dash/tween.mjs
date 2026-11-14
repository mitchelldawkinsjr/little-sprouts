/**
 * A very small tween runner, enough to play Garden dash's catch-and-munch scene the way the
 * running CodePen does with TweenMax: to(), a delay, yoyo with repeats, onComplete, and
 * killTweensOf(). Call update(dt) once a frame.
 */

export const Ease = {
  linear: (t) => t,
  p1InOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  p2Out: (t) => 1 - Math.pow(1 - t, 3),
  p4Out: (t) => 1 - Math.pow(1 - t, 5),
  p4In: (t) => Math.pow(t, 5),
  p4InOut: (t) => (t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2),
  backOut: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
};

const tweens = new Set();

/**
 * Tween numeric `props` of `target` to their goal values over `duration` seconds.
 * opts: ease, delay, yoyo, repeat (extra plays; with yoyo they go back and forth), onComplete.
 */
export function to(target, duration, props, opts = {}) {
  const tw = {
    target,
    duration: Math.max(1e-4, duration),
    props,
    ease: opts.ease || Ease.p1InOut,
    delay: opts.delay || 0,
    yoyo: !!opts.yoyo,
    repeat: opts.repeat || 0,
    onComplete: opts.onComplete,
    time: 0,
    from: null
  };
  tweens.add(tw);
  return tw;
}

/** Stop every tween on `target` (or on any of a list of targets). */
export function killTweensOf(target) {
  const list = Array.isArray(target) ? target : [target];
  for (const tw of [...tweens]) if (list.includes(tw.target)) tweens.delete(tw);
}

export function killAll() {
  tweens.clear();
}

export function update(dt) {
  for (const tw of [...tweens]) {
    if (!tweens.has(tw)) continue;
    let step = dt;
    if (tw.delay > 0) {
      tw.delay -= dt;
      if (tw.delay > 0) continue;
      step = -tw.delay;
      tw.delay = 0;
    }
    if (!tw.from) {
      tw.from = {};
      for (const k of Object.keys(tw.props)) tw.from[k] = tw.target[k];
    }
    tw.time += step;
    const plays = tw.repeat + 1;
    const total = tw.duration * plays;
    const t = Math.min(tw.time, total);
    let lap = Math.min(plays - 1, Math.floor(t / tw.duration));
    let k = (t - lap * tw.duration) / tw.duration;
    if (t >= total) { lap = plays - 1; k = 1; }
    if (tw.yoyo && lap % 2 === 1) k = 1 - k;
    const e = tw.ease(k);
    for (const key of Object.keys(tw.props)) tw.target[key] = tw.from[key] + (tw.props[key] - tw.from[key]) * e;
    if (tw.time >= total) {
      tweens.delete(tw);
      tw.onComplete?.();
    }
  }
}

export function activeCount() {
  return tweens.size;
}
