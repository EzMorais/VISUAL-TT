const API_BASE = import.meta.env.VITE_API_URL || '/api';
const recent = new Map(); // message -> last-reported timestamp, avoids flooding on repeat errors

function report({ source = 'frontend', message, stack, context }) {
  if (!message) return;

  const key = `${source}:${message}`;
  const now = Date.now();
  if (recent.get(key) && now - recent.get(key) < 30_000) return; // throttle: once per 30s per unique error
  recent.set(key, now);

  fetch(`${API_BASE}/diagnostics/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, message, stack, context }),
  }).catch(() => { /* if reporting itself fails, there's nothing more to do */ });
}

function installGlobalHandlers() {
  window.addEventListener('error', (event) => {
    report({
      source: 'frontend',
      message: event.message || 'Erro desconhecido',
      stack: event.error?.stack,
      context: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    report({
      source: 'frontend',
      message: reason?.message || String(reason),
      stack: reason?.stack,
      context: 'unhandledrejection',
    });
  });
}

export default { report, installGlobalHandlers };
