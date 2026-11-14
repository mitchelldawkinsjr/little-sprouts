import * as THREE from '../../../vendor/three/build/three.module.js?v=r187';
import {entity} from './entity.js?v=blocks5';
import {defs} from './defs.js?v=blocks5';
import {texture_defs} from './texture-defs.js?v=blocks5';

// Forked from SimonDev's Quick_MinecraftClone2 (MIT). The velocity, damping, and sphere-against-voxel
// collision come from the original. Changes for Little Sprouts:
// - No pointer lock. The page fills `input` from touch, mouse drag, keys, and the controller.
// - Slower walk and a lower jump, sized for small hands.
// - The player slides along walls and steps up one block without jumping.
// - Gravity waits until the ground under the player has loaded. Water lets you swim up.
export const player_controller = (() => {

  const _UP = new THREE.Vector3(0, 1, 0);
  const _BOX = new THREE.Box3();

  class PlayerController extends entity.Component {
    static CLASS_NAME = 'PlayerController';

    get NAME() {
      return PlayerController.CLASS_NAME;
    }

    constructor(params = {}) {
      super();
      this.params_ = params;
      // move: x right, z forward (-1..1). look: radians to add this frame. jump: true while held.
      this.input = { moveX: 0, moveZ: 0, lookX: 0, lookY: 0, jump: false, frozen: false, held: false };
      // Power-ups from the page: how much higher to jump and how much faster to walk (1 is normal).
      this.boost = { jump: 1, speed: 1 };
    }

    InitEntity() {
      this.radius_ = 0.4;
      this.eye_ = 1.6;
      this.standing = false;
      this.velocity_ = new THREE.Vector3(0, 0, 0);
      this.decceleration_ = new THREE.Vector3(-10, -9.8 * 3, -10);
      this.acceleration_ = new THREE.Vector3(70, 10.5, 70);
      this.yaw_ = this.params_.yaw || 0;
      this.pitch_ = this.params_.pitch || 0;
      this.waiting_ = true;

      const threejs = this.FindEntity('renderer').GetComponent('ThreeJSController');
      this.camera_ = threejs.camera_;
      this.camera_.position.copy(this.Parent.Position);
      this.ApplyLook_();
    }

    get Yaw() { return this.yaw_; }
    get Pitch() { return this.pitch_; }

    ApplyLook_() {
      this.camera_.rotation.set(this.pitch_, this.yaw_, 0, 'YXZ');
    }

    // The player's body is a stack of two spheres (feet and head) against unit voxel boxes.
    Hits_(boxes, eyePos) {
      const feet = new THREE.Sphere(new THREE.Vector3(eyePos.x, eyePos.y - this.eye_ + this.radius_, eyePos.z), this.radius_ * 0.95);
      const head = new THREE.Sphere(new THREE.Vector3(eyePos.x, eyePos.y - 0.2, eyePos.z), this.radius_ * 0.7);
      for (let i = 0; i < boxes.length; i++) {
        if (feet.intersectsBox(boxes[i]) || head.intersectsBox(boxes[i])) return true;
      }
      return false;
    }

    // Would a block at this spot overlap the player? The tools ask before placing one.
    Overlaps(x, y, z) {
      _BOX.min.set(x - 0.5, y - 0.5, z - 0.5);
      _BOX.max.set(x + 0.5, y + 0.5, z + 0.5);
      return this.Hits_([_BOX], this.camera_.position);
    }

    // An open door is one block wide and the body nearly fills it, so walking at it even a little
    // off the middle catches the frame. Heading into an open door, steer onto its middle line
    // instead of sliding along the wall. `step` is this frame's move on the ground, changed in place.
    GuideThroughDoor_(near, voxelManager, position, step) {
      const len = Math.hypot(step.x, step.z);
      if (len < 1e-5) return;
      const feetY = Math.round(position.y - this.eye_ + 0.5);
      let best = null;
      for (const v of near) {
        if (v.type !== 'door_open' || v.position[1] !== feetY) continue;
        const [x, , z] = v.position;
        // The way through runs between the door's side walls. A door with no walls takes either way.
        const wallsOnX = voxelManager.IsSolidAt(x - 1, feetY, z) || voxelManager.IsSolidAt(x + 1, feetY, z);
        const wallsOnZ = voxelManager.IsSolidAt(x, feetY, z - 1) || voxelManager.IsSolidAt(x, feetY, z + 1);
        let alongZ = wallsOnX && !wallsOnZ;
        if (wallsOnX === wallsOnZ) alongZ = Math.abs(step.z) >= Math.abs(step.x);
        const ahead = alongZ ? z - position.z : x - position.x;   // along the way through
        const side = alongZ ? x - position.x : z - position.z;    // off its middle line
        const go = alongZ ? step.z : step.x;
        // Moving mostly along the way through, toward the door or still inside it, and lined up with it.
        if (Math.abs(go) < len * 0.35 || Math.abs(side) > 0.95 || Math.abs(ahead) > 1.9) continue;
        if (go * ahead <= 0 && Math.abs(ahead) > 0.55) continue;
        const far = Math.hypot(ahead, side);
        if (!best || far < best.far) best = { alongZ, side, far };
      }
      if (!best) return;
      // Replace the sideways part of the move with a slide toward the middle line.
      const slide = Math.sign(best.side) * Math.min(Math.abs(best.side), len);
      if (best.alongZ) step.x = slide;
      else step.z = slide;
    }

    Teleport(pos) {
      this.camera_.position.copy(pos);
      this.ApplyLook_();
      this.velocity_.set(0, 0, 0);
      this.waiting_ = true;
      this.Parent.SetPosition(this.camera_.position);
    }

    Update(timeInSeconds) {
      const input = this.input;
      const position = this.camera_.position;
      const voxelManager = this.FindEntity('voxels').GetComponent('SparseVoxelCellManager');

      // Held by a night bug: the page moves the camera itself until it lets go.
      if (input.held) {
        input.lookX = 0;
        input.lookY = 0;
        this.velocity_.set(0, 0, 0);
        this.Parent.SetPosition(position);
        this.Parent.SetQuaternion(this.camera_.quaternion);
        return;
      }

      if (!input.frozen) {
        this.yaw_ -= input.lookX;
        this.pitch_ = Math.max(-1.45, Math.min(1.45, this.pitch_ - input.lookY));
      }
      input.lookX = 0;
      input.lookY = 0;
      this.ApplyLook_();

      // Hold still until the chunk under the player exists, then drop onto it.
      if (this.waiting_) {
        const x = Math.round(position.x);
        const z = Math.round(position.z);
        if (!voxelManager.IsReadyAt(x, z)) {
          this.Parent.SetPosition(position);
          this.Parent.SetQuaternion(this.camera_.quaternion);
          return;
        }
        const ground = voxelManager.GroundAt(x, z);
        if (ground != null && position.y < ground + 0.5 + this.eye_) position.y = ground + 0.5 + this.eye_ + 0.05;
        this.waiting_ = false;
      }

      const velocity = this.velocity_;
      const frameDecceleration = new THREE.Vector3(
          velocity.x * this.decceleration_.x,
          this.decceleration_.y,
          velocity.z * this.decceleration_.z
      );
      frameDecceleration.multiplyScalar(timeInSeconds);
      frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
          Math.abs(frameDecceleration.z), Math.abs(velocity.z));
      frameDecceleration.x = Math.sign(frameDecceleration.x) * Math.min(
          Math.abs(frameDecceleration.x), Math.abs(velocity.x));
      velocity.add(frameDecceleration);

      const inWater = position.y - this.eye_ < defs.OCEAN_LEVEL + 0.5 &&
          voxelManager.VoxelTypeAt(Math.round(position.x), defs.OCEAN_LEVEL, Math.round(position.z)) === 'ocean';
      velocity.y = Math.max(velocity.y, inWater ? -4 : -30);

      if (!input.frozen) {
        velocity.z -= this.acceleration_.z * this.boost.speed * input.moveZ * timeInSeconds;
        velocity.x += this.acceleration_.x * this.boost.speed * input.moveX * timeInSeconds;
        if (input.jump && (this.standing || inWater)) {
          velocity.y = inWater ? 5 : this.acceleration_.y * this.boost.jump;
          this.standing = false;
        }
      }

      const near = voxelManager.FindVoxelsNear(position, 3);
      const boxes = near
          .filter(v => texture_defs.solid(v.type))
          .map(v => new THREE.Box3(
              new THREE.Vector3(v.position[0] - 0.5, v.position[1] - 0.5, v.position[2] - 0.5),
              new THREE.Vector3(v.position[0] + 0.5, v.position[1] + 0.5, v.position[2] + 0.5)));

      // Walk relative to where the camera faces, flat on the ground.
      const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(_UP, this.yaw_);
      const sideways = new THREE.Vector3(1, 0, 0).applyAxisAngle(_UP, this.yaw_);
      const step = forward.multiplyScalar(velocity.z * timeInSeconds)
          .add(sideways.multiplyScalar(velocity.x * timeInSeconds));
      this.GuideThroughDoor_(near, voxelManager, position, step);

      const alreadyIntersecting = this.Hits_(boxes, position);
      const tryMove = (dx, dz, lift = 0) => {
        const next = position.clone().add(new THREE.Vector3(dx, lift, dz));
        if (alreadyIntersecting || !this.Hits_(boxes, next)) {
          position.copy(next);
          return true;
        }
        return false;
      };
      if (step.x || step.z) {
        const moved = tryMove(step.x, step.z) || tryMove(step.x, 0) || tryMove(0, step.z);
        // A one-block ledge: step up onto it instead of stopping.
        if (!moved && this.standing) {
          if (tryMove(step.x, step.z, 1.05) || tryMove(step.x, 0, 1.05) || tryMove(0, step.z, 1.05)) {
            this.Parent.Broadcast({topic: 'player.stepped'});
          }
        }
      }

      // Vertical motion in small steps, as in the original.
      const oldPosition = position.clone();
      const _STEP_SIZE = 0.01;
      let timeAcc = 0;
      this.standing = false;
      while (timeAcc < timeInSeconds) {
        const dt = Math.min(_STEP_SIZE, timeInSeconds - timeAcc);
        position.y += velocity.y * dt;
        if (this.Hits_(boxes, position)) {
          position.copy(oldPosition);
          if (velocity.y <= 0) this.standing = true;
          velocity.y = 0;
          break;
        }
        oldPosition.copy(position);
        timeAcc += dt;
      }

      // Fell out of the world: back on top of the ground here.
      if (position.y < -60) {
        const ground = voxelManager.GroundAt(Math.round(position.x), Math.round(position.z));
        position.y = (ground != null ? ground : 40) + 0.5 + this.eye_ + 1;
        velocity.set(0, 0, 0);
      }

      this.Parent.SetPosition(position);
      this.Parent.SetQuaternion(this.camera_.quaternion);
    }
  };

  return {
      PlayerController: PlayerController,
  };
})();
