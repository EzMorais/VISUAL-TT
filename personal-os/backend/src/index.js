require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { initDB } = require('./db/database');
const { initWhatsApp, sendMessage } = require('./services/whatsapp');
const { setSendFn: setBriefingSend } = require('./services/briefing');
const { initScheduler, setSendFn: setSchedulerSend } = require('./services/scheduler');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use('/api/agenda', require('./routes/agenda'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/briefing', require('./routes/briefing'));

// Google OAuth callback page
app.get('/api/auth/google/callback', (req, res) => {
  const code = req.query.code || '';
  res.send(`
    <html><body style="font-family:monospace;padding:2rem;background:#0a0f0d;color:#00ff88">
    <h2>✅ Autorização recebida!</h2>
    <p>Código: <code style="color:#fff">${code}</code></p>
    <p>Cole este código na rota <b>POST /api/agenda/exchange-code</b> para obter o refresh_token.</p>
    </body></html>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toLocaleString('pt-BR', { timeZone: config.TIMEZONE }),
  });
});

async function start() {
  initDB();

  // Wire send function so briefing and scheduler can send WhatsApp messages
  setBriefingSend(sendMessage);
  setSchedulerSend(sendMessage);
  initScheduler();

  // WhatsApp starts last (shows QR code, may take time)
  await initWhatsApp();

  app.listen(config.PORT, () => {
    console.log(`\n🚀 Personal OS Backend: http://localhost:${config.PORT}`);
    console.log(`🌐 Frontend esperado em: ${config.FRONTEND_URL}`);
    console.log(`☀️  Briefing diário às ${config.BRIEFING_HOUR}:00 (${config.TIMEZONE})\n`);
  });
}

start().catch((err) => {
  console.error('Erro ao iniciar:', err);
  process.exit(1);
});
