const router = require('express').Router();
const { getDB } = require('../db/database');
const { chat } = require('../services/ai');
const { broadcast } = require('../services/realtime');

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0);
const curMonth = () => new Date().toISOString().slice(0, 7);

// Parses simple financial voice commands so Siri/voice doesn't need an AI round-trip
// for the most common actions (faster + works without ANTHROPIC_API_KEY too).
function parseFinanceCommand(text) {
  const t = text.trim().toLowerCase();

  if (/^saldo/.test(t)) return { kind: 'saldo' };
  if (/^(extrato|resumo financeiro|resumo)/.test(t)) return { kind: 'extrato' };

  let m = t.match(/^gast(ei|o)\s+([\d.,]+)\s+(?:com|em|de)?\s*(.+)/);
  if (m) return { kind: 'expense', amount: m[2], description: m[3].trim() };

  m = t.match(/^receb(i|imento)\s+([\d.,]+)\s+(?:de|com)?\s*(.+)/);
  if (m) return { kind: 'income', amount: m[2], description: m[3].trim() };

  m = t.match(/^(?:adicionar|criar)?\s*tarefa\s+(.+)/);
  if (m) return { kind: 'task', title: m[1].trim() };

  return null;
}

function toAmount(str) {
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

async function runFinanceCommand(cmd) {
  const db = getDB();

  if (cmd.kind === 'saldo') {
    const balance = db.prepare(`SELECT COALESCE(SUM(balance),0) AS v FROM accounts`).get().v;
    return `Seu saldo total é ${fmt(balance)}.`;
  }

  if (cmd.kind === 'extrato') {
    const month = curMonth();
    const income = db.prepare(`SELECT COALESCE(SUM(amount),0) AS v FROM transactions WHERE type='income' AND strftime('%Y-%m',date)=?`).get(month).v;
    const expense = db.prepare(`SELECT COALESCE(SUM(amount),0) AS v FROM transactions WHERE type='expense' AND strftime('%Y-%m',date)=?`).get(month).v;
    return `Este mês: entradas de ${fmt(income)} e saídas de ${fmt(expense)}. Resultado: ${fmt(income - expense)}.`;
  }

  if (cmd.kind === 'expense' || cmd.kind === 'income') {
    const amount = toAmount(cmd.amount);
    if (!amount || Number.isNaN(amount)) return 'Não entendi o valor. Pode repetir?';
    const r = db.prepare(
      `INSERT INTO transactions (type, amount, description, category, date) VALUES (?, ?, ?, 'outros', date('now'))`
    ).run(cmd.kind, Math.abs(amount), cmd.description || 'sem descrição');
    broadcast('finance:transaction:created', db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(r.lastInsertRowid));
    return cmd.kind === 'expense'
      ? `Registrado: gasto de ${fmt(amount)} com ${cmd.description}.`
      : `Registrado: recebimento de ${fmt(amount)} de ${cmd.description}.`;
  }

  if (cmd.kind === 'task') {
    const r = db.prepare(`INSERT INTO tasks (title, priority) VALUES (?, 'medium')`).run(cmd.title);
    broadcast('task:created', db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(r.lastInsertRowid));
    return `Tarefa criada: ${cmd.title}.`;
  }

  return null;
}

// POST /api/voice/command — used by the PWA mic button and by Siri Shortcuts.
// Body: { command: "gastei 50 com mercado" }
// Returns: { response: "..." } — plain text meant to be read aloud (Siri / TTS).
router.post('/command', async (req, res) => {
  const { command, sessionId = 'voice' } = req.body;
  if (!command || !command.trim()) {
    return res.status(400).json({ error: 'command é obrigatório' });
  }

  try {
    const financeCmd = parseFinanceCommand(command);
    if (financeCmd) {
      const response = await runFinanceCommand(financeCmd);
      if (response) return res.json({ response, source: 'finance' });
    }

    // Fallback to Claude for anything else (agenda, tarefas, perguntas gerais)
    const response = await chat(command, sessionId);
    res.json({ response, source: 'ai' });
  } catch (err) {
    console.error('Erro voice/command:', err.message);
    res.status(500).json({ response: 'Desculpe, não consegui processar o comando agora.' });
  }
});

module.exports = router;
