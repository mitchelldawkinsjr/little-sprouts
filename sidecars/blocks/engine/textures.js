import * as THREE from '../../../vendor/three/build/three.module.js?v=r187';

// Forked from SimonDev's Quick_MinecraftClone2 (MIT). The original loaded 16×16 PNGs into a
// texture array. Here every tile is painted in code: Little Sprouts' own pixel art, and nothing
// to download, so the world works offline from the first visit.
export const textures = (() => {
  const SIZE = 16;

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  function hex(value) {
    const n = parseInt(value.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function hashName(name) {
    let h = 2166136261;
    for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  function tile(name) {
    const data = new Uint8Array(SIZE * SIZE * 4);
    const rand = rng(hashName(name));
    const put = (x, y, rgb, jitter = 0, alpha = 255) => {
      const j = jitter ? (rand() - 0.5) * jitter : 0;
      const i = (y * SIZE + x) * 4;
      data[i] = Math.max(0, Math.min(255, rgb[0] + j));
      data[i + 1] = Math.max(0, Math.min(255, rgb[1] + j));
      data[i + 2] = Math.max(0, Math.min(255, rgb[2] + j));
      data[i + 3] = alpha;
    };
    const fill = (rgb, jitter) => {
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) put(x, y, rgb, jitter);
    };
    const speckle = (rgb, chance) => {
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (rand() < chance) put(x, y, rgb, 18);
    };

    const toy = name.startsWith('toy-');
    if (toy) {
      const colour = hex(texture_colors[name]);
      fill(colour, 10);
      // A soft bevel and a stud in the middle make it read as a toy block.
      const light = colour.map(c => Math.min(255, c + 46));
      const dark = colour.map(c => Math.max(0, c - 52));
      for (let i = 0; i < SIZE; i++) {
        put(i, 0, light); put(0, i, light);
        put(i, SIZE - 1, dark); put(SIZE - 1, i, dark);
      }
      for (let y = 5; y <= 10; y++) for (let x = 5; x <= 10; x++) {
        const edge = x === 5 || y === 5 ? light : x === 10 || y === 10 ? dark : colour;
        put(x, y, edge, 6);
      }
      return data;
    }

    switch (name) {
      case 'grass':
        fill(hex('#6fae4f'), 26);
        speckle(hex('#8cc864'), 0.12);
        speckle(hex('#4f8f3a'), 0.08);
        break;
      case 'dirt':
        fill(hex('#8a5f3c'), 24);
        speckle(hex('#6e4a2c'), 0.14);
        speckle(hex('#a77b52'), 0.08);
        break;
      case 'grass-side': {
        fill(hex('#8a5f3c'), 24);
        speckle(hex('#6e4a2c'), 0.12);
        for (let x = 0; x < SIZE; x++) {
          const drip = 3 + Math.floor(rand() * 3);
          for (let y = 0; y < drip; y++) put(x, y, hex('#6fae4f'), 24);
        }
        break;
      }
      case 'flower':
        fill(hex('#6fae4f'), 24);
        for (let n = 0; n < 6; n++) {
          const x = 1 + Math.floor(rand() * 13);
          const y = 1 + Math.floor(rand() * 13);
          const petal = hex(['#f5d400', '#e5a2bd', '#ffffff', '#dc6253', '#a381c0'][n % 5]);
          put(x, y, hex('#f6c343'));
          put(x + 1, y, petal); put(x - 1, y, petal); put(x, y + 1, petal); put(x, y - 1, petal);
        }
        break;
      case 'flower-side':
        fill(hex('#8a5f3c'), 24);
        for (let x = 0; x < SIZE; x++) {
          const drip = 3 + Math.floor(rand() * 3);
          for (let y = 0; y < drip; y++) put(x, y, hex('#6fae4f'), 24);
          if (rand() < 0.3) put(x, 0, hex(['#f5d400', '#e5a2bd', '#ffffff'][x % 3]));
        }
        break;
      case 'sand':
        fill(hex('#e8d49a'), 18);
        speckle(hex('#d4bd7e'), 0.16);
        speckle(hex('#f4e6b8'), 0.08);
        break;
      case 'stone':
        fill(hex('#9a9c9a'), 20);
        speckle(hex('#7f817f'), 0.16);
        for (let n = 0; n < 3; n++) {
          let x = Math.floor(rand() * SIZE);
          let y = Math.floor(rand() * SIZE);
          for (let s = 0; s < 5; s++) {
            put(x, y, hex('#6f716f'));
            x = (x + (rand() < 0.5 ? 1 : 0)) % SIZE;
            y = (y + 1) % SIZE;
          }
        }
        break;
      case 'bark':
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
          const stripe = (x % 4 === 0 || (x + (y >> 2)) % 7 === 0) ? hex('#5e3f24') : hex('#7a5532');
          put(x, y, stripe, 16);
        }
        break;
      case 'rings':
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
          const r = Math.round(Math.hypot(x - 7.5, y - 7.5));
          const c = r >= 7 ? hex('#5e3f24') : r % 2 ? hex('#c49a64') : hex('#a97d4a');
          put(x, y, c, 10);
        }
        break;
      case 'leaves':
        fill(hex('#4c8f3c'), 30);
        speckle(hex('#3a7330'), 0.2);
        speckle(hex('#6cb052'), 0.14);
        break;
      case 'snow':
        fill(hex('#f4f7fa'), 8);
        speckle(hex('#dfe8f0'), 0.12);
        break;
      case 'snow-side':
        fill(hex('#8a5f3c'), 24);
        for (let x = 0; x < SIZE; x++) {
          const drip = 4 + Math.floor(rand() * 3);
          for (let y = 0; y < drip; y++) put(x, y, hex('#f4f7fa'), 8);
        }
        break;
      case 'water':
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
          const wave = Math.sin((x + y * 0.5) * 0.9) > 0.6 ? hex('#7fc4ea') : hex('#4f9fd6');
          put(x, y, wave, 10, 200);
        }
        break;
      case 'brick':
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
          const row = y >> 2;
          const mortar = y % 4 === 3 || (x + (row % 2) * 4) % 8 === 7;
          put(x, y, mortar ? hex('#e6dccb') : hex('#b5543c'), mortar ? 6 : 22);
        }
        break;
      case 'planks':
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
          const seam = y % 4 === 3 || (x + (y >> 2) * 5) % 16 === 0;
          put(x, y, seam ? hex('#8a5c34') : hex('#c4915a'), seam ? 8 : 16);
        }
        break;
      case 'roof':
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
          const row = y >> 2;
          const lx = (x + (row % 2) * 2) % 4;
          const edge = y % 4 === 3 || (y % 4 === 2 && (lx === 0 || lx === 3));
          put(x, y, edge ? hex('#7e3324') : hex('#b9503a'), edge ? 6 : 18);
        }
        break;
      case 'window':
      case 'clear':
      case 'frame-low':
      case 'frame-high': {
        // Clear pixels have alpha 0 and are cut out by the voxel shader.
        for (let i = 0; i < data.length; i++) data[i] = 0;
        const wood = hex('#f4f1ea');
        const post = hex('#8a5c34');
        if (name === 'window') {
          for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
            const frame = x < 2 || y < 2 || x > 13 || y > 13 || x === 7 || x === 8 || y === 7 || y === 8;
            if (frame) put(x, y, wood, 8);
          }
          // A little shine on the glass.
          for (const [x, y] of [[3, 5], [4, 4], [5, 3], [10, 12], [11, 11], [12, 10]]) put(x, y, hex('#e4f3fb'));
        } else if (name !== 'clear') {
          for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
            if (x < 2 || x > 13 || (name === 'frame-high' && y < 2)) put(x, y, post, 12);
          }
        }
        break;
      }
      case 'door-low':
      case 'door-high': {
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
          const seam = x % 5 === 0;
          put(x, y, seam ? hex('#8a5c34') : hex('#b5763f'), seam ? 6 : 14);
        }
        for (let i = 0; i < SIZE; i++) {
          put(0, i, hex('#6b4426')); put(SIZE - 1, i, hex('#6b4426'));
        }
        if (name === 'door-low') {
          for (let i = 0; i < SIZE; i++) put(i, SIZE - 1, hex('#6b4426'));
          put(12, 4, hex('#f2cf2e')); put(12, 5, hex('#f2cf2e')); put(11, 4, hex('#c9a227'));
        } else {
          for (let i = 0; i < SIZE; i++) put(i, 0, hex('#6b4426'));
          // A small window in the top half of the door.
          for (let y = 4; y <= 10; y++) for (let x = 4; x <= 11; x++) {
            const bar = x === 4 || x === 11 || y === 4 || y === 10 || x === 7 || x === 8;
            put(x, y, bar ? hex('#6b4426') : hex('#9fd3ef'), bar ? 0 : 10);
          }
        }
        break;
      }
      default:
        fill(hex('#ff00ff'), 0);
    }
    return data;
  }

  const texture_colors = {
    'toy-red': '#dc6253',
    'toy-orange': '#e99d4d',
    'toy-yellow': '#f2cf2e',
    'toy-green': '#76a265',
    'toy-blue': '#538cbf',
    'toy-purple': '#a381c0',
    'toy-pink': '#e5a2bd',
    'toy-white': '#f4f1ea'
  };

  class TextureAtlas {
    constructor() {
      this.onLoad = () => {};
      this.textures_ = {};
    }

    get Info() {
      return this.textures_;
    }

    // names: tile names. Built at once; onLoad still fires for code written against the loader.
    Load(atlas, names) {
      const data = new Uint8Array(names.length * 4 * SIZE * SIZE);
      names.forEach((name, i) => data.set(tile(name), i * 4 * SIZE * SIZE));
      const diffuse = new THREE.DataArrayTexture(data, SIZE, SIZE, names.length);
      diffuse.format = THREE.RGBAFormat;
      diffuse.type = THREE.UnsignedByteType;
      diffuse.minFilter = THREE.NearestMipmapLinearFilter;
      diffuse.magFilter = THREE.NearestFilter;
      diffuse.wrapS = THREE.ClampToEdgeWrapping;
      diffuse.wrapT = THREE.ClampToEdgeWrapping;
      diffuse.generateMipmaps = true;
      diffuse.needsUpdate = true;
      this.textures_[atlas] = { names, atlas: diffuse };
      queueMicrotask(() => this.onLoad());
    }
  }

  // A small tile as a data URL, for the block buttons on screen.
  function swatch(name, scale = 3) {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(SIZE, SIZE);
    img.data.set(tile(name));
    ctx.putImageData(img, 0, 0);
    const out = document.createElement('canvas');
    out.width = SIZE * scale;
    out.height = SIZE * scale;
    const big = out.getContext('2d');
    // See-through tiles (a window) sit on a little patch of sky so the button is not empty.
    big.fillStyle = '#bfe3f5';
    big.fillRect(0, 0, out.width, out.height);
    big.imageSmoothingEnabled = false;
    big.drawImage(canvas, 0, 0, out.width, out.height);
    return out.toDataURL();
  }

  // Soft tiling noise that replaces the original simplex-noise.png overlay.
  function noiseTexture() {
    const N = 64;
    const data = new Uint8Array(N * N * 4);
    const rand = rng(1234);
    const grid = new Float32Array(8 * 8).map(() => rand());
    const at = (x, y) => grid[(y & 7) * 8 + (x & 7)];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const gx = x / 8; const gy = y / 8;
      const x0 = Math.floor(gx); const y0 = Math.floor(gy);
      const fx = gx - x0; const fy = gy - y0;
      const sx = fx * fx * (3 - 2 * fx); const sy = fy * fy * (3 - 2 * fy);
      const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
      const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
      const v = Math.round((top + (bottom - top) * sy) * 200 + rand() * 55);
      const i = (y * N + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, N, N);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }

  return { TextureAtlas, swatch, noiseTexture, tile, SIZE };
})();
