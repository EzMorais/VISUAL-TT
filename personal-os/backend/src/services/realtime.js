const { WebSocketServer, WebSocket } = require('ws');

let wss = null;

function initRealtime(server, { version } = {}) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    socket.isAlive = true;
    socket.on('pong', () => { socket.isAlive = true; });
    send(socket, 'connected', { version });
  });

  // Drop dead connections (phone locked, wifi dropped, etc.)
  const heartbeat = setInterval(() => {
    wss.clients.forEach((socket) => {
      if (socket.isAlive === false) return socket.terminate();
      socket.isAlive = false;
      socket.ping();
    });
  }, 30_000);

  wss.on('close', () => clearInterval(heartbeat));

  return wss;
}

function send(socket, type, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type, payload, ts: Date.now() }));
}

// Broadcasts an event to every connected client (PC dashboard + every phone).
function broadcast(type, payload) {
  if (!wss) return;
  const msg = JSON.stringify({ type, payload, ts: Date.now() });
  wss.clients.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(msg);
  });
}

module.exports = { initRealtime, broadcast };
