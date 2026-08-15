const router = require('express').Router();
const { getDB } = require('../db/database');
const { broadcast } = require('../services/realtime');

router.get('/', (req, res) => {
  const db = getDB();
  const { status = 'pending' } = req.query;
  const tasks = db.prepare(
    `SELECT * FROM tasks WHERE status = ?
     ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC`
  ).all(status);
  res.json(tasks);
});

router.post('/', (req, res) => {
  const db = getDB();
  const { title, description = '', priority = 'medium', due_date = null } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Título obrigatório' });

  const r = db.prepare(
    `INSERT INTO tasks (title, description, priority, due_date) VALUES (?, ?, ?, ?)`
  ).run(title.trim(), description, priority, due_date);

  const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(r.lastInsertRowid);
  broadcast('task:created', task);
  res.status(201).json(task);
});

router.put('/:id', (req, res) => {
  const db = getDB();
  const { title, description, priority, status, due_date } = req.body;

  db.prepare(
    `UPDATE tasks SET
     title = COALESCE(?, title),
     description = COALESCE(?, description),
     priority = COALESCE(?, priority),
     status = COALESCE(?, status),
     due_date = COALESCE(?, due_date),
     updated_at = datetime('now')
     WHERE id = ?`
  ).run(title, description, priority, status, due_date, req.params.id);

  const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(req.params.id);
  broadcast('task:updated', task);
  res.json(task);
});

router.delete('/:id', (req, res) => {
  getDB().prepare(`DELETE FROM tasks WHERE id = ?`).run(req.params.id);
  broadcast('task:deleted', { id: Number(req.params.id) });
  res.json({ success: true });
});

module.exports = router;
