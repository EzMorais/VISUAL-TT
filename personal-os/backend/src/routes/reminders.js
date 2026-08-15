const router = require('express').Router();
const { getDB } = require('../db/database');
const { broadcast } = require('../services/realtime');

router.get('/', (req, res) => {
  const db = getDB();
  const rows = db.prepare(
    `SELECT * FROM reminders WHERE sent = 0 ORDER BY remind_at ASC`
  ).all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const db = getDB();
  const { message, remind_at } = req.body;
  if (!message?.trim() || !remind_at) return res.status(400).json({ error: 'message e remind_at obrigatórios' });

  const r = db.prepare(
    `INSERT INTO reminders (message, remind_at) VALUES (?, ?)`
  ).run(message.trim(), remind_at);

  const reminder = db.prepare(`SELECT * FROM reminders WHERE id = ?`).get(r.lastInsertRowid);
  broadcast('reminder:created', reminder);
  res.status(201).json(reminder);
});

router.delete('/:id', (req, res) => {
  getDB().prepare(`DELETE FROM reminders WHERE id = ?`).run(req.params.id);
  broadcast('reminder:deleted', { id: Number(req.params.id) });
  res.json({ success: true });
});

module.exports = router;
