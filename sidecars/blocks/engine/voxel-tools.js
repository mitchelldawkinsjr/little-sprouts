import * as THREE from '../../../vendor/three/build/three.module.js?v=r187';

import {entity} from './entity.js?v=blocks3';
import {voxel_shader} from './voxel-shader.js?v=blocks3';
import {texture_defs} from './texture-defs.js?v=blocks3';

// Forked from SimonDev's Quick_MinecraftClone2 (MIT). The blinking outline shader, the held-block
// swing, and the build-on-the-face-you-point-at rule come from the original's insert and
// delete tools. Changes for Little Sprouts:
// - The aim ray walks the voxel grid instead of testing every nearby box.
// - One component with two modes, build and dig, switched by the page.
// - The ray starts at the camera and goes through a point on screen (the centre for the
//   controller and keys, the finger or mouse for touch and clicks), not only straight ahead.
// - Doors are two blocks tall, and building on a door opens or shuts it instead.
// - The pickaxe model is replaced by a small trowel made of boxes.
// - A block is never placed inside the player.
export const voxel_tools = (() => {

  const REACH = 7;

  function outline(colour, scale) {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const p1 = new THREE.ShaderMaterial({
        uniforms: {
            time: {value: 0.0},
            edgeColour: { value: new THREE.Color(colour) },
        },
        vertexShader: voxel_shader.PLACEMENT.VS,
        fragmentShader: voxel_shader.PLACEMENT.PS,
        side: THREE.FrontSide,
        blending: THREE.NormalBlending,
        transparent: true,
        depthWrite: false,
    });
    const p2 = p1.clone();
    p2.side = THREE.BackSide;
    const m1 = new THREE.Mesh(geo, p1);
    const m2 = new THREE.Mesh(geo, p2);
    m1.renderOrder = 1;
    const group = new THREE.Group();
    group.add(m1, m2);
    group.scale.setScalar(scale);
    group.visible = false;
    return { group, materials: [p1, p2] };
  }

  class VoxelTools extends entity.Component {
    static CLASS_NAME = 'VoxelTools';

    get NAME() {
      return VoxelTools.CLASS_NAME;
    }

    constructor() {
      super();
      this.mode_ = 'build';
      this.voxelType_ = 'grass';
      this.timer_ = 0;
      this.swing_ = 0;
      this.enabled = true;
      // Normalised screen point the ray goes through. null means the middle of the screen.
      this.aim = null;
      this.target_ = null;
      this.ray_ = new THREE.Raycaster();
      this.ndc_ = new THREE.Vector2();
    }

    get Mode() { return this.mode_; }
    get VoxelType() { return this.voxelType_; }
    get Target() { return this.target_; }

    InitEntity() {
      const renderer = this.FindEntity('renderer').GetComponent('ThreeJSController');
      const scene = renderer.scene_;
      const uiCamera = renderer.uiCamera_;
      this.camera_ = renderer.camera_;
      this.voxels_ = this.FindEntity('voxels').GetComponent('SparseVoxelCellManager');

      this.build_ = outline(0x16382c, 0.999);
      this.dig_ = outline(0xc8452f, 1.0001);
      scene.add(this.build_.group, this.dig_.group);

      // Held block, drawn with the world's own voxel material.
      const voxelGeo = new THREE.BoxGeometry(1, 1, 1);
      this.voxelMesh_ = new THREE.Mesh(voxelGeo, this.voxels_.materialOpaque_.clone());
      this.voxelMesh_.material.uniforms.fogRange.value.set(1e4, 2e4);
      this.voxelMesh_.material.depthTest = false;
      this.voxelMesh_.position.set(1.25, -1.25, -3.2);
      this.voxelMesh_.rotation.y = 0.25 * Math.PI;
      this.voxelMesh_.scale.setScalar(0.8);
      this.held_ = new THREE.Group();
      this.held_.add(this.voxelMesh_);
      uiCamera.add(this.held_);

      // A trowel for digging.
      const steel = new THREE.MeshLambertMaterial({color: 0xc9d2d6});
      const wood = new THREE.MeshLambertMaterial({color: 0xe28a3b});
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.62), steel);
      blade.position.set(0, 0, -0.5);
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.3), steel);
      neck.position.set(0, 0.04, -0.08);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.56), wood);
      handle.position.set(0, 0.06, 0.32);
      this.trowel_ = new THREE.Group();
      this.trowel_.add(blade, neck, handle);
      this.trowel_.traverse(c => { if (c.material) c.material.depthTest = false; });
      this.trowel_.position.set(1.1, -1.0, -2.4);
      this.trowel_.rotation.set(-0.5, 0.35, 0);
      uiCamera.add(this.trowel_);

      this.UpdateVoxelMesh_();
      this.SetMode(this.mode_);
    }

    SetMode(mode) {
      this.mode_ = mode === 'dig' ? 'dig' : 'build';
      this.held_.visible = this.mode_ === 'build';
      this.trowel_.visible = this.mode_ === 'dig';
      this.Broadcast({topic: 'tools.mode', value: this.mode_});
    }

    SetVoxelType(type) {
      if (!this.voxels_.blockTypes_[type]) return;
      this.voxelType_ = type;
      this.UpdateVoxelMesh_();
    }

    UpdateVoxelMesh_() {
      const colours = [];
      const uvSlices = [];
      const faces = this.voxels_.blockTypes_[this.voxelType_].textures;
      // BoxGeometry faces: +x, -x, +y, -y, +z, -z, four vertices each.
      for (let f = 0; f < 6; ++f) {
        for (let i = 0; i < 4; ++i) {
          colours.push(1.0, 1.0, 1.0);
          uvSlices.push(faces[f]);
        }
      }
      this.voxelMesh_.geometry.setAttribute('colour', new THREE.Float32BufferAttribute(colours, 3));
      this.voxelMesh_.geometry.setAttribute('uvSlice', new THREE.Float32BufferAttribute(uvSlices, 1));
    }

    // Where the ray through `aim` lands: the block it hits, and the empty spot in front of that face.
    // The original tested the ray against every voxel box nearby. This walks the grid cell by cell
    // (Amanatides & Woo), which is far cheaper every frame and gives the face for free.
    FindTarget_(aim) {
      this.ndc_.set(aim ? aim.x : 0, aim ? aim.y : 0);
      this.ray_.setFromCamera(this.ndc_, this.camera_);
      const o = this.ray_.ray.origin;
      const d = this.ray_.ray.direction;
      // Voxel n spans n-0.5..n+0.5, so shift by half a block and floor.
      let x = Math.floor(o.x + 0.5), y = Math.floor(o.y + 0.5), z = Math.floor(o.z + 0.5);
      const stepX = Math.sign(d.x), stepY = Math.sign(d.y), stepZ = Math.sign(d.z);
      const next = (p, cell, step) => (step > 0 ? cell + 0.5 - p : p - (cell - 0.5));
      const tDeltaX = stepX ? Math.abs(1 / d.x) : Infinity;
      const tDeltaY = stepY ? Math.abs(1 / d.y) : Infinity;
      const tDeltaZ = stepZ ? Math.abs(1 / d.z) : Infinity;
      let tMaxX = stepX ? next(o.x, x, stepX) * tDeltaX : Infinity;
      let tMaxY = stepY ? next(o.y, y, stepY) * tDeltaY : Infinity;
      let tMaxZ = stepZ ? next(o.z, z, stepZ) * tDeltaZ : Infinity;
      let prev = null;
      let t = 0;
      while (t <= REACH) {
        const type = this.voxels_.VoxelTypeAt(x, y, z);
        if (type && type !== 'ocean') {
          return { hit: [x, y, z], side: prev, type };
        }
        prev = [x, y, z];
        if (tMaxX < tMaxY && tMaxX < tMaxZ) { x += stepX; t = tMaxX; tMaxX += tDeltaX; }
        else if (tMaxY < tMaxZ) { y += stepY; t = tMaxY; tMaxY += tDeltaY; }
        else { z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; }
      }
      return null;
    }

    // Build or dig once. `aim` is a screen point, or null for the middle. Returns what happened.
    Act(aim = this.aim) {
      if (!this.enabled) return null;
      const target = this.FindTarget_(aim);
      if (!target) return null;
      const player = this.FindEntity('player').GetComponent('PlayerController');
      const door = texture_defs.isDoor(target.type) ? this.DoorHalves_(target.hit) : null;
      if (this.mode_ === 'build') {
        if (door) return this.ToggleDoor_(door, player);
        const spot = target.side;
        if (!spot || player.Overlaps(...spot)) return null;
        if (this.voxelType_ === 'door') {
          // Room for both halves, and the top half must not land on the player either.
          const top = [spot[0], spot[1] + 1, spot[2]];
          if (this.voxels_.VoxelTypeAt(...top) || player.Overlaps(...top)) return null;
          if (!this.voxels_.PlaceVoxel(spot, 'door')) return null;
          this.voxels_.PlaceVoxel(top, 'door_top');
        } else if (!this.voxels_.PlaceVoxel(spot, this.voxelType_)) {
          return null;
        }
        this.swing_ = 1;
        this.Broadcast({topic: 'tools.placed', value: this.voxelType_, position: spot});
        return { placed: spot, type: this.voxelType_ };
      }
      if (!this.voxels_.DigVoxel(target.hit)) return null;
      // Dig a door and both halves go.
      if (door) door.filter(h => h.pos !== target.hit).forEach(h => this.voxels_.DigVoxel(h.pos));
      this.swing_ = 1;
      this.Broadcast({topic: 'tools.dug', value: target.type, position: target.hit});
      return { dug: target.hit, type: target.type };
    }

    // The door part at `pos` and its other half, if that is still there.
    DoorHalves_(pos) {
      const type = this.voxels_.VoxelTypeAt(...pos);
      const halves = [{pos, type}];
      const other = [pos[0], pos[1] + (texture_defs.isDoorTop(type) ? -1 : 1), pos[2]];
      const otherType = this.voxels_.VoxelTypeAt(...other);
      if (texture_defs.isDoor(otherType) && texture_defs.isDoorTop(otherType) !== texture_defs.isDoorTop(type)) {
        halves.push({pos: other, type: otherType});
      }
      return halves;
    }

    ToggleDoor_(halves, player) {
      const opening = !texture_defs.DEFS[halves[0].type].passable;
      // Never shut a door on the player.
      if (!opening && halves.some(h => player.Overlaps(...h.pos))) return null;
      halves.forEach(h => this.voxels_.PlaceVoxel(h.pos, texture_defs.DOOR_SWAP[h.type]));
      this.swing_ = 1;
      this.Broadcast({topic: 'tools.door', value: opening ? 'open' : 'shut', position: halves[0].pos});
      return { door: opening ? 'open' : 'shut' };
    }

    Update(timeInSeconds) {
      this.timer_ += timeInSeconds;
      for (const m of [...this.build_.materials, ...this.dig_.materials]) m.uniforms.time.value = this.timer_;

      this.swing_ = Math.max(0, this.swing_ - timeInSeconds * 4);
      const s = Math.sin(this.swing_ * Math.PI);
      this.held_.rotation.x = -s * 0.6;
      this.trowel_.rotation.x = -0.5 - s * 0.9;

      this.build_.group.visible = false;
      this.dig_.group.visible = false;
      this.target_ = this.enabled ? this.FindTarget_(this.aim) : null;
      if (!this.target_) return;
      if (this.mode_ === 'build' && texture_defs.isDoor(this.target_.type)) {
        this.build_.group.position.set(...this.target_.hit);
        this.build_.group.visible = true;
      } else if (this.mode_ === 'build' && this.target_.side) {
        this.build_.group.position.set(...this.target_.side);
        this.build_.group.visible = true;
      } else if (this.mode_ === 'dig') {
        this.dig_.group.position.set(...this.target_.hit);
        this.dig_.group.visible = true;
      }
    }
  };

  return {
      VoxelTools: VoxelTools,
  };
})();
