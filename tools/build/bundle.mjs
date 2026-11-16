// Production bundle only. Source mode keeps working with node server/serve.mjs.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { build, transform } from 'esbuild';

const root = resolve(process.argv[2] || '.');
const target = ['safari15', 'chrome90', 'firefox90'];
const result = await build({
  absWorkingDir: root,
  entryPoints: ['app.js'],
  bundle: true,
  minify: true,
  outfile: 'app.js',
  allowOverwrite: true,
  format: 'esm',
  target,
  keepNames: true,
  write: false,
  logLevel: 'warning',
  legalComments: 'inline',
  plugins: [{
    name: 'local-module-versions',
    setup(api) {
      // Strip development query strings when bundling so one source does not become two instances.
      api.onResolve({ filter: /^\.{1,2}\// }, args => {
        const clean = args.path.split('?')[0];
        if (clean.endsWith('/camera.js')) return { path: '/lib/camera.js', external: true };
        return { path: resolve(args.resolveDir, clean) };
      });
    }
  }]
});
const css = await readFile(resolve(root, 'style.css'), 'utf8');
const minified = (await transform(css, { loader: 'css', minify: true, target, legalComments: 'inline' })).code;
const js = result.outputFiles[0].contents;
// The proxy in front of the site keeps a .js or .css file by its full address. Tag both with a
// hash of what was built, so every change reaches families at once with no tag to bump by hand.
const tag = bytes => createHash('sha1').update(bytes).digest('hex').slice(0, 10);
const page = (await readFile(resolve(root, 'index.html'), 'utf8'))
  .replace(/(src="app\.js)(?:\?v=[^"]*)?"/, `$1?v=${tag(js)}"`)
  .replace(/(href="style\.css)(?:\?v=[^"]*)?"/, `$1?v=${tag(minified)}"`);
await Promise.all([
  writeFile(resolve(root, 'app.js'), js),
  writeFile(resolve(root, 'style.css'), minified),
  writeFile(resolve(root, 'index.html'), page)
]);
console.log(JSON.stringify({ event: 'app_bundle', javascript_bytes: js.length, css_bytes: Buffer.byteLength(minified) }));
