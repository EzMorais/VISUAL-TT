const router = require('express').Router();
const { chat } = require('../services/ai');
const { getDB } = require('../db/database');

router.post('/chat', async (req, res) => {
  const { message, sessionId = 'web' } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Mensagem obrigatória' });

  try {
    const response = await chat(message, sessionId);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', (req, res) => {
  const { sessionId = 'web', limit = 100 } = req.query;
  const history = getDB().prepare(
    `SELECT id, role, content, created_at FROM chat_history WHERE session_id = ? ORDER BY created_at ASC LIMIT ?`
  ).all(sessionId, parseInt(limit));
  res.json(history);
});

router.delete('/history', (req, res) => {
  const { sessionId = 'web' } = req.query;
  getDB().prepare(`DELETE FROM chat_history WHERE session_id = ?`).run(sessionId);
  res.json({ success: true });
});

module.exports = router;
