const router = require('express').Router();
const { generateAndSendBriefing } = require('../services/briefing');
const { getDB } = require('../db/database');

router.get('/today', async (req, res) => {
  const db = getDB();
  const today = new Date().toISOString().split('T')[0];
  const row = db.prepare(`SELECT * FROM briefings WHERE date = ?`).get(today);
  if (row) return res.json(row);

  try {
    const content = await generateAndSendBriefing();
    res.json({ content, date: today });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const content = await generateAndSendBriefing();
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
