const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('../config');
const { getEventsToday, getEventsTomorrow, formatEvent } = require('./calendar');
const { chat } = require('./ai');
const { getDB } = require('../db/database');
const { broadcast } = require('./realtime');

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0);
const curMonth = () => new Date().toISOString().slice(0, 7);
const toAmount = (str) => parseFloat(String(str).replace(/\./g, '').replace(',', '.'));

let client;
let myNumber; // formato: "5511999999999@c.us"

function getClient() {
  return client;
}

async function sendMessage(text) {
  if (!client || !myNumber) return;
  try {
    await client.sendMessage(myNumber, text);
  } catch (err) {
    console.error('Erro WhatsApp sendMessage:', err.message);
  }
}

function normalizeNumber(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits + '@c.us';
}

function helpText() {
  return `🤖 *Personal OS — Comandos*

📅 *agenda* — Agenda de hoje
📅 *amanha* — Agenda de amanhã
📋 *briefing* — Briefing do dia
✅ *tarefas* — Tarefas pendentes
➕ *tarefa [título]* — Criar tarefa
⏰ *lembrar HH:MM mensagem* — Criar lembrete

💰 *saldo* — Saldo total
📊 *extrato* — Resumo financeiro do mês
➖ *gasto 50 mercado* — Registrar gasto
➕ *receita 1000 salário* — Registrar entrada
🎯 *metas* — Metas de economia

❓ *ajuda* — Esta mensagem

Qualquer outra mensagem → IA responde!`;
}

async function handleCommand(body) {
  const text = body.trim().toLowerCase();
  const db = getDB();

  if (text === 'agenda') {
    const events = (await getEventsToday()).map(formatEvent);
    if (!events.length) return '📅 Nenhum evento hoje.';
    return `📅 *Agenda de hoje*\n\n` +
      events.map(e => `⏰ *${e.timeStr}*\n   ${e.title}${e.location ? `\n   📍 ${e.location}` : ''}`).join('\n\n');
  }

  if (text === 'amanha') {
    const events = (await getEventsTomorrow()).map(formatEvent);
    if (!events.length) return '📅 Nenhum evento amanhã.';
    return `📅 *Agenda de amanhã*\n\n` +
      events.map(e => `⏰ *${e.timeStr}*\n   ${e.title}${e.location ? `\n   📍 ${e.location}` : ''}`).join('\n\n');
  }

  if (text === 'briefing') {
    const { generateAndSendBriefing } = require('./briefing');
    const content = await generateAndSendBriefing();
    return content ? null : '📋 Briefing já enviado hoje.'; // briefing sends itself
  }

  if (text === 'tarefas') {
    const tasks = db.prepare(
      `SELECT * FROM tasks WHERE status = 'pending' ORDER BY
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC`
    ).all();
    if (!tasks.length) return '✅ Nenhuma tarefa pendente!';
    const emoji = { high: '🔴', medium: '🟡', low: '🟢' };
    return `✅ *Tarefas pendentes*\n\n` +
      tasks.map((t, i) =>
        `${i + 1}. ${emoji[t.priority] || '⚪'} ${t.title}${t.due_date ? `\n   📅 ${t.due_date}` : ''}`
      ).join('\n\n');
  }

  const tarefaMatch = body.match(/^tarefa\s+(.+)/i);
  if (tarefaMatch) {
    const title = tarefaMatch[1].trim();
    const r = db.prepare(`INSERT INTO tasks (title, priority) VALUES (?, 'medium')`).run(title);
    broadcast('task:created', db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(r.lastInsertRowid));
    return `✅ Tarefa criada: *${title}* (#${r.lastInsertRowid})`;
  }

  const lembreteMatch = body.match(/^lembrar\s+(\d{1,2}:\d{2})\s+(.+)/i);
  if (lembreteMatch) {
    const time = lembreteMatch[1].padStart(5, '0');
    const message = lembreteMatch[2].trim();
    const today = new Date().toISOString().split('T')[0];
    const r = db.prepare(`INSERT INTO reminders (message, remind_at) VALUES (?, ?)`).run(message, `${today}T${time}:00`);
    broadcast('reminder:created', db.prepare(`SELECT * FROM reminders WHERE id = ?`).get(r.lastInsertRowid));
    return `⏰ Lembrete criado: "${message}" às ${time}`;
  }

  if (text === 'saldo') {
    const balance = db.prepare(`SELECT COALESCE(SUM(balance),0) AS v FROM accounts`).get().v;
    return `💰 Saldo total: *${fmt(balance)}*`;
  }

  if (text === 'extrato') {
    const month = curMonth();
    const income = db.prepare(`SELECT COALESCE(SUM(amount),0) AS v FROM transactions WHERE type='income' AND strftime('%Y-%m',date)=?`).get(month).v;
    const expense = db.prepare(`SELECT COALESCE(SUM(amount),0) AS v FROM transactions WHERE type='expense' AND strftime('%Y-%m',date)=?`).get(month).v;
    const cats = db.prepare(
      `SELECT category, SUM(amount) AS total FROM transactions
       WHERE type='expense' AND strftime('%Y-%m',date)=? GROUP BY category ORDER BY total DESC LIMIT 5`
    ).all(month);
    let out = `📊 *Resumo do mês*\n\n↑ Entradas: ${fmt(income)}\n↓ Saídas: ${fmt(expense)}\n= Resultado: ${fmt(income - expense)}`;
    if (cats.length) out += `\n\n*Top gastos:*\n` + cats.map(c => `  ${c.category}: ${fmt(c.total)}`).join('\n');
    return out;
  }

  if (text === 'metas') {
    const goals = db.prepare(`SELECT * FROM goals ORDER BY created_at DESC`).all();
    if (!goals.length) return '🎯 Nenhuma meta cadastrada ainda.';
    return `🎯 *Metas de economia*\n\n` + goals.map(g => {
      const pct = g.target_amount ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
      return `${g.name}\n  ${fmt(g.current_amount)} / ${fmt(g.target_amount)} (${pct}%)`;
    }).join('\n\n');
  }

  const gastoMatch = body.match(/^gast(?:ei|o)\s+([\d.,]+)\s+(?:com|em|de)?\s*(.+)/i);
  if (gastoMatch) {
    const amount = toAmount(gastoMatch[1]);
    const description = gastoMatch[2].trim();
    if (!amount || Number.isNaN(amount)) return '❌ Não entendi o valor. Ex: gasto 50 mercado';
    const r = db.prepare(`INSERT INTO transactions (type, amount, description, category, date) VALUES ('expense', ?, ?, 'outros', date('now'))`)
      .run(Math.abs(amount), description);
    broadcast('finance:transaction:created', db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(r.lastInsertRowid));
    return `➖ Gasto registrado: *${fmt(amount)}* — ${description}`;
  }

  const receitaMatch = body.match(/^receita\s+([\d.,]+)\s+(?:de|com)?\s*(.+)/i);
  if (receitaMatch) {
    const amount = toAmount(receitaMatch[1]);
    const description = receitaMatch[2].trim();
    if (!amount || Number.isNaN(amount)) return '❌ Não entendi o valor. Ex: receita 1000 salário';
    const r = db.prepare(`INSERT INTO transactions (type, amount, description, category, date) VALUES ('income', ?, ?, 'outros', date('now'))`)
      .run(Math.abs(amount), description);
    broadcast('finance:transaction:created', db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(r.lastInsertRowid));
    return `➕ Receita registrada: *${fmt(amount)}* — ${description}`;
  }

  if (text === 'ajuda' || text === 'help') {
    return helpText();
  }

  return null; // not a command → AI
}

