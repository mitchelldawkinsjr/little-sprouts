/* Friend rooms (Paint Sphere, Garden gulp). The game opens a WebSocket to /link; this hands
   it a stand-in that lib/friend-link.mjs fills: the relay when the internet is up (with a
   direct connection once both are in), or a sound / QR handshake on the same Wi-Fi when it
   is down. Every other WebSocket is left alone. This copy matches sidecars/gulp/link.js. */
(function () {
  var Native = window.WebSocket;
  var LINK = '/lib/friend-link.mjs?v=friend1';

  function isRoom(url) {
    try { return new URL(url, location.href).pathname === '/link'; } catch (e) { return false; }
  }

  function RoomSocket(url, protocols) {
    if (!isRoom(url) || typeof EventTarget !== 'function') return new Native(url, protocols);
    var stand = new EventTarget();
    var room = null;
    var queue = [];
    var closeEarly = false;
    stand.url = String(url);
    stand.readyState = 0;
    stand.send = function (data) { if (room) room.send(data); else queue.push(data); };
    stand.close = function () { if (room) room.close(); else closeEarly = true; };
    import(LINK).then(function (mod) {
      room = mod.openRoom(String(url), stand, Native);
      queue.splice(0).forEach(function (data) { room.send(data); });
      if (closeEarly) room.close();
    }).catch(function () {
      stand.readyState = 3;
      stand.dispatchEvent(new CloseEvent('close'));
    });
    return stand;
  }

  RoomSocket.CONNECTING = 0;
  RoomSocket.OPEN = 1;
  RoomSocket.CLOSING = 2;
  RoomSocket.CLOSED = 3;
  window.WebSocket = RoomSocket;
})();
