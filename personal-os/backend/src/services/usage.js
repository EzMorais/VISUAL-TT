const { getDB } = require('../db/database');

function recordUsage({ feature, model, inputTokens = 0, outputTokens = 0 }) {
  try {
    const db = getDB();
    db.prepare(
      `INSERT INTO api_usage (feature, model, input_tokens, output_tokens) VALUES (?, ?, ?, ?)`
    ).run(feature, model, inputTokens, outputTokens);

    // Broadcast lazily required to dodge a require cycle (realtime doesn't need usage).
    const { broadcast } = require('./realtime');
    broadcast('usage:recorded', { feature, inputTokens, outputTokens });
  } catch (err) {
    console.error('Erro ao registrar uso:', err.message);
  }
}

module.exports = { recordUsage };
