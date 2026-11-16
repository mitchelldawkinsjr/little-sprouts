import * as THREE from 'three';

import { reflectionSize } from './motion.mjs';

export const VERTEX = /* glsl */ `
  uniform mat4 iceProjection;
  varying vec3 arena;
  varying vec4 reflected;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    arena = world.xyz;
    reflected = iceProjection * world;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const FRAGMENT = /* glsl */ `
  uniform sampler2D mirrorFrame;
  uniform vec2 texel;
  uniform float mirrorReady;
  uniform vec3 charcoal;
  uniform vec3 fogTint;
  uniform vec3 iceTint;
  varying vec3 arena;
  varying vec4 reflected;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(45.97, 117.43))) * 31931.072);
  }

  // Broken, directional scratches in world space. The arena isn't a flat-colored disk.
  float etch(vec2 p) {
    float v = 0.0;
    for (int i = 0; i < 2; ++i) {
      p = mat2(0.70, 0.71, -0.71, 0.70) * p;
      vec2 tile = p * vec2(4.7, 8.8);
      vec2 cell = floor(tile);
      vec2 f = fract(tile);
      float r = hash(cell + float(i));
      float stroke = 1.0 - smoothstep(0.018, 0.065, abs(f.y - (0.2 + 0.6 * r)));
      float cut = smoothstep(0.09, 0.24, f.x) * (1.0 - smoothstep(0.52, 0.96, f.x));
      v += stroke * cut * r;
    }
    return v;
  }

  void main() {
    vec2 floorAt = arena.xz;
    vec3 eye = cameraPosition - arena;
    float grazing = 1.0 - abs(normalize(eye).y);
    float fog = smoothstep(13.0, 32.0, length(eye));
    float center = exp(-dot(floorAt * vec2(0.115, 0.092), floorAt * vec2(0.115, 0.092)));
    float light = exp(-dot((floorAt + vec2(2.6, 2.0)) * 0.15, (floorAt + vec2(2.6, 2.0)) * 0.15));
    float seam = etch(floorAt) * (1.0 - fog);
    vec3 stone = charcoal * (0.79 + 0.32 * center) + iceTint * (0.022 * light + seam * 0.052);
    vec2 uv = reflected.xy / max(0.001, reflected.w) * 0.5 + 0.5;
    vec2 offset = texel * (0.75 + seam * 2.5 + 1.25 * grazing);
    vec3 ghost = texture2D(mirrorFrame, clamp(uv, 0.001, 0.999)).rgb * 0.5;
    ghost += texture2D(mirrorFrame, clamp(uv + offset, 0.001, 0.999)).rgb * 0.25;
    ghost += texture2D(mirrorFrame, clamp(uv - offset, 0.001, 0.999)).rgb * 0.25;
    float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    float mirror = mirrorReady * step(0.001, reflected.w) * inside * (0.25 + 0.25 * grazing) * (0.55 + 0.45 * center);
    gl_FragColor = vec4(mix(mix(stone, ghost, mirror), fogTint, fog), 1.0);
    #include <colorspace_fragment>
  }
`;

export function makeIce(renderer, scene, camera, tier, palette) {
  const mirror = new THREE.PerspectiveCamera();
  const forward = new THREE.Vector3();
  const aim = new THREE.Vector3();
  const target = new THREE.WebGLRenderTarget(24, 24, {
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false
  });
  const matrix = new THREE.Matrix4();
  const uniforms = {
    iceProjection: { value: matrix },
    mirrorFrame: { value: target.texture },
    texel: { value: new THREE.Vector2(1 / 24, 1 / 24) },
    mirrorReady: { value: 0 },
    charcoal: { value: new THREE.Color(palette.floor) },
    fogTint: { value: new THREE.Color(palette.fog) },
    iceTint: { value: new THREE.Color(palette.ice) },
  };
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(83, 83),
    new THREE.ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT, toneMapped: false }));
  sheet.rotation.x = -Math.PI / 2;
  scene.add(sheet);
  let dirty = true, last = -Infinity, enabled = true, previousRun;
  const interval = tier === 'performance' ? 1 / 24 : 1 / 40;
  return {
    resize(width, height) {
      const [w, h] = reflectionSize(width, height, tier);
      target.setSize(w, h);
      uniforms.texel.value.set(1 / w, 1 / h);
      dirty = true;
    },
    capture(run) {
      if (!enabled || (!dirty && previousRun === run && run.time - last < interval)) return;
      const view = renderer.getRenderTarget();
      const auto = renderer.shadowMap.autoUpdate;
      const xr = renderer.xr.enabled;
      // Reflect the camera's position, forward direction, and up vector over y = 0.
      // All set dressing is above the sheet, so no below-floor geometry needs clipping.
      camera.getWorldDirection(forward);
      aim.copy(camera.position).add(forward);
      mirror.position.copy(camera.position);
      mirror.position.y *= -1;
      aim.y *= -1;
      mirror.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      mirror.up.y *= -1;
      mirror.lookAt(aim);
      mirror.near = camera.near;
      mirror.far = camera.far;
      mirror.projectionMatrix.copy(camera.projectionMatrix);
      mirror.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
      mirror.updateMatrixWorld();
      matrix.multiplyMatrices(mirror.projectionMatrix, mirror.matrixWorldInverse);
      try {
        sheet.visible = false;
        renderer.xr.enabled = false;
        renderer.shadowMap.autoUpdate = false;
        renderer.setRenderTarget(target);
        renderer.clear();
        renderer.render(scene, mirror);
        uniforms.mirrorReady.value = 1;
        last = run.time; previousRun = run; dirty = false;
      } catch {
        enabled = false;
        uniforms.mirrorReady.value = 0;
      } finally {
        renderer.xr.enabled = xr;
        renderer.shadowMap.autoUpdate = auto;
        sheet.visible = true;
        renderer.setRenderTarget(view);
      }
    }
  };
}
