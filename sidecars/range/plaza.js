/* The walk-mode plaza, drawn from map.mjs.
   Kit pieces load once and draw as instanced meshes, so a whole fence costs a few draw calls.
   If the kit cannot load, the plaza still has its ground, shops, and planter. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BUILDINGS, GEARS, KIT_SCALE, PLANTER, PROPS, YARD } from './map.mjs';

const lambert = (color, extra) => new THREE.MeshLambertMaterial({ color, ...extra });

function paverTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const draw = canvas.getContext('2d');
  draw.fillStyle = '#d9cdb4';
  draw.fillRect(0, 0, 256, 256);
  const tones = ['#e3d8c0', '#cfc2a6', '#dccfb5', '#d4c7ab'];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      draw.fillStyle = tones[(row * 3 + col) % tones.length];
      draw.fillRect(col * 64 + 3, row * 64 + 3, 58, 58);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(YARD / 2, YARD / 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function windowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const draw = canvas.getContext('2d');
  draw.fillStyle = '#ffffff';
  draw.fillRect(0, 0, 128, 128);
  draw.fillStyle = '#5b7f9e';
  draw.fillRect(30, 34, 68, 50);
  draw.fillStyle = '#9cc4e0';
  draw.fillRect(36, 40, 26, 38);
  draw.fillRect(66, 40, 26, 38);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function placement(x, y, z, rot, scale = KIT_SCALE) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot),
    new THREE.Vector3(scale, scale, scale)
  );
}

// One instanced mesh per mesh inside the kit piece, sharing its geometry and material.
function instance(group, model, matrices) {
  if (!matrices.length) return;
  model.updateMatrixWorld(true);
  model.traverse(child => {
    if (!child.isMesh) return;
    const mesh = new THREE.InstancedMesh(child.geometry, child.material, matrices.length);
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, new THREE.Matrix4().multiplyMatrices(matrix, child.matrixWorld)));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
  });
}

function fenceMatrices() {
  const step = 0.7 * KIT_SCALE;
  const count = Math.floor((YARD * 2) / step);
  const start = -YARD + (YARD * 2 - count * step) / 2 + step / 2;
  const out = [];
  for (let index = 0; index < count; index++) {
    const along = start + index * step;
    out.push(placement(along, 0, -YARD, 0), placement(along, 0, YARD, 0));
    out.push(placement(-YARD, 0, along, Math.PI / 2), placement(YARD, 0, along, Math.PI / 2));
  }
  return out;
}

export function buildPlaza(scene, { lowGpu = false } = {}) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const grass = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), lambert(0x7fb35a));
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.01;
  const pavers = new THREE.Mesh(new THREE.PlaneGeometry(YARD * 2, YARD * 2), lambert(0xffffff, { map: paverTexture() }));
  pavers.rotation.x = -Math.PI / 2;
  group.add(grass, pavers);

  const windows = windowTexture();
  BUILDINGS.forEach(box => {
    const map = windows.clone();
    map.needsUpdate = true;
    map.repeat.set(Math.round(box.hw), Math.max(1, Math.round(box.h / 2.2)));
    const walls = new THREE.Mesh(new THREE.BoxGeometry(box.hw * 2, box.h, box.hd * 2), lambert(box.color, { map }));
    walls.position.set(box.x, box.h / 2, box.z);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(box.hw * 2 + 0.4, 0.3, box.hd * 2 + 0.4), lambert(box.roof));
    roof.position.set(box.x, box.h + 0.15, box.z);
    group.add(walls, roof);
  });

  const planter = new THREE.Mesh(new THREE.CylinderGeometry(PLANTER.r, PLANTER.r + 0.1, 0.7, 20), lambert(0xb9a17e));
  planter.position.set(PLANTER.x, 0.35, PLANTER.z);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(PLANTER.r - 0.15, PLANTER.r - 0.15, 0.05, 20), lambert(0x5d8f3f));
  soil.position.set(PLANTER.x, 0.72, PLANTER.z);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.8, 7), lambert(0x7a5230));
  trunk.position.set(PLANTER.x, 1.6, PLANTER.z);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), lambert(0x4f9a45));
  crown.position.set(PLANTER.x, 3.2, PLANTER.z);
  group.add(planter, soil, trunk, crown);

  const trees = lowGpu ? 8 : 18;
  const leaf = lambert(0x3f7a3a);
  const bark = lambert(0x7a5230);
  for (let index = 0; index < trees; index++) {
    const angle = (index / trees) * Math.PI * 2 + 0.3;
    const reach = YARD + 5 + (index % 3) * 3;
    const x = Math.cos(angle) * reach;
    const z = Math.sin(angle) * reach;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.8, 6), bark);
    stem.position.set(x, 0.9, z);
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.8, 7), leaf);
    top.position.set(x, 3.5, z);
    group.add(stem, top);
  }

  // Gears spin until picked up. A plain gold ring stands in until the kit gear loads.
  const gearRoot = new THREE.Group();
  group.add(gearRoot);
  const gearMeshes = GEARS.map(gear => {
    const holder = new THREE.Group();
    holder.position.set(gear.x, 1, gear.z);
    holder.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.08, 8, 16), lambert(0xf2c14e)));
    gearRoot.add(holder);
    return holder;
  });

  const loader = new GLTFLoader();
  const kinds = [...new Set(PROPS.map(prop => prop.kind).concat(['Fence', 'Collectible_Gear']))];
  kinds.forEach(kind => {
    loader.load(`kit/${kind}.gltf`, gltf => {
      const model = gltf.scene;
      if (kind === 'Collectible_Gear') {
        gearMeshes.forEach(holder => {
          holder.clear();
          const gear = model.clone();
          gear.scale.setScalar(KIT_SCALE * 1.4);
          holder.add(gear);
        });
        return;
      }
      if (kind === 'Fence') {
        instance(group, model, fenceMatrices());
        return;
      }
      const spots = PROPS.filter(prop => prop.kind === kind && (!lowGpu || prop.r > 0 || prop.kind === 'Door'));
      instance(group, model, spots.map(prop => placement(prop.x, prop.y || 0, prop.z, prop.rot)));
    }, undefined, () => { /* that piece stays out; the plaza still plays */ });
  });

  let clock = 0;
  return {
    group,
    update(dt, state) {
      clock += dt;
      gearMeshes.forEach((holder, index) => {
        const gear = state.gears[index];
        holder.visible = !!gear && !gear.taken;
        holder.rotation.y = clock * 1.8 + index;
        holder.position.y = 1 + Math.sin(clock * 2 + index) * 0.12;
      });
    }
  };
}
