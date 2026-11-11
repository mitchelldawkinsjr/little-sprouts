/** Default field of view (degrees) */
export const DEFAULT_FOV = 70;

/** Default near plane */
export const DEFAULT_NEAR = 1;

// --- Chase camera ---

/** Boom distance behind aircraft */
export const BOOM_DISTANCE = 30;

/** Boom height above aircraft */
export const BOOM_HEIGHT = 8;

/** Spring stiffness for yaw following */
export const STIFFNESS_YAW = 8;

/** Spring stiffness for pitch following */
export const STIFFNESS_PITCH = 6;

/** How much of the aircraft yaw to follow (1.0 = full) */
export const FOLLOW_YAW = 1.0;

// --- FPS controller ---

/** Maximum bank roll during turns */
export const MAX_ROLL = 0.5;

/** Yaw-rate to roll multiplier */
export const ROLL_SENSITIVITY = 25;

/** Roll interpolation speed */
export const ROLL_DAMP_SPEED = 5;
