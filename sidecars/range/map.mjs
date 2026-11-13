/* The walk-mode plaza. Plain data so the sim, the renderer, and the tests agree.
   x is right, z is toward the viewer at spawn, angles follow the sim (yaw 0 looks toward -z).
   Props are Quaternius' Ultimate Platformer Pack pieces (CC0), in kit/. */

export const YARD = 26;
export const SPAWN = { x: 0, z: 17, yaw: 0 };
export const KIT_SCALE = 1.6;

// Blocky shops. hw and hd are half sizes; the sim treats them as walls.
export const BUILDINGS = [
  { x: -16, z: -14, hw: 4, hd: 3.5, h: 4.5, color: 0xe8a87c, roof: 0xb8704a },
  { x: 16, z: -14, hw: 4, hd: 3.5, h: 5.5, color: 0x7fb8d8, roof: 0x4d7fa0 },
  { x: -17, z: 13, hw: 3.5, hd: 4, h: 4, color: 0xa8d08d, roof: 0x6f9a55 },
  { x: 17, z: 13, hw: 3.5, hd: 4, h: 5, color: 0xd8b4e2, roof: 0x9b78a8 }
];

// The planter in the middle of the plaza.
export const PLANTER = { x: 0, z: -3, r: 2.2 };

// kind is the kit file name. r is a blocking radius on the ground; 0 walks through.
export const PROPS = [
  { kind: 'Light_Street_1', x: -8, z: -8, rot: 0.8, r: 0.3 },
  { kind: 'Light_Street_1', x: 8, z: -8, rot: -0.8, r: 0.3 },
  { kind: 'Light_Street_1', x: -8, z: 8, rot: 2.4, r: 0.3 },
  { kind: 'Light_Street_1', x: 8, z: 8, rot: -2.4, r: 0.3 },
  { kind: 'Light_Street_2', x: 0, z: -21, rot: 0, r: 0.5 },
  { kind: 'Light_Street_2', x: -22, z: -6, rot: Math.PI / 2, r: 0.5 },
  { kind: 'Light_Street_2', x: 22, z: -6, rot: -Math.PI / 2, r: 0.5 },
  { kind: 'Lootbox', x: -6, z: -12, rot: 0.3, r: 0.6 },
  { kind: 'Lootbox', x: -4.9, z: -12.7, rot: -0.4, r: 0.6 },
  { kind: 'Lootbox', x: 9, z: 4, rot: 1.2, r: 0.6 },
  { kind: 'Lootbox', x: 9.8, z: 5.1, rot: 0.2, r: 0.6 },
  { kind: 'Lootbox', x: -11, z: 5, rot: 2.1, r: 0.6 },
  { kind: 'Tank', x: 12, z: -4, rot: 0, r: 0.6 },
  { kind: 'Tank', x: 13, z: -4.8, rot: 1.4, r: 0.6 },
  { kind: 'Tank', x: -21, z: 22, rot: 0.6, r: 0.6 },
  { kind: 'Computer', x: -3.5, z: 8, rot: 2.8, r: 0.5 },
  { kind: 'Computer', x: 5, z: -10, rot: -0.6, r: 0.5 },
  { kind: 'Computer', x: 21, z: 21, rot: -2.4, r: 0.5 },
  { kind: 'Support_Long', x: -3.2, z: -24.6, rot: 0, r: 0.3, y: 2.85 },
  { kind: 'Support_Long', x: 3.2, z: -24.6, rot: Math.PI, r: 0.3, y: 2.85 },
  { kind: 'Platform_2x1_Empty', x: 0, z: 9, rot: 0, r: 0, y: 0.16 },
  { kind: 'Platform_2x1_Empty', x: -14, z: -2, rot: Math.PI / 2, r: 0, y: 0.16 },
  { kind: 'Platform_2x1_Empty', x: 14, z: 2, rot: Math.PI / 2, r: 0, y: 0.16 },
  { kind: 'Pipe_1', x: -16, z: -10.3, rot: 0, r: 0, y: 0.5 },
  { kind: 'Pipe_1', x: 16, z: -10.3, rot: 0, r: 0, y: 0.6 },
  { kind: 'Pipe_Corner', x: -13.2, z: 9.2, rot: 0, r: 0, y: 3.4 },
  { kind: 'Door', x: -16, z: -10.45, rot: 0, r: 0 },
  { kind: 'Door', x: 16, z: -10.45, rot: 0, r: 0 },
  { kind: 'Door', x: -17, z: 8.95, rot: Math.PI, r: 0 },
  { kind: 'Door', x: 17, z: 8.95, rot: Math.PI, r: 0 },
  { kind: 'AC', x: -13.3, z: -15, rot: Math.PI / 2, r: 0, y: 2.6 },
  { kind: 'AC_Side', x: 12, z: -13, rot: -Math.PI / 2, r: 0, y: 3 },
  { kind: 'AC', x: 13.3, z: 15, rot: -Math.PI / 2, r: 0, y: 2.4 },
  { kind: 'Antenna_2', x: -16, z: -14, rot: 0.4, r: 0, y: 5.1 },
  { kind: 'Antenna_2', x: 17, z: 13, rot: 2, r: 0, y: 5.6 },
  { kind: 'Rail_Long', x: 0, z: 0.4, rot: 0, r: 0 },
  { kind: 'Rail_Long', x: 0, z: -6.4, rot: 0, r: 0 }
];

// Board spots across the open plaza. Each faces the middle; boards read from both sides anyway.
export const SLOTS = [
  [-10, -4], [10, -10], [-4, -18], [6, -18], [-21, 1], [21, 1], [-11, 19], [11, 19],
  [0, -11], [-9, 13], [9, 13], [-21, -22], [21, -22], [5, 3], [-14, -4], [15, 5],
  [-5, -24], [13, -22]
].map(([x, z]) => ({ x, z, face: Math.atan2(-x, -z) }));

// Gears to pick up just by walking through them. They are only for fun.
export const GEARS = [
  [-6, 2], [6, -4], [0, -15], [-18, -4], [18, -2], [-12, 22], [12, 22], [-22, -18],
  [22, -18], [0, 22], [-8, -21], [8, 16]
].map(([x, z]) => ({ x, z }));
