const BASE = import.meta.env.VITE_API_URL || '/api';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Erro na requisição');
  }
  return res.json();
}

export const agenda = {
  today: () => req('/agenda/today'),
  tomorrow: () => req('/agenda/tomorrow'),
  create: (data) => req('/agenda', { method: 'POST', body: data }),
};

export const tasks = {
  list: (status = 'pending') => req(`/tasks?status=${status}`),
  create: (data) => req('/tasks', { method: 'POST', body: data }),
  update: (id, data) => req(`/tasks/${id}`, { method: 'PUT', body: data }),
  remove: (id) => req(`/tasks/${id}`, { method: 'DELETE' }),
};

export const ai = {
  chat: (message, sessionId = 'web') => req('/ai/chat', { method: 'POST', body: { message, sessionId } }),
  history: (sessionId = 'web') => req(`/ai/history?sessionId=${sessionId}`),
  clear: (sessionId = 'web') => req(`/ai/history?sessionId=${sessionId}`, { method: 'DELETE' }),
};

export const briefing = {
  today: () => req('/briefing/today'),
  generate: () => req('/briefing/generate', { method: 'POST' }),
};

export const health = {
  check: () => req('/health'),
};
