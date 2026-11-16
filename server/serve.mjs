/**
 * Static site plus the Paint Sphere / Garden gulp friend room on /link.
 * python3 -m http.server cannot open that room.
 */
import { createHash } from 'node:crypto'
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { attachRelay } from './paint-link.mjs'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.csv': 'text/csv; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.mp4': 'video/mp4',
  '.m4a': 'audio/mp4',
  '.woff2': 'font/woff2'
}

// The same list the Docker image writes at build (see Dockerfile), so offline saving works here too.
const LISTED = ['sidecars', 'vendor', 'lib', 'app', 'logic', 'games', 'icons', 'voice', 'style.css', 'app.js', 'logic.mjs', 'sheet.csv', 'manifest.webmanifest']
const SKIP = /(^|\/)\.|\.md$|LICENSE|(^|\/)NOTICE$|\.test\.|\.map$|^sidecars\/field-guide-fishing\//
const stamps = new Map()  // path → { at, stamp }: a file is hashed again only when it changes
function offlineFiles() {
  const out = {}
  const add = (full) => {
    const path = relative(root, full).split(sep).join('/')
    if (SKIP.test(path)) return
    const info = statSync(full)
    if (info.isDirectory()) { for (const name of readdirSync(full)) add(join(full, name)); return }
    if (!info.isFile()) return
    const at = `${info.mtimeMs}-${info.size}`
    let known = stamps.get(path)
    if (known?.at !== at) {
      known = { at, stamp: `${createHash('sha1').update(readFileSync(full)).digest('hex').slice(0, 16)}-${info.size}` }
      stamps.set(path, known)
    }
    out[`./${path}`] = known.stamp
  }
  for (const name of LISTED) if (existsSync(join(root, name))) add(join(root, name))
  return out
}

const server = createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405)
    res.end()
    return
  }
  const url = new URL(req.url ?? '/', 'http://localhost')
  let asked = '/'
  try { asked = decodeURIComponent(url.pathname) } catch { asked = '/' }
  if (asked === '/offline-files.json') {
    res.writeHead(200, { 'Content-Type': types['.json'], 'Cache-Control': 'no-store' })
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify(offlineFiles()))
    return
  }
  let file = resolve(root, `.${asked}`)
  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403)
    res.end()
    return
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404)
    res.end()
    return
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  createReadStream(file).pipe(res)
})

attachRelay(server)
const port = Number(process.env.PORT) || 8000
server.listen(port, '127.0.0.1', () => {
  console.log(`Little Sprouts at http://127.0.0.1:${port}`)
})
