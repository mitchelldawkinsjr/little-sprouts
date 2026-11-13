import * as THREE from '../../../vendor/three/build/three.module.js?v=r187';

import {entity} from './entity.js?v=blocks3';
import {utils} from './utils.js?v=blocks3';
import {voxel_builder_threaded} from './voxel-builder-threaded.js?v=blocks3';
import {voxel_shader} from './voxel-shader.js?v=blocks3';
import {textures} from './textures.js?v=blocks3';
import {texture_defs} from './texture-defs.js?v=blocks3';
import {defs} from './defs.js?v=blocks3';

// Forked from SimonDev's Quick_MinecraftClone2 (MIT). Changes for Little Sprouts:
// - Textures are painted in code (textures.js) instead of loading Minecraft-style PNGs.
// - Every block a child places or digs is kept in `edits_`. The original forgot them when a chunk
//   streamed out; here they are re-applied when the chunk is rebuilt, and saved by the page.
// - IsReadyAt() lets the player wait for the ground before gravity starts.
export const sparse_voxel_cell_manager = (() => {

  class SparseVoxelCellManager extends entity.Component {
    static CLASS_NAME = 'SparseVoxelCellManager';

    get NAME() {
      return SparseVoxelCellManager.CLASS_NAME;
    }

    constructor(params) {
      super();
      this.params_ = params;
      this.blocks_ = {};
      this.cellDimensions_ = new THREE.Vector3(params.cellSize, params.cellSize, params.cellSize);
      this.visibleDimensions_ = [params.worldSize, params.worldSize];
      this.totalTime_ = 0.0;
      // "x.y.z" -> block type, or '' for a dug-out spot. Map order is the order things happened.
      this.edits_ = new Map(params.edits || []);
      this.replaying_ = false;
      this.onEdit = () => {};
    }

    InitEntity() {
      this.scene_ = this.FindEntity('renderer').GetComponent('ThreeJSController').scene_;

      const near = this.params_.fogRange || defs.FOG_RANGE;
      this.fogRange_ = near;
      this.materialOpaque_ = new THREE.ShaderMaterial({
          uniforms: {
            diffuseMap: { value: null },
            noiseMap: { value: null },
            fogColour: { value: defs.FOG_COLOUR.clone() },
            fogDensity: { value: 0.000065 },
            fogRange: { value: new THREE.Vector2(...near) },
            fogTime: { value: 0.0 },
            fade: { value: 1.0 },
            flow: { value: 0.0 },
          },
          vertexShader: voxel_shader.VOXEL.VS,
          fragmentShader: voxel_shader.VOXEL.PS,
          side: THREE.FrontSide
      });
      this.materialTransparent_ = this.materialOpaque_.clone();
      this.materialTransparent_.side = THREE.FrontSide;
      this.materialTransparent_.transparent = true;
      this.materialTransparent_.depthWrite = false;

      this.LoadTextures_();

      this.builder_ = new voxel_builder_threaded.VoxelBuilder_Threaded({
          scene: this.scene_,
          dimensions: this.cellDimensions_,
          materialOpaque: this.materialOpaque_,
          materialTransparent: this.materialTransparent_,
          blockTypes: this.blockTypes_,
          workers: this.params_.workers,
      });
    }

    LoadTextures_() {
      this.blockTypes_ = {};
      const textureSet = new Set();
      for (let k in texture_defs.DEFS) {
        const t = texture_defs.DEFS[k];
        this.blockTypes_[k] = { textures: [...t.texture], see: !!t.see };
        t.texture.forEach(name => textureSet.add(name));
      }

      const textureBlocks = [...textureSet];
      for (let k in this.blockTypes_) {
        for (let i = 0; i < 6; ++i) {
          this.blockTypes_[k].textures[i] = textureBlocks.indexOf(this.blockTypes_[k].textures[i]);
        }
      }

      const diffuse = new textures.TextureAtlas();
      diffuse.Load('diffuse', textureBlocks);
      const atlas = diffuse.Info['diffuse'].atlas;
      this.materialOpaque_.uniforms.diffuseMap.value = atlas;
      this.materialTransparent_.uniforms.diffuseMap.value = atlas;

      const noiseTexture = textures.noiseTexture();
      this.materialOpaque_.uniforms.noiseMap.value = noiseTexture;
      this.materialTransparent_.uniforms.noiseMap.value = noiseTexture;
    }

    Key_(x, y, z) {
      return x + '.' + y + '.' + z;
    }

    BlockIndex_(xp, zp) {
      const x = Math.floor(xp / this.cellDimensions_.x);
      const z = Math.floor(zp / this.cellDimensions_.z);
      return [x, z];
    }

    FindBlock_(xp, zp) {
      const [cx, cz] = this.BlockIndex_(xp, zp);
      const k = this.Key_(cx, 0, cz);
      if (k in this.blocks_) {
        return this.blocks_[k];
      }
      return null;
    }

    IsReadyAt(x, z) {
      const block = this.FindBlock_(x, z);
      return !!block && block.Ready;
    }

    GetAdjacentBlocks(xp, zp) {
      const blocks = [];
      for (let xi = -1; xi <= 1; ++xi) {
        for (let zi = -1; zi <= 1; ++zi) {
          if (xi == 0 && zi == 0) {
            continue;
          }
          const [cx, cz] = this.BlockIndex_(xp, zp);
          const k = this.Key_(cx + xi, 0, cz + zi);
          if (k in this.blocks_) {
            blocks.push(this.blocks_[k]);
          }
        }
      }
      return blocks;
    }

    InsertVoxelAt(pos, type, skippable) {
      const block = this.FindBlock_(pos[0], pos[2]);
      if (!block || !block.Ready) {
        return false;
      }
      block.InsertVoxelAt(pos, type, skippable);
      return true;
    }

    RemoveVoxelAt(pos) {
      const block = this.FindBlock_(pos[0], pos[2]);
      if (!block || !block.Ready) {
        return false;
      }
      block.RemoveVoxelAt(pos);
      return true;
    }

    // A child's own build or dig: change the world and remember it.
    PlaceVoxel(pos, type) {
      if (!this.InsertVoxelAt(pos, type, false)) return false;
      this.Remember_(pos, type);
      return true;
    }

    DigVoxel(pos) {
      if (!this.VoxelTypeAt(...pos) || !this.RemoveVoxelAt(pos)) return false;
      this.Remember_(pos, '');
      return true;
    }

    Remember_(pos, type) {
      const k = this.Key_(...pos);
      this.edits_.delete(k);
      this.edits_.set(k, type);
      this.onEdit(this.edits_);
    }

    get Edits() {
      return this.edits_;
    }

    // A chunk just came back from the worker with fresh terrain. Put the child's changes back.
    OnBlockBuilt_(block) {
      if (!this.edits_.size) return;
      const x0 = block.params_.offset.x;
      const z0 = block.params_.offset.z;
      const x1 = x0 + this.cellDimensions_.x;
      const z1 = z0 + this.cellDimensions_.z;
      this.replaying_ = true;
      for (const [k, type] of this.edits_) {
        const pos = k.split('.').map(Number);
        if (pos[0] < x0 || pos[0] >= x1 || pos[2] < z0 || pos[2] >= z1) continue;
        if (type) {
          block.InsertVoxelAt(pos, type, false);
        } else if (block.voxels_[k]) {
          if (block.voxels_[k].visible) block.RemoveVoxelAt(pos);
        } else {
          // Keep a dug spot empty, so a later dig nearby does not fill it back in.
          block.voxels_[k] = {position: pos, type: 'dirt', visible: false};
        }
      }
      this.replaying_ = false;
    }

    HasVoxelAt(x, y, z) {
      const block = this.FindBlock_(x, z);
      if (!block) {
        return false;
      }
      return block.HasVoxelAt(x, y, z);
    }

    VoxelTypeAt(x, y, z) {
      const block = this.FindBlock_(x, z);
      if (!block) return null;
      const v = block.voxels_[this.Key_(x, y, z)];
      return v && v.visible ? v.type : null;
    }

    IsSolidAt(x, y, z) {
      return texture_defs.solid(this.VoxelTypeAt(x, y, z));
    }

    // Highest solid block in a loaded column, or null.
    GroundAt(x, z, top = 160, bottom = -40) {
      const block = this.FindBlock_(x, z);
      if (!block || !block.Ready) return null;
      for (let y = top; y >= bottom; y--) {
        if (this.IsSolidAt(x, y, z)) return y;
      }
      return null;
    }

    FindVoxelsNear(pos, radius) {
      const [xn, zn] = this.BlockIndex_(pos.x - radius, pos.z - radius);
      const [xp, zp] = this.BlockIndex_(pos.x + radius, pos.z + radius);

      const voxels = [];
      for (let xi = xn; xi <= xp; xi++) {
        for (let zi = zn; zi <= zp; zi++) {
          const k = this.Key_(xi, 0, zi);
          if (k in this.blocks_) {
            const c = this.blocks_[k];
            voxels.push(...c.FindVoxelsNear(pos, radius));
          }
        }
      }

      return voxels;
    }

    FindIntersectionsWithRay(ray, maxDistance) {
      const voxels = this.FindVoxelsNear(ray.origin, maxDistance);
      const intersections = [];
      const box = new THREE.Box3();
      const _TMP_V = new THREE.Vector3();

      for (let i = 0; i < voxels.length; ++i) {
        const v = voxels[i];
        box.min.set(v.position[0] - 0.5, v.position[1] - 0.5, v.position[2] - 0.5);
        box.max.set(v.position[0] + 0.5, v.position[1] + 0.5, v.position[2] + 0.5);
        if (ray.intersectBox(box, _TMP_V)) {
          const distance = _TMP_V.distanceTo(ray.origin);
          if (distance > maxDistance) continue;
          intersections.push({
              voxel: v,
              aabb: box.clone(),
              intersectionPoint: _TMP_V.clone(),
              distance,
          });
        }
      }

      intersections.sort((a, b) => a.distance - b.distance);
      return intersections;
    }

    Update(timeElapsed) {
      this.builder_.Update(timeElapsed);
      if (!this.builder_.Busy) {
        this.UpdateTerrain_();
      }

      this.totalTime_ += timeElapsed;
      this.materialOpaque_.uniforms.fogTime.value = this.totalTime_ * 0.5;
      this.materialTransparent_.uniforms.fogTime.value = this.totalTime_ * 0.5;
      this.materialTransparent_.uniforms.flow.value = this.totalTime_ * 0.5;

      const threejs = this.FindEntity('renderer').GetComponent('ThreeJSController');
      const player = this.FindEntity('player');
      const under = player.Position.y < defs.OCEAN_LEVEL + 0.4 &&
          this.VoxelTypeAt(Math.round(player.Position.x), defs.OCEAN_LEVEL, Math.round(player.Position.z)) === 'ocean';
      const range = under ? defs.UNDERWATER_RANGE : this.fogRange_;
      const colour = under ? defs.UNDERWATER_COLOUR : defs.FOG_COLOUR;
      for (const m of [this.materialOpaque_, this.materialTransparent_]) {
        m.uniforms.fogRange.value.set(...range);
        m.uniforms.fogColour.value.copy(colour);
      }
      threejs.sky_.material.uniforms.bottomColor.value.copy(colour);
    }

    UpdateTerrain_() {
      const player = this.FindEntity('player');
      const cellIndex = this.BlockIndex_(player.Position.x, player.Position.z);

      const xs = this.visibleDimensions_[0];
      const zs = this.visibleDimensions_[1];
      let cells = {};

      for (let x = -xs; x <= xs; x++) {
        for (let z = -zs; z <= zs; z++) {
          // A round patch, not a square, so the fog edge is even all around.
          if (x * x + z * z > (xs + 0.5) * (xs + 0.5)) continue;
          const xi = x + cellIndex[0];
          const zi = z + cellIndex[1];

          const key = this.Key_(xi, 0, zi);
          cells[key] = [xi, zi];
        }
      }

      const intersection = utils.DictIntersection(this.blocks_, cells);
      const difference = utils.DictDifference(cells, this.blocks_);
      const recycle = Object.values(utils.DictDifference(this.blocks_, cells));

      this.builder_.ScheduleDestroy(recycle);

      cells = intersection;

      const sortedDifference = [];

      for (let k in difference) {
        const [xi, zi] = difference[k];
        const d = ((cellIndex[0] - xi) ** 2 + (cellIndex[1] - zi) ** 2) ** 0.5;
        sortedDifference.push([d, k, difference[k]]);
      }

      sortedDifference.sort((a, b) => a[0] - b[0]);

      for (let i = 0; i < sortedDifference.length; ++i) {
        const k = sortedDifference[i][1];
        const [xi, zi] = sortedDifference[i][2];
        const offset = new THREE.Vector3(
            xi * this.cellDimensions_.x, 0, zi * this.cellDimensions_.z);

        cells[k] = this.builder_.AllocateBlock({
            parent: this,
            offset: offset
        });
      }

      this.blocks_ = cells;
    }
  }


  return {
      SparseVoxelCellManager: SparseVoxelCellManager,
  };
})();
