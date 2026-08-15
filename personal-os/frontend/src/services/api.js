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

export const finance = {
  summary: (month) => req(`/finance/summary${month ? `?month=${month}` : ''}`),
  transactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/finance/transactions${qs ? `?${qs}` : ''}`);
  },
  createTransaction: (data) => req('/finance/transactions', { method: 'POST', body: data }),
  removeTransaction: (id) => req(`/finance/transactions/${id}`, { method: 'DELETE' }),
  accounts: () => req('/finance/accounts'),
  createAccount: (data) => req('/finance/accounts', { method: 'POST', body: data }),
  updateAccount: (id, data) => req(`/finance/accounts/${id}`, { method: 'PUT', body: data }),
  removeAccount: (id) => req(`/finance/accounts/${id}`, { method: 'DELETE' }),
  budgets: (month) => req(`/finance/budgets${month ? `?month=${month}` : ''}`),
  createBudget: (data) => req('/finance/budgets', { method: 'POST', body: data }),
  goals: () => req('/finance/goals'),
  createGoal: (data) => req('/finance/goals', { method: 'POST', body: data }),
  addToGoal: (id, amount) => req(`/finance/goals/${id}/add`, { method: 'PUT', body: { amount } }),
  removeGoal: (id) => req(`/finance/goals/${id}`, { method: 'DELETE' }),
  textSummary: () => req('/finance/text-summary'),
};

export const voice = {
  command: (command, sessionId = 'voice') => req('/voice/command', { method: 'POST', body: { command, sessionId } }),
};

export const terminal = {
  history: (sessionId = 'terminal') => req(`/terminal/history?sessionId=${sessionId}`),
  clearHistory: (sessionId = 'terminal') => req(`/terminal/history?sessionId=${sessionId}`, { method: 'DELETE' }),
  // Server-Sent Events over a POST body — fetch's streaming reader instead of
  // EventSource (which can't send a POST body). Calls onChunk as text arrives,
  // onDone when the reply is complete, onError if the stream fails.
  async streamCommand(command, sessionId, { onChunk, onDone, onError }) {
    try {
      const res = await fetch(`${BASE}/terminal/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, sessionId }),
      });
      if (!res.ok || !res.body) throw new Error('Falha ao conectar ao terminal');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop(); // last chunk may be incomplete

        for (const raw of events) {
          const eventLine = raw.split('\n').find((l) => l.startsWith('event: '));
          const dataLine = raw.split('\n').find((l) => l.startsWith('data: '));
          if (!eventLine || !dataLine) continue;
          const type = eventLine.slice(7).trim();
          const data = JSON.parse(dataLine.slice(6));

          if (type === 'chunk') onChunk?.(data.text);
          if (type === 'done') onDone?.();
          if (type === 'error') onError?.(data.message);
        }
      }
    } catch (err) {
      onError?.(err.message);
    }
  },
};

export const diagnostics = {
  log: () => req('/diagnostics/log'),
};

export const usage = {
  summary: () => req('/usage/summary'),
  daily: (days = 14) => req(`/usage/daily?days=${days}`),
};

export const health = {
  check: () => req('/health'),
};
