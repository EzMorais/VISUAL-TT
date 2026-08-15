const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const { getDB } = require('../db/database');

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
  const systemPrompt = SYSTEM_PROMPT.replace('{{DATETIME}}', now);

  const messages = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const response = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  });

  const reply = response.content[0].text;
  db.prepare(`INSERT INTO chat_history (role, content, session_id) VALUES (?, ?, ?)`).run('assistant', reply, sessionId);

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
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
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

  return response.content[0].text;
}

module.exports = { chat, generateBriefing };
