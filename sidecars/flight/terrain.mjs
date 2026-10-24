/* Hills and valleys for the free-flight reward.
   Heights are meters. The same function drives the mesh and the altitude floor. */

export const METERS = 6;
export const CRUISE_ALT = 180;

function hash(ix, iz) {
  let n = Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function fade(t) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x, z) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = fade(x - x0);
  const tz = fade(z - z0);
  const a = hash(x0, z0);
  const b = hash(x0 + 1, z0);
  const c = hash(x0, z0 + 1);
  const d = hash(x0 + 1, z0 + 1);
  return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz;
}

function fbm(x, z) {
  let value = 0;
  let amp = 0.55;
  let freq = 1;
  for (let octave = 0; octave < 5; octave++) {
    value += amp * valueNoise(x * freq, z * freq);
    freq *= 2.05;
    amp *= 0.5;
  }
  return value;
}

export function groundMeters(x, z) {
  const broad = fbm(x * 0.00022, z * 0.00022);
  const ridge = 1 - Math.abs(fbm(x * 0.00045 + 9, z * 0.00045) * 2 - 1);
  const hills = Math.pow(Math.max(0, broad - 0.32), 1.35) * 780;
  const peaks = Math.pow(ridge, 2.2) * 420 * (broad > 0.4 ? 1 : 0.25);
  return Math.max(0, hills + peaks - 36);
}

export function landColor(height, x, z) {
  const shade = valueNoise(x * 0.002, z * 0.002);
  if (height < 16) return [0.76, 0.7, 0.46];
  if (height < 240) {
    const grass = 0.35 + shade * 0.12;
    return [0.28 + shade * 0.08, grass + 0.18, 0.18];
  }
  if (height < 460) return [0.45 + shade * 0.08, 0.42, 0.36];
  return [0.82, 0.84, 0.86];
}
