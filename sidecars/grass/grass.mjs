/**
 * Instanced grass blades for Grass maze.
 *
 * The blade shape, wind, and player push follow SimonDev's Quick_Grass
 * (https://github.com/simondevyoutube/Quick_Grass, MIT; see QUICK_GRASS_LICENSE.txt),
 * which is itself based on the Ghost of Tsushima grass talk. This version is rewritten
 * for three r187 with a plain ShaderMaterial and simpler lighting. A height mask makes
 * blades tall over maze walls and short on the paths.
 */
import * as THREE from 'three';

const VERT = /* glsl */ `
#include <common>
#include <fog_pars_vertex>

attribute float vertIndex;

uniform float time;
uniform vec3 playerPos;
uniform vec4 maskRect;   // min x, min z, size x, size z
uniform sampler2D mask;
uniform vec4 blade;      // segments, width, wall height, path height
uniform float lodFar;    // 1 for the simple far blades

varying vec3 vColour;
varying vec3 vNormalW;
varying vec3 vWorld;
varying float vHeight;

vec4 hash42(vec2 p) {
  vec4 p4 = fract(vec4(p.xyxy) * vec4(0.1031, 0.1030, 0.0973, 0.1099));
  p4 += dot(p4, p4.wzxy + 33.33);
  return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise12(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float v = mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
                mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
  return v * 2.0 - 1.0;
}
float remap(float v, float a, float b, float c, float d) { return mix(c, d, (v - a) / (b - a)); }
vec3 rotAxis(vec3 v, vec3 a, float ang) {
  float s = sin(ang);
  float c = cos(ang);
  return v * c + cross(a, v) * s + a * dot(a, v) * (1.0 - c);
}
vec3 rotX(vec3 v, float ang) { float s = sin(ang); float c = cos(ang); return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c); }
vec3 rotY(vec3 v, float ang) { float s = sin(ang); float c = cos(ang); return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }

void main() {
  vec3 root = (modelMatrix * vec4(position.x, 0.0, position.z, 1.0)).xyz;
  vec4 h = hash42(root.xz * 7.13);

  // Tall over walls, short on paths. Outside the mask the edge texel (a wall) repeats.
  vec2 muv = (root.xz - maskRect.xy) / maskRect.zw;
  float wall = smoothstep(0.3, 0.7, texture2D(mask, muv).r);
  float tall = mix(blade.w, blade.z, wall);

  // Never hide the runner: blades just in front of it, toward the camera, stay short.
  vec2 toCam = normalize(cameraPosition.xz - playerPos.xz + vec2(0.0001));
  vec2 rel = root.xz - playerPos.xz;
  float along = dot(rel, toCam);
  float across = abs(rel.x * toCam.y - rel.y * toCam.x);
  float cut = smoothstep(-0.6, 0.2, along) * smoothstep(3.4, 2.4, along) * smoothstep(1.4, 0.9, across);
  tall = mix(tall, min(tall, blade.w * 1.3), cut);

  float segs = blade.x;
  float xSide = mod(vertIndex, 2.0);
  float hp = floor(vertIndex / 2.0) / segs;
  float height = tall * mix(0.7, 1.25, h.z);
  float taper = lodFar > 0.5 ? 1.0 - hp : 1.0 - pow(hp, 2.0);
  float width = blade.y * taper * mix(0.8, 1.2, h.y);

  vec3 p = vec3((xSide - 0.5) * width, hp * height, 0.0);
  vec3 n = vec3(0.0, 0.0, 1.0);

  // Natural lean, curving more toward the tip.
  float lean = mix(0.1, 0.4, h.w) + noise12(vec2(time * 0.35) + root.xz * 137.423) * 0.1;
  float curve = -lean * hp * hp;
  p = rotX(p, curve);
  n = rotX(n, curve);

  float ang = h.x * 6.2831853;
  p = rotY(p, ang);
  n = rotY(n, ang);

  // Wind gusts drift across the field.
  float windDir = noise12(root.xz * 0.05 + 0.05 * time);
  float gust = remap(noise12(root.xz * 0.25 + time), -1.0, 1.0, 0.25, 1.0);
  float windAng = gust * gust * 0.9 * hp;
  vec3 windAxis = vec3(cos(windDir), 0.0, sin(windDir));
  p = rotAxis(p, windAxis, windAng);
  n = rotAxis(n, windAxis, windAng);

  // Blades bend away from the runner.
  vec2 away = root.xz - playerPos.xz;
  float dist = length(away);
  float push = smoothstep(1.5, 0.3, dist) * 1.1;
  vec3 pushDir = vec3(away.x, 0.0, away.y) / max(dist, 0.001);
  vec3 pushAxis = normalize(cross(vec3(0.0, 1.0, 0.0), pushDir) + vec3(0.0, 0.0001, 0.0));
  p = rotAxis(p, pushAxis, push);
  n = rotAxis(n, pushAxis, push);

  vec3 baseC = mix(vec3(0.03, 0.12, 0.02), vec3(0.05, 0.16, 0.03), h.y);
  vec3 tipC = mix(vec3(0.42, 0.72, 0.16), vec3(0.62, 0.84, 0.26), h.z);
  tipC = mix(tipC, vec3(0.72, 0.86, 0.34), (1.0 - wall) * 0.5);
  vColour = mix(baseC, tipC, pow(hp, 1.6)) * mix(0.8, 1.1, h.w);
  vHeight = hp;

  vec3 world = root + p;
  vWorld = world;
  vNormalW = normalize(mix(n, vec3(0.0, 1.0, 0.0), 0.3));

  vec4 mvPosition = viewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const FRAG = /* glsl */ `
