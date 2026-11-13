// Forked from SimonDev's Quick_MinecraftClone2 (MIT). The intro, moon, and flat-world switches are gone.
// WORLD_SIZE is how many 16-block chunks load on each side of the player. game.js lowers it on small devices.
export const hack_defs = (() => {
  return {
    foliageEnabled: true,
    skipOceans: false,
    skipClouds: false,
    skipFoliageNoise: false,
    skipPruning: false,
    skipExteriorBlocks: false,
    skipAO: false,
    skipVariableLuminance: false,
    WORLD_BLOCK_SIZE: 16,
    WORLD_SIZE: 7
  };
})();
