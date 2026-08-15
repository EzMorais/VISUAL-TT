const router = require('express').Router();
const { getDB } = require('../db/database');
const { broadcast } = require('../services/realtime');
const { diagnoseError } = require('../services/ai');

router.get('/log', (req, res) => {
  const rows = getDB().prepare(`SELECT * FROM error_log ORDER BY created_at DESC LIMIT 50`).all();
  res.json(rows);
});

// POST /api/diagnostics/report — the frontend's global error handler (and
// any backend route) calls this when something breaks. It's logged right
// away and, if Claude is configured, a short diagnosis is attached and
// broadcast live to every connected device (shows up in the Terminal tab).
router.post('/report', async (req, res) => {
  const db = getDB();
  const { source = 'frontend', message, stack, context } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'message é obrigatório' });

  const r = db.prepare(
    `INSERT INTO error_log (source, message, stack, context) VALUES (?, ?, ?, ?)`
  ).run(source, message.trim(), stack || null, context || null);

  const entry = db.prepare(`SELECT * FROM error_log WHERE id = ?`).get(r.lastInsertRowid);
  broadcast('diagnostics:error', entry);
  res.status(201).json(entry);

  // Diagnose in the background so the report call itself stays fast.
  try {
    const diagnosis = await diagnoseError({ source, message, stack, context });
    if (diagnosis) {
      db.prepare(`UPDATE error_log SET diagnosis = ? WHERE id = ?`).run(diagnosis, entry.id);
      broadcast('diagnostics:diagnosed', { id: entry.id, diagnosis });
    }
  } catch (err) {
    console.error('Erro ao diagnosticar:', err.message);
  }
});

module.exports = router;
