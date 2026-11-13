import * as THREE from '../../../vendor/three/build/three.module.js?v=r187';

import {entity} from "./entity.js?v=blocks4";
import {defs} from "./defs.js?v=blocks4";
import {voxel_shader} from "./voxel-shader.js?v=blocks4";

// Forked from SimonDev's Quick_MinecraftClone2 (MIT). Changes for Little Sprouts: no post-processing
// chain (low-end tablets), the shaders write sRGB themselves, the starry space cube map is gone, and
// the canvas fills the page's #view box instead of the window.
export const threejs_component = (() => {

  const _VS = `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }`;


  const _FS = voxel_shader.COLOR + `
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  uniform float offset;
  uniform float exponent;
  uniform float whiteBlend;

  varying vec3 vWorldPosition;

  void main() {
    float h = normalize(vWorldPosition - cameraPosition + vec3(0.0, offset, 0.0)).y;
    float t = max(pow(max(h, 0.0), exponent), 0.0);
    vec3 sky = mix(bottomColor, topColor, t);
    float skyMix = clamp(whiteBlend, 0.0, 1.0);
    sky = mix(bottomColor, sky, skyMix * skyMix);
    gl_FragColor = vec4(ls_toSRGB(sky), 1.0);
  }`;

  class ThreeJSController extends entity.Component {
    static CLASS_NAME = 'ThreeJSController';

    get NAME() {
      return ThreeJSController.CLASS_NAME;
    }

    constructor(params = {}) {
      super();
      this.params_ = params;
    }

    InitEntity() {
      const params = this.params_;
      this.container_ = params.container;
      this.threejs_ = new THREE.WebGLRenderer(params.rendererOptions || {antialias: false});
      if (!this.threejs_.getContext()) throw new Error('no-webgl');
      this.threejs_.setPixelRatio(Math.min(window.devicePixelRatio || 1, params.pixelRatio || 1));
      this.threejs_.outputColorSpace = THREE.SRGBColorSpace;
      this.threejs_.autoClear = false;
      this.threejs_.domElement.id = 'threejs';
      this.container_.appendChild(this.threejs_.domElement);

      window.addEventListener('resize', () => {
        this.OnResize_();
      }, false);

      const fov = 70;
      const aspect = 1920 / 1080;
      const near = 0.1;
      const far = 2500.0;
      this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
      this.camera_.rotation.order = 'YXZ';

      // The held block and the trowel draw in their own scene, on top of the world.
      this.uiCamera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);

      this.scene_ = new THREE.Scene();
      this.scene_.add(this.camera_);

      this.uiScene_ = new THREE.Scene();
      this.uiScene_.add(this.uiCamera_);

      const light = new THREE.DirectionalLight(0xffffff, 1.6);
      light.position.set(-1, 3, 1);
      this.uiScene_.add(light);
      this.uiScene_.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 1.4));

      this.LoadSky_();
      this.OnResize_();
    }

    OnResize_() {
      const width = Math.max(1, this.container_.clientWidth);
      const height = Math.max(1, this.container_.clientHeight);
      const fov = width < height ? 80 : 70;
      for (const camera of [this.camera_, this.uiCamera_]) {
        camera.aspect = width / height;
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      this.threejs_.setSize(width, height);
    }

    LoadSky_() {
      const uniforms = {
        "topColor": { value: defs.SKY_COLOUR.clone() },
        "bottomColor": { value: defs.FOG_COLOUR.clone() },
        "offset": { value: 20 },
        "exponent": { value: 0.6 },
        "whiteBlend": { value: 1.0 },
      };

      const skyGeo = new THREE.SphereGeometry(1500, 24, 12);
      const skyMat = new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: _VS,
          fragmentShader: _FS,
          side: THREE.BackSide,
          depthWrite: false,
      });

      const sky = new THREE.Mesh(skyGeo, skyMat);
      sky.renderOrder = -1;
      sky.frustumCulled = false;
      this.sky_ = sky;
      this.scene_.add(sky);
    }

    Update(timeElapsed) {
      const player = this.FindEntity('player');
      if (!player) {
        return;
      }
      const pos = player.Position;
      this.sky_.position.set(pos.x, pos.y, pos.z);
    }

    Render() {
      this.uiCamera_.position.copy(this.camera_.position);
      this.uiCamera_.quaternion.copy(this.camera_.quaternion);

      this.threejs_.clear();
      this.threejs_.render(this.scene_, this.camera_);
      this.threejs_.clearDepth();
      this.threejs_.render(this.uiScene_, this.uiCamera_);
    }
  }

  return {
      ThreeJSController: ThreeJSController,
  };
})();
