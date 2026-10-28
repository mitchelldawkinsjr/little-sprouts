import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { createServer } from 'node:http'
import net from 'node:net'
import { describe, it } from 'node:test'
import { attachRelay } from './paint-link.mjs'

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

describe('paint link', () => {
  it('gives the first browser the room and forwards to the second', async () => {
    const http = createServer()
    attachRelay(http)
    await new Promise((resolve) => http.listen(0, '127.0.0.1', resolve))
    const address = http.address()
    const url = `ws://127.0.0.1:${address.port}/link`
    try {
      const host = await openSocket(url)
      host.send(JSON.stringify({ t: 'create' }))
      const welcome = JSON.parse(await host.next())
      assert.equal(welcome.t, 'welcome')
      assert.equal(welcome.role, 'host')
      assert.equal(welcome.room.length, 4)

      const guest = await openSocket(url)
      guest.send(JSON.stringify({ t: 'join', room: welcome.room }))
      const joined = JSON.parse(await guest.next())
      assert.equal(joined.role, 'guest')
      const guestPeer = JSON.parse(await guest.next())
      assert.equal(guestPeer.here, true)
      const hostPeer = JSON.parse(await host.next())
      assert.equal(hostPeer.t, 'peer')
      assert.equal(hostPeer.here, true)

      guest.send(JSON.stringify({ t: 'input', seq: 3 }))
      const forwarded = JSON.parse(await host.next())
      assert.equal(forwarded.t, 'input')
      assert.equal(forwarded.seq, 3)

      host.close()
      const closed = JSON.parse(await guest.next())
      assert.equal(closed.t, 'closed')
      guest.close()
    } finally {
      await new Promise((resolve) => http.close(() => resolve()))
    }
  })

  it('refuses a room that is not open', async () => {
    const http = createServer()
    attachRelay(http)
    await new Promise((resolve) => http.listen(0, '127.0.0.1', resolve))
    const address = http.address()
    try {
      const guest = await openSocket(`ws://127.0.0.1:${address.port}/link`)
      guest.send(JSON.stringify({ t: 'join', room: 'none' }))
      const note = JSON.parse(await guest.next())
      assert.equal(note.t, 'missing')
      guest.close()
    } finally {
      await new Promise((resolve) => http.close(() => resolve()))
    }
  })
})

function openSocket(url) {
  const parsed = new URL(url)
  const key = randomBytes(16).toString('base64')
  const socket = net.connect(Number(parsed.port), parsed.hostname)
  const expected = createHash('sha1').update(key + GUID).digest('base64')
  socket.write(
    `GET ${parsed.pathname} HTTP/1.1\r\n` +
    `Host: ${parsed.host}\r\n` +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Key: ${key}\r\n` +
    'Sec-WebSocket-Version: 13\r\n\r\n'
  )
  const messages = []
  const waiters = []
  let buf = Buffer.alloc(0)
  let ready = false
  const client = {
    send(text) {
      const payload = Buffer.from(text)
      const mask = randomBytes(4)
      const masked = Buffer.alloc(payload.length)
      for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i & 3]
      const header = Buffer.alloc(6)
      header[0] = 0x81
      header[1] = 0x80 | payload.length
      mask.copy(header, 2)
      socket.write(Buffer.concat([header, masked]))
    },
    close() {
      socket.write(Buffer.from([0x88, 0x80, 0, 0, 0, 0]))
      socket.end()
    },
    next() {
      if (messages.length) return Promise.resolve(messages.shift())
      return new Promise((resolve, reject) => {
        waiters.push(resolve)
        socket.once('close', () => reject(new Error('socket closed')))
      })
    }
  }
  return new Promise((resolve, reject) => {
    socket.on('error', reject)
    socket.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk])
      if (!ready) {
        const sep = buf.indexOf('\r\n\r\n')
        if (sep < 0) return
        const head = buf.subarray(0, sep).toString()
        if (!head.includes('101') || !head.includes(expected)) {
          reject(new Error(head))
          return
        }
        buf = buf.subarray(sep + 4)
        ready = true
        resolve(client)
      }
      while (buf.length >= 2) {
        const size = buf[1] & 0x7f
        if (buf.length < 2 + size) return
        const opcode = buf[0] & 0x0f
        const payload = buf.subarray(2, 2 + size).toString('utf8')
        buf = buf.subarray(2 + size)
        if (opcode !== 0x1) continue
        const waiter = waiters.shift()
        if (waiter) waiter(payload)
        else messages.push(payload)
      }
    })
    once(socket, 'connect').catch(reject)
  })
}
