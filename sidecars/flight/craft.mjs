/**
 * Seed-pod glider for Sky flight. Built from Three.js primitives.
 * Little Sprouts original — no outside model files.
 *
 * Commercial note: this craft is ours. We do not ship Web Flight Simulator
 * (dimartarmizi/web-flight-simulator needs a separate commercial license),
 * OpenSkyFlight loaders, or third-party jet models. Free flight uses CesiumJS
 * (Apache 2.0) with Natural Earth II + ellipsoid terrain — no Cesium ion.
 */
import * as THREE from 'three';

const CRAFT_LENGTH = 14;
const VISUAL_ROLL_FACTOR = 90;
const VISUAL_ROLL_MAX = 1.1;
const VISUAL_SMOOTH = 4.5;

function podMesh() {
  const group = new THREE.Group();

  const hull = new THREE.Mesh(
    new THREE.CapsuleGeometry(1.1, 4.2, 6, 12),
    new THREE.MeshLambertMaterial({ color: 0xc8a45a })
  );
  hull.rotation.z = Math.PI / 2;
  hull.position.set(0, 0.2, 0);
  group.add(hull);

  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.95, 2.4, 10),
    new THREE.MeshLambertMaterial({ color: 0xe8d08a })
  );
  tip.rotation.x = -Math.PI / 2;
  tip.position.set(0, 0.2, -3.4);
  group.add(tip);

  const wingMat = new THREE.MeshLambertMaterial({ color: 0x6f9e5c, side: THREE.DoubleSide });
  const wingGeo = new THREE.BoxGeometry(9.5, 0.12, 2.4);
  const wing = new THREE.Mesh(wingGeo, wingMat);
  wing.position.set(0, 0.35, 0.4);
  group.add(wing);

  const fin = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 1.8, 1.6),
    new THREE.MeshLambertMaterial({ color: 0x4f7a45 })
  );
  fin.position.set(0, 1.1, 2.4);
  group.add(fin);

  const seed = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 10, 10),
    new THREE.MeshLambertMaterial({ color: 0x8b5a2b })
  );
  seed.position.set(0, 0.15, 1.1);
  group.add(seed);

  group.rotation.y = Math.PI;
  group.scale.setScalar(CRAFT_LENGTH / 9);
  group.traverse(child => {
    child.frustumCulled = false;
  });
  return group;
}

export function createCraft(scene) {
  const root = new THREE.Group();
  const mesh = podMesh();
  root.add(mesh);
  scene.add(root);

  let visualRoll = 0;
  const qRoll = new THREE.Quaternion();
  const axisZ = new THREE.Vector3(0, 0, 1);

  return {
    ready: true,
    update(state, dt) {
      const targetRoll = Math.max(
        -VISUAL_ROLL_MAX,
        Math.min(VISUAL_ROLL_MAX, (state.yawRate || 0) * VISUAL_ROLL_FACTOR)
      );
      const t = Math.min(1, VISUAL_SMOOTH * dt);
      visualRoll += (targetRoll - visualRoll) * t;
      root.position.copy(state.position);
      root.quaternion.copy(state.quaternion);
      qRoll.setFromAxisAngle(axisZ, (state.roll || 0) + visualRoll);
      root.quaternion.multiply(qRoll);
    },
    setVisible(visible) {
      root.visible = visible;
    }
  };
}
