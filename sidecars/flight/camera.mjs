/**
 * Chase camera for Sky flight. Boom behind the craft with sprung yaw and pitch.
 * Little Sprouts original.
 */
import * as THREE from 'three';

export const DEFAULT_FOV = 68;
export const DEFAULT_NEAR = 1;
export const MAX_ROLL = 0.42;
export const ROLL_SENSITIVITY = 18;
export const ROLL_DAMP_SPEED = 4.2;

const BOOM_BACK = 26;
const BOOM_UP = 9;
const YAW_STIFF = 7;
const PITCH_STIFF = 5.5;

function springStep(state, target, stiff, wrap, dt) {
  let delta = target - state.value;
  if (wrap) {
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
  }
  const damp = 2 * Math.sqrt(stiff);
  state.velocity += (delta * stiff - state.velocity * damp) * dt;
  state.value += state.velocity * dt;
  if (wrap) {
    while (state.value > Math.PI) state.value -= Math.PI * 2;
    while (state.value < -Math.PI) state.value += Math.PI * 2;
  }
}

export function createChaseCamera() {
  const yaw = { value: 0, velocity: 0 };
  const pitch = { value: 0, velocity: 0 };
  let primed = false;
  const offset = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');

  return {
    reset() {
      primed = false;
    },
    update(craft, camera, dt) {
      if (!primed) {
        yaw.value = craft.yaw;
        yaw.velocity = 0;
        pitch.value = craft.pitch;
        pitch.velocity = 0;
        primed = true;
      }
      springStep(yaw, craft.yaw, YAW_STIFF, true, dt);
      springStep(pitch, craft.pitch, PITCH_STIFF, false, dt);
      euler.set(pitch.value, yaw.value, 0, 'YXZ');
      quat.setFromEuler(euler);
      offset.set(0, BOOM_UP, BOOM_BACK).applyQuaternion(quat);
      camera.position.copy(craft.position).add(offset);
      camera.quaternion.copy(quat);
    }
  };
}