#include <common>
#include <fog_pars_fragment>

uniform vec3 sunDir;
uniform vec3 sunColour;
uniform vec3 skyColour;

varying vec3 vColour;
varying vec3 vNormalW;
varying vec3 vWorld;
varying float vHeight;

void main() {
  vec3 n = normalize(vNormalW);
  if (!gl_FrontFacing) n = normalize(vec3(-n.x, n.y, -n.z));
  vec3 L = normalize(sunDir);
  vec3 V = normalize(cameraPosition - vWorld);
  float wrap = 0.5;
  float diff = clamp((dot(n, L) + wrap) / (1.0 + wrap), 0.0, 1.0);
  // Light through the blade when looking toward the sun.
  float back = clamp((dot(V, -L) + 0.5) / 1.5, 0.0, 1.0) * 0.5;
  float spec = pow(max(dot(n, normalize(L + V)), 0.0), 24.0) * 0.25 * vHeight;
  float ao = mix(0.35, 1.0, pow(vHeight, 1.4));
  vec3 col = vColour * (skyColour * 0.55 + sunColour * (diff + back)) * ao + sunColour * spec;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

function bladeGeometry(segments, count, patch, seed) {
  const verts = (segments + 1) * 2;
  const vertIndex = new Float32Array(verts);
  for (let i = 0; i < verts; i++) vertIndex[i] = i;
  const index = [];
  for (let i = 0; i < segments; i++) {
    const v = i * 2;
    index.push(v, v + 1, v + 2, v + 2, v + 1, v + 3);
  }
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const offsets = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    offsets[i * 3] = (rnd() - 0.5) * patch;
    offsets[i * 3 + 2] = (rnd() - 0.5) * patch;
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.instanceCount = count;
  geo.setAttribute('vertIndex', new THREE.BufferAttribute(vertIndex, 1));
  geo.setAttribute('position', new THREE.InstancedBufferAttribute(offsets, 3));
  geo.setIndex(index);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), patch * 0.75 + 2);
  return geo;
}

function material(lights, segments, far, shared) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    fog: true,
    side: THREE.DoubleSide,
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      ...shared,
      blade: { value: new THREE.Vector4(segments, lights.width, lights.wallHeight, lights.pathHeight) },
      lodFar: { value: far ? 1 : 0 }
    }
  });
}

/**
 * A field of grass over a rectangle. Patches near the runner use detailed blades,
 * the rest simple ones.
 * opts: { rect: {x0, z0, x1, z1}, mask: DataTexture, maskRect: Vector4, low: boolean, sunDir, sunColour, skyColour }
 */
export function makeGrass(opts) {
  const low = !!opts.low;
  const PATCH = 4;
  const density = low ? 11 : 26;
  const count = Math.round(density * PATCH * PATCH);
  const segsNear = low ? 3 : 5;
  const look = { width: low ? 0.16 : 0.11, wallHeight: 1.45, pathHeight: 0.32 };
  const shared = {
    time: { value: 0 },
    playerPos: { value: new THREE.Vector3() },
    mask: { value: opts.mask },
    maskRect: { value: opts.maskRect },
    sunDir: { value: opts.sunDir.clone() },
    sunColour: { value: opts.sunColour.clone() },
    skyColour: { value: opts.skyColour.clone() }
  };
  const near = { geo: bladeGeometry(segsNear, count, PATCH, 11), mat: material(look, segsNear, false, shared) };
  const far = { geo: bladeGeometry(1, count, PATCH, 11), mat: material(look, 1, true, shared) };
  const group = new THREE.Group();
  group.name = 'grass';
  const patches = [];
  const { x0, z0, x1, z1 } = opts.rect;
  for (let x = x0 + PATCH / 2; x < x1; x += PATCH) {
    for (let z = z0 + PATCH / 2; z < z1; z += PATCH) {
      const hi = new THREE.Mesh(near.geo, near.mat);
      const lo = new THREE.Mesh(far.geo, far.mat);
      hi.position.set(x, 0, z);
      lo.position.set(x, 0, z);
      hi.matrixAutoUpdate = lo.matrixAutoUpdate = false;
      hi.updateMatrix();
      lo.updateMatrix();
      group.add(hi, lo);
      patches.push({ x, z, hi, lo });
    }
  }
  const nearDist = low ? 8 : 13;
  return {
    group,
    uniforms: shared,
    blades: patches.length * count,
    update(time, player) {
      shared.time.value = time % 1000;
      shared.playerPos.value.set(player.x, 0, player.z);
      for (const p of patches) {
        const close = Math.hypot(p.x - player.x, p.z - player.z) < nearDist;
        p.hi.visible = close;
        p.lo.visible = !close;
      }
    },
    dispose() {
      near.geo.dispose();
      far.geo.dispose();
      near.mat.dispose();
      far.mat.dispose();
    }
  };
}
