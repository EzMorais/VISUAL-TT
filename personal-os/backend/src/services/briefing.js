const { getEventsToday, formatEvent } = require('./calendar');
const { generateBriefing } = require('./ai');
const { getDB } = require('../db/database');

let sendFn; // injected to avoid circular deps

function setSendFn(fn) {
  sendFn = fn;
}

async function generateAndSendBriefing() {
  const db = getDB();
  const today = new Date().toISOString().split('T')[0];

  const existing = db.prepare(`SELECT content FROM briefings WHERE date = ?`).get(today);
  if (existing) {
    if (sendFn) await sendFn(`📋 *Briefing de hoje*\n\n${existing.content}`);
    return existing.content;
  }

  const rawEvents = await getEventsToday();
  const events = rawEvents.map(formatEvent);

  const tasks = db.prepare(
    `SELECT * FROM tasks WHERE status = 'pending'
     ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
     LIMIT 10`
  ).all();

  const content = await generateBriefing({ events, tasks });

  db.prepare(`INSERT INTO briefings (content, date) VALUES (?, ?)`).run(content, today);

  if (sendFn) await sendFn(`📋 *Briefing do dia*\n\n${content}`);

  return content;
}

module.exports = { generateAndSendBriefing, setSendFn };
