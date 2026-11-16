// Production bundle only. Source mode keeps working with node server/serve.mjs.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
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
await Promise.all([
  writeFile(resolve(root, 'app.js'), result.outputFiles[0].contents),
  writeFile(resolve(root, 'style.css'), minified)
]);
console.log(JSON.stringify({ event: 'app_bundle', javascript_bytes: result.outputFiles[0].contents.length, css_bytes: Buffer.byteLength(minified) }));
