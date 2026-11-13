/**
 * 2D global illumination with radiance cascades, for Light lines.
 *
 * Adapted from simondevyoutube/Shaders_RadianceCascades (MIT, see
 * RADIANCE_CASCADES_LICENSE.txt). The cascade layout, ray intervals (factor 4), angle
 * indexing, and bilinear merge follow that demo. Changes for the game:
 *   - Each cascade is ray-marched and merged into the one below in a single pass, so
 *     only two cascade targets are needed instead of two per level.
 *   - The scene SDF is built from batches of capsules (walls, drawn lines, lamps).
 *   - A moving ball light is added on top each frame.
 *   - Off-screen probes count as empty space, not as blockers, so edges stay lit.
 *   - The final pass lights the floor and walls by the radiance and leaves the rest black.
 *
 * Scene texture: rgb = emitted light (0 for dark walls), a = signed distance in pixels.
 */
import * as THREE from 'three';

const DIMS0 = 2;
const RANGE0 = 1;
const BATCH = 32;

const VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}`;

const COMMON = /* glsl */`
const float TAU = 6.28318530718;
uniform vec2 sceneRes;
`;

const STAMP = COMMON + /* glsl */`
varying vec2 vUv;
uniform sampler2D prevTex;
uniform bool init;
uniform int count;
uniform vec4 segs[${BATCH}];
uniform vec4 info[${BATCH}];
void main() {
  vec4 t = init ? vec4(0.0, 0.0, 0.0, 10000.0) : texture2D(prevTex, vUv);
  vec2 p = gl_FragCoord.xy - 0.5;
  for (int i = 0; i < ${BATCH}; i++) {
    if (i >= count) break;
    vec2 a = segs[i].xy;
    vec2 ba = segs[i].zw - a;
    vec2 pa = p - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    float d = length(pa - ba * h) - info[i].x;
    t.rgb = mix(t.rgb, info[i].yzw, smoothstep(1.0, 0.0, d));
    t.a = min(t.a, d);
  }
  gl_FragColor = t;
}`;

const SCENE = COMMON + /* glsl */`
varying vec2 vUv;
uniform sampler2D baseTex;
uniform vec4 ball;      // x, y, radius, on
uniform vec3 ballLight;
void main() {
  vec4 t = texture2D(baseTex, vUv);
  if (ball.w > 0.5) {
    float d = length(gl_FragCoord.xy - 0.5 - ball.xy) - ball.z;
    t.rgb = mix(t.rgb, ballLight, smoothstep(1.0, 0.0, d));
    t.a = min(t.a, d);
  }
  gl_FragColor = t;
}`;

const CASCADE = COMMON + /* glsl */`
uniform sampler2D sdfTex;
uniform sampler2D upperTex;
uniform int level;
uniform int levels;
uniform int steps;

int dimsOf(int l) { return ${DIMS0} << l; }
vec2 rangeOf(int l) {
  float s = ${RANGE0.toFixed(1)} * (1.0 - pow(4.0, float(l))) / (1.0 - 4.0);
  float e = ${RANGE0.toFixed(1)} * (1.0 - pow(4.0, float(l) + 1.0)) / (1.0 - 4.0);
  return vec2(s, e);
}

vec4 march(vec2 origin, vec2 dir, vec2 range) {
  float t = range.x;
  for (int i = 0; i < 64; i++) {
    if (i >= steps || t > range.y) break;
    vec2 p = origin + t * dir;
    if (p.x < 0.0 || p.y < 0.0 || p.x > sceneRes.x - 1.0 || p.y > sceneRes.y - 1.0) break;
    vec4 s = texture2D(sdfTex, (p + 0.5) / sceneRes);
    if (s.a > 0.1) { t += s.a; continue; }
    return vec4(s.rgb, 0.0);
  }
  return vec4(0.0, 0.0, 0.0, 1.0);
}

vec4 sampleDir(ivec2 probe, int l, float angle) {
  int dims = dimsOf(l);
  vec2 bl = float(dims) * vec2(probe);
  vec2 center = bl + 0.5 * (float(dims) - 1.0);
  if (center.x < 0.0 || center.y < 0.0 || center.x >= sceneRes.x || center.y >= sceneRes.y) return vec4(0.0, 0.0, 0.0, 1.0);
  int n = dims * dims;
  float stepA = TAU / float(n);
  int base = int(floor((angle + 0.5 * stepA) / TAU * float(n)));
  vec4 sum = vec4(0.0);
  for (int k = -1; k <= 2; k++) {
    int i = ((base + k) % n + n) % n;
    vec2 loc = vec2(float(i % dims), float(i / dims));
    sum += texture2D(upperTex, (bl + loc + 0.5) / sceneRes);
  }
  return sum * 0.25;
}