async function initWhatsApp() {
  if (!config.WHATSAPP_PHONE) {
    console.log('⚠️  WHATSAPP_PHONE não configurado — bot desativado');
    return;
  }

  myNumber = normalizeNumber(config.WHATSAPP_PHONE);

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './data/whatsapp-session' }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    },
  });

  client.on('qr', (qr) => {
    console.log('\n📱 Escaneie o QR code abaixo com seu WhatsApp:\n');
    qrcode.generate(qr, { small: true });
    console.log('\nAbra o WhatsApp no iPhone → Configurações → Aparelhos Conectados → Conectar aparelho\n');
  });

  client.on('ready', async () => {
    console.log('✅ WhatsApp conectado!');
    await sendMessage('🤖 *Personal OS online!*\n\nDigite *ajuda* para ver os comandos.');
  });

  client.on('message', async (msg) => {
    // Only respond to messages from yourself (self-chat or your own number)
    const from = msg.from;
    const isFromMe = from === myNumber || msg.fromMe;
    if (!isFromMe) return;

    const body = msg.body || '';
    if (!body.trim()) return;

    try {
      const commandReply = await handleCommand(body);
      if (commandReply !== null) {
        await msg.reply(commandReply);
        return;
      }

      // AI fallback
      const aiReply = await chat(body, 'whatsapp');
      await msg.reply(aiReply);
    } catch (err) {
      console.error('Erro processando mensagem WhatsApp:', err.message);
      await msg.reply('❌ Erro ao processar. Tente novamente.');
    }
  });

  client.on('disconnected', (reason) => {
    console.log('WhatsApp desconectado:', reason);
  });

  await client.initialize();
}

module.exports = { initWhatsApp, sendMessage, getClient };
