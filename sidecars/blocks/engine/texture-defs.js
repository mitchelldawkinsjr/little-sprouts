// Forked from SimonDev's Quick_MinecraftClone2 (MIT). The block list is Little Sprouts' own,
// and every face is painted in code (textures.js), so no image files ship with the game.
export const texture_defs = (() => {
  const all = name => [name, name, name, name, name, name];

  // Face order: +x, -x, +y (top), -y (bottom), +z, -z.
  const DEFS = {
    ocean: { texture: all('water'), label: 'water' },
    dirt: { texture: all('dirt'), label: 'dirt' },
    sand: { texture: all('sand'), label: 'sand' },
    stone: { texture: all('stone'), label: 'stone' },
    tree_bark: { texture: ['bark', 'bark', 'rings', 'rings', 'bark', 'bark'], label: 'wood' },
    tree_leaves: { texture: all('leaves'), label: 'leaves' },
    snow: { texture: ['snow-side', 'snow-side', 'snow', 'dirt', 'snow-side', 'snow-side'], label: 'snow' },
    grass: { texture: ['grass-side', 'grass-side', 'grass', 'dirt', 'grass-side', 'grass-side'], label: 'grass' },
    red: { texture: all('toy-red'), label: 'red', color: '#dc6253' },
    orange: { texture: all('toy-orange'), label: 'orange', color: '#e99d4d' },
    yellow: { texture: all('toy-yellow'), label: 'yellow', color: '#f5d400' },
    green: { texture: all('toy-green'), label: 'green', color: '#76a265' },
    blue: { texture: all('toy-blue'), label: 'blue', color: '#538cbf' },
    purple: { texture: all('toy-purple'), label: 'purple', color: '#a381c0' },
    pink: { texture: all('toy-pink'), label: 'pink', color: '#e5a2bd' },
    white: { texture: all('toy-white'), label: 'white', color: '#f4f1ea' },
    brick: { texture: all('brick'), label: 'brick' },
    flower: { texture: ['flower-side', 'flower-side', 'flower', 'dirt', 'flower-side', 'flower-side'], label: 'flowers' },
    planks: { texture: all('planks'), label: 'planks' },
    roof: { texture: all('roof'), label: 'roof' },
    // See-through blocks: their clear pixels are cut out, and blocks behind them still draw.
    window: { texture: all('window'), label: 'window', see: true },
    // A door is two blocks tall. Tapping it opens it, and an open door can be walked through.
    door: { texture: ['door-low', 'door-low', 'planks', 'planks', 'door-low', 'door-low'], label: 'door', icon: 'door-low', place: 'door' },
    door_top: { texture: ['door-high', 'door-high', 'planks', 'planks', 'door-high', 'door-high'], label: 'door', hidden: true },
    door_open: { texture: ['frame-low', 'frame-low', 'clear', 'clear', 'frame-low', 'frame-low'], label: 'door', see: true, passable: true, hidden: true },
    door_open_top: { texture: ['frame-high', 'frame-high', 'clear', 'clear', 'frame-high', 'frame-high'], label: 'door', see: true, passable: true, hidden: true }
  };

  // Open and shut: each door half and the one it turns into.
  const DOOR_SWAP = { door: 'door_open', door_top: 'door_open_top', door_open: 'door', door_open_top: 'door_top' };
  const isDoor = type => type in DOOR_SWAP;
  const isDoorTop = type => type === 'door_top' || type === 'door_open_top';

  // Can the player stand on it or bump into it?
  const solid = type => !!type && type !== 'ocean' && !(DEFS[type] && DEFS[type].passable);

  // Blocks you can build with from the start, then the ones a right answer unlocks, in order.
  const STARTER = ['grass', 'dirt', 'stone', 'sand', 'tree_bark', 'tree_leaves', 'planks', 'window', 'door'];
  const REWARDS = ['red', 'yellow', 'roof', 'blue', 'green', 'purple', 'orange', 'pink', 'white', 'brick', 'flower', 'snow'];

  return { DEFS, STARTER, REWARDS, DOOR_SWAP, isDoor, isDoorTop, solid };
})();
