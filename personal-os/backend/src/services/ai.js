const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const { getDB } = require('../db/database');
const memory = require('./memory');
const { recordUsage } = require('./usage');

const MODEL = 'claude-sonnet-4-6';
const FEATURE_BY_SESSION = { web: 'chat', whatsapp: 'whatsapp', voice: 'voice', terminal: 'terminal' };
const featureFor = (sessionId) => FEATURE_BY_SESSION[sessionId] || sessionId || 'chat';

let client;

function getClient() {
  if (!client && config.ANTHROPIC_API_KEY) {
    client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  }
  return client;
}

const SYSTEM_PROMPT = `Você é o assistente pessoal integrado ao Personal OS do usuário.
Você pode ajudar com organização, planejamento, tarefas, agenda e qualquer pergunta.
Seja objetivo e prático. Responda sempre em português brasileiro.
Use formatação simples — evite markdown complexo quando a resposta for para WhatsApp.
Data/hora atual: {{DATETIME}}`;

async function chat(message, sessionId = 'web') {
  const ai = getClient();
  if (!ai) throw new Error('ANTHROPIC_API_KEY não configurada');

  const db = getDB();

  const history = db.prepare(
    `SELECT role, content FROM chat_history WHERE session_id = ? ORDER BY created_at DESC LIMIT 20`
  ).all(sessionId).reverse();

  db.prepare(`INSERT INTO chat_history (role, content, session_id) VALUES (?, ?, ?)`).run('user', message, sessionId);

  const now = new Date().toLocaleString('pt-BR', { timeZone: config.TIMEZONE });
  const systemPrompt = SYSTEM_PROMPT.replace('{{DATETIME}}', now) + memory.renderForPrompt();

  const messages = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const response = await ai.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  });

  const reply = response.content[0].text;
  db.prepare(`INSERT INTO chat_history (role, content, session_id) VALUES (?, ?, ?)`).run('assistant', reply, sessionId);
  recordUsage({
    feature: featureFor(sessionId),
    model: MODEL,
    inputTokens: response.usage?.input_tokens,
    outputTokens: response.usage?.output_tokens,
  });

  return reply;
}

async function generateBriefing({ events, tasks }) {
  const ai = getClient();
  if (!ai) return 'Configure ANTHROPIC_API_KEY para ativar briefings com IA.';

  const now = new Date().toLocaleString('pt-BR', {
    timeZone: config.TIMEZONE,
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const eventsText = events.length
    ? events.map(e => `- ${e.timeStr}: ${e.title}${e.location ? ` (${e.location})` : ''}`).join('\n')
    : 'Nenhum evento agendado';

  const tasksText = tasks.length
    ? tasks.map(t => `- [${t.priority}] ${t.title}${t.due_date ? ` — vence: ${t.due_date}` : ''}`).join('\n')
    : 'Nenhuma tarefa pendente';

  const response = await ai.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: memory.renderForPrompt() || undefined,
    messages: [{
      role: 'user',
      content: `Crie um briefing matinal conciso para hoje, ${now}.

AGENDA:
${eventsText}

TAREFAS:
${tasksText}

Formato: saudação, resumo do dia, 3 prioridades, uma frase motivadora.
Seja direto, use emojis com moderação, máximo 250 palavras.`,
    }],
  });

  recordUsage({
    feature: 'briefing',
    model: MODEL,
    inputTokens: response.usage?.input_tokens,
    outputTokens: response.usage?.output_tokens,
  });

  return response.content[0].text;
}

// Streaming variant for the Terminal tab — yields text chunks as Claude
// generates them, so the reply appears live instead of all at once.
async function* chatStream(message, sessionId = 'terminal') {
  const ai = getClient();
  if (!ai) throw new Error('ANTHROPIC_API_KEY não configurada');

  const db = getDB();

  const history = db.prepare(
    `SELECT role, content FROM chat_history WHERE session_id = ? ORDER BY created_at DESC LIMIT 20`
  ).all(sessionId).reverse();

  db.prepare(`INSERT INTO chat_history (role, content, session_id) VALUES (?, ?, ?)`).run('user', message, sessionId);

  const now = new Date().toLocaleString('pt-BR', { timeZone: config.TIMEZONE });
  const systemPrompt = SYSTEM_PROMPT.replace('{{DATETIME}}', now) + memory.renderForPrompt();

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const stream = ai.messages.stream({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  });

  let full = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta?.text) {
      full += event.delta.text;
      yield event.delta.text;
    }
  }

  db.prepare(`INSERT INTO chat_history (role, content, session_id) VALUES (?, ?, ?)`).run('assistant', full, sessionId);

  try {
    const final = await stream.finalMessage();
    recordUsage({
      feature: featureFor(sessionId),
      model: MODEL,
      inputTokens: final.usage?.input_tokens,
      outputTokens: final.usage?.output_tokens,
    });
  } catch { /* usage tracking is best-effort, never break the stream over it */ }
}

// Short, single-shot diagnosis for an error captured in the app — not a
// conversation, just "what likely broke and how would you fix it".
async function diagnoseError({ source, message, stack, context }) {
  const ai = getClient();
  if (!ai) return null;

  const response = await ai.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Um erro aconteceu no app Personal OS (fonte: ${source}${context ? `, contexto: ${context}` : ''}).

Mensagem: ${message}
${stack ? `\nStack:\n${stack.slice(0, 1500)}` : ''}

Em no máximo 3 frases, explique a causa provável e o que fazer para corrigir.
Seja direto e prático, sem rodeios. Responda em português.`,
    }],
  });

  recordUsage({
    feature: 'diagnostics',
    model: MODEL,
    inputTokens: response.usage?.input_tokens,
    outputTokens: response.usage?.output_tokens,
  });

  return response.content[0].text;
}

module.exports = { chat, chatStream, generateBriefing, diagnoseError };
