/* Paint Sphere opens friend rooms on /link. A plain file server has no room,
   so a failed same-host connection tries the room process on port 5180. */
const NativeSocket = WebSocket
const ROOM_PORT = '5180'

function roomFallback(url) {
  let parsed
  try { parsed = new URL(url) } catch { return '' }
  if (parsed.pathname !== '/link' || parsed.port === ROOM_PORT) return ''
  parsed.port = ROOM_PORT
  return parsed.href
}

function RoomSocket(url, protocols) {
  const next = roomFallback(url)
  if (!next) return new NativeSocket(url, protocols)
  return new RoomFallback(url, next)
}

RoomSocket.CONNECTING = NativeSocket.CONNECTING
RoomSocket.OPEN = NativeSocket.OPEN
RoomSocket.CLOSING = NativeSocket.CLOSING
RoomSocket.CLOSED = NativeSocket.CLOSED

class RoomFallback extends EventTarget {
  constructor(primary, fallback) {
    super()
    this.readyState = NativeSocket.CONNECTING
    this._socket = null
    this._opened = false
    this._userClosed = false
    this._attempt(primary, fallback)
  }

  send(data) {
    this._socket?.send(data)
  }

  close() {
    this._userClosed = true
    this.readyState = NativeSocket.CLOSING
    if (this._socket) this._socket.close()
    else this._finish()
  }

  _attempt(url, next) {
    if (this._userClosed) return
    const socket = new NativeSocket(url)
    let settled = false
    const giveUp = () => {
      if (settled || this._opened) return
      settled = true
      if (this._userClosed || !next) this._finish()
      else this._attempt(next, '')
    }
    socket.addEventListener('error', giveUp)
    socket.addEventListener('close', giveUp)
    socket.addEventListener('open', () => {
      if (settled || this._userClosed) {
        socket.close()
        return
      }
      settled = true
      this._opened = true
      this._socket = socket
      this.readyState = NativeSocket.OPEN
      socket.addEventListener('message', (event) => {
        this.dispatchEvent(new MessageEvent('message', { data: event.data }))
      })
      socket.addEventListener('close', () => this._finish())
      this.dispatchEvent(new Event('open'))
    })
  }

  _finish() {
    if (this.readyState === NativeSocket.CLOSED) return
    this.readyState = NativeSocket.CLOSED
    this.dispatchEvent(new CloseEvent('close'))
  }
}

window.WebSocket = RoomSocket
