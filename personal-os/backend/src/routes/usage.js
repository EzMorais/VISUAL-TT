const router = require('express').Router();
const { getDB } = require('../db/database');
const config = require('../config');

function estimateCost(inputTokens, outputTokens) {
  const { CLAUDE_INPUT_PRICE_PER_1M: inPrice, CLAUDE_OUTPUT_PRICE_PER_1M: outPrice } = config;
  if (!inPrice || !outPrice) return null;
  return (inputTokens / 1_000_000) * inPrice + (outputTokens / 1_000_000) * outPrice;
}

router.get('/summary', (req, res) => {
  const db = getDB();

  const today = db.prepare(
    `SELECT COALESCE(SUM(input_tokens),0) AS input, COALESCE(SUM(output_tokens),0) AS output
     FROM api_usage WHERE date(created_at) = date('now')`
  ).get();

  const month = db.prepare(
    `SELECT COALESCE(SUM(input_tokens),0) AS input, COALESCE(SUM(output_tokens),0) AS output
     FROM api_usage WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`
  ).get();

  const allTime = db.prepare(
    `SELECT COALESCE(SUM(input_tokens),0) AS input, COALESCE(SUM(output_tokens),0) AS output, COUNT(*) AS calls
     FROM api_usage`
  ).get();

  const byFeature = db.prepare(
    `SELECT feature, COUNT(*) AS calls, COALESCE(SUM(input_tokens),0) AS input, COALESCE(SUM(output_tokens),0) AS output
     FROM api_usage WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
     GROUP BY feature ORDER BY (input + output) DESC`
  ).all();

  res.json({
    today: { ...today, total: today.input + today.output, costEstimate: estimateCost(today.input, today.output) },
    month: { ...month, total: month.input + month.output, costEstimate: estimateCost(month.input, month.output) },
    allTime: { ...allTime, total: allTime.input + allTime.output },
    byFeature: byFeature.map((f) => ({ ...f, total: f.input + f.output })),
    pricingConfigured: !!(config.CLAUDE_INPUT_PRICE_PER_1M && config.CLAUDE_OUTPUT_PRICE_PER_1M),
  });
});

router.get('/daily', (req, res) => {
  const days = Math.min(60, parseInt(req.query.days, 10) || 14);
  const rows = getDB().prepare(
    `SELECT date(created_at) AS date,
            COALESCE(SUM(input_tokens),0) AS input,
            COALESCE(SUM(output_tokens),0) AS output
     FROM api_usage
     WHERE created_at >= datetime('now', ?)
     GROUP BY date(created_at)
     ORDER BY date ASC`
  ).all(`-${days} days`);

  // Fill in days with no calls so the chart doesn't have gaps.
  const byDate = Object.fromEntries(rows.map((r) => [r.date, r]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const row = byDate[key] || { input: 0, output: 0 };
    out.push({ date: key, input: row.input, output: row.output, total: row.input + row.output });
  }

  res.json(out);
});

module.exports = router;