vec4 sampleUpper(vec2 pix, float angle, int l) {
  float dl = float(dimsOf(l - 1));
  vec2 lowerCenter = dl * floor(pix / dl) + 0.5 * (dl - 1.0);
  float d = float(dimsOf(l));
  ivec2 p0 = ivec2(floor((lowerCenter - d * 0.5) / d));
  vec2 c0 = d * vec2(p0) + 0.5 * (d - 1.0);
  vec2 f = clamp((lowerCenter - c0) / d, 0.0, 1.0);
  vec4 a = sampleDir(p0, l, angle);
  vec4 b = sampleDir(p0 + ivec2(1, 0), l, angle);
  vec4 c = sampleDir(p0 + ivec2(0, 1), l, angle);
  vec4 e = sampleDir(p0 + ivec2(1, 1), l, angle);
  return mix(mix(a, b, f.x), mix(c, e, f.x), f.y);
}

void main() {
  vec2 pix = gl_FragCoord.xy - 0.5;
  int dims = dimsOf(level);
  vec2 bl = float(dims) * floor(pix / float(dims));
  vec2 center = bl + 0.5 * (float(dims) - 1.0);
  ivec2 local = ivec2(pix - bl);
  int n = dims * dims;
  float stepA = TAU / float(n);
  float angle = mod(float(local.x + local.y * dims) * stepA - 0.5 * stepA, TAU);
  vec4 rad = march(center, vec2(cos(angle), sin(angle)), rangeOf(level));
  if (level < levels - 1 && rad.a > 0.0) {
    vec4 up = sampleUpper(pix, angle, level + 1);
    rad.rgb += up.rgb * rad.a;
    rad.a *= up.a;
  }
  gl_FragColor = rad;
}`;

const FIELD = COMMON + /* glsl */`
uniform sampler2D mergedTex;
void main() {
  vec2 bl = floor(gl_FragCoord.xy - 0.5) * ${DIMS0.toFixed(1)};
  vec4 sum = vec4(0.0);
  for (int i = 0; i < ${DIMS0}; i++)
    for (int j = 0; j < ${DIMS0}; j++)
      sum += texture2D(mergedTex, (bl + vec2(i, j) + 0.5) / sceneRes);
  gl_FragColor = sum / ${(DIMS0 * DIMS0).toFixed(1)};
}`;

const COMPOSE = COMMON + /* glsl */`
varying vec2 vUv;
uniform sampler2D sdfTex;
uniform sampler2D radTex;
uniform vec2 uvScale;
uniform vec4 worldRect;   // scene px: x0, y0 (bottom), x1, y1 (top)
uniform float unit;       // scene px per world unit
uniform float exposure;
uniform float time;

