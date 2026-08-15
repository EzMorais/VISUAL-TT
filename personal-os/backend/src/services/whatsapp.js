const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('../config');
const { getEventsToday, getEventsTomorrow, formatEvent } = require('./calendar');
const { chat } = require('./ai');
const { getDB } = require('../db/database');

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
    return `✅ Tarefa criada: *${title}* (#${r.lastInsertRowid})`;
  }

  const lembreteMatch = body.match(/^lembrar\s+(\d{1,2}:\d{2})\s+(.+)/i);
  if (lembreteMatch) {
    const time = lembreteMatch[1].padStart(5, '0');
    const message = lembreteMatch[2].trim();
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`INSERT INTO reminders (message, remind_at) VALUES (?, ?)`).run(message, `${today}T${time}:00`);
    return `⏰ Lembrete criado: "${message}" às ${time}`;
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
