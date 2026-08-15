const cron = require('node-cron');
const config = require('../config');
const { generateAndSendBriefing } = require('./briefing');
const { getUpcoming, formatEvent } = require('./calendar');
const { getDB } = require('../db/database');

let sendFn;

function setSendFn(fn) {
  sendFn = fn;
}

function initScheduler() {
  // Briefing matinal
  cron.schedule(`0 ${config.BRIEFING_HOUR} * * *`, async () => {
    console.log('⏰ Enviando briefing matinal...');
    await generateAndSendBriefing();
  }, { timezone: config.TIMEZONE });

  // Avisos de compromissos a cada 5 min
  cron.schedule('*/5 * * * *', async () => {
    if (!sendFn) return;
    try {
      const events = await getUpcoming(16);
      for (const ev of events) {
        const f = formatEvent(ev);
        const minutesUntil = Math.round((new Date(f.start) - Date.now()) / 60_000);
        if (minutesUntil >= 1 && minutesUntil <= 15) {
          await sendFn(
            `⏰ *Lembrete*\n\n*${f.title}* em ${minutesUntil} min\n🕐 ${f.timeStr}${f.location ? `\n📍 ${f.location}` : ''}`
          );
        }
      }
    } catch (err) {
      console.error('Erro scheduler eventos:', err.message);
    }
  });

  // Lembretes customizados a cada minuto
  cron.schedule('* * * * *', async () => {
    if (!sendFn) return;
    const db = getDB();
    const now = new Date().toISOString().slice(0, 16);

    const rows = db.prepare(
      `SELECT * FROM reminders WHERE sent = 0 AND remind_at <= ?`
    ).all(now + ':59');

    for (const r of rows) {
      await sendFn(`🔔 *Lembrete*\n\n${r.message}`);
      db.prepare(`UPDATE reminders SET sent = 1 WHERE id = ?`).run(r.id);
    }
  });

  console.log('✅ Scheduler iniciado');
}

module.exports = { initScheduler, setSendFn };
