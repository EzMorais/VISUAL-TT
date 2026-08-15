const router = require('express').Router();
const { getEventsToday, getEventsTomorrow, formatEvent, createEvent, getAuthUrl, exchangeCode } = require('../services/calendar');

router.get('/today', async (req, res) => {
  try {
    const events = await getEventsToday();
    res.json(events.map(formatEvent));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tomorrow', async (req, res) => {
  try {
    const events = await getEventsTomorrow();
    res.json(events.map(formatEvent));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const event = await createEvent(req.body);
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Google OAuth setup helpers
router.get('/auth-url', (req, res) => {
  const url = getAuthUrl();
  if (!url) return res.status(400).json({ error: 'GOOGLE_CLIENT_ID não configurado' });
  res.json({ url });
});

router.post('/exchange-code', async (req, res) => {
  try {
    const tokens = await exchangeCode(req.body.code);
    res.json({ refresh_token: tokens.refresh_token, message: 'Copie o refresh_token para o .env' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
