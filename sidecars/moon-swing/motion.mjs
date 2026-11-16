// Visual-only state shared by WebGL and the Canvas fallback. Nothing here changes a hitbox.
const MAX_MARKS = 68;
const MAX_FLASHES = 56;
const MARK_LIFE = 3.2;
const FLASH_LIFE = .72;

export function makeIceMotion(reduced = false) {
  let owner, previous, samples, flakes, nextSample, nextSpray;
  function reset(run) {
    if (owner === run) return;
    owner = run;
    previous = null;
    samples = [];
    flakes = [];
    nextSample = nextSpray = -Infinity;
  }
  function burst(run, kind) {
    reset(run);
    if (reduced) return;
    const { p, time } = run;
    const upward = kind !== 'spray';
    const count = kind === 'pickup' ? 15 : kind === 'land' ? 9 : 3;
    for (let i = 0; i < count; i++) {
      const a = i * 2.399963 + time * 5.7;
      const speed = .7 + (i % 4) * .47;
      flakes.push({ t: time, x: p.x, z: p.z,
        y: kind === 'pickup' ? p.y + .56 : .095,
        vx: Math.cos(a) * speed - p.vx * (upward ? .055 : .23),
        vz: Math.sin(a) * speed - p.vz * (upward ? .055 : .23),
        vy: (upward ? 1.2 : .62) + (i % 4) * .19,
        gold: kind === 'pickup' });
    }
    if (flakes.length > MAX_FLASHES) flakes.splice(0, flakes.length - MAX_FLASHES);
  }
  function frame(run) {
    reset(run);
    const t = run.time;
    const p = run.p;
    if (t >= nextSample) {
      const current = { x: p.x, z: p.z, y: p.y, yaw: p.yaw };
      const speed = Math.hypot(p.vx, p.vz);
      if (previous && p.y < .16) {
        if (previous.y > .27) burst(run, 'land');
        else if (speed > .8) {
          const ax = Math.cos(p.yaw) * .145, az = -Math.sin(p.yaw) * .145;
          for (const side of [-1, 1]) {
            samples.push({ x: previous.x + side * ax, z: previous.z + side * az,
              toX: current.x + side * ax, toZ: current.z + side * az, t });
          }
          if (samples.length > MAX_MARKS) samples.splice(0, samples.length - MAX_MARKS);
        }
        if (speed > 2.5 && t >= nextSpray) {
          nextSpray = t + .105;
          burst(run, 'spray');
        }
      }
      previous = current;
      nextSample = t + .039;
    }
    samples = samples.filter(mark => t - mark.t < MARK_LIFE);
    flakes = flakes.filter(flake => t - flake.t < FLASH_LIFE);
    return {
      marks: samples,
      sparks: flakes.map(flake => {
        const age = t - flake.t;
        return { x: flake.x + flake.vx * age, z: flake.z + flake.vz * age,
          y: Math.max(.045, flake.y + flake.vy * age - age * age * 2.7),
          strength: 1 - age / FLASH_LIFE, gold: flake.gold };
      }),
    };
  }
  return { frame, burst };
}

// Bounded render target, including on tablets. CSS pixels only, no devicePixelRatio multiplier.
export function reflectionSize(width, height, tier) {
  width = Math.max(1, width); height = Math.max(1, height);
  const cap = tier === 'performance' ? 300 : tier === 'cinematic' ? 640 : 460;
  const scale = Math.min(1, cap / Math.max(width, height));
  return [Math.max(24, Math.round(width * scale)), Math.max(24, Math.round(height * scale))];
}