uniform float falloff;
// Light in 2D fades slowly with distance. Weighting it by its own brightness makes it
// fade fast, so only the area near a light shows and the rest of the board stays dark.
vec3 shape(vec3 r) {
  float l = dot(r, vec3(0.3, 0.5, 0.2));
  return r * clamp(pow(l * falloff, 1.6), 0.0, 4.0);
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 uv = vUv * uvScale;
  vec2 p = uv * sceneRes;
  vec4 s = texture2D(sdfTex, uv);
  vec3 rad = shape(texture2D(radTex, uv).rgb);

  // Floor: soft slate with a faint dot grid, seen only where light falls.
  vec2 w = (p - worldRect.xy) / unit;
  vec2 cell = abs(fract(w / 5.0) - 0.5) * 5.0;
  float dots = smoothstep(0.55, 0.25, length(cell));
  vec3 floorAlb = vec3(0.46, 0.5, 0.62) * (0.85 + 0.35 * dots) * (0.97 + 0.06 * hash(floor(w * 2.0)));
  vec3 col = floorAlb * rad;

  if (s.a < 1.5) {
    float cover = smoothstep(1.0, -1.0, s.a);
    float emi = max(s.r, max(s.g, s.b));
    vec3 surf;
    if (emi > 0.002) {
      surf = s.rgb * 1.3 + rad * 0.2;
    } else {
      // Dark wall: lit by the light just outside its surface.
      vec2 ex = vec2(1.0 / sceneRes.x, 0.0);
      vec2 ey = vec2(0.0, 1.0 / sceneRes.y);
      vec2 g = vec2(texture2D(sdfTex, uv + ex).a - texture2D(sdfTex, uv - ex).a,
                    texture2D(sdfTex, uv + ey).a - texture2D(sdfTex, uv - ey).a);
      vec2 n = g / max(length(g), 1e-5);
      vec3 lit = shape(texture2D(radTex, uv + n * (max(-s.a, 0.0) + 3.0) / sceneRes).rgb);
      float edge = smoothstep(-5.0, -1.0, s.a);
      surf = vec3(0.78, 0.72, 0.62) * lit * (1.1 + 0.6 * edge);
    }
    col = mix(col, surf, cover);
  }

  bool inside = p.x >= worldRect.x - unit * 2.0 && p.x <= worldRect.z + unit * 2.0 && p.y >= worldRect.y - unit * 2.0 && p.y <= worldRect.w + unit * 2.0;
  if (!inside) col = vec3(0.0);

  col *= exposure;
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}`;

function target(w, h, linear) {
  const f = linear ? THREE.LinearFilter : THREE.NearestFilter;
  return new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: f, magFilter: f,
    depthBuffer: false, stencilBuffer: false, generateMipmaps: false
  });
}

function levelsFor(w, h) {
  const diag = Math.hypot(w, h);
  for (let i = 0; i < 12; i++) {
    const end = (RANGE0 * (1 - 4 ** (i + 1))) / (1 - 4);
    if (end > diag) return i + 1;
  }
  return 12;
}

export class RadianceField {
  /** maxSide caps the light simulation size; steps caps ray-march steps per ray. */
  constructor(renderer, { maxSide = 1024, steps = 48 } = {}) {
    this.renderer = renderer;
    this.maxSide = maxSide;
    this.steps = steps;
    this.camera = new THREE.Camera();
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1));
    this.quad.frustumCulled = false;
    this.scene = new THREE.Scene();
    this.scene.add(this.quad);
    const mat = (frag, uniforms) => new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: frag, depthTest: false, depthWrite: false,
      uniforms: { sceneRes: { value: new THREE.Vector2(1, 1) }, ...uniforms }
    });
    this.mats = {
      stamp: mat(STAMP, {
        prevTex: { value: null }, init: { value: true }, count: { value: 0 },
        segs: { value: Array.from({ length: BATCH }, () => new THREE.Vector4()) },
        info: { value: Array.from({ length: BATCH }, () => new THREE.Vector4()) }
      }),
      scene: mat(SCENE, { baseTex: { value: null }, ball: { value: new THREE.Vector4() }, ballLight: { value: new THREE.Vector3(1, 1, 1) } }),
      cascade: mat(CASCADE, { sdfTex: { value: null }, upperTex: { value: null }, level: { value: 0 }, levels: { value: 1 }, steps: { value: steps } }),
      field: mat(FIELD, { mergedTex: { value: null } }),
      compose: mat(COMPOSE, {
        sdfTex: { value: null }, radTex: { value: null }, uvScale: { value: new THREE.Vector2(1, 1) },
        worldRect: { value: new THREE.Vector4() }, unit: { value: 1 }, exposure: { value: 1 }, falloff: { value: 1 }, time: { value: 0 }
      })
    };
    this.targets = null;
    this.ball = null;
    this.dirty = true;
  }

  /** Size the simulation for a canvas of cssW x cssH. Returns scene px per css px. */
  resize(cssW, cssH) {
    const q = Math.min(1, this.maxSide / Math.max(cssW, cssH));
    let w = Math.ceil(cssW * q);
    let h = Math.ceil(cssH * q);
    // Round up so the coarsest probes tile the texture exactly.
    let levels = levelsFor(w, h);
    for (let pass = 0; pass < 2; pass++) {
      const top = DIMS0 << (levels - 1);
      w = Math.ceil(Math.ceil(cssW * q) / top) * top;
      h = Math.ceil(Math.ceil(cssH * q) / top) * top;
      levels = levelsFor(w, h);
    }
    // Clamp the extreme case where the rounding needs one more level than it has.
    const top = DIMS0 << (levels - 1);
    w = Math.ceil(w / top) * top;
    h = Math.ceil(h / top) * top;
    if (this.targets) Object.values(this.targets).flat().forEach(t => t.dispose());
    this.targets = {
      base: [target(w, h, false), target(w, h, false)],
      sdf: target(w, h, true),
      cascade: [target(w, h, false), target(w, h, false)],
      field: target(w / DIMS0, h / DIMS0, true)
    };
    this.baseIndex = 0;
    this.w = w;
    this.h = h;
    this.q = q;
    this.levels = levels;
    this.uvScale = new THREE.Vector2((cssW * q) / w, (cssH * q) / h);
    for (const m of Object.values(this.mats)) m.uniforms.sceneRes.value.set(w, h);
    this.mats.field.uniforms.sceneRes.value.set(w, h);
    this.dirty = true;
    return q;
  }

  run(material, out) {
    this.quad.material = material;
    this.renderer.setRenderTarget(out);
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Draw capsules into the scene. Each shape is { ax, ay, bx, by, r, light: [r, g, b] }
   * in scene pixels with y up. fresh = start from an empty scene.
   */
  stamp(shapes, fresh = false) {
    const m = this.mats.stamp;
    let i = 0;
    let first = fresh;
    if (fresh && !shapes.length) shapes = [{ ax: -99, ay: -99, bx: -99, by: -99, r: 0, light: [0, 0, 0] }];
    while (i < shapes.length) {
      const batch = shapes.slice(i, i + BATCH);
      batch.forEach((s, k) => {
        m.uniforms.segs.value[k].set(s.ax, s.ay, s.bx, s.by);
        m.uniforms.info.value[k].set(s.r, s.light[0], s.light[1], s.light[2]);
      });
      m.uniforms.count.value = batch.length;
      m.uniforms.init.value = first;
      m.uniforms.prevTex.value = this.targets.base[this.baseIndex].texture;
      this.run(m, this.targets.base[1 - this.baseIndex]);
      this.baseIndex = 1 - this.baseIndex;
      first = false;
      i += BATCH;
    }
    this.dirty = true;
  }

  /** The ball's light: { x, y, r, light } in scene pixels, or null for none. */
  setBall(b) {
    const same = (!b && !this.ball) || (b && this.ball && Math.abs(b.x - this.ball.x) < 0.25 && Math.abs(b.y - this.ball.y) < 0.25 && b.light === this.ball.light);
    if (same) return;
    this.ball = b ? { ...b } : null;
    this.dirty = true;
  }

  /** Light the scene (only when something moved) and draw it to the screen. */
  render({ worldRect, unit, exposure = 1, falloff = 1, time = 0 }) {
    const t = this.targets;
    if (this.dirty) {
      const sm = this.mats.scene;
      sm.uniforms.baseTex.value = t.base[this.baseIndex].texture;
      if (this.ball) {
        sm.uniforms.ball.value.set(this.ball.x, this.ball.y, this.ball.r, 1);
        sm.uniforms.ballLight.value.set(...this.ball.light);
      } else sm.uniforms.ball.value.set(0, 0, 0, 0);
      this.run(sm, t.sdf);

      const cm = this.mats.cascade;
      cm.uniforms.sdfTex.value = t.sdf.texture;
      cm.uniforms.levels.value = this.levels;
      let k = 0;
      for (let lvl = this.levels - 1; lvl >= 0; lvl--) {
        cm.uniforms.level.value = lvl;
        cm.uniforms.upperTex.value = t.cascade[1 - k].texture;
        this.run(cm, t.cascade[k]);
        k = 1 - k;
      }
      this.mats.field.uniforms.mergedTex.value = t.cascade[1 - k].texture;
      this.run(this.mats.field, t.field);
      this.dirty = false;
    }
    const c = this.mats.compose;
    c.uniforms.sdfTex.value = t.sdf.texture;
    c.uniforms.radTex.value = t.field.texture;
    c.uniforms.uvScale.value.copy(this.uvScale);
    c.uniforms.worldRect.value.set(...worldRect);
    c.uniforms.unit.value = unit;
    c.uniforms.exposure.value = exposure;
    c.uniforms.falloff.value = falloff;
    c.uniforms.time.value = time;
    this.run(c, null);
  }
}
