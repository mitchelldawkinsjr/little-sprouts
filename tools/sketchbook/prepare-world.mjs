// Retain the upstream geometry, physics nodes, and scenarios. Replace the optional
// map textures with a local material palette, then compact unused image bytes.
import { readFileSync, writeFileSync } from 'node:fs';

const palette = {
  concrete: [0.68,0.70,0.64], wall_segmented: [0.78,0.65,0.51], wall_rough: [0.6,0.63,0.52],
  race_track: [0.23,0.29,0.31], roof: [0.52,0.29,0.27], plaster: [0.84,0.77,0.58],
  dirt_road: [0.48,0.36,0.24], runway: [0.35,0.41,0.43], s1: [0.66,0.68,0.54],
  s2: [0.62,0.67,0.57], s3: [0.75,0.68,0.52], s4: [0.61,0.67,0.54],
  s5: [0.72,0.68,0.56], s6: [0.62,0.68,0.57], side_barrier: [0.86,0.52,0.28],
  helipad: [0.37,0.48,0.44], arrow_down: [0.94,0.58,0.23], barrier: [0.73,0.57,0.32]
};
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node prepare-world.mjs upstream.glb destination.glb');
const bytes = readFileSync(input);
if (bytes.toString('ascii', 0, 4) !== 'glTF' || bytes.readUInt32LE(4) !== 2) throw new Error('Expected glTF 2.0 binary');
const jsonSize = bytes.readUInt32LE(12);
const data = JSON.parse(bytes.toString('utf8', 20, 20 + jsonSize));
const bin = bytes.subarray(28 + jsonSize);
if (data.buffers.length !== 1 || data.buffers[0].uri) throw new Error('Expected one embedded buffer');
const imageViews = new Set((data.images || []).map(image => image.bufferView));
const remaining = [];
const views = new Map();
let length = 0;
const newViews = [];
for (const [index, view] of data.bufferViews.entries()) {
  if (imageViews.has(index)) continue;
  const src = view.byteOffset || 0;
  const pad = (4 - length % 4) % 4;
  remaining.push(Buffer.alloc(pad), bin.subarray(src, src + view.byteLength));
  length += pad;
  views.set(index, newViews.length);
  newViews.push({ ...view, byteOffset: length });
  length += view.byteLength;
}
const remap = index => {
  if (!views.has(index)) throw new Error('An accessor references a removed image buffer');
  return views.get(index);
};
for (const accessor of data.accessors) {
  if (accessor.bufferView !== undefined) accessor.bufferView = remap(accessor.bufferView);
  if (accessor.sparse) {
    accessor.sparse.indices.bufferView = remap(accessor.sparse.indices.bufferView);
    accessor.sparse.values.bufferView = remap(accessor.sparse.values.bufferView);
  }
}
data.materials = data.materials.map(material => ({
  name: material.name,
  ...(material.doubleSided ? { doubleSided: true } : {}),
  pbrMetallicRoughness: {
    baseColorFactor: palette[material.name] ? [...palette[material.name], 1] : material.pbrMetallicRoughness?.baseColorFactor || [0.65,0.68,0.54,1],
    roughnessFactor: 0.9, metallicFactor: 0
  }
}));
delete data.images;
delete data.textures;
delete data.samplers;
delete data.extensionsUsed;
delete data.extensionsRequired;
data.bufferViews = newViews;
data.buffers[0].byteLength = length;
const newBin = Buffer.concat([...remaining, Buffer.alloc((4 - length % 4) % 4)]);
const json = Buffer.from(JSON.stringify(data));
const padded = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
const header = Buffer.alloc(20);
header.write('glTF', 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + padded.length + newBin.length, 8);
header.writeUInt32LE(padded.length, 12);
header.write('JSON', 16);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(newBin.length, 0);
binHeader.write('BIN\0', 4, 'ascii');
const out = Buffer.concat([header, padded, binHeader, newBin]);
if (out.length > 20_000_000) throw new Error('World exceeds the offline cache limit');
writeFileSync(output, out);
