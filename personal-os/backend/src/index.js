require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const http = require('http');
const config = require('./config');
const { initDB } = require('./db/database');
const { initWhatsApp, sendMessage } = require('./services/whatsapp');
const { setSendFn: setBriefingSend } = require('./services/briefing');
const { initScheduler, setSendFn: setSchedulerSend } = require('./services/scheduler');
const { initRealtime } = require('./services/realtime');

const VERSION = require('../package.json').version;

const app = express();
const server = http.createServer(app);

// Tailscale handles network-layer auth; allow any origin so the PWA works
// regardless of which Tailscale IP the iPhone uses to reach this machine.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/agenda',    require('./routes/agenda'));
app.use('/api/tasks',     require('./routes/tasks'));
app.use('/api/ai',        require('./routes/ai'));
app.use('/api/briefing',  require('./routes/briefing'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/finance',   require('./routes/finance'));
app.use('/api/voice',     require('./routes/voice'));
app.use('/api/terminal',  require('./routes/terminal'));
app.use('/api/diagnostics', require('./routes/diagnostics'));
app.use('/api/usage',     require('./routes/usage'));

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

app.get('/api/version', (req, res) => {
  res.json({ version: VERSION });
});

// Serve built React frontend (Tailscale / production mode)
const PUBLIC_DIR = path.join(__dirname, '../public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  // SPA fallback — all non-API routes serve index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });
}

// Global error handler — any route that throws lands here instead of
// crashing silently. Logged + diagnosed the same way frontend errors are,
// so the Terminal tab becomes a single place to see what broke anywhere.
app.use((err, req, res, next) => {
  console.error(`Erro em ${req.method} ${req.path}:`, err.message);
  try {
    const { getDB } = require('./db/database');
    const { broadcast } = require('./services/realtime');
    const { diagnoseError } = require('./services/ai');
    const db = getDB();
    const r = db.prepare(
      `INSERT INTO error_log (source, message, stack, context) VALUES ('backend', ?, ?, ?)`
    ).run(err.message, err.stack || null, `${req.method} ${req.path}`);
    const entry = db.prepare(`SELECT * FROM error_log WHERE id = ?`).get(r.lastInsertRowid);
    broadcast('diagnostics:error', entry);
    diagnoseError({ source: 'backend', message: err.message, stack: err.stack, context: `${req.method} ${req.path}` })
      .then((diagnosis) => {
        if (!diagnosis) return;
        db.prepare(`UPDATE error_log SET diagnosis = ? WHERE id = ?`).run(diagnosis, entry.id);
        broadcast('diagnostics:diagnosed', { id: entry.id, diagnosis });
      })
      .catch(() => {});
  } catch { /* logging must never itself crash the app */ }

  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Erro interno' });
});

async function start() {
  initDB();

  // Wire send function so briefing and scheduler can send WhatsApp messages
  setBriefingSend(sendMessage);
  setSchedulerSend(sendMessage);
  initScheduler();

  // Real-time channel: every connected PC dashboard and phone gets pushed
  // updates the instant something changes, instead of waiting on polling.
  initRealtime(server, { version: VERSION });

  // WhatsApp starts last (shows QR code, may take time)
  await initWhatsApp();

  // Bind to 0.0.0.0 so Tailscale (and local network) can reach this server
  server.listen(config.PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Personal OS: http://localhost:${config.PORT}`);
    if (config.TAILSCALE_IP) {
      console.log(`🔒 Tailscale:    http://${config.TAILSCALE_IP}:${config.PORT}`);
    }
    console.log(`📡 Tempo real:   ws://localhost:${config.PORT}/ws`);
    console.log(`☀️  Briefing diário às ${config.BRIEFING_HOUR}:00 (${config.TIMEZONE})\n`);
  });
}

start().catch((err) => {
  console.error('Erro ao iniciar:', err);
  process.exit(1);
});
