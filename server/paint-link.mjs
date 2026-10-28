/**
 * Pair two Paint Sphere browsers on /link.
 * The first socket owns the room. Everything else is forwarded.
 */
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
const MAX_BYTES = 1_000_000
const attached = new WeakSet()

export function attachRelay(httpServer) {
  if (attached.has(httpServer)) return
  attached.add(httpServer)
  const rooms = new Map()
  const seats = new WeakMap()

  httpServer.on('upgrade', (request, socket, head) => {
    const path = (request.url ?? '').split('?')[0]
    if (path !== '/link') return
    const peer = accept(request, socket, head)
    if (!peer) return
    peer.onMessage = (text) => onMessage(peer, text)
    peer.onClose = () => leave(peer)
  })

  function onMessage(peer, text) {
    let msg
    try {
      msg = JSON.parse(text)
    } catch {
      return
    }
    if (msg.t === 'create') {
      create(peer)
      return
    }
    if (msg.t === 'join') {
      join(peer, String(msg.room ?? ''))
      return
    }
    const seat = seats.get(peer)
    if (!seat) return
    const room = rooms.get(seat.room)
    if (!room) return
    const other = seat.role === 'host' ? room.guest : room.host
    if (other?.open) other.send(text)
  }

  function create(peer) {
    if (seats.has(peer)) return
    let code = ''
    for (let attempt = 0; attempt < 8; attempt++) {
      code = ''
      for (let i = 0; i < 4; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
      if (!rooms.has(code)) break
    }
    rooms.set(code, { host: peer })
    seats.set(peer, { role: 'host', room: code })
    peer.send(JSON.stringify({ t: 'welcome', role: 'host', room: code }))
  }

  function join(peer, code) {
    if (seats.has(peer)) return
    const room = rooms.get(code)
    if (!room?.host?.open) {
      peer.send(JSON.stringify({ t: 'missing' }))
      return
    }
    if (room.guest?.open) {
      peer.send(JSON.stringify({ t: 'full' }))
      return
    }
    room.guest = peer
    seats.set(peer, { role: 'guest', room: code })
    peer.send(JSON.stringify({ t: 'welcome', role: 'guest', room: code }))
    peer.send(JSON.stringify({ t: 'peer', here: true }))
    room.host.send(JSON.stringify({ t: 'peer', here: true }))
  }

  function leave(peer) {
    const seat = seats.get(peer)
    if (!seat) return
    seats.delete(peer)
    const room = rooms.get(seat.room)
    if (!room) return
    if (seat.role === 'host') {
      rooms.delete(seat.room)
      if (room.guest?.open) room.guest.send(JSON.stringify({ t: 'closed' }))
      room.guest?.close()
      return
    }
    if (room.guest === peer) room.guest = undefined
    if (room.host?.open) room.host.send(JSON.stringify({ t: 'peer', here: false }))
  }
}

function accept(request, socket, head) {
  const key = request.headers['sec-websocket-key']
  if (!key || request.headers.upgrade?.toLowerCase() !== 'websocket') {
    socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n')
    return null
  }
  const acceptKey = createHash('sha1').update(String(key) + GUID).digest('base64')
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${acceptKey}\r\n\r\n`
  )
  const peer = new Peer(socket)
  if (head?.length) peer.push(head)
  return peer
}

class Peer {
  constructor(socket) {
    this.socket = socket
    this.open = true
    this.done = false
    this.buf = Buffer.alloc(0)
    this.parts = []
    this.onMessage = () => {}
    this.onClose = () => {}
    socket.setNoDelay(true)
    socket.on('data', (chunk) => this.push(chunk))
    socket.on('close', () => this.finish())
    socket.on('error', () => this.finish())
  }

  push(chunk) {
    if (this.done) return
    this.buf = this.buf.length ? Buffer.concat([this.buf, chunk]) : chunk
    if (this.buf.length > MAX_BYTES) {
      this.close()
      return
    }
    this.drain()
  }

  drain() {
    while (this.open) {
      if (this.buf.length < 2) return
      const length = this.buf[1] & 0x7f
      let offset = 2
      let size = length
      if (length === 126) {
        if (this.buf.length < 4) return
        size = this.buf.readUInt16BE(2)
        offset = 4
      } else if (length === 127) {
        if (this.buf.length < 10) return
        const big = this.buf.readBigUInt64BE(2)
        if (big > BigInt(MAX_BYTES)) {
          this.close()
          return
        }
        size = Number(big)
        offset = 10
      }
      const masked = (this.buf[1] & 0x80) !== 0
      const maskAt = offset
      if (masked) offset += 4
      if (size > MAX_BYTES || this.buf.length < offset + size) {
        if (size > MAX_BYTES) this.close()
        return
      }
      let payload = this.buf.subarray(offset, offset + size)
      if (masked) {
        const mask = this.buf.subarray(maskAt, maskAt + 4)
        const copy = Buffer.alloc(size)
        for (let i = 0; i < size; i++) copy[i] = payload[i] ^ mask[i & 3]
        payload = copy
      }
      const opcode = this.buf[0] & 0x0f
      const fin = (this.buf[0] & 0x80) !== 0
      this.buf = this.buf.subarray(offset + size)
      if (opcode === 0x8) {
        this.close()
        return
      }
      if (opcode === 0x9) {
        this.frame(0xA, payload)
        continue
      }
      if (opcode === 0xA) continue
      if (opcode === 0x1 || opcode === 0x2 || opcode === 0) {
        if (opcode !== 0) this.parts = []
        this.parts.push(payload)
        if (!fin) continue
        const text = Buffer.concat(this.parts).toString('utf8')
        this.parts = []
        this.onMessage(text)
        continue
      }
      this.close()
      return
    }
  }

  send(text) {
    this.frame(0x1, Buffer.from(text))
  }

  frame(opcode, payload) {
    if (!this.open) return
    const size = payload.length
    let header
    if (size < 126) header = Buffer.from([0x80 | opcode, size])
    else if (size < 65536) header = Buffer.from([0x80 | opcode, 126, size >> 8, size & 255])
    else {
      header = Buffer.alloc(10)
      header[0] = 0x80 | opcode
      header[1] = 127
      header.writeBigUInt64BE(BigInt(size), 2)
    }
    this.socket.write(Buffer.concat([header, payload]))
  }

  close() {
    if (!this.open) return
    this.open = false
    try {
      this.socket.write(Buffer.from([0x88, 0x00]))
      this.socket.end()
    } catch { /* already gone */ }
    this.finish()
  }

  finish() {
    if (this.done) return
    this.done = true
    this.open = false
    this.onClose()
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const server = createServer((_req, res) => {
    res.writeHead(404)
    res.end()
  })
  attachRelay(server)
  const port = Number(process.env.PORT) || 5180
  server.listen(port, '0.0.0.0')
}
