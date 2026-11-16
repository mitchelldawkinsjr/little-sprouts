// Shared inventory for local serving and the deployed static build.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const DIRS = ['sidecars', 'vendor', 'lib', 'app', 'logic', 'games', 'icons', 'voice'];
const CORE = ['index.html', 'style.css', 'app.js', 'logic.mjs', 'sheet.csv', 'manifest.webmanifest'];
const SKIP = /(^|\/)\.|\.md$|LICENSE|(^|\/)NOTICE$|\.test\.|\.(?:map|gz)$/;

export function inventory(root) {
  const stamps = new Map();
  function files(names, skip, visit) {
    function walk(path) {
      const full = join(root, path);
      const name = relative(root, full).split(sep).join('/');
      if (skip.test(name) || !existsSync(full)) return;
      const info = statSync(full);
      if (info.isDirectory()) for (const child of readdirSync(full).sort()) walk(join(path, child));
      else if (info.isFile()) visit(name, full, info);
    }
    for (const name of names) walk(name);
  }
  return {
    offline() {
      const out = {};
      files([...DIRS, ...CORE], SKIP, (name, full, info) => {
        const key = `${info.mtimeMs}-${info.size}`;
        let known = stamps.get(name);
        if (known?.key !== key) {
          known = { key, value: `${createHash('sha1').update(readFileSync(full)).digest('hex').slice(0, 16)}-${info.size}` };
          stamps.set(name, known);
        }
        out[`./${name}`] = known.value;
      });
      return out;
    },
    sidecars() {
      const pages = [];
      // Derive built endpoints from the same registry as the shelf, including non-index entry pages.
      for (const spec of readFileSync(join(root, 'lib/sidecar.js'), 'utf8').matchAll(/\bsrc: '(sidecars\/[^'?]+\.html)(?:\?[^']*)?'/g)) {
        if (existsSync(join(root, spec[1]))) pages.push(spec[1]);
      }
      return pages.sort();
    },
    compress() {
      const stats = { files: 0, raw: 0, gzip: 0 };
      files([...DIRS, ...CORE, 'sw.js', 'offline-files.json', 'sidecars.json', 'for-parents'], SKIP, (name, full, info) => {
        if (info.size < 1024 || !/\.(?:js|mjs|css|html|json|csv|svg|wasm|gltf|webmanifest|bin|glb)$/i.test(name)) return;
        const zipped = gzipSync(readFileSync(full), { level: 6 });
        if (zipped.length > info.size * 0.9) return;
        writeFileSync(`${full}.gz`, zipped, { mode: 0o644 });
        stats.files++;
        stats.raw += info.size;
        stats.gzip += zipped.length;
      });
      return stats;
    }
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const root = resolve(process.argv[2] || '.');
  const build = inventory(root);
  writeFileSync(join(root, 'offline-files.json'), JSON.stringify(build.offline()));
  writeFileSync(join(root, 'sidecars.json'), JSON.stringify(build.sidecars()));
  console.log(JSON.stringify({ event: 'asset_precompression', ...build.compress() }));
}
