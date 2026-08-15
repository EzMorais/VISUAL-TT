// Real-time channel shared by the PC dashboard and every phone connected to
// the same Personal OS backend — a change made on one screen shows up on the
// others instantly, without waiting for the next poll.

const listeners = new Map();
let socket = null;
let reconnectDelay = 1000;
let reconnectTimer = null;
let status = 'connecting';

function wsUrl() {
  const apiUrl = import.meta.env.VITE_API_URL;
  let host = window.location.host;
  let secure = window.location.protocol === 'https:';

  if (apiUrl) {
    try {
      const u = new URL(apiUrl);
      host = u.host;
      secure = u.protocol === 'https:';
    } catch { /* fall back to current origin */ }
  }

  return `${secure ? 'wss' : 'ws'}://${host}/ws`;
}

function setStatus(next) {
  status = next;
  emit('_status', next);
}

function connect() {
  clearTimeout(reconnectTimer);
  try {
    socket = new WebSocket(wsUrl());
  } catch {
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    reconnectDelay = 1000;
    setStatus('online');
  };

  socket.onclose = () => {
    setStatus('offline');
    scheduleReconnect();
  };

  socket.onerror = () => socket.close();

  socket.onmessage = (event) => {
    try {
      const { type, payload } = JSON.parse(event.data);
      emit(type, payload);
    } catch { /* ignore malformed frames */ }
  };
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connect, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 1.6, 15_000);
}

function emit(type, payload) {
  listeners.get(type)?.forEach((cb) => cb(payload));
  listeners.get('*')?.forEach((cb) => cb({ type, payload }));
}

// Subscribe to an event type ('task:created', 'finance:transaction:created', ...)
// or '*' for every event. Returns an unsubscribe function.
function on(type, cb) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(cb);
  return () => listeners.get(type)?.delete(cb);
}

function getStatus() {
  return status;
}

// Handy for panels that just want "something in category X changed, reload".
function onPrefix(prefix, cb) {
  return on('*', ({ type, payload }) => {
    if (type.startsWith(prefix)) cb(payload, type);
  });
}

if (typeof window !== 'undefined') {
  connect();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (!socket || socket.readyState !== WebSocket.OPEN)) {
      connect();
    }
  });
}

export default { on, onPrefix, getStatus };
