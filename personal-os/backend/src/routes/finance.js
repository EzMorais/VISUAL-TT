const router = require('express').Router();
const { getDB } = require('../db/database');

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0);

const curMonth = () => new Date().toISOString().slice(0, 7);

// ── Summary ───────────────────────────────────────────────
router.get('/summary', (req, res) => {
  const db = getDB();
  const month = req.query.month || curMonth();

  const totalBalance = db.prepare(`SELECT COALESCE(SUM(balance), 0) AS v FROM accounts`).get().v;

  const monthIncome = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) AS v FROM transactions
     WHERE type = 'income' AND strftime('%Y-%m', date) = ?`
  ).get(month).v;

  const monthExpenses = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) AS v FROM transactions
     WHERE type = 'expense' AND strftime('%Y-%m', date) = ?`
  ).get(month).v;

  const byCategory = db.prepare(
    `SELECT category, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
     FROM transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = ?
     GROUP BY category ORDER BY total DESC`
  ).all(month);

  const goals = db.prepare(`SELECT * FROM goals ORDER BY created_at DESC`).all();

  const budgets = db.prepare(`SELECT * FROM budgets WHERE month = ?`).all(month);

  res.json({ totalBalance, monthIncome, monthExpenses, byCategory, goals, budgets, month });
});

// ── Transactions ──────────────────────────────────────────
router.get('/transactions', (req, res) => {
  const db = getDB();
  const { month, limit = 50, type } = req.query;
  const m = month || curMonth();

  let q = `SELECT * FROM transactions WHERE strftime('%Y-%m', date) = ?`;
  const params = [m];
  if (type) { q += ` AND type = ?`; params.push(type); }
  q += ` ORDER BY date DESC, created_at DESC LIMIT ?`;
  params.push(parseInt(limit));

  res.json(db.prepare(q).all(...params));
});

router.post('/transactions', (req, res) => {
  const db = getDB();
  const { type, amount, description, category = 'outros', date, account_id } = req.body;

  if (!type || !amount || !description) {
    return res.status(400).json({ error: 'type, amount e description são obrigatórios' });
  }

  const r = db.prepare(
    `INSERT INTO transactions (account_id, type, amount, description, category, date)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(account_id || null, type, Math.abs(parseFloat(amount)), description, category,
    date || new Date().toISOString().split('T')[0]);

  // Update account balance
  if (account_id) {
    const delta = type === 'income' ? Math.abs(amount) : -Math.abs(amount);
    db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ?`).run(delta, account_id);
  }

  res.status(201).json(db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(r.lastInsertRowid));
});

router.delete('/transactions/:id', (req, res) => {
  const db = getDB();
  const t = db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Não encontrado' });

  if (t.account_id) {
    const delta = t.type === 'income' ? -t.amount : t.amount;
    db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ?`).run(delta, t.account_id);
  }

  db.prepare(`DELETE FROM transactions WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

// ── Accounts ──────────────────────────────────────────────
router.get('/accounts', (req, res) => {
  res.json(getDB().prepare(`SELECT * FROM accounts ORDER BY created_at ASC`).all());
});

router.post('/accounts', (req, res) => {
  const db = getDB();
  const { name, type = 'checking', balance = 0, color = '#00e676' } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name obrigatório' });

  const r = db.prepare(
    `INSERT INTO accounts (name, type, balance, color) VALUES (?, ?, ?, ?)`
  ).run(name.trim(), type, parseFloat(balance), color);

  res.status(201).json(db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(r.lastInsertRowid));
});

router.put('/accounts/:id', (req, res) => {
  const db = getDB();
  const { name, balance, color } = req.body;
  db.prepare(
    `UPDATE accounts SET name = COALESCE(?, name), balance = COALESCE(?, balance),
     color = COALESCE(?, color) WHERE id = ?`
  ).run(name, balance !== undefined ? parseFloat(balance) : null, color, req.params.id);
  res.json(db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(req.params.id));
});

router.delete('/accounts/:id', (req, res) => {
  getDB().prepare(`DELETE FROM accounts WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

// ── Budgets ───────────────────────────────────────────────
router.get('/budgets', (req, res) => {
  const month = req.query.month || curMonth();
  res.json(getDB().prepare(`SELECT * FROM budgets WHERE month = ?`).all(month));
});

router.post('/budgets', (req, res) => {
  const db = getDB();
  const { category, limit_amount, month } = req.body;
  const m = month || curMonth();

  db.prepare(
    `INSERT INTO budgets (category, limit_amount, month) VALUES (?, ?, ?)
     ON CONFLICT(category, month) DO UPDATE SET limit_amount = excluded.limit_amount`
  ).run(category, parseFloat(limit_amount), m);

  res.json(db.prepare(`SELECT * FROM budgets WHERE category = ? AND month = ?`).get(category, m));
});

// ── Goals ─────────────────────────────────────────────────
router.get('/goals', (req, res) => {
  res.json(getDB().prepare(`SELECT * FROM goals ORDER BY created_at DESC`).all());
});

router.post('/goals', (req, res) => {
  const db = getDB();
  const { name, target_amount, current_amount = 0, deadline } = req.body;
  if (!name?.trim() || !target_amount) return res.status(400).json({ error: 'name e target_amount obrigatórios' });

  const r = db.prepare(
    `INSERT INTO goals (name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?)`
  ).run(name.trim(), parseFloat(target_amount), parseFloat(current_amount), deadline || null);

  res.status(201).json(db.prepare(`SELECT * FROM goals WHERE id = ?`).get(r.lastInsertRowid));
});

router.put('/goals/:id/add', (req, res) => {
  const db = getDB();
  const { amount } = req.body;
  db.prepare(`UPDATE goals SET current_amount = current_amount + ? WHERE id = ?`)
    .run(parseFloat(amount), req.params.id);
  res.json(db.prepare(`SELECT * FROM goals WHERE id = ?`).get(req.params.id));
});

router.delete('/goals/:id', (req, res) => {
  getDB().prepare(`DELETE FROM goals WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

// ── Text summary (for WhatsApp/voice) ────────────────────
router.get('/text-summary', (req, res) => {
  const db = getDB();
  const month = req.query.month || curMonth();

  const balance = db.prepare(`SELECT COALESCE(SUM(balance),0) AS v FROM accounts`).get().v;
  const income  = db.prepare(`SELECT COALESCE(SUM(amount),0) AS v FROM transactions WHERE type='income' AND strftime('%Y-%m',date)=?`).get(month).v;
  const expense = db.prepare(`SELECT COALESCE(SUM(amount),0) AS v FROM transactions WHERE type='expense' AND strftime('%Y-%m',date)=?`).get(month).v;

  const cats = db.prepare(
    `SELECT category, SUM(amount) AS total FROM transactions
     WHERE type='expense' AND strftime('%Y-%m',date)=?
     GROUP BY category ORDER BY total DESC LIMIT 5`
  ).all(month);

  let text = `💰 *Resumo Financeiro*\n\n`;
  text += `Saldo total: *${fmt(balance)}*\n`;
  text += `Mês atual:\n  ↑ Entradas: ${fmt(income)}\n  ↓ Saídas: ${fmt(expense)}\n  = Resultado: ${fmt(income - expense)}\n`;

  if (cats.length) {
    text += `\n📊 Top gastos:\n`;
    text += cats.map(c => `  ${c.category}: ${fmt(c.total)}`).join('\n');
  }

  res.json({ text });
});

module.exports = router;
