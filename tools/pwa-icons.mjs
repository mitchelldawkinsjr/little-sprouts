/** Draws the home-screen icons. Run: node tools/pwa-icons.mjs */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([len, name, data, sum]);
}

function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function icon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const put = (x, y, rgb) => {
    const i = (y * size + x) * 4;
    buf[i] = rgb[0];
    buf[i + 1] = rgb[1];
    buf[i + 2] = rgb[2];
    buf[i + 3] = 255;
  };
  const green = [50, 99, 78];
  const paper = [234, 240, 225];
  const petal = [119, 148, 81];
  const heart = [248, 206, 108];
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy + size * 0.02;
      const d = Math.hypot(dx, dy);
      let color = green;
      if (d <= size * 0.34) color = paper;
      const wave = 0.58 + 0.42 * Math.cos(Math.atan2(dy, dx) * 5);
      if (d < size * 0.2 * wave && d > size * 0.055) color = petal;
      if (d < size * 0.07) color = heart;
      put(x, y, color);
    }
  }
  return png(size, buf);
}

mkdirSync(out, { recursive: true });
for (const size of [180, 192, 512]) writeFileSync(join(out, `icon-${size}.png`), icon(size));
console.log('icons written');
