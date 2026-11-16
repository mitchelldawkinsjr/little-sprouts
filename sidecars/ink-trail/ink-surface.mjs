import * as THREE from 'three';

const SPAN = 110;
const SLOTS = 24;
const fullscreen = /* glsl */`
  varying vec2 uv0;
  void main() { uv0 = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const granulation = /* glsl */`
  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * .1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0 - 2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
               mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
  }
`;

/** Two GPU textures let yesterday's pigment flow into today's. Every stamp is a floor-space segment. */
export function makeInkSurface(renderer) {
  const size = matchMedia('(pointer: coarse)').matches ? 448 : 640;
  const targets = Array.from({ length: 2 }, () => new THREE.WebGLRenderTarget(size, size, {
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false
  }));
  const from = new THREE.Vector2();
  const focus = new THREE.Vector2();
  const origin = new THREE.Vector2();
  let index = 0;
  const segments = Array.from({ length: SLOTS }, () => new THREE.Vector4());
  const style = Array.from({ length: SLOTS }, () => new THREE.Vector4());
  const uniforms = {
    previous: { value: null }, offset: { value: from }, origin: { value: origin },
    count: { value: 0 }, segments: { value: segments }, styles: { value: style },
    texel: { value: 1 / size }, seconds: { value: 0 }, dt: { value: 0 }
  };
  const simulation = new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false,
    vertexShader: fullscreen,
    fragmentShader: /* glsl */`
      varying vec2 uv0;
      uniform sampler2D previous;
      uniform vec2 offset, origin;
      uniform float texel, seconds, dt;
      uniform int count;
      uniform vec4 segments[${SLOTS}], styles[${SLOTS}];
      ${granulation}
      vec4 readInk(vec2 uv) {
        if (any(lessThan(uv, vec2(0.))) || any(greaterThan(uv,vec2(1.)))) return vec4(0.);
        return texture2D(previous, uv);
      }
      void main() {
        vec2 world = uv0 * ${SPAN}.0 + origin;
        vec2 p = uv0 + offset;
        vec2 flow = vec2(noise(world*.48+seconds*.06), noise(world*.71-21.-seconds*.055))-.5;
        p += flow * texel * dt * 38.;
        float stepSize = texel * (1.1 + 1.2 * noise(world * 1.3));
        vec4 old = readInk(p);
        vec4 blurred = .25 * (readInk(p+vec2(stepSize,0.))+readInk(p-vec2(stepSize,0.))
                            +readInk(p+vec2(0.,stepSize))+readInk(p-vec2(0.,stepSize)));
        vec4 ink = mix(old, blurred, min(.84, dt*7.5)) * exp(-dt * .29);
        float fiber = noise(world*11.0);
        for (int i=0; i<${SLOTS}; ++i) {
          if (i >= count) break;
          vec2 a=segments[i].xy, b=segments[i].zw;
          vec2 ab=b-a;
          vec2 d=world-a;
          float radius=styles[i].a;
          // Skip distance math for pixels outside the segment's little splash box.
          if (any(lessThan(world,min(a,b)-radius*3.0)) || any(greaterThan(world,max(a,b)+radius*3.0))) continue;
          d-=ab*clamp(dot(d,ab)/max(dot(ab,ab),.0001),0.,1.);
          float dist=length(d)/(radius*(.87+fiber*.19));
          float pigment=(1.-smoothstep(.17,1.1,dist))*.8;
          float water=(1.-smoothstep(.52,2.8,dist))*.22;
          float aInk=max(pigment,water);
          ink=max(ink,vec4(styles[i].rgb*aInk,aInk));
        }
        gl_FragColor=ink;
      }
    `
  });
  const pass = new THREE.Scene();
  pass.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simulation));
  const screen = new THREE.Camera();
  const ground = new THREE.ShaderMaterial({
    uniforms: { pigment: { value: targets[0].texture }, inkOrigin: { value: origin } },
    vertexShader: /* glsl */`
      varying vec3 floorPos;
      varying float depth;
      void main(){
        vec4 world = modelMatrix * vec4(position,1.);
        floorPos = world.xyz;
        vec4 view = viewMatrix * world;
        depth = -view.z;
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 floorPos;
      varying float depth;
      uniform sampler2D pigment;
      uniform vec2 inkOrigin;
      ${granulation}
      void main(){
        vec2 p = floorPos.xz;
        vec2 inkUv = (p - inkOrigin) / ${SPAN}.0;
        vec4 wet = vec4(0.);
        if (all(greaterThanEqual(inkUv, vec2(0.))) && all(lessThanEqual(inkUv, vec2(1.)))) wet = texture2D(pigment, inkUv);
        float grain = noise(p*34.);
        float pulp = noise(p*.32)*.65 + noise(p*2.1)*.35;
        vec3 slate = mix(vec3(.022,.021,.026), vec3(.053,.048,.055), pulp);
        slate *= .80 + grain*.39;
        vec3 stain = wet.rgb * (1.24 + grain*.24);
        vec3 color = slate*(1.-wet.a*.46)+stain;
        color = mix(color,vec3(.023,.021,.028),smoothstep(70.,155.,depth));
        gl_FragColor=vec4(color, 1.);
        #include <colorspace_fragment>
      }
    `
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(350, 350), ground);
  mesh.rotation.x = -Math.PI / 2;
  mesh.frustumCulled = false;

  function reset() {
    const clear = renderer.getClearColor(new THREE.Color());
    const alpha = renderer.getClearAlpha();
    renderer.setClearColor(0, 0);
    renderer.setScissorTest(false);
    for (const target of targets) {
      renderer.setRenderTarget(target);
      renderer.clear();
    }
    renderer.setRenderTarget(null);
    renderer.setClearColor(clear, alpha);
  }

  function frame(a, b, stroke, dt, seconds) {
    const pixel = SPAN / size;
    focus.set((a.x + b.x) / 2 - SPAN / 2, (a.z + b.z) / 2 - SPAN / 2);
    focus.set(Math.round(focus.x / pixel) * pixel, Math.round(focus.y / pixel) * pixel);
    from.copy(focus).sub(origin).divideScalar(SPAN);
    origin.copy(focus);
    mesh.position.set(origin.x + SPAN / 2, 0, origin.y + SPAN / 2);
    uniforms.dt.value = dt;
    uniforms.seconds.value = seconds;
    for (let i = 0; i < stroke.length || i === 0; i += SLOTS) {
      const n = Math.min(SLOTS, stroke.length - i);
      for (let k = 0; k < n; k++) {
        const [p, q] = stroke[i + k];
        segments[k].set(p.x, p.z, q.x, q.z);
        if (q.style === 'gold') style[k].set(1, .47, .055, .65);
        else if (q.style === 'wobble') style[k].set(1, .13, .28, .42);
        else {
          // The pen slowly changes pigment, from cyan through periwinkle and mint.
          const tint = (1 - Math.cos(q.age * .8)) * .5;
          style[k].set(.034 + tint*.16, .64 - tint*.26, .88 + tint*.11, .38 + Math.min(.22, (q.pressure || 0)*.22));
        }
      }
      uniforms.count.value = n;
      uniforms.previous.value = targets[index].texture;
      index = 1 - index;
      renderer.setRenderTarget(targets[index]);
      renderer.render(pass, screen);
      from.set(0, 0);
      uniforms.dt.value = 0;
    }
    renderer.setRenderTarget(null);
    ground.uniforms.pigment.value = targets[index].texture;
  }

  reset();
  return { mesh, frame, reset };
}
