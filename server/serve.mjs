/**
 * Static site plus the Paint Sphere friend room on /link.
 * python3 -m http.server cannot open that room.
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { attachRelay } from './paint-link.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
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

const server = createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405)
    res.end()
    return
  }
  const url = new URL(req.url ?? '/', 'http://localhost')
  let asked = '/'
  try { asked = decodeURIComponent(url.pathname) } catch { asked = '/' }
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
