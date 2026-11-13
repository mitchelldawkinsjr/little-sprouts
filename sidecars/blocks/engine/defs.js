import * as THREE from '../../../vendor/three/build/three.module.js';

// Forked from SimonDev's Quick_MinecraftClone2 (MIT). Colours are Little Sprouts' soft daytime sky.
// THREE.Color already turns these hex values into linear colour, so no extra conversion here.
export const defs = (() => {
  return {
      FOG_RANGE: [70, 110],
      UNDERWATER_RANGE: [0, 24],
      FOG_COLOUR: new THREE.Color(0xd4e8f4),
      UNDERWATER_COLOUR: new THREE.Color(0x3a7fc0),
      SKY_COLOUR: new THREE.Color(0x7cc0ee),
      OCEAN_LEVEL: 6,
  };
})();
